# Nexxus V2 - AI-Powered Dealership Platform

## Overview

Nexxus V2 is a ClickUp-inspired AI-powered dealership management platform. The project has two layers:

1. **UI Prototype (this Replit)** — A validated frontend mockup with client-side mock data, used as the design reference for the new V2.1 frontend rebuild.
2. **Production Backend (separate environment)** — A mature Express/PostgreSQL backend with 185+ API endpoints, 53 database tables, 7 third-party integrations, and 747 E2E tests running at `nexxusv2.huminicdev.com`.

### Development Strategy (V2.1)
The V2.1 cycle is a **frontend-only rebuild**. The existing backend stays untouched. The new UI from this prototype replaces the old frontend and gets wired to the existing API endpoints, hooks, and contexts.

**What gets replaced:** Visual components (pages, layout, styling)
**What gets preserved:** Backend (server/, database/, webhooks, jobs), integration plumbing (AuthContext, 26 TanStack Query hooks, API client, SSE streaming, ChatContext)

### Governing Documentation (v2.1)
Nine documents in `plan_docs/v2.1/` govern the frontend rebuild:
1. **CLAUDE_CODE_HANDOFF_PROMPT.md** — The primary handoff document for Claude Code. Contains project structure, API contract reference, integration plumbing carry-forward list, frontend rebuild phases, known bugs, and testing protocol. **Start here.**
2. **CARRY_FORWARD_MANIFEST.md** — Exact file-by-file inventory: 32 files to preserve (26 hooks, 4 contexts, API client, SSE streaming), 8 to reference, 11 replaceable mocks
3. **DO_NOT_TOUCH.md** — Explicit freeze list for all backend files (server routes, services, webhooks, jobs, migrations, tests, docs)
4. **REVERSE_SRS.md** — Documents actual vs. planned implementation (237 endpoints vs 63 planned, 53 tables vs 17 planned, 91 metrics, 747 E2E tests)
5. **DEVELOPMENT_TEAM_BRIEFING.md** — Hard-won lessons, critical gotchas, and guidance from the original development team
6. **NEW_CONSTITUTION.md** — Platform identity, principles, metric formulas (immutable), RBAC, naming conventions, non-negotiable constraints
7. **NEW_SRS.md** — Full system requirements: 91 library metrics, 6 report specs, hunch engine spec
8. **NEW_IMPLEMENTATION_PLAN.md** — Modular sprint-based plan, dependency graph, gate criteria
9. **NEW_CLAUDE.md** — Implementation patterns, RBAC matrix, testing requirements

**Document priority:** New UI Design > ACCEPTANCE_CRITERIA (UI truth) > Constitution (principles) > Audit Files (API contract) > SRS (requirements) > Implementation Plan (sequencing)

### Existing Backend (documented in replit_reference/App Audit/)
Five forensic audit files document the production backend:
- `server-audit.md` — 185 endpoints across 34 route files, complete API catalog with auth/RBAC requirements
- `database-audit.md` — 53 tables, 100+ RLS policies, 58 JSONB columns, 33 migration files
- `client-audit.md` — 26 TanStack Query hooks, 4 context providers, 59 custom components, integration plumbing inventory
- `health-audit.md` — 747 E2E tests, build system, PM2 deployment, dependency inventory
- `DATA_ACCURACY_REPORT.md` — VAPI/Tavus/VIN data integrity findings, webhook gap analysis

Supporting files:
- `plan_docs/ACCEPTANCE_CRITERIA.md` — Pixel-level UI behavior spec (updated 2026-02-21)
- `replit_reference/Metrics/` — Exact metric formulas for Org Admin, Staff, Reports, Library
- `replit_reference/new_instructions/` — Agent Instructions (team protocol) and Hunch Instructions (AI prompt)

