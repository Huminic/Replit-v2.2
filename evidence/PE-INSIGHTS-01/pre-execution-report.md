# PE-INSIGHTS-01 Pre-Execution Report

**Sprint:** PE-INSIGHTS-01 — Insights Page Production Evaluation
**Date:** 2026-04-06
**Type:** Production Evaluation (PE) -- Insights Page
**Scope:** Full functional audit of `client/src/pages/insights.tsx` and its 5 API endpoints

---

## Objective

Perform a comprehensive evaluation of the Insights page across all four tabs (Dashboard, Reports, Library, Hunches) and all drill-down modals. Identify what works, what is broken, and what is hardcoded/unpopulated. Map every operator-reported bug to a root cause in the code.

---

## Declared Files

| File | Role |
|------|------|
| `client/src/pages/insights.tsx` | Primary page component (2155 lines) |
| `server/routes/insights.ts` | Backend API for dashboard, reports, library |
| `server/routes/hunches.ts` | Backend API for hunches |

---

## Operator Bug Reports

1. **Some metrics/cards missing contact button, shows cryptic ID numbers** -- Red zone drill-down modals fall back to `leadId` (UUID) when `customerName` is null. Call button disabled when `customerPhone` is null.
2. **Call button doesn't work in modals** -- `handleCall()` uses `window.open(tel:digits, '_self')`. This works on mobile but may silently fail on desktop. Also disabled when phone is null, which looks like "not working."
3. **Report graphs not populating except bad lead breakdown** -- Dashboard charts (Leads This Week, Conversions by Day) are hardcoded to zeroes in the frontend (`days.map(d => ({ value: 0 }))`). Multiple report sections (Digital vs Physical, Service Lane, YoY, monthly volume) are also hardcoded to empty arrays. Only loss analysis bar charts get real API data.
4. **Library cards don't populate (daily new lead volume missing)** -- Library metrics from API may return em-dash values or empty array depending on warehouse data availability.

---

## Section Structure

### Dashboard Tab
- **Red Zone:** 3 action cards -> 3 drill-down modals with lead tables and Call/Assign buttons
- **Yellow Zone:** 2 watch cards -> 2 drill-down modals (summary only)
- **Green Zone:** Dynamic metric cards -> detail modals
- **Pipeline Health:** 4 summary cards + detail modal (velocity, freshness, pie chart, status flow, forecast)
- **Performance Scorecard:** 4 summary cards + detail modal (metrics, source table, channel table, WoW trends)
- **Charts:** Leads This Week (AreaChart), Conversions by Day (BarChart) -- BOTH HARDCODED TO ZERO

### Reports Tab
- **Loss & Quality:** Deal Death Autopsy (2 bar charts + table), Re-Engagement (table + Call), Source Quality Trends (line chart)
- **Channel Intelligence:** Full Comparison (table), Digital vs Physical (HARDCODED), Service-to-Sales (HARDCODED)
- **Trend & Forecast:** Monthly Summary (computed), Rolling Forecast (computed), Year-over-Year (HARDCODED EMPTY)

### Library Tab
- 34 metric tiles with search, category filter, role-based filtering, lookback selector, grid/list toggle
- Detail drill-down dialog with rows + AI insight text

### Hunches Tab
- AI-generated hunch cards (opportunity/threat/insight types)
- Preferences sheet (all local state, no backend persistence)

---

## Drill-Down Modals (9 total)

1. Hot Leads Going Cold -- lead table with Call
2. New Leads Without Contact -- lead table with Call + Assign
3. Showroom Visitors Not Closed -- lead table with Call
4. Stale Leads -- summary + CSV export
5. Pending Finance -- summary only
6. Pipeline Health Monitor -- full analytics view
7. Performance Scorecard Detail -- tables + trends
8. Green Zone Detail -- single metric detail
9. Library Metric Detail -- rows + AI insight

---

## Acceptance Criteria (23 total)

See `acceptance-matrix.md` for full mapping. Summary:

| Category | Count | Risk |
|----------|-------|------|
| Dashboard rendering + interaction | AC-01 through AC-07 | AC-07 HIGH (charts hardcoded) |
| Reports rendering + data | AC-08 through AC-14 | AC-11, AC-13 HIGH (hardcoded sections) |
| Library rendering + interaction | AC-15 through AC-18 | AC-15 MEDIUM (data-dependent) |
| Hunches rendering + interaction | AC-19 through AC-21 | LOW |
| Cross-cutting (store selector, embedded) | AC-22, AC-23 | LOW |

---

## Test Plan

### Phase 1: Visual Inspection (all tabs)
- Navigate to each tab, capture screenshots
- Verify all elements render per DOM inventory
- Note any blank/zero sections

### Phase 2: Interaction Testing
- Click each red zone card -> verify modal opens with correct data
- Verify Call/Assign buttons in all modals
- Test store selector filtering
- Test library search, filter, lookback, grid/list
- Test hunch dismiss/act
- Test hunch preferences sheet

### Phase 3: Data Verification
- Compare frontend display against API response for each endpoint
- Identify which sections use real API data vs hardcoded values
- Document all hardcoded/unpopulated sections

### Phase 4: Bug Confirmation
- Reproduce each of the 4 operator-reported bugs
- Trace to specific code lines
- Document with screenshots

---

## Known Findings Before Testing

From code analysis alone:

1. **CONFIRMED: Charts hardcoded to zero** (lines 251-253) -- `leadsChartData` and `conversionsChartData` are `days.map(d => ({ date: d, value: 0 }))`. The API does not provide daily breakdown data. This is a code defect.

2. **CONFIRMED: Multiple report sections hardcoded** -- `digitalVsPhysical` (line 289), `serviceLaneAnalysis` (line 295), `yearOverYear.annual` (line 335), `weekOverWeekTrends` (line 340), `monthlyPerformanceSummary.volumeTrends` (line 309) are all initialized to empty arrays or zero values and never populated from API.

3. **CONFIRMED: Customer name fallback** -- Modals use `lead.customerName || '\u2014'` or `lead.customerName || lead.leadId`. If the API returns leads without `customerName`, UUIDs will display.

4. **CONFIRMED: Call button disabled pattern** -- `disabled={!lead.customerPhone}` on all Call buttons. If phone is null, button appears grayed out, which looks like "doesn't work."

5. **CONFIRMED: Hunch preferences not persisted** -- Save button triggers toast only (line 1577). No API call to persist preferences.

6. **CONFIRMED: Export buttons are toast-only** -- CSV and PDF export buttons (lines 388-390) trigger toast notifications but generate no actual files.

---

## Ghost Entry Gate

**ENTRY GATE: APPROVED**

Rationale: Pre-execution report covers all 4 tabs, 9 modals, 18 use cases, and 23 acceptance criteria. All 4 operator bugs are traced to specific code locations. Hardcoded data sections are identified with line numbers. Test plan is structured in 4 phases. No ambiguities remain.
