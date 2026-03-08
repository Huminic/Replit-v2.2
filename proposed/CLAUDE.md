# PROPOSED — CLAUDE.md (Sweep 3E Draft)

> **Status: PROPOSED** — This document requires explicit owner approval before replacing the live CLAUDE.md. Do not promote automatically.

---

# Nexxus Connect — Agent Implementation Guide v3.0

**Version:** 3.0
**Date:** 2026-03-08
**Status:** GOVERNANCE DOCUMENT — Direct guidance for implementation agents
**Cross-References:** [ACCEPTANCE_CRITERIA.md](./ACCEPTANCE_CRITERIA.md) · [GUARDRAILS.md](./GUARDRAILS.md) · [PLAN.md](./PLAN.md) · [ISSUES.md](./ISSUES.md)

---

## 1. Your Role

You are an implementation agent for Nexxus Connect. The frontend UI prototype is complete and validated. Your job is to extend, maintain, and wire it to real data — NOT to redesign it.

### 1.1 The Golden Rule

**Change the data source, not the UI.** Every page, component, interaction, and animation in the current UI is the approved design. When wiring to backend, replace mock imports with API calls.

### 1.2 Truth Hierarchy (from Sweep 1A)

| Tier | Source | Authority |
|------|--------|-----------|
| T1 | Runtime UI code (`client/src/`) | Highest — all visual behavior, layout, interactions |
| T2 | `ACCEPTANCE_CRITERIA.md` (root) | Verifiable behaviors documented from UI |
| T3 | `GUARDRAILS.md` | Agent rules and constraints |
| T4 | `PLAN.md` / `STABILIZATION_PLAN.md` | Sequencing and roadmap |
| T5 | `PRD.md`, `audits/`, `.agent_docs/` | Reference material |
| T6 | Quarantined documents (SPEC.md, SRS.md, Sprint_log.md, etc.) | No authority |

### 1.3 Canonical Identity Model

- **Org-centered tenancy**: every data entity has an `org_id`
- **Main app chat** is canonical: `shared/schema.ts` with UUID PKs, org-scoped, JWT+RBAC
- `shared/models/chat.ts` is deprecated (serial PKs, no org scope, table name collision) — scheduled for removal in P1.1

---

## 2. Project Architecture

### 2.1 Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Routing:** wouter
- **State:** React Context (`AppContext`, `AuthContext`, `ThemeContext`) + TanStack Query v5
- **Backend:** Express.js (serves both API and Vite dev server)
- **Database:** PostgreSQL + Drizzle ORM (`shared/schema.ts`) with drizzle-zod
- **AI:** Anthropic Claude (claude-sonnet-4-6) via SDK

### 2.2 File Structure

