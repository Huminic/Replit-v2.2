# Test Plan: Dashboard Domain (T-002 — Exhaustive)

**Domain:** Dashboard (`/`)
**Sprint:** T-002
**Created by:** Planner Agent (T-002)
**Status:** Active
**Supersedes:** T-001 dashboard-plan.md (8 test cases)

---

## Source Inventory

| Source | Path | Key Findings |
|--------|------|--------------|
| Existing E2E tests | `tests/e2e/domain-02-dashboard.spec.ts` | 5 tests (2.1-2.5): page load, role metrics, left popout, no right panel, metrics-above-chat layout |
| T-001 Agent tests | `tests/agents/generated/dashboard.agent.spec.ts` | 5 tests (D01-D04, D06): dashboard load, metric tiles, sales role access, metrics API, console errors |
| Main page component | `client/src/pages/main.tsx` | 939 lines. 4 metric tiles (pipeline), AI chat, suggestion chips, metric detail dialogs with drill-down tables, contact detail view, streaming chat, thinking cards |
| Sidebar | `client/src/components/layout/Sidebar.tsx` | 72px icon sidebar. Items: AI Chat, TeamBox, Sales, Service, Marketing, Manage. Bottom: System (RBAC gated). Collapse/expand. |
| SubMenuManager | `client/src/components/layout/SubMenuManager.tsx` | Flyout panel. ai-chat panel: Favorites + Chat History with resume/delete. Other panels per section. |
| TopBar | `client/src/components/layout/TopBar.tsx` | Logo, org switcher, globe (public page), notifications bell, activity feed, theme toggle, profile menu |
| AppLayout | `client/src/components/layout/AppLayout.tsx` | ViewConfig: chat-only for `/`. No right pane on dashboard. Product tour integration. |
| Metrics API | `server/routes/metrics.ts` | `GET /api/metrics/pipeline`, `GET /api/metrics/pipeline/details?metric=X`, `GET /api/metrics/dashboard`, `GET /api/activity-log` |
| RBAC | `client/src/lib/rbac.ts` | 8 roles. Section access per role. System access: super_admin, partner_admin, org_admin only. Management: super_admin only. |
| Chat types | `client/src/lib/chat-types.ts` | Role-based suggestion chips: sales, service, marketing, management, default pools. 4 random shown. |
| Auth helper | `tests/e2e/helpers/auth.ts` | testUsers: superAdmin, partnerAdmin, orgAdmin, executive, sales, service, marketing + per-dealer org admins |

---

## Dashboard Anatomy

### Main Page Layout (route: `/`)

```
+--------------------------------------------------------------------+
| TopBar (h-14)                                                       |
|  Logo | Org Switcher | Globe | Notifications | Activity | Theme | Profile |
+------+-------------------------------------------------------------+
| Side |  "AI Key Metrics" header + toggle button                     |
| bar  |  [Active Pipeline] [Appointments Today]                      |
| 72px |  [Open Escalations] [Outbound Sent 24h]                      |
|      |  ─────────────────────────────────                           |
|      |  Chat messages (bot left, user right)                        |
|      |  Streaming indicator / error state                           |
|      |  ─────────────────────────────────                           |
|      |  Suggestion chips ("Try asking...")                           |
|      |  [+ New] [textarea] [Send/Stop]                              |
+------+-------------------------------------------------------------+
```

### KPI Metric Tiles (2x2 or 4-col grid)

| Tile | data-testid | API key | Data Source | Description |
|------|-------------|---------|-------------|-------------|
| Active Pipeline | `metric-tile-0` | `active_pipeline` | `/api/metrics/pipeline` | Leads created in last 14 days, excl Lost/Sold/Duplicate |
| Appointments Today | `metric-tile-1` | `appointments_today` | `/api/metrics/pipeline` | Scheduled appointments for today |
| Open Escalations | `metric-tile-2` | `open_escalations` | `/api/metrics/pipeline` | Active escalations in TeamBox |
| Outbound Sent 24h | `metric-tile-3` | `outbound_sent` | `/api/metrics/pipeline` | SMS + email + voice in last 24h |

Each tile: gradient background, decorative SVG circles, icon badge, value, trend indicator (up/down), "live" change label. Clickable to open MetricDetailDialog.

### Metric Detail Dialogs

| Metric | Dialog table | Columns | data-testid |
|--------|-------------|---------|-------------|
| Active Pipeline | `table-active-pipeline` | Name, Status, Vehicle, Lead ID, View Contact | `row-pipeline-{idx}` |
| Appointments Today | `table-appointments` | Name, Phone, Email, Type, Time | `row-appointment-{idx}` |
| Open Escalations | `table-escalations` | Title, Type, Priority, Created | `row-escalation-{idx}` |
| Outbound Sent 24h | `table-outbound` | Recipient, Phone, Email, Channel, Sent | `row-outbound-{idx}` |

Dialog states: loading (`metric-detail-loading`), error (`metric-detail-error`), empty (`metric-detail-empty`), data table.

### Contact Detail View (from Active Pipeline drill-down)

Fields: Name, Status badge, Phone, Email, Location, Company, Vehicle of Interest.
Actions: Call button, Text button, Back to leads.
States: Loading (spinner), CRM error fallback, No contact info.
data-testids: `contact-detail-view`, `text-contact-name`, `text-contact-phone`, `text-contact-email`, `button-call-contact`, `button-text-contact`, `contact-crm-error`, `contact-no-info`.

