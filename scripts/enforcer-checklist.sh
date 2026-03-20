#!/bin/bash
# enforcer-checklist.sh — Automated Enforcer compliance checks (EF-01 through EF-18)
# Usage: ./scripts/enforcer-checklist.sh [sprint-name]
# Writes results to evidence/{sprint-name}/enforcer-checklist.txt
# Exit 0 = all critical checks pass, Exit 1 = blocking failure
# Adapted for nexxus2.2_replit project (migrated from nexxus2.2)
#
# GOVERNANCE AMENDMENT (2026-03-13):
#   1. No exceptions. If a check fails, the sprint is BLOCKED.
#   2. If a condition exists that governance does not account for:
#      STOP → discuss with user → revise governance → re-run.
#   3. Any code fixed to pass a gate must be recertified (full checklist re-run).
#   4. Fixing one thing that breaks another is still a failure. All gates must pass simultaneously.
#   5. These scripts are the source of truth. Do not bypass, weaken, or create carve-outs.

set -e

SPRINT_NAME="${1:-${COMMIT_SPRINT:-unknown-sprint}}"
EVIDENCE_DIR="evidence/${SPRINT_NAME}"
mkdir -p "$EVIDENCE_DIR"

CHECKLIST_FILE="${EVIDENCE_DIR}/enforcer-checklist.txt"
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

log() {
  echo "$1" | tee -a "$CHECKLIST_FILE"
}

check_pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  log "  [PASS] $1"
}

check_fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  log "  [FAIL] $1"
}

check_warn() {
  WARN_COUNT=$((WARN_COUNT + 1))
  log "  [WARN] $1"
}

# Clear previous results
> "$CHECKLIST_FILE"

log "=== Enforcer Compliance Checklist ==="
log "Sprint: $SPRINT_NAME"
log "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
log ""

# EF-01: TypeScript compiles with zero errors
log "[EF-01] TypeScript compilation..."
if npx tsc --noEmit 2>/dev/null; then
  check_pass "TypeScript compiles with zero errors"
else
  check_fail "TypeScript compilation failed"
fi

# EF-02: Production build succeeds
log "[EF-02] Production build..."
if npm run build 2>/dev/null 1>/dev/null; then
  check_pass "Production build succeeds"
else
  check_fail "Production build failed"
fi

# EF-03: Kill switch tests (check if test:smoke script exists)
log "[EF-03] Kill switch tests..."
if grep -q '"test:smoke"' package.json 2>/dev/null; then
  if npm run test:smoke 2>/dev/null 1>/dev/null; then
    check_pass "Kill switch tests pass"
  else
    check_fail "Kill switch tests failed"
  fi
else
  check_warn "test:smoke script not defined — kill switch tests not available yet"
fi

# EF-04: No references to dropped features
log "[EF-04] Dropped feature references..."
# Vendor list adapted for nexxus2.2_replit (no dropped features identified yet — placeholder)
DROPPED=$(grep -rlE "\"PLACEHOLDER_DROPPED_FEATURE\"" client/src/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules || true)
if [ -z "$DROPPED" ]; then
  check_pass "No dropped feature references found"
else
  check_fail "Dropped feature references in: $DROPPED"
fi

