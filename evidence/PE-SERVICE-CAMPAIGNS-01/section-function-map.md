# Section-Function Map: Service Campaigns

**Source:** `client/src/pages/service.tsx` (849 lines), `server/routes/campaigns.ts` (518 lines), `server/outbound.ts`
**Component:** `ServicePage` — at `/service`, default tab is Campaigns
**Date:** 2026-04-06

---

## Top-Level Structure

| Section | Function | Description |
|---------|----------|-------------|
| Page Header | inline | Title "Service", 4-tab bar (Campaigns, Agents, Insights, Calendar) |
| Tab Switching | `setActiveTab` | State-based tab switching + URL ?tab= sync |
| CommGate Badge | inline | Destructive badge "Communications Paused" when global gate is OFF |

---

## Tab: Campaigns (`renderCampaigns`)

| Zone | UI Element | Function | Notes |
|------|-----------|----------|-------|
| Header Bar | "Service Campaigns" title | — | Always visible |
| Header Bar | CSV Template download link | `<a href="/campaign-template.csv" download>` | Static file download |
| Header Bar | Upload CSV button | Opens file picker, triggers `csvUploadMutation` | Bulk upload to campaign or new |
| Header Bar | New Campaign button | Opens create dialog | `setNewCampaignOpen(true)` |
| Campaign Table | Table with 8 columns | Campaign, Status, Channel, Recipients, Sent, Replied, Kill Switch, Actions | `serviceCampaigns` from `/api/campaigns?department=service` |
| Table Row | Campaign name + CSV filename | Click opens detail dialog | `setSelectedCampaign(campaign)` |
| Table Row | Status indicator | Colored dot + text (active/paused/draft/completed/scheduled) | `campaignStatusColors` map |
| Table Row | Channel badge | SMS/EMAIL/PHONE | Badge from `campaign.channel` |
| Table Row | Kill Switch toggle | Switch component | `killSwitchMutation` PATCH `/api/campaigns/:id` |
| Table Row | Actions: Execute | Play button | `executeMutation` POST `/api/campaigns/:id/execute` |
| Table Row | Actions: Schedule | Calendar button | Opens schedule dialog with datetime picker |
| Table Row | Actions: Dry Run | Eye button | `executeMutation` with `dryRun: true` |
| Table Row | Actions: Upload CSV | Upload button | Per-campaign CSV upload |
| Table Row | Actions: Stop | Square button (during execution) | `stopMutation` POST `/api/campaigns/:id/stop` |
| Execution Status | Badge with progress | `processed/totalRecipients` counter | Polls `/api/campaigns/execution-statuses` every 3s |

---

## Dialogs (4 total)

| Dialog | Trigger | Content | Actions |
|--------|---------|---------|---------|
| New Campaign | "New Campaign" button | Name input, channel checkboxes (SMS/Email/Phone), message template textarea | Create (one campaign per selected channel) |
| Schedule Campaign | Calendar action button | Datetime picker (min=now) | Confirm schedule |
| Campaign Detail | Row click | Status, channel, recipients, sent, replied, kill switch badge, CSV filename, message template | View only |
| Metric Detail | Service metric tile click | Metric value, department, data source | View only |

---

## Campaign Safety Card

| Element | Function | Notes |
|---------|----------|-------|
| Safety info card | Explains kill switch and per-conversation disconnect | Amber-themed, dismissible via X button |
| Dismiss persistence | `localStorage.setItem('campaign-safety-dismissed', 'true')` | Persists across sessions |

---

## API Endpoints Consumed (Campaigns)

| Endpoint | Method | Used By | Auth | Notes |
|----------|--------|---------|------|-------|
| `GET /api/campaigns?department=service` | GET | Campaign table | Token | Returns enriched list with sentCount, repliedCount |
| `POST /api/campaigns` | POST | New Campaign dialog | Token + Role 3+ | Creates campaign with name, department, channel, template |
| `PATCH /api/campaigns/:id` | PATCH | Kill switch toggle | Token + Role 3+ | Updates killSwitch field |
| `POST /api/campaigns/:id/execute` | POST | Execute/Schedule buttons | Token + Role 3+ | Starts execution (immediate or scheduled), supports dryRun |
| `POST /api/campaigns/:id/stop` | POST | Stop button | Token + Role 3+ | Stops in-progress execution |
| `POST /api/campaigns/:id/upload-csv` | POST | CSV upload buttons | Token + Role 3+ | Multipart form, parses CSV, creates recipients |
| `GET /api/campaigns/execution-statuses` | GET | Execution progress badge | Token | Polled every 3s during execution |
| `GET /api/campaigns/:id/recipients` | GET | (available but not used in service.tsx) | Token | Returns recipient list |
| `GET /api/metrics/dashboard` | GET | Service metrics tiles | Token | Campaign stats by department |

---

## Backend: CSV Upload Flow (`server/routes/campaigns.ts`)

| Step | Action | Validation |
|------|--------|------------|
| 1 | File upload via multer | Max 5MB, stored in tmpdir |
| 2 | Parse CSV headers | Match against 13 expected columns with aliases |
| 3 | Validate required columns | First Name, Last Name, Home Phone, Email Address required (but relaxed: needs at least phone OR email) |
| 4 | Parse rows | Simple comma split (no quoted-field support in row parsing despite header parser) |
| 5 | Create recipients | Bulk insert via `storage.createRecipients()` |
| 6 | Update campaign | Sets recipientCount and csvFilename |
| 7 | Return response | recipientCount, columnsMatched, warnings for missing columns |

---

## Backend: Execution Flow (`server/outbound.ts`)

| Step | Action | Gates |
|------|--------|-------|
| 1 | Check kill switch | If active, execution blocked (403) |
| 2 | Start execution | `startCampaignExecution(campaignId, orgId, dryRun)` |
| 3 | Progress polling | Frontend polls execution-statuses every 3s |
| 4 | Stop (optional) | `stopCampaignExecution(campaignId)` |

---

## Downstream: TeamBox Continuity

| Flow | Description | Surface |
|------|-------------|---------|
| Campaign -> Conversation | When a recipient replies, a conversation is created with `campaignId` set | TeamBox conversation list |
| Campaign filter in TeamBox | **MISSING** — PE-TEAMBOX-01 BUG: No filter exists to find conversations by campaign | TeamBox filters |
| Kill Switch -> Conversation | Kill switch stops outbound but existing conversations remain open | TeamBox continues normally |
| Per-conversation disconnect | Mentioned in safety card but implementation not verified | TeamBox conversation detail |
