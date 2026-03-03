# Nexxus Connect -- Software Requirements Specification v2.2

**Version:** 2.2
**Date:** 2026-03-03
**Status:** GOVERNING DOCUMENT
**Cross-References:** [CLAUDE.md](./CLAUDE.md) | [PRD.md](./PRD.md) | [SPEC.md](./SPEC.md) | [PLAN.md](./PLAN.md) | [ACCEPTANCE_CRITERIA.md](./ACCEPTANCE_CRITERIA.md)

---

## 1. System Overview

### 1.1 Purpose

Nexxus Connect is an AI-powered dealership management platform. This SRS defines the complete functional and non-functional requirements for the v2.2 UI prototype with persona/department-based navigation. The current build is a client-side UI prototype using mock data; the production backend (175+ API endpoints, 53 database tables) exists separately and will be integrated in later waves.

### 1.2 Scope

- Single-page React application (Vite + Express static server)
- Multi-tenant SaaS UI with 4 RBAC roles (Super Admin, Partner Admin, Org Admin, Staff)
- Persona/department-based navigation: AI Chat, TeamBox, My Work, Sales, Service, Marketing, Management
- AI chat interfaces with simulated responses (production: Claude API SSE streaming)
- Widget configuration and landing page management
- Campaign management with kill-switch controls
- Role-based content gating across all sections

### 1.3 Architecture Overview (Current Prototype)

```
+--------------------------------------------------------------+
|                     CLIENT (React / Vite)                     |
|  +----------+ +-----------+ +----------+ +----------------+  |
|  | AppLayout| |  Pages    | | Contexts | | TanStack Query |  |
|  | TopBar   | | Main(Chat)| | Theme    | | (ready for API)|  |
|  | Sidebar  | | TeamBox   | | App      | |                |  |
|  | SubMenu  | | My Work   | +----------+ +----------------+  |
|  | RightPane| | Sales     |                                   |
|  +----------+ | Service   |                                   |
|               | Marketing |                                   |
|               | Management|                                   |
|               | Settings  |                                   |
|               | Profile   |                                   |
|               | Agents    |                                   |
|               | Insights  |                                   |
|               +-----------+                                   |
|  +----------+ +-----------+                                   |
|  | Mocks    | | Components|                                   |
|  | users    | | ui/       |                                   |
|  | agents   | | layout/   |                                   |
|  | campaigns| |           |                                   |
|  | convers. | |           |                                   |
|  +----------+ +-----------+                                   |
+--------------------------------------------------------------+
|                  EXPRESS SERVER (Static)                       |
|  server/routes.ts (stub), server/storage.ts (MemStorage)      |
+--------------------------------------------------------------+
```

### 1.4 Architecture Overview (Production Target)

```
+--------------------------------------------------------------+
|                     CLIENT (React / Vite)                     |
|  Same UI components as prototype                              |
|  Mock data replaced with TanStack Query API calls             |
+--------------------------------------------------------------+
|                  EXPRESS SERVER (API)                          |
|  Auth (JWT) | Routes (/api/*) | Storage (IStorage/PgStorage)  |
|  Services: MetricEngine, HunchEngine, VINSync, AgentService   |
|  Webhooks: VAPI (voice), Tavus (video), TextMagic (SMS)       |
+--------------------------------------------------------------+
|                  POSTGRESQL (Neon-backed)                      |
|  users, organizations, agents, conversations, messages,       |
|  leads, campaigns, widgets, landing_pages, notifications,     |
|  activity_log, metrics_cache, hunches, files, calendar_events |
|  RLS policies on all multi-tenant tables                      |
+--------------------------------------------------------------+
|                  EXTERNAL INTEGRATIONS                         |
|  VIN Solutions (CRM) | VAPI (Voice) | Tavus (Video)          |
|  TextMagic (SMS) | Claude API (AI) | Stripe (Billing)        |
+--------------------------------------------------------------+
```

---

## 2. Functional Requirements

### 2.1 Navigation Structure

| ID | Requirement | Priority |
|----|-------------|----------|
| NAV-01 | Left sidebar with 7 primary items: AI Chat, TeamBox, My Work, Sales, Service, Marketing, Management | P0 |
| NAV-02 | Bottom sidebar item: System (settings), RBAC-gated to Super Admin, Partner Admin, Org Admin | P0 |
| NAV-03 | Sidebar width: 64px (w-16), icon + 10px label per item | P0 |
| NAV-04 | Active page indicator: purple left-edge bar (w-0.5 h-8 bg-purple-500) | P0 |
| NAV-05 | Sub-menu panel: hover-reveal with 800ms leave timeout, pin/unpin toggle | P0 |
| NAV-06 | Sub-menu auto-collapse on resize below 1024px | P0 |
| NAV-07 | RBAC visibility: Marketing hidden from org_staff, Management hidden from org_staff, System hidden from org_staff | P0 |
| NAV-08 | Logout button at sidebar bottom (simulated in prototype) | P0 |

### 2.2 Top Bar

