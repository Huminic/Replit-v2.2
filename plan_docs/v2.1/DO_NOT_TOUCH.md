# DO NOT TOUCH -- Nexxus V2 Backend Freeze Manifest

**Date:** 2026-02-22
**Context:** The frontend is being rebuilt against new designer specs. The backend, database, webhooks, scheduled jobs, integrations, and all supporting infrastructure must remain frozen.

**Rule:** If a file is not explicitly listed in Section 7 ("SAFE TO MODIFY"), it must not be modified. When in doubt, do not touch it.

---

## Table of Contents

1. [Server Entry Points and Core](#1-server-entry-points-and-core)
2. [Server Routes (API Layer)](#2-server-routes-api-layer)
3. [Server Services (Business Logic)](#3-server-services-business-logic)
4. [Server Database Layer](#4-server-database-layer)
5. [Server Middleware](#5-server-middleware)
6. [Server Authentication](#6-server-authentication)
7. [Server Webhooks](#7-server-webhooks)
8. [Server WebSocket](#8-server-websocket)
9. [Server Jobs and Schedulers](#9-server-jobs-and-schedulers)
10. [Server Utilities](#10-server-utilities)
11. [Database Migrations](#11-database-migrations)
12. [Shared Schema](#12-shared-schema)
13. [Widget (Embeddable)](#13-widget-embeddable)
14. [Build System](#14-build-system)
15. [Root Configuration Files](#15-root-configuration-files)
16. [Test Suite](#16-test-suite)
17. [Scripts (Operational)](#17-scripts-operational)
18. [Documentation](#18-documentation)
19. [Experiments](#19-experiments)
20. [SAFE TO MODIFY (Frontend)](#20-safe-to-modify-frontend)

---

## 1. Server Entry Points and Core

These files bootstrap the Express server, register all routes, serve the compiled frontend, and configure the Vite dev server. Modifying any of them risks breaking the running production process.

| File | Purpose |
|------|---------|
| `server/index.ts` | Main entry point. Creates Express app, HTTP server, Helmet, body parsers, global error handlers. PM2 runs the compiled output of this file (`dist/index.cjs`). |
| `server/routes.ts` | Route registry. Imports and mounts all 35+ route modules, webhook routers, and starts background jobs. The order of route registration matters (webhooks before body parsers, static routes before parameterized routes). |
| `server/storage.ts` | Storage interface and in-memory implementation. Referenced by route registry via `storage` export. |
| `server/static.ts` | Serves the compiled `dist/public/` directory in production. Provides fallback 503 if build is missing. |
| `server/vite.ts` | Vite dev server middleware for development mode HMR. |

---

## 2. Server Routes (API Layer)

Each file defines an Express router with endpoint handlers for a specific domain. Every route enforces JWT authentication, organization context, and RBAC. Modifying any route file risks breaking API contracts that both the frontend and external webhooks depend on.

| File | Purpose |
|------|---------|
| `server/routes/auth.ts` | Login, logout, JWT token issuance, password reset flow |
| `server/routes/admin.ts` | Super Admin / Partner Admin CRUD for organizations, users, roles |
| `server/routes/agents.ts` | VAPI voice agents and Tavus video agents CRUD, assistant config |
| `server/routes/appointments.ts` | Calendar appointment CRUD with RBAC |
| `server/routes/approvals.ts` | Hunch approval workflow endpoints |
| `server/routes/activity.ts` | Activity feed and audit log endpoints |
| `server/routes/conversations.ts` | DealerBrain conversation history |
| `server/routes/credits.ts` | Credit balance, usage history, policy management |
| `server/routes/dashboard.ts` | Dashboard widget data endpoints |
| `server/routes/dealerbrain.ts` | DealerBrain AI chat (SSE streaming), tool calling |
| `server/routes/drive.ts` | File management and document storage |
| `server/routes/email.ts` | IMAP/SMTP email operations |
| `server/routes/goals.ts` | Goals and KPI tracking |
| `server/routes/google-calendar.ts` | Google Calendar OAuth + calendar sync job |
| `server/routes/hosted-pages.ts` | Hosted widget page management (authenticated) |
| `server/routes/hosted-pages-public.ts` | Public-facing hosted page rendering (no auth) |
| `server/routes/hunches.ts` | AI-generated hunch CRUD |
| `server/routes/inbox.ts` | Staff messaging inbox |
| `server/routes/insights.ts` | Voice, video, and lead insight card data |
| `server/routes/integrations.ts` | VIN Solutions and other integration config |
| `server/routes/knowledge.ts` | Knowledge base upload and management |
| `server/routes/leads.ts` | Lead CRUD, enrichment, VIN sync status |
| `server/routes/metrics.ts` | Metrics engine endpoints |
| `server/routes/notifications.ts` | In-app and email notification management |
| `server/routes/reports.ts` | Report generation and PDF export |
| `server/routes/settings.ts` | Organization and user settings |
| `server/routes/sms.ts` | TextMagic SMS sending and history |
| `server/routes/tasks.ts` | Task management CRUD |
| `server/routes/tracking.ts` | Tracking pixel event ingestion |
| `server/routes/triggers.ts` | Agent trigger rule CRUD and evaluation |
| `server/routes/userIntegrations.ts` | Per-user integration credentials |
| `server/routes/vin.ts` | VIN Solutions API proxy (leads, contacts, search) |
| `server/routes/widget-public.ts` | Public widget config endpoint (no auth, CORS enabled) |
| `server/routes/widgets.ts` | Widget configuration management (authenticated) |

---

## 3. Server Services (Business Logic)

These files contain all business logic, external API integrations, and data transformation. Each service is consumed by one or more route handlers. Modifying a service can cascade through multiple endpoints, webhooks, and scheduled jobs.

### Top-Level Services

| File | Purpose |
|------|---------|
| `server/services/AccessibleOrganizationsService.ts` | Resolves which organizations a user can access based on RBAC role |
| `server/services/ActivityService.ts` | Activity feed aggregation and filtering |
| `server/services/AgentService.ts` | VAPI + Tavus agent CRUD, metadata tagging |
| `server/services/AppointmentService.ts` | Calendar CRUD with RBAC enforcement |
| `server/services/ApprovalService.ts` | Approval workflow state machine |
| `server/services/ConversationService.ts` | DealerBrain conversation persistence |
| `server/services/CreditService.ts` | Credit balance tracking, usage deduction, policy enforcement |
| `server/services/DashboardService.ts` | Dashboard data aggregation |
| `server/services/DealerBrainService.ts` | Claude API integration with tool calling, system prompt, streaming |
| `server/services/DealerBrainStreamingService.ts` | SSE streaming layer for DealerBrain responses |
| `server/services/DealerPulseService.ts` | 5-phase dealer health snapshot generation (AI + rule-based) |
| `server/services/DriveService.ts` | File storage and document management |
| `server/services/EmailService.ts` | IMAP/SMTP email operations |
| `server/services/FeedbackService.ts` | User feedback collection and storage |
| `server/services/GoalsService.ts` | Goals and KPI tracking logic |
| `server/services/GoogleCalendarService.ts` | Google Calendar OAuth flow, event sync |
| `server/services/HostedPageService.ts` | Hosted widget page rendering and config |
| `server/services/HunchesService.ts` | AI-generated hunch creation and management |
| `server/services/InboxService.ts` | Staff messaging inbox operations |
| `server/services/KnowledgeUploadService.ts` | PDF/document parsing and knowledge base indexing |
| `server/services/MetricsEngine.ts` | Metrics calculation engine |
| `server/services/NotificationService.ts` | Multi-channel notification dispatch (email, in-app, SMS) |
| `server/services/PasswordResetService.ts` | Password reset token generation and validation |
| `server/services/PdfReportService.ts` | Puppeteer-based PDF report generation |
| `server/services/ReportService.ts` | Report data aggregation and formatting |
| `server/services/TaskService.ts` | Task management logic |
| `server/services/TextMagicService.ts` | TextMagic SMS API integration |
| `server/services/TrackingService.ts` | Tracking pixel event processing |
| `server/services/TriggerService.ts` | Agent trigger rule evaluation and execution |
| `server/services/WidgetAgentService.ts` | Widget-to-agent assignment logic |
| `server/services/WidgetConfigService.ts` | Master widget configuration management |
| `server/services/WidgetInteractionService.ts` | Widget interaction event tracking |
| `server/services/appointmentConfirmationService.ts` | Appointment confirmation email/SMS dispatch |
| `server/services/appointmentExtractionService.ts` | AI extraction of appointment details from call transcripts |
| `server/services/vinOAuthService.ts` | VIN Solutions OAuth 2.0 token management (encrypted storage, 60-min caching) |
| `server/services/vinSolutionsService.ts` | VIN Solutions API client (leads, contacts, search, reference data) |

### Subdirectory Services

| Directory / File | Purpose |
|-----------------|---------|
| `server/services/contextRouter/ContextRouterService.ts` | Routes data requests to VIN API (primary) or local DB (fallback) |
| `server/services/contextRouter/SourceSelector.ts` | Selects data source based on availability and freshness |
| `server/services/contextRouter/CacheManager.ts` | Caches VIN API responses to reduce external calls |
| `server/services/contextRouter/index.ts` | Barrel export for context router |
| `server/services/insights/VoiceInsightService.ts` | Voice agent call analytics |
| `server/services/insights/VideoInsightService.ts` | Video session analytics |
| `server/services/insights/LeadInsightService.ts` | Lead funnel and feed analytics |
| `server/services/insights/index.ts` | Barrel export for insight services |
| `server/services/leads/LeadCreationService.ts` | Lead creation with VIN Solutions 2-step flow (create contact, then lead) |
| `server/services/leads/LeadExtractionService.ts` | AI extraction of lead data from call/video transcripts |
| `server/services/leads/index.ts` | Barrel export for lead services |
| `server/services/sync/SyncCoordinator.ts` | Processes `sync_queue` table for VIN Solutions lead sync |
| `server/services/sync/LeadMapper.ts` | Maps local lead format to VIN Solutions v3 API format |
| `server/services/sync/index.ts` | Barrel export for sync services |
| `server/services/notifications/notificationEmailService.ts` | Email template rendering and dispatch for notifications |

---

## 4. Server Database Layer

The database layer enforces multi-tenant isolation via RLS (Row-Level Security). Every query passes through SecureQueryBuilder which sets `app.current_org_id` on the PostgreSQL connection. Modifying these files could silently break tenant isolation across the entire platform.

| File | Purpose |
|------|---------|
| `server/db.ts` | PostgreSQL connection pool (`pg.Pool`), pool configuration |
| `server/db/SecureQueryBuilder.ts` | Enforces RLS context on every query via `SET LOCAL app.current_org_id`. 53 RLS policies across 28 tables depend on this. |
| `server/db/index.ts` | Barrel export for database layer |
| `server/db/__tests__/SecureQueryBuilder.test.ts` | Unit tests for SecureQueryBuilder |

---

## 5. Server Middleware

| File | Purpose |
|------|---------|
| `server/middleware/enforceOrganizationContext.ts` | Validates `x-organization-id` header, sets RLS context for every API request |
| `server/middleware/validateResourceOwnership.ts` | Validates that a resource belongs to the requesting organization |
| `server/middleware/index.ts` | Barrel export for middleware |

---

## 6. Server Authentication

| File | Purpose |
|------|---------|
| `server/auth/jwt.ts` | JWT token signing, verification, expiry configuration |
| `server/auth/middleware.ts` | Express middleware that validates JWT from Authorization header and populates `req.user` |

---

## 7. Server Webhooks

These are externally-facing endpoints that VAPI and Tavus call when events occur (call ended, video session completed). They trigger lead creation, credit deduction, notification dispatch, and VIN sync. Modifying these files risks breaking live call processing for production customers.

| File | Purpose |
|------|---------|
| `server/webhooks/index.ts` | Barrel export for webhook routers |
| `server/webhooks/vapi.ts` | VAPI webhook handler: processes call-end events, extracts leads, deducts credits, sends notifications, queues VIN sync. Registered at `/api/webhooks/vapi`. |
| `server/webhooks/tavus.ts` | Tavus webhook handler: HMAC signature verification, processes video session events, extracts leads, deducts credits. Registered at `/api/webhooks/tavus`. |
| `server/webhooks/utils/signatureVerifier.ts` | HMAC-SHA256 signature verification utility for Tavus webhooks |

---

## 8. Server WebSocket

| File | Purpose |
|------|---------|
| `server/websocket/WebSocketServer.ts` | WebSocket server for real-time notifications and inbox updates |
| `server/websocket/index.ts` | Barrel export for WebSocket module |

---

## 9. Server Jobs and Schedulers

Background jobs that run on intervals. They process queues, refresh tokens, generate AI content, and sync data. Modifying these affects production data accuracy and integration reliability.

| File | Purpose |
|------|---------|
| `server/jobs/syncQueueWorker.ts` | Processes `sync_queue` table entries to sync leads to VIN Solutions CRM. Runs continuously. |
| `server/jobs/vinTokenRefreshJob.ts` | Refreshes VIN Solutions OAuth tokens before 60-minute expiry |
| `server/jobs/vinLeadPollingJob.ts` | Polls VIN Solutions API for new/updated leads |
| `server/jobs/emailSyncJob.ts` | Syncs email via IMAP for inbox functionality |
| `server/jobs/dealerPulseJob.ts` | Generates dealer health snapshots every 4 hours (60s startup delay) |
| `server/jobs/hunchGenerationJob.ts` | AI-generated hunches on schedule |
| `server/jobs/triggerReevalJob.ts` | Re-evaluates trigger rules for pending conditions |
| `server/jobs/appointmentReminderJob.ts` | Sends appointment reminder notifications |

---

## 10. Server Utilities

| File | Purpose |
|------|---------|
| `server/utils/encryption.ts` | AES encryption/decryption for stored credentials (VIN OAuth tokens, integration secrets) |
| `server/utils/requireEnv.ts` | Validates required environment variables at startup |

---

## 11. Database Migrations

33 migration files that define the production database schema. These have been applied to the live Supabase database. Adding, modifying, or reordering migrations will cause schema drift or data loss.

| File | Purpose |
|------|---------|
| `database/migrations/001_create_core_tables.sql` | Users, organizations, roles, partners |
| `database/migrations/002_create_remaining_tables.sql` | Agents, insights, leads, VAPI call logs, Tavus sessions |
| `database/migrations/003_context_router_tables.sql` | Context router cache and routing config |
| `database/migrations/004_create_user_integrations.sql` | Per-user integration credentials |
| `database/migrations/004_serra_seed_data.sql` | Serra Honda seed data (production customer) |
| `database/migrations/005_create_appointments_tables.sql` | Appointments and calendar events |
| `database/migrations/006_create_email_tables.sql` | Email accounts, messages, threads |
| `database/migrations/007_create_dealerbrain_config.sql` | DealerBrain AI configuration per org |
| `database/migrations/008_create_notifications_tables.sql` | Notification preferences and history |
| `database/migrations/009_create_password_reset_tokens.sql` | Password reset token storage |
| `database/migrations/010_create_textmagic_tables.sql` | SMS configuration and message history |
| `database/migrations/012_credit_policy_unique.sql` | Credit policy uniqueness constraint |
| `database/migrations/013_create_widget_tables.sql` | Master widget configuration |
| `database/migrations/014_widget_interaction_tables.sql` | Widget interaction event tracking |
| `database/migrations/015_hosted_pages.sql` | Hosted widget pages |
| `database/migrations/016_inbox_conversations.sql` | Staff messaging inbox conversations |
| `database/migrations/017_tracking_events.sql` | Tracking pixel events |
| `database/migrations/018_trigger_rules.sql` | Agent trigger rules and conditions |
| `database/migrations/019_ai_usage_events.sql` | AI usage event logging |
| `database/migrations/020_report_benchmarks.sql` | Report benchmarks and comparison data |
| `database/migrations/021_widget_agent_config.sql` | Widget-to-agent assignment config |
| `database/migrations/022_drive_files.sql` | Drive file storage metadata |
| `database/migrations/023_hunches_approvals.sql` | Hunches and approval workflow tables |
| `database/migrations/024_credit_idempotency.sql` | Credit deduction idempotency guard |
| `database/migrations/025_dealer_pulse_cache.sql` | Dealer Pulse cache table (JSONB) |
| `database/migrations/026_org_lead_settings.sql` | Organization-level lead settings |
| `database/migrations/027_knowledge_uploads.sql` | Knowledge base upload metadata |
| `database/migrations/028_notification_idempotency.sql` | `notification_sent` column on `vapi_call_logs` |
| `database/migrations/029_default_trigger_templates.sql` | Default trigger rule templates |
| `database/migrations/030_vin_api_call_tracking.sql` | VIN API call audit logging |
| `database/migrations/031_service_quotas.sql` | Service quota limits per org |
| `database/migrations/032_sms_business_hours.sql` | SMS business hours configuration |
| `database/migrations/033_register_video_agents.sql` | Video agent registration data |

### Database Support Files

| File | Purpose |
|------|---------|
| `database/seed.sql` | Production seed data |
| `database/run-seed.ts` | Seed execution script |
| `database/generate-seed.ts` | Seed data generation |
| `database/check-users.ts` | User verification utility |
| `database/update-password.ts` | Password update utility |

---

## 12. Shared Schema

| File | Purpose |
|------|---------|
| `shared/schema.ts` | Schema definitions shared between server and client. Defines table shapes, insert schemas, and TypeScript types. Both `server/` and `client/` import from this file via the `@shared/*` path alias. |

**Why it must not be touched:** Changing the schema changes the TypeScript types that the server expects. The server compiles against this schema. Modifying it without corresponding server changes will cause type errors and build failures.

---

## 13. Widget (Embeddable)

The widget is a standalone Vite-built library that gets embedded on dealership websites via `<script>` tag. It communicates with the backend via public API endpoints. It is NOT part of the main frontend rebuild.

| File | Purpose |
|------|---------|
| `widget/vite.config.ts` | Widget build configuration (outputs to `dist/public/widget/`) |
| `widget/tsconfig.json` | Widget TypeScript config |
| `widget/postcss.config.js` | Widget PostCSS config |
| `widget/src/index.ts` | Widget entry point and initialization |
| `widget/src/Widget.tsx` | Main widget component |
| `widget/src/WelcomeScreen.tsx` | Widget welcome/landing screen |
| `widget/src/api.ts` | API client for widget-to-server communication |
| `widget/src/api-helpers.ts` | API helper utilities |
| `widget/src/types.ts` | Widget TypeScript type definitions |
| `widget/src/styles.css` | Widget styles (self-contained, shadow DOM) |
| `widget/src/tracking-pixel.ts` | Tracking pixel script (built separately via esbuild) |
| `widget/src/channels/CallUs.tsx` | "Call Us" channel component |
| `widget/src/channels/CallYou.tsx` | "Call You" channel component |
| `widget/src/channels/SendText.tsx` | "Send Text" channel component |
| `widget/src/channels/TextChat.tsx` | Text chat channel component |
| `widget/src/channels/VideoAgent.tsx` | Video agent channel component |
| `widget/src/channels/WebAudio.tsx` | Web audio (voice) channel component |

---

## 14. Build System

The build system compiles both the frontend (Vite) and backend (esbuild) into `dist/`. PM2 runs the output. Modifying the build pipeline can prevent deployment.

| File | Purpose |
|------|---------|
| `script/build.ts` | Master build script: compiles client (Vite), widget (Vite), tracking pixel (esbuild), and server (esbuild) into `dist/`. Defines external dependency allowlist for server bundling. |
| `deploy.sh` | Safe deployment script. Enforces master-branch-only deployment, runs `npm run build`, restarts PM2. |

---

## 15. Root Configuration Files

| File | Purpose | Why Frozen |
|------|---------|-----------|
| `.env` | All environment variables: database URL, API keys (VAPI, Tavus, VIN Solutions, Resend, TextMagic, Claude, Google), JWT secret, encryption key | Contains production secrets. Any change affects running server. |
| `.env.example` | Template showing required environment variables | Reference for new developers |
| `.env.reference` | Extended reference with documentation | Reference document |
| `package.json` | Dependencies for both server and client, npm scripts (`dev`, `build`, `start`, `check`) | Server dependencies must not change. See note below. |
| `package-lock.json` | Locked dependency tree | Must stay in sync with package.json |
| `tsconfig.json` | TypeScript config for entire monorepo (includes `client/`, `server/`, `shared/`). Defines path aliases `@/*` and `@shared/*`. | Server compilation depends on this config. |
| `drizzle.config.ts` | Database tooling configuration. Points to `shared/schema.ts` and `DATABASE_URL`. | Database tooling config |
| `vite.config.ts` | Vite config for the main client build. Defines path aliases, output directory (`dist/public`), React plugin. | Changing build output path breaks `server/static.ts` serving. |
| `tailwind.config.ts` | Tailwind CSS configuration with custom theme | Theme tokens are referenced by components. See Section 20 for guidance. |
| `postcss.config.js` | PostCSS configuration (Tailwind + autoprefixer) | Build pipeline dependency |
| `components.json` | shadcn/ui configuration (style: new-york, aliases) | Component library config |
| `playwright.config.ts` | Playwright E2E test configuration (test directory, base URL, global setup) | Test infrastructure |
| `railway.toml` | Railway deployment configuration (build command, start command, health check) | Deployment infrastructure |
| `.gitignore` | Git ignore rules | Repository config |
| `CLAUDE.md` | Project instructions for Claude Code sessions | Project memory |
| `README.md` | Project readme | Documentation |

**Note on `package.json`:** If the frontend rebuild requires NEW client-side dependencies, those may be added to `dependencies` or `devDependencies`. However: do NOT remove, upgrade, or downgrade any existing dependency. Do NOT modify the `scripts` section. Do NOT modify `overrides` or `optionalDependencies`.

---

## 16. Test Suite

All existing E2E and verification tests must be preserved. They validate that backend behavior has not regressed. The frontend rebuild should aim for these tests to continue passing (or tests should be updated to match new UI selectors, but the test LOGIC must not change).

### E2E Tests (Playwright)

| File | Purpose |
|------|---------|
| `tests/e2e/helpers/global-setup.ts` | Global test setup (authentication state) |
| `tests/e2e/helpers/test-utils.ts` | Shared test utilities and helpers |
| `tests/e2e/auth.spec.ts` | Authentication flow tests |
| `tests/e2e/dashboard.spec.ts` | Dashboard UI tests |
| `tests/e2e/dashboard-api.spec.ts` | Dashboard API contract tests |
| `tests/e2e/agents.spec.ts` | Agent management tests |
| `tests/e2e/chat.spec.ts` | DealerBrain chat tests |
| `tests/e2e/credits.spec.ts` | Credit management tests |
| `tests/e2e/data-quality.spec.ts` | Data quality validation |
| `tests/e2e/dealerbrain-persona.spec.ts` | DealerBrain persona tests |
| `tests/e2e/demo-validation.spec.ts` | Demo flow validation |
| `tests/e2e/devils-advocate-verification.spec.ts` | Adversarial test scenarios |
| `tests/e2e/insights.spec.ts` | Insights page tests |
| `tests/e2e/integration-accuracy.spec.ts` | Integration data accuracy |
| `tests/e2e/navigation.spec.ts` | Navigation and routing tests |
| `tests/e2e/phase-7-certification.spec.ts` | Phase 7 certification suite |
| `tests/e2e/product-tour.spec.ts` | Product tour onboarding tests |
| `tests/e2e/profile.spec.ts` | User profile tests |
| `tests/e2e/rbac.spec.ts` | Role-based access control tests |
| `tests/e2e/settings.spec.ts` | Settings page tests |
| `tests/e2e/silent-failures.spec.ts` | Silent failure detection |
| `tests/e2e/users.spec.ts` | User management tests |
| `tests/e2e/webhook-vapi.spec.ts` | VAPI webhook integration tests |
| `tests/e2e/work-center.spec.ts` | Work center tests |
| `tests/e2e/sprint-10-widget.spec.ts` | Widget feature tests |
| `tests/e2e/sprint-11-hosted-pages.spec.ts` | Hosted pages tests |
| `tests/e2e/sprint-12-staff-inbox.spec.ts` | Staff inbox tests |
| `tests/e2e/sprint-13-tracking-pixel.spec.ts` | Tracking pixel tests |
| `tests/e2e/sprint-14-agent-triggers.spec.ts` | Agent trigger tests |
| `tests/e2e/sprint-15-ai-governance.spec.ts` | AI governance tests |
| `tests/e2e/sprint-16-goals.spec.ts` | Goals feature tests |
| `tests/e2e/sprint-17-google-calendar.spec.ts` | Google Calendar tests |
| `tests/e2e/sprint-18-drive.spec.ts` | Drive feature tests |
| `tests/e2e/sprint-19-hunches-approvals.spec.ts` | Hunches and approvals tests |
| `tests/e2e/sprint-20-leads-demo.spec.ts` | Leads and demo readiness tests |
| `tests/e2e/sprint-r1-demo.spec.ts` | Regression: demo flow |
| `tests/e2e/sprint-r2-demo.spec.ts` | Regression: demo flow 2 |
| `tests/e2e/sprint-r3-insights.spec.ts` | Regression: insights |
| `tests/e2e/sprint-r4-rbac.spec.ts` | Regression: RBAC |
| `tests/e2e/sprint-r5-crud.spec.ts` | Regression: CRUD operations |
| `tests/e2e/sprint-r6-comms.spec.ts` | Regression: communications |
| `tests/e2e/sprint-r7-pages.spec.ts` | Regression: hosted pages |
| `tests/e2e/stabilization-agents.spec.ts` | Stabilization: agent features |
| `tests/e2e/stabilization-dealerbrain.spec.ts` | Stabilization: DealerBrain |
| `tests/e2e/stabilization-drive.spec.ts` | Stabilization: Drive |
| `tests/e2e/stabilization-reports.spec.ts` | Stabilization: Reports |
| `tests/e2e/stabilization-widget-controls.spec.ts` | Stabilization: Widget controls |
| `tests/e2e/stabilization-work-hub.spec.ts` | Stabilization: Work hub |

### Standalone Test Scripts

| File | Purpose |
|------|---------|
| `tests/data-accuracy.ts` | Data accuracy validation against VIN API |
| `tests/dealerbrain-smoke.ts` | DealerBrain smoke test |
| `tests/e2e-mvp-verification.ts` | MVP verification suite |
| `tests/env-check.ts` | Environment variable validation |

### Verification Scripts

| File | Purpose |
|------|---------|
| `tests/verification/communications-accuracy.ts` | Comms accuracy verification |
| `tests/verification/crud-accuracy.ts` | CRUD accuracy verification |
| `tests/verification/dealerbrain-accuracy.ts` | DealerBrain accuracy verification |
| `tests/verification/insights-accuracy.ts` | Insights accuracy verification |
| `tests/verification/multi-org-insights-accuracy.ts` | Multi-org insights verification |
| `tests/verification/stabilization-dealer-pulse.ts` | Dealer Pulse verification |
| `tests/verification/stabilization-hunches.ts` | Hunches verification |
| `tests/verification/stabilization-insights.ts` | Insights stabilization verification |
| `tests/verification/stabilization-org-isolation.ts` | Org isolation verification |
| `tests/verification/stabilization-triggers.ts` | Triggers verification |
| `tests/verification/stabilization-vin-roundtrip.ts` | VIN roundtrip verification |
| `tests/verification/stabilization-vin-sync.ts` | VIN sync verification |

### Operational Test Scripts

| File | Purpose |
|------|---------|
| `tests/scripts/check-enrichment-health.ts` | Enrichment health check |
| `tests/scripts/elliott-test-v2.ts` | Elliott-specific test scenario |
| `tests/scripts/fix-vin-contacts.ts` | VIN contact fix utility |
| `tests/scripts/re-enrich-leads.ts` | Lead re-enrichment script |
| `tests/scripts/test-vin-contacts.ts` | VIN contact test |
| `tests/scripts/vapi-backfill.ts` | VAPI data backfill |
| `tests/scripts/vapi-cross-reference.ts` | VAPI cross-reference check |

---

## 17. Scripts (Operational)

Diagnostic and operational scripts. These interact with production APIs and data.

| File | Purpose |
|------|---------|
| `scripts/check-agent-config.ts` | Validates agent configuration |
| `scripts/check-uploads.cjs` | Validates upload directory |
| `scripts/check-vapi-webhooks.ts` | Validates VAPI webhook registration |
| `scripts/field-population-audit.ts` | Audits field population in database |
| `scripts/fix-pdf-content.cjs` | PDF content fix utility |
| `scripts/get-lead-detail.cjs` | Lead detail lookup |
| `scripts/import-vapi-calls.ts` | VAPI call history import |
| `scripts/list-vapi-assistants.ts` | Lists VAPI assistants |
| `scripts/probe-apis.ts` | API endpoint probe utility |
| `scripts/probe-put-headers.ts` | VIN API header format testing |
| `scripts/test-email.cjs` | Email sending test |
| `scripts/test-pdf-parse.cjs` | PDF parsing test |
| `scripts/test-searchleads.cjs` | VIN lead search test |
| `scripts/test-vin-api.cjs` | VIN API connectivity test |
| `scripts/test-vin-detailed.cjs` | Detailed VIN API test |
| `scripts/test-webhook-email.ts` | Webhook email test |
| `scripts/test-webhook-query.ts` | Webhook query test |
| `scripts/update-vapi-webhooks.ts` | Updates VAPI webhook URLs |
| `scripts/update-vapi-webhooks-direct.ts` | Direct VAPI webhook URL update |

---

## 18. Documentation

All governing documents, specifications, evidence, and user manuals. These define platform identity, requirements, and architectural decisions.

### Governing Documents (Highest Priority)

| File | Purpose |
|------|---------|
| `docs/CONSTITUTION.md` | Platform identity, principles, development rules |
| `docs/MASTER_SRS.md` | 17 sections, 257 requirements |
| `docs/CURRENT_STATE_ASSESSMENT.md` | 200 implemented, 38 partial, 10 gaps |
| `docs/IMPLEMENTATION_PLAN.md` | 10 phases, priority-ordered |

### Active Reference Documents

| File | Purpose |
|------|---------|
| `docs/ARCHITECTURE_GUIDE.md` | 4-layer architecture description |
| `docs/ARCHITECTURE_GUIDE_RBAC_ADDITION.md` | Partner/RBAC model documentation |
| `docs/ARCHITECTURE_VISUAL_MAP.md` | Visual diagrams and flow charts |
| `docs/THEME_CONTRACT.md` | Theme system specification |
| `docs/UI_DEVELOPER_HANDOFF.md` | UI patterns and component library |
| `docs/VIN_SOLUTIONS_INTEGRATION.md` | OAuth2 architecture for VIN Solutions |
| `docs/BRAIN_DUMP.md` | User's narrative explanation of Nexxus |
| `docs/BRAIN_DUMP_RAW.md` | Original voice transcript |
| `docs/ACCEPTANCE_VERIFICATION_REPORT.md` | 13/13 acceptance criteria verification |
| `docs/CUSTOMER_ONBOARDING_KICKOFF.md` | Customer onboarding checklist |
| `docs/DATA_ACCURACY_REPORT.md` | Data accuracy audit results |
| `docs/DATA_SOURCE_INVENTORY.md` | All data sources inventory |
| `docs/DESIGN_FLAGS.md` | Async design decision review flags |
| `docs/DEVELOPMENT_TEAM_BRIEFING.md` | Team briefing document |
| `docs/FEATURE_GAPS.md` | Known feature gaps |
| `docs/INSIGHT_CARDS_SPECIFICATION.md` | Insight card specifications |
| `docs/NEXXUS_V2_BOOTSTRAP_PROMPT.md` | Bootstrap prompt for new sessions |
| `docs/REVERSE_SRS.md` | Reverse-engineered SRS from codebase |

### All Remaining `docs/` Subdirectories

The entire `docs/` directory tree is frozen. This includes:

- `docs/archive/` -- All archived materials
- `docs/audit/` -- Audit reports (client, server, database, health)
- `docs/automa-knowledge/` -- DealerBrain/Automa system knowledge
- `docs/evidence/` -- All verification evidence, screenshots, probe results
- `docs/reference/` -- Production deployment references, Serra dealer IDs
- `docs/research/` -- VAPI, Tavus, VIN lead API research
- `docs/specifications/` -- Agent architecture, decisions log, implementation decisions
- `docs/user-feedback/` -- User feedback log
- `docs/user-manual/` -- Super Admin, Partner Admin, Org User manuals

---

## 19. Experiments

| File | Purpose |
|------|---------|
| `experiments/README.md` | Experiment documentation |
| `experiments/vin-token-expiry-test.ts` | VIN token expiry experiment |
| `experiments/vin-experiment.log` | Experiment execution log |
| `experiments/reports/` | Experiment result reports |

---

## 20. SAFE TO MODIFY (Frontend)

The following files and directories are expected to change during the UI rebuild. These are the ONLY files that should be modified.

### Client Directory (`client/`)

The entire `client/` directory is the frontend and is safe to modify, with the following structure:

```
client/
  index.html                          -- HTML shell (safe to modify)
  public/                             -- Static assets (safe to modify)
    favicon.png
    wallpapers/
  src/
    main.tsx                           -- React entry point
    App.tsx                            -- Root component and router
    index.css                          -- Global styles / Tailwind imports
    components/                        -- All UI components
      admin/                           -- Admin panel components
      auth/                            -- Auth components (ProtectedRoute)
      calendar/                        -- Calendar components
      chat/                            -- Chat/DealerBrain UI components
      communication/                   -- Email compose, inbox UI
      inbox/                           -- Inbox panel
      insights/                        -- Insight card components
      layout/                          -- AppLayout, Sidebar, TopBar, etc.
      modals/                          -- Modal dialogs
      notifications/                   -- Notification bell, settings
      onboarding/                      -- Product tour
      reports/                         -- Report viewer, charts
      settings/                        -- Settings tab components
      sms/                             -- SMS compose dialog
      ui/                              -- shadcn/ui primitives (50+ files)
    contexts/                          -- React context providers
      AppContext.tsx
      AuthContext.tsx
      ChatContext.tsx
      ThemeContext.tsx
    hooks/                             -- Custom React hooks (30+ files)
    lib/                               -- Client utilities
      api.ts                           -- API client (fetch wrapper)
      queryClient.ts                   -- TanStack Query configuration
      utils.ts                         -- General utilities (cn(), etc.)
    mocks/                             -- Mock data for development
    pages/                             -- Page components (routes)
      activity.tsx
      agents.tsx, agents-create.tsx, agents-edit.tsx
      credits.tsx
      dashboard.tsx
      drive.tsx
      forgot-password.tsx
      hosted/                          -- Hosted page components
      insights.tsx
      login.tsx
      main.tsx
      not-found.tsx
      notifications.tsx
      profile.tsx
      reset-password.tsx
      settings.tsx
      work-center.tsx
```

### Rules for Frontend Modifications

1. **API contracts are immutable.** The frontend may call any existing API endpoint, but the request/response shapes are defined by the server. Do not assume you can change what the server returns.

2. **Do not modify `client/src/lib/api.ts` in ways that break the request format.** The base URL, authentication header injection, and error handling patterns must remain compatible with the server.

3. **`shared/schema.ts` is frozen.** The client imports types from `@shared/schema`. These types reflect the database schema. The frontend must conform to these types, not the other way around.

4. **`client/src/contexts/AuthContext.tsx`** manages JWT token storage and the authentication state machine. If rewriting this, ensure it still calls `POST /api/auth/login` and `POST /api/auth/logout` with the existing request/response format.

5. **New client-side dependencies** may be added to `package.json` under `dependencies` or `devDependencies`. Do NOT remove or change versions of existing packages.

6. **`tailwind.config.ts`** may be modified to add new theme tokens or extend the design system, but do NOT remove existing tokens that the widget or server-rendered content may reference.

7. **`components.json`** may be modified if switching shadcn/ui configuration, but be aware it affects the `npx shadcn-ui add` command behavior.

8. **`vite.config.ts`** may be modified for frontend build configuration, but the `build.outDir` must remain `dist/public` and the `@shared` alias must remain pointing to `./shared`. The server expects the compiled frontend at `dist/public/`.

### What NOT to Do From the Frontend

- Do not add new API routes (that requires server changes)
- Do not modify the WebSocket protocol
- Do not change the JWT token format or storage location
- Do not modify how organization context (`x-organization-id` header) is sent
- Do not change the URL structure for hosted pages (`/hosted/*` routes are handled by both client router and server)

---

## Summary Statistics

| Category | File Count |
|----------|-----------|
| Server core + routes + services + middleware + auth + webhooks + websocket + jobs + utils | 88 files |
| Database migrations + support | 38 files |
| Shared schema | 1 file |
| Widget | 17 files |
| Build system | 2 files |
| Root config files | 15 files |
| Tests | 65 files |
| Scripts | 19 files |
| Documentation | 100+ files |
| **Total DO NOT TOUCH** | **345+ files** |
| **Safe to modify (client/)** | **~130 files** |

---

**This document is the authoritative reference for the frontend rebuild scope boundary. When uncertain, default to not modifying the file and ask first.**
