# Nexxus Connect -- Implementation Plan (4-Wave)

**Version:** 2.2
**Date:** 2026-03-03
**Status:** Active -- Wave 1 in progress
**Cross-References:** [PRD.md](./PRD.md) | [SRS.md](./SRS.md) | [SPEC.md](./SPEC.md) | [ACCEPTANCE_CRITERIA.md](./ACCEPTANCE_CRITERIA.md) | [CLAUDE.md](./CLAUDE.md)

---

## 1. Plan Overview

Nexxus Connect is delivered in four waves, each building on the previous. The current UI prototype serves as the design reference for all waves. Mock data is replaced incrementally as backend services come online.

### Wave Summary

| Wave | Theme | Duration | Status |
|------|-------|----------|--------|
| Wave 1 | UI Prototype & Navigation Restructure | 2 weeks | **Complete** |
| Wave 2 | Backend Foundation & Core API Wiring | 3 weeks | Not Started |
| Wave 3 | Data Integration & Intelligence Engine | 3 weeks | Not Started |
| Wave 4 | Communication, Studio & Polish | 2 weeks | Not Started |

---

## 2. Wave 1 -- UI Prototype & Navigation Restructure

**Goal:** Restructure navigation from feature-based (Main/Insights/Agents/Hub/Drive) to persona/department-based (AI Chat/TeamBox/My Work/Sales/Service/Marketing/Management). Build all page shells with mock data. Establish the complete visual contract.

**Status:** Complete

### 2.1 Completed Items

| Item | Description | Files |
|------|-------------|-------|
| Sidebar navigation | Replaced menu items with AI Chat, TeamBox, My Work, Sales, Service, Marketing, Management, System | `Sidebar.tsx` |
| Route structure | Added routes for `/teambox`, `/my-work`, `/sales`, `/service`, `/marketing`, `/management` | `App.tsx` |
| SubMenuManager rewrite | Panel cases for all new sections with nav items, agent lists, search | `SubMenuManager.tsx` |
| AI Chat page | Main page with role-based metric tiles, thinking cards, persona name from org config | `main.tsx` |
| TeamBox page | CommBox-inspired 3-column layout: filters, conversation list, chat thread, customer info panel | `teambox.tsx` |
| Sales page | Dashboard with 7 metric tiles, Agents tab with agent cards, Insights/Calendar placeholders | `sales.tsx` |
| Service page | Dashboard with 6 metric tiles, Agents tab, Campaigns tab with table and kill switch, Insights/Calendar | `service.tsx` |
| Marketing page | Dashboard with 4 metric tiles, Agents tab, Campaigns tab with table and kill switch, Studio placeholder, Insights | `marketing.tsx` |
| Management page | Dashboard with 6 KPI tiles, Hunches tab with AI pattern cards, Activities tab, ROI placeholder | `management.tsx` |
| My Work page | Personal dashboard, task list, chat/assistant placeholders | `my-work.tsx` |
| Mock data: conversations | TeamBox conversation mock data with channels, statuses, messages | `mocks/conversations.ts` |
| Mock data: campaigns | Campaign mock data with messages, CSV references, kill switch state | `mocks/campaigns.ts` |
| Mock data: agents | Agents tagged by department (sales/service/marketing) | `mocks/agents.ts` |
| AppContext updates | Persona name, communication gate, panel IDs, favorites, selectedAgent | `AppContext.tsx` |
| RBAC gating | Section access by role, sidebar item visibility, settings tile visibility | `users.ts`, `Sidebar.tsx` |
| Widget configuration | Table layout with embed codes, search, widget type cards, accordion config | `settings.tsx` |
| Landing page | Simplified `/w/demo` route | `widget-landing.tsx` |
| Campaign kill switch | Per-campaign toggle in Service and Marketing campaigns tabs | `service.tsx`, `marketing.tsx` |
| Communication gate | Global toggle in Settings to pause all outbound automated communications | `settings.tsx`, `AppContext.tsx` |
| Right pane rules | Chat-center pages get info pane; data-center pages get Automa chat pane | `AppLayout.tsx`, `RightPane.tsx` |
| Settings: full sections | Users, Organization, Tools, Knowledge, AI Config, Security, Notifications, Data, Appearance, Billing | `settings.tsx` |
| Profile page | Personal info, preferences, billing tabs | `profile.tsx` |
| Billing management | Dedicated billing page at `/settings/billing` | `billing-management.tsx` |
| Org wizard | Organization creation wizard at `/settings/org-wizard` | `org-wizard.tsx` |
| Removed features | Drive, standalone Activity, standalone Agents creation, Skills standalone | Cleanup pass |

