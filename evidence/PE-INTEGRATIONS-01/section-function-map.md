# Section-Function Map: PE-INTEGRATIONS-01

**Date:** 2026-04-06
**Sprint:** PE-INTEGRATIONS-01 -- Comms Integrations -- TextMagic, VAPI, Tavus, Resend, and Downstream Truth in Nexxus

---

## 1. TextMagic (SMS)

### What It Does
Handles bidirectional SMS messaging between dealership operators/campaigns and customers.

### Send Path (Nexxus -> TextMagic -> Customer)
| Component | File | Function | Description |
|-----------|------|----------|-------------|
| Send orchestrator | server/outbound.ts | `processOutboundSend()` | CommGate check (org enabled, channel enabled, TCPA hours, kill switch, blacklist, rate limit), then dispatches to channel handler |
| SMS sender | server/outbound.ts | `sendSms()` | Validates phone, checks blacklist, calls `sendSmsRaw()` |
| Raw SMS via MCP | server/outbound.ts | `sendSmsRaw()` | Calls `callMCP("tm_send_message", { text, phones, from? })` via central-mcp (port 4002) |
| Campaign execution | server/outbound.ts | `executeCampaign()` | Iterates recipients, substitutes template tokens, calls `processOutboundSend()` per recipient with interval delay |
| Outbound log | server/outbound.ts | `logAttempt()` | Records every send/block/fail to `outbound_log` table |

### Receive Path (Customer -> TextMagic -> Nexxus)
| Component | File | Function | Description |
|-----------|------|----------|-------------|
| Webhook endpoint | server/routes/sms.ts | `POST /api/webhooks/textmagic` | Receives inbound SMS, validates secret, rate-limits |
| Org resolution | server/routes/sms.ts | (inline) | Resolves org via: receiver TextMagic number -> outbound history -> contact phone -> single-org fallback |
| STOP handling | server/routes/sms.ts | (inline) | Detects STOP/UNSUBSCRIBE keywords, creates blacklist entry, closes conversations, sends confirmation |
| After-hours | server/routes/sms.ts | (inline) | Checks org business hours, sends auto-response, queues follow-up for next morning |
| Conversation creation | server/routes/sms.ts | `withConversationLock()` | Creates or updates conversation with mutex to prevent duplicates (I-175) |
| Campaign linking | server/routes/sms.ts | (inline) | Links reply to campaign via `findLastOutboundForPhone()`, injects vehicle context (I-192) |
| AI agent response | server/routes/sms.ts | (inline, fire-and-forget) | If not after-hours and no human takeover, generates Claude AI response and sends via SMS |
| Auto-greeting | server/routes/sms.ts | (inline, fire-and-forget) | For new conversations, sends auto-greeting from active agent with after-hours template support |

### Nexxus-Side Visibility
- Conversations appear in TeamBox under SMS channel
- Messages visible in conversation thread
- Campaign-linked conversations have `campaignId` in DB but no visible badge in TeamBox UI
- Outbound logs visible in admin activity logs
- Blacklist entries viewable via `GET /api/sms-blacklist`

---

## 2. VAPI (Voice / Phone Calls)

### What It Does
Handles AI-powered voice calls -- both inbound (customer calls dealership) and outbound (campaign-initiated).

### Outbound Call Path (Nexxus -> VAPI -> Customer)
| Component | File | Function | Description |
|-----------|------|----------|-------------|
| Send orchestrator | server/outbound.ts | `processOutboundSend()` | CommGate check, then dispatches to `sendPhone()` |
| Phone sender | server/outbound.ts | `sendPhone()` | Resolves VAPI assistantId and phoneNumberId from org agents/settings, builds call args with context overrides |
| Call via MCP | server/outbound.ts | (inline) | Calls `callMCP("vapi_create_call", { assistantId, customerNumber, phoneNumberId?, assistantOverrides? })` |

