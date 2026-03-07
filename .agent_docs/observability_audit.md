# Nexxus Connect v2.2 — Observability & Continuity Test Readiness Audit

**Date:** March 7, 2026  
**Auditor:** System Reliability Analysis  
**Codebase:** ~6,200 lines server-side, ~15,000+ lines client-side  
**User Story Coverage:** 30 user stories (US-001 through US-030)

---

## A. EXECUTIVE SUMMARY

The application has a **functional backend with real database persistence**, a working authentication system, and live external integrations (VAPI, TextMagic, Resend, VinSolutions via MCP, Tavus, Anthropic, Brave Search). Campaign execution with kill switch enforcement is fully implemented. The storage layer uses Drizzle ORM with PostgreSQL for all operations — no mock storage exists on the backend.

**Test readiness is LOW-MODERATE.** The system has good bones for observability (4 audit tables, request logging middleware, activity tracking), but critical gaps exist: no correlation/trace IDs, no health check endpoint, no automated tests of any kind, no transaction safety on multi-step operations, and inconsistent error handling across route handlers. Approximately 30 of 86 route handlers have try/catch blocks, meaning ~65% of routes will crash silently on unexpected errors.

The biggest risk for continuity testing is **silent failure at integration boundaries** — external API calls to VAPI, TextMagic, VinSolutions, and Resend can fail without creating audit records unless they go through the outbound pipeline. Webhook handlers have better coverage but lack idempotency keys.

**Overall Readiness Score: 2.4 / 5.0**

---

## B. SYSTEM EDGE INVENTORY

### External Inputs (Into the System)

| Edge | Entry Point | File | Evidence |
|------|-------------|------|----------|
| **VAPI Call Webhook** | `POST /api/webhooks/vapi` | `server/routes.ts:2177` | DONE — Zod schema validation, secret auth, creates conversation + message + activity log |
| **TextMagic SMS Webhook** | `POST /api/webhooks/textmagic` | `server/routes.ts:2691` | DONE — Rate limited (30/min/IP), creates conversation + message + notification |
| **Widget Landing Page** | `GET /api/public/landing/:slug` | `server/routes.ts:2519` | DONE — Resolves org by slug, handles redirects |
| **Public Widget Config** | `GET /api/widgets/public/:widgetCode` | `server/routes.ts:2543` | DONE — Returns widget config for embedding |
| **Widget JS** | `GET /widget/nexxus-widget.js` | `server/routes.ts:2574` | DONE — Serves static embed script |
| **User Login** | `POST /api/auth/login` | `server/routes.ts:62` | DONE — bcrypt password check, JWT generation, session creation |
| **Token Refresh** | `POST /api/auth/refresh` | `server/routes.ts:155` | DONE — Refresh token rotation with session DB tracking |

### External Outputs (From the System)

| Edge | Destination | File | Evidence |
|------|-------------|------|----------|
| **SMS via TextMagic** | `POST rest.textmagic.com/api/v2/messages` | `server/outbound.ts` | DONE — Full pipeline with gate checks, logging, usage events |
| **Email via Resend** | `POST api.resend.com/emails` / SDK | `server/outbound.ts`, `server/routes.ts` | DONE — Two paths exist (SDK in outbound, direct fetch in routes) |
| **VinSolutions CRM** | `POST mcp.huminicdev.com/dax/mcp` | `server/vendorProxy.ts` | DONE — MCP JSON-RPC protocol, tools: `vin_query_leads`, `vin_lead_summary`, etc. |
| **VAPI Voice** | `GET api.vapi.ai/assistant,call,phone-number` | `server/vendorProxy.ts` | DONE — Read-only proxy for call logs, assistants, phone numbers |
| **Tavus Video** | `GET tavusapi.com/v2/personas,replicas,conversations` | `server/vendorProxy.ts` | DONE — Read-only proxy for video session data |
| **Brave Search** | `GET api.search.brave.com/res/v1/web/search` | `server/braveSearch.ts` | DONE — Graceful fallback if API key missing |
| **Anthropic AI** | Claude 3.5 Sonnet (streaming + unary) | `server/routes.ts:1202` | DONE — SSE streaming to client, tool use pipeline |

