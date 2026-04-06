# PE-INTEGRATIONS-01 Evidence Index

**Date:** 2026-04-06
**Evaluator:** Playwright Operator (observation-only)
**Org Context:** Serra Honda (super_admin session, org-switched)
**Target:** https://live.huminic.app

---

## Phase 1: TextMagic SMS (UC-01, UC-02)

### UC-01: SMS Conversations in TeamBox
**Expected:** Real SMS threads with customer messages and agent responses from TextMagic
**Observed:** 57 SMS conversations visible. The vast majority are automated test artifacts:
- "Cross Org Delete Test", "Cross Org Message Test", "Cross Org Patch Test", "Cross Org Msg Test", "Cross Org Test" (approx 24 entries)
- Phone numbers like +15551234567, +15559990001, +15558880001 (555 = fictitious)
- Only 3 entries with human-like names: Michael Clark, Joshua Thompson, Melissa Taylor
**Verdict:** MISMATCH. No evidence of real TextMagic-delivered SMS. All conversations are seed/test data.
**Screenshot:** 02-teambox-sms-list.png, 03-teambox-sms-filtered.png

### UC-02: SMS Thread Detail Verification
**Expected:** Customer message with phone number, agent response with agent name, plausible timestamps
**Observed (Michael Clark thread):**
- Phone: (412) 555-0101 -- FALSE: 555 number
- Email: michael.clark@email.com -- FALSE: generic test pattern
- Messages: "Thank you for your interest in the 2026 Camry" / "trade-in value" / "I received a damaged item" -- seeded demo script (last message nonsensical for auto context)
- All timestamps: "18 days ago" (identical, no real conversation cadence)
- Handled by: Caroline (AI agent)
**Verdict:** FALSE-PASS. Data appears functional but is entirely seeded demo data, not from TextMagic.
**Screenshot:** 04-sms-michael-clark-thread.png

---

## Phase 2: VAPI Voice (UC-03, UC-04, UC-05)

### UC-03: VAPI Call Logs
**Expected:** Call logs with dates, caller numbers, durations, statuses
**Observed:**
- 3 calls with real data (4/5/2026): 47-51s durations, "ended" status, have Transcript buttons
- ~17 calls with missing data: date="-", caller="-", duration="-", all same assistant ID 90a876c0-..., no transcripts
- Caller Number column is "-" for ALL entries (never populated)
- Assistant column shows raw UUIDs, not human-readable names
**Verdict:** PARTIAL MATCH. Real VAPI data exists but display is degraded. Caller numbers never shown. Many ghost entries with no metadata.
**Screenshot:** 05-teambox-phone-vapi-logs.png

### UC-04: VAPI Transcript Content
**Expected:** Readable, plausible call transcript
**Observed:**
- Real human conversation transcript from 4/5/2026, 10:18 PM
- AI identifies as "Elizabeth" from "Hyundai of Columbia" (not Serra Honda -- cross-org issue)
- Clearly genuine interaction: informal speech, interruptions, caller says "Girl, shut up. Bye."
- "Listen to Recording" link to VAPI storage (storage.vapi.ai) present and correctly formatted
- Transcript is readable, plausible, from a real VAPI call
**Verdict:** MATCH (transcript content). BUG: transcript references "Hyundai of Columbia" but displayed under Serra Honda org.
**Screenshot:** 06-vapi-transcript-real-call.png

### UC-05: Voice Conversations in Conversations Tab
**Expected:** Voice conversations with channel=voice, transcript content visible in thread
**Observed:**
- 113 voice conversations visible when Voice filter applied
- Vast majority are test artifacts: "Test Caller", "Idempotency Test", "VIN Disabled Test", "Dedup Tester", "Flat Format Test", "S9 VAPI Audit", "Email Test Customer", etc.
- 1 potentially real entry: "HERNANDEZ MARTI" (phone +13238095779, real 323 area code)
- HERNANDEZ MARTI conversation shows channel=VOICE but **"No messages yet"** -- transcript not rendered in conversation thread
- All voice conversations show "No messages yet" regardless of whether VAPI transcript exists
**Verdict:** MISMATCH. Voice conversations exist with correct channel tag, but transcript content is NOT surfaced in the conversation thread view. The Phone tab's transcript dialog has the data, but it doesn't flow into the Conversations view.
**Screenshot:** 07-teambox-voice-conversations.png, 08-voice-hernandez-no-messages.png

