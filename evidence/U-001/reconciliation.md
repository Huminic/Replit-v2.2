# Reconciliation — DOM Inventory vs Visual Analysis

**Date:** 2026-03-27
**DOM source:** evidence/U-001/dom-inventory.md
**Visual source:** evidence/U-001/visual-analysis.md
**State enumeration:** evidence/U-001/state-enumeration.md (350 states)

## Summary
- Pages compared: 11
- Mismatches found: 14
- Coverage: 68 of 350 enumerated states crawled (19.4%)

---

## Mismatches

### MISMATCH-001: / (AI Chat) — Metric card label truncation
- **DOM says:** Full labels — "Active Pipeline", "Appointments Today", "Open Escalations", "Outbound Sent 24h" (metric-tile-0 through metric-tile-3)
- **Screenshot shows:** Labels truncated — "Appointment...", "Open Escalat...", "Outbound Se..." (screenshot 25-orgadmin-ai-chat.png)
- **Significance:** MEDIUM
- **Likely cause:** CSS overflow:hidden or text-overflow:ellipsis on cards that are too narrow for their text content. DOM reports full text content regardless of visual truncation.

### MISMATCH-002: / (AI Chat) — Element count discrepancy
- **DOM says:** 27 unique elements
- **Screenshot shows:** ~15 interactive elements visible
- **Significance:** LOW
- **Likely cause:** DOM count includes non-visible elements (hidden file inputs, aria elements, product tour overlay elements in DOM but not rendered). The global shell elements (header bar, sidebar) are counted separately in DOM inventory but contribute to the visual count.

### MISMATCH-003: / (AI Chat) — Header branding text
- **DOM says:** Header contains button with "{Org Name}" (button-org-switcher) — no explicit "Nexxus Connect (TM)" element listed
- **Screenshot shows:** "Nexxus Connect (TM)" text visible at left of header bar (screenshot 25-orgadmin-ai-chat.png)
- **Significance:** LOW
- **Likely cause:** Static text/logo element not captured by DOM inventory's interactive-element-focused query. DOM crawl targeted buttons, inputs, and data-testid elements, not static branding text.

### MISMATCH-004: /teambox — Channel filter chips differ between DOM and visual
- **DOM says:** Channel Filter Bar has 6 chips: All, SMS, Email, Web Chat, WhatsApp, Voice (channel-chip-all through channel-chip-voice)
- **Screenshot shows:** Only 3 channel filter pills visible: "Chat (highlighted), WhatsApp, Voice" (screenshot 29-orgadmin-teambox.png). SMS, Email, All not visible in screenshot.
- **Significance:** HIGH
- **Likely cause:** Viewport/scroll position. The full channel bar may require horizontal scrolling, or some chips were out of frame. Alternatively, the screenshot captured a different filter bar (the sub-tabs panel shows "SMS (badge 8), Email, Phone, Video, Tasks" which is the Chat History Side Panel, not the Channel Filter Bar). Two separate filter mechanisms may be conflated in the visual analysis.

### MISMATCH-005: /teambox — Conversation count
- **DOM says:** 261 raw elements (bulk is conversation list items), with conversation items having pattern conversation-item-{uuid}
- **Screenshot shows:** Contact list shows badge "207" or similar count (screenshot 29-orgadmin-teambox.png)
- **Significance:** MEDIUM
- **Likely cause:** 261 raw DOM elements includes buttons, text nodes, badges within each conversation item, not 261 conversations. The "207" badge likely reflects the actual conversation count. The DOM element count and the conversation count are measuring different things.

### MISMATCH-006: /teambox — Sub-tab "Workflows" not visible in screenshot
- **DOM says:** Three sub-tabs within Conversations: "Conversations", "Tasks {count}", "Workflows" (tab-conversations, tab-tasks, tab-workflows)
- **Screenshot shows:** Only "Conversations" and "Phone" / "Video" top-level tabs visible. No "Workflows" sub-tab shown.
- **Significance:** MEDIUM
- **Likely cause:** The Workflows sub-tab is nested inside the Conversations view and may not have been visible in the screenshot viewport, or it was below the fold / in a scrollable area. The screenshot captures the top-level tab structure more prominently.