### Inbound/Completed Call Path (VAPI -> Nexxus)
| Component | File | Function | Description |
|-----------|------|----------|-------------|
| Webhook endpoint | server/routes/webhooks.ts | `POST /api/webhooks/vapi` | Receives end-of-call-report / call-ended events, validates secret |
| Payload normalization | server/routes/webhooks.ts | (inline) | Handles both old (wrapped in `message`) and new (flat) VAPI payload formats |
| Transcript extraction | server/routes/webhooks.ts | (inline) | Extracts from: `call.transcript`, `call.artifact.transcript`, `messages` array, top-level `artifact` |
| Org resolution | server/routes/webhooks.ts | (inline) | Resolves org by matching `assistantId` against agents table; fallback to any org with active voice agent |
| Dedup | server/routes/webhooks.ts | `processedVapiCalls` Map | Prevents duplicate conversations from concurrent webhooks (I-177) |
| Conversation creation | server/routes/webhooks.ts | (inline) | Creates voice conversation with transcript stored as system message from "VAPI" |
| VIN lead creation | server/routes/webhooks.ts | (inline) | Via vin-safe-mcp (port 4003): prepare -> execute -> verify. Skips test phones (555-prefix) and no-transcript calls |
| AI transcript analysis | server/routes/webhooks.ts | `analyzeTranscriptWithClaude()` | Claude extracts appointment intent, vehicle interest, lead quality score. Creates appointment if intent detected. |
| Email notification | server/routes/webhooks.ts | `sendLeadNotificationEmail()` | HTML email to all admin users (level 1-3) with call details, transcript, recording link |
| Billing | server/routes/webhooks.ts | (inline) | Emits `voice_minute` usage event for billing |

### Read Endpoints (Nexxus -> VAPI)
| Endpoint | File | Description |
|----------|------|-------------|
| `GET /api/vapi/assistants` | server/vendorProxy.ts | Lists VAPI assistants via `vapi_list_assistants` MCP tool |
| `GET /api/vapi/phone-numbers` | server/vendorProxy.ts | Lists VAPI phone numbers via `vapi_list_phone_numbers` |
| `GET /api/vapi/calls` | server/vendorProxy.ts | Lists recent calls via `vapi_list_calls` |
| `GET /api/vapi/calls/:callId` | server/vendorProxy.ts | Gets single call detail via `vapi_get_call` |
| `GET /api/vapi/analytics` | server/vendorProxy.ts | Gets call stats via `vapi_get_analytics` |

### Nexxus-Side Visibility
- Conversations appear in TeamBox under Voice channel
- Transcript and summary stored as system message from "VAPI" senderName
- Appointments created on Calendar page if AI detects intent
- Lead quality scores updated in warehouse leads
- Admin notifications (in-app + email)
- VIN Solutions lead created (when applicable)

---

## 3. Tavus (Video)

### What It Does
Handles AI-powered video conversations where website visitors interact with a digital replica.

### Session Creation (Nexxus -> Tavus)
| Component | File | Function | Description |
|-----------|------|----------|-------------|
| Create session | server/vendorProxy.ts | `POST /api/tavus/conversations` | Creates Tavus conversation via `tavus_create_conversation` MCP tool with persona_id, callback_url, optional visitor name |

### Session Completed (Tavus -> Nexxus)
| Component | File | Function | Description |
|-----------|------|----------|-------------|
| Webhook endpoint | server/routes/webhooks.ts | `POST /api/webhooks/tavus` | Receives conversation.end / conversation_ended / status=ended events |
| Data fetch | server/routes/webhooks.ts | (inline) | Fetches full conversation data via `tavus_get_conversation` MCP tool |
| Org resolution | server/routes/webhooks.ts | (inline) | Resolves org by matching `persona_id` against agents table `tavusPersonaId` |
| Conversation creation | server/routes/webhooks.ts | (inline) | Creates video conversation with transcript stored as system message from "Tavus" |
| VIN lead creation | server/routes/webhooks.ts | (inline) | Same vin-safe-mcp flow as VAPI (prepare -> execute -> verify). Requires transcript/summary. |
| AI transcript analysis | server/routes/webhooks.ts | `analyzeTranscriptWithClaude()` | Same analysis as VAPI -- appointment intent, lead score |
| Email notification | server/routes/webhooks.ts | `sendLeadNotificationEmail()` | Same admin email with video-specific styling (purple gradient) |

