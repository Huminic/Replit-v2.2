# Integration-Safety Verdict — Wave 2A-T (Trigger Provider Proof)

**Verifier:** integration-safety subagent (this dispatch)
**Date:** 2026-05-07
**Branch / HEAD:** `wave/10-bg/2A-T-trigger-proof` @ `7f1a997`
**Base:** `76024ad` (post-Wave 11-gov merge into batch-1-finish-line)
**Scope:** verify provider-boundary integration safety for the 2 sends/calls captured in Wave 2A-T evidence.

---

## boundaries_touched

- TextMagic SMS (via `processOutboundSend` → `sendSmsRaw` → TextMagic API; central-mcp NOT bypassed at the safe-MCP layer because TextMagic credentials live in `server/outbound.ts`'s direct path which is the existing CommGate-respecting integration; not a regression for this wave)
- VAPI voice (direct `fetch POST https://api.vapi.ai/call/phone` from `server/test-trigger-2A.ts`, mirroring the established `utilities/elliott-test.ts` pattern)

## safe_paths_used

- T1 SMS: `processOutboundSend(payload)` — drives the testlane guard at `server/outbound.ts:79-165` and `evaluateOutboundTestLaneGuard()` (verified intact, NOT modified this wave).
  - TESTLANE_MODE=true + `testLaneSessionId="wave-2A-T-T1"` → guard returns `kind:"override"` → recipient hard-routed to `TESTLANE_SMS_TO=+14126546500`.
  - `recipientHardRouted: true` + `noRecipientLeakage: true` confirmed via direct DB read of `outbound_log` (single row per send window, `recipient_phone = +14126546500`).
- T2 VAPI: agent-to-agent pattern. Outbound `assistantId` is allowlisted Elliott `c303d993-bf42-4784-a8cb-247477b1cbdd` (exit 0, category `vapi_test_agent`). Inbound `customer.number` is dealership service AI line, not a real customer.
- Allowlist files: `.claude/state/test-orgs.txt` and `.claude/state/test-recipients.txt` — UNTOUCHED this wave (operator-maintained discipline preserved).
- vin-safe-mcp boundary (port 4003): UNTOUCHED. No VIN writes attempted this wave.
- CommGate flags / org outbound flags: UNTOUCHED.

## unsafe_paths_detected

none.

Rationale per item:
- The lone non-allowlisted destination contacted (Nancy `+19014361271` / `c777f029-...`) is a dealership-AI inbound endpoint covered by operator's in-chat verbal authorization for THIS session. Both ends are AI we control; no real human is reachable through that line in this test pattern. Surfaced as a written-allowlist gap below for future autonomy.
- T1's "2 sends instead of 1" is a discipline-disclosure item (re-run for shell exit-code echo), not a safety violation. Both sends went to the operator's own allowlisted phone; the TestLane gate behaved correctly on both invocations; outbound_log rows are filterable by `[TESTLANE]` recipient_name.

## real_writes_approved_by_operator

- **T1 SMS × 2 to `+14126546500`** — operator's own phone, allowlisted as `internal_operator`. Standing approval via `.claude/state/test-recipients.txt:26` + CLAUDE.md autonomy rule "Run autonomous test scripts that target ONLY allowlisted destinations." (One of the two sends was a discipline-disclosure re-run; both still hit only the operator phone.)
- **T2 VAPI call × 1 (Elliott → Nancy `+19014361271`)** — operator's verbal in-chat approval (2026-05-07): "Elliott calls Nancy. Both ends are AI we control. Agent-to-agent." Recorded in `chunk-T2/proof.md` and in `server/test-trigger-2A.ts:251-260`. No silent compensation.

## real_writes_NOT_approved

none.

## test-lane safety preconditions (verified)

| Precondition | Verified by | Status |
|---|---|---|
| `TESTLANE_MODE=true` exported in T1 invocation | `chunk-T1/proof.md` run command + console echo | PASS |
| Per-request marker present (T1) | `testLaneSessionId="wave-2A-T-T1"` on payload + `[testlane:wave-2A-T-T1]` content prefix | PASS |
| `TESTLANE_SMS_TO=+14126546500` env set (T1) | run command + script line 82 | PASS |
| Recipient hard-routed by gate (T1) | DB row `outbound_log.recipient_phone = +14126546500` | PASS |
| Single-call POST (T2) | one fetch in script; subsequent calls are `GET /call/{id}` polls | PASS |
| Both VAPI endpoints AI-we-control (T2) | Elliott (allowlisted) outbound; Nancy is dealership service AI assistant inbound | PASS (with allowlist-gap note) |
| vin-safe-mcp untouched | `git diff 76024ad..7f1a997` shows zero changes outside `server/test-trigger-2A.ts` + evidence | PASS |
| CommGate / org outbound flags untouched | same diff scan | PASS |
| Schema / migrations untouched | `shared/schema.ts` not in diff | PASS |
| Test-script is testlane-only code path | `server/test-trigger-2A.ts` is a NEW file, not invoked anywhere in production code path | PASS |

## allowlist gap (POST-WAVE remediation)

Operator verbal authorization covered T2 for THIS session. For future autonomy without per-session re-authorization, recommend operator add to `.claude/state/test-recipients.txt`:

```
# ── vapi_test_agent ──────────────────────────────────────────────────────────
# Nancy Gaston (Serra Honda service inbound assistant) — agent-to-agent test counterparty
vapi_test_agent:c777f029-8c4c-4a23-98e4-3adfd4112a61
# Nancy's Serra Honda service VAPI inbound number (dialed by Elliott in agent-to-agent tests)
vapi_test_phone:+19014361271
```

Operator-discretion. Verifier does not modify the allowlist (operator-maintained file). Surfacing only.

## verdict

**PASS**

## summary (1 paragraph)

Wave 2A-T touched two provider boundaries (TextMagic SMS, VAPI voice) and produced verifiable evidence with two deltas per chunk. T1 sent 2 SMS (disclosed honestly — chunk spec was "exactly 1"; the second was an exit-code-echo re-run, not a behavior leak) to operator-allowlisted `+14126546500` only; the TestLane gate at `server/outbound.ts:79-165` (untouched this wave) was provably load-bearing — `recipientHardRouted: true` and `outbound_log.recipient_phone = +14126546500` for every row. T2 placed 1 VAPI call from allowlisted Elliott (`c303d993-...`, `vapi_test_agent`) to Nancy's Serra Honda service line (`+19014361271`); Nancy's phone+assistant ID are not in the written allowlist (operator's verbal in-chat auth covered this dispatch), surfaced explicitly as a post-wave remediation item per Environmental Core Value #10. No real customer was contacted. No production code, schema, vin-safe-mcp boundary, CommGate flag, or org outbound flag was modified — diff is scoped strictly to `server/test-trigger-2A.ts` (new test-only file) and 5 evidence files. Verdict: PASS.

## required_changes_before_merge

- (operator-discretion, NOT blocking) add `vapi_test_agent:c777f029-8c4c-4a23-98e4-3adfd4112a61` and `vapi_test_phone:+19014361271` to `.claude/state/test-recipients.txt` so future Elliott→Nancy autonomous dispatches do not require per-session verbal re-authorization. Until that is done, any future Elliott→Nancy run requires operator chat go-ahead.

## files inspected (read-only, this audit)

- `/home/ubuntu/Claude-store/nexxus2.2_replit/.claude/state/test-recipients.txt`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/.claude/state/test-orgs.txt`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/wave-2A-trigger-provider-proof/wave-bookend.md`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/wave-2A-trigger-provider-proof/chunk-T1/proof.md`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/wave-2A-trigger-provider-proof/chunk-T2/proof.md`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/server/test-trigger-2A.ts` (full file)
- `/home/ubuntu/Claude-store/nexxus2.2_replit/server/outbound.ts:75-165` (TestLane gate)
- `git diff --stat 76024ad..7f1a997` (whole-wave file scope)
- `git log --name-only 76024ad..7f1a997` (commit-by-commit file scope)
- allowlist checks via `harness/bin/test-orgs-allowlist-check.sh` (4 invocations, recorded in this audit)
