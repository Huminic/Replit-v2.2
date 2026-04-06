# Use Case Inventory: PE-INTEGRATIONS-01

**Date:** 2026-04-06
**Sprint:** PE-INTEGRATIONS-01 -- Comms Integrations

---

## TextMagic (SMS)

### UC-01: Outbound SMS send truth
**Provider action:** `tm_send_message` via central-mcp sends SMS to customer phone
**Nexxus-side outcome:** Outbound log entry created with status "sent", message content recorded
**TeamBox visibility:** Sent message should appear in conversation thread as agent/system message
**False-pass risk:** MCP returns success but TextMagic rejects downstream (invalid number, carrier block). Nexxus logs "sent" without delivery confirmation.
**Evidence approach:** Check outbound_log for recent sends, cross-reference with TeamBox conversation thread content

### UC-02: Inbound SMS receive and conversation creation
**Provider action:** TextMagic forwards inbound SMS to `POST /api/webhooks/textmagic`
**Nexxus-side outcome:** Conversation created/updated in TeamBox, message stored, org resolved
**TeamBox visibility:** New conversation appears in SMS channel with customer phone as name
**False-pass risk:** Org resolution fails silently for multi-org setups. Conversation created in wrong org.
**Evidence approach:** Send test SMS (if approved) or examine existing inbound conversations for correct org assignment

### UC-03: SMS STOP keyword handling
**Provider action:** Customer sends "STOP" via SMS
**Nexxus-side outcome:** Blacklist entry created, open conversations closed, confirmation SMS sent
**TeamBox visibility:** Conversation status changes to closed
**False-pass risk:** STOP confirmation SMS itself could fail (blacklist applied before confirmation sent). Race condition.
**Evidence approach:** Check blacklist entries via `GET /api/sms-blacklist`, verify conversation status

### UC-04: Campaign SMS reply linking
**Provider action:** Customer replies to campaign-originated SMS
**Nexxus-side outcome:** Reply linked to campaign via `findLastOutboundForPhone()`, vehicle context injected
**TeamBox visibility:** Conversation should show campaign context and vehicle info as system message
**False-pass risk:** Campaign linking depends on outbound log lookup. If original send logged differently (different phone format), linking fails silently.
**Evidence approach:** Find campaign conversation in TeamBox, check for campaignId and vehicle context system message

---

## VAPI (Voice)

### UC-05: Inbound VAPI call -- transcript arrival in Nexxus
**Provider action:** VAPI sends end-of-call-report webhook with transcript
**Nexxus-side outcome:** Voice conversation created in TeamBox, transcript stored as system message from "VAPI"
**TeamBox visibility:** Conversation appears in Voice channel with transcript visible
**False-pass risk:** Transcript extraction fails (VAPI format changed). Conversation created but empty. Dedup logic (I-177) might discard legitimate second webhook that carries transcript.
**Evidence approach:** Open recent voice conversations in TeamBox, verify transcript content matches call

### UC-06: VAPI call -- VIN lead creation downstream
**Provider action:** VAPI webhook triggers vin-safe-mcp prepare -> execute -> verify
**Nexxus-side outcome:** VIN Solutions contact and lead created, escalation task if failure
**False-pass risk:** vin-safe-mcp returns EXECUTED but VIN Solutions assignment is wrong (ASSIGNMENT_MISMATCH). Or prepare succeeds but execute silently fails.
**Evidence approach:** Check escalation tasks for VIN failures, check activity log for `vin_lead_creation_failed`

### UC-07: VAPI call -- AI transcript analysis and appointment creation
**Provider action:** Claude analyzes transcript for appointment intent
**Nexxus-side outcome:** Appointment created on Calendar page, lead quality score updated
**False-pass risk:** AI hallucinates appointment intent from casual conversation. Score assignment wrong. Appointment created with incorrect date/time.
**Evidence approach:** Check Calendar page for AI-generated appointments, verify source field shows "vapi"

