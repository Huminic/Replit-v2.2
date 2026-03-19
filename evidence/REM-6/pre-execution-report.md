# Pre-Execution Report: REM-6
Timestamp: 2026-03-19T18:00:00Z
Sprint: REM-6
Status: READY

## Objective
Fix the last 4 test failures: 3 blocked by tour overlay in tests, 1 needs frontend billing route guard. User approved FE change.

## Declared Files
- tests/e2e/helpers/auth.ts
- tests/e2e/domain-08-billing.spec.ts
- tests/e2e/domain-03-chat.spec.ts
- client/src/App.tsx
- client/src/pages/BillingDashboard.tsx
- client/src/pages/BillingUsage.tsx
- client/src/pages/BillingPlan.tsx
- client/src/pages/BillingInvoices.tsx
- evidence/REM-6/
- issues.md
- sprints.json

## Success Criteria
- Test 8.2 PASS — billing page shows FlexPrice content after tour dismissed
- Test 8.4 PASS — Partner/Org Admin sees billing data after tour dismissed
- Test 3.3 PASS — thinking indicator visible after tour dismissed
- Test 8.5 PASS — unauthorized roles redirected away from /settings/billing
- Each fix smoke tested: `npx playwright test --grep "{criterion}" --workers=1`
