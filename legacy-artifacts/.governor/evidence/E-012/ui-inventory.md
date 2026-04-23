# Nexxus Connect -- Live UI Inventory Report

**Date:** 2026-03-25
**URL:** https://dev.huminicdev.com
**Account:** duane.wells@huminic.ai (Super Admin)
**Default Org:** Tony Serra Ford
**Password used:** NexxusTest2026 (from SEED_DEFAULT_PASSWORD in .env)

---

## 1. Login Experience

| Item | Detail |
|------|--------|
| URL | /login |
| Page title | Nexxus Connect |
| Heading | "Nexxus" with subtitle "Customer portal" |
| Fields | Email Address (textbox), Password (textbox) |
| Buttons | "Sign in" (disabled until both fields filled), "Forgot password?" link (/forgot-password) |
| Footer | "By huminic" |
| Behavior | Sign in button enables after both fields populated. Invalid credentials show red alert "Invalid email or password". Successful login redirects to / (dashboard). |
| First-time tour | 6-step guided tour overlay appears on first visit to each page. "Skip" and "Next" buttons. Reappears on every page navigation (possible bug -- tour state not persisting across pages). |

### Forgot Password Page (/forgot-password)
- Heading: "Reset your password"
- Field: Email Address
- Button: "Send reset instructions" (disabled until email entered)
- Link: "Back to login" -> /login

### 404 Page
- Custom 404 with icon, heading "404 Page Not Found", description, and "Go to Home" button.

---

## 2. Navigation Map

### Top Bar (Banner)
| Element | Type | Description |
|---------|------|-------------|
| "Nexxus Connect(TM)" | Brand text | Left side, static |
| Org Switcher | Button/dropdown | Shows current org name + chevron. Opens menu with "Switch Organization" header and list of all orgs |
| Globe icon | Button | Purpose unclear (possibly language/locale) |
| Bell + badge "24" | Button/dropdown | Notification center. Shows notification count, "Mark all read" button, scrollable list of notifications |
| Activity icon | Button | Purpose unclear (possibly activity feed) |
| Dark mode toggle | Button | Moon/sun icon (theme toggle) |
| "DKW" avatar | Button/dropdown | Profile menu: name, email, role, My Profile, Preferences, Billing, Take a Tour, Log out |
| Collapse icon | Button | Right edge, collapses/expands sidebar or panel |

### Left Sidebar (Primary Navigation)
| Nav Item | URL | Sub-navigation |
|----------|-----|----------------|
| Sidebar collapse | -- | Toggle button at top |
| AI Chat | / | Dashboard (home page) |
| TeamBox | /teambox | Conversations, Phone, Video tabs + channel sidebar (SMS, Email, Phone, Video, Tasks) |
| My Work | /my-work | Dashboard, Tasks, Chat, Assistant tabs + sidebar (Dashboard, Tasks, Chat) |
| Sales | /sales | Dashboard, Agents, Insights, Calendar tabs + agent sidebar |
| Service | /service | Campaigns, Agents, Insights, Calendar tabs + agent sidebar |
| Marketing | /marketing | Dashboard, Agents, Studio, Insights tabs + AI agent sidebar + agent sidebar |
| Manage | /management | Insights, Hunches, System Log, User Chats, Billing tabs + sidebar (Dashboard, Insights, System Log, User Chats) |
| System | /settings/system | Settings grid: User Management, Organization, Tools & Integrations, Knowledge Base, AI Configuration, Notifications, Appearance, Billing |
| Logout | -- | Logs out, redirects to /login |

### Available Organizations (via org switcher)
1. Serra Nissan
2. Tony Serra Ford (default for this account)
3. Hyundai of Columbia
4. Ford of Columbia
5. Huminic
6. Cage Automotive
7. Serra Honda

### Profile Menu Routes
| Menu Item | Route | Status |
|-----------|-------|--------|
| My Profile | /profile | Working |
| Preferences | /preferences | 404 (not implemented) |
| Billing | (unknown) | Not tested from menu |
| Take a Tour | -- | Restarts guided tour |
| Log out | /login | Working |

---

## 3. Page-by-Page Inventory

### 3.1 Dashboard / AI Chat (URL: /)

