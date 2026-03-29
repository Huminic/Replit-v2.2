# Pre-Execution Report: T-019 — Chat & Agent Usability + Edge Cases

**Sprint:** T-019
**Type:** AI conversation quality testing via API
**Date:** 2026-03-27
**Status:** AWAITING ENTRY GATE

## Objective
Prove every AI agent serves its intended purpose. Chat resume works, org context used, each agent responds on-topic. Edge cases handled. Validates US-006, US-016, US-026, US-029, US-030.

## Declared Files
- tests/e2e/s1-ai-chat.spec.ts

## Acceptance Criteria
- T-019.AC1: Chat resume loads previous messages
- T-019.AC2: Chat uses org context
- T-019.AC3-AC5: Sales agents (Data Guru, Coach, Writer)
- T-019.AC6: Nancy service questions
- T-019.AC7: 5 marketing agents respond on-topic
- T-019.AC8: Chat history "Chat — X ago" format
- T-019.AC9: Agent cards across pages show name + description
- T-019.AC10-AC13: Edge cases
- T-019.AC14: Filter chips not light blue

## UI Changes
None.

## Test Plan
API chat interactions + Playwright MCP for UI verification. Use API directly for agent chats to avoid session instability (BL-081).

## Diff Reference
No previous attempt.

---

## Ghost Entry Gate Verdict

**Result:** PASS WITH NOTE
**Timestamp:** 2026-03-27T02:12Z
**Gate Officer:** Ghost

### Checks
| Check | Status | Notes |
|-------|--------|-------|
| Pre-exec exists | PASS | evidence/T-019/pre-execution-report.md |
| Objective stated | PASS | AI chat quality and agent usability verification |
| ACs declared | PASS | 14 ACs listed (spec has 9; AC10-AC14 are additive edge cases) |
| Declared files listed | NOTE | Pre-exec declares 1 file (s1-ai-chat.spec.ts); spec declares 2 (+ s3-sales.spec.ts) |
| Worktree clean for declared files | PASS | Files do not yet exist (new tests, expected) |
| No UI changes declared | PASS | Read-only testing sprint |

### Notes
- **File discrepancy:** Sprint spec declares `tests/e2e/s3-sales.spec.ts` as a second declared file, but the pre-exec report only lists `tests/e2e/s1-ai-chat.spec.ts`. Dev should declare both or Captain should clarify if s3-sales.spec.ts is in scope.
- Pre-exec lists 5 ACs beyond sprint spec (AC10-AC13 edge cases, AC14 filter chip color). Additive, not conflicting.
- Sprint depends on T-018 per spec. If T-018 and T-019 run in parallel, Captain must confirm no data dependency.

**T-019 is cleared for execution.** Captain should resolve the s3-sales.spec.ts file scope question before dev begins.
