# Pre-Execution Report: SEC-07 — System / Profile / Top Icons

**Sprint:** SEC-07
**Type:** Frontend fixes — label changes, nav item removal, RBAC alignment
**Date:** 2026-03-26
**Status:** AWAITING ENTRY GATE

## Objective

Fix 5 issues identified in E-013 section audits and operator walkthrough for Settings, Profile, and TopBar pages. All changes are small, surgical frontend fixes — label renames, menu item removal, RBAC array update, nav item hide.

## Declared Files

- `client/src/components/layout/TopBar.tsx` — I-117 (label rename), I-118 (remove Billing link)
- `client/src/pages/settings.tsx` — I-120 (add partner_admin to AI Config tile minRole)
- `client/src/components/layout/Sidebar.tsx` — I-127 (hide My Work nav item — line 57)
- `client/src/components/layout/SubMenuManager.tsx` — I-127 (My Work section, if cleanup needed)
- `tests/e2e/s7-system-profile.spec.ts` — test updates

## Issues to Fix

| Issue | Description | Severity | Change |
|---|---|---|---|
| I-117 | TopBar says "Take a Tour" instead of "Reset Tour" | Low | Change label string in TopBar.tsx |
| I-118 | TopBar Profile dropdown still has Billing link | Low | Remove Billing DropdownMenuItem from TopBar.tsx |
| I-120 | AI Config tile RBAC inconsistent with sub-menu | Low | Add 'partner_admin' to settingsTiles minRole for AI Config in settings.tsx |
| I-127 | "My Work" still visible in navigation | Medium | Find and hide/remove My Work nav item |
| I-111 | 7 routes with zero test coverage (partial — profile/preferences) | Medium | Verify /profile/preferences has test coverage in s7 spec |

## UI Changes

- TopBar dropdown: "Take a Tour" → "Reset Tour" (label only)
- TopBar dropdown: Billing menu item removed (6 lines)
- Settings tile grid: AI Config now visible to partner_admin (read-only already handled)
- Sidebar nav: "My Work" hidden

## Test Plan

### Test file:
- `tests/e2e/s7-system-profile.spec.ts`

### Exact commands:
```
npx playwright test tests/e2e/s7-system-profile.spec.ts --project=sprint --reporter=list --workers=1
```

### What tests should verify:
- S-7.AC4: Profile page shows "Reset Tour" button text
- S-7.AC15: TopBar dropdown shows "Reset Tour" (not "Take a Tour")
- S-7.AC16: TopBar dropdown does NOT contain "Billing" item
- S-7.AC8: Settings tiles count differs by role (super_admin vs partner_admin vs org_admin)

## Diff Reference (Attempt 1)

From sec-attempt-1-diff.patch, the SEC-07 changes were:
- TopBar.tsx: Changed "Take a Tour" to "Reset Tour", removed Billing menu item + dead imports
- settings.tsx: Added 'partner_admin' to AI Config tile minRole

This attempt adds: I-127 (My Work nav hide) which was NOT in attempt 1.

## Acceptance Criteria

S-7.AC1 through S-7.AC21 (from acceptance_criteria.md)

## Ghost Entry Gate
**Reviewed by:** ghost-agent
**Timestamp:** 2026-03-26T16:42:00Z
**Sprint:** SEC-07
**Run:** v2 (re-check after Captain fixed A8 mismatch)
**A1 Previous cleared:** SKIP — first governed sprint in this round
**A2 Worktree:** PASS — clean (no client/, server/, or shared/ files dirty)
**A3 Session state:** PASS — SEC-07 referenced in session-state.md
**A4 Pre-exec exists:** PASS — evidence/SEC-07/pre-execution-report.md exists
**A5 Objective:** PASS — ## Objective present with clear scope statement
**A6 Test Plan:** PASS — ## Test Plan present with npx playwright command and 4 specific test assertions
**A7 Declared Files:** PASS — 5 files listed with issue references
**A8 Match check:** PASS — 5 files in pre-exec match 5 files in SEC-07-system.json declaredFiles exactly
**A9 UI permissions:** PASS — ## UI Changes section present with 4 declared changes
**A10 Ghost messages:** PASS — no ghost_messages.json file exists (no unacknowledged blocks)
**ENTRY GATE: APPROVED**
