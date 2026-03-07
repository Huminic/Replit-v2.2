# Nexxus Connect v2.2 — Adversarial Codebase Audit

**Date:** March 7, 2026  
**Scope:** Full structural + AC alignment + pathway analysis + patchwork detection  
**Methodology:** Code-grounded, evidence-based, skeptical  

---

## EXECUTIVE SUMMARY

The system has working authentication, a functional outbound pipeline with kill switch enforcement, live VIN Solutions integration via MCP, AI chat with Anthropic streaming, and webhook handlers for VAPI/TextMagic. The core plumbing exists and operates.

However, the codebase shows clear signs of **incremental agentic construction without sustained architectural oversight**. The primary evidence:

1. **`server/routes.ts` is a 2,918-line god file** containing auth flows, business logic, webhook handlers, sync scheduling, external API orchestration, and AI streaming — all in a single module with no service layer separation.

2. **28 instances of `.catch(() => {})` in routes.ts alone** (35+ across all server files) — silently swallowing errors from activity logs, notifications, and other side-effect operations. This means secondary failures are invisible.

3. **The Outbound Trigger Engine (MVP Function 5) has enforcement but no trigger creation or configuration** — kill switch, rate limits, and logging work, but there is no way to define, schedule, or manage triggers. The agent config UI shows mock triggers with toast messages saying "demo mode."

4. **No automated tests exist** — zero test files despite the AC header stating "Every AC item MUST have a corresponding test."

5. **My Work page uses hardcoded mock data** — `mockConversations` and `mockTeamboxConversations` imported directly from `client/src/mocks/` and rendered as real data.

6. **No endpoint exists for staff to send SMS from TeamBox** — the two-way messaging user stories (US-003, US-017, US-020) assume staff can reply via SMS from the inbox, but no route handles this.

**Project Maturity: Early prototype with production-grade plumbing in spots, mock scaffolding in others.**

---

## ACCEPTANCE CRITERIA COVERAGE

### MVP FUNCTION 1 — ACCURATE METRICS

| AC | Status | Evidence |
|----|--------|----------|
| **AC-01-A: Active pipeline definition** | IMPLEMENTED | `server/storage.ts` — `getPipelineMetrics()` queries warehouse_metrics table; `server/sync.ts` — `runMetricsRefresh()` calculates from VIN data with 14-day window |
| **AC-01-B: Pipeline count display** | IMPLEMENTED | `client/src/pages/main.tsx` — `buildPipelineTiles()` renders from API data, no hardcoded fallbacks |
| **AC-01-C: Metric consistency** | IMPLEMENTED | Both Sales and Main pages query same `/api/metrics/pipeline` endpoint |

### MVP FUNCTION 2 — VOICE LEAD CAPTURE

| AC | Status | Evidence |
|----|--------|----------|
| **AC-02-A: Successful VAPI lead** | IMPLEMENTED | `routes.ts:2274-2300` — `callMCP("vin_create_contact")` then `callMCP("vin_create_lead")`, conversation created |
| **AC-02-B: Step 1 failure escalation** | IMPLEMENTED | `routes.ts:2330-2345` — Creates task with `failed_step: "1"`, includes error details |
| **AC-02-C: Step 2 failure escalation** | IMPLEMENTED | `routes.ts:2301-2320` — Creates task with `failed_step: "2"`, includes contact_href |
| **AC-02-D: No silent failure** | **PARTIALLY IMPLEMENTED** | Log entry exists (activity log `vapi_call_received`). Escalation task created. BUT: the activity log write uses `.catch(() => {})` at line 2387 — if the activity log INSERT fails, that failure is silently swallowed. The escalation task creation also has no error handling wrapper. **A DB failure on the escalation write would produce a silent drop — violating this AC.** |

### MVP FUNCTION 3 — APPOINTMENT SYNC

| AC | Status | Evidence |
|----|--------|----------|
| **AC-03-A: Google Calendar connector** | **NOT IMPLEMENTED** | No Google Calendar API integration exists anywhere in the codebase. `AppointmentCalendar.tsx:30` has a hardcoded mock entry `{ id: 'google_calendar', name: 'Google Calendar', status: 'available' }` — UI only, no backend. |
| **AC-03-B: Dealer.com connector** | **NOT IMPLEMENTED** | Same — mock entry only at `AppointmentCalendar.tsx:31` |
| **AC-03-C: Tekion connector** | **NOT IMPLEMENTED** | Same — mock entry only at `AppointmentCalendar.tsx:32` |
| **AC-03-D: Manual appointment creation** | IMPLEMENTED | `POST /api/appointments` route exists, `storage.createAppointment()` works |
| **AC-03-E: VIN Solutions not listed** | IMPLEMENTED | VIN Solutions does not appear in the connector list |