---

## Phase 3: Tavus Video (UC-06, UC-07)

### UC-06: Tavus Video Sessions
**Expected:** Video sessions listed in the Video tab
**Observed:** "No video sessions found"
**Note:** Despite the Video tab showing 0 sessions, the Recent Activity log on Sales Dashboard shows 4x "Tavus Video Completed" entries from ~17 hours ago. This means Tavus webhooks ARE being received and logged as activity, but the Video Sessions tab has no data. Possible causes: (a) video session data not persisted to DB, (b) query filtering excludes them, (c) webhook creates activity log but not session record.
**Verdict:** MISMATCH. Tavus events arrive (proven by activity log) but Video tab is empty.
**Screenshot:** 09-tavus-video-empty.png

### UC-07: Tavus Session Detail
**Expected:** Transcript content, video session metadata
**Observed:** N/A -- no sessions to click
**Verdict:** NOT TESTABLE (no data)

---

## Phase 4: Resend Email (UC-08, UC-09)

### UC-08: Email Evidence
**Expected:** Email notifications or sent emails visible in UI
**Observed:** Only 2 email conversations exist, both are seeded demo data:
- David Jackson: david.jackson@email.com, (412) 555-0103, "I need to update my payment information" -- generic non-auto content
- Stephanie Thompson: similar seeded data
- No email delivery logs, no sent email evidence in UI
- Known issue I-239 documents 483 failed lead notification emails (Resend rate limit exhausted)
**Verdict:** MISMATCH. No real Resend email delivery evidence visible in UI.
**Screenshot:** 10-email-david-jackson.png

### UC-09: Email Conversations in TeamBox
**Expected:** Conversations with channel=email showing email thread content
**Observed:** 2 email conversations exist. David Jackson has 1 message ("I need to update my payment information", 18 days ago, status=Followup). No agent response. Clearly seeded.
**Verdict:** FALSE-PASS. Email conversations exist structurally but contain only seed data.

---

## Phase 5: VIN Solutions (UC-10, UC-11, UC-12)

### UC-10: Warehouse Sync Status
**Expected:** Sync status indicator with recent sync date, warehouse data present
**Observed:**
- "Warehouse: Synced 9d ago" -- last sync was 9 days ago
- Dashboard metrics populated: Total Leads (30d)=340, New Leads=9, Active Pipeline=16, Waiting on Response=53, Appointments Set=22, Sold=10, Conversion Rate=2.9%
- All trend indicators show 0% vs last 30d
**Verdict:** PARTIAL MATCH. Warehouse data IS present and real. Sync is stale (9 days). Trend calculation appears broken (all 0%).
**Screenshot:** 11-sales-dashboard-full.png, 12-sales-dashboard-clean.png

### UC-11: Active Pipeline VIN-Sourced Leads
**Expected:** Leads with VIN Solutions-sourced data (names, phones)
**Observed:**
- 16 records in Active Pipeline drill-down
- Real VIN Solutions lead IDs (1988xxxxxx format)
- Real customer names: Michael Mccord, Donnie Kitchens, Renay Elmore, Braden Macon, "AI Lead"
- VIN Solutions statuses: ACTIVE_NEW_LEAD, ACTIVE_WAITING_FOR_PROSPECT_RESPONSE, ACTIVE_ACTIVE_LEAD
- Vehicle column shows VIN Solutions API URLs
- 11 of 16 leads show "---" for name (missing contact name in warehouse)
- "Show Contact" button available for each
**Verdict:** MATCH. Genuine VIN Solutions warehouse data. Name resolution incomplete for most records.
**Screenshot:** 13-active-pipeline-drilldown.png

