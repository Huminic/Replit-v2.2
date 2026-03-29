# Nexxus Connect v2.2 — Live Integration Testing Spec

Generated: 2026-03-16
Source: User-provided building blocks
Status: AUTHORITATIVE — this defines "done" for v2.2

---

## Definition of Done

If the metrics are right, people can log in, and these flows work — we're done with this version.

---

## External Service Inventory

### VAPI (Voice AI)
- Test assistant with phone number available
- Script: `../nexxus/elliott.ts` (or similar) — can make outbound calls
- Can program conversations between VAPI agents for testing
- API key + secret key (different functions)
- **Current state:** No lookups from VAPI to our system. Using built-in VAPI prompt.
- **Needed:** May need a second service agent per dealership (user will set up phone numbers)
- **Service persona:** Serra has a persona name for service

### TextMagic (SMS)
- 3 phone numbers configured
- Can receive messages for testing (may not be authorized to send)
- Webhook already tested during Replit era (conversation back and forth confirmed)
- API docs: https://www.textmagic.com/docs/api/receive-sms/
- **Open question:** V1 vs V2 API — unclear which we're using
- **Open question:** One number for outbound or multiple? User thinks multiple needed. Unless parsing can determine message purpose.

### Tavus (Video AI)
- Test: MCP server shows popup asking for visitor name → if that works, Tavus works
- Need to verify: transcripts arrive → parsed → appear in communication box
- API docs: https://docs.tavus.io/api-reference/overview

### Resend (Email)
- Outbound only: no-reply@huminic.ai
- Notifications only (no inbound email handling yet)
- Future: inbound email TBD

### VIN Solutions (CRM)
- Test account: "Durran Cage" for every dealer
- Used for leads during testing

---

## Flows to Test

### Sales — Inbound Text
```
Customer sends SMS
  → Communications Agent receives
  → Option 1: Agent continues conversation autonomously
  → Option 2: Staff clicks "Take Over" → human uses TeamBox to reply
```

### Sales — Inbound Phone
```
Customer calls back → reaches VAPI agent
  → Agent handles conversation via prompt
  → End of conversation parsed for appointment data
  → Appointment auto-created if detected
```

### Sales — Outbound Phone
```
Triggers configured for after-hours follow-up
  → System makes outbound call via VAPI
  → Test: trigger fires for 1, 2, or 3 channels
```

### Service — Inbound Text (Campaign Response)
```
Service campaign sends SMS to customers
  → Customer replies
  → Service Agent handles response
  → Option 1: Agent continues (sets up appointment)
  → Option 2: Staff takes over via TeamBox
```

### Service — Outbound Text (Campaign Execution)
```
Campaign prepared → Campaign executed
  → SMS sent to target list
  → Responses arrive → Service Agent works to set up appointments
```

### Service — Outbound Phone
```
Campaign or trigger initiates outbound call
  → Configurable: email only, text only, phone only, or combination
  → This channel selection must be configurable per campaign
```

### TeamBox — All Scenarios
```
All inbound messages (SMS, voice transcripts, email notifications)
  → Appear in TeamBox
  → Staff can respond via TeamBox
  → Responses go out through appropriate channel

Kill switch ON → messages held in queue → show in TeamBox for manual send
```

### Tavus — Transcript Flow
```
Video session completes
  → Transcript arrives
  → Transcript parsed
  → Content appears in communication box
```

---

## Testing Approach

### Tools Available
1. **VAPI test agent (elliott.ts)** — can make outbound calls to other VAPI agents, simulating customer conversations
2. **TextMagic API** — can trigger inbound SMS to test webhook flow
3. **MCP Playwright** — browser automation for UI verification of TeamBox, campaigns, appointments
4. **Playwright agents** — granular browser automation over MCP for complex flows

### Test Matrix

| Flow | Trigger Method | Verify In |
|------|---------------|-----------|
| Sales inbound text | TextMagic API → webhook | TeamBox (conversation appears) |
| Sales inbound phone | VAPI test agent calls dealer number | TeamBox (transcript appears), VIN (lead created) |
| Sales outbound phone | Trigger configuration | VAPI call log, TeamBox notification |
| Service campaign outbound | Campaign UI → execute | TextMagic sent count, TeamBox responses |
| Service inbound response | TextMagic API simulates reply | TeamBox (thread continues), appointment created |
| Takeover | Click button in TeamBox | Agent stops, human thread continues |
| Kill switch | Toggle in settings | TeamBox queue (messages held, not sent) |
| Tavus video | Start session on widget | Transcript in communication box |
| After-hours | Send message outside business hours | Auto-response sent, tagged for follow-up |
| Opt-out | Reply "STOP" | Future messages blocked, escalation created |

---

## Open Questions (need user decision before testing)

1. TextMagic V1 vs V2 API — which are we using?
2. Multiple outbound numbers vs single with parsing?
3. Campaign channel configuration UI — does it exist or needs building?
4. Second VAPI service agent per dealership — user setting up phone numbers
5. Outbound phone triggers — are they configured in the current codebase?
