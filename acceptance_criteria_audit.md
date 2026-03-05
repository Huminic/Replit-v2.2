# Acceptance Criteria Audit — Devil's Advocate Review

**Date:** 2026-03-05
**Purpose:** Identify gaps, misinterpretations, and missing criteria across all sprints by reconciling the acceptance criteria against what's actually built (UI + backend).

---

## PART 1: What's Actually Built vs. What We Think Is Built

### Things that LOOK done but have hidden gaps

| Area | What it looks like | What's actually happening | Risk |
|------|--------------------|--------------------------|------|
| **Main page chat** | User sends message, sees typing dots, gets response | Response is a hardcoded string after a 1.5s setTimeout. Bot reply IS persisted to DB though. | Sprint 2.1 will fix this, but the acceptance criteria says "messages persist and survive page reload" — that part already works for main chat. The gap is AI response, not persistence. |
| **RightPane chat** | Same pattern — typing dots, response | Same fake response, same 1.5s delay. Also persists to DB. | Same as above. |
| **Agent chat (/agents page)** | Typing dots, response | **DOES NOT persist to database at all.** Messages are in React useState only. Lost on page refresh. | Sprint 2.1 criteria says "messages persist" but agents.tsx doesn't even call the conversation API. This is a bigger lift than main/right pane. |
| **Agent instructions edit** | AgentConfigPane has an "Instructions" tab with edit modal | **No `instructions` column on agents table.** Edit modal saves to local React state only. Lost on refresh. | Sprint 2.1 says "agent chat uses agent description/instructions as context" — but there's no instructions field to pull from. Only `description` exists in DB. |
| **Campaign kill switch** | Toggle in campaign table, shows red when ON | Persists to DB via `PATCH /api/campaigns/:id`. But no backend enforcement — nothing actually stops sending because nothing sends yet. | Sprint 3.1 acceptance says "kill switch stops campaign mid-execution" but there's no execution engine to stop. Need to build both together. |
| **Communication gate** | Toggle in Settings > Organization | Persists `outboundEnabled` to org table. But no middleware checks it before sending. | Same issue — the gate saves a boolean, but nothing reads it to block outbound. |
| **Campaign disconnect** | "Disconnect" button in TeamBox sets `campaignDisconnected=true` | Persists to DB. But again, no sending engine checks this flag. | Works as far as saving the flag. Enforcement comes in Sprint 3.1. |
| **User Management** | Shows real users from API | Can't create, edit, or delete users. All three actions show "demo mode" toasts. | Sprint 2.2 must wire all three CRUD operations. |
| **Profile editing** | Edit profile button exists | Shows "demo mode" toast! Despite the fact that `PATCH /api/users/me` route exists and works for contact info. | The route works but the UI doesn't use it for the full profile edit flow. Only specific fields (contact info) are wired. |
| **Widgets** | Rich config UI with preview, embed codes, targeting | 100% local React state from `staticWidgets`. Nothing persists. No backend routes. | Sprint 4.1 must build entire backend. |
| **Knowledge Base** | Upload UI, document list, web scraping | 100% hardcoded table rows. All buttons show "demo mode" toasts. | Sprint 2.2 must build entire backend. |
| **My Work** | Tasks list with status, priority, due dates | 100% hardcoded `mockMyTasks`. No backend. | Sprint 4.1 must build entire backend. |
| **Dashboard metrics** | KPI tiles on every department page | Sales tiles now show VinSolutions data (via `/api/vin/leads/summary`). Service/Marketing tiles are still hardcoded. Management tiles all hardcoded. | Sprint 2.3 must compute real metrics for non-sales pages. |
| **Insights page** | Charts, metrics library, red zone alerts | 100% from `insight-data.ts` static arrays. 34 metrics shown but none computed. | Sprint 3.3 must build computation engine. |
| **Hunches** | AI insight cards with confidence scores | Hardcoded `mockHunches` array. No AI generation. | Sprint 3.3 must build generation pipeline. |
| **Notifications** | Bell icon in TopBar with count badge | Static `staticNotifications` array. No notification table in DB. | Sprint 3.2 must build entire system. |
| **Activity feeds** | Activity timeline in Management page | Static `staticActivityFeed` array. No activity_log table. | Sprint 3.2 must build entire system. |

---

## PART 2: Sprint-by-Sprint Acceptance Criteria Gaps

### Sprint 2.1 — AI Chat & Conversation Engine

**Current criteria:**
1. User sends a message in main chat, gets a real AI response streamed in
2. Messages persist to the conversations/messages tables and survive page reload
3. Right pane chat produces real AI responses
4. Agent chat uses the selected agent's description/instructions as context
5. Thinking steps are visible in collapsible cards during AI response
6. Chat input shows real streaming text (not a delayed fake response)

