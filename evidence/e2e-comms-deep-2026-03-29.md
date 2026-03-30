# Deep Autonomous Communications E2E Test Report

**Date:** 2026-03-29 04:44-04:55 EDT (08:44-08:55 UTC)
**Environment:** https://dev.huminicdev.com
**Org:** Serra Honda (f4c56901-89ab-4497-9bfb-69e6495a4839)
**Operator:** serra_honda@huminic.ai
**Note:** Tests ran during after-hours (04:44 AM ET, business hours 07:00-22:00). This affects outbound SMS/phone delivery (TCPA compliance blocks outbound outside business hours).

---

## Test 1: SMS Inbound → AI Response

- **Action:** POST /api/webhooks/textmagic with sender=15553330001, text="I need to schedule a test drive for a 2025 Honda Accord", receiver=18339785374
- **Expected:** Conversation created, AI response generated
- **Actual:** Conversation created (76fc416c-066f-4771-9c6b-1785769b5c83). No AI response — correctly identified as after-hours (04:44 AM ET). After-hours auto-response attempted via outbound (may have been blocked by OUTBOUND_LIVE_ENABLED or TCPA gate). User message stored correctly.
- **Result:** PASS (after-hours behavior correct)
- **Evidence:** conversationId: 76fc416c-066f-4771-9c6b-1785769b5c83, message: 5746e7d1-b36c-436f-8ac6-c683777460f5

---

## Test 2: SMS Takeover — Real Test

- **Action:** PATCH conversation 76fc416c with assignedTo=0b3f9bbf (admin user). Sent second webhook from 15553330001 ("Can I also look at the Civic?").
- **Expected:** No AI response after human takeover
- **Actual:** Conversation updated with assignedTo and aiPaused=true. Second message stored as user message. No AI or agent response generated. Takeover respected.
- **Result:** PASS
- **Evidence:** assignedTo: 0b3f9bbf-1ade-428f-ad82-19aca15b0ad9, aiPaused: true, 3 messages total (2 user, 1 prior agent from earlier test)

---

## Test 3: Campaign Full Lifecycle

- **Action:** Created campaign "E2E Deep Test Campaign" (4c4de119). Uploaded CSV with 1 recipient (15553330002). Executed (dryRun: false). Simulated reply webhook from 15553330002.
- **Expected:** Campaign sent, reply creates linked conversation
- **Actual:** Campaign executed but recipient BLOCKED — outside business hours (TCPA compliance, 04:48 AM ET, allowed 07:00-22:00). Reply from 15553330002 created new conversation (53aec26d) but without campaign linkage (since outbound never went through, no outbound history to resolve).
- **Result:** PARTIAL PASS — campaign lifecycle mechanics work correctly; blocking is expected TCPA behavior; campaign linkage cannot be tested during after-hours
- **Evidence:** campaignId: 4c4de119-1bd2-4811-bc21-b57621d52f92, recipientStatus: blocked, replyConversation: 53aec26d-c1f1-4eff-a0f5-188c476bf6a5

---

## Test 4: Kill Switch

- **Action:** Set outboundEnabled=false on org. Created campaign "Kill Switch Test Campaign" (237a1830). Uploaded CSV with 15553330003. Executed. Restored outboundEnabled=true immediately.
- **Expected:** Campaign blocked when CommGate OFF, restored after
- **Actual:** Campaign blocked (1 processed, 0 sent, 1 blocked). CommGate restored to outboundEnabled=true immediately after test.
- **Result:** PASS
- **Evidence:** campaignId: 237a1830-d8a0-44e3-94c0-79b75be12e19, execution: {sent: 0, blocked: 1}, CommGate restored: {outboundEnabled: true, smsEnabled: true, emailEnabled: true}

---

## Test 5: Voice — Elliott Calls Caroline

- **Action:** POST https://api.vapi.ai/call/phone with Elliott assistant (c303d993) calling Caroline (+19012038267)
- **Expected:** Call completes, transcript generated, conversation created in app, email notification sent
- **Actual:**
  - Call completed (status: ended, endedReason: exceeded-max-duration after 20s, cost: $0.0306)
  - Transcript captured: Caroline answered ("Thanks for calling Sarah Automotive"), Elliott requested 2024 Honda Civic test drive
  - Voice conversation created in app (9ac57d46-de4e-4af0-bb4f-f62667e713f9, phone: +18392729080)
  - Duplicate voice conversation also created (162e9542) — same phone, no messages (race condition or duplicate webhook)
  - Email notifications delivered via Resend to 3 recipients (serra_honda@huminic.ai, duanekwells@gmail.com, duane.wells@huminic.ai) with subject "Serra Honda Has a New AI Voice Lead!"
  - Transcript NOT stored in conversation messages (empty messages array)
- **Result:** PARTIAL PASS — call worked, email sent, but transcript not stored in app conversation; duplicate voice conversations created
- **Evidence:** vapiCallId: 019d38c8-e99b-733e-b63f-85e5f435cdac, conversationId: 9ac57d46-de4e-4af0-bb4f-f62667e713f9, emailIds: [28cfdcca, 4322ebe3, 9b21ad7c]

