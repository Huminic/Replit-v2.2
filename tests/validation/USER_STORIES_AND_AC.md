# NEXXUS CONNECT V2.2 — USER STORIES & ACCEPTANCE CRITERIA
# Aligned to current codebase state — validated against live code
# Last validated: 2026-03-08

---

## US-001: AUTHENTICATION & PASSWORD MANAGEMENT

**As a** user,
**I want to** securely log in, log out, and recover my password,
**So that** my account stays protected and I can regain access if I forget my credentials.

### Acceptance Criteria

**AC-AUTH-001: Login with valid credentials**
- Given a user with a registered email and password
- When they POST /api/auth/login with correct credentials
- Then the server returns a JWT access token (1h expiry), a refresh token (7d expiry), user details, and a session is created in the DB

**AC-AUTH-002: Login with invalid credentials**
- Given an invalid email or password
- When they POST /api/auth/login
- Then the server returns 401 with an error message and no tokens are issued

**AC-AUTH-003: Token refresh**
- Given a valid refresh token
- When they POST /api/auth/refresh
- Then the server rotates both tokens (deletes old session, creates new), and returns fresh access + refresh tokens

**AC-AUTH-004: Logout clears all sessions**
- Given an authenticated user
- When they POST /api/auth/logout
- Then ALL sessions for that user are deleted from the DB (not just the current session)

**AC-AUTH-005: Forgot password sends reset email**
- Given a registered email address
- When they POST /api/auth/forgot-password
- Then a 32-byte hex reset token is generated, saved with 1-hour expiry, and a reset email is sent via Resend (or logged in dev mode)

**AC-AUTH-006: Reset password with valid token**
- Given a valid, non-expired reset token
- When they POST /api/auth/reset-password with the token and new password
- Then the password is hashed with bcrypt, user record updated, and reset token/expiry cleared

**AC-AUTH-007: JWT middleware enforcement**
- Given an API request to a protected route
- When the Authorization header is missing or contains an invalid/expired Bearer token
- Then the server returns 401 (missing/invalid) and attaches userId, organizationId, roleLevel to req for valid tokens

---

## US-002: ROLE-BASED ACCESS CONTROL (RBAC)

**As an** administrator,
**I want to** control what each role can see and do across the platform,
**So that** users only access features appropriate to their job function.

### Acceptance Criteria

**AC-RBAC-001: Sidebar navigation gating**
- Given 8 defined roles (super_admin, partner_admin, org_admin, executive, sales_manager, sales, service, marketing)
- When a user with a specific role views the sidebar
- Then navigation items are visible/hidden per this matrix:
  - AI Chat, TeamBox, My Work: ALL roles
  - Sales: visible to super_admin, partner_admin, org_admin, executive, sales_manager, sales; hidden from service, marketing
  - Service: visible to super_admin, partner_admin, org_admin, executive, service; hidden from sales_manager, sales, marketing
  - Marketing: visible to super_admin, partner_admin, org_admin, executive, marketing; hidden from sales_manager, sales, service
  - Management: visible to super_admin, partner_admin, org_admin, executive, sales_manager; hidden from sales, service, marketing
  - System: visible to super_admin, partner_admin, org_admin; hidden from executive, sales_manager, sales, service, marketing

**AC-RBAC-002: Settings tile gating**
- Given a user navigates to Settings
- When their role is evaluated
- Then: super_admin sees 9 tiles (including Data Management), partner_admin sees 7 (no Data Mgmt), org_admin sees 7 (no AI Config, Security, Data Mgmt)
- And "New Organization" button is visible ONLY to super_admin

**AC-RBAC-003: Role-specific metric tiles on AI Chat**
- Given a user with a specific role loads the AI Chat page
- When the page renders (before typing)
- Then role-specific metric tiles display:
  - super_admin: Partner Orgs, Total Logins, Platform Actions, Agent Actions
  - partner_admin: Sub Orgs, Total Logins, User Actions, Agent Actions
  - org_admin: Pipeline Value, Lead Source, Lead Quality, Demand Score
  - executive: Revenue, Team Activity, Customer Sat, ROI Score
  - sales_manager: Pipeline Value, Team Leads, Conversion Rate, Urgency Score
  - sales: Hot Opportunities, Buying Intel, Threats, Urgency Score
  - service: Active Campaigns, Messages Sent, Appointments, Upsell Rate
  - marketing: Campaign Perf, Leads Generated, Widget Clicks, Landing Visits

