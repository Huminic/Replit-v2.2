# Lane 6 — Marketing Surface Inventory (Read-Only)

**Date:** 2026-04-30
**Mode:** Hard read-only
**Scope:** Discover, inventory, and document the marketing surface area in Nexxus Connect v2.2.
**Login used:** super_admin session already active in browser (no credential entry).
**Targets walked:** `https://dev.huminicdev.com/marketing` (dev).

---

## Headline counts

| Artifact | Count |
|---|---|
| Backend marketing-specific routes | 0 dedicated; campaigns shared with Service via `?department=marketing` filter |
| Backend campaign routes (used by marketing) | 8 in `server/routes/campaigns.ts` |
| Marketing schedulers / ticks | 0 marketing-specific (campaigns share `checkScheduledCampaigns`/`processScheduledActions`) |
| Marketing-only proxy routes | 3 (`/api/fal-proxy`, `/api/fal-proxy/status`, `/api/fal-proxy/result`) + shared `/api/openai-proxy`, `/api/maps-proxy` |
| Marketing AI agents (frontend) | 5 (Photo Studio, Video Producer, Copywriter, Creative Director, Market Intel) |
| Marketing AI agents (DB seed) | 5 same as above (`server/seed.ts:459-463`) |
| Marketing tools / prompts | 7 tools (`generate_vehicle_image`, `swap_vehicle_background`, `create_vehicle_video`, `generate_voiceover`, `generate_ad_copy`, `score_ad_image`, `scan_competitor_radar`) |
| Marketing UI pages | 1 (`/marketing` with 4 internal tabs) |
| Marketing UI components | 3 (`AgentChatView`, `StudioGallery`, `SharingPanel`) |
| Marketing-relevant DB tables | 4 (`campaigns`, `campaign_recipients`, `outbound_log`, `agents`) |
| Marketing artifact storage | localStorage only (no DB table) |
| Marketing widget seed | 1 (Marketing Landing Widget — `wgt_serra_marketing_unified`, status `draft`) |

---

## Marketing routes

There are NO marketing-only HTTP routes. All "marketing" backend traffic flows through three buckets: shared `/api/campaigns/*`, marketing-only proxy routes, and shared metric/agent endpoints filtered by `department=marketing`.

| Route | Handler (file:line) | Status |
|---|---|---|
| GET `/api/campaigns?department=marketing` | `server/routes/campaigns.ts:66` | live (shared) |
| POST `/api/campaigns` | `server/routes/campaigns.ts:91` | live (entitlement-gated by `campaign_slots`) |
| GET `/api/campaigns/execution-statuses` | `server/routes/campaigns.ts:119` | live |
| GET `/api/campaigns/:id` | `server/routes/campaigns.ts:136` | live |
| PATCH `/api/campaigns/:id` | `server/routes/campaigns.ts:155` | live |
| POST `/api/campaigns/:id/execute` | `server/routes/campaigns.ts:222` | live (gated by org `outboundEnabled` / channel flags via CommGate in `server/outbound.ts`) |
| POST `/api/campaigns/:id/stop` | `server/routes/campaigns.ts:312` | live |
| GET `/api/campaigns/:id/execution-status` | `server/routes/campaigns.ts:357` | live |
| POST `/api/campaigns/:id/upload-csv` | `server/routes/campaigns.ts:379` | live |
| GET `/api/campaigns/:id/recipients` | `server/routes/campaigns.ts:527` | live |
| POST `/api/fal-proxy` | `server/routes/proxy.ts:22` | live (used by Photo Studio + Video Producer + Voiceover) |
| POST `/api/fal-proxy/status` | `server/routes/proxy.ts:58` | live |
| POST `/api/fal-proxy/result` | `server/routes/proxy.ts:88` | live |
| POST `/api/openai-proxy` | `server/routes/proxy.ts:118` | live (used by Copywriter + Creative Director) |
| POST `/api/maps-proxy` | `server/routes/proxy.ts:166` | live (used by Market Intel; falls back to mock data when `GOOGLE_MAPS_API_KEY` missing — `client/src/lib/tool-executor.ts:737-744`) |
| GET `/api/agents?department=marketing` | `server/routes/agents.ts:8` (filtered via storage) | live (storage filter `server/storage.ts:386`) |
| GET `/api/metrics/dashboard` (returns `campaignStats.byDepartment.marketing`) | `server/routes/metrics.ts:33` | live (aggregation in `server/storage.ts:758-765`) |

