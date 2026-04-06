# PE-INSIGHTS-01 Bug Log

**Date:** 2026-04-06
**Evaluator:** Playwright Operator

---

## BUG-INS-01: Hot Leads Modal Shows No Customer Names (CRITICAL)

**Severity:** Critical
**Location:** Insights > Dashboard > Hot Leads Going Cold modal
**Evidence:** screenshots/UC-07-hot-leads-modal.png

**Description:** The Customer column in the Hot Leads Going Cold drill-down modal shows "--" (dash) with raw VIN Solutions contact IDs below (e.g., "1980183368") for all 20 rows. No customer names are resolved. This makes the modal unusable for its intended purpose (identifying which customers need follow-up).

**Root Cause (likely):** The `customerName` field is null for these leads. The fallback displays the VIN Solutions `contactId` instead of resolving the name from the CRM.

**Contrast:** The "New Leads Without Contact" modal DOES show names for some contacts (e.g., "Dasha Cumbie", "Duane Wells"), suggesting those leads were created with name data while synced/imported leads were not.

---

## BUG-INS-02: Hot Leads Modal Shows No Phone Numbers (CRITICAL)

**Severity:** Critical
**Location:** Insights > Dashboard > Hot Leads Going Cold modal
**Evidence:** screenshots/UC-07-hot-leads-modal.png

**Description:** The Phone column shows "--" (dash) for all 20 rows. Because phone is null, all Call buttons are disabled (greyed out). Users cannot contact any of the hot leads from this view.

**Impact:** The entire purpose of the "Immediate Action Required" card is to enable quick follow-up. With no phone numbers and disabled Call buttons, this is completely non-functional.

---

## BUG-INS-03: Vehicle Column Shows Raw API URLs (HIGH)

**Severity:** High
**Location:** Insights > Dashboard > Hot Leads Going Cold modal
**Evidence:** screenshots/UC-07-hot-leads-modal.png

**Description:** The Vehicle column shows raw VIN Solutions API endpoint URLs (e.g., "https://api.vinsolutions.com/vehicles/interest/id/1980183368-0") instead of human-readable vehicle descriptions (year, make, model). The URLs are truncated in the UI and completely meaningless to users.

**Root Cause (likely):** The `vehicleOfInterest` field stores the API URL rather than resolving it to vehicle details.

---

## BUG-INS-04: CSV Export Is Toast-Only, No File Download (MEDIUM)

**Severity:** Medium
**Location:** Insights > Dashboard > Stale Leads modal > "Export Full List (CSV)" button
**Evidence:** screenshots/UC-11-csv-export-toast.png

**Description:** Clicking "Export Full List (CSV)" shows a success toast ("CSV export has been generated and is ready for download") but no actual file download occurs. The browser does not trigger a download. The export functionality is entirely cosmetic.

**Confirmed:** This matches the code analysis finding that export buttons are toast-only with no real export implementation.

---

## BUG-INS-05: Channel Intelligence Report Crashes Page (CRITICAL)

**Severity:** Critical
**Location:** Insights > Reports > Channel Intelligence button
**Evidence:** screenshots/UC-13-channel-intelligence.png

**Description:** Clicking the "Channel Intelligence" category button on the Reports tab causes a JavaScript runtime error: `Cannot read properties of undefined (reading 'includes')`. The entire page crashes with the error boundary ("Something went wrong"). Users must reload the page.

**Impact:** One of three report categories is completely inaccessible.

---

## BUG-INS-06: Menu Tab Switching Does Not Work (HIGH)

**Severity:** High
**Location:** Insights page > Menu dropdown
**Evidence:** screenshots/UC-12-reports-tab.png (shows Dashboard content despite ?tab=reports URL)

**Description:** Selecting a tab from the Menu dropdown (e.g., Reports, Library) updates the URL query parameter but does NOT switch the displayed content. The Dashboard tabpanel continues to render. Only direct URL navigation (page reload with ?tab=X) loads the correct tab content.

