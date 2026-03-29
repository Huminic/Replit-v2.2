# T-022b Pipeline Comparison Table

**Generated:** 2026-03-27T01:20:00Z
**Test:** T-022b (Sales Functional Depth)
**Target:** https://dev.huminicdev.com

## AC5: Pipeline vs Warehouse Comparison

### API Sources

| Metric | `/api/vin/leads/summary` (Warehouse) | `/api/metrics/dashboard` (Pipeline) | DOM (Sales Dashboard) | Match? |
|--------|--------------------------------------|--------------------------------------|----------------------|--------|
| Total Leads (30d) | 592 | N/A | 593 | ~MATCH (off by 1, live data) |
| New Leads | 9 | N/A | 9 | MATCH |
| Active Pipeline | activeLeads: 222 | activePipeline: 111 | 111 | MISMATCH |
| Waiting on Response | 80 | N/A | 80 | MATCH |
| Appointments Set | 0 | appointmentsToday: 0 | 0 | MATCH |
| Sold | 21 | N/A | 21 | MATCH |
| Conversion Rate | 3.5% | N/A | 3.5% | MATCH |
| Open Escalations | N/A | 3 | 3 (home page) | MATCH |
| Outbound Sent 24h | N/A | 0 | 0 (home page) | MATCH |

### Key Finding: Active Pipeline Mismatch

The "Active Pipeline" tile on the Sales Dashboard shows **111**, which matches `/api/metrics/dashboard` `pipeline.activePipeline` (111), NOT `/api/vin/leads/summary` `activeLeads` (222).

- Warehouse source (`/api/vin/leads/summary`): `activeLeads = 222`
- Metrics dashboard (`/api/metrics/dashboard`): `pipeline.activePipeline = 111`
- DOM tile: **111**

The tile uses the metrics dashboard pipeline value, not the warehouse active leads count. The 111 difference suggests "Active Pipeline" is a filtered subset of warehouse active leads.

### AC11: Active Pipeline Consistency

**Source used by the tile:** `/api/metrics/dashboard` `pipeline.activePipeline` (111)
**Not used:** `/api/vin/leads/summary` `activeLeads` (222)

The Active Pipeline tile on both the home page (AI Key Metrics) and the Sales Dashboard consistently shows **111**, sourced from `pipeline.activePipeline` in the metrics dashboard endpoint. This value is NOT the same as `activeLeads` from the warehouse summary.

### Data Freshness

- Warehouse sync: `2026-03-26T23:30:34.679Z` (~1.5 hours ago at test time)
- Label on dashboard: "Synced 1h ago"
- Dashboard badge: "Warehouse"

### AC10: Hardcoded Change Values

| Tile | Value | Change | Change Source |
|------|-------|--------|---------------|
| Total Leads (30d) | 593 | 0% vs last 30d | API: `totalLeadsChange: 0` |
| New Leads | 9 | 0% vs last 30d | API: `newLeadsChange: 0` |
| Active Pipeline | 111 | 0% vs last 30d | API: `activeLeadsChange: 0` |
| Waiting on Response | 80 | **0% vs last 30d** | No change field in API |
| Appointments Set | 0 | **0% vs last 30d** | No change field in API |
| Sold | 21 | 0% vs last 30d | API: `soldLeadsChange: 0` |
| Conversion Rate | 3.5% | 0% vs last 30d | No change field in API |

All tiles show **0% change**. The leads summary API returns `*Change: 0` for the fields it tracks. For "Waiting on Response" and "Appointments Set", the API has no dedicated change field -- the 0% values appear hardcoded or defaulted.
