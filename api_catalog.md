# API & Backend Audit — Nexxus Connect v2.2

**Audit Date:** 2026-03-07
**Scope:** server/routes.ts, server/storage.ts, server/index.ts, server/vite.ts, server/auth.ts, server/vendorProxy.ts, server/outbound.ts, server/sync.ts, server/braveSearch.ts, server/seed.ts, server/static.ts, shared/schema.ts

---

## 1. Complete Route Catalog

### 1.1 Authentication Routes

| # | Method | Path | Auth? | Role Gate | Data Source | Handler Summary |
|---|--------|------|-------|-----------|-------------|-----------------|
| 1 | POST | `/api/auth/login` | No | — | DB | Validates email/password via `storage.getUserByEmail`, bcrypt compare, generates JWT access+refresh tokens, creates session in DB |
| 2 | POST | `/api/auth/logout` | Yes | — | DB | Deletes all user sessions via `storage.deleteUserSessions` |
| 3 | POST | `/api/auth/refresh` | No | — | DB | Validates refresh token via `storage.getSessionByRefreshToken`, rotates tokens, creates new session |
| 4 | GET | `/api/auth/me` | Yes | — | DB | Returns current user profile via `storage.getUser`, `storage.getRole`, `storage.getOrganization` |
| 5 | POST | `/api/auth/switch-org` | Yes | ≤2 (Partner+) | DB | Switches user's organization, re-issues tokens. Updates user record via `storage.updateUser` |
| 6 | POST | `/api/auth/forgot-password` | No | — | DB (lookup only) | Looks up user by email, logs message. **Stub** — does not actually send reset email |
| 7 | POST | `/api/auth/reset-password` | No | — | **Stub** | Logs attempt, returns placeholder message. No actual password reset logic |
| 8 | POST | `/api/auth/change-password` | Yes | — | DB | Validates current password, hashes new password, updates via `storage.updateUser` |

### 1.2 User Routes

| # | Method | Path | Auth? | Role Gate | Data Source | Handler Summary |
|---|--------|------|-------|-----------|-------------|-----------------|
| 9 | GET | `/api/users` | Yes | — | DB | Lists org users via `storage.getUsers`, strips passwords |
| 10 | POST | `/api/users` | Yes | ≤3 (Admin+) | DB | Creates user with bcrypt-hashed password, validates role assignment, creates activity log + welcome notification |
| 11 | GET | `/api/users/me` | Yes | — | DB | Returns current user profile (password stripped) |
| 12 | PATCH | `/api/users/me` | Yes | — | DB | Updates profile via `updateUserProfileSchema` validation + `storage.updateUser` |
| 13 | PATCH | `/api/users/:id` | Yes | ≤3 (Admin+) | DB | Admin user update (firstName, lastName, roleId, isActive). Privilege escalation checks |
| 14 | POST | `/api/users/:id/reset-password` | Yes | ≤3 (Admin+) | DB | Admin password reset for target user. Deletes target's sessions |
| 15 | POST | `/api/users/me/photo` | Yes | — | DB | Uploads profile photo via multer (in-memory), stores as base64 data URL in `profilePhotoUrl` |
| 16 | POST | `/api/users/invite` | Yes | ≤3 (Admin+) | DB + External (Resend) | Creates user with temp password, optionally sends invite email via Resend API |

### 1.3 Role Routes

| # | Method | Path | Auth? | Role Gate | Data Source | Handler Summary |
|---|--------|------|-------|-----------|-------------|-----------------|
| 17 | GET | `/api/roles` | Yes | — | DB | Lists all roles via `storage.getRoles` |

### 1.4 Organization Routes

| # | Method | Path | Auth? | Role Gate | Data Source | Handler Summary |
|---|--------|------|-------|-----------|-------------|-----------------|
| 18 | GET | `/api/organizations/:id` | Yes | — (cross-org: ≤2) | DB | Fetches org by ID via `storage.getOrganization` |
| 19 | PATCH | `/api/organizations/:id` | Yes | ≤3 (Admin+) | DB | Updates org via `updateOrganizationSchema`. Sends notifications on outboundEnabled change |
| 20 | PATCH | `/api/organizations/:id/slug` | Yes | ≤3 (Admin+) | DB | Updates org slug with redirect creation (30-day expiry) |

### 1.5 Agent Routes

| # | Method | Path | Auth? | Role Gate | Data Source | Handler Summary |
|---|--------|------|-------|-----------|-------------|-----------------|
| 21 | GET | `/api/agents` | Yes | — | DB | Lists agents by org with optional `department` filter |
| 22 | GET | `/api/agents/:id` | Yes | — (cross-org: ≤2) | DB | Fetches single agent |
| 23 | POST | `/api/agents` | Yes | ≤3 (Admin+) | DB | Creates agent with `insertAgentSchema` validation + activity log |
| 24 | PATCH | `/api/agents/:id` | Yes | — (cross-org: ≤2) | DB | Updates agent with `updateAgentSchema` validation + activity log |
| 25 | DELETE | `/api/agents/:id` | Yes | ≤3 (Admin+) | DB | Deletes agent + activity log |

