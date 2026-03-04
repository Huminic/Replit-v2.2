# Nexxus Connect - Acceptance Criteria

**Product:** Nexxus Connect V2.2
**Document Type:** Testable Acceptance Criteria
**Scope:** UI prototype with client-side mock data, organized by wave delivery structure
**Navigation Model:** Persona/department-based (AI Chat, TeamBox, My Work, Sales, Service, Marketing, Management)

---

## Wave 1 - Core Navigation & Shell

### W1-AC-001: Sidebar Navigation Structure

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-001a | Sidebar renders 7 primary navigation items: AI Chat, TeamBox, My Work, Sales, Service, Marketing, Management | Visual inspection: all 7 items visible with correct labels and icons |
| W1-AC-001b | Bottom section renders System item with Settings icon | Visual inspection: System item present below separator |
| W1-AC-001c | Logout button renders at the very bottom of sidebar | Visual inspection: Logout button with LogOut icon visible |
| W1-AC-001d | Sidebar has fixed width of 64px (w-16) | Measure element width; confirm w-16 class applied |
| W1-AC-001e | Active page shows purple left-edge indicator bar and highlighted icon/label | Navigate to each page; confirm active indicator renders |
| W1-AC-001f | Hovering a sidebar item with a panel shows the sub-menu preview panel | Hover over AI Chat; confirm SubMenuManager panel appears |
| W1-AC-001g | Sub-menu panel auto-hides after 800ms when mouse leaves sidebar and panel | Hover sidebar item, move mouse away; confirm 800ms delay before panel hides |
| W1-AC-001h | Sidebar collapse button (ChevronsRight) toggles sidebar between full and collapsed state | Click collapse button; confirm sidebar collapses to narrow strip |
| W1-AC-001i | SubMenuExpanded toggle button (double-chevron) pins/unpins the sub-menu panel | Click toggle; confirm panel stays open when pinned |

### W1-AC-002: RBAC Sidebar Gating

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-002a | AI Chat visible to all 8 roles | Switch to each role via role switcher; confirm AI Chat sidebar item visible |
| W1-AC-002b | TeamBox visible to all 8 roles | Switch to each role; confirm TeamBox visible |
| W1-AC-002c | My Work visible to all 8 roles | Switch to each role; confirm My Work visible |
| W1-AC-002d | Sales visible to super_admin, partner_admin, org_admin, executive, sales_manager, sales | Switch to each listed role; confirm Sales sidebar item visible |
| W1-AC-002e | Sales hidden from service and marketing roles | Switch to service and marketing; confirm Sales item not rendered |
| W1-AC-002f | Service visible to super_admin, partner_admin, org_admin, executive, service | Switch to each listed role; confirm Service visible |
| W1-AC-002g | Service hidden from sales_manager, sales, marketing roles | Switch to each; confirm Service item not rendered |
| W1-AC-002h | Marketing visible to super_admin, partner_admin, org_admin, executive, marketing | Switch to each listed role; confirm Marketing visible |
| W1-AC-002i | Marketing hidden from sales_manager, sales, service roles | Switch to each; confirm Marketing item not rendered |
| W1-AC-002j | Manage visible to super_admin, partner_admin, org_admin, executive, sales_manager | Switch to each listed role; confirm Manage sidebar item visible |
| W1-AC-002k | Manage hidden from sales, service, marketing roles | Switch to each; confirm Manage item not rendered |
| W1-AC-002l | System visible to super_admin, partner_admin, org_admin only | Switch to each admin role; confirm System visible |
| W1-AC-002m | System hidden from executive, sales_manager, sales, service, marketing | Switch to each; confirm System item not rendered |

### W1-AC-003: Top Bar

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-003a | Logo text "Nexxus Connect" renders on the far left | Visual inspection |
| W1-AC-003b | Organization switcher shows current org name with Building icon and chevron | Click switcher; confirm dropdown lists organizations |
| W1-AC-003c | Selecting an organization updates the active org context | Select different org; confirm org name changes in switcher |
| W1-AC-003d | Notifications bell shows unread count badge | Visual inspection; confirm badge number matches unread notifications |
| W1-AC-003e | Clicking notifications bell opens scrollable dropdown with notification items | Click bell; confirm dropdown appears with notification list |
| W1-AC-003f | Clicking a notification marks it as read | Click an unread notification; confirm badge count decrements |
| W1-AC-003g | Theme toggle switches between light and dark mode | Click moon/sun icon; confirm theme toggles and persists |
| W1-AC-003h | Profile menu shows user name, email, role badge | Click avatar; confirm dropdown shows user info |
| W1-AC-003i | Profile menu contains My Profile, Preferences, Billing links | Click avatar; confirm menu items navigate to /profile routes |
| W1-AC-003j | Role switcher (dev tool) allows changing RBAC role | Click role switcher; select different role; confirm UI updates |
| W1-AC-003k | Role persists via localStorage key "nexxus-current-role" | Change role; refresh page; confirm role persisted |

