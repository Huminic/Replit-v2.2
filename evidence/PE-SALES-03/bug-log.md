# PE-SALES-03: Bug Log

**Date:** 2026-04-07
**Sprint:** PE-SALES-03
**Page:** Sales (`/sales`)

## Bugs Found

### BUG-01: Total Leads and New Leads drill-down popouts show empty record tables

**Severity:** Medium
**Status:** Open
**Flow:** F3

**Description:**
Clicking the "Total Leads (30d)" tile opens a dialog that shows "452" and "showing first 100 of 452 records" but no record table is rendered below. Similarly, clicking "New Leads" shows "36 records" but no table. The `detailRows` data is fetched (the count text proves rows exist) but `renderRecordTable()` returns `null` for these metric keys.

**Root Cause (code review):**
In `client/src/pages/sales.tsx`, the `renderRecordTable()` function (lines 150-261) only has explicit table renderers for:
- `active_pipeline` (lines 189-228): table with Name, Status, Vehicle, Lead ID, Show Contact
- `appointments_today` (lines 231-258): table with Name, Phone, Email, Type, Time

For `total_leads` and `new_leads`, the function falls through to `return null` at line 260. The data is fetched (the count indicator proves this) but never rendered.

**Expected:**
A generic table should render showing the fetched records for Total Leads and New Leads.

**Evidence:**
- Screenshot: `F3-total-leads-popout.png` - "showing first 100 of 452 records" with empty content area
- Screenshot: `F3-new-leads-popout.png` - "36 records" with empty content area
- Code: `sales.tsx` lines 150-261

**History:**
PE-SALES-02 BUG-08 reported "Only 2 of 7 tiles have record-level drill-downs" and was marked "FIXED" because REM-PE-006 added `total_leads` and `new_leads` to `salesMetricApiKeys` (line 124-125). However, the fix only added the API key mapping -- it did not add the corresponding table renderer in `renderRecordTable()`. The data is now fetched but not displayed.

**Fix suggestion:**
Add a generic/fallback table renderer in `renderRecordTable()` for metric keys that don't have a specific layout. Something like a simple table showing customerName, vinStatus, and sourceId for each row.

---

### RISK-01: Activity feed shows system events rather than sales-specific activity

**Severity:** Low
**Status:** Observation
**Flow:** F4

**Description:**
The "Recent Activity" feed on the Sales Dashboard shows org-wide system events (Login Failed, Sync Backfill Completed/Failed) rather than sales-specific events (new lead received, lead status changed, appointment created). 4 of 10 items are "Login Failed" events which are irrelevant to sales pipeline management.

**Impact:**
Sales managers see noise (login failures, sync operations) instead of actionable pipeline activity. The feed's value as a sales management tool is diminished.

**Suggestion:**
Filter the activity feed to sales-relevant event types, or add a separate "Pipeline Activity" section.

---

### RISK-02: Open Escalations count increasing (249 to 262)

**Severity:** Low
**Status:** Observation
**Flow:** F8

**Description:**
Between PE-SALES-02 (2026-04-06) and PE-SALES-03 (2026-04-07), the Open Escalations count on the Main Dashboard increased from 249 to 262 (+13). This suggests escalations are being created faster than they are being resolved.

**Impact:**
262 open escalations for a single dealership is abnormally high. May indicate a systemic issue with escalation creation logic or stale escalation data.

---

## Previously Reported Bugs - Status Update

| PE-SALES-02 Bug | PE-SALES-03 Status |
|-----------------|-------------------|
| BUG-01 (Vehicle column raw URLs) | CANNOT VERIFY - Active Pipeline popout not tested (browser crash) |
| BUG-02 (No customer names) | CANNOT VERIFY - Active Pipeline popout not tested |
| BUG-03 (Appointments mismatch) | CONSISTENT - Both tile (0) and implied drill-down (0) match |
| BUG-04 (Unauthorized agents) | FIXED - Only 4 legitimate active agents shown |
| BUG-05 (All 0% changes) | FIXED - Non-zero changes now showing: +5%, +100%, +59%, -45% |
| BUG-06 (No VAPI metric tile) | STILL PRESENT - No VAPI-specific metric tile on Sales Dashboard |
| BUG-07 (Stale warehouse sync) | FIXED - Warehouse synced 31m ago (was `null` in PE-SALES-02) |
| BUG-08 (Only 2 drill-downs) | PARTIALLY FIXED - 4 tiles have API keys but 2 of those lack renderers (see BUG-01 above) |
