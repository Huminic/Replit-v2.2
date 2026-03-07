# BATTERY 2 — WIDGET, PUBLIC PAGE, LANDING PAGE & EMBED CODE TESTING
## v2.0 — Gap-First Edition | Unified Widget + VinSolutions + Caroline Persona

---

## CONTEXT RESET
Load only: This prompt + Master Coordinator v2.0 + Battery 1 Handoff Report.

---

## GAP-FIRST REMINDER
Widgets are the front door. If leads can't get in the door, nothing else works.
Expect embed code issues, persona name mismatches, and broken VinSolutions routing.
Find every gap. Document every gap. Keep moving.

---

## TEST CONTACT
```
Name:    Duane Wells
Email:   duanewells@icloud.com | duanekwells@gmail.com
Phone:   412.654.6500
VinSol:  Durran Cage account | Salesperson: Duane Wells
Persona: [USE NAME FROM B1 HANDOFF — canonical agent name]
```

---

## B1 DEPENDENCY CHECKS
Before starting:
1. Was persona name confirmed consistent across VAPI/Tavus/Widget in Battery 1?
   - If YES: use that confirmed name throughout this battery
   - If NO (GAP-B1-PERSONA-*): document which widgets show which names in your testing
     and use the discrepancy as evidence for remediation
2. Was VinSolutions API confirmed active?
   - If NO: Widget lead capture tests will show CRM insertion failures — log as AT RISK

---

## SECTION 2A: UNIFIED WIDGET (PRIORITY — TEST FIRST)

The Unified Widget is the highest-value front-end asset. Test it before all other widgets.

### TC-2A-001: Public-Facing Page — Widget Presence
**Action:** Navigate to the new public-facing page built with embed code.
**Check:**
  □ Page loads and is publicly accessible (no login required)
  □ Unified Widget icon visible in bottom-right corner
  □ Widget icon displays canonical agent name OR brand-consistent label
  □ No console errors on load
  □ Page loads in < 4 seconds
**Pass Criteria:** All 5 checks pass
**Failure Severity:** P0 if page inaccessible, P1 if widget missing

### TC-2A-002: Unified Widget Menu — All 4 Channel Options
**Action:** Click the Unified Widget icon on the public-facing page.
**Expected:**
  - Menu opens with 4 options:
    1. Chat (chatbot)
    2. Video (Tavus)
    3. Call (VAPI)
    4. Form / Contact
  - Each option has clear icon and label
  - Response name shown in widget header matches B1 canonical name
**Pass Criteria:** All 4 options present, name matches canonical
**Failure Severity:**
  - P0 if menu fails to open
  - P0 if canonical name mismatch (new gap if not caught in B1)
  - P1 if any option is missing

### TC-2A-003: Unified Widget — Chat Route (Duane Wells test credentials)
**Action:** From the Unified Widget, select Chat. Complete conversation using:
  Name: Duane Wells | Email: duanewells@icloud.com | Phone: 412.654.6500
**Expected:**
  - Chat opens, AI responds within 5 seconds
  - AI uses canonical persona name
  - Lead data captured and inserted to VinSolutions:
    - Salesperson: Duane Wells
    - Account: Durran Cage
    - Source: Chat Widget
  - Confirmation email → duanewells@icloud.com AND duanekwells@gmail.com
**Pass Criteria:** Chat works, VinSolutions lead inserted, both emails received
**Failure Severity:** P0 if VinSolutions not updated, P1 if emails not sent
**EVIDENCE REQUIRED:**
  □ Screenshot of VinSolutions lead record
  □ Screenshot of email at duanewells@icloud.com
  □ Screenshot of email at duanekwells@gmail.com

### TC-2A-004: Unified Widget — Video Route (Tavus)
**Action:** From the Unified Widget, select Video.
**Expected:**
  - Tavus video loads and plays
  - Persona in video matches canonical name (face/voice named "Caroline" or confirmed name)
  - CTA present on video