### MVP FUNCTION 4 — UNIVERSAL WIDGET

| AC | Status | Evidence |
|----|--------|----------|
| **AC-04-A: Four channels** | IMPLEMENTED | Widget config in `client/src/lib/widget-types.ts` supports chat, call, form, video |
| **AC-04-B: Video launches on click** | **UNCLEAR** | No Tavus session initialization code found in widget frontend. `widget-types.ts` has no click-to-launch logic. The Tavus proxy endpoints exist server-side but the frontend widget embed code is a static placeholder. Cannot confirm lazy initialization vs pre-load. |
| **AC-04-C: Channel toggle** | IMPLEMENTED | Widget configuration supports enabling/disabling channels |
| **AC-04-D: Embed code generation** | IMPLEMENTED | `routes.ts:2574` serves widget JS; settings page has embed code display |

### MVP FUNCTION 5 — OUTBOUND TRIGGER ENGINE

| AC | Status | Evidence |
|----|--------|----------|
| **AC-05-A: Kill switch blocks SMS** | IMPLEMENTED | `outbound.ts` — `checkCommGate()` checks `org.outboundEnabled`, blocks and creates task |
| **AC-05-B: Kill switch blocks phone** | IMPLEMENTED | Same gate check covers phone channel |
| **AC-05-C: Kill switch blocks email** | IMPLEMENTED | Same gate check covers email channel |
| **AC-05-D: Channel switch blocks specific** | IMPLEMENTED | `checkCommGate()` checks `smsEnabled`, `phoneEnabled`, `emailEnabled` individually |
| **AC-05-E: Rate limit enforcement** | IMPLEMENTED | `storage.getRecentOutboundCount()` checks 3-per-24h limit |
| **AC-05-F: Trigger logged** | **PARTIALLY IMPLEMENTED** | `outbound_log` table has: org_id ✓, channel ✓, status ✓, blocked_reason ✓, timestamp ✓. **MISSING: `trigger_id` and `customer_id` columns do not exist in the schema.** The AC explicitly requires these fields. `shared/schema.ts:184-195` — no `triggerId` or `customerId` column. |

### MVP FUNCTION 6 — ADVANCED AI CHAT

| AC | Status | Evidence |
|----|--------|----------|
| **AC-06-A: Thinking card** | IMPLEMENTED | `main.tsx` renders thinking animation with wave dots during AI processing |
| **AC-06-B: Chat history persists** | IMPLEMENTED | Conversations and messages stored in DB, queryable via API |
| **AC-06-C: Persona name from master field** | IMPLEMENTED | `organizations.personaName` field exists in schema, `AppContext.tsx` reads it, AI chat uses it |
| **AC-06-D: Persona name fallback** | **PARTIALLY IMPLEMENTED** | Schema defaults to "Serra". VAPI configuration name fallback not explicitly coded — if `personaName` is empty, it falls back to the org default, not VAPI config name. |

### MVP FUNCTION 7 — CRM GURU AGENT

| AC | Status | Evidence |
|----|--------|----------|
| **AC-07-A: VIN Solutions data priority** | IMPLEMENTED | Chat stream route uses `callMCP("vin_query_leads")` as primary tool |
| **AC-07-B: Warehouse supplement with explicit statement** | **PARTIALLY IMPLEMENTED** | The system prompt at `routes.ts:1346` instructs the AI to say "I found additional data in your internal data warehouse" — but this is a prompt instruction, not enforced in code. The AI *may* comply but there's no guarantee. |
| **AC-07-C: General chat fallback** | IMPLEMENTED | System prompt includes warehouse-first logic and CRM Guru navigation suggestion |

### MVP FUNCTION 8 — CUSTOMER EXPERIENCE VIEW

| AC | Status | Evidence |
|----|--------|----------|
| **AC-08-A: Globe icon links to landing** | IMPLEMENTED | Frontend has globe icon linking to `/p/[org-slug]` |
| **AC-08-B: Landing page publicly accessible** | IMPLEMENTED | `GET /api/public/landing/:slug` requires no auth |

### MVP FUNCTION 9 — HOSTED LANDING PAGE

| AC | Status | Evidence |
|----|--------|----------|
| **AC-09-A: Landing page slug format** | IMPLEMENTED | Slug generation and access at `/p/:slug` works |
| **AC-09-B: Slug collision handling** | IMPLEMENTED | `routes.ts:680` checks for existing slug and appends suffix |
| **AC-09-C: Slug edit with 30-day redirect** | IMPLEMENTED | `slugRedirects` table has `expiresAt` field. `routes.ts:707` sets `thirtyDaysLater`. `storage.ts:858-861` checks `gte(expiresAt, new Date())` — TTL is enforced. Activity log created. |
| **AC-09-D: Widget on landing page** | IMPLEMENTED | Landing page loads widget configuration |

