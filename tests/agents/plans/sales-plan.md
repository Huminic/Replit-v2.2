# Test Plan: Sales Domain (T-003 -- Exhaustive)

**Domain:** Sales Dashboard (`/sales`)
**Sprint:** T-003
**Created by:** Planner Agent (T-003)
**Status:** Active

---

## Source Inventory

| Source | Path | Key Findings |
|--------|------|--------------|
| Sales page component | `client/src/pages/sales.tsx` | ~750 lines. 4 tabs (Dashboard, Agents, Insights, Calendar). 7 KPI metric tiles, agent cards, metric detail dialogs with drill-down tables, contact detail view. |
| Existing E2E tests | `tests/e2e/domain-06-departments.spec.ts` | 8 tests (6.1-6.8): sales page load w/ KPIs (6.1), sidebar no billing (6.6), sales submenu 3 agents (6.7) |
| Insights page | `client/src/pages/insights.tsx` | ~1800 lines. Embedded via `<InsightsPage embedded />` on Insights tab. 4 sub-tabs: Dashboard, Reports, Library, Hunches. |
| AppointmentCalendar | `client/src/components/AppointmentCalendar.tsx` | Full calendar component: month navigation, day click, create appointment form, connector sources dialog. Used for Calendar tab. |
| SubMenuManager | `client/src/components/layout/SubMenuManager.tsx` | Sales flyout panel: nav items (Dashboard, Agents, Insights, Calendar) + agent list with search, expand conversations, active count badge. |
| Sidebar | `client/src/components/layout/Sidebar.tsx` | 72px icon sidebar. Sales item with `data-testid="sidebar-item-sales"`. |
| RBAC | `client/src/lib/rbac.ts` | 8 roles. Sales access: super_admin, partner_admin, org_admin, executive, sales_manager, sales. Denied: service, marketing. |
| Metrics API | `server/routes/metrics.ts` | `GET /api/metrics/dashboard`, `GET /api/metrics/pipeline/details?metric=X`, `GET /api/activity-log?limit=N` |
| VIN leads summary | `server/vendorProxy.ts` | `GET /api/vin/leads/summary` -- returns LeadSummary with totals, changes, conversion rate, source, syncedAt |
| Appointments API | `server/routes/appointments.ts` | `GET /api/appointments?department=&startDate=&endDate=`, `POST /api/appointments`, `GET /api/appointments/:id` |
| Agents API | `server/routes/agents.ts` | `GET /api/agents?department=sales` -- returns Agent[] for sales department |
| Auth helpers | `tests/e2e/helpers/auth.ts` | testUsers: superAdmin, partnerAdmin, orgAdmin, executive, sales, service, marketing + per-dealer org admins |

---

## Sales Page Anatomy

### Overall Layout (route: `/sales`)

```
+--------------------------------------------------------------------+
| TopBar (h-14)                                                       |
+------+-------------------------------------------------------------+
| Side |  "Sales" (h1)                                                |
| bar  |  [Dashboard] [Agents] [Insights] [Calendar]  <-- tab bar    |
| 72px |  ─────────────────────────────────────────────               |
|      |  <tab content area -- ScrollArea>                            |
|      |                                                              |
+------+-------------------------------------------------------------+
```

Root element: `data-testid="sales-page"`
Tab buttons: `data-testid="tab-sales-{dashboard|agents|insights|calendar}"`
URL sync: `?tab=` query param maps to activeTab

### Tab: Dashboard

#### KPI Metric Tiles (4-col responsive grid)

| # | Tile ID | Label | data-testid | Icon | Data Source | Drill-down |
|---|---------|-------|-------------|------|-------------|------------|
| 1 | sm-1 | Total Leads (30d) | `metric-tile-sm-1` | Target | `/api/vin/leads/summary` .totalLeads | Summary only (no table) |
| 2 | sm-2 | New Leads | `metric-tile-sm-2` | Users | `/api/vin/leads/summary` .newLeads | Summary only (no table) |
| 3 | sm-3 | Active Pipeline | `metric-tile-sm-3` | Zap | `/api/vin/leads/summary` .activeLeads OR `/api/metrics/dashboard` .pipeline.activePipeline | Table: Name, Status, Vehicle, Lead ID, View Contact |
| 4 | sm-4 | Waiting on Response | `metric-tile-sm-4` | Clock | `/api/vin/leads/summary` .waitingForResponse | Summary only (no table) |
| 5 | sm-5 | Appointments Set | `metric-tile-sm-5` | ArrowUpRight | `/api/vin/leads/summary` .appointments | Table: Name, Phone, Email, Type, Time |
| 6 | sm-6 | Sold | `metric-tile-sm-6` | TrendingUp | `/api/vin/leads/summary` .soldLeads | Summary only (no table) |
| 7 | sm-7 | Conversion Rate | `metric-tile-sm-7` | TrendingUp | `/api/vin/leads/summary` .conversionRate | Summary only (no table) |

