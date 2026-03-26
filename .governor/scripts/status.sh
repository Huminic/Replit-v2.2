#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo '=== APP STATE ==='
cat "$ROOT/state/app-state.json"
echo
echo '=== ACTIVE PHASE ==='
cat "$ROOT/state/active-phase.json"
echo
echo '=== ROLE REGISTRY ==='
cat "$ROOT/state/role-registry.json"
echo
echo '=== SPRINTS ==='
APP_ROOT="/home/ubuntu/Claude-store/nexxus2.2_replit"
if [[ -f "$APP_ROOT/sprints.json" ]]; then
  cat "$APP_ROOT/sprints.json"
else
  echo '(no sprints.json found at app root)'
fi
echo
echo '=== QUEUE COUNTS ==='
for q in "$ROOT"/bus/*-to-*; do
  c=$(find "$q" -maxdepth 1 -type f | wc -l | tr -d ' ')
  echo "$(basename "$q"): $c"
done
echo
echo '=== LAST GHOST REPORT ==='
if [[ -f "$ROOT/state/last-ghost-report.json" ]]; then
  cat "$ROOT/state/last-ghost-report.json"
else
  echo '{}'
fi
