# Metrics Agent findings — 2026-05-01

## Scope of investigation

Per Dispatch 3 of `finish-line-agent-dispatches.md`. For the 7 dishonest metrics surfaced by Lane 7
(`evidence/stabilization-sprint-2026-04-30/lane-7-metrics.md`), produce a per-metric **fix / swap /
suppress** recommendation with the smallest patch shape. Backed by code reads of
`server/routes/insights.ts` (whole), `server/vendorProxy.ts` lines 540–700, `server/sync.ts`
lines 340–420, `server/routes/metrics.ts`, `server/storage.ts:1193-1210`,
`client/src/lib/activity-utils.ts`, `client/src/pages/sales.tsx:580-700`, plus the Lane 7 JSON snapshot at
`evidence/stabilization-sprint-2026-04-30/lane-7-screenshots/insights-api-snapshot.json` and
`api-snapshot-serra-honda.json`. Read-only. No edits, no migrations, no DB writes, no provider sends, no
nested Agent calls. Schema agent's predicate (`vin_status NOT LIKE 'SERVICE%'` / `isServiceLead`) is used
where service exclusion is needed; no alternative predicate is invented.

## P0 production-safety issues encountered

None. All seven dishonesties are display/calculation defects, not safety issues.

## TL;DR — Per-metric verdict matrix

| # | Metric | I-NEW | Verdict | Smallest patch shape |
|---|---|---|---|---|
| 1 | Sales/Insights conversion rate = 100% | C | **swap** | Replace `(sold/(sold+lost)) over 30d` with lib-8 lifetime rate logic (`sold / total`) computed on lifetime data; relabel tile "Lifetime Win Rate". |
| 2 | Top Lead Sources A+/A/B/C grade | E | **suppress (drop letter, keep counts + winRate)** | Strip `grade`/`gradeColor` from API response; UI shows volume + winRate + rank. |
| 3 | Pipeline forecast = soldCount fallback | E (KD-11) | **swap (relabel) + remove fallback** | Drop `\|\| soldCount`; null out forecast field; relabel as "30-day Sold" sourced from `soldCount` so the forward-looking word goes away. |
| 4 | Lead-source trend = "flat" hard-coded | E | **suppress** | Remove `trend` field from `topLeadSources` payload and drop UI badge; defer real 7d/7d trend to v2.3. |
| 5 | Sales/service contamination across metrics | (pervasive) | **fix** | Apply Schema agent predicate `!isServiceLead(vinStatus)` at every `allLeads.filter(...)` site enumerated below. |
| 6 | `metricsAllZero` fallback | L | **fix** (remove producer fallback path; compute live always) | Drop `warehouse_metrics` lookup for `pipeline_velocity`/`month_end_forecast`; compute the fields directly from `warehouse_leads` or set to null. Producer never writes those keys. |
| 7 | `leadSummary.source` = "warehouse" hard-coded | M | **suppress (remove dead branch)** | Drop the `source` field from `/api/vin/leads/summary` response and remove `'VinSolutions Live'` ternary from `sales.tsx:583-587, 192`. |
| 8 (bonus) | Sales activity feed dominated by sync events | D | **fix** | Add SQL `userId IS NOT NULL AND entityType NOT IN ('sync','system')` filter in `storage.getActivityLogs`; verify with row-count delta. |

---

## Metric 1 — Conversion rate = 100% (I-NEW-2026-05-01-C)

### Why 100%

Math is `sold / (sold + lost)` over a rolling 30-day window. For Serra Honda last-30d the JSON snapshot
shows `sold_leads = 6, lost_leads = 0`; result `6 / 6 = 100%`. Lost-status is set asynchronously by the
VIN sync; in any short rolling window the lost denominator can be zero even though lifetime
`totalLost = 236` (per `insightsReports.body.lossAnalysis.totalLost`).

### Producer / consumer trace

| Surface | Producer file:line | Consumer file:line |
|---|---|---|
| Sales dashboard tile "Conversion Rate" | `server/vendorProxy.ts:641` (`(cur.sold + cur.lost) > 0 ? Math.round((cur.sold / (cur.sold + cur.lost)) * 1000) / 10 : 0`) | `client/src/pages/sales.tsx` (via `buildSalesMetrics`, `:103-131`) |
| Insights green-zone tile "Conversion Rate" | `server/routes/insights.ts:112-113, 238` (same formula scoped to 30d) | `client/src/pages/insights.tsx` greenZone[1] |
| Insights reports "performanceSummary.winRate" (lifetime, honest) | `server/routes/insights.ts:339` (`(soldCount + lostCount) > 0 ? round((soldCount / (soldCount + lostCount)) * 1000) / 10 : 0` over **lifetime** allLeads) | reports surface only — **value is 18.3%** for Serra Honda per snapshot |

