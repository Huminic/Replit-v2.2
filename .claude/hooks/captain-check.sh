#!/bin/bash
# Captain enforcement hook — nexxus
# Blocks direct execution during active sprints. Captain must delegate to sub-agents.
# PreToolUse hook: reads JSON from stdin, exits 0 (allow) or 2 (block).

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Sub-agents skip captain enforcement — this hook governs the orchestrator only
if [ -n "${CLAUDE_AGENT_DEPTH:-}" ] && [ "${CLAUDE_AGENT_DEPTH:-0}" -gt 0 ]; then
  exit 0
fi

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
  # --- No active sprint: PLANNING MODE ---
  # Allow reads, agent dispatch (already handled above), governance writes, git reads.
  # Block app code writes and execution commands.

  FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

  # Edit/Write — only governance files allowed
  if [ "$TOOL_NAME" = "Edit" ] || [ "$TOOL_NAME" = "Write" ]; then
    case "$FILE_PATH" in
      */sprints.json|*/PLAN.md|*/plan.md|*/issues.md) exit 0 ;;
      */evidence/*|*/.governor/*) exit 0 ;;
      *session-output.md|*context.md) exit 0 ;;
      */.claude/*) exit 0 ;;
      */CLAUDE.md|*/harness.md) exit 0 ;;
    esac
    # Block writes to app code — no sprint authorizes it
    echo "PLANNING MODE: No active sprint. Cannot write to app files." >&2
    echo "Only governance files (sprints.json, PLAN.md, issues.md, evidence/, .governor/, .claude/) are writable." >&2
    echo "File: $FILE_PATH | Tool: $TOOL_NAME" >&2
    exit 2
  fi

  # Bash — allow git reads and read-only commands, block execution
  if [ "$TOOL_NAME" = "Bash" ]; then
    FIRST_CMD=$(echo "$COMMAND" | grep -oP '^\s*\K\S+' | head -1)
    case "$FIRST_CMD" in
      git)
        # Allow git read commands and branch creation
        if echo "$COMMAND" | grep -qP 'git\s+(status|log|diff|branch|show|remote|rev-parse|blame|tag|stash\s+list|checkout\s+-[bB]|switch\s+-c|checkout\s+--orphan|add|commit)'; then
          exit 0
        fi
        echo "PLANNING MODE: Git write command blocked. No active sprint." >&2
        echo "Allowed: status, log, diff, branch, show, checkout -b, add, commit" >&2
        echo "Command: $COMMAND" >&2
        exit 2
        ;;
      ls|cat|head|tail|grep|find|wc|stat|date|pwd|echo|test|curl|python3|which|file|md5sum|diff|readlink|jq|true|false)
        exit 0
        ;;
      mkdir|cp|mv|touch)
        # Only governance dirs
        if echo "$COMMAND" | grep -qP '(server/|client/|shared/|tests/)'; then
          echo "PLANNING MODE: File operation on app code blocked. No active sprint." >&2
          echo "Command: $COMMAND" >&2
          exit 2
        fi
        exit 0
        ;;
      npx|npm|node|pm2|docker|bash|sed|awk|perl|tee|dd|install|patch)
        echo "PLANNING MODE: Execution command blocked. No active sprint." >&2
        echo "Start a sprint before running execution commands." >&2
        echo "Command: $COMMAND" >&2
        exit 2
        ;;
      *)
        echo "PLANNING MODE: Unrecognized command '$FIRST_CMD' blocked. No active sprint." >&2
        echo "Command: $COMMAND" >&2
        exit 2
        ;;
    esac
  fi

  # Any other tool — allow in planning mode
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
  # Extract the first meaningful command word (skip env var assignments like VAR=val)
  FIRST_CMD=$(echo "$COMMAND" | grep -oP '^\s*\K\S+' | head -1)
  TEMP_CMD="$COMMAND"
  while echo "$FIRST_CMD" | grep -qP '^[A-Z_]+='; do
    TEMP_CMD=$(echo "$TEMP_CMD" | sed 's/^[[:space:]]*[A-Z_]*=[^ ]* *//')
    FIRST_CMD=$(echo "$TEMP_CMD" | grep -oP '^\s*\K\S+' | head -1)
  done

  # Explicitly allowed read-only commands
  case "$FIRST_CMD" in
    git)
      # Allow git read commands, block git write commands
      if echo "$COMMAND" | grep -qP 'git\s+(status|log|diff|branch|show|remote|rev-parse|blame|tag|stash\s+list|checkout\s+-[bB]|switch\s+-c|checkout\s+--orphan|add|commit)'; then
        exit 0
      fi
      echo "CAPTAIN VIOLATION: Git write command blocked during active sprint. Delegate to sub-agent." >&2
      echo "Allowed: status, log, diff, branch, show, checkout -b, add, commit" >&2
      echo "Command: $COMMAND" >&2
      exit 2
      ;;
    ls|cat|head|tail|grep|find|wc|stat|date|pwd|echo|test|curl|python3|which|file|md5sum|diff|readlink|jq|true|false)
      exit 0
      ;;
    npm)
      # Allow build only — block install/publish/other
      if echo "$COMMAND" | grep -qP 'npm\s+run\s+build'; then
        exit 0
      fi
      echo "CAPTAIN VIOLATION: npm command blocked during active sprint (only 'npm run build' allowed). Delegate to sub-agent." >&2
      echo "Command: $COMMAND" >&2
      exit 2
      ;;
    pm2)
      # Allow restart/list only — block delete/stop/other
      if echo "$COMMAND" | grep -qP 'pm2\s+(restart|list|status)'; then
        exit 0
      fi
      echo "CAPTAIN VIOLATION: pm2 command blocked during active sprint (only restart/list allowed). Delegate to sub-agent." >&2
      echo "Command: $COMMAND" >&2
      exit 2
      ;;
    npx)
      # Allow playwright and tsc only
      if echo "$COMMAND" | grep -qP 'npx\s+(playwright|tsc)'; then
        exit 0
      fi
      echo "CAPTAIN VIOLATION: npx command blocked during active sprint (only playwright/tsc allowed). Delegate to sub-agent." >&2
      echo "Command: $COMMAND" >&2
      exit 2
      ;;
    npx|npm|node|pm2|docker|bash|sed|awk|perl|tee|dd|install|patch)
      echo "CAPTAIN VIOLATION: Execution command blocked during active sprint. Delegate to sub-agent." >&2
      echo "Command: $COMMAND" >&2
      exit 2
      ;;
    cd)
      # cd is fine, but check what follows after && or ;
      if echo "$COMMAND" | grep -qP '(&&|;)\s*(npx|npm|node|pm2|docker|bash|sed|awk|perl|tee|dd|install|patch)\b'; then
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
      # Default-deny: unrecognized commands blocked during active sprint
      echo "CAPTAIN VIOLATION: Unrecognized command '$FIRST_CMD' blocked during active sprint. Delegate to sub-agent." >&2
      echo "Command: $COMMAND" >&2
      exit 2
      ;;
  esac
fi

# Any other tool — allow
exit 0
