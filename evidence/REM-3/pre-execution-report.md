# Pre-Execution Report: REM-3
Timestamp: 2026-03-19T01:00:00Z
Sprint: REM-3
Status: RETROACTIVE — originally written without governance compliance

## Objective
Fix 6 user-reported bugs + 1 infrastructure issue + 2 test infrastructure fixes. Data verification for dashboard metrics.

## Declared Files
```
client/src/components/ProductTour.tsx
client/src/components/layout/SubMenuManager.tsx
client/src/components/layout/TopBar.tsx
client/src/pages/sales.tsx
evidence/REM-3/cross-sign.md
evidence/REM-3/enforcer-checklist.txt
evidence/REM-3/loop-prep.md
evidence/REM-3/post-sprint-report.md
evidence/REM-3/pre-execution-report.md
evidence/REM-3/workflow-audit.log
evidence/watchdog-ack.txt
evidence/watchdog-report.txt
issues.md
server/routes/auth.ts
server/seed.ts
sprints.json
```
Source: git diff-tree -r f74f718

## Success Criteria
1. Tour only dismissable via X button (retroactive — derived from post-sprint REM-3-FE I-061)
2. Sidebar popout links navigate correctly (retroactive — derived from post-sprint REM-3-FE I-062)
3. Super Admin lands on Huminic org after login (retroactive — derived from post-sprint REM-3-AU I-065)
4. Org switch stays authenticated (retroactive — derived from post-sprint REM-3-AU I-066)
5. Rate limiter configurable via env var (retroactive — derived from post-sprint REM-3-AU I-067)
6. Dashboard metrics match direct queries (retroactive — derived from post-sprint REM-3-DT I-063)
7. Lead modal on sales page functional (retroactive — derived from post-sprint REM-3-FE I-064)
