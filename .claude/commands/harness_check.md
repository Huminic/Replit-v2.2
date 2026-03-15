---
description: Spot-check the governance enforcement harness — verifies sprint lifecycle, artifacts, session state, and plan alignment
---

You are performing a governance harness spot-check. Read `enforcement_harness.json` in the project root for the full rule set, then execute every check below. Report findings honestly. Do NOT fix anything. Do NOT rationalize. Binary results only.

## Check 1: sprints.json Integrity
- Read `sprints.json`
- Count sprints with status "in_progress" — must be 0 or 1. More than 1 = VIOLATION.
- For every "committed" sprint: verify `commitHash` field exists and is non-empty. Missing = VIOLATION.
- For every "in_progress" sprint: verify `evidence/{sprint-id}/` directory exists. Missing = VIOLATION.
- For every "planned" sprint: verify no evidence artifacts exist. Artifacts present = VIOLATION.

## Check 2: Evidence Artifact Completeness
- List all `evidence/*/` directories
- For each directory that has ANY files, check for ALL required artifacts:
  - pre-execution-report.md
  - post-sprint-report.md
  - cross-sign.md
  - enforcer-checklist.txt
- Missing artifact in a directory with other artifacts = VIOLATION. Report which file is missing and which sprint.

## Check 3: Cross-Sign Validity
- For each `evidence/*/cross-sign.md`:
  - Must contain "Verdict: APPROVED" (case insensitive)
  - Implementing Role must differ from Reviewing Role
  - Either missing or invalid = VIOLATION

## Check 4: Enforcer Checklist Validity
- For each `evidence/*/enforcer-checklist.txt`:
  - Must contain "RESULT: APPROVED"
  - If it contains "RESULT: BLOCKED" = VIOLATION

## Check 5: Uncommitted Evidence Accumulation
- Run `git status --porcelain` and count untracked `evidence/*/` directories
- More than 1 uncommitted evidence directory = VIOLATION
- List which directories are uncommitted

## Check 6: Session State Freshness and Accuracy
- Read `~/.claude/projects/-home-ubuntu-Claude-store-nexxus2-2-replit/memory/session-state.md`
- Check file mtime: older than 4 hours = VIOLATION
- Read the "Working On:" field — does it match the latest sprint activity visible in `evidence/`? Mismatch = VIOLATION
- Read the "Sprint Progress" section — does it match `sprints.json`? Mismatch = VIOLATION

## Check 7: Plan File Alignment
- Read `~/.claude/plans/reactive-wobbling-tome.md`
- Find the `**Status:**` line — does it match the actual sprint progress? Mismatch = VIOLATION
- Check remediation ledger: are FIXED items actually in a commit? (Check git log for the commit hash listed.) Mismatch = VIOLATION

## Check 8: Pre-Commit Hook Integrity
- Compare `scripts/pre-commit.sh` with `.git/hooks/pre-commit` using md5sum
- Mismatch = VIOLATION (hook not synced)

## Check 9: Chain of Custody
- For each committed sprint in sprints.json (in order), verify the commit exists: `git log --oneline | grep {commitHash}`
- Missing commit = VIOLATION
- Verify commits are in chronological order matching sprint sequence

## Check 10: Active Sprint Governance
- If there is a sprint with status "in_progress" in sprints.json:
  - Does its evidence directory exist?
  - Does it have a pre-execution-report.md?
  - Is the session state "Working On:" field referencing this sprint?
  - Any of these missing = VIOLATION

## Output Format

```
=== GOVERNANCE HARNESS SPOT-CHECK ===
Timestamp: [now]

Check 1 (sprints.json): CLEAN / VIOLATION — [detail]
Check 2 (artifacts): CLEAN / VIOLATION — [detail]
Check 3 (cross-signs): CLEAN / VIOLATION — [detail]
Check 4 (checklists): CLEAN / VIOLATION — [detail]
Check 5 (uncommitted): CLEAN / VIOLATION — [detail]
Check 6 (session state): CLEAN / VIOLATION — [detail]
Check 7 (plan alignment): CLEAN / VIOLATION — [detail]
Check 8 (hook integrity): CLEAN / VIOLATION — [detail]
Check 9 (chain of custody): CLEAN / VIOLATION — [detail]
Check 10 (active sprint): CLEAN / VIOLATION — [detail]

SUMMARY: X/10 CLEAN, Y VIOLATIONS
```

## Check 11: Watchdog System Health
- Verify `scripts/watchdog.sh` exists and is executable
- Run `./scripts/watchdog.sh scan` and capture the output — report its results inline
- If `evidence/watchdog-report.txt` exists with violations:
  - Check if `evidence/watchdog-ack.txt` exists
  - If ack exists: run `./scripts/watchdog.sh verify-ack` and report result
  - If ack missing: VIOLATION — unacknowledged watchdog violations
- If watchdog.sh doesn't exist: VIOLATION — watchdog not installed

## Check 12: Full Enforcement Chain Test
- Verify the complete enforcement chain is connected:
  - `.claude/hooks/context-check.sh` exists and is executable (pre-tool hook)
  - `.claude/settings.json` references context-check.sh (hook config)
  - `scripts/pre-commit.sh` contains "Gate 1.6" (watchdog gate)
  - `.git/hooks/pre-commit` matches `scripts/pre-commit.sh` (md5sum)
  - `scripts/watchdog.sh` exists and has scan/watch/verify-ack modes
  - `enforcement_harness.json` exists and is valid JSON (version 2.0)
- Any break in this chain = VIOLATION

## Output Format

```
=== GOVERNANCE HARNESS SPOT-CHECK ===
Timestamp: [now]

Check 1 (sprints.json): CLEAN / VIOLATION — [detail]
Check 2 (artifacts): CLEAN / VIOLATION — [detail]
Check 3 (cross-signs): CLEAN / VIOLATION — [detail]
Check 4 (checklists): CLEAN / VIOLATION — [detail]
Check 5 (uncommitted): CLEAN / VIOLATION — [detail]
Check 6 (session state): CLEAN / VIOLATION — [detail]
Check 7 (plan alignment): CLEAN / VIOLATION — [detail]
Check 8 (hook integrity): CLEAN / VIOLATION — [detail]
Check 9 (chain of custody): CLEAN / VIOLATION — [detail]
Check 10 (active sprint): CLEAN / VIOLATION — [detail]
Check 11 (watchdog health): CLEAN / VIOLATION — [detail]
Check 12 (enforcement chain): CLEAN / VIOLATION — [detail]

SUMMARY: X/12 CLEAN, Y VIOLATIONS
```

If ANY violations are found, list them at the bottom with specific file paths and what needs to be corrected. Do NOT correct them — just report.