**Gaps identified:**

| # | Gap | Impact | Suggestion |
|---|-----|--------|------------|
| G1 | **Agent chat has NO database persistence.** Main chat and RightPane already persist. Agent chat uses local useState — messages vanish on refresh. Criteria #2 is already met for main/right but NOT for agents. | HIGH — if we wire AI responses to agent chat but don't add persistence, agent conversations are disposable. | Add explicit criterion: "Agent chat creates/resumes a conversation via API, same as main chat. Agent conversation messages persist to DB." |
| G2 | **No `instructions` column on agents table.** Criteria #4 says "uses agent description/instructions as context" but only `description` exists in the schema. | MEDIUM — we can use `description` alone as system prompt context, but the user expects editable instructions that persist. | Either: (a) add `instructions` text column to agents table now, or (b) clarify that description = instructions for now and defer editable instructions to Sprint 2.2. |
| G3 | **No system prompt architecture defined.** What does the AI's system prompt look like? Does it know it's a dealership assistant? Does it get dealership name, org context, user role? | HIGH — without a clear system prompt, the AI will give generic responses that don't feel like a dealership tool. | Add criterion: "System prompt includes: org name, dealership context, user role, and (for agent chat) agent name + description. AI responses are contextually appropriate." |
| G4 | **Streaming UI component doesn't exist yet.** Current chat renders complete messages. Need a streaming text component that appends tokens as they arrive. | MEDIUM — this is implied by criteria #6 but not called out as a build task. | Ensure the sprint plan includes building a StreamingMessage component or equivalent. |
| G5 | **Extended thinking has API complexity.** Claude's extended thinking requires specific API parameters (`thinking` block in the request) and returns `thinking` content blocks separate from `text` blocks. The UI needs to parse both. | MEDIUM — criteria #5 says "thinking steps visible" but doesn't acknowledge the implementation complexity. | Add detail: "Use Claude's extended thinking feature. Parse thinking blocks from the response stream and render in collapsible cards above the text response." |
| G6 | **Conversation history context window.** If a conversation gets long, sending all messages as context will hit token limits. | LOW for now — but matters at scale. | Add criterion: "Conversation context is truncated to last N messages (e.g., 20) to stay within token limits." |
| G7 | **Error handling for AI failures.** What happens when Claude returns an error (rate limit, server error, content filter)? | MEDIUM — users will see broken UI if errors aren't handled. | Add criterion: "AI errors display a user-friendly error message in the chat, not a blank or broken state." |
| G8 | **Which Claude model?** Criteria doesn't specify. claude-sonnet-4-6 for speed? claude-opus-4-6 for quality? Different models for different contexts? | LOW — but affects cost and quality. | Recommend: claude-sonnet-4-6 for main/right pane chat (speed), configurable per agent for agent chat. |
| G9 | **Agent chat "createdBy" field.** Agent schema has no `createdBy` column, but agents.tsx displays `selectedAgent.createdBy` in the header. Currently comes from seed data string. | LOW — cosmetic but could cause confusion. | This is a display issue, not a Sprint 2.1 blocker. Note for Sprint 2.2. |

---

### Sprint 2.2 — User & Org Management

**Current criteria:**
1. Settings > User Management: add new user with role assignment
2. Settings > User Management: edit user role/status
3. Settings > User Management: deactivate user
4. Admin can reset a user's password
5. User can change own password from profile
6. Knowledge base: upload, list, delete documents
7. Campaign CSV upload populates recipient count
8. Profile photo upload shows real image

**Gaps identified:**

| # | Gap | Impact | Suggestion |
|---|-----|--------|------------|
| G10 | **No campaign_recipients table.** CSV upload criteria #7 says "populates recipient count" but where do individual recipients go? Without a recipients table, we can parse CSV and count rows, but can't track per-recipient send status. | HIGH — Sprint 3.1 (campaign execution) needs per-recipient tracking. If we build CSV upload without the table, we'll have to rebuild it. | Add `campaign_recipients` table now (phone, email, status, sentAt, campaignId). CSV upload should populate this table AND update recipientCount. |
| G11 | **File storage destination undefined.** Criteria #6-8 require file uploads but where do files go? Local disk? Cloud storage? | HIGH — local disk doesn't survive Replit deployments reliably. | Recommend: Use Replit Object Storage or a cloud solution. Decision needed before coding. |
| G12 | **"Add User" needs org assignment.** Current UI shows users for one org. When super_admin creates a user, which org do they belong to? | MEDIUM — need org selection in the add user form, or default to current org. | Add criterion: "Add user form includes org selection for super_admin/partner_admin roles, defaults to current org for org_admin." |
| G13 | **Password validation rules undefined.** What makes a valid password? Min length? Complexity? | LOW — but matters for production. | Add criterion: "Passwords must be at least 8 characters." |
| G14 | **Profile photo persistence.** Where does the photo file go? How does the UI reference it? The current Avatar component uses initials, not images. | MEDIUM — needs both storage and a `profilePhotoUrl` column on users. | Add `profilePhotoUrl` column to users table. Avatar component must check for photo URL before falling back to initials. |
| G15 | **Profile edit "demo mode" disconnect.** The Profile page has an "Edit Profile" button that shows a demo toast, even though `PATCH /api/users/me` exists and works. Contact info editing works but the main edit button doesn't. | LOW — confusing UX but not blocking. | Wire the Edit Profile button to enable inline editing of name, email, phone fields. |
| G16 | **Knowledge base — what does "upload" mean?** Is this storing files for RAG? Just listing filenames? What format? | MEDIUM — "upload, list, delete documents" is vague. No AI processing is implied but the UI shows "indexed" status. | Clarify: files are stored and metadata listed. Actual RAG indexing is Sprint 3.3 or later. |

