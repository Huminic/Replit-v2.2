# Nexxus Connect v2.2 — AI-Powered Dealership Platform

## Overview

Nexxus Connect is an AI-powered dealership management platform designed with persona/department-based navigation. The project aims to provide a validated frontend prototype with real database-backed data, structured around a 4-wave product roadmap. The core business vision is to streamline dealership operations through AI-powered tools and a user-centric interface, replacing traditional feature-based navigation with a more intuitive persona-driven approach.

The project is divided into two layers:
1.  **UI Prototype (this Replit)**: Focuses on a redesigned frontend experience with real PostgreSQL data.
2.  **Production Backend (separate environment)**: A robust existing backend with extensive API endpoints, database tables, and third-party integrations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Stack
-   **React 18** with TypeScript
-   **Vite** for development and building
-   **Wouter** for client-side routing
-   **TanStack Query** for data fetching and mutation caching
-   **Tailwind CSS** with custom design tokens
-   **Shadcn/ui** component library built on Radix UI primitives

### Backend Stack
-   **Express** with TypeScript
-   **PostgreSQL** with Drizzle ORM
-   **JWT** authentication (15min access, 7d refresh)
-   **bcrypt** for password hashing
-   **Anthropic SDK** for Claude AI (claude-sonnet-4-6) — SSE streaming via `AI_INTEGRATIONS_ANTHROPIC_*` env vars

### Data Flow (Wave 2 Phase 2 + Wave 3 — Current)

Pages wired to real API data:
- **TeamBox**: `GET /api/conversations`, `GET /api/conversations/:id/messages`, `POST /api/conversations/:id/messages`, `PATCH /api/conversations/:id`
- **Main Chat**: Real Claude AI streaming via `POST /api/chat/:conversationId/stream` (SSE), persists messages, conversation channel="ai-chat", markdown rendering (react-markdown + remark-gfm), copy/regenerate/stop/retry message actions
- **RightPane Chat**: Same streaming pattern, channel="ai-assistant"
- **Agent Chat**: Per-agent conversation persistence (channel="agent-chat-{agentId}"), AI uses agent instructions as system prompt context
- **Service**: Agents from `GET /api/agents?department=service`, campaigns from `GET /api/campaigns?department=service`
- **Marketing**: Agents from `GET /api/agents?department=marketing`, campaigns from `GET /api/campaigns?department=marketing`
- **Sales**: Agents from `GET /api/agents?department=sales`
- **SubMenuManager**: Agent lists per department from API, conversation counts from API, chat history from API
- **Settings User Management**: Full CRUD — `GET /api/users`, `POST /api/users` (create), `PATCH /api/users/:id` (edit/deactivate), `GET /api/roles` (role dropdown), `POST /api/users/:id/reset-password` (admin reset), `POST /api/auth/change-password` (self change). RBAC enforced — can't modify higher-privilege users.
- **Settings Communication Gate**: `PATCH /api/organizations/:id` with outboundEnabled
- **Profile**: `PATCH /api/users/me` for contact info changes
- **Auth**: JWT login/logout/refresh, session management
- **AgentConfigPane Performance**: Live VAPI analytics (calls count, total cost, avg duration) per agent via `/api/vapi/analytics`
- **AgentConfigPane Activity**: Real VAPI call history with recording links, transcript copy, customer info via `/api/vapi/calls`
- **VAPI/Tavus Proxy**: Read-only proxy routes in `server/vendorProxy.ts` for all VAPI and Tavus API endpoints

Mock import purge COMPLETE — zero `@/mocks/` imports remain in `client/src/`:
- Types/utilities extracted to `client/src/lib/rbac.ts`, `agent-utils.ts`, `notification-utils.ts`, `activity-utils.ts`, `chat-types.ts`, `widget-types.ts`, `insight-data.ts`
- `User` and `Organization` interfaces moved to `AppContext.tsx` (were in mocks/users.ts)
- All mock data arrays renamed from `mock*` to `static*` (e.g. staticWidgets, staticActivityFeed, staticNotifications)

