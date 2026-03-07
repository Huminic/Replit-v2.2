# Nexxus Connect — Stabilization Plan

**Version:** 4.0
**Date:** 2026-03-07
**Status:** Synthesis complete — execution pending user approval per phase
**Baseline:** Commit `58288b6`
**Truth Hierarchy:** UI code → `.agent_docs/acceptance_criteria.md` (62 ACs) → This document
**Cross-References:** [GAPS.md](./GAPS.md) | [RISK_REGISTER.md](./RISK_REGISTER.md) | [GUARDRAILS.md](./GUARDRAILS.md) | [AGENT_CODING_PLAN.md](./AGENT_CODING_PLAN.md)

---

## RC Milestone Definition

**Release Candidate = ALL of the following are true:**

1. VAPI voice calls place and receive real calls, with VinSolutions lead creation on completion (AC-02-A/B/C/D)
2. Tavus video sessions initialize on widget click (AC-04-B)
3. Landing page publicly accessible at `/p/:slug` with functional widget (AC-08-A/B, AC-09-A/B/C/D)
4. Widget renders all 4 channels, each functional end-to-end (AC-04-A/B/C/D)
5. All displayed metrics backed by real data — no mock/hardcoded values in production paths (AC-01-A/B/C, AC-CH-A/B)
6. AI Chat stable with history persistence, persona name from org config, hunch filter working (AC-06-A/B/C/D, AC-HF-A/B/C/D)
7. CRM Guru mode functional with VinSolutions data priority (AC-07-A/B/C)

**RC Gate**: All ACs listed above must show PASS in the Sprint Report. User must approve the RC declaration.

---

## Section 1: AC Traceability Table

This table maps every AC ID to the stabilization task that addresses it, its current status, and the GAPS.md/RISK_REGISTER.md items it relates to.

**How to use this table:**
- To check "what's the state of AC-04-B?" → find the row, see the task ID, check the status
- At sprint end, update the Status column for each AC addressed in that sprint
- Status values: NOT STARTED | IN PROGRESS | PASS | FAIL | PARTIAL | BLOCKED | DEFERRED

### MVP Function 1 — Accurate Metrics

| AC ID | Description | Task(s) | Status | Risk Reg # | Notes |
|-------|-------------|---------|--------|------------|-------|
| AC-01-A | Active pipeline definition (14-day, exclude Lost/Sold/Dup) | S4-T01 | NOT STARTED | #5 | Backend computation exists; verify formula |
| AC-01-B | Pipeline count display matches DB query | S4-T01 | NOT STARTED | #5 | Main page wired; verify accuracy |
| AC-01-C | Metric consistency across sections | S4-T02 | NOT STARTED | #4, #5 | Insights page is 100% mock — blocks this AC |

### MVP Function 2 — Voice Lead Capture (VAPI)

| AC ID | Description | Task(s) | Status | Risk Reg # | Notes |
|-------|-------------|---------|--------|------------|-------|
| AC-02-A | Successful VAPI lead capture → VIN record + transcript | S3-T01 | NOT STARTED | #1 | VAPI is console.log only |
| AC-02-B | Step 1 failure → VIN Push Failure escalation in TeamBox | S3-T01 | NOT STARTED | #1 | No escalation creation on VAPI failure |
| AC-02-C | Step 2 failure → escalation with contact_href | S3-T01 | NOT STARTED | #1 | No escalation creation on VAPI failure |
| AC-02-D | No silent failure — log + escalation both exist | S3-T01 | NOT STARTED | #1, #15 | Silent .catch patterns exist |

### MVP Function 3 — Appointment Sync

