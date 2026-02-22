# Nexxus Connect™ — Modular Implementation Plan v2.1

**Version:** 2.1
**Date:** 2026-02-21
**Status:** GOVERNING DOCUMENT — Sprint-based development plan
**Cross-References:** [NEW_CONSTITUTION.md](./NEW_CONSTITUTION.md) · [NEW_SRS.md](./NEW_SRS.md) · [NEW_CLAUDE.md](./NEW_CLAUDE.md) · [ACCEPTANCE_CRITERIA.md](../ACCEPTANCE_CRITERIA.md)

---

## 1. Plan Architecture

### 1.1 Design Principles

This plan is structured for **modular, parallel development** — not monolithic sequential execution. Each module is independently buildable by a separate team/agent, with clearly defined interfaces, dependencies, and verification criteria.

### 1.2 Module Independence Rules

1. Each module owns specific database tables, API endpoints, and UI pages
2. Modules communicate only through defined API contracts (never direct DB access across module boundaries)
3. Shared infrastructure (auth, RLS, storage interface) is built first and consumed by all modules
4. Mock data is replaced incrementally — each module replaces its own mocks while others continue using theirs
5. No module may modify another module's files without explicit coordination
6. **Existing users must be preserved** — all migrations are additive, never destructive
7. **VAPI and Tavus webhooks are LIVE in production** — do not modify handlers without explicit approval
8. **Before starting any sprint**, diff the plan against the existing codebase to identify conflicts and resolve questions first

### 1.3 Live Environment Rules

This is a **live production environment** with real customers. The following rules are non-negotiable:

- **VAPI webhooks** are actively sending data to users — do not disrupt
- **Tavus webhooks** are actively sending data to users — do not disrupt
- **Existing users** in the database must be preserved through all migrations
- **SMS testing**: use TextMagic API loopback (send to self), never to real customers
- **Email testing**: use `neoweaver@gmail.com` for all outbound email tests
- **Voice testing**: use the "Elliot" test-only VAPI agent to make calls to other agents for verification
- **Video testing**: use test sessions only, never production Tavus sessions
- **Context router**: pay special attention to the context router and the additional data store for user-uploaded data — this store exists separately from data synced from 3rd parties (VIN Solutions, VAPI, Tavus)
- **Proof requirements**: every sprint requires at least 3 deltas of proof with screenshots, followed by a full E2E test at sprint completion
- **The UI is the source of truth** — if any document contradicts the working UI, the UI wins

### 1.4 Sprint Structure

| Sprint | Duration | Theme | Parallel Tracks |
|--------|----------|-------|-----------------|
| 0 | 1 week | Foundation (sequential — must complete first) | 1 |
| 1 | 2 weeks | Core Features | 3 parallel |
| 2 | 2 weeks | Data & Intelligence | 3 parallel |
| 3 | 2 weeks | Communication & Integration | 2 parallel |
| 4 | 1 week | Polish & Certification | 1 |

**Total estimated duration: 8 weeks** (with parallel development)

---

## 2. Sprint 0 — Foundation (Week 1)

**Goal:** Establish shared infrastructure that all modules depend on. Sequential execution required — everything else blocks on this.

### Module F1: Database & Schema

**Owner:** Single implementer
**Files:** `shared/schema.ts`, `server/storage.ts`, `drizzle.config.ts`
**Tables:** users, organizations, sessions

**Tasks:**
1. Define Drizzle schema for users, organizations, sessions tables
2. Create insert schemas with drizzle-zod
3. Run `npm run db:push` to create tables
4. Create IStorage interface with CRUD methods for users and organizations
5. Implement PgStorage class

**Verification:**
- [ ] Tables exist in database
- [ ] Insert/select operations work for each table
- [ ] Types exported from shared/schema.ts compile without errors

### Module F2: Authentication

**Owner:** Single implementer
**Depends on:** F1
**Files:** `server/auth.ts`, `server/middleware.ts`, `server/routes.ts`
**Endpoints:** POST /api/auth/login, POST /api/auth/register, POST /api/auth/logout, GET /api/auth/me

