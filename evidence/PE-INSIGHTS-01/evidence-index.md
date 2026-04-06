# PE-INSIGHTS-01 Evidence Index

**Date:** 2026-04-06
**Evaluator:** Playwright Operator (observation only)
**Target:** https://live.huminic.app/insights
**Login:** serra_honda@huminic.ai (org_admin, Serra Honda)
**Mode:** Read-only evaluation, no code changes

---

## Phase 1: Dashboard Tab

### UC-01: Page Load
- **Result:** PASS (with caveats)
- **Evidence:** screenshots/UC-01-insights-landing.png, UC-01-dashboard-clean.png, UC-01-menu-tabs.png
- **Findings:**
  - Page loads at /insights, defaults to Dashboard tab
  - No "Insights" link in sidebar navigation -- must navigate via URL or from another page
  - Menu dropdown reveals 5 tabs: Dashboard, Reports, Library, Hunches, Activity
  - Tab switching via Menu dropdown does NOT work (URL updates but content stays on Dashboard). Direct URL navigation (?tab=reports, ?tab=library) DOES work.
  - Auto-login worked (existing session)

### UC-02: Action Cards (Immediate Action Required)
- **Result:** PASS -- populated with live data
- **Evidence:** screenshots/UC-01-dashboard-clean.png
- **Findings:**
  - 3 action cards displayed: Hot Leads Going Cold (20), New Leads Without Contact (9), Showroom Visitors Not Closed (0)
  - All show count values and descriptions
  - "Last updated: 8:45 AM" timestamp shown
  - Cards are clickable (cursor=pointer) and open modals

### UC-03: Green Zone Metrics / Today's Performance
- **Result:** PASS -- populated
- **Evidence:** screenshots/UC-03-todays-performance.png
- **Findings:**
  - Pipeline Active: 139
  - Conversion Rate: 2.9%
  - Total Leads: 340
  - Numbers appear plausible for a Honda dealership

### UC-04: Pipeline Health
- **Result:** PARTIAL -- mostly populated, one N/A
- **Evidence:** screenshots/UC-03-todays-performance.png, UC-04-pipeline-health.png
- **Findings:**
  - Active Pipeline: 340 leads in play
  - Freshness Score: N/A (but shows "41% under 7 days" below)
  - Hot Leads: 139 (41% of active)
  - Month-End Forecast: 10 (-40 vs target 50)
  - "View Details" button present

### UC-05: Charts
- **Result:** PARTIAL -- charts render but show minimal data
- **Evidence:** screenshots/UC-05-charts.png, UC-05-conversions-chart.png
- **Findings:**
  - "Leads This Week" chart: renders with axes (Mon-Sun, 0-4), shows ~3 leads on Monday only, zeros rest of week
  - "Conversions by Day" chart: renders with axes, shows ~4 on Monday only, zeros rest of week
  - Charts are NOT hardcoded to zero as code analysis suggested -- they show some Monday data
  - Y-axis max is 4, suggesting very low volume or partial week data (today is Sunday)

### UC-06: Performance Scorecard
- **Result:** PASS -- populated
- **Evidence:** screenshots/UC-04-pipeline-health.png
- **Findings:**
  - Win Rate: 2.9%
  - Total Sold: 10
  - Hot Leads: 139
  - Total Leads: 340
  - Trend arrows shown (green up arrows on some)
  - "View Details" button present

---

## Phase 2: Drill-Down Modals

### UC-07: Modal Opens with Data
- **Result:** PASS -- modals open and show data
- **Evidence:** screenshots/UC-07-hot-leads-modal.png, UC-07-new-leads-modal.png, UC-07-stale-leads-modal.png
- **Findings:**
  - Hot Leads Going Cold: opens table with 20 rows
  - New Leads Without Contact: opens table with 9 rows
  - Stale Leads: opens summary view (330 leads, avg age 14 days)

### UC-08: Customer Names vs UUIDs -- CONFIRMED BUG
- **Result:** FAIL (partial)
- **Evidence:** screenshots/UC-07-hot-leads-modal.png, UC-07-new-leads-modal.png
- **Findings:**
  - **Hot Leads modal:** Customer column shows "--" with VIN Solutions contact IDs below (e.g., "1980183368"). NO customer names resolved. All 20 rows affected.
  - **New Leads modal:** Customer names DO show for some (Dasha Cumbie, Duane Wells) but most show "AI Lead" with numeric IDs. Mixed result.
  - The inconsistency suggests customerName is only available when the lead was created with a name (test leads vs synced leads).

