#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# NEXXUS LAUNCH — STOP HOOK ORCHESTRATOR
# Purpose: Bounded autonomous loop controller.
# Does exactly 3 things:
#   1. Build gate (npx tsc --noEmit must pass)
#   2. Iteration counter with hard cap
#   3. Completion sentinel check
# ============================================================

APP_DIR="/home/ubuntu/Claude-store/nexxus2.2_replit"
STATE_DIR="$APP_DIR/.claude/state"
mkdir -p "$STATE_DIR"

MAX_ITERATIONS="${MAX_ITERATIONS:-6}"
ITER_FILE="$STATE_DIR/iteration_count"
COMPLETION_FILE="$STATE_DIR/launch-ready.ok"

# Initialize counter if missing
if [[ ! -f "$ITER_FILE" ]]; then
  echo 0 > "$ITER_FILE"
fi

ITER=$(cat "$ITER_FILE")
ITER=$((ITER + 1))
echo "$ITER" > "$ITER_FILE"

echo "============================================"
echo "STOP HOOK — ITERATION $ITER / $MAX_ITERATIONS"
echo "TIME: $(date -Iseconds)"
echo "============================================"

# --- Hard stop on max iterations ---
if [[ "$ITER" -gt "$MAX_ITERATIONS" ]]; then
  echo "MAX ITERATIONS REACHED ($MAX_ITERATIONS)"
  echo "Review progress. Reset with: echo 0 > $ITER_FILE"
  exit 1
fi

# --- Check completion sentinel ---
if [[ -f "$COMPLETION_FILE" ]]; then
  echo "LAUNCH-READY sentinel found."
  echo "Completion time: $(cat "$COMPLETION_FILE")"
  exit 0
fi

# --- Build gate ---
echo "--- Build check ---"
cd "$APP_DIR"
if ! npx tsc --noEmit 2>&1 | tail -5; then
  echo "BUILD FAILED — blocking next iteration"
  exit 1
fi

echo ""
echo "============================================"
echo "ITERATION $ITER COMPLETE — build passes"
echo "Remaining iterations: $((MAX_ITERATIONS - ITER))"
echo "============================================"

# Non-zero = allow next iteration
exit 1
