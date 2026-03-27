# Agent Mistakes — Read Before Every Sprint

Common errors that waste time. Check your work against these before submitting.

## Evidence Format
- Cross-sign Verdict: plain text `Verdict: APPROVED` — NOT bold, NOT markdown
- Reviewing Role must be one of: frontend backend test integration scribe enforcer architect orchestrator governance
- Enforcer checklist must contain exactly `RESULT: APPROVED` (case-sensitive)
- Watchdog ack must contain `Acknowledged-By:` at start of line (case-sensitive)
- Watchdog ack filename is `watchdog-ack.txt` not `.md`
- Pre-exec declared files must be bare relative paths — no `~/` prefixes, no parenthetical notes
- Evidence directory is `evidence/<sprint-id>/` in app root
- Pre-exec filename is `pre-execution-report.md` not `pre-exec.md`
- Timestamps must use `date -u +%Y-%m-%dT%H:%M:%SZ` — never hardcode or estimate

## Ghost Gates
- Ghost writes verdict INTO the evidence file (appends to pre-exec or post-sprint)
- Dev checks for verdict string before proceeding — file-based communication only
- Ghost and Dev never communicate through conversation — only through file verdicts
- Entry gate string: `ENTRY GATE: APPROVED`
- Exit gate string: `EXIT GATE: CLEARED`

## Sprint Execution
- Do not touch files not in declaredFiles
- Do not modify sprints.json (Captain handles that)
- Do not skip the Ghost entry gate check before starting work
- Write post-sprint-report.md, not post-sprint.md (hook expects specific filename)
