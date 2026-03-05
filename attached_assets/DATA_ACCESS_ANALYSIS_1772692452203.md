# Nexxus V2 — Data Access Analysis
**Generated:** 2026-02-18
**Source:** API Probe v2 Results (live endpoint testing against Serra Honda, dealerId 21043)

---

## Table 1: Endpoints We HAVE Access To

### VIN Solutions (13 distinct endpoints, 18 successful calls)

| Endpoint | Business Value | Fields Available | Value |
|----------|---------------|------------------|-------|
| **Leads** (list + detail) | Core pipeline data. Every lead in the CRM with current status, source, type, creation date. This is the foundation for pipeline health, lead aging, and sales performance tracking. | `leadId`, `dealerId`, `contact` (URL→contactId), `coBuyerContact`, `leadSource` (URL→sourceId), `leadStatus` (38 granular values), `leadStatusType` (ACTIVE/SOLD/LOST/BAD/COMPLETE), `leadType` (10 types), `leadGroupCategory` (NEW/WAITING/CONTACTED), `createdUtc`, `isHot`, `isOnShowroom`, `vehiclesOfInterest[]`, `tradeVehicles[]` | **HIGH** |
| **Lead Statuses** (reference) | Maps all 38 possible lead statuses (e.g. ACTIVE_NEW_LEAD, SOLD_ON_ORDER, LOST_LEAD_PROCESS_COMPLETED). Essential for understanding pipeline stage definitions and building accurate status-based metrics. | 38 string values — the complete taxonomy of lead lifecycle stages | **HIGH** |
| **Lead Sources** (reference) | Maps every origination channel (website, walk-in, phone, referral, etc.) with unique IDs. Critical for attribution analysis — understanding which channels generate the most and best leads. | `leadSourceId`, `leadSourceName`, paginated (10+ pages for Serra Honda) | **HIGH** |
| **Lead Types** (reference) | Classifies leads by engagement type. Enables segmentation of pipeline by how leads arrived (digital vs physical vs phone). | 10 values: INTERNET, WALK_IN, PHONE, IMPORT, PARTS_ORDER, SERVICE, WEBSITE_CHAT, WHOLESALE, REFERRAL, PREVIOUS_CUSTOMER | **HIGH** |
| **Lead Status Types** (reference) | The 5 macro-level pipeline stages. The primary grouping for pipeline health dashboards and funnel analysis. | 5 values: ACTIVE, SOLD, LOST, BAD, COMPLETE | **HIGH** |
| **Lead Group Categories** (reference) | Engagement-level grouping within active leads. Shows whether leads have been contacted, are waiting, or are brand new. Directly measures response gap. | 3 values: NEW, WAITING, CONTACTED | **HIGH** |
| **Vehicles of Interest** (per lead) | Full vehicle detail for what customers are shopping. Enables inventory-to-demand matching, popular model tracking, and pricing analysis. | `year`, `make`, `model`, `trim`, `vin`, `doors`, `driveTrain`, `bodyStyle`, `interiorColor`, `exteriorColor`, `stockNumber`, `inventoryType` (NEW/USED), `mileage`, `sellingPrice`, `msrp`, `cost`, `mpg` (city/hwy), `engineName`, `invoice`, `downPaymentRequested`, `monthlyPaymentRequested`, `paymentMethod` | **HIGH** |
| **CRM Users** (roster) | Complete dealership staff roster from VIN. Maps users to roles, groups, and access levels. Foundation for per-salesperson performance metrics and lead assignment analysis. | `UserId`, `FullName`, `FirstName`, `LastName`, `EmailAddress`, `UserGroup` (e.g. "01- Admin", "12- Orphan"), `UserTypes[]`, `IlmAccess` (Admin/Manager/SalesPerson) | **HIGH** |
| **User Detail** (single) | Individual CRM user profile. Enables linking salesperson-specific performance when cross-referencing with lead assignments. | Same fields as roster, single record | **MEDIUM** |
| **Organization Dealers** | Lists all dealerships under the account. Enables multi-store comparisons and org-level rollups. | `DealerId`, `Name`, `City`, `State` — 7 dealerships visible | **MEDIUM** |
| **Vehicle Years** (catalog) | Reference list of all model years (1981-2027). For building vehicle selection UI and validating interest data. | 47 year values | **LOW** |
| **Vehicle Makes** (catalog) | Reference list of all manufacturers per year. For building vehicle selection UI and market analysis. | 49 make values (for 2025) | **LOW** |
| **VIN Decode** | Decode a VIN number to vehicle specifications. Enables validating customer trade-ins or enriching inventory data from VIN numbers captured during calls. | Returns items array (decode results) | **MEDIUM** |

