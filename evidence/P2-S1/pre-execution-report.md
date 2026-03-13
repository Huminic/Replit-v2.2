# P2-S1 Pre-Execution Report
**Sprint:** P2-S1 — Token security (httpOnly cookies)
**Generated:** 2026-03-13T19:22:00Z
**Role:** orchestrator

## Pre-Conditions
- [x] P2-S0 committed (hash: 4103905)
- [x] No uncommitted changes (worktree clean before sprint start)
- [x] Enforcer agent running on port 8004
- [x] On local-dev branch
- [x] P2-S1 registered in sprints.json as in_progress
- [x] Evidence directory created: evidence/P2-S1/

## Sprint Scope
Files to modify:
- server/auth.ts (add cookie helpers)
- server/index.ts (add cookie-parser middleware)
- server/routes.ts (auth endpoints: login, refresh, logout, switch-org)
- client/src/lib/tokenStore.ts (NEW: in-memory token store)
- client/src/lib/queryClient.ts (use tokenStore instead of localStorage)
- client/src/contexts/AuthContext.tsx (cookie-based refresh, in-memory tokens)
- client/src/hooks/useSessionTimeout.ts (use tokenStore)
- client/src/contexts/AppContext.tsx (use tokenStore)
- 10+ page/component files (replace localStorage.getItem with getAccessToken())
- package.json, package-lock.json (cookie-parser dependency)

## Risk Assessment
- HIGH: Auth flow change affects all authenticated users
- MITIGATION: Legacy body-based refresh fallback preserved on server
- MITIGATION: Access token getter centralized — single point of change
