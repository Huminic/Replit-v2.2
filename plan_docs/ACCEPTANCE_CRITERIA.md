# Nexxus Connect - Comprehensive Acceptance Criteria

**Product:** Nexxus Connect (branded as "Nexxus Connect™")
**Version:** V2
**Document Type:** Combined UI Prototype & Functional Acceptance Criteria
**Scope:** Part I covers the current UI prototype with client-side mock data. Part II covers the full functional acceptance criteria for production implementation, fortified with specific UI behaviors and measurable quality standards derived from the prototype.

---

# PART I — UI PROTOTYPE ACCEPTANCE CRITERIA

This section defines every verifiable behavior in the current UI prototype. All interactions are simulated client-side with mock data. No backend, no database, no real API integrations.

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

### 3.6 Activity Page

**Route:** `/activity`
Accessible via the Insights sub-menu panel.

| Element | Description | Expected Behavior |
|---|---|---|
| **Title** | "Activity" with subtitle text. | |
| **FavoritesBar** | Appears above the search/filter bar. | Desktop only. Shows star toggle + favorite chips. |
| **Search/Filter** | Search input ("Search activity...") + type filter dropdown (All, Login, Create, Update, Delete, System). | Filters activity feed items in real-time by text match and type. |
| **Activity Items** | Cards with colored circle icon, description, timestamp, type badge. | Display-only. Sorted by most recent. |

### 3.7 Sub-Menu Panel Content (Insights)

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

Opened by clicking the << toggle button. Contains 6 config sections navigated by sidebar icons.

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
| **Favorite Toggle** | Star icon button beside the dropdown. Toggles current page as favorite. |

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
| **View Mode Switcher** | 4 buttons: Year, Month, Week, Day. Default is Week. | Clicking switches the calendar display to the selected view mode. Active mode button uses primary variant styling. |
| **Navigation Controls** | ChevronLeft (prev) and ChevronRight (next) arrows flanking a date label button. | Prev/Next move the view window by the appropriate time unit (day/week/month/year). Clicking the date label resets to today's date. |
| **Search** | Text input with search icon. Placeholder: "Search events..." | Filters events by title, description, or attendees. When active, displays a result count and switches to a flat list view. Clearing the search restores the grid view. |
| **Week View** | 7-column grid (Sun–Sat) with hourly time slots from 7 AM to 8 PM. | Events appear as color-coded blocks within their hour slot. Current day column has a subtle highlight. Events are clickable (toast with details). |
| **Day View** | Single column with hourly time slots (7 AM–8 PM). | Shows only the selected date's events within their time slots. Navigation arrows move by one day. |
| **Month View** | Traditional calendar grid with day headers (Sun–Sat). | Days show mini event chips (up to 3 per day) with a "+N more" indicator for overflow. Current day is highlighted. |
| **Year View** | 12 mini-month cards in a responsive grid. | Each month shows a mini calendar with day numbers. Current month is highlighted. Event counts shown per month. |
| **Event Color Coding** | Events are color-coded by type. | Meeting = blue, Appointment = green, Task = orange, Reminder = purple. |
| **Mock Events** | 11+ events for current week (Feb 16–22, 2026). | Events include: Weekly Team Standup, Marketing Campaign Review, New Lead Follow-up, Service Department Check-in, VIP Customer Call, and others. |

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
| **Tools & Integrations** | Grid of tool cards with name, description, and enable/disable switch. Has 3 tabs: Tools, Widgets, Landing Pages. |
| **Knowledge Base** | Auto-Index Files (toggle), Enable Web Scraping (toggle), Document Retention (text, days), Smart Summarization (toggle). Save button. |
| **AI Configuration** | Enable Hunches (toggle), Auto-Scoring (toggle), Confidence Threshold (text, %), Learning Mode (toggle), Daily Digest (toggle). Save button. |
| **Security** | Two-Factor Auth (toggle), SSO Provider (text), Session Timeout (text, minutes), IP Allowlist (toggle), Audit Logging (toggle). Save button. |
| **Notifications** | Email Notifications (toggle), SMS Notifications (toggle), Push Notifications (toggle), Quiet Hours Start (text), Quiet Hours End (text). Save button. |
| **Data Management** | Auto-Backup (toggle), Data Retention (text, months), Export Format (text), GDPR Compliance (toggle). Save button. |
| **Appearance** | Compact Mode (toggle), Animations (toggle), Default View (text), Show Metric Tiles (toggle). Save button. |
| **API & Webhooks** | API Access (toggle), API Key (text, redacted), Rate Limit (text), Webhook URL (text), Webhook Events (toggle). Save button. |

All Save buttons show a confirmation toast: "Settings saved - Your changes have been applied."

### 7.4 Widgets (Under Tools & Integrations → Widgets Tab)

| Element | Description | Expected Behavior |
|---|---|---|
| **Widget Types** | 4 fixed types: Text Chat, Live Video, Voice Call, Unified. | Each widget type has its own card with icon, name, description, and status toggle. |
| **Widget Config Tabs** | Settings, Appearance, Targeting, Domains, Embed. | Each sub-tab provides configuration options specific to that widget type. |
| **Preview Modals** | Each widget has a preview button. | Opens a modal showing a live preview of how the widget would appear on a customer-facing page. |
| **Unified Widget** | Links to the widget landing page at `/w/demo`. | See Widget Landing Page section below. |

