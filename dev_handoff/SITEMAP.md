# Nexxus Connect - Site Map

**Version:** 1.0
**Last Updated:** February 2026

---

## Visual Route Map

```
Nexxus Connect
│
├── /                           HOME (Main Page)
│   ├── AI Key Metrics Tiles (role-specific)
│   ├── AI Chat Interface (Automa)
│   └── Sub-Menu Panel: Favorites + Message History
│
├── /insights                   INSIGHTS
│   ├── ?tab=dashboard          Dashboard
│   │   ├── Command Center (alerts)
│   │   ├── Performance Scorecard
│   │   ├── Pipeline Health
│   │   └── Charts (Leads + Conversions)
│   ├── ?tab=reports            Reports
│   │   ├── Sales Reports (3)
│   │   ├── Operations Reports (3)
│   │   └── Financial Reports (2)
│   ├── ?tab=library            Library
│   │   └── 61 Metrics (filterable by 12 categories)
│   ├── ?tab=hunches            Hunches
│   │   └── 6 AI-Generated Intelligence Cards
│   └── Sub-Menu Panel: Dashboard, Reports, Library, Hunches, Activity
│
├── /activity                   ACTIVITY FEED
│   └── Timeline of system-wide activity
│
├── /agents                     AGENTS
│   ├── Agent List Panel (desktop sidebar, 272px)
│   ├── Agent Detail View (center)
│   │   ├── Agent Header (name, status, description)
│   │   └── Agent Chat Interface
│   ├── Right Pane: Agent Configuration
│   │   ├── Performance (metrics)
│   │   ├── Instructions (system prompt)
│   │   ├── Triggers (toggle switches)
│   │   ├── Tools & Skills (enable/disable)
│   │   ├── Knowledge (source management)
│   │   └── Activity (timeline)
│   └── Sub-Menu Panel: Agent list with status indicators
│
├── /agents/create              CREATE AGENT
│   └── Agent creation form
│
├── /work-center                HUB
│   ├── ?tab=calendar           Calendar
│   │   ├── Month Calendar Widget
│   │   └── Event Cards for Selected Date
│   ├── ?tab=leads              Leads
│   │   └── Lead Contact Cards (with Text/Call/Schedule actions)
│   ├── ?tab=inbox              Inbox
│   │   └── Universal Inbox (Email/SMS/Voicemail)
│   ├── Modals:
│   │   ├── Dialer (phone pad + quick contacts)
│   │   ├── New Message (SMS/Email toggle)
│   │   └── Schedule Appointment (date/time picker)
│   └── Sub-Menu Panel: Calendar, Leads, Inbox
│
├── /drive                      DRIVE
│   ├── File Browser (Grid / List toggle)
│   ├── Folder Navigation
│   ├── File Actions (Download, Share, Star, Delete)
│   ├── Share Modal (Email/SMS tabs + Copy Link)
│   └── Sub-Menu Panel: My Files, Shared, Starred, Recent, Templates
│
├── /settings/system            SYSTEM SETTINGS (role-gated)
│   ├── Settings Tile Grid (landing)
│   ├── ?section=users          User Management
│   ├── ?section=organization   Organization
│   ├── ?section=tools          Tools & Integrations
│   ├── ?section=knowledge      Knowledge Base
│   ├── ?section=ai             AI Configuration (Super/Partner only)
│   ├── ?section=security       Security (Super/Partner only)
│   ├── ?section=notifications  Notifications
│   ├── ?section=data           Data Management (Super only)
│   ├── ?section=appearance     Appearance
│   ├── ?section=api            API & Webhooks (Super only)
│   └── Sub-Menu Panel: Section shortcuts
│
├── /profile                    PROFILE
│   ├── My Profile Tab (avatar, contact info)
│   ├── /profile/preferences    Preferences Tab (theme, notifications, regional)
│   ├── /profile/billing        Billing Tab (plan, payment method)
│   └── Sub-Menu Panel: My Profile, Preferences, Billing
│
└── /*                          404 NOT FOUND
    └── "Page not found" with home link
```

---

## Route Registry

