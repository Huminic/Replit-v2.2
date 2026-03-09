# Nexxus Connect — Implementation Plan

**Version:** 4.0
**Date:** 2026-03-09
**Status:** Functional Area Walkthrough — all waves complete, now validating by feature area
**Cross-References:** [PRD.md](./PRD.md) | [SRS.md](./SRS.md) | [SPEC.md](./SPEC.md) | [ACCEPTANCE_CRITERIA.md](./ACCEPTANCE_CRITERIA.md) | [CLAUDE.md](./CLAUDE.md)

---

## Current Work Mode: Functional Area Walkthrough

Instead of wave/sprint-based work, remaining validation and implementation is organized into **6 functional areas**. Each area is reviewed against its acceptance criteria before any code work begins.

### Functional Areas and Sub-topics

**Area 1: UI and Chat** (21 ACs: AC-06-A/B/C/D, AC-07-A/B/C, AC-CH-A/B, AC-NAV-A through J)
- 1a. Settings and knowledge — Chat-specific: persona name config, knowledge documents, CRM Guru data sources
- 1b. Chat — Core chat flow: sending messages, streamed responses, conversation persistence
- 1c. Chat quality — Response accuracy, correct data usage, appropriate tone
- 1d. Chat bubbles — Visual presentation: user/AI bubbles, thinking cards, timestamps
- 1e. Special chat features — CRM Guru mode, artifacts (data reports only), hunch-influenced prompting
- 1f. Menu and nav look and feel — Sidebar, submenu lock/popout/auto-revert, nav items per role, Coming Soon

**Area 2: Communications** (12 ACs: AC-05-A/B/C/D/E/F, AC-10-A/B/C/D, AC-KS-A/B)
- 2a. Settings and knowledge — Communication gate config, channel toggles, kill switch behavior
- 2b. New account/reset account — User invitation, password reset via Resend
- 2c. SMS (Serra Honda only) — TextMagic delivery, two-way SMS in TeamBox, agent auto-greeting
- 2d. Service Campaigns — Campaign creation, CSV upload, execution, kill switch per campaign
- 2e. Notifications — Activity feed, notification delivery and display

**Area 3: Agents and Triggers** (9 ACs: AC-HF-A/B/C/D, AC-TB-A/B, AC-EF-A/B/C)
- 3a. Settings and knowledge — Agent config (name, department, personality, auto-greeting template)
- 3b. Trigger handling — What fires outbound actions, trigger logging, rate limiting
- 3c. Agent review — Reviewing agent conversations, escalation handling in TeamBox
- 3d. Special prompting — Hunch filter (accept/dismiss/resolve), hunches feeding into AI prompt

**Area 4: One-off Lead Handling (Communications Agent)** (14 ACs: AC-02-A/B/C/D, AC-04-A/B/C/D, AC-08-A/B, AC-09-A/B/C/D)
- 4a. Agent handling — How the communications agent routes one-off leads
- 4b. Widgets and hosted page — 4-channel widget, landing page at `/p/[slug]`
- 4c. Embed flow — Embed code generation, widget on external sites
- 4d. VAPI Lead Flow — Voice handoff, appointment creation, VIN insertion (2-step + escalation)
- 4e. Tavus Lead Flow — Video handoff, appointment creation, VIN insertion

**Area 5: System/Settings** (5 ACs: AC-03-A/B/C/D/E)
- 5a. Uploads — File upload handling, knowledge base document management
- 5b. General settings — Org settings page, calendar connectors config
- 5c. Hunches — Hunch display on Management page, accept/dismiss/resolve workflow

**Area 6: Metrics (Display and Connection)** (3 ACs: AC-01-A/B/C)
- 6a. Metrics true and correct — Pipeline accuracy, appointment counts, VIN data alignment
- 6b. Filtering and updates — Date range filtering, org switching, data refresh
- 6c. Insights vs dash vs homepage — Same metric shows same number everywhere
- 6d. Reports — Insights reports tab, export/generation

### Workflow Per Area
1. Review the area's ACs and current state together
2. Identify gaps and discuss expected outcomes
3. Implement and test
4. Verify all ACs pass before moving to next area

