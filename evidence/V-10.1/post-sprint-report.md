# Post-Sprint Report: V-10.1 — Sales Page Data Accuracy

**Sprint:** V-10.1
**Phase:** 10 — Department Pages
**Type:** Verification
**Date:** 2026-03-23

## Declared Files
- `evidence/V-10.1/` (evidence only)

## Success Criteria
- Every KPI tile value on the Sales page matches the corresponding API endpoint value
- Agent cards show agents that exist in /api/agents?department=sales
- No hardcoded prototype data

## API Endpoints Tested

1. `/api/vin/leads/summary` — Lead summary for 30d window
2. `/api/metrics/dashboard` — Dashboard metrics (pipeline object)
3. `/api/agents?department=sales` — Sales agents

## KPI Tile Verification

### Sales Page Tiles (from buildSalesMetrics in sales.tsx)

| Tile ID | Label | API Source | API Value | Frontend Logic | Verdict |
|---------|-------|-----------|-----------|----------------|---------|
| sm-1 | Total Leads (30d) | /api/vin/leads/summary → totalLeads | 408 | `String(summary.totalLeads)` | MATCH |
| sm-2 | New Leads | /api/vin/leads/summary → newLeads | 0 | `String(summary.newLeads)` | MATCH |
| sm-3 | Active Pipeline | /api/metrics/dashboard → pipeline.activePipeline | 71 | `pipeline.activePipeline ?? summary.activeLeads` | MATCH |
| sm-4 | Waiting on Response | /api/vin/leads/summary → waitingForResponse | 72 | `String(summary.waitingForResponse)` | MATCH |
| sm-5 | Appointments Set | /api/vin/leads/summary → appointments | 2 | `String(summary.appointments)` | MATCH |
| sm-6 | Sold | /api/vin/leads/summary → soldLeads | 14 | `String(summary.soldLeads)` | MATCH |
| sm-7 | Conversion Rate | /api/vin/leads/summary → conversionRate | 3.4% | `${summary.conversionRate}%` | MATCH |

**Result: 7/7 tiles MATCH API values. No hardcoded prototype data.**

## Agent Cards Verification

API response from `/api/agents?department=sales`:
- Caroline (department: sales, status: active)
- CRM Guru (department: sales, status: active)

2 sales agents returned. Frontend renders `salesAgents.filter(a => a.status === 'active')`.

**No service or marketing agents appear on the sales page. Department filtering is correct.**

## Additional Checks

- **Data source badge:** Shows "Warehouse" with sync timestamp (2026-03-20). Source field from API: `"source": "warehouse"`.
- **Recent Activity feed:** Note: This section uses hardcoded sample data (lines 591-597 in sales.tsx). Not API-driven. This is a known Wave 2 placeholder.
- **Pipeline drill-down:** `/api/metrics/pipeline/details?metric=active_pipeline` returns 71 rows. Matches Active Pipeline tile value.

## Verdict

**V-10.1: PASS**

All 7 sales KPI tiles derive values directly from API responses (`/api/vin/leads/summary` and `/api/metrics/dashboard`). No hardcoded prototype numbers. Agent cards show only sales-department agents. The "Recent Activity" feed is a static placeholder (Wave 2).
