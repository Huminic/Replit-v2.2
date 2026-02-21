# Design Constraints Reference - Nexxus V2

## Chat Interface
- Bot messages: left-aligned, no avatar/icon
- User messages: right-aligned, no avatar/icon
- Thinking animation: `.wave-dot` CSS class, 3 dots with delays 0s/0.15s/0.3s
- Input: gradient border wrapper via `.chat-input-gradient` class
- Assistant name: "Automa" (never "AI" or "Assistant")

## Metric Tiles (Main Page)
- Layout: 2x2 grid, max-w-3xl centered
- Each tile: gradient background (bg-gradient-to-br), decorative SVG circles, icon badge
- Role-specific metrics: super_admin (violet/blue/emerald/amber), partner_admin (indigo/cyan/teal/rose), org_admin (emerald/blue/amber/purple), org_staff (orange/sky/red/fuchsia)
- Hover: scale-[1.02] + shadow-lg transition

## Navigation
- Sidebar: 64px (w-16) fixed, icon + label per item
- Order: Main → Insights → Agents → Hub → Drive
- Activity: Header-only (TopBar dropdown), NOT in sidebar
- Settings: Hidden from org_staff via adminOnly flag

## RBAC Roles
- Super Admin, Partner Admin, Org Admin, Staff
- Role switcher: TopBar Shield icon button (temporary dev tool)
- Persisted in localStorage key "nexxus-current-role"

## Page Structure
- Insights: Dashboard / Reports / Library / Hunches (4 tabs)
- Hub: Calendar / Approvals / Communication / Open Leads (4 tabs)
- Agents: Left list (272px) + Center detail + Right config pane (320px)
- Settings: Tile-based grid, role-gated per section
- Drive: Grid/list view, share modal with Email/SMS tabs

## Color Coding
- Hunch types: opportunity=green, threat=red, insight=blue
- Pipeline alerts: critical=red, warning=amber, info=blue
- Agent status: active=green dot, inactive=muted dot
