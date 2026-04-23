#!/bin/bash
# workflow-audit.sh — Traces every step of the agent workflow for audit purposes
# Usage: source this at the start of a sprint to enable audit logging
# Or run: ./scripts/workflow-audit.sh <sprint-name> <action> [details...]
#
# Actions:
#   init          — Start audit log for a sprint
#   agent-launch  — Log agent launch (role, task)
#   agent-done    — Log agent completion (role, result)
#   scope-check   — Log file scope check (role, files, result)
#   cross-sign    — Log cross-sign event (implementing role, reviewing role, verdict)
#   enforcer-run  — Log enforcer checklist run (result)
#   commit        — Log commit attempt (role, result)
#   violation     — Log a control violation (what happened)
#   note          — Log a free-form observation
#   summary       — Generate audit summary

SPRINT_NAME="$1"
ACTION="$2"
shift 2

if [ -z "$SPRINT_NAME" ] || [ -z "$ACTION" ]; then
  echo "Usage: ./scripts/workflow-audit.sh <sprint-name> <action> [details...]"
  echo ""
  echo "Actions: init, agent-launch, agent-done, scope-check, cross-sign,"
  echo "         enforcer-run, commit, violation, note, summary"
  exit 1
fi

AUDIT_DIR="evidence/${SPRINT_NAME}"
AUDIT_FILE="${AUDIT_DIR}/workflow-audit.log"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

log_entry() {
  echo "[$TIMESTAMP] $1" >> "$AUDIT_FILE"
}

