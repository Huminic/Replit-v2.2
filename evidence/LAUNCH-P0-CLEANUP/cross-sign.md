# Cross-Sign — LAUNCH-P0-CLEANUP

Sprint: LAUNCH-P0-CLEANUP
Timestamp: 2026-04-13T16:24:00Z
Implementing Role: orchestrator
Reviewing Role: enforcer

## Review Summary

Two governance-only fixes, both operator-approved (2026-04-13):

1. **EF-12 vocabulary** (`scripts/enforcer-checklist.sh`): Added `completed` and `registered` to the valid sprint status set. These statuses are used by 200+ sprints in the existing registry. The enforcer was incorrectly blocking commits referencing sprints with these statuses. HARNESS_DEFECT classification — the enforcer was wrong, not the data.

2. **captain-check allowed commands** (`.claude/hooks/captain-check.sh`): Added `git add` and `git commit` to allowed git commands during active sprints (both planning mode and active sprint mode). Also added env-var-stripping logic so `COMMIT_ROLE=x COMMIT_SPRINT=y git commit` is correctly parsed. `git push` remains blocked — operator controls remote pushes.

No application code changed. No database changes. No UI changes. No external API calls.

Verdict: approved
