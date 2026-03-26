# Pre-Execution Report: SEC-06 — Manage

**Sprint:** SEC-06
**Type:** Frontend fixes — sub-menu alignment, User Chats documentation, billing documentation
**Date:** 2026-03-26
**Status:** AWAITING ENTRY GATE

## Objective

Fix sub-menu on Manage page to match all 5 page tabs (Insights, Hunches, System Log, User Chats, Billing). Document User Chats placeholder and FlexPrice billing gap.

## Declared Files

- `client/src/pages/management.tsx` — I-116 (User Chats documentation comment)
- `client/src/components/layout/SubMenuManager.tsx` — I-115 (sub-menu alignment)
- `tests/e2e/s6-manage.spec.ts` — test updates

## Issues to Fix

| Issue | Description | Severity | Change |
|---|---|---|---|
| I-115 | Sub-menu says "Dashboard", missing Hunches and Billing | Low | Remove Dashboard, add Hunches and Billing nav items (attempt 1 did this — verify/redo) |
| I-116 | User Chats is placeholder "coming soon" | Medium | DOCUMENT ONLY — add TODO comment referencing manifest ACs S-6.AC5/AC6 |
| I-105 | FlexPrice billing not configured | High | DOCUMENT ONLY — add comment noting I-105 blocker |

## UI Changes

- Sub-menu: Remove "Dashboard", add "Hunches" and "Billing" nav items (5 items total matching page tabs)

## Test Plan

### Test file:
- `tests/e2e/s6-manage.spec.ts`

### Exact commands:
```
npx playwright test tests/e2e/s6-manage.spec.ts --project=sprint --reporter=list --workers=1
```

## Diff Reference (Attempt 1)

From sec-attempt-1-diff.patch, attempt 1:
- SubMenuManager: removed Dashboard, made Insights default, added Hunches and Billing
- management.tsx: added TODO comment on User Chats

This attempt should match — no new issues beyond what attempt 1 addressed.

## Acceptance Criteria

S-6.AC1 through S-6.AC14 (from acceptance_criteria.md)

---

## ENTRY GATE — Ghost Verification

**Timestamp:** 2026-03-26T04:30Z
**Verdict: PASS (10/10)**

| Check | Description | Result |
|---|---|---|
| A1 | SEC-05 exit gate signed | PASS — `## EXIT GATE — Ghost Verification` found in SEC-05 post-sprint-report.md |
| A2 | Worktree clean (client/src, server, shared) | PASS — no modified files |
| A3 | Session state current | PASS — SEC-06 active sprint, phase qa_resolve_loop |
| A4 | Pre-execution report exists | PASS — evidence/SEC-06/pre-execution-report.md found |
| A5 | Objective section present | PASS — specific objective with 5 tab alignment and documentation scope |
| A6 | Test plan present | PASS — test file and exact playwright command specified |
| A7 | Declared files listed | PASS — 3 files with rationale (management.tsx, SubMenuManager.tsx, s6-manage.spec.ts) |
| A8 | Declared files match sprints.json | PASS — identical 3-file list in sprints.json declaredFiles |
| A9 | UI changes documented | PASS — sub-menu change (remove Dashboard, add Hunches + Billing) |
| A10 | Ghost messages | N/A — no Ghost messages section; none required |

**Gate status:** OPEN — Dev may proceed with SEC-06 execution.
