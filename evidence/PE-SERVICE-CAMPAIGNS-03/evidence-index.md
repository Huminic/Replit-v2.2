# Evidence Index: PE-SERVICE-CAMPAIGNS-03

**Date:** 2026-04-07
**Method:** API observation + code review + prior screenshot review
**Note:** MCP Playwright browser contexts were unavailable (dead). Evidence gathered via direct API queries and review of prior eval screenshots.

---

## API Evidence (collected this session)

| ID | Source | Content | File |
|----|--------|---------|------|
| API-01 | GET /api/campaigns?department=service | 3 campaigns: Vehicle Merge Test (draft), Service Reminder - February (active), Oil Change Reminder (paused) | Inline in workflow-audit.log |
| API-02 | GET /api/metrics/dashboard | Service stats: 3 total, 1 active, 0 sent, 0 replied, 0% reply rate | Inline in workflow-audit.log |
| API-03 | GET /api/agents?department=service | 2 agents: Nancy Gaston (+18339785374, chat+sms), Service Agent (chat) | Inline in workflow-audit.log |
| API-04 | GET /api/campaigns/execution-statuses | 1 completed dry run (campaign f3684500, 1/1 sent, dryRun=true) | Inline in workflow-audit.log |
| API-05 | GET /api/campaigns/.../recipients | Service Reminder: 16 recipients (with duplicates), Merge Test: 1, Oil Change: 0 | Inline in workflow-audit.log |
| API-06 | GET /api/conversations?channel=sms | 3 SMS conversations, none with campaignId | Inline in workflow-audit.log |
| API-07 | GET /api/organizations/... | Serra Honda: communicationGateEnabled=null, textmagicPhone=+18338935694 | Inline in workflow-audit.log |

---

## Screenshot Evidence (from prior evals, referenced)

| ID | Source | Content | File |
|----|--------|---------|------|
| SS-01 | PE-SERVICE-02 | Service Campaigns overview (2 campaigns) | evidence/PE-SERVICE-02/screenshots/01-service-campaigns-overview.png |
| SS-02 | PE-SERVICE-02 | Campaign detail modal (Service Reminder - February) | evidence/PE-SERVICE-02/screenshots/02-campaign-detail-modal.png |
| SS-03 | PE-SERVICE-CAMPAIGNS-01 | Full service page with campaign list | evidence/PE-SERVICE-CAMPAIGNS-01/screenshots/03-service-page-full.png |
| SS-04 | PE-SERVICE-CAMPAIGNS-01 | New Campaign dialog | evidence/PE-SERVICE-CAMPAIGNS-01/screenshots/04-new-campaign-dialog.png |
| SS-05 | PE-SERVICE-CAMPAIGNS-01 | Agents tab showing Nancy Gaston | evidence/PE-SERVICE-CAMPAIGNS-01/screenshots/07-agents-tab.png |
| SS-06 | PE-SERVICE-CAMPAIGNS-01 | Campaign detail view (with kill switch) | evidence/PE-SERVICE-CAMPAIGNS-01/screenshots/06-campaign-detail-view.png |
| SS-07 | PE-SERVICE-CAMPAIGNS-01 | TeamBox SMS channel | evidence/PE-SERVICE-CAMPAIGNS-01/screenshots/11-teambox-sms-channel.png |

---

## Code Evidence

| ID | File | Content |
|----|------|---------|
| CODE-01 | client/src/pages/service.tsx | Full campaign table with 8 columns, 4 action buttons per row, kill switch toggle |
| CODE-02 | client/src/pages/service.tsx | Execute mutation: POST /api/campaigns/:id/execute with dryRun flag — NO confirmation dialog |
| CODE-03 | client/src/pages/service.tsx | Create campaign dialog: name, channels checkboxes, message template |
| CODE-04 | client/src/pages/service.tsx | CommGate badge: `!communicationGateEnabled` shows "Communications Paused" |

---

## Limitations

1. No fresh screenshots taken this session — MCP Playwright browser contexts were dead (Target page, context or browser has been closed)
2. Selenium unavailable on aarch64 platform
3. Chromium snap cannot write screenshots to accessible filesystem paths
4. All visual evidence is from PE-SERVICE-CAMPAIGNS-01 (2026-04-06) and PE-SERVICE-02 — one day old, code unchanged since
