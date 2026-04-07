# SNP-PE3-CHAT-01 Retest Results

**Date:** 2026-04-07
**Tester:** Automated (Claude agent via MCP Playwright)
**Login:** serra_honda@huminic.ai (Serra Honda, org_admin)
**Build:** Rebuilt and restarted via `npm run build && pm2 restart nexxus-app` before testing.
**App health:** HTTP 200 confirmed at https://dev.huminicdev.com

---

## Test 1: Vehicle of Interest field (BUG-CHAT03-001)

**Result: FAIL**

**Steps performed:**
1. Logged in as serra_honda@huminic.ai
2. Expanded AI Key Metrics tiles on the main dashboard
3. Clicked the "Active Pipeline" tile (showing 107 leads)
4. Drill-down modal opened showing 100 of 107 records in a table

**Expected:** The "Vehicle" column shows either a real vehicle description (e.g., "2024 Honda Civic") or "No data"
**Actual:** The "Vehicle" column displays raw VIN Solutions API URLs, e.g.:
- `https://api.vinsolutions.com/vehicles/interest/id/1989870341-0`
- `https://api.vinsolutions.com/vehicles/interest/id/1993603520-0`
- `https://api.vinsolutions.com/vehicles/interest/id/1996052782-0`

This is NOT a valid vehicle description. The raw API URL is being rendered directly instead of being resolved to a human-readable vehicle name.

**Screenshots:**
- `retest-tiles-expanded.png` -- dashboard tiles showing Active Pipeline: 107
- `retest-active-pipeline-modal.png` -- drill-down modal with raw URLs in Vehicle column

---

## Test 2: Modal Contact Detail Button

**Result: PASS (partial)**

**Steps performed:**
1. In the Active Pipeline drill-down modal, clicked "View Contact" on the first row (WFPipeline Test386992)
2. Contact Details dialog opened successfully

**Expected:** Contact detail view loads with real data (name, phone, email, etc.)
**Actual:** Contact detail loaded with:
- Name: WFPipeline Test386992
- Status: ACTIVE_WAITING_FOR_PROSPECT_RESPONSE
- Phone: 5553869921
- Email: (empty/not shown)
- Vehicle of Interest: shows raw URL `https://api.vinsolutions.com/vehicles/interest/id/1989870341-0` (same bug as Test 1)
- Call and Text action buttons present

The View Contact button works correctly and loads real CRM data. However, the Vehicle of Interest field in the contact detail also displays a raw URL instead of a vehicle description, which is the same underlying bug as Test 1.

**Screenshots:**
- `retest-contact-detail.png` -- contact detail view with name, phone, status, and raw vehicle URL

---

## Test 3: AI Chat pipeline metrics (BUG-CHAT03-002)

**Result: FAIL**

**Steps performed:**
1. Closed the contact detail modal, returned to the main dashboard
2. Noted tile values: Active Pipeline: 107, Appointments Today: 0, Open Escalations: 262, Outbound Sent 24h: 7
3. Typed in AI chat: "How many active pipeline leads do I have right now?"
4. AI responded after ~10 seconds

**Expected:** AI response includes a number matching (or close to) the Active Pipeline tile value of 107
**Actual:** AI response was:
> "The dashboard pipeline metrics aren't populating correctly right now -- the data is showing as unavailable, likely tied to the same sync issue from yesterday (Apr 6 backfill failure) that may be affecting your CRM connection. I'd suggest checking Settings > Integrations to confirm the CRM sync is healthy. You can also try Data Guru mode for a deeper real-time pull on pipeline data."

The AI did NOT return the number 107 or any numeric count. Instead, it claimed the data was unavailable and blamed a sync issue. The dashboard tiles clearly show 107 active pipeline leads (fetched live from CRM), but the AI chat tool/function is apparently not connected to the same data source or is failing to query it.

**Screenshots:**
- `retest-tiles-expanded.png` -- tiles showing Active Pipeline: 107
- `retest-ai-chat-question-and-answer.png` -- user question visible
- `retest-ai-chat-pipeline-answer.png` -- AI response claiming data unavailable

---

## Summary

| Test | Bug ID | Result | Notes |
|------|--------|--------|-------|
| 1. Vehicle of Interest field | BUG-CHAT03-001 | FAIL | Raw API URLs displayed instead of vehicle descriptions |
| 2. Modal Contact Detail Button | -- | PASS (partial) | Button works, detail loads, but vehicle field has same URL bug |
| 3. AI Chat pipeline metrics | BUG-CHAT03-002 | FAIL | AI says data unavailable; tile shows 107 |

**Overall: 2 of 3 tests FAIL. Fixes for BUG-CHAT03-001 and BUG-CHAT03-002 are NOT effective.**

### Root cause observations:

1. **BUG-CHAT03-001 (Vehicle field):** The pipeline drill-down and contact detail views are storing/displaying the VIN Solutions API endpoint URL for the vehicle of interest, rather than resolving it to a human-readable vehicle description. The data pipeline likely needs to fetch the vehicle details from that URL and extract the year/make/model before storing or displaying it.

2. **BUG-CHAT03-002 (AI Chat metrics):** The AI chat is not using the same metrics data that powers the dashboard tiles. The tiles successfully query and display 107 active pipeline leads, but when the AI is asked the same question, it cannot access or does not query the same endpoint. The AI's tool/function for fetching pipeline data appears broken or disconnected.