### Internal Inputs (UI → Backend)

| Edge | Entry Point | File | Evidence |
|------|-------------|------|----------|
| **AI Chat** | `POST /api/chat/:conversationId/stream` | `server/routes.ts:1202` | DONE — SSE streaming, tool use, VIN/Brave/hunch integration |
| **Campaign Execute** | `POST /api/campaigns/:id/execute` | `server/routes.ts:992` | DONE — Starts interval-based outbound loop |
| **Campaign Stop** | `POST /api/campaigns/:id/stop` | `server/routes.ts:1032` | DONE — Stops execution, notifies users |
| **Send SMS from TeamBox** | `POST /api/conversations/:id/send-sms` | `server/routes.ts` | DONE — Direct TextMagic send with outbound logging |
| **Sync Triggers** | `POST /api/sync/backfill,delta,metrics` | `server/routes.ts:2402-2428` | DONE — Manual triggers for background jobs |
| **Org Switch** | `POST /api/auth/switch-org` | `server/routes.ts:244` | DONE — Re-issues tokens, updates user org |
| **Kill Switch Toggle** | `PATCH /api/organizations/:id` | `server/routes.ts:636` | DONE — Updates org-level outbound flags |
| **User CRUD** | `POST/PATCH /api/users` | `server/routes.ts:333,422` | DONE — With activity logging |
| **Agent CRUD** | `POST/PATCH/DELETE /api/agents` | `server/routes.ts:541,568,597` | DONE — With activity logging |

---

## C. ROUTE MAP

### Route 1: VAPI Call → VIN Lead Creation (US-001, US-004)

| Step | System | File | Evidence | Risk |
|------|--------|------|----------|------|
| 1. VAPI call ends | External webhook | — | — | — |
| 2. Webhook received | `POST /api/webhooks/vapi` | `routes.ts:2177` | DONE — Zod validation, secret check | Low |
| 3. Find matching agent | Agent lookup by `vapiAssistantId` | `routes.ts` | DONE — Falls back to first org if unmatched | **MEDIUM — silent fallback to wrong org** |
| 4. Create conversation | `storage.createConversation()` | `storage.ts` | DONE — No try/catch in storage | Medium |
| 5. Store transcript | `storage.createMessage()` | `storage.ts` | DONE | Low |
| 6. Push to VIN Solutions | `callMCP('vin_create_contact')` | `vendorProxy.ts` | DONE | **HIGH — external dependency** |
| 7. Create escalation on VIN failure | `storage.createTask()` | `routes.ts` | DONE — Critical priority task | Low |
| 8. Notify org admins | `storage.createNotification()` | `routes.ts` | DONE | Low |
| 9. Activity log | `storage.createActivityLog()` | `routes.ts` | DONE — `vapi_call_received` | Low |

**Existing checkpoints:** Zod validation, activity log, notification, escalation task on failure  
**Missing checkpoints:** No trace ID linking webhook → conversation → VIN push. No idempotency key (duplicate webhook = duplicate records). No timing metrics.  
**Risk if silent failure:** HIGH — Lost leads, no VIN record, no salesperson notification

---

### Route 2: Campaign Execution → SMS Delivery (US-003, US-009, US-012)

| Step | System | File | Evidence | Risk |
|------|--------|------|----------|------|
| 1. User starts campaign | `POST /api/campaigns/:id/execute` | `routes.ts:992` | DONE | Low |
| 2. Start execution loop | `startCampaignExecution()` | `outbound.ts` | DONE — In-memory interval | **MEDIUM — lost on restart** |
| 3. Fetch next recipient | `storage.getPendingRecipients()` | `outbound.ts` | DONE | Low |
| 4. Template substitution | `substituteTemplate()` | `outbound.ts` | DONE | Low |
| 5. Gate check | `checkCommGate()` | `outbound.ts` | DONE — Kill switch, rate limit, channel flags | Low |
| 6. Send SMS | `sendSms()` → TextMagic API | `outbound.ts` | DONE | **HIGH — external dependency** |
| 7. Log attempt | `storage.createOutboundLog()` | `outbound.ts` | DONE — sent/blocked/failed | Low |
| 8. Log usage | `storage.logUsageEvent()` | `outbound.ts` | DONE | Low |
| 9. Update recipient status | `storage.updateRecipient()` | `outbound.ts` | DONE | Low |
| 10. Create task on block | `storage.createTask()` | `outbound.ts` | DONE — `unsent_message` type | Low |
| 11. Update campaign counters | `storage.updateCampaign()` | `outbound.ts` | DONE — sentCount, failedCount | Low |

