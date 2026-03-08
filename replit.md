# Nexxus Connect v3.0 — AI-Powered Dealership Platform

## Overview

Nexxus Connect is an AI-powered dealership management platform for Serra Auto Group / Cage Automotive. It replaces traditional feature-based navigation with an intuitive persona-driven approach, providing a validated frontend prototype with real database-backed data. The project follows the **Golden Rule: UI = T1 truth — change the data source, not the UI.** All metric tiles across every page display live API data only — no hardcoded fallback values.

## User Preferences

Preferred communication style: Simple, everyday language.

## Truth Hierarchy

1. UI code (approved design)
2. `.agent_docs/acceptance_criteria.md` (62 ACs)
3. SRS documentation
4. API contract
5. PLAN.md sequencing

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

### Key Tables Added
- **appointments**: Manual appointment creation with calendar UI (title, customerName, phone, email, type, department, startTime, endTime, status, source)
- **slug_redirects**: Handles old-to-new slug redirects with 30-day expiry and forensic logging
- **usage_events**: Tracks every outbound event for metering (eventType, channel, quantity, metadata)

### Kill Switch Column Defaults
All outbound columns default to **FALSE** (AC-KS-A compliant):
- `outbound_enabled`, `sms_enabled`, `phone_enabled`, `email_enabled` → default(false)
- Seed explicitly sets TRUE for test organizations

## Features Built (Sprints 1-6)

### Sprint 1: Design Metrics Restored
- Home page role-based design metrics (8 roles with realistic fallback values)
- Sales (7 tiles), Service (6 tiles), Marketing (4 tiles), Management (6 tiles)
- Full Insights page with all tabs

### Sprint 2: AI Chat + Pipeline Consistency
- 4 AC-required tiles on AI Chat: active pipeline, appointments today, open escalations, outbound sent 24h
- Tiles collapse when user starts typing (AC-CH-B)
- Pipeline count consistent across AI Chat, Sales, and Management (AC-01-C)
- Active pipeline = leads created last 14 days, excluding Lost/Sold/Duplicate (AC-01-A)

### Sprint 3: VAPI + TeamBox + Kill Switch
- VAPI→VIN Solutions 2-step lead creation with escalation on failure
- TeamBox: 3 visually distinct types (Task, Escalation, Unsent Message), 4 priority levels
- Kill switch creates "Unsent Message" escalation when blocking outbound sends
- Rate limiting (3 messages per 24h per customer)

### Sprint 4: Calendar, Widget, Landing Pages, Navigation
- **Calendar**: Real monthly grid on Sales and Service with manual appointment creation, connector config UI for Google Calendar/Dealer.com/Tekion (VIN Solutions NOT listed per AC-03-E)
- **Widget**: Exactly 4 channels (Web Chat, Web Call, Contact Form, Two-Way Video), video launches on click
- **Landing Pages**: Globe icon → `/p/[org-slug]`, public access without login, slug redirect with 30-day expiry
- **Navigation**: Full spec compliance (Sales has Agents/no Campaigns, Service has Agents+Campaigns, Coming Soon on Assistant and Hunches)

### Sprint 5: CRM Guru, Usage, Kill Switch Fix, Hunches
- **CRM Guru**: Dedicated mode toggle in chat input, VIN Solutions data priority, warehouse supplement with explicit attribution, general chat suggests CRM Guru for CRM questions
- **Usage Metering**: `usage_events` table, logging on every outbound send, Usage page for Org Admin (counts, no dollars), Partner Admin org-scoped view, `/api/billing/usage` API endpoint
- **Kill Switch**: Defaults changed from TRUE to FALSE, seed explicitly sets TRUE for test orgs
- **Hunch Filter**: Verified — accepted hunches in prompt, dismissed excluded, resolved removed, master prompt unchanged

### Sprint 6: Enforcer + AC Sweep + Documentation
- **Enforcer** (scripts/enforcer.ts): Scans for dropped features ("Drive", "Custom Agent", "Sharing"), forbidden Artifacts context, credential exposure, kill switch default verification
- Cleaned up Drive references from MobileNavDropdown, MobileSidebar, activity-utils
- Full 62-AC sweep verified passing

### Stabilization Sweep 5: Database Hardening
- CASCADE rules on all 30+ foreign keys, 12 indexes added
- Campaign execution persisted to DB, password reset wired with crypto tokens + Resend
- Initial Drizzle migration (0000_curious_madame_web.sql) generated and pushed

### Stabilization Sweep 6: Frontend Remediation (Mock Removal)
- **Insights page**: Replaced all 23 mock data imports with useQuery hooks to GET /api/insights/dashboard + GET /api/insights/reports; hunches wired to GET /api/hunches; deleted client/src/lib/insight-data.ts (725 lines)
- **TopBar activity feed**: Replaced static mock with useQuery to GET /api/activity-log
- **My Work chat tab**: Replaced mock conversations with useQuery to GET /api/conversations
- **OrgWizard**: Wired to POST /api/organizations (super admin only)
- **Mock files deleted**: All 12 files in client/src/mocks/ removed (zero consumers confirmed)
- **Demo-mode actions**: 15 toast-based demo actions categorized as post-MVP deferrals (billing, trigger editor, knowledge base, kill switch)

## API Routes

### Core Routes
- Auth: POST /api/auth/login, POST /api/auth/logout, POST /api/auth/refresh
- Users: GET/POST/PATCH /api/users, GET /api/users/me
- Agents: GET/POST/PATCH/DELETE /api/agents
- Conversations: GET/POST/PATCH /api/conversations, messages
- Campaigns: GET/POST/PATCH /api/campaigns, execution, recipients
- Tasks: GET/POST/PATCH/DELETE /api/tasks
- Widgets: GET/POST/PATCH/DELETE /api/widgets
- Documents: GET/POST/DELETE /api/documents

