# Comms Eval 1: Service Campaign Full Loop

**Date:** 2026-04-07
**Evaluator:** Automated E2E Eval Agent
**Campaign:** "Service Reminder - Wave PE3 Test" (id: d1799d79-3d2b-4107-ab72-20a7fd7efe14)
**Organization:** Serra Honda (24d64f99-ba04-4b43-af35-fd06f555ac86)

---

## Step 1: Outbound Campaign Message Content

**Result: PASS (with notes)**

Campaign status: `completed`, sent_count: `2`

### Message 1 (sent 2026-04-07 21:16:24 UTC)
- **Recipient:** Duane Wells
- **Phone:** 4126546500
- **Content:**
  > Hi Duane, this is Nancy from Serra Honda Service. Your vehicle may be due for routine maintenance. Would you like to schedule a service appointment? Reply YES to confirm or call us at (833) 978-5374.

### Message 2 (sent 2026-04-07 21:16:36 UTC)
- **Recipient:** Duane Wells
- **Phone:** 4126574001
- **Content:**
  > Hi Duane, this is Nancy from Serra Honda Service. Your vehicle may be due for routine maintenance. Would you like to schedule a service appointment? Reply YES to confirm or call us at (833) 978-5374.

### Verification
| Check | Result |
|-------|--------|
| Merge fields resolved? | PASS -- "Hi Duane" (not "Hi {{firstName}}") |
| Nancy's phone number correct? | PASS -- (833) 978-5374 matches Nancy Gaston's assigned_phone +18339785374 |
| Message tone appropriate? | PASS -- Professional service reminder, includes CTA (reply YES or call) |
| Template substitution complete? | PASS -- No unresolved {{placeholders}} in either message |

---

## Step 2: Operator Inbound Reply Check

**Result: FAIL -- No conversations created for campaign recipients**

### Query
Searched conversations table for phones: 4126546500, 4126574001 (with +1 prefix variants).

### Finding
**Zero conversations found.** The campaign send code (`server/outbound.ts` `startCampaignExecution`) sends SMS and logs to `outbound_log` but does NOT create a `conversations` record for campaign recipients. This means:

1. If the operator replies to the campaign SMS, there is no conversation to receive the inbound reply into
2. The SMS webhook handler (`server/routes/sms.ts`) would need to match by phone number and create a new conversation on inbound -- but the campaign context (campaign_id, agent association) would be lost
3. TeamBox cannot display the campaign thread because no conversation exists

### Root Cause
`startCampaignExecution()` in `server/outbound.ts` (line 508-688) processes recipients, calls `processOutboundSend()`, logs to `outbound_log`, updates recipient status and campaign counters -- but never calls `storage.createConversation()`. The conversation should be created BEFORE or AFTER the outbound send, linked with the campaign_id.

### Code Location
- `server/outbound.ts` lines 596-665 (processNext function)
- Missing: conversation creation with `campaignId`, `customer_phone`, `customer_name`, `channel: "sms"`, `agent_id` (Nancy)

---

## Step 3: TeamBox Campaign Thread Verification

**Result: FAIL -- No campaign threads visible in TeamBox**

### API Verification
Authenticated as serra_honda@huminic.ai and fetched `/api/conversations?limit=20`. The response contains:
- ai-chat conversations
- Test Customer conversations (chat)
- Voice conversations (VAPI calls)
- SMS test conversations (+15551234567)

**No conversations with phones 4126546500 or 4126574001 appear.** This is a direct consequence of Step 2's finding -- no conversation records exist for campaign recipients.

### Screenshot
Browser-based screenshot not available (captain-check hook blocks chromium-browser in planning mode, and Playwright MCP browser context was closed). Verification performed via authenticated API call which returns the same data the TeamBox UI renders.

---

## Step 4: Reply FROM TeamBox

**Result: BLOCKED -- Cannot test (no conversation to reply to)**

Depends on Step 2/3. Without a conversation record, there is no thread to select in TeamBox and no reply input to use.

---

## Step 5: Lead Follow-Up Messages (Caroline Trigger)

**Result: PASS (message content) / FAIL (deduplication)**

### Message Content Verification

**Good example -- Ronteira Fowler (single lead):**
- **Phone:** 2568720709
- **Content:**
  > Hi Ronteira, this is Caroline from Serra Honda. I just wanted to follow up with you to see if you had any questions and if your experience with our dealer so far has been a good one. Please let me know if I can be of any assistance or if you have any feedback.

| Check | Result |
|-------|--------|
| Merge fields resolved? | PASS -- "Hi Ronteira" (not "Hi {customerFirstName}") |
| Agent name correct? | PASS -- "Caroline" |
| Dealership correct? | PASS -- "Serra Honda" |
| Tone appropriate? | PASS -- Friendly, professional follow-up |

**Bad example -- phone 8392729080 (customer_name: NULL):**
- **Content:**
  > Hi there, this is Caroline from Serra Honda. I just wanted to follow up...

| Check | Result |
|-------|--------|
| Merge fields resolved? | PARTIAL -- Falls back to "there" because warehouse_leads.customer_name is NULL |
| Correct fallback? | ACCEPTABLE -- "Hi there" is reasonable when name unknown |

### CRITICAL BUG: Duplicate Follow-Up SMS

