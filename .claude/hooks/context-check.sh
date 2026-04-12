#!/bin/bash
# Pre-tool-use hook — Harness enforcement point
# Fires before every Bash, Edit, Write, Agent call
#
# Enforces:
#   1. Context freshness (advisory — warns if >4 hours stale)
#   2. Sprint sequence (reads executionSteps from sprints.json, blocks if Ghost gate pending)
#   3. Ghost messages (blocks if unacknowledged BLOCK directives)
#   4. Audit logging (writes every tool call to workflow-audit.log)

# Sub-agents skip context enforcement — this hook governs the orchestrator only
if [ -n "${CLAUDE_AGENT_DEPTH:-}" ] && [ "${CLAUDE_AGENT_DEPTH:-0}" -gt 0 ]; then
  exit 0
fi

APP_DIR="/home/ubuntu/Claude-store/nexxus2.2_replit"
MEMORY_DIR="$HOME/.claude/projects/-home-ubuntu-Claude-store-nexxus2-2-replit/memory"
CONTEXT_FILE="$MEMORY_DIR/context.md"
SPRINTS_FILE="$APP_DIR/sprints.json"
GHOST_MESSAGES="$APP_DIR/.governor/ghost/ghost_messages.json"
MAX_STALE_SECONDS=14400  # 4 hours

# Read tool input from stdin
STDIN_DATA=$(cat)

# Extract tool name from stdin JSON (same method as captain-check.sh)
TOOL_NAME=$(echo "$STDIN_DATA" | jq -r '.tool_name // empty' 2>/dev/null)
if [ -z "$TOOL_NAME" ]; then
  # Fallback to env var if jq parsing fails
  TOOL_NAME="${CLAUDE_TOOL_NAME:-}"
fi

# Detect if this is a read-only operation (don't block reads)
IS_READ_ONLY=0
case "$TOOL_NAME" in
  Read|Glob|Grep) IS_READ_ONLY=1 ;;
esac

SPRINT_ID=""
STEP_NUM=""

echo "--- CONTEXT CHECK (automated hook) ---"

# ═══════════════════════════════════════════════════════════════════
# 1. Context freshness (advisory — warns but does not block)
# ═══════════════════════════════════════════════════════════════════
if [ -f "$CONTEXT_FILE" ]; then
  NOW_EPOCH=$(date +%s)
  FILE_MTIME=$(stat -c %Y "$CONTEXT_FILE" 2>/dev/null || echo 0)
  AGE_SECONDS=$(( NOW_EPOCH - FILE_MTIME ))
  AGE_HOURS=$(( AGE_SECONDS / 3600 ))

  if [ "$AGE_SECONDS" -gt "$MAX_STALE_SECONDS" ]; then
    echo "WARNING: context.md is ${AGE_HOURS}h old (threshold $(( MAX_STALE_SECONDS / 3600 ))h). Consider running /refresh-context."
  else
    echo "Context freshness: ${AGE_HOURS}h old (OK)"
  fi
else
  echo "WARNING: context.md not found. Project may not be configured yet."
fi

