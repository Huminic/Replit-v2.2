# BATTERY 1 — AGENT CONFIGURATION, VINSOLUTIONS WIRING & PERSONA CONSISTENCY
## v2.0 — Gap-First Edition | Claude Agent Team Test Prompt

---

## CONTEXT RESET NOTICE
Fresh context. Load only: this prompt + Master Coordinator v2.0 prompt + Pre-Flight results.

---

## GAP-FIRST OPERATING INSTRUCTION
You WILL find configuration gaps. Your job is to find them systematically, not to
hope they pass. Every failed check = a gap ticket that goes to release_criteria.md.
Do NOT soften findings. A "partial" pass on agent configuration creates downstream
P0 failures in Batteries 3 and 4. Be rigorous.

---

## TEST CONTACT
```
Name:    Duane Wells
Email:   duanewells@icloud.com  | duanekwells@gmail.com (secondary)
Phone:   412.654.6500
CRM:     VinSolutions — Durran Cage's account
Persona: Caroline (VERIFY — this may not match actual config)
```

---

## MISSION

Validate that ALL agents in ALL accounts are:
1. Present and active
2. Correctly configured with right-pane context and instructions
3. Assigned appropriate skills
4. Connected to correct triggers
5. Persona-consistent (VAPI name = Tavus name = Widget name)
6. Wired to VinSolutions correctly
7. 15-minute idle trigger is configured and connected

No live messages are sent in Battery 1.

---

## REQUIRED AGENT FORMULA — VERIFY IN EVERY ACCOUNT

For each account under test, verify ALL THREE of the following agents exist:

### Agent 1: Lead Follow-Up Agent
```
Right Pane Requirements:
  □ Context block: Account name, territory, salesperson (Duane Wells)
  □ Lead handling instructions: how to greet, qualify, and route
  □ Escalation path: when to transfer to human
  □ VinSolutions update instructions: what fields to update at each conversation stage
  □ 15-minute idle trigger: documented and active

Skills Required (verify each is assigned):
  □ CRM read (VinSolutions)
  □ CRM write (VinSolutions)
  □ SMS send/receive (TextMagic)
  □ Voice call (VAPI)
  □ Appointment booking
  □ Lead scoring/qualification
```

### Agent 2: Sales Coach Agent (Deal Closing Advice)
```
Right Pane Requirements:
  □ Coaching context: deal stages, common objections, closing frameworks
  □ Instructions: how to advise a rep who is mid-deal
  □ Access scope: CRM read-only (no write to lead records without approval)
  □ Trigger: deal stalled > configured days, OR rep manual invocation

Skills Required:
  □ CRM read
  □ Pipeline analysis
  □ Script/response generation
  □ Internal advisor mode (NOT customer-facing)
```

### Agent 3: Messaging Coach Agent (Text & Email Response)
```
Right Pane Requirements:
  □ Message analysis context: tone, urgency, intent detection
  □ Instructions: how to advise a rep on composing a text or email response
  □ Template library or response framework
  □ Trigger: inbound lead message received, OR rep flags a conversation

Skills Required:
  □ Message analysis
  □ Response recommendation generation
  □ CRM read
  □ Internal advisor mode (NOT customer-facing)
```

---

## TEST CASES — SECTION 1A: AGENT EXISTENCE & ACTIVATION

### TC-1A-001: Three-Agent Formula Verification Per Account
**Action:** Navigate to the agents dashboard for EACH account under test.
**For each account, confirm:**
  - Lead Follow-Up Agent exists and is ACTIVE
  - Sales Coach Agent exists and is ACTIVE
  - Messaging Coach Agent exists and is ACTIVE
**Pass Criteria:** 3/3 agents present and active in every account
**Failure Severity:**
  - P0 if Lead Follow-Up Agent missing in any account
  - P1 if Sales Coach or Messaging Coach missing
**Gap Ticket:** GAP-B1-001 through GAP-B1-003 if any missing

### TC-1A-002: VAPI Agent Existence & Name Verification
**Action:** Navigate to the VAPI agent configuration.
**Check:**
  - VAPI agent exists
  - VAPI agent name (the persona name, e.g., "Caroline")
  - Record the EXACT name configured
**Pass Criteria:** VAPI agent exists, name is documented
**Failure Severity:** P0 if no VAPI agent exists
**Record Value Found:** [VAPI Agent Name: ___________]

### TC-1A-003: Tavus Account Name Verification
**Action:** Navigate to the Tavus video account configuration.
**Check:**
  - Tavus account exists
  - Tavus persona/avatar name (what the video "person" is called)
  - Record the EXACT name configured
  - COMPARE to VAPI agent name from TC-1A-002
**Pass Criteria:** Tavus account exists, name documented, names compared
**Failure Severity:**
  - P0 if Tavus account does not exist
  - P0 if Tavus name DOES NOT MATCH VAPI agent name
**Gap Ticket:** GAP-B1-PERSONA-001 if names do not match

