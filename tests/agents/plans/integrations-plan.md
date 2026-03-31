# Integrations Domain Test Plan (T-005)

Generated: 2026-03-31
Source: Code analysis of server/routes/webhooks.ts, server/routes/integrations.ts, server/routes/sms.ts, server/routes/proxy.ts, server/vendorProxy.ts, server/outbound.ts, server/sync.ts, tests/e2e/domain-11-integrations.spec.ts

---

## 1. Integration Provider Inventory

| Provider      | Protocol         | MCP Tool Names                                            | Inbound Webhook        | Auth Method         |
|---------------|------------------|-----------------------------------------------------------|------------------------|---------------------|
| VAPI          | central-mcp      | vapi_list_assistants, vapi_list_phone_numbers, vapi_list_calls, vapi_get_call, vapi_get_analytics, vapi_create_call | POST /api/webhooks/vapi | x-vapi-secret header |
| Tavus         | central-mcp      | tavus_list_personas, tavus_list_replicas, tavus_create_conversation, tavus_list_conversations, tavus_get_conversation | POST /api/webhooks/tavus | x-tavus-secret header |
| TextMagic     | central-mcp      | tm_send_message                                           | POST /api/webhooks/textmagic | x-textmagic-secret header |
| Resend        | central-mcp      | resend_send_email                                         | None (outbound only)   | N/A                 |
| VIN Solutions | vin-safe-mcp (port 4003) + central-mcp | vin_query_leads, vin_get_contact, vin_search_contacts, vin_get_lead_sources, vin_get_lead_statuses, vin_list_dealers, vin_token_status, vin_provision_dealer, vin_list_users, vin_get_trade_vehicles, vin_safe_prepare_lead, vin_safe_execute_lead | None | Bearer token |
| FAL (AI Image)| central-mcp      | fal_submit, fal_get_status, fal_get_result                | None                   | Bearer (session)    |
| OpenAI        | direct API       | N/A (direct fetch to api.openai.com)                      | None                   | OPENAI_API_KEY      |
| Google Maps   | direct API       | N/A (direct fetch to maps.googleapis.com)                 | None                   | GOOGLE_MAPS_API_KEY |

---

## 2. Webhook Endpoints

### 2.1 VAPI Webhook — POST /api/webhooks/vapi

- **Auth:** Optional x-vapi-secret / Authorization header (rejects 401 if set and mismatched)
- **Payload formats:** Two accepted schemas (union):
  - Old wrapped: `{ message: { type, call: {...} } }`
  - New flat: `{ type, call: {...}, artifact?: {...} }`
- **Processed events:** `end-of-call-report`, `call-ended` (others ignored with 200)
- **Org resolution:** assistantId matched against all orgs' agents (vapiAssistantId field); fallback to first org with active voice agent
- **Dedup:** In-memory Map keyed by call.id; duplicates update transcript if missing
- **Side effects:**
  - Creates conversation (channel=voice)
  - Creates VAPI message with transcript/summary
  - Sends admin notifications (in-app + email via resend_send_email)
  - AI transcript analysis via Claude (fires if transcript > 15s of call)
  - Billing usage event (voice_minute)
  - Activity log entry
- **VIN lead creation:** DISABLED (I-194) — code commented out with `if(false)` guard

### 2.2 VAPI Health Check — GET /api/webhooks/vapi

- Returns `{ status: "ok", service: "nexxus-connect-vapi-webhook" }`
- No auth required

### 2.3 Tavus Webhook — POST /api/webhooks/tavus

- **Auth:** Optional x-tavus-secret / x-webhook-secret header
- **Processed events:** `conversation.end`, `conversation_ended`, or status=`ended`
- **Org resolution:** persona_id matched against agents' tavusPersonaId; returns 400 if unresolvable (prevents tenant data leak)
- **Side effects:**
  - Creates conversation (channel=video)
  - Creates Tavus message with transcript/summary
  - VIN lead creation via vin-safe-mcp (prepare + execute) — ACTIVE for Tavus
  - Admin notifications (in-app + email)
  - AI transcript analysis
  - Activity log entry

