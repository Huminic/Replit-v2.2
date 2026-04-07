# Communications Workflow Eval Plan — WAVE-PE3

**Purpose:** Verify every customer-facing message, every reply flow, every handoff — not just API status codes.

---

## Eval 1: Service Campaign Full Loop

### 1A. Verify outbound message content
- Check the 2 SMS sent to operator phones — what EXACTLY did they say?
- Compare against the documented template: "Hi {{firstName}}, this is Nancy from Serra Honda Service..."
- Are merge fields resolved correctly? (Duane, not {{firstName}})
- Is the phone number in the message correct? ((833) 978-5374 = Nancy's number)

### 1B. Operator replies to campaign SMS
- Operator texts back "YES" from their phone
- Verify: does the inbound webhook fire?
- Verify: does a conversation appear in TeamBox?
- Verify: does the service agent (Nancy) respond?
- Verify: is the agent response appropriate?
- Screenshot TeamBox showing the thread

### 1C. Human takeover from TeamBox
- In TeamBox, select the campaign conversation
- Click the takeover/reply button
- Type a manual reply
- Verify: does the reply deliver to the operator's phone?
- Screenshot the full thread with both agent and human messages

---

## Eval 2: Sales Lead Follow-Up Trigger

### 2A. Verify trigger message template
- Query outbound_log for recent Caroline follow-up SMS
- Read the actual message content
- Compare against documented template: "Hi {customerFirstName}, this is {agentName} from {dealerStoreName}..."
- Are single-brace merge fields resolved? (not {customerFirstName} literally)
- Is the message appropriate for a cold follow-up?

### 2B. Verify trigger fires correctly
- Check: when did the last trigger fire?
- Check: which leads triggered it?
- Check: did it respect business hours? (blocked before 8AM ET, sent after)

---

## Eval 3: Auto-Greeting (Inbound SMS)

### 3A. Simulate inbound SMS
- Send an SMS TO Caroline's number (+18338935694) from a TextMagic test number
- Verify: auto-greeting fires
- Verify: message content matches template
- Verify: conversation appears in TeamBox
- Check: does it say "Hi [phone number]!" (no name on first contact) or something better?

### 3B. After-hours behavior
- Check: is after-hours response configured for Caroline?
- If yes: what does it say?
- If no: document the gap

---

## Eval 4: VAPI Voice → Downstream

### 4A. Verify transcript content
- Read the actual transcript from the Elliott→Caroline call
- Is it coherent? Does Caroline sound right?
- Note: greeting says "Sarah Automotive" — is this a blocker for demo?

### 4B. Verify VIN lead creation
- Check the VIN lead created by the call
- Is it assigned correctly? (Durran Cage)
- Does it have the right vehicle/appointment data from the transcript?

### 4C. Verify notification email
- Check what the lead notification email actually says
- Is it going to real admin addresses or seed addresses?
- Read the email content — is it useful?

### 4D. Verify in TeamBox
- Is the voice conversation visible?
- Does it show the transcript?
- Can the operator see the call details?

---

## Eval 5: TeamBox Cross-Channel Verification

### 5A. All channels present
- SMS threads (Caroline sales + Nancy service)
- Voice threads (VAPI calls)
- Email threads (if any)
- Chat threads (webchat)
- Verify each has real messages, not empty shells

### 5B. Reply from each channel
- SMS: reply from TeamBox → verify delivery
- Voice: no reply (view only) — verify transcript visible
- Email: reply from TeamBox → verify in Resend logs

---

## Eval 6: Message Template Audit

For EVERY customer-facing message in the system:
- Read the actual template from code/config
- Compare against operator's documented templates
- Flag any mismatches

Templates to check:
1. Lead follow-up SMS (Caroline trigger)
2. Auto-greeting SMS (business hours)
3. Auto-greeting SMS (after hours)
4. Campaign SMS (service)
5. Welcome email (new user)
6. Invite email
7. Password reset email
8. Lead notification email (VAPI/Tavus)
9. Campaign email template

---

## Priority for Demo (3 hours)

1. **Eval 1 (Service Campaign Loop)** — CRITICAL, this is the demo flow
2. **Eval 4 (VAPI downstream)** — CRITICAL, operator needs to show voice
3. **Eval 5A (TeamBox channels)** — CRITICAL, operator needs to show comms workspace
4. **Eval 2 (Trigger messages)** — HIGH, verify templates are correct
5. **Eval 6 (Template audit)** — HIGH, catch any wrong messages before demo
6. **Eval 3 (Auto-greeting)** — MEDIUM
7. **Eval 5B (Reply from each channel)** — MEDIUM
