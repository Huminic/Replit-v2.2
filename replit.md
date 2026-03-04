# Nexxus Connect v2.2 — AI-Powered Dealership Platform

## Overview

Nexxus Connect is an AI-powered dealership management platform with persona/department-based navigation. The project has two layers:

1. **UI Prototype (this Replit)** — A validated frontend with client-side mock data, structured around a 4-wave product roadmap. Persona-based navigation replaces the previous feature-based layout.
2. **Production Backend (separate environment)** — A mature Express/PostgreSQL backend with 185+ API endpoints, 53 database tables, 7 third-party integrations, and 747 E2E tests running at `nexxusv2.huminicdev.com`.

### Development Strategy (v2.2)
The v2.2 cycle restructures the UI from feature-based navigation (Main/Insights/Agents/Hub/Drive) to persona/department-based navigation (AI Chat/TeamBox/My Work/Sales/Service/Marketing/Management). The existing backend stays untouched until Wave 2.

### Documentation Suite
Seven documents in the project root govern the rebuild:
1. **CLAUDE.md** — Agent rules, truth hierarchy, forbidden actions, naming conventions
2. **PRD.md** — Product requirements, target users, business goals, 4-wave vision
3. **SRS.md** — System requirements, functional specs, business rules, integrations
4. **SPEC.md** — Architecture document, file structure, component hierarchy, RBAC matrix
5. **PLAN.md** — 4-wave marching orders, current phase status, completion criteria
6. **ACCEPTANCE_CRITERIA.md** — Testable statements organized by wave
7. **COMMENT_INDEX.md** — Master reference for all developer comments in the codebase

Supporting documentation:
- **`.agent_docs/`** — Agent team rules, acceptance criteria (Given/When/Then), codebase index, code conventions

**Truth hierarchy:** UI Design > Acceptance Criteria > Constitution > API Contract > SRS > Plan

## Navigation Structure (v2.2)

### Sidebar Items (top to bottom)
| Section | Icon | Route | RBAC | Description |
|---------|------|-------|------|-------------|
| AI Chat | MessageSquare | `/` | All | Main AI chat with persona name from org config |
| TeamBox | Inbox | `/teambox` | All | CommBox-inspired 3-column conversation inbox |
| My Work | User | `/my-work` | All | Personal dashboard, tasks, assistant |
| Sales | TrendingUp | `/sales` | Sales + Admin | Pipeline, leads, agents, calendar |
| Service | Wrench | `/service` | Service + Admin | Campaigns, appointments, agents |
| Marketing | Megaphone | `/marketing` | Marketing + Admin | Campaigns, studio, widget insights |
| Management | BarChart3 | `/management` | Manager + Admin | Cross-section KPIs, ROI, hunches |
| System | Settings | `/settings/*` | Admin | Settings, users, tools, widgets |

### Removed Features (not in MVP contract)
- Drive (file storage/sharing)
- Custom Agent creation (non-Super Admin)
- Standalone Activity page
- Skills references in agent config
- Artifact sharing

### Cardinal Layout Rules
- **Data/information in center** → chat in the right pane
- **Chat in center** → information/configuration in the right pane
- **TeamBox** uses its own internal 3-column layout (not global right pane)
- **Agent "Take Over"** navigates to TeamBox with that conversation selected

## System Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for development and building
- **Wouter** for client-side routing
- **TanStack Query** for data fetching patterns (currently using mock data)
- **Tailwind CSS** with custom design tokens
- **Shadcn/ui** component library (Radix UI primitives)

### Layout Architecture
Context-aware multi-pane layout with ClickUp-style navigation:

**Navigation Behaviors:**
1. **Thin Sidebar**: Always-visible 72px icon+label strip
2. **Hover Preview**: Hovering sidebar items shows sub-menu panel
3. **Click Navigates**: Clicking navigates to the page and sets activePanel
4. **Double Arrow Pins**: Toggle under logo controls `subMenuExpanded` state
5. **Panel Collapse**: ChevronLeft button in sub-menu header collapses panel
6. **Global Persistence**: When pinned, sub-menu stays visible across pages

**Layout Components:**
- **Sidebar** (`Sidebar.tsx`): 72px icon navigation with RBAC gating via `canAccessSection()`
- **SubMenuManager** (`SubMenuManager.tsx`): Panels for ai-chat, teambox, my-work, sales, service, marketing, management, system, profile
- **AppLayout** (`AppLayout.tsx`): View config routing (chat-only, data-display, sub-menu, heavy-chat, teambox)
- **RightPane** (`RightPane.tsx`): Contextual right panel (chat on data pages, info on chat pages)
- **TopBar** (`TopBar.tsx`): Logo, org switcher, globe icon (landing page link), notifications, theme, profile

### State Management
- **ThemeContext**: Light/dark mode with localStorage persistence
- **AppContext**: Global app state including:
  - `activePanel`: Currently active/hovered sub-menu panel
  - `subMenuExpanded`: Global pin state for sub-menu
  - `currentRole`: User role with RBAC gating
  - `personaName`: AI persona name (configurable per org — Serra, Aria, Nova; NOT "Automa")
  - `communicationGateEnabled`: Master switch for all outbound automated communications
- No external state library — React Context handles all global state

### Routes
```
/                    → AI Chat (main.tsx)
/teambox             → TeamBox inbox (teambox.tsx)
/my-work             → My Work dashboard (my-work.tsx)
/sales               → Sales section (sales.tsx)
/service             → Service section (service.tsx)
/marketing           → Marketing section (marketing.tsx)
/management          → Management section (management.tsx)
/agents              → Agent list (agents.tsx)
/agents/:id          → Agent detail
/insights            → Insights (insights.tsx)
/settings/system     → System settings (settings.tsx)
/settings/org-wizard → Organization wizard
/settings/billing    → Billing (Super Admin)
/profile/*           → Profile pages
/w/demo              → Widget landing page (standalone, outside AppLayout)
```

