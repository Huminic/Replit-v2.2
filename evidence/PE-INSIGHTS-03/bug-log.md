# PE-INSIGHTS-03 Bug Log

**Date:** 2026-04-07

## New Bugs Found

| Bug ID | Severity | Title | False-Pass Risk | Fix Category |
|--------|----------|-------|-----------------|--------------|
| BUG-INS-16 | Low | Drill-down modal title mismatch: "Hot Leads Going Cold" card opens "Stale Leads" modal | No | Code fix (title mapping) |
| BUG-INS-17 | Low | VIN Source IDs shown as numeric codes in Loss Patterns table | No | Data/display fix |
| BUG-INS-18 | Low | No date range picker on main Dashboard tab | No | Feature gap (backlog) |

### BUG-INS-16: Modal Title Mismatch
- **Trigger:** Click "Hot Leads Going Cold" (14-21 days) alert card on Dashboard
- **Expected:** Modal title should reference "Hot Leads" or "Leads aging 14-21 days"
- **Actual:** Modal opens with title "Stale Leads" and description "Leads approaching 28-35 days without resolution"
- **Impact:** User confusion — the modal describes a different age range than the card they clicked
- **Classification:** UI bug, not false-pass. The modal opens and functions correctly.
- **Fix complexity:** Low — update modal title/description mapping based on trigger card

### BUG-INS-17: VIN Source IDs Instead of Names
- **Location:** Reports > Loss & Quality > Loss Patterns by Source table
- **Expected:** Human-readable lead source names
- **Actual:** "VIN Source #3750035", "VIN Source #3743779", etc.
- **Impact:** Manager cannot identify which lead source is underperforming without looking up the numeric ID
- **Classification:** Data display issue. Data is real but not user-friendly.
- **Fix complexity:** Medium — requires mapping VIN Solutions lead source IDs to names (data may be in warehouse sync)

### BUG-INS-18: No Dashboard Date Range Picker
- **Location:** Dashboard tab
- **Expected:** Date range selector or period filter
- **Actual:** Dashboard shows live/current metrics only. Library tab has "Last 30 days" selector, but Dashboard has none.
- **Impact:** Manager cannot compare metrics across different time periods from the Dashboard
- **Classification:** Feature gap, not a bug. Dashboard is designed for current state.
- **Fix complexity:** Low — add date range selector similar to Library tab

## Previously Reported Bugs — Status Update

| Bug ID | PE-02 Status | PE-03 Status | Evidence |
|--------|-------------|-------------|----------|
| BUG-INS-01 | CANNOT VERIFY | CANNOT VERIFY | Modal still has 0 records — data issue, not code bug |
| BUG-INS-02 | CANNOT VERIFY | CANNOT VERIFY | Same as above |
| BUG-INS-03 | CANNOT VERIFY | CANNOT VERIFY | Same as above |
| BUG-INS-04 | FIXED | CONFIRMED FIXED | CSV export buttons present in modals and Reports |
| BUG-INS-05 | FIXED | CONFIRMED FIXED | Channel Intelligence loads without crash |
| BUG-INS-06 | FIXED | CONFIRMED FIXED | All 5 tabs switch correctly |
| BUG-INS-07 | PARTIALLY FIXED | FIXED | Activity tab loads within /insights page, no more /activity 404 |
| BUG-INS-08 | STILL PRESENT | FIXED | Loss Patterns table now has 7 data rows |
| BUG-INS-09 | FIXED | CONFIRMED FIXED | Library shows clean labels |
| BUG-INS-10 | PARTIALLY FIXED | IMPROVED | Charts render with data (Leads This Week, Conversions by Day show real values) |
| BUG-INS-11 | PARTIALLY FIXED | IMPROVED | Freshness Score shows "Stale" with "31% under 7 days" (computed value, not N/A) |
| BUG-INS-12 | STILL PRESENT | FIXED | Sidebar now has Insights link |
| BUG-INS-13 | NEW (PE-02) | FIXED | Activity tab no longer routes to /activity (404) |
| BUG-INS-14 | NEW (PE-02) | CANNOT VERIFY | Channel Intelligence content not tested in detail this round |
| BUG-INS-15 | NEW (PE-02) | IMPROVED | Charts now render with data points |

## Summary

| Category | Count |
|----------|-------|
| New bugs found | 3 (all Low severity) |
| Previously fixed bugs confirmed | 7 |
| Previously broken bugs now fixed | 4 (BUG-INS-07, 08, 12, 13) |
| Still cannot verify | 3 (BUG-INS-01/02/03 — zero data, not code) |
| Improved | 3 (BUG-INS-10, 11, 15) |
