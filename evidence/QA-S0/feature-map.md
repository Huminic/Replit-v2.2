# Nexxus Connect v2.2 — Feature Map

Generated: 2026-03-14
Sprint: QA-S0

## Application Summary

- **22 frontend pages** (client/src/pages/*.tsx)
- **28 backend route files** (server/routes/*.ts)
- **~124 API endpoints** across 27 domain route groups
- **Router:** wouter (client/src/App.tsx)
- **Route registration:** server/routes/index.ts (27 imports)

---

## Domain 1: Authentication

**User flows:** Login, logout, password reset, token refresh, session timeout, org switching

### Pages
| Page | File | Purpose |
|------|------|---------|
| Login | client/src/pages/login.tsx | Email/password login form |
| Forgot Password | client/src/pages/forgot-password.tsx | Password reset request |
| Reset Password | client/src/pages/reset-password.tsx | Token-based password reset |

### API Endpoints
| Route file | Endpoints | Key routes |
|------------|-----------|------------|
| server/routes/auth.ts | 8 | POST /login, /register, /refresh, /logout, /forgot-password, /reset-password, /verify-token, /switch-org |

### Originating Sprints
- P2-S1: Token security — httpOnly cookies for refresh tokens
- P2-S3: Password security — SHA-256 reset tokens, strength validation
- P3-S1: Route extraction (auth routes from monolith)

### Test Priorities
- Login sets httpOnly cookie (not localStorage)
- Refresh token rotation works
- Logout clears cookie
- Password strength validation rejects weak passwords
- Reset token is hashed (SHA-256) before DB storage

---

## Domain 2: Dashboard & Main View

**User flows:** Landing page after login, role metrics, navigation hub

### Pages
| Page | File | Purpose |
|------|------|---------|
| Main | client/src/pages/main.tsx | Role-based dashboard with metrics cards |

### API Endpoints
| Route file | Endpoints | Key routes |
|------------|-----------|------------|
| server/routes/metrics.ts | 4 | GET /metrics/summary, /metrics/drilldown |
| server/routes/hunches.ts | 3 | GET /hunches (AI-generated insights) |

### Originating Sprints
- P4-S4: Metrics and hunches routes extracted from monolith

### Test Priorities
- Page loads without errors
- Role metrics display correctly
- Navigation to all sections works

---

## Domain 3: AI Agent & Chat

**User flows:** Select agent, chat with AI, streaming responses (SSE), tool execution

### Pages
| Page | File | Purpose |
|------|------|---------|
| Agents | client/src/pages/agents.tsx | Agent list + chat panel |

### API Endpoints
| Route file | Endpoints | Key routes |
|------------|-----------|------------|
| server/routes/agents.ts | 5 | GET /agents, POST /agents, GET /agents/:id, PATCH /agents/:id, DELETE /agents/:id |
| server/routes/chat.ts | 1 | POST /chat/:conversationId/stream (SSE) |
| server/routes/documents.ts | 4 | POST /documents/upload, GET /documents, DELETE /documents/:id |

### Originating Sprints
- P4-S3: Extracted agent, chat, and document routes from monolith

### Test Priorities
- Agent CRUD works
- Chat streaming (SSE) delivers responses
- Document upload and retrieval
- Tool definitions present in chat route

---

## Domain 4: Campaigns & Marketing

**User flows:** Create campaign, upload CSV, execute, monitor, kill switch

### Pages
| Page | File | Purpose |
|------|------|---------|
| Marketing | client/src/pages/marketing.tsx | Campaign management + KPIs |
| Service | client/src/pages/service.tsx | Service campaigns + KPIs |

### API Endpoints
| Route file | Endpoints | Key routes |
|------------|-----------|------------|
| server/routes/campaigns.ts | 10 | GET /campaigns, POST /campaigns, POST /:id/upload-csv, POST /:id/execute, GET /:id/execution-status, POST /:id/stop |

### Originating Sprints
- P4-S2: Extracted communication routes from monolith

### Test Priorities
- Campaign CRUD
- CSV upload and preview
- Execution start/stop (kill switch)
- Monitoring endpoint returns status
- Communication gate flag respected

---

## Domain 5: Conversations & Messaging

**User flows:** Inbox, message threads, human takeover, campaign disconnect

### Pages
| Page | File | Purpose |
|------|------|---------|
| TeamBox | client/src/pages/teambox.tsx | Unified inbox with conversation threads |
| My Work | client/src/pages/my-work.tsx | Personal task/conversation dashboard |

### API Endpoints
| Route file | Endpoints | Key routes |
|------------|-----------|------------|
| server/routes/conversations.ts | 7 | GET /conversations, POST /conversations, GET /:id/messages, PATCH /:id (takeover) |
| server/routes/notifications.ts | 4 | GET /notifications, PATCH /:id/read |
| server/routes/sms.ts | 3 | POST /sms/webhook (TextMagic), GET/POST /sms/blacklist |

### Originating Sprints
- P4-S2: Extracted communication routes from monolith

### Test Priorities
- Conversation list loads
- Messages display in thread
- Takeover toggle works
- SMS webhook receives events
- Notifications load and mark-as-read

---

## Domain 6: Department Dashboards

**User flows:** Role-specific KPI views for sales, service, marketing, management

### Pages
| Page | File | Purpose |
|------|------|---------|
| Sales | client/src/pages/sales.tsx | Sales KPIs + pipeline |
| Service | client/src/pages/service.tsx | Service KPIs + campaigns |
| Marketing | client/src/pages/marketing.tsx | Marketing KPIs + campaigns |
| Management | client/src/pages/management.tsx | Executive overview |

### API Endpoints
These pages consume metrics, campaigns, conversations, and agents endpoints (Domains 2-5).

### Originating Sprints
- P3-S2: AppContext split (UILayoutContext) — touched sales, service, marketing, agents pages

### Test Priorities
- Each page loads without errors
- KPI data displays
- Navigation between department views
- Communication gate badge displays when active

---

## Domain 7: Analytics & Insights

**User flows:** Dashboard zones, reports, metric library, AI hunches, drill-down

### Pages
| Page | File | Purpose |
|------|------|---------|
| Insights | client/src/pages/insights.tsx | Full analytics dashboard (~1800 lines) |

### API Endpoints
| Route file | Endpoints | Key routes |
|------------|-----------|------------|
| server/routes/insights.ts | 4 | GET /insights/dashboard, /insights/reports, /insights/library, /insights/drilldown |
| server/routes/hunches.ts | 3 | GET /hunches |

### Originating Sprints
- P4-S4: Extracted insights and hunches routes from monolith

### Test Priorities
- Insights page loads (complex page, most likely to have rendering issues)
- Dashboard zones render
- Metric library populates

---

## Domain 8: Billing & Entitlements

**User flows:** View plan, check usage, manage invoices, top-up credits

### Pages
| Page | File | Purpose |
|------|------|---------|
| BillingDashboard | client/src/pages/BillingDashboard.tsx | Billing overview |
| BillingUsage | client/src/pages/BillingUsage.tsx | Usage breakdown |
| BillingPlan | client/src/pages/BillingPlan.tsx | Plan management |
| BillingInvoices | client/src/pages/BillingInvoices.tsx | Invoice history |

### API Endpoints
| Route file | Endpoints | Key routes |
|------------|-----------|------------|
| server/routes/billing.ts | 7 | GET /billing/summary, /billing/usage, /billing/invoices, /billing/plan, POST /billing/topup |

### Originating Sprints
- Pre-P0 (Replit era) — billing routes were not extracted in P4, they existed separately

### Test Priorities
- Billing pages load
- Summary endpoint returns data
- Entitlement checks work (fail-closed per P2-S0)

---

## Domain 9: Settings & Profile

**User flows:** System settings, user profile, organization config

### Pages
| Page | File | Purpose |
|------|------|---------|
| Settings | client/src/pages/settings.tsx | System-wide configuration |
| Profile | client/src/pages/profile.tsx | User profile management |
| Org Wizard | client/src/pages/org-wizard.tsx | 7-step organization setup |

### API Endpoints
| Route file | Endpoints | Key routes |
|------------|-----------|------------|
| server/routes/settings.ts | 2 | GET /settings, PATCH /settings |
| server/routes/users.ts | 8 | GET /users/me, PATCH /users/:id |
| server/routes/organizations.ts | 5 | GET /organizations, POST /organizations, PATCH /:id |
| server/routes/roles.ts | 1 | GET /roles |

### Originating Sprints
- P4-S1: Extracted org, user, and role routes
- P4-S4: Extracted settings routes

### Test Priorities
- Settings page loads
- Profile update works
- Organization CRUD
- Communication gate toggle in settings

---

## Domain 10: Tasks & Appointments

**User flows:** Task management, calendar events, scheduling

### Pages
Consumed within My Work and department dashboards (no dedicated page).

### API Endpoints
| Route file | Endpoints | Key routes |
|------------|-----------|------------|
| server/routes/tasks.ts | 4 | GET /tasks, POST /tasks, PATCH /:id, DELETE /:id |
| server/routes/appointments.ts | 5 | GET /appointments, POST /appointments, PATCH /:id, DELETE /:id |

### Originating Sprints
- P4-S4: Extracted from monolith

### Test Priorities
- Task CRUD endpoints respond
- Appointment CRUD endpoints respond

---

## Domain 11: Integrations & External

**User flows:** Webhook handling, CRM sync, external API proxy, public widgets

### Pages
| Page | File | Purpose |
|------|------|---------|
| Widget Landing | client/src/pages/widget-landing.tsx | Public-facing widget with VAPI |
| Usage | client/src/pages/usage.tsx | Outbound communication log |

### API Endpoints
| Route file | Endpoints | Key routes |
|------------|-----------|------------|
| server/routes/webhooks.ts | 3 | POST /webhooks/inbound |
| server/routes/sync.ts | 7 | POST /sync/crm, /sync/calendar, /sync/contacts |
| server/routes/integrations.ts | 2 | GET /integrations, PATCH /integrations |
| server/routes/proxy.ts | 5 | Vendor API relay (VAPI, Tavus) |
| server/routes/public.ts | 8 | Public widget endpoints (no auth) |
| server/routes/usage.ts | 4 | GET /usage/events, /usage/summary |
| server/routes/favorites.ts | 3 | GET /favorites, POST /favorites, DELETE /:id |
| server/routes/widgets.ts | 6 | Widget CRUD, video sessions |

### Originating Sprints
- P4-S4: Extracted from monolith

### Test Priorities
- Public widget endpoints work without auth
- Webhook inbound accepts POST
- Usage events load

---

## Domain 12: Infrastructure & Security (Non-UI)

**User flows:** None (backend-only). Affects all requests.

### Components
| Component | File | Purpose |
|-----------|------|---------|
| Health | server/routes/health.ts | GET /api/health |
| Security middleware | server/index.ts | Helmet, rate limiting, trust proxy, request ID |
| Token management | server/auth.ts | Cookie helpers, JWT verification |
| Scheduler | server/services/scheduler.ts | Campaign timers, trigger evaluation |
| Entitlement guard | server/middleware/entitlementCheck.ts | Fail-closed entitlement check |
| Validation middleware | server/middleware/validate.ts | Zod-based request validation |

### Originating Sprints
- P0-S5: Trust proxy fix
- P1-S1: Health endpoint
- P2-S0: Security middleware stack
- P2-S1: Token security (httpOnly cookies)
- P2-S2: XSS and input sanitization
- P3-S0: Scheduler extraction

### Test Priorities
- Health endpoint returns 200 with correct shape
- Security headers present (Helmet)
- Rate limiting works
- httpOnly cookie set on login

---

## Not Found

| Page | File | Purpose |
|------|------|---------|
| Not Found | client/src/pages/not-found.tsx | 404 fallback |

---

## Coverage Verification

### All 22 pages mapped:
login, forgot-password, reset-password, main, agents, marketing, service, sales, management, teambox, my-work, insights, BillingDashboard, BillingUsage, BillingPlan, BillingInvoices, settings, profile, org-wizard, widget-landing, usage, not-found

### All 27 route groups mapped:
auth, health, users, roles, organizations, campaigns, conversations, notifications, sms, agents, chat, documents, tasks, appointments, favorites, widgets, hunches, metrics, settings, integrations, sync, insights, webhooks, public, proxy, usage, billing

### Unmapped route file:
- server/routes/index.ts — route registration hub, not a domain