---

### Sprint 2.3 — Real Metrics & Dashboard Wiring

**Current criteria:**
1. Sales dashboard tiles show real VinSolutions lead numbers
2. Service dashboard tiles show real campaign/message metrics
3. Marketing dashboard tiles show real campaign performance
4. Management dashboard shows cross-department aggregates
5. Main page role-based tiles pull from appropriate data source
6. Clicking a tile shows breakdown modal with real sub-data

**Gaps identified:**

| # | Gap | Impact | Suggestion |
|---|-----|--------|------------|
| G17 | **Sales metrics already partially wired.** Sales tiles use `leadSummary` from `/api/vin/leads/summary`. Criteria #1 may already be met. | LOW — verify what's there before rebuilding. | Audit which sales tiles are already computed vs still hardcoded. |
| G18 | **Service metrics — what are the real data sources?** "Campaign/message metrics" is vague. Count of active campaigns? Total sentCount across campaigns? Average reply rate? | MEDIUM — without specific tile definitions, we might compute the wrong things. | Define exactly which tiles: active campaigns count, total messages sent, total replies, reply rate, active conversations count, avg response time. |
| G19 | **Marketing metrics overlap with service.** Both departments have campaigns. How do marketing metrics differ? | MEDIUM — could compute same thing twice. | Marketing adds: widget interaction count (stub until widget backend), landing page visits (stub), plus campaign metrics. |
| G20 | **Management metrics are cross-department aggregates.** Some are inherently stubs (revenue, MRR, customer satisfaction). | HIGH — "real data" is impossible for revenue/MRR without actual financial transactions. | Criteria should say "computed where data source exists, clearly marked as stub where not." Don't promise real revenue numbers. |
| G21 | **Tile detail modals — what's the "sub-data"?** When you click a KPI tile, what breakdown rows appear? | MEDIUM — without definition, we'll have to invent what to show. | Define per tile: e.g., "Total Leads" → list of recent leads with name/status/date. "Active Campaigns" → campaign list with sent/replied counts. |
| G22 | **Main page role-based tiles.** The main page shows different metrics per role. How does this work? Sales_staff sees sales KPIs, service_staff sees service KPIs? | MEDIUM — need mapping of role → which tiles to show. | Add criterion: "Role-to-tile mapping: sales roles → sales metrics, service → service, marketing → marketing, admin/exec → management aggregates." |

---

### Sprint 3.1 — Outbound Communication Engine

**Current criteria:**
1. SMS sends via TextMagic API
2. Email sends via Resend API
3. Communication gate toggle prevents/allows all outbound
4. Campaign execution sends to all recipients over configured interval
5. Kill switch stops campaign mid-execution
6. Disconnecting a conversation stops future campaign messages

**Gaps identified:**