# EF-05: No production credentials (only checks tracked/staged files, not gitignored)
log "[EF-05] Production credentials scan..."
CREDS=$(grep -rlE "(supabase\.co|sk-[a-zA-Z0-9]{20,}|AKIA[A-Z0-9]{16}|xoxb-|ghp_)" . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.env" 2>/dev/null | grep -v node_modules | grep -v ".git/" | while read -r f; do git check-ignore -q "$f" 2>/dev/null || echo "$f"; done || true)
if [ -z "$CREDS" ]; then
  check_pass "No production credentials detected"
else
  check_fail "Possible credentials in: $CREDS"
fi

# EF-06: CLAUDE.md hash integrity
log "[EF-06] CLAUDE.md hash check..."
CURRENT_HASH=$(git show HEAD:CLAUDE.md 2>/dev/null | md5sum | awk '{print $1}')
WORKING_HASH=$(md5sum CLAUDE.md 2>/dev/null | awk '{print $1}')
if [ "$CURRENT_HASH" = "$WORKING_HASH" ]; then
  check_pass "CLAUDE.md matches committed version"
else
  check_warn "CLAUDE.md has uncommitted changes (may be intentional orchestrator update)"
fi

# EF-07: Governance file hash integrity (project-specific files)
log "[EF-07] Governance file hash check..."
if [ -f ".project/progress.md" ]; then
  GOV_CURRENT=$(git show HEAD:.project/progress.md 2>/dev/null | md5sum | awk '{print $1}')
  GOV_WORKING=$(md5sum .project/progress.md 2>/dev/null | awk '{print $1}')
  if [ "$GOV_CURRENT" = "$GOV_WORKING" ]; then
    check_pass ".project/progress.md matches committed version"
  else
    check_warn ".project/progress.md has uncommitted changes (may be intentional)"
  fi
else
  check_warn ".project/progress.md not found yet (created in P0-S2)"
fi

# EF-08: New functions have JSDoc/TSDoc (informational — checks staged files)
log "[EF-08] JSDoc/TSDoc coverage..."
NEW_FUNCTIONS=$(git diff --cached -U0 --diff-filter=A -- '*.ts' '*.tsx' 2>/dev/null | grep -c "^+.*function " || true)
NEW_JSDOC=$(git diff --cached -U0 --diff-filter=A -- '*.ts' '*.tsx' 2>/dev/null | grep -c "^+.*/\*\*" || true)
if [ "$NEW_FUNCTIONS" -eq 0 ]; then
  check_pass "No new functions to check"
elif [ "$NEW_JSDOC" -ge "$NEW_FUNCTIONS" ]; then
  check_pass "$NEW_JSDOC JSDoc blocks for $NEW_FUNCTIONS new functions"
else
  check_warn "$NEW_JSDOC JSDoc blocks for $NEW_FUNCTIONS new functions (some may be missing)"
fi

# EF-09: New files have codebase-index entries
log "[EF-09] Codebase index coverage..."
NEW_FILES=$(git diff --cached --name-only --diff-filter=A -- '*.ts' '*.tsx' 2>/dev/null || true)
if [ -z "$NEW_FILES" ]; then
  check_pass "No new files to index"
else
  # This project does not use codebase-index.md — skip verification
  check_pass "Index check not applicable (no codebase-index.md in this project)"
fi

# EF-10: No COMPLETED items without evidence
log "[EF-10] Evidence check..."
if [ -d "$EVIDENCE_DIR" ] && [ "$(ls -A "$EVIDENCE_DIR" 2>/dev/null)" ]; then
  check_pass "Evidence directory has files: $EVIDENCE_DIR"
else
  check_warn "Evidence directory empty or missing: $EVIDENCE_DIR"
fi

# EF-11: ESLint (check if lint script exists)
log "[EF-11] ESLint..."
if grep -q '"lint"' package.json 2>/dev/null; then
  if npm run lint 2>/dev/null 1>/dev/null; then
    check_pass "ESLint passes"
  else
    check_fail "ESLint failed"
  fi
else
  check_warn "lint script not defined in package.json"
fi

# EF-12: Sprint status vocabulary — validate sprints.json statuses
log "[EF-12] Sprint status vocabulary..."
if [ -f sprints.json ]; then
  INVALID_STATUSES=$(python3 -c "
import json, sys
valid = {'planned', 'in_progress', 'committed', 'blocked', 'abandoned'}
d = json.load(open('sprints.json'))
invalid = [s['id']+':'+s.get('status','') for s in d.get('sprints',[]) if s.get('status','') not in valid]
print('\n'.join(invalid) if invalid else '')
" 2>/dev/null || echo "parse_error")
  if [ -z "$INVALID_STATUSES" ]; then
    check_pass "All sprint statuses use approved vocabulary"
  elif [ "$INVALID_STATUSES" = "parse_error" ]; then
    check_warn "Could not parse sprints.json for status validation"
  else
    check_fail "Invalid sprint statuses: $INVALID_STATUSES"
  fi
else
  check_warn "sprints.json not found"
fi

# EF-13: Every staged file is declared in the sprint's workflow-audit.log
log "[EF-13] Staged files vs audit log scope..."
AUDIT_LOG="${EVIDENCE_DIR}/workflow-audit.log"
if [ -f "$AUDIT_LOG" ]; then
  # Extract all scope= declarations from agent-launch lines
  DECLARED_SCOPES=$(grep "agent-launch.*scope=" "$AUDIT_LOG" | sed 's/.*scope=//' | tr ',' '\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

  # Also include orchestrator permanent scope (these never need declaration)
  PERMANENT_SCOPE="evidence/ scripts/ .project/ CLAUDE.md sprints.json"

  STAGED=$(git diff --cached --name-only 2>/dev/null || true)
  if [ -n "$STAGED" ]; then
    UNDECLARED=0
    for file in $STAGED; do
      IN_SCOPE=0

      # Check permanent scope
      for perm in $PERMANENT_SCOPE; do
        case "$file" in
          ${perm}*) IN_SCOPE=1; break ;;
        esac
      done

      # Check declared sprint scopes
      if [ "$IN_SCOPE" -eq 0 ] && [ -n "$DECLARED_SCOPES" ]; then
        while IFS= read -r pattern; do
          [ -z "$pattern" ] && continue
          case "$file" in
            $pattern) IN_SCOPE=1; break ;;
          esac
          # Directory pattern fallback
          local_dir="${pattern%/}"
          case "$file" in
            ${local_dir}/*) IN_SCOPE=1; break ;;
          esac
        done <<< "$DECLARED_SCOPES"
      fi

      if [ "$IN_SCOPE" -eq 0 ]; then
        UNDECLARED=$((UNDECLARED + 1))
        log "    Undeclared file: $file"
      fi
    done

    if [ "$UNDECLARED" -eq 0 ]; then
      check_pass "All staged files declared in workflow-audit.log or permanent scope"
    else
      check_fail "$UNDECLARED staged file(s) not declared in $AUDIT_LOG scope= lines"
    fi
  else
    check_pass "No staged files to check"
  fi
else
  check_warn "Workflow audit log not found: $AUDIT_LOG"
fi

# EF-14: UI Rendering Guard — blocks >40 lines changed in any page file
log "[EF-14] UI Rendering Guard (>40 lines in page file)..."
if [ "$UI_EXCEPTION" = "true" ]; then
  check_warn "UI_EXCEPTION=true — EF-14 bypassed"
else
  PAGE_VIOLATIONS=""
  for page_file in client/src/pages/*.tsx; do
    [ -f "$page_file" ] || continue
    CHANGED_LINES=$(git diff --cached --stat -- "$page_file" 2>/dev/null | tail -1 | grep -oE '[0-9]+ insertion|[0-9]+ deletion' | grep -oE '[0-9]+' | paste -sd+ - | bc 2>/dev/null || echo 0)
    [ -z "$CHANGED_LINES" ] && CHANGED_LINES=0
    if [ "$CHANGED_LINES" -gt 40 ]; then
      PAGE_VIOLATIONS="${PAGE_VIOLATIONS} ${page_file}(${CHANGED_LINES} lines)"
    fi
  done
  if [ -z "$PAGE_VIOLATIONS" ]; then
    check_pass "No page file exceeds 40-line change threshold"
  else
    check_fail "Page files exceed 40-line threshold:${PAGE_VIOLATIONS}"
  fi
fi

# EF-15: Pre-populated Data Guard — blocks deletion of data array declarations
log "[EF-15] Pre-populated Data Guard..."
DATA_ARRAY_DELETIONS=$(git diff --cached -- 'client/src/pages/*.tsx' 2>/dev/null | grep "^-" | grep -E "const \w+\s*[:=]\s*\[" | grep -v "^---" || true)
if [ -z "$DATA_ARRAY_DELETIONS" ]; then
  check_pass "No data array declarations deleted from page files"
else
  check_fail "Data array declarations deleted from page files"
  log "    Deleted lines:"
  echo "$DATA_ARRAY_DELETIONS" | head -5 | while read -r line; do log "    $line"; done
fi

# EF-16: UI Element Removal Guard — blocks removal of Badge/Button/Coming Soon
log "[EF-16] UI Element Removal Guard..."
if [ "$UI_EXCEPTION" = "true" ]; then
  check_warn "UI_EXCEPTION=true — EF-16 bypassed"
else
  ELEMENT_REMOVALS=$(git diff --cached -- 'client/src/pages/*.tsx' 2>/dev/null | grep "^-" | grep -v "^---" | grep -E "<Badge|<Button|Coming Soon" || true)
  if [ -z "$ELEMENT_REMOVALS" ]; then
    check_pass "No Badge/Button/Coming Soon removals from page files"
  else
    check_fail "UI elements removed from page files (Badge/Button/Coming Soon)"
    echo "$ELEMENT_REMOVALS" | head -5 | while read -r line; do log "    $line"; done
  fi
fi

# EF-17: Locked Value Guard — blocks changes to value: lines in main.tsx roleMetrics
log "[EF-17] Locked Value Guard (main.tsx roleMetrics)..."
VALUE_CHANGES=$(git diff --cached -- 'client/src/pages/main.tsx' 2>/dev/null | grep -E "^[-+].*value:" | grep -v "^[-+][-+][-+]" || true)
if [ -z "$VALUE_CHANGES" ]; then
  check_pass "No value: changes in main.tsx"
else
  REMOVED_VALUES=$(echo "$VALUE_CHANGES" | grep "^-" | wc -l)
  ADDED_VALUES=$(echo "$VALUE_CHANGES" | grep "^+" | wc -l)
  if [ "$REMOVED_VALUES" -gt 0 ] && [ "$ADDED_VALUES" -gt 0 ]; then
    check_fail "Locked value: lines modified in main.tsx roleMetrics"
    echo "$VALUE_CHANGES" | head -10 | while read -r line; do log "    $line"; done
  else
    check_pass "value: lines added but not modified in main.tsx"
  fi
fi

# EF-19: Runtime Smoke Test — verify production server serves through public URL
log "[EF-19] Runtime smoke test..."
APP_URL="${APP_BASE_URL:-$(grep '^APP_BASE_URL=' .env 2>/dev/null | cut -d= -f2-)}"
if [ -n "$APP_URL" ]; then
  # Test 1: HTML page returns 200
  HTML_STATUS=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$APP_URL/" 2>/dev/null || echo "000")
  if [ "$HTML_STATUS" != "200" ]; then
    check_fail "Public URL $APP_URL/ returned HTTP $HTML_STATUS (expected 200)"
  else
    # Test 2: Extract first JS asset from HTML and verify it loads (catches CORS, static serving)
    ASSET_PATH=$(curl -s --max-time 10 "$APP_URL/" 2>/dev/null | grep -oE 'src="/assets/[^"]+' | head -1 | sed 's/src="//')
    if [ -n "$ASSET_PATH" ]; then
      ASSET_STATUS=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 -H "Origin: $APP_URL" "$APP_URL$ASSET_PATH" 2>/dev/null || echo "000")
      if [ "$ASSET_STATUS" = "200" ]; then
        check_pass "Public URL serves HTML (200) and JS asset (200) — CORS OK"
      else
        check_fail "JS asset $ASSET_PATH returned HTTP $ASSET_STATUS through $APP_URL (CORS or static serving issue)"
      fi
    else
      check_warn "Could not extract JS asset path from HTML — partial smoke test (HTML: 200)"
    fi
  fi
else
  check_warn "APP_BASE_URL not set — runtime smoke test skipped"
fi

# EF-18: Drift Check (warning only) — vs baseline 96d3f6c (initial clean state)
log "[EF-18] Drift Check (vs baseline 96d3f6c)..."
DRIFT_WARNINGS=""
for page_file in client/src/pages/*.tsx; do
  [ -f "$page_file" ] || continue
  BASELINE_LINES=$(git show 96d3f6c:"$page_file" 2>/dev/null | wc -l || echo 0)
  CURRENT_LINES=$(wc -l < "$page_file" 2>/dev/null || echo 0)
  DIFF=$((CURRENT_LINES - BASELINE_LINES))
  ABS_DIFF=${DIFF#-}
  if [ "$ABS_DIFF" -gt 200 ]; then
    DRIFT_WARNINGS="${DRIFT_WARNINGS} $(basename $page_file)(${DIFF:+$DIFF} lines)"
  fi
done
if [ -z "$DRIFT_WARNINGS" ]; then
  check_pass "No page files >200 lines diverged from baseline"
else
  check_warn "Page files diverged >200 lines from baseline:${DRIFT_WARNINGS}"
fi

# Summary
log ""
log "=== SUMMARY ==="
log "PASS: $PASS_COUNT"
log "FAIL: $FAIL_COUNT"
log "WARN: $WARN_COUNT"
log ""

if [ "$FAIL_COUNT" -gt 0 ]; then
  log "RESULT: BLOCKED — $FAIL_COUNT failing check(s)"
  exit 1
else
  log "RESULT: APPROVED — all critical checks pass ($WARN_COUNT warning(s))"
  exit 0
fi