### Does `lib-8` exist?

YES. `server/routes/insights.ts:1045-1047`:

```ts
const winRate = totalLeads > 0 ? Math.round((soldLeads.length / totalLeads) * 1000) / 10 : 0;
const c8 = computeRateChange(soldLeads.length, totalLeads, priorSoldLeads.length, priorTotal);
libMetrics.push({ id: "lib-8", title: "Lifetime Win Rate", value: `${winRate}%`, change: c8.change, trend: c8.trend, category: "Conversion" });
```

But there are TWO subtleties:
- **It is mis-named.** `allLeads` is windowed by `lookbackDays` (default 30, `:713-721`). It is "30-day
  win rate (sold / total)" not "lifetime".
- **Different formula** from `performanceSummary.winRate` (`:339`). lib-8 uses `sold / total` (Serra Honda
  observed 1%); performanceSummary uses `sold / (sold + lost)` (observed 18.3%). They give different
  answers for the same data.

The honest dealer answer is `performanceSummary.winRate` (18.3%) — `sold / (sold + lost)` over
**lifetime** rather than 30 days. Lifetime denominator > 0 is reliable because `totalLost = 236` for
Serra Honda. There is no `server/services/lib-8.ts` file (`grep` returned no match); the lib-8 library
metric lives inline in `insights.ts`.

### Recommendation: **swap**

- **Patch shape on producer (`vendorProxy.ts:641`):**
  - Add a second `getWarehouseLeads(orgId, {})` call WITHOUT `createdAfter` (lifetime).
  - Compute `lifetimeWinRate = lifetimeSold / (lifetimeSold + lifetimeLost)`.
  - Return both fields: `conversionRate30d` (existing) and `lifetimeWinRate` (new); deprecate the
    label "Conversion Rate" in favor of "Lifetime Win Rate".
- **Patch shape on producer (`insights.ts:112-113, 238`):**
  - Replace the 30d `conversionRate` in greenZone[1] with the same lifetime computation; relabel "Lifetime
    Win Rate".
- **Tile relabel** (consumer-side; defaults to Batch 3 unless operator promotes):
  - Sales dashboard "Conversion Rate" → "Lifetime Win Rate" (consumer text only).
  - Insights green zone "Conversion Rate" → "Lifetime Win Rate".

### Risk if shipped wrong
The lifetime denominator is reliable (236 lost lifetime for Serra Honda), so the answer (18.3%) is honest.
Risk = LOW.

---

## Metric 2 — Top Lead Sources A+/A/B/C grades (I-NEW-2026-05-01-E)

### Producer

`server/routes/insights.ts:129`:
```ts
const grade = i === 0 ? "A+" : i < 3 ? "A" : i < 5 ? "B" : "C";
```
Purely positional (rank-by-volume). No quality consideration. Lane 7 JSON proves this concretely:
**`Source #7098` ranks #1 by volume (127 leads) and gets `grade: "A+"`, `gradeColor: "green"` despite
`winRate: 0`** — and per the Schema agent's Finding 5, source 7098 is a SERVICE source (99.86% of service
status rows in the last 90 days carry that source ID). So the dashboard is currently showing Serra Honda
that "Source #7098 (service traffic) is your A+ source," which is doubly wrong.

### Recommendation: **suppress** (drop the letter; keep counts + winRate)

Operator gets the dealer-honest signal (volume + winRate) without inventing a grade scale that requires
benchmark thresholds we do not have.

A comparative-grading alternative was considered:
> A+ if winRate ≥20% AND volume ≥10; A ≥15%; B ≥10%; C ≥5%; D <5%
But the thresholds are guesses (no per-org or industry benchmark data lives in the schema), and a
per-source cross-tab (this org vs peer-org peers) is out of scope for v2.2.

### Smallest patch shape

- `insights.ts:124-141`: drop `grade` and `gradeColor` keys from each `topLeadSources[i]` entry;
  delete the `gradeColorMap` constant.
