# Nexxus Connect v3.0 — AI-Powered Dealership Platform

## Overview

Nexxus Connect is an AI-powered dealership management platform that aims to streamline dealership operations through AI-powered tools and a user-centric interface. It replaces traditional feature-based navigation with an intuitive persona-driven approach, providing a validated frontend prototype with real database-backed data. The project is structured around a 4-wave product roadmap, with the UI prototype (this Replit) focusing on the frontend experience and a separate backend handling extensive API endpoints and integrations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The platform is divided into two layers: a UI Prototype and a Production Backend.

### Frontend Stack
-   **React 18** with TypeScript
-   **Vite** for development and building
-   **Wouter** for client-side routing
-   **TanStack Query** for data fetching and mutation caching
-   **Tailwind CSS** with custom design tokens
-   **Shadcn/ui** component library built on Radix UI primitives

### Backend Stack
-   **Express** with TypeScript
-   **PostgreSQL** with Drizzle ORM
-   **JWT** authentication
-   **bcrypt** for password hashing
-   **Anthropic SDK** for Claude AI (claude-sonnet-4-6)

### Data Flow and Key Features
The system integrates real API data across various modules:
-   **TeamBox**: Conversation management, including `GET /api/conversations`, `GET /api/conversations/:id/messages`, `POST /api/conversations/:id/messages`, `PATCH /api/conversations/:id`.
-   **AI Chat**: Real Claude AI streaming via `POST /api/chat/:conversationId/stream` (SSE), with message persistence and markdown rendering. Includes Main Chat, RightPane Chat, and Agent Chat.
-   **Knowledge Base RAG**: Injecting KB documents into AI chat system prompts for context.
-   **Agent/Campaign Management**: Pages for Service, Marketing, and Sales departments fetch agents and campaigns from `/api/agents` and `/api/campaigns`.
-   **User Management**: Full CRUD operations for users and roles, including `GET /api/users`, `POST /api/users`, `PATCH /api/users/:id`, `GET /api/roles`, and password management. Role-Based Access Control (RBAC) is enforced.
-   **Communication Gate**: Global switch via `PATCH /api/organizations/:id` to control outbound communications.
-   **Profile Management**: `PATCH /api/users/me` for user profile updates.
-   **Auth**: JWT login/logout/refresh and session management.
-   **VAPI Integration**: Analytics and activity tracking for agents via `/api/vapi/analytics` and `/api/vapi/calls`. Read-only proxy for VAPI and Tavus API endpoints.
-   **Outbound Engine**: Campaign execution with kill switch, rate limiting, and template substitution.
-   **Notifications**: Real-time notifications with mark-as-read functionality.
-   **Activity Log**: Management page displaying real system events.
-   **AI Hunches**: Claude-powered business insight generation with an accept/dismiss/resolve lifecycle.
-   **Campaign Execution UI**: Controls for starting, stopping, and dry-running campaigns with progress tracking.
-   **Metrics Pipeline**: Canonical `/api/metrics/pipeline` endpoint — active pipeline (14-day window, excludes Lost/Sold/Duplicate), appointments today, open escalations, outbound sent (24h). Same source for AI Chat, Sales, and Management dashboards.
-   **Error Boundary**: React ErrorBoundary wraps entire app. Global 401 handler auto-redirects expired sessions to login.
-   **Org Settings Persistence**: JSONB `settings` column on organizations for notification and appearance preferences.

### UI/UX Decisions and Layout Architecture
The platform utilizes a context-aware multi-pane layout.
-   Data-centric pages feature AI chat in a right pane.
-   Chat-centric pages display information/configuration in a right pane.
-   TeamBox has a unique 4-column internal layout.

### Database Schema
The database comprises 20 tables: `roles`, `organizations`, `users`, `sessions`, `agents`, `conversations`, `messages`, `campaigns`, `tasks`, `widgets`, `integrations`, `knowledge_documents`, `campaign_recipients`, `outbound_log`, `notifications`, `activity_log`, `hunches`, `warehouse_leads`, `warehouse_metrics`, and `sync_log`. The warehouse tables support the data warehouse pattern with source attribution (`dataSource`, `sourceId`, `syncedAt` columns).

