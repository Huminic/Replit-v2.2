# Claude Code Handoff Prompt — Nexxus Connect™ V2.1

Copy this entire prompt and give it to Claude Code when starting the frontend rebuild.

---

## START OF PROMPT

You are taking over development of **Nexxus Connect™**, an AI-powered dealership management platform. A mature backend already exists and is running in production. A new UI has been designed to replace the current frontend. Your job is to **rebuild the frontend** against the new design, wired to the existing backend — without touching the server, database, or integration layer.

---

## ⚠️ CRITICAL: Production Environment Rules

Before you write any code, understand these non-negotiable facts:

1. **The backend is LIVE and working** — 185+ API endpoints, 53 database tables, 100+ RLS policies, 7 third-party integrations, 8 scheduled jobs, 747 E2E tests. **Do not modify server code** unless explicitly required by the new UI.
2. **VAPI webhooks are LIVE** — actively processing voice call data for real dealership customers. Do not modify `server/webhooks/vapi.ts`.
3. **Tavus webhooks are LIVE** — actively processing video session data. Do not modify `server/webhooks/tavus.ts`.
4. **Existing users and data MUST be preserved** — never drop, truncate, or destructively migrate. All database migrations must be additive only.
5. **The new UI design is the source of truth** — if any document contradicts the designer's handoff, the design wins.

---

## Step 0: Setup — Archive & Install

### 0.1 Backup the existing frontend (preserve for reference)

```bash
mkdir -p _archive/old_client
cp -r client/ _archive/old_client/
```

### 0.2 Install the new UI

The new UI code is in the uploaded folder. Replace the `client/` directory contents with the new designer UI, **except** for the integration plumbing files listed in Section 3 below — those must be carried forward from the old client.

### 0.3 Verify the backend still works

```bash
# Ensure the server starts and responds
curl -s http://localhost:5000/api/health
# Verify auth endpoint is reachable
curl -s http://localhost:5000/api/auth/me -H "Authorization: Bearer test" | head -c 200
```

### 0.4 Read the audit files

Before writing any code, read these audit files that document what the backend exposes:

```bash
cat replit_reference/App\ Audit/server-audit.md    # 185 endpoints, full API contract
cat replit_reference/App\ Audit/database-audit.md  # 53 tables, RLS policies, JSONB schemas
cat replit_reference/App\ Audit/client-audit.md    # 26 hooks, 4 contexts, integration plumbing
cat replit_reference/App\ Audit/health-audit.md    # Build system, dependencies, test inventory
cat replit_reference/App\ Audit/DATA_ACCURACY_REPORT.md  # VAPI/Tavus/VIN data integrity findings
```

---

## 1. What Already Exists (DO NOT REBUILD)

### 1.1 Backend Infrastructure (server/)

| Component | Count | Details |
|-----------|-------|---------|
| Route files | 34 | Registered in `server/routes.ts` in specific order |
| API endpoints | ~185 | Full CRUD across 34 resource groups |
| Service files | 36+ | Business logic layer (DealerBrainService is 3,047 lines) |
| Middleware | 3 | `auth` (JWT), `enforceOrganizationContext` (RLS), `validateResourceOwnership` |
| Webhook handlers | 2 | VAPI (`server/webhooks/vapi.ts`), Tavus (`server/webhooks/tavus.ts`) |
| Scheduled jobs | 8 | VIN lead polling, token refresh, cache cleanup, etc. |
| Database tables | 53 | With 100+ RLS policies across 33 migration files |
| Third-party integrations | 7 | VIN Solutions, VAPI, Tavus, Resend, TextMagic, Claude API, Google Calendar |
| E2E tests | 747 | Playwright specs across 46 files |

### 1.2 API Route Groups (Complete Endpoint Catalog)

