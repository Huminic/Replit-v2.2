# Carry-Forward Manifest: Frontend Rebuild

**Generated:** 2026-02-22
**Scope:** All integration plumbing files in `client/src/` that MUST survive the frontend visual rebuild.
**Rule:** If a file is listed as PRESERVE, it is carried forward verbatim. REFERENCE files inform the new design but may need adaptation. REPLACEABLE files can be rebuilt from scratch.

---

## 1. API Client Layer

These files are the sole interface between the frontend and the backend. Deleting them severs all data flow.

| File | What It Does | Verdict |
|------|-------------|---------|
| `client/src/lib/api.ts` | Authenticated fetch wrapper (`fetchApi`, `apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete`, `buildQueryString`). Injects JWT from localStorage, handles error parsing. | **PRESERVE** |
| `client/src/lib/queryClient.ts` | TanStack Query client singleton (`queryClient`), default query function (`getQueryFn`), and `apiRequest` helper. Sets global staleTime/retry policy. | **PRESERVE** |

### Key Contract Details
- Token key: `nexxus_access_token` in localStorage
- All requests use `credentials: 'include'`
- Error format: `{status}: {message}` thrown as Error
- `api.ts` exports both individual functions AND a convenience `api` object
- `queryClient.ts` exports a separate `apiRequest` that some older code uses (notably admin hooks)

---

## 2. React Context Providers

These form the provider tree in `App.tsx`. Order matters: `QueryClientProvider > ThemeProvider > AuthProvider > AppProvider > ChatProvider`.

| File | What It Does | Verdict |
|------|-------------|---------|
| `client/src/contexts/AuthContext.tsx` | JWT login/logout/refresh, token storage (access + refresh + expiry in localStorage), user state, org switching, auto-refresh timer. Exports `useAuth()`. | **PRESERVE** |
| `client/src/contexts/AppContext.tsx` | Derives `currentUser` and `currentOrganization` from AuthContext. Also holds UI state (sidebar, panels, favorites, mobile menu). Exports `useApp()`. | **REFERENCE** |
| `client/src/contexts/ChatContext.tsx` | Global DealerBrain chat panel state (open/close/minimize, active conversation ID). Exports `useChat()`. | **REFERENCE** |
| `client/src/contexts/ThemeContext.tsx` | Light/dark theme toggle with localStorage persistence (`nexxus:theme`) and system preference detection. Exports `useTheme()`. | **REFERENCE** |

### AuthContext Deep Details (Critical)
- localStorage keys: `nexxus_access_token`, `nexxus_refresh_token`, `nexxus_token_expiry`, `nexxus_accessible_orgs`
- Login endpoint: `POST /api/auth/login`
- Refresh endpoint: `POST /api/auth/refresh`
- User fetch: `GET /api/auth/me`
- Org switch: `POST /api/auth/switch-org`
- Logout: `POST /api/auth/logout`
- Auto-refresh: checks every 60s, refreshes if within 5 minutes of expiry
- `isPartnerAdmin` derived from `role.level === 2`
- `User` type: `{ id, email, firstName, lastName, role: { id, name, level }, organization: { id, name }, locationId? }`
- `AccessibleOrganization` type: `{ id, name, slug }`

### AppContext Deep Details
- Maps AuthContext `role.level` to string: `1=super_admin, 2=partner_admin, 3=org_admin, 4+=org_staff`
- UI state fields: `sidebarVisible`, `rightPaneOpen`, `mobileMenuOpen`, `mobileChatOpen`, `activePanel`, `subMenuExpanded`, `panelHovered`, `selectedAgent`, `favorites`
- Favorites default: Insights Dashboard + Hub Calendar

---

## 3. TanStack Query Hooks (`client/src/hooks/`)

Every hook below is a data-fetching bridge between UI and backend. Each file contains types, query keys, hooks, and utility functions.

### 3a. Core Data Hooks (PRESERVE)