### AI Chat Interface

- Messages: bot (left, bg-card) and user (right, bg-primary). No avatars.
- Streaming: wave-dot animation (3 dots), status message with Globe icon, or streaming markdown content.
- Error state: destructive banner with Retry button (`button-retry`).
- Thinking card: expandable Brain icon card showing AI reasoning steps.
- Input: gradient-bordered textarea (`input-main-chat`), Send button (`button-main-send`), Stop button during streaming (`button-main-stop`), Plus/New button (`button-main-chat-add`).
- Suggestion chips: 4 random from role-specific pool (`main-suggestion-{i}`).
- Conversation resume: `?conversationId=X` URL param.

### Left Panel (SubMenuManager — ai-chat mode)

- Favorites list with remove button
- Chat History with resume and delete actions
- Collapse button (`button-collapse-chat-panel`)
- Triggered by sidebar hover/pin on AI Chat item

### Sidebar Navigation

Items visible on dashboard: AI Chat, TeamBox, Sales, Service, Marketing, Manage.
Bottom: System (admin roles only), Logout.
data-testids: `sidebar-item-{id}`, `button-show-sidebar`, `button-toggle-submenu`, `button-logout`.

### TopBar Elements

- Org switcher: `button-org-switcher`, `dropdown-org-switcher`, `org-option-{id}`
- Notifications: `button-notifications`, `dropdown-notifications`, `button-mark-all-read`, `notification-item-{id}`
- Activity feed: `button-activity-feed`, `dropdown-activity`, `activity-item-{id}`
- Theme toggle: `button-theme-toggle`
- Profile menu: `button-profile-menu`, `dropdown-profile`, `menu-item-profile`, `menu-item-preferences`, `menu-item-take-tour`, `menu-item-logout`
- Globe/public page: `button-public-page`

### Tiles Collapse Behavior

- Tiles visible on initial load (no messages sent yet).
- After first user message, tiles auto-collapse with animation (500ms ease-in-out).
- Toggle button (`button-toggle-metrics`) appears after first message. Show/Hide.

---

## Role-Based Visibility Matrix

| Element | super_admin | partner_admin | org_admin | executive | sales_manager | sales | service | marketing |
|---------|:-----------:|:-------------:|:---------:|:---------:|:-------------:|:-----:|:-------:|:---------:|
| Metric tiles (4) | Y | Y | Y | Y | Y | Y | Y | Y |
| AI Chat | Y | Y | Y | Y | Y | Y | Y | Y |
| Suggestion chips | management pool | management pool | management pool | management pool | sales pool | sales pool | service pool | marketing pool |
| Sidebar: AI Chat | Y | Y | Y | Y | Y | Y | Y | Y |
| Sidebar: TeamBox | Y | Y | Y | Y | Y | Y | Y | Y |
| Sidebar: Sales | Y | Y | Y | Y | Y | Y | N | N |
| Sidebar: Service | Y | Y | Y | Y | N | N | Y | N |
| Sidebar: Marketing | Y | Y | Y | Y | N | N | N | Y |
| Sidebar: Manage | Y | Y | Y | Y | N | N | N | N |
| Sidebar: System | Y | Y | Y | N | N | N | N | N |
| Org switcher | Y | Y | N | N | N | N | N | N |
| TopBar: Notifications | Y | Y | Y | Y | Y | Y | Y | Y |
| TopBar: Activity feed | Y | Y | Y | Y | Y | Y | Y | Y |
| TopBar: Theme toggle | Y | Y | Y | Y | Y | Y | Y | Y |
| TopBar: Profile menu | Y | Y | Y | Y | Y | Y | Y | Y |

---

## Existing Test Coverage Map

| Test ID | File | What it covers |
|---------|------|----------------|
| 2.1 | domain-02-dashboard.spec.ts | Page loads without critical console errors (orgAdmin) |
| 2.2 | domain-02-dashboard.spec.ts | Metric tiles differ between orgAdmin and sales roles |
| 2.3 | domain-02-dashboard.spec.ts | Left popout has Chat History + Favorites (orgAdmin) |
| 2.4 | domain-02-dashboard.spec.ts | No right panel visible on dashboard (orgAdmin) |
| 2.5 | domain-02-dashboard.spec.ts | Metrics positioned above chat (orgAdmin) |
| D01 | dashboard.agent.spec.ts | Dashboard loads for orgAdmin (no login redirect, content present) |
| D02 | dashboard.agent.spec.ts | Metric tiles present with text content (orgAdmin) |
| D03 | dashboard.agent.spec.ts | Sales role accesses dashboard |
| D04 | dashboard.agent.spec.ts | Metrics API returns data (orgAdmin) |
| D06 | dashboard.agent.spec.ts | No critical console errors (orgAdmin) |

---

## Test Cases

### Section A: Page Load and Structure

#### TC-DASH-001: Dashboard loads for org_admin
- **Priority:** P1
- **Status:** COVERED (2.1, D01)
- **Role(s):** org_admin
- **Steps:**
  1. Login as org_admin via API
  2. Navigate to `/`
  3. Verify URL does not contain `/login`
  4. Verify body has meaningful content (>100 chars)
