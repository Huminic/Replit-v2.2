# Nexxus V2 -- Master System Requirements Specification

**Version:** 2.0
**Date:** 2026-02-18
**Status:** GOVERNING DOCUMENT -- Single source of truth
**Approved by:** Duane Wells (Huminic, platform operator)
**Supersedes:** MASTER_SRS v1.0 (2026-02-16), SRS v3.0, Addendum v3.1, Addendum v3.2

---

## 1. Executive Summary

Nexxus is an AI orchestration layer that bridges businesses, their data, third-party integrations, language models, and tools. It is not a CRM, not a marketing automation tool, and not a content development platform. It aggregates data from disparate sources and leverages AI to deliver insights, automate processes, and close execution gaps -- starting with sales.

The business model is partner-enabled. Experts in specific fields who have access to large customer groups are recruited as partners. These partners deliver AI technology to their industry segments through the Nexxus platform. The first partner (Duran Cage) brought automotive dealership groups. Current customers are Serra Automotive and Hyundai of Columbia.

**Core value proposition:** Businesses lose not because of lead volume but because of response gaps and execution failures. Nexxus fixes this through AI-powered voice, video, chat, and SMS interactions that ensure no lead is left behind, every prospect gets timely attention, and leadership has accurate metrics for decision-making.

**Platform operator:** Huminic (`super_admin` role).

---

## 2. Platform Identity

### 2.1 Not Automotive-Only

Automotive-specific features exist because early adopters are in automotive. The platform is designed to serve any industry where a partner has access to customer segments. Automotive keywords and features are acceptable because they serve current customers, but the architecture is not permanently locked to automotive.

### 2.2 AI-First

Natural language is the primary interface for querying data and executing tasks. Every major feature surface (dashboard, agents, work center) integrates AI capabilities.

### 2.3 Partner-Enabled

Partners bring customer organizations to the platform. Each partner manages their assigned organizations and can apply templates created by the platform operator.

### 2.4 Naming Conventions

| Term | Meaning |
|------|---------|
| DealerBrain | The concept -- AI intelligence layer for dealership operations |
| Automa | The interface -- the master agent that exists in every account |
| Skills | Agent capabilities (renamed from "Tools" in UI) |

DealerBrain is not a sidebar link. Automa is always at the top of the agents list.

---

## 3. User Roles & Personas

### 3.1 RBAC Tier Mapping

| System Role | Dealership Equivalent | Responsibilities | Dashboard Focus | Data Access |
|-------------|----------------------|------------------|-----------------|-------------|
| `super_admin` | Platform operator (Huminic) | Provision partners, create orgs, manage billing, maintain system | System-wide health | All orgs, all data |
| `partner_admin` | Brand/group manager (e.g. Duran Cage) | Manage assigned orgs, view resource utilization, apply templates | Org engagement and adoption | Assigned orgs, aggregate metrics (no individual PII) |
| `org_admin` | Sales Manager / BDC Manager | Manage users, configure settings, set goals, oversee staff | Pipeline health, team performance | Own org, all leads, all staff data |
| `org_staff` | Salesperson | Use agents, view personal leads, interact via Work Hub | My leads, my tasks, my performance | Own assignments only |

### 3.2 Role-Specific Capabilities

**super_admin:**
- Create/manage partners and organizations
- Direct org creation when no partner involved
- Master billing management
- System configuration and monitoring
- All features accessible

**partner_admin:**
- View and manage assigned organizations
- See resource utilization across their portfolio
- Create new organizations under their partnership
- Apply Super Admin-created templates to orgs
- Switch between assigned orgs

**org_admin:**
- Manage users within their organization(s)
- Create and configure agents shared to staff
- Set goals and review performance
- Access VIN Solutions data via DealerBrain
- Configure triggers and automations
- Switch between organizations if assigned to multiple

**org_staff:**
- Chat with agents (including Automa)
- Access shared agents in Agents section
- Use Drive (personal folder + shared folder)
- Use Work Hub (messages, calendar, tasks)
- View Insights (personal performance only)
- No direct VIN Solutions query access -- functionality delivered through Work Hub

### 3.3 Permissions Matrix

| Capability | `super_admin` | `partner_admin` | `org_admin` | `org_staff` |
|------------|:---:|:---:|:---:|:---:|
| Create partners | Yes | No | No | No |
| Create organizations | Yes | Yes | No | No |
| Manage billing | Yes | No | No | No |
| System settings | Yes | No | No | No |
| Create Org Admins | Yes | Yes (assigned orgs) | No | No |
| Create Staff | Yes | Yes (assigned orgs) | Yes (own org) | No |
| Configure agents | Yes | Yes (assigned orgs) | Yes (own org) | No |
| Create trigger rules | Yes | Yes (assigned orgs) | Yes (own org) | No |
| Share agents to staff | Yes | Yes | Yes | No |
| Use DealerBrain/Automa | Yes | Yes | Yes | Yes |
| Use shared agents | Yes | Yes | Yes | Yes (if shared) |
| Access Drive | Yes | Yes | Yes | Yes |
| Access Work Hub | Yes | Yes | Yes | Yes |
| Access Insights | Yes | Yes | Yes | Yes (read-only) |
| Access Activity (oversight) | Yes | Yes | Yes | No |
| Direct VIN query access | Yes | Yes | Yes | No |
| View Dealer Pulse | Yes | Yes | Yes | Yes (read-only) |
| Manage goals | Yes | Yes | Yes | No |
| Approve hunches | Yes | Yes | Yes | No |
| Switch organizations | Yes | Yes | Yes (if multi-org) | No |

---

## 4. Navigation & Layout

### 4.1 Layout Types

| Type | Description | Used By |
|------|-------------|---------|
| A | Chat-only window | Reserved |
| B | Information display (center) + side chat (right) | Main Dashboard |
| C | Chat display (center) + side information (right) | Agents / DealerBrain |
| D | System settings (no chat) | Settings pages |
| E | Library and artifact view | Drive |

### 4.2 Sidebar Structure

Main navigation with pop-out submenus. Double-arrow locks submenu open and expands all items. Defaults back to collapsed behavior after inactivity.

| Section | Subsections | Minimum Role |
|---------|-------------|-------------|
| Main (Dashboard) | -- | `org_staff` |
| Agents | Agent list, Agent creation | `org_staff` (view), `org_admin` (create) |
| Drive | Personal folder, Shared folder | `org_staff` |
| Insights | Dashboard, Dealer Pulse, Goals, Hunches, Reports | `org_staff` (limited), `org_admin` (full) |
| Hub (Work Center) | Messages, Calendar, Tasks, Approvals, Leads | `org_staff` |
| Activity | Activity feed | `org_admin` |
| Settings | Varies by role | `org_admin` |

### 4.3 Dashboard-Specific Behavior

The Main Dashboard (Type B layout) opens with the chat window visible by default. No other page auto-opens chat. All dashboards receive role-based treatment across both classic and Next layouts. The NextDashboard includes role-based routing (admin vs staff views).