| File | What It Fetches | Exported Hooks | Verdict |
|------|----------------|----------------|---------|
| `client/src/hooks/useLeads.ts` | Lead list, stats, status updates, mark-contacted mutation | `useLeads`, `useLeadStats`, `useUpdateLeadStatus`, `useMarkLeadContacted` | **PRESERVE** |
| `client/src/hooks/useAgents.ts` | Agent CRUD, list with filters, stats, duplicate, status toggle | `useAgents`, `useAgent`, `useAgentStats`, `useCreateAgent`, `useUpdateAgent`, `useUpdateAgentStatus`, `useDeleteAgent`, `useDuplicateAgent` | **PRESERVE** |
| `client/src/hooks/useInsights.ts` | Dashboard metrics (voice/video/leads), charts, lead aging, lead detail/assign | `useDashboardInsights`, `useVoiceInsights`, `useVoiceCallChart`, `useVideoInsights`, `useVideoEngagementChart`, `useLeadInsights`, `useLeadChart`, `useLead`, `useUpdateLeadStatus`, `useAssignLead`, `useLeadAging` | **PRESERVE** |
| `client/src/hooks/useConversations.ts` | DealerBrain chat conversations, messages, suggestions, CRUD, optimistic send | `useConversations`, `useConversation`, `useMessages`, `useSuggestions`, `useCreateConversation`, `useUpdateConversation`, `useDeleteConversation`, `useSendMessage`, `useOptimisticSendMessage` | **PRESERVE** |
| `client/src/hooks/useAdmin.ts` | Super Admin CRUD for users, orgs, partner links, roles, locations | `useAdminUsers`, `useAdminUser`, `useCreateUser`, `useUpdateUser`, `useDeactivateUser`, `useAdminOrganizations`, `useCreateOrganization`, `useUpdateOrganization`, `useDeactivateOrganization`, `useAdminPartnerLinks`, `useCreatePartnerLink`, `useDeletePartnerLink`, `useAdminRoles`, `useAdminLocations` | **PRESERVE** |
| `client/src/hooks/useEmail.ts` | Email CRUD (folders, messages, send, sync, integration connect/disconnect) | `useEmailFolders`, `useEmails`, `useEmail`, `useMarkAsRead`, `useToggleStar`, `useSendEmail`, `useSyncEmail`, `useEmailIntegration`, `useEmailPresets`, `useTestEmailConnection`, `useConnectEmail`, `useDisconnectEmail`, `useUpdateEmailConfig` | **PRESERVE** |
| `client/src/hooks/useAppointments.ts` | Appointment CRUD, calendar events, stats, reschedule | `useAppointments`, `useCalendarAppointments`, `useAppointment`, `useAppointmentStats`, `useCreateAppointment`, `useUpdateAppointment`, `useCancelAppointment`, `useDeleteAppointment`, `useRescheduleAppointment` | **PRESERVE** |
| `client/src/hooks/useTasks.ts` | Task/calendar CRUD, stats | `useTasks`, `useTask`, `useTaskStats`, `useCalendarEvents`, `useCreateTask`, `useUpdateTask`, `useUpdateTaskStatus`, `useDeleteTask`, `useCreateCalendarEvent` | **PRESERVE** |
| `client/src/hooks/useNotifications.ts` | Notification list, unread count (polling), settings CRUD, event types | `useNotifications`, `useUnreadNotificationCount`, `useNotificationStats`, `useNotificationSettings`, `useNotificationEventTypes`, `useMarkNotificationRead`, `useMarkAllNotificationsRead`, `useUpdateNotificationSetting`, `useBulkUpdateNotificationSettings` | **PRESERVE** |
| `client/src/hooks/useCredits.ts` | Credit balance, usage reports, policies, recent usage, summary | `useCreditBalance`, `useCreditUsage`, `useCreditPolicies`, `useRecentUsage`, `useCreditSummary` | **PRESERVE** |
| `client/src/hooks/useInbox.ts` | Staff messaging inbox: conversations, messages, assign, status, unread count | `useInboxConversations`, `useInboxConversation`, `useInboxMessages`, `useInboxUnreadCount`, `useSendInboxMessage`, `useAssignConversation`, `useUpdateConversationStatus`, `useMarkConversationRead` | **PRESERVE** |
| `client/src/hooks/useGoals.ts` | Goals CRUD, summary, progress updates | `useGoals`, `useGoal`, `useGoalsSummary`, `useCreateGoal`, `useUpdateGoal`, `useDeleteGoal`, `useUpdateGoalProgress` | **PRESERVE** |
| `client/src/hooks/useReports.ts` | Report catalog, preview metrics, full report generation | `useReportCatalog`, `useReportPreview`, `useGenerateReport` | **PRESERVE** |
| `client/src/hooks/useGoogleCalendar.ts` | Google Calendar OAuth status, connect/disconnect, sync, push appointment | `useCalendarStatus`, `useConnectCalendar`, `useDisconnectCalendar`, `useSyncCalendar`, `usePushToCalendar`, `useToggleCalendarSync` | **PRESERVE** |
| `client/src/hooks/useDrive.ts` | File/folder CRUD (list, create folder, upload, delete, rename) | `useDriveItems`, `useCreateFolder`, `useUploadFile`, `useDeleteFile`, `useDeleteFolder`, `useRenameItem` | **PRESERVE** |
| `client/src/hooks/useHunches.ts` | AI-generated hunches list, stats, review feedback | `useHunches`, `useHunchStats`, `useReviewHunch` | **PRESERVE** |
| `client/src/hooks/useApprovals.ts` | Approval requests list, stats, create, resolve | `useApprovals`, `useApprovalStats`, `useCreateApproval`, `useResolveApproval` | **PRESERVE** |
| `client/src/hooks/useActivity.ts` | AI usage events, stats, recent activity, artifacts | `useActivityEvents`, `useActivityStats`, `useRecentActivity`, `useArtifacts`, `useArtifactsByConversation` | **PRESERVE** |
| `client/src/hooks/useMetrics.ts` | Certified metrics registry with role-based filtering | `useMetricsRegistry` | **PRESERVE** |
| `client/src/hooks/useTracking.ts` | UTM attribution, conversion funnel, top pages, traffic sources | `useAttribution`, `useConversionFunnel`, `useTopPages`, `useTrafficSources` | **PRESERVE** |
| `client/src/hooks/useDealerPulse.ts` | Dealer Pulse snapshot (pipeline, team, action items, neglected leads) | `useDealerPulse`, `useRefreshDealerPulse` | **PRESERVE** |
| `client/src/hooks/useProfile.ts` | User profile update, settings update mutations | `useUpdateProfile`, `useUpdateSettings` | **PRESERVE** |
| `client/src/hooks/useDealerBrainConfig.ts` | DealerBrain/Automa config CRUD (Super Admin only) | `useDealerBrainConfig`, `useUpdateDealerBrainConfig`, `useResetDealerBrainConfig` | **PRESERVE** |

