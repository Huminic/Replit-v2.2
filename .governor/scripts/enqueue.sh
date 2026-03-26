#!/usr/bin/env bash
set -euo pipefail
if [[ $# -lt 4 ]]; then
  echo "Usage: $0 <from> <to> <type> <json_payload_file> [sprint_id]"
  exit 1
fi
FROM="$1"
TO="$2"
TYPE="$3"
PAYLOAD_FILE="$4"
SPRINT_ID="${5:-none}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
QUEUE="$ROOT/bus/${FROM}-to-${TO}"
mkdir -p "$QUEUE"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RAND="$(printf '%04d' $((RANDOM % 10000)))"
OUT="$QUEUE/${STAMP}_${FROM}_${TO}_${TYPE}_${SPRINT_ID}_${RAND}.json"
python3 - <<PY > "$OUT"
import json
from pathlib import Path
payload = json.loads(Path('$PAYLOAD_FILE').read_text())
msg = {
  'id': 'MSG-$STAMP-$RAND',
  'from': '$FROM',
  'to': '$TO',
  'type': '$TYPE',
  'sprintId': None if '$SPRINT_ID' == 'none' else '$SPRINT_ID',
  'createdAt': '$STAMP',
  'requiresAck': True,
  'payload': payload,
}
print(json.dumps(msg, indent=2))
PY
echo "Queued: $OUT"