```
/api/webhooks/vapi          (before body parsers — DO NOT MOVE)
/api/webhooks/tavus         (raw body capture for HMAC — DO NOT MOVE)
/api/auth                   9 endpoints  (login, logout, refresh, register, me, forgot/reset password)
/api/vin                    10 endpoints (VIN Solutions OAuth, lead sync, token management)
/api/integrations           6 endpoints  (CRUD + test connection)
/api/insights               15 endpoints (voice calls, video sessions, leads, dashboard, dealer pulse)
/api/agents                 9 endpoints  (CRUD, seed, duplicate, status toggle)
/api/credits                5 endpoints  (balance, usage, policies)
/api/tasks                  9 endpoints  (CRUD, calendar format, status updates)
/api/appointments           10 endpoints (CRUD, calendar, confirmation tokens, Google Calendar sync)
/api/conversations          11 endpoints (CRUD, messages, SSE streaming, file upload)
/api/admin                  14 endpoints (user/org CRUD, partner links, roles, locations)
/api/admin/knowledge        4 endpoints  (CSV/XLSX upload, undo, templates)
/api/settings               4 endpoints  (application settings, report upload)
/api/email                  7 endpoints  (IMAP sync, send, folders, star/read)
/api/user/integrations      (user-level integration settings)
/api/dealerbrain            3 endpoints  (AI config get/set/reset)
/api/notifications          8 endpoints  (CRUD, preferences, unread count)
/api/sms                    7 endpoints  (TextMagic config, send, messages, opt-outs, webhook)
/api/widgets/public         8 endpoints  (session, chat, video, callback — public, rate-limited)
/api/widgets                9 endpoints  (CRUD, embed code, domain whitelist)
/api/inbox                  8 endpoints  (unified inbox threads, messages, assignment)
/api/tracking               6 endpoints  (pixel events, attribution, funnel, sources)
/api/triggers               10 endpoints (automation rules CRUD, templates, executions)
/api/activity               6 endpoints  (AI usage events, stats, artifacts, CSV export)
/api/goals                  7 endpoints  (CRUD, progress tracking)
/api/reports                5 endpoints  (catalog, preview, generate, download)
/api/drive                  8 endpoints  (files, folders, upload/download, storage usage)
/api/hunches                4 endpoints  (list, stats, review accept/dismiss)
/api/approvals              5 endpoints  (CRUD, resolve approve/reject)
/api/leads                  6 endpoints  (list, stats, mark-contacted, status, assign)
/api/dashboard              1 endpoint   (Command Center data)
/api/metrics                3 endpoints  (registry, summary, by category)
/api/hosted-pages           5 endpoints  (CRUD for hosted widget pages)
/api/pages                  1 endpoint   (public page by slug)
/api/health                 1 endpoint   (health check)
/api (google-calendar)      7 endpoints  (OAuth flow, sync, push appointment)
```

### 1.3 Authentication Architecture

- **JWT-based** — access token + refresh token stored in `localStorage`
- Access token keys: `nexxus_access_token`, `nexxus_refresh_token`, `nexxus_token_expiry`
- Auto-refresh: checks every 60 seconds, refreshes when < 5 minutes to expiry
- On refresh failure: automatic logout
- Login: `POST /api/auth/login` returns `{ accessToken, refreshToken, expiresAt, user }`
- Refresh: `POST /api/auth/refresh` with `{ refreshToken }` body
- Protected routes: `Authorization: Bearer <accessToken>` header
- Org switching (Partner Admin): `POST /api/auth/switch-org` — invalidates all cached queries

### 1.4 RBAC Structure

| Role | Level | Key Permissions |
|------|-------|-----------------|
| Super Admin | 1 | Full platform access, user/org CRUD, all settings |
| Partner Admin | 2 | Multi-org access, manages assigned orgs |
| Org Admin | 3 | Single org, manages users/settings within org |
| Staff | 4 | Single org, own data only (leads, conversations, tasks) |

Role mapping (numeric → string): Level 1 → `super_admin`, Level 2 → `partner_admin`, Level 3 → `org_admin`, Level 4 → `org_staff`

#### Prototype RBAC Gates (as of 2026-02-22)

