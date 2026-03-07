# SALES AUTOMATION PLATFORM — COMPLETE DEPLOYMENT-READY TEST KIT
## Master Prompt, Lead Flow Diagrams, Gap Remediation Framework
### Version 2.0 — Duane Wells / Durran Cage / VinSolutions Integration

---

## ⚠️ CRITICAL OPERATING DOCTRINE — READ BEFORE ANYTHING ELSE

This test kit operates under a **Gap-First Assumption**. The following core belief governs every
battery, every agent, every handoff, and every remediation loop:

> **"This system WILL have gaps. The question is not IF — it's WHERE, HOW WIDE, and HOW FAST
> we route them back into the release criteria. Velocity of gap identification and structured
> remediation queuing IS the success metric."**

Every agent in this kit is instructed to:
1. EXPECT failure at integration seams
2. LOG every gap with a structured remediation ticket
3. ROUTE gaps to the `release_criteria.md` via the Gap Queue (defined below)
4. NEVER declare a pass on an untested assumption

---

## TESTER CREDENTIALS (CANONICAL — NEVER MODIFY)

```
PRIMARY TESTER:
  Name:    Duane Wells
  Email:   duanewells@icloud.com
  Phone:   412.654.6500  (formatted as dialed: 4126546500)

SECONDARY EMAIL (ALL EMAIL TEST EVIDENCE COPIED HERE):
  Email:   duanekwells@gmail.com

CRM ACCOUNT:
  Platform:  VinSolutions
  Account:   Durran Cage's VinSolutions Account
  Lead Assignment:  All VAPI and Tavus video leads insert to Durran Cage's VinSolutions account
  Salesperson Name: Duane Wells (used for all test lead records)

2-WAY TEXT (TEXTMAGIC API):
  All outbound 2-way text evidence must show direct communication to: 412.654.6500
  Platform: TextMagic API (not Twilio alone — confirm TextMagic is the active SMS provider)

AGENT PERSONA (CANONICAL — ALL AGENTS MUST MATCH):
  Name:     Caroline (example — confirm actual configured name)
  NOTE:     The VAPI agent name, Tavus persona name, and Unified Widget response name
            MUST ALL MATCH. If the configured name is different from "Caroline," update
            ALL three systems to use the SAME name. This is non-negotiable for brand consistency.
```

---

## AGENT CONFIGURATION REQUIREMENTS (MANDATORY FOR EVERY ACCOUNT)

The following 3 agent types MUST exist in EVERY account under test:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  REQUIRED AGENT FORMULA — APPLIED TO EVERY ACCOUNT                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│  1. LEAD FOLLOW-UP AGENT                                                         │
│     Purpose: Handle new leads, initiate follow-up sequences                     │
│     Channels: SMS (TextMagic), Voice (VAPI), Video (Tavus)                      │
│     Trigger: New lead inserted in VinSolutions, or 15-min idle timer            │
│     Right Pane: Full context block + escalation instructions (see Battery 1)    │
│     Skills: CRM read/write, SMS send/receive, appointment booking               │
│                                                                                  │
│  2. SALES COACH AGENT (DEAL CLOSING ADVICE)                                      │
│     Purpose: Provide real-time coaching to sales reps during deal cycles        │
│     Channels: Internal (advisor mode — not customer-facing)                     │
│     Trigger: Deal stage change, rep request, deal stalled > X days              │
│     Right Pane: Coaching framework, closing techniques, objection handling      │
│     Skills: CRM read, pipeline analysis, script recommendations                 │
│                                                                                  │
│  3. MESSAGING COACH AGENT (TEXT & EMAIL RESPONSE)                                │
│     Purpose: Advise sales reps on optimal text/email responses to leads         │
│     Channels: Internal (advisor mode)                                           │
│     Trigger: Inbound lead message received, rep flags a conversation            │
│     Right Pane: Response templates, tone guidelines, urgency calibration        │
│     Skills: Message analysis, response generation, CRM log                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## VAPI → VINSOLUTIONS LEAD FLOW DIAGRAM

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║           VAPI → VINSOLUTIONS LEAD INSERTION FLOW — FULL ASCII DIAGRAM             ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