| # | Gap | Impact | Suggestion |
|---|-----|--------|------------|
| G23 | **No campaign_recipients table (again).** Campaign execution (#4) needs per-recipient tracking. Which recipients got messages? Which are pending? What's the send status? | CRITICAL — can't execute campaigns without this. | Must build `campaign_recipients` table in Sprint 2.2 (with CSV upload). |
| G24 | **No background job system.** "Sends to all recipients over configured interval" implies a job that runs over time, not a single API call. How does this work in Replit's environment? | HIGH — Replit doesn't have a built-in job scheduler. Need a solution (setInterval? in-memory queue? persistent queue?). | Recommend: In-memory queue with setInterval for MVP. Campaign execution starts a timer-based sender that processes one recipient at a time. State tracked in campaign_recipients table. |
| G25 | **"Configured interval" undefined.** What interval? 1 message per minute? Per hour? Configurable per campaign? | MEDIUM — affects UX and deliverability. | Add `sendIntervalSeconds` column to campaigns table. Default: 60 seconds between sends. |
| G26 | **No message templating system.** Campaign messages need templates with variables (customer name, dealership name, etc.). Where do templates come from? | HIGH — without templates, what text gets sent? | Add `messageTemplate` text column to campaigns. Support {{customerName}}, {{dealershipName}} variables. |
| G27 | **TCPA/CAN-SPAM compliance.** Outbound SMS and email have legal requirements (opt-out mechanism, sender identification). | HIGH — production liability. | Add criterion: "Every outbound SMS includes opt-out text. Every email includes unsubscribe link. Opted-out contacts are excluded from future sends." |
| G28 | **TextMagic/Resend API keys.** Neither is provisioned. | BLOCKER — can't build without them. | Need to check Replit integrations or request keys from user. |
| G29 | **Test protocol for live messaging.** How do we test without spamming real phones/emails? | HIGH — accidental mass send is a dealership nightmare. | Add criterion: "Dry run mode available. Campaign execution can run in preview mode that logs messages without sending." |
| G30 | **Communication gate middleware.** Currently just a boolean on the org. Need actual middleware that checks it before every outbound call. | MEDIUM — the enforcement mechanism doesn't exist. | Add criterion: "Middleware checks outboundEnabled + channel-specific flags before every SMS/email send. Returns 403 if gate is closed." |

---

### Sprint 3.2 — Webhooks & Real-Time

**Current criteria:**
1. VAPI call events create conversations in TeamBox
2. Tavus video session events create records
3. TopBar bell shows real notification count
4. Activity feeds show real events
5. New messages appear in TeamBox without page refresh (SSE)

**Gaps identified:**

| # | Gap | Impact | Suggestion |
|---|-----|--------|------------|
| G31 | **No notifications table in schema.** Criteria #3 requires real notifications but there's no table to store them. | HIGH — must add table before building. | Add `notifications` table: id, userId, type, title, message, read, createdAt. |
| G32 | **No activity_log table in schema.** Criteria #4 requires real activity feeds but there's no table. | HIGH — must add table before building. | Add `activity_log` table: id, userId, action, entityType, entityId, metadata (jsonb), createdAt. |
| G33 | **Webhook authentication.** VAPI and Tavus webhooks need verification to prevent spoofing. | HIGH — production security risk. | Add criterion: "VAPI webhooks verified via shared secret. Tavus webhooks verified via HMAC signature." |
| G34 | **VAPI webhook URL configuration.** Where do we tell VAPI to send webhooks? Do we need to configure this in the VAPI dashboard? | MEDIUM — we can build the handler but it won't receive events without configuration. | Add criterion: "VAPI webhook URL configured in VAPI dashboard. Document the setup process." |
| G35 | **SSE connection management.** How many concurrent SSE connections can Replit handle? What happens on reconnect? | MEDIUM — SSE connections are long-lived. | Add criterion: "SSE includes reconnection logic with exponential backoff. Client reconnects automatically on disconnect." |
| G36 | **What events trigger notifications?** Undefined. | MEDIUM — need a clear list. | Define: new inbound message, campaign completed, kill switch activated, comm gate toggled, new lead assigned, agent status change. |

---

### Sprint 3.3 — Intelligence Engine

**Current criteria:**
1. Management > Hunches shows AI-generated pattern/recommendation pairs
2. Hunches refresh on schedule with lifecycle tracking
3. Insights charts show computed data
4. Reports tab shows real reports
5. Red zone alerts identify cold leads and overdue follow-ups
6. Metrics library shows 91 metrics with real values where available

**Gaps identified:**

| # | Gap | Impact | Suggestion |
|---|-----|--------|------------|
| G37 | **34 metrics in library, not 91.** The UI currently shows 34 browsable metrics. Where does "91" come from? | MEDIUM — mismatch between criteria and reality. | Audit actual metric count. If 34 is the real number, update criteria to match. |
| G38 | **"Computed data" for charts — from what?** Lead trend charts need historical data. We have VinSolutions leads but no historical tracking. | HIGH — charts need time-series data that may not exist. | Clarify: VinSolutions provides current snapshot, not historical trends. Charts may need to show "last 30 days" from our own conversation/campaign data, with VinSolutions data as supplementary. |
| G39 | **Hunch generation cost.** Each hunch generation calls Claude to analyze data. How often? What's the token cost? | MEDIUM — weekly batch could be expensive. | Add criterion: "Hunch generation is manually triggerable by admin + optional weekly schedule. Cost estimate shown before generation." |
| G40 | **"Real reports" is vague.** What is a "report"? A PDF? A data table? A dashboard view? | HIGH — completely undefined deliverable. | Define: reports are on-screen data views with export-to-CSV option. Not PDFs. Show lead conversion funnel, channel performance comparison, trend analysis. |
| G41 | **Red zone alerts — data source.** "Cold leads" and "overdue follow-ups" need lead age tracking. VinSolutions has lead data but does our system track follow-up dates? | MEDIUM — may need to compute from VinSolutions last activity date. | Clarify: red zone pulls from VinSolutions leads where last status change > X days ago. No internal follow-up scheduling needed for MVP. |

---

### Sprint 4.1 — Widget Backend & Calendar

**Current criteria:**
1. Widget CRUD persists to database
2. Embed code generation works
3. Landing pages serve from widget config
4. Calendar shows real appointments (Google Calendar OAuth)
5. My Work: add/complete/delete tasks persists

**Gaps identified:**

| # | Gap | Impact | Suggestion |
|---|-----|--------|------------|
| G42 | **Widget schema doesn't exist.** No `widgets` table in the database. The UI has a rich config model (channels, targeting, branding, domains). | HIGH — complex table design needed. | Define `widgets` table: id, name, type, channels (jsonb), branding (jsonb), targeting (jsonb), organizationId, status, createdAt. |
| G43 | **Embed code — what does it load?** Does the embed script load a React widget? An iframe? A web component? | HIGH — this is a full sub-application. | Clarify scope: For MVP, embed code generates a simple link to the landing page. Full embeddable widget is a separate project. |
| G44 | **Landing page serving — from where?** `/w/:widgetId` needs to serve a standalone page. Is this the existing Vite app or a separate build? | MEDIUM — affects architecture. | Recommend: serve landing pages from the existing Express server using a simple HTML template + widget config data. Not a separate build. |
| G45 | **Google Calendar OAuth complexity.** Requires OAuth2 flow, token refresh, calendar API integration. | HIGH — significant integration work. | Check if a Replit integration exists for Google Calendar. If not, this is a multi-day task on its own. |
| G46 | **My Work tasks — no table.** Need a `tasks` table: id, userId, title, description, status, priority, dueDate, createdAt. | MEDIUM — straightforward but must be built. | Add to sprint plan explicitly. |

---

### Sprint 4.2 — Security, Performance & E2E

**Current criteria:**
1. RLS policies enforce multi-tenancy at DB level
2. API rate limiting (100 req/min per user)
3. All input validated and sanitized
4. Zero mock files remain in codebase
5. Full Playwright E2E suite passes
6. API p95 < 200ms, LCP < 2.5s
7. Billing/metering foundation tracks usage

**Gaps identified:**

| # | Gap | Impact | Suggestion |
|---|-----|--------|------------|
| G47 | **RLS on Replit Postgres.** Does the managed PostgreSQL support RLS policies? Need to verify. | HIGH — may not be available. | Test: `ALTER TABLE agents ENABLE ROW LEVEL SECURITY` — if it works, proceed. If not, enforce in application layer only. |
| G48 | **Mock data vs static data distinction.** We already renamed mocks to "static" data. Criteria says "zero mock files" but `client/src/mocks/` directory may already be empty. The static data lives in `lib/` files. | MEDIUM — criteria might be met already or might mean something different. | Clarify: does "zero mock files" mean the directory is gone, or that ALL static data arrays are replaced with API calls? The latter is much larger scope. |
| G49 | **Billing/metering — what are we metering?** Voice minutes? SMS count? AI tokens? Per org? Per user? | HIGH — undefined business rules. | Define: track AI token usage (per conversation), SMS count (per org), voice minutes (from VAPI). Store in a `usage_log` table. |
| G50 | **E2E test coverage scope.** "Full Playwright E2E suite" is vague. How many tests? What flows? | MEDIUM — could mean 5 tests or 50. | Define: minimum flows: login, send chat message, view TeamBox, create user, toggle comm gate, campaign kill switch, agent settings. |

---

## PART 3: Below-the-Line Backend Gaps (Not Covered by Any Sprint)

These are real backend gaps that no current sprint addresses:

| # | Gap | Current State | Where It Should Be Addressed |
|---|-----|---------------|------------------------------|
| B1 | **No `instructions` column on agents table** | Agent instructions are local React state only | Sprint 2.1 or 2.2 |
| B2 | **No `systemPrompt` column on agents table** | Wave roadmap mentions this but no sprint includes it | Sprint 2.1 (needed for agent-specific AI chat) |
| B3 | **No `campaign_recipients` table** | Campaigns track aggregate counts but no per-recipient records | Sprint 2.2 (with CSV upload) |
| B4 | **No `notifications` table** | Static arrays in frontend | Sprint 3.2 |
| B5 | **No `activity_log` table** | Static arrays in frontend | Sprint 3.2 |
| B6 | **No `widgets` table** | Local React state from staticWidgets | Sprint 4.1 |
| B7 | **No `tasks` table** | Hardcoded mockMyTasks | Sprint 4.1 |
| B8 | **No `usage_log` / billing table** | No tracking at all | Sprint 4.2 |
| B9 | **Agent `createdBy` field** | Hardcoded string in seed, no column on table | Low priority — cosmetic |
| B10 | **Soft delete missing** | `deleteAgent` does hard delete. Users have `isActive` but agents don't. | Sprint 4.2 |
| B11 | **Session cleanup** | Expired sessions accumulate, no cleanup job | Sprint 4.2 |
| B12 | **Concurrent editing** | No optimistic locking on any record | Sprint 4.2 or defer |
| B13 | **14+ demo mode toasts** | Buttons that show "not available" — need to be wired or removed | Spread across Sprints 2.2, 4.1, 4.2 |
| B14 | **Profile edit button disconnected** | Shows demo toast despite working API route | Sprint 2.2 |
| B15 | **AgentConfigPane triggers/tools/skills/knowledge** | All hardcoded mocks in the component | Sprint 2.2 or 3.3 |

---

## PART 4: Decisions Table (Reviewed 2026-03-05)

All items reviewed by stakeholder. Suggestions accepted unless overridden below. Additional directives integrated.

### Standing Directives (apply globally)
1. **TeamBox needs departmental filter + RBAC** — users only see conversations for departments they have access to
2. **Campaign segmentation in TeamBox** — need clear way to filter/view conversations by campaign
3. **Environment variables tracked** — maintain a manifest of all env vars for future Railway deployment
4. **Supabase migration planned** — PostgreSQL now, Supabase later. No Supabase-specific code yet, but keep schema compatible
5. **VAPI/Tavus prompts are vendor-side** — NO bidirectional MCP yet. We read from vendors, we don't write prompts to them
6. **Never use the word "MVP"** in code, comments, UI text, or documentation
7. **Metrics storage is separate from CRM** — uploaded data lives in its own store. Agents must specify data source. We never auto-trigger based on uploaded metric data
8. **Reply STOP to opt out** must be in every outbound SMS (single message, not two). Unsubscribe link in every email
9. **All mock data must be eliminated** — if we don't have real data for a metric, the metric gets removed from the UI, not shown as zero
10. **All testing is built from UI audit + acceptance criteria** — no ad-hoc test plans

| # | Type | Topic | Original Question | DECISION |
|---|------|-------|-------------------|----------|
| Q1 | DECISION | Agent instructions | Add `instructions` column to agents table? | **YES** — add `instructions` text column now (Sprint 2.1). Use `description` for display, `instructions` for AI system prompt. AgentConfigPane edits persist to DB. |
| Q2 | DECISION | System prompt design | What should the AI know about itself? | **ACCEPTED** — build system prompt template with org/dealership/department/user context. Additionally: include system-level qualia instructions so the chat experience competes with ChatGPT in quality and feel. The AI should feel thoughtful, contextually aware, and emotionally intelligent — not robotic. |
| Q3 | DECISION | Extended thinking | Must-have or nice-to-have for Sprint 2.1? | **ACCEPTED** — defer thinking cards if they slow the sprint. Core AI chat quality is the priority. Chat must be exceptional quality — "give ChatGPT a run for its money." |
| Q4 | DECISION | Campaign recipients | Build campaign_recipients table in Sprint 2.2? | **YES** — build with CSV upload. Sprint 3.1 adds sending engine on top. |
| Q5 | DECISION | File storage | Replit Object Storage or local disk? | **PostgreSQL for now** (Supabase migration planned). For file/blob storage: need a cheap recommendation. Evaluate Cloudflare R2 (free tier: 10GB, no egress fees), Backblaze B2 (free 10GB), or Supabase Storage (since we're migrating there anyway). Decision: choose cheapest option compatible with future Supabase migration. |
| Q6 | DECISION | Revenue/MRR metrics | What to show for revenue/MRR? | **Compute from available data** — derive from VinSolutions lead counts + deal values where available. Additional data will be uploaded to the database through the backend; we compute metrics from CRM data but NOT from uploaded metric data. If no data exists for a metric, remove the metric from UI entirely. |
| Q7 | DECISION | Sprint 2.1 scope | Split 2.1 into sub-sprints? | **ACCEPTED** — split into 2.1a (core AI chat with exceptional quality) and 2.1b (extended thinking, refinement). Quality > features. |
| Q8 | DECISION | Demo mode toasts | Maintain checklist? | **ACCEPTED** — track and eliminate. All must be gone by end of Wave 4. |
| Q9 | DECISION | Metrics count | 91 vs 34 metrics? | **User will provide VinSolutions probe file** for review. Metrics must match what VinSolutions actually provides. Any metrics not backed by that data get removed from the UI. |
| Q10 | DECISION | Agent config persistence | Persist instructions/triggers/tools/skills/knowledge? | **ACCEPTED** — add columns to agents table. Sprint 2.2 or standalone task. |
| Q11 | DECISION | Test protocol for outbound | Sandbox mode for SMS/email? | **ACCEPTED** — build sandbox mode. Additionally: loopback testing to self. If loopback not possible, use 412.654.6500 as the only allowed number until go-live. |
| Q12 | DECISION | Rate limiting for AI chat | Rate limit AI calls? | **ACCEPTED** — max 20 AI messages per user per hour. |
| Q13 | DECISION | Embed code scope | Embed code approach? | **Use the most usable, least problematic approach.** Whatever works reliably — iframe, script tag, or link — pick the one with fewest cross-origin and compatibility issues. Must survive being moved to other web servers. |
| Q14 | DECISION | Background job reliability | In-memory queue for campaigns? | **ACCEPTED** — in-memory queue with setInterval. Resume on restart via campaign_recipients status tracking. |
| Q15 | DECISION | Conversation context | Agent access to dealership data? | **ACCEPTED** — Phase 1: conversation history only. Phase 2 (Sprint 3.3): tool use for data lookup. Agent must specify where it gets data. |
| Q16 | DECISION | Conversation history cap | Cap agent conversations in popout? | **ACCEPTED** — max 10 recent per agent + "View all in TeamBox" link. |
| Q17 | DECISION | Favorites overflow | Fix favorites overflow in AI-Chat panel? | **ACCEPTED** — wrap in capped ScrollArea with "Show all" link. |
| Q18 | DECISION | Error states | Add error handling across app? | **ACCEPTED** — every useQuery handles isError with user-friendly message + retry. Cross-cutting. |
| Q19 | DECISION | Role persistence | Fix stale localStorage role? | **ACCEPTED** — override from server on login + token refresh. |
| Q20 | DECISION | Agent status toggle | Fix race condition? | **ACCEPTED** — disable toggle during mutation. |
| Q21 | DECISION | TeamBox mobile | Add mobile filter drawer? | **ACCEPTED** — defer to Sprint 4.2. |
| Q22 | DECISION | Tab accessibility | Add ARIA attributes? | **ACCEPTED** — add with sprint work, low priority. |
| Q23 | DECISION | Dashboard empty state | Add onboarding empty states? | **ACCEPTED** — but per directive #9: if no data, remove the metric entirely rather than showing "0" or empty guidance. |
| Q24 | DECISION | Profile sub-routes | Wire sub-route to tab mapping? | **ACCEPTED** — verify and wire. |

### Gap Decisions (from Part 2)

| # | Gap | DECISION |
|---|-----|----------|
| G9 | Agent `createdBy` field | **Repurposed** — this is for managerial activity monitoring, not cosmetic. Track who created/modified agents. Add `createdBy` UUID column referencing users. |
| G11 | File storage destination | **PostgreSQL for now** (Supabase migration planned). For blobs: use cheapest S3-compatible option. Evaluate Cloudflare R2, Backblaze B2, or Supabase Storage. Must be compatible with future Supabase migration. |
| G17 | Sales metrics already wired | **User will provide VinSolutions probe file.** Metrics must match what VinSolutions actually returns. Any that don't match get removed. |
| G20 | Management metrics are stubs | **Same as G11** — compute from available data. Remove metrics without data source. |
| G23 | No campaign_recipients table | **Build in Sprint 2.2** alongside CSV upload. |
| G27 | TCPA/CAN-SPAM compliance | **Include "Reply STOP to opt out" in every SMS** — must be in the SAME message (not a second message, which doubles cost). Unsubscribe link in every email. |
| G28 | TextMagic/Resend API keys | **User will provide when it's time.** Not a blocker until Sprint 3.1. |
| G29 | Test protocol for live messaging | **Loopback to self first.** If not possible, use 412.654.6500 as the ONLY allowed recipient until go-live. |
| G37 | 34 vs 91 metrics | **User will provide VinSolutions probe file.** Reconcile metrics against probe results. Remove any not backed by real data. |
| G41 | Red zone data source | **VinSolutions only.** Monitor leads from last 30 days that had any activity in the last 2 weeks. Flag those being "left behind." Never use the word "MVP." |
| G42 | Widget schema | **What's in the UI has to work.** Full widget CRUD with persistence. |
| G43 | Embed code approach | **Most usable, least problematic.** Whatever approach has fewest compatibility issues across web servers. |
| G44 | Landing page serving | **Must survive other web servers.** Architecture so landing pages work even if we move off Replit to Railway or elsewhere. |
| G45 | Google Calendar OAuth | **Leave as stubbed** unless a proven open-source OAuth library is available. Don't build custom OAuth. |
| G46 | Task assignment user-to-user | **OPEN QUESTION** — has task assignment between users been decided? Need user input on whether tasks can be assigned from one user to another, or only self-created. |
| G48 | Mock data removal | **All mock data must be gone.** If a metric has no real data source, remove it from the UI entirely. No fake numbers, no "Coming Soon" placeholders for metrics. |
| G50 | E2E test scope | **All testing built from UI audit + acceptance criteria.** No ad-hoc test plans. Tests derive from the audit document and sprint acceptance criteria. |

---

## PART 5: UI Behavior Audit — Unclear or Problematic Patterns

### Conversation History Overflow (SubMenuManager Popout)

**The Problem:** When you expand an agent's chevron in the popout, it shows ALL conversations for that agent. There's no limit, no pagination, no virtualization. The conversations are rendered inside a `ScrollArea` (so the panel itself scrolls), but:

- If an agent has 200 conversations and you expand it, 200 DOM elements render immediately
- Multiple expanded agents compound the problem
- There's a search filter for agents but not for conversations within an agent
- Performance degrades as conversation count grows

**Current Flow:**
1. `getAgentConversations(agentId)` filters `allConversations` by agentId — returns ALL matches
2. All matches are rendered via `.map()` — no `.slice()`, no limit
3. `allConversations` comes from `useQuery` to `/api/conversations?channel=ai-chat` — also no limit param

**My Recommendation:**
- Cap the visible conversation list at 10 per agent in the popout
- Add a "View all (N)" link at the bottom that navigates to TeamBox filtered by that agent
- On the API side, add `?limit=` support to `GET /api/conversations` (already partially there — needs to be used)
- Consider virtualized lists if agent count + conversation count grows large

---

### Other UI Behavior Issues Found

| # | Area | Issue | Severity | Recommendation |
|---|------|-------|----------|----------------|
| U1 | **Favorites section** | AI-Chat panel puts Favorites above the ScrollArea. 20+ favorites push Chat History off-screen. Favorites section itself doesn't scroll. | MEDIUM | Give favorites its own capped ScrollArea or move it inside the main one. |
| U2 | **Error handling** | Almost no `isError` handling across the app. Failed API calls leave the UI in a permanent loading/skeleton state. No retry option. | HIGH | Add error boundaries and per-query error states with retry. Cross-cutting fix. |
| U3 | **Activity feed duplication** | TopBar dropdown has activity feed, AND Management page has an Activities tab showing the same data. Two places for the same thing. | LOW | By design (TopBar = quick glance, Management = deep dive). Document this so it's intentional, not confusing. |
| U4 | **TeamBox breaks the cardinal rule** | TeamBox uses its own 4-column internal layout and ignores the global RightPane. This is the only page that does this. | LOW | By design for TeamBox's unique workflow. But should be documented as an intentional exception. |
| U5 | **Agent status toggle** | AgentConfigPane status toggle doesn't disable during mutation. Rapid clicks can fire multiple PATCH requests. | MEDIUM | Add `disabled={mutation.isPending}` to the toggle. |
| U6 | **Mobile TeamBox** | Status filter and customer info columns hidden on smaller screens with no alternative UI. | MEDIUM | Add a mobile filter drawer. Sprint 4.2 scope. |
| U7 | **Tab accessibility** | Department page tab buttons lack `role="tab"` and `aria-selected` attributes. | LOW | Add ARIA attributes for screen reader support. |
| U8 | **Login error display** | AuthContext stores login errors but the login page may not display them clearly. | LOW | Verify login page shows error message from the auth context. |
| U9 | **localStorage role stale** | User's role persists in localStorage even if changed on backend. Stale permissions until re-login. | MEDIUM | Override localStorage role from server response on every login and token refresh. |
| U10 | **Dashboard empty state** | New org with no data sees "0" tiles everywhere. No onboarding guidance. | LOW | Add "No data yet" messaging with setup guidance. Sprint 2.3 or 4.2 scope. |
| U11 | **Profile sub-routes** | TopBar links to /profile, /profile/preferences, /profile/billing may not map to specific tabs on the profile page. | LOW | Verify and wire sub-route → tab mapping. |
| U12 | **RightPane mobile overlay** | On mobile, RightPane covers the entire screen. User can't reference the main content while chatting with AI. | MEDIUM | Consider a half-screen drawer instead of full overlay on mobile. Sprint 4.2. |
| U13 | **AppContext org fallback** | While org data is loading, AppContext falls back to a hardcoded org. This can cause a brief flash of wrong org name/branding. | LOW | Show a loading state instead of fallback org during initial load. |
