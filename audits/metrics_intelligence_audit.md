# Metrics, Dashboards & Intelligence Audit

## 1. Per-Page Metric Tile Inventory

---

### 1.1 Main Page (`client/src/pages/main.tsx`)

The main page displays 4 pipeline metric tiles in a 2x2 grid above the AI chat interface.

| Tile Name | Displayed Value Source | Data Source Type | API Endpoint | Notes |
|---|---|---|---|---|
| Active Pipeline | `pipelineData.activePipeline` | **API (real data)** | `GET /api/metrics/pipeline` | Computed from `warehouseLeads` table (14-day window, excludes Lost/Sold/Duplicate) |
| Appointments Today | `pipelineData.appointmentsToday` | **API (real data)** | `GET /api/metrics/pipeline` | Computed from `warehouseLeads` with `ACTIVE_SET_APPOINTMENT` status synced today |
| Open Escalations | `pipelineData.openEscalations` | **API (real data)** | `GET /api/metrics/pipeline` | Computed from `tasks` table (status=todo, type=escalation or unsent_message) |
| Outbound Sent 24h | `pipelineData.outboundSent24h` | **API (real data)** | `GET /api/metrics/pipeline` | Computed from outbound message records in the last 24 hours |

- **Metric detail drill-down**: `buildMetricDetails()` generates breakdown text from the same pipeline data. No additional mock data.
- **Trend indicators**: The `change` field is hardcoded to `'live'` for all tiles (not computed from historical data).

---

### 1.2 Sales Page (`client/src/pages/sales.tsx`)

The sales dashboard tab displays 7 metric tiles in a grid, plus 2 supplementary cards.

| Tile Name | Displayed Value Source | Data Source Type | API Endpoint | Notes |
|---|---|---|---|---|
| Total Leads (30d) | `leadSummary.totalLeads` | **API (real/warehouse)** | `GET /api/vin/leads/summary` | Sourced from warehouse metrics or live VinSolutions MCP call |
| New Leads | `leadSummary.newLeads` | **API (real/warehouse)** | `GET /api/vin/leads/summary` | Same source |
| Active Pipeline | `pipeline.activePipeline` or `leadSummary.activeLeads` | **API (real data)** | `GET /api/metrics/dashboard` (pipeline sub-object) | Falls back to lead summary if dashboard metrics unavailable |
| Waiting on Response | `leadSummary.waitingForResponse` | **API (real/warehouse)** | `GET /api/vin/leads/summary` | Same source |
| Appointments Set | `leadSummary.appointments` | **API (real/warehouse)** | `GET /api/vin/leads/summary` | Same source |
| Sold | `leadSummary.soldLeads` | **API (real/warehouse)** | `GET /api/vin/leads/summary` | Same source |
| Conversion Rate | `leadSummary.conversionRate` | **API (real/warehouse)** | `GET /api/vin/leads/summary` | Same source |

**Supplementary Cards:**

| Card | Data Source Type | Notes |
|---|---|---|
| Top Performing Agents | **API (real data)** | `GET /api/agents?department=sales` — lists active agents from DB |
| Recent Activity | **HARDCODED inline** | Static array of 5 items hardcoded directly in the component (lines 236-248): "New lead from website", "Sales Agent qualified lead #1042", etc. |

- **Change percentages**: `change` values come from `leadSummary.*Change` fields (computed by warehouse/VinSolutions sync).
- **Sync status badge**: Shows `leadSummary.source` ("warehouse" or "VinSolutions Live") and `syncedAt` timestamp — real data.

---

### 1.3 Service Page (`client/src/pages/service.tsx`)

The service dashboard tab displays 6 metric tiles.

| Tile Name | Displayed Value Source | Data Source Type | API Endpoint | Notes |
|---|---|---|---|---|
| Active Campaigns | `serviceStats.active` or `campaignStats.active` | **API (computed from real DB)** | `GET /api/metrics/dashboard` | Aggregated from campaigns table |
| Messages Sent | `serviceStats.sent` or `campaignStats.totalSent` | **API (computed from real DB)** | `GET /api/metrics/dashboard` | Aggregated from campaigns table |
| Replies Received | `serviceStats.replied` or `campaignStats.totalReplied` | **API (computed from real DB)** | `GET /api/metrics/dashboard` | Aggregated from campaigns table |
| Open Conversations | `conversationCounts.open` | **API (computed from real DB)** | `GET /api/metrics/dashboard` | Aggregated from conversations table |
| Total Conversations | `conversationCounts.total` | **API (computed from real DB)** | `GET /api/metrics/dashboard` | Aggregated from conversations table |
| Reply Rate | `serviceStats.replyRate` or `campaignStats.replyRate` | **API (computed from real DB)** | `GET /api/metrics/dashboard` | Computed: `replied / sent * 100` |

