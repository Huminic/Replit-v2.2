# SPEC.md — Nexxus Connect V2.2 Architecture Specification

## Overview

Nexxus Connect is a multi-tenant AI-powered dealership platform organized around department-based navigation (Sales, Service, Marketing, Management) with unified communication management (TeamBox), personal productivity (My Work), and a central AI chat interface. The application is a frontend-heavy SPA with a thin Express backend; all business logic and UI state lives client-side using React context and mock data during Wave 1.

**Tech Stack**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, wouter (routing), TanStack Query v5, Express, Node.js

## 1. File Structure Map

```
client/
  src/
    App.tsx                         # Root router + providers
    main.tsx                        # Entry point
    index.css                       # Theme variables, animations, utility classes
    components/
      layout/
        AppLayout.tsx               # Shell: TopBar + Sidebar + SubMenuManager + RightPane
        TopBar.tsx                   # Top navigation bar with org switcher, role switcher, notifications
        Sidebar.tsx                  # Icon rail (w16) with tooltip labels
        SubMenuManager.tsx           # Flyout / pinnable sub-menu panel (w56)
        RightPane.tsx                # Context-aware right pane (Automa chat or info)
        FavoritesBar.tsx             # Favorites breadcrumb bar
        MobileNavDropdown.tsx        # Mobile navigation dropdown
        MobileSidebar.tsx            # Mobile sidebar overlay
        SubMenuPanel.tsx             # Sub-menu panel primitives
      AgentConfigPane.tsx            # Agent detail/config in right pane
      ui/                           # Shadcn component library (accordion, button, card, etc.)
    contexts/
      AppContext.tsx                 # Global state: user, role, sidebar, agents, favorites, comm gate
      ThemeContext.tsx               # Light/dark theme toggling
    hooks/
      use-mobile.tsx                # Mobile breakpoint detection
      use-toast.ts                  # Toast notification hook
    lib/
      queryClient.ts                # TanStack Query client + default fetcher
      utils.ts                      # cn() utility
    mocks/
      activity.ts                   # Activity feed data
      agents.ts                     # Agent definitions by department
      campaigns.ts                  # Campaign data (service/marketing)
      conversations.ts              # TeamBox conversation threads
      files.ts                      # File/drive mock data (deprecated)
      index.ts                      # Mock barrel exports
      insights.ts                   # Insights/metrics data
      messages.ts                   # Chat message history
      notifications.ts              # Notification data
      tasks.ts                      # Task assignments
      users.ts                      # User/org definitions + RBAC helpers
      widgets.ts                    # Widget + landing page config
    pages/
      main.tsx                      # AI Chat page (/) with metric tiles + chat
      teambox.tsx                   # TeamBox unified inbox (/teambox)
      my-work.tsx                   # Personal dashboard (/my-work)
      sales.tsx                     # Sales section (/sales)
      service.tsx                   # Service section (/service)
      marketing.tsx                 # Marketing section (/marketing)
      management.tsx                # Management section (/management)
      agents.tsx                    # Agent detail view (/agents)
      insights.tsx                  # Insights view (/insights)
      settings.tsx                  # System settings (/settings/system)
      billing-management.tsx        # Billing (/settings/billing)
      org-wizard.tsx                # Org creation wizard (/settings/org-wizard)
      profile.tsx                   # User profile (/profile, /profile/preferences, /profile/billing)
      widget-landing.tsx            # Public widget landing page (/w/demo)
      not-found.tsx                 # 404 page
server/
  index.ts                          # Express entry point
  routes.ts                         # API route definitions
  storage.ts                        # IStorage interface + MemStorage
  static.ts                         # Static file serving
  vite.ts                           # Vite dev server integration
shared/
  schema.ts                         # Drizzle schema + Zod types
```

## 2. Component Hierarchy

```
App
  QueryClientProvider
    TooltipProvider
      ThemeProvider
        AppProvider
          Toaster
          Router (wouter Switch)
            /w/demo → WidgetLandingPage
            <AppLayout>
              TopBar
              Sidebar
              SubMenuManager
              <main> → page component
              RightPane | AgentConfigPane (conditional)
            </AppLayout>
```

## 3. Route Map

