# Visual Analysis -- nexxus2.2_replit Screenshots

**Date:** 2026-03-27
**Method:** Screenshot capture + independent human-eye description
**Perspectives:** org_admin (Serra Honda / SHA) + super_admin (Duane K. Wells / DKW / Huminic)
**Total Screenshots:** 35
**Tool:** Playwright MCP browser automation

---

## Critical Behavioral Finding: Auto-Tour System

During screenshot capture, an aggressive auto-tour system was observed that programmatically navigated the browser through every major page in sequence. This tour:
- Fires on login and cycles through: AI Chat, TeamBox, Sales, Service, Marketing, Manage, Settings, Usage, Profile, Insights, Management
- Uses React Router internal navigation (not history.pushState), making it difficult to intercept
- Auto-switched the logged-in org/user context from Serra Honda to Huminic/DKW during the tour cycle
- Required `addInitScript` with localStorage flags AND pushState blocking to suppress
- Tour localStorage keys follow pattern: `nexxus_tour_dismissed_<page>` (e.g., `nexxus_tour_dismissed_sales`)

---

## Screenshot: 01-login-page.png
**Page:** /login
**What I see:**
- Full-screen background with animated dark gradient featuring flowing red-to-magenta wave patterns
- Centered login card (dark semi-transparent background, rounded corners)
- "Nexxus" heading in large white glowing text, "Customer portal" subtitle below
- Two form fields: "Email Address" (pre-filled with serra_honda@huminic.ai) and "Password" (placeholder text)
- Blue gradient "Sign in" button spanning full card width
- "Forgot password?" link below the button
- "By huminic" credit text at bottom of card
- No logo image, just text branding
**Element count:** ~6 interactive elements (2 text inputs, 1 button, 1 link, background)

---

## Screenshot: 25-orgadmin-ai-chat.png
**Page:** / (AI Chat home, org_admin perspective)
**What I see:**
- **Header bar:** "Nexxus Connect (TM)" left, "Serra Honda" org selector center with dropdown arrow, right side has globe icon, bell icon, red badge "50", lightning bolt icon, dark mode toggle, "SHA" user avatar circle
- **Left sidebar:** Narrow icon sidebar with labels: AI Chat (active, highlighted blue), TeamBox, Sales, Service, Marketing, Manage. At bottom: System (gear icon), Logout
- **Main content area:** "AI KEY METRICS" section header in small caps
- Four colored metric cards in a row:
  - Green card: "Active Pipeline" = 108, "live" indicator
  - Blue card: "Appointment..." (truncated) = 0, "live" indicator
  - Orange card: "Open Escalat..." (truncated) = 8, "live" indicator with red trendline
  - Purple card: "Outbound Se..." (truncated) = 9, "live" indicator
- Large empty white space below metrics (chat area)
- "Try asking..." prompt with sparkle icon, followed by 4 suggestion pill buttons:
  - "Give me a dealership performance overview"
  - "What are the top escalations right now?"
  - "What hunches need my attention?"
  - "How are we tracking against targets?"
- Bottom input bar: "+" button, text input "Ask me anything about your business", send arrow button (disabled)
- **Anomaly:** Metric card labels are truncated -- "Appointment...", "Open Escalat...", "Outbound Se..." -- cards are too narrow for their text
**Element count:** ~15 interactive elements visible

---

## Screenshot: 02-ai-chat-main.png (Huminic/super_admin perspective)
**Page:** / (AI Chat, super_admin)
**What I see:**
- Same layout as org_admin but org shows "Huminic" and user avatar shows "DKW"
- All 4 metric cards show 0 values (Active Pipeline: 0, Appointments: 0, Open Escalations: 0, Outbound: 0)
- Badge shows "40" instead of "50"
- Same suggestion pills and chat input
- **Difference from org_admin:** All metrics are zero, indicating Huminic parent org has no direct pipeline data
**Element count:** ~15

---

## Screenshot: 29-orgadmin-teambox.png
**Page:** /teambox (org_admin)
**What I see:**
- **Header:** "TeamBox" title in left panel
- **Left panel (sub-sidebar):** Two sections at top: "Conversations" tab (active) and "Phone" / "Video" tabs
- Channel filter pills below: Chat (highlighted), WhatsApp, Voice
- Search bar: "Search conversations..."
- Channels panel: SMS (badge 8), Email, Phone (badge 28), Video, plus Tasks
- **Center panel:** Contact list showing "All" with count badge "207" (or similar), scrollable list of contacts:
  - "Test Customer" (multiple entries with TC initials circle)
  - "Serra Honda Admin" (SHA circle)
  - "James Chen" (JC circle)
  - "Vanessa Torres" (VT circle)
  - Each contact has a chat icon indicator
