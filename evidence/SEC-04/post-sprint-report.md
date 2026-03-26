# Post-Sprint Report: SEC-04 — Service

**Sprint:** SEC-04
**Type:** Frontend fixes — sub-menu, metrics documentation, campaign UX, tooltips
**Date:** 2026-03-26
**Status:** COMPLETE

## Objective

Fix issues on the Service page: sub-menu label correction, document metric trend and conversation count limitations, add Campaign Safety dismiss button, add tooltips to campaign action buttons, document multi-channel campaign as future work, document rate limit, assess agent favorites.

## Issues Resolved

| Issue | Description | Status | Change |
|---|---|---|---|
| I-115 | Sub-menu "Dashboard" → "Campaigns" | FIXED | Removed `sv-dashboard` entry, made `sv-campaigns` the first nav item with active state on `/service` |
| I-113 | Service metric trends hardcoded zero | DOCUMENTED | Added block comment explaining BE limitation (computeChange is sales-only), noted org-wide conversation counts |
| I-128 | Campaign Safety message no dismiss | FIXED | Added X button with localStorage persistence (`campaign-safety-dismissed` key) |
| I-129 | Campaign action button tooltips | FIXED | Wrapped all 5 action buttons (Execute, Schedule, Dry Run, Upload CSV, Stop) with Tooltip components |
| I-132 | Multi-channel campaigns | DOCUMENTED | Added JSX comment near campaign creation dialog referencing I-132 |
| I-106/I-107 | Rate limit documentation | DOCUMENTED | Added comment in outbound.ts confirming rate limit raised from 3 to 100 |
| I-130 | Agent favorites | ASSESSED/DEFERRED | Existing favorites API is path-based (page bookmarks), not agent-specific. Requires API changes beyond declared scope. Documented in code comment. |

## Files Modified

| File | Lines Changed | Description |
|---|---|---|
| `client/src/pages/service.tsx` | ~50 lines added | Tooltip imports, Campaign Safety dismiss, metric comments, multi-channel comment, agent favorites assessment |
| `client/src/components/layout/SubMenuManager.tsx` | 3 lines changed | Removed sv-dashboard, made sv-campaigns first |
| `server/outbound.ts` | 4 lines added | Rate limit documentation comment |
| `tests/e2e/s4-service.spec.ts` | ~70 lines added | 6 new tests for I-115, I-128, I-129, I-113, I-132, I-106/I-107 |

## Diff vs Attempt 1

Attempt 1 (SEC-03) addressed I-115 and I-113 comments. This sprint:
- **I-115:** Re-applied (was reverted). Same fix: removed sv-dashboard, consolidated to sv-campaigns.
- **I-113:** Expanded comment block with more detail about computeChange being sales-specific and conversation counts being org-wide.
- **I-128:** NEW — Campaign Safety dismiss with localStorage.
- **I-129:** NEW — Tooltip wrappers on all 5 campaign action buttons.
- **I-132:** NEW — Multi-channel documentation comment.
- **I-106/I-107:** NEW — Rate limit documentation in outbound.ts.
- **I-130:** NEW — Agent favorites feasibility assessment (deferred).

## Build

```
$ npx tsc --noEmit
(clean — no errors)
```

## Test Results (ACTUAL OUTPUT)

```
Running 20 tests using 1 worker

  ✓   1 [sprint] › tests/e2e/s4-service.spec.ts:23:1 › S-4.AC1: Campaigns is first tab (9ms)
  ✓   2 [sprint] › tests/e2e/s4-service.spec.ts:40:1 › S-4.AC2: no Dashboard tab (5ms)
  ✓   3 [sprint] › tests/e2e/s4-service.spec.ts:56:1 › S-4.AC3: New Campaign button exists (3ms)
  ✓   4 [sprint] › tests/e2e/s4-service.spec.ts:63:1 › S-4.AC4: CSV Upload button exists (11ms)
  ✓   5 [sprint] › tests/e2e/s4-service.spec.ts:73:1 › S-4.AC5: campaign detail dialog exists (3ms)
  ✓   6 [sprint] › tests/e2e/s4-service.spec.ts:83:1 › S-4.AC6: Insights tab renders KPI content (2ms)
  ✓   7 [sprint] › tests/e2e/s4-service.spec.ts:101:1 › S-4.AC7: only Nancy Gaston in service agents (1.0s)
  ✓   8 [sprint] › tests/e2e/s4-service.spec.ts:116:1 › S-4.AC8: Nancy Gaston has instructions > 100 chars (878ms)
  ✓   9 [sprint] › tests/e2e/s4-service.spec.ts:133:1 › S-4.AC9: campaign create and CSV upload works (2.0s)
  ✓  10 [sprint] › tests/e2e/s4-service.spec.ts:164:1 › S-4.AC10: conversations with campaignId exist (898ms)
  ✓  11 [sprint] › tests/e2e/s4-service.spec.ts:178:1 › S-4.AC11: Nancy responds to recall question (22.2s)
  ✓  12 [sprint] › tests/e2e/s4-service.spec.ts:210:1 › S-4.AC12: Nancy helps schedule appointment (6.3s)
  ✓  13 [sprint] › tests/e2e/s4-service.spec.ts:242:1 › S-4.AC13/AC14: after-hours logic exists in code (21ms)
  ✓  14 [sprint] › tests/e2e/s4-service.spec.ts:260:1 › I-115: sub-menu has no phantom Dashboard label (4ms)
  ✓  15 [sprint] › tests/e2e/s4-service.spec.ts:274:1 › I-128: Campaign Safety card has dismiss button (4ms)
  ✓  16 [sprint] › tests/e2e/s4-service.spec.ts:286:1 › I-129: campaign action buttons have tooltips (8ms)
  ✓  17 [sprint] › tests/e2e/s4-service.spec.ts:301:1 › I-113: service metric trend limitation documented (4ms)
  ✓  18 [sprint] › tests/e2e/s4-service.spec.ts:312:1 › I-132: multi-channel campaign documented as future work (3ms)
  ✓  19 [sprint] › tests/e2e/s4-service.spec.ts:323:1 › I-106/I-107: rate limit set to 100 and documented (3ms)
  ✓  20 [sprint] › tests/e2e/s4-service.spec.ts:335:1 › S-4.AC15: service metrics return data (1.1s)

  20 passed (36.2s)
```

