# SEC-04 Post-Sprint Report — Service Section

**Sprint:** SEC-04
**Agent:** Dev
**Date:** 2026-03-26
**Status:** COMPLETE

## Changes Made

### I-115: Sub-menu "Dashboard" label (T3) — FIXED
**File:** `client/src/components/layout/SubMenuManager.tsx`
**Change:** Removed the phantom "Dashboard" nav item (`sv-dashboard`) and its duplicate "Campaigns" entry (`sv-campaigns`). Replaced with a single "Campaigns" item (`sv-campaigns`) that links to `/service` (which loads Campaigns as default tab). This eliminates the confusing mismatch where the sub-menu said "Dashboard" but no Dashboard tab existed.
**Lines affected:** 580-582 (3 lines replaced with 2)

### I-113: Service metric trends hardcoded to zero (T2) — DOCUMENTED
**File:** `client/src/pages/service.tsx`
**Change:** Added code comment explaining why `change: 0, trend: 'up'` is hardcoded. Investigation confirmed:
- The `/api/metrics/dashboard` endpoint does NOT return period-over-period change data for service metrics
- The `computeChange()` function exists in `server/routes/insights.ts` but is sales-pipeline-specific
- Fixing this requires a BE change to expose delta data per department in the dashboard response
**Lines affected:** Comment block added above serviceMetrics array (~line 104)
**Why no code fix:** The sprint rules prohibit server file modifications. No client-side data exists to compute real trends. Inventing fake data would violate sprint rules.

### S-4.AC15: Conversation counts not service-filtered (T2) — DOCUMENTED
**File:** `client/src/pages/service.tsx`
**Change:** Added code comment on the Open Conversations and Total Conversations metric tiles explaining:
- `metrics.conversationCounts.open` and `.total` are org-wide, not department-filtered
- The server query (`storage.ts` ~L687) groups conversations by status and channel only, not department
- Fixing requires BE change to add `conversationCounts.byDepartment`
**Lines affected:** Comment block added above svm-4 and svm-5 tiles (~line 112)
**Why no code fix:** No department-filtered conversation data is available from the API. Cannot filter client-side without the data. Server modification prohibited by sprint scope.

## Build Verification

- `npx tsc --noEmit` — PASS (clean, no errors)

## Files Modified

1. `client/src/components/layout/SubMenuManager.tsx` — sub-menu label fix
2. `client/src/pages/service.tsx` — documentation comments for API limitations

## Files NOT Modified

- `tests/e2e/s4-service.spec.ts` — no behavioral changes to test (label fix is cosmetic, comments are non-functional)
- All server files — per sprint rules

## Remaining Issues (require BE work, out of scope)

| Issue | What's Needed | Priority |
|---|---|---|
| I-113 | BE: Add change/trend data to `/api/metrics/dashboard` for service department | T2 |
| S-4.AC15 | BE: Add `conversationCounts.byDepartment` to dashboard metrics response | T2 |

## Risk Assessment

- **Regression risk:** Low. Sub-menu change is label-only. Code comments are non-functional.
- **Duplicate ID risk:** Eliminated. Previously had both `sv-dashboard` and `sv-campaigns` as nav items; now single `sv-campaigns`.