- **Expected:** Dashboard renders at `/` without redirect.

#### TC-DASH-002: No critical console errors on load
- **Priority:** P1
- **Status:** COVERED (2.1, D06)
- **Role(s):** org_admin
- **Steps:**
  1. Attach console error listener
  2. Login and navigate to `/`
  3. Filter known noise (favicon, websocket, ResizeObserver, net::ERR, 404)
  4. Assert zero remaining errors
- **Expected:** No critical JS errors.

#### TC-DASH-003: Metrics positioned above chat
- **Priority:** P2
- **Status:** COVERED (2.5)
- **Role(s):** org_admin
- **Steps:**
  1. Login and navigate to `/`
  2. Get bounding box of metrics container and chat container
  3. Verify metrics Y < chat Y
- **Expected:** Metrics above chat in vertical layout.

#### TC-DASH-004: No right pane on dashboard
- **Priority:** P2
- **Status:** COVERED (2.4)
- **Role(s):** org_admin
- **Steps:**
  1. Login and navigate to `/`
  2. Query right-panel / detail-panel selectors
  3. Verify none are visible
- **Expected:** Dashboard uses chat-only ViewConfig, no right pane.

#### TC-DASH-005: Page title and header elements
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Login and navigate to `/`
  2. Verify `[data-testid="text-ai-key-metrics-title"]` contains "AI Key Metrics"
  3. Verify TopBar logo text "Nexxus Connect" is visible
- **Expected:** Header title and branding render correctly.

#### TC-DASH-006: Dashboard loads for every role without error
- **Priority:** P1
- **Status:** NEW (partial coverage: 2.1=orgAdmin, D03=sales)
- **Role(s):** super_admin, partner_admin, org_admin, executive, sales, service, marketing
- **Steps:**
  1. For each role: login via API, navigate to `/`
  2. Verify no login redirect
  3. Verify page has content
  4. Verify no critical console errors
- **Expected:** All 7 roles can access dashboard without errors.

#### TC-DASH-007: Dashboard responsive layout — mobile viewport
- **Priority:** P3
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Set viewport to 375x812 (iPhone)
  2. Login and navigate to `/`
  3. Verify metric tiles stack (1-column layout)
  4. Verify chat input is accessible
  5. Verify sidebar collapses to hidden
- **Expected:** Dashboard renders correctly on mobile.

#### TC-DASH-008: Dashboard responsive layout — tablet viewport
- **Priority:** P3
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Set viewport to 768x1024 (iPad)
  2. Login and navigate to `/`
  3. Verify metric tiles show 2-column layout (sm:grid-cols-2)
  4. Verify sidebar visible
- **Expected:** Tablet layout renders 2-column tiles.

---

### Section B: KPI Metric Tiles

#### TC-DASH-010: Four metric tiles render for org_admin
- **Priority:** P1
- **Status:** COVERED (D02, 2.2)
- **Role(s):** org_admin
- **Steps:**
  1. Login and navigate to `/`
  2. Query `[data-testid^="metric-tile-"]`
  3. Verify exactly 4 tiles
  4. Verify each has non-empty text content
- **Expected:** 4 tiles with values.

#### TC-DASH-011: Metric tile labels match expected set
- **Priority:** P1
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Login and navigate to `/`
  2. Read text from all 4 metric tiles
  3. Verify labels include: "Active Pipeline", "Appointments Today", "Open Escalations", "Outbound Sent 24h"
- **Expected:** All 4 expected KPI labels present.

#### TC-DASH-012: Metric tiles show numeric values
- **Priority:** P1
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Login and navigate to `/`
  2. For each tile, extract the large text value
  3. Verify each value is a non-negative integer (or "0")
- **Expected:** Each tile displays a numeric value.

#### TC-DASH-013: Metric tiles show trend indicators
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Login and navigate to `/`
  2. For each tile, check for TrendingUp or TrendingDown SVG icon presence
  3. Verify "live" change label text
- **Expected:** Each tile has a trend direction indicator and "live" label.

#### TC-DASH-014: Metric tile gradient backgrounds render
- **Priority:** P3
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Login and navigate to `/`
  2. Verify tile 0 has class containing `emerald`
  3. Verify tile 1 has class containing `blue`
  4. Verify tile 2 has class containing `amber`
  5. Verify tile 3 has class containing `purple`
- **Expected:** Each tile has its designated gradient theme.

#### TC-DASH-015: Metric tiles are role-specific (orgAdmin vs sales)
- **Priority:** P1
- **Status:** COVERED (2.2)
- **Role(s):** org_admin, sales
- **Steps:**
  1. Login as orgAdmin, capture tile text
  2. Login as sales, capture tile text
  3. Compare values
- **Expected:** Both roles see tiles; values may differ based on org scope.

#### TC-DASH-016: Metrics API endpoint returns valid pipeline data
- **Priority:** P1
- **Status:** PARTIALLY COVERED (D04 — tested /api/dashboard, not /api/metrics/pipeline)
- **Role(s):** org_admin
- **Steps:**
  1. Login via API as org_admin
  2. GET `/api/metrics/pipeline` with Bearer token
  3. Verify 200 response
  4. Verify JSON has: `activePipeline`, `appointmentsToday`, `openEscalations`, `outboundSent24h`
  5. Verify all values are numbers >= 0
