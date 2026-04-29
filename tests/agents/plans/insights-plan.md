# Test Plan: Insights Domain (T-004 -- Exhaustive)

**Domain:** Insights Analytics Dashboard (`/insights`)
**Sprint:** T-004
**Created by:** Planner Agent (T-004)
**Status:** Active
**Known Issues:** I-156 (page never visually verified), I-163 (27 drill-down/Reports/Library states untested)

---

## Source Inventory

| Source | Path | Key Findings |
|--------|------|--------------|
| Insights page component | `client/src/pages/insights.tsx` | ~1800 lines. 4 tabs (Dashboard, Reports, Library, Hunches). Traffic-light zone system (Red/Yellow/Green), 8 drill-down dialogs, 3 report categories with sub-tabs, 34 library metric tiles, AI Hunches feed. |
| Existing E2E tests | `tests/e2e/domain-07-insights.spec.ts` | 6 tests (7.1-7.6): page load (7.1), dashboard zones render (7.2), metric library populates (7.3), role-filtered metrics (7.4), pin-to-dashboard removed (7.5), lead source labels (7.6). |
| Insights API routes | `server/routes/insights.ts` | 4 endpoints: `GET /api/insights/dashboard`, `GET /api/insights/reports`, `GET /api/insights/library`, `GET /api/insights/library/:metricId/detail`. Auth-gated, org-scoped. |
| Hunches API routes | `server/routes/hunches.ts` | `GET /api/hunches` endpoint for AI-generated business insights. |
| Auth helpers | `tests/e2e/helpers/auth.ts` | testUsers: superAdmin, partnerAdmin, orgAdmin, executive, sales, service, marketing + per-dealer org admins. `loginForBrowser()` with cookie-based auth. |

---

## Insights Page Anatomy

### Overall Layout (route: `/insights`)

```
+--------------------------------------------------------------------+
| TopBar (h-14)                                                       |
+------+-------------------------------------------------------------+
| Side |  "Insights" (h1)   [Store Selector -- super/partner only]    |
| bar  |  [Dashboard] [Reports] [Library] [Hunches]  <-- tab bar     |
| 72px |  ─────────────────────────────────────────────               |
|      |  <tab content area -- ScrollArea>                            |
|      |                                                              |
+------+-------------------------------------------------------------+
```

Root tabs: `data-testid="tab-insights-{dashboard|reports|library|hunches}"`
URL sync: `?tab=` query param maps to activeTab via `useEffect`

### Tab: Dashboard

```
RED ZONE ("Immediate Action Required")
├── Hot Leads Going Cold       [data-testid="card-hot-leads"]         -> dialog-hot-leads
├── New Leads Without Contact  [data-testid="card-new-leads-no-contact"] -> dialog-new-leads
└── Showroom Visitors Not Closed [data-testid="card-showroom-visitors"] -> dialog-showroom

YELLOW ZONE ("Watch List")
├── Stale Leads (>7 days)      [data-testid="card-stale-leads"]      -> dialog-stale-leads
└── Pending Finance            [data-testid="card-pending-finance"]   -> dialog-pending-finance

GREEN ZONE ("Today's Performance")
└── Dynamic metric cards       [data-testid="green-metric-gz-{n}"]   -> dialog-green-zone-detail

PIPELINE HEALTH
├── Active Pipeline            [data-testid="pipeline-active"]
├── Freshness Score            [data-testid="pipeline-freshness"]
├── Hot Leads                  [data-testid="pipeline-hot"]
├── Month-End Forecast         [data-testid="pipeline-forecast"]
└── View Details button        [data-testid="button-pipeline-details"] -> dialog-pipeline-health

PERFORMANCE SCORECARD
├── Win Rate, Total Sold, Hot Leads, Total Leads [data-testid="scorecard-sc-{1-4}"]
└── View Details button        [data-testid="button-scorecard-details"] -> dialog-scorecard-detail

CHARTS
├── Leads This Week (AreaChart) [data-testid="chart-leads"]
└── Conversions by Day (BarChart) [data-testid="chart-conversions"]
```