| ID | Requirement | Priority |
|----|-------------|----------|
| TOP-01 | Logo text "Nexxus Connect" on far left, not clickable | P0 |
| TOP-02 | Organization switcher: center-aligned, Building icon + org name + chevron dropdown | P0 |
| TOP-03 | Notifications bell with unread count badge | P0 |
| TOP-04 | Activity feed dropdown (pulse icon) showing 8 most recent entries | P1 |
| TOP-05 | Theme toggle (Moon/Sun icon) with localStorage persistence | P0 |
| TOP-06 | Profile menu: avatar + chevron, dropdown with My Profile, Preferences, Billing, Log Out | P0 |
| TOP-07 | Role switcher (dev tool): 4 roles, persists via localStorage | P0 |
| TOP-08 | Globe icon linking to public widget landing page (/w/demo) | P1 |

### 2.3 AI Chat Page (Main Page)

**Route:** `/`
**View Config:** `chat-only` (centered, max-w-4xl, no right pane toggle)

| ID | Requirement | Priority |
|----|-------------|----------|
| CHAT-01 | 4 metric tiles with role-specific content (Super Admin, Partner Admin, Org Admin, Staff each see different tiles) | P0 |
| CHAT-02 | Tile click opens detail modal with metric formula, breakdown rows, Key Insights section | P0 |
| CHAT-03 | Window-blind collapse: tiles animate up after first chat message, Show/Hide toggle appears | P0 |
| CHAT-04 | Chat interface: bot messages left-aligned (bg-card border), user messages right-aligned (bg-primary) | P0 |
| CHAT-05 | NO avatars or icons on chat messages | P0 |
| CHAT-06 | Typing animation: 3 wave-dots with staggered delays (0s, 0.15s, 0.3s) | P0 |
| CHAT-07 | Suggestion bubbles with sparkle icon, clicking populates input | P0 |
| CHAT-08 | Chat input: gradient border wrapper (chat-input-gradient), animated purple/blue/cyan | P0 |
| CHAT-09 | Enter sends message, Shift+Enter creates newline | P0 |
| CHAT-10 | Plus (+) button for file upload (simulated in prototype) | P1 |
| CHAT-11 | Thinking Card: collapsible with Brain icon, purple tint, expandable details | P0 |
| CHAT-12 | Persona name is dynamic, sourced from organization configuration (not hardcoded) | P0 |
| CHAT-13 | Simulated AI responses with 1.5s delay (production: SSE streaming from Claude API) | P0 |

#### 2.3.1 Role-Specific Metric Tiles

| Role | Tile 1 | Tile 2 | Tile 3 | Tile 4 |
|------|--------|--------|--------|--------|
| Super Admin | Partner Orgs | Total Logins | Platform Actions | Agent Actions |
| Partner Admin | Sub Orgs | Total Logins | User Actions | Agent Actions |
| Org Admin | Pipeline Value | Lead Source | Lead Quality | Demand Score |
| Staff | Hot Opportunities | Buying Intel | Threats | Urgency Score |

Each tile displays: label, large value, change indicator with trend arrow (green up / red down), gradient background, decorative SVG pattern, icon badge. Each tile click opens a detail modal with formula description, data breakdown, and Key Insights bullet points.

### 2.4 TeamBox Page

**Route:** `/teambox`
**View Config:** `teambox` (3-column layout, integrated customer info panel)

| ID | Requirement | Priority |
|----|-------------|----------|
| TB-01 | 3-column layout: filter sidebar (w-64, hidden on smaller screens), conversation list (w-72/w-80), chat thread + customer info | P0 |
| TB-02 | Filter sidebar: Status filters (All, Open, Assigned to me, Participating, Automated, Scheduled, Followup, Pending) with counts | P0 |
| TB-03 | Filter sidebar: Channel filters (All, SMS, Email, Web Chat, WhatsApp, Voice) | P0 |
| TB-04 | Conversation list: searchable, shows customer name, last message preview, timestamp, channel icon, agent badge, unread count | P0 |
| TB-05 | Chat thread: full conversation history with sender name, content, relative timestamp | P0 |
| TB-06 | Message styling: customer messages left-aligned (bg-muted), bot messages right-aligned (bg-primary/10 border), staff messages right-aligned (bg-primary) | P0 |
| TB-07 | Reply input: Textarea with attachment and send buttons | P0 |
| TB-08 | "Take Over" button visible on automated conversations (agent is handling, staff can take over) | P0 |
| TB-09 | "Disconnect Campaign" button visible on campaign-linked conversations | P0 |
| TB-10 | Customer info panel (right column, w-64, hidden below xl): customer name, email, phone, channel, status, agent, quick actions (Call, Email, SMS), tags | P0 |
| TB-11 | Mock conversation data with multiple channels, statuses, and message histories | P0 |

### 2.5 My Work Page

**Route:** `/my-work`
**View Config:** `sub-menu`

| ID | Requirement | Priority |
|----|-------------|----------|
| MW-01 | Tab navigation: Dashboard, Tasks, Chat, Assistant | P0 |
| MW-02 | Dashboard tab: personal greeting with user's first name, 4 summary metric cards (Tasks Due Today, Overdue Items, Conversations, Completed This Week), upcoming tasks card | P0 |
| MW-03 | Tasks tab: full task list with status icon, title, status badge, priority badge, due date | P0 |
| MW-04 | Task statuses: overdue (red), in_progress (blue), pending (amber), completed (green) | P0 |
| MW-05 | "Add Task" button on Tasks tab | P1 |
| MW-06 | Chat tab: placeholder for personal conversation history | P1 |
| MW-07 | Assistant tab: placeholder for NanoClaw personal assistant with "Launch Assistant" button | P1 |

