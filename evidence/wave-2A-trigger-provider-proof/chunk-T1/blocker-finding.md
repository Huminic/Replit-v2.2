# Wave 2A-T Chunk T1 — Original-spec blocker finding (2026-05-07)

**Status:** ORIGINAL T1 SPEC ABORTED — wave revised to "Direct Outbound Provider Proof" mid-stream.
**Builder:** general-purpose subagent dispatched ~16:25 UTC; halted before any code, DB writes, or commits.

## Original spec (now superseded)

The wave bookend's original Chunk T1 specified: "Inject a TESTLANE-marked lead matching after-hours trigger conditions, call `evaluateAfterHoursTrigger(serraHondaOrg)` directly, capture TextMagic provider message_id."

## 4 blockers identified

1. **Function not exported.** `evaluateAfterHoursTrigger` at `server/services/triggerService.ts:193` is module-private. Only `runTriggerEvaluation`, `startTriggerScheduler`, `stopTriggerScheduler` are exported. Direct invocation per spec is impossible without editing triggerService.ts (forbidden by wave bookend).

2. **Spec/code design mismatch.** `evaluateAfterHoursTrigger` (lines 287-304) **does not call `processOutboundSend`** during after-hours. By design (TCPA compliance), it ONLY writes a `trigger_after_hours_deferred` activity_log row. The check-in trigger picks deferred leads up the next business day. Quote from code: *"Defer send — outside business hours, do NOT send now (TCPA compliance). The check-in trigger will pick this lead up during business hours."* The bookend's expected proof artifact (TextMagic message_id) is **unattainable by design** for this trigger.

3. **serra-honda config disables T1.** DB query (read-only) showed `organizations.settings.afterHoursTriggerEnabled = "false"` for serra-honda; only `checkInTriggerEnabled` is true. Trigger short-circuits at line 197. Flipping the flag is a non-TESTLANE-lead DB write to a real org's settings — out of scope per the bookend's stop conditions.

4. **Currently within business hours.** Now is 2026-05-07 14:51 ET; serra-honda window is 8:00–21:00 ET. Trigger short-circuits at line 204 (`bh.within → return 0`) regardless of other conditions.

## Builder's options presented (3)

- Option A — Redefine T1 proof artifacts (accept activity_log row instead of TextMagic message_id; export the function as scope-additive change; mock business-hours clock; flip serra-honda flag)
- Option B — Rescope T1 to check-in trigger only (drop after-hours; check-in does call processOutboundSend; still needs export)
- Option C — Use exported `runTriggerEvaluation()` (iterates all orgs; risks recipient leakage if other orgs have real leads matching trigger conditions; UNSAFE)

## Orchestrator decision (advocate)

**REVISED WAVE SCOPE:** Pivot Wave 2A-T to **Direct Outbound Provider Proof** via `processOutboundSend` directly. Builder bypasses the private trigger evaluator entirely; mimics the trigger's downstream payload shape; proves the launch-critical TextMagic + Resend integration through the testlane gate.

Trigger-conditional-logic proof is queued as future **Wave 2A-Pure-Triggers** (needs export approval + business-hours mocking). Documented as a v2.2 follow-up.

## Files this builder touched

NONE. No code, no DB writes, no commits, no SMS sent.

## Time spent on this dispatch

~150 seconds (worktree initialization + 4 reads + report).
