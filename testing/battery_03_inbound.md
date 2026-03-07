# BATTERY 3 — INBOUND WORKFLOWS + VINSOLUTIONS + TEXTMAGIC EVIDENCE
## v2.0 — Gap-First Edition | LIVE COMMUNICATIONS

---

## CONTEXT RESET
Load only: This prompt + Master Coordinator v2.0 + Battery 2 Handoff Report.

---

## ⚠️ LIVE COMMUNICATIONS ACTIVE IN THIS BATTERY
Duane Wells (412.654.6500 / duanewells@icloud.com) WILL receive:
- Live SMS messages from TextMagic API
- Live voice calls via VAPI
- Live emails to BOTH inboxes
Ensure 412.654.6500 is AVAILABLE and MONITORED before starting.

---

## GAP-FIRST REMINDER
Inbound workflows touch every integration seam simultaneously. VinSolutions insertion,
TextMagic 2-way, VAPI transcript, email routing — any of these can fail independently.
Anticipate that at least 2 of the 4 inbound channels will have issues. Find them, log them,
keep going with channels that work.

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

## PRE-SECTION SETUP (Required Before Each Section)
- Clear or archive any test CRM/VinSolutions records from B2
- Note the start timestamp for each section
- Have VinSolutions and platform CRM open in separate tabs
- Confirm TextMagic send log is accessible for evidence capture
- Confirm both email inboxes are accessible

---

## SECTION 3A: SMS INBOUND VIA TEXTMAGIC

### TC-3A-001: Cold Inbound SMS → TextMagic → AI Response
**Action:** From 412.654.6500, send to the platform's TextMagic number:
```
"Hi, I saw your ad. I'm interested in learning more about what you offer."
```
**Expected within 60 seconds:**
  - AI (canonical name — Caroline or confirmed name) responds via TextMagic
  - Response is personalized, not a generic error
  - Response includes a qualifying question
**Pass Criteria:** Response received via TextMagic within 60 sec, relevant
**Failure Severity:** P0 if no response in 5 minutes
**EVIDENCE REQUIRED:**
  □ Screenshot of SMS received at 412.654.6500 showing AI response
  □ TextMagic delivery log confirming the send

### TC-3A-002: SMS → VinSolutions Lead Insertion
**Action:** Continue conversation. Provide:
```
"My name is Duane Wells, email is duanewells@icloud.com"
```
**Expected within 2 minutes:**
  - VinSolutions lead record created:
    - Name: Duane Wells
    - Phone: 412.654.6500
    - Email: duanewells@icloud.com
    - Salesperson: Duane Wells
    - Account: Durran Cage
    - Source: SMS Inbound
    - Status: New Lead
    - Conversation summary in lead notes
  - Notification email → duanewells@icloud.com AND duanekwells@gmail.com
**Pass Criteria:** VinSolutions record correct, both emails received
**Failure Severity:** P0 if no VinSolutions record, P1 if salesperson or source wrong
**EVIDENCE REQUIRED:**
  □ Screenshot of VinSolutions lead record (full fields visible)
  □ Screenshot of duanewells@icloud.com email
  □ Screenshot of duanekwells@gmail.com email