### 2.6 Sales Page

**Route:** `/sales`
**View Config:** `data-display` (Automa chat available in right pane)

| ID | Requirement | Priority |
|----|-------------|----------|
| SL-01 | Tab navigation: Dashboard, Agents, Insights, Calendar | P0 |
| SL-02 | Dashboard tab: 7 metric tiles (Pipeline Count, New Leads, Overdue Leads, Avg Lead Age, AI-Gen Leads, Conversion Rate, Top Agent Close) | P0 |
| SL-03 | Dashboard tab: Top Performing Agents card listing sales agents with rank, avatar, name, channel, status dot | P0 |
| SL-04 | Dashboard tab: Recent Activity card with 5 activity entries | P0 |
| SL-05 | Agents tab: grid of sales-department agent cards with avatar, name, channel, status, description, phone badge | P0 |
| SL-06 | Agent card click sets selectedAgent in AppContext | P0 |
| SL-07 | Insights tab: placeholder for sales-specific analytics | P1 |
| SL-08 | Calendar tab: placeholder for sales calendar | P1 |
| SL-09 | Metric tiles show trend indicator (up/down), percentage change, "vs last week" label | P0 |

### 2.7 Service Page

**Route:** `/service`
**View Config:** `data-display`

| ID | Requirement | Priority |
|----|-------------|----------|
| SV-01 | Tab navigation: Dashboard, Agents, Campaigns, Insights, Calendar | P0 |
| SV-02 | Dashboard tab: 6 metric tiles (Active Campaigns, Messages Sent, Replies Received, Appointments Booked, Declined Services, Upsell Rate) | P0 |
| SV-03 | Agents tab: grid of service-department agent cards | P0 |
| SV-04 | Campaigns tab: table with campaign name, status, channel, recipients, sent, replied, kill switch toggle | P0 |
| SV-05 | Campaign status indicator: colored dot (green=active, amber=paused, gray=draft, blue=completed) | P0 |
| SV-06 | Campaign kill switch: Switch component, unchecked state shows red (data-[state=unchecked]:bg-red-500) | P0 |
| SV-07 | Campaign CSV file name displayed with Upload icon when present | P0 |
| SV-08 | "New Campaign" button | P1 |
| SV-09 | Communications paused warning badge shown when global communication gate is disabled | P0 |
| SV-10 | Campaign Safety card with Ban icon explaining kill switch behavior | P0 |
| SV-11 | Insights tab: placeholder for service analytics | P1 |
| SV-12 | Calendar tab: placeholder for service calendar | P1 |

### 2.8 Marketing Page

**Route:** `/marketing`
**View Config:** `data-display`

| ID | Requirement | Priority |
|----|-------------|----------|
| MK-01 | Tab navigation: Dashboard, Agents, Campaigns, Studio, Insights | P0 |
| MK-02 | Dashboard tab: 4 metric tiles (Campaign Performance, Leads Generated, Widget Interactions, Landing Page Visits) | P0 |
| MK-03 | Agents tab: grid of marketing-department agent cards | P0 |
| MK-04 | Campaigns tab: same table layout as Service campaigns, filtered to marketing department | P0 |
| MK-05 | Studio tab: placeholder with "Coming Soon" badge for future video/image/podcast tools (Wave 4) | P1 |
| MK-06 | Insights tab: placeholder for marketing analytics | P1 |
| MK-07 | RBAC: Marketing section hidden from org_staff role | P0 |

### 2.9 Management Page

**Route:** `/management`
**View Config:** `data-display`

| ID | Requirement | Priority |
|----|-------------|----------|
| MG-01 | Tab navigation: Dashboard, Insights, Hunches, Activities, ROI | P0 |
| MG-02 | Dashboard tab: 6 metric tiles (Total Revenue, Active Accounts, Team Activity Score, MRR, Customer Satisfaction, Avg Deal Size) | P0 |
| MG-03 | Insights tab: placeholder for management-level analytics | P1 |
| MG-04 | Hunches tab: AI hunch cards with title, confidence percentage badge, impact badge (high=destructive, medium/low=secondary), pattern description, recommendation | P0 |
| MG-05 | Hunch lightbulb icon color intensity varies by confidence level | P0 |
| MG-06 | Activities tab: activity feed items with colored type icon, description, relative timestamp | P0 |
| MG-07 | ROI tab: placeholder for ROI analysis view | P1 |
| MG-08 | RBAC: Management section hidden from org_staff role | P0 |

### 2.10 Settings Page

**Route:** `/settings/system`, `/settings/billing`, `/settings/org-wizard`
**View Config:** `sub-menu`