### MISMATCH-007: /sales — Agent count and details
- **DOM says:** Agent cards with pattern agent-card-{uuid} and switch-agent-active-{uuid} toggles. No specific count or agent names listed.
- **Screenshot shows:** Exactly 4 named agent cards: "Caroline" (voice), "Data Guru" (chat), "Sales Coach" (chat), "Communication Writer" (chat). Each has gear icon and green active dot. (screenshot 08-sales-agents.png)
- **Significance:** LOW
- **Likely cause:** DOM inventory used UUID-pattern deduplication and did not enumerate specific agent names/counts since they are dynamic data. Visual analysis captured the actual runtime state. Not a true mismatch — DOM inventory is structural, visual is data.

### MISMATCH-008: /sales — "New Agent" button not visible in screenshot
- **DOM says:** button "New Agent" (button-new-agent) present in Sales > Agents tab
- **Screenshot shows:** 4 agent cards visible but no "New Agent" button described (screenshot 08-sales-agents.png)
- **Significance:** MEDIUM
- **Likely cause:** Button may be above/below the viewport in the screenshot, or obscured by the agent card grid. The visual analysis may have missed documenting it if it appeared outside the main focus area.

### MISMATCH-009: /service — Campaign action buttons detail
- **DOM says:** Per-campaign action buttons: start (button-start-campaign-{uuid}), schedule (button-schedule-campaign-{uuid}), dry run (button-dryrun-campaign-{uuid}), upload CSV (button-upload-csv-{uuid})
- **Screenshot shows:** Actions column has "play, calendar, eye, download icons per row" (screenshot 27-orgadmin-service.png)
- **Significance:** LOW
- **Likely cause:** The visual analysis described icons by appearance (play=start, calendar=schedule, eye=view/dry-run, download=CSV upload). The mapping is: play→start, calendar→schedule, eye→dryrun, download→upload-csv. Functionally equivalent, but "eye" icon mapping to "dry run" is ambiguous — could also be a "view" action not in the DOM inventory.

### MISMATCH-010: /settings — Settings sub-routes all return 404
- **DOM says:** Settings sub-pages (User Management, Organization, Tools, Knowledge Base, AI Config, Notifications, Appearance) render inline on /settings when activeSection state changes. DOM crawl found full content for each section.
- **Screenshot shows:** All direct URL routes /settings/users, /settings/organization, /settings/tools, /settings/knowledge, /settings/notifications, /settings/appearance return 404 (screenshots 16 through 21)
- **Significance:** HIGH
- **Likely cause:** Settings sub-pages use client-side state (activeSection) rather than URL routing. The DOM crawl accessed them by clicking tiles within the SPA, which sets React state. The screenshot agent attempted direct URL navigation, which fails because no server-side or React Router routes exist for /settings/*. This confirms settings is a single-page view with internal navigation only.

### MISMATCH-011: /settings — Tile count per role
- **DOM says:** org_admin sees 6 tiles, super_admin sees 7 tiles (+AI Configuration). Organization tile "present but failed to load (timeout)" for org_admin.
- **Screenshot shows:** org_admin has exactly 6 tiles (screenshot 31-orgadmin-settings.png), super_admin has 7 tiles (screenshot 07-system-settings.png). Organization tile visible and clickable for org_admin.
- **Significance:** MEDIUM
- **Likely cause:** DOM crawl's Organization tile timeout for org_admin was likely a transient network/API issue, not a permanent access restriction. The screenshot confirms the tile renders visually for org_admin. The DOM note "failed to load" refers to the content after clicking, not the tile visibility.

### MISMATCH-012: /marketing — Studio tab content discrepancy
- **DOM says:** Studio tab has 5 sub-tabs (Copywriter, Photo Studio, Video Producer, Creative Director, Market Intel), a textarea input, and a "Generate" button
- **Screenshot shows:** Marketing page only shows Dashboard tab with 4 metric cards, all zeros, and "large empty white space" (screenshot 28-orgadmin-marketing.png). Studio tab not captured.
- **Significance:** MEDIUM
- **Likely cause:** Visual analysis only captured the Marketing Dashboard tab. The Studio tab was not navigated to during screenshot capture. This is a coverage gap, not a true content mismatch.

### MISMATCH-013: /manage vs /management — Route confusion in screenshot capture
- **DOM says:** /manage returns 404. Correct route is /management. Sidebar "Manage" navigates to /management. DOM inventory crawled /management successfully.
- **Screenshot shows:** /manage captured as 404 (screenshot 13-manage.png). Tour overlay appeared over /manage 404 page (screenshot 06-tour-overlay-1of6.png). /management captured separately and correctly (screenshots 10, 30).
- **Significance:** HIGH
- **Likely cause:** Screenshot agent attempted /manage as a direct URL. The sidebar label "Manage" is misleading — it routes to /management. Both methods confirm the dead route. The tour overlay firing on a 404 page is an additional bug: the product tour does not check whether the underlying page loaded successfully.

### MISMATCH-014: /insights — "All Stores" dropdown presence
- **DOM says:** No explicit "All Stores" dropdown documented in Insights page inventory (Insights is noted as "same as Management > Insights tab")
- **Screenshot shows:** "All Stores" dropdown visible in top right of /insights page (screenshot 23-insights.png), also visible on /management super_admin view (screenshot 22-management.png)
- **Significance:** MEDIUM
- **Likely cause:** The "All Stores" store/org selector is a super_admin-only element (matches ST-218 in state enumeration). The DOM crawl may have been in org_admin context when it visited /insights, or the deduplication note ("same as Management > Insights") omitted this role-specific element.

---

## Pages With No Mismatches

The following pages had consistent findings between DOM and visual analysis with no significant discrepancies:

1. **/login** — Both methods found: email/password fields, "Sign in" button, "Forgot password?" link, "Nexxus" heading, "Customer portal" subtitle. Element counts align (~6 interactive). No data-testid attributes confirmed by both.