### UC-09: Contact Button -- CONFIRMED BUG
- **Result:** FAIL
- **Evidence:** screenshots/UC-07-hot-leads-modal.png
- **Findings:**
  - Hot Leads modal: NO "Show Contact" button exists. Only a disabled "Call" button.
  - New Leads modal: Has "Call" and "Assign" buttons (both enabled when phone exists).
  - No way to view full contact details from the Hot Leads modal.

### UC-10: Call Button -- CONFIRMED BUG (partial)
- **Result:** FAIL (Hot Leads) / PASS (New Leads)
- **Evidence:** screenshots/UC-07-hot-leads-modal.png, UC-07-new-leads-modal.png
- **Findings:**
  - **Hot Leads modal:** ALL Call buttons are disabled (greyed out) because phone column shows "--" for every row. No phone numbers resolved.
  - **New Leads modal:** Call buttons are ENABLED and phone numbers display correctly (e.g., 2568623318, 3332072032).
  - Root cause: Hot Leads query does not resolve customer phone numbers.

### UC-11: Non-functional Buttons / CSV Export -- CONFIRMED BUG
- **Result:** FAIL
- **Evidence:** screenshots/UC-11-csv-export-toast.png
- **Findings:**
  - "Export Full List (CSV)" button in Stale Leads modal shows toast: "Export CSV - CSV export has been generated and is ready for download" but NO actual file download occurs.
  - Hot Leads modal has an "Export CSV" button at the bottom (not tested but likely same behavior).
  - Stale Leads CSV button on the card itself exists but behavior untested.

### Additional Modal Findings:
- **Vehicle column in Hot Leads:** Shows raw VIN Solutions API URLs (e.g., "https://api.vinsolutions.com/vehicles/interest/id/1980183368-0") instead of vehicle year/make/model. Completely unusable.
- **Source column:** Shows "VIN Source #XXXX" format -- numeric IDs, not human-readable source names.

---

## Phase 3: Reports Tab

### UC-12: Reports Tab
- **Result:** PARTIAL -- loads via direct URL only
- **Evidence:** screenshots/UC-12-reports-tab.png, UC-12-reports-direct-nav.png
- **Findings:**
  - Tab switching via Menu dropdown does NOT change content (URL changes but Dashboard stays). Must use direct URL navigation.
  - Reports has 3 category buttons: Loss & Quality, Channel Intelligence, Trend & Forecast
  - Plus an Export button
  - Loss & Quality has sub-tabs: Deal Death Autopsy, Re-Engagement, Source Quality Trends

### UC-13: Report Graphs -- PARTIALLY CONFIRMED BUG
- **Result:** PARTIAL
- **Evidence:** screenshots/UC-13-reports-charts.png, UC-13-reports-table.png, UC-13-channel-intelligence.png, UC-13-trend-forecast.png
- **Findings:**
  - **Loss Reason Breakdown chart:** POPULATED -- shows red bar chart (December 2025, 128 Losses, 95 Bad Leads), Y-axis 0-8, label "Lost"
  - **Bad Lead Breakdown chart:** POPULATED -- shows orange/yellow bar, Y-axis 0-100, label "Bad/Invalid"
  - **Loss Patterns by Source table:** MOSTLY EMPTY -- Sources show VIN Source IDs, but Lost count is blank, Top Reason is "N/A", % shows bare "%" with no number, Avg Days is blank. 10 rows all incomplete.
  - **Channel Intelligence:** CRASHES -- clicking this button causes JavaScript error: "Cannot read properties of undefined (reading 'includes')" -- entire page crashes with error boundary.
  - **Trend & Forecast:** Loads with Monthly Summary sub-tab. Shows Total Leads (340) and Sold (10). Chart area shows only dotted gridlines (no data plotted). "Biggest Winners" section shows "CRM data connected -- real metrics flowing". Concerns card appears empty. Recommendations says "Ensure VinSolutions sync is active."

### UC-14: Empty Graph Placeholders
- **Result:** CONFIRMED
- **Evidence:** screenshots/UC-13-trend-forecast.png, UC-13-trend-winners-concerns.png
- **Findings:**
  - Trend & Forecast chart renders as empty gridlines only -- no data lines or bars
  - Monthly Performance Summary shows numbers but no visual trend chart

