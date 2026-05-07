# Drift-detector verdict — Wave I-Auth close-out

## Verdict
NO DRIFT — investigation respected wave/phase/task/chunk boundaries; no implementation work performed; no cross-wave bleed.

## Phase drift
The work stayed inside Phase 1 (Core Platform — Auth + RBAC + account integrity). Findings touch only auth/RBAC code paths (`server/routes/auth.ts`, `server/auth.ts`, `server/lib/refreshTokenRotation.ts`, `client/src/lib/rbac.ts`, AuthContext, login/forgot/reset pages) and the `users`/`sessions`/`activity_log` tables. No pivot into Phase 9 (Management+Settings security triage — I-244..I-249), Phase 5 (Insights/metrics — Wave 1C/3F territory), Phase 3 (TeamBox), Phase 6 (Marketing), or Phase 11 (release gov). Specifically I-249 (self-deactivation, Phase 9 / Wave 9-Sec) is named only to confirm `is_active=t` and "not exercised" — it is NOT investigated, NOT remediated, and NOT pulled forward.

## Wave drift
Investigation stayed inside Wave I-Auth's READ-ONLY audit scope as defined in the bookend OPENING. All actions were SELECT queries, `grep` over logs, and `pm2 describe` reads. No DB writes, no provider sends, no code edits, no deploys, no PM2 restarts, no branches beyond `wave/1-core/I-auth-integrity`. The Resend hosted dashboard was correctly NOT accessed (operator-owned per OPENING and CLAUDE.md). All remediation candidates that would require writes are surfaced as options for operator decision, not executed.

## Task drift
The active task "Wave I-Auth read-only investigation (4 chunks)" matches what was produced: code map (Chunk 1), DB read (Chunk 2), log inspection (Chunk 3), classification + remediation options (Chunk 4 = `findings.md`). No off-task pivots. Chunk 4 is correctly synthesized into `findings.md` rather than a separate `chunk-I-Auth-4/` directory; this is a layout choice, not a scope drift — content matches the OPENING's "Chunk I-Auth-4: Classify findings… write findings.md."

## Chunk drift
Each chunk's evidence stayed inside its brief: Chunk 1 = behavioral code map only (no SQL, no log inspection); Chunk 2 = SQL SELECTs against `users`/`sessions`/`activity_log` only (no code edits, no log work); Chunk 3 = pm2 + Caddy log grep only (no DB writes, no Resend dashboard hit). Cross-references between chunks (Chunk 2's hypothesis-test table referencing Chunk 1's candidates) are appropriate synthesis, not bleed.

## Remediation-option scope check
A: yes — no-action correctly tagged.
B: yes — operator-only password reset, matches bookend "Any password reset (operator only)".
C: yes — operator-only Resend dashboard check, matches bookend "Resend dashboard access stays with operator".
D: yes — auth.ts:353 case-lowercase fix surfaced as "File new issue", NOT attempted. Bookend explicitly out-of-scope: "Any code edit to server/routes/auth.ts or auth/session middleware."
E: yes — `login_success` activity-log instrumentation surfaced as "File new issue", NOT attempted.
F: yes — I-238 cleanup surfaced as file-or-update-issue, NOT attempted.
G: yes — 15-min UI vs 60-min server timer mismatch surfaced as file-or-update-issue (cross-ref I-165). Touches a UI file (`client/src/pages/reset-password.tsx`) which is protected by `edit-scope-guard.sh`; NOT attempted. Correctly tagged.
Investigator attempted any work themselves? no — only SELECTs, only `grep` over logs, no file edits, no commits, no DB writes, no provider sends.

## Bookend integrity
- OPENING preserved: yes (lines 1-106 of `wave-bookend.md` unchanged from 2026-05-05; mtime 2026-05-06 03:19 reflects an earlier same-day edit, content matches the OPENING contract).
- CLOSING still empty (pending lead synthesis): yes (line 109 "## CLOSING" followed by line 111 "(Section intentionally empty until findings produced. Lead fills using the wave-bookend template's CLOSING section.)").
- Premature merge claim: no — `findings.md` carries verdict ROOT-CAUSE-IDENTIFIED with no merge/wave-close claim. Lead synthesis still required before CLOSING and any merge to main.

## Anomaly tagging
1. login_success not logged — tagged for: issue-file (Option E — "File new issue: log login_success events"). Correct: instrumentation gap, not symptom cause; future Phase 1 work.
2. PM2 rotation filename — tagged as: no-action (logged as observation in Chunk 3 § A "Note on filename convention" for downstream readers; no remediation proposed).
3. Dev/live shared DB — pre-known per CLAUDE.md (TEST-SAFETY MODEL). Correctly recorded as "Expected per project setup" in Chunk 2 § C and findings.md anomaly #3.
4. Curl probe from this server's IP (150.136.6.207) at 12:27:38 — tagged as: no-action ("Benign uptime/health-check pattern, not part of operator's session"). Reasonable; not within Wave I-Auth scope to investigate further. Could optionally be filed-as-issue if operator wants identification of the probe source, but current no-action tag is defensible.

## Cross-wave findings
None — the investigator did no work that belongs to a future wave. UI lockout (G) which would touch `client/src/pages/reset-password.tsx` correctly NOT performed (cross-refs I-165, would be future Wave 9-Sec or dedicated reset-FE wave). Auth.ts fixes (D, F) correctly NOT performed (would be a future Phase 1 code-change wave). Activity-log instrumentation (E) correctly NOT performed (would be future Phase 1 audit-completeness work). I-249 self-deactivation correctly NOT exercised (Phase 9 / Wave 9-Sec territory).

## Recommendation
Wave I-Auth hierarchy-respected? yes — investigation stayed read-only, stayed in Phase 1 / Wave I-Auth / 4-chunk task, all remediation surfaced as operator-decision or file-new-issue items rather than performed, bookend OPENING preserved with CLOSING still empty pending lead synthesis. Lead may proceed to write the audited CLOSING section.
