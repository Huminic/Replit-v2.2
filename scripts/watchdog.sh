#!/bin/bash
# watchdog.sh — Deterministic governance watchdog for nexxus2.2_replit
# No LLM interpretation. Every check is grep/jq/stat/git. Binary PASS/FAIL.
#
# Usage:
#   ./scripts/watchdog.sh scan    — Full audit, writes report
#   ./scripts/watchdog.sh watch   — Real-time file monitoring via inotifywait
#
# Output:
#   scan  → stdout + evidence/watchdog-report.txt
#   watch → evidence/watchdog-alerts.log (append)

set -uo pipefail
# Note: NOT using set -e because grep returning no matches (exit 1) is expected behavior

PROJECT_ROOT="/home/ubuntu/Claude-store/nexxus2.2_replit"
SPRINTS_JSON="$PROJECT_ROOT/sprints.json"
EVIDENCE_DIR="$PROJECT_ROOT/evidence"
REPORT_FILE="$EVIDENCE_DIR/watchdog-report.txt"
ACK_FILE="$EVIDENCE_DIR/watchdog-ack.txt"
ALERTS_LOG="$EVIDENCE_DIR/watchdog-alerts.log"
GHOST_LOG="$EVIDENCE_DIR/ghost_messages.log"
SESSION_STATE="$HOME/.claude/projects/-home-ubuntu-Claude-store-nexxus2-2-replit/memory/session-state.md"
PLANS_DIR="$HOME/.claude/plans"
HOOK_SOURCE="$PROJECT_ROOT/scripts/pre-commit.sh"
HOOK_INSTALLED="$PROJECT_ROOT/.git/hooks/pre-commit"

# Excluded evidence directories (not sprints)
EXCLUDED_EVIDENCE="audit-recertification"

# Required artifacts per sprint evidence directory
REQUIRED_ARTIFACTS=("pre-execution-report.md" "post-sprint-report.md" "cross-sign.md" "enforcer-checklist.txt")

# Counters
PASS_COUNT=0
VIOLATION_COUNT=0
WARNING_COUNT=0

# Accumulate output lines
OUTPUT_LINES=()

out() {
  OUTPUT_LINES+=("$1")
  echo "$1"
}

alert() {
  local msg="[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ALERT: $1"
  echo "$msg" | tee -a "$ALERTS_LOG"
}

# ─────────────────────────────────────────────
# C1: sprints.json integrity
# ─────────────────────────────────────────────
check_c1() {
  local result="PASS"
  local details=""

  # Valid JSON?
  if ! jq empty "$SPRINTS_JSON" 2>/dev/null; then
    out "C1  sprints.json:        VIOLATION — invalid JSON"
    VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
    return
  fi

  # Count in_progress
  local in_progress
  in_progress=$(jq '[.sprints[] | select(.status == "in_progress")] | length' "$SPRINTS_JSON")
  # Allow multiple in_progress if in different phases (parallel execution)
  local unique_phases
  unique_phases=$(jq '[.sprints[] | select(.status == "in_progress") | .phase] | unique | length' "$SPRINTS_JSON")
  if [ "$in_progress" -gt 1 ] && [ "$in_progress" -gt "$unique_phases" ]; then
    local ids
    ids=$(jq -r '[.sprints[] | select(.status == "in_progress") | .id] | join(", ")' "$SPRINTS_JSON")
    result="VIOLATION"
    details+="multiple in_progress: $ids; "
  fi

  # Committed without commitHash
  local missing_hash
  missing_hash=$(jq -r '.sprints[] | select((.status == "committed") and (.commitHash == null or .commitHash == "")) | .id' "$SPRINTS_JSON")
  if [ -n "$missing_hash" ]; then
    result="VIOLATION"
    details+="committed without hash: $(echo "$missing_hash" | tr '\n' ', ' | sed 's/,$//'); "
  fi

  # Batch commit detection (multiple sprints sharing same hash)
  local batch_commits
  batch_commits=$(jq -r '[.sprints[] | select(.commitHash != null and .commitHash != "") | .commitHash] | group_by(.) | map(select(length > 1)) | .[] | {hash: .[0], count: length} | "\(.hash) (\(.count) sprints)"' "$SPRINTS_JSON" 2>/dev/null)
  if [ -n "$batch_commits" ]; then
    if [ "$result" = "PASS" ]; then
      result="WARNING"
    fi
    details+="batch commits: $(echo "$batch_commits" | tr '\n' ', ' | sed 's/,$//'); "
    WARNING_COUNT=$((WARNING_COUNT + 1))
  fi

  if [ "$result" = "VIOLATION" ]; then
    out "C1  sprints.json:        VIOLATION — ${details%%; }"
    VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
  elif [ "$result" = "WARNING" ]; then
    out "C1  sprints.json:        WARNING — ${details%%; }"
  else
    out "C1  sprints.json:        PASS"
    PASS_COUNT=$((PASS_COUNT + 1))
  fi
}

# ─────────────────────────────────────────────
# C2: Evidence artifact completeness
# ─────────────────────────────────────────────
check_c2() {
  local result="PASS"
  local details=""

  # Get all sprint IDs from sprints.json
  local registered_ids
  registered_ids=$(jq -r '.sprints[].id' "$SPRINTS_JSON" 2>/dev/null)

  for dir in "$EVIDENCE_DIR"/*/; do
    [ -d "$dir" ] || continue
    local sprint_id
    sprint_id=$(basename "$dir")

    # Skip excluded directories
    if [ "$sprint_id" = "$EXCLUDED_EVIDENCE" ]; then
      continue
    fi

    # Check if directory has any files at all
    local file_count
    file_count=$(find "$dir" -maxdepth 1 -type f | wc -l)
    [ "$file_count" -eq 0 ] && continue

    # Check required artifacts (skip for light governance sprints)
    case "$sprint_id" in
      V-*|E-*|T-*.EXIT|T-*EXIT)
        : # Light governance — no required artifacts
        ;;
      *)
        for artifact in "${REQUIRED_ARTIFACTS[@]}"; do
          if [ ! -f "$dir/$artifact" ]; then
            result="VIOLATION"
            details+="$sprint_id missing $artifact; "
          fi
        done
        ;;
    esac

    # Orphan check disabled — historical evidence directories are valid records

  done
  if [ "$result" = "VIOLATION" ]; then
    out "C2  evidence artifacts:  VIOLATION — ${details%%; }"
    VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
  else
    out "C2  evidence artifacts:  PASS"
    PASS_COUNT=$((PASS_COUNT + 1))
  fi
}

# ─────────────────────────────────────────────
# C3: Cross-sign validity
# ─────────────────────────────────────────────
check_c3() {
  local result="PASS"
  local details=""

  for dir in "$EVIDENCE_DIR"/*/; do
    [ -d "$dir" ] || continue
    local sprint_id
    sprint_id=$(basename "$dir")
    [ "$sprint_id" = "$EXCLUDED_EVIDENCE" ] && continue

    # Skip light governance sprints (V-, E-, T-*EXIT)
    case "$sprint_id" in
      V-*|E-*|T-*.EXIT|T-*EXIT) continue ;;
    esac

    local cs_file="$dir/cross-sign.md"
    [ -f "$cs_file" ] || continue

    # Check verdict
    if ! grep -qi "Verdict: APPROVED" "$cs_file"; then
      result="VIOLATION"
      local actual_verdict
      actual_verdict=$(grep -i "Verdict:" "$cs_file" | head -1 || echo "(none)")
      details+="$sprint_id verdict not APPROVED: $actual_verdict; "
    fi

    # Check role separation
    local impl_role review_role
    impl_role=$(grep -i "Implementing Role:" "$cs_file" | head -1 | sed 's/.*Implementing Role:\s*//i' | tr -d '[:space:]' | tr '[:upper:]' '[:lower:]')
    review_role=$(grep -i "Reviewing Role:" "$cs_file" | head -1 | sed 's/.*Reviewing Role:\s*//i' | tr -d '[:space:]' | tr '[:upper:]' '[:lower:]')

    if [ -z "$impl_role" ] || [ -z "$review_role" ]; then
      result="VIOLATION"
      details+="$sprint_id missing role fields; "
    elif [ "$impl_role" = "$review_role" ]; then
      result="VIOLATION"
      details+="$sprint_id self-approval (both=$impl_role); "
    fi

    # Check substantiveness (more than 5 lines)
    local line_count
    line_count=$(wc -l < "$cs_file")
    if [ "$line_count" -lt 5 ]; then
      if [ "$result" = "PASS" ]; then result="WARNING"; fi
      details+="$sprint_id cross-sign only $line_count lines (boilerplate?); "
      WARNING_COUNT=$((WARNING_COUNT + 1))
    fi
  done

  if [ "$result" = "VIOLATION" ]; then
    out "C3  cross-signs:         VIOLATION — ${details%%; }"
    VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
  elif [ "$result" = "WARNING" ]; then
    out "C3  cross-signs:         WARNING — ${details%%; }"
  else
    out "C3  cross-signs:         PASS"
    PASS_COUNT=$((PASS_COUNT + 1))
  fi
}