- **Expected:** Pipeline API returns structured metric data.

#### TC-DASH-017: Metrics API requires authentication
- **Priority:** P1
- **Status:** NEW
- **Role(s):** unauthenticated
- **Steps:**
  1. GET `/api/metrics/pipeline` without auth header
  2. Verify 401 response
- **Expected:** Unauthenticated requests rejected.

#### TC-DASH-018: Dashboard metrics API endpoint
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Login via API as org_admin
  2. GET `/api/metrics/dashboard` with Bearer token
  3. Verify 200 response with JSON data
- **Expected:** Dashboard metrics endpoint returns data.

---

### Section C: Metric Detail Dialogs

#### TC-DASH-020: Click Active Pipeline tile opens detail dialog
- **Priority:** P1
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Login and navigate to `/`
  2. Click `[data-testid="metric-tile-0"]`
  3. Verify `[data-testid="dialog-metric-detail"]` is visible
  4. Verify dialog title contains "Active Pipeline"
  5. Verify `[data-testid="text-metric-detail-value"]` shows a number
- **Expected:** Dialog opens with pipeline details.

#### TC-DASH-021: Active Pipeline dialog shows lead table
- **Priority:** P1
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Open Active Pipeline detail dialog
  2. Verify `[data-testid="table-active-pipeline"]` is present (if data exists)
  3. Verify table headers: Name, Status, Vehicle, Lead ID
  4. Verify at least one row or empty state message
- **Expected:** Table with lead data or "No records found" empty state.

#### TC-DASH-022: Click Appointments Today tile opens detail dialog
- **Priority:** P1
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Click `[data-testid="metric-tile-1"]`
  2. Verify dialog opens with "Appointments Today" title
  3. Verify `[data-testid="table-appointments"]` or empty state
  4. If table present, verify headers: Name, Phone, Email, Type, Time
- **Expected:** Appointments detail dialog renders correctly.

#### TC-DASH-023: Click Open Escalations tile opens detail dialog
- **Priority:** P1
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Click `[data-testid="metric-tile-2"]`
  2. Verify dialog opens with "Open Escalations" title
  3. Verify `[data-testid="table-escalations"]` or empty state
  4. If table present, verify headers: Title, Type, Priority, Created
- **Expected:** Escalations detail dialog renders correctly.

#### TC-DASH-024: Click Outbound Sent tile opens detail dialog
- **Priority:** P1
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Click `[data-testid="metric-tile-3"]`
  2. Verify dialog opens with "Outbound Sent 24h" title
  3. Verify `[data-testid="table-outbound"]` or empty state
  4. If table present, verify headers: Recipient, Phone, Email, Channel, Sent
- **Expected:** Outbound detail dialog renders correctly.

#### TC-DASH-025: Metric detail dialog close behavior
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Open any metric detail dialog
  2. Click the dialog close button (X) or outside the dialog
  3. Verify dialog is no longer visible
- **Expected:** Dialog closes properly.

#### TC-DASH-026: Pipeline detail API — valid metric param
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Login via API
  2. For each valid metric key (active_pipeline, appointments_today, open_escalations, outbound_sent):
     GET `/api/metrics/pipeline/details?metric={key}`
  3. Verify 200 response with array
- **Expected:** Each metric detail endpoint returns array data.

#### TC-DASH-027: Pipeline detail API — invalid metric param
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Login via API
  2. GET `/api/metrics/pipeline/details?metric=invalid_key`
  3. Verify 400 response
- **Expected:** Invalid metric key returns 400 error.

#### TC-DASH-028: Pipeline detail API — missing metric param
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Login via API
  2. GET `/api/metrics/pipeline/details` (no metric param)
  3. Verify 400 response
- **Expected:** Missing metric returns 400.

#### TC-DASH-029: Metric detail dialog — loading state
- **Priority:** P3
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Click a metric tile
  2. Immediately check for `[data-testid="metric-detail-loading"]`
  3. Verify "Loading records..." text appears briefly before data
- **Expected:** Loading state renders while API fetches.

#### TC-DASH-030: Metric detail dialog — error state
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Intercept `/api/metrics/pipeline/details*` to return 500
  2. Click a metric tile
  3. Verify `[data-testid="metric-detail-error"]` with "Failed to load records"
- **Expected:** Error state renders on API failure.

#### TC-DASH-031: Metric detail dialog — empty state
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Intercept `/api/metrics/pipeline/details*` to return empty array
  2. Click a metric tile
  3. Verify `[data-testid="metric-detail-empty"]` with "No records found"
- **Expected:** Empty state renders when no data.

#### TC-DASH-032: Metric detail — record count display
- **Priority:** P3
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Open a metric detail dialog with data
  2. Verify record count text (e.g., "X records" or "showing first 100 of Y records")
- **Expected:** Record count is displayed and matches actual data.

---

### Section D: Contact Detail View (Pipeline Drill-Down)

#### TC-DASH-040: View Contact button opens contact detail
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Open Active Pipeline detail dialog
  2. If rows exist with View Contact button, click `[data-testid="button-view-contact-0"]`
  3. Verify `[data-testid="contact-detail-view"]` appears
  4. Verify `[data-testid="text-contact-name"]` has text