Each tile shows: label, value, change %, trend arrow (up=green, down=red), "vs last 30d" suffix.
Tiles are clickable -- opens `SalesMetricDetailDialog`.

Only 2 tiles have record-level drill-down tables (via `salesMetricApiKeys`):
- **Active Pipeline** -> `GET /api/metrics/pipeline/details?metric=active_pipeline`
- **Appointments Set** -> `GET /api/metrics/pipeline/details?metric=appointments_today`

Other 5 tiles show summary view: Current Value, Change, Period, data source label.

#### Metric Detail Dialog

- `data-testid="dialog-metric-detail"` -- the dialog container
- `data-testid="text-metric-detail-title"` -- metric label in header
- `data-testid="text-metric-detail-value"` -- large value display
- Active Pipeline table: `data-testid="sales-table-active-pipeline"`, rows: `data-testid="sales-row-pipeline-{idx}"`
- Appointments table: `data-testid="sales-table-appointments"`, rows: `data-testid="sales-row-appointment-{idx}"`
- View Contact button: `data-testid="sales-button-view-contact-{idx}"` (only on pipeline rows with sourceId)

#### Contact Detail View (from Active Pipeline drill-down)

- Container: `data-testid="sales-contact-detail-view"`
- Back button: `data-testid="button-back-to-leads"`
- Contact name: `data-testid="text-contact-name"`
- Fields: Phone, Email, Location (city/state/zip), Vehicle of Interest
- Actions: Call button, Text button
- States: Loading spinner ("Loading contact from CRM..."), CRM error fallback, No contact info
- API: `GET /api/vin/leads/{leadId}/contact`

#### Sync Status Indicator

- `data-testid="sync-status-indicator"` -- container
- `data-testid="badge-vinsolutions-live"` -- badge showing "Warehouse" or "VinSolutions Live"
- `data-testid="text-sync-age"` -- "Synced Xm/Xh/Xd ago"

#### Top Performing Agents Card

- Shows active sales agents ranked by index
- Each agent: `data-testid="top-agent-{agent.id}"` -- rank number, avatar, name, channel, status dot
- Loading state: 3 skeleton rows
- Data: filtered from `/api/agents?department=sales` where status=active

#### Recent Activity Feed

- Container: `data-testid="recent-activity-feed"`
- Items: `data-testid="activity-item-{id}"` -- color dot, description, relative timestamp
- Loading state: 5 skeleton rows
- Empty state: "No recent activity"
- Data: `GET /api/activity-log?limit=10`

### Tab: Agents

- Header: "Sales Agents"
- Agent cards in 3-col responsive grid
- Each card: `data-testid="agent-card-{agent.id}"`
  - Avatar, name, channel, description, status badge
  - Settings button: `data-testid="button-agent-settings-{agent.id}"` -- opens right pane (AgentConfigPane)
  - Status dot with color from `getAgentStatusColor()`
  - Click card -> sets selectedAgent + navigates to `/agents`
  - Selected card has `ring-2 ring-primary` highlight
- Loading state: 3 skeleton cards
- Data: `GET /api/agents?department=sales`

### Tab: Insights

- Embeds `<InsightsPage embedded />` from `client/src/pages/insights.tsx`
- Sub-tabs: Dashboard, Reports, Library, Hunches
- Full analytics dashboard (see insights-plan.md for detailed coverage if created)

### Tab: Calendar

- Renders `<AppointmentCalendar department="sales" />`
- Container: `data-testid="appointment-calendar"`
- Month nav: `data-testid="button-prev-month"`, `data-testid="button-next-month"`, `data-testid="text-calendar-month"`
- New appointment: `data-testid="button-new-appointment"` -- opens create form dialog
- Sync sources: `data-testid="button-connector-config"` -- opens connector dialog
- Day cells: clickable, shows appointment dots
- Selected day: shows appointment list for that day
- Create form fields: title, customerName, customerPhone, customerEmail, appointmentType (test_drive, follow_up, service, consultation, general), startTime, endTime, notes
- Appointment types with colors: test_drive (blue), follow_up (amber), service (green), consultation (purple), general (slate)
- Connector sources (config only): Google Calendar, Dealer.com, Tekion
- Data: `GET /api/appointments?department=sales&startDate=&endDate=`, `POST /api/appointments`

### Sidebar SubMenu (Sales Flyout)