See `replit.md` for detailed per-area status, key files, and AC-to-subtopic mapping.

---

## Historical Wave Reference

The wave structure below documents how the platform was built. All waves through Wave 4 are complete (~92%). Wave 5 is deferred.

### Wave Summary

| Wave | Theme | Duration | Status |
|------|-------|----------|--------|
| Wave 0 | Setup & UI Prototype | 2 weeks | **Complete** |
| Wave 1 | API Wiring & Data Sources | 3 weeks | **Complete** |
| Wave 2 | AI Chat, User CRUD, File Uploads, Metrics | 3 weeks | **Complete** |
| Wave 3 | Outbound Engine, Webhooks, Intelligence | 2 weeks | **Complete** |
| Wave 3.5 | Data Warehouse & Context Router | 1 week | **Complete** |
| Wave 3.6 | Outbound Live Wiring & Safety Controls | 1 day | **Complete** |
| Wave 4 | Platform Completion: Landing Pages, Widgets, Metrics, Inbound SMS, Error Handling | 1 week | **Complete** |
| Wave 5 | Google Calendar, Production Backend Cutover | TBD | **Deferred** |

---

## 2. Wave 1 -- UI Prototype & Navigation Restructure

**Goal:** Restructure navigation from feature-based (Main/Insights/Agents/Hub/Drive) to persona/department-based (AI Chat/TeamBox/My Work/Sales/Service/Marketing/Management). Build all page shells with mock data. Establish the complete visual contract.

**Status:** Complete

### 2.1 Completed Items

| Item | Description | Files |
|------|-------------|-------|
| Sidebar navigation | Replaced menu items with AI Chat, TeamBox, My Work, Sales, Service, Marketing, Management, System | `Sidebar.tsx` |
| Route structure | Added routes for `/teambox`, `/my-work`, `/sales`, `/service`, `/marketing`, `/management` | `App.tsx` |
| SubMenuManager rewrite | Panel cases for all new sections with nav items, agent lists, search | `SubMenuManager.tsx` |
| AI Chat page | Main page with role-based metric tiles, thinking cards, persona name from org config | `main.tsx` |
| TeamBox page | CommBox-inspired 3-column layout: filters, conversation list, chat thread, customer info panel | `teambox.tsx` |
| Sales page | Dashboard with 7 metric tiles, Agents tab with agent cards, Insights/Calendar placeholders | `sales.tsx` |
| Service page | Dashboard with 6 metric tiles, Agents tab, Campaigns tab with table and kill switch, Insights/Calendar | `service.tsx` |
| Marketing page | Dashboard with 4 metric tiles, Agents tab, Campaigns tab with table and kill switch, Studio placeholder, Insights | `marketing.tsx` |
| Management page | Dashboard with 6 KPI tiles, Hunches tab with AI pattern cards, Activities tab, ROI placeholder | `management.tsx` |
| My Work page | Personal dashboard, task list, chat/assistant placeholders | `my-work.tsx` |
| Mock data: conversations | TeamBox conversation mock data with channels, statuses, messages | `mocks/conversations.ts` |
| Mock data: campaigns | Campaign mock data with messages, CSV references, kill switch state | `mocks/campaigns.ts` |
| Mock data: agents | Agents tagged by department (sales/service/marketing) | `mocks/agents.ts` |
| AppContext updates | Persona name, communication gate, panel IDs, favorites, selectedAgent | `AppContext.tsx` |
| RBAC gating | Section access by role, sidebar item visibility, settings tile visibility | `users.ts`, `Sidebar.tsx` |
| Widget configuration | Table layout with embed codes, search, widget type cards, accordion config | `settings.tsx` |
| Landing page | Simplified `/w/demo` route | `widget-landing.tsx` |
| Campaign kill switch | Per-campaign toggle in Service and Marketing campaigns tabs | `service.tsx`, `marketing.tsx` |
| Communication gate | Global toggle in Settings to pause all outbound automated communications | `settings.tsx`, `AppContext.tsx` |
| Right pane rules | Chat-center pages get info pane; data-center pages get Automa chat pane | `AppLayout.tsx`, `RightPane.tsx` |
| Settings: full sections | Users, Organization, Tools, Knowledge, AI Config, Security, Notifications, Data, Appearance, Billing | `settings.tsx` |
| Profile page | Personal info, preferences, billing tabs | `profile.tsx` |
| Billing management | Dedicated billing page at `/settings/billing` | `billing-management.tsx` |
| Org wizard | Organization creation wizard at `/settings/org-wizard` | `org-wizard.tsx` |
| Removed features | Drive, standalone Activity, standalone Agents creation, Skills standalone | Cleanup pass |