### VAPI (15 distinct endpoints)

| Endpoint | Business Value | Fields Available | Value |
|----------|---------------|------------------|-------|
| **Calls** (list + detail) | Every voice AI interaction with full transcript, recording, cost, and AI-generated analysis. The primary data source for voice agent performance, customer sentiment, and call quality metrics. | `id`, `assistantId`, `phoneNumberId`, `type` (inbound/outbound), `startedAt`, `endedAt`, `transcript` (full text), `recordingUrl`, `stereoRecordingUrl`, `summary` (AI-generated), `cost`, `customer` {number, sipUri}, `status`, `endedReason` (customer-ended-call, assistant-ended-call, etc.), `messages[]` (conversation turns), `costBreakdown` {transport, stt, llm, tts, vapi, chat, total, llmPromptTokens, llmCompletionTokens, llmCachedPromptTokens, ttsCharacters, analysisCostBreakdown, knowledgeBaseCost, voicemailDetectionCost}, `analysis` {summary, successEvaluation}, `artifact` {recordingUrl, performanceMetrics, scorecards, transfers, pcapUrl, logUrl, nodes, variables}, `costs[]` (7 individual cost items), `monitor` {listenUrl, controlUrl}, `transport` {provider, conversationType} | **HIGH** |
| **Analytics** (aggregated) | Server-side aggregated metrics. Eliminates need to compute from individual records. Supports sum/avg/count/min/max with groupBy (assistant, endedReason, etc.) and time-bucketed trends (daily, weekly, monthly). | `name`, `timeRange` {start, end, step, timezone}, `result[]` {date, sumCost, countId, sumDuration} — 3 query variants: cost summary (90d weekly), by assistant, by ended reason | **HIGH** |
| **Assistants** | All configured voice agents with their model, voice, prompts, and analysis settings. Maps agents to their capabilities and configuration state. | `id`, `orgId`, `name`, `voice` {voiceId, provider}, `model` {model, tools[], messages[], provider}, `firstMessage`, `voicemailMessage`, `endCallMessage`, `transcriber` {model, language, provider}, `serverUrl`, `analysisPlan` {summaryPlan, successEvaluationPlan}, 18 assistants total | **HIGH** |
| **Evaluations** | 131 call evaluations with scoring/grading data. Measures agent performance quality over time. | `results[]`, `metadata` {totalItems: 131, itemsPerPage, currentPage} | **HIGH** |
| **Phone Numbers** | All phone numbers with assigned assistants. Maps which number connects to which agent and dealership. | `id`, `orgId`, `assistantId`, `number`, `name`, `provider` (twilio), `status` (active) — 7 numbers | **MEDIUM** |
| **Campaigns** | Outbound calling campaigns. Shows proactive outreach activity and results. | Array of campaign objects | **MEDIUM** |
| **Tools** | Function-calling tools available to assistants. Shows what actions agents can take during calls. | Array of tool definitions | **LOW** |
| **Squads** | Multi-agent configurations. Shows agent handoff and collaboration patterns. | Array of squad objects | **LOW** |
| **Knowledge Bases** | Documents/data agents can reference during calls. | Array of knowledge base objects | **LOW** |
| **Files** | Uploaded files (recordings, transcripts, etc.) | Array of file objects | **LOW** |
| **Blocks** | Reusable conversation building blocks. | Array of block objects | **LOW** |
| **Test Suites** | Automated agent testing configurations. | Array of test suite objects | **LOW** |

### Tavus (10 distinct endpoints)

