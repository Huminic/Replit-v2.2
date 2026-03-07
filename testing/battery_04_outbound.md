# BATTERY 4 — OUTBOUND TRIGGERS: 15-MIN IDLE, TEXTMAGIC 2-WAY, VAPI CALLS
## v2.0 — Gap-First Edition | LIVE OUTBOUND COMMUNICATIONS

---

## CONTEXT RESET
Load only: This prompt + Master Coordinator v2.0 + Battery 2 Handoff Report.
Battery 4 runs IN PARALLEL with Battery 3. No B3 dependency.

---

## ⚠️ LIVE OUTBOUND COMMUNICATIONS ACTIVE
412.654.6500 WILL receive:
- TextMagic 2-way SMS (outbound initiated by AI)
- VAPI outbound voice calls
- Tavus video links via SMS or email
Tester must be AVAILABLE TO RESPOND for 2-way test validation.

---

## GAP-FIRST REMINDER
Outbound triggers are the most fragile part of the system. The 15-minute idle trigger
alone touches VinSolutions webhook, the platform trigger engine, TextMagic API, and VAPI
in sequence. Any of these three seams can break independently. Plan for all three to have
issues. Test each leg of the chain separately before testing the full sequence.

---

## TEST CONTACT
```
Name:    Duane Wells
Email:   duanewells@icloud.com | duanekwells@gmail.com
Phone:   412.654.6500
VinSol:  Durran Cage account | Salesperson: Duane Wells
Persona: [Canonical name from B1 handoff]
```

---

## PRE-TEST CRM SEEDING

Create the following SEPARATE test records (do NOT use B3 records):

**Record B4-A — Status Trigger Test:**
```
Name: Duane Wells | Email: duanewells@icloud.com | Phone: 412.654.6500
VinSolutions Account: Durran Cage | Salesperson: Duane Wells
Status: Prospect (status BEFORE the trigger status)
Source: B4-Status-Trigger-Test | Created: Now
```

**Record B4-B — 15-Minute Idle Trigger Test:**
```
Same contact data as B4-A
Status: New Lead
Last Activity: Set to NOW (idle clock starts)
Source: B4-15Min-Trigger-Test
```

**Record B4-C — 2-Way Conversation Tests (fresh per channel):**
Create a fresh record for each 2-way channel test. Document all record IDs.

---

## SECTION 4A: 15-MINUTE IDLE TRIGGER — HIGHEST PRIORITY TEST

This is the most critical trigger in the system. Test it FIRST in Battery 4.

### TC-4A-001: 15-Minute Idle → TextMagic SMS Fire
**Action:** Ensure Record B4-B exists in VinSolutions with Status = "New Lead"
and no follow-up activity. Start a 15-minute timer.
**Expected within 15-20 minutes of lead insertion:**
  - TextMagic SMS fires to 412.654.6500
  - Message references the lead context (not generic)
  - Message is from "Caroline" (or canonical name)
  - CRM record updated: Outbound SMS attempt logged, timestamp
**Pass Criteria:** TextMagic SMS received within 20 minutes of lead creation
**Failure Severity:** P0 if no SMS fires within 30 minutes
**Gap Ticket:** GAP-B4-IDLE-001 if trigger does not fire
**EVIDENCE REQUIRED:**
  □ Screenshot of SMS received at 412.654.6500
  □ TextMagic log showing the send event
  □ Platform trigger log showing trigger activation
  □ VinSolutions record showing the touchpoint logged

### TC-4A-002: 15-Minute Idle → VAPI Outbound Call Fire
**Action:** After the idle trigger fires (or in the same idle window), confirm the
VAPI outbound call also fires. Both TextMagic SMS AND VAPI call should fire.
**Expected:**
  - VAPI outbound call placed to 412.654.6500 within the trigger window
  - If both fire simultaneously: SMS arrives AND call rings
  - If sequential: document the sequence order
  - Call is from "Caroline" (canonical name)
**Pass Criteria:** VAPI call received at 412.654.6500 (answer it for full test)
**Failure Severity:**
  - P0 if only one of the two fires (both SMS and call are required)
  - P1 if fires but wrong persona name
**EVIDENCE REQUIRED:**
  □ Call log showing call to 412.654.6500
  □ Screenshot of answered call on device
  □ VinSolutions record showing call logged

### TC-4A-003: 15-Minute Idle → Deduplication (No Re-Fire While Conversation Active)
**Action:** After the idle trigger fires and you REPLY to the TextMagic SMS:
  Reply: "Hi Caroline, yes I'm interested in learning more"