### 2.2 Active Work

| Item | Description | Status |
|------|-------------|--------|
| Documentation suite | CLAUDE.md, PRD.md, SRS.md, SPEC.md, PLAN.md, ACCEPTANCE_CRITERIA.md | Complete |
| Screenshot validation | Visual regression screenshots across roles, themes, viewports | Complete (E2E tests) |
| replit.md update | Reflect v2.2 navigation and architecture | Complete |
| Automa→personaName fix | Replaced all hardcoded "Automa" with dynamic personaName from org config | Complete |
| Codebase cleanup | Removed attached_assets/ (85MB), plan_docs/ (260KB), docs/ (8KB), fixed dangling refs | Complete |
| Auth file extraction | Login, forgot/reset password, AuthContext, ProtectedRoute from v2.1 zip (not wired yet) | Complete |
| Real agent data | 5 Serra Auto Group agents with VAPI+Tavus, channels[], dealership fields | Complete |

### 2.3 Wave 1 Completion Criteria

- [x] All 7 sidebar sections render with correct icons and RBAC gating
- [x] All section pages render their dashboards with metric tiles
- [x] Tab switching works within all section pages
- [x] TeamBox 3-column layout renders with conversation list, chat thread, customer info
- [x] Campaign tables render in Service and Marketing with kill switch toggles
- [x] Communication gate toggle visible in Settings
- [x] Right pane content follows cardinal layout rules (chat-center vs data-center)
- [x] Role switcher changes metric tiles on AI Chat page and hides/shows sidebar items
- [x] Sub-menu panels show correct nav items for each section
- [x] Widget configuration table and accordion sections render in Settings
- [x] No console errors, no broken imports, no dead routes
- [x] Documentation suite complete and internally consistent
- [x] replit.md updated to reflect current state

---

## 3. Wave 2 -- Backend Foundation & Core API Wiring

**Goal:** Establish authentication, database schema, and wire core CRUD operations to replace mock data with real API calls.

**Status:** In Progress (Phase 1 Complete)

### 3.1 Completed Items (Phase 1: Schema, Auth & API Foundation)

| Item | Description | Files |
|------|-------------|-------|
| Database schema | 8 tables: roles, organizations, users, sessions, agents, conversations, messages, campaigns with kill switch columns | `shared/schema.ts` |
| Database storage | Drizzle ORM DatabaseStorage with full CRUD for all tables | `server/storage.ts` |
| Seed data | 8 roles, 3 orgs (Serra Honda/Nissan/Ford), 8 users, 5 agents, sample data. Default login: admin@nexxus.com / password123 | `server/seed.ts` |
| JWT authentication | Access (15min) / refresh (7d) tokens, authenticateToken middleware, requireRole middleware | `server/auth.ts` |
| Auth API routes | POST login/logout/refresh/switch-org/forgot-password/reset-password, GET me | `server/routes.ts` |
| CRUD API routes | Agents (CRUD), organizations (read/update), users/me (read/update), conversations (list/messages), campaigns (list/update) | `server/routes.ts` |
| Frontend auth wiring | AuthProvider wraps app, ProtectedRoute guards app routes, login/forgot/reset as public routes, SessionTimeoutDialog integrated | `App.tsx` |
| AppContext bridge | Auth user maps to AppContext types, real agents/org loaded via TanStack Query, mock fallback preserved | `AppContext.tsx` |
| Bearer token injection | queryClient.ts injects Authorization header from localStorage on all API calls | `queryClient.ts` |
| Kill switch columns | outbound_enabled/sms_enabled/phone_enabled/email_enabled on organizations, kill_switch on campaigns, campaign_disconnected on conversations | `shared/schema.ts` |