### 2.2 Active Work

| Item | Description | Status |
|------|-------------|--------|
| Documentation suite | CLAUDE.md, PRD.md, SRS.md, SPEC.md, PLAN.md, ACCEPTANCE_CRITERIA.md | Complete |
| Screenshot validation | Visual regression screenshots across roles, themes, viewports | Complete (E2E tests) |
| replit.md update | Reflect v2.2 navigation and architecture | Complete |
| Automa→personaName fix | Replaced all hardcoded "Automa" with dynamic personaName from org config | Complete |
| Codebase cleanup | Removed attached_assets/ (85MB), plan_docs/ (260KB), docs/ (8KB), fixed dangling refs | Complete |
| Auth file extraction | Login, forgot/reset password, AuthContext, ProtectedRoute from v2.1 zip (not wired yet) | Complete |
| Real agent data | 5 Serra Auto Group agents with VAPI+Tavus, channels[], dealership fields | Complete |

### 2.3 Wave 1 Completion Criteria

- [x] All 7 sidebar sections render with correct icons and RBAC gating
- [x] All section pages render their dashboards with metric tiles
- [x] Tab switching works within all section pages
- [x] TeamBox 3-column layout renders with conversation list, chat thread, customer info
- [x] Campaign tables render in Service and Marketing with kill switch toggles
- [x] Communication gate toggle visible in Settings
- [x] Right pane content follows cardinal layout rules (chat-center vs data-center)
- [x] Role switcher changes metric tiles on AI Chat page and hides/shows sidebar items
- [x] Sub-menu panels show correct nav items for each section
- [x] Widget configuration table and accordion sections render in Settings
- [x] No console errors, no broken imports, no dead routes
- [x] Documentation suite complete and internally consistent
- [x] replit.md updated to reflect current state

---

## 3. Wave 2 -- Backend Foundation & Core API Wiring

**Goal:** Establish authentication, database schema, RLS policies, and wire core CRUD operations to replace mock data with real API calls.

**Status:** Not Started

### 3.1 Planned Items

| Item | Description | Dependencies |
|------|-------------|--------------|
| Database schema | Define tables: users, organizations, sessions, agents, conversations, messages | None |
| Authentication | JWT auth with login/logout, session management, RBAC middleware | Schema |
| Frontend auth | AuthContext, login page, protected routes, credential forwarding | Auth API |
| RLS & multi-tenancy | Row-level security policies, org context per request | Schema, Auth |
| Agent CRUD API | GET/POST/PATCH/DELETE /api/agents with role-based access | Auth |
| Agent UI wiring | Replace mock agent data with TanStack Query fetches | Agent API |
| Chat API | Conversations and messages CRUD, SSE streaming for AI responses | Auth |
| Chat UI wiring | Replace mock chat in main.tsx and RightPane with API data | Chat API |
| User/profile API | GET/PATCH user profile, preferences persistence | Auth |
| Settings API | Settings CRUD with role-based visibility | Auth |
| Organization API | Org profile, branding, persona name persistence | Auth |
| Kill switch backend schema | Add `outbound_enabled`, `sms_enabled`, `phone_enabled`, `email_enabled` columns to organizations table. Add enforcement in MCP proxy | Schema |
| Consolidated DB schema doc | Document all 53 production tables, columns, and RLS policies as Wave 2 reference | None |
| API contract documentation | Map production backend's 35+ route files to request/response shapes for frontend wiring | None |

### 3.2 Wave 2 Completion Criteria