---

## 5. Core Features

### 5.1 Authentication & RBAC

**Status:** CONFIRMED

Multi-tenant authentication with JWT tokens. Row-level security (RLS) enforced at database level via `SecureQueryBuilder` using `current_setting('app.current_org_id')`. 53 RLS policies across 28 tables. 4-tier RBAC model with role-gated API endpoints.

**Acceptance Criteria:** AC-008, AC-009, AC-010

### 5.2 Dashboard (Main)

**Status:** NEEDS WORK -- metrics consolidation required, source labels to be removed, role-based views need verification

The landing page showing key metrics and data. Currently built sections:
- Dealership Pulse (health gauges)
- Lead metric cards (Overdue, New, Active)
- Goal Progress widget
- Live Lead Feed
- Agent Actions
- Team Leaderboard

**Locked Decisions:**
- ALL dashboards get role-based treatment (classic + Next)
- REMOVE all source labels from UI (no "local+vin" or other source attribution visible to users)
- No placeholder UI for blocked metrics -- if data is unavailable, the metric is not shown
- NextDashboard files are kept; they contain role-based routing logic
- Metrics strategy: consolidate existing into unified engine FIRST, then add combined metrics

**Acceptance Criteria:** AC-003, AC-007, AC-008, AC-009, AC-010

### 5.3 DealerBrain / Agents

**Status:** CONFIRMED (DealerBrain core) / NEEDS WORK (blocked data awareness, performance metrics wiring)

DealerBrain is the AI intelligence layer powered by Claude API with tool calling and streaming SSE. Automa is the master agent, always at the top of the agents list, with high-level organizational context awareness. 24 tools are registered.

Agents are created by `org_admin`, `partner_admin`, or `super_admin` and shared down to `org_staff`. Each agent can have Skills (context, instructions, predefined workflows). Agent types include voice (VAPI), video (Tavus), and task automation.

**Needs Work:**
- DealerBrain system prompt must include explicit list of available vs blocked data
- When asked about blocked data, DealerBrain must explain limitations and offer alternatives
- Agent `performanceMetrics` field exists but `updatePerformanceMetrics` is never called -- needs wiring to VAPI/Tavus webhooks
- 5 vendor name leaks in UI (Tavus, VAPI references) must be replaced with "Voice Agent", "Video Agent", "AI Assistant"

**Locked Decisions:**
- Vendor regex keywords kept in code, removed from UI
- Agent performance metrics auto-populate from VAPI call-ended + Tavus conversation-ended webhooks

**Acceptance Criteria:** AC-002, AC-004, AC-011, AC-013

### 5.4 Drive

**Status:** CONFIRMED

Each user gets a personal drive folder plus a public shared folder. Artifacts created in chats are automatically saved to Drive. Uses Type E layout (library and artifact view).

### 5.5 Insights

**Status:** NEEDS WORK -- metrics consolidation, Dealer Pulse certification

Sub-sections:

**5.5.1 Dashboard** -- AI-related metrics and communication data. Currently sourced from fragmented services (~15-17 of 30 proposed metrics exist across 5 services). Needs consolidation into unified metrics engine.

**5.5.2 Dealer Pulse** -- VIN Solutions data aggregation via `DealerPulseService`. Generates 5-phase snapshots cached in `dealer_pulse_cache` table. Runs every 4 hours. AI commentary via Claude Haiku with rule-based fallback.

**5.5.3 Goals** -- Goal tracking integrated with AI analysis. Goals are the "center of orbit" for the system's intelligence.

**5.5.4 Hunches** -- AI-generated suggestions via `HunchesService`.

**5.5.5 Reports** -- Reporting surface.

**5.5.6 Attribution** -- Lead source attribution. Source labels removed from user-facing UI per locked decision; attribution data maintained internally for analysis.

**Acceptance Criteria:** AC-003, AC-005, AC-007

### 5.6 Hub / Work Center

**Status:** CONFIRMED (core) / NEEDS WORK (SMS AI routing, collision avoidance)

Universal communication, scheduling, and organization center.

**5.6.1 Messages** -- Staff messaging inbox. TextMagic SMS integration with two-way messaging (inbound webhook + inbox routing). Email via IMAP/SMTP.

**Needs Work:**
- SMS AI routing: after-hours messages route to AI (DealerBrain/Claude API), business hours route to assigned staff
- Collision avoidance: conversation state tracking (AI_ACTIVE / HUMAN_ACTIVE / DORMANT) to prevent AI and human responses on same thread

**5.6.2 Calendar** -- Appointment scheduling via `AppointmentService` with CRUD and RBAC. Google Calendar OAuth2 integration.

**5.6.3 Tasks** -- To-do tracking.

**5.6.4 Approvals** -- Approval workflows via `ApprovalsService`.

**5.6.5 Leads** -- Lead management surface. Includes lead-to-VIN sync pipeline.

**Needs Work:**
- Mark Contacted action must update VIN Solutions lead status (write back to CRM)
- Activity feed CSV export

**Acceptance Criteria:** AC-004, AC-012, AC-014

### 5.7 Activity Feed

**Status:** CONFIRMED

For `org_admin`, `partner_admin`, and `super_admin` to observe staff activity -- chat sessions, artifact creation, system usage. Provides oversight into how staff uses AI.

**Needs Work:**
- CSV export capability

### 5.8 Settings & Configuration

**Status:** CONFIRMED

System configuration with role-gated visibility. Includes:
- Organization settings
- Integration configuration (VIN Solutions OAuth, TextMagic API keys)
- Lead assignment configuration (configurable, not hardcoded)
- Widget configuration
- User management

**Locked Decision:** Default lead assignment to Dustin Herman, configurable in Settings.

**Acceptance Criteria:** AC-014

### 5.9 Widget System (Master Widget + Hosted Pages)

**Status:** CONFIRMED

Deployable circle button for customer websites. When clicked, presents choices: text chat, voice inbound, voice outbound, or video agent. Master Widget configuration is centralized. Individual hosted page widgets are deployable per organization.

**Acceptance Criteria:** AC-017

### 5.10 Agent Triggers & Automation

**Status:** CONFIRMED (core) / NEEDS WORK (performance metrics wiring)

`TriggerService` with 7 event types, 5 action types, conditions engine, and rate limiting. Supports conditional triggers: IF [field] [operator] [value] THEN [action].

Three communication modes:
1. **System automation** -- Automated outbound based on rules and triggers
2. **User-initiated manual** -- User manually creates individual or campaign-based communication
3. **Agent-initiated** -- Agents initiate communication based on automation workflows

VAPI outbound calls triggered via `TriggerService` (no MCP required).

**Acceptance Criteria:** AC-013

---

## 6. Integration Architecture

### 6.1 VIN Solutions

**Authentication:** OAuth 2.0 Client Credentials. Scope: `PublicAPI`. Bearer tokens expire every 60 minutes; caching implemented in `VinOAuthService`.

