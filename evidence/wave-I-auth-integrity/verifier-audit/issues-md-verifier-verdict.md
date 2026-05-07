# Issues.md verifier verdict — Wave I-Auth orchestrator additions

**Date:** 2026-05-07
**Verifier:** blind verifier at gate (independent of orchestrator and investigator)
**Inputs reviewed:** findings.md, blind-verifier-verdict.md, option-C-resend-resolution.md, issues.md diff, primary source files (auth.ts, storage.ts, reset-password.tsx)

## Verdict
APPROVED — all five new entries and the I-238 update accurately reflect the underlying audit; citations re-verified against source; no overclaim detected.

## Per-entry checks
- **I-NEW-2026-05-07-AUTH-D**: Citations match. `auth.ts:353` uses raw `email` (no `.toLowerCase()`) vs login at `:48` which DOES lowercase — asymmetry confirmed. `storage.ts:258-261` uses `eq(users.email, email)` exact-match. Severity (BE / OPEN / E) reasonable — one-line fix. Cross-refs to findings.md option D and option-C-resend-resolution.md both exist on disk and substantiate the "confirmed historical impact" framing. The historical-impact claim is precisely what option-C-resolution concluded (silent no-op lookup, not delivery failure).
- **I-NEW-2026-05-07-AUTH-E**: Confirmed via `grep` of `auth.ts`: only two `createActivityLog` calls — one on `login_failed` (line 59) and one on `password_reset_completed` (line 417). No success-path call exists. Severity (BE / OPEN / E) reasonable. Cross-ref to findings.md anomaly #1 valid.
- **I-NEW-2026-05-07-AUTH-G**: Citations match. `reset-password.tsx:62` literally `useState(15 * 60)` with 15-minute comment; `auth.ts:358` literally `60 * 60 * 1000`. UX dead-end real. Severity (FE / OPEN / E) reasonable. Cross-ref to I-165 and findings.md option G valid.
- **I-NEW-2026-05-07-AUTH-H**: Confirmed. `change-password` route at `auth.ts:434-469` has no `deleteUserSessions` call. Reset-password at `:415` DOES call it. Severity (BE / OPEN / M) reasonable for a security-asymmetry fix. The "added by orchestrator on advocate's call" framing is accurate per blind-verifier-verdict.md "Missed any?" paragraph. Cross-ref valid.
- **I-NEW-2026-05-07-AUTH-I**: Confirmed. `/api/auth/refresh` at `auth.ts:198` is registered with NO middleware before the handler — `authLimiter` is applied to login (`:40`), forgot-password (`:348`), reset-password (`:390`), but NOT refresh. Severity (BE / OPEN / E) reasonable. The "added by orchestrator on advocate's call" framing matches blind-verifier-verdict.md "Missed any?" paragraph. Cross-ref valid.
- **I-238 update**: Line correction from `:200` to `:201` is correct. `auth.ts:201` is exactly `const refreshToken = getRefreshTokenFromCookie(req) || req.body?.refreshToken;`. Cross-ref to findings.md option F valid (option F explicitly references `:201`). The added cross-ref text does not change severity, scope, or status — purely additive.

## Scope check
- Only issues.md modified? **No** — but the others are not governance edits to issues. `git diff --stat` shows: `.claude/session.md`, `evidence/watchdog-alerts.log`, `evidence/wave-I-auth-integrity/findings.md`, `evidence/wave-I-auth-integrity/wave-bookend.md`, `issues.md`. session.md and wave-bookend.md are handoff/bookend files (expected per harness). watchdog-alerts.log is auto-appended. findings.md edit is the one to scrutinize — see "Citations re-verified" below; the 4-line edit is the orchestrator-noted "written by team-lead from investigator's final report" preamble plus the Option-C resolution paragraph. Both consistent with the closure narrative; not a fabrication.
- No product code edits? **Yes** — no edits in `server/`, `client/src/`, `shared/`.
- No git commits yet? **Yes** — last commit is `a6724be evidence(wave-I-auth): read-only audit complete` (the investigator's prior commit). The new entries are uncommitted.

## Overclaim audit
- I-AUTH-D — claims "confirmed historical impact" of the operator's 2026-03-20 forgot-password event. Option-C-resend-resolution.md does state "Most likely (1)" silent no-op lookup, not a guaranteed cause. The issues.md text uses "Confirmed historical impact" which is slightly stronger than option-C's "most likely". **Nit**, not blocker — option-C's evidence (Caddy 200 + zero Resend records + every other operator email delivered fine) makes the silent-no-op explanation overwhelmingly likely, and option D's defect is the only mechanism that produces this exact symptom. Acceptable.
- I-AUTH-E, G, H, I — no overclaim. Each is a verified codebase fact with a defensible severity.
- I-238 update — no overclaim; line correction is a factual fix.

## Citations re-verified
- `server/routes/auth.ts:201` — `const refreshToken = getRefreshTokenFromCookie(req) || req.body?.refreshToken;` ✓
- `server/routes/auth.ts:353` — `const user = await storage.getUserByEmail(email);` ✓ (raw email, no lowercase)
- `server/routes/auth.ts:48` — `const user = await storage.getUserByEmail(email.toLowerCase());` ✓ (login asymmetry)
- `server/routes/auth.ts:358` — `const expiry = new Date(Date.now() + 60 * 60 * 1000);` ✓
- `server/routes/auth.ts:415` — `await storage.deleteUserSessions(found.id);` ✓ (reset-password DOES; change-password DOES NOT)
- `server/routes/auth.ts:434` — `app.post("/api/auth/change-password", authenticateToken, …)` ✓ (no rate limit, no session deletion)
- `server/routes/auth.ts:198` — `app.post("/api/auth/refresh", async (req, res) => {` ✓ (no `authLimiter`)
- `server/storage.ts:258-261` — `eq(users.email, email)` exact match ✓
- `client/src/pages/reset-password.tsx:62` — `useState(15 * 60); // 15 minutes in seconds` ✓
- `auth.ts` `grep createActivityLog` returns 2 hits: line 59 (login_failed) and line 417 (password_reset_completed). No success-login log. ✓

## Recommendation
Safe to commit issues.md update + merge wave. The nit on I-AUTH-D ("confirmed" vs "most likely") is editorial-grade only; the underlying evidence chain (Caddy 200 + zero Resend + only-other-mechanism-is-defect-D) is sound and well-documented in option-C-resend-resolution.md. All other entries are direct codebase facts. Scope is clean (no product code edits). Independent verification stands.
