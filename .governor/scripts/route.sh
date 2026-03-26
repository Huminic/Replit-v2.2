#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG="$ROOT/logs/halo.log"
mkdir -p "$ROOT/logs"
shopt -s nullglob
for q in "$ROOT"/bus/*-to-*; do
  for msg in "$q"/*.json; do
    [[ -f "$msg" ]] || continue
    echo "[$(date -u +%FT%TZ)] HALO observed message $(basename "$msg") in $(basename "$q")" >> "$LOG"
  done
done