### V3 Redesign Summary
- **RBAC**: currentRole state with localStorage persistence, tiny arrow dropdown on far-right of TopBar
- **TopBar**: Logo left, org switcher center (Building2 icon + name + chevron), notifications/activity/theme/profile/role-arrow right
- **Main Page**: 4-across gradient metric tiles (role-specific, responsive 4→2→1), "AI Key Metrics" title, window-blind collapse after first chat (tiles animate up, Show/Hide toggle), 1 sample chat response, always-visible smaller suggestion bubbles, no chat avatars, wave-dot animation. Metric modals show rich breakdown data with Key Insights section.
- **Insights**: 4 tabs - Dashboard (Command Center/Pipeline/Charts/Scorecard), Reports, Library, Hunches. Sub-menu includes Activity
- **Right Pane**: Desktop (md+) = side-by-side panel (w-80/lg:w-96) alongside main content. Mobile (<md) = full-screen overlay. Main content always rendered first in DOM order.
- **Automa Pop-out**: MessageCircle button (primary-tinted circle) visible when right pane is closed on data-display pages (not Home, not Agents). Mobile FAB at bottom-right. Opens right pane for contextual data discussion.
- **Agents**: List panel (272px, desktop only) / detail center / config toggles via right pane (<< / >> button)
- **Hub**: 4 tabs - Calendar, Approvals, Communication, Open Leads (Tasks/Hunches removed)
- **Drive**: Share button per file, share modal with Email/SMS tabs
- **Settings**: Tile-based grid navigation, role-gated sections. "Tools & Integrations" tile has 3 tabs: Tools, Widgets, Landing Pages
- **Widgets**: 4 fixed widget types (Text Chat, Live Video, Voice Call, Unified) under Tools → Widgets tab. Each has Settings, Appearance, Targeting, Domains, Embed sub-tabs. Preview modals per widget. Unified widget links to /w/demo landing page
- **Widget Landing Page**: /w/demo route (outside AppLayout) — standalone customer service page with 6 channel cards, contact form, "Launch Live Video Chat" button. Powered by Nexxus footer
- **Chat standard**: Bot left / user right, no avatars, wave-dot animation everywhere. Thinking card (collapsible AI reasoning) in first bot message. Chat input placeholder: "Ask me anything about your business"
- **Activity**: Moved into Insights sub-menu (no longer standalone sidebar item)
- **SubMenu timeout**: 800ms leave timeout for better usability (with proper cleanup on unmount)
- **Right Pane**: Desktop (md+) = side-by-side panel (w-80/lg:w-96) alongside main content. Mobile (<md) = full-screen overlay. Main content always rendered first in DOM order.
- **Sub-menu tab switching**: Uses custom events (`insights-tab-change`, `hub-tab-change`) to handle query-param-only URL changes that wouter doesn't detect. Active tab tracked via local state for immediate highlight updates.
- **Chat history**: Hover-reveal 3-dot menu (Resume/Delete) on conversation items. Keyboard accessible (role="button", tabIndex, Enter/Space).
- **Drive copy link**: Uses `navigator.clipboard.writeText()` with toast feedback

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for development and building
- **Wouter** for client-side routing (lightweight alternative to React Router)
- **TanStack Query** for data fetching patterns (currently using mock data)
- **Tailwind CSS** with custom design tokens for styling
- **Shadcn/ui** component library (Radix UI primitives with custom styling)

### Layout Architecture
The app uses a context-aware multi-pane layout system with ClickUp-style navigation:

**ClickUp-Style Navigation Pattern (6 key behaviors):**
1. **Thin Sidebar**: Always-visible 64px icon+label strip with navigation icons
2. **Hover Preview**: Hovering sidebar items shows sub-menu panel as preview
3. **Click Navigates Only**: Clicking navigates to the page and sets activePanel (no auto-pin)
4. **Double Arrow Pins Globally**: Toggle under logo controls `subMenuExpanded` state
5. **Collapse in Panel Header**: ChevronLeft button in sub-menu header collapses panel
6. **Global Persistence**: When pinned, sub-menu stays visible across all page navigations

**Layout Components:**
- **Left Sidebar** (`Sidebar.tsx`): Thin icon+label navigation strip (w-16, 64px). Toggle arrows only visible on pages with sub-menus (hidden on home page)
- **Sub-Menu Manager** (`SubMenuManager.tsx`): Fixed-position overlay (left-16 top-14 z-40) that renders appropriate sub-menu based on `activePanel`. Uses 200ms timeout for hover-leave to hide
- **Main Content**: Route-specific content area
- **Right Pane**: Persistent AI chat interface (Automa), defaults closed, hidden on mobile with FAB access
- **Home Page**: Has its own internal Favorites/Message History panel (not part of SubMenuManager system)

