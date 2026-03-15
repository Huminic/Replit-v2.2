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
  if [ "$in_progress" -gt 1 ]; then
    local ids
    ids=$(jq -r '[.sprints[] | select(.status == "in_progress") | .id] | join(", ")' "$SPRINTS_JSON")
    result="VIOLATION"
    details+="multiple in_progress: $ids; "
  fi

  # Committed without commitHash
  local missing_hash
  missing_hash=$(jq -r '.sprints[] | select(.status == "committed" and (.commitHash == null or .commitHash == "")) | .id' "$SPRINTS_JSON")
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

    # Check required artifacts
    for artifact in "${REQUIRED_ARTIFACTS[@]}"; do
      if [ ! -f "$dir/$artifact" ]; then
        result="VIOLATION"
        details+="$sprint_id missing $artifact; "
      fi
    done

    # Orphan check: evidence dir exists but sprint not in sprints.json
    if ! echo "$registered_ids" | grep -qx "$sprint_id"; then
      result="VIOLATION"
      details+="$sprint_id orphaned (not in sprints.json); "
    fi
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
# MAIN
# ─────────────────────────────────────────────
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
  *)
    echo "Usage: $0 {scan|watch|verify-ack}"
    echo "  scan       — Full audit, writes to stdout + evidence/watchdog-report.txt"
    echo "  watch      — Real-time monitoring via inotifywait, alerts to evidence/watchdog-alerts.log"
    echo "  verify-ack — Check if watchdog-ack.txt matches latest report (used by pre-commit hook)"
    exit 1
    ;;
esac
