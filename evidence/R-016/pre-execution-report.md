# Pre-Execution Report: R-016 — Data Cleanup

**Sprint:** R-016
**Type:** Data + backend fix
**Date:** 2026-03-27
**Status:** AWAITING ENTRY GATE

## Objective
Remove test artifacts and fix agent instructions. Remove "Unauthorized Agent" from seed data or filter from API. Fix Data Guru "CRM Guru" hallucination by cleaning instructions. Stub out Tasks feature per operator directive.

## Declared Files
- server/seed.ts — I-138: remove or mark Unauthorized Agent
- server/routes/chat.ts — I-139: remove CRM Guru references from tool/instruction config; BL-084: stub Tasks
- tests/e2e/s3-sales.spec.ts — verify agent count fix

## Issues to Fix
| Issue | Description | Severity |
|---|---|---|
| I-138 | "Unauthorized Agent" test artifact visible in Sales agent list | MEDIUM |
| I-139 | Data Guru hallucinates "CRM Guru mode" — stale instruction reference | LOW |
| BL-084 | Tasks: stub or remove from chat tools, backlog for future | OPERATOR |

## UI Changes
None directly — seed data and backend changes.

## Test Plan
```
npx playwright test tests/e2e/s3-sales.spec.ts --project=sprint --reporter=list --workers=1
```

## Diff Reference
No previous attempt for these issues.

---

## Entry Gate Verification

**Date:** 2026-03-26
**Verifier:** Ghost

| Check | Result |
|---|---|
| Pre-exec exists | YES |
| Objective stated | YES — fix I-138, I-139, stub BL-084 |
| Issues listed | YES — I-138 (MED), I-139 (LOW), BL-084 (OPERATOR) |
| Declared files match sprints.json | YES — 3/3 match exactly |
| Worktree clean for declared files | YES — no uncommitted changes |
| Test plan present | YES |

ENTRY GATE: APPROVED
