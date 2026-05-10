# Wave 9-Sec — Phase 1 triage table

**Author:** scope-guardian (read-only enumeration)
**Wave bookend:** `evidence/wave-9-Sec-triage/wave-bookend.md`
**Branch HEAD when authored:** `af4b062` on `wave/9-sec/triage`
**Date:** 2026-05-10

Placement rule (per OPENING bookend):
- **Default v2.3** unless item is (a) real risk to launch dealerships or customer data, or (b) trivially fixable (single-line / config-only).
- **v2.2** reserved for high-risk-to-launch OR trivial fixes.
- **drop** if the item is no longer relevant (already fixed by a later commit).

Each "Recommended placement" is scope-guardian's opinion only; Phase 2 = operator decides.

---

## Triage table — 10 items

| ID | Title | Severity | Fix complexity | Risk to v2.2 launch | Recommended placement | One-sentence reasoning |
|---|---|---|---|---|---|---|
| **I-244** | IDOR on `/api/vin/leads/summary` — any auth'd user can pass `?orgId=<uuid>` to read another org's lead data; no role check at `server/vendorProxy.ts:555` (verified still vulnerable in HEAD `af4b062`) | HIGH | 1-line server fix (add `roleLevel > 2 → enforce req.user.organizationId`) | **HIGH** — cross-tenant customer-data leak between dealerships; partner_admin/org_admin tokens are real and live | **v2.2** | Cross-tenant data leak across real dealerships is a launch-blocker; the fix is single-line + add a regression test. |
| **I-245** | AI system-prompt PATCH bypass — UI hides AI tile for org_admin but `PATCH /api/settings/org` uses `requireRole(3)` and merges `req.body` wholesale at `server/routes/settings.ts:17-25` (verified still vulnerable in HEAD `af4b062`) | HIGH | 1-line role-raise OR small field-strip (hours) | **HIGH** — an org_admin can overwrite AI behavior across their org (chat instructions, hunches), affecting customer-facing AI replies | **v2.2** | Org_admin overwriting AI behavior in production directly affects what customers see/receive — and the fix is either `requireRole(2)` or a one-place field-allowlist. |
| **I-246** | Role dropdown exposed all 8 roles to org_admin (privilege escalation risk) — server side AND UI both currently guarded via `canAssignRole` at `server/lib/roleGuard.ts:37` + filter at `client/src/pages/settings.tsx:370-377` (verified in HEAD `af4b062`) | — | — | NONE — already fixed | **drop — already fixed in `0a13abf`** | Server-side guard (`canAssignRole`) AND UI role-filter both present; no remaining work. |
| **I-247** | Org slug writable via API PATCH — silently breaks widget embeds; `updateOrganizationSchema` in `shared/schema.ts:519` still accepts slug (omits only id/createdAt/updatedAt). PATCH route at `server/routes/organizations.ts:360` uses that schema. Verified in HEAD `af4b062`. NOTE: a dedicated rename endpoint exists at `server/routes/organizations.ts:405` (`PATCH /api/organizations/:id/slug`) which is the intended path, so removing slug from the schema is safe. | MEDIUM | 1-line schema change (omit slug from `updateOrganizationSchema`) | LOW — requires org_admin actively choosing to change slug; not customer-data; but breaks widget embeds + landing pages for the org if triggered | **v2.2** | Single-line fix with a clean dedicated endpoint already available; cheap insurance against a self-foot-gun by a real dealership admin. |
| **I-249** | Self-deactivation: no server check, no reactivation path in UI — `server/routes/users.ts:175-211` lets an org_admin set their own `isActive: false`; no `req.user.id === req.params.id` guard (verified still vulnerable in HEAD `af4b062`) | MEDIUM | 1-line server guard + small UI disable (hours) | MEDIUM — a single distracted-click by a real org_admin locks them out of their dealership; only a super_admin can recover, costing operator support time | **v2.2** | Trivial server guard + cheap UI disable that prevents a real dealership admin from accidentally bricking their own account during launch week. |
| **I-NEW-2026-05-07-AUTH-D** | Forgot-password email-case mismatch — `server/routes/auth.ts:353` does not lowercase the email; `server/storage.ts:258-261` exact-match SQL → mixed-case input silently misses user but returns 200. Confirmed historical: operator's 2026-03-20 forgot-password produced ZERO Resend records. Verified still vulnerable in HEAD `af4b062`. | HIGH | 1-line fix (`.toLowerCase()` at auth.ts:353) | **HIGH** — silently breaks password recovery for real dealership admins; the symptom has already bit the operator once; if it bites a real org_admin during launch week, they have no recourse | **v2.2** | One-character fix that prevents a known-confirmed real-world failure mode; absolutely a launch-blocker. |
| **I-NEW-2026-05-07-AUTH-E** | No `login_success` audit log — `server/routes/auth.ts` records `login_failed` but not success; security investigations have to infer success from absence | LOW | 1-line `createActivityLog` add | LOW — observability gap, not a vulnerability or data-leak risk | v2.3 | Observability gap only; defer unless operator wants the audit-trail completeness for launch. |
| **I-NEW-2026-05-07-AUTH-G** | Reset-password UI countdown 15 min vs server 60 min — `client/src/pages/reset-password.tsx:62` shows 15-min UI vs `server/routes/auth.ts:358` 60-min token. UI force-expires page 45 min before server would (verified in HEAD `af4b062`). | LOW | UI const change (1 number) — but UI file is gated under CLAUDE.md UI-protection hook | LOW — annoying UX, not security; user just requests a new link | v2.3 | UX inconvenience only; touching a UI file requires operator UI-approval marker; defer to v2.3 batch with a UI-scope chunk. |
| **I-NEW-2026-05-07-AUTH-H** | `change-password` does not invalidate other active sessions — `server/routes/auth.ts:434-465` updates password but skips `deleteUserSessions` (verified in HEAD `af4b062`; note: `deleteUserSessions` IS called on forgot-password reset at line 316 and on logout at line 189, just not on change-password) | MEDIUM | 1-line add (`storage.deleteUserSessions(req.user.id)`) | LOW — attack requires an already-stolen session that survives a deliberate password change; not a launch-week realistic path | v2.3 | Best-practice hardening but not a launch-week threat; the fix pattern already exists in the same file for forgot-password — trivial later. |
| **I-NEW-2026-05-07-AUTH-I** | `/api/auth/refresh` not rate-limited — `server/routes/auth.ts:198` has no `authLimiter` (login does); enables opportunistic token-enumeration / brute-force | MEDIUM | 1-line add (`authLimiter` middleware on the refresh route) | LOW — opportunistic abuse vector, not a customer-data leak; v2.2 has no exposed broadcast of refresh-endpoint URLs to attackers | v2.3 | Defensive hardening; cheap to add later in a batched auth-polish wave. |