View configurations auto-select based on route:
- `chat-only`: Main page - centered chat, no right pane
- `data-display`: Drive, Insights, Activity - data tables with right pane
- `sub-menu`: Work Center, Settings, Profile - tabbed interfaces
- `heavy-chat`: Agents - list/detail with chat

### State Management
- **ThemeContext**: Light/dark mode with localStorage persistence and system preference detection
- **AppContext**: Global app state including:
  - `activePanel`: Currently active/hovered sub-menu panel ID (null, 'agents', 'drive', etc.)
  - `subMenuExpanded`: Global pin state for sub-menu (true = always show)
  - `panelHovered`: Whether mouse is currently over sub-menu panel
  - Current user, organization, agents, notifications
- No external state library - React Context handles all global state

### Data Layer
**This Replit (UI prototype):** All data is mocked in `/client/src/mocks/` — these files will be deleted during the V2.1 rebuild and replaced with TanStack Query hooks calling the existing API.

**Production backend:** Real data served from PostgreSQL (Supabase-hosted) via 185+ API endpoints. JWT authentication, 4-tier RBAC with RLS, SSE streaming for AI chat, 7 third-party integrations. See `replit_reference/App Audit/` for complete documentation.

### Production Backend (Existing — Separate Environment)
The production backend at `nexxusv2.huminicdev.com` includes:
- **53 database tables** with 100+ RLS policies (33 migration files)
- **185+ API endpoints** across 34 route files
- **36+ service files** for business logic (DealerBrainService is 3,047 lines)
- **JWT authentication** with access/refresh token management
- **7 integrations**: VIN Solutions (OAuth2), VAPI (voice), Tavus (video), Resend (email), TextMagic (SMS), Claude API (AI), Google Calendar
- **8 scheduled jobs**: VIN lead polling, token refresh, cache cleanup, etc.
- **747 E2E tests** via Playwright
- **Known issues**: RLS variable name mismatch in SecureQueryBuilder, VAPI webhook data gap (see DATA_ACCURACY_REPORT.md)

### Design System
Custom theme tokens defined in `client/src/index.css`:
- Dual-density typography: 13px for data tables, 14-15px for chat
- Slate color palette with purple primary accent
- CSS custom properties for light/dark mode switching
- Consistent spacing, radius, and shadow tokens

### Build Configuration
- Development: `npm run dev` - Vite dev server with HMR
- Production: `npm run build` - Vite builds client to `dist/public`, esbuild bundles server
- Database: `npm run db:push` - Drizzle Kit for schema migrations (when backend is implemented)

## External Dependencies

### UI Components
- **Radix UI**: Full primitive suite (dialog, dropdown, tabs, etc.)
- **Lucide React**: Icon library (muted gray icons per design spec)
- **Recharts**: Chart library for Insights dashboard
- **date-fns**: Date formatting utilities
- **cmdk**: Command palette component
- **embla-carousel-react**: Carousel component

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **tailwind-merge**: Intelligent class merging

### Form Handling
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **@hookform/resolvers**: Zod integration for React Hook Form

### Database (Production — Separate Environment)
- **PostgreSQL** (Supabase-hosted): 53 tables, 100+ RLS policies
- **pg** client library: Direct pool queries with RLS session variables
- **Drizzle ORM**: Schema definition (minimal — most queries use raw pg)
- **33 migration files**: Sequential SQL migrations (001-033)

### Backend (Production — Separate Environment)
- **Express 5**: Web server framework (pre-release)
- **JWT authentication**: bcrypt + jsonwebtoken
- **7 third-party integrations**: VIN Solutions, VAPI, Tavus, Resend, TextMagic, Claude API, Google Calendar
- **SSE streaming**: DealerBrain AI responses via Server-Sent Events
- **Multer**: File uploads (50MB limit)
- **Helmet + express-rate-limit**: Security headers and rate limiting
- **PM2**: Process management in production

### Backend (This Replit — Minimal)
- **Express 5**: Serves the Vite frontend only
- `server/routes.ts`: Placeholder — real routes are in the production environment
- `shared/schema.ts`: Placeholder users table (18 lines)

### Development Tools
- **TypeScript**: Type checking (strict mode)
- **Vite plugins**: Replit-specific dev banner and error overlay
- **esbuild**: Server bundling for production
- **Playwright** (production environment): 747 E2E tests across 46 spec files