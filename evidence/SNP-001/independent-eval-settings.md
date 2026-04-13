# Independent Evaluation: Settings Section

**Evaluator:** Independent Verifier (Track 2)
**Date:** 2026-04-07
**Target:** https://dev.huminicdev.com/settings/system
**Login:** duane.wells@huminic.ai (super_admin)
**Approach:** Blind evaluation using Playwright MCP browser tools. No prior knowledge of fixes or implementation.

---

## Executive Summary

The Settings section is **functionally inaccessible** due to a critical token refresh race condition. Navigating to Settings (via the sidebar "System" button or direct URL) triggers concurrent API calls that race on token refresh, causing the session to be destroyed and the user to be redirected to the login page. The Settings page briefly renders (all 6 data API calls return HTTP 200) before the auth race condition kills the session.

**Verdict: FAIL**

---

## Finding 1: Token Refresh Race Condition Destroys Session (CRITICAL)

### Description

When the user navigates to `/settings/system`, the Settings page fires 6+ API calls simultaneously:
- `GET /api/users` — 200
- `GET /api/roles` — 200
- `GET /api/outbound/status` — 200
- `GET /api/widgets` — 200
- `GET /api/settings/org` — 200
- `GET /api/documents` — 200

All return HTTP 200 successfully. However, when the access token is expired or missing from memory (common after SPA navigation), multiple calls simultaneously attempt `POST /api/auth/refresh`. This triggers a token rotation race condition.

### Root Cause (server/routes/auth.ts:228-229)

The refresh endpoint implements **token rotation** — it deletes the old session before creating a new one:

```
Line 228: // Token rotation: delete old session, create new one
Line 229: await storage.deleteSession(session.id);
```

When two concurrent refresh calls arrive with the same refresh token:
1. **Call A** finds the session, deletes it, creates a new session, sets a new refresh cookie
2. **Call B** looks up the same token — session already deleted by Call A — returns **401** and **clears the refresh cookie** (lines 208-209)
3. Call B's `clearRefreshCookie` response **overwrites** Call A's new cookie
4. The frontend sees the 401 and redirects to `/login`

### Evidence

Captured via Playwright network interception during System button click:
```
POST /api/auth/refresh => 401 (lost the race — session already deleted)
POST /api/auth/refresh => 200 (won the race — but cookie overwritten by losing call's clear)
```

### Reproduction Steps

1. Login as duane.wells@huminic.ai
2. Navigate to any page (Sales, Insights — works fine)
3. Click "System" in sidebar OR navigate to `/settings/system`
4. Session is destroyed, redirect to `/login`

Reproduced **6+ times** during evaluation with 100% consistency.

### Severity: CRITICAL

The Settings section is completely unusable. No user can access any settings functionality.

---

## Finding 2: Role Mismatch in localStorage After Login (HIGH)

### Description

After login with `duane.wells@huminic.ai`, the API correctly identifies the user as:
- **Email:** duane.wells@huminic.ai
- **Role:** super_admin (level 1)
- **Organization:** Huminic

However, `localStorage` stores `nexxus-current-role: "org_admin"` and the UI renders as Serra Honda org_admin in some sessions. The profile menu was observed showing "serra_honda@huminic.ai / Organization Admin" despite logging in with duane.wells credentials.

### Evidence

API response from `POST /api/auth/login`:
```json
{
  "user": {
    "id": "bde19db9-ffe9-482b-ab25-186d3032cb6d",
    "email": "duane.wells@huminic.ai",
    "role": { "name": "super_admin", "level": 1 },
    "organization": { "name": "Huminic" }
  }
}
```

But localStorage after login: `nexxus-current-role: "org_admin"`, header shows "Serra Honda", avatar shows "SHA".

### Analysis

The SPA appears to restore a cached org/role from a previous session (the org-switch state persists in localStorage). When duane.wells previously switched to Serra Honda, that context was cached and is now restored over the fresh login response. The mismatch means:
- The sidebar sometimes lacks "Manage" button (super_admin feature)
- The org switcher dropdown is absent (org_admin cannot switch orgs per `canSwitchOrgs()`)
- Data shown is for Serra Honda, not Huminic

### Severity: HIGH

Super admin sees wrong org data and has reduced permissions in the UI.

---

## Finding 3: Session Instability on Full Page Navigation (MEDIUM)

### Description

The SPA stores the access token in memory (not in cookies or localStorage). When a full page reload occurs (browser navigation, `page.goto()`), the in-memory token is lost. The app then relies on the cookie-based refresh token to re-authenticate.

Pages like `/sales`, `/teambox`, `/insights` survive this because they trigger fewer concurrent API calls on mount — a single refresh call succeeds. The Settings page triggers 6+ API calls simultaneously, making the race condition (Finding 1) nearly guaranteed.

