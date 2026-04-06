# PE-SALES-01 Evidence Index

**Date:** 2026-04-06
**Evaluator:** Playwright Operator (automated)
**Target:** https://live.huminic.app/sales
**Accounts Used:** serra_honda@huminic.ai (org_admin), duane.wells@huminic.ai (super_admin)

---

## Phase 1: Metric Tiles

### UC-01: Are 7 tiles visible?
**PASS** -- All 7 tiles are visible on the Sales Dashboard.

**Serra Honda values (logged in as serra_honda@huminic.ai):**

| Tile | Value | Change |
|------|-------|--------|
| Total Leads (30d) | 353 | 0% vs last 30d |
| New Leads | 9 | 0% vs last 30d |
| Active Pipeline | 16 | 0% vs last 30d |
| Waiting on Response | 53 | 0% vs last 30d |
| Appointments Set | 22 | 0% vs last 30d |
| Sold | 10 | 0% vs last 30d |
| Conversion Rate | 2.8% | 0% vs last 30d |

**Sync status:** "Warehouse / Synced 9d ago"
**Screenshot:** screenshots/UC-01-serra-honda-dashboard-full.png, screenshots/UC-01-serra-honda-full-tall.png

### UC-02: Are values plausible for Serra Honda?
**PARTIAL PASS** -- Values are non-zero where expected (Total Leads, Active Pipeline, Sold, etc.). However:
- All "vs last 30d" changes show 0%, which is suspicious -- implies no comparison data exists or the comparison period has identical values.
- 353 total leads in 30 days is plausible for a Honda dealership.
- 22 Appointments Set but Active Pipeline is only 16 -- the appointments count exceeds pipeline, which may indicate stale data.

### UC-03: Tony Serra Ford metrics
**FINDING: KNOWN BUG NOT REPRODUCED** -- The operator expected "all zeros" for Tony Serra Ford, but the dashboard shows real data.

**Tony Serra Ford values (via super_admin org switch):**

| Tile | Value |
|------|-------|
| Total Leads (30d) | 202 |
| New Leads | 1 |
| Active Pipeline | 0 |
| Waiting on Response | 42 |
| Appointments Set | 0 |
| Sold | 8 |
| Conversion Rate | 4% |

**Sync status:** "Warehouse / Synced 5d ago"
**Screenshot:** screenshots/UC-03-tony-serra-ford.png

### UC-03b: Other stores

**Ford of Columbia:**

| Tile | Value |
|------|-------|
| Total Leads (30d) | 217 |
| New Leads | 7 |
| Active Pipeline | 0 |
| Waiting on Response | 95 |
| Appointments Set | 0 |
| Sold | 0 |
| Conversion Rate | 0% |

Sync: "Synced 16d ago"
Screenshot: screenshots/UC-03b-ford-of-columbia.png

**Serra Nissan:**

| Tile | Value |
|------|-------|
| Total Leads (30d) | 222 |
| New Leads | 2 |
| Active Pipeline | 9 |
| Waiting on Response | 53 |
| Appointments Set | 0 |
| Sold | 9 |
| Conversion Rate | 4.1% |

Sync: "Synced 13d ago"
Screenshot: screenshots/UC-03b-serra-nissan.png

**Hyundai of Columbia:**

| Tile | Value |
|------|-------|
| Total Leads (30d) | 206 |
| New Leads | 8 |
| Active Pipeline | 0 |
| Waiting on Response | 79 |
| Appointments Set | 0 |
| Sold | 0 |
| Conversion Rate | 0% |

Sync: "Synced 16d ago"
Screenshot: screenshots/UC-03b-hyundai-of-columbia.png

**Huminic (super_admin home org):**
All tiles show 0. No sync timestamp shown (just "Warehouse" label). Expected -- no VIN integration for Huminic org.
Screenshot: screenshots/UC-03-huminic-all-zeros.png

**NOTE:** serra_honda@huminic.ai (org_admin) has NO org switcher options -- the dropdown opens with "Switch Organization" header but no orgs listed. This is expected RBAC behavior for org_admin with only one org membership. Org switching tests were performed via super_admin account.

### UC-04: Switch back to Serra Honda -- do values restore?
**PASS** -- After switching through Tony Serra Ford, Ford of Columbia, Serra Nissan, Hyundai of Columbia, returning to Serra Honda shows identical values: 353, 9, 16, 53, 22, 10, 2.8%.
Screenshot: screenshots/UC-04-serra-honda-restore.png

