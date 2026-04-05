#!/bin/bash
# Captain enforcement hook — nexxus
# Blocks direct execution during active sprints. Captain must delegate to sub-agents.
# PreToolUse hook: reads JSON from stdin, exits 0 (allow) or 2 (block).

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Read-only tools — always allowed
case "$TOOL_NAME" in
  Read|Glob|Grep) exit 0 ;;
esac

# Agent dispatch — always allowed (this IS delegation)
if [ "$TOOL_NAME" = "Agent" ]; then
  exit 0
fi

# Check for in_progress sprint
SPRINTS_FILE="/home/ubuntu/Claude-store/nexxus2.2_replit/sprints.json"
if [ ! -f "$SPRINTS_FILE" ]; then
  exit 0
fi

HAS_ACTIVE=$(python3 -c "
import json, sys
try:
    d = json.load(open('$SPRINTS_FILE'))
    active = [s for s in d.get('sprints', []) if s.get('status') == 'in_progress']
    print('yes' if active else 'no')
except:
    print('no')
" 2>/dev/null)

if [ "$HAS_ACTIVE" != "yes" ]; then
  # No active sprint — allow everything
  exit 0
fi

# --- Active sprint detected. Enforce delegation. ---

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Check if writing to governance/evidence files (always allowed)
case "$FILE_PATH" in
  */evidence/*|*/sprints.json|*/issues.md|*/plan.md|*/acceptance_criteria.md) exit 0 ;;
  *session-output.md|*context.md) exit 0 ;;
  */.claude/*|*/.governor/*) exit 0 ;;
  */CLAUDE.md|*/harness.md) exit 0 ;;
esac

# Edit/Write to app code — BLOCKED
if [ "$TOOL_NAME" = "Edit" ] || [ "$TOOL_NAME" = "Write" ]; then
  case "$FILE_PATH" in
    */server/*|*/client/*|*/shared/*|*/tests/*|*/Dockerfile*|*/package.json|*/tsconfig*)
      echo "CAPTAIN VIOLATION: Cannot edit app code directly during active sprint." >&2
      echo "Delegate to a sub-agent via Agent dispatch." >&2
      echo "File: $FILE_PATH | Tool: $TOOL_NAME" >&2
      exit 2
      ;;
  esac
  # Other writes (governance files not caught above) — allow
  exit 0
fi

# Bash — check command
if [ "$TOOL_NAME" = "Bash" ]; then
  # Extract the first meaningful command word
  FIRST_CMD=$(echo "$COMMAND" | grep -oP '^\s*\K\S+' | head -1)

  # Explicitly allowed read-only commands
  case "$FIRST_CMD" in
    git)
      # Allow git read commands, block git write commands
      if echo "$COMMAND" | grep -qP 'git\s+(status|log|diff|branch|show|remote|rev-parse|blame|tag|stash\s+list)'; then
        exit 0
      fi
      echo "CAPTAIN VIOLATION: Git write command blocked during active sprint. Delegate to sub-agent." >&2
      echo "Command: $COMMAND" >&2
      exit 2
      ;;
    ls|cat|head|tail|grep|find|wc|stat|date|pwd|echo|test|curl|python3|which|file|md5sum|diff|readlink|jq|true|false)
      exit 0
      ;;
    npx|npm|node|pm2|docker|bash)
      echo "CAPTAIN VIOLATION: Execution command blocked during active sprint. Delegate to sub-agent." >&2
      echo "Command: $COMMAND" >&2
      exit 2
      ;;
    cd)
      # cd is fine, but check what follows after && or ;
      if echo "$COMMAND" | grep -qP '(&&|;)\s*(npx|npm|node|pm2|docker|bash)\b'; then
        echo "CAPTAIN VIOLATION: Execution command blocked during active sprint. Delegate to sub-agent." >&2
        echo "Command: $COMMAND" >&2
        exit 2
      fi
      exit 0
      ;;
    mkdir|cp|mv|touch)
      # File ops on governance dirs — allowed; on app dirs — blocked
      if echo "$COMMAND" | grep -qP '(server/|client/|shared/|tests/)'; then
        echo "CAPTAIN VIOLATION: File operation on app code blocked during active sprint. Delegate to sub-agent." >&2
        echo "Command: $COMMAND" >&2
        exit 2
      fi
      exit 0
      ;;
    *)
      # Unknown command during active sprint — allow but warn
      echo "CAPTAIN WARNING: Unrecognized command '$FIRST_CMD' during active sprint. Consider delegating." >&2
      exit 0
      ;;
  esac
fi

# Any other tool — allow
exit 0
