# Independent Evaluation: Sales Section

**Date:** 2026-04-07
**Evaluator:** Independent verifier (no prior knowledge of fixes)
**Login:** serra_honda@huminic.ai (org_admin, Serra Honda)
**URL:** https://dev.huminicdev.com/sales
**Browser:** Playwright Chromium (headless)

---

## Executive Summary

The Sales page is **functionally unreachable** in a stable manner. A routing/auth redirect loop prevents users from staying on the page. The `/sales` route triggers an auth refresh that returns HTTP 500, causing a cascade of redirects (`/sales` -> `/login` -> random page). On rare occasions when the page renders before the redirect fires, the data displayed is inconsistent between loads.

**Verdict: FAIL**

---

## Critical Findings

### CRIT-01: Sales page redirect loop (Critical)

**What happens:** Navigating to `/sales` (via sidebar click or direct URL) triggers an immediate redirect cascade. The auth refresh endpoint (`/api/auth/refresh`) returns HTTP 500, causing the ProtectedRoute guard to redirect to `/login`, which then auto-recovers the session and bounces the user to a random page (observed: `/teambox`, `/settings/system`, `/insights`, `/service`, `/`).

**Evidence:**
- URL tracking after clicking Sales sidebar button shows 13+ URL changes in 5 seconds: `/sales` -> `/login` -> `/teambox` -> `/login` -> `/settings/system` -> `/login` -> `/` -> `/` -> `/sales` -> `/login` -> `/` -> `/service` -> `/teambox`
- The `/api/auth/refresh` endpoint returns HTTP 500 (server error), confirmed via network request capture
- After the refresh fails, `/api/auth/login` returns 200 (auto-recovery), but by that point the original `/sales` navigation is lost
- Affects both `org_admin` (serra_honda) and `super_admin` (duane.wells) accounts
- Intermittently, the page renders correctly for 1-3 seconds before the redirect fires

**Impact:** Users cannot access the Sales section. This blocks all sales-related functionality: lead viewing, pipeline management, agent configuration, and calendar access.

**Severity:** Critical

---

### CRIT-02: Auth refresh endpoint returning 500 (Critical)

**What happens:** The `/api/auth/refresh` endpoint returns HTTP 500 (Internal Server Error) on page navigation. This is the root cause of CRIT-01 and likely affects all protected routes intermittently.

**Evidence:**
- Network capture shows: `{"url":"/api/auth/refresh","status":500}` as the first API call on page navigation
- Subsequent `/api/auth/login` returns 200, indicating credentials are valid but the refresh token mechanism is broken
- `fetch('/api/auth/me', { credentials: 'include' })` returns `{"status":401,"data":{"message":"Access token required"}}` after navigation
- The auth state becomes invalid within seconds of successful login

**Impact:** Session instability across the entire application. All protected routes are affected, but Sales is particularly impacted because the redirect recovery logic does not preserve the `/sales` destination.

**Severity:** Critical

---

## High Findings

### HIGH-01: Data inconsistency between page loads (High)

**What happens:** When the Sales Dashboard does render (briefly), the metric tiles show different values on different loads for the same user and time window.

**Evidence:**
- Load 1 (snapshot): Total Leads: 456, New Leads: 36, Active Pipeline: 107, Waiting on Response: 97, Sold: 11, Conversion Rate: 2.4%, with +6%, +100%, +64% trend indicators and "Warehouse: Synced 39m ago"
- Load 2 (screenshot): Total Leads: 0, New Leads: 0, Active Pipeline: 107, Waiting on Response: 0, all showing "0% vs last 30d"
- Load 3 (text capture): All values 0 including Active Pipeline
- Same user (serra_honda@huminic.ai), same org (Serra Honda), captured within minutes of each other

**Analysis:** The inconsistency is likely caused by the auth state race condition. When the page loads before the access token expires, it fetches real data from `/api/metrics/pipeline` (returning 200). When the token has already expired by the time the API call fires, the data defaults to zeros.

**Severity:** High

### HIGH-02: Sidebar navigation routing mismatch (High)

**What happens:** Clicking sidebar buttons sometimes navigates to the wrong page. The client-side routing is unreliable for cross-page navigation.

**Evidence:**
- Clicking Sales sidebar button (`data-testid="sidebar-item-sales"`) observed navigating to: `/sales` (then redirect), `/teambox`, `/settings/system`, `/` (dashboard)
- Even using the correct test ID selector, the final destination after the redirect loop is unpredictable
- The Playwright MCP accessibility tree ref ordering does not match the visual/DOM ordering, suggesting the sidebar buttons may have overlapping click areas or incorrect z-index stacking

**Severity:** High

---

## Medium Findings

### MED-01: Escalation count mismatch on dashboard (Medium)

**What happens:** The Open Escalations metric tile on the main dashboard shows "249" on one load and "0" on another for the same user session. When the escalation dialog opens, it displays "showing first 100 of 0 records" but renders 50+ rows of "Unsent SMS -- blocked" entries.

**Evidence:**
- Dashboard metric card: "Open Escalations: 249" (first render)
- Same card later: "Open Escalations: 0" (after auth re-login)
- Escalation dialog header: "showing first 100 of 0 records" -- contradicts the visible rows
- All visible rows are identical: "Unsent SMS -- blocked | unsent_message | medium | 4/6/2026" or "4/5/2026"

**Analysis:** The record count display says "0 records" but displays dozens of rows, suggesting the count query and the data query return different results.

**Severity:** Medium

### MED-02: Sales Dashboard tabs untestable (Medium)