### 3.2 Remaining Items (Phase 2: Deferred to Wave 3)

| Item | Description | Dependencies |
|------|-------------|--------------|
| RLS & multi-tenancy | Row-level security policies for full tenant isolation | Schema |
| Chat API streaming | SSE streaming for AI responses via Claude | Auth |
| Chat history persistence | Store chat messages in database | Chat API |
| Campaign CRUD API | Full campaign lifecycle with CSV upload | Auth |

### 3.3 Wave 2 Completion Criteria

- [x] Login/logout flow works end-to-end
- [ ] RLS policies enforce tenant isolation (deferred to Wave 3)
- [x] Agent list loads from API
- [ ] AI chat streams responses via SSE (deferred to Wave 3)
- [ ] Chat history persisted in database (deferred to Wave 3)
- [x] User profile edits save to database
- [x] Settings visibility matches authenticated role
- [x] Organization data flows from API (not mock)
- [x] Kill switch backend columns exist
- [ ] Consolidated DB schema doc covers all 53 tables (deferred — production backend reference)
- [ ] API contract doc covers all endpoints (deferred — production backend reference)

---

## 4. Wave 3 -- Outbound Engine, Webhooks & Intelligence (COMPLETE)

**Goal:** Build outbound communication engine, real notifications/activity feeds, VAPI webhook, and AI intelligence engine.

**Status:** Complete (Sprint 3.1-3.3, completed 2026-03-06)

### 4.1 Completed Items

| Item | Description | Status |
|------|-------------|--------|
| Outbound engine | Comm gate (5-layer check), kill switch, rate limiting, template substitution | Done |
| Campaign execution | Start/stop/dry-run with setInterval processing, progress tracking UI | Done |
| Notifications system | Real bell count (15s poll), mark-read, triggered by user/campaign/comm events | Done |
| Activity log | Management feed with real events, fire-and-forget logging | Done |
| VAPI webhook | Read-only receiver, creates TeamBox conversations + notifications from calls | Done |
| AI hunches | Claude-powered insight generation, accept/dismiss/resolve lifecycle | Done |
| Hunch chat filter | Accepted hunches injected into AI chat prompt context | Done |
| SMS/email stubs | Stub functions ready for TextMagic/Resend when API keys arrive | Done |

### 4.2 Wave 3 Completion Criteria

- [x] Comm gate blocks sends when org/channel disabled
- [x] Campaign kill switch stops execution mid-run
- [x] Rate limit enforced (3 messages/24h per customer)
- [x] Dry run mode logs without sending or mutating recipient status
- [x] VAPI webhook creates conversations (read-only, no VAPI write-back)
- [x] TopBar bell shows real notification count
- [x] Management activity feed shows real logged events
- [x] AI hunches generate via Claude with confidence scoring
- [x] Accepted hunches influence AI chat responses

---

## 5. Wave 3.5 -- Data Warehouse & Context Router (NEXT)

**Goal:** Build the local data warehouse, implement tiered sync from VinSolutions, add data source attribution to all warehoused data, build the context router for AI chat provenance, and memorialize insights over time.

**Status:** Next — prerequisite for correct metrics, AI data access, and data provenance

### CRITICAL ARCHITECTURE CONSTRAINT

VinSolutions integration is **Lead Management tier** — NOT a sync-level integration.
- **Can**: Query/pull data on demand via MCP proxy
- **Cannot**: Do wholesale two-way synchronization
- **Cannot**: Write data back to VinSolutions (deferred until write API access granted)
- **Result**: Platform maintains a **forked local data store** (data warehouse) with its own copy of CRM data

### 5.1 Tiered Sync Strategy

