# Independent E2E Campaign Workflow Test

**Date:** 2026-04-07
**Tester:** Independent verification agent (no prior knowledge of codebase or fixes)
**Account:** serra_honda@huminic.ai / NexxusTest2026 (org_admin, Serra Honda)
**Environment:** https://dev.huminicdev.com (Playwright MCP browser automation)

---

## Test Results Summary

| Step | Test | Result | Details |
|------|------|--------|---------|
| 1 | Navigate to /service - campaigns page visible? | PARTIAL | Page loads intermittently; severe routing instability causes frequent redirects |
| 2 | Campaigns listed with status indicators? | PASS | Two campaigns visible with Active/Paused status, SMS channel, recipient counts |
| 3 | Click campaign to open detail modal? | INCONCLUSIVE | Modal element (`dialog-campaign-detail`) detected in DOM intercepting clicks, but could not screenshot due to routing instability |
| 4 | Modal shows campaign stats? | INCONCLUSIVE | Could not reliably view modal content |
| 5 | Modal shows recipients table with real data? | INCONCLUSIVE | Could not reliably view modal content |
| 6 | TeamBox - campaign associations on conversations? | FAIL | No campaign tags/badges visible on any conversations; only AI-CHAT tags seen |
| 7 | Reply to conversation from TeamBox? | PARTIAL | Reply input ("Write a reply...") and send button visible; could not test actual send due to session instability |
| 8 | Polling behavior - smooth updates without flickering? | FAIL | Severe routing instability; page constantly redirects between routes |

---

## Verdict: FAIL

Three critical issues block a PASS verdict:
1. **Severe session/routing instability** prevents reliable use of the Service page
2. **No campaign associations** visible in TeamBox conversations
3. **Campaign detail modal** could not be reliably tested

---

## Detailed Findings

### Step 1: Navigate to /service

**Result: PARTIAL**

The Service page IS accessible at `/service` and renders correctly when it loads. Evidence:
- Screenshot `screenshot-service-page-attempt.png` shows clean Service page with heading "Service", tabs (Campaigns, Agents, Insights, Calendar), "Service Campaigns" header with CSV Template/Upload CSV/New Campaign buttons
- Screenshot `final-service-attempt.png` shows Service Insights tab with metrics: Active Campaigns: 1, Messages Sent: 0, Replies Received: 0, Open Conversations: 11

**Critical Issue:** The /service route is extremely unstable:
- Direct navigation (`page.goto('/service')`) frequently shows "Loading..." spinner indefinitely, then redirects to `/login`, `/teambox`, `/settings/system`, or `/sales`
- Sidebar "Service" button click often navigates to wrong routes (observed redirecting to `/sales`, `/settings/system?section=tools`, `/teambox`)
- The auth token refresh endpoint (`/api/auth/refresh`) returns 500, 400, and 401 errors repeatedly
- Sessions drop within seconds, requiring re-login
- Multiple "Failed to create main chat conversation" errors in console
- React DOM error: "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node" - indicates DOM state corruption

### Step 2: Campaigns listed with status indicators

**Result: PASS**

When the page loaded successfully (screenshot `campaigns-tab.png`), campaigns were clearly visible:

| Campaign | Source File | Status | Channel | Recipients | Sent | Replied | Kill Switch |
|----------|-----------|--------|---------|------------|------|---------|-------------|
| Service Reminder - February | test-recipients.csv | Active (green dot) | SMS | 16 | 0 | 0 | ON (blue toggle) |
| Oil Change Reminder | oil_change_due_march.csv | Paused (red dot) | SMS | 234 | 0 | 0 | OFF (gray toggle) |

- Status indicators are clear (green = active, red = paused)
- Kill Switch toggles are visible and functional-looking
- CSV Template button visible
- Campaign Safety warning banner at bottom: "Use the Kill Switch to immediately stop all outbound messages for a campaign. Individual conversations can also be disconnected from campaigns in TeamBox."

### Step 3: Click campaign to open detail modal

**Result: INCONCLUSIVE**

Evidence that the modal EXISTS in the codebase:
- Playwright error log confirms `data-testid="dialog-campaign-detail"` was detected as a Radix dialog component intercepting pointer events
- The dialog has proper attributes: `role="dialog"`, `data-state="open"`, `aria-labelledby`, `aria-describedby`
- It uses standard Radix UI dialog pattern with overlay (`bg-black/80`)

