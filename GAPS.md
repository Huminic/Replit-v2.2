# Nexxus Connect — Canonical Gap & Defect Register

**Source:** acceptance_criteria_audit.md (2026-03-05 devil's advocate review)
**Purpose:** Single source of truth for all known gaps, bugs, and missing functionality.
**Rule:** Every gap gets a status. Nothing gets removed — only status changes.

---

## Status Key

| Status | Meaning |
|--------|---------|
| OPEN | Not started, needs work |
| IN-PROGRESS | Actively being worked on |
| RESOLVED | Fixed and verified |
| WONT-FIX | Accepted as-is or deferred indefinitely |
| DECIDED | Stakeholder decision made, implementation pending |

---

## PART 1: Hidden Gaps (Things That Look Done But Aren't)

| ID | Area | What It Looks Like | What's Actually Happening | Severity | Status | Sprint Target |
|----|------|--------------------|---------------------------|----------|--------|---------------|
| H1 | Main page chat | User sends message, gets response | Real Claude streaming via useStreamingChat + /api/chat/:id/stream. Fully functional. | MEDIUM | RESOLVED — real Claude SSE streaming | S03 |
| H2 | RightPane chat | Same typing dots, response pattern | Real Claude streaming via useStreamingChat. Fully functional. | MEDIUM | RESOLVED — real Claude SSE streaming | S03 |
| H3 | Agent chat (/agents) | Typing dots, response | Uses useStreamingChat + conversation API. Messages persist to DB. Survives refresh. | HIGH | RESOLVED — streaming + DB persistence | S03 |
| H4 | Agent instructions edit | AgentConfigPane has Instructions tab with edit modal | `instructions` column EXISTS on agents table. Verify UI wiring persists to DB. | MEDIUM | RESOLVED (schema) — verify UI wiring | S03 |
| H5 | Campaign kill switch | Toggle in campaign table, shows red when ON | Backend enforces killSwitch check in outbound.ts. RESOLVED. | MEDIUM | RESOLVED — outbound.ts checks campaign.killSwitch | S06 |
| H6 | Communication gate | Toggle in Settings > Organization | checkCommGate() middleware in outbound.ts checks org.outboundEnabled. RESOLVED. | MEDIUM | RESOLVED — outbound.ts enforces | S06 |
| H7 | Campaign disconnect | Disconnect button sets campaignDisconnected=true | outbound.ts checks conversation.campaignDisconnected. RESOLVED. | MEDIUM | RESOLVED — outbound.ts enforces | S06 |
| H8 | User Management | Shows real users from API | Create/edit/deactivate/reset-password ALL wired with real mutations + API routes. No demo toasts on user CRUD. | HIGH | RESOLVED — full CRUD wired | S04 |
| H9 | Profile editing | Edit profile button exists | profileMutation wired to PATCH /api/users/me. Inline editing works. No demo toast. | LOW | RESOLVED — mutation wired | S04 |
| H10 | Widgets | Rich config UI with preview, embed codes, targeting | Widget table + CRUD routes + UI all wired via useQuery/mutations to /api/widgets. | HIGH | RESOLVED — full API wiring confirmed | S09 |
| H11 | Knowledge Base | Upload UI, document list, web scraping | Document upload/list/delete fully wired via /api/documents + multer. Web scraping still demo. | HIGH | RESOLVED (core) — web scrape/URL add remain demo | S04 |
| H12 | My Work | Tasks list with status, priority, due dates | Tasks table + CRUD routes EXIST. Page still imports from mocks (3 mock imports found). | HIGH | OPEN — page needs API wiring | S09 |
| H13 | Dashboard metrics | KPI tiles on every department page | Sales tiles use VinSolutions data. Service/Marketing/Management tiles hardcoded. | HIGH | OPEN | S05 |
| H14 | Insights page | Charts, metrics library, red zone alerts | 100% from insight-data.ts static arrays. None computed. | HIGH | OPEN | S08 |
| H15 | Hunches | AI insight cards with confidence scores | Hardcoded mockHunches array. No AI generation. | HIGH | OPEN | S08 |
| H16 | Notifications | Bell icon in TopBar with count badge | Notifications table + CRUD routes EXIST. Verify UI reads from API. | HIGH | OPEN — verify UI wiring | S07 |
| H17 | Activity feeds | Activity timeline in Management page | Activity_log table + API route EXIST. Verify UI reads from API. | HIGH | OPEN — verify UI wiring | S07 |

---

## PART 2: Sprint-by-Sprint Gaps

### Sprint 2.1 — AI Chat & Conversation Engine

| ID | Gap | Severity | Status | Sprint Target |
|----|-----|----------|--------|---------------|
| G1 | Agent chat has NO database persistence. Main/RightPane persist but agents.tsx uses local useState. | HIGH | RESOLVED — agents.tsx uses useStreamingChat + conversation API, messages in DB | S03 |
| G2 | No `instructions` column on agents table. Only `description` exists. | MEDIUM | RESOLVED — column exists in schema | S02 |
| G3 | No system prompt architecture defined. AI gives generic responses without org/dealership/role context. | HIGH | RESOLVED — system prompt built with org/dept/user/agent/knowledge/sync context (routes.ts L1310-1353) | S03 |
| G4 | Streaming UI component doesn't exist. Chat renders complete messages, needs streaming token append. | MEDIUM | RESOLVED — useStreamingChat hook + MarkdownMessage with isStreaming prop | S03 |
| G5 | Extended thinking API complexity. Needs specific API params and UI parsing of thinking blocks. | MEDIUM | DECIDED — deferred per plan | S03 |
| G6 | Conversation history context window. Long conversations will hit token limits. | LOW | RESOLVED — last 20 messages truncation implemented | S03 |
| G7 | Error handling for AI failures. Rate limits, server errors, content filters leave UI broken. | MEDIUM | RESOLVED — error state + retry button in all 3 chat UIs, server catches/streams errors | S03 |
| G8 | Which Claude model? Not specified. Affects cost and quality. | LOW | RESOLVED — claude-sonnet-4-6 in use | S03 |
| G9 | Agent createdBy field. No column, hardcoded string in seed. Repurposed for managerial tracking. | LOW | RESOLVED — createdBy UUID column added (S02) | S02 |

### Sprint 2.2 — User & Org Management

| ID | Gap | Severity | Status | Sprint Target |
|----|-----|----------|--------|---------------|
| G10 | No campaign_recipients table. Can't track per-recipient send status for CSV uploads. | HIGH | RESOLVED — table exists with full CRUD | S02 |
| G11 | File storage destination undefined. Local disk doesn't survive deployments. | HIGH | DECIDED — PostgreSQL now, evaluate R2/B2/Supabase (Q5) | S04 |
| G12 | Add User needs org assignment for super_admin/partner_admin roles. | MEDIUM | OPEN | S04 |
| G13 | Password validation rules undefined. No min length or complexity. | LOW | RESOLVED — min length 6 enforced in routes.ts | S04 |
| G14 | Profile photo persistence. No profilePhotoUrl column, no storage for photos. | MEDIUM | RESOLVED (schema) — profilePhotoUrl column exists. Storage TBD. | S04 |
| G15 | Profile edit demo mode disconnect. Button shows toast despite working API route. | LOW | RESOLVED — profile edit uses real mutation, no demo toast | S04 |
| G16 | Knowledge base upload scope undefined. File storage vs RAG indexing unclear. | MEDIUM | RESOLVED — files stored via multer memoryStorage + content in DB. Documents injected into AI system prompt. | S04 |

### Sprint 2.3 — Real Metrics & Dashboard Wiring

| ID | Gap | Severity | Status | Sprint Target |
|----|-----|----------|--------|---------------|
| G17 | Sales metrics already partially wired. Need audit of what's computed vs hardcoded. | LOW | DECIDED — awaiting VinSolutions probe (Q9) | S05 |
| G18 | Service metrics data sources undefined. Which tiles show what? | MEDIUM | OPEN | S05 |
| G19 | Marketing metrics overlap with service. Both have campaigns. | MEDIUM | OPEN | S05 |
| G20 | Management metrics are stubs (revenue, MRR). No real financial data source. | HIGH | DECIDED — compute from available data, remove rest (Q6) | S05 |
| G21 | Tile detail modals sub-data undefined. What breakdown appears on click? | MEDIUM | OPEN | S05 |
| G22 | Main page role-based tile mapping unclear. Which role sees which tiles? | MEDIUM | OPEN | S05 |

### Sprint 3.1 — Outbound Communication Engine

| ID | Gap | Severity | Status | Sprint Target |
|----|-----|----------|--------|---------------|
| G23 | No campaign_recipients table (duplicate of G10). | CRITICAL | RESOLVED — duplicate of G10, table exists | S02 |
| G24 | No background job system. Campaign sends need timed processing. | HIGH | DECIDED — in-memory queue + setInterval (Q14) | S06 |
| G25 | Configured send interval undefined. No sendIntervalSeconds column. | MEDIUM | RESOLVED — sendIntervalSeconds column exists (default 60) | S06 |
| G26 | No message templating system. Campaigns need variable substitution. | HIGH | RESOLVED — substituteTemplate() built with {{customerName}}, {{dealershipName}} | S06 |
| G27 | TCPA/CAN-SPAM compliance missing. No opt-out in SMS, no unsubscribe in email. | HIGH | DECIDED — Reply STOP in every SMS, unsubscribe in email (Q27) | S06 |
| G28 | TextMagic/Resend API keys not provisioned. | BLOCKER | DECIDED — user provides when ready (Q28) | S06 |
| G29 | Test protocol for live messaging undefined. Risk of accidental mass send. | HIGH | DECIDED — dry run mode + loopback test (Q11) | S06 |
| G30 | Communication gate middleware doesn't exist. Boolean saved but not enforced. | MEDIUM | RESOLVED — checkCommGate() in outbound.ts checks org.outboundEnabled + channel flags | S06 |

### Sprint 3.2 — Webhooks & Real-Time

| ID | Gap | Severity | Status | Sprint Target |
|----|-----|----------|--------|---------------|
| G31 | No notifications table in schema. | HIGH | RESOLVED — table exists with CRUD routes | S02 |
| G32 | No activity_log table in schema. | HIGH | RESOLVED — table exists with API route | S02 |
| G33 | Webhook authentication missing. VAPI/Tavus need verification. | HIGH | OPEN | S07 |
| G34 | VAPI webhook URL not configured in VAPI dashboard. | MEDIUM | OPEN | S07 |
| G35 | SSE connection management. Reconnection logic needed. | MEDIUM | OPEN | S07 |
| G36 | Notification trigger events undefined. No clear list. | MEDIUM | OPEN | S07 |

### Sprint 3.3 — Intelligence Engine

| ID | Gap | Severity | Status | Sprint Target |
|----|-----|----------|--------|---------------|
| G37 | 34 metrics in library, not 91. Mismatch with criteria. | MEDIUM | DECIDED — reconcile with VinSolutions probe (Q9) | S08 |
| G38 | Computed data for charts needs time-series data that may not exist. | HIGH | OPEN | S08 |
| G39 | Hunch generation cost. Claude calls on schedule could be expensive. | MEDIUM | OPEN | S08 |
| G40 | "Real reports" is vague. No definition of what a report is. | HIGH | OPEN | S08 |
| G41 | Red zone alerts data source. Need lead age tracking from VinSolutions. | MEDIUM | DECIDED — VinSolutions last activity > X days (G41) | S08 |

### Sprint 4.1 — Widget Backend & Calendar

| ID | Gap | Severity | Status | Sprint Target |
|----|-----|----------|--------|---------------|
| G42 | Widget schema doesn't exist. No widgets table. | HIGH | RESOLVED — widgets table + CRUD routes exist | S09 |
| G43 | Embed code — what does it load? iframe vs script vs web component. | HIGH | DECIDED — most usable approach (Q13) | S09 |
| G44 | Landing page serving architecture. Must survive moving off Replit. | MEDIUM | DECIDED — portable architecture (G44) | S09 |
| G45 | Google Calendar OAuth complexity. Significant integration work. | HIGH | DECIDED — leave stubbed (G45) | S12 |
| G46 | My Work tasks — no table. Need tasks CRUD. | MEDIUM | RESOLVED — tasks table + CRUD routes exist. Page needs API wiring. | S09 |

### Sprint 4.2 — Security, Performance & E2E

| ID | Gap | Severity | Status | Sprint Target |
|----|-----|----------|--------|---------------|
| G47 | RLS on Replit Postgres. May not support RLS policies. | HIGH | OPEN | S12 |
| G48 | Mock data vs static data distinction. Criteria says zero mock files. | MEDIUM | DECIDED — all static arrays replaced with API calls (G48) | S10 |
| G49 | Billing/metering scope undefined. What are we metering? | HIGH | OPEN | S12 |
| G50 | E2E test coverage scope. How many tests, which flows? | MEDIUM | DECIDED — derive from UI audit + AC (Q50) | S12 |

---

## PART 3: Below-the-Line Backend Gaps

| ID | Gap | Current State | Severity | Status | Sprint Target |
|----|-----|---------------|----------|--------|---------------|
| B1 | No `instructions` column on agents table | Local React state only | HIGH | RESOLVED — column exists | S02 |
| B2 | No `systemPrompt` column on agents table | Not in any sprint | HIGH | RESOLVED — column added (S02) | S02 |
| B3 | No `campaign_recipients` table | Aggregate counts only | HIGH | RESOLVED — table exists with CRUD | S02 |
| B4 | No `notifications` table | Static frontend arrays | HIGH | RESOLVED — table + routes exist | S02 |
| B5 | No `activity_log` table | Static frontend arrays | HIGH | RESOLVED — table + route exist | S02 |
| B6 | No `widgets` table | Local React state | HIGH | RESOLVED — table + CRUD routes exist | S09 |
| B7 | No `tasks` table | Hardcoded mocks | HIGH | RESOLVED — table + CRUD routes exist | S09 |
| B8 | No `usage_log` / billing table | No tracking | HIGH | RESOLVED — usage_events table exists | S12 |
| B9 | Agent `createdBy` field missing | Hardcoded seed string | LOW | RESOLVED — column added (S02) | S02 |
| B10 | Soft delete missing for agents | Hard delete only | LOW | OPEN | S12 |
| B11 | Session cleanup missing | Expired sessions accumulate | LOW | OPEN | S12 |
| B12 | Concurrent editing — no optimistic locking | No locking | LOW | OPEN | S12 |
| B13 | 10 remaining demo mode toasts | Settings(3: tool toggle, URL add, URL scrape), Profile(2: invoice view), Billing(3: send/addon/preview), AgentConfig(2: triggers) | HIGH | OPEN — reduced from 14+, remaining are genuinely unbuilt features | S10 |
| B14 | Profile edit button disconnected | Shows toast despite working API | LOW | RESOLVED — profileMutation wired, inline edit works | S04 |
| B15 | AgentConfigPane triggers/tools/skills/knowledge hardcoded | Tools from static list, 2 trigger buttons show demo toast. Instructions wired to DB. | MEDIUM | OPEN — cosmetic, non-blocking for chat quality | S10 |

---

## PART 4: UI Behavior Issues

| ID | Area | Issue | Severity | Status | Sprint Target |
|----|------|-------|----------|--------|---------------|
| U1 | Favorites section | 20+ favorites push Chat History off-screen. No scroll cap. | MEDIUM | DECIDED — capped ScrollArea (Q17) | S10 |
| U2 | Error handling | Almost no isError handling. Failed API calls leave UI in loading state. | HIGH | DECIDED — per-query error states + retry (Q18) | S10 |
| U3 | Activity feed duplication | TopBar dropdown + Management Activities tab show same data. | LOW | OPEN — by design, needs documentation | S10 |
| U4 | TeamBox cardinal rule exception | Uses own 4-column layout, ignores global RightPane. | LOW | OPEN — by design, needs documentation | S10 |
| U5 | Agent status toggle | No disable during mutation. Rapid clicks fire multiple PATCH requests. | MEDIUM | DECIDED — disable during pending (Q20) | S10 |
| U6 | Mobile TeamBox | Status filter and customer info hidden on small screens. | MEDIUM | DECIDED — mobile filter drawer (Q21) | S12 |
| U7 | Tab accessibility | Department tab buttons lack role="tab" and aria-selected. | LOW | DECIDED — add ARIA (Q22) | S12 |
| U8 | Login error display | AuthContext stores errors but login page may not display clearly. | LOW | OPEN | S10 |
| U9 | localStorage role stale | Role persists in localStorage even if changed on backend. | MEDIUM | DECIDED — override from server (Q19) | S10 |
| U10 | Dashboard empty state | New org with no data sees "0" tiles. No onboarding guidance. | LOW | DECIDED — remove metrics without data (Q23) | S05 |
| U11 | Profile sub-routes | Sub-routes may not map to specific tabs. | LOW | DECIDED — verify and wire (Q24) | S04 |
| U12 | RightPane mobile overlay | Covers entire screen, can't reference main content. | MEDIUM | OPEN | S12 |
| U13 | AppContext org fallback | Hardcoded org flash during loading. | LOW | OPEN | S10 |

---

## Standing Directives (from stakeholder review)

1. TeamBox needs departmental filter + RBAC
2. Campaign segmentation in TeamBox — grouped dropdown filter by department
3. Environment variables tracked — maintain manifest for future Railway deployment
4. Supabase migration planned — PostgreSQL now, keep schema compatible
5. VAPI/Tavus prompts are vendor-side — read only, no bidirectional MCP
6. Never use the word "MVP" in code, comments, UI, or docs
7. Metrics storage separate from CRM — agents must specify data source
8. "Reply STOP to opt out" in every outbound SMS (single message). Unsubscribe in every email
9. All mock data must be eliminated — no fake data, remove metric if no real source
10. All testing built from UI audit + acceptance criteria — no ad-hoc test plans
11. Task assignment: agents (AI) or self-assigned only. No user-to-user
12. TeamBox campaign filter: simple dropdown with department sub-groups
13. VinSolutions is Lead Management tier — read/query only, forked local data store
14. VinSolutions sync: one-time bulk pull, daily delta, 4h business-hours refresh
15. Data provenance / Context Router — every data point has known source, AI states provenance
16. Insight history — hunches memorialized over time for trend analysis

---

## Coverage Summary

| Category | ID Range | Count |
|----------|----------|-------|
| Hidden Gaps (look done, aren't) | H1-H17 | 17 |
| Sprint Gaps | G1-G50 | 50 |
| Below-the-Line Backend | B1-B15 | 15 |
| UI Behavior Issues | U1-U13 | 13 |
| **Total** | | **95** |

Source: acceptance_criteria_audit.md (2026-03-05), now archived at archive/acceptance_criteria_audit.md.archive