### 7.5 Widget Landing Page

**Route:** `/w/demo` (outside AppLayout — standalone page)

| Element | Description | Expected Behavior |
|---|---|---|
| **Layout** | Standalone customer-facing page, not wrapped in the app shell. | No sidebar, no top bar. Independent layout. |
| **Channel Cards** | 6 cards representing communication channels. | Each card shows an icon, channel name, and description. Clickable to initiate that channel type. |
| **Contact Form** | Standard name/email/message form. | Simulated submission with toast confirmation. |
| **Live Video Button** | "Launch Live Video Chat" button. | Opens a video chat experience (simulated). |
| **Footer** | "Powered by Nexxus" branding. | Static display. |

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
---

# PART II — FUNCTIONAL ACCEPTANCE CRITERIA (PRODUCTION)

This section defines the full functional acceptance criteria for the production-ready Nexxus Connect platform. Each item has been fortified with specific, measurable criteria tied to the UI behaviors documented in Part I above. Items marked *[UI Prototype Status]* indicate the current prototype coverage for that requirement.

---

## 11. Overall System Capabilities

### 11.1 Authentication & Access Control

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Login Interface** | Login screen must include: email/username field with validation (min 3 chars, valid email format), password field with show/hide toggle, "Remember Me" checkbox, "Forgot Password" link, and submit button. Form must display inline error messages for invalid fields within 200ms of blur. Successful login must redirect to the Main page (`/`) within 2 seconds. | Not implemented — prototype has no auth screen. Simulated as always-authenticated. |
| **Password Reset Workflow** | "Forgot Password" link must open a reset flow: (1) Email input screen, (2) Confirmation page saying "Check your email," (3) Token-based reset link with 15-minute expiration, (4) New password screen with strength indicator (min 8 chars, 1 uppercase, 1 number, 1 special). Invalid or expired tokens must show a clear error with a "Request new link" option. | Not implemented. |
| **Session Management** | Authenticated sessions must persist across browser tabs. Sessions must expire after the configurable timeout set in Settings > Security (default 30 minutes of inactivity). Expired sessions must redirect to the login page with a "Session expired" message. | Not implemented. The prototype uses the Profile > Billing tab to display session-related info (display-only). |

### 11.2 User Interface Quality Assurance

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Zero Console Errors** | Browser console must show zero errors (`console.error`) during normal usage of all pages and interactions. Warnings are acceptable but must be fewer than 10 per page load. | Verifiable in current prototype. All pages should produce zero console errors. |
| **Complete Functional Testing** | 100% of interactive elements (buttons, links, forms, modals, dropdowns, toggles) must produce a visible response (navigation, toast, modal, state change). No dead clicks are acceptable. | Prototype uses toast notifications for all simulated actions. Every button/link must trigger a toast, modal, or navigation. |
| **Responsive Design Verification** | All pages must render correctly at 3 breakpoints: Mobile (<640px), Tablet (640–1023px), Desktop (1024px+). No horizontal scrolling, no overlapping elements, no truncated text without ellipsis. | Prototype implements responsive design at all 3 breakpoints with MobileNavDropdown pattern replacing desktop tabs. |
| **Cross-Browser Compatibility** | Must function without visual or functional defects in the latest versions of Chrome, Firefox, Safari, and Edge. | Not formally tested in prototype — verification needed. |

### 11.3 Agent Configuration & Behavior

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Instruction Sets** | Every agent must have a non-empty system prompt visible in Agent Config > Instructions section. Minimum 50 words per instruction set. Instructions must include: role definition, behavioral boundaries, knowledge scope, and response format guidelines. | Prototype shows instructions in the Agent Configuration right pane (Instructions tab). Each agent has a mock system prompt that can be viewed and edited via modal. |
| **Specialty Demonstration** | Each agent must sustain a coherent, domain-relevant conversation for at least 5 turns. After 5 turns, the agent must still reference context from turn 1-2. Responses must stay within the agent's stated domain (no generic LLM responses). | Prototype has simulated chat with ~1.8s response delay. Currently delivers generic responses. Production must show domain-specific responses. |
| **Cross-Channel Identity Consistency** | The agent named in the Agents module (e.g., "Caroline") must present with the identical name in: (1) Text chat widget, (2) Video agent (Tavus), (3) Inbound call (Vapi), (4) Outbound call. Name verification must be visible in the Agent Information Pane showing: customer-facing link, assigned phone number, and text chat link. | Prototype shows the Agent Information Pane with name, channel badge, customer link, phone number, and chat link in the config panel. Production must enforce the same name string across all channel integrations. |