### TC-1A-004: Unified Widget Display Name Verification
**Action:** Open the Unified Widget configuration.
**Check:**
  - Widget exists
  - Response display name (what the lead sees as the "person" responding)
  - Record the EXACT name configured
  - COMPARE to VAPI agent name and Tavus persona name
**Pass Criteria:** Widget exists, display name matches VAPI and Tavus names exactly
**Failure Severity:** P0 if name does not match
**Gap Ticket:** GAP-B1-PERSONA-002 if mismatch

### TC-1A-005: Persona Name Consistency Matrix
**Action:** Complete this matrix after TC-1A-002, -003, -004:
```
PERSONA CONSISTENCY CHECK:
  VAPI Agent Name:        [___________]
  Tavus Persona Name:     [___________]
  Unified Widget Name:    [___________]
  SMS Sender Display:     [___________]
  Email Reply-From Name:  [___________]

  All five match: YES / NO
  If NO, list which do not match and create GAP-B1-PERSONA-003
```
**Pass Criteria:** All five match exactly
**Failure Severity:** P0 for any mismatch (brand consistency = non-negotiable)

---

## TEST CASES — SECTION 1B: RIGHT PANE INSTRUCTIONS & SKILLS

### TC-1B-001: Lead Follow-Up Agent Right Pane Audit
**Action:** Open each Lead Follow-Up Agent. Review right pane content.
**Checklist:**
  □ Persona definition (name, tone, company role)
  □ Objective statement (clear goal for this agent)
  □ Conversation boundaries (what NOT to discuss)
  □ Escalation path (when to hand off to human)
  □ CRM update instructions (VinSolutions — when and what to update)
  □ Appointment booking instructions
  □ 15-minute idle trigger documented in context
**Pass Criteria:** ≥ 6/7 items present
**Failure Severity:**
  - P1 if < 4 items present
  - P0 if VinSolutions update instructions completely absent
  - P0 if 15-minute idle trigger not mentioned in instructions

### TC-1B-002: Sales Coach Agent Right Pane Audit
**Action:** Open each Sales Coach Agent. Review right pane content.
**Checklist:**
  □ Coaching framework present (at least 3 closing techniques documented)
  □ Objection handling guide
  □ Deal stage definitions referenced
  □ Clear internal-only scope (NOT customer-facing — must be explicit)
  □ Trigger condition documented
**Pass Criteria:** 4/5 items present
**Failure Severity:** P1 if internal-only scope not explicit (risk of customer-facing deployment)

### TC-1B-003: Messaging Coach Agent Right Pane Audit
**Action:** Open each Messaging Coach Agent. Review right pane content.
**Checklist:**
  □ Response tone guidelines
  □ At least one example of a good response vs. poor response
  □ Urgency calibration (how to vary message urgency by lead stage)
  □ Clear internal-only scope
  □ Trigger condition documented
**Pass Criteria:** 4/5 items present

### TC-1B-004: Skills Assignment Audit — All Agents
**Action:** For each of the 3 required agents, verify skills tab/section.
**Lead Follow-Up Agent:**
  - CRM read (VinSolutions): □ Present / □ Missing
  - CRM write (VinSolutions): □ Present / □ Missing
  - SMS via TextMagic: □ Present / □ Missing
  - Voice via VAPI: □ Present / □ Missing
  - Calendar/appointment booking: □ Present / □ Missing

**Sales Coach Agent:**
  - CRM read: □ Present / □ Missing
  - Internal communication: □ Present / □ Missing

**Messaging Coach Agent:**
  - Message analysis: □ Present / □ Missing
  - CRM read: □ Present / □ Missing

**Pass Criteria:** Lead Follow-Up Agent has all 5 skills; Coach agents have relevant skills
**Failure Severity:** P0 if Lead Follow-Up Agent missing CRM write or TextMagic skill

---

## TEST CASES — SECTION 1C: TRIGGER CONFIGURATION

