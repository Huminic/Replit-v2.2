# Test Plan: Service Domain (T-003 — Exhaustive)

**Domain:** Service (`/service`)
**Sprint:** T-003
**Created by:** Planner Agent (T-003)
**Status:** Active

---

## Source Inventory

| Source | Path | Key Findings |
|--------|------|--------------|
| Service page component | `client/src/pages/service.tsx` | ~845 lines. 4 tabs: Campaigns (default), Agents, Insights, Calendar. Campaign CRUD, kill switch, CSV upload, execution controls, metric tiles, campaign detail dialog, schedule dialog, safety card. |
| Existing E2E (domain-06) | `tests/e2e/domain-06-departments.spec.ts` | 8 tests (6.1-6.8). Service: 6.2 page load with KPIs, 6.8 submenu shows agents. Shallow coverage only. |
| Existing E2E (s4-service) | `tests/e2e/s4-service.spec.ts` | 20 tests. Campaigns tab first (AC1), no Dashboard tab (AC2), New Campaign button (AC3), CSV Upload button (AC4), campaign detail dialog (AC5), Insights KPI (AC6), Nancy Gaston agent (AC7-AC8), campaign CRUD API (AC9), campaignId convos (AC10), Nancy AI chat (AC11-AC12), after-hours logic (AC13-AC14), sub-menu labels (I-115), safety dismiss (I-128), tooltips (I-129), metric trends (I-113), multi-channel checkboxes (I-132), rate limit (I-106/107), metrics API (AC15). |
| Campaign routes | `server/routes/campaigns.ts` | GET list, POST create (requireRole 3 + entitlement), GET :id, PATCH :id (requireRole 3), POST execute (requireRole 3), POST stop (requireRole 3), GET execution-status, POST upload-csv (requireRole 3), GET recipients. |
| Appointment calendar | `client/src/components/AppointmentCalendar.tsx` | Month view, appointment types (test_drive, follow_up, service, consultation, general), create form, connector sources (Google Cal, Dealer.com, Tekion). |
| Appointment routes | `server/routes/appointments.ts` | GET list (with department + date filters), GET :id, POST create, PATCH :id, DELETE :id. |
| RBAC | `client/src/lib/rbac.ts` | Service role: access to ai-chat, teambox, service only. Admin roles (super_admin, partner_admin, org_admin, executive): all sections including service. |
| Auth helper | `tests/e2e/helpers/auth.ts` | testUsers: service (service_staff@huminic.ai), orgAdmin (serra_honda@huminic.ai), superAdmin, sales, marketing, etc. |
| Metrics API | `server/routes/metrics.ts` | `GET /api/metrics/dashboard` returns campaignStats with byDepartment.service breakdown. |
| Agents API | `server/routes/` (via query) | `GET /api/agents?department=service` — filtered agent list. |

---

## Service Page Anatomy

### Layout (route: `/service`)

```
+--------------------------------------------------------------------+
| TopBar (h-14)                                                       |
+------+-------------------------------------------------------------+
| Side |  "Service" (h1)                                              |
| bar  |  [Campaigns] [Agents] [Insights] [Calendar]  <- tab bar     |
| 72px |                                                              |
|      |  === Active Tab Content ===                                  |
|      |                                                              |
+------+-------------------------------------------------------------+
```

### Tab: Campaigns (default)

- Header: "Service Campaigns" + Communications Paused badge (if gate OFF)
- Action buttons: CSV Template download link, Upload CSV button, New Campaign button
- Campaign table columns: Campaign (name + csv filename), Status (dot + label), Channel (badge), Recipients, Sent, Replied, Kill Switch (toggle), Actions
- Action buttons per campaign row: Execute, Schedule, Dry Run, Upload CSV, Stop (when executing)
- Execution status badge (animated when executing): processed/total + dry indicator
- Campaign Safety card (dismissible via localStorage)
- New Campaign dialog: name input, channel checkboxes (SMS, Email, Phone Call), message template textarea, Cancel/Create buttons
- Schedule dialog: datetime-local input, Cancel/Schedule buttons
- Campaign detail dialog: status, channel, recipients, sent, replied, kill switch state, CSV filename, message template

### Tab: Agents

- Header: "Service Agents"
- Grid of agent cards (1/2/3 cols responsive)
- Each card: avatar, name, channel, settings button (opens right pane), status dot, description
- Click card: navigates to /agents with selectedAgent set
- Loading state: skeleton cards

### Tab: Insights

- Header: "Service Metrics" + subtitle
- 6 metric tiles in grid (1/2/3 cols responsive):
  - svm-1: Active Campaigns
  - svm-2: Messages Sent
  - svm-3: Replies Received
  - svm-4: Open Conversations
  - svm-5: Total Conversations
  - svm-6: Reply Rate (%)
- Click tile: opens metric detail dialog with value, department, data source
- Embedded InsightsPage component below tiles

