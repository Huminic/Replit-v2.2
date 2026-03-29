# Dev Verification Report -- VFY-02

**Sprint:** VFY-02
**Date:** 2026-03-28T07:43Z
**Route:** /sales
**Tester:** Dev (automated via Playwright MCP)
**Login:** serra_honda@huminic.ai @ https://dev.huminicdev.com

## State Verification

| State | Description | Verdict | Screenshot | Notes |
|-------|------------|---------|------------|-------|
| ST-119 | Sales dashboard tiles visible (7 tiles) | WORKING | ST-120-sales-tiles-wide.png | All 7 tiles rendered: Total Leads (557), New Leads (9), Active Pipeline (99), Waiting on Response (75), Appointments Set (0), Sold (19), Conversion Rate (3.4%). Each tile shows value, % change, and "vs last 30d" label. |
| ST-120 | Tile data populated with real values | WORKING | ST-120-sales-tiles-wide.png | All tiles show warehouse-synced data. Warehouse badge reads "Synced 7h ago". All % change values show 0%. |
| ST-121 | All tiles clickable (cursor=pointer) | WORKING | -- | Every tile has cursor=pointer and opens a dialog on click. |
| ST-122 | Active Pipeline drill-down dialog | WORKING | ST-122-active-pipeline-drilldown.png | Opens dialog with data table (99 records). Columns: Name, Status, Vehicle, Lead ID, Show Contact. Shows real lead names and statuses (ACTIVE_NEW_LEAD, ACTIVE_WAITING_FOR_PROSPECT_RESPONSE). |
| ST-123 | Appointments Set drill-down dialog | WORKING | ST-123-appointments-set-drilldown.png | Opens dialog correctly. Shows "0 records" and "No records found" empty state. |
| ST-124 | Other tiles drill-down dialogs | WORKING | ST-124-total-leads-drilldown.png, ST-124-conversion-rate-drilldown.png | Total Leads, New Leads, Waiting on Response, Sold, Conversion Rate all open a **simple value display** dialog (not a data table). Shows: Current Value, Change %, Period, and "Data sourced from warehouse sync." note. |
| ST-125 | Loading states | NOT OBSERVED | -- | No loading spinners observed; data loaded instantly on each dialog open. Warehouse data was pre-cached. |
| ST-126 | Error states | NOT OBSERVED | -- | No errors displayed in any dialog. Console shows pre-existing 401 on /auth/refresh (expected for session init) and a 404 on a conversation messages endpoint (unrelated to sales). |
| ST-127 | Empty states | WORKING | ST-123-appointments-set-drilldown.png | Appointments Set (0 records) shows clean "No records found" empty state message. |
| ST-128 | Contact detail from drill-down | WORKING | ST-128-contact-detail.png | Clicked "Show Contact" for Diana Wain from Active Pipeline table. Contact Details dialog opened with: name, status badge, phone (2565893961), email (dianawain42@hotmail.com), Vehicle of Interest URL. |
| ST-129 | Contact detail action buttons | WORKING | ST-128-contact-detail.png | "Call" and "Text" action buttons present at bottom of Contact Details dialog. "Back to leads" navigation link present at top. |

## Broken States

None identified. All tested states are functional.

## Untestable States

| State | Reason |
|-------|--------|
| ST-125 (Loading) | Data loads too fast to observe loading spinners. Would need network throttling or a slow-data scenario to verify loading indicator rendering. |
| ST-126 (Error) | No API errors occurred during testing. Would need to simulate a backend failure to verify error state rendering in drill-down dialogs. |

## Issues to Log

1. **Two dialog types exist for tiles (design observation, not a bug):**
   - **Data table drill-down** (with records list + Show Contact): Active Pipeline, Appointments Set
   - **Simple value summary** (Current Value / Change / Period): Total Leads, New Leads, Waiting on Response, Sold, Conversion Rate
   - This appears intentional -- pipeline-stage tiles show individual records, while aggregate/calculated tiles show summary stats.

2. **All % change values are 0%:** Every tile shows "0% vs last 30d". This could indicate the comparison period data is identical, the feature is not yet computing deltas, or insufficient historical data. Worth confirming with product whether this is expected.

3. **Submenu panel z-index overlap:** The Sales submenu panel (fixed position, z-40) can overlap metric tiles and intercept click events. Collapsing the panel or using a wider viewport resolves this. Minor UX friction on narrower screens.

4. **Console errors (pre-existing, unrelated to sales):**
   - 401 on `/api/auth/refresh` (session bootstrap, expected)
   - 404 on conversation messages endpoint (AI Chat related, not sales)

## Summary

Sales dashboard and drill-down functionality is fully operational. All 7 metric tiles render with live data, all tiles are clickable and open appropriate dialogs, the Active Pipeline data table shows real lead records with working contact detail navigation, and the empty state for Appointments Set renders cleanly.
