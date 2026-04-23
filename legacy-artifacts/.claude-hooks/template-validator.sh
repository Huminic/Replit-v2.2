#!/bin/bash
# PostToolUse hook — validates governance files against harness.md §9 Templates
# Fires after Edit|Write to catch template violations before they persist.
# Exits 2 to block invalid writes. Logs violations to evidence/template-violations.log.

STDIN_DATA=$(cat)

# Parse the file path from stdin JSON
FILE_PATH=$(echo "$STDIN_DATA" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    ti = d.get('tool_input', {})
    print(ti.get('file_path', ''))
except:
    print('')
" 2>/dev/null)

# Only validate governance files in evidence directories or known governance files
case "$FILE_PATH" in
  */evidence/*/pre-execution-report.md) TEMPLATE="pre-exec" ;;
  */evidence/*/post-sprint-report.md) TEMPLATE="post-sprint" ;;
  */evidence/*/cross-sign-*.md) TEMPLATE="cross-sign" ;;
  */evidence/*/enforcer-checklist.txt) TEMPLATE="enforcer" ;;
  */evidence/*/watchdog-ack.txt) TEMPLATE="watchdog-ack" ;;
  */evidence/*/phase-*-verification.md) TEMPLATE="phase-verification" ;;
  */issues.md) TEMPLATE="issues" ;;
  *) exit 0 ;;  # Not a governance file — skip validation
esac

# Read the file content
if [ ! -f "$FILE_PATH" ]; then
  exit 0  # File doesn't exist yet (might be a failed write)
fi
CONTENT=$(cat "$FILE_PATH")

VIOLATIONS=""

validate_contains() {
  local label="$1"
  local pattern="$2"
  if ! echo "$CONTENT" | grep -q "$pattern" 2>/dev/null; then
    VIOLATIONS="${VIOLATIONS}  - Missing: ${label}\n"
  fi
}

validate_contains_exact() {
  local label="$1"
  local pattern="$2"
  if ! echo "$CONTENT" | grep -qF "$pattern" 2>/dev/null; then
    VIOLATIONS="${VIOLATIONS}  - Missing (exact): ${label}\n"
  fi
}