### Tab: Calendar

- AppointmentCalendar component with department="service"
- Month navigation (prev/next)
- Day cells with appointment dots
- Click day: show appointments for that day
- New appointment form: title, customer name/phone/email, type, start/end time, notes
- Appointment types: test_drive, follow_up, service, consultation, general
- Connector sources panel (super_admin only): Google Calendar, Dealer.com, Tekion

---

## Existing Coverage Summary

| Area | Existing Tests | Coverage Level |
|------|---------------|----------------|
| Page load + KPI presence | 6.2 (domain-06) | Shallow — checks any card/tile exists |
| Submenu agents | 6.8 (domain-06) | Shallow — checks >= 1 agent in submenu |
| Tab structure | AC1, AC2 (s4) | Code review only (fs.readFileSync) |
| Button presence | AC3, AC4 (s4) | Code review only |
| Campaign detail dialog | AC5 (s4) | Code review only |
| Insights KPI content | AC6 (s4) | Code review only |
| Nancy Gaston agent | AC7, AC8 (s4) | API test — agent count + instructions |
| Campaign CRUD API | AC9 (s4) | API test — create + list |
| Campaign conversations | AC10 (s4) | API test — query with campaignId |
| Nancy AI chat quality | AC11, AC12 (s4) | API test — recall + appointment |
| After-hours logic | AC13/AC14 (s4) | Code review only |
| Sub-menu labels | I-115 (s4) | Code review only |
| Safety dismiss button | I-128 (s4) | Code review only |
| Tooltips | I-129 (s4) | Code review only |
| Metric trends | I-113 (s4) | Code review only |
| Multi-channel checkboxes | I-132 (s4) | Code review only |
| Rate limit | I-106/107 (s4) | Code review only |
| Metrics API | AC15 (s4) | API test — returns campaignStats |
| **Calendar tab** | **NONE** | **No coverage** |
| **Kill switch UI interaction** | **NONE** | **No E2E coverage** |
| **CSV upload UI flow** | **NONE** | **No E2E coverage** |
| **Campaign execution UI** | **NONE** | **No E2E coverage** |
| **New Campaign dialog UI** | **NONE** | **No E2E coverage** |
| **Schedule dialog UI** | **NONE** | **No E2E coverage** |
| **Tab switching UI** | **NONE** | **No E2E coverage** |
| **Role-based access** | **NONE** | **No E2E coverage** |
| **Metric tile click + dialog** | **NONE** | **No E2E coverage** |
| **Agent card interaction** | **NONE** | **No E2E coverage** |
| **Communications Paused badge** | **NONE** | **No E2E coverage** |
| **Appointment CRUD API** | **NONE** | **No coverage** |

---

## Test Cases

### 1. Page Load & Structure

| ID | Name | Priority | Type | Steps | Expected Result | Status |
|----|------|----------|------|-------|-----------------|--------|
| TC-SVC-001 | Service page loads for service role | P0 | E2E | 1. Login as testUsers.service. 2. Navigate to /service. 3. Wait for load. | Page loads. `[data-testid="service-page"]` visible. Title "Service" present. No console errors. | EXISTING (6.2 partial) |
| TC-SVC-002 | Service page loads for org_admin | P0 | E2E | 1. Login as testUsers.orgAdmin. 2. Navigate to /service. | Page loads. Service page content visible. | NEW |
| TC-SVC-003 | Service page loads for super_admin | P1 | E2E | 1. Login as testUsers.superAdmin. 2. Navigate to /service. | Page loads. Service page content visible. | NEW |
| TC-SVC-004 | Default tab is Campaigns | P0 | E2E | 1. Login as service user. 2. Navigate to /service. | `[data-testid="tab-service-campaigns"]` has active styling (border-primary). Campaigns content visible ("Service Campaigns" heading). | EXISTING (AC1 code-review only) — NEW E2E |
| TC-SVC-005 | All 4 tabs render in tab bar | P0 | E2E | 1. Login. 2. Navigate to /service. | Four tabs visible: Campaigns, Agents, Insights, Calendar. data-testid: tab-service-campaigns, tab-service-agents, tab-service-insights, tab-service-calendar. | NEW |
| TC-SVC-006 | No Dashboard tab exists | P1 | E2E | 1. Navigate to /service. | No tab with text "Dashboard" exists. No `[data-testid="tab-service-dashboard"]`. | EXISTING (AC2 code-review only) — NEW E2E |

### 2. Tab Navigation

