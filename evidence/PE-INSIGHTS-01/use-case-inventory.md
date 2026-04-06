# Use Case Inventory: Insights Page

**Date:** 2026-04-06
**Source:** `client/src/pages/insights.tsx`, DOM inventory, operator bug reports

---

## Dashboard Tab

### UC-01: Red Zone Action Cards Display
**What:** Three cards (Hot Leads Going Cold, New Leads Without Contact, Showroom Visitors Not Closed) render with count badges and are clickable.
**Expected:** Each card shows a count from API data. Click opens a drill-down dialog with a table of individual leads.
**Elements:** `card-hot-leads`, `card-new-leads-no-contact`, `card-showroom-visitors`

### UC-02: Red Zone Drill-Down Modals — Contact Actions
**What:** Each red zone modal shows a table of leads with customer name, phone number, and action buttons (Call, Assign).
**Expected:** Customer names display as human-readable names (not cryptic IDs). Phone numbers are clickable via `tel:` links. Call button initiates `window.open(tel:...)`. Assign button (New Leads only) triggers a toast.
**Elements:** `dialog-hot-leads`, `dialog-new-leads`, `dialog-showroom`, `button-call-*`, `button-assign-*`
**Operator Bug:** "Some metrics/cards missing contact button, shows cryptic ID numbers" — the `customerName` field may be null, falling back to `leadId` (a UUID). Call buttons disable when `customerPhone` is null.

### UC-03: Yellow Zone Watch Cards
**What:** Stale Leads and Pending Finance cards with counts.
**Expected:** Stale Leads card shows count + avg age + CSV export button. Pending Finance card shows count + over-5-days count. Both clickable for drill-down.
**Elements:** `card-stale-leads`, `card-pending-finance`, `button-export-stale`

### UC-04: Green Zone Performance Metrics
**What:** Dynamic metric cards from `dashboardData.greenZone` array (Pipeline Active, Conversion Rate, Total Leads, etc.).
**Expected:** Each card shows label, value, trend icon, change text. Click opens green zone detail dialog.
**Elements:** `green-metric-gz-*`, `dialog-green-zone-detail`

### UC-05: Pipeline Health Summary + Detail Modal
**What:** Four summary cards (Active Pipeline, Freshness Score, Hot Leads, Month-End Forecast) + "View Details" button opening full Pipeline Health Monitor.
**Expected:** Summary cards show computed values from API data. Detail modal shows velocity indicators, freshness bar, hot lead pie chart, status flow visualization, month-end forecast.
**Elements:** `pipeline-active`, `pipeline-freshness`, `pipeline-hot`, `pipeline-forecast`, `button-pipeline-details`, `dialog-pipeline-health`

### UC-06: Performance Scorecard Summary + Detail Modal
**What:** Four scorecard cards (Win Rate, Total Sold, Hot Leads, Total Leads) with sparklines + "View Details" button.
**Expected:** Cards show computed values. Detail modal shows key metrics, top 5 lead sources table, channel performance table, week-over-week trends.
**Elements:** `scorecard-sc-*`, `button-scorecard-details`, `dialog-scorecard-detail`

### UC-07: Dashboard Charts (Leads This Week, Conversions by Day)
**What:** AreaChart for leads trend, BarChart for conversions by day.
**Expected:** Charts should populate with real data from the API.
**Operator Bug:** "Report graphs not populating except bad lead breakdown" — the chart data is hardcoded to zeroes (`days.map(d => ({ date: d, value: 0 }))`). The API does not provide daily lead/conversion data; the frontend never maps API data to these charts.
**Elements:** `chart-leads`, `chart-conversions`

---

## Reports Tab

### UC-08: Loss & Quality Reports
**What:** Three sub-tabs: Deal Death Autopsy (loss reason + bad lead bar charts, loss patterns table), Re-Engagement (candidates table with Call buttons), Source Quality Trends (line chart).
**Expected:** Charts and tables populate from `/api/insights/reports` data. Re-engagement candidates table shows names, not IDs. Call buttons work.
**Operator Bug:** Call button in re-engagement table — the `handleCall` function uses `window.open(tel:...)` but button may be disabled if `customerPhone` is null.
**Elements:** `tab-loss-autopsy`, `tab-loss-reengage`, `tab-loss-quality`, `button-reengage-*`