| ID | Requirement | Priority |
|----|-------------|----------|
| SET-01 | Tile-based grid navigation with role-gated sections (9 tiles) | P0 |
| SET-02 | Tiles: User Management, Organization, Tools & Integrations, Knowledge Base, AI Configuration, Security, Notifications, Data Management, Appearance | P0 |
| SET-03 | Each tile shows icon, title, description, gradient background, decorative SVG | P0 |
| SET-04 | Role gating: AI Config (Super/Partner Admin only), Security (Super/Partner Admin only), Data Management (Super Admin only) | P0 |
| SET-05 | User Management: user list with avatar, name, role badge, email, edit/remove actions | P0 |
| SET-06 | User Management: "Add User" button, search input, "New Organization" button (Super Admin only) | P0 |
| SET-07 | Tools & Integrations: sub-tabs for MCP Tools, Widgets, Landing Pages | P0 |
| SET-08 | Widget list: table with name, embed code (copyable), status badge, last updated, "View test page" button, 3-dot menu | P0 |
| SET-09 | Widget config: tabbed sections (Settings, Appearance, Targeting, Domains, Embed) | P0 |
| SET-10 | Widget types: Text Chat, Live Video, Voice Call, Unified | P0 |
| SET-11 | Landing page management: create, edit, delete, link to widgets | P0 |
| SET-12 | Global communication gate: master toggle to prevent all outbound automated communications | P0 |
| SET-13 | Kill switch confirmation dialog before enabling | P0 |
| SET-14 | Knowledge Base: file upload categories (Inventory, Pricing, SOPs, Product Info, General) with upload dialog | P1 |
| SET-15 | AI Configuration: skills management with category filters, temperature sliders, prompt editing | P1 |
| SET-16 | Tool cards: friendly name, technical name, description, enabled toggle, lock indicator | P1 |

### 2.11 Profile Page

**Route:** `/profile`, `/profile/preferences`, `/profile/billing`
**View Config:** `sub-menu`

| ID | Requirement | Priority |
|----|-------------|----------|
| PRO-01 | Profile tab: user info display with avatar, name, email, role, organization | P0 |
| PRO-02 | Preferences tab: theme selection, notification preferences | P1 |
| PRO-03 | Billing tab: plan display, usage information | P2 |

### 2.12 Widget Landing Page

**Route:** `/w/demo`
**View Config:** Standalone (no AppLayout wrapper)

| ID | Requirement | Priority |
|----|-------------|----------|
| WLP-01 | Standalone page outside AppLayout | P0 |
| WLP-02 | Widget demonstration with channel cards | P0 |

### 2.13 Agent Configuration

| ID | Requirement | Priority |
|----|-------------|----------|
| AGT-01 | Agent list within Sales/Service/Marketing sub-menu panels, searchable | P0 |
| AGT-02 | Agent cards show avatar, name, status dot, department grouping | P0 |
| AGT-03 | Selected agent stored in AppContext, accessible from agent config pane | P0 |
| AGT-04 | Agent config pane renders in right pane on /agents route | P0 |
| AGT-05 | Agents tagged by department: sales, service, marketing, system | P0 |

### 2.14 Notifications and Activity

| ID | Requirement | Priority |
|----|-------------|----------|
| NOT-01 | Notification bell with unread count badge in TopBar | P0 |
| NOT-02 | Notification dropdown: scrollable list with icon, title, message, timestamp | P0 |
| NOT-03 | Click notification to mark as read | P0 |
| NOT-04 | Activity feed dropdown in TopBar (8 most recent entries) | P1 |
| NOT-05 | Activity types: login, create, update, delete, system, agent with colored icons | P1 |

### 2.15 Favorites System

| ID | Requirement | Priority |
|----|-------------|----------|
| FAV-01 | Star toggle on pages to add/remove from favorites | P0 |
| FAV-02 | Favorites bar in sub-header area of applicable pages | P0 |
| FAV-03 | Favorites listed in AI Chat sub-menu panel with amber star icons | P0 |
| FAV-04 | Favorites persist in session state (reset on page reload in prototype) | P0 |

---

## 3. Sub-Menu Panel Requirements

### 3.1 Panel Behavior

| ID | Requirement | Priority |
|----|-------------|----------|
| SUB-01 | Panel appears on sidebar hover or when globally pinned | P0 |
| SUB-02 | 800ms leave timeout before hiding (prevents accidental dismissal) | P0 |
| SUB-03 | Collapse button (ChevronLeft) in each panel header | P0 |
| SUB-04 | Auto-collapse when window resizes below 1024px | P0 |
| SUB-05 | Panel positioned right of sidebar (left-16), below top bar (top-14), z-index 40 | P0 |

### 3.2 Panel Content by Section

| Panel ID | Title | Content |
|----------|-------|---------|
| ai-chat | Favorites | Star icon + Favorites list, Chat History with conversation entries (title, last message, relative timestamp, 3-dot menu with Resume/Delete), Artifacts section placeholder |
| teambox | TeamBox | Nav items: Conversations (with count badge), Tasks, Workflows. Quick Filters: Open (with count), Automated (with count), Followup |
| my-work | My Work | Nav items: Assistant, Dashboard, Tasks, Chat |
| sales | Sales | Nav items: Dashboard, Agents, Insights, Calendar. Agent list section with search input and department-filtered agent cards |
| service | Service | Nav items: Dashboard, Agents, Campaigns, Insights, Calendar. Agent list section with search and service-department agents |
| marketing | Marketing | Nav items: Dashboard, Agents, Campaigns, Studio, Insights. Agent list section with search and marketing-department agents |
| management | Management | Nav items: Dashboard, Insights, Hunches, Activities, ROI |
| system | System Settings | Role-gated settings tiles: Users, Organization, Tools & Integrations, Knowledge Base, AI Configuration, Security & Privacy, Notifications, Data Management, Appearance, Billing |