- **Right panel - Chat area:** Selected contact "Test Customer" with "CHAT" badge, shows "No messages yet" in center
- **Right panel - Customer Info sidebar:**
  - Name: Test Customer
  - Channel: CHAT (blue badge)
  - Status: Open (green badge)
  - Assign to: "Unassigned" dropdown
  - Quick Actions: Call, Email, SMS buttons
- **Bottom:** "Write a reply..." text input with send button
**Element count:** ~25+ interactive elements (channel buttons, contact items, quick actions, input fields)

---

## Screenshot: 03-teambox-main.png (Huminic/super_admin perspective)
**Page:** /teambox (super_admin)
**What I see:**
- Same TeamBox layout but org is "Huminic"
- Contact list shows: System Admin (selected, blue highlight), Duane K. Wells, Duane K. Wells (duplicate), E2E Test Customer
- Far fewer conversations than org_admin view
- Customer Info panel shows "System Admin" with SYSTEM channel badge
- **Difference:** Super_admin sees system-level conversations, org_admin sees customer conversations

---

## Screenshot: 26-orgadmin-sales.png (05-sales-dashboard.png identical)
**Page:** /sales (org_admin)
**What I see:**
- **Title:** "Sales" with sub-tabs: Dashboard (active, underlined), Agents, Insights, Calendar
- **Subtitle:** "Sales Dashboard - Real-time sales pipeline and performance metrics"
- **Top right:** "Warehouse" badge (green) + "Synced 21h ago"
- **7 metric cards** in two rows:
  - Row 1: Total Leads (30d): 570, New Leads: 9, Active Pipeline: 108, Waiting on Response: 78
  - Row 2: Appointments Set: 0, Sold: 20, Conversion Rate: 3.5%
  - Each card has an icon, "0% vs last 30d" trend indicator with a trendline icon
- **Bottom section - two panels:**
  - Left: "Top Performing Agents" numbered list:
    1. Caroline (voice) - green dot
    2. Data Guru (chat) - green dot
    3. Sales Coach (chat) - green dot
    4. Communication Writer (chat) - green dot
  - Right: "Recent Activity" log:
    - Escalation Email Sent (~17h ago)
    - Campaign Resumed (~17h ago)
    - Campaign Created, Vapi Call Received, SMS Inbound Received, etc.
- **Right edge:** Collapse sidebar icon (<<)
**Element count:** ~20+ interactive elements

---

## Screenshot: 08-sales-agents.png
**Page:** /sales (Agents tab)
**What I see:**
- **Title:** "Sales" with "Agents" tab active (blue underline)
- **Subtitle:** "Sales Agents"
- **4 agent cards** in a grid (3 + 1):
  - "Caroline" - voice, robot avatar icon, gear icon, green dot, blue border (selected), "active" green badge. Description: "Serra Honda AI Sales Agent. Handles inbound leads, appointment scheduling, and customer follow-ups."
  - "Data Guru" - chat, same layout, "active" badge. Description: "VIN Solutions CRM data expert..."
  - "Sales Coach" - chat, "active" badge. Description: "Sales coaching, objection handling, follow-up strategies."
  - "Communication Writer" - chat, "active" badge. Description: "Professional email/SMS drafts, follow-up templates..."
- Each card has a gear settings icon and a green online dot
- Cards have rounded borders with subtle shadow
**Element count:** ~12 interactive elements

---

## Screenshot: 10-manage-insights.png
**Page:** /management > Insights tab (org_admin, Serra Honda)
**What I see:**
- **Title:** "Management" with tabs: Insights (active), Hunches, System Log, User Chats, Billing
- **Sub-tabs:** Dashboard (active), Reports, Library, Hunches
- **Red section: "Immediate Action Required"** (red dot) - "Last updated: 8:45 AM"
  - Hot Leads Going Cold: 20 (red warning, "Leads aging 14-21 days without close")
  - New Leads Without Contact: 9 (orange, "No contact in over 48 hours")
  - Showroom Visitors Not Closed: 0 (green, "Open over 7 days")
- **Yellow section: "Watch List"** (yellow dot)
  - Stale Leads (>7 days): 360, "Avg Age: 14 days", CSV download button
  - Pending Finance: 0, "0 deals over 5 days old"
- **Green section: "Today's Performance"** (green dot)
  - Pipeline Active: 214 (with trend arrow)
  - Conversion Rate: 3.5%
  - Total Leads: 570