| AC ID | Description | Task(s) | Status | Risk Reg # | Notes |
|-------|-------------|---------|--------|------------|-------|
| AC-03-A | Google Calendar → Nexxus sync | DEFERRED | DEFERRED | — | Wave 5 / future |
| AC-03-B | Dealer.com → Nexxus sync | DEFERRED | DEFERRED | — | Wave 5 / future |
| AC-03-C | Tekion → Nexxus sync | DEFERRED | DEFERRED | — | Wave 5 / future |
| AC-03-D | Manual appointment creation | DEFERRED | DEFERRED | — | Wave 5 / future |
| AC-03-E | VIN Solutions NOT listed as appointment source | DEFERRED | DEFERRED | — | Wave 5 / future |

### MVP Function 4 — Universal Widget

| AC ID | Description | Task(s) | Status | Risk Reg # | Notes |
|-------|-------------|---------|--------|------------|-------|
| AC-04-A | Four channels present (chat, call, form, video) | S3-T03 | NOT STARTED | #11 | Widget renders channels; verify all 4 functional |
| AC-04-B | Video launches Tavus immediately on click | S3-T02 | NOT STARTED | #2 | Tavus has zero implementation |
| AC-04-C | Disabled channel not rendered | S3-T03 | NOT STARTED | — | UI logic may exist; verify |
| AC-04-D | Embed code generation and copyable | S3-T03 | NOT STARTED | — | Settings page has embed section |

### MVP Function 5 — Outbound Trigger Engine

| AC ID | Description | Task(s) | Status | Risk Reg # | Notes |
|-------|-------------|---------|--------|------------|-------|
| AC-05-A | Kill switch blocks SMS | S6-T01 | NOT STARTED | — | Safety stack implemented; verify |
| AC-05-B | Kill switch blocks phone (VAPI) | S6-T01 | NOT STARTED | #1 | Requires VAPI wiring first |
| AC-05-C | Kill switch blocks email | S6-T01 | NOT STARTED | — | Safety stack implemented; verify |
| AC-05-D | Channel switch blocks specific channel | S6-T01 | NOT STARTED | — | Per-channel toggles exist |
| AC-05-E | Rate limit enforcement (3 msgs / 24h) | S6-T02 | NOT STARTED | — | Rate limiter code exists; verify |
| AC-05-F | Trigger logged with full details | S6-T02 | NOT STARTED | #8, #14 | In-memory execution state; logging gaps |

### MVP Function 6 — Advanced AI Chat

| AC ID | Description | Task(s) | Status | Risk Reg # | Notes |
|-------|-------------|---------|--------|------------|-------|
| AC-06-A | Thinking card visible during AI processing | S5-T01 | NOT STARTED | #48 | UI may exist; verify behavior |
| AC-06-B | Chat history persists across sessions | S5-T02 | NOT STARTED | #7, #9 | Conversations stored in DB; verify retrieval |
| AC-06-C | Persona name from org "Agent Name" field | S5-T03 | NOT STARTED | — | personaName field exists on orgs table |
| AC-06-D | Persona name fallback to VAPI config name | S5-T03 | NOT STARTED | — | Fallback logic needed |

### MVP Function 7 — CRM Guru Agent

| AC ID | Description | Task(s) | Status | Risk Reg # | Notes |
|-------|-------------|---------|--------|------------|-------|
| AC-07-A | VIN Solutions data priority in CRM Guru | S5-T04 | NOT STARTED | — | CRM Guru mode exists; verify data priority |
| AC-07-B | Warehouse supplement with explicit attribution | S5-T04 | NOT STARTED | — | System prompt has data provenance rules |
| AC-07-C | General chat fallback to warehouse + navigation suggestion | S5-T04 | NOT STARTED | — | Verify behavior |

### MVP Function 8 — Customer Experience View

| AC ID | Description | Task(s) | Status | Risk Reg # | Notes |
|-------|-------------|---------|--------|------------|-------|
| AC-08-A | Globe icon links to landing page at /p/[slug] | S3-T04 | NOT STARTED | #3 | Globe icon may exist in TopBar |
| AC-08-B | Landing page publicly accessible without login | S3-T04 | NOT STARTED | #3 | /p/:slug route exists but minimal |

