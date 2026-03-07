# Nexxus Connect — Sprint Roadmap

**Version:** 4.0
**Date:** 2026-03-07
**Status:** Active — S01-S04 complete, S05 next. 43/95 gaps RESOLVED (45%)
**Cross-References:** [GAPS.md](./GAPS.md) | [GUARDRAILS.md](./GUARDRAILS.md) | [.agent_docs/acceptance_criteria.md](./.agent_docs/acceptance_criteria.md) | [SRS.md](./SRS.md) | [PRD.md](./PRD.md)

---

## How to Use This File

1. Find the current sprint (marked **ACTIVE** or **NEXT**)
2. Read its goal, gap references, AC references, and key files
3. Do only the work listed in that sprint
4. When done, verify against the acceptance criteria listed
5. Update GAPS.md status for any resolved items
6. Log the session in MEMORY.md

---

## Sprint Overview

| Sprint | Theme | Status | Gap Refs |
|--------|-------|--------|----------|
| S01 | Governance Stabilization | **COMPLETE** | — |
| S02 | Schema & Persistence Gaps | **COMPLETE** | B1-B5, B9, G2, G9, G10, G31, G32 |
| S03 | AI Chat Quality | **COMPLETE** | G1, G3-G8, H1-H3, B15 |
| S04 | User & Org CRUD | **COMPLETE** | G11-G16, H8-H9, H11, B13-B14 |
| S05 | Real Metrics & Dashboards | **NEXT** | G17-G22, H13, U10 |
| S06 | Outbound Engine Validation | PLANNED | G23-G30, H5-H7 |
| S07 | Webhooks & Notifications | PLANNED | G31-G36, H16-H17 |
| S08 | Intelligence Engine | PLANNED | G37-G41, H14-H15 |
| S09 | Widgets, Tasks & Calendar | PLANNED | G42-G46, H10, H12, B6-B7 |
| S10 | Mock Elimination & Polish | PLANNED | G48, U1-U5, U8-U9, U13, B13 |
| S11 | Data Warehouse & Context Router | PLANNED | — |
| S12 | Production Hardening | PLANNED | G45, G47, G49-G50, B8, B10-B12, U6-U7, U12 |

---

## S01: Governance Stabilization

**Status:** COMPLETE (2026-03-07)
**Goal:** Establish single source of truth. Archive stale docs. Create canonical gap tracker, guardrails, and memory.

