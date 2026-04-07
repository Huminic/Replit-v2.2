# PE-SALES-03: Acceptance Matrix (8-Question Commentary)

**Date:** 2026-04-07
**Page:** Sales (`/sales`)
**User:** serra_honda@huminic.ai (org_admin, Serra Honda)

---

## F1: Sales Dashboard Load

**Result: Accepted**

1. **What function/behavior was under evaluation?**
   Loading the Sales Dashboard page and documenting all visible sections: metric tiles, charts, tables, configuration panels.

2. **Why does it matter to the operator/business?**
   The Sales Dashboard is the primary view for a dealer's sales manager. If it fails to load or shows incomplete data, the operator cannot assess pipeline health, agent performance, or recent activity.

3. **What should have happened?**
   The page should load with: (a) metric tiles grid showing lead pipeline numbers, (b) Top Performing Agents card, (c) Recent Activity feed, (d) warehouse sync status indicator, (e) sub-tab navigation.

4. **What actually happened?**
   All expected sections loaded correctly. The page shows:
   - Header with "Sales" title and 4 tabs (Dashboard, Agents, Insights, Calendar)
   - Warehouse badge with "Synced 31m ago"
   - 7 metric tiles in a responsive grid: Total Leads (452), New Leads (36), Active Pipeline (107), Waiting on Response (95), Appointments Set (0), Sold (11), Conversion Rate (2.4%)
   - Top Performing Agents card: Data Guru, Sales Coach, Communication Writer, Caroline
   - Recent Activity feed: 10 items including Login Failed, Auto Greeting Sent, Vapi Call Received, Sync Backfill Completed/Failed
   - Left submenu with agents list and search

5. **What evidence proves that?**
   Screenshot: `F1-sales-dashboard-full.png`. DOM snapshot captured all elements with data-testid attributes. Metric values extracted from accessibility tree.

6. **Does the data look believable and internally consistent?**
   Yes. 452 total leads with 36 new, 107 active, 95 waiting, 11 sold is plausible for a mid-size dealership. 2.4% conversion rate (11/452) is mathematically consistent. The sync age of 31m confirms the warehouse is actively syncing (massive improvement from PE-SALES-02 where syncedAt was null).

7. **Does this satisfy the acceptance criteria?**
   Yes. The dashboard loads with real data, all expected sections are present, and the layout is functional.

8. **If not, what is broken and what should happen next?**
   N/A - accepted.

---

## F2: Store Selection + Metric Plausibility

**Result: Accepted (N/A for store switch)**

1. **What function/behavior was under evaluation?**
   Whether a store/org selector exists on the Sales page, and whether metric values are plausible.

2. **Why does it matter to the operator/business?**
   Multi-store operators need to switch between dealerships. Single-store org_admins should see only their store's data.

3. **What should have happened?**
   For an org_admin user scoped to Serra Honda, no store selector should appear. Metrics should reflect only Serra Honda data.

4. **What actually happened?**
   The header bar shows "Serra Honda" (the organization name). No store/org dropdown selector is visible on the Sales page. The metrics are scoped to Serra Honda only. Values observed:
   - Total Leads (30d): 452 (+5% vs last 30d)
   - New Leads: 36 (+100% vs last 30d)
   - Active Pipeline: 107 (+59% vs last 30d)
   - Waiting on Response: 95 (0%)
   - Appointments Set: 0 (0%)
   - Sold: 11 (-45% vs last 30d)
   - Conversion Rate: 2.4% (0%)

5. **What evidence proves that?**
   DOM snapshot shows `Serra Honda` in the banner. No store selector element exists in the page tree. Screenshot: `F1-sales-dashboard-full.png`.

6. **Does the data look believable and internally consistent?**
   Yes. The values are non-zero (warehouse is syncing now) and internally consistent:
   - 452 total leads, 36 new leads (8% of total are new - reasonable)
   - 107 active pipeline (24% of total - reasonable for active engagement)
   - 95 waiting on response (89% of active pipeline waiting - somewhat high but plausible)
   - 11 sold with -45% change suggests a sales decline vs prior period
   - 2.4% conversion = 11/452 = 2.43% - mathematically correct
   - Appointments Set = 0 is concerning but may be legitimate if no appointments are scheduled today
   - +100% New Leads change suggests a doubling (from ~18 to 36), plausible after sync fix

