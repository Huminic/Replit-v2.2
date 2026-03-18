# Pre-Execution Report: REM-2
Timestamp: 2026-03-18T21:30:00Z
Sprint: REM-2
Status: READY

## Objective
Fix the loginViaUI test infrastructure problem (28 tests blocked) and remaining BE bugs.

## Declared Files
- tests/e2e/domain-01-auth.spec.ts
- tests/e2e/domain-02-dashboard.spec.ts
- tests/e2e/domain-03-chat.spec.ts
- tests/e2e/domain-06-departments.spec.ts
- tests/e2e/domain-07-insights.spec.ts
- tests/e2e/domain-08-billing.spec.ts
- tests/e2e/domain-09-settings.spec.ts
- tests/e2e/helpers/auth.ts
- server/outbound.ts
- server/routes/organizations.ts
- server/routes/tasks.ts
- server/routes/appointments.ts
- server/routes/billing.ts
- server/services/billingService.ts
- server/middleware/entitlementCheck.ts
- server/storage.ts
- evidence/REM-2/
- issues.md
- sprints.json

## Success Criteria
- loginViaUI replaced with API-based login in all browser tests
- 28 previously-blocked tests now execute
- Campaign/tasks/entitlement 500s investigated and fixed
- Significant improvement over T-3 baseline (54/113)
