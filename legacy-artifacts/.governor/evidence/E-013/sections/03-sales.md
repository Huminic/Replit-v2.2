# Section Audit: Sales
**Sprint:** E-013
**Route:** /sales
**Page Component:** client/src/pages/sales.tsx (733 lines)
**Sub-menu:** SubMenuManager.tsx (sales section, lines 541-560)

## What Exists in Code

### Page Structure (sales.tsx)
- **4 tabs:** Dashboard, Agents, Insights, Calendar
- **Dashboard tab:** Metric tiles grid (7 tiles from lead summary API), Top Performing Agents card, Recent Activity feed
  - Metrics: Total Leads (30d), New Leads, Active Pipeline, Waiting on Response, Appointments Set, Sold, Conversion Rate
  - Each tile shows value + change percentage + trend arrow
- **Agents tab:** Grid of agent cards for sales department
  - Fetched from /api/agents?department=sales
  - Each card shows: name, channel type, status badge, description (line-clamp-2)
  - Click card → navigates to /agents with agent selected
  - Settings gear → opens AgentConfigPane in right pane
  - Description IS shown on card (line 675: `agent.description` with line-clamp-2)
- **Insights tab:** Renders the InsightsPage component inline
- **Calendar tab:** AppointmentCalendar component

### Sub-menu Panel
- Nav items: Dashboard, Agents, Insights, Calendar
- Agent list with search, expandable conversations per agent
- Separator between nav items and agents (border-t)

### Agent Cards Detail
- Avatar with Bot icon
- Name (h3, font-semibold)
- Channel type (first channel or 'voice')
- Status dot (color-coded)
- Description (text-xs, muted, line-clamp-2) — **card DOES say what agent does**
- Status badge
- Settings button opens config pane

## Manifest vs Code

| Manifest Item | Code Status | Gap? |
|---|---|---|
| Sub items: Dashboard, Agents, Insights, Calendar | YES — 4 tabs defined at line 48-53 | No gap |
| Agents: Caroline, Data Guru, Sales Coach, Communication Writer | Fetches from /api/agents?department=sales — depends on seed data | Need to verify agents exist in DB |
| Need to see Caroline in this section | Depends on agent.department === 'sales' in DB | Need to verify |
| Agent cards should say what agent does | YES — description shown at line 675 | No gap |
| Agents are currently missing | NEED TO VERIFY — code fetches correctly, may be a data/seed issue | Playwright verification needed |
| Metrics test needs thorough | Dashboard has 6 metric tiles from lead summary API | Existing AC S-3.AC4 covers this |
| Webhook should check appointment data using agent LLM | Calendar tab exists, AppointmentCalendar renders | Need to verify VAPI webhook → appointment flow |

## Existing ACs

| AC | Coverage |
|---|---|
| S-3.AC1 | 4 agents visible: Caroline, Data Guru, Sales Coach, Communication Writer |
| S-3.AC2 | Agent card descriptions NOT truncated |
| S-3.AC3 | "Data Guru" displayed, not "CRM Guru" |
| S-3.AC4 | Every Dashboard KPI tile matches API source |
| S-3.AC5 | /api/vin/leads/summary returns non-zero newLeads |
| S-3.AC6 | Pipeline data renders on Dashboard |
| S-3.AC7 | Pipeline breakdown matches warehouse_leads query |
| S-3.AC8 | Calendar shows appointment with source="vapi" |
| S-3.AC9 | Data Guru returns real VIN data when asked |
| S-3.AC10 | Sales Coach provides coaching advice |
| S-3.AC11 | Communication Writer produces email draft |

## Dashboard Deep Dive

**7 metric tiles from buildSalesMetrics() (lines 96-117):**

| Tile | Source | API | Verified? |
|---|---|---|---|
| Total Leads (30d) | leadSummary.totalLeads | /api/vin/leads/summary | Need to verify vs actual warehouse data |
| New Leads | leadSummary.newLeads | /api/vin/leads/summary | Need to verify |
| Active Pipeline | pipeline.activePipeline OR leadSummary.activeLeads | /api/metrics/dashboard | Need to verify which source wins |
| Waiting on Response | leadSummary.waitingForResponse | /api/vin/leads/summary | Need to verify |
| Appointments Set | leadSummary.appointments | /api/vin/leads/summary | Need to verify |
| Sold | leadSummary.soldLeads | /api/vin/leads/summary | Need to verify |
| Conversion Rate | leadSummary.conversionRate | /api/vin/leads/summary | Need to verify calculation |