2. **/profile** — Both methods found: My Profile / Preferences tabs, avatar with initials, name, email, role badge, org badge, Edit Profile link, contact info fields (email, phone), Save Changes button, Change Password section with 3 fields. Role difference (Organization Admin vs Super Admin badge) confirmed by both.

3. **/usage** — Both methods found: "Usage" title, period selector ("This Month"), 3 summary cards (Total Events, Event Types, Organizations/Period), usage breakdown bars (SMS Failed, SMS Sent, SMS Blocked). Both noted the anomaly of SMS Failed > SMS Sent.

---

## Uncrawled States

Of the 350 enumerated states, the DOM crawl and visual analysis together covered approximately 68 states. The remaining 282 states were not visited by either method. They are grouped below by area.

### Global / Cross-Cutting (8 of 10 uncrawled)
- ST-001: ErrorBoundary fallback UI
- ST-002: Auth loading spinner
- ST-003: Redirect to /login (unauthenticated)
- ST-004: Redirect to / (insufficient role)
- ST-005: Session timeout warning dialog
- ST-007: EntitlementGate — feature allowed (implicit, not separately tested)
- ST-008: EntitlementGate — "Upgrade to unlock" CTA
- ST-009: Success toast
- ST-010: Error/destructive toast

**Crawled:** ST-006 (Product tour overlay — confirmed by both methods)

### Authentication (3 of 16 uncrawled)
- ST-013: Login with session expired alert
- ST-014: Login with error alert (bad credentials)
- ST-015: Login submitting spinner
- ST-016 through ST-026: All forgot-password and reset-password states

**Crawled:** ST-011 (auth loading — DOM), ST-012 (login form — both methods)

### Public Widget/Landing (26 of 26 uncrawled)
- ST-027 through ST-052: All widget landing page states (/w/:slug, /p/:slug)

**Crawled:** None. Neither method visited public widget pages.

### Main AI Chat (14 of 26 uncrawled)
- ST-054: Chat with history (metrics collapsed)
- ST-055 through ST-062: All chat message, streaming, error, and ThinkingCard states
- ST-067 through ST-073: All metric detail dialog states
- ST-074 through ST-077: Contact detail view states