### W1-AC-004: Route Structure

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-004a | Route `/` renders AI Chat (MainPage) | Navigate to /; confirm MainPage renders |
| W1-AC-004b | Route `/teambox` renders TeamBox page | Navigate to /teambox; confirm TeamboxPage renders |
| W1-AC-004c | Route `/my-work` renders My Work page | Navigate to /my-work; confirm MyWorkPage renders |
| W1-AC-004d | Route `/sales` renders Sales page | Navigate to /sales; confirm SalesPage renders |
| W1-AC-004e | Route `/service` renders Service page | Navigate to /service; confirm ServicePage renders |
| W1-AC-004f | Route `/marketing` renders Marketing page | Navigate to /marketing; confirm MarketingPage renders |
| W1-AC-004g | Route `/management` renders Management page | Navigate to /management; confirm ManagementPage renders |
| W1-AC-004h | Route `/settings/system` renders Settings page | Navigate to /settings/system; confirm SettingsPage renders |
| W1-AC-004i | Route `/settings/billing` renders Billing Management page | Navigate to /settings/billing; confirm page renders |
| W1-AC-004j | Route `/profile` renders Profile page | Navigate to /profile; confirm ProfilePage renders |
| W1-AC-004k | Route `/w/demo` renders Widget Landing page (no AppLayout shell) | Navigate to /w/demo; confirm widget landing renders without sidebar/topbar |
| W1-AC-004l | Unknown routes render 404 Not Found page | Navigate to /nonexistent; confirm NotFound renders |

### W1-AC-005: Layout Rules (Cardinal Rules)

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-005a | Data-display pages (Sales, Service, Marketing, Management) show right pane toggle button | Navigate to /sales; confirm ChevronsLeft toggle visible |
| W1-AC-005b | Right pane on data-display pages shows AI chat (Automa) | Open right pane on /sales; confirm chat interface renders |
| W1-AC-005c | AI Chat page (/) does NOT show right pane toggle | Navigate to /; confirm no right pane toggle visible |
| W1-AC-005d | AI Chat page centers content with max-w-4xl | Navigate to /; confirm main content has max-w-4xl class |
| W1-AC-005e | TeamBox page does NOT use global right pane (uses internal 3-column layout) | Navigate to /teambox; confirm no global right pane toggle |
| W1-AC-005f | Right pane opens as side-by-side on desktop (w-80 / lg:w-96) | Open right pane on desktop; confirm width and side-by-side layout |
| W1-AC-005g | Right pane opens as full-screen overlay on mobile (<md) | Open right pane on mobile viewport; confirm full-screen overlay |
| W1-AC-005h | Automa pop-out button (MessageCircle) visible on data-display pages when right pane closed | Check /sales with right pane closed; confirm purple MessageCircle button visible |

---

## Wave 1 - AI Chat Page

### W1-AC-010: Metric Tiles

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-010a | 4 metric tiles render above the chat area | Navigate to /; confirm 4 tiles visible |
| W1-AC-010b | Tiles show role-specific content for super_admin: Partner Orgs, Total Logins, Platform Actions, Agent Actions | Switch to super_admin; confirm tile labels match |
| W1-AC-010c | Tiles show role-specific content for partner_admin: Sub Orgs, Total Logins, User Actions, Agent Actions | Switch to partner_admin; confirm tile labels match |
| W1-AC-010d | Tiles show role-specific content for org_admin: Pipeline Value, Lead Source, Lead Quality, Demand Score | Switch to org_admin; confirm tile labels match |
| W1-AC-010e | Tiles show role-specific content for executive: Revenue, Team Activity, Customer Sat, ROI Score | Switch to executive; confirm tile labels match |
| W1-AC-010e2 | Tiles show role-specific content for sales_manager: Pipeline Value, Team Leads, Conversion Rate, Urgency Score | Switch to sales_manager; confirm tile labels match |
| W1-AC-010e3 | Tiles show role-specific content for sales: Hot Opportunities, Buying Intel, Threats, Urgency Score | Switch to sales; confirm tile labels match |
| W1-AC-010e4 | Tiles show role-specific content for service: Active Campaigns, Messages Sent, Appointments, Upsell Rate | Switch to service; confirm tile labels match |
| W1-AC-010e5 | Tiles show role-specific content for marketing: Campaign Perf, Leads Generated, Widget Clicks, Landing Visits | Switch to marketing; confirm tile labels match |
| W1-AC-010f | Clicking a tile opens a detail modal with breakdown data | Click Pipeline Value tile; confirm modal opens with breakdown rows |
| W1-AC-010g | After first chat message, tiles collapse with window-blind animation (500ms) | Send a message; confirm tiles animate to max-h-0 opacity-0 |
| W1-AC-010h | Show/Hide toggle appears after first message | Send a message; confirm toggle button with data-testid="button-toggle-metrics" appears |
| W1-AC-010i | Toggle button expands/collapses tiles | Click toggle; confirm tiles expand/collapse |