### 2.4 TextMagic Webhook — POST /api/webhooks/textmagic

- **Route file:** server/routes/sms.ts (registered via registerSmsRoutes)
- **Auth:** Optional x-textmagic-secret / x-tm-signature header
- **Rate limit:** 30 requests/minute per IP
- **Payload:** `{ sender, text, receiver, timestamp? }`
- **Org resolution:** receiver phone matched via storage.getOrganizationByTextmagicPhone; fallback to last outbound log
- **Echo filter:** Ignores messages where sender matches org's own TextMagic number
- **STOP/START handling:** Processes opt-out keywords, manages blacklist
- **Side effects:**
  - Creates or updates SMS conversation
  - Creates message in conversation
  - Conversation lock (mutex) to prevent duplicate creation from concurrent webhooks (I-175)

---

## 3. MCP Call Paths

### 3.1 Central MCP (server/vendorProxy.ts)

- **Base URL:** `MCP_BASE_URL` env var (default: https://mcp.huminicdev.com)
- **Actual URL:** `VINSOLUTIONS_MCP_URL` env var (default: `${MCP_BASE_URL}/dax/mcp`)
- **Auth:** Bearer token from `VINSOLUTIONS_API_KEY`
- **Protocol:** JSON-RPC 2.0 over HTTPS; accepts SSE or JSON responses
- **callMCP(toolName, args):** Central dispatch function used by all routes

**Registered vendor proxy routes (GET, authenticated):**

| Route                                  | MCP Tool                    | Notes                    |
|----------------------------------------|-----------------------------|--------------------------|
| GET /api/vapi/assistants               | vapi_list_assistants        | Lists all VAPI assistants |
| GET /api/vapi/phone-numbers            | vapi_list_phone_numbers     |                          |
| GET /api/vapi/calls                    | vapi_list_calls             | Filters by assistantId   |
| GET /api/vapi/calls/:callId            | vapi_get_call               |                          |
| GET /api/vapi/analytics                | vapi_get_analytics          |                          |
| GET /api/tavus/personas                | tavus_list_personas         |                          |
| GET /api/tavus/replicas                | tavus_list_replicas         |                          |
| POST /api/tavus/conversations          | tavus_create_conversation   | TRIGGERS REAL TAVUS CALL |
| GET /api/tavus/conversations           | tavus_list_conversations    |                          |
| GET /api/vin/leads                     | vin_query_leads             |                          |
| GET /api/vin/leads/summary             | vin_query_leads (aggregated)|                          |
| GET /api/vin/lead-sources              | vin_get_lead_sources        |                          |
| GET /api/vin/lead-statuses             | vin_get_lead_statuses       |                          |
| GET /api/vin/dealers                   | vin_list_dealers            |                          |
| GET /api/vin/token-status              | vin_token_status            |                          |
| GET /api/vin/contacts/search           | vin_search_contacts         |                          |
| GET /api/vin/contacts/:contactId       | vin_get_contact             |                          |
| GET /api/vin/leads/:leadId/contact     | vin_get_contact (resolved)  |                          |
| GET /api/vin/leads/:leadId/trade-vehicles | vin_get_trade_vehicles   |                          |
| PATCH /api/vin/leads/:leadId           | vin_update_lead (inferred)  |                          |
| GET /api/vin/vehicle-catalog           | vin vehicle catalog         |                          |
| PUT /api/vin/contacts/:contactId       | vin contact update          |                          |
| POST /api/vin/leads/:leadId/vehicles-of-interest | vin VOI add        |                          |

### 3.2 VIN Safe MCP (server/routes/integrations.ts)

- **Base URL:** `VIN_SAFE_MCP_URL` env var (default: http://0.0.0.0:4003/mcp)
- **Auth:** Bearer token from `VIN_SAFE_MCP_TOKEN`
- **callVinSafeMCP(toolName, args):** Local function; JSON-RPC 2.0 over HTTP

| Route                             | MCP Tool             | Notes             |
|-----------------------------------|----------------------|-------------------|
| POST /api/integrations/provision  | vin_provision_dealer | Requires role >= 2 |
| GET /api/vin/users/:orgId         | vin_list_users       | Requires role >= 3 |

### 3.3 FAL Proxy (server/routes/proxy.ts)

| Route                    | MCP Tool        | Notes                     |
|--------------------------|-----------------|---------------------------|
| POST /api/fal-proxy      | fal_submit      | Submits generation job    |
| POST /api/fal-proxy/status | fal_get_status | Polls job status          |
| POST /api/fal-proxy/result | fal_get_result | Gets completed result     |

### 3.4 Outbound Sends (server/outbound.ts)

| Function     | MCP Tool          | Notes                              |
|--------------|-------------------|------------------------------------|
| sendSmsRaw   | tm_send_message   | TRIGGERS REAL SMS                  |
| sendEmail    | resend_send_email | TRIGGERS REAL EMAIL                |
| sendPhone    | vapi_create_call  | TRIGGERS REAL VAPI OUTBOUND CALL   |

---

## 4. Known Issues and State

| Issue  | Description                                                       | Status   |
|--------|-------------------------------------------------------------------|----------|
| I-194  | VAPI->VIN lead creation disabled (lead source name mismatch per dealer) | DISABLED |
| I-175  | TextMagic duplicate conversation creation from concurrent webhooks | FIXED (mutex lock) |
| I-177  | VAPI duplicate call processing                                    | FIXED (in-memory dedup map) |
| I-176  | VAPI transcript missing on first event                            | FIXED (dedup handler adds transcript) |
| I-102  | Photo Studio FAL returns 501                                     | KNOWN BUG |
| I-080  | Widget/assistant org mapping verification                        | Tests exist (11.10-11.14) |

---

## 5. Test Cases

### 5.1 VAPI Webhook Tests

| ID         | Name                                                    | Priority | Safety    | Status   |
|------------|---------------------------------------------------------|----------|-----------|----------|
| TC-INT-001 | VAPI webhook health check returns 200                   | P0       | SAFE      | EXISTS (implied in 11.2 precondition) |
| TC-INT-002 | VAPI webhook accepts end-of-call-report (old format)    | P0       | SAFE      | EXISTS (11.2) |
| TC-INT-003 | VAPI transcript appears in TeamBox conversation         | P0       | SAFE      | EXISTS (11.3) |
| TC-INT-004 | VAPI webhook rejects invalid payload with 400           | P1       | SAFE      | NEW      |
| TC-INT-005 | VAPI webhook rejects wrong secret with 401              | P1       | SAFE      | NEW      |
| TC-INT-006 | VAPI webhook accepts flat format (no message wrapper)   | P1       | SAFE      | NEW      |
| TC-INT-007 | VAPI webhook ignores non-end-of-call events with 200    | P2       | SAFE      | NEW      |
| TC-INT-008 | VAPI webhook returns 422 when assistantId unresolvable  | P1       | SAFE      | NEW      |
| TC-INT-009 | VAPI dedup: second call with same ID returns deduplicated=true | P1 | SAFE     | NEW      |
| TC-INT-010 | VAPI dedup: second event adds transcript to existing conversation | P2 | SAFE  | NEW      |
| TC-INT-011 | VAPI webhook creates notification for admin users       | P2       | SAFE      | NEW      |
| TC-INT-012 | VAPI->VIN pipeline is DISABLED (I-194 guard active)     | P0       | SAFE      | NEW      |

**TC-INT-004: VAPI webhook rejects invalid payload**
- Steps: POST /api/webhooks/vapi with `{ "garbage": true }`
- Expected: 400 with message "Invalid webhook payload"

**TC-INT-005: VAPI webhook rejects wrong secret**
- Steps: POST /api/webhooks/vapi with header `x-vapi-secret: wrong-secret` (requires VAPI_WEBHOOK_SECRET to be set on server)
- Expected: 401 "Unauthorized"
- Note: If VAPI_WEBHOOK_SECRET is not set, auth check is skipped; test may need environment awareness

**TC-INT-006: VAPI webhook accepts flat format**
- Steps: POST /api/webhooks/vapi with `{ type: "end-of-call-report", call: { id: "flat-test-001", assistantId: "<known-id>", customer: { number: "+15559999999" }, transcript: "Test transcript" } }`
- Expected: 200 with conversationId in response

**TC-INT-007: VAPI webhook ignores non-end-of-call events**
- Steps: POST /api/webhooks/vapi with `{ message: { type: "speech-update", call: { id: "test" } } }`
- Expected: 200 with `{ message: "Event type ignored", type: "speech-update" }`

**TC-INT-008: VAPI webhook returns 422 for unknown assistantId**
- Steps: POST /api/webhooks/vapi with `{ message: { type: "end-of-call-report", call: { id: "unknown-test", assistantId: "00000000-0000-0000-0000-000000000000", customer: { number: "+15550000000" } } } }`
- Expected: 422 if no org has an active voice agent (or 200 if fallback succeeds)

**TC-INT-009: VAPI dedup test**
- Steps:
  1. POST /api/webhooks/vapi with call ID "dedup-test-001" and valid assistantId
  2. POST /api/webhooks/vapi with same call ID "dedup-test-001"
- Expected: Second response includes `deduplicated: true`

**TC-INT-012: VAPI->VIN pipeline is DISABLED**
- Steps: POST /api/webhooks/vapi with valid payload; check response
- Expected: Response has `vinLeadCreated: false` (disabled code path)
- Rationale: I-194 disabled VIN lead creation from VAPI due to per-dealer lead source name mismatch

---

### 5.2 Tavus Webhook Tests

| ID         | Name                                                    | Priority | Safety    | Status   |
|------------|---------------------------------------------------------|----------|-----------|----------|
| TC-INT-020 | Tavus webhook rejects missing event/status with 400     | P1       | SAFE      | NEW      |
| TC-INT-021 | Tavus webhook ignores non-end events with 200           | P2       | SAFE      | NEW      |
| TC-INT-022 | Tavus webhook rejects unresolvable persona_id with 400  | P1       | SAFE      | NEW      |
| TC-INT-023 | Tavus webhook processes conversation.end event          | P0       | SAFE      | NEW      |
| TC-INT-024 | Tavus webhook rejects wrong secret with 401             | P1       | SAFE      | NEW      |
| TC-INT-025 | Tavus personas endpoint returns list per org            | P1       | SAFE      | EXISTS (11.7) |
| TC-INT-026 | Widget video session creates Tavus conversation         | P1       | MOCK-ONLY | EXISTS (11.8) |

**TC-INT-020: Tavus webhook rejects missing event/status**
- Steps: POST /api/webhooks/tavus with `{ conversation_id: "test-123" }` (no event or status field)
- Expected: 400 "Missing required field: event or status"

**TC-INT-022: Tavus webhook rejects unresolvable persona_id**
- Steps: POST /api/webhooks/tavus with `{ event: "conversation.end", conversation_id: "test-456", persona_id: "nonexistent-persona" }`
- Expected: 400 "Unable to resolve organization from persona"

**TC-INT-023: Tavus webhook processes conversation.end**
- Steps: POST /api/webhooks/tavus with `{ event: "conversation.end", conversation_id: "e2e-tavus-001", persona_id: "<known-persona-id>" }`
- Expected: 200 with conversationId; conversation created with channel=video
- Note: Will attempt VIN lead creation via vin-safe-mcp (live call). If vin-safe-mcp is down, should still return 200 for the conversation but log VIN error.
- Safety: VIN lead creation IS active for Tavus (unlike VAPI). Test with unknown persona to avoid real VIN writes.

**TC-INT-026: Widget video session (11.8)**
- Safety: MOCK-ONLY. POST /api/widget/video-session calls tavus_create_conversation via central-mcp, which TRIGGERS A REAL TAVUS API CALL and potentially billing.

---

### 5.3 TextMagic Webhook Tests

| ID         | Name                                                    | Priority | Safety    | Status   |
|------------|---------------------------------------------------------|----------|-----------|----------|
| TC-INT-030 | TextMagic webhook accepts valid inbound SMS             | P0       | SAFE      | EXISTS (11.4) |
| TC-INT-031 | TextMagic webhook rejects missing sender/text with 400  | P1       | SAFE      | NEW      |
| TC-INT-032 | TextMagic webhook rejects wrong secret with 401         | P1       | SAFE      | NEW      |
| TC-INT-033 | TextMagic webhook rate limits at 30/min per IP          | P2       | SAFE      | NEW      |
| TC-INT-034 | TextMagic webhook ignores outbound echo (sender=org phone) | P2    | SAFE      | NEW      |
| TC-INT-035 | TextMagic webhook routes to correct org by receiver phone | P1     | SAFE      | NEW      |
| TC-INT-036 | TextMagic STOP keyword creates blacklist entry          | P1       | SAFE      | NEW      |

**TC-INT-031: TextMagic rejects missing fields**
- Steps: POST /api/webhooks/textmagic with `{ sender: "+15551234567" }` (no text)
- Expected: 400 "Missing sender or text in webhook payload"

**TC-INT-035: TextMagic routes to correct org**
- Steps: POST /api/webhooks/textmagic with sender "+15551234567" and receiver set to a known org's TextMagic number
- Expected: 200, conversation created for that org

---

### 5.4 Outbound Send Tests

| ID         | Name                                                    | Priority | Safety     | Status   |
|------------|---------------------------------------------------------|----------|------------|----------|
| TC-INT-040 | SMS send via tm_send_message MCP                        | P0       | MOCK-ONLY  | NEW      |
| TC-INT-041 | Email send via resend_send_email MCP                    | P0       | MOCK-ONLY  | NEW      |
| TC-INT-042 | Phone call via vapi_create_call MCP                     | P0       | MOCK-ONLY  | NEW      |
| TC-INT-043 | VAPI outbound includes callContext (campaign execute)    | P1       | SAFE (dryRun) | EXISTS (11.6) |
| TC-INT-044 | Outbound respects CommGate (outbound_enabled flag)       | P1       | SAFE       | NEW      |
| TC-INT-045 | Outbound respects blacklist for SMS                      | P1       | SAFE       | NEW      |

**TC-INT-040/041/042: Outbound sends**
- Safety: MOCK-ONLY. These call real external APIs (TextMagic, Resend, VAPI). Must NOT be run against production or dev without mocking the MCP layer.
- Verification approach: Code path analysis only, or test with OUTBOUND_LIVE_ENABLED=false / dryRun=true

**TC-INT-044: CommGate enforcement**
- Steps: Verify that sendLeadNotificationEmail checks org.outboundEnabled and org.emailEnabled before sending
- Expected: If either flag is false, email is skipped with `{ sent: 0, skipped: true }`

---

### 5.5 VIN Solutions Integration Tests

| ID         | Name                                                    | Priority | Safety    | Status   |
|------------|---------------------------------------------------------|----------|-----------|----------|
| TC-INT-050 | VIN leads endpoint returns data scoped to user's org    | P0       | SAFE      | EXISTS (11.9) |
| TC-INT-051 | VIN token-status endpoint responds                      | P1       | SAFE      | NEW      |
| TC-INT-052 | VIN lead-sources endpoint responds                      | P1       | SAFE      | NEW      |
| TC-INT-053 | VIN lead-statuses endpoint responds                     | P1       | SAFE      | NEW      |
| TC-INT-054 | VIN dealers endpoint responds                           | P1       | SAFE      | NEW      |
| TC-INT-055 | VIN contacts search endpoint responds                   | P2       | SAFE      | NEW      |
| TC-INT-056 | VIN users endpoint (vin-safe-mcp) responds              | P1       | SAFE      | NEW      |
| TC-INT-057 | Integration provision endpoint creates integration record | P1     | MOCK-ONLY | NEW      |
| TC-INT-058 | VIN leads require authentication (401 without token)    | P0       | SAFE      | NEW      |
| TC-INT-059 | VIN users requires role >= 3                            | P1       | SAFE      | NEW      |
| TC-INT-060 | Integration provision requires role >= 2                | P1       | SAFE      | NEW      |

**TC-INT-051 through TC-INT-055: VIN read endpoints**
- Steps: GET each endpoint with valid auth token
- Expected: < 500 status. 200 with data if VIN integration is configured for org; 502 if central-mcp is down; 404 if no integration configured
- Safety: SAFE. These are read-only queries against VIN Solutions via MCP proxy.

**TC-INT-057: Integration provision**
- Safety: MOCK-ONLY. Calls vin_provision_dealer on central-mcp which creates a real dealer integration in VIN Solutions.

---

### 5.6 FAL (AI Image) Proxy Tests

| ID         | Name                                                    | Priority | Safety     | Status   |
|------------|---------------------------------------------------------|----------|------------|----------|
| TC-INT-070 | FAL proxy submit requires auth                          | P0       | SAFE       | NEW      |
| TC-INT-071 | FAL proxy submit requires endpoint parameter            | P1       | SAFE       | NEW      |
| TC-INT-072 | FAL proxy status requires requestId and endpoint        | P1       | SAFE       | NEW      |
| TC-INT-073 | FAL proxy result requires requestId and endpoint        | P1       | SAFE       | NEW      |
| TC-INT-074 | FAL proxy submit with valid model submits job           | P1       | MOCK-ONLY  | NEW      |
| TC-INT-075 | FAL proxy returns 502 when MCP is unreachable           | P2       | SAFE       | NEW      |

**TC-INT-071: FAL submit missing endpoint**
- Steps: POST /api/fal-proxy with auth, body `{ input: {} }` (no endpoint)
- Expected: 400 "endpoint is required"

**TC-INT-074: FAL submit with valid model**
- Safety: MOCK-ONLY. Calls fal_submit on central-mcp which triggers a real FAL AI generation job with associated costs.
- Note: I-102 reports Photo Studio FAL returns 501 — this is a known bug.

---

### 5.7 Integration Management Tests

| ID         | Name                                                    | Priority | Safety    | Status   |
|------------|---------------------------------------------------------|----------|-----------|----------|
| TC-INT-080 | GET /api/integrations lists integrations for org        | P1       | SAFE      | NEW      |
| TC-INT-081 | GET /api/integrations filters by provider               | P2       | SAFE      | NEW      |
| TC-INT-082 | GET /api/integrations requires auth (401)               | P0       | SAFE      | NEW      |

**TC-INT-080: List integrations**
- Steps: GET /api/integrations with valid auth token
- Expected: 200 with array of integration records for the user's org

---

### 5.8 Public Endpoint / Widget Tests

| ID         | Name                                                    | Priority | Safety    | Status   |
|------------|---------------------------------------------------------|----------|-----------|----------|
| TC-INT-090 | Public widget endpoints work without auth               | P0       | SAFE      | EXISTS (11.1) |
| TC-INT-091 | Landing page returns correct dealer name per slug       | P0       | SAFE      | EXISTS (11.10) |
| TC-INT-092 | Voice config returns vapiAssistantId per dealer         | P0       | SAFE      | EXISTS (11.11) |
| TC-INT-093 | Voice config returns tavusPersonaId per dealer          | P0       | SAFE      | EXISTS (11.12) |
| TC-INT-094 | Widget embed JS serves per org                          | P1       | SAFE      | EXISTS (11.13) |
| TC-INT-095 | Widget options available (Chat, Voice, Video, Form)     | P1       | SAFE      | EXISTS (11.14) |

---

### 5.9 MCP Health and Error Handling Tests

| ID         | Name                                                    | Priority | Safety    | Status   |
|------------|---------------------------------------------------------|----------|-----------|----------|
| TC-INT-100 | MCP status endpoint responds                            | P0       | SAFE      | EXISTS (11.5) |
| TC-INT-101 | callMCP rejects if VINSOLUTIONS_API_KEY not configured  | P1       | SAFE      | NEW      |
| TC-INT-102 | VIN endpoints return 502 when central-mcp unreachable   | P1       | SAFE      | NEW      |
| TC-INT-103 | FAL proxy returns 502 when central-mcp unreachable      | P1       | SAFE      | NEW      |
| TC-INT-104 | OpenAI proxy returns 503 when OPENAI_API_KEY missing    | P1       | SAFE      | NEW      |
| TC-INT-105 | Maps proxy returns 503 when GOOGLE_MAPS_API_KEY missing | P1       | SAFE      | NEW      |

**TC-INT-101: callMCP rejects without API key**
- Verification approach: Code analysis confirms vendorProxy.ts line 28 rejects with "VINSOLUTIONS_API_KEY not configured" if env var is missing
- This is an environment configuration test; cannot easily test in E2E without manipulating env vars

**TC-INT-102/103: MCP unreachable**
- Steps: If central-mcp is down, GET /api/vin/leads with auth
- Expected: 502 "Failed to fetch" or similar
- Note: These tests are opportunistic — they pass when MCP is healthy (200) and also validate error handling when MCP is down (502)

---

### 5.10 Notification and Email Pipeline Tests

| ID         | Name                                                    | Priority | Safety     | Status   |
|------------|---------------------------------------------------------|----------|------------|----------|
| TC-INT-110 | Lead notification email respects CommGate                | P1       | SAFE       | NEW      |
| TC-INT-111 | Lead notification email has idempotency check            | P2       | SAFE       | NEW      |
| TC-INT-112 | Lead notification email resolves multi-level recipients  | P2       | SAFE       | NEW      |
| TC-INT-113 | Lead notification email excludes test patterns           | P2       | SAFE       | NEW      |

**TC-INT-110: CommGate enforcement**
- Verification: sendLeadNotificationEmail checks org.outboundEnabled and org.emailEnabled. If either false, returns `{ sent: 0, skipped: true }`
- Code path: webhooks.ts lines 162-165

**TC-INT-111: Idempotency**
- Verification: sendLeadNotificationEmail checks outbound_log for existing entry with `[notification:<key>]` before sending
- Code path: webhooks.ts lines 168-175

**TC-INT-112: Multi-level recipients**
- Recipient hierarchy: Level 3 org admins -> Level 2 partner admins (via partner_id) -> Level 1 super admins (all orgs) -> Additional org users
- Code path: webhooks.ts lines 181-228

---

## 6. Safety Classification Summary

| Classification | Count | Description                                           |
|----------------|-------|-------------------------------------------------------|
| SAFE           | 45    | Read-only, webhook simulation with test data, no real external API calls |
| MOCK-ONLY      | 7     | Would trigger real external API calls (VAPI, Tavus, TextMagic, Resend, FAL, VIN provision) |
| SKIP           | 0     | None — all tests either safe or explicitly mock-only   |

**MOCK-ONLY tests must NOT be run against dev or production without:**
1. Mocking the callMCP function at the server level, OR
2. Using dryRun=true where supported (campaigns only), OR
3. Pointing MCP_BASE_URL to a mock server

---

## 7. Coverage Matrix

| Sub-domain              | P0 | P1 | P2 | Total | Existing | New |
|-------------------------|----|----|-----|-------|----------|-----|
| VAPI Webhook            | 3  | 5  | 4   | 12    | 2        | 10  |
| Tavus Webhook           | 1  | 3  | 2   | 6     | 2        | 4   |
| TextMagic Webhook       | 1  | 3  | 3   | 7     | 1        | 6   |
| Outbound Sends          | 3  | 2  | 1   | 6     | 1        | 5   |
| VIN Solutions           | 2  | 6  | 3   | 11    | 1        | 10  |
| FAL Proxy               | 1  | 3  | 2   | 6     | 0        | 6   |
| Integration Mgmt        | 1  | 1  | 1   | 3     | 0        | 3   |
| Public/Widget           | 2  | 2  | 2   | 6     | 6        | 0   |
| MCP Health/Errors       | 1  | 3  | 2   | 6     | 1        | 5   |
| Notification Pipeline   | 0  | 1  | 3   | 4     | 0        | 4   |
| **TOTAL**               | **15** | **29** | **23** | **67** | **14** | **53** |
