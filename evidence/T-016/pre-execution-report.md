# Pre-Execution Report: T-016 — Integration Verification

**Sprint:** T-016
**Type:** API + MCP integration testing
**Date:** 2026-03-27
**Status:** AWAITING ENTRY GATE

## Objective
Prove every external integration is connected, authenticated, and returning real data. VAPI assistants match DB, Tavus sessions creatable, CommGate stops outbound, channel toggles work, MCP bridge accessible, webhook error handling documented. Validates US-004, US-027, US-028, S-9.AC1.

## Declared Files
- tests/e2e/real-integrations.spec.ts
- tests/e2e/live-comms.spec.ts

## Acceptance Criteria
- T-016.AC1: VAPI assistant list matches DB agent records
- T-016.AC2: Tavus video session creation returns conversationUrl
- T-016.AC3: Video widget opens new window (popup fix — Playwright)
- T-016.AC4: Instant Call Back POST to /api/widget/voice-callback (expect 404)
- T-016.AC5: CommGate OFF → campaign execute blocked
- T-016.AC6: Channel toggle SMS OFF → send blocked; ON → allowed
- T-016.AC7: MCP tm_send_message accessible
- T-016.AC8: MCP vapi_list_assistants returns assistants
- T-016.AC9: TextMagic API version confirmed
- T-016.AC10: Webhook error handling documented
- T-016.AC11: Widget embed CORS check

## UI Changes
None.

## Test Plan
API calls + MCP tool calls against dev.huminicdev.com and mcp.huminicdev.com

## Diff Reference
No previous attempt.

---

## ENTRY GATE VERDICT

**ENTRY GATE: APPROVED**

**Gate:** Ghost Entry Gate
**Date:** 2026-03-27
**Sprint:** T-016 — Integration Verification

### Checks

| Check | Result | Notes |
|-------|--------|-------|
| A1: Dependencies complete | PASS | T-013 assessed (11/12, BL-078 mobile), T-014 retested 12/12, T-015 12/12, T-022f 11/11. sprints.json status not updated (bookkeeping gap, non-blocking). |
| A2: Worktree clean | PASS | No uncommitted changes in client/src/, server/, shared/. |
| A4: Pre-exec exists | PASS | evidence/T-016/pre-execution-report.md present. |
| A5: ACs defined | PASS | 11 acceptance criteria, clear and testable. |
| A6: Test plan | PASS | API + MCP calls against dev.huminicdev.com and mcp.huminicdev.com. |
| A7: UI changes | PASS | None declared — pure integration testing. Correct. |
| A8: Declared files match | PASS | Pre-exec and sprints.json both list real-integrations.spec.ts, live-comms.spec.ts. Both exist on disk. |

### Notes
- sprints.json dependency statuses (T-013, T-014, T-015, T-022f) still show `planned` instead of `complete`. Activity log evidence confirms all were tested and assessed. Recommend updating sprints.json as housekeeping.
- T-016 is test-only (no code changes). Risk is low. Proceed.