---

## 4. Layout and View Configuration Rules

### 4.1 Cardinal Layout Rules

These rules govern the relationship between center content and the right pane:

| Rule | Description |
|------|-------------|
| Data in center, chat on right | When the center area displays data/dashboards (Sales, Service, Marketing, Management), the right pane offers Automa AI chat for contextual discussion |
| Chat in center, info on right | When the center area is a chat interface (AI Chat / Main), the right pane shows information/artifacts |
| TeamBox: integrated layout | TeamBox uses its own 3-column layout with integrated customer info panel, not the global right pane |
| Agent pages: config on right | Agent detail pages show agent configuration panel in the right pane |

### 4.2 View Configurations

| View Config | Routes | Right Pane | Right Pane Content |
|-------------|--------|------------|-------------------|
| chat-only | `/` | Hidden (no toggle) | N/A (chat is center content) |
| teambox | `/teambox` | Hidden (integrated in page) | N/A (customer info integrated) |
| data-display | `/sales`, `/service`, `/marketing`, `/management`, `/insights` | Toggleable | Automa AI chat |
| sub-menu | `/my-work`, `/settings/*`, `/profile/*` | Hidden | N/A |
| heavy-chat | `/agents` | Toggleable | Agent config pane |

### 4.3 Right Pane Specifications

| ID | Requirement | Priority |
|----|-------------|----------|
| RP-01 | Desktop: side-by-side panel (w-80 / lg:w-96) with left border | P0 |
| RP-02 | Mobile (<md): full-screen overlay (fixed inset-0 z-50) | P0 |
| RP-03 | Toggle: ChevronsLeft (open), ChevronsRight (close) | P0 |
| RP-04 | Automa pop-out button (MessageCircle, purple-tinted) on data-display pages when pane is closed | P0 |
| RP-05 | Mobile FAB (fixed bottom-20 right-4) on data-display pages when pane is closed | P0 |
| RP-06 | Right pane Automa chat: persona name header, message history, typing animation, suggestions, gradient input | P0 |

---

## 5. Campaign System Requirements

### 5.1 Campaign Data Model

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| name | string | Campaign name |
| department | 'sales' / 'service' / 'marketing' | Owning department |
| status | 'active' / 'paused' / 'draft' / 'completed' | Campaign lifecycle status |
| channel | 'sms' / 'email' / 'both' | Communication channel |
| recipientCount | number | Total recipients |
| sentCount | number | Messages sent |
| deliveredCount | number | Messages delivered |
| repliedCount | number | Replies received |
| csvFileName | string (optional) | Uploaded CSV file name |
| messages | CampaignMessage[] | Ordered message templates |
| killSwitch | boolean | Whether campaign is killed (all messages stopped) |
| createdAt | string (ISO) | Creation timestamp |
| updatedAt | string (ISO) | Last update timestamp |
| createdBy | string | Creator user ID |

### 5.2 Campaign Message Template

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| order | number | Sequence position |
| channel | 'sms' / 'email' | Message channel |
| subject | string (optional) | Email subject line |
| content | string | Message body with variable placeholders |
| waitHours | number | Hours to wait after previous message |

### 5.3 Variable Substitution

Campaign messages support template variables: `{{first_name}}`, `{{vehicle}}`, `{{service_type}}`, `{{persona_name}}`, `{{dealer_name}}`, `{{dealer_phone}}`

### 5.4 Kill Switch Behavior

| ID | Requirement | Priority |
|----|-------------|----------|
| KS-01 | Campaign-level kill switch: stops all future outbound messages for that campaign | P0 |
| KS-02 | Per-conversation disconnect: "Disconnect Campaign" button in TeamBox removes conversation from campaign | P0 |
| KS-03 | Global communication gate: master toggle in Settings that prevents ALL outbound automated communications | P0 |
| KS-04 | Visual indicators: "Communications Paused" destructive badge shown on campaign pages when gate is disabled | P0 |
| KS-05 | Kill switch toggle uses Switch component with red unchecked state | P0 |

---

## 6. RBAC Requirements

### 6.1 Role Definitions

| Role | Description | Org Switching |
|------|-------------|---------------|
| super_admin | Platform-level administrator, sees all orgs and data | Yes |
| partner_admin | Partner group administrator, manages sub-organizations | Yes |
| org_admin | Organization-level administrator | No |
| org_staff | Individual contributor / staff member | No |

### 6.2 Section Visibility Matrix

| Section | super_admin | partner_admin | org_admin | org_staff |
|---------|-------------|---------------|-----------|-----------|
| AI Chat | Yes | Yes | Yes | Yes |
| TeamBox | Yes | Yes | Yes | Yes |
| My Work | Yes | Yes | Yes | Yes |
| Sales | Yes | Yes | Yes | Yes |
| Service | Yes | Yes | Yes | Yes |
| Marketing | Yes | Yes | Yes | No |
| Management | Yes | Yes | Yes | No |
| System | Yes | Yes | Yes | No |