---

## Phase 4: Library Tab

### UC-15: Library Tab
- **Result:** PASS -- rich content
- **Evidence:** screenshots/UC-15-library-tab.png
- **Findings:**
  - Library loads with search bar, category filters (All, Pipeline, Conversion, Response, Lead Source, Channel, Composite, Forecast)
  - Time range selector (Last 30 days)
  - Grid/list view toggle
  - Cards display with category badge, metric name, value, and trend indicator

### UC-16: Library Card Data -- PARTIALLY CONFIRMED BUG
- **Result:** PARTIAL
- **Evidence:** screenshots/UC-15-library-tab.png, UC-16-library-cards-mid.png, UC-16-daily-lead-volume-detail.png
- **Findings:**
  - Cards ARE populated with data (contradicts operator bug #4 claim that "library cards don't populate")
  - Total Active Pipeline: 139 (-32%)
  - Daily New Lead Volume: 0 (--) -- this specific card shows zero, confirming operator's "daily new lead volume missing" concern
  - Weekly Lead Trend: 0/day (-100%)
  - MoM Lead Growth: -100%
  - Many conversion metrics show 0% 
  - Some cards show "Data source not connected" (Service-to-Sales, Avg Time to 1st Contact, Pipeline Coverage Ratio)
  - **Drill-down modal for Daily New Lead Volume:** Shows raw VIN API URLs instead of source names (e.g., "https://api.vinsolutions.com/leadsources/id/7098?dealerid=21043"). Lists 40 sources with win rates. Bottom text says "Average daily new lead volume is 11.3 leads/day" which contradicts the "0" displayed.

### UC-17: Coming Soon / Empty States
- **Result:** N/A
- **Evidence:** screenshots/UC-15-library-tab.png
- **Findings:**
  - No "coming soon" placeholders observed
  - Cards with no data show "--" or "Data source not connected" with a warning icon
  - This is a reasonable empty state pattern

---

## Phase 5: Store Switching

### UC-18: Store Switch
- **Result:** PASS
- **Evidence:** screenshots/UC-18-store-selector.png, UC-18-serra-nissan-library.png
- **Findings:**
  - Store selector dropdown lists 8 options: All Stores, Serra Honda, Serra Nissan, Tony Serra Ford, Hyundai of Columbia, Ford of Columbia, Huminic, Cage Automotive
  - Switching from "All Stores" to "Serra Nissan" changed Total Active Pipeline from 139 to 116 -- data is org-specific
  - Store selection resets when navigating to a new tab via URL (expected)

---

## Bonus: Additional Tabs

### Hunches Tab
- **Result:** POPULATED
- **Evidence:** screenshots/hunches-tab.png
- **Findings:** Shows "AI-Generated Hunches" with real AI insight about test campaign pollution. Confidence score shown (93). Not in original use cases but functional.

### Activity Tab
- **Result:** FAILS to load -- falls back to Dashboard
- **Evidence:** screenshots/activity-tab.png
- **Findings:** Navigating to ?tab=activity shows Dashboard content instead. Either the tab is not implemented or the routing is broken.

---

## Summary

| UC | Description | Result |
|----|-------------|--------|
| UC-01 | Page loads | PASS (no sidebar link) |
| UC-02 | Action cards | PASS |
| UC-03 | Performance metrics | PASS |
| UC-04 | Pipeline Health | PARTIAL (N/A freshness) |
| UC-05 | Charts | PARTIAL (minimal data) |
| UC-06 | Scorecard | PASS |
| UC-07 | Modal drill-down | PASS (opens) |
| UC-08 | Names vs UUIDs | FAIL (Hot Leads) |
| UC-09 | Contact button | FAIL (missing) |
| UC-10 | Call button | FAIL (Hot Leads disabled) |
| UC-11 | Export CSV | FAIL (toast only) |
| UC-12 | Reports tab | PARTIAL (menu broken) |
| UC-13 | Report graphs | PARTIAL (2 work, 1 crashes) |
| UC-14 | Empty placeholders | CONFIRMED |
| UC-15 | Library tab | PASS |
| UC-16 | Library data | PARTIAL (zero volume) |
| UC-17 | Coming soon states | N/A (none found) |
| UC-18 | Store switching | PASS |
