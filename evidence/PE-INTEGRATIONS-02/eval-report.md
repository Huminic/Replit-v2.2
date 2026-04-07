# PE-INTEGRATIONS-02 -- Production Eval Report

**Date:** 2026-04-06
**Evaluator:** Claude Opus 4.6 (PE Agent)
**Target:** https://dev.huminicdev.com
**Login:** serra_honda@huminic.ai (org_admin, Serra Honda)
**Branch:** rem-pe-006
**Prior Eval:** PE-INTEGRATIONS-01

---

## Bug Re-Evaluation Results

| Bug ID | Severity | Title | Status | Evidence |
|--------|----------|-------|--------|----------|
| BUG-INT-01 | High | Voice transcripts not rendered in Conversation thread | **OPEN** | Voice channel filter shows 0 conversations. All 15 VAPI calls ended with "call.start.error-get-phone-number" (never connected), so no transcripts exist to render. Root cause is no successful calls, not a rendering bug. Screenshot: 07-teambox-voice-filter.png |
| BUG-INT-02 | Medium | VAPI cross-org data leak -- Hyundai transcript under Serra Honda | **PARTIAL FIX** | Call log filtering works -- only Serra Honda assistant (Caroline, 90a876c0) calls appear in Phone tab. However, /api/vapi/assistants still returns all 19 assistants across all orgs (Elizabeth-Hyundai, Savannah-Ford of Columbia, etc.). Call-level filtering is effective; assistant-level filtering is not. |
| BUG-INT-03 | Medium | VAPI Caller Number column never populated | **FIXED** | All 15 VAPI call entries now show caller phone numbers (e.g., +14808964875, +14808039635). API confirms customer object has {number, name} structure. Screenshot: 04-teambox-phone.png |
| BUG-INT-04 | Low | ~17 ghost VAPI entries with no metadata | **IMPROVED** | Was 17 entries, now 15. All 15 have caller numbers (0 ghost entries by the no-metadata definition). However, all entries have null duration, null analysis, no date displayed, and raw UUID instead of assistant name. These are low-quality entries, not full ghosts. |
| BUG-INT-05 | High | Tavus Video Sessions tab empty despite webhook activity | **OPEN** | Video tab still shows "No video sessions found". API /api/tavus/conversations returns empty array []. Recent Activity feed shows "Tavus Video Completed" entries from 1 day ago, confirming webhooks fired but sessions are not being stored/retrieved. Screenshot: 05-teambox-video.png |
| BUG-INT-06 | Medium | VIN warehouse sync stale | **OPEN / WORSE** | Warehouse sync is broken, not just stale. Backfill fails with "VIN integration not found: 24d64f99-ba04-4b43-af35-fd06f555ac86". CRM Integration is Disabled+Locked in Settings > API. VIN API itself works (700 leads accessible via /api/vin/leads), but warehouse is empty (0 items). Sync logs show repeated failures. Last successful metrics refresh was Apr 4. Screenshot: 10-tools-api-tab.png |
| BUG-INT-07 | High | VIN Lead Creation failing on live VAPI calls | **CANNOT VERIFY** | All 15 VAPI calls failed at "call.start.error-get-phone-number" before any conversation occurred. No calls reached the point where lead creation would trigger. VIN API is accessible but warehouse sync is broken, so the full pipeline cannot be tested. |
| BUG-INT-08 | Low | 11/16 Active Pipeline leads missing contact names | **CANNOT VERIFY** | Active Pipeline shows 0 leads. Warehouse is empty due to sync failure (BUG-INT-06). No pipeline data exists to check for name enrichment. |
| BUG-INT-09 | Low | Trend percentages all show 0% | **INCONCLUSIVE** | All trend values display "0% vs last 30d". The pctChange() computation code was deployed (REM-PE-004), but with 0 warehouse data in both current and prior periods, 0% is mathematically correct. Cannot confirm fix without actual data. |
| BUG-INT-10 | High | ~95% of TeamBox data is test artifacts | **IMPROVED BUT NOT RESOLVED** | Was ~95% test data. Now: 294 total conversations, 216 (73%) are test artifacts (46 "Test Customer" + 170 RateTest/Reset/NoPhone entries). Remaining 78 include some real names but also synthetic ones (Ben Smith, Emily Davis, etc.). Significant improvement from prior state but test data still dominates. |
| BUG-INT-11 | Medium | 7/11 Top Performing Agents are "Unauthorized Agent" | **FIXED** | Top Performing Agents now shows 4 legitimate agents: Caroline (voice), Data Guru (chat), Sales Coach (chat), Communication Writer (chat). No "Unauthorized Agent" entries. Agent API returns 12 agents, all with proper names. Screenshot: 11-sales-dashboard-clean.png |