- Triggered by hovering `data-testid="sidebar-item-sales"`
- Collapse button: `data-testid="button-collapse-sales-panel"`
- Nav items: Dashboard (`/sales`), Agents (`/sales?tab=agents`), Insights (`/sales?tab=insights`), Calendar (`/sales?tab=calendar`)
- Agent list: filtered by department=sales, searchable, expandable to show conversations
- Panel agents: `data-testid="panel-agent-{id}"` (per existing test 6.7, expects >= 3)
- Agent search input filters by name
- Expanded agent shows conversation list; clicking navigates to TeamBox

---

## RBAC Access Matrix

| Role | Can access /sales | Section permission |
|------|-------------------|-------------------|
| super_admin | YES | All sections |
| partner_admin | YES | ai-chat, teambox, sales, service, marketing |
| org_admin | YES | ai-chat, teambox, sales, service, marketing |
| executive | YES | ai-chat, teambox, sales, service, marketing |
| sales_manager | YES | ai-chat, teambox, sales |
| sales | YES | ai-chat, teambox, sales |
| service | NO | ai-chat, teambox, service |
| marketing | NO | ai-chat, teambox, marketing |

Note: `canAccessSection()` checks `userPermissions` array first (if set on user), then falls back to `defaultSectionsByRole`.

---

## API Endpoints Used by Sales Page

| Endpoint | Method | Auth | Used By | Response |
|----------|--------|------|---------|----------|
| `/api/vin/leads/summary` | GET | Bearer | Dashboard KPI tiles | LeadSummary (totals, changes, conversionRate, source, syncedAt) |
| `/api/metrics/dashboard` | GET | Bearer | Dashboard pipeline overlay | DashboardMetricsResponse { pipeline: PipelineMetrics } |
| `/api/metrics/pipeline/details?metric=active_pipeline` | GET | Bearer | Active Pipeline drill-down | Array of lead rows (customerName, vinStatus, vehicleOfInterest, sourceId) |
| `/api/metrics/pipeline/details?metric=appointments_today` | GET | Bearer | Appointments drill-down | Array of appointment rows (customerName, customerPhone, customerEmail, appointmentType, startTime) |
| `/api/vin/leads/{leadId}/contact` | GET | Bearer | Contact detail view | Contact object (firstName, lastName, phone, email, city, state, zip) |
| `/api/agents?department=sales` | GET | Bearer | Agents tab, Top Performing card, SubMenu | Agent[] |
| `/api/activity-log?limit=10` | GET | Bearer | Recent Activity feed | ActivityLog[] |
| `/api/appointments?department=sales&startDate=&endDate=` | GET | Bearer | Calendar tab | Appointment[] |
| `/api/appointments` | POST | Bearer | Calendar create form | Created Appointment |

---

## Existing Test Coverage

| Test ID | File | What it covers | Status |
|---------|------|----------------|--------|
| 6.1 | `domain-06-departments.spec.ts` | Sales page loads, URL contains "sales", KPI tiles > 0 | EXISTING |
| 6.6 | `domain-06-departments.spec.ts` | Sales sidebar does NOT show Billing link | EXISTING |
| 6.7 | `domain-06-departments.spec.ts` | Sales submenu shows >= 3 agents below separator | EXISTING |

---

## Test Cases

### Section 1: Page Load and Navigation