### UC-12: VIN Lead Creation Evidence
**Expected:** Activity log entries showing VIN lead creation
**Observed:**
- Recent Activity shows **"Vin Lead Creation Failed"** twice (~17 hours ago)
- This confirms the VIN lead creation flow IS being attempted after VAPI calls
- Lead creation is failing (consistent with known issue I-188: warehouse leads query returns 0 rows)
**Verdict:** PARTIAL MATCH. VIN lead creation is attempted but failing. The failure is logged and visible.

---

## Phase 6: Cross-Cutting (UC-13, UC-14)

### UC-13: Activity Log Integration Sources
**Expected:** Integration-sourced entries from multiple providers
**Observed (Recent Activity on Sales Dashboard):**
- "Sync Metrics Refreshed" -- about 13 hours ago (VIN Solutions)
- "Vapi Call Received" -- about 17 hours ago (VAPI) x2
- "Vin Lead Creation Failed" -- about 17 hours ago (VIN Solutions) x2
- "Auto Greeting Sent" -- about 17 hours ago (internal)
- "Tavus Video Completed" -- about 17 hours ago (Tavus) x4
**Verdict:** MATCH. Activity log shows real-time events from VAPI, Tavus, and VIN Solutions. No TextMagic or Resend entries visible.

### UC-14: FALSE-PASS CHECK
**Integration-by-integration assessment:**

| Integration | Real Provider Data? | False-Pass Indicators |
|-------------|--------------------|-----------------------|
| TextMagic SMS | NO | All 555 numbers, @email.com addresses, "Test" prefixed names, generic seed messages, identical timestamps |
| VAPI Voice | YES (partial) | 3 real call transcripts with VAPI storage URLs. BUT: ~110 of 113 voice conversations are test artifacts ("Test Caller", "Idempotency Test", etc.) |
| Tavus Video | UNCLEAR | Activity log shows 4 "Tavus Video Completed" events, but Video Sessions tab is empty. Cannot verify if real or test-triggered. |
| Resend Email | NO | Only 2 email conversations, both seeded. Known I-239 shows 483 failed sends (rate limit). No successful delivery evidence. |
| VIN Solutions | YES | Real lead IDs, real customer names, real statuses from VIN API. Warehouse sync stale (9d) but data is genuine. |

**Overall FALSE-PASS findings:**
1. SMS data is 100% fake/seeded -- would appear functional to a casual observer but contains zero real TextMagic data
2. Voice conversations are ~97% test artifacts, ~3% potentially real
3. Email conversations are 100% seeded
4. VIN Solutions data is genuine
5. Tavus has evidence of real webhook events but no UI-visible sessions

---

## Summary Scorecard

| UC | Integration | Status | Notes |
|----|------------|--------|-------|
| UC-01 | TextMagic | FAIL | All test data, no real SMS |
| UC-02 | TextMagic | FALSE-PASS | Looks functional, all fake data |
| UC-03 | VAPI | PARTIAL | 3 real calls, many ghost entries |
| UC-04 | VAPI | PASS | Real transcript, readable |
| UC-05 | VAPI | FAIL | Transcripts not in conversation thread |
| UC-06 | Tavus | FAIL | Empty despite webhook activity |
| UC-07 | Tavus | N/A | No data to test |
| UC-08 | Resend | FAIL | No email delivery evidence |
| UC-09 | Resend | FALSE-PASS | Seeded data only |
| UC-10 | VIN Solutions | PARTIAL | Real data, stale sync, broken trends |
| UC-11 | VIN Solutions | PASS | Real VIN leads with names |
| UC-12 | VIN Solutions | PARTIAL | Creation attempted but failing |
| UC-13 | Cross-cutting | PASS | Activity log shows real events |
| UC-14 | False-pass | CRITICAL | SMS and Email are entirely fake data |