### UC-08: VAPI call -- admin email notification
**Provider action:** `sendLeadNotificationEmail()` sends HTML email via Resend
**Nexxus-side outcome:** Email sent to all admin users (L1-L3 across org hierarchy), idempotency logged
**False-pass risk:** Recipient resolution misses admins (additional_org_ids not checked). Email sent but marked as duplicate by idempotency check.
**Evidence approach:** Check outbound_log for `[notification:vapi-*]` entries, verify recipient count

### UC-09: VAPI leads count -- Dashboard accuracy
**Provider action:** `GET /api/vapi/calls` returns call list from VAPI
**Nexxus-side outcome:** Calls displayed in Settings > Integrations or Voice panel
**False-pass risk:** VAPI returns all calls across all assistants. Nexxus does not filter by org. Count may include calls from other orgs sharing the same VAPI account. (Cross-cutting bug from previous sprint observations.)
**Evidence approach:** Compare VAPI call count with Nexxus voice conversation count per org

---

## Tavus (Video)

### UC-10: Tavus video session -- conversation creation in Nexxus
**Provider action:** Tavus sends conversation.end webhook
**Nexxus-side outcome:** Video conversation created in TeamBox, transcript stored as system message from "Tavus"
**TeamBox visibility:** Conversation appears in Video channel (if channel exists in TeamBox)
**False-pass risk:** Tavus persona_id not matched to any agent. Webhook rejected with 400. Video session lost.
**Evidence approach:** Check TeamBox for video conversations, verify transcript from recent Tavus sessions

### UC-11: Tavus session -- popup/initiation on frontend
**Provider action:** `POST /api/tavus/conversations` creates session, returns `conversation_url`
**Nexxus-side outcome:** Frontend opens Tavus embed/popup for visitor
**False-pass risk:** Session created on Tavus but frontend fails to render embed. Visitor sees nothing.
**Evidence approach:** Navigate to dealership page with Tavus widget, verify popup initiates

---

## Resend (Email)

### UC-12: Campaign email send truth
**Provider action:** `resend_send_email` via central-mcp sends email
**Nexxus-side outcome:** Outbound log entry with status "sent"
**False-pass risk:** Resend accepts the API call but email bounces (invalid address, domain block). Nexxus logs "sent" without delivery status.
**Evidence approach:** Check outbound_log for email sends, note absence of delivery/bounce callback

### UC-13: Lead notification email -- admin receipt
**Provider action:** `sendLeadNotificationEmail()` resolves recipients and sends per-admin
**Nexxus-side outcome:** HTML email with call/video details, transcript, recording link
**False-pass risk:** Recipient hierarchy resolution incomplete (partner_id not set, additional_org_ids empty). Some admins never receive notifications.
**Evidence approach:** Check outbound_log for notification entries, verify recipient count against expected admin count

---

## VIN Solutions (CRM)

### UC-14: VIN lead from VAPI call -- end-to-end
**Provider action:** vin-safe-mcp prepare -> execute -> verify
**Nexxus-side outcome:** Contact + lead in VIN Solutions, verification status logged
**False-pass risk:** Lead created but assigned to wrong user. Verification returns VERIFIED_CORRECT but actual VIN Solutions UI shows different assignment.
**Evidence approach:** Check escalation tasks, check activity logs for `vapi_call_received` with `vinLeadCreated: true`

---

## Summary

| Provider | Use Cases | Send/Write | Receive/Read | False-Pass Risk |
|----------|-----------|------------|--------------|-----------------|
| TextMagic | UC-01 to UC-04 | UC-01 | UC-02 to UC-04 | MEDIUM -- no delivery confirmation |
| VAPI | UC-05 to UC-09 | (outbound calls) | UC-05 to UC-09 | HIGH -- transcript format, dedup, count accuracy |
| Tavus | UC-10 to UC-11 | UC-11 | UC-10 | MEDIUM -- persona resolution |
| Resend | UC-12 to UC-13 | UC-12 to UC-13 | (no inbound) | MEDIUM -- no bounce tracking |
| VIN Solutions | UC-14 | UC-14 | (reads via central-mcp) | HIGH -- assignment verification |
| **Total** | **14** | | | |