---

## Test 6: Multi-Channel Campaign (S4 fix validation)

- **Action:** Created 2 campaigns with identical name "Multi-Channel E2E Test" but different channels (sms: 982b415f, email: aa6f09f2). Uploaded same CSV (15553330004 / multi@test.com) to both. Executed both.
- **Expected:** Both campaigns coexist, both execute independently
- **Actual:**
  - SMS campaign: blocked (after-hours TCPA)
  - Email campaign: sent 1 successfully
  - Campaign list shows both campaigns (count: 2 with same name)
- **Result:** PASS — S4 multi-channel fix confirmed working. Same-name campaigns with different channels coexist and execute independently.
- **Evidence:** smsCampaignId: 982b415f-b907-4a59-9fc5-4db520750f7c (blocked), emailCampaignId: aa6f09f2-e89d-4eaf-b641-8c5cfc24a7df (sent: 1)

---

## Test 7: Blacklist (S0 fix validation)

- **Action:** Sent STOP keyword from 15553330005. Verified blacklist entry created. Executed campaign targeting blacklisted number. Removed blacklist entry.
- **Expected:** STOP creates blacklist entry, blocked number cannot receive messages, removal works
- **Actual:**
  - STOP webhook returned {success: true, action: "blacklisted", keyword: "STOP"}
  - Blacklist entry created (0fd03111, reason: "STOP")
  - Campaign to blacklisted number: blocked (0 sent, 1 blocked)
  - DELETE /api/sms-blacklist/0fd03111 returned success
  - Post-removal verification: 0 entries for 15553330005
- **Result:** PASS
- **Evidence:** blacklistEntryId: 0fd03111-25cf-422c-93e2-3829496f70db, campaignId (blocked): created and blocked, entry removed successfully. Note: No POST endpoint for manual blacklist add — only via STOP keyword.

---

## Test 8: Widget Form → TeamBox

- **Action:** POST /api/widget/contact with slug=serra-honda, name="E2E Widget Test", email="e2e@test.com", phone="15553330006", message="Interested in service"
- **Expected:** Conversation created with form channel
- **Actual:** Conversation created (841e1ccc-5068-4c2c-99e3-e15bf20dfdcf) with channel=form, status=open, customerName="E2E Widget Test", customerEmail="e2e@test.com", customerPhone="15553330006"
- **Result:** PASS
- **Evidence:** conversationId: 841e1ccc-5068-4c2c-99e3-e15bf20dfdcf

---

## Test 9: AI Chat Tool Use

- **Action:** POST /api/chat/841e1ccc.../stream with content="How many active leads are in my pipeline?", mode="crm_guru"
- **Expected:** AI response with real CRM numbers and tool attribution
- **Actual:** Streaming response with tool use. AI queried VinSolutions CRM (via vinQueryLeads tool). Response included:
  - Active Pipeline: 171 leads
  - Waiting for Response: 87
  - New Leads (last 30 days): 18 (+100% vs prior)
  - Conversion Rate: 5%, 32 sold/delivered
  - Staleness warning: CRM data last synced 5 days ago
  - Context-aware: mentioned the E2E Widget Test contact from the conversation
- **Result:** PASS
- **Evidence:** Stream completed with type:done, real CRM data returned with tool attribution

---

## Test 10: TeamBox Shows Everything

- **Action:** Playwright MCP: navigated to /teambox (already logged in), took screenshot
- **Expected:** Conversations from tests 1-8 visible
- **Actual:** TeamBox loaded showing 295 total conversations. Accessibility snapshot confirmed presence of:
  - 15553330001 (Test 1/2 SMS conversations)
  - 15553330002 (Test 3 campaign reply)
  - E2E Widget Test (Test 8 form submission)
  - 15553330007 (Test 11 rapid fire)
  - SMS channel markers visible
- **Result:** PASS
- **Evidence:** Screenshot saved to evidence/teambox-e2e-2026-03-29.png

---

## Test 11: Edge Cases

### 11a: Rapid SMS (3 webhooks, same number, <1 second)
- **Action:** Fired 3 concurrent POST /api/webhooks/textmagic from 15553330007
- **Expected:** All 3 land in same conversation (no duplicates)
- **Actual:** 3 DIFFERENT conversations created:
  - 3c2e606c-2537-47d2-b28c-a3a9b3ebbe86
  - cb659435-6a29-4f08-add5-7b83e28a7f07
  - aac5bb70-3e63-4a48-b7e0-0fd505569af4
- **Result:** FAIL — Race condition in getConversationByPhone. No mutex/lock on conversation creation per phone number.
- **Evidence:** 3 conversation IDs for same phone 15553330007

### 11b: Empty text webhook
- **Action:** POST webhook with text=""
- **Expected:** Rejected
- **Actual:** Rejected with {"message": "Missing sender or text in webhook payload"}
- **Result:** PASS