### 11.4 Metrics & Analytics Transparency

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Drill-Down Capability** | All 4 metric tiles on the Main page must be clickable. Clicking opens a modal showing: the metric's large value, change badge, and a minimum of 3 sub-metrics with labels and values. In Insights > Library, all 61 metric cards must open detail modals on click. In Insights > Dashboard, all 4 Performance Scorecard cards must reveal underlying calculations on click. | Prototype implements clickable metric tiles on Main page with drill-down modals. Library metrics open detail modals. Scorecard cards are display-only — production should add drill-down. |
| **Calculation Transparency** | Each metric detail modal must include a "How this is calculated" section displaying: data sources used, time period covered, and formula or methodology. Minimum 2 sentences of explanation per metric. | Not implemented in prototype. Production modals must add a calculation explanation section below the sub-metrics. |
| **Data Lineage** | Every displayed metric must show a "Last updated" timestamp and the name of the data source (e.g., "VinSolutions CRM," "Internal Analytics," "Vapi Call Logs"). | Not implemented in prototype. Production metrics must include source attribution. |

### 11.5 CRM Integration (VinSolutions)

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Data Insertion** | New calls and leads generated through Nexxus must be pushed to VinSolutions within 30 seconds. Required fields: customer name, phone, email, lead source, vehicle of interest, interaction summary. Insertion must return a success confirmation with VinSolutions record ID. | Not implemented — prototype uses mock lead data in `/mocks/tasks.ts`. Production must implement API integration. |
| **Bidirectional Sync** | Changes made in VinSolutions (lead status updates, new notes) must reflect in Nexxus Hub > Leads tab within 60 seconds. Changes made in Nexxus must sync to VinSolutions within 30 seconds. Conflict resolution: most recent timestamp wins. | Not implemented. |

---

## 12. Role-Based Access Control (RBAC) Architecture

### 12.1 Super Admin Capabilities

| Capability | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Partner Account CRUD** | Super Admin can create, view, edit, and delete Partner accounts via Settings > User Management. Creation requires: partner name, primary contact email, assigned template package. Deletion requires confirmation modal with "Type partner name to confirm" safeguard. | Prototype shows User Management section with user list and Add User button. CRUD operations show toasts. Production must implement actual partner-level management. |
| **Organization Provisioning** | Super Admin can create Organizations under any Partner. Required fields: org name, business phone, business email. Organization inherits the Partner's template package by default but can be customized. | Prototype shows Organization settings section with name, phone, email fields + Save button. Production must add partner-org hierarchy. |
| **"Nexxus System" View Switch** | Organization Switcher in TopBar (Building icon + org name + chevron) must include a "Nexxus System" option for Super Admin. Selecting it shows the global system view with aggregate data across all partners and organizations. | Prototype has organization switcher dropdown in TopBar. Currently shows mock orgs. Production must add "Nexxus System" option for Super Admin role. |
| **Template Package Management** | Super Admin can create template packages that define which tools, features, and credit limits are available to assigned organizations. Templates are managed in Settings > Tools & Integrations. | Prototype shows Tools & Integrations with tool cards and enable/disable switches. Production must add template package creation and assignment UI. |
| **Credit & Usage Oversight** | Super Admin can view credit consumption across all partners/organizations. Must show: current balance, usage this period, cost breakdown by third-party tool, and markup configuration. Accessible via Settings > Data Management or a dedicated billing section. | Prototype has Billing tab in Profile showing a plan display and usage bar. Production must expand to system-wide credit management. |
| **Markup Configuration** | Super Admin can set percentage markups on third-party vendor costs per partner or globally. Changes take effect on the next billing cycle. | Not implemented in prototype. |

### 12.2 Partner Admin Capabilities

| Capability | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Organization CRUD** | Partner Admin can create, view, edit, and delete Organizations within their partnership only. Cannot see or modify other partners' organizations. | Prototype gates Settings visibility by role (hidden for Staff). Production must enforce partner-scoped org management. |
| **"[Customer Slug]" View Switch** | Organization Switcher must show the partner's organizations with a "[customer name slug]" view option. Selecting it renders the UI exactly as that organization's admin would see it. | Prototype org switcher shows mock orgs. Production must filter to partner-scoped orgs only. |
| **Configuration Rights** | Partner Admin has access to: User Management, Organization, Tools & Integrations, Knowledge Base, AI Configuration, Security, Notifications, Appearance. Cannot access: Data Management, API & Webhooks. | Prototype hides Data Management and API & Webhooks tiles for Partner Admin. AI Configuration and Security show for Super/Partner only. Verified via tile visibility rules. |

### 12.3 Organization Admin Capabilities

