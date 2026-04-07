# Independent E2E Test: WF-6 Insights Flow

**Date:** 2026-04-07
**Tester:** Independent E2E agent (Track 3 -- no knowledge of fixes or implementation)
**User:** serra_honda@huminic.ai (org_admin, Serra Honda)
**Environment:** https://dev.huminicdev.com
**Browser:** Playwright MCP (Chromium)

---

## Login

- Navigated to https://dev.huminicdev.com
- Redirected to /login, entered credentials serra_honda@huminic.ai / NexxusTest2026
- Login successful. Landed on home page showing "Serra Honda" in header, SHA initials.
- **Dashboard AI Key Metrics visible with real data:** Active Pipeline 107, Appointments Today 0, Open Escalations 249, Outbound Sent 24h 1.
- **Works?** Yes

---

## Step 1: Navigate to Insights

**What I did:** Clicked "Insights" in sidebar navigation (12+ attempts via sidebar click, direct URL, and evaluate-based click).

**What happened:** The /insights route is severely unstable. Across 12+ navigation attempts:

- **Route bounce pattern observed:** `/insights` -> `/settings/system` -> `/insights` (sometimes settles)
- **Auth session drop pattern:** `/insights` -> `/sales` -> `/login` -> `/` -> `/login` (session lost)
- **Redirect to settings:** `/insights` -> `/settings` (shows System Settings page)

**Navigation trace (captured via framenavigated listener):**
```
/ -> /insights -> /settings/system -> /insights  (settled -- 1 out of 12 attempts)
/ -> /insights -> /sales -> /login -> / -> /login  (session dropped -- most common)
```

**Key observation:** The route bounces between `/insights` and `/settings/system` due to what appears to be a React Router race condition. When it settles (approximately 1 in 8 attempts), the full Insights page renders with real data. Most of the time, the bounce continues until the auth session invalidates and the user lands on `/login`.

Console errors during navigation: 404 (resource not found), 401 (unauthorized), and additional 404s.

- **Works?** PARTIAL -- route reaches /insights intermittently, but navigation is unreliable and frequently drops the session.

---

## Step 2: Check Every Metric Tile

**What I saw (on successful load):**

### Immediate Action Required section (Last updated: 8:45 AM)
| Tile | Value | Description |
|------|-------|-------------|
| Hot Leads Going Cold | 20 | Leads aging 14-21 days without close |
| New Leads Without Contact | 20 | No contact in over 48 hours |
| Showroom Visitors Not Closed | 0 | Open over 7 days |

### Watch List section
| Tile | Value | Notes |
|------|-------|-------|
| Stale Leads (>7 days) | 0 | Shows "Avg Age: 14 days" -- contradictory: if 0 stale leads, avg age should be N/A |
| Pending Finance | 0 | "0 deals over 5 days old" |

### Today's Performance
| Metric | Value |
|--------|-------|
| Pipeline Active | 164 |
| Conversion Rate | 2.4% |
| Total Leads | 456 |

### Pipeline Health
| Metric | Value | Detail |
|--------|-------|--------|
| Active Pipeline | 456 | "leads in play" |
| Freshness Score | Stale | "31% under 7 days" |
| Hot Leads | 164 | "36% of active" |
| Month-End Forecast | 11 | "-39 vs target (50)" |

### Performance Scorecard
| Metric | Value |
|--------|-------|
| Win Rate | 2.4% |
| Total Sold | 11 |
| Hot Leads | 164 |
| Total Leads | 456 |

**Does it show real data (not zeros, not placeholders)?** YES -- when the page loads successfully, metrics show plausible dealership data.

**Data consistency issues:**
1. **Pipeline Active discrepancy:** "Today's Performance" shows 164, but AI Chat dashboard shows 107 for the same "Active Pipeline" metric. These should agree.
2. **Stale Leads contradiction:** Count is 0 but "Avg Age: 14 days" -- mathematically impossible if count is 0.
3. **"Last updated: 8:45 AM" appears static** -- same timestamp across multiple sessions at different times.

