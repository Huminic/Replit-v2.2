# Nexxus Connect - Acceptance Criteria

**Product:** Nexxus Connect (branded as "Nexxus Connect™")
**Type:** UI Prototype / Interactive Mockup
**Scope:** All client-side interactions simulated with mock data. No backend, no database, no real API integrations.

---

## Table of Contents

1. [Global Shell & Navigation](#1-global-shell--navigation)
2. [Main Page (Home / AI Chat)](#2-main-page-home--ai-chat)
3. [Insights](#3-insights)
4. [Agents](#4-agents)
5. [Hub](#5-hub)
6. [Drive](#6-drive)
7. [System Settings](#7-system-settings)
8. [Profile](#8-profile)
9. [Design Standards](#9-design-standards)
10. [Mobile Responsive Behavior](#10-mobile-responsive-behavior)

---

## 1. Global Shell & Navigation

The global shell wraps every page and consists of a Top Bar, Left Sidebar, optional Sub-Menu panel, center content area, and optional Right Pane.

### 1.1 Top Bar

| Element | Description | Expected Behavior |
|---|---|---|
| **Logo** | Text "Nexxus Connect™" on the far left. No icon. | Static branding. Not clickable. |
| **Organization Switcher** | Center-aligned button showing Building icon + current org name + chevron. | Clicking opens a dropdown listing all organizations. Selecting one switches the active org. A checkmark appears beside the currently selected org. Org list is role-aware (some roles see multiple orgs). |
| **Notifications Bell** | Bell icon on the right. Badge shows unread count. | Clicking opens a scrollable dropdown (max height ~320px) listing notification items. Each item shows an icon, title, message preview, and relative timestamp. Unread items are highlighted with a subtle background. Clicking a notification marks it as read and navigates to its action URL if present. |
| **Activity Feed** | Activity (pulse) icon to the right of notifications. | Opens a dropdown showing the 8 most recent activity feed entries. Each shows a colored circle icon, description text, and relative timestamp. Items are display-only. |
| **Theme Toggle** | Moon icon (light mode) or Sun icon (dark mode). | Clicking toggles between light and dark mode. Preference persists in localStorage. All UI elements update instantly. |
| **Profile Menu** | Avatar with user initials + chevron. | Opens a dropdown showing user name, email, and current role badge. Menu items: My Profile, Preferences, Billing (all navigate to /profile), Separator, Log Out (red text, simulated). |
| **Role Switcher (Dev Tool)** | Tiny chevron-down arrow icon on the far right (hidden on small screens). | Opens a dropdown labeled "Switch Role (Dev)" with 4 options: Super Admin, Partner Admin, Org Admin, Staff. Selecting one immediately changes the active RBAC role. Current role shows a checkmark. Role persists via localStorage key "nexxus-current-role". |

### 1.2 Left Sidebar

| Element | Description | Expected Behavior |
|---|---|---|
| **Width** | Fixed 64px (w-16). | Never resizes. Shows icon + small label per item. |
| **Toggle Arrows** | Double-chevron button at top of sidebar. Only visible when the current page has a sub-menu. | Clicking toggles the `subMenuExpanded` global state, which pins or unpins the sub-menu panel. When pinned, the button shows as active/rotated. Hidden on the Home page (which has its own internal panel). |
| **Navigation Items** | Main, Insights, Agents, Hub, Drive (top section). System Settings (bottom section). | Clicking navigates to the page. Active page item shows a purple left-edge indicator bar and highlighted icon/label. Hovering shows the sub-menu preview panel on a 800ms leave timeout. |
| **System Settings Visibility** | Gated by role. | Hidden when current role is "Staff" (org_staff). Visible for Super Admin, Partner Admin, and Org Admin. |
| **Logout Button** | At the very bottom. | Displays as icon + "Logout" label. Click is simulated (no actual logout). |

### 1.3 Sub-Menu Panel (Hover / Pin Panel)

| Element | Description | Expected Behavior |
|---|---|---|
| **Position** | Fixed overlay, positioned to the right of the sidebar (left-16) and below the top bar (top-14). Z-index 40. | Appears on sidebar hover or when globally pinned. |
| **Collapse Button** | ChevronLeft icon in each panel header. | Closes the panel and un-pins the global sub-menu state. |
| **Leave Timeout** | 800ms timeout before hiding after mouse leaves. | If mouse returns to sidebar or panel within 800ms, the panel stays open. Prevents accidental dismissal. |
| **Resize Behavior** | Auto-collapses when window width drops below 1024px (lg breakpoint). | Sub-menu pinned state is cleared on resize to mobile. |
| **Panel Content by Page** | See per-page sections below. | Each page has unique panel content: Main shows Favorites + Message History; Agents shows agent list; Insights shows tab shortcuts + Activity link; Hub shows Calendar/Leads/Inbox links; Drive shows file category links; Settings shows section shortcuts. |

### 1.4 Right Pane (Automa AI Chat / Agent Config)

| Element | Description | Expected Behavior |
|---|---|---|
| **Toggle Button** | ChevronsLeft (<<) icon when closed. ChevronsRight (>>) when open. | Clicking << opens the right pane as a side-by-side panel on desktop (w-80 / lg:w-96). Main content remains visible alongside. On mobile (<md), opens as a full-screen overlay. Clicking >> closes it. |
| **Desktop Behavior** | Right pane appears to the RIGHT of the main content area. | Main content and right pane are visible simultaneously on desktop. The pane has a left border separator (`border-l border-border`). |
| **Mobile Behavior** | Full-screen overlay (`fixed inset-0 z-50`). | Covers entire screen on mobile with a close button. Main content is hidden behind the overlay. |
| **Not Available On** | Main (Home) page. | The toggle button and right pane are hidden on the home page since chat is the center content. |
| **Right Pane Content (Non-Agents)** | Automa AI chat interface. | Shows "Automa - AI Assistant" header. Full chat interface with message history, typing animation, suggestion bubbles, glowing gradient input. Same chat standards as Main page. |
| **Right Pane Content (Agents)** | Agent configuration panel. | Shows config sections: Performance, Instructions, Triggers, Tools & Skills, Knowledge, Activity. See Agents section for details. |

### 1.5 Favorites System

| Element | Description | Expected Behavior |
|---|---|---|
| **Desktop Favorites Bar** | Appears in the sub-header area of each page (hidden on mobile). Shows a star toggle + "Favorites" label + list of favorited pages as clickable chips. | Clicking the star toggles the current page as a favorite. Clicking a favorite chip navigates to that page. Clicking a chip for the current page unfavorites it. |
| **Mobile Favorites** | Integrated into the MobileNavDropdown. | Favorites appear as a separate section below the sub-menu items in the dropdown, prefixed with a yellow star icon. |
| **Persistence** | Favorites are stored in app state (no localStorage in prototype). | Favorites persist during the current session but reset on page reload. |

---

## 2. Main Page (Home / AI Chat)

**Route:** `/`
**View Config:** `chat-only` (centered, no right pane)

### 2.1 Metric Tiles

| Element | Description | Expected Behavior |
|---|---|---|
| **Title** | "AI Key Metrics" label above the tile grid. | Always visible. |
| **Grid Layout** | 2x2 on mobile (sm), 4-across on xl+ screens. | Responsive: 1 column on smallest, 2 columns on sm, 4 columns on xl+. |
| **Tile Content** | Each tile shows: label, large value, change indicator with trend arrow (green up / red down), gradient background, decorative SVG circles, icon badge. | Content changes based on the current RBAC role. |
| **Role-Specific Tiles** | **Super Admin:** Partner Orgs, Total Logins, Platform Actions, Agent Actions. **Partner Admin:** Sub Orgs, Total Logins, User Actions, Agent Actions. **Org Admin:** Pipeline Value, Lead Source, Lead Quality, Demand Score. **Staff:** Hot Opportunities, Buying Intel, Threats, Urgency Score. | Switching roles via the role switcher immediately updates the tile content. |
| **Tile Click** | Each tile is clickable. | Opens a modal dialog showing the metric's detailed breakdown: large value display, change badge, and a list of sub-metrics with labels and values. Hover applies the `hover-elevate` effect. |

### 2.2 Chat Interface

| Element | Description | Expected Behavior |
|---|---|---|
| **Message Display** | Bot messages left-aligned, user messages right-aligned. NO avatars or icons on messages. | Messages use rounded bubble styling. Bot bubbles have card background with border. User bubbles have primary color background with white text. Max width 80%. |
| **Typing Animation** | Three dots with wave animation (wave-dot CSS class). | Appears left-aligned when the bot is "thinking." Dots animate with staggered delays (0s, 0.15s, 0.3s). Disappears when the simulated response arrives (~1.5 seconds). |
| **Suggestion Bubbles** | Row of pill-shaped buttons below the chat area. Prefixed with sparkle icon and "Try asking..." label. | Clicking a suggestion populates the input field with that text and focuses the input. Suggestions are always visible. |
| **Chat Input** | Textarea with glowing gradient border (animated purple/blue/cyan). | Gradient border animates continuously (8s cycle). Box shadow gives a glow effect. Input auto-expands vertically up to 160px max height. Enter sends; Shift+Enter creates newline. |
| **Plus (+) Button** | Inside the input area, left side. | Opens a dropdown with "Upload File" and "Add from Drive" options. Both show toast notifications in demo mode. |
| **Send Button** | Circular button with arrow icon, right side of input. | Disabled when input is empty. Clicking sends the message, clears input, shows typing animation, then delivers a simulated bot response. |
| **Initial State** | One pre-loaded bot message. | The chat starts with one assistant message welcoming the user. |
| **Thinking Card** | Collapsible info card embedded within the first bot message. | Shows a Brain icon + "Analyzed your dealership profile" summary text. Purple left border (`border-l-2 border-purple-400`). Click to expand/collapse with ChevronDown/ChevronRight toggle. Expanded state reveals detailed reasoning steps (pipeline data, performance review, priority follow-ups). Uses `data-testid="thinking-card"` and `data-testid="button-toggle-thinking"`. |
| **Placeholder Text** | Chat input placeholder. | "Ask me anything about your business" |

### 2.3 Sub-Menu Panel Content (Main)

| Section | Content |
|---|---|
| **Favorites** | Star icon + "Favorites" header. Lists all favorited pages as clickable items. Empty state text if no favorites. |
| **Message History** | MessageSquare icon + "Message History" header. Lists recent conversations with title, last message preview, timestamp, and unread dot indicator. Clicking loads the Main page. Each item has a hover-reveal 3-dot menu (MoreVertical) with "Resume" and "Delete" options. Items have `role="button"`, `tabIndex={0}`, and keyboard support (Enter/Space). |

---

## 3. Insights

**Route:** `/insights`
**View Config:** `data-display`
**Tabs:** Dashboard, Reports, Library, Hunches

### 3.1 Page Header

| Element | Description |
|---|---|
| **Title** | "Insights" with subtitle "Analytics, reports, and AI-generated intelligence" |
| **Desktop Tabs** | Tab row with underline-style active indicator (hidden on mobile, replaced by MobileNavDropdown). FavoritesBar on the right. |
| **Mobile Navigation** | MobileNavDropdown showing: Dashboard, Reports, Library, Hunches, Activity as sub-menu items + favorites. |

### 3.2 Dashboard Tab

| Section | Fields / Elements | Expected Behavior |
|---|---|---|
| **Command Center** | 3 alert cards: Critical (red, alert icon), Warning (amber, triangle icon), Info (blue, lightbulb icon). Each shows label + detail text. | Color-coded severity. Display-only, no actions. |
| **Performance Scorecard** | 4 metric cards in a 2x2 (mobile) or 4-across (desktop) grid. Each shows: metric name, current value, target value, On Track (green) or At Risk (amber) badge. | Metrics: Close Rate, Avg Deal Size, Time to Close, Lead Response. Display-only. |
| **Pipeline Health** | Single card with 5 horizontal progress bars. Each stage shows: name, progress bar, count, dollar value. | Stages: New → Contacted → Qualified → Proposal → Won. Bar widths represent relative pipeline position (100% → 11%). |
| **Charts** | Two side-by-side charts: "Leads This Week" (area chart) and "Conversions" (bar chart). | Charts render using Recharts library. Show tooltip on hover. Gradient fill under area chart. Responsive widths. |

### 3.3 Reports Tab

| Section | Fields / Elements | Expected Behavior |
|---|---|---|
| **Report Categories** | 3 category groups: Sales Reports (3), Operations Reports (3), Financial Reports (2). | Each report shows as a card with icon, title, description, gradient background, and "Last run: X ago" timestamp. |
| **Report Click** | Each report card is clickable. | Opens a detail modal showing: report title, summary paragraph, "Generated: [date]" timestamp, and a grid of 6 key metrics with labels and values. Modal has a close button. Hover applies `hover-elevate`. |

### 3.4 Library Tab

| Element | Description | Expected Behavior |
|---|---|---|
| **View Toggle** | Grid/List icon buttons. | Switches between card grid and compact list layout. |
| **Category Filter** | Horizontal scrolling pill buttons: All, Pipeline, Conversion, Response, Lead Source, Channel, Vehicle, Lifecycle, Status, Priority, Composite, Forecast. | Clicking a category filters the metric list. "All" shows everything. |
| **Search** | Text input with search icon. | Filters metrics by title in real-time. Combines with category filter. |
| **Metric Cards (Grid)** | Each card shows: title, large value, change with trend arrow, category badge. | 61 total metrics across all categories. Clicking a metric card opens a detail modal showing the metric name, value, change, and category. Hover applies `hover-elevate`. |
| **Metric Rows (List)** | Compact rows with metric name, value, change, and trend indicator. | Same data as grid view, different layout. |

### 3.5 Hunches Tab

| Element | Description | Expected Behavior |
|---|---|---|
| **Hunch Cards** | Each card shows: title, description, type badge, confidence percentage, source label. | 6 hunch items. Color-coded by type: Opportunity (green), Threat (red), Insight (blue). Each card has matching background tint and border color. |
| **Confidence** | Numeric percentage per hunch. | Display-only. Values range from 72% to 94%. |
| **Source** | Text label showing which AI system generated the hunch. | Values: Sales Agent, Service Reminder, Analytics Engine, CRM Analysis, Market Intel, Trend Analysis. |

### 3.6 Sub-Menu Panel Content (Insights)

| Items | Destination |
|---|---|
| Dashboard | `/insights?tab=dashboard` |
| Reports | `/insights?tab=reports` |
| Library | `/insights?tab=library` |
| Hunches | `/insights?tab=hunches` |
| Activity | `/activity` (separate page) |

---

## 4. Agents

**Route:** `/agents`
**View Config:** `heavy-chat`

### 4.1 Agent List Panel (Desktop Only)

| Element | Description | Expected Behavior |
|---|---|---|
| **Width** | 272px (w-72), left side. Hidden on mobile (lg:hidden). | Desktop-only panel listing all agents. |
| **Header** | "Agents" title + Plus button to create new agent. | Plus button navigates to `/agents/create`. |
| **Search** | Text input with search icon. | Filters agent list by name in real-time. |
| **Agent Items** | Each shows: Bot avatar (purple-blue gradient), name, status dot (green=active, gray=inactive), status label, chevron arrow. | Clicking selects the agent and loads its detail in the center area. Selected agent has highlighted background. "Automa" agent is filtered out of the list. Hover applies `hover-elevate`. |

### 4.2 Agent Detail Header

| Element | Description | Expected Behavior |
|---|---|---|
| **Avatar** | Large Bot icon in purple-blue gradient circle (56px). | Display-only. |
| **Name + Status** | Agent name (h1) + status badge (active=default style, inactive=secondary). | Display-only. |
| **Description** | Agent description text. | Display-only. |
| **Metadata** | "Created by [name]" and "Updated [relative time]" labels. | Auto-calculated relative timestamps. |
| **Action Menu** | Three-dot menu (MoreVertical icon). | Opens dropdown with "Edit Agent" (settings icon) and "Delete Agent" (red, trash icon). Both simulated (toast or no-op). |

### 4.3 Agent Chat Interface (Center Content)

| Element | Description | Expected Behavior |
|---|---|---|
| **Chat Messages** | Bot messages left-aligned, user messages right-aligned. NO avatars. | Same styling standards as Main page chat. Messages have rounded bubbles, max width 80%. |
| **Typing Animation** | Wave-dot animation (3 dots). | Appears when agent is "processing." ~1.8 second simulated delay before response. |
| **Suggestion Bubbles** | 4 pill buttons: "Show today's lead activity", "Draft a follow-up email", "Summarize pipeline status", "Schedule callbacks for hot leads." | Clicking populates the input and focuses it. Sparkle icon + "Try asking..." label above. |
| **Chat Input** | Textarea with glowing gradient border. Placeholder text dynamically says "Ask [Agent Name] anything..." | Same gradient glow as Main page. Enter sends, Shift+Enter newlines. |
| **Send Button** | Circular send icon button. | Disabled when empty. Sends message, shows typing, delivers simulated response. |
| **Initial State** | One pre-loaded assistant message specific to the agent. | "I'm ready to help manage your sales pipeline..." |

### 4.4 Agent Configuration Pane (Right Pane)

Opened by clicking the << toggle button. Replaces center content. Contains 6 config sections navigated by sidebar icons.

| Section | Icon | Content | Interactions |
|---|---|---|---|
| **Performance** | BarChart3 | Channel badge (shows agent's channel type with icon). 3 metric cards: Interactions (247, +12%), Resolution Rate (89%, On target), Avg Response (1.2s, Under SLA). | Display-only. Default active section. |
| **Instructions** | FileText | System prompt text (agent's full instructions). Edit button. | Clicking "Edit" opens a modal with a textarea pre-filled with current instructions and Save/Cancel buttons. Saving updates the agent's instructions. |
| **Triggers** | Zap | List of trigger items showing: type name (formatted), schedule/condition details, On/Off badge. Configure button. | Clicking "Configure" opens a modal listing all triggers with toggle switches. Toggling enables/disables individual triggers. Save button persists changes. |
| **Tools & Skills** | Wrench | List of enabled tools showing: tool name, description, Active/Inactive badge. Manage button. | Clicking "Manage" opens a modal showing all available tools with toggle switches. Toggling enables/disables tools. Save button persists changes. Empty state shows "No tools configured" with an "Add Tools" button. |
| **Knowledge** | BookOpen | 3 knowledge source cards: Product Catalog (248 items, blue), FAQ & Policies (42 docs, purple), Training Scripts (15 flows, green). Manage button per card. | Clicking "Manage" or the edit icon opens a knowledge management modal. Upload button opens an upload dialog. All simulated. |
| **Activity** | Activity | Timeline of 5 recent agent activities with dot indicators, description text, and relative timestamps. | Display-only. Shows actions like "Handled inbound chat," "Sent follow-up email," etc. |

### 4.5 Mobile Agents Navigation

| Element | Description |
|---|---|
| **Agent Dropdown** | Full-width button showing Bot icon + selected agent name + status dot + chevron. Opens dropdown listing all agents with status badges. Below agents section, shows favorites. |
| **Favorite Toggle** | Star icon button beside the dropdown. | Toggles current page as favorite. |

---

## 5. Hub

**Route:** `/work-center`
**View Config:** `sub-menu`
**Tabs:** Calendar, Leads, Inbox

### 5.1 Page Header

| Element | Description |
|---|---|
| **Title** | "Hub" with subtitle "Calendar, leads, and communications" |
| **New Message Button** | Plus icon + "New Message" text. Opens the compose message modal. |
| **Desktop Tabs** | Calendar (with icon), Leads (with icon), Inbox (with icon + unread badge count). Underline-style active tab. FavoritesBar on the right. |

### 5.2 Calendar Tab

| Element | Description | Expected Behavior |
|---|---|---|
| **Calendar Widget** | Month-view calendar picker (left side on desktop, full width on mobile). | Clicking a date selects it and filters the event list. Today is pre-selected. |
| **Event List** | Cards showing events for the selected date. Each shows: start/end times, title, description, attendees list, event type badge. | Empty state shows calendar icon + "No events scheduled." Clicking an event card shows a toast with the event details. Hover applies `hover-elevate`. |

### 5.3 Leads Tab

| Element | Description | Expected Behavior |
|---|---|---|
| **Lead Cards** | Each shows: Avatar (initials), name, status badge (color-coded: Hot=red, Warm=amber, New=blue, etc.), "Interested in: [vehicle]", phone, email, last contact timestamp. | Hover applies `hover-elevate`. |
| **Action Buttons per Lead** | 3 buttons: Text (message icon), Call (phone icon), Schedule (calendar icon). | Text: Opens compose message modal (SMS mode). Call: Opens dialer modal pre-filled with lead's phone number and name. Schedule: Opens schedule appointment modal pre-filled with lead's name. |

### 5.4 Inbox Tab

| Section | Description | Expected Behavior |
|---|---|---|
| **Header Row** | "Universal Inbox" title + Email / SMS / Call action buttons. | Email button opens compose modal in email mode. SMS button opens in SMS mode. Call button opens the dialer. |
| **Message List** | Cards showing: colored icon circle (blue=email, green=SMS, purple=voicemail), sender name, subject line, message preview, relative timestamp, unread dot. | Unread messages have a primary-color left border and bolder text. Clicking a message shows a toast with subject and preview. Hover applies `hover-elevate`. |

### 5.5 Modals

| Modal | Fields | Expected Behavior |
|---|---|---|
| **Dialer** | Phone number input (centered, monospace), 12-button dial pad (1-9, *, 0, #), Clear button, green Call button. Quick contacts section listing first 3 leads. | Typing or clicking pad buttons populates the number. Clear empties it. Call shows toast "Calling..." and closes modal. Quick contacts auto-fill the number and name. |
| **New Message** | SMS/Email toggle buttons, recipient input (phone or email), subject input (email only), message textarea, Cancel/Send buttons. | Toggling SMS/Email changes the placeholder text and shows/hides the subject field. Send shows confirmation toast and closes modal. |
| **Schedule Appointment** | Title input (pre-filled with lead name if applicable), date picker, time picker, notes textarea, Cancel/Schedule buttons. | Schedule shows confirmation toast and closes modal. |

### 5.6 Sub-Menu Panel Content (Hub)

| Items | Destination |
|---|---|
| Calendar | `/work-center?tab=calendar` |
| Leads | `/work-center?tab=leads` |
| Inbox | `/work-center?tab=inbox` |

---

## 6. Drive

**Route:** `/drive`
**View Config:** `data-display`

### 6.1 Page Header

| Element | Description | Expected Behavior |
|---|---|---|
| **Title** | "My Files" with item count subtitle. | Item count updates based on current folder contents. |
| **View Toggle** | Grid / List icon buttons. | Switches between card grid (2-5 columns responsive) and compact list view. Active mode button shows secondary styling. |
| **New Folder Button** | Plus icon + "New Folder" text. | Shows toast indicating demo mode limitation. |

### 6.2 File Display

| View | Elements per File | Expected Behavior |
|---|---|---|
| **Grid View** | Large icon (color-coded by type), file name, size/type label, starred indicator (yellow star top-left), share button (visible on hover), three-dot menu (visible on hover). | Clicking a folder navigates into it. Clicking a file shows a preview toast. Hover reveals share and menu buttons. Hover applies `hover-elevate`. |
| **List View** | Row with: icon, file name, relative update time, starred indicator, shared indicator (users icon), size, share button (hover), three-dot menu (hover). | Same click behavior as grid. Compact single-line layout. |

### 6.3 File Type Icons and Colors

| Type | Icon | Color |
|---|---|---|
| Folder | Folder | Blue |
| Document | FileText | Blue-600 |
| Spreadsheet | Table | Green |
| Image | Image | Purple |
| PDF | FileText | Red |
| Video | Video | Pink |
| Audio | Music | Orange |

### 6.4 File Actions (Three-Dot Menu)

| Action | Behavior |
|---|---|
| Download | Toast: "[filename] is downloading." |
| Share | Opens share modal. |
| Star / Unstar | Toast: "[filename] has been added to/removed from favorites." |
| Delete | Toast (red text): "[filename] has been removed." |

### 6.5 Share Modal

| Element | Description | Expected Behavior |
|---|---|---|
| **Title** | "Share File" with file name in description. | |
| **Email/SMS Tabs** | Full-width tab switcher. | Switches between email and SMS input modes. |
| **Recipient Input** | Text field: "Enter email address" or "Enter phone number." | |
| **Copy Link** | Display box showing shareable URL + Copy button. | Clicking Copy uses `navigator.clipboard.writeText()` to copy the link, shows a "Link copied" toast on success, and changes button text to "Copied" with check icon for 2 seconds. Shows error toast on clipboard failure. |
| **Send Button** | Full-width button: "Send Email" or "Send SMS." | Disabled when recipient is empty. Sends toast confirmation and closes modal. |

### 6.6 Sub-Menu Panel Content (Drive)

| Items | Icon | Destination |
|---|---|---|
| My Files | Folder | `/drive` |
| Shared | Users | `/drive` |
| Starred | Star | `/drive` |
| Recent | Clock | `/drive` |
| Templates | FileBox | `/drive` |
| Upload button | Upload | Header action (simulated) |

---

## 7. System Settings

**Route:** `/settings/system`
**View Config:** `sub-menu`
**Access:** Hidden from Staff role (org_staff)

### 7.1 Page Header

| Element | Description |
|---|---|
| **Title** | "System Settings" with subtitle "Configure your organization and application settings" |

### 7.2 Settings Tile Grid (Landing View)

| Tile | Gradient | Min Role | Description |
|---|---|---|---|
| User Management | Blue→Cyan | Super/Partner/Org Admin | Manage users, roles, and permissions |
| Organization | Violet→Purple | Super/Partner/Org Admin | Company profile and branding |
| Tools & Integrations | Emerald→Teal | Super/Partner/Org Admin | Configure connected tools and services |
| Knowledge Base | Amber→Orange | Super/Partner/Org Admin | Upload and manage AI training data |
| AI Configuration | Fuchsia→Pink | Super/Partner Admin only | Hunches, agents, and AI behavior settings |
| Security | Red→Rose | Super/Partner Admin only | Authentication, SSO, and access policies |
| Notifications | Sky→Blue | Super/Partner/Org Admin | Alert preferences and delivery channels |
| Data Management | Indigo→Violet | Super Admin only | Imports, exports, and data retention |
| Appearance | Teal→Emerald | Super/Partner/Org Admin | Theme, layout, and display preferences |
| API & Webhooks | Orange→Amber | Super Admin only | Developer settings and external integrations |

Each tile shows an icon, title, description, gradient background, and decorative SVG circles. Clicking navigates to the section detail view. Tiles not accessible to the current role are hidden entirely.

### 7.3 Section Detail Views

Each section has a Back button returning to the tile grid. Sections use a standard layout with card container, title, description, and a list of configurable fields.

| Section | Fields (Type) |
|---|---|
| **User Management** | Search input, user list with avatar, name, role badge, email, three-dot menu (Edit, Remove). Add User button. |
| **Organization** | Org Name (text), Business Phone (text), Business Email (text), Public Listing (toggle), Multi-Location (toggle). Save button. |
| **Tools & Integrations** | Grid of tool cards with name, description, and enable/disable switch. |
| **Knowledge Base** | Auto-Index Files (toggle), Enable Web Scraping (toggle), Document Retention (text, days), Smart Summarization (toggle). Save button. |
| **AI Configuration** | Enable Hunches (toggle), Auto-Scoring (toggle), Confidence Threshold (text, %), Learning Mode (toggle), Daily Digest (toggle). Save button. |
| **Security** | Two-Factor Auth (toggle), SSO Provider (text), Session Timeout (text, minutes), IP Allowlist (toggle), Audit Logging (toggle). Save button. |
| **Notifications** | Email Notifications (toggle), SMS Notifications (toggle), Push Notifications (toggle), Quiet Hours Start (text), Quiet Hours End (text). Save button. |
| **Data Management** | Auto-Backup (toggle), Data Retention (text, months), Export Format (text), GDPR Compliance (toggle). Save button. |
| **Appearance** | Compact Mode (toggle), Animations (toggle), Default View (text), Show Metric Tiles (toggle). Save button. |
| **API & Webhooks** | API Access (toggle), API Key (text, redacted), Rate Limit (text), Webhook URL (text), Webhook Events (toggle). Save button. |

All Save buttons show a confirmation toast: "Settings saved - Your changes have been applied."

---

## 8. Profile

**Route:** `/profile`
**View Config:** `sub-menu`
**Tabs:** My Profile, Preferences, Billing

### 8.1 My Profile Tab

| Section | Fields | Expected Behavior |
|---|---|---|
| **Profile Card** | Large avatar (initials, 80px), full name, email, role badge, organization badge. Edit Profile button. | Edit button shows demo mode toast. |
| **Contact Information** | Email input (pre-filled), Phone input (pre-filled). Save Changes button. | Save button shows confirmation toast. |

### 8.2 Preferences Tab

| Section | Fields | Expected Behavior |
|---|---|---|
| **Appearance** | Dark Mode toggle (Moon icon + label + description). | Toggle is display-only (actual theme toggle is in TopBar). |
| **Notifications** | Push Notifications toggle (Bell icon), Email Digest toggle (Mail icon). | Display-only toggles. |
| **Regional Settings** | Language dropdown (English, Spanish, French), Timezone dropdown (Pacific, Eastern, UTC). | Dropdowns are functional selectors but changes are not persisted. |

### 8.3 Billing Tab

| Section | Fields | Expected Behavior |
|---|---|---|
| **Current Plan** | "Pro Plan" display with price ($99/month), Active badge. API usage progress bar (8,432 / 10,000 at 84%). Upgrade Plan button. | Upgrade shows demo mode toast. |
| **Payment Method** | Visa ending 4242, expiry 12/2025. Update button. | Update shows demo mode toast. |

---

## 9. Design Standards

### 9.1 Typography

| Context | Size | Usage |
|---|---|---|
| Data tables, compact UI | 13px (text-xs) | Library metrics, file lists, notification items, activity feeds |
| Chat messages, descriptions | 14-15px (text-sm) | Chat bubbles, card descriptions, form labels |
| Section headers | 18px (text-lg) | Page titles |
| Metric values | 24-30px (text-2xl/3xl) | KPI tile values, modal detail values |

### 9.2 Color Palette

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| Primary | Purple (hsl-based) | Purple | Buttons, active indicators, links |
| Background | White | Dark slate | Page backgrounds |
| Card | White | Slightly lighter slate | Card surfaces |
| Border | Light gray | Dark gray | All borders, separators |
| Muted foreground | Gray | Light gray | Secondary text, icons |
| Destructive | Red | Red | Delete actions, error states |

### 9.3 Interaction Standards

| Pattern | Specification |
|---|---|
| **hover-elevate** | Applied to all interactive cards, buttons, and list items. Provides subtle elevation/shadow change on hover. NO hover:scale transforms. |
| **Active sidebar indicator** | 2px purple left-edge bar + purple icon tint. |
| **Chat bubbles** | Bot: card background + border, left-aligned. User: primary color fill, right-aligned. No avatars. |
| **Wave-dot animation** | 3 dots with staggered delays (0s, 0.15s, 0.3s). Rolling wave effect. |
| **Gradient input border** | Animated gradient (purple→blue→cyan→purple), 300% width, 8s infinite shift. Glow shadow. |
| **Toast notifications** | Bottom-right positioned. Auto-dismiss. Used for all simulated actions (save, delete, send, etc.). |

### 9.4 Light / Dark Mode

- All UI elements must have explicit light AND dark mode styling.
- Theme toggles instantly via CSS class on documentElement.
- Preference stored in localStorage.
- Gradient tiles, chart fills, and shadows should adapt to mode.

---

## 10. Mobile Responsive Behavior

### 10.1 Breakpoint Strategy

| Breakpoint | Width | Key Changes |
|---|---|---|
| Mobile | < 640px (sm) | Single column layouts. All tabs hidden. MobileNavDropdown visible. Agent list panel hidden. |
| Tablet | 640-1023px (md) | 2-column grids. Sub-menu auto-collapses. |
| Desktop | 1024px+ (lg) | Full layout. Desktop tabs visible. Sub-menu can be pinned. Agent list panel visible. |

### 10.2 Mobile Navigation Pattern

| Element | Behavior |
|---|---|
| **MobileNavDropdown** | Replaces desktop tab bars on all pages (lg:hidden). Shows as a "Menu" button with chevron + separate star toggle for favorites. |
| **Agents Dropdown** | Special variant: full-width, shows selected agent name + status. Lists agents + favorites. |
| **Tab Rows** | All desktop tab rows use `hidden lg:flex`. Only visible on desktop. |
| **FavoritesBar** | Desktop-only (`hidden lg:flex`). On mobile, favorites appear inside MobileNavDropdown. |

### 10.3 Right Pane Responsive Behavior

| Behavior | Description |
|---|---|
| **Desktop (md+)** | Right pane opens as a fixed-width side panel (w-80 / lg:w-96) to the RIGHT of main content. Main content remains visible alongside the pane. Uses `border-l border-border` separator. |
| **Mobile (<md)** | Right pane opens as a full-screen overlay (`fixed inset-0 z-50 bg-background`). Covers the entire viewport. Close button (ChevronsRight) at top-right. |
| **Toggle Available** | Same << / >> toggle on all breakpoints. |

### 10.4 Layout Adaptations by Page

| Page | Mobile Adaptations |
|---|---|
| **Main** | Metric tiles stack to 1 column. Chat fills remaining height. No right pane toggle. |
| **Insights** | Tabs replaced by dropdown. Charts stack vertically. Scorecard goes to 2-col. |
| **Agents** | List panel hidden. Agent selector dropdown below header. Chat interface fills screen. Config pane replaces on toggle. |
| **Hub** | Tabs replaced by dropdown. Calendar and events stack vertically. Lead action buttons wrap. |
| **Drive** | Grid reduces to 2 columns. List view is single column. |
| **Settings** | Tiles stack to 1 column. Section views are full-width. |
| **Profile** | Tabs replaced by dropdown. Form fields stack. Avatar section wraps. |

---

## How This Could Be Used

This acceptance criteria document serves multiple purposes:

1. **QA Testing:** Each section maps to testable scenarios with specific expected behaviors, field names, and interaction patterns that can be verified manually or with automated tests.

2. **Developer Handoff:** When transitioning from prototype to production, developers can reference each section to understand the exact UI contract, RBAC rules, field layouts, and interaction patterns that must be preserved.

3. **Stakeholder Review:** Non-technical stakeholders can walk through each section to validate that the prototype matches business requirements before investing in backend development.

4. **Design System Governance:** Section 9 (Design Standards) ensures consistency as additional features are added. New pages or components should follow these established patterns.

5. **Sprint Planning:** Each major section can be broken into user stories or tasks for implementation sprints, with clear definitions of done based on the behavior columns.

6. **Regression Testing:** After any change, the acceptance criteria provide a checklist to ensure existing functionality has not been broken.