---

## Marketing services + schedulers

There is NO marketing-specific service or tick. Campaigns scheduling is shared. Marketing agent execution is fully client-side via proxies; backend has no agent-orchestrator for marketing.

| Function | File:line | Cadence | Status |
|---|---|---|---|
| `checkScheduledCampaigns` | `server/services/scheduler.ts:42` | every 60 s (`scheduler.ts:841`) | live; processes any campaign whose `scheduled_at` is now (department-agnostic) |
| `processScheduledActions` | `server/services/scheduler.ts:66` | every 30 s (`scheduler.ts:844`) | live; trigger-action / queued-SMS only — not used for marketing flows |
| `startCampaignExecution` (called by scheduler) | `server/outbound.ts` (imported `scheduler.ts:1`) | on-demand | live; consumes recipients, fires through CommGate |
| `runWeeklyHunches` | `server/services/scheduler.ts:847` | every 5 min (cron-gated) | live; can produce hunches with `department: 'marketing'` (`server/services/hunchService.ts:60`) |

`server/services/triggerService.ts` (855 lines) and `server/services/notificationService.ts` contain ZERO marketing-specific code paths — verified by grep.

---

## Marketing AI agents + tools (prompt summary)

All five agents are CLIENT-SIDE definitions in `client/src/lib/marketing-agents.ts`. The backend has matching DB rows seeded for activity-log/RBAC purposes, but no server-side prompt/tool execution; the client calls proxy routes directly.

| Agent | Defined at (file:line) | Tools | System-prompt summary |
|---|---|---|---|
| Photo Studio | `client/src/lib/marketing-agents.ts:69-118` | `generate_vehicle_image` (FLUX dev), `swap_vehicle_background` | "Help create and enhance vehicle photos for marketing use… Never mention API names or model names." |
| Video Producer | `marketing-agents.ts:119-171` | `create_vehicle_video` (LTX video), `generate_voiceover` (Kokoro) | "Create video content from vehicle photos and generate voiceover audio… Default duration 5 s, default quality standard." |
| Copywriter | `marketing-agents.ts:172-214` | `generate_ad_copy` (OpenAI gpt-4o-mini, 3 variations across social/email/google/display/landing) | "Write compelling automotive marketing copy that drives leads and traffic… Default 3 variations per format." |
| Creative Director | `marketing-agents.ts:215-258` | `score_ad_image` (OpenAI gpt-4o-mini vision, 0-100 scoring across 5 dims) | "Objectively evaluate marketing images and tell the team whether they are ready to publish — and exactly what to improve if not." |
| Market Intel | `marketing-agents.ts:259-298` | `scan_competitor_radar` (Google Maps proxy w/ mock fallback) | "Find, map, and analyze competing dealerships… Default radius 15 mi." |

Tool execution dispatcher: `client/src/lib/tool-executor.ts:126-153` (`executeToolCall`).

| Tool | FAL/OpenAI/Maps endpoint | Defined at (file:line) |
|---|---|---|
| `generate_vehicle_image` | `fal-ai/flux/dev` | `tool-executor.ts:156-209` |
| `swap_vehicle_background` | `fal-ai/iclight-v2` (via FAL) | `tool-executor.ts:213` (function body) |
| `create_vehicle_video` | `fal-ai/ltx-video-v095/image-to-video` | `tool-executor.ts:353` |
| `generate_voiceover` | `fal-ai/kokoro/american-english` | `tool-executor.ts:413-461` |
| `generate_ad_copy` | OpenAI `gpt-4o-mini` (json_object response_format) | `tool-executor.ts:474-558` |
| `score_ad_image` | OpenAI `gpt-4o-mini` w/ vision input | `tool-executor.ts:576-675` |
| `scan_competitor_radar` | Google Maps Places API; mock fallback `generateMockCompetitors` | `tool-executor.ts:687-770`, mock at `:677-685` |

