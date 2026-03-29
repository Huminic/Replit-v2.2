# UI State Enumeration -- nexxus2.2_replit

**Date:** 2026-03-27
**Method:** Code analysis of route definitions, page components, and conditional rendering
**Perspectives:** org_admin (Serra Honda), super_admin (DKW/Huminic)
**Source files:** App.tsx (routes), all pages/*.tsx, key components

---

## Global / Cross-Cutting States

### ErrorBoundary (App.tsx line 109)
- ST-001: ErrorBoundary error caught -- fallback UI displayed (roles: all)

### ProtectedRoute (components/auth/ProtectedRoute.tsx)
- ST-002: Auth loading spinner -- checking authentication (roles: all)
- ST-003: Redirect to /login -- user not authenticated (roles: all)
- ST-004: Redirect to / -- user lacks required role level (roles: insufficient role)

### SessionTimeoutDialog (components/auth/SessionTimeoutDialog.tsx)
- ST-005: Session timeout warning dialog -- countdown visible (roles: all authenticated)

### ProductTour (components/ProductTour.tsx)
- ST-006: Product tour overlay -- step-by-step walkthrough active (roles: all authenticated)

### EntitlementGate (components/EntitlementGate.tsx)
- ST-007: Feature allowed -- children rendered normally (roles: all)
- ST-008: Feature blocked -- "Upgrade to unlock" CTA shown (roles: users without entitlement)

### Toast notifications
- ST-009: Success toast displayed (roles: all)
- ST-010: Error/destructive toast displayed (roles: all)

---

## Route: /login (LoginPage)

### States:
- ST-011: Auth loading -- full screen black with spinner (roles: unauthenticated)
- ST-012: Login form -- email/password fields, random wallpaper background (roles: unauthenticated)
- ST-013: Login form with session expired alert -- amber warning banner (roles: unauthenticated, after timeout)
- ST-014: Login form with error alert -- red destructive banner (roles: unauthenticated, bad credentials)
- ST-015: Login submitting -- button shows spinner "Signing in..." (roles: unauthenticated)

---

## Route: /forgot-password (ForgotPasswordPage)

### States:
- ST-016: Forgot password form -- email input, wallpaper background (roles: unauthenticated)
- ST-017: Forgot password submitting -- spinner "Sending..." (roles: unauthenticated)
- ST-018: Forgot password error -- red alert with error message (roles: unauthenticated)
- ST-019: Forgot password success -- green checkmark, "Check your email" message (roles: unauthenticated)

---

## Route: /reset-password (ResetPasswordPage)

### States:
- ST-020: Reset password form -- new password + confirm fields, strength indicator, countdown timer (roles: unauthenticated, valid token)
- ST-021: Reset password -- validation error alert (roles: unauthenticated)
- ST-022: Reset password -- API error alert (roles: unauthenticated)
- ST-023: Reset password submitting -- spinner "Updating password..." (roles: unauthenticated)
- ST-024: Reset password success -- green checkmark, "Password updated" with sign-in button (roles: unauthenticated)
- ST-025: Invalid/missing token -- red XCircle, "Invalid reset link" (roles: unauthenticated)
- ST-026: Token expired -- red Clock icon, "Reset link expired" with request new link button (roles: unauthenticated)

---

## Route: /w/:slug and /p/:slug (WidgetLandingPage -- public)

### States:
- ST-027: Landing page loading -- spinner (roles: public)
- ST-028: Landing page not found -- "Page Not Found" message (roles: public)
- ST-029: Landing page loaded -- dealership info + widget closed (roles: public)
- ST-030: Widget menu open -- chat/video/voice/form options (roles: public)
- ST-031: Widget chat mode -- text conversation with AI persona (roles: public)
- ST-032: Widget chat loading -- waiting for AI response (roles: public)
- ST-033: Widget video mode -- video call interface (roles: public)
- ST-034: Widget video connecting -- spinner "Connecting to [persona]..." (roles: public)
- ST-035: Widget video connected -- "Video opened in new window" message (roles: public)
- ST-036: Widget video error -- connection failed message (roles: public)
- ST-037: Widget voice mode -- voice call with VAPI (roles: public)
- ST-038: Widget voice connecting (roles: public)
- ST-039: Widget voice connected -- volume indicator (roles: public)
- ST-040: Widget voice ended (roles: public)
- ST-041: Widget voice error (roles: public)
- ST-042: Widget form mode -- name/email/phone/message form (roles: public)
- ST-043: Widget form submitting (roles: public)
- ST-044: Widget form submitted -- success confirmation (roles: public)
- ST-045: Fullscreen video mode (query ?mode=video) -- full page video session (roles: public)
- ST-046: Landing page lead form -- first/last/phone/email/interest (roles: public)
- ST-047: Landing page lead form submitting (roles: public)
- ST-048: Landing page lead form submitted -- success message (roles: public)
- ST-049: Widget callback request form (roles: public)
- ST-050: Widget callback submitting (roles: public)
- ST-051: Widget callback success (roles: public)
- ST-052: Widget callback error (roles: public)

---

## Route: / (MainPage -- AI Chat)

### States:
- ST-053: Main page initial -- pipeline metric tiles visible, no messages (roles: all authenticated)
- ST-054: Main page with chat history -- metric tiles collapsed, messages displayed (roles: all authenticated)
- ST-055: Chat message -- user bubble (right-aligned, bg-primary) (roles: all authenticated)
- ST-056: Chat message -- assistant bubble (left-aligned, bg-card) with markdown (roles: all authenticated)
- ST-057: Chat streaming -- wave-dot typing animation (3 dots) (roles: all authenticated)
- ST-058: Chat streaming with content -- partial response rendering (roles: all authenticated)
- ST-059: Chat streaming with status message -- globe icon + status text (roles: all authenticated)
- ST-060: Chat stream error -- red destructive banner with retry button (roles: all authenticated)
- ST-061: ThinkingCard collapsed -- brain icon + summary line (roles: all authenticated)
- ST-062: ThinkingCard expanded -- detailed reasoning steps (roles: all authenticated)
- ST-063: Metric tile -- Active Pipeline (roles: all authenticated)
- ST-064: Metric tile -- Appointments Today (roles: all authenticated)
- ST-065: Metric tile -- Open Escalations (roles: all authenticated)
- ST-066: Metric tile -- Outbound Sent 24h (roles: all authenticated)
- ST-067: Metric detail dialog -- loading records (roles: all authenticated)
- ST-068: Metric detail dialog -- error loading records (roles: all authenticated)
- ST-069: Metric detail dialog -- no records found (roles: all authenticated)
- ST-070: Metric detail dialog -- Active Pipeline table with lead rows (roles: all authenticated)
- ST-071: Metric detail dialog -- Appointments Today table (roles: all authenticated)
- ST-072: Metric detail dialog -- Open Escalations list (roles: all authenticated)
- ST-073: Metric detail dialog -- Outbound Sent 24h list (roles: all authenticated)
- ST-074: Contact detail view -- loading from CRM (roles: all authenticated)
- ST-075: Contact detail view -- contact info displayed (name, phone, email, location, vehicle) (roles: all authenticated)
- ST-076: Contact detail view -- CRM error fallback (roles: all authenticated)
- ST-077: Contact detail view -- no contact info available (roles: all authenticated)
- ST-078: Suggestion chips displayed (roles: all authenticated)

---

## Route: /teambox (TeamboxPage)

### Tab: Conversations (activeView === 'conversations')
- ST-079: Conversation list loading -- skeleton placeholders (roles: all authenticated)
- ST-080: Conversation list populated -- 4-column inbox layout (roles: all authenticated)
- ST-081: Conversation list empty -- no conversations match filters (roles: all authenticated)
- ST-082: Conversation selected -- chat thread with messages (roles: all authenticated)
- ST-083: Messages loading -- skeleton placeholders in thread area (roles: all authenticated)
- ST-084: Conversation reply input -- textarea with send button (roles: all authenticated)
- ST-085: Conversation automated -- "Take Over" button visible (roles: all authenticated)
- ST-086: Campaign disconnect button -- available for campaign conversations (roles: all authenticated)
- ST-087: Campaign disconnected badge -- shown when already disconnected (roles: all authenticated)
- ST-088: Customer info panel (column 4) -- name, phone, email, quick actions (roles: all authenticated)
- ST-089: Status filter sidebar -- all/open/assigned/participating/automated/scheduled/followup/pending with counts (roles: all authenticated)
- ST-090: Channel filter chips -- all/SMS/Email/Web Chat/WhatsApp/Voice (roles: all authenticated)
- ST-091: Voice call transcript modal -- transcript text + optional audio URL (roles: all authenticated)
- ST-092: Assign conversation dropdown -- team member selection (roles: all authenticated)

### Tab: Conversations -- Task View (viewMode === 'tasks')
- ST-093: Task list view -- filtered by type (all/tasks/escalations/unsent messages) (roles: all authenticated)
- ST-094: Task list loading -- skeleton (roles: all authenticated)
- ST-095: Task list empty -- no tasks match filter (roles: all authenticated)
- ST-096: Task selected -- detail panel with status update buttons (roles: all authenticated)
- ST-097: Task type filter sidebar -- All Items/Tasks/Escalations/Unsent Messages with counts (roles: all authenticated)

### Tab: Phone (activeView === 'phone')
- ST-098: VAPI call logs loading -- spinner (roles: all authenticated)
- ST-099: VAPI call logs empty -- "No call logs found" (roles: all authenticated)
- ST-100: VAPI call logs populated -- call history list (roles: all authenticated)

### Tab: Video (activeView === 'video')
- ST-101: Tavus video conversations loading -- spinner (roles: all authenticated)
- ST-102: Tavus video conversations empty -- "No video conversations found" (roles: all authenticated)
- ST-103: Tavus video conversations populated -- session list (roles: all authenticated)

---

## Route: /my-work (MyWorkPage)

### Tab: Dashboard
- ST-104: Dashboard -- greeting, KPI cards (tasks due today, overdue, active, completed) (roles: all authenticated)
- ST-105: Dashboard loading -- skeleton placeholders (roles: all authenticated)
- ST-106: Dashboard upcoming tasks list populated (roles: all authenticated)
- ST-107: Dashboard upcoming tasks empty -- "No upcoming tasks" (roles: all authenticated)

### Tab: Tasks
- ST-108: Tasks list populated -- task rows with status/priority/due date (roles: all authenticated)
- ST-109: Tasks list loading -- skeleton (roles: all authenticated)
- ST-110: Tasks list empty -- "No tasks yet. Click Add Task to create one." (roles: all authenticated)
- ST-111: Create task dialog -- title/description/priority/status/due date form (roles: all authenticated)
- ST-112: Edit task dialog -- pre-filled form with existing task data (roles: all authenticated)
- ST-113: Task dialog submitting -- spinner on submit button (roles: all authenticated)

### Tab: Chat
- ST-114: Recent conversations list populated (roles: all authenticated)
- ST-115: Recent conversations loading -- skeleton (roles: all authenticated)
- ST-116: Recent conversations empty -- "No active conversations" (roles: all authenticated)
- ST-117: AI chat history empty -- bot icon "Your AI assistant conversations will appear here" (roles: all authenticated)

### Tab: Assistant
- ST-118: Personal assistant placeholder -- icon + description + "Launch Assistant" button (roles: all authenticated)

---

## Route: /sales (SalesPage)

### Tab: Dashboard
- ST-119: Sales dashboard -- 7 metric tiles (Total Leads, New Leads, Active Pipeline, Waiting on Response, Appointments Set, Sold, Conversion Rate) (roles: sales, sales_manager, org_admin, executive, partner_admin, super_admin)
- ST-120: Sales dashboard loading -- metrics show 0 or placeholder (roles: same as above)
- ST-121: Sales metric tile click -- detail dialog with breakdown (roles: same as above)
- ST-122: Sales metric detail -- Active Pipeline table with contact view drill-down (roles: same as above)
- ST-123: Sales metric detail -- Appointments table (roles: same as above)
- ST-124: Sales metric detail -- generic value/change/period display (non-drillable metrics) (roles: same as above)
- ST-125: Sales metric detail loading -- "Loading records..." (roles: same as above)
- ST-126: Sales metric detail error -- "Failed to load records" (roles: same as above)
- ST-127: Sales metric detail empty -- "No records found" (roles: same as above)
- ST-128: Sales contact detail view -- loaded from CRM (roles: same as above)
- ST-129: Sales contact detail view -- loading spinner (roles: same as above)
- ST-130: Top performing agents section (roles: same as above)
- ST-131: Recent activity feed populated (roles: same as above)
- ST-132: Recent activity feed loading -- skeleton (roles: same as above)
- ST-133: Recent activity feed empty (roles: same as above)
- ST-134: VIN sync status indicator (roles: same as above)

### Tab: Agents
- ST-135: Sales agent cards -- department-filtered agent list (roles: same as above)
- ST-136: Sales agent cards loading -- skeleton (roles: same as above)
- ST-137: Sales agent cards empty -- no agents in sales department (roles: same as above)
- ST-138: Agent card click -- opens AgentConfigPane in right pane (roles: same as above)

### Tab: Insights
- ST-139: Sales insights -- embedded InsightsPage (roles: same as above)

### Tab: Calendar
- ST-140: Sales calendar -- AppointmentCalendar component (roles: same as above)

---

## Route: /service (ServicePage)

### Tab: Campaigns
- ST-141: Campaign table populated -- rows with name/status/channel/recipients/sent/replied/kill switch (roles: service, org_admin, executive, partner_admin, super_admin)
- ST-142: Campaign table loading -- skeleton (roles: same as above)
- ST-143: Campaign table empty -- no campaigns (roles: same as above)
- ST-144: Communications paused badge -- global comm gate OFF (roles: same as above)
- ST-145: Campaign safety card -- dismissible info card about kill switch (roles: same as above)
- ST-146: Campaign safety card dismissed (roles: same as above)
- ST-147: Kill switch toggled ON for campaign -- row shows stopped state (roles: same as above)
- ST-148: Campaign detail dialog -- clicked row shows campaign info (roles: same as above)
- ST-149: New campaign dialog -- name/channel/template form (roles: same as above)
- ST-150: New campaign creating -- mutation pending (roles: same as above)
- ST-151: CSV upload dialog/trigger for campaign (roles: same as above)
- ST-152: CSV upload success -- recipient count + optional warnings (roles: same as above)
- ST-153: CSV upload error -- missing columns or parse failure (roles: same as above)

### Tab: Agents
- ST-154: Service agent cards -- department-filtered list (roles: same as above)
- ST-155: Service agent cards loading -- skeleton (roles: same as above)
- ST-156: Service agent cards empty (roles: same as above)

### Tab: Insights
- ST-157: Service insights -- metric tiles (Active Campaigns, Messages Sent, Replies Received, Open Conversations, Total Conversations, Reply Rate) + embedded InsightsPage (roles: same as above)
- ST-158: Service metric tile click -- detail dialog (roles: same as above)

### Tab: Calendar
- ST-159: Service calendar -- AppointmentCalendar component (roles: same as above)

---

## Route: /marketing (MarketingPage)

### Tab: Dashboard
- ST-160: Marketing dashboard -- 4 metric tiles (Campaign Performance, Campaigns Active, Messages Sent, Replies Received) (roles: marketing, org_admin, executive, partner_admin, super_admin)
- ST-161: Marketing dashboard loading -- metrics show 0 (roles: same as above)
- ST-162: Marketing metric detail dialog -- clicked tile shows breakdown (roles: same as above)

### Tab: Agents
- ST-163: Marketing agent cards -- 5 agents (Photo Studio, Video Producer, Ad Copywriter, Score Card, Competitor Radar) (roles: same as above)

### Tab: Studio
- ST-164: Creative studio -- gallery with filter pills (All/Images/Videos/Copy/Scores/Voiceovers/Radar) (roles: same as above)
- ST-165: Studio filter selected -- gallery filtered by category (roles: same as above)

### Tab: Insights
- ST-166: Marketing insights -- embedded InsightsPage (roles: same as above)

### Agent Chat View (activeAgentId set)
- ST-167: Marketing agent chat -- full AgentChatView with message thread (roles: same as above)
- ST-168: Marketing agent chat -- session list sidebar (roles: same as above)
- ST-169: Marketing agent chat -- artifact preview (image/video/copy/score/radar) (roles: same as above)
- ST-170: Marketing agent chat -- tool execution in progress (roles: same as above)
- ST-171: Marketing agent chat -- artifact full-screen dialog (roles: same as above)
- ST-172: Marketing agent chat -- sharing panel for artifact (roles: same as above)

---

## Route: /management (ManagementPage)

### RBAC Guard:
- ST-173: Management redirect -- non-management roles redirected to / (roles: sales, service, marketing staff)

### Tab: Insights
- ST-174: Management insights -- embedded InsightsPage (roles: org_admin, executive, sales_manager, partner_admin, super_admin)

### Tab: Hunches
- ST-175: Hunches loading -- skeleton cards (roles: same as above)
- ST-176: Hunches populated -- cards with title/type/confidence/status (roles: same as above)
- ST-177: Hunches empty -- lightbulb icon, "No hunches yet" + Generate button (roles: same as above)
- ST-178: Hunch status: new -- Accept/Dismiss buttons visible (roles: same as above)
- ST-179: Hunch status: accepted -- Resolve button visible (roles: same as above)
- ST-180: Hunch status: dismissed -- badge shown (roles: same as above)
- ST-181: Hunch status: resolved -- badge shown (roles: same as above)
- ST-182: Hunches generating -- spinner on Generate button (roles: same as above)

### Tab: System Log (Activities)
- ST-183: Activity log loading -- skeleton (roles: same as above)
- ST-184: Activity log populated -- timeline with icon/description/timestamp/entity badge (roles: same as above)
- ST-185: Activity log empty -- "No activity recorded yet" (roles: same as above)

### Tab: User Chats
- ST-186: User chats placeholder -- "User chat activity -- coming soon" (roles: same as above)

### Tab: Billing
- ST-187: Billing tab -- embedded BillingDashboard component (roles: same as above)

---

## Route: /agents (AgentsPage)

### States:
- ST-188: No agent selected -- empty state with "Select an Agent" + Create button (roles: all authenticated)
- ST-189: No agent selected -- Create button blocked by EntitlementGate (roles: users without agent_slots entitlement)
- ST-190: Agent selected -- header with avatar/name/status/description/timestamps (roles: all authenticated)
- ST-191: Agent chat -- message thread with user and assistant bubbles (roles: all authenticated)
- ST-192: Agent chat streaming -- wave-dot animation or partial content (roles: all authenticated)
- ST-193: Agent chat streaming with status -- globe icon + status text (roles: all authenticated)
- ST-194: Agent chat stream error -- destructive banner with retry button (roles: all authenticated)
- ST-195: Agent suggestion chips -- 4 pre-built prompts (roles: all authenticated)
- ST-196: Agent streaming -- stop button (square icon, destructive) (roles: all authenticated)
- ST-197: Agent dropdown menu open -- Edit Agent / Delete Agent options (roles: all authenticated)
- ST-198: Delete agent confirmation dialog -- AlertDialog with cancel/delete (roles: all authenticated)
- ST-199: Create agent dialog -- name/department/description form (roles: all authenticated)
- ST-200: Create agent submitting -- "Creating..." button text (roles: all authenticated)

---

## Route: /insights (InsightsPage)

### Tab: Dashboard
- ST-201: Insights dashboard loading -- skeleton (roles: all authenticated)
- ST-202: Red zone -- Hot Leads Going Cold card (clickable) (roles: all authenticated)
- ST-203: Red zone -- New Leads Without Contact card (clickable) (roles: all authenticated)
- ST-204: Red zone -- Showroom Visitors Not Closed card (clickable) (roles: all authenticated)
- ST-205: Yellow zone -- Stale Leads card (clickable) (roles: all authenticated)
- ST-206: Yellow zone -- Pending Finance card (clickable) (roles: all authenticated)
- ST-207: Green zone -- Pipeline health scorecard (clickable) (roles: all authenticated)
- ST-208: Drill-down dialog: Hot Leads -- detail rows (roles: all authenticated)
- ST-209: Drill-down dialog: New Leads -- detail rows (roles: all authenticated)
- ST-210: Drill-down dialog: Showroom -- detail rows (roles: all authenticated)
- ST-211: Drill-down dialog: Stale Leads (roles: all authenticated)
- ST-212: Drill-down dialog: Pending Finance (roles: all authenticated)
- ST-213: Drill-down dialog: Pipeline Health (roles: all authenticated)
- ST-214: Drill-down dialog: Scorecard Detail (roles: all authenticated)
- ST-215: Drill-down dialog: Green Zone Detail (roles: all authenticated)
- ST-216: Leads trend AreaChart (roles: all authenticated)
- ST-217: Conversions BarChart (roles: all authenticated)
- ST-218: Store/org selector dropdown (roles: super_admin, partner_admin)

### Tab: Reports
- ST-219: Reports -- Loss Analysis category selected (roles: all authenticated)
- ST-220: Reports -- Channel Performance category selected (roles: all authenticated)
- ST-221: Reports -- Trend Analysis category selected (roles: all authenticated)
- ST-222: Reports sub-tab 1 within selected category (roles: all authenticated)
- ST-223: Reports sub-tab 2 within selected category (roles: all authenticated)
- ST-224: Reports sub-tab 3 within selected category (roles: all authenticated)
- ST-225: Reports loading -- skeleton (roles: all authenticated)
- ST-226: Reports data tables and charts rendered (roles: all authenticated)

### Tab: Library
- ST-227: Library grid view -- metric tiles in grid layout (roles: all authenticated)
- ST-228: Library list view -- metric tiles in list layout (roles: all authenticated)
- ST-229: Library category filter -- All/Pipeline/Conversion/Response/Lead Source/Channel/Composite/Forecast (roles: all authenticated)
- ST-230: Library search active -- filtered results (roles: all authenticated)
- ST-231: Library metric selected -- detail dialog with drill-down rows + AI insight (roles: all authenticated)
- ST-232: Library metric detail loading (roles: all authenticated)
- ST-233: Library lookback days selector (roles: all authenticated)
- ST-234: Library loading -- skeleton (roles: all authenticated)

### Tab: Hunches
- ST-235: Hunches list -- opportunity/threat/insight cards with confidence scores (roles: all authenticated)
- ST-236: Hunches preferences sheet -- notification channels, default view, min confidence slider, auto-dismiss (roles: all authenticated)
- ST-237: Hunches empty state (roles: all authenticated)

---

## Route: /settings and /settings/system (SettingsPage)

### Tile Grid (no section selected)
- ST-238: Settings tile grid -- 7 tiles visible based on role (roles: varies per tile minRole)
- ST-239: Settings tile: User Management (roles: super_admin, partner_admin, org_admin)
- ST-240: Settings tile: Organization (roles: super_admin, partner_admin, org_admin)
- ST-241: Settings tile: Tools & Integrations (roles: super_admin, partner_admin, org_admin)
- ST-242: Settings tile: Knowledge Base (roles: super_admin, partner_admin, org_admin)
- ST-243: Settings tile: AI Configuration (roles: super_admin, partner_admin)
- ST-244: Settings tile: Notifications (roles: super_admin, partner_admin, org_admin)
- ST-245: Settings tile: Appearance (roles: super_admin, partner_admin, org_admin)

### Section: User Management (activeSection === 'users')
- ST-246: User list populated -- table with name/email/role/status (roles: super_admin, partner_admin, org_admin)
- ST-247: User list loading -- skeleton (roles: same as above)
- ST-248: User list with search filter active (roles: same as above)
- ST-249: Add user dialog -- first/last/email/password/role form (roles: same as above)
- ST-250: Add user submitting (roles: same as above)
- ST-251: Edit user dialog -- first/last/role/active form (roles: same as above)
- ST-252: Edit user submitting (roles: same as above)
- ST-253: Reset password dialog -- new password field (roles: same as above)
- ST-254: Change password dialog -- current/new/confirm fields (roles: same as above)
- ST-255: Invite user dialog -- first/last/email/role form (roles: same as above)
- ST-256: Invite user submitting (roles: same as above)
- ST-257: User dropdown menu -- Edit/Reset Password/Deactivate options (roles: same as above)

### Section: Organization (activeSection === 'organization')
- ST-258: Organization settings form -- name, persona name, phone, email, public listing (roles: super_admin, partner_admin, org_admin)
- ST-259: Business hours & after-hours messaging form -- timezone, start/end hours, auto-response template (roles: same as above)
- ST-260: Communication gate -- active (green border, "Communications Active") (roles: same as above)
- ST-261: Communication gate -- paused (red border, warning banner) (roles: same as above)
- ST-262: Server kill switch active banner -- amber warning (roles: same as above, when global kill switch OFF)
- ST-263: Channel controls -- SMS/Email/Phone/Video toggles (roles: same as above)
- ST-264: Rate limit input (roles: same as above)
- ST-265: TextMagic phone number input (roles: same as above)

### Section: Tools & Integrations (activeSection === 'tools')
- ST-266: Tools tab: MCP -- tool cards with enable/disable toggles (roles: super_admin, partner_admin, org_admin)
- ST-267: Tools tab: Widgets -- individual widget list with status/type/impressions (roles: same as above)
- ST-268: Tools tab: Widget search active (roles: same as above)
- ST-269: Widget selected -- config dialog with settings/appearance/targeting/embed tabs (roles: same as above)
- ST-270: Widget config tab: Settings -- name, description, status, allowed domains (roles: same as above)
- ST-271: Widget config tab: Appearance -- colors, position, animation, labels (roles: same as above)
- ST-272: Widget config tab: Targeting -- audience, pages, devices, delay, scroll depth, exit intent (roles: same as above)
- ST-273: Widget config tab: Embed Code -- copyable embed snippet (roles: same as above)
- ST-274: Widget embed code copied -- check icon flash (roles: same as above)
- ST-275: Widget preview modal (roles: same as above)
- ST-276: Tools tab: Landing Pages -- landing page list (roles: same as above)
- ST-277: Landing page selected -- detail view (roles: same as above)
- ST-278: Tools tab: Universal Settings -- channel toggles for all widgets (roles: same as above)
- ST-279: Tools tab: Skills -- available AI skills list (roles: same as above)
- ST-280: VIN Lead Config section -- default sales rep dropdown (roles: same as above)
- ST-281: VIN Lead Config -- loading VIN users (roles: same as above)
- ST-282: CRM provisioning -- dealer ID/name input for VIN Solutions setup (roles: super_admin, partner_admin)

### Section: Knowledge Base (activeSection === 'knowledge')
- ST-283: Knowledge base -- document list with name/type/size/status (roles: super_admin, partner_admin, org_admin)
- ST-284: Knowledge base loading (roles: same as above)
- ST-285: Knowledge base empty -- no documents uploaded (roles: same as above)
- ST-286: Knowledge base file upload -- drag/drop or file picker (roles: same as above)
- ST-287: Knowledge base upload in progress (roles: same as above)
- ST-288: Knowledge base kill switch confirmation dialog -- immediate data purge warning (roles: same as above)

### Section: AI Configuration (activeSection === 'ai')
- ST-289: AI configuration -- model selection, system prompt, chat instructions (roles: super_admin, partner_admin)
- ST-290: AI configuration -- read-only view (roles: partner_admin with restricted access)

### Section: Notifications (activeSection === 'notifications')
- ST-291: Notification preferences -- email/SMS/push toggles, quiet hours, event type toggles (new lead, appointment, agent alert, task due) (roles: super_admin, partner_admin, org_admin)

### Section: Appearance (activeSection === 'appearance')
- ST-292: Appearance settings -- compact mode, animations, default view, show metric tiles (roles: super_admin, partner_admin, org_admin)

---

## Route: /profile (ProfilePage)

### Tab: My Profile
- ST-293: Profile view mode -- avatar, name, email, role badge, org badge (roles: all authenticated)
- ST-294: Profile edit mode -- first/last name, email fields editable (roles: all authenticated)
- ST-295: Profile saving -- spinner on save button (roles: all authenticated)
- ST-296: Contact information form -- email + phone fields (roles: all authenticated)
- ST-297: Change password form -- current/new/confirm fields with validation (roles: all authenticated)
- ST-298: Change password -- passwords don't match error (roles: all authenticated)
- ST-299: Change password submitting -- "Changing..." button (roles: all authenticated)
- ST-300: Photo upload -- hover overlay with camera icon (roles: all authenticated)
- ST-301: Photo uploading -- spinner overlay (roles: all authenticated)

### Tab: Preferences (/profile/preferences)
- ST-302: Appearance settings -- dark mode toggle (roles: all authenticated)
- ST-303: Notification settings -- push notifications, email digest toggles (roles: all authenticated)
- ST-304: Regional settings -- language selector, timezone selector (roles: all authenticated)
- ST-305: Product tour reset button (roles: all authenticated)

---

## Route: /settings/billing (BillingDashboard)

### States:
- ST-306: Billing loading -- skeleton layout (roles: org_admin, partner_admin, super_admin)
- ST-307: Billing not configured -- AlertCircle + "Billing Not Configured" message (roles: same as above)
- ST-308: Billing dashboard -- credit balance card + current plan card + usage meters (roles: same as above)
- ST-309: Credit balance low warning -- red styling when balance low (roles: same as above)
- ST-310: Credit balance healthy -- green styling (roles: same as above)
- ST-311: Top up wallet dialog -- amount input + confirm (roles: same as above)
- ST-312: Top up processing -- "Processing..." button (roles: same as above)
- ST-313: Navigation links -- View Usage Details, Manage Plan, Invoice History (roles: same as above)
- ST-314: RBAC redirect -- non-admin roles redirected to / (roles: non-admin)

---

## Route: /settings/billing/usage (BillingUsagePage)

### States:
- ST-315: Usage loading -- skeleton (roles: org_admin, partner_admin, super_admin)
- ST-316: Usage error -- "Failed to Load Usage" with error message (roles: same as above)
- ST-317: Usage not configured -- "Billing Not Configured" message (roles: same as above)
- ST-318: Usage populated -- meter cards with progress bars (voice/video/SMS/LLM tokens/images/video gen) (roles: same as above)
- ST-319: Usage no data -- "No usage data available for this period" (roles: same as above)
- ST-320: RBAC redirect -- non-admin redirected (roles: non-admin)

---

## Route: /settings/billing/plan (BillingPlanPage)

### States:
- ST-321: Plan loading -- skeleton (roles: org_admin, partner_admin, super_admin)
- ST-322: Plan not configured -- "Billing Not Configured" (roles: same as above)
- ST-323: Current plan displayed -- features, boolean entitlements, metered allocations (roles: same as above)
- ST-324: No active plan -- "No active plan. Contact your administrator." (roles: same as above)
- ST-325: Plan comparison grid -- all available plans with pricing + features (roles: same as above)
- ST-326: RBAC redirect -- non-admin redirected (roles: non-admin)

---

## Route: /settings/billing/invoices (BillingInvoicesPage)

### States:
- ST-327: Invoices loading -- skeleton (roles: org_admin, partner_admin, super_admin)
- ST-328: Invoices not configured -- "Billing Not Configured" (roles: same as above)
- ST-329: Invoices populated -- table with date/amount/status/ID (roles: same as above)
- ST-330: Invoices empty -- "No invoices yet" (roles: same as above)
- ST-331: RBAC redirect -- non-admin redirected (roles: non-admin)

---

## Route: /settings/org-wizard (OrgWizardPage)

### States:
- ST-332: Org wizard RBAC redirect -- non super_admin/partner_admin redirected to /settings (roles: org_admin and below)
- ST-333: Step 1: Org Details -- name/industry/size/website/logo/public listing/multi-location (roles: super_admin, partner_admin)
- ST-334: Step 2: Contact -- phone/email/address/city/state/zip/timezone/business hours (roles: same as above)
- ST-335: Step 3: Admin Setup -- first/last/email/phone/role/temp password/welcome email (roles: same as above)
- ST-336: Step 4: Configuration -- billing enabled/anniversary/monthly fee/included minutes/overage rates/setup fee (roles: same as above)
- ST-337: Step 5: Tools -- integration toggles (CRM/Voice/Video/SMS/Doc Gen/Email) (roles: same as above)
- ST-338: Step 6: Default Agent -- name/persona/channels/auto-respond/deploy/skills (roles: same as above)
- ST-339: Step 7: Review -- summary of all steps with validation warnings (roles: same as above)
- ST-340: Validation error toast -- required fields missing on Next (roles: same as above)
- ST-341: Creating organization -- submit pending (roles: same as above)
- ST-342: Creation success -- toast + redirect to /settings/system?section=users (roles: same as above)

---

## Route: /usage (UsagePage)

### States:
- ST-343: Usage page -- summary cards (Total Events, Event Types, Organizations/Period) + usage by type bars (roles: org_admin, partner_admin, super_admin)
- ST-344: Usage loading -- "Loading usage data..." (roles: same as above)
- ST-345: Usage error -- red error banner with message (roles: same as above)
- ST-346: Usage no events -- "No usage events recorded for this period" (roles: same as above)
- ST-347: Usage period selector -- This Month / Last Month (roles: same as above)
- ST-348: Usage by organization breakdown -- per-org cards (roles: super_admin, partner_admin only, when multiple orgs)
- ST-349: Usage access denied -- "Usage data is available to Organization Admins and above" (roles: sales, service, marketing staff)

---

## Route: /* (NotFound)

### States:
- ST-350: 404 page -- AlertCircle icon, "404 Page Not Found" heading, "Go to Home" button (roles: all)

---

## Summary

**Total states enumerated: 350**

### Breakdown by area:
- Global / Cross-cutting: 10 (ST-001 to ST-010)
- Authentication (login/forgot/reset): 16 (ST-011 to ST-026)
- Public widget/landing: 26 (ST-027 to ST-052)
- Main AI Chat: 26 (ST-053 to ST-078)
- TeamBox: 25 (ST-079 to ST-103)
- My Work: 15 (ST-104 to ST-118)
- Sales: 22 (ST-119 to ST-140)
- Service: 19 (ST-141 to ST-159)
- Marketing: 13 (ST-160 to ST-172)
- Management: 15 (ST-173 to ST-187)
- Agents: 13 (ST-188 to ST-200)
- Insights: 37 (ST-201 to ST-237)
- Settings: 55 (ST-238 to ST-292)
- Profile: 13 (ST-293 to ST-305)
- Billing: 26 (ST-306 to ST-331)
- Org Wizard: 11 (ST-332 to ST-342)
- Usage: 7 (ST-343 to ST-349)
- 404: 1 (ST-350)

### Role-gated observations:
- **super_admin only features:** AI Configuration (write access), Org Wizard, store selector in Insights, Usage by Organization breakdown
- **partner_admin:** Same as super_admin minus some org wizard role options, AI Config may be read-only
- **org_admin:** Most features except AI Config, Org Wizard; billing access yes
- **Department roles (sales, service, marketing):** Can see their department pages; Management page redirects them; Usage page shows access denied; Settings tiles filtered by minRole
- **Public/unauthenticated:** Widget landing pages (/p/:slug, /w/:slug), login, forgot/reset password only