| Feature | super_admin | partner_admin | org_admin | org_staff |
|---------|:-----------:|:-------------:|:---------:|:---------:|
| Billing Management (`/settings/billing`) | ✅ | ✅ | ❌ | ❌ |
| Org Creation Wizard (`/settings/org-wizard`) | ✅ | ✅ | ❌ | ❌ |
| AI Config Skills tab (kill switch) | ✅ | ❌ | ❌ | ❌ |
| Tools API Keys/Webhooks tabs | ✅ | ❌ | ❌ | ❌ |
| New Organization button (User Management) | ✅ | ❌ | ❌ | ❌ |

### 1.5 Real-Time Features

- **SSE streaming**: `POST /api/conversations/:id/stream` — DealerBrain AI responses via Server-Sent Events
- **No active WebSocket**: Socket.io is installed but not actively used for production features
- **Polling**: Notifications poll on interval, VIN leads poll every 60 minutes

---

## 2. Project Structure

```
nexxus-v2/
├── client/                          # ⬅ YOUR WORKSPACE — Replace visual layer
│   ├── src/
│   │   ├── App.tsx                  # Route definitions (wouter) — REBUILD with new routes
│   │   ├── main.tsx                 # React entry point
│   │   ├── index.css                # Design tokens — UPDATE for new design
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── ProtectedRoute.tsx  # CARRY FORWARD — auth guard
│   │   │   ├── chat/                   # CARRY FORWARD — streaming, charts, panels
│   │   │   ├── layout/                 # REBUILD — new design's layout system
│   │   │   └── ui/                     # Shadcn/Radix primitives (keep or replace per design)
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx         # CARRY FORWARD — JWT auth + org switching
│   │   │   ├── AppContext.tsx          # ADAPT — keep role/org/panel logic, update for new layout
│   │   │   ├── ChatContext.tsx         # CARRY FORWARD — floating chat state
│   │   │   └── ThemeContext.tsx        # CARRY FORWARD — light/dark theme
│   │   ├── hooks/                      # CARRY FORWARD — all 26 TanStack Query hooks
│   │   ├── lib/
│   │   │   ├── queryClient.ts         # CARRY FORWARD — fetch wrapper + query client config
│   │   │   ├── api.ts                 # CARRY FORWARD — fetchApi() with JWT refresh
│   │   │   └── utils.ts              # CARRY FORWARD — cn() utility
│   │   ├── mocks/                     # DELETE — no longer needed (real API exists)
│   │   └── pages/                     # REBUILD — new page components from design
│   │       ├── billing-management.tsx # Billing management for Super/Partner Admin
│   │       ├── org-wizard.tsx         # 7-step org creation wizard
│   └── public/
├── server/                          # DO NOT MODIFY (unless new endpoint needed for new UI)
│   ├── index.ts                     # Server entry point
│   ├── routes.ts                    # 34 route file registrations
│   ├── routes/                      # 34 route files (auth, agents, insights, etc.)
│   ├── services/                    # 36+ service files (business logic)
│   ├── middleware/                   # Auth, RLS enforcement, ownership validation
│   ├── webhooks/                    # VAPI + Tavus handlers (LIVE — DO NOT TOUCH)
│   ├── jobs/                        # 8 scheduled jobs
│   ├── db/                          # Database utilities, SecureQueryBuilder
│   └── vite.ts                      # Vite dev integration (DO NOT MODIFY)
├── database/
│   ├── migrations/                  # 33 SQL migration files (001-033)
│   └── seed.sql                     # Development seed data
├── shared/
│   └── schema.ts                    # Drizzle ORM schema (18 lines — minimal placeholder)
├── tests/
│   └── e2e/                         # 46 Playwright spec files (747 tests)
├── plan_docs/                       # Governing documentation
│   ├── ACCEPTANCE_CRITERIA.md       # Pixel-level UI behavior spec
│   └── v2.1/
│       ├── CLAUDE_CODE_HANDOFF_PROMPT.md  # THIS FILE — start here
│       ├── CARRY_FORWARD_MANIFEST.md      # 32 files to preserve, 8 to reference, 11 to delete
│       ├── DO_NOT_TOUCH.md                # Explicit freeze list — backend files never to modify
│       ├── REVERSE_SRS.md                 # Actual vs planned implementation gap analysis
│       ├── DEVELOPMENT_TEAM_BRIEFING.md   # Hard-won lessons from original team
│       ├── NEW_CONSTITUTION.md      # Platform principles, metric formulas
│       ├── NEW_SRS.md               # Requirements spec
│       ├── NEW_IMPLEMENTATION_PLAN.md # Sprint structure
│       └── NEW_CLAUDE.md            # Implementation patterns
├── replit_reference/                # Source material (read-only reference)
│   ├── App Audit/                   # 5 forensic audit files (server, database, client, health, data accuracy)
│   ├── Metrics/                     # Exact metric formulas (Org Admin, Staff, Reports, Library)
│   ├── new_instructions/            # Agent Instructions, Hunch Instructions prompts
│   └── Old_Govering Docs/          # Previous version docs (superseded)
├── dev_handoff/                     # Legacy handoff docs (reference only)
└── widget/                          # Embeddable Preact widget (separate build)
```