**AC-RBAC-004: Role switcher persistence**
- Given the dev role switcher is used to select a role
- When the selection is made
- Then the role is stored in localStorage under 'nexxus-current-role' and all role-gated components re-render immediately without page reload

---

## US-003: PIPELINE METRICS (100% REAL DATA)

**As a** dealership user,
**I want to** see accurate, live pipeline metrics on the AI Chat landing page,
**So that** I can make data-driven decisions without switching systems.

### Acceptance Criteria

**AC-PIPE-001: Active pipeline count**
- Given the AI Chat page loads
- When the pipeline metrics are fetched from GET /api/metrics/pipeline
- Then activePipeline = count of warehouseLeads created in last 14 days, excluding status Lost, Sold, or Duplicate

**AC-PIPE-002: Appointments today**
- Given the pipeline metrics endpoint is called
- When appointmentsToday is calculated
- Then it counts warehouseLeads with ACTIVE_SET_APPOINTMENT status synced today

**AC-PIPE-003: Open escalations**
- Given the pipeline metrics endpoint is called
- When openEscalations is calculated
- Then it counts tasks with status=todo AND type=escalation OR unsent_message

**AC-PIPE-004: Outbound sent 24h**
- Given the pipeline metrics endpoint is called
- When outboundSent24h is calculated
- Then it counts entries in outbound_log with sent status in the last 24 hours

**AC-PIPE-005: Metric tiles hide on chat start**
- Given the AI Chat page is showing the four metric tiles
- When the user begins typing or sends a message
- Then the tiles collapse/hide from view

**AC-PIPE-006: Cross-page consistency**
- Given active pipeline is displayed on AI Chat
- When the same metric appears on Sales or Management pages
- Then both values are identical (sourced from the same query)

---

## US-004: TEAMBOX (100% REAL DATA)

**As a** dealership staff member,
**I want to** view and manage customer conversations in a unified inbox,
**So that** I can take over from AI, respond directly, and manage escalations.

### Acceptance Criteria

**AC-TB-001: Conversation list loads from API**
- Given a user navigates to TeamBox
- When the page loads
- Then conversations are fetched from GET /api/conversations (org-scoped)

**AC-TB-002: Message thread loads from API**
- Given a conversation is selected
- When the thread panel renders
- Then messages are fetched from GET /api/conversations/:id/messages

**AC-TB-003: Reply sends to API**
- Given a user types a reply in a conversation
- When they send the message
- Then POST /api/conversations/:id/messages is called and the message appears in the thread

**AC-TB-004: Human takeover**
- Given an AI-handled conversation
- When a staff member clicks "Take Over"
- Then PATCH /api/conversations/:id sets assignedTo to the current user and sets a flag pausing AI responses

**AC-TB-005: AI pause on takeover**
- Given a conversation has been taken over by a human
- When the AI chat endpoint processes messages for that conversation
- Then it checks the takeover flag and does NOT generate AI responses

**AC-TB-006: Task creation from TeamBox**
- Given a staff member is viewing a conversation
- When they create a task from the conversation context
- Then POST /api/tasks is called and the task appears in the TeamBox task list

**AC-TB-007: Three escalation types**
- Given the TeamBox section
- When a user views escalation items
- Then Task, Escalation, and Unsent Message are visually distinct types

**AC-TB-008: Four priority levels**
- Given an escalation item in TeamBox
- When it is displayed
- Then Critical, High, Medium, Low priority levels are visually distinct

**AC-TB-009: Loading states**
- Given TeamBox data is being fetched
- When API queries are pending
- Then skeleton loaders render (ConversationListSkeleton, MessagesSkeleton, TaskListSkeleton)

**AC-TB-010: File attachments placeholder**
- Given a user tries to attach a file in TeamBox
- When they trigger the attachment action
- Then a toast displays "File attachments coming soon" (KNOWN PLACEHOLDER)

---

## US-005: AI CHAT & STREAMING

**As a** dealership user,
**I want to** chat with an AI assistant that can search the web and query my CRM,
**So that** I get contextual, data-driven answers in real time.

### Acceptance Criteria

**AC-CHAT-001: Hybrid tool-use execution**
- Given a user sends a message to AI Chat
- When the server processes the request (POST /api/chat/:conversationId/stream)
- Then it executes:
  1. Non-streaming call to anthropic.messages.create() with tools
  2. If no tool_use → send text as SSE
  3. If tool_use → execute tools (max 3 rounds via MAX_TOOL_ROUNDS)
  4. After tools → anthropic.messages.stream() for final response

