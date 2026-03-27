# Cross-Sign: R-014 — Landing Page & Widget Fixes

**Sprint:** R-014
**Date:** 2026-03-27T03:19:52Z

## Implementing Role: orchestrator

### Work Summary
- Fixed I-134 (route redirect race) by splitting Router into PublicRouter and AuthenticatedRouter, with conditional AuthProvider rendering based on path
- Fixed I-135 (CORS blocks cross-origin) by extending permissive widget CORS to cover both /api/widget and /widget paths, and preventing the restrictive general CORS from overriding widget paths
- Both fixes are minimal, targeted changes with clear separation of concerns

### Files Modified
| File | Lines | Change |
|---|---|---|
| client/src/App.tsx | 36-131 | Split Router, added isPublicRoute check, conditional AuthProvider |
| server/index.ts | 59-84 | Shared widgetCors middleware, path-guarded general CORS |

### Evidence
- TypeScript: `npx tsc --noEmit` — clean
- Tests: 12/12 passed (s8-landing-widgets.spec.ts)

## Reviewing Role: enforcer

### Checklist
| Check | Result |
|---|---|
| Changes match declared files | YES — App.tsx, server/index.ts only |
| No undeclared file modifications | YES |
| TypeScript compiles clean | YES |
| Tests pass | YES — 12/12 |
| No security regressions | YES — CORS wildcard only on widget paths, general CORS unchanged |
| No scope creep | YES — only I-134 and I-135 addressed |
| Changes are reversible | YES — git revert would restore prior behavior |

### Verdict: APPROVED

Both fixes address the declared issues with minimal surface area. The route split cleanly separates public from authenticated rendering. The CORS fix eliminates the middleware conflict without broadening access on non-widget routes.
