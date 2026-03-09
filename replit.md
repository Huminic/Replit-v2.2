# Nexxus Connect v3.0 — AI-Powered Dealership Platform

## Overview

Nexxus Connect is an AI-powered dealership management platform for Serra Auto Group / Cage Automotive. It replaces traditional feature-based navigation with an intuitive persona-driven approach, providing a validated frontend prototype with real database-backed data. The project follows the **Golden Rule: UI = T1 truth — change the data source, not the UI.** All metric tiles across every page display live API data only — no hardcoded fallback values.

## User Preferences

Preferred communication style: Simple, everyday language.
Work mode: Functional area walkthrough — stop at each area, review ACs together, discuss outcomes, then implement/test.

## Truth Hierarchy

1. UI code (approved design)
2. `.agent_docs/acceptance_criteria.md` (62 ACs)
3. SRS documentation
4. API contract
5. PLAN.md (historical reference — wave structure archived)

## System Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for development and building
- **Wouter** for client-side routing
- **TanStack Query** for data fetching and mutation caching
- **Tailwind CSS** with custom design tokens
- **Shadcn/ui** component library built on Radix UI primitives

### Backend Stack
- **Express** with TypeScript
- **PostgreSQL** with Drizzle ORM (22 tables)
- **JWT** authentication
- **bcrypt** for password hashing
- **Anthropic SDK** for Claude AI (claude-sonnet-4-6)

## Database Schema

22 tables: `roles`, `organizations`, `users`, `sessions`, `agents`, `conversations`, `messages`, `campaigns`, `tasks`, `widgets`, `integrations`, `knowledge_documents`, `campaign_recipients`, `outbound_log`, `notifications`, `activity_log`, `hunches`, `warehouse_leads`, `warehouse_metrics`, `appointments`, `slug_redirects`, `sync_log`, `usage_events`.

### Key Tables
- **appointments**: Manual appointment creation with calendar UI (title, customerName, phone, email, type, department, startTime, endTime, status, source)
- **slug_redirects**: Handles old-to-new slug redirects with 30-day expiry and forensic logging
- **usage_events**: Tracks every outbound event for metering (eventType, channel, quantity, metadata)
- **warehouse_leads / warehouse_metrics**: VinSolutions synced data with status classifier families
- **outbound_log**: Every outbound trigger logged with trigger_id, org_id, customer_id, channel, status, blocked_reason

### Kill Switch Column Defaults
All outbound columns default to **FALSE** (AC-KS-A compliant):
- `outbound_enabled`, `sms_enabled`, `phone_enabled`, `email_enabled` → default(false)
- Seed explicitly sets TRUE for test organizations

---

## Functional Areas

Work is organized into 6 functional areas. Each area is reviewed against its acceptance criteria before implementation begins.

### Area 1: UI and Chat

**Sub-topics:**
- **1a. Settings and knowledge** — Chat-specific: persona name config, knowledge documents the AI draws from, CRM Guru data sources
- **1b. Chat** — Core chat flow: sending messages, receiving streamed responses, conversation persistence
- **1c. Chat quality** — Are responses accurate? Using the right data? Appropriate tone?
- **1d. Chat bubbles** — Visual presentation: user bubbles, AI bubbles, thinking cards, timestamps
- **1e. Special chat features** — CRM Guru mode toggle, artifacts (scoped to data reports), hunch-influenced prompting
- **1f. Menu and nav look and feel** — Sidebar, submenu lock/popout/auto-revert, nav items per role, Coming Soon states

**Acceptance Criteria:**
- AC-06-A: Thinking card appears during AI processing → 1d
- AC-06-B: Chat history persists across sessions → 1b
- AC-06-C: Persona name from org's Agent Name field → 1a
- AC-06-D: Persona name fallback to VAPI config name → 1a
- AC-07-A: CRM Guru uses VIN Solutions data first → 1e
- AC-07-B: CRM Guru supplements with warehouse data (explicit attribution) → 1e
- AC-07-C: General chat suggests CRM Guru for CRM questions → 1e
- AC-CH-A: Four metric tiles displayed on AI Chat load → 1b
- AC-CH-B: Metric tiles hide when user starts chatting → 1b
- AC-NAV-A: AI Chat sub-items render → 1f
- AC-NAV-B: Artifacts scoped to data reports only → 1e, 1f
- AC-NAV-C: My Work sub-items render → 1f
- AC-NAV-D: TeamBox sub-items render → 1f
- AC-NAV-E: All conversations route to TeamBox → 1f
- AC-NAV-F: Sales sub-items match reference model → 1f
- AC-NAV-G: Service sub-items correct → 1f
- AC-NAV-H: Management sub-items correct → 1f
- AC-NAV-I: Disabled section absent from nav → 1f
- AC-NAV-J: Enabled-but-not-built section shows Coming Soon → 1f

