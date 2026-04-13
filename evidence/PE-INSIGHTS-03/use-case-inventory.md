# PE-INSIGHTS-03 Use Case Inventory

**Date:** 2026-04-07

## Use Cases Evaluated

| UC | Description | Flow | Result |
|----|-------------|------|--------|
| UC-01 | Manager reviews dashboard for urgent action items | F1 | Accepted |
| UC-02 | Manager checks pipeline health metrics | F1, F2 | Accepted |
| UC-03 | Manager examines lead generation trends via charts | F2 | Accepted |
| UC-04 | Manager drills into stale leads for follow-up | F5 | Accepted with risk |
| UC-05 | Manager exports lead data as CSV | F5 | Accepted |
| UC-06 | Manager reviews loss patterns and quality | F7 (Reports) | Accepted |
| UC-07 | Manager browses metric library for KPIs | F7 (Library) | Accepted |
| UC-08 | Manager reads AI-generated strategic hunches | F7 (Hunches) | Accepted |
| UC-09 | Manager reviews system activity log | F7 (Activity) | Accepted |
| UC-10 | Manager switches between insight views via tabs | F7 | Accepted |
| UC-11 | Manager clicks contact actions from insights | F6 | Accepted with risk |
| UC-12 | Manager applies date/filter controls | F8 | Accepted with risk |

## Use Cases NOT Evaluated (insufficient data or feature not present)

| UC | Description | Reason |
|----|-------------|--------|
| UC-13 | Manager drills into hot leads with customer names/phones | 0 records in drill-down modal (data issue, not code bug) |
| UC-14 | Manager compares store metrics across orgs | Single-org login (org_admin), would need partner_admin or super_admin |