| Element | Type | Data Present | Interactive |
|---------|------|-------------|-------------|
| "AI Key Metrics" heading | H2 | Yes | No |
| Active Pipeline card | Metric tile | 64 (Tony Serra Ford) / 119 (Serra Honda) | Clickable |
| Appointments Today card | Metric tile | 0 / 1 | Clickable |
| Open Escalations card | Metric tile | 0 / 3 | Clickable |
| Outbound Sent 24h card | Metric tile | 0 / 0 | Clickable |
| "live" indicators | Badge | All show "live" with wave icon | No |
| "Try asking..." prompt | Suggestion area | 4 suggestion buttons | Yes -- clickable |
| AI chat input | Textbox | Placeholder: "Ask me anything about your business" | Yes |
| Attachment button | Button | Left of input | Yes |
| Send button | Button | Right of input (disabled when empty) | Yes (when text present) |
| "Discuss with Georgia" | FAB | Bottom-right on some pages | Yes |

**Evidence:** Data changes per org (Tony Serra Ford: Pipeline 64, Serra Honda: Pipeline 119). Metric tiles have gradient backgrounds and icons.

### 3.2 TeamBox (URL: /teambox)

**Main tabs:** Conversations | Phone | Video

#### Conversations Tab
| Element | Type | Data Present | Interactive |
|---------|------|-------------|-------------|
| Channel filters | Button group | All, SMS, Email, Web Chat, WhatsApp, Voice | Yes -- clickable |
| "All" filter with count | Badge | 6 conversations | Yes |
| Conversation list | List items | 6 items: Durran Cage, Test Customer, Duane K. Wells (x3), plus items with agent names (Nancy Gaston, Sales Coach, Data Guru) | Yes -- clickable |
| Conversation detail | Panel | Shows avatar, name, channel badge (AI-CHAT, etc.), message area, reply textbox | Yes |
| Reply input | Textbox | "Write a reply..." placeholder | Yes |
| Send button | Button | Disabled when empty | Yes |

**Secondary sidebar (left of main content):**
- Channel buttons: SMS, Email, Phone, Video
- Tasks button

#### Phone Tab
| Element | Type | Data Present | Interactive |
|---------|------|-------------|-------------|
| "VAPI Call Logs" heading | H2 | Yes | No |
| Call logs table | Table | ~20 rows of real call data | Rows clickable |
| Columns | Headers | Date, Caller Number, Assistant (UUID), Duration, Status | Sortable (unknown) |
| Transcript buttons | Button | Present on rows with duration > 0 | Yes -- clickable |
| Status badges | Badge | All show "ended" | No |

**Issues:** Caller Number column shows "-" for all entries (no phone numbers populated). Assistant column shows raw UUIDs instead of names. Some rows have missing date/duration data.

#### Video Tab
| Element | Type | Data Present | Interactive |
|---------|------|-------------|-------------|
| "Tavus Video Sessions" | H2 | No data | No |
| Empty state | Text | "No video sessions found" | No |

### 3.3 My Work (URL: /my-work)

**Main tabs:** Dashboard | Tasks | Chat | Assistant

#### Dashboard Tab
| Element | Type | Data Present | Interactive |
|---------|------|-------------|-------------|
| Greeting | H2 | "Good morning, Duane" | No |
| Subtitle | Text | "Here's your day at a glance" | No |
| Tasks Due Today | Metric card | 0 | No |
| Overdue Items | Metric card | 0 | No |
| Active Tasks | Metric card | 0 | No |
| Completed | Metric card | 0 | No |
| Upcoming Tasks | Section | "No upcoming tasks" | No |

#### Tasks Tab
| Element | Type | Data Present | Interactive |
|---------|------|-------------|-------------|
| "My Tasks" heading | H2 | No tasks | No |
| "Add Task" button | Button | Yes | Yes |
| Empty state | Text | "No tasks yet. Click 'Add Task' to create one." | No |

#### Chat Tab
| Element | Type | Data Present | Interactive |
|---------|------|-------------|-------------|
| "Recent Conversations" | H2 | Yes | No |
| Customer Conversations | List | 5 items (3x Duane K. Wells AGENT-CHAT, 1x Durran Cage AI-CHAT, 1x Test Customer CHAT) | Yes -- clickable |
| AI Chat History | Section | Empty with placeholder text | No |
| "View All in TeamBox" | Button | Yes | Yes |

#### Assistant Tab
| Element | Type | Data Present | Interactive |
|---------|------|-------------|-------------|
| "Personal Assistant" | H3 | Yes | No |
| Description | Text | "Your personal AI assistant powered by Georgia" | No |
| "Launch Assistant" | Button | Yes | Yes |

