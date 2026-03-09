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
- **VinSolutions**: Used for Lead Management tier, providing read/query access via MCP (Marketing Cloud Platform) to dealership data.
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