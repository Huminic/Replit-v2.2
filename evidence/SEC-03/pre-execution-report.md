# Pre-Execution Report: SEC-03 — Sales

**Sprint:** SEC-03
**Type:** Frontend fixes — hardcoded data replacement, metric bug fix, agent page UX
**Date:** 2026-03-26
**Status:** AWAITING ENTRY GATE

## Objective

Fix 3 issues from E-013 audit and 1 from operator walkthrough on the Sales page: replace hardcoded Recent Activity feed with real API data, fix Conversion Rate change field bug, and add favorites + sub-menu bar to agent pages.

## Declared Files

- `client/src/pages/sales.tsx` — I-112 (activity feed), I-114 (conversion rate), I-130 (agent page)
- `client/src/components/layout/SubMenuManager.tsx` — I-130 (if sub-menu changes needed for sales agents)
- `tests/e2e/s3-sales.spec.ts` — test updates

## Issues to Fix

| Issue | Description | Severity | Change |
|---|---|---|---|
| I-112 | Recent Activity feed is hardcoded mock data (lines 591-603) | Medium | Replace static array with useQuery to /api/activity-log, filter for sales-related entries |
| I-114 | Conversion Rate change uses absolute rate as delta (line 115) | Medium | Set change to 0 with comment — API doesn't provide conversionRateChange |
| I-130 | Agent pages need favorites and sub-menu bar | Medium | Add favorites section and consistent sub-menu to Sales Agents tab |

## UI Changes

- Recent Activity: static list → real API data with timestamps
- Agent tab: add favorites and sub-menu bar consistent with other pages

## Test Plan

### Test file:
- `tests/e2e/s3-sales.spec.ts`

### Exact commands:
```
npx playwright test tests/e2e/s3-sales.spec.ts --project=sprint --reporter=list --workers=1
```

### What tests should verify:
- S-3.AC4: Dashboard KPI tile values match API source
- S-3.AC12: Recent Activity shows real data (not hardcoded)
- S-3.AC13: Conversion Rate change is 0 (not absolute rate)

## Diff Reference (Attempt 1)

From sec-attempt-1-diff.patch, attempt 1 changes in sales.tsx:
- Replaced hardcoded activity feed with useQuery to /api/activity-log?limit=10
- Set Conversion Rate change to 0 with comment
- Added comments on Waiting on Response and Appointments Set hardcoded change values

This attempt adds: I-130 (agent page favorites + sub-menu bar) which was NOT in attempt 1.

## Acceptance Criteria

S-3.AC1 through S-3.AC16 (from acceptance_criteria.md)

## Ghost Entry Gate
**Reviewed by:** ghost-agent
**Timestamp:** 2026-03-26T16:55:41Z
**Sprint:** SEC-03
**A1 Previous cleared:** PASS — SEC-01 EXIT GATE: CLEARED (SEC-02 does not exist as a sprint)
**A2 Worktree:** clean — no application files in client/src/, server/, shared/
**A3 Session state:** PASS — SEC-03 referenced in session-state.md line 88
**A4 Pre-exec exists:** PASS
**A5 Objective:** PASS
**A6 Test Plan:** PASS — npx playwright test tests/e2e/s3-sales.spec.ts
**A7 Declared Files:** PASS — 3 files listed (sales.tsx, SubMenuManager.tsx, s3-sales.spec.ts)
**A8 Match check:** MATCH — pre-exec declares same 3 files as SEC-03-sales.json declaredFiles
**A9 UI Changes:** PASS — section present with 2 UI changes documented
**A10 Ghost messages:** PASS — messages array empty
**ENTRY GATE: APPROVED**