- **Expected:** Contact detail view renders with name.

#### TC-DASH-041: Contact detail — phone and email display
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Open contact detail view
  2. Check for `[data-testid="contact-phone-row"]` and/or `[data-testid="contact-email-row"]`
  3. If no info, verify `[data-testid="contact-no-info"]` message
- **Expected:** Contact info displayed or "No contact information available" shown.

#### TC-DASH-042: Contact detail — Call and Text buttons
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Open contact detail view
  2. Verify `[data-testid="button-call-contact"]` and `[data-testid="button-text-contact"]` exist
  3. If no phone number, verify both buttons are disabled
- **Expected:** Action buttons present; disabled when no phone.

#### TC-DASH-043: Contact detail — Back to leads navigation
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Open contact detail view from pipeline dialog
  2. Click `[data-testid="button-back-to-leads"]`
  3. Verify contact detail view disappears
  4. Verify pipeline table is visible again
- **Expected:** Back button returns to lead table.

#### TC-DASH-044: Contact detail — CRM error fallback
- **Priority:** P3
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Intercept `/api/vin/leads/*/contact` to return error
  2. Open contact detail from pipeline
  3. Verify `[data-testid="contact-crm-error"]` message about cached info
- **Expected:** Graceful fallback showing cached data with error notice.

#### TC-DASH-045: Contact detail — loading state
- **Priority:** P3
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Open contact detail view
  2. Check for `[data-testid="contact-loading"]` with spinner
- **Expected:** Loading spinner while CRM data fetches.

---

### Section E: AI Chat Interface

#### TC-DASH-050: Chat input renders with placeholder
- **Priority:** P1
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Login and navigate to `/`
  2. Verify `[data-testid="input-main-chat"]` is visible
  3. Verify placeholder text "Ask me anything about your business"
- **Expected:** Chat input present with correct placeholder.

#### TC-DASH-051: Send button disabled when input empty
- **Priority:** P1
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Login and navigate to `/`
  2. Verify `[data-testid="button-main-send"]` is disabled
  3. Type text into input
  4. Verify send button becomes enabled
- **Expected:** Send button only enabled with input.

#### TC-DASH-052: Send message and receive response
- **Priority:** P1
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Login and navigate to `/`
  2. Type "Hello" into chat input
  3. Click send button or press Enter
  4. Verify user message appears right-aligned
  5. Wait for streaming indicator or response
  6. Verify bot response appears left-aligned
- **Expected:** Chat round-trip works: user message sent, bot responds.

#### TC-DASH-053: Chat Enter key sends message
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Type text into chat input
  2. Press Enter (without Shift)
  3. Verify message is sent (input clears, message appears)
- **Expected:** Enter key submits message.

#### TC-DASH-054: Chat Shift+Enter creates newline
- **Priority:** P3
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Type text into chat input
  2. Press Shift+Enter
  3. Verify input still has text and a newline (not submitted)
- **Expected:** Shift+Enter inserts newline, does not send.

#### TC-DASH-055: New conversation button resets chat
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Send a message to create conversation
  2. Click `[data-testid="button-main-chat-add"]` (Plus button)
  3. Verify messages cleared
  4. Verify input cleared
- **Expected:** New conversation starts fresh.

#### TC-DASH-056: Streaming indicator during response
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Send a message
  2. While waiting for response, check for `[data-testid="streaming-message"]`
  3. Verify wave-dot animation or status message visible
- **Expected:** Streaming indicator shows during AI response.

#### TC-DASH-057: Stop button appears during streaming
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Send a message
  2. While streaming, verify `[data-testid="button-main-stop"]` is visible
  3. Verify it replaces the send button
- **Expected:** Stop button available during streaming.

#### TC-DASH-058: Error state with retry button
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Intercept chat API to return error
  2. Send a message
  3. Verify `[data-testid="stream-error"]` appears
  4. Verify `[data-testid="button-retry"]` is present
- **Expected:** Error shown with retry option.

#### TC-DASH-059: Retry button resends last message
- **Priority:** P3
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Trigger chat error state
  2. Click retry button
  3. Verify streaming starts again
- **Expected:** Retry re-attempts the last message.

#### TC-DASH-060: Conversation resume via URL param
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Create a conversation and send a message
  2. Note the conversation ID
  3. Navigate to `/?conversationId={id}`
  4. Verify previous messages load
- **Expected:** URL param loads existing conversation.

#### TC-DASH-061: Chat messages persist across page reload
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Send a message and receive response
  2. Reload the page
  3. Verify messages are restored from DB
- **Expected:** Messages survive page reload.

---

### Section F: Suggestion Chips

#### TC-DASH-070: Suggestion chips render on load
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Login and navigate to `/`
  2. Verify "Try asking..." label visible
  3. Verify exactly 4 suggestion chip buttons (`[data-testid^="main-suggestion-"]`)
- **Expected:** 4 suggestion chips displayed.

#### TC-DASH-071: Suggestion chips are role-specific
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin, sales, service, marketing
- **Steps:**
  1. Login as org_admin, capture suggestion text
  2. Login as sales, capture suggestion text
  3. Login as service, capture suggestion text
  4. Login as marketing, capture suggestion text
  5. Verify org_admin chips drawn from management pool
  6. Verify sales chips drawn from sales pool
  7. Verify service chips drawn from service pool
  8. Verify marketing chips drawn from marketing pool
