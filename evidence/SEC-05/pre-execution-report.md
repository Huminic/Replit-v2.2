# Pre-Execution Report: SEC-05 — Marketing

**Sprint:** SEC-05
**Type:** Frontend fixes — sub-menu cleanup, metric trends, duplicate agent sections
**Date:** 2026-03-26
**Status:** ENTRY GATE APPROVED

## Objective

Fix issues on the Marketing page: remove "Campaigns" from sub-menu (already done in attempt 1 — verify/redo), remove hardcoded metric trend zeros, fix duplicate agent sections in popout, document remaining gaps.

## Declared Files

- `client/src/pages/marketing.tsx` — I-113 (metric trends)
- `client/src/components/layout/SubMenuManager.tsx` — I-115 (Campaigns link), I-124 (duplicate agent sections)
- `tests/e2e/s5-marketing.spec.ts` — test updates

## Issues to Fix

| Issue | Description | Severity | Change |
|---|---|---|---|
| I-115 | Sub-menu has "Campaigns" link but no Campaigns tab | Low | Verify removed (attempt 1 did this). Redo if reverted. |
| I-113 | Marketing metric trends hardcoded zero | Medium | Remove hardcoded change/trend fields or document BE limitation |
| I-124 | Marketing popout has duplicate agent sections ("Agents" and "AI Agents" with search) | Medium | Remove duplicate — keep one consolidated agent list |
| I-130 | Agent pages need favorites | Medium | Assess feasibility — defer if requires new APIs |
| I-102 | Photo Studio agent FE broken | Medium | Document status — this is a known FE/FAL integration issue |

## UI Changes

- Sub-menu: "Campaigns" link removed (if not already)
- Popout: duplicate agent sections consolidated into one
- Metric tiles: hardcoded trend data removed or documented

## Test Plan

### Test file:
- `tests/e2e/s5-marketing.spec.ts`

### Exact commands:
```
npx playwright test tests/e2e/s5-marketing.spec.ts --project=sprint --reporter=list --workers=1
```

## Diff Reference (Attempt 1)

From sec-attempt-1-diff.patch, attempt 1:
- SubMenuManager: removed "Campaigns" nav item from marketing section
- marketing.tsx: removed hardcoded change/trend fields from metric tiles, added fallback documentation comments

This attempt adds: I-124 (duplicate agent sections) which was NOT in attempt 1.

## Acceptance Criteria

S-5.AC1 through S-5.AC15 (from acceptance_criteria.md)

## Ghost Entry Gate
**Reviewed by:** ghost-agent
**Timestamp:** 2026-03-26T17:16:35Z
**Sprint:** SEC-05

### Initial Review (REJECTED)
**A1 Previous cleared:** FAIL — SEC-04 EXIT GATE: NOT CLEARED.
**A8 Match check:** MISMATCH — Sprint spec declared 4 files, pre-exec declared 3.
**All other checks (A2–A7, A9–A10):** PASS

### Re-gate Review
**Reviewed by:** ghost-agent
**Timestamp:** 2026-03-26T17:45:00Z

**A1 Previous cleared:** PASS — SEC-04 post-sprint-report.md contains "EXIT GATE: CLEARED". Verified by grep.
**A2 Worktree:** PASS — (no change from initial review)
**A3 Session state:** PASS — (no change from initial review)
**A4 Pre-exec exists:** PASS
**A5 Objective:** PASS
**A6 Test Plan:** PASS — npx playwright test tests/e2e/s5-marketing.spec.ts with project and reporter flags.
**A7 Declared Files:** PASS — 3 files listed (marketing.tsx, SubMenuManager.tsx, s5-marketing.spec.ts).
**A8 Match check:** PASS — Sprint spec SEC-05-marketing.json declaredFiles now lists 3 files matching pre-exec exactly (marketing-agents.ts removed from spec).
**A9 UI Changes:** PASS — section present with 3 UI changes documented.
**A10 Ghost messages:** PASS — no ghost_messages.json file (no pending blocks).

**Verdict: ENTRY GATE: APPROVED — 10/10 PASS**
