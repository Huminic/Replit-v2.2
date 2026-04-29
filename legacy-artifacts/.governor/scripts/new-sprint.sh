#!/usr/bin/env bash
set -euo pipefail
if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <SPRINT_ID> <PHASE> <NAME>"
  exit 1
fi
SPRINT_ID="$1"
PHASE="$2"
NAME="$3"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_ROOT="/home/ubuntu/Claude-store/nexxus2.2_replit"
SPRINTS_FILE="$APP_ROOT/sprints.json"

# Validate sprint ID format (must start with P/R/G/I/E/M/D/T/L prefix followed by dash)
if ! echo "$SPRINT_ID" | grep -qE '^[PRGIEMDTL]-'; then
  echo "ERROR: Sprint ID must start with one of P/R/G/I/E/M/D/T/L followed by a dash."
  echo "Example: P-001, R-002, G-003"
  exit 1
fi

# Validate sprints.json exists
if [[ ! -f "$SPRINTS_FILE" ]]; then
  echo "ERROR: $SPRINTS_FILE not found. Ensure the app has a sprints.json in its root."
  exit 1
fi

SPEC="$ROOT/sprint-specs/${SPRINT_ID}.json"
EVIDENCE_DIR="$ROOT/evidence/$SPRINT_ID"
mkdir -p "$ROOT/sprint-specs" "$EVIDENCE_DIR"

cat > "$SPEC" <<JSON
{
  "id": "$SPRINT_ID",
  "category": "",
  "name": "$NAME",
  "phase": "$PHASE",
  "status": "proposed",
  "causedBy": "",
  "outcome": "",
  "codebaseArea": [],
  "acceptanceCriteria": [],
  "dimensions": {
    "layers": [],
    "featureDims": [],
    "testLevels": []
  },
  "wholeProductFit": "",
  "parallelizable": false,
  "declaredFiles": [],
  "commit": null,
  "evidence": ""
}
JSON

printf '# Pre-exec report for %s\n' "$SPRINT_ID" > "$EVIDENCE_DIR/pre-exec.md"
printf '# Post-sprint report for %s\n' "$SPRINT_ID" > "$EVIDENCE_DIR/post-sprint.md"

python3 - <<PY
import json
from pathlib import Path
sprints_path = Path('$SPRINTS_FILE')
data = json.loads(sprints_path.read_text())
data['activeSprint'] = '$SPRINT_ID'
data.setdefault('sprints', [])
data['sprints'].append({
    'id': '$SPRINT_ID',
    'name': '$NAME',
    'phase': '$PHASE',
    'status': 'proposed'
})
sprints_path.write_text(json.dumps(data, indent=2) + "\n")
PY
echo "Created sprint scaffold for $SPRINT_ID"