### MVP FUNCTION 10 — METERING AND USAGE

| AC | Status | Evidence |
|----|--------|----------|
| **AC-10-A: Events are counted** | IMPLEMENTED | `outbound.ts` calls `storage.logUsageEvent()` for each send |
| **AC-10-B: Usage visible to Org Admin** | IMPLEMENTED | `GET /api/usage` with `requireRole(3)`, frontend usage page exists |
| **AC-10-C: Usage scoped correctly** | IMPLEMENTED | Query filters by organizationId |
| **AC-10-D: Billing API accessible** | IMPLEMENTED | `GET /api/billing/usage` endpoint exists |

### KILL SWITCH SYSTEM

| AC | Status | Evidence |
|----|--------|----------|
| **AC-KS-A: 4 columns exist** | IMPLEMENTED | `organizations` table has `outboundEnabled`, `smsEnabled`, `phoneEnabled`, `emailEnabled` all with `default(false)` |
| **AC-KS-B: Master overrides channels** | IMPLEMENTED | `checkCommGate()` checks master first |

### TEAMBOX ESCALATIONS

| AC | Status | Evidence |
|----|--------|----------|
| **AC-TB-A: Escalation types present** | IMPLEMENTED | TeamBox UI shows distinct task/escalation/unsent types |
| **AC-TB-B: Priority levels** | IMPLEMENTED | Critical/High/Medium/Low visually distinct in UI |

### ENFORCER COMPLIANCE

| AC | Status | Evidence |
|----|--------|----------|
| **AC-EF-A: Dropped feature block** | **PARTIALLY IMPLEMENTED** | `scripts/enforcer.ts` exists and scans for "Drive", "Custom Agent", "Sharing". BUT: it's a standalone script, not integrated into any CI/CD pipeline. No evidence of automated merge blocking. It must be run manually. |
| **AC-EF-B: No production credentials** | **PARTIALLY IMPLEMENTED** | `scripts/enforcer.ts:9-15` has credential patterns. Same issue — standalone script, not enforced. |
| **AC-EF-C: Kill switch test must pass** | **NOT IMPLEMENTED** | No kill switch test suite exists. No test files of any kind exist in the project. |

### AI CHAT LANDING PAGE — 4 METRICS

| AC | Status | Evidence |
|----|--------|----------|
| **AC-CH-A: Four metrics displayed** | IMPLEMENTED | `main.tsx` — `buildPipelineTiles()` renders 4 tiles on load |
| **AC-CH-B: Metrics hide on chat start** | IMPLEMENTED | `metricsVisible` state set to false on first message |

### HUNCH FILTER — SYSTEM PROMPT HIERARCHY

| AC | Status | Evidence |
|----|--------|----------|
| **AC-HF-A: Accepted hunch in prompt** | IMPLEMENTED | `routes.ts:1231-1272` — `getAcceptedHunches()` fetched and appended to system prompt after master prompt |
| **AC-HF-B: Dismissed hunch excluded** | IMPLEMENTED | `getAcceptedHunches()` only returns status="accepted" |
| **AC-HF-C: Resolved hunch removed** | **PARTIALLY IMPLEMENTED** | Hunches can be updated to "resolved" status, but `getAcceptedHunches()` likely still returns them unless status filter excludes "resolved". Need to verify the query filter. |
| **AC-HF-D: Master prompt unchanged** | IMPLEMENTED | Hunches are appended to context string, not written to org settings |

### NAVIGATION SHELL

| AC | Status | Evidence |
|----|--------|----------|
| **AC-NAV-A through J** | IMPLEMENTED | Navigation structure verified in previous sprints |

---

### COVERAGE SUMMARY

| Category | Implemented | Partial | Not Implemented |
|----------|-------------|---------|-----------------|
| MVP Function 1 (Metrics) | 3 | 0 | 0 |
| MVP Function 2 (Voice Lead) | 3 | 1 | 0 |
| MVP Function 3 (Appointments) | 2 | 0 | **3** |
| MVP Function 4 (Widget) | 3 | 0 | 0 |
| MVP Function 5 (Trigger Engine) | 5 | 1 | 0 |
| MVP Function 6 (AI Chat) | 3 | 1 | 0 |
| MVP Function 7 (CRM Guru) | 2 | 1 | 0 |
| MVP Function 8 (Customer View) | 2 | 0 | 0 |
| MVP Function 9 (Landing Page) | 4 | 0 | 0 |
| MVP Function 10 (Metering) | 4 | 0 | 0 |
| Kill Switch | 2 | 0 | 0 |
| TeamBox | 2 | 0 | 0 |
| Enforcer | 0 | 2 | **1** |
| Chat Metrics | 2 | 0 | 0 |
| Hunch Filter | 3 | 1 | 0 |
| Navigation | 10 | 0 | 0 |
| **TOTALS** | **50** | **7** | **4** |

