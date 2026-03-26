#!/usr/bin/env bash
set -euo pipefail
if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <message_file> <from> <status>"
  exit 1
fi
MSG_FILE="$1"
FROM="$2"
STATUS="$3"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TO=$(python3 - <<PY
import json
from pathlib import Path
msg = json.loads(Path('$MSG_FILE').read_text())
print(msg['from'])
PY
)
MSG_ID=$(python3 - <<PY
import json
from pathlib import Path
msg = json.loads(Path('$MSG_FILE').read_text())
print(msg['id'])
PY
)
QUEUE="$ROOT/bus/${FROM}-to-${TO}"
mkdir -p "$QUEUE"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
cat > "$QUEUE/${STAMP}_ACK_${MSG_ID}.json" <<JSON
{
  "id": "ACK-$STAMP",
  "acksMessageId": "$MSG_ID",
  "from": "$FROM",
  "to": "$TO",
  "status": "$STATUS",
  "createdAt": "$STAMP"
}
JSON
echo "Ack written for $MSG_ID"