| Path                    | Component             | View Config    | Right Pane         |
|-------------------------|-----------------------|----------------|--------------------|
| `/`                     | MainPage              | chat-only      | None (chat center) |
| `/teambox`              | TeamboxPage           | teambox        | None (3-col layout)|
| `/my-work`              | MyWorkPage            | sub-menu       | None               |
| `/sales`                | SalesPage             | data-display   | Automa chat        |
| `/service`              | ServicePage           | data-display   | Automa chat        |
| `/marketing`            | MarketingPage         | data-display   | Automa chat        |
| `/management`           | ManagementPage        | data-display   | Automa chat        |
| `/agents`               | AgentsPage            | heavy-chat     | AgentConfigPane    |
| `/insights`             | InsightsPage          | data-display   | Automa chat        |
| `/settings/system`      | SettingsPage          | sub-menu       | None               |
| `/settings/billing`     | BillingManagementPage | sub-menu       | None               |
| `/settings/org-wizard`  | OrgWizardPage         | sub-menu       | None               |
| `/settings`             | SettingsPage          | sub-menu       | None               |
| `/profile`              | ProfilePage           | sub-menu       | None               |
| `/profile/preferences`  | ProfilePage           | sub-menu       | None               |
| `/profile/billing`      | ProfilePage           | sub-menu       | None               |
| `/w/demo`               | WidgetLandingPage     | standalone     | N/A                |

## 4. View Configurations

The `AppLayout` component determines layout behavior via `getViewConfig()`:

- **chat-only**: Center content is chat (max-w-4xl, centered). No right pane toggle.
- **data-display**: Center shows data dashboards. Right pane toggleable (Automa chat).
- **sub-menu**: Center content with sub-menu navigation. No right pane.
- **heavy-chat**: Center is agent chat. Right pane shows AgentConfigPane.
- **teambox**: 3-column layout (filters | conversations | thread+info). Self-contained.

## 5. State Management

### AppContext (global state)

| State                    | Type                  | Purpose                                           |
|--------------------------|-----------------------|---------------------------------------------------|
| currentUser              | User                  | Logged-in user                                    |
| currentRole              | UserRole              | Active role (persisted to localStorage)           |
| currentOrganization      | Organization          | Active org                                        |
| organizations            | Organization[]        | Available orgs                                    |
| agents                   | Agent[]               | All agents                                        |
| notifications            | Notification[]        | User notifications                                |
| favorites                | FavoriteItem[]        | Starred pages                                     |
| selectedAgent            | Agent \| null         | Currently selected agent for detail view          |
| sidebarVisible           | boolean               | Sidebar collapsed/expanded                        |
| rightPaneOpen            | boolean               | Right pane open/closed                            |
| mobileMenuOpen           | boolean               | Mobile menu state                                 |
| activePanel              | string \| null        | Active sub-menu panel ID                          |
| subMenuExpanded          | boolean               | Sub-menu pinned open                              |
| panelHovered             | boolean               | Mouse over sub-menu panel                         |
| personaName              | string                | AI persona name (from org config)                 |
| communicationGateEnabled | boolean               | Global outbound communication toggle              |

### ThemeContext

| State | Type   | Purpose          |
|-------|--------|------------------|
| theme | string | "light" or "dark"|

## 6. RBAC Matrix

| Section    | super_admin | partner_admin | org_admin | org_staff |
|------------|-------------|---------------|-----------|-----------|
| AI Chat    | Y           | Y             | Y         | Y         |
| TeamBox    | Y           | Y             | Y         | Y         |
| My Work    | Y           | Y             | Y         | Y         |
| Sales      | Y           | Y             | Y         | Y         |
| Service    | Y           | Y             | Y         | Y         |
| Marketing  | Y           | Y             | Y         | N         |
| Management | Y           | Y             | Y         | N         |
| System     | Y           | Y             | Y         | N         |

Settings sub-section access:

| Setting               | super_admin | partner_admin | org_admin |
|-----------------------|-------------|---------------|-----------|
| Users                 | Y           | Y             | Y         |
| Organization          | Y           | Y             | Y         |
| Tools & Integrations  | Y           | Y             | Y         |
| Knowledge Base        | Y           | Y             | Y         |
| AI Configuration      | Y           | Y (read-only) | N         |
| Security & Privacy    | Y           | Y             | N         |
| Notifications         | Y           | Y             | Y         |
| Data Management       | Y           | N             | N         |
| Appearance            | Y           | Y             | Y         |
| Billing               | Y           | Y             | N         |

## 7. Data Flow

### Sub-Menu Panel Navigation
```
User hovers Sidebar icon
  → Sidebar.handleMouseEnter(item)
    → setActivePanel(item.id)
      → SubMenuManager renders panel for panelId
        → User clicks nav item
          → setLocation(path) navigates to page
```

### Communication Gate
```
Settings → Global Communication Gate toggle
  → setCommunicationGateEnabled(false)
    → All campaign pages check communicationGateEnabled
      → Show "Communications Paused" badge when disabled
      → Individual campaign kill-switches remain independent
```

### Campaign Kill-Switch
```
Service/Marketing → Campaigns tab → Kill Switch toggle
  → campaign.killSwitch = true
    → Stops all future messages for that campaign
Per-conversation disconnect (TeamBox):
  → conversation.campaignDisconnected = true
    → Stops messages for that specific customer
```