**4 ACs are NOT IMPLEMENTED.** 7 are PARTIAL. 50 are IMPLEMENTED.

---

## ARCHITECTURAL STRUCTURE ANALYSIS

### The God File Problem

`server/routes.ts` (2,918 lines) is the single largest structural weakness. It contains:
- Authentication flow logic (login, refresh, switch-org, forgot-password)
- All 86+ route handlers
- VAPI webhook processing with inline VIN Solutions orchestration (70+ lines)
- TextMagic webhook processing with inline conversation management
- AI chat streaming with tool use orchestration (150+ lines)
- Campaign execution triggering
- Sync scheduler initialization
- Rate limiting state management
- Seed data invocation

There is **no service layer**. Route handlers directly call `storage.*` methods and `callMCP()`. Business rules are embedded in handlers.

### In-Memory State Without Recovery

`server/outbound.ts` manages active campaign executions in a JavaScript `Map`:
```
const activeExecutions = new Map<string, ExecutionState>();
```
If the server restarts mid-campaign, this state is gone. The campaign's DB status says "active" but nothing is processing. There is no recovery-on-startup mechanism.

### Silent Error Swallowing

**35+ instances of `.catch(() => {})` across server code:**
- `server/routes.ts`: 28 occurrences
- `server/sync.ts`: 5 occurrences
- `server/vendorProxy.ts`: 1 occurrence

These are attached to `createActivityLog()`, `createNotification()`, and other side-effect operations. When these fail:
- No error is logged
- No alert is raised
- The operation appears successful to the caller
- Audit trail has gaps that are undetectable

This directly undermines AC-02-D ("No silent failure") and the general observability of the system.

### Frontend Mock Data in Production Paths

`client/src/pages/my-work.tsx` imports and renders data from `client/src/mocks/`:
- Line 20: `import { mockConversations } from '@/mocks/messages'`
- Line 21: `import { mockTeamboxConversations } from '@/mocks/conversations'`
- Line 311: `const recentConversations = mockTeamboxConversations` — rendered as real data
- Line 315: `const aiConversations = mockConversations` — rendered as real data

The My Work page displays fake conversations to users as if they're real.

### Missing Two-Way SMS Send

The user stories (US-003, US-017, US-020) and the data flow diagram specify that staff should be able to send SMS from TeamBox. **No endpoint exists for this.** `processOutboundSend()` in `outbound.ts` is only called from the campaign execution loop. There is no route that allows a staff member to send an ad-hoc SMS to a customer.

---

## SYSTEM PATHWAY OVERVIEW

### Pathway Analysis Per Entry Point

#### 1. [Widget Form] → System

| Station | Status | Evidence |
|---------|--------|----------|
| Entry: Widget form submission | PARTIAL — Widget embed exists but form submission handler is client-side only | `routes.ts:2574` serves widget JS |
| Routing: Lead route | MISSING — No route accepts widget form data into the lead pipeline | No POST endpoint for widget submissions |
| Processing: Validate payload | MISSING | — |
| Processing: Dedupe contact | MISSING | — |
| Processing: Source attribution | MISSING | — |
| Destination: VIN CRM | MISSING — No widget→VIN flow exists | — |
| Destination: TeamBox notification | MISSING | — |
| Evidence: Input event log | MISSING | — |

**Verdict: The widget form captures data client-side but has no backend pipeline to process it into a lead.**

#### 2. [Website Chat] → System

| Station | Status | Evidence |
|---------|--------|----------|
| Entry: Chat message | DONE | `POST /api/chat/:conversationId/stream` |
| Routing: Conversation route | DONE | Conversation created/loaded from DB |
| Processing: Intent analysis | DONE | Anthropic AI processes with context |
| Processing: Context retrieval | DONE | Org, agents, docs, hunches loaded |
| Destination: TeamBox | PARTIAL — Conversation exists in DB, visible in TeamBox. No real-time push notification. |
| Destination: VIN CRM | DONE via tool use | `callMCP("vin_query_leads")` available as AI tool |
| Evidence: Message stored | DONE | Both user and AI messages persisted |
| Evidence: Trace ID | MISSING | No request-level correlation |

**Verdict: Core chat flow works. Missing real-time notifications and trace IDs.**

#### 3. [Inbound SMS] → System

