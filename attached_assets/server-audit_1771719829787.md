# Nexxus V2 Server Layer Audit

**Audit Date:** 2026-02-21
**Auditor:** Claude Opus 4.6 (forensic code audit)
**Scope:** Complete server layer -- routes, services, middleware, webhooks, jobs, integrations, auth, error handling
**Codebase Path:** `/home/ubuntu/Claude-store/nexxus-v2/server/`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Route Files and Endpoints](#2-route-files-and-endpoints)
3. [Services Layer](#3-services-layer)
4. [Middleware Stack](#4-middleware-stack)
5. [Webhook Handlers](#5-webhook-handlers)
6. [Scheduled Jobs](#6-scheduled-jobs)
7. [Third-Party Integrations](#7-third-party-integrations)
8. [Authentication and Authorization Flow](#8-authentication-and-authorization-flow)
9. [Error Handling Patterns](#9-error-handling-patterns)
10. [Database Layer](#10-database-layer)
11. [Security Assessment](#11-security-assessment)
12. [Observations and Recommendations](#12-observations-and-recommendations)

---

## 1. Executive Summary

### Quantitative Overview

| Component | Count |
|-----------|-------|
| Route files | 34 |
| Total API endpoints | ~185 |
| Service files | 36 (+ 4 sub-services in contextRouter/, sync/, notifications/) |
| Middleware modules | 3 (auth, enforceOrganizationContext, validateResourceOwnership) |
| Webhook handlers | 2 (VAPI, Tavus) + 1 signature verifier utility |
| Scheduled jobs | 8 |
| Third-party integrations | 7 (VIN Solutions, VAPI, Tavus, Resend, TextMagic, Claude API, Google Calendar) |
| Database tables | 36+ |
| RLS policies | 53+ |

### Architecture Pattern

- **Framework:** Express.js with TypeScript
- **Server:** HTTP server on configurable PORT (default 5000)
- **Database:** PostgreSQL via `pg` Pool (Supabase-hosted)
- **Authentication:** JWT (access + refresh tokens)
- **Authorization:** 4-tier RBAC (Super Admin, Partner Admin, Org Admin, Staff)
- **Multi-tenancy:** Row-Level Security (RLS) via PostgreSQL session variables
- **Real-time:** SSE (Server-Sent Events) for AI streaming, no WebSocket in active use
- **File uploads:** Multer (in-memory, max 50MB)
- **Email:** IMAP/SMTP via ImapFlow + Nodemailer; transactional via Resend
- **Encryption:** AES-256-GCM for secrets at rest

---

## 2. Route Files and Endpoints

### 2.1 Route Registration Order

All routes are registered in `/home/ubuntu/Claude-store/nexxus-v2/server/routes.ts`. The registration order matters for Express path matching:

```
1.  /api/webhooks/vapi         (before body parsers)
2.  /api/webhooks/tavus        (raw body capture for HMAC)
3.  /api/auth
4.  /api/vin
5.  /api/integrations
6.  /api/insights
7.  /api/agents
8.  /api/credits
9.  /api/tasks
10. /api/appointments
11. /api/conversations
12. /api/admin
13. /api/admin/knowledge
14. /api/settings
15. /api/email
16. /api/user/integrations
17. /api/dealerbrain
18. /api/notifications
19. /api/sms
20. /api/widgets/public        (before /api/widgets)
21. /api/widgets
22. /api/inbox
23. /api/tracking
24. /api/triggers
25. /api/activity
26. /api/goals
27. /api/reports
28. /api/drive
29. /api/hunches
30. /api/approvals
31. /api/leads
32. /api/dashboard
33. /api/metrics
34. /api (google-calendar routes)
35. /api/hosted-pages
36. /api/pages                 (hosted pages public)
37. /api/health                (health check)
```

### 2.2 Complete Endpoint Catalog

#### Auth Routes (`/api/auth`) -- 9 endpoints
**File:** `server/routes/auth.ts`

| Method | Path | Auth | RBAC | Rate Limit | Purpose |
|--------|------|------|------|------------|---------|
| POST | /login | None | None | 30/min | User login, returns JWT pair |
| POST | /logout | JWT | Any | None | Invalidates refresh token |
| POST | /refresh | None | None | None | Refresh access token |
| POST | /switch-org | JWT | Partner Admin+ | None | Switch active organization |
| POST | /register | JWT | Super Admin | 5/hr | Create new user |
| GET | /me | JWT | Any | None | Get current user profile |
| PUT | /me | JWT | Any | None | Update own profile |
| POST | /forgot-password | None | None | 3/hr | Request password reset |
| POST | /reset-password | None | None | None | Reset password with token |

**Notable:** Registration sends welcome email (Resend) and welcome SMS (TextMagic). Org switches create audit log entries.

#### Admin Routes (`/api/admin`) -- 14 endpoints
**File:** `server/routes/admin.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | /users | JWT | Super Admin | List all users |
| GET | /users/:id | JWT | Super Admin | Get user details |
| PUT | /users/:id | JWT | Super Admin | Update user |
| DELETE | /users/:id | JWT | Super Admin | Soft-delete user (status=inactive) |
| GET | /organizations | JWT | Super Admin | List organizations |
| GET | /organizations/:id | JWT | Super Admin | Get org details |
| POST | /organizations | JWT | Super Admin | Create organization |
| PUT | /organizations/:id | JWT | Super Admin | Update organization |
| DELETE | /organizations/:id | JWT | Super Admin | Soft-delete org (cascades user deactivation) |
| GET | /partner-links | JWT | Super Admin | List partner-org links |
| POST | /partner-links | JWT | Super Admin | Create partner-org link |
| DELETE | /partner-links/:id | JWT | Super Admin | Delete partner-org link (hard) |
| GET | /roles | JWT | Super Admin | List roles |
| GET | /locations | JWT | Super Admin | List locations |

**Notable:** All operations create audit log entries with IP and user-agent. Uses database transactions for updates.

#### Agent Routes (`/api/agents`) -- 9 endpoints
**File:** `server/routes/agents.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | / | JWT | Any | List org agents |
| GET | /stats | JWT | Any | Agent statistics |
| POST | /seed | JWT | Org Admin+ | Seed default agents (idempotent) |
| GET | /:id | JWT | Any | Get single agent |
| POST | / | JWT | Org Admin+ | Create agent |
| PUT | /:id | JWT | Org Admin+ | Update agent |
| DELETE | /:id | JWT | Org Admin+ | Delete agent (blocks Automa) |
| POST | /:id/duplicate | JWT | Org Admin+ | Duplicate agent (blocks Automa) |
| PUT | /:id/status | JWT | Org Admin+ | Toggle agent status |

**Notable:** Default seed includes Automa, Sales Coach, Message Crafter, and a VAPI voice agent. Automa cannot be deleted or duplicated.

#### Appointment Routes (`/api/appointments`) -- 10 endpoints
**File:** `server/routes/appointments.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | / | JWT | Any | List appointments |
| GET | /calendar | JWT | Any | FullCalendar format events |
| GET | /stats | JWT | Any | Appointment statistics |
| GET | /:id | JWT | Any | Get appointment |
| POST | / | JWT | Any | Create appointment |
| PUT | /:id | JWT | Any | Update appointment |
| POST | /:id/cancel | JWT | Any | Cancel appointment |
| GET | /:id/confirmation-token | JWT | Org Admin+ | Generate confirmation link |
| POST | /:id/confirm | None | None | Confirm via signed JWT (public) |
| DELETE | /:id | JWT | Org Admin+ | Delete appointment + Google Calendar event |

**Notable:** Public confirmation endpoint uses a special JWT with 48h expiry and `nexxus-appointment` audience.

#### Approval Routes (`/api/approvals`) -- 5 endpoints
**File:** `server/routes/approvals.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | / | JWT | Any | List approvals |
| GET | /stats | JWT | Any | Approval statistics |
| GET | /:id | JWT | Any | Get single approval |
| POST | / | JWT | Any | Create approval request |
| PUT | /:id/resolve | JWT | Any | Approve or reject |

#### Activity Routes (`/api/activity`) -- 6 endpoints
**File:** `server/routes/activity.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | / | JWT | Any (Staff=own) | List AI usage events |
| GET | /stats | JWT | Org Admin+ | Usage statistics |
| GET | /recent | JWT | Any | Recent 20 events (TopBar) |
| GET | /artifacts | JWT | Any | Artifact-generated events |
| GET | /artifacts/:conversationId | JWT | Any | Artifacts by conversation |
| GET | /export/csv | JWT | Org Admin+ | Export events as CSV |

**Notable:** Staff users (roleLevel 4) can only see their own events. Org Admin+ sees all org events.

#### Conversation Routes (`/api/conversations`) -- 11 endpoints
**File:** `server/routes/conversations.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | / | JWT | Any | List conversations |
| POST | / | JWT | Any | Create conversation |
| GET | /suggestions | JWT | Any | AI suggestions |
| GET | /:id | JWT | Any | Get conversation |
| PUT | /:id | JWT | Any | Update conversation |
| DELETE | /:id | JWT | Any | Delete conversation |
| GET | /:id/messages | JWT | Any | Get messages |
| POST | /:id/messages | JWT | Any | Send message (gets AI response) |
| POST | /:id/stream | JWT | Any | SSE streaming AI response |
| POST | /:id/upload | JWT | Any | Upload file to conversation (50MB) |
| POST | /upload | JWT | Any | Upload + create new conversation |

**Notable:** Uses Multer for file uploads (50MB limit). Supports PDF content extraction via `pdf-parse`. SSE streaming via DealerBrainStreamingService. Activity events logged fire-and-forget.

#### Credit Routes (`/api/credits`) -- 5 endpoints
**File:** `server/routes/credits.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | /balance | JWT | Any | Credit balance |
| GET | /usage | JWT | Org Admin+ | Usage report |
| GET | /policies | JWT | Org Admin+ | Credit policies |
| GET | /recent | JWT | Any | Recent usage |
| GET | /summary | JWT | Org Admin+ | Usage summary |

#### Dashboard Routes (`/api/dashboard`) -- 1 endpoint
**File:** `server/routes/dashboard.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | / | JWT | Any | Command Center data |

#### DealerBrain Config Routes (`/api/dealerbrain`) -- 3 endpoints
**File:** `server/routes/dealerbrain.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | /config | JWT | Super Admin | Get AI config |
| PUT | /config | JWT | Super Admin | Update AI config |
| POST | /config/reset | JWT | Super Admin | Reset to defaults |

#### Drive Routes (`/api/drive`) -- 8 endpoints
**File:** `server/routes/drive.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | / | JWT | Any | List files/folders |
| GET | /usage | JWT | Any | Storage usage |
| POST | /folders | JWT | Any | Create folder |
| POST | /upload | JWT | Any | Upload file (50MB, 1GB quota) |
| GET | /files/:id/download | JWT | Any | Download file |
| PUT | /:type/:id/rename | JWT | Any | Rename file/folder |
| DELETE | /files/:id | JWT | Any | Delete file |
| DELETE | /folders/:id | JWT | Any | Delete folder |

#### Email Routes (`/api/email`) -- 7 endpoints
**File:** `server/routes/email.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | /folders | JWT | Any | List email folders |
| GET | /messages | JWT | Any | List messages |
| GET | /messages/:id | JWT | Any | Get message (auto marks read) |
| POST | /messages/:id/read | JWT | Any | Mark as read |
| POST | /messages/:id/star | JWT | Any | Toggle star |
| POST | /send | JWT | Any | Send email |
| POST | /sync | JWT | Any | Manual sync |

#### Goals Routes (`/api/goals`) -- 7 endpoints
**File:** `server/routes/goals.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | / | JWT | Org Admin+ | List goals |
| GET | /summary | JWT | Any | Goals summary |
| POST | / | JWT | Org Admin+ | Create goal |
| GET | /:id | JWT | Any | Get goal |
| PUT | /:id | JWT | Org Admin+ | Update goal |
| DELETE | /:id | JWT | Org Admin+ | Archive goal |
| PUT | /:id/progress | JWT | Any | Update progress |

#### Google Calendar Routes (`/api`) -- 7 endpoints
**File:** `server/routes/google-calendar.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | /oauth/google/authorize | JWT | Any | Start OAuth flow |
| GET | /oauth/google/callback | None | None | OAuth callback (public) |
| GET | /user/calendar/status | JWT | Any | Calendar connection status |
| DELETE | /user/calendar/disconnect | JWT | Any | Disconnect calendar |
| POST | /user/calendar/sync | JWT | Any | Manual sync |
| PUT | /user/calendar/sync-toggle | JWT | Any | Toggle auto-sync |
| POST | /user/calendar/push/:appointmentId | JWT | Any | Push appointment to Google |

#### Hosted Pages Routes (`/api/hosted-pages`) -- 5 endpoints
**File:** `server/routes/hosted-pages.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | / | JWT | Any | List hosted pages |
| POST | / | JWT | Org Admin+ | Create hosted page |
| GET | /:id | JWT | Any | Get hosted page |
| PUT | /:id | JWT | Org Admin+ | Update hosted page |
| DELETE | /:id | JWT | Org Admin+ | Delete hosted page |

#### Hosted Pages Public Routes (`/api/pages`) -- 1 endpoint
**File:** `server/routes/hosted-pages-public.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | /:slug | None | None | Get page by slug (public) |

#### Hunches Routes (`/api/hunches`) -- 4 endpoints
**File:** `server/routes/hunches.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | / | JWT | Any | List hunches |
| GET | /stats | JWT | Any | Hunch statistics |
| GET | /:id | JWT | Any | Get hunch |
| PUT | /:id/review | JWT | Any | Accept or dismiss |

#### Inbox Routes (`/api/inbox`) -- 8 endpoints
**File:** `server/routes/inbox.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | / | JWT | Any | List threads |
| GET | /unread | JWT | Any | Unread count |
| GET | /:id | JWT | Any | Get thread |
| GET | /:id/messages | JWT | Any | Thread messages |
| POST | /:id/messages | JWT | Any | Send reply |
| PUT | /:id/assign | JWT | Org Admin+ | Assign thread |
| PUT | /:id/status | JWT | Any | Update status |
| PUT | /:id/read | JWT | Any | Mark read |

#### Insights Routes (`/api/insights`) -- 15 endpoints
**File:** `server/routes/insights.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | /voice-calls | JWT | Any | Voice call list |
| GET | /voice-calls/:callId/transcript | JWT | Any | Call transcript |
| GET | /voice-calls/chart | JWT | Any | Voice chart data |
| GET | /video-sessions | JWT | Any | Video session list |
| GET | /video-sessions/:sessionId/transcript | JWT | Any | Session transcript |
| GET | /video-sessions/chart | JWT | Any | Video chart data |
| GET | /leads | JWT | Any | Lead insights |
| GET | /leads/aging | JWT | Any | Lead aging report |
| GET | /leads/chart | JWT | Any | Lead chart data |
| GET | /leads/:leadId | JWT | Any | Single lead insight |
| PUT | /leads/:leadId/status | JWT | Any | Update lead status |
| POST | /leads/:leadId/assign | JWT | Any | Assign lead |
| GET | /dashboard | JWT | Any | Combined dashboard |
| GET | /dealer-pulse | JWT | Any | Dealer health pulse |
| POST | /dealer-pulse/refresh | JWT | Org Admin+ | Force refresh (15min rate limit) |

#### Integrations Routes (`/api/integrations`) -- 6 endpoints
**File:** `server/routes/integrations.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | / | JWT+RLS | Any | List integrations |
| POST | / | JWT+RLS | Org Admin+ | Create integration (VIN only) |
| GET | /:integrationId | JWT+RLS+Ownership | Org Admin+ | Get integration |
| PUT | /:integrationId | JWT+RLS+Ownership | Org Admin+ | Update integration |
| DELETE | /:integrationId | JWT+RLS+Ownership | Org Admin+ | Delete integration |
| POST | /:integrationId/test | JWT+RLS+Ownership | Org Admin+ | Test connection |

**Notable:** Uses both `enforceOrganizationContext` and `validateIntegrationOwnership` middleware. Credentials encrypted before storage. Creates audit log entries.

#### Knowledge Routes (`/api/admin/knowledge`) -- 4 endpoints
**File:** `server/routes/knowledge.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| POST | /upload | JWT | Org Admin+ | Upload CSV/XLSX (10MB) |
| GET | /uploads | JWT | Org Admin+ | List uploads |
| POST | /uploads/:id/undo | JWT | Org Admin+ | Undo upload |
| GET | /templates | JWT | Org Admin+ | Download templates |

#### Leads Routes (`/api/leads`) -- 6 endpoints
**File:** `server/routes/leads.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | / | JWT | Any | List leads with filters |
| GET | /stats | JWT | Any | Lead statistics |
| PATCH | /:id/mark-contacted | JWT+RLS | Any | Mark contacted (syncs to VIN) |
| GET | /:id | JWT | Any | Get single lead |
| PUT | /:id/status | JWT | Any | Update lead status |
| PUT | /:id/assign | JWT | Any | Assign lead to user |

**Notable:** `mark-contacted` syncs to VIN Solutions CRM (graceful degradation if VIN fails).

#### Metrics Routes (`/api/metrics`) -- 3 endpoints
**File:** `server/routes/metrics.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | /registry | JWT | Any | Certified metrics for role |
| GET | /summary | JWT | Super Admin | Certification summary |
| GET | /category/:category | JWT | Any | Metrics by category |

#### Notification Routes (`/api/notifications`) -- 8 endpoints
**File:** `server/routes/notifications.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | / | JWT | Any | List notifications |
| GET | /unread-count | JWT | Any | Unread count |
| GET | /stats | JWT | Any | Stats |
| PUT | /:id/read | JWT | Any | Mark as read |
| PUT | /read-all | JWT | Any | Mark all as read |
| GET | /settings | JWT | Any | Get preferences |
| PUT | /settings | JWT | Any | Update preferences |
| GET | /event-types | JWT | Any | Available event types |

#### Report Routes (`/api/reports`) -- 5 endpoints
**File:** `server/routes/reports.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| POST | /lead-pipeline | JWT | Org Admin+ | Generate pipeline report |
| GET | /download/:fileName | JWT | Any | Download generated report |
| GET | /catalog | JWT | Any | Report catalog |
| GET | /:id/preview | JWT | Any | Preview report |
| POST | /:id/generate | JWT | RBAC-checked | Generate report |

#### Settings Routes (`/api/settings`) -- 4 endpoints
**File:** `server/routes/settings.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | /application | JWT | Org Admin+ | Get app settings |
| PUT | /application | JWT | Org Admin+ | Update app settings |
| POST | /report-upload | JWT | Org Admin+ | Import CSV data |
| GET | /report-uploads | JWT | Org Admin+ | List uploads |

#### SMS Routes (`/api/sms`) -- 7 endpoints
**File:** `server/routes/sms.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | /config | JWT | Org Admin+ | Get TextMagic config |
| PUT | /config | JWT | Super Admin | Update config |
| POST | /send | JWT | Any | Send SMS |
| GET | /messages | JWT | Any | List messages |
| GET | /opt-outs | JWT | Org Admin+ | List opt-outs |
| POST | /webhook/inbound | None | None | TextMagic webhook (public) |
| POST | /test | JWT | Super Admin | Send test SMS |

**Notable:** Inbound webhook is public (TextMagic callback). Wires into inbox + trigger evaluation.

#### Task Routes (`/api/tasks`) -- 9 endpoints
**File:** `server/routes/tasks.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | / | JWT | Any | List tasks |
| GET | /stats | JWT | Any | Task statistics |
| GET | /calendar | JWT | Any | Calendar format |
| POST | /calendar | JWT | Any | Calendar task creation |
| GET | /:id | JWT | Any | Get task |
| POST | / | JWT | Any | Create task |
| PUT | /:id | JWT | Any | Update task |
| PUT | /:id/status | JWT | Any | Update status |
| DELETE | /:id | JWT | Any | Delete task |

#### Tracking Routes (`/api/tracking`) -- 6 endpoints
**File:** `server/routes/tracking.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| POST | /events | None | None | Track event (public) |
| POST | /batch | None | None | Batch events (max 100, public) |
| GET | /attribution | JWT | Org Admin+ | Attribution report |
| GET | /funnel | JWT | Org Admin+ | Funnel analysis |
| GET | /pages | JWT | Any | Page analytics |
| GET | /sources | JWT | Any | Traffic sources |

**Notable:** Public endpoints use CORS middleware. Org resolved from widgetCode.

#### Trigger Routes (`/api/triggers`) -- 10 endpoints
**File:** `server/routes/triggers.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | / | JWT | Any | List trigger rules |
| GET | /executions | JWT | Any | List executions |
| POST | / | JWT | Org Admin+ | Create rule |
| GET | /templates | JWT | Any | Rule templates |
| POST | /templates/:templateId/activate | JWT | Org Admin+ | Activate template |
| GET | /:id | JWT | Any | Get rule |
| PUT | /:id | JWT | Org Admin+ | Update rule |
| DELETE | /:id | JWT | Org Admin+ | Archive rule (soft) |
| GET | /:id/executions | JWT | Any | Rule executions |

#### VIN Solutions Routes (`/api/vin`) -- 10 endpoints
**File:** `server/routes/vin.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| POST | /initialize | JWT+RLS | Any | Initialize VIN OAuth |
| GET | /settings | JWT+RLS | Any | Get VIN settings |
| PUT | /settings | JWT+RLS | Org Admin+ | Update VIN settings |
| GET | /test/dealers/:integrationId | JWT+RLS+Own | Org Admin+ | Test: Get dealers |
| GET | /test/leads/:integrationId | JWT+RLS+Own | Org Admin+ | Test: Search leads |
| POST | /refresh-tokens | JWT | Super Admin | Refresh all tokens |
| POST | /refresh-token/:integrationId | JWT+RLS+Own | Any | Refresh single token |
| GET | /integrations | JWT+RLS | Any | List VIN integrations |
| GET | /integrations/:integrationId | JWT+RLS+Own | Org Admin+ | Get single integration |
| GET | /job-status | JWT | Super Admin | Token refresh job status |

**Notable:** Validates env vars at startup. Uses `enforceOrganizationContext` + `validateIntegrationOwnership`. Strips secrets from responses.

#### Widget Routes (`/api/widgets`) -- 9 endpoints
**File:** `server/routes/widgets.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| POST | /validate | None | None | Validate widget+domain (public) |
| GET | / | JWT | Any | List widgets |
| POST | / | JWT | Org Admin+ | Create widget |
| GET | /:id | JWT | Any | Get widget |
| PUT | /:id | JWT | Org Admin+ | Update widget |
| DELETE | /:id | JWT | Org Admin+ | Archive widget (soft) |
| GET | /:id/embed | JWT | Org Admin+ | Get embed code |
| POST | /:id/domains | JWT | Org Admin+ | Add domain to whitelist |
| DELETE | /:id/domains/:domain | JWT | Org Admin+ | Remove domain |

#### Widget Public Routes (`/api/widgets/public`) -- 8 endpoints
**File:** `server/routes/widget-public.ts`

| Method | Path | Auth | RBAC | Rate Limit | Purpose |
|--------|------|------|------|------------|---------|
| POST | /session | None | None | 100/hr/IP | Create/update visitor session |
| POST | /chat | None | None | 100/hr/IP | Send chat, get AI response |
| POST | /chat/stream | None | None | 100/hr/IP | SSE streaming chat |
| POST | /callback | None | None | 100/hr/IP | Request callback |
| POST | /sms | None | None | 100/hr/IP | Send SMS from widget |
| GET | /history | None | None | 100/hr/IP | Chat history |
| POST | /video/start | None | None | 100/hr/IP | Start Tavus video session |
| POST | /audio/token | None | None | 100/hr/IP | Get VAPI public key |

**Notable:** Full CORS support for cross-origin widget embedding. Rate limited at 100 requests/hour per IP. Security is via widgetCode + domain origin validation. Wires chat messages into staff inbox (fire-and-forget).

#### User Integration Routes (`/api/user/integrations`) -- 7 endpoints
**File:** `server/routes/userIntegrations.ts`

| Method | Path | Auth | RBAC | Purpose |
|--------|------|------|------|---------|
| GET | / | JWT | Any | List user integrations |
| POST | /email/test | JWT | Any | Test email connection |
| POST | /email | JWT | Any | Connect email (App Password) |
| GET | /email | JWT | Any | Get email integration status |
| PUT | /email | JWT | Any | Update email config |
| DELETE | /:id | JWT | Any | Disconnect integration |
| GET | /email/presets | JWT | Any | Email provider presets |

**Notable:** Supports Gmail, Outlook, Yahoo, iCloud presets. Credentials encrypted at rest.

#### Health Check -- 1 endpoint

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | /api/health | None | Health check (status, timestamp, version) |

---

## 3. Services Layer

### 3.1 Service Inventory

**Total:** 36 service files + 4 sub-service files = 40 service modules

| Service | File | Purpose |
|---------|------|---------|
| AccessibleOrganizationsService | `AccessibleOrganizationsService.ts` | Resolves orgs accessible to Partner/Super Admins |
| ActivityService | `ActivityService.ts` | AI usage event tracking and reporting |
| AgentService | `AgentService.ts` | Agent CRUD, performance metrics |
| AppointmentService | `AppointmentService.ts` | Appointment CRUD, FullCalendar format, VAPI/Tavus booking |
| AppointmentConfirmationService | `appointmentConfirmationService.ts` | Email/SMS confirmations and reminders |
| AppointmentExtractionService | `appointmentExtractionService.ts` | AI-powered extraction from transcripts |
| ApprovalService | `ApprovalService.ts` | Approval request lifecycle |
| ConversationService | `ConversationService.ts` | Conversation/message CRUD |
| CreditService | `CreditService.ts` | Usage tracking, billing, balance calculation |
| DashboardService | `DashboardService.ts` | Command Center data aggregation |
| DealerBrainService | `DealerBrainService.ts` | Claude API integration with tool calling (non-streaming) |
| DealerBrainStreamingService | `DealerBrainStreamingService.ts` | Claude API SSE streaming with tool visibility |
| DealerPulseService | `DealerPulseService.ts` | 5-phase dealership health snapshots |
| DriveService | `DriveService.ts` | File/folder management with quota |
| EmailService | `EmailService.ts` | IMAP/SMTP operations, credential encryption |
| FeedbackService | `FeedbackService.ts` | User feedback collection |
| GoalsService | `GoalsService.ts` | Goal CRUD and progress tracking |
| GoogleCalendarService | `GoogleCalendarService.ts` | Google Calendar OAuth + CRUD |
| HostedPageService | `HostedPageService.ts` | Hosted widget page management |
| HunchesService | `HunchesService.ts` | AI-generated insights (hunches) |
| InboxService | `InboxService.ts` | Staff messaging inbox, thread management |
| KnowledgeUploadService | `KnowledgeUploadService.ts` | CSV/XLSX import with undo capability |
| MetricsEngine | `MetricsEngine.ts` | Certified metrics registry with role filtering |
| NotificationService | `NotificationService.ts` | In-app notification delivery + preferences |
| PasswordResetService | `PasswordResetService.ts` | Token-based password reset flow |
| PdfReportService | `PdfReportService.ts` | PDF report generation |
| ReportService | `ReportService.ts` | Report catalog and generation |
| TaskService | `TaskService.ts` | Task CRUD with calendar integration |
| TextMagicService | `TextMagicService.ts` | SMS send/receive via TextMagic REST API |
| TrackingService | `TrackingService.ts` | Attribution pixel event processing |
| TriggerService | `TriggerService.ts` | Trigger rules engine (event evaluation, action dispatch) |
| VinOAuthService | `vinOAuthService.ts` | VIN OAuth2 token lifecycle |
| VinSolutionsService | `vinSolutionsService.ts` | VIN CRM API client (leads, contacts, dealers) |
| WidgetAgentService | `WidgetAgentService.ts` | Widget-specific AI agent |
| WidgetConfigService | `WidgetConfigService.ts` | Widget configuration CRUD |
| WidgetInteractionService | `WidgetInteractionService.ts` | Widget chat, callbacks, SMS, video |

#### Sub-Service Modules

| Module | Files | Purpose |
|--------|-------|---------|
| Context Router | `contextRouter/ContextRouterService.ts`, `SourceSelector.ts`, `CacheManager.ts`, `index.ts` | Unified data query orchestration (VIN API + DB + cache) |
| Sync | `sync/SyncCoordinator.ts`, `LeadMapper.ts`, `index.ts` | Bidirectional VIN sync, lead data mapping |
| Notifications | `notifications/notificationEmailService.ts` | Resend email notifications for call events |

### 3.2 Key Service Details

#### DealerBrainService + DealerBrainStreamingService

- **AI Provider:** Anthropic Claude API
- **Model:** Configurable (defaults to claude-3-5-sonnet)
- **Capabilities:** Tool calling for lead queries, VAPI call queries, Tavus session queries, VIN data queries, goal management, agent management
- **Tools:** `query_leads`, `query_vapi_calls`, `query_tavus_sessions`, `query_vin_data`, `create_goal`, `create_agent`, and more
- **Governance:** DealerBrainProcessor middleware interface for pre/post-processing (Stage 1: monitoring only)
- **Streaming:** SSE-based streaming with tool call visibility events

#### VinSolutionsService

- **Authentication:** OAuth2 client credentials flow
- **Token Management:** Encrypted storage (AES-256-GCM), auto-refresh at 90% lifetime
- **API Calls Logged:** All calls logged to `vin_api_calls` table with duration, status, result count
- **Key Methods:** `initializeOAuth2`, `getDealers`, `getUsers`, `searchLeads`, `getLead`, `createLead`, `markLeadContacted`, `resolveContact`, `enrichLeadsWithContacts`
- **Lead Creation:** 2-step process (create contact via gateway, then create lead with href references)
- **Contact Resolution:** Extracts contactId from URL, calls gateway endpoint with cached userId

#### CreditService

- **Pricing:** Voice $0.25/min, Video $0.32/min, SMS $0.05/msg
- **Cost:** Voice $0.15/min, Video $0.20/min, SMS $0.02/msg
- **Tracking:** Per-unit recording, allocation periods, balance calculations

#### TriggerService

- **Event Types:** `new_lead`, `lead_status_change`, `hot_lead`, `appointment_created`, `missed_call`, `widget_interaction`, `sms_received`
- **Action Types:** `outbound_call`, `send_sms`, `send_notification`, `create_task`, `assign_lead`
- **Features:** Rate limiting (max executions/hour), business hours enforcement, delay scheduling, condition evaluation

---

## 4. Middleware Stack

### 4.1 Global Middleware (Applied to All Requests)

**File:** `server/index.ts`

1. **Helmet** -- Security headers (CSP disabled)
2. **express.json** -- JSON body parser with rawBody capture
3. **express.urlencoded** -- URL-encoded body parser
4. **API Logging** -- Request/response logging with sensitive field redaction

#### Sensitive Field Redaction

Fields matching `/token|secret|password/i` are automatically redacted in API response logs:

```typescript
function redactSensitiveFields(obj) {
  // Recursively replaces string values for keys matching pattern with '[REDACTED]'
}
```

### 4.2 Authentication Middleware

**File:** `server/auth/middleware.ts`

| Middleware | Purpose | Attaches |
|-----------|---------|----------|
| `authenticate` | Required JWT validation | `req.user`, `req.rlsVariables` |
| `optionalAuthenticate` | Optional JWT (no 401 on failure) | `req.user` if valid |
| `requireSuperAdmin` | Role level === 1 | -- |
| `requirePartnerAdminOrHigher` | Role level <= 2 | -- |
| `requireOrgAdminOrHigher` | Role level <= 3 | -- |
| `requireRoleLevel(minLevel)` | Role level <= minLevel | -- |
| `requireOrganization(orgId)` | Org membership check (Super Admin bypasses) | -- |

**JWT Payload (`req.user`):**
```typescript
{
  userId: string;
  email: string;
  organizationId: string;
  organizationName: string;
  roleLevel: number;  // 1-4
  roleName: string;
  firstName: string;
  lastName: string;
}
```

### 4.3 Organization Context Middleware

**File:** `server/middleware/enforceOrganizationContext.ts`

| Middleware | Purpose |
|-----------|---------|
| `enforceOrganizationContext(pool)` | Creates SecureQueryBuilder with RLS context from JWT |
| `createSystemQueryBuilder(pool)` | For background jobs -- no RLS enforcement |
| `allowCrossOrganization(pool)` | Super Admin can target other orgs via query param |

Attaches `req.rlsContext` and `req.db` (SecureQueryBuilder instance) to the request.

### 4.4 Resource Ownership Middleware

**File:** `server/middleware/validateResourceOwnership.ts`

| Middleware | Validates | Super Admin | Partner Admin |
|-----------|-----------|-------------|---------------|
| `validateIntegrationOwnership` | Integration belongs to user's org | Bypasses | Checks `partner_admin_organizations` |
| `validateAgentOwnership` | Agent belongs to user's org | Bypasses | Checks `partner_admin_organizations` |
| `validateConversationOwnership` | Conversation belongs to user's org | Bypasses | Checks |
| `validateLeadOwnership` | Lead belongs to user's org | Bypasses | Checks |
| `validateTaskOwnership` | Task belongs to user's org | Bypasses | Checks |

Attaches validated resource to `req.resource`.

### 4.5 Rate Limiting

Rate limiting is applied selectively, not globally:

| Route | Limit | Window |
|-------|-------|--------|
| POST /api/auth/login | 30 requests | 1 minute |
| POST /api/auth/register | 5 requests | 1 hour |
| POST /api/auth/forgot-password | 3 requests | 1 hour |
| /api/widgets/public/* | 100 requests | 1 hour (per IP) |
| POST /api/insights/dealer-pulse/refresh | 1 request | 15 minutes |

---

## 5. Webhook Handlers

### 5.1 VAPI Webhook (`/api/webhooks/vapi`)

**File:** `server/webhooks/vapi.ts`

**Security:**
- Optional signature verification via `X-Vapi-Secret` header
- If header is present and `VAPI_WEBHOOK_SECRET` env var is set, strict verification
- If header is absent, webhook is allowed through (VAPI doesn't support programmatic secret configuration)
- Timing-safe comparison for signature validation

**Event Types Handled:**

| Event | Handler | Actions |
|-------|---------|---------|
| `call.started` | `handleCallStarted()` | Create `vapi_call_logs` record, create conversation record |
| `call.ended` | `handleCallEnded()` | Update call log, update conversation, evaluate missed_call triggers |
| `end-of-call-report` | `handleEndOfCallReport()` | UPSERT call log, extract lead (sync_queue), extract appointment, credit recording, email notification, in-app notification, agent performance metrics |
| `transcript` | `handleTranscript()` | Store real-time transcript messages |
| `status-update` | `handleStatusUpdate()` | Update call status |

**Organization Resolution:**
1. `metadata.organizationId` from payload
2. Lookup by `assistantId` in `agents` table (`config->>'vapiAssistantId'`)

**Idempotency Guards:**
- `notification_sent` column: Atomic `UPDATE...WHERE notification_sent = false RETURNING id`
- `credit_recorded` column: Same atomic pattern
- E2E test calls (`test-*` IDs) filtered before notifications

**Lead Extraction Flow:**
1. Check call duration against org's configurable threshold (default 10s)
2. If transcript or phone available, queue `lead_to_vin` job in `sync_queue`
3. SyncCoordinator processes the job asynchronously

**Appointment Extraction:**
- Uses `AppointmentExtractionService` to detect appointment content in transcripts
- Only books if confidence >= 70%
- Fire-and-forget (errors don't fail the webhook)

### 5.2 Tavus Webhook (`/api/webhooks/tavus`)

**File:** `server/webhooks/tavus.ts`

**Security:**
- HMAC-SHA256 signature verification via `X-Tavus-Signature` and `X-Tavus-Timestamp` headers
- Raw body capture middleware (`captureRawBody`) applied before JSON parsing
- Timestamp tolerance: 5 minutes (prevents replay attacks)
- If `TAVUS_WEBHOOK_SECRET` not set, verification is skipped with warning

**Event Types Handled:**

| Event | Handler | Actions |
|-------|---------|---------|
| `conversation.started` | `handleConversationStarted()` | Create `tavus_sessions` record, create conversation record |
| `conversation.ended` | `handleConversationEnded()` | Update session, queue lead extraction, extract appointment, credit recording, in-app notification, agent performance metrics |
| `replica.ready` | (logged only) | -- |
| `video.ready` | (logged only) | -- |

**Organization Resolution:**
1. `custom_data.organization_id` from payload
2. Lookup by `persona_id` in `agents` table (`config->>'tavus_persona_id'`)

### 5.3 Signature Verification Utilities

**File:** `server/webhooks/utils/signatureVerifier.ts`

Three verification functions:
- `verifyVapiSignature()` -- Simple shared secret comparison (timing-safe)
- `verifyTavusSignature()` -- HMAC-SHA256 with timestamp tolerance
- `verifyHmacSha256()` -- Generic HMAC utility

All use `crypto.timingSafeEqual()` to prevent timing attacks.

---

## 6. Scheduled Jobs

### 6.1 Job Inventory

All 8 jobs are initialized in `server/index.ts` during server startup. All use native `setInterval` (no Redis/Bull dependency).

| # | Job | File | Interval | Startup Delay | Purpose |
|---|-----|------|----------|---------------|---------|
| 1 | VIN Token Refresh | `vinTokenRefreshJob.ts` | 30 min | Immediate | Refresh OAuth tokens before expiry |
| 2 | Sync Queue Worker | `syncQueueWorker.ts` | Outbound: 1 min, Inbound: 4 hrs | None | Process sync_queue (Nexxus <-> VIN) |
| 3 | Appointment Reminder | `appointmentReminderJob.ts` | 5 min | Immediate | Send 24h and 2h reminders |
| 4 | Email Sync | `emailSyncJob.ts` | 5 min | Immediate | Sync IMAP emails for all users |
| 5 | VIN Lead Polling | `vinLeadPollingJob.ts` | 60 min | 30 sec | Import new VIN leads |
| 6 | Trigger Re-evaluation | `triggerReevalJob.ts` | 5 min | 45 sec | Re-evaluate age-based trigger conditions |
| 7 | Dealer Pulse | `dealerPulseJob.ts` | 4 hrs | 60 sec | Generate dealership health snapshots |
| 8 | Hunch Generation | `hunchGenerationJob.ts` | 6 hrs | 90 sec | Generate AI-powered insights |

### 6.2 Job Details

#### VIN Token Refresh Job
- Checks all active VIN integrations for tokens expiring within 10 minutes
- VIN tokens expire in 60 minutes
- Creates audit log entries for refresh attempts, successes, and failures
- Singleton pattern with `isRunning` guard

#### Sync Queue Worker
- **Outbound (1 min):** Processes `sync_queue` table for `lead_to_vin` jobs
- **Inbound (4 hrs):** Polls VIN API for new leads to import
- Uses `SyncCoordinator` for actual sync logic
- Exponential backoff on failures (max 3 attempts)
- Batch size: 20 jobs per run

#### Appointment Reminder Job
- Creates reminder entries for appointments within 26-hour look-ahead window
- Processes due reminders (status='pending', send_at <= now)
- Skips reminders for cancelled appointments
- Uses `AppointmentConfirmationService` for actual delivery

#### Email Sync Job
- Syncs INBOX and Sent folders for all active `email_imap` integrations
- Processes up to 50 integrations per run (ordered by least-recently-synced)
- Updates `last_sync_at`, `last_sync_success`, `last_error` on integration record

#### VIN Lead Polling Job
- Polls all active VIN integrations for leads created in the last 48 hours
- Deduplicates against existing `leads` table using `vin_customer_id`
- Emits `new_lead` trigger events for newly imported leads
- Uses `DatabaseStorage.forSystemJobs()` (bypasses RLS)

#### Trigger Re-evaluation Job
- Finds leads created in the last 30 minutes with status='new' and no successful trigger execution
- Re-evaluates trigger rules with computed `lead_age_minutes`
- Solves the problem of age-based conditions not matching at import time (when age=0)
- Staggered startup (45s after VIN poller's 30s)

#### Dealer Pulse Job
- Generates 5-phase health snapshots for all orgs with active VIN integrations
- Caches results in `dealer_pulse_cache` table (JSONB)
- AI commentary via Claude Haiku with rule-based fallback

#### Hunch Generation Job
- Generates AI-powered insights for all orgs with active VIN integrations
- Uses `HunchesService` for generation logic

### 6.3 Job Safety Patterns

All jobs implement:
- **Singleton guard:** `isRunning` flag prevents concurrent execution
- **Error isolation:** try/catch blocks prevent job crashes from affecting the server
- **Graceful shutdown:** `clearInterval` + `shutdown()` method
- **Audit logging:** Jobs write to `audit_log` table
- **Startup staggering:** Different delays (0s, 30s, 45s, 60s, 90s) prevent thundering herd

---

## 7. Third-Party Integrations

### 7.1 VIN Solutions (CRM)

| Aspect | Detail |
|--------|--------|
| Auth | OAuth2 Client Credentials (60-min tokens) |
| Base URL | `https://api.vinsolutions.com` (production) |
| Token Endpoint | `https://authentication.vinsolutions.com/connect/token` |
| API Versioning | v1 for reference endpoints, v3 for lead CRUD |
| Header Casing | Lowercase `v3` (not uppercase `V3` as in docs) |
| Encryption | AES-256-GCM for tokens at rest |
| Auto-refresh | Every 30 minutes, 10-min-before-expiry threshold |
| Rate Logging | All API calls logged to `vin_api_calls` table |
| Key Operations | getDealers, getUsers, searchLeads, createLead, resolveContact, markLeadContacted |

### 7.2 VAPI (Voice AI)

| Aspect | Detail |
|--------|--------|
| Integration | Webhook-based (no outbound API calls from Nexxus) |
| Webhook Path | `/api/webhooks/vapi` |
| Auth | Shared secret via `X-Vapi-Secret` header |
| Org Resolution | `metadata.organizationId` or `assistantId` lookup |
| Credit Tracking | Per-minute, rounded up |
| Widget Integration | Public key provided to widget for browser audio |

### 7.3 Tavus (Video AI)

| Aspect | Detail |
|--------|--------|
| Integration | Webhook-based + outbound API for session creation |
| Webhook Path | `/api/webhooks/tavus` |
| Auth | HMAC-SHA256 signature with timestamp |
| Outbound API | `POST https://tavusapi.com/v2/conversations` (from widget) |
| Org Resolution | `custom_data.organization_id` or `persona_id` lookup |
| Credit Tracking | Per-minute, rounded up |

### 7.4 Resend (Transactional Email)

| Aspect | Detail |
|--------|--------|
| Purpose | Lead notification emails, welcome emails |
| Integration | SDK (`resend` npm package) |
| Usage Points | VAPI end-of-call-report, user registration |
| Recipients | Automatically resolved from DB (Super Admins + Partner Admins + Org Admins) |

### 7.5 TextMagic (SMS)

| Aspect | Detail |
|--------|--------|
| API | REST v2 (`https://rest.textmagic.com/api/v2`) |
| Auth | `X-TM-Username` + `X-TM-Key` headers |
| Features | Send/receive SMS, opt-out management, appointment confirmations |
| Inbound Webhook | `POST /api/sms/webhook/inbound` (public, wires into inbox + triggers) |
| API Key Storage | AES-256-CBC encrypted in database |
| AI Auto-Reply | Claude-powered auto-reply capability |

### 7.6 Anthropic Claude API (AI)

| Aspect | Detail |
|--------|--------|
| SDK | `@anthropic-ai/sdk` |
| Usage | DealerBrainService (non-streaming), DealerBrainStreamingService (SSE), AppointmentExtractionService, HunchesService, DealerPulseService commentary |
| Features | Tool calling, streaming, content generation |
| Governance | Pre/post-processing middleware interface (Stage 1: monitoring) |

### 7.7 Google Calendar

| Aspect | Detail |
|--------|--------|
| Auth | OAuth2 authorization code flow |
| Features | Calendar sync, appointment push, event CRUD |
| Background Job | Periodic calendar sync |
| Endpoints | `/api/oauth/google/authorize`, `/api/oauth/google/callback` |

---

## 8. Authentication and Authorization Flow

### 8.1 JWT Token Architecture

**File:** `server/auth/jwt.ts`

| Token Type | Expiry | Audience | Purpose |
|-----------|--------|----------|---------|
| Access Token | 24 hours | `nexxus-api` | API authentication |
| Refresh Token | 7 days | `nexxus-api` | Token renewal |
| Appointment Confirmation | 48 hours | `nexxus-appointment` | Public appointment confirmation links |

**Token Issuer:** `nexxus-v2`
**Password Hashing:** bcrypt with 10 salt rounds
**Secret:** `JWT_SECRET` environment variable

### 8.2 Authentication Flow

```
1. POST /api/auth/login
   - Validate email + password (bcrypt compare)
   - Check user status != 'inactive'
   - Generate access + refresh token pair
   - Return tokens + user profile

2. Authenticated Requests
   - Extract Bearer token from Authorization header
   - Verify JWT (signature, expiry, issuer, audience)
   - Load user from database using JWT payload
   - Attach req.user + req.rlsVariables
   - Set PostgreSQL session variables for RLS

3. Token Refresh
   - POST /api/auth/refresh with refresh token
   - Verify refresh token validity
   - Generate new access + refresh token pair

4. Organization Context
   - Partner Admins can switch organizations via POST /api/auth/switch-org
   - New JWT issued with updated organizationId
   - Audit log entry created
```

### 8.3 RBAC Model (4-Tier)

| Level | Role | Capabilities |
|-------|------|--------------|
| 1 | Super Admin | System-wide access, manages partners, provisions tools |
| 2 | Partner Admin | Manages multiple assigned organizations, cross-org switching |
| 3 | Org Admin | Manages users and settings within organization(s) |
| 4 | Org Staff | Uses agents, views insights, manages own work |

### 8.4 RLS Enforcement

**PostgreSQL Session Variables:**
```sql
SET LOCAL app.current_org_id = '<organization_id>';
SET LOCAL app.user_role_level = '<role_level>';
```

**SecureQueryBuilder** (`server/db/SecureQueryBuilder.ts`):
- Sets RLS variables via `SET LOCAL` within a transaction
- `query()` -- Normal query with RLS context
- `systemQuery(sql, params, reason)` -- Bypasses RLS (requires audit justification)
- Throws `RLSContextError` if context is missing
- Throws `SystemQueryError` if system query lacks justification

---

## 9. Error Handling Patterns

### 9.1 Global Error Handling

**File:** `server/index.ts`

```typescript
// Uncaught exceptions -- logged but process NOT exited
process.on('uncaughtException', (err) => { ... });

// Unhandled promise rejections -- logged but process NOT exited
process.on('unhandledRejection', (reason) => { ... });
```

**Express Error Middleware (registered twice):**
1. In `routes.ts` -- Catches API route errors, returns JSON
2. In `index.ts` -- Final catch-all, returns JSON

Both return:
```json
{
  "error": "Internal Server Error",
  "message": "<error.message in dev, generic in production>"
}
```

### 9.2 Route-Level Error Handling

Every route handler uses try/catch:
```typescript
router.get('/', authenticate, async (req, res) => {
  try {
    // ... business logic
    res.json({ ... });
  } catch (error) {
    console.error('[Module] Error description:', error);
    res.status(500).json({ error: 'Failed to ...' });
  }
});
```

### 9.3 Webhook Error Handling

Both VAPI and Tavus webhooks return 200 even on processing errors to prevent webhook retries:

```typescript
res.status(200).json({
  success: false,
  error: error.message,
  eventType: payload.type
});
```

Non-critical operations (credit recording, notifications, performance metrics) are wrapped in individual try/catch blocks and logged but never fail the webhook.

### 9.4 Job Error Handling

All jobs:
- Wrap execution in try/catch/finally
- Log errors via `console.error`
- Set `isRunning = false` in finally block
- Never crash the process on job failure

### 9.5 Error Patterns Summary

| Pattern | Usage | Assessment |
|---------|-------|------------|
| try/catch in every route | Consistent across all 34 route files | Good |
| Webhook 200-on-error | Prevents retry storms | Good |
| Process-level safety nets | uncaughtException + unhandledRejection | Good (process continues) |
| Error logging with context | `[Module] Error message:` format | Consistent |
| Sensitive data redaction | Automatic in API response logs | Good |
| Generic error messages in production | `NODE_ENV` check in final handler | Good |

---

## 10. Database Layer

### 10.1 Connection

**File:** `server/db.ts`

```typescript
export const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
```

### 10.2 SecureQueryBuilder

**File:** `server/db/SecureQueryBuilder.ts`

- Enforces RLS context on every query via `SET LOCAL` within transactions
- Two execution modes:
  - `query(sql, params)` -- With RLS context (normal request flow)
  - `systemQuery(sql, params, reason)` -- Without RLS (background jobs, requires audit justification)
- Custom error types: `RLSContextError`, `SystemQueryError`

### 10.3 DatabaseStorage

**File:** `server/db.ts` (class defined at bottom)

- Legacy storage class being migrated to use SecureQueryBuilder
- Two factory methods:
  - `DatabaseStorage.withContext(rlsContext)` -- For request-scoped operations
  - `DatabaseStorage.forSystemJobs()` -- For background jobs (suppresses RLS warnings)
- Key methods: `createIntegration`, `getIntegration`, `updateIntegration`, `getActiveVinIntegrations`, `createAuditLog`

### 10.4 Encryption Utilities

**File:** `server/utils/encryption.ts`

- Algorithm: AES-256-GCM
- Key derivation: PBKDF2 from `SESSION_SECRET` env var (100,000 iterations, SHA-256)
- IV: 16 random bytes per encryption
- Auth tag: 16 bytes (GCM authentication)
- Format: `iv_hex + auth_tag_hex + ciphertext_hex`
- Used for: OAuth tokens, API keys, email credentials

---

## 11. Security Assessment

### 11.1 Strengths

| Area | Assessment |
|------|------------|
| **RLS Enforcement** | SecureQueryBuilder ensures every query runs in proper multi-tenant context |
| **JWT Architecture** | Separate access/refresh tokens with appropriate expiry times |
| **Resource Ownership** | Validated before access via dedicated middleware |
| **Credential Encryption** | AES-256-GCM for all secrets at rest |
| **Webhook Verification** | Timing-safe comparison, HMAC-SHA256, timestamp tolerance |
| **Sensitive Field Redaction** | Automatic in API response logs |
| **Audit Logging** | Comprehensive for admin operations, VIN token refreshes, org switches |
| **Rate Limiting** | Applied to auth routes and public widget endpoints |
| **Input Validation** | Present in most endpoints (length checks, type checks, enum validation) |
| **Soft Deletes** | Users and organizations use status-based deactivation |
| **CORS** | Scoped to widget public endpoints only |
| **Helmet** | Security headers applied globally |

### 11.2 Potential Concerns

| Area | Concern | Severity |
|------|---------|----------|
| **VAPI Webhook Secret** | Optional -- if `VAPI_WEBHOOK_SECRET` not set OR header missing, webhook accepted without verification | Medium |
| **Tavus Webhook Secret** | If `TAVUS_WEBHOOK_SECRET` not set, verification skipped entirely | Medium |
| **CSP Disabled** | `helmet({ contentSecurityPolicy: false })` | Low (common in SPAs) |
| **No Global Rate Limiting** | Only selective rate limiting on auth + widget routes | Low-Medium |
| **Pool Connections** | Max 10 connections; could be insufficient under load | Low |
| **Error Messages in Dev** | Full error messages exposed when `NODE_ENV !== 'production'` | Low (expected) |
| **SMS Inbound Webhook** | Public endpoint with no signature verification (TextMagic doesn't sign) | Medium |
| **Direct Pool Usage** | Some routes use `pool.query()` directly instead of SecureQueryBuilder | Low (RLS set via `setRlsContext()` helper) |

---

## 12. Observations and Recommendations

### 12.1 Architecture Observations

1. **Consistent Patterns:** The codebase follows very consistent patterns across all 34 route files -- same error handling, same auth middleware application, same response formats.

2. **Service Layer Separation:** Business logic is properly extracted into service classes, keeping route handlers thin.

3. **Job Architecture:** All 8 jobs use the same singleton + setInterval pattern with `isRunning` guards. This is simple and effective, though it lacks persistence (jobs reset on server restart).

4. **Multi-tenancy:** RLS is enforced at both the middleware level (SecureQueryBuilder) and database level (PostgreSQL RLS policies). This defense-in-depth approach is strong.

5. **Webhook Resilience:** Both webhook handlers return 200 on processing errors and use atomic idempotency guards -- well-designed for webhook reliability.

6. **Graceful Degradation:** VIN sync failures don't block local operations (e.g., `mark-contacted` updates local DB even if VIN API fails).

### 12.2 Quantitative Summary

| Metric | Count |
|--------|-------|
| Total API Endpoints | ~185 |
| Public (no auth) endpoints | 15 |
| Super Admin only endpoints | ~20 |
| Org Admin+ endpoints | ~40 |
| Any authenticated user endpoints | ~110 |
| Rate-limited endpoints | ~13 |
| Endpoints with audit logging | ~20 |
| Endpoints with file upload | 4 |
| SSE streaming endpoints | 3 |
| Webhook endpoints | 3 (VAPI, Tavus, TextMagic inbound) |

### 12.3 File Inventory

| Directory | File Count | Purpose |
|-----------|-----------|---------|
| `server/routes/` | 34 files | API route handlers |
| `server/services/` | 36 files | Business logic |
| `server/services/contextRouter/` | 4 files | Data query orchestration |
| `server/services/sync/` | 3 files | VIN bidirectional sync |
| `server/services/notifications/` | 1 file | Email notifications |
| `server/jobs/` | 8 files | Scheduled background jobs |
| `server/webhooks/` | 2 files + 1 utility | Webhook handlers |
| `server/auth/` | 2 files | JWT + auth middleware |
| `server/middleware/` | 3 files | Organization context + ownership |
| `server/db/` | 1 file | SecureQueryBuilder |
| `server/utils/` | 2 files | Encryption + env validation |
| **Total** | **~96 files** | -- |

---

**End of Audit**

*This document was generated by forensic analysis of all server-side source code in the Nexxus V2 codebase. Every file referenced was read and analyzed during the audit process.*