**Tasks:**
1. Set up express-session with connect-pg-simple
2. Create auth middleware (requireAuth, requireRole)
3. Implement login endpoint with bcrypt password verification
4. Implement register endpoint (admin-only initially)
5. Implement logout and session validation
6. Create RBAC middleware that checks currentRole against route requirements
7. Set org context on every request (app.organization_id for RLS)

**Verification:**
- [ ] Login returns session cookie
- [ ] Protected routes return 401 without session
- [ ] Role-gated routes return 403 for unauthorized roles
- [ ] RLS context is set on every authenticated request

### Module F3: Frontend Auth Integration

**Owner:** Single implementer
**Depends on:** F2
**Files:** `client/src/contexts/AuthContext.tsx`, `client/src/pages/login.tsx`, `client/src/App.tsx`

**Tasks:**
1. Create AuthContext with login/logout/currentUser state
2. Create login page with email/password form
3. Modify App.tsx to redirect unauthenticated users to /login
4. Update AppContext to source currentUser from AuthContext (not mock)
5. Keep currentRole from AuthContext instead of localStorage dev tool
6. Wire TanStack Query's apiRequest to include credentials

**Verification:**
- [ ] Login page renders and authenticates
- [ ] Unauthenticated access redirects to login
- [ ] User data flows from AuthContext to AppContext
- [ ] API calls include session cookie

### Module F4: RLS & Multi-Tenancy

**Owner:** Same as F1
**Depends on:** F1, F2
**Files:** SQL migrations

**Tasks:**
1. Add RLS policies to users and organizations tables
2. Create helper function to set app.organization_id per request
3. Verify RLS isolation: User A cannot see User B's org data
4. Test with multiple organizations

**Verification:**
- [ ] Cross-org queries return empty results
- [ ] Same-org queries return correct data
- [ ] RLS policies documented in schema comments

---

## 3. Sprint 1 — Core Features (Weeks 2-3)

**Three parallel tracks.** Each track can be assigned to a separate implementer.

### Track A: Agents Module

**Owner:** Implementer A
**Depends on:** Sprint 0 complete
**Files:** `shared/schema.ts` (agents table), `server/routes.ts` (agent endpoints), `server/storage.ts` (agent CRUD), `client/src/pages/agents.tsx`, `client/src/components/AgentConfigPane.tsx`, `client/src/components/layout/SubMenuManager.tsx`

**Tables:** agents

**Endpoints:**
- GET /api/agents
- GET /api/agents/:id
- POST /api/agents
- PATCH /api/agents/:id
- DELETE /api/agents/:id
- PATCH /api/agents/:id/status
- GET /api/agents/:id/activity

**Tasks:**
1. Define agents table schema in shared/schema.ts
2. Add agent CRUD to IStorage interface and PgStorage
3. Create agent API routes with role-based access
4. Replace mock agent data in AppContext with TanStack Query fetch
5. Update SubMenuManager agents panel to use API data
6. Update agents.tsx to use API data instead of mock
7. Update AgentConfigPane to save edits via API (instructions, triggers, tools)
8. Wire agent status toggle to PATCH /api/agents/:id/status

**Verification:**
- [ ] Agent list loads from API
- [ ] Create/Edit/Delete agent works
- [ ] Agent config pane saves changes
- [ ] Automa agent filtered from list
- [ ] Agent search works in SubMenuManager

### Track B: Chat & AI Module

**Owner:** Implementer B
**Depends on:** Sprint 0 complete
**Files:** `shared/schema.ts` (conversations, messages tables), `server/routes.ts` (chat endpoints), `server/services/aiService.ts`, `client/src/pages/main.tsx`, `client/src/components/layout/RightPane.tsx`

**Tables:** conversations, messages

**Endpoints:**
- GET /api/conversations
- POST /api/conversations
- GET /api/conversations/:id/messages
- POST /api/conversations/:id/messages (SSE streaming)
- DELETE /api/conversations/:id

**Tasks:**
1. Define conversations and messages tables
2. Add chat CRUD to IStorage
3. Create chat API routes
4. Implement SSE streaming endpoint for AI responses
5. Integrate Claude API for AI response generation
6. Replace mock chat messages in Main page with API data
7. Replace mock conversations in SubMenuManager with API data
8. Wire RightPane (Automa) chat to API
9. Wire agent-specific chat to API (agents.tsx)
10. Implement conversation persistence (save to DB)
11. Implement thinking card with real AI reasoning