---

## 3. Integration Plumbing — MUST Carry Forward

These files contain the wiring between the frontend and backend. They are **not visual components** — they are infrastructure. The new UI must use them (or equivalents that do the same thing).

### 3.1 Authentication Context

**File:** `client/src/contexts/AuthContext.tsx`

Provides: `user`, `accessToken`, `refreshToken`, `isAuthenticated`, `loading`, `isPartnerAdmin`, `accessibleOrganizations`, `login()`, `logout()`, `refreshToken()`, `switchOrganization()`, `clearError()`

### 3.2 API Client

**File:** `client/src/lib/api.ts` (or `queryClient.ts`)

Provides: `fetchApi()` wrapper that:
- Adds `Authorization: Bearer` header automatically
- Handles 401 responses by attempting token refresh
- Falls back to logout on refresh failure
- Custom `getQueryFn` factory for TanStack Query

### 3.3 TanStack Query Hooks (26 hooks)

**Directory:** `client/src/hooks/`

| Hook | Queries | Mutations | Purpose |
|------|---------|-----------|---------|
| `useActivity` | 2 | 0 | Activity feed + governance data |
| `useAdmin` | 2+ | 3+ | Admin user/org management |
| `useAgents` | 3 | 4 | Agent CRUD |
| `useAppointments` | 2 | 3 | Calendar appointments |
| `useApprovals` | 2 | 3 | Approval workflow |
| `useConversations` | 3 | 2 | Chat conversations |
| `useCredits` | 1 | 0 | Credit usage tracking |
| `useDealerBrainConfig` | 1 | 0 | DealerBrain AI configuration |
| `useDealerBrainStreaming` | 0 | 0 | SSE streaming for AI chat |
| `useDrive` | 2+ | 4+ | File management |
| `useGoals` | 2 | 3 | Goal CRUD + progress |
| `useHunches` | 2 | 1 | Hunch list + accept/dismiss |
| `useInbox` | 2+ | 2+ | Unified inbox threads |
| `useInsights` | 3+ | 0 | Voice/video/lead insights |
| `useIntegrations` | 1+ | 3+ | Integration management |
| `useLeads` | 2 | 2 | Lead management |
| `useMetrics` | 1+ | 0 | Certified metrics |
| `useNotifications` | 2+ | 2+ | Notification CRUD |
| `useProfile` | 1 | 1 | User profile |
| `useReports` | 2 | 1 | Report catalog + generate |
| `useSettings` | 1 | 1 | Application settings |
| `useSMS` | 2+ | 2+ | SMS management |
| `useTasks` | 2 | 3 | Task CRUD |
| `useTriggers` | 2+ | 3+ | Trigger rules CRUD |
| `useVIN` | 2+ | 2+ | VIN Solutions management |
| `useWidgets` | 2+ | 3+ | Widget CRUD |

### 3.4 Chat Streaming Components

**Files:**
- `client/src/components/chat/StreamingMessage.tsx` — Renders SSE streaming AI responses (thinking indicator, tool execution cards, progressive token display)
- `client/src/components/chat/ChatChart.tsx` — Inline charts in chat messages (bar/line/pie via Recharts)
- `client/src/components/chat/ChatPanel.tsx` — Reusable chat panel
- `client/src/components/chat/SuggestedPrompts.tsx` — Clickable suggested prompts