7. **Does this satisfy the acceptance criteria?**
   Yes. Org_admin sees only their store. Metrics are plausible.

8. **If not, what is broken and what should happen next?**
   N/A - accepted. Note: Waiting on Response (95/107 = 89% of active pipeline) is unusually high and may warrant business attention, but this is data, not a bug.

---

## F3: Popout/Config Surfaces

**Result: Accepted with risk**

1. **What function/behavior was under evaluation?**
   Clicking each metric tile to verify popout/drill-down dialogs open with real data.

2. **Why does it matter to the operator/business?**
   Drill-downs let managers see the actual leads behind the numbers. Without this, the dashboard is informational but not actionable.

3. **What should have happened?**
   Each tile should open a dialog. Tiles with API keys (Total Leads, New Leads, Active Pipeline, Appointments) should show record-level tables. Other tiles (Waiting, Sold, Conversion Rate) should show summary breakdowns.

4. **What actually happened?**
   - **Total Leads (30d)**: Dialog opens. Shows "452" and "+5% vs last 30d". Says "showing first 100 of 452 records" but the record table area appears empty in the dialog. The dialog height is small and the table may be rendering below the fold with no scroll indication.
   - **New Leads**: Dialog opens. Shows "36" and "+100% vs last 30d". Says "36 records" but similar issue - record area appears empty.
   - **Sold**: Dialog opens with different layout. Shows "Detailed breakdown of this sales metric" with Current Value: 11, Change: -45%, Period: Last 30 days, "Data sourced from warehouse sync." This is the summary breakdown format and works correctly.
   - **Active Pipeline, Appointments, Waiting, Conversion Rate**: Not tested due to browser crash.

5. **What evidence proves that?**
   Screenshots: `F3-total-leads-popout.png`, `F3-new-leads-popout.png`, `F3-sold-popout.png` (captured before browser died, sold popout in DOM snapshot only). DOM snapshots show dialog structure.

6. **Does the data look believable and internally consistent?**
   The summary breakdown (Sold) is correct and data-consistent. The record-level popouts (Total Leads, New Leads) claim records exist ("showing first 100 of 452") but the table content is not visible. Code review shows the `renderRecordTable()` function returns `null` for `total_leads` and `new_leads` keys because they don't match any of the specific table renderers (only `active_pipeline` and `appointments_today` have custom table layouts). The generic case falls through to `return null`.

7. **Does this satisfy the acceptance criteria?**
   Partially. The popouts open, summary breakdowns work, but **Total Leads and New Leads drill-downs show empty record areas despite claiming records exist**. This is a code bug in `SalesMetricDetailDialog.renderRecordTable()` -- the function only has explicit renderers for `active_pipeline` and `appointments_today`, and returns `null` for `total_leads` and `new_leads`.

8. **If not, what is broken and what should happen next?**
   **BUG-01**: `renderRecordTable()` in sales.tsx returns `null` for `total_leads` and `new_leads` metric keys because they lack explicit table renderers. The dialog says "showing first 100 of 452 records" but no records are displayed. Fix: add a generic table renderer as fallback in `renderRecordTable()`. This was listed as fixed in PE-SALES-02 (BUG-08) but the fix only added the API keys to `salesMetricApiKeys` without adding the corresponding render logic.

---

## F4: Metrics vs Recent Activity

**Result: Accepted with risk**

1. **What function/behavior was under evaluation?**
   Cross-referencing the Recent Activity feed with the metric totals.

2. **Why does it matter to the operator/business?**
   If activity items don't align with metric totals, it suggests stale data or broken event tracking.

3. **What should have happened?**
   Recent activity should show sales-related events that correlate with the dashboard metrics.

