# QA-S20 Communications Test Results
**Date:** 2026-03-17
**Sprint:** QA-S20
**Tester:** orchestrator agent
**Branch:** local-dev

---

## T1: VAPI — Elliott Test Script
**Result: PASS (partial — call connects, webhook blocked)**

- Script: `/home/ubuntu/Claude-store/nexxus2.2/tests/scripts/elliott-calls-christine.ts`
- Call ID: `019cfac1-fc3b-7aad-88a2-a50f4bc0bb40`
- Status: ended (exceeded-max-duration at ~20s)
- Cost: $0.0301
- Transcript captured:
  - User (Christine): "Thanks for calling our dealership. How can I help you today?"
  - AI (Elliott): "Hi there. My name is Duane Wells, and I'm interested in scheduling a test drive for a 2024 Honda Civic. Would you have availability tomorrow at 2 PM?"
  - User (Christine): "Hi, Duane. Great to hear from you, and thanks for calling Sarah Honda of..."
- 7 VAPI phone numbers found, all with assigned assistants
- VAPI webhook phone assignments:
  - +12564599707 → Georgia (Tony Serra Ford)
  - +12568623318 → Magnolia (Serra Nissan)
  - +19313692815 → Savannah (Ford of Columbia)
  - +19012039398 → Elizabeth (Hyundai of Columbia)
  - +19012038267 → Caroline (Serra Honda)
  - +18392729080 → Elliott
  - +14125209388 → Daria Private

### Defect: VAPI Webhook Secret Mismatch
- Logs: `[VAPI Webhook] Invalid secret — rejecting request`
- Impact: VAPI call transcripts do NOT reach TeamBox
- No voice/call conversations exist in TeamBox DB
- User story US-004 (VAPI inbound → transcript → lead) is BLOCKED

---

## T2: VIN Solutions — Create Test Lead
**Result: DEFECT (vin_create_contact fails with 400)**

- Lead sources: 20 sources retrieved for Serra Honda (dealerId 21043)
- Lead types: 10 types retrieved (INTERNET, WALK_IN, PHONE, etc.)
- Contact creation failed: `VIN API error: 400 Dealer Id is required`
- MCP endpoint: `/gateway/v1/contact?dealerId=21043&userId=1148936`

### Root Cause
File: `/home/ubuntu/Claude-store/central-mcp/src/tools/vin-tools.ts` (line 159-172)
The `contactBody` does NOT include `dealerId` in the POST body. VIN API requires it in the body, not just the query string. Compare with `vin_create_lead` which correctly includes `dealerId` in the body (line 192).

### Fix Required (in central-mcp, not this repo)
Add `dealerId` to the contactBody object in vin_create_contact handler.

### Integration Mapping Note
- User-specified orgId `3795b8f6-aca7-45fc-b77e-fc671b85a9f3` is the `nexxus_org_id` in the integrations table
- Actual Serra Honda org: `70845ae8-e2bd-4e90-90da-385a6dc524f6`
- The MCP server correctly resolves this mapping for read operations

---

## T3: TextMagic — Verify Message Capability
**Result: PASS (price check) / DEFECT (list chats)**

### Price Check: PASS
- Tool: `tm_get_message_price`
- Args: text="QA test message", phones="+12565303442"
- Response: total=$0.049, country=US, parts=1
- Confirms: sending capability is active, account has $11.911 balance

### List Chats: DEFECT
- Tool: `tm_list_chats`
- Error: `Validation Failed — page: This value should be of type int`
- The MCP tool sends `offset` and `limit` params, but TextMagic `/chats/fetch` endpoint expects `page` (integer) instead of `offset`
- File: `/home/ubuntu/Claude-store/central-mcp/src/tools/textmagic-tools.ts` (line 346)
- Fix: Change query parameter from `offset` to `page` for this endpoint

### TextMagic Contacts Retrieved
- 7 contacts found (all auto-created from phone numbers)
- Phone numbers: 12565303442, 12562678252, 12058990463, 12515040733, 13345593012, 17316141588, 14126546500

### TextMagic Webhook Issue
- Logs: `[TextMagic Webhook] Cannot resolve organization for unknown phone — multiple orgs exist, no fallback to arbitrary org`
- Impact: Inbound SMS from unknown numbers cannot be routed to correct org
- Affects user stories US-003, US-015, US-017

---

## T4: Tavus — Verify Personas Per Dealer
**Result: PASS**

