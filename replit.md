# Nexxus Connect v3.0 — AI-Powered Dealership Platform

## Overview

Nexxus Connect is an AI-powered dealership management platform for Serra Auto Group / Cage Automotive. It replaces traditional navigation with an intuitive, persona-driven interface, providing a validated frontend prototype with real-time, database-backed data. The platform's core purpose is to streamline dealership workflows through AI-driven insights and communication, enhancing efficiency and customer engagement.

## User Preferences

Preferred communication style: Simple, everyday language.
Work mode: Functional area walkthrough — stop at each area, review ACs together, discuss outcomes, then implement/test.

## System Architecture

### Frontend
The frontend uses **React 18** and **TypeScript** with **Vite**. **Wouter** handles routing, **TanStack Query** manages data fetching, and **Tailwind CSS** with **Shadcn/ui** provides the styling and component library. The design prioritizes displaying live API data for all metric tiles.

### Backend
The backend is built with **Express** and **TypeScript**, interacting with a **PostgreSQL** database via **Drizzle ORM**. Security uses **JWT** for authentication and **bcrypt** for password hashing. **Anthropic SDK** integrates Claude AI models (Sonnet for chat, Opus for data analysis).

### Core Features
- **Persona-driven UI**: Navigation tailored to user roles.
- **AI Chat**: Core chat with token-by-token streaming, conversation persistence, model selection (Claude, Gemini, OpenAI fallback), and CRM Guru mode for enriched data insights.
- **Communication Management**: A 5-layer communication gate safety system (global, organization, channel, rate limit, campaign kill switch) supporting SMS (TextMagic), email (Resend), and VAPI (voice) outbound.
- **Agent and Trigger System**: Configurable AI agents (name, department, personality, auto-greeting) and a flexible trigger system for outbound actions, influenced by hunch filtering.
- **Lead Handling**: Manages one-off leads from various sources (VAPI, Tavus, widgets), including a 4-channel embeddable widget and public landing pages.
- **Metrics and Reporting**: Displays real-time metrics (e.g., active pipeline) sourced from `warehouse_leads` and `appointments`, supported by a VIN status classifier. Pipeline drill-down enriches leads with live VinSolutions contact data. Active Pipeline rows include a "View Contact" button that queries VinSolutions for full contact details (with warehouse cache fallback), displaying a contact detail view with Call and Text action buttons.
- **Multi-Store Architecture**: Supports multiple dealerships under a single entity with data isolation and proper organizational mapping for VIN Solutions API calls.

## External Dependencies

### Data & AI
- **PostgreSQL**: Primary database.
- **Anthropic SDK**: For Claude AI (claude-sonnet-4-6 for general chat, Opus for data analysis).

### Communications
- **TextMagic**: For SMS capabilities.
- **Resend**: For email delivery.
- **VAPI**: For voice communication services.
- **Tavus**: For video session capabilities.

### Integrations
- **VinSolutions**: Full CRM integration via MCP proxy, providing functionalities like querying/creating leads, searching contacts, updating lead/contact info, and searching vehicle catalogs.
- **Google Calendar, Dealer.com, Tekion**: Configurable calendar connectors (sync functionality deferred).