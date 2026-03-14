# Nexxus Connect v2.2 — Gap Analysis

Generated: 2026-03-14
Sprint: QA-S7
Sources: QA-S1 through QA-S6 test results, P0-S0 audit, remediation ledger

---

## MAJOR Defects (2) — Require FIX sprints

### M1: No API 404 handler

| Field | Value |
|-------|-------|
| Severity | MAJOR |
| File | server/index.ts |
| Origin | Pre-P0 (original codebase) — never had one |
| Found in | QA-S4, confirmed in QA-S5, QA-S6 |
| Impact | Any non-existent /api/* path returns 200 with SPA HTML instead of 404 JSON. Masks broken API calls. Clients parsing JSON get HTML and fail silently. |
| Fix | Add catch-all route before SPA fallback: `app.all('/api/*', (req, res) => res.status(404).json({ error: 'Not found' }))` |
| Estimated scope | ~5 lines in server/index.ts |
| Test | GET /api/nonexistent returns 404 JSON, not 200 HTML |

### M2: Temp password logged to console in plaintext

| Field | Value |
|-------|-------|
| Severity | MAJOR |
| File | server/routes/users.ts, line 371 |
| Origin | Pre-P0 (original codebase) |
| Found in | QA-S5 |
| Impact | When RESEND_API_KEY is not configured, temporary passwords for invited users are logged to console in plaintext. In production, console output may be captured by log aggregation. |
| Fix | Remove the console.log or replace with masked version (e.g., log length only) |
| Estimated scope | 1 line removal or replacement |
| Test | Verify no plaintext password in console output after invite |

---

## Governance Fixes (2) — Already applied, not yet committed

### G1: log_audit silent failure + missing re-stage

| Field | Value |
|-------|-------|
| Severity | MAJOR (root cause of audit stamp gap) |
| File | scripts/pre-commit.sh, lines 49 and 367 |
| Origin | P0-S0 |
| Status | FIXED in working tree, synced to .git/hooks/pre-commit |
| Fix | (a) PASS stamp write failure now blocks commit; (b) audit log re-staged after writing |

### G2: EF-09 dead code with misleading output

| Field | Value |
|-------|-------|
| Severity | MINOR |
| File | scripts/enforcer-checklist.sh, line 143 |
| Origin | P0-S0 |
| Status | FIXED in working tree |
| Fix | Replaced dead code with honest "not applicable" message |

---

## MINOR Defects (18) — Grouped by category

### Category A: Type safety (`as any` / `: any`) — 8 items

These are type-widening casts, mostly for Drizzle ORM compatibility or error handling. Not security risks. Low priority.

| File | Line(s) | Context |
|------|---------|---------|
| server/routes/chat.ts | catch blocks (3) | `err: any` in error handlers |
| server/routes/documents.ts | 71 | `result: any` on check-duplicate |
| server/routes/campaigns.ts | 459 | `as any` on update object |
| server/routes/sms.ts | 269 | `(u as any).role?.level` |
| server/routes/metrics.ts | 49,76,78,93,95 | `: any` on callback params |
| server/routes/insights.ts | catch blocks (4) | `err: any` |
| server/routes/settings.ts | 24 | `as any` on merged settings |
| server/routes/organizations.ts | 99 | `as any` on settings object |
| server/routes/users.ts | 281 | `as any` on photo URL update |
| server/routes/public.ts | 128, 132 | `(a as any).tavusPersonaId` |

**Remediation:** Type these properly. Low priority — functional behavior is correct.

### Category B: Documentation inaccuracies — 2 items

| Issue | Actual | Claimed |
|-------|--------|---------|
| P4-S2 endpoint count | 24 | 26 |
| P4-S4 billing endpoint count | 7 | 6 |

**Remediation:** Correct the post-sprint reports. No code change needed.

### Category C: Infrastructure observations — 5 items

| Issue | File | Remediation |
|-------|------|-------------|
| Duplicate security headers (Helmet + Caddy) | server/index.ts + Caddy config | Configure one layer only |
| Conflicting x-xss-protection (0 vs 1;mode=block) | server/index.ts + Caddy config | Standardize to Helmet's value (0) |
| Console 400 from /api/auth/refresh on unauth load | client-side | Check for cookie before attempting refresh |
| Empty HTML `<title>` tag | client/index.html | Add `<title>Nexxus Connect</title>` |
| Secure cookie conditional on NODE_ENV | server/auth.ts | Low risk behind HSTS, but could hardcode secure:true |

**Remediation:** Low priority. None affect functionality.

### Category D: Design observations — 3 items

| Issue | File | Note |
|-------|------|------|
| No req.on('close') in SSE stream | server/routes/chat.ts | Client disconnect doesn't abort AI call (token waste) |
| No GET /api/documents/:id | server/routes/documents.ts | Single-doc fetch not available |
| No res.flush() after SSE writes | server/routes/chat.ts | X-Accel-Buffering header compensates |

**Remediation:** Optional improvements. No user-facing impact currently.

---

## Layer Coverage Gap

| Layer | Status | Gap |
|-------|--------|-----|
| L1: Unauthenticated | COMPLETE (12 domains) | API 404 handler defect |
| L2: Authenticated | NOT TESTED | Requires test credentials |
| L3: Visual | Login page + widget only | Requires auth for remaining pages |
| L4: Usability | NOT TESTED | Requires human walkthrough |

**L2/L3/L4 testing is blocked on test credentials.** Once credentials are available, QA-S9 through QA-S14 will cover authenticated testing per domain.

---

## Prioritized Remediation Order

| Priority | Item | Sprint |
|----------|------|--------|
| 1 | Commit governance fixes (G1, G2) + QA evidence | FIX-S0 |
| 2 | API 404 handler (M1) | FIX-S0 |
| 3 | Temp password console log (M2) | FIX-S0 |
| 4 | Empty HTML title tag (C) | FIX-S0 |
| 5 | Type safety cleanup (A, 10 files) | FIX-S1 |
| 6 | Infrastructure observations (C, 4 items) | FIX-S2 or deferred |
| 7 | Documentation corrections (B, 2 reports) | FIX-S1 |
| 8 | Design improvements (D, 3 items) | Deferred to post-launch |
