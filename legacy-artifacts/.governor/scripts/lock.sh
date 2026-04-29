#!/usr/bin/env bash
set -euo pipefail
LOCK_FILE="$1"
shift
exec flock -n "$LOCK_FILE" "$@"
