# Independent E2E Test: Campaign Workflow (WF-3)

**Date:** 2026-04-07
**Tester:** Independent E2E Agent (no knowledge of fixes or implementation)
**Target:** https://dev.huminicdev.com
**Account:** serra_honda@huminic.ai (org_admin, Serra Honda)

---

## Login

- **Step:** Navigate to https://dev.huminicdev.com, enter serra_honda@huminic.ai / NexxusTest2026
- **Result:** YES - Login works. Redirects to /sales after login. Header shows "Serra Honda" and "SHA" avatar.
- **Issue observed:** After login, the app sometimes auto-switches to a different user session (Huminic/DKW super_admin) without any user action. This happened multiple times during testing. The session identity is unstable.

---

## WF-3 Step 1: Navigate to Service/Campaigns

- **What I see:** Clicking "Service" in the sidebar navigates to /service. The Service page has a sub-navigation with four tabs: **Campaigns**, **Agents**, **Insights**, **Calendar**. The main content area shows "AI Key Metrics" (Active Pipeline: 0, Appointments Today: 0, Open Escalations: 0, Outbound Sent 24h: 0) and a chat interface.
- **Does this step work?** PARTIAL
- **What is wrong:** The sidebar routing is severely unstable. Clicking sidebar buttons frequently navigates to the wrong page (e.g., clicking Service lands on /insights or /settings/system, clicking TeamBox lands on /marketing). The URL in the address bar and the actual rendered content frequently disagree. On one successful load, the Campaigns tab was visible and clickable in the main content area.

---

## WF-3 Step 2: Find an existing campaign (or check if creation is available)

- **What I see:** On one successful page load, the Campaigns view showed:
  - Header: "Service Campaigns" with three action buttons: CSV Template (download link), Upload CSV, New Campaign
  - A data table with columns: Campaign, Status, Channel, Recipients, Sent, Replied, Kill Switch, Actions
  - **Two existing campaigns:**
    1. "Service Reminder - February" (test-recipients.csv) -- Status: active, Channel: SMS, Recipients: 16, Sent: 0, Replied: 0, Kill Switch: ON (checked)
    2. "Oil Change Reminder" (oil_change_due_march.csv) -- Status: paused, Channel: SMS, Recipients: 234, Sent: 0, Replied: 0, Kill Switch: OFF
  - Each campaign row has 4 action buttons (icons only, likely: edit, view, delete, and one more)
  - Campaign Safety info card at bottom explaining Kill Switch functionality
- **Does this step work?** YES (when the page loads correctly)
- **Campaign creation available?** YES -- "New Campaign" button is present. "Upload CSV" and "CSV Template" also available.

---

## WF-3 Step 3: Check recipients list loads with real data

- **What I see:** The campaigns table shows recipient counts (16 and 234) which appear to be real data loaded from uploaded CSV files (test-recipients.csv and oil_change_due_march.csv). However, I was unable to click into a campaign row to view the individual recipients list due to the routing instability -- every attempt to interact further caused the page to redirect away.
- **Does this step work?** PARTIAL
- **What is wrong:** Recipient counts are visible in the table but the detail view (individual recipients) could not be verified because the page redirects on interaction. Sent and Replied counts are both 0 for both campaigns, suggesting no messages have actually been dispatched.

---

## WF-3 Step 4: Check campaign status tracking

- **What I see:** Campaign status is displayed in the table as colored badges: "active" and "paused". The Kill Switch toggle is visible per-campaign (checked = active kill switch). Status tracking columns (Sent, Replied) are present but show 0/0 for both campaigns.
- **Does this step work?** PARTIAL
- **What is wrong:** Status labels and Kill Switch are present and functional-looking. However, Sent/Replied metrics are all zero, so there is no evidence that campaign execution tracking actually works end-to-end. It may be that no campaigns have been executed, or tracking may not be wired up.

---

## WF-3 Step 5: Navigate to TeamBox -- do campaign-related conversations appear?