### W1-AC-011: Chat Interface

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-011a | Bot messages render left-aligned with card background | Send message; confirm bot response renders left-aligned with bg-card |
| W1-AC-011b | User messages render right-aligned with primary color | Send message; confirm user message renders right-aligned with bg-primary |
| W1-AC-011c | No avatars or icons on chat messages | Inspect messages; confirm no Avatar components within message bubbles |
| W1-AC-011d | Typing animation shows 3 wave dots with staggered delays (0s, 0.15s, 0.3s) | Send message; confirm wave-dot animation appears with correct delays |
| W1-AC-011e | Typing animation disappears when bot response arrives (~1.5s delay) | Send message; confirm dots disappear after response renders |
| W1-AC-011f | Suggestion bubbles render below chat area | Navigate to /; confirm suggestion pill buttons visible |
| W1-AC-011g | Clicking a suggestion populates the input and focuses it | Click a suggestion; confirm input value updates and input is focused |
| W1-AC-011h | Chat input has animated gradient border (chat-input-gradient class) | Inspect input container; confirm chat-input-gradient class present |
| W1-AC-011i | Enter key sends message; Shift+Enter creates newline | Type text, press Enter; confirm message sends. Type text, press Shift+Enter; confirm newline |
| W1-AC-011j | Send button disabled when input is empty | Clear input; confirm send button has disabled attribute |
| W1-AC-011k | Thinking card renders with Brain icon and expandable details | Check first bot message; confirm thinking card with data-testid="thinking-card" |
| W1-AC-011l | Persona name is dynamic (reads from organization config, not hardcoded) | Check chat input placeholder; confirm it uses persona name from AppContext |

### W1-AC-012: AI Chat Sub-Menu Panel

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-012a | Panel shows Favorites section with star icon header | Hover AI Chat sidebar item; confirm Favorites section visible |
| W1-AC-012b | Favorited pages appear as clickable items in Favorites section | Add a favorite; confirm it appears in panel |
| W1-AC-012c | Empty favorites shows "Star pages to access them quickly" text | Remove all favorites; confirm empty state text |
| W1-AC-012d | Chat History section lists recent conversations | Confirm Chat History section with conversation items |
| W1-AC-012e | Each conversation shows title, last message preview, relative timestamp | Inspect conversation items; confirm all fields present |
| W1-AC-012f | Conversation items have 3-dot menu with Resume and Delete options | Hover a conversation item; confirm MoreVertical menu appears |
| W1-AC-012g | Artifacts section renders with placeholder text | Confirm Artifacts section visible below Chat History |

---

## Wave 1 - TeamBox Page

### W1-AC-020: TeamBox Layout

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-020a | TeamBox renders 3-column layout on desktop (lg+) | Navigate to /teambox on desktop; confirm 3 columns visible |
| W1-AC-020b | Left column contains status and channel filters | Confirm filter panel with Status and Channel sections |
| W1-AC-020c | Center-left column contains searchable conversation list | Confirm conversation list with search above |
| W1-AC-020d | Center column contains chat thread with reply input | Select a conversation; confirm messages render |
| W1-AC-020e | Right column shows customer info panel | Confirm customer info panel on xl+ screens |

### W1-AC-021: TeamBox Filters

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-021a | Status filters: All, Open, Assigned to me, Participating, Automated, Scheduled, Followup, Pending | Confirm all 8 status filter buttons render |
| W1-AC-021b | Channel filters: All, SMS, Email, Web Chat, WhatsApp, Voice | Confirm all 6 channel filter buttons render |
| W1-AC-021c | Selecting a status filter updates conversation list | Click "Open"; confirm only open conversations shown |
| W1-AC-021d | Selecting a channel filter updates conversation list | Click "SMS"; confirm only SMS conversations shown |
| W1-AC-021e | Search filters conversations by customer name | Type "Michael"; confirm only Michael Clark's conversation shown |
| W1-AC-021f | Filter counts display next to status labels | Confirm badge counts next to status filter labels |

### W1-AC-022: TeamBox Conversations

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-022a | Conversation items show customer name, last message preview, timestamp | Inspect conversation items; confirm all fields |
| W1-AC-022b | Conversation items show channel icon (SMS, Email, Chat, WhatsApp) | Confirm appropriate channel icon per conversation |
| W1-AC-022c | Conversation items show agent name badge when assigned to agent | Confirm agent name badge visible for agent-handled conversations |
| W1-AC-022d | Unread count badge shows on conversations with unread messages | Confirm unread badge count visible |
| W1-AC-022e | Clicking a conversation selects it and shows chat thread | Click a conversation; confirm thread loads in center column |
| W1-AC-022f | Selected conversation has highlighted background (bg-accent) | Click a conversation; confirm bg-accent applied |

