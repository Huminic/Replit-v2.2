# Section-Function Map: Service Campaigns (Round 3)

**Source:** `client/src/pages/service.tsx`, API responses, prior screenshots (PE-SERVICE-CAMPAIGNS-01, PE-SERVICE-02)
**Component:** `ServicePage` at `/service`, default tab is Campaigns
**Date:** 2026-04-07
**Method:** API observation + screenshot review (MCP Playwright browsers unavailable)

---

## Top-Level Structure

| Section | Function | Description |
|---------|----------|-------------|
| Page Header | inline | Title "Service", 4-tab bar (Campaigns, Agents, Insights, Calendar) |
| Tab Switching | `setActiveTab` + URL ?tab= sync | State-based tab switching with URL parameter sync |
| CommGate Badge | inline | Destructive badge "Communications Paused" when global gate is OFF |

---

## Tab: Campaigns (default)

| Zone | UI Element | Function | Notes |
|------|-----------|----------|-------|
| Header Bar | "Service Campaigns" title | Static | Always visible |
| Header Bar | CSV Template download link | `<a href="/campaign-template.csv" download>` | Static file download |
| Header Bar | Upload CSV button | Opens file picker, triggers `csvUploadMutation` | Bulk upload |
| Header Bar | New Campaign button | Opens create dialog | `setNewCampaignOpen(true)` |
| Campaign Table | 8-column table | Campaign, Status, Channel, Recipients, Sent, Replied, Kill Switch, Actions | Data from `/api/campaigns?department=service` |
| Table Row | Campaign name + CSV filename | Click opens detail dialog | `setSelectedCampaign(campaign)` |
| Table Row | Status indicator | Colored dot + text (active/paused/draft/completed/scheduled) | `campaignStatusColors` map |
| Table Row | Channel badge | SMS/EMAIL/PHONE | Badge from `campaign.channel` |
| Table Row | Kill Switch toggle | Switch component | `killSwitchMutation` PATCH `/api/campaigns/:id` |
| Table Row | Execute button (Play icon) | IRREVERSIBLE | `executeMutation` POST `/api/campaigns/:id/execute` dryRun=false |
| Table Row | Schedule button (Calendar icon) | Opens schedule dialog | Datetime picker + execute with scheduledAt |
| Table Row | Dry Run button (Eye icon) | Safe observation | `executeMutation` with `dryRun: true` |
| Table Row | Upload CSV button (per-row) | Per-campaign CSV upload | File picker bound to campaign ID |
| Table Row | Stop button (Square icon) | Visible during execution | `stopMutation` POST `/api/campaigns/:id/stop` |
| Execution Status | Badge with progress counter | `processed/totalRecipients` | Polls `/api/campaigns/execution-statuses` every 15s |

---

## Dialogs (4 total)

| Dialog | Trigger | Fields | Actions |
|--------|---------|--------|---------|
| Create Service Campaign | "New Campaign" button | Campaign Name (text), Channels (checkboxes: SMS/Email/Phone Call), Message Template (textarea) | Create Campaign (creates one campaign per selected channel) |
| Schedule Campaign | Calendar action button | Datetime picker (min=now) | Confirm Schedule |
| Campaign Detail | Row click | Status, Channel, Recipients, Sent, Replied, Kill Switch badge, CSV File, Message Template, Recipients list | View only (includes recipient list this round) |
| Metric Detail | Service metric tile click | Metric value, department | View only |

---

## Campaign Safety Card

| Element | Function | Notes |
|---------|----------|-------|
| Amber info card | Explains kill switch + per-conversation disconnect | Dismissible, persists via localStorage |

---

## Tab: Agents

| Element | Content | Notes |
|---------|---------|-------|
| Agent cards | Grid of service AI agents | Click navigates to /agents, gear icon opens right pane |
| Nancy Gaston | Service campaign management agent | channels: chat, sms; assignedPhone: +18339785374 |
| Service Agent | Knowledge agent | channels: chat only |

---

## Tab: Insights

| Element | Content | Notes |
|---------|---------|-------|
| Service KPI tiles | 6 metric tiles | Active Campaigns, Messages Sent, Replies Received, Open Conversations, Total Conversations, Reply Rate |
| Embedded InsightsPage | Full insights component | Shares data with main Insights page |

---

## Tab: Calendar

| Element | Content | Notes |
|---------|---------|-------|
| AppointmentCalendar | Service appointment scheduling | Separate component |

---

## API Endpoints Consumed

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/campaigns?department=service` | GET | Campaign table data |
| `GET /api/metrics/dashboard` | GET | Service metrics tiles (campaignStats.byDepartment.service) |
| `GET /api/agents?department=service` | GET | Agent cards |
| `GET /api/campaigns/execution-statuses` | GET | Execution progress (polled every 15s) |
| `GET /api/campaigns/:id/recipients` | GET | Campaign detail recipient list |
| `POST /api/campaigns` | POST | Create campaign |
| `PATCH /api/campaigns/:id` | PATCH | Kill switch toggle |
| `POST /api/campaigns/:id/execute` | POST | Execute/schedule campaign (IRREVERSIBLE) |
| `POST /api/campaigns/:id/stop` | POST | Stop execution |
| `POST /api/campaigns/:id/upload-csv` | POST | CSV upload |
