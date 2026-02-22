# Claude Code Handoff Prompt — Nexxus Connect™ V2.1

Copy this entire prompt and give it to Claude Code when starting the backend implementation.

---

## START OF PROMPT

You are taking over development of **Nexxus Connect™**, an AI-powered dealership management platform. The validated UI prototype is complete and running. Your job is to wire it to a real backend — database, authentication, API integrations, and AI services — without changing the UI.

## ⚠️ CRITICAL: This is a LIVE Production Environment

Before you write any code, understand these non-negotiable facts:

1. **VAPI webhooks are LIVE** — actively sending voice call data to real customers. Do not modify webhook handlers without explicit approval.
2. **Tavus webhooks are LIVE** — actively sending video session data to real customers. Do not modify webhook handlers without explicit approval.
3. **Existing users MUST be preserved** — never drop, truncate, or destructively migrate user data. All database migrations must be additive only.
4. **The UI is the source of truth** — if any document contradicts the working UI code, the UI wins. You change data sources, not the UI.

---

## Step 0: Setup — Archive & Explode

All the new governing documents have been uploaded into a folder called `nexxus_21_Revision/`. Before you begin:

1. **Backup the existing UI and old docs:**
   ```bash
   mkdir -p _archive/ui_backup
   mkdir -p _archive/old_docs
   cp -r client/ _archive/ui_backup/
   cp -r server/ _archive/ui_backup/
   cp -r shared/ _archive/ui_backup/
   # If an old CLAUDE.md exists at root, back it up
   [ -f CLAUDE.md ] && cp CLAUDE.md _archive/old_docs/CLAUDE.md
   [ -d plan_docs ] && cp -r plan_docs/ _archive/old_docs/plan_docs/
   ```

2. **Explode the revision folder into the project root:**
   ```bash
   # Copy governing docs into place
   mkdir -p plan_docs/v2.1
   cp nexxus_21_Revision/NEW_CONSTITUTION.md plan_docs/v2.1/
   cp nexxus_21_Revision/NEW_SRS.md plan_docs/v2.1/
   cp nexxus_21_Revision/NEW_IMPLEMENTATION_PLAN.md plan_docs/v2.1/
   cp nexxus_21_Revision/NEW_CLAUDE.md plan_docs/v2.1/
   cp nexxus_21_Revision/ACCEPTANCE_CRITERIA.md plan_docs/
   
   # Copy this handoff prompt as your CLAUDE.md
   cp nexxus_21_Revision/CLAUDE_CODE_HANDOFF_PROMPT.md CLAUDE.md
   ```

3. **Diff the plan against the existing codebase:**
   ```bash
   # Check what files already exist that might conflict
   ls -la server/
   ls -la shared/schema.ts
   cat shared/schema.ts
   cat server/routes.ts
   cat server/storage.ts
   ```
   Review the existing server code. Note any existing routes, middleware, or database schema that the plan might conflict with. Resolve all questions before writing new code.

---

## Project Structure — Where Everything Lives

