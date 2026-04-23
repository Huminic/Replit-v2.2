# Section Audit: Service
**Sprint:** E-013
**Route:** /service
**Page Component:** client/src/pages/service.tsx (762 lines)
**Sub-menu:** SubMenuManager.tsx (service section)

## What Exists in Code

### Page Structure (service.tsx)
- **4 tabs:** Campaigns (default), Agents, Insights, Calendar
  - Note: Campaigns IS first tab (line 60) — matches manifest requirement S-4.AC1
  - No "Dashboard" tab exists — matches manifest requirement S-4.AC2

### Campaigns Tab (default, lines 311-464)
- **Header:** "Service Campaigns" title + Communications Paused badge (when CommGate OFF) + Upload CSV button + New Campaign button
- **Campaign table columns:** Campaign name (+ CSV filename), Status (color dot), Channel (badge), Recipients, Sent, Replied, Kill Switch (toggle), Actions
- **Kill Switch:** Per-campaign toggle. Red when OFF. Checks `campaign.killSwitch` field.
- **Actions per campaign row:**
  - Execute (Play icon) — `dryRun: false`
  - Schedule (Calendar icon) — opens schedule dialog
  - Dry Run (Eye icon) — `dryRun: true`
  - Upload CSV (Upload icon) — per-campaign CSV upload
  - Stop (Square icon, red) — visible during execution with progress counter
- **Row click** → opens campaign detail dialog
- **New Campaign dialog:** Name, Channel (SMS/Email/Phone), Message Template fields
- **CSV Upload:** Hidden file input, accepts .csv, uploads via mutation
- **Campaign Safety card:** Explains kill switch behavior (mentioned in comments but need to verify rendering)
- **Execution status polling:** Queries `/api/campaigns/execution-statuses` every 5 seconds during active execution

### Agents Tab (lines 237-303)
- Grid of service agent cards from `/api/agents?department=service`
- Same card structure as Sales — avatar, name, channel, status dot, description, settings gear
- Description shown (line 296: `agent.description` with line-clamp-2)
- **Does NOT filter to Nancy only in code** — shows ALL agents with department=service. If other agents exist in DB with department=service, they'll appear.

### Insights Tab (lines 646-669)
- **6 metric tiles from /api/metrics/dashboard:**

| Tile | Data Source | Notes |
|---|---|---|
| Active Campaigns | metrics.campaignStats.byDepartment.service.active (fallback: campaignStats.active) | Service-filtered when available, global fallback |
| Messages Sent | metrics.campaignStats.byDepartment.service.sent (fallback: campaignStats.totalSent) | Same pattern |
| Replies Received | metrics.campaignStats.byDepartment.service.replied (fallback: campaignStats.totalReplied) | Same pattern |
| Open Conversations | metrics.conversationCounts.open | NOT service-filtered — shows ALL org open conversations |
| Total Conversations | metrics.conversationCounts.total | NOT service-filtered — shows ALL org conversations |
| Reply Rate | metrics.campaignStats.byDepartment.service.replyRate (fallback: campaignStats.replyRate) | Percentage |

**FINDING: Open Conversations and Total Conversations are NOT service-filtered.** They show org-wide counts, not service-department-specific. This may be misleading on a service page.

**FINDING: No change/trend data on service metrics.** All `change: 0, trend: 'up'` — hardcoded. Unlike Sales which shows actual change percentages, Service metrics show no delta information.

- Below metric tiles: `<InsightsPage embedded />` — same embedded insights component as Sales

### Calendar Tab (line 671)
- `<AppointmentCalendar department="service" />` — department-filtered calendar

### Sub-menu Panel
- Nav items: Dashboard, Agents, Campaigns, Insights, Calendar
- **MISMATCH:** Sub-menu has "Dashboard" as first item (line: `sv-dashboard`), but page has NO dashboard tab. Dashboard link in sub-menu goes to `/service` which defaults to Campaigns tab. This is confusing — the sub-menu says "Dashboard" but it loads Campaigns.
- Agent list with search below nav items

## Manifest vs Code