### TC-1C-001: 15-Minute Idle Trigger — VinSolutions Configuration
**Action:** Locate the trigger configuration for the 15-minute idle timer.
**Check:**
  □ Trigger exists: Lead in VinSolutions with status = "New Lead" + no activity for 15 minutes
  □ Trigger fires BOTH: VAPI outbound call to 412.654.6500 AND TextMagic SMS to 412.654.6500
  □ Trigger is active/enabled
  □ Deduplication rule present (doesn't re-fire if conversation is active)
  □ Max retry limit set (won't call infinitely)
  □ Business hours constraint (optional but document if absent)
**Pass Criteria:** All 5 mandatory items present
**Failure Severity:**
  - P0 if trigger doesn't exist
  - P0 if deduplication absent (will spam lead)
  - P0 if max retry not set
  - P1 if only one channel fires (should fire BOTH call and text)
**Gap Ticket:** GAP-B1-TRIGGER-001 if trigger missing or broken

### TC-1C-002: CRM Status Change Triggers
**Action:** Review all CRM status-based trigger configurations.
**Verify for each:**
  □ Trigger condition clearly defined
  □ Correct agent assigned
  □ Delay/timing rule set
  □ Deduplication rule present
  □ TextMagic is the SMS provider (not generic/unspecified)
**Pass Criteria:** All 5 items present per trigger
**Failure Severity:** P0 if TextMagic not specified (could use wrong SMS provider)

### TC-1C-003: VinSolutions Lead Insertion Triggers
**Action:** Verify what happens in the platform when a new lead is inserted in VinSolutions.
**Check:**
  □ Inbound VinSolutions lead event triggers the Lead Follow-Up Agent
  □ Lead data is pulled from VinSolutions into platform context for agent use
  □ Salesperson field (Duane Wells) is accessible to the agent
  □ 15-minute idle timer starts upon VinSolutions insertion
**Pass Criteria:** All 4 items verified
**Failure Severity:** P0 if VinSolutions insertion does not trigger Lead Follow-Up Agent

### TC-1C-004: Inbound Channel Trigger Coverage
**Action:** Verify each inbound channel has an assigned agent trigger.
**Check for each channel:**
  - SMS inbound: □ Agent assigned = [_______]
  - VAPI voice inbound: □ Agent assigned = [_______]
  - Form submission: □ Agent assigned = [_______]
  - Tavus video interaction: □ Agent assigned = [_______]
  - Chatbot inbound: □ Agent assigned = [_______]
**Pass Criteria:** All 5 channels have assigned agents
**Failure Severity:** P0 if any channel has no assigned agent

### TC-1C-005: Trigger Conflict Detection
**Action:** Review all active triggers for the test contact scenario.
**Check:**
  - No two triggers will fire simultaneously for the same contact
  - A trigger won't fire during an active conversation
  - Opt-out status is respected by all triggers
**Pass Criteria:** Zero conflict scenarios
**Failure Severity:** P0 if conflict scenario found

---

## TEST CASES — SECTION 1D: VINSOLUTIONS INTEGRATION CONFIGURATION

### TC-1D-001: VinSolutions API Connection Verification
**Action:** Open the VinSolutions integration settings in the platform.
**Check:**
  □ API credentials configured and active
  □ Target account: Durran Cage's account
  □ Default salesperson: Duane Wells
  □ Lead source mapping: VAPI → "VAPI Voice Lead", Tavus → "Tavus Video Lead"
  □ Field mapping documented (at minimum: name, email, phone, source, notes)
**Pass Criteria:** All 5 items configured
**Failure Severity:** P0 if API credentials not active or account not configured correctly

### TC-1D-002: VinSolutions Lead Field Mapping Audit
**Action:** Review the field mapping configuration for lead insertion.
**Required field mappings:**
  □ First Name → VinSolutions firstName
  □ Last Name → VinSolutions lastName
  □ Phone → VinSolutions phone
  □ Email → VinSolutions email
  □ Source → VinSolutions leadSource
  □ Notes/Transcript → VinSolutions leadNotes
  □ Salesperson → "Duane Wells"
  □ Account → Durran Cage
**Pass Criteria:** All 8 field mappings present
**Failure Severity:** P0 if phone, email, or salesperson field not mapped

### TC-1D-003: VinSolutions Dry-Run Lead Insertion
**Action:** Using the platform's integration test or API test feature (NOT live),
simulate a lead insertion to VinSolutions. If no simulation mode exists, document
this gap and proceed to Battery 3 where the live insertion will be tested.
**Expected:** Test lead appears in Durran Cage's VinSolutions account with
  salesperson = Duane Wells and all fields populated.
**Pass Criteria:** Test lead appears in VinSolutions correctly
**Failure Severity:** P0 if insertion fails or appears in wrong account

---

## BATTERY 1 ACCEPTANCE CRITERIA

| Area | Must-Pass (P0) | Should-Pass (P1) |
|------|---------------|-----------------|
| 3 agents in every account | Lead Follow-Up P0, Coaches P1 | |
| VAPI/Tavus/Widget name match | All 3 must match | |
| VinSolutions API configured | ✓ | |
| 15-min idle trigger exists | ✓ | |
| Deduplication on all triggers | ✓ | |
| All inbound channels have agents | ✓ | |

---

## BATTERY 1 COMPLETION INSTRUCTIONS

**Reporter Agent:** Produce Handoff Report v2.0 format (from Master Coordinator).
SPECIFICALLY INCLUDE:
- The EXACT name found for VAPI agent, Tavus persona, and Widget display
- Status of VinSolutions API connection
- Status of 15-minute idle trigger
- Any GAP IDs created and their P-level
- Confidence level (0-100) that agents are ready for live testing in B3/B4
- Update release_criteria.md with all P0/P1 gaps found

DO NOT PROCEED TO BATTERY 2 WITHOUT COORDINATOR APPROVAL.