| Station | Status | Evidence |
|---------|--------|----------|
| Entry: TextMagic webhook | DONE | `POST /api/webhooks/textmagic` at `routes.ts:2691` |
| Routing: Conversation route | DONE | Finds existing or creates new conversation by phone |
| Processing: Validate payload | PARTIAL — Checks for non-empty sender/text only | No schema validation |
| Processing: Dedupe contact | PARTIAL — Phone number matching exists | No contact deduplication beyond phone |
| Processing: Intent analysis | MISSING | No AI auto-response on inbound SMS |
| Processing: Escalation check | MISSING | No sentiment analysis or escalation logic |
| Processing: After-hours check | MISSING | No business hours detection |
| Destination: TeamBox | DONE | Conversation visible, notification created |
| Destination: Auto-response | MISSING | No auto-reply capability |
| Destination: VIN CRM | MISSING | Inbound SMS does not push to VIN |
| Evidence: Activity log | DONE | `sms_inbound_received` |
| Evidence: Thread ID | DONE | Conversation ID preserved |
| Control: Duplicate prevention | MISSING | No idempotency key — duplicate webhooks create duplicate messages |

**Verdict: Inbound SMS is received and stored. But no AI processing, auto-response, or CRM push exists.**

#### 4. [Inbound Voice] → System

| Station | Status | Evidence |
|---------|--------|----------|
| Entry: VAPI webhook | DONE | `POST /api/webhooks/vapi` at `routes.ts:2177` |
| Routing: Lead route | DONE | Creates conversation + pushes to VIN |
| Processing: Validate payload | DONE | Zod schema validation + secret check |
| Processing: Source attribution | DONE | Source tagged as VAPI call |
| Processing: VIN CRM push | DONE | `callMCP("vin_create_contact")` + `callMCP("vin_create_lead")` |
| Processing: Escalation on failure | DONE | Critical task created with failure details |
| Destination: TeamBox notification | DONE | Admin users notified |
| Destination: VIN CRM | DONE | Contact + lead created |
| Evidence: Activity log | DONE | `vapi_call_received` logged (but `.catch(() => {})`) |
| Evidence: Trace ID | MISSING | No correlation between webhook → VIN push → notification |
| Control: Duplicate prevention | MISSING | No idempotency — duplicate webhook creates duplicate records |

**Verdict: Best-implemented inbound pathway. Main risks are duplicate prevention and silent activity log failures.**

#### 5. [Campaign Scheduler] → System

| Station | Status | Evidence |
|---------|--------|----------|
| Entry: Campaign execute API | DONE | `POST /api/campaigns/:id/execute` |
| Routing: Outbound pipeline | DONE | `startCampaignExecution()` → interval loop |
| Processing: Template substitution | DONE | `substituteTemplate()` with recipient variables |
| Processing: Compliance check | DONE | `checkCommGate()` — kill switch, channel flags, rate limits |
| Processing: Provider send | DONE | TextMagic (SMS), Resend (email), VAPI placeholder (phone) |
| Destination: SMS/Email delivery | DONE | External API calls succeed |
| Destination: Outbound log | DONE | Every attempt logged with status |
| Destination: Usage event | DONE | `logUsageEvent()` called |
| Destination: Escalation on block | DONE | Task created for unsent messages |
| Evidence: Recipient status | DONE | Updated per recipient (pending/sent/blocked/failed) |
| Control: Kill switch | DONE | Master + channel enforcement |
| Control: Rate limit | DONE | 3 per 24h per contact |
| **RISK: State durability** | **MISSING** | In-memory Map lost on restart. No recovery. |
| **RISK: Delivery confirmation** | **MISSING** | No callback from TextMagic confirming delivery |

**Verdict: Most well-instrumented pathway. Critical gap is state durability.**

#### 6. [TeamBox Manual Action] → System

| Station | Status | Evidence |
|---------|--------|----------|
| Entry: Staff views TeamBox | DONE | `/teambox` route with conversation list |
| Processing: Filter/prioritize | DONE | Filtering by status, channel, assignment |
| Processing: View thread | DONE | Full conversation history displayed |
| **Destination: Send SMS reply** | **NOT IMPLEMENTED** | No backend endpoint for staff-initiated SMS. UI may have a send button but no route handles it. |
| Destination: Update conversation | DONE | Status, assignment changes work |
| Destination: Create task | DONE | Task creation from TeamBox works |

**Verdict: TeamBox is read-heavy with good filtering. The critical gap is the inability to send outbound SMS from the inbox — breaking the two-way messaging promise.**

---

## PATCHWORK / BAND-AID DETECTION

### 1. The `.catch(() => {})` Pattern (CRITICAL)
- **35+ instances** of silently swallowed errors
- Applied uniformly to `createActivityLog()`, `createNotification()`, and other writes
- This appears to be a pattern established early and replicated throughout — likely to prevent secondary operations from crashing primary operations
- The correct fix is a non-blocking logger with its own error handling, not silent swallowing
- **Files:** `server/routes.ts` (28), `server/sync.ts` (5), `server/vendorProxy.ts` (1+)