**AC-CHAT-002: Available tools**
- Given the AI chat system processes a message
- When it evaluates tool definitions
- Then these tools are available: web_search (Brave), vin_query_leads (VinSolutions CRM), vin_lead_summary (sales metrics)

**AC-CHAT-003: Message persistence**
- Given a user sends a message
- When the chat flow begins
- Then the user message is saved to DB BEFORE AI processing starts
- And the assistant response is saved AFTER the stream completes

**AC-CHAT-004: System prompt includes org context**
- Given an AI chat request is processed
- When the system prompt is constructed
- Then it includes: org persona name, current user name/role, team member list, agent context (if agentId), VIN metrics (if available), hunch context (accepted only)

**AC-CHAT-005: SSE client handling**
- Given the frontend useStreamingChat hook is active
- When streaming data arrives
- Then it parses SSE data events, handles {"type": "done"} termination, displays errors gracefully, and cleans up on unmount

**AC-CHAT-006: CRM Guru mode**
- Given a user activates CRM Guru mode
- When they ask a CRM-related question
- Then VinSolutions data is treated as the primary data source

**AC-CHAT-007: Chat history persistence**
- Given a user has had previous chat sessions
- When they return to AI Chat
- Then previous conversation history is accessible

---

## US-006: OUTBOUND COMMUNICATIONS & COMMGATE

**As a** dealership administrator,
**I want to** safely send automated outbound messages with multiple safety layers,
**So that** we comply with communication regulations and can instantly stop messaging if needed.

### Acceptance Criteria

**AC-COMM-001: 5-layer CommGate validation**
- Given an outbound message is triggered
- When checkCommGate() runs
- Then it validates in order:
  1. Global env: OUTBOUND_LIVE_ENABLED === "true"
  2. Org gate: org.outbound_enabled === true
  3. Channel gate: org.sms_enabled / org.email_enabled / org.phone_enabled
  4. Campaign kill switch: campaign.killSwitch check
  5. Rate limit: max 3 messages per 24h per customer contact
- And if ANY layer fails: message blocked, status logged as 'blocked', escalation task created

**AC-COMM-002: Campaign kill switch**
- Given a campaign is actively executing
- When POST /api/campaigns/:id/stop is called
- Then the campaign is removed from the activeExecutions Map and halts immediately
- And PATCH /api/campaigns/:id sets active=false in the DB

**AC-COMM-003: Global communication gate**
- Given an org admin toggles the global communication gate off
- When outbound_enabled is set to false via PATCH org settings
- Then ALL subsequent campaign execution checks return blocked
- And "Communications Paused" badge renders on campaign pages

**AC-COMM-004: Rate limiting (DB-backed)**
- Given a customer has received 3 outbound messages in the last 24 hours
- When a 4th message is triggered
- Then the message is blocked, status='blocked' logged in outbound_log, escalation task created
- And rate limit state is stored in DB (survives server restarts)

**AC-COMM-005: Kill switch column defaults**
- Given a new organization is created
- When the org record is initialized
- Then outbound_enabled, sms_enabled, phone_enabled, email_enabled all default to FALSE

**AC-COMM-006: SMS delivery via TextMagic**
- Given an outbound SMS passes all CommGate checks
- When sendSms() is called
- Then the message is sent via TextMagic API and logged in outbound_log

**AC-COMM-007: Email delivery via Resend**
- Given an outbound email passes all CommGate checks
- When sendEmail() is called
- Then the email is sent via Resend SDK and logged in outbound_log

**AC-COMM-008: Voice calls via VAPI (REAL)**
- Given an outbound phone call passes all CommGate checks
- When sendPhone() is called
- Then a real POST request is made to https://api.vapi.ai/call via vapiPost() helper

---

## US-007: WEBHOOK SECURITY

**As a** system administrator,
**I want to** securely receive inbound webhooks from external services,
**So that** only legitimate traffic from our vendors is processed.

### Acceptance Criteria

**AC-WH-001: VAPI webhook validation**
- Given an inbound request to POST /api/webhooks/vapi
- When the server processes it
- Then it validates x-vapi-secret or authorization header against VAPI_PRIVATE_KEY env var
- And on end-of-call-report: creates conversation, saves transcript, triggers VinSolutions lead creation, creates escalation on failure