**Pass Criteria:** Video loads, persona consistent
**Failure Severity:** P1 if persona name in video differs from widget header name
**Note:** DO NOT test live interactive video. That is reserved for Duane Wells manual test (LAST).

### TC-2A-005: Unified Widget — Voice Route (VAPI)
**Action:** From the Unified Widget, select Call. Allow microphone. Initiate brief call.
Use: "Hi, I'm Duane Wells, just testing the call feature."
**Expected:**
  - Call connects within 5 seconds
  - AI responds with canonical name
  - Post-call: lead inserted to VinSolutions OR CRM record created
**Pass Criteria:** Call connects, AI uses canonical name
**Failure Severity:** P0 if call fails, P1 if wrong persona name used

### TC-2A-006: Unified Widget — Form Route
**Action:** From the Unified Widget, select Form. Submit with Duane Wells credentials.
**Expected:**
  - Form renders correctly
  - Submission creates VinSolutions lead (Durran Cage account, salesperson: Duane Wells)
  - Confirmation shown on screen
  - Confirmation email → duanewells@icloud.com AND duanekwells@gmail.com
**Pass Criteria:** Lead created in VinSolutions, both emails received
**Failure Severity:** P0 if lead not created, P1 if only one email received
**EVIDENCE REQUIRED:** Same as TC-2A-003

### TC-2A-007: Unified Widget — Session Persistence
**Action:** Open chat via widget, send 2 messages, close widget, re-open.
**Expected:** Conversation history preserved. Lead info not re-requested.
**Pass Criteria:** History preserved
**Failure Severity:** P2 if lost (workaround exists)

---

## SECTION 2B: TAVUS VIDEO WIDGET (STANDALONE)

### TC-2B-001: Video Widget Load
**Action:** Load the standalone Tavus video widget.
**Check:**
  □ Video loads and plays
  □ Persona name displayed matches canonical name
  □ Audio clear
  □ CTA present
**Pass Criteria:** All 4 checks pass
**Failure Severity:** P0 if video fails to load, P1 if persona name mismatch

### TC-2B-002: Tavus Lead Capture → VinSolutions
**Action:** Interact with CTA, provide Duane Wells test credentials.
**Expected:**
  - VinSolutions lead inserted:
    - Salesperson: Duane Wells
    - Account: Durran Cage
    - Source: Tavus Video Widget
  - Confirmation email sent to BOTH inboxes
**Pass Criteria:** Lead in VinSolutions, both emails
**Failure Severity:** P0 if VinSolutions insertion fails
**EVIDENCE REQUIRED:**
  □ Screenshot of VinSolutions lead
  □ Both email screenshots

---

## SECTION 2C: VAPI WEBCALL WIDGET (STANDALONE)

### TC-2C-001: VAPI Widget Load
**Action:** Load the VAPI webcall widget.
**Check:**
  □ Widget renders, call button visible
  □ Display name = canonical name
  □ Microphone permission request fires
**Pass Criteria:** All 3 pass

### TC-2C-002: VAPI Webcall → VinSolutions
**Action:** Click call, provide info: "Duane Wells, duanewells@icloud.com"
**Expected:**
  - Call connects, AI uses canonical name
  - Post-call: VinSolutions lead inserted (Durran Cage account)
  - Source: VAPI Webcall Widget
  - Transcript attached to lead record
**Pass Criteria:** Lead in VinSolutions with transcript
**Failure Severity:** P0 if no lead created, P1 if transcript missing
**EVIDENCE REQUIRED:**
  □ VinSolutions screenshot
  □ Transcript confirmation

---

## SECTION 2D: FORM WIDGET (STANDALONE)

### TC-2D-001: Form Render & Validation
**Action:** Load standalone form widget. Test field validation.
**Check:** Required fields, email format, phone format all validate
**Pass Criteria:** All validations work

### TC-2D-002: Form → VinSolutions Lead Insertion
**Action:** Submit form with Duane Wells credentials.
**Expected:**
  - VinSolutions lead inserted (Durran Cage, Duane Wells salesperson)
  - BOTH emails receive confirmation
  - Success message on screen