**Expected:**
  - AI responds to the reply (2-way conversation begins)
  - NO additional automated idle trigger fires
  - Sequence shows "Engaged" or equivalent status
  - VinSolutions status updated from "New Lead" → "Contacted" or "Replied"
**Pass Criteria:** Trigger suppressed after reply, 2-way conversation active, VinSolutions updated
**Failure Severity:** P0 if automated messages continue after reply (spam)
**EVIDENCE REQUIRED:**
  □ Screenshot of 2-way SMS exchange
  □ VinSolutions record showing status update

---

## SECTION 4B: TEXTMAGIC 2-WAY SMS — FULL OUTBOUND SEQUENCE

### TC-4B-001: Status Change → TextMagic Outbound SMS
**Action:** On Record B4-A, change VinSolutions status to the trigger value
(e.g., "New Lead" or platform-specific trigger status).
**Expected within 5 minutes:**
  - TextMagic SMS sent to 412.654.6500
  - Message is personalized (contains name reference)
  - VinSolutions record updated: SMS sent, timestamp
**Pass Criteria:** SMS received within 5 min, personalized, VinSolutions updated
**Failure Severity:** P0 if no SMS in 15 minutes
**EVIDENCE REQUIRED:** SMS screenshot + TextMagic log

### TC-4B-002: 2-Way SMS — Positive Reply Handling
**Action:** Reply to outbound SMS:
```
"Hi, yes I'm interested. Can you tell me more about pricing?"
```
**Expected within 60 seconds:**
  - AI acknowledges reply
  - Responds with relevant next step (not a repeat of first message)
  - Offers to book a call OR answer the question conversationally
  - VinSolutions status updated: "Replied"
**Pass Criteria:** Response received, contextually relevant, VinSolutions updated
**Failure Severity:** P1 if AI repeats first message verbatim
**EVIDENCE REQUIRED:**
  □ Screenshot of full 2-way SMS exchange
  □ VinSolutions record showing "Replied" status and conversation log

### TC-4B-003: 2-Way SMS → VinSolutions Conversation Log
**Action:** After 3+ exchanges, check VinSolutions record.
**Verify:**
  □ Every message logged (inbound and outbound) with direction + timestamp
  □ Status reflects actual conversation outcome
  □ Agent name shown in log = canonical name
**Pass Criteria:** Complete conversation log in VinSolutions
**Failure Severity:** P1 if conversation not logged

### TC-4B-004: Opt-Out Handling — TextMagic
**Setup:** Fresh record B4-C.
**Action:** Trigger outbound SMS, then reply:
```
"Please remove me from your list"
```
**Expected:**
  - AI acknowledges opt-out immediately
  - NO further TextMagic SMS sent after opt-out
  - VinSolutions status = "Opted Out" or "Do Not Contact"
  - Opt-out logged with timestamp
**Pass Criteria:** No further SMS, status updated correctly
**Failure Severity:** P0 if any SMS sent after opt-out (compliance violation)

### TC-4B-005: SMS Max Retry Limit
**Action:** Trigger outbound SMS sequence. Do NOT reply.
Monitor how many messages are sent before the sequence stops.
**Expected:**
  - Sequence sends ≤ configured max (document what that max is)
  - After max: VinSolutions status = "Unreachable" or equivalent
  - No further messages without manual re-trigger
**Pass Criteria:** Sequence stops at max, VinSolutions updated
**Failure Severity:** P0 if sequence continues indefinitely

---

## SECTION 4C: VAPI OUTBOUND CALLS

**ENSURE 412.654.6500 IS AVAILABLE TO ANSWER.**

### TC-4C-001: CRM Status → VAPI Outbound Call
**Action:** Change VinSolutions status on fresh record to trigger value.
**Expected within 10 minutes:**
  - VAPI call placed to 412.654.6500
  - AI opens with canonical name + company name
  - Context-aware opening (not a cold script)
**Pass Criteria:** Call received, correct persona, context-aware
**Failure Severity:** P0 if no call in 30 minutes
**EVIDENCE REQUIRED:**
  □ Screenshot of incoming call display
  □ Call log from VAPI
  □ VinSolutions record showing call event

### TC-4C-002: Outbound Call → 2-Way Conversation
**Action:** During call: "Yes, I remember — I was interested in the automation features. What's the next step?"
**Expected:**
  - AI recognizes warm lead context
  - Describes next step clearly
  - Books appointment OR explains process
  - No silence > 3 seconds
**Pass Criteria:** Context-aware response, next step described, natural flow