Pages still using hardcoded/static data (no API backend yet):
- Settings: Tools (hardcoded toolCards), Knowledge Base (hardcoded), AI Config (mockSkills inline)
- Management page: mockHunches still hardcoded (metrics tiles now wired to API)
- TopBar notifications/activity (staticNotifications, staticActivityFeed from lib files)
- Insights page (static chart data from insight-data.ts)
- Billing section in Profile
- AgentConfigPane: triggers/skills/knowledge refs still hardcoded (Performance metrics and Activity now wired to VAPI)

### Database Schema (11 tables)
-   `roles`: 8 roles with hierarchy levels (super_admin=1 through sales/service/marketing=4)
-   `organizations`: Org config including kill switch states (outbound/sms/phone/email enabled)
-   `users`: User auth and profile
-   `sessions`: JWT refresh token management
-   `agents`: AI agent definitions with department, channels, dealership, assignedPhone, vapiAssistantId, tavusPersonaId
-   `conversations`: Conversation metadata with status, channel, agentId, campaignId, campaignDisconnected
-   `messages`: Individual messages with role (customer/bot/agent/user/assistant), senderName
-   `campaigns`: Campaign config with department, killSwitch, recipient/sent/replied counts, csvFilename
-   `tasks`: Task items with status (todo/in_progress/review/done), priority (low/medium/high/urgent), dueDate, assignedUserId, tags (text[])
-   `widgets`: Chat/voice/video widget config with type, status, widgetCode, config (jsonb), impressions/interactions counters
-   `integrations`: External service connections per org (provider, externalDealerId, externalDealerName, externalIntegrationId, nexxusOrgId, status)

### API Routes
**Public**: POST /api/auth/login, POST /api/auth/forgot-password, POST /api/auth/reset-password
**Authenticated**:
- Auth: POST /api/auth/logout, POST /api/auth/refresh, GET /api/auth/me
- Agents: GET/POST /api/agents (supports ?department= filter), GET/PATCH/DELETE /api/agents/:id
- Organizations: GET /api/organizations, GET/PATCH /api/organizations/:id
- Users: GET /api/users (org users with roles), PATCH /api/users/me
- Conversations: GET/POST /api/conversations, GET/PATCH/DELETE /api/conversations/:id, GET/POST /api/conversations/:id/messages
- Campaigns: GET /api/campaigns (supports ?department= filter), POST /api/campaigns, GET/PATCH /api/campaigns/:id
- VAPI Proxy (read-only): GET /api/vapi/assistants, GET /api/vapi/phone-numbers, GET /api/vapi/calls (?assistantId=, ?limit=), GET /api/vapi/calls/:callId, GET /api/vapi/analytics
- Tavus Proxy (read-only): GET /api/tavus/personas, GET /api/tavus/replicas, GET /api/tavus/conversations (?personaId=, ?limit=)
- Metrics: GET /api/metrics/dashboard (aggregated conversationCounts, messageCounts, campaignStats, agentCounts, userCounts)
- Tasks: GET /api/tasks (?status=, ?assignedUserId=), POST /api/tasks, PATCH /api/tasks/:id, DELETE /api/tasks/:id
- Widgets: GET /api/widgets, POST /api/widgets, PATCH /api/widgets/:id, DELETE /api/widgets/:id
- Integrations: GET /api/integrations (?provider=), POST /api/integrations/provision (calls MCP vin_provision_dealer + inserts row)

### Seed Data
Default login: admin@nexxus.com / password123
- 8 roles, 3 organizations (Serra Honda/Nissan/Ford), 8 users, 5 agents (with VAPI/Tavus IDs), 6 tasks, 4 widgets
- 3 VinSolutions integrations: Serra Honda→dealer 21043, Serra Nissan→dealer 21044, Tony Serra Ford→dealer 21047
- 8 TeamBox conversations with messages across channels (sms/chat/email/whatsapp)
- 4 campaigns (service/marketing/sales departments, one with killSwitch=true)
- Agent VAPI mappings: Caroline→90a876c0, Magnolia→2203b188, Georgia→ad478eb2, Elizabeth→6d12a8fa, Savannah→6216451c
- Agent Tavus mappings: Caroline→p9eb007721f4, Magnolia→p2f586f7e4e0, Georgia→pe791670615d, Savannah→pf233f09f33d

