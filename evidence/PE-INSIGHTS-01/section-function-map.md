# Section-Function Map: Insights Page

**Source:** `client/src/pages/insights.tsx` (2155 lines)
**Component:** `InsightsPage({ embedded })` — used standalone at `/insights` and embedded in Sales, Service, Marketing, and Management pages.
**Date:** 2026-04-06

---

## Top-Level Structure

| Section | Function | Description |
|---------|----------|-------------|
| Page Header | inline | Title "Insights", subtitle, store selector (super_admin/partner_admin only) |
| Tab Bar | `<Tabs>` | Four sub-tabs: Dashboard, Reports, Library, Hunches |
| Store Selector | `storeSelector` | Org dropdown for multi-store users; filters all queries by `orgId` |

---

## Tab: Dashboard (`renderDashboard`)

| Zone | UI Section | Elements | Data Source |
|------|-----------|----------|-------------|
| Red Zone | "Immediate Action Required" | 3 cards: Hot Leads Going Cold, New Leads Without Contact, Showroom Visitors Not Closed | `dashboardData.redZone.*` |
| Yellow Zone | "Watch List" | 2 cards: Stale Leads (>7 days) with CSV export, Pending Finance | `dashboardData.yellowZone.*` |
| Green Zone | "Today's Performance" | Dynamic metric cards from `greenZone` array | `dashboardData.greenZone[]` |
| Pipeline Health | Summary cards | Active Pipeline, Freshness Score, Hot Leads, Month-End Forecast + "View Details" button | `dashboardData.pipelineHealth`, computed from `overview` |
| Performance Scorecard | Summary cards | Win Rate, Total Sold, Hot Leads, Total Leads + sparklines + "View Details" button | Computed from `overview` |
| Charts | Two chart cards | "Leads This Week" (AreaChart), "Conversions by Day" (BarChart) | Hardcoded to zeroes (`days.map`) — NOT data-driven |
| Loading State | Skeleton | Shown while `dashboardLoading` is true | — |
| Empty State | Banner | "No lead data available yet" when `totalLeads === 0` | — |

---

## Tab: Reports (`renderReports`)

### Category: Loss & Quality (`renderLossReports`)

| Sub-tab | Content | Data Source |
|---------|---------|-------------|
| Deal Death Autopsy | Loss Reason Breakdown (BarChart), Bad Lead Breakdown (BarChart), Loss Patterns by Source (table) | `reportsData.lossAnalysis`, `reportsData.sourceQualityTrends` |
| Re-Engagement | Candidates table with customer name, days since, source, reason, vehicle, score, Call button | Derived from `hotLeadsGoingCold.slice(0,5)` |
| Source Quality Trends | Line chart with 5 source lines (Internet, Walk-In, Phone, Referral, Service) | `reportsData.sourceQualityTrends` |

### Category: Channel Intelligence (`renderChannelReports`)

| Sub-tab | Content | Data Source |
|---------|---------|-------------|
| Full Comparison | Table (channel, vol, %, win, loss, bad, hot%, show%, delta win, rank) + insight chips | `dashboardData.channelPerformance` |
| Digital vs Physical | Two group cards (Digital vs Physical) with detailed metrics + maturity score | Hardcoded to zeroes |
| Service-to-Sales | Service lane metrics (4 cards), What-If Scenarios, Recommendations | Hardcoded to zeroes |

### Category: Trend & Forecast (`renderTrendReports`)

| Sub-tab | Content | Data Source |
|---------|---------|-------------|
| Monthly Summary | Key metrics cards, volume trend BarChart, biggest winners/losers, executive summary | Computed from `overview` |
| Rolling Forecast | 90-day projection table, gap-to-goal analysis, recommendations | Computed from `overview` |
| Year-over-Year | Annual comparison table, monthly comparison BarChart, achievements | Hardcoded to empty arrays |

---

## Tab: Library (`renderLibrary`)

| Element | Function | Notes |
|---------|----------|-------|
| Search bar | Text filter on metric titles | `librarySearch` state |
| Category filter buttons | Dynamic from metric categories | Role-filtered via `roleCategoryMap` |
| Lookback selector | 7/14/30/60/90 day dropdown | Refetches `/api/insights/library?lookbackDays=X` |
| Grid/List toggle | Layout switch | `libraryView` state |
| Metric cards | 34 browsable tiles showing value, change, trend | From `/api/insights/library` |
| Metric detail dialog | Drill-down rows + AI insight text | From `/api/insights/library/{id}/detail` |
| Role filtering | Limits visible categories by role | `roleCategoryMap` config |

---

## Tab: Hunches (`renderHunches`)

| Element | Function | Notes |
|---------|----------|-------|
| Hunch cards | Opportunity/Threat/Insight typed cards | From `/api/hunches` |
| Dismiss button | Toast notification | No backend call |
| Act button | Toast notification | No backend call |
| Preferences sheet | Notification channels, default view, min confidence slider, auto-dismiss days | All local state, Save = toast only |

---

## Drill-Down Modals (8 total)

| Modal ID | Trigger | Content | Contact Action |
|----------|---------|---------|----------------|
| `hotLeads` | Red Zone card click | Lead table: customer, phone, days old, source, vehicle | Call button (tel: link) |
| `newLeads` | Red Zone card click | Lead table: customer, phone, hours, source | Call + Assign buttons |
| `showroom` | Red Zone card click | Lead table: customer, phone, days old, vehicle, status | Call button |
| `staleLeads` | Yellow Zone card click | Count + avg age summary | Export CSV |
| `pendingFinance` | Yellow Zone card click | Count + over-5-days summary | None |
| `pipelineHealth` | "View Details" button | Velocity indicators, freshness bar, hot lead pie chart, status flow, forecast | Export PDF |
| `scorecardDetail` | "View Details" button | Key metrics, top 5 sources table, channel performance table, WoW trends | None |
| `greenZoneDetail` | Green metric card click | Single metric detail with insight text | None |
| Library detail | Library card click | Drill-down rows + AI insight | None |

---

## API Endpoints Consumed

| Endpoint | Used By | Query Params |
|----------|---------|-------------|
| `GET /api/insights/dashboard` | Dashboard tab | `orgId` (optional) |
| `GET /api/insights/reports` | Reports tab | `orgId` (optional) |
| `GET /api/insights/library` | Library tab | `lookbackDays`, `orgId` (optional) |
| `GET /api/insights/library/:id/detail` | Library detail modal | `lookbackDays`, `orgId` (optional) |
| `GET /api/hunches` | Hunches tab | none |
| `GET /api/organizations` | Store selector | none (super_admin/partner_admin only) |

---

## Known Hardcoded/Zero Data Sections

These sections compute data locally and will show zeroes or empty content when the dashboard API returns no data:

1. **Leads This Week chart** — hardcoded `days.map(d => ({ date: d, value: 0 }))`, never populated from API
2. **Conversions by Day chart** — same hardcoded zero pattern
3. **Digital vs Physical** — hardcoded to all zeroes
4. **Service Lane Analysis** — hardcoded to all zeroes, empty arrays
5. **Year-over-Year** — hardcoded empty arrays
6. **Week-over-Week Trends** — empty array
7. **Monthly volume trends chart** — empty array