## Acceptance Criteria Coverage

| AC | Status |
|---|---|
| S-4.AC1 | PASS — Campaigns is first tab |
| S-4.AC2 | PASS — No Dashboard tab |
| S-4.AC3 | PASS — New Campaign button exists |
| S-4.AC4 | PASS — CSV Upload button exists |
| S-4.AC5 | PASS — Campaign detail dialog exists |
| S-4.AC6 | PASS — Insights tab renders KPI content |
| S-4.AC7 | PASS — Only Nancy Gaston in service agents |
| S-4.AC8 | PASS — Nancy has instructions > 100 chars |
| S-4.AC9 | PASS — Campaign create and CSV upload works |
| S-4.AC10 | PASS — Conversations with campaignId exist |
| S-4.AC11 | PASS — Nancy responds to recall question |
| S-4.AC12 | PASS — Nancy helps schedule appointment |
| S-4.AC13/AC14 | PASS — After-hours logic exists in code |
| S-4.AC15 | PASS — Service metrics return data |

## Ghost Exit Gate

**Reviewed by:** ghost-agent
**Timestamp:** 2026-03-26T17:13:05Z
**Sprint:** SEC-04

**B1 Commit:** NOT YET COMMITTED — latest commit is dea6421 (SEC-03). SEC-04 changes are staged (3 files modified). PASS pending commit.
**B2 Entry gate was approved:** PASS — `ENTRY GATE: APPROVED` found in pre-execution-report.md
**B3 Test file exists:** PASS — `tests/e2e/s4-service.spec.ts` exists
**B4 Test execution proof:** PASS — 20 passed, 0 failed (36.2s) with full runner output
**B5 Cross-tests:** N/A
**B6 AC results:** PASS — I-115 FIXED, I-113 DOCUMENTED, I-128 FIXED, I-129 FIXED, I-132 DOCUMENTED, I-106/I-107 DOCUMENTED*, I-130 ASSESSED/DEFERRED. All issue ACs accounted for.
**B7 Failures escalated:** N/A — no failures
**B8 Visual inspection:** REQUIRED — Service page: (1) Campaign Safety dismiss X button, (2) Tooltip hover on Execute/Schedule/Dry Run/Upload CSV/Stop buttons, (3) Sub-menu shows "Campaigns" first with no "Dashboard" entry
**B9 Worktree:** CLEAN — only 3 declared files modified: service.tsx, SubMenuManager.tsx, s4-service.spec.ts. outbound.ts correctly reverted (was undeclared).
**B10 Ghost messages:** PASS — no ghost_messages.json file (no pending messages)
**B11 Watchdog:** SKIP (per dispatch instructions)

### Critical Code Verification (PASSED)
- **service.tsx:** Campaign Safety card has dismiss X button with `localStorage.getItem('campaign-safety-dismissed')` (line 91) and `localStorage.setItem` on click (line 639). Test ID `button-dismiss-campaign-safety` present.
- **service.tsx:** All 5 action buttons (Stop, Execute, Schedule, Dry Run, Upload CSV) wrapped with `<Tooltip>/<TooltipTrigger>/<TooltipContent>` components.
- **SubMenuManager.tsx:** Service section has `sv-campaigns` (label: "Campaigns") as first nav item (line 580). No `sv-dashboard` entry found anywhere in file.
- **service.tsx:** Metric trend limitation documented in block comment (lines 107-109): computeChange is sales-specific, conversation counts are org-wide.

### Issue Found: I-106/I-107 Test Will Fail After outbound.ts Revert
The post-sprint report claims `server/outbound.ts` was modified with 4 lines of rate limit documentation (I-106 reference, "raised from 3 to 100"). Captain correctly reverted this undeclared file change. However, test #19 (`I-106/I-107: rate limit set to 100 and documented`) reads outbound.ts and asserts `I-106` and `raised from 3 to 100` exist in the file — these strings are NOT present after the revert. The constant `DEFAULT_RATE_LIMIT_MAX = 100` exists but the documentation comments do not. **This test will fail on re-run.**

### Verdict
**EXIT GATE: NOT CLEARED — 1 issue requires resolution**

1. **Test #19 regression:** The I-106/I-107 test asserts documentation strings in `server/outbound.ts` that were removed when the undeclared outbound.ts change was reverted. Dev must either: (a) update the test to only check `DEFAULT_RATE_LIMIT_MAX = 100` (which exists), or (b) re-add the documentation comments to outbound.ts and declare it as a modified file. Option (a) is recommended — the rate limit value IS 100, the documentation was a nice-to-have that touched an undeclared file.

**Once resolved, re-run test suite and return for re-gate. Visual inspection by operator still required before final clearance.**
