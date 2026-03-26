#!/usr/bin/env bash
set -euo pipefail
# Archive acknowledged bus messages older than 24 hours
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARCHIVE="$ROOT/bus/archive"
mkdir -p "$ARCHIVE"
CUTOFF=$(date -d '24 hours ago' +%Y%m%dT%H%M%SZ 2>/dev/null || date -v-24H +%Y%m%dT%H%M%SZ 2>/dev/null || echo "")
if [[ -z "$CUTOFF" ]]; then
  echo "Could not calculate cutoff time"
  exit 1
fi
moved=0
for dir in "$ROOT"/bus/*/; do
  [[ "$(basename "$dir")" == "archive" ]] && continue
  [[ "$(basename "$dir")" == "deadletters" ]] && continue
  for msg in "$dir"*.json 2>/dev/null; do
    [[ -f "$msg" ]] || continue
    fname=$(basename "$msg")
    timestamp="${fname%%_*}"
    if [[ "$timestamp" < "$CUTOFF" ]]; then
      mv "$msg" "$ARCHIVE/"
      moved=$((moved + 1))
    fi
  done
done
echo "Archived $moved messages to $ARCHIVE/"