- **Expected:** Chips match role-specific suggestion pools.

#### TC-DASH-072: Clicking suggestion chip populates input
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Click `[data-testid="main-suggestion-0"]`
  2. Verify chat input now contains the suggestion text
  3. Verify input is focused
- **Expected:** Chip text fills the input field.

---

### Section G: Tiles Collapse Behavior

#### TC-DASH-080: Tiles visible on initial load
- **Priority:** P1
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Login and navigate to `/`
  2. Verify all 4 metric tiles are visible
  3. Verify toggle button is NOT visible (no messages sent yet)
- **Expected:** Tiles visible, no toggle button initially.

#### TC-DASH-081: Tiles auto-collapse after first message
- **Priority:** P1
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Login and navigate to `/`
  2. Send a chat message
  3. Wait for animation (500ms+)
  4. Verify tiles are collapsed (max-h-0, opacity-0)
  5. Verify `[data-testid="button-toggle-metrics"]` now visible with "Show" text
- **Expected:** Tiles collapse and toggle appears after first message.

#### TC-DASH-082: Toggle button expands/collapses tiles
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Send a message so tiles collapse
  2. Click `[data-testid="button-toggle-metrics"]` (should say "Show")
  3. Verify tiles are visible again
  4. Click toggle again (should say "Hide")
  5. Verify tiles collapse
- **Expected:** Toggle button controls tile visibility.

---

### Section H: Left Panel (SubMenuManager — AI Chat)

#### TC-DASH-090: Left panel shows Chat History and Favorites
- **Priority:** P1
- **Status:** COVERED (2.3)
- **Role(s):** org_admin
- **Steps:**
  1. Login and navigate to `/`
  2. Hover/click sidebar AI Chat item
  3. Verify `[data-testid="submenu-panel"]` visible
  4. Verify text includes "Chat History" or "Favorites"
- **Expected:** Left panel has history and favorites sections.

#### TC-DASH-091: Chat history lists previous conversations
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Create at least one conversation by sending a message
  2. Open left panel
  3. Verify conversation entries appear with `[data-testid^="panel-conversation-"]`
- **Expected:** Previous conversations listed in history.

#### TC-DASH-092: Resume conversation from history
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Create a conversation with messages
  2. Start a new conversation
  3. Open left panel and click a previous conversation
  4. Verify previous messages load
- **Expected:** Clicking history item resumes that conversation.

#### TC-DASH-093: Delete conversation from history
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Open left panel with conversations
  2. Click delete option on a conversation via `[data-testid^="menu-delete-"]`
  3. Verify conversation removed from list
- **Expected:** Conversation deleted from history.

#### TC-DASH-094: Favorites section — add and remove
- **Priority:** P3
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Open left panel
  2. Check favorites section (`[data-testid^="panel-favorite-"]`)
  3. If favorites exist, click remove `[data-testid^="panel-favorite-remove-"]`
  4. Verify removed from list
- **Expected:** Favorites can be managed.

#### TC-DASH-095: Collapse panel button
- **Priority:** P3
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Open left panel
  2. Click `[data-testid="button-collapse-chat-panel"]`
  3. Verify panel closes
- **Expected:** Panel collapse button works.

---

### Section I: Sidebar Navigation (from Dashboard)

#### TC-DASH-100: Sidebar items visible based on role
- **Priority:** P1
- **Status:** NEW
- **Role(s):** org_admin, sales, service, marketing
- **Steps:**
  1. Login as org_admin: verify AI Chat, TeamBox, Sales, Service, Marketing, Manage, System all visible
  2. Login as sales: verify AI Chat, TeamBox, Sales visible; Service, Marketing, Manage, System NOT visible
  3. Login as service: verify AI Chat, TeamBox, Service visible; Sales, Marketing, Manage, System NOT visible
  4. Login as marketing: verify AI Chat, TeamBox, Marketing visible; Sales, Service, Manage, System NOT visible
- **Expected:** Sidebar items filtered by RBAC per role.

#### TC-DASH-101: AI Chat sidebar item active on dashboard
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Login and navigate to `/`
  2. Verify `[data-testid="sidebar-item-ai-chat"]` has active indicator (purple left border)
- **Expected:** AI Chat item highlighted as active route.

#### TC-DASH-102: Sidebar navigation to other pages
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. From dashboard, click `[data-testid="sidebar-item-teambox"]`
  2. Verify navigation to `/teambox`
  3. Navigate back to `/`
  4. Click `[data-testid="sidebar-item-sales"]`
  5. Verify navigation to `/sales`
- **Expected:** Sidebar links navigate correctly.

#### TC-DASH-103: Sidebar collapse and expand
- **Priority:** P3
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. If sidebar has collapse control, click it
  2. Verify sidebar collapses to minimal width
  3. Click `[data-testid="button-show-sidebar"]` to expand
  4. Verify sidebar returns to 72px width
- **Expected:** Sidebar toggle works.

#### TC-DASH-104: Logout from sidebar
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Click `[data-testid="button-logout"]`
  2. Verify redirect to `/login`
- **Expected:** Logout clears session and redirects.