---

## Marketing UI pages + components

| Path | Component (file:line) | Tabs / Sections | Screenshot | Status |
|---|---|---|---|---|
| `/marketing` (Dashboard) | `client/src/pages/marketing.tsx:55` (default export `MarketingPage`) | Dashboard, Agents, Studio, Insights | `evidence/stabilization-sprint-2026-04-30/lane-6-screenshots/marketing-dashboard-tab.png` | live (read-only banner enforced) |
| `/marketing?tab=studio` | `marketing.tsx:196` (`renderStudio`) → `StudioGallery` | category pills (All/Images/Videos/Copy/Scores/Voiceovers/Radar) | `lane-6-screenshots/marketing-studio-tab.png` | live but observed flicker — see Observations |
| `/marketing?tab=insights` | `marketing.tsx:219` (`renderInsights`) → `<InsightsPage embedded />` | reuses `client/src/pages/insights.tsx` | `lane-6-screenshots/marketing-insights-tab.png` | live; embeds full Insights page |
| `/marketing?tab=agents&agent=<id>` | `marketing.tsx:244` mounts `AgentChatView` | per-agent chat | not captured (page redirected to `/teambox` mid-load — see Observations) | live in code; UI walk hit a redirect |
| Marketing submenu | `client/src/components/layout/SubMenuManager.tsx:592-632` | Dashboard / Studio / Insights + AI Agents list | (visible in dashboard screenshot) | live |

| Component | File:line | Purpose |
|---|---|---|
| `AgentChatView` | `client/src/components/marketing/AgentChatView.tsx:285` | Per-agent chat shell; renders inline ad copy, score cards, animated bars, competitor radar; default export |
| `StudioGallery` | `client/src/components/marketing/StudioGallery.tsx:43` | Lists artifacts saved to localStorage; filterable by type |
| `SharingPanel` | `client/src/components/marketing/SharingPanel.tsx:20` | Share-artifact UI (open/onClose) |
| Inline cards inside chat | `AgentChatView.tsx:64-283` | `InlineAdCopy`, `AnimatedScoreCircle`, `AnimatedBar`, `InlineScoreCard`, `StarRating`, `InlineCompetitorRadar` |

RBAC for `/marketing` section permission: `client/src/lib/rbac.ts:8-15` — visible to super_admin, partner_admin, org_admin, executive, marketing roles. Marketing role is restricted to `['ai-chat', 'teambox', 'marketing']` only (`rbac.ts:15`).

---

## Marketing DB tables / columns

There is no marketing-only table. Department differentiation is a single `department TEXT` column on shared tables.

| Table | Columns relevant to marketing | Purpose |
|---|---|---|
| `campaigns` | `department TEXT default 'sales'` (`shared/schema.ts:125`); `name`, `status`, `channel`, `messageTemplate`, `sendIntervalSeconds`, `recipientCount`, `sentCount`, `repliedCount`, `executionStatus`, `executionTotal/Processed/Sent/Failed`, `killSwitch`, `scheduledAt`, `csvFilename` | Holds marketing AND service AND sales campaigns; differentiated only by `department`. Indexed by `idx_campaigns_dept` (`schema.ts:147`). |
| `campaign_recipients` | `campaignId` FK, `firstName`, `lastName`, `phone`, `email`, `vin`, `vehicleModel`, `vehicleYear`, `status`, `sentAt`, `deliveredAt` | Recipient list per campaign (`schema.ts:217-233`) |
| `outbound_log` | `campaignId`, `recipientId`, `channel`, `status`, `blockedReason`, `messageContent`, `sentAt` | Records every send attempt incl. blocked ones (`schema.ts:235-251`) |
| `agents` | `department TEXT` (`schema.ts:64`), indexed `idx_agents_dept` (`schema.ts:83`); `name`, `description`, `instructions`, `vapiAssistantId`, `tavusPersonaId`, `triggers JSONB` | The 5 marketing agents are seeded as DB rows for activity logging + RBAC count. Their actual prompts/tools live client-side. |
| `hunches` | `department TEXT` (`schema.ts:289`) — can be `'marketing'` per `hunchService.ts:60` | Cross-domain insight engine; marketing slice exists but no marketing-only producer logic |
| `widgets` | `type` includes `unified` for marketing landing pages (seed `server/seed.ts:56`); `widgetCode='wgt_serra_marketing_unified'` | One marketing widget seeded as `draft` |