**API Access:** Lead Management API only.

**Version Headers:**
- Reference endpoints (`/leadStatuses`, `/leadSources`, `/leadTypes`, `/leadStatusTypes`, `/leadGroupCategories`, `/vehicles/*`): require `application/vnd.coxauto.v1+json` (v1 header)
- Lead CRUD (`/leads`): requires `application/vnd.coxauto.v3+json` (v3 lowercase header)
- Gateway endpoints (`/gateway/v1/*`): require `application/json`
- Documentation specifies uppercase `V3` but the production API rejects it. Use lowercase `v3`.

**Accessible Endpoints (13 distinct, verified 2026-02-18):**

| Endpoint | Version | Data |
|----------|---------|------|
| `/leads` (list + detail) | v3 | leadId, dealerId, contact (URL), leadSource (URL), leadStatus (38 values), leadStatusType (5 values), leadType (10 values), leadGroupCategory (3 values), createdUtc, isHot, isOnShowroom, vehiclesOfInterest[], tradeVehicles[] |
| `/leadStatuses` | v1 | 38 granular status values (e.g. ACTIVE_NEW_LEAD, SOLD_ON_ORDER, LOST_LEAD_PROCESS_COMPLETED) |
| `/leadSources` | v1 | leadSourceId, leadSourceName (paginated, 10+ pages for Serra Honda) |
| `/leadTypes` | v1 | 10 types: INTERNET, WALK_IN, PHONE, IMPORT, PARTS_ORDER, SERVICE, WEBSITE_CHAT, WHOLESALE, REFERRAL, PREVIOUS_CUSTOMER |
| `/leadStatusTypes` | v1 | 5 macro stages: ACTIVE, SOLD, LOST, BAD, COMPLETE |
| `/leadGroupCategories` | v1 | 3 engagement levels: NEW, WAITING, CONTACTED |
| `/vehicles/interest` | v1 | year, make, model, trim, vin, sellingPrice, msrp, inventoryType, mileage, stockNumber, bodyStyle, driveTrain, and more |
| `/vehicles/years` | v1 | Year catalog (1981-2027) |
| `/vehicles/makes` | v1 | Make catalog per year (49 makes for 2025) |
| `/vehicles/vin` | v1 | VIN decode to vehicle specifications |
| `/gateway/v1/tenant/user` | gateway | UserId, FullName, FirstName, LastName, EmailAddress, UserGroup, UserTypes[], IlmAccess (Admin/Manager/SalesPerson) |
| `/gateway/v1/organization/dealers` | gateway | DealerId, Name, City, State (7 dealerships visible for Serra) |
| `/gateway/v1/tenant/user/id/{id}` | gateway | Single user detail |

**Blocked Endpoints (17, all return 403 Forbidden -- verified 2026-02-18):**

| Endpoint | Impact | Priority to Unlock |
|----------|--------|-------------------|
| `/gateway/v1/communication` | Cannot see email/text/call logs between staff and customers. Critical for response gap analysis. | Critical |
| `/gateway/v1/activity` | Cannot see CRM activity logs (tasks completed, notes added, status changes) | Critical |
| `/gateway/v1/deals` | Cannot see deal/transaction records. Cannot calculate close rates or deal values. | Critical |
| `/gateway/v1/contacts` (search) | Cannot search contacts independently; cannot deduplicate before lead creation | High |
| `/gateway/v1/appointments` | Cannot see CRM appointments. Cannot verify show rates. | High |
| `/gateway/v1/notes` | Cannot see notes attached to leads/contacts | High |
| `/gateway/v1/tasks` | Cannot see CRM tasks or track workflow compliance | High |
| `/gateway/v1/calls` | Cannot see phone call logs from CRM | High |
| `/gateway/v1/calldetails` | Cannot see call metadata (duration, outcome) | High |
| `/gateway/v1/emails` | Cannot see email correspondence | High |
| `/gateway/v1/inventory` | Cannot see lot inventory | Medium |
| `/gateway/v1/vehicles` | Cannot query dealership vehicle database | Medium |
| `/gateway/v1/desking` | Cannot see deal structure/negotiation data | Medium |
| `/gateway/v1/customer` | Cannot access full customer records | Medium |
| `/gateway/v1/lead` (gateway) | Redundant -- covered by header-versioned `/leads` | Low |
| `/gateway/v1/leads` (gateway) | Redundant -- covered by header-versioned `/leads` | Low |

**Version/Parameter Issues (3 endpoints, return 400):**

| Endpoint | Issue |
|----------|-------|
| `/gateway/v1/contact` (single) | Returns "invalid userId" -- needs correct `userId` parameter. Service has a working fetch path via `vinSolutionsService`. |
| `/vehicles/trade` | Returns 404 -- likely the tested lead had no trade-in (`tradeVehicles` array was empty). Endpoint probably works when trade-in exists. |
| `/leads?leadStatus=ACTIVE` | v3 rejects macro-level status filters. Only granular sub-statuses (e.g. ACTIVE_NEW_LEAD) work. |

**Lead Creation Requirements (POST /leads):**
- `dealerId` goes in query parameter, NOT in request body
- `leadSource`, `leadType`, and `contact` are ALL required as href references (URL format: `/leadSources/id/36`), NOT string names
- Reference lookups (`/leadSources`, `/leadTypes`) must use v1 headers
- Contact creation via gateway POST returns `ContactId`; convert to href: `/contacts/id/{ContactId}?dealerid={dealerId}`

**Locked Decision:** Inventory is BLOCKED -- no VIN inventory API available with current credentials.

### 6.2 VAPI (Voice)

**Authentication:** Master API key (`VAPI_MASTER_API_KEY`). Each organization has one or more voice assistants with unique IDs, phone numbers, and names stored in the database.

**Accessible Endpoints (15 of 16, verified 2026-02-18):**

| Endpoint | Method | Key Data |
|----------|--------|----------|
| `/call` (list + detail) | GET | id, assistantId, type (inbound/outbound), startedAt, endedAt, transcript, recordingUrl, summary, cost, customer {number, sipUri}, status, endedReason, costBreakdown {transport, stt, llm, tts, vapi, chat, total, llmPromptTokens, llmCompletionTokens, ttsCharacters, analysisCostBreakdown, voicemailDetectionCost}, analysis {summary, successEvaluation}, artifact {performanceMetrics, scorecards, transfers} |
| `/analytics` | POST | Aggregated metrics: sum/avg/count/min/max with groupBy (assistant, endedReason) and time-bucketed trends (daily, weekly, monthly) |
| `/assistant` | GET | 18 configured voice agents with model, voice, prompts, analysis settings |
| `/eval` | GET | 131 call evaluations with scoring/grading data |
| `/phone-number` | GET | 7 numbers with assigned assistants and status |
| `/campaign` | GET | Outbound calling campaigns |
| `/tool` | GET | Function-calling tools available to assistants |
| `/squad` | GET | Multi-agent configurations |
| `/knowledge-base` | GET | Agent reference documents |
| `/file` | GET | Uploaded files |
| `/block` | GET | Reusable conversation blocks |
| `/test-suite` | GET | Automated testing configurations |

