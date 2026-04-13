# Independent E2E Test — WF-1: VAPI/VIN Flow (Round 2)

**Date:** 2026-04-07
**Tester:** Independent E2E Agent (Track 3, Round 2)
**Account:** serra_honda@huminic.ai (org_admin, Serra Honda)
**Target:** https://dev.huminicdev.com
**Approach:** Blind evaluation — no knowledge of fixes or implementation details

---

## Login

- **Result:** YES — Login works
- **Observations:**
  - Login form accepts credentials and authenticates successfully
  - Post-login redirect lands on various pages (`/service`, `/teambox`, `/`) depending on session state
  - **BUG: Session instability** — Auth tokens stored in memory (not localStorage). Only `nexxus_refresh` httpOnly cookie persists. Direct URL navigation via browser frequently causes session loss, redirecting to `/login`. Sidebar click navigation within the SPA is more reliable but still drops sessions intermittently. This affected testing significantly — multiple re-logins required across all workflow steps.
  - **BUG: User identity confusion** — On some session restorations, the header showed "Huminic" with user "DKW" (super_admin duane.wells) instead of "Serra Honda" / "SHA". The refresh token appears to sometimes restore a different user's session. This is a security concern.

---

## WF-1 Step 1: VAPI Assistant Configuration (Settings > Integrations)

- **What I see:** Settings > System page has a "Tools & Integrations" card. Clicking it opens a sub-page with tabs: **MCP, API, Other, Universal, Widgets, Pages**. The MCP tab shows: "No MCP tools configured. MCP tools are added via backend configuration."
- **Does this step work?** PARTIAL
- **What is wrong:**
  - There is no VAPI-specific configuration UI visible to the org_admin. The MCP tab is empty — VAPI is configured via backend only.
  - No way for an org admin to see or manage their VAPI assistant settings, phone numbers, or webhook configuration from the UI.
  - The Tools & Integrations card click sometimes navigates to the home page instead of the integrations sub-page (routing instability).
- **Evidence:** `e2e-wf1-insights.png` (captured the Tools & Integrations sub-page showing MCP/API/Other/Universal/Widgets/Pages tabs)

---

## WF-1 Step 2: TeamBox Phone Tab — Call Transcripts

- **What I see:** TeamBox loads with a channels sidebar showing:
  - SMS: 2 conversations
  - Email: 1 conversation
  - Phone: 3 conversations
  - Video: 0
  - Tasks: 0
- **Conversation list visible in "All" view:** Includes entries for "Unknown Caller" (VAPI calls — 3 entries at 17 min, 21 min, 24 min ago), "Website Visitor" (8 min ago), "Test Probe" (24 min ago), "Duane K. Wells" (about 1 hour ago). Agent "Caroline" handles voice calls.
- **Conversation filter tabs present:** All, SMS, Email, Voice visible at top of conversation list.
- **Does this step work?** PARTIAL
- **What is wrong:**
  - **BUG: Phone channel click intercepted** — Clicking the "Phone" channel in the TeamBox sidebar is blocked by an overlapping element (a campaign filter combobox intercepts pointer events). Playwright logs: `<button data-testid="select-campaign-filter"> subtree intercepts pointer events`. Users cannot reliably click the Phone channel to filter conversations.
  - **BUG: Phone click navigates away** — When force-clicked, the Phone channel click navigated to `/sales` instead of filtering TeamBox conversations to phone-only. This is a routing/event-handling bug.
  - The "All" conversations view does show phone conversations mixed in, and the Voice filter tab exists but was not reliably clickable.
  - One opened conversation ("Duane K. Wells" tagged AI-CHAT) showed "No messages yet" with a reply box — transcript content not visible.
- **Evidence:** `e2e-wf1-teambox-main.png`, `e2e-vapi-04-teambox.png`

---

## WF-1 Step 3: Insights — Warehouse Lead Count

- **What I see:** Insights Dashboard loaded with data:

| Metric | Value |
|--------|-------|
| Hot Leads Going Cold | 20 |
| New Leads Without Contact | 20 |
| Showroom Visitors Not Closed | 0 |
| Stale Leads (>7 days) | 0 (Avg Age: 14 days) |
| Pending Finance | 0 |
| Pipeline Active | 164 |
| Total Leads | 456 |
| Conversion Rate | 2.4% |
| Active Pipeline | 456 leads in play |
| Freshness Score | Stale (31% under 7 days) |
| Hot Leads | 164 (36% of active) |
| Month-End Forecast | 11 (-39 vs target 50) |
| Win Rate | 2.4% |
| Total Sold | 11 |
| Last Updated | 8:45 AM |

- **Charts:** "Leads This Week" and "Conversions by Day" both render with data points
- **Does this step work?** YES
- **Data plausibility:** 456 total leads for a Honda dealership over 30 days is plausible. Metrics are internally consistent: 11 sold / 456 total = 2.4% win rate (matches).
- **BUG: Data inconsistency** — On one load, Insights showed all zeros (0 for every metric including Total Leads). On the next load with the same account, it showed the 456/164 data. This suggests a race condition in data loading or an org-context timing issue.
- **Evidence:** `e2e-vapi-01-insights-dashboard.png`

---

## WF-1 Step 4: VIN Sync Status

- **What I see:** On the Sales Dashboard, there is a clear sync indicator:
  - **"Warehouse — Synced 44m ago"** badge visible at top of Sales Dashboard
  - This indicates VIN Solutions delta sync is running and completed recently
- **Does this step work?** YES
- **Observations:**
  - The sync indicator is present and shows a recent timestamp
  - Recent Activity log on Sales Dashboard shows:
    - "Sync Backfill Completed — about 8 hours ago"
    - "Sync Backfill Failed — about 17 hours ago" (x2)
  - The backfill failures 17h ago are notable — intermittent sync reliability issue
- **Evidence:** `e2e-wf1-sales-dashboard.png`

---

## WF-1 Step 5: Sales — Warehouse Leads

- **What I see:** Sales Dashboard shows comprehensive data:

| Metric | Value | Trend |
|--------|-------|-------|
| Total Leads (30d) | 456 | +6% vs last 30d |
| New Leads | 36 | +100% vs last 30d |
| Active Pipeline | 107 | +64% vs last 30d |
| Waiting on Response | 97 | 0% vs last 30d |
| Appointments Set | 0 | 0% vs last 30d |
| Sold | 11 | -45% vs last 30d |
| Conversion Rate | 2.4% | 0% vs last 30d |

- **Top Performing Agents:** Data Guru (chat), Sales Coach (chat), Communication Writer (chat), Caroline (voice)
- **Recent Activity:** Shows "Vapi Call Received" events (17 min, 22 min, 25 min ago), "Auto Greeting Sent" (8 min ago), login events, sync events
- **Does this step work?** YES — Data is populated and plausible. The warehouse has 456 leads synced from VIN Solutions.
- **Evidence:** `e2e-wf1-sales-dashboard.png`

---

## WF-1 Step 6: Cross-Check — Call Counts vs Lead Counts

| Source | Metric | Value |
|--------|--------|-------|
| TeamBox Channels | Phone conversations | 3 |
| Sales Recent Activity | VAPI Call Received events | 3 (17m, 22m, 25m ago) |
| Sales Dashboard | Total Leads (30d) | 456 |
| Insights Dashboard | Total Leads | 456 |
| Insights Dashboard | Active Pipeline | 456 (or 164 on another load) |
| Sales Dashboard | Active Pipeline | 107 |

- **Alignment:**
  - The 3 VAPI calls in Recent Activity match the 3 Phone conversations in TeamBox — **CONSISTENT**
  - Total lead counts match between Sales (456) and Insights (456) — **CONSISTENT**
  - Active Pipeline differs: Sales shows 107, Insights shows 164 on one load and 456 on another — **INCONSISTENT**
