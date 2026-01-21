# Nexxus V2 - AI-Powered Dealership Platform

## Overview

Nexxus V2 is a ClickUp-inspired AI-powered dealership management platform. This is a **UI prototype/mockup** with client-side mock data only - no real backend functionality, authentication, or API integrations are implemented.

The application features:
- A 3-pane responsive layout (left sidebar, main content, right chat pane)
- Light and dark mode theming
- Dual-density design system (compact data tables vs spacious chat interfaces)
- 8 main pages: Main (chat), Agents, Drive, Insights, Work Center, Activity, System Settings, and Profile
- Mobile-first responsive design with hamburger menu for small screens

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for development and building
- **Wouter** for client-side routing (lightweight alternative to React Router)
- **TanStack Query** for data fetching patterns (currently using mock data)
- **Tailwind CSS** with custom design tokens for styling
- **Shadcn/ui** component library (Radix UI primitives with custom styling)

### Layout Architecture
The app uses a context-aware 3-pane layout system:
- **Left Sidebar**: Navigation menu with 8 items, collapsible on desktop, sheet-based on mobile
- **Main Content**: Route-specific content area
- **Right Pane**: Persistent AI chat interface (Automa), hidden on mobile with FAB access

View configurations auto-select based on route:
- `chat-only`: Main page - centered chat, no right pane
- `data-display`: Drive, Insights, Activity - data tables with right pane
- `sub-menu`: Work Center, Settings, Profile - tabbed interfaces
- `heavy-chat`: Agents - list/detail with chat

### State Management
- **ThemeContext**: Light/dark mode with localStorage persistence and system preference detection
- **AppContext**: Global app state including current user, organization, agents, notifications, sidebar states
- No external state library - React Context handles all global state

### Data Layer
All data is mocked in `/client/src/mocks/`:
- `users.ts`: User profiles, organizations, roles
- `agents.ts`: AI agents with triggers and tools
- `messages.ts`: Chat conversations
- `notifications.ts`: Notification items
- `activity.ts`: Activity feed
- `files.ts`: Drive files and folders
- `tasks.ts`: Work center tasks, calendar events, approvals
- `insights.ts`: Metrics, goals, charts

### Database Schema (Placeholder)
The `shared/schema.ts` defines a basic users table with Drizzle ORM for PostgreSQL. This is scaffolding for future backend implementation - the current UI uses mock data exclusively.

### Design System
Custom theme tokens defined in `client/src/index.css`:
- Dual-density typography: 13px for data tables, 14-15px for chat
- Slate color palette with purple primary accent
- CSS custom properties for light/dark mode switching
- Consistent spacing, radius, and shadow tokens

### Build Configuration
- Development: `npm run dev` - Vite dev server with HMR
- Production: `npm run build` - Vite builds client to `dist/public`, esbuild bundles server
- Database: `npm run db:push` - Drizzle Kit for schema migrations (when backend is implemented)

## External Dependencies

### UI Components
- **Radix UI**: Full primitive suite (dialog, dropdown, tabs, etc.)
- **Lucide React**: Icon library (muted gray icons per design spec)
- **Recharts**: Chart library for Insights dashboard
- **date-fns**: Date formatting utilities
- **cmdk**: Command palette component
- **embla-carousel-react**: Carousel component

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **tailwind-merge**: Intelligent class merging

### Form Handling
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **@hookform/resolvers**: Zod integration for React Hook Form

### Database (Scaffolded, Not Active)
- **Drizzle ORM**: SQL query builder and ORM
- **PostgreSQL**: Database (requires DATABASE_URL environment variable)
- **connect-pg-simple**: Session storage for Express (future use)

### Backend (Minimal, Serving Static)
- **Express 5**: Web server framework
- Server primarily serves the built Vite frontend
- API routes placeholder in `server/routes.ts`

### Development Tools
- **TypeScript**: Type checking
- **Vite plugins**: Replit-specific dev banner and error overlay
- **esbuild**: Server bundling for production