case "$ACTION" in
  init)
    mkdir -p "$AUDIT_DIR"
    echo "# Workflow Audit Log: $SPRINT_NAME" > "$AUDIT_FILE"
    echo "# Started: $TIMESTAMP" >> "$AUDIT_FILE"
    echo "# Purpose: Verify agent controls and workflow are followed correctly" >> "$AUDIT_FILE"
    echo "" >> "$AUDIT_FILE"
    log_entry "AUDIT STARTED for $SPRINT_NAME"
    echo "Audit log initialized: $AUDIT_FILE"
    ;;

  agent-launch)
    ROLE="$1"
    TASK="$2"
    log_entry "AGENT-LAUNCH role=$ROLE task=\"$TASK\""
    echo "Logged: agent launch ($ROLE)"
    ;;

  agent-done)
    ROLE="$1"
    RESULT="$2"
    DETAILS="$3"
    log_entry "AGENT-DONE role=$ROLE result=$RESULT details=\"$DETAILS\""
    echo "Logged: agent done ($ROLE: $RESULT)"
    ;;

  scope-check)
    ROLE="$1"
    RESULT="$2"
    FILES="$3"
    log_entry "SCOPE-CHECK role=$ROLE result=$RESULT files=\"$FILES\""
    echo "Logged: scope check ($ROLE: $RESULT)"
    ;;

  cross-sign)
    IMPL_ROLE="$1"
    REVIEW_ROLE="$2"
    VERDICT="$3"
    if [ "$IMPL_ROLE" = "$REVIEW_ROLE" ]; then
      log_entry "VIOLATION cross-sign: same role ($IMPL_ROLE) attempted self-review"
      echo "VIOLATION LOGGED: self-review attempted ($IMPL_ROLE)"
    else
      log_entry "CROSS-SIGN implementing=$IMPL_ROLE reviewer=$REVIEW_ROLE verdict=$VERDICT"
      echo "Logged: cross-sign ($REVIEW_ROLE reviewed $IMPL_ROLE: $VERDICT)"
    fi
    ;;

  enforcer-run)
    RESULT="$1"
    PASS_COUNT="$2"
    FAIL_COUNT="$3"
    WARN_COUNT="$4"
    log_entry "ENFORCER-RUN result=$RESULT pass=$PASS_COUNT fail=$FAIL_COUNT warn=$WARN_COUNT"
    echo "Logged: enforcer run ($RESULT)"
    ;;

  commit)
    ROLE="$1"
    RESULT="$2"
    COMMIT_HASH="$3"
    log_entry "COMMIT role=$ROLE result=$RESULT hash=$COMMIT_HASH"
    echo "Logged: commit ($ROLE: $RESULT)"
    ;;

  violation)
    DESCRIPTION="$*"
    log_entry "VIOLATION $DESCRIPTION"
    echo "VIOLATION LOGGED: $DESCRIPTION"
    ;;

  note)
    DESCRIPTION="$*"
    log_entry "NOTE $DESCRIPTION"
    echo "Logged: note"
    ;;

  summary)
    echo ""
    echo "=== Workflow Audit Summary: $SPRINT_NAME ==="
    echo ""

    if [ ! -f "$AUDIT_FILE" ]; then
      echo "No audit log found for $SPRINT_NAME"
      exit 1
    fi

    TOTAL_ENTRIES=$(grep -c "^\[" "$AUDIT_FILE")
    LAUNCHES=$(grep -c "AGENT-LAUNCH" "$AUDIT_FILE")
    COMPLETIONS=$(grep -c "AGENT-DONE" "$AUDIT_FILE")
    SCOPE_CHECKS=$(grep -c "SCOPE-CHECK" "$AUDIT_FILE")
    CROSS_SIGNS=$(grep -c "CROSS-SIGN" "$AUDIT_FILE")
    ENFORCER_RUNS=$(grep -c "ENFORCER-RUN" "$AUDIT_FILE")
    COMMITS=$(grep -c "COMMIT " "$AUDIT_FILE")
    VIOLATIONS=$(grep -c "VIOLATION" "$AUDIT_FILE")
    NOTES=$(grep -c "NOTE " "$AUDIT_FILE")

    echo "Total log entries: $TOTAL_ENTRIES"
    echo "Agent launches:    $LAUNCHES"
    echo "Agent completions: $COMPLETIONS"
    echo "Scope checks:      $SCOPE_CHECKS"
    echo "Cross-signs:       $CROSS_SIGNS"
    echo "Enforcer runs:     $ENFORCER_RUNS"
    echo "Commits:           $COMMITS"
    echo "Violations:        $VIOLATIONS"
    echo "Notes:             $NOTES"
    echo ""

    # Workflow completeness checks
    echo "--- Workflow Checks ---"

    if [ "$LAUNCHES" -eq 0 ]; then
      echo "[GAP] No agents were launched — was work done outside the agent system?"
    else
      echo "[OK] $LAUNCHES agent(s) launched"
    fi

    if [ "$LAUNCHES" -ne "$COMPLETIONS" ]; then
      echo "[GAP] Agent launches ($LAUNCHES) != completions ($COMPLETIONS) — an agent may not have reported back"
    else
      echo "[OK] All launched agents reported completion"
    fi

    if [ "$CROSS_SIGNS" -eq 0 ] && [ "$COMMITS" -gt 0 ]; then
      echo "[GAP] Commit(s) logged but no cross-sign — was cross-sign bypassed?"
    elif [ "$CROSS_SIGNS" -gt 0 ]; then
      echo "[OK] Cross-sign recorded"
    fi

    if [ "$ENFORCER_RUNS" -eq 0 ] && [ "$COMMITS" -gt 0 ]; then
      echo "[GAP] Commit(s) logged but no enforcer run — was enforcer bypassed?"
    elif [ "$ENFORCER_RUNS" -gt 0 ]; then
      echo "[OK] Enforcer checklist was run"
    fi

    if [ "$SCOPE_CHECKS" -eq 0 ] && [ "$COMMITS" -gt 0 ]; then
      echo "[GAP] No scope checks logged — was file scope validated?"
    elif [ "$SCOPE_CHECKS" -gt 0 ]; then
      echo "[OK] File scope was checked"
    fi

    if [ "$VIOLATIONS" -gt 0 ]; then
      echo ""
      echo "--- VIOLATIONS ---"
      grep "VIOLATION" "$AUDIT_FILE"
    fi

    echo ""
    echo "--- Full Log ---"
    cat "$AUDIT_FILE"
    ;;

  *)
    echo "Unknown action: $ACTION"
    echo "Valid actions: init, agent-launch, agent-done, scope-check, cross-sign, enforcer-run, commit, violation, note, summary"
    exit 1
    ;;
esac