### Personas Found (10 total):
| Persona ID | Name | Replica | Dealer Mapping |
|---|---|---|---|
| pc9acbf2c94f | Daria | rb91c99ba958 | Personal assistant (Duane Wells) |
| p92b0da01c4f | Elizabeth | re3a705cf66a | Hyundai of Columbia |
| p9eb007721f4 | Caroline | re3a705cf66a | Serra Honda of Sylacauga |
| pf233f09f33d | Savannah | re3a705cf66a | Ford of Columbia |
| p2f586f7e4e0 | Magnolia | re3a705cf66a | Serra Nissan of Sylacauga |
| pe791670615d | Georgia | re3a705cf66a | Tony Serra Ford |
| p45c6f2a4999 | Savannah (v2) | re3a705cf66a | Ford of Columbia (duplicate) |
| p806a583d275 | Magnolia (v2) | re3a705cf66a | Serra Nissan (duplicate) |
| p21000576413 | Georgia (v2) | re3a705cf66a | Tony Serra Ford (duplicate) |
| pdac61133ac5 | Interviewer | r5f0577fc829 | Special purpose |

### Dealer Coverage:
- Serra Honda: Caroline (confirmed, matches VAPI)
- Serra Nissan: Magnolia x2 (confirmed, matches VAPI)
- Tony Serra Ford: Georgia x2 (confirmed, matches VAPI)
- Ford of Columbia: Savannah x2 (confirmed, matches VAPI)
- Hyundai of Columbia: Elizabeth (confirmed, matches VAPI)
- Personal: Daria (Duane Wells assistant)
- Special: Interviewer

### Note: Duplicate Personas
Three dealers (Ford of Columbia, Serra Nissan, Tony Serra Ford) have duplicate personas. The duplicates share the same replica. May need cleanup.

---

## T5: Trigger Backfill for Other Dealers
**Result: PASS**

### Serra Nissan (b7c52a8e-eb8a-44c8-9082-0b136e925a81)
- Backfill response: `{"message":"Backfill completed","processed":1150,"failed":0}`
- Before: 1040 leads → After: 1151 leads (+111 new)

### Tony Serra Ford (82949bdf-49c2-4ccf-8460-5fb5debf8696)
- Backfill response: `{"message":"Backfill completed","processed":1134,"failed":0}`
- Before: 536 leads → After: 1134 leads (+598 new)

### Warehouse Leads Summary (Post-Backfill):
| Organization | Leads |
|---|---|
| Cage Automotive | 0 |
| Ford of Columbia | 0 |
| Hyundai of Columbia | 0 |
| Serra Honda | 1,300 |
| Serra Nissan | 1,151 |
| Tony Serra Ford | 1,134 |

### Note
Ford of Columbia and Hyundai of Columbia have 0 leads. These may not have VIN integrations configured, or they may use different CRM systems.

---

## TeamBox Round-Trip Verification

### SMS Thread Continuity (US-020)
- Conversation ID: `877fd499-830b-4334-b837-a1399b2a954c`
- Channel: sms, Org: Serra Honda
- Turn 1 (inbound): "I would like to schedule a service appointment" (2026-03-16T23:35:00Z)
- Turn 2 (TeamBox reply): "QA-S20 test: We can schedule your service appointment. What day works best for you?" (2026-03-17T07:57:38Z)
- Thread continuity: CONFIRMED — both messages in same conversation

### VAPI-to-TeamBox (US-004)
- BLOCKED by VAPI webhook secret mismatch
- Call completed but transcript never reached TeamBox

### TextMagic Webhook (US-003, US-015, US-017)
- BLOCKED by org resolution failure for unknown phone numbers
- Existing SMS conversations exist (5 total) from prior testing

---

## Conversation Channel Distribution (TeamBox)
| Channel | Count |
|---|---|
| ai-chat | 17 |
| chat | 12 |
| sms | 5 |
| email | 2 |
| agent-chat | 1 |
| whatsapp | 1 |

---

## Defect Summary

| ID | Severity | Component | Description |
|---|---|---|---|
| D1 | HIGH | VAPI Webhook | Invalid secret — transcripts blocked from TeamBox |
| D2 | HIGH | MCP vin_create_contact | Missing dealerId in POST body (central-mcp) |
| D3 | MEDIUM | MCP tm_list_chats | Sends offset instead of page to TextMagic API (central-mcp) |
| D4 | HIGH | TextMagic Webhook | Cannot resolve org for unknown phone in multi-org setup |
| D5 | LOW | Tavus | Duplicate personas for 3 dealers (cleanup needed) |

---

## QA-S20 Summary

```
T1: PASS (call connects + transcript captured, webhook defect D1)
T2: DEFECT (vin_create_contact fails — D2)
T3: PASS (price verified $0.049) / DEFECT (list chats — D3)
T4: PASS (10 personas, all 5 dealers covered)
T5: PASS (Nissan +111, Ford +598 leads backfilled)
```

3 of 5 tests PASS. 2 defects are in the central-mcp server (not this repo). 2 defects are in webhook handling (this repo).