### MVP Function 9 — Hosted Landing Page

| AC ID | Description | Task(s) | Status | Risk Reg # | Notes |
|-------|-------------|---------|--------|------------|-------|
| AC-09-A | Slug format: kebab-case from org name | S3-T04 | NOT STARTED | #3 | Slug management exists |
| AC-09-B | Slug collision handling (append -2) | S3-T04 | NOT STARTED | #3 | Verify collision logic |
| AC-09-C | Slug edit with 30-day redirect + forensic log | S3-T04 | NOT STARTED | #3 | Redirect creation exists in API |
| AC-09-D | Widget present and functional on landing page | S3-T04, S3-T03 | NOT STARTED | #3, #2 | Depends on widget being functional |

### MVP Function 10 — Metering and Usage

| AC ID | Description | Task(s) | Status | Risk Reg # | Notes |
|-------|-------------|---------|--------|------------|-------|
| AC-10-A | Events counted (usage_events table) | S6-T03 | NOT STARTED | — | usage_events table exists |
| AC-10-B | Usage visible to Org Admin (no dollar amounts) | S6-T03 | NOT STARTED | #22 | Usage page exists; verify data |
| AC-10-C | Usage scoped to org (Partner sees own orgs only) | S6-T03 | NOT STARTED | #13 | App-layer scoping; no RLS |
| AC-10-D | Billing API accessible (billing_get_usage) | DEFERRED | DEFERRED | #18 | Requires Stripe integration |

### Kill Switch System

| AC ID | Description | Task(s) | Status | Risk Reg # | Notes |
|-------|-------------|---------|--------|------------|-------|
| AC-KS-A | 4 columns exist with DEFAULT FALSE | S6-T01 | NOT STARTED | — | Schema has these columns |
| AC-KS-B | Master switch overrides channel switches | S6-T01 | NOT STARTED | — | Logic exists in outbound engine |

### TeamBox Escalations

| AC ID | Description | Task(s) | Status | Risk Reg # | Notes |
|-------|-------------|---------|--------|------------|-------|
| AC-TB-A | Task/Escalation/Unsent Message are distinct visual types | S6-T04 | NOT STARTED | #11 | TeamBox renders conversations; verify type distinction |
| AC-TB-B | Priority levels (Critical/High/Medium/Low) visually distinct | S6-T04 | NOT STARTED | — | Verify in TeamBox UI |

### Enforcer Compliance

| AC ID | Description | Task(s) | Status | Risk Reg # | Notes |
|-------|-------------|---------|--------|------------|-------|
| AC-EF-A | Dropped feature references block merge | S7-T01 | NOT STARTED | #42 | Enforcer script exists; verify |
| AC-EF-B | No production credentials in commits | S7-T01 | NOT STARTED | #42 | Enforcer script scans; verify |
| AC-EF-C | Kill switch test must pass before merge | S7-T01 | NOT STARTED | #10 | Enforcer checks defaults; needs expansion |

### AI Chat Landing Page — 4 Metrics

| AC ID | Description | Task(s) | Status | Risk Reg # | Notes |
|-------|-------------|---------|--------|------------|-------|
| AC-CH-A | Four metric tiles on load (pipeline, appts, escalations, outbound) | S4-T01 | NOT STARTED | — | Main page renders 4 tiles from real API |
| AC-CH-B | Metrics hide on chat start | S4-T01 | NOT STARTED | — | Verify collapse behavior |

### Hunch Filter — System Prompt Hierarchy

| AC ID | Description | Task(s) | Status | Risk Reg # | Notes |
|-------|-------------|---------|--------|------------|-------|
| AC-HF-A | Accepted hunch added to effective prompt | S5-T05 | NOT STARTED | — | Hunch injection exists in system prompt |
| AC-HF-B | Dismissed hunch not in prompt | S5-T05 | NOT STARTED | — | Verify filtering |
| AC-HF-C | Resolved hunch removed from prompt | S5-T05 | NOT STARTED | — | Verify filtering |
| AC-HF-D | Master prompt unchanged by hunch acceptance | S5-T05 | NOT STARTED | — | Verify immutability |