**7 identical SMS messages sent to phone 8392729080.** Root cause:

1. **6 duplicate warehouse_leads records** exist for the same phone number (8392729080), all from vin_solutions, all created within ~2 seconds (2026-04-06 23:51:50 to 23:51:52)
2. The VIN sync created 6 separate lead records for the same contact
3. `getLeadsDueForFollowup()` returns all leads where `followup_sent_at IS NULL` -- it does not deduplicate by phone number
4. Each lead triggered its own follow-up SMS, so 6 SMS went to the same person with the same message
5. The 7th SMS appears to be from an earlier scheduler run (2026-04-07 16:08:42)

**Impact:** Customer receives 7 identical messages. This is a compliance concern (TCPA/spam) and a poor user experience.

### Root Cause Locations
1. **VIN sync dedup failure:** `server/sync.ts` or `storage.upsertWarehouseLead()` -- should deduplicate by phone + org, not just sourceId
2. **Follow-up query missing phone dedup:** `server/storage.ts` line 1277 `getLeadsDueForFollowup()` -- should GROUP BY customer_phone and only return one lead per unique phone
3. **No per-phone rate limit on trigger SMS:** `server/services/scheduler.ts` line 211-248 -- should check if a follow-up was already sent to this phone number recently

---

## Step 6: Auto-Greeting Template Check

**Result: PARTIAL PASS (with concerns)**

### Caroline (Sales Agent)
- **auto_greeting:** `Hi {{customerName}}! This is {{agentName}} from {{dealershipName}}. Thank you for your interest -- I'd love to help you find the perfect vehicle. What are you looking for?`
- **Status:** Template is well-formed with proper merge fields
- **Issue:** For first-contact leads from VIN Solutions, `customerName` resolves correctly. For inbound calls/SMS where only a phone number is known, it depends on how the conversation is created.

### Nancy Gaston (Service Agent)
- **auto_greeting:** `null`
- **Status:** No auto-greeting configured
- **Note:** Not a bug per se -- service campaigns use explicit message templates. But if a customer initiates contact via SMS to Nancy's number, there would be no auto-greeting.

### All Other Agents (Data Guru, Sales Coach, Communication Writer, Photo Studio, Video Producer, Copywriter, Market Intel, Creative Director, Service Agent, Marketing Agent)
- **auto_greeting:** All `null`
- **Status:** These are AI tool agents, not comms agents, so null auto-greeting is expected.

### Phone Number as Customer Name Concern
Recent conversations show `customer_name` set to the phone number itself:
- Conversation d4a2fc69: `customer_name = "+18392729080"` (voice channel)
- Conversation e53d821b: `customer_name = "+15551234567"` (sms channel)

This means if Caroline's auto-greeting fires for these conversations, it would say "Hi +18392729080!" instead of a real name. **The VAPI webhook and SMS webhook handlers use the phone number as the customer name when no name is available.** This is a UX issue -- should use "there" or "valued customer" as a fallback instead.

---

## Summary

| Step | Description | Result |
|------|-------------|--------|
| 1 | Campaign SMS content | **PASS** -- Merge fields resolved, correct phone, appropriate tone |
| 2 | Operator inbound reply check | **FAIL** -- No conversations created for campaign recipients |
| 3 | TeamBox campaign threads | **FAIL** -- No threads visible (consequence of Step 2) |
| 4 | Reply from TeamBox | **BLOCKED** -- Depends on Step 2/3 |
| 5 | Lead follow-up messages | **PARTIAL** -- Content correct, but 7 duplicate SMS to same phone |
| 6 | Auto-greeting template | **PARTIAL** -- Caroline's template OK, phone-as-name issue found |

## Issues Found

### CRITICAL: Campaign sends do not create conversations (Steps 2-4)
- **Location:** `server/outbound.ts` `startCampaignExecution()` lines 596-665
- **Impact:** Campaign replies cannot be received or tracked in TeamBox. Breaks the full service loop.
- **Fix:** After successful `processOutboundSend()`, create a conversation record with campaign_id, customer_phone, customer_name, channel, and agent_id.

### CRITICAL: Duplicate follow-up SMS (Step 5)
- **Location:** `server/storage.ts` `getLeadsDueForFollowup()` line 1277 + `server/sync.ts` (VIN dedup)
- **Impact:** Customer 8392729080 received 7 identical SMS messages. TCPA/compliance risk.
- **Fix (short-term):** Add `DISTINCT ON (customer_phone)` to `getLeadsDueForFollowup()` query. 
- **Fix (long-term):** Fix VIN sync to deduplicate by phone+org, not just sourceId.

### MODERATE: Phone number used as customer_name (Step 6)
- **Location:** SMS webhook handler (`server/routes/sms.ts`) and VAPI webhook handler (`server/routes/webhooks.ts`)
- **Impact:** Auto-greeting says "Hi +18392729080!" which is not professional.
- **Fix:** Use "there" or "valued customer" as fallback when no name is available.

### MINOR: Nancy Gaston has no auto-greeting configured (Step 6)
- **Location:** agents table, Nancy Gaston record
- **Impact:** No auto-response if customer texts Nancy's number directly.
- **Fix:** Add service-appropriate auto-greeting template.
