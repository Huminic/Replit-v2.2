# SNP-SEC-01 — Pre-Execution Report

**Date:** 2026-04-08
**Sprint:** Security fixes — IDOR, AI prompt bypass, org slug, role dropdown
**Branch:** wave-pe3
**Priority:** P0
**Scope:** 5 files — vendorProxy.ts, settings.ts, organizations.ts, users.ts, settings.tsx

---

## Objective

Fix four security vulnerabilities discovered during the Sniper launch evaluation:

- **B01 (IDOR):** `/api/vin/leads/summary` accepts `?orgId=` from query params without checking whether the authenticated user belongs to that org. Any authenticated user can read any org's VIN lead summary.
- **B02 (AI prompt bypass):** `PATCH /api/settings/org` uses `requireRole(3)`, which allows org_admin (level 3). Fields like `systemPrompt` and `chatInstructions` are AI-tier settings that should be restricted to super_admin/partner_admin (level ≤ 2).
- **B29 (Slug writable):** `PATCH /api/organizations/:id` passes the full `updateOrganizationSchema` which includes `slug`. An org_admin can change their org's slug, which breaks widget embed codes and any hard-coded slug references.
- **B22 (Role dropdown escalation):** The Settings > User Management UI renders all 8 roles in the role dropdown regardless of the viewer's role level. An org_admin can assign super_admin or partner_admin roles to new or existing users.

---

## Declared Files

- server/vendorProxy.ts
- server/routes/settings.ts
- server/routes/organizations.ts
- server/routes/users.ts
- client/src/pages/settings.tsx


## Acceptance Criteria

| AC | Description | Pass Criteria |
|----|-------------|---------------|
| AC1 | IDOR on `/api/vin/leads/summary` | org_admin calling `?orgId=<other-org>` receives HTTP 403 |
| AC2 | AI settings field protection | org_admin PATCH with `systemPrompt` or `chatInstructions` receives 403 OR fields are silently stripped and not persisted |
| AC3 | Slug write protection | PATCH `/api/organizations/:id` with `{slug: "new-slug"}` by org_admin — slug unchanged in DB after call |
| AC4 | Role assignment ceiling | POST/PATCH `/api/users` with `{role: "super_admin"}` or `{role: "partner_admin"}` by org_admin returns 403 |
| AC5 | Role dropdown scope | Settings > User Management role picker for org_admin shows only org_admin, agent, viewer — not super_admin or partner_admin |

---

## Test Plan

| Flow | What to Test | Classification |
|------|-------------|----------------|
| F1 | GET `/api/vin/leads/summary?orgId=<serra-nissan-uuid>` as `serra_honda@huminic.ai` | L2 authenticated API — expect 403 |
| F2 | PATCH `/api/settings/org` with `{systemPrompt: "hacked"}` as org_admin | L2 authenticated API — expect 403 or field not persisted |
| F3 | PATCH `/api/organizations/:id` with `{slug: "new-slug"}` as org_admin | L2 authenticated API — verify DB slug unchanged |
| F4 | POST `/api/users` with `{roleId: <super_admin role id>}` as org_admin | L2 authenticated API — expect 403 |
| F5 | Open Settings > User Management as org_admin; inspect role dropdown | L3 visual — verify dropdown has ≤ 4 entries, no super_admin or partner_admin |
| F6 | Repeat F1 as super_admin — should succeed (200) | L2 regression — no access regression for privileged roles |
| F7 | PATCH `/api/settings/org` with non-AI field (e.g., `timezone`) as org_admin | L2 regression — should still succeed after fix |

---

## Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| `requireRole(2)` on settings PATCH locks out org_admins from ALL settings | High — org_admin can no longer change timezone, business hours, etc. | Field-level stripping is safer than role-gate raise; strip only AI fields (`systemPrompt`, `chatInstructions`, `aiModel`) for level-3 callers |
| `updateOrganizationSchema` includes many legitimate fields; stripping `slug` may miss future additions | Low | Explicit allowlist or explicit `omit` for `slug` — omit is cleanest |
| `role.level < req.user.roleLevel` guard in users.ts — logic inversion risk | Medium | Confirm: level 1 = super_admin (highest privilege, lowest integer). `role.level < req.user.roleLevel` means "requested role has fewer privileges than requester" — this is CORRECT for blocking upward assignment. Verify test catches equal-level assignment (org_admin assigning org_admin to a different org). |
| Frontend dropdown filter may not match backend role list if roles table differs per org | Low | Filter based on `roleLevel` field from current user JWT, not hard-coded strings |

---

## Entry Gates

| Gate | Status |
|------|--------|
| A1: Pre-exec written | THIS FILE |
| A2: Files declared | LISTED ABOVE — 5 files |
| A3: No in-progress sprint | CONFIRMED — no sprint marked in_progress in sprints.json for this branch |
| A4: Branch wave-pe3 | CONFIRMED |
| A5: Irreversible actions | NONE — no external API writes, no emails, no SMS, no production deployment |

---

## Ghost Entry Gate

**Reviewed by:** Ghost Agent (Enforcer)
**Date:** 2026-04-08

### Scope Verification

Declared files match the bug descriptions:
- `vendorProxy.ts` line ~555 — B01 IDOR fix location confirmed by code read (line 555: `const orgId = (req.query.orgId as string) || req.user.organizationId;` — no ownership check present).
- `settings.ts` line 17 — `requireRole(3)` confirmed. PATCH endpoint merges full `req.body` into settings with no field-level filtering. B02 is real.
- `organizations.ts` lines 209-252 — `updateOrganizationSchema` is imported from `@shared/schema` and defined as `createInsertSchema(organizations).omit({ id, createdAt, updatedAt }).partial()`. The `slug` column exists in the organizations table. No exclusion for `slug` on org_admin callers. B29 is real.
- `users.ts` lines 54-58 — Guard `role.level < req.user.roleLevel` exists. For org_admin (level 3), this blocks assigning a role with level 1 or 2. The check uses strict less-than — assigning a role at the same level (3) is technically allowed. B22 partial: backend may already block upward assignment; frontend dropdown scope is the primary gap.
- `settings.tsx` — declared for dropdown filter. Not verified by code read but scope is appropriate.

### AC Verification

| AC | Verdict | Notes |
|----|---------|-------|
| AC1 | Plausible and testable | Code confirms no org ownership check exists at line 555. Fix is a 2-3 line addition. |
| AC2 | Plausible and testable | Field-level stripping approach is lower risk than role-gate raise — Risk Analysis notes this correctly. |
| AC3 | Plausible and testable | `updateOrganizationSchema` includes `slug`; confirmed via schema grep. |
| AC4 | Plausible — partial backend gap | Backend guard exists but uses `<` not `<=`. Equal-level assignment not blocked. Fix is narrow. |
| AC5 | Plausible and testable | Frontend filter needed regardless of backend state. |

### Test Plan Assessment

F1–F7 cover all ACs plus two regression cases (F6, F7). Regression tests are important given the Risk Analysis concern about over-restricting org_admin. Test plan is sufficient for L2+L3 coverage.

### Risk Analysis Assessment

The risk of locking out org_admins from all settings (if `requireRole(2)` is applied to the full PATCH) is correctly identified and the mitigation (field-level stripping) is appropriate. This is a meaningful pre-implementation decision that must be resolved before coding begins.

### Findings

No scope overreach. No missing ACs. No undeclared files. Risk analysis is honest. Test plan includes regression coverage.

ENTRY GATE: APPROVED

## Declared Files (list format for hook)

- server/vendorProxy.ts
- server/routes/settings.ts
- server/routes/organizations.ts
- server/routes/users.ts
- client/src/pages/settings.tsx
