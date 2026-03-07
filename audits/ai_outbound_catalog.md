# AI, Chat & Outbound Systems Audit

## 1. AI Integration Details

### Anthropic/Claude API Usage

**Two separate Anthropic client instances exist:**

| Location | Env Vars | Model | Max Tokens | Streaming |
|---|---|---|---|---|
| `server/routes.ts` (main app) | `AI_INTEGRATIONS_ANTHROPIC_API_KEY`, `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` | `claude-sonnet-4-6` | 4096 | Yes (hybrid — see below) |
| `server/replit_integrations/chat/routes.ts` | Same env vars | `claude-sonnet-4-6` | 8192 | Yes (pure SSE) |

### Main App AI Call Pattern (`POST /api/chat/:conversationId/stream`)

The main chat endpoint uses a **hybrid tool-use + streaming** pattern:

1. **First call** — non-streaming `anthropic.messages.create()` with `tools: chatTools` to check if tool use is needed.
2. **If no tool use** — text blocks from the first response are sent as SSE events immediately (not streamed token-by-token).
3. **If tool use detected** — up to `MAX_TOOL_ROUNDS = 3` rounds of tool execution occur:
   - Tool results are collected and appended to messages.
   - A new non-streaming `anthropic.messages.create()` is called per round.
4. **Final streaming call** — after tool rounds complete, `anthropic.messages.stream()` is called (without tools) for the final response, which IS streamed token-by-token via SSE.

### Tools Available to AI

| Tool Name | Description | Backend |
|---|---|---|
| `web_search` | Brave Search API via `braveWebSearch()` | `server/braveSearch.ts` — uses `BRAVE_SEARCH_API_KEY` |
| `vin_query_leads` | Query VinSolutions CRM leads | `callMCP("vin_query_leads", ...)` via `server/vendorProxy.ts` |
| `vin_lead_summary` | Get aggregated CRM metrics | Multiple `callMCP("vin_query_leads", ...)` calls with different status filters |

### System Prompt Construction

The system prompt is dynamically assembled from:

- **Persona name**: `org.personaName` (default: "Automa")
- **Date/time**: Current Eastern Time
- **User context**: Name, role, organization
- **Organization data**: Team members list, AI agents list
- **Agent context** (if `agentId` provided): Agent name, department, description, custom instructions
- **Hunch context**: Accepted AI insights with confidence levels and data sources
- **Knowledge base**: Up to 32KB of document content (8KB per doc max), filtered by agent relevance
- **Sync freshness**: VinSolutions metrics/lead data last sync timestamps
- **CRM Guru mode** (if `mode === "crm_guru"`): Additional rules prioritizing VinSolutions as primary data source
- **Data provenance rules**: Mandatory source attribution and staleness warnings

### Replit Integrations Chat (`server/replit_integrations/chat/routes.ts`)

A simpler, separate chat system:
- No authentication
- No system prompt
- No tools
- Uses integer IDs (not UUIDs)
- Separate in-memory storage (`chatStorage`)
- Pure SSE streaming via `anthropic.messages.stream()`
- **Observation**: This appears to be a Replit platform integration, not the main application chat. It shares the same Anthropic credentials but is architecturally separate.

---

## 2. Chat Architecture Per Context

### 2.1 Main Page Chat (`client/src/pages/main.tsx`)

- **Conversation discovery**: Queries `/api/conversations?channel=chat` to find existing conversations for the user.
- **Conversation creation**: Creates new conversation via `POST /api/conversations` with channel `"chat"`.
- **Chat mode**: Supports `crm_guru` mode toggle, passed as `mode` parameter to streaming endpoint.
- **Agent selection**: No explicit agent binding (agentId not passed in useStreamingChat).
- **Streaming**: Uses `useStreamingChat({ conversationId, mode })`.
- **Message display**: Loads from `/api/conversations/${conversationId}/messages` via React Query.

### 2.2 Right Pane Chat (`client/src/components/layout/RightPane.tsx`)

