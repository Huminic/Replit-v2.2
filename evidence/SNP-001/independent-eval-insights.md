# Independent Evaluation: Insights Section

**Evaluator:** Independent Verifier (Track 2)
**Date:** 2026-04-07
**Login:** serra_honda@huminic.ai (org_admin, Serra Honda)
**URL:** https://dev.huminicdev.com/insights
**Method:** Playwright MCP browser automation + code inspection

---

## Critical Navigation / Session Issue

### FINDING-NAV-01: Insights page navigation is unreliable (CRITICAL)

**Observed behavior:**
- Clicking the sidebar "Insights" button via Playwright's `click()` method frequently navigates to the WRONG page (observed: /service, /settings/system, /sales, /teambox) instead of /insights.
- Direct URL navigation (`page.goto('/insights')`) intermittently works, but often triggers session expiration and redirect to /login.
- The Insights page, when successfully loaded, renders correctly and all API calls return HTTP 200. However, within 10-30 seconds the session expires and the user is redirected to /login.
- Successful navigation was achieved via `dispatchEvent(new MouseEvent('click'))` on the sidebar button, but the session would still expire shortly after.

**Root cause investigation:**
- The sidebar `handleClick` function (`Sidebar.tsx:142`) correctly calls `setLocation('/insights')`.
- The route is correctly defined in `App.tsx:75`: `<Route path="/insights" component={() => <InsightsPage />} />`
- `ProtectedRoute.tsx` has no role-level restriction on the insights route.
- `AppLayout.tsx` has no redirect logic.
- All API endpoints (`/api/insights/dashboard`, `/api/insights/reports`, `/api/insights/library`, `/api/hunches`, `/api/activity-log`) return HTTP 200.
- `SubMenuManager.tsx:205` maps `/insights` route to the `management` panel ID, but this only affects which sub-menu panel renders, not routing.

**Hypothesis:** The session token (httpOnly cookie `nexxus_refresh` on path `/api/auth`) is being invalidated or expiring during navigation. The InsightsPage component triggers multiple parallel API queries (dashboard, reports, library, hunches, activity-log), which may cause a token refresh race condition. When the refresh fails, the auth context redirects to /login. This is intermittent -- sometimes the page stays loaded for 30+ seconds, other times it redirects within 3 seconds.

**Impact:** A real user clicking "Insights" in the sidebar would experience unpredictable behavior -- sometimes landing on the wrong page, sometimes being logged out. This makes the Insights section effectively unusable for some sessions.

**Severity:** CRITICAL

---

## Dashboard Tab Evaluation

When the page successfully loads, the Dashboard tab renders correctly.

### FINDING-DASH-01: Dashboard renders with real data (PASS)

**What it shows:** Traffic-light zone system for lead management.
- **Red Zone "Immediate Action Required":**
  - Hot Leads Going Cold: 20 (leads aging 14-21 days without close)
  - New Leads Without Contact: 20 (no contact in over 48 hours)
  - Showroom Visitors Not Closed: 0 (open over 7 days)
- **Yellow Zone "Watch List":**
  - Stale Leads (>7 days): 0, Avg Age: 14 days
  - Pending Finance: 0, 0 deals over 5 days old
- **Today's Performance:**
  - Pipeline Active: 164
  - Conversion Rate: 2.4%
  - Total Leads: 456
- **Pipeline Health:**
  - Active Pipeline: 456 leads in play
  - Freshness Score: "Stale" -- 31% under 7 days
  - Hot Leads: 164 (36% of active)
  - Month-End Forecast: 11 (-39 vs target of 50)
- **Performance Scorecard:**
  - Win Rate: 2.4%, Total Sold: 11, Hot Leads: 164, Total Leads: 456
- **Charts:** "Leads This Week" area chart and "Conversions by Day" bar chart with day-of-week labels (Wed-Tue)

**Data plausibility:** Mostly plausible for a dealership. 456 total leads with 2.4% conversion rate = ~11 sold, which is internally consistent. Hot Leads = 164 = 36% of 456, correct math. Month-end forecast gap of -39 is consistent with target 50 minus current 11.

**Severity:** N/A (pass)

### FINDING-DASH-02: "Last updated" timestamp is hardcoded (MEDIUM)

The "Immediate Action Required" section shows "Last updated: 8:45 AM" which appears to be a static value, not dynamically generated from the actual data refresh time.

**Evidence:** Snapshot shows `"Last updated: 8:45 AM"` regardless of when the page was loaded (tested at ~08:15 UTC and ~08:23 UTC).

**Severity:** MEDIUM

### FINDING-DASH-03: Stale Leads shows 0 but Avg Age shows 14 days (LOW)

Yellow Zone "Stale Leads (>7 days)" shows count = 0 but "Avg Age: 14 days". If there are 0 stale leads, displaying an average age of 14 days is misleading.

**Code evidence:** `insights.tsx:203` hardcodes `avgAge: 14` regardless of actual data: `staleLeads: { label: 'Stale Leads (>7 days)', count: dashboardData?.yellowZone?.staleLeads || 0, avgAge: 14 }`