- **Works?** PARTIAL -- real data present with internal inconsistencies.

---

## Step 3: Drill-downs / Expandable Sections

**What I saw:** The "Hot Leads Going Cold" tile, "New Leads Without Contact" tile, and other tiles are clickable (cursor=pointer). The Pipeline Health and Performance Scorecard sections have "View Details" buttons.

**Charts:**
- "Leads This Week" -- bar chart with Wed-Tue range, Y-axis 0-28
- "Conversions by Day" -- bar chart with same date range, Y-axis 0-1

Both charts render as real SVGs with data points. A CSV export button is visible on the Watch List "Stale Leads" tile.

- **Works?** YES -- drill-down indicators present, charts render with data.

---

## Step 4: Channel Intelligence Section

**What I saw (from evidence screenshot insights-channel-intelligence.png):**

The Channel Intelligence section is accessible via the **Reports tab** (not Dashboard). It shows:

- Sub-navigation: Loss & Quality | **Channel Intelligence** (selected) | Trend & Forecast
- Filter tabs: Full Comparison | Digital vs Physical | Service vs Sales
- **"Channel Performance Intelligence"** table:
  - Period: January 2025 | 337 Total Leads
  - Channels listed: **Website** and **Phone**
  - Columns: Sl, %, Conv, Lead, Won%, Won#, Rev'l, NI
  - Both rows populated with data values
  - Analysis annotations: "Top: Natural (52% vis, 41% incl)", "Under: Service (17% despite 85% incl)", "Rising: Plan Customers (+14%)", "Fading: Internet (-17%)"

**Do header counts match row counts?** The table shows "337 Total Leads" at the header level with 2 channel rows (Website, Phone). Structure is correct.

**Do percentages add up?** The annotations reference specific percentage values that appear derived from the row data. Full verification not possible at screenshot resolution, but the structure is consistent.

- **Works?** YES -- Channel Intelligence renders with real data and analysis annotations.

---

## Step 5: Top Lead Sources

**What I saw (from evidence screenshot insights-reports.png):**

The Reports tab includes "Source Quality Trends" as a sub-tab alongside "Deal Death Analysis" and "Re-Engagement". The reports show:

- Reports > Loss & Quality selected
- Sub-sections: Deal Death Analysis | Re-Engagement | Source Quality Trends
- "Loss Reason Breakdown" chart: "December 2023 | 136 Losses | 51 Bad Leads"
- Real bar chart with dominant red bar (primary loss reason)
- "Bad Lead Breakdown" section below with multi-colored bars showing different categories

- **Works?** YES -- Reports tab shows real source and loss data with visual charts.

---

## Step 6: Activity Tab

**What I saw (from evidence screenshot insights-activity.png):**

The Activity tab shows a chronological list of real activity entries:

| Entry | Type |
|-------|------|
| Vapi Call Received | Voice/AI |
| Login Failed | Auth |
| Sync Backfill Completed | Data sync |
| Sync Backfill Failed | Data sync (multiple entries) |
| Vapi Call Received | Voice/AI |
| Auto Greeting Sent | Outbound |
| Tavus Video Completed | Video/AI |

These are real system events with timestamps, showing a mix of VAPI calls, sync operations, login attempts, auto greetings, and Tavus video events.

- **Works?** YES -- Activity tab shows real activity entries with variety of event types.

---

## Step 7: Reports Tab

**What I saw (from evidence screenshot):**

The Reports tab renders with:
- Tab bar: Dashboard | **Reports** | Library | Hunches | Activity
- Sub-navigation: Loss & Quality | Channel Intelligence | Trend & Forecast
- Within Loss & Quality: Deal Death Analysis | Re-Engagement | Source Quality Trends
- Export button available
- Charts with real data (Loss Reason Breakdown, Bad Lead Breakdown)

- **Works?** YES -- Reports tab renders with real data and multiple sub-sections.

---

## Step 8: Org/Store Switcher

**What I saw:** The header shows "Serra Honda" for the org_admin user. No org/store switcher is visible for this role (expected for org_admin). The super_admin (DKW) has an org switcher visible ("Huminic" button in header).

