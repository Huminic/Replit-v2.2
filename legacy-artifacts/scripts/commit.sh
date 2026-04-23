#!/bin/bash
# commit.sh — Commit wrapper that enforces agent role governance
# Usage: COMMIT_ROLE=<role> COMMIT_SPRINT=<sprint> ./scripts/commit.sh "commit message"
# This script validates:
#   1. COMMIT_ROLE and COMMIT_SPRINT are set and valid
#   2. All staged files are within the role's scope (sprint-scoped for orchestrator)
#   3. Evidence directory exists for the sprint
#   4. Cross-sign file exists (sign-off from a different role)
#   5. Enforcer checklist has been run and passed
# Only then does it run git commit.

set -e

ROLE="${COMMIT_ROLE:-}"
SPRINT_NAME="${COMMIT_SPRINT:-}"
COMMIT_MSG="$1"

if [ -z "$ROLE" ] || [ -z "$SPRINT_NAME" ] || [ -z "$COMMIT_MSG" ]; then
  echo "Usage: COMMIT_ROLE=<role> COMMIT_SPRINT=<sprint> ./scripts/commit.sh \"commit message\""
  echo ""
  echo "Environment variables (required):"
  echo "  COMMIT_ROLE   — One of: frontend, backend, test, integration, scribe, enforcer, architect, orchestrator"
  echo "  COMMIT_SPRINT — Sprint name, e.g., V-Sprint-0, AC-Sprint-1, W2-Sprint-9"
  echo ""
  echo "Example:"
  echo "  COMMIT_ROLE=orchestrator COMMIT_SPRINT=AC-Sprint-1 ./scripts/commit.sh \"AC-Sprint-1: Tile fixes\""
  echo ""
  echo "Required before running:"
  echo "  1. Stage files with git add"
  echo "  2. Run enforcer checklist: ./scripts/enforcer-checklist.sh <sprint-name>"
  echo "  3. Create cross-sign: evidence/<sprint-name>/cross-sign.md"
  exit 1
fi

EVIDENCE_DIR="evidence/${SPRINT_NAME}"

echo "=== Commit Wrapper ==="
echo "Role: $ROLE"
echo "Sprint: $SPRINT_NAME"
echo ""

# Check 1: Valid role
VALID_ROLES="frontend backend test integration scribe enforcer architect orchestrator"
ROLE_VALID=0
for r in $VALID_ROLES; do
  if [ "$r" = "$ROLE" ]; then
    ROLE_VALID=1
    break
  fi
done
if [ "$ROLE_VALID" -eq 0 ]; then
  echo "BLOCKED: Invalid role '$ROLE'"
  echo "Valid roles: $VALID_ROLES"
  exit 1
fi
echo "[1/5] Valid role: $ROLE"

# Check 2: File scope (COMMIT_SPRINT is exported for check-file-scope.sh)
echo "[2/5] File scope check..."
export COMMIT_SPRINT
STAGED_FILES=$(git diff --cached --name-only)
if [ -z "$STAGED_FILES" ]; then
  echo "BLOCKED: No staged files. Run git add first."
  exit 1
fi
if ! ./scripts/check-file-scope.sh "$ROLE" $STAGED_FILES; then
  echo ""
  echo "BLOCKED: Staged files outside $ROLE scope."
  if [ "$ROLE" = "orchestrator" ]; then
    echo "Ensure every application file is declared in scope= of evidence/$SPRINT_NAME/workflow-audit.log"
  else
    echo "Either change the role or unstage the out-of-scope files."
  fi
  exit 1
fi

# Check 3: Evidence directory
echo "[3/5] Evidence directory..."
if [ ! -d "$EVIDENCE_DIR" ]; then
  echo "BLOCKED: Evidence directory not found: $EVIDENCE_DIR"
  echo "Create it and add sprint evidence before committing."
  exit 1
fi
EVIDENCE_COUNT=$(find "$EVIDENCE_DIR" -type f ! -name ".gitkeep" | wc -l)
if [ "$EVIDENCE_COUNT" -eq 0 ]; then
  echo "BLOCKED: Evidence directory is empty: $EVIDENCE_DIR"
  echo "Add verification artifacts before committing."
  exit 1
fi
echo "  PASS ($EVIDENCE_COUNT evidence file(s))"

# Check 4: Cross-sign
echo "[4/5] Cross-sign verification..."
CROSS_SIGN_FILE="${EVIDENCE_DIR}/cross-sign.md"
if [ ! -f "$CROSS_SIGN_FILE" ]; then
  echo "BLOCKED: Cross-sign file not found: $CROSS_SIGN_FILE"
  echo ""
  echo "A different agent role must review this work and create the cross-sign file."
  echo "Format:"
  echo "  # Cross-Sign: $SPRINT_NAME"
  echo "  Implementing Role: $ROLE"
  echo "  Reviewing Role: <reviewer-role>"
  echo "  Timestamp: <ISO timestamp>"
  echo "  Verdict: APPROVED"
  echo "  Notes: <review notes>"
  exit 1
fi
# Verify cross-sign is from a DIFFERENT role
REVIEWER_ROLE=$(grep -i "Reviewing Role:" "$CROSS_SIGN_FILE" | head -1 | sed 's/.*: *//' | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')
if [ "$REVIEWER_ROLE" = "$ROLE" ]; then
  echo "BLOCKED: Cross-sign is from the same role ($ROLE). A different role must review."
  exit 1
fi
VERDICT=$(grep -i "Verdict:" "$CROSS_SIGN_FILE" | head -1 | sed 's/.*: *//' | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')
if [ "$VERDICT" != "approved" ]; then
  echo "BLOCKED: Cross-sign verdict is '$VERDICT', not 'approved'."
  exit 1
fi
echo "  PASS (reviewed by: $REVIEWER_ROLE)"

# Check 5: Enforcer checklist
echo "[5/5] Enforcer checklist..."
ENFORCER_FILE="${EVIDENCE_DIR}/enforcer-checklist.txt"
if [ ! -f "$ENFORCER_FILE" ]; then
  echo "BLOCKED: Enforcer checklist not found: $ENFORCER_FILE"
  echo "Run: ./scripts/enforcer-checklist.sh $SPRINT_NAME"
  exit 1
fi
if grep -q "RESULT: BLOCKED" "$ENFORCER_FILE"; then
  echo "BLOCKED: Enforcer checklist has failing checks."
  echo "Review: $ENFORCER_FILE"
  exit 1
fi
if ! grep -q "RESULT: APPROVED" "$ENFORCER_FILE"; then
  echo "BLOCKED: Enforcer checklist result not found. Re-run: ./scripts/enforcer-checklist.sh $SPRINT_NAME"
  exit 1
fi
echo "  PASS"

# All checks passed — commit
echo ""
echo "=== All checks passed. Committing... ==="
echo ""

git commit -m "${COMMIT_MSG}

Sprint: ${SPRINT_NAME}
Role: ${ROLE}
Cross-signed by: ${REVIEWER_ROLE}
Evidence: ${EVIDENCE_DIR}/

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

echo ""
echo "=== Commit successful ==="