### 6.3 Settings Section Visibility

| Settings Section | super_admin | partner_admin | org_admin | org_staff |
|------------------|-------------|---------------|-----------|-----------|
| Users | Yes | Yes | Yes | No |
| Organization | Yes | Yes | Yes | No |
| Tools & Integrations | Yes | Yes | Yes | No |
| Knowledge Base | Yes | Yes | Yes | No |
| AI Configuration | Yes | Yes | No | No |
| Security | Yes | Yes | No | No |
| Notifications | Yes | Yes | Yes | No |
| Data Management | Yes | No | No | No |
| Appearance | Yes | Yes | Yes | No |
| Billing | Yes | Yes | No | No |

---

## 7. Mock Data Requirements

### 7.1 Users and Organizations

| Data | Details |
|------|---------|
| Organizations | 3 orgs: Cage Automotive, Premier Motors, Elite Auto Group. Each has unique persona name (Serra, Aria, Nova), primary/secondary colors |
| Users | 4 users across organizations with varying roles |
| Current User | Duane Wells, org_admin, Cage Automotive |

### 7.2 Agents

| Data | Details |
|------|---------|
| Agent count | 6 agents across 3 departments |
| Sales agents | Sales Agent (voice), Communications Agent (sms), CRM Data Agent (chat), Sales Guru (chat) |
| Service agents | Service Guru (chat) |
| Marketing agents | Marketing Agent (email) |
| Agent statuses | active, inactive, draft with corresponding color dots |
| Agent tools | 8 available tools (VIN Decoder, Inventory Search, CRM Lookup, etc.) |

### 7.3 Conversations (TeamBox)

| Data | Details |
|------|---------|
| Conversation count | 8 conversations across multiple channels and statuses |
| Channels | SMS, Email, Web Chat, WhatsApp |
| Statuses | open, assigned, participating, automated, scheduled, followup, pending |
| Messages per conversation | 1-4 messages with customer/agent/bot sender types |
| Campaign links | 1 conversation linked to a campaign with disconnect capability |

### 7.4 Campaigns

| Data | Details |
|------|---------|
| Campaign count | 4 campaigns across departments |
| Service campaigns | Service Reminder (active), Oil Change Reminder (paused) |
| Marketing campaigns | Presidents Day Sale (completed) |
| Sales campaigns | New Lead Follow-Up (active) |
| Message sequences | 2-4 messages per campaign with configurable wait times |

### 7.5 Activity Feed

| Data | Details |
|------|---------|
| Entry count | Multiple activity entries with various types |
| Types | login, create, update, delete, system, agent |
| Color coding | Each type has a distinct color for its icon circle |

### 7.6 Notifications

| Data | Details |
|------|---------|
| Notification count | Multiple notifications with read/unread states |
| Types | lead assignment, agent alert, system update |

### 7.7 Widgets and Landing Pages

| Data | Details |
|------|---------|
| Widget count | 4 widgets (Text Chat, Live Video, Voice Call, Unified) |
| Landing page count | 5 landing pages (Multi-Channel, Chat Only, Video Agent, Callback Form, Service Booking draft) |
| Widget config | Appearance, targeting, allowed domains, embed code generation |

---

## 8. Non-Functional Requirements

### 8.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| PERF-01 | Initial page load (LCP) | < 2.5s |
| PERF-02 | Route transition | < 100ms |
| PERF-03 | Theme toggle response | Instant (< 50ms) |
| PERF-04 | Sub-menu panel appear/disappear | Smooth, no layout shift |

### 8.2 Responsiveness

| ID | Requirement |
|----|-------------|
| RESP-01 | Mobile breakpoint: < 768px (md) |
| RESP-02 | Tablet breakpoint: 768px - 1023px |
| RESP-03 | Desktop breakpoint: >= 1024px (lg) |
| RESP-04 | TeamBox filter sidebar hidden below lg breakpoint |
| RESP-05 | TeamBox customer info panel hidden below xl breakpoint |
| RESP-06 | Right pane: side-by-side on desktop, full-screen overlay on mobile |
| RESP-07 | Sub-menu auto-collapses below 1024px |
| RESP-08 | Sidebar collapses to 40px (w-10) when hidden, with expand button |

### 8.3 Accessibility

| ID | Requirement |
|----|-------------|
| A11Y-01 | All interactive elements have data-testid attributes |
| A11Y-02 | Keyboard navigation support for all primary actions |
| A11Y-03 | Focus management when modals/dialogs open and close |
| A11Y-04 | Sufficient color contrast in both light and dark themes |
| A11Y-05 | Tooltip content on icon-only buttons |

### 8.4 Dark Mode

| ID | Requirement |
|----|-------------|
| DM-01 | Class-based dark mode toggle (darkMode: ["class"]) |
| DM-02 | CSS custom properties for all color tokens in :root and .dark |
| DM-03 | localStorage persistence of theme preference |
| DM-04 | All UI elements update instantly on toggle |
| DM-05 | Gradient backgrounds and decorative elements adapt to dark mode |

### 8.5 Browser Support

| ID | Requirement |
|----|-------------|
| BRW-01 | Chrome 90+ |
| BRW-02 | Firefox 90+ |
| BRW-03 | Safari 14+ |
| BRW-04 | Edge 90+ |