| ID | Name | Priority | Type | Steps | Expected Result | Status |
|----|------|----------|------|-------|-----------------|--------|
| TC-SVC-010 | Switch to Agents tab | P0 | E2E | 1. Navigate to /service. 2. Click `[data-testid="tab-service-agents"]`. | Agents tab becomes active. "Service Agents" heading visible. | NEW |
| TC-SVC-011 | Switch to Insights tab | P0 | E2E | 1. Navigate to /service. 2. Click `[data-testid="tab-service-insights"]`. | Insights tab becomes active. "Service Metrics" heading visible. | NEW |
| TC-SVC-012 | Switch to Calendar tab | P0 | E2E | 1. Navigate to /service. 2. Click `[data-testid="tab-service-calendar"]`. | Calendar tab becomes active. Calendar component renders (month view). | NEW |
| TC-SVC-013 | Switch back to Campaigns tab | P1 | E2E | 1. Navigate to /service. 2. Click Agents tab. 3. Click Campaigns tab. | Campaigns tab active again. Campaign table visible. | NEW |
| TC-SVC-014 | URL ?tab= parameter sets active tab | P1 | E2E | 1. Navigate to /service?tab=agents. | Agents tab is active on load. | NEW |
| TC-SVC-015 | Invalid ?tab= parameter defaults to campaigns | P2 | E2E | 1. Navigate to /service?tab=invalid. | Campaigns tab is active (default). | NEW |

### 3. Campaigns Tab — Table Display

| ID | Name | Priority | Type | Steps | Expected Result | Status |
|----|------|----------|------|-------|-----------------|--------|
| TC-SVC-020 | Campaign table renders with columns | P0 | E2E | 1. Login as orgAdmin. 2. Navigate to /service. | Table header contains: Campaign, Status, Channel, Recipients, Sent, Replied, Kill Switch, Actions. | NEW |
| TC-SVC-021 | Campaign rows render with data | P0 | E2E | 1. Navigate to /service. | At least one campaign row visible (`[data-testid^="campaign-row-"]`). Each row shows name, status dot, channel badge, numeric counts. | NEW |
| TC-SVC-022 | Campaign status indicator colors | P1 | E2E | 1. Navigate to /service. | Status dots use correct colors: active=green, paused=amber, draft=gray, completed=blue, scheduled=purple. | NEW |
| TC-SVC-023 | Campaign CSV filename shown when present | P2 | E2E | 1. Create campaign with CSV. 2. Navigate to /service. | Campaign row shows CSV filename with upload icon. | NEW |
| TC-SVC-024 | Loading spinner during campaign fetch | P2 | E2E | 1. Navigate to /service with slow network. | Loader2 spinner visible while campaigns load. | NEW |

### 4. Campaigns Tab — New Campaign Dialog

| ID | Name | Priority | Type | Steps | Expected Result | Status |
|----|------|----------|------|-------|-----------------|--------|
| TC-SVC-030 | New Campaign button opens dialog | P0 | E2E | 1. Click `[data-testid="button-new-campaign"]`. | Dialog opens with title "Create Service Campaign". Name input, channel checkboxes, template textarea visible. | EXISTING (AC3 code-review only) — NEW E2E |
| TC-SVC-031 | Channel checkboxes default to SMS selected | P1 | E2E | 1. Open new campaign dialog. | `[data-testid="checkbox-channel-sms"]` is checked. Email and Phone unchecked. | NEW |
| TC-SVC-032 | Multi-channel selection creates multiple campaigns | P1 | E2E | 1. Open dialog. 2. Enter name. 3. Check SMS + Email. 4. Enter template. 5. Click create. | Button text shows "Create 2 Campaigns". On submit, 2 campaigns created (one per channel). Toast confirms. | EXISTING (I-132 code-review only) — NEW E2E |
| TC-SVC-033 | Create button disabled when name empty | P1 | E2E | 1. Open dialog. 2. Leave name empty. | `[data-testid="button-submit-campaign"]` is disabled. | NEW |
| TC-SVC-034 | Create button disabled when no channel selected | P1 | E2E | 1. Open dialog. 2. Enter name. 3. Uncheck all channels. | Submit button is disabled. | NEW |
| TC-SVC-035 | Cancel button closes dialog without creating | P1 | E2E | 1. Open dialog. 2. Enter name. 3. Click Cancel. | Dialog closes. No new campaign created. | NEW |
| TC-SVC-036 | Successful campaign creation shows toast | P0 | E2E | 1. Open dialog. 2. Fill name + template. 3. Submit. | Dialog closes. Toast "Campaign Created" appears. Campaign appears in table. | NEW |
| TC-SVC-037 | Campaign creation error shows destructive toast | P2 | E2E | 1. Simulate API failure on campaign create. | Toast with variant "destructive" and error message appears. | NEW |

### 5. Campaigns Tab — CSV Upload

