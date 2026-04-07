# PE-SALES-03: Use Case Inventory

**Date:** 2026-04-07
**Page:** Sales (`/sales`)
**User:** serra_honda@huminic.ai (org_admin, Serra Honda)

## Use Cases Evaluated

| ID | Use Case | Tested | Result |
|----|----------|--------|--------|
| UC-01 | View sales pipeline metrics at a glance | Yes | PASS - 7 tiles with real data |
| UC-02 | Drill into Total Leads for record detail | Yes | PARTIAL - Dialog opens, says "showing first 100 of 452 records" but record table not visible in viewport |
| UC-03 | Drill into New Leads for record detail | Yes | PARTIAL - Dialog opens, shows "36 records" but record table not visible |
| UC-04 | Drill into Active Pipeline for record table | Not tested (browser crash) | BLOCKED |
| UC-05 | Drill into Sold for breakdown | Yes | PASS - Shows Current Value, Change, Period, data source note |
| UC-06 | Compare metrics period-over-period (vs last 30d) | Yes | PASS - All 7 tiles show % change |
| UC-07 | See warehouse sync freshness | Yes | PASS - "Warehouse" badge + "Synced 31m ago" |
| UC-08 | View top performing sales agents | Yes | PASS - 4 agents listed with rank, name, channel |
| UC-09 | View recent activity feed | Yes | PASS - 10 items with descriptions and timestamps |
| UC-10 | Switch store (org selector) | N/A | Not applicable - org_admin scoped to Serra Honda |
| UC-11 | View trigger/automation configuration | Not tested (browser crash) | BLOCKED - Config pane not reached |
| UC-12 | View Caroline's agent setup/channels | Not tested (browser crash) | BLOCKED - Right pane not opened |
| UC-13 | View cost information | Yes (observed) | NOT PRESENT - No cost/pricing info on Sales page |
| UC-14 | Cross-check metrics with Main Dashboard | Yes (from data) | PASS - Active Pipeline 107 matches main dashboard |
| UC-15 | Navigate between Sales sub-tabs | Partial | Dashboard tab confirmed working |

## Coverage Summary

- **Tested and passed:** 6
- **Tested with issues:** 2 (UC-02, UC-03 - popout record tables)
- **Blocked by browser crash:** 3 (UC-04, UC-11, UC-12)
- **Not applicable:** 1 (UC-10)
- **Not present:** 1 (UC-13)
- **Partial:** 1 (UC-15)
