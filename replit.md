# Nexxus Connect v2.2 — AI-Powered Dealership Platform

## Overview

Nexxus Connect is an AI-powered dealership management platform designed with persona/department-based navigation. The project aims to provide a validated frontend prototype with client-side mock data, structured around a 4-wave product roadmap, which will eventually integrate with a mature production backend. The core business vision is to streamline dealership operations through AI-powered tools and a user-centric interface, replacing traditional feature-based navigation with a more intuitive persona-driven approach.

The project is divided into two layers:
1.  **UI Prototype (this Replit)**: Focuses on a redesigned frontend experience.
2.  **Production Backend (separate environment)**: A robust existing backend with extensive API endpoints, database tables, and third-party integrations.

The v2.2 development cycle primarily focuses on restructuring the UI for persona/department-based navigation (AI Chat, TeamBox, My Work, Sales, Service, Marketing, Management), while the existing backend remains stable until later integration phases.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Stack
-   **React 18** with TypeScript
-   **Vite** for development and building
-   **Wouter** for client-side routing
-   **TanStack Query** for data fetching
-   **Tailwind CSS** with custom design tokens
-   **Shadcn/ui** component library built on Radix UI primitives

### Backend Stack
-   **Express** with TypeScript
-   **PostgreSQL**
-   **Drizzle ORM** for database queries and schema management
-   **JWT** authentication
-   **bcrypt** for password hashing

### UI/UX Decisions and Layout Architecture
The platform features a context-aware multi-pane layout inspired by ClickUp.

**Navigation Behaviors:**
-   **Thin Sidebar**: Always-visible 72px icon+label navigation.
-   **Hover Preview**: Displays sub-menu panel on sidebar item hover.
-   **Click Navigation**: Navigates to the page and sets the active panel.
-   **Pinning**: A toggle under the logo controls the expansion state of the sub-menu.
-   **Panel Collapse**: A chevron button in the sub-menu header allows collapsing.
-   **Global Persistence**: Pinned sub-menus remain visible across pages.

**Core Layout Components:**
-   **Sidebar**: Main navigation with RBAC gating.
-   **SubMenuManager**: Manages panels for various sections (AI Chat, TeamBox, My Work, Sales, Service, Marketing, Management, System, Profile).
-   **AppLayout**: Configures view routing based on content type (chat-only, data-display, sub-menu, heavy-chat, teambox).
-   **RightPane**: Provides contextual information or chat, depending on the active view.
-   **TopBar**: Contains branding, organization switcher, notifications, theme toggle, and user profile.

**Cardinal Layout Rules:**
-   Data-centric pages display AI chat in a right pane.
-   Chat-centric pages display information/configuration in a right pane.
-   TeamBox utilizes a unique 3-column internal layout, distinct from the global right pane.

**Chat Interface Design:**
-   Bot messages are left-aligned without avatars.
-   User messages are right-aligned without avatars.
-   A "thinking" animation uses a 3-dot wave effect.
-   Input fields have a gradient border.
-   AI persona names (Serra, Aria, Nova) are dynamic and configured per organization, avoiding generic terms like "Automa" or "AI".

**Metric Tiles (Main Page):**
-   Arranged in a 2x2 grid, centered.
-   Each tile features a gradient background, decorative SVGs, and an icon badge.
-   Role-specific metrics are displayed, and tiles collapse after the first user message.

**Color Coding:**
-   Hunch types: Opportunity (green), Threat (red), Insight (blue).
-   Pipeline alerts: Critical (red), Warning (amber), Info (blue).
-   Agent status: Active (green dot), Inactive (muted dot).
-   Campaign status: Active (green), Paused (amber), Draft (gray), Completed (blue).

### Features and Functionality
-   **Persona/Department-based Navigation**: Redesigned navigation around roles (AI Chat, TeamBox, My Work, Sales, Service, Marketing, Management, System).
-   **Role-Based Access Control (RBAC)**: Eight distinct roles (`super_admin` down to `marketing`) govern access to sections and features.
-   **Campaign Safety System**: Includes per-campaign kill switches, per-conversation disconnects, and a global communication gate to control outbound automated communications.
-   **Widget Configuration**: Allows managing widgets with appearance, channel, targeting, and embed code settings, including a live preview.
-   **Mock Data Layer**: All frontend data is currently mocked for rapid prototyping and validation.
-   **Auth System**: JWT-based authentication with access and refresh tokens, session management, and role-level route guarding.

### Database Schema (8 primary tables for the UI Prototype)
-   `roles`: Defines user roles and hierarchy.
-   `organizations`: Stores organization details, including kill switch states.
-   `users`: User authentication and profile information.
-   `sessions`: Manages JWT refresh tokens.
-   `agents`: AI agent definitions.
-   `conversations`: Stores conversation metadata and states.
-   `messages`: Individual messages within conversations.
-   `campaigns`: Campaign configurations and kill switch status.

### API Routes (Key Endpoints)
-   **Public**: Login, forgot password, reset password.
-   **Authenticated**: Logout, token refresh, current user details, organization switching, CRUD operations for agents, organization and user profile updates, conversation listing and message retrieval, campaign management.

## External Dependencies

### Frontend
-   **Wouter**: Client-side routing.
-   **TanStack Query**: Data fetching and caching.
-   **Tailwind CSS**: Utility-first CSS framework.
-   **Shadcn/ui**: Component library built on Radix UI.

### Backend (Production - separate environment)
-   **PostgreSQL**: Primary database.
-   **Drizzle ORM**: Object-relational mapper.
-   **JWT**: Token-based authentication.
-   **bcrypt**: Password hashing.
-   **VinSolutions**: CRM integration (OAuth2).
-   **VAPI**: Voice integration.
-   **Tavus**: Video integration.
-   **Resend**: Email service.
-   **TextMagic**: SMS service.
-   **Claude API**: AI capabilities.
-   **Google Calendar**: Calendar integration.