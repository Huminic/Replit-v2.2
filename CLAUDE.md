# Nexxus Connect™ — Claude Code Implementation Guide v2.2

**Version:** 2.2
**Date:** 2026-03-03
**Status:** GOVERNING DOCUMENT — Direct guidance for Claude Code implementation agents
**Cross-References:** [ACCEPTANCE_CRITERIA.md](./ACCEPTANCE_CRITERIA.md) · [SRS.md](./SRS.md) · [SPEC.md](./SPEC.md) · [PLAN.md](./PLAN.md)

---

## 1. Your Role

You are a Claude Code agent implementing features for Nexxus Connect™. The frontend UI prototype is complete and validated with persona/department-based navigation. Your job is to extend, maintain, and eventually wire it to real data — NOT to redesign it.

### 1.1 The Golden Rule

**Change the data source, not the UI.** Every page, component, interaction, and animation in the current UI is the approved design. When wiring to backend, replace mock imports with API calls. That's it.

### 1.2 Truth Hierarchy

When documents or specifications conflict, follow this priority order (highest wins):

| Priority | Source | Authoritative For |
|----------|--------|-------------------|
| 1 | Current UI Code (`client/src/`) | All visual behavior, layout, interactions, component structure |
| 2 | ACCEPTANCE_CRITERIA.md | Verifiable behaviors as documented from the UI |
| 3 | Constitution + SRS | Principles, requirements, metric formulas |
| 4 | API contract / storage interface | Data shapes and endpoint contracts |
| 5 | SRS | System requirements |
| 6 | Implementation Plan | Development sequencing |

---

## 2. Project Architecture

### 2.1 Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Routing:** wouter
- **State:** React Context (`AppContext`, `ThemeContext`) + TanStack Query v5
- **Backend:** Express.js (serves both API and Vite dev server)
- **Database schema:** Drizzle ORM (`shared/schema.ts`) with drizzle-zod
- **Storage:** In-memory (`server/storage.ts`) — switch to Drizzle/PostgreSQL when needed

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
│   ├── AgentConfigPane.tsx    # Agent configuration in right pane
│   └── ui/                    # shadcn primitives (DO NOT MODIFY)
├── contexts/
│   ├── AppContext.tsx          # Global app state, RBAC, agents, favorites
│   └── ThemeContext.tsx        # Light/dark mode
├── hooks/
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── lib/
│   ├── queryClient.ts         # TanStack Query client config
│   └── utils.ts               # cn() utility
├── mocks/                     # Mock data (reference during migration)
│   ├── activity.ts
│   ├── agents.ts              # Agents tagged by department
│   ├── campaigns.ts           # Campaign mock data with kill switch
│   ├── conversations.ts       # TeamBox conversation mock data
│   ├── files.ts
│   ├── insights.ts
│   ├── messages.ts
│   ├── notifications.ts
│   ├── tasks.ts
│   ├── users.ts               # Roles, RBAC helpers
│   └── widgets.ts
└── pages/
    ├── main.tsx               # AI Chat (center chat + metric tiles)
    ├── teambox.tsx            # CommBox-inspired 3-column inbox
    ├── my-work.tsx            # Personal dashboard, tasks, assistant
    ├── sales.tsx              # Sales department (Dashboard/Agents/Insights/Calendar tabs)
    ├── service.tsx            # Service department (Dashboard/Agents/Campaigns/Insights/Calendar tabs)
    ├── marketing.tsx          # Marketing department (Dashboard/Agents/Campaigns/Studio/Insights tabs)
    ├── management.tsx         # Management (Dashboard/Insights/Hunches/Activities/ROI tabs)
    ├── agents.tsx             # Agent detail/config view
    ├── insights.tsx           # Standalone insights page
    ├── settings.tsx           # System settings (9 tiles, RBAC-gated)
    ├── billing-management.tsx # Billing (Super/Partner Admin only)
    ├── org-wizard.tsx         # Org creation wizard
    ├── profile.tsx            # User profile with tabs
    ├── widget-landing.tsx     # Public widget landing page (/w/demo)
    └── not-found.tsx

server/
├── index.ts                   # Server entry
├── routes.ts                  # API routes
├── storage.ts                 # IStorage interface + MemStorage
├── static.ts                  # Static file serving
└── vite.ts                    # Vite dev server integration (DO NOT MODIFY)

shared/
└── schema.ts                  # Drizzle schema + Zod insert schemas
```

### 2.3 Route Map

```
/                        → AI Chat (chat-only view, metric tiles)
/teambox                 → TeamBox unified inbox (teambox view)
/my-work                 → My Work personal dashboard (sub-menu view)
/sales                   → Sales department (data-display view)
/service                 → Service department (data-display view)
/marketing               → Marketing department (data-display view)
/management              → Management dashboard (data-display view)
/agents                  → Agent detail (heavy-chat view)
/insights                → Insights standalone (data-display view)
/settings/system         → System Settings (sub-menu view)
/settings/billing        → Billing Management (sub-menu view)
/settings/org-wizard     → Org Creation Wizard (sub-menu view)
/settings                → Settings tile grid (sub-menu view)
/profile                 → Profile (sub-menu view)
/profile/preferences     → Profile preferences tab
/profile/billing         → Profile billing tab
/w/demo                  → Widget landing page (standalone, NO AppLayout)
```

---

## 3. What You Must NOT Change

### 3.1 Locked UI Elements

| Category | Locked Behavior |
|----------|----------------|
| **TopBar** | Logo text "Nexxus Connect™" (no icon, not clickable), org switcher center, icons right, globe icon for landing page |
| **Sidebar** | 64px width, 7 main items (AI Chat, TeamBox, My Work, Sales, Service, Marketing, Manage) + System bottom, icon+label items, purple active indicator (w-0.5 h-8 bg-purple-500) |
| **SubMenuManager** | Hover/pin system, 800ms leave timeout, ChevronLeft collapse, auto-collapse <1024px |
| **Right Pane** | w-80/lg:w-96, full-screen mobile overlay, Automa pop-out button (MessageCircle, primary-tinted circle) visible when closed on data-display pages. Mobile FAB at bottom-right. |
| **Chat bubbles** | Bot left (bg-card border border-border), user right (bg-primary), NO avatars, max-w-[80%] main / max-w-[85%] right pane |
| **Typing animation** | wave-dot CSS class, 3 dots, delays 0s/0.15s/0.3s |
| **Chat input** | chat-input-gradient wrapper, gradient glow, Enter sends, Shift+Enter newline |
| **Thinking Card** | Brain icon, border-purple-500/20 bg-purple-500/5, collapsible |
| **Metric tiles** | Gradient backgrounds, SVG circles, hover-elevate, click opens detail modal. Window-blind collapse (max-h transition, 500ms) after first chat message. Toggle: ChevronDown "Show" / ChevronUp "Hide". |
| **TeamBox** | 3-column layout: filters + conversation list + chat thread + customer info |
| **Campaign tables** | Kill switch toggle per campaign, CSV upload UI, message sequence config |
| **Settings** | 9 tiles with RBAC gating, accordion widget config, communication gate toggle |

### 3.2 Locked Design Tokens

```css
--density-data: 13px;
--density-chat: 14-15px;
--sidebar-width: 64px;
--topbar-height: 56px;
--right-pane-width: 320px;   /* w-80 */
--right-pane-width-lg: 384px; /* lg:w-96 */
```

### 3.3 Locked Layout Rules (Cardinal Rules)

- **Data/information in center → chat on the right pane** (Sales, Service, Marketing, Management dashboards)
- **Chat in center → information/configuration on the right pane** (AI Chat page shows artifacts panel)
- **TeamBox** has its own 3-column layout; does NOT use global right pane
- **Agent detail** shows agent config in right pane

---

## 4. Navigation Structure

### 4.1 Sidebar Items

| ID | Label | Icon | Path | Section | RBAC |
|----|-------|------|------|---------|------|
| ai-chat | AI Chat | MessageSquare | / | ai-chat | All roles |
| teambox | TeamBox | Inbox | /teambox | teambox | All roles |
| my-work | My Work | User | /my-work | my-work | All roles |
| sales | Sales | ShoppingCart | /sales | sales | super_admin, partner_admin, org_admin, executive, sales_manager, sales |
| service | Service | Wrench | /service | service | super_admin, partner_admin, org_admin, executive, service |
| marketing | Marketing | Megaphone | /marketing | marketing | super_admin, partner_admin, org_admin, executive, marketing |
| management | Manage | LayoutDashboard | /management | management | super_admin, partner_admin, org_admin, executive, sales_manager |
| system | System | Settings | /settings/system | system | super_admin, partner_admin, org_admin |

### 4.2 Sub-Menu Panels

Each sidebar item opens a sub-menu panel on hover/click:

- **AI Chat**: Favorites, Chat History, Artifacts
- **TeamBox**: Conversations, Tasks, Workflows + Quick Filters (Open, Automated, Followup)
- **My Work**: Assistant, Dashboard, Tasks, Chat
- **Sales**: Dashboard, Agents, Insights, Calendar + Agent list with search
- **Service**: Dashboard, Agents, Campaigns, Insights, Calendar + Agent list
- **Marketing**: Dashboard, Agents, Campaigns, Studio, Insights + Agent list
- **Management**: Dashboard, Insights, Hunches, Activities, ROI
- **System**: RBAC-gated settings items (Users, Organization, Tools, Knowledge, AI Config, Security, Notifications, Data, Appearance, Billing)

### 4.3 View Configurations

The `AppLayout` component uses view configs to determine right pane behavior:

| View Config | Routes | Right Pane Behavior |
|------------|--------|-------------------|
| `chat-only` | `/` | Max-width 4xl centered, no right pane toggle |
| `teambox` | `/teambox` | Own 3-column layout, no global right pane |
| `data-display` | `/sales`, `/service`, `/marketing`, `/management`, `/insights` | Automa chat in right pane, toggle button visible |
| `heavy-chat` | `/agents` | Agent config in right pane |
| `sub-menu` | `/my-work`, `/settings/*`, `/profile/*` | No right pane toggle |

---

## 5. RBAC Implementation

### 5.1 Role Hierarchy (8 Roles)

The UI implements 8 RBAC roles (defined in `client/src/mocks/users.ts`). The old `org_staff` role has been removed and replaced with department-specific roles.

```
Platform level:   super_admin > partner_admin
Org level:        org_admin > executive > sales_manager
Department level: sales, service, marketing
```

| Role | System Value | Real-World Equivalent |
|------|-------------|----------------------|
| Super Admin | `super_admin` | Platform operator (Huminic) |
| Partner Admin | `partner_admin` | Brand/group manager (Duran Cage) |
| Org Admin | `org_admin` | Dealership Owner / GM |
| Executive | `executive` | Dealership executive / VP |
| Sales Manager | `sales_manager` | Sales floor manager |
| Sales | `sales` | Salesperson |
| Service | `service` | Service advisor |
| Marketing | `marketing` | Marketing coordinator |

### 5.2 Section Access Matrix

Controlled by `defaultSectionsByRole` in `users.ts`. My Work is always visible. System settings requires admin roles (`canAccessSystem()`). Per-user overrides via `userPermissions` in AppContext can grant additional sections.

| Section | super_admin | partner_admin | org_admin | executive | sales_manager | sales | service | marketing |
|---------|:-----------:|:-------------:|:---------:|:---------:|:-------------:|:-----:|:-------:|:---------:|
| AI Chat | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| TeamBox | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| My Work | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sales | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Service | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Marketing | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Manage | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| System Settings | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Billing Management | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Org Creation Wizard | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 5.3 Role-Based Main Page Metric Tiles

Each role sees different metric tiles on the AI Chat (`/`) page. The `roleMetrics` object in `main.tsx` maps roles to tile sets:

- **super_admin**: Partner Orgs, Total Logins, Platform Actions, Agent Actions
- **partner_admin**: Sub Orgs, Total Logins, User Actions, Agent Actions
- **org_admin**: Pipeline Value, Lead Source, Lead Quality, Demand Score
- **executive**: Pipeline Value, Lead Source, Lead Quality, Demand Score (same as org_admin)
- **sales_manager**: Pipeline Value, Lead Source, Lead Quality, Demand Score (same as org_admin)
- **sales**: Hot Opportunities, Buying Intel, Threats, Urgency Score
- **service**: Hot Opportunities, Buying Intel, Threats, Urgency Score (same as sales)
- **marketing**: Hot Opportunities, Buying Intel, Threats, Urgency Score (same as sales)

### 5.4 Data Scoping

- `super_admin` sees ALL organizations
- `partner_admin` sees their partner group's organizations only
- `org_admin` / `executive` sees their own organization only
- `sales_manager` sees their own organization only (sales team scope)
- `sales` / `service` / `marketing` sees their own organization only (further filtered by department assignment)

---

## 6. Naming Conventions

### 6.1 User-Facing Names

| Concept | Internal Name | User-Facing Name | Notes |
|---------|--------------|-----------------|-------|
| Platform | Nexxus | Nexxus Connect™ | Logo text, no icon |
| AI assistant | persona | Organization's persona name (e.g., "Serra") | Configurable per org, stored in Organization model |
| Voice AI | VAPI | Voice Agent | Never expose "VAPI" |
| Video AI | Tavus | Video Agent | Never expose "Tavus" |
| CRM integration | VIN Solutions | CRM Integration | Never expose vendor name |
| Agent capabilities | tools | Skills | UI always says "Skills" |
| AI insights | hunches | Hunches | Confidence-scored patterns |

### 6.2 Code Naming

- **Files:** kebab-case for pages (`my-work.tsx`), PascalCase for components (`SubMenuManager.tsx`)
- **Components:** PascalCase (`AppLayout`, `TeamboxPage`)
- **Hooks:** camelCase with `use` prefix (`useApp`, `useToast`)
- **Mock data:** `mock` prefix (`mockAgents`, `mockCampaigns`)
- **Test IDs:** `{action}-{target}` for interactive, `{type}-{content}` for display
- **Routes:** kebab-case (`/my-work`, `/settings/system`)
- **Context values:** camelCase (`currentRole`, `sidebarVisible`)

---

## 7. State Management

### 7.1 AppContext (Client-Side State)

These values live in `client/src/contexts/AppContext.tsx`:

**UI State (always client-side):**
- `activePanel` — which sub-menu panel is showing
- `subMenuExpanded` — global pin state
- `panelHovered` — mouse hover state
- `sidebarVisible` — sidebar toggle
- `rightPaneOpen` — right pane toggle
- `mobileMenuOpen` — mobile menu toggle

**Data State (currently mock, migrate to API):**
- `currentUser` — logged-in user
- `currentRole` — active role (switchable via dev tool in TopBar)
- `currentOrganization` — active org
- `organizations` — org list (for multi-org users)
- `agents` — agent list
- `notifications` — notification list
- `favorites` — favorited pages
- `selectedAgent` — currently selected agent
- `communicationGateEnabled` — global outbound communication toggle
- `personaName` — AI persona name (derived from org)

### 7.2 Mock → API Migration Pattern

When replacing mock data with API calls:

```tsx
// BEFORE (mock):
import { mockAgents } from '@/mocks/agents';
const agents = mockAgents;

// AFTER (API):
const { data: agents, isLoading } = useQuery({
  queryKey: ['/api/agents'],
});
if (isLoading) return <LoadingSkeleton />;
```

Use `apiRequest` from `@/lib/queryClient` for mutations:

```tsx
const createAgent = useMutation({
  mutationFn: (data: InsertAgent) => apiRequest('POST', '/api/agents', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
  },
});
```

---

## 8. Key Features

### 8.1 Campaign System

Campaigns exist within Service and Marketing sections:
- Campaign list with status (Active/Paused/Draft/Completed)
- CSV upload for recipient lists
- Message template configuration with variable substitution (`{{first_name}}`, `{{vehicle}}`)
- Wait time between messages (hours)
- Channel selection (SMS, Email, or both)
- **Kill Switch** per campaign — immediately stops all outbound messages
- **Per-conversation disconnect** in TeamBox — prevents future campaign messages for individual customers
- **Global Communication Gate** in Settings — master toggle that prevents ALL outbound automated communications

#### 8.1.1 Kill Switch Backend Spec (Wave 2)

The UI-layer kill switch (`communicationGateEnabled` in AppContext, per-campaign `killSwitch` toggle, per-conversation `campaignDisconnected`) is fully built. The backend enforcement requires these database columns (planned for Wave 2):

| Column | Table | Purpose |
|--------|-------|---------|
| `outbound_enabled` | `organizations` | Global org-level communication gate (maps to `communicationGateEnabled`) |
| `sms_enabled` | `organizations` | Per-channel toggle for SMS outbound |
| `phone_enabled` | `organizations` | Per-channel toggle for voice outbound |
| `email_enabled` | `organizations` | Per-channel toggle for email outbound |
| `kill_switch` | `campaigns` | Per-campaign stop (already in mock model) |
| `campaign_disconnected` | `teambox_conversations` | Per-conversation disconnect (already in mock model) |

MCP enforcement: The central-mcp proxy must check `outbound_enabled` + channel-specific flags before any outbound API call (TextMagic, Resend, VAPI). This prevents the spam incident pattern where background jobs bypass UI-layer checks.

### 8.2 TeamBox (Unified Inbox)

CommBox-inspired 3-column layout:
1. **Filter panel** (left): Status filters, channel filters, search
2. **Conversation list** (center-left): Customer conversations with channel icons, agent badges, unread counts
3. **Chat thread** (center): Full conversation with reply input
4. **Customer info** (right): Contact details, quick actions, tags

Conversation statuses: `open`, `assigned`, `participating`, `automated`, `scheduled`, `followup`, `pending`, `closed`
Channels: `sms`, `email`, `chat`, `whatsapp`, `voice`

### 8.3 Widget System

Four widget types in Settings: `text`, `video`, `voice`, `unified`
Each widget has: appearance config, targeting rules, allowed domains, embed code
Landing pages linked to widgets with their own appearance settings

The widget landing page (`/w/demo`) floating FAB supports 7 channels: chat, video, voice, SMS, callback, email, WhatsApp. This exceeds the 4 settings-level widget types — the FAB is the customer-facing channel selector, while widget types are the admin configuration model.

### 8.4 AI Hunches

Pattern-based insights in Management → Hunches tab:
- Ranked by confidence score and impact level
- Show pattern description and recommendation
- Impact levels: high, medium, low

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
9. **NEVER** cache derived metrics as authoritative truth
10. **NEVER** modify VAPI or Tavus webhook handlers without explicit approval (live production)
11. **NEVER** use emojis in the UI — use Lucide icons instead
12. **NEVER** nest a Card inside another Card
13. **NEVER** add hover/active background states to Buttons or Badges (built-in)
14. **NEVER** use `display:table` utilities
15. **ALWAYS** preserve existing users — never drop, truncate, or destructively migrate
16. **ALWAYS** add `data-testid` attributes to interactive and meaningful display elements
17. **ALWAYS** use the existing shadcn components rather than creating custom alternatives

---

## 10. Testing Requirements

### 10.1 Per-Feature Certification

Every feature requires three proofs:

1. **Configuration test** — env vars, database connection, API keys work
2. **Functional test** — the feature produces correct output
3. **Visual/E2E test** — the UI renders correctly with real data

### 10.2 Test ID Conventions

```tsx
// Interactive elements: {action}-{target}
data-testid="button-submit"
data-testid="input-email"
data-testid="link-profile"

// Display elements: {type}-{content}
data-testid="text-username"
data-testid="status-payment"

// Dynamic elements: {type}-{description}-{id}
data-testid={`card-agent-${agent.id}`}
data-testid={`row-campaign-${campaign.id}`}
```

### 10.3 Metric Verification

For every metric formula (Constitution §5):
1. Create a known test dataset
2. Manually compute the expected score
3. Assert the computation produces the same score
4. Document: metric name, test data, expected value, actual value, pass/fail

### 10.4 RBAC Verification

For every role-gated feature:
1. Test as each role (use `?role=` URL param for role switching)
2. Verify correct visibility/access
3. Verify data scoping (no cross-org leakage)

---

## 11. Quick Reference: What Goes Where

| I need to... | File(s) to modify |
|---|---|
| Add a new database table | `shared/schema.ts` |
| Add a new API endpoint | `server/routes.ts` |
| Add database operations | `server/storage.ts` |
| Replace mock data on a page | The page file in `client/src/pages/*.tsx` |
| Add a new page | `client/src/pages/*.tsx` + register in `client/src/App.tsx` |
| Add a new sidebar item | `client/src/components/layout/Sidebar.tsx` (menuItems array) |
| Add a new sub-menu panel | `client/src/components/layout/SubMenuManager.tsx` |
| Modify global state | `client/src/contexts/AppContext.tsx` |
| Add mock data | `client/src/mocks/*.ts` |
| Style a component | Use existing Tailwind classes + design tokens in `client/src/index.css` |
| Add a new agent department | `client/src/mocks/agents.ts` (AgentDepartment type) |
| Add campaign data | `client/src/mocks/campaigns.ts` |
| Add conversation data | `client/src/mocks/conversations.ts` |

---

## 12. Checklist: Before Marking Any Task Complete

- [ ] Code compiles without TypeScript errors
- [ ] No ESLint warnings
- [ ] UI renders correctly (visual check)
- [ ] RBAC correctly gates visibility
- [ ] `data-testid` attributes on all interactive and meaningful elements
- [ ] Error handling implemented (no raw error objects exposed)
- [ ] Loading states shown while data fetches (if using API)
- [ ] Naming conventions followed (Section 6)
- [ ] No vendor names exposed in UI (Section 6.1)
- [ ] Layout rules respected (Section 3.3)
- [ ] No forbidden actions violated (Section 9)

---

## Document Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-21 | 2.1 | Initial Claude Code guide (old navigation: Main/Insights/Agents/Hub/Drive) |
| 2026-03-03 | 2.2 | Complete rewrite for v2.2 navigation (AI Chat/TeamBox/My Work/Sales/Service/Marketing/Management). Updated route map, RBAC matrix, file structure, locked UI elements. Added campaign system, TeamBox, widget system docs. Removed Drive, standalone Agents/Insights references. |
| 2026-03-04 | 2.3 | RBAC expanded from 4 roles to 8 (added executive, sales_manager, sales, service, marketing; removed org_staff). Section access matrix updated to match defaultSectionsByRole in users.ts. Sidebar label "Management"→"Manage". Widget FAB 7-channel note added. Kill switch backend spec subsection added. |