### Navigation Shell

| AC ID | Description | Task(s) | Status | Risk Reg # | Notes |
|-------|-------------|---------|--------|------------|-------|
| AC-NAV-A | AI Chat sub-items: Favorites, Chat History, Artifacts | S8-T01 | NOT STARTED | — | SubMenuManager renders these |
| AC-NAV-B | Artifacts scoped to data reports only | S8-T01 | NOT STARTED | — | Verify no file upload/sharing |
| AC-NAV-C | My Work sub-items: Assistant (Coming Soon), Dashboard, Tasks, Chat | S8-T01 | NOT STARTED | — | Verify labels and Coming Soon |
| AC-NAV-D | TeamBox sub-items: Tasks, Conversations, Workflows | S8-T01 | NOT STARTED | — | Verify order and labels |
| AC-NAV-E | All conversations route to TeamBox → Conversations | S8-T01 | NOT STARTED | — | Verify routing |
| AC-NAV-F | Sales: Dashboard, Agents, Insights, Calendar (no Campaigns) | S8-T01 | NOT STARTED | — | Verify absence of Campaigns |
| AC-NAV-G | Service: Dashboard, Agents, Campaigns, Insights, Calendar | S8-T01 | NOT STARTED | — | Verify all present |
| AC-NAV-H | Management: Dashboard, Insights, Hunches (Coming Soon), Activities, ROI | S8-T01 | NOT STARTED | — | Verify Coming Soon label on Hunches |
| AC-NAV-I | Disabled module absent from nav (no stub) | S8-T01 | NOT STARTED | — | Verify behavior |
| AC-NAV-J | Enabled-but-not-built shows Coming Soon + not clickable | S8-T01 | NOT STARTED | — | Verify behavior |

---

## Section 2: Stabilization Phases

### Phase S1: Governance Cleanup

**Goal:** Resolve contradictions, archive stale documents, establish clean authority chain.
**RC relevance:** Prerequisite — clears confusion that causes incorrect implementations.

| Task | Description | Files | Blocked By | ACs | Complexity | Self-Verification |
|------|-------------|-------|------------|-----|------------|-------------------|
| S1-T01 | Archive stale governance docs to `archive/` | SPEC.md, COMMENT_INDEX.md, acceptance_criteria_audit.md, .agent_docs/rules/operational-context.md, .agent_docs/codebase-index.md, .agent_docs/undefined-items.md | — | — | S | Files exist in archive/; originals removed from root/.agent_docs |
| S1-T02 | Remove nuisance files (loose PNGs, orphaned mocks) | home-metrics.png, sales-dashboard.png, 9 orphaned mock files per RISK_REGISTER.md §6 | — | — | S | Files deleted; no broken imports (grep confirms no remaining references) |
| S1-T03 | Update CLAUDE.md truth hierarchy to match consolidated hierarchy | CLAUDE.md | S1-T01 | — | S | CLAUDE.md §1.2 says: T1=UI code, T2=.agent_docs/acceptance_criteria.md, T3=SRS.md, T4=PLAN.md. No "Constitution" reference. |
| S1-T04 | Resolve contradiction C-06 (Artifacts scope) in codebase comments | Relevant source files | S1-T01 | AC-NAV-B | S | Any code comment referencing Artifacts as "out of scope" is clarified to mean file upload/sharing, not the sub-item itself |

**GATE:STOP** — After completing S1, agent presents: files archived, files removed, CLAUDE.md changes, contradiction resolutions. User approves before S2.

---

### Phase S2: Schema Stabilization

**Goal:** Resolve dual schema conflict, add cascades, add critical indexes. No new tables yet.
**RC relevance:** Foundation — prevents data integrity issues during RC feature work.