SOURCE ENTRY POINTS
───────────────────
   [UNIFIED WIDGET]        [VIDEO WIDGET]         [VAPI WEBCALL]         [FORM/CHAT]
   Bottom-Right Icon       Tavus Embed             Embedded Call Btn      Landing Page
         │                      │                       │                      │
         └──────────────────────┴───────────────────────┴──────────────────────┘
                                               │
                                               ▼
                                  ┌────────────────────────┐
                                  │   CHANNEL ROUTER       │
                                  │   (Platform Core)      │
                                  │   Detects source type  │
                                  │   Routes to correct    │
                                  │   AI agent pipeline    │
                                  └────────────┬───────────┘
                                               │
                          ┌────────────────────┴──────────────────┐
                          │                                        │
               ┌──────────▼──────────┐                  ┌─────────▼──────────┐
               │  VAPI VOICE PIPELINE │                  │  TAVUS VIDEO PIPELN│
               │  ──────────────────  │                  │  ─────────────────  │
               │  Inbound call rings  │                  │  Widget interaction │
               │  AI (Caroline) picks │                  │  CTA clicked        │
               │  up within 2 rings   │                  │  Lead data captured │
               │  Qualifies lead      │                  │  Session recorded   │
               │  via conversation    │                  └─────────┬──────────┘
               │  Extracts:           │                            │
               │  - Name              │                  ┌─────────▼──────────┐
               │  - Phone             │                  │  TAVUS CRM CAPTURE │
               │  - Email             │                  │  Source: Tavus Vid  │
               │  - Intent/Interest   │                  │  Contact: extracted │
               │  - Best time to call │                  │  Session ID logged  │
               └──────────┬──────────┘                  └─────────┬──────────┘
                          │                                        │
                          └──────────────┬─────────────────────────┘
                                         │
                                         ▼
                           ┌─────────────────────────┐
                           │   PLATFORM CRM LAYER    │
                           │   (Internal staging)     │
                           │   Lead record created:  │
                           │   - Name                │
                           │   - Phone               │
                           │   - Email               │
                           │   - Source (VAPI/Tavus) │
                           │   - Timestamp           │
                           │   - Transcript/Session  │
                           │   - Status: New Lead    │
                           └─────────────┬───────────┘
                                         │
                                         ▼
                           ┌─────────────────────────┐
                           │   VINSOLUTIONS API      │
                           │   INTEGRATION LAYER     │
                           │   ─────────────────     │
                           │   POST /leads           │
                           │   {                     │
                           │     salesperson: "Duane │
                           │       Wells"            │
                           │     firstName: [from    │
                           │       conversation]     │
                           │     lastName: [from     │
                           │       conversation]     │
                           │     phone: [captured]   │
                           │     email: [captured]   │
                           │     source: "VAPI" OR   │
                           │       "Tavus Video"     │
                           │     account: "Durran    │
                           │       Cage"             │
                           │     leadNotes: [full    │
                           │       transcript]       │
                           │   }                     │
                           └─────────────┬───────────┘
                                         │
                          ┌──────────────┴──────────────┐
                          │                             │
               ┌──────────▼──────────┐       ┌─────────▼───────────┐
               │  SUCCESS PATH        │       │  FAILURE PATH        │
               │  ─────────────────   │       │  ─────────────────── │
               │  Lead appears in     │       │  API error logged    │
               │  Durran Cage's       │       │  Alert to admin      │
               │  VinSolutions acct   │       │  Lead queued for     │
               │  Salesperson: Duane  │       │  manual insertion    │
               │  Wells              │       │  Gap ticket created  │
               │  Status: New Lead    │       │  → release_criteria  │
               │  Source tag intact   │       └─────────────────────┘
               └──────────┬──────────┘
                          │
                          ▼
           ┌──────────────────────────────────┐
           │   15-MINUTE IDLE TRIGGER         │
           │   ─────────────────────────────  │
           │   IF lead sits in VinSolutions   │
           │   with Status = "New Lead"       │
           │   AND no activity for 15 min:    │
           │                                  │
           │   TRIGGER FIRES:                 │
           │   1. Outbound call to:           │
           │      Duane Wells (412.654.6500)  │
           │      via VAPI                    │
           │   2. Outbound 2-way text via     │
           │      TextMagic API to:           │
           │      412.654.6500               │
           │   Both fire simultaneously OR   │
           │   per configured priority rule  │
           └──────────────────────────────────┘
                          │
                          ▼
           ┌──────────────────────────────────┐
           │   AGENT RESPONSE SEQUENCE        │
           │   ─────────────────────────────  │
           │   Caroline (VAPI) calls lead     │
           │   Caroline (TextMagic) texts     │
           │   Lead responds via either       │
           │   channel                        │
           │   2-way conversation begins      │
           │   Appointment offered/booked     │
           │   VinSolutions updated:          │
           │     Status → Contacted           │
           │     Notes → conversation log     │
           │   Evidence: SMS to 412.654.6500 │
           │   Evidence: Email to            │
           │     duanewells@icloud.com       │
           │     duanekwells@gmail.com       │
           └──────────────────────────────────┘