Could NOT capture a clean screenshot of the modal because:
- The routing instability caused the page to redirect before the modal could be screenshotted
- Multiple attempts resulted in the page jumping to /settings/system, /login, or showing "Loading..."

### Step 4: Modal shows campaign stats

**Result: INCONCLUSIVE** - Could not view modal content due to Step 3 issues.

### Step 5: Modal shows recipients table

**Result: INCONCLUSIVE** - Could not view modal content due to Step 3 issues.

### Step 6: TeamBox - campaign associations

**Result: FAIL**

TeamBox was successfully loaded and showed 12 conversations (screenshot `teambox-clean.png`, `teambox-sms-channel.png`):
- Duane Wells (AI-CHAT tag)
- Duane K. Wells
- Serra Honda Admin (multiple entries)
- Phone numbers (+1821616232, +1428670293)
- James Chen
- Stephanie Thompson

**No campaign-related badges, tags, or associations were visible on any conversation.** Only "AI-CHAT" tags were observed. If campaigns are supposed to show association tags on TeamBox conversations, this feature is not working.

### Step 7: Reply to conversation from TeamBox

**Result: PARTIAL**

The reply UI is present and appears functional:
- "Write a reply..." text input visible
- Blue send button (arrow icon) visible
- Input field is interactive

Could not test actual sending due to:
1. Session instability made it risky to attempt
2. CommGate rules prohibit actual sends to real people in testing

### Step 8: Polling behavior - smooth updates

**Result: FAIL**

The campaigns page does NOT update smoothly:
- Loading spinner visible during data fetch (screenshot `screenshot-service-page-attempt.png` shows spinner)
- Page frequently becomes unresponsive and redirects
- Multiple "Failed to fetch" and "Query error: Failed to fetch" console errors
- Auth token refresh failures cause cascading data fetch failures
- React DOM crash observed: "removeChild" error indicates render tree corruption
- UI panels overlap incorrectly (System Settings sidebar overlapping main content in `service-campaigns-full.png`)

---

## Console Errors Observed

| Error | Count | Severity |
|-------|-------|----------|
| `/api/auth/refresh` returning 500/400/401 | 15+ | CRITICAL |
| "Failed to create main chat conversation" | 6+ | HIGH |
| "Login failed: Invalid email or password" (intermittent 401) | 3 | HIGH |
| "Conversation not found" (404) | 4 | MEDIUM |
| "Failed to fetch" (generic network) | 10+ | HIGH |
| DOM removeChild error | 1 | HIGH |

---

## Screenshots Captured

| File | Description |
|------|-------------|
| screenshot-service-page-attempt.png | Service page with Campaigns tab, loading spinner, Campaign Safety banner |
| campaigns-tab.png | Clean view of campaigns list with 2 campaigns, statuses, and data |
| final-service-attempt.png | Service Insights tab with metrics |
| service-direct-nav.png | Service page with tutorial modal overlapping campaigns data |
| teambox-clean.png | TeamBox with channels sidebar, DKW conversation, reply input |
| teambox-sms-channel.png | TeamBox conversation list showing 12 conversations, no campaign tags |
| after-service-click.png | System Settings page shown after clicking Service (routing bug) |
| service-campaigns-full.png | Overlapping TeamBox sidebar + System Settings (rendering bug) |
| service-page-3.png | Dashboard with tutorial modal (routing to wrong page) |
| fresh-login.png | Post-login state |

---

## Root Cause Assessment

The primary blocker is **auth token refresh instability**. The `/api/auth/refresh` endpoint fails with 500/400/401 errors, which causes:
1. Session drops during navigation
2. Data fetch failures for campaigns, conversations, and other API calls
3. Cascading re-renders that corrupt the React DOM tree
4. Route redirects as the auth guard kicks users to /login

Secondary issue: **Sidebar routing logic** appears broken - clicking "Service" in the sidebar sometimes navigates to the wrong route entirely (observed: /sales, /settings/system, /teambox instead of /service).

---

## Recommendations

1. **CRITICAL:** Fix the auth token refresh mechanism - the `/api/auth/refresh` endpoint must not return 500 errors
2. **HIGH:** Fix sidebar routing - Service button must consistently navigate to /service
3. **HIGH:** Add campaign association tags/badges to TeamBox conversations
4. **MEDIUM:** Verify campaign detail modal renders and contains stats + recipients table
5. **MEDIUM:** Fix overlapping panel rendering when switching between pages
6. **LOW:** Remove or debounce the loading spinner to prevent flicker
