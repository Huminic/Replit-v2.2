# Nexxus Connect v2.2 — Open Issues

## Statuses
- **OPEN** — Not yet worked on
- **VERIFIED** — Smoke test passed
- **CLOSED** — E2E confirmed

## Domains
- **FE**: Frontend | **BE**: Backend | **DT**: Data | **AU**: Auth/Security | **IN**: Infrastructure

---

## CLOSED (smoke tested + E2E confirmed)

I-061 through I-085, I-086, I-087, I-088

---

## OPEN

### [FE] I-089: Get Contact modal not working in dashboard lead drill-down
**Background:** User-reported. Clicking a lead in the dashboard metrics opens a modal, but the contact details fail to load. The modal either shows empty or errors.
**Outcome:** Contact modal loads and displays lead details (name, phone, email, vehicle interest, status) when clicked from any dashboard metric.
**Acceptance Criteria:** Click lead in dashboard → modal opens → contact info displayed → no console errors.
**Next Sprint:** Yes

### [BE] I-090: Calculated insights not computing properly
**Background:** User-reported. Dashboard shows raw metrics from warehouse_leads (pipeline counts) but calculated insights (conversion rates, lead source ROI, trend analysis) are not calculating or displaying correctly after Supabase migration.
**Outcome:** All insight calculations produce correct values based on warehouse_leads data.
**Acceptance Criteria:** Insights page shows non-zero calculated values for stores with 1000+ leads. Values verified against direct DB queries.
**Next Sprint:** Yes

### [BE] I-091: SMS human takeover broken — aiPaused doesn't persist
**Background:** Ghost audit. Test FLOW-2 passes but the feature doesn't work. `assignedTo` is set via API but `aiPaused` computed field doesn't correctly prevent AI from responding. A customer could get an AI response after a human took over.
**Outcome:** When a conversation has assignedTo set, AI agent skips that conversation entirely.
**Acceptance Criteria:** Set assignedTo on conversation → send inbound SMS → AI does NOT auto-respond → human reply works.
**Next Sprint:** Yes

### [BE] I-092: Campaign execution always uses dryRun=true
**Background:** Ghost audit. Campaign SMS execution uses dryRun=true in test flows. No test verifies actual SMS delivery. System could silently fail to send 1000 messages and all tests pass.
**Outcome:** Campaign execution can run with dryRun=false. Test verifies at least one real SMS is sent and delivered via TextMagic MCP.
**Acceptance Criteria:** Execute campaign with dryRun=false → SMS sent via callMCP → TextMagic confirms delivery → outbound_log records it.
**Next Sprint:** Yes (with real TextMagic send)

### [BE] I-093: No real VAPI round-trip test
**Background:** Ghost audit. LC-5 uses a hardcoded old call ID. No test makes an actual call to a test agent and verifies the transcript arrives in TeamBox.
**Outcome:** Test exercises real VAPI call flow: create call → wait for completion → verify transcript in conversation.
**Acceptance Criteria:** VAPI call initiated → end-of-call webhook received → conversation created in TeamBox → transcript present.
**Next Sprint:** Yes (with real VAPI call)

### [BE] I-094: No Tavus transcript verification test
**Background:** Ghost audit. Tests check video-session endpoint returns a response. No test verifies the transcript callback fires or appears in the conversation thread.
**Outcome:** Test exercises Tavus flow: create session → verify conversation.ended webhook → transcript in TeamBox.
**Acceptance Criteria:** Tavus session created → webhook fires → conversation in TeamBox → summary present.
**Next Sprint:** Yes

---

## Test Coverage Gaps (from Ghost Audit 2026-03-20)

| ID | User Story | Gap | Priority |
|----|-----------|-----|----------|
| TG-001 | US-005: Walk-in auto-followup | No test exists | HIGH |
| TG-002 | US-007: Pipeline review | No test exists | HIGH |
| TG-003 | US-010: Recall notification | No test exists | MEDIUM |
| TG-004 | US-012: Opt-out/STOP handling | No test exists | HIGH |
| TG-005 | US-013: Widget scheduling | No test exists | MEDIUM |
| TG-006 | US-022: Multi-store oversight | No test exists | HIGH |
| TG-007 | US-023: Metric accuracy | No test exists (now I-090) | HIGH |
| TG-008 | After-hours behavior | No time-based test | MEDIUM |
| TG-009 | Multi-tenant data isolation | No cross-org leak test | HIGH |
| TG-010 | TeamBox real-time updates | No SSE/WebSocket test | MEDIUM |

---

## Test Infrastructure

| ID | Issue | Status |
|----|-------|--------|
| TI-010 | Accessibility (aria-labels, color contrast) | OPEN |

---

**Last updated:** 2026-03-20 (Ghost audit findings, user-reported I-089/I-090)
**CLOSED:** 26 items
**OPEN:** 6 items (2 FE/BE user-reported, 4 BE ghost audit)
**TEST GAPS:** 10 items (from ghost coverage audit)
**TI OPEN:** 1 item (accessibility)