### 3.5 Context Providers

**Provider hierarchy** (preserve this order in `App.tsx`):
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

### 3.6 Protected Route Guard

**File:** `client/src/components/auth/ProtectedRoute.tsx`

Shows spinner while auth loads, redirects to `/login` if unauthenticated.

---

## 4. Document Reading Order

Read these documents **in this order** before writing any code:

1. **`replit_reference/App Audit/server-audit.md`** — The actual API contract. 185 endpoints with auth requirements, RBAC gates, and response details.
2. **`replit_reference/App Audit/database-audit.md`** — 53 tables, RLS policies, JSONB column schemas, migration history.
3. **`replit_reference/App Audit/client-audit.md`** — 26 hooks, 4 contexts, 59 custom components. Shows what integration plumbing exists.
4. **`plan_docs/v2.1/CARRY_FORWARD_MANIFEST.md`** — Exact file-by-file inventory: 32 files to preserve, 8 to reference, 11 replaceable mocks. The definitive list of what crosses into the new UI.
5. **`plan_docs/v2.1/DO_NOT_TOUCH.md`** — Explicit freeze list for all backend files. If a file is listed here, do not modify it under any circumstances.
6. **`plan_docs/v2.1/REVERSE_SRS.md`** — Documents actual vs. planned implementation (237 endpoints vs 63 planned, 53 tables vs 17 planned, 91 metrics, 747 E2E tests). Shows how far the backend has grown beyond the original spec.
7. **`plan_docs/v2.1/DEVELOPMENT_TEAM_BRIEFING.md`** — Hard-won lessons, critical gotchas, and guidance from the original development team. Read this to avoid repeating known mistakes.
8. **`plan_docs/ACCEPTANCE_CRITERIA.md`** — Pixel-level UI behavior spec for the new design.
9. **`plan_docs/v2.1/NEW_CLAUDE.md`** — Implementation patterns, RBAC matrix, testing requirements.
10. **`plan_docs/v2.1/NEW_CONSTITUTION.md`** — Platform principles, naming rules, metric formulas (Section 5 is immutable).
11. **`replit_reference/new_instructions/Agent Instructions.md`** — Agent team development protocol.
12. **`replit_reference/new_instructions/Hunch Instructions.md`** — AI prompt for Hunch Engine pattern detection.
13. **`replit_reference/Metrics/`** — Exact metric formulas for Org Admin, Staff, Reports, Library (91 total).

When documents conflict: **New UI Design > ACCEPTANCE_CRITERIA > Constitution > Audit Files > SRS > Implementation Plan**

---

## 5. Known Bugs to Be Aware Of

### 5.1 CRITICAL: RLS Variable Name Mismatch

The `SecureQueryBuilder` (`server/db/SecureQueryBuilder.ts`) sets:
```
SET LOCAL app.current_organization_id = '...'
```

But **every RLS policy** in the database checks:
```sql
current_setting('app.current_org_id', true)
```

These are **different variable names**. The system works because most route handlers bypass SecureQueryBuilder and set `app.current_org_id` directly on the pool. But any code path through `req.db.query()` via SecureQueryBuilder sets the wrong variable.

**Impact:** HIGH — RLS enforcement depends on each route handler manually calling `set_config('app.current_org_id', ...)` correctly.

### 5.2 Secondary Variable Anomalies

| Variable | Used In | Issue |
|----------|---------|-------|
| `app.current_organization_id` | SecureQueryBuilder only | Wrong name — not matched by any RLS policy |
| `app.current_role` | dealer_pulse_cache, knowledge_uploads policies | Anomalous — checks string 'super_admin' instead of integer level |
| `app.current_role_level` | `server/routes/triggers.ts` line 38 | Wrong name — should be `app.user_role_level` |

### 5.3 VAPI Webhook Data Gap

Real-time webhook ingestion is partially broken. `call.started` events are not being received for production calls, causing `end-of-call-report` UPDATEs to find no matching rows. All 137 real call records were bulk-imported, not webhook-created. See `DATA_ACCURACY_REPORT.md` for full root cause analysis and recommendations.