### 1.6 Conversation Routes

| # | Method | Path | Auth? | Role Gate | Data Source | Handler Summary |
|---|--------|------|-------|-----------|-------------|-----------------|
| 26 | GET | `/api/conversations` | Yes | — | DB | Lists org conversations with optional `status`, `channel` filters |
| 27 | POST | `/api/conversations` | Yes | — | DB | Creates conversation. Includes stale ai-chat conversation cleanup logic |
| 28 | GET | `/api/conversations/:id` | Yes | — (cross-org: ≤2) | DB | Fetches single conversation |
| 29 | PATCH | `/api/conversations/:id` | Yes | — (cross-org: ≤2) | DB | Updates conversation (status, campaignDisconnected, unreadCount, assignedTo) |
| 30 | DELETE | `/api/conversations/:id` | Yes | — (cross-org: ≤2) | DB | Deletes conversation + all messages |
| 31 | GET | `/api/conversations/:id/messages` | Yes | — (cross-org: ≤2) | DB | Lists messages for conversation |
| 32 | POST | `/api/conversations/:id/messages` | Yes | — (cross-org: ≤2) | DB | Creates message in conversation, updates `lastMessageAt` |

### 1.7 Chat / AI Streaming Route

| # | Method | Path | Auth? | Role Gate | Data Source | Handler Summary |
|---|--------|------|-------|-----------|-------------|-----------------|
| 33 | POST | `/api/chat/:conversationId/stream` | Yes | — (cross-org: ≤2) | DB + External (Anthropic, Brave, VinSolutions MCP) | SSE streaming chat. Saves user message, builds system prompt with org context/knowledge docs/hunches/sync freshness. Calls Anthropic Claude (claude-sonnet-4-6) with tool use (web_search via Brave, vin_query_leads, vin_lead_summary via MCP). Supports CRM Guru mode. Max 3 tool rounds. Saves assistant response to DB |

### 1.8 Campaign Routes

| # | Method | Path | Auth? | Role Gate | Data Source | Handler Summary |
|---|--------|------|-------|-----------|-------------|-----------------|
| 34 | GET | `/api/campaigns` | Yes | — | DB | Lists campaigns with optional `department` filter |
| 35 | POST | `/api/campaigns` | Yes | ≤3 (Admin+) | DB | Creates campaign with `insertCampaignSchema` validation + activity log |
| 36 | GET | `/api/campaigns/execution-statuses` | Yes | — | In-Memory | Returns all active campaign execution statuses from `activeExecutions` Map |
| 37 | GET | `/api/campaigns/:id` | Yes | — (cross-org: ≤2) | DB | Fetches single campaign |
| 38 | PATCH | `/api/campaigns/:id` | Yes | — (cross-org: ≤2) | DB | Updates campaign with `updateCampaignSchema`. Sends notifications on status/killSwitch changes |
| 39 | POST | `/api/campaigns/:id/execute` | Yes | ≤3 (Admin+) | DB + External (TextMagic/Resend) | Starts campaign execution via `startCampaignExecution`. Supports dry run. Sends notifications to org users |
| 40 | POST | `/api/campaigns/:id/stop` | Yes | ≤3 (Admin+) | In-Memory + DB | Stops active campaign execution |
| 41 | GET | `/api/campaigns/:id/execution-status` | Yes | — | In-Memory | Returns execution status for specific campaign |
| 42 | POST | `/api/campaigns/:id/upload-csv` | Yes | — | DB | Parses CSV file (multer), creates campaign recipients, updates recipientCount |
| 43 | GET | `/api/campaigns/:id/recipients` | Yes | — | DB | Lists recipients for campaign |

### 1.9 Integration Routes

| # | Method | Path | Auth? | Role Gate | Data Source | Handler Summary |
|---|--------|------|-------|-----------|-------------|-----------------|
| 44 | GET | `/api/integrations` | Yes | — | DB | Lists integrations with optional `provider` filter |
| 45 | POST | `/api/integrations/provision` | Yes | ≤2 (Partner+) | DB + External (VinSolutions MCP) | Provisions VinSolutions dealer integration via MCP `vin_provision_dealer`, saves to DB |

### 1.10 Task Routes

| # | Method | Path | Auth? | Role Gate | Data Source | Handler Summary |
|---|--------|------|-------|-----------|-------------|-----------------|
| 46 | GET | `/api/tasks` | Yes | — | DB | Lists tasks with optional `status`, `assignedUserId`, `type` filters |
| 47 | POST | `/api/tasks` | Yes | — | DB | Creates task with `insertTaskSchema` validation |
| 48 | PATCH | `/api/tasks/:id` | Yes | — | DB | Updates task with `updateTaskSchema` validation |
| 49 | DELETE | `/api/tasks/:id` | Yes | — | DB | Deletes task |

### 1.11 Appointment Routes