- **Pipeline Health section:**
  - Active Pipeline: 570 "leads in play"
  - Freshness Score: N/A (red) "38% under 7 days"
  - Hot Leads: 214, "38% of active"
  - Month-End Forecast: 20, "-30 vs target (50)" (red text)
- **Performance Scorecard section:** visible at bottom cut-off
**Element count:** ~25+ interactive elements

---

## Screenshot: 27-orgadmin-service.png (11-service-campaigns.png similar)
**Page:** /service (org_admin)
**What I see:**
- **Title:** "Service" with tabs: Campaigns (active), Agents, Insights, Calendar
- **Header:** "Service Campaigns" with "Upload CSV" button and blue "New Campaign" button
- **Yellow warning banner:** "Campaign Safety" message about monitoring and outbound messages
- **Table with columns:** Campaign, Status, Channel, Recipients, Sent, Replied, Kill Switch, Actions
- **Campaign rows visible:**
  - LC-2 Autonomous Test (Active, SMS, 2 recipients, kill switch red/off)
  - Service Reminder - February (Paused, SMS, 14 recipients, 1 sent, 1 replied, kill switch red/off)
  - E2E-FLOW3-... (Completed, SMS, 2 recipients, kill switch blue/on)
  - E2E-FLOW5-KillSwitch-... (Completed, SMS, 0 recipients)
  - E2E-FLOW6-Resume-... (Completed, SMS, 0 recipients)
  - LC-2 Autonomous Test (Active, SMS, 2 recipients) -- duplicate name
  - More E2E test campaigns
  - Oil Change Reminder (Paused, SMS, 234 recipients, kill switch red/off)
- **Actions column:** play, calendar, eye, download icons per row
- Kill switches are toggle sliders, red=off, blue=on
**Element count:** ~50+ interactive elements (buttons, toggles, table rows)

---

## Screenshot: 28-orgadmin-marketing.png (12-marketing.png identical layout)
**Page:** /marketing (org_admin)
**What I see:**
- **Title:** "Marketing" with tabs: Dashboard (active), Agents, Studio, Insights
- **Subtitle:** "Marketing Dashboard - Campaign performance and lead generation metrics"
- **4 metric cards:**
  - Campaign Performance: 0%
  - Campaigns Active: 0
  - Messages Sent: 0
  - Replies Received: 0
- All values are zero -- no marketing activity
- Large empty white space below the cards
- No charts, no campaign list, no activity feed
- **Anomaly:** Page is very sparse with all zeros. Significant empty space suggests content areas that are not populated.
**Element count:** ~8 interactive elements

---

## Screenshot: 30-orgadmin-management.png
**Page:** /management (org_admin)
**What I see:**
- Same as 10-manage-insights.png but captured fresh
- Management page with Insights/Hunches/System Log/User Chats/Billing tabs
- Shows real data: Hot Leads Going Cold: 20, Stale Leads: 360, Pipeline Active: 214
- Performance metrics: Conversion Rate 3.5%, Total Leads: 570
- Pipeline Health visible with Active Pipeline: 570, Freshness Score: N/A
**Element count:** ~25+

---

## Screenshot: 31-orgadmin-settings.png
**Page:** /settings (org_admin)
**What I see:**
- **Title:** "System Settings" with subtitle "Configure your organization and application settings"
- **6 settings tiles** in a 3x2 grid:
  1. User Management - "Manage users, roles, and permissions" (peach/warm background)
  2. Organization - "Company profile and branding" (blue background)
  3. Tools & Integrations - "Configure tools, widgets, and landing pages" (green background)
  4. Knowledge Base - "Upload and manage AI training data" (yellow/warm background)
  5. Notifications - "Alert preferences and delivery channels" (light blue)
  6. Appearance - "Theme, layout, and display preferences" (mint green)
- Each tile has an icon on the left and decorative circular gradient on the right
- Tiles are large, well-spaced cards
**Element count:** ~8 interactive elements (6 tiles + sidebar items)

---

## Screenshot: 07-system-settings.png (super_admin / Huminic perspective)
**Page:** /settings (super_admin)
**What I see:**
- Same "System Settings" layout but with **7 tiles** instead of 6:
  1. User Management
  2. Organization
  3. Tools & Integrations
  4. Knowledge Base
  5. **AI Configuration** - "Mailboxes, agents, and AI behavior settings" (EXTRA tile not in org_admin view)
  6. Notifications
  7. Appearance
- **Key role difference:** Super_admin has an additional "AI Configuration" tile that org_admin does not see
**Element count:** ~9 interactive elements