**Pass Criteria:** All 3 pass
**EVIDENCE REQUIRED:** Same as TC-2A-003

### TC-2D-003: Form Duplicate Handling
**Action:** Submit same form twice in 5 minutes.
**Expected:** No duplicate VinSolutions record created
**Pass Criteria:** 1 record max
**Failure Severity:** P0 if duplicate triggers 2× outbound sequences (spam risk)

---

## SECTION 2E: HOSTED LANDING PAGES

### TC-2E-001: Video-First Landing Page
**Check:**
  □ Tavus video dominant above the fold
  □ Canonical persona name consistent
  □ Unified Widget in bottom-right
  □ Form present and submits to VinSolutions
  □ Mobile responsive (test at 375px)
  □ Page loads < 4 seconds
**Pass Criteria:** All 6 pass
**Failure Severity:** P1 if video not dominant, P1 if no Unified Widget

### TC-2E-002: Form-First Landing Page
**Check:**
  □ Form visible above fold
  □ All fields render
  □ Submission → VinSolutions + both emails
  □ Unified Widget present
  □ Mobile responsive
**Pass Criteria:** All 5 pass

### TC-2E-003: Unified Widget Landing Page
**Check:**
  □ Page content focused (not single-widget only)
  □ Unified Widget visible bottom-right
  □ All 4 channel options work
  □ Each channel routes to correct widget/interface
  □ Mobile responsive
**Pass Criteria:** All 5 pass

### TC-2E-004: Public-Facing Embed Code Page
**Action:** Load the new public-facing page built specifically with embed code.
This is the page created as part of the new deployment requirement.
**Check:**
  □ Page is live and publicly accessible
  □ Embed code renders correctly (no broken dependencies)
  □ Unified Widget on page
  □ Form/widget submission routes to VinSolutions
  □ No CORS errors in browser console
  □ The embed page exists — if not, this is P0 (page never built)
**Pass Criteria:** Page exists, accessible, functional, VinSolutions connected
**Failure Severity:** P0 if page does not exist or embed code broken

---

## SECTION 2F: EMBED CODE VALIDATION

### TC-2F-001: Extract All Embed Codes
**Action:** From the platform dashboard, copy embed codes for:
  1. Chatbot widget
  2. Tavus video widget
  3. VAPI webcall widget
  4. Form widget
  5. Unified widget
**For each, paste into a blank HTML test page and load in browser.**
**Check per widget:**
  □ Renders without errors
  □ No CORS errors
  □ No broken CDN dependencies
  □ Connects to correct platform instance
  □ Persona name = canonical name
**Pass Criteria:** All 5 embed codes render
**Failure Severity:** P0 if any embed code fails completely

---

## BATTERY 2 ACCEPTANCE CRITERIA

| Component | Must-Pass (P0) | Should-Pass (P1) |
|-----------|---------------|-----------------|
| Public-facing page exists | ✓ | |
| VinSolutions insertion from any widget | ✓ | |
| BOTH emails received per test | | ✓ |
| Unified Widget opens all 4 channels | ✓ | |
| Canonical name consistent on all widgets | ✓ | |
| Tavus video loads | ✓ | |
| VAPI call connects | ✓ | |
| All embed codes render | ✓ | |

---

## BATTERY 2 COMPLETION INSTRUCTIONS

**Reporter Agent:** Produce Handoff Report v2.0.
SPECIFICALLY INCLUDE:
- URL of public-facing page
- VinSolutions insertion status per widget channel
- Email evidence status (both inboxes, per test)
- Persona name consistency findings (update B1 gap if needed)
- List of embed codes that passed/failed
- Any new P0/P1 gaps → update release_criteria.md

**EVIDENCE PACKAGE:** Attach all screenshots required above to handoff report.

DO NOT PROCEED TO BATTERY 3/4 WITHOUT COORDINATOR APPROVAL.