**Impact:** Users cannot navigate between Insights sub-pages using the intended UI. They would need to know the URL parameters.

---

## BUG-INS-07: Activity Tab Not Implemented (MEDIUM)

**Severity:** Medium
**Location:** Insights > Menu > Activity
**Evidence:** screenshots/activity-tab.png

**Description:** Navigating to ?tab=activity renders the Dashboard content. The Activity tab either has no implementation or the route is not properly handled. The tab appears in the menu but shows no unique content.

---

## BUG-INS-08: Loss Patterns Table Is Empty (MEDIUM)

**Severity:** Medium
**Location:** Insights > Reports > Loss & Quality > Deal Death Autopsy > Loss Patterns by Source table
**Evidence:** screenshots/UC-13-reports-table.png

**Description:** The "Loss Patterns by Source" table lists 10 VIN Source IDs but all data columns are empty:
- "Lost" column: blank
- "Top Reason" column: "N/A" for all rows
- "%" column: shows bare "%" with no number
- "Avg Days" column: blank

The table header and structure render correctly but no loss data is populated.

---

## BUG-INS-09: Library Drill-Down Shows Raw API URLs (HIGH)

**Severity:** High
**Location:** Insights > Library > Daily New Lead Volume card > drill-down modal
**Evidence:** screenshots/UC-16-daily-lead-volume-detail.png

**Description:** The Daily New Lead Volume drill-down modal lists lead sources as raw VIN Solutions API URLs (e.g., "https://api.vinsolutions.com/leadsources/id/7098?dealerid=21043") instead of human-readable source names. Each entry shows a count and win rate, but the source names are unintelligible.

**Additional issue:** The modal header shows "0" as the current daily volume, but the footer text says "Average daily new lead volume is 11.3 leads/day across 40 sources." This is contradictory.

---

## BUG-INS-10: Trend & Forecast Chart Empty (LOW)

**Severity:** Low
**Location:** Insights > Reports > Trend & Forecast > Monthly Summary
**Evidence:** screenshots/UC-13-trend-forecast.png, UC-13-trend-winners-concerns.png

**Description:** The Trend & Forecast chart area renders only dotted gridlines with no data lines, bars, or points. The summary cards below (Total Leads: 340, Sold: 10) show data, but the chart visualization is empty. This may be due to insufficient historical data rather than a code bug.

---

## BUG-INS-11: Freshness Score Shows N/A (LOW)

**Severity:** Low
**Location:** Insights > Dashboard > Pipeline Health section
**Evidence:** screenshots/UC-03-todays-performance.png

**Description:** The "Freshness Score" metric in Pipeline Health shows "N/A" despite having the context "41% under 7 days" displayed below it. The metric should resolve to a score rather than showing N/A.

---

## BUG-INS-12: No Sidebar Link to Insights (LOW)

**Severity:** Low
**Location:** Main sidebar navigation
**Evidence:** screenshots/UC-00-initial-page.png

**Description:** There is no "Insights" link in the sidebar navigation. Users must navigate to /insights via URL or from another page link. The sidebar shows: AI Chat, TeamBox, Sales, Service, Marketing, Manage, System, Logout -- but no Insights entry.

---

## Operator Bug Verification Summary

| Operator Bug | Status | Notes |
|-------------|--------|-------|
| #1: Missing contact button, cryptic IDs | CONFIRMED | Hot Leads modal: no names, no contact button, IDs shown |
| #2: Call button doesn't work in modals | CONFIRMED (partial) | Disabled in Hot Leads (no phone), works in New Leads |
| #3: Report graphs not populating except bad lead breakdown | PARTIALLY CONFIRMED | Loss Reason + Bad Lead charts work. Channel Intel crashes. Trend chart empty. |
| #4: Library cards don't populate | NOT CONFIRMED as stated | Cards DO populate with data. Daily New Lead Volume shows 0 (correct data, not missing). Drill-down shows raw URLs. |