| # | Method | Path | Auth? | Role Gate | Data Source | Handler Summary |
|---|--------|------|-------|-----------|-------------|-----------------|
| 50 | GET | `/api/appointments` | Yes | — | DB | Lists appointments with optional `department`, `startDate`, `endDate` filters |
| 51 | GET | `/api/appointments/:id` | Yes | — | DB | Fetches single appointment |
| 52 | POST | `/api/appointments` | Yes | — | DB | Creates appointment (manual validation, not schema-based) |
| 53 | PATCH | `/api/appointments/:id` | Yes | — | DB | Updates appointment with whitelist of allowed fields |
| 54 | DELETE | `/api/appointments/:id` | Yes | — | DB | Deletes appointment |

### 1.12 Widget Routes

| # | Method | Path | Auth? | Role Gate | Data Source | Handler Summary |
|---|--------|------|-------|-----------|-------------|-----------------|
| 55 | GET | `/api/widgets` | Yes | — | DB | Lists widgets for org |
| 56 | GET | `/api/widgets/:id` | Yes | — | DB | Fetches single widget |
| 57 | POST | `/api/widgets` | Yes | — | DB | Creates widget with auto-generated widgetCode |
| 58 | PATCH | `/api/widgets/:id` | Yes | — | DB | Updates widget with `updateWidgetSchema` validation |
| 59 | DELETE | `/api/widgets/:id` | Yes | — | DB | Deletes widget |

### 1.13 Document / Knowledge Base Routes

| # | Method | Path | Auth? | Role Gate | Data Source | Handler Summary |
|---|--------|------|-------|-----------|-------------|-----------------|
| 60 | GET | `/api/documents` | Yes | — | DB | Lists documents with optional `agentId` filter |
| 61 | POST | `/api/documents` | Yes | — | DB | Uploads document via multer, extracts text content for CSV/TXT/HTML, stores in DB + activity log |
| 62 | DELETE | `/api/documents/:id` | Yes | — | DB | Deletes document |

### 1.14 Notification Routes

| # | Method | Path | Auth? | Role Gate | Data Source | Handler Summary |
|---|--------|------|-------|-----------|-------------|-----------------|
| 63 | GET | `/api/notifications` | Yes | — | DB | Lists notifications for current user |
| 64 | GET | `/api/notifications/unread-count` | Yes | — | DB | Returns unread notification count |
| 65 | PATCH | `/api/notifications/:id/read` | Yes | — | DB | Marks single notification as read |
| 66 | POST | `/api/notifications/mark-all-read` | Yes | — | DB | Marks all user notifications as read |

### 1.15 Activity Log Routes

| # | Method | Path | Auth? | Role Gate | Data Source | Handler Summary |
|---|--------|------|-------|-----------|-------------|-----------------|
| 67 | GET | `/api/activity-log` | Yes | — | DB | Lists activity logs for org with optional `limit` |

### 1.16 Metrics / Dashboard Routes

| # | Method | Path | Auth? | Role Gate | Data Source | Handler Summary |
|---|--------|------|-------|-----------|-------------|-----------------|
| 68 | GET | `/api/metrics/dashboard` | Yes | — | DB | Returns computed dashboard metrics (conversations, messages, campaigns, agents, users, pipeline) |
| 69 | GET | `/api/metrics/pipeline` | Yes | — | DB | Returns pipeline metrics (activePipeline, appointmentsToday, openEscalations, outboundSent24h) |

### 1.17 Hunch Routes

| # | Method | Path | Auth? | Role Gate | Data Source | Handler Summary |
|---|--------|------|-------|-----------|-------------|-----------------|
| 70 | GET | `/api/hunches` | Yes | — | DB | Lists hunches with optional `status`, `department` filters |
| 71 | PATCH | `/api/hunches/:id` | Yes | — (cross-org: ≤2) | DB | Updates hunch status (new/accepted/dismissed/resolved) via `updateHunchSchema` |
| 72 | POST | `/api/hunches/generate` | Yes | ≤3 (Admin+) | DB + External (Anthropic) | Generates AI business insights from org data. Uses Claude to analyze conversations/campaigns/agents and produce 3-5 hunches |

### 1.18 Sync Routes

| # | Method | Path | Auth? | Role Gate | Data Source | Handler Summary |
|---|--------|------|-------|-----------|-------------|-----------------|
| 73 | POST | `/api/sync/backfill` | Yes | ≤2 (Partner+) | DB + External (VinSolutions MCP) | Triggers historical lead backfill from VinSolutions |
| 74 | POST | `/api/sync/delta` | Yes | ≤2 (Partner+) | DB + External (VinSolutions MCP) | Triggers daily delta sync from VinSolutions |
| 75 | POST | `/api/sync/metrics` | Yes | ≤2 (Partner+) | DB + External (VinSolutions MCP) | Triggers metrics refresh from VinSolutions |
| 76 | GET | `/api/sync/status` | Yes | — | DB | Returns latest sync status for backfill/delta/metrics |
| 77 | GET | `/api/sync/logs` | Yes | — | DB | Lists sync logs with optional `limit` |

### 1.19 Warehouse Routes