| Capability | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Organization-Scoped Metrics** | All metrics on Main page and Insights must show data for the current organization only. Org Admin sees: Pipeline Value, Lead Source, Lead Quality, Demand Score on Main page tiles. | Prototype shows role-specific metric tiles. Org Admin tiles show pipeline/lead data. Production must filter metrics by org. |
| **Transcript Access** | Org Admin can view full transcripts of all Vapi and Tavus interactions. Accessible from Agent Activity or a dedicated transcript viewer. Each transcript shows: date, duration, customer name, agent name, full text, and sentiment score. | Prototype shows Agent Activity timeline with 5 entries. Production must add full transcript detail views. |
| **Widget Configuration** | Org Admin can configure 4 widget types (Text Chat, Live Video, Voice Call, Unified) via Settings > Tools & Integrations > Widgets tab. Each widget has 5 config sub-tabs: Settings, Appearance, Targeting, Domains, Embed. Embed tab provides copyable code snippets. | Prototype implements widget config UI with all 4 types and 5 sub-tabs. Preview modals available. Embed code is copyable. |
| **Staff User CRUD** | Org Admin can create, edit, and delete Staff accounts. Can promote Staff to Org Admin. User list accessible in Settings > User Management with search, avatar, name, role badge, email, and 3-dot menu (Edit, Remove). | Prototype shows user list with CRUD UI. Production must enforce org-scoped user management. |
| **Chat History Audit** | Org Admin can view complete chat session history for all staff members in their organization. Accessible from the sub-menu Message History panel or a dedicated admin view. | Prototype shows Message History in Main page sub-menu with conversation list, last message preview, timestamps, and 3-dot hover menu (Resume/Delete). Production must add admin-level cross-user history access. |
| **Fortification Store Upload** | Org Admin can upload documents (PDF, DOCX, XLS, CSV) to fortification stores via Settings > Knowledge Base or via the chat interface (+) button > Upload File. Uploads must show progress, accept files up to 50MB, and confirm successful indexing. | Prototype has Upload File option in chat (+) menu (shows toast). Knowledge Base settings section has config toggles. Production must implement actual file upload and indexing. |
| **Content Guardrails** | Org Admin can define prompt instructions in Settings > AI Configuration to restrict or filter staff chat activities. Settings include: Enable Hunches, Auto-Scoring, Confidence Threshold (%), Learning Mode, Daily Digest toggles. | Prototype shows AI Configuration section with all listed toggles and Save button. Production must enforce these settings on chat behavior. |

### 12.4 Staff User Capabilities

| Capability | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Manual Outbound Actions** | Staff can trigger outbound calls, emails, and SMS from Hub > Leads tab. Each lead card shows 3 action buttons: Text (message icon), Call (phone icon), Schedule (calendar icon). Call opens dialer modal. Text/Email opens compose modal with SMS/Email toggle. | Prototype fully implements: Lead cards with 3 action buttons, Dialer modal with dial pad + quick contacts, Compose modal with SMS/Email toggle + recipient + subject + message fields. All actions produce toast confirmations. |
| **Automa Assistant** | Staff can use Automa (Main page chat and Right Pane chat) as a general-purpose AI assistant. Chat supports: multi-turn conversation, file upload (+) button, suggestion bubbles, and typing animation. Input placeholder: "Ask me anything about your business." | Prototype fully implements the Automa chat interface on Main page (center) and Right Pane (all other pages). Chat features: message history, wave-dot typing animation, suggestion bubbles, glowing gradient input, Enter to send / Shift+Enter for newline. |
| **Report Generation** | Staff can request reports via Automa chat. Generated reports must be automatically saved to Drive. Reports accessible in Drive > My Files or via the generated shareable link. | Prototype shows Drive with file management. Chat mentions report generation. Production must implement actual report generation and Drive storage. |
| **Two-Way Customer Texting** | Staff can engage in SMS conversations with customers via Hub > Inbox (SMS messages) and Hub > Leads > Text button. Conversations must show full message thread with sent/received indicators and timestamps. | Prototype shows Inbox with SMS/email/voicemail items. Compose modal supports SMS mode. Production must implement real SMS threading. |

### 12.5 Product Tour & Onboarding

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Role-Based Tour** | First-time users see an interactive product tour on login. Tour highlights are specific to the user's role: Super Admin sees system-wide features, Staff sees lead management and chat features. Tour must be dismissible and re-activatable from Profile > Preferences or a help menu. Tour script exists and requires role-based scripting unique to each of the 4 RBAC roles (Super Admin, Partner Admin, Org Admin, Staff). | Not implemented in UI prototype — tour script exists externally and needs role-based scripting per RBAC role. Production must integrate the guided tour overlay with role-specific step sequences. |
| **Contextual Help** | Each major section (Main, Insights, Agents, Hub, Drive, Settings) must have a help tooltip or info icon linking to contextual documentation relevant to the user's role and current page. | Not implemented. |

---

## 13. Data Handling & Architecture

### 13.1 Data Source Integration

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Third-Party Tool Queries** | Automa and agents must be able to query integrated third-party tools (VinSolutions, etc.) via natural language. Query results must appear within 5 seconds. Failed queries must show a user-friendly error message with retry option. | Prototype chat delivers simulated responses. Production must implement actual tool query routing. |
| **Fortification Stores** | Uploaded documents and web-scraped data must be searchable via Automa chat. Queries against fortification stores must return relevant excerpts with source attribution (file name, page number). | Prototype has Knowledge Base settings (Auto-Index, Web Scraping, Retention, Summarization toggles) and Agent Config > Knowledge section showing 3 knowledge sources with item counts. Production must implement actual document retrieval. |

