# Nexxus V2 -- Reverse SRS (As-Built Specification)

**Document Type:** Forensic As-Built Documentation
**Audit Date:** 2026-02-21
**Compiled By:** Claude Opus 4.6 (forensic code audit)
**Source Data:** 5 specialist audit reports, 4 governing documents, project configuration files
**Repository:** `/home/ubuntu/Claude-store/nexxus-v2`
**Branch:** `master`
**Live URL:** https://nexxusv2.huminicdev.com

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Origin and Vision](#2-project-origin-and-vision)
3. [What Has Been Built (The As-Built Inventory)](#3-what-has-been-built-the-as-built-inventory)
4. [Feature Capability Matrix](#4-feature-capability-matrix)
5. [Architecture Deep Dive](#5-architecture-deep-dive)
6. [Known Issues and Technical Debt](#6-known-issues-and-technical-debt)
7. [Gaps Between Spec and Reality](#7-gaps-between-spec-and-reality)
8. [Deployment and Operations](#8-deployment-and-operations)
9. [Risk Assessment](#9-risk-assessment)
10. [Recommendations and Next Steps](#10-recommendations-and-next-steps)
11. [Appendix: Metrics Dashboard](#11-appendix-metrics-dashboard)

---

## 1. Executive Summary

### What Is Nexxus?

Nexxus V2 is an AI orchestration platform that bridges businesses, their CRM data, third-party integrations, and language models. Its first vertical is automotive dealerships, where it provides AI-powered voice agents (VAPI), video agents (Tavus), an AI chat assistant (DealerBrain/Automa), SMS messaging (TextMagic), email integration, and a multi-tenant dashboard system. The platform operates on a partner delivery model: domain experts recruit customers into their segments and manage them through the platform. The platform operator is Huminic, and the first partner is Duran Cage (automotive sales expert).

### What It Does Today

As of 2026-02-21, the system is live and serving two paying customers (Serra Automotive, Hyundai of Columbia). Users can log in, view AI-powered dashboards, chat with an AI assistant, manage leads, schedule appointments, send SMS and email, configure embeddable widgets for customer websites, and receive webhook-driven data from voice and video AI interactions. The platform processes VAPI voice call webhooks and Tavus video session webhooks, extracts leads from AI conversations, and queues them for insertion into the VIN Solutions CRM. A trigger engine allows automated outbound actions based on lead events, though all 15 existing trigger rules are currently deactivated.

### Key Metrics at a Glance

| Metric | Value |
|--------|-------|
| Lines of code (TypeScript + TSX) | 117,693 |
| Total source files | 402 |
| API endpoints | ~237 |
| Database tables | 53 |
| Database migrations | 33 |
| RLS policies | ~100 |
| Service modules | 40 |
| Scheduled background jobs | 8 |
| Third-party integrations | 7 |
| E2E test cases (Playwright) | 747 |
| Unit tests | 0 |
| npm dependencies | 122 (91 prod + 31 dev) |
| Known vulnerabilities | 7 (0 critical, 4 high) |
| Git commits | 181 over 31 days |
| PM2 memory usage | 148.9 MB |
| Project age | 31 days (2026-01-21 to 2026-02-21) |

### Overall Health Verdict: YELLOW

**Reasoning:**

- GREEN indicators: The platform is live, deployed, and serving customers. TypeScript strict mode compiles cleanly. A comprehensive E2E test suite (747 tests) covers all major features. Security primitives (JWT, RLS, RBAC, encryption, webhook verification) are in place and well-implemented. The architecture is consistent and well-structured across 34 route files and 40 service modules.

- YELLOW indicators: Zero unit tests exist. No linter, formatter, or CI/CD pipeline is configured. 380 explicit `any` type annotations undermine strict TypeScript benefits. 242 unstructured `console.log` statements serve as the only logging mechanism. A critical RLS variable name mismatch (`app.current_organization_id` vs `app.current_org_id`) exists in the SecureQueryBuilder, the architecturally intended secure query path. Several key acceptance criteria remain partially addressed or not done. The `CLAUDE.md` project configuration file contains stale metrics that could mislead future development sessions.

- RED indicators: None individually at the blocking level, but the accumulation of yellow items represents significant risk if unaddressed.

---

## 2. Project Origin and Vision

### 2.1 Why V2 Was Built

Nexxus V1 (located at `/home/ubuntu/Claude-store/nexxus/`) was audited and found to contain 8,750+ issues including 379 CRITICAL security vulnerabilities. Rather than attempt a refactor of the compromised codebase, the decision was made to rebuild from scratch with security-first architecture, complete isolation from V1, and zero risk to the production system.

V1 is now listed as RETIRED (not running in PM2), though production customer deployment documentation still references V1 infrastructure URLs (`nexxusdev.huminicdev.com`), creating an unresolved question about the customer transition.

### 2.2 Business Model

Nexxus operates on a partner-enabled delivery model:

```
Huminic (Platform Operator)
    |
    +-- Partner: Duran Cage (Automotive Sales Expert)
         |
         +-- Customer: Serra Automotive (3 dealerships)
         |     +-- Serra Honda (dealer ID 21043)
         |     +-- Serra Nissan (dealer ID 21044)
         |     +-- Tony Serra Ford (dealer ID 21047)
         |
         +-- Customer: Hyundai of Columbia
               +-- Hyundai of Columbia
               +-- Ford of Columbia
```

**Revenue Model (Per-Usage AI Economics):**

| Service | Customer Price | Platform Cost | Margin |
|---------|---------------|---------------|--------|
| Voice AI (VAPI) | $0.25/min | $0.15/min | 40% |
| Video AI (Tavus) | $0.32/min | $0.20/min | 37.5% |
| SMS (TextMagic) | $0.05/msg | $0.02/msg | 60% |

### 2.3 Customers

Two live customers as of the audit date:

| Customer | Status | Deployed | Contact |
|----------|--------|----------|---------|
| Serra Automotive | Live in production | 2026-01-16 | victoria@misscommunicationconsulting.com |
| Hyundai of Columbia | Live in production | 2026-01-16 | sam.mayfield@bc.auto |

Five Tavus video agents are deployed across these customers: Caroline (Serra Honda), Magnolia (Serra Nissan), Georgia (Tony Serra Ford), Elizabeth (Hyundai of Columbia), Savannah (Ford of Columbia).

### 2.4 The 5 Customer Acceptance Criteria

These represent the non-negotiable minimum bar for customer sign-off. Every phase of development must advance at least one.

| # | Use Case | Description | Current Status |
|---|----------|-------------|----------------|
| AC-1 | Automatic Outbound Call Triggering | Trigger-based outbound calls via VAPI when conditions are met (new lead, hot lead, missed call) | Code exists but all 15 trigger rules are DEACTIVATED. No live outbound calls triggered. |
| AC-2 | Intelligent VIN Data Analysis | DealerBrain answers dealership questions using live VIN Solutions data via Context Router | Functional -- depends on Context Router (enabled) and OAuth (working). Some header verification gaps remain. |
| AC-3 | Lead Insertion to VIN Solutions | Leads from VAPI/Tavus are written back to VIN Solutions CRM | Pipeline exists (webhook -> sync_queue -> SyncCoordinator -> VIN API). Conflicting status reports in documentation. |
| AC-4 | Accurate Dashboard Metrics | Lead metrics, health scores, and data on dashboards are accurate, real-time, and usable | Partial -- source labels removed, Context Router enabled, excel_upload excluded. Metrics fragmentation across 5 services remains. |
| AC-5 | Widget Deployment | Centralized Master Widget config + individual hosted page widgets deployable per org | Fully implemented and certified. |

### 2.5 Core Problem Statement (From the User)

From the Brain Dump document (the user's authoritative statement of intent):

> "Businesses (currently dealerships) lose not because of lead volume but because of response gaps, execution failures, data fragmentation, and manual processes."

Success means: no leads left behind, AI handles routine interactions, leadership has accurate metrics, staff can use AI productively, and all key information is accessible based on role.

---

## 3. What Has Been Built (The As-Built Inventory)

### 3.1 Database Layer

**Provider:** Supabase (PostgreSQL), hosted on AWS us-west-2
**Connection:** pg.Pool (max 10 connections), prefers direct URL (port 5432) over pgbouncer (port 6543)

#### 3.1.1 Tables

**Total tables defined in migrations:** 53

| Group | Tables | Count |
|-------|--------|-------|
| Core Identity | organizations, locations, roles, users, partner_admin_organizations | 5 |
| Integrations | integrations, user_integrations | 2 |
| AI Agents | agents, skills, agent_runs | 3 |
| Conversations | conversations, messages | 2 |
| Leads & CRM | leads, sync_queue, vin_reports_cache | 3 |
| Voice/Video | vapi_call_logs, tavus_sessions | 2 |
| Communication | textmagic_config, textmagic_messages, textmagic_opt_outs, sms_conversation_state, cached_emails, sent_emails, email_templates | 7 |
| Work Center | tasks, appointments, availability_blocks, appointment_reminders, inbox_conversations, inbox_messages | 6 |
| Insights & Analytics | dashboards, widgets, goals, insight_card_config, insight_card_state, dealer_pulse_cache, report_benchmarks | 7 |
| Widget System | widget_configs, widget_callback_requests, widget_visitors, widget_chat_messages, hosted_pages | 5 |
| Governance & Tracking | ai_usage_events, trigger_rules, trigger_executions, trigger_templates, tracking_events, audit_log | 6 |
| Business | credit_policies, credit_allocations, credit_usage, service_quotas | 4 |
| Drive & Artifacts | drive_folders, drive_files, artifacts, knowledge_uploads | 4 |
| Workflow | hunches, approval_requests | 2 |
| Auth | password_reset_tokens | 1 |
| Notifications | notification_settings, notifications | 2 |
| Config | dealerbrain_config, vin_api_calls | 2 |

Note: The CLAUDE.md project file claims "36 tables" -- this is outdated. The actual migration files define 53 CREATE TABLE statements across 33 migration files.

#### 3.1.2 Migrations

**Total migration files:** 33 (numbered 001-033, with 011 missing)
**Location:** `/home/ubuntu/Claude-store/nexxus-v2/database/migrations/`
**Date range:** 2026-01-22 through 2026-02-19

**Anomalies:**
- Migration 011 is missing (gap between 010 and 012)
- Two files share the 004 prefix (numbering collision)

#### 3.1.3 RLS Coverage

- **53 tables have RLS enabled** (every CREATE TABLE includes `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- **~100 RLS policies** defined across all migrations
- **1 table has no RLS at all:** `report_benchmarks` (public reference data -- intentional)

**RLS Pattern Distribution:**

| Pattern | Description | Table Count |
|---------|-------------|-------------|
| Organization isolation (`app.current_org_id`) | Most common -- isolates by org | 43 |
| User-self-access (`app.current_user_id`) | Personal data (integrations, emails, notifications) | 7 |
| Super Admin bypass (`app.user_role_level = 1`) | System-wide access for platform operator | 16 |
| Service role bypass (`TO service_role`) | Background jobs and webhook handlers | 17 |
| Role-tiered access | Org Admin+ manages, Staff reads | 5 |
| Open read | Available to all authenticated users | 2 |

#### 3.1.4 Critical Database Findings

**CRITICAL: RLS Variable Name Mismatch**

The `SecureQueryBuilder` (the architecturally intended secure query path) sets:
```sql
SET LOCAL app.current_organization_id = '...'
```

But every RLS policy in the database checks:
```sql
current_setting('app.current_org_id', true)
```

These are different variable names. The `current_setting` with `true` returns empty string if the variable is not set, which when cast to UUID will fail, effectively denying all access through SecureQueryBuilder for organization-scoped queries.

**Mitigation:** Most route handlers bypass SecureQueryBuilder entirely and use `set_config('app.current_org_id', ...)` directly. The system works, but the intended security architecture is broken.

**File:** `/home/ubuntu/Claude-store/nexxus-v2/server/db/SecureQueryBuilder.ts` (line 244)

**Additional Variable Anomalies:**

| Variable | Location | Issue |
|----------|----------|-------|
| `app.current_organization_id` | SecureQueryBuilder only | WRONG NAME -- not matched by any RLS policy |
| `app.current_role_level` | `server/routes/triggers.ts` line 38 | WRONG NAME -- should be `app.user_role_level` |
| `app.current_role` | dealer_pulse_cache, knowledge_uploads policies | Checks string `'super_admin'` but this variable is never set by application code |

**SET LOCAL Without Transaction:** `SecureQueryBuilder.query()` uses `SET LOCAL` which is transaction-scoped, but does NOT wrap queries in a transaction (no BEGIN/COMMIT). Outside a transaction, `SET LOCAL` is equivalent to `SET` and persists for the session, potentially leaking RLS context to subsequent queries on the same pooled connection.

**Other Findings:**
- 58 JSONB columns with no database-level schema validation
- 16+ tables have `updated_at` columns but no automatic trigger (inconsistent with 12 tables that do have triggers)
- ~160 indexes across all tables (well-indexed)
- ~80 foreign key relationships
- Missing FK declarations on `textmagic_messages.linked_lead_id` and `linked_appointment_id`

### 3.2 Server/API Layer

**Framework:** Express.js 5 (pre-release) with TypeScript
**File count:** ~96 server-side files
**Lines of code:** 47,479

#### 3.2.1 Endpoints

**Total API endpoints:** ~237

| Category | Route Prefix | Endpoints | Auth Level |
|----------|-------------|-----------|------------|
| Auth | `/api/auth` | 9 | Mixed (public + JWT) |
| Admin | `/api/admin` | 14 | Super Admin |
| Knowledge | `/api/admin/knowledge` | 4 | Org Admin+ |
| Agents | `/api/agents` | 9 | Mixed (Any + Org Admin+) |
| Appointments | `/api/appointments` | 10 | Mixed (Any + public confirm) |
| Approvals | `/api/approvals` | 5 | Any |
| Activity | `/api/activity` | 6 | Mixed (Any + Org Admin+) |
| Conversations | `/api/conversations` | 11 | Any |
| Credits | `/api/credits` | 5 | Mixed (Any + Org Admin+) |
| Dashboard | `/api/dashboard` | 1 | Any |
| DealerBrain | `/api/dealerbrain` | 3 | Super Admin |
| Drive | `/api/drive` | 8 | Any |
| Email | `/api/email` | 7 | Any |
| Goals | `/api/goals` | 7 | Mixed (Any + Org Admin+) |
| Google Calendar | `/api` (oauth/calendar) | 7 | Mixed (Any + public callback) |
| Hosted Pages | `/api/hosted-pages` | 5 | Mixed (Any + Org Admin+) |
| Hosted Pages Public | `/api/pages` | 1 | Public |
| Hunches | `/api/hunches` | 4 | Any |
| Inbox | `/api/inbox` | 8 | Mixed (Any + Org Admin+) |
| Insights | `/api/insights` | 15 | Mixed (Any + Org Admin+) |
| Integrations | `/api/integrations` | 6 | Mixed (Any + Org Admin+) |
| Leads | `/api/leads` | 6 | Any |
| Metrics | `/api/metrics` | 3 | Mixed (Any + Super Admin) |
| Notifications | `/api/notifications` | 8 | Any |
| Reports | `/api/reports` | 5 | Mixed (Any + Org Admin+) |
| Settings | `/api/settings` | 4 | Org Admin+ |
| SMS | `/api/sms` | 7 | Mixed (public webhook + Any + Admin) |
| Tasks | `/api/tasks` | 9 | Any |
| Tracking | `/api/tracking` | 6 | Mixed (public + Org Admin+) |
| Triggers | `/api/triggers` | 10 | Mixed (Any + Org Admin+) |
| VIN Solutions | `/api/vin` | 10 | Mixed (Any + Super Admin + Org Admin+) |
| Widgets | `/api/widgets` | 9 | Mixed (public + Any + Org Admin+) |
| Widget Public | `/api/widgets/public` | 8 | Public (rate limited) |
| User Integrations | `/api/user/integrations` | 7 | Any |
| Health | `/api/health` | 1 | Public |
| Webhooks | `/api/webhooks` | 2 | Public (signature verified) |

**Endpoint Auth Distribution:**

| Auth Level | Count |
|------------|-------|
| Public (no auth) | ~15 |
| Any authenticated user | ~110 |
| Org Admin+ (role level <= 3) | ~40 |
| Super Admin only (role level = 1) | ~20 |

#### 3.2.2 Service Inventory (40 modules)

| Service | File | Lines | Purpose |
|---------|------|-------|---------|
| DealerBrainService | `DealerBrainService.ts` | 3,047 | Claude API with tool calling (non-streaming) |
| DealerBrainStreamingService | `DealerBrainStreamingService.ts` | 2,020 | Claude API SSE streaming |
| VinSolutionsService | `vinSolutionsService.ts` | 1,134 | VIN CRM API client |
| TriggerService | `TriggerService.ts` | 1,413 | Event-driven automation engine |
| AppointmentService | `AppointmentService.ts` | 1,248 | Calendar CRUD with RBAC |
| TextMagicService | `TextMagicService.ts` | 1,130 | SMS send/receive |
| CreditService | `CreditService.ts` | -- | Usage tracking and billing |
| WidgetConfigService | `WidgetConfigService.ts` | -- | Widget CRUD |
| WidgetInteractionService | `WidgetInteractionService.ts` | -- | Widget chat, callbacks, SMS, video |
| WidgetAgentService | `WidgetAgentService.ts` | -- | Widget AI chat |
| InboxService | `InboxService.ts` | -- | Unified messaging inbox |
| DealerPulseService | `DealerPulseService.ts` | -- | 5-phase health snapshots |
| EmailService | `EmailService.ts` | -- | IMAP/SMTP operations |
| GoogleCalendarService | `GoogleCalendarService.ts` | -- | Google Calendar OAuth + CRUD |
| NotificationService | `NotificationService.ts` | -- | In-app notifications |
| KnowledgeUploadService | `KnowledgeUploadService.ts` | -- | CSV/XLSX import |
| GoalsService | `GoalsService.ts` | -- | Goal tracking |
| HunchesService | `HunchesService.ts` | -- | AI-generated insights |
| DriveService | `DriveService.ts` | -- | File/folder management |
| MetricsEngine | `MetricsEngine.ts` | -- | Certified metrics registry |
| + 20 more | Various | -- | See server audit for complete list |

**Sub-service modules:**
- Context Router: `ContextRouterService.ts`, `SourceSelector.ts`, `CacheManager.ts` (data query orchestration)
- Sync: `SyncCoordinator.ts`, `LeadMapper.ts` (VIN bidirectional sync)
- Notifications: `notificationEmailService.ts` (Resend email delivery)

#### 3.2.3 Integration Inventory (7 Third-Party Systems)

| Integration | Type | Auth | Purpose |
|-------------|------|------|---------|
| VIN Solutions | REST API (OAuth2) | Client Credentials (60-min tokens) | CRM data: leads, contacts, dealers, users |
| VAPI | Webhook inbound | Shared secret (`X-Vapi-Secret`) | Voice AI call data, transcripts |
| Tavus | Webhook inbound + Outbound API | HMAC-SHA256 + API key | Video AI session data |
| Resend | SDK | API key | Transactional email (notifications, welcome) |
| TextMagic | REST API v2 | Username + API key | SMS send/receive |
| Anthropic Claude | SDK | API key | AI chat, tool calling, content generation |
| Google Calendar | OAuth2 (Authorization Code) | OAuth tokens | Calendar sync, appointment push |

#### 3.2.4 Webhook Architecture

**VAPI Webhook** (`/api/webhooks/vapi`)
- Events: `call.started`, `call.ended`, `end-of-call-report`, `transcript`, `status-update`
- Organization resolution: `metadata.organizationId` or `assistantId` lookup in agents table
- Idempotency: `notification_sent` and `credit_recorded` columns with atomic UPDATE...WHERE...RETURNING pattern
- Security: Optional shared secret (timing-safe comparison); accepts without verification if header absent

**Tavus Webhook** (`/api/webhooks/tavus`)
- Events: `conversation.started`, `conversation.ended`, `replica.ready`, `video.ready`
- Organization resolution: `custom_data.organization_id` or `persona_id` lookup in agents table
- Security: HMAC-SHA256 with timestamp tolerance (5 minutes)

**TextMagic Inbound** (`/api/sms/webhook/inbound`)
- Public endpoint, no signature verification (TextMagic does not sign)
- Wires into inbox and trigger evaluation

#### 3.2.5 Scheduled Jobs (8)

| Job | Interval | Purpose |
|-----|----------|---------|
| VIN Token Refresh | 30 min | Refresh OAuth tokens before expiry |
| Sync Queue Worker | 1 min (outbound), 4 hrs (inbound) | Process sync_queue (Nexxus <-> VIN) |
| Appointment Reminder | 5 min | Send 24h and 2h reminders |
| Email Sync | 5 min | Sync IMAP emails for all users |
| VIN Lead Polling | 60 min | Import new VIN leads |
| Trigger Re-evaluation | 5 min | Re-evaluate age-based trigger conditions |
| Dealer Pulse | 4 hrs | Generate dealership health snapshots |
| Hunch Generation | 6 hrs | Generate AI-powered insights |

All jobs use native `setInterval` (no Redis/Bull), implement singleton guards (`isRunning` flag), and use staggered startup delays (0-90s) to prevent thundering herd.

#### 3.2.6 DealerBrain Tool Inventory

The DealerBrain AI chat system exposes the following tools to Claude for function calling:

| Tool Name | Purpose | Data Source |
|-----------|---------|-------------|
| `query_leads` | Search and filter leads | Context Router (VIN API primary, local DB fallback) |
| `query_vapi_calls` | Search voice call logs | Local DB (vapi_call_logs) |
| `query_tavus_sessions` | Search video sessions | Local DB (tavus_sessions) |
| `query_vin_data` | Query VIN Solutions CRM data | VIN Solutions API (live) |
| `create_goal` | Create performance goals | Local DB (goals) |
| `create_agent` | Create AI agents | Local DB (agents) |
| `get_lead_details` | Get detailed lead info | Context Router |
| `get_call_transcript` | Retrieve call transcripts | Local DB (vapi_call_logs) |
| `get_session_transcript` | Retrieve video transcripts | Local DB (tavus_sessions) |
| `search_inventory` | Search vehicle inventory | VIN Solutions API |
| `check_availability` | Check appointment slots | Local DB (availability_blocks) |
| `create_appointment` | Book appointments | Local DB (appointments) |
| `create_task` | Create work tasks | Local DB (tasks) |
| `send_sms` | Send SMS messages | TextMagic API |
| `query_goals` | Retrieve goal status | Local DB (goals) |
| `query_agents` | List configured agents | Local DB (agents) |
| `query_appointments` | Search appointments | Local DB (appointments) |
| `query_tasks` | Search tasks | Local DB (tasks) |
| `get_dashboard_metrics` | Dashboard data | Multiple services |
| `get_dealer_pulse` | Dealer health data | DealerPulseService |
| `query_credit_usage` | Credit/billing info | CreditService |
| `get_org_settings` | Organization config | Local DB |
| `query_notifications` | Recent notifications | Local DB |
| `get_activity_feed` | AI usage events | Local DB |

**Governance:** DealerBrainProcessor middleware interface exists for pre/post-processing. Currently Stage 1 (monitoring only). Stages 2 and 3 (intervention, approval gates) are defined in the SRS but deferred.

#### 3.2.7 Rate Limiting Detail

| Route | Limit | Window | Scope |
|-------|-------|--------|-------|
| POST /api/auth/login | 30 requests | 1 minute | Per IP |
| POST /api/auth/register | 5 requests | 1 hour | Per IP |
| POST /api/auth/forgot-password | 3 requests | 1 hour | Per IP |
| /api/widgets/public/* (all 8 endpoints) | 100 requests | 1 hour | Per IP |
| POST /api/insights/dealer-pulse/refresh | 1 request | 15 minutes | Per org |

No global rate limiting is applied. API endpoints not listed above have no rate limiting.

#### 3.2.8 Error Handling Patterns

All 34 route files use consistent try/catch:
```typescript
router.get('/', authenticate, async (req, res) => {
  try {
    // business logic
    res.json({ ... });
  } catch (error) {
    console.error('[Module] Error description:', error);
    res.status(500).json({ error: 'Failed to ...' });
  }
});
```

Both webhook handlers return HTTP 200 even on processing errors (prevents retry storms). Non-critical operations (credit recording, notifications, performance metrics) are individually wrapped so failures do not block the webhook response.

Process-level safety nets:
- `process.on('uncaughtException')` -- logged but process NOT exited
- `process.on('unhandledRejection')` -- logged but process NOT exited

Express error middleware returns generic messages in production (`NODE_ENV === 'production'`), full error messages in development.

#### 3.2.9 Authentication and Authorization

**JWT Architecture:**

| Token Type | Expiry | Audience | Purpose |
|------------|--------|----------|---------|
| Access Token | 24 hours | `nexxus-api` | API authentication |
| Refresh Token | 7 days | `nexxus-api` | Token renewal |
| Appointment Confirmation | 48 hours | `nexxus-appointment` | Public confirmation links |

**RBAC Model (4-Tier):**

| Level | Role | Capabilities |
|-------|------|--------------|
| 1 | Super Admin | System-wide access, manages partners, provisions tools |
| 2 | Partner Admin | Manages assigned organizations, cross-org switching |
| 3 | Org Admin | Manages users and settings within organization(s) |
| 4 | Org Staff | Uses agents, views insights, manages own work |

**Encryption:** AES-256-GCM for all secrets at rest (OAuth tokens, API keys, email credentials). Key derived from `SESSION_SECRET` via PBKDF2 (100,000 iterations, SHA-256).

#### 3.2.10 Seed Data (Pre-Loaded in Production)

The database includes pre-seeded reference and customer data:

**System Reference Data:**
- 4 RBAC roles: Super Admin (level 1), Partner Admin (2), Org Admin (3), Org Staff (4)
- 2 default email templates: Appointment Confirmation, 24-Hour Reminder
- 3 DealerBrain config entries: system_instructions, feedback_enabled, feedback_instructions
- 12 industry benchmark metrics (close rate, contact rate, appointment rates, etc.)
- 1 trigger template: "Neglected Lead Auto-Call"

**Customer Data:**
- 3 organizations: Serra Honda, Serra Nissan, Tony Serra Ford
- 3 users: Partner Admin (durran@cageautomotive.com), Serra Honda Admin, Serra Honda Staff
- 3 VIN Solutions integrations (dealer IDs: 21043, 21044, 21047)
- 5 Tavus video agents registered (Caroline, Magnolia, Georgia, Elizabeth, Savannah)
- 3 sample leads, 2 sample VAPI calls, 1 sample Tavus session

**Development Seed Data** (separate file: `database/seed.sql`):
- Nexxus Platform organization
- Test dealership
- Super Admin, Org Admin, and Org Staff test users

### 3.3 Client/Frontend Layer

**Framework:** React 18 + TypeScript + Vite
**File count:** ~172 source files
**Lines of code:** 43,548 (35,991 TSX + 7,557 TS)

#### 3.3.1 Pages and Routes

**Total pages:** 21 (17 main + 4 hosted/public)
**Active routes:** 17 protected + 4 public + 1 catch-all

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Dashboard | Command Center with health scores, lead feed, goals, agent actions |
| `/chat` | DealerBrain | AI chat with SSE streaming, tool visibility, file upload |
| `/agents` | Agents | Three-column agent management with embedded chat |
| `/agents/create` | Agent Create | Multi-step creation wizard |
| `/agents/:id/edit` | Agent Edit | Agent configuration editor |
| `/insights` | Insights | 6-tab analytics: Dashboard, Goals, Reports, Attribution, Hunches, Dealer Pulse |
| `/leads` | Insights (alias) | Convenience route to Insights with leads tab |
| `/work-center` | Work Center | 5-tab hub: Calendar, Tasks, Approvals, Communication, Open Leads |
| `/drive` | Drive | File management with grid/list view, folders, upload |
| `/activity` | Activity | AI Governance: usage events, artifacts, CSV export |
| `/settings/system` | Settings | 16+ role-gated tabs |
| `/profile` | Profile | Profile editing, preferences, Google Calendar integration |
| `/notifications` | Notifications | History, filtering, settings |
| `/w/:slug` | Hosted Page | Public widget pages (chat, video, callback, multi) |

#### 3.3.2 Components

| Category | Count |
|----------|-------|
| shadcn/ui primitives (Radix-based) | 47 |
| Layout components | 8 |
| Chat components | 6 |
| Modal components | 9 |
| Report components | 8 |
| Settings tab components | 8 |
| Insights components | 5 |
| Communication components | 3 |
| Calendar components | 2 |
| Admin components | 2 |
| Notification components | 3 |
| Other (auth, inbox, SMS, onboarding) | 4 |
| **Total** | **105** |

#### 3.3.3 State Management

**Dual-layer architecture:**

1. **Server state:** TanStack Query (React Query) -- 38 `useQuery` calls, 34 `useMutation` calls across 26 custom hooks
2. **Client state:** 4 React Context providers (Auth, App, Chat, Theme)

**Provider hierarchy:**
```
QueryClientProvider > TooltipProvider > ThemeProvider > AuthProvider > AppProvider > ChatProvider
```

**Token storage:** `localStorage` with keys `nexxus_access_token`, `nexxus_refresh_token`, `nexxus_token_expiry`. Auto-refresh checks every 60 seconds, refreshes when < 5 minutes to expiry.

#### 3.3.4 UI Framework

- **CSS:** Tailwind CSS v4 with comprehensive custom theme system (615 lines of custom CSS)
- **Theme:** Light/dark mode via CSS class strategy (`dark` class on `<html>`)
- **Icons:** lucide-react (60+ unique icons)
- **Calendar:** FullCalendar
- **Rich text:** Tiptap editor
- **Charts:** Recharts (via shadcn chart component)
- **Onboarding:** driver.js (9-step product tour)
- **Fonts:** Inter (sans), Merriweather (serif), Fira Code (mono)

**Responsive design:** Mobile breakpoint at 1024px (`lg`). Mobile gets Sheet-based sidebar and bottom nav. Desktop gets icon sidebar (w-16, collapsible to w-10). Wide desktop (1280px+) adds optional right pane (w-80).

### 3.4 Testing and Quality

#### 3.4.1 Test Inventory

| Category | Files | Test Cases |
|----------|-------|------------|
| E2E (Playwright) | 46 | 747 |
| Verification scripts | 11 | N/A (manual) |
| Smoke/env tests | 4 | N/A (manual) |
| Diagnostic scripts | 7 | N/A (utility) |
| Unit tests (Jest) | **0** | **0** |
| Component tests (RTL) | **0** | **0** |
| Integration tests | **0** | **0** |
| **Total automated** | **46** | **747** |

**E2E test breakdown:**

| Category | Tests | Files |
|----------|-------|-------|
| Core Platform (auth, nav, RBAC, settings) | 156 | 8 |
| Feature tests (agents, chat, credits, insights) | 135 | 8 |
| Sprint feature tests (widget through leads) | 199 | 11 |
| Quality/verification tests | 124 | 6 |
| Stabilization tests | 28 | 6 |
| Regression tests | 105 | 7 |

**Test infrastructure:** Playwright ^1.58.1, Chromium only, 1280x720, parallel locally, sequential in CI, 0 retries (local) / 2 retries (CI). Screenshots and video captured on failure.

#### 3.4.2 What IS Tested

- Authentication flow (login, logout, JWT refresh)
- 4-tier RBAC enforcement (23 tests)
- All major page loads and navigation (28 tests)
- DealerBrain AI chat persona (34 tests)
- All sprint features (phases 10-20, 199 tests)
- Adversarial edge cases (51 tests)
- Demo readiness validation (18 tests)

#### 3.4.3 What IS NOT Tested

- No unit tests for any service (DealerBrainService, TriggerService, VinSolutionsService, etc.)
- No isolated component tests
- No API integration tests (all API testing is via E2E browser automation)
- No load/performance tests
- No security-specific tests beyond E2E RBAC checks
- No test coverage measurement configured
- No runtime E2E pass/fail results captured as evidence

#### 3.4.4 Code Quality Metrics

| Metric | Value | Assessment |
|--------|-------|------------|
| TypeScript strict mode | Enabled | Good |
| `any` type annotations | 380 (325 server, 55 client) | Significant concern |
| `console.log` statements | 242 (server) | No structured logging |
| `@ts-nocheck` | 2 (archived files only) | Acceptable |
| `@ts-ignore` | 1 (widget only) | Acceptable |
| ESLint | Not configured | Missing |
| Prettier | Not configured | Missing |
| Pre-commit hooks | Not configured | Missing |
| CI/CD pipeline | Not configured | Missing |

#### 3.4.5 Dependency Health

| Severity | Count | Notable |
|----------|-------|---------|
| Critical | 0 | -- |
| High | 4 | `xlsx` (prototype pollution + ReDoS, NO FIX), `minimatch` (ReDoS), `glob`, `sucrase` |
| Moderate | 2 | `lodash` (prototype pollution), `markdown-it` (ReDoS) |
| Low | 1 | `qs` (DoS) |

The `xlsx` package has 2 high-severity CVEs with no available fix. This is the library used for Excel file parsing in the knowledge upload feature.

---

## 4. Feature Capability Matrix

### 4.1 Core Platform

| Feature | Status | Evidence |
|---------|--------|----------|
| JWT Authentication (login, logout, refresh) | Working | 9 auth endpoints, 19 E2E tests |
| Password Reset (token-based) | Working | `password_reset_tokens` table, forgot/reset endpoints |
| 4-Tier RBAC | Working | 4 roles seeded, 23 RBAC E2E tests, middleware enforcement |
| Multi-Tenant Isolation (RLS) | Working (with caveats) | 53 tables with RLS, ~100 policies. SecureQueryBuilder has variable name mismatch (see Section 6). |
| Partner Admin Org Switching | Working | `switch-org` endpoint, `partner_admin_organizations` junction table |
| Audit Logging | Working | `audit_log` table, entries created on admin ops, VIN token refresh, org switch |
| User Registration | Working | Super Admin only, sends welcome email + SMS |

### 4.2 AI Agents

| Feature | Status | Evidence |
|---------|--------|----------|
| DealerBrain (AI Chat) | Working | Claude API integration, 24 tools, SSE streaming, 34 persona E2E tests |
| Automa (System Agent) | Working | Always active, cannot be deleted/duplicated |
| Voice Agents (VAPI) | Working (inbound) | Webhook pipeline certified, call logs stored, transcripts captured |
| Voice Agents -- Outbound Calls | Not Functional | TriggerService code exists but all 15 trigger rules are DEACTIVATED |
| Video Agents (Tavus) | Working | 5 deployed personas, HMAC webhook verification, session tracking |
| Agent CRUD (create/edit/delete) | Working | 9 endpoints, multi-step wizard UI |
| Agent Performance Metrics | Not Wired | GAP-1: `performanceMetrics` field exists but never populated by webhooks |
| Agent Skills System | Partial | 10 skill types defined in UI; skill execution not fully connected to agent runtime |

### 4.3 Integrations

| Feature | Status | Evidence |
|---------|--------|----------|
| VIN Solutions OAuth2 | Working | Token refresh every 30 min, encrypted storage, auto-refresh at 90% lifetime |
| VIN Solutions Lead Search | Working | `searchLeads()`, `getLead()`, contact enrichment |
| VIN Solutions Lead Creation | Working (pipeline exists) | 2-step: create contact via gateway, then create lead with href references |
| VIN Solutions Mark Contacted | Partial | GAP-2: Updates local DB only; VIN write-back code exists but may not execute |
| VIN Lead Polling (inbound) | Working | 60-min job imports new leads, deduplicates by `vin_customer_id` |
| VAPI Webhook Processing | Working | 5 event types handled, idempotency guards, lead extraction |
| Tavus Webhook Processing | Working | 4 event types handled, HMAC verification, lead extraction |
| Resend Email | Working | Lead notifications, welcome emails |
| TextMagic SMS | Working (basic) | Send/receive, opt-out management |
| TextMagic AI Auto-Reply | Not Built | GAP-3: Schema exists (`ai_auto_reply_enabled`), logic not implemented |
| Google Calendar OAuth | Working | OAuth flow, calendar sync, appointment push |
| Claude API (DealerBrain) | Working | Non-streaming + SSE streaming, tool calling, content generation |

### 4.4 Communication

| Feature | Status | Evidence |
|---------|--------|----------|
| SMS Send/Receive | Working | TextMagic integration, 7 SMS endpoints |
| SMS AI Routing (business hours) | Not Built | GAP-3: No business hours routing logic |
| SMS Collision Avoidance | Not Built | GAP-4: Schema exists (`sms_conversation_state`), state machine not implemented |
| Email Send (IMAP/SMTP) | Working | 7 email endpoints, Tiptap rich text compose |
| Email Sync (IMAP) | Working | 5-min background job, up to 50 integrations per run |
| Email Notifications (Resend) | Working | Lead notifications, welcome emails |
| Staff Messaging Inbox | Working | Unified inbox, thread management, 8 endpoints |

### 4.5 Business Intelligence

| Feature | Status | Evidence |
|---------|--------|----------|
| Dashboard (Command Center) | Working | DealershipPulse, GoalProgress, LeadFeed, AgentActions, TeamLeaderboard |
| Voice Agent Insights | Working | VoiceAgentCard with call metrics |
| Video Session Insights | Working | VideoDataCard with session metrics |
| Lead Feed Card | Working | Real-time from VIN Solutions API |
| Dealer Pulse | Working | 5-phase health snapshots, Claude Haiku commentary, 4-hour refresh |
| Goals | Working | CRUD, progress tracking, 7 endpoints |
| Hunches (AI Suggestions) | Working | AI-generated, accept/dismiss workflow |
| Reports | Working | Catalog, generation, PDF export, 5 endpoints |
| Attribution (Tracking Pixel) | Working | Event tracking, funnel analysis, 6 endpoints |
| Unified Metrics Engine | Not Built | GAP-6: Metrics fragmented across 5 services |

### 4.6 Workflow

| Feature | Status | Evidence |
|---------|--------|----------|
| Calendar / Appointments | Working | FullCalendar integration, Google Calendar sync, 10 endpoints |
| Tasks | Working | CRUD, status management, calendar view, 9 endpoints |
| Approvals | Working | Create/approve/reject workflow, 5 endpoints |
| Drive (File Management) | Working | Upload, download, folders, 1GB quota, 8 endpoints |
| Knowledge Uploads (CSV/XLSX) | Working | Import with undo capability, 4 endpoints |

### 4.7 Widget System

| Feature | Status | Evidence |
|---------|--------|----------|
| Master Widget Config | Working | Per-org config, domain whitelisting, embed code generation |
| Widget Chat (AI) | Working | Public SSE streaming, rate limited (100/hr/IP) |
| Widget Voice (VAPI) | Working | Public key provided for browser audio |
| Widget Video (Tavus) | Working | Session creation via Tavus API |
| Widget Callback Requests | Working | Form submission, VAPI call-back |
| Widget SMS | Working | TextMagic integration |
| Hosted Pages | Working | 4 page types (chat, video, callback, multi), public at `/w/:slug` |
| Domain Validation | Working | Widget code + origin validation |

### 4.8 Administration

| Feature | Status | Evidence |
|---------|--------|----------|
| User Management | Working | CRUD, role assignment, soft-delete, 14 admin endpoints |
| Organization Management | Working | CRUD, cascading deactivation |
| Partner Link Management | Working | Create/delete partner-org associations |
| DealerBrain Config | Working | System instructions, feedback settings, 3 endpoints |
| Credit Tracking | Working (backend) | Policies, allocations, usage, balance calculation |
| Credit Page (UI) | Deferred | Route commented out (`/credits`), intentional business decision |
| AI Governance | Working | Usage event tracking, token counting, CSV export (admin) |
| Notification Settings | Working | Per-category email/in-app toggles |
| Service Quotas | Schema Only | Table exists but no enforcement logic found in routes |

---

## 5. Architecture Deep Dive

### 5.1 System Architecture

```
                          INTERNET
                             |
                      +------+------+
                      |   Caddy     |  (Reverse Proxy, SSL)
                      |  (sysadmin) |
                      +------+------+
                             |
                    https://nexxusv2.huminicdev.com
                             |
                +------------+------------+
                |                         |
         Static Assets              API Requests
         (dist/public/)            (/api/*)
                |                         |
                v                         v
    +-------------------+   +----------------------------+
    | Vite SPA (React)  |   |  Express.js 5 Server       |
    | - 21 pages        |   |  - 34 route files          |
    | - 105 components  |   |  - 40 service modules      |
    | - shadcn/ui       |   |  - 3 middleware layers      |
    | - TanStack Query  |   |  - 8 background jobs       |
    | - Wouter routing  |   |  - 2 webhook handlers      |
    +-------------------+   +----------------------------+
                                      |
                         +------------+------------+
                         |            |            |
                    Direct Pool  RLS Policies  Background Jobs
                    (pg, max 10) (~100 policies) (setInterval)
                         |            |            |
                         v            v            v
              +------------------------------------------+
              |     Supabase PostgreSQL                   |
              |     (aws-0-us-west-2)                    |
              |                                          |
              |  53 tables | ~160 indexes | 2 functions  |
              |  12+ triggers | ~80 foreign keys         |
              |  58 JSONB columns                        |
              +------------------------------------------+

    External Services:
    +----------+  +----------+  +----------+  +----------+
    |   VAPI   |  |  Tavus   |  |  VIN     |  | TextMagic|
    | (Voice)  |  | (Video)  |  | Solutions|  | (SMS)    |
    | Webhook  |  | Webhook  |  | OAuth2   |  | REST API |
    +----------+  +----------+  +----------+  +----------+

    +----------+  +----------+  +----------+
    | Resend   |  | Claude   |  | Google   |
    | (Email)  |  | (AI/LLM) |  | Calendar |
    | SDK      |  | SDK      |  | OAuth2   |
    +----------+  +----------+  +----------+
```

### 5.2 Data Flow: Voice Call to Lead Creation

```
1. Customer calls VAPI phone number
   |
2. VAPI processes call with AI assistant
   |
3. VAPI sends webhook events to /api/webhooks/vapi
   |-- call.started -> Create vapi_call_logs record + conversation record
   |-- transcript -> Store real-time transcript messages
   |-- end-of-call-report -> UPSERT call log, then:
   |
4. Lead Extraction (from end-of-call-report)
   |-- Check call duration >= org threshold (default 10s)
   |-- If transcript or phone available:
   |     |
   |     5. Queue "lead_to_vin" job in sync_queue
   |        |
   |        6. SyncCoordinator picks up job (1-min interval)
   |           |
   |           7. LeadMapper formats data for VIN API
   |              |
   |              8. VIN Solutions 2-step creation:
   |                 a. POST /gateway/v1/contact -> Get ContactId
   |                 b. POST /leads?dealerId=X with href references
   |                    (leadSource, leadType, contact as URLs)
   |              |
   |              9. Update sync_queue status (completed/failed)
   |
   |-- Credit recording (atomic, idempotent via credit_recorded flag)
   |-- Email notification (atomic, idempotent via notification_sent flag)
   |-- In-app notification
   |-- Appointment extraction (if confidence >= 70%)
   |-- Agent performance metrics update (note: GAP-1 -- not wired)
```

### 5.3 Data Flow: DealerBrain Query

```
1. User types query in chat (e.g., "How many new leads this week?")
   |
2. Client sends POST /api/conversations/:id/stream (SSE)
   |
3. DealerBrainStreamingService receives request
   |-- Sets RLS context for organization isolation
   |-- Builds system prompt with org context, user role, available tools
   |-- Sends to Claude API with tool definitions
   |
4. Claude API processes and may call tools:
   |-- query_leads -> ContextRouterService -> SourceSelector
   |     |-- Primary: VIN Solutions API (live query)
   |     |-- Fallback: Local database (leads table)
   |     |-- Cache: 5-min TTL for VIN data
   |     |-- Exclusion: excel_upload records filtered out
   |
5. Tool results returned to Claude for synthesis
   |
6. SSE events streamed to client:
   |-- thinking -> UI shows "Analyzing your request..."
   |-- tool_start -> UI shows tool card with running spinner
   |-- tool_end -> UI updates tool card with result summary
   |-- token -> UI appends text progressively
   |-- done -> UI marks streaming complete
   |
7. AI governance event logged (fire-and-forget)
   |-- ai_usage_events record: action_type, tool_invoked, tokens
```

### 5.4 Data Flow: Widget Chat to Staff Inbox

```
1. Visitor opens widget on customer website
   |-- Widget validates widgetCode + domain origin
   |-- POST /api/widgets/public/session creates visitor record
   |
2. Visitor sends chat message
   |-- POST /api/widgets/public/chat (or /chat/stream for SSE)
   |-- WidgetInteractionService receives message
   |
3. AI Response Generation
   |-- WidgetAgentService builds context from widget config
   |-- Uses chat_instructions, chat_agent_name, chat_enabled_tools
   |-- Sends to Claude API for response
   |-- Streams response back via SSE
   |
4. Inbox Wiring (fire-and-forget)
   |-- Creates inbox_conversation record (channel: 'widget_chat')
   |-- Creates inbox_message record (sender_type: 'customer')
   |-- Staff can see and respond in Work Center > Communication tab
   |
5. Lead Extraction (if visitor provides contact info)
   |-- Creates/updates widget_visitors record
   |-- Links to leads table if phone/email matches
   |-- Evaluates trigger rules (event: 'widget_interaction')
```

### 5.5 Data Flow: Trigger Execution

```
1. Triggering Event Occurs
   |-- new_lead (from VIN polling, webhook, or manual)
   |-- lead_status_change (from lead update)
   |-- hot_lead (from lead score threshold)
   |-- appointment_created (from appointment CRUD)
   |-- missed_call (from VAPI webhook with missed status)
   |-- widget_interaction (from widget chat)
   |-- sms_received (from TextMagic inbound webhook)
   |
2. TriggerService.evaluateEvent(event)
   |-- Queries active trigger rules for matching event_type
   |-- Evaluates conditions (JSON condition objects):
   |     { lead_age_hours: { gte: 2 }, no_prior_contact: true }
   |-- Checks rate limits (max executions/hour)
   |-- Checks business hours (if business_hours_only flag set)
   |
3. Action Dispatch (if conditions match)
   |-- outbound_call: Creates VAPI outbound call via API
   |-- send_sms: Sends SMS via TextMagicService
   |-- send_notification: Creates in-app notification
   |-- create_task: Creates task in tasks table
   |-- assign_lead: Updates lead assignment
   |
4. Execution Logging
   |-- Creates trigger_executions record with event_data, action_result, status
   |-- Status: pending -> queued -> executing -> completed/failed/skipped
   |
5. Age-Based Re-evaluation (Background Job)
   |-- Runs every 5 minutes
   |-- Finds leads created in last 30 minutes with status='new'
   |-- Re-evaluates with computed lead_age_minutes
   |-- Catches leads that didn't match at creation (age=0)
```

### 5.6 Data Flow: VIN Solutions OAuth Token Lifecycle

```
1. Initial Setup (manual)
   |-- Org Admin enters client_id + client_secret in Settings
   |-- POST /api/vin/initialize triggers first token request
   |-- VinOAuthService.initializeOAuth2():
   |     POST https://authentication.vinsolutions.com/connect/token
   |     grant_type=client_credentials
   |-- Token encrypted (AES-256-GCM) and stored in integrations.credentials
   |-- Token expires in 60 minutes
   |
2. Automatic Refresh (every 30 minutes)
   |-- VIN Token Refresh Job checks all active integrations
   |-- Refreshes tokens expiring within 10 minutes
   |-- Decrypts current token, validates expiry
   |-- Requests new token from VIN auth endpoint
   |-- Encrypts and stores new token
   |-- Creates audit_log entry
   |
3. Usage (on API call)
   |-- VinSolutionsService.makeAuthenticatedRequest():
   |     Decrypts token from DB
   |     Sets Authorization: Bearer <token>
   |     Sets Accept header (v1 for reference, v3 for leads)
   |     Logs call to vin_api_calls table (endpoint, params, duration, status)
   |
4. Failure Handling
   |-- 401 response: Attempts immediate token refresh
   |-- 403 response: Logs as blocked endpoint (17 known blocked)
   |-- Other errors: Logged and surfaced to caller
```

### 5.7 Context Router Architecture

The Context Router is the data orchestration layer that unifies queries across multiple data sources. It is a central architectural concept in the Nexxus platform.

**Components:**

```
DealerBrain / Dashboard / Insights
        |
        v
ContextRouterService
        |
        +-- SourceSelector (decides which source to query)
        |     |-- Priority 1: VIN Solutions API (live, authoritative)
        |     |-- Priority 2: Local Database (fallback)
        |     |-- Exclusion: excel_upload records filtered out
        |
        +-- CacheManager
        |     |-- VIN leads: 5-minute TTL
        |     |-- VIN reports: 1-hour TTL
        |     |-- VAPI/Tavus: 1-hour TTL
        |
        +-- Source Tagging
              |-- Every response tagged with data source origin
              |-- Tags: vin_api, local_db, vapi, tavus, manual, widget
              |-- Tags are for internal traceability (not displayed to users)
```

**Configuration:** `CONTEXT_ROUTER_ENABLED=true` in `.env` (was `false` prior to 2026-02-16 fix)

**Truth Hierarchy (from the Constitution):**

| Priority | Source | Authoritative For |
|----------|--------|-------------------|
| 1 | VIN Solutions API | Leads, statuses, sources, types, CRM users |
| 2 | VAPI / Tavus APIs | AI call and video session data |
| 3 | Local Database | Nexxus-only data (tasks, goals, agents, preferences, activity) |
| 4 | Derived Metrics | Computed on demand, never cached as truth |

**Key Decision:** When VIN API returns data that differs from the local database, VIN wins. The local database is updated to match.

### 5.8 VIN Solutions API Coverage Map

The platform interacts with VIN Solutions through 13 accessible endpoints and is blocked from 17 others:

**Accessible Endpoints (13):**

| Endpoint | Version | Method | Purpose |
|----------|---------|--------|---------|
| `/leads` | v3 | GET | Search leads with filters |
| `/leads/id/{LeadId}` | v3 | GET | Get single lead (note: URL includes `/id/` segment) |
| `/leads` | v3 | POST | Create new lead (requires href references for source, type, contact) |
| `/leads/id/{LeadId}` | v3 | PUT | Update lead (accepts leadStatus despite not being in OAS spec) |
| `/leadSources` | v1 | GET | Get valid lead source hrefs per dealer |
| `/leadTypes` | v1 | GET | Get valid lead type hrefs |
| `/leadStatuses` | v1 | GET | 4 status values |
| `/leadStatusTypes` | v1 | GET | 6 status type values |
| `/leadGroupCategories` | v1 | GET | 3 category values |
| `/gateway/v1/contact/{contactId}` | gateway | GET | Get contact details |
| `/gateway/v1/contact` | gateway | POST | Create new contact (AddContactRequestModel) |
| `/gateway/v1/tenant/user` | gateway | GET | Get CRM users (for lead assignment) |
| `/gateway/v1/tenant/dealer` | gateway | GET | Get dealer information |

**Header Requirements (Critical):**
- v1 reference endpoints: `Accept: application/vnd.coxauto.v1+json` (NOT v3)
- v3 lead CRUD: `Accept: application/vnd.coxauto.v3+json` (lowercase v3, NOT uppercase V3)
- Gateway endpoints: `Accept: application/json`
- All endpoints: `Authorization: Bearer <token>`

**Blocked Endpoints (17, all return 403 Forbidden):**

| Endpoint | Impact |
|----------|--------|
| `/gateway/v1/communication` | Cannot track communication history |
| `/gateway/v1/activity` | Cannot analyze CRM activity logs |
| `/gateway/v1/deals` | Cannot see deal economics or pipeline revenue |
| `/gateway/v1/contacts` (search) | Cannot deduplicate contacts before creation |
| `/gateway/v1/appointments` | Cannot sync CRM appointments |
| `/gateway/v1/notes` | Cannot access CRM notes |
| `/gateway/v1/tasks` | Cannot sync CRM tasks |
| `/gateway/v1/calls` | Cannot access CRM call records |
| `/gateway/v1/calldetails` | Cannot access call detail records |
| `/gateway/v1/emails` | Cannot access CRM email records |
| `/gateway/v1/inventory` | Cannot access vehicle inventory |
| `/gateway/v1/vehicles` | Cannot access vehicle data |
| `/gateway/v1/desking` | Cannot access deal structure data |
| `/gateway/v1/customer` | Cannot access full customer records |
| `/gateway/v1/lead` | Redundant gateway version of leads |
| `/gateway/v1/leads` | Redundant gateway version of leads |
| Additional (1) | Various other blocked endpoints |

**Architectural Impact:** The platform can observe the lead lifecycle from creation through status change to final disposition (SOLD/LOST), but cannot observe the human execution in between (calls made, emails sent, appointments set, notes taken, deal negotiations). This is a fundamental data gap imposed by VIN Solutions' API permissions.

### 5.9 Security Architecture

```
Layer 1: Network
  +-- Caddy reverse proxy (SSL termination, managed by sysadmin)
  +-- Helmet security headers (CSP disabled for SPA)

Layer 2: Authentication
  +-- JWT (jsonwebtoken) with 24h access / 7d refresh tokens
  +-- bcrypt password hashing (10 salt rounds)
  +-- Rate limiting on auth endpoints (30 login/min, 5 register/hr)

Layer 3: Authorization (RBAC)
  +-- 4-tier role hierarchy enforced via middleware
  +-- requireSuperAdmin, requireOrgAdminOrHigher, requireRoleLevel(n)
  +-- Resource ownership validation (integration, agent, conversation, lead, task)

Layer 4: Multi-Tenancy (RLS)
  +-- PostgreSQL RLS policies on all 53 tables
  +-- Session variables: app.current_org_id, app.current_user_id, app.user_role_level
  +-- SecureQueryBuilder (architecturally intended path -- has variable name bug)
  +-- Manual set_config() in route handlers (working path)

Layer 5: Data Protection
  +-- AES-256-GCM encryption for secrets at rest
  +-- PBKDF2 key derivation (100,000 iterations)
  +-- Sensitive field redaction in API response logs
  +-- Soft deletes for users and organizations

Layer 6: Webhook Verification
  +-- VAPI: Timing-safe shared secret comparison
  +-- Tavus: HMAC-SHA256 with 5-minute timestamp tolerance
  +-- TextMagic: No verification (platform limitation)

Layer 7: Public Endpoint Protection
  +-- Rate limiting: 100/hr per IP on widget public endpoints
  +-- Domain validation: widgetCode + origin check
  +-- CORS: scoped to widget public endpoints only
```

---

## 6. Known Issues and Technical Debt

### 6.1 CRITICAL (Blocks Functionality or Security Risk)

| # | Issue | Source | Impact | File/Location |
|---|-------|--------|--------|---------------|
| C-1 | RLS variable name mismatch | Database Audit | SecureQueryBuilder sets `app.current_organization_id` but all RLS policies check `app.current_org_id`. System works only because most routes bypass SecureQueryBuilder. | `server/db/SecureQueryBuilder.ts` line 244 |
| C-2 | SET LOCAL without transaction | Database Audit | `SET LOCAL` outside a transaction block persists for the session and could leak RLS context to subsequent queries on a pooled connection. | `server/db/SecureQueryBuilder.ts` |
| C-3 | `app.current_role` never set | Database Audit | Two tables (`dealer_pulse_cache`, `knowledge_uploads`) have Super Admin bypass policies checking `app.current_role = 'super_admin'`, but no application code sets this variable. These bypass policies are non-functional. | Migrations 025, 027 |
| C-4 | Triggers route wrong variable | Database Audit | `server/routes/triggers.ts` line 38 sets `app.current_role_level` instead of `app.user_role_level`. Trigger RLS policies may not work correctly. | `server/routes/triggers.ts` |
| C-5 | All trigger rules DEACTIVATED | Docs Audit | All 15 trigger rules across 5 orgs are deactivated. AC-1 (outbound calls) has never executed in production. | D-FLAG-001 pending decision |

### 6.2 HIGH (Significant But Workaround Exists)

| # | Issue | Source | Impact | Recommendation |
|---|-------|--------|--------|----------------|
| H-1 | Zero unit tests | Health Audit | No isolated logic testing for 40 service modules. All validation via E2E only. | Add Jest + unit tests for DealerBrain, Trigger, VIN services |
| H-2 | No linter or formatter | Health Audit | Code style depends entirely on AI author self-consistency. No enforcement. | Add ESLint + Prettier with pre-commit hooks |
| H-3 | 380 `any` type annotations | Health Audit | Undermines TypeScript strict mode (325 in server, 55 in client). | Gradual elimination campaign |
| H-4 | 242 unstructured console.log | Health Audit | No log levels, no rotation, no correlation IDs. | Replace with Pino or Winston |
| H-5 | No CI/CD pipeline | Health Audit | Manual deploys only. No automated testing on push. | Add GitHub Actions workflow |
| H-6 | `xlsx` vulnerability (no fix) | Health Audit | 2 high-severity CVEs (prototype pollution + ReDoS). | Replace with `exceljs` |
| H-7 | CLAUDE.md contains stale data | Docs Audit | 10+ outdated values (requirement count, phase count, doc status, test count, migration count, VIN header casing) will mislead future development sessions. | Update immediately |
| H-8 | Customer embed codes may reference retired V1 | Docs Audit | Production deployments doc references `nexxusdev.huminicdev.com` (V1). If V1 is retired, customer video embeds may be non-functional. | Verify and update |
| H-9 | No deploy rollback mechanism | Health Audit | Failed deploy requires manual intervention. | Add rollback to deploy.sh |
| H-10 | `password_reset_tokens` RLS open | Database Audit | Policy `FOR ALL USING (true)` effectively disables RLS on this table. | Add user-scoped policy |

### 6.3 MEDIUM (Quality/Maintainability Concern)

| # | Issue | Source | Impact |
|---|-------|--------|--------|
| M-1 | Missing migration 011 | Database Audit | Gap in numbering; may indicate dropped migration |
| M-2 | Duplicate migration 004 prefix | Database Audit | Two files share prefix; ordering ambiguity |
| M-3 | 16+ tables missing `updated_at` triggers | Database Audit | Inconsistency -- some tables auto-update timestamp, others rely on application code |
| M-4 | Missing FK declarations on textmagic_messages | Database Audit | `linked_lead_id` and `linked_appointment_id` used as logical FKs but not declared |
| M-5 | No JSONB schema validation at DB level | Database Audit | All 58 JSONB columns rely on application-layer validation |
| M-6 | DealerBrainService at 3,047 lines | Health Audit | Single largest file; maintenance complexity |
| M-7 | 18 stale feature branches | Health Audit | Git hygiene; confusion risk |
| M-8 | No git tags or releases | Health Audit | No version tracking |
| M-9 | No PM2 ecosystem config | Health Audit | Non-reproducible process configuration |
| M-10 | No `.env.example` template | Health Audit | New developers cannot determine required env vars |
| M-11 | 3,327 PM2 restarts in 31 days | Health Audit | ~107/day; all "stable" (deployment-triggered), but high churn |
| M-12 | Express 5 pre-release | Health Audit | Potential breaking changes on future updates |
| M-13 | Pool prefers direct URL over pgbouncer | Database Audit | Connection pooling at Node.js level only |
| M-14 | SMS inbound webhook no signature verification | Server Audit | TextMagic does not sign; public endpoint accepts any POST |
| M-15 | VAPI webhook secret optional | Server Audit | If env var not set or header absent, webhook accepted without verification |

### 6.4 LOW (Nice to Have)

| # | Issue | Source | Impact |
|---|-------|--------|--------|
| L-1 | Shared schema minimal (18 lines) | Health Audit | Minimal type sharing between client/server |
| L-2 | Replit plugins in vite config | Health Audit | Dead code for non-Replit environments |
| L-3 | Test coverage not measured | Health Audit | Cannot track regression |
| L-4 | DATA-5: contactUrl uses absolute URL | Docs Audit | Low priority code smell |
| L-5 | No health check in deploy script | Health Audit | Silent deploy failures possible |
| L-6 | `target` not set in tsconfig | Health Audit | Defaults to ES3 (irrelevant since noEmit) |
| L-7 | 9 mock data modules may be unused | Client Audit | Legacy from early development |
| L-8 | D-FLAG-001 pending 5+ days | Docs Audit | Trigger architecture decision unresolved |

---

## 7. Gaps Between Spec and Reality

### 7.1 Master SRS Acceptance Criteria Status

The Master SRS defines 19 formal acceptance criteria (AC-001 through AC-019). Their status:

| Status | Count | ACs |
|--------|-------|-----|
| CERTIFIED / DONE | 10 | AC-002, AC-004, AC-005, AC-006, AC-011, AC-013, AC-016, AC-017, AC-018 + AC-008/009/010 (infrastructure) |
| PARTIALLY ADDRESSED | 4 | AC-001, AC-003, AC-014, AC-015 |
| NOT DONE | 3 | AC-007 (Certified Metrics), AC-012 (SMS AI), AC-019 (Deployment Readiness) |
| IN PROGRESS | 2 | AC-015 (Feature Certification), AC-019 (Deployment Readiness) |

### 7.2 The 7 Open Feature Gaps

| Gap | Description | Planned Phase | Status |
|-----|-------------|--------------|--------|
| GAP-1 | Agent `performanceMetrics` never populated by webhooks | Phase 3 | OPEN |
| GAP-2 | Mark Contacted updates local DB only (no VIN write-back) | Phase 3 | OPEN |
| GAP-3 | No SMS AI routing (business hours / after-hours) | Phase 5 | OPEN |
| GAP-4 | No SMS collision avoidance (AI_ACTIVE / HUMAN_ACTIVE / DORMANT state machine) | Phase 5 | OPEN |
| GAP-5 | No Activity feed CSV export | Phase 7 | OPEN |
| GAP-6 | No unified MetricsEngine (metrics fragmented across 5 services) | Phase 4 | OPEN |
| GAP-7 | No VAPI Analytics API integration | Phase 3 | OPEN |

GAP-8 (field population audit) is DONE. GAP-9 (credits UI) is DEFERRED (intentional).

### 7.3 The 9 Externally-Blocked Items

These items cannot be resolved without VIN Solutions granting expanded API access:

| Priority | Blocked Capability | VIN Endpoints Returning 403 |
|----------|-------------------|-----------------------------|
| Critical | Communication history tracking | `/gateway/v1/communication` |
| Critical | Activity log analysis | `/gateway/v1/activity` |
| Critical | Deal economics and status | `/gateway/v1/deals` |
| High | Contact deduplication | `/gateway/v1/contacts` (search) |
| High | Appointment tracking | `/gateway/v1/appointments` |
| High | CRM notes access | `/gateway/v1/notes` |
| High | CRM task tracking | `/gateway/v1/tasks` |
| High | CRM call/email logs | `/gateway/v1/calls`, `/gateway/v1/calldetails`, `/gateway/v1/emails` |
| Medium | Inventory access | `/gateway/v1/inventory`, `/gateway/v1/vehicles` |

**Impact:** The platform can see the beginning (lead creation) and end (SOLD/LOST status) of the sales cycle but not the middle (human execution quality). This is a fundamental data architecture constraint imposed by the VIN Solutions API.

Additionally excluded from all phases:
- Credits page UI (business decision deferral)
- AI Governance Stages 2 and 3 (future phases)

### 7.4 Document Inconsistencies

| # | Area | CLAUDE.md Says | Reality |
|---|------|----------------|---------|
| 1 | Requirement count | "17 sections, 257 requirements" | 19 ACs + 50+ derivable metrics (v2.0 restructured away from numbered requirements) |
| 2 | Phase count | "10 phases, priority-ordered" | 8 phases (v2.0 was rewritten) |
| 3 | Assessment stats | "200 implemented, 38 partial, 10 gaps" | 16 certified, 8 needs work (v2.0 uses feature-level assessment) |
| 4 | Governing doc status | "PENDING CREATION" for all 4 docs | All 4 exist (v2.0, dated 2026-02-18) |
| 5 | Test count | "500+ tests" | 747 E2E tests (grew significantly) |
| 6 | Migration count | "23 files" | 33 files (10 added post-MVP) |
| 7 | Table count | "36 tables" | 53 tables (significant growth) |
| 8 | Production URL | `nexxusv2.huminicdev.com` | Production deployments doc references `nexxusdev.huminicdev.com` |
| 9 | VIN header casing | Uppercase "V3" in API reference | Lowercase "v3" required (production API rejects uppercase) |
| 10 | AC-3 status | "Implemented, needs verification" | Customer onboarding doc says "Bug -- No" for demo readiness |

These inconsistencies exist because CLAUDE.md references v1.0 governing document statistics while the documents themselves have been updated to v2.0.

---

## 8. Deployment and Operations

### 8.1 Infrastructure

| Component | Status |
|-----------|--------|
| Server | Oracle Cloud, Linux 5.15.0-1081-oracle |
| Node.js | v20.19.5 |
| PM2 | 6.0.13 (process manager) |
| Reverse Proxy | Caddy (managed by sysadmin project) |
| SSL | Managed by Caddy/sysadmin |
| Database | Supabase PostgreSQL (aws-0-us-west-2) |
| Docker | Not used |
| CI/CD | Not configured |
| Monitoring | None specific to this project |

### 8.2 Build Pipeline

The build is orchestrated by `script/build.ts`:

```
Step 1: rm -rf dist/
Step 2: Vite build (client)     -> dist/public/         (React SPA)
Step 3: Vite build (widget)     -> dist/public/widget/   (Preact embeddable widget)
Step 4: esbuild (tracking)      -> dist/public/widget/nexxus-pixel.js (IIFE, minified)
Step 5: esbuild (server)        -> dist/index.cjs        (CJS, minified)
```

**Four build outputs:** Client SPA, embeddable widget (Preact for smaller bundle), tracking pixel (IIFE), server (CJS with selective bundling).

### 8.3 Deployment Process

```bash
./deploy.sh
```

The deploy script:
1. Checks that current branch is `master` (refuses feature branches)
2. Warns about uncommitted changes (y/N prompt)
3. Runs `npm run build`
4. Runs `pm2 restart nexxus-v2`
5. Shows `pm2 status` output

**Missing from deploy process:**
- No pre-deploy tests (E2E or smoke)
- No health check after restart
- No rollback mechanism
- No notification on deploy

### 8.4 PM2 Process Status

| Metric | Value |
|--------|-------|
| Process name | `nexxus-v2` |
| PM2 ID | 13 |
| Status | Online |
| PID | 1616575 |
| Memory | 148.9 MB |
| CPU | 0.2% |
| Uptime | 2 days (as of audit) |
| Total restarts | 3,327 |
| Unstable restarts | 0 |
| Ecosystem config | NOT PRESENT |

**Note:** 3,327 restarts in 31 days (~107/day) is high. All are classified as "stable" (deployment-triggered, not crash-related). No `ecosystem.config.cjs` exists, meaning the PM2 configuration is not version-controlled or reproducible.

### 8.5 Environment Configuration

- **33 environment variables** in `.env`
- `.env` is properly git-ignored
- No `.env.example` or `.env.template` exists
- No documentation of required vs optional variables

### 8.6 Disk Usage

| Directory | Size |
|-----------|------|
| Source code + docs + assets | 34 MB |
| `node_modules/` | 575 MB |
| `dist/` (build output) | 12 MB |
| **Total project** | **656 MB** |

### 8.7 NPM Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `build` | `tsx script/build.ts` | Full production build (client + widget + pixel + server) |
| `build:widget` | `cd widget && npx vite build` | Widget-only build |
| `check` | `tsc` | TypeScript type checking (no emit) |
| `db:push` | `drizzle-kit push` | Apply DB schema changes |
| `dev` | `NODE_ENV=development tsx server/index.ts` | Development server |
| `start` | `NODE_ENV=production node dist/index.cjs` | Production server |
| `test:accuracy` | `npx tsx tests/data-accuracy.ts` | Data accuracy verification |
| `test:env` | `npx tsx tests/env-check.ts` | Environment variable check |
| `test:quality` | `check && build && test:env && test:accuracy` | Full quality gate |
| `test:smoke` | `npx tsx tests/dealerbrain-smoke.ts` | DealerBrain smoke test |

**Missing scripts:** No `lint`, `format`, `test` (Playwright), or `test:unit` scripts defined in package.json. Playwright tests are run manually via `npx playwright test`.

### 8.8 Project Directory Structure

```
nexxus-v2/
  client/                  # React SPA (Vite)
    src/
      components/          # 105 components (59 custom + 47 shadcn/ui)
        admin/             # User/org dialogs
        auth/              # ProtectedRoute
        calendar/          # FullCalendar integration
        chat/              # Chat panel, streaming, charts
        communication/     # Email inbox/compose
        inbox/             # Messaging panel
        insights/          # Dashboard cards
        layout/            # AppLayout, TopBar, Sidebar, SubMenu
        modals/            # Transcript, lead detail, table modals
        notifications/     # Bell, settings
        onboarding/        # Product tour
        reports/           # Report catalog, viewer, charts
        settings/          # Tab components (8)
        sms/               # SMS compose dialog
        ui/                # shadcn/ui primitives (47)
      contexts/            # 4 context providers
      hooks/               # 26 custom hooks
      lib/                 # API client, query config, utilities
      mocks/               # 9 mock data modules
      pages/               # 17 pages + 4 hosted
  server/                  # Express.js API
    auth/                  # JWT + middleware
    db/                    # SecureQueryBuilder
    jobs/                  # 8 scheduled jobs
    middleware/            # Org context, resource ownership
    routes/                # 34 route files
    services/              # 36 service files
      contextRouter/       # Context Router (4 files)
      notifications/       # Email notifications
      sync/                # VIN sync coordinator
    utils/                 # Encryption, env validation
    webhooks/              # VAPI, Tavus handlers
  database/
    migrations/            # 33 SQL migration files
    seed.sql               # Development seed data
  tests/
    e2e/                   # 46 Playwright spec files
    scripts/               # 7 diagnostic scripts
    verification/          # 11 verification scripts
  widget/                  # Preact embeddable widget
  docs/                    # Documentation (40+ files)
    audit/                 # Forensic audit reports (5)
    evidence/              # Certification evidence
    reference/             # Production deployment docs
    archive/               # Pre-stabilization archives
  dist/                    # Build output (not in git)
  uploads/                 # User uploads (not in git)
  .env                     # Environment config (not in git)
  deploy.sh                # Deploy script (master branch guard)
  playwright.config.ts     # E2E test configuration
  package.json             # Dependencies and scripts
  tsconfig.json            # TypeScript configuration
  vite.config.ts           # Vite build configuration
```

### 8.9 Live URL

**Application:** https://nexxusv2.huminicdev.com
**Health check:** GET /api/health

Customer-facing widget endpoints:
- POST /api/widgets/public/session
- POST /api/widgets/public/chat (+ /chat/stream for SSE)
- POST /api/widgets/public/callback
- POST /api/widgets/public/video/start
- POST /api/widgets/public/audio/token
- GET /api/pages/:slug (hosted pages)

---

## 9. Risk Assessment

### 9.1 Technical Risks

| # | Risk | Severity | Likelihood | Impact |
|---|------|----------|-----------|--------|
| T-1 | RLS variable mismatch could allow cross-tenant data access if SecureQueryBuilder path is ever used exclusively | Critical | Low (currently bypassed) | Data breach between organizations |
| T-2 | SET LOCAL leak could expose RLS context from one request to another on pooled connections | High | Medium | Stale org context on subsequent queries |
| T-3 | Zero unit tests means service logic changes have no isolated safety net | High | High | Regressions in critical services (VIN sync, triggers, credits) |
| T-4 | `xlsx` vulnerabilities (no fix available) allow prototype pollution via crafted Excel files | High | Low | Server compromise via knowledge upload |
| T-5 | Express 5 pre-release may have breaking changes in future minor versions | Medium | Medium | Build failures or runtime errors on update |
| T-6 | 380 `any` types undermine strict TypeScript -- type errors can reach runtime | Medium | Medium | Runtime type errors in production |
| T-7 | No structured logging makes production debugging and incident response difficult | Medium | High | Slow incident response |

### 9.2 Business Risks

| # | Risk | Severity | Likelihood | Impact |
|---|------|----------|-----------|--------|
| B-1 | AC-1 (outbound calls) has never fired in production -- all 15 triggers deactivated | High | Certain | Core value proposition undemonstrated |
| B-2 | AC-3 (lead insertion to VIN) has conflicting status reports | High | Medium | Customer CRM data may not receive AI-generated leads |
| B-3 | AC-4 (accurate metrics) depends on unbuilt MetricsEngine | High | Certain | Dashboard numbers may be unreliable for customer decisions |
| B-4 | Customer embed codes may reference retired V1 infrastructure | High | Medium | Customer-facing video agents may be non-functional |
| B-5 | Metrics fragmented across 5 services -- no single source of truth for business KPIs | Medium | High | Inconsistent numbers across different views |

### 9.3 Security Risks

| # | Risk | Severity | Likelihood | Impact |
|---|------|----------|-----------|--------|
| S-1 | TextMagic inbound webhook has no signature verification | Medium | Low | Spoofed SMS events could create false inbox messages |
| S-2 | VAPI webhook secret is optional -- webhook accepted without verification if header absent | Medium | Low | Spoofed call events could create false data |
| S-3 | Tavus API key appears in plain text in documentation | Medium | Low | Key exposure if repository is shared |
| S-4 | Origin validation disabled on Tavus conversation start endpoint | Low | Low | Any domain can start video sessions (mitigated by rate limiting) |
| S-5 | `password_reset_tokens` table has open RLS policy (`FOR ALL USING (true)`) | Low | Low | Tokens are random and time-limited; risk is theoretical |

### 9.4 Operational Risks

| # | Risk | Severity | Likelihood | Impact |
|---|------|----------|-----------|--------|
| O-1 | No CI/CD -- all deploys are manual | Medium | Certain | Human error in deploy process |
| O-2 | No deploy rollback mechanism | High | Medium | Extended outage if bad deploy occurs |
| O-3 | No monitoring or alerting | Medium | High | Issues discovered by users, not by team |
| O-4 | 33 env vars with no documentation template | Medium | Medium | New team member cannot set up environment |
| O-5 | No PM2 ecosystem config -- process configuration not reproducible | Medium | Medium | Server rebuild requires manual PM2 setup |
| O-6 | Single database pool (max 10 connections) with no pgbouncer | Medium | Low | Connection exhaustion under load |

### 9.5 User-Identified Issues vs Current State

The user identified 9 issues in the Brain Dump document (Section I). Here is their current status based on forensic evidence:

| # | User's Issue | Current Status | Resolved? |
|---|-------------|----------------|-----------|
| 1 | Metrics inaccurate -- numbers too high, wrong categories | Context Router enabled, excel_upload excluded, source labels removed. But: metrics still fragmented across 5 services, no unified MetricsEngine. | Partially |
| 2 | VIN Solutions data strategy not working correctly | Context Router uses VIN API as primary, local DB as fallback. 13 endpoints accessible, 17 blocked. Cache TTL implemented. | Mostly (blocked endpoints are external constraint) |
| 3 | No outbound communication functional | TriggerService built with 5 action types. SMS two-way works. But: all 15 trigger rules deactivated, no outbound calls have ever fired. | Partially (infrastructure exists, not activated) |
| 4 | Voice/video calls not auto-entered into VIN Solutions | Webhook pipeline certified. sync_queue + SyncCoordinator + LeadCreationService operational. But: conflicting status reports (CLAUDE.md says "needs verification", onboarding doc says "Bug -- No"). | Uncertain (needs runtime verification) |
| 5 | Widget tech for Tavus may not be finished | Master Widget + Hosted Pages fully certified. 4 page types including video. 5 Tavus personas deployed. | Resolved |
| 6 | MCP proxy not integrated | No MCP integration found in V2 codebase. VAPI/Tavus use webhooks and direct API, not MCP. | Not addressed (may be deprioritized) |
| 7 | Multi-org query UX for Org Admins unresolved | Partner Admins can switch orgs. Org Admins are scoped to single org via RLS. No multi-org query UI built. | Not addressed |
| 8 | Response mechanisms for SMS and email not built | SMS inbound webhook wired to inbox. Email send/receive via IMAP/SMTP. AI auto-reply schema exists but logic not implemented. | Partially (manual works, AI auto-reply missing) |
| 9 | Data from multiple sources not properly tagged/organized | Context Router tags data by source. Source badges on leads (VIN, VAPI, Tavus, SMS, Email, Widget, Manual). excel_upload excluded. | Mostly resolved |

**Summary:** Of 9 user-identified issues, 2 are fully resolved, 5 are partially addressed, and 2 are not addressed. The most impactful unresolved items are metric accuracy (requires MetricsEngine, Phase 4) and outbound communication (requires trigger activation and AC-1 verification).

---

## 10. Recommendations and Next Steps

### 10.1 What Should Be Fixed FIRST (Critical Path)

These items represent the highest-impact, lowest-effort fixes:

**1. Fix the RLS variable name mismatch (C-1)**
- Change `SecureQueryBuilder.ts` line 244 from `app.current_organization_id` to `app.current_org_id`
- Fix `server/routes/triggers.ts` line 38 from `app.current_role_level` to `app.user_role_level`
- Add SET LOCAL within a proper transaction block (BEGIN/COMMIT)
- Estimated effort: < 1 hour
- Impact: Eliminates the most significant architectural defect

**2. Update CLAUDE.md (H-7)**
- Correct all 10+ stale values identified in Section 7.4
- This is the primary file read by every new Claude Code session
- Stale values actively mislead future development
- Estimated effort: 30 minutes

**3. Verify customer embed codes (H-8)**
- Determine whether `nexxusdev.huminicdev.com` still resolves to active infrastructure
- If V1 is retired, update customer embed codes to V2 endpoints
- Estimated effort: 1-2 hours (investigation + potential customer communication)

**4. Resolve D-FLAG-001 (L-8)**
- Make a decision on trigger consolidation (even "defer to post-stabilization" unblocks work)
- Activate at least one trigger rule to demonstrate AC-1
- Estimated effort: 30 minutes (decision) + 1-2 hours (activation)

### 10.2 Implementation Plan vs Evidence

The Implementation Plan defines 8 phases. Based on forensic evidence:

| Phase | Plan Says | Evidence Shows |
|-------|-----------|----------------|
| Phase 1 (Critical Fixes) | String replacements, small changes | CERTIFIED -- certification-results.md shows all 6 steps passed |
| Phase 2 (Data Integrity) | VIN header verification, field audit | PARTIALLY DONE -- field-population-audit.json exists; runtime header verification unclear |
| Phase 3 (Wiring Gaps) | Connect disconnected code | NOT STARTED -- GAP-1, GAP-2, GAP-7 remain open |
| Phase 4 (Metrics Consolidation) | Unified MetricsEngine | NOT STARTED -- GAP-6 remains open |
| Phase 5 (SMS Enhancement) | AI routing + collision avoidance | NOT STARTED -- GAP-3, GAP-4 remain open |
| Phase 6 (Combined Metrics) | Cross-platform insights, role dashboards | NOT STARTED -- depends on Phase 4 |
| Phase 7 (Certification) | Full E2E, CSV export, 3-proof | NOT STARTED -- depends on Phases 1-6 |
| Phase 8 (Deployment) | Merge, deploy, verify | NOT STARTED -- depends on Phase 7 |

**Critical path:** Phase 2 -> Phase 3 -> Phase 4 -> Phase 6 -> Phase 7 -> Phase 8

### 10.3 Suggested Prioritization for a New Team

**Week 1: Foundation**
1. Fix RLS variable name mismatch (C-1, C-2, C-3, C-4)
2. Update CLAUDE.md with correct metrics
3. Verify customer embed codes and V1/V2 transition status
4. Resolve D-FLAG-001 and activate at least one trigger rule
5. Add ESLint + Prettier configuration
6. Create `.env.example` template
7. Create PM2 `ecosystem.config.cjs`

**Week 2: Testing Infrastructure**
1. Add Jest configuration and write unit tests for top 3 services (VinSolutionsService, TriggerService, CreditService)
2. Run full E2E suite and capture pass/fail evidence
3. Replace `xlsx` with `exceljs` (vulnerability remediation)
4. Add basic GitHub Actions CI (type check + build + E2E)

**Week 3-4: Implementation Plan Execution**
1. Complete Phase 2 (runtime VIN header verification)
2. Execute Phase 3 (wire performanceMetrics, Mark Contacted VIN write-back, VAPI Analytics)
3. Begin Phase 4 (MetricsEngine consolidation)

**Week 5-6: Stabilization**
1. Complete Phase 4 and Phase 5 (SMS enhancement)
2. Phase 6 (combined metrics and role dashboards)
3. Phase 7 (full certification round)

**Week 7: Deployment**
1. Phase 8 (merge, deploy, verify)
2. Add structured logging (replace 242 console.log statements)
3. Add monitoring and alerting
4. Document deployment runbook

---

## 11. Appendix: Metrics Dashboard

### 11.1 Lines of Code by Layer

```
SERVER                           47,479 lines  (40.3%)
  routes/                        ~15,000
  services/                      ~25,000
  webhooks/jobs/middleware/        ~7,500

CLIENT TSX                       35,991 lines  (30.6%)
  pages/                          ~8,000
  components/                    ~22,000
  other (App, contexts, hosted)   ~6,000

CLIENT TS                         7,557 lines   (6.4%)
  hooks/                          ~4,500
  lib/                            ~1,000
  mocks/                          ~2,000

TESTS                            18,869 lines  (16.0%)
  e2e specs/                     ~15,000
  verification scripts/           ~3,900

DATABASE SQL                      4,045 lines   (3.4%)
  migrations (33 files)           4,045

SHARED                               18 lines   (0.0%)

OTHER (configs, scripts, widget)  ~3,734 lines   (3.2%)

TOTAL                           117,693 lines
```

### 11.2 File Counts by Type

| Extension | Count |
|-----------|-------|
| `.ts` (TypeScript) | 262 |
| `.tsx` (React TSX) | 140 |
| `.sql` (Migrations) | 33 |
| `.css` | 2 |
| `.json` (config) | ~10 |
| `.md` (documentation) | ~40 |
| **Total source** | **~435** |

### 11.3 Endpoint Counts by Auth Level

| Auth Level | Endpoints |
|------------|-----------|
| Public (no authentication) | ~15 |
| Any authenticated user | ~110 |
| Org Admin or higher (level <= 3) | ~40 |
| Super Admin only (level = 1) | ~20 |
| Mixed (multiple levels per route file) | ~52 |
| **Total** | **~237** |

### 11.4 Test Counts by Category

| Category | Spec Files | Test Cases |
|----------|-----------|------------|
| Core Platform | 8 | 156 |
| Feature Tests | 8 | 135 |
| Sprint Features | 11 | 199 |
| Quality/Verification | 6 | 124 |
| Stabilization | 6 | 28 |
| Regression | 7 | 105 |
| **E2E Total** | **46** | **747** |
| Unit Tests | 0 | 0 |
| Integration Tests | 0 | 0 |
| Component Tests | 0 | 0 |

### 11.5 Dependency Counts

| Category | Count |
|----------|-------|
| Production dependencies | 91 |
| Dev dependencies | 31 |
| Radix UI packages | 25 |
| FullCalendar packages | 4 |
| Tiptap packages | 3 |
| Known vulnerabilities | 7 (0 critical, 4 high, 2 moderate, 1 low) |

### 11.6 Database Metrics

| Metric | Count |
|--------|-------|
| Tables | 53 |
| Migrations | 33 |
| RLS policies | ~100 |
| Foreign keys | ~80 |
| Indexes | ~160 |
| JSONB columns | 58 |
| CHECK constraints | 50+ |
| UNIQUE constraints | 22+ |
| Triggers | 12+ |
| Functions | 2 |

### 11.7 Git Activity Metrics

| Metric | Value |
|--------|-------|
| Total commits | 181 |
| Project age | 31 days |
| Average commits/day | 5.8 |
| Contributors | 1 (Claude Code -- 100% AI-authored) |
| Local branches | 19 (18 stale feature + 1 master) |
| Remote branches | 1 (origin/main) |
| Git tags | 0 |
| Fix commits | 57 (31.5%) |
| Feature commits | 30 (16.6%) |
| Average files changed per commit | 8 |
| Average insertions per commit | +1,128 |

### 11.8 Server Component Counts

| Component | Count |
|-----------|-------|
| Route files | 34 |
| Service files | 40 (36 + 4 sub-services) |
| Middleware modules | 3 |
| Webhook handlers | 2 + 1 utility |
| Scheduled jobs | 8 |
| Auth modules | 2 |
| Database modules | 2 |
| Utility modules | 2 |
| **Total server files** | **~96** |

### 11.9 Client Component Counts

| Component | Count |
|-----------|-------|
| Pages | 21 |
| shadcn/ui primitives | 47 |
| Custom components | 58 |
| Custom hooks | 26 |
| Context providers | 4 |
| Library utilities | 3 |
| Mock data modules | 9 |
| **Total client files** | **~172** |

### 11.10 Feature Phase Completion

| Phase | Status | Completion |
|-------|--------|------------|
| MVP (Phases 1-5) | Complete | 100% |
| Phase 6: Credit Wiring | Complete | 100% |
| Phase 7: Notifications | Complete | 100% |
| Phase 8: TextMagic SMS | Complete | 100% |
| Phase 9: Bug Fixes | Complete | 100% |
| Phase 10: Master Widget | Complete | 100% |
| Phase 11: Hosted Pages | Complete | 100% |
| Phase 12: Staff Inbox | Complete | 100% |
| Phase 13: Tracking Pixel | Complete | 100% |
| Phase 14: Agent Triggers | Complete | 100% |
| Phase 15: AI Governance | Complete | 100% |
| Phase 16: Goals | Complete | 100% |
| Phase 17: Google Calendar | Complete | 100% |
| Phase 18: Drive | Complete | 100% |
| Phase 19: Hunches/Approvals | Complete | 100% |
| Phase 20: Leads/Demo | Complete | 100% |
| Stabilization Plan Phase 1 | Certified | 100% |
| Stabilization Plan Phase 2 | Partial | ~60% |
| Stabilization Plan Phases 3-8 | Not Started | 0% |

---

### 11.11 Largest Files (Complexity Hotspots)

| File | Lines | Area |
|------|-------|------|
| `server/services/DealerBrainService.ts` | 3,047 | AI service + 24 tools |
| `server/services/DealerBrainStreamingService.ts` | 2,020 | SSE streaming AI |
| `client/src/components/settings/WidgetSettingsTab.tsx` | 1,867 | Widget config UI |
| `client/src/pages/settings.tsx` | 1,611 | Settings page (16+ tabs) |
| `server/routes/admin.ts` | 1,454 | Admin API (14 endpoints) |
| `server/services/TriggerService.ts` | 1,413 | Event-driven automation |
| `server/services/AppointmentService.ts` | 1,248 | Calendar appointments |
| `client/src/components/settings/TriggersSettingsTab.tsx` | 1,235 | Trigger config UI |
| `server/services/vinSolutionsService.ts` | 1,134 | VIN Solutions API client |
| `server/services/TextMagicService.ts` | 1,130 | SMS service |

Files over 1,000 lines represent refactoring candidates. `DealerBrainService.ts` at 3,047 lines is the single most complex module.

### 11.12 Environment Variables Required (33 total)

The following environment variable categories are configured in `.env` (no `.env.example` exists):

| Category | Variables | Count |
|----------|-----------|-------|
| Database | DATABASE_URL, DIRECT_URL | 2 |
| Authentication | JWT_SECRET, SESSION_SECRET | 2 |
| VIN Solutions | VIN_CLIENT_ID, VIN_CLIENT_SECRET, VIN_TOKEN_URL, VIN_API_BASE_URL | 4 |
| VAPI | VAPI_API_KEY, VAPI_WEBHOOK_SECRET, VAPI_PUBLIC_KEY | 3 |
| Tavus | TAVUS_API_KEY, TAVUS_WEBHOOK_SECRET | 2 |
| Resend | RESEND_API_KEY | 1 |
| TextMagic | (per-org in DB, not env) | 0 |
| Claude AI | ANTHROPIC_API_KEY | 1 |
| Google Calendar | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI | 3 |
| Application | PORT, NODE_ENV, BASE_URL | 3 |
| Other | Various feature flags and config | ~12 |

### 11.13 JSONB Column Distribution

| Table Group | JSONB Columns | Notable Schemas |
|-------------|---------------|-----------------|
| Organizations & Locations | 6 | settings, billing_info, address, business_hours, contact_info |
| Integrations | 4 | config (dealer info), credentials (encrypted tokens) |
| Agents & Conversations | 6 | config (persona IDs), customer_info, performance_metrics |
| Widget System | 7 | config_appearance, config_channels, config_targeting, allowed_domains, chat_enabled_tools |
| Communication | 12 | to/cc/bcc_addresses, attachments, template_variables |
| Leads & Sync | 6 | metadata, end_of_call_report, payload, result |
| Other | 17 | Various metadata, data, and config columns |
| **Total** | **58** | No DB-level schema validation on any |

### 11.14 Customer-Facing Feature Summary

For a non-technical reader, here is what each user role can do today:

**Super Admin (Platform Operator - Huminic):**
- Manage all organizations, users, and partner assignments
- Configure DealerBrain AI system instructions and feedback settings
- View system-wide AI governance (activity feed, token usage, CSV export)
- Configure SMS settings per organization
- Access all features available to lower roles

**Partner Admin (e.g., Duran Cage):**
- Switch between assigned organizations
- View dashboards and metrics for all assigned orgs
- Manage users and settings within assigned orgs
- Access all features available to lower roles

**Org Admin (e.g., Sales Manager):**
- View dashboard with health scores, lead feed, goals, team leaderboard
- Chat with DealerBrain AI assistant (24 tools available)
- Configure widgets, hosted pages, triggers, email, knowledge base
- Manage leads, appointments, tasks, approvals
- View insights: voice calls, video sessions, attribution, reports
- Manage file storage (Drive)

**Org Staff (e.g., Salesperson):**
- View role-filtered dashboard (my leads, my tasks, my performance)
- Chat with DealerBrain AI assistant
- View and interact with agents
- Manage personal tasks, appointments, leads
- Access Drive for file storage
- View insights relevant to their work

### 11.15 Technology Stack Complete Reference

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | | |
| Build tool | Vite | ^7.3.0 |
| UI framework | React | ^18.3.1 |
| Language | TypeScript | 5.6.3 |
| Routing | Wouter | ^3.3.5 |
| Server state | TanStack Query | ^5.60.5 |
| UI components | shadcn/ui (25 Radix packages) | Various |
| Styling | Tailwind CSS | ^3.4.17 |
| Icons | lucide-react | Latest |
| Calendar | FullCalendar | Latest |
| Rich text editor | Tiptap | Latest |
| Charts | Recharts | Latest |
| Onboarding | driver.js | Latest |
| **Backend** | | |
| Runtime | Node.js | v20.19.5 |
| Framework | Express | ^5.0.1 (pre-release) |
| Language | TypeScript | 5.6.3 |
| Database client | pg | ^8.16.3 |
| ORM | Drizzle ORM | ^0.39.3 |
| Validation | Zod | ^3.24.2 |
| Auth | jsonwebtoken + bcrypt | ^9.0.3, ^6.0.0 |
| Security | Helmet | ^8.1.0 |
| Rate limiting | express-rate-limit | ^8.2.1 |
| File upload | Multer | ^2.0.2 |
| PDF generation | Puppeteer | ^24.37.2 |
| PDF parsing | pdf-parse | ^1.1.1 |
| Excel parsing | xlsx | ^0.18.5 (VULNERABLE) |
| Email (IMAP) | imapflow | ^1.2.8 |
| Email (SMTP) | Nodemailer | ^7.0.13 |
| **Integrations** | | |
| AI | @anthropic-ai/sdk | ^0.72.1 |
| Voice AI | @vapi-ai/server-sdk | ^0.11.0 |
| Email delivery | Resend | ^6.9.1 |
| WebSocket | socket.io | ^4.8.3 |
| **Database** | | |
| Provider | Supabase (PostgreSQL) | Hosted |
| Migrations | Drizzle Kit | ^0.31.8 |
| **Widget** | | |
| Framework | Preact | ^10.28.3 |
| Build | Vite (separate config) | ^7.3.0 |
| **Testing** | | |
| E2E | Playwright | ^1.58.1 |
| Unit | (none configured) | -- |
| **DevOps** | | |
| Process manager | PM2 | 6.0.13 |
| Build bundler | esbuild | ^0.25.0 |
| TS runner | tsx | ^4.20.5 |

### 11.16 Governing Document Relationships

Four governing documents define the project's intent, specification, current state, and forward plan. They form a hierarchy:

```
Brain Dump (User Intent)
    |
    v
Constitution (Identity + Principles + Rules)
    |
    v
Master SRS v2.0 (What Should Exist -- 19 ACs, 50+ metrics, 17 sections)
    |
    +-----> Current-State Assessment v2.0 (What Does Exist -- 16 certified, 8 needs work)
    |
    +-----> Implementation Plan v2.0 (How to Close the Gap -- 8 phases)
```

**Key dates:**
- Brain Dump: 2026-02-16 (user's narrative, formalized)
- All 4 governing documents: 2026-02-18 (v2.0, 3 days before audit)
- CLAUDE.md: 2026-02-16 (project config, references v1.0 stats -- STALE)

**Document that needs most urgent attention:** CLAUDE.md -- it is the first file read by every Claude Code session and contains 10+ stale references to v1.0 governing document statistics. This actively misleads any automated development work.

### 11.17 Glossary of Key Terms

| Term | Definition |
|------|-----------|
| **Automa** | The master AI agent that exists in every account. Always at the top of the agents list. Cannot be deleted or duplicated. |
| **Context Router** | Data orchestration layer that queries VIN API first, falls back to local DB, tags data by source, and manages cache TTL. |
| **DealerBrain** | The AI chat system powered by Claude API with 24 tools for querying and managing dealership data. |
| **Dealer Pulse** | 5-phase health snapshot generated every 4 hours, cached in dealer_pulse_cache table, with AI commentary. |
| **Hunch** | An AI-generated insight or suggestion for the dealership (e.g., "Lead X has been idle for 3 days"). |
| **Hub** | The internal name for the Work Center page (calendar, tasks, approvals, communication, leads). |
| **Hosted Page** | A standalone public page at `/w/:slug` that embeds a widget for chat, video, callback, or multi-channel interaction. |
| **Master Widget** | The centralized widget configuration system that generates embeddable JavaScript for customer websites. |
| **MetricsEngine** | Planned but not yet built. Intended to consolidate metrics computation from 5 separate services into a single certified registry. |
| **Nexxus-originated** | A lead that was created through the Nexxus platform (voice call, video session, widget chat) rather than imported from VIN Solutions. |
| **Partner Admin** | A user role (level 2) representing a domain expert who manages multiple customer organizations. |
| **RLS** | Row-Level Security -- PostgreSQL feature that enforces data isolation at the database level using session variables. |
| **SecureQueryBuilder** | The TypeScript class intended to enforce RLS on every query. Has a variable name mismatch bug (see C-1). |
| **Skills** | The user-facing name for agent capabilities (internally called "tools" in the API). |
| **Sync Queue** | The `sync_queue` table that stores pending data synchronization jobs between Nexxus and external systems. |
| **Trigger** | An automation rule that fires actions (outbound call, SMS, task, notification) when specified events and conditions are met. |

---

## Document Metadata

| Field | Value |
|-------|-------|
| Document Title | Nexxus V2 Reverse SRS (As-Built Specification) |
| Document Type | Forensic audit compilation |
| Created | 2026-02-21 |
| Author | Claude Opus 4.6 (forensic code audit) |
| Source Audits | database-audit.md, server-audit.md, client-audit.md, health-audit.md, docs-audit.md |
| Lines in this document | ~1,900 |
| Methodology | Static code analysis of all source files, migration files, and documentation. No code was executed. No tests were run. All claims are supported by file paths and line numbers from the source audits. |

---

*This document was compiled from 5 specialist forensic audit reports totaling approximately 6,000 lines of analysis covering: 33 migration files, 96 server files, 172 client files, 46 E2E test files, 33 environment variables, 122 npm dependencies, 181 git commits, and 11 governing/reference documents. Every claim traces back to a specific file, line number, or measurable artifact in the codebase.*
