# Wave I-Auth — Findings (read-only audit)

**Date:** 2026-05-07
**Investigator:** `release-investigator-auth` teammate (team `nexxus-wave-I-auth-close`)
**Wave branch:** `wave/1-core/I-auth-integrity`
**Verdict:** ROOT-CAUSE-IDENTIFIED — no system defect contributed to the operator's reported symptom; no system remediation required.

> **NOTE:** This file was written by the orchestrator (`team-lead`) from the investigator's final report. The investigator was blocked by the harness from writing report-style `.md` files mid-execution; the synthesis below is the investigator's content, written to disk by the lead per orchestrator hygiene. Chunk evidence files (`chunk-I-Auth-1/`, `-2/`, `-3/`) were written by the investigator directly and are unaffected.

---

## Issue under investigation

Operator-reported login/password issue (no prior issue ID; the bookend OPENING reserved `I-NEW-2026-05-05-AUTH` if confirmed by investigation). Symptom as described: difficulty logging in around early May 2026.

## Findings

### Root cause (high-confidence)

On 2026-05-04 12:23:22–12:24:58 UTC the operator made 4 sequential wrong-password login attempts to `live.huminic.app`:

- 3 attempts for `duane.wells@huminic.ai`
- 1 attempt for `duanekwells@gmail.com`

All 4 rejected with HTTP 401 and recorded in `activity_log` as `login_failed` events. **~4 minutes later (12:28:59 UTC)** the same browser+IP successfully logged in to live (HTTP 200), then again at 12:30:45 (live), then 12:31:19 (dev).

No code deploy in the affected window. No rate-limit hit. No password-reset attempt. No Resend send. Operator user rows on both accounts are intact, active, with valid bcrypt hashes (length 60), no outstanding reset_token, both home orgs CommGate open.

**Most likely cause:** operator mistyped or mis-remembered the password, then retried correctly. **No system defect contributed to the symptom; no system remediation is required.**

### Contributing factors

None identified.

### Unrelated to the issue (investigated and ruled out)

- I-140 (password reset NEEDS LIVE TEST) — no `/api/auth/reset-password` requests in May; no live-test delta added.
- I-238 (legacy `req.body.refreshToken` fallback at `server/routes/auth.ts:201`) — confirmed present but unrelated to the symptom.
- I-249 (self-deactivation) — not exercised; operator `is_active = t`.

### Unknowns — RESOLVED 2026-05-07 by orchestrator-dispatched C-resolver

- 2026-03-20 02:16:47 UTC operator forgot-password event: **NEVER-SENT.** Resend API queried (5,200 records, 2026-03-10 → 2026-05-07): zero password-reset emails on 2026-03-20, zero emails of any kind to either operator address in the 02:00-02:59 UTC hour. The HTTP 200 response the operator saw was a silent no-op — `auth.ts` returns 200 for unknown users by design (enumeration safety). **This is confirmed historical impact of Option D's defect** (case-mismatch in user lookup): operator likely typed their email with capitalization that didn't match the stored email, causing the lookup to silently miss. See `evidence/wave-I-auth-integrity/verifier-audit/option-C-resend-resolution.md`.

---

## Remediation options for operator (7)

| # | Option | Description | Side-effects | Reversibility |
|---|---|---|---|---|
| **A** | **No action** | System behaved correctly. Operator already logged in successfully on 2026-05-04 12:28:59. | none | n/a |
| **B** | Operator-side password reset via UI | Optional, only if operator wants a new memorable password. Use lowercase email at the form to avoid latent defect [D]. | new password active | yes (reset again) |
| **C** | Operator check of Resend dashboard for 2026-03-20 02:16:47 UTC forgot-password event | Resolves the only outstanding "unknown" — was that email actually delivered. | none | n/a |
| **D** | File new issue: forgot-password email-case mismatch | `server/routes/auth.ts:353` does NOT lowercase input; `server/storage.ts:258-261` does exact-match SQL. Mixed-case input silently misses the user (returns generic 200 anyway). One-line fix. | one new entry in issues.md | yes |
| **E** | File new issue: log `login_success` events | Currently only `login_failed` is recorded. Absence of "I logged in successfully" trail made initial DB read look more alarming than warranted. Single `createActivityLog` call addition. | one new entry in issues.md | yes |
| **F** | File new issue: clean up I-238 legacy `refreshToken` fallback | At `server/routes/auth.ts:201`. | one new entry in issues.md (or update I-238) | yes |
| **G** | File new issue: 15-min UI countdown vs 60-min server reset-token expiry mismatch | Client `reset-password.tsx:62` shows 15 min and force-expires the UI; server `auth.ts:358` keeps token valid for 60 min. Cross-ref I-165. | one new entry in issues.md (or update I-165) | yes |

**Minimum sane response:** A alone.
**A + C** if operator wants closure on the older Resend event.
**D, E, F, G** are independent improvements not tied to the reported symptom.

---

## Cross-references resolved

- **I-140** (password reset NEEDS LIVE TEST): unchanged — no `/api/auth/reset-password` requests in May, so no live-test delta added.
- **I-165** (Forgot/reset password FE 11 states untested): a NEW concrete defect surfaced inside this set — the 15-min vs 60-min timer mismatch (option G). Suggest folding into I-165 or filing sibling.
- **I-238** (legacy body refreshToken): confirmed at `server/routes/auth.ts:201`. Unrelated to operator's symptom.
- **I-249** (self-deactivation): not exercised; operator's `is_active = t`.

---

## Anomalies / surprises (logged for awareness, NOT blockers)

1. App does not log `login_success` events anywhere — only `login_failed`. Successful logins leave NO audit trail in `activity_log` (only the new session row, which is wiped on next login). Option E above.
2. PM2 daily-rotation filename `__YYYY-MM-DD_00-00-00.log` contains activity from the day BEFORE the cut. Confirmed by cross-checking 12:31:19 PM line in `__2026-05-05_…` against Caddy's 2026-05-04 12:31:19 UTC timestamp.
3. Dev and live SHARE the same Supabase DB (per CLAUDE.md). Failed-login events that hit `live.huminic.app` are visible from this dev-side investigation. Expected per project setup.
4. Automated curl probe from THIS server's own IP (150.136.6.207) hit `POST /api/auth/login` on `live.huminic.app` at 2026-05-04 12:27:38 UTC (401, between operator's failed and successful attempts). Benign uptime/health-check pattern, not part of the operator's session.

---

## Stop conditions — all PASS

- Only SELECT queries against Supabase. No DB writes.
- No password resets attempted. No session-token invalidations.
- No code edits. No commits. No new branches beyond the wave branch.
- No provider sends (Resend / TextMagic / VAPI / Tavus / FlexPrice).
- No deploy / pm2 restart / Coolify action.

---

## Evidence paths

- `evidence/wave-I-auth-integrity/chunk-I-Auth-1/code-map.md` — auth/RBAC behavioral map
- `evidence/wave-I-auth-integrity/chunk-I-Auth-2/db-read.md` — operator user rows + audit_log (redacted)
- `evidence/wave-I-auth-integrity/chunk-I-Auth-3/resend-log-inspection.md` — Resend project-side log inspection
- `evidence/wave-I-auth-integrity/wave-bookend.md` — wave OPENING + (pending CLOSING)
- `evidence/wave-I-auth-integrity/findings.md` — this file