### 13.2 Memory Management

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Short-Term Memory** | Chat context must be maintained across all messages within a single session. Referencing a topic from 10+ messages ago must return a contextually aware response. | Prototype maintains message array in React state. Production must implement server-side session context. |
| **Long-Term Memory** | System must remember user preferences, past interaction patterns, and previously discussed topics across sessions. Must be able to reference "last time we discussed X" accurately. | Not implemented. Prototype state resets on page reload. |
| **Memory Segmentation** | Memory must be segmented by: (1) User-level preferences, (2) Organization-level knowledge, (3) Agent-specific context. Cross-contamination between organizations must be prevented. | Not implemented. Production must implement isolated memory stores per org/user. |

### 13.3 Data Storage Architecture

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Organizational Data Isolation** | Data must be logically separated by organization. An Org Admin must never see data from another organization. API responses must be filtered by org context. Role switching in the prototype demonstrates the UI pattern — production must enforce it at the data layer. | Prototype shows org-scoped UI via RBAC role switcher. Production must enforce at API/database level. |

---

## 14. Agent System Architecture

### 14.1 Agent Creation & Configuration

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Natural Language Agent Builder** | Users can create new agents by describing desired behavior in plain language. The system must parse the description and suggest: appropriate triggers, tools, skills, and a draft system prompt. Accessible via Agents > "+" button (navigates to `/agents/create`). | Prototype has "+" button in Agent List panel header linking to `/agents/create`. Production must implement the NL agent builder on that route. |
| **Prompt Engineering Interface** | Agent instructions must be editable via Agent Config > Instructions tab. The edit modal must include: textarea with current instructions, character count, Save and Cancel buttons. Save must immediately update the agent's behavior. Version history with rollback must be available. | Prototype implements: Instructions tab in right pane, Edit button opening modal with pre-filled textarea, Save/Cancel buttons. Saving updates the displayed instructions. Production must add version history/rollback. |
| **Trigger Management** | Agent triggers are viewable and configurable in Agent Config > Triggers tab. Each trigger shows: type name, schedule/condition details, and On/Off badge. "Configure" button opens a modal with toggle switches per trigger. Changes persist on Save. | Prototype fully implements trigger list with type, details, On/Off badges, and configuration modal with toggle switches and Save button. |

### 14.2 Agent Quality Configuration (Qualia)

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **System-Level Qualia** | Automa's baseline personality is configurable in Settings > AI Configuration. Options include text prompt input for custom personality and predefined templates (Professional, Friendly, Technical, etc.). Changes affect all Automa responses globally. | Prototype has AI Configuration with toggles (Hunches, Auto-Scoring, etc.). Production must add personality template selector and custom prompt field. |
| **Agent-Level Qualia** | Individual agent personalities are configurable in Agent Config > Instructions tab. Agent-specific personality overrides system defaults. Each agent's instruction set defines tone, formality level, and domain focus. | Prototype shows per-agent instructions editable via modal. Production must support explicit personality override vs. system default. |

### 14.3 Default Agent Architecture

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Communications Agent (Caroline)** | A default Communications Agent must be pre-configured and available to all organizations out-of-the-box. The agent name (e.g., "Caroline") must be consistent across: Tavus video, Vapi voice, and text chat. Managed by Super Admin — Org Admins cannot modify the system prompt but can view it. | Prototype includes agents in the agent list with names, descriptions, and channel badges. The Communications Agent would appear with a channel badge showing its type. Production must enforce cross-channel name consistency. |
| **Agent Naming Convention** | The external-facing name (e.g., "Caroline") must match across: Agent detail header, Agent Information Pane customer link, Tavus integration, Vapi integration, and Widget chat header. Internal system references use the same identifier. | Prototype shows agent name in: detail header (h1), config pane, and list panel. Production must sync this name to all external integrations. |

### 14.4 Agent Capabilities & Interface

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **SMS/Email from Chat** | Agents must support sending SMS and email directly from the chat interface. User types "Send an SMS to [customer]" and the agent composes and sends the message. Bulk sending must be supported for lists of recipients. | Prototype chat is simulated. Production must implement actual message sending via chat commands. Hub > Leads already provides manual SMS/Email via action buttons and compose modal. |
| **File Attachment in Chat** | Users can attach files from Drive or upload new files directly in the chat via the (+) button. Options: "Upload File" and "Add from Drive." Attached files must be includable in outbound messages to customers. | Prototype implements (+) button with Upload File and Add from Drive options (toast in demo mode). Production must implement actual file upload and attachment. |
| **Agent Information Pane** | Agent Config pane must display: customer-facing link URL, assigned phone number, customer text chat link, and contextual instructions with inline editing. All displayed in the Performance or Instructions sections of the right pane config. | Prototype implements Agent Information section in Performance tab showing: customer-facing link (Globe icon + URL + copy/open buttons), assigned phone number (Phone icon + number + copy button), and text chat link (Link icon + URL + copy/open buttons). Each field has clipboard copy with toast feedback. Fields only render when data exists for the agent (e.g., Lead Qualifier has no phone). Instructions section shows system prompt with Edit modal. |

---

## 15. Automa Chat Capabilities