**Existing checkpoints:** outbound_log, usage_events, recipient status, task escalation, campaign counters  
**Missing checkpoints:** No delivery confirmation callback from TextMagic. Execution state is in-memory only (lost on server restart). No campaign-level trace ID.  
**Risk if silent failure:** MEDIUM — Messages sent but not confirmed; blocked messages properly escalated

---

### Route 3: Inbound SMS → TeamBox Thread (US-015, US-017, US-020)

| Step | System | File | Evidence | Risk |
|------|--------|------|----------|------|
| 1. TextMagic forwards SMS | External webhook | — | — | — |
| 2. Webhook received | `POST /api/webhooks/textmagic` | `routes.ts:2691` | DONE — Rate limited | Low |
| 3. Phone normalization | Inline logic | `routes.ts` | DONE — Digits + leading `+` | Low |
| 4. Find existing conversation | `storage.getConversationByPhone()` | `storage.ts` | DONE | Low |
| 5. Create/update conversation | `storage.createConversation/updateConversation()` | `storage.ts` | DONE | Low |
| 6. Store message | `storage.createMessage()` | `storage.ts` | DONE — role: "user" | Low |
| 7. Notify admins | `storage.createNotification()` | `routes.ts` | DONE — `sms_inbound` type | Low |
| 8. Activity log | `storage.createActivityLog()` | `routes.ts` | DONE — `sms_inbound_received` | Low |

**Existing checkpoints:** Activity log, notification, conversation update  
**Missing checkpoints:** No idempotency (duplicate SMS = duplicate records). No auto-response logic (US-015 describes AI auto-reply — not implemented). No after-hours detection (US-021).  
**Risk if silent failure:** MEDIUM — Lost customer messages, no staff notification

---

### Route 4: AI Chat Streaming (US-006, US-014, US-016, US-029, US-030)

| Step | System | File | Evidence | Risk |
|------|--------|------|----------|------|
| 1. User sends message | `POST /api/chat/:conversationId/stream` | `routes.ts:1202` | DONE | Low |
| 2. Save user message | `storage.createMessage()` | `routes.ts` | DONE | Low |
| 3. Build context | Loads org, agents, docs, hunches, sync status | `routes.ts` | DONE — Comprehensive | Low |
| 4. Anthropic streaming call | `anthropic.messages.stream()` | `routes.ts` | DONE — SSE | **HIGH — LLM dependency** |
| 5. Tool use (VIN query) | `callMCP()` | `vendorProxy.ts` | DONE — Max 3 tool rounds | Medium |
| 6. Tool use (Brave search) | `braveSearch()` | `braveSearch.ts` | DONE — Graceful fallback | Low |
| 7. Save AI response | `storage.createMessage()` | `routes.ts` | DONE — After stream completes | Low |
| 8. Update conversation | `storage.updateConversation()` | `routes.ts` | DONE — lastMessageAt | Low |

**Existing checkpoints:** Messages saved before/after stream. Tool execution status sent via SSE.  
**Missing checkpoints:** No token usage tracking. No request-level trace ID. If stream fails mid-response, partial content may be lost. No activity log for chat interactions.  
**Risk if silent failure:** MEDIUM — User sees error in UI, but no server-side record of failure

---

### Route 5: Metrics Dashboard (US-007, US-011, US-023, US-024, US-025)

| Step | System | File | Evidence | Risk |
|------|--------|------|----------|------|
| 1. Frontend requests metrics | `GET /api/metrics/pipeline` | `routes.ts:1581` | DONE | Low |
| 2. DB query | `storage.getPipelineMetrics()` | `storage.ts` | DONE — From warehouse_metrics table | Low |
| 3. Background refresh | `runMetricsRefresh()` | `sync.ts` | DONE — Every 4h during business hours | Medium |
| 4. VIN data fetch | `callMCP('vin_lead_summary')` | `vendorProxy.ts` | DONE — External dependency | **HIGH** |
| 5. Upsert warehouse | `storage.upsertWarehouseMetric()` | `storage.ts` | DONE | Low |
| 6. Sync log | `storage.createSyncLog()` | `sync.ts` | DONE — running/completed/failed | Low |