**No tables for:** marketing artifacts (images, videos, copy, scores, radar maps), agent sessions, marketing audiences, segments, or media assets. Artifacts and sessions are stored in browser `localStorage` keyed `nexxus_marketing_artifacts_<userId>` / `nexxus_marketing_sessions_<userId>` (`marketing-agents.ts:316-322`, `:402-415`). Maximum 50 artifacts and 30 sessions per browser (`marketing-agents.ts:334`, `:380`).

---

## Differentiation — marketing vs service-campaign vs trigger

| Dimension | Marketing campaign | Service campaign | Trigger follow-up |
|---|---|---|---|
| Storage row | `campaigns` row, `department='marketing'` | `campaigns` row, `department='service'` | NOT in `campaigns`. Lives as `triggers JSONB` column on `agents` (`schema.ts:77`) |
| Audience source | CSV upload via `POST /api/campaigns/:id/upload-csv` | Same CSV upload route | Inferred from `warehouse_leads` rows synced from VIN Solutions |
| Channel | `sms`/`email`/`both` (campaign-level field) | Same | Per-trigger config |
| Execution path | `startCampaignExecution → processOutboundSend → CommGate → Resend/TextMagic` | Same code path | `triggerService.ts → executeTriggerAction → processOutboundSend` |
| Templating | `messageTemplate` field; campaigns use double-brace `{{token}}` substitution; service campaigns may also use single-brace per comment at `outbound.ts:876` | Same template engine | Per-trigger `messageTemplate` field on trigger config |
| Launch gating (Apr 27) | Hidden behind v2.3-preview banner at `client/src/pages/marketing.tsx:225-241`; CommGate / `outbound_enabled` still authoritative | ENABLED for Serra Honda only at launch (per CLAUDE.md "Service-campaign launch rule") | ENABLED across stores per existing CommGate flags |
| Visible in UI | `/marketing` Agents+Studio (creative tools); campaigns themselves are NOT exposed in the marketing UI in Wave 1 — there's no campaigns list/create page on `/marketing` | `/service` page (Lane 5 scope) | Triggers configured in agent config UI |
| Insights / metrics | `campaignStats.byDepartment.marketing` aggregated in `storage.ts:758-765`; consumed by `marketing.tsx:85-93` | Same aggregation at `byDepartment.service` | Trigger sends count toward `outbound_sent` via `outbound_log` |

The "Marketing" section in v2.2 is therefore primarily a **creative-tools surface** (5 AI agents producing images/videos/copy/scores/competitor maps). The campaign-execution machinery exists in code and the schema, but is not surfaced anywhere in the marketing UI for Wave 1 — there is no Campaigns tab / create-campaign / list-recipients view rooted at `/marketing`. (Campaigns CAN be created/listed against `department='marketing'` via the API, but no UI hits those endpoints from the marketing page.)

---

## Gap list

1. **No marketing-campaign UI.** The `/marketing` page has Dashboard / Agents / Studio / Insights tabs. There is NO tab to list, create, edit, schedule, or monitor marketing campaigns. `tests/e2e/s5-marketing.spec.ts:124-125` asserts the Campaigns nav item is intentionally absent. Source of truth for campaign management is the API layer only. (`client/src/pages/marketing.tsx:40-45`)