### 5.4 Tavus Integration Gap

Zero real Tavus sessions have been captured by V2. No video agents are registered with `tavus_persona_id` in their config. The Tavus webhook callback URL has never been configured to point to V2. See `DATA_ACCURACY_REPORT.md` for details.

---

## 5.5 Current Prototype Coverage (as of 2026-02-22)

The new UI prototype now covers the following features with mock data. These serve as the visual reference for the V2.1 frontend rebuild:

- **Settings** — 9 tiles (API & Webhooks tile removed). Sub-menu has 10 entries with RBAC gating.
- **Tools & Integrations** — 5 tabs for most roles (MCP/API/Other/Widgets/Landing Pages) + 2 additional tabs for Super Admin (API Keys/Webhooks) = 7 tabs total.
- **Knowledge Base** — 4 tabs: Documents, Web Pages, Databases, Settings.
- **AI Configuration** — 4 tabs: System Prompt, Agent Behavior, Skills, Hunches. Skills tab includes a 20-skill catalog with category filtering and an emergency kill switch (Super Admin only). RBAC controls per tab.
- **Security** — All fields grayed out (non-interactive) except functional password reset.
- **Data Management** — 2 tabs: Database Uploads, Data Health.
- **Billing Management** — Standalone page at `/settings/billing` (Super Admin + Partner Admin only). Revenue charts, invoice builder, payment history.
- **Organization Creation Wizard** — 7-step wizard at `/settings/org-wizard` (Super Admin + Partner Admin only). Org details, branding, users, integrations, billing, review, confirmation.
- **Profile billing tab** — Usage progress bars and invoice history.
- **Drive sharing** — Download and Download as PDF buttons in share modal.
- **Hunch preferences** — Per-user hunch settings popout sheet.
- **Agent Config** — Per-agent triggers, skills catalog selection, and reference storage in AgentConfigPane.
- **User Management** — New Organization button (Super Admin only).
- **Notifications** — Global toggles and quiet hours configuration.
- **Appearance** — Organization-wide theme and branding settings.

---

## 6. Frontend Rebuild Phases

### Phase 1: Foundation (Days 1-2)

**Goal:** New UI shell loads, auth works, basic navigation functional.

1. Install new UI component files into `client/src/`
2. Carry forward all integration plumbing (Section 3)
3. Wire `App.tsx` with new routes inside `ProtectedRoute` + `AppLayout`
4. Verify login/logout/refresh cycle works with existing backend
5. Verify org switching works for Partner Admin role

**Gate:** User can log in, see the new layout, navigate between pages, and log out.

### Phase 2: Data Pages (Days 3-5)

**Goal:** All data-display pages show real data from existing API.

1. Wire Dashboard page to `GET /api/dashboard`, `GET /api/metrics/registry`
2. Wire Insights page to existing insight hooks (`useInsights`, `useHunches`, `useReports`)
3. Wire Agents page to `useAgents` hook (list, detail, CRUD)
4. Wire Drive page to `useDrive` hook (files, folders, upload/download)
5. Wire Hub/Work Center to `useTasks`, `useAppointments`, `useApprovals`, `useInbox`
6. Wire Activity page to `useActivity` hook

**Gate:** Every data page displays real data. No mock data imports remain.

### Phase 3: Interactive Features (Days 6-8)

**Goal:** All interactive features work end-to-end.

1. Wire DealerBrain chat with SSE streaming (carry forward `StreamingMessage.tsx`)
2. Wire Settings page to appropriate hooks per tab (`useAdmin`, `useSettings`, `useSMS`, `useWidgets`, etc.)
3. Wire Profile page to `useProfile` hook + Google Calendar integration
4. Wire Notification bell + full notifications page
5. Wire floating chat (carry forward `FloatingChat.tsx` + `ChatPanel.tsx`)
6. Test all CRUD operations (create agent, create task, upload file, etc.)

**Gate:** All interactive features work. Forms submit, data persists, streaming works.

### Phase 4: Polish & Verification (Days 9-10)

**Goal:** New UI matches design spec, all acceptance criteria pass.