- Consumer (`client/src/pages/insights.tsx`): remove grade badge rendering. (Defaults to Batch 3.)

### Risk if shipped wrong
The grade column is currently misleading on its face; removing it is strictly more honest than today.
Risk = LOW.

---

## Metric 3 — Pipeline forecast = soldCount fallback

### Confirmed: labeled "forecast" but is backward soldCount

Producer site:
- `server/routes/insights.ts:245`: `forecast: metricsMap["month_end_forecast"] || soldCount`
- `soldCount` is computed at `:110` over the 30-day window (`isSoldLead(l.vinStatus)`).

Consumer label: `pipelineHealth.forecast` (rendered in `client/src/pages/insights.tsx` Pipeline Health
section). Lane 7 JSON snapshot confirms `pipelineHealth.forecast = 6` for Serra Honda — exactly equal to
`soldCount = 6`.

### Is `warehouse_metrics.month_end_forecast` populated by anyone?

**NO.** `grep -rn "month_end_forecast\|pipeline_velocity"` across `server/`, `shared/`, `client/`
returns only the two consumer sites (`insights.ts:242, 245`). The writer in `server/sync.ts:375-388` only
emits these keys: `totalLeads`, `totalLeadsChange`, `newLeads`, `newLeadsChange`, `activeLeads`,
`activeLeadsChange`, `soldLeads`, `soldLeadsChange`, `lostLeads`, `waitingForResponse`, `appointments`,
`conversionRate`. **Neither `month_end_forecast` nor `pipeline_velocity` is ever written.**

This means the fallback `|| soldCount` is hit 100% of the time on every org.

### Recommendation: **swap** (relabel) **+ remove fallback**

- Drop the `|| soldCount` fallback.
- Either set `forecast: null` (consumer renders dash), OR (preferred) remove `forecast` from the
  `pipelineHealth` payload entirely and replace with `lib-33 Projected Month Close` value
  (`server/routes/insights.ts:1157`) which is real forward-looking math (run-rate extrapolation already
  computed in the library response).
- Same call for `velocity` (`:242`): `metricsMap["pipeline_velocity"] || null` — there's no producer for
  this either; it always returns null today. Suggest dropping the field rather than keeping a permanent
  null.

### Smallest patch shape
- `insights.ts:241-246`:
  ```diff
  pipelineHealth: {
  -   velocity: metricsMap["pipeline_velocity"] || null,
      freshness: freshnessScore,
      freshnessPct,
  -   forecast: metricsMap["month_end_forecast"] || soldCount,
  +   projectedMonthClose,   // wire from existing lib-33 logic, or compute inline
  },
  ```
  (Compute `projectedMonthClose` inline from `runRate * daysLeft` matching lib-33 lines 940–1010 in
  `insights.ts`.)
- Consumer label: rename `Forecast` to `Projected Month Close` (Batch 3, consumer-side).

### Risk if shipped wrong
Removing a hard-coded backward-as-forward value is strictly safer than today.
Risk = LOW.

---

## Metric 4 — Lead-source trend = "flat" hard-coded

### Producer

`server/routes/insights.ts:138`:
```ts
trend: "flat" as const,
```
Every single `topLeadSources[i]` carries `trend: "flat"`. JSON snapshot confirms 100% (3/3 sampled).

### Recommendation: **suppress**

Computing a real trend (last-7d count vs prior-7d count per source) is straightforward but adds a
secondary in-memory pass. Per finish-line-plan the goal is "no UI redesign — only data-shape and minimum
consumer-side change." Removing the field is the smaller patch.

### Smallest patch shape
- `insights.ts:124-141`: delete `trend: "flat" as const,` from the `topLeadSources` map.
- Consumer (`client/src/pages/insights.tsx`): remove trend badge rendering. (Batch 3.)

If operator prefers compute-not-suppress, the addition would be:
```ts
const halfPeriod = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
// recompute sourceCounts twice (last 7d vs prior 7d) and tag trend accordingly
```
…but this requires another full pass over `allLeads` and is likely Batch 3 work.

### Risk if shipped wrong
LOW — removing a field that is always "flat" cannot make things worse.

---

## Metric 5 — Sales/service contamination across metrics