- [ ] Login/logout flow works end-to-end
- [ ] RLS policies enforce tenant isolation
- [ ] Agent list loads from API (create/edit/delete functional)
- [ ] AI chat streams responses via SSE with real Claude integration
- [ ] Chat history persisted in database
- [ ] User profile edits save to database
- [ ] Settings visibility matches authenticated role
- [ ] Organization data flows from API (not mock)
- [ ] Kill switch backend columns exist and are enforced by MCP proxy
- [ ] Consolidated DB schema doc covers all 53 tables
- [ ] API contract doc covers all endpoints needed for Wave 2 features
- [ ] All mock imports removed for wired features

---

## 4. Wave 3 -- Data Integration & Intelligence Engine

**Goal:** Integrate VIN Solutions CRM data, build the metrics computation engine, implement hunches, and wire all dashboard tiles to real computed values.

**Status:** Not Started

### 4.1 Planned Items

| Item | Description | Dependencies |
|------|-------------|--------------|
| VIN Solutions client | OAuth2 API client, lead sync service, 5-minute sync scheduler | Wave 2 Auth |
| Leads table & API | Lead CRUD, pipeline health endpoint, source tagging | VIN client |
| Metric engine | All metric formulas from Constitution, time-bucketed caching | Leads data |
| Main page tile wiring | Role-specific tile computations from real lead data | Metric engine |
| Tile detail modals | Breakdown rows with sub-details and Key Insights from real data | Metric engine |
| Dashboard wiring | Sales/Service/Marketing/Management dashboards with real metrics | Metric engine |
| Insights library | Full metrics library (91+ metrics) with category filters and search | Metric engine |
| Reports engine | 6 priority reports computed from VIN lead data | Leads data |
| Hunch engine | AI-powered pattern detection using Claude, confidence scoring | Leads data |
| Hunch scheduling | Weekly generation (Monday 6AM) with lifecycle tracking | Hunch engine |
| TeamBox API wiring | Real conversation data, real-time message updates | Wave 2 Chat API |
| Campaign API | Campaign CRUD, CSV upload, message scheduling, kill switch persistence | Wave 2 Auth |

### 4.2 Wave 3 Completion Criteria

- [ ] VIN Solutions leads sync correctly on 5-minute schedule
- [ ] Main page metric tiles show real computed scores per role
- [ ] Tile detail modals show real breakdown data with Key Insights
- [ ] All section dashboards show real-time metrics
- [ ] Reports generate correct data from VIN leads
- [ ] Hunches generate from AI analysis with confidence scores
- [ ] Campaign CRUD works with CSV upload and kill switch
- [ ] TeamBox shows real conversations with filtering
- [ ] No mock data remains for any wired feature

---

## 5. Wave 4 -- Communication, Studio & Polish

**Goal:** Wire external communication integrations (VAPI voice, Tavus video, TextMagic SMS, email), build the Marketing Studio placeholder, implement notifications/activity system, widget backend, and run full E2E certification.

**Status:** Not Started

### 5.1 Planned Items

| Item | Description | Dependencies |
|------|-------------|--------------|
| VAPI webhook handler | Voice call webhook processing with idempotency guards | Wave 2 Auth |
| Tavus webhook handler | Video session webhook with HMAC verification | Wave 2 Auth |
| TextMagic integration | SMS send/receive, campaign message delivery | Wave 3 Campaigns |
| Email integration | Outbound email via Resend, template rendering | Wave 2 Auth |
| Communication gate backend | Global toggle persisted, enforced on all outbound channels | Wave 3 Campaigns |
| Notification system | Real-time notifications from webhook events, in-app + email delivery | Webhooks |
| Activity logging | System-wide audit log of admin actions | Wave 2 Auth |
| Widget backend | Widget CRUD API, embed code generation, landing page dynamic config | Wave 2 Auth |
| Marketing Studio | Placeholder UI for video/image/podcast creation tools | None |
| Calendar integration | Calendar events CRUD with appointment scheduling | Wave 2 Auth |
| Mock data removal | Remove all mock imports, delete mock files, skeleton loading states | All APIs wired |
| E2E testing | Playwright tests against all pages with real data | All features |
| Security audit | RLS verification, auth testing, input validation, XSS/CSRF checks | All features |
| Performance testing | API response times (<200ms p95), LCP (<2.5s) | All features |