| ID | Name | Priority | Type | Steps | Expected Result | Status |
|----|------|----------|------|-------|-----------------|--------|
| TC-SVC-040 | Upload CSV button triggers file picker | P0 | E2E | 1. Click `[data-testid="button-upload-csv"]`. | Hidden file input (`[data-testid="input-csv-upload"]`) triggered. Accept=".csv". | EXISTING (AC4 code-review only) — NEW E2E |
| TC-SVC-041 | CSV Template download link works | P1 | E2E | 1. Locate `[data-testid="link-download-csv-template"]`. | Link href="/campaign-template.csv" with download attribute. | NEW |
| TC-SVC-042 | Per-campaign CSV upload button | P1 | E2E | 1. Find a campaign row. 2. Click `[data-testid^="button-upload-csv-"]` in actions. | File picker opens for that specific campaign. | NEW |
| TC-SVC-043 | Successful CSV upload shows toast with count | P1 | API | 1. Create campaign. 2. Upload valid CSV. | Toast "CSV Uploaded" with "{n} recipients loaded" message. Campaign recipientCount updated. | NEW |
| TC-SVC-044 | CSV upload with warnings shows warning toast | P2 | API | 1. Upload CSV with some invalid rows. | Toast "CSV Uploaded with Warnings" with warning details. | NEW |
| TC-SVC-045 | CSV upload failure shows error toast | P2 | E2E | 1. Upload invalid file. | Toast with variant "destructive" and error message. | NEW |

### 6. Campaigns Tab — Kill Switch

| ID | Name | Priority | Type | Steps | Expected Result | Status |
|----|------|----------|------|-------|-----------------|--------|
| TC-SVC-050 | Kill switch toggle visible per campaign | P0 | E2E | 1. Navigate to /service. | Each campaign row has `[data-testid^="switch-killswitch-"]` toggle. | NEW |
| TC-SVC-051 | Kill switch toggle sends PATCH request | P0 | E2E | 1. Toggle kill switch on a campaign. | PATCH /api/campaigns/:id called with { killSwitch: true/false }. Campaign list refreshes. | NEW |
| TC-SVC-052 | Kill switch ON shows red unchecked state | P1 | E2E | 1. Enable kill switch. | Switch has `data-[state=unchecked]:bg-red-500` styling. | NEW |
| TC-SVC-053 | Kill switch click does not open campaign detail | P1 | E2E | 1. Click kill switch area. | Click event stops propagation. Campaign detail dialog does NOT open. | NEW |

### 7. Campaigns Tab — Execution Controls

| ID | Name | Priority | Type | Steps | Expected Result | Status |
|----|------|----------|------|-------|-----------------|--------|
| TC-SVC-060 | Execute button starts campaign | P0 | E2E | 1. Click `[data-testid^="button-start-campaign-"]`. | POST /api/campaigns/:id/execute with dryRun=false. Toast "Campaign Started". | NEW |
| TC-SVC-061 | Execute button disabled when recipientCount=0 | P1 | E2E | 1. Find campaign with 0 recipients. | Execute, Schedule, and Dry Run buttons are disabled. | NEW |
| TC-SVC-062 | Dry Run button starts preview mode | P0 | E2E | 1. Click `[data-testid^="button-dryrun-campaign-"]`. | POST /api/campaigns/:id/execute with dryRun=true. Toast "Dry Run Started — Preview mode". | NEW |
| TC-SVC-063 | Schedule button opens schedule dialog | P0 | E2E | 1. Click `[data-testid^="button-schedule-campaign-"]`. | Schedule dialog opens with datetime-local input. | NEW |
| TC-SVC-064 | Schedule dialog submits with future datetime | P1 | E2E | 1. Open schedule dialog. 2. Set future datetime. 3. Click Schedule. | POST /api/campaigns/:id/execute with scheduledAt. Toast "Campaign Scheduled". | NEW |
| TC-SVC-065 | Schedule dialog cancel closes without action | P2 | E2E | 1. Open schedule dialog. 2. Click Cancel. | Dialog closes. No API call. | NEW |
| TC-SVC-066 | Stop button appears during execution | P0 | E2E | 1. Start campaign execution. 2. Observe row. | Stop button (`[data-testid^="button-stop-campaign-"]`) appears. Execution badge shows progress. | NEW |
| TC-SVC-067 | Stop button halts execution | P1 | E2E | 1. Click stop button during execution. | POST /api/campaigns/:id/stop. Toast "Campaign Stopped". | NEW |
| TC-SVC-068 | Execution progress badge shows counts | P1 | E2E | 1. Start campaign. 2. Observe row. | Badge shows "processed/totalRecipients" with spinner. Dry run shows "(dry)". | NEW |
| TC-SVC-069 | Action button tooltips present | P1 | E2E | 1. Hover each action button. | Tooltips: "Execute Campaign", "Schedule", "Dry Run", "Upload CSV", "Stop Execution". | EXISTING (I-129 code-review only) — NEW E2E |

### 8. Campaigns Tab — Campaign Detail Dialog

