#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG="$ROOT/logs/stall.log"
mkdir -p "$ROOT/logs"
THRESHOLD_MINUTES="${STALL_THRESHOLD_MINUTES:-15}"
NOW=$(date +%s)
FOUND=0
shopt -s nullglob
for q in "$ROOT"/bus/*-to-*; do
  for msg in "$q"/*.json; do
    MTIME=$(stat -c %Y "$msg" 2>/dev/null || stat -f %m "$msg")
    AGE=$(( (NOW - MTIME) / 60 ))
    if (( AGE > THRESHOLD_MINUTES )); then
      echo "[$(date -u +%FT%TZ)] STALL candidate: $(basename "$msg") age=${AGE}m queue=$(basename "$q")" >> "$LOG"
      FOUND=1
    fi
  done
done
if (( FOUND == 0 )); then
  echo "[$(date -u +%FT%TZ)] No stall candidates" >> "$LOG"
fi