**Crawled:** ST-053 (main page initial — both), ST-063 through ST-066 (metric tiles — both), ST-078 (suggestion chips — both)

### TeamBox (13 of 25 uncrawled)
- ST-079: Conversation list loading skeleton
- ST-081: Conversation list empty
- ST-083: Messages loading skeleton
- ST-085: Conversation automated — "Take Over" button
- ST-086: Campaign disconnect button
- ST-087: Campaign disconnected badge
- ST-091: Voice call transcript modal
- ST-093 through ST-097: All task view states
- ST-098 through ST-099: Phone tab loading/empty

**Crawled:** ST-080 (conversation list populated — both), ST-082 (conversation selected — both), ST-084 (reply input — both), ST-088 (customer info panel — both), ST-089 (status filter sidebar — DOM), ST-090 (channel filter chips — DOM), ST-092 (assign dropdown — DOM), ST-100 (VAPI call logs — DOM noted heading), ST-101/ST-102/ST-103 (video tab — DOM noted heading)

### My Work (15 of 15 uncrawled)
- ST-104 through ST-118: All /my-work states

**Crawled:** None. Neither method visited /my-work. This route does not appear in the sidebar navigation.

### Sales (12 of 22 uncrawled)
- ST-120: Dashboard loading
- ST-121 through ST-129: All metric detail, contact detail, and drill-down states
- ST-132: Activity feed loading
- ST-133: Activity feed empty

**Crawled:** ST-119 (sales dashboard — both), ST-130 (top agents — both), ST-131 (activity feed populated — both), ST-134 (sync status — both), ST-135 (agent cards — both), ST-138 (agent card click/config — not tested), ST-139 (sales insights — DOM noted same structure), ST-140 (sales calendar — DOM)

### Service (11 of 19 uncrawled)
- ST-142: Campaign table loading
- ST-143: Campaign table empty
- ST-144: Communications paused badge
- ST-146: Campaign safety dismissed
- ST-147: Kill switch toggled ON
- ST-148 through ST-153: Campaign detail, new campaign, CSV upload dialogs and states
- ST-155: Agent cards loading
- ST-156: Agent cards empty

**Crawled:** ST-141 (campaign table populated — both), ST-145 (campaign safety card — both), ST-154 (service agents — DOM), ST-157 (service insights — DOM noted same structure), ST-159 (service calendar — DOM noted same structure)

### Marketing (7 of 13 uncrawled)
- ST-161: Dashboard loading
- ST-162: Metric detail dialog
- ST-165: Studio filter selected
- ST-167 through ST-172: All agent chat view states

**Crawled:** ST-160 (marketing dashboard — both), ST-163 (marketing agent cards — DOM), ST-164 (creative studio — DOM), ST-166 (marketing insights — DOM noted same structure)

### Management (7 of 15 uncrawled)
- ST-173: Management redirect (RBAC)
- ST-175: Hunches loading
- ST-177: Hunches empty
- ST-178 through ST-182: All hunch status states and generating
- ST-183: Activity log loading
- ST-185: Activity log empty

**Crawled:** ST-174 (management insights — both), ST-176 (hunches populated — DOM), ST-184 (activity log populated — DOM), ST-186 (user chats placeholder — DOM), ST-187 (billing tab — DOM)

### Agents (13 of 13 uncrawled)
- ST-188 through ST-200: All /agents page states

**Crawled:** None. Neither method visited /agents. This route exists in code but does not appear in the sidebar.

### Insights (25 of 37 uncrawled)
- ST-201: Dashboard loading
- ST-208 through ST-215: All drill-down dialog states
- ST-216: Leads trend chart (interactive)
- ST-217: Conversions chart (interactive)
- ST-219 through ST-226: All Reports tab states
- ST-227 through ST-234: All Library tab states
- ST-235 through ST-237: All Hunches tab states (standalone)

**Crawled:** ST-202 through ST-207 (red/yellow/green zone cards — both), ST-218 (store selector — visual only, super_admin)