**Severity:** LOW

### FINDING-DASH-04: Drill-down cards are clickable (PASS)

Red Zone cards (Hot Leads, New Leads, Showroom) show cursor=pointer and have click handlers that open drill-down dialogs. Yellow Zone cards also show clickable behavior.

**Severity:** N/A (pass)

### FINDING-DASH-05: Charts render with real data (PASS)

Both "Leads This Week" (AreaChart) and "Conversions by Day" (BarChart) render with day labels (Wed through Tue) and axis values (0-28 for leads, 0-1 for conversions). The conversion chart shows very low values (0-1 range) which is consistent with the 2.4% conversion rate on ~456 leads.

**Severity:** N/A (pass)

---

## Reports Tab Evaluation

### FINDING-RPT-01: Reports tab renders with sub-tabs (PASS)

The Reports tab shows three report categories accessible via buttons:
- Loss & Quality (selected by default)
- Channel Intelligence
- Trend & Forecast

Under Loss & Quality, there are sub-tabs: Deal-Death Analysis, Re-Engagement, Source Quality Trends.

**Screenshot evidence:** `insights-reports.png` shows the Reports tab with "Loss & Quality" selected, "Deal-Death Analysis" sub-tab active.

**Severity:** N/A (pass)

### FINDING-RPT-02: Loss Reason Breakdown chart renders (PASS)

The Loss Reason Breakdown shows data: "December 2025 | 136 Losses | 91 Bad Leads"
A large red bar chart is visible. Below it, "Bad Lead Breakdown" is visible with a colored bar.

**Data plausibility:** 136 losses and 91 bad leads from a 456-lead pipeline is plausible (roughly 50% loss/bad rate over the period).

**Severity:** N/A (pass)

### FINDING-RPT-03: Export button present (PASS)

An "Export" button is visible in the Reports tab header area.

**Severity:** N/A (pass)

### FINDING-RPT-04: Channel Intelligence total inconsistent with dashboard (MEDIUM)

**Screenshot evidence:** `insights-channel-intelligence.png` shows:
- "Channel Performance Intelligence" header
- Period: January 2026 | 337 Total Leads
- Table with columns: Channel, #, %, Ts, Conv, Lead, Warm, Won's, Won $, ...
- Row data: Website (610), Phone (1)
- Status indicators: "Online: Service 17% despite 81% vol", "Rising: New Customer (14%)", "Fading: Internet (-12%)"

**Data plausibility concern:** The header says "337 Total Leads" but the Website channel alone shows 610. This is inconsistent. The dashboard says 456 total leads. Three different numbers for what should be the same metric.

**Severity:** MEDIUM

---

## Activity Tab Evaluation

### FINDING-ACT-01: Activity tab renders with real system events (PASS)

**Screenshot evidence:** `insights-activity.png` shows a chronological list of system events:
- Vapi Call Received
- Login Failed
- Sync Backfill Completed
- Sync Backfill Failed (multiple entries)
- Vapi Call Received
- Auto Greeting Sent
- Tavus Video Completed

Each entry has a timestamp. Events appear to be real system log entries, not mock data.

**Data plausibility:** The mix of successful and failed events (multiple sync backfill failures, login failures) looks realistic for a production system.

**Severity:** N/A (pass)

### FINDING-ACT-02: Activity log shows sync failures prominently (LOW)

Multiple "Sync Backfill Failed" entries are visible in the activity feed. While this is accurate data, it may alarm dealership users who don't understand infrastructure events. Consider filtering infrastructure events from user-facing activity log.

**Severity:** LOW

---

## Library Tab Evaluation

### FINDING-LIB-01: Library tab could not be visually verified (MEDIUM)

The Library tab was not successfully screenshotted due to session expiration during tab switching. However, the API call `/api/insights/library?lookbackDays=30` returned HTTP 200, and the code at `insights.tsx:1370-1455` shows a grid/list toggle, category filter, search, and metric cards with drill-down dialogs.

From code analysis (`insights.tsx:170-179`): The library fetches `LibraryMetric[]` from the API and renders each as a card with title, value, change percentage, trend indicator, and category badge. Clicking a card opens a detail dialog with drill-down rows and AI-generated insight text.

**Severity:** MEDIUM (unable to visually verify)

---

## Hunches Tab Evaluation

### FINDING-HUN-01: Hunches tab could not be visually verified (MEDIUM)

Same session expiration issue as Library. The API call `/api/hunches` returned HTTP 200.

From code analysis (`insights.tsx:1457-1499`): Hunches renders as cards with:
- Title, description, type badge (opportunity/threat/insight) with color coding
- Confidence percentage
- Data source badge
- "Dismiss" and "Act" buttons per hunch
- Preferences sheet with notification channels, default view, min confidence slider, auto-dismiss settings

The "Dismiss" and "Act" buttons only fire toast notifications (client-side only) -- they do not persist any state to the backend.

**Severity:** MEDIUM (unable to visually verify)

---

## Cross-Screen Consistency

### FINDING-CROSS-01: Active Pipeline number inconsistency (HIGH)