```

---

## TAVUS VIDEO WIDGET → VAPI AGENT NAME CONSISTENCY REQUIREMENT

```
┌────────────────────────────────────────────────────────────────────────┐
│  NAME SYNCHRONIZATION — CRITICAL REQUIREMENT                           │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  VAPI Agent Name:        "Caroline"  ◄─── Must match ──────────────┐  │
│  Tavus Persona Name:     "Caroline"  ◄─── Must match ─────────────┐│  │
│  Unified Widget Name:    "Caroline"  ◄─── Must match ────────────┐││  │
│  SMS Sender Display:     "Caroline"  ◄─── Must match ───────────┐│││  │
│  Email Reply-From Name:  "Caroline"  ◄─── Must match ──────────┐││││  │
│                                                                  └┘┘┘┘  │
│  VERIFICATION TEST:                                                    │
│  A prospect who receives a Tavus video from "Caroline," then gets     │
│  an SMS from "Caroline," then gets a VAPI call from "Caroline,"       │
│  MUST experience a consistent persona. Any name mismatch = P0 failure.│
│                                                                        │
│  The Tavus video account name MUST match the VAPI agent name.         │
│  This was original work — verify it was actually connected.           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## GAP REMEDIATION QUEUE — HOW GAPS ROUTE TO release_criteria.md

When ANY test agent finds a gap (P0 or P1), the following routing protocol applies:

```
GAP DETECTED
     │
     ▼
┌────────────────────────────────────────┐
│  GAP TICKET CREATED                    │
│  Format:                               │
│  GAP-[BatteryNum]-[Sequence]           │
│  Example: GAP-B3-007                   │
│                                        │
│  Required fields:                      │
│  - Gap ID                              │
│  - Battery / Section / TC Number       │
│  - Component affected                  │
│  - Expected behavior                   │
│  - Actual behavior observed            │
│  - Severity (P0/P1/P2/P3)             │
│  - Dependent batteries blocked         │
│  - Proposed remediation               │
│  - Estimated complexity (Low/Med/High) │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│  SEVERITY ROUTING                      │
│                                        │
│  P0: Immediate halt. Coordinator       │
│      escalates to operator. Battery    │
│      blocked. Gap logged in            │
│      release_criteria.md P0 section.   │
│                                        │
│  P1: Battery proceeds with risk note.  │
│      Gap logged in release_criteria.md │
│      P1 section. Flagged for mandatory │
│      re-test in Battery 6 regression.  │
│                                        │
│  P2/P3: Logged, batteries continue.    │
│         Queued for post-launch sprint. │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│  release_criteria.md SECTIONS          │
│                                        │
│  Section 1: P0 Blockers (must fix)     │
│  Section 2: P1 Launch Risks            │
│  Section 3: P2 Sprint Backlog          │
│  Section 4: P3 Enhancement Queue       │
│  Section 5: Regression Verification    │
│             Log (Battery 6 re-tests)   │
│  Section 6: Production Monitoring      │
│             Watchlist (post-launch)    │
└────────────────────────────────────────┘
```

