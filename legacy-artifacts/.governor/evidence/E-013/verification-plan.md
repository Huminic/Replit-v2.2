# Verification Plan — Post-SEC Remediation
**Date:** 2026-03-26
**Phase:** qa_resolve_loop → verification
**Target:** dev.huminicdev.com (always live from local codebase)

---

## Sprint Breakdown

### T-013: UI Navigation Verification
**Priority:** T1
**Method:** Playwright MCP against dev.huminicdev.com
**Scope:**
- I-125: Click every popout/sub-menu link across all 8 sections, confirm correct page/tab loads
- Verify all SEC-01 through SEC-08 changes are visible on dev (Reset Tour label, Instant Call Back button, sub-menu alignments, Campaign Safety dismiss, tooltips, chat resume, activity feed)
- Verify My Work is hidden from sidebar
- Verify no console errors on any page load

**Declared files:** tests/e2e/s9-cross-cutting.spec.ts (or new t13-navigation.spec.ts)

---

### T-014: Data Flow Verification
**Priority:** T1
**Method:** Playwright MCP + API calls
**Scope:**
- I-123: Submit widget contact form → verify conversation appears in TeamBox
- I-123: Submit landing page contact form → verify conversation appears in TeamBox
- Verify Sales activity feed shows real API data (not hardcoded)
- Verify metric tiles on Sales/Service/Marketing match API responses
- Verify Insights page shows data across all 4 sections that use it
- Verify System Log shows real activity entries
- Verify Hunches generate button produces results

**Declared files:** tests/e2e (test files for data verification)

---

### T-015: RBAC Verification
**Priority:** T1
**Method:** Playwright MCP — login as each role, verify page access
**Scope:**
- S-9.AC5/AC6: No cross-org data leakage (5 orgs × key pages)
- Settings tiles per role (super_admin sees 7, partner_admin sees 7 with AI Config read-only, org_admin sees 6)
- Management page RBAC redirect for non-management roles
- Profile dropdown items per role (Billing only for system-access roles — wait, we removed it)

**Declared files:** tests/e2e (RBAC test files)

---

### T-016: Integration Verification
**Priority:** T1
**Method:** API calls + log verification
**Scope:**
- S-9.AC1: VAPI assistants match DB agent records
- S-9.AC10: Tavus integration (RI-TAVUS-2)
- Video widget: verify popup fix works (window opens, not blocked)
- Instant Call Back: verify POST to /api/widget/voice-callback (expect 404 until backend route created — document)
- Verify CommGate toggle stops outbound
- Verify channel toggles work per channel

**Declared files:** tests/e2e/real-integrations.spec.ts, tests/e2e/live-comms.spec.ts

---

### T-017: Autonomous Comms Test — Sales
**Priority:** T1
**Method:** elliott.ts + TextMagic API + Resend logs
**Scope:**
- Inbound text → Sales comms agent responds → verify in TeamBox
- Inbound phone (elliott.ts calls sales VAPI agent) → verify conversation + appointment parsing
- Outbound phone trigger test (if trigger mechanism exists)
- Email notification delivery verification via Resend logs

**Prerequisites:**
- Confirm elliott.ts location and functionality
- Confirm TextMagic test numbers and which can send/receive
- Confirm VAPI assistant ID for sales

**Declared files:** utilities/elliott-test.ts, tests/e2e/live-comms.spec.ts

---

### T-018: Autonomous Comms Test — Service
**Priority:** T1
**Method:** TextMagic API + campaign execution
**Scope:**
- Create test campaign → CSV with test phone number only → execute → verify SMS sent
- Simulate inbound reply → verify service agent responds → verify TeamBox conversation
- Campaign disconnect test — stop campaign messages for a customer
- After-hours message queue test (toggle business hours, attempt send, verify queued)

**Prerequisites:**
- Serra service campaign setup
- TextMagic test number authorized for send
- Nancy Gaston agent configured with vapiAssistantId

**Declared files:** tests/e2e/live-comms.spec.ts

---

### T-019: TeamBox E2E Verification
**Priority:** T1
**Method:** Playwright MCP
**Scope:**
- All inbound message types visible (SMS, email, web chat, voice, video, form)
- Outbound reply from TeamBox → verify delivery via outbound_log
- Take Over: assign human → AI stops → un-assign → AI resumes
- Kill switch queue: toggle CommGate OFF → attempt send → verify message queued in TeamBox → toggle ON → verify release
- VAPI call logs in Phone tab with transcripts
- Tavus session logs in Video tab with transcripts
- Channel filter chips functional
- Status filters functional

**Declared files:** tests/e2e/s2-teambox.spec.ts

---

### T-020: Code Scan
**Priority:** T2
**Method:** Static analysis agents
**Scope:**
- Scan all page components for hardcoded mock data (like the activity feed we caught)
- Scan for console.error without user-facing feedback
- Scan for unused imports after SEC changes
- Verify no cross-org data queries (SELECT without org_id filter)
- Verify all API endpoints have auth middleware
- Check for TODO/FIXME/HACK comments that indicate unfinished work

**Declared files:** none (read-only scan)

---

## Execution Order

```
T-013 (UI nav)     ←── can start immediately
T-014 (data flow)  ←── can start immediately
T-015 (RBAC)       ←── can start immediately
    ↓
T-016 (integrations) ←── after T-013/T-014/T-015
    ↓
T-017 (comms sales)   ←── after T-016 confirms integrations work
T-018 (comms service) ←── after T-016, parallel with T-017 if separate numbers
    ↓
T-019 (TeamBox E2E)   ←── after T-017/T-018 generate messages to verify
    ↓
T-020 (code scan)     ←── can run anytime, no dependencies
```

T-013, T-014, T-015 can run in parallel (different scopes, no file conflicts).
T-017 and T-018 can run in parallel if they use separate TextMagic numbers.
T-020 is independent.

---

## Open Questions Before Execution

1. Is the dev build current? (need to confirm PM2 restarted after SEC commits)
2. TextMagic test numbers — which can send, which can receive?
3. elliott.ts — what does it do currently? Need to read it before dispatching.
4. Do we have login credentials for all 5 dealer orgs + all role types?
5. Is /api/widget/voice-callback route needed before T-016, or do we accept 404 and document?