### RBAC
Roles (8 total): `super_admin`, `partner_admin`, `org_admin`, `executive`, `sales_manager`, `sales`, `service`, `marketing`

> `org_staff` was REMOVED from the codebase entirely.

Section gating via `canAccessSection()` in `mocks/users.ts`:
- AI Chat, TeamBox, My Work: All roles
- Sales: sales, sales_manager, org_admin, executive, partner_admin, super_admin
- Service: service, org_admin, executive, partner_admin, super_admin
- Marketing: marketing, org_admin, executive, partner_admin, super_admin
- Management: org_admin, executive, sales_manager, partner_admin, super_admin
- System: `canAccessSystem()` — org_admin and above

### Mock Data Layer
All data is mocked in `/client/src/mocks/`:
- `agents.ts` — Agents tagged by department (sales/service/marketing)
- `campaigns.ts` — Campaign data with kill-switch state
- `conversations.ts` — TeamBox conversations with channel/status metadata
- `insights.ts` — Metrics tagged by section
- `users.ts` — Users with RBAC helpers
- `widgets.ts` — Widget configurations and landing pages

### Campaign Safety System
- **Per-campaign kill switch**: Toggle in Service/Marketing Campaigns tabs
- **Per-conversation disconnect**: Button in TeamBox to stop AI for individual customers
- **Global communication gate**: Master toggle in Settings → Organization that halts ALL outbound automated communications

### Widget Configuration (Settings → Tools → Widgets)
- **Widget list**: Table layout with name, embed code (copy icon), status, last updated, actions
- **Widget detail**: Accordion sections (Appearance, Channels, Targeting, Embed) with live preview sidebar
- **Landing page** (`/w/demo`): Clean split layout — sign-up form on left, branding on right

## Production Backend (Separate Environment)
The production backend at `nexxusv2.huminicdev.com` includes:
- **53 database tables** with 100+ RLS policies
- **185+ API endpoints** across 34 route files
- **JWT authentication** with access/refresh token management
- **7 integrations**: VinSolutions (OAuth2), VAPI (voice), Tavus (video), Resend (email), TextMagic (SMS), Claude API (AI), Google Calendar
- **747 E2E tests** via Playwright

## 4-Wave Product Roadmap
- **Wave 1** (current): UI shell restructuring, persona-based nav, mock data, RBAC, campaign safety UI
- **Wave 2**: Backend wiring to production API, real auth, real data, real-time updates
- **Wave 3**: Credit/metering system (must ship before Studio), advanced reports, competitor intelligence
- **Wave 4**: Studio (video/image/podcast creation), advanced AI features

### Developer Comment Index
All files have comprehensive JSDoc and inline developer comments. The master reference is `COMMENT_INDEX.md` in the project root — it tracks every file's purpose, cardinal layout rules, RBAC, production wiring notes, and instructions for keeping comments in sync when the codebase changes.

## Auth System (extracted from v2.1, not yet wired)
The following files exist in the codebase but are NOT connected to app routing yet (Wave 2 task):
- `client/src/pages/login.tsx` — Login page with random wallpaper backgrounds (9 images in `/wallpapers/`)
- `client/src/pages/forgot-password.tsx` — Password reset request
- `client/src/pages/reset-password.tsx` — Password reset form
- `client/src/contexts/AuthContext.tsx` — JWT auth state provider
- `client/src/components/auth/ProtectedRoute.tsx` — Route guard for authenticated pages
- `client/src/components/auth/SessionTimeoutDialog.tsx` — Auto-logout dialog
- `client/src/hooks/useSessionTimeout.ts` — Session timeout hook
- `client/src/hooks/useFirstLogin.ts` — First login detection hook

## Design Constraints Quick Reference

### Chat Interface
- Bot messages: left-aligned, no avatar/icon
- User messages: right-aligned, no avatar/icon
- Thinking animation: `.wave-dot` CSS class, 3 dots with delays 0s/0.15s/0.3s
- Input: gradient border wrapper via `.chat-input-gradient` class
- Persona name: comes from `currentOrganization.personaName` in AppContext (Serra, Aria, Nova). Never "Automa" or "AI"

### Metric Tiles (Main Page)
- Layout: 2x2 grid, max-w-3xl centered
- Each tile: gradient background (bg-gradient-to-br), decorative SVG circles, icon badge
- Role-specific metrics per all 8 roles (see roleMetrics in main.tsx)
- Hover: scale-[1.02] + shadow-lg transition
- Tiles collapse after first user message

### Cardinal Layout Rules
- Data in center → AI chat in right pane (Sales, Service, Marketing, Management pages)
- Chat in center → info/config on right pane (AI Chat page, Agent detail page)
- TeamBox uses its own 3-column layout (NOT the global right pane)

### Page Structure
- Sales/Service/Marketing: Dashboard / Agents / Campaigns / Insights / Calendar tabs
- Management: Dashboard / Insights / Hunches / Activities / ROI tabs
- Insights: Dashboard / Reports / Library / Hunches (4 tabs)
- Settings: Tile-based grid, role-gated per section
- My Work: Dashboard / Tasks / Chat / Assistant tabs

### Color Coding
- Hunch types: opportunity=green, threat=red, insight=blue
- Pipeline alerts: critical=red, warning=amber, info=blue
- Agent status: active=green dot, inactive=muted dot
- Campaign status: active=green, paused=amber, draft=gray, completed=blue

## Build Configuration
- Development: `npm run dev` — Vite dev server with HMR
- Production: `npm run build` — Vite builds client to `dist/public`, esbuild bundles server

## User Preferences
Preferred communication style: Simple, everyday language.