# ─────────────────────────────────────────────
# C4: Enforcer checklist validity
# ─────────────────────────────────────────────
check_c4() {
  local result="PASS"
  local details=""

  for dir in "$EVIDENCE_DIR"/*/; do
    [ -d "$dir" ] || continue
    local sprint_id
    sprint_id=$(basename "$dir")
    [ "$sprint_id" = "$EXCLUDED_EVIDENCE" ] && continue

    # Skip light governance sprints (V-, E-, T-*EXIT)
    case "$sprint_id" in
      V-*|E-*|T-*.EXIT|T-*EXIT) continue ;;
    esac

    local cl_file="$dir/enforcer-checklist.txt"
    [ -f "$cl_file" ] || continue

    # Must contain RESULT: APPROVED
    if ! grep -q "RESULT: APPROVED" "$cl_file"; then
      result="VIOLATION"
      if grep -q "RESULT: BLOCKED" "$cl_file"; then
        details+="$sprint_id BLOCKED; "
      else
        details+="$sprint_id no APPROVED result; "
      fi
    fi
  done

  if [ "$result" = "VIOLATION" ]; then
    out "C4  checklists:          VIOLATION — ${details%%; }"
    VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
  else
    out "C4  checklists:          PASS"
    PASS_COUNT=$((PASS_COUNT + 1))
  fi
}

# ─────────────────────────────────────────────
# C5: Uncommitted evidence accumulation
# ─────────────────────────────────────────────
check_c5() {
  local result="PASS"
  local details=""

  cd "$PROJECT_ROOT"
  local untracked_dirs
  untracked_dirs=$(git status --porcelain 2>/dev/null | grep "^??" | grep "evidence/" | sed 's|^?? ||' | sed 's|/.*||' | sort -u | wc -l)

  if [ "$untracked_dirs" -gt 1 ]; then
    local dirs_list
    dirs_list=$(git status --porcelain 2>/dev/null | grep "^??" | grep "evidence/" | sed 's|^?? ||' | sed 's|/.*||' | sort -u | tr '\n' ', ' | sed 's/,$//')
    result="VIOLATION"
    details="$untracked_dirs untracked evidence dirs: $dirs_list"
  fi

  if [ "$result" = "VIOLATION" ]; then
    out "C5  uncommitted:         VIOLATION — $details"
    VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
  else
    out "C5  uncommitted:         PASS"
    PASS_COUNT=$((PASS_COUNT + 1))
  fi
}

# ─────────────────────────────────────────────
# C6: Destructive change detection
# ─────────────────────────────────────────────
check_c6() {
  local result="PASS"
  local details=""

  cd "$PROJECT_ROOT"

  # Check uncommitted changes in client/src/pages/
  local changed_pages
  changed_pages=$(git diff --name-only -- 'client/src/pages/*.tsx' 'client/src/pages/**/*.tsx' 2>/dev/null)

  for file in $changed_pages; do
    [ -z "$file" ] && continue
    local stat_line
    stat_line=$(git diff --numstat -- "$file" 2>/dev/null)
    [ -z "$stat_line" ] && continue

    local insertions deletions
    insertions=$(echo "$stat_line" | awk '{print $1}')
    deletions=$(echo "$stat_line" | awk '{print $2}')

    # Handle binary files
    [ "$insertions" = "-" ] && continue

    # Destructive threshold: deletions > insertions + 20
    if [ "$deletions" -gt $((insertions + 20)) ]; then
      result="WARNING"
      details+="DESTRUCTIVE_CHANGE $file: +$insertions -$deletions; "
      WARNING_COUNT=$((WARNING_COUNT + 1))
    fi

    # Check for data array deletions
    local removed_arrays
    removed_arrays=$(git diff -- "$file" 2>/dev/null | grep "^-" | grep -v "^---" | grep -cE "const\s+\w+\s*=\s*\[" || true)
    if [ "$removed_arrays" -gt 0 ]; then
      result="WARNING"
      details+="DATA_DELETION $file: $removed_arrays array declarations removed; "
      WARNING_COUNT=$((WARNING_COUNT + 1))
    fi

    # Check for UI element removal
    local removed_ui
    removed_ui=$(git diff -- "$file" 2>/dev/null | grep "^-" | grep -v "^---" | grep -cE "<Badge|<Button|Coming Soon" || true)
    if [ "$removed_ui" -gt 0 ]; then
      result="WARNING"
      details+="UI_ELEMENT_REMOVAL $file: $removed_ui elements removed; "
      WARNING_COUNT=$((WARNING_COUNT + 1))
    fi
  done

  # Check server routes for endpoint removal
  local changed_routes
  changed_routes=$(git diff --name-only -- 'server/routes/*.ts' 'server/routes/**/*.ts' 2>/dev/null)

  for file in $changed_routes; do
    [ -z "$file" ] && continue
    local old_count new_count
    old_count=$(git show HEAD:"$file" 2>/dev/null | grep -cE "router\.(get|post|put|patch|delete)\(" || true)
    new_count=$(grep -cE "router\.(get|post|put|patch|delete)\(" "$PROJECT_ROOT/$file" 2>/dev/null || true)

    if [ "$new_count" -lt "$old_count" ]; then
      result="WARNING"
      details+="ENDPOINT_REMOVAL $file: $old_count→$new_count endpoints; "
      WARNING_COUNT=$((WARNING_COUNT + 1))
    fi
  done

  # Also check staged changes
  local staged_pages
  staged_pages=$(git diff --cached --name-only -- 'client/src/pages/*.tsx' 'client/src/pages/**/*.tsx' 2>/dev/null)

  for file in $staged_pages; do
    [ -z "$file" ] && continue
    local stat_line
    stat_line=$(git diff --cached --numstat -- "$file" 2>/dev/null)
    [ -z "$stat_line" ] && continue

    local insertions deletions
    insertions=$(echo "$stat_line" | awk '{print $1}')
    deletions=$(echo "$stat_line" | awk '{print $2}')
    [ "$insertions" = "-" ] && continue

    if [ "$deletions" -gt $((insertions + 20)) ]; then
      result="WARNING"
      details+="DESTRUCTIVE_CHANGE (staged) $file: +$insertions -$deletions; "
      WARNING_COUNT=$((WARNING_COUNT + 1))
    fi
  done

  if [ "$result" = "WARNING" ]; then
    out "C6  destructive changes: WARNING — ${details%%; }"
  else
    out "C6  destructive changes: PASS"
    PASS_COUNT=$((PASS_COUNT + 1))
  fi
}

# ─────────────────────────────────────────────
# C7: Session state freshness
# ─────────────────────────────────────────────
check_c7() {
  local result="PASS"
  local details=""

  if [ ! -f "$SESSION_STATE" ]; then
    out "C7  session state:       VIOLATION — file does not exist"
    VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
    return
  fi

  local mtime now age_hours
  mtime=$(stat -c %Y "$SESSION_STATE")
  now=$(date +%s)
  age_hours=$(( (now - mtime) / 3600 ))

  if [ "$age_hours" -ge 4 ]; then
    result="VIOLATION"
    details="session-state.md is ${age_hours}h old (max 4h)"
  fi

  if [ "$result" = "VIOLATION" ]; then
    out "C7  session state:       VIOLATION — $details"
    VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
  else
    out "C7  session state:       PASS (${age_hours}h old)"
    PASS_COUNT=$((PASS_COUNT + 1))
  fi
}

# ─────────────────────────────────────────────
# C8: Hook integrity
# ─────────────────────────────────────────────
check_c8() {
  local result="PASS"
  local details=""

  if [ ! -f "$HOOK_SOURCE" ]; then
    out "C8  hook integrity:      VIOLATION — scripts/pre-commit.sh missing"
    VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
    return
  fi

  if [ ! -f "$HOOK_INSTALLED" ]; then
    out "C8  hook integrity:      VIOLATION — .git/hooks/pre-commit missing"
    VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
    return
  fi

  local hash_source hash_installed
  hash_source=$(md5sum "$HOOK_SOURCE" | awk '{print $1}')
  hash_installed=$(md5sum "$HOOK_INSTALLED" | awk '{print $1}')

  if [ "$hash_source" != "$hash_installed" ]; then
    result="VIOLATION"
    details="pre-commit.sh ($hash_source) != .git/hooks/pre-commit ($hash_installed)"
  fi

  if [ "$result" = "VIOLATION" ]; then
    out "C8  hook integrity:      VIOLATION — $details"
    VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
  else
    out "C8  hook integrity:      PASS"
    PASS_COUNT=$((PASS_COUNT + 1))
  fi
}

# ─────────────────────────────────────────────
# C9: Chain of custody
# ─────────────────────────────────────────────
check_c9() {
  local result="PASS"
  local details=""

  cd "$PROJECT_ROOT"

  # Get committed sprints with hashes
  local sprint_data
  sprint_data=$(jq -r '.sprints[] | select(.status == "committed" and .commitHash != null and .commitHash != "") | "\(.id)|\(.commitHash)"' "$SPRINTS_JSON" 2>/dev/null)

  local prev_commit_ts=0
  local batch_hashes=""

  while IFS='|' read -r sid hash; do
    [ -z "$sid" ] && continue

    # Verify hash exists in git log
    if ! git cat-file -e "$hash" 2>/dev/null; then
      result="VIOLATION"
      details+="$sid commitHash $hash not found in git; "
    else
      # Check chronological order
      local commit_ts
      commit_ts=$(git log -1 --format="%ct" "$hash" 2>/dev/null || echo "0")
      if [ "$commit_ts" -lt "$prev_commit_ts" ] && [ "$prev_commit_ts" -ne 0 ]; then
        if [ "$result" = "PASS" ]; then result="WARNING"; fi
        details+="$sid out of chronological order; "
        WARNING_COUNT=$((WARNING_COUNT + 1))
      fi
      prev_commit_ts="$commit_ts"
    fi

    batch_hashes+="$hash"$'\n'
  done <<< "$sprint_data"

  # Batch commit summary
  local batch_groups
  batch_groups=$(echo "$batch_hashes" | sort | uniq -c | sort -rn | awk '$1 > 1 {printf "%s (%d sprints), ", $2, $1}')
  if [ -n "$batch_groups" ]; then
    if [ "$result" = "PASS" ]; then result="WARNING"; fi
    details+="batch commits: ${batch_groups%, }; "
    WARNING_COUNT=$((WARNING_COUNT + 1))
  fi

  if [ "$result" = "VIOLATION" ]; then
    out "C9  chain of custody:    VIOLATION — ${details%%; }"
    VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
  elif [ "$result" = "WARNING" ]; then
    out "C9  chain of custody:    WARNING — ${details%%; }"
  else
    out "C9  chain of custody:    PASS"
    PASS_COUNT=$((PASS_COUNT + 1))
  fi
}

