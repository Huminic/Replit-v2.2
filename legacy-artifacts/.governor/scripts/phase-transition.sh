#!/usr/bin/env bash
set -euo pipefail
if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <reconnaissance|idea|ui_truth|backend|integration|qa_resolve_loop|deploy>"
  exit 1
fi
NEW_PHASE="$1"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
python3 - <<PY
import json, sys
from pathlib import Path
from datetime import datetime, timezone

root = Path('$ROOT')
new_phase = '$NEW_PHASE'

app_path = root / 'state' / 'app-state.json'
phase_path = root / 'state' / 'active-phase.json'
lifecycle_path = root / 'state' / 'lifecycle-state.json'
checklist_path = root / 'templates' / 'phase-checklist.json'

app = json.loads(app_path.read_text())
phase = json.loads(phase_path.read_text())
lifecycle = json.loads(lifecycle_path.read_text())
workflow = lifecycle['workflow']

if new_phase not in workflow:
    print(f"ERROR: '{new_phase}' is not a valid phase.", file=sys.stderr)
    print(f"Valid phases: {', '.join(workflow)}", file=sys.stderr)
    sys.exit(1)

current = lifecycle.get('current', phase.get('phase', 'idea'))
current_idx = workflow.index(current) if current in workflow else -1
new_idx = workflow.index(new_phase)

# Validate legal transitions
# reconnaissance -> any is always legal
# Otherwise only forward by exactly one step (no skipping)
if current != 'reconnaissance':
    if new_idx <= current_idx:
        print(f"ERROR: Cannot transition backward from '{current}' to '{new_phase}'.", file=sys.stderr)
        sys.exit(1)
    if new_idx != current_idx + 1:
        print(f"ERROR: Cannot skip phases. Current: '{current}', requested: '{new_phase}'.", file=sys.stderr)
        expected = workflow[current_idx + 1] if current_idx + 1 < len(workflow) else '(none)'
        print(f"Next legal phase: '{expected}'", file=sys.stderr)
        sys.exit(1)

# Print exit criteria for current phase as a reminder
if checklist_path.exists():
    checklist = json.loads(checklist_path.read_text())
    criteria = checklist.get(current, [])
    if criteria:
        print(f"Exit criteria for '{current}' (review before transitioning):")
        for c in criteria:
            print(f"  - {c}")
        print()

now = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
previous_phase = current

# Determine allowed next phases
new_idx_in_workflow = workflow.index(new_phase)
allowed_next = [workflow[new_idx_in_workflow + 1]] if new_idx_in_workflow + 1 < len(workflow) else []

# Update active-phase.json
phase['phase'] = new_phase
phase['allowedNextPhases'] = allowed_next
phase['previousPhase'] = previous_phase
phase['updatedAt'] = now
phase['updatedBy'] = 'phase-transition.sh'
phase_path.write_text(json.dumps(phase, indent=2) + "\n")

# Update app-state.json
app['phase'] = new_phase
app_path.write_text(json.dumps(app, indent=2) + "\n")

# Update lifecycle-state.json
lifecycle['current'] = new_phase
lifecycle_path.write_text(json.dumps(lifecycle, indent=2) + "\n")

print(f"Transitioned from '{previous_phase}' to '{new_phase}' at {now}")
PY