### 11c: Missing sender webhook
- **Action:** POST webhook without sender field
- **Expected:** Rejected
- **Actual:** Rejected with {"message": "Missing sender or text in webhook payload"}
- **Result:** PASS

---

## Critical Flow Summary

| Flow | Status |
|------|--------|
| SMS Inbound → Conversation | PASS |
| After-Hours Detection | PASS |
| Human Takeover (AI Paused) | PASS |
| Campaign Create/Upload/Execute | PASS |
| Campaign TCPA Business Hours Block | PASS |
| Campaign Reply → Conversation | PASS (no linkage due to after-hours block) |
| CommGate Kill Switch | PASS |
| CommGate Restore | PASS |
| Voice Call (VAPI) | PARTIAL PASS (call works, transcript not stored in app) |
| Voice Email Notification | PASS |
| Multi-Channel Same-Name Campaigns (S4) | PASS |
| Blacklist via STOP Keyword (S0) | PASS |
| Blacklist Blocks Outbound | PASS |
| Blacklist Removal | PASS |
| Widget Form → Conversation | PASS |
| AI Chat with CRM Tool Use | PASS |
| TeamBox Shows All Channels | PASS |
| Duplicate Prevention (rapid SMS) | FAIL |
| Empty Text Rejection | PASS |
| Missing Sender Rejection | PASS |

---

## New Issues Found

### CRITICAL: Race Condition in SMS Conversation Creation
- **What:** 3 concurrent webhooks from the same phone number create 3 separate conversations instead of 1
- **Where:** `storage.getConversationByPhone()` in `/server/routes/sms.ts` — no mutex or advisory lock
- **Impact:** Duplicate conversations in TeamBox, split message history, confused agents
- **Fix:** Add a per-phone-number lock (advisory lock via Postgres, or in-memory mutex) around the get-or-create conversation logic

### MODERATE: Voice Transcript Not Stored in Conversation
- **What:** VAPI call transcript exists in VAPI API but conversation messages array is empty in the app
- **Where:** VAPI end-of-call webhook handler in `/server/routes/webhooks.ts`
- **Impact:** Voice conversations appear in TeamBox but show no content
- **Possible cause:** The call ended with "exceeded-max-duration" (20s) — the transcript may not be included in the end-of-call webhook payload, or the handler doesn't process short calls

### MODERATE: Duplicate Voice Conversations
- **What:** Same VAPI call created 2 voice conversations (9ac57d46 and 162e9542) for phone +18392729080
- **Where:** Same race condition pattern as SMS, or VAPI sending multiple webhooks (status-update + end-of-call-report)
- **Impact:** Duplicate voice entries in TeamBox

### LOW: No Manual Blacklist Add API
- **What:** No POST /api/sms-blacklist endpoint — blacklist entries can only be created via STOP keyword
- **Where:** `/server/routes/sms.ts`
- **Impact:** Admins cannot manually blacklist numbers without the customer sending STOP

---

## Cleanup

### Campaigns Created
| Campaign | ID | Status |
|----------|-----|--------|
| E2E Deep Test Campaign | 4c4de119-1bd2-4811-bc21-b57621d52f92 | completed (0 sent) |
| Kill Switch Test Campaign | 237a1830-d8a0-44e3-94c0-79b75be12e19 | completed (0 sent) |
| Multi-Channel E2E Test (SMS) | 982b415f-b907-4a59-9fc5-4db520750f7c | completed (0 sent) |
| Multi-Channel E2E Test (Email) | aa6f09f2-e89d-4eaf-b641-8c5cfc24a7df | completed (1 sent) |
| Blacklist Test Campaign | created inline | completed (0 sent) |

### Conversations Created
| Phone/Name | ID | Channel |
|------------|-----|---------|
| 15553330001 | 76fc416c-066f-4771-9c6b-1785769b5c83 | sms |
| 15553330002 | 53aec26d-c1f1-4eff-a0f5-188c476bf6a5 | sms |
| E2E Widget Test | 841e1ccc-5068-4c2c-99e3-e15bf20dfdcf | form |
| 15553330007 (dup 1) | 3c2e606c-2537-47d2-b28c-a3a9b3ebbe86 | sms |
| 15553330007 (dup 2) | cb659435-6a29-4f08-add5-7b83e28a7f07 | sms |
| 15553330007 (dup 3) | aac5bb70-3e63-4a48-b7e0-0fd505569af4 | sms |
| +18392729080 (voice) | 9ac57d46-de4e-4af0-bb4f-f62667e713f9 | voice |
| +18392729080 (voice dup) | 162e9542-9b3d-4753-b185-d82dc2435355 | voice |

### State Restored
- CommGate: outboundEnabled=true, smsEnabled=true, emailEnabled=true (restored immediately after Test 4)
- Blacklist: 15553330005 entry removed after Test 7
- VAPI call cost: $0.0306

---

**Score: 17/20 assertions passed. 1 FAIL (duplicate conversations), 2 PARTIAL PASS (voice transcript, campaign linkage).**