# ─────────────────────────────────────────────
# C10: Timestamp anomaly detection
# ─────────────────────────────────────────────
check_c10() {
  local result="PASS"
  local details=""
  local now
  now=$(date +%s)

  for dir in "$EVIDENCE_DIR"/*/; do
    [ -d "$dir" ] || continue
    local sprint_id
    sprint_id=$(basename "$dir")
    [ "$sprint_id" = "$EXCLUDED_EVIDENCE" ] && continue

    # Skip light governance sprints (V-, E-, T-*EXIT)
    case "$sprint_id" in
      V-*|E-*|T-*.EXIT|T-*EXIT) continue ;;
    esac

    local file_count
    file_count=$(find "$dir" -maxdepth 1 -type f | wc -l)
    [ "$file_count" -lt 2 ] && continue

    # Get all mtimes
    local mtimes
    mtimes=$(find "$dir" -maxdepth 1 -type f -exec stat -c %Y {} \; | sort -n)
    local min_t max_t
    min_t=$(echo "$mtimes" | head -1)
    max_t=$(echo "$mtimes" | tail -1)

    # All files within 2 seconds = anomaly
    if [ $((max_t - min_t)) -le 2 ] && [ "$file_count" -ge 3 ]; then
      if [ "$result" = "PASS" ]; then result="WARNING"; fi
      details+="TIMESTAMP_ANOMALY $sprint_id: all $file_count files within 2s; "
      WARNING_COUNT=$((WARNING_COUNT + 1))
    fi

    # Future timestamps
    while read -r ts; do
      if [ "$ts" -gt "$now" ]; then
        result="WARNING"
        details+="CLOCK_MANIPULATION $sprint_id: file timestamp in future; "
        WARNING_COUNT=$((WARNING_COUNT + 1))
        break
      fi
    done <<< "$mtimes"
  done

  if [ "$result" = "WARNING" ]; then
    out "C10 timestamps:          WARNING — ${details%%; }"
  else
    out "C10 timestamps:          PASS"
    PASS_COUNT=$((PASS_COUNT + 1))
  fi
}

# ─────────────────────────────────────────────
# C11: Plan file alignment
# ─────────────────────────────────────────────
check_c11() {
  local result="PASS"
  local details=""

  # Find plan files (don't hardcode name)
  local plan_files
  plan_files=$(ls "$PLANS_DIR"/*.md 2>/dev/null)

  if [ -z "$plan_files" ]; then
    out "C11 plan alignment:      PASS (no plan files found)"
    PASS_COUNT=$((PASS_COUNT + 1))
    return
  fi

  # Get latest sprint state from sprints.json
  local latest_in_progress latest_committed
  latest_in_progress=$(jq -r '[.sprints[] | select(.status == "in_progress")] | last | .id // "none"' "$SPRINTS_JSON" 2>/dev/null)
  latest_committed=$(jq -r '[.sprints[] | select(.status == "committed")] | last | .id // "none"' "$SPRINTS_JSON" 2>/dev/null)

  for plan_file in $plan_files; do
    local plan_name
    plan_name=$(basename "$plan_file")
    local status_line
    status_line=$(grep -i "^\*\*Status:\*\*\|^Status:" "$plan_file" 2>/dev/null | head -1)

    if [ -z "$status_line" ]; then
      continue  # Plan without status line — skip, not a violation
    fi

    # Check if plan references the project
    if ! grep -qi "nexxus\|replit\|v2.2" "$plan_file" 2>/dev/null; then
      continue  # Not related to this project
    fi

    # If plan says "complete" but there are in_progress sprints, that's wrong
    if echo "$status_line" | grep -qi "complete\|done\|finished" && [ "$latest_in_progress" != "none" ]; then
      result="VIOLATION"
      details+="$plan_name says complete but $latest_in_progress is in_progress; "
    fi
  done

  if [ "$result" = "VIOLATION" ]; then
    out "C11 plan alignment:      VIOLATION — ${details%%; }"
    VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
  else
    out "C11 plan alignment:      PASS"
    PASS_COUNT=$((PASS_COUNT + 1))
  fi
}

# ─────────────────────────────────────────────
# C13: Session state content accuracy
# ─────────────────────────────────────────────
check_c13() {
  local result="PASS"
  local details=""

  if [ ! -f "$SESSION_STATE" ]; then
    out "C13 session content:     PASS (no session-state.md)"
    PASS_COUNT=$((PASS_COUNT + 1))
    return
  fi

  # Extract "Working On:" line
  local working_on
  working_on=$(grep -i "Working On:" "$SESSION_STATE" 2>/dev/null | head -1)

  if [ -z "$working_on" ]; then
    out "C13 session content:     PASS (no Working On field)"
    PASS_COUNT=$((PASS_COUNT + 1))
    return
  fi

  # Extract sprint IDs from active sections only: "Working On:", "Status:", "Next Steps:"
  # Ignore historical references in "Decisions Made", "Completed", etc.
  local active_text
  active_text=$(python3 -c "
import re, sys

with open('$SESSION_STATE') as f:
    content = f.read()

# Extract only the active sections
sections_to_check = []
current_section = ''
for line in content.split('\n'):
    # Detect section headers
    if re.match(r'^##\s', line):
        current_section = line.lower()
    # Include lines from active sections
    if any(kw in current_section for kw in ['current task', 'next step', 'blocker', 'status']):
        sections_to_check.append(line)
    # Also include standalone Working On / Status lines not under a header
    if re.match(r'^\s*[-*]?\s*\*?\*?(Working On|Status|Next)\*?\*?\s*:', line, re.IGNORECASE):
        sections_to_check.append(line)

print('\n'.join(sections_to_check))
" 2>/dev/null)

  local session_sprints
  session_sprints=$(echo "$active_text" | grep -oE 'QA-S[0-9]+|FIX-S[0-9]+|P[0-9]+-S[0-9]+' | sort -u)

  if [ -z "$session_sprints" ]; then
    out "C13 session content:     PASS (no sprint IDs in active sections)"
    PASS_COUNT=$((PASS_COUNT + 1))
    return
  fi

  # Get sprint list from sprints.json with positions and statuses
  local check_result
  check_result=$(python3 -c "
import json, re, sys

with open('$SPRINTS_JSON') as f:
    data = json.load(f)

sprints = data.get('sprints', [])
if not sprints:
    print('PASS')
    sys.exit(0)

# Build position map: id -> (index, status)
pos_map = {}
for i, s in enumerate(sprints):
    pos_map[s['id']] = (i, s.get('status', 'unknown'))

latest_idx = len(sprints) - 1
latest_id = sprints[latest_idx]['id']

# Session sprint IDs (from active sections only)
session_ids = '''$session_sprints'''.strip().split('\n')
session_ids = [s.strip() for s in session_ids if s.strip()]

# Active section text for context checks
active_text = '''$active_text'''

violations = []

for sid in session_ids:
    if sid not in pos_map:
        continue
    s_idx, s_status = pos_map[sid]

    # Check if active section references a sprint 2+ positions behind latest
    if latest_idx - s_idx >= 2:
        violations.append(f'{sid} is {latest_idx - s_idx} sprints behind latest ({latest_id})')

    # Check 'next' for already committed sprint
    pattern_next = re.compile(rf'{re.escape(sid)}.*\bnext\b', re.IGNORECASE)
    if pattern_next.search(active_text) and s_status == 'committed':
        violations.append(f'{sid} marked next but already committed')

    # Check 'COMPLETE' for still in_progress sprint
    pattern_complete = re.compile(rf'{re.escape(sid)}.*\bCOMPLETE\b', re.IGNORECASE)
    if pattern_complete.search(active_text) and s_status == 'in_progress':
        violations.append(f'{sid} marked COMPLETE but still in_progress')

if violations:
    print('VIOLATION|' + '; '.join(violations))
else:
    print('PASS')
" 2>/dev/null)

  if echo "$check_result" | grep -q "^VIOLATION"; then
    details=$(echo "$check_result" | sed 's/^VIOLATION|//')
    out "C13 session content:     VIOLATION — $details"
    VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
  else
    out "C13 session content:     PASS"
    PASS_COUNT=$((PASS_COUNT + 1))
  fi
}

# ─────────────────────────────────────────────
# C14: Governance file integrity (uncommitted modifications)
# ─────────────────────────────────────────────
check_c14() {
  local result="PASS"
  local details=""

  cd "$PROJECT_ROOT"

  # Governance files that should not be modified without orchestrator role commit
  local gov_files="CLAUDE.md enforcement_harness.json scripts/pre-commit.sh scripts/check-file-scope.sh scripts/enforcer-checklist.sh scripts/commit.sh scripts/workflow-audit.sh scripts/watchdog.sh"

  for gf in $gov_files; do
    [ -f "$gf" ] || continue

    # Check if file has uncommitted changes (staged or unstaged)
    if git diff --name-only -- "$gf" 2>/dev/null | grep -q .; then
      result="VIOLATION"
      details+="$gf has unstaged changes; "
    fi
    if git diff --cached --name-only -- "$gf" 2>/dev/null | grep -q .; then
      result="VIOLATION"
      details+="$gf has staged changes; "
    fi

    # Check who last committed this file — should be orchestrator role
    local last_commit_msg
    last_commit_msg=$(git log -1 --format="%s" -- "$gf" 2>/dev/null)
    if [ -n "$last_commit_msg" ]; then
      # Extract role from commit message pattern [SPRINT-ID] or COMMIT_ROLE
      local commit_log
      commit_log=$(git log -1 --format="%H" -- "$gf" 2>/dev/null)
      if [ -n "$commit_log" ]; then
        local audit_role
        audit_role=$(git log -1 --format="%b" "$commit_log" 2>/dev/null | grep -oP 'role=\K\w+' || true)
        if [ -n "$audit_role" ] && [ "$audit_role" != "orchestrator" ]; then
          if [ "$result" = "PASS" ]; then result="WARNING"; fi
          details+="$gf last committed by role=$audit_role (expected orchestrator); "
          WARNING_COUNT=$((WARNING_COUNT + 1))
        fi
      fi
    fi
  done

  if [ "$result" = "VIOLATION" ]; then
    out "C14 governance files:    VIOLATION — ${details%%; }"
    VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
  elif [ "$result" = "WARNING" ]; then
    out "C14 governance files:    WARNING — ${details%%; }"
  else
    out "C14 governance files:    PASS"
    PASS_COUNT=$((PASS_COUNT + 1))
  fi
}

# ─────────────────────────────────────────────
# C15: Memory staleness (dev agent's memory files)
# ─────────────────────────────────────────────
check_c15() {
  local result="PASS"
  local details=""
  local now
  now=$(date +%s)

  local memory_dir="$HOME/.claude/projects/-home-ubuntu-Claude-store-nexxus2-2-replit/memory"

  if [ ! -d "$memory_dir" ]; then
    out "C15 memory staleness:    PASS (no memory directory)"
    PASS_COUNT=$((PASS_COUNT + 1))
    return
  fi

  # Check MEMORY.md freshness (index file — should be updated when memories change)
  local memory_index="$memory_dir/MEMORY.md"
  if [ -f "$memory_index" ]; then
    local mem_mtime mem_age_hours
    mem_mtime=$(stat -c %Y "$memory_index")
    mem_age_hours=$(( (now - mem_mtime) / 3600 ))
    if [ "$mem_age_hours" -ge 24 ]; then
      if [ "$result" = "PASS" ]; then result="WARNING"; fi
      details+="MEMORY.md is ${mem_age_hours}h old; "
      WARNING_COUNT=$((WARNING_COUNT + 1))
    fi
  fi

  # Check project_sprint_status.md — should track current sprint state
  local sprint_status="$memory_dir/project_sprint_status.md"
  if [ -f "$sprint_status" ]; then
    local ss_mtime ss_age_hours
    ss_mtime=$(stat -c %Y "$sprint_status")
    ss_age_hours=$(( (now - ss_mtime) / 3600 ))
    if [ "$ss_age_hours" -ge 8 ]; then
      if [ "$result" = "PASS" ]; then result="WARNING"; fi
      details+="project_sprint_status.md is ${ss_age_hours}h old; "
      WARNING_COUNT=$((WARNING_COUNT + 1))
    fi

    # Check if sprint status memory references current sprints
    local latest_sprint
    latest_sprint=$(jq -r '.sprints | last | .id' "$SPRINTS_JSON" 2>/dev/null)
    if [ -n "$latest_sprint" ] && ! grep -q "$latest_sprint" "$sprint_status" 2>/dev/null; then
      # Check the sprint before latest too (might be mid-transition)
      local prev_sprint
      prev_sprint=$(jq -r '.sprints[-2].id // ""' "$SPRINTS_JSON" 2>/dev/null)
      if [ -n "$prev_sprint" ] && ! grep -q "$prev_sprint" "$sprint_status" 2>/dev/null; then
        result="VIOLATION"
        details+="project_sprint_status.md doesn't reference $latest_sprint or $prev_sprint; "
      fi
    fi
  fi

  # Check session-state.md content vs last commit timestamp
  if [ -f "$SESSION_STATE" ]; then
    local last_commit_ts
    last_commit_ts=$(cd "$PROJECT_ROOT" && git log -1 --format="%ct" 2>/dev/null || echo "0")
    local session_mtime
    session_mtime=$(stat -c %Y "$SESSION_STATE")
    # Session state updated more than 2 hours before last commit = stale
    if [ $((last_commit_ts - session_mtime)) -gt 7200 ] && [ "$last_commit_ts" -gt 0 ]; then
      result="VIOLATION"
      details+="session-state.md last updated $(( (last_commit_ts - session_mtime) / 3600 ))h before latest commit; "
    fi
  fi

  if [ "$result" = "VIOLATION" ]; then
    out "C15 memory staleness:    VIOLATION — ${details%%; }"
    VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
  elif [ "$result" = "WARNING" ]; then
    out "C15 memory staleness:    WARNING — ${details%%; }"
  else
    out "C15 memory staleness:    PASS"
    PASS_COUNT=$((PASS_COUNT + 1))
  fi
}

# ─────────────────────────────────────────────
# C16: Drift detection (claims vs reality)
# ─────────────────────────────────────────────
check_c16() {
  local result="PASS"
  local details=""

  cd "$PROJECT_ROOT"

  # Drift 1: sprints.json claims "committed" — verify hash actually exists in git
  # (partially overlaps C9 but checks ALL, not just order)
  local phantom_commits
  phantom_commits=$(jq -r '.sprints[] | select(.status == "committed") | "\(.id)|\(.commitHash)"' "$SPRINTS_JSON" 2>/dev/null)
  while IFS='|' read -r sid hash; do
    [ -z "$sid" ] && continue
    [ -z "$hash" ] && continue
    if ! git cat-file -e "$hash" 2>/dev/null; then
      result="VIOLATION"
      details+="$sid claims commit $hash but hash not in git; "
    fi
  done <<< "$phantom_commits"

  # Drift 2: evidence directories exist for "committed" sprints but are not tracked by git
  local committed_ids
  committed_ids=$(jq -r '.sprints[] | select(.status == "committed") | .id' "$SPRINTS_JSON" 2>/dev/null)
  for sid in $committed_ids; do
    [ -z "$sid" ] && continue
    local edir="evidence/$sid"
    [ -d "$edir" ] || continue
    # Check if evidence dir is tracked in git
    if ! git ls-files --error-unmatch "$edir" >/dev/null 2>&1; then
      # Check if ANY file in the dir is tracked
      local tracked_count
      tracked_count=$(git ls-files "$edir" 2>/dev/null | wc -l)
      if [ "$tracked_count" -eq 0 ]; then
        result="VIOLATION"
        details+="$sid status=committed but evidence/ not in git; "
      fi
    fi
  done

  # Drift 3: Latest committed sprint's evidence should match what's in git at that hash
  local latest_committed_id latest_committed_hash
  latest_committed_id=$(jq -r '[.sprints[] | select(.status == "committed")] | last | .id // ""' "$SPRINTS_JSON" 2>/dev/null)
  latest_committed_hash=$(jq -r '[.sprints[] | select(.status == "committed")] | last | .commitHash // ""' "$SPRINTS_JSON" 2>/dev/null)

  if [ -n "$latest_committed_id" ] && [ -n "$latest_committed_hash" ] && git cat-file -e "$latest_committed_hash" 2>/dev/null; then
    # Check if the evidence dir existed at that commit
    local evidence_at_commit
    evidence_at_commit=$(git ls-tree --name-only "$latest_committed_hash" "evidence/$latest_committed_id/" 2>/dev/null | wc -l)
    if [ "$evidence_at_commit" -eq 0 ]; then
      if [ "$result" = "PASS" ]; then result="WARNING"; fi
      details+="$latest_committed_id evidence not found at commit $latest_committed_hash; "
      WARNING_COUNT=$((WARNING_COUNT + 1))
    fi
  fi

  # Drift 4: in_progress sprint count in sprints.json vs evidence dirs with incomplete artifacts
  local in_progress_ids
  in_progress_ids=$(jq -r '.sprints[] | select(.status == "in_progress") | .id' "$SPRINTS_JSON" 2>/dev/null)
  for sid in $in_progress_ids; do
    [ -z "$sid" ] && continue
    if [ ! -d "evidence/$sid" ]; then
      result="VIOLATION"
      details+="$sid status=in_progress but no evidence directory; "
    fi
  done

  # Drift 5: Check if working tree has changes in files that don't belong to the current sprint
  local current_sprint
  current_sprint=$(jq -r '[.sprints[] | select(.status == "in_progress")] | last | .id // ""' "$SPRINTS_JSON" 2>/dev/null)
  local all_changes
  all_changes=$(git diff --name-only 2>/dev/null || true)

  if [ -n "$current_sprint" ] && [ -n "$all_changes" ]; then
    # Count uncommitted changes outside evidence/{current_sprint}/
    local stray_changes
    stray_changes=$(echo "$all_changes" | grep -v "^evidence/${current_sprint}/" | grep -v "^evidence/watchdog" | grep -v "^evidence/ghost" || true)
    if [ -n "$stray_changes" ]; then
      local stray_count
      stray_count=$(echo "$stray_changes" | wc -l)
      if [ "$stray_count" -gt 0 ]; then
        # VIOLATION if server/ or client/src/ files are modified outside sprint scope
        local critical_stray
        critical_stray=$(echo "$stray_changes" | grep -E "^(server/|client/src/)" || true)
        if [ -n "$critical_stray" ]; then
          local crit_count
          crit_count=$(echo "$critical_stray" | wc -l)
          result="VIOLATION"
          details+="$crit_count application file(s) modified outside sprint scope: $(echo "$critical_stray" | head -3 | tr '\n' ', ' | sed 's/,$//'); "
        else
          if [ "$result" = "PASS" ]; then result="WARNING"; fi
          details+="$stray_count file(s) modified outside current sprint scope; "
          WARNING_COUNT=$((WARNING_COUNT + 1))
        fi
      fi
    fi
  elif [ -z "$current_sprint" ] && [ -n "$all_changes" ]; then
    # No sprint in_progress but working tree has changes
    local unsanctioned
    unsanctioned=$(echo "$all_changes" | grep -E "^(server/|client/src/)" || true)
    if [ -n "$unsanctioned" ]; then
      local unsanc_count
      unsanc_count=$(echo "$unsanctioned" | wc -l)
      result="VIOLATION"
      details+="$unsanc_count application file(s) modified with NO sprint in_progress: $(echo "$unsanctioned" | head -3 | tr '\n' ', ' | sed 's/,$//'); "
    fi
  fi

  if [ "$result" = "VIOLATION" ]; then
    out "C16 drift detection:     VIOLATION — ${details%%; }"
    VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
  elif [ "$result" = "WARNING" ]; then
    out "C16 drift detection:     WARNING — ${details%%; }"
  else
    out "C16 drift detection:     PASS"
    PASS_COUNT=$((PASS_COUNT + 1))
  fi
}

# ─────────────────────────────────────────────
# C17: Plan vs execution (declared files vs actual changes)
# ─────────────────────────────────────────────
check_c17() {
  local result="PASS"
  local details=""

  cd "$PROJECT_ROOT"

  # Find the latest in_progress sprint
  local current_sprint
  current_sprint=$(jq -r '[.sprints[] | select(.status == "in_progress")] | last | .id // ""' "$SPRINTS_JSON" 2>/dev/null)

  if [ -z "$current_sprint" ]; then
    out "C17 plan vs execution:   PASS (no in_progress sprint)"
    PASS_COUNT=$((PASS_COUNT + 1))
    return
  fi

  local pre_exec="evidence/$current_sprint/pre-execution-report.md"

  if [ ! -f "$pre_exec" ]; then
    out "C17 plan vs execution:   PASS (no pre-execution report yet)"
    PASS_COUNT=$((PASS_COUNT + 1))
    return
  fi

  # Check pre-execution report has a Declared Files section
  if ! grep -qi "## Declared Files\|## Files\|## Scope\|## File Scope" "$pre_exec"; then
    result="VIOLATION"
    details+="pre-execution-report.md missing '## Declared Files' section; "
  else
    # Extract declared file paths from the section
    local declared_files
    declared_files=$(python3 -c "
import re, sys

with open('$pre_exec') as f:
    content = f.read()

# Find the Declared Files section
in_section = False
files = []
for line in content.split('\n'):
    if re.match(r'^##\s+(Declared\s+)?Files|^##\s+(File\s+)?Scope', line, re.IGNORECASE):
        in_section = True
        continue
    if in_section and re.match(r'^##\s', line):
        break  # next section
    if in_section:
        # Extract file paths: lines starting with - or * followed by a path
        m = re.match(r'^\s*[-*]\s*\x60?([a-zA-Z0-9_./-]+\.[a-zA-Z]+)\x60?', line)
        if m:
            files.append(m.group(1))
        # Also match bare paths
        m2 = re.match(r'^\s*([a-zA-Z0-9_]+/[a-zA-Z0-9_./-]+)', line)
        if m2 and m2.group(1) not in files:
            files.append(m2.group(1))

for f in files:
    print(f)
" 2>/dev/null)

    if [ -z "$declared_files" ]; then
      if [ "$result" = "PASS" ]; then result="WARNING"; fi
      details+="Declared Files section exists but no file paths found; "
      WARNING_COUNT=$((WARNING_COUNT + 1))
    else
      # Compare against actual working tree changes
      local actual_changes
      actual_changes=$(git diff --name-only 2>/dev/null | grep -E "^(server/|client/src/|shared/)" || true)

      if [ -n "$actual_changes" ]; then
        # Find undeclared changes
        local undeclared=""
        while IFS= read -r changed_file; do
          [ -z "$changed_file" ] && continue
          if ! echo "$declared_files" | grep -qF "$changed_file"; then
            undeclared+="$changed_file, "
          fi
        done <<< "$actual_changes"

        if [ -n "$undeclared" ]; then
          result="VIOLATION"
          details+="undeclared changes: ${undeclared%, }; "
        fi
      fi
    fi
  fi

  if [ "$result" = "VIOLATION" ]; then
    out "C17 plan vs execution:   VIOLATION — ${details%%; }"
    VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
  elif [ "$result" = "WARNING" ]; then
    out "C17 plan vs execution:   WARNING — ${details%%; }"
  else
    out "C17 plan vs execution:   PASS"
    PASS_COUNT=$((PASS_COUNT + 1))
  fi
}

# ─────────────────────────────────────────────
# C18: Retroactive artifact detection
# ─────────────────────────────────────────────
check_c18() {
  local result="PASS"
  local details=""

  cd "$PROJECT_ROOT"

  # Check each in_progress sprint
  local in_progress_ids
  in_progress_ids=$(jq -r '.sprints[] | select(.status == "in_progress") | .id' "$SPRINTS_JSON" 2>/dev/null)

  for sid in $in_progress_ids; do
    [ -z "$sid" ] && continue

    local pre_exec="evidence/$sid/pre-execution-report.md"
    [ -f "$pre_exec" ] || continue

    local pre_exec_mtime
    pre_exec_mtime=$(stat -c %Y "$pre_exec")

    # Get the earliest mtime of any changed application file in the working tree
    local changed_app_files
    changed_app_files=$(git diff --name-only 2>/dev/null | grep -E "^(server/|client/src/|shared/)" || true)

    if [ -n "$changed_app_files" ]; then
      local earliest_change=999999999999
      while IFS= read -r cf; do
        [ -z "$cf" ] && continue
        [ -f "$cf" ] || continue
        local cf_mtime
        cf_mtime=$(stat -c %Y "$cf")
        if [ "$cf_mtime" -lt "$earliest_change" ]; then
          earliest_change=$cf_mtime
        fi
      done <<< "$changed_app_files"

      # If pre-execution report is more than 10 minutes newer than the earliest code change
      if [ "$earliest_change" -lt 999999999999 ] && [ $((pre_exec_mtime - earliest_change)) -gt 600 ]; then
        local delta_min=$(( (pre_exec_mtime - earliest_change) / 60 ))
        if [ "$result" = "PASS" ]; then result="WARNING"; fi
        details+="$sid pre-execution-report.md written ${delta_min}m AFTER earliest code change (appears retroactive); "
        WARNING_COUNT=$((WARNING_COUNT + 1))
      fi
    fi
  done

  # Also check recently committed sprints — VIOLATION for committed sprints (too late to fix)
  local last_committed
  last_committed=$(jq -r '[.sprints[] | select(.status == "committed")] | last | .id // ""' "$SPRINTS_JSON" 2>/dev/null)
    # Skip light governance for retroactive check
    case "$last_committed" in V-*|E-*|T-*.EXIT|T-*EXIT) last_committed="" ;; esac
  if [ -n "$last_committed" ]; then
    local lc_pre_exec="evidence/$last_committed/pre-execution-report.md"
    local lc_post="evidence/$last_committed/post-sprint-report.md"
    if [ -f "$lc_pre_exec" ] && [ -f "$lc_post" ]; then
      local pre_mt post_mt
      pre_mt=$(stat -c %Y "$lc_pre_exec")
      post_mt=$(stat -c %Y "$lc_post")
      # If pre-exec and post-sprint are within 2 minutes of each other, bulk-generated
      local gap=$(( post_mt - pre_mt ))
      if [ "$gap" -ge 0 ] && [ "$gap" -le 120 ]; then
        result="VIOLATION"
        details+="$last_committed pre-exec and post-sprint written ${gap}s apart (bulk-generated); "
      fi
    fi
  fi

  if [ "$result" = "VIOLATION" ]; then
    out "C18 retroactive artifacts:VIOLATION — ${details%%; }"
    VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
  elif [ "$result" = "WARNING" ]; then
    out "C18 retroactive artifacts:WARNING — ${details%%; }"
  else
    out "C18 retroactive artifacts:PASS"
    PASS_COUNT=$((PASS_COUNT + 1))
  fi
}

# ─────────────────────────────────────────────
# C19: Pre-execution report quality
# ─────────────────────────────────────────────
check_c19() {
  local result="PASS"
  local details=""

  cd "$PROJECT_ROOT"

  # Check all in_progress sprints
  local in_progress_ids
  in_progress_ids=$(jq -r '.sprints[] | select(.status == "in_progress") | .id' "$SPRINTS_JSON" 2>/dev/null)

  for sid in $in_progress_ids; do
    [ -z "$sid" ] && continue
    local pre_exec="evidence/$sid/pre-execution-report.md"

    # Sprint is in_progress but no pre-exec exists yet
    # Skip for light governance sprints (V-, E-, T-*EXIT)
    case "$sid" in
      V-*|E-*|T-*.EXIT|T-*EXIT)
        continue  # Light governance — no pre-exec required
        ;;
    esac
    local evidence_dir="evidence/$sid"
    if [ -d "$evidence_dir" ]; then
      local file_count
      file_count=$(find "$evidence_dir" -maxdepth 1 -type f -not -name "pre-execution-report.md" | wc -l)
      if [ "$file_count" -gt 0 ] && [ ! -f "$pre_exec" ]; then
        result="VIOLATION"
        details+="$sid has $file_count evidence files but NO pre-execution-report.md; "
        continue
      fi
    fi

    [ -f "$pre_exec" ] || continue

    # Check required sections
    local has_declared_files=false
    local has_success_criteria=false
    local has_objective=false

    grep -qi "## Declared Files\|## Files\|## Scope\|## File Scope" "$pre_exec" && has_declared_files=true
    grep -qi "## Success Criteria\|## Criteria\|## Exit Criteria\|## Acceptance" "$pre_exec" && has_success_criteria=true
    grep -qi "## Objective\|## Goal\|## Purpose\|## What" "$pre_exec" && has_objective=true

    if [ "$has_declared_files" = false ]; then
      result="VIOLATION"
      details+="$sid pre-exec missing ## Declared Files; "
    fi

    if [ "$has_success_criteria" = false ]; then
      result="VIOLATION"
      details+="$sid pre-exec missing ## Success Criteria; "
    fi

    if [ "$has_objective" = false ]; then
      if [ "$result" = "PASS" ]; then result="WARNING"; fi
      details+="$sid pre-exec missing ## Objective; "
      WARNING_COUNT=$((WARNING_COUNT + 1))
    fi

    # Check Declared Files section actually has file paths
    if [ "$has_declared_files" = true ]; then
      local path_count
      path_count=$(python3 -c "
import re
with open('$pre_exec') as f:
    content = f.read()
in_section = False
count = 0
for line in content.split('\n'):
    if re.match(r'^##\s+(Declared\s+)?Files|^##\s+(File\s+)?Scope', line, re.IGNORECASE):
        in_section = True
        continue
    if in_section and re.match(r'^##\s', line):
        break
    if in_section:
        if re.match(r'^\s*[-*]\s*\x60?[a-zA-Z0-9_./-]+\.[a-zA-Z]+', line):
            count += 1
        elif re.match(r'^\s*[a-zA-Z0-9_]+/[a-zA-Z0-9_./-]+', line):
            count += 1
print(count)
" 2>/dev/null)
      if [ "$path_count" = "0" ]; then
        result="VIOLATION"
        details+="$sid Declared Files section has 0 file paths; "
      fi
    fi

    # Check Success Criteria section has actual criteria (at least 1 bullet)
    if [ "$has_success_criteria" = true ]; then
      local criteria_count
      criteria_count=$(python3 -c "
import re
with open('$pre_exec') as f:
    content = f.read()
in_section = False
count = 0
for line in content.split('\n'):
    if re.match(r'^##\s+(Success\s+)?Criteria|^##\s+Exit\s+Criteria|^##\s+Acceptance', line, re.IGNORECASE):
        in_section = True
        continue
    if in_section and re.match(r'^##\s', line):
        break
    if in_section and (re.match(r'^\s*[-*]\s+\S', line) or re.match(r'^\s*\|\s*\S', line)):
        count += 1
print(count)
" 2>/dev/null)
      if [ "$criteria_count" = "0" ]; then
        result="VIOLATION"
        details+="$sid Success Criteria section has 0 criteria; "
      fi
    fi

    # Check minimum line count (pre-exec should be substantive, not a stub)
    local line_count
    line_count=$(wc -l < "$pre_exec")
    if [ "$line_count" -lt 10 ]; then
      if [ "$result" = "PASS" ]; then result="WARNING"; fi
      details+="$sid pre-exec only $line_count lines (too thin); "
      WARNING_COUNT=$((WARNING_COUNT + 1))
    fi
  done

  # Also check last committed sprint's pre-exec quality
  local last_committed
  last_committed=$(jq -r '[.sprints[] | select(.status == "committed")] | last | .id // ""' "$SPRINTS_JSON" 2>/dev/null)
    # Skip light governance for retroactive check
    case "$last_committed" in V-*|E-*|T-*.EXIT|T-*EXIT) last_committed="" ;; esac
  if [ -n "$last_committed" ]; then
    local lc_pre_exec="evidence/$last_committed/pre-execution-report.md"
    if [ -f "$lc_pre_exec" ]; then
      local lc_lines
      lc_lines=$(wc -l < "$lc_pre_exec")
      if [ "$lc_lines" -lt 8 ]; then
        if [ "$result" = "PASS" ]; then result="WARNING"; fi
        details+="$last_committed committed pre-exec only $lc_lines lines (hollow); "
        WARNING_COUNT=$((WARNING_COUNT + 1))
      fi
      # Check if it has success criteria
      if ! grep -qi "## Success Criteria\|## Criteria\|## Exit Criteria" "$lc_pre_exec"; then
        if [ "$result" = "PASS" ]; then result="WARNING"; fi
        details+="$last_committed committed pre-exec has no success criteria; "
        WARNING_COUNT=$((WARNING_COUNT + 1))
      fi
    fi
  fi

  if [ "$result" = "VIOLATION" ]; then
    out "C19 pre-exec quality:    VIOLATION — ${details%%; }"
    VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
  elif [ "$result" = "WARNING" ]; then
    out "C19 pre-exec quality:    WARNING — ${details%%; }"
  else
    out "C19 pre-exec quality:    PASS"
    PASS_COUNT=$((PASS_COUNT + 1))
  fi
}

# ─────────────────────────────────────────────
# C20: Sprint scope limit (max 5 application files)
# ─────────────────────────────────────────────
check_c20() {
  local result="PASS"
  local details=""

  cd "$PROJECT_ROOT"

  local current_sprint
  current_sprint=$(jq -r '[.sprints[] | select(.status == "in_progress")] | last | .id // ""' "$SPRINTS_JSON" 2>/dev/null)

  if [ -z "$current_sprint" ]; then
    out "C20 scope limit:         PASS (no in_progress sprint)"
    PASS_COUNT=$((PASS_COUNT + 1))
    return
  fi

  local pre_exec="evidence/$current_sprint/pre-execution-report.md"
  if [ ! -f "$pre_exec" ]; then
    out "C20 scope limit:         PASS (no pre-exec yet)"
    PASS_COUNT=$((PASS_COUNT + 1))
    return
  fi

  # Count declared application files
  local app_file_count
  app_file_count=$(python3 -c "
import re
with open('$pre_exec') as f:
    content = f.read()
in_section = False
count = 0
for line in content.split('\n'):
    if re.match(r'^##\s+(Declared\s+)?Files|^##\s+(File\s+)?Scope', line, re.IGNORECASE):
        in_section = True
        continue
    if in_section and re.match(r'^##\s', line):
        break
    if in_section:
        # Count only application files (server/, client/src/, shared/)
        if re.match(r'^\s*[-*]\s*\x60?(server/|client/src/|shared/)', line):
            count += 1
        elif re.match(r'^\s*(server/|client/src/|shared/)', line):
            count += 1
print(count)
" 2>/dev/null)

  # Check for scope override
  local has_override
  has_override=$(jq -r --arg id "$current_sprint" '.sprints[] | select(.id == $id) | .scope_override // false' "$SPRINTS_JSON" 2>/dev/null)

  if [ "$app_file_count" -gt 5 ] && [ "$has_override" != "true" ]; then
    result="VIOLATION"
    details+="$current_sprint declares $app_file_count application files (max 5). Split the sprint or get owner approval for scope_override."
  elif [ "$app_file_count" -gt 5 ] && [ "$has_override" = "true" ]; then
    if [ "$result" = "PASS" ]; then result="WARNING"; fi
    details+="$current_sprint declares $app_file_count application files (override approved)."
    WARNING_COUNT=$((WARNING_COUNT + 1))
  fi

  if [ "$result" = "VIOLATION" ]; then
    out "C20 scope limit:         VIOLATION — ${details%%; }"
    VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
  elif [ "$result" = "WARNING" ]; then
    out "C20 scope limit:         WARNING — ${details%%; }"
  else
    out "C20 scope limit:         PASS ($app_file_count application files declared)"
    PASS_COUNT=$((PASS_COUNT + 1))
  fi
}

# ─────────────────────────────────────────────
# C21: Dry-run required for integration sprints
# ─────────────────────────────────────────────
check_c21() {
  local result="PASS"
  local details=""

  cd "$PROJECT_ROOT"

  local current_sprint
  current_sprint=$(jq -r '[.sprints[] | select(.status == "in_progress")] | last | .id // ""' "$SPRINTS_JSON" 2>/dev/null)

  if [ -z "$current_sprint" ]; then
    out "C21 dry-run required:    PASS (no in_progress sprint)"
    PASS_COUNT=$((PASS_COUNT + 1))
    return
  fi

  local pre_exec="evidence/$current_sprint/pre-execution-report.md"
  if [ ! -f "$pre_exec" ]; then
    out "C21 dry-run required:    PASS (no pre-exec yet)"
    PASS_COUNT=$((PASS_COUNT + 1))
    return
  fi

  # Check if sprint touches integration files
  local integration_files="outbound.ts vendorProxy.ts sync.ts webhooks.ts"
  local touches_integration=false

  for ifile in $integration_files; do
    if grep -qi "$ifile" "$pre_exec" 2>/dev/null; then
      touches_integration=true
      break
    fi
  done

  # Also check for callMCP references in declared files
  if grep -qi "callMCP\|mcp\|integration\|webhook\|outbound" "$pre_exec" 2>/dev/null; then
    touches_integration=true
  fi

  if [ "$touches_integration" = true ]; then
    local dry_run="evidence/$current_sprint/dry-run-report.md"
    if [ ! -f "$dry_run" ]; then
      # Check if there's actual code changes (not just planning)
      local has_code_changes
      has_code_changes=$(git diff --name-only 2>/dev/null | grep -E "^(server/|client/src/|shared/)" | wc -l)
      if [ "$has_code_changes" -gt 0 ]; then
        result="VIOLATION"
        details+="$current_sprint touches integration files but no dry-run-report.md exists. Run a single-record test and document results before proceeding."
      fi
    fi
  fi

  if [ "$result" = "VIOLATION" ]; then
    out "C21 dry-run required:    VIOLATION — ${details%%; }"
    VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
  else
    out "C21 dry-run required:    PASS"
    PASS_COUNT=$((PASS_COUNT + 1))
  fi
}

# ─────────────────────────────────────────────
# SCAN MODE
# ─────────────────────────────────────────────
do_scan() {
  PASS_COUNT=0
  VIOLATION_COUNT=0
  WARNING_COUNT=0
  OUTPUT_LINES=()

  REPORT_ID="WD-$(date -u +%Y%m%d-%H%M%S)"
  REPORT_TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  out "=== WATCHDOG SCAN ==="
  out "Report-ID: $REPORT_ID"
  out "Timestamp: $REPORT_TS"
  out "Project: nexxus2.2_replit"
  out "Branch: $(cd "$PROJECT_ROOT" && git branch --show-current 2>/dev/null || echo 'unknown')"
  out "HEAD: $(cd "$PROJECT_ROOT" && git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
  out ""

  check_c1
  check_c2
  check_c3
  check_c4
  check_c5
  check_c6
  check_c7
  check_c8
  check_c9
  check_c10
  check_c11
  out "C12 protected paths:     N/A (scan mode)"
  check_c13
  check_c14
  check_c15
  check_c16
  check_c17
  check_c18
  check_c19
  check_c20
  check_c21

  out ""
  out "SUMMARY: $PASS_COUNT PASS, $VIOLATION_COUNT VIOLATION, $WARNING_COUNT WARNING"
  out "=== END SCAN ==="

  # Write report file
  printf '%s\n' "${OUTPUT_LINES[@]}" > "$REPORT_FILE"

  # Invalidate any existing ack (new report = must re-acknowledge)
  if [ -f "$ACK_FILE" ]; then
    local ack_report_id
    ack_report_id=$(grep "^Report-ID:" "$ACK_FILE" 2>/dev/null | sed 's/^Report-ID: *//')
    if [ "$ack_report_id" != "$REPORT_ID" ]; then
      echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Previous ack ($ack_report_id) invalidated by new report ($REPORT_ID)" >> "$ALERTS_LOG"
    fi
  fi
}

