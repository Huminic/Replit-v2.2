#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
mkdir -p "$ROOT/logs"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
REPORT="$ROOT/logs/ghost-${STAMP}.json"
python3 - <<PY > "$REPORT"
import json
from pathlib import Path
root = Path('$ROOT')
checks = {}
violations = []
required_files = [
    root / 'state' / 'app-state.json',
    root / 'state' / 'active-phase.json',
    root / 'state' / 'lifecycle-state.json',
    root / 'state' / 'role-registry.json',
]
for p in required_files:
    ok = p.exists() and p.stat().st_size > 0
    checks[p.name] = ok
    if not ok:
        violations.append({'code': f'MISSING_{p.stem.upper()}', 'severity': 'major', 'message': f'{p} missing or empty'})
app_state = json.loads((root / 'state' / 'app-state.json').read_text()) if (root / 'state' / 'app-state.json').exists() else {}
active_phase = json.loads((root / 'state' / 'active-phase.json').read_text()) if (root / 'state' / 'active-phase.json').exists() else {}
lifecycle = json.loads((root / 'state' / 'lifecycle-state.json').read_text()) if (root / 'state' / 'lifecycle-state.json').exists() else {}
app_root = Path('/home/ubuntu/Claude-store/nexxus2.2_replit')
sprints_file = app_root / 'sprints.json'
registry = json.loads(sprints_file.read_text()) if sprints_file.exists() else {}

checks['phase_consistent'] = app_state.get('phase') == active_phase.get('phase') == lifecycle.get('current')
if not checks['phase_consistent']:
    violations.append({'code': 'PHASE_MISMATCH', 'severity': 'major', 'message': 'Phase mismatch across app-state, active-phase, lifecycle-state'})

active_sprint = registry.get('activeSprint')
checks['active_sprint_spec_exists'] = True
checks['active_sprint_evidence_exists'] = True
if active_sprint:
    spec = root / 'sprint-specs' / f'{active_sprint}.json'
    ev = root / 'evidence' / active_sprint
    checks['active_sprint_spec_exists'] = spec.exists()
    checks['active_sprint_evidence_exists'] = ev.exists()
    if not spec.exists():
        violations.append({'code': 'MISSING_ACTIVE_SPEC', 'severity': 'major', 'message': f'Missing spec for active sprint {active_sprint}'})
    if not ev.exists():
        violations.append({'code': 'MISSING_ACTIVE_EVIDENCE', 'severity': 'major', 'message': f'Missing evidence dir for active sprint {active_sprint}'})

# bus check removed — bus pattern superseded by file-based communication (ghost_messages.json)
# See GOVERNOR_REFERENCE.md: ".governor/bus/ — REMOVED"
status = 'pass' if not violations else 'violation'
report = {
    'reportId': f'GHOST-{Path("$REPORT").stem}',
    'status': status,
    'phase': active_phase.get('phase'),
    'activeSprint': active_sprint,
    'checks': checks,
    'violations': violations,
    'nextAction': 'HALO_CONTINUE' if not violations else 'HALO_REVIEW'
}
print(json.dumps(report, indent=2))
PY
cp "$REPORT" "$ROOT/state/last-ghost-report.json"
echo "Ghost report written: $REPORT"