**What's built:** AI Chat with Claude streaming, CRM Guru toggle, thinking cards, chat history persistence, 4 metric tiles with collapse, persona name from org config, sidebar with lock/popout/auto-revert (60s timer), SubMenuManager with all panel types, navigation per spec.

**Known gaps to validate:** Chat quality/response accuracy, knowledge document integration with chat, special chat features (artifacts scoped to data reports only per AC-NAV-B), long conversation behavior, chat bubble styling.

**Key files:** `client/src/pages/main.tsx`, `client/src/components/layout/Sidebar.tsx`, `client/src/components/layout/SubMenuManager.tsx`, `client/src/components/layout/AppLayout.tsx`, `server/routes.ts` (chat endpoints)

---

### Area 2: Communications

**Sub-topics:**
- **2a. Settings and knowledge** — Communication gate config, channel toggles, kill switch behavior
- **2b. New account/reset account** — User invitation flow, password reset via Resend
- **2c. SMS (Serra Honda only)** — TextMagic delivery, two-way SMS in TeamBox, agent auto-greeting
- **2d. Service Campaigns** — Campaign creation, CSV upload, execution flow, kill switch per campaign
- **2e. Notifications** — Activity feed, notification delivery and display

**Acceptance Criteria:**
- AC-05-A: Kill switch blocks SMS → 2a
- AC-05-B: Kill switch blocks phone calls → 2a
- AC-05-C: Kill switch blocks email → 2a
- AC-05-D: Channel switch blocks specific channel → 2a
- AC-05-E: Rate limit enforcement (3 per 24h per customer) → 2c, 2d
- AC-05-F: Every trigger logged with full metadata → 2a
- AC-10-A: Outbound events are counted → 2c, 2d
- AC-10-B: Usage visible to Org Admin → 2a
- AC-10-C: Usage scoped correctly per org → 2a
- AC-10-D: Billing API accessible → 2a
- AC-KS-A: All 4 kill switch columns exist in DB → 2a
- AC-KS-B: Master switch overrides individual channels → 2a

**What's built:** 5-layer CommGate safety (global env → org gate → channel toggles → rate limit → campaign kill switch), TextMagic SMS delivery, Resend email, VAPI phone outbound, usage metering to `usage_events` table, Usage page for Org Admin, Billing API endpoint, two-way SMS in TeamBox, agent auto-greeting templates, password reset with crypto tokens + Resend.

**Known gaps to validate:** Account creation/invitation flow (demo-mode toast), notification delivery and display, SMS limited to Serra Honda scope, service campaign end-to-end with real TextMagic.

**Key files:** `server/outbound.ts`, `server/routes.ts` (campaign/usage/billing endpoints), `client/src/pages/service.tsx`, `client/src/pages/settings.tsx`

---

### Area 3: Agents and Triggers

**Sub-topics:**
- **3a. Settings and knowledge** — Agent config (name, department, personality, auto-greeting template)
- **3b. Trigger handling** — What fires outbound actions, how triggers are logged, rate limiting
- **3c. Agent review** — Reviewing agent conversations, escalation handling in TeamBox
- **3d. Special prompting** — Hunch filter (accept/dismiss/resolve), how hunches feed into the AI prompt

**Acceptance Criteria:**
- AC-HF-A: Accepted hunch added to effective prompt → 3d
- AC-HF-B: Dismissed hunch not included in prompt → 3d
- AC-HF-C: Resolved hunch removed from filter → 3d
- AC-HF-D: Master prompt unchanged by hunch acceptance → 3d
- AC-TB-A: Escalation types present (Task, Escalation, Unsent Message) → 3c
- AC-TB-B: Priority levels present (4 levels) → 3c
- AC-EF-A: Dropped feature references block merge → 3a
- AC-EF-B: No production credentials in code → 3a
- AC-EF-C: Kill switch test must pass → 3a

