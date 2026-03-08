# Test Coordinator — Sweep 4 Deliverable

**Date:** 2026-03-08
**Purpose:** Maps owner test batteries to AC IDs, Observability Matrix rows, and shows coverage status.

---

## Test Framework

| Framework | Purpose | Location |
|-----------|---------|----------|
| Vitest | Unit/integration tests | `tests/**/*.test.ts` |
| Playwright (Replit built-in) | E2E browser tests | Via `runTest()` skill |
| Owner batteries (reference) | Manual/agent-team test prompts | `testing/battery_*.md` |

---

## Battery → AC Mapping

### Battery 1: Agent Configuration

| Battery Test | AC ID(s) | Observability Row(s) | Coverage |
|---|---|---|---|
| TC-1A-001: Agent list renders | W1-AC-012a,b | Agent list (sub-menu) | Stub: `main-page.test.ts` |
| TC-1A-002: Agent config fields | — | Agent list (Settings) | Stub: `topbar-settings-profile.test.ts` |
| TC-1A-003: VAPI voice config | — | Widget voice channel | Stub: `widget-outbound.test.ts` — RC-BLOCKED (AIO-01) |
| TC-1A-004: Tavus video config | — | Widget video channel | Stub: `widget-outbound.test.ts` — RC-BLOCKED (AIO-02) |
| TC-1A-005: Persona name consistency | — | — | Manual verification |
| TC-1A-006: VinSolutions API connectivity | — | — | OWNER-TEST |

### Battery 2: Widget, Public Pages, Landing Pages

| Battery Test | AC ID(s) | Observability Row(s) | Coverage |
|---|---|---|---|
| TC-2A-001: Widget presence on public page | W1-AC-110 | Widget embed (external) | Stub: `widget-outbound.test.ts` — OWNER-TEST |
| TC-2A-002: Widget chat channel | W1-AC-110 | Widget chat channel | Stub: `widget-outbound.test.ts` — OWNER-TEST |
| TC-2A-003: Widget voice channel | — | Widget voice channel | RC-BLOCKED (AIO-01) |
| TC-2A-004: Widget video channel | — | Widget video channel | RC-BLOCKED (AIO-02) |
| TC-2B-001: Landing page loads | — | Landing page (public) | Stub: `widget-outbound.test.ts` — OWNER-TEST |
| TC-2B-002: Embed code generation | W1-AC-082 | Widget list (Settings) | Stub: `topbar-settings-profile.test.ts` |

### Battery 3: Inbound Workflows

| Battery Test | AC ID(s) | Observability Row(s) | Coverage |
|---|---|---|---|
| TC-3A-001: SMS inbound → AI response | — | SMS outbound (TextMagic) | OWNER-TEST |
| TC-3A-002: SMS → VinSolutions CRM insert | — | — | OWNER-TEST |
| TC-3B-001: Voice inbound → VAPI | — | Widget voice channel | RC-BLOCKED (AIO-01) |
| TC-3C-001: Email inbound routing | — | Email outbound (Resend) | OWNER-TEST |
| TC-3D-001: Widget chat → conversation | W1-AC-110 | Widget chat channel | Stub: `widget-outbound.test.ts` |

### Battery 4: Outbound Triggers

| Battery Test | AC ID(s) | Observability Row(s) | Coverage |
|---|---|---|---|
| TC-4A-001: Status trigger → outbound SMS | — | SMS outbound | OWNER-TEST |
| TC-4A-002: 15-min idle trigger | — | SMS outbound | OWNER-TEST |
| TC-4B-001: TextMagic 2-way SMS | — | SMS outbound | OWNER-TEST |
| TC-4C-001: VAPI outbound voice call | — | Widget voice channel | RC-BLOCKED (AIO-01) |
| TC-4D-001: Tavus video link delivery | — | Widget video channel | RC-BLOCKED (AIO-02) |
| TC-4E-001: Campaign execution sequence | W1-AC-051 | SMS/Email outbound | OWNER-TEST |

### Battery 5: Calendar & Appointments