| ID | Name | Priority | Steps | Expected Result | Coverage |
|----|------|----------|-------|-----------------|----------|
| TC-SALES-001 | Sales page loads for sales role | P0 | 1. Login as `testUsers.sales` 2. Navigate to `/sales` 3. Wait for load | `data-testid="sales-page"` visible, URL contains `/sales`, no console errors | EXISTING (6.1 partial -- no testid check, no console error check) |
| TC-SALES-002 | Sales page loads for super_admin | P1 | 1. Login as `testUsers.superAdmin` 2. Navigate to `/sales` | Page loads, `data-testid="sales-page"` visible | NEW |
| TC-SALES-003 | Sales page loads for partner_admin | P1 | 1. Login as `testUsers.partnerAdmin` 2. Navigate to `/sales` | Page loads, `data-testid="sales-page"` visible | NEW |
| TC-SALES-004 | Sales page loads for org_admin | P1 | 1. Login as `testUsers.orgAdmin` 2. Navigate to `/sales` | Page loads, `data-testid="sales-page"` visible | NEW |
| TC-SALES-005 | Sales page loads for executive | P1 | 1. Login as `testUsers.executive` 2. Navigate to `/sales` | Page loads, `data-testid="sales-page"` visible | NEW |
| TC-SALES-006 | Service role cannot access /sales | P0 | 1. Login as `testUsers.service` 2. Navigate to `/sales` | Redirected away from /sales OR page not rendered (sales-page testid absent) | NEW |
| TC-SALES-007 | Marketing role cannot access /sales | P0 | 1. Login as `testUsers.marketing` 2. Navigate to `/sales` | Redirected away from /sales OR page not rendered | NEW |
| TC-SALES-008 | Default tab is Dashboard | P1 | 1. Login as `testUsers.sales` 2. Navigate to `/sales` | `tab-sales-dashboard` has active styling (font-medium, border-primary) | NEW |
| TC-SALES-009 | Tab navigation -- switch to Agents | P0 | 1. Load `/sales` 2. Click `tab-sales-agents` | Agents tab active, "Sales Agents" header visible, agent cards rendered | NEW |
| TC-SALES-010 | Tab navigation -- switch to Insights | P0 | 1. Load `/sales` 2. Click `tab-sales-insights` | Insights tab active, InsightsPage content visible | NEW |
| TC-SALES-011 | Tab navigation -- switch to Calendar | P0 | 1. Load `/sales` 2. Click `tab-sales-calendar` | Calendar tab active, `appointment-calendar` testid visible | NEW |
| TC-SALES-012 | URL tab parameter sync | P1 | 1. Navigate to `/sales?tab=agents` | Agents tab is active on load without click | NEW |
| TC-SALES-013 | URL tab parameter -- invalid value | P2 | 1. Navigate to `/sales?tab=invalid` | Falls back to dashboard tab | NEW |

### Section 2: Dashboard -- KPI Metric Tiles

| ID | Name | Priority | Steps | Expected Result | Coverage |
|----|------|----------|-------|-----------------|----------|
| TC-SALES-014 | Seven KPI tiles rendered | P0 | 1. Load `/sales` (Dashboard tab) 2. Count `[data-testid^="metric-tile-sm-"]` | Exactly 7 tiles visible | NEW (6.1 only checks > 0 generically) |
| TC-SALES-015 | Total Leads (30d) tile shows value | P0 | 1. Load Dashboard 2. Locate `metric-tile-sm-1` | Label "Total Leads (30d)", numeric value in `metric-value-sm-1`, trend arrow visible | NEW |
| TC-SALES-016 | New Leads tile shows value | P1 | 1. Load Dashboard 2. Locate `metric-tile-sm-2` | Label "New Leads", numeric value displayed | NEW |
| TC-SALES-017 | Active Pipeline tile shows value | P0 | 1. Load Dashboard 2. Locate `metric-tile-sm-3` | Label "Active Pipeline", numeric value displayed | NEW |
| TC-SALES-018 | Waiting on Response tile shows value | P1 | 1. Load Dashboard 2. Locate `metric-tile-sm-4` | Label "Waiting on Response", numeric value displayed | NEW |
| TC-SALES-019 | Appointments Set tile shows value | P1 | 1. Load Dashboard 2. Locate `metric-tile-sm-5` | Label "Appointments Set", numeric value displayed | NEW |
| TC-SALES-020 | Sold tile shows value | P1 | 1. Load Dashboard 2. Locate `metric-tile-sm-6` | Label "Sold", numeric value displayed | NEW |
| TC-SALES-021 | Conversion Rate tile shows percentage | P1 | 1. Load Dashboard 2. Locate `metric-tile-sm-7` | Label "Conversion Rate", value contains "%" | NEW |
| TC-SALES-022 | Tile trend indicators correct | P1 | 1. Load Dashboard 2. For each tile, check trend arrow | Positive change = green up arrow, negative = red down arrow | NEW |
| TC-SALES-023 | Tiles display "0" when no data | P2 | 1. Load Dashboard for org with no VIN data | All tiles show "0" or "0%", no crash | NEW |

### Section 3: Dashboard -- Metric Detail Drill-Down

