# Cross-Sign — R-017 (Backend Fixes)

**Sprint ID:** R-017
**Timestamp:** 2026-03-27T03:40:27Z

## Implementing Role: orchestrator

**Scope:** 5 backend fixes across auth, webhooks, and outbound pipeline
**Changes verified:**
- [x] server/routes/auth.ts — password reset flow fixed, error logging improved
- [x] server/storage.ts — clearResetToken() method added with raw SQL NULL
- [x] server/routes/webhooks.ts — VAPI schema accepts both formats, leadSourceName added
- [x] server/outbound.ts — business hours + blacklist checks in CommGate
- [x] TypeScript compilation: PASSED (0 errors)
- [x] Integration tests: 19/21 passed (2 pre-existing failures)

## Reviewing Role: enforcer

**Verification checklist:**
- [x] All 5 issues addressed with code changes
- [x] No unnecessary files modified
- [x] Changes are surgical — minimal surface area
- [x] Business hours default (8-21) is TCPA-safe
- [x] Blacklist check does not introduce N+1 queries
- [x] VAPI webhook handles both old and new payload formats
- [x] VIN lead source is configurable per-org, not hardcoded
- [x] Password reset uses explicit SQL NULL, not type-cast workaround
- [x] Build passes cleanly
- [x] No regressions in test suite

## Verdict: APPROVED
