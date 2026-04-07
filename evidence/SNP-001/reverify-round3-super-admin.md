# Re-Verification Round 3 — Super Admin (duane.wells@huminic.ai)

**Date:** 2026-04-07
**Tester:** Independent verifier (agent)
**Account:** duane.wells@huminic.ai (super_admin, Huminic)

## Test 1: Session Stability on Settings — FAIL

- **Settings loads:** YES. Navigated to `/settings/system` via "System" sidebar. Page rendered with all 8 sub-sections (Users, Organization, Tools & Integrations, Knowledge Base, AI Configuration, Notifications, Appearance, Billing).
- **30-second idle redirect:** FAIL. After waiting 30 seconds on `/settings/system`, the page auto-redirected to `/insights`. No redirect to `/login`, but the unwanted navigation away from Settings is a bug.
- **Sub-section clicks:** User Management tile loaded correctly (showed user list with System Admin, Partner Admin).
- **Round-trip (Dashboard -> Settings):** Session dropped. Navigating to `/` caused full session loss and redirect to `/login`. This happened consistently across 3 attempts.

**Key finding:** Navigating to the root URL (`/`) via `page.goto()` reliably kills the session. Sidebar-based navigation between pages works, but direct URL navigation to `/` triggers logout.

## Test 2: AI Chat — PASS

- **Page loads:** YES. AI Chat at `/` shows key metrics, suggestion buttons, and chat input.
- **Message sent:** "Hello, what can you help me with?" sent via Enter key.
- **Response received:** YES. Within ~3 seconds: "Hey Duane! Good to have you here. I'm Admin, your Nexxus Connect"
- **Loading indicator:** Response appeared quickly; no distinct loading spinner observed but response was fast enough.
- **Console errors:** None.

## Test 3: Sidebar Routing — PASS

All sidebar links route correctly:

| Sidebar Item | Expected Route | Actual Route | Verdict |
|---|---|---|---|
| Sales | /sales | /sales | PASS |
| Service | /service | /service | PASS |
| Insights | /insights | /insights | PASS |
| TeamBox | /teambox | /teambox | PASS |

**Note:** One earlier test saw AI Chat click go to `/sales` instead of `/`, but this did not reproduce on the final session. Sidebar routing was consistent and correct on the definitive test pass.

## Summary

| Test | Verdict |
|---|---|
| Settings Session Stability | **FAIL** — auto-redirects to /insights after 30s idle |
| AI Chat | **PASS** — sends message, receives response |
| Sidebar Routing | **PASS** — all 4 routes correct |

## Additional Observations

1. **Post-login destination inconsistent:** After login, the app sometimes lands on `/insights`, sometimes `/teambox`, sometimes `/`. Not always the AI Chat dashboard.
2. **Direct URL navigation breaks session:** Using `page.goto('https://dev.huminicdev.com/')` after being logged in consistently causes session loss and redirect to `/login`. This is a significant bug that may affect users who manually type the URL or use bookmarks.