### W1-AC-023: TeamBox Chat Thread

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-023a | Customer messages render left-aligned with muted background | Confirm customer messages left-aligned with bg-muted |
| W1-AC-023b | Bot messages render right-aligned with primary/10 background and border | Confirm bot messages right-aligned with bg-primary/10 |
| W1-AC-023c | Staff messages render right-aligned with primary background | Confirm staff messages right-aligned with bg-primary |
| W1-AC-023d | Each message shows sender name, content, and relative timestamp | Inspect messages; confirm all fields present |
| W1-AC-023e | Reply textarea renders at bottom with "Write a reply..." placeholder | Confirm textarea with placeholder text |
| W1-AC-023f | Send button disabled when reply is empty | Clear reply; confirm send button disabled |
| W1-AC-023g | Attachment (Paperclip) button renders next to send | Confirm Paperclip button visible |

### W1-AC-024: TeamBox Actions

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-024a | "Take Over" button visible on automated conversations | Select an automated conversation; confirm Take Over button renders |
| W1-AC-024b | "Disconnect Campaign" button visible on campaign-linked conversations | Select conversation with campaignId; confirm Disconnect Campaign button |
| W1-AC-024c | Customer info panel shows name, email, phone, channel, status | Select a conversation; confirm info panel fields |
| W1-AC-024d | Quick Actions section shows Call, Email, SMS buttons | Confirm 3 quick action buttons in customer info panel |
| W1-AC-024e | Tags section displays conversation tags as badges | Confirm tag badges visible |

---

## Wave 1 - My Work Page

### W1-AC-030: My Work Dashboard

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-030a | Page renders with greeting using current user's first name | Navigate to /my-work; confirm "Good morning, [FirstName]" heading |
| W1-AC-030b | 4 summary metric cards render: Tasks Due Today, Overdue Items, Conversations, Completed This Week | Confirm 4 metric cards with correct labels |
| W1-AC-030c | Upcoming Tasks card lists non-completed tasks | Confirm task list with status icons and priority badges |

### W1-AC-031: My Work Tabs

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-031a | Tab bar shows Dashboard, Tasks, Chat, Assistant tabs | Confirm 4 tabs render with correct labels |
| W1-AC-031b | Dashboard tab renders personal metrics and upcoming tasks | Click Dashboard; confirm content renders |
| W1-AC-031c | Tasks tab renders full task list with Add Task button | Click Tasks; confirm task list with Add Task button |
| W1-AC-031d | Each task shows status icon, title, status badge, priority badge, due date | Inspect task rows; confirm all fields |
| W1-AC-031e | Chat tab shows placeholder for personal conversations | Click Chat; confirm placeholder content |
| W1-AC-031f | Assistant tab shows placeholder with Launch Assistant button | Click Assistant; confirm placeholder with button |

---

## Wave 1 - Sales Page

### W1-AC-040: Sales Dashboard

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-040a | Tab bar shows Dashboard, Agents, Insights, Calendar tabs | Confirm 4 tabs render |
| W1-AC-040b | Dashboard tab renders 7 metric tiles: Pipeline Count, New Leads, Overdue Leads, Avg Lead Age, AI-Gen Leads, Conversion Rate, Top Agent Close | Confirm tiles with correct labels and values |
| W1-AC-040c | Each metric tile shows value, change percentage, trend arrow (up/down) | Inspect tiles; confirm trend indicators |
| W1-AC-040d | Top Performing Agents section lists active sales agents | Confirm agent list with ranking numbers |
| W1-AC-040e | Recent Activity section shows 5 activity items | Confirm 5 activity items with timestamps |

### W1-AC-041: Sales Agents Tab

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-041a | Agent cards render for sales department agents only | Click Agents tab; confirm only sales agents shown |
| W1-AC-041b | Each agent card shows avatar, name, channel, status dot, description | Inspect agent cards; confirm all fields |
| W1-AC-041c | Clicking an agent card selects it (ring-2 ring-primary highlight) | Click an agent; confirm selection highlight |

### W1-AC-042: Sales Sub-Menu Panel

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-042a | Panel shows Dashboard, Agents, Insights, Calendar nav items | Hover Sales sidebar item; confirm nav items |
| W1-AC-042b | Agent search input filters agents by name | Type in agent search; confirm filtering |
| W1-AC-042c | Agent list shows agents with status indicators | Confirm agent items with colored status dots |
| W1-AC-042d | Clicking an agent in sub-menu selects it in the context | Click agent in panel; confirm selectedAgent updates |

---

## Wave 1 - Service Page

### W1-AC-050: Service Dashboard

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-050a | Tab bar shows Dashboard, Agents, Campaigns, Insights, Calendar tabs | Confirm 5 tabs render |
| W1-AC-050b | Dashboard tab renders 6 metric tiles: Active Campaigns, Messages Sent, Replies Received, Appointments Booked, Declined Services, Upsell Rate | Confirm tiles with correct labels |
| W1-AC-050c | Each metric tile shows value, change percentage, trend arrow | Inspect tiles; confirm trend indicators |