1. Verify every page against `ACCEPTANCE_CRITERIA.md`
2. Test all 4 RBAC roles (Super Admin, Partner Admin, Org Admin, Staff)
3. Verify responsive behavior (desktop, tablet, mobile)
4. Verify light/dark theme works across all pages
5. Run existing E2E test suite — fix any failures caused by UI changes
6. Remove any remaining mock data files from `client/src/mocks/`
7. Submit 3 deltas of proof with screenshots per phase

**Gate:** All acceptance criteria pass with real data. No console errors. Responsive and themed correctly.

---

## 7. Testing Protocol

- **Voice**: Use the "Elliot" test-only VAPI agent for all voice testing
- **SMS**: Loopback to self via TextMagic API — never to real customers
- **Email**: Use `neoweaver@gmail.com` for all outbound email tests
- **Video**: Test sessions only — never production Tavus sessions
- **Per phase**: At least 3 deltas of proof with screenshots, then full E2E at phase completion
- **Existing tests**: Run `npx playwright test` after each phase to catch regressions

---

## 8. Quick Reference: What To Do vs What Files

| What to do | Files to touch |
|---|---|
| Replace a page's visual layout | `client/src/pages/*.tsx` — new component, same hooks |
| Replace the layout shell | `client/src/components/layout/*.tsx` — new design components |
| Wire data to a page | Import the existing hook from `client/src/hooks/use*.ts` |
| Add a new API call | Add to existing hook file, or create new hook in `client/src/hooks/` |
| Modify auth behavior | `client/src/contexts/AuthContext.tsx` |
| Change theme tokens | `client/src/index.css` |
| Add a new route | `client/src/App.tsx` — add `<Route>` inside `<Switch>` |
| Need a new backend endpoint | `server/routes/*.ts` + `server/services/*.ts` (RARE — most endpoints exist) |

---

## 9. Data That Must Be Preserved

- All existing user accounts (organizations, roles, partner links)
- All webhook configurations and handlers
- All VAPI agent configurations (5 registered agents)
- All VIN Solutions integration configs (3 active orgs)
- All 53 database tables and their data
- All 33 migration files (never modify — only add new ones)
- All scheduled job configurations

---

## 10. Environment Variables

The backend requires 33 environment variables (configured in `.env`, not committed to git). Key categories:

| Category | Variables |
|----------|-----------|
| Database | `DATABASE_URL`, `SUPABASE_*` |
| Auth | `JWT_SECRET`, `JWT_REFRESH_SECRET` |
| AI | `ANTHROPIC_API_KEY` |
| VIN Solutions | `VIN_CLIENT_ID`, `VIN_CLIENT_SECRET`, `VIN_API_KEY` |
| VAPI | `VAPI_API_KEY`, `VAPI_WEBHOOK_SECRET` |
| Tavus | `TAVUS_API_KEY` |
| Email | `RESEND_API_KEY`, `IMAP_*` |
| SMS | `TEXTMAGIC_USERNAME`, `TEXTMAGIC_API_KEY` |
| Google Calendar | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| General | `SESSION_SECRET`, `ENCRYPTION_KEY`, `PUBLIC_API_URL` |

No `.env.example` file exists. Ask the project owner for the values.

---

## Your First Actions

1. Read `replit_reference/App Audit/server-audit.md` — understand the API surface
2. Read `replit_reference/App Audit/client-audit.md` — understand the integration plumbing
3. Read `plan_docs/v2.1/CARRY_FORWARD_MANIFEST.md` — know exactly which files to preserve
4. Read `plan_docs/v2.1/DO_NOT_TOUCH.md` — know exactly which files are frozen
5. Read `plan_docs/v2.1/DEVELOPMENT_TEAM_BRIEFING.md` — learn from the original team's hard-won lessons
6. Archive the old `client/` directory
7. Install the new UI files
8. Carry forward all files listed in CARRY_FORWARD_MANIFEST.md (Section 1: MUST Preserve)
9. Begin Phase 1: Get the new shell loading with auth working
10. After Phase 1, submit 3 deltas of proof with screenshots

---

## END OF PROMPT