### TC-3A-003: 2-Way SMS Conversation Quality
**Action:** Continue the conversation with 3 additional exchanges.
Test AI resilience with: "How does your system handle data privacy?"
**Expected:**
  - AI does not hallucinate compliance certifications
  - Conversation continues naturally (doesn't dead-end)
  - TextMagic delivers each message promptly
**Pass Criteria:** No hallucination, conversation continues, TextMagic reliable
**Failure Severity:** P1 if AI makes false compliance claims

### TC-3A-004: SMS → Appointment Booking
**Action:** Reply: "Yes, I'd like to schedule a call. What times are available?"
**Expected:**
  - AI presents real future time slots (not hardcoded)
  - Select a slot: "The first option works"
  - Appointment created in calendar
  - Confirmation SMS to 412.654.6500 via TextMagic
  - Confirmation email to BOTH inboxes
  - VinSolutions lead updated with appointment reference
**Pass Criteria:** Appointment created, all confirmations sent, VinSolutions updated
**Failure Severity:** P0 if appointment not created
**EVIDENCE REQUIRED:**
  □ Screenshot of confirmation SMS at 412.654.6500
  □ Screenshot of confirmation email (both inboxes)
  □ Screenshot of VinSolutions lead with appointment noted

---

## SECTION 3B: TAVUS VIDEO INBOUND → VINSOLUTIONS

### TC-3B-001: Video Widget Interaction → VinSolutions Lead
**Action:** Load Tavus video widget from landing page. Play video. Click primary CTA.
**Expected:**
  - CTA interaction captured as lead event
  - VinSolutions lead initiated in Durran Cage account
  - Salesperson: Duane Wells
  - Source: Tavus Video
**Pass Criteria:** VinSolutions lead created on CTA click
**Failure Severity:** P1 if no lead event created

### TC-3B-002: Video → Chat Handoff → VinSolutions Update
**Action:** If CTA opens chatbot, complete lead capture:
  Duane Wells / duanewells@icloud.com / 412.654.6500
**Expected:**
  - Single VinSolutions record with BOTH video interaction and chat interaction logged
  - Source attribution preserved: Tavus Video → Chat
  - Emails sent to both inboxes
**Pass Criteria:** One record, dual source, both emails
**Failure Severity:** P1 if two separate records created

### TC-3B-003: Video → Appointment → VinSolutions
**Action:** Use booking CTA if available. Select time slot. Confirm.
**Expected:**
  - Appointment in platform calendar
  - VinSolutions lead updated
  - Confirmation to duanewells@icloud.com AND duanekwells@gmail.com
**EVIDENCE REQUIRED:** Same as TC-3A-004

---

## SECTION 3C: VAPI VOICE INBOUND → VINSOLUTIONS

**ENSURE 412.654.6500 IS AVAILABLE TO RECEIVE AND MAKE CALLS.**

### TC-3C-001: Inbound Voice Call → VAPI → AI Response
**Action:** Call the platform's VAPI number from 412.654.6500.
Say: "Hi, this is Duane, I saw your ad online and wanted to learn more."
**Expected:**
  - Call answered within 3 rings by AI (canonical name — Caroline or confirmed)
  - AI greets with correct company name
  - Qualifying conversation begins
**Pass Criteria:** Answered in 3 rings, correct persona, conversation flows
**Failure Severity:** P0 if no answer within 5 rings

### TC-3C-002: Voice → VinSolutions Lead Insertion
**Action:** During call: "My name is Duane Wells, you can reach me at duanewells@icloud.com"
**Expected within 5 minutes of call end:**
  - VinSolutions lead created:
    - Name: Duane Wells
    - Phone: 412.654.6500 (from caller ID)
    - Email: duanewells@icloud.com (from conversation)
    - Salesperson: Duane Wells
    - Account: Durran Cage
    - Source: VAPI Inbound Voice
    - Call transcript or summary in lead notes
  - Notification email to BOTH inboxes
**Pass Criteria:** VinSolutions record complete, both emails
**Failure Severity:** P0 if no VinSolutions record
**EVIDENCE REQUIRED:**
  □ Screenshot of VinSolutions record with transcript/notes
  □ Both email screenshots

### TC-3C-003: Voice → Appointment Booking During Call
**Action:** During call: "Can I schedule a consultation call?"
**Expected:**
  - AI reads real calendar slots
  - Appointment booked verbally
  - Post-call: confirmation SMS to 412.654.6500 via TextMagic
  - Confirmation email to BOTH inboxes
  - Appointment in calendar, linked to VinSolutions record
**Pass Criteria:** All confirmations delivered, calendar entry linked
**EVIDENCE REQUIRED:** Same as TC-3A-004

---

## SECTION 3D: FORM INBOUND → VINSOLUTIONS

### TC-3D-001: Form Submission → VinSolutions Lead
**Action:** Submit form on landing page with:
  - Name: Duane Wells
  - Email: duanewells@icloud.com
  - Phone: 412.654.6500
  - Message: "Interested in automating my sales follow-up process"
**Expected:**
  - Success message displayed
  - VinSolutions lead created (Durran Cage, Duane Wells salesperson)
  - Confirmation to duanewells@icloud.com AND duanekwells@gmail.com
**Pass Criteria:** VinSolutions lead correct, both emails
**Failure Severity:** P0 if VinSolutions not created
**EVIDENCE REQUIRED:** Screenshots as above

### TC-3D-002: Form → 15-Minute Idle Trigger Watch
**Action:** After form submission and VinSolutions lead creation, monitor.
**IF 15-min idle trigger is configured:**
  - After 15 minutes with no follow-up activity on the lead:
    - TextMagic SMS fires to 412.654.6500
    - VAPI outbound call fires to 412.654.6500
    - OR: both fire simultaneously per configuration
**Expected:** Both triggers fire within the 15-minute window (+5 min tolerance)
**Pass Criteria:** At least one of the two triggers fires
**Failure Severity:**
  - P1 if neither fires (trigger may not be configured — log as anticipated gap)
  - P0 if trigger fires more than 3 times without reply (spam)
**Note:** If trigger does not fire here, it will be explicitly tested in Battery 4.

---

## SECTION 3E: CROSS-CHANNEL CRM VALIDATION

### TC-3E-001: VinSolutions Record Audit — All Inbound Tests
**Action:** Search VinSolutions (Durran Cage account) for leads created this session.
**Verify for each record:**
  □ Salesperson = Duane Wells (EVERY record)
  □ Source correctly identifies channel (SMS / VAPI / Tavus / Form)
  □ All records linked to same contact (Duane Wells / 412.654.6500)
  □ No orphaned/duplicate records without channel source
  □ Conversation notes/transcripts present
**Pass Criteria:** All records show Duane Wells as salesperson, correct source
**Failure Severity:** P0 if any record has wrong/missing salesperson

### TC-3E-002: Email Evidence Audit — Both Inboxes
**Action:** Check both email inboxes for all confirmation emails sent during B3.
**Document per test:**
  | Test | duanewells@icloud.com | duanekwells@gmail.com |
  |------|-----------------------|-----------------------|
  | TC-3A-002 | Received Y/N | Received Y/N |
  | TC-3A-004 | Received Y/N | Received Y/N |
  | TC-3B-003 | Received Y/N | Received Y/N |
  | TC-3C-002 | Received Y/N | Received Y/N |
  | TC-3D-001 | Received Y/N | Received Y/N |
**Pass Criteria:** duanewells@icloud.com: 5/5. duanekwells@gmail.com: 5/5 (or document gaps)
**Failure Severity:** P1 if duanekwells@gmail.com receives none

---

## BATTERY 3 ACCEPTANCE CRITERIA

| Scenario | Must-Pass (P0) | Should-Pass (P1) |
|----------|---------------|-----------------|
| SMS inbound → VinSolutions record | ✓ | |
| Voice inbound → VinSolutions record | ✓ | |
| Form → VinSolutions record | ✓ | |
| All records show Duane Wells salesperson | ✓ | |
| TextMagic 2-way SMS confirmed | ✓ | |
| Any inbound → appointment created | ✓ | |
| duanewells@icloud.com receives confirmations | | ✓ |
| duanekwells@gmail.com receives confirmations | | ✓ |

---

## BATTERY 3 COMPLETION INSTRUCTIONS

**Reporter Agent:** Produce Handoff Report v2.0.
INCLUDE:
- VinSolutions record count and salesperson verification per channel
- TextMagic 2-way SMS: confirmed working Y/N
- Email evidence table (both inboxes)
- 15-min idle trigger: observed Y/N (if not, note B4 will explicitly test)
- Appointments created: list with IDs for B5 use
- All new gap IDs → update release_criteria.md

DO NOT delete B3 records. B5 needs them. Notify Coordinator of all appointment IDs.

Battery 3 runs in PARALLEL with Battery 4.
Master Coordinator gates B5 when BOTH B3 AND B4 pass (no P0 failures).