| Manifest Item | Code Status | Gap? |
|---|---|---|
| Need to see Nancy Payne in agent list | Shows all department=service agents. If Nancy exists in DB as service, she'll appear. If others exist, they'll also appear. | Need to verify DB — manifest says REMOVE other agents |
| Agent cards should say what agent does | YES — description shown (line 296) | No gap |
| Remove any other agents from service | NOT enforced in code — shows all department=service | DB/seed issue, not code |
| Dashboard data needs moved to insights, dashboard item deleted | Dashboard tab DOES NOT EXIST in page. But sub-menu still shows "Dashboard" label. Insights tab has metric tiles. | Sub-menu label needs update |
| Move campaigns to top of list | YES — Campaigns is first tab (line 60) | No gap |
| Dashboard replaced with Full CRUD Campaign + CSV upload | YES — Campaigns tab is default with create/CSV/execute/schedule | No gap |
| Active campaign stats only on dashboard | N/A — no dashboard. Campaigns tab shows stats per campaign in table. Insights shows aggregate metrics. | Clarify with operator |
| Insights needs more data in modal | Metric tile click opens dialog but insight detail may be sparse | Need to verify drill-down content |

## Findings

1. **Sub-menu says "Dashboard" but page has no Dashboard tab** — Sub-menu item `sv-dashboard` links to `/service` which loads Campaigns (default). Label should say "Campaigns" or be removed.
2. **Open Conversations and Total Conversations metrics are NOT service-filtered** — They show org-wide counts on a service-specific page. Misleading.
3. **Service metrics have no change/trend data** — All hardcoded to `change: 0, trend: 'up'`. Sales shows real deltas; Service doesn't.
4. **Agent tab shows ALL department=service agents, not just Nancy** — If other agents exist with department=service in DB, they'll appear. Manifest says remove others.
5. **Campaign detail dialog** — Row click opens it. Need to verify it shows all fields: name, status, channel, template, recipients, sent, replied, CSV, history (S-4.AC5).

## Existing ACs

| AC | Coverage | Issues Found |
|---|---|---|
| S-4.AC1 | Campaigns tab first | PASS — code confirms |
| S-4.AC2 | No Dashboard tab | PASS — code confirms |
| S-4.AC3 | New Campaign button visible | PASS — in header |
| S-4.AC4 | CSV Upload button prominent | PASS — dedicated button in header + per-row |
| S-4.AC5 | Campaign detail dialog shows all fields | Need to verify |
| S-4.AC6 | Insights tab shows KPI tiles | PARTIAL — tiles exist but 2/6 are org-wide not service-filtered |
| S-4.AC7 | Only Nancy Gaston on Agents tab | Depends on DB — code shows ALL service agents |
| S-4.AC8 | Nancy has non-empty instructions | DB check needed |
| S-4.AC9 | Campaign execute flow (CSV → execute → SMS) | PASS — full CRUD + execute + dryRun in code |
| S-4.AC10 | Customer reply creates TeamBox conversation | BE verification needed |
| S-4.AC11 | Nancy responds to recall questions | Functional test needed |
| S-4.AC12 | Nancy books appointment | Functional test needed |
| S-4.AC13 | After-hours message queueing | BE verification needed |
| S-4.AC14 | After-hours 7 AM release | BE verification needed |

## New ACs Needed

| Proposed AC | Priority | Dimension |
|---|---|---|
| Service Insights metrics are service-department-filtered (not org-wide) | T2 | FE/BE |
| Service metrics show real change/trend data (not hardcoded zeros) | T2 | FE/BE |
| Sub-menu label matches page tab structure (no phantom "Dashboard") | T3 | FE |
| Agent tab shows ONLY Nancy for service department (verify DB seed) | T2 | DT |
| Campaign execution E2E: create → CSV → dryRun → execute → SMS delivered → reply appears in TeamBox | T1 | FE/BE/DT |
| Campaign detail dialog shows all expected fields when row clicked | T2 | FE |
| Insights drill-down modal shows meaningful data (not empty) | T2 | FE/BE |

## Section Description (DRAFT — for operator edit)

**Service is the service department's campaign and communication hub.** It opens to the Campaigns tab showing a full campaign management table with create, CSV upload, execute, dry run, schedule, and per-campaign kill switch. The CommGate badge shows when global outbound is paused.

Other tabs: **Agents** (service department AI agents — should show only Nancy Gaston per manifest), **Insights** (6 metric tiles — Active Campaigns, Messages Sent, Replies Received, Open Conversations, Total Conversations, Reply Rate — plus embedded analytics), and **Calendar** (service appointment scheduling filtered to service department).

**Issues found:** Sub-menu still shows "Dashboard" label but page has no Dashboard tab. Two insight metrics (Open Conversations, Total Conversations) show org-wide data, not service-filtered. Service metrics have no change/trend data (all hardcoded to zero). Agent tab doesn't filter to Nancy only — it shows all department=service agents from the DB. Campaign detail dialog needs verification for completeness.