# ═══════════════════════════════════════════════════════════════════
# 2. Sprint sequence enforcement
# ═══════════════════════════════════════════════════════════════════
if [ -f "$SPRINTS_FILE" ]; then
  SPRINT_INFO=$(python3 -c "
import json, sys

try:
    d = json.load(open('$SPRINTS_FILE'))
except:
    print('NO_SPRINTS')
    sys.exit(0)

sprints = d.get('sprints', [])
active = [s for s in sprints if s.get('status') == 'in_progress']

if not active:
    print('NO_ACTIVE_SPRINT')
    sys.exit(0)

s = active[0]
sid = s['id']
steps = s.get('executionSteps', [])

if not steps:
    print(f'SPRINT:{sid}|NO_STEPS')
    sys.exit(0)

# Find current step (first non-completed)
current = None
for step in steps:
    if step.get('status') != 'completed':
        current = step
        break

if current is None:
    print(f'SPRINT:{sid}|ALL_COMPLETE')
    sys.exit(0)

step_num = current.get('step', '?')
action = current.get('action', '?')
role = current.get('role', '').lower()
is_ghost = role == 'ghost'

print(f'SPRINT:{sid}|STEP:{step_num}|ACTION:{action}|GHOST:{is_ghost}')
" 2>/dev/null)

  case "$SPRINT_INFO" in
    NO_SPRINTS|NO_ACTIVE_SPRINT)
      echo "Sprint: none active"
      ;;
    *NO_STEPS*)
      SPRINT_ID=$(echo "$SPRINT_INFO" | cut -d'|' -f1 | cut -d: -f2)
      echo "Sprint: $SPRINT_ID (no executionSteps defined — WARNING)"
      ;;
    *ALL_COMPLETE*)
      SPRINT_ID=$(echo "$SPRINT_INFO" | cut -d'|' -f1 | cut -d: -f2)
      echo "Sprint: $SPRINT_ID (all steps complete — ready for commit)"
      ;;
    *GHOST:True*)
      SPRINT_ID=$(echo "$SPRINT_INFO" | cut -d'|' -f1 | cut -d: -f2)
      STEP_NUM=$(echo "$SPRINT_INFO" | grep -oP 'STEP:\K[^|]+')
      ACTION=$(echo "$SPRINT_INFO" | grep -oP 'ACTION:\K[^|]+')
      echo "Sprint: $SPRINT_ID — Step $STEP_NUM: $ACTION (GHOST GATE)"
      # Allow reads and Agent dispatch (Captain dispatches Ghost for verification)
      IS_AGENT_DISPATCH=0
      if [ "$TOOL_NAME" = "Agent" ]; then IS_AGENT_DISPATCH=1; fi
      if [ "$IS_READ_ONLY" -eq 0 ] && [ "$IS_AGENT_DISPATCH" -eq 0 ]; then
        # Check if phase verification file exists for this step
        PHASE_FILE="$APP_DIR/evidence/$SPRINT_ID/phase-${STEP_NUM}-verification.md"
        if [ -f "$PHASE_FILE" ] && grep -q "PHASE VERIFIED" "$PHASE_FILE" 2>/dev/null; then
          echo "Phase $STEP_NUM verification found — proceed"
        else
          echo "WARNING: Ghost gate (step $STEP_NUM) pending. Phase verification file missing." >&2
          echo "Expected: evidence/$SPRINT_ID/phase-${STEP_NUM}-verification.md with 'PHASE VERIFIED'" >&2
          echo "Dispatch Ghost to verify. Allowing Agent dispatch to proceed." >&2
        fi
      fi
      ;;
    *)
      SPRINT_ID=$(echo "$SPRINT_INFO" | cut -d'|' -f1 | cut -d: -f2)
      STEP_NUM=$(echo "$SPRINT_INFO" | grep -oP 'STEP:\K[^|]+')
      ACTION=$(echo "$SPRINT_INFO" | grep -oP 'ACTION:\K[^|]+')
      echo "Sprint: $SPRINT_ID — Step $STEP_NUM: $ACTION"
      # Check that previous step's Ghost verification exists (if previous was a ghost step)
      PREV_STEP=$((STEP_NUM - 1))
      if [ "$PREV_STEP" -gt 0 ]; then
        PREV_PHASE_FILE="$APP_DIR/evidence/$SPRINT_ID/phase-${PREV_STEP}-verification.md"
        PREV_IS_GHOST=$(python3 -c "
import json, sys
try:
    d = json.load(open('$SPRINTS_FILE'))
    active = [s for s in d['sprints'] if s.get('status') == 'in_progress']
    if active:
        steps = active[0].get('executionSteps', [])
        for st in steps:
            if st.get('step') == $PREV_STEP:
                action = st.get('action', '').lower()
                role = st.get('role', '').lower()
                print('yes' if role == 'ghost' else 'no')
                sys.exit(0)
    print('no')
except:
    print('no')
" 2>/dev/null)
        if [ "$PREV_IS_GHOST" = "yes" ] && [ ! -f "$PREV_PHASE_FILE" ]; then
          if [ "$IS_READ_ONLY" -eq 0 ]; then
            echo "WARNING: Previous step $PREV_STEP was a Ghost gate but no phase-${PREV_STEP}-verification.md found." >&2
            echo "Dispatch Ghost to verify step $PREV_STEP before continuing." >&2
          fi
        fi
      fi
      ;;
  esac
else
  echo "Sprint: no sprints.json found"
fi

# ═══════════════════════════════════════════════════════════════════
# 3. Ghost message check
# ═══════════════════════════════════════════════════════════════════
if [ -f "$GHOST_MESSAGES" ]; then
  GHOST_STATUS=$(python3 -c "
import json, sys
try:
    d = json.load(open('$GHOST_MESSAGES'))
    msgs = d.get('messages', [])
    blocks = [m for m in msgs if m.get('type') == 'BLOCK' and not m.get('acknowledged', False)]
    if blocks:
        print(f'BLOCKED:{len(blocks)} unacknowledged BLOCK directive(s)')
        for b in blocks[:3]:
            print(f'  - {b.get(\"message\", \"no message\")}')
        sys.exit(1)
    else:
        print('CLEAR')
except:
    print('CLEAR')
" 2>/dev/null)
  GHOST_EXIT=$?

  if [ "$GHOST_EXIT" -ne 0 ] && [ "$IS_READ_ONLY" -eq 0 ]; then
    echo "Ghost: $GHOST_STATUS"
    echo "BLOCKED: Unacknowledged Ghost BLOCK directives. Resolve before continuing." >&2
    echo "--- END CONTEXT CHECK ---"
    exit 2
  elif [ "$GHOST_EXIT" -ne 0 ]; then
    echo "Ghost: $GHOST_STATUS (read-only operation — allowed)"
  else
    echo "Ghost: clear"
  fi
else
  echo "Ghost: no messages file"
fi

# ═══════════════════════════════════════════════════════════════════
# 4. Audit logging
# ═══════════════════════════════════════════════════════════════════
# Validate SPRINT_ID is set before using it for audit logging
if [ -f "$SPRINTS_FILE" ] && [ -n "${SPRINT_ID:-}" ]; then
  AUDIT_DIR="$APP_DIR/evidence/$SPRINT_ID"
  AUDIT_FILE="$AUDIT_DIR/workflow-audit.log"
  if [ -d "$AUDIT_DIR" ]; then
    TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    STEP_LOG="${STEP_NUM:-?}"
    echo "[$TS] TOOL=$TOOL_NAME step=$STEP_LOG sprint=$SPRINT_ID" >> "$AUDIT_FILE" 2>/dev/null
  fi
fi

# ═══════════════════════════════════════════════════════════════════
# 5. Git state (informational)
# ═══════════════════════════════════════════════════════════════════
CURRENT_BRANCH=$(cd "$APP_DIR" && git branch --show-current 2>/dev/null)
DIRTY=$(cd "$APP_DIR" && git status --porcelain 2>/dev/null | head -3)
echo "Git: branch=$CURRENT_BRANCH"
if [ -n "$DIRTY" ]; then
  echo "Git: uncommitted changes present"
fi

echo "--- END CONTEXT CHECK ---"
exit 0
