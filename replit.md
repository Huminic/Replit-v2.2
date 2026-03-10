# Nexxus Connect v3.0 — AI-Powered Dealership Platform

## Overview

Nexxus Connect is an AI-powered dealership management platform designed for Serra Auto Group / Cage Automotive. It revolutionizes dealership operations by replacing traditional navigation with an intuitive, persona-driven interface. The platform provides a validated frontend prototype with real-time, database-backed data, adhering to the principle that "UI = T1 truth" – meaning the UI reflects the data source directly, with no hardcoded fallback values for metrics. Its core purpose is to streamline dealership workflows through AI-driven insights and communication, aiming to enhance efficiency and customer engagement.

## User Preferences

Preferred communication style: Simple, everyday language.
Work mode: Functional area walkthrough — stop at each area, review ACs together, discuss outcomes, then implement/test.

## System Architecture

### Frontend
The frontend is built with **React 18** and **TypeScript**, utilizing **Vite** for optimized development and builds. **Wouter** handles client-side routing, while **TanStack Query** manages data fetching and caching. Styling is implemented with **Tailwind CSS**, incorporating custom design tokens, and the **Shadcn/ui** component library (built on Radix UI primitives) provides a robust UI foundation. The design prioritizes displaying live API data for all metric tiles, ensuring data consistency across the application.

### Backend
The backend runs on **Express** with **TypeScript**, interacting with a **PostgreSQL** database managed by **Drizzle ORM** (comprising 22 tables). Security is handled with **JWT** for authentication and **bcrypt** for password hashing. The platform integrates **Anthropic SDK** for AI capabilities, primarily using Claude AI models (Claude Sonnet for general chat and Opus for data analysis).

### Core Features
- **Persona-driven UI**: Intuitive navigation based on user roles and needs.
- **AI Chat**: Core chat functionality with token-by-token streaming, conversation persistence, and model selection (Claude, Gemini, OpenAI fallback to Claude). Includes CRM Guru mode for enriched data insights and hunch-influenced prompting.
- **Communication Management**: A robust 5-layer communication gate safety system (global, organization, channel, rate limit, campaign kill switch), supporting SMS (TextMagic), email (Resend), and VAPI (voice) outbound communications.
- **Agent and Trigger System**: Configuration for AI agents (name, department, personality, auto-greeting) and a flexible trigger handling system for outbound actions. Hunch filtering influences AI prompts.
- **Lead Handling**: Comprehensive system for one-off lead management from various sources (VAPI, Tavus, widgets), including a 4-channel embeddable widget and public landing pages for lead capture.
- **Metrics and Reporting**: Displays real-time metrics (e.g., active pipeline) with consistency across dashboards and insights pages, sourced from `warehouse_leads` and `appointments` tables, supported by a VIN status classifier.
- **Multi-Store Architecture**: Designed to support multiple dealerships under a single partner entity (e.g., Cage Automotive with 5 stores), ensuring data isolation and proper organizational mapping for VIN Solutions API calls.

## External Dependencies

### Data & AI
- **PostgreSQL**: Primary database.
- **Anthropic SDK**: For Claude AI (claude-sonnet-4-6 for general chat, Opus for data analysis).

### Communications
- **TextMagic**: For SMS capabilities (specifically for Serra Honda).
- **Resend**: For email delivery and notifications.
- **VAPI**: For voice communication services, integrated via `@vapi-ai/web` SDK and server API.
- **Tavus**: For video session capabilities.

### Integrations
- **VinSolutions**: Full CRM integration via MCP proxy (`server/vendorProxy.ts`). Available MCP tools:
  - `vin_query_leads` — Query leads by date/status
  - `vin_get_lead_sources` / `vin_get_lead_statuses` — Metadata lookups
  - `vin_list_dealers` / `vin_token_status` — Dealer list & health check
  - `vin_create_contact` / `vin_create_lead` — Create contacts & leads
  - `vin_search_contacts` — Search contacts by name/email/phone (`GET /api/vin/contacts/search`)
  - `vin_get_trade_vehicles` — Get trade-in vehicles for a lead (`GET /api/vin/leads/:leadId/trade-vehicles`)
  - `vin_update_lead` — Update lead status/coBuyer/vehicles (`PATCH /api/vin/leads/:leadId`)
  - `vin_search_vehicle_catalog` — Year/make/model/trim lookup (`GET /api/vin/vehicle-catalog`)
  - `vin_update_contact` — Update contact info (`PUT /api/vin/contacts/:contactId`)
  - `vin_add_vehicle_of_interest` — Associate vehicles with leads (`POST /api/vin/leads/:leadId/vehicles-of-interest`)