- **Change values**: All `change` fields are hardcoded to `0` (no trend computation).
- **Campaign table**: Fetched from `GET /api/campaigns?department=service` — real DB data.
- **Agents list**: Fetched from `GET /api/agents?department=service` — real DB data.

---

### 1.4 Marketing Page (`client/src/pages/marketing.tsx`)

The marketing dashboard tab displays 4 metric tiles.

| Tile Name | Displayed Value Source | Data Source Type | API Endpoint | Notes |
|---|---|---|---|---|
| Campaign Performance | `mktStats.replyRate` or `campaignStats.replyRate` | **API (computed from real DB)** | `GET /api/metrics/dashboard` | Reply rate as percentage |
| Campaigns Active | `mktStats.active` or `campaignStats.active` | **API (computed from real DB)** | `GET /api/metrics/dashboard` | Count from campaigns table |
| Messages Sent | `mktStats.sent` or `campaignStats.totalSent` | **API (computed from real DB)** | `GET /api/metrics/dashboard` | Sum from campaigns table |
| Replies Received | `mktStats.replied` or `campaignStats.totalReplied` | **API (computed from real DB)** | `GET /api/metrics/dashboard` | Sum from campaigns table |

- **Change values**: All `change` fields are hardcoded to `0` (no trend computation).
- **Campaign table**: Fetched from `GET /api/campaigns?department=marketing` — real DB data.
- **Agents list**: Fetched from `GET /api/agents?department=marketing` — real DB data.

---

### 1.5 Management Page (`client/src/pages/management.tsx`)

The management dashboard tab displays 6 metric tiles.

| Tile Name | Displayed Value Source | Data Source Type | API Endpoint | Notes |
|---|---|---|---|---|
| Active Pipeline | `pipeline.activePipeline` | **API (real data)** | `GET /api/metrics/dashboard` | From warehouse leads pipeline computation |
| Active Agents | `agentCounts.active` | **API (computed from real DB)** | `GET /api/metrics/dashboard` | Count from agents table |
| Total Conversations | `conversationCounts.total` | **API (computed from real DB)** | `GET /api/metrics/dashboard` | Count from conversations table |
| Open Escalations | `pipeline.openEscalations` | **API (real data)** | `GET /api/metrics/dashboard` | From tasks table (escalation/unsent_message type) |
| Outbound Sent (24h) | `pipeline.outboundSent24h` | **API (real data)** | `GET /api/metrics/dashboard` | From outbound records last 24h |
| Active Campaigns | `campaignStats.active` | **API (computed from real DB)** | `GET /api/metrics/dashboard` | Count from campaigns table |

- **Change values**: All `change` fields are hardcoded to `0` (no trend computation).
- **Activities tab**: Fetched from `GET /api/activity-log` — real DB data (activity_logs table).
- **Hunches tab**: Fetched from `GET /api/hunches` — real DB data (see Intelligence section below).

---

### 1.6 Insights Page (`client/src/pages/insights.tsx`)

The insights page is the largest dashboard (~1964 lines) with 4 tabs. **All of its data comes from mock/hardcoded sources.**