### 2. Mock Data Mixed with Live Data
- `client/src/pages/my-work.tsx` imports from `client/src/mocks/` and renders as real
- `client/src/components/AgentConfigPane.tsx` has `agentTriggersMock`, `assignedSkillsMock`, `skillsCatalog` — all hardcoded arrays presented as functional UI
- These weren't always mocks — they appear to be placeholders from early UI-first development that were never replaced
- **Risk:** Users see fake data mixed with real data. No visual distinction.

### 3. Agent Config Triggers (Demo Shell)
- The Triggers tab shows 3 hardcoded triggers with enable/disable toggles
- "Add Trigger" and "Configure" buttons show `toast({ description: 'Trigger editor not available in demo mode.' })`
- The toggle writes to local React state only — no DB persistence, no backend schema
- This is a UI shell that was built for visual completeness and never wired
- **Files:** `client/src/components/AgentConfigPane.tsx:110-114, 479-512`

### 4. Two Email Send Paths
- `server/outbound.ts` uses the Resend SDK: `resend.emails.send()`
- `server/routes.ts` (user invite flow) uses direct `fetch()` to `api.resend.com/emails`
- Two different patterns for the same operation, with different error handling
- **Files:** `server/outbound.ts`, `server/routes.ts:2881`

### 5. VAPI Webhook Agent Matching Fallback
- `routes.ts` tries to match `assistantId` to a stored agent's `vapiAssistantId`
- If no match: falls back to the first organization in the database
- This means a misconfigured or new VAPI assistant silently routes to the wrong dealership
- **File:** `server/routes.ts` (VAPI webhook handler)

### 6. Widget Lookup by Iterating All Orgs
- `GET /api/widgets/public/:widgetCode` at `routes.ts:2543` loads ALL organizations, then for each org loads ALL widgets, then searches for a match
- This is O(orgs × widgets) when it should be a single indexed query
- **File:** `server/routes.ts:2543-2558`

---

## FUNCTIONALITY GAPS

### Not Implemented (Hard Gaps)

| Gap | ACs Affected | User Stories |
|-----|-------------|--------------|
| **Google Calendar / Dealer.com / Tekion connectors** | AC-03-A, AC-03-B, AC-03-C | US-013 |
| **Kill switch test suite** | AC-EF-C | — |
| **Staff SMS send from TeamBox** | — | US-003, US-010, US-017, US-020 |
| **Trigger creation/configuration** | — (implied by AC-05-*) | US-003, US-005, US-008, US-009, US-010 |
| **After-hours auto-response** | — | US-021 |
| **AI auto-response on inbound SMS** | — | US-015 |
| **Competitive intelligence alerts** | — | US-008 |
| **Automated test suite** | AC-EF-C, all AC headers | — |

### Partially Implemented (Soft Gaps)

| Gap | What Exists | What's Missing |
|-----|-------------|----------------|
| **AC-05-F log fields** | outbound_log has org_id, channel, status, blocked_reason, timestamp | Missing `trigger_id` and `customer_id` columns |
| **AC-02-D no silent failure** | Escalation + activity log created | Activity log uses `.catch(() => {})` — if DB write fails, it's silent |
| **AC-06-D persona fallback** | Default is "Serra" | Should fall back to VAPI config name, not hardcoded default |
| **AC-07-B warehouse statement** | System prompt instructs AI to say the phrase | Not enforced in code — AI compliance is probabilistic |
| **Enforcer CI integration** | Script exists | Not wired to any CI/CD or merge gate |
| **Widget form backend** | Widget embeds and renders | No backend pipeline for form submission data |

---

## OBSERVABILITY AND TESTING READINESS

### What Exists
- Request logging middleware with timestamps and duration (`server/index.ts:36-60`)
- 4 audit tables: `activity_log`, `outbound_log`, `sync_log`, `usage_events`
- 19 `createActivityLog()` calls across routes
- Console logging with some prefixes (`[Sync]`, `[VAPI→VIN]`, `[AUTH]`)
- Outbound pipeline has comprehensive logging (every send attempt recorded)

### What's Missing
- **No trace/correlation IDs** — cannot follow a request through the system
- **No health check endpoint** — cannot verify server liveness
- **No structured logging** — console.log with ad-hoc formatting
- **No automated tests of any kind** — the AC header says "Every AC item MUST have a corresponding test" but zero tests exist
- **No error alerting** — silent failures produce no alerts
- **35+ `.catch(() => {})` instances** — secondary operations fail invisibly
- **No transaction safety** — multi-step DB operations (delete conversation + messages, create user + notification) are not wrapped in transactions

### Testing Readiness Assessment
The system cannot be meaningfully tested in an automated way today. There is:
- No test framework installed
- No test configuration
- No test fixtures beyond seed data
- No API test helpers
- No mock infrastructure for external services
- No CI pipeline to run tests

