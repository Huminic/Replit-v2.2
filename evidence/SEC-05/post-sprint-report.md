# Post-Sprint Report: SEC-05 — Marketing

**Sprint:** SEC-05
**Type:** Frontend fixes — sub-menu cleanup, metric trends, duplicate agent sections
**Date:** 2026-03-26T17:22:56Z
**Status:** COMPLETE

## Issues Fixed

### I-115: Sub-menu "Campaigns" link (Low) — FIXED
- Removed `mk-campaigns` nav item from SubMenuManager.tsx marketing case.
- The link pointed to `?tab=campaigns` which matched no tab on the page.
- Test: `I-115: sub-menu has no Campaigns link` — PASS

### I-113: Marketing metric trends hardcoded zero (Medium) — FIXED
- Removed `change: 0, trend: 'up' as const` from all 4 metric tiles in marketing.tsx.
- The `change` and `trend` fields are optional in the `MarketingMetricTile` interface, so omitting them is clean.
- Added comment documenting why: backend has no change data for marketing metrics.
- Test: `I-113: marketing metric tiles have no hardcoded change/trend` — PASS

### I-124: Marketing popout has duplicate agent sections (Medium) — FIXED
- The marketing case in SubMenuManager.tsx had TWO agent lists:
  1. A "MARKETING_AGENTS" section (client-side constants, custom icons/colors)
  2. A `renderAgentList('marketing')` call (API-fetched agents with search bar)
- Removed the `renderAgentList('marketing')` call, keeping the MARKETING_AGENTS section as the consolidated list.
- Test: `I-124: marketing sub-menu has no duplicate agent list` — PASS

### I-130: Agent favorites (Medium — ASSESS) — DEFERRED
- **Assessment:** Feasible with FE-only changes. The favorites API already exists (`/api/favorites` with path-based storage in `favorites` table). Agent favorites would use paths like `/marketing?tab=agents&agent=<id>`. No new API endpoints needed.
- **Recommendation:** Defer to a dedicated sprint. Requires UI work (star icon on agent cards, favorites section in sub-menu) but no backend changes.

### I-102: Photo Studio FE (Medium — DOCUMENT ONLY) — DOCUMENTED
- Added code comment in marketing.tsx noting this is a known FE/FAL integration issue tracked as I-102.
- Test: `I-102: Photo Studio FE/FAL issue documented in code` — PASS

## Files Modified

| File | Lines Changed | Description |
|---|---|---|
| `client/src/components/layout/SubMenuManager.tsx` | 605-636 | Removed Campaigns nav item (I-115), removed duplicate renderAgentList call (I-124) |
| `client/src/pages/marketing.tsx` | 87-91, 213-214 | Removed hardcoded change/trend (I-113), added I-102 comment |
| `tests/e2e/s5-marketing.spec.ts` | 119-160 | Added 4 new tests for I-115, I-113, I-124, I-102 |

## Build & Test Results

### TypeScript Check
```
npx tsc --noEmit
(clean — no errors)
```

### Playwright Tests
```
npx playwright test tests/e2e/s5-marketing.spec.ts --project=sprint --reporter=list --workers=1

Running 12 tests using 1 worker

  ✓   1 S-5.AC1/AC2: no Campaigns tab or campaign queries in code (12ms)
  ✓   2 S-5.AC3: tabs are Dashboard, Agents, Studio, Insights (7ms)
  ✓   3 S-5.AC4: Studio filter pills exist (21ms)
  ✓   4 S-5.AC5: Studio filter state management exists (4ms)
  ✓   5 S-5.AC6: 5 marketing agents with descriptions (949ms)
  ✓   6 S-5.AC7: dashboard metrics return values (1.1s)
  ✓   7 S-5.AC8: Photo Studio responds with image-related content (9.4s)
  ✓   8 I-115: sub-menu has no Campaigns link (5ms)
  ✓   9 I-113: marketing metric tiles have no hardcoded change/trend (5ms)
  ✓  10 I-124: marketing sub-menu has no duplicate agent list (3ms)
  ✓  11 I-102: Photo Studio FE/FAL issue documented in code (3ms)
  ✓  12 S-5.AC9: Copywriter produces ad copy (13.2s)

  12 passed (26.1s)
```

## Diff vs Attempt 1

Attempt 1 addressed I-115 and I-113 but those changes were reverted. This attempt:
- Re-applies I-115 (Campaigns link removal) and I-113 (hardcoded trend removal)
- Adds I-124 fix (duplicate agent sections) — NOT in attempt 1
- Adds I-102 documentation comment — NOT in attempt 1
- Adds I-130 feasibility assessment — NOT in attempt 1
- Adds 4 new regression tests to prevent future reverts

## EXIT GATE — Ghost Verification

| Check | Result |
|-------|--------|
| B1: Diff stats | PASS — 3 files, +51/-6 lines, all declared |
| B2: Entry gate approved | PASS |
| B3: Test file exists | PASS |
| B4: Test execution proof | PASS — 12/12 passed (26.1s), TSC clean |
| B5: Deployment | N/A |
| B6: Acceptance criteria | PASS — I-115 fixed, I-113 fixed, I-124 fixed, I-130 assessed, I-102 documented |
| B7: Failures | NONE |
| B8: Visual inspection | DEFERRED — no live browser in gate |
| B9: Scope containment | PASS — only declared files modified |
| B10: Ghost notes | Diffs verified line-by-line. Fixes are clean and minimal. Tests guard against revert. |
| B11: Rollback | SKIP |

**Critical code checks:**
- SubMenuManager.tsx: No "Campaigns" nav item. No `renderAgentList('marketing')` call. MARKETING_AGENTS section intact. PASS.
- marketing.tsx: All 4 metric tiles have NO `change` or `trend` fields. PASS.
- I-102 comment present in marketing.tsx. PASS.

Verdict: APPROVED

Sprint SEC-05 passes exit gate. Ready to commit.