| Section | Data Source | Source File | Data Source Type |
|---|---|---|---|
| Leads Trend Chart | `mockLeadsChart` | `client/src/lib/insight-data.ts` | **MOCK** |
| Conversions Chart | `mockConversionsChart` | `client/src/lib/insight-data.ts` | **MOCK** |
| Red Zone: Hot Leads Going Cold | `mockHotLeadsGoingCold` | `client/src/lib/insight-data.ts` | **MOCK** |
| Red Zone: New Leads No Contact | `mockNewLeadsNoContact` | `client/src/lib/insight-data.ts` | **MOCK** |
| Red Zone: Showroom Not Closed | `mockShowroomNotClosed` | `client/src/lib/insight-data.ts` | **MOCK** |
| Yellow Zone (stale leads, pending finance) | `yellowZoneData` | `client/src/lib/insight-data.ts` | **MOCK** |
| Green Zone Metrics | `greenZoneMetrics` | `client/src/lib/insight-data.ts` | **MOCK** |
| Pipeline Health Data | `pipelineHealthData` | `client/src/lib/insight-data.ts` | **MOCK** |
| Scorecard Conversion Metrics | `scorecardConversionMetrics` | `client/src/lib/insight-data.ts` | **MOCK** |
| Top Lead Sources | `topLeadSources` | `client/src/lib/insight-data.ts` | **MOCK** |
| Channel Performance | `channelPerformance` | `client/src/lib/insight-data.ts` | **MOCK** |
| Week-over-Week Trends | `weekOverWeekTrends` | `client/src/lib/insight-data.ts` | **MOCK** |
| Loss Reason Breakdown | `lossReasonBreakdown` | `client/src/lib/insight-data.ts` | **MOCK** |
| Bad Lead Breakdown | `badLeadBreakdown` | `client/src/lib/insight-data.ts` | **MOCK** |
| Loss Patterns by Source | `lossPatternsBySource` | `client/src/lib/insight-data.ts` | **MOCK** |
| Re-engagement Candidates | `reengagementCandidates` | `client/src/lib/insight-data.ts` | **MOCK** |
| Source Quality Trends | `sourceQualityTrends` | `client/src/lib/insight-data.ts` | **MOCK** |
| Full Channel Comparison | `fullChannelComparison` | `client/src/lib/insight-data.ts` | **MOCK** |
| Digital vs Physical | `digitalVsPhysical` | `client/src/lib/insight-data.ts` | **MOCK** |
| Service Lane Analysis | `serviceLaneAnalysis` | `client/src/lib/insight-data.ts` | **MOCK** |
| Monthly Performance Summary | `monthlyPerformanceSummary` | `client/src/lib/insight-data.ts` | **MOCK** |
| Rolling Forecast | `rollingForecast` | `client/src/lib/insight-data.ts` | **MOCK** |
| Year-over-Year | `yearOverYear` | `client/src/lib/insight-data.ts` | **MOCK** |
| Library Metrics (34 tiles) | `libraryMetrics` array | Hardcoded inline in `insights.tsx` (lines 110+) | **HARDCODED** |

---

## 2. Mock Data Dependency Map for Metrics

### Files Providing Mock/Hardcoded Metric Data

| File | Exports Used By | Mock Data Description |
|---|---|---|
| `client/src/lib/insight-data.ts` | `insights.tsx` | 23+ exported arrays/objects: charts, lead tables, pipeline health, scorecard, channel analysis, forecasts, etc. (~700+ lines of mock data) |
| `client/src/mocks/insights.ts` | `client/src/mocks/index.ts` (barrel export) | Duplicate of `insight-data.ts` content. Contains same mock arrays (mockMetrics, mockLeadsChart, mockGoals, etc.). Exported via barrel but **not directly imported by any dashboard page**. |
| `client/src/mocks/index.ts` | General barrel export | Re-exports from `users`, `agents`, `messages`, `notifications`, `activity`, `files`, `tasks`, `insights`. Not used by main/sales/service/marketing/management dashboard metric tiles. |

### Inline Hardcoded Data in Dashboard Pages

| Page | Hardcoded Data | Description |
|---|---|---|
| `sales.tsx` | Recent Activity feed (lines 236-248) | 5 static activity items with hardcoded action text and timestamps |
| `insights.tsx` | `libraryMetrics` array (lines 110+) | 34 metric tiles with hardcoded values, organized by category |
| All pages | `change` / trend fields | Most tiles hardcode `change: 0` or `change: 'live'` since no historical trend computation exists |

---

## 3. Intelligence / Hunch Feature Status

### Hunches (Management Page + Insights Page)

| Feature | Status | Details |
|---|---|---|
| Hunch listing | **REAL (API-backed)** | `GET /api/hunches` fetches from `hunches` table in database |
| Hunch generation | **REAL (AI-powered)** | `POST /api/hunches/generate` uses Claude AI (Anthropic) to analyze real org data (conversations, campaigns, agents) and generate pattern/recommendation/alert hunches |
| Hunch accept/dismiss/resolve | **REAL (API-backed)** | `PATCH /api/hunches/:id` updates status with timestamps in database |
| Hunch data quality | **REAL** | Generated from actual organization data aggregations (conversation counts, campaign performance, agent status) — not mock data |
| Insights page "Hunches" tab | **PARTIALLY MOCK** | The insights.tsx page has its own Hunches tab but uses inline hardcoded hunch-like data alongside the mock insight-data imports |

### Intelligence Summary
- The hunch system on the **management page is fully real**: AI-generated from actual org data, stored in DB, with full CRUD lifecycle.
- The **insights page analytics** are 100% mock — all charts, tables, zones, and library metrics use hardcoded static data.

---

## 4. Backend Metric Computation Status

### Real Backend Computation Endpoints

