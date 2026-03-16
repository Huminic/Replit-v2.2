#!/bin/bash
# Nexxus Connect v2.2 (replit migration) pre-commit hook — SOLE enforcement point
# Adapted from nexxus2.2 project
#
# GOVERNANCE AMENDMENT (2026-03-13):
#   1. No exceptions. If a gate fails, the commit is BLOCKED.
#   2. If a condition exists that governance does not account for:
#      STOP → discuss with user → revise governance → re-run.
#   3. Any code fixed to pass a gate must be recertified (full checklist re-run).
#   4. Fixing one thing that breaks another is still a failure. All gates must pass simultaneously.
#   5. These scripts are the source of truth. Do not bypass, weaken, or create carve-outs.
# ALL governance checks run here. git commit cannot succeed without passing every gate.
# Installed via: cp scripts/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
#
# Required environment variables:
#   COMMIT_ROLE   — One of: frontend, backend, test, integration, scribe, enforcer, architect, orchestrator
#   COMMIT_SPRINT — Sprint name, must match an entry in sprints.json
#
# Optional:
#   UI_EXCEPTION=true — Bypasses EF-14 and EF-16

set -e

echo "=== Nexxus Pre-Commit Hook (Strict Mode) ==="
echo ""

ROLE="${COMMIT_ROLE:-}"
SPRINT="${COMMIT_SPRINT:-}"
STAGED_FILES=$(git diff --cached --name-only)
NOW_EPOCH=$(date +%s)
MAX_AGE_SECONDS=1800  # 30 minutes

block() {
  echo ""
  echo "BLOCKED: $1"
  echo ""
  log_audit "BLOCKED" "$1"
  exit 1
}

log_audit() {
  local result="$1"
  local detail="$2"
  local audit_dir="evidence/${SPRINT}"
  local audit_file="${audit_dir}/workflow-audit.log"
  if [ -n "$SPRINT" ] && [ -d "$audit_dir" ]; then
    local ts
    ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    if ! echo "[$ts] PRE-COMMIT role=$ROLE sprint=$SPRINT result=$result detail=\"$detail\"" >> "$audit_file"; then
      if [ "$result" = "PASS" ]; then
        echo "BLOCKED: Failed to write PASS stamp to $audit_file"
        exit 1
      fi
      # BLOCKED stamps failing to write should not prevent the block itself
    fi
  fi
}

check_freshness() {
  local file="$1"
  local label="$2"

  # Check file mtime
  local file_mtime
  file_mtime=$(stat -c %Y "$file" 2>/dev/null || echo 0)
  local mtime_age=$(( NOW_EPOCH - file_mtime ))
  if [ "$mtime_age" -gt "$MAX_AGE_SECONDS" ]; then
    block "$label is stale (modified ${mtime_age}s ago, max ${MAX_AGE_SECONDS}s). Re-run the generator."
  fi

  # Check embedded Timestamp line
  local ts_line
  ts_line=$(grep -m1 "^Timestamp:" "$file" 2>/dev/null | sed 's/^Timestamp: *//')
  if [ -n "$ts_line" ]; then
    local file_epoch
    file_epoch=$(date -d "$ts_line" +%s 2>/dev/null || echo 0)
    if [ "$file_epoch" -gt 0 ]; then
      local ts_age=$(( NOW_EPOCH - file_epoch ))
      if [ "$ts_age" -gt "$MAX_AGE_SECONDS" ]; then
        block "$label embedded timestamp is stale (${ts_age}s ago). Re-generate the artifact."
      fi
      if [ "$ts_age" -lt -60 ]; then
        block "$label has a future timestamp. Clock manipulation detected."
      fi
    fi
  fi
}

# ═══════════════════════════════════════════════════════════════════
# GATE 1: Required environment variables
# ═══════════════════════════════════════════════════════════════════
echo "[Gate 1/7] Environment variables..."

if [ -z "$ROLE" ]; then
  block "COMMIT_ROLE is not set. Usage: COMMIT_ROLE=<role> COMMIT_SPRINT=<sprint> git commit -m \"message\""