---

## Screenshot: 32-orgadmin-profile.png
**Page:** /profile (org_admin)
**What I see:**
- **Title:** "Profile" with subtitle "Manage your account and preferences"
- **Two tabs:** My Profile (active), Preferences
- **Profile section:**
  - Large circular avatar with "SHA" initials (blue)
  - "Serra Honda Admin"
  - Email: serra_honda@huminic.ai
  - Green "Organization Admin" role badge
  - "Serra Honda" org tag with building icon
  - "Edit Profile" link
- **Contact Information section:**
  - Email field (pre-filled): serra_honda@huminic.ai
  - Phone field: +1 (555) 123-4567
  - Green "Save Changes" button
- **Change Password section:**
  - Current Password field (empty)
  - New Password field (empty, "Minimum 8 characters" hint)
  - Confirm New Password field (empty)
**Element count:** ~10 interactive elements

---

## Screenshot: 14-profile.png (super_admin / DKW perspective)
**Page:** /profile (super_admin)
**What I see:**
- Same layout as org_admin profile
- Avatar shows "DKW" initials
- Name: "Duane K. Wells"
- Email: duane.wells@huminic.ai
- Role badge: "Super Admin" (green)
- Org: Huminic
- **Key difference:** Role badge shows "Super Admin" vs "Organization Admin"
**Element count:** ~10

---

## Screenshot: 15-usage.png (super_admin)
**Page:** /usage
**What I see:**
- **Title:** "Usage" with chart icon, "This Month" dropdown filter
- **3 summary cards:**
  - Total Events: 45
  - Event Types: 3
  - Organizations: 7 (with calendar icon -- note: this field is "Period: Current Month" in some views)
- **Usage by Type section:**
  - SMS Failed: 25 (blue/purple bar, longest)
  - SMS Sent: 19 (blue bar, medium)
  - SMS Blocked: 1 (tiny blue bar)
- **Usage by Organization section:**
  - Serra Nissan: 0 events
  - Tony Serra Ford: 0 events
  - Hyundai of Columbia: 0 events
  - Ford of Columbia: (cut off at bottom)
- **Anomaly:** SMS Failed (25) exceeds SMS Sent (19). More messages failing than succeeding.
- **Note:** Usage page shows cross-org data, suggesting it is a super_admin-only or aggregate view
**Element count:** ~8 interactive elements

---

## Screenshot: 22-management.png (Huminic/super_admin)
**Page:** /management (super_admin)
**What I see:**
- Same Management layout as org_admin but with Huminic context
- All Immediate Action Required values show 0 (Hot Leads Going Cold: 0, New Leads Without Contact: 0, Showroom Visitors Not Closed: 0)
- Watch List: Stale Leads: 0, Pending Finance: 0
- Today's Performance: Pipeline Active: 0, Conversion Rate: 0%, Total Leads: 0
- Pipeline Health: Active Pipeline: 0, Freshness Score: N/A (100% under 7 days), Hot Leads: 0, Month-End Forecast: 0 (-50 vs target)
- Yellow info banner at top about connecting CRM
- **All Stores** dropdown visible in top right
**Element count:** ~25+

---