# ─────────────────────────────────────────────
# WATCH MODE
# ─────────────────────────────────────────────
do_watch() {
  if ! command -v inotifywait &>/dev/null; then
    echo "ERROR: inotifywait not found. Install: sudo apt-get install inotify-tools"
    exit 1
  fi

  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Watchdog WATCH mode started" | tee -a "$ALERTS_LOG"
  echo "Monitoring: evidence/, sprints.json, client/src/pages/, server/routes/, scripts/, .git/hooks/, CLAUDE.md, enforcement_harness.json"
  echo "Alerts log: $ALERTS_LOG"
  echo ""

  # Run initial scan
  do_scan

  # Watch the project root recursively, excluding noise directories.
  # Single inotifywait process — simple and reliable.
  trap "pkill -P $$ 2>/dev/null; exit 0" INT TERM EXIT

  LAST_ALERT=""
  LAST_ALERT_TIME=0

  inotifywait -m -r \
    --exclude '(node_modules|\.git/objects|\.git/logs|\.git/refs|\.git/COMMIT_EDITMSG|\.git/index|dist/|watchdog-report\.txt|watchdog-alerts\.log|\.swp$|~$)' \
    -e modify,create,delete,moved_to \
    "$PROJECT_ROOT" \
    2>/dev/null | while read -r dir event file; do

    changed_path="${dir}${file}"
    rel_path="${changed_path#$PROJECT_ROOT/}"

    # Dedup: skip if same path within 3 seconds
    now_ts=$(date +%s)
    this_key="${rel_path}"
    if [ "$this_key" = "$LAST_ALERT" ] && [ $((now_ts - LAST_ALERT_TIME)) -le 3 ]; then
      continue
    fi
    LAST_ALERT="$this_key"
    LAST_ALERT_TIME=$now_ts

    # C12: Protected path monitoring
    case "$rel_path" in
      scripts/*.sh)
        alert "C12 GOVERNANCE_FILE_CHANGED $rel_path ($event)"
        ;;
      .git/hooks/pre-commit)
        alert "C12 GOVERNANCE_FILE_CHANGED pre-commit hook ($event)"
        h1=$(md5sum "$HOOK_SOURCE" 2>/dev/null | awk '{print $1}')
        h2=$(md5sum "$HOOK_INSTALLED" 2>/dev/null | awk '{print $1}')
        if [ "$h1" != "$h2" ]; then
          alert "C8 HOOK_INTEGRITY_VIOLATION source ($h1) != installed ($h2)"
        fi
        ;;
      enforcement_harness.json)
        alert "C12 GOVERNANCE_FILE_CHANGED enforcement_harness.json ($event)"
        ;;
      CLAUDE.md)
        alert "C12 GOVERNANCE_FILE_CHANGED CLAUDE.md ($event)"
        ;;
      sprints.json)
        alert "C12 GOVERNANCE_FILE_CHANGED sprints.json ($event)"
        ip_count=$(jq '[.sprints[] | select(.status == "in_progress")] | length' "$SPRINTS_JSON" 2>/dev/null || echo "?")
        if [ "$ip_count" != "?" ] && [ "$ip_count" -gt 1 ]; then
          alert "C1 MULTIPLE_IN_PROGRESS $ip_count sprints have status in_progress"
        fi
        ;;
    esac

    # C6: Destructive change detection on page saves
    case "$rel_path" in
      client/src/pages/*.tsx)
        stat_line=$(cd "$PROJECT_ROOT" && git diff --numstat -- "$rel_path" 2>/dev/null)
        if [ -n "$stat_line" ]; then
          ins=$(echo "$stat_line" | awk '{print $1}')
          del=$(echo "$stat_line" | awk '{print $2}')
          if [ "$ins" != "-" ] && [ "$del" -gt $((ins + 20)) ]; then
            alert "C6 DESTRUCTIVE_CHANGE $rel_path — +$ins -$del"
          fi
          arr_del=$(cd "$PROJECT_ROOT" && git diff -- "$rel_path" 2>/dev/null | grep "^-" | grep -v "^---" | grep -cE "const\s+\w+\s*=\s*\[" || true)
          if [ "$arr_del" -gt 0 ]; then
            alert "C6 DATA_DELETION $rel_path — $arr_del array declarations removed"
          fi
          ui_del=$(cd "$PROJECT_ROOT" && git diff -- "$rel_path" 2>/dev/null | grep "^-" | grep -v "^---" | grep -cE "<Badge|<Button|Coming Soon" || true)
          if [ "$ui_del" -gt 0 ]; then
            alert "C6 UI_ELEMENT_REMOVAL $rel_path — $ui_del elements removed"
          fi
        fi
        ;;
    esac

    # Evidence directory changes
    case "$rel_path" in
      evidence/*)
        ev_sprint=$(echo "$rel_path" | cut -d/ -f2)
        if [ -n "$ev_sprint" ] && [ "$ev_sprint" != "$EXCLUDED_EVIDENCE" ]; then
          if ! jq -r '.sprints[].id' "$SPRINTS_JSON" 2>/dev/null | grep -qx "$ev_sprint"; then
            alert "C8 ORPHAN_EVIDENCE $ev_sprint has evidence but is not in sprints.json"
          fi
        fi
        ;;
    esac
  done
}

# ─────────────────────────────────────────────
# GHOST MESSAGE MODE (send a directive to dev agent)
# ─────────────────────────────────────────────
do_ghost_msg() {
  local severity="${1:-INFO}"
  shift
  local message="$*"

  if [ -z "$message" ]; then
    echo "Usage: $0 ghost-msg {INFO|DIRECTIVE|BLOCK} <message>"
    echo "  INFO      — Informational, dev agent should read but no action required"
    echo "  DIRECTIVE — Dev agent must acknowledge in pre-execution report"
    echo "  BLOCK     — Dev agent cannot commit until acknowledged"
    exit 1
  fi

  # Validate severity
  case "$severity" in
    INFO|DIRECTIVE|BLOCK) ;;
    *)
      echo "Invalid severity: $severity. Must be INFO, DIRECTIVE, or BLOCK."
      exit 1
      ;;
  esac

  local msg_id="GM-$(date -u +%Y%m%d-%H%M%S)"
  local ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  # Append to ghost log
  {
    echo "---"
    echo "Message-ID: $msg_id"
    echo "Timestamp: $ts"
    echo "Severity: $severity"
    echo "From: watchdog"
    echo "Message: $message"
    echo "Status: PENDING"
  } >> "$GHOST_LOG"

  echo "Ghost message sent:"
  echo "  ID: $msg_id"
  echo "  Severity: $severity"
  echo "  Message: $message"
}

# ─────────────────────────────────────────────
# VERIFY-GHOST MODE (called by pre-commit hook)
# ─────────────────────────────────────────────
do_verify_ghost() {
  # Exit codes:
  #   0 = no pending DIRECTIVE/BLOCK messages, or all acknowledged
  #   1 = unacknowledged DIRECTIVE/BLOCK messages exist

  if [ ! -f "$GHOST_LOG" ]; then
    echo "GHOST-CHECK: No ghost messages. PASS."
    exit 0
  fi

  # Find all PENDING messages with severity DIRECTIVE or BLOCK
  local pending_ids
  pending_ids=$(python3 -c "
import re, sys

with open('$GHOST_LOG') as f:
    content = f.read()

# Parse message blocks
blocks = content.split('---')
pending = []
for block in blocks:
    block = block.strip()
    if not block:
        continue
    msg_id = ''
    severity = ''
    status = ''
    message = ''
    for line in block.split('\n'):
        if line.startswith('Message-ID:'):
            msg_id = line.split(':', 1)[1].strip()
        elif line.startswith('Severity:'):
            severity = line.split(':', 1)[1].strip()
        elif line.startswith('Status:'):
            status = line.split(':', 1)[1].strip()
        elif line.startswith('Message:'):
            message = line.split(':', 1)[1].strip()
    if status == 'PENDING' and severity in ('DIRECTIVE', 'BLOCK'):
        pending.append(f'{msg_id}|{severity}|{message}')

if not pending:
    print('PASS')
else:
    for p in pending:
        print(p)
" 2>/dev/null)

  if [ "$pending_ids" = "PASS" ]; then
    echo "GHOST-CHECK: No pending directives. PASS."
    exit 0
  fi

  # Check if the current sprint's pre-execution report acknowledges these messages
  local sprint_id="${COMMIT_SPRINT:-}"
  local pre_exec="$EVIDENCE_DIR/${sprint_id}/pre-execution-report.md"

  local unacked=0
  while IFS='|' read -r msg_id severity message; do
    [ -z "$msg_id" ] && continue

    # Check pre-execution report for this message ID
    if [ -f "$pre_exec" ] && grep -q "$msg_id" "$pre_exec"; then
      continue  # Acknowledged
    fi

    echo "GHOST-CHECK: BLOCKED — Unacknowledged $severity message: $msg_id"
    echo "  Message: $message"
    echo "  Must reference $msg_id in $pre_exec"
    unacked=$((unacked + 1))
  done <<< "$pending_ids"

  if [ "$unacked" -gt 0 ]; then
    echo "GHOST-CHECK: BLOCKED — $unacked unacknowledged directive(s)."
    exit 1
  fi

  echo "GHOST-CHECK: All directives acknowledged. PASS."
  exit 0
}

# ─────────────────────────────────────────────
# GHOST-ACK MODE (mark a message as acknowledged — called after verification)
# ─────────────────────────────────────────────
do_ghost_ack() {
  local msg_id="${1:-}"

  if [ -z "$msg_id" ]; then
    echo "Usage: $0 ghost-ack <Message-ID>"
    exit 1
  fi

  if [ ! -f "$GHOST_LOG" ]; then
    echo "No ghost_messages.log found."
    exit 1
  fi

  # Update status from PENDING to ACKNOWLEDGED
  if grep -q "Message-ID: $msg_id" "$GHOST_LOG"; then
    python3 -c "
import re

with open('$GHOST_LOG') as f:
    content = f.read()

# Find the block with this message ID and change its status
blocks = content.split('---')
new_blocks = []
for block in blocks:
    if 'Message-ID: $msg_id' in block and 'Status: PENDING' in block:
        block = block.replace('Status: PENDING', 'Status: ACKNOWLEDGED')
    new_blocks.append(block)

with open('$GHOST_LOG', 'w') as f:
    f.write('---'.join(new_blocks))
" 2>/dev/null
    echo "Message $msg_id marked ACKNOWLEDGED."
  else
    echo "Message $msg_id not found in ghost log."
    exit 1
  fi
}

# ─────────────────────────────────────────────
# VERIFY-ACK MODE (called by pre-commit hook)
# ─────────────────────────────────────────────
do_verify_ack() {
  # Exit codes:
  #   0 = ack valid (or no report exists, or report has 0 violations)
  #   1 = ack missing/stale/invalid — commit should be blocked

  if [ ! -f "$REPORT_FILE" ]; then
    echo "WATCHDOG-ACK: No watchdog report found. PASS (first run)."
    exit 0
  fi

  # Check if report has violations
  local violation_count
  violation_count=$(grep -oP '\d+ VIOLATION' "$REPORT_FILE" | grep -oP '^\d+' || echo "0")
  if [ "$violation_count" = "0" ]; then
    echo "WATCHDOG-ACK: Report has 0 violations. PASS."
    exit 0
  fi

  # Report has violations — ack is required
  if [ ! -f "$ACK_FILE" ]; then
    echo "WATCHDOG-ACK: BLOCKED — Report has $violation_count violation(s) but no watchdog-ack.txt exists."
    echo "  The dev agent must read evidence/watchdog-report.txt and write evidence/watchdog-ack.txt."
    exit 1
  fi

  # Get report ID from report
  local report_id
  report_id=$(grep "^Report-ID:" "$REPORT_FILE" | sed 's/^Report-ID: *//')

  # Get ack'd report ID from ack
  local ack_report_id
  ack_report_id=$(grep "^Report-ID:" "$ACK_FILE" | sed 's/^Report-ID: *//')

  if [ "$ack_report_id" != "$report_id" ]; then
    echo "WATCHDOG-ACK: BLOCKED — Ack references $ack_report_id but current report is $report_id."
    echo "  The dev agent must re-read the latest watchdog-report.txt and update watchdog-ack.txt."
    exit 1
  fi

  # Check ack has the required fields
  if ! grep -q "^Acknowledged-By:" "$ACK_FILE"; then
    echo "WATCHDOG-ACK: BLOCKED — Ack missing 'Acknowledged-By:' field."
    exit 1
  fi

  if ! grep -q "^Sprint:" "$ACK_FILE"; then
    echo "WATCHDOG-ACK: BLOCKED — Ack missing 'Sprint:' field."
    exit 1
  fi

  # Check ack is not older than 1 hour
  local ack_mtime now ack_age
  ack_mtime=$(stat -c %Y "$ACK_FILE")
  now=$(date +%s)
  ack_age=$(( (now - ack_mtime) / 60 ))
  if [ "$ack_age" -gt 60 ]; then
    echo "WATCHDOG-ACK: BLOCKED — Ack is ${ack_age} minutes old (max 60). Re-acknowledge."
    exit 1
  fi

  # Check each violation in the report has a response in the ack
  local violations_in_report
  violations_in_report=$(grep "VIOLATION" "$REPORT_FILE" | grep -v "SUMMARY" | grep -v "===" || true)
  local unaddressed=0

  while IFS= read -r violation_line; do
    [ -z "$violation_line" ] && continue
    local check_id
    check_id=$(echo "$violation_line" | grep -oP '^C\d+' || true)
    if [ -n "$check_id" ] && ! grep -q "$check_id" "$ACK_FILE"; then
      echo "WATCHDOG-ACK: BLOCKED — Violation $check_id not addressed in ack."
      unaddressed=$((unaddressed + 1))
    fi
  done <<< "$violations_in_report"

  if [ "$unaddressed" -gt 0 ]; then
    echo "WATCHDOG-ACK: BLOCKED — $unaddressed violation(s) not addressed."
    exit 1
  fi

  echo "WATCHDOG-ACK: PASS — All violations acknowledged (report $report_id)."
  exit 0
}

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
case "${1:-}" in
  scan)
    do_scan
    ;;
  watch)
    do_watch
    ;;
  verify-ack)
    do_verify_ack
    ;;
  verify-ghost)
    do_verify_ghost
    ;;
  ghost-msg)
    shift
    do_ghost_msg "$@"
    ;;
  ghost-ack)
    shift
    do_ghost_ack "$@"
    ;;
  *)
    echo "Usage: $0 {scan|watch|verify-ack|verify-ghost|ghost-msg|ghost-ack}"
    echo "  scan         — Full audit (C1-C21), writes to stdout + evidence/watchdog-report.txt"
    echo "  watch        — Real-time monitoring via inotifywait, alerts to evidence/watchdog-alerts.log"
    echo "  verify-ack   — Check if watchdog-ack.txt matches latest report (used by pre-commit hook)"
    echo "  verify-ghost — Check if pending ghost directives are acknowledged (used by pre-commit hook)"
    echo "  ghost-msg    — Send a message to the dev agent: ghost-msg {INFO|DIRECTIVE|BLOCK} <message>"
    echo "  ghost-ack    — Mark a ghost message as acknowledged: ghost-ack <Message-ID>"
    exit 1
    ;;
esac
