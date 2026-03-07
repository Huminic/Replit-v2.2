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

### New Routes (Sprints 4-5)
- Appointments: GET/POST/PATCH/DELETE /api/appointments (org-scoped, multi-tenant safe)
- Usage: GET /api/usage, GET /api/usage/summary (roleLevel ≤ 3)
- Billing: GET /api/billing/usage (org_id + period parameters)
- Landing: GET /api/public/landing/:slug
- Outbound Status: GET /api/outbound/status

### Public Routes (No Auth)
- Landing pages: GET /p/:slug
- Widget config: GET /api/widgets/public/:widgetCode
- Widget JS: GET /widget/nexxus-widget.js
- VAPI webhook: POST /api/webhooks/vapi
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

## Deferred to Wave 5
- Google Calendar / Dealer.com / Tekion actual sync (config UI built, sync needs credentials)
- Production backend cutover to nexxusv2.huminicdev.com
- Phone outbound via VAPI
- Tavus deeper integration
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
