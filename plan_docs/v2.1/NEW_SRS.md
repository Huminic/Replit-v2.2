# Nexxus Connect™ — Software Requirements Specification v2.1

**Version:** 2.1
**Date:** 2026-02-21
**Status:** GOVERNING DOCUMENT — Complete system requirements
**Cross-References:** [NEW_CONSTITUTION.md](./NEW_CONSTITUTION.md) · [NEW_IMPLEMENTATION_PLAN.md](./NEW_IMPLEMENTATION_PLAN.md) · [NEW_CLAUDE.md](./NEW_CLAUDE.md) · [ACCEPTANCE_CRITERIA.md](../ACCEPTANCE_CRITERIA.md)

---

## 1. System Overview

### 1.1 Purpose

Nexxus Connect™ is a ClickUp-inspired AI-powered dealership management platform. This SRS defines the complete functional and non-functional requirements for transitioning the validated UI prototype into a production system with real backend services, database, authentication, and API integrations.

### 1.2 Scope

- Full-stack web application (React frontend + Express backend + PostgreSQL database)
- Multi-tenant SaaS with 4 RBAC roles
- AI chat with streaming responses (Automa / DealerBrain)
- VIN Solutions CRM integration for lead data
- VAPI voice integration + Tavus video integration
- Real-time dashboards with computed metric scores
- Agent management system with triggers, tools, and knowledge bases