| # | Method | Path | Auth? | Role Gate | Data Source | Handler Summary |
|---|--------|------|-------|-----------|-------------|-----------------|
| 78 | GET | `/api/warehouse/leads` | Yes | — | DB | Lists warehouse leads with optional `status`, `limit` filters. Returns items + total count |
| 79 | GET | `/api/warehouse/metrics` | Yes | — | DB | Lists warehouse metrics with optional `metricKey`, `period` filters |

### 1.20 Outbound Status Routes

| # | Method | Path | Auth? | Role Gate | Data Source | Handler Summary |
|---|--------|------|-------|-----------|-------------|-----------------|
| 80 | GET | `/api/outbound/status` | Yes | — | DB + Env | Returns outbound communication status (global kill switch from env, org-level channel enables from DB) |

### 1.21 Usage / Billing Routes

| # | Method | Path | Auth? | Role Gate | Data Source | Handler Summary |
|---|--------|------|-------|-----------|-------------|-----------------|
| 81 | GET | `/api/usage` | Yes | ≤3 (Admin+) | DB | Lists usage events with optional date/type filters |
| 82 | GET | `/api/usage/summary` | Yes | ≤3 (Admin+) | DB | Returns usage summary grouped by event type. Partner/Super admins see all partner orgs |
| 83 | GET | `/api/billing/usage` | Yes | — (cross-org: ≤2) | DB | Returns billing usage summary for specified period (current_month/last_month) |

### 1.22 Settings Routes

| # | Method | Path | Auth? | Role Gate | Data Source | Handler Summary |
|---|--------|------|-------|-----------|-------------|-----------------|
| 84 | GET | `/api/settings/org` | Yes | — | DB | Returns org settings JSON from `organization.settings` |
| 85 | PATCH | `/api/settings/org` | Yes | ≤3 (Admin+) | DB | Merges request body into org settings JSON + activity log |

### 1.23 Vendor Proxy Routes (registered via `registerVendorRoutes`)

| # | Method | Path | Auth? | Role Gate | Data Source | Handler Summary |
|---|--------|------|-------|-----------|-------------|-----------------|
| 86 | GET | `/api/vapi/assistants` | Yes | — | External (VAPI) | Lists VAPI assistants |
| 87 | GET | `/api/vapi/phone-numbers` | Yes | — | External (VAPI) | Lists VAPI phone numbers |
| 88 | GET | `/api/vapi/calls` | Yes | — | External (VAPI) | Lists VAPI calls with optional `assistantId`, `limit` |
| 89 | GET | `/api/vapi/calls/:callId` | Yes | — | External (VAPI) | Fetches single VAPI call details |
| 90 | GET | `/api/vapi/analytics` | Yes | — | External (VAPI) | Fetches VAPI analytics (call stats) |
| 91 | GET | `/api/tavus/personas` | Yes | — | External (Tavus) | Lists Tavus personas |
| 92 | GET | `/api/tavus/replicas` | Yes | — | External (Tavus) | Lists Tavus replicas |
| 93 | GET | `/api/tavus/conversations` | Yes | — | External (Tavus) | Lists Tavus conversations with optional `personaId`, `limit` |
| 94 | GET | `/api/vin/leads` | Yes | — | External (VinSolutions MCP) | Queries VinSolutions leads via `vin_query_leads` MCP tool |
| 95 | GET | `/api/vin/leads/summary` | Yes | — | DB + External (VinSolutions MCP) | Returns lead summary — tries warehouse metrics first, falls back to live MCP queries |
| 96 | GET | `/api/vin/lead-sources` | Yes | — | External (VinSolutions MCP) | Fetches lead sources via `vin_get_lead_sources` |
| 97 | GET | `/api/vin/lead-statuses` | Yes | — | External (VinSolutions MCP) | Fetches lead statuses via `vin_get_lead_statuses` |
| 98 | GET | `/api/vin/dealers` | Yes | — | External (VinSolutions MCP) | Lists dealers via `vin_list_dealers` |
| 99 | GET | `/api/vin/token-status` | Yes | — | External (VinSolutions MCP) | Checks VinSolutions token status via `vin_token_status` |

### 1.24 Webhook Routes

| # | Method | Path | Auth? | Role Gate | Data Source | Handler Summary |
|---|--------|------|-------|-----------|-------------|-----------------|
| 100 | POST | `/api/webhooks/vapi` | No (secret-based) | — | DB + External (VinSolutions MCP) | Processes VAPI end-of-call webhooks. Creates conversation+messages, attempts VIN contact+lead creation via MCP, creates escalation tasks on failure, sends notifications |
| 101 | POST | `/api/webhooks/textmagic` | No (rate-limited) | — | DB | Processes inbound SMS webhooks. Finds/creates conversation by phone, creates message, sends notifications to admins |

### 1.25 Public Routes