| Endpoint | Business Value | Fields Available | Value |
|----------|---------------|------------------|-------|
| **Conversations** (list + detail) | Every video AI session with status, persona used, and context. Primary data source for video agent engagement tracking. | `conversation_id`, `conversation_name`, `conversation_url`, `conversational_context`, `callback_url`, `status` (ended, active, etc.), `replica_id`, `persona_id`, `created_at`, `updated_at` | **HIGH** |
| **Personas** (list + detail) | Video agent personality configurations. Maps what each video agent is designed to do and how it behaves. | `persona_id`, `persona_name`, `pipeline_mode`, `system_prompt`, `context`, `layers` {perception, llm, stt}, `objectives_id`, `guardrails_id`, `greeting`, `default_replica_id`, `document_ids[]`, `document_tags[]` | **HIGH** |
| **Replicas** (list + detail) | The visual avatar configurations for video agents. | `replica_id` + replica-specific fields | **MEDIUM** |
| **Videos** | Pre-recorded or generated video content. | Video list with metadata | **LOW** |
| **Documents** | Knowledge base documents for video agents. Enables measuring what information is available to agents. | Document list with metadata | **MEDIUM** |
| **Objectives** | Goal definitions for video agent conversations. Enables measuring whether agents achieve their configured objectives. | Objectives list | **MEDIUM** |
| **Guardrails** | Safety/boundary configurations for video agents. Compliance and quality assurance monitoring. | Guardrails list | **MEDIUM** |

---

## Table 2: Endpoints We DO NOT Have Access To

### VIN Solutions — Gateway Endpoints (17 endpoints, all return 403 Forbidden)

| Endpoint | Impact of Not Having It | Value |
|----------|------------------------|-------|
| **Contacts** (search) | Cannot search or list CRM contacts independently of leads. Cannot verify if a caller already exists before creating a duplicate. Cannot build a customer directory or enrich lead records with full contact details (phone, email, address). | **HIGH** |
| **Lead** (gateway version) | Redundant — we already have `/leads` via the header-versioned API. Impact is minimal since the data is accessible via the other path. | **LOW** |
| **Leads** (gateway version) | Same as above — redundant with header-versioned `/leads`. | **LOW** |
| **Communication** | Cannot see email/text/call logs between staff and customers within VIN CRM. This is critical missing data for measuring response time, follow-up frequency, and identifying response gaps. Without it, we have no visibility into what happens AFTER a lead is created. | **HIGH** |
| **Activity** | Cannot see CRM activity logs (tasks completed, notes added, status changes, etc.). Missing this means we cannot measure salesperson engagement quality or track workflow compliance. | **HIGH** |
| **Notes** | Cannot see notes attached to leads/contacts. Notes often contain critical context about customer intent, deal status, and next steps. Without them, DealerBrain lacks the context to give intelligent recommendations. | **HIGH** |
| **Tasks** | Cannot see CRM tasks (follow-up reminders, scheduled callbacks, delivery prep). Missing this means we cannot track whether salespeople are completing their required activities. | **HIGH** |
| **Appointments** | Cannot see CRM appointments. Without this, we cannot verify appointment show rates, compare AI-booked vs manually-booked appointments, or track the appointment-to-sale conversion funnel. | **HIGH** |
| **Emails** | Cannot see email correspondence between staff and customers. Email is a primary dealership communication channel — missing it creates a blind spot in response time tracking. | **HIGH** |
| **Calls** | Cannot see phone call logs from the CRM. Combined with the Communication endpoint, this would give complete visibility into all customer touchpoints. | **HIGH** |
| **Call Details** | Cannot see detailed call metadata (duration, recording status, outcome). Would complement VAPI data by showing human calls alongside AI calls. | **HIGH** |
| **Vehicles** | Cannot query the dealership's vehicle database directly. Would enable real-time inventory-to-demand matching. | **MEDIUM** |
| **Inventory** | Cannot see current lot inventory with pricing, days on lot, etc. This would enable inventory turn analysis, days-to-sale metrics, and pricing optimization. | **MEDIUM** |
| **Deals** | Cannot see deal/transaction records. This is the ultimate conversion metric — without deals data, we cannot calculate true close rates, deal values, gross profit, or sales velocity. | **HIGH** |
| **Desking** | Cannot see deal structure/negotiation data (payment terms, trade values, F&I products). Would enable deal profitability analysis. | **MEDIUM** |
| **Customer** | Cannot access the full customer record. May contain demographics, purchase history, and preferences that would enrich AI agent interactions. | **MEDIUM** |

