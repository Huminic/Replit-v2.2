# SNP-001: Verification of Existing Fixes

**Date:** 2026-04-07
**Verified by:** Verification Agent (Playwright MCP)
**Login:** serra_honda@huminic.ai (org_admin, Serra Honda)
**App URL:** https://dev.huminicdev.com

---

## Check 1: Activity menu link (BUG-INS-13)

**Result: PASS**

- Navigated to `/insights?tab=activity` -- page loads correctly, shows "Insights" heading with "Activity" tab panel active.
- Navigated to `/activity` -- correctly returns 404 ("Page Not Found").
- Code verified: `MobileSidebar.tsx` line 26 has `path: '/insights?tab=activity'` (not `/activity`).
- Code verified: `MobileNavDropdown.tsx` line 52 has `path: '/insights?tab=activity'`.

**Evidence:** URL stays at `/insights?tab=activity`, tabpanel labeled "Activity" is visible with placeholder content "Activity tracking coming soon."

---

## Check 2: Campaign recipients (BUG-SC-07)

**Result: PASS**

- Navigated to `/service`. Campaign table visible with 2 campaigns.
- Clicked "Service Reminder - February" campaign row.
- Detail modal opened showing: Status (active), Channel (SMS), Recipients (16), Sent (0), Replied (0).
- Recipients table visible with columns: Name, Phone, Status.
- 16 recipients displayed: John Doe, Jane Smith, Michael Davis, Karen Wilson, James Rodriguez, Nancy Taylor, Thomas Moore, Patricia Williams, Robert Chen, Linda Martinez, David Johnson, Susan Brown (and duplicates from CSV).
- No 401 error. No empty state.

**Evidence:** Dialog titled "Service Reminder - February" with full recipients table rendered. All 16 rows visible with names, phone numbers, and "pending" status.

---

## Check 3: VAPI assistant names (BUG-INT-12)

**Result: FAIL**

- Navigated to TeamBox > Phone tab.
- VAPI Call Logs table displays 13 calls.
- Assistant column shows raw UUID `90a876c0-0f11-4424-abfe-9ac82b264d88` for ALL entries.
- **Backend fix IS working:** API response includes `assistantName: "Caroline"` in the JSON payload.
- **Frontend bug:** `teambox.tsx` line 403 reads `call.assistant?.name` (nested object property) but the API returns `call.assistantName` (flat string field). The frontend never accesses the correct field.

**Root cause:** Field name mismatch between API response shape and frontend rendering code.
- API returns: `{ assistantName: "Caroline", assistantId: "90a876c0-..." }`
- Frontend reads: `call.assistant?.name` (expects `{ assistant: { name: "..." } }`)
- Fix needed in `client/src/pages/teambox.tsx` line 403: change `call.assistant?.name` to `call.assistantName`

---

## Check 4: VAPI cross-org filter (BUG-INT-15)

**Result: PASS (backend filtering confirmed)**

- While logged in as Serra Honda, the `/api/vapi/calls` endpoint returns 13 calls.
- All 13 calls use a single assistantId: `90a876c0-0f11-4424-abfe-9ac82b264d88` (Caroline, Serra Honda's assistant).
- No calls from other orgs' assistants are present.
- Server code verified (`vendorProxy.ts` lines 267-286): Calls are filtered by org's VAPI assistant IDs fetched from the agents table. Only calls matching the logged-in user's org assistants are returned.

**Evidence:** API response contains exactly 13 calls, all with the same Serra Honda assistantId. Backend filter logic confirmed in code.

---

## Check 5: Campaign polling (BUG-SC-08)

**Result: PASS**

- On Service page (`/service`), monitored network requests for 35 seconds.
- Observed 2 requests to `/api/campaigns/execution-statuses`.
- Interval between requests: **15.273 seconds**.
- This confirms the fix from the original 3-second polling to ~15-second polling.

**Evidence:** Network monitoring captured 2 requests over 35 seconds with 15.27s interval.

---

## Summary

| # | Bug ID | Check | Result |
|---|--------|-------|--------|
| 1 | BUG-INS-13 | Activity menu link routes to /insights?tab=activity | PASS |
| 2 | BUG-SC-07 | Campaign recipients table visible in modal | PASS |
| 3 | BUG-INT-12 | VAPI assistant human-readable names in Phone tab | FAIL |
| 4 | BUG-INT-15 | VAPI cross-org filter (Serra Honda only) | PASS |
| 5 | BUG-SC-08 | Campaign polling at ~15s (not 3s) | PASS |

**4 of 5 checks PASS. 1 FAIL (BUG-INT-12).**

The BUG-INT-12 failure is a frontend-only fix needed: `teambox.tsx` line 403 should read `call.assistantName` instead of `call.assistant?.name`. The backend correctly provides the human-readable name.
