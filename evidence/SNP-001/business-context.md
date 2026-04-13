# Nexxus Connect — Business Architecture (PERMANENT REFERENCE)

> This document exists because critical business context was lost 5 times across sessions.
> Any agent working on this project MUST read this file.

## Serra Honda — Communications Architecture

### Agents & Roles

| Agent | Role | Channels | Phone (TextMagic) | Purpose |
|-------|------|----------|-------------------|---------|
| **Caroline** | Sales Communications | voice, video, sms, chat, webchat | Sales number | Outbound sales triggers, inbound SMS, webchat persona, AI chat. She IS Serra Honda's customer-facing sales persona. |
| **Nancy Gaston** | Service Communications | sms, chat | Service number | Outbound service campaigns, service SMS. She handles all service-side customer comms. |

### Phone Number Assignments

| Number | Type | Assigned To | Purpose |
|--------|------|------------|---------|
| +1 (901) 203-8267 | VAPI Voice | Caroline (Serra Honda) | Inbound/outbound voice calls |
| +1-833-893-5694 | TextMagic SMS | Caroline (Serra Honda Sales) | Outbound sales SMS triggers |
| +1-833-978-5374 | TextMagic SMS | Nancy Gaston (Serra Honda Service) | Outbound service campaigns + service SMS |
| +1-855-395-5571 | TextMagic SMS | Serra Nissan | (future) |
| +1-833-391-0294 | TextMagic SMS | Tony Serra Ford | (future) |

### Other Stores
- Each store gets a VAPI voice number attached to their communications agent
- Only Serra Honda has dedicated TextMagic SMS numbers for now
- No other stores have service campaigns yet

### Widgets (All Must Work)
1. **Voice Call Widget** — triggers outbound call to customer via VAPI
2. **Video Widget** — Tavus video session
3. **Webchat Widget** — Caroline persona, shows names of all other comms agents
4. **Form Widget** — lead capture form

### Trigger Architecture (Sales — Caroline)
- **New Lead Follow-Up**: VIN new lead → delay → SMS to customer
- **After-Hours**: Immediate SMS response when lead arrives outside business hours
- **24h Standard Follow-Up**: Separate message template, fires 24h after lead
- **Outbound Phone Triggers**: Different scripts from inbound VAPI scripts
- **Outbound Email Triggers**: Via Resend

### Campaign Architecture (Service — Nancy Gaston)
- CSV upload → recipients → outbound SMS via service number
- Responses route back to TeamBox
- Service campaigns only for now — sales campaigns come later

### Data Flow
```
VIN Solutions (new lead) → warehouse_leads → trigger engine (15 min) → Caroline sends SMS
Customer replies → TextMagic webhook → TeamBox conversation → Nancy/Caroline handles
Inbound VAPI call → webhook → VIN lead creation → conversation + transcript
Campaign CSV → execute → TextMagic sends → responses → TeamBox
```

### Testing
- Use operator's phone numbers and email as outbound destinations on dev
- Clear all queued/blocked messages before testing fresh
