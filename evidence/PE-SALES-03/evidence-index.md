# PE-SALES-03: Evidence Index

**Date:** 2026-04-07
**Sprint:** PE-SALES-03
**Page:** Sales (`/sales`)

## Screenshots

| File | Flow | Description |
|------|------|-------------|
| `screenshots/F1-sales-dashboard-full.png` | F1 | Full-page Sales Dashboard showing all metric tiles (452, 36, 107, 95, 0, 11, 2.4%), Top Performing Agents, Recent Activity, agents sidebar, warehouse sync badge |
| `screenshots/F1-sales-dashboard-bottom.png` | F1 | Viewport screenshot (same content - page does not scroll further) |
| `screenshots/F3-total-leads-popout.png` | F3 | Total Leads (30d) drill-down dialog showing 452 with "+5% vs last 30d" and "showing first 100 of 452 records" - record table empty |
| `screenshots/F3-new-leads-popout.png` | F3 | New Leads drill-down dialog showing 36 with "+100% vs last 30d" and "36 records" - record table empty |

## DOM Snapshots (captured in session, not saved as files)

| Flow | Description | Key Data |
|------|-------------|----------|
| Main Dashboard | AI Chat page on login | Active Pipeline: 107, Appointments Today: 0, Open Escalations: 262, Outbound Sent 24h: 21 |
| Sales Dashboard | Full accessibility snapshot | All 7 metric tiles, 4 agents, 10 activity items, warehouse badge, sync age |
| Total Leads Popout | Dialog snapshot | Shows 452, +5%, "showing first 100 of 452 records", Close button |
| New Leads Popout | Dialog snapshot | Shows 36, +100%, "36 records", Close button |
| Sold Popout | Dialog snapshot | Shows 11, -45%, Current Value/Change/Period breakdown, "Data sourced from warehouse sync." |

## Code Review Evidence

| File | Lines | Finding |
|------|-------|---------|
| `client/src/pages/sales.tsx` | 122-128 | `salesMetricApiKeys` maps 4 of 7 tiles to API keys |
| `client/src/pages/sales.tsx` | 150-261 | `renderRecordTable()` has renderers only for `active_pipeline` and `appointments_today`; returns `null` for `total_leads` and `new_leads` |
| `client/src/pages/sales.tsx` | 98-120 | `buildSalesMetrics()` constructs 7 tiles from LeadSummary + PipelineMetrics |
| `client/src/pages/sales.tsx` | 504-629 | `renderDashboard()` has no trigger/config sections |
| `client/src/pages/sales.tsx` | 575 | Agent filtering: `salesAgents.filter(a => a.status === 'active')` |

## Comparison with PE-SALES-02

| Metric | PE-SALES-02 (2026-04-06) | PE-SALES-03 (2026-04-07) | Change |
|--------|--------------------------|--------------------------|--------|
| Total Leads (30d) | 0 | 452 | Warehouse now synced |
| New Leads | 0 | 36 | Warehouse now synced |
| Active Pipeline | 0 | 107 | Warehouse now synced |
| Waiting on Response | 0 | 95 | Warehouse now synced |
| Appointments Set | 0 | 0 | No change |
| Sold | 0 | 11 | Warehouse now synced |
| Conversion Rate | 0% | 2.4% | Warehouse now synced |
| syncedAt | null | 31m ago | FIXED - sync now working |
| Open Escalations (main) | 249 | 262 | +13 increase |
| Top Agents count | 4 | 4 | No change |
| BUG-08 (drill-downs) | 2 of 7 | 4 of 7 have API keys | Improved but render bug |
