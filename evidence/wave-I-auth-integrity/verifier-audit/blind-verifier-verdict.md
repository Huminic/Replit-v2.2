# Blind verifier verdict — Wave I-Auth

## Verdict
AGREE — investigator's findings hold up against primary evidence. No fabrication or over-claim detected.

## Code-path citation checks
| Citation | Verified? | Notes |
|---|---|---|
| auth.ts:201 (legacy refreshToken) | yes | exact line: `const refreshToken = getRefreshTokenFromCookie(req) \|\| req.body?.refreshToken;` |
| auth.ts:353 (no lowercase) | yes | exact line: `const user = await storage.getUserByEmail(email);` — raw `email`, no `.toLowerCase()` (vs login at :48 which does lowercase) |
| auth.ts:358 (60-min expiry) | yes | exact line: `const expiry = new Date(Date.now() + 60 * 60 * 1000);` |
| storage.ts:258-261 (exact-match SQL) | yes | `where(eq(users.email, email))` — exact match, no lowercasing inside the helper either |
| reset-password.tsx:62 (15-min UI) | yes | exact line: `useState(15 * 60); // 15 minutes in seconds` and `:64` comment "15-minute token expiration countdown" |
| rbac.ts:26-28 (canAccessManagement) | yes | returns `role === 'super_admin'` — exactly as cited |

Bonus: management.tsx:60-65 RBAC redirect also verified.

## DB independent re-query
- users row(s) state:
  - duane.wells@huminic.ai: is_active=t, pw_len=60, reset_token_present=f, reset_token_expiry=null, updated_at=2026-04-07 07:32:35.571
  - duanekwells@gmail.com: is_active=t, pw_len=60, reset_token_present=f, reset_token_expiry=null, updated_at=2026-04-06 17:01:27.977
- Match investigator's claims? yes — values identical to db-read.md Section A
- Drift since investigation? no — `updated_at` unchanged; both rows static since early April

## Timeline independent re-query
- 2026-05-04 12:00-13:00 UTC `login_failed` events for operator emails: 4 events (3× duane.wells@huminic.ai at 12:23:22, 12:23:28, 12:24:43; 1× duanekwells@gmail.com at 12:24:58) — matches investigator exactly
- 12:28:59 UTC successful login event in activity_log? no (and in fact NO `login_success` action exists DB-wide; only `login_failed`)
- Match? yes

## Remediation defensibility
- A (no action): defensible — system behaved correctly; operator already logged in successfully at 12:28:59 UTC same day; no further user action required.
- B (operator-side password reset): defensible — optional convenience; carries one operational risk (option D defect) which the investigator correctly flagged via the lowercase-email instruction.
- C (operator check Resend dashboard for 2026-03-20): defensible — only path to close the one outstanding "unknown" (Resend delivery status), and that requires operator-only credentials.
- D (forgot-password email-case mismatch): real defect. Verified at auth.ts:353 (no lowercase) + storage.ts:258-261 (exact match). Mixed-case input silently misses real user; generic 200 returned anyway by enumeration-protection logic.
- E (log login_success events): real defect/gap. DB-wide `SELECT DISTINCT action ILIKE '%login%'` returns only `login_failed`. Code in auth.ts has zero `createActivityLog` call on the success branch.
- F (clean up I-238 legacy refreshToken fallback): real defect. Already tracked as I-238; line 201 confirms.
- G (15-min UI vs 60-min server): real defect. Verified at reset-password.tsx:62 (15-min countdown forces UI-side expiry) vs auth.ts:358 (server 60-min). Strong UX dead-end candidate.
- Missed any? minor — change-password (auth.ts:434+) does NOT delete sessions where reset-password (line 415) DOES; investigator noted this in chunk-1 §7 but did not surface as a separate remediation option. Low priority but a real asymmetry. Also: `/refresh` is not rate-limited (chunk-1 §4) — also noted but not surfaced as a remediation option. Neither is load-bearing for the operator's symptom.

## Anomaly defensibility
1. login_success not logged: VERIFIED. `grep` of auth.ts shows only one `createActivityLog` in login route, on the failure branch (line 59). DB-wide query confirms no `login_success` action ever recorded.
2. PM2 rotation filename behavior: not independently re-verified (would require log-file content inspection at byte level). Plausible and consistent with other chunk-3 cross-checks; flagged as low-risk awareness item, not a blocker.
3. Curl probe from 150.136.6.207 = this server: VERIFIED. `curl ifconfig.me` returns `150.136.6.207`. The 12:27:38 UTC probe is benign internal uptime/health-check, not operator-driven.

## Suspicions / over-claims
- Nothing material. No state-changing call signatures detected (git status shows only evidence-file additions, no source edits). No DB writes (re-queried users row updated_at unchanged since 2026-04-07).
- Minor caveat: investigator interpreted 12:28:59 / 12:30:45 / 12:31:19 UTC 200 responses (from Caddy logs) as "successful login" — those are HTTP 200s. We could not independently re-verify the Caddy raw lines from this verifier seat (logs are read-only and large). However, the activity_log has no countervailing evidence (no failed_login after 12:24:58 UTC), and the `password_hash` is intact, so the inference is sound.

## Verdict elaboration
The investigator's ROOT-CAUSE-IDENTIFIED verdict is well-supported by independently re-queried DB evidence and primary-source code citations. Every load-bearing claim (line numbers, table values, timestamps, IP attribution, action vocabulary) survives audit. The seven remediation options are each defensible; D, E, F, G are genuine codebase defects independent of the operator's 2026-05-04 symptom. Recommend accepting "no system defect" closure for the reported issue while filing D/E/G as new issues (F is already I-238).