## Screenshot: 23-insights.png (super_admin)
**Page:** /insights
**What I see:**
- **Title:** "Insights" with subtitle "Analytics, reports, and AI-generated intelligence"
- **Tabs:** Dashboard (active), Reports, Library, Hunches
- **"All Stores" dropdown** top right
- Yellow banner about connecting CRM
- Same card layout as Management > Insights (Immediate Action Required, Watch List, Today's Performance, Pipeline Health)
- All values zero in super_admin context
- **Note:** This appears to be a standalone /insights route that is similar but separate from /management > Insights tab
**Element count:** ~25+

---

## Screenshot: 06-tour-overlay-1of6.png
**Page:** /manage (with tour overlay)
**What I see:**
- **Tour overlay dialog box** in top-left corner:
  - Title: "Dashboard & AI Chat"
  - Description: "Your home base. View key metrics, quick actions, and chat with your AI assistant to get answers instantly."
  - "1 of 6" progress indicator
  - "Skip" text link and blue "Next >" button
  - X close button top right
- **Behind the overlay:** Left sidebar is highlighted/focused (AI Chat highlighted)
- **Background page shows:** 404 Page Not Found error with "Go to Home" blue button
- The tour overlay appears over a broken /manage route
- **Anomaly:** The background page shows 404 while the tour overlay is pointing to the AI Chat sidebar item. Tour runs regardless of page load success.
**Element count:** ~4 interactive in overlay (Next, Skip, X close, Go to Home behind)

---

## Screenshot: 13-manage.png
**Page:** /manage
**What I see:**
- Full 404 "Page Not Found" error page
- Error icon (red circle with exclamation)
- "404 Page Not Found" heading
- "The page you're looking for doesn't exist or has been moved."
- Blue "Go to Home" button
- Standard sidebar visible on left
- Org shows "Huminic" -- this is the super_admin view
- **ANOMALY:** /manage is a dead route. The sidebar shows "Manage" as a nav item, but navigating to /manage returns 404. The actual Management page lives at /management.
**Element count:** ~2 interactive elements on the error page

---

## Screenshot: 16-settings-users.png through 21-settings-appearance.png
**Pages:** /settings/users, /settings/organization, /settings/tools, /settings/knowledge, /settings/notifications, /settings/appearance
**What I see across ALL 6:**
- Every single settings sub-route shows the same 404 "Page Not Found" error
- Standard sidebar visible, "Huminic" org, DKW user
- **ANOMALY:** Settings sub-pages are NOT accessible via direct URL routing. The /settings main page shows 6 clickable tiles, but none of those tiles map to URL-routable paths. They likely use client-side modal/panel navigation rather than URL routing.
**Element count:** ~2 each

---

## Screenshot: 24-calendar.png
**Page:** /calendar
**What I see:**
- 404 "Page Not Found" error
- Same layout as other 404 pages
- **ANOMALY:** /calendar is not a valid top-level route. Calendar is accessible as a tab within Sales and Service sections only.
**Element count:** ~2

---

## Screenshot: 04-teambox-sms.png
**Page:** / (redirected from TeamBox SMS click)
**What I see:**
- Shows AI Chat main view instead of TeamBox SMS
- AI KEY METRICS cards all showing 0 values
- "Try asking..." section with suggestion pills
- Chat input at bottom
- **ANOMALY:** Clicking the SMS channel button in TeamBox redirected back to the AI Chat home page instead of filtering TeamBox to SMS conversations. This may be a navigation bug or the tour system interfering.
**Element count:** ~15

---

## Screenshot: 09-sales-insights.png (captured during tour interference)
**Page:** /settings/organization (redirected)
**What I see:**
- 404 Page Not Found error
- Tour system had redirected away from the intended Sales Insights page
**Element count:** ~2

---

## Summary of Anomalies Found

### Navigation / Routing Issues
1. **/manage returns 404** -- sidebar shows "Manage" but the route is /management
2. **/calendar returns 404** -- not a top-level route
3. **All /settings/* sub-routes return 404** -- /settings/users, /settings/organization, /settings/tools, /settings/knowledge, /settings/notifications, /settings/appearance all fail
4. **Tour auto-navigation** -- aggressive tour system cycles through all pages and switches org context

### Visual/Layout Issues
5. **Metric card text truncation** -- AI Key Metrics cards truncate labels: "Appointment...", "Open Escalat...", "Outbound Se..."
6. **Marketing page very sparse** -- all zeros, large empty space, no charts or content areas
7. **SMS Failed > SMS Sent** in Usage -- 25 failed vs 19 sent, concerning ratio

### Role Differences Confirmed
8. **Settings tiles:** org_admin sees 6 tiles, super_admin sees 7 (extra "AI Configuration")
9. **TeamBox contacts:** org_admin sees customer conversations (207 items), super_admin sees system conversations (4 items)
10. **Metric values:** org_admin/Serra Honda has real data (pipeline: 108, leads: 570), super_admin/Huminic shows zeros
11. **Profile badges:** "Organization Admin" vs "Super Admin"
12. **Usage page:** Shows cross-org data with 7 organizations listed (super_admin feature)

### Pages Confirmed Working
- / (AI Chat home)
- /sales (with Dashboard, Agents, Insights, Calendar tabs)
- /service (with Campaigns, Agents, Insights, Calendar tabs)
- /marketing (with Dashboard, Agents, Studio, Insights tabs)
- /teambox (with Conversations, Phone, Video tabs and channel filters)
- /management (with Insights, Hunches, System Log, User Chats, Billing tabs)
- /insights (standalone insights page)
- /settings (tile grid only -- sub-routes fail)
- /profile (with My Profile, Preferences tabs)
- /usage (usage analytics)

### Pages Confirmed Broken
- /manage (404)
- /calendar (404)
- /settings/users (404)
- /settings/organization (404)
- /settings/tools (404)
- /settings/knowledge (404)
- /settings/notifications (404)
- /settings/appearance (404)
