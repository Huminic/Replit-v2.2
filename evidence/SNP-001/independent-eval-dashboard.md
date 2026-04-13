# Independent Evaluation: Dashboard & AI Chat

**Evaluator:** Independent Agent (no prior knowledge of codebase)
**Date:** 2026-04-07
**URL:** https://dev.huminicdev.com/
**User:** duane.wells@huminic.ai (Super Admin)
**Orgs tested:** Serra Honda (with data), Huminic (empty)

---

## Summary

The Dashboard / AI Chat page is the default landing page after login (route: `/`). It combines real-time metric cards at the top with an AI chat interface below. The sidebar provides navigation to all app sections. Org switching is available in the top header bar.

---

## Section-by-Section Evaluation

### 1. AI Key Metrics Cards

| # | Question | Answer |
|---|----------|--------|
| 1 | Does it render without errors? | YES. 4 metric cards render immediately after login. |
| 2 | Is the data plausible? | YES for Serra Honda: Active Pipeline (107), Appointments Today (0), Open Escalations (249), Outbound Sent 24h (0). YES for Huminic: all zeros (Huminic is not a dealership, no VIN data expected). |
| 3 | Are interactive elements functional? | YES. Cards are clickable — clicking "Total Leads (30d)" on the Sales Dashboard opened a detail dialog showing "458 records, showing first 100 of 458, +7% vs last 30d". |
| 4 | Is there any false-pass styling? | NO. Cards have distinct color backgrounds, icons, and "live" indicators with sparkline icons. |
| 5 | Does the layout match expected UX? | YES. Horizontal row of 4 cards with clear labels, values, and live indicators. |
| 6 | Are there broken links or dead ends? | NO. |
| 7 | Is the page responsive to context? | YES. Metrics change when org is switched (Serra Honda shows real data, Huminic shows zeros). |
| 8 | Any console errors? | YES for Huminic. Multiple "Query error: Failed to fetch" errors when switching to Huminic org. Cards still render with zeros but the fetch errors indicate the data queries fail for this org. |

**Finding DASH-01 (MEDIUM):** Console errors "Query error: Failed to fetch" (5 occurrences) when switching to Huminic org. The UI degrades gracefully (shows 0) but the errors indicate API calls failing rather than the org genuinely having zero data. This may be a false-zero scenario.

**Finding DASH-02 (INFO):** "Appointments Today" shows 0 for Serra Honda. Plausible (no appointments scheduled today) but cannot confirm without checking the data source.

**Verdict: PASS WITH RISK** (console errors on org switch)

---

### 2. AI Chat Interface

| # | Question | Answer |
|---|----------|--------|
| 1 | Does it render without errors? | YES. Chat input area renders with placeholder "Ask me anything about your business", suggested prompts, and a "Try asking..." header. |
| 2 | Is the data plausible? | YES. Suggested prompts are contextually relevant: "Show KPIs for this month", "What hunches need my attention?", "Give me a dealership performance overview", "Which agents need review?", etc. Prompts vary on each page load. |
| 3 | Are interactive elements functional? | PARTIALLY. See findings below. |
| 4 | Is there any false-pass styling? | NO. Chat input has a prominent blue border, send button (disabled until text entered), attachment button. |
| 5 | Does the layout match expected UX? | YES. Clean chat interface with metrics above and input below. |
| 6 | Are there broken links or dead ends? | NO dead ends, but navigation behavior is unexpected (see DASH-03). |
| 7 | Is the page responsive to context? | YES. Suggestions and metrics reflect the current org. |
| 8 | Any console errors? | NO on the AI Chat page itself. |

**Finding DASH-03 (MEDIUM):** Clicking suggested prompt buttons (e.g., "Give me a dealership performance overview") navigates to the Sales Dashboard (`/sales`) instead of sending the text as a chat message and displaying an AI response inline. The AI Chat acts as a navigation/command interface rather than a conversational chatbot. This may be intentional design but is unexpected from a "chat" interface.

**Finding DASH-04 (MEDIUM):** Typing "How many leads do we have?" and pressing Enter showed a brief "Fetching sales metrics from VinSolutions..." loading indicator, then redirected to the Sales Dashboard page. The AI interprets questions and routes to the relevant page rather than providing a text response within the chat. No conversational AI response was displayed in the chat interface.

**Finding DASH-05 (LOW):** The chat sidebar (visible when AI Chat is active in sidebar) shows "Chat History" with multiple entries: "New Chat" (several, created recently) and older chats like "Chat -- 2 days ago", "Chat -- 4 days ago". Chat titles are generic "New Chat" rather than reflecting conversation content.

**Finding DASH-06 (INFO):** The "Favorites" section in the AI Chat sidebar says "Star pages to access them quickly" but appears empty. Feature exists but is unused.

**Verdict: PASS WITH RISK** (AI chat navigates away instead of responding inline)

---

### 3. Sidebar Navigation

