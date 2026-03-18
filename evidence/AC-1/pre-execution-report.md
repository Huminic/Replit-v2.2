# Pre-Execution Report: AC-1
Timestamp: 2026-03-18T06:10:00Z
Sprint: AC-1
Status: READY

## Objective
1. Reconcile acceptance_criteria.md against current code (verify each criterion is accurate after 64 sprints of changes)
2. Set up Playwright config (playwright.config.ts)
3. Create Playwright test files organized by feature domain (12 domains), each test mapped to a criterion ID
4. Clean up or replace existing Vitest stubs in tests/observability/
5. 3 criteria expected to fail (4.10, 11.2, 11.6) due to open issues I-036, I-037, I-038

## Declared Files
- acceptance_criteria.md
- playwright.config.ts
- package.json
- tests/e2e/domain-01-auth.spec.ts
- tests/e2e/domain-02-dashboard.spec.ts
- tests/e2e/domain-03-chat.spec.ts
- tests/e2e/domain-04-campaigns.spec.ts
- tests/e2e/domain-05-teambox.spec.ts
- tests/e2e/domain-06-departments.spec.ts
- tests/e2e/domain-07-insights.spec.ts
- tests/e2e/domain-08-billing.spec.ts
- tests/e2e/domain-09-settings.spec.ts
- tests/e2e/domain-10-tasks.spec.ts
- tests/e2e/domain-11-integrations.spec.ts
- tests/e2e/domain-12-infrastructure.spec.ts
- tests/e2e/helpers/auth.ts
- tests/e2e/helpers/mcp.ts
- tests/e2e/helpers/mcp.ts
- sprints.json

## Success Criteria
- Every criterion in acceptance_criteria.md has a corresponding test
- Tests are runnable (npx playwright test --list shows all tests)
- Test file per domain, test name includes criterion ID (e.g. "1.1 Login sets httpOnly cookie")
- Playwright config points to correct base URL (http://localhost:5000)
- Auth helpers support login as each RBAC role
- 3 tests expected to fail are marked with .fixme() or equivalent