| # | Method | Path | Auth? | Role Gate | Data Source | Handler Summary |
|---|--------|------|-------|-----------|-------------|-----------------|
| 102 | GET | `/api/public/landing/:slug` | No (rate-limited) | — | DB | Returns public org info by slug (id, name, slug, personaName). Supports slug redirects |
| 103 | GET | `/api/widgets/public/:widgetCode` | No (rate-limited) | — | DB | Returns public widget config by widgetCode (iterates all orgs to find match) |
| 104 | GET | `/widget/nexxus-widget.js` | No | — | **Hardcoded** | Serves embeddable widget JavaScript snippet (inline script, not from DB) |

**Total: 104 routes**

---

## 2. Middleware Catalog

| Middleware | File | Type | Description |
|-----------|------|------|-------------|
| `express.json` | server/index.ts | Body Parser | JSON body parsing with raw body capture |
| `express.urlencoded` | server/index.ts | Body Parser | URL-encoded body parsing |
| Request Logger | server/index.ts | Logging | Logs all `/api/*` requests with method, path, status, duration, response body |
| Error Handler | server/index.ts | Error | Catches unhandled errors, returns 500 with message |
| `authenticateToken` | server/auth.ts | Auth | JWT Bearer token validation. Decodes token, loads user+role+org from DB, attaches to `req.user` |
| `requireRole(maxLevel)` | server/auth.ts | RBAC | Checks `req.user.roleLevel <= maxLevel`. Roles: 1=super_admin, 2=partner_admin, 3=org_admin/executive/sales_manager, 4=staff |
| `multer` (memoryStorage) | server/routes.ts | File Upload | In-memory file upload, 5MB limit. Used by photo upload, document upload, CSV upload |
| `checkPublicRate` | server/routes.ts | Rate Limiting | IP-based rate limiting for public endpoints (60 req/min for landing/widget, 30 req/min for TextMagic webhook). In-memory Map with 60s window cleanup |
| VAPI Webhook Secret | server/routes.ts | Auth | Validates `x-vapi-secret` or `Authorization` header against `VAPI_PRIVATE_KEY` env var |

### Middleware Observations
- No CORS middleware configured (relies on same-origin serving via Vite)
- No Helmet or security headers middleware
- No request size limiting beyond multer's 5MB
- No CSRF protection
- Rate limiting is in-memory only (lost on restart, not distributed)

---

## 3. External Integration Status

| Integration | Status | Files | Env Vars | Usage |
|------------|--------|-------|----------|-------|
| **Anthropic (Claude)** | **Active** | routes.ts | `AI_INTEGRATIONS_ANTHROPIC_API_KEY`, `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` | Chat streaming (claude-sonnet-4-6), hunch generation. Tool use with web_search, vin_query_leads, vin_lead_summary |
| **Brave Search** | **Active** | braveSearch.ts | `BRAVE_SEARCH_API_KEY` | Web search tool for AI chat. Graceful fallback when key missing |
| **VinSolutions (MCP)** | **Active** | vendorProxy.ts, sync.ts | `VINSOLUTIONS_MCP_URL`, `VINSOLUTIONS_API_KEY` | Lead queries, lead summary, lead sources, lead statuses, dealers, token status, contact/lead creation, dealer provisioning. Uses JSON-RPC over HTTPS |
| **VAPI (Voice AI)** | **Active** | vendorProxy.ts, routes.ts | `VAPI_PRIVATE_KEY` | Proxy routes for assistants, phone numbers, calls, analytics. Webhook receiver for call completion |
| **Tavus (Video AI)** | **Active** | vendorProxy.ts | `TAVUS_API_KEY` | Proxy routes for personas, replicas, conversations |
| **TextMagic (SMS)** | **Active** | outbound.ts, routes.ts | `TEXTMAGIC_API_KEY` | Outbound SMS sending, inbound SMS webhook receiver |
| **Resend (Email)** | **Active** | outbound.ts, routes.ts | `RESEND_API_KEY` | Outbound email sending, user invite emails |
| **Stripe (Billing)** | **Not Implemented** | — | — | Referenced in SRS.md as production target but no routes or integration code exists |

---

## 4. Storage Method Usage Map

### 4.1 IStorage Interface Methods — Usage Status