### W1-AC-051: Service Campaigns Tab

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-051a | Campaign table renders with columns: Campaign, Status, Channel, Recipients, Sent, Replied, Kill Switch | Click Campaigns tab; confirm table headers |
| W1-AC-051b | Each campaign row shows name, status dot + label, channel badge | Inspect campaign rows; confirm all fields |
| W1-AC-051c | CSV filename displayed for campaigns with uploaded CSV | Confirm Upload icon + filename visible |
| W1-AC-051d | Kill Switch toggle renders per campaign row | Confirm Switch component in each row |
| W1-AC-051e | Kill Switch shows red when engaged (unchecked state = killed) | Confirm data-[state=unchecked]:bg-red-500 styling |
| W1-AC-051f | "Communications Paused" badge visible when global communication gate disabled | Disable communication gate; confirm destructive badge appears |
| W1-AC-051g | Campaign Safety info card renders below table | Confirm amber-themed info card with Ban icon |
| W1-AC-051h | "New Campaign" button renders | Confirm button with data-testid="button-new-campaign" |

---

## Wave 1 - Marketing Page

### W1-AC-060: Marketing Dashboard

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-060a | Tab bar shows Dashboard, Agents, Campaigns, Studio, Insights tabs | Confirm 5 tabs render |
| W1-AC-060b | Dashboard tab renders 4 metric tiles: Campaign Performance, Leads Generated, Widget Interactions, Landing Page Visits | Confirm tiles with correct labels |
| W1-AC-060c | Agents tab renders marketing department agents only | Click Agents; confirm only marketing agents |
| W1-AC-060d | Campaigns tab renders campaign table identical to Service format | Click Campaigns; confirm table structure |
| W1-AC-060e | Studio tab shows "Coming Soon" placeholder | Click Studio; confirm placeholder with "Coming Soon" badge |
| W1-AC-060f | Insights tab shows placeholder | Click Insights; confirm placeholder content |

---

## Wave 1 - Management Page

### W1-AC-070: Management Dashboard

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-070a | Tab bar shows Dashboard, Insights, Hunches, Activities, ROI tabs | Confirm 5 tabs render |
| W1-AC-070b | Dashboard tab renders 6 metric tiles: Total Revenue, Active Accounts, Team Activity Score, MRR, Customer Satisfaction, Avg Deal Size | Confirm tiles with correct labels |
| W1-AC-070c | Each metric tile shows value, change percentage, trend arrow | Inspect tiles |

### W1-AC-071: Management Hunches Tab

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-071a | Hunch cards render with title, confidence percentage, impact badge | Click Hunches tab; confirm card content |
| W1-AC-071b | Each hunch shows Pattern and Recommendation sections | Inspect hunch cards; confirm both sections |
| W1-AC-071c | Impact badge color: high=destructive, medium/low=secondary | Confirm badge variant matches impact level |
| W1-AC-071d | Confidence displayed as outline badge with percentage | Confirm outline badge with percentage value |
| W1-AC-071e | Lightbulb icon color varies by confidence level | Confirm icon color intensity varies |

### W1-AC-072: Management Activities Tab

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-072a | Activity items render with colored circle icon, description, timestamp | Click Activities tab; confirm item layout |
| W1-AC-072b | Activity items show relative timestamps (e.g., "2 hours ago") | Confirm formatDistanceToNow timestamps |

---

## Wave 1 - Settings Page

### W1-AC-080: Settings Tile Grid

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-080a | Settings renders tile grid with role-appropriate tiles | Navigate to /settings/system; confirm tile grid renders |
| W1-AC-080b | super_admin sees all 9 tiles including Data Management | Switch to super_admin; confirm 9 tiles |
| W1-AC-080c | partner_admin sees 7 tiles (excludes Data Management) | Switch to partner_admin; confirm 7 tiles |
| W1-AC-080d | org_admin sees 7 tiles (excludes AI Configuration, Security, Data Management) | Switch to org_admin; confirm correct tiles |
| W1-AC-080e | Clicking a tile navigates to that settings section | Click User Management tile; confirm section loads |
| W1-AC-080f | Back button returns to tile grid | Click Back; confirm tile grid reappears |

### W1-AC-081: User Management Section

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-081a | User list renders with avatar, name, role badge, email | Confirm user cards with all fields |
| W1-AC-081b | "Add User" button visible | Confirm button with data-testid="button-add-user" |
| W1-AC-081c | "New Organization" button visible only for super_admin | Switch to super_admin; confirm button visible. Switch to org_admin; confirm button hidden |
| W1-AC-081d | User 3-dot menu has Edit and Remove options | Click menu; confirm dropdown items |
| W1-AC-081e | Search input filters user list | Type in search; confirm filtering behavior |

