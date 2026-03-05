# Nexxus Connect — Sprint Log

**Project:** Nexxus Connect (AI-Powered Dealership Management Platform)
**Client:** Serra Auto Group / Cage Automotive
**Sprint Workflow:**
1. Agent describes the sprint (task + functionality outcome + acceptance criteria touched)
2. Sprint is memorialized here in this log
3. User gives go-ahead
4. Agent codes it
5. Architect reviews sprint log + acceptance criteria
6. If pass → user optionally reviews. If fail → fix and re-review.
7. Agent reports percentage complete
8. Repeat from step 1

---

## Completion Tracker

| Wave | Sprint | Status | % Done After |
|------|--------|--------|--------------|
| 0 | Setup & UI Prototype | DONE | — |
| 1 | API Wiring & Data Sources | DONE | — |
| 2.1 | AI Chat & Conversation Engine | DONE | ~30% |
| 2.2a | User CRUD + Password Mgmt | DONE | ~33% |
| 2.2b | File Uploads (KB, CSV, Photos) | NOT STARTED | — |
| 2.3 | Real Metrics & Dashboard Wiring | NOT STARTED | — |
| 3.1 | Outbound Communication Engine | NOT STARTED | — |
| 3.2 | Webhooks & Real-Time | NOT STARTED | — |
| 3.3 | Intelligence Engine | NOT STARTED | — |
| 4.1 | Widget Backend & Calendar | NOT STARTED | — |
| 4.2 | Security, Performance & E2E | NOT STARTED | — |

**Overall Progress: ~33%** (Waves 0-1 complete, Wave 2.1-2.2a done)

---

## Sprint History

### Wave 0 — Setup & UI Prototype
**Status:** COMPLETE
- Full UI prototype with persona-based navigation (7 sidebar sections)
- PostgreSQL database: 9 tables
- JWT auth with access/refresh tokens, RBAC (8 roles)
- All pages rendered with mock data

### Wave 1 — API Wiring & Data Sources
**Status:** COMPLETE
- All department pages wired to real API data (zero mock imports in production code)
- TeamBox with real conversation persistence
- Settings with real user management
- Read-only vendor integrations: VAPI, Tavus, VinSolutions (MCP)
- VinSolutions dealer provisioning for all 3 Serra dealerships
- 6 RBAC test accounts created and verified
- Campaign list/update with kill switch persistence
- Profile editing with database persistence

---

## Upcoming Sprints

### Sprint 2.1 — AI Chat & Conversation Engine
**Functionality Outcome:** The main chat interface and agent chat produce real AI responses instead of fake typing indicators. Messages persist to the database and survive page reload. When chatting with a specific agent, the AI responds with that agent's personality and instructions.

**What gets wired:**
- Main page center chat (currently shows typing dots then a canned response)
- Right pane assistant chat (same pattern)
- Agent-specific chat on /agents page (same pattern, but agent-aware)
- Thinking/reasoning cards (collapsible display of AI reasoning steps)

**Acceptance Criteria Touched:**
- [ ] User sends a message in main chat, gets a real AI response streamed in
- [ ] Messages persist to the conversations/messages tables and survive page reload
- [ ] Right pane chat produces real AI responses
- [ ] Agent chat uses the selected agent's description/instructions as context
- [ ] Thinking steps are visible in collapsible cards during AI response
- [ ] Chat input shows real streaming text (not a delayed fake response)

**Blocker:** ~~Needs a Claude/Anthropic API key~~ RESOLVED — Replit AI Integrations (Anthropic) installed. API key verified working (claude-sonnet-4-6).

---

### Sprint 2.2a — User CRUD + Password Management
**Status:** COMPLETE
**Functionality Outcome:** Admins can create, edit, and deactivate users from Settings. Password change (self) and admin password reset work. RBAC enforced — can't modify users with higher privileges.

**What was built:**
- `GET /api/roles` — returns all roles for role dropdown
- `POST /api/users` — create user with role, email uniqueness validation, password min-length 6, bcrypt hashing
- `PATCH /api/users/:id` — update firstName/lastName/roleId/isActive; RBAC: can't modify higher-privilege users
- `POST /api/users/:id/reset-password` — admin resets user password; RBAC enforced; invalidates target sessions
- `POST /api/auth/change-password` — user changes own password with current password verification
- Add User dialog in Settings (firstName, lastName, email, password, role dropdown)
- Edit User dialog (firstName, lastName, role dropdown, active/inactive toggle)
- Deactivate user from dropdown menu (sets isActive=false, card dimmed with Inactive badge)
- Reset Password dialog from user dropdown menu
- Change Password dialog in Security settings section
- User search/filter in User Management