---

## Phase 2: Drill-Downs and Popouts

### UC-05: Active Pipeline drill-down
**PASS (with data quality issues)** -- Dialog opens as a table with 16 rows. Columns: Name, Status, Vehicle, Lead ID, Show Contact.

**Data quality issues:**
- 11 of 16 records show "--" (em dash) for Name -- missing customer names
- Vehicle column shows raw VIN Solutions API URLs (e.g., `https://api.vinsolutions.com/vehicles/interest/id/1988464528-0`) instead of vehicle descriptions
- Named records include: AI Lead, Michael Mccord, Donnie Kitchens, Renay Elmore, Braden Macon
- Status values are VIN Solutions internal codes: ACTIVE_NEW_LEAD, ACTIVE_WAITING_FOR_PROSPECT_RESPONSE, ACTIVE_ACTIVE_LEAD

Screenshot: screenshots/UC-05-active-pipeline-drilldown.png

### UC-06: Appointments Set drill-down
**BUG** -- Dialog opens with correct structure ("Records that make up this metric") but shows:
- Header: "22 / 0% vs last 30d / 0 records"
- Body: "No records found"
- The tile says 22 but the drill-down has 0 records. Data mismatch.

Screenshot: screenshots/UC-06-appointments-set-drilldown.png

### UC-07: Other tile drill-downs
All remaining tiles open a **summary dialog** (not a table):
- **Total Leads:** Current Value 353, Change 0%, Period Last 30 days. "Data sourced from warehouse sync."
- **New Leads:** Current Value 9, Change 0%, Period Last 30 days. Summary only.
- **Waiting on Response:** Current Value 53, Change 0%, Period Last 30 days. Summary only.
- **Sold:** Current Value 10, Change 0%, Period Last 30 days. Summary only.
- **Conversion Rate:** Current Value 2.8%, Change 0%, Period Last 30 days. Summary only.

Only Active Pipeline and Appointments Set show the "records" table format. The other 5 show simple metric summaries.

Screenshots: screenshots/UC-07-total-leads-drilldown.png, UC-07-new-leads-drilldown.png, UC-07-waiting-response-drilldown.png, UC-07-sold-drilldown.png, UC-07-conversion-rate-drilldown.png

### UC-08: Cost/Price/Dollar Information Check
**PASS** -- NO cost, price, or dollar amounts appear in ANY popout or drill-down. Every dialog shows only counts, percentages, and status labels. The operator's #10 critical bug concern about unwanted cost information is NOT present.

All 7 popout screenshots confirm zero financial data.

### UC-09: View Contact from Active Pipeline
**PARTIAL PASS** -- Contact Details dialog shows:
- Name: "AI Lead" (appears to be a generic/placeholder name, not a real customer)
- Status: ACTIVE_NEW_LEAD
- Phone: 2568623318 (real phone number format)
- Vehicle of Interest: Raw API URL (same bug as drill-down table)
- Action buttons: Call, Text
- No email address shown
- No cost/financial data (good)

Screenshot: screenshots/UC-09-contact-details.png

---

## Phase 3: Sync and VAPI

### UC-10: Sync status
**PARTIAL PASS** -- Sync status shows:
- Serra Honda: "Warehouse / Synced 9d ago"
- Tony Serra Ford: "Warehouse / Synced 5d ago"
- Serra Nissan: "Warehouse / Synced 13d ago"
- Ford of Columbia: "Warehouse / Synced 16d ago"
- Hyundai of Columbia: "Warehouse / Synced 16d ago"
- Huminic: "Warehouse" (no timestamp)

**No visible refresh/re-sync button on the dashboard.** The "Warehouse" label appears as a static badge, not a clickable action.

**CONCERN:** Several stores show stale sync data (9-16 days old). This aligns with known issue I-201 (delta sync never succeeding).

### UC-11: VAPI leads visibility
**NOT VISIBLE** -- There is no explicit "VAPI leads" or "Voice leads" metric on the Sales Dashboard tiles. The dashboard shows generic lead categories (Total Leads, New Leads, Active Pipeline, etc.) without distinguishing lead source.