### 15.1 Core LLM Functionality

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Multi-Turn Conversation** | Automa must maintain coherent conversation context for a minimum of 20 turns. Each response must demonstrate awareness of all prior messages in the session. Context window must handle at least 8,000 tokens of conversation history. | Prototype maintains message array in React state (unlimited turns in UI). Simulated responses do not demonstrate context awareness. Production must implement actual LLM with context window management. |
| **Intent Parsing** | Automa must correctly identify user intent and route to the appropriate system component. Categories: data query, report generation, settings change, agent interaction, general Q&A. Accuracy target: 95% on common intents. | Not implemented. Prototype delivers generic simulated responses. |

### 15.2 File & Data Handling

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **File Upload & Processing** | Accepted formats: PDF, DOCX, XLS/XLSX, CSV, JPG, PNG. Max file size: 50MB. Upload must show progress bar. Processing must extract text content within 30 seconds for files under 10MB. Processed files are stored in Drive and indexed in fortification stores. | Prototype has (+) button with "Upload File" option (toast only). Production must implement actual upload with progress and processing. |

### 15.3 Content Generation & Export

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Document Creation** | Automa can generate: PDF reports (professional formatting), Excel spreadsheets (with formulas), CSV exports, and hosted HTML pages. Generated documents must be automatically saved to Drive > My Files. | Prototype shows Drive with file types including documents, spreadsheets, PDFs. Production must implement actual generation from chat commands. |
| **Shareable Links** | Every generated document must have a shareable link. Links are copyable via the Drive Share modal (Email/SMS tabs + Copy Link button with clipboard API). Link permissions must be configurable (view/edit/admin). | Prototype implements Share modal with Email/SMS tabs, recipient input, Copy Link with clipboard API (`navigator.clipboard.writeText()`), and toast feedback. Production must implement actual link generation with permissions. |

### 15.4 Data Query & Analysis

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Fortification Store Queries** | Users can ask Automa questions about uploaded documents. Responses must cite the source document name and relevant section. Query response time: under 5 seconds for indexed documents. | Not implemented. |
| **CRM Data Access** | Automa can query CRM data (VinSolutions) with appropriate role-based permissions. Queries return formatted results within the chat. Limitations imposed by VinSolutions API must be clearly communicated to the user with alternative suggestions. | Not implemented. Prototype uses mock lead data. |

### 15.5 User Guidance & System Management

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Post-Turn Suggestions** | After each Automa response, the system must display 2-4 contextually relevant follow-up suggestions as clickable pill buttons. Suggestions must relate to the current conversation topic, not be generic. | Prototype shows suggestion bubbles (4 pills with sparkle icon + "Try asking..." label). Currently static suggestions. Production must generate dynamic, context-aware suggestions. |
| **Settings Management via Chat** | Automa can modify system settings when instructed (e.g., "Turn off email notifications"). The chat must: (1) explain what will change, (2) ask for confirmation, (3) apply the change, (4) confirm success. For changes requiring manual action, Automa provides step-by-step instructions. | Not implemented. Prototype settings are managed via Settings pages only. |

---

## 16. Main Dashboard (Production Enhancements)

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Role-Personalized Landing** | Main page content adapts to the authenticated user's role. Super Admin sees system-wide metrics; Staff sees personal lead-focused metrics. All 4 tile values must be calculated from real data, not hardcoded. | Prototype shows 4 role-specific metric tiles that change when switching roles via dev tool. Values are mock data. Production must calculate from real data sources. |
| **Real-Time Updates** | Metric tile values must update within 60 seconds of underlying data changes. Chat responses must stream in real-time (SSE or WebSocket) rather than appearing all at once. | Prototype uses simulated delays (1.5s for Main, 1.8s for Agents). Production must implement streaming responses. |

---

## 17. Insights Module (Production Enhancements)

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Dashboard Drill-Down** | All Command Center alerts, Performance Scorecard cards, and Pipeline Health stages must be clickable with drill-down views showing the contributing data points. | Prototype: Command Center alerts and Pipeline stages are display-only. Scorecard cards are display-only. Production must add drill-down modals. |
| **Custom Reports** | Org Admins can create custom reports by selecting metrics, date ranges, and visualization types. Saved reports appear in Reports tab with "Last run" timestamps. | Prototype shows 8 pre-defined reports in 3 categories. Production must add report builder. |
| **Library Metric Customization** | Users can pin/favorite metrics from the 61-item Library to create personalized dashboards. Pinned metrics appear at the top of the Library view. | Prototype shows all 61 metrics with category filter and search. No pinning feature. Production should add pin/favorite per metric. |

---

## 18. Default Agent Suite (Production Enhancements)

| Agent | Required Capabilities | UI Prototype Status |
|---|---|---|
| **[Org] Communications Agent** | Answer questions about lead interactions, provide engagement updates, access lead info, send messages directly from chat. Must maintain cross-channel identity consistency. | Prototype has agent list with selectable agents and chat interface. Production must implement actual lead data access and message sending. |
| **Sales Coach Agent** | Provide deal handling guidance, access lead info, query database for precedents, offer personalized scenario-based coaching. | Prototype includes agent with description and mock chat. Production must implement actual sales data queries and coaching logic. |
| **Messaging Coach Agent** | Help construct customer replies, recommend communication channels, offer closure strategies, provide templates. | Prototype includes agent with description and mock chat. Production must implement template library and channel recommendation logic. |