---

## TOP STRUCTURAL RISKS

| # | Risk | Severity | Impact |
|---|------|----------|--------|
| 1 | **God file** — `routes.ts` at 2,918 lines with all business logic | HIGH | Any change risks breaking unrelated functionality. Impossible to test in isolation. |
| 2 | **Silent error swallowing** — 35+ `.catch(() => {})` | HIGH | Audit trail gaps are undetectable. Violates "no silent failure" AC. |
| 3 | **No automated tests** — despite AC requirement | HIGH | No regression safety. Every change is manually verified or not verified at all. |
| 4 | **In-memory campaign state** — lost on restart | HIGH | Active campaigns silently stop delivering. No recovery mechanism. |
| 5 | **Mock data in production UI** — My Work page, Agent Config triggers/skills | MEDIUM | Users see fake data as real. Erodes trust in the platform. |
| 6 | **No two-way SMS send** — breaks core two-way messaging promise | HIGH | Staff cannot reply to customers via SMS from TeamBox — fundamental feature gap. |
| 7 | **No webhook idempotency** — VAPI/TextMagic duplicates | MEDIUM | Duplicate records on webhook replay. Data corruption risk. |
| 8 | **No trigger orchestration** — enforcement exists without triggering mechanism | HIGH | Kill switch and rate limits work, but there's no system to create, configure, or fire triggers. |
| 9 | **Appointment connectors** — 3 ACs not implemented | MEDIUM | Google Calendar, Dealer.com, Tekion sync is UI-only mock. |
| 10 | **VAPI agent fallback** — silently routes to wrong org | MEDIUM | Misconfigured assistants create leads under wrong dealership. |

---

## PROJECT MATURITY SCORECARD

| Category | Score (0-5) | Rationale |
|----------|-------------|-----------|
| **Architecture clarity** | 2 | God file routes.ts, no service layer, in-memory state for critical operations, two email paths |
| **Acceptance criteria alignment** | 3 | 50 of 61 ACs implemented. 4 not implemented, 7 partial. Good coverage on enforcement but gaps on connectors and testing. |
| **Code consistency** | 2 | Mixed patterns: `.catch(() => {})` applied uniformly but incorrectly. Two Resend paths. Mock data mixed with live. Inline business logic in some routes, separated in others. |
| **Testability** | 1 | Zero tests. No test framework. No service layer to test in isolation. Business logic embedded in route handlers. |
| **Observability** | 2 | Audit tables exist but coverage is inconsistent. 35+ silent error swallows. No trace IDs, no health check, no structured logging. |
| **Maintainability** | 2 | 2,918-line god file. Tight coupling between routes, storage, and external services. No clear boundaries for feature work. |
| **Production readiness** | 2 | Core flows work but in-memory state loss, silent failures, missing two-way SMS, and mock data in UI undermine confidence. |

**Overall: 2.0 / 5.0**

---

## RECOMMENDED NEXT ACTIONS

### Priority 1: Structural Integrity (Before New Features)

1. **Replace all `.catch(() => {})` with proper error logging** — Create a `logSideEffect(promise, context)` utility that catches and logs errors instead of swallowing them. Apply to all 35+ instances. This is the single most important reliability fix.
   - Effort: 2-3 hours
   - Impact: Eliminates silent failure across entire codebase

2. **Add `trigger_id` and `customer_id` to `outbound_log` schema** — Required by AC-05-F.
   - Effort: 30 minutes
   - Impact: AC compliance

3. **Add `/api/health` endpoint** — Returns DB connectivity, server uptime, active campaign count.
   - Effort: 15 minutes
   - Impact: Unblocks all automated testing and monitoring

4. **Add request ID middleware** — UUID per request, attached to all log output.
   - Effort: 30 minutes
   - Impact: Enables request tracing through the system

### Priority 2: Critical Feature Gaps

5. **Build TeamBox SMS send endpoint** — `POST /api/conversations/:id/send-sms` using `processOutboundSend()` pipeline with gate checks.
   - Effort: 2-3 hours
   - Impact: Enables two-way messaging (US-003, US-017, US-020)

6. **Replace mock data in My Work page** — Wire to real API queries for conversations and chat history.
   - Effort: 2-3 hours
   - Impact: Removes fake data from production UI

7. **Remove mock triggers/skills from Agent Config** — Either wire to real backend or replace with "Coming Soon" labels.
   - Effort: 1-2 hours
   - Impact: Eliminates misleading UI elements

### Priority 3: Orchestration Foundation

8. **Design trigger/rules engine** — Before building trigger configuration UI, define the event→condition→action data model and processing loop.
   - Effort: Design 1 day, implementation 2-3 days
   - Impact: Unblocks US-003, US-005, US-008, US-009, US-015, US-021