| ID | Name | Priority | Steps | Expected Result | Coverage |
|----|------|----------|-------|-----------------|----------|
| TC-SALES-024 | Click tile opens detail dialog | P0 | 1. Click any metric tile (e.g., `metric-tile-sm-1`) | `dialog-metric-detail` visible, title matches tile label, value displayed | NEW |
| TC-SALES-025 | Active Pipeline drill-down shows table | P0 | 1. Click Active Pipeline tile (`metric-tile-sm-3`) | Dialog opens, `sales-table-active-pipeline` visible, columns: Name, Status, Vehicle, Lead ID | NEW |
| TC-SALES-026 | Active Pipeline table rows have data | P1 | 1. Open Active Pipeline dialog | At least one `sales-row-pipeline-{idx}` visible (if data exists), or "No records found" | NEW |
| TC-SALES-027 | Appointments Set drill-down shows table | P0 | 1. Click Appointments Set tile (`metric-tile-sm-5`) | Dialog opens, `sales-table-appointments` visible, columns: Name, Phone, Email, Type, Time | NEW |
| TC-SALES-028 | Non-drillable tile shows summary view | P1 | 1. Click Total Leads tile (`metric-tile-sm-1`) | Dialog shows: Current Value, Change, Period (Last 30 days), data source label | NEW |
| TC-SALES-029 | Dialog close on X or outside click | P1 | 1. Open any metric dialog 2. Click close or outside | Dialog dismissed, no metric selected | NEW |
| TC-SALES-030 | Drill-down record count label | P2 | 1. Open Active Pipeline dialog with data | Shows "X records" or "showing first 100 of Y records" when >= 100 | NEW |
| TC-SALES-031 | Data source label in summary view | P2 | 1. Open non-drillable tile dialog | Shows "Data sourced from warehouse sync." or "Data sourced from VinSolutions CRM." or "Data from local metrics." depending on leadSummary.source | NEW |

### Section 4: Dashboard -- Contact Detail View

| ID | Name | Priority | Steps | Expected Result | Coverage |
|----|------|----------|-------|-----------------|----------|
| TC-SALES-032 | View Contact button in pipeline table | P0 | 1. Open Active Pipeline dialog 2. Find row with sourceId | `sales-button-view-contact-{idx}` visible for rows with sourceId | NEW |
| TC-SALES-033 | Click View Contact shows contact detail | P0 | 1. Click "Show Contact" on a pipeline row | `sales-contact-detail-view` visible, `text-contact-name` shows name, phone/email fields present | NEW |
| TC-SALES-034 | Contact detail loading state | P1 | 1. Click View Contact | Loading spinner and "Loading contact from CRM..." text shown before data loads | NEW |
| TC-SALES-035 | Back to leads navigation | P1 | 1. In contact detail view, click `button-back-to-leads` | Returns to pipeline table view within same dialog | NEW |
| TC-SALES-036 | Contact Call button | P1 | 1. View a contact with phone number 2. Click Call button | `tel:` link opened (verify button enabled when phone exists) | NEW |
| TC-SALES-037 | Contact Text button | P1 | 1. View a contact with phone number 2. Click Text button | `sms:` link opened (verify button enabled when phone exists) | NEW |
| TC-SALES-038 | Contact buttons disabled without phone | P2 | 1. View a contact without phone number | Call and Text buttons are disabled | NEW |
| TC-SALES-039 | Phone cell click-to-call in appointment table | P2 | 1. Open Appointments drill-down 2. Click a phone number | `tel:` link opened, toast "Calling" shown | NEW |

### Section 5: Dashboard -- Sync Status Indicator

| ID | Name | Priority | Steps | Expected Result | Coverage |
|----|------|----------|-------|-----------------|----------|
| TC-SALES-040 | Sync status badge visible | P1 | 1. Load Dashboard with VIN-connected org | `sync-status-indicator` visible, `badge-vinsolutions-live` shows "Warehouse" or "VinSolutions Live" | NEW |
| TC-SALES-041 | Sync age displayed | P2 | 1. Load Dashboard with synced data | `text-sync-age` shows "Synced Xm ago" / "Xh ago" / "Xd ago" / "just now" | NEW |
| TC-SALES-042 | No sync badge when no source | P2 | 1. Load Dashboard for org without VIN data | `sync-status-indicator` not visible | NEW |

### Section 6: Dashboard -- Top Performing Agents

| ID | Name | Priority | Steps | Expected Result | Coverage |
|----|------|----------|-------|-----------------|----------|
| TC-SALES-043 | Top Performing Agents card visible | P1 | 1. Load Dashboard | "Top Performing Agents" card header visible | NEW |
| TC-SALES-044 | Agent list shows active agents ranked | P1 | 1. Load Dashboard with agents | `top-agent-{id}` elements visible, each showing rank number, name, channel, status dot | NEW |
| TC-SALES-045 | Agent loading skeleton | P2 | 1. Load Dashboard (intercept slow API) | 3 skeleton rows shown while loading | NEW |

### Section 7: Dashboard -- Recent Activity Feed