```
client/src/
├── App.tsx                    # Route registration, providers
├── main.tsx                   # Entry point
├── index.css                  # Theme tokens, custom utilities
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx      # Shell: TopBar + Sidebar + SubMenu + Main + RightPane
│   │   ├── TopBar.tsx         # Logo, org switcher, notifications, activity, profile
│   │   ├── Sidebar.tsx        # 64px icon rail with 7 main + 1 bottom items
│   │   ├── SubMenuManager.tsx # Hover/pin sub-menu panels per section
│   │   ├── SubMenuPanel.tsx   # Individual panel renderer
│   │   ├── RightPane.tsx      # Automa chat (contextual AI assistant)
│   │   ├── FavoritesBar.tsx   # Favorites quick-access bar
│   │   ├── MobileNavDropdown.tsx
│   │   └── MobileSidebar.tsx
│   ├── auth/
│   │   ├── ProtectedRoute.tsx # Auth-gated route wrapper
│   │   └── SessionTimeoutDialog.tsx
│   ├── AgentConfigPane.tsx    # Agent configuration in right pane
│   ├── AppointmentCalendar.tsx # Calendar with appointment creation
│   ├── ErrorBoundary.tsx      # Error boundary wrapper
│   ├── MarkdownMessage.tsx    # Markdown rendering for AI messages
│   └── ui/                    # shadcn primitives (DO NOT MODIFY)
├── contexts/
│   ├── AppContext.tsx          # Global app state, RBAC, agents, favorites
│   ├── AuthContext.tsx         # JWT auth state, login/logout, token refresh
│   └── ThemeContext.tsx        # Light/dark mode
├── hooks/
│   ├── use-mobile.tsx          # Mobile breakpoint detection
│   ├── use-toast.ts            # Toast notifications
│   ├── useFirstLogin.ts        # First login detection
│   ├── useSessionTimeout.ts    # Session timeout management
│   └── useStreamingChat.ts     # AI chat streaming hook
├── lib/
│   ├── queryClient.ts          # TanStack Query client + apiRequest helper
│   ├── utils.ts                # cn() utility
│   ├── rbac.ts                 # RBAC utility functions
│   ├── activity-utils.ts       # Activity feed helpers (contains staticActivityFeed — to be wired)
│   ├── agent-utils.ts          # Agent helper functions
│   ├── chat-types.ts           # Chat type definitions
│   ├── insight-data.ts         # Insight mock data (to be replaced in P2.1)
│   ├── notification-utils.ts   # Notification helpers
│   └── widget-types.ts         # Widget type definitions
├── mocks/                      # Mock data (to be removed after P2.6)
│   ├── activity.ts, agents.ts, campaigns.ts, conversations.ts
│   ├── files.ts, insights.ts, messages.ts, notifications.ts
│   ├── tasks.ts, users.ts, widgets.ts
└── pages/
    ├── main.tsx               # AI Chat with CRM Guru mode
    ├── teambox.tsx            # CommBox-inspired 3-column inbox
    ├── my-work.tsx            # Personal dashboard, tasks, assistant
    ├── sales.tsx              # Sales department dashboard
    ├── service.tsx            # Service department dashboard
    ├── marketing.tsx          # Marketing department dashboard
    ├── management.tsx         # Management dashboard with hunches
    ├── agents.tsx             # Agent detail/config view
    ├── insights.tsx           # Standalone insights page (100% mock — P2.1)
    ├── settings.tsx           # System settings (9 tiles, RBAC-gated)
    ├── billing-management.tsx # Billing (Super/Partner Admin only)
    ├── org-wizard.tsx         # Org creation wizard (unwired — P2.4)
    ├── profile.tsx            # User profile with tabs
    ├── usage.tsx              # Usage/metering page
    ├── login.tsx              # Login page
    ├── forgot-password.tsx    # Forgot password (stub — P1.4)
    ├── reset-password.tsx     # Reset password (stub — P1.4)
    ├── widget-landing.tsx     # Public widget landing page
    └── not-found.tsx          # 404 page

server/
├── index.ts                   # Server entry
├── routes.ts                  # 90 API routes
├── storage.ts                 # IStorage interface + DatabaseStorage
├── auth.ts                    # JWT authentication middleware
├── seed.ts                    # Test data seeding
├── outbound.ts                # Outbound engine with kill switch + usage logging
├── sync.ts                    # VinSolutions data sync service
├── braveSearch.ts             # Brave Search API integration
├── vendorProxy.ts             # Vendor API proxy (Tavus, etc.)
├── central-mcp (external)     # MCP server for VinSolutions connectivity
├── static.ts                  # Static file serving
└── vite.ts                    # Vite dev server integration (DO NOT MODIFY)

shared/
├── schema.ts                  # Drizzle schema — 23 tables, insert schemas, types
└── models/
    └── chat.ts                # DEPRECATED — serial PKs, table name collision (remove in P1.1)

scripts/
└── enforcer.ts                # Compliance scanner
```

### 2.3 Route Map

```
/                        → AI Chat (main.tsx)
/teambox                 → TeamBox unified inbox
/my-work                 → My Work personal dashboard
/sales                   → Sales department
/service                 → Service department
/marketing               → Marketing department
/management              → Management dashboard
/agents                  → Agent detail
/insights                → Insights standalone
/settings                → Settings tile grid
/settings/system         → System Settings
/settings/billing        → Billing Management
/settings/org-wizard     → Org Creation Wizard
/profile                 → Profile
/profile/preferences     → Profile preferences
/profile/billing         → Profile billing
/usage                   → Usage metering
/login                   → Login
/forgot-password         → Forgot password
/reset-password          → Reset password
/w/demo                  → Widget landing page (public, no AppLayout)
```

---

## 3. What You Must NOT Change

### 3.1 Locked UI Elements

| Category | Locked Behavior |
|----------|----------------|
| **TopBar** | Logo text "Nexxus Connect", org switcher center, icons right |
| **Sidebar** | 64px width, 7 main items + System bottom, purple active indicator |
| **SubMenuManager** | Hover/pin system, 800ms leave timeout |
| **Right Pane** | w-80/lg:w-96, Automa pop-out button on data-display pages |
| **Chat bubbles** | Bot left (bg-card), user right (bg-primary), no avatars |
| **Metric tiles** | Gradient backgrounds, SVG circles, window-blind collapse after first message |
| **TeamBox** | 3-column layout: filters + conv list + chat thread + customer info |

### 3.2 Locked Design Tokens

```css
--density-data: 13px;
--density-chat: 14-15px;
--sidebar-width: 64px;
--topbar-height: 56px;
--right-pane-width: 320px;
--right-pane-width-lg: 384px;
```

### 3.3 Layout Rules (Cardinal Rules)

- Data/information in center → chat on right pane (Sales, Service, Marketing, Management)
- Chat in center → information on right pane (AI Chat page)
- TeamBox has its own 3-column layout; does NOT use global right pane

---

## 4. RBAC (8 Roles)

