# BATTERY 5 — CALENDAR & APPOINTMENT INTEGRATION
## v2.0 — Gap-First Edition | VinSolutions Sync + Reminder Chains

---

## CONTEXT RESET
Load only: This prompt + Master Coordinator v2.0 + B3 Handoff + B4 Handoff.
Requires both B3 and B4 to have passed with no P0 failures.

---

## TEST CONTACT
```
Name:    Duane Wells | Email: duanewells@icloud.com | duanekwells@gmail.com | Phone: 412.654.6500
VinSol:  Durran Cage account | Salesperson: Duane Wells
```

---

## PRE-BATTERY DEPENDENCY CHECK
1. Obtain all appointment IDs created in B3 (from B3 Reporter handoff)
2. Obtain any appointments created during B4 outbound call tests
3. If ZERO appointments exist from B3: P0 condition — escalate before proceeding
4. Confirm at least ONE active future appointment in system for Duane Wells

---

## SECTION 5A: APPOINTMENT EXISTENCE & VIN SYNC

### TC-5A-001: Verify B3 Appointments Exist & Are in VinSolutions
**Action:** Open platform calendar AND VinSolutions (Durran Cage account).
**For each B3 appointment:**
  □ Appointment exists in platform calendar
  □ VinSolutions record for Duane Wells shows appointment reference
  □ Salesperson field = Duane Wells
  □ Channel source noted (SMS/Voice/Form)
  □ Confirmation was sent (check send log)
**Pass Criteria:** All B3 appointments verified in BOTH systems
**Failure Severity:** P0 if any B3 appointment missing from calendar or VinSolutions

### TC-5A-002: Manual Appointment → VinSolutions Sync
**Action:** From platform CRM, manually create appointment:
  Date: 3 days from today | Time: 10:00 AM | Agent: Lead Follow-Up Agent
**Expected:**
  - Calendar entry created
  - VinSolutions Duane Wells record updated with appointment
  - Confirmation TextMagic SMS to 412.654.6500
  - Confirmation email to BOTH inboxes
**Pass Criteria:** VinSolutions updated, both confirmations sent
**EVIDENCE REQUIRED:** VinSolutions screenshot + both email screenshots

---

## SECTION 5B: BIDIRECTIONAL SYNC — CALENDAR ↔ VINSOLUTIONS

### TC-5B-001: CRM Change → Calendar Updates
**Action:** In VinSolutions, modify TC-5A-002 appointment time: 10:00 AM → 11:00 AM
**Expected within 2 minutes:**
  - Platform calendar shows 11:00 AM
  - Reschedule TextMagic SMS to 412.654.6500 (references old + new time)
  - Reschedule email to BOTH inboxes
  - VinSolutions update log shows the change
**Pass Criteria:** Calendar updated, both notifications sent
**Failure Severity:** P0 if calendar not updated

### TC-5B-002: Calendar Change → VinSolutions Updates
**Action:** In platform calendar, modify a different appointment date.
**Expected within 2 minutes:**
  - VinSolutions record updated with new date
  - Reschedule notification sent to test contact
**Pass Criteria:** VinSolutions updated (this direction is critical)
**Failure Severity:** P0 if VinSolutions not updated (sync is broken)

---

## SECTION 5C: EDGE CASES

### TC-5C-001: Double Booking Prevention
**Action:** Attempt to book an appointment at the exact same time as an existing one.
**Expected:** Conflict warning before save, or block entirely
**Pass Criteria:** Conflict detected before save
**Failure Severity:** P1 if no warning

### TC-5C-002: Cancellation → VinSolutions + Reminder Stop
**Action:** Cancel the TC-5A-002 appointment.
**Expected:**
  - VinSolutions status = "Cancelled"
  - Cancellation TextMagic SMS to 412.654.6500
  - Cancellation email to BOTH inboxes
  - ALL automated reminders for this appointment STOP
  - Re-booking sequence triggered (if configured)
**Pass Criteria:** Status cancelled, notifications sent, reminders STOPPED
**Failure Severity:** P0 if reminders continue after cancellation

### TC-5C-003: No-Availability → AI Doesn't Hallucinate Slots
**Action:** Block all calendar slots for a day. Try to book via AI chat.
**Expected:** AI says no availability, offers next available day, does NOT invent slots
**Pass Criteria:** No fake slots, next day offered
**Failure Severity:** P0 if AI invents fake time slots

---

## SECTION 5D: STATUS TRIGGER CHAIN

### TC-5D-001: Confirmed → Confirmation Messages (Both Channels)
**Action:** Set an appointment status to "Confirmed."
**Expected within 5 min:**
  - TextMagic SMS confirmation to 412.654.6500
  - Email confirmation to BOTH inboxes
  - Both messages contain: date, time, agent name
**Pass Criteria:** Both channels receive confirmation with full details
**EVIDENCE REQUIRED:** SMS screenshot + both email screenshots

### TC-5D-002: 24-Hour Reminder (Simulated)
**Action:** Simulate 24-hour window (advance appointment to tomorrow and trigger reminder run).
**Expected:**
  - TextMagic SMS reminder to 412.654.6500
  - Message contains: date, time, agent, confirm/cancel option
**Pass Criteria:** Reminder received with all details

### TC-5D-003: No-Show → Re-Engagement
**Action:** Mark an appointment as "No Show."
**Expected:**
  - TextMagic SMS re-engagement: "We missed you today..."
  - VinSolutions status = "No Show"
  - Re-booking offer made
**Pass Criteria:** Re-engagement sent, VinSolutions updated

### TC-5D-004: Completed → Post-Meeting Follow-Up
**Action:** Mark appointment as "Completed."
**Expected:**
  - Post-meeting follow-up sent to test contact
  - VinSolutions updated to post-meeting stage
  - All active automation sequences show Completed
**Pass Criteria:** Follow-up sent, VinSolutions accurate

---

## BATTERY 5 ACCEPTANCE CRITERIA

| Scenario | Must-Pass (P0) | Should-Pass (P1) |
|----------|---------------|-----------------|
| B3 appointments in calendar AND VinSolutions | ✓ | |
| Calendar ↔ VinSolutions bidirectional sync | ✓ | |
| Cancellation stops all reminders | ✓ | |
| No fake slots when no availability | ✓ | |
| Both emails per confirmation | | ✓ |
| 24-hour reminder fires | | ✓ |
| No-show triggers re-engagement | | ✓ |

---

## BATTERY 5 COMPLETION INSTRUCTIONS

Retain at least ONE active future appointment for Battery 6 E2E use.
Update release_criteria.md with all new gap IDs.
Provide Coordinator with the specific appointment ID to use in Battery 6.