4. **What actually happened?**
   Recent Activity shows 10 items:
   - 4x "Login Failed" (about 10-11 hours ago)
   - 1x "Auto Greeting Sent" (about 10 hours ago)
   - 3x "Vapi Call Received" (about 10 hours ago)
   - 1x "Sync Backfill Completed" (about 18-19 hours ago)
   - 1x "Sync Backfill Failed" (1 day ago)
   
   The "Sync Backfill Completed" aligns with the warehouse being synced. The "Auto Greeting Sent" and "Vapi Call Received" events indicate Caroline is processing communications. The "Outbound Sent 24h" metric on the main dashboard showed 21, which aligns with active outbound activity.

5. **What evidence proves that?**
   DOM snapshot of Recent Activity feed. Screenshot: `F1-sales-dashboard-full.png` (visible in bottom portion).

6. **Does the data look believable and internally consistent?**
   Mostly. The activity feed shows system events (login failures, sync operations) and communication events (greetings, calls). However, the 4 failed logins at ~10 hours ago warrant attention - they could be automated probing. The activity does not directly show "new lead created" events that would correlate with the 36 new leads metric. The activity feed appears to be a general system log rather than sales-specific activity.

7. **Does this satisfy the acceptance criteria?**
   Partially. The activity feed renders with real data and timestamps, but it shows general system events rather than sales-specific pipeline activity. There is no way to directly cross-reference "36 new leads" with individual lead creation events in the activity log.

8. **If not, what is broken and what should happen next?**
   **RISK-01**: The activity feed on the Sales Dashboard shows org-wide system events (login failures, sync operations) rather than sales-specific events (new lead received, lead status changed, appointment created). This dilutes the value of the feed for sales managers. Consider filtering activity to sales-relevant events only, or adding a separate "Pipeline Activity" section. Not a bug per se, but a UX gap.

---

## F5: Trigger Configuration

**Result: Blocked**

1. **What function/behavior was under evaluation?**
   Verifying the trigger/automation configuration section exists on the Sales page, showing Caroline's triggers.

2. **Why does it matter to the operator/business?**
   Triggers automate lead follow-up (SMS, email, voice). If misconfigured, leads get missed.

3. **What should have happened?**
   Expected to find: New Lead Follow-Up (SMS via +18338935694), After-Hours trigger, 24h Standard Follow-Up, Outbound Phone Triggers, Outbound Email Triggers (via Resend), with channels and phone numbers visible.

4. **What actually happened?**
   The Sales Dashboard page does NOT contain a trigger configuration section. Code review of `sales.tsx` confirms: the page has 4 tabs (Dashboard, Agents, Insights, Calendar) with no trigger/automation configuration embedded. The "Open configuration" button (bottom-right) opens the right pane for agent-level configuration, but the browser crashed before this could be tested.

5. **What evidence proves that?**
   Full code review of `sales.tsx` (755 lines). No trigger configuration component is imported or rendered. The `renderDashboard()` function only renders: metric tiles, Top Performing Agents, and Recent Activity.

6. **Does the data look believable and internally consistent?**
   N/A - feature not present on this page.

7. **Does this satisfy the acceptance criteria?**
   Cannot evaluate. Trigger configuration may exist in the agent config pane (right panel) or on a different page, but it is not visible on the Sales Dashboard itself. Browser crash prevented testing the right pane.

8. **If not, what is broken and what should happen next?**
   **BLOCKED**: Browser session died before the "Open configuration" button could be tested. The trigger configuration may be in the agent right pane. A follow-up eval should open the right pane by clicking the configuration button or clicking Caroline in the agents sidebar.

---

## F6: Caroline's Setup

**Result: Blocked (partial data from dashboard)**

1. **What function/behavior was under evaluation?**
   Verifying Caroline is shown as the sales comms agent with correct channels and phone numbers.

2. **Why does it matter to the operator/business?**
   Caroline handles automated communications. If her configuration is wrong, leads get incorrect responses or no responses.

3. **What should have happened?**
   Caroline should appear as a sales agent with channels: voice, video, SMS, chat, webchat. Phone: +18338935694 (TextMagic SMS) and VAPI voice number.

