# Chunk 2B — Sprint-level Evidence Summary

**Date:** 2026-04-30
**Scope:** auth/config hardening — I-236, I-237, I-269, I-256
**External-send paths added:** none. This chunk only hardens INPUTS.

## Two deltas of proof

### Delta 1 — runnable test result
- `npx tsc --noEmit` → clean
- `npx vitest run tests/unit/` → **452 passed, 2 pre-existing skips, 0 failed** (no regressions; chunk 2B added no new tests because all four fixes are small inline-guard changes covered by existing integration paths)

### Delta 2 — independent observation (code citations confirm fixes)
- I-236: 3 webhook handlers (VAPI/Tavus/TextMagic) gate on `NODE_ENV === "production"` and return 503 when secret unset
- I-256: `activity_log` row `sms_ai_no_active_agent` written on no-active-agent return path
- I-269: `substituteOrgContext` applied to `agent.instructions` in sms.ts (parity with chat.ts:168)
- I-237: verified pre-fixed at seed.ts:8 (`crypto.randomUUID()` fallback)

## Reviewer verdicts

- **scope-guardian** (declared scope at `.claude/state/active-scope.txt`): files modified all in declared scope (server/routes/webhooks.ts, server/routes/sms.ts, issues.md)
- **code-reviewer**: APPROVE
- **integration-safety**: PASS (7/7) — no new external-send paths; production-scoped gate; no PII leak; activity_log write non-blocking

## What changed

| File | Status | LoC | Issue |
|---|---|---|---|
| `server/routes/webhooks.ts` | I-236 (VAPI + Tavus) | +24 (-6) | I-236 |
| `server/routes/sms.ts` | I-236 + I-256 + I-269 | +30 (-6) | I-236, I-256, I-269 |
| `issues.md` | closed 4 items | -4 +4 | I-236, I-237, I-256, I-269 |

## Issues closed by this chunk

- **I-236** — webhook secret enforcement now blocks in production
- **I-237** — verified pre-fixed (seed.ts uses crypto.randomUUID); closed
- **I-256** — silent AI outage when no SMS agent now writes activity_log
- **I-269** — `{{dealershipName}}` substitution now applied in sms.ts AI path

