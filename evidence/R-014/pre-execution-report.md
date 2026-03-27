# Pre-Execution Report: R-014 — Landing Page & Widget Fixes

**Sprint:** R-014
**Type:** Frontend + backend fix
**Date:** 2026-03-27
**Status:** AWAITING ENTRY GATE

## Objective
Fix two HIGH defects blocking dealer landing pages: the /p/{slug} route redirect race condition that prevents landing pages from rendering when an admin is logged in, and the CORS configuration that blocks widget embed on external dealer websites.

## Declared Files
- client/src/App.tsx — I-134: reorder routes so /p/:slug and /w/:slug are matched before catch-all ProtectedRoute
- client/src/pages/widget-landing.tsx — I-134: if additional route handling needed
- server/index.ts — I-135: add CORS whitelist for widget endpoints (/widget/*, /api/widget/*)
- tests/e2e/s8-landing-widgets.spec.ts — verify fixes
- client/src/components/layout/TopBar.tsx — I-148 (R-015): Remove Role Switcher
- server/routes/chat.ts — I-139 (R-016): CRM Guru → Data Guru
- server/routes/billing.ts — I-139 (R-016): CRM Guru → Data Guru

## Issues to Fix
| Issue | Description | Severity |
|---|---|---|
| I-134 | /p/{slug} route caught by catch-all before explicit route renders. AuthProvider redirects to login. | HIGH |
| I-135 | Widget endpoints return 500 on cross-origin requests with Origin header. Blocks external embed. | HIGH |

## UI Changes
None visible — route ordering and CORS headers are infrastructure.

## Test Plan
```
npx playwright test tests/e2e/s8-landing-widgets.spec.ts --project=sprint --reporter=list --workers=1
```

## Diff Reference
No previous attempt for these issues.

---

## Entry Gate Verification

**Date:** 2026-03-26
**Verifier:** Ghost

| Check | Result |
|---|---|
| Pre-exec exists | YES |
| Objective stated | YES — fix I-134 route race, I-135 CORS |
| Issues listed | YES — I-134 (HIGH), I-135 (HIGH) |
| Declared files match sprints.json | YES — 4/4 match exactly |
| Worktree clean for declared files | YES — no uncommitted changes |
| Test plan present | YES |

ENTRY GATE: APPROVED