**What's built:** Agent CRUD with department tagging, hunch filter (accept/dismiss/resolve), TeamBox 3-column layout with 3 escalation types and 4 priority levels, enforcer scanner for dropped features and credential exposure.

**Known gaps to validate:** Trigger editor (currently demo-mode toast), agent review/approval workflow, special prompting configuration UI, agent-to-conversation routing logic.

**Key files:** `server/storage.ts` (agent/hunch CRUD), `client/src/pages/teambox.tsx`, `client/src/components/AgentConfigPane.tsx`, `scripts/enforcer.ts`

---

### Area 4: One-off Lead Handling (Communications Agent)

**Sub-topics:**
- **4a. Agent handling** — How the communications agent routes and manages one-off leads
- **4b. Widgets and hosted page** — 4-channel widget, landing page at `/p/[slug]`
- **4c. Embed flow** — Embed code generation, widget behavior on external sites
- **4d. VAPI Lead Flow** — Handoff from voice call, appointment creation, VIN Solutions insertion (2-step with escalation)
- **4e. Tavus Lead Flow** — Handoff from video, appointment creation, VIN Solutions insertion

**Acceptance Criteria:**
- AC-02-A: Successful VAPI lead capture → VIN Solutions with transcript → 4d
- AC-02-B: Step 1 failure → escalation in TeamBox → 4d
- AC-02-C: Step 2 failure → escalation with contact_href → 4d
- AC-02-D: No silent failure — log + escalation always exist → 4d, 4e
- AC-04-A: Four widget channels present (Web Chat, Web Call, Contact Form, Two-Way Video) → 4b
- AC-04-B: Video launches immediately on click → 4b
- AC-04-C: Channel toggle works → 4b
- AC-04-D: Embed code generation works → 4c
- AC-08-A: Globe icon links to landing page → 4b
- AC-08-B: Landing page is publicly accessible → 4b
- AC-09-A: Landing page slug format correct → 4b
- AC-09-B: Slug collision handling → 4b
- AC-09-C: Slug edit and logging → 4b
- AC-09-D: Widget present on landing page → 4b

**What's built:** VAPI webhook → 2-step VIN lead creation with escalation on failure, Tavus webhook → VIN lead creation, widget with 4 channels (chat/call/contact/video), VAPI @vapi-ai/web SDK with real connection states, Tavus iframe with real sessions, landing pages at `/p/[slug]`, embed code generation, slug redirects with 30-day expiry, widget chat creates real conversations visible in TeamBox.

**Known gaps to validate:** Appointment creation from VAPI/Tavus calls, handoff flow from widget to human agent, embed flow in external site context.

**Key files:** `server/routes.ts` (webhook/widget endpoints), `client/src/pages/widget-landing.tsx`, `client/src/pages/settings.tsx` (widget config), `server/vendorProxy.ts` (VIN API calls)

---

### Area 5: System/Settings

**Sub-topics:**
- **5a. Uploads** — File upload handling, knowledge base document management
- **5b. General settings** — Org settings page, calendar connectors config
- **5c. Hunches** — Hunch display on Management page, accept/dismiss/resolve workflow

**Acceptance Criteria:**
- AC-03-A: Google Calendar appointment appears in Nexxus (config UI built, sync deferred) → 5b
- AC-03-B: Dealer.com appointment appears in Nexxus (config UI built, sync deferred) → 5b
- AC-03-C: Tekion appointment appears in Nexxus (config UI built, sync deferred) → 5b
- AC-03-D: Manual appointment creation → 5b
- AC-03-E: VIN Solutions NOT listed as appointment source → 5b

**What's built:** Knowledge document upload (multer), org settings page with communication gate toggles, calendar connector config UI (Google Calendar/Dealer.com/Tekion listed, VIN Solutions excluded per AC-03-E), manual appointment creation with calendar grid, hunch cards on Management page.

**Known gaps to validate:** Upload file handling and knowledge base integration, general settings save flow, calendar sync (deferred — needs connector credentials).

**Key files:** `client/src/pages/settings.tsx`, `client/src/components/AppointmentCalendar.tsx`, `server/routes.ts` (document/appointment endpoints), `server/storage.ts`

---

### Area 6: Metrics (Display and Connection)