Per Schema agent (Finding 1, 6): the predicate is `vin_status NOT LIKE 'SERVICE%'` (or
`!isServiceLead(vinStatus)` from `server/statusClassifier.ts`). Currently NEITHER `insights.ts` NOR
`vendorProxy.ts` applies this predicate; both ingest service rows alongside sales rows.

### Producer sites that need the filter (file:line)

| Site | What it computes | Affected metric | Service inclusion |
|---|---|---|---|
| `server/vendorProxy.ts:567-571` (`getWarehouseLeads(orgId, { createdAfter: thirtyDaysAgo })`) | `cur.total/active/new/sold/lost/waiting` | Sales dashboard tiles (Total Leads, New Leads, Active, Sold, Lost, Waiting, Conversion Rate, Appointments) | YES — service rows count toward total/new/active |
| `server/routes/insights.ts:55-56` (`storage.getWarehouseLeads(orgId, { createdAfter: thirtyDaysAgo })`) | greenZone `totalLeads`, `hotCount`, `soldCount`, `conversionRate`, `newCount`, `topLeadSources`, `channelPerformance`, freshness, daily trend, redZone `hotLeadsGoingCold`, `newLeadsNoContact` | Insights dashboard tiles + cards | YES — across the board |
| `server/routes/insights.ts:267-269` (`storage.getWarehouseLeads(orgId, {})`) | `lossAnalysis.totalLost`, `totalBad`, `lossRate`, `badRate`, `sourceQualityTrends`, `performanceSummary.winRate` | Insights reports | YES — and the lifetime denominator inflates by service share (10–35% per Schema Finding 6) |
| `server/routes/insights.ts:721-722` (`getWarehouseLeads(orgId, { createdAfter: periodStart })` and prior) | All `lib-1..lib-34` library tiles | Library page | YES |

### Read-only SQL row-count proof for serra_honda (last 30d)

The Lane 7 snapshot supports this at the API level. Schema agent's Finding 6 ran the SQL directly:
- `serra-honda` last 90d: total = 1830, service = 356, sales = 1474 (19.5% service share).
- Implication for last-30d Sales tiles: removing service trims roughly 19.5% off the lead count.

I did not re-run the SQL myself (DATABASE_URL is gated by Read-deny on `.env`); I am relying on Schema
agent's Finding 6 (last-90d) and the Lane 7 JSON (last-30d). Operator may re-run if a separate 30d-window
proof is required:
```sql
SELECT
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS total_30d,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days' AND vin_status LIKE 'SERVICE%') AS service_30d,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days' AND vin_status NOT LIKE 'SERVICE%') AS sales_30d
FROM warehouse_leads
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'serra-honda');
```

### Recommendation: **fix**

- **Preferred placement:** apply the predicate at the `storage.getWarehouseLeads` query-builder level via
  a new optional filter `excludeService?: boolean`, OR (simpler, given existing call sites) wrap the
  lead arrays with `.filter(l => !isServiceLead(l.vinStatus))` immediately after each fetch in
  `insights.ts` and `vendorProxy.ts`.
- **Smallest patch (server-side, Batch-1 friendly):**
  ```ts
  // top of insights.ts and vendorProxy.ts where leads are fetched
  import { isServiceLead } from "../statusClassifier";

  // immediately after each `getWarehouseLeads` call in sales-flavored endpoints:
  const allLeads = (await storage.getWarehouseLeads(orgId, { createdAfter: ... }))
    .filter(l => !isServiceLead(l.vinStatus));
  ```
- **Service insights endpoint (`/service?tab=insights`):** already departments via `campaigns.department`;
  it does NOT use warehouse_leads in the same way. No change needed — but if it ever needs service-side
  lead counts, mirror the predicate inverted (`isServiceLead(...) === true`).

### Risk if shipped wrong
- Risk = MEDIUM. Tiles for every org will visibly drop by the per-org service share (10.4%–35.4% per
  Schema Finding 6). Operator must approve this DROP-IN behavior before the change ships, since dealer
  emails and dashboards will read materially smaller numbers post-fix.

---

## Metric 6 — `metricsAllZero` fallback (I-NEW-2026-05-01-L)

### How often is the fallback hit?

Producer of `warehouse_metrics`: `server/sync.ts:375-404` — only writes the 12 keys listed under
Metric 3 above. NEITHER `pipeline_velocity` NOR `month_end_forecast` is ever written.