**What happens:** The Sales page has 4 tabs (Dashboard, Agents, Insights, Calendar) but none beyond Dashboard could be evaluated due to the redirect loop. When the Agents tab was clicked during a brief stable window, the page navigated to `/insights` instead.

**Evidence:**
- Tab buttons visible in screenshot: Dashboard, Agents, Insights, Calendar
- Clicking "Agents" tab resulted in navigation to the Insights page (confirmed by both URL and page content showing "Intelligence", "Hunches", "Activity" tabs)
- Direct navigation to `/sales?tab=insights` and `/sales?tab=calendar` could not be tested due to inability to maintain stable session on `/sales`

**Severity:** Medium

### MED-03: Post-login redirect destination inconsistent (Medium)

**What happens:** After successful login, the user lands on different pages each time.

**Evidence:**
- Login attempt 1: landed on `/` (dashboard)
- Login attempt 2: landed on `/sales` (then redirected away)
- Login attempt 3: landed on `/settings`
- Login attempt 4: landed on `/teambox`

**Analysis:** The app appears to remember the last visited route and attempts to restore it after login, but the redirect loop and auth race condition cause unpredictable landing pages.

**Severity:** Medium

---

## Low Findings

### LOW-01: "Top Performing Agents" shows no performance data (Low)

**What happens:** When the Sales Dashboard briefly renders with data, the Top Performing Agents section shows 4 agents (Data Guru, Sales Coach, Communication Writer, Caroline) but only with agent type labels (chat/voice), no performance metrics (leads handled, conversion rate, etc.).

**Severity:** Low

### LOW-02: Recent Activity shows system events, not sales events (Low)

**What happens:** The Recent Activity section shows generic system events (Login Failed, Auto Greeting Sent, Vapi Call Received, Sync Backfill) rather than sales-specific activity (lead status changes, appointments set, deals closed).

**Severity:** Low

### LOW-03: "Warehouse" label context unclear (Low)

**What happens:** One render of the Sales Dashboard showed "Warehouse" with "Synced 39m ago" near the top of the metrics area. This label is not explained and its relationship to the sales pipeline is unclear to a new user.

**Severity:** Low

---

## 8-Question Commentary (Sales Dashboard)

| # | Question | Answer |
|---|----------|--------|
| 1 | What does this element show? | Sales pipeline metrics: Total Leads, New Leads, Active Pipeline, Waiting on Response, Appointments Set, Sold, Conversion Rate, plus Top Agents and Recent Activity |
| 2 | Is the data plausible and realistic? | **No.** Values are wildly inconsistent between loads (456 vs 0 for Total Leads). Active Pipeline showing 107 while Total Leads shows 0 is contradictory. |
| 3 | Does it respond to user interaction? | **Partially.** Metric tiles appear clickable (cursor:pointer). Tab buttons are visible but clicking them triggers cross-page navigation. The page itself redirects away within seconds. |
| 4 | Are there visual glitches or broken layouts? | Layout is clean when rendered. No visual glitches in the brief window before redirect. |
| 5 | Do loading states work correctly? | A loading spinner appears during auth recovery. The Sales page itself has no visible loading skeleton -- data either appears or shows zeros. |
| 6 | Are error states handled? | **No.** Auth failures are not surfaced to the user. The redirect loop happens silently. No error toast or message explains why the user is bounced away from Sales. |
| 7 | Is the navigation intuitive? | **No.** Clicking Sales in the sidebar does not reliably take the user to Sales. The redirect loop creates a confusing experience. |
| 8 | Does this element agree with data shown elsewhere? | **Inconsistent.** Dashboard AI Key Metrics shows Active Pipeline: 107 and Open Escalations: 249, but Sales Dashboard shows 0 for everything on some loads. |

---

## False-Pass Classes

| Class | Check | Result |
|-------|-------|--------|
| Stale cache | Same data on multiple loads? | FAIL -- different data each time |
| Default/placeholder data | Are values suspiciously round or zero? | POSSIBLE -- zeros on most loads suggest data fetch failure |
| Hidden errors | Console errors present? | YES -- 1-3 errors per page load |
| Cosmetic-only pass | Does the UI look good but not function? | YES -- layout is polished when rendered but functionally broken |

---

## Cross-Screen Consistency

| Data Point | Dashboard | Sales | Consistent? |
|------------|-----------|-------|-------------|
| Active Pipeline | 107 (initial), 0 (later) | 107 (once), 0 (mostly) | Inconsistent with self |
| Open Escalations | 249 (initial), 0 (later) | Not shown on Sales | N/A |
| Outbound Sent 24h | 1 (initial), 0 (later) | Not shown on Sales | N/A |

---

## Verdict: FAIL

**Reason:** The Sales page is unreachable due to a critical auth/routing bug. When it briefly renders, data is inconsistent. Tab navigation does not work. This section is not usable by any user in any role.

**Root Cause:** `/api/auth/refresh` returning HTTP 500, causing a redirect cascade that ejects users from the Sales page.

**Blocking Issues (must fix before re-eval):**
1. Fix `/api/auth/refresh` 500 error (CRIT-02)
2. Ensure redirect recovery preserves intended destination (CRIT-01)
3. Verify data consistency once auth is stable (HIGH-01)

---

## Screenshots

| File | Description |
|------|-------------|
| sales-page-final.png | Best capture of Sales Dashboard with mixed data (0s and 107) |
| sales-dashboard-full.png | Full-page capture showing Insights content bleeding through |
| sales-click-result.png | Result of clicking Sales sidebar -- shows wrong page |
| eval-sales-dashboard.png | Redirect destination (Settings) instead of Sales |