| ID | Name | Priority | Type | Steps | Expected Result | Status |
|----|------|----------|------|-------|-----------------|--------|
| TC-SVC-070 | Click campaign row opens detail dialog | P0 | E2E | 1. Click a campaign row. | `[data-testid="dialog-campaign-detail"]` opens. Campaign name in title. | EXISTING (AC5 code-review only) — NEW E2E |
| TC-SVC-071 | Detail dialog shows all fields | P0 | E2E | 1. Open campaign detail. | Shows: Status (dot + label), Channel (badge), Recipients, Sent, Replied, Kill Switch state. | NEW |
| TC-SVC-072 | Detail dialog shows CSV filename when present | P2 | E2E | 1. Open detail for campaign with CSV. | CSV filename displayed with upload icon. | NEW |
| TC-SVC-073 | Detail dialog shows message template | P1 | E2E | 1. Open detail for campaign with template. | Message template shown in muted background block. | NEW |
| TC-SVC-074 | Detail dialog closes on X or outside click | P2 | E2E | 1. Open dialog. 2. Click outside or close. | Dialog closes. selectedCampaign reset. | NEW |

### 9. Campaigns Tab — Safety Card

| ID | Name | Priority | Type | Steps | Expected Result | Status |
|----|------|----------|------|-------|-----------------|--------|
| TC-SVC-080 | Campaign Safety card visible by default | P1 | E2E | 1. Clear localStorage. 2. Navigate to /service. | `[data-testid="card-campaign-safety"]` visible. Kill switch explanation text present. | EXISTING (I-128 code-review only) — NEW E2E |
| TC-SVC-081 | Dismiss button hides safety card | P1 | E2E | 1. Click `[data-testid="button-dismiss-campaign-safety"]`. | Card disappears. | EXISTING (I-128 code-review only) — NEW E2E |
| TC-SVC-082 | Dismiss persists via localStorage | P1 | E2E | 1. Dismiss card. 2. Reload page. | Card remains hidden. localStorage key "campaign-safety-dismissed" = "true". | NEW |

### 10. Campaigns Tab — Communications Paused Badge

| ID | Name | Priority | Type | Steps | Expected Result | Status |
|----|------|----------|------|-------|-----------------|--------|
| TC-SVC-085 | Communications Paused badge shown when gate OFF | P0 | E2E | 1. Set communicationGateEnabled = false. 2. Navigate to /service. | Destructive badge "Communications Paused" with PowerOff icon visible. | NEW |
| TC-SVC-086 | Badge hidden when communication gate ON | P1 | E2E | 1. Ensure communicationGateEnabled = true. 2. Navigate to /service. | No "Communications Paused" badge. | NEW |

### 11. Agents Tab

| ID | Name | Priority | Type | Steps | Expected Result | Status |
|----|------|----------|------|-------|-----------------|--------|
| TC-SVC-090 | Agents tab shows agent cards | P0 | E2E | 1. Click Agents tab. | Grid of agent cards rendered. At least 1 agent (Nancy Gaston). | EXISTING (AC7 API only) — NEW E2E |
| TC-SVC-091 | Agent card shows name, channel, status dot | P0 | E2E | 1. View agent cards. | Each card has: name text, channel text, colored status dot, avatar with Bot icon. | NEW |
| TC-SVC-092 | Agent card click navigates to /agents | P1 | E2E | 1. Click an agent card. | URL changes to /agents. selectedAgent is set. | NEW |
| TC-SVC-093 | Agent settings button opens right pane | P1 | E2E | 1. Click `[data-testid^="button-agent-settings-"]`. | Right pane opens. Click does not navigate away. | NEW |
| TC-SVC-094 | Agent card description truncated to 2 lines | P2 | E2E | 1. View agent with long description. | Description text has line-clamp-2 class. | NEW |
| TC-SVC-095 | Agents loading skeleton | P2 | E2E | 1. Visit Agents tab during data load. | 3 skeleton card placeholders visible. | NEW |

### 12. Insights Tab — Metric Tiles

| ID | Name | Priority | Type | Steps | Expected Result | Status |
|----|------|----------|------|-------|-----------------|--------|
| TC-SVC-100 | Insights tab shows 6 metric tiles | P0 | E2E | 1. Click Insights tab. | 6 tiles visible: `[data-testid="metric-tile-svm-1"]` through `metric-tile-svm-6`. | EXISTING (AC6 code-review only) — NEW E2E |
| TC-SVC-101 | Metric tiles show correct labels | P0 | E2E | 1. View Insights tab. | Labels: Active Campaigns, Messages Sent, Replies Received, Open Conversations, Total Conversations, Reply Rate. | NEW |
| TC-SVC-102 | Metric values populated from API | P0 | API+E2E | 1. Call GET /api/metrics/dashboard. 2. Compare tile values. | Tile values match campaignStats.byDepartment.service data (or fallback to top-level). Reply Rate shows percentage. | EXISTING (AC15 API only) — NEW E2E verification |
| TC-SVC-103 | Click metric tile opens detail dialog | P1 | E2E | 1. Click a metric tile. | `[data-testid="dialog-metric-detail"]` opens. Title matches tile label. Value displayed. | NEW |
| TC-SVC-104 | Metric detail dialog shows department and data source | P2 | E2E | 1. Open metric detail. | Shows "Department: Service" and "Data Source: Dashboard Metrics API". | NEW |
| TC-SVC-105 | Embedded InsightsPage renders below tiles | P1 | E2E | 1. Scroll down on Insights tab. | InsightsPage component renders (embedded mode). | NEW |

