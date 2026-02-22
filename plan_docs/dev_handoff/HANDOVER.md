# Nexxus Connect - Developer Handover Document

**Version:** 1.0
**Last Updated:** February 2026
**Status:** UI Prototype (Visual Reference for V2.1 Frontend Rebuild)

This document provides everything a new developer or team needs to understand, maintain, and extend the Nexxus Connect application.

---

## 1. Project Overview

**Nexxus Connect** is a ClickUp-inspired AI-powered dealership management platform. This Replit contains the visual UI prototype that serves as the design reference for the V2.1 frontend rebuild. The production application at nexxusv2.huminicdev.com has 345+ backend files, JWT authentication, 979 E2E tests, and 7 third-party integrations. This prototype demonstrates the target UI/UX while the production backend remains untouched.

### What This Prototype Demonstrates

- Complete multi-pane layout system (sidebar, sub-menu, center, right pane)
- Light and dark mode theming with full token system
- RBAC role switching (4 roles with different UI visibility)
- 6 main pages with tabbed sub-views
- AI chat interfaces with simulated responses
- Agent management with configuration panels
- File management (Drive) with share functionality
- Calendar, leads, and inbox management (Hub)
- Settings and profile management
- Favorites system
- Mobile responsive design with adaptive navigation
- Billing management with usage views and invoice builder
- Organization creation wizard (7-step)
- 20-skill AI skills catalog with category filtering
- Per-user hunch preferences
- PDF download conversion for supported file types

---

## 2. Tech Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| **Language** | TypeScript | ^5.6 | Strict mode |
| **UI Framework** | React | ^18 | Function components, hooks only |
| **Build Tool** | Vite | ^5 | HMR, aliases configured |
| **Routing** | Wouter | ^3 | Lightweight, `useLocation` hook |
| **State** | React Context | - | ThemeContext + AppContext |
| **Data Fetching** | TanStack Query | v5 | Scaffolded but unused (mock data) |
| **CSS** | Tailwind CSS | ^3 | + tailwindcss-animate, @tailwindcss/typography |
| **Components** | shadcn/ui | - | Radix UI primitives with custom styling |
| **Icons** | lucide-react | - | Primary icon library |
| **Charts** | Recharts | - | Dashboard analytics |
| **Dates** | date-fns | - | `formatDistanceToNow` for timestamps |
| **Forms** | React Hook Form + Zod | - | Scaffolded, used in create agent |
| **Server** | Express 5 | - | Static file serving only |
| **ORM** | Supabase + SecureQueryBuilder | - | Production uses RLS-enforced queries (not in prototype) |

---

## 3. Project Structure

```
nexxus-v2/
├── client/
│   ├── index.html
│   └── src/
│       ├── App.tsx                    # Root component, routes, providers
│       ├── index.css                  # Theme tokens, animations, utilities
│       ├── main.tsx                   # Entry point
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppLayout.tsx      # Shell: TopBar + Sidebar + Content + RightPane
│       │   │   ├── TopBar.tsx         # Logo, org switcher, notifications, profile
│       │   │   ├── Sidebar.tsx        # 64px icon+label navigation
│       │   │   ├── SubMenuManager.tsx # Hover/pin sub-menu panels
│       │   │   ├── SubMenuPanel.tsx   # Panel container component
│       │   │   ├── RightPane.tsx      # Automa AI chat interface
│       │   │   ├── FavoritesBar.tsx   # Desktop favorites strip
│       │   │   ├── MobileNavDropdown.tsx  # Mobile sub-menu + favorites
│       │   │   └── MobileSidebar.tsx  # Mobile sidebar variant
│       │   ├── AgentConfigPane.tsx       # Agent configuration panel (6 sections)
│       │   └── ui/                    # ~47 shadcn/ui components
│       ├── contexts/
│       │   ├── ThemeContext.tsx        # Light/dark mode management
│       │   └── AppContext.tsx         # Global app state (user, role, agents, etc.)
│       ├── hooks/
│       │   └── use-toast.ts           # Toast notification hook
│       ├── lib/
│       │   ├── utils.ts               # cn() class merge utility
│       │   └── queryClient.ts         # TanStack Query client setup
│       ├── mocks/
│       │   ├── users.ts               # Users, orgs, roles, RBAC helpers
│       │   ├── agents.ts              # AI agents with triggers, tools, knowledge
│       │   ├── messages.ts            # Chat conversations, suggestions
│       │   ├── notifications.ts       # Notification items
│       │   ├── activity.ts            # Activity feed entries
│       │   ├── files.ts               # Drive files and folders
│       │   ├── tasks.ts               # Calendar events, leads, inbox messages
│       │   ├── insights.ts            # Metrics, goals, pipeline, charts
│       │   └── index.ts               # Re-exports
│       └── pages/
│           ├── main.tsx               # Home / AI Chat (route: /)
│           ├── insights.tsx           # Analytics dashboard (route: /insights)
│           ├── agents.tsx             # Agent management (route: /agents)
│           ├── agents-create.tsx      # Create new agent (route: /agents/create)
│           ├── work-center.tsx        # Hub: calendar, leads, inbox (route: /work-center)
│           ├── drive.tsx              # File management (route: /drive)
│           ├── activity.tsx           # Activity feed (route: /activity)
│           ├── settings.tsx           # System settings (route: /settings/system)
│           ├── billing-management.tsx  # Billing management (route: /settings/billing)
│           ├── org-wizard.tsx          # Org creation wizard (route: /settings/org-wizard)
│           ├── profile.tsx            # User profile (route: /profile)
│           └── not-found.tsx          # 404 page
├── server/
│   ├── index.ts                       # Express server entry
│   ├── routes.ts                      # API routes (placeholder)
│   ├── storage.ts                     # IStorage interface (placeholder)
│   └── vite.ts                        # Vite dev server integration (DO NOT MODIFY)
├── shared/
│   └── schema.ts                      # Drizzle schema (placeholder users table)
├── tailwind.config.ts                 # Tailwind configuration with theme tokens
├── vite.config.ts                     # Vite config (DO NOT MODIFY)
├── drizzle.config.ts                  # Drizzle config (DO NOT MODIFY)
├── tsconfig.json
├── package.json
├── ACCEPTANCE_CRITERIA.md             # Detailed UI acceptance criteria
├── THEME_CONTRACT.md                  # Complete theme token documentation
├── DESIGN_CONTRACT.md                 # Design rules and component standards
├── UI_RULES.md                        # Interaction and behavioral rules
└── SITEMAP.md                         # Application route map
```