| Task | Description | Files | Blocked By | ACs | Complexity | Self-Verification |
|------|-------------|-------|------------|-----|------------|-------------------|
| S2-T01 | Resolve dual schema conflict — remove or isolate shared/models/chat.ts | shared/models/chat.ts, shared/schema.ts, server/replit_integrations/ | — | AC-06-B | S | shared/models/chat.ts either deleted or clearly scoped to Replit integration only; no type name collisions with shared/schema.ts |
| S2-T02 | Add ON DELETE CASCADE to all FKs | shared/schema.ts | S2-T01 | — | S | Every references() call has onDelete: 'cascade' or an explicit documented reason for not cascading |
| S2-T03 | Add indexes on high-query columns | shared/schema.ts | S2-T01 | — | S | Indexes on: conversations.organization_id, conversations.status, messages.conversation_id, campaigns.organization_id, campaigns.department, agents.organization_id, tasks.organization_id, activity_logs.organization_id |
| S2-T04 | Generate migration file from current schema | shared/schema.ts, migrations/ | S2-T02, S2-T03 | — | S | At least one migration file exists in migrations/; drizzle-kit generate succeeds |

**GATE:STOP** — After completing S2, agent presents: schema changes, migration file, cascade rules. User approves before S3.

---

### Phase S3: RC Features — VAPI + Tavus + Widget + Landing Page

**Goal:** Wire the communication stack end-to-end. This is the core RC milestone work.
**RC relevance:** Direct — these are the RC-defining features.

| Task | Description | Files | Blocked By | ACs | Complexity | Self-Verification |
|------|-------------|-------|------------|-----|------------|-------------------|
| S3-T01 | Wire VAPI for real voice calls — replace console.log with actual VAPI API calls; implement VinSolutions lead creation on call completion; implement failure escalation to TeamBox | server/routes.ts (VAPI webhook handler), server/vendorProxy.ts, shared/schema.ts (if escalation type needed) | S2 complete | AC-02-A, AC-02-B, AC-02-C, AC-02-D | L | VAPI webhook receives real call data; lead created in VinSolutions on success; escalation created in tasks table on failure; no console.log-only paths remain |
| S3-T02 | Implement Tavus video integration — create Tavus client, session initialization, persona matching | New: server/tavus.ts; modify: server/routes.ts, client widget component | S2 complete | AC-04-B | L | Tavus API called on video channel click; session initializes; video stream renders in widget; not pre-loaded on page arrival |
| S3-T03 | Harden widget — verify 4 channels functional, channel toggle works, embed code generation | client/src/pages/widget-landing.tsx, settings widget section | S3-T01, S3-T02 | AC-04-A, AC-04-C, AC-04-D, AC-09-D | M | All 4 channels render when enabled; disabled channel hidden; embed code snippet displayed and copyable; widget functional on landing page |
| S3-T04 | Landing page end-to-end — verify slug format, collision handling, redirect logic, globe icon link, public access | server/routes.ts (org slug routes), client TopBar, widget-landing.tsx | S3-T03 | AC-08-A, AC-08-B, AC-09-A, AC-09-B, AC-09-C | M | /p/:slug accessible without auth; slug is kebab-case; collision appends -2; edit creates 30-day redirect; globe icon in TopBar links to /p/[current-org-slug] |

**GATE:STOP** — After completing S3, agent presents: VAPI call evidence, Tavus session evidence, widget 4-channel verification, landing page public access verification, AC pass/fail for each. User approves before S4.

---

### Phase S4: Metrics Correction

**Goal:** Ensure all displayed metrics are backed by real data. Remove mock data from metric surfaces.
**RC relevance:** Direct — "correct metrics in UI" is an RC gate criterion.