### 13. Calendar Tab

| ID | Name | Priority | Type | Steps | Expected Result | Status |
|----|------|----------|------|-------|-----------------|--------|
| TC-SVC-110 | Calendar renders month view | P0 | E2E | 1. Click Calendar tab. | Monthly calendar grid visible with day headers (Sun-Sat). Current month/year displayed. | NEW |
| TC-SVC-111 | Calendar prev/next month navigation | P1 | E2E | 1. Click next month arrow. 2. Click prev month arrow. | Month label changes. Calendar grid updates. | NEW |
| TC-SVC-112 | Click day shows appointments for that day | P1 | E2E | 1. Click a day cell. | Selected date highlighted. Appointments for that day shown (or empty state). | NEW |
| TC-SVC-113 | New appointment form opens | P0 | E2E | 1. Click "+" / new appointment button. | Form dialog with: title, customer name, phone, email, appointment type select, start/end time, notes. | NEW |
| TC-SVC-114 | Create appointment via form | P0 | API+E2E | 1. Fill form. 2. Submit. | POST /api/appointments with department="service". Appointment appears on calendar. | NEW |
| TC-SVC-115 | Appointment types available | P1 | E2E | 1. Open new appointment form. 2. Check type dropdown. | Options: Test Drive, Follow Up, Service, Consultation, General. | NEW |
| TC-SVC-116 | Appointment type color coding on calendar | P2 | E2E | 1. Create appointments of different types. | Dots on calendar use correct colors per type (blue=test_drive, amber=follow_up, green=service, purple=consultation, slate=general). | NEW |
| TC-SVC-117 | Connector sources panel (super_admin only) | P1 | E2E | 1. Login as super_admin. 2. Go to Calendar tab. | Connector panel visible with: Google Calendar, Dealer.com, Tekion. | NEW |
| TC-SVC-118 | Connector sources hidden for non-admin | P1 | E2E | 1. Login as service role. 2. Go to Calendar tab. | No connector sources panel visible. | NEW |

### 14. Calendar — Appointments API

| ID | Name | Priority | Type | Steps | Expected Result | Status |
|----|------|----------|------|-------|-----------------|--------|
| TC-SVC-120 | GET /api/appointments filters by department | P0 | API | 1. GET /api/appointments?department=service&startDate=X&endDate=Y. | Returns only service department appointments within date range. | NEW |
| TC-SVC-121 | POST /api/appointments creates appointment | P0 | API | 1. POST /api/appointments with valid data. | 201 response. Appointment returned with id. | NEW |
| TC-SVC-122 | PATCH /api/appointments/:id updates appointment | P1 | API | 1. PATCH with updated fields. | 200 response. Fields updated. | NEW |
| TC-SVC-123 | DELETE /api/appointments/:id removes appointment | P1 | API | 1. DELETE appointment. | 200 response. GET returns 404. | NEW |
| TC-SVC-124 | GET /api/appointments/:id returns single appointment | P2 | API | 1. GET by id. | Returns appointment with all fields. | NEW |

### 15. Campaign API — CRUD & Execution

| ID | Name | Priority | Type | Steps | Expected Result | Status |
|----|------|----------|------|-------|-----------------|--------|
| TC-SVC-130 | GET /api/campaigns?department=service | P0 | API | 1. GET with department filter. | Returns only service campaigns with enriched sentCount, repliedCount. | EXISTING (AC9 partial) |
| TC-SVC-131 | POST /api/campaigns creates service campaign | P0 | API | 1. POST with department=service, name, channel, messageTemplate. | 201 response. Campaign created. Activity log entry. | EXISTING (AC9) |
| TC-SVC-132 | POST /api/campaigns requires role level 3+ | P0 | API | 1. Login as service role (level > 3). 2. POST campaign. | 403 Forbidden. | NEW |
| TC-SVC-133 | POST /api/campaigns requires campaign_slots entitlement | P1 | API | 1. Login with org that lacks entitlement. 2. POST campaign. | Entitlement check fails. | NEW |
| TC-SVC-134 | PATCH /api/campaigns/:id updates campaign fields | P1 | API | 1. PATCH with { killSwitch: true }. | 200. Campaign updated. | NEW |
| TC-SVC-135 | POST /api/campaigns/:id/execute starts execution | P0 | API | 1. POST with { dryRun: false }. | Execution starts. Status trackable via execution-statuses. | NEW |
| TC-SVC-136 | POST /api/campaigns/:id/execute with dryRun=true | P1 | API | 1. POST with { dryRun: true }. | Dry run execution. No actual messages sent. | NEW |
| TC-SVC-137 | POST /api/campaigns/:id/stop halts execution | P1 | API | 1. Start execution. 2. POST stop. | Execution stopped. Status updated. | NEW |
| TC-SVC-138 | GET /api/campaigns/execution-statuses org-filtered | P1 | API | 1. GET execution statuses. | Only returns statuses for authenticated user's org. | NEW |
| TC-SVC-139 | POST /api/campaigns/:id/upload-csv processes file | P0 | API | 1. Upload valid CSV with firstName, lastName, phone columns. | Returns recipientCount. Recipients stored. | NEW |
| TC-SVC-140 | POST /api/campaigns/:id/upload-csv rejects bad CSV | P1 | API | 1. Upload CSV missing required columns. | 400 with missingRequired array. | NEW |
| TC-SVC-141 | GET /api/campaigns/:id/recipients lists recipients | P2 | API | 1. GET recipients for campaign. | Returns array of recipient records. | NEW |
| TC-SVC-142 | GET /api/campaigns/:id returns single campaign | P2 | API | 1. GET by id. | Returns campaign with sentCount, repliedCount. | NEW |