### 3.4 Sales (URL: /sales)

**Main tabs:** Dashboard | Agents | Insights | Calendar
**Secondary sidebar:** Agent list with search (Georgia, Data Guru, Sales Coach, Communication Writer)

#### Dashboard Tab
| Element | Type | Data Present | Interactive |
|---------|------|-------------|-------------|
| "Sales Dashboard" heading | H2 | Yes | No |
| "Warehouse" sync indicator | Badge | "Synced 5d ago" | No |
| Total Leads (30d) | Metric card | 345, 0% vs last 30d | Clickable |
| New Leads | Metric card | 1, 0% vs last 30d | Clickable |
| Active Pipeline | Metric card | 64, 0% vs last 30d | Clickable |
| Waiting on Response | Metric card | 54, 0% vs last 30d | Clickable |
| Appointments Set | Metric card | 0, 0% vs last 30d | Clickable |
| Sold | Metric card | 18, 0% vs last 30d | Clickable |
| Conversion Rate | Metric card | 5.2%, +5.2% vs last 30d | Clickable |
| Top Performing Agents | Ranked list | 4 agents: Georgia (voice), Data Guru (chat), Sales Coach (chat), Communication Writer (chat) | No |
| Recent Activity | Feed | 5 items with timestamps | No |

#### Agents Tab
| Element | Type | Data Present | Interactive |
|---------|------|-------------|-------------|
| "Sales Agents" heading | H2 | Yes | No |
| Georgia card | Agent card | voice, active, description | Clickable, has menu button |
| Data Guru card | Agent card | chat, active, description | Clickable, has menu button |
| Sales Coach card | Agent card | chat, active, description | Clickable, has menu button |
| Communication Writer card | Agent card | chat, active, description | Clickable, has menu button |

#### Insights Tab
| Element | Type | Data Present | Interactive |
|---------|------|-------------|-------------|
| Immediate Action Required | Section | Last updated: 8:45 AM | No |
| Hot Leads Going Cold | Alert card | 20, "Leads aging 14-21 days without close" | Clickable |
| New Leads Without Contact | Alert card | 1, "No contact in over 48 hours" | Clickable |
| Showroom Visitors Not Closed | Alert card | 0, "Open over 7 days" | Clickable |
| Watch List | Section | -- | No |
| Stale Leads (>7 days) | Watch card | 0, "Avg Age: 14 days", CSV export button | Clickable |
| Pending Finance | Watch card | 0, "0 deals over 5 days old" | Clickable |
| Today's Performance | Section | Pipeline Active 133, Conversion Rate 5.2%, Total Leads 345 | Clickable cards |
| Pipeline Health | Section | Active Pipeline 345, Freshness Score N/A (39% under 7 days), Hot Leads 133 (39%), Month-End Forecast 18 (-32 vs target 50) | View Details button |
| Performance Scorecard | Section | Win Rate 5.2%, Total Sold 18, Hot Leads 133, Total Leads 345 | View Details button |
| Leads This Week chart | SVG chart | Bar chart Mon-Sun | No |
| Conversions by Day chart | SVG chart | Bar chart Mon-Sun | No |

#### Calendar Tab
| Element | Type | Data Present | Interactive |
|---------|------|-------------|-------------|
| Month header | H2 | "March 2026" | Nav arrows |
| "Sync Sources" button | Button | Yes | Yes |
| "New Appointment" button | Button | Yes | Yes |
| Calendar grid | Grid | 31 days, Sun-Sat layout, all days clickable | Yes |
| Appointments | Events | None visible | -- |

### 3.5 Service (URL: /service)

**Main tabs:** Campaigns | Agents | Insights | Calendar
**Secondary sidebar:** Agent list with search (Nancy Gaston)

#### Campaigns Tab
| Element | Type | Data Present | Interactive |
|---------|------|-------------|-------------|
| "Service Campaigns" heading | H2 | Yes | No |
| "Upload CSV" button | Button | Yes | Yes |
| "New Campaign" button | Button | Yes | Yes |
| Campaign table | Table | 1 row | Clickable rows |
| Table columns | Headers | Campaign, Status, Channel, Recipients, Sent, Replied, Kill Switch, Actions | -- |
| "test campaign" row | Table row | Draft, EMAIL, 0/0/0, Kill Switch ON | Click, toggle, action buttons |
| Kill Switch toggle | Switch | Checked/ON | Yes |
| Action buttons | Buttons | "Execute now" (disabled), "Schedule for later" (disabled), "Dry run" (disabled), menu button | Partially interactive |
| Campaign Safety notice | Info box | Description of Kill Switch functionality | No |

