# Component Metadata Index - Nexxus V2

## Pages

| Component | File | RBAC | Key Constraints |
|-----------|------|------|-----------------|
| MainPage | pages/main.tsx | All roles, role-specific metrics | 2x2 gradient tiles, no chat avatars, wave animation |
| InsightsPage | pages/insights.tsx | All roles | 4 tabs: Dashboard/Reports/Library/Hunches |
| AgentsPage | pages/agents.tsx | All roles | 3-pane: list/detail/config, Automa excluded from list |
| HubPage | pages/work-center.tsx | All roles | 4 tabs: Calendar/Approvals/Communication/Open Leads |
| SettingsPage | pages/settings.tsx | Hidden from Staff | Tile grid, role-gated sections |
| DrivePage | pages/drive.tsx | All roles | Grid/list view, share modal (Email/SMS) |
| ProfilePage | pages/profile.tsx | All roles | User profile view |

## Layout Components

| Component | File | Key Constraints |
|-----------|------|-----------------|
| TopBar | layout/TopBar.tsx | Text-only logo, role switcher, activity feed |
| Sidebar | layout/Sidebar.tsx | 64px width, 5 nav items, adminOnly gating |
| RightPane | layout/RightPane.tsx | No avatars, wave-dot animation, gradient input |
| AppLayout | layout/AppLayout.tsx | Multi-pane responsive layout |
| SubMenuManager | layout/SubMenuManager.tsx | Fixed overlay, 200ms hover timeout |
| FavoritesBar | layout/FavoritesBar.tsx | Star toggle per page |

## Contexts

| Context | File | State |
|---------|------|-------|
| AppContext | contexts/AppContext.tsx | currentRole, agents, selectedAgent, favorites |
| ThemeContext | contexts/ThemeContext.tsx | theme (light/dark), localStorage persistence |