- **Conversation discovery**: Queries `/api/conversations?channel=ai-assistant` for conversations matching user's email.
- **Conversation creation**: Auto-creates conversation with channel `"ai-assistant"` on first load; posts an initial assistant greeting message.
- **Agent selection**: No agent binding (agentId not passed).
- **Mode**: No CRM Guru mode support.
- **Streaming**: Uses `useStreamingChat({ conversationId })`.
- **Message display**: Loads from `/api/conversations/${conversationId}/messages` via React Query; maps to local ChatMessage format.

### 2.3 Agent Page Chat (`client/src/pages/agents.tsx`)

- **Conversation management**: Maintains its own `conversationId` state per selected agent.
- **Agent binding**: Passes `agentId: selectedAgent?.id` to `useStreamingChat`.
- **Streaming**: Uses `useStreamingChat({ conversationId, agentId: selectedAgent?.id })`.
- **Message display**: Loads from `/api/conversations/${conversationId}/messages` via React Query.
- **Observation**: Agent-specific instructions and context are injected server-side via the `agentId` parameter in the streaming endpoint.

### Wiring Comparison

| Feature | Main Page | Right Pane | Agent Page |
|---|---|---|---|
| Channel | `chat` | `ai-assistant` | varies |
| Agent binding | No | No | Yes (`agentId`) |
| CRM Guru mode | Yes | No | No |
| Same backend endpoint | Yes (`/api/chat/:id/stream`) | Yes | Yes |
| Same streaming hook | Yes (`useStreamingChat`) | Yes | Yes |
| Auto-create conversation | Yes | Yes (with greeting) | Yes (per agent) |

All three contexts use the same backend endpoint and streaming hook. Differences are in channel naming, agent binding, and mode support.

---

## 3. Message Persistence Analysis

### Storage Layer

- **Database**: PostgreSQL via Drizzle ORM.
- **Tables**: `conversations` (UUID PK) and `messages` (UUID PK, FK to conversations).
- **Message fields**: `id`, `conversationId`, `role` (text), `content` (text), `senderName` (text, nullable), `createdAt`.

### Persistence Flow

1. **User message**: Saved to DB via `storage.createMessage()` BEFORE the AI call is made.
2. **AI response**: Saved to DB via `storage.createMessage()` AFTER streaming completes (full response accumulated in `fullResponse`).
3. **Conversation updated**: `lastMessageAt` updated after both user and assistant messages.

### Do messages survive page refresh?

**Yes.** Messages are:
- Persisted to PostgreSQL immediately on send (user) and on stream completion (assistant).
- Loaded via React Query on component mount (`/api/conversations/${conversationId}/messages`).
- Query cache is invalidated after streaming completes, triggering a fresh fetch.

