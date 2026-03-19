# Pre-Execution Report: REM-7
Timestamp: 2026-03-19T19:00:00Z
Sprint: REM-7
Status: READY

## Objective
Fix the final 6 T-7 test failures. 5 are test selector/navigation issues, 1 is a minor app fix.

## Declared Files
- tests/e2e/domain-06-departments.spec.ts
- tests/e2e/domain-07-insights.spec.ts
- tests/e2e/domain-09-settings.spec.ts
- tests/e2e/domain-11-integrations.spec.ts
- server/routes/public.ts
- evidence/REM-7/
- sprints.json

## Success Criteria
- Test 11.13 PASS — widget JS includes dealer name (N="${name}" variable in JS output)
- Test 6.7 PASS — agent selector uses data-testid="panel-agent-*" instead of class*="agent"
- Test 6.8 PASS — same selector fix for service agents
- Test 7.5 PASS — pin selector is more specific, doesn't match unrelated elements
- Test 9.3 PASS — test navigates to Preferences tab before checking for Restart Tour button
- Test 9.5 PASS — test scrolls to Organization section before checking communication gate

## Smoke Test Commands
- `npx playwright test --grep "11.13" --workers=1`
- `npx playwright test --grep "6.7|6.8" --workers=1`
- `npx playwright test --grep "7.5" --workers=1`
- `npx playwright test --grep "9.3|9.5" --workers=1`
