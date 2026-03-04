# Design Constraints Reference - Nexxus V2.2

## Chat Interface
- Bot messages: left-aligned, no avatar/icon
- User messages: right-aligned, no avatar/icon
- Thinking animation: `.wave-dot` CSS class, 3 dots with delays 0s/0.15s/0.3s
- Input: gradient border wrapper via `.chat-input-gradient` class
- Persona name: comes from `currentOrganization.personaName` in AppContext (Serra, Aria, Nova). Never "Automa" or "AI"

## Metric Tiles (Main Page)
- Layout: 2x2 grid, max-w-3xl centered
- Each tile: gradient background (bg-gradient-to-br), decorative SVG circles, icon badge
- Role-specific metrics per all 8 roles (see roleMetrics in main.tsx)
- Hover: scale-[1.02] + shadow-lg transition
- Tiles collapse after first user message

## Navigation
- Sidebar: 72px wide, icon + 10px label per item
- Order: AI Chat → TeamBox → My Work → Sales → Service → Marketing → Manage
- Bottom: System (settings) — admin roles only
- Activity: Header-only (TopBar dropdown), NOT in sidebar
- Sub-menu flyout: 280px, hover-reveal with 800ms leave timeout, pin/unpin toggle

## RBAC Roles (8 total)
- Platform: super_admin, partner_admin
- Org: org_admin, executive, sales_manager
- Department: sales, service, marketing
- Role switcher: TopBar ArrowDownRight icon (dev tool, removed in production)
- Persisted in localStorage key "nexxus-current-role"

## Cardinal Layout Rules
- Data in center → Automa chat in right pane (Sales, Service, Marketing, Management pages)
- Chat in center → info/config on right pane (AI Chat page, Agent detail page)
- TeamBox uses its own 3-column layout (NOT the global right pane)

## Page Structure
- Sales/Service/Marketing: Dashboard / Agents / Campaigns / Insights / Calendar tabs
- Management: Dashboard / Insights / Hunches / Activities / ROI tabs
- Insights: Dashboard / Reports / Library / Hunches (4 tabs)
- Settings: Tile-based grid, role-gated per section
- My Work: Dashboard / Tasks / Chat / Assistant tabs

## Color Coding
- Hunch types: opportunity=green, threat=red, insight=blue
- Pipeline alerts: critical=red, warning=amber, info=blue
- Agent status: active=green dot, inactive=muted dot
- Campaign status: active=green, paused=amber, draft=gray, completed=blue
