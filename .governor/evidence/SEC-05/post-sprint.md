# SEC-05 Post-Sprint Report — Marketing Section

**Sprint:** SEC-05
**Section:** S-5 (Marketing)
**Status:** COMPLETE
**Date:** 2026-03-26

## Changes Made

### I-115: Sub-menu Campaigns link removed (T3)
- **File:** `client/src/components/layout/SubMenuManager.tsx`
- **Change:** Removed line `{renderNavItem({ id: 'mk-campaigns', label: 'Campaigns', icon: Megaphone, path: '/marketing?tab=campaigns' })}` from the marketing case in the sub-menu panel.
- **Rationale:** The marketing page has no Campaigns tab (tabs are Dashboard, Agents, Studio, Insights). The sub-menu link pointed to `?tab=campaigns` which matched nothing, defaulting to Dashboard. This aligns with S-5.AC1 which explicitly removed campaigns from marketing.
- **Risk:** None. The Megaphone import is still used by the service section.

### I-113: Hardcoded metric trends removed (T2)
- **File:** `client/src/pages/marketing.tsx`
- **Change:** Removed `change: 0, trend: 'up' as const` from all 4 marketing metric tile definitions (mm-1 through mm-4).
- **Rationale:** The `/api/metrics/dashboard` endpoint does not return change or trend data. Hardcoding `change: 0, trend: 'up'` was misleading — it implied metrics were being compared across periods when no such comparison exists. The `MarketingMetricTile` interface already marks `change` and `trend` as optional (`?`), so omitting them is type-safe.
- **Risk:** None. The metric tiles still render correctly; the change/trend fields were not visually displayed in the current card component anyway (the renderDashboard function only shows label, icon, and value).

### S-5.AC12: Fallback behavior documented (T2)
- **File:** `client/src/pages/marketing.tsx`
- **Change:** Added explanatory comments above the `mktStats` variable and metric array explaining:
  1. The intentional fallback from `campaignStats.byDepartment.marketing.*` to global `campaignStats.*`
  2. Why change/trend data is omitted (backend doesn't support it yet)
- **Rationale:** Future developers need to understand that the global fallback is by design, not a bug. Without this comment, someone might "fix" the fallback and break the tiles for orgs without marketing-specific campaign data.

### Tests Added
- **File:** `tests/e2e/s5-marketing.spec.ts`
- **S-5.AC10:** Verifies marketing sub-menu section contains no `mk-campaigns` or `tab=campaigns`
- **S-5.AC11:** Verifies marketing metric definitions contain no `change: 0` or `trend: 'up'` hardcodes
- **S-5.AC12:** Verifies fallback documentation comment exists in marketing.tsx

## Build Verification
- `npx tsc --noEmit` — PASS (clean, no errors)

## Files Modified
1. `client/src/components/layout/SubMenuManager.tsx` — 1 line removed
2. `client/src/pages/marketing.tsx` — 4 lines changed, 4 comment lines added
3. `tests/e2e/s5-marketing.spec.ts` — 3 new test cases added

## Files NOT Modified (per rules)
- `client/src/lib/marketing-agents.ts` — not touched
- No server files modified

## Remaining Items (out of scope for this sprint)
- StudioGallery content verification (needs Playwright runtime)
- Marketing agent functional tests (AC8/AC9 already exist, require live API)
- Video Producer, Creative Director, Market Intel agent functional tests