### VIN Solutions — Version/Parameter Issues (3 endpoints, return 400)

| Endpoint | Impact of Not Having It | Value |
|----------|------------------------|-------|
| **Contact** (single, gateway) | Returns "invalid userId" — likely needs `userId` parameter added to the query. We have the contact URL from lead records but cannot resolve it to full contact data (name, phone, email, address). Partially mitigable: `vinSolutionsService` already has a working contact fetch path. | **MEDIUM** |
| **Vehicles/Trade** (per lead) | Cannot see trade-in vehicle details for a specific lead. The 404 may mean the tested lead simply has no trade-in (tradeVehicles array was empty). Endpoint likely works when a trade-in exists. | **LOW** |
| **Lead Status Filters** (ACTIVE, SOLD, LOST) | The v3 `/leads` endpoint rejects macro-level status filters ("ACTIVE is not supported... use new endpoints"). Only granular sub-statuses (e.g. ACTIVE_NEW_LEAD) work. DealerPulse currently queries by these macro statuses but may be using a different mechanism or filtering locally. | **MEDIUM** |

### VAPI (1 endpoint, returns 400)

| Endpoint | Impact of Not Having It | Value |
|----------|------------------------|-------|
| **Logs** | Cannot access raw platform logs. Minimal impact — call detail endpoint provides comprehensive data. May need different query parameters. | **LOW** |

### Tavus (1 endpoint, returns 404)

| Endpoint | Impact of Not Having It | Value |
|----------|------------------------|-------|
| **Landing Pages** | Cannot list landing pages. Minimal impact — this is a content delivery feature, not a data analysis feature. | **LOW** |

---

## Derivable Metrics from Available Data

### Category 1: Pipeline Health

| Metric | Source | How |
|--------|--------|-----|
| Total pipeline volume | VIN `/leads` | Count by `leadStatusType` = ACTIVE |
| Pipeline by stage | VIN `/leads` | Group by `leadStatus` (38 granular stages) |
| Pipeline by macro stage | VIN `/leadStatusTypes` | Group by 5 types: ACTIVE, SOLD, LOST, BAD, COMPLETE |
| New lead velocity | VIN `/leads` | Count leads where `leadGroupCategory` = NEW over time |
| Lead aging distribution | VIN `/leads` | `now - createdUtc` grouped into buckets (0-24h, 1-3d, 3-7d, 7-14d, 14-30d, 30d+) |
| Overdue/stale leads | VIN `/leads` | Active leads with `createdUtc` older than threshold and `leadGroupCategory` still NEW |
| Hot lead count | VIN `/leads` | Count where `isHot` = true |
| Showroom traffic | VIN `/leads` | Count where `isOnShowroom` = true |
| Pipeline-to-close ratio | VIN `/leads` | SOLD count / (ACTIVE + SOLD + LOST) over period |
| Loss rate | VIN `/leads` | LOST count / total leads created in period |

### Category 2: Sales / Dealership Performance

| Metric | Source | How |
|--------|--------|-----|
| Close rate | VIN `/leads` | SOLD / (SOLD + LOST) over period |
| Lead response rate | VIN `/leads` | CONTACTED / (NEW + WAITING + CONTACTED) from `leadGroupCategory` |
| Leads per salesperson | VIN `/leads` + CRM Users | Cross-reference lead assignments with user roster (requires contact-to-user mapping) |
| Staff roster health | VIN CRM Users | Count by `IlmAccess` (Admin/Manager/SalesPerson), flag Orphan groups |
| Multi-store comparison | VIN Dealers | Query leads per dealerId across all 7 visible dealerships |
| Source performance (ROI proxy) | VIN `/leads` + Lead Sources | Group leads by `leadSource` → count SOLD vs total per source |
| Lead type distribution | VIN `/leads` + Lead Types | % INTERNET vs WALK_IN vs PHONE etc. — shows channel mix |
| Vehicle demand patterns | VIN Vehicles of Interest | Group by make/model/year → shows what customers are shopping |
| New vs Used interest | VIN Vehicles of Interest | Group by `inventoryType` (NEW vs USED) |
| Average price point | VIN Vehicles of Interest | Mean of `sellingPrice` or `msrp` where available |
| Trade-in ratio | VIN `/leads` | % of leads with non-empty `tradeVehicles` array |

