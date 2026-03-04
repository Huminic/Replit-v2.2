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

### Data Flow (Wave 2 Phase 2 + Wave 3 — Current)

Pages wired to real API data:
- **TeamBox**: `GET /api/conversations`, `GET /api/conversations/:id/messages`, `POST /api/conversations/:id/messages`, `PATCH /api/conversations/:id`
- **Main Chat**: Creates/resumes conversations via `POST /api/conversations` (channel="ai-chat"), persists messages via API
- **RightPane Chat**: Same pattern with channel="ai-assistant"
- **Service**: Agents from `GET /api/agents?department=service`, campaigns from `GET /api/campaigns?department=service`
- **Marketing**: Agents from `GET /api/agents?department=marketing`, campaigns from `GET /api/campaigns?department=marketing`
- **Sales**: Agents from `GET /api/agents?department=sales`
- **SubMenuManager**: Agent lists per department from API, conversation counts from API, chat history from API
- **Settings User Management**: `GET /api/users` returns real org users with role info
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
- Dashboard metric tiles (hardcoded KPIs per role)
- Settings: Widgets (staticWidgets from widget-types.ts), Tools (hardcoded toolCards), Knowledge Base (hardcoded), AI Config (mockSkills inline)
- My Work page (hardcoded mockMyTasks)
- Management page (hardcoded metrics, mockHunches)
- TopBar notifications/activity (staticNotifications, staticActivityFeed from lib files)
- Insights page (static chart data from insight-data.ts)
- Billing section in Profile
- AgentConfigPane: triggers/skills/knowledge refs still hardcoded (Performance metrics and Activity now wired to VAPI)
- Service/Marketing dashboard metric tiles (inline hardcoded, not from mock files)

### Database Schema (9 tables)
-   `roles`: 8 roles with hierarchy levels (super_admin=1 through sales/service/marketing=4)
-   `organizations`: Org config including kill switch states (outbound/sms/phone/email enabled)
-   `users`: User auth and profile
-   `sessions`: JWT refresh token management
-   `agents`: AI agent definitions with department, channels, dealership, assignedPhone, vapiAssistantId, tavusPersonaId
-   `conversations`: Conversation metadata with status, channel, agentId, campaignId, campaignDisconnected
-   `messages`: Individual messages with role (customer/bot/agent/user/assistant), senderName
-   `campaigns`: Campaign config with department, killSwitch, recipient/sent/replied counts, csvFilename
-   `integrations`: External service connections per org (provider, externalDealerId, externalDealerName, externalIntegrationId, nexxusOrgId, status)

### API Routes
**Public**: POST /api/auth/login, POST /api/auth/forgot-password, POST /api/auth/reset-password
**Authenticated**:
- Auth: POST /api/auth/logout, POST /api/auth/refresh, GET /api/auth/me
- Agents: GET/POST /api/agents (supports ?department= filter), GET/PATCH/DELETE /api/agents/:id
- Organizations: GET /api/organizations, GET/PATCH /api/organizations/:id
- Users: GET /api/users (org users with roles), PATCH /api/users/me
- Conversations: GET/POST /api/conversations, GET/PATCH /api/conversations/:id, GET/POST /api/conversations/:id/messages
- Campaigns: GET /api/campaigns (supports ?department= filter), POST /api/campaigns, GET/PATCH /api/campaigns/:id
- VAPI Proxy (read-only): GET /api/vapi/assistants, GET /api/vapi/phone-numbers, GET /api/vapi/calls (?assistantId=, ?limit=), GET /api/vapi/calls/:callId, GET /api/vapi/analytics
- Tavus Proxy (read-only): GET /api/tavus/personas, GET /api/tavus/replicas, GET /api/tavus/conversations (?personaId=, ?limit=)
- Integrations: GET /api/integrations (?provider=), POST /api/integrations/provision (calls MCP vin_provision_dealer + inserts row)

### Seed Data
Default login: admin@nexxus.com / password123
- 8 roles, 3 organizations (Serra Honda/Nissan/Ford), 8 users, 5 agents (with VAPI/Tavus IDs)
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