### 5.2 Wave 4 Completion Criteria

- [ ] VAPI webhooks create correct records (verified via Elliot test agent)
- [ ] Tavus HMAC verification works
- [ ] SMS messages trigger AI responses via Claude (loopback testing)
- [ ] Communication gate prevents all outbound when disabled
- [ ] Notifications appear in TopBar bell from real events
- [ ] Activity feed shows real system actions
- [ ] Widget CRUD works with 4 widget types + 7-channel FAB on landing pages
- [ ] Marketing Studio placeholder renders
- [ ] No mock data in production code
- [ ] All acceptance criteria verified with real data
- [ ] Security audit passed
- [ ] Performance targets met
- [ ] E2E Playwright tests pass

---

## 6. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| VIN Solutions API access limited (17/30 endpoints blocked) | Cannot display full pipeline data | Confirmed | Use accessible endpoints only (leads, contacts, statuses, sources). Be transparent about data boundaries. |
| Claude API rate limits during hunch generation | Delayed hunch delivery | Medium | Queue-based generation with retry logic, weekly batch instead of real-time |
| SSE streaming complexity | Chat features delayed | Low | Start with polling fallback, upgrade to SSE |
| RLS variable name mismatch (`current_organization_id` vs `current_org_id`) | Potential cross-tenant data leak | Confirmed (known bug) | Fix SecureQueryBuilder to use correct variable name in Wave 2 |
| Excel upload records polluting metrics | Inflated numbers in dashboards | Confirmed (known bug) | Always exclude `source = 'excel_upload'` from lead queries |
| Live VAPI/Tavus webhooks in production | Breaking existing customers | High impact | Preserve existing handler logic, test via Elliot agent only, never modify without approval |
| SET LOCAL without transaction | Connection pool contamination | Medium | Wrap all RLS set operations in proper transactions in Wave 2 |

---

## 7. Testing Protocol

### Per-Wave Requirements

- **Wave 1:** Visual regression screenshots across 4 roles, 2 themes (light/dark), 3 viewports (desktop, tablet, mobile). All pages navigable without errors.
- **Wave 2:** API integration tests for all CRUD endpoints. Auth flow E2E test. RLS isolation verification.
- **Wave 3:** Metric computation verification against known test data. VIN sync correctness tests. Hunch generation quality checks.
- **Wave 4:** Full E2E Playwright suite. Security audit. Performance benchmarks. Three proofs per feature (config, functional, visual).

### Test Data Rules

- SMS testing: TextMagic API loopback (send to self)
- Email testing: Use `neoweaver@gmail.com` for all outbound
- Voice testing: Use "Elliot" test-only VAPI agent
- Video testing: Test sessions only, never production Tavus sessions
- Lead data: Exclude `source = 'excel_upload'` from all queries

---

## 8. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-03 | Restructure nav from feature-based to department-based | Better matches dealership organizational structure and user mental models |
| 2026-03-03 | Remove Drive as standalone feature | Artifacts generated by AI stored contextually, not in a separate file system |
| 2026-03-03 | Remove standalone Agent creation for non-Super Admin | Agent config is an admin function, not a daily workflow for staff |
| 2026-03-03 | Add campaign kill switch UI | Direct response to spam incident -- users need immediate control over outbound communications |
| 2026-03-03 | Add global communication gate | Master toggle to prevent ALL automated outbound -- safety net for the organization |
| 2026-03-03 | Nest agents within department sections | Agents belong to departments (sales/service/marketing), not a standalone global list |
| 2026-03-03 | TeamBox as dedicated CommBox-inspired page | Unified inbox for all customer conversations across channels, replacing fragmented inbox |
| 2026-03-03 | Marketing Studio as Wave 4 placeholder | Video/image/podcast creation is a future capability, not MVP |
| 2026-03-04 | Expand RBAC from 4 to 8 roles | Department-specific roles (sales, service, marketing) + executive and sales_manager replace generic org_staff. Better matches dealership org structure |
| 2026-03-04 | Add kill switch backend spec to Wave 2 | DB columns + MCP enforcement required before any outbound wiring |
