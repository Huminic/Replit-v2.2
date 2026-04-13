# PE-SALES-03: Section-Function Map

**Date:** 2026-04-07
**Page:** Sales (`/sales`)
**User:** serra_honda@huminic.ai (org_admin, Serra Honda)

## Page Structure

| Section | Location | Function | Data Source |
|---------|----------|----------|-------------|
| Page Header | Top of main | Shows "Sales" title + tab nav (Dashboard, Agents, Insights, Calendar) | Static |
| Sync Status Badge | Top-right of dashboard | Shows "Warehouse" badge + "Synced 31m ago" | `/api/vin/leads/summary` `.source` and `.syncedAt` |
| Metric Tiles Grid | Center, 4-column grid | 7 tiles: Total Leads (30d), New Leads, Active Pipeline, Waiting on Response, Appointments Set, Sold, Conversion Rate | `/api/vin/leads/summary` + `/api/metrics/dashboard` |
| Metric Popout Dialog | Modal overlay on tile click | Shows metric value, change %, and record list (for tiles with API keys) or summary breakdown | `/api/metrics/pipeline/details?metric={key}` |
| Top Performing Agents | Bottom-left card | Lists active sales agents ranked 1-4 with name, primary channel, status dot | `/api/agents?department=sales` filtered `status=active` |
| Recent Activity | Bottom-right card | 10 most recent activity log entries with type, description, relative timestamp | `/api/activity-log?limit=10` |
| Agents Tab | Tab content area | Grid of agent cards; clicking navigates to `/agents` with agent selected | `/api/agents?department=sales` |
| Insights Tab | Tab content area | Embedded InsightsPage component | InsightsPage embedded |
| Calendar Tab | Tab content area | AppointmentCalendar for sales department | AppointmentCalendar component |
| Left Submenu | Left panel overlay | Shows sub-nav (Dashboard/Agents/Insights/Calendar) + agent list with search | Sidebar SubMenuManager |
| Open Configuration Button | Bottom-right floating | Opens right pane for agent configuration | UILayoutContext |

## Metric Tile API Key Mapping

| Tile Label | API Key (for drill-down) | Has Record Table |
|------------|--------------------------|------------------|
| Total Leads (30d) | `total_leads` | Yes (generic rows, capped at 100) |
| New Leads | `new_leads` | Yes (generic rows) |
| Active Pipeline | `active_pipeline` | Yes (Name, Status, Vehicle, Lead ID, Show Contact) |
| Appointments Set | `appointments_today` | Yes (Name, Phone, Email, Type, Time) |
| Waiting on Response | None | No - shows summary breakdown |
| Sold | None | No - shows summary breakdown |
| Conversion Rate | None | No - shows summary breakdown |

## Agents Identified in Sidebar + Top Agents

1. Data Guru (chat) - status: active
2. Sales Coach (chat) - status: active
3. Communication Writer (chat) - status: active
4. Caroline (voice) - status: active, badge "3" shown

## Missing/Not Present on This Page

- No trigger/automation configuration section visible on Sales Dashboard
- No cost/pricing information displayed
- No store/org selector (org_admin scoped to single store)
- No VAPI/voice metrics tile
- No explicit phone number display for Caroline on dashboard