#### Agents Tab
| Element | Type | Data Present | Interactive |
|---------|------|-------------|-------------|
| "Service Agents" heading | H2 | Yes | No |
| Nancy Gaston card | Agent card | chat type, description about service campaigns | Clickable, menu button |

### 3.6 Marketing (URL: /marketing)

**Main tabs:** Dashboard | Agents | Studio | Insights
**Secondary sidebar:** AI Agents section (Photo Studio, Video Producer, Copywriter, Creative Director, Market Intel) + Agents section with search (same 5 agents)

#### Dashboard Tab
| Element | Type | Data Present | Interactive |
|---------|------|-------------|-------------|
| "Marketing Dashboard" heading | H2 | Yes | No |
| Campaign Performance | Metric card | 0% | Clickable |
| Campaigns Active | Metric card | 0 | Clickable |
| Messages Sent | Metric card | 0 | Clickable |
| Replies Received | Metric card | 0 | Clickable |

#### Studio Tab
| Element | Type | Data Present | Interactive |
|---------|------|-------------|-------------|
| Filter buttons | Button group | All, Images, Videos, Copy, Scores, Voiceovers, Radar | Yes |
| Empty state | Placeholder | "No artifacts yet" with instruction to start agent conversations | No |

### 3.7 Management (URL: /management)

**Main tabs:** Insights | Hunches | System Log | User Chats | Billing
**Secondary sidebar:** Dashboard, Insights, System Log, User Chats