| Task | Description | Files | Blocked By | ACs | Complexity | Self-Verification |
|------|-------------|-------|------------|-----|------------|-------------------|
| S4-T01 | Verify main page 4 tiles match AC-CH-A — active pipeline, appointments today, open escalations, outbound sent 24h. Verify hide-on-chat-start behavior. | client/src/pages/main.tsx | — | AC-01-A, AC-01-B, AC-CH-A, AC-CH-B | S | 4 tiles render with labels matching AC-CH-A; values come from /api/metrics/pipeline (real DB); tiles collapse when user types |
| S4-T02 | Wire Insights page to real data — replace insight-data.ts imports with API calls. Build backend analytics endpoints as needed. | client/src/pages/insights.tsx, client/src/lib/insight-data.ts, server/routes.ts | S4-T01 | AC-01-C | L | Zero imports from insight-data.ts; every chart/table section uses useQuery; backend endpoints return real computed data; "Sample Data" banner removed |
| S4-T03 | Wire trend percentages — implement historical comparison (vs previous period) for dashboard metric tiles | server/storage.ts, server/routes.ts, department page components | S4-T01 | AC-01-C | M | change values on metric tiles are non-zero when data exists; computed from real historical comparison; display "N/A" or "—" when insufficient history |
| S4-T04 | Wire TopBar Activity Feed to real API | client/src/components/layout/TopBar.tsx, client/src/lib/activity-utils.ts | — | — | S | TopBar uses useQuery for /api/activity-log instead of staticActivityFeed; static array removed |
| S4-T05 | Wire Sales Recent Activity to real API | client/src/pages/sales.tsx | — | — | S | 5-item hardcoded array replaced with useQuery for /api/activity-log?department=sales |

**GATE:STOP** — After completing S4, agent presents: metric tile evidence (screenshots or data), Insights page transformation, trend values, TopBar/Sales activity wiring. AC pass/fail for each. User approves before S5.

---

### Phase S5: Chat Hardening

**Goal:** Ensure AI Chat is stable, advanced, and meets all chat-related ACs.
**RC relevance:** Direct — "stable/advanced user chat" is an RC gate criterion.

| Task | Description | Files | Blocked By | ACs | Complexity | Self-Verification |
|------|-------------|-------|------------|-----|------------|-------------------|
| S5-T01 | Verify thinking card appears during AI processing | client/src/pages/main.tsx, client/src/hooks/useStreamingChat.ts | — | AC-06-A | S | Thinking indicator visible during AI processing; disappears when response starts streaming |
| S5-T02 | Verify chat history persists across sessions — fix mid-stream failure data loss | server/routes.ts (stream endpoint), client chat components | — | AC-06-B | M | Returning to AI Chat shows previous conversations; partial AI responses saved on stream failure (not lost) |
| S5-T03 | Verify persona name from org "Agent Name" field with VAPI fallback | server/routes.ts (system prompt), client greeting components | — | AC-06-C, AC-06-D | S | Persona greeting uses org.personaName; if empty, uses VAPI assistant name; never shows hardcoded "Automa" when org has a custom name |
| S5-T04 | Verify CRM Guru mode — VIN Solutions data priority, warehouse supplement, general chat fallback | server/routes.ts (chat endpoint), client CRM Guru toggle | — | AC-07-A, AC-07-B, AC-07-C | M | CRM Guru response uses VIN data first; warehouse data attributed explicitly; general chat suggests CRM Guru when CRM data needed |
| S5-T05 | Verify hunch filter — accepted hunches in prompt, dismissed excluded, resolved removed, master prompt immutable | server/routes.ts (system prompt construction) | — | AC-HF-A, AC-HF-B, AC-HF-C, AC-HF-D | M | Accepted hunch content appears in effective prompt after master prompt; dismissed hunch absent; resolved hunch absent; master prompt bytes identical before and after hunch operations |

**GATE:STOP** — After completing S5, agent presents: thinking card evidence, chat history evidence, persona name evidence, CRM Guru test results, hunch filter verification. AC pass/fail for each. User approves before S6.

---