2. **No marketing-campaign analytics on /marketing dashboard.** The Dashboard tab tiles read `campaignStats.byDepartment.marketing` but show zeros for Serra Honda (verified in screenshot — "Campaigns Active: 0", "Messages Sent: 1", "Replies Received: 0"). No drill-down, no per-campaign chart, no time-series. `marketing.tsx:86-93`.

3. **Studio artifacts are localStorage-only.** Generated images, videos, copy, scores, radar maps live entirely in `localStorage` (`client/src/lib/marketing-agents.ts:316-355`). Capped at 50 artifacts per browser. Cleared on browser data wipe. No DB persistence, no cross-device sync, no team sharing despite `SharingPanel` component being present (`SharingPanel.tsx`).

4. **Marketing AI agent prompts are client-only.** All system prompts live in `client/src/lib/marketing-agents.ts`. They are NOT in the DB (`agents` rows have empty `instructions`/`autoGreeting` for marketing per seed `server/seed.ts:179`). The DB rows are scaffold only. Edits to prompts require a code deploy.

5. **Photo Studio FE/FAL integration issue (I-102).** Documented inline at `client/src/pages/marketing.tsx:242-243` — image generation requests may fail on the frontend; tracked in issues.md as I-102. Not fixed.

6. **Marketing module gated by external dependency.** Operator notes in `docs/prd-nexxus-v2.2-2026-04-24.md:177` and `:308` — "backend partially built; no API logins yet so it doesn't have data to operate on" and "waiting on dealer marketing API logins to operate." This is a process/data debt, not a code stub.

7. **Marketing Landing Widget seeded as `draft`.** `server/seed.ts:56` — `wgt_serra_marketing_unified` exists but is not active. No content management for marketing landing pages anywhere in the UI.

8. **Maps API not configured → silent demo data.** `tool-executor.ts:737-744` — when `GOOGLE_MAPS_API_KEY` is missing, Market Intel agent returns deterministic mock competitors (`generateMockCompetitors`) WITHOUT clearly flagging "demo" in the chat content beyond a small `isDemo: true` field. User-visible label: "(demo data)" appears in the summary at `:759`, but the `actionChips` and downstream UI don't differentiate.

9. **OpenAI used directly from client through proxy.** `tool-executor.ts:388-411` posts to `/api/openai-proxy` which forwards verbatim to OpenAI. No central rate limit or cost tracking visible for marketing-specific usage; only billing-event emission for fal (`server/routes/proxy.ts:42-49`) — OpenAI usage is NOT billed/metered here.

10. **No marketing-specific scheduler tick.** Triggers, daily recap, weekly reports, scheduled campaigns each have a tick. There is no marketing tick (e.g., for periodic competitor refresh, social-post drafts, or audience nurture). All marketing AI work is interactive and on-demand.

11. **Marketing dashboard tile change/trend removed (I-113).** Comment at `marketing.tsx:87-88` — "change/trend fields removed — backend has no change data for marketing metrics." Tiles intentionally show no delta. Test at `tests/e2e/s5-marketing.spec.ts:128-138` enforces this.

12. **Marketing agent rows have no triggers / phone / Vapi / Tavus.** `server/seed.ts:178-179` shows `assignedPhone: null, vapiAssistantId: null, tavusPersonaId: null` for Serra Honda's marketing agent. They are knowledge-only chat agents with no inbound channel. Hyundai of Columbia has Elizabeth seeded WITH phone+VAPI+Tavus (`seed.ts:145, 448`) but that org doesn't ship enabled at launch.

13. **Sub-menu navigation instability.** Direct navigation to `https://dev.huminicdev.com/marketing?tab=agents` and `?tab=studio` and clicking the in-page Agents tab caused redirects to `/teambox`, `/sales?tab=dashboard`, and `/service` during Playwright walk. (See Observations.) Functional bug — at minimum the URL→tab restoration logic (`marketing.tsx:67-79`) interacts badly with `SubMenuManager` redirects.

---