### Read Endpoints (Nexxus -> Tavus)
| Endpoint | File | Description |
|----------|------|-------------|
| `GET /api/tavus/personas` | server/vendorProxy.ts | Lists Tavus personas via `tavus_list_personas` |
| `GET /api/tavus/replicas` | server/vendorProxy.ts | Lists Tavus replicas via `tavus_list_replicas` |
| `GET /api/tavus/conversations` | server/vendorProxy.ts | Lists conversations (scoped to org's persona IDs) |

### Nexxus-Side Visibility
- Conversations appear in TeamBox under Video channel
- Transcript stored as system message from "Tavus" senderName
- Appointments and lead scores same as VAPI
- Admin notifications (in-app + email with video styling)

---

## 4. Resend (Email)

### What It Does
Sends transactional and campaign emails via the Resend API.

### Send Paths
| Component | File | Function | Description |
|-----------|------|----------|-------------|
| Campaign/direct email | server/outbound.ts | `sendEmail()` | Validates email format, calls `callMCP("resend_send_email", { from, to, subject, html })` |
| Lead notification email | server/routes/webhooks.ts | `sendLeadNotificationEmail()` | Resolves admin recipients across org hierarchy (L3 org admins, L2 partner admins, L1 super admins, additional_org_ids users), sends HTML email via `callMCP("resend_send_email")` |
| STOP confirmation | server/outbound.ts | `sendStopConfirmation()` | Sends SMS (not email) unsubscribe confirmation -- uses TextMagic, not Resend |

### From Address
All emails sent from: `Nexxus Connect <notifications@huminic.ai>`

### Nexxus-Side Visibility
- Outbound emails logged in `outbound_log` table
- Lead notification emails include idempotency check to prevent duplicates
- No dedicated email inbox UI in Nexxus -- emails are fire-and-forget notifications
- Campaign emails appear as outbound log entries

---

## 5. VIN Solutions (CRM)

### What It Does
Creates leads and contacts in the dealership's VIN Solutions CRM when AI calls or video sessions complete.

### Write Path (Nexxus -> VIN Safe MCP -> VIN Solutions)
| Component | File | Function | Description |
|-----------|------|----------|-------------|
| VAPI -> VIN | server/routes/webhooks.ts | (inline in VAPI handler) | prepare -> execute -> verify via vin-safe-mcp REST API (port 4003) |
| Tavus -> VIN | server/routes/webhooks.ts | (inline in Tavus handler) | Same flow as VAPI |
| Safety guards | server/routes/webhooks.ts | (inline) | Skips: test phones (555-prefix), no-transcript calls, no-phone calls |

### Read Path (Nexxus -> Central MCP -> VIN Solutions)
| Endpoint | File | Description |
|----------|------|-------------|
| `GET /api/vin/leads` | server/vendorProxy.ts | Queries leads via `vin_query_leads` MCP tool (central-mcp, port 4002) |
| `GET /api/vin/leads/summary` | server/vendorProxy.ts | Aggregates lead stats from warehouse_leads table |
| `GET /api/vin/contacts/:contactId` | server/vendorProxy.ts | Gets contact detail |

### Nexxus-Side Visibility
- VIN lead creation status shown in VAPI/Tavus webhook admin notifications (email)
- Lead data synced to warehouse_leads table for dashboard display
- Escalation tasks created on failure (type: "escalation", priority: "critical")
- Activity log entries for success/failure

---

## 6. MCP Integration Layer

### What It Does
Central proxy for all third-party API calls. Routes through central-mcp (port 4002) for reads and general sends, vin-safe-mcp (port 4003) for VIN writes.

| Component | File | Function | Description |
|-----------|------|----------|-------------|
| MCP client | server/vendorProxy.ts | `callMCP()` | JSON-RPC 2.0 over HTTPS to central-mcp. Handles SSE response parsing. |
| Org ID resolution | server/vendorProxy.ts | `resolveNexxusOrgId()` | Maps local org UUID to VIN Solutions org ID via env var or integrations table |
| Integration cache | server/vendorProxy.ts | `warmIntegrationCache()` | Populates org ID mapping from DB on first miss |
| Contact flattening | server/vendorProxy.ts | `flattenContactInfo()` | Normalizes VIN Solutions contact data structure |

### MCP Tools Used
| Tool Name | Provider | Direction | Called From |
|-----------|----------|-----------|------------|
| `tm_send_message` | TextMagic | Send SMS | outbound.ts |
| `resend_send_email` | Resend | Send email | outbound.ts, webhooks.ts |
| `vapi_create_call` | VAPI | Initiate call | outbound.ts |
| `vapi_list_assistants` | VAPI | Read | vendorProxy.ts |
| `vapi_list_phone_numbers` | VAPI | Read | vendorProxy.ts |
| `vapi_list_calls` | VAPI | Read | vendorProxy.ts |
| `vapi_get_call` | VAPI | Read | vendorProxy.ts |
| `vapi_get_analytics` | VAPI | Read | vendorProxy.ts |
| `tavus_list_personas` | Tavus | Read | vendorProxy.ts |
| `tavus_list_replicas` | Tavus | Read | vendorProxy.ts |
| `tavus_create_conversation` | Tavus | Create session | vendorProxy.ts |
| `tavus_list_conversations` | Tavus | Read | vendorProxy.ts |
| `tavus_get_conversation` | Tavus | Read | webhooks.ts |
| `vin_query_leads` | VIN Solutions | Read | vendorProxy.ts |
| `vin_safe_prepare_lead` | VIN Solutions | Prepare (read) | webhooks.ts (via vin-safe-mcp) |
| `vin_safe_execute_lead` | VIN Solutions | Write (gated) | webhooks.ts (via vin-safe-mcp) |
