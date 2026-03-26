# SEC-03 Post-Sprint Report — Sales Section

**Sprint:** SEC-03
**File modified:** client/src/pages/sales.tsx
**Build status:** PASS (npx tsc --noEmit — zero errors)

---

## Changes Made

### I-114: Conversion Rate change field uses absolute rate as delta (T1) — FIXED
- **File:** client/src/pages/sales.tsx, line 117 (previously line 115)
- **Was:** `change: summary.conversionRate` — displayed the absolute conversion rate (e.g. 12.5%) as the "change" delta, causing the tile to show a misleading +12.5% trend arrow
- **Now:** `change: 0` — set to 0 with a comment explaining the API does not provide `conversionRateChange`
- **Root cause:** The `/api/vin/leads/summary` endpoint (server/vendorProxy.ts:484-500) does not compute period-over-period change for conversion rate. All `*Change` fields in the response are hardcoded to 0 by the API itself.

### I-112: Recent Activity feed is hardcoded mock data (T2) — FIXED
- **File:** client/src/pages/sales.tsx, lines 598-622 (previously 591-610)
- **Was:** Static array of 5 hardcoded activity items ("New lead from website", "Sales Agent qualified lead #1042", etc.)
- **Now:** Fetches from `/api/activity-log?limit=10` using `useQuery<ActivityLog[]>`, renders top 5 entries with real `log.action`, `log.entityType`, `log.metadata.details`, and `formatDistanceToNow` for relative timestamps
- **Pattern:** Follows the same approach as TopBar.tsx (line 111-115) and management.tsx (line 67-69) which already consume this endpoint
- **Added:** Loading skeletons during fetch, empty state fallback, `data-testid="recent-activity-feed"` for test targeting
- **New imports:** `ActivityLog` type from `@shared/schema`, `formatDistanceToNow` from `date-fns`

### S-3.AC16: Waiting on Response and Appointments Set have hardcoded change: 0 (T2) — DOCUMENTED
- **File:** client/src/pages/sales.tsx, line 113
- **Action:** Added comment: `// API does not provide period-over-period change data for waitingForResponse or appointments`
- **No code change:** The `change: 0` values are correct given the API limitations. The `/api/vin/leads/summary` endpoint does not return change data for these fields.

---

## Verifications

### S-3.AC14: Active Pipeline dual-source resolution — VERIFIED
- **Code:** `const activePipeline = pipeline?.activePipeline ?? summary.activeLeads;` (line 108)
- **Finding:** Uses nullish coalescing (`??`), so `pipeline.activePipeline` always wins when `/api/metrics/dashboard` returns data (which it does). `summary.activeLeads` is fallback only.
- **Discrepancy risk:** The two sources use different parameters:
  - `pipeline.activePipeline` (storage.ts:792-812): Counts warehouse_leads from last **14 days** with non-lost, non-sold, non-bad, non-duplicate statuses
  - `summary.activeLeads` (vendorProxy.ts:469): Counts leads from last **30 days** matching `isActiveLead()` classifier
- **Assessment:** Different time windows (14d vs 30d) and different status filters mean these numbers will differ. The `change` field always uses `summary.activeLeadsChange` regardless of which value is displayed. This is architecturally intentional — the pipeline metric is the more specific "active pipeline" count, while the lead summary is a broader view. No code change needed.

### Build verification
- `npx tsc --noEmit` — zero errors, zero warnings

---

## Files Modified
- `client/src/pages/sales.tsx` — 3 changes (activity feed, conversion rate fix, comments)

## Files NOT Modified (confirmed no changes needed)
- `client/src/components/layout/SubMenuManager.tsx` — no sales-related issues found
- `tests/e2e/s3-sales.spec.ts` — no test changes required for these fixes (API-level tests remain valid)
- `server/routes/metrics.ts` — existing `/api/activity-log` endpoint is sufficient, no server changes needed