## 8. Mock Data Architecture

### Agents (`mocks/agents.ts`)
- Typed by department: `sales | service | marketing | system`
- Each agent has: id, name, description, status, channel, department, instructions, triggers, tools
- Helper: `getAgentsByDepartment(agents, dept)` filters by department

### Campaigns (`mocks/campaigns.ts`)
- Typed by department: `sales | service | marketing`
- Each campaign has: id, name, department, status, channel, recipient/sent/delivered/replied counts, messages array, killSwitch
- Messages define: order, channel (sms/email), content with template variables, waitHours
- Helper: `getCampaignsByDepartment(dept)` filters by department

### Conversations (`mocks/conversations.ts`)
- TeamBox conversations with: customer info, channel, status, assigned agent, messages, campaign linkage
- Statuses: open, assigned, participating, automated, scheduled, followup, pending, closed
- Channels: sms, email, chat, whatsapp, voice

### Widgets (`mocks/widgets.ts`)
- Types: text, video, voice, unified
- Each widget has: appearance config, targeting rules, allowed domains, embed code generation
- Landing pages linked to widgets

## 9. Integration Architecture (Planned)

| Integration    | Purpose                    | Status  | Wave |
|---------------|----------------------------|---------|------|
| VinSolutions  | CRM data sync              | Locked  | 2    |
| VAPI          | Voice calling              | Locked  | 2    |
| Tavus         | Video AI persona           | Locked  | 2    |
| Google Auth   | SSO authentication         | Locked  | 2    |
| TextMagic     | SMS sending                | Active  | 1    |
| Resend        | Email sending              | Planned | 2    |

## 10. Cardinal Layout Rules

1. **Data in center → Chat on right**: Sales, Service, Marketing, Management dashboards show data centrally. Right pane offers Automa chat for discussing visible data.
2. **Chat in center → Info on right**: AI Chat page has chat centrally. Right pane shows artifacts/information.
3. **Agent conversations**: "Take over" navigates to TeamBox with that conversation selected.
4. **Campaign disconnect**: Available per-conversation in TeamBox and per-campaign via kill-switch toggle.
5. **TeamBox**: Self-contained 3-column layout (no global right pane).

## 11. API Contract Reference

The backend currently has no active API routes. All data is served from client-side mock files. The Express server at `server/routes.ts` registers routes on an HTTP server but currently returns no endpoints. Future waves will implement:

```
GET    /api/users                    # List users
POST   /api/users                    # Create user
GET    /api/agents                   # List agents
POST   /api/agents                   # Create agent
PATCH  /api/agents/:id               # Update agent
GET    /api/conversations            # List conversations
GET    /api/conversations/:id        # Get conversation with messages
POST   /api/conversations/:id/reply  # Send reply
GET    /api/campaigns                # List campaigns
POST   /api/campaigns                # Create campaign
PATCH  /api/campaigns/:id            # Update campaign (incl. kill switch)
GET    /api/widgets                  # List widgets
POST   /api/widgets                  # Create widget
PATCH  /api/widgets/:id              # Update widget config
GET    /api/insights/:section        # Get metrics for section (sales/service/marketing/management)
POST   /api/chat                     # Send message to AI backend
GET    /api/notifications            # List notifications
PATCH  /api/notifications/:id        # Mark notification read
```

All mutations will use Zod schema validation from `shared/schema.ts`. TanStack Query on the frontend will use `queryKey` arrays for cache management and `apiRequest` from `@lib/queryClient` for mutations.

## 12. Database Schema

Currently a single placeholder table defined in `shared/schema.ts` using Drizzle ORM:

```typescript
users: {
  id: varchar (PK, auto-generated UUID),
  username: text (unique, not null),
  password: text (not null)
}
```

Storage is implemented via `MemStorage` class in `server/storage.ts` using an in-memory `Map<string, User>`. The `IStorage` interface defines:
- `getUser(id)` → User | undefined
- `getUserByUsername(username)` → User | undefined
- `createUser(user)` → User

Future waves will expand the schema to include agents, conversations, campaigns, widgets, organizations, and notifications tables.

## 13. Theme System

### CSS Custom Properties

Theme colors are defined in `client/src/index.css` using HSL format (space-separated H S% L%, no `hsl()` wrapper):

```css
:root {
  --background: H S% L%;
  --foreground: H S% L%;
  --primary: H S% L%;
  --card: H S% L%;
  --accent: H S% L%;
  /* ... additional semantic tokens */
}
.dark {
  --background: H S% L%;
  /* ... dark mode overrides */
}
```

Tailwind references these via `tailwind.config.ts`:
```typescript
colors: {
  background: "hsl(var(--background) / <alpha-value>)",
  foreground: "hsl(var(--foreground) / <alpha-value>)",
  // ...
}
```