---

### Section J: TopBar Elements (from Dashboard Context)

#### TC-DASH-110: Org switcher visible for multi-org roles
- **Priority:** P2
- **Status:** NEW
- **Role(s):** partner_admin, super_admin
- **Steps:**
  1. Login as partner_admin
  2. Verify `[data-testid="button-org-switcher"]` visible
  3. Click it
  4. Verify `[data-testid="dropdown-org-switcher"]` opens with org options
- **Expected:** Multi-org users can switch organizations.

#### TC-DASH-111: Org switcher hidden for single-org roles
- **Priority:** P2
- **Status:** NEW
- **Role(s):** sales
- **Steps:**
  1. Login as sales
  2. Verify org switcher is either hidden or shows single org without dropdown
- **Expected:** Single-org users do not see org switching.

#### TC-DASH-112: Notifications bell and dropdown
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Login and navigate to `/`
  2. Verify `[data-testid="button-notifications"]` visible
  3. Click it
  4. Verify `[data-testid="dropdown-notifications"]` opens
  5. Verify either notification items or "No new notifications" empty state
- **Expected:** Notification dropdown accessible and functional.

#### TC-DASH-113: Mark all notifications read
- **Priority:** P3
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Open notifications dropdown
  2. If `[data-testid="button-mark-all-read"]` is present, click it
  3. Verify unread badge clears
- **Expected:** Mark-all-read clears notification badge.

#### TC-DASH-114: Activity feed dropdown
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Click `[data-testid="button-activity-feed"]`
  2. Verify `[data-testid="dropdown-activity"]` opens
  3. Verify activity items or empty/loading state
- **Expected:** Activity feed accessible with recent entries.

#### TC-DASH-115: Theme toggle (light/dark)
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Note current theme (check for Sun or Moon icon)
  2. Click `[data-testid="button-theme-toggle"]`
  3. Verify theme changes (icon toggles, page color scheme changes)
  4. Toggle back and verify original theme restored
- **Expected:** Theme toggle switches between light and dark modes.

#### TC-DASH-116: Profile menu dropdown
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Click `[data-testid="button-profile-menu"]`
  2. Verify `[data-testid="dropdown-profile"]` opens
  3. Verify items: Profile, Preferences, Take Tour, Logout
  4. Click `[data-testid="menu-item-profile"]`
  5. Verify navigation to `/profile`
- **Expected:** Profile menu with working navigation links.

#### TC-DASH-117: Globe button opens public page
- **Priority:** P3
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Verify `[data-testid="button-public-page"]` visible
  2. Click it
  3. Verify navigation to `/w/demo`
- **Expected:** Globe icon navigates to public landing page.

#### TC-DASH-118: Take Tour restarts product tour
- **Priority:** P3
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Open profile menu
  2. Click `[data-testid="menu-item-take-tour"]`
  3. Verify product tour overlay appears
- **Expected:** Tour can be restarted from profile menu.

---

### Section K: Role-Specific Dashboard Behavior

#### TC-DASH-120: Super admin sees all sidebar sections
- **Priority:** P1
- **Status:** NEW
- **Role(s):** super_admin
- **Steps:**
  1. Login as super_admin
  2. Verify sidebar shows: AI Chat, TeamBox, Sales, Service, Marketing, Manage, System
  3. Verify metric tiles render with org-scoped data
- **Expected:** Super admin has full access.

#### TC-DASH-121: Partner admin dashboard with multi-dealership
- **Priority:** P2
- **Status:** NEW (related to old TC-D07)
- **Role(s):** partner_admin
- **Steps:**
  1. Login as partner_admin
  2. Verify dashboard loads
  3. Verify org switcher visible with multiple organizations
  4. Switch org and verify metric tile values update
- **Expected:** Partner admin sees and can switch between multiple dealerships.

#### TC-DASH-122: Executive role dashboard access
- **Priority:** P2
- **Status:** NEW (related to old TC-D08)
- **Role(s):** executive
- **Steps:**
  1. Login as executive
  2. Verify dashboard loads with metric tiles
  3. Verify sidebar shows management-appropriate sections
  4. Verify System sidebar item is NOT visible (not admin)
- **Expected:** Executive has dashboard access with limited admin controls.

#### TC-DASH-123: Sales manager role dashboard
- **Priority:** P2
- **Status:** NEW
- **Role(s):** sales_manager (if test account exists)
- **Steps:**
  1. Login as sales_manager
  2. Verify dashboard loads
  3. Verify sidebar shows AI Chat, TeamBox, Sales only
  4. Verify suggestion chips from sales pool
- **Expected:** Sales manager has sales-scoped dashboard.

#### TC-DASH-124: Service role — limited sidebar
- **Priority:** P2
- **Status:** NEW
- **Role(s):** service
- **Steps:**
  1. Login as service
  2. Verify sidebar shows AI Chat, TeamBox, Service only
  3. Verify Sales, Marketing, Manage, System NOT visible
  4. Verify suggestion chips from service pool
- **Expected:** Service role has department-scoped access.

#### TC-DASH-125: Marketing role — limited sidebar
- **Priority:** P2
- **Status:** NEW
- **Role(s):** marketing
- **Steps:**
  1. Login as marketing
  2. Verify sidebar shows AI Chat, TeamBox, Marketing only
  3. Verify Sales, Service, Manage, System NOT visible
  4. Verify suggestion chips from marketing pool