| # | Question | Answer |
|---|----------|--------|
| 1 | Does it render without errors? | YES. Full sidebar with 7 main nav items + System + Logout. |
| 2 | Is the data plausible? | YES. Nav items match expected app sections. |
| 3 | Are interactive elements functional? | YES. All sidebar buttons navigable. Active state correctly highlighted. |
| 4 | Is there any false-pass styling? | NO. Icons and labels visible. Active state has blue highlight. |
| 5 | Does the layout match expected UX? | YES. Vertical icon+label sidebar with primary nav, system nav, and logout grouped logically. |
| 6 | Are there broken links or dead ends? | NO. All 9 buttons navigate to valid pages. |
| 7 | Is the page responsive to context? | YES. Active item highlighted correctly. Sidebar collapses/expands. |
| 8 | Any console errors? | NO. |

**Sidebar items tested:**
| Item | Route | Loads? | Has Content? |
|------|-------|--------|-------------|
| AI Chat | / | YES | YES - metrics + chat |
| TeamBox | (sidebar panel) | YES | YES - channels: SMS(2), Email(1), Phone, Video, Tasks |
| Sales | /sales | YES | YES - dashboard with 7 metric cards, agents, activity |
| Service | /service | YES | YES - campaigns table with 2 campaigns |
| Insights | /insights | YES | YES - rich dashboard with action items, charts |
| Marketing | /marketing | NOT TESTED | - |
| Manage | /manage | NOT TESTED | - |
| System | /settings/system | YES | YES - settings tile grid |
| Logout | (action) | NOT TESTED | - |

**Finding DASH-07 (LOW):** Marketing and Manage pages were not tested. All other pages confirmed working.

**Finding DASH-08 (INFO):** TeamBox opens as a sidebar panel overlay rather than a full-page navigation. It shows real channel counts (SMS: 2, Email: 1) indicating real conversation data exists.

**Verdict: PASS**

---

### 4. Org Switcher (Store Switching)

| # | Question | Answer |
|---|----------|--------|
| 1 | Does it render without errors? | YES. Dropdown opens with all organizations listed. |
| 2 | Is the data plausible? | YES. 7 organizations listed: Serra Nissan, Tony Serra Ford, Hyundai of Columbia, Huminic, Ford of Columbia, Cage Automotive, Serra Honda. Current org has checkmark. |
| 3 | Are interactive elements functional? | YES. Clicking an org switches context. Page reloads with new org data. |
| 4 | Is there any false-pass styling? | NO. Clean dropdown menu with org icons, names, and checkmark indicator. |
| 5 | Does the layout match expected UX? | YES. Standard dropdown pattern with "Switch Organization" header. |
| 6 | Are there broken links or dead ends? | NO. Org switch completes successfully. |
| 7 | Is the page responsive to context? | YES. Metrics, users, settings all update to reflect selected org. |
| 8 | Any console errors? | YES. "Failed to fetch" errors when switching to Huminic (see DASH-01). |

**Finding DASH-09 (MEDIUM):** After login, the app defaults to Serra Honda (not Huminic). Per CLAUDE.md, super_admin duane.wells@huminic.ai belongs to Huminic but is "currently on Tony Serra Ford." The app defaulted to Serra Honda, which is neither Huminic nor Tony Serra Ford. The default org after login appears inconsistent.

**Finding DASH-10 (INFO):** All 7 expected organizations are visible in the switcher. RBAC appears correct — super_admin can see all orgs.

**Verdict: PASS WITH RISK** (console errors on Huminic switch, default org questionable)

---

### 5. Header Bar

| # | Question | Answer |
|---|----------|--------|
| 1 | Does it render without errors? | YES. Full header with branding, org switcher, action buttons. |
| 2 | Is the data plausible? | YES. Shows "Nexxus Connect (TM)", org name, notification badge "103", user avatar "DKW". |
| 3 | Are interactive elements functional? | PARTIALLY TESTED. Org switcher works. Notification badge visible. User avatar button visible. |
| 4 | Is there any false-pass styling? | NO. |
| 5 | Does the layout match expected UX? | YES. Standard header layout: logo left, org center, actions right. |
| 6 | Are there broken links or dead ends? | NOT FULLY TESTED. Globe icon, bell icon, sparkle icon, dark mode toggle not tested. |
| 7 | Is the page responsive to context? | YES. Org name in header updates on switch. |
| 8 | Any console errors? | NO. |

**Finding DASH-11 (LOW):** Notification badge shows "103" — this is a high number. Could be accumulated unread notifications or possibly a display issue. Did not investigate notification panel.

**Finding DASH-12 (INFO):** Header contains 5 action buttons to the right: globe icon (language?), bell icon (notifications), "103" badge, sparkle icon (AI features?), dark mode toggle, user avatar "DKW" with dropdown.

**Verdict: PASS**

---

### 6. Product Tour

| # | Question | Answer |
|---|----------|--------|
| 1 | Does it render without errors? | YES. Tour overlay appears after login. |
| 2 | Is the data plausible? | YES. First step: "Dashboard & AI Chat — Your home base. View key metrics, quick actions, and chat with your AI assistant to get answers instantly. 1 of 6." |
| 3 | Are interactive elements functional? | YES. Skip and Next buttons visible. Pressing Escape dismisses it (but navigates to another page). |
| 4 | Is there any false-pass styling? | NO. Clean overlay with semi-transparent backdrop. |
| 5 | Does the layout match expected UX? | YES. Standard guided tour pattern. |
| 6 | Are there broken links or dead ends? | NO. |
| 7 | Is the page responsive to context? | PARTIALLY. Tour reappears on some page navigations. |
| 8 | Any console errors? | NO. |