### API Routes
A comprehensive set of API routes supports both public access (login, password reset) and authenticated operations across all modules, including agents, organizations, users, conversations, campaigns, documents, VAPI/Tavus proxies, metrics, tasks, widgets, integrations, notifications, activity logs, AI hunches, sync management, and warehouse queries.

### Data Warehouse & Sync Service
- **server/sync.ts**: Tiered sync service — historical backfill, daily delta (2am ET), metrics refresh (4h during 8am-6pm ET)
- **Warehouse-first reads**: `/api/vin/leads/summary` checks warehouse_metrics first, falls back to live MCP
- **Sync admin routes**: POST /api/sync/{backfill,delta,metrics}, GET /api/sync/{status,logs}
- **Warehouse query routes**: GET /api/warehouse/{leads,metrics}

### Context Router (AI Chat Data Provenance)
- AI chat has 3 tools: `web_search`, `vin_query_leads`, `vin_lead_summary`
- System prompt includes data provenance rules — AI must state data source and freshness
- Sync freshness timestamps injected into chat context
- Hunch context includes source tags and generation age

## External Dependencies

### Frontend
-   **Wouter**: Client-side routing
-   **TanStack Query**: Data fetching and caching
-   **Tailwind CSS**: Utility-first CSS framework
-   **Shadcn/ui**: Component library built on Radix UI
-   **date-fns**: Date formatting

### Backend
-   **PostgreSQL**: Primary database
-   **Drizzle ORM**: Schema management and queries
-   **JWT (jsonwebtoken)**: Token-based authentication
-   **bcrypt**: Password hashing

### Outbound & Communications
-   **TextMagic**: SMS service (X-TM-Key REST API), inbound webhook at POST /api/webhooks/textmagic
-   **Resend**: Email service (from notifications@huminic.ai), org invite emails
-   **4-layer safety**: Global OUTBOUND_LIVE_ENABLED env var → org comm gate → per-channel toggles → rate limit
-   **Outbound status**: GET /api/outbound/status returns global+org+channel status

### Public Routes (No Auth)
-   **Landing pages**: GET /p/:slug serves public landing page with org branding from DB
-   **Widget config**: GET /api/widgets/public/:widgetCode returns widget appearance/channels
-   **Widget JS loader**: GET /widget/nexxus-widget.js serves embeddable widget script
-   **Landing page API**: GET /api/public/landing/:slug returns org name, persona, slug

### Production Backend (separate environment)
-   **VinSolutions**: CRM integration (Lead Management tier — read/query only, no full sync)
-   **VAPI**: Voice integration
-   **Tavus**: Video integration
-   **Resend**: Email service
-   **TextMagic**: SMS service
-   **Claude API**: AI capabilities
-   **Google Calendar**: Calendar integration

### VinSolutions Data Architecture
The VinSolutions integration is a **Lead Management** tier — NOT a sync-level integration. This means:
- **Can**: Query/pull data on demand
- **Cannot**: Do wholesale two-way synchronization
- **Result**: Platform maintains a **forked local data store** (data warehouse) with its own copy of CRM data

**Sync Strategy (3 tiers):**
1. **One-time historical pull** — bulk import all available VinSolutions data (verbally told 48h lookback but observed longer access — take what's available)
2. **Daily incremental** — each day, pull data that changed in the previous 24 hours
3. **Business-hours dashboard refresh** — every 4 hours during business hours, refresh metrics that power dashboard tiles

**NOT real-time** except for leads originating from Nexxus tools (VAPI calls, chat widgets, etc.)

**Context Router / Data Provenance:**
- Every piece of data has a known source: VinSolutions (CRM), VAPI (voice), Tavus (video), uploaded data, generated insights
- When AI chat answers a user's question, it must tell the user the data source ("this came from VinSolutions" vs "this came from your local data store")
- The data warehouse acts as a context router — aggregating multi-source data while preserving provenance

**Insight History:**
- Hunches/insights are not just point-in-time — they are memorialized so historical trends can be analyzed over time