- **Expected:** Marketing role has department-scoped access.

#### TC-DASH-126: Org-scoped metrics — different orgs show different data
- **Priority:** P2
- **Status:** NEW
- **Role(s):** partner_admin (or super_admin)
- **Steps:**
  1. Login as partner_admin
  2. Record metric values for default org
  3. Switch to a different org via org switcher
  4. Record new metric values
  5. Verify the query keys include orgId (data is org-scoped)
- **Expected:** Switching org changes metric data.

---

### Section L: Empty States and Error States

#### TC-DASH-130: Dashboard with no pipeline data (new org)
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Login to an org with no pipeline data (or intercept API to return zeros)
  2. Verify all 4 metric tiles show "0"
  3. Verify tiles still render without errors
- **Expected:** Tiles gracefully display zero values.

#### TC-DASH-131: Dashboard with API failure — metrics
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Intercept `/api/metrics/pipeline` to return 500
  2. Login and navigate to `/`
  3. Verify page still loads (chat still functional)
  4. Verify metric tiles show "0" or graceful fallback (undefined coalesces to 0)
- **Expected:** API failure does not crash page; tiles default to 0.

#### TC-DASH-132: Activity log API returns empty
- **Priority:** P3
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Open activity feed dropdown
  2. If no activity, verify `[data-testid="text-no-activity"]` with appropriate message
- **Expected:** Empty activity feed shows empty state text.

#### TC-DASH-133: Notifications empty state
- **Priority:** P3
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Open notifications dropdown
  2. If no notifications, verify `[data-testid="text-no-notifications"]` message
- **Expected:** Empty notifications show placeholder text.

#### TC-DASH-134: Slow load — metrics loading state
- **Priority:** P3
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Throttle network to Slow 3G
  2. Login and navigate to `/`
  3. Observe metric tiles render with "0" initially then update (or render skeleton)
- **Expected:** Page usable during slow load.

---

### Section M: Activity Log API

#### TC-DASH-140: Activity log API returns entries
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Login via API
  2. GET `/api/activity-log` with Bearer token
  3. Verify 200 response
  4. Verify returns array (may be empty for test org)
- **Expected:** Activity log endpoint returns array.

#### TC-DASH-141: Activity log API — limit parameter
- **Priority:** P3
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. GET `/api/activity-log?limit=5`
  2. Verify response has at most 5 entries
- **Expected:** Limit param caps returned entries.

#### TC-DASH-142: Activity log API — max limit enforced
- **Priority:** P3
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. GET `/api/activity-log?limit=999`
  2. Verify response has at most 100 entries (server enforces max)
- **Expected:** Server caps limit at 100.

#### TC-DASH-143: Activity log API requires auth
- **Priority:** P2
- **Status:** NEW
- **Role(s):** unauthenticated
- **Steps:**
  1. GET `/api/activity-log` without auth
  2. Verify 401
- **Expected:** Unauthenticated access rejected.

---

### Section N: Notifications API (TopBar Integration)

#### TC-DASH-150: Notifications API returns list
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Login via API
  2. GET `/api/notifications` with Bearer token
  3. Verify 200 with array response
- **Expected:** Notifications endpoint returns data.

#### TC-DASH-151: Unread count API
- **Priority:** P2
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. GET `/api/notifications/unread-count` with Bearer token
  2. Verify 200 with numeric count
- **Expected:** Unread count endpoint works.

#### TC-DASH-152: Mark notification read API
- **Priority:** P3
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. Get notification list
  2. PATCH `/api/notifications/{id}/read`
  3. Verify 200 response
  4. Verify unread count decrements
- **Expected:** Individual notification marked as read.

#### TC-DASH-153: Mark all notifications read API
- **Priority:** P3
- **Status:** NEW
- **Role(s):** org_admin
- **Steps:**
  1. POST `/api/notifications/mark-all-read`
  2. Verify 200
  3. GET unread count, verify 0
- **Expected:** Bulk mark-all-read clears unread count.

---

## Summary

| Category | Total | Covered | New |
|----------|------:|--------:|----:|
| A: Page Load & Structure | 8 | 4 | 4 |
| B: KPI Metric Tiles | 9 | 3 | 6 |
| C: Metric Detail Dialogs | 13 | 0 | 13 |
| D: Contact Detail View | 6 | 0 | 6 |
| E: AI Chat Interface | 12 | 0 | 12 |
| F: Suggestion Chips | 3 | 0 | 3 |
| G: Tiles Collapse | 3 | 0 | 3 |
| H: Left Panel | 6 | 1 | 5 |
| I: Sidebar Navigation | 5 | 0 | 5 |
| J: TopBar Elements | 9 | 0 | 9 |
| K: Role-Specific Behavior | 7 | 0 | 7 |
| L: Empty/Error States | 5 | 0 | 5 |
| M: Activity Log API | 4 | 0 | 4 |
| N: Notifications API | 4 | 0 | 4 |
| **TOTAL** | **94** | **8** | **86** |

### Priority Breakdown

| Priority | Count |
|----------|------:|
| P1 | 16 |
| P2 | 50 |
| P3 | 28 |