| Storage Method | Called by Routes? | Called by Services? | Status |
|---------------|-------------------|---------------------|--------|
| `getUser(id)` | Yes (auth/me, refresh, users/me, users/:id, change-password, reset-password) | Yes (auth.ts) | **Used** |
| `getUserByEmail(email)` | Yes (login, forgot-password, create user, invite) | — | **Used** |
| `createUser(user)` | Yes (POST /users, POST /users/invite) | — | **Used** |
| `updateUser(id, data)` | Yes (PATCH /users/me, PATCH /users/:id, switch-org, change-password, reset-password, photo upload) | — | **Used** |
| `getRole(id)` | Yes (login, refresh, auth/me, create user, update user) | Yes (auth.ts) | **Used** |
| `getRoleByName(name)` | — | — | **UNUSED** |
| `getRoles()` | Yes (GET /roles) | Yes (seed.ts) | **Used** |
| `createRole(role)` | — | Yes (seed.ts) | **Used (seed only)** |
| `getOrganization(id)` | Yes (login, refresh, auth/me, switch-org, org/:id, org update, slug update, outbound status, billing, settings, chat, invite) | Yes (auth.ts, outbound.ts, sync.ts) | **Used** |
| `getOrganizations()` | Yes (login for partner+, usage/summary) | Yes (seed.ts, sync.ts, VAPI webhook, TextMagic webhook) | **Used** |
| `createOrganization(org)` | — | Yes (seed.ts) | **Used (seed only)** |
| `updateOrganization(id, data)` | Yes (PATCH /organizations/:id, PATCH /settings/org) | — | **Used** |
| `createSession(session)` | Yes (login, refresh, switch-org) | — | **Used** |
| `getSessionByRefreshToken(token)` | Yes (refresh) | — | **Used** |
| `deleteSession(id)` | Yes (refresh) | — | **Used** |
| `deleteUserSessions(userId)` | Yes (logout, switch-org, reset-password) | — | **Used** |
| `getAgents(orgId, filters)` | Yes (GET /agents, chat stream) | Yes (VAPI webhook, seed.ts) | **Used** |
| `getUsers(orgId)` | Yes (GET /users, campaign notifications, org notifications, chat stream) | Yes (VAPI webhook, TextMagic webhook) | **Used** |
| `getAgent(id)` | Yes (GET /agents/:id, PATCH /agents/:id, DELETE /agents/:id, chat stream) | — | **Used** |
| `createAgent(agent)` | Yes (POST /agents) | Yes (seed.ts) | **Used** |
| `updateAgent(id, data)` | Yes (PATCH /agents/:id) | — | **Used** |
| `deleteAgent(id)` | Yes (DELETE /agents/:id) | — | **Used** |
| `getConversations(orgId, filters)` | Yes (GET /conversations, chat cleanup) | Yes (outbound.ts) | **Used** |
| `getConversation(id)` | Yes (GET /conversations/:id, PATCH, DELETE, messages, chat stream) | — | **Used** |
| `getConversationByPhone(phone, channel)` | Yes (TextMagic webhook) | — | **Used** |
| `createConversation(conv)` | Yes (POST /conversations, VAPI webhook, TextMagic webhook) | Yes (seed.ts) | **Used** |
| `updateConversation(id, data)` | Yes (PATCH /conversations/:id, messages, chat stream, TextMagic webhook) | — | **Used** |
| `getMessages(convId)` | Yes (GET messages, chat stream, chat cleanup) | — | **Used** |
| `createMessage(msg)` | Yes (POST messages, chat stream, VAPI webhook, TextMagic webhook) | Yes (seed.ts) | **Used** |
| `deleteConversation(id)` | Yes (DELETE /conversations/:id, chat cleanup) | — | **Used** |
| `deleteMessages(convId)` | — | — | **UNUSED** (deleteConversation cascades internally) |
| `getCampaigns(orgId, filters)` | Yes (GET /campaigns, hunch generation) | Yes (seed.ts) | **Used** |
| `getCampaign(id)` | Yes (GET /campaigns/:id, PATCH, execute, stop, CSV upload, recipients) | Yes (outbound.ts) | **Used** |
| `createCampaign(campaign)` | Yes (POST /campaigns) | Yes (seed.ts) | **Used** |
| `updateCampaign(id, data)` | Yes (PATCH /campaigns/:id, CSV upload) | Yes (outbound.ts, seed.ts) | **Used** |
| `getIntegrations(orgId, filters)` | Yes (GET /integrations) | — | **Used** |
| `getIntegration(id)` | — | — | **UNUSED** |
| `createIntegration(integration)` | Yes (POST /integrations/provision) | Yes (seed.ts) | **Used** |
| `updateIntegration(id, data)` | — | — | **UNUSED** |
| `getTasks(orgId, filters)` | Yes (GET /tasks) | Yes (seed.ts) | **Used** |
| `getTask(id)` | Yes (PATCH /tasks/:id, DELETE /tasks/:id) | — | **Used** |
| `createTask(task)` | Yes (POST /tasks) | Yes (outbound.ts, VAPI webhook, seed.ts) | **Used** |
| `updateTask(id, data)` | Yes (PATCH /tasks/:id) | — | **Used** |
| `deleteTask(id)` | Yes (DELETE /tasks/:id) | — | **Used** |
| `getWidgets(orgId)` | Yes (GET /widgets, public widget lookup) | — | **Used** |
| `getWidget(id)` | Yes (GET /widgets/:id, PATCH, DELETE) | — | **Used** |
| `createWidget(widget)` | Yes (POST /widgets) | Yes (seed.ts) | **Used** |
| `updateWidget(id, data)` | Yes (PATCH /widgets/:id) | — | **Used** |
| `deleteWidget(id)` | Yes (DELETE /widgets/:id) | — | **Used** |
| `getDocuments(orgId, agentId)` | Yes (GET /documents, chat stream) | — | **Used** |
| `getDocument(id)` | Yes (DELETE /documents/:id) | — | **Used** |
| `createDocument(doc)` | Yes (POST /documents) | Yes (seed.ts) | **Used** |
| `deleteDocument(id)` | Yes (DELETE /documents/:id) | — | **Used** |
| `getRecipients(campaignId)` | Yes (GET /campaigns/:id/recipients) | — | **Used** |
| `getRecipient(id)` | — | Yes (outbound.ts) | **Used** |
| `createRecipients(recipients)` | Yes (CSV upload) | Yes (seed.ts) | **Used** |
| `getRecipientCount(campaignId)` | Yes (CSV upload) | Yes (seed.ts) | **Used** |
| `updateRecipient(id, data)` | — | Yes (outbound.ts) | **Used** |
| `getPendingRecipients(campaignId)` | — | Yes (outbound.ts) | **Used** |
| `createOutboundLog(log)` | — | Yes (outbound.ts) | **Used** |
| `getOutboundLogs(orgId, filters)` | — | — | **UNUSED** |
| `getRecentOutboundCount(orgId, contact, hours)` | — | Yes (outbound.ts) | **Used** |
| `createNotification(notif)` | Yes (many routes: user creation, campaign actions, org updates, VAPI webhook, TextMagic webhook, invite) | — | **Used** |
| `getNotifications(userId, limit)` | Yes (GET /notifications) | — | **Used** |
| `getUnreadNotificationCount(userId)` | Yes (GET /notifications/unread-count) | — | **Used** |
| `markNotificationRead(id)` | Yes (PATCH /notifications/:id/read) | — | **Used** |
| `markAllNotificationsRead(userId)` | Yes (POST /notifications/mark-all-read) | — | **Used** |
| `createActivityLog(entry)` | Yes (many routes) | Yes (sync.ts, VAPI webhook) | **Used** |
| `getActivityLogs(orgId, limit)` | Yes (GET /activity-log) | — | **Used** |
| `getHunches(orgId, filters)` | Yes (GET /hunches) | — | **Used** |
| `getHunch(id)` | Yes (PATCH /hunches/:id) | — | **Used** |
| `createHunch(hunch)` | Yes (POST /hunches/generate) | — | **Used** |
| `updateHunch(id, data)` | Yes (PATCH /hunches/:id) | — | **Used** |
| `getAcceptedHunches(orgId)` | Yes (chat stream) | — | **Used** |
| `upsertWarehouseLead(lead)` | — | Yes (sync.ts) | **Used** |
| `getWarehouseLeads(orgId, filters)` | Yes (GET /warehouse/leads) | — | **Used** |
| `getWarehouseLeadCount(orgId, filters)` | Yes (GET /warehouse/leads) | — | **Used** |
| `upsertWarehouseMetric(metric)` | — | Yes (sync.ts) | **Used** |
| `getWarehouseMetrics(orgId, filters)` | Yes (GET /warehouse/metrics, /vin/leads/summary) | — | **Used** |
| `createSyncLog(entry)` | — | Yes (sync.ts) | **Used** |
| `updateSyncLog(id, data)` | — | Yes (sync.ts) | **Used** |
| `getLatestSync(orgId, syncType)` | Yes (sync/status, chat stream, /vin/leads/summary) | — | **Used** |
| `getSyncLogs(orgId, limit)` | Yes (GET /sync/logs) | — | **Used** |
| `getAppointments(orgId, filters)` | Yes (GET /appointments) | — | **Used** |
| `getAppointment(id)` | Yes (GET/PATCH/DELETE /appointments/:id) | — | **Used** |
| `createAppointment(appointment)` | Yes (POST /appointments) | — | **Used** |
| `updateAppointment(id, data)` | Yes (PATCH /appointments/:id) | — | **Used** |
| `deleteAppointment(id)` | Yes (DELETE /appointments/:id) | — | **Used** |
| `getOrganizationBySlug(slug)` | Yes (public landing, slug update) | — | **Used** |
| `getSlugRedirect(oldSlug)` | Yes (public landing) | — | **Used** |
| `createSlugRedirect(redirect)` | Yes (slug update) | — | **Used** |
| `updateOrganizationSlug(id, newSlug)` | Yes (slug update) | — | **Used** |
| `getDashboardMetrics(orgId)` | Yes (GET /metrics/dashboard) | — | **Used** |
| `getPipelineMetrics(orgId)` | Yes (GET /metrics/pipeline) | — | **Used** |