| Endpoint | Computation Method | Data Source |
|---|---|---|
| `GET /api/metrics/pipeline` | `storage.getPipelineMetrics()` | Queries `warehouseLeads` table (14-day window), `tasks` table (escalations), outbound messages (24h) |
| `GET /api/metrics/dashboard` | `storage.getDashboardMetrics()` | Aggregates across `conversations`, `messages`, `campaigns`, `agents`, `users` tables + calls `getPipelineMetrics()` |
| `GET /api/vin/leads/summary` | `vendorProxy.ts` route | First checks `warehouseMetrics` table (pre-computed), falls back to live VinSolutions MCP call |
| `GET /api/activity-log` | `storage.getActivityLogs()` | Reads from `activity_logs` table (real user actions) |
| `GET /api/hunches` | `storage.getHunches()` | Reads from `hunches` table (AI-generated) |
| `POST /api/hunches/generate` | Claude AI analysis | Aggregates real conversations, campaigns, agents data into a summary, sends to Claude for analysis |

### Backend Computation Details

**`getDashboardMetrics()`** computes:
- Conversation counts (total, open, closed, by channel) — from `conversations` table with GROUP BY
- Message counts (total, last 30 days) — from `messages` table with JOIN and date filter
- Campaign stats (total, active, sent, replied, reply rate, by department) — from `campaigns` table
- Agent counts (total, active, by department) — from `agents` table
- User counts (total, active) — from `users` table
- Pipeline metrics — delegates to `getPipelineMetrics()`

**`getPipelineMetrics()`** computes:
- Active pipeline: COUNT of `warehouseLeads` created in last 14 days, excluding Lost/Sold/Duplicate statuses
- Appointments today: COUNT of `warehouseLeads` with `ACTIVE_SET_APPOINTMENT` status synced today
- Open escalations: COUNT of `tasks` with status=todo and type=escalation or unsent_message
- Outbound sent 24h: COUNT of outbound messages in last 24 hours

### What Does NOT Exist on Backend
- No historical trend computation (no "vs last 30 days" percentage change calculated server-side for dashboard tiles)
- No insights/analytics computation (the entire insights.tsx analytics pipeline is mock)
- No command center zone computation (Red/Yellow/Green zone data is all mock)
- No pipeline health velocity/freshness computation
- No conversion funnel or scorecard computation
- No loss analysis or channel intelligence computation
- No forecast/ROI computation

---

## 5. Summary: Real vs Mock/Hardcoded Metrics

### By Dashboard Page

| Page | Total Metric Tiles/Displays | Real (API-backed) | Mock/Hardcoded | % Real |
|---|---|---|---|---|
| Main (main.tsx) | 4 tiles | 4 | 0 | **100%** |
| Sales (sales.tsx) | 7 tiles + 2 cards | 7 tiles + 1 card (agents) | 1 card (recent activity) | **80%** |
| Service (service.tsx) | 6 tiles | 6 | 0 | **100%** |
| Marketing (marketing.tsx) | 4 tiles | 4 | 0 | **100%** |
| Management (management.tsx) | 6 tiles + activities + hunches | 6 tiles + activities + hunches | 0 | **100%** |
| Insights (insights.tsx) | 23+ data sections + 34 library tiles | 0 | 57+ | **0%** |

### Overall Totals

| Category | Count |
|---|---|
| **Total unique metric displays across all pages** | ~84+ |
| **Backed by real API data** | ~27 (main: 4, sales: 8, service: 6, marketing: 4, management: ~8) |
| **Backed by mock/hardcoded data** | ~57+ (sales recent activity: 1, insights page: 56+) |
| **Percentage real** | **~32%** |
| **Percentage mock/hardcoded** | **~68%** |

### Key Findings

1. **Department dashboards (main, sales, service, marketing, management) are mostly real** — they pull from actual database tables via computed backend endpoints.
2. **The insights page is 100% mock** — it is the single largest source of mock data in the application, importing everything from `client/src/lib/insight-data.ts`.
3. **Trend/change percentages are largely non-functional** — most tiles hardcode `change: 0` or `change: 'live'` because no historical comparison logic exists on the backend.
4. **The hunch/intelligence system is fully real** — AI-generated from actual org data using Claude, with full DB persistence and lifecycle management.
5. **Sales "Recent Activity" feed is the only hardcoded element on an otherwise real dashboard** — 5 static items inline in the component.
6. **Duplicate mock files exist**: `client/src/mocks/insights.ts` and `client/src/lib/insight-data.ts` contain identical content. The insights page imports from `insight-data.ts`.
7. **VinSolutions lead summary has a real data path** — warehouse metrics pre-computed via sync jobs, with fallback to live MCP calls. This powers the sales dashboard.
