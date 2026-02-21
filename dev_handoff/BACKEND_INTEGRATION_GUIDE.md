# Nexxus V2 — Backend Integration Guide

> Master handoff document for wiring the frontend UI prototype to a real backend.
> All data is currently mocked client-side. This guide maps every mock data source to the API endpoint, database table, and frontend hook needed for production.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema Plan](#2-database-schema-plan)
3. [API Endpoint Registry](#3-api-endpoint-registry)
4. [Page-by-Page Integration Map](#4-page-by-page-integration-map)
5. [Context Provider Rewiring](#5-context-provider-rewiring)
6. [Layout Component Integration](#6-layout-component-integration)
7. [Mock Data → API Migration Checklist](#7-mock-data--api-migration-checklist)
8. [Authentication & RBAC](#8-authentication--rbac)
9. [Real-Time Features](#9-real-time-features)
10. [File Uploads & Storage](#10-file-uploads--storage)
11. [AI/Chat Integration](#11-aichat-integration)
12. [Migration Sequence](#12-migration-sequence)

---

## 1. Architecture Overview

### Current State (Prototype)
```
Frontend (React/Vite)
  └── client/src/mocks/*.ts  ← All data lives here
  └── client/src/contexts/AppContext.tsx  ← In-memory state, initialized from mocks
  └── Pages consume mocks directly OR read from AppContext

Backend (Express) — nearly empty
  └── server/routes.ts  ← No routes defined
  └── server/storage.ts  ← Only basic User CRUD interface
  └── shared/schema.ts  ← Only a placeholder users table
```

### Target State (Production)
```
Frontend (React/Vite)
  └── TanStack Query hooks  ← Fetch from /api/* endpoints
  └── AppContext  ← Hydrated from API on mount, synced via query invalidation
  └── Pages consume query hooks, no mock imports

Backend (Express + Drizzle ORM + PostgreSQL)
  └── server/routes.ts  ← Full REST API
  └── server/storage.ts  ← Drizzle-backed CRUD for all entities
  └── shared/schema.ts  ← Complete database schema
```

### Key Libraries Already Installed
- **TanStack Query v5** — configured with default fetcher in `client/src/lib/queryClient.ts`
- **Drizzle ORM** — configured in `drizzle.config.ts`, ready for PostgreSQL
- **Zod** + **drizzle-zod** — schema validation
- **React Hook Form** — form handling
- **Express 5** — backend framework
- **connect-pg-simple** — session store (not yet wired)

---

## 2. Database Schema Plan

All types below are derived from the existing mock data interfaces in `client/src/mocks/*.ts`. Expand `shared/schema.ts` with these tables.

### 2.1 Core Tables

#### `organizations`
| Column | Type | Notes |
|--------|------|-------|
| id | varchar PK | UUID |
| name | text | Required |
| logo | text | URL, nullable |
| primary_color | text | Hex color |
| secondary_color | text | Hex color |
| created_at | timestamp | Default now() |

**Source mock:** `client/src/mocks/users.ts` → `Organization` interface

#### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | varchar PK | UUID |
| name | text | Display name |
| email | text | Unique |
| password | text | Hashed |
| role | text | `super_admin`, `partner_admin`, `org_admin`, `org_staff` |
| avatar | text | URL, nullable |
| organization_id | varchar FK | → organizations.id |
| created_at | timestamp | Default now() |

**Source mock:** `client/src/mocks/users.ts` → `User` interface

#### `agents`
| Column | Type | Notes |
|--------|------|-------|
| id | varchar PK | UUID |
| name | text | Required |
| description | text | |
| status | text | `active`, `inactive`, `draft` |
| channel | text | `voice`, `chat`, `video`, `email` |
| avatar | text | URL, nullable |
| instructions | text | System prompt |
| triggers | jsonb | Array of `{type, enabled, config}` |
| tools | jsonb | Array of `{id, name, description, enabled}` |
| organization_id | varchar FK | → organizations.id |
| created_by | varchar FK | → users.id |
| created_at | timestamp | |
| updated_at | timestamp | |

**Source mock:** `client/src/mocks/agents.ts` → `Agent` interface

#### `notifications`
| Column | Type | Notes |
|--------|------|-------|
| id | varchar PK | UUID |
| type | text | `alert`, `task`, `approval`, `system`, `mention` |
| title | text | |
| message | text | |
| user_id | varchar FK | → users.id |
| read | boolean | Default false |
| action_url | text | Nullable |
| created_at | timestamp | |

**Source mock:** `client/src/mocks/notifications.ts` → `Notification` interface

### 2.2 Chat & Messaging Tables

#### `conversations`
| Column | Type | Notes |
|--------|------|-------|
| id | varchar PK | UUID |
| title | text | |
| user_id | varchar FK | → users.id |
| agent_id | varchar FK | Nullable, → agents.id |
| type | text | `main_chat`, `agent_chat`, `right_pane` |
| created_at | timestamp | |
| updated_at | timestamp | |

#### `messages`
| Column | Type | Notes |
|--------|------|-------|
| id | varchar PK | UUID |
| conversation_id | varchar FK | → conversations.id |
| role | text | `user`, `assistant` |
| content | text | |
| created_at | timestamp | |

**Source mock:** `client/src/mocks/messages.ts` → `ChatMessage`, `Conversation` interfaces

### 2.3 Drive Tables

#### `files`
| Column | Type | Notes |
|--------|------|-------|
| id | varchar PK | UUID |
| name | text | |
| type | text | `folder`, `document`, `spreadsheet`, `image`, `pdf`, `video`, `audio` |
| size | integer | Bytes, nullable for folders |
| parent_id | varchar FK | Nullable, self-reference → files.id |
| owner_id | varchar FK | → users.id |
| organization_id | varchar FK | → organizations.id |
| starred | boolean | Default false |
| shared | boolean | Default false |
| storage_url | text | Object storage path, nullable for folders |
| created_at | timestamp | |
| updated_at | timestamp | |

**Source mock:** `client/src/mocks/files.ts` → `DriveFile` interface

### 2.4 Hub Tables

#### `calendar_events`
| Column | Type | Notes |
|--------|------|-------|
| id | varchar PK | UUID |
| title | text | |
| description | text | Nullable |
| type | text | `meeting`, `call`, `delivery`, `service`, `training`, `personal` |
| start_time | timestamp | |
| end_time | timestamp | |
| attendees | text[] | Array of names |
| user_id | varchar FK | → users.id |
| organization_id | varchar FK | → organizations.id |
| created_at | timestamp | |

**Source mock:** `client/src/mocks/tasks.ts` → `CalendarEvent` interface

#### `leads`
| Column | Type | Notes |
|--------|------|-------|
| id | varchar PK | UUID |
| name | text | |
| email | text | |
| phone | text | |
| status | text | `hot`, `warm`, `cold`, `new`, `contacted`, `qualified` |
| interested_in | text | Vehicle/product interest |
| source | text | Lead source |
| assigned_to | varchar FK | → users.id |
| organization_id | varchar FK | → organizations.id |
| last_contact | timestamp | Nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Source mock:** `client/src/mocks/tasks.ts` → `Lead` interface

#### `inbox_messages`
| Column | Type | Notes |
|--------|------|-------|
| id | varchar PK | UUID |
| type | text | `email`, `sms`, `voicemail` |
| from_name | text | |
| subject | text | |
| preview | text | |
| read | boolean | Default false |
| user_id | varchar FK | → users.id |
| organization_id | varchar FK | → organizations.id |
| created_at | timestamp | |

**Source mock:** `client/src/mocks/tasks.ts` → `InboxMessage` interface

### 2.5 Analytics & Activity Tables

#### `activity_feed`
| Column | Type | Notes |
|--------|------|-------|
| id | varchar PK | UUID |
| type | text | `user`, `agent`, `system` |
| description | text | |
| actor | text | Name of actor |
| target | text | Target entity |
| metadata | jsonb | Extra context, nullable |
| organization_id | varchar FK | → organizations.id |
| created_at | timestamp | |

**Source mock:** `client/src/mocks/activity.ts` → `ActivityItem` interface

#### `hunches`
| Column | Type | Notes |
|--------|------|-------|
| id | varchar PK | UUID |
| title | text | |
| description | text | |
| type | text | `opportunity`, `threat`, `insight` |
| confidence | integer | 0-100 |
| source | text | AI engine source |
| status | text | `new`, `acknowledged`, `actioned`, `dismissed` |
| organization_id | varchar FK | → organizations.id |
| created_at | timestamp | |

**Source mock:** `client/src/mocks/tasks.ts` → `Hunch` interface

#### `metrics` (key-value analytics store)
| Column | Type | Notes |
|--------|------|-------|
| id | varchar PK | UUID |
| key | text | Metric identifier |
| value | text | Current value |
| previous_value | text | Nullable |
| change | text | e.g., "+12%" |
| trend | text | `up`, `down`, `neutral` |
| category | text | `pipeline`, `conversion`, etc. |
| organization_id | varchar FK | → organizations.id |
| recorded_at | timestamp | |

### 2.6 Additional Hub & Analytics Tables

#### `approvals`
| Column | Type | Notes |
|--------|------|-------|
| id | varchar PK | UUID |
| title | text | |
| description | text | |
| requested_by | varchar FK | → users.id |
| type | text | `agent`, `document`, `expense`, `access` |
| status | text | `pending`, `approved`, `rejected` |
| reviewed_by | varchar FK | Nullable, → users.id |
| organization_id | varchar FK | → organizations.id |
| created_at | timestamp | |
| updated_at | timestamp | |

**Source mock:** `client/src/mocks/tasks.ts` → `Approval` interface
**Note:** The V3 redesign removed the Approvals tab from Hub. This table is included for future use when approvals are re-enabled.

#### `goals`
| Column | Type | Notes |
|--------|------|-------|
| id | varchar PK | UUID |
| title | text | |
| description | text | |
| target | integer | Goal target value |
| current | integer | Current progress |
| unit | text | e.g., "units", "deals", "$" |
| due_date | timestamp | |
| status | text | `on_track`, `at_risk`, `behind`, `completed` |
| organization_id | varchar FK | → organizations.id |
| created_at | timestamp | |

**Source mock:** `client/src/mocks/insights.ts` → `Goal` interface
**Note:** Goals are defined in mock data but not currently rendered in any page. This table supports future Insights dashboard features.

#### `tasks`
| Column | Type | Notes |
|--------|------|-------|
| id | varchar PK | UUID |
| title | text | |
| description | text | |
| status | text | `todo`, `in_progress`, `review`, `done` |
| priority | text | `low`, `medium`, `high`, `urgent` |
| assignee_id | varchar FK | → users.id |
| due_date | timestamp | |
| tags | text[] | Array of tag strings |
| organization_id | varchar FK | → organizations.id |
| created_at | timestamp | |

**Source mock:** `client/src/mocks/tasks.ts` → `Task` interface
**Note:** Tasks are defined in mock data but the Tasks tab was removed from Hub in V3 redesign. Included for future use.

### 2.7 Favorites & Preferences

#### `favorites`
| Column | Type | Notes |
|--------|------|-------|
| id | varchar PK | UUID |
| user_id | varchar FK | → users.id |
| label | text | Display label |
| path | text | Route path |
| created_at | timestamp | |

---

## 3. API Endpoint Registry

All endpoints are prefixed with `/api`. Use RESTful conventions.

### 3.1 Auth
| Method | Path | Body/Params | Response | Notes |
|--------|------|-------------|----------|-------|
| POST | `/api/auth/login` | `{email, password}` | `{user, token}` | Creates session |
| POST | `/api/auth/logout` | — | `{ok}` | Destroys session |
| GET | `/api/auth/me` | — | `User` | Current user + role + org |

### 3.2 Organizations
| Method | Path | Response | Notes |
|--------|------|----------|-------|
| GET | `/api/organizations` | `Organization[]` | User's accessible orgs |
| GET | `/api/organizations/:id` | `Organization` | |
| PUT | `/api/organizations/:id` | `Organization` | Admin only |

### 3.3 Users
| Method | Path | Response | Notes |
|--------|------|----------|-------|
| GET | `/api/users` | `User[]` | Scoped to org, admin only |
| GET | `/api/users/:id` | `User` | |
| POST | `/api/users` | `User` | Create user, admin only |
| PUT | `/api/users/:id` | `User` | Update profile |
| DELETE | `/api/users/:id` | `{ok}` | Admin only |

### 3.4 Agents
| Method | Path | Response | Notes |
|--------|------|----------|-------|
| GET | `/api/agents` | `Agent[]` | Scoped to org |
| GET | `/api/agents/:id` | `Agent` | |
| POST | `/api/agents` | `Agent` | Create agent |
| PUT | `/api/agents/:id` | `Agent` | Update config/status/instructions |
| DELETE | `/api/agents/:id` | `{ok}` | |
| POST | `/api/agents/:id/chat` | `{message}` | Send message to agent (AI) |

### 3.5 Notifications
| Method | Path | Response | Notes |
|--------|------|----------|-------|
| GET | `/api/notifications` | `Notification[]` | Current user's notifications |
| PUT | `/api/notifications/:id/read` | `{ok}` | Mark read |
| PUT | `/api/notifications/read-all` | `{ok}` | Mark all read |

### 3.6 Chat / Conversations
| Method | Path | Response | Notes |
|--------|------|----------|-------|
| GET | `/api/conversations` | `Conversation[]` | User's conversations |
| GET | `/api/conversations/:id/messages` | `Message[]` | Paginated |
| POST | `/api/conversations` | `Conversation` | Start new conversation |
| POST | `/api/conversations/:id/messages` | `Message` | Send message (triggers AI response) |

### 3.7 Drive / Files
| Method | Path | Response | Notes |
|--------|------|----------|-------|
| GET | `/api/files` | `File[]` | `?parentId=` for folder navigation |
| GET | `/api/files/:id` | `File` | |
| POST | `/api/files` | `File` | Upload (multipart) or create folder |
| PUT | `/api/files/:id` | `File` | Rename, star, move |
| DELETE | `/api/files/:id` | `{ok}` | |
| POST | `/api/files/:id/share` | `{shareUrl}` | Share via email/SMS |

### 3.8 Calendar Events
| Method | Path | Response | Notes |
|--------|------|----------|-------|
| GET | `/api/calendar` | `CalendarEvent[]` | `?date=YYYY-MM-DD` |
| POST | `/api/calendar` | `CalendarEvent` | Create event |
| PUT | `/api/calendar/:id` | `CalendarEvent` | |
| DELETE | `/api/calendar/:id` | `{ok}` | |

### 3.9 Leads
| Method | Path | Response | Notes |
|--------|------|----------|-------|
| GET | `/api/leads` | `Lead[]` | `?status=hot&assigned=userId` |
| GET | `/api/leads/:id` | `Lead` | |
| POST | `/api/leads` | `Lead` | |
| PUT | `/api/leads/:id` | `Lead` | |
| DELETE | `/api/leads/:id` | `{ok}` | |

### 3.10 Inbox
| Method | Path | Response | Notes |
|--------|------|----------|-------|
| GET | `/api/inbox` | `InboxMessage[]` | |
| PUT | `/api/inbox/:id/read` | `{ok}` | |
| POST | `/api/inbox/send` | `{ok}` | Send SMS/email |

### 3.11 Activity Feed
| Method | Path | Response | Notes |
|--------|------|----------|-------|
| GET | `/api/activity` | `ActivityItem[]` | `?type=user&search=term` |

### 3.12 Insights / Analytics
| Method | Path | Response | Notes |
|--------|------|----------|-------|
| GET | `/api/metrics` | `Metric[]` | Role-scoped dashboard metrics |
| GET | `/api/metrics/library` | `LibraryMetric[]` | Full metric library |
| GET | `/api/charts/leads` | `ChartDataPoint[]` | Leads chart data |
| GET | `/api/charts/conversions` | `ChartDataPoint[]` | Conversion chart data |
| GET | `/api/pipeline` | `PipelineStage[]` | Pipeline health |
| GET | `/api/hunches` | `Hunch[]` | AI-generated hunches |
| PUT | `/api/hunches/:id` | `Hunch` | Update status |

### 3.13 Approvals (Future)
| Method | Path | Response | Notes |
|--------|------|----------|-------|
| GET | `/api/approvals` | `Approval[]` | `?status=pending` |
| POST | `/api/approvals` | `Approval` | Create approval request |
| PUT | `/api/approvals/:id` | `Approval` | Approve/reject |

*Note: Approvals tab removed from Hub in V3 redesign. Endpoints included for future re-enablement.*

### 3.14 Goals (Future)
| Method | Path | Response | Notes |
|--------|------|----------|-------|
| GET | `/api/goals` | `Goal[]` | |
| POST | `/api/goals` | `Goal` | |
| PUT | `/api/goals/:id` | `Goal` | Update progress |
| DELETE | `/api/goals/:id` | `{ok}` | |

*Note: Goals defined in mock data but not rendered in current UI.*

### 3.15 Favorites
| Method | Path | Response | Notes |
|--------|------|----------|-------|
| GET | `/api/favorites` | `Favorite[]` | |
| POST | `/api/favorites` | `Favorite` | |
| DELETE | `/api/favorites/:id` | `{ok}` | |

### 3.16 Settings
| Method | Path | Response | Notes |
|--------|------|----------|-------|
| GET | `/api/settings` | `Settings` | Org settings object |
| PUT | `/api/settings` | `Settings` | Update settings |
| GET | `/api/settings/tools` | `Tool[]` | Available integrations |
| PUT | `/api/settings/tools/:id` | `{ok}` | Enable/disable tool |

---

## 4. Page-by-Page Integration Map

### 4.1 Main Page (`client/src/pages/main.tsx`)

**Current mock dependencies:**
- `mockChatMessages` from `@/mocks/messages` → initial chat messages
- `agentSuggestions` from `@/mocks/messages` → suggestion bubbles
- `currentRole` from `AppContext` (initialized from localStorage + mock)
- `roleMetrics` — hardcoded in component (lines 44-69)
- `metricDetails` — hardcoded in component (lines 78-121)

**Backend wiring needed:**
| What | Current Source | Replace With |
|------|---------------|--------------|
| Metric tiles | Hardcoded `roleMetrics` object | `GET /api/metrics` with role filter |
| Metric drill-down | Hardcoded `metricDetails` object | `GET /api/metrics/:id/breakdown` |
| Chat messages | `mockChatMessages` (local state) | `GET /api/conversations/:id/messages` |
| Send message | `setTimeout` fake response | `POST /api/conversations/:id/messages` (SSE/WebSocket for streaming) |
| Suggestions | `agentSuggestions` array | `GET /api/suggestions` or keep static |
| Current role | `useApp().currentRole` | `GET /api/auth/me` → user.role |

**TanStack Query hooks to create:**
```ts
useQuery({ queryKey: ['/api/metrics', currentRole] })
useQuery({ queryKey: ['/api/conversations', conversationId, 'messages'] })
useMutation({ mutationFn: sendMessage, onSuccess: invalidate messages })
```

### 4.2 Agents Page (`client/src/pages/agents.tsx`)

**Current mock dependencies:**
- `agents` from `AppContext` (initialized from `mockAgents`)
- `selectedAgent` from `AppContext`
- `availableTools` from `@/mocks/agents`
- `agentActivities` — hardcoded in component (lines 72-78)
- `initialAgentChat` — hardcoded in component (lines 86-88)
- Agent chat — `setTimeout` fake response (line 195-203)

**Backend wiring needed:**
| What | Current Source | Replace With |
|------|---------------|--------------|
| Agent list | `AppContext.agents` | `GET /api/agents` |
| Agent detail | `AppContext.selectedAgent` | `GET /api/agents/:id` |
| Create agent | `AppContext.addAgent()` | `POST /api/agents` |
| Update agent | `AppContext.updateAgent()` | `PUT /api/agents/:id` |
| Toggle status | In-memory update | `PUT /api/agents/:id` `{status}` |
| Agent chat | setTimeout response | `POST /api/agents/:id/chat` |
| Agent activity | Hardcoded array | `GET /api/agents/:id/activity` |
| Available tools | `availableTools` static | `GET /api/settings/tools` |
| Instructions save | In-memory | `PUT /api/agents/:id` `{instructions}` |
| Triggers save | In-memory | `PUT /api/agents/:id` `{triggers}` |
| Tools save | In-memory | `PUT /api/agents/:id` `{tools}` |
| Knowledge sources | Hardcoded array (lines 367-371) | `GET /api/agents/:id/knowledge` |

### 4.3 Agent Create Page (`client/src/pages/agents-create.tsx`)

**Current mock dependencies:**
- `availableTools` from `@/mocks/agents`
- `addAgent` from `AppContext`

**Backend wiring needed:**
| What | Current Source | Replace With |
|------|---------------|--------------|
| Submit form | `AppContext.addAgent()` + setTimeout | `POST /api/agents` mutation |
| Available tools | Static import | `GET /api/settings/tools` |

### 4.4 Insights Page (`client/src/pages/insights.tsx`)

**Current mock dependencies:**
- `mockMetrics` from `@/mocks/insights`
- `mockLeadsChart` from `@/mocks/insights`
- `mockConversionsChart` from `@/mocks/insights`
- `mockAgentPerformance` from `@/mocks/insights`
- `mockHunches` from `@/mocks/tasks`
- `commandCenterAlerts` — hardcoded (lines 43-47)
- `pipelineStages` — hardcoded (lines 49-55)
- `scorecardItems` — hardcoded (lines 57-62)
- `reportSections` — hardcoded (lines 64-88)
- `reportDetailData` — hardcoded (lines 154-179)
- `libraryMetrics` — hardcoded (lines 90-152, 61 items)
- `hunchesData` — hardcoded (lines 181-188)

**Backend wiring needed:**
| What | Current Source | Replace With |
|------|---------------|--------------|
| Command Center | Hardcoded alerts | `GET /api/alerts` |
| Pipeline health | Hardcoded stages | `GET /api/pipeline` |
| Scorecard | Hardcoded items | `GET /api/metrics/scorecard` |
| Charts | Mock chart data | `GET /api/charts/leads`, `GET /api/charts/conversions` |
| Reports list | Hardcoded sections | `GET /api/reports` (metadata) |
| Report detail | Hardcoded `reportDetailData` | `GET /api/reports/:id` |
| Library metrics | Hardcoded 61-item array | `GET /api/metrics/library?category=&search=` |
| Hunches | Hardcoded/mock array | `GET /api/hunches` |
| Hunch actions | Toast only | `PUT /api/hunches/:id` (acknowledge/dismiss) |

### 4.5 Drive Page (`client/src/pages/drive.tsx`)

**Current mock dependencies:**
- `mockFiles` from `@/mocks/files`
- `formatFileSize` from `@/mocks/files`

**Backend wiring needed:**
| What | Current Source | Replace With |
|------|---------------|--------------|
| File listing | `mockFiles.filter(parentId)` | `GET /api/files?parentId=` |
| Folder navigation | Client-side filter | Same endpoint with parentId param |
| File actions | Toast only (no real action) | `PUT /api/files/:id` (star/rename) |
| Delete file | Toast only | `DELETE /api/files/:id` |
| Share file | Toast + copy fake link | `POST /api/files/:id/share` |
| Download | Toast only | `GET /api/files/:id/download` (signed URL) |
| Create folder | Toast "not available" | `POST /api/files` `{type:'folder'}` |
| Upload file | Not implemented | `POST /api/files` (multipart form data) |

### 4.6 Work Center / Hub (`client/src/pages/work-center.tsx`)

**Current mock dependencies:**
- `mockCalendarEvents` from `@/mocks/tasks`
- `mockLeads` from `@/mocks/tasks`
- `mockInboxMessages` from `@/mocks/tasks`
- `getLeadStatusColor` from `@/mocks/tasks`

**Backend wiring needed:**
| What | Current Source | Replace With |
|------|---------------|--------------|
| Calendar events | `mockCalendarEvents` filtered by date | `GET /api/calendar?date=YYYY-MM-DD` |
| Create event | Toast only | `POST /api/calendar` |
| Leads list | `mockLeads` | `GET /api/leads` |
| Lead actions (call/text/schedule) | Toasts/modals only | `POST /api/inbox/send`, `POST /api/calendar` |
| Inbox messages | `mockInboxMessages` | `GET /api/inbox` |
| Unread count | `filter(m => !m.read).length` | Server-side count in response |
| Send message | Toast only | `POST /api/inbox/send` |
| Make call | Toast only | Integration with VoIP/Twilio |

### 4.7 Settings Page (`client/src/pages/settings.tsx`)

**Current mock dependencies:**
- `mockUsers` from `@/mocks/users`
- `availableTools` from `@/mocks/agents`
- `currentRole` from `AppContext`
- `getRoleLabel` from `@/mocks/users`

**Backend wiring needed:**
| What | Current Source | Replace With |
|------|---------------|--------------|
| User list | `mockUsers` | `GET /api/users` |
| Add user | Toast "not available" | `POST /api/users` |
| Edit/delete user | Toast only | `PUT/DELETE /api/users/:id` |
| Tools list | `availableTools` static | `GET /api/settings/tools` |
| Toggle tools | Switch with no persistence | `PUT /api/settings/tools/:id` |
| Section settings | Hardcoded defaults | `GET/PUT /api/settings` |
| Role gating | `currentRole` from context | Verified server-side via session |

### 4.8 Profile Page (`client/src/pages/profile.tsx`)

**Current mock dependencies:**
- `currentUser` from `AppContext` (initialized from `mockCurrentUser`)
- `currentOrganization` from `AppContext`
- `getRoleLabel` from `@/mocks/users`

**Backend wiring needed:**
| What | Current Source | Replace With |
|------|---------------|--------------|
| User profile | `AppContext.currentUser` | `GET /api/auth/me` |
| Edit profile | Toast "not available" | `PUT /api/users/:id` |
| Save contact | Toast only | `PUT /api/users/:id` |
| Preferences | Switches with no persistence | `PUT /api/users/:id/preferences` |
| Billing info | Hardcoded data | Stripe integration `GET /api/billing` |
| Plan details | Hardcoded "Pro Plan" | `GET /api/billing/plan` |

### 4.9 Activity Page (`client/src/pages/activity.tsx`)

**Current mock dependencies:**
- `mockActivityFeed` from `@/mocks/activity`
- `getActivityColor` from `@/mocks/activity`

**Backend wiring needed:**
| What | Current Source | Replace With |
|------|---------------|--------------|
| Activity list | `mockActivityFeed` filtered client-side | `GET /api/activity?type=&search=` |
| Filter/search | Client-side filter | Server-side query params |

---

## 5. Context Provider Rewiring

### 5.1 AppContext (`client/src/contexts/AppContext.tsx`)

**Current state:** All state initialized from mock imports. In-memory only. Changes are lost on refresh.

**Mock imports to remove:**
```ts
// REMOVE these imports after backend integration:
import { mockCurrentUser, mockOrganizations } from '@/mocks/users';
import { mockAgents } from '@/mocks/agents';
import { mockNotifications } from '@/mocks/notifications';
```

**Rewiring plan:**

| State Field | Current Init | Replace With |
|-------------|-------------|--------------|
| `currentUser` | `mockCurrentUser` | `GET /api/auth/me` on mount |
| `currentRole` | localStorage + mock fallback | From `currentUser.role` via API |
| `currentOrganization` | `mockOrganizations[0]` | From user's session/org context |
| `organizations` | `mockOrganizations` | `GET /api/organizations` |
| `agents` | `mockAgents` | Remove from context — use TanStack Query per-page |
| `notifications` | `mockNotifications` | `GET /api/notifications` via query |
| `favorites` | Hardcoded 2 items | `GET /api/favorites` |

**State to keep in context (UI-only):**
- `sidebarVisible` — UI toggle, no backend
- `rightPaneOpen` — UI toggle, no backend
- `mobileMenuOpen` — UI toggle, no backend
- `activePanel` — UI hover state, no backend
- `subMenuExpanded` — UI toggle, persist in localStorage
- `panelHovered` — UI hover state, no backend
- `selectedAgent` — UI selection state, no backend

**Functions to convert to API calls:**
| Function | Current | Replace With |
|----------|---------|--------------|
| `switchOrganization(orgId)` | In-memory | `POST /api/auth/switch-org` + refetch user |
| `addAgent(agent)` | In-memory push | Remove — use mutation in agents page |
| `updateAgent(id, updates)` | In-memory map | Remove — use mutation in agents page |
| `markNotificationRead(id)` | In-memory map | `PUT /api/notifications/:id/read` |
| `addFavorite(item)` | In-memory push | `POST /api/favorites` |
| `removeFavorite(id)` | In-memory filter | `DELETE /api/favorites/:id` |

**Recommended AppContext shape after migration:**
```ts
interface AppContextValue {
  // Auth (from API on mount)
  currentUser: User | null;
  currentRole: UserRole;
  currentOrganization: Organization;
  organizations: Organization[];
  isLoading: boolean;

  // UI state (client-only)
  sidebarVisible: boolean;
  rightPaneOpen: boolean;
  mobileMenuOpen: boolean;
  activePanel: string | null;
  subMenuExpanded: boolean;
  panelHovered: boolean;
  selectedAgent: Agent | null;

  // UI setters
  setSidebarVisible: (v: boolean) => void;
  setRightPaneOpen: (v: boolean) => void;
  setMobileMenuOpen: (v: boolean) => void;
  setActivePanel: (v: string | null) => void;
  setSubMenuExpanded: (v: boolean) => void;
  setPanelHovered: (v: boolean) => void;
  setSelectedAgent: (v: Agent | null) => void;
  toggleSubMenuExpanded: () => void;

  // Auth actions
  switchOrganization: (orgId: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

**Data removed from context (use TanStack Query instead):**
- `agents` → `useQuery({ queryKey: ['/api/agents'] })`
- `notifications` → `useQuery({ queryKey: ['/api/notifications'] })`
- `favorites` → `useQuery({ queryKey: ['/api/favorites'] })`

### 5.2 ThemeContext (`client/src/contexts/ThemeContext.tsx`)

**No backend dependency.** Purely client-side with localStorage. No changes needed.

---

## 6. Layout Component Integration

### 6.1 TopBar (`client/src/components/layout/TopBar.tsx`)

**Mock imports to remove:**
```ts
import { getNotificationIcon, getNotificationColor } from '@/mocks/notifications';
import { mockActivityFeed, getActivityColor } from '@/mocks/activity';
import { getRoleLabel } from '@/mocks/users';
```

**Replace with:**
- Notifications: `useQuery({ queryKey: ['/api/notifications'] })`
- Activity Feed: `useQuery({ queryKey: ['/api/activity'], select: first8 })`
- Role label: utility function (no mock dependency needed)
- Org switcher: `organizations` from AppContext (fetched on mount)

### 6.2 Sidebar (`client/src/components/layout/Sidebar.tsx`)

**Mock import to remove:**
```ts
import { canAccessSystem } from '@/mocks/users';
```

**Replace with:** Pure role check function: `const canAccessSystem = (role: UserRole) => role !== 'org_staff';`

**No data fetching needed.** Navigation is fully client-side.

### 6.3 SubMenuManager (`client/src/components/layout/SubMenuManager.tsx`)

**Mock imports to remove:**
```ts
import { getAgentStatusColor } from '@/mocks/agents';
import { mockActivityFeed } from '@/mocks/activity';
import { mockConversations } from '@/mocks/messages';
```

**Replace with:**
- Agent list: Already uses `AppContext.agents` → will use `useQuery({ queryKey: ['/api/agents'] })`
- Conversations: `useQuery({ queryKey: ['/api/conversations'] })`
- Agent status color: utility function (no mock dependency needed)

### 6.4 RightPane (`client/src/components/layout/RightPane.tsx`)

**Mock imports to remove:**
```ts
import { mockChatMessages, agentSuggestions } from '@/mocks/messages';
```

**Replace with:**
- Chat messages: `useQuery({ queryKey: ['/api/conversations', 'right-pane', 'messages'] })`
- Send message: `useMutation` → `POST /api/conversations/:id/messages`
- Suggestions: Can remain static or `GET /api/suggestions`

### 6.5 AppLayout (`client/src/components/layout/AppLayout.tsx`)

**No mock dependencies.** Purely layout logic. No changes needed.

### 6.6 FavoritesBar, MobileNavDropdown, MobileSidebar

**FavoritesBar** uses `AppContext.favorites` — will work once context fetches from API.
**MobileNavDropdown** and **MobileSidebar** — pure navigation, no mock data.

---

## 7. Mock Data → API Migration Checklist

Use this checklist to track migration of each mock file:

| Mock File | Tables Created | API Endpoints | Frontend Hooks | Status |
|-----------|---------------|---------------|----------------|--------|
| `mocks/users.ts` | `users`, `organizations` | auth, users, orgs | AppContext fetch | ☐ |
| `mocks/agents.ts` | `agents` | agents CRUD | useAgents, useAgent | ☐ |
| `mocks/messages.ts` | `conversations`, `messages` | conversations, messages | useConversations, useMessages | ☐ |
| `mocks/notifications.ts` | `notifications` | notifications | useNotifications | ☐ |
| `mocks/activity.ts` | `activity_feed` | activity | useActivity | ☐ |
| `mocks/files.ts` | `files` | files CRUD | useFiles | ☐ |
| `mocks/tasks.ts` | `calendar_events`, `leads`, `inbox_messages`, `hunches` | calendar, leads, inbox, hunches | useCalendar, useLeads, useInbox | ☐ |
| `mocks/insights.ts` | `metrics` | metrics, charts, pipeline | useMetrics, useCharts | ☐ |

**Per-file migration steps:**
1. Create Drizzle table(s) in `shared/schema.ts`
2. Generate insert/select types with `drizzle-zod`
3. Add CRUD methods to `IStorage` in `server/storage.ts`
4. Implement storage methods in `DatabaseStorage` class
5. Add API routes in `server/routes.ts` with Zod validation
6. Create TanStack Query hooks in `client/src/hooks/`
7. Update page component to use hook instead of mock import
8. Remove mock import from component
9. Test endpoint and frontend rendering
10. Repeat until mock file has zero consumers, then delete it

---

## 8. Authentication & RBAC

### Current State
- No real authentication
- Role stored in `localStorage` key `nexxus-current-role`
- `canAccessSystem()` is a client-side role check in `mocks/users.ts`
- Settings page uses `currentRole` to filter visible tiles

### Implementation Plan

1. **Session-based auth** using `express-session` + `connect-pg-simple`
   - Session table auto-created by connect-pg-simple
   - `SESSION_SECRET` already exists in environment secrets

2. **Login flow:**
   - `POST /api/auth/login` → validate credentials → create session
   - Session stores `userId` and `organizationId`
   - `GET /api/auth/me` → returns user object from session

3. **RBAC enforcement:**
   - Middleware: `requireAuth` — checks session exists
   - Middleware: `requireRole(roles[])` — checks `user.role` against allowed roles
   - Apply to routes: Settings endpoints → `requireRole(['super_admin', 'partner_admin', 'org_admin'])`
   - Apply to routes: Data management → `requireRole(['super_admin'])`

4. **Frontend changes:**
   - `AppContext` fetches `/api/auth/me` on mount
   - If 401, redirect to login page (new page needed)
   - Remove localStorage role persistence
   - Remove `setCurrentRole` from context (role comes from server)

### Role Hierarchy
```
super_admin    → Full platform access
partner_admin  → Partner group + sub-orgs
org_admin      → Single org, all features
org_staff      → Single org, limited features (no Settings)
```

---

## 9. Real-Time Features

### Candidates for Real-Time
| Feature | Current | Recommended Approach |
|---------|---------|---------------------|
| Chat responses | setTimeout (1.5s fake delay) | SSE (Server-Sent Events) for streaming AI responses |
| Notifications | Static list | SSE or polling (30s interval) |
| Activity feed | Static list | Polling (60s interval) |
| Inbox messages | Static list | Polling (30s interval) or WebSocket |

### SSE Implementation for Chat
```ts
// Server: stream AI response chunks
app.post('/api/conversations/:id/messages', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  // Stream chunks from AI provider
  for await (const chunk of aiResponse) {
    res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
  }
  res.end();
});
```

---

## 10. File Uploads & Storage

### Drive File Upload
- Use Replit Object Storage or S3-compatible storage
- Multipart upload via `POST /api/files`
- Store file metadata in `files` table
- Store actual file in object storage, save URL in `storage_url` column

### Knowledge Base Upload (Agents)
- Same storage mechanism
- Link files to agent via `agent_knowledge` junction table
- Consider text extraction for AI indexing

---

## 11. AI/Chat Integration

### Chat Interfaces That Need AI Backend
1. **Main Page chat** — General Automa assistant
2. **Right Pane chat** — Contextual Automa assistant
3. **Agent Page chat** — Per-agent conversation

### Integration Points
| Chat Location | Conversation Type | AI Context |
|---------------|------------------|------------|
| Main Page | `main_chat` | General, role-based |
| Right Pane | `right_pane` | Page-context aware |
| Agents Page | `agent_chat` | Agent instructions + knowledge |

### AI Provider Integration
- Use OpenAI / Anthropic API via server-side proxy
- Store API key as secret (never expose to frontend)
- Stream responses via SSE
- Each agent has its own system prompt (`instructions` field)

---

## 12. Migration Sequence

Recommended order of implementation:

### Phase 1: Foundation
1. ☐ Create PostgreSQL database
2. ☐ Expand `shared/schema.ts` with all tables (Section 2)
3. ☐ Run `db:push` to create tables
4. ☐ Implement `DatabaseStorage` class in `server/storage.ts`
5. ☐ Set up session auth middleware

### Phase 2: Auth & Core
6. ☐ Implement auth endpoints (login, logout, me)
7. ☐ Create login page
8. ☐ Rewire `AppContext` to fetch from `/api/auth/me`
9. ☐ Implement organizations endpoints
10. ☐ Implement users endpoints
11. ☐ Seed database with initial data (from current mock data)

### Phase 3: Primary Features
12. ☐ Implement agents CRUD endpoints
13. ☐ Implement notifications endpoints
14. ☐ Implement favorites endpoints
15. ☐ Create TanStack Query hooks for agents, notifications, favorites
16. ☐ Rewire Agents page, TopBar notifications, FavoritesBar

### Phase 4: Communication
17. ☐ Implement conversations + messages endpoints
18. ☐ Implement inbox endpoints
19. ☐ Rewire Main Page chat, Right Pane chat, Agent chat
20. ☐ Rewire Hub inbox tab

### Phase 5: Data Features
21. ☐ Implement files endpoints + upload
22. ☐ Implement calendar endpoints
23. ☐ Implement leads endpoints
24. ☐ Rewire Drive page, Hub calendar tab, Hub leads tab

### Phase 6: Analytics
25. ☐ Implement metrics endpoints (dashboard + library)
26. ☐ Implement charts endpoints
27. ☐ Implement pipeline endpoint
28. ☐ Implement hunches endpoints
29. ☐ Implement activity feed endpoint
30. ☐ Rewire Insights page (all 4 tabs), Activity page

### Phase 7: Settings & Polish
31. ☐ Implement settings endpoints
32. ☐ Rewire Settings page
33. ☐ Rewire Profile page
34. ☐ Add AI chat integration (SSE streaming)
35. ☐ Delete all `client/src/mocks/*.ts` files
36. ☐ Final testing and cleanup

---

## Appendix: Utility Functions to Extract from Mocks

These functions are currently in mock files but are pure utilities. Extract them to `client/src/lib/utils.ts` or similar:

| Function | Current Location | Purpose |
|----------|-----------------|---------|
| `getRoleLabel(role)` | `mocks/users.ts` | Maps role enum to display label |
| `canAccessSystem(role)` | `mocks/users.ts` | Role-based access check |
| `getAgentStatusColor(status)` | `mocks/agents.ts` | Maps status to CSS class |
| `getNotificationIcon(type)` | `mocks/notifications.ts` | Maps type to icon name |
| `getNotificationColor(type)` | `mocks/notifications.ts` | Maps type to CSS class |
| `getActivityColor(type)` | `mocks/activity.ts` | Maps type to CSS class |
| `getLeadStatusColor(status)` | `mocks/tasks.ts` | Maps status to CSS class |
| `formatFileSize(bytes)` | `mocks/files.ts` | Formats bytes to human-readable |

These should be extracted before deleting mock files, as they contain no mock data and are needed by the UI.