**AC-WH-002: TextMagic webhook validation**
- Given an inbound request to POST /api/webhooks/textmagic
- When the server processes it
- Then it validates x-textmagic-secret or x-tm-signature header against TEXTMAGIC_WEBHOOK_SECRET env var
- And applies IP-based rate limiting (30 req/min)

**AC-WH-003: VAPI health check**
- Given VAPI needs to verify webhook connectivity
- When GET /api/webhooks/vapi is called
- Then a health check response is returned

---

## US-008: MANAGEMENT & HUNCHES (100% REAL DATA)

**As a** manager or executive,
**I want to** view AI-generated insights (hunches) and team activity,
**So that** I can make informed decisions and act on opportunities.

### Acceptance Criteria

**AC-MGMT-001: Hunches list from API**
- Given a user navigates to Management
- When the page loads
- Then hunches are fetched from GET /api/hunches (org-scoped)

**AC-MGMT-002: Acknowledge/Dismiss hunches**
- Given a hunch is displayed
- When the user acknowledges or dismisses it
- Then PATCH /api/hunches/:id updates the hunch status in DB

**AC-MGMT-003: Generate hunches via AI**
- Given a manager clicks "Generate Hunches"
- When POST /api/hunches/generate is called
- Then Claude API generates new hunches based on org context
- And a success toast appears, or error toast on failure

**AC-MGMT-004: Activities feed from API**
- Given the Management page loads
- When activities are displayed
- Then data comes from GET /api/activity-log (NOT hardcoded staticActivityFeed)

**AC-MGMT-005: Hunch filter in AI chat prompt**
- Given a user has accepted hunches
- When the next AI inference executes
- Then accepted hunches are in the prompt, dismissed hunches excluded, resolved hunches removed
- And the master system prompt is unchanged

---

## US-009: SALES PAGE

**As a** sales team member,
**I want to** see my pipeline metrics, leads, and agent performance,
**So that** I can prioritize my work and close deals faster.

### Acceptance Criteria

**AC-SALES-001: VIN Leads metrics from API**
- Given a user navigates to the Sales dashboard
- When the page loads
- Then Total Leads, New Leads, Active Pipeline, Waiting on Response, Appointments Set, Sold, Conversion Rate are sourced from GET /api/vin/leads/summary

**AC-SALES-002: Sales agents from API**
- Given the Sales agents tab is viewed
- When agent cards render
- Then agents are fetched from GET /api/agents?department=sales

**AC-SALES-003: Recent Activity (KNOWN PLACEHOLDER)**
- Given the Sales dashboard renders
- When the "Recent Activity" card is displayed
- Then 5 hardcoded activity items are shown (lines 236-242 of sales.tsx)
- This is a KNOWN PLACEHOLDER — will be wired to GET /api/activity-log in a future wave

---

## US-010: WIDGET LANDING PAGE

**As a** website visitor,
**I want to** interact with the dealership through chat, voice, video, or a contact form,
**So that** I can get help without calling or visiting in person.

### Acceptance Criteria

**AC-WID-001: Four channels available**
- Given the widget renders on a landing page
- When all channels are enabled
- Then Web Chat, Web Call, Contact Form, and Two-Way Video are all available

**AC-WID-002: Chat creates real conversations**
- Given a visitor starts a chat via the widget
- When they send a message
- Then POST /api/widget/chat creates a real conversation with Claude AI response (visible in TeamBox)

**AC-WID-003: Contact form creates conversations**
- Given a visitor submits the contact form
- When POST /api/widget/contact is called
- Then a real conversation is created from the form submission

**AC-WID-004: Voice uses VAPI SDK**
- Given a visitor clicks the voice channel
- When the connection initiates
- Then @vapi-ai/web SDK connects with real states (connecting/connected/error/ended)

**AC-WID-005: Video uses Tavus**
- Given a visitor clicks the video channel
- When a session is created via POST /api/widget/video-session
- Then a real Tavus conversation URL is returned and rendered in an iframe

**AC-WID-006: Landing page publicly accessible**
- Given the landing page URL /p/:slug
- When an unauthenticated user visits
- Then the page loads without requiring login

---

## US-011: DATABASE INTEGRITY

**As a** system operator,
**I want to** ensure the database schema is properly structured with foreign keys, indexes, and seed data,
**So that** the application is performant, consistent, and works on fresh deployment.