### 3b. UI-Adjacent Hooks (REFERENCE)

| File | What It Does | Verdict |
|------|-------------|---------|
| `client/src/hooks/useFirstLogin.ts` | Manages welcome modal state via localStorage/sessionStorage (`nexxus_welcome_shown`, `nexxus_hide_welcome`). No API calls. | **REFERENCE** |
| `client/src/hooks/use-toast.ts` | Toast notification state manager (shadcn/ui pattern). No API calls. | **REPLACEABLE** |
| `client/src/hooks/use-mobile.tsx` | Responsive breakpoint hook (`useIsMobile`, breakpoint at 768px). No API calls. | **REPLACEABLE** |

---

## 4. SSE Streaming

| File | What It Does | Verdict |
|------|-------------|---------|
| `client/src/hooks/useStreamingMessage.ts` | SSE streaming for DealerBrain chat. Opens fetch-based SSE to `POST /api/conversations/{id}/stream`. Handles event types: `thinking`, `tool_start`, `tool_end`, `token`, `done`, `error`. Manages abort controller for cancellation. | **PRESERVE** |
| `client/src/components/chat/StreamingMessage.tsx` | Renders the streaming state (tool cards, progressive text, charts). Exports `StreamingState` type used by the hook. | **REFERENCE** |

### SSE Protocol Details
- Endpoint: `POST /api/conversations/{conversationId}/stream`
- Auth: `Authorization: Bearer {token}` header
- Body: `{ content: string }`
- Response: Server-Sent Events with `data: {JSON}` lines
- Event types:
  - `thinking` -- `{ type, message }`
  - `tool_start` -- `{ type, toolName, toolDescription }`
  - `tool_end` -- `{ type, toolName, success, summary, chartData? }`
  - `token` -- `{ type, content }`
  - `done` -- `{ type, tokensUsed: { input, output }, toolCalls? }`
  - `error` -- `{ type, message }`