### Category 3: Voice Agent (AI) Performance

| Metric | Source | How |
|--------|--------|-----|
| Total call volume | VAPI Calls | Count all calls in period |
| Call volume trend | VAPI Analytics | Weekly/daily `countId` from analytics API |
| Total cost | VAPI Analytics | `sumCost` from analytics API |
| Cost per call | VAPI Analytics | `sumCost / countId` |
| Average call duration | VAPI Analytics | `sumDuration / countId` |
| Cost breakdown by component | VAPI Call Detail | `costBreakdown` → transport, STT, LLM, TTS, VAPI sub-costs |
| Success rate | VAPI Call Detail | Count `analysis.successEvaluation` = "true" / total |
| Call outcome distribution | VAPI Analytics (by ended reason) | Group by `endedReason` (customer-ended, assistant-ended, voicemail, etc.) |
| Per-assistant performance | VAPI Analytics (by assistant) | Compare cost, volume, duration across assistants |
| Evaluation scores | VAPI Evaluations | 131 evaluations available — scoring/grading data |
| Transcript sentiment | VAPI Call Detail | AI analysis of `transcript` or `analysis.summary` |
| Token efficiency | VAPI Call Detail | `costBreakdown.llmPromptTokens` vs `llmCompletionTokens` vs `llmCachedPromptTokens` |
| Voicemail detection rate | VAPI Call Detail | `costBreakdown.voicemailDetectionCost` frequency |
| Active assistants | VAPI Assistants | Count of configured voice agents and their configurations |
| Phone number utilization | VAPI Phone Numbers | Calls per number, which numbers are active |

### Category 4: Video Agent (AI) Performance

| Metric | Source | How |
|--------|--------|-----|
| Session volume | Tavus Conversations | Count conversations per period |
| Session status distribution | Tavus Conversations | Group by `status` (ended, active, etc.) |
| Persona utilization | Tavus Personas + Conversations | Which personas are being used and how frequently |
| Session duration | Tavus Conversations | `updated_at - created_at` |
| Knowledge base coverage | Tavus Documents + Personas | `document_ids[]` per persona — which agents have docs |
| Objective configuration | Tavus Objectives + Personas | `objectives_id` set vs null — which agents have goals |
| Guardrail configuration | Tavus Guardrails + Personas | `guardrails_id` set vs null — which agents have safety rules |
| Replica usage | Tavus Replicas + Conversations | Which visual avatars are being used |

### Category 5: Cross-Platform (Combined Metrics)

| Metric | Sources | How |
|--------|---------|-----|
| Total AI interaction volume | VAPI Calls + Tavus Conversations | Sum of voice calls + video sessions |
| Total AI cost | VAPI Analytics + Tavus (no cost data) | VAPI provides cost; Tavus cost would need billing API |
| AI-to-human handoff rate | VAPI `endedReason` + `transfers` | Count transfers out of total calls |
| Lead-to-AI engagement ratio | VIN `/leads` count vs VAPI+Tavus volume | Are AI agents engaging with the pipeline proportionally? |
| Response gap score | VIN `leadGroupCategory` + VAPI call timestamps | NEW leads that have no corresponding VAPI/Tavus interaction |

---

## Actionability Assessment

### Can we trigger follow-up or action for Pipeline Health?

**YES, with current access.** Here is what we can act on today:

| Trigger | Data Source | Action |
|---------|------------|--------|
| Lead aging > threshold (e.g. 48h in NEW) | VIN `/leads` → `createdUtc` + `leadGroupCategory` = NEW | Flag for follow-up, notify manager, trigger AI outbound call |
| Hot lead detected | VIN `/leads` → `isHot` = true | Priority notification to assigned salesperson |
| Lead on showroom with no recent activity | VIN `/leads` → `isOnShowroom` = true | Alert floor manager for immediate engagement |
| Lead status regression (CONTACTED→WAITING) | VIN `/leads` polling → status change detection | Re-engagement trigger |
| Pipeline volume drop below threshold | VIN `/leads` trend analysis | Alert management, suggest marketing action |
| High loss rate (LOST spike) | VIN `/leads` → LOST count trend | Root cause investigation trigger |

**What we CANNOT trigger** (blocked endpoints):
- Follow-up based on communication gaps (need `/communication`)
- Task completion reminders (need `/tasks`)
- Appointment no-show follow-up (need `/appointments`)

### Can we trigger follow-up or action for Sales Performance?

**PARTIALLY.** We can measure outcomes but not process:

| Trigger | Data Source | Action |
|---------|------------|--------|
| Salesperson lead stagnation | VIN `/leads` + CRM Users | If rep's leads are aging without status changes, alert manager |
| Source underperformance | VIN `/leads` + Lead Sources | If a lead source has abnormally high LOST rate, flag for review |
| Close rate decline | VIN `/leads` trend | SOLD rate dropping week-over-week → management alert |
| Unbalanced lead distribution | VIN `/leads` + CRM Users | If some reps have 50+ leads while others have 5, flag imbalance |

**What we CANNOT measure** (blocked endpoints):
- Deal values and gross profit (need `/deals`)
- Individual communication effort (need `/communication`, `/emails`, `/calls`)
- Task completion compliance (need `/tasks`)
- Appointment show rates (need `/appointments`)

### Can we trigger follow-up or action for Lead Performance?

**YES, this is our strongest area:**

| Trigger | Data Source | Action |
|---------|------------|--------|
| New lead without AI contact in X minutes | VIN `/leads` (new) + VAPI Calls (no matching call) | Trigger outbound AI call via VAPI |
| AI call with successful evaluation | VAPI `analysis.successEvaluation` = true | Auto-create follow-up task, notify salesperson with summary |
| AI call ended by voicemail | VAPI `endedReason` = voicemail | Schedule retry call at different time |
| Lead interested in specific vehicle | VIN Vehicles of Interest → `make`, `model` | Auto-send targeted inventory info via SMS/email |
| High-value trade-in detected | VIN Vehicles of Interest → `tradeVehicles` with pricing | Priority notification — trade-in leads convert higher |
| Video session completed | Tavus Conversations → `status` = ended | Create follow-up lead if new customer, notify salesperson |
| AI call transfer to human | VAPI `artifact.transfers` | Alert on-duty salesperson for immediate pickup |

---

## Cross-Platform Data Flow: Can VAPI/Tavus Feed Into VIN Endpoints?

### The Short Answer: YES, with a critical bug fix first.

The lead creation endpoint (`POST /leads`) is available and working via v3 headers. The reason lead creation currently fails silently is that the code calls `/leadSources` and `/leadTypes` with v3 headers (wrong) and falls back to hardcoded placeholder values (`/leadSources/id/1`, `/leadTypes/id/1`). **Now that we know v1 headers work for reference endpoints, this is a fixable bug, not a missing capability.**

### What the flow looks like:

```
VAPI Call Ends
  → Webhook delivers: transcript, summary, customer.number, analysis
  → Extract: caller name, vehicle interest, intent (from transcript/summary)
  → Lookup: /leadSources (v1 header) → find "WEBSITE_CHAT" or "PHONE" source
  → Lookup: /leadTypes (v1 header) → find "PHONE" or "INTERNET" type
  → Create: POST /leads with correct leadSource href and leadType href
  → Result: Lead appears in VIN CRM with AI-generated context

Tavus Session Ends
  → Webhook delivers: conversation_id, persona_id, context
  → GET conversation detail → extract conversational_context
  → Same lead creation flow as above
  → Result: Video interaction creates a CRM lead
```

### Specific integration paths:

| From | To | Data Flow | Status |
|------|-----|-----------|--------|
| VAPI Call → VIN Lead | Call transcript → extract name, phone, intent → create lead with correct source/type | **POSSIBLE** after v1 header fix |
| VAPI Call → VIN Contact | Caller phone number → search contacts → create if new | **BLOCKED** — `/gateway/v1/contacts` search returns 403 |
| VAPI Summary → VIN Lead Notes | AI-generated call summary → attach as lead note | **BLOCKED** — `/gateway/v1/notes` returns 403 |
| Tavus Session → VIN Lead | Video session context → extract info → create lead | **POSSIBLE** after v1 header fix |
| VAPI Cost → VIN Activity | Log AI cost per interaction against lead | **BLOCKED** — `/gateway/v1/activity` returns 403 |
| VIN Lead → VAPI Outbound | New lead detected → trigger AI outbound call | **POSSIBLE** — VAPI has outbound call API |
| VIN Lead → Tavus Session | New lead → trigger video outreach | **POSSIBLE** — Tavus has conversation creation API |

### Can we "limp along" without the blocked endpoints?

**Yes.** The core feedback loop works:

1. AI handles call/video → captures data via webhook → creates VIN lead with correct reference data
2. VIN lead aging → triggers AI follow-up call → cycle repeats
3. All metrics from Table above are computable from available endpoints

What we're missing is the **middle layer** — the human activity between AI touchpoints:
- Did the salesperson call back?
- Was an email sent?
- Was the appointment kept?
- What notes were added?
- Was a deal closed?

This means our metrics accurately measure **AI performance** and **pipeline state**, but cannot measure **human execution quality**. We see the beginning (lead creation) and the end (SOLD/LOST), but not the middle (communication, tasks, appointments, deals).

---

## Summary: What We Have vs What We Need

| Capability | Status | Priority to Unlock |
|------------|--------|-------------------|
| Pipeline volume & status tracking | **HAVE** | -- |
| Lead aging & response gap detection | **HAVE** | -- |
| Lead source attribution | **HAVE** (after v1 header fix) | Bug fix only |
| Vehicle interest analysis | **HAVE** | -- |
| AI voice performance & cost | **HAVE** | -- |
| AI video session tracking | **HAVE** | -- |
| AI → CRM lead creation | **FIX NEEDED** (v1 headers for reference data) | High — code fix |
| Contact deduplication | **BLOCKED** (contacts search = 403) | High — VIN API key upgrade |
| Communication gap analysis | **BLOCKED** (communication = 403) | Critical — VIN API key upgrade |
| Human activity tracking | **BLOCKED** (activity, tasks, notes = 403) | Critical — VIN API key upgrade |
| Appointment tracking | **BLOCKED** (appointments = 403) | High — VIN API key upgrade |
| Deal/close tracking | **BLOCKED** (deals = 403) | Critical — VIN API key upgrade |
| Inventory matching | **BLOCKED** (inventory, vehicles = 403) | Medium — VIN API key upgrade |

### Immediate Actions (No VIN Solutions Involvement)

1. **Fix lead creation** — change `/leadSources` and `/leadTypes` calls to use v1 headers instead of v3
2. **Capture VAPI cost data** — store `cost`, `costBreakdown`, `analysis.successEvaluation` from webhook payloads
3. **Integrate VAPI Analytics API** — replace local computation with server-side aggregations
4. **Wire VAPI→VIN lead creation** — after fix #1, create VIN leads from AI call data

### Request to VIN Solutions (API Key Permissions)

Priority order for unlocking gateway endpoints:
1. `/gateway/v1/communication` — response gap analysis (the core problem Nexxus solves)
2. `/gateway/v1/activity` — staff activity tracking
3. `/gateway/v1/deals` — close rate and deal value metrics
4. `/gateway/v1/appointments` — appointment tracking
5. `/gateway/v1/contacts` — contact deduplication
6. `/gateway/v1/tasks` + `/gateway/v1/notes` — workflow compliance
7. `/gateway/v1/calls` + `/gateway/v1/calldetails` — human call tracking
8. `/gateway/v1/emails` — email communication tracking
9. `/gateway/v1/inventory` + `/gateway/v1/vehicles` — inventory matching
10. `/gateway/v1/deals` + `/gateway/v1/desking` — deal structure analysis
11. `/gateway/v1/customer` — customer profile enrichment
