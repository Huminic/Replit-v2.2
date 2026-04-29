# Communications Test Plan — Interactive & Autonomous
**Date:** 2026-03-26
**Source:** Operator directive

---

## Test Modes

### Interactive
Human triggers communication through the UI. Uses operator's real email and phone number. Requires operator participation.

### Autonomous
System-to-system testing without human involvement. Uses test infrastructure below. Verifiable via logs, API responses, and Playwright MCP.

---

## Test Infrastructure

### VAPI (Voice)
- **Test assistant:** elliott.ts script in ../nexxus (verify exact filename)
- **Capability:** Has a phone number assigned. Can make outbound calls, test flows, hooks.
- **Autonomous approach:** Program elliott to call other VAPI agents, simulate inbound voice conversations. Tests incoming voice flows + outbound call triggers.
- **Keys:** API key and secret key have different functions (secret for server-side, API for client-side)
- **Note:** Currently NO lookups from VAPI to our system — using built-in VAPI prompt only
- **Pending:** May need second video agent per dealership for service. Operator will configure phone numbers. Service persona name exists for Serra.

### TextMagic (SMS)
- **Numbers:** 3 phone numbers in TextMagic account
  - 1 not authorized to send
  - 2 can receive (for testing inbound)
  - 1 can send outbound (may also receive calls — untested)
- **Autonomous approach:** Use authorized numbers for autonomous send/receive simulation
- **API:** V1 and V2 exist — need to confirm which version we use
- **Webhook:** Previously tested on Replit — successful back-and-forth conversation
- **Open question:** Single outbound number vs multiple numbers needed. Operator leans toward multiple unless we can parse inbound texts to route by context.
- **Docs:** https://www.textmagic.com/docs/api/receive-sms/

### Tavus (Video)
- **Test criteria:** MCP server shows popup asking for visitor name → if that appears, it works
- **No deep flow testing needed** — just confirm the session creation reaches the name prompt
- **Transcript testing:** Verify transcripts arrive, are parsed, and appear in TeamBox
- **Docs:** https://docs.tavus.io/api-reference/overview

### Email (Resend)
- **Outbound only** — no inbound email processing at this time
- **Sender:** noreply@huminic.ai
- **Verification:** Check Resend logs — if status shows "sent" that's sufficient
- **Future:** Inbound email handling TBD (how it will work not yet decided)

### VIN Solutions (CRM)
- **Test account:** Durran Cage (account exists for every dealer)
- **Use for:** Lead creation testing, CRM sync verification

---

## Flows to Test

### Sales

| Flow | Direction | Path | Test Method |
|---|---|---|---|
| Inbound Text | IN | Customer texts → Sales comms agent → (A) agent continues conversation OR (B) human Take Over via TeamBox | Autonomous: TextMagic test number sends inbound. Verify agent response. Then test Take Over. |
| Inbound Phone | IN | Customer calls back → VAPI agent handles conversation → parse appointment data at end | Autonomous: elliott.ts calls sales VAPI agent. Verify conversation + appointment parsing. |
| Outbound Phone | OUT | Trigger fires → outbound call to customer for follow-up (after-hours) | Autonomous: Configure trigger, verify call placed via VAPI. Test 1, 2, or 3 channel combinations. |

### Service

| Flow | Direction | Path | Test Method |
|---|---|---|---|
| Inbound Text (campaign response) | IN | Campaign recipient responds → Service agent → (A) agent continues OR (B) human Take Over | Autonomous: TextMagic test number simulates campaign reply. Verify agent + Take Over. |
| Outbound Text (campaign) | OUT | Campaign prepared → executed → recipients receive SMS → responses handled by service agent → appointment scheduling | Autonomous: Create campaign with test phone numbers, execute, verify outbound_log + agent response. |
| Outbound Phone (service) | OUT | Campaign with phone channel → outbound call | Pending: Need to decide channel configurability (email-only, text-only, phone-only, or combination). Must be configurable per campaign. |

### Cross-Cutting

| Flow | Path | Test Method |
|---|---|---|
| Trigger configuration | Triggers configured per agent — test firing | Autonomous: Set trigger, verify it fires correctly |
| Channel combination | Campaigns should support email, text, phone individually or in combination | Verify campaign channel field allows multi-select |
| Kill switch queue | Messages held when CommGate OFF → appear in TeamBox for manual send | Autonomous: Toggle CommGate OFF, attempt send, verify message queued in TeamBox |
| Tavus transcripts | Video session → transcript arrives → parsed → appears in TeamBox | Autonomous: Create Tavus session, verify transcript webhook + TeamBox entry |

### TeamBox

| Scenario | Test Method |
|---|---|
| All inbound message types appear | Verify SMS, email, voice, video, form submissions all show in TeamBox |
| Outbound responses work | Send reply from TeamBox, verify delivery via outbound_log |
| Interactive + autonomous | Must test both with operator (interactive) and without (autonomous) |

---

## Testing Tools
- **Playwright MCP:** Browser automation for UI verification
- **Playwright agents over MCP:** Granular configuration for complex flows (per operator note about new capability)
- **elliott.ts:** VAPI test agent for autonomous voice testing
- **TextMagic test numbers:** Autonomous SMS send/receive
- **Resend logs:** Email delivery verification
- **API direct calls:** For webhook simulation and flow triggering

---

## Operator Answers (2026-03-26)

1. **elliott.ts** — Found at `utilities/elliott-test.ts` in this codebase. Also `server/comms-test.ts` exists.
2. **TextMagic API version** — Operator thinks V2. Need to verify by checking central-mcp implementation.
3. **SMS numbers** — Each comms agent needs their own number. Caroline (sales) and Nancy Gaston (service) each need a dedicated number. Dealerships generally need 2 numbers (sales + service). Can't reliably separate service and sales on one number — need to verify. Focus on Serra for service testing.
4. **Campaign channels** — Yes, campaigns should support any combination of channels (email, text, phone). This is a feature gap — current campaigns have a single channel field. Needs made configurable.
5. **Video for service** — NOT using video for service outbound. If added later, it would be a new inbound-only URL. Not in scope now.