### UC-09: Channel Intelligence Reports
**What:** Three sub-tabs: Full Comparison (table), Digital vs Physical (two comparison cards), Service-to-Sales (lane analysis metrics).
**Expected:** Full Comparison table populates from `dashboardData.channelPerformance`. Digital vs Physical and Service-to-Sales are hardcoded to zeroes.
**Elements:** `tab-channel-full`, `tab-channel-digital`, `tab-channel-service`

### UC-10: Trend & Forecast Reports
**What:** Three sub-tabs: Monthly Summary (metrics + chart + executive summary), Rolling Forecast (projection table + gap analysis), Year-over-Year (annual table + chart).
**Expected:** Monthly Summary uses computed values from API. Rolling Forecast and YoY use hardcoded empty arrays.
**Elements:** `tab-trend-monthly`, `tab-trend-forecast`, `tab-trend-yoy`

### UC-11: Report Export
**What:** PDF export button in reports header.
**Expected:** Export button triggers toast "PDF export has been generated." No actual file generation occurs.
**Elements:** `button-export-report-pdf`

---

## Library Tab

### UC-12: Library Metric Grid/List Display
**What:** 34 browsable metric tiles organized by category, with grid/list toggle, search, category filter, lookback selector.
**Expected:** Metrics load from `/api/insights/library`. Cards show title, value, change, trend icon. Metrics missing data show em-dash with "Data source not connected" text.
**Operator Bug:** "Library cards don't populate (daily new lead volume missing)" — if the API returns metrics with value "\u2014" (em-dash), the card shows the placeholder state. If the API returns no metrics at all, an empty state message shows.
**Elements:** `library-metric-grid`, `library-metric-card-*`, `input-library-search`, `filter-*`, `library-lookback-selector`, `button-library-grid`, `button-library-list`

### UC-13: Library Metric Detail Drill-Down
**What:** Clicking a library metric opens a detail dialog with drill-down rows, AI-generated insight text, and optional note.
**Expected:** Dialog shows metric value, change vs last period, then fetches `/api/insights/library/{id}/detail` for drill-down rows and insight. Loading skeleton shown during fetch.
**Elements:** `library-drilldown-dialog`

### UC-14: Library Role-Based Filtering
**What:** Metrics are filtered by user role (e.g., sales users only see Pipeline, Conversion, Response, Lead Source, Forecast categories).
**Expected:** Role filter badge shows when active. Non-admin roles see restricted category set.
**Elements:** `library-role-filter-info`

---

## Hunches Tab

### UC-15: Hunch Cards Display
**What:** AI-generated hunch cards with type (opportunity/threat/insight), confidence score, source, description.
**Expected:** Cards load from `/api/hunches`. Each card has Dismiss and Act buttons.
**Elements:** `hunch-*`, `hunch-dismiss-*`, `hunch-act-*`

### UC-16: Hunch Preferences Sheet
**What:** Side sheet with notification preferences (in-app, email, SMS), default view, min confidence slider, auto-dismiss days.
**Expected:** Preferences are local state only — Save button triggers toast but does not persist to backend.
**Elements:** `button-hunch-preferences`, `sheet-hunch-preferences`, `switch-show-hunches`, `switch-notif-*`, `select-default-view`, `slider-min-confidence`, `input-auto-dismiss-days`, `button-save-hunch-preferences`

---

## Cross-Cutting

### UC-17: Store Selector (Multi-Store Users)
**What:** Dropdown for super_admin/partner_admin to filter all Insights data by organization.
**Expected:** Selecting a store appends `orgId=` to all API queries. "All Stores" clears the filter.
**Elements:** `store-selector`, `select-store`, `store-option-*`

### UC-18: Embedded Mode
**What:** Insights page renders embedded inside Sales, Service, Marketing, and Management pages without its own header.
**Expected:** When `embedded=true`, page header and mobile nav are hidden. Tab bar still shows. Store selector moves into tab bar area.
