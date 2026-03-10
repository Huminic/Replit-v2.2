# Nexxus Connect v3.0 — AI-Powered Dealership Platform

## Overview

Nexxus Connect is an AI-powered dealership management platform for Serra Auto Group / Cage Automotive. It replaces traditional navigation with an intuitive, persona-driven interface, providing a validated frontend prototype with real-time, database-backed data.

## User Preferences

Preferred communication style: Simple, everyday language.
Work mode: Sprint-based — stop after each sprint, review acceptance criteria, check for drift, then proceed.

## System Architecture

### Frontend
React 18 + TypeScript + Vite. Wouter routing, TanStack Query data fetching, Tailwind CSS + Shadcn/ui.

### Backend
Express + TypeScript, PostgreSQL via Drizzle ORM. JWT auth + bcrypt. Anthropic SDK for Claude AI.

### Core Features
- **Persona-driven UI**: Navigation tailored to user roles
- **AI Chat**: Streaming chat with conversation persistence, multi-model support
- **Communication Management**: 5-layer gate safety system — SMS (TextMagic), email (Resend), VAPI (voice)
- **Agent and Trigger System**: Configurable AI agents + trigger system including `new_lead_followup` (48h SMS auto-follow-up)
- **Lead Handling**: Multi-channel widgets, public landing pages, video auto-launch (`?mode=video`)
- **Metrics and Reporting**: Real-time pipeline metrics from warehouse_leads with VinSolutions CRM enrichment
- **Multi-Store Architecture**: 5 stores with data isolation (Serra Honda/Caroline, Serra Nissan/Magnolia, Tony Serra Ford/Georgia, Hyundai of Columbia/Elizabeth, Ford of Columbia/Savannah). All stores have Tavus personas linked. DB personaName fields now match the correct persona names.

## External Dependencies

- **PostgreSQL**, **Anthropic SDK** (Claude), **TextMagic** (SMS), **Resend** (email), **VAPI** (voice), **Tavus** (video), **VinSolutions** (CRM via MCP), **fal.ai** (image/video/audio generation), **OpenAI** (GPT-4o for copy/scoring)

## Environment Variables & Secrets

- `DATABASE_URL`, `AI_INTEGRATIONS_ANTHROPIC_*` — DB + AI chat
- `TEXTMAGIC_*`, `RESEND_API_KEY` — comms
- `VAPI_PRIVATE_KEY`, `TAVUS_API_KEY` — voice/video
- `VINSOLUTIONS_*` — CRM
- `FAL_KEY` — fal.ai image/video/audio generation
- `OPENAI_API_KEY` — GPT-4o for copywriting + image scoring
- `GOOGLE_MAPS_API_KEY` — competitor radar (Market Intel agent) — PENDING from user
- `APP_BASE_URL` — dev: release-1r.huminic.app, prod: live.huminic.app

## Key Files

- `server/routes.ts` — All API routes including `/api/fal-proxy`, `/api/openai-proxy`, `/api/maps-proxy`
- `client/src/pages/main.tsx` — Home page AI chat (visor + thread + input bar pattern)
- `client/src/pages/marketing.tsx` — Marketing department page with 5 tabs
- `client/src/lib/marketing-agents.ts` — 5 marketing agent definitions + artifact types + localStorage helpers
- `client/src/pages/widget-landing.tsx` — Public widget landing + full-screen video mode
- `public/dealer-handoff/` — Dealer.com integration zip + text files

## Active Development: Marketing Agents (Sprint-based)

### Completed
- Sprint 0: Server-side proxy endpoints (fal-proxy, openai-proxy, maps-proxy) + agent definitions/types file
- Sprint 1: Agent Launcher Grid (5 cards with gradients/radar watermark/hover glow) + Shared Agent Chat UI (visor, artifact history panel, suggestion chips, input bar with gradient glow, file attachment, localStorage sessions scoped per user)
- Sprint 2: Photo Studio + Video Producer real tool execution via fal.ai

### Key Files (Sprint 2)
- `client/src/lib/tool-executor.ts` — Tool execution engine: fal.ai submit/poll/result cycle, image generation (flux/dev), background swap (bria+flux+canvas composite), video (ltx-video), voiceover (kokoro). Creates artifacts, returns inline media + action chips.
- `client/src/components/marketing/AgentChatView.tsx` — Agent chat UI with real tool execution, progress indicators, inline image/video/audio rendering, action chips, visor auto-open on artifact creation
- fal.ai proxy security: SSRF protection added — all status/response URLs validated against `.fal.run` domain allowlist

### Sprint Plan
- Sprint 3: Copywriter + Creative Director tool implementations
- Sprint 4: Market Intel tool + Studio Gallery
- Sprint 5: Cross-agent "Send to" workflow + Sharing Panel + Polish

## Dealer.com Widget

- Partnership portal: `/widget/test`
- Dynamic widget JS: `/widget/dealer/:slug.js` (uses APP_BASE_URL env var)
- Static fallback files: `public/dealer-widgets/`
- Widget behavior: unified=popup, a la carte (text/video/voice)=new tab with `?mode=video`