### Data & Metrics
- Pipeline: GET /api/metrics/pipeline (canonical source)
- Warehouse: GET /api/warehouse/leads, GET /api/warehouse/metrics
- Sync: POST /api/sync/{backfill,delta,metrics}, GET /api/sync/{status,logs}

### New Routes (Sprints 4-6)
- Appointments: GET/POST/PATCH/DELETE /api/appointments (org-scoped, multi-tenant safe)
- Usage: GET /api/usage, GET /api/usage/summary (roleLevel ≤ 3)
- Billing: GET /api/billing/usage (org_id + period parameters)
- Landing: GET /api/public/landing/:slug
- Outbound Status: GET /api/outbound/status
- Insights: GET /api/insights/dashboard, GET /api/insights/reports (aggregated warehouse data)
- Organizations: POST /api/organizations (super admin only, creates org + admin + agent)

### Public Routes (No Auth)
- Landing pages: GET /p/:slug
- Widget config: GET /api/widgets/public/:widgetCode
- Widget JS: GET /widget/nexxus-widget.js
- Widget chat: POST /api/widget/chat (creates conversations + Claude AI responses)
- Widget contact: POST /api/widget/contact (creates conversations from forms)
- Widget voice config: GET /api/widget/voice-config/:slug
- Widget video session: POST /api/widget/video-session (creates Tavus video sessions)
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
- 4-layer safety: Global env → org comm gate → per-channel toggles → rate limit

### Integrations
- VinSolutions (Lead Management tier — read/query only)
- VAPI (voice), Tavus (video)

## Authentication
- JWT tokens: `nexxus_access_token` in localStorage
- Test logins: admin@nexxus.com/password123, Org_Admin@huminic.ai, duane.wells@huminic.ai/a1$ucc3ss
- Role hierarchy: super_admin(1) > partner_admin(2) > org_admin(3) > executive(4) > sales_manager(5) > sales(6) > service(7) > marketing(8)

### Stabilization Sweep 7: Integration Wiring
- **VAPI Voice Outbound**: sendPhone() in outbound.ts wired to real VAPI POST /call API via vapiPost() helper
- **Tavus Video Sessions**: POST /api/widget/video-session creates real Tavus conversations, returns conversation_url
- **Widget Chat**: POST /api/widget/chat creates real conversations + Claude AI responses (visible in TeamBox)
- **Widget Contact Form**: POST /api/widget/contact creates real conversations from form submissions
- **Widget Voice**: VAPI @vapi-ai/web SDK integrated with real connection states (connecting/connected/error/ended)
- **Widget Video**: Tavus iframe rendering with real video session URLs
- **Landing Page Form**: POST /api/widget/contact wired for main landing page form submissions
- **Demo slug resolution**: resolveOrgBySlug() helper maps 'demo' to first available org for all public endpoints

### Stabilization Sweep 8: Five Aha Moments
- **Two-Way SMS**: TeamBox agent replies on SMS conversations now deliver via TextMagic API; [SMS] prefix sends SMS on any channel conversation; usage metering logged
- **Tavus Webhook → VinSolutions**: POST /api/webhooks/tavus receives conversation.end events, fetches transcript, creates local conversation, pushes contact+lead to VinSolutions (with escalation on failure)
- **Agent Auto-Greeting**: New `auto_greeting` column on agents; when a conversation is created with a phone number, the active agent's greeting template is sent via SMS automatically (template vars: {{customerName}}, {{dealershipName}}, {{agentName}})
- **VAPI Webhook Hardening**: GET /api/webhooks/vapi health-check endpoint added for VAPI webhook registration
- **Service Campaign**: Full end-to-end SMS campaign flow verified (creation → CSV upload → execution → TextMagic delivery)
- **Duane's test number**: 4126546500

### Stabilization Sweep 9: RBAC Login Fix
- **Role initialization on login**: Fixed AppContext.tsx — on login, currentRole now always syncs from the authenticated user's actual role (via `roleInitialized` flag). Previously, a stale `nexxus-current-role` value in localStorage or the `org_admin` default would override the user's real role, causing super_admin users to see a reduced sidebar on first login.
- **Test credentials updated**: duane.wells@huminic.ai/a1$ucc3ss, Partner_admin@huminic.ai/P@rtner$uccess, Org_Admin@huminic.ai/O3g$uccess, Sales_staff@huminic.ai/S@les$uccess, marketing_staff@huminic.ai/M@3keting$uccess, Executive_staff@huminic.ai/Ex3c$uccess

## Deferred to Wave 5
- Google Calendar / Dealer.com / Tekion actual sync (config UI built, sync needs credentials)
- Production backend cutover to nexxusv2.huminicdev.com
- RLS row-level security policies

## Key Files
- `shared/schema.ts` — All 22 tables, insert schemas, types
- `server/routes.ts` — All API routes
- `server/storage.ts` — Database storage layer
- `server/outbound.ts` — Outbound engine with kill switch and usage logging
- `server/seed.ts` — Test data seeding
- `client/src/pages/main.tsx` — AI Chat with CRM Guru mode
- `client/src/pages/widget-landing.tsx` — Public landing page with 4-channel widget
- `client/src/components/AppointmentCalendar.tsx` — Calendar with appointment creation
- `client/src/components/layout/SubMenuManager.tsx` — Navigation shell
- `scripts/enforcer.ts` — Compliance scanner
- `.agent_docs/acceptance_criteria.md` — DO NOT MODIFY