### Theme Toggle

`ThemeContext` manages light/dark mode:
- State persisted to `localStorage` key `nexxus:theme`
- Applied by toggling `.dark` class on `document.documentElement`
- Defaults to `prefers-color-scheme` media query when no stored preference
- Exposed via `useTheme()` hook: `{ theme, toggleTheme, setTheme }`

### Interaction Utilities (index.css)

- `hover-elevate`: Subtle background elevation on hover (composable with any bg color)
- `active-elevate-2`: More dramatic elevation on press/active
- `toggle-elevate` / `toggle-elevated`: Toggle state styling for on/off elements
- These utilities respect dark/light mode and work with custom background colors
- `<Button>` and `<Badge>` components have built-in hover/active elevations — do NOT add additional hover states to these components

## 14. Testing and Quality

### Visual Regression Screenshots

Reference screenshots stored in `client/public/screenshots/` with naming convention:
```
{role}--{page}--{viewport}-{theme}.png
```
Examples:
- `org_admin--home--desktop-dark.png`
- `org_staff--sales--mobile-light.png`
- `super_admin--settings--desktop-light.png`

Roles captured: `super_admin`, `partner_admin`, `org_admin`, `org_staff`
Viewports: `desktop`, `mobile`
Themes: `light`, `dark`

### Data Test IDs

All interactive and display elements include `data-testid` attributes:

| Pattern | Example | Usage |
|---|---|---|
| `{action}-{target}` | `button-send-message` | Buttons, inputs, links |
| `{type}-{content}` | `text-persona-name` | Display elements |
| `{type}-{desc}-{id}` | `agent-card-agent-1` | Dynamic list items |
| `sidebar-item-{id}` | `sidebar-item-sales` | Sidebar navigation |
| `tab-{section}-{id}` | `tab-sales-dashboard` | Tab navigation |
| `filter-{type}-{id}` | `filter-status-open` | Filter controls |
| `metric-tile-{id}` | `metric-tile-0` | Metric display cards |

### Acceptance Criteria Mapping

Tests are organized by the 4-wave delivery structure. Each acceptance criterion in `ACCEPTANCE_CRITERIA.md` maps to specific UI elements via their `data-testid` attributes. The test battery covers:
- Navigation and routing correctness
- RBAC visibility gating per role
- Sub-menu panel content per section
- Dashboard metric tile rendering
- Campaign kill-switch functionality
- Communication gate toggle behavior
- TeamBox conversation flow
- Widget configuration and embed code generation
- Theme toggle persistence
- Mobile responsive behavior

## 14. MCP Architecture Decision — VinSolutions Integration

### Problem
VinSolutions integration knowledge is buried in `vinSolutionsService.ts` on the production backend (nexxus-v2). Internal function calls are invisible and dangerous — a lead polling function was wired directly into the trigger engine, causing a spam incident where hundreds of automated messages fired silently. OAuth tokens are per-org, stored encrypted in Supabase, and refresh invalidates the previous token immediately.

### Decision
The central-mcp proxy server is the **sole token authority and gateway** for all VinSolutions API access. No other application calls VinSolutions directly.

### Rationale
1. **MCP tools are self-documenting** — any agent connecting to the proxy sees tool definitions, parameters, and API quirks without needing the nexxus codebase
2. **MCP tools are explicit requests** — they can't be accidentally wired into background jobs that fire silently
3. **Single refresh owner** — eliminates token refresh race conditions between services

### Tool Surface
- `vin_query_leads` — Search leads by date range, dealer, status
- `vin_get_lead_sources` — List valid lead sources (returns href, not ID)
- `vin_get_lead_types` — List valid lead types (returns href, not ID)
- `vin_create_contact` — Step 1 of lead creation, returns contact href
- `vin_create_lead` — Step 2, accepts full href strings for contact, source, type
- `vin_token_status` — Read-only token health check (does not trigger refresh)
- `vin_refresh_token` — Force-refresh OAuth token for an org

### Hard-Won API Quirks (encoded in tool implementations)
- Content-Type header: `application/vnd.coxauto.v3+json` — lowercase `v3`, NOT `V3` (returns 406)
- Response key: `items`, NOT `results` (silently returns undefined)
- Lead creation is 2-step: create Contact → use contact `href` in create Lead
- Lead sources and types are referenced by full `href` URI, not by ID
- Token refresh invalidates previous token immediately — no grace period

### Migration Path
1. VinOAuthService + VinSolutionsService copied into central-mcp (they're portable — Pool dependency only)
2. MCP tools built with auto-refresh on expired tokens
3. nexxus-v2 scheduled jobs updated to call through MCP instead of direct service calls
4. Direct VinSolutions service calls in nexxus-v2 deprecated