### TC-4C-003: Outbound Call → Appointment + VinSolutions Update
**Action:** Agree to book: "Sure, let's schedule something."
**Expected:**
  - AI reads real available slots
  - Appointment confirmed verbally
  - Post-call: calendar entry created
  - VinSolutions updated: appointment reference, disposition = "Appointment Booked"
  - Confirmation TextMagic SMS to 412.654.6500
  - Confirmation email to BOTH inboxes
**Pass Criteria:** Appointment in calendar, VinSolutions updated, confirmations sent
**EVIDENCE REQUIRED:** Screenshots as previous sections

### TC-4C-004: Voicemail Handling
**Action:** Trigger outbound call. Do NOT answer. Let it go to voicemail.
**Expected:**
  - AI leaves a coherent, professional voicemail
  - Voicemail mentions callback number
  - VinSolutions logged: "Voicemail Left" + timestamp
  - Follow-up TextMagic SMS sent within 10 minutes of voicemail
**Pass Criteria:** Voicemail coherent, VinSolutions logged, follow-up SMS sent
**EVIDENCE REQUIRED:**
  □ Voicemail transcript or recording reference
  □ Follow-up SMS screenshot

---

## SECTION 4D: TAVUS VIDEO OUTBOUND TRIGGER

### TC-4D-001: Status Change → Tavus Video Send
**Action:** Change VinSolutions status on fresh record to video trigger value.
**Expected within 10 minutes:**
  - Tavus video generated and delivered via TextMagic SMS link OR email
  - Video link received at 412.654.6500 OR duanewells@icloud.com
  - Video content shows canonical persona (Caroline or confirmed name)
  - VinSolutions record updated: "Video Sent"
**Pass Criteria:** Video link received, persona correct, VinSolutions updated
**Failure Severity:** P0 if video not delivered in 30 minutes

### TC-4D-002: Video Link Engagement → VinSolutions Update
**Action:** Open the video link. Click the CTA.
**Expected:**
  - Click event captured
  - VinSolutions updated: "Video Viewed" + "CTA Clicked" + timestamp
  - If CTA opens form/chat: that interaction continues correctly
**Pass Criteria:** Engagement tracked, VinSolutions updated

---

## SECTION 4E: CHANNEL ESCALATION SEQUENCES

### TC-4E-001: No SMS Reply → Escalate to VAPI Call
**Action:** Trigger outbound TextMagic SMS (TC-4B-001). Do NOT reply.
Wait for configured interval (or simulate time elapsed).
**Expected:**
  - After unreplied SMS attempts, platform escalates to VAPI outbound call
  - Call references prior SMS: "I tried reaching you by text..."
  - Full sequence logged in VinSolutions
**Pass Criteria:** Call fires, references SMS, sequence in VinSolutions
**Failure Severity:** P2 if not configured, P1 if configured but not firing

### TC-4E-002: Re-Engagement After Reply Mid-Sequence
**Action:** While an automated follow-up sequence is active, reply to one of the messages.
**Expected:**
  - Entire sequence STOPS firing immediately
  - AI handles the reply as a live 2-way conversation
  - VinSolutions status = "Replied/Engaged"
  - No further automated touches while conversation is active
**Pass Criteria:** Sequence halted, live conversation active, no automation overlap
**Failure Severity:** P0 if sequence continues during live conversation

---

## BATTERY 4 ACCEPTANCE CRITERIA

| Scenario | Must-Pass (P0) | Should-Pass (P1) |
|----------|---------------|-----------------|
| 15-min idle → TextMagic SMS fires | ✓ | |
| 15-min idle → VAPI call fires | ✓ | |
| Both channels fire from idle trigger | | ✓ |
| Opt-out stops all SMS immediately | ✓ | |
| Active reply halts sequence | ✓ | |
| SMS max retry stops sequence | ✓ | |
| VinSolutions logs all touchpoints | | ✓ |
| Email to BOTH inboxes per test | | ✓ |

---

## BATTERY 4 COMPLETION INSTRUCTIONS

**Reporter Agent:** Produce Handoff Report v2.0.
INCLUDE:
- 15-min idle trigger: DID IT FIRE Y/N (both TextMagic AND VAPI)
- TextMagic 2-way: quality score per exchange (1-5)
- VinSolutions conversation log accuracy per channel
- Compliance check: opt-out honored Y/N, max retry respected Y/N
- Email evidence table (both inboxes)
- All new gap IDs → update release_criteria.md

Tag all B4 records as "B4-Test" in VinSolutions. Do NOT delete before B6.

Battery 4 runs in PARALLEL with Battery 3.
Coordinator gates B5 on BOTH B3 AND B4 passing with no P0.
