# Nexxus Connect v2.2 — AI-Powered Dealership Platform

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

### UI/UX Decisions and Layout Architecture
The platform utilizes a context-aware multi-pane layout.
-   Data-centric pages feature AI chat in a right pane.
-   Chat-centric pages display information/configuration in a right pane.
-   TeamBox has a unique 4-column internal layout.

### Database Schema
The database comprises 17 tables, including `roles`, `organizations`, `users`, `sessions`, `agents`, `conversations`, `messages`, `campaigns`, `tasks`, `widgets`, `integrations`, `knowledge_documents`, `campaign_recipients`, `outbound_log`, `notifications`, `activity_log`, and `hunches`. This schema supports the core functionalities like user management, AI conversations, campaign execution, and system activity logging.

### API Routes
A comprehensive set of API routes supports both public access (login, password reset) and authenticated operations across all modules, including agents, organizations, users, conversations, campaigns, documents, VAPI/Tavus proxies, metrics, tasks, widgets, integrations, notifications, activity logs, and AI hunches.

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

### Production Backend (separate environment)
-   **VinSolutions**: CRM integration
-   **VAPI**: Voice integration
-   **Tavus**: Video integration
-   **Resend**: Email service
-   **TextMagic**: SMS service
-   **Claude API**: AI capabilities
-   **Google Calendar**: Calendar integration