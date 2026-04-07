# PE-SALES-02: Sales Dashboard Re-Evaluation Report

**Date:** 2026-04-06
**Evaluator:** Production Eval Agent
**Store:** Serra Honda (serra_honda@huminic.ai)
**URL:** https://dev.huminicdev.com/sales

## API Response Summary

### /api/vin/leads/summary
```json
{
  "totalLeads": 0, "totalLeadsChange": 0,
  "newLeads": 0, "newLeadsChange": 0,
  "activeLeads": 0, "activeLeadsChange": 0,
  "soldLeads": 0, "soldLeadsChange": 0,
  "appointments": 0, "conversionRate": 0,
  "source": "warehouse", "syncedAt": null
}
```

### /api/metrics/dashboard (pipeline)
```json
{
  "activePipeline": 0,
  "appointmentsToday": 0,
  "openEscalations": 249,
  "outboundSent24h": 0
}
```

**Critical finding:** `syncedAt: null` -- the warehouse has never successfully synced for Serra Honda. All zero values are a consequence of this, not application bugs.

---

## Bug Re-Evaluation Table

| Bug ID | Severity | Title | Status | Evidence |
|--------|----------|-------|--------|----------|
| BUG-01 | Medium | Vehicle column shows raw API URLs in Active Pipeline drill-down | CANNOT VERIFY | Active Pipeline shows 0 records due to empty warehouse. Drill-down opens correctly and shows "No records found." Code review of `resolveLeadData()` confirms VIN enrichment logic exists (REM-PE-001 committed). Needs data to verify rendering. |
| BUG-02 | Medium | 11/16 Active Pipeline records have no customer name | CANNOT VERIFY | Same root cause -- 0 warehouse records for Serra Honda. Code review shows name resolution from VIN API is implemented. Needs populated warehouse to verify. |
| BUG-03 | High | Appointments Set drill-down shows 0 records despite tile showing 22 | FIXED (structurally) | Tile now shows 0, drill-down also shows 0 -- counts are consistent. Code fix confirmed: `appts.filter(a => a.status === 'scheduled')` applied (line 517 of vendorProxy.ts). The previous mismatch between tile count and drill-down is resolved at the code level. Screenshot: 09-appointments-set-drilldown.png |
| BUG-04 | High | 7 of 11 agents show "Unauthorized Agent" / "Should fail" | FIXED | Top Performing Agents now shows only 4 legitimate active agents: Caroline (voice), Data Guru (chat), Sales Coach (chat), Communication Writer (chat). Filter `salesAgents.filter(a => a.status === 'active')` excludes test/unauthorized entries. DATA-CLEANUP-01/02 removed test data. Screenshot: 05-sales-dashboard-full-tall.png |
| BUG-05 | Low-Medium | All "vs last 30d" change values show 0% | CANNOT VERIFY (code FIXED) | All tiles show 0% because both current and previous 30-day periods have 0 leads (`syncedAt: null`). Backend code correctly implements `pctChange()` with previous-period query (lines 497-539 of vendorProxy.ts). Frontend correctly maps `*Change` fields. The 0% is mathematically correct for 0/0. Needs populated warehouse to verify non-zero deltas. |
| BUG-06 | Low-Medium | No VAPI/voice lead count on Sales Dashboard | STILL PRESENT | No VAPI metric tile exists in sales.tsx. This was not in the remediation scope (not listed in REM-PE-001 through REM-PE-006). |
| BUG-07 | Medium | Stale warehouse sync (5-16 days across stores) | STILL PRESENT / WORSE | `syncedAt: null` for Serra Honda means the warehouse has NEVER synced. Recent Activity shows 4x "Sync Backfill Failed" from ~2 hours ago, confirming active sync failures. The "Warehouse" badge displays but shows no freshness indicator. |
| BUG-08 | Low | Only 2 of 7 tiles have record-level drill-downs | FIXED | All 7 tiles now open drill-down dialogs when clicked. Total Leads, New Leads, Active Pipeline, and Appointments Set use record-level detail API (`/api/metrics/pipeline/details`). Waiting on Response, Sold, and Conversion Rate show summary breakdown dialogs. `salesMetricApiKeys` now includes `total_leads` and `new_leads` (REM-PE-006). Screenshots: 07-total-leads-drilldown.png, 08-new-leads-drilldown.png |

---

## Summary

### Code Fixes Verified (structurally correct)
- **REM-PE-001** (VIN enrichment): `resolveLeadData()` exists in code -- cannot verify rendering without data
- **REM-PE-004** (Trend calculations): `pctChange()` and previous-period query implemented correctly
- **REM-PE-004** (Appointments filter): `status === 'scheduled'` filter applied
- **REM-PE-006** (Drill-down support): `total_leads` and `new_leads` added to `salesMetricApiKeys`
- **DATA-CLEANUP-01/02**: Test agents ("Unauthorized Agent", "Should fail") no longer appear

### Blocking Issue
**The warehouse has never synced for Serra Honda** (`syncedAt: null`). This makes it impossible to fully verify BUG-01, BUG-02, and BUG-05 at the rendering level. The code changes are structurally present and correct, but the dashboard shows all zeros because there is no data to display.

The "Sync Backfill Failed" entries in Recent Activity (4x, ~2 hours ago) indicate the sync process is actively failing.

### Still Present
- **BUG-06**: No VAPI metric tile (not in remediation scope)
- **BUG-07**: Warehouse sync failure (infrastructure issue, not code bug)

### New Issues Observed
1. **NEW-01 (Medium)**: "Sync Backfill Failed" appears 4 times in Recent Activity for Serra Honda. Warehouse sync is broken, causing the entire Sales Dashboard to be empty.
2. **NEW-02 (Low)**: The submenu panel (agents sidebar) can overlay metric tiles and block click interactions. Required hiding the panel to interact with tiles during testing.
3. **NEW-03 (Info)**: Open Escalations count is 249 -- unusually high. May need investigation to determine if these are legitimate or stale escalations.

---

## Overall Sales Section Health: DEGRADED

The code fixes from REM-PE-001, REM-PE-004, and REM-PE-006 are structurally in place and correct. However, the Sales Dashboard is **functionally empty** for Serra Honda because the warehouse sync has never completed. Until the sync infrastructure is repaired, the dashboard cannot display any meaningful sales data.

**Recommendation:** Fix warehouse sync for Serra Honda as a priority, then re-run this evaluation to verify BUG-01, BUG-02, and BUG-05 rendering with actual data.

---

## Screenshots
- `01-sales-dashboard-overview.png` -- Initial view with tour overlay
- `02-sales-dashboard-clean.png` -- Clean view showing top tiles (all 0)
- `05-sales-dashboard-full-tall.png` -- Full dashboard view with agents and activity
- `06-active-pipeline-drilldown-empty.png` -- Active Pipeline drill-down (0 records)
- `07-total-leads-drilldown.png` -- Total Leads drill-down (REM-PE-006 fix verified)
- `08-new-leads-drilldown.png` -- New Leads drill-down (REM-PE-006 fix verified)
- `09-appointments-set-drilldown.png` -- Appointments Set drill-down (BUG-03 consistency fix)