However, the Recent Activity feed DOES show VAPI activity:
- "Vapi Call Received" entries (about 16 hours ago for Serra Honda)
- "Vin Lead Creation Failed" entries paired with VAPI calls

The operator's concern ("shows zero vapi leads in last 7 days even though recent activity shows calls") is consistent with what we see: VAPI calls are logged in activity but there is no dedicated VAPI lead count tile.

---

## Phase 4: Trigger Config

### UC-12: Trigger configuration
**NOT FOUND** -- No trigger configuration is accessible from the Sales Dashboard page. The Agents tab shows agent cards with gear icons (settings) but no visible trigger/automation configuration. The gear icons were not clicked to avoid potentially navigating away, but they appear to be individual agent settings, not campaign triggers.

---

## Phase 5: Other Tabs

### UC-13: Agents tab
**PASS (with issues)** -- Agent cards load successfully. 11 agents shown:

| # | Name | Type | Status | Description |
|---|------|------|--------|-------------|
| 1 | Caroline | voice | active | Serra Honda AI Sales Agent |
| 2 | Sales Coach | chat | active | Sales coaching, objection handling |
| 3 | Communication Writer | chat | active | Professional email/SMS drafts |
| 4-9 | Unauthorized Agent | voice | active | "Should fail" |
| 10 | Data Guru | chat | active | VIN Solutions CRM data expert |
| 11 | Unauthorized Agent | voice | active | "Should fail" |

**BUG:** 7 of 11 agents display as "Unauthorized Agent" with description "Should fail" and are marked "active". These appear to be test/stub entries that should either be hidden or properly named.

All agents show green "active" badges and green status dots. Gear icons present on each card.
Screenshot: screenshots/UC-13-agents-tab.png

### UC-14: Calendar tab
**PASS** -- Calendar displays April 2026 correctly. Shows:
- Appointment entries on April 2, 3, and 6 (today)
- Entry types visible: "Video Appointment", "Call Appointment", "DC-US013 Test Drive"
- April 6 (today) shows "Call Appointment -- Team...", "Call Appointment -- Takeo..." and "+20 more"
- "Sync Sources" button and "+ New Appointment" button present
- Navigation arrows for month switching

Screenshot: screenshots/UC-14-calendar-tab.png

### UC-15: Recent Activity Feed
**PASS** -- Activity feed shows plausible, diverse entries for Serra Honda:
1. Sync Metrics Refreshed -- about 12 hours ago
2. Vapi Call Received -- about 16 hours ago
3. Vin Lead Creation Failed -- about 16 hours ago
4. Vapi Call Received -- about 16 hours ago
5. Vin Lead Creation Failed -- about 16 hours ago
6. Auto Greeting Sent -- about 16 hours ago
7. Tavus Video Completed -- about 16 hours ago (x4)

Activity varies appropriately by org. Hyundai of Columbia shows almost exclusively "Vapi Call Received" entries. Huminic shows "Login Failed" entries.

### UC-16: Top Performing Agents
**PASS (with issues)** -- Top Performing Agents section shows a ranked list:
- Serra Honda: 11 agents listed (Caroline #1, Sales Coach #2, Communication Writer #3, then 7 "Unauthorized Agent" entries, Data Guru #10, Unauthorized Agent #11)
- Other stores show 3-4 agents

**BUG:** Same "Unauthorized Agent" naming issue as the Agents tab. No performance metrics shown (no call count, conversion count, etc.) -- just name, type, and rank number.

---

## Insights Tab (Bonus -- not in original use cases)
The Insights tab is fully functional with sub-tabs: Dashboard, Reports, Library, Hunches, and "All Stores" filter dropdown.

Dashboard shows:
- Immediate Action Required: Hot Leads Going Cold (20), New Leads Without Contact (9), Showroom Visitors Not Closed (0)
- Watch List: Stale Leads >7 days (343 with CSV export), Pending Finance (0)
- Today's Performance: Pipeline Active 139, Conversion Rate 2.8%, Total Leads 353
- Pipeline Health: Active Pipeline 353, Freshness Score N/A (39% under 7 days), Hot Leads 139, Month-End Forecast 10 (-40 vs target 50)
- Performance Scorecard: Win Rate 2.8%, Total Sold 10, Hot Leads 139, Total Leads 353
- Charts: Leads This Week, Conversions by Day (both showing flat/zero lines)

Screenshot: screenshots/UC-insights-tab.png