## Recommended marketing roadmap (top 5, coherent product order)

1. **Persist marketing artifacts to DB.** Add `marketing_artifacts` table keyed by `(organization_id, user_id, agent_id, session_id, artifact_id)` with `type`, `media_url`, `metadata JSONB`, `created_at`. Migrate localStorage to DB on first open. Unblocks team sharing (the existing `SharingPanel` component), cross-device, and the operator's stated "lead source ROI" / "campaign performance" reporting promise.

2. **Add marketing-campaign UI.** Surface a "Campaigns" tab on `/marketing` that uses the existing `/api/campaigns?department=marketing` endpoints — list, create, schedule, upload CSV, monitor execution. The backend is fully built; only the UI glue is missing. (Service section already does this.) Gate behind the existing v2.3-preview banner if pre-launch.

3. **Move marketing-agent prompts into DB.** Populate `agents.instructions` for each of the 5 marketing agents via seed/migration. Introduce a server-side proxy that hydrates the system prompt from the DB at chat time, instead of shipping prompts in `client/src/lib/marketing-agents.ts`. Lets operator iterate without a deploy.

4. **Resolve Photo Studio I-102 + add `GOOGLE_MAPS_API_KEY` to dev/prod.** The two highest-impact agent-level fixes. Photo Studio is the entry point of the creative funnel; Market Intel currently shows demo data when the key is missing — a believable but fake competitor list could mislead users.

5. **Marketing-source health hunches.** Per `docs/strategy/customer-call-strategy-2026-04-24.md:51, 222, 292`, the operator wants "marketing source drift detection" — already-existing `hunchService.ts` supports `department='marketing'`. Wire a producer that compares lead-source counts week-over-week and emits hunches when a source drops by N%. Reuses existing `hunches` table + UI; no new schema.

---

## Observations (incidental findings, surprises)

1. **The marketing surface is mostly client-side.** The 5 agents, their prompts, their tools, their orchestration, and their artifact storage all live in `client/src/lib/marketing-agents.ts` + `client/src/lib/tool-executor.ts`. The server's marketing footprint is essentially: campaign endpoints (shared with service/sales), three FAL proxy routes, and read-only metric aggregations. This is unusual for a product whose differentiator is "AI agents" — there is no agent state machine on the server.

2. **Tab-based navigation on /marketing is fragile in dev.** During the read-only walk, navigating to `/marketing?tab=agents` redirected to `/teambox`; clicking the in-page Agents tab redirected to `/service`. Reproducible. Source: most likely an interaction between `SubMenuManager.tsx` (which sets location based on detected route) and the `?tab=` query-param effect in `marketing.tsx:67-79`. The Dashboard, Studio (briefly), and Insights tabs DID render correctly. Worth a stabilization ticket.

3. **The "Marketing is in v2.3 preview" banner is asserted by a launch-readiness Playwright spec.** `client/src/pages/marketing.tsx:225-241` carries explicit instructions not to remove or rephrase it because `tests/e2e/s99-codex-launch-readiness-readonly.spec.ts` requires the keywords "v2.3" and "preview". Anyone editing marketing copy must coordinate with that spec. Banner correctly labels the section as read-only / outbound-disabled — defense in depth on top of CommGate.

4. **Hyundai of Columbia has the only voice/video-enabled marketing agent in seed data.** `server/seed.ts:145, 448` — Elizabeth has a real phone number, VAPI assistant ID, and Tavus persona ID. Serra Honda's marketing agent is chat-only, knowledge-only (`seed.ts:179`). For launch (Serra Honda only enabled), the marketing surface is therefore definitely "creative tools + insights only" — no inbound calls/video are configured.

5. **Mock competitor data is convincing.** `tool-executor.ts:677-685` returns deterministic but plausible-looking dealerships ("Premier Auto Group", "Capitol City Motors", etc.). When Maps API is missing the user sees this without a strong "DEMO" stamp on the radar visualization itself — only the summary line says "(demo data)". Easy to miss in a demo. Consider a watermark on the radar UI.

