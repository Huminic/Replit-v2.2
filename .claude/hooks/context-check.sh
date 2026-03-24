#!/bin/bash
# Pre-tool-use hook: Forces context alignment check
# Blocks tool execution if session state is stale (>4 hours old)
# Exception: allows writes TO session-state.md itself (prevents deadlock)

MEMORY_DIR="$HOME/.claude/projects/-home-ubuntu-Claude-store-nexxus2-2-replit/memory"
SESSION_STATE="$MEMORY_DIR/session-state.md"
PLAN_FILE="$HOME/.claude/plans/reactive-wobbling-tome.md"
MAX_STALE_SECONDS=14400  # 4 hours

# Read tool input from stdin to check if we're updating session state
STDIN_DATA=$(cat)
IS_SESSION_UPDATE=0
if echo "$STDIN_DATA" | grep -q "session-state.md" 2>/dev/null; then
  IS_SESSION_UPDATE=1
fi

echo "--- CONTEXT CHECK (automated hook) ---"

# 1. Session state existence and freshness
if [ -f "$SESSION_STATE" ]; then
  TASK=$(grep "Working On:" "$SESSION_STATE" 2>/dev/null | head -1 | sed 's/.*Working On: *//')
  BRANCH=$(grep "Branch:" "$SESSION_STATE" 2>/dev/null | head -1 | sed 's/.*Branch: *//')
  echo "Session: task='$TASK' branch='$BRANCH'"

  # Check freshness by file mtime
  NOW_EPOCH=$(date +%s)
  FILE_MTIME=$(stat -c %Y "$SESSION_STATE" 2>/dev/null || echo 0)
  AGE_SECONDS=$(( NOW_EPOCH - FILE_MTIME ))
  AGE_HOURS=$(( AGE_SECONDS / 3600 ))

  if [ "$AGE_SECONDS" -gt "$MAX_STALE_SECONDS" ]; then
    if [ "$IS_SESSION_UPDATE" -eq 1 ]; then
      echo "Session stale (${AGE_HOURS}h) but tool is updating session-state.md — ALLOWED"
    else
      echo "BLOCKED: session-state.md is ${AGE_HOURS}h old (max $(( MAX_STALE_SECONDS / 3600 ))h). Update it before proceeding." >&2
      echo "--- END CONTEXT CHECK ---"
      exit 2
    fi
  else
    echo "Session freshness: ${AGE_HOURS}h old (OK)"
  fi
else
  if [ "$IS_SESSION_UPDATE" -eq 1 ]; then
    echo "Session state missing but tool is creating it — ALLOWED"
  else
    echo "BLOCKED: session-state.md does not exist. Create it before proceeding." >&2
    echo "--- END CONTEXT CHECK ---"
    exit 2
  fi
fi

# 2. Active plan status
if [ -f "$PLAN_FILE" ]; then
  STATUS=$(grep "^\*\*Status:" "$PLAN_FILE" 2>/dev/null | head -1 | sed 's/.*Status:\*\* *//')
  echo "Plan: $STATUS"
else
  echo "Plan: NO active plan found"
fi

# 3. Current git state
CURRENT_BRANCH=$(cd /home/ubuntu/Claude-store/nexxus2.2_replit && git branch --show-current 2>/dev/null)
DIRTY=$(cd /home/ubuntu/Claude-store/nexxus2.2_replit && git status --porcelain 2>/dev/null | head -3)
echo "Git: branch=$CURRENT_BRANCH"
if [ -n "$DIRTY" ]; then
  echo "Git: UNCOMMITTED CHANGES PRESENT"
fi

# 4. Ghost gate status — check if waiting for entry/exit gate
GHOST_DIR="/home/ubuntu/Claude-store/nexxus2.2_replit"
CURRENT_SPRINT=$(grep "Working On:.*S-[0-9]" "$SESSION_STATE" 2>/dev/null | grep -oE "S-[0-9]+" | head -1)
if [ -n "$CURRENT_SPRINT" ]; then
  PRE_EXEC="$GHOST_DIR/evidence/$CURRENT_SPRINT/pre-execution-report.md"
  POST_SPRINT="$GHOST_DIR/evidence/$CURRENT_SPRINT/post-sprint-report.md"

  # Check entry gate
  if [ -f "$PRE_EXEC" ]; then
    if grep -q "ENTRY GATE: APPROVED" "$PRE_EXEC" 2>/dev/null; then
      echo "Ghost gate: $CURRENT_SPRINT ENTRY GATE APPROVED — work permitted"
    elif grep -q "ENTRY GATE: REJECTED" "$PRE_EXEC" 2>/dev/null; then
      echo "Ghost gate: $CURRENT_SPRINT ENTRY GATE REJECTED — check pre-exec for reasons"
    else
      # Don't block — ghost cron will write the verdict within 2 minutes
      echo "Ghost gate: $CURRENT_SPRINT entry gate PENDING — ghost agent reviewing (auto, ~2 min)"
    fi
  fi

  # Check exit gate of previous sprint
  PREV_NUM=$(( ${CURRENT_SPRINT#S-} - 1 ))
  if [ "$PREV_NUM" -ge 0 ]; then
    PREV_POST="$GHOST_DIR/evidence/S-$PREV_NUM/post-sprint-report.md"
    if [ -f "$PREV_POST" ] && ! grep -q "EXIT GATE: CLEARED" "$PREV_POST" 2>/dev/null; then
      echo "WARNING: Previous sprint S-$PREV_NUM exit gate NOT CLEARED"
    fi
  fi
fi

echo "--- END CONTEXT CHECK ---"

exit 0
