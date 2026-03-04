# Nexxus Connect — Developer Comment Index

> **Purpose**: Master reference for all developer comments in the codebase.
> When files are added, renamed, or their purpose changes, update this index so
> comments across the codebase can be kept in sync.
>
> Last updated: 2026-03-04

---

## How Comments Are Structured

- **File-level JSDoc** (`/** ... */`): At the top of each file, describes purpose, cardinal layout rules, RBAC, production wiring notes
- **Section comments** (`//`): Before major blocks (render functions, state declarations, data structures)
- **Inline comments** (`//`): On specific lines that need context for future developers

---

## Pages (`client/src/pages/`)

| File | Purpose | Cardinal Rule | RBAC | Wave |
|------|---------|---------------|------|------|
| `main.tsx` | AI Chat — primary chat interface with role-based metric tiles | Chat center → info/artifacts right | All roles | 1 |
| `teambox.tsx` | CommBox-inspired 4-column unified inbox | Chat center → customer info right (own layout) | All roles | 1 |
| `my-work.tsx` | Personal productivity dashboard, tasks, assistant | Data center → N/A | All roles | 1 |
| `sales.tsx` | Sales department dashboard with tabs | Data center → Automa chat right | sales, sales_manager, org_admin+ | 1 |
| `service.tsx` | Service dashboard + campaign management + kill switch | Data center → Automa chat right | service, org_admin+ | 1 |
| `marketing.tsx` | Marketing dashboard + campaigns + Studio placeholder | Data center → Automa chat right | marketing, org_admin+ | 1 |
| `management.tsx` | Executive KPI dashboard + Hunches + ROI | Data center → Automa chat right | org_admin, executive, sales_manager+ | 1 |
| `agents.tsx` | Agent detail page with chat conversation | Chat center → config right (AgentConfigPane) | All roles | 1 |
| `insights.tsx` | Analytics dashboard (1800+ lines) | Data center → Automa chat right | All roles | 1 |
| `settings.tsx` | System settings (org, tools, knowledge, AI, security) | N/A (sub-menu) | Admin roles | 1 |
| `profile.tsx` | User profile, preferences, billing | N/A (sub-menu) | All roles | 1 |
| `org-wizard.tsx` | 7-step org onboarding wizard | N/A (standalone flow) | super_admin, partner_admin | 1 |
| `widget-landing.tsx` | Public landing page `/w/demo` — standalone, no sidebar | N/A (standalone) | Public | 1 |
| `billing-management.tsx` | Partner billing management | N/A (sub-menu) | super_admin, partner_admin | 1 |
| `not-found.tsx` | 404 fallback page | N/A | All | 1 |

---

## Layout Components (`client/src/components/layout/`)

| File | Purpose | Key Behavior |
|------|---------|--------------|
| `Sidebar.tsx` | 72px icon sidebar, RBAC-gated nav items | Hover → SubMenuManager flyout, 800ms close delay, pin mode |
| `TopBar.tsx` | Top nav bar (h-14), logo, org switcher, notifications | Globe icon → landing page, role switcher (DEV TOOL) |
| `AppLayout.tsx` | Master layout wrapper, orchestrates all panels | ViewConfig → determines right pane behavior per route |
| `SubMenuManager.tsx` | Flyout sub-menu panel per sidebar section | Agent list with chevron-expand conversation history |
| `RightPane.tsx` | Automa chat panel on data-display pages | Cardinal rule: data center → chat right |
| `AgentConfigPane.tsx` | Agent config panel (right pane on agent pages) | 6 sections: Performance, Instructions, Triggers, Tools, Knowledge, Activity |
| `FavoritesBar.tsx` | Favorites quick-access bar | Star/unstar pages |
| `MobileNavDropdown.tsx` | Mobile navigation dropdown | Responsive alternative to sidebar |
| `MobileSidebar.tsx` | Mobile sidebar overlay | Touch-friendly sidebar variant |
| `SubMenuPanel.tsx` | Sub-menu panel wrapper | Container for SubMenuManager content |

---

## Mock Data (`client/src/mocks/`)

| File | Purpose | Production Wiring |
|------|---------|-------------------|
| `agents.ts` | 6 AI agents across sales/service/marketing | Backend `agents` table, MCP server tools |
| `conversations.ts` | TeamBox conversations with messages | Backend conversation API, WebSocket for real-time |
| `campaigns.ts` | Outbound campaign data with kill switch | TextMagic (SMS), Resend (email) APIs |
| `users.ts` | User model, 8 RBAC roles, permission helpers | Backend `users` table, JWT auth |
| `widgets.ts` | Widget configs + universal settings | Backend widget configs, embed script |
| `messages.ts` | AI Chat message model + thinking blocks | Backend AI inference API |
| `activity.ts` | Activity feed events | Backend activity log |
| `notifications.ts` | Notification model with types | Backend notification service |
| `tasks.ts` | Tasks, calendar events, hunches, leads, inbox | Backend task management |
| `insights.ts` | Analytics data, command center, pipeline health | Backend analytics engine |
| `files.ts` | Drive file model (legacy, may be removed) | Was for Drive feature (removed) |
| `index.ts` | Barrel exports for mock modules | N/A |

---

## Contexts (`client/src/contexts/`)

| File | Key State | Notes |
|------|-----------|-------|
| `AppContext.tsx` | currentUser, currentRole, currentOrganization, agents, notifications, selectedAgent, favorites, personaName, communicationGateEnabled, universalSettings, userPermissions, sidebar/panel visibility | Central state provider. `communicationGateEnabled` = global kill switch. `personaName` = AI persona (default "Serra") |
| `ThemeContext.tsx` | theme (light/dark) | Toggles `.dark` class on `<html>`, persists to localStorage |

---

## Key Cross-Cutting Concerns

### Cardinal Layout Rules
- **Data in center → chat on right pane** (Sales, Service, Marketing, Management dashboards)
- **Chat in center → info/config on right pane** (AI Chat page, Agent detail page)
- **TeamBox uses its own 3-column layout** (NOT the global right pane)

### RBAC Roles (8 total)
`super_admin` → `partner_admin` → `org_admin` → `executive` → `sales_manager` → `sales` / `service` / `marketing`

> `org_staff` was REMOVED from the codebase entirely.

### Communication Gate
- Global toggle in Settings → Organization (`communicationGateEnabled` in AppContext)
- When OFF: "Communications Paused" badge appears in Service/Marketing campaign tabs
- Per-campaign: Kill switch toggle in campaign table rows
- Per-conversation: "Disconnect Campaign" button in TeamBox

### Production Backend
- API: `nexxusv2.huminicdev.com` (185+ endpoints, 53 tables, 747 tests)
- MCP Server: VinSolutions CRM integration (content-type lowercase v3, `items` response key, 2-step lead creation)
- External APIs: TextMagic (SMS), Resend (email), VAPI (voice), Tavus (video persona)

---

## Updating Comments

When modifying a file:
1. Check this index to understand the file's role
2. Update the file's JSDoc block if the purpose or behavior changed
3. Update inline comments if section logic changed
4. Update this index if:
   - A file was added, renamed, or removed
   - RBAC rules changed for a page
   - Cardinal layout rules were modified
   - A new context state field was added
   - A mock file's production wiring changed