**Edge case**: If the browser is closed mid-stream, the user message IS saved but the assistant response is NOT (it's only saved after streaming completes). The conversation will show the user message without a response on reload.

---

## 4. Outbound Channel Status

| Channel | Provider | Status | Implementation |
|---|---|---|---|
| **SMS** | TextMagic | **WIRED** | `server/outbound.ts` — `sendSms()` uses TextMagic REST API v2 with `X-TM-Key` auth header. Requires `TEXTMAGIC_API_KEY` env var. |
| **Email** | Resend | **WIRED** | `server/outbound.ts` — `sendEmail()` uses Resend SDK. Parses `Subject:` from content. From: `notifications@huminic.ai`. Requires `RESEND_API_KEY`. |
| **Voice** | VAPI | **MOCK** | `server/outbound.ts` — `sendPhone()` only logs to console: `"Call initiation to ${to} delegated to VAPI"`. No actual VAPI outbound call API integration. |
| **Video** | Tavus | **MISSING** | No outbound video send function exists. Tavus integration is read-only (list personas, replicas, conversations via `server/vendorProxy.ts`). |

### Additional Outbound: User Invite Emails

`POST /api/users/invite` sends invite emails directly via Resend API (not through the outbound system), bypassing all kill switches and safety checks.

---

## 5. Campaign Flow Analysis

### Campaign Lifecycle

1. **Create**: `POST /api/campaigns` — creates campaign with `status: "draft"`, `killSwitch: false`.
2. **Upload recipients**: `POST /api/campaigns/:id/upload-csv` — parses CSV, creates `campaign_recipients` records with `status: "pending"`.
3. **Configure**: `PATCH /api/campaigns/:id` — set `messageTemplate`, `sendIntervalSeconds`, `channel`.
4. **Execute**: `POST /api/campaigns/:id/execute` — calls `startCampaignExecution()`.
5. **Stop**: `POST /api/campaigns/:id/stop` — calls `stopCampaignExecution()`.

### Execution Engine (`server/outbound.ts`)

- Uses `setInterval` for pacing (default 60s between sends).
- Processes recipients sequentially from a queue.
- Each recipient goes through `processOutboundSend()` which calls `checkCommGate()` before sending.
- Template substitution: `{{customerName}}`, `{{firstName}}`, `{{lastName}}`, `{{dealershipName}}`.
- Supports `dryRun` mode (logs but doesn't send).
- Active executions stored in-memory `Map<string, CampaignExecution>` — not persisted across server restarts.
- Execution status cleaned up after 60s delay post-completion.

### Blocked Messages

When a send is blocked by CommGate:
- Logged to `outbound_log` table with `status: "blocked"`.
- An escalation task is auto-created (`type: "unsent_message"`).
- Usage event logged as `outbound_{channel}_blocked`.

---

## 6. Safety Mechanism Audit (3-Layer Kill Switch)

### Layer 1: Global Environment Kill Switch

- **Flag**: `process.env.OUTBOUND_LIVE_ENABLED`
- **Check**: `isGlobalOutboundEnabled()` in `server/outbound.ts` — returns `true` only if env var equals `"true"`.
- **Default**: OFF (any value other than `"true"` blocks all outbound).
- **Status**: IMPLEMENTED and checked first in `checkCommGate()`.

### Layer 2: Organization-Level Kill Switches

Schema fields in `organizations` table:
| Field | Default | Status |
|---|---|---|
| `outboundEnabled` | `false` | IMPLEMENTED — checked in `checkCommGate()` |
| `smsEnabled` | `false` | IMPLEMENTED — checked per-channel |
| `phoneEnabled` | `false` | IMPLEMENTED — checked per-channel |
| `emailEnabled` | `false` | IMPLEMENTED — checked per-channel |

**All default to `false`** — outbound is opt-in.

### Layer 3: Campaign & Conversation Level

| Mechanism | Location | Status |
|---|---|---|
| `campaigns.killSwitch` | `shared/schema.ts` — default `false` | IMPLEMENTED — checked in `checkCommGate()` and in execution loop (`processNext()`) |
| `conversations.campaignDisconnected` | `shared/schema.ts` — default `false` | IMPLEMENTED — checked in `checkCommGate()` via `getConversationForRecipient()` |

### Rate Limiting

- **Limit**: 3 messages per customer contact per 24 hours (`RATE_LIMIT_MAX = 3`, `RATE_LIMIT_HOURS = 24`).
- **Check**: `storage.getRecentOutboundCount()` in `checkCommGate()`.
- **Status**: IMPLEMENTED.

### Outbound Status API

`GET /api/outbound/status` returns all kill switch states for the authenticated user's organization.

### Safety Assessment

The 3-layer kill switch is fully implemented with defense-in-depth:
1. Global env var (infrastructure level)
2. Organization flags (admin level, per-channel granularity)
3. Campaign kill switch + conversation disconnect (operational level)
4. Rate limiting (automatic per-contact throttle)

---

## 7. Webhook Inventory

### 7.1 VAPI Webhook (`POST /api/webhooks/vapi`)

- **Authentication**: Validates `x-vapi-secret` or `authorization` header against `VAPI_PRIVATE_KEY`.
- **Events handled**: `end-of-call-report`, `call-ended` (other types ignored with 200).
- **Actions on receive**:
  1. Extracts customer info, transcript, summary from call payload.
  2. Matches `assistantId` to local agent via `vapiAssistantId` field.
  3. Creates conversation (channel: `"voice"`) and message (role: `"system"`).
  4. **VIN Integration**: Creates VinSolutions contact via `vin_create_contact` MCP, then lead via `vin_create_lead` MCP.
  5. On VIN failure: Creates escalation tasks with `priority: "critical"` and `tags: ["escalation", "vin-integration", "vapi"]`.
  6. Notifies admin users (role level <= 3).
  7. Logs activity.
- **Observation**: Organization resolution falls back to first org if no agent match found — could misroute calls in multi-org setups.

### 7.2 TextMagic Webhook (`POST /api/webhooks/textmagic`)

- **Authentication**: Rate-limited by IP (30 req/min) but no secret validation.
- **Actions on receive**:
  1. Extracts `sender`, `text`, `timestamp` from payload.
  2. Looks up existing open conversation by phone + channel `"sms"`.
  3. If found: updates `lastMessageAt` and `unreadCount`.
  4. If not found: creates new conversation (channel: `"sms"`) assigned to first organization.
  5. Creates message (role: `"user"`).
  6. Notifies admin users.
  7. Logs activity.
- **Observation**: No secret/signature validation — only IP rate limiting. Organization assignment falls back to first org.

---

## 8. Enforcer Script Findings (`scripts/enforcer.ts`)

### What It Checks

1. **Dropped Feature References**: Scans all source files for references to `Drive`, `Custom Agent`, `Sharing` (with exceptions for comments, seed data, mocks, and legitimate uses like "test drive").

2. **Forbidden Context**: Scans for `file upload`, `file sharing`, `google drive`, `onedrive`, `dropbox` strings (with exceptions for multer-related code and "Coming Soon" text).

3. **Credential Exposure**: Scans for patterns:
   - Supabase URLs
   - API keys matching `sk-...` pattern
   - AWS access keys (`AKIA...`)
   - US phone numbers (`+1` followed by 10 digits)
   - Hardcoded passwords in code
   - Exceptions: enforcer itself, `.env.example`, `process.env` references, `import.meta.env` references.

4. **Kill Switch Default Test**: Verifies that `outboundEnabled`, `smsEnabled`, `phoneEnabled`, `emailEnabled` all have `default(false)` in `shared/schema.ts`.

### Configuration

- **Scanned extensions**: `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.env`
- **Ignored directories**: `node_modules`, `.git`, `dist`, `public`, `scripts`, and several others.
- **Exit code**: Non-zero if any violations found or kill switch defaults are wrong.

---

## 9. Observations

1. **Replit chat integration is architecturally separate**: `server/replit_integrations/chat/` has its own storage, routes, and Anthropic client. It uses integer IDs and in-memory storage. The main app routes at `/api/conversations` may conflict with these routes depending on registration order.

2. **Voice outbound is mock-only**: `sendPhone()` only logs to console. VAPI is integrated for inbound (webhook) and read-only queries (assistants, calls, analytics) but not for outbound call initiation.

3. **Video (Tavus) has no send capability**: Only read APIs (personas, replicas, conversations). No outbound video message/meeting creation.

4. **Mid-stream failure loses AI response**: If streaming is interrupted, the user message is persisted but the assistant response is lost (only saved after full stream completion).

5. **TextMagic webhook lacks secret validation**: Unlike the VAPI webhook which validates a secret, the TextMagic webhook only has IP-based rate limiting. Any party knowing the endpoint URL can inject fake inbound SMS.

6. **Multi-org routing weakness in webhooks**: Both VAPI and TextMagic webhooks fall back to the first organization in the database when no specific match is found. In a multi-tenant deployment, this could misroute inbound communications.

7. **Campaign execution state is in-memory**: `activeExecutions` Map in `server/outbound.ts` is not persisted. A server restart during campaign execution will lose execution state, leaving the campaign in an inconsistent status.

8. **Invite emails bypass outbound safety**: User invite emails (`POST /api/users/invite`) call Resend API directly, bypassing all CommGate checks, kill switches, and rate limits.

9. **No streaming for tool-use initial response**: When the first Anthropic call requires no tools, text blocks are sent as single SSE events (not token-by-token). Only the final response after tool rounds is truly streamed. This means non-tool responses arrive in bulk rather than progressively.

10. **AI model consistency**: All three Anthropic call sites use `claude-sonnet-4-6`. The Replit integration chat allows 8192 max tokens vs 4096 for the main app.