---

## 5. Auth Token Management

All auth token logic lives in **one file**: `client/src/contexts/AuthContext.tsx` (see Section 2 above).

Summary of token lifecycle:
1. Login stores `nexxus_access_token`, `nexxus_refresh_token`, `nexxus_token_expiry` in localStorage
2. `api.ts` reads `nexxus_access_token` for every request
3. AuthContext auto-refreshes when within 5 minutes of expiry (checked every 60s)
4. Logout clears all 4 localStorage keys (`nexxus_accessible_orgs` too)
5. Token failure (401) triggers redirect to `/login` via ProtectedRoute

**No separate token service file exists.** Token management is embedded in AuthContext.

---

## 6. Organization Switching

Organization switching is handled in `client/src/contexts/AuthContext.tsx`:

- `switchOrganization(organizationId)` calls `POST /api/auth/switch-org`
- Returns new tokens scoped to the target org
- Updates `user.organization` in state
- `accessibleOrganizations` array (for Partner Admins) stored in both state and localStorage
- `AppContext.tsx` derives `currentOrganization` from AuthContext's user

**No separate org-switching file exists.** It is embedded in AuthContext.

---

## 7. Data Transformation Utilities

Each hook file contains inline utility functions for formatting/display. These are co-located with the data they transform:

| Hook File | Utility Functions |
|-----------|------------------|
| `useInsights.ts` | `formatDuration(seconds)`, `formatRelativeTime(dateString)` |
| `useActivity.ts` | `getActionTypeLabel`, `getActionTypeColor`, `formatTokenCount`, `formatActivityTime`, `buildEventDescription` |
| `useCredits.ts` | `formatCurrency`, `formatPercentage`, `getServiceDisplayName`, `getServiceColor` |
| `useAgents.ts` | `getAgentStatusVariant`, `getAgentStatusColor`, `getChannelDisplayName`, `availableSkills`, `defaultTriggers` |
| `useTasks.ts` | `getPriorityLabel`, `getPriorityColor`, `getStatusLabel`, `getStatusColor` |
| `useNotifications.ts` | `getNotificationIcon`, `getNotificationColor`, `getPriorityVariant`, `formatNotificationTime`, `getEventTypeLabel` |
| `useInbox.ts` | `getChannelLabel`, `getStatusLabel`, `getStatusColor`, `getCustomerDisplayName`, `formatInboxTime` |
| `useGoals.ts` | `getGoalStatusLabel`, `getGoalStatusColor`, `getGoalTypeLabel`, `getGoalPeriodLabel`, `getGoalProgress` |
| `useTracking.ts` | `formatFunnelStep`, `extractDomain`, `truncateUrl` |
| `useAdmin.ts` | `getRoleLevelLabel`, `getStatusBadgeVariant` |
| `useMetrics.ts` | `CATEGORY_LABELS`, `CATEGORY_ORDER`, `DATA_SOURCE_LABELS` |

**Verdict:** All PRESERVE (bundled with their hooks). During rebuild, new UI components should import these from the hook files directly.

Additionally:

| File | What It Does | Verdict |
|------|-------------|---------|
| `client/src/lib/utils.ts` | Tailwind `cn()` merge utility (`clsx` + `twMerge`). | **REPLACEABLE** (standard shadcn pattern, trivially regenerated) |

---

## 8. Type Definitions

**There is no standalone type definition file for API response shapes.** All types are co-located inside their respective hook files (see Section 3). This is by design -- each hook defines its own request/response types.

Key type export locations:

| Type | Defined In |
|------|-----------|
| `User`, `AccessibleOrganization` | `contexts/AuthContext.tsx` |
| `AppUser`, `UserRole`, `AppOrganization`, `FavoriteItem` | `contexts/AppContext.tsx` |
| `Lead`, `LeadStats` | `hooks/useLeads.ts` |
| `Agent`, `AgentConfig`, `AgentChannel`, `AgentStatus` | `hooks/useAgents.ts` |
| `VoiceInsightData`, `VideoInsightData`, `LeadInsightData`, `DashboardData` | `hooks/useInsights.ts` |
| `Conversation`, `ChatMessage` | `hooks/useConversations.ts` |
| `Appointment`, `CalendarEvent`, `AppointmentStats` | `hooks/useAppointments.ts` |
| `Task`, `CalendarEvent`, `TaskStats` | `hooks/useTasks.ts` |
| `Notification`, `NotificationSetting` | `hooks/useNotifications.ts` |
| `CreditBalance`, `UsageReport`, `CreditSummary` | `hooks/useCredits.ts` |
| `InboxConversation`, `InboxMessage` | `hooks/useInbox.ts` |
| `Goal`, `GoalsSummary` | `hooks/useGoals.ts` |
| `DealerPulseSnapshot` | `hooks/useDealerPulse.ts` |
| `AdminUser`, `AdminOrganization`, `PartnerLink`, `Role`, `Location` | `hooks/useAdmin.ts` |
| `CachedEmail`, `EmailIntegration`, `SendEmailInput` | `hooks/useEmail.ts` |
| `ReportDefinition`, `ReportResult` | `hooks/useReports.ts` |
| `CertifiedMetric`, `MetricsRegistryResponse` | `hooks/useMetrics.ts` |
| `Hunch`, `HunchStats` | `hooks/useHunches.ts` |
| `ApprovalRequest`, `ApprovalStats` | `hooks/useApprovals.ts` |
| `DriveItem`, `StorageUsage` | `hooks/useDrive.ts` |
| `CalendarConnectionStatus` | `hooks/useGoogleCalendar.ts` |
| `AttributionRow`, `FunnelStep`, `TopPage`, `TrafficSource` | `hooks/useTracking.ts` |
| `AIUsageEvent`, `EventStats` | `hooks/useActivity.ts` |
| `StreamingState` | `components/chat/StreamingMessage.tsx` |
| `ChartData`, `StreamEvent` | `hooks/useStreamingMessage.ts` |

Shared schema file:

| File | What It Does | Verdict |
|------|-------------|---------|
| `shared/schema.ts` | Drizzle ORM schema for `users` table + Zod validation. **Not imported by client code.** | **PRESERVE** (backend dependency, but not client plumbing) |

---

## 9. Build Configuration & Environment

| File | What It Does | Verdict |
|------|-------------|---------|
| `vite.config.ts` | Vite build config. Path aliases (`@` -> `client/src`, `@shared` -> `shared`, `@assets` -> `attached_assets`). Root is `client/`, output to `dist/public`. | **PRESERVE** |
| `client/index.html` | HTML entry point. Loads Google Fonts, sets viewport, mounts `#root`, loads `/src/main.tsx`. | **REFERENCE** |
| `client/src/main.tsx` | React entry point. Renders `<App />` into `#root`. | **PRESERVE** |
| `client/src/App.tsx` | Provider tree assembly + route definitions (wouter `Switch`/`Route`). Defines public vs protected routes. | **REFERENCE** |

### Path Alias Map (from vite.config.ts)
```
@ -> client/src/
@shared -> shared/
@assets -> attached_assets/
```

### Environment Variables
**No `VITE_` environment variables are used anywhere in `client/src/`.** All API calls use relative URLs (e.g., `/api/auth/login`), which are proxied by the same-origin server. The frontend has zero env var dependencies.

---

## 10. WebSocket / Real-Time Connections

**None.** There are no WebSocket connections in the client. Real-time features use:
- **SSE (Server-Sent Events)** for DealerBrain streaming (`useStreamingMessage.ts`)
- **Polling** for notifications (30s), inbox messages (15s), activity (60s), insights (60s)

---

## 11. Auth Gate / Route Protection

| File | What It Does | Verdict |
|------|-------------|---------|
| `client/src/components/auth/ProtectedRoute.tsx` | Wraps protected routes. Shows loading spinner while auth initializes, redirects to `/login` if not authenticated. | **REFERENCE** |

---

## 12. Mock Data Files