- **Gaps:**
  - Cannot verify VAPI call transcripts exist (Phone channel filter broken)
  - Cannot verify VAPI calls convert to VIN leads (call detail not clickable)
  - The VAPI-to-lead-to-VIN pipeline is not demonstrable end-to-end through the UI

---

## Summary of Findings

### What Works

| Step | Status | Notes |
|------|--------|-------|
| Login | YES | Authenticates correctly |
| Insights Dashboard | YES | 456 leads, charts render, data plausible |
| VIN Sync Status | YES | "Synced 44m ago" visible on Sales |
| Sales Warehouse | YES | 456 leads, 107 active, agents listed, activity feed works |
| Cross-check: call count | YES | 3 VAPI calls consistent across TeamBox and Sales |
| Cross-check: lead count | YES | 456 leads consistent between Sales and Insights |

### What Does Not Work

| Step | Status | Issue |
|------|--------|-------|
| Session Stability | FAIL | Auth tokens in memory, frequent session drops on navigation |
| User Identity | FAIL | Session sometimes restores as different user (DKW vs SHA) |
| VAPI Config (Settings) | PARTIAL | No VAPI-specific UI — MCP tab empty, backend-only config |
| TeamBox Phone channel | PARTIAL | Click intercepted by overlay, navigates to wrong page |
| Insights data loading | PARTIAL | Sometimes shows all zeros instead of real data |
| Active Pipeline count | PARTIAL | Inconsistent between Sales (107) and Insights (164/456) |

### Bugs Found

1. **CRITICAL: Session instability** — In-memory auth tokens lost on navigation. Users experience random logouts during normal use. The refresh token (httpOnly cookie `nexxus_refresh`) does not reliably restore the correct session.

2. **CRITICAL: User identity confusion on session restore** — Session restoration sometimes authenticates as a different user (super_admin DKW instead of org_admin SHA). This is a security vulnerability — user A could see user B's data.

3. **HIGH: TeamBox Phone channel click broken** — Campaign filter combobox (`data-testid="select-campaign-filter"`) overlaps and intercepts pointer events on the Phone channel button. Force-clicking navigates to `/sales` instead of filtering conversations. Users cannot view phone-only conversations.

4. **MEDIUM: Insights data race condition** — Dashboard sometimes renders with all zeros instead of real data (456 leads). Likely a timing issue with org context or data fetching.

5. **MEDIUM: Active Pipeline count inconsistency** — Sales Dashboard shows 107, Insights shows 164 or 456 depending on the load. These should agree or the difference should be explained.

6. **LOW: No VAPI configuration UI** — Org admins have no visibility into VAPI assistant settings. MCP tab in Tools & Integrations is empty with "No MCP tools configured." message.

7. **LOW: Sync backfill intermittent failures** — Activity log shows "Sync Backfill Failed" entries ~17 hours ago, followed by a successful completion ~8 hours later.

---

## Final Verdict: PARTIAL

**The core VAPI/VIN data pipeline works.** VAPI calls come in and appear in TeamBox (3 phone conversations). VIN Solutions sync runs and populates the warehouse (456 leads, synced 44 minutes ago). Insights and Sales dashboards render data from the warehouse with charts and metrics. Call counts are consistent across TeamBox and Sales activity feed.

**However, the workflow has significant degradation:**
- Session instability makes the app unreliable for sustained use (random logouts, identity confusion)
- The Phone channel filter in TeamBox is broken (overlay intercepts clicks)
- Insights data loading is intermittent (sometimes all zeros)
- No way to view VAPI call details, transcripts, or trace a call through to a VIN lead via the UI
- No VAPI configuration visibility for org admins

**The data flow is intact but the user experience around navigating and reviewing VAPI/VIN data has serious issues that would block real-world use.**