### 4.2 DatabaseStorage Methods NOT in IStorage Interface

| Method | Used By | Status |
|--------|---------|--------|
| `logUsageEvent(event)` | outbound.ts (send tracking) | **Used but not in IStorage interface** |
| `getUsageEvents(orgId, filters)` | GET /usage route | **Used but not in IStorage interface** |
| `getUsageSummary(orgId, start, end)` | GET /usage/summary, GET /billing/usage | **Used but not in IStorage interface** |

### 4.3 Unused IStorage Methods Summary

| Method | Notes |
|--------|-------|
| `getRoleByName(name)` | Defined in interface but never called anywhere |
| `deleteMessages(convId)` | Defined in interface; `deleteConversation` handles message cleanup internally |
| `getIntegration(id)` | Defined in interface but never called by any route |
| `updateIntegration(id, data)` | Defined in interface but never called by any route |
| `getOutboundLogs(orgId, filters)` | Defined in interface but never exposed via any route |

---

## 5. Routes Missing vs Requirements (SRS.md)

| SRS Requirement | Expected Route/Feature | Implementation Status |
|----------------|----------------------|----------------------|
| **Stripe Billing Integration** | Billing API routes (subscriptions, invoices, payment methods) | **Missing** — Only usage tracking exists, no Stripe integration |
| **File/Drive Management** | CRUD for files beyond knowledge docs (Drive page in UI) | **Missing** — Only knowledge documents have upload/delete; no general file management |
| **RLS Policies** | Row-level security on DB | **Missing** — Multi-tenancy enforced in application code, not database-level |
| **Password Reset (actual)** | POST /api/auth/reset-password | **Stub** — Returns placeholder message, no actual token validation or password update |
| **Forgot Password (actual)** | POST /api/auth/forgot-password | **Stub** — Logs but does not send email |
| **Landing Page CRUD** | Create/edit/delete landing pages | **Partial** — Only org slug management exists; no dedicated landing page entity |
| **Notification Preferences** | User notification preference settings | **Missing** — No route for notification preferences |
| **Appearance Settings** | Theme/appearance configuration per org | **Partial** — Stored in org settings JSON, no dedicated route |
| **Security Settings** | Security configuration panel | **Missing** — No dedicated security settings routes |
| **AI Configuration Routes** | Skills management, temperature, prompts | **Missing** — AI config is hardcoded in system prompt, no dynamic configuration routes |
| **Organization CRUD (create)** | POST /api/organizations | **Missing** — Only seed creates orgs; no route for org creation (except via seed) |
| **Outbound Log Viewer** | GET /api/outbound/logs | **Missing** — `getOutboundLogs` exists in storage but no route exposes it |
| **Webhook for Tavus** | POST /api/webhooks/tavus | **Missing** — Only GET proxy routes for Tavus; no webhook receiver |