**Verification:**
- [ ] Chat messages stream in real-time via SSE
- [ ] Conversations persisted and loadable
- [ ] Chat history shows in SubMenuManager
- [ ] Thinking card shows real AI reasoning
- [ ] Both Main page and RightPane chat work with API

### Track C: User Profile & Settings Shell

**Owner:** Implementer C
**Depends on:** Sprint 0 complete
**Files:** `client/src/pages/profile.tsx`, `client/src/pages/settings.tsx`, `server/routes.ts` (user/settings endpoints)

**Endpoints:**
- GET /api/users/:id
- PATCH /api/users/:id
- PATCH /api/users/:id/preferences
- GET /api/settings
- PATCH /api/settings

**Tasks:**
1. Wire profile page to API (view/edit name, email, phone)
2. Wire preferences to API (theme, notifications, language, timezone)
3. Wire settings tile grid to show/hide based on API user role
4. Replace mock user data in TopBar with API user
5. Replace mock organization data in TopBar with API org
6. Wire org switcher to API

**Verification:**
- [ ] Profile edits save to database
- [ ] Preferences persist across sessions
- [ ] Settings visibility matches role
- [ ] TopBar shows real user/org data

---

## 4. Sprint 2 — Data & Intelligence (Weeks 4-5)

**Three parallel tracks.** The VIN integration must start early as other tracks depend on its data.

### Track D: VIN Solutions Integration

**Owner:** Implementer D
**Depends on:** Sprint 0
**Files:** `server/services/vinService.ts`, `shared/schema.ts` (leads table), `server/routes.ts` (lead endpoints)

**Tables:** leads

**Endpoints:**
- GET /api/leads
- GET /api/leads/:id
- GET /api/leads/pipeline
- POST /api/leads/sync

**Tasks:**
1. Create VIN Solutions API client with OAuth2 auth
2. Define leads table schema matching VIN data structure
3. Implement lead sync service (pull from VIN, upsert to local DB)
4. Create sync scheduler (every 5 minutes)
5. Implement lead API routes with pagination and filtering
6. Exclude excel_upload records from all queries
7. Implement pipeline health endpoint (aggregated pipeline data)
8. Source tagging on all synced data

**Verification:**
- [ ] VIN API authentication works
- [ ] Leads sync correctly with correct field mapping
- [ ] Sync runs on schedule without duplicates
- [ ] Pipeline endpoint returns correct aggregations
- [ ] excel_upload records excluded

### Track E: Metrics & Dashboard Engine

**Owner:** Implementer E
**Depends on:** Track D (needs lead data in DB)
**Files:** `server/services/metricEngine.ts`, `server/routes.ts` (insights endpoints), `client/src/pages/insights.tsx`, `client/src/pages/main.tsx`

**Tables:** metrics_cache

**Endpoints:**
- GET /api/insights/dashboard
- GET /api/insights/metrics/:key
- GET /api/insights/reports/:reportId
- GET /api/insights/library

**Tasks:**
1. Implement MetricEngine service with all formulas from Constitution §5
2. Implement time-bucketed caching (metrics_cache table, TTL-based)
3. Build Main page tile computations per role (Org Admin + Staff + Super Admin + Partner Admin)
4. Build metric detail modal API: return breakdown rows with sub-details and Key Insights per metric
5. Preserve window-blind collapse behavior: tiles collapse after first chat message, toggle to re-expand
6. Build Dashboard tab: Command Center alerts from lead triage data
7. Build Dashboard tab: Performance Scorecard with live metrics
8. Build Dashboard tab: Pipeline Health with VIN pipeline data
9. Build Dashboard tab: Charts with real lead data
10. Build Reports tab: implement all 6 report computations
11. Build Library tab: serve all 91 metrics with category/search filtering
12. Build Library metric detail modal with breakdown rows, sub-details, and insight callout
13. Preserve Automa pop-out button (MessageCircle) on right side of all data-display pages
14. Replace all mock data in insights.tsx with API data
15. Replace mock metric tiles on Main page with API data