---

## 19. Hub Module (Production Enhancements)

### 19.1 Inbox (Unified Communications)

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Channel Consolidation** | Inbox must show all customer communications in a single view: SMS (green icon), Email (blue icon), Voicemail (purple icon), Widget requests. Each message shows: sender, subject, preview, timestamp, unread indicator. | Prototype implements Inbox tab with color-coded message types, unread indicators (primary-color left border), and action buttons (Email, SMS, Call). |
| **Cross-Channel Response** | Users can respond to any message type from the inbox. Email replies open compose in email mode; SMS replies in SMS mode. Response must thread correctly with the original conversation. | Prototype has compose modal with SMS/Email toggle. Production must implement actual message threading. |
| **Priority & Filtering** | Inbox must support filtering by: channel type (SMS/Email/Voicemail), read/unread status, date range, and customer name search. Priority indicators must surface urgent customer requests. | Prototype shows messages in chronological order. Production must add filter controls. |

### 19.2 Leads Management

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Lead Cards** | Each lead shows: avatar (initials), name, status badge (Hot=red, Warm=amber, New=blue, Cold=gray, Qualified=green), vehicle of interest, phone, email, last contact timestamp. | Prototype fully implements lead cards with all listed fields and color-coded status badges. |
| **Lead Detail Modal** | Clicking a lead card opens a modal showing: complete activity history, all interactions (calls, emails, SMS), lead score, timeline of touchpoints, and status change history. | Prototype implements lead detail modal. Clicking any lead card opens a dialog with: avatar, name, vehicle/source, lead score (color-coded circle 0-100), status/phone/email/created grid, scrollable activity timeline with reverse-chronological events (call, email, SMS, note, status_change, meeting) with type-colored icons and expandable detail text, plus action buttons (Text, Call, Schedule) in the modal footer. |
| **Quick Actions** | 3 action buttons per lead: Text (opens compose in SMS mode), Call (opens dialer with pre-filled number), Schedule (opens appointment modal with lead name). | Prototype fully implements all 3 action buttons with corresponding modals and pre-filled data. Action buttons also appear in the lead detail modal footer. Buttons use `e.stopPropagation()` on lead cards to prevent opening the detail modal when clicking action buttons. |
| **Lead Scoring** | Each lead must display a numerical score (0-100) based on engagement level, recency, and behavioral signals. Score must update in real-time as new interactions occur. | Prototype displays lead scores on each lead card (Target icon + score value) with color coding: green (≥75), amber (50-74), gray (<50). Scores also appear as a large circle in the lead detail modal header. Mock scores range from 28 to 91. Production must calculate scores from real interaction data. |

### 19.3 Calendar

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Multi-View Calendar** | Calendar must support 4 views: Year (12 mini-month cards), Month (grid with event chips), Week (7-column hourly grid, default), Day (single column hourly grid). View switcher buttons at top. | Prototype fully implements all 4 calendar views with navigation controls (prev/next arrows, today button) and date range display. |
| **Event Display** | Events are color-coded by type: Meeting (blue), Appointment (green), Task (orange), Reminder (purple). Events show in their time slot with title and time range. | Prototype implements color-coded events in all calendar views. Events render in hour slots based on start time. |
| **Calendar Search** | Search field filters events by title, description, or attendees. Active search shows result count and switches to list view. Clearing search restores grid view. | Prototype fully implements calendar search with result count and list/grid toggle. |
| **Appointment Integration** | Appointments scheduled through widgets must appear in the calendar. Staff can see only their own appointments; Org Admin sees all staff calendars. | Prototype shows mock events. Production must integrate with widget-scheduled appointments and enforce role-based visibility. |

---

## 20. Drive Module (Production Enhancements)

### 20.1 Folder Structure & Organization

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **CRUD Operations** | Users can create, rename, move, and delete folders and files. Create folder via "New Folder" button. Delete via 3-dot menu. Rename via 3-dot menu > Edit. Move via drag-and-drop or 3-dot menu > Move. | Prototype has: New Folder button (toast), 3-dot menu with Download/Share/Star/Delete actions (all show toasts), Grid and List view toggle. Production must implement actual file operations. |
| **Nested Folder Navigation** | Clicking a folder navigates into it. Breadcrumb trail shows current path. Back button returns to parent folder. Maximum nesting depth: 10 levels. | Prototype supports folder click navigation. Production must add breadcrumb navigation. |

### 20.2 Sharing & Collaboration

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Share Modal** | Share modal includes: Email/SMS tabs, recipient input, Copy Link with clipboard API, and Send button. Copy Link shows "Link copied" toast and changes to "Copied" with check icon for 2 seconds. | Prototype fully implements Share modal with all described behaviors including clipboard API integration. |
| **Permission Controls** | Shared files must support 3 permission levels: View (read-only), Edit (modify content), Admin (full control + re-share). Permission selector must be visible in share modal. | Prototype has share modal without permission selector. Production must add permission dropdown. |