| ID | Name | Priority | Steps | Expected Result | Coverage |
|----|------|----------|-------|-----------------|----------|
| TC-SALES-046 | Recent Activity card visible | P1 | 1. Load Dashboard | "Recent Activity" card header visible, `recent-activity-feed` testid present | NEW |
| TC-SALES-047 | Activity items rendered | P1 | 1. Load Dashboard with activity | `activity-item-{id}` elements visible, each with color dot, description, relative timestamp | NEW |
| TC-SALES-048 | Activity empty state | P2 | 1. Load Dashboard for org with no activity | "No recent activity" text shown | NEW |
| TC-SALES-049 | Activity loading skeleton | P2 | 1. Load Dashboard (intercept slow API) | 5 skeleton rows shown while loading | NEW |
| TC-SALES-050 | Activity limited to 10 items | P2 | 1. Load Dashboard with > 10 activity entries | Maximum 10 `activity-item-*` elements (`.slice(0, 10)`) | NEW |

### Section 8: Agents Tab

| ID | Name | Priority | Steps | Expected Result | Coverage |
|----|------|----------|-------|-----------------|----------|
| TC-SALES-051 | Agents tab shows agent cards | P0 | 1. Navigate to Agents tab | "Sales Agents" header visible, agent cards in grid | NEW |
| TC-SALES-052 | Agent card displays info | P1 | 1. View Agents tab | Each `agent-card-{id}` shows: name, avatar, channel, description, status badge | NEW |
| TC-SALES-053 | Click agent card navigates to /agents | P0 | 1. Click an agent card | URL changes to `/agents`, selected agent set | NEW |
| TC-SALES-054 | Agent settings button opens right pane | P1 | 1. Click `button-agent-settings-{id}` | Right pane opens with AgentConfigPane (stopPropagation prevents card navigation) | NEW |
| TC-SALES-055 | Selected agent card ring highlight | P2 | 1. Select an agent 2. Return to Sales Agents tab | Card for selected agent has `ring-2 ring-primary` styling | NEW |
| TC-SALES-056 | Agent cards loading skeleton | P2 | 1. Switch to Agents tab (intercept slow API) | 3 skeleton cards shown | NEW |
| TC-SALES-057 | Only sales department agents shown | P1 | 1. View Agents tab | All displayed agents are from sales department (verify via API query) | NEW |

### Section 9: Insights Tab

| ID | Name | Priority | Steps | Expected Result | Coverage |
|----|------|----------|-------|-----------------|----------|
| TC-SALES-058 | Insights tab renders embedded InsightsPage | P0 | 1. Click Insights tab | InsightsPage content visible (Dashboard sub-tab with zone cards, or Reports, Library, Hunches) | NEW |
| TC-SALES-059 | Insights sub-tabs functional | P1 | 1. On Insights tab, click through sub-tabs (Dashboard, Reports, Library, Hunches) | Each sub-tab renders its content without error | NEW |
| TC-SALES-060 | Insights zone cards clickable | P2 | 1. On Insights Dashboard sub-tab, click a zone card | Drill-down dialog opens | NEW |

### Section 10: Calendar Tab

| ID | Name | Priority | Steps | Expected Result | Coverage |
|----|------|----------|-------|-----------------|----------|
| TC-SALES-061 | Calendar renders with current month | P0 | 1. Click Calendar tab | `appointment-calendar` visible, `text-calendar-month` shows current month/year | NEW |
| TC-SALES-062 | Month navigation -- previous | P1 | 1. Click `button-prev-month` | Month label changes to previous month | NEW |
| TC-SALES-063 | Month navigation -- next | P1 | 1. Click `button-next-month` | Month label changes to next month | NEW |
| TC-SALES-064 | Day click selects day | P1 | 1. Click a calendar day cell | Day highlighted, form start/end times pre-filled with that date | NEW |
| TC-SALES-065 | New Appointment button opens form | P0 | 1. Click `button-new-appointment` | Create appointment dialog opens with form fields | NEW |
| TC-SALES-066 | Create appointment -- valid submission | P0 | 1. Fill in title, customerName, startTime, endTime 2. Submit | Appointment created, toast "Appointment created", form reset, dialog closes | NEW |
| TC-SALES-067 | Create appointment -- missing required fields | P1 | 1. Submit form without required fields | Toast "Missing fields" with destructive variant, form stays open | NEW |
| TC-SALES-068 | Appointment type selection | P1 | 1. Open create form 2. Select each appointment type | Select shows: Test Drive, Follow Up, Service, Consultation, General | NEW |
| TC-SALES-069 | Appointments display on calendar days | P1 | 1. With appointments in current month | Day cells show appointment count dots/badges | NEW |
| TC-SALES-070 | Selected day shows appointment list | P1 | 1. Click a day with appointments | Appointments for that day listed below calendar | NEW |
| TC-SALES-071 | Sync Sources button opens connector dialog | P2 | 1. Click `button-connector-config` | Dialog opens showing Google Calendar, Dealer.com, Tekion sources | NEW |
| TC-SALES-072 | Calendar filters by sales department | P1 | 1. Load Calendar tab 2. Inspect API call | Request includes `department=sales` parameter | NEW |
| TC-SALES-073 | Today cell highlighted | P2 | 1. View Calendar for current month | Today's date cell has distinct styling | NEW |