- Home page "AI Key Metrics" tile: Active Pipeline = 107
- Insights Dashboard "Today's Performance": Pipeline Active = 164
- Insights Dashboard "Pipeline Health": Active Pipeline = 456

Three different numbers for what a user would interpret as the same metric. The home page queries a different API endpoint than the insights page, and "Pipeline Health" uses `totalLeads` (all leads) rather than a pipeline-specific count.

**Code evidence:**
- Home page likely uses a different API (`/api/dashboard` or similar)
- Insights uses `/api/insights/dashboard` which returns `overview.totalLeads = 456`
- `pipelineHealthData` maps `activePipeline` to `totalLeads` at line 239
- "Pipeline Active" (164) uses `overview.hotCount` at line 213

**Severity:** HIGH

### FINDING-CROSS-02: Channel Performance total inconsistent with Dashboard (MEDIUM)

- Dashboard "Total Leads": 456
- Channel Intelligence header: "337 Total Leads"
- Channel Intelligence Website row: 610

Three different totals. Different time periods or aggregation methods are not explained to the user.

**Severity:** MEDIUM (documented above in RPT-04)

---

## False-Pass Analysis

### FINDING-FP-01: Hunch "Dismiss" and "Act" buttons are UI-only (MEDIUM)

The "Dismiss" button fires `toast({ title: 'Hunch dismissed' })` and the "Act" button fires `toast({ title: 'Action initiated' })`. Neither makes an API call. Dismissing a hunch does not persist -- refreshing the page shows it again. Acting on a hunch does not create any task or notification.

**Evidence:** `insights.tsx:1489-1490` -- both onClick handlers only call `toast()`.

**Severity:** MEDIUM (partial-workflow false pass)

### FINDING-FP-02: "Last updated" timestamp is hardcoded (MEDIUM)

Documented above as DASH-02. This is a DOM-only false pass -- the element exists and displays a time, but it's not connected to actual refresh timing.

**Severity:** MEDIUM

### FINDING-FP-03: Yellow Zone "Avg Age" is hardcoded (LOW)

Documented above as DASH-03. The value 14 is hardcoded in client code, not from the API.

**Severity:** LOW

### FINDING-FP-04: CSV export button on empty data set (LOW)

The Stale Leads card has a "CSV" button but the card shows 0 stale leads. Clicking CSV when there is no data may export an empty file or error. Not tested due to session issues.

**Severity:** LOW

---

## Summary of Findings

| ID | Finding | Severity | Category |
|----|---------|----------|----------|
| NAV-01 | Insights page navigation unreliable / session expires | CRITICAL | Navigation |
| DASH-02 | "Last updated" timestamp hardcoded to 8:45 AM | MEDIUM | False pass (DOM-only) |
| DASH-03 | Stale Leads avg age hardcoded to 14 days | LOW | False pass (data) |
| RPT-04 | Channel Intelligence total (337) inconsistent with dashboard (456) and row data (610) | MEDIUM | Data consistency |
| ACT-02 | Infrastructure events shown in user-facing activity log | LOW | UX |
| LIB-01 | Library tab not visually verified (session issue) | MEDIUM | Incomplete eval |
| HUN-01 | Hunches tab not visually verified (session issue) | MEDIUM | Incomplete eval |
| CROSS-01 | Active Pipeline shows 3 different numbers across pages (107, 164, 456) | HIGH | Data consistency |
| FP-01 | Hunch Dismiss/Act buttons are UI-only, no persistence | MEDIUM | False pass (partial-workflow) |
| FP-04 | CSV export on empty data set (Stale Leads = 0) | LOW | Edge case |

**Counts:** 1 Critical, 1 High, 5 Medium, 3 Low

---

## Final Verdict: FAIL

**Rationale:** The CRITICAL navigation/session issue (NAV-01) makes the Insights section unreliable for end users. During testing, successful page loads were intermittent -- the page would render correctly with real data from all API endpoints, but the session would expire within seconds to minutes, redirecting the user to the login page. Additionally, clicking the sidebar "Insights" button frequently navigated to wrong pages entirely.

Even when the page loads successfully, the HIGH-severity data inconsistency (CROSS-01) where "Active Pipeline" shows three different numbers (107, 164, 456) depending on which section the user is looking at undermines trust in the analytics.

The MEDIUM-severity false-pass findings (hardcoded timestamps, non-functional Dismiss/Act buttons) represent incomplete implementations that could mislead users about the system's actual state.

**What works well:**
- Dashboard layout and visual design are clean and professional
- Traffic-light zone system (Red/Yellow/Green) is well-organized and intuitive
- Charts render with real data from the backend
- Reports tab shows actual loss analysis and channel intelligence data
- Activity tab shows real system events with timestamps
- All API endpoints return valid data (HTTP 200)

**What blocks a PASS:**
1. Session stability must be fixed -- users cannot be logged out when navigating to Insights
2. Pipeline numbers must be consistent across all views
3. Hardcoded values (timestamps, avg ages) must be replaced with real data
4. Hunch actions must persist to backend or be clearly marked as placeholders