| Tier | Frequency | Scope | Purpose |
|------|-----------|-------|---------|
| **Historical Backfill** | Once | All accessible VinSolutions data | Populate data warehouse (they said 48h lookback but we've accessed more — take everything available) |
| **Daily Delta** | Once/day (overnight) | Yesterday's changes | Incremental updates — query VinSolutions for records modified in last 24h, upsert into warehouse |
| **Metrics Refresh** | Every 4 hours (business hours 8am-6pm) | Dashboard KPIs only | Real-time enough for decisions — lightweight aggregation refresh |

**NOT real-time** except for leads originating from Nexxus tools (VAPI calls, chat widgets, etc.)

### 5.2 Data Source Attribution

Every piece of data in the warehouse is tagged with its origin.

| Source Tag | Origin | Examples |
|------------|--------|----------|
| `vin_solutions` | CRM queries via MCP proxy | Leads, contacts, deal statuses |
| `vapi` | Call transcripts/events via webhook | Inbound call records, transcripts |
| `tavus` | Video interactions | Video session data |
| `uploaded` | Manual CSV/file imports | Campaign recipients, custom lists |
| `computed` | Derived metrics/insights | AI hunches, aggregated KPIs |
| `nexxus` | Platform-generated | Conversations, tasks, notifications |

Schema pattern for all warehoused tables:
```
dataSource    text NOT NULL DEFAULT 'nexxus'    -- origin tag
sourceId      text                              -- original ID from source system
syncedAt      timestamp                         -- when last synced from source
```

### 5.3 Context Router (AI Chat Data Provenance)

When AI chat answers questions that reference data, it must state provenance:
- "Based on VinSolutions data from 2 hours ago..."
- "Based on your uploaded metrics from March 1..."
- "Based on call data from VAPI received today..."
- "I don't have VinSolutions data for that — the last sync was 6 hours ago"

Implementation:
1. Register VinSolutions MCP tools in AI chat endpoint (currently only has `webSearchTool`)
2. Update system prompt with provenance instructions
3. Add source/freshness labels to all context injections (hunches, KB docs, agent context)
4. Track `lastSyncedAt` per data source, surface staleness in AI responses

### 5.4 Insight Memorialization

Hunches/insights are not just point-in-time — they are memorialized for historical trend analysis.
- Add `hunchBatchId` to group hunches from the same generation run
- Each generation creates new records (additive, never mutates existing)
- Historical comparison: "what changed since last generation?"
- Track insight evolution over time (confidence shifts, recurring patterns)

### 5.5 Sprint Breakdown

#### Sprint W3.5a — Warehouse Schema & Historical Backfill
- Design warehouse tables: `warehouse_leads`, `warehouse_contacts`, `warehouse_activities`
- Add `dataSource`, `sourceId`, `syncedAt` columns
- Build sync service with historical backfill (pull all available VinSolutions data)
- Log sync events to activity_log
- Files: shared/schema.ts, server/storage.ts, server/sync.ts (new)

#### Sprint W3.5b — Daily Delta & Metrics Refresh
- Build daily delta sync (query changes from last 24h, upsert)
- Build business-hours metrics refresh (every 4h during 8am-6pm)
- Dashboard tiles pull from warehouse instead of live VinSolutions queries
- Sync failure notifications for admins

#### Sprint W3.5c — Context Router & AI Data Access
- Register VinSolutions MCP tools in AI chat endpoint
- Update system prompt with data provenance instructions
- Add source/freshness labels to context injections
- Add `hunchBatchId` to hunches for generation grouping
- Build historical comparison endpoint for insights

### 5.6 Wave 3.5 Completion Criteria

- [ ] Warehouse tables exist with source attribution columns
- [ ] Historical backfill pulls all available VinSolutions data
- [ ] Daily delta sync updates warehouse incrementally
- [ ] Metrics refresh runs every 4h during business hours
- [ ] Dashboard tiles read from warehouse (not live VinSolutions)
- [ ] AI chat states data provenance in responses
- [ ] AI chat can query VinSolutions data via MCP tools
- [ ] Hunches grouped by batch for historical comparison
- [ ] Sync failures create admin notifications
- [ ] All warehoused data carries source tags

### 5.7 Dependencies & Blockers

| Dependency | Status | Impact |
|------------|--------|--------|
| VinSolutions probe file | Awaiting from user | Determines which metrics are actually available |
| VinSolutions write API | NOT available | All write-back deferred |
| MCP server access | Working via `VINSOLUTIONS_API_KEY` | No blocker |
| TextMagic/Resend keys | Not needed for this wave | Outbound already stubbed |

---

## 6. Wave 4 -- Phone Outbound, Reporting, Admin Polish, Error Handling

**Goal:** Complete remaining feature gaps: phone outbound via VAPI, reporting/export, admin UI polish, error handling, mock data removal, and deeper Tavus integration.

**Status:** Complete

### 6.1 Completed Items

| Item | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| Inbound SMS webhook | POST /api/webhooks/textmagic — stores messages, creates conversations, notifies admins | Wave 3.6 | **Complete** |
| Landing page serving | Public /p/:slug route serves dynamic landing pages from org config | Wave 2 Widgets | **Complete** |
| Widget embed codes | Generate working embed codes pointing to this Replit; public config endpoint | Wave 2 Widgets | **Complete** |
| Widget JS loader | GET /widget/nexxus-widget.js — embeddable iframe loader with CORS | Wave 2 Widgets | **Complete** |
| Metrics consistency | Canonical pipeline metrics across AI Chat, Sales, Management dashboards (AC-01-A) | Wave 3.5 Warehouse | **Complete** |
| Admin polish | Org invite flow with Resend email, settings persistence (notifications, appearance) | Wave 2 Auth | **Complete** |
| Error boundaries | React ErrorBoundary wrapping app, global 401 handler, session refresh | All | **Complete** |
| Mock data audit | No mock imports in production pages; sample data banner on analytics | All APIs | **Complete** |
| TextMagic SMS sends | Real SMS via X-TM-Key REST API | Wave 3.6 | **Complete** |
| Resend email sends | Real email from notifications@huminic.ai | Wave 3.6 | **Complete** |
| 4-layer safety stack | Global → org → channel → rate limit outbound safety | Wave 3.6 | **Complete** |

### 6.2 Wave 4 Completion Criteria

- [x] Inbound SMS webhook stores messages and creates notifications
- [x] Settings sections use backend data (not local state)
- [x] Error boundaries catch and display errors gracefully
- [x] Widget embed codes generate and work when pasted in HTML
- [x] Landing pages serve from org config (/p/:slug)
- [x] Canonical pipeline metrics consistent across all dashboards
- [x] Org invite flow sends email and creates user

### 6.3 Deferred to Wave 5 or Future

| Item | Description | Reason |
|------|-------------|--------|
| Phone outbound via VAPI | Wire sendPhone() to VAPI outbound calls | Per user: no VAPI changes |
| Tavus deeper integration | Video session webhook with HMAC | Per user: no Tavus changes |
| RLS policies | Row-level security for multi-tenant isolation | Production hardening |
| API rate limiting | 100 req/min per user | Production hardening |
| Full Zod validation | All request bodies validated | Production hardening |
| Full E2E Playwright suite | Complete test coverage | Ongoing |
| Reporting & export | CSV/PDF export for analytics | Production backend dependent |

---

## 7. Wave 5 -- Google Calendar & Production Backend Cutover (Deferred)

**Goal:** Integrate Google Calendar for appointment scheduling and swap data source from Replit prototype to production backend at nexxusv2.huminicdev.com. Requires credentials and API contract alignment from client.

**Status:** Deferred to end

### 7.1 Planned Items

| Item | Description | Dependencies |
|------|-------------|--------------|
| Calendar integration | Google Calendar OAuth for appointment scheduling | OAuth credentials from client |
| Production backend cutover | Swap API data source to nexxusv2.huminicdev.com | API contract alignment |
| Performance testing | API p95 < 200ms, LCP < 2.5s | All features |
| Security audit | Final security review before production | All features |

---

## 8. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| VIN Solutions API access limited (17/30 endpoints blocked) | Cannot display full pipeline data | Confirmed | Use accessible endpoints only (leads, contacts, statuses, sources). Be transparent about data boundaries. |
| Claude API rate limits during hunch generation | Delayed hunch delivery | Medium | Queue-based generation with retry logic, weekly batch instead of real-time |
| SSE streaming complexity | Chat features delayed | Low | Start with polling fallback, upgrade to SSE |
| RLS variable name mismatch (`current_organization_id` vs `current_org_id`) | Potential cross-tenant data leak | Confirmed (known bug) | Fix SecureQueryBuilder to use correct variable name in Wave 2 |
| Excel upload records polluting metrics | Inflated numbers in dashboards | Confirmed (known bug) | Always exclude `source = 'excel_upload'` from lead queries |
| Live VAPI/Tavus webhooks in production | Breaking existing customers | High impact | Preserve existing handler logic, test via Elliot agent only, never modify without approval |
| SET LOCAL without transaction | Connection pool contamination | Medium | Wrap all RLS set operations in proper transactions in Wave 2 |

---

## 9. Testing Protocol

### Per-Wave Requirements

- **Wave 1:** Visual regression screenshots across 4 roles, 2 themes (light/dark), 3 viewports (desktop, tablet, mobile). All pages navigable without errors.
- **Wave 2:** API integration tests for all CRUD endpoints. Auth flow E2E test. RLS isolation verification.
- **Wave 3:** Metric computation verification against known test data. VIN sync correctness tests. Hunch generation quality checks.
- **Wave 4:** Full E2E Playwright suite. Security audit. Performance benchmarks. Three proofs per feature (config, functional, visual).

### Test Data Rules

- SMS testing: TextMagic API loopback (send to self)
- Email testing: Use `neoweaver@gmail.com` for all outbound
- Voice testing: Use "Elliot" test-only VAPI agent
- Video testing: Test sessions only, never production Tavus sessions
- Lead data: Exclude `source = 'excel_upload'` from all queries

---

## 10. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-03 | Restructure nav from feature-based to department-based | Better matches dealership organizational structure and user mental models |
| 2026-03-03 | Remove Drive as standalone feature | Artifacts generated by AI stored contextually, not in a separate file system |
| 2026-03-03 | Remove standalone Agent creation for non-Super Admin | Agent config is an admin function, not a daily workflow for staff |
| 2026-03-03 | Add campaign kill switch UI | Direct response to spam incident -- users need immediate control over outbound communications |
| 2026-03-03 | Add global communication gate | Master toggle to prevent ALL automated outbound -- safety net for the organization |
| 2026-03-03 | Nest agents within department sections | Agents belong to departments (sales/service/marketing), not a standalone global list |
| 2026-03-03 | TeamBox as dedicated CommBox-inspired page | Unified inbox for all customer conversations across channels, replacing fragmented inbox |
| 2026-03-03 | Marketing Studio as Wave 4 placeholder | Video/image/podcast creation is a future capability |
| 2026-03-04 | Expand RBAC from 4 to 8 roles | Department-specific roles (sales, service, marketing) + executive and sales_manager replace generic org_staff |
| 2026-03-04 | Add kill switch backend spec to Wave 2 | DB columns + MCP enforcement required before any outbound wiring |
| 2026-03-06 | VinSolutions is Lead Management tier, not sync | Cannot do wholesale two-way sync. Platform maintains forked local data store |
| 2026-03-06 | Three-tier sync strategy | Historical backfill (once), daily delta (overnight), metrics refresh (4h during business hours) |
| 2026-03-06 | Data provenance required in AI chat | AI must state data source and freshness when referencing data |
| 2026-03-06 | Context Router architecture | Data warehouse aggregates multi-source data (VinSolutions, VAPI, Tavus, uploaded) with preserved provenance |
| 2026-03-06 | Insight memorialization | Hunches tracked over time for historical trend analysis, not just point-in-time snapshots |
| 2026-03-06 | Insert Wave 3.5 before Wave 4 | Data warehouse is prerequisite for correct metrics and AI data access — must build before final polish |
| 2026-03-06 | 4-layer outbound safety stack | Global env kill switch > org gate > per-channel toggles > campaign rate limiting. Defense in depth. |
| 2026-03-06 | Defer Calendar & production cutover to Wave 5 | Requires Google OAuth credentials and API contract alignment — save for end |