---

## Summary counts

| Category | Count | Items |
|---|---|---|
| **Recommended v2.2** (real launch risk or trivial fix) | **5** | I-244, I-245, I-247, I-249, AUTH-D |
| **Recommended v2.3 deferral** | **4** | AUTH-E, AUTH-G, AUTH-H, AUTH-I |
| **Recommended drop — already fixed** | **1** | I-246 (commit `0a13abf`) |
| **Total** | **10** | |

Note on the v2.2 set: every recommended-v2.2 item is a single-line (or near-single-line) backend fix. Total estimated implementation cost: **<1 day of focused work + verifier convergence per chunk**. Bundle suggestion: 5 chunks, one per item, each with its own bookend + qa-evaluator + 4-verifier gate per CLAUDE.md.

The v2.3 set contains one UI file (`reset-password.tsx`, AUTH-G) which alone is enough reason to defer — a UI-scope marker would expand the wave footprint.

---

## Questions for operator (Phase 2)

1. **RBAC posture for launch:** Is the RBAC role model locked-in for v2.2 (and we're hardening it), or is RBAC still expected to evolve? This affects I-245 placement (raise `requireRole(3) → (2)` for AI config) and I-247 (slug write being org-admin-able at all). If RBAC is moving in v2.3, two of these are wasted work; if locked, both are easy wins.

2. **Customer-data sensitivity threshold for v2.2:** Are you comfortable accepting I-244 (IDOR on `/api/vin/leads/summary`) as a v2.2-blocking issue? It is the single highest-impact item (cross-tenant lead-data read between real dealerships) — but the fix is small. Confirming this is in scope frames the rest of the v2.2 implementation chunks.

3. **AUTH-D operator-impact tolerance:** AUTH-D's symptom already bit the operator on 2026-03-20 (silent forgot-password failure on mixed-case email). Do you want me to treat this as auto-v2.2 (my recommendation) given the confirmed historical impact, OR are you OK accepting that real dealership admins who type their email in mixed case during launch week will have a silent failure? The fix is `.toLowerCase()` in one place.

---

## Verification trail (where my "already fixed" / "still vulnerable" claims came from)

- **I-244 still vulnerable:** `server/vendorProxy.ts:555` reads `req.query.orgId` and uses it directly with no role check — confirmed in HEAD `af4b062`.
- **I-245 still vulnerable:** `server/routes/settings.ts:17-25` uses `requireRole(3)` and spreads `req.body` into `mergedSettings` — confirmed in HEAD `af4b062`.
- **I-246 FIXED:** `server/lib/roleGuard.ts:37` (`canAssignRole`) is called at `server/routes/users.ts:196` AND `client/src/pages/settings.tsx:370-377` filters the dropdown. Commit `0a13abf` introduced the guard.
- **I-247 still vulnerable:** `shared/schema.ts:519` `updateOrganizationSchema` omits only `id`/`createdAt`/`updatedAt` — slug is still accepted. The dedicated rename endpoint exists at `server/routes/organizations.ts:405`.
- **I-249 still vulnerable:** `server/routes/users.ts:201` accepts `req.body.isActive` from any roleLevel<=3 caller without a `req.user.id === req.params.id` self-check.
- **AUTH-D still vulnerable:** `server/routes/auth.ts:353` calls `storage.getUserByEmail(email)` with no `.toLowerCase()`.
- **AUTH-E still vulnerable:** Wave I-Auth CLOSING confirmed no `login_success` action exists in the codebase.
- **AUTH-G still present:** `client/src/pages/reset-password.tsx:62` `useState(15 * 60)` vs `server/routes/auth.ts:358` `60 * 60 * 1000` expiry.
- **AUTH-H still vulnerable:** `server/routes/auth.ts:434-465` (change-password handler) has no `deleteUserSessions` call (contrast with line 189 logout / line 316 forgot-password / line 415 reset-password, which all call it).
- **AUTH-I still vulnerable:** `server/routes/auth.ts:198` `app.post("/api/auth/refresh", async ...)` — no `authLimiter` middleware (compare to line 40 login).

---

**Status:** Phase 1 table complete. Awaiting operator decisions on each row (Phase 2).
