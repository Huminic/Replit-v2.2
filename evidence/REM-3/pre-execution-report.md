# Pre-Execution Report: REM-3
Timestamp: 2026-03-19T01:00:00Z
Sprint: REM-3
Status: READY

## Objective
Fix 6 user-reported bugs + 1 infrastructure issue + 2 test infrastructure fixes. Data verification for dashboard metrics.

## Declared Files
- server/routes/auth.ts
- client/src/components/layout/TopBar.tsx
- client/src/contexts/AuthContext.tsx
- client/src/components/ProductTour.tsx
- client/src/components/layout/SubMenuManager.tsx
- client/src/pages/main.tsx
- client/src/pages/sales.tsx
- client/src/pages/insights.tsx
- server/seed.ts
- tests/e2e/domain-02-dashboard.spec.ts
- tests/e2e/domain-03-chat.spec.ts
- tests/e2e/domain-06-departments.spec.ts
- tests/e2e/domain-07-insights.spec.ts
- evidence/REM-3/
- issues.md
- sprints.json

## Success Criteria
- Tour only dismissable via X button
- Sidebar popout links navigate correctly
- Super Admin lands on Huminic org after login
- Org switch stays authenticated, goes to "/"
- Rate limiter increased for test environment
- Dashboard metrics match direct queries
- Test selectors updated to match current UI
