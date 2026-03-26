#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG="$ROOT/logs/ghost.log"
mkdir -p "$ROOT/logs"
{
  echo "[$(date -u +%FT%TZ)] Ghost sweep start"
  bash "$ROOT/scripts/verify.sh"
  echo "[$(date -u +%FT%TZ)] Ghost sweep end"
} >> "$LOG" 2>&1
