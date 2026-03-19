# Pre-Execution Report: REM-5
Timestamp: 2026-03-19T16:30:00Z
Sprint: REM-5
Status: READY

## Objective
Fix all 16 remaining T-6 test failures. 9 are test bugs, 3 are app bugs, 2 need investigation, 2 are firm fixes.

## Declared Files

### Test file fixes (9 test bugs)
- tests/e2e/domain-08-billing.spec.ts (8.2-8.5: wrong route /billing → /settings/billing)
- tests/e2e/domain-10-tasks.spec.ts (10.2: wrong field assignedTo → assignedUserId, dueDate type)
- tests/e2e/domain-11-integrations.spec.ts (11.1: test checks nonexistent public endpoints)
- tests/e2e/domain-03-chat.spec.ts (3.3: selector uses class*="thinking" but app uses wave-dot/data-testid)
- tests/e2e/domain-09-settings.spec.ts (9.2: selector looks for input[name="name"] but profile shows h2 text)
- tests/e2e/domain-12-infrastructure.spec.ts (12.3: sends 100 req but limit is 100, needs 101+)
- tests/e2e/domain-05-teambox.spec.ts (5.11: workflows tab is Coming Soon)
- tests/e2e/live-comms.spec.ts (LC-2: campaign ID issue)

### App bug fixes (3 app bugs)
- server/routes/organizations.ts (9.4: add requireRole to GET /api/organizations)
- server/routes/tasks.ts (10.4: add GET /api/tasks/:id route)
- server/routes/billing.ts (8.5: add requireRole to billing routes)

### Schema fix
- shared/schema.ts (I-081: add assignedTo column to conversations)

### Investigation files
- server/routes/insights.ts (7.6: VIN source label resolution check)
- server/routes/public.ts (6.5: department role restriction check)

### Security fix
- server/seed.ts (I-085: remove password logging)

### Governance
- evidence/REM-5/
- issues.md
- sprints.json

## Success Criteria
- Tests 8.2-8.4 PASS — billing pages at /settings/billing show FlexPrice data
- Test 8.5 PASS — non-admin roles blocked from billing API
- Test 10.2 PASS — task creation uses correct field names
- Test 10.4 PASS — GET /api/tasks/:id returns single task
- Test 11.1 PASS — test uses actual public endpoints
- Test 3.3 PASS — thinking indicator selector matches wave-dot or data-testid
- Test 9.2 PASS — profile selectors match actual page elements
- Test 9.4 PASS — GET /api/organizations returns 403 for non-admin roles
- Test 12.3 PASS — rate limiter test sends enough requests to trigger 429
- Test 5.11 PASS — workflows tab asserts disabled/coming-soon state
- Test LC-2 PASS — campaign SMS flow works end-to-end
- Test 6.5 investigated — root cause documented
- Test 7.6 investigated — VIN source label resolution verified
- I-081 FIXED — assignedTo column exists in conversations table
- I-085 FIXED — seed.ts no longer logs password to console
- Each fix smoke tested with specific Playwright test before commit

## Smoke Test Commands Per Fix
- Billing: `npx playwright test --grep "8.2|8.3|8.4|8.5" --workers=1`
- Tasks: `npx playwright test --grep "10.2|10.4" --workers=1`
- Widget: `npx playwright test --grep "11.1" --workers=1`
- Chat: `npx playwright test --grep "3.3" --workers=1`
- Settings: `npx playwright test --grep "9.2|9.4" --workers=1`
- Rate limiter: `npx playwright test --grep "12.3" --workers=1`
- TeamBox: `npx playwright test --grep "5.11" --workers=1`
- Comms: `npx playwright test --grep "LC-2" --workers=1`
