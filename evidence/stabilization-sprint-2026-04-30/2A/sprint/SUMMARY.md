# Chunk 2A — Sprint-level Evidence Summary

**Date:** 2026-04-30
**Scope:** server-only hardening — I-248, I-252, I-253, I-254
**External writes:** none

## Two deltas of proof

### Delta 1 — runnable test result
- `npx vitest run tests/unit/businessHours.test.ts` → **9/9 passing** (new file)
- `npx vitest run tests/unit/` → **452 passed, 2 pre-existing skips, 0 failed** (was 443 pre-chunk)
- `npx tsc --noEmit` → clean

### Delta 2 — independent observation (regression-prevention)
- I-248: `Number.isFinite(result.currentHour)` test passes for invalid TZ "BAD/TZ" — the original NaN regression that permanently blocked outbound SMS is now reproducibly prevented (test asserts `0 <= currentHour < 24` always).
- I-252: existingMessages array now `.slice(-20)` capped (verified via grep `slice(-20)` at server/routes/public.ts:317).
- I-253: try/catch present at hunchService.ts:73 and webhooks.ts:80 — full unit suite green, no regressions in existing weeklyReport / scheduler / vapiInboundGuard tests.
- I-254: `storage.getConversation` re-check at sms.ts immediately before `processOutboundSend` — code review APPROVE.

## Reviewer verdicts

- **scope-guardian** (declared scope): `.claude/state/active-scope.txt` — files touched all in declared scope (server/outbound.ts, public.ts, hunchService.ts, webhooks.ts, sms.ts, issues.md, tests/unit/businessHours.test.ts)
- **code-reviewer**: APPROVE — fixed two cosmetic items (comment line citation + filed I-254 test-debt as I-NEW-2026-04-30-C)
- **integration-safety**: SKIPPED per pre-flight (no external-write boundary touched)

## What changed

| File | Status | LoC |
|---|---|---|
| `server/outbound.ts` | I-248 | +20 (-12) |
| `server/routes/public.ts` | I-252 | +5 (-1) |
| `server/services/hunchService.ts` | I-253 part 1 | +9 (-2) |
| `server/routes/webhooks.ts` | I-253 part 2 | +13 (-1) |
| `server/routes/sms.ts` | I-254 | +9 |
| `tests/unit/businessHours.test.ts` | new | ~110 |
| `issues.md` | filed I-NEW-2026-04-30-C | +1 row |

## Accepted debt

- **I-NEW-2026-04-30-C** — I-254 race-condition has a self-evident fix but no targeted unit test (would require storage-mocking on the SMS handler). Filed in issues.md.

## Issues closed by this chunk (to be marked RESOLVED in issues.md)

- I-248 — invalid timezone silently blocks all SMS for an org
- I-252 — widget chat unbounded message history
- I-253 — JSON.parse unguarded in hunchService and webhooks
- I-254 — AI race after human takeover