### UI/UX Decisions and Layout Architecture
The platform features a context-aware multi-pane layout inspired by ClickUp.

**Cardinal Layout Rules:**
-   Data-centric pages display AI chat in a right pane.
-   Chat-centric pages display information/configuration in a right pane.
-   TeamBox utilizes a unique 4-column internal layout.

**Key Design Constraints:**
-   Persona names from org config (Serra, Aria, Nova) — NEVER "Automa"
-   Sidebar label: "Manage" NOT "Management"
-   Campaign kill switch: red toggle when activated, persisted to DB
-   Communication gate: master switch that halts ALL outbound comms

### Features and Functionality
-   **Persona/Department-based Navigation**: AI Chat, TeamBox, My Work, Sales, Service, Marketing, Manage
-   **Role-Based Access Control (RBAC)**: Eight distinct roles govern access to sections
-   **Campaign Safety System**: Per-campaign kill switches, per-conversation disconnects, global communication gate
-   **Chat Persistence**: Main and RightPane chats persist to database, survive page reloads
-   **TeamBox**: Real-time conversation management with reply, take over, campaign disconnect
-   **Auth System**: JWT-based with access/refresh tokens, session timeout dialog

## External Dependencies

### Frontend
-   **Wouter**: Client-side routing
-   **TanStack Query**: Data fetching and caching
-   **Tailwind CSS**: Utility-first CSS framework
-   **Shadcn/ui**: Component library built on Radix UI
-   **date-fns**: Date formatting

### Backend
-   **PostgreSQL**: Primary database
-   **Drizzle ORM**: Schema management and queries
-   **JWT (jsonwebtoken)**: Token-based authentication
-   **bcrypt**: Password hashing

### Production Backend (separate environment — nexxusv2.huminicdev.com)
-   VinSolutions (CRM), VAPI (Voice), Tavus (Video), Resend (Email), TextMagic (SMS), Claude API (AI), Google Calendar

## Sprint Workflow

Sprint process is documented in `.local/Sprint_log.md`. Each sprint follows:
1. Agent describes sprint (task + functionality outcome + acceptance criteria)
2. Memorialized in Sprint_log.md
3. User gives go-ahead
4. Agent codes it
5. Architect reviews sprint log + acceptance criteria
6. Pass → user optionally reviews. Fail → fix and re-review.
7. Agent reports percentage complete
8. Repeat

**Current Progress:** ~42%. Waves 0-1 complete, Sprints 2.1-2.2a done, Sprint 2.3+4.1a done. Next: Sprint 2.2b (File Uploads) or Sprint 3.1 (Outbound Communication).

## Standing Directives (Apply to All Sprints)

1. TeamBox needs departmental filter + RBAC — users only see conversations for their departments
2. Campaign segmentation in TeamBox — clear way to filter/view by campaign
3. Track all environment variables in a manifest for future Railway deployment
4. Supabase migration planned — PostgreSQL now, keep schema compatible
5. VAPI/Tavus prompts are vendor-side — NO bidirectional MCP yet (read-only)
6. Never use the word "MVP" in code, comments, UI text, or documentation
7. Metrics storage separate from CRM — uploaded data in its own store, agents specify data source, never auto-trigger on uploaded data
8. "Reply STOP to opt out" in every outbound SMS (same message, not two). Unsubscribe link in every email
9. All mock data must be eliminated — if no real data for a metric, remove the metric from UI entirely
10. All testing built from UI audit + acceptance criteria — no ad-hoc test plans
11. AI chat must compete with ChatGPT in quality/qualia — system prompt includes qualia instructions
12. Task assignment: agents (AI) or self-assigned only — no user-to-user assignment
13. TeamBox campaign filter: simple "Filter by Campaign" dropdown, campaigns grouped by department (Sales/Marketing/Service)
14. Full decisions table in `acceptance_criteria_audit.md`