**Verification:**
- [ ] Org Admin tiles compute correct scores per formula
- [ ] Staff tiles compute correct scores per formula
- [ ] Metric detail modals show real breakdown data with Key Insights
- [ ] Window-blind collapse works after first message
- [ ] Automa pop-out button visible on Insights/Drive/Activity pages
- [ ] Dashboard shows real-time data from VIN leads
- [ ] All 6 reports generate correct data
- [ ] Library shows all metrics with correct values, detail modals with sample data
- [ ] Metric caching works (TTL invalidation)

### Track F: Hunches & AI Intelligence

**Owner:** Implementer F
**Depends on:** Track D (needs lead data)
**Files:** `server/services/hunchEngine.ts`, `shared/schema.ts` (hunches table), `server/routes.ts` (hunch endpoints), `client/src/pages/insights.tsx` (hunches tab)

**Tables:** hunches

**Endpoints:**
- GET /api/insights/hunches
- POST /api/insights/hunches/generate

**Tasks:**
1. Define hunches table schema
2. Implement Hunch Engine using prompt from Hunch Instructions reference
3. Integrate with Claude API for hunch generation
4. Implement hunch lifecycle (New → Under Investigation → Validated → etc.)
5. Create hunch generation endpoint (manual trigger + scheduled Monday 6AM)
6. Wire hunches tab in insights.tsx to API data
7. Add hunch confidence scoring, type badges, source labels

**Verification:**
- [ ] Hunch generation produces 5-10 actionable hunches
- [ ] Hunches stored with correct schema
- [ ] Hunches tab displays real AI-generated hunches
- [ ] Confidence scores and type badges render correctly
- [ ] Scheduled weekly generation works

---

## 5. Sprint 3 — Communication & Integration (Weeks 6-7)

**Two parallel tracks.**

### Track G: Hub & Communications

**Owner:** Implementer G
**Depends on:** Sprint 0, Track D (for lead data in Leads tab)
**Files:** `shared/schema.ts` (calendar_events, inbox_messages), `server/routes.ts`, `client/src/pages/work-center.tsx`

**Tables:** calendar_events, inbox_messages

**Endpoints:**
- Calendar: GET/POST/PATCH/DELETE /api/calendar/events
- Inbox: GET /api/inbox, POST /api/inbox/send, PATCH /api/inbox/:id/read

**Tasks:**
1. Define calendar_events and inbox_messages tables
2. Implement calendar CRUD with event types (meeting, appointment, task, reminder)
3. Implement inbox with channel support (email, SMS, voicemail)
4. Wire calendar tab to API (all 4 view modes)
5. Wire leads tab to show real VIN leads with action buttons
6. Wire inbox tab to show real messages
7. Implement New Message modal (SMS/Email send)
8. Implement Schedule Appointment modal
9. Implement Dialer modal (placeholder for VAPI integration)

**Verification:**
- [ ] Calendar events CRUD works in all view modes
- [ ] Leads tab shows real VIN data
- [ ] Inbox shows messages with unread indicators
- [ ] Send message works (SMS/Email)
- [ ] Schedule appointment creates calendar event

### Track H: Drive & Files

**Owner:** Implementer H
**Depends on:** Sprint 0
**Files:** `shared/schema.ts` (files, folders), `server/routes.ts`, `server/services/fileService.ts`, `client/src/pages/drive.tsx`

**Tables:** files, folders

**Endpoints:**
- GET /api/files
- POST /api/files/upload
- GET /api/files/:id/download
- PATCH /api/files/:id
- DELETE /api/files/:id
- POST /api/files/:id/share

**Tasks:**
1. Define files and folders tables
2. Implement file storage service (S3-compatible or local filesystem)
3. Create file upload endpoint with multipart support
4. Implement file download with signed URLs
5. Wire drive.tsx to API (grid/list views)
6. Implement star/unstar functionality
7. Implement share modal (generate share links)
8. Implement folder navigation
9. Wire SubMenuManager drive panel to API categories

**Verification:**
- [ ] File upload/download works
- [ ] Grid/List views show real files
- [ ] Star/unstar persists
- [ ] Share modal generates working links
- [ ] Copy link copies to clipboard

---

## 6. Sprint 3 (Continued) — External Integrations

### Track I: Webhook Integrations (Can run parallel with G/H)

**Owner:** Implementer I (or shared with D)
**Depends on:** Sprint 0, Track D
**Files:** `server/webhooks/`, `server/routes.ts`