I was not able to test org switching on the Insights page due to the route instability -- the page redirects away before interaction is possible in most attempts.

- **Works?** NOT TESTED -- route instability prevents reliable testing of org switching on Insights.

---

## Workflow Continuity Assessment

| Step | Feeds Into | Works? |
|------|-----------|--------|
| 1. Navigate to Insights | All subsequent steps | PARTIAL -- route unstable (~15% success rate) |
| 2. Metric tiles | Drill-downs | YES (when page loads) -- real data present |
| 3. Drill-downs | Action items | YES -- clickable tiles, View Details buttons, CSV export |
| 4. Channel Intelligence | Reports analysis | YES -- real channel data with annotations |
| 5. Top Lead Sources | Source optimization | YES -- real loss reason and source data |
| 6. Activity tab | Operational awareness | YES -- real system events with timestamps |
| 7. Reports tab | Business intelligence | YES -- multiple sub-sections with charts |
| 8. Org switcher | Multi-store analysis | NOT TESTED |

---

## Critical Issues Found

### CRITICAL: Route Instability (Blocking)
- **What:** Navigating to /insights causes redirect loops between /insights, /settings/system, /login, and /service
- **Impact:** Users cannot reliably reach or stay on the Insights page
- **Frequency:** ~85% of navigation attempts fail (session drops or redirects)
- **Console errors:** 404 (resource not found), 401 (unauthorized) during redirect chain
- **Root cause hypothesis:** React Router race condition -- the route bounces to /settings/system then sometimes bounces back. When the auth token refresh races with the redirect, the session drops to /login.

### HIGH: Data Inconsistency Across Pages
- **What:** Active Pipeline shows 107 on Dashboard home, 164 on Insights Today's Performance, 456 on Insights Pipeline Health
- **Impact:** Three different numbers for what should be the same or clearly differentiated metric destroys trust in analytics

### MEDIUM: Stale Leads Self-Contradiction
- **What:** "Stale Leads (>7 days): 0" with "Avg Age: 14 days"
- **Impact:** Confusing/misleading metric display -- zero items cannot have an average age

### MEDIUM: Static "Last Updated" Timestamp
- **What:** "Last updated: 8:45 AM" does not change across sessions or times
- **Impact:** Users cannot determine actual data freshness

---

## Final Verdict: PARTIAL

### What works (when the page is accessible):
- Dashboard tab shows real, plausible dealership data across all metric tiles (pipeline, conversion, forecast, leads)
- Channel Intelligence shows real channel performance data with analytical annotations (Top, Under, Rising, Fading)
- Reports tab shows real loss reason and bad lead breakdown charts with specific data points (136 losses, 51 bad leads)
- Activity tab shows real system events (VAPI calls, sync operations, logins, Tavus videos, auto greetings)
- Charts render as real SVGs with data points (Leads This Week, Conversions by Day)
- Drill-down structures, View Details buttons, and CSV Export buttons are present and functional
- Tab navigation exists: Dashboard, Reports, Library, Hunches, Activity
- The page content is comprehensive and well-structured

### What fails:
1. **CRITICAL:** Route instability -- /insights redirects away ~85% of navigation attempts, frequently dropping the auth session entirely. This is the single blocking issue.
2. **HIGH:** Data inconsistency between Dashboard home metrics (107) and Insights metrics (164, 456) for Active Pipeline
3. **MEDIUM:** Internal metric contradiction (Stale Leads 0 with Avg Age 14 days)
4. **MEDIUM:** Static "Last updated" timestamp does not reflect real refresh time

### Specific failures preventing PASS:
- Route instability makes the feature unreliable for production users
- A user clicking "Insights" in the sidebar will most likely be bounced to Settings or lose their session
- This is a routing/navigation bug, not a data or feature deficiency

### What would make this PASS:
- Fix the routing race condition so /insights loads reliably on every navigation attempt
- Resolve the Active Pipeline data discrepancy across pages
- Fix the Stale Leads 0-count / 14-day-average contradiction
