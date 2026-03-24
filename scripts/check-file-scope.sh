#!/bin/bash
# check-file-scope.sh — Validates that changed files fall within a role's allowed scope
#
# GOVERNANCE AMENDMENT (2026-03-13):
#   Do not add scope exceptions. If a file is out of scope, STOP and discuss.
# Usage: ./scripts/check-file-scope.sh <role> [file1 file2 ...]
# If no files passed, reads from staged git changes.
# Exit 0 = all files in scope, Exit 1 = out-of-scope files found
#
# Sprint-scoped orchestrator commits:
#   When COMMIT_SPRINT is set and role is orchestrator, files are also allowed
#   if they match scope= declarations in evidence/{sprint}/workflow-audit.log.
#   This lets the orchestrator commit agent work without a permanently broad scope.

set -e

ROLE="$1"
shift

if [ -z "$ROLE" ]; then
  echo "BLOCKED: No role specified."
  echo "Usage: ./scripts/check-file-scope.sh <role> [file1 file2 ...]"
  echo "Roles: frontend, backend, test, integration, scribe, enforcer, architect, orchestrator"
  exit 1
fi

# If no files passed as args, get staged files from git
if [ $# -eq 0 ]; then
  FILES=$(git diff --cached --name-only 2>/dev/null)
else
  FILES="$@"
fi

if [ -z "$FILES" ]; then
  echo "No files to check."
  exit 0
fi

# Define allowed write patterns per role
# Governance files that NO agent can touch (only owner/orchestrator)
# Adapted for nexxus2.2_replit project
GOVERNANCE_FILES="CLAUDE.md sprints.json"

check_governance() {
  local file="$1"
  local role="$2"
  for gov in $GOVERNANCE_FILES; do
    if [ "$file" = "$gov" ] && [ "$role" != "orchestrator" ] && [ "$role" != "governance" ]; then
      return 1
    fi
  done
  return 0
}

# ─── Sprint-scoped file check ─────────────────────────────────────────────
# Parses scope= declarations from the workflow-audit.log for the given sprint.
# Returns 0 if file matches any declared scope pattern, 1 otherwise.
check_sprint_scope() {
  local file="$1"
  local sprint="$2"
  local audit_log="evidence/${sprint}/workflow-audit.log"

  if [ ! -f "$audit_log" ]; then
    return 1
  fi

  # Extract all scope= values from agent-launch lines
  # Format: [date] agent-launch | role=X | task="..." | scope=pattern1,pattern2
  local scopes
  scopes=$(grep "agent-launch.*scope=" "$audit_log" | sed 's/.*scope=//' | tr ',' '\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

  if [ -z "$scopes" ]; then
    return 1
  fi

  # Check file against each declared scope pattern
  while IFS= read -r pattern; do
    [ -z "$pattern" ] && continue

    # Direct match (exact file path)
    if [ "$file" = "$pattern" ]; then
      return 0
    fi

    # Glob match: convert scope pattern to a case-compatible glob
    # e.g., "client/src/pages/*.tsx" matches "client/src/pages/main.tsx"
    # e.g., "server/services/metric-engine.ts" matches exactly
    case "$file" in
      $pattern) return 0 ;;
    esac

    # Also try with ** expansion for directory patterns
    # e.g., scope=client/src/pages/ should match client/src/pages/main.tsx
    local dir_pattern="${pattern%/}"
    case "$file" in
      ${dir_pattern}/*) return 0 ;;
    esac
  done <<< "$scopes"

  return 1
}

# Returns 0 if file is in scope for role, 1 if out of scope
check_scope() {
  local file="$1"
  local role="$2"

  # Governance check applies to all roles except orchestrator
  if ! check_governance "$file" "$role"; then
    return 1
  fi

  case "$role" in
    frontend)
      case "$file" in
        client/src/**|client/src/*|public/**|public/*) return 0 ;;
        *) return 1 ;;
      esac
      ;;
    backend)
      case "$file" in
        server/**|server/*|shared/**|shared/*|db/**|db/*) return 0 ;;
        *) return 1 ;;
      esac
      ;;
    test)
      case "$file" in
        tests/**|tests/*|*.spec.ts) return 0 ;;
        *) return 1 ;;
      esac
      ;;
    integration)
      case "$file" in
        central-mcp/**|central-mcp/*|server/services/mcp/**|server/services/mcp/*) return 0 ;;
        *) return 1 ;;
      esac
      ;;
    scribe)
      case "$file" in
        .project/**|.project/*) return 0 ;;
        *) return 1 ;;
      esac
      ;;
    enforcer)
      case "$file" in
        evidence/**|evidence/*|enforcer/**|enforcer/*) return 0 ;;
        *) return 1 ;;
      esac
      ;;
    architect)
      case "$file" in
        .project/**|.project/*) return 0 ;;
        *) return 1 ;;
      esac
      ;;
    governance|orchestrator)
      # Orchestrator's PERMANENT scope: governance, scripts, evidence, .project/
      # Adapted for nexxus2.2_replit project
      case "$file" in
        CLAUDE.md) return 0 ;;
        plan.md) return 0 ;;
        harness.md) return 0 ;;
        acceptance_criteria.md) return 0 ;;
        agent-instructions.json) return 0 ;;
        issues.md) return 0 ;;
        backlog.md) return 0 ;;
        .gitignore) return 0 ;;
        .claude/**|.claude/*) return 0 ;;
        scripts/**|scripts/*) return 0 ;;
        .project/**|.project/*) return 0 ;;
        evidence/**|evidence/*) return 0 ;;
        sprints.json) return 0 ;;
        enforcer/**|enforcer/*) return 0 ;;
        plan/**|plan/*) return 0 ;;
        specs/**|specs/*) return 0 ;;
        temp/**|temp/*) return 0 ;;
      esac

      # Sprint-scoped expansion: if COMMIT_SPRINT is set, check workflow-audit.log
      if [ -n "$COMMIT_SPRINT" ]; then
        if check_sprint_scope "$file" "$COMMIT_SPRINT"; then
          return 0
        fi
      fi

      # Not in permanent scope and not in sprint scope
      return 1
      ;;
    *)
      echo "BLOCKED: Unknown role '$role'"
      exit 1
      ;;
  esac
}

VIOLATIONS=0
VIOLATION_LIST=""

for file in $FILES; do
  if ! check_scope "$file" "$ROLE"; then
    VIOLATIONS=$((VIOLATIONS + 1))
    VIOLATION_LIST="${VIOLATION_LIST}\n  OUT OF SCOPE: $file (role: $ROLE)"
  fi
done

if [ "$VIOLATIONS" -gt 0 ]; then
  if [ "$ROLE" = "orchestrator" ] && [ -z "$COMMIT_SPRINT" ]; then
    echo "HINT: Set COMMIT_SPRINT=<sprint-name> to enable sprint-scoped file access."
  fi
  echo "BLOCKED: $VIOLATIONS file(s) outside $ROLE scope:"
  echo -e "$VIOLATION_LIST"
  exit 1
else
  if [ "$ROLE" = "orchestrator" ] && [ -n "$COMMIT_SPRINT" ]; then
    echo "PASS: All files within $ROLE scope (sprint-scoped via $COMMIT_SPRINT)."
  else
    echo "PASS: All files within $ROLE scope."
  fi
  exit 0
fi