case "$TEMPLATE" in
  pre-exec)
    validate_contains "## Objective section" "^## Objective"
    validate_contains "## Test Plan section" "^## Test Plan"
    validate_contains "## Declared Files section" "^## Declared Files"
    validate_contains_exact "**Sprint:** header" "**Sprint:**"
    validate_contains_exact "**Date:** header" "**Date:**"
    # Entry gate verdict (if present) must have proper format
    if echo "$CONTENT" | grep -q "## Ghost Entry Gate" 2>/dev/null; then
      if ! echo "$CONTENT" | grep -qE "ENTRY GATE: (APPROVED|REJECTED)" 2>/dev/null; then
        VIOLATIONS="${VIOLATIONS}  - Ghost Entry Gate section missing verdict (ENTRY GATE: APPROVED or REJECTED)\n"
      fi
    fi
    ;;

  post-sprint)
    validate_contains "## Objective section" "^## Objective"
    validate_contains "## Changes Made section" "^## Changes Made"
    validate_contains "## AC Results section" "^## AC Results"
    validate_contains "## Test Execution section" "^## Test Execution"
    validate_contains "## UI Delta section" "^## UI Delta"
    validate_contains "## Regression Delta section" "^## Regression Delta"
    validate_contains_exact "**Sprint:** header" "**Sprint:**"
    validate_contains_exact "**Date:** header" "**Date:**"
    # Exit gate verdict (if present) must have proper format
    if echo "$CONTENT" | grep -q "## Ghost Exit Gate" 2>/dev/null; then
      if ! echo "$CONTENT" | grep -qE "EXIT GATE: (CLEARED|NOT CLEARED)" 2>/dev/null; then
        VIOLATIONS="${VIOLATIONS}  - Ghost Exit Gate section missing verdict (EXIT GATE: CLEARED or NOT CLEARED)\n"
      fi
    fi
    ;;

  cross-sign)
    validate_contains "## Implementing Role section" "^## Implementing Role:"
    validate_contains "## Reviewing Role section" "^## Reviewing Role:"
    validate_contains "## Verdict section" "^## Verdict:"
    # Verdict must be plain text, not bold
    if echo "$CONTENT" | grep -q '^\*\*Verdict:' 2>/dev/null; then
      VIOLATIONS="${VIOLATIONS}  - Verdict must be plain text '## Verdict: APPROVED' — NOT bold\n"
    fi
    # Reviewing role must be from allowed list
    REVIEWING_ROLE=$(echo "$CONTENT" | grep -oP '## Reviewing Role: \K\S+' 2>/dev/null)
    if [ -n "$REVIEWING_ROLE" ]; then
      case "$REVIEWING_ROLE" in
        frontend|backend|test|integration|scribe|enforcer|architect|orchestrator|governance) ;;
        *) VIOLATIONS="${VIOLATIONS}  - Reviewing Role '$REVIEWING_ROLE' not in allowed list\n" ;;
      esac
    fi
    validate_contains_exact "**Sprint ID:** header" "**Sprint ID:**"
    validate_contains_exact "**Timestamp:** header" "**Timestamp:**"
    ;;

  enforcer)
    validate_contains_exact "RESULT: APPROVED" "RESULT: APPROVED"
    validate_contains "Timestamp field" "^Timestamp:"
    validate_contains "Sprint field" "^Sprint:"
    validate_contains "Role field" "^Role:"
    ;;

  watchdog-ack)
    validate_contains "Acknowledged-By field (start of line)" "^Acknowledged-By:"
    validate_contains "Sprint field" "^Sprint:"
    validate_contains "Timestamp field" "^Timestamp:"
    ;;

  phase-verification)
    if ! echo "$CONTENT" | grep -qE "PHASE (VERIFIED|FAILED)" 2>/dev/null; then
      VIOLATIONS="${VIOLATIONS}  - Missing: PHASE VERIFIED or PHASE FAILED verdict\n"
    fi
    validate_contains_exact "**Reviewed by:** field" "**Reviewed by:**"
    validate_contains_exact "**Timestamp:** field" "**Timestamp:**"
    validate_contains_exact "**Sprint:** field" "**Sprint:**"
    ;;

  issues)
    # Validate any new issue entries have required fields
    # Only check if file has issue headings
    if echo "$CONTENT" | grep -q "^### \[" 2>/dev/null; then
      # Check that at least one issue has the required fields
      if ! echo "$CONTENT" | grep -q "^\*\*Status:\*\*" 2>/dev/null; then
        VIOLATIONS="${VIOLATIONS}  - Issues entries missing **Status:** field\n"
      fi
      if ! echo "$CONTENT" | grep -q "^\*\*Severity:\*\*" 2>/dev/null; then
        VIOLATIONS="${VIOLATIONS}  - Issues entries missing **Severity:** field\n"
      fi
      if ! echo "$CONTENT" | grep -q "^\*\*Evidence:\*\*" 2>/dev/null; then
        VIOLATIONS="${VIOLATIONS}  - Issues entries missing **Evidence:** field\n"
      fi
    fi
    ;;
esac

if [ -n "$VIOLATIONS" ]; then
  # Log to violations file
  APP_DIR=$(dirname "$(dirname "$FILE_PATH")" 2>/dev/null)
  # For issues.md, APP_DIR is just dirname
  case "$TEMPLATE" in
    issues) APP_DIR=$(dirname "$FILE_PATH") ;;
    *) APP_DIR=$(echo "$FILE_PATH" | grep -oP '.*/evidence' | sed 's|/evidence$||') ;;
  esac
  VIOLATIONS_LOG="${APP_DIR}/evidence/template-violations.log"
  TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  if [ -d "$(dirname "$VIOLATIONS_LOG")" ]; then
    printf "[%s] TEMPLATE_VIOLATION file=%s template=%s\n" "$TS" "$FILE_PATH" "$TEMPLATE" >> "$VIOLATIONS_LOG"
    printf "%b" "$VIOLATIONS" >> "$VIOLATIONS_LOG"
  fi

  echo "TEMPLATE VALIDATION FAILED for $TEMPLATE: $FILE_PATH" >&2
  printf "%b" "$VIOLATIONS" >&2
  echo "Fix the file to match harness.md §9 template requirements." >&2
  exit 2
fi

exit 0