### Severity: MEDIUM

Amplifying factor for Finding 1. Not independently blocking but makes the race condition deterministic for Settings.

---

## Finding 4: Org Name Display Inconsistency (MEDIUM)

### Description

During evaluation, the header org name displayed variously:
- "Serra Honda" (after login, during org_admin state)
- "Huminic" with dropdown (briefly, during super_admin state)
- No org name (during session transitions)

The org name in the header toggles between a static label (for non-switching roles) and a dropdown button (for org-switching roles). When the role in localStorage mismatches the actual role from the API, the wrong display mode is used.

### Severity: MEDIUM

Users see incorrect org context, which could lead to viewing or modifying settings for the wrong organization.

---

## Finding 5: Settings RBAC — org_admin Access to System (LOW)

### Description

The `canAccessSystem()` function in `client/src/lib/rbac.ts:18-20` grants Settings access to `super_admin`, `partner_admin`, AND `org_admin`. The settings tiles within the page have per-tile `minRole` restrictions (e.g., "AI Configuration" limited to super_admin/partner_admin only).

The project RBAC spec states: "Sales/Marketing/Service: All except Management, Settings" — implying Settings is restricted. But org_admin is NOT in the Sales/Marketing/Service category, so org_admin access may be intentional.

### Severity: LOW

The code is internally consistent. The per-tile `minRole` arrays provide granular control. May be working as designed.

---

## 8-Question Commentary

| # | Question | Answer |
|---|----------|--------|
| 1 | Does the element render? | Briefly yes (1-2 seconds). Tile grid with 6 cards visible before session death. |
| 2 | Does it show real data? | Cannot evaluate — page destroyed before data renders. API calls return 200. |
| 3 | Can a user interact with it? | **No.** Page redirects to login before any click/form interaction is possible. |
| 4 | Does it fail gracefully? | **No.** Silent redirect to login. No error message or toast. User is simply logged out. |
| 5 | Is the data plausible? | Cannot evaluate — page inaccessible. |
| 6 | Are there false-pass CSS classes? | Cannot evaluate. Brief snapshot showed properly styled tiles with gradients. |
| 7 | Is cross-screen consistency maintained? | **No.** Org name and role context are inconsistent between pages. System button visible but leads to logout. |
| 8 | Are there accessibility issues? | Cannot fully evaluate. Sidebar button has proper `data-testid`. Page heading hierarchy (H1, H3) is correct in brief snapshot. |

---

## Settings Sub-Sections Not Evaluated

Due to the session destruction bug, none of the following sub-sections could be evaluated:

| Section | Tile minRole | Status |
|---------|-------------|--------|
| User Management | super_admin, partner_admin, org_admin | NOT EVALUATED |
| Organization | super_admin, partner_admin, org_admin | NOT EVALUATED |
| Tools & Integrations | super_admin, partner_admin, org_admin | NOT EVALUATED |
| Knowledge Base | super_admin, partner_admin, org_admin | NOT EVALUATED |
| AI Configuration | super_admin, partner_admin | NOT EVALUATED |
| Notifications | super_admin, partner_admin, org_admin | NOT EVALUATED |
| Appearance | super_admin, partner_admin, org_admin | NOT EVALUATED |

---

## Summary Table

| # | Finding | Severity | Category |
|---|---------|----------|----------|
| 1 | Token refresh race condition destroys session on Settings navigation | CRITICAL | Auth/Backend |
| 2 | localStorage stores wrong role after login (org_admin instead of super_admin) | HIGH | Auth/Frontend |
| 3 | Session instability on full page navigation amplifies race condition | MEDIUM | Auth/Frontend |
| 4 | Org name display inconsistency in header | MEDIUM | UI |
| 5 | Settings accessible to org_admin — consistent with code RBAC, may conflict with spec | LOW | RBAC |

---

## Recommended Fixes

### Finding 1 (CRITICAL — blocks all Settings evaluation)

**Frontend fix (preferred):** Add a refresh token mutex/queue. Only one `POST /api/auth/refresh` should be in-flight at a time. All concurrent 401 responses should wait for the single refresh to complete, then retry with the new access token. Standard pattern: `axios-auth-refresh` or custom interceptor with promise deduplication.

**Backend fix (defense-in-depth):** Make the refresh endpoint idempotent. Instead of immediately deleting the old session on line 229, add a grace period (e.g., old token remains valid for 30 seconds after rotation) or detect duplicate calls within a window and return the same new token.

### Finding 2 (HIGH)

On fresh login, clear any cached `nexxus-current-role` and org context from localStorage before applying the login response values. The org-switch state from a previous session should not persist.

---

## Verdict: FAIL

The Settings section cannot be used by any user in any role. The critical auth race condition (Finding 1) must be fixed before any Settings functionality can be evaluated. This is a complete blocker.