fi

if [ -z "$SPRINT" ]; then
  block "COMMIT_SPRINT is not set. Usage: COMMIT_ROLE=<role> COMMIT_SPRINT=<sprint> git commit -m \"message\""
fi

VALID_ROLES="frontend backend test integration scribe enforcer architect orchestrator"
ROLE_VALID=0
for r in $VALID_ROLES; do
  if [ "$r" = "$ROLE" ]; then
    ROLE_VALID=1
    break
  fi
done
if [ "$ROLE_VALID" -eq 0 ]; then
  block "Invalid COMMIT_ROLE='$ROLE'. Valid: $VALID_ROLES"
fi

# Validate sprint exists in sprints.json
if [ -f "sprints.json" ]; then
  if ! python3 -c "import json,sys; d=json.load(open('sprints.json')); ids=[s['id'] for s in d['sprints']]; sys.exit(0 if '$SPRINT' in ids else 1)" 2>/dev/null; then
    block "Sprint '$SPRINT' not found in sprints.json. Register the sprint first."
  fi
fi

echo "  PASS (role=$ROLE, sprint=$SPRINT)"

EVIDENCE_DIR="evidence/${SPRINT}"

# ═══════════════════════════════════════════════════════════════════
# GATE 1.5: Chain-of-custody — previous sprint must be committed
# ═══════════════════════════════════════════════════════════════════
echo "[Gate 1.5/7] Chain-of-custody..."

