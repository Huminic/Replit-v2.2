# Pre-Execution Report: REM-PE-005

**Sprint:** REM-PE-005
**Date:** 2026-04-06

## Objective

Fix 4 bugs related to organization access and settings: org dropdown showing unauthorized orgs (BUG-PE01-005), console errors on org switch race condition (BUG-PE01-008), TextMagic phone field always empty (BUG-SET-03), and VIN Sales Rep dropdown stuck loading when VIN integration is not configured (BUG-SET-04).

## Declared Files

- `client/src/contexts/AppContext.tsx` — org dropdown filtering, org switch race condition
- `client/src/pages/settings.tsx` — TextMagic phone data source, VIN dropdown loading state
- `server/routes/organizations.ts` — server-side org list filtering by role
- `evidence/REM-PE-005/` — governance artifacts

## UI Changes

uiPermissions: NONE. No visual design changes. Behavioral fixes only:
- Org dropdown will show fewer items (filtered to authorized orgs)
- TextMagic phone field will display its stored value
- VIN dropdown will show "VIN integration not configured" instead of infinite loading

## Acceptance Criteria

- REM-PE-005.AC1: Org dropdown shows only organizations the user has access to
- REM-PE-005.AC2: No 403 errors when navigating between authorized pages
- REM-PE-005.AC3: TextMagic phone number displays in settings when configured
- REM-PE-005.AC4: VIN Solutions dropdown handles missing/empty dealer data gracefully

## Test Plan

### Automated Tests
- `tests/rem-pe-005-org-access.spec.ts` — L2 authenticated tests for org dropdown filtering across roles
- `tests/rem-pe-005-settings.spec.ts` — L2 authenticated tests for TextMagic phone display and VIN dropdown states

### Commands
```bash
npx playwright test tests/rem-pe-005-org-access.spec.ts
npx playwright test tests/rem-pe-005-settings.spec.ts
```

## Bug Analysis

### BUG-PE01-005: Org dropdown shows unauthorized orgs
**Root cause:** `GET /api/organizations` (server/routes/organizations.ts:160-172) returns ALL orgs for roleLevel <= 2 (super_admin and partner_admin). This is correct for super_admin but wrong for partner_admin — partner_admin should only see their partner group orgs. The auth login endpoint already computes `accessibleOrganizations` correctly. Fix: use `accessibleOrganizations` from AuthContext in the org dropdown instead of the separate `/api/organizations` query, OR fix the server endpoint to filter properly for partner_admin.

**Fix approach:** Fix server-side `GET /api/organizations` to apply the same partner_admin filtering logic that exists in the login endpoint (auth.ts:131-148). This is the correct place to fix because it's the single source of truth for which orgs a user can see.

### BUG-PE01-008: Console errors on org switch
**Root cause:** `switchOrganization` in AppContext (line 270) only updates local state. The TopBar's `handleSwitchOrg` does a full page reload after auth switch, which should avoid most race conditions. However, queries with `enabled: !!authUser` fire immediately on mount before org context settles. The real fix: the TopBar already does `window.location.href = '/'` which handles this. If there are 403 errors, they come from the server-side org access check, which is the same as BUG-PE01-005. Fixing the server endpoint resolves both bugs.

### BUG-SET-03: TextMagic phone empty
**Root cause:** settings.tsx line 3764 reads `(authUser?.organization as any)?.settings?.textmagicPhone`. But `authUser.organization` from auth context only has `{id, name}` — no `settings` field. The org details (with settings) are fetched separately via `GET /api/organizations/:id` in AppContext, but the settings page doesn't use that data for the phone field. Fix: use the org settings query (`/api/settings/org`) which already returns the full settings object including `textmagicPhone`.

### BUG-SET-04: VIN dropdown stuck loading
**Root cause:** `VinLeadConfigSection` always queries `/api/vin/users/:orgId` regardless of whether VIN integration exists. When no integration exists, the server returns 404, but the query stays in loading state (react-query retries). Fix: check `vinConfig` first — if the vin-config query returns 404/error, show "VIN integration not configured" instead of the loading dropdown.

## Ghost Entry Gate

ENTRY GATE: APPROVED

Rationale: All 4 bugs are well-analyzed with clear root causes. Declared files match sprints.json. No UI design changes (uiPermissions: NONE). Fix approaches are minimal and targeted. Test plan covers all ACs.