**Sub-topics:**
- **6a. Metrics true and correct** — Pipeline accuracy, appointment counts, VIN data alignment
- **6b. Filtering and updates** — Date range filtering, org switching, data refresh
- **6c. Insights vs dash vs homepage** — Same metric shows same number everywhere (AC-01-C)
- **6d. Reports** — Insights reports tab, export/generation

**Acceptance Criteria:**
- AC-01-A: Active pipeline = leads created last 14 days, excluding Lost/Sold/Bad/Service/NonCustomer → 6a
- AC-01-B: Pipeline count displayed correctly on AI Chat → 6a, 6c
- AC-01-C: Metric consistency — same count across Sales, Marketing Insights, Management → 6c

**What's built:** Pipeline metrics from `warehouse_leads` with status classifier, VIN summary endpoint for Sales tiles, Insights dashboard and reports from aggregated warehouse data, store selector for cross-store comparison (super_admin/partner_admin), appointments from `appointments` table (not lead statuses), sync scheduler (4h metrics during business hours, 2AM ET daily delta).

**Known gaps to validate:** Filtering by date range, metric accuracy across all dashboard pages vs insights vs homepage, report generation and export.

**Key files:** `server/storage.ts` (pipeline/metrics queries), `server/vendorProxy.ts` (VIN summary), `server/statusClassifier.ts`, `client/src/pages/sales.tsx`, `client/src/pages/insights.tsx`, `client/src/pages/management.tsx`

---

## API Routes

### Core Routes
- Auth: POST /api/auth/login, POST /api/auth/logout, POST /api/auth/refresh, POST /api/auth/switch-org, POST /api/auth/forgot-password, POST /api/auth/reset-password
- Users: GET/POST/PATCH /api/users, GET /api/users/me
- Agents: GET/POST/PATCH/DELETE /api/agents
- Conversations: GET/POST/PATCH /api/conversations, messages
- Campaigns: GET/POST/PATCH /api/campaigns, execution, recipients
- Tasks: GET/POST/PATCH/DELETE /api/tasks
- Widgets: GET/POST/PATCH/DELETE /api/widgets
- Documents: GET/POST/DELETE /api/documents
- Organizations: GET /api/organizations, POST /api/organizations (super admin only)
- Hunches: GET/POST/PATCH /api/hunches

### Data & Metrics
- Pipeline: GET /api/metrics/pipeline (canonical — 14-day created leads, excluding Lost/Sold/Bad/Service/NonCustomer per AC-01-A)
- Warehouse: GET /api/warehouse/leads, GET /api/warehouse/metrics
- VIN Summary: GET /api/vin/leads/summary?orgId= (Sales tiles — warehouse leads + status classifier)
- Sync: POST /api/sync/{backfill,delta,metrics}, GET /api/sync/{status,logs}
- Appointments: GET/POST/PATCH/DELETE /api/appointments (org-scoped)
- Usage: GET /api/usage, GET /api/usage/summary (roleLevel ≤ 3)
- Billing: GET /api/billing/usage (org_id + period)
- Insights: GET /api/insights/dashboard?orgId=, GET /api/insights/reports?orgId=
- Outbound Status: GET /api/outbound/status
- Activity: GET /api/activity-log
- Notifications: GET /api/notifications

### Public Routes (No Auth)
- Landing pages: GET /p/:slug
- Widget config: GET /api/widgets/public/:widgetCode
- Widget JS: GET /widget/nexxus-widget.js
- Widget chat: POST /api/widget/chat (creates conversations + Claude AI responses)
- Widget contact: POST /api/widget/contact (creates conversations from forms)
- Widget voice config: GET /api/widget/voice-config/:slug
- Widget video session: POST /api/widget/video-session (Tavus video sessions)
- VAPI webhook: POST /api/webhooks/vapi (+ GET health check)
- Tavus webhook: POST /api/webhooks/tavus (conversation.end → VinSolutions lead)
- TextMagic webhook: POST /api/webhooks/textmagic

## External Dependencies

### Frontend
- Wouter, TanStack Query, Tailwind CSS, Shadcn/ui, date-fns, lucide-react

### Backend
- PostgreSQL, Drizzle ORM, JWT, bcrypt, Anthropic SDK, multer

### Communications
- TextMagic (SMS, X-TM-Key header), Resend (email, notifications@huminic.ai)
- 5-layer safety: Global env → org comm gate → per-channel toggles → rate limit → campaign kill switch