if [ -f "sprints.json" ]; then
  CHAIN_RESULT=$(python3 -c "
import json, sys
d = json.load(open('sprints.json'))
sprints = d.get('sprints', [])
current_idx = None
for i, s in enumerate(sprints):
    if s['id'] == '$SPRINT':
        current_idx = i
        break
if current_idx is None:
    print('SKIP:Sprint not in registry')
    sys.exit(0)
if current_idx == 0:
    print('OK:First sprint, no predecessor')
    sys.exit(0)
prev = sprints[current_idx - 1]
if prev['status'] == 'committed':
    print(f'OK:Previous {prev[\"id\"]} committed ({prev.get(\"commitHash\",\"?\")})')
else:
    print(f'BLOCK:Previous sprint {prev[\"id\"]} status is \"{prev[\"status\"]}\", not \"committed\"')
    sys.exit(1)
" 2>/dev/null)
  CHAIN_EXIT=$?
  if [ "$CHAIN_EXIT" -ne 0 ]; then
    block "Chain-of-custody violation: ${CHAIN_RESULT#BLOCK:}"
  fi
  echo "  PASS (${CHAIN_RESULT#OK:})"
else
  echo "  SKIP (no sprints.json)"
fi

# ═══════════════════════════════════════════════════════════════════
# GATE 1.6: Watchdog acknowledgment
# ═══════════════════════════════════════════════════════════════════
echo "[Gate 1.6/7] Watchdog acknowledgment..."

if [ -f "scripts/watchdog.sh" ]; then
  WATCHDOG_RESULT=$(bash scripts/watchdog.sh verify-ack 2>&1)
  WATCHDOG_EXIT=$?
  if [ "$WATCHDOG_EXIT" -ne 0 ]; then
    block "Watchdog gate: $WATCHDOG_RESULT"
  fi
  echo "  $WATCHDOG_RESULT"
else
  echo "  SKIP (watchdog.sh not found)"
fi

# ═══════════════════════════════════════════════════════════════════
# GATE 1.7: Session state content freshness
# ═══════════════════════════════════════════════════════════════════
echo "[Gate 1.7/7] Session state content..."

SESSION_STATE_FILE="$HOME/.claude/projects/-home-ubuntu-Claude-store-nexxus2-2-replit/memory/session-state.md"
if [ -f "$SESSION_STATE_FILE" ]; then
  # Check that session state references the current sprint
  SESSION_SPRINT=$(grep -oE 'QA-S[0-9]+|FIX-S[0-9]+|P[0-9]+-S[0-9]+' "$SESSION_STATE_FILE" | sort -u | tail -1)
  if [ -n "$SESSION_SPRINT" ]; then
    # Session state should reference the current sprint or the one just before it
    if echo "$SESSION_SPRINT $SPRINT" | python3 -c "
import sys
tokens = sys.stdin.read().strip().split()
session_ref = tokens[0]
committing = tokens[1]
# Extract numeric parts for comparison
import re
def sprint_num(s):
    m = re.search(r'S(\d+)', s)
    return int(m.group(1)) if m else -1
def sprint_phase(s):
    m = re.match(r'(QA|FIX|P\d+)', s)
    return m.group(1) if m else ''
# If same phase, session ref should be within 1 sprint of committing sprint
sp = sprint_phase(session_ref)
cp = sprint_phase(committing)
sn = sprint_num(session_ref)
cn = sprint_num(committing)
if sp == cp and cn - sn > 1:
    print(f'STALE: session references {session_ref} but committing {committing}')
    sys.exit(1)
sys.exit(0)
" 2>/dev/null; then
      echo "  PASS (session references $SESSION_SPRINT, committing $SPRINT)"
    else
      STALE_MSG=$(echo "$SESSION_SPRINT $SPRINT" | python3 -c "
import sys
tokens = sys.stdin.read().strip().split()
print(f'Session state references {tokens[0]} but committing {tokens[1]} — update session-state.md')
" 2>/dev/null)
      block "Session state content is stale: $STALE_MSG"
    fi
  else
    echo "  SKIP (no sprint reference found in session state)"
  fi
else
  echo "  SKIP (session-state.md not found)"
fi

# ═══════════════════════════════════════════════════════════════════
# GATE 2: Evidence directory
# ═══════════════════════════════════════════════════════════════════
echo "[Gate 2/7] Evidence directory..."

if [ ! -d "$EVIDENCE_DIR" ]; then
  block "Evidence directory not found: $EVIDENCE_DIR"
fi

EVIDENCE_COUNT=$(find "$EVIDENCE_DIR" -type f ! -name ".gitkeep" | wc -l)
if [ "$EVIDENCE_COUNT" -eq 0 ]; then
  block "Evidence directory is empty: $EVIDENCE_DIR"
fi

echo "  PASS ($EVIDENCE_COUNT file(s) in $EVIDENCE_DIR)"

# ═══════════════════════════════════════════════════════════════════
# GATE 3: Enforcer checklist (fresh + approved)
# ═══════════════════════════════════════════════════════════════════
echo "[Gate 3/7] Enforcer checklist..."

ENFORCER_FILE="${EVIDENCE_DIR}/enforcer-checklist.txt"

if [ ! -f "$ENFORCER_FILE" ]; then
  block "Enforcer checklist not found: $ENFORCER_FILE. Run: ./scripts/enforcer-checklist.sh $SPRINT"
fi

if grep -q "RESULT: BLOCKED" "$ENFORCER_FILE"; then
  block "Enforcer checklist has BLOCKED result. Fix failures and re-run."
fi

if ! grep -q "RESULT: APPROVED" "$ENFORCER_FILE"; then
  block "Enforcer checklist missing APPROVED result. Re-run: ./scripts/enforcer-checklist.sh $SPRINT"
fi

check_freshness "$ENFORCER_FILE" "Enforcer checklist"

echo "  PASS (approved, fresh)"

# ═══════════════════════════════════════════════════════════════════
# GATE 4: Cross-sign (fresh + different role + correct implementing role)
# ═══════════════════════════════════════════════════════════════════
echo "[Gate 4/7] Cross-sign..."

CROSS_SIGN_FILE="${EVIDENCE_DIR}/cross-sign.md"

if [ ! -f "$CROSS_SIGN_FILE" ]; then
  block "Cross-sign not found: $CROSS_SIGN_FILE. A different role must review and create it."
fi

VERDICT=$(grep -i "Verdict:" "$CROSS_SIGN_FILE" | head -1 | sed 's/.*: *//' | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')
if [ "$VERDICT" != "approved" ]; then
  block "Cross-sign verdict is '$VERDICT', not 'approved'."
fi

IMPL_ROLE=$(grep -i "Implementing Role:" "$CROSS_SIGN_FILE" | head -1 | sed 's/.*: *//' | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')
if [ "$IMPL_ROLE" != "$ROLE" ]; then
  block "Cross-sign implementing role ($IMPL_ROLE) does not match COMMIT_ROLE ($ROLE)."
fi

REVIEWER_ROLE=$(grep -i "Reviewing Role:" "$CROSS_SIGN_FILE" | head -1 | sed 's/.*: *//' | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')
if [ "$REVIEWER_ROLE" = "$ROLE" ]; then
  block "Cross-sign reviewer ($REVIEWER_ROLE) is same as COMMIT_ROLE ($ROLE). Self-approval not allowed."
fi

REVIEWER_VALID=0
for r in $VALID_ROLES; do
  if [ "$r" = "$REVIEWER_ROLE" ]; then
    REVIEWER_VALID=1
    break
  fi
done
if [ "$REVIEWER_VALID" -eq 0 ]; then
  block "Cross-sign reviewer role '$REVIEWER_ROLE' is not valid. Valid: $VALID_ROLES"
fi

check_freshness "$CROSS_SIGN_FILE" "Cross-sign"

echo "  PASS (reviewed by $REVIEWER_ROLE, fresh)"

# ═══════════════════════════════════════════════════════════════════
# GATE 5: File scope validation
# ═══════════════════════════════════════════════════════════════════
echo "[Gate 5/7] File scope..."

if [ -z "$STAGED_FILES" ]; then
  block "No staged files. Run git add first."
fi

export COMMIT_SPRINT="$SPRINT"
if ! ./scripts/check-file-scope.sh "$ROLE" $STAGED_FILES; then
  block "Staged files outside $ROLE scope."
fi

echo "  PASS"

# ═══════════════════════════════════════════════════════════════════
# GATE 6: Enforcement checks (EF-01 through EF-17)
# ═══════════════════════════════════════════════════════════════════
echo "[Gate 6/7] Enforcement checks..."

# EF-01: TypeScript
echo "  [EF-01] TypeScript..."
if ! npx tsc --noEmit 2>/dev/null; then
  block "TypeScript compilation failed (EF-01)."
fi
echo "    PASS"

# Mock import count (informational)
MOCK_COUNT=$(grep -rl "from '@/mocks" client/src/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "client/src/mocks/" | wc -l)
if [ "$MOCK_COUNT" -gt 0 ]; then
  echo "    INFO: $MOCK_COUNT mock imports remain"
fi

# EF-04: Vendor names (adapted for this project — no vendor restrictions yet)
echo "  [EF-04] Vendor names..."
echo "    PASS (no vendor restrictions defined for this project)"

# EF-05: Governance file protection
echo "  [EF-05] Governance files..."
GOVERNANCE_FILES="CLAUDE.md sprints.json"
for gov in $GOVERNANCE_FILES; do
  if echo "$STAGED_FILES" | grep -q "^${gov}$"; then
    if [ "$ROLE" != "orchestrator" ]; then
      block "Governance file '$gov' staged by role '$ROLE'. Only orchestrator may modify."
    fi
  fi
done
echo "    PASS"

# EF-14: UI Rendering Guard
echo "  [EF-14] UI Rendering Guard..."
if [ "$UI_EXCEPTION" = "true" ]; then
  echo "    BYPASSED (UI_EXCEPTION=true)"
else
  for page_file in client/src/pages/*.tsx; do
    [ -f "$page_file" ] || continue
    CHANGED_LINES=$(git diff --cached --stat -- "$page_file" 2>/dev/null | tail -1 | grep -oE '[0-9]+ insertion|[0-9]+ deletion' | grep -oE '[0-9]+' | paste -sd+ - | bc 2>/dev/null || echo 0)
    [ -z "$CHANGED_LINES" ] && CHANGED_LINES=0
    if [ "$CHANGED_LINES" -gt 40 ]; then
      block "$page_file has $CHANGED_LINES lines changed (max 40, EF-14)."
    fi
  done
  echo "    PASS"
fi

# EF-15: Data Array Guard
echo "  [EF-15] Data Array Guard..."
DATA_DELETIONS=$(git diff --cached -- 'client/src/pages/*.tsx' 2>/dev/null | grep "^-" | grep -E "const \w+\s*[:=]\s*\[" | grep -v "^---" || true)
if [ -n "$DATA_DELETIONS" ]; then
  block "Data array declarations deleted from page files (EF-15)."
fi
echo "    PASS"

# EF-16: UI Element Guard
echo "  [EF-16] UI Element Guard..."
if [ "$UI_EXCEPTION" = "true" ]; then
  echo "    BYPASSED (UI_EXCEPTION=true)"
else
  ELEMENT_REMOVALS=$(git diff --cached -- 'client/src/pages/*.tsx' 2>/dev/null | grep "^-" | grep -v "^---" | grep -E "<Badge|<Button|Coming Soon" || true)
  if [ -n "$ELEMENT_REMOVALS" ]; then
    block "UI elements removed from page files (EF-16)."
  fi
  echo "    PASS"
fi

# EF-17: Locked Value Guard
echo "  [EF-17] Locked Value Guard..."
VALUE_CHANGES=$(git diff --cached -- 'client/src/pages/main.tsx' 2>/dev/null | grep -E "^[-+].*value:" | grep -v "^[-+][-+][-+]" || true)
if [ -n "$VALUE_CHANGES" ]; then
  REMOVED_VALUES=$(echo "$VALUE_CHANGES" | grep "^-" | wc -l)
  ADDED_VALUES=$(echo "$VALUE_CHANGES" | grep "^+" | wc -l)
  if [ "$REMOVED_VALUES" -gt 0 ] && [ "$ADDED_VALUES" -gt 0 ]; then
    block "Locked value: lines modified in main.tsx roleMetrics (EF-17)."
  fi
fi
echo "    PASS"

echo "  All enforcement checks passed."

# ═══════════════════════════════════════════════════════════════════
# GATE 7: Hook integrity + script protection
# ═══════════════════════════════════════════════════════════════════
echo "[Gate 7/7] Hook integrity..."

# Block non-orchestrator from modifying any scripts/
for staged in $STAGED_FILES; do
  case "$staged" in
    scripts/*)
      if [ "$ROLE" != "orchestrator" ]; then
        block "Script '$staged' staged by role '$ROLE'. Only orchestrator may modify scripts/."
      fi
      ;;
  esac
done

# Verify installed hook matches source
HOOK_PATH=".git/hooks/pre-commit"
if [ -f "$HOOK_PATH" ] && [ -f "scripts/pre-commit.sh" ]; then
  HOOK_HASH=$(md5sum "$HOOK_PATH" | awk '{print $1}')
  SCRIPT_HASH=$(md5sum "scripts/pre-commit.sh" | awk '{print $1}')
  if [ "$HOOK_HASH" != "$SCRIPT_HASH" ]; then
    echo "  WARNING: Installed hook differs from scripts/pre-commit.sh"
  fi
fi

echo "  PASS"

# ═══════════════════════════════════════════════════════════════════
# SUCCESS
# ═══════════════════════════════════════════════════════════════════
log_audit "PASS" "All 7 gates passed"

# Re-stage the audit log so the PASS stamp is included in this commit
AUDIT_LOG="evidence/${SPRINT}/workflow-audit.log"
if [ -f "$AUDIT_LOG" ]; then
  git add "$AUDIT_LOG"
fi

echo ""
echo "=== All pre-commit gates passed (role=$ROLE, sprint=$SPRINT) ==="