### Tab: Reports

```
Category bar: [Loss & Quality] [Channel Intelligence] [Trend & Forecast]
  [data-testid="report-cat-{loss|channel|trend}"]

LOSS & QUALITY
├── tab1: Deal Death Autopsy   [data-testid="tab-loss-autopsy"]
│   ├── Loss Reason Breakdown (BarChart)
│   ├── Bad Lead Breakdown (BarChart)
│   └── Loss Patterns by Source (table)
├── tab2: Re-Engagement        [data-testid="tab-loss-reengage"]
│   └── Re-Engagement Candidates (table + Call buttons)
└── tab3: Source Quality Trends [data-testid="tab-loss-quality"]
    └── Source Quality Trends (LineChart, 5 series)

CHANNEL INTELLIGENCE
├── tab1: Full Comparison      [data-testid="tab-channel-full"]
│   └── Channel Performance Intelligence (table, 10 columns)
├── tab2: Digital vs Physical  [data-testid="tab-channel-digital"]
│   └── Digital vs Physical comparison
└── tab3: Service-to-Sales     [data-testid="tab-channel-service"]
    └── Service Lane Analysis

TREND & FORECAST
├── tab1: Monthly Summary      [data-testid="tab-trend-monthly"]
├── tab2: Rolling Forecast     [data-testid="tab-trend-forecast"]
└── tab3: Year-over-Year       [data-testid="tab-trend-yoy"]

Export button: [data-testid="button-export-report-pdf"]
```

### Tab: Library

```
Controls:
├── Search input               [data-testid="input-library-search"]
├── Category filters           [data-testid="filter-{category}"]
├── Role filter info badge     [data-testid="library-role-filter-info"]
├── Lookback selector          [data-testid="library-lookback-selector"]
├── Grid/List toggle           [data-testid="button-library-grid"] / [data-testid="button-library-list"]
└── Metric grid container      [data-testid="library-metric-grid"]

Metric cards: [data-testid="library-metric-card-{id}"]
  -> Click opens drill-down dialog [data-testid="library-drilldown-dialog"]

34 metrics across 7 categories: Pipeline, Conversion, Response, Lead Source, Channel, Composite, Forecast
Server-side detail for: lib-1, lib-2, lib-5, lib-8, lib-10, lib-12, lib-16, lib-21, lib-22, lib-27, lib-31, lib-33

Role filtering:
- super_admin / partner_admin / org_admin / executive: ALL categories
- sales_manager / sales: Pipeline, Conversion, Response, Lead Source, Forecast
- service: Pipeline, Response, Channel
- marketing: Lead Source, Channel, Composite, Forecast
```

### Tab: Hunches