### W1-AC-082: Widget Configuration (Tools Section)

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-082a | Widget list renders as table with Name, Embed Code, Status, Last Updated, Actions columns | Navigate to Tools section; confirm table layout |
| W1-AC-082b | Each widget row shows icon, name, type label, embed code with copy button | Inspect widget rows; confirm all fields |
| W1-AC-082c | "New widget" button creates a new draft widget | Click New widget; confirm new widget appears |
| W1-AC-082d | Widget search filters by name and code | Type in search; confirm filtering |
| W1-AC-082e | "View test page" button available per widget | Confirm button with Eye icon per row |
| W1-AC-082f | Clicking a widget row opens configuration panel | Click a row; confirm config panel loads |
| W1-AC-082g | Copy embed code button copies script tag to clipboard | Click copy; confirm toast confirmation |
| W1-AC-082h | Widget status badge shows correct color (active=green, inactive=gray, draft=amber) | Inspect status badges; confirm colors |

### W1-AC-083: Communication Gate

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-083a | Global communication gate toggle exists in Settings | Navigate to Tools/Organization section; confirm Power toggle |
| W1-AC-083b | Disabling communication gate shows "Communications Paused" badge on campaign pages | Disable gate; navigate to /service Campaigns tab; confirm badge |
| W1-AC-083c | Communication gate state persists across navigation | Disable gate; navigate away and back; confirm state persisted |

---

## Wave 1 - Sub-Menu Panels

### W1-AC-090: Sub-Menu Panel Behavior

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-090a | Each sidebar item shows corresponding panel on hover | Hover each item; confirm correct panel content |
| W1-AC-090b | Panel has ChevronLeft collapse button in header | Confirm collapse button in each panel header |
| W1-AC-090c | Clicking collapse button closes panel and un-pins | Click collapse; confirm panel closes |
| W1-AC-090d | Panel auto-collapses when window width drops below 1024px | Resize window below 1024px; confirm panel closes |
| W1-AC-090e | Pinned panel stays open when mouse leaves | Pin panel; move mouse away; confirm panel remains |

### W1-AC-091: TeamBox Sub-Menu Panel

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-091a | Panel shows Conversations, Tasks, Workflows nav items | Hover TeamBox; confirm nav items |
| W1-AC-091b | Quick Filters section shows Open, Automated, Followup | Confirm Quick Filters section with correct items |
| W1-AC-091c | Conversation count badge shows on Open filter | Confirm badge count |

### W1-AC-092: Department Sub-Menu Panels (Sales/Service/Marketing)

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-092a | Sales panel: Dashboard, Agents, Insights, Calendar + agent list with search | Hover Sales; confirm nav items and agent list |
| W1-AC-092b | Service panel: Dashboard, Agents, Campaigns, Insights, Calendar + agent list | Hover Service; confirm nav items and agent list |
| W1-AC-092c | Marketing panel: Dashboard, Agents, Campaigns, Studio, Insights + agent list | Hover Marketing; confirm nav items and agent list |
| W1-AC-092d | Management panel: Dashboard, Insights, Hunches, Activities, ROI | Hover Management; confirm nav items |
| W1-AC-092e | Agent search in department panels filters by agent name | Type in agent search; confirm filtering |
| W1-AC-092f | Agent items show avatar, name, and colored status dot | Inspect agent items; confirm fields |

### W1-AC-093: System Sub-Menu Panel

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-093a | Panel shows settings items filtered by current role | Hover System; confirm role-appropriate items |
| W1-AC-093b | Items show icon, label, and description | Inspect items; confirm all fields |
| W1-AC-093c | Clicking an item navigates to the corresponding settings section | Click Users; confirm navigation to ?section=users |

---

## Wave 1 - Profile Page

### W1-AC-100: Profile Sections

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-100a | Profile page renders with user info header | Navigate to /profile; confirm user info visible |
| W1-AC-100b | Sub-routes /profile/preferences and /profile/billing render correctly | Navigate to each; confirm content |

---

## Wave 1 - Widget Landing Page

### W1-AC-110: Widget Landing

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-110a | Route /w/demo renders without AppLayout shell (no sidebar, no topbar) | Navigate to /w/demo; confirm standalone page |
| W1-AC-110b | Landing page renders widget interaction UI | Confirm widget content visible |

---

## Wave 1 - Favorites System

### W1-AC-120: Favorites

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-120a | FavoritesBar renders on pages that support it | Navigate to a page with FavoritesBar; confirm it renders |
| W1-AC-120b | Star toggle adds/removes current page from favorites | Click star; confirm favorite added. Click again; confirm removed |
| W1-AC-120c | Favorite chips navigate to their target page on click | Click a favorite chip; confirm navigation |
| W1-AC-120d | Favorites appear in AI Chat sub-menu panel | Open AI Chat panel; confirm favorites listed |
| W1-AC-120e | Favorites persist during session but reset on reload | Add favorite; navigate away and back; confirm persisted. Reload; confirm reset |

---

## Wave 1 - Right Pane (Automa AI Chat)