---

## 9. External Integration Interfaces (Production Target)

### 9.1 VIN Solutions (CRM)

| Aspect | Details |
|--------|---------|
| Protocol | REST API with OAuth2 authentication |
| Accessible endpoints | Leads (CRUD), Contacts (CRUD), Lead Sources, Lead Types, Lead Statuses, Lead Groups, CRM Users |
| Blocked endpoints | Deals/Desking, Appointments, Inventory, Trade-ins, Tasks, Phone calls, Email history |
| Sync pattern | Queue-based with retry logic, 5-minute staleness target |
| Header requirement | `application/vnd.coxauto.v3+json` (lowercase v3) |
| Lead creation | Two-step: create Contact first, then create Lead with contact URL reference |
| Token storage | Encrypted in database |

### 9.2 VAPI (Voice)

| Aspect | Details |
|--------|---------|
| Integration type | Webhook receiver (POST /api/webhooks/vapi) |
| Status | LIVE in production - do not modify without approval |
| Functionality | Browser-based voice calls, AI voice agent |
| Widget support | Voice Call widget type |

### 9.3 Tavus (Video)

| Aspect | Details |
|--------|---------|
| Integration type | Webhook receiver (POST /api/webhooks/tavus) |
| Status | LIVE in production - do not modify without approval |
| Functionality | Face-to-face video chat with AI persona |
| Widget support | Live Video widget type |

### 9.4 TextMagic (SMS)

| Aspect | Details |
|--------|---------|
| Integration type | REST API + Webhook receiver (POST /api/webhooks/textmagic) |
| Functionality | Send/receive SMS messages, campaign messaging |
| Testing rule | Use API loopback (send to self), never to real customers |

### 9.5 Claude API (AI)

| Aspect | Details |
|--------|---------|
| Integration type | REST API with SSE streaming |
| Functionality | AI chat responses, thinking/reasoning, tool calling |
| UI requirements | Wave-dot typing animation during response, Thinking Card for reasoning display |

### 9.6 Stripe (Billing)

| Aspect | Details |
|--------|---------|
| Integration type | REST API |
| Functionality | Subscription management, payment processing, usage metering |
| UI location | Settings > Billing, Profile > Billing |

---

## 10. Data Architecture (Production Target)

### 10.1 Core Tables

```
users (id, name, email, password_hash, role, organization_id, avatar_url, phone, preferences, created_at, updated_at)
organizations (id, name, industry, plan, settings, logo_url, persona_name, primary_color, secondary_color, created_at, updated_at)
```

### 10.2 Communication Tables

```
conversations (id, title, user_id, agent_id, organization_id, created_at, updated_at)
messages (id, conversation_id, role, content, thinking, created_at)
campaigns (id, name, department, status, channel, recipient_count, sent_count, delivered_count, replied_count, csv_file_name, kill_switch, organization_id, created_by, created_at, updated_at)
campaign_messages (id, campaign_id, order, channel, subject, content, wait_hours)
teambox_conversations (id, customer_name, customer_email, customer_phone, channel, status, assigned_to, agent_id, agent_name, last_message, last_message_time, unread_count, tags, campaign_id, campaign_disconnected, organization_id)
```

### 10.3 Agent Tables

```
agents (id, name, description, status, channel, department, system_prompt, organization_id, created_by, triggers, tools, knowledge_sources, customer_link, assigned_phone, chat_link, created_at, updated_at)
```

### 10.4 Widget Tables

```
widgets (id, type, widget_code, name, description, status, appearance, targeting, allowed_domains, config, organization_id, impressions, interactions, created_at, updated_at)
landing_pages (id, slug, name, type, linked_widget_id, status, appearance, organization_id, views, conversions, created_at, updated_at)
```

### 10.5 Insights Tables

```
metrics_cache (id, metric_key, value, role, organization_id, computed_at, ttl_seconds)
hunches (id, title, description, type, confidence, impact, pattern, recommendation, source, data, status, organization_id, created_at)
```

### 10.6 System Tables

```
notifications (id, user_id, title, message, type, read, action_url, organization_id, created_at)
activity_log (id, user_id, action, description, entity_type, entity_id, organization_id, created_at)
```

### 10.7 RLS Policy Pattern

Every table with `organization_id` gets a Row-Level Security policy:
```sql
CREATE POLICY tenant_isolation ON [table]
  USING (organization_id = current_setting('app.organization_id')::uuid);
```

---

## 11. UI/UX Specifications

### 11.1 Layout Invariants

| Element | Specification |
|---------|--------------|
| TopBar height | 56px (h-14) |
| Sidebar width | 64px (w-16) |
| Sidebar collapsed width | 40px (w-10) |
| Sub-menu panel leave timeout | 800ms |
| Right pane desktop width | w-80 (320px) / lg:w-96 (384px) |
| Right pane mobile | Full-screen overlay |
| Main content | flex-1 with overflow-hidden |

### 11.2 Chat Standards (All Chat Interfaces)