### Phase S6: Outbound & Kill Switch & TeamBox & Metering

**Goal:** Verify outbound safety stack, TeamBox escalation types, and metering pipeline.
**RC relevance:** Safety-critical — kill switch is a hard requirement.

| Task | Description | Files | Blocked By | ACs | Complexity | Self-Verification |
|------|-------------|-------|------------|-----|------------|-------------------|
| S6-T01 | Verify kill switch system — master overrides channels, all 3 channel blocks (SMS/phone/email), 4 columns with DEFAULT FALSE | server/outbound.ts, shared/schema.ts | S3-T01 (VAPI needed for phone) | AC-05-A, AC-05-B, AC-05-C, AC-05-D, AC-KS-A, AC-KS-B | M | With outbound_enabled=FALSE: SMS blocked + escalation created; phone blocked + escalation created; email blocked + escalation created. With outbound_enabled=TRUE, sms_enabled=FALSE: SMS blocked, email/phone pass. Master always overrides. |
| S6-T02 | Verify rate limiter and trigger logging — persistent execution state | server/outbound.ts, server/routes.ts | S6-T01 | AC-05-E, AC-05-F | M | 4th message in 24h blocked with Unsent Message escalation; every trigger (sent or blocked) logged with: trigger_id, org_id, customer_id, channel, status, blocked_reason, timestamp. Campaign execution state persisted (not just in-memory Map). |
| S6-T03 | Verify metering — usage events counted, visible to Org Admin, scoped correctly | server/routes.ts (usage routes), client/src/pages/usage.tsx | — | AC-10-A, AC-10-B, AC-10-C | M | Outbound SMS creates usage_events entry; Usage page shows counts without dollar amounts; Partner Admin sees only assigned orgs |
| S6-T04 | Verify TeamBox escalation types and priority levels | client/src/pages/teambox.tsx | S6-T01 | AC-TB-A, AC-TB-B | S | Task, Escalation, Unsent Message visually distinct in TeamBox; Critical/High/Medium/Low priority levels have distinct visual treatment |

**GATE:STOP** — After completing S6, agent presents: kill switch test results (all 4 channels), rate limiter evidence, trigger log evidence, metering evidence, TeamBox type/priority evidence. AC pass/fail for each. User approves before S7.

---

### Phase S7: Test Coverage

**Goal:** Establish automated testing. Wire test batteries to executable tests.
**RC relevance:** Verification — ensures RC features don't regress.

| Task | Description | Files | Blocked By | ACs | Complexity | Self-Verification |
|------|-------------|-------|------------|-----|------------|-------------------|
| S7-T01 | Expand Enforcer script — add mock data detection, API endpoint verification, credential scanning improvements | scripts/enforcer.ts | — | AC-EF-A, AC-EF-B, AC-EF-C | M | Enforcer detects: mock imports in production pages, dropped feature references, credentials, kill switch defaults. All checks pass on current codebase. |
| S7-T02 | Set up test framework (Vitest or Playwright) and create first test suite covering kill switch ACs | New: vitest.config.ts or playwright.config.ts, tests/ directory | S6 complete | AC-KS-A, AC-KS-B | M | Test runner executes; kill switch tests pass; test files exist in tests/ directory |
| S7-T03 | Create API integration tests for critical endpoints (auth, chat, campaigns, metrics) | tests/ directory | S7-T02 | — | L | Tests cover: login flow, chat creation + message, campaign CRUD, metrics endpoint returns real data |
| S7-T04 | Map test batteries (testing/ folder) to executable test plans — identify which battery tests can be automated vs manual | testing/README.md (new) | S7-T02 | — | M | README.md in testing/ maps each battery to: automated test file (if exists), manual test procedure, AC coverage |

**GATE:STOP** — After completing S7, agent presents: Enforcer results, test suite results, test coverage summary, battery mapping. User approves before S8.

---

### Phase S8: Mock Removal & Polish