- **What I see:** Unable to reach TeamBox. Every attempt to navigate to TeamBox (both via sidebar click and direct URL /teambox) resulted in redirection to other pages (/marketing, /insights, /settings/system). TeamBox was never successfully loaded during this test session.
- **Does this step work?** NO
- **What is wrong:** Sidebar routing is broken. Clicking "TeamBox" does not navigate to TeamBox. Direct URL navigation to /teambox also fails (redirects to /insights).

---

## WF-3 Step 6: Check if campaign filter in TeamBox works

- **What I see:** N/A -- TeamBox could not be loaded.
- **Does this step work?** NO (BLOCKED)
- **What is wrong:** Depends on Step 5 which failed.

---

## WF-3 Step 7: Can you view/reply to a campaign conversation?

- **What I see:** N/A -- TeamBox could not be loaded.
- **Does this step work?** NO (BLOCKED)
- **What is wrong:** Depends on Step 5 which failed.

---

## Cross-Cutting Issues Discovered

### CRITICAL: Sidebar Routing Instability
- Sidebar navigation buttons frequently route to the wrong page
- Observed misroutes: Service -> /insights, Service -> /settings/system, TeamBox -> /marketing, TeamBox -> /settings/system
- The URL bar sometimes shows one path while the rendered content shows a different page
- This is not an intermittent network issue -- it happens consistently across multiple login sessions

### CRITICAL: Session Identity Switching
- After logging in as serra_honda@huminic.ai (Serra Honda, SHA), the session spontaneously switches to duane.wells@huminic.ai (Huminic, DKW) without user action
- This happened at least twice during testing
- The header changes from "Serra Honda / SHA" to "Huminic / DKW" and the sidebar gains extra items (e.g., "Manage" tab only visible to super_admin)
- This is a security concern -- an org_admin should never see super_admin views

### MODERATE: Session Expiry
- The authentication session expires very frequently (within ~30 seconds of inactivity or on certain navigations)
- page.goto() calls to /service reliably kill the session and redirect to /login
- Sidebar navigation sometimes preserves the session, sometimes does not

### MINOR: Campaign Execution Data
- Both campaigns show 0 Sent and 0 Replied despite one being "active"
- Cannot determine if this is expected (no campaigns actually executed) or a data/tracking bug

---

## Workflow Continuity Assessment

| From Step | To Step | Feeds Correctly? | Notes |
|-----------|---------|-------------------|-------|
| Login | Service/Campaigns | PARTIAL | Navigation unreliable, page loads when it works |
| Campaign List | Campaign Detail | UNTESTED | Could not click into campaign due to routing |
| Campaign List | TeamBox | NO | TeamBox unreachable |
| TeamBox | Campaign Filter | BLOCKED | TeamBox unreachable |
| TeamBox | Reply to Conversation | BLOCKED | TeamBox unreachable |

---

## Final Verdict: FAIL

### Specific Failures:
1. **CRITICAL** -- Sidebar routing is broken: navigation buttons route to wrong pages consistently
2. **CRITICAL** -- TeamBox is completely unreachable (both via sidebar and direct URL)
3. **CRITICAL** -- Session identity spontaneously switches between users (security issue)
4. **MODERATE** -- Session expires frequently, making sustained workflows impossible
5. **PARTIAL** -- Campaign list loads with real data when the page successfully renders, but campaign detail and recipient views could not be tested
6. **BLOCKED** -- Steps 5-7 (TeamBox campaign integration) could not be tested at all

### What Works:
- Login flow (credentials accepted, session created)
- Service/Campaigns page renders correctly when reached (2 campaigns with real data, CSV upload, New Campaign button, Kill Switch toggles)
- Campaign table shows proper columns and data structure
- Insights page loads with real analytics data (456 total leads, 164 hot leads)

### What Does Not Work:
- Reliable navigation between pages
- TeamBox access
- Campaign detail/recipient views (blocked by routing)
- Session stability
- User identity consistency