- **Google Calendar, Dealer.com, Tekion**: Configurable calendar connectors (sync functionality deferred).

## Area 1 Implementation Status (COMPLETED)

### Changes Made
- **Artifacts removed**: Artifacts placeholder section removed from SubMenuManager AI Chat panel (T001)
- **FavoritesBar → DB-backed dropdown**: New `favorites` table in schema, GET/POST/DELETE API endpoints, favorites dropdown in SubMenuManager, removed FavoritesBar from 7 pages, wired to real DB via AppContext (T002)
- **Role-aware suggestion bubbles**: `getRandomSuggestions(role)` in chat-types.ts with pools for management, sales, service, marketing, BDC + general fallback; randomized 5 of 8+ per visit (T003)
- **Right pane context injection**: useStreamingChat accepts `pageContext`, RightPane passes current page label, backend injects into system prompt (T004)
- **Model selector in Settings**: AI Model dropdown (Claude/Gemini/OpenAI) stored in org settings JSONB, Gemini/OpenAI fall back to Claude (T005)
- **Chat quality instructions**: System Prompt + Chat Quality Instructions textareas in Settings wired to org settings JSONB, backend reads and injects into system prompt (T006)
- **Chat history verified**: SubMenuManager fetches real conversations from DB, Management page shows activity logs (T007)
- **Scroll behavior verified**: Auto-scroll on new messages via scrollRef, ScrollArea handles overflow (T008)
- **Data attribution**: System prompt updated — CRM data attributed as "from our records" (never names vendor), knowledge base docs as "from our knowledge base" (T009)

### Key Files Modified
- `shared/schema.ts` — favorites table
- `server/storage.ts` — favorites CRUD methods
- `server/routes.ts` — favorites endpoints, chat system prompt (attribution, page context, org instructions)
- `client/src/lib/chat-types.ts` — role-aware suggestion pools
- `client/src/hooks/useStreamingChat.ts` — pageContext parameter
- `client/src/components/layout/SubMenuManager.tsx` — artifacts removed, favorites with remove button, FileText import cleanup
- `client/src/components/layout/RightPane.tsx` — page context injection, role-aware suggestions
- `client/src/pages/main.tsx` — role-aware suggestions
- `client/src/pages/settings.tsx` — AI model selector, system prompt, chat instructions (DB-wired)
- `client/src/contexts/AppContext.tsx` — favorites wired to DB
- 7 page files — FavoritesBar imports removed

## Area 2 Implementation Status (COMPLETED)

### Changes Made
- **Security tile removed**: Removed from settings tile grid, render function, switch case, and submenu panel (T001)
- **Data Management tile removed**: Removed from settings tile grid, render function, switch case, submenu panel, and related state variables (T002)
- **Video (Tavus) toggle in CommGate**: Added `videoEnabled` boolean column to organizations schema, video channel check in `checkCommGate`, Video toggle in Organization CommGate UI (T003)
- **Configurable rate limit per org**: Rate limit stored in org settings JSONB (`rateLimitMax`), defaults to 3, configurable in CommGate UI with `/24h` display. `outbound.ts` reads from org settings (T003)
- **CommGate on invitations/resets**: Invite endpoint checks `outboundEnabled && emailEnabled` before sending email; password reset does the same. User/token still created when blocked, with clear feedback (T004)
- **CSV upload column validation**: Expected columns defined (First Name, Last Name, Address, City, State, Zip, Home Phone, Work Phone, Email, VIN, Model, Model Year, Last Contact) with fuzzy matching; validation feedback for missing required/optional columns (T005)
- **Campaign scheduling**: Added `scheduledAt` timestamp column to campaigns, schedule dialog in service.tsx with datetime-local input, backend stores scheduled campaigns and a 60-second scheduler timer executes due campaigns (T006)
- **Activity log 90-day purge**: `purgeOldActivityLogs(days)` storage method, runs on server startup and daily via setInterval (T007)
- **Auto-greeting on new leads**: SMS inbound (TextMagic webhook) and webchat (widget) now send agent `autoGreeting` to new conversations if configured (T008)
- **SMS reply labeling**: Added `sourceConversationId` to conversations schema, inbound SMS replies linked to original outbound campaign/conversation via `findLastOutboundForPhone` lookup (T009)