---

## 6. Observations

### 6.1 Architecture
- **Database-backed**: All primary CRUD operations use real PostgreSQL via Drizzle ORM (`DatabaseStorage`). No in-memory storage or mock data in routes.
- **Seed data**: Database is populated on startup via `seedDatabase()` in `server/seed.ts` with roles, orgs, users, agents, campaigns, conversations, messages, integrations, tasks, widgets, documents, and recipients.
- **No MemStorage**: Despite development guidelines mentioning MemStorage preference, the codebase uses `DatabaseStorage` exclusively with a real PostgreSQL connection.

### 6.2 Authentication & Authorization
- JWT-based auth with access tokens (1h) and refresh tokens (7d)
- Refresh token rotation implemented (old token deleted, new one issued)
- Role-based access control with 4 levels: 1 (super_admin), 2 (partner_admin), 3 (org_admin/executive/sales_manager), 4 (staff)
- Multi-tenancy enforced via `organizationId` checks in route handlers (not DB-level RLS)
- Cross-organization access allowed for roles ≤ 2 (partner_admin+)
- Webhook routes use secret-based auth (VAPI) or rate limiting (TextMagic, public routes)

### 6.3 External API Dependencies
- System requires 7 external API keys to be fully functional
- Graceful degradation: Brave Search returns fallback when key missing; TextMagic/Resend throw errors when keys missing
- VinSolutions MCP communication uses JSON-RPC 2.0 over HTTPS with SSE response parsing
- Anthropic API is initialized at module load — will fail if key is missing

### 6.4 Data Flow Patterns
- Activity logs and notifications are fire-and-forget (`.catch(() => {})`) — failures are silently ignored
- Campaign execution is managed via in-memory `activeExecutions` Map — state lost on server restart
- Sync scheduler runs on configurable intervals (4h metrics, 24h delta) — started at route registration time
- Outbound communication has a multi-layer safety gate: global env flag → org-level toggle → per-channel toggle → campaign kill switch → campaign disconnect → rate limit (3/24h per contact)

### 6.5 Code Quality Notes
- Schema validation is consistently applied using Zod schemas from `@shared/schema` for create/update operations
- Error handling is uniform: try/catch blocks returning 500 with generic messages
- Password stripping is done manually (destructuring) rather than via schema/view
- Some routes lack Zod validation (appointments POST uses manual field checking)
- Public widget lookup iterates all organizations to find a widget by code — potential performance issue at scale
- `logUsageEvent`, `getUsageEvents`, and `getUsageSummary` exist on `DatabaseStorage` class but are not declared in the `IStorage` interface

### 6.6 Background Processes
- `startSyncScheduler()` is called during route registration, starting automated VinSolutions sync
- Stale conversation cleanup runs synchronously during ai-chat conversation creation
- Campaign execution uses `setInterval` — no job queue or retry mechanism
