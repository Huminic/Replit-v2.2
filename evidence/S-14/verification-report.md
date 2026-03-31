# S-14 Verification Report — Test Alignment: RBAC + UI

**Date:** 2026-03-30

## Changes

### I-184: Management tests expect org_admin (domain-06-departments.spec.ts)
- Test 6.4: `testUsers.executive` → `testUsers.superAdmin` (management is super_admin only since S9)
- Test 6.5: `testUsers.executive` → `testUsers.superAdmin`
- Test 6.4 title updated: "executive overview" → "super_admin overview"

### I-185: Restart Tour selector mismatch (domain-09-settings.spec.ts)
- Test 9.3: `button-restart-tour` → `button-reset-tour` (matches actual data-testid in profile.tsx:445)

### I-186: Appointment schema field name (domain-10-tasks.spec.ts)
- Test 10.3: Added `appt.startTime` to date field check (schema uses `startTime`, test was checking `date/startDate/start/scheduledAt/start_time`)
- Removed `start_time` (snake_case not returned by ORM)

## Files Touched
- tests/e2e/domain-06-departments.spec.ts (I-184)
- tests/e2e/domain-09-settings.spec.ts (I-185)
- tests/e2e/domain-10-tasks.spec.ts (I-186)

## Verification
- TypeScript compilation: PASS
- No app code modified — test files only
- No governance files altered