---

## Summary

**Fixed:** 2 (BUG-INT-03, BUG-INT-11)
**Partial Fix:** 2 (BUG-INT-02, BUG-INT-04)
**Improved:** 1 (BUG-INT-10)
**Open:** 3 (BUG-INT-01, BUG-INT-05, BUG-INT-06)
**Cannot Verify:** 2 (BUG-INT-07, BUG-INT-08)
**Inconclusive:** 1 (BUG-INT-09)

### Critical Blocker

**BUG-INT-06 (VIN warehouse sync broken)** is the root cause blocking verification of BUG-INT-07, BUG-INT-08, and BUG-INT-09. The warehouse backfill fails because CRM Integration is Disabled for Serra Honda, and the sync code errors with "VIN integration not found". Until this is resolved, the entire Sales Dashboard will show zeros and pipeline features cannot be tested.

---

## New Bugs Found

| Bug ID | Severity | Title | Description | Evidence |
|--------|----------|-------|-------------|----------|
| BUG-INT-12 | Medium | VAPI Phone tab shows raw assistant UUID instead of name | Assistant column displays "90a876c0-0f11-4424-abfe-9ac82b264d88" instead of "Caroline - Serra Honda". Should resolve the UUID to the friendly agent name. | Screenshot: 04-teambox-phone.png |
| BUG-INT-13 | Low | VAPI Phone tab Date column shows "-" for all entries | No dates displayed for any VAPI call entry. The API response does not include a date field, or the UI is not mapping it. | Screenshot: 04-teambox-phone.png |
| BUG-INT-14 | Low | VAPI Phone tab Duration column shows "-" for all entries | All calls have null duration because they all failed at call.start. Not a UI bug per se, but the UI should show "Failed" or "N/A" rather than "-" when endedReason is an error. | Screenshot: 04-teambox-phone.png |
| BUG-INT-15 | Medium | /api/vapi/assistants returns all orgs' assistants (19) | The assistants API endpoint is not filtered by organization. Serra Honda sees all VAPI assistants including those for Hyundai, Ford of Columbia, etc. While call filtering works, this endpoint leaks cross-org configuration data. | API query from browser |
| BUG-INT-16 | High | All 15 VAPI calls failing with call.start.error-get-phone-number | Every VAPI call for Serra Honda fails immediately with "call.start.error-get-phone-number". No calls are completing. This means the voice pipeline is non-functional. | API query: endedReasons all identical |
| BUG-INT-17 | Low | RateTest/Reset/NoPhone test conversation artifacts (170 entries) | DATA-CLEANUP removed some "Test Customer" entries but left 170 test framework artifacts (RateTest-*, Reset-*, NoPhone-*) that were created by automated test runs. These pollute the conversation list. | API query: 216/294 = 73% test data |

---

## Screenshots Index

| File | Description |
|------|-------------|
| 01-sales-dashboard.png | Sales Dashboard with TeamBox panel open |
| 02-sales-insights.png | Sales Insights tab showing all zero metrics |
| 03-teambox-main.png | TeamBox Conversations showing Test Customer entries |
| 04-teambox-phone.png | VAPI Call Logs with caller numbers (fix confirmed) |
| 05-teambox-video.png | Tavus Video Sessions -- empty |
| 06-teambox-conversations.png | TeamBox Conversations All view -- 294 entries |
| 07-teambox-voice-filter.png | Voice channel filter -- 0 conversations |
| 08-system-settings.png | System Settings tile view |
| 09-tools-integrations.png | Tools & Integrations -- MCP tab empty |
| 10-tools-api-tab.png | API integrations -- CRM Disabled, Voice Disabled |
| 11-sales-dashboard-clean.png | Clean Sales Dashboard with 4 agents, all zeros |
