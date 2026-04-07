# Operator Test Context — WAVE-PE3

## Operator Contact Info (authorized for testing)
- Phone 1: 412-654-6500
- Phone 2: 412-657-4001
- Email 1: duanekwells@gmail.com
- Email 2: neoweaver@gmail.com

## Test Philosophy
- Interactive tests: use operator's phone/email, operator verifies receipt
- Autonomous tests: use provider APIs, scripts, and MCP to simulate customer throughput without human help
- Both types run together

## Critical Demo Flows

### Service Campaign (highest priority)
1. Create campaign with CSV containing operator phone numbers
2. Execute campaign (SMS via Nancy Gaston +18339785374)
3. Operator responds from their phone
4. Service agent handles reply OR human takeover via TeamBox
5. Verify full loop: send → receive → TeamBox thread → reply

### Sales Inbound/Outbound
- Inbound Text: Customer texts → Caroline → agent continues OR human takeover via TeamBox
- Inbound Phone: Customer calls VAPI → conversation → parse appointment data
- Outbound Phone: Triggers send follow-up calls after hours

### VAPI Testing
- elliott.ts script in ../nexxus (or similar) — programmable test agent
- Can make calls to other VAPI agents to test inbound flows
- Can test outbound call triggers
- Has its own phone number and assistant config
- Use API secret key + docs

### TextMagic
- 3 phone numbers, 2 can receive for testing
- 1 authorized to send, 1 receives only
- Can use for autonomous texting simulation
- V1 and V2 API — check which we use
- Webhook already tested on Replit

### Tavus
- Test only needs: MCP server shows popup asking for video chat participant name
- If popup appears, it works

### Email (Resend)
- Outbound only, no inbound replies yet
- From: no-reply@huminic.ai
- Check Resend logs — if "sent" status, that's sufficient

### VIN Solutions
- Test account: Durran Cage (exists at every dealer)
- Used for lead creation testing

## TeamBox
- All inbound messages and outbound responses must be verified in TeamBox
- Queue messages show when kill switch is on (manual send mode)