Consumer fallback path:
- `insights.ts:165-188` (`/api/insights/dashboard`): `metricsAllZero` is computed by checking ALL
  metricsMap entries against `"0" || "" || null`. Then if `allLeads.length > 0`, the entire metricsMap
  is **overwritten** with live computations (`total_leads, new_leads, active_leads, hot_leads,
  sold_leads, lost_leads, bad_leads, conversion_rate`) and stamped `computed_from: "warehouse_leads"`.
- `insights.ts:309-328` (`/api/insights/reports`): same pattern with `total_leads, sold_leads,
  lost_leads, bad_leads, active_leads, win_rate`.

Lane 7 JSON snapshot confirms `metricsFromWarehouse.computed_from = "warehouse_leads"` on **both**
endpoints for Serra Honda. So the fallback hits **every request** today.

### Are fallbacks honest?

YES — they recompute zeroes/values from `warehouse_leads` rather than synthesizing values. The
fallbacks are NOT dishonest. The dishonesty is the SEPARATE issue at `pipelineHealth.forecast/velocity`
(Metric 3) — these aren't even checked by `metricsAllZero` because the formula is
`metricsMap["month_end_forecast"] || soldCount`, evaluated independently.

### Recommendation: **fix** (simplify)

The current logic is a pretzel: write keys into warehouse_metrics from sync, then check if the
warehouse_metrics is zero, then if so overwrite the entire metricsMap with on-the-fly computations.
The simpler, honest design:

- **Drop** the `metricsAllZero` branch (`:165-188` and `:309-328`).
- **Always** compute these metrics directly from `warehouse_leads` on each request. The numbers are
  cheap (warehouse_leads is already in memory at this point).
- **Drop** the warehouse_metrics consumer for `pipeline_velocity` and `month_end_forecast` per Metric
  3 (no producer exists).

### Smallest patch shape
- `insights.ts:165-188`: delete the `metricsAllZero` block and the `metrics.forEach` loader that
  precedes it. Build `metricsFromWarehouse` directly:
  ```ts
  const metricsFromWarehouse: Record<string, string> = {
    total_leads: String(totalLeads),
    new_leads: String(newCount),
    active_leads: String(allLeads.filter(l => isActiveLead(l.vinStatus)).length),
    hot_leads: String(hotCount),
    sold_leads: String(soldCount),
    lost_leads: String(lostCount),
    bad_leads: String(allLeads.filter(l => isBadLead(l.vinStatus)).length),
    conversion_rate: String(conversionRate),
    computed_from: "warehouse_leads",
  };
  ```
- `insights.ts:309-328`: same simplification.
- `sync.ts:375-404`: leave as-is (warehouse_metrics is still written for cache/observability; just
  removing the read path on these endpoints).

### Risk if shipped wrong
LOW — every observed response already takes the fallback. The simplification removes dead code.

---

## Metric 7 — `leadSummary.source` hard-coded "warehouse" (I-NEW-2026-05-01-M)

### Producer

`server/vendorProxy.ts:642`:
```ts
source: "warehouse",
```
Always "warehouse". No code path returns any other value.

### Consumer

`client/src/pages/sales.tsx`:
- `:583-587` — Badge label flips between `'Warehouse'` and `'VinSolutions Live'` based on `source ===
  'warehouse'`. The `'VinSolutions Live'` branch is **unreachable**.
- `:192` — Caption text uses the same ternary (`'Data sourced from warehouse sync.' : 'Data sourced
  from VinSolutions CRM.' : 'Data from local metrics.'`). Same dead branches.

### Recommendation: **suppress** (remove dead branch)

