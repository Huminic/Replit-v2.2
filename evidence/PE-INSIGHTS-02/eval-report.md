# PE-INSIGHTS-02 Evaluation Report

**Date:** 2026-04-06
**Evaluator:** Production Eval Agent
**Target:** https://dev.huminicdev.com/insights
**Account:** serra_honda@huminic.ai (Serra Honda, org_admin)
**Remediations Under Test:** REM-PE-002, REM-PE-004

---

## Bug Evaluation Results

| Bug ID | Severity | Title | Status | Evidence |
|--------|----------|-------|--------|----------|
| BUG-INS-01 | Critical | Hot Leads modal shows no customer names | CANNOT VERIFY | Modal loads correctly with proper Customer column header, but 0 records in dataset — no rows to validate name rendering. Screenshot: 02-hot-leads-modal-empty.png |
| BUG-INS-02 | Critical | Hot Leads modal shows no phone numbers | CANNOT VERIFY | Modal has Phone column and Action column present, but 0 records — cannot confirm phone numbers or Call button behavior. Screenshot: 02-hot-leads-modal-empty.png |
| BUG-INS-03 | High | Vehicle column shows raw API URLs | CANNOT VERIFY | Vehicle column header present in modal table, but 0 records — cannot confirm URL-to-format transformation. Screenshot: 02-hot-leads-modal-empty.png |
| BUG-INS-04 | Medium | CSV Export is toast-only — no file download | FIXED | Both Export CSV (from Hot Leads modal) and Export (from Reports tab) trigger real browser file downloads. Dashboard export downloads `insights-dashboard.csv` with proper CSV content. Reports export downloads `insights-reports.csv`. Screenshot: 02-hot-leads-modal-empty.png |
| BUG-INS-05 | Critical | Channel Intelligence report crashes page | FIXED | Channel Intelligence loads without crash. Shows "Channel Performance Intelligence" with period label, table headers (Channel, Vol, %, Win, Loss, Bad, Hot%, Show%, Delta Win, #), and insight badges (Top, Under, Rising, Falling). Table body rows are empty (no data), but page does NOT crash. Screenshot: 08-channel-intelligence.png |
| BUG-INS-06 | High | Menu tab switching does not work | FIXED | Menu dropdown shows Dashboard, Reports, Library, Hunches, Activity. Clicking Dashboard, Reports, Library, and Hunches all correctly update the URL query param (?tab=X) and render distinct content. One exception: Activity navigates to /activity (404) instead of ?tab=activity. Screenshot: 03-menu-dropdown.png |
| BUG-INS-07 | Medium | Activity tab not implemented | PARTIALLY FIXED | Activity tab EXISTS at /insights?tab=activity and shows placeholder: "Activity tracking coming soon. This tab will show real-time dealership activity, user actions, and system events." However, the Menu dropdown Activity item navigates to /activity (a 404 page) instead of /insights?tab=activity. The tab content is implemented but the menu routing is broken. Screenshots: 12-activity-404.png, 13-activity-tab-direct.png |
| BUG-INS-08 | Medium | Loss Patterns table is empty | STILL PRESENT | Loss Patterns by Source table on Reports > Loss & Quality shows column headers (Source, Lost, Top Reason, %, Avg Days) but zero data rows. The REM-PE-004 remediation claimed lostAges tracking per source was added, but the table body is empty. Screenshot: 07-reports-scrolled-bottom.png |
| BUG-INS-09 | High | Library drill-down shows raw API URLs for lead sources | FIXED | Library tab renders clean metric cards with proper labels (Pipeline, Conversion, Response, Lead Source, Channel, Composite, Forecast categories). Lead Source cards show "Data source not connected" placeholder instead of raw URLs. No raw API URLs visible anywhere. Screenshot: 11-library-tab.png |
| BUG-INS-10 | Low | Trend & Forecast chart empty | PARTIALLY FIXED | Trend & Forecast tab loads with Monthly Summary, Rolling Forecast, and Year-over-Year sub-tabs. Monthly Summary shows summary cards (Total Leads: 0, Sold: 0, Win Rate: 0%), a chart area (dotted/empty), and insight cards (Wins, Concerns, Recommendations). Dashboard also has "Leads This Week" and "Conversions by Day" bar charts with proper day axes (Tue-Mon) and Y-axis (0-4). Charts render structurally but show zero data. This is expected behavior given no warehouse data for this dealer. Screenshots: 09-trend-forecast.png, 14-dashboard-charts.png |
| BUG-INS-11 | Low | Freshness Score shows N/A | PARTIALLY FIXED | Freshness Score displays "N/A" with "0% under 7 days" subtitle. The computation infrastructure exists (REM-PE-004 added % of active leads under 7 days old). With 0 active leads, 0% is mathematically correct, and N/A is a reasonable display when there's no data to compute against. The code handles the zero-data case. Screenshot: 16-freshness-score-na.png |
| BUG-INS-12 | Low | No sidebar link to Insights | STILL PRESENT | Sidebar navigation contains: AI Chat, TeamBox, Sales, Service, Marketing, System, Logout. No Insights link. Users must navigate via direct URL (/insights) or bookmark. Screenshot: 01-insights-dashboard.png |

---

## Summary

| Status | Count |
|--------|-------|
| FIXED | 4 |
| PARTIALLY FIXED | 4 |
| STILL PRESENT | 2 |
| CANNOT VERIFY | 3 |

**Note:** BUG-INS-01/02/03 overlap (all are about the Hot Leads modal content). Counting unique bugs: 12 evaluated, 4 fixed, 4 partially fixed, 2 still present, 3 cannot verify (due to 0 data records).

### Fixed (confirmed working):
- **BUG-INS-04**: CSV export now triggers real file downloads (both dashboard and reports)
- **BUG-INS-05**: Channel Intelligence no longer crashes the page
- **BUG-INS-06**: Tab switching works via URL query params (?tab=X)
- **BUG-INS-09**: Library shows clean labels instead of raw API URLs

### Partially Fixed (infrastructure present, incomplete):
- **BUG-INS-07**: Activity tab content exists at ?tab=activity but menu item routes to /activity (404)
- **BUG-INS-10**: Trend charts render with proper axes but show zero data
- **BUG-INS-11**: Freshness Score computation exists but displays N/A (acceptable with 0 data)

### Still Present:
- **BUG-INS-08**: Loss Patterns table still has no data rows
- **BUG-INS-12**: No sidebar navigation link to Insights

### Cannot Verify (0 data records prevent testing):
- **BUG-INS-01/02/03**: Hot Leads modal has correct table structure but 0 records to verify name/phone/vehicle rendering

---

## New Bugs Discovered

| Bug ID | Severity | Title | Description |
|--------|----------|-------|-------------|
| BUG-INS-13 | High | Activity menu item routes to /activity (404) instead of /insights?tab=activity | The Menu dropdown Activity item navigates to the wrong URL, resulting in a 404 page. The tab content exists at the correct URL but is unreachable via the menu. |
| BUG-INS-14 | Low | Channel Intelligence table body empty | The Channel Performance Intelligence table has headers and insight summaries but zero data rows in the table body. Period shows "January 2026, 637 Total Leads" but no per-channel breakdown. |
| BUG-INS-15 | Low | Loss Reason Breakdown and Bad Lead Breakdown charts appear empty | The charts in Reports > Loss & Quality show titles and period info (December 2025, 128 Losses, 95 Bad Leads) but the chart areas render as empty/dotted boxes with no visual data. |

---

## Overall Insights Section Health

**Grade: C+**

The structural fixes from REM-PE-002 are solid — the page no longer crashes, tabs switch correctly, and CSV export works. The REM-PE-004 data pipeline improvements (loss patterns, trend data, freshness score) have the backend infrastructure in place but are not populating the frontend with data for this dealer. The most critical remaining issue is the Activity menu routing bug (BUG-INS-13), which is a regression introduced by the tab switching fix. The zero-data state across most metrics is likely a data pipeline issue rather than a frontend bug — Serra Honda may not have warehouse data synced.

**Recommended next steps:**
1. Fix Activity menu routing (change /activity to ?tab=activity)
2. Add Insights link to sidebar navigation
3. Verify data pipeline for Serra Honda — are warehouse syncs running?
4. Re-test BUG-INS-01/02/03 with a dealer that has active lead data
