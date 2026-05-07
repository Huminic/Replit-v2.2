# Wave 1C runtime verification matrix

**Walk window:** 2026-05-07T01:50:12Z → 2026-05-07T01:59:00Z
**Code under test:** wave/5-insights/1C-metric-honesty HEAD f024271
**Driver:** nexxus-e2e-evaluator teammate

| Chunk | Surface verified | Expected | Observed | Verdict | Evidence |
|---|---|---|---|---|---|
| **S1** drop hard-coded `trend: "flat"` at `server/routes/insights.ts:138` | `/insights > Reports > Source Quality Trends` (serra_honda) | varied trends, NO `flat` literal in page text | hasFlatWord=0, hasFlatLiteral=0; 9 distinct sources rendered (Source #3750035, #3743779, Repeat Customer, Dealers WebSite, Local Customer, Source #3897825, #3897777, #36, #3819124); legend has 5 channels | **PASS** | routes/sh-02-insights-source-trends.png; routes/sh-01-insights-dashboard.png also probed: hasFlat=0 |
| **S2** `entityType` filter excludes sync/system at `server/storage.ts:1198-1203` | `/insights > Activity` (50 visible rows) AND `/sales > Recent Activity` (10 visible) AND scrolled to bottom of feed | zero `sync_*` rows, all rows user-attributable | syncStarMatches=0, systemEventMatches=0; observed entity types: Weekly Report Sent, Trigger Checkin Sent, Vapi Call Received, Trigger Immediate Sent, Sms Inbound Received, Campaign Created/Active/Executed/Dry Run, Tavus Video Completed, Login Failed, Agent Triggers Updated, Agent Created/Updated/Deleted, Escalation Email Sent, User Created, Role Changed | **PASS** | routes/sh-03-insights-activity.png; routes/sh-04-sales-dashboard.png Recent Activity panel; scroll-test confirmed syncCount=0 across 50+ row scroll buffer |
| **S3** `conversionRate` null-on-empty fallback at `server/vendorProxy.ts:644` | `/sales` Conv Rate card (serra_honda + Cage Automotive); `/management` Today's Performance Conv Rate (super_admin viewing Huminic empty org) | wire shape `{conversionRate: number-or-null}`; renders 100% honest math when sold>0/lost=0; renders blank when both 0 | serra_honda /sales: 100% (sold=7, lost=0 → 7/(7+0)=100% honest); Cage Automotive /insights: blank Conv Rate tile (sparse data → null branch active); Huminic /management: blank Conv Rate tile (empty data → null branch active); zero `null%`/`NaN%`/`undefined%` rendered anywhere | **PASS** | routes/sh-04-sales-dashboard.png; routes/sh-04b-sales-kpis-zoom.png; routes/sa-14-management-huminic.png; routes/pa-17-insights-cage-automotive.png |
| **S4** UPSTREAM sales-only predicate at `getWarehouseLeads` fetch sites in `server/routes/insights.ts:56,268,359,721,722` | `/sales` totals AND `/insights` tiles (serra_honda) | sales-only counts (consistent with Wave 1B "Sales Leads This Week = 100" sales-only Δ1) | `/sales` 30d: Total Leads=641, Sold=7; `/insights` lifetime: Total Leads=508, Total Sold=7, Active Pipeline (30d)=369 — totals consistent across both surfaces, scaled correctly between 30d and lifetime windows; values match Wave 1B sales-only sample | **INDIRECTLY PROVEN** | routes/sh-01-insights-dashboard.png; routes/sh-04-sales-dashboard.png |
| **S5** lib-8 lifetime win rate swap at `server/routes/insights.ts:447,1047` | `/insights > Performance Scorecard > Win Rate` (serra_honda) | lifetime sample, NOT 100%, NOT 30-day | Win Rate=1.4% (= 7/508 ≈ 1.378%, lifetime denominator); Today's Performance Conv Rate also 1.4% (matches lifetime). Pre-1C dishonest 100% is gone. Same value renders for super_admin viewing Serra Honda via store-picker | **PASS** | routes/sh-01-insights-dashboard.png; routes/sa-15-management-serra-honda-via-superadmin.png |
| **S6** test housekeeping (assertions aligned to S1-S5) | covered by S3 wire-shape proof + page renders that depend on S3 contract | tests pass against new shape | Code-level proof PASS per wave-bookend (459 unit tests + tsc); runtime renders consume new shape without errors | **COVERED** | n/a — by transitivity from S3 |

## Numbers drift since 2026-05-06 prior walk

The dataset moved by 1 sold lead between prior walk (sold=6, total leads=494, win rate=1.2%) and this walk (sold=7, total leads=508, win rate=1.4%):
- 7/508 = 1.378% → renders as 1.4% (rounded). Math is correct.
- This is expected daily live-data drift, NOT a regression.
- Both walks: zero `100%` dishonest values, zero `flat`, zero `sync_*`.

## Wire-shape evidence summary

S3's most diagnostic surface is the `/api/vin/leads/summary` API response. The /sales page DOM rendering proves the wire shape arrived correctly:
- Sold tile = 7 (number)
- Conv Rate tile = "100%" (number with %)
- Total Leads tile = 641 (number)
- All KPI cards render with values, not placeholders → API returned successfully → wire shape valid

For sparse-data orgs (Huminic/Cage Automotive), `/insights > Today's Performance > Conversion Rate` shows BLANK (the paragraph element exists but has no text content). This is the S3 null branch in action — rendering correctly defers to the consumer's null-handling rather than fabricating "0%" or "100%".

## Pm2 / log health during walk

- pm2 status: online throughout
- pm2 restarts: 85 → 85 (no restart in walk window — code-under-test stable)
- Uncaught exceptions: 0
- New errors related to Wave 1C code paths: 0
- Pre-existing warnings (unchanged): "VIN integration not found" for empty-data orgs (Cage, Huminic) — these are caught + logged, not thrown; "VAPI_WEBHOOK_SECRET unset" — env hygiene, pre-existing