**Acceptance Criteria Touched:**
- [x] Settings > User Management: add new user with role assignment
- [x] Settings > User Management: edit user role/status
- [x] Settings > User Management: deactivate user
- [x] Admin can reset a user's password
- [x] User can change own password from Security settings
- [x] RBAC prevents privilege escalation (can't modify/reset higher-privilege users)

**Architect Review:** PASSED (3 issues found and fixed — privilege escalation RBAC check, password min-length on create, target role level check on reset)
**E2E Tests:** PASSED (add user, edit user, deactivate user, search filter)

---

### Sprint 2.2b — File Uploads (Knowledge Base, CSV, Profile Photos)
**Functionality Outcome:** File uploads (knowledge base, campaign CSV, profile photos) actually store files instead of showing "demo mode" toasts.

**Acceptance Criteria Touched:**
- [ ] Knowledge base: upload, list, delete documents
- [ ] Campaign CSV upload populates recipient count
- [ ] Profile photo upload shows real image

**Blocker:** File storage strategy decision (local disk vs cloud).

---

### Sprint 2.3 — Real Metrics & Dashboard Wiring
**Functionality Outcome:** Dashboard tiles across all department pages show computed values from real data sources (VinSolutions, conversation counts, campaign stats) instead of hardcoded numbers.

**Acceptance Criteria Touched:**
- [ ] Sales dashboard tiles show real VinSolutions lead numbers
- [ ] Service dashboard tiles show real campaign/message metrics
- [ ] Marketing dashboard tiles show real campaign performance
- [ ] Management dashboard shows cross-department aggregates
- [ ] Main page role-based tiles pull from appropriate data source
- [ ] Clicking a tile shows breakdown modal with real sub-data

**Blocker:** VinSolutions MCP data quality (some metrics may need stubs).

---

### Sprint 3.1 — Outbound Communication Engine
**Functionality Outcome:** The platform can actually send SMS and email. The communication gate and per-campaign kill switches enforce real control over message sending.

**Acceptance Criteria Touched:**
- [ ] SMS sends via TextMagic API
- [ ] Email sends via Resend API
- [ ] Communication gate toggle prevents/allows all outbound
- [ ] Campaign execution sends to all recipients over configured interval
- [ ] Kill switch stops campaign mid-execution
- [ ] Disconnecting a conversation stops future campaign messages

**Blocker:** TextMagic API key, Resend API key needed.

---

### Sprint 3.2 — Webhooks & Real-Time
**Functionality Outcome:** Inbound events from VAPI and Tavus automatically create records. Notifications and activity feeds are live and event-driven instead of static.

**Acceptance Criteria Touched:**
- [ ] VAPI call events create conversations in TeamBox
- [ ] Tavus video session events create records
- [ ] TopBar bell shows real notification count
- [ ] Activity feeds show real events (user created, campaign started, etc.)
- [ ] New messages appear in TeamBox without page refresh (SSE)

**Blocker:** VAPI webhook URL config, Tavus webhook secret.

---

### Sprint 3.3 — Intelligence Engine
**Functionality Outcome:** AI-generated insights replace static hunches. Metrics library computes real values. Reports and red zone alerts are data-driven.

**Acceptance Criteria Touched:**
- [ ] Management > Hunches shows AI-generated pattern/recommendation pairs
- [ ] Hunches refresh on schedule with lifecycle tracking
- [ ] Insights charts show computed data
- [ ] Reports tab shows real reports
- [ ] Red zone alerts identify cold leads and overdue follow-ups
- [ ] Metrics library shows 91 metrics with real values where available

**Blocker:** Sufficient VinSolutions data volume for meaningful insights.

---

### Sprint 4.1 — Widget Backend & Calendar
**Functionality Outcome:** Widget configuration persists and generates real embed codes. Calendar integration shows real appointments. My Work task list persists.

**Acceptance Criteria Touched:**
- [ ] Widget CRUD persists to database
- [ ] Embed code generation works (copy → paste in HTML → loads)
- [ ] Landing pages serve from widget config
- [ ] Calendar shows real appointments (Google Calendar OAuth)
- [ ] My Work: add/complete/delete tasks persists

**Blocker:** Google Calendar OAuth setup.

---

### Sprint 4.2 — Security, Performance & E2E
**Functionality Outcome:** Production hardening. Row-level security, rate limiting, input validation, full E2E test suite, all mock data removed.

**Acceptance Criteria Touched:**
- [ ] RLS policies enforce multi-tenancy at DB level
- [ ] API rate limiting (100 req/min per user)
- [ ] All input validated and sanitized
- [ ] Zero mock files remain in codebase
- [ ] Full Playwright E2E suite passes
- [ ] API p95 < 200ms, LCP < 2.5s
- [ ] Billing/metering foundation tracks usage

---

## Sprint Execution Log

### Sprint 2.1a — AI Chat Engine
**Date:** 2026-03-05
**Status:** COMPLETE

**What was built:**
- `POST /api/chat/:conversationId/stream` — SSE streaming endpoint using Anthropic SDK (claude-sonnet-4-6)
- `useStreamingChat` hook — reusable client-side SSE consumer with abort cleanup, trailing buffer handling
- `instructions` text column added to agents table for agent-specific system prompts
- System prompt template with org name, persona name, user name/role, department context, agent instructions, safety guardrails (no PII, no fabricated data)
- Agent org validation on agentId parameter (access control)
- Main page chat (main.tsx) wired to real streaming — replaces setTimeout mock
- Right pane chat (RightPane.tsx) wired to real streaming — replaces setTimeout mock
- Agent chat (agents.tsx) wired to real streaming with conversation persistence per-agent — replaces local state + setTimeout mock

**Acceptance Criteria Results:**
- [x] User sends a message in main chat, gets a real AI response streamed in
- [x] Messages persist to the conversations/messages tables and survive page reload
- [x] Right pane chat produces real AI responses
- [x] Agent chat uses the selected agent's description/instructions as context
- [x] Chat input shows real streaming text (not a delayed fake response)
- [ ] Thinking steps are visible in collapsible cards during AI response (ThinkingCard component exists but extended thinking not yet enabled — requires Anthropic API support for thinking blocks)

**Architect Review:** Passed after fixes for agent org validation, senderName for agent chats, abort cleanup in hook, trailing SSE buffer handling, and prompt safety guardrails.

**E2E Tests:** Passed — main page streaming + right pane streaming verified.