```
Platform level:   super_admin(1) > partner_admin(2)
Org level:        org_admin(3) > executive(4) > sales_manager(5)
Department level: sales(6), service(7), marketing(8)
```

| Section | super_admin | partner_admin | org_admin | executive | sales_manager | sales | service | marketing |
|---------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| AI Chat | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| TeamBox | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| My Work | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sales | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Service | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Marketing | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Management | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Settings | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Billing Mgmt | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Org Wizard | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 5. Naming Conventions

| Concept | Internal | User-Facing | Rule |
|---------|----------|-------------|------|
| Platform | Nexxus | Nexxus Connect | Logo text, no icon |
| AI assistant | persona | Org's persona name (e.g., "Serra") | Never expose "persona" |
| Voice AI | VAPI | Voice Agent | Never expose "VAPI" |
| Video AI | Tavus | Video Agent | Never expose "Tavus" |
| CRM | VIN Solutions | CRM Integration | Never expose vendor |
| Agent capabilities | tools | Skills | UI always says "Skills" |
| AI insights | hunches | Hunches | Confidence-scored patterns |

---

## 6. State Management

### 6.1 Contexts

- **AppContext** — UI state (activePanel, sidebarVisible, rightPaneOpen) + data state (currentUser, currentRole, currentOrganization, agents, notifications, favorites)
- **AuthContext** — JWT auth state, login/logout, token refresh, session timeout
- **ThemeContext** — Light/dark mode toggle

### 6.2 Data Fetching Pattern

```tsx
// Reading data:
const { data, isLoading } = useQuery({
  queryKey: ['/api/resource', orgId],
});

// Mutating data:
const mutation = useMutation({
  mutationFn: (data) => apiRequest('POST', '/api/resource', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/resource'] });
  },
});
```

---

## 7. Key Features

### 7.1 Campaign System
- Campaigns in Service and Marketing sections
- CSV upload, message templates with variable substitution
- Kill switch per campaign, per-conversation disconnect, global communication gate
- 4-layer safety: Global env → org comm gate → per-channel toggles → rate limit

### 7.2 TeamBox (Unified Inbox)
- 3-column layout: filters → conversation list → chat thread → customer info
- Statuses: open, assigned, participating, automated, scheduled, followup, pending, closed
- Channels: sms, email, chat, whatsapp, voice

### 7.3 Widget System
- 4 widget channels in runtime UI: chat, video, voice, form
- Widget landing page at /w/demo
- Settings-level widget configuration with appearance, targeting, domains, embed code

### 7.4 AI Hunches
- Pattern-based insights in Management → Hunches tab
- Generate via Anthropic AI, ranked by confidence and impact
- Accept/dismiss/resolve workflow

---

## 8. External Dependencies

| Service | Purpose | Status |
|---------|---------|--------|
| Anthropic Claude | AI chat, hunch generation | Wired |
| TextMagic | SMS outbound | Wired |
| Resend | Email outbound | Wired |
| VinSolutions | Lead data sync | Wired |
| Brave Search | Web search for AI | Wired |
| VAPI | Voice outbound | Stub (console.log) — P3.1 |
| Tavus | Video calls | Stub (read-only proxy) — P3.2 |

---

## 9. Forbidden Actions

1. **NEVER** modify `server/vite.ts` or `vite.config.ts`
2. **NEVER** modify `package.json` without explicit approval
3. **NEVER** modify `drizzle.config.ts`
4. **NEVER** modify files in `client/src/components/ui/` (shadcn primitives)
5. **NEVER** expose vendor names (VAPI, Tavus, VIN Solutions) in user-facing UI
6. **NEVER** fabricate data or show unverified metrics
7. **NEVER** bypass RBAC or multi-tenant isolation
8. **NEVER** hardcode integration-specific values (API keys, phone numbers)
9. **NEVER** modify governance documents without the Promotion Workflow (R11)
10. **NEVER** mark ISSUES.md items RESOLVED without evidence
11. **NEVER** use emojis in the UI — use Lucide icons instead
12. **NEVER** nest a Card inside another Card
13. **ALWAYS** preserve existing users — never drop, truncate, or destructively migrate
14. **ALWAYS** add `data-testid` attributes to interactive and meaningful display elements
15. **ALWAYS** use existing shadcn components rather than creating custom alternatives
16. **ALWAYS** update MEMORY.md at end of session
17. **ALWAYS** run post-sweep/phase drift check before reporting completion

---

## 10. Quick Reference

| I need to... | File(s) to modify |
|---|---|
| Add a new database table | `shared/schema.ts` |
| Add a new API endpoint | `server/routes.ts` |
| Add database operations | `server/storage.ts` |
| Replace mock data on a page | Page file in `client/src/pages/*.tsx` |
| Add a new page | `client/src/pages/*.tsx` + register in `client/src/App.tsx` |
| Track a new issue | `ISSUES.md` |
| Log session work | `MEMORY.md` |
| Propose governance change | `proposed/` directory + request owner approval |