### Acceptance Criteria

**AC-DB-001: Schema table count**
- Given the database schema in shared/schema.ts
- When tables are counted
- Then there are 23+ tables with all required relationships

**AC-DB-002: Cascade rules enforce referential integrity**
- Given an organization is deleted
- When cascade rules fire
- Then all child records (users, agents, conversations, campaigns, tasks, etc.) are deleted
- And session deletion cascades from user deletion

**AC-DB-003: Seed data creates testable state**
- Given seed.ts runs on a fresh database
- When seeding completes
- Then: 3 orgs with valid slugs, 8 roles, 8 users (including admin@nexxus.com super_admin), 8 agents across departments, sample campaigns/conversations/messages exist

**AC-DB-004: Performance indexes exist**
- Given high-frequency query patterns
- When indexes are checked
- Then indexes exist on: users.organizationId, users.email, agents.organizationId, conversations.organizationId, messages.conversationId, campaigns.organizationId, tasks.organizationId, sessions.refreshToken, sessions.userId

**AC-DB-005: No RLS (KNOWN ARCHITECTURAL RISK)**
- Given the current database schema
- When RLS policies are checked
- Then NONE exist — multi-tenancy is application-level only
- All storage methods include organizationId filters for data isolation

---

## US-012: ERROR HANDLING & USER EXPERIENCE

**As a** user,
**I want to** see clear feedback on errors, loading states, and actions,
**So that** I always know what the application is doing.

### Acceptance Criteria

**AC-UX-001: Global error boundary**
- Given a JavaScript error occurs in any component
- When the error boundary catches it
- Then a user-friendly fallback UI renders (not a blank screen or stack trace)
- And "Try Again" and "Reload Page" buttons are available

**AC-UX-002: Loading skeletons on data pages**
- Given any data-driven page loads
- When API queries are pending
- Then skeleton loaders or spinners render (not empty states) for: TeamBox, Pipeline tiles, Agent lists, Hunch cards, Tasks

**AC-UX-003: Toast notifications on mutations**
- Given a user performs a data-mutating action
- When the action succeeds or fails
- Then a toast notification appears with appropriate success/error message for: campaign start/stop, kill switch toggle, user invite, agent save, task update, hunch generation

**AC-UX-004: Form validation**
- Given a user submits a form (user invite, campaign creation, agent edit, org settings)
- When validation runs
- Then client-side validation fires before submission using react-hook-form + zodResolver
- And server-side Zod schemas validate the request body

---

## KNOWN PLACEHOLDERS (WAVE 1 ACCEPTABLE)

These items are intentionally incomplete for the current release wave:

| Item | Current Behavior | Target Wave |
|------|-----------------|-------------|
| Sales Recent Activity | 5 hardcoded items | Wave 3 |
| Insights Metric Library | 34 hardcoded definitions | Wave 3 |
| Billing/Invoice buttons | "Not available in demo mode" toasts | Wave 4 |
| Settings Tool toggles | "Demo mode" toasts | Wave 3 |
| Knowledge Base URL add/scrape | "Demo mode" toasts | Wave 3 |
| Marketing Studio tab | "Coming Soon" badge | Wave 4 |
| Chat Upload/Document | "Coming Soon" toasts | Wave 3 |
| TeamBox file attachments | "Coming Soon" toast | Wave 3 |
| Agent trigger editor | "Demo mode" toasts | Wave 3 |
| Google Calendar / Dealer.com / Tekion sync | Config UI built, no sync | Wave 5 |
| Row-Level Security (RLS) | Not implemented | Wave 5 |
| CORS / CSRF / Helmet | Not implemented | Pre-production |

---

## SECURITY RISKS (NON-BLOCKING FOR WAVE 1)

| Risk | Severity | Description |
|------|----------|-------------|
| Backend role gate gaps | HIGH | 6+ routes lack requireRole() — any authenticated user can toggle campaign kill switches |
| No security headers | HIGH | No Helmet/CORS/CSRF middleware |
| No RLS | MEDIUM | Multi-tenancy enforced at app level only |
| In-memory campaign state | MEDIUM | activeExecutions Map lost on server restart, no resume logic |
| In-memory rate limiting (webhooks) | LOW | Public route rate limits reset on restart |
| Fire-and-forget activity logging | LOW | Silent failures possible in audit trail |