### Integrations
- VinSolutions (Lead Management tier — read/query only, via MCP)
- VAPI (voice — @vapi-ai/web SDK + server API)
- Tavus (video sessions)

## Authentication
- JWT tokens: `nexxus_access_token` (underscores) in localStorage
- Login response key: `accessToken` (not `token`) — auth returns `{ accessToken, refreshToken, user }`
- Test logins: admin@nexxus.com/password123, duane.wells@huminic.ai/a1$ucc3ss (super_admin), durran.cage@cageautomotive.com/password123 (partner_admin), Org_Admin@huminic.ai/O3g$uccess, Partner_admin@huminic.ai/P@rtner$uccess, Sales_staff@huminic.ai/S@les$uccess, marketing_staff@huminic.ai/M@3keting$uccess, Executive_staff@huminic.ai/Ex3c$uccess
- Role hierarchy: super_admin(1) > partner_admin(2) > org_admin(3) > executive(4) > sales_manager(5) > sales(6) > service(7) > marketing(8)
- Duane's test number: 4126546500

## Multi-Store Architecture (Cage Automotive)
- **Cage Automotive** (partner org, id: b1a2c3d4-...): Parent entity linking 5 dealership stores via `partnerId`
- **5 Stores**: Serra Honda, Serra Nissan, Tony Serra Ford, Hyundai of Columbia, Ford of Columbia
- **VinSolutions Dealer IDs**: Serra Honda=21043, Serra Nissan=21044, Tony Serra Ford=21047, Ford of Columbia=13398, Hyundai of Columbia=13399
- **NEXXUS_ORG_MAP** in `server/vendorProxy.ts`: Maps all 5 local org UUIDs to MCP nexxusOrgIds for VinSolutions API calls (Hyundai=227a5597, Ford=2ff5afa0, Honda=3795b8f6, Nissan=7f868569, TonySerra=8751c73d)
- **VIN API limit**: Max 100 leads per query. Backfill uses 7-day windows to paginate through 90 days of data
- **4 stores have NULL vinCreatedAt/vinUpdatedAt** — COALESCE with syncedAt makes date filters effectively no-op
- **Org Switcher**: TopBar uses live `/api/organizations` query; Cage Automotive parent filtered out; shows 5 dealerships
- **Data isolation**: `resolveOrgIdParam()` helper in routes.ts ensures orgId-based filtering with role authorization
- **Sync scheduler**: 4h metrics refresh during business hours, 2AM ET daily delta sync

## Deferred Items
- Google Calendar / Dealer.com / Tekion actual sync (config UI built, sync needs connector credentials)
- Production backend cutover to nexxusv2.huminicdev.com
- RLS row-level security policies
- Demo-mode actions: billing UI, trigger editor, knowledge base management, kill switch toggle UI (15 items — all toast-based)

## Key Files
- `shared/schema.ts` — All 22 tables, insert schemas, types
- `server/routes.ts` — All API routes
- `server/storage.ts` — Database storage layer (CRUD for all entities)
- `server/statusClassifier.ts` — VIN status family mapper (active/new/sold/lost/bad/service/non_customer)
- `server/outbound.ts` — Outbound engine with 5-layer CommGate safety and usage logging
- `server/vendorProxy.ts` — VinSolutions MCP integration and org mapping
- `server/seed.ts` — Test data seeding (8 roles, 6 orgs, 8+ users, agents, sample data)
- `server/auth.ts` — JWT authentication middleware
- `client/src/pages/main.tsx` — AI Chat with CRM Guru mode
- `client/src/pages/teambox.tsx` — TeamBox 3-column layout
- `client/src/pages/widget-landing.tsx` — Public landing page with 4-channel widget
- `client/src/components/AppointmentCalendar.tsx` — Calendar with appointment creation
- `client/src/components/layout/SubMenuManager.tsx` — Navigation submenu (lock/popout/auto-revert)
- `client/src/components/layout/Sidebar.tsx` — Left sidebar with toggle
- `client/src/components/layout/AppLayout.tsx` — Master layout orchestrator
- `client/src/contexts/AppContext.tsx` — App-wide state (auth, org, role, panels)
- `scripts/enforcer.ts` — Compliance scanner
- `.agent_docs/acceptance_criteria.md` — 62 ACs, DO NOT MODIFY
