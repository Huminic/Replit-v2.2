
---

## Ghost Exit Gate — R-014

**Verified by:** Ghost
**Timestamp:** 2026-03-27T03:30:00Z

### Verification Checklist

| Check | Result | Evidence |
|---|---|---|
| App.tsx has public/auth route split | PASS | PublicRouter (lines 41-48) renders /w/:slug and /p/:slug without AuthProvider. AuthenticatedRouter (lines 55-94) wraps all other routes in AuthProvider. isPublicRoute() (lines 101-103) controls conditional rendering. |
| server/index.ts has widget CORS middleware | PASS | widgetCors (line 61) applies to /api/widget and /widget paths. General CORS (lines 67-84) skips widget paths via explicit path check. |
| Only declared files modified | PASS | git diff --stat shows: App.tsx, TopBar.tsx, server/index.ts, billing.ts, chat.ts. App.tsx and server/index.ts are R-014 scope. Other files are R-015/R-016 scope. |
| Cross-sign format correct | PASS | Implementing Role: orchestrator, Reviewing Role: enforcer, Verdict: APPROVED |
| Build passes | PASS (dev-reported) | tsc --noEmit clean, 12/12 e2e tests |

EXIT GATE: CLEARED