4. **What actually happened?**
   Caroline appears in:
   - Top Performing Agents: ranked #4, primary channel "voice", status active (green dot)
   - Left submenu agents list: visible with a badge showing "3" (possibly 3 active triggers/tasks)
   
   However, the detailed agent configuration (channels, phone numbers, trigger details) is only accessible via the right pane which could not be opened due to browser crash.

5. **What evidence proves that?**
   DOM snapshot shows Caroline in Top Performing Agents with `voice` channel. Left sidebar shows Caroline with badge "3". Screenshot: `F1-sales-dashboard-full.png`.

6. **Does the data look believable and internally consistent?**
   What's visible is consistent. Caroline is listed as active with voice as primary channel. The code shows `agent.channels?.[0] || 'voice'` which means only the first channel is displayed in the dashboard view.

7. **Does this satisfy the acceptance criteria?**
   Partially. Caroline is present and active, but detailed channel verification (voice, video, SMS, chat, webchat) and phone number verification (+18338935694) requires opening the agent configuration pane.

8. **If not, what is broken and what should happen next?**
   **BLOCKED**: Need to open agent config pane to verify full channel list and phone numbers. The dashboard view only shows the first channel ("voice").

---

## F7: Cost Information

**Result: Accepted (not present)**

1. **What function/behavior was under evaluation?**
   Looking for any cost/pricing information on triggers or features.

2. **Why does it matter to the operator/business?**
   Operators need to understand costs associated with automated actions (SMS sends, API calls, etc.).

3. **What should have happened?**
   If cost information is a feature, it should be visible on relevant surfaces.

4. **What actually happened?**
   No cost/pricing information is displayed anywhere on the Sales Dashboard. Code review confirms: no cost-related components, variables, or API calls exist in `sales.tsx`.

5. **What evidence proves that?**
   Full code review of `sales.tsx` (755 lines). No string matches for "cost", "price", "pricing", "fee", "billing", or dollar amounts.

6. **Does the data look believable and internally consistent?**
   N/A.

7. **Does this satisfy the acceptance criteria?**
   This is an observation, not a pass/fail. Cost information is not a current feature of the Sales page.

8. **If not, what is broken and what should happen next?**
   N/A. Cost information may be a future feature or may live on a different page (Settings/Billing).

---

## F8: Data Plausibility Cross-Check

**Result: Accepted**

1. **What function/behavior was under evaluation?**
   Comparing Sales Dashboard metrics with Main Dashboard metrics for consistency.

2. **Why does it matter to the operator/business?**
   If different pages show different numbers for the same metric, it erodes trust in the platform.

3. **What should have happened?**
   Active Pipeline on Sales should match Active Pipeline on Main Dashboard. Other overlapping metrics should be consistent.

4. **What actually happened?**
   - Main Dashboard (from login snapshot): Active Pipeline = 107, Appointments Today = 0, Open Escalations = 262, Outbound Sent 24h = 21
   - Sales Dashboard: Active Pipeline = 107, Appointments Set = 0
   - Active Pipeline matches exactly (107 = 107)
   - Appointments matches (0 = 0)
   - Open Escalations (262) is shown only on Main Dashboard, not on Sales
   - Outbound Sent 24h (21) is shown only on Main Dashboard, not on Sales

5. **What evidence proves that?**
   DOM snapshots from both pages captured in the same session. Main Dashboard snapshot: Active Pipeline "107", Appointments Today "0", Open Escalations "262", Outbound Sent 24h "21". Sales Dashboard snapshot: Active Pipeline "107", Appointments Set "0".

6. **Does the data look believable and internally consistent?**
   Yes. The key overlapping metric (Active Pipeline = 107) matches exactly across both dashboards. This confirms both pages are reading from the same data source (warehouse). The Sales page also shows the pipeline source as "Warehouse" with code confirming `activePipeline = pipeline?.activePipeline ?? summary.activeLeads`.

7. **Does this satisfy the acceptance criteria?**
   Yes. Cross-dashboard consistency is verified for overlapping metrics.

8. **If not, what is broken and what should happen next?**
   N/A - accepted. Note: Open Escalations went from 249 (PE-SALES-02) to 262 (PE-SALES-03), an increase of 13 in approximately one day. This trend should be monitored.
