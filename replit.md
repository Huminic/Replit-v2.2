# Nexxus V2 - AI-Powered Dealership Platform

## Overview

Nexxus V2 is a ClickUp-inspired AI-powered dealership management platform. This is a **UI prototype/mockup** with client-side mock data only - no real backend functionality, authentication, or API integrations are implemented.

The application features:
- A 3-pane responsive layout (left sidebar, main content, right chat pane)
- Light and dark mode theming
- Dual-density design system (compact data tables vs spacious chat interfaces)
- RBAC role switcher (Super Admin, Partner Admin, Org Admin, Staff) - temporary dev tool in TopBar
- 6 main pages: Main (chat), Insights, Agents, Hub, Drive, System Settings (+ Profile)
- Activity stays as header-only dropdown (not in sidebar)
- Mobile-first responsive design with hamburger menu for small screens

### V3 Redesign Summary
- **RBAC**: currentRole state with localStorage persistence, tiny arrow dropdown on far-right of TopBar
- **TopBar**: Logo left, org switcher center (Building2 icon + name + chevron), notifications/activity/theme/profile/role-arrow right
- **Main Page**: 4-across gradient metric tiles (role-specific, responsive 4→2→1), "AI Key Metrics" title, 1 sample chat response, always-visible smaller suggestion bubbles, no chat avatars, wave-dot animation
- **Insights**: 4 tabs - Dashboard (Command Center/Pipeline/Charts/Scorecard), Reports, Library, Hunches. Sub-menu includes Activity
- **Agents**: ClickUp-style 3-pane (list 272px / detail / config pane 320px)
- **Hub**: 4 tabs - Calendar, Approvals, Communication, Open Leads (Tasks/Hunches removed)
- **Drive**: Share button per file, share modal with Email/SMS tabs
- **Settings**: Tile-based grid navigation, role-gated sections
- **Chat standard**: Bot left / user right, no avatars, wave-dot animation everywhere
- **Activity**: Moved into Insights sub-menu (no longer standalone sidebar item)
- **SubMenu timeout**: 800ms leave timeout for better usability

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
The app uses a context-aware multi-pane layout system with ClickUp-style navigation:

**ClickUp-Style Navigation Pattern (6 key behaviors):**
1. **Thin Sidebar**: Always-visible 64px icon+label strip with navigation icons
2. **Hover Preview**: Hovering sidebar items shows sub-menu panel as preview
3. **Click Navigates Only**: Clicking navigates to the page and sets activePanel (no auto-pin)
4. **Double Arrow Pins Globally**: Toggle under logo controls `subMenuExpanded` state
5. **Collapse in Panel Header**: ChevronLeft button in sub-menu header collapses panel
6. **Global Persistence**: When pinned, sub-menu stays visible across all page navigations

**Layout Components:**
- **Left Sidebar** (`Sidebar.tsx`): Thin icon+label navigation strip (w-16, 64px). Toggle arrows only visible on pages with sub-menus (hidden on home page)
- **Sub-Menu Manager** (`SubMenuManager.tsx`): Fixed-position overlay (left-16 top-14 z-40) that renders appropriate sub-menu based on `activePanel`. Uses 200ms timeout for hover-leave to hide
- **Main Content**: Route-specific content area
- **Right Pane**: Persistent AI chat interface (Automa), defaults closed, hidden on mobile with FAB access
- **Home Page**: Has its own internal Favorites/Message History panel (not part of SubMenuManager system)

View configurations auto-select based on route:
- `chat-only`: Main page - centered chat, no right pane
- `data-display`: Drive, Insights, Activity - data tables with right pane
- `sub-menu`: Work Center, Settings, Profile - tabbed interfaces
- `heavy-chat`: Agents - list/detail with chat

### State Management
- **ThemeContext**: Light/dark mode with localStorage persistence and system preference detection
- **AppContext**: Global app state including:
  - `activePanel`: Currently active/hovered sub-menu panel ID (null, 'agents', 'drive', etc.)
  - `subMenuExpanded`: Global pin state for sub-menu (true = always show)
  - `panelHovered`: Whether mouse is currently over sub-menu panel
  - Current user, organization, agents, notifications
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