### Key Files Modified
- `shared/schema.ts` — videoEnabled, scheduledAt, sourceConversationId columns
- `server/outbound.ts` — configurable rate limit, video channel in checkCommGate
- `server/routes.ts` — CommGate on invites/resets, CSV validation, campaign scheduling, auto-greeting, SMS reply labeling
- `server/storage.ts` — purgeOldActivityLogs, getScheduledCampaigns, findLastOutboundForPhone
- `server/index.ts` — activity log purge timer, campaign scheduler timer
- `client/src/pages/settings.tsx` — Security/Data tiles removed, video toggle + rate limit config
- `client/src/pages/service.tsx` — schedule dialog, campaign status colors
- `client/src/components/layout/SubMenuManager.tsx` — Security/Data submenu entries removed

## Area 3 Implementation Status (COMPLETED)

### Changes Made
- **Hunch scheduler**: Uses `storage.getOrganizations()` to iterate orgs; weekly Monday 6AM schedule
- **Enable Hunches toggle**: Wired to org settings JSONB via `saveSettingsMutation` (`hunchesEnabled` flag)
- **Hunches tab cleaned up**: Removed placeholder Daily Digest, Temperature, Recipients items
- **Appearance settings**: Switched to localStorage (`nexxus:appearance`) instead of DB

## Area 4 Implementation Status (COMPLETED)

### Changes Made
- **Agent updates persist to backend**: `updateAgentHandler` in AppContext calls `PATCH /api/agents/:id` and invalidates cache (T001)
- **Per-agent AI settings (qualia)**: Added `settings` jsonb column to agents table (stores aiModel, temperature, responseStyle, maxResponseLength); Settings tab in AgentConfigPane with auto-save (T002)
- **Real conversation history on Activity tab**: Activity tab fetches conversations filtered by `agentId` via `/api/conversations` (T003)
- **Draft status removed**: No 'draft' status option anywhere in agent UI (T004)
- **Skills section removed**: Tab renamed from "Tools & Skills" to "Tools"; skills catalog/modal/buttons removed (T005)
- **Notification trigger system**: Added `triggers` jsonb column to agents table; trigger types: `stale_lead` (thresholdHours) and `source_volume` (thresholdCount); configurable action chains (SMS/call/email with wait times); Add/Edit/Delete trigger UI with modal; backend scheduler checks stale lead conditions every 15 min; triggers restricted to Communications agents (voice/video/sms channels) (T006)
- **Service and Marketing agents seeded**: `seedMissingAgents()` creates chat-only knowledge agents for Serra Honda if missing (T007)
- **Org wall enforcement**: All agent-related routes enforce `organizationId` filtering; conversation queries never leak cross-org (T008)
- **Tools tab crash fix**: Safe fallback for `selectedAgent.tools` when undefined (no `.map` crash)

### Key Files Modified
- `shared/schema.ts` — `settings` jsonb, `triggers` jsonb columns on agents table
- `server/routes.ts` — PATCH /api/agents/:id, agent org wall enforcement
- `server/storage.ts` — agent CRUD with org filtering
- `server/index.ts` — trigger scheduler (15-min interval checking stale leads)
- `server/seed.ts` — `seedMissingAgents()` for Service/Marketing knowledge agents
- `client/src/contexts/AppContext.tsx` — `updateAgentHandler` persists via API
- `client/src/components/AgentConfigPane.tsx` — Settings tab (qualia), Triggers UI, Activity tab, Tools safe fallback, Skills removed
- `client/src/lib/agent-utils.ts` — draft status removed from `getAgentStatusColor`

## Area 5 Implementation Status (COMPLETED)

### Changes Made
- **TextMagic webhook org resolution fix**: Added `getOrganizationByTextmagicPhone` storage method that looks up orgs by `settings.textmagicPhone`; webhook now uses the `receiver` field (TextMagic's receiving number) as the primary org resolution strategy (T003)
- **Outbound echo filtering**: Webhook detects when `sender` matches the org's own TextMagic number and skips processing (T003)
- **TextMagic phone number UI field**: Added per-org TextMagic phone number input in Settings > Channel Controls, saved to org settings JSONB as `textmagicPhone` (T004)
- **Dead code removal**: Removed unused `server/replit_integrations/chat/` directory (duplicate conversation routes never called) (T001)
- **Webhook cleanup**: Removed unnecessary `upload.none()` multer middleware from webhook route (T002)
- **Variable scope fix**: Fixed `lastOutbound` ReferenceError in outbound context resolution (T003)

### Key Files Modified
- `server/routes.ts` — TextMagic webhook handler: receiver-based org resolution, outbound echo filter, removed multer middleware
- `server/storage.ts` — `getOrganizationByTextmagicPhone()` method on IStorage interface and DatabaseStorage
- `client/src/pages/settings.tsx` — TextMagic phone number input in CommGate Channel Controls
- `server/replit_integrations/chat/` — Removed (dead code)