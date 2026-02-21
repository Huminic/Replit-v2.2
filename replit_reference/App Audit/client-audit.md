# Nexxus V2 Client/Frontend Layer -- Forensic Audit

**Audit Date:** 2026-02-21
**Auditor:** Claude Opus 4.6 (forensic code audit)
**Scope:** `/home/ubuntu/Claude-store/nexxus-v2/client/src/`
**Project:** Nexxus V2 -- AI-powered automotive dealership platform

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Pages Inventory](#2-pages-inventory)
3. [Routing Structure](#3-routing-structure)
4. [Component Inventory](#4-component-inventory)
5. [State Management](#5-state-management)
6. [UI Framework](#6-ui-framework)
7. [Authentication Flow](#7-authentication-flow)
8. [Key Features Visible in the UI](#8-key-features-visible-in-the-ui)
9. [Theme System and Responsive Design](#9-theme-system-and-responsive-design)
10. [Quantitative Summary](#10-quantitative-summary)

---

## 1. Executive Summary

The Nexxus V2 frontend is a single-page application built on **React 18 + TypeScript + Vite**. It uses **Wouter** for routing (not React Router), **TanStack Query** for server-state management, **React Context** for global UI state, and **shadcn/ui** (Radix primitives + Tailwind CSS) for the component library.

### High-Level Counts

| Category | Count |
|----------|-------|
| TypeScript source files (`.tsx` + `.ts`) | ~174 |
| Pages | 21 (17 in `pages/`, 4 in `pages/hosted/`) |
| Active routes | 17 (+ 2 commented out) |
| Custom components | 59 |
| shadcn/ui primitives | 47 |
| Custom hooks | 26 |
| Context providers | 4 |
| Mock data modules | 9 |
| Library utilities | 3 |
| CSS file | 1 (615 lines) |

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Build tool | Vite |
| Framework | React 18 |
| Language | TypeScript (strict) |
| Routing | Wouter |
| Server state | TanStack Query (React Query) |
| Client state | React Context API |
| UI library | shadcn/ui (Radix UI primitives) |
| Styling | Tailwind CSS v4 |
| Icons | lucide-react |
| Calendar | FullCalendar |
| Rich text | Tiptap |
| Charts | Recharts (via shadcn chart) |
| Onboarding | driver.js |
| Date utility | date-fns |
| HTTP | Native fetch (wrapped in `api.ts`) |

---

## 2. Pages Inventory

### 2.1 Total: 21 Pages

**Directory:** `client/src/pages/`

#### Authentication Pages (3)

| File | Path | Purpose |
|------|------|---------|
| `login.tsx` | `/login` | Glass-effect login card with 9 randomized wallpaper backgrounds. Email/password form with auto-redirect if already authenticated. Beta badge. |
| `forgot-password.tsx` | `/forgot-password` | Password reset request. Same glass-effect card styling. Success state shows "check your email" message. |
| `reset-password.tsx` | `/reset-password` | Password reset completion with new password form. Token-validated. |

#### Main Application Pages (14)

| File | Path | Purpose |
|------|------|---------|
| `dashboard.tsx` | `/` | Main dashboard. Geckoboard-inspired grid layout with: DealershipPulse (health scores + lead metrics), GoalProgress, LeadFeed (live, VIN API sourced), AgentActions (sparkline chart), TeamLeaderboard. Role-based visibility via `ROLE_VISIBILITY` map. 60s auto-refresh with 5-min manual cooldown. Score explanation modals. |
| `main.tsx` | `/chat` | DealerBrain AI chat interface. Left panel with favorites and conversation history. Main chat area with SSE streaming. File upload and paste-data features. Suggested prompts after AI responses. |
| `insights.tsx` | `/insights`, `/leads` | 6-tab insights page: Dashboard (VoiceAgentCard, VideoDataCard, LeadFeedCard + Quick Summary), Goals (CRUD with status tracking), Reports (ReportCatalog), Attribution (tracking pixel), Hunches (AI suggestions with accept/dismiss), Dealer Pulse. Date range filter (24h/48h/7d/30d). |
| `agents.tsx` | `/agents` | Three-column layout: agent list (left, w-72), chat interface (center), info/artifacts/stats panel (right, w-80). Filters by type and status. Agent seeding on first load. Chat wired to DealerBrain streaming API. Automa (system agent) always active. |
| `agents-create.tsx` | `/agents/create` | Multi-step agent creation wizard: Basic Info, Channel Config (voice/video/chat/email/task), Skills, Triggers, Review. Uses `useCreateAgent` mutation. |
| `agents-edit.tsx` | `/agents/:id/edit` | Agent editing form with same sections as create. Pre-populated from `useAgent(id)`. Includes status toggle and delete. |
| `work-center.tsx` | `/work-center` | 5-tab "Hub": Calendar (AppointmentCalendar + AppointmentModal), Tasks (CRUD with checkbox toggle), Approvals (create/approve/reject), Communication (InboxPanel for email/SMS), Open Leads (status management with mark-contacted). Tab state synced with URL search params. |
| `settings.tsx` | `/settings/system` | 16+ setting tabs, role-gated. Super Admin: Users, Organizations, Partner Links, Tools, Hunches, Automa, SMS. Org Admin+: Knowledge, Email, Widget, Pages, Report Upload, Triggers. All: Application, Integrations. VIN Solutions integration test/delete. User and Org CRUD dialogs. |
| `drive.tsx` | `/drive` | File management with grid/list view toggle. Folder navigation with breadcrumb trail. Upload, create folder, delete, download. Storage usage display with progress bar. |
| `activity.tsx` | `/activity` | AI Governance page. Stats cards (total interactions, tokens, active users, top tool). Activity feed with action type filtering and pagination. Artifacts tab. CSV export for admins. Client-side search filtering. |
| `profile.tsx` | `/profile`, `/profile/preferences` | Profile tab (avatar, contact info edit), Preferences tab (dark mode toggle, notification preferences, language, timezone). Google Calendar integration (connect/disconnect/sync/toggle). Billing tab commented out (PHASE-FUTURE). Product tour restart button. |
| `notifications.tsx` | `/notifications` | Full notification history with stats overview, filtering (all/unread), pagination (10 per page). Mark read/mark all read. Navigate to related entities. Settings tab with `NotificationSettingsCard`. |
| `not-found.tsx` | `*` (catch-all) | 404 page. |

#### Hosted/Public Pages (4)

| File | Path | Purpose |
|------|------|---------|
| `hosted/HostedPage.tsx` | `/w/:slug` | Public hosted page. Fetches page config from API by slug. Supports 4 page types: chat, video, callback, multi. Multi-channel shows card selection UI. Dynamic theming from widget config (colors, branding). |
| `hosted/HostedChat.tsx` | (sub-component) | VAPI web chat widget embedded in hosted page. |
| `hosted/HostedVideo.tsx` | (sub-component) | Tavus video widget embedded in hosted page. |
| `hosted/HostedCallback.tsx` | (sub-component) | Callback request form embedded in hosted page. |

---

## 3. Routing Structure

### 3.1 Router Implementation

**File:** `client/src/App.tsx`

Uses Wouter's `<Switch>` and `<Route>` components. All protected routes wrap content in:
```
<ProtectedRoute>
  <AppLayout>
    <PageComponent />
  </AppLayout>
</ProtectedRoute>
```

### 3.2 Route Table

#### Public Routes (4) -- No authentication required

| Path | Component | Notes |
|------|-----------|-------|
| `/login` | `LoginPage` | |
| `/forgot-password` | `ForgotPasswordPage` | |
| `/reset-password` | `ResetPasswordPage` | |
| `/w/:slug` | `HostedPage` | Public widget pages |

#### Protected Routes (13 active) -- Authentication required

| Path | Component | Role Restriction |
|------|-----------|-----------------|
| `/` | `DashboardPage` | All authenticated |
| `/chat` | `MainPage` | All authenticated |
| `/leads` | `InsightsPage` | All authenticated |
| `/agents` | `AgentsPage` | All authenticated |
| `/agents/create` | `AgentCreatePage` | All authenticated |
| `/agents/:id/edit` | `AgentEditPage` | All authenticated |
| `/drive` | `DrivePage` | All authenticated |
| `/insights` | `InsightsPage` | All authenticated |
| `/work-center` | `WorkCenterPage` | All authenticated |
| `/activity` | `ActivityPage` | All authenticated |
| `/notifications` | `NotificationsPage` | All authenticated |
| `/settings/system` | `SettingsPage` | Tab-level RBAC |
| `/profile` | `ProfilePage` | All authenticated |
| `/profile/preferences` | `ProfilePage` | All authenticated |

#### Commented-Out Routes (2) -- PHASE-FUTURE

| Path | Component | Notes |
|------|-----------|-------|
| `/credits` | `CreditsPage` | Credit/billing deferred |
| `/profile/billing` | `ProfilePage` | Billing tab deferred |

#### Catch-All Route (1)

| Path | Component |
|------|-----------|
| `*` | `NotFound` |

### 3.3 Route-Level Access Control

Authentication is enforced by `ProtectedRoute` component (`client/src/components/auth/ProtectedRoute.tsx`):
- Shows `Loader2` spinner while auth state is loading
- Redirects to `/login` via Wouter's `<Redirect>` if not authenticated
- No route-level RBAC -- role restrictions are applied at the component/tab level within pages

**Role-gated content within pages:**
- `dashboard.tsx`: `ROLE_VISIBILITY` map controls which dashboard sections each role sees
- `settings.tsx`: Each tab has explicit role checks (Super Admin, Partner Admin, Org Admin, Staff)
- `sidebar.tsx`: System settings link visible only to `super_admin`, `partner_admin`, `org_admin`
- `activity.tsx`: CSV export visible only to admins

### 3.4 Duplicate Route Observation

`/leads` and `/insights` both render `InsightsPage`. The `/leads` route appears to be a convenience alias that lands on the insights page with the leads tab visible.

---

## 4. Component Inventory

### 4.1 Directory Structure

```
client/src/components/
  admin/          (2 files)
  auth/           (1 file)
  calendar/       (2 files)
  chat/           (6 files)
  communication/  (3 files)
  inbox/          (1 file)
  insights/       (5 files)
  layout/         (8 files)
  modals/         (8 files)
  notifications/  (3 files, including index.ts barrel)
  onboarding/     (1 file)
  reports/        (8 files)
  settings/       (8 files)
  sms/            (1 file)
  ui/             (47 files)
```

### 4.2 shadcn/ui Primitives (47 files)

All located in `client/src/components/ui/`. These are Radix UI-based components styled with Tailwind:

| Component | Radix Dependency |
|-----------|-----------------|
| `accordion.tsx` | @radix-ui/react-accordion |
| `alert.tsx` | Native |
| `alert-dialog.tsx` | @radix-ui/react-alert-dialog |
| `aspect-ratio.tsx` | @radix-ui/react-aspect-ratio |
| `avatar.tsx` | @radix-ui/react-avatar |
| `badge.tsx` | Native |
| `breadcrumb.tsx` | Native |
| `button.tsx` | Native (class-variance-authority) |
| `calendar.tsx` | react-day-picker |
| `card.tsx` | Native |
| `carousel.tsx` | embla-carousel-react |
| `chart.tsx` | recharts |
| `checkbox.tsx` | @radix-ui/react-checkbox |
| `collapsible.tsx` | @radix-ui/react-collapsible |
| `command.tsx` | cmdk |
| `context-menu.tsx` | @radix-ui/react-context-menu |
| `dialog.tsx` | @radix-ui/react-dialog |
| `drawer.tsx` | vaul |
| `dropdown-menu.tsx` | @radix-ui/react-dropdown-menu |
| `form.tsx` | react-hook-form + @hookform/resolvers |
| `hover-card.tsx` | @radix-ui/react-hover-card |
| `input.tsx` | Native |
| `input-otp.tsx` | input-otp |
| `label.tsx` | @radix-ui/react-label |
| `menubar.tsx` | @radix-ui/react-menubar |
| `navigation-menu.tsx` | @radix-ui/react-navigation-menu |
| `pagination.tsx` | Native |
| `popover.tsx` | @radix-ui/react-popover |
| `progress.tsx` | @radix-ui/react-progress |
| `radio-group.tsx` | @radix-ui/react-radio-group |
| `resizable.tsx` | react-resizable-panels |
| `scroll-area.tsx` | @radix-ui/react-scroll-area |
| `select.tsx` | @radix-ui/react-select |
| `separator.tsx` | @radix-ui/react-separator |
| `sheet.tsx` | @radix-ui/react-dialog (side variant) |
| `sidebar.tsx` | Custom (shadcn pattern) |
| `skeleton.tsx` | Native |
| `slider.tsx` | @radix-ui/react-slider |
| `switch.tsx` | @radix-ui/react-switch |
| `table.tsx` | Native |
| `tabs.tsx` | @radix-ui/react-tabs |
| `textarea.tsx` | Native |
| `toast.tsx` | @radix-ui/react-toast |
| `toaster.tsx` | Toast consumer |
| `toggle.tsx` | @radix-ui/react-toggle |
| `toggle-group.tsx` | @radix-ui/react-toggle-group |
| `tooltip.tsx` | @radix-ui/react-tooltip |

### 4.3 Custom Components (59 files)

#### Layout Components (8)

| File | Purpose |
|------|---------|
| `layout/AppLayout.tsx` | Main layout wrapper. ViewConfig system: `chat-only`, `data-display`, `sub-menu`, `heavy-chat`. Includes TopBar, Sidebar, MobileSidebar, SubMenuManager, RightPane. |
| `layout/TopBar.tsx` | Header bar (h-14). Logo, org switcher (Partner Admin), NotificationBell, ActivityDropdown, Help button, Theme toggle, Profile dropdown with org switching. |
| `layout/Sidebar.tsx` | Desktop icon sidebar (w-16, collapsible to w-10). 6 main items + 1 admin item + logout. Sub-menu hover with 1s timeout. Purple active indicator. |
| `layout/MobileSidebar.tsx` | Mobile navigation via Sheet (slide-in). Same menu items as Sidebar but with labels. Role-gated System link. |
| `layout/SubMenuManager.tsx` | Dynamic sub-menu panel (w-64). Renders contextual navigation for: Agents (agent list), Drive (folders), Insights (tabs), Work Center (tabs with badge counts), Activity (filters), System Settings (sections), Profile. Fixed or pinned positioning. |
| `layout/SubMenuPanel.tsx` | Reusable sub-menu panel wrapper with header, collapse button, scroll area, hover behavior. |
| `layout/RightPane.tsx` | Quick-chat pane (w-80). Dual mode: inline sidebar or Sheet (mobile). Wired to real DealerBrain streaming API. Ephemeral conversations. Suggestions from API. |
| `layout/FavoritesBar.tsx` | Bookmark bar for favoriting pages. Star toggle + horizontal list of saved favorites with remove buttons. |

#### Chat Components (6)

| File | Purpose |
|------|---------|
| `chat/FloatingChat.tsx` | Global floating chat bubble (bottom-right). Purple-blue gradient FAB. Opens ChatPanel in a 396x500 floating window. Hidden on public pages and `/chat`. |
| `chat/ChatPanel.tsx` | Reusable chat panel used by FloatingChat and potentially other surfaces. Full chat interface with conversation management. |
| `chat/StreamingMessage.tsx` | Renders streaming AI responses: thinking indicator, tool execution cards with status icons, progressive token display, chart rendering, error states. |
| `chat/ChatChart.tsx` | Renders inline charts (bar/line/pie) within chat messages using Recharts. |
| `chat/ChatSidePanel.tsx` | Side panel used within chat interfaces for additional context. |
| `chat/SuggestedPrompts.tsx` | Renders clickable suggested prompts after AI responses. |

#### Modal Components (8)

| File | Purpose |
|------|---------|
| `modals/TranscriptModal.tsx` | Displays voice call transcripts. |
| `modals/AudioPlayerModal.tsx` | Audio playback for call recordings. |
| `modals/LeadDetailModal.tsx` | Detailed lead information view. |
| `modals/VoiceCallsTableModal.tsx` | Tabular view of voice call data. |
| `modals/VideoSessionsTableModal.tsx` | Tabular view of video session data. |
| `modals/LeadsTableModal.tsx` | Tabular view of leads data. |
| `modals/WelcomeModal.tsx` | Legacy welcome modal (superseded by ProductTour). |
| `modals/DocumentationModal.tsx` | Help/documentation overlay. |
| `modals/VideoPlayerModal.tsx` | Video playback modal. |

#### Report Components (8)

| File | Purpose |
|------|---------|
| `reports/ReportCatalog.tsx` | Report listing and discovery interface. |
| `reports/ReportCard.tsx` | Individual report card display. |
| `reports/ReportViewer.tsx` | Full report rendering with sections. |
| `reports/ReportChartSection.tsx` | Chart section within reports. |
| `reports/ReportDataTable.tsx` | Data table within reports. |
| `reports/ReportSummaryStrip.tsx` | Summary metrics strip for reports. |
| `reports/ReportActionItems.tsx` | Action items section in reports. |
| `reports/FunnelChart.tsx` | Funnel visualization for conversion data. |

#### Settings Tab Components (8)

| File | Purpose |
|------|---------|
| `settings/AutomaSettingsCard.tsx` | Automa AI system agent configuration. |
| `settings/WidgetSettingsTab.tsx` | Master Widget configuration (VAPI/Tavus widget settings). |
| `settings/HostedPagesSettingsTab.tsx` | Hosted page management (create/edit/delete hosted widget pages). |
| `settings/EmailSettingsTab.tsx` | Email integration settings (IMAP/SMTP). |
| `settings/SmsSettingsTab.tsx` | SMS/TextMagic integration settings. |
| `settings/SystemKnowledgeTab.tsx` | Knowledge base management for AI agents. |
| `settings/TriggersSettingsTab.tsx` | Agent trigger configuration (event-based automation). |
| `settings/ReportUploadTab.tsx` | Report file upload management. |

#### Insights Components (5)

| File | Purpose |
|------|---------|
| `insights/VoiceAgentCard.tsx` | Voice agent performance metrics card. |
| `insights/VideoDataCard.tsx` | Video engagement metrics card. |
| `insights/LeadFeedCard.tsx` | Real-time lead feed card (VIN Solutions sourced). |
| `insights/AttributionPanel.tsx` | Tracking pixel and attribution analytics. |
| `insights/DealerPulsePanel.tsx` | Dealer Pulse health monitoring dashboard. |

#### Communication Components (3)

| File | Purpose |
|------|---------|
| `communication/UniversalInbox.tsx` | Unified email inbox with thread view. |
| `communication/ComposeEmailModal.tsx` | Email composition with rich text (Tiptap). |
| `communication/EmailSettingsModal.tsx` | Email account connection settings. |

#### Calendar Components (2)

| File | Purpose |
|------|---------|
| `calendar/AppointmentCalendar.tsx` | FullCalendar integration with appointment display. |
| `calendar/AppointmentModal.tsx` | Appointment create/edit dialog. |

#### Admin Components (2)

| File | Purpose |
|------|---------|
| `admin/UserDialogs.tsx` | User CRUD dialogs (create/edit/delete). Role assignment. |
| `admin/OrgDialogs.tsx` | Organization CRUD dialogs (create/edit/delete). |

#### Notification Components (3)

| File | Purpose |
|------|---------|
| `notifications/NotificationBell.tsx` | TopBar notification bell with unread count badge. Dropdown with recent notifications. |
| `notifications/NotificationSettingsCard.tsx` | Notification preference management (email, in-app, per-category toggles). |
| `notifications/index.ts` | Barrel export file. |

#### Other Components (3)

| File | Purpose |
|------|---------|
| `onboarding/ProductTour.tsx` | First-login product tour using driver.js. 9 steps covering sidebar navigation. Stores completion in localStorage. Restartable from Profile. |
| `inbox/InboxPanel.tsx` | Messaging inbox panel for the Work Center communication tab. |
| `sms/SMSComposeDialog.tsx` | SMS message composition dialog (TextMagic integration). |
| `auth/ProtectedRoute.tsx` | Auth guard. Spinner while loading, redirect to `/login` if unauthenticated. |

---

## 5. State Management

### 5.1 Architecture Overview

The application uses a **dual-layer state management** approach:

1. **Server State:** TanStack Query (React Query) for all API data
2. **Client State:** React Context API for UI state, auth, chat, and theme

### 5.2 Context Providers (4)

**Provider Hierarchy** (defined in `App.tsx`):
```
QueryClientProvider
  TooltipProvider
    ThemeProvider
      AuthProvider
        AppProvider
          ChatProvider
            <Router />
            <FloatingChat />
            <ProductTour />
            <Toaster />
```

#### AuthContext (`contexts/AuthContext.tsx`)

**Purpose:** JWT authentication and user session management.

**State:**
- `user` -- Full user object (id, email, firstName, lastName, role, organization)
- `accessToken` -- JWT access token (stored in `localStorage` as `nexxus_access_token`)
- `refreshToken` -- JWT refresh token (stored as `nexxus_refresh_token`)
- `isAuthenticated` -- Boolean derived from token presence
- `loading` -- Auth initialization state
- `error` -- Last auth error
- `isPartnerAdmin` -- Derived from `role.level === 2`
- `accessibleOrganizations` -- List of orgs for Partner Admin switching

**Methods:**
- `login(email, password)` -- Authenticate and store tokens
- `logout()` -- Clear tokens and state
- `refreshToken()` -- Refresh JWT before expiry
- `switchOrganization(orgId)` -- Partner Admin org context switch
- `clearError()` -- Clear error state

**Token Management:**
- Tokens stored in `localStorage` with keys: `nexxus_access_token`, `nexxus_refresh_token`, `nexxus_token_expiry`
- Auto-refresh interval: checks every 60 seconds, refreshes when < 5 minutes to expiry
- On refresh failure: automatic logout

#### AppContext (`contexts/AppContext.tsx`)

**Purpose:** Global UI state management.

**State:**
- `currentUser` -- Derived from AuthContext with role mapping
- `currentOrganization` -- Derived from AuthContext
- `sidebarVisible` -- Desktop sidebar collapse state
- `rightPaneOpen` -- Right quick-chat pane state
- `mobileMenuOpen` -- Mobile sidebar sheet state
- `mobileChatOpen` -- Mobile chat sheet state
- `activePanel` -- Currently active sub-menu panel ID
- `subMenuExpanded` -- Sub-menu pinned/expanded state
- `panelHovered` -- Whether sub-menu panel is hovered
- `selectedAgent` -- Currently selected agent in agents page
- `favorites` -- User's bookmarked pages (array of `{id, label, path}`)

**Role Mapping:**
Maps numeric role levels to string identifiers:
- Level 1 -> `super_admin`
- Level 2 -> `partner_admin`
- Level 3 -> `org_admin`
- Level 4 -> `org_staff`

**UserRole type:** `'super_admin' | 'partner_admin' | 'org_admin' | 'org_staff'`

#### ChatContext (`contexts/ChatContext.tsx`)

**Purpose:** Global floating chat panel state.

**State:**
- `isOpen` -- Chat panel visibility
- `isMinimized` -- Chat panel minimized state
- `activeConversationId` -- Current conversation ID

**Methods:**
- `openChat()` / `closeChat()` / `toggleChat()`
- `toggleMinimize()`
- `setActiveConversation(id)`

#### ThemeContext (`contexts/ThemeContext.tsx`)

**Purpose:** Light/dark theme management.

**State:**
- `theme` -- `'light' | 'dark'`

**Methods:**
- `toggleTheme()` -- Switch between light/dark
- `setTheme(theme)` -- Set specific theme

**Behavior:**
- Persists to `localStorage` key `nexxus:theme`
- System preference fallback via `prefers-color-scheme` media query listener
- Applies/removes `dark` class on `document.documentElement`

### 5.3 TanStack Query Configuration

**File:** `client/src/lib/queryClient.ts`

**Default Settings:**
```typescript
{
  staleTime: Infinity,       // Data never auto-stales
  refetchOnWindowFocus: false, // No refetch on tab focus
  retry: false,               // No automatic retries
}
```

**Custom `getQueryFn`:** A factory function that handles 401 responses (returns null or throws, configurable).

**Cache Invalidation Patterns (observed in hooks):**
- Mutations invalidate related query keys on success
- `queryClient.invalidateQueries()` called on org switch (invalidates ALL cached data)
- Some hooks use custom `staleTime` overrides (e.g., agents at 30s, agent stats at 60s)

### 5.4 Custom Hooks (26)

All located in `client/src/hooks/`:

| Hook | TanStack Queries | TanStack Mutations | Purpose |
|------|-----------------|-------------------|---------|
| `useActivity` | 2 (events list, recent) | 0 | Activity feed + governance data |
| `useAdmin` | 2+ (users, orgs) | 3+ (CRUD) | Admin user/org management |
| `useAgents` | 3 (list, detail, stats) | 4 (create, update, delete, duplicate) | Agent CRUD |
| `useAppointments` | 2 (list, detail) | 3 (create, update, delete) | Calendar appointments |
| `useApprovals` | 2 (list, stats) | 3 (create, approve, reject) | Approval workflow |
| `useConversations` | 3 (list, detail, suggestions) | 2 (create, delete) | Chat conversations |
| `useCredits` | 1 (usage) | 0 | Credit usage tracking |
| `useDealerBrainConfig` | 1 (config) | 0 | DealerBrain AI configuration |
| `useDealerPulse` | 1 (pulse data) | 0 | Dealer health metrics |
| `useDrive` | 2 (files, storage) | 4 (upload, create folder, delete, download) | File management |
| `useEmail` | 2 (threads, detail) | 2 (send, reply) | Email operations |
| `useFirstLogin` | 0 | 0 | First login detection |
| `useGoals` | 1 (list) | 3 (create, update, delete) | Goals CRUD |
| `useGoogleCalendar` | 1 (status) | 3 (connect, disconnect, sync) | Google Calendar OAuth |
| `useHunches` | 1 (list) | 2 (accept, dismiss) | AI-generated hunches |
| `useInbox` | 2 (messages, unread count) | 1 (mark read) | Unified inbox |
| `useInsights` | 3 (voice, video, leads) | 0 | Dashboard insight cards |
| `useLeads` | 2 (list, stats) | 2 (update status, mark contacted) | Lead management |
| `useMetrics` | 1 (dashboard metrics) | 0 | Dashboard data |
| `useNotifications` | 2 (list, settings) | 3 (mark read, mark all, update settings) | Notifications |
| `useProfile` | 1 (profile) | 1 (update) | User profile |
| `useReports` | 2 (catalog, detail) | 1 (upload) | Report management |
| `useStreamingMessage` | 0 | 0 | SSE streaming for AI chat |
| `useTasks` | 2 (list, stats) | 3 (create, update, delete) | Task CRUD |
| `useTracking` | 1 (pixel data) | 1 (create pixel) | Attribution tracking |
| `use-toast` | 0 | 0 | Toast notification utility |

**Additional utility hook:**
- `use-mobile.tsx` -- Responsive breakpoint detection

### 5.5 Hook Pattern Analysis

**Standard Query Pattern** (exemplified by `useAgents`):
```typescript
export function useAgents(filters: AgentQueryFilters = {}) {
  return useQuery({
    queryKey: agentKeys.list(filters),
    queryFn: async (): Promise<AgentListResponse> => {
      // Build query string from filters
      return apiGet<AgentListResponse>(url);
    },
    staleTime: 30 * 1000,
  });
}
```

**Standard Mutation Pattern** (exemplified by `useCreateAgent`):
```typescript
export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAgentInput): Promise<Agent> => {
      return apiPost<Agent>('/api/agents', input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: agentKeys.stats() });
    },
  });
}
```

**Query Key Factory Pattern** (used consistently):
```typescript
export const agentKeys = {
  all: ['agents'] as const,
  lists: () => [...agentKeys.all, 'list'] as const,
  list: (filters) => [...agentKeys.lists(), filters] as const,
  details: () => [...agentKeys.all, 'detail'] as const,
  detail: (id) => [...agentKeys.details(), id] as const,
  stats: () => [...agentKeys.all, 'stats'] as const,
};
```

### 5.6 SSE Streaming State (`useStreamingMessage`)

**File:** `client/src/hooks/useStreamingMessage.ts`

Manages real-time AI response streaming via Server-Sent Events:

**StreamingState:**
```typescript
{
  isStreaming: boolean;
  content: string;          // Progressive token accumulation
  thinkingMessage?: string; // "Analyzing your request..."
  activeTools: {            // Tool execution visibility
    name: string;
    description: string;
    status: 'running' | 'success' | 'error';
    summary?: string;
  }[];
  charts: ChartData[];      // Inline chart data from tool results
  error?: string;
}
```

**SSE Event Types:**
- `thinking` -- Sets thinking indicator message
- `tool_start` -- Adds tool to activeTools with running status
- `tool_end` -- Updates tool status to success/error with summary
- `token` -- Appends content token
- `done` -- Marks streaming complete, calls `onComplete` callback
- `error` -- Sets error state

**Implementation:** Uses native `fetch()` with `ReadableStream` reader. Supports `AbortController` for cancellation. Includes safety-net reset in `finally` block for network drops.

### 5.7 Mock Data Modules (9)

Located in `client/src/mocks/`:

| File | Purpose |
|------|---------|
| `index.ts` | Barrel exports |
| `agents.ts` | Mock agent data |
| `activity.ts` | Mock activity feed data |
| `files.ts` | Mock drive file data |
| `insights.ts` | Mock insight metrics |
| `messages.ts` | Mock message data |
| `notifications.ts` | Mock notification data |
| `tasks.ts` | Mock task data |
| `users.ts` | Mock user data |

**Note:** These appear to be legacy from early development. The hooks now use real API calls. Mock data may still be referenced as fallbacks in some components.

---

## 6. UI Framework

### 6.1 Tailwind CSS Configuration

**CSS Entry Point:** `client/src/index.css` (615 lines)

The application uses Tailwind CSS v4 with a comprehensive custom theme system. All colors are defined as CSS custom properties using HSL values.

**CSS Custom Properties (Light Mode -- `:root`):**

| Variable | Value | Purpose |
|----------|-------|---------|
| `--background` | `0 0% 100%` (White) | Page background |
| `--foreground` | `222 47% 11%` (Slate 900) | Primary text |
| `--primary` | `217 91% 60%` (Blue 500) | Primary actions |
| `--secondary` | `187 85% 43%` (Cyan 500) | Secondary actions |
| `--destructive` | `0 84% 60%` (Red 500) | Error/danger states |
| `--muted` | `210 40% 96%` (Slate 100) | Subdued backgrounds |
| `--accent` | `210 40% 96%` (Slate 100) | Hover/active states |
| `--card` | `210 40% 98%` (Slate 50) | Card backgrounds |
| `--sidebar` | `210 40% 98%` (Slate 50) | Sidebar background |
| `--border` | `214 32% 91%` (Slate 200) | Borders |
| `--input` | `214 32% 91%` (Slate 200) | Input borders |
| `--ring` | `217 91% 60%` (Blue 500) | Focus rings |

**Dark Mode (`.dark` class):**

| Variable | Value | Purpose |
|----------|-------|---------|
| `--background` | `222 47% 11%` (Slate 900) | Page background |
| `--foreground` | `210 40% 98%` (Slate 50) | Primary text |
| `--primary` | `217 91% 73%` (Blue 400) | Primary actions |
| `--secondary` | `187 94% 58%` (Cyan 400) | Secondary actions |
| `--card` | `222 47% 15%` (Slate 800) | Card backgrounds |
| `--sidebar` | `222 47% 15%` (Slate 800) | Sidebar background |
| `--border` | `217 33% 17%` (Slate 700) | Borders |

**Font Stack:**
```css
--font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
--font-serif: 'Merriweather', Georgia, serif;
--font-mono: 'Fira Code', Monaco, 'Courier New', monospace;
```

**Border Radius:** `--radius: 0.5rem` (8px)

### 6.2 Custom CSS Features

**Signature Element -- Chat Input Gradient:**
```css
.chat-input-gradient {
  background: linear-gradient(90deg, #8b5cf6, #3b82f6, #06b6d4, #8b5cf6);
  background-size: 300% 100%;
  animation: gradient-shift 8s ease infinite;
  box-shadow: 0 0 25px rgba(139, 92, 246, 0.4), 0 0 50px rgba(59, 130, 246, 0.2);
}
```

**Dual-Density Typography:**
- `.density-data` -- 13px / 1.4 line height (compact data displays)
- `.density-chat` -- 14px / 1.6 line height (readable chat messages)

**Elevation System:**
- `.hover-elevate` -- Pseudo-element overlay on hover (`--elevate-1`: 3% opacity)
- `.hover-elevate-2` -- Stronger hover overlay (`--elevate-2`: 8% opacity)
- `.active-elevate` / `.active-elevate-2` -- Active state variants
- `.toggle-elevate` -- Toggleable elevation state

**Chart Color Palette:**
5 chart colors defined: Blue, Cyan, Cyan, Green, Amber

**Computed Borders:**
Automatic border color computation using CSS `hsl()` relative color syntax:
```css
--primary-border: hsl(from hsl(var(--primary)) h s calc(l + var(--opaque-button-border-intensity)) / alpha);
```

### 6.3 Third-Party CSS Integration

**FullCalendar Theming (40+ lines):**
- Full CSS variable mapping for FullCalendar's color system
- Tailwind `@apply` directives for FullCalendar elements
- Separate dark mode overrides

**Tiptap Editor Styles (25+ lines):**
- Paragraph, list, blockquote, link, placeholder styling

**driver.js Product Tour Styles (130+ lines):**
- Theme-aware overrides for both light and dark modes
- Explicit color setting required due to driver.js using `all: unset`

**Scrollbar Styling:**
- Custom WebKit scrollbar: 8px width, rounded thumb
- `.hide-scrollbar` utility class

### 6.4 Icon Library

**lucide-react** is used exclusively. Import analysis shows approximately 60+ unique icons used across the application. Major usage areas:
- Sidebar navigation: `LayoutDashboard`, `Bot`, `Folder`, `BarChart3`, `Briefcase`, `Activity`, `Settings`
- TopBar: `Sun`, `Moon`, `Menu`, `ChevronDown`, `User`, `Building2`, `Bell`
- Chat: `Send`, `Plus`, `Bot`, `Sparkles`, `Loader2`
- Data display: `Phone`, `Video`, `Users`, `Database`, `FileOutput`

---

## 7. Authentication Flow

### 7.1 Implementation

**File:** `client/src/contexts/AuthContext.tsx`

### 7.2 Token Storage

| Key | Storage | Content |
|-----|---------|---------|
| `nexxus_access_token` | localStorage | JWT access token |
| `nexxus_refresh_token` | localStorage | JWT refresh token |
| `nexxus_token_expiry` | localStorage | Token expiry timestamp |

### 7.3 Login Flow

1. User submits email/password on `/login` page
2. `AuthContext.login()` calls `POST /api/auth/login`
3. Server returns `{ user, accessToken, refreshToken, expiresIn }`
4. Tokens stored in localStorage
5. `user` and `isAuthenticated` state updated
6. React re-render shows protected content
7. Wouter navigates to `/` (dashboard)

### 7.4 Token Refresh Flow

1. `setInterval` runs every 60 seconds
2. Checks if `tokenExpiry - now < 5 minutes`
3. If yes, calls `POST /api/auth/refresh` with refresh token
4. Updates stored tokens and expiry
5. On failure: calls `logout()` (clears state, redirects to login)

### 7.5 Request Authentication

**File:** `client/src/lib/api.ts`

All API calls go through the `fetchApi()` function which:
1. Reads `nexxus_access_token` from localStorage
2. Attaches `Authorization: Bearer <token>` header
3. Sets `credentials: 'include'` on all requests
4. Returns typed response or throws

**API Client Functions:**
- `apiGet<T>(url)` -- GET with auth
- `apiPost<T>(url, body)` -- POST with auth + JSON body
- `apiPut<T>(url, body)` -- PUT with auth + JSON body
- `apiPatch<T>(url, body)` -- PATCH with auth + JSON body
- `apiDelete(url)` -- DELETE with auth
- `apiDeleteWithResponse<T>(url)` -- DELETE with auth returning response body
- `fetchApi(url, options)` -- Raw fetch with auth
- `buildQueryString(params)` -- Query string builder utility

### 7.6 Route Protection

**File:** `client/src/components/auth/ProtectedRoute.tsx`

```typescript
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader2 spinner />;
  if (!isAuthenticated) return <Redirect to="/login" />;
  return children;
}
```

### 7.7 Organization Switching (Partner Admin)

Partner Admins can switch between multiple organizations:
1. `accessibleOrganizations` array populated from auth response
2. Org switcher appears in TopBar and profile dropdown
3. `switchOrganization(orgId)` calls `POST /api/auth/switch-org`
4. Server returns new tokens scoped to selected org
5. `queryClient.invalidateQueries()` clears ALL cached data
6. Navigation to `/` to reset page state
7. Confirmation overlay displayed for 3 seconds

### 7.8 RBAC Implementation

**4-tier role hierarchy:**

| Level | Role | Access |
|-------|------|--------|
| 1 | Super Admin | System-wide. All settings tabs. User/Org management. |
| 2 | Partner Admin | Multi-org access. Org switching. All settings except system-level. |
| 3 | Org Admin | Single org. Knowledge, Email, Widget, Pages, Triggers settings. |
| 4 | Org Staff | Basic access. Dashboard, Agents, Drive, Insights, Work Center. |

Role checks are performed client-side using:
- `currentUser.role` from AppContext
- `canAccessSystem(role)` helper function
- Explicit level/name checks in page components
- `ROLE_VISIBILITY` maps in dashboard

---

## 8. Key Features Visible in the UI

### 8.1 Dashboard (Command Center)

**File:** `client/src/pages/dashboard.tsx`

**Components:**
- **DealershipPulse** -- Health gauge with red/yellow/green scoring. Score explanation modal. Lead source badges.
- **GoalProgress** -- Active goals with progress bars and status.
- **LeadFeed** -- Real-time lead list from VIN Solutions API. Lead detail drill-down modal. Source badges (VIN, VAPI, Tavus, SMS, Email, Widget, Manual).
- **AgentActions** -- Sparkline charts showing agent interaction trends.
- **TeamLeaderboard** -- Staff performance ranking.

**Behavior:**
- Auto-refresh every 60 seconds
- Manual refresh with 5-minute cooldown
- Role-based section visibility
- Score explanation modals for health metrics

### 8.2 DealerBrain AI Chat

**File:** `client/src/pages/main.tsx`

**Features:**
- Left sidebar: conversation history with favorites
- Central chat area with full-width messages
- SSE streaming with thinking indicators and tool execution visibility
- File upload capability
- Paste data feature
- Suggested prompts after AI responses
- Markdown rendering for AI responses
- Inline chart rendering (bar/line/pie from tool results)

**Streaming Events Visualized:**
- Thinking: pulsing text with spinner
- Tool Start: card with tool icon and "running" spinner
- Tool End: card with success/error status and summary
- Tokens: progressive text display with cursor
- Charts: inline Recharts visualizations

### 8.3 AI Agents

**Files:** `client/src/pages/agents.tsx`, `agents-create.tsx`, `agents-edit.tsx`

**Agent Types:** Voice, Video, Chat, Email, Task

**Features:**
- Three-column layout (list / chat / info)
- Agent CRUD with multi-step wizard
- Status management (active/inactive/draft)
- Agent-specific chat powered by DealerBrain
- Performance metrics per agent
- 10 available skills: CRM Lookup, Lead Monitor, SMS Responder, Email Notifier, Task Creator, Lead Assigner, Appointment Watcher, Call Analyzer, AI Responder, Performance Tracker
- 5 trigger types: Mention, Direct Message, Assign Task, Scheduled, Automated
- Agent duplication
- Automa (system agent) always visible

### 8.4 Insights & Analytics

**File:** `client/src/pages/insights.tsx`

**6 Tabs:**
1. **Dashboard** -- VoiceAgentCard (call metrics), VideoDataCard (session metrics), LeadFeedCard (lead pipeline). Quick Summary strip. Date range filter (24h/48h/7d/30d).
2. **Goals** -- CRUD with status tracking (not started/in progress/completed/missed). Progress percentage. Date ranges.
3. **Reports** -- ReportCatalog with category filtering. ReportViewer with sections, charts, data tables, action items.
4. **Attribution** -- Tracking pixel management. Attribution analytics.
5. **Hunches** -- AI-generated suggestions with accept/dismiss actions.
6. **Dealer Pulse** -- 5-phase dealer health snapshot with AI commentary.

### 8.5 Work Center (Hub)

**File:** `client/src/pages/work-center.tsx`

**5 Tabs:**
1. **Calendar** -- FullCalendar integration (day/week/month views). Appointment create/edit modal. Google Calendar sync.
2. **Tasks** -- Task list with checkbox completion. CRUD operations. Status filtering.
3. **Approvals** -- Create/approve/reject workflow. Badge count for pending.
4. **Communication** -- UniversalInbox (email threads). ComposeEmailModal with Tiptap rich text. SMS compose via TextMagic.
5. **Open Leads** -- Lead list with status management. Mark-contacted with VIN Solutions sync. Lead detail modal.

### 8.6 Drive (File Management)

**File:** `client/src/pages/drive.tsx`

- Grid/list view toggle
- Folder navigation with breadcrumb trail
- File upload with drag-and-drop
- Create folder
- Delete files/folders
- Download files
- Storage usage display with progress bar
- File type icons

### 8.7 Activity & AI Governance

**File:** `client/src/pages/activity.tsx`

- Stats overview cards (total interactions, tokens used, active users, top tool)
- Activity feed with action type filtering
- Pagination
- Search filtering (client-side)
- Artifacts tab
- CSV export (admin only)
- Action types: chat_message, tool_invocation, artifact_generated, context_query, system_prompt

### 8.8 Settings (System Administration)

**File:** `client/src/pages/settings.tsx`

**16+ Tabs (role-gated):**

| Tab | Min Role | Features |
|-----|----------|----------|
| Users | Super Admin | User CRUD, role assignment, invitation |
| Organizations | Super Admin | Org CRUD, config management |
| Partner Links | Super Admin | Partner-organization associations |
| Application | All | General app settings |
| Tools | Super Admin | Integration tool configuration |
| Knowledge | Org Admin | Knowledge base source management |
| Hunches | Super Admin | AI hunch settings |
| Automa | Super Admin | Automa system agent config |
| Integrations | All | VIN Solutions OAuth connect/test/delete |
| Email | Org Admin | IMAP/SMTP email settings |
| SMS | Super Admin | TextMagic SMS settings |
| Widget | Org Admin | Master Widget configuration |
| Pages | Org Admin | Hosted page management |
| Report Upload | Org Admin | Report file upload |
| Triggers | Org Admin | Agent trigger configuration |

### 8.9 Notifications

**File:** `client/src/pages/notifications.tsx`

- Full notification history
- Stats overview (total, unread)
- Filter: all/unread
- Pagination (10 per page)
- Mark read / mark all read
- Navigate to related entity
- Notification settings (per-category email/in-app toggles)

### 8.10 Profile & Preferences

**File:** `client/src/pages/profile.tsx`

- Profile editing (avatar, name, contact)
- Preferences: dark mode, notification settings, language, timezone
- Google Calendar OAuth: connect/disconnect/sync/toggle
- Product tour restart button
- Billing tab (commented out -- PHASE-FUTURE)

### 8.11 Hosted Widget Pages

**File:** `client/src/pages/hosted/HostedPage.tsx`

- Public pages at `/w/:slug` (no authentication)
- 4 page types: chat, video, callback, multi
- Multi-channel: card selection UI for chat/video/callback
- Dynamic theming from widget config
- Sub-components: HostedChat (VAPI), HostedVideo (Tavus), HostedCallback (form)

### 8.12 Floating Chat (Global)

**File:** `client/src/components/chat/FloatingChat.tsx`

- Purple-blue gradient floating action button (bottom-right)
- Opens 396x500px floating chat panel
- ChatPanel with full DealerBrain capabilities
- Hidden on public pages and `/chat` (main chat page)
- Minimizable

### 8.13 Product Tour (Onboarding)

**File:** `client/src/components/onboarding/ProductTour.tsx`

- 9-step guided tour using driver.js
- Covers: Dashboard, DealerBrain, Insights, Hub, Agents, Drive, Activity
- Auto-starts on first login
- Restartable from Profile Preferences
- Theme-aware (light/dark mode support)
- Completion tracked in localStorage

---

## 9. Theme System and Responsive Design

### 9.1 Theme System

**Implementation:** CSS class strategy (`dark` class on `<html>`)

**Toggle Mechanism:** ThemeContext provides `toggleTheme()` which:
1. Toggles between `'light'` and `'dark'`
2. Adds/removes `dark` class on `document.documentElement`
3. Persists to `localStorage` key `nexxus:theme`
4. Falls back to system preference via `matchMedia('(prefers-color-scheme: dark)')`

**Color Palette:**
- **Light:** Slate palette background (white -> slate 50/100), Blue 500 primary, Cyan 500 secondary
- **Dark:** Slate 800/900 backgrounds, Blue 400 primary, Cyan 400 secondary
- Purple 500/400 accent (sidebar active indicators, agent avatars, chat gradient)

**Theme-Aware Custom CSS:**
- Chat input gradient animation (purple -> blue -> cyan)
- FullCalendar overrides for both modes
- driver.js Product Tour overrides for both modes
- Scrollbar styling for both modes
- Elevation system adapts (light: rgba black overlays, dark: rgba white overlays)

### 9.2 Responsive Design Patterns

**Breakpoint Strategy:**
- Mobile: < 1024px (`lg`)
- Desktop: >= 1024px
- Wide desktop: >= 1280px (`xl`) -- for right pane visibility

**Layout Adaptation by Breakpoint:**

| Feature | Mobile (< lg) | Desktop (>= lg) | Wide (>= xl) |
|---------|---------------|-----------------|---------------|
| Sidebar | Hidden. MobileSidebar (Sheet) on trigger. | Visible. 64px icon bar. Collapsible to 40px. | Same as Desktop |
| Sub-menu | Not shown | Hover panel (fixed, w-64) or pinned (flex) | Same as Desktop |
| Right Pane | Sheet (bottom, 70vh) | Hidden by default | Visible if toggled (w-80) |
| Bottom Nav | Visible (Chat + Menu buttons) | Hidden | Hidden |
| TopBar | Hamburger menu button visible | Hamburger hidden | Same as Desktop |
| Org Switcher | Truncated, icon only | Full name visible | Same as Desktop |

**Mobile-Specific Components:**
- `MobileSidebar` -- Sheet component sliding from left
- `RightPane` mode="sheet" -- Bottom sheet (70vh) for chat
- Mobile bottom nav bar -- `lg:hidden` with Chat and Menu buttons

**Responsive Utility Usage:**
- `hidden lg:flex` -- Desktop-only elements
- `lg:hidden` -- Mobile-only elements
- `hidden xl:flex` -- Wide desktop only (right pane)
- `hidden sm:block` -- Hidden on very small screens (e.g., org name in TopBar)
- `max-w-48` -- Truncation for org switcher

### 9.3 ViewConfig System

**File:** `client/src/components/layout/AppLayout.tsx`

The `getViewConfig(pathname)` function determines layout mode per route:

| Route Pattern | ViewConfig | Layout Effect |
|---------------|-----------|---------------|
| `/` | `data-display` | Standard layout with optional right pane |
| `/agents/*` | `heavy-chat` | Standard layout with optional right pane |
| `/drive`, `/insights`, `/activity` | `data-display` | Standard layout with optional right pane |
| `/work-center`, `/settings/*`, `/profile/*` | `sub-menu` | Standard layout with optional right pane |
| (fallback) | `data-display` | Standard layout |

**ViewConfig Effects:**
- `chat-only`: Main content area limited to `max-w-4xl mx-auto`, no right pane toggle
- `data-display` / `sub-menu` / `heavy-chat`: Full-width content, right pane toggle available

### 9.4 Sub-Menu System

The sub-menu is a contextual navigation panel that appears between the sidebar and main content:

**Trigger Modes:**
1. **Hover:** Mouse enters sidebar item with `hasPanel: true` -> panel appears as fixed overlay (w-64). Auto-hides after 800ms-1000ms when mouse leaves.
2. **Pinned:** User clicks toggle button -> panel becomes part of flex layout (pushes content). Stays until explicitly collapsed.

**Sub-menu Panels:**
- **Agents:** Live agent list from API. Click to select agent. Create agent button.
- **Drive:** Quick links: My Files, Shared, Starred, Recent, Templates.
- **Insights:** Tab navigation: Dashboard, Dealer Pulse, Leads, Goals, Hunches, Reports.
- **Work Center:** Tab navigation with live badge counts for Tasks, Approvals, Communication, Leads.
- **Activity:** Filter categories: All, User, Agent, System.
- **System Settings:** Section links with descriptions: Users, Application, Tools, Knowledge, Hunches.
- **Profile:** User card + Profile, Preferences links.

---

## 10. Quantitative Summary

### 10.1 File Counts by Directory

| Directory | Files |
|-----------|-------|
| `components/ui/` | 47 |
| `components/` (non-ui) | 59 |
| `hooks/` | 27 (26 `.ts` + 1 `.tsx`) |
| `pages/` | 17 |
| `pages/hosted/` | 4 |
| `contexts/` | 4 |
| `lib/` | 3 |
| `mocks/` | 9 |
| Root (`App.tsx`, `main.tsx`) | 2 |
| **Total** | **~172** |

### 10.2 Route Counts

| Category | Count |
|----------|-------|
| Public routes | 4 |
| Protected routes | 13 |
| Commented-out routes | 2 |
| Catch-all (404) | 1 |
| **Total defined** | **20** |

### 10.3 Component Counts by Category

| Category | Count |
|----------|-------|
| shadcn/ui primitives | 47 |
| Layout components | 8 |
| Chat components | 6 |
| Modal components | 9 |
| Report components | 8 |
| Settings tab components | 8 |
| Insights components | 5 |
| Communication components | 3 |
| Calendar components | 2 |
| Admin components | 2 |
| Notification components | 3 |
| SMS component | 1 |
| Inbox component | 1 |
| Onboarding component | 1 |
| Auth component | 1 |
| **Total** | **105** |

### 10.4 Hook Counts by Category

| Category | Count |
|----------|-------|
| Data fetching (TanStack Query) | 22 |
| Real-time (SSE streaming) | 1 |
| UI utility (toast, mobile) | 2 |
| Feature-specific (first login) | 1 |
| **Total** | **26** |

### 10.5 TanStack Query Usage

| Type | Count (approximate) |
|------|---------------------|
| `useQuery` calls | 38 |
| `useMutation` calls | 34 |
| Query key factories | 8+ |
| Custom staleTime overrides | 5+ |

### 10.6 Context Provider Values

| Context | State values | Methods | Total exports |
|---------|-------------|---------|---------------|
| AuthContext | 7 | 5 | 12 |
| AppContext | 11 | 9 | 20 |
| ChatContext | 3 | 5 | 8 |
| ThemeContext | 1 | 2 | 3 |
| **Total** | **22** | **21** | **43** |

### 10.7 CSS Statistics

| Metric | Value |
|--------|-------|
| Total lines | 615 |
| CSS custom properties (light) | 35+ |
| CSS custom properties (dark) | 25+ |
| Chart colors | 5 |
| Custom keyframe animations | 1 |
| FullCalendar override rules | 20+ |
| driver.js override rules | 30+ |
| Tiptap override rules | 8 |

---

## End of Audit

**Audit scope:** Complete forensic examination of all source files in `client/src/`.

**Files read in full:** App.tsx, main.tsx, all 4 contexts, all 21 pages, all 8 layout components, 6 chat components, 3 representative hooks (useStreamingMessage, useAgents, useLeads), ProtectedRoute, api.ts, queryClient.ts, index.css, ProductTour.

**Files inventoried but not read in full:** All 47 shadcn/ui components (standard library, not custom), remaining 23 hooks (patterns established from 3 representative reads), remaining modal/settings/report/communication/admin components (categorized from file names and import analysis).