**⚠️ CRITICAL: VAPI and Tavus webhooks are LIVE in production and actively sending data to real users. Exercise extreme caution. Do not modify existing webhook handler behavior without explicit approval.**

**Endpoints:**
- POST /api/webhooks/vapi
- POST /api/webhooks/tavus
- POST /api/webhooks/textmagic

**Tasks:**
1. Implement VAPI webhook handler with idempotency guards — preserve any existing handler logic
2. Implement Tavus webhook handler with HMAC verification — preserve any existing handler logic
3. Implement TextMagic webhook handler
4. Create notification triggers from webhook events
5. Map webhook data to agent activities and notification records
6. Use "Elliot" test agent (VAPI test-only) to verify voice call flows — never test against production agents
7. For SMS testing, send test messages back to the system itself (loopback) — never to real customers
8. For email testing, use `neoweaver@gmail.com` as the test recipient

**Verification:**
- [ ] VAPI webhooks create correct records (test via Elliot agent)
- [ ] Duplicate webhooks are rejected (idempotency)
- [ ] Tavus HMAC verification works
- [ ] TextMagic messages trigger AI responses via Claude (test via loopback)
- [ ] Existing webhook behavior is not disrupted (regression test)

---

## 7. Sprint 4 — Polish & Certification (Week 8)

**Single track — full team.**

### Module P1: Notifications & Activity

**Tables:** notifications, activity_log
**Endpoints:** GET /api/notifications, PATCH /api/notifications/:id/read, POST /api/notifications/mark-all-read, GET /api/activity

**Tasks:**
1. Implement notification service (create notifications from various triggers)
2. Wire TopBar notification bell to API
3. Wire TopBar activity feed to API
4. Implement activity logging middleware (auto-log admin actions)
5. Wire activity page to API with search/filter

### Module P2: Widget System

**Tables:** widgets, landing_pages
**Endpoints:** Widget CRUD (5 endpoints)

**Tasks:**
1. Implement widget CRUD with 4 types (Text Chat, Live Video, Voice Call, Unified)
2. Wire widget config tabs to API (Settings, Appearance, Targeting, Domains, Embed)
3. Implement widget landing page (/w/:slug) with dynamic config
4. Generate embed codes

### Module P3: End-to-End Testing & Certification

**Proof Requirement:** Every sprint must produce at least 3 deltas of proof with screenshots. Sprint 4 requires a full E2E pass.

**Tasks:**
1. Run Playwright E2E tests against all pages
2. Verify all ACCEPTANCE_CRITERIA.md Part I behaviors with real data
3. Verify all metric formulas produce correct results with known test data
4. Security audit: RLS, auth, input validation, XSS, CSRF
5. Performance testing: API response times, database query times
6. Fix all critical/major issues found
7. Verify existing users are preserved and functional after all migrations
8. Verify VAPI and Tavus webhook handlers still function correctly (regression test)
9. Verify context router and uploaded data store remain independent from 3rd-party synced data

### Module P4: Mock Data Removal

**Tasks:**
1. Remove all mock imports from page components
2. Delete mock files from client/src/mocks/ (keep as reference in a /reference folder)
3. Verify no mock data remains in any production code path
4. Update all loading states to show skeletons while API data loads

---

## 8. Dependency Graph

```
Sprint 0 (Foundation)
  F1: Database & Schema ────────────────┐
  F2: Authentication ──── depends on F1 ├── GATE: Sprint 0 Complete
  F3: Frontend Auth ──── depends on F2  │
  F4: RLS & Multi-Tenancy ── F1 + F2 ──┘

Sprint 1 (Core Features) ── All depend on Sprint 0
  Track A: Agents ──────────────────── independent
  Track B: Chat & AI ──────────────── independent
  Track C: Profile & Settings ─────── independent

Sprint 2 (Data & Intelligence)
  Track D: VIN Integration ────────── depends on Sprint 0
  Track E: Metrics Engine ─────────── depends on Track D
  Track F: Hunch Engine ───────────── depends on Track D

Sprint 3 (Communication & Integration)
  Track G: Hub & Communications ───── depends on Sprint 0 + Track D
  Track H: Drive & Files ──────────── depends on Sprint 0
  Track I: Webhook Integrations ───── depends on Sprint 0 + Track D

Sprint 4 (Polish & Certification)
  P1: Notifications ───── depends on all modules
  P2: Widgets ─────────── depends on Sprint 0
  P3: E2E Testing ─────── depends on all modules
  P4: Mock Removal ─────── depends on all modules
```