| Battery Test | AC ID(s) | Observability Row(s) | Coverage |
|---|---|---|---|
| TC-5A-001: Appointment exists in platform + VinSolutions | W1-AC-031 | Appointments tab (My Work) | Stub: `my-work.test.ts` |
| TC-5A-002: Manual appointment → VinSolutions sync | — | — | OWNER-TEST |
| TC-5B-001: Appointment reminder chain | — | SMS/Email outbound | OWNER-TEST |
| TC-5C-001: Calendar view renders appointments | W1-AC-031 | Appointments tab | Stub: `my-work.test.ts` |

### Battery 6: E2E Regression & Final Report

| Battery Test | AC ID(s) | Observability Row(s) | Coverage |
|---|---|---|---|
| TC-6A-001 to 007: Full funnel E2E | Multiple | Multiple | E2E Playwright test (Sweep 8) |
| TC-6B-001: P0/P1 regression verification | — | All RC-blocking rows | Sweep 8 |
| TC-6C-001: Gap verification | — | All mock/static rows | Sweep 8 |

---

## Observability Matrix → Test File Mapping

| Page/Section | Test File | Real Rows | Mock/Static Rows | RC-Blocked |
|---|---|---|---|---|
| Main Page (AI Chat) | `main-page.test.ts` | 9 | 1 (artifacts static) | 0 |
| TeamBox | `teambox.test.ts` | 4 | 0 | 0 |
| My Work | `my-work.test.ts` | 3 | 1 (chat tab mock) | 1 (UI-02) |
| Sales | `departments.test.ts` | 3 | 1 (recent activity static) | 0 |
| Service | `departments.test.ts` | 3 | 0 | 0 |
| Marketing | `departments.test.ts` | 3 | 1 (studio static) | 0 |
| Management | `departments.test.ts` | 4 | 1 (insights mock) | 1 (UI-01) |
| TopBar | `topbar-settings-profile.test.ts` | 3 | 1 (activity feed mock) | 1 (UI-06) |
| Settings | `topbar-settings-profile.test.ts` | 6 | 3 (tool/KB/kill switch) | 0 partial |
| Profile & Billing | `topbar-settings-profile.test.ts` | 2 | 2 (billing static) | 0 |
| Widget & Outbound | `widget-outbound.test.ts` | 5 | 2 (voice/video mock) | 2 (AIO-01, AIO-02) |
| **TOTALS** | **6 test files** | **~45** | **~13** | **5 RC-blocking** |

---

## Coverage Summary

| Category | Count | Status |
|---|---|---|
| Observability rows with test stubs | ~65 | All have stubs (expected to fail until remediation) |
| RC-blocking mock/static rows | 5 | Stubs marked FAIL with issue IDs |
| OWNER-TEST flagged rows | 10 | Stubs present, require owner verification in Sweep 7.5 |
| Deferred rows (not RC-blocking) | 4 | Stubs marked DEFERRED |
| Battery tests mapped to ACs | 28 | Mapped above |
| Battery tests with no AC | ~40 | Integration/live-comm tests (VinSolutions, TextMagic, VAPI) |

---

## Deferred Battery Items (Not in RC Scope)

These tests from the owner batteries cover features explicitly deferred to post-MVP:

| Feature | Battery | Issue ID | Phase |
|---|---|---|---|
| Stripe billing integration | B2, B6 | API-01 | P6 |
| Marketing Studio | B6 | FP-8 | P7 |
| File attachments (TeamBox) | B3, B6 | FP-9 | P7 |
| Chat file upload | B3 | FP-10 | P7 |
| Trend percentages | B6 | MET-03 | P7 |

---

## Test Execution Plan

| Sweep | What Runs | Expected Result |
|---|---|---|
| Sweep 4 (now) | `npx vitest run` | All ~65 stubs FAIL (expected) |
| Sweep 5-7 | Individual stubs converted to real tests as features are remediated | Incremental pass |
| Sweep 8 | Full vitest suite + E2E Playwright battery | All non-deferred tests pass |
| Sweep 7.5 | OWNER-TEST items tested live by owner | Owner sign-off |
| Sweep 9 | RC Gate — all tests green, all matrices verified | Release Candidate |