### 16. Role-Based Access Control

| ID | Name | Priority | Type | Steps | Expected Result | Status |
|----|------|----------|------|-------|-----------------|--------|
| TC-SVC-150 | Service role can access /service | P0 | E2E | 1. Login as testUsers.service. 2. Navigate to /service. | Page loads. Content visible. | EXISTING (6.2) |
| TC-SVC-151 | Sales role CANNOT access /service | P0 | E2E | 1. Login as testUsers.sales. 2. Navigate to /service. | Redirected away or access denied. Service sidebar item not visible. | NEW |
| TC-SVC-152 | Marketing role CANNOT access /service | P0 | E2E | 1. Login as testUsers.marketing. 2. Navigate to /service. | Redirected away or access denied. Service sidebar item not visible. | NEW |
| TC-SVC-153 | org_admin CAN access /service | P0 | E2E | 1. Login as testUsers.orgAdmin. 2. Navigate to /service. | Page loads normally. | NEW |
| TC-SVC-154 | executive CAN access /service | P1 | E2E | 1. Login as testUsers.executive. 2. Navigate to /service. | Page loads normally. | NEW |
| TC-SVC-155 | partner_admin CAN access /service | P1 | E2E | 1. Login as testUsers.partnerAdmin. 2. Navigate to /service. | Page loads normally. | NEW |
| TC-SVC-156 | Service sidebar item visible for service role | P1 | E2E | 1. Login as service. 2. Check sidebar. | Service icon/item present in sidebar navigation. | NEW |
| TC-SVC-157 | Service sidebar item hidden for sales role | P1 | E2E | 1. Login as sales. 2. Check sidebar. | No service sidebar item visible. | NEW |
| TC-SVC-158 | Campaign write operations require role level 3 | P0 | API | 1. Login as service (read-only). 2. Try POST/PATCH/execute. | 403 for create, update, execute, stop, upload-csv. | NEW |

### 17. Sidebar Sub-Menu

| ID | Name | Priority | Type | Steps | Expected Result | Status |
|----|------|----------|------|-------|-----------------|--------|
| TC-SVC-160 | Service submenu shows agents on hover | P0 | E2E | 1. Login as service. 2. Hover `[data-testid="sidebar-item-service"]`. | Flyout panel with agent items (`[data-testid^="panel-agent-"]`). At least 1 agent. | EXISTING (6.8) |
| TC-SVC-161 | Service submenu has sv-campaigns, not sv-dashboard | P1 | E2E | 1. Hover service sidebar. 2. Inspect submenu items. | Contains campaigns link. No dashboard label. | EXISTING (I-115 code-review only) — NEW E2E |
| TC-SVC-162 | Submenu campaign link navigates to campaigns tab | P2 | E2E | 1. Click campaigns submenu item. | Navigates to /service?tab=campaigns. | NEW |

### 18. Metrics API — Service-Specific

| ID | Name | Priority | Type | Steps | Expected Result | Status |
|----|------|----------|------|-------|-----------------|--------|
| TC-SVC-170 | GET /api/metrics/dashboard returns service breakdown | P0 | API | 1. GET /api/metrics/dashboard with auth. | Response has campaignStats.byDepartment.service with total, active, sent, replied, replyRate. | EXISTING (AC15) |
| TC-SVC-171 | Service metrics reflect real campaign data | P1 | API | 1. Create campaign. 2. GET metrics. | campaignStats.total incremented. byDepartment.service counts updated. | NEW |

### 19. Agent API — Service-Specific

