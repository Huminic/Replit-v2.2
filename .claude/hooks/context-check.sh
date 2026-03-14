#!/bin/bash
# Pre-tool-use hook: Forces context alignment check
# Outputs a reminder block that Claude sees before every tool execution
# This is mechanical — it runs regardless of whether Claude "remembers" to check

MEMORY_DIR="$HOME/.claude/projects/-home-ubuntu-Claude-store-nexxus2-2-replit/memory"
SESSION_STATE="$MEMORY_DIR/session-state.md"
PLAN_FILE="$HOME/.claude/plans/reactive-wobbling-tome.md"

echo "--- CONTEXT CHECK (automated hook) ---"

# 1. Session state
if [ -f "$SESSION_STATE" ]; then
  TASK=$(grep "Working On:" "$SESSION_STATE" 2>/dev/null | head -1 | sed 's/.*Working On: *//')
  BRANCH=$(grep "Branch:" "$SESSION_STATE" 2>/dev/null | head -1 | sed 's/.*Branch: *//')
  echo "Session: task='$TASK' branch='$BRANCH'"
else
  echo "Session: NO session-state.md found"
fi

# 2. Active plan status
if [ -f "$PLAN_FILE" ]; then
  STATUS=$(grep "^\\*\\*Status:" "$PLAN_FILE" 2>/dev/null | head -1 | sed 's/.*Status:\*\* *//')
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

echo "--- END CONTEXT CHECK ---"

exit 0
