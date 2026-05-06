# Wave Bookend — I-Auth — Auth/Account Integrity Audit (READ-ONLY)

## OPENING

**Wave:** I-Auth
**Phase:** 1 — Core Platform (Auth + RBAC + account integrity)
**Date opened:** 2026-05-05
**Goal (plain English, 1 sentence):** Investigate the operator's recent login/password issue without changing any state, classify findings, and present remediation options for operator decision.
**Why necessary for v2.2 release:** Account integrity for the operator's own credentials is a release-blocker if broken. Investigation must be read-only because credential resets, session-token invalidation, and provider sends are all explicit-approval actions per CLAUDE.md.

### Existing evidence to reuse

- `evidence/stabilization-sprint-2026-05-01/p0-pr-merge-verification/` — RBAC and route-guard behavior post-PR-#6.
- `client/src/lib/rbac.ts:26-28` — `canAccessManagement` helper (and the surrounding RBAC helpers in the same file).
- `client/src/pages/management.tsx:60-65` — RBAC redirect proof.
- `issues.md` — I-140, I-165 (password reset; NEEDS LIVE TEST), I-238 (legacy `refreshToken` body fallback), I-249 (self-deactivation).

### Current status of this component

PARTIAL — RBAC + redirect-after-login proven (PR #6); password-reset email/token flow NEEDS LIVE TEST (I-140/I-165); operator-reported login/password issue UNKNOWN root cause.

### In scope (READ-ONLY)

- **Code paths (read only):** `server/routes/auth.ts`, `server/auth.ts` (actual `authenticateToken` middleware at `:93`), `client/src/lib/rbac.ts` (incl. `canAccessManagement` at `:26-28` and surrounding RBAC helpers), `client/src/pages/login.tsx`, `client/src/pages/forgot-password.tsx`, `client/src/pages/reset-password.tsx`, JWT/refresh-token logic, session-cookie configuration. NOTE: `server/middleware/` contains only `entitlementCheck.ts` and `validate.ts` — auth gating is NOT under that path; do not waste cycles searching there.
- **DB rows (SELECT only):** `users` row(s) for `duane.wells@huminic.ai` and `duanekwells@gmail.com` — fields like `is_active`, `last_login`, `failed_login_count`, `password_hash` (length only — never the value), `email_verified_at`, role assignments, organization assignments. SQL via Supabase read connection only.
- **Audit log (SELECT only):** `audit_log` rows for the two operator emails over the last 30 days.
- **Resend dashboard (read-only inspection):** check whether password-reset emails were issued, delivered, bounced; do NOT issue any test send.
- **PM2 + Caddy logs (read-only):** recent failed-auth log lines for those emails.

### Out of scope (explicit)

- Any password reset (operator only).
- Any DB write (`UPDATE users`, `DELETE`, `INSERT`) — including resetting `failed_login_count` or `is_active`.
- Any session-token invalidation.
- Any deploy or PM2 restart.
- Any provider send (Resend test email, TextMagic SMS, etc.).
- Any code edit to `server/routes/auth.ts` or auth/session middleware.

### Known defects this wave investigates

- Operator-reported login/password issue (no issue ID yet — file as `I-NEW-2026-05-05-AUTH` if confirmed by investigation).
- I-140 (password reset NEEDS LIVE TEST).
- I-165 (Forgot/reset password FE 11 states untested).

### Operator decisions required BEFORE autonomy starts

None for the read-only investigation. After findings: operator decides remediation (password reset, session reset, code fix, etc.).

### Credentials / accounts / allowlists required

- Read-only Supabase connection (already configured via `DATABASE_URL`).
- Resend dashboard access stays with operator; investigator reports observed delivery/bounce status from logs accessible inside the project.

### Provider-send approvals required

None. Hard stop on any send.

### UI scope markers required

None. Hard stop on any client/server file edit.

### Files likely touched

NONE. Output is an investigation report only:

- `evidence/wave-I-auth-integrity/findings.md` (NEW — read-only output)

### Git branch / worktree strategy

- Read-only investigation uses current `batch-1-finish-line` working tree (no edits).
- Investigator works in `/home/ubuntu/Claude-store/nexxus2.2_replit` directly with read-only tools.

### Agent-team roster (collaborator teammates)

- `team-lead` (orchestrator)
- `release-investigator-auth` (to be spawned when wave executes — read-only role, prefers Explore subagent shape if worktree-team backend issue persists)

### Isolated audit subagents (gate-only, no team mailbox)

- None at OPENING (read-only). After CLOSING, an isolated reviewer may verify findings against source-of-truth files.

### Stop conditions (explicit)

- Any DB row appears modified during the read window → STOP, capture, escalate (this would indicate a lurking bug, not investigator action).
- Any temptation to "just reset the password to verify" → STOP. Operator-only.
- Any temptation to issue a test password-reset email → STOP. Provider send.
- Any code change is needed to investigate → STOP, escalate to operator.

### Chunk list (preliminary)

- Chunk I-Auth-1: Read auth/RBAC code paths and produce a behavioral map.
- Chunk I-Auth-2: SQL read of operator user row(s) and `audit_log` entries.
- Chunk I-Auth-3: Inspect Resend delivery / bounce status for password-reset emails sent in the last 30 days (via project-side log files; do not access live Resend dashboard).
- Chunk I-Auth-4: Classify findings (root cause / contributing factor / unrelated / unknown), produce remediation options for operator decision, write `findings.md`.

### Proof required

- Read-only chunk-level: each chunk produces a short evidence file.
- Wave-level: `findings.md` with classified findings + remediation options. No two-deltas requirement (no changes to verify) but findings should be source-citable (file:line, SQL row hash, log entry).

### Expected evidence path

- `evidence/wave-I-auth-integrity/chunk-I-Auth-1/` … `chunk-I-Auth-4/`
- `evidence/wave-I-auth-integrity/findings.md`
- `evidence/wave-I-auth-integrity/wave-bookend.md` (this file — OPENING + CLOSING)

---

## CLOSING

(Section intentionally empty until findings produced. Lead fills using the wave-bookend template's CLOSING section.)