---

## 9. Gate Criteria

### Gate 0 → Gate 1 (Sprint 0 → Sprint 1)
- [ ] Users and organizations tables exist with seed data
- [ ] Login/logout flow works end-to-end
- [ ] RLS policies enforce tenant isolation
- [ ] Frontend redirects unauthenticated users to login
- [ ] API calls include auth credentials

### Gate 1 → Gate 2 (Sprint 1 → Sprint 2)
- [ ] Agent CRUD works with real data
- [ ] AI chat streams responses via SSE
- [ ] User profile edits persist
- [ ] Settings page visibility respects roles
- [ ] All Track A/B/C verification criteria pass

### Gate 2 → Gate 3 (Sprint 2 → Sprint 3)
- [ ] VIN Solutions leads sync correctly
- [ ] Main page tiles show real computed scores
- [ ] Dashboard shows real metrics
- [ ] All 6 reports generate from real data
- [ ] Hunches generate from AI analysis

### Gate 3 → Gate 4 (Sprint 3 → Sprint 4)
- [ ] Calendar events CRUD works
- [ ] Leads tab shows VIN data with action buttons
- [ ] File upload/download works
- [ ] Webhook handlers process events correctly
- [ ] All Track G/H/I verification criteria pass

### Gate 4 → Release (Sprint 4 → Production)
- [ ] All ACCEPTANCE_CRITERIA.md Part I behaviors verified with real data
- [ ] All ACCEPTANCE_CRITERIA.md Part II functional criteria pass
- [ ] No mock data in production code
- [ ] Security audit passed (RLS, auth, XSS, CSRF)
- [ ] Performance targets met (p95 < 200ms, LCP < 2.5s)
- [ ] E2E Playwright tests pass
- [ ] Three proofs per feature (config, functional, visual)

---

## 10. Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| VIN Solutions API access delayed | Blocks Tracks D/E/F/G | Implement with mock VIN data first, swap to real API when available |
| Claude API rate limits during hunch generation | Hunches delayed | Implement queue-based generation with retry logic |
| SSE streaming complexity | Chat features delayed | Start with polling fallback, upgrade to SSE |
| RLS performance on large datasets | Slow queries | Add proper indexes, test with production-scale data early |
| Module interface conflicts | Integration failures | Interface-first development (Sprint 0), shared types |

---

## 11. File Ownership Map

| Module | Owned Files (exclusive modification rights) |
|--------|---------------------------------------------|
| F1-F4 | shared/schema.ts (core tables), server/auth.ts, server/middleware.ts |
| Track A | agents table in schema, server/routes/agents.ts |
| Track B | conversations/messages tables, server/routes/chat.ts, server/services/aiService.ts |
| Track C | server/routes/users.ts, server/routes/settings.ts |
| Track D | leads table, server/services/vinService.ts, server/routes/leads.ts |
| Track E | metrics_cache table, server/services/metricEngine.ts, server/routes/insights.ts |
| Track F | hunches table, server/services/hunchEngine.ts |
| Track G | calendar_events/inbox_messages tables, server/routes/calendar.ts, server/routes/inbox.ts |
| Track H | files/folders tables, server/services/fileService.ts, server/routes/files.ts |
| Track I | server/webhooks/*.ts |

**Shared files (require coordination):**
- `shared/schema.ts` — each module adds its own tables but must not modify others
- `server/routes.ts` — main router file; each module registers its routes
- `server/storage.ts` — IStorage interface; each module extends it
- `client/src/contexts/AppContext.tsx` — global state; minimize changes

---

## Document Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-21 | 2.1 | Initial modular implementation plan with 4 sprints, 9 tracks, gate criteria, dependency graph, file ownership map. |
| 2026-02-22 | 2.1.1 | Added Section 1.3 Live Environment Rules, Track I webhook safety warnings, Elliot test agent protocol, sprint proof requirements, codebase diff requirement, P3 regression tests. |
