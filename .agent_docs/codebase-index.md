# Nexxus Connect — Codebase Index
**Last updated:** 2026-03-09

---

## Server

| File | Purpose |
|------|---------|
| `server/index.ts` | Express server entry point, starts on port 5000 |
| `server/auth.ts` | JWT authentication — access/refresh tokens, authenticateToken/requireRole middleware |
| `server/routes.ts` | All API routes (auth, CRUD, metrics, webhooks, public endpoints) |
| `server/storage.ts` | DatabaseStorage — Drizzle ORM CRUD for all 22 tables |
| `server/seed.ts` | Test data seeding: 8 roles, 6 orgs, 8+ users, agents, sample data, Durran Cage partner account |
| `server/outbound.ts` | Outbound engine — 5-layer CommGate safety, TextMagic SMS, Resend email, VAPI phone, usage logging |
| `server/vendorProxy.ts` | VinSolutions MCP integration — org mapping, lead queries, sales summary, backfill |
| `server/statusClassifier.ts` | VIN lead status family mapper (active/new/sold/lost/bad/service/non_customer) |
| `server/sync.ts` | Sync scheduler — 4h metrics during business hours, 2AM ET daily delta |
| `server/braveSearch.ts` | Brave Search API integration for web search |
| `server/static.ts` | Static file serving |
| `server/vite.ts` | Vite dev server integration |

## Shared

| File | Purpose |
|------|---------|
| `shared/schema.ts` | All 22 Drizzle tables, insert schemas (drizzle-zod), TypeScript types |

## Client — Pages

| File | Purpose | Functional Area |
|------|---------|----------------|
| `client/src/pages/main.tsx` | AI Chat with CRM Guru mode, 4 metric tiles, thinking cards | Area 1 |
| `client/src/pages/teambox.tsx` | TeamBox 3-column layout: filters, conversation list, chat, customer info | Area 3 |
| `client/src/pages/sales.tsx` | Sales dashboard — 7 metric tiles, Agents tab, Calendar tab | Area 6 |
| `client/src/pages/service.tsx` | Service dashboard — 6 tiles, Agents, Campaigns (with kill switch), Calendar | Area 2/6 |
| `client/src/pages/marketing.tsx` | Marketing dashboard — 4 tiles, Agents, Campaigns, Studio, Insights | Area 2/6 |
| `client/src/pages/management.tsx` | Management KPIs — 6 tiles, Hunches, Activities, ROI | Area 6 |
| `client/src/pages/insights.tsx` | Insights — dashboard + reports with store selector for cross-store | Area 6 |
| `client/src/pages/my-work.tsx` | Personal dashboard, task list, chat/assistant tabs | Area 1 |
| `client/src/pages/settings.tsx` | Org settings, widget config, calendar connectors, communication gate | Area 5 |
| `client/src/pages/agents.tsx` | Agent management and configuration | Area 3 |
| `client/src/pages/profile.tsx` | User profile page | Area 5 |
| `client/src/pages/usage.tsx` | Usage metering display (Org Admin+) | Area 2 |
| `client/src/pages/billing-management.tsx` | Billing management (partner admin) | Area 2 |
| `client/src/pages/widget-landing.tsx` | Public landing page — 4-channel widget, no auth required | Area 4 |
| `client/src/pages/org-wizard.tsx` | Organization creation wizard (super admin only) | Area 5 |
| `client/src/pages/login.tsx` | Login page | — |
| `client/src/pages/forgot-password.tsx` | Forgot password flow | Area 2 |
| `client/src/pages/reset-password.tsx` | Reset password flow | Area 2 |
| `client/src/pages/not-found.tsx` | 404 page | — |

## Client — Components

| File | Purpose | Functional Area |
|------|---------|----------------|
| `client/src/components/layout/AppLayout.tsx` | Master layout — TopBar + Sidebar + SubMenu + main + RightPane | Area 1 |
| `client/src/components/layout/Sidebar.tsx` | Left sidebar (72px) — nav icons, toggle button, lock/popout | Area 1 |
| `client/src/components/layout/SubMenuManager.tsx` | Flyout submenu — inline when locked, fixed when popout, 60s auto-revert | Area 1 |
| `client/src/components/layout/TopBar.tsx` | Top bar — org switcher, activity feed, profile menu | Area 1 |
| `client/src/components/layout/RightPane.tsx` | Right pane — Automa AI chat for data-display pages | Area 1 |
| `client/src/components/layout/FavoritesBar.tsx` | Favorites bar in submenu | Area 1 |
| `client/src/components/layout/SubMenuPanel.tsx` | Submenu panel content renderer | Area 1 |
| `client/src/components/layout/MobileNavDropdown.tsx` | Mobile navigation dropdown | Area 1 |
| `client/src/components/layout/MobileSidebar.tsx` | Mobile sidebar | Area 1 |
| `client/src/components/AgentConfigPane.tsx` | Agent configuration panel (right pane for /agents) | Area 3 |
| `client/src/components/AppointmentCalendar.tsx` | Calendar grid with manual appointment creation | Area 5 |
| `client/src/components/MarkdownMessage.tsx` | Markdown rendering for chat messages | Area 1 |
| `client/src/components/ErrorBoundary.tsx` | React error boundary | — |
| `client/src/components/auth/ProtectedRoute.tsx` | Auth route guard | — |
| `client/src/components/auth/SessionTimeoutDialog.tsx` | Session timeout dialog | — |

## Client — State & Utilities

| File | Purpose |
|------|---------|
| `client/src/App.tsx` | Route definitions, providers, auth wrapper |
| `client/src/contexts/AppContext.tsx` | App-wide state: auth, org, role, panels, favorites, persona |
| `client/src/lib/queryClient.ts` | TanStack Query client with auth header injection |

## Scripts

| File | Purpose |
|------|---------|
| `scripts/enforcer.ts` | Compliance scanner — dropped features, credentials, kill switch defaults |

## Governance Docs

| File | Purpose | Status |
|------|---------|--------|
| `PLAN.md` | Implementation plan — historical wave reference + functional area mapping | Active |
| `replit.md` | Agent memory — architecture, functional areas, technical facts | Active |
| `ACCEPTANCE_CRITERIA.md` | Canonical 62 ACs — owner-controlled, read-only | Active |
| `.agent_docs/acceptance_criteria.md` | Derived AC verification layer | Active (read-only) |
| `CLAUDE.md` | Agent governance rules | Active |
| `SPEC.md` | Architecture facts, MCP tools, kill switch schema, RBAC | Active |
| `PRD.md` | Product requirements | Active |
| `SRS.md` | System behavior requirements (17 sections) | Active |
| `GAPS.md` | Known gaps tracker | Active |
| `ISSUES.md` | Issue tracker | Active |
| `Sprint_log.md` | Sprint history log | Historical |