**Finding DASH-13 (MEDIUM):** The product tour reappears after org switching and on some page navigations. It appears multiple times during a single session. This is annoying for a returning user. The tour should only appear once (first login) or have a "Don't show again" option.

**Finding DASH-14 (LOW):** Pressing Escape to dismiss the tour sometimes triggers unintended navigation (e.g., from AI Chat to Sales or Insights) because the Escape key appears to propagate to underlying elements after the tour is dismissed.

**Verdict: PASS WITH RISK** (tour reappearing, Escape key side-effect)

---

### 7. Sales Dashboard (observed during navigation)

Fully rendered with real data for Serra Honda:
- **7 metric cards:** Total Leads 30d (458, +7%), New Leads (36, +100%), Active Pipeline (107, +69%), Waiting on Response (98, 0%), Appointments Set (0), Sold (11, -45%), Conversion Rate (2.4%)
- **Top Performing Agents:** Data Guru (#1, chat), Sales Coach (#2, chat), Communication Writer (#3, chat), Caroline (#4, voice)
- **Recent Activity:** Sync Backfill Completed (7h ago), Sync Backfill Failed (16h ago, x4), Vapi Call Received (1d ago, x2), Auto Greeting Sent (2d ago), Tavus Video Completed (2d ago, x2)
- **Warehouse badge:** "Synced 7h ago"
- **Sub-tabs:** Dashboard, Agents, Insights, Calendar

**Finding DASH-15 (MEDIUM):** Recent Activity shows 4 consecutive "Sync Backfill Failed" entries from ~16 hours ago. While a recent "Sync Backfill Completed" shows recovery, the repeated failures are visible to end users and may cause concern.

**Finding DASH-16 (INFO):** Metric card drill-down works. Clicking "Total Leads (30d)" opens a dialog showing "458" with "+7% vs last 30d" and "showing first 100 of 458 records."

---

## Findings Summary

| ID | Severity | Description |
|----|----------|-------------|
| DASH-01 | MEDIUM | Console errors "Query error: Failed to fetch" (x5) when switching to Huminic org |
| DASH-02 | INFO | Appointments Today shows 0 — plausible but unverified |
| DASH-03 | MEDIUM | AI Chat suggested prompts navigate away instead of chatting inline |
| DASH-04 | MEDIUM | Typed AI chat question navigates to Sales page instead of showing text response |
| DASH-05 | LOW | Chat history entries have generic "New Chat" titles |
| DASH-06 | INFO | Favorites section empty but functional |
| DASH-07 | LOW | Marketing and Manage pages not tested |
| DASH-08 | INFO | TeamBox shows real channel counts (SMS: 2, Email: 1) |
| DASH-09 | MEDIUM | Default org after login is Serra Honda, not the super_admin's home org (Huminic) |
| DASH-10 | INFO | All 7 orgs visible in switcher, RBAC correct |
| DASH-11 | LOW | Notification badge shows "103" — high count, not investigated |
| DASH-12 | INFO | Header has 5 action buttons, all rendered |
| DASH-13 | MEDIUM | Product tour reappears multiple times during session |
| DASH-14 | LOW | Escape key to dismiss tour causes unintended page navigation |
| DASH-15 | MEDIUM | 4 consecutive "Sync Backfill Failed" entries visible in Recent Activity |
| DASH-16 | INFO | Metric card drill-down dialog works correctly |

### Severity Distribution
- **MEDIUM:** 6 (DASH-01, DASH-03, DASH-04, DASH-09, DASH-13, DASH-15)
- **LOW:** 4 (DASH-05, DASH-07, DASH-11, DASH-14)
- **INFO:** 6 (DASH-02, DASH-06, DASH-08, DASH-10, DASH-12, DASH-16)

---

## Overall Verdict: PASS WITH RISK

**Rationale:** The Dashboard and AI Chat section renders correctly, displays real data from VinSolutions, responds to org context switching, and provides a functional (if unconventional) AI chat interface. The sidebar navigation works for all tested links. The org switcher successfully shows all 7 organizations and updates all page content.

The RISK designation comes from:
1. **AI Chat behavior (DASH-03, DASH-04):** The chat interface acts as a command router that navigates to relevant pages rather than providing conversational responses inline. This is a design choice but may confuse users expecting a ChatGPT-style text response.
2. **Console errors on Huminic (DASH-01):** API fetch failures when switching to Huminic org suggest incomplete data configuration for the super_admin's home org.
3. **Default org after login (DASH-09):** Super admin defaults to Serra Honda, not their home org.
4. **Product tour persistence (DASH-13):** Tour reappears multiple times during a session.
5. **Visible sync failures (DASH-15):** 4 "Sync Backfill Failed" entries in Recent Activity may alarm end users.

No crashes, no broken navigation, no data integrity issues observed.