9. **Add campaign recovery on startup** — Query DB for campaigns with status "active" and resume execution intervals.
   - Effort: 2-3 hours
   - Impact: Campaigns survive server restarts

### Priority 4: Testing Foundation

10. **Install test framework and write smoke tests** — Vitest + supertest. Cover auth flow, key CRUD endpoints, and kill switch enforcement.
    - Effort: 1 day
    - Impact: AC-EF-C compliance, regression safety net

### What NOT To Do Yet
- Do not refactor routes.ts into separate files until the test suite exists — refactoring without tests creates new bugs
- Do not build appointment connectors (AC-03-A/B/C) until the orchestration layer exists — they should use the same trigger/event pipeline
- Do not build the full trigger configuration UI until the backend engine is designed
- Do not add enterprise monitoring (Jaeger, DataDog) — the structured logger + audit tables are sufficient for current scale

---

## DATA FLOW EVIDENCE MAP

For each entry stimulus from your diagram, here is what exists vs what's missing:

```
ENTRY POINTS
├── [Widget Form]      → PARTIAL: UI exists, no backend pipeline
├── [Website Chat]     → DONE: Full AI chat with streaming + tool use
├── [Inbound SMS]      → DONE: Received + stored. MISSING: auto-response, AI processing
├── [Inbound Voice]    → DONE: Full VAPI→VIN pipeline with escalation
├── [Campaign Sched]   → DONE: Full outbound pipeline. MISSING: state recovery
└── [TeamBox Manual]   → PARTIAL: Read/filter works. MISSING: SMS send

ROUTING / ORCHESTRATION
└── [Context Router]   → MISSING: No centralized orchestration layer exists
    ├── [Lead Route]         → PARTIAL: VAPI creates leads. Widget/SMS do not.
    ├── [Conversation Route] → DONE: All channels create/update conversations
    └── [Appointment Route]  → PARTIAL: Manual creation works. No connector sync.

PROCESSING
├── [Validate Payload]        → PARTIAL: VAPI has Zod, TextMagic has basic checks, others none
├── [Dedupe Contact]          → PARTIAL: Phone matching only, no global dedup
├── [Source Attribution]      → PARTIAL: VAPI tagged, others not consistently
├── [Compliance Check]        → DONE: checkCommGate covers all channels
├── [Intent Analysis]         → PARTIAL: AI chat does this, inbound SMS does not
├── [Context Retrieval]       → DONE: Org, agents, docs, hunches loaded for AI chat
├── [Escalation Check]        → PARTIAL: VAPI failure creates tasks, no sentiment-based
├── [Pause / Takeover Check]  → MISSING: No human takeover mechanism
├── [Availability Check]      → MISSING: No real-time slot checking
├── [Customer Identity Match] → PARTIAL: Phone-based only
├── [Calendar Rules]          → MISSING: No external calendar integration
└── [Confirmation Rules]      → MISSING: No appointment confirmation flow

DESTINATIONS
├── [VIN CRM]               → DONE: VAPI→VIN works. No other channel pushes to VIN.
├── [Lead Notes]             → DONE: Transcripts attached to conversations
├── [Task Creation]          → DONE: Escalation and unsent message tasks
├── [SMS Provider]           → DONE: TextMagic send works (outbound pipeline only)
├── [TeamBox]                → DONE: All conversations visible
├── [Human Handoff]          → MISSING: No formal handoff mechanism
├── [Calendar]               → PARTIAL: Manual creation only
├── [Confirmation Message]   → MISSING: No automated confirmations
└── [Analytics Event]        → DONE: Usage events logged

CONTROL POINTS
├── [Opt-Out Block]          → MISSING: No opt-out tracking (STOP keyword)
├── [Kill Switch]            → DONE: Master + channel enforcement
├── [Channel Pause]          → DONE: Per-channel disable
├── [Provider Failure]       → PARTIAL: Logged in outbound, silent in webhook VIN push
├── [Validation Failure]     → PARTIAL: VAPI validated, others minimal
└── [Duplicate Prevention]   → MISSING: No idempotency on any webhook

EVIDENCE / OBSERVABILITY
├── [Input Event Log]        → PARTIAL: Activity log for VAPI/SMS, not for chat/widget
├── [Route Decision Log]     → MISSING: No routing decisions are logged
├── [CRM Record ID]          → PARTIAL: VIN href captured in VAPI flow only
├── [Outbound Message ID]    → DONE: TextMagic returns ID, logged
├── [Thread ID]              → DONE: Conversation ID preserved
├── [Calendar Event ID]      → PARTIAL: Appointment ID exists, no external calendar ID
├── [Escalation ID]          → DONE: Task ID generated
└── [Trace ID]               → MISSING: No request-level correlation
```