```
Preferences button             [data-testid="button-hunch-preferences"]
  -> Sheet [data-testid="sheet-hunch-preferences"]
     ├── Show Hunches toggle   [data-testid="switch-show-hunches"]
     ├── Notification toggles  [data-testid="switch-notif-{in-app|email|sms}"]
     ├── Default view selector [data-testid="select-default-view"]
     ├── Min confidence slider [data-testid="slider-min-confidence"]
     ├── Auto-dismiss days     [data-testid="input-auto-dismiss-days"]
     └── Save button           [data-testid="button-save-hunch-preferences"]

Hunch cards: [data-testid="hunch-{id}"]
  ├── Dismiss button           [data-testid="hunch-dismiss-{id}"]
  └── Act button               [data-testid="hunch-act-{id}"]

Types: opportunity (green), threat (red), insight (blue)
Each has: title, description, type badge, confidence score, source
```

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/insights/dashboard` | Token | Dashboard zones, pipeline health, scorecard, charts, sources |
| GET | `/api/insights/reports` | Token | Loss analysis, source quality, performance summary |
| GET | `/api/insights/library` | Token | 34 metric tiles with values, trends, categories |
| GET | `/api/insights/library/:metricId/detail` | Token | Drill-down rows + AI insight for specific metric |
| GET | `/api/hunches` | Token | AI-generated business hunches list |

Query params: `orgId` (optional, super/partner only), `lookbackDays` (library, default 30)

### Store Selector

Visible only for `super_admin` and `partner_admin` roles.
`data-testid="store-selector"` with `data-testid="select-store-trigger"`.
Options: "All Stores" + org list from `GET /api/organizations`.

---

## Test Cases

### Section 1: Page Load and Layout

| ID | Name | Priority | Existing? | Steps | Expected Result |
|----|------|----------|-----------|-------|-----------------|
| TC-INS-001 | Insights page loads without JS errors | P0 | EXISTING (7.1) | Login as orgAdmin, navigate to /insights, capture pageerror events | Page loads, URL contains "insights", zero JS errors |
| TC-INS-002 | Dashboard zones render | P0 | EXISTING (7.2) | Login as orgAdmin, navigate to /insights, check for zone containers | At least one zone/grid/panel element found |
| TC-INS-003 | Four tabs visible and clickable | P0 | NEW | Login as orgAdmin, navigate to /insights. Verify all four tab triggers exist. | `tab-insights-dashboard`, `tab-insights-reports`, `tab-insights-library`, `tab-insights-hunches` all visible |
| TC-INS-004 | Tab URL sync via query param | P1 | NEW | Navigate to `/insights?tab=reports`. Verify Reports tab is active. Navigate to `?tab=library`, verify Library active. | Tab state syncs from URL query param |
| TC-INS-005 | Loading skeleton displayed while data fetches | P2 | NEW | Login, navigate to /insights. Intercept `/api/insights/dashboard` with delay. Check for `insights-loading` testid. | Skeleton loader appears during API fetch |
| TC-INS-006 | No-data banner when zero leads | P1 | NEW | Login as org with no CRM data. Navigate to /insights. | `no-data-banner` element visible with CRM connection message |

### Section 2: Dashboard -- Red Zone

| ID | Name | Priority | Existing? | Steps | Expected Result |
|----|------|----------|-----------|-------|-----------------|
| TC-INS-010 | Red zone section header visible | P0 | NEW | Login, navigate to /insights. Find "Immediate Action Required" heading. | Red zone header with red dot indicator present |
| TC-INS-011 | Hot Leads Going Cold card renders | P0 | NEW | Verify `card-hot-leads` is visible. Check it shows count, Flame icon, description text. | Card renders with lead count and "Leads aging 14-21 days" description |
| TC-INS-012 | Hot Leads drill-down dialog opens | P0 | NEW | Click `card-hot-leads`. Verify `dialog-hot-leads` appears. | Dialog opens with table showing lead name, phone, days old, source, vehicle, Call button |
| TC-INS-013 | Hot Leads dialog Call button triggers tel: link | P1 | NEW | Open hot leads dialog. If leads exist with phone, click `button-call-{id}`. | `tel:` link triggered or toast "Calling" appears |
| TC-INS-014 | Hot Leads dialog CSV export | P1 | NEW | Open hot leads dialog. Click `button-export-hot-leads`. | Toast "Export CSV" appears |
| TC-INS-015 | New Leads Without Contact card renders | P0 | NEW | Verify `card-new-leads-no-contact` is visible with count. | Card shows count and "No contact in over 48 hours" description |
| TC-INS-016 | New Leads drill-down dialog opens | P0 | NEW | Click `card-new-leads-no-contact`. Verify `dialog-new-leads` appears. | Dialog opens with lead table, Call button, Assign button |
| TC-INS-017 | New Leads dialog Assign button | P1 | NEW | Open new leads dialog. Click `button-assign-{id}`. | Toast "Assigned" with assignment message |
| TC-INS-018 | Showroom Visitors card renders | P0 | NEW | Verify `card-showroom-visitors` is visible with count. | Card shows count and "Open over 7 days" description |
| TC-INS-019 | Showroom drill-down dialog opens | P0 | NEW | Click `card-showroom-visitors`. Verify `dialog-showroom` appears. | Dialog opens with showroom lead table |

### Section 3: Dashboard -- Yellow Zone

| ID | Name | Priority | Existing? | Steps | Expected Result |
|----|------|----------|-----------|-------|-----------------|
| TC-INS-020 | Yellow zone section header visible | P1 | NEW | Verify "Watch List" heading with amber dot indicator. | Yellow zone header present |
| TC-INS-021 | Stale Leads card renders with count and avg age | P0 | NEW | Verify `card-stale-leads` shows count and "Avg Age" text. | Card displays stale lead count and average age |
| TC-INS-022 | Stale Leads CSV export button works | P1 | NEW | Click `button-export-stale` on stale leads card. | Toast "Export CSV" appears |
| TC-INS-023 | Stale Leads drill-down dialog | P0 | NEW | Click `card-stale-leads`. Verify `dialog-stale-leads` opens. | Dialog with stale leads information opens |
| TC-INS-024 | Pending Finance card renders | P0 | NEW | Verify `card-pending-finance` shows count and "deals over 5 days old" text. | Card displays pending finance count |
| TC-INS-025 | Pending Finance drill-down dialog | P0 | NEW | Click `card-pending-finance`. Verify `dialog-pending-finance` opens. | Dialog with pending finance details opens |

### Section 4: Dashboard -- Green Zone

| ID | Name | Priority | Existing? | Steps | Expected Result |
|----|------|----------|-----------|-------|-----------------|
| TC-INS-030 | Green zone section header visible | P1 | NEW | Verify "Today's Performance" heading with green dot indicator. | Green zone header present |
| TC-INS-031 | Green zone metric cards render dynamically | P0 | NEW | Verify at least one `green-metric-gz-*` card exists. Check it shows label, value, trend icon. | Dynamic green metric cards with Total Active Pipeline (30d), Conversion Rate, Total Leads |
| TC-INS-032 | Green zone card click opens detail dialog | P1 | NEW | Click a `green-metric-gz-*` card. Verify `dialog-green-zone-detail` opens. | Dialog shows selected metric detail |

### Section 5: Dashboard -- Pipeline Health

| ID | Name | Priority | Existing? | Steps | Expected Result |
|----|------|----------|-----------|-------|-----------------|
| TC-INS-040 | Pipeline Health section renders 4 cards | P0 | NEW | Verify `pipeline-active`, `pipeline-freshness`, `pipeline-hot`, `pipeline-forecast` all exist. | All four pipeline health cards visible with values |
| TC-INS-041 | Pipeline Health View Details opens full dialog | P0 | NEW | Click `button-pipeline-details`. Verify `dialog-pipeline-health` opens. | Pipeline health detail dialog with freshness bars, velocity, hot leads breakdown, month-end forecast, status flow |
| TC-INS-042 | Forecast card shows red border when behind target | P2 | NEW | With mock data where gap < 0. Verify `pipeline-forecast` has `border-red-500/20` class. | Red border styling applied when forecast is below target |

### Section 6: Dashboard -- Performance Scorecard

| ID | Name | Priority | Existing? | Steps | Expected Result |
|----|------|----------|-----------|-------|-----------------|
| TC-INS-050 | Scorecard renders 4 metric cards | P0 | NEW | Verify `scorecard-sc-1` through `scorecard-sc-4` exist. Check labels: Win Rate, Total Sold, Hot Leads, Total Leads. | Four scorecard cards with values and sparkline mini-charts |
| TC-INS-051 | Scorecard View Details opens dialog | P0 | NEW | Click `button-scorecard-details`. Verify `dialog-scorecard-detail` opens. | Scorecard detail dialog opens with expanded metrics |

### Section 7: Dashboard -- Charts

| ID | Name | Priority | Existing? | Steps | Expected Result |
|----|------|----------|-----------|-------|-----------------|
| TC-INS-060 | Leads This Week chart renders | P1 | NEW | Verify `chart-leads` card exists with title "Leads This Week" and an SVG/canvas element inside. | AreaChart renders with Mon-Sun data points |
| TC-INS-061 | Conversions by Day chart renders | P1 | NEW | Verify `chart-conversions` card exists with title "Conversions by Day" and an SVG element. | BarChart renders with daily conversion data |

### Section 8: Reports Tab -- Loss & Quality

| ID | Name | Priority | Existing? | Steps | Expected Result |
|----|------|----------|-----------|-------|-----------------|
| TC-INS-070 | Reports tab renders with 3 category buttons | P0 | NEW | Click `tab-insights-reports`. Verify `report-cat-loss`, `report-cat-channel`, `report-cat-trend` buttons exist. | Three report category buttons visible |
| TC-INS-071 | Loss & Quality -- Deal Death Autopsy sub-tab | P0 | NEW | Click `report-cat-loss`, verify `tab-loss-autopsy` is active. Check for Loss Reason Breakdown chart, Bad Lead Breakdown chart, Loss Patterns table. | All three visualizations render |
| TC-INS-072 | Loss & Quality -- Re-Engagement sub-tab | P0 | NEW | Click `tab-loss-reengage`. Verify Re-Engagement Candidates table with columns: Customer, Days Since, Source, Reason, Vehicle, Score, Action. | Table renders with Call buttons per candidate |
| TC-INS-073 | Re-Engagement Call button functionality | P1 | NEW | In Re-Engagement table, click `button-reengage-{id}` on a candidate with phone. | Toast "Calling" or tel: link triggered |
| TC-INS-074 | Loss & Quality -- Source Quality Trends sub-tab | P0 | NEW | Click `tab-loss-quality`. Verify LineChart with 5 series (Internet, Walk-In, Phone, Referral, Service). | Multi-line chart renders with legend |
| TC-INS-075 | Reports PDF export button | P1 | NEW | Click `button-export-report-pdf`. | Toast "Export PDF" message appears |

### Section 9: Reports Tab -- Channel Intelligence

| ID | Name | Priority | Existing? | Steps | Expected Result |
|----|------|----------|-----------|-------|-----------------|
| TC-INS-080 | Channel Intelligence -- Full Comparison sub-tab | P0 | NEW | Click `report-cat-channel`, verify `tab-channel-full` active. Check table with 10 columns (Channel, Vol, %, Win, Loss, Bad, Hot%, Show%, Win Delta, Rank). | Full comparison table renders |
| TC-INS-081 | Channel Intelligence -- Digital vs Physical sub-tab | P0 | NEW | Click `tab-channel-digital`. Verify digital vs physical comparison content. | Digital vs Physical comparison renders with metrics and maturity score |
| TC-INS-082 | Channel Intelligence -- Service-to-Sales sub-tab | P0 | NEW | Click `tab-channel-service`. Verify Service Lane Analysis section. | Service lane analysis with performance metrics, opportunity sizing |

### Section 10: Reports Tab -- Trend & Forecast

| ID | Name | Priority | Existing? | Steps | Expected Result |
|----|------|----------|-----------|-------|-----------------|
| TC-INS-090 | Trend & Forecast -- Monthly Summary sub-tab | P0 | NEW | Click `report-cat-trend`, verify `tab-trend-monthly` active. Check for key metrics table and executive summary. | Monthly performance summary with current vs previous period metrics |
| TC-INS-091 | Trend & Forecast -- Rolling Forecast sub-tab | P0 | NEW | Click `tab-trend-forecast`. Verify forecast projections and gap analysis. | Rolling forecast with gap analysis, recommendations |
| TC-INS-092 | Trend & Forecast -- Year-over-Year sub-tab | P0 | NEW | Click `tab-trend-yoy`. Verify YoY comparison data. | Year-over-year comparison with achievements |

### Section 11: Library Tab

| ID | Name | Priority | Existing? | Steps | Expected Result |
|----|------|----------|-----------|-------|-----------------|
| TC-INS-100 | Library tab populates metric tiles | P0 | EXISTING (7.3) | Login as orgAdmin, navigate to /insights, click Library tab. Check for metric items. | At least one metric tile appears |
| TC-INS-101 | Library grid/list view toggle | P1 | NEW | Click `button-library-grid` and `button-library-list`. Verify layout changes. | Grid view shows cards in grid layout; list view shows linear rows |
| TC-INS-102 | Library search filters metrics | P1 | NEW | Type in `input-library-search`. Verify metric count reduces to match query. | Only metrics matching search term are displayed |
| TC-INS-103 | Library category filter | P1 | NEW | Click a category filter button (e.g., `filter-Pipeline`). Verify only matching metrics shown. | Only metrics of selected category displayed |
| TC-INS-104 | Library metric card click opens drill-down dialog | P0 | NEW | Click a `library-metric-card-{id}`. Verify `library-drilldown-dialog` opens. | Dialog shows metric detail rows and AI insight text |
| TC-INS-105 | Library drill-down dialog shows data rows | P0 | NEW | Open drill-down for a metric with server-side detail (e.g., lib-1). Verify rows populate. | Detail rows with labels, values, and optional detail text |
| TC-INS-106 | Library drill-down shows AI insight text | P1 | NEW | Open drill-down dialog. Verify insight paragraph is present (not null/empty). | AI-generated insight text appears below data rows |
| TC-INS-107 | Library lookback selector changes period | P1 | NEW | Change `library-lookback-selector` to a different period. Verify API re-fetches with new lookbackDays. | Metric values update to reflect new lookback period |
| TC-INS-108 | Library role-filter info badge visible | P2 | NEW | Login as sales user. Open Library tab. Verify `library-role-filter-info` badge text indicates filtered view. | Badge shows role-based filter information |
| TC-INS-109 | Library empty state for restricted role | P2 | NEW | Login as role with no matching categories (if any). Verify "No metrics available for your role" message. | Empty state message displayed |

### Section 12: Hunches Tab

| ID | Name | Priority | Existing? | Steps | Expected Result |
|----|------|----------|-----------|-------|-----------------|
| TC-INS-120 | Hunches tab renders hunch cards | P0 | NEW | Click `tab-insights-hunches`. Verify at least one `hunch-{id}` card appears (or empty state). | Hunch cards render with type badge (opportunity/threat/insight), confidence score, source |
| TC-INS-121 | Hunch card shows type-specific styling | P1 | NEW | Verify opportunity cards have green styling, threat cards red, insight cards blue. | Color-coded cards match hunch type |
| TC-INS-122 | Hunch Dismiss button | P1 | NEW | Click `hunch-dismiss-{id}`. Verify toast "Hunch dismissed" appears. | Dismiss toast shown |
| TC-INS-123 | Hunch Act button | P1 | NEW | Click `hunch-act-{id}`. Verify toast "Action initiated" with task creation message. | Action toast shown |
| TC-INS-124 | Hunch Preferences sheet opens | P1 | NEW | Click `button-hunch-preferences`. Verify `sheet-hunch-preferences` appears. | Preferences sheet slides in from right |
| TC-INS-125 | Hunch Preferences -- all controls present | P1 | NEW | Open preferences sheet. Verify: `switch-show-hunches`, `switch-notif-in-app`, `switch-notif-email`, `switch-notif-sms`, `select-default-view`, `slider-min-confidence`, `input-auto-dismiss-days`, `button-save-hunch-preferences` all exist. | All 8 preference controls present and interactive |
| TC-INS-126 | Hunch Preferences -- save triggers toast | P1 | NEW | Toggle some preferences, click `button-save-hunch-preferences`. | Toast "Preferences saved" appears, sheet closes |

### Section 13: Role-Based Access

| ID | Name | Priority | Existing? | Steps | Expected Result |
|----|------|----------|-----------|-------|-----------------|
| TC-INS-130 | Role-filtered metrics differ between roles | P0 | EXISTING (7.4) | Login as orgAdmin and sales, compare insights content. | Both pages load; content may differ based on role |
| TC-INS-131 | Sales role sees filtered library categories | P0 | NEW | Login as sales user. Open Library tab. Verify only Pipeline, Conversion, Response, Lead Source, Forecast categories visible. | Channel, Composite categories not shown |
| TC-INS-132 | Service role sees filtered library categories | P0 | NEW | Login as service user. Open Library tab. Verify only Pipeline, Response, Channel categories visible. | Conversion, Lead Source, Composite, Forecast categories not shown |
| TC-INS-133 | Marketing role sees filtered library categories | P0 | NEW | Login as marketing user. Open Library tab. Verify only Lead Source, Channel, Composite, Forecast categories. | Pipeline, Conversion, Response categories not shown |
| TC-INS-134 | Super admin sees all library categories | P1 | NEW | Login as superAdmin. Open Library tab. Verify all 7 categories available. | All categories: Pipeline, Conversion, Response, Lead Source, Channel, Composite, Forecast |
| TC-INS-135 | Executive role sees all library categories | P1 | NEW | Login as executive. Open Library tab. | All 7 categories available (null = no filter) |

### Section 14: Store Selector (Multi-Org)

| ID | Name | Priority | Existing? | Steps | Expected Result |
|----|------|----------|-----------|-------|-----------------|
| TC-INS-140 | Store selector visible for super_admin | P0 | NEW | Login as superAdmin. Navigate to /insights. Verify `store-selector` is visible. | Store selector dropdown present |
| TC-INS-141 | Store selector visible for partner_admin | P0 | NEW | Login as partnerAdmin. Navigate to /insights. Verify `store-selector` visible. | Store selector present with org options |
| TC-INS-142 | Store selector hidden for org_admin | P1 | NEW | Login as orgAdmin. Navigate to /insights. Verify `store-selector` is NOT present. | No store selector shown |
| TC-INS-143 | Changing store re-fetches dashboard data | P1 | NEW | As super_admin, select a different store from dropdown. Intercept API calls. | `/api/insights/dashboard?orgId=` and `/api/insights/reports?orgId=` called with selected org ID |

### Section 15: Miscellaneous

| ID | Name | Priority | Existing? | Steps | Expected Result |
|----|------|----------|-----------|-------|-----------------|
| TC-INS-150 | Pin to Dashboard removed | P1 | EXISTING (7.5) | Navigate to /insights. Search for "Pin to Dashboard" button or pin icon. | Zero pin-to-dashboard elements found |
| TC-INS-151 | Lead source labels show meaningful names | P1 | EXISTING (7.6) | Navigate to /insights. Check page text for raw "Source #" fallback patterns (renamed from "VIN Source #" by Fix 7.5 / 2026-04-26). | No raw Source # labels present; all resolved to human-readable names |
| TC-INS-152 | Report sub-tab resets when category changes | P2 | NEW | Click Loss category, switch to tab2. Then click Channel category. | Sub-tab resets to tab1 when switching report categories |
| TC-INS-153 | Embedded mode renders without page header | P2 | NEW | Render `<InsightsPage embedded />` (from Sales page Insights tab). Verify no duplicate header. | Embedded mode suppresses standalone page wrapper |

### Section 16: API Endpoint Tests

| ID | Name | Priority | Existing? | Steps | Expected Result |
|----|------|----------|-----------|-------|-----------------|
| TC-INS-160 | Dashboard API returns correct structure | P0 | NEW | `GET /api/insights/dashboard` with valid token. | Response contains: overview, redZone, yellowZone, greenZone, pipelineHealth, topLeadSources, channelPerformance |
| TC-INS-161 | Dashboard API requires auth | P0 | NEW | `GET /api/insights/dashboard` without token. | 401 Unauthorized |
| TC-INS-162 | Dashboard API org access control | P1 | NEW | As orgAdmin, request dashboard with different orgId. | 403 Access denied |
| TC-INS-163 | Reports API returns correct structure | P0 | NEW | `GET /api/insights/reports` with valid token. | Response contains: lossAnalysis, sourceQualityTrends, performanceSummary |
| TC-INS-164 | Library API returns metric array | P0 | NEW | `GET /api/insights/library` with valid token. | Response is array of objects with id, title, value, change, trend, category |
| TC-INS-165 | Library detail API returns rows and insight | P0 | NEW | `GET /api/insights/library/lib-1/detail` with valid token. | Response contains metricId, rows array, insight string |
| TC-INS-166 | Library detail API fallback for unknown metric | P1 | NEW | `GET /api/insights/library/lib-999/detail`. | Response contains empty rows, null insight, note about unavailability |
| TC-INS-167 | Library API respects lookbackDays param | P1 | NEW | `GET /api/insights/library?lookbackDays=7` vs `?lookbackDays=90`. | Different values returned reflecting different time periods |
| TC-INS-168 | Super admin can access other org's data | P1 | NEW | As superAdmin, `GET /api/insights/dashboard?orgId={otherOrg}`. | 200 with data scoped to requested org |

---

## Coverage Summary

| Category | Existing | New | Total |
|----------|----------|-----|-------|
| Page Load & Layout | 2 | 4 | 6 |
| Dashboard -- Red Zone | 0 | 10 | 10 |
| Dashboard -- Yellow Zone | 0 | 6 | 6 |
| Dashboard -- Green Zone | 0 | 3 | 3 |
| Dashboard -- Pipeline Health | 0 | 3 | 3 |
| Dashboard -- Scorecard | 0 | 2 | 2 |
| Dashboard -- Charts | 0 | 2 | 2 |
| Reports -- Loss & Quality | 0 | 6 | 6 |
| Reports -- Channel Intel | 0 | 3 | 3 |
| Reports -- Trend & Forecast | 0 | 3 | 3 |
| Library Tab | 1 | 9 | 10 |
| Hunches Tab | 0 | 7 | 7 |
| Role-Based Access | 1 | 5 | 6 |
| Store Selector | 0 | 4 | 4 |
| Miscellaneous | 2 | 2 | 4 |
| API Endpoints | 0 | 9 | 9 |
| **TOTAL** | **6** | **78** | **84** |

---

## Issue Coverage Mapping

| Issue | Description | Test Cases Covering |
|-------|-------------|---------------------|
| I-156 | Page never visually verified | TC-INS-001 through TC-INS-006 (page load), all dashboard section tests |
| I-163 | 27 drill-down/Reports/Library states untested | TC-INS-012, 016, 019, 023, 025, 032, 041, 051 (8 drill-downs), TC-INS-070-092 (9 Reports sub-tabs), TC-INS-100-109 (10 Library states) = 27 states covered |

---

## Drill-Down Dialog Inventory (I-163)

| # | Dialog | Trigger | data-testid |
|---|--------|---------|-------------|
| 1 | Hot Leads Going Cold | Click card-hot-leads | dialog-hot-leads |
| 2 | New Leads Without Contact | Click card-new-leads-no-contact | dialog-new-leads |
| 3 | Showroom Visitors | Click card-showroom-visitors | dialog-showroom |
| 4 | Stale Leads | Click card-stale-leads | dialog-stale-leads |
| 5 | Pending Finance | Click card-pending-finance | dialog-pending-finance |
| 6 | Pipeline Health | Click button-pipeline-details | dialog-pipeline-health |
| 7 | Scorecard Detail | Click button-scorecard-details | dialog-scorecard-detail |
| 8 | Green Zone Detail | Click green-metric-gz-* | dialog-green-zone-detail |
| 9 | Library Metric Drill-down | Click library-metric-card-* | library-drilldown-dialog |

Reports Sub-Tabs (9 states):
1. Loss > Deal Death Autopsy (tab-loss-autopsy)
2. Loss > Re-Engagement (tab-loss-reengage)
3. Loss > Source Quality Trends (tab-loss-quality)
4. Channel > Full Comparison (tab-channel-full)
5. Channel > Digital vs Physical (tab-channel-digital)
6. Channel > Service-to-Sales (tab-channel-service)
7. Trend > Monthly Summary (tab-trend-monthly)
8. Trend > Rolling Forecast (tab-trend-forecast)
9. Trend > Year-over-Year (tab-trend-yoy)

Library States (9+ states):
1. Grid view with all categories
2. List view
3. Search filtered
4. Category filtered
5. Metric drill-down dialog open
6-9. Role-filtered views (sales, service, marketing, admin)
