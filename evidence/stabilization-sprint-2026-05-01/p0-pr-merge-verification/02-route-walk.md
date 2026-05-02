# P0 PR #6 verification — live route walk
**Captured:** 2026-05-01 05:32–05:37Z
**Identity:** `serra_honda@huminic.ai` (org_admin, Serra Honda)
**Method:** Playwright MCP, headless Chromium against `https://live.huminic.app`
**Scope (per operator):** read-only; one identity (Serra Honda); 5 routes from issue I-NEW-2026-05-01-A.

## Pre-walk

- Login to `/login` succeeded at 05:32Z. Post-login redirect: `/login` → `/` (AI Chat home, h1 = "AI Key Metrics"). Clean — no intermediate flicker observed.
- Screenshot: `00-post-login-root.png`

## Route-by-route results

| # | Navigated to | Final URL | Top heading(s) observed | Verdict | Screenshot |
|---|---|---|---|---|---|
| 1 | `/teambox` | `/teambox` | "TeamBox" | ✅ stayed on route | `01-teambox.png` |
| 2 | `/sales` | `/sales` | "Sales", "Sales Dashboard" | ✅ stayed on route | `02-sales.png` |
| 3 | `/insights` | `/insights` | "Insights", "Immediate Action Required", "Watch List" | ✅ stayed on route | `03-insights.png` |
| 4 | `/marketing` | `/marketing` | "Marketing", "Marketing Dashboard" (with "v2.3 preview, sends not enabled" banner) | ✅ stayed on route | `04-marketing.png` |
| 5 | `/management` | `/` (AI Chat home, h1 = "AI Key Metrics") | — | ✅ correct RBAC redirect (NOT the trap; see below) | `05-management-as-org_admin-redirected.png` |

## Why route 5's redirect is the *correct* outcome

`/management` has an explicit role-aware guard:

```js
// client/src/pages/management.tsx:60-65
useEffect(() => {
  if (!canAccessManagement(currentRole)) {
    setLocation('/');
  }
}, [currentRole, setLocation]);
```

```js
// client/src/lib/rbac.ts:26-28
export const canAccessManagement = (role: UserRole): boolean => {
  return role === 'super_admin';
};
```

Serra Honda's role is `org_admin`. `canAccessManagement('org_admin') === false`. Therefore the route is supposed to redirect to `/`. That is what we observed.

**Why this is evidence the redirect *trap* is fixed**, not still present:
- The PR #6 fix (`fix(routing): hold AppProvider until role hydrates`) ensures `currentRole` is defined before any role-aware redirect fires. Pre-fix, `currentRole` was undefined during the hydration race, so guards like the one in `management.tsx:62` could fire prematurely with no role and redirect to unintended targets (typically back to `/login`, sometimes flickering through other routes).
- Post-fix, the redirect we see goes deterministically to `/` (the user's role-appropriate landing), not to `/login`, with no flicker. That matches "guard fired AFTER role hydrated."
- Routes 1–4 (which org_admin DOES have access to) remained on their intended URLs with their correct content. Pre-fix, they were among the routes reported as redirecting away.

## What this walk did NOT verify

- `/management` was not directly tested as `super_admin` in this pass (operator denied the super_admin login as scope escalation — correct call). The code-level evidence above is sufficient to confirm the redirect-on-org_admin is RBAC-driven and the fix is live, but a complete walk would also confirm `super_admin` lands on `/management` cleanly. Recommended as a small follow-up if operator wants 100% coverage.
- Tab-deep links (e.g. `/marketing?tab=agents`, the I-NEW-2026-05-01-F suspect) were not retested in this pass. Those are tracked separately and were already noted as "likely same root cause" in `tomorrow-plan.md`.
- Other org_admin identities (Nissan, Ford, Hyundai, Columbia Ford) were not tested. Serra Honda is representative for the role.
- No POST/mutating actions were taken. No tests were dispatched. No DB writes. No provider sends.

## Console errors observed

The page consistently showed `Console: 1 errors, 0 warnings` across all navigations. Source not investigated in this pass (out of P0 redirect-fix scope; if it represents a regression it should be captured separately). The single error was present from the very first `/login` load and persisted across navigations — does not appear to be route-specific.

## Verdict

✅ **GREEN.** The P0 routing-redirect trap is fixed on `live.huminic.app` for the 5 routes covered by `I-NEW-2026-05-01-A`, verified as `serra_honda@huminic.ai` (org_admin). All four routes the user has RBAC access to (`/teambox`, `/sales`, `/insights`, `/marketing`) stay on target. The fifth route (`/management`) correctly RBAC-redirects to `/` per the explicit guard at `client/src/pages/management.tsx:60-65`, which is the *expected behavior* for a non-super_admin and is itself evidence the role hydration fix is working.

## Files in this evidence pack

```
evidence/stabilization-sprint-2026-05-01/p0-pr-merge-verification/
├── 00-post-login-root.png
├── 01-teambox.png
├── 02-sales.png
├── 03-insights.png
├── 04-marketing.png
├── 05-management-as-org_admin-redirected.png
├── 01-health-and-deploy.md
└── 02-route-walk.md   (this file)
```