### Section 11: Sidebar Submenu

| ID | Name | Priority | Steps | Expected Result | Coverage |
|----|------|----------|-------|-----------------|----------|
| TC-SALES-074 | Sales sidebar submenu opens on hover | P0 | 1. Hover `sidebar-item-sales` | Flyout panel appears with Sales header and nav items | EXISTING (6.7 partial) |
| TC-SALES-075 | Submenu nav items present | P1 | 1. Open Sales submenu | Items visible: Dashboard, Agents, Insights, Calendar | NEW |
| TC-SALES-076 | Submenu nav -- Dashboard link | P1 | 1. Click Dashboard in submenu | Navigates to `/sales`, Dashboard tab active | NEW |
| TC-SALES-077 | Submenu nav -- Agents link | P1 | 1. Click Agents in submenu | Navigates to `/sales?tab=agents`, Agents tab active | NEW |
| TC-SALES-078 | Submenu nav -- Insights link | P1 | 1. Click Insights in submenu | Navigates to `/sales?tab=insights`, Insights tab active | NEW |
| TC-SALES-079 | Submenu nav -- Calendar link | P1 | 1. Click Calendar in submenu | Navigates to `/sales?tab=calendar`, Calendar tab active | NEW |
| TC-SALES-080 | Submenu shows >= 3 agents | P0 | 1. Open Sales submenu | `panel-agent-{id}` count >= 3 | EXISTING (6.7) |
| TC-SALES-081 | Submenu agent search filter | P1 | 1. Open Sales submenu 2. Type agent name in search | Agent list filters to matching names | NEW |
| TC-SALES-082 | Submenu agent expand conversations | P2 | 1. Open Sales submenu 2. Click expand on an agent | Agent row expands showing conversation list with customer name, AI badge | NEW |
| TC-SALES-083 | Submenu conversation click to TeamBox | P2 | 1. Expand agent, click a conversation | Navigates to TeamBox | NEW |
| TC-SALES-084 | Submenu collapse button | P2 | 1. Open submenu 2. Click `button-collapse-sales-panel` | Panel collapses | NEW |

### Section 12: RBAC and Access Control

| ID | Name | Priority | Steps | Expected Result | Coverage |
|----|------|----------|-------|-----------------|----------|
| TC-SALES-085 | Sales sidebar item visible for sales role | P0 | 1. Login as sales 2. Check sidebar | `sidebar-item-sales` present | NEW |
| TC-SALES-086 | Sales sidebar item visible for sales_manager | P1 | 1. Login as sales_manager (if test user available) 2. Check sidebar | `sidebar-item-sales` present | NEW |
| TC-SALES-087 | Sales sidebar item hidden for service role | P0 | 1. Login as service 2. Check sidebar | `sidebar-item-sales` NOT present | NEW |
| TC-SALES-088 | Sales sidebar item hidden for marketing role | P0 | 1. Login as marketing 2. Check sidebar | `sidebar-item-sales` NOT present | NEW |
| TC-SALES-089 | Sidebar does NOT show Billing for sales | P1 | 1. Login as sales 2. Check sidebar | No "Billing" link visible | EXISTING (6.6) |
| TC-SALES-090 | Sales data scoped to user's organization | P1 | 1. Login as sales for Huminic org 2. Check KPI data 3. Compare with different org | Data reflects the logged-in user's organization, not cross-org | NEW |

### Section 13: API Response Handling

| ID | Name | Priority | Steps | Expected Result | Coverage |
|----|------|----------|-------|-----------------|----------|
| TC-SALES-091 | Lead summary API returns valid structure | P0 | 1. Call `GET /api/vin/leads/summary` authenticated | Response contains: totalLeads, newLeads, activeLeads, soldLeads, waitingForResponse, appointments, conversionRate, source | NEW |
| TC-SALES-092 | Pipeline details API -- active_pipeline | P1 | 1. Call `GET /api/metrics/pipeline/details?metric=active_pipeline` | Response is array with customerName, vinStatus, vehicleOfInterest, sourceId | NEW |
| TC-SALES-093 | Pipeline details API -- appointments_today | P1 | 1. Call `GET /api/metrics/pipeline/details?metric=appointments_today` | Response is array with customerName, customerPhone, customerEmail, appointmentType, startTime | NEW |
| TC-SALES-094 | Pipeline details API -- invalid metric | P1 | 1. Call `GET /api/metrics/pipeline/details?metric=bad_value` | 400 response with "Invalid metric" message | NEW |
| TC-SALES-095 | Activity log API respects limit | P1 | 1. Call `GET /api/activity-log?limit=10` | Response array length <= 10 | NEW |
| TC-SALES-096 | Agents API filters by department | P1 | 1. Call `GET /api/agents?department=sales` | All returned agents have department=sales | NEW |
| TC-SALES-097 | Appointments API filters by department | P1 | 1. Call `GET /api/appointments?department=sales` | All returned appointments have department=sales | NEW |
| TC-SALES-098 | Unauthenticated API returns 401 | P0 | 1. Call any sales API endpoint without Bearer token | 401 "Not authenticated" | NEW |