Each tile shows: value, change %, trend arrow, "vs last 30d". Click opens SalesMetricDetailDialog with drill-down from /api/metrics/pipeline/details.

**HARDCODED DATA FOUND:** Recent Activity feed (lines 591-603) is HARDCODED mock data — "New lead from website", "Sales Agent qualified lead #1042", etc. This is NOT from an API. This should be flagged.

**Top Performing Agents card:** Shows salesAgents filtered by status=active. Displays name and channel. No performance metric — just lists active agents in order. The "top performing" label is misleading if there's no ranking data.

**Insights tab:** Renders InsightsPage component inline (line 21: `import InsightsPage from '@/pages/insights'`). This is the same Insights page used by other sections — need to verify it shows sales-relevant data when accessed from the sales context.

## New ACs Needed

| Proposed AC | Priority | Dimension |
|---|---|---|
| Each sales agent responds on-topic when chatted with (functional test per agent) | T2 | BE |
| VAPI webhook creates appointment that appears in Sales Calendar | T1 | BE/DT |
| Agent cards show purpose description (not truncated beyond readable) | T2 | FE |
| Dashboard metric tiles match API response values exactly (tile-by-tile comparison) | T1 | FE/DT |
| Recent Activity feed shows real data from API, not hardcoded mock | T2 | FE/BE |
| Conversion Rate calculation is correct (sold / total leads * 100) | T1 | DT |
| Active Pipeline resolves correctly between two data sources (pipeline vs leadSummary) | T1 | DT |
| Metric drill-down dialog shows real detail rows from /api/metrics/pipeline/details | T2 | FE/BE |
| Insights tab shows sales-relevant data when accessed from /sales?tab=insights | T2 | FE/BE |
| Sync status indicator shows correct source (Warehouse vs VinSolutions Live) and age | T2 | FE |

## Findings

1. **HARDCODED: Recent Activity feed is mock data** — lines 591-603, static array, not from API
2. **"Top Performing Agents" has no ranking metric** — just lists active agents, no performance data
3. **Two data sources for Active Pipeline** — pipeline.activePipeline vs leadSummary.activeLeads, with fallback. Need to verify consistency
4. **Conversion Rate change field reuses conversionRate value** — line 115 `change: summary.conversionRate` which means the "change" arrow shows the absolute rate, not a delta. This is likely a bug.
5. **Waiting on Response and Appointments Set have hardcoded change: 0** — lines 112-113, no delta data for these two tiles (unlike Total Leads, New Leads, Active Pipeline, Sold which use real change values)

## Operator Notes
- Metrics and insights need reconciled against real data
- Each sub-page component needs examined, not just tab existence

## Section Description (DRAFT — for operator edit)

**Sales is the sales department hub.** It has 4 tabs: Dashboard (7 metric tiles from VIN lead data — Total Leads 30d, New Leads, Active Pipeline, Waiting on Response, Appointments Set, Sold, Conversion Rate + Top Performing Agents + Recent Activity), Agents (grid of sales department AI agents — Caroline for comms, Data Guru for CRM data queries, Sales Coach for technique coaching, Communication Writer for email drafts), Insights (embedded analytics from the Insights page), and Calendar (appointment calendar showing scheduled test drives and follow-ups).

Agent cards show the agent's name, channel type, status, and a description of what the agent does. Clicking a card navigates to the agent configuration page. The sidebar popout mirrors the tab navigation and includes an expandable agent list with search and conversation counts.

**What needs testing:** Verify all 4 agents (Caroline, Data Guru, Sales Coach, Communication Writer) appear on the Agents tab with correct names and descriptions. Verify each agent responds appropriately when chatted with. Verify Dashboard metrics match the API. Verify VAPI call webhooks create appointments that show in the Calendar tab.