- **Server:** remove `source: "warehouse"` from the JSON contract.
- **Consumer:** delete the dead-branch ternaries; render a single label "Warehouse" (or just remove
  the badge entirely if dealer-facing UX doesn't need it). Caption simplifies to a single string.

### Smallest patch shape

- `vendorProxy.ts:642`: delete the line.
- `client/src/pages/sales.tsx:583-587`: collapse Badge to single label `Warehouse` (Batch 3
  consumer change — UI scope marker required per CLAUDE.md).
- `client/src/pages/sales.tsx:192`: collapse caption to a single string.

### Risk if shipped wrong
LOW. `source` is unreferenced for any other purpose; removing it is a no-op behaviorally.

---

## Metric 8 — Sales activity feed (I-NEW-2026-05-01-D)

### Producer site

- Server route: `server/routes/metrics.ts:20-31` (`GET /api/activity-log?limit=N` → `storage.getActivityLogs`).
- DB query: `server/storage.ts:1198-1203`:
  ```ts
  return db.select().from(activityLog)
    .where(eq(activityLog.organizationId, organizationId))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);
  ```
- Schema: `shared/schema.ts:268-279`. `userId` is nullable; `entityType` is nullable text. Sync events
  (`sync_delta_completed`, `sync_backfill_completed`, `sync_backfill_failed`,
  `sync_metrics_refreshed`) are written from `server/sync.ts:185, 204, 267, 413` with `userId`
  unset → null and `entityType: "sync"`.

### Where the `userId IS NULL` filter would land

In `server/storage.ts:1198-1203`, add a server-side filter using Drizzle's `isNotNull` and `notInArray`:

```ts
import { isNotNull, notInArray, ne } from "drizzle-orm";

async getActivityLogs(organizationId: string, limit = 50): Promise<ActivityLog[]> {
  return db.select().from(activityLog)
    .where(and(
      eq(activityLog.organizationId, organizationId),
      isNotNull(activityLog.userId),
      // belt + suspenders: also exclude system entityTypes even if userId got set
      // by mistake. 'sync' is the dominant noise; 'system' is the residual class.
      notInArray(activityLog.entityType, ['sync', 'system']),
    ))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);
}
```

Filter rule (per Lane 7's recommendation): drop rows where
`userId IS NULL` OR `entityType IN ('sync', 'system')`. Note: `webhooks.ts` writes inbound webhook
events that may also have `userId = null` but `entityType` is conversation/campaign etc. — those have
operator value and the `entityType NOT IN ('sync','system')` keeps them visible.

### SQL row counts before/after — serra_honda

I did not re-run direct SQL (DATABASE_URL gated). Lane 7 verified by hand: 50/50 most-recent activity
log entries on serra_honda were `sync_delta_completed`. The Lane 7 JSON snapshot at
`api-snapshot-serra-honda.json` shows 5/5 entries are `sync_delta_completed` with `userId: null`. Under
the proposed filter, the post-fix count for serra_honda would be **0** rows (until a real
user/escalation action is logged).

A clean 30-day SQL pair to run pre-/post-merge is:
```sql
-- Before (all entries)
SELECT COUNT(*) AS pre_total
FROM activity_log
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'serra-honda')
  AND created_at >= NOW() - INTERVAL '30 days';

-- After (excluding sync/system)
SELECT COUNT(*) AS post_total,
       COUNT(*) FILTER (WHERE entity_type IN ('sync','system')) AS noise_dropped,
       COUNT(*) FILTER (WHERE user_id IS NULL) AS userid_null_dropped
FROM activity_log
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'serra-honda')
  AND created_at >= NOW() - INTERVAL '30 days'
  AND user_id IS NOT NULL
  AND entity_type NOT IN ('sync','system');
```
(Snapshot suggests `pre_total >> post_total` with most of the gap being `userid_null_dropped`.)

### Comparison delta on Huminic super_admin (Lane 7 snapshot)

10 rows total: 9 user-attributed (campaign_created, campaign_dry_run, etc.), 1 with userId null
(`sms_inbound_received`, entityType not 'sync'/'system' — would survive the filter; that's intended).
Post-filter: 9 visible rows. Confirms the rule passes through legitimate non-user system signals like
SMS inbound.

### Recommendation: **fix** (server-side filter in storage.ts)

This is preferable to filtering on the client (`activity-utils.ts`) because:
1. Pagination semantics stay correct (50 entries returned = 50 useful entries, not 50 with N usable).
2. Multi-tenant safety: noise-on-the-wire reduced.
3. Single source of truth for "is this an activity entry a dealer cares about."

The Lane 7 finding suggested filtering `entityType IN ('sync','system')` AND `userId IS NULL`; the
proposed Drizzle predicate combines both as a defensive posture.

### Risk if shipped wrong
LOW — at worst, the dashboard "Recent Activity" panel reads "No recent activity" for orgs that
haven't logged user actions. That's strictly more honest than the wall-of-sync display today.

---

## Cross-cutting note — operator decision points (D-F1)

The per-metric verdict matrix at the top of this file is the list operator approves before Batch 1 starts.
A condensed approval row:

| # | Default action | Operator may reject in favor of |
|---|---|---|
| 1 | swap to lifetime win rate | keep 30d, add tile caveat in UI |
| 2 | suppress letter grade | comparative grading thresholds (requires benchmark data; v2.3) |
| 3 | swap forecast to projected_month_close (lib-33) | leave forecast null + relabel "30-day Sold" |
| 4 | suppress trend field | compute real 7d/7d trend (Batch 3 add) |
| 5 | apply isServiceLead filter at every consumer site | wait for BL-107 column (NOT recommended) |
| 6 | drop metricsAllZero branch; compute live | leave as-is (functionally equivalent today) |
| 7 | drop `source` field; collapse UI ternary | leave dead code (no functional impact) |
| 8 | server-side filter in storage.getActivityLogs | client-side filter in activity-utils |

## Proposed implementation chunks (suggested order)

### Chunk 3a — Metric 1 (conversion → lifetime win rate) + Metric 5 (sales/service filter)

- **Files:** `server/vendorProxy.ts:586-644`, `server/routes/insights.ts` (top imports +
  `:55-141, 230-249, 267-329, 720-1161`).
- **Predicate:** import `isServiceLead`, apply `.filter(l => !isServiceLead(l.vinStatus))` after every
  `getWarehouseLeads` call, AND swap conversion-rate denominator from `(sold+lost)` to lifetime
  formulation (call `getWarehouseLeads(orgId, {})` once per endpoint to get lifetime baseline).
- **Test plan delta 1:** unit test for `isServiceLead` (already exists in statusClassifier.ts; add a
  fixture-based integration test for `/api/insights/dashboard` returning a smaller `totalLeads` when
  a fixture mixes SERVICE_* + ACTIVE_* rows).
- **Test plan delta 2:** test-lane API call to `/api/insights/dashboard?orgId=<serra-honda>` before vs
  after the change; expect `overview.totalLeads` to drop ~19.5%, `greenZone[1].value` to flip from
  `"100%"` to `"~18.3%"`.

### Chunk 3b — Metric 2 (suppress grade), Metric 4 (suppress trend), Metric 7 (suppress source)

- **Files:** `server/routes/insights.ts:124-141`, `server/vendorProxy.ts:642`,
  `client/src/pages/sales.tsx:192, 580-590` (consumer cleanup defaults to Batch 3 with UI scope
  marker).
- **Test plan delta 1:** unit test asserting topLeadSources entries no longer carry `grade`,
  `gradeColor`, `trend` keys.
- **Test plan delta 2:** Playwright walk of `/insights` for serra_honda — assert no A+/A/B/C badge
  visible, no flat trend arrow.

### Chunk 3c — Metric 3 (forecast relabel) + Metric 6 (remove metricsAllZero pretzel)

- **Files:** `server/routes/insights.ts:165-188, 241-249, 309-328`.
- **Test plan delta 1:** unit/integration test asserting `pipelineHealth` no longer includes
  `velocity` or `forecast` fields, OR includes a non-null `projectedMonthClose`.
- **Test plan delta 2:** sample API response inspection — `metricsFromWarehouse.computed_from`
  unchanged (still `"warehouse_leads"`); behavior identical to today's fallback.

### Chunk 3d — Metric 8 (activity feed filter)

- **Files:** `server/storage.ts:1198-1210`.
- **Test plan delta 1:** unit test asserting `getActivityLogs("<org-with-only-sync>")` returns `[]`.
- **Test plan delta 2:** API call to `/api/activity-log?orgId=<serra-honda>` returns 0 rows pre-fix
  vs N rows post-fix where N = real user actions in the lookback window. Capture before/after row
  counts via SQL pair above.

## Proof needed before any chunk is approved

- [ ] Operator approves the verdict matrix at top of file (D-F1).
- [ ] Operator confirms: lifetime win rate (`sold / (sold + lost)` over **lifetime** rows) is the
      replacement metric for conversion rate, not lib-8's `sold / total` 30d formula.
- [ ] Operator confirms: pipeline forecast becomes `projectedMonthClose` (wired from existing
      lib-33 logic) OR the field is dropped; tile relabel is acceptable in Batch 3.
- [ ] Operator confirms: activity feed filter is server-side in `storage.getActivityLogs`, not
      client-side in `activity-utils.ts`.
- [ ] Schema agent's predicate (`!isServiceLead(vinStatus)`) is the only sales/service predicate any
      Batch 1 chunk uses.
- [ ] Pre-merge SQL pair captured for Metric 5 (last-30d service share, all 5 orgs) and Metric 8
      (activity-log row counts pre/post filter).

## Open questions for operator

1. **Lifetime denominator** — sold/(sold+lost) over lifetime gives 18.3% for Serra Honda; sold/total
   over lifetime gives ~3% (53/1809 from snapshot). Both are honest, different stories. Recommendation:
   `sold/(sold+lost)` — matches what `performanceSummary.winRate` already computes and matches dealer
   intuition for "of leads that were either won or lost, what fraction did we win?"
2. **Conversion rate label** — when the value swap lands, the tile label still reads "Conversion Rate"
   today. Is "Lifetime Win Rate" the operator-blessed label, or "Win Rate" (no period qualifier), or
   keep "Conversion Rate"? Recommendation: "Lifetime Win Rate" (matches existing lib-8 title — single
   vocabulary).
3. **Forecast field** — drop entirely OR replace with `projectedMonthClose` (lib-33 logic) inline?
   Recommendation: replace inline. Dealer signal is non-trivial.
4. **Trend field** — pure suppress (drop) OR compute real 7d/7d? Recommendation: suppress; revisit in
   v2.3.
5. **Top-source-grade alternative** — should we surface `winRate >= 20%` as a "High" quality label
   (already in API at `:131`)? Recommendation: yes — `quality` is already returned and is comparative,
   not positional. Removing `grade` while keeping `quality` is a free win.
6. **Activity feed filter scope** — should `entityType = 'sync'` be the only excluded type, or also
   `'system'`? Recommendation: both, plus require `userId IS NOT NULL`.
7. **Service insights surface** (`/service?tab=insights`) — currently uses
   `campaigns.department='service'` — does NOT touch warehouse_leads, so no service-rows-in-sales
   problem there. Confirm no cross-contamination from this endpoint.

## Out of scope for this investigation

1. Channel-inference accuracy (`deriveChannel` regex at `:18-33`) — separate concern; "Other" bucket
   collapse is per-org sync configuration, not a metric defect.
2. Hunches feed quality (25 entries on each org; ML-confidence values not audited).
3. Header notification badge inflation (sync events counted against unread count). Documented in
   Lane 7 but is a notification-system concern; not on the 7-metric list.
4. Marketing dashboard "Campaign Performance" generic-label issue — Lane 7 borderline-PARTIAL; not
   in the 7 dishonest list.
5. `appointments` tile label-mismatch ("Set" vs today-only count) — Lane 7 PARTIAL, not on dishonest
   list.
6. Anything that requires a schema migration (`BL-107` is v2.3 backlog per Schema agent + D-A1).
7. Top-Performing-Agents card (insertion-order ranking) — Lane 7 PARTIAL; not on dishonest list.
8. UI redesign (tile reorganization, new tiles, color/iconography).

## Evidence — primary citations

- Lane 7 JSON evidence (Serra Honda): `evidence/stabilization-sprint-2026-04-30/lane-7-screenshots/insights-api-snapshot.json`
- Lane 7 JSON evidence (activity log): `evidence/stabilization-sprint-2026-04-30/lane-7-screenshots/api-snapshot-serra-honda.json`, `api-snapshot-superadmin-huminic.json`
- Schema agent predicate: `evidence/stabilization-sprint-2026-05-01/finish-line-findings/01-schema-taxonomy.md` Findings 3, 6, 8
- Producer code:
  - `server/routes/insights.ts:18-33, 55-141, 165-249, 267-347, 707-1167`
  - `server/vendorProxy.ts:552-648` (lines 586-644 specifically; line 642 source field)
  - `server/sync.ts:267-419` (writer that omits month_end_forecast/pipeline_velocity)
  - `server/storage.ts:1193-1210` (activity log producer)
  - `server/statusClassifier.ts:1-58` (`isServiceLead` helper)
- Consumer code:
  - `client/src/pages/sales.tsx:103-131, 192, 580-590, 686-700`
  - `client/src/pages/insights.tsx:236-246` (greenZone), elsewhere for grade rendering
  - `client/src/lib/activity-utils.ts:28-59` (renderer of activity log rows)