### Section 14: Error States and Edge Cases

| ID | Name | Priority | Steps | Expected Result | Coverage |
|----|------|----------|-------|-----------------|----------|
| TC-SALES-099 | Dashboard renders with failed lead summary API | P1 | 1. Load `/sales` with `/api/vin/leads/summary` returning error | Tiles show "0" values, no crash, page remains functional | NEW |
| TC-SALES-100 | Pipeline detail dialog loading state | P2 | 1. Click Active Pipeline tile (intercept slow API) | "Loading records..." text shown in dialog | NEW |
| TC-SALES-101 | Pipeline detail dialog error state | P2 | 1. Click Active Pipeline tile with API returning error | "Failed to load records" text shown in dialog | NEW |
| TC-SALES-102 | Pipeline detail dialog empty state | P2 | 1. Click Active Pipeline tile with API returning empty array | "No records found" text shown in dialog | NEW |
| TC-SALES-103 | Contact detail CRM error fallback | P2 | 1. View Contact when `/api/vin/leads/{id}/contact` fails | Shows cached info from lead row, amber warning "Could not fetch live CRM data" | NEW |
| TC-SALES-104 | No console errors on sales page | P0 | 1. Load `/sales` 2. Navigate all tabs 3. Check console | No JavaScript errors in console | NEW |
| TC-SALES-105 | Rapid tab switching stability | P2 | 1. Click through all 4 tabs quickly, multiple times | No crash, no stale renders, correct tab content shown | NEW |

---

## Coverage Summary

| Category | Total | Existing | New | P0 | P1 | P2 |
|----------|-------|----------|-----|----|----|-----|
| Page Load & Navigation | 13 | 1 (partial) | 12 | 4 | 7 | 2 |
| KPI Tiles | 10 | 0 | 10 | 2 | 6 | 2 |
| Metric Detail Drill-Down | 8 | 0 | 8 | 2 | 3 | 3 |
| Contact Detail View | 8 | 0 | 8 | 2 | 3 | 3 |
| Sync Status | 3 | 0 | 3 | 0 | 1 | 2 |
| Top Performing Agents | 3 | 0 | 3 | 0 | 2 | 1 |
| Recent Activity Feed | 5 | 0 | 5 | 0 | 2 | 3 |
| Agents Tab | 7 | 0 | 7 | 2 | 3 | 2 |
| Insights Tab | 3 | 0 | 3 | 1 | 1 | 1 |
| Calendar Tab | 13 | 0 | 13 | 2 | 6 | 5 |
| Sidebar Submenu | 11 | 2 | 9 | 2 | 5 | 4 |
| RBAC & Access Control | 6 | 1 | 5 | 3 | 2 | 0 (1 existing) |
| API Response Handling | 8 | 0 | 8 | 2 | 6 | 0 |
| Error States & Edge Cases | 7 | 0 | 7 | 1 | 1 | 5 |
| **TOTAL** | **105** | **4** | **101** | **23** | **48** | **33** |

Existing tests from `domain-06-departments.spec.ts` that overlap: 6.1, 6.6, 6.7 (3 tests covering 4 plan cases partially).

---

## Notes

- `sales_manager` role exists in RBAC definitions but no corresponding test user is seeded in `auth.ts`. Tests referencing this role (TC-SALES-086) may need a seeded user or can be tested via RBAC unit test.
- The Insights tab embeds the full InsightsPage component. Detailed testing of Insights sub-tabs (zones, reports, library, hunches) should be in a separate insights-plan.md to avoid duplication.
- Calendar connector sources (Google Calendar, Dealer.com, Tekion) appear to be configuration UI only -- no actual sync integration is wired up yet.
- The `conversionRate` change is hardcoded to `0` per issue I-114 -- the API does not provide `conversionRateChange`.
- Contact detail view calls VinSolutions CRM API live -- test environment needs VIN data or mocks.