6. **No marketing data appears in dashboard despite seeded campaign.** Seed includes "Presidents Day Sale" (`seed.ts:515`) with `department='marketing'`, `status='completed'`, `recipientCount: 892`. Yet the screenshot shows "Campaigns Active: 0, Messages Sent: 1, Replies Received: 0". The dashboard counts only `active` campaigns and `sent` recipients — completed historical campaigns don't surface. Operator may want a separate "completed/historical" tile or filter.

7. **The `agents` table holds DB rows for the 5 marketing agents, but those rows do nothing at runtime.** They're queried by `SubMenuManager` to populate the agent list (`SubMenuManager.tsx:116`), and they count toward the `agent_slots` entitlement, but the actual prompts/tools are sourced from `MARKETING_AGENTS` constant on the client. The DB rows and the constant are independent sources of truth — drift risk.

8. **`scoreCardData.publish_ready` derived twice.** `tool-executor.ts:612` instructs the LLM to set `publish_ready: <true if overall_score >= 75>`, but downstream UI re-derives from `overall_score >= 75` independently (`AgentChatView.tsx` and `tool-executor.ts:644`). Harmless but a small consistency smell.

9. **Marketing role permissions are unusually narrow.** `client/src/lib/rbac.ts:15` — the `marketing` user role only sees `['ai-chat', 'teambox', 'marketing']`. They cannot see Sales, Service, Insights, Management, or Settings. Combined with the missing campaign UI on `/marketing`, a marketing-role user has access only to agents, studio, embedded insights — and CANNOT create or manage campaigns from the UI.

10. **Sales-style metrics rendered inside Marketing → Insights.** `/marketing?tab=insights` mounts `<InsightsPage embedded />` (`marketing.tsx:219-221`). The screenshot shows Sales-pipeline metrics ("New Leads: 38", "Active Pipeline: 187", "Sold: 6"). This is a pipeline view, not a marketing-attribution view. Marketing-specific category filter exists in `client/src/pages/insights.tsx:407` but the embedded layout doesn't apply it by default. Likely confusing for the marketing role.

---

## Files cited (absolute paths)

- `/home/ubuntu/Claude-store/nexxus2.2_replit/client/src/pages/marketing.tsx`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/client/src/lib/marketing-agents.ts`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/client/src/lib/tool-executor.ts`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/client/src/lib/rbac.ts`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/client/src/components/marketing/AgentChatView.tsx`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/client/src/components/marketing/StudioGallery.tsx`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/client/src/components/marketing/SharingPanel.tsx`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/client/src/components/layout/SubMenuManager.tsx`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/client/src/components/layout/Sidebar.tsx`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/client/src/pages/insights.tsx`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/server/routes/campaigns.ts`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/server/routes/proxy.ts`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/server/routes/agents.ts`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/server/routes/metrics.ts`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/server/services/scheduler.ts`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/server/services/hunchService.ts`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/server/outbound.ts`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/server/storage.ts`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/server/seed.ts`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/shared/schema.ts`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/tests/e2e/s5-marketing.spec.ts`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/docs/prd-nexxus-v2.2-2026-04-24.md`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/docs/strategy/customer-call-strategy-2026-04-24.md`

## Screenshots captured

- `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-04-30/lane-6-screenshots/marketing-dashboard.png` — pre-click landing (TeamBox view from auto-redirect)
- `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-04-30/lane-6-screenshots/marketing-dashboard-tab.png` — Marketing Dashboard with v2.3 preview banner + 4 metric tiles + agent submenu
- `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-04-30/lane-6-screenshots/marketing-studio-tab.png` — Studio loading state (TeamBox-shaped skeleton, see Observation 2)
- `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-04-30/lane-6-screenshots/marketing-insights-tab.png` — Embedded Insights inside Marketing (Sales-style pipeline, see Observation 10)
- `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-04-30/lane-6-screenshots/marketing-agents-tab.png` — Mid-redirect loading state captured during agent-tab navigation instability (see Observation 2)