| Element | Specification |
|---------|--------------|
| Bot messages | Left-aligned, bg-card border border-border, rounded-2xl, max-w-[80%] |
| User messages | Right-aligned, bg-primary text-primary-foreground, rounded-2xl, max-w-[80%] |
| Avatars | NEVER shown on chat messages |
| Typing animation | wave-dot CSS class, 3 dots, delays: 0s / 0.15s / 0.3s |
| Chat input | chat-input-gradient wrapper, animated border, auto-expand textarea |
| Thinking Card | Collapsible, Brain icon, border-purple-500/20 bg-purple-500/5 |

### 11.3 Design Tokens

| Token | Value |
|-------|-------|
| Primary accent | Purple (purple-500 / purple-400 dark) |
| Active indicator | Purple left-edge bar |
| Font: data tables | density-data (13px) |
| Font: chat messages | density-chat (14-15px) |
| Border radius | rounded-md (default), rounded-xl (cards), rounded-2xl (chat bubbles) |
| Hover effect | hover-elevate class (subtle lift + adjusted background) |
| Active effect | active-elevate-2 class |
| Toggle state | toggle-elevate + toggle-elevated classes |

### 11.4 Metric Tile Standards

| Element | Specification |
|---------|--------------|
| Container | rounded-xl border bg-gradient-to-br, hover-elevate |
| Decorative pattern | Absolute-positioned SVG circles (opacity-[0.07]) |
| Icon | 40x40 rounded-lg with tinted background |
| Value | text-2xl font-bold |
| Trend indicator | TrendingUp (green) / TrendingDown (red) + percentage change |
| Click behavior | Opens detail modal with breakdown data |

---

## 12. Error Handling

### 12.1 Prototype Error Handling

| Scenario | Behavior |
|----------|----------|
| Feature not available | Toast notification: "Not available in demo mode" |
| Form validation failure | Form field error messages via react-hook-form |
| Empty states | Centered icon + message + optional action button |
| Missing data | Graceful fallbacks to empty arrays/default values |

### 12.2 Production Error Handling (Target)

| Scenario | Behavior |
|----------|----------|
| API failure | TanStack Query error state, retry logic, user-friendly error message |
| Authentication expired | Redirect to /login |
| Authorization denied | 403 response, toast notification |
| Network offline | Offline indicator, cached data display |
| Webhook failure | Queue for retry, log error, notify admin |

---

## 13. Testing Requirements

### 13.1 Test ID Convention

All interactive and meaningful display elements include `data-testid` attributes following these patterns:

| Pattern | Example |
|---------|---------|
| `button-{action}` | `button-send-message`, `button-logout` |
| `input-{field}` | `input-chat-message`, `input-search-users` |
| `sidebar-item-{id}` | `sidebar-item-sales`, `sidebar-item-teambox` |
| `tab-{section}-{id}` | `tab-sales-dashboard`, `tab-mgmt-hunches` |
| `metric-tile-{id}` | `metric-tile-0`, `metric-tile-sm-1` |
| `{type}-{description}-{id}` | `conversation-item-tc-1`, `agent-card-agent-1` |
| `text-{content}` | `text-persona-name`, `text-greeting` |
| `filter-{type}-{id}` | `filter-status-open`, `filter-channel-sms` |
| `switch-{function}-{id}` | `switch-killswitch-camp-1` |

### 13.2 Verification Criteria Summary

| Area | Key Verification |
|------|-----------------|
| Navigation | All 7 sidebar items render with correct icons and labels |
| RBAC | Marketing/Management/System hidden for org_staff |
| Sub-menus | Each sidebar item shows correct panel content |
| AI Chat | Metric tiles change per role, chat sends/receives, collapse works |
| TeamBox | 3-column layout, filters work, messages display |
| Department pages | Tab switching, metric tiles render, agent cards display |
| Campaigns | Table renders, kill switch toggles, global gate badge shows |
| Settings | Tile grid renders, role gating works, widget config opens |
| Right pane | Shows on data-display pages, hidden on chat-only/sub-menu |
| Dark mode | All elements adapt, gradients visible, text readable |

---

## 14. Wave Delivery Structure

### Wave 1 (Current): UI Prototype
- Client-side mock data
- All navigation and page shells
- Department-based structure with metric tiles
- Campaign management UI with kill switches
- Widget configuration and landing pages
- RBAC visibility gating
- Dark/light theme support

### Wave 2: Backend Integration
- Authentication (JWT + sessions)
- Database schema and migrations
- API endpoints replacing mock data
- VIN Solutions CRM sync
- Real-time notifications

### Wave 3: AI and Communication
- Claude API integration with SSE streaming
- VAPI voice integration
- Tavus video integration
- TextMagic SMS integration
- Campaign execution engine
- Hunch engine with scheduled runs

### Wave 4: Advanced Features
- Marketing Studio (video/image/podcast creation)
- Advanced analytics and reporting
- Predictive metrics
- Multi-language support
- Mobile app consideration

---

## Document Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-21 | 2.1 | Initial SRS with feature-based navigation (Main/Insights/Agents/Hub/Drive) |
| 2026-03-03 | 2.2 | Complete rewrite for persona/department-based navigation. Added: TeamBox, My Work, Sales, Service, Marketing, Management sections. Removed: Drive, standalone Agents/Insights. Added campaign system with kill switches. Updated RBAC matrix, mock data specs, layout rules. |