| Route | Component | View Config | Sub-Menu | Right Pane | RBAC Gate |
|---|---|---|---|---|---|
| `/` | MainPage | `chat-only` | Favorites + History | None | None |
| `/insights` | InsightsPage | `data-display` | Tab shortcuts + Activity | Automa Chat | None |
| `/activity` | ActivityPage | `data-display` | Same as Insights | Automa Chat | None |
| `/agents` | AgentsPage | `heavy-chat` | Agent list | Agent Config | None |
| `/agents/create` | AgentCreatePage | `heavy-chat` | Agent list | Agent Config | None |
| `/work-center` | WorkCenterPage | `sub-menu` | Tab shortcuts | Automa Chat | None |
| `/drive` | DrivePage | `data-display` | File categories | Automa Chat | None |
| `/settings/system` | SettingsPage | `sub-menu` | Section shortcuts | Automa Chat | `canAccessSystem()` |
| `/profile` | ProfilePage | `sub-menu` | Profile sections | Automa Chat | None |
| `/profile/preferences` | ProfilePage | `sub-menu` | Profile sections | Automa Chat | None |
| `/profile/billing` | ProfilePage | `sub-menu` | Profile sections | Automa Chat | None |
| `*` | NotFound | - | None | None | None |

---

## Global Elements (Present on All Routes)

```
┌─────────────────────────────────────────────────────────────────┐
│ TopBar                                                          │
│ ┌─────────┐  ┌────────────────┐  ┌────┬────┬────┬──────┬────┐ │
│ │ Logo    │  │ Org Switcher   │  │Bell│Act.│Moon│Avatar│Role│ │
│ └─────────┘  └────────────────┘  └────┴────┴────┴──────┴────┘ │
├────┬────────────────────────────────────────────────────────────┤
│    │                                                            │
│ S  │  Page Content                                              │
│ I  │                                                            │
│ D  │  ┌──────────────────────────────────────────────┐          │
│ E  │  │  Desktop Tab Bar (lg+)                       │          │
│ B  │  │  OR MobileNavDropdown (<lg)                  │          │
│ A  │  ├──────────────────────────────────────────────┤          │
│ R  │  │                                              │          │
│    │  │  Tab Content                                 │          │
│    │  │                                              │          │
│    │  └──────────────────────────────────────────────┘          │
│    │                                                            │
├────┴────────────────────────────────────────────────────────────┤
```

---

## Navigation Flows

### Primary Navigation (Sidebar)
```
Sidebar Click → Navigate to route → Set activePanel → Show sub-menu (if pinned)
```

### Sub-Menu Navigation
```
Sub-Menu Item Click → Navigate to route (with query param) → Close sub-menu (if not pinned)
```

### Tab Navigation (Desktop)
```
Tab Click → Update query parameter → Re-render tab content
```

### Tab Navigation (Mobile)
```
MobileNavDropdown → Select item → Navigate to route (with query param)
```

### Right Pane Toggle
```
<< Button → Replace center content with Right Pane
>> Button → Restore center content, hide Right Pane
```

### Favorites Flow
```
Star Toggle → Add/Remove from favorites array → Update FavoritesBar + MobileNavDropdown
Favorite Chip Click → Navigate to favorited route
Favorite Chip Click (current page) → Unfavorite
```

---

## Information Architecture

### Tier 1: Global Shell
- TopBar (always visible)
- Sidebar (always visible, responsive)
- Sub-Menu Manager (overlay, optional)
- Right Pane (toggle, optional)

### Tier 2: Main Pages
- Home (Chat + Metrics)
- Insights (Analytics)
- Agents (AI Management)
- Hub (Operations)
- Drive (Files)
- Settings (Configuration)
- Profile (User)

### Tier 3: Sub-Views (Tabs)
- Insights: Dashboard, Reports, Library, Hunches
- Hub: Calendar, Leads, Inbox
- Profile: My Profile, Preferences, Billing
- Settings: 10 section tiles

### Tier 4: Modals & Overlays
- Metric Detail Modal
- Report Detail Modal
- Agent Config Modals (Instructions, Triggers, Tools, Knowledge)
- Hub Modals (Dialer, New Message, Schedule Appointment)
- Drive Share Modal
- Notification Dropdown
- Activity Feed Dropdown
- Organization Switcher
- Profile Menu
- Role Switcher
