# Acceptance Matrix: PE-INSIGHTS-01

**Date:** 2026-04-06

This matrix maps acceptance criteria to use cases and identifies the operator-reported bugs.

---

## Operator Bug Reports (from evaluation session)

| Bug ID | Description | Root Cause (from code analysis) | Use Cases |
|--------|-------------|--------------------------------|-----------|
| BUG-01 | Some metrics/cards missing contact button, shows cryptic ID numbers | `customerName` is null for some leads; fallback is `leadId` (UUID). Call button disabled when `customerPhone` is null. | UC-02, UC-08 |
| BUG-02 | Call button doesn't work in modals | `handleCall()` uses `window.open(tel:digits, '_self')` — works on mobile but may not trigger on desktop without a phone app handler. Also disabled when phone is null. | UC-02, UC-08 |
| BUG-03 | Report graphs not populating except bad lead breakdown | Dashboard charts (Leads This Week, Conversions by Day) hardcoded to zeroes. Digital vs Physical, Service Lane, YoY, monthly volume all hardcoded empty. Only loss analysis charts get real API data. | UC-07, UC-09, UC-10 |
| BUG-04 | Library cards don't populate (daily new lead volume missing) | Library metrics from API may return em-dash values or empty array depending on data availability. If warehouse has no daily granularity, metrics show "Data source not connected." | UC-12 |

---

## Acceptance Criteria

| AC-ID | Criterion | Use Cases | Test Approach | Status |
|-------|-----------|-----------|---------------|--------|
| AC-01 | Dashboard tab loads and shows Red Zone cards with counts from API | UC-01 | Navigate to Insights > Dashboard. Verify 3 red zone cards render with numeric counts. | To verify |
| AC-02 | Red Zone drill-down modals show customer names (not UUIDs) and working phone links | UC-02 | Click each red zone card. Verify customer column shows names where available, and phone column is clickable. | To verify (BUG-01, BUG-02) |
| AC-03 | Yellow Zone cards show Stale Leads and Pending Finance with counts | UC-03 | Verify 2 yellow zone cards render. Click Stale Leads — verify drill-down. CSV export button triggers toast. | To verify |
| AC-04 | Green Zone metrics render dynamically from API | UC-04 | Verify green metric cards appear. Click one — verify detail dialog opens. | To verify |
| AC-05 | Pipeline Health summary cards populate + detail modal renders all sections | UC-05 | Check 4 pipeline cards. Click "View Details" — verify velocity, freshness bar, pie chart, status flow, forecast sections all render. | To verify |
| AC-06 | Performance Scorecard cards + detail modal with tables | UC-06 | Check 4 scorecard cards. Click "View Details" — verify lead sources table, channel table, WoW trends render. | To verify |
| AC-07 | Dashboard charts (Leads This Week, Conversions by Day) populate with data | UC-07 | Verify charts show non-zero data. | To verify (BUG-03 — likely FAIL, hardcoded to zero) |
| AC-08 | Loss & Quality reports: all 3 sub-tabs render with data | UC-08 | Navigate to Reports > Loss & Quality. Check Deal Death Autopsy, Re-Engagement, Source Quality. | To verify |
| AC-09 | Re-engagement table shows customer names and Call buttons function | UC-08 | In Re-Engagement sub-tab, verify names shown, Call button initiates tel: action. | To verify (BUG-01, BUG-02) |
| AC-10 | Channel Intelligence reports: Full Comparison table populates | UC-09 | Navigate to Reports > Channel Intelligence > Full Comparison. Verify table rows appear. | To verify |
| AC-11 | Digital vs Physical and Service-to-Sales sub-tabs show data | UC-09 | Check Digital vs Physical and Service-to-Sales tabs. | To verify (BUG-03 — likely FAIL, hardcoded) |
| AC-12 | Trend & Forecast reports: Monthly Summary populates | UC-10 | Navigate to Reports > Trend & Forecast > Monthly Summary. Verify metrics and executive summary. | To verify |
| AC-13 | Rolling Forecast and Year-over-Year sub-tabs show data | UC-10 | Check Rolling Forecast and YoY tabs. | To verify (BUG-03 — likely partial data) |
| AC-14 | Report PDF export button functions | UC-11 | Click export button. Verify toast appears. | To verify |
| AC-15 | Library tab loads 34 metric tiles with real values | UC-12 | Navigate to Library. Verify metric cards render. Check for em-dash placeholders. | To verify (BUG-04) |
| AC-16 | Library search, category filter, lookback selector, and grid/list toggle work | UC-12 | Use each filter control. Verify metric list updates. | To verify |
| AC-17 | Library metric detail drill-down shows rows and AI insight | UC-13 | Click a library metric. Verify detail dialog opens with drill-down data. | To verify |
| AC-18 | Library role-based filtering restricts categories for non-admin roles | UC-14 | Log in as sales user. Verify only Pipeline/Conversion/Response/Lead Source/Forecast categories visible. | To verify |
| AC-19 | Hunches tab shows AI-generated hunch cards | UC-15 | Navigate to Hunches. Verify cards render with type badges and confidence scores. | To verify |
| AC-20 | Hunch Dismiss and Act buttons trigger appropriate responses | UC-15 | Click Dismiss and Act on hunches. Verify toast messages. | To verify |
| AC-21 | Hunch Preferences sheet opens and all controls function | UC-16 | Click preferences icon. Toggle switches, adjust slider, change dropdown, save. | To verify |
| AC-22 | Store selector filters data for multi-store users | UC-17 | Log in as super_admin. Change store. Verify API queries include orgId param. | To verify |
| AC-23 | Embedded mode hides page header and mobile nav | UC-18 | Access Insights via Sales/Service/Management tab. Verify header hidden, tabs visible. | To verify |

---

## Risk Assessment

| Risk Level | Items | Notes |
|------------|-------|-------|
| HIGH (known broken) | AC-07, AC-11, AC-13 | Charts/sections hardcoded to zero/empty. This is a code defect, not a data issue. |
| MEDIUM (data-dependent) | AC-02, AC-09, AC-15 | Depend on API returning `customerName`/`customerPhone` and library metrics with real values. |
| LOW | All other ACs | Standard rendering and interaction verification. |