### Settings (39 of 55 uncrawled)
- ST-246 through ST-257: User Management states (list, add, edit, invite, search)
- ST-258 through ST-265: Organization settings states
- ST-266 through ST-282: Tools & Integrations states (MCP, Widgets, Landing Pages, Universal, Skills, VIN config, CRM provisioning)
- ST-283 through ST-288: Knowledge Base states
- ST-289 through ST-290: AI Configuration states (detailed interaction)

**Crawled:** ST-238 through ST-245 (settings tile grid — both), ST-291 (notification preferences — DOM), ST-292 (appearance settings — DOM). DOM also accessed User Management, Organization, Tools, Knowledge Base, AI Config, and Notifications inline views, but only at a structural level — not testing loading/empty/error/submission states.

### Profile (7 of 13 uncrawled)
- ST-294: Profile edit mode
- ST-295: Profile saving
- ST-298: Password mismatch error
- ST-299: Password changing
- ST-300: Photo upload hover
- ST-301: Photo uploading
- ST-302 through ST-305: All Preferences tab states

**Crawled:** ST-293 (profile view — both), ST-296 (contact info form — both), ST-297 (change password form — both)

### Billing (26 of 26 uncrawled)
- ST-306 through ST-331: All billing dashboard, usage, plan, and invoice states

**Crawled:** None at detail level. DOM inventory noted billing tab shows "Billing Not Configured" (aligns with ST-307), but the billing sub-routes (/settings/billing/usage, /settings/billing/plan, /settings/billing/invoices) were not visited.

### Org Wizard (11 of 11 uncrawled)
- ST-332 through ST-342: All org wizard states

**Crawled:** None. /settings/org-wizard not visited by either method.

### Usage (4 of 7 uncrawled)
- ST-344: Usage loading
- ST-345: Usage error
- ST-346: Usage no events
- ST-349: Usage access denied

**Crawled:** ST-343 (usage page populated — both), ST-347 (period selector — both), ST-348 (usage by org breakdown — visual only, super_admin)

### 404 Page
- ST-350: 404 page — **Crawled** (both methods confirmed, visual captured multiple instances)

---

## Coverage Breakdown

| Area | Total States | Crawled | Coverage |
|------|-------------|---------|----------|
| Global/Cross-Cutting | 10 | 2 | 20% |
| Authentication | 16 | 2 | 13% |
| Public Widget/Landing | 26 | 0 | 0% |
| Main AI Chat | 26 | 12 | 46% |
| TeamBox | 25 | 12 | 48% |
| My Work | 15 | 0 | 0% |
| Sales | 22 | 10 | 45% |
| Service | 19 | 8 | 42% |
| Marketing | 13 | 6 | 46% |
| Management | 15 | 8 | 53% |
| Agents | 13 | 0 | 0% |
| Insights | 37 | 12 | 32% |
| Settings | 55 | 16 | 29% |
| Profile | 13 | 6 | 46% |
| Billing | 26 | 0 | 0% |
| Org Wizard | 11 | 0 | 0% |
| Usage | 7 | 3 | 43% |
| 404 | 1 | 1 | 100% |
| **Total** | **350** | **68** | **19.4%** |

### Zero-Coverage Routes (not visited by either method)
1. **/my-work** — 15 states (ST-104 to ST-118). Route exists in code, not in sidebar nav.
2. **/agents** — 13 states (ST-188 to ST-200). Route exists in code, not in sidebar nav.
3. **/w/:slug, /p/:slug** — 26 states (ST-027 to ST-052). Public widget pages, require slug parameter.
4. **/settings/billing/*** — 26 states (ST-306 to ST-331). Billing sub-routes not navigated.
5. **/settings/org-wizard** — 11 states (ST-332 to ST-342). Super_admin provisioning wizard not visited.
6. **/forgot-password, /reset-password** — 11 states (ST-016 to ST-026). Auth recovery flows not tested.

### Primary Coverage Gaps (routes visited but many states missed)
1. **Insights drill-downs** — Cards visible but none clicked to test dialog states (ST-208 through ST-215)
2. **Settings sub-sections** — Tiles visible, some clicked for structure, but no loading/error/submission states tested
3. **Chat interaction states** — AI Chat page loaded but no messages sent, no streaming tested
4. **Campaign/agent CRUD** — Tables/cards visible but no create/edit/delete workflows tested