These contain static mock data used during development. They are NOT integration plumbing but are listed for awareness.

| File | What It Contains | Verdict |
|------|-----------------|---------|
| `client/src/mocks/insights.ts` | Mock insight card data | **REPLACEABLE** |
| `client/src/mocks/activity.ts` | Mock activity feed data | **REPLACEABLE** |
| `client/src/mocks/users.ts` | Mock user data | **REPLACEABLE** |
| `client/src/mocks/messages.ts` | Mock chat messages | **REPLACEABLE** |
| `client/src/mocks/files.ts` | Mock drive file data | **REPLACEABLE** |
| `client/src/mocks/index.ts` | Mock data barrel export | **REPLACEABLE** |
| `client/src/mocks/agents.ts` | Mock agent data | **REPLACEABLE** |
| `client/src/mocks/tasks.ts` | Mock task data | **REPLACEABLE** |
| `client/src/mocks/notifications.ts` | Mock notification data | **REPLACEABLE** |

---

## Summary: PRESERVE Count

| Category | PRESERVE | REFERENCE | REPLACEABLE |
|----------|----------|-----------|-------------|
| API Client Layer | 2 | 0 | 0 |
| Context Providers | 1 | 3 | 0 |
| TanStack Query Hooks | 25 | 0 | 0 |
| SSE Streaming | 1 | 1 | 0 |
| Build / Entry | 2 | 2 | 0 |
| Auth Gate | 0 | 1 | 0 |
| UI Utility Hooks | 0 | 1 | 2 |
| Shared Schema | 1 | 0 | 0 |
| Mocks | 0 | 0 | 9 |
| **Total** | **32** | **8** | **11** |

---

## Rebuild Checklist

Before removing any file not in this manifest, verify:

1. The new UI framework imports from the PRESERVE files (not copies of them)
2. The provider tree order is maintained: `QueryClientProvider > ThemeProvider > AuthProvider > AppProvider > ChatProvider`
3. All 25 hook files are accessible from the new component tree
4. The `@` path alias is preserved in the new Vite config
5. `useStreamingMessage.ts` continues to import `StreamingState` from wherever the streaming display component lives (currently `components/chat/StreamingMessage.tsx`)
6. The `nexxus_access_token` localStorage key is referenced consistently in both `api.ts` and `AuthContext.tsx`
7. `useAdmin.ts` uses its own `fetchWithAuth` (not `api.ts` exports) -- this is intentional, both patterns coexist

---

## API Endpoint Reference

Every backend endpoint called by the frontend, extracted from the hook files:

### Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `PUT /api/auth/me`
- `POST /api/auth/switch-org`
- `POST /api/auth/register`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### Admin
- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `PUT /api/admin/users/:id`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/organizations`
- `POST /api/admin/organizations`
- `PUT /api/admin/organizations/:id`
- `DELETE /api/admin/organizations/:id`
- `GET /api/admin/partner-links`
- `POST /api/admin/partner-links`
- `DELETE /api/admin/partner-links/:id`
- `GET /api/admin/roles`
- `GET /api/admin/locations`

### Agents
- `GET /api/agents`
- `GET /api/agents/:id`
- `POST /api/agents`
- `PUT /api/agents/:id`
- `PUT /api/agents/:id/status`
- `DELETE /api/agents/:id`
- `POST /api/agents/:id/duplicate`
- `GET /api/agents/stats`

### Conversations (DealerBrain Chat)
- `GET /api/conversations`
- `GET /api/conversations/:id`
- `POST /api/conversations`
- `PUT /api/conversations/:id`
- `DELETE /api/conversations/:id`
- `GET /api/conversations/:id/messages`
- `POST /api/conversations/:id/messages`
- `POST /api/conversations/:id/stream` (SSE)
- `GET /api/conversations/suggestions`

### Insights
- `GET /api/insights/dashboard`
- `GET /api/insights/voice-calls`
- `GET /api/insights/voice-calls/chart`
- `GET /api/insights/video-sessions`
- `GET /api/insights/video-sessions/chart`
- `GET /api/insights/leads`
- `GET /api/insights/leads/chart`
- `GET /api/insights/leads/:id`
- `PUT /api/insights/leads/:id/status`
- `POST /api/insights/leads/:id/assign`
- `GET /api/insights/leads/aging`
- `GET /api/insights/dealer-pulse`
- `POST /api/insights/dealer-pulse/refresh`

### Leads
- `GET /api/leads`
- `GET /api/leads/stats`
- `PUT /api/leads/:id/status`
- `PATCH /api/leads/:id/mark-contacted`

### Metrics
- `GET /api/metrics/registry`

### Tasks
- `GET /api/tasks`
- `GET /api/tasks/:id`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `PUT /api/tasks/:id/status`
- `DELETE /api/tasks/:id`
- `GET /api/tasks/stats`
- `GET /api/tasks/calendar`
- `POST /api/tasks/calendar`

### Appointments
- `GET /api/appointments`
- `GET /api/appointments/:id`
- `POST /api/appointments`
- `PUT /api/appointments/:id`
- `POST /api/appointments/:id/cancel`
- `DELETE /api/appointments/:id`
- `GET /api/appointments/calendar`
- `GET /api/appointments/stats`

### Email
- `GET /api/email/folders`
- `GET /api/email/messages`
- `GET /api/email/messages/:id`
- `POST /api/email/messages/:id/read`
- `POST /api/email/messages/:id/star`
- `POST /api/email/send`
- `POST /api/email/sync`
- `GET /api/user/integrations/email`
- `POST /api/user/integrations/email`
- `PUT /api/user/integrations/email`
- `DELETE /api/user/integrations/:id`
- `POST /api/user/integrations/email/test`
- `GET /api/user/integrations/email/presets`

### Notifications
- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `GET /api/notifications/stats`
- `GET /api/notifications/settings`
- `PUT /api/notifications/settings`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`
- `GET /api/notifications/event-types`

### Credits
- `GET /api/credits/balance`
- `GET /api/credits/usage`
- `GET /api/credits/policies`
- `GET /api/credits/recent`
- `GET /api/credits/summary`

### Inbox (Staff Messaging)
- `GET /api/inbox`
- `GET /api/inbox/:id`
- `GET /api/inbox/:id/messages`
- `POST /api/inbox/:id/messages`
- `PUT /api/inbox/:id/assign`
- `PUT /api/inbox/:id/status`
- `PUT /api/inbox/:id/read`
- `GET /api/inbox/unread`

### Goals
- `GET /api/goals`
- `GET /api/goals/:id`
- `POST /api/goals`
- `PUT /api/goals/:id`
- `DELETE /api/goals/:id`
- `PUT /api/goals/:id/progress`
- `GET /api/goals/summary`

### Reports
- `GET /api/reports/catalog`
- `GET /api/reports/:id/preview`
- `POST /api/reports/:id/generate`

### Google Calendar
- `GET /api/user/calendar/status`
- `GET /api/oauth/google/authorize`
- `DELETE /api/user/calendar/disconnect`
- `POST /api/user/calendar/sync`
- `POST /api/user/calendar/push/:appointmentId`
- `PUT /api/user/calendar/sync-toggle`

### Drive
- `GET /api/drive`
- `POST /api/drive/folders`
- `POST /api/drive/upload`
- `DELETE /api/drive/files/:id`
- `DELETE /api/drive/folders/:id`
- `PUT /api/drive/{files|folders}/:id/rename`

### Hunches
- `GET /api/hunches`
- `GET /api/hunches/stats`
- `PUT /api/hunches/:id/review`

### Approvals
- `GET /api/approvals`
- `GET /api/approvals/stats`
- `POST /api/approvals`
- `PUT /api/approvals/:id/resolve`

### Activity (AI Governance)
- `GET /api/activity`
- `GET /api/activity/stats`
- `GET /api/activity/recent`
- `GET /api/activity/artifacts`
- `GET /api/activity/artifacts/:conversationId`

### Tracking
- `GET /api/tracking/attribution`
- `GET /api/tracking/funnel`
- `GET /api/tracking/pages`
- `GET /api/tracking/sources`

### DealerBrain Config
- `GET /api/dealerbrain/config`
- `PUT /api/dealerbrain/config`
- `POST /api/dealerbrain/config/reset`