**Goal:** Remove remaining mock data, fix navigation ACs, clean up UI gaps.
**RC relevance:** Final polish — ensures no mock data in production paths.

| Task | Description | Files | Blocked By | ACs | Complexity | Self-Verification |
|------|-------------|-------|------------|-----|------------|-------------------|
| S8-T01 | Verify all Navigation Shell ACs — sub-items, Coming Soon labels, routing | client/src/components/layout/SubMenuManager.tsx, Sidebar.tsx | — | AC-NAV-A through AC-NAV-J | M | Each AC-NAV item verified individually; sub-items match spec; Coming Soon labels present where required; disabled modules absent |
| S8-T02 | Wire My Work chat tab to real API — remove mock imports | client/src/pages/my-work.tsx | S4 complete | — | M | Zero imports from @/mocks/; chat tab uses useQuery for /api/conversations; mock files messages.ts and conversations.ts deleted |
| S8-T03 | Remove remaining orphaned mock files and barrel export | client/src/mocks/index.ts, remaining mock files | S8-T02 | — | S | client/src/mocks/ directory empty or deleted; no broken imports anywhere (build succeeds) |
| S8-T04 | Address Settings demo-mode actions — wire or explicitly mark as "Phase 2" | client/src/pages/settings.tsx | — | — | M | Each demo-mode toast either replaced with real functionality or explicitly shows "Available in future release" with a tracking item in GAPS.md |

**GATE:STOP** — After completing S8, agent presents: navigation verification (all AC-NAV items), My Work wiring evidence, mock removal evidence, settings status. AC pass/fail for each. User approves. If all RC-gate ACs pass → RC declaration proposed.

---

## Section 3: Sprint Report Template

Use this template at the end of each phase to report results against ACs.

```
## Sprint Report: Phase S[X]

**Date:** [date]
**Tasks Completed:** [list task IDs]

### AC Results

| AC ID | Description | Result | Evidence | Notes |
|-------|-------------|--------|----------|-------|
| AC-XX-X | [from traceability table] | PASS / FAIL / PARTIAL | [what was verified and how] | [any new gaps] |

### New Gaps Discovered
| ID | Description | Severity |
|----|-------------|----------|
| [new ID] | [description] | [H/M/L] |

### Blocking Issues
[any issues preventing completion]

### User Approval
- [ ] User reviewed and approved this sprint
```

---

## Section 4: Phase Dependencies

```
S1 (Governance) ──┐
                   ├── S3 (VAPI/Tavus/Widget/Landing) ── S6 (Outbound/Kill Switch) ── S7 (Tests)
S2 (Schema) ──────┘                                                                        │
                                                                                            v
S4 (Metrics) ────────────────────────────────────────────────────────── S8 (Mock Removal/Polish)
                                                                                            │
S5 (Chat) ──────────────────────────────────────────────────────────────────────────────────┘
```

- S1 and S2 can run in parallel (no dependencies)
- S3 requires S1+S2 complete (clean schema + clear governance)
- S4 and S5 can run in parallel after S2 (schema stable)
- S6 requires S3 complete (VAPI needed for phone kill switch test)
- S7 requires S6 complete (test suites need functional features)
- S8 requires S4+S5+S7 complete (all features wired before final polish)

---

## Section 5: Deferred Items (Not in Stabilization Scope)

These items are tracked in RISK_REGISTER.md Section 4 and GAPS.md but are explicitly excluded from this stabilization plan:

- AC-03-A through AC-03-E (Appointment Sync — Google Calendar, Dealer.com, Tekion)
- AC-10-D (Billing API — requires Stripe integration)
- RLS policies (SCH-15) — tracked but deferred to post-RC
- Stripe billing integration (API-01) — tracked but deferred
- Marketing Studio (placeholder — Wave 5+)
- NanoClaw / Personal Assistant (Wave 6)
- A2P / 10DLC SMS registration
- Google Analytics / Make.com connectors