```
nexxus-v2/
├── client/                          # React frontend (DO NOT MODIFY UI)
│   ├── src/
│   │   ├── App.tsx                  # Route definitions (wouter)
│   │   ├── main.tsx                 # React entry point
│   │   ├── index.css                # Design tokens, theme vars, animations
│   │   ├── components/
│   │   │   ├── AgentConfigPane.tsx   # Right pane agent config (6 sections)
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx     # Main layout wrapper (sidebar + content + right pane)
│   │   │   │   ├── TopBar.tsx        # Logo, org switcher, notifications, profile, role switcher
│   │   │   │   ├── Sidebar.tsx       # 64px icon+label nav strip
│   │   │   │   ├── SubMenuManager.tsx# Hover/pin sub-menu system (all pages)
│   │   │   │   ├── RightPane.tsx     # Automa AI chat panel
│   │   │   │   ├── FavoritesBar.tsx  # Favorites strip
│   │   │   │   └── MobileNavDropdown.tsx
│   │   │   └── ui/                   # Shadcn/Radix UI primitives (DO NOT MODIFY)
│   │   ├── contexts/
│   │   │   ├── AppContext.tsx        # Global state (panels, user, org, agents, notifications)
│   │   │   └── ThemeContext.tsx      # Light/dark mode toggle
│   │   ├── hooks/
│   │   │   ├── use-mobile.tsx        # Mobile detection hook
│   │   │   └── use-toast.ts         # Toast notifications
│   │   ├── lib/
│   │   │   ├── queryClient.ts       # TanStack Query client + apiRequest helper
│   │   │   └── utils.ts             # cn() utility for Tailwind class merging
│   │   ├── mocks/                   # ⬅ YOUR TARGET — replace these with API calls
│   │   │   ├── activity.ts          # Activity feed mock data
│   │   │   ├── agents.ts            # Agent definitions mock data
│   │   │   ├── files.ts             # Drive files mock data
│   │   │   ├── insights.ts          # Metrics, charts, reports mock data
│   │   │   ├── messages.ts          # Chat messages mock data
│   │   │   ├── notifications.ts     # Notification items mock data
│   │   │   ├── tasks.ts             # Calendar events, tasks mock data
│   │   │   ├── users.ts             # Users, orgs, roles mock data
│   │   │   └── widgets.ts           # Widget configs mock data
│   │   └── pages/                   # Page components (one per route)
│   │       ├── main.tsx             # Home — AI chat + metric tiles (32KB)
│   │       ├── insights.tsx         # Insights — Dashboard/Reports/Library/Hunches (106KB)
│   │       ├── agents.tsx           # Agents — list/detail/chat (10KB)
│   │       ├── agents-create.tsx    # Agent creation form (11KB)
│   │       ├── work-center.tsx      # Hub — Calendar/Leads/Inbox (45KB)
│   │       ├── drive.tsx            # Drive — file management (14KB)
│   │       ├── settings.tsx         # System Settings — tile grid (74KB)
│   │       ├── profile.tsx          # User profile (13KB)
│   │       ├── activity.tsx         # Activity feed (7KB)
│   │       ├── widget-landing.tsx   # Standalone widget page /w/:slug (19KB)
│   │       └── not-found.tsx        # 404 page
│   └── public/
│       └── favicon.png
├── server/                          # Express backend (YOUR MAIN WORKSPACE)
│   ├── index.ts                     # Server entry point
│   ├── routes.ts                    # API route registration (currently minimal)
│   ├── storage.ts                   # IStorage interface + MemStorage (replace with PgStorage)
│   ├── static.ts                    # Static file serving
│   └── vite.ts                      # Vite dev server integration (DO NOT MODIFY)
├── shared/
│   └── schema.ts                    # Drizzle ORM schema (currently just users table placeholder)
├── plan_docs/                       # Governing documentation
│   ├── ACCEPTANCE_CRITERIA.md       # Pixel-level UI behavior spec (908 lines)
│   └── v2.1/
│       ├── NEW_CONSTITUTION.md      # Platform identity, principles, metric formulas
│       ├── NEW_SRS.md               # 63 endpoints, 17 tables, 91 metrics, 6 reports
│       ├── NEW_IMPLEMENTATION_PLAN.md# 4 sprints, 9 tracks, gate criteria
│       └── NEW_CLAUDE.md            # Implementation patterns, RBAC matrix, testing reqs
├── replit_reference/                # Source material (read-only reference)
│   ├── Metrics/                     # Exact metric formulas (Org Admin, Staff, Reports, Library)
│   ├── new_instructions/            # Agent Instructions, Hunch Instructions prompts
│   ├── App Audit/                   # Codebase audit reports
│   └── Old_Govering Docs/          # Previous version docs (superseded)
├── dev_handoff/                     # Legacy handoff docs (reference only)
├── docs/                            # Design docs (reference only)
├── drizzle.config.ts                # Drizzle Kit config (DO NOT MODIFY)
├── package.json                     # Dependencies
└── replit.md                        # Project overview and architecture summary
```

---

## Document Reading Order

Read these documents **in this order** before writing any code:

1. **`plan_docs/v2.1/NEW_CLAUDE.md`** — Your direct implementation guide. Start here.
2. **`plan_docs/ACCEPTANCE_CRITERIA.md`** — The pixel-level truth for all UI behaviors. Skim Part I to understand what the UI does.
3. **`plan_docs/v2.1/NEW_CONSTITUTION.md`** — Platform principles, naming rules, metric formulas (Section 5 is immutable).
4. **`plan_docs/v2.1/NEW_SRS.md`** — Complete requirements: 63 endpoints, 17 tables, 91 metrics, 6 reports.
5. **`plan_docs/v2.1/NEW_IMPLEMENTATION_PLAN.md`** — Sprint structure, module assignments, dependencies, gate criteria.
6. **`replit_reference/new_instructions/Agent Instructions.md`** — Agent team development protocol (how multiple agents coordinate).
7. **`replit_reference/new_instructions/Hunch Instructions.md`** — AI prompt used by the Hunch Engine to generate pattern detections.
8. **`replit_reference/Metrics/`** — Exact metric formulas for Org Admin tiles, Staff tiles, Reports, and Library (91 total).

When documents conflict: ACCEPTANCE_CRITERIA > Constitution > SRS > Implementation Plan > Claude Guide.

---

## Key Points That Need Special Attention