---

## EVIDENCE REQUIREMENTS (ALL BATTERIES)

Every live test that involves communication MUST produce the following evidence:

```
EVIDENCE CHECKLIST — REQUIRED FOR EVERY LIVE COMMUNICATION TEST:

For SMS (TextMagic API):
  □ Screenshot of SMS received at 412.654.6500
  □ Screenshot of 2-way reply exchange (min 2 turns)
  □ TextMagic delivery log URL or export
  □ CRM record showing SMS logged with timestamp

For VAPI Voice:
  □ Call log showing call to/from 4126546500
  □ Transcript of conversation (auto-generated or manual)
  □ CRM record showing call logged
  □ VinSolutions lead record showing inserted lead (for inbound scenarios)

For Email:
  □ Email received at duanewells@icloud.com (primary)
  □ Email received at duanekwells@gmail.com (CC/secondary — confirm CC configured)
  □ Subject line and timestamp documented
  □ CRM record showing email event logged

For Tavus Video:
  □ Video link received (via SMS or email)
  □ Video plays correctly — persona name matches "Caroline" (or configured name)
  □ CTA click event logged in CRM
  □ VinSolutions lead inserted (if video is entry point)

For VinSolutions Lead Insertion:
  □ Screenshot of lead in Durran Cage's account
  □ Salesperson field shows "Duane Wells"
  □ Source field shows "VAPI" or "Tavus Video"
  □ Lead notes contain conversation transcript or summary
```

---

## PUBLIC-FACING PAGE & EMBED CODE REQUIREMENTS

```
REQUIRED DEPLOYMENTS:
  1. New public-facing page using embed code
     - URL must be documented and testable
     - Contains Unified Widget in bottom-right
     - Widget response name = "Caroline" (or configured canonical name)
     - Submit test form using Duane Wells credentials
     - Confirm VinSolutions lead insertion fires

  2. Hosted Landing Page — Video-First
     - Tavus widget embedded
     - Unified widget also present
     - Form triggers VinSolutions insertion
     - Test contact: Duane Wells / duanewells@icloud.com / 4126546500

  3. Hosted Landing Page — Form-First
     - Form contains all required fields
     - Submission triggers:
       a. VinSolutions lead insert
       b. 15-min idle trigger (if applicable)
       c. Email to duanewells@icloud.com + duanekwells@gmail.com
     - Unified widget present

NOTE: Live video test (Tavus interactive) is RESERVED FOR LAST.
Duane Wells will personally test the live video component after all
other batteries complete. Do NOT attempt live video as part of automated
battery testing. Document this as a reserved manual test step.
```

---

## BATTERY SEQUENCING OVERVIEW

```
[PRE-FLIGHT: Credential & API Validation]
           │
           ▼
[BATTERY 1: Agent Config + VinSolutions + Name Consistency]
           │
           ▼
[BATTERY 2: Widgets + Embed Code + Public Page + Landing Pages]
           │
           ┌──────────────────────────────────┐
           │                                  │
           ▼                                  ▼
[BATTERY 3: Inbound Workflows]    [BATTERY 4: Outbound Triggers]
  SMS → VinSolutions                CRM Status → 15-min idle
  VAPI Voice → VinSolutions         TextMagic 2-way SMS
  Tavus Video → VinSolutions        VAPI outbound call
  Form → VinSolutions               Tavus outbound video
           │                                  │
           └──────────────┬───────────────────┘
                          ▼
              [BATTERY 5: Calendar + Appointments]
                          │
                          ▼
              [BATTERY 6: E2E Regression + Gap Verification]
                          │
                          ▼
              [FINAL REPORT + release_criteria.md UPDATE]
                          │
                          ▼
              [MANUAL: Duane Wells Live Video Test — LAST]
```