---

## 4. State Management

### 4.1 ThemeContext

| State | Type | Persistence | Purpose |
|---|---|---|---|
| `theme` | `'light' \| 'dark'` | localStorage: `nexxus:theme` | Current color mode |

**Methods:** `toggleTheme()`, `setTheme(theme)`

### 4.2 AppContext

| State | Type | Persistence | Purpose |
|---|---|---|---|
| `currentUser` | `User` | None (hardcoded) | Active user profile |
| `currentRole` | `UserRole` | localStorage: `nexxus-current-role` | Active RBAC role |
| `currentOrganization` | `Organization` | None | Active org |
| `agents` | `Agent[]` | None | Agent list (mutable) |
| `notifications` | `Notification[]` | None | Notification list (mutable) |
| `favorites` | `FavoriteItem[]` | None | Favorited pages |
| `selectedAgent` | `Agent \| null` | None | Currently viewed agent |
| `sidebarVisible` | `boolean` | None | Sidebar expand/collapse |
| `rightPaneOpen` | `boolean` | None | Right pane visibility |
| `mobileMenuOpen` | `boolean` | None | Mobile menu state |
| `activePanel` | `string \| null` | None | Hovered/active sub-menu ID |
| `subMenuExpanded` | `boolean` | None | Sub-menu pin state |
| `panelHovered` | `boolean` | None | Mouse over sub-menu panel |

**Key Methods:**
- `setCurrentRole(role)` - Switch RBAC role (persists to localStorage)
- `switchOrganization(orgId)` - Change active organization
- `addAgent(agent)`, `updateAgent(id, updates)` - Modify agent list
- `markNotificationRead(id)` - Mark notification as read
- `addFavorite(item)`, `removeFavorite(id)`, `isFavorite(path)` - Favorites management
- `toggleSubMenuExpanded()` - Pin/unpin sub-menu

---

## 5. RBAC System

### 5.1 Roles

| Role ID | Display Label | Access Level |
|---|---|---|
| `super_admin` | Super Admin | Full access to everything |
| `partner_admin` | Partner Admin | All except Data Management; read-only AI Config |
| `org_admin` | Organization Admin | Standard org-level access |
| `org_staff` | Staff | No Settings access, limited metrics |

### 5.2 Gating Functions

```typescript
canAccessSystem(role: UserRole): boolean
// Returns true for super_admin, partner_admin, org_admin
// Controls Settings page visibility in sidebar

canSwitchOrgs(role: UserRole): boolean
// Returns true for super_admin, partner_admin
// Controls org switcher availability
```

### 5.3 Role-Gated UI Elements

| Element | super_admin | partner_admin | org_admin | org_staff |
|---|---|---|---|---|
| Settings sidebar item | Yes | Yes | Yes | **No** |
| AI Configuration settings | Yes | Yes | No | No |
| Security settings | Yes | Yes | No | No |
| Data Management settings | Yes | No | No | No |
| Billing Management | Yes | Yes | No | No |
| Org Creation Wizard | Yes | Yes | No | No |
| Skills catalog (AI Config) | Yes | No | No | No |
| Kill switch | Yes | No | No | No |
| New Organization button | Yes | No | No | No |
| Tools API Keys/Webhooks tabs | Yes | No | No | No |
| Metric tile content | Platform-level | Partner-level | Org-level | Staff-level |

---

## 6. Routing

