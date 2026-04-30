# Chunk 1A — Sprint-level Evidence Summary

**Date:** 2026-04-30
**Operator:** confirmed pre-flight
**Scope:** daily recap email + SMS appointment-intent email

## Two deltas of proof

### Delta 1 — runnable test result
- `npx vitest run tests/unit/dailyRecap.test.ts` → **31/31 passing**
- `npx vitest run tests/unit/` → **443 passed, 2 pre-existing skips, 0 failed** (was 428 before chunk 1A)
- `npx tsc --noEmit` → clean

### Delta 2 — independent observation (DB row from real test-lane fire)
- `evidence/stabilization-sprint-2026-04-30/1A/sprint/e2e-output.txt`: both new emails fired, routed to `duanewells@icloud.com` (allowlisted internal_operator); `outbound_log` rows tagged `[testlane:1A-2026-04-30]` confirmed by SQL query in same evidence file
- `evidence/stabilization-sprint-2026-04-30/1A/sprint/e2e-output-v2.txt`: idempotency confirmed — second invocation returns `ok: false, reason: 'duplicate'` for both senders

## Reviewer verdicts

- **scope-guardian** (declared scope): `.claude/state/active-scope.txt` — files actually modified all in declared scope (server/services/, server/routes/sms.ts, tests/, issues.md)
- **integration-safety**: PASS — 7/7 items confirmed (CommGate, two-way fail-closed, recipient routing, idempotency, no Resend bypass, classifier insertion safety, HTML escaping)
- **code-reviewer** (after addressing 5 required changes): APPROVE

## What changed

| File | Status | LoC |
|---|---|---|
| `server/services/dailyRecapService.ts` | NEW | ~330 |
| `server/services/dailyRecapDecision.ts` | NEW | ~100 |
| `server/services/notificationService.ts` | extended | +330 |
| `server/services/scheduler.ts` | extended | +10 |
| `server/routes/sms.ts` | extended | +130 |
| `tests/unit/dailyRecap.test.ts` | NEW | ~480 |
| `issues.md` | extended | +1 row (I-NEW-2026-04-30-A) |

## Bug fix discovered during testing

`tzOffsetMsAt` in `dailyRecapService.ts` did not normalize Intl's `hour="24"` for midnight UTC. New unit test "handles UTC itself" caught this; fix added per existing `scheduler.ts:256-257` precedent.

## Defaults / safety posture

- `settings.dailyRecapEnabled` default OFF for all 7 orgs — no recap fires until operator opts an org in
- `settings.dailyRecapHour` default 18 (6 PM local)
- Both senders go through CommGate (`outbound_enabled && email_enabled`)
- Both senders use `applyTestLaneOverrideRaw` (two-way fail-closed)
- Both senders go through `resolveAdminRecipients` (no caller-supplied `to:`)
- Both senders idempotent via `outbound_log` substring check
- All customer/LLM-controlled fields HTML-escaped before email interpolation

## Accepted debt

- `I-NEW-2026-04-30-A` — SMS classifier prompt-injection (bounded to admin notification email; no SMS reply / DB write / VIN action). Filed in issues.md.