### W1-AC-130: Right Pane Chat

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-130a | Right pane shows persona name header (dynamic from org config) | Open right pane; confirm persona name matches organization |
| W1-AC-130b | "AI Assistant" subtitle renders below persona name | Confirm subtitle text |
| W1-AC-130c | Chat interface supports send/receive with simulated responses | Type and send message; confirm response after typing animation |
| W1-AC-130d | Suggestion bubbles render when message count is low (<= 3) | Confirm suggestions visible initially |
| W1-AC-130e | Chat input has gradient border and plus button | Confirm input styling matches main chat |

---

## Wave 1 - Mock Data Integrity

### W1-AC-140: Mock Data

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-140a | Agents mock: 6 agents across sales (4), service (1), marketing (1) departments | Count agents by department; confirm distribution |
| W1-AC-140b | Conversations mock: 8 TeamBox conversations with varied channels and statuses | Count conversations; confirm variety |
| W1-AC-140c | Campaigns mock: 4 campaigns across sales (1), service (2), marketing (1) | Count campaigns by department; confirm distribution |
| W1-AC-140d | Users mock: 4 users with different roles | Count users; confirm role variety |
| W1-AC-140e | Organizations mock: 3 organizations with unique persona names | Count orgs; confirm persona names |
| W1-AC-140f | Agent department filtering returns correct subsets | Call getAgentsByDepartment('sales'); confirm 4 agents returned |
| W1-AC-140g | Campaign department filtering returns correct subsets | Call getCampaignsByDepartment('service'); confirm 2 campaigns returned |

---

## Wave 1 - Theme & Visual

### W1-AC-150: Theme

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-150a | Light mode renders with appropriate light backgrounds and dark text | Toggle to light; confirm colors |
| W1-AC-150b | Dark mode renders with appropriate dark backgrounds and light text | Toggle to dark; confirm colors |
| W1-AC-150c | Theme preference persists across page navigation | Toggle theme; navigate; confirm persisted |
| W1-AC-150d | All interactive elements have hover-elevate or equivalent hover states | Inspect buttons, cards; confirm hover interactions |
| W1-AC-150e | No hardcoded colors that break in dark mode | Toggle dark mode; visual scan for broken contrast |

### W1-AC-151: Responsive

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-151a | Mobile sidebar hidden; MobileNavDropdown or MobileSidebar available | Reduce viewport to mobile; confirm sidebar hidden |
| W1-AC-151b | Metric tile grids reflow from 4-column to 2-column to 1-column | Reduce viewport; confirm grid reflow |
| W1-AC-151c | TeamBox hides left filter panel below lg breakpoint | Reduce to < lg; confirm filter panel hidden |
| W1-AC-151d | TeamBox hides customer info panel below xl breakpoint | Reduce to < xl; confirm info panel hidden |
| W1-AC-151e | Mobile FAB (floating action button) for Automa appears on data-display pages | Reduce to mobile on /sales; confirm FAB visible |

---

## Wave 1 - Data Test IDs

### W1-AC-160: Test ID Coverage

| ID | Criterion | Test Method |
|---|---|---|
| W1-AC-160a | All interactive elements (buttons, inputs, links) have data-testid attributes | Grep for Button, Input, link elements; confirm data-testid present |
| W1-AC-160b | Dynamic elements use unique identifiers (e.g., metric-tile-0, conversation-item-tc-1) | Inspect dynamic lists; confirm unique test IDs |
| W1-AC-160c | Key display elements have data-testid (persona name, greeting, page titles) | Confirm data-testid on key display elements |

---

## Wave 2 - Data & Intelligence (Future)

### W2-AC-200: Backend API Integration

| ID | Criterion | Test Method |
|---|---|---|
| W2-AC-200a | Replace mock data with API calls using @tanstack/react-query | Confirm queryKey patterns used for data fetching |
| W2-AC-200b | Loading states show skeleton/spinner while queries are pending | Confirm isLoading states handled |
| W2-AC-200c | Error states display user-friendly messages | Simulate API error; confirm error UI |
| W2-AC-200d | Cache invalidation occurs after mutations | Perform mutation; confirm queryClient.invalidateQueries called |

### W2-AC-201: Real-Time Data

| ID | Criterion | Test Method |
|---|---|---|
| W2-AC-201a | TeamBox conversations update in real-time when new messages arrive | Send message; confirm conversation list updates |
| W2-AC-201b | Notification count updates without page refresh | Receive notification; confirm badge updates |
| W2-AC-201c | Agent status changes reflect immediately | Change agent status; confirm status dot updates |

### W2-AC-202: Insights & Analytics

| ID | Criterion | Test Method |
|---|---|---|
| W2-AC-202a | Sales Insights tab renders with real pipeline data | Navigate to Sales > Insights; confirm data from API |
| W2-AC-202b | Service Insights tab renders with campaign analytics | Navigate to Service > Insights; confirm data |
| W2-AC-202c | Marketing Insights tab renders with widget/landing page analytics | Navigate to Marketing > Insights; confirm data |
| W2-AC-202d | Management Insights tab renders aggregated cross-department metrics | Navigate to Management > Insights; confirm data |

---

## Wave 3 - Communication & Integration (Future)

### W3-AC-300: Campaign Execution

| ID | Criterion | Test Method |
|---|---|---|
| W3-AC-300a | Creating a campaign saves to backend and appears in campaign list | Create campaign; confirm it appears |
| W3-AC-300b | CSV upload processes recipient list and shows count | Upload CSV; confirm recipient count updates |
| W3-AC-300c | Kill switch immediately stops outbound messages for a campaign | Toggle kill switch; confirm no further messages sent |
| W3-AC-300d | Per-conversation disconnect prevents future campaign messages for that customer | Disconnect in TeamBox; confirm no further messages |
| W3-AC-300e | Global communication gate stops ALL automated outbound | Disable gate; confirm all campaigns paused |

### W3-AC-301: Live Agent Interactions

| ID | Criterion | Test Method |
|---|---|---|
| W3-AC-301a | "Take Over" from agent transfers conversation to human agent | Click Take Over; confirm conversation status changes to assigned |
| W3-AC-301b | Agent AI responses stop after takeover | Take over; confirm no further bot messages |
| W3-AC-301c | Agent can be re-engaged after human agent completes interaction | Re-enable agent; confirm bot responses resume |

### W3-AC-302: External Integrations

| ID | Criterion | Test Method |
|---|---|---|
| W3-AC-302a | VinSolutions CRM data syncs to pipeline metrics | Confirm CRM data reflected in Sales dashboard |
| W3-AC-302b | VAPI voice calls connect through widget | Initiate voice call; confirm connection |
| W3-AC-302c | Tavus video sessions launch through widget | Initiate video; confirm Tavus session |
| W3-AC-302d | TextMagic SMS sending works for campaigns | Send test SMS; confirm delivery |
| W3-AC-302e | Resend email delivery works for campaigns | Send test email; confirm delivery |

---

## Wave 4 - Polish & Advanced Features (Future)

### W4-AC-400: Marketing Studio

| ID | Criterion | Test Method |
|---|---|---|
| W4-AC-400a | Studio tab provides video creation tools | Navigate to Marketing > Studio; confirm creation tools |
| W4-AC-400b | Studio tab provides image generation tools | Confirm image tools available |
| W4-AC-400c | Studio tab provides landing page builder | Confirm landing page builder |

### W4-AC-401: Advanced Analytics

| ID | Criterion | Test Method |
|---|---|---|
| W4-AC-401a | ROI analysis calculates return across departments | Navigate to Management > ROI; confirm calculations |
| W4-AC-401b | Hunch generation uses ML models for pattern detection | Confirm hunches update based on real data patterns |
| W4-AC-401c | Predictive lead scoring integrates with pipeline view | Confirm lead scores visible in Sales dashboard |

### W4-AC-402: Accessibility & Performance

| ID | Criterion | Test Method |
|---|---|---|
| W4-AC-402a | All interactive elements are keyboard navigable | Tab through entire app; confirm focus management |
| W4-AC-402b | ARIA labels present on icon-only buttons | Inspect icon buttons; confirm aria-label or tooltip |
| W4-AC-402c | Page load time under 3 seconds on 3G connection | Lighthouse audit; confirm performance score |
| W4-AC-402d | No layout shifts during page navigation | Monitor CLS metric; confirm < 0.1 |

---

## Cross-Cutting Concerns

### CC-AC-500: Error Handling

| ID | Criterion | Test Method |
|---|---|---|
| CC-AC-500a | 404 page renders for unknown routes with appropriate messaging | Navigate to /nonexistent; confirm NotFound page |
| CC-AC-500b | Toast notifications appear for user actions (copy, save, delete) | Perform action; confirm toast appears |
| CC-AC-500c | Form validation errors display before submission | Submit invalid form; confirm error messages |

### CC-AC-501: State Management

| ID | Criterion | Test Method |
|---|---|---|
| CC-AC-501a | AppContext provides all required state values | Inspect context value; confirm all fields present |
| CC-AC-501b | Role changes immediately update all role-gated UI | Change role; confirm sidebar, settings, metric tiles update |
| CC-AC-501c | Organization switching updates persona name and branding | Switch org; confirm persona name changes |
| CC-AC-501d | Selected agent persists across navigation within session | Select agent; navigate away; return; confirm selection persisted |

### CC-AC-502: No Console Errors

| ID | Criterion | Test Method |
|---|---|---|
| CC-AC-502a | No JavaScript errors in console during normal navigation | Open console; navigate all pages; confirm no errors |
| CC-AC-502b | No React key warnings in lists | Check console; confirm no key warnings |
| CC-AC-502c | No broken imports or missing module errors | Check console; confirm no import errors |
| CC-AC-502d | No hydration mismatches | Check console; confirm no hydration errors |
