# Pre-Execution Report: T-017b — Service Campaign & Compliance

**Sprint:** T-017b
**Type:** Autonomous campaign + compliance testing
**Date:** 2026-03-27
**Status:** AWAITING ENTRY GATE

## Objective
Prove service campaign lifecycle and compliance controls. Campaign → CSV → execute → SMS → Nancy responds → appointment. STOP blacklists. After-hours queues. Validates US-005, US-009, US-010, US-012, US-014, US-021.

## Declared Files
- tests/e2e/live-comms.spec.ts
- utilities/elliott-test.ts

## Acceptance Criteria
- T-017b.AC1: Campaign create → CSV → execute → outbound_log sent
- T-017b.AC2: Campaign reply → Nancy responds
- T-017b.AC3: Campaign disconnect stops messages
- T-017b.AC4: After-hours: message queued not sent
- T-017b.AC5: Nancy books appointment → DB
- T-017b.AC6: Elliott calls Nancy → call completes
- T-017b.AC7: STOP → phone blacklisted
- T-017b.AC8: Blacklisted phone → no messages
- T-017b.AC9: Walk-in followup trigger fires

## UI Changes
None.

## Test Plan
Campaign API + TextMagic for SMS + elliott-test.ts for voice.

## Diff Reference
No previous attempt.

---

## Ghost Entry Gate Verdict

**Date:** 2026-03-26
**Result:** CONDITIONAL PASS

| Check | Result | Notes |
|-------|--------|-------|
| Pre-exec exists | PASS | evidence/T-017b/pre-execution-report.md |
| Objective present | PASS | Matches sprint spec T-017b |
| ACs declared | WARN | Pre-exec lists 9 ACs; sprint spec lists 6. AC7 (STOP blacklist), AC8 (blacklisted no-send), AC9 (walk-in followup) are scope additions not in sprint spec |
| Declared files listed | PASS | live-comms.spec.ts, elliott-test.ts — matches spec |
| Worktree clean (sprint scope) | PASS | Dirty worktree is governance/evidence files only; declared sprint files are new, no conflicts |

**Scope creep detected:** 3 ACs (AC7, AC8, AC9) not in sprint spec T-017b. These test STOP/blacklist compliance and walk-in triggers — reasonable for a compliance sprint but not declared in the spec.

**Verdict: T-017b CONDITIONALLY CLEARED.** Dev may execute AC1–AC6 immediately. AC7–AC9 require Captain to either (a) update the sprint spec to include them, or (b) defer them to a separate sprint. Do not ship AC7–AC9 without spec alignment.
