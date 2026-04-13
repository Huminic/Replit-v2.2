# TeamBox Phone Tab Re-Verification

**Date:** 2026-04-07
**Verifier:** Independent agent (no knowledge of implementation)
**Login:** serra_honda@huminic.ai / NexxusTest2026
**URL:** https://dev.huminicdev.com/teambox

---

## Pre-Test Observation

On first navigation to /teambox, the page crashed with error **"panelHovered is not defined"** and displayed the error boundary ("Something went wrong"). Clicking the Phone tab on the crashed page redirected to /insights and crashed again with the same error. The crash also destroyed the session (redirected to /login).

After re-login and second navigation to /teambox, the Conversations tab loaded successfully and the Phone tab was clickable.

---

## Test Results

### 1. Navigate to /teambox
- **Result:** PASS (on second attempt; first attempt crashed — see Pre-Test Observation)
- **Observed:** TeamBox page loaded with heading "TeamBox" and three tabs: Conversations, Phone, Video

### 2. Click the Phone tab
- **Result:** PASS
- **Observed:** Phone tab activated (shown as `[active]`), URL stayed at /teambox, content changed to "VAPI Call Logs" table

### 3. Are VAPI call entries visible?
- **Result:** PASS
- **Observed:** Table heading "VAPI Call Logs" displayed. 13 rows of call data visible in the table. Each row has a caller phone number (e.g., +14808964875, +14808039635, +14805072490, etc.)

### 4. Do entries show human-readable assistant names (not UUIDs)?
- **Result:** PASS
- **Observed:** All 13 rows show **"Caroline"** in the Assistant column. No UUIDs visible anywhere in the table.

### 5. Is there a "Summary" column in the table?
- **Result:** PASS
- **Observed:** Table headers are: Date | Caller Number | Assistant | Duration | Status | Summary — "Summary" column exists as the 6th column

### 6. Do dates show actual values or "-"?
- **Result:** FAIL
- **Observed:** ALL 13 rows show **"-"** in the Date column. No actual date values are displayed for any entry.

### 7. Do durations show values, "Failed", or "-"?
- **Result:** PARTIAL PASS
- **Observed:** All 13 rows show **"Failed"** in the Duration column. No rows show actual duration values (e.g., "2m 15s") or "-". While "Failed" is listed as an acceptable value, the fact that 100% of entries are "Failed" with no variety suggests possible data or display issues.

---

## Additional Observations

| Column | Values Observed (all 13 rows identical pattern) |
|--------|------------------------------------------------|
| Date | "-" (dash) |
| Caller Number | Valid phone numbers (unique per row, +1480 area code) |
| Assistant | "Caroline" (all rows) |
| Duration | "Failed" (all rows) |
| Status | "ended" (teal badge, all rows) |
| Summary | "-" (dash, all rows) |

- **Summary column** exists but shows "-" for every single entry — no actual call summaries displayed.
- **Status column** shows "ended" as a teal/green badge for all rows, which is inconsistent with Duration showing "Failed".
- The **"panelHovered is not defined"** crash on first load is a significant stability issue that occurs intermittently.

---

## Screenshot Evidence

- `evidence/SNP-001/teambox-phone-tab.png` — Phone tab with VAPI Call Logs table visible

---

## Verdict: FAIL

**Reason:** Test item 6 (Dates) failed outright — all dates show "-" instead of actual values. While the Phone tab renders and shows data in the correct structure with human-readable assistant names and a Summary column, the Date column is non-functional across all entries. The intermittent crash ("panelHovered is not defined") on initial TeamBox load is an additional blocking issue that was observed during testing.