| Route | Page Component | View Config |
|---|---|---|
| `/` | MainPage | `chat-only` |
| `/insights` | InsightsPage | `data-display` |
| `/agents` | AgentsPage | `heavy-chat` |
| `/agents/create` | AgentCreatePage | `heavy-chat` |
| `/work-center` | WorkCenterPage | `sub-menu` |
| `/drive` | DrivePage | `data-display` |
| `/activity` | ActivityPage | `data-display` |
| `/settings/system` | SettingsPage | `sub-menu` |
| `/settings/billing` | BillingManagementPage | `sub-menu` |
| `/settings/org-wizard` | OrgWizardPage | `sub-menu` |
| `/settings` | SettingsPage | `sub-menu` |
| `/profile` | ProfilePage | `sub-menu` |
| `/profile/preferences` | ProfilePage | `sub-menu` |
| `/profile/billing` | ProfilePage | `sub-menu` |
| `*` (404) | NotFound | - |

---

## 7. Mock Data Layer

All data lives in `client/src/mocks/`. Each file exports typed arrays and helper functions.

| File | Exports | Approx. Records |
|---|---|---|
| `users.ts` | `mockCurrentUser`, `mockUsers`, `mockOrganizations`, role helpers | 4 users, 3 orgs |
| `agents.ts` | `mockAgents`, agent helpers, types | 5-6 agents |
| `messages.ts` | `mockChatMessages`, `mockConversations`, `agentSuggestions` | ~10 messages |
| `notifications.ts` | `mockNotifications`, icon/color helpers | ~8 notifications |
| `activity.ts` | `mockActivityFeed`, color helpers | ~10 activities |
| `files.ts` | `mockFiles`, icon/color helpers | ~15 files |
| `tasks.ts` | Calendar events, leads, inbox messages | ~8 each |
| `insights.ts` | Metrics, pipeline data, chart data, reports, hunches | 61 metrics |

### Replacing Mock Data with Real APIs

When transitioning to production:

1. API routes already exist — see `replit_reference/App Audit/server-audit.md` for the complete catalog
2. Implement storage methods in `server/storage.ts` using the `IStorage` interface
3. Replace `useState(mockData)` with TanStack Query `useQuery()` calls
4. Replace state mutations with `useMutation()` + cache invalidation
5. The query client in `lib/queryClient.ts` is already configured with a default fetcher

---

## 8. Development Workflow

### Running the App

```bash
npm run dev
```

This starts both the Vite dev server (HMR) and the Express backend on the same port. The frontend is served at `http://0.0.0.0:5000`.

### Adding a New Page

1. Create component in `client/src/pages/new-page.tsx`
2. Add route in `client/src/App.tsx` inside the `<Switch>` block
3. Add navigation item in `client/src/components/layout/Sidebar.tsx` (menuItems or bottomItems)
4. Add sub-menu content in `SubMenuManager.tsx` if the page has a sub-menu
5. Add mobile nav items in `MobileNavDropdown.tsx`
6. Update `getViewConfig()` in `AppLayout.tsx` to set the correct layout type

### Adding a New UI Component

1. Check if a shadcn/ui component already exists in `components/ui/`
2. If not, use the shadcn CLI or manually create it following existing patterns
3. Always use theme tokens from the CSS variable system
4. Add `data-testid` attributes to all interactive elements

---

## 9. Files You Must Not Modify

| File | Reason |
|---|---|
| `vite.config.ts` | Pre-configured with aliases, plugins, and server setup |
| `server/vite.ts` | Handles Vite-Express integration |
| `drizzle.config.ts` | Database configuration (production uses Supabase, not Drizzle) |
| `package.json` | Use package manager tools instead of manual edits |

---

## 10. Known Limitations (Prototype)

| Area | Limitation |
|---|---|
| Authentication | Role switcher is a dev tool for previewing RBAC-gated UI. Production uses JWT auth with 4-tier RBAC. |
| Data persistence | Prototype state resets on refresh (except theme and role). Production uses PostgreSQL with Supabase. |
| API calls | Prototype uses mock data. Production has 175+ API endpoints. |
| Search | Client-side string matching only. |
| File upload | Simulated with toast messages. |
| Real-time | No WebSocket or SSE connections. |
| Accessibility | Basic keyboard nav. No ARIA labels on custom components. |
| Testing | Prototype has no tests. Production has 979 E2E tests across 46 spec files. |
| i18n | English only. Language selector is non-functional. |

---

## 11. Production Transition Checklist

When moving from prototype to production, address these items:

- [ ] Database and migrations already exist in production (53 tables, 33 migrations)
- [ ] Authentication already exists (JWT, 4-tier RBAC)
- [ ] 175+ API routes already exist across 34 route files
- [ ] Wire prototype UI to existing 26 TanStack Query hooks
- [ ] RBAC middleware already exists (auth, enforceOrganizationContext, validateResourceOwnership)
- [ ] Add real AI integration (OpenAI/Anthropic) for chat interfaces
- [ ] Implement file upload to object storage
- [ ] Add WebSocket for real-time notifications
- [ ] Set up proper error boundaries and error handling
- [ ] Add accessibility improvements (ARIA labels, keyboard navigation)
- [ ] Write unit tests for critical business logic
- [ ] 979 E2E tests already exist (Playwright, 46 spec files)
- [ ] Configure environment variables for production secrets
- [ ] Set up CI/CD pipeline
- [ ] Performance audit (bundle size, lazy loading, code splitting)