| ID | Name | Priority | Type | Steps | Expected Result | Status |
|----|------|----------|------|-------|-----------------|--------|
| TC-SVC-180 | GET /api/agents?department=service returns service agents | P0 | API | 1. GET agents filtered by service. | Returns service agents. Nancy Gaston present. | EXISTING (AC7) |
| TC-SVC-181 | Nancy Gaston has valid instructions (>100 chars) | P1 | API | 1. GET agents. 2. Find Nancy. | instructions field > 100 chars. Contains "Nancy Gaston". Does not contain "Carol". | EXISTING (AC8) |
| TC-SVC-182 | Only 1 service agent (Nancy Gaston) | P1 | API | 1. GET /api/agents?department=service. | Exactly 1 agent returned. | EXISTING (AC7) |

### 20. AI Chat — Nancy Gaston Quality

| ID | Name | Priority | Type | Steps | Expected Result | Status |
|----|------|----------|------|-------|-----------------|--------|
| TC-SVC-190 | Nancy responds to recall questions | P1 | API | 1. Create conversation. 2. Send recall question to Nancy. | Response mentions recall/campaign/service/notification. | EXISTING (AC11) |
| TC-SVC-191 | Nancy helps schedule appointments | P1 | API | 1. Send appointment request to Nancy. | Response mentions schedule/appointment/book. | EXISTING (AC12) |

### 21. Cross-Cutting Concerns

| ID | Name | Priority | Type | Steps | Expected Result | Status |
|----|------|----------|------|-------|-----------------|--------|
| TC-SVC-200 | No console errors on service page | P0 | E2E | 1. Navigate to /service. 2. Switch all tabs. 3. Monitor console. | No JavaScript errors in console. | NEW |
| TC-SVC-201 | Service page responsive at mobile width | P2 | E2E | 1. Set viewport to 375px width. 2. Navigate to /service. | Content remains usable. Grid collapses to single column. | NEW |
| TC-SVC-202 | Service page responsive at tablet width | P2 | E2E | 1. Set viewport to 768px. 2. Navigate to /service. | Grid shows 2 columns for cards/tiles. | NEW |
| TC-SVC-203 | After-hours logic present in outbound code | P1 | Code | 1. Read server SMS/outbound code. | isAfterHours, businessHoursStart, businessHoursEnd, morning-followup present. | EXISTING (AC13/AC14) |
| TC-SVC-204 | Rate limit set to 100 in outbound | P1 | Code | 1. Read server/outbound.ts. | DEFAULT_RATE_LIMIT_MAX = 100. | EXISTING (I-106/107) |

---

## Coverage Summary

| Category | Total Cases | Existing (fully covered) | Existing (code-review, need E2E) | NEW |
|----------|-------------|-------------------------|----------------------------------|-----|
| Page Load & Structure | 6 | 1 (partial) | 2 | 3 |
| Tab Navigation | 6 | 0 | 0 | 6 |
| Campaigns Table | 5 | 0 | 0 | 5 |
| New Campaign Dialog | 8 | 0 | 2 | 6 |
| CSV Upload | 6 | 0 | 1 | 5 |
| Kill Switch | 4 | 0 | 0 | 4 |
| Execution Controls | 10 | 0 | 1 | 9 |
| Campaign Detail Dialog | 5 | 0 | 1 | 4 |
| Safety Card | 3 | 0 | 2 | 1 |
| Comms Paused Badge | 2 | 0 | 0 | 2 |
| Agents Tab | 6 | 0 | 0 | 6 |
| Insights / Metrics | 6 | 0 | 1 | 5 |
| Calendar Tab | 9 | 0 | 0 | 9 |
| Appointments API | 5 | 0 | 0 | 5 |
| Campaign API | 13 | 2 | 0 | 11 |
| RBAC | 9 | 1 | 0 | 8 |
| Sidebar Sub-Menu | 3 | 1 | 1 | 1 |
| Metrics API | 2 | 1 | 0 | 1 |
| Agent API | 3 | 3 | 0 | 0 |
| AI Chat Quality | 2 | 2 | 0 | 0 |
| Cross-Cutting | 5 | 2 | 0 | 3 |
| **TOTALS** | **118** | **13** | **11** | **94** |

### Priority Distribution

| Priority | Count | Description |
|----------|-------|-------------|
| P0 | 38 | Must-have. Core functionality. Blocking if broken. |
| P1 | 50 | Should-have. Important but not blocking launch. |
| P2 | 30 | Nice-to-have. Edge cases and polish. |

### Biggest Gaps (by risk)

1. **Calendar tab** — Zero existing coverage. Full CRUD + UI untested.
2. **Campaign execution controls** — E2E interaction never tested. Critical safety feature (kill switch, stop).
3. **Role-based access** — RBAC boundaries never verified in E2E. Sales/marketing accessing service is a real risk.
4. **New Campaign dialog + CSV upload** — Only code-review tests exist. No actual UI interaction tested.
5. **Tab navigation** — Never tested. URL parameter sync untested.