**Existing checkpoints:** Sync log with status, activity log on refresh, console logging  
**Missing checkpoints:** No staleness indicator on dashboard (user doesn't know data age). No alert if sync fails repeatedly.  
**Risk if silent failure:** MEDIUM — Dashboard shows stale data with no indication

---

### Route 6: Kill Switch Enforcement (US-012, US-027, US-028)

| Step | System | File | Evidence | Risk |
|------|--------|------|----------|------|
| 1. Admin toggles kill switch | `PATCH /api/organizations/:id` | `routes.ts:636` | DONE — Activity logged | Low |
| 2. Campaign send attempted | `processOutboundSend()` | `outbound.ts` | DONE | Low |
| 3. Gate check | `checkCommGate()` | `outbound.ts` | DONE — Checks `outboundEnabled`, channel flags, rate limits | Low |
| 4. Message blocked | Returns `blocked` status | `outbound.ts` | DONE | Low |
| 5. Outbound log | `storage.createOutboundLog()` | `outbound.ts` | DONE — `blockedReason` captured | Low |
| 6. Escalation task | `storage.createTask()` | `outbound.ts` | DONE — `unsent_message` type | Low |

**Existing checkpoints:** Complete audit trail — outbound log, usage event, task escalation  
**Missing checkpoints:** No real-time notification to admin when messages are being blocked. No dashboard counter for blocked-in-last-hour.  
**Risk if silent failure:** LOW — This is the best-instrumented route in the system

---

### Route 7: User Authentication Flow (All Stories)

| Step | System | File | Evidence | Risk |
|------|--------|------|----------|------|
| 1. Login attempt | `POST /api/auth/login` | `routes.ts:62` | DONE — bcrypt verification | Low |
| 2. Session creation | `storage.createSession()` | `storage.ts` | DONE — Refresh token stored in DB | Low |
| 3. Token refresh | `POST /api/auth/refresh` | `routes.ts:155` | DONE — Rotation, old session deleted | Low |
| 4. Auth middleware | `authenticateToken()` | `auth.ts:55` | DONE — JWT verification, user hydration | Low |
| 5. RBAC check | `requireRole(level)` | `auth.ts:96` | DONE — Numeric level comparison | Low |
| 6. Org switch | `POST /api/auth/switch-org` | `routes.ts:244` | DONE — Re-issues tokens | Low |

**Existing checkpoints:** Session table tracks active sessions. Console logs for auth events.  
**Missing checkpoints:** No login/logout activity logging. No failed login attempt tracking. No brute force protection. No session count per user visibility.  
**Risk if silent failure:** MEDIUM — Auth is functional but not auditable

---

### Route 8: Background Sync Scheduler

| Step | System | File | Evidence | Risk |
|------|--------|------|----------|------|
| 1. Server starts | `startSyncScheduler()` | `sync.ts` | DONE — Called from registerRoutes | Low |
| 2. Metrics refresh (4h) | `runMetricsRefresh()` | `sync.ts` | DONE — Business hours only | Medium |
| 3. Daily delta (2 AM) | `runDailyDelta()` | `sync.ts` | DONE — 24h interval | Medium |
| 4. Sync log created | `storage.createSyncLog()` | `sync.ts` | DONE — Status tracking | Low |
| 5. Activity log | `storage.createActivityLog()` | `sync.ts` | DONE — sync_metrics_refreshed / sync_delta_failed | Low |

**Existing checkpoints:** sync_logs table, activity_logs, console output with [Sync] prefix  
**Missing checkpoints:** No alert mechanism for repeated failures. No heartbeat for scheduler liveness. State lost on restart.  
**Risk if silent failure:** HIGH — Data goes stale, nobody knows

---

## D. OBSERVABILITY GAP ANALYSIS

### What Exists (DONE)

| Capability | Implementation | Files |
|------------|---------------|-------|
| **Request logging middleware** | Timestamps, method, path, status, duration, response body | `server/index.ts:36-60` |
| **Activity log table** | 19 `createActivityLog()` calls across routes | `shared/schema.ts:210`, `server/routes.ts` |
| **Outbound log table** | Every SMS/email/phone attempt logged with status | `shared/schema.ts:184`, `server/outbound.ts` |
| **Sync log table** | Background job status tracking | `shared/schema.ts:297`, `server/sync.ts` |
| **Usage events table** | Channel-level usage tracking for billing | `shared/schema.ts:310`, `server/outbound.ts` |
| **Notification system** | Real-time user notifications for key events | `shared/schema.ts`, `server/routes.ts` |
| **Webhook validation** | VAPI secret check, TextMagic rate limiting | `server/routes.ts` |
| **RBAC enforcement** | `requireRole()` middleware on 10+ routes | `server/auth.ts:96` |
| **Kill switch gate** | Multi-level enforcement with audit trail | `server/outbound.ts` |
| **Seed data** | 3 orgs, multiple users, agents, campaigns, conversations | `server/seed.ts` |
| **Client-side error boundary** | `ErrorBoundary.tsx` catches React crashes | `client/src/components/ErrorBoundary.tsx` |
| **Token refresh with retry** | `tryRefreshToken()` deduplicates 401 retries | `client/src/lib/queryClient.ts` |

### What is Partially Implemented (PARTIAL)

| Capability | What Exists | What's Missing |
|------------|-------------|----------------|
| **Error handling in routes** | ~30 try/catch blocks across 86+ handlers | ~65% of route handlers lack try/catch — unhandled errors crash with generic 500 |
| **Console logging** | ~23 console.log/error calls in routes.ts | No structured format (not JSON), no log levels, no consistent prefixes |
| **External API error handling** | vendorProxy returns 502 on failure | No retry logic, no circuit breakers, no response time tracking |
| **Activity logging coverage** | 19 activity log entries | Missing: login/logout, chat interactions, metric views, campaign CSV uploads |
| **Frontend mock data** | 12 mock files in `client/src/mocks/` | Mocks exist alongside live data — unclear when mocks vs API are used; no test harness |
| **Campaign execution tracking** | In-memory `activeExecutions` Map + DB counters | In-memory state lost on restart; no recovery mechanism for interrupted campaigns |
| **Sync scheduler** | Runs on setInterval | No liveness check, no heartbeat, no scheduler health endpoint |

### What is Missing (MISSING)

| Capability | Impact | Priority |
|------------|--------|----------|
| **Correlation / Trace IDs** | Cannot trace a single request across webhook → DB → external API → response | CRITICAL |
| **Health check endpoint** | No `/health` or `/ping` — cannot verify server is alive | CRITICAL |
| **Automated tests** | Zero test files (no unit, integration, or e2e tests) | CRITICAL |
| **Transaction safety** | `deleteConversation` does 2 deletes without transaction; other multi-step ops similar | HIGH |
| **Idempotency on webhooks** | Duplicate VAPI/TextMagic webhooks create duplicate records | HIGH |
| **Login/logout audit logging** | Auth events not tracked in activity_log | HIGH |
| **Structured logging (JSON)** | Cannot parse logs programmatically | HIGH |
| **Error alerting** | No mechanism to alert on repeated failures | MEDIUM |
| **Response time metrics** | Request middleware logs duration to console but doesn't aggregate | MEDIUM |
| **External API call logging** | VAPI/Tavus/VIN proxy calls not logged to DB audit tables | MEDIUM |
| **Webhook delivery confirmation** | TextMagic SMS delivery status not tracked | MEDIUM |
| **Campaign recovery on restart** | Active campaign intervals lost when server restarts | MEDIUM |
| **Data staleness indicator** | Dashboard doesn't show when metrics were last refreshed | LOW |
| **Rate limiting on auth** | No brute force protection on login endpoint | LOW |

---

## E. TESTING READINESS SCORECARD

| Category | Score (0-5) | Rationale |
|----------|-------------|-----------|
| **Inputs discoverable** | 4 | All entry points are clearly defined in routes.ts. Public and authenticated endpoints are distinct. Webhook handlers are identifiable. |
| **Routes understandable** | 3 | Route-to-storage mapping is clean. But business logic is mixed into route handlers (not separated into service layer). Some routes are 100+ lines. |
| **Processing traceable** | 2 | Outbound pipeline has excellent tracing. Chat and sync have console logs. But no correlation IDs, no structured format, and most CRUD routes have no processing evidence beyond the DB write. |
| **Outputs verifiable** | 3 | DB writes are verifiable via direct query. Outbound sends have log tables. But external API responses are not persisted — you can verify "we tried to send" but not "TextMagic accepted it." |
| **Observability present** | 2 | 4 audit tables exist but coverage is inconsistent. Request middleware logs to stdout only. No metrics aggregation, no dashboards over the audit data itself. |
| **Integration test readiness** | 1 | No test framework installed. No test fixtures beyond seed data. No mocking infrastructure for external APIs. Frontend mocks exist but aren't wired to a test runner. |
| **Continuity test readiness** | 2 | Seed data provides a baseline. Activity log provides partial evidence. But without trace IDs, proving "this input produced this output through this path" requires manual DB correlation. |

**Overall: 2.4 / 5.0**

---

## F. TOP 10 HIGHEST PRIORITY GAPS

| # | Gap | Why It Matters | Effort |
|---|-----|----------------|--------|
| 1 | **No health check endpoint** | Cannot verify server liveness in automated testing or deployment monitoring. Blocks smoke tests. | 15 min |
| 2 | **No correlation/trace IDs** | Cannot link a webhook arrival to its downstream DB writes and external API calls. Makes continuity testing manual and fragile. | 2-3 hours |
| 3 | **~65% of routes lack try/catch** | Unhandled errors return generic 500 with no logging. Silent failures in CRUD operations are invisible. | 2-3 hours |
| 4 | **No automated tests** | Zero regression safety net. Every code change is tested manually or not at all. | Ongoing (framework: 1h, first suite: 4-6h) |
| 5 | **Webhook idempotency** | Duplicate VAPI/TextMagic webhooks create duplicate conversations and messages. Corrupts data silently. | 1-2 hours |
| 6 | **No login/logout audit trail** | Cannot prove who accessed the system and when. Compliance gap. | 30 min |
| 7 | **Campaign execution lost on restart** | If server restarts mid-campaign, the in-memory interval is gone. Campaign appears "active" in DB but no messages are being sent. | 2-3 hours |
| 8 | **No external API call audit logging** | VIN Solutions, VAPI, Tavus proxy calls aren't logged to DB. If a VIN push fails silently, there's no record. | 1-2 hours |
| 9 | **No structured logging format** | Console.log output cannot be parsed, filtered, or aggregated programmatically. Blocks log-based alerting. | 1-2 hours |
| 10 | **No transaction safety on multi-step ops** | `deleteConversation` (delete messages then conversation), user creation + notification, and other compound operations can leave partial state on failure. | 1-2 hours |

---

## G. RECOMMENDED NEXT ACTIONS

### Phase 1: Minimum Viable Observability (Estimated: 1 day)

These are the smallest changes that give the biggest testing leverage:

1. **Add `/api/health` endpoint** — Returns server status, DB connectivity, and timestamp. No auth required. Unblocks smoke testing.
   - File: `server/routes.ts`
   - Effort: 15 minutes

2. **Add request ID middleware** — Generate a UUID per request, attach to `req`, include in all log output and error responses. This is the single highest-leverage observability improvement.
   - File: `server/index.ts`
   - Effort: 30 minutes

3. **Add login/logout activity logging** — Two `createActivityLog()` calls in the auth routes.
   - File: `server/routes.ts` (lines 62, 144)
   - Effort: 15 minutes

4. **Wrap all route handlers in try/catch** — Create a helper `asyncHandler(fn)` that catches errors, logs them with request ID, and returns structured error responses.
   - File: `server/routes.ts`
   - Effort: 2 hours

5. **Add webhook idempotency** — Check for existing conversation with same `callId` (VAPI) or `messageId` (TextMagic) before creating duplicates.
   - Files: `server/routes.ts` (webhook handlers)
   - Effort: 1 hour

### Phase 2: Continuity Test Infrastructure (Estimated: 1-2 days)

6. **Create a structured logger** — Replace `console.log` with a simple JSON logger that includes timestamp, level, requestId, module, and message.
   - New file: `server/logger.ts`
   - Effort: 1 hour

7. **Add external API call logging** — Log every outbound HTTP call (URL, status, duration) to the activity log or a dedicated table.
   - Files: `server/vendorProxy.ts`, `server/outbound.ts`
   - Effort: 2 hours

8. **Add campaign recovery** — On server startup, check for campaigns with status "active" and resume their execution intervals.
   - File: `server/outbound.ts`
   - Effort: 2 hours

9. **Add transaction wrappers** — Use Drizzle's `db.transaction()` for compound operations (deleteConversation, user creation + notification).
   - File: `server/storage.ts`
   - Effort: 1-2 hours

### Phase 3: Automated Test Suite (Estimated: 2-3 days)

10. **Install test framework** — Vitest for backend, with supertest for API integration tests.
11. **Write smoke test suite** — Hit `/api/health`, login, verify token, hit key protected endpoints.
12. **Write continuity tests** — For each Route Map entry above, write a test that:
    - Creates the input
    - Follows the processing chain
    - Verifies all expected outputs (DB records, logs, notifications)
    - Verifies no unexpected side effects

---

## H. MINIMUM VIABLE OBSERVABILITY + CONTINUITY TEST PLAN

### Goal
Enable the ability to prove, for any user story, that "input X traveled through the system and produced outputs Y₁, Y₂, Y₃ at checkpoints C₁, C₂, C₃."

### Approach
Rather than building enterprise monitoring, we add **just enough instrumentation** to make each Route Map entry testable:

```
For each route:
  1. Can we trigger the input programmatically? (API call or webhook simulation)
  2. Can we observe that each processing step executed? (DB records, logs with request ID)
  3. Can we verify the outputs? (DB query, external API mock verification)
  4. Can we detect if a step was skipped? (Missing expected record = failure)
```

### Priority User Stories for First Continuity Tests

| Priority | User Story | Route | Why First |
|----------|-----------|-------|-----------|
| 1 | US-004 | VAPI Call → VIN Lead | Highest risk — external webhook, CRM push, multiple DB writes |
| 2 | US-009/US-012 | Campaign → SMS + Kill Switch | Revenue-critical + compliance-critical |
| 3 | US-015/US-017 | Inbound SMS → TeamBox | Customer-facing, silent failure = lost messages |
| 4 | US-006/US-030 | CRM Guru Query | Core differentiator — AI + VIN integration |
| 5 | US-027/US-028 | Kill Switch Test | Compliance — must prove messages are blocked |

### What We Do NOT Need Yet
- Distributed tracing (Jaeger/Zipkin) — overkill for current scale
- APM tools (DataDog/NewRelic) — the structured logger + audit tables give us enough
- Load testing — functional correctness first
- Visual regression testing — e2e UI tests cover this adequately

---

## I. USER STORY → CODE MAPPING

### Coverage Matrix

| US | Story | Backend Route | Frontend Page | Status |
|----|-------|--------------|---------------|--------|
| US-001 | Web Chat → VIN Lead | Widget + VAPI webhook | `/w/demo`, main.tsx | **PARTIAL** — Widget exists, VIN push exists in webhook. No direct widget→VIN flow (widget doesn't submit leads yet). |
| US-002 | Tavus Video Lead | Tavus proxy endpoints | main.tsx, AgentConfigPane | **PARTIAL** — Tavus personas/replicas readable. No appointment creation from video session. |
| US-003 | Form → Two-Way SMS | Campaign execute, TextMagic webhook | marketing.tsx, teambox.tsx | **DONE** — Campaign→SMS→TeamBox thread is fully wired. |
| US-004 | VAPI Inbound Call | `POST /api/webhooks/vapi` | teambox.tsx | **DONE** — Webhook creates conversation, pushes to VIN, notifies staff. |
| US-005 | Walk-In Auto-Followup | Sync scheduler (delta) + trigger | — | **PARTIAL** — Delta sync fetches new leads. No auto-trigger on "Walk-In" source detection. |
| US-006 | CRM Guru Research | Chat stream + MCP tool use | main.tsx (AI chat) | **DONE** — CRM Guru agent queries VIN via MCP in chat. |
| US-007 | Pipeline Review | `/api/metrics/pipeline` | main.tsx (metric tiles) | **DONE** — Live pipeline data with drill-down. |
| US-008 | Competitive Alert | — | — | **MISSING** — No alert/monitoring system for competitor data. |
| US-009 | Oil Change Campaign | Campaign CRUD + execute | marketing.tsx | **DONE** — Full campaign lifecycle with SMS delivery. |
| US-010 | Recall Notification | Campaign + TeamBox handover | teambox.tsx | **PARTIAL** — Campaign sends SMS. No explicit "handover from auto to human" toggle. |
| US-011 | Service Metrics | `/api/metrics/dashboard` | service.tsx | **DONE** — Service dashboard with live metrics. |
| US-012 | Opt-Out Check | Kill switch + comm gate | outbound.ts | **DONE** — Messages blocked, escalation tasks created. |
| US-013 | Widget Scheduling | Widget + calendar | AppointmentCalendar | **PARTIAL** — Calendar exists. No widget→appointment direct flow. |
| US-014 | Service Agent FAQ | Chat stream + knowledge docs | main.tsx | **DONE** — AI uses knowledge base docs for answers. |
| US-015 | SMS Inbound Query | TextMagic webhook | teambox.tsx | **PARTIAL** — Inbound SMS received and threaded. No AI auto-response on inbound SMS. |
| US-016 | AI List Generation | Chat stream + VIN query | main.tsx | **PARTIAL** — AI can query VIN. No "Export to Campaign" button from chat. |
| US-017 | SMS Handover | TextMagic webhook + TeamBox | teambox.tsx | **PARTIAL** — Thread opens on reply. No explicit "Take Over" / pause automation. |
| US-018 | TeamBox Filtering | — | teambox.tsx | **DONE** — Filtering by status, assignment, channel exists. |
| US-019 | Escalation Management | VAPI webhook (critical task) | teambox.tsx | **PARTIAL** — Critical tasks created. No sentiment-driven escalation in chat. |
| US-020 | Thread History | Conversation + messages model | teambox.tsx | **DONE** — Full conversation threading preserved. |
| US-021 | After-Hours Handling | — | — | **MISSING** — No business hours detection or auto-response logic. |
| US-022 | Multi-Store Oversight | Org switch + metrics | main.tsx, management.tsx | **DONE** — Partner admin can switch orgs and view cross-store data. |
| US-023 | Sales Manager Metrics | Pipeline metrics + tiles | main.tsx, sales.tsx | **DONE** — Live metric tiles with drill-down. |
| US-024 | Source Analysis | VIN lead sources | sales.tsx | **DONE** — Lead source breakdown from VIN data. |
| US-025 | Executive Demand Score | — | main.tsx | **PARTIAL** — Metric tiles exist. No AI-generated "Key Insights" explanation. |
| US-026 | Coaching Moment | Activity log + team data | management.tsx | **PARTIAL** — Activity feed exists. No "stalled lead" detection or coaching alerts. |
| US-027 | Master Kill Switch | Org update + comm gate | settings, outbound.ts | **DONE** — Kill switch toggleable, blocks all transmissions, escalations created. |
| US-028 | Channel Pause | Org channel flags + comm gate | settings | **DONE** — Per-channel enable/disable with gate enforcement. |
| US-029 | Email Draft | Chat stream (communication agent) | main.tsx | **DONE** — AI can draft emails based on vehicle/customer context. |
| US-030 | CRM Cross-Reference | Chat stream + VIN query | main.tsx | **DONE** — CRM Guru cross-references sales + service data via MCP. |

### Summary
- **DONE:** 18 / 30 (60%)
- **PARTIAL:** 10 / 30 (33%)
- **MISSING:** 2 / 30 (7%)

The 2 fully missing stories (US-008 Competitive Alerts, US-021 After-Hours) require new feature development. The 10 partial stories mostly need workflow automation connections (widget→lead, auto-response on inbound, handover toggles) rather than fundamental architecture changes.
