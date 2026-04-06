# Sales Dashboard — Section Function Map

## What This Page Does
The Sales Dashboard is the primary sales operations view for dealership staff. It provides pipeline metrics, agent management, AI insights, and appointment scheduling across 4 tabs.

## Layout
- **Top Bar**: Organization switcher (store dropdown), user profile, notifications
- **Tab Navigation**: Dashboard | Agents | Insights | Calendar
- **Default Tab**: Dashboard (loads on page entry)

## Dashboard Tab

### Metric Tiles (7)
| Tile | Data Source | Time Window | Drill-Down | Change Value |
|------|-----------|-------------|------------|--------------|
| Total Leads 30d | warehouseLeads | 30 days | No (basic summary only) | Hardcoded 0 |
| New Leads | warehouseLeads (recent) | Unspecified | No (basic summary only) | Hardcoded 0 |
| Active Pipeline | warehouseLeads (excluding closed statuses) | Rolling | Yes — table of leads with details | Hardcoded 0 |
| Waiting on Response | warehouseLeads (status=waiting) | Current | No (basic summary only) | Hardcoded 0 |
| Appointments Set | appointments | Rolling | Yes — table with appointment records | Hardcoded 0 |
| Sold | warehouseLeads (status=sold) | Rolling | No (basic summary only) | Hardcoded 0 |
| Conversion Rate | Computed (sold/total) | Rolling | No (basic summary only) | Hardcoded 0 |

### Drill-Down Support
Only 2 of 7 tiles have drill-down API support:
- **Active Pipeline** — opens detail table with contributing leads
- **Appointments Set** — opens detail table with appointment records

The other 5 tiles (Total Leads 30d, New Leads, Waiting on Response, Sold, Conversion Rate) show basic summary only when clicked.

### Sync Status Indicator
- Displays "Synced X ago" text showing time since last warehouse sync
- **No manual refresh button** — sync is background-only
- Time display may be stale if sync process has stopped

### Change Values
All 7 tiles show change indicators (up/down arrows or percentages), but these are **hardcoded to 0** — no historical comparison is implemented.

### Top Agents Section
- Displays ranked list of agents by performance metrics
- Data from local warehouse, not live VIN API

### Recent Activity Feed
- Shows recent CRM activity events
- Data from local warehouse

### Contact Detail View
- Accessible from drill-down tables via "View Contact" button
- Fetches live CRM data from VIN Solutions via `/api/vin/leads/{leadId}/contact`
- Shows contact name, phone, email, vehicle interest, lead status

## Agents Tab
- Displays agent cards for AI agents assigned to the dealership
- Each card has active/inactive toggle
- Agent configuration managed elsewhere (Settings page)

## Insights Tab
- Embeds the InsightsPage component
- AI-generated analysis of dealership performance
- Data derived from warehouse metrics

## Calendar Tab
- Appointment calendar view
- Displays scheduled appointments by date/time
- Data from appointments table in warehouse

## Data Source
All dashboard data comes from the local warehouse (PostgreSQL via Drizzle ORM), NOT live VIN Solutions API. The warehouse is populated by periodic sync processes. The only live VIN API call is the contact detail fetch.

## User Story Gaps
- **US-023** expects dollar-value pipeline metric — not implemented
- **US-023** expects lead source tiles — not implemented
- **US-023** expects lead quality tiles — not implemented
- **US-023** expects demand score tiles — not implemented

## Role Access
- All authenticated roles can access the Sales Dashboard
- Metric data is org-scoped (users see only their org's data)
- Super_admin and partner_admin can switch orgs via store dropdown

## Configurable Elements
- No direct configuration on this page
- Trigger/agent configuration may be referenced but is managed on Settings page