### 1.3 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React/Vite)                      │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ AppLayout│ │  Pages    │ │ Contexts │ │ TanStack Query   │  │
│  │ TopBar   │ │ Main      │ │ Theme    │ │ queryClient      │  │
│  │ Sidebar  │ │ Insights  │ │ App      │ │ apiRequest()     │  │
│  │ SubMenu  │ │ Agents    │ │ Auth     │ │ cache invalidate │  │
│  │ RightPane│ │ Hub       │ └──────────┘ └──────────────────┘  │
│  └──────────┘ │ Drive     │                                     │
│               │ Settings  │                                     │
│               │ Profile   │                                     │
│               └───────────┘                                     │
├─────────────────────────────────────────────────────────────────┤
│                     EXPRESS SERVER (API)                         │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Auth     │ │ Routes    │ │ Storage  │ │ Services         │  │
│  │ Middleware│ │ /api/*    │ │ Interface│ │ MetricEngine     │  │
│  │ Session  │ │ /auth/*   │ │ IStorage │ │ HunchEngine      │  │
│  │ RBAC     │ │ /webhook/*│ │ PgStore  │ │ VINSyncService   │  │
│  └──────────┘ └───────────┘ └──────────┘ │ AgentService     │  │
│                                           │ NotificationSvc  │  │
│                                           └──────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    POSTGRESQL (Neon-backed)                      │
│  ┌──────────────┐ ┌───────────────┐ ┌──────────────────────┐   │
│  │ users/orgs   │ │ leads/agents  │ │ metrics/hunches      │   │
│  │ sessions     │ │ files/tasks   │ │ notifications/activity│   │
│  │ RLS policies │ │ widgets       │ │ audit_log            │   │
│  └──────────────┘ └───────────────┘ └──────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                    EXTERNAL INTEGRATIONS                         │
│  VIN Solutions (CRM) · VAPI (Voice) · Tavus (Video)            │
│  TextMagic (SMS) · Claude API (AI) · Stripe (Billing)          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Functional Requirements

### 2.1 Authentication & Session Management

| ID | Requirement | Priority |
|----|-------------|----------|
| AUTH-01 | Session-based authentication using express-session with connect-pg-simple | P0 |
| AUTH-02 | Login page with email/password form | P0 |
| AUTH-03 | Session cookie with secure, httpOnly, sameSite flags | P0 |
| AUTH-04 | Session expiry: 24 hours idle, 7 days absolute max | P1 |
| AUTH-05 | Password hashing with bcrypt (12 rounds) | P0 |
| AUTH-06 | RBAC middleware validates role on every API route | P0 |
| AUTH-07 | Logout endpoint destroys session and clears cookie | P0 |
| AUTH-08 | Protected routes redirect unauthenticated users to /login | P0 |
| AUTH-09 | Organization context set from user's org membership on login | P0 |
| AUTH-10 | Multi-org users can switch orgs via TopBar org switcher | P1 |

### 2.2 User & Organization Management

| ID | Requirement | Priority |
|----|-------------|----------|
| USER-01 | Users table: id, name, email, passwordHash, role, organizationId, avatarUrl, phone, createdAt | P0 |
| USER-02 | Organizations table: id, name, industry, plan, settings (JSONB), createdAt | P0 |
| USER-03 | User-Org membership table for multi-org support | P1 |
| USER-04 | Profile page: view/edit name, email, phone, avatar, notification preferences | P0 |
| USER-05 | Preferences: theme (light/dark), language, timezone, notification toggles | P0 |
| USER-06 | Billing page: plan display, API usage meter, payment method (Stripe) | P2 |
| USER-07 | Settings > Users: CRUD for org users (Org Admin+) | P1 |
| USER-08 | Settings > Organization: edit org profile and branding (Org Admin+) | P1 |

### 2.3 Main Page (AI Chat)

| ID | Requirement | Priority |
|----|-------------|----------|
| MAIN-01 | 4 metric tiles with role-specific content per Constitution §5 formulas | P0 |
| MAIN-02 | Tile click opens modal with metric breakdown (real data from API) | P0 |
| MAIN-03 | AI chat interface with Automa (SSE streaming responses) | P0 |
| MAIN-04 | Chat history persisted per user in database | P1 |
| MAIN-05 | Thinking Card with collapsible AI reasoning steps | P0 |
| MAIN-06 | Suggestion bubbles populated from agent context | P1 |
| MAIN-07 | File upload via Plus button (stored in Drive) | P2 |
| MAIN-08 | Wave-dot typing animation during AI response generation | P0 |
| MAIN-09 | Gradient input border with chat-input-gradient CSS | P0 |

### 2.4 Insights

| ID | Requirement | Priority |
|----|-------------|----------|
| INS-01 | Dashboard tab: Command Center with real-time triage alerts (Red/Yellow/Green zones) | P0 |
| INS-02 | Dashboard tab: Performance Scorecard with live metrics (Close Rate, Avg Deal Size, Time to Close, Lead Response) | P0 |
| INS-03 | Dashboard tab: Pipeline Health with 5-stage progress bars from VIN data | P0 |
| INS-04 | Dashboard tab: Charts — Leads This Week (area) + Conversions (bar) with real data | P0 |
| INS-05 | Reports tab: 6 priority reports (Deal Death Autopsy, Lead Source Quality, Channel Performance, Pipeline Velocity, Active Lead Triage, Deal Status Snapshot) | P0 |
| INS-06 | Reports: each report computed from VIN Solutions lead data using formulas from reference docs | P0 |
| INS-07 | Library tab: Full metrics library (all metrics from Tiles reference doc) with category filters and search | P1 |
| INS-08 | Library tab: Grid/List view toggle, metric detail modal on click | P1 |
| INS-09 | Hunches tab: AI-generated pattern detections per Hunch Instructions prompt | P1 |
| INS-10 | Hunches: confidence score, type badge (Opportunity/Threat/Insight), source label | P1 |
| INS-11 | Hunches: automated weekly generation (Monday 6AM) with lifecycle tracking | P2 |
| INS-12 | Activity page: filterable activity feed with search and type filters | P1 |

### 2.5 Agents

| ID | Requirement | Priority |
|----|-------------|----------|
| AGT-01 | Agent CRUD: create, read, update, delete agents | P0 |
| AGT-02 | Agent list in SubMenuManager panel with search, Automa filtered out | P0 |
| AGT-03 | Agent detail header: avatar, name, status badge, description, metadata | P0 |
| AGT-04 | Agent chat interface: SSE streaming, same styling as Main page | P0 |
| AGT-05 | Agent config pane (right pane): 6 sections — Performance, Instructions, Triggers, Tools, Knowledge, Activity | P0 |
| AGT-06 | Instructions: editable system prompt with modal | P0 |
| AGT-07 | Triggers: configurable triggers with enable/disable toggles | P1 |
| AGT-08 | Tools & Skills: enable/disable tools per agent | P1 |
| AGT-09 | Knowledge: upload and manage knowledge sources per agent | P1 |
| AGT-10 | Agent status toggle: active/inactive (play/pause) | P0 |
| AGT-11 | Agent performance metrics: interactions count, resolution rate, avg response time | P1 |

### 2.6 Hub

| ID | Requirement | Priority |
|----|-------------|----------|
| HUB-01 | Calendar: 4 view modes (Year/Month/Week/Day) with navigation | P0 |
| HUB-02 | Calendar: event CRUD with color-coding by type (meeting=blue, appointment=green, task=orange, reminder=purple) | P1 |
| HUB-03 | Leads tab: lead cards with real VIN data, action buttons (Text, Call, Schedule) | P0 |
| HUB-04 | Inbox tab: unified messaging (Email, SMS, Voicemail) with unread indicators | P1 |
| HUB-05 | Dialer modal: functional VoIP integration via VAPI | P2 |
| HUB-06 | New Message modal: SMS/Email compose with recipient lookup | P1 |
| HUB-07 | Schedule Appointment modal: calendar integration | P1 |

### 2.7 Drive

| ID | Requirement | Priority |
|----|-------------|----------|
| DRV-01 | File upload, download, delete with S3-compatible storage | P1 |
| DRV-02 | Grid/List view toggle with file metadata (name, size, type, dates) | P0 |
| DRV-03 | Folder navigation with breadcrumb trail | P1 |
| DRV-04 | Star/unstar files, share modal (Email/SMS tabs) | P1 |
| DRV-05 | Copy link functionality with clipboard API | P0 |
| DRV-06 | Sub-menu panel: My Files, Shared, Starred, Recent, Templates categories | P0 |

### 2.8 System Settings

| ID | Requirement | Priority |
|----|-------------|----------|
| SET-01 | Tile-based grid navigation with role-gated sections | P0 |
| SET-02 | 10 setting tiles: General, Users, Organizations, Channels, Knowledge, AI Config, Billing, Security, Notifications, Tools & Integrations | P0 |
| SET-03 | Tools & Integrations: 3 sub-tabs — Tools, Widgets, Landing Pages | P1 |
| SET-04 | Widgets: 4 types (Text Chat, Live Video, Voice Call, Unified) | P1 |
| SET-05 | Widget config: 5 sub-tabs — Settings, Appearance, Targeting, Domains, Embed | P1 |
| SET-06 | Widget preview modals per widget type | P1 |
| SET-07 | Widget Landing Page: standalone /w/demo route with 6 channel cards | P2 |

### 2.9 Notifications & Activity

| ID | Requirement | Priority |
|----|-------------|----------|
| NOT-01 | Real-time notification delivery (polling or SSE) | P1 |
| NOT-02 | Notification bell with unread count badge | P0 |
| NOT-03 | Notification types: lead assignment, agent alert, system update, mention | P1 |
| NOT-04 | Mark as read on click, navigate to action URL | P0 |
| NOT-05 | Activity feed: system-wide audit log of actions | P1 |
| NOT-06 | Activity types: login, create, update, delete, system | P1 |

---

## 3. Non-Functional Requirements

### 3.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| PERF-01 | API response time (p95) | < 200ms |
| PERF-02 | Database query time | < 50ms |
| PERF-03 | Initial page load (LCP) | < 2.5s |
| PERF-04 | AI chat first token latency | < 1s |
| PERF-05 | Concurrent users per instance | 100+ |
| PERF-06 | VIN API sync cycle | ≤ 5 min staleness |

### 3.2 Security

| ID | Requirement |
|----|-------------|
| SEC-01 | All API routes require authentication (except /auth/login, /auth/register, /w/*) |
| SEC-02 | Row-Level Security (RLS) on all multi-tenant tables |
| SEC-03 | CSRF protection via SameSite cookies |
| SEC-04 | Input validation with Zod on all API endpoints |
| SEC-05 | SQL injection prevention via Drizzle ORM parameterized queries |
| SEC-06 | XSS prevention via React's default escaping + CSP headers |
| SEC-07 | Rate limiting on auth endpoints (5 attempts/minute) |
| SEC-08 | Secrets stored in environment variables, never in code |
| SEC-09 | HTTPS enforced in production |
| SEC-10 | Audit logging for all admin actions |

### 3.3 Reliability

| ID | Requirement |
|----|-------------|
| REL-01 | Database backups: automatic daily with 30-day retention |
| REL-02 | Graceful error handling: user-friendly error messages, no stack traces exposed |
| REL-03 | Webhook idempotency: duplicate events do not create duplicate records |
| REL-04 | Session storage in PostgreSQL (survives server restarts) |

### 3.4 Scalability

| ID | Requirement |
|----|-------------|
| SCAL-01 | Stateless API server (session in DB, no in-memory state) |
| SCAL-02 | Database connection pooling |
| SCAL-03 | VIN API response caching (5-min TTL) |
| SCAL-04 | Metric computation with time-bucketed caching |

---

## 4. Data Architecture

### 4.1 Database Schema (17 Tables)

```sql
-- Core
users (id, name, email, password_hash, role, organization_id, avatar_url, phone, preferences, created_at, updated_at)
organizations (id, name, industry, plan, settings, logo_url, created_at, updated_at)
sessions (sid, sess, expire)  -- connect-pg-simple

-- Agents
agents (id, name, description, status, channel, system_prompt, organization_id, created_by, triggers, tools, knowledge_sources, created_at, updated_at)

-- Chat
conversations (id, title, user_id, agent_id, organization_id, created_at, updated_at)
messages (id, conversation_id, role, content, thinking, created_at)

-- Leads (synced from VIN)
leads (id, vin_lead_id, dealer_id, status, status_type, group_category, lead_type, source_id, source_name, is_hot, is_on_showroom, trade_vehicles, vehicles_of_interest, created_utc, organization_id)

-- Drive
files (id, name, type, size, path, folder_id, starred, shared_with, organization_id, uploaded_by, created_at, updated_at)
folders (id, name, parent_id, organization_id, created_at)

-- Hub
calendar_events (id, title, type, start_time, end_time, attendees, notes, organization_id, created_by, created_at)
inbox_messages (id, channel, sender, recipient, subject, body, read, organization_id, created_at)

-- Settings
widgets (id, type, name, settings, appearance, targeting, domains, organization_id, created_at, updated_at)
landing_pages (id, slug, title, config, organization_id, created_at, updated_at)

-- Insights
metrics_cache (id, metric_key, value, role, organization_id, computed_at, ttl_seconds)
hunches (id, title, description, type, confidence, source, data, status, organization_id, created_at)

-- System
notifications (id, user_id, title, message, type, read, action_url, organization_id, created_at)
activity_log (id, user_id, action, description, entity_type, entity_id, organization_id, created_at)
```

### 4.2 RLS Policy Pattern

Every table with `organization_id` gets an RLS policy:
```sql
CREATE POLICY tenant_isolation ON [table]
  USING (organization_id = current_setting('app.organization_id')::uuid);
```

The Express middleware sets `app.organization_id` on every request from the authenticated session.

### 4.3 API Endpoints (Grouped by Module)

**Auth (4 endpoints)**
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/logout
- GET /api/auth/me

**Users (5 endpoints)**
- GET /api/users (list, admin only)
- GET /api/users/:id
- PATCH /api/users/:id
- DELETE /api/users/:id (admin only)
- PATCH /api/users/:id/preferences

**Organizations (4 endpoints)**
- GET /api/organizations
- GET /api/organizations/:id
- PATCH /api/organizations/:id
- GET /api/organizations/:id/members

**Agents (7 endpoints)**
- GET /api/agents
- GET /api/agents/:id
- POST /api/agents
- PATCH /api/agents/:id
- DELETE /api/agents/:id
- PATCH /api/agents/:id/status
- GET /api/agents/:id/activity

**Chat (5 endpoints)**
- GET /api/conversations
- POST /api/conversations
- GET /api/conversations/:id/messages
- POST /api/conversations/:id/messages (SSE streaming response)
- DELETE /api/conversations/:id

**Insights (6 endpoints)**
- GET /api/insights/dashboard (aggregated dashboard data)
- GET /api/insights/metrics/:key (individual metric)
- GET /api/insights/reports/:reportId (report data)
- GET /api/insights/library (all library metrics)
- GET /api/insights/hunches
- POST /api/insights/hunches/generate

**Leads (4 endpoints)**
- GET /api/leads (paginated, filtered)
- GET /api/leads/:id
- GET /api/leads/pipeline (pipeline health data)
- POST /api/leads/sync (trigger VIN sync)

**Calendar (4 endpoints)**
- GET /api/calendar/events
- POST /api/calendar/events
- PATCH /api/calendar/events/:id
- DELETE /api/calendar/events/:id

**Inbox (3 endpoints)**
- GET /api/inbox
- POST /api/inbox/send
- PATCH /api/inbox/:id/read

**Drive (6 endpoints)**
- GET /api/files
- POST /api/files/upload
- GET /api/files/:id/download
- PATCH /api/files/:id
- DELETE /api/files/:id
- POST /api/files/:id/share

**Settings (3 endpoints)**
- GET /api/settings
- PATCH /api/settings
- GET /api/settings/widgets

**Widgets (5 endpoints)**
- GET /api/widgets
- GET /api/widgets/:id
- POST /api/widgets
- PATCH /api/widgets/:id
- DELETE /api/widgets/:id

**Notifications (3 endpoints)**
- GET /api/notifications
- PATCH /api/notifications/:id/read
- POST /api/notifications/mark-all-read

**Activity (1 endpoint)**
- GET /api/activity

**Webhooks (3 endpoints)**
- POST /api/webhooks/vapi
- POST /api/webhooks/tavus
- POST /api/webhooks/textmagic

**Total: 63 endpoints across 15 modules**

---

## 5. Metric Specifications

### 5.1 Insights Library Metrics (Full Catalog)

The metrics library contains metrics organized into these categories. Each metric has a defined computation using VIN Solutions data fields:

**Pipeline Volume & Velocity (7 metrics)**
1. Total Active Pipeline — Count of leads where leadStatusType = "ACTIVE"
2. Daily New Lead Volume — Count of leads created per day from createdUtc
3. Weekly Lead Trend — 7-day rolling average of new leads
4. Month-over-Month Lead Growth — % change in lead volume (current 30d vs previous 30d)
5. Lead Velocity Rate — Average leads per day over trailing 30/60/90 days
6. Pipeline Stagnation Index — Count of ACTIVE leads older than 30 days
7. Fresh Lead Ratio — % of leads created in last 7 days vs total active pipeline

**Conversion & Win Rate (8 metrics)**
1. Overall Win Rate — SOLD / (SOLD + LOST)
2. Close Rate by Lead Type — Win rate segmented by leadType
3. Digital vs Physical Close Rate — Win rate INTERNET/WEBSITE_CHAT vs WALK_IN
4. Service-to-Sales Conversion — % of SERVICE type leads that become SOLD
5. Hot Lead Conversion Rate — Win rate for isHot=true vs false
6. Showroom Conversion Rate — Win rate for isOnShowroom=true
7. Loss Rate — LOST / (SOLD + LOST + ACTIVE)
8. Bad Lead Rate — BAD / Total leads

**Response & Engagement (6 metrics)**
1. Contact Rate — % of leads CONTACTED vs NEW
2. New Lead Aging — Average age (days) of leads still in NEW category
3. Response Gap Count — NEW status leads older than 24/48/72 hours
4. Waiting Lead Volume — Count of leads in WAITING status
5. Engagement Transition Rate — % NEW → CONTACTED within X hours
6. Average Time to First Contact — Mean hours from createdUtc to status change

**Lead Source Performance (8 metrics)**
1. Lead Source Distribution — % breakdown by leadSourceId
2. Top 3 Sources by Volume — Which sources generate most leads
3. Source Win Rate Analysis — Close rate per source
4. Source ROI Proxy — SOLD count / Total leads per source
5. Source Diversity Score — # active sources / total available
6. Source Concentration Risk — % from single largest source
7. Underperforming Source ID — Sources below dealership average win rate
8. Source Quality Score — (SOLD - BAD) / Total per source

**Lead Type & Channel (7 metrics)**
1. Digital Lead Percentage — (INTERNET + WEBSITE_CHAT) / Total
2. Walk-In Traffic Volume — Count of WALK_IN type leads
3. Phone Inquiry Rate — Count of PHONE type leads
4. Referral Lead Count — Count of REFERRAL type leads
5. Previous Customer Return Rate — PREVIOUS_CUSTOMER as % of total
6. Service Lane Cross-Sell — SERVICE leads / Total
7. Channel Win Rate Comparison — Win rate by each leadType value

**Vehicle Interest & Inventory (11 metrics)**
1. New vs Used Interest — % breakdown by inventoryType
2. Average Vehicle MSRP — Mean of msrp values where not null
3. Price Point Distribution — Lead count grouped by MSRP bands
4. Top 5 Makes in Demand — Most frequent make values
5. Top 5 Models in Demand — Most frequent model values
6. Luxury vs Economy Mix — % high-end makes vs volume brands
7. Trade-In Penetration — % leads with non-empty tradeVehicles
8. Average Down Payment Request — Mean of downPaymentRequested
9. Cash vs Finance Preference — Distribution of paymentMethod
10. High-Value Lead Count — Leads with msrp > $60,000
11. Vehicle Availability Match — % with VIN populated

**Lead Age & Lifecycle (7 metrics)**
1. Average Lead Age — Mean days from createdUtc for ACTIVE leads
2. Lead Age Distribution — Count in 0-7, 8-14, 15-30, 31-60, 60+ day buckets
3. Overdue Lead Count — ACTIVE leads older than 14 days
4. Stale Lead Percentage — ACTIVE >30 days / Total ACTIVE
5. Lead Lifespan (Closed) — Average days from creation to SOLD
6. Lead Lifespan (Lost) — Average days from creation to LOST
7. Fast Close Rate — % of SOLD leads closed within 7 days

**Lead Status & Stage (10 metrics)**
1. Status Distribution — Count per each of 38 leadStatus values
2. Appointment Set Count — ACTIVE_SET_APPOINTMENT count
3. Waiting for Response — ACTIVE_WAITING_FOR_PROSPECT_RESPONSE count
4. Pending Finance Count — SOLD_PENDING_FINANCE count
5. Delivered Count (Month) — SOLD_DELIVERED in period
6. Lost Reason Analysis — Distribution across LOST_* categories
7. Bad Lead Reason Analysis — Distribution across BAD_* categories
8. No Response Loss Rate — LOST_DID_NOT_RESPOND / Total LOST
9. Credit Issue Loss Rate — LOST_BAD_CREDIT / Total LOST
10. Competitive Loss Rate — LOST_PURCHASED_* / Total LOST

**Hot Lead & Priority (6 metrics)**
1. Hot Lead Volume — isHot=true count
2. Hot Lead Percentage — Hot / Total ACTIVE
3. Hot Lead Close Rate — SOLD hot / Total hot
4. Hot Lead Age — Average age of hot ACTIVE leads
5. Showroom Visit Count — isOnShowroom=true count
6. Showroom Close Rate — SOLD showroom / Total showroom

**Time-Based Comparisons (5 metrics)**
1. Current vs Previous Month Win Rate
2. YoY Lead Volume Growth
3. Quarter-over-Quarter Pipeline Growth
4. Weekend vs Weekday Lead Volume
5. After-Hours Lead Volume

**Lead Quality Indicators (5 metrics)**
1. Lead Quality Score — (SOLD + ACTIVE) / Total
2. First-Time vs Repeat Customer Mix
3. In-Market Signal Strength — % with VIN specified
4. Budget Clarity Rate — % with payment requests populated
5. Vehicle Specificity Score — % with trim level specified

**Advanced Composite (6 metrics)**
1. Pipeline Efficiency Score — (SOLD / ACTIVE) × (1 - Avg Age/30)
2. Lead Momentum Index — (7d volume / 30d avg) × Contact Rate
3. Conversion Funnel Health — (CONTACTED/NEW) × (SOLD/CONTACTED)
4. Sales Velocity — SOLD count / Average days to close
5. Lead Saturation Index — ACTIVE count / Salesperson count
6. Digital Maturity Score — (Digital leads / Total) × (Digital win rate / Overall win rate)

**Predictive & Forecasting (5 metrics)**
1. Projected Month-End Close Count — Current SOLD + (ACTIVE × Historical win rate)
2. Pipeline Coverage Ratio — ACTIVE / Monthly SOLD target
3. Lead Burn Rate — Rate ACTIVE → SOLD or LOST
4. Forecasted Lead Volume (Next 30d) — Based on 90d trend
5. At-Risk Lead Count — ACTIVE older than avg time-to-close

**Total: 91 metrics across 12 categories**

### 5.2 Reports Specifications

**Report 1: Deal Death Autopsy (100% Buildable)**
- Section 1: Loss & Bad Reasons — count, % of total losses, % of all leads per reason category
- Section 2: Loss Patterns by Lead Source — source name, total, lost, bad, loss rate, bad rate, primary reason
- Section 3: Loss Patterns by Lead Type — type, total, lost, bad, loss rate, bad rate, top reason
- Section 4: Loss Timing Analysis — age buckets (0-7, 8-14, 15-30, 31-60, 60+), count, % of losses, avg days
- Section 5: Competitive Intelligence — MoM trends of LOST_PURCHASED_*
- Section 6: Re-Engagement Opportunity — LOST_LEAD_PROCESS_COMPLETED 90-180 days ago, sorted by MSRP

**Report 2: Lead Source Quality (100% Buildable)**
- Main Scorecard Table: rank, source, 7d vol, 30d vol, win rate, quality score, active %, bad %, trend, grade (A+→F)
- Grade criteria: A (>25% win, <8% bad), B (18-25%, <12%), C (12-18% OR 12-18%), D (<12% OR >18%), F (<8% OR >25%)
- Red Flag Alerts: bad rate >20% for 2+ weeks, F grade 3+ weeks, volume drop >30%
- Source Concentration Risk alert if >40%

**Report 3: Channel Performance (100% Buildable)**
- Comparison table: all 10 lead types with volume, %, win rate, loss rate, bad rate, hot %, showroom %, trade-in %
- Key insights section: highest converting, highest volume, best quality, loyalty indicator, digital %

**Report 4: Pipeline Velocity & Freshness (100% Buildable)**
- Velocity metrics: 7d/30d/90d averages, MTD vs same period last month
- Freshness distribution: 0-7d, 8-14d, 15-30d, 31-60d, 60+ buckets with targets
- Status category distribution: NEW, WAITING, CONTACTED with counts and %
- Hot lead monitoring: total, %, avg age, hot >14d count
- Month-end forecast: current SOLD + (ACTIVE × historical win rate)

**Report 5: Active Lead Triage (100% Buildable)**
- Red Zone: Hot leads >14d, NEW leads >48h, Showroom visitors not converting >7d
- Yellow Zone: Active leads 28-35 days old
- Green Zone: today's metrics (new leads, active pipeline, week close rate)

**Report 6: Deal Status Snapshot (100% Buildable)**
- Status type summary: ACTIVE, SOLD, LOST, BAD, COMPLETE with counts, %, WoW change
- Top 10 granular statuses from 38 available
- Lead group category breakdown with avg age
- Critical status alerts: SOLD_PENDING_FINANCE, SET_APPOINTMENT, WAITING_FOR_RESPONSE
- Week-over-week movement: NEW→CONTACTED, ACTIVE→SOLD, ACTIVE→LOST

### 5.3 Hunch Engine Specifications

The Hunch Engine runs an AI analysis using the prompt from Hunch Instructions reference doc. Key parameters:
- Analyzes last 90 days of lead data
- Generates 5-10 hunches per run
- Each hunch has: title, pattern description, data evidence, opportunity sizing (revenue impact), recommended action, test methodology
- Confidence levels: HIGH (n≥100, consistent), MEDIUM (n≥20, visible pattern), LOW (n<20 or inconsistent)
- Categories: Hidden Winners, Fixable Losers, Scale Opportunities, Warning Signals, Counter-Intuitive Patterns, Process Gaps, Interaction Effects
- Lifecycle: New → Under Investigation → Test in Progress → Validated → Implemented → Monitoring (or Dismissed/Invalidated)

---

## 6. UI/UX Requirements

### 6.1 Layout Invariants (from validated prototype)

These layout behaviors are locked and must not change during backend integration:

- TopBar: 56px height (h-14), logo left, org switcher center, icons right
- Sidebar: 64px width (w-16), fixed, icon+label items, purple active indicator
- SubMenuManager: hover/pin system with 800ms leave timeout, ChevronLeft collapse
- Right Pane: w-80/lg:w-96 desktop, full-screen mobile overlay, renders AgentConfigPane on agents page
- View configs: chat-only (Main), data-display (Drive/Insights), sub-menu (Hub/Settings), heavy-chat (Agents)
- Responsive breakpoints: mobile (<768px), tablet (768-1023px), desktop (≥1024px)

### 6.2 Chat Standards (All Chat Interfaces)

- Bot messages: left-aligned, bg-card border border-border, rounded-2xl
- User messages: right-aligned, bg-primary text-primary-foreground, rounded-2xl
- NO avatars on any chat messages
- Max width: 80%
- Typing animation: wave-dot CSS class, 3 dots with delays (0s, 0.15s, 0.3s)
- Input: chat-input-gradient wrapper with animated purple/blue/cyan border
- Placeholder: "Ask me anything about your business"
- Enter sends, Shift+Enter newline
- Thinking Card: collapsible with Brain icon, purple tint (border-purple-500/20 bg-purple-500/5)

### 6.3 Design Tokens

- Font sizes: 13px for data tables (density-data), 14-15px for chat (density-chat)
- Color palette: Slate + Purple primary accent
- Active state: purple left-edge bar (w-0.5 h-8 bg-purple-500)
- Hover effect: hover-elevate class (subtle lift + shadow)
- Dark mode: class-based toggle, CSS custom properties for all colors

---

## 7. Acceptance Criteria Traceability

Every UI behavior documented in ACCEPTANCE_CRITERIA.md (Part I) maps to a functional requirement in this SRS. The acceptance criteria document is the pixel-level truth; this SRS defines the backend requirements to power those behaviors.

| AC Section | SRS Requirement IDs |
|------------|-------------------|
| 1. Global Shell | AUTH-01→10, USER-04→05, NOT-01→04 |
| 2. Main Page | MAIN-01→09 |
| 3. Insights | INS-01→12 |
| 4. Agents | AGT-01→11 |
| 5. Hub | HUB-01→07 |
| 6. Drive | DRV-01→06 |
| 7. Settings | SET-01→07 |
| 8. Profile | USER-04→06 |

---

## Document Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-21 | 2.1 | Initial comprehensive SRS with 63 API endpoints, 17 database tables, 91 library metrics, 6 report specs, hunch engine spec, complete non-functional requirements. |