### 1. The Golden Rule
**Change the data source, not the UI.** Every mock import in `client/src/mocks/` gets replaced with a TanStack Query API call. The page components, layout, animations, and interactions stay exactly as they are.

### 2. Metric Formulas Are Immutable
Constitution Section 5 defines exact formulas for 8 role-specific metric tiles (4 Org Admin + 4 Staff). These are mathematical formulas — implement them exactly as written. No approximations. See `replit_reference/Metrics/` for additional detail.

### 3. Context Router & Uploaded Data Store
There are TWO distinct data stores:
- **Synced data** — pulled from 3rd parties (VIN Solutions leads, VAPI calls, Tavus sessions)
- **Uploaded/internal data** — user-uploaded files, Nexxus-created records (agents, tasks, calendar events, preferences)

These must remain separate. The context router decides which data source to query based on the request. Do not conflate synced CRM data with user-uploaded data.

### 4. RBAC Is Enforced at Two Levels
- **UI layer**: Role switcher changes what tiles, settings, and menu items are visible
- **Database layer**: RLS policies on every multi-tenant table enforce tenant isolation

### 5. Webhook Safety
VAPI and Tavus webhooks are live. Any existing webhook handlers must be preserved. New handlers should be additive, not replacement.

### 6. Testing Protocol
- **Voice**: Use the "Elliot" test-only VAPI agent for all voice testing
- **SMS**: Loopback to self via TextMagic API — never to real customers
- **Email**: Use `neoweaver@gmail.com` for all outbound email tests
- **Video**: Test sessions only — never production Tavus sessions
- **Per sprint**: At least 3 deltas of proof with screenshots, then full E2E

### 7. Data That Must Be Preserved
- All existing user accounts
- All existing webhook configurations
- All existing VAPI agent configurations

---

## Sprint Execution Summary

### Sprint 0 (Week 1) — Foundation
Build: Database schema (17 tables), authentication (express-session + bcrypt), RBAC middleware, RLS policies, frontend auth integration.
**Gate**: Login works, RLS isolates tenants, API calls include auth credentials.

### Sprint 1 (Weeks 2-3) — Core Features (3 parallel tracks)
- **Track A**: Agents CRUD + config pane wiring
- **Track B**: Chat + AI streaming (SSE + Claude API)
- **Track C**: Profile + Settings shell
**Gate**: Agent CRUD works, chat streams, profile edits persist.

### Sprint 2 (Weeks 4-5) — Data & Intelligence (3 parallel tracks)
- **Track D**: VIN Solutions integration (OAuth2, lead sync, 5-min cache)
- **Track E**: Metrics engine (all formulas from Constitution §5) + Dashboard + Reports + Library
- **Track F**: Hunch engine (AI-generated insights from lead data)
**Gate**: VIN leads sync, tiles show real scores, 6 reports generate correctly.

### Sprint 3 (Weeks 6-7) — Communication & Integration (3 parallel tracks)
- **Track G**: Hub (Calendar CRUD, Leads tab with VIN data, Inbox)
- **Track H**: Drive (file upload/download, S3-compatible storage)
- **Track I**: Webhook integrations (VAPI, Tavus, TextMagic) — EXERCISE EXTREME CAUTION
**Gate**: Calendar works, files upload, webhooks process events.

### Sprint 4 (Week 8) — Polish & Certification
Notifications, widgets, E2E testing, mock data removal, security audit, performance verification.
**Gate**: All acceptance criteria pass with real data, no mock data in production paths.

---

## Quick Reference: File Modifications

| What to do | Files to modify |
|---|---|
| Add database table | `shared/schema.ts` |
| Add API endpoint | `server/routes.ts` (or module-specific route file) |
| Add database operations | `server/storage.ts` |
| Add business logic | `server/services/*.ts` (new directory) |
| Add auth logic | `server/auth.ts` (new), `server/middleware.ts` (new) |
| Add webhook handler | `server/webhooks/*.ts` (new directory) |
| Replace mock data on a page | The page file in `client/src/pages/*.tsx` — change imports only |
| Add auth context | `client/src/contexts/AuthContext.tsx` (new) |
| Wire API calls | Change mock imports to `useQuery({ queryKey: ['/api/...'] })` |

---

## Your First Actions

1. Read `plan_docs/v2.1/NEW_CLAUDE.md` fully
2. Read `plan_docs/v2.1/NEW_CONSTITUTION.md` Sections 5-7 (formulas, constraints, integrations)
3. Diff the plan against `server/`, `shared/schema.ts`, and `server/routes.ts` — identify conflicts
4. Begin Sprint 0: Database schema → Authentication → RLS → Frontend auth
5. After Sprint 0, submit 3 deltas of proof with screenshots for gate review

---

## END OF PROMPT
