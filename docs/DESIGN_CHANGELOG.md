# Design Changelog - Nexxus V2 → V3

## V3 Redesign (Current)

### RBAC System
- Added `currentRole` state to AppContext with localStorage persistence
- Added role switcher dropdown in TopBar (temporary dev tool, Shield icon)
- All pages check `currentRole` for role-based content

### Main Page
- Replaced header with 2x2 role-based gradient metric tiles
- Removed chat avatars/icons (bot left, user right alignment only)
- Added flat rolling wave thinking animation (.wave-dot CSS class)
- Gradient border on chat input maintained

### Insights Page
- Restructured into 4 tabs: Dashboard, Reports, Library, Hunches
- Dashboard: Command Center alerts, Pipeline funnel, Charts, Scorecard
- Reports: Card grid with gradient backgrounds
- Library: Filterable metric grid/list view with category badges
- Hunches: Color-coded cards (opportunity/threat/insight)
- Goals tab REMOVED
- Activity stays in header (not moved to Insights)

### Agents Page
- Redesigned with ClickUp-style 3-pane layout
- Left: Agent list (272px) with search, Automa excluded
- Center: Agent detail with channels and performance stats
- Right: Collapsible config pane (320px) with 5 sections

### Hub Page
- Tabs reduced to: Calendar, Approvals, Communication, Open Leads
- Tasks tab REMOVED
- Hunches tab MOVED to Insights page

### Drive Page
- Added share button visible on hover per file
- Share modal with Email/SMS tab selector and copy link

### Settings Page
- Redesigned with tile-based grid navigation
- Each tile is gradient-styled with decorative SVG patterns
- Role-gated sections (minRole array per tile)
- Settings hidden from Staff role in sidebar

### Global Chat Standards
- RightPane updated: removed avatars, wave-dot animation
- Consistent bot-left/user-right alignment across all chat interfaces

### Navigation
- Sidebar order: Main → Insights → Agents → Hub → Drive
- Activity removed from sidebar, stays as TopBar dropdown
- Logo simplified to text-only "Nexxus Connect™"