**Unavailable:** `/log` returns 400 (minimal impact -- call detail provides comprehensive data).

**Webhook:** `/api/webhooks/vapi` processes call-ended events. Org isolation via `metadata.organizationId` or `assistantId` lookup. Webhook creates lead in VIN, sends email notification, and creates in-app notification. Idempotency guard via `notification_sent` column on `vapi_call_logs`. Test calls (`test-e2e-*` IDs) filtered before real notifications.

### 6.3 Tavus (Video)

**Authentication:** Master API key (`TAVUS_MASTER_API_KEY`). Personas tagged with org metadata.

**Accessible Endpoints (10 of 11, verified 2026-02-18):**

| Endpoint | Method | Key Data |
|----------|--------|----------|
| `/conversations` (list + detail) | GET | conversation_id, conversation_url, status (ended/active), persona_id, replica_id, created_at, updated_at |
| `/personas` (list + detail) | GET | persona_id, persona_name, system_prompt, context, layers {perception, llm, stt}, objectives_id, guardrails_id, greeting, document_ids[], document_tags[] |
| `/replicas` (list + detail) | GET | Avatar configurations |
| `/videos` | GET | Pre-recorded/generated video content |
| `/documents` | GET | Knowledge base documents |
| `/objectives` | GET | Goal definitions for conversations |
| `/guardrails` | GET | Safety/boundary configurations |

**Unavailable:** `/landing-pages` returns 404 (minimal impact).

**Webhook:** `/api/webhooks/tavus` processes session-ended events with HMAC verification.

### 6.4 TextMagic (SMS)

**Status:** CONFIRMED (two-way) / NEEDS WORK (AI routing, collision avoidance)

- One unique phone number per store (not shared across stores)
- API key configurable per org at `super_admin` level (Settings > SMS)
- Agent persona name matches VAPI persona name
- AI SMS responses powered by DealerBrain (Claude API), NOT VAPI
- Inbound webhook receives and routes messages to staff messaging inbox

**Needs Work:**
- After-hours routing: AI responds via DealerBrain
- Business hours routing: routes to assigned staff member
- Collision avoidance: human takeover stops AI responses
- Conversation state tracking: AI_ACTIVE / HUMAN_ACTIVE / DORMANT

### 6.5 Resend (Email)

Email notification service. Sends to configured recipients based on database hierarchy: Super Admins + Partner Admins + Org Admins via `users JOIN roles` (not via a separate `user_organizations` table). Used for lead notifications, system alerts, and transactional emails.

### 6.6 Google Calendar (OAuth2)

OAuth2 integration for per-user calendar synchronization. `AppointmentService` handles CRUD with RBAC. All appointment data lives in the local `appointments` table. Google Calendar is a sync target, not the source of truth. VIN Solutions has no appointment endpoint.

---

## 7. Data Architecture

### 7.1 Truth Hierarchy

Data sources are prioritized in this order when conflicts exist:

| Priority | Source | Characteristics |
|----------|--------|----------------|
| 1 (highest) | VIN Solutions API | Authoritative CRM data. Query-only for reads, limited write (lead creation). Limited to accessible endpoints. |
| 2 | VAPI / Tavus webhooks | AI interaction records. Complete call/session data with transcripts, costs, and analysis. |
| 3 | Local database | Nexxus-internal data. User records, configurations, locally created records. |
| 4 (lowest) | Derived / computed | Metrics, scores, aggregations calculated from the above sources. |

### 7.2 Context Router

The Context Router manages data from multiple sources:
- `SourceSelector` uses VIN API as primary source, local database as fallback
- `CONTEXT_ROUTER_ENABLED=true` in `.env`
- Every data response includes source tag (`VIN`, `VAPI`, `TAVUS`, `LOCAL`) -- internal only, not shown in UI
- `CacheManager` with TTL: 5 minutes for VIN leads, 1 hour for VAPI/Tavus, no cache for local-only data
- Fallback logic: VIN fail -> local cache with staleness warning in logs (not UI), not silent substitution
- `excel_upload` records excluded from ALL lead queries (32+ queries across 11 files)
- Version-aware VIN queries: v1 for reference endpoints, v3 for leads

### 7.3 Data Flow: Webhook to Lead Creation

```
VAPI Call Ends
  -> Webhook: /api/webhooks/vapi
  -> resolveOrganizationId() (metadata.organizationId or assistantId lookup)
  -> Store in vapi_call_logs (with notification_sent=false)
  -> Extract: caller name, phone, vehicle interest, intent (from transcript via AI)
  -> Enqueue: sync_queue (lead_to_vin job)
  -> SyncCoordinator processes queue
  -> LeadCreationService:
     1. Lookup /leadSources (v1 header) -> find matching source href
     2. Lookup /leadTypes (v1 header) -> find matching type href
     3. Create contact via gateway POST -> get ContactId -> convert to href
     4. POST /leads (v3 header) with dealerId in query param, hrefs in body
  -> Duplicate detection by phone/email before creation
  -> Email notification to configured recipients (Super Admins + Partner Admins + Org Admins)
  -> In-app notification via sendToOrgAdmins()
  -> Mark notification_sent=true (atomic UPDATE...RETURNING for idempotency)
```

### 7.4 Data Flow: Dashboard Data Fetching

```
User loads dashboard
  -> Frontend requests metrics via API
  -> API routes to appropriate service (based on metric type)
  -> Service queries Context Router
  -> SourceSelector:
     1. Try VIN API (with correct version headers per endpoint)
     2. On failure: fall back to local cache (log staleness warning)
  -> NormalizedLead format with dataSource tag (internal)
  -> Exclude excel_upload records
  -> Return to frontend (no source labels in UI)
  -> Role-based filtering:
     - org_admin sees all org data
     - org_staff sees own assignments only
     - partner_admin sees aggregate across assigned orgs (no PII)
```

### 7.5 Blocked Data and Implications

17 VIN gateway endpoints return 403 Forbidden. This creates a visibility gap:

**What Nexxus CAN measure accurately:**
- AI performance (VAPI calls, Tavus sessions, costs, success rates, transcripts)
- Pipeline state (lead counts by status/type/source, aging, response rates)
- Outcomes (SOLD, LOST, BAD, COMPLETE counts)
- Vehicle demand (vehicles of interest, make/model trends, pricing)
- Staff roster and org structure

**What Nexxus CANNOT measure (blocked):**
- Human execution quality (communication gaps, follow-up frequency, task completion)
- Deal economics (deal values, gross profit, F&I products)
- Appointment conversion (show rates, AI-booked vs manually-booked)
- Inventory metrics (days on lot, turn rate, demand matching)
- CRM activity detail (notes, emails, calls, tasks)

**Implication:** The platform sees the beginning (lead creation) and the end (SOLD/LOST) but not the middle (communication, tasks, appointments, deals). Metrics that depend on blocked endpoints are excluded entirely from dashboards -- not shown, not placeholdered.

### 7.6 Metrics Strategy

**Locked Decision:** Consolidate existing ~15-17 metrics (spread across 5 fragmented services) into a unified metrics engine FIRST, then add combined cross-platform metrics.

---

## 8. Metrics Specification

### 8.1 Existing Metrics Inventory

Approximately 15-17 metrics exist across 5 fragmented services. These need consolidation before expansion.

### 8.2 Certification Requirements

A metric is only certified if:
- It has a defined name, data source(s), computation formula, field dependencies, and fill rate requirement
- The underlying data fields are actually populated (>50% fill rate from a 50+ record sample)
- The computed result matches ground truth (direct API query) within 2%
- The data source is accessible (not a blocked 403 endpoint)

### 8.3 Derivable Metrics by Category

#### 8.3.1 Pipeline Health (from VIN `/leads`)

| Metric | Computation | Role Relevance |
|--------|-------------|---------------|
| Total pipeline volume | Count where `leadStatusType` = ACTIVE | `org_admin` |
| Pipeline by stage | Group by `leadStatus` (38 granular values) | `org_admin` |
| Pipeline by macro stage | Group by `leadStatusType` (5 values: ACTIVE, SOLD, LOST, BAD, COMPLETE) | `org_admin`, `partner_admin` |
| New lead velocity | Count `leadGroupCategory` = NEW over time | `org_admin` |
| Lead aging distribution | `now - createdUtc` in buckets (0-24h, 1-3d, 3-7d, 7-14d, 14-30d, 30d+) | `org_admin` |
| Overdue/stale leads | Active leads with `createdUtc` older than threshold and `leadGroupCategory` = NEW | `org_admin`, `org_staff` |
| Hot lead count | Count where `isHot` = true | `org_admin`, `org_staff` |
| Showroom traffic | Count where `isOnShowroom` = true | `org_admin` |
| Pipeline-to-close ratio | SOLD / (ACTIVE + SOLD + LOST) over period | `org_admin` |
| Loss rate | LOST / total leads in period | `org_admin` |

#### 8.3.2 Sales / Dealership Performance (from VIN `/leads` + CRM Users)

| Metric | Computation | Role Relevance |
|--------|-------------|---------------|
| Close rate | SOLD / (SOLD + LOST) over period | `org_admin` |
| Lead response rate | CONTACTED / (NEW + WAITING + CONTACTED) | `org_admin` |
| Leads per salesperson | Cross-reference lead assignments with user roster (local filtering, not per-user API calls) | `org_admin` |
| Staff roster health | Count by `IlmAccess` (Admin/Manager/SalesPerson), flag Orphan groups | `org_admin`, `super_admin` |
| Multi-store comparison | Leads per dealerId across visible dealerships (7 for Serra) | `partner_admin` |
| Source performance | Group leads by `leadSource`, count SOLD vs total per source | `org_admin` |
| Lead type distribution | % by type (INTERNET, WALK_IN, PHONE, etc.) | `org_admin` |
| Vehicle demand patterns | Group vehicles of interest by make/model/year | `org_admin` |
| New vs Used interest | Group by `inventoryType` (NEW vs USED) | `org_admin` |
| Trade-in ratio | % of leads with non-empty `tradeVehicles` | `org_admin` |

#### 8.3.3 Voice Agent Performance (from VAPI)

| Metric | Computation | Role Relevance |
|--------|-------------|---------------|
| Total call volume | Count calls in period | `org_admin`, `super_admin` |
| Call volume trend | Weekly/daily `countId` from VAPI Analytics API | `org_admin` |
| Total cost | `sumCost` from Analytics API | `super_admin` |
| Cost per call | `sumCost / countId` | `super_admin` |
| Average call duration | `sumDuration / countId` | `org_admin` |
| Cost breakdown by component | `costBreakdown` sub-fields (transport, STT, LLM, TTS, VAPI) | `super_admin` |
| Success rate | Count `analysis.successEvaluation` = "true" / total | `org_admin` |
| Call outcome distribution | Group by `endedReason` (customer-ended, assistant-ended, voicemail, etc.) | `org_admin` |
| Per-assistant performance | Compare cost, volume, duration across 18 assistants | `org_admin` |
| Evaluation scores | From 131+ evaluations with scoring/grading data | `org_admin` |
| Token efficiency | `llmPromptTokens` vs `llmCompletionTokens` vs `llmCachedPromptTokens` | `super_admin` |

#### 8.3.4 Video Agent Performance (from Tavus)

| Metric | Computation | Role Relevance |
|--------|-------------|---------------|
| Session volume | Count conversations per period | `org_admin` |
| Session status distribution | Group by `status` (ended, active, etc.) | `org_admin` |
| Persona utilization | Conversations per persona | `org_admin` |
| Session duration | `updated_at - created_at` | `org_admin` |
| Knowledge base coverage | `document_ids[]` per persona -- which agents have docs | `org_admin` |

#### 8.3.5 Cross-Platform (Combined)

| Metric | Sources | Computation | Role Relevance |
|--------|---------|-------------|---------------|
| Total AI interaction volume | VAPI + Tavus | Sum of calls + sessions | `org_admin`, `partner_admin` |
| AI-to-human handoff rate | VAPI `endedReason` + `artifact.transfers` | Transfers / total calls | `org_admin` |
| Lead-to-AI engagement ratio | VIN leads + VAPI/Tavus volume | AI interactions / pipeline size | `org_admin` |
| Response gap score | VIN `leadGroupCategory` + VAPI timestamps | NEW leads with no corresponding AI interaction | `org_admin` |
| Total AI cost | VAPI Analytics (Tavus has no cost API) | `sumCost` from VAPI only | `super_admin` |

### 8.4 Role-Based Dashboard Targets

| Role | Minimum Certified Metrics | Focus |
|------|--------------------------|-------|
| `org_admin` | 10 | Pipeline health, team performance, AI activity |
| `org_staff` | 5 | Personal leads, personal tasks, personal performance vs team average |
| `partner_admin` | 5 | Org engagement, adoption, credit usage (local DB sources, not VIN) |
| `super_admin` | 5 | System-wide health, cost, usage |

### 8.5 Data Field Population Policy

- A metric is only adopted if underlying data fields have >50% fill rate
- Fields with <50% fill rate are flagged as "unreliable" in metric definitions
- Fill rate must be documented via audit of 50+ sample records per source
- VAPI fields to audit: `analysis.successEvaluation`, `analysis.structuredData`, `costBreakdown`
- Tavus fields to audit: conversation metadata, persona utilization, session duration data

---

## 9. Acceptance Criteria

All 19 acceptance criteria are locked as of 2026-02-18.

### 9.1 Phase 0: Critical Fixes

**AC-001: VIN API Header Resolution**
- All reference endpoints (`/leadStatuses`, `/leadSources`, `/leadTypes`, `/leadStatusTypes`, `/leadGroupCategories`) return 200 with v1 headers
- `/leads` returns 200 with v3 lowercase headers
- `/vehicles/*` endpoints return 200 with v1 headers
- Lead creation uses v1 lookups for leadSource and leadType hrefs -- verified by creating a test lead in VIN with valid references
- Zero silent failures -- every failed API call logs endpoint, version used, and response body
- Version mapping is configurable (not hardcoded in function body)
- Relates to: Section 6.1

**AC-002: Vendor Name Removal**
- Zero occurrences of "Tavus", "Vapi", "VAPI" in user-facing UI text (search all `.tsx` files)
- Replaced with role-appropriate labels: "Voice Agent", "Video Agent", "AI Assistant"
- Database seed data updated if vendor names exist in agent type enums
- Visual verification: screenshot every page, grep for vendor names
- Relates to: Section 5.3

**AC-003: Dashboard Data Accuracy**
- Voice Agent insight card shows actual call count (verified against VAPI Analytics API)
- Video insight card shows actual conversation count (verified against Tavus API)
- Lead counts on dashboard match VIN API query within 1-minute cache window
- No source labels visible to end users (no "local+vin" or similar)
- Test call exclusion filter active (no `test-e2e-*` calls in metrics)
- Relates to: Sections 5.2, 7.2

**AC-004: Webhook Lead Creation**
- VAPI call-ended webhook creates a lead in VIN with valid `leadSource` and `leadType` hrefs
- Lead assigned to configured user (default: Dustin Herman's VIN userId)
- Email notification sends to configured recipients
- Failed lead creation is logged, stored in retry queue, and admin is alerted
- Duplicate detection: phone/email match links to existing lead instead of creating duplicate
- Relates to: Sections 5.6, 6.1, 6.2, 7.3

### 9.2 Phase 1: Data Strategy & Metrics

**AC-005: Data Field Population Audit**
- 50+ VIN leads sampled -- fill rate documented per field
- Only fields with >50% fill rate used for certified metrics
- Fields with <50% flagged as "unreliable"
- VAPI call fields audited: `analysis.successEvaluation`, `analysis.structuredData`, `costBreakdown`
- Tavus conversation fields audited similarly
- Relates to: Sections 8.4, 8.5

**AC-006: Context Router Refactor**
- SourceSelector uses version-aware VIN queries (v1 for reference, v3 for leads)
- Every data response includes source tag (internal only, not shown in UI)
- Fallback logic: VIN fail -> local cache with staleness warning in logs (not UI)
- Cache TTL: 5 min VIN leads, 1 hour VAPI/Tavus, no cache for local-only
- Relates to: Section 7.2

**AC-007: Certified Metrics**
- Each metric has name, data source(s), formula, field dependencies, fill rate requirement
- Each metric verified against ground truth (API query vs computed -- within 2%)
- Metrics depending on blocked endpoints excluded entirely (not shown, not placeholdered)
- Only metrics with verified data population (>50% field fill rate) displayed
- Minimum 10 certified metrics for `org_admin`, 5 for `org_staff`
- Relates to: Section 8

**AC-008: Role-Based Dashboard (org_admin)**
- Pipeline-focused view: leads needing attention, team performance, AI activity
- Agent Actions present but not primary (below fold or secondary section)
- Every displayed number matches ground truth (API verification)
- Dashboard loads in <3 seconds
- No data from other orgs visible (RLS verified)
- Relates to: Sections 5.2, 3.1

**AC-009: Role-Based Dashboard (org_staff)**
- Personal workspace: my leads, my tasks, my performance
- Only leads assigned to this user visible
- Personal performance metrics vs team average
- Dashboard loads in <3 seconds
- Relates to: Sections 5.2, 3.1

**AC-010: Role-Based Dashboard (partner_admin)**
- Org engagement metrics: login frequency, agent adoption, AI activity per org, credit usage
- Data sourced from local DB (login/activity history), not VIN API
- Engagement score per org under this partner
- Can switch between assigned orgs
- No individual lead data visible (aggregate only, no PII)
- Relates to: Sections 5.2, 3.1

### 9.3 Phase 2: AI & Automation

**AC-011: DealerBrain Data Awareness**
- System prompt includes explicit list of available vs blocked data
- When asked about blocked data, DealerBrain explains unavailability and offers alternatives
- Tool calls to VIN use correct version headers
- Failed tool calls return user-friendly error, not empty results
- Relates to: Section 5.3

**AC-012: TextMagic Two-Way SMS**
- API key configurable per org (super admin level)
- Each org has unique phone number
- Inbound webhook receives and routes messages
- After-hours: AI responds via DealerBrain (Claude API), not VAPI
- Business hours: routes to assigned staff
- Collision avoidance: human takeover stops AI responses
- Conversation state tracked (AI_ACTIVE / HUMAN_ACTIVE / DORMANT)
- Agent persona name matches VAPI persona name
- Relates to: Sections 5.6, 6.4

**AC-013: Agent Notification Triggers**
- Conditional triggers configurable per agent: IF [field] [operator] [value] THEN notify [user]
- Minimum: VAPI call success, lead status change, lead aging threshold
- Notification channels: email, SMS (TextMagic), in-app
- Staff receives notification within 60 seconds of trigger event
- Relates to: Section 5.10

**AC-014: Lead Assignment**
- Default assignee's VIN `userId` confirmed from CRM Users roster and stored in config
- Assignee has `org_staff` account in Nexxus
- All VAPI and Tavus-originated leads auto-assigned in VIN
- Assignee receives SMS + email notification on assignment
- Assignment configurable in Settings (not hardcoded)
- Relates to: Sections 5.6, 5.8

### 9.4 Phase 3: Stabilization & Testing

**AC-015: Feature Certification**
- Every feature listed as "complete" verified at runtime -- marked CERTIFIED or NEEDS WORK
- Features marked NEEDS WORK have specific defects documented
- No feature counted as complete without passing its own E2E test
- Relates to: All sections

**AC-016: E2E Test Updates**
- Existing tests reviewed -- broken tests fixed or removed with justification
- New tests added for: webhook lead creation, dashboard accuracy, role-based routing, SMS flow, trigger notifications
- Full suite passes with <2% flaky rate
- Tests run against live APIs where possible with test data isolation
- Relates to: Section 11

**AC-017: Widget Verification**
- Widget loads on test page without errors
- Responsive on mobile/tablet/desktop
- No vendor names in widget UI
- Chat interaction produces AI response within 5 seconds
- Relates to: Section 5.9

### 9.5 Phase 4: Documentation & Handoff

**AC-018: Governing Documents**
- Master SRS created (this document)
- Constitution created
- Current-State Assessment created
- Implementation Plan created -- maps to acceptance criteria, phased with dependencies

**AC-019: Deployment Readiness**
- All Phase 0-3 acceptance criteria pass
- `npm run check` passes
- `npm run build` succeeds
- Full E2E suite passes
- No console errors on any page
- Deploy from master via `./deploy.sh`

---

## 10. Technical Constraints

### 10.1 VIN Solutions API Limitations

- 17 gateway endpoints return 403 Forbidden -- requires API key permissions upgrade from VIN Solutions
- Current scope: `PublicAPI`
- `/leads` endpoint rejects macro-level status filters (e.g. "ACTIVE" is not supported); only granular sub-statuses (e.g. ACTIVE_NEW_LEAD) work
- `/leads` does NOT support `userId` filter -- returns 404; filter locally after retrieval
- API is not designed for synchronization; use query-only with caching
- Contact search is blocked -- duplicate detection must use phone/email matching from lead data
- Rate limits are aggregate across all organizations sharing one connection (250ms minimum delay between calls)

### 10.2 Inventory

BLOCKED. No VIN inventory API available with current credentials. `/gateway/v1/inventory` and `/gateway/v1/vehicles` both return 403.

### 10.3 Dealership Sub-Roles

No granular dealership sub-roles in the system. Use the 4-tier RBAC model (`super_admin`, `partner_admin`, `org_admin`, `org_staff`). Map dealership positions to Nexxus roles as defined in Section 3.1.

### 10.4 Version Header Requirements

| Endpoint Category | Accept Header | Notes |
|-------------------|---------------|-------|
| Reference data (`/leadStatuses`, `/leadSources`, `/leadTypes`, `/leadStatusTypes`, `/leadGroupCategories`, `/vehicles/*`) | `application/vnd.coxauto.v1+json` | v3 and gateway both return 400 |
| Lead GET/POST/PUT (`/leads`, `/leads/id/{id}`) | `application/vnd.coxauto.v3+json` (lowercase v3) | v1 returns `UnsupportedApiVersion` for PUT |
| Gateway (`/gateway/v1/*`) | `application/json` | |

The documentation specifies uppercase `V3` but the production API rejects it. Use lowercase `v3`.

**PUT /leads schema note (verified 2026-02-18):** The OAS 3.0 spec documents `LeadPutRequest` with only 4 fields (`coBuyerContact`, `isHot`, `trades`, `vehiclesOfInterest`). However, the production API **silently accepts additional fields** including `leadStatus` in the v3 PUT body and returns 204. This enables Mark Contacted → VIN status sync. See `docs/evidence/put-header-probe-results.json` for probe evidence.

### 10.5 VAPI Analytics vs Local Computation

VAPI Analytics API (`POST /analytics`) provides server-side aggregated metrics (sum, avg, count, min, max with groupBy and time-bucketed trends). Prefer this over computing aggregations from individual call records.

### 10.6 Tavus Cost Data

Tavus API does not expose cost data. Voice AI costs come from VAPI; video AI cost tracking requires Tavus billing API (not available) or manual rate application ($0.20/min cost).

### 10.7 Express Route Ordering

Parameterized routes (`:param`) must come AFTER static routes at the same path level. Express matches in definition order.

### 10.8 PostgreSQL Notes

- `VARCHAR` columns require `::VARCHAR` cast in parameterized CASE expressions (avoids `42P08` error)
- `postgres` role bypasses RLS as table owner
- Connection ports: 5432 for direct/migration, 6543 for pooler (pgbouncer)

---

## 11. Non-Functional Requirements

### 11.1 Performance

| Metric | Target |
|--------|--------|
| Page load time | <3 seconds |
| API response time | <500 milliseconds (p95) |
| Dashboard data refresh | <1 minute cache window |
| Chat AI response (first token) | <3 seconds |
| Widget load time | <1.5 seconds |
| Trigger notification delivery | <60 seconds from event |
| VIN API query | <5 seconds |

### 11.2 Security

- **RLS:** Row-level security on all tables via `SecureQueryBuilder` with `current_setting('app.current_org_id')`
- **Authentication:** JWT with proper expiry (access: 15 minutes, refresh: 7 days)
- **RBAC:** 4-tier role enforcement on every API endpoint (level stored as integer 1-4)
- **Credentials:** AES-256 encrypted storage for OAuth tokens and API keys
- **Input validation:** All endpoints validate input (type checking, length limits, sanitization)
- **Parameterized queries:** No SQL injection vectors (enforced via SecureQueryBuilder)
- **Multi-tenant isolation:** Database-level enforcement via organization_id FK + RLS
- **Audit logging:** Sensitive operations logged (user creation, role changes, integration config, data exports)
- **Webhook security:** VAPI via assistantId/metadata lookup, Tavus via HMAC signature verification
- **Widget security:** Domain whitelist enforcement via CORS, rate limiting (100 interactions/hour/visitor)

### 11.3 Reliability

- Error handling on all API calls with contextual logging (endpoint, version, response body)
- Retry logic for transient failures (sync_queue uses exponential backoff: base 30s, max 3 attempts)
- Idempotency guards (e.g. `notification_sent` atomic UPDATE...RETURNING on `vapi_call_logs`)
- Graceful degradation: VIN API failure falls back to cached data (logged, not silent)
- Test call filtering: `test-e2e-*` IDs excluded from production metrics and notifications
- Recording retention: daily cron at 2:00 AM nullifies expired recording URLs (30-day VAPI/Tavus retention)

### 11.4 Testing

**Quality Gates (must pass before any deployment):**
1. `npm run check` -- TypeScript compilation and lint
2. `npm run build` -- Production build succeeds
3. `npx playwright test` -- E2E suite passes

**Test Coverage Targets:**
- Backend: 80% code coverage
- Frontend: 70% component coverage
- E2E: All critical user flows
- Flaky rate: <2%

**Current State:** ~1,699 E2E tests across 50 Playwright spec files.

### 11.5 Database

- 36 tables with 53 RLS policies across 28 tables
- 28+ migrations applied to production
- Supabase (PostgreSQL) with pgbouncer connection pooling
- `SecureQueryBuilder` enforces org context on every query
- `systemQuery` requires mandatory audit justification string
- RLS context derived from authenticated user's JWT: `user_id`, `organization_id`, `role_id`, `permissions`

---

## 12. Economics

| Service | Customer Rate | Platform Cost | Margin |
|---------|--------------|---------------|--------|
| Voice AI (VAPI) | $0.25/min | $0.15/min | 40% |
| Video AI (Tavus) | $0.32/min | $0.20/min | 37.5% |
| SMS (TextMagic) | $0.05/msg | $0.02/msg | 60% |

Credit tracking is wired to webhooks (implemented in Phase 6). `CreditService` tracks usage per organization. Service quotas tracked in `service_quotas` and `service_allocations` tables with alerts at 80% usage.

---

## Appendix A: Actionable Triggers (Current Access)

These triggers are actionable today with available API access:

| Trigger | Data Source | Action |
|---------|------------|--------|
| Lead aging > threshold (e.g. 48h in NEW) | VIN `/leads` -> `createdUtc` + `leadGroupCategory` = NEW | Flag for follow-up, notify manager, trigger AI outbound call |
| Hot lead detected | VIN `isHot` = true | Priority notification to assigned salesperson |
| Lead on showroom with no activity | VIN `isOnShowroom` = true | Alert floor manager for immediate engagement |
| Lead status regression (CONTACTED -> WAITING) | VIN status change detection via polling | Re-engagement trigger |
| Pipeline volume drop below threshold | VIN trend analysis | Alert management, suggest marketing action |
| High loss rate spike | VIN LOST count trend | Root cause investigation trigger |
| New lead without AI contact in X minutes | VIN (new) + VAPI (no matching call) | Trigger outbound AI call via VAPI |
| AI call with successful evaluation | VAPI `analysis.successEvaluation` = "true" | Auto-create follow-up task, notify salesperson with summary |
| AI call ended by voicemail | VAPI `endedReason` = voicemail | Schedule retry call at different time |
| Lead interested in specific vehicle | VIN vehicles of interest -> make, model | Auto-send targeted info via SMS/email |
| High-value trade-in detected | VIN `tradeVehicles` with pricing | Priority notification -- trade-in leads convert higher |
| Video session completed | Tavus `status` = ended | Create follow-up lead if new customer, notify salesperson |
| AI call transfer to human | VAPI `artifact.transfers` | Alert on-duty salesperson for immediate pickup |

**Cannot trigger (blocked):**
- Follow-up based on communication gaps (need `/communication`)
- Task completion reminders (need `/tasks`)
- Appointment no-show follow-up (need `/appointments`)

## Appendix B: Items Requiring New Development

| Item | Description | Blocked? |
|------|-------------|----------|
| DealerBrain blocked data awareness | System prompt update with available vs blocked endpoint list | No |
| 20 role-specific combined metrics | Cross-platform metrics per Section 8.3 | No |
| SMS AI routing | After-hours -> AI, business hours -> human | No |
| SMS collision avoidance | AI vs human conversation state tracking (AI_ACTIVE / HUMAN_ACTIVE / DORMANT) | No |
| Agent performanceMetrics wiring | Connect `updatePerformanceMetrics` to VAPI call-ended + Tavus conversation-ended webhook events | No |
| Mark Contacted -> VIN status update | Write lead status change back to VIN CRM | No |
| Activity feed CSV export | Export activity feed data to CSV | No |
| Vendor name removal (5 leaks) | Replace "Tavus", "VAPI" with "Video Agent", "Voice Agent" in UI | No |
| Source label removal from UI | Remove all source attribution labels from user-facing views | No |
| Metrics consolidation | Unify ~15-17 metrics from 5 fragmented services into single engine | No |
| VAPI Analytics API integration | Replace local computation with server-side aggregations from POST /analytics | No |
| VAPI cost/analysis field capture | Store `cost`, `costBreakdown`, `analysis.successEvaluation` from webhook payloads in vapi_call_logs | No |
| Contact deduplication before lead creation | Search contacts before creating leads | Yes (403 on `/gateway/v1/contacts`) |
| Communication gap analysis | Measure response time and follow-up frequency | Yes (403 on `/gateway/v1/communication`) |
| Human activity tracking | CRM activity, tasks, notes | Yes (403 on `/gateway/v1/activity`, `/tasks`, `/notes`) |
| Appointment tracking | Show rates, AI-booked vs manual | Yes (403 on `/gateway/v1/appointments`) |
| Deal/close tracking | Deal values, gross profit, conversion | Yes (403 on `/gateway/v1/deals`) |
| Inventory matching | Real-time inventory-to-demand | Yes (403 on `/gateway/v1/inventory`, `/vehicles`) |

## Appendix C: Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React 18 + TypeScript (strict) + Tailwind CSS + shadcn/ui |
| Routing | Wouter |
| Data fetching | TanStack Query |
| Backend | Node.js + Express + TypeScript |
| Database | Supabase (PostgreSQL) with Row-Level Security |
| AI | Claude API (DealerBrain/Automa), streaming SSE via DealerBrainStreamingService |
| Voice | VAPI (master API key, org-specific assistants, webhooks) |
| Video | Tavus (master API key, org-specific personas, HMAC webhooks) |
| SMS | TextMagic (per-org phone numbers, two-way via inbound webhook) |
| Email (notifications) | Resend |
| Email (inbox) | IMAP/SMTP |
| Calendar | Google Calendar OAuth2 |
| CRM | VIN Solutions Lead Management API (OAuth2 Client Credentials) |
| Testing | Playwright (E2E, ~1,699 tests), Jest + React Testing Library (unit) |
| Deployment | PM2 on Oracle Cloud, `./deploy.sh` from master branch |
| Monitoring | Credit tracking via CreditService, service quotas via service_quotas table |

## Appendix D: Cross-Platform Data Flow Summary

```
                    VIN Solutions API
                    (13 endpoints, v1/v3/gateway)
                           |
                    [Query + Lead Creation]
                           |
    VAPI ----webhook----> NEXXUS <----webhook---- Tavus
    (15 endpoints)     [Context Router]        (10 endpoints)
                     [SecureQueryBuilder]
                      [36 tables, RLS]
                           |
                    +--------------+
                    |   Frontend   |
                    | (React/Vite) |
                    +--------------+
                    |              |
              Classic Dashboard   Next Dashboard
              (all roles)        (role-based routing)
```

## Appendix E: Document History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2026-02-18 | Complete rewrite from validated evidence: API probe results, locked acceptance criteria, brain dump, and codebase state. Incorporates all locked decisions from stabilization preflight. |
| 1.0 | 2026-02-16 | Initial Master SRS -- consolidated from SRS v3.0, v3.1, v3.2, brain dump, and 20 clarification answers |

### Superseded Documents
- `docs/MASTER_SRS.md` v1.0 (2026-02-16)
- `docs/archive/pre-stabilization/SYSTEM_REQUIREMENTS_SPECIFICATION_v3.0.md`
- `docs/archive/pre-stabilization/Nexxus_SRS_Addendum_v3.1_MVP_Critical.md`
- `docs/archive/pre-stabilization/Nexxus_SRS_Addendum_v3.2_Widget_SMS_Notifications.md`
- All other archived specification documents

### Governing Document Chain
1. `docs/CONSTITUTION.md` -- Platform identity and development rules
2. `docs/MASTER_SRS.md` -- This document (what the system should be)
3. `docs/CURRENT_STATE_ASSESSMENT.md` -- What actually exists (honest diff)
4. `docs/IMPLEMENTATION_PLAN.md` -- What to build next (phased, dependency-ordered)

---

*This document consolidates findings from: user brain dump (2026-02-16), locked acceptance criteria (2026-02-18), live API probe results (2026-02-18), data access analysis (2026-02-18), and validated codebase state. It supersedes all prior SRS versions, addendums, and archived specifications.*