### 20.3 Template Management

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Template Library** | Drive sub-menu includes "Templates" category (FileBox icon). Templates are reusable document frameworks for reports, emails, and proposals. Users can create templates from existing documents and apply templates to generate new documents. | Prototype shows Templates in Drive sub-menu panel (display-only, links to `/drive`). Production must implement template creation and application. |

### 20.4 Organization Shared Folder

| Criteria | Measurable Standard | UI Prototype Status |
|---|---|---|
| **Shared Folder Access** | Drive sub-menu includes "Shared" category (Users icon). All organization members can access the shared folder. Files moved to shared folder are visible to all org users. Edit permissions are configurable per file. | Prototype shows Shared in Drive sub-menu panel (display-only). Production must implement org-wide shared folder with permissions. |

---

## 21. Acceptance Testing Requirements

### 21.1 Documentation Standards

| Criteria | Measurable Standard |
|---|---|
| **Test Evidence** | Every acceptance criterion in this document must have written test evidence: pass/fail status, screenshot or screen recording, tester name, and date. |
| **Edge Case Documentation** | Minimum 3 edge cases documented per major feature (Auth, Chat, Agents, Hub, Drive, Settings). Edge cases include: empty states, maximum input lengths, rapid repeated actions, and concurrent user scenarios. |
| **Defect Tracking** | All defects discovered during acceptance testing must be logged with: severity (Critical/High/Medium/Low), reproduction steps, expected vs. actual behavior, and resolution status. |

### 21.2 Performance Benchmarks

| Criteria | Measurable Standard |
|---|---|
| **Page Load Times** | Initial page load: under 3 seconds on 4G connection. Subsequent navigation (client-side): under 500ms. |
| **Chat Response Latency** | First token of streaming response: under 2 seconds. Complete response: under 10 seconds for standard queries. |
| **Data-Heavy Views** | Insights Library (61 metrics), Drive (100+ files), Hub Leads (50+ leads): all must render within 2 seconds with smooth scrolling (60fps). |
| **Concurrent Users** | System must handle 100 concurrent users per organization without degradation. Response times must not exceed 2x baseline under load. |

### 21.3 Integration Validation

| Criteria | Measurable Standard |
|---|---|
| **VinSolutions** | Validate: lead insertion, data sync, and query responses. Test with 10 sample leads. Verify all required fields are populated. |
| **Tavus Video** | Validate: agent identity matches, video session initiates within 5 seconds, session recording saves correctly. |
| **Vapi Voice** | Validate: inbound routing to correct agent, outbound call initiation, call transcript generation within 60 seconds of call end. |
| **Widget Embed** | Validate: embed code renders correctly on external sites, all 4 widget types function (Text Chat, Live Video, Voice Call, Unified), and interactions route to correct agents. |

---

## 22. Outstanding Configuration Items

| Item | Priority | Current Status |
|---|---|---|
| Implement login/authentication screen | High | Not built — prototype is always authenticated |
| Implement password reset workflow | High | Not built |
| Reactivate and configure role-based product tour | Medium | Not built |
| Finalize VinSolutions data insertion field mapping | High | Not built — mock data only |
| Complete cross-channel identity consistency for all agent types | High | UI supports agent naming — backend integration needed |
| Validate metrics drill-down functionality across all views | Medium | Main page tiles have drill-down; Dashboard/Scorecard need it |
| Add calculation transparency ("How this is calculated") to metric modals | Medium | Not implemented |
| Implement data lineage (source attribution) on all metrics | Medium | Not implemented |
| Add lead scoring (0-100) to lead cards | Medium | Status badges exist, numerical scores needed |
| Add breadcrumb navigation to Drive folder hierarchy | Low | Folder click navigation works, breadcrumbs not built |
| Add permission levels (View/Edit/Admin) to Drive share modal | Medium | Share modal works, permission selector needed |
| Implement report builder for custom reports in Insights | Medium | Pre-defined reports exist, builder not built |

---

## Document Usage Guide

This acceptance criteria document serves multiple purposes:

1. **QA Testing:** Each section maps to testable scenarios with specific expected behaviors, field names, and interaction patterns that can be verified manually or with automated tests. Part I criteria can be tested against the current prototype. Part II criteria define production requirements.

2. **Developer Handoff:** When transitioning from prototype to production, developers can reference Part I for the exact UI contract (layout, interactions, styling) and Part II for the functional requirements (data flow, integrations, business logic) that must be implemented behind that UI.

3. **Stakeholder Review:** Non-technical stakeholders can walk through each section to validate business requirements. Part I confirms the visual/interactive design. Part II confirms the operational capabilities.

4. **Design System Governance:** Section 9 (Design Standards) ensures consistency as additional features are added. New pages or components must follow established patterns.

5. **Sprint Planning:** Each numbered section can be broken into user stories or tasks for implementation sprints, with clear definitions of done based on the measurable standards.

6. **Regression Testing:** After any change, the acceptance criteria provide a checklist to ensure existing functionality has not been broken. The "UI Prototype Status" column in Part II tracks what is already verified vs. what needs production implementation.

7. **Gap Analysis:** The "Outstanding Configuration Items" section (22) provides a prioritized list of what remains to be built, serving as a ready-made backlog for production development.