#### Insights/Dashboard Tab
Same content as Sales > Insights (Immediate Action Required, Watch List, Today's Performance, Pipeline Health, Performance Scorecard, Charts).

#### Hunches Tab
| Element | Type | Data Present | Interactive |
|---------|------|-------------|-------------|
| "AI Hunches" heading | H2 | Yes | No |
| "Generate Hunches" button | Button | Yes | Yes |
| Hunch cards | Cards | 5 hunches displayed | Yes |
| Hunch 1 | Card | "Leverage CRM Guru for Chat-Based Campaign Execution" -- recommendation, 80% confidence, new | Accept/Dismiss |
| Hunch 2 | Card | "Zero Campaigns Running -- No Proactive Outreach" -- alert, 90% confidence, new | Accept/Dismiss |
| Hunch 3 | Card | "Activate Voice & Video Agents to Handle Open Leads" -- recommendation, 78% confidence, new | Accept/Dismiss |
| Hunch 4 | Card | "AI Chat Is the Sole Active Communication Channel" -- pattern, 85% confidence, new | Accept/Dismiss |
| Hunch 5 | Card | "100% Open Conversation Rate Signals Resolution Gap" -- alert, 72% confidence, new | Accept/Dismiss |

Each hunch shows: icon, title, type badge (recommendation/alert/pattern), confidence %, status badge (new), detailed description paragraph, department tag, Accept and Dismiss buttons.

#### System Log Tab
| Element | Type | Data Present | Interactive |
|---------|------|-------------|-------------|
| "System Log" heading | H2 | Yes | No |
| Activity entries | Feed | ~10 entries | No |
| Entry types | Badges | user, campaign, agent, sync | No |
| Entries include | Log data | "login failed" (5 min ago), "Created campaign 'test campaign'" (1 day), "Updated agent 'Nancy Gaston'" (1 day), "sync metrics refreshed" (2 days), multiple "sync backfill completed" (5-6 days) | No |

#### User Chats Tab
| Element | Type | Data Present | Interactive |
|---------|------|-------------|-------------|
| "User Chats" heading | H3 | Yes | No |
| Status | Placeholder | "coming soon" | No |
| Description | Text | "View and filter chat conversations by user across all departments and agents" | No |

#### Billing Tab
| Element | Type | Data Present | Interactive |
|---------|------|-------------|-------------|
| "Billing Not Configured" | H2 | Yes | No |
| Status | Placeholder | "Contact your administrator" | No |

### 3.8 System Settings (URL: /settings/system)

**Layout:** Grid of setting cards, each navigates to a sub-page with Back button. Has "Menu" dropdown and "Add to favorites" star button.

#### Settings Cards Grid
| Card | Sub-page | Status |
|------|----------|--------|
| User Management | User list with Add/Invite/New Org buttons, search | Working, 2 users visible |
| Organization | Org name, AI Persona Name, Business Phone/Email, Public Listing toggle, Business Hours config, Communication Gate, Channel Controls | Working, fully populated |
| Tools & Integrations | 8 sub-tabs: MCP, API, Other, Universal, Widgets, Pages, API Keys, Webhooks | Working, Widgets has 4 items |
| Knowledge Base | 4 sub-tabs: Documents, Web Pages, Databases, Settings | Working, Documents empty |
| AI Configuration | 3 sub-tabs: System Prompt, Agent Behavior, Hunches | Working, Claude model selected |
| Notifications | Alert preferences | Not explored in detail |
| Appearance | Theme and display settings | Not explored in detail |

#### User Management Details
- Add User button, Invite User button, New Organization button
- Search users textbox
- 2 users listed: Duane K. Wells (Super Admin), Tony Serra Ford Admin (Organization Admin)
- Each user has a menu/edit button

#### Organization Settings Details
- Organization Name: "Tony Serra Ford" (textbox)
- AI Persona Name: "Georgia" (textbox)
- Business Phone: empty (textbox)
- Business Email: empty (textbox)
- Public Listing: toggle (ON)
- Save Changes button
- Business Hours: Timezone (America/New_York), Start (07), End (22), After-Hours Auto-Response (template with placeholders)
- Communication Gate: Master switch (ON), description of functionality
- Channel Controls: SMS/TextMagic (ON), Email/Resend (ON), Phone/VAPI (ON), Video/Tavus (ON)
- Rate Limit: 3 per 24h per recipient
- TextMagic Phone Number: empty

#### Tools & Integrations > Widgets
4 widgets configured:
1. Text Chat Widget (widget_txt_a1b2c3, active, 2/15/2026)
2. Live Video Widget (widget_vid_d4e5f6, active, 2/10/2026)
3. Voice Call Widget (widget_vox_g7h8i9, active, 2/12/2026)
4. Unified Widget (widget_uni_j0k1l2, active, 2/18/2026)

Each has: embed code with copy button, status badge, "View test page" button, edit button.

#### AI Configuration > System Prompt
- AI Model dropdown: "Claude (Anthropic)" selected
- System Prompt textbox (empty)
- Chat Quality Instructions textbox (empty)
- Save button

### 3.9 Profile (URL: /profile)

| Element | Type | Data Present | Interactive |
|---------|------|-------------|-------------|
| "Profile" heading | H1 | Yes | No |
| Avatar | Circle | "DKW" initials, camera overlay for photo upload | Yes |
| Name | H2 | "Duane K. Wells" | No |
| Email | Text | duane.wells@huminic.ai | No |
| Role badge | Badge | "Super Admin" with icon | No |
| Org badge | Badge | "Tony Serra Ford" with icon | No |
| "Edit Profile" button | Button | Yes | Yes |
| "Menu" dropdown | Button | Yes | Yes |
| "Add to favorites" star | Button | Yes | Yes |
| Contact Information | Section | -- | -- |
| Email field | Textbox | duane.wells@huminic.ai | Yes |
| Phone field | Textbox | +1 (555) 123-4567 | Yes |
| "Save Changes" button | Button | Yes | Yes |
| Change Password section | Section | -- | -- |
| Current Password | Textbox | Empty | Yes |
| New Password | Textbox | Empty, placeholder "Minimum 6 characters" | Yes |
| Confirm New Password | Textbox | Empty | Yes |
| "Change Password" button | Button | Disabled until fields filled | Yes |

---

## 4. Issues Found

### Functional Issues

| # | Severity | Page | Issue |
|---|----------|------|-------|
| 1 | Medium | All pages | **Tour overlay re-appears on every page navigation.** After clicking "Skip", navigating to any new page triggers the tour again from step "1 of 6". Tour completion state does not persist. |
| 2 | Low | /preferences | **Preferences route returns 404.** Profile menu has "Preferences" option but /preferences is not implemented. |
| 3 | Low | /teambox (Phone) | **Caller Number column shows "-" for all entries.** No phone numbers displayed in the VAPI Call Logs table. |
| 4 | Low | /teambox (Phone) | **Assistant column shows raw UUIDs** instead of human-readable agent names (e.g., "f499e129-759c-4303-a31e-f354e2d1ac6b" instead of "Georgia"). |
| 5 | Low | /teambox (Phone) | **Some call log rows have missing date and duration data** (showing "-" for both). |
| 6 | Info | /service | **Campaign action buttons disabled for draft campaigns.** "Execute now", "Schedule for later", "Dry run" all disabled. May be intentional for draft state. |
| 7 | Info | /management (Billing) | **Billing not configured** -- placeholder state. |
| 8 | Info | /management (User Chats) | **User Chats "coming soon"** -- not implemented yet. |
| 9 | Medium | Org switch | **Console errors on org switch.** 5 "Query error: Failed to fetch" errors when switching to Serra Honda, plus 404 error for a conversation endpoint. Data loads eventually but indicates API timing issues. |
| 10 | Low | /settings/system (Org) | **Business Phone and Email fields empty.** Not populated for Tony Serra Ford. |
| 11 | Low | /settings/system (Org) | **TextMagic Phone Number field empty.** Required for inbound SMS routing but not configured. |
| 12 | Info | /sales (Dashboard) | **All "vs last 30d" comparisons show 0%.** Suggests either no historical data or comparison logic issue. |
| 13 | Info | /marketing | **All marketing metrics at 0.** No campaigns or messages sent. |
| 14 | Low | Login page | **Console error on initial load:** "Failed to load resource: 500" on /api/auth/refresh -- expected for unauthenticated state but should be handled silently. |

### UI/UX Observations

| # | Observation |
|---|-------------|
| 1 | Sidebar collapses to icons only, preserving navigation access. Works well. |
| 2 | Dark mode toggle present in header (moon icon) -- not tested but visible. |
| 3 | "Discuss with Georgia" floating action button appears on Sales, Service, Marketing, Management pages. |
| 4 | "Add to favorites" star and "Menu" dropdown appear on Profile and System Settings pages -- consistent pattern. |
| 5 | Secondary sidebar panels on Sales, Service, Marketing show agent lists with search and unread message counts. |
| 6 | Org switcher checkmark correctly indicates current org. |
| 7 | Notification panel is well-structured with real notification data, timestamps, and type indicators. |

---

## 5. Summary Counts

| Metric | Count |
|--------|-------|
| Total unique URLs visited | 10 (/login, /forgot-password, /, /teambox, /my-work, /sales, /service, /marketing, /management, /settings/system, /profile, /preferences) |
| Total primary nav items | 8 (AI Chat, TeamBox, My Work, Sales, Service, Marketing, Manage, System) |
| Total tabs across all pages | ~30+ |
| Total settings sub-pages | 7 (User Mgmt, Org, Tools, KB, AI Config, Notifications, Appearance) |
| Total metric cards/tiles | ~25 |
| Total agents configured | 10 (Sales: 4, Service: 1, Marketing: 5) |
| Total organizations | 7 |
| Total users visible | 2 |
| Total widgets configured | 4 |
| Total notifications | 24 |
| Total issues found | 14 (2 Medium, 5 Low, 4 Info, 3 UI observations) |
| Total interactive elements cataloged | ~150+ (buttons, inputs, toggles, dropdowns, clickable cards) |
| Screenshots captured | 10 |

---

## 6. Org-Specific Data Comparison

| Metric | Tony Serra Ford | Serra Honda |
|--------|----------------|-------------|
| Active Pipeline | 64 | 119 |
| Appointments Today | 0 | 1 |
| Open Escalations | 0 | 3 |
| Outbound Sent 24h | 0 | 0 |

Data confirmed to change per org context. Sales dashboard metrics also org-specific.

---

## 7. Screenshots Index

All screenshots saved to: `/home/ubuntu/Claude-store/triad-governor-v2/assessments/nexxus-screenshots/`

| File | Content |
|------|---------|
| 01-dashboard.png | AI Chat dashboard with 4 metric tiles |
| 02-teambox.png | TeamBox conversations list |
| 03-mywork.png | My Work dashboard with greeting and task metrics |
| 04-sales.png | Sales dashboard with 7 metric cards |
| 05-sales-insights.png | Sales Insights full page with action items |
| 06-service.png | Service campaigns table |
| 07-marketing.png | Marketing dashboard with 4 metric cards |
| 08-system-settings.png | System Settings grid of 7 cards |
| 09-org-settings.png | Organization settings form |
| 10-serra-honda-dashboard.png | Dashboard after org switch to Serra Honda |