**What was done:**
- Archived 6 stale governance files to /archive/
- Created GAPS.md (91 items from devil's advocate audit)
- Created GUARDRAILS.md (8 core rules + lockdown measures)
- Created MEMORY.md (session log + standing directives)
- Rewrote replit.md (≤60 lines, hub pointing to all governance files)
- Rewrote PLAN.md (this file — numbered sprint roadmap)
- Updated codebase-index.md

---

## S02: Schema & Persistence Gaps

**Status:** COMPLETE (2026-03-07)
**Goal:** Verify all tables exist in the schema, add missing columns, ensure the database layer matches what the UI expects. This is foundational — every subsequent sprint depends on the schema being correct.

**Gap References:** B1, B2, B3, B4, B5, B9, G2, G9, G10, G31, G32

**What was done:**
- Full schema audit: all 23 tables verified present (agents, campaigns, campaign_recipients, notifications, activity_log, widgets, tasks, usage_events, etc.)
- Added `systemPrompt` text column to agents table (B2)
- Added `createdBy` UUID column to agents table (B9, G9)
- `instructions` column already existed (B1, G2) — marked RESOLVED
- campaign_recipients, notifications, activity_log tables already existed (B3, B4, B5, G10, G31, G32)
- Seed runs clean, app starts without errors
- GAPS.md updated: 22 items moved to RESOLVED status across all parts
- Additional discoveries: outbound engine (kill switch H5, comm gate H6, disconnect H7, templating G26, send interval G25, dry run G29) already built — updated GAPS.md accordingly

**Key Files:** `shared/schema.ts`, `server/storage.ts`, `server/seed.ts`

**Acceptance Criteria:**
- [x] Every table referenced in the UI has a corresponding Drizzle schema definition
- [x] `instructions`, `systemPrompt`, `createdBy` columns exist on agents table
- [x] campaign_recipients, notifications, activity_log tables exist and have correct columns
- [x] Seed runs clean with no errors
- [x] GAPS.md updated for B1-B5, B9, G2, G9, G10, G31, G32 (+ additional items)

---

## S03: AI Chat Quality

**Status:** COMPLETE (2026-03-07) — verified already built by prior work
**Goal:** Make AI chat functional with real Claude responses, database persistence for all chat contexts (main, right pane, agent), and proper error handling.

**Gap References:** G1, G3, G4, G5, G6, G7, G8, H1, H2, H3, B15

**What was done (all found pre-built during verification):**
- All 3 chat contexts (Main, RightPane, Agent) use useStreamingChat hook with real Claude SSE streaming
- Agent chat persists to DB via conversation API — survives page refresh
- System prompt includes org/dept/user/agent/knowledge/sync context (routes.ts L1310-1353)
- useStreamingChat hook streams tokens via ReadableStream + SSE
- Last 20 messages truncation already implemented
- Error state + retry button in all 3 UIs, server catches and streams errors
- claude-sonnet-4-6 model already in use
- Tool use implemented (web_search, VinSolutions CRM queries via MCP)
- Extended thinking deferred (G5)
- B15 (AgentConfigPane mocks) moved to S10 — cosmetic, non-blocking for chat

**Acceptance Criteria:**
- [x] Main chat produces real Claude responses via SSE streaming
- [x] Right pane chat produces real Claude responses
- [x] Agent chat persists messages to DB — survives page refresh
- [x] System prompt includes org name, department, user role context
- [x] AI errors display user-friendly message with retry option
- [x] Conversation context truncated to prevent token limit issues

---

## S04: User & Org CRUD

**Status:** COMPLETE (2026-03-07) — verified already built by prior work
**Goal:** Wire all "demo mode" buttons to real backend operations. User management, profile editing, knowledge base, and file uploads work end-to-end.

**Gap References:** G11, G12, G13, G14, G15, G16, H8, H9, H11, B13, B14

**What was done (all found pre-built during verification):**
- User Management: create/edit/deactivate/reset-password all wired with real mutations + API routes (H8)
- Profile edit: profileMutation wired to PATCH /api/users/me, inline editing works (H9, B14, G15)
- Password validation: min length 6 enforced in routes.ts (G13)
- Knowledge Base: upload/list/delete fully wired via /api/documents + multer. Content stored in PostgreSQL. Docs injected into AI system prompt. (H11, G16)
- profilePhotoUrl column exists in schema (G14)
- File storage uses multer memoryStorage + PostgreSQL content column (G11)
- Demo mode toasts reduced from 14+ to 10 — remaining are for genuinely unbuilt features (B13 moved to S10)
- G12 (org assignment for admin roles) still OPEN — minor
- U11 (profile sub-routes) still OPEN — minor

**Acceptance Criteria:**
- [x] Create/edit/deactivate user works end-to-end from Settings
- [x] Profile edit saves to database, no demo mode toast
- [x] Knowledge base upload stores file and metadata
- [x] Core user CRUD demo mode toasts removed (remaining 10 are for other features)
- [x] Password validation enforced (min 6)

---

## S05: Real Metrics & Dashboards

**Status:** PLANNED
**Goal:** Replace hardcoded metric tiles with real computed data. Remove metrics that have no data source.

**Gap References:** G17, G18, G19, G20, G21, G22, H13, U10

**Work Items:**
1. Audit which tiles are already API-backed vs hardcoded (G17)
2. Define and compute Service dashboard tiles from campaign/message data (G18)
3. Define and compute Marketing dashboard tiles (G19)
4. Compute Management tiles from available data, remove tiles without sources (G20)
5. Define tile detail modal sub-data for each tile type (G21)
6. Verify role-to-tile mapping on main page (G22)
7. Remove "0" tiles — show nothing if no data (U10)

**Key Files:** `client/src/pages/sales.tsx`, `client/src/pages/service.tsx`, `client/src/pages/marketing.tsx`, `client/src/pages/management.tsx`, `client/src/pages/main.tsx`, `server/routes.ts`

**Acceptance Criteria:**
- [ ] Every visible metric tile has a real API data source
- [ ] No hardcoded numbers on any dashboard page
- [ ] Metrics without data sources removed from UI
- [ ] Tile detail modals show real sub-data

---

## S06: Outbound Engine Validation

**Status:** PLANNED
**Goal:** Verify the outbound communication engine enforces all safety controls. Kill switch, comm gate, rate limiting, and campaign execution work correctly.

**Gap References:** G23, G24, G25, G26, G27, G28, G29, G30, H5, H6, H7

**Work Items:**
1. Verify campaign_recipients integration with execution engine (G23)
2. Verify in-memory queue + setInterval campaign processing (G24)
3. Add sendIntervalSeconds configuration per campaign (G25)
4. Verify message templating with variable substitution (G26)
5. Add TCPA/CAN-SPAM compliance — opt-out text in every SMS, unsubscribe in email (G27)
6. Implement dry run mode for testing (G29)
7. Verify comm gate middleware blocks sends when disabled (G30, H6)
8. Verify kill switch stops campaign mid-execution (H5)
9. Verify campaign disconnect prevents future messages (H7)
10. API keys: TextMagic/Resend needed from user (G28 — BLOCKER)

**Key Files:** `server/outbound.ts`, `server/routes.ts`, `shared/schema.ts`

**Acceptance Criteria:**
- [ ] Kill switch toggle stops campaign execution within one interval
- [ ] Communication gate blocks all outbound when disabled
- [ ] Rate limiting enforced (3 messages/24h per customer)
- [ ] Dry run mode logs without sending
- [ ] Every SMS includes opt-out text, every email includes unsubscribe
- [ ] Campaign disconnect prevents future messages to that conversation

---

## S07: Webhooks & Notifications

**Status:** PLANNED
**Goal:** Verify webhook handlers, build notification triggers, wire activity feeds to real data.

**Gap References:** G31, G32, G33, G34, G35, G36, H16, H17

**Work Items:**
1. Wire TopBar bell to real notification count from DB (H16)
2. Define notification trigger events (G36)
3. Build notification creation on key events (G36)
4. Wire Management activity feed to activity_log table (H17)
5. Add webhook authentication for VAPI (G33)
6. Document VAPI webhook URL setup (G34)
7. Add SSE reconnection logic (G35)

**Key Files:** `server/routes.ts`, `server/storage.ts`, `client/src/components/layout/TopBar.tsx`, `client/src/pages/management.tsx`

**Acceptance Criteria:**
- [ ] Bell icon shows real unread notification count from DB
- [ ] Key events (inbound message, campaign complete, kill switch) create notifications
- [ ] Activity feed shows real logged events
- [ ] VAPI webhooks verified via shared secret

---

## S08: Intelligence Engine

**Status:** PLANNED
**Goal:** Build AI-powered hunch generation, compute insights from real data, wire reports.

**Gap References:** G37, G38, G39, G40, G41, H14, H15

**Work Items:**
1. Build hunch generation pipeline using Claude (H15)
2. Implement hunch lifecycle — accept/dismiss/resolve (H15)
3. Compute insights charts from real conversation/campaign data (H14, G38)
4. Reconcile metrics count with VinSolutions probe data (G37)
5. Define and build report views with CSV export (G40)
6. Implement red zone alerts from VinSolutions lead age data (G41)
7. Add hunch generation cost awareness (G39)

**Key Files:** `client/src/pages/management.tsx`, `client/src/pages/insights.tsx`, `server/routes.ts`

**Acceptance Criteria:**
- [ ] Hunches generated by Claude with confidence scores
- [ ] Hunch accept/dismiss/resolve lifecycle works
- [ ] Insights charts show computed data from real sources
- [ ] Red zone alerts identify cold leads

---

## S09: Widgets, Tasks & Calendar

**Status:** PLANNED
**Goal:** Widget CRUD persists to database. Tasks backend built. Calendar appointment UI works.

**Gap References:** G42, G43, G44, G46, H10, H12, B6, B7

**Work Items:**
1. Build widgets table and CRUD API (G42, H10, B6)
2. Implement embed code generation — most portable approach (G43)
3. Wire landing page serving from widget config (G44)
4. Build tasks table and CRUD API (G46, H12, B7)
5. Wire My Work page to tasks API
6. Verify calendar appointment creation works end-to-end

**Key Files:** `shared/schema.ts`, `server/routes.ts`, `server/storage.ts`, `client/src/pages/settings.tsx`, `client/src/pages/my-work.tsx`

**Acceptance Criteria:**
- [ ] Widget create/read/update/delete persists to database
- [ ] Embed codes generate and work when pasted in HTML
- [ ] Landing pages serve from org/widget config
- [ ] Tasks create/complete/delete persists to database
- [ ] My Work page shows real tasks from API

---

## S10: Mock Elimination & Polish

**Status:** PLANNED
**Goal:** Remove all remaining mock data imports. Fix UI behavior issues. Add error handling.

**Gap References:** G48, U1, U2, U3, U4, U5, U8, U9, U13, B13

**Work Items:**
1. Audit all files in client/src/pages/ for mock imports — replace with API calls (G48)
2. Remove client/src/mocks/ directory if all imports eliminated
3. Add per-query error handling with retry (U2)
4. Cap favorites ScrollArea (U1)
5. Disable agent status toggle during mutation (U5)
6. Override localStorage role from server on login/refresh (U9)
7. Fix login error display (U8)
8. Fix AppContext org fallback flash (U13)
9. Document intentional patterns: activity feed duplication (U3), TeamBox layout (U4)
10. Eliminate remaining demo mode toasts (B13)

**Key Files:** All page files in `client/src/pages/`, `client/src/mocks/`, `client/src/contexts/AppContext.tsx`

**Acceptance Criteria:**
- [ ] Zero mock imports in any production page file
- [ ] Every useQuery has isError handling with user-friendly message
- [ ] No demo mode toasts remain
- [ ] Role sync works correctly across login/refresh

---

## S11: Data Warehouse & Context Router

**Status:** PLANNED
**Goal:** Build local data warehouse, implement VinSolutions sync tiers, add data provenance to AI chat.

**Gap References:** Standing directives 13-16

**Work Items:**
1. Design warehouse tables with data source attribution (dataSource, sourceId, syncedAt)
2. Build historical backfill — pull all available VinSolutions data
3. Build daily delta sync (overnight, changes from last 24h)
4. Build business-hours metrics refresh (every 4h, 8am-6pm)
5. Dashboard tiles read from warehouse instead of live queries
6. Update AI chat to state data provenance in responses
7. Register VinSolutions MCP tools in AI chat endpoint
8. Add hunchBatchId for generation grouping and historical comparison

**Key Files:** `shared/schema.ts`, `server/sync.ts` (new), `server/routes.ts`

**Acceptance Criteria:**
- [ ] Warehouse tables exist with source attribution columns
- [ ] VinSolutions data pulled and stored locally
- [ ] Daily delta sync updates warehouse incrementally
- [ ] AI chat states data provenance ("Based on VinSolutions data from...")
- [ ] Dashboard tiles read from warehouse

---

## S12: Production Hardening

**Status:** PLANNED
**Goal:** Security hardening, performance, E2E tests, billing foundation.

**Gap References:** G45, G47, G49, G50, B8, B10, B11, B12, U6, U7, U12

**Work Items:**
1. Test RLS support on Replit Postgres (G47)
2. Implement application-layer tenant isolation if RLS unavailable
3. Add API rate limiting — 100 req/min per user
4. Build usage_log table and metering (G49, B8)
5. Build E2E test suite — flows derived from AC (G50)
6. Add soft delete to agents (B10)
7. Add session cleanup job (B11)
8. Google Calendar — leave stubbed (G45)
9. Mobile TeamBox filter drawer (U6)
10. ARIA tab attributes (U7)
11. RightPane mobile half-screen drawer (U12)

**Key Files:** All files potentially affected

**Acceptance Criteria:**
- [ ] Multi-tenant isolation enforced (RLS or application layer)
- [ ] API rate limiting active
- [ ] Usage events tracked per org
- [ ] E2E tests pass for critical flows
- [ ] No expired sessions accumulating

---

## Completed History (Summary)

| Wave | Theme | Completed | Notes |
|------|-------|-----------|-------|
| Wave 0 | Setup & UI Prototype | 2026-03 | Persona-driven navigation shell, mock data, 8 RBAC roles |
| Wave 1 | API Wiring & Data Sources | 2026-03 | Auth, DB schema (22 tables), JWT, agent/org/user CRUD |
| Wave 2 | AI Chat, User CRUD, Metrics | 2026-03 | Conversation engine, file uploads, pipeline metrics |
| Wave 3 | Outbound Engine, Webhooks, Intelligence | 2026-03 | Comm gate, kill switch, VAPI webhook, hunches, notifications |
| Wave 3.5 | Dashboard Warehouse Wiring | 2026-03 | Warehouse tables, sync API stubs |
| Wave 3.6 | Outbound Live Wiring | 2026-03 | TextMagic SMS, Resend email, 4-layer safety |
| Wave 4 | Landing Pages, Widgets, Inbound SMS | 2026-03 | Widget embed, landing pages, error boundaries |
| S01 | Governance Stabilization | 2026-03-07 | This cleanup session |

**Note:** Waves 0-4 were completed with known gaps. The sprint roadmap above (S02-S12) systematically validates and repairs those gaps in the order the codebase was built. See GAPS.md for the complete register.
