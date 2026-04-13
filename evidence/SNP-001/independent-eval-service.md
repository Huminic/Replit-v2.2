# Independent Evaluation: Service / Campaigns

**Evaluator:** Independent Agent (no prior knowledge of fixes or implementation)
**Date:** 2026-04-07
**URL:** https://dev.huminicdev.com/service
**Account:** serra_honda@huminic.ai (org_admin, Serra Honda)
**Browser:** Playwright Chromium (headless)

---

## Evaluation Summary

| # | Check | Verdict | Severity |
|---|-------|---------|----------|
| 1 | Navigate to /service | PASS WITH RISK | Medium |
| 2 | Campaign list displayed | PASS | -- |
| 3 | Campaign detail modal opens | PASS | -- |
| 4 | Recipients table in modal | PASS WITH RISK | Low |
| 5 | Campaign stats (sent/delivered/replied) | PASS WITH RISK | Medium |
| 6 | Polling behavior / flickering | PASS WITH RISK | Medium |
| 7 | Create/upload functionality | PASS (code verified) | -- |
| 8 | Campaign status indicators | PASS | -- |

**Final Verdict: PASS WITH RISK**

---

## Item 1: Navigate to /service

### What happened
- Direct navigation via browser address bar (`goto('/service')`) consistently redirected to `/teambox` or `/login` after ~1-1.5 seconds. The /service component never renders on hard page reload.
- SPA navigation via sidebar click (`[data-testid="sidebar-item-service"]`) works correctly and renders the Service page.
- SPA navigation via `history.pushState('/service')` also renders the page correctly.
- The URL in the address bar sometimes shows `/` or `/settings/system` while the visual content correctly shows the Service section — a routing state desync.

### 8 Commentary Questions
1. **Is the element visible?** Yes, via sidebar click. No, via direct URL.
2. **Does the data appear real?** N/A for navigation.
3. **Is there a false-pass class?** The pushState approach makes the URL show /service but the DOM snapshot reports a different page — snapshot/visual desync, not a CSS trick.
4. **Does it function as expected?** Partially. Sidebar click works; direct URL fails.
5. **Is the interaction smooth?** Sidebar click is smooth. Direct URL causes a redirect flash.
6. **Are there console errors?** One 404 on a conversation messages endpoint. Not related to routing.
7. **Is the state consistent?** No. URL and rendered content can desync.
8. **Would a user notice?** Users navigating via sidebar would not notice. Users bookmarking /service or refreshing the page would be redirected away.

**Severity: MEDIUM** — Users lose their place on page refresh. Bookmarks to /service do not work.

---

## Item 2: Campaign list displayed

### What happened
- Two campaigns visible in the table:
  - "Service Reminder - February" (test-recipients.csv) — Active, SMS, 16 recipients, 0 sent, 0 replied
  - "Oil Change Reminder" (oil_change_due_march.csv) — Paused, SMS, 234 recipients, 0 sent, 0 replied
- Table columns: Campaign, Status, Channel, Recipients, Sent, Replied, Kill Switch, Actions
- Campaign names and CSV filenames displayed correctly
- Table has proper headers and row hover states

### 8 Commentary Questions
1. **Is the element visible?** Yes, full table with headers and 2 data rows.
2. **Does the data appear real?** Plausible test data — campaign names match automotive service use cases.
3. **Is there a false-pass class?** No hidden elements or CSS tricks detected.
4. **Does it function as expected?** Yes, list renders with correct columns.
5. **Is the interaction smooth?** Yes, no loading spinners observed on settled page.
6. **Are there console errors?** None related to campaign list.
7. **Is the state consistent?** Yes, data matches API response.
8. **Would a user notice?** No issues.

**Severity: NONE** — Campaign list renders correctly.

---

## Item 3: Campaign detail modal opens

### What happened
- Clicking a campaign row (`tr:has-text("Service Reminder")`) opens a Dialog component.
- Modal title: "Service Reminder - February" with subtitle "Campaign details and statistics"
- Modal displays: Status (Active, green dot), Channel (SMS badge), Recipients (16), Sent (0), Replied (0), Kill Switch status (OFF — Messages Flowing, green badge), CSV File (test-recipients.csv with download icon)
- Close button (X) present in top-right corner
- "Deactivate" button visible

### 8 Commentary Questions
1. **Is the element visible?** Yes, dialog renders as an overlay.
2. **Does the data appear real?** Matches the campaign row data exactly.
3. **Is there a false-pass class?** No — `[role="dialog"]` detected, 2 dialog elements counted (dialog + overlay).
4. **Does it function as expected?** Yes, click opens modal with correct campaign data.
5. **Is the interaction smooth?** Yes, opens immediately on click.
6. **Are there console errors?** None related to modal.
7. **Is the state consistent?** Modal stats match table row stats.
8. **Would a user notice?** No issues with the modal itself.

**Severity: NONE** — Campaign detail modal works correctly.

---

## Item 4: Recipients table in modal

### What happened
- Recipients table shows: Name, Phone, Status columns
- 16 recipients displayed (matches campaign recipientCount)
- All recipients have "pending" status (teal badge)
- Data includes: John Doe (5551234567), Jane Smith (5559876543) — these two repeat 3 times each, followed by unique names: Michael Davis, Karen Wilson, James Rodriguez, Nancy Taylor, etc.
- Phone numbers: first 6 are clearly test numbers (555-xxx), remaining use 205-555-xxxx pattern

### 8 Commentary Questions
1. **Is the element visible?** Yes, scrollable table within the modal.
2. **Does the data appear real?** Mixed — John Doe/Jane Smith repeated 3x each is clearly seed/test data. 205-area-code numbers are more plausible but still 555-prefixed.
3. **Is there a false-pass class?** No.
4. **Does it function as expected?** Yes, shows recipients with status.
5. **Is the interaction smooth?** Scrolling within the modal was not verifiable due to the SPA state issues — the dialog content appeared to not scroll when attempted.
6. **Are there console errors?** None.
7. **Is the state consistent?** Count (16) matches recipientCount in the campaign.
8. **Would a user notice?** Duplicate recipients (3x John Doe, 3x Jane Smith) may be confusing in production — but this is seed data, not a code bug.

**Severity: LOW** — Recipient data is test/seed quality. No deduplication of recipients with identical names/numbers. Email column absent (recipients have phone only — appropriate for SMS channel).

---

## Item 5: Campaign stats (sent, delivered, replied)

### What happened
- Both campaigns show 0 sent, 0 replied despite one being "Active"
- "Service Reminder - February" is Active with Kill Switch OFF (Messages Flowing) and 16 recipients, yet 0 messages sent
- No "Delivered" column — table shows Recipients, Sent, Replied only
- Service Metrics tab (Insights) shows: Active Campaigns: 1, Messages Sent: 0, Replies Received: 0, Open Conversations: 11

### 8 Commentary Questions
1. **Is the element visible?** Yes, stats are displayed.
2. **Does the data appear real?** Concerning — an "Active" campaign with "Messages Flowing" but 0 sent suggests either the campaign was never executed, or sends are blocked by something not visible in the UI.
3. **Is there a false-pass class?** No.
4. **Does it function as expected?** The display works. Whether the underlying campaign execution works is untestable without triggering a real send.
5. **Is the interaction smooth?** N/A.
6. **Are there console errors?** None related to stats.
7. **Is the state consistent?** Stats are internally consistent (0 sent, 0 replied across both views). But "Active + Messages Flowing + 0 Sent" is a confusing state.
8. **Would a user notice?** Yes — a user would expect an active campaign with messages flowing to have sent something. The distinction between "campaign status = active" and "campaign has been executed" is not clear in the UI.

**Severity: MEDIUM** — No "Delivered" count column. Active campaign with 0 sent is confusing. Users cannot tell if campaign execution was started without checking execution status. The `executionStatuses` query polls every 15s but the UI doesn't show execution state unless a campaign is actively executing.

---

## Item 6: Polling behavior / flickering

### What happened
- Observed 29 API requests in a 5-second window after SPA navigation to /service
- Includes requests for: widgets, activity-log, conversations, agents (3 departments), metrics/pipeline, organizations, notifications, users (2x), roles, outbound/status, widgets, settings/org, and a `POST /api/conversations` (write operation on navigation)
- `executionStatuses` query has `refetchInterval: 15000` (15-second polling)
- No visible flickering in rapid screenshot comparison (two screenshots 200ms apart were identical)

### 8 Commentary Questions
1. **Is the element visible?** N/A for polling.
2. **Does the data appear real?** N/A.
3. **Is there a false-pass class?** No.
4. **Does it function as expected?** Polling works. 15s interval for execution status is reasonable.
5. **Is the interaction smooth?** No visual flicker detected. However, 29 API requests on navigation is excessive — many are for other sections (sales agents, marketing agents, conversations) loaded by the AppContext/SubMenuManager, not the Service page itself.
6. **Are there console errors?** One 404 on a conversation messages endpoint.
7. **Is the state consistent?** Yes.
8. **Would a user notice?** No visual issues. The excessive API calls may cause sluggishness on slow connections.

**Severity: MEDIUM** — 29 API requests on page load is excessive. `POST /api/conversations` as a side effect of navigation is concerning (creates data on read). No visible flicker, but network overhead is high.

---

## Item 7: Create/upload functionality

### What happened (code-verified, not fully UI-tested due to navigation issues)

**New Campaign button:** Present in code (`data-testid="button-new-campaign"`), opens a dialog for creating campaigns. Supports multi-channel selection (checkboxes), message template input. Creates one campaign per selected channel.

**Upload CSV button:** Present in code (`data-testid="button-upload-csv"`), triggers a hidden file input. Supports per-campaign CSV upload and bulk upload. Shows success toast with recipient count and any warnings.

**CSV Template link:** Present (`data-testid="link-download-csv-template"`), links to `/campaign-template.csv` for download. Visible in the screenshot at top-right of campaign section.

**Per-row actions (code-verified):**
- Play button: Execute campaign (disabled if 0 recipients)
- Calendar button: Schedule campaign for a future date/time
- Eye button: Dry run (preview mode, no real sends)
- Upload button: Upload CSV to specific campaign
- When executing: shows progress badge (processed/total) and Stop button

### 8 Commentary Questions
1. **Is the element visible?** CSV Template link and Upload CSV button confirmed visible in screenshot. New Campaign button confirmed in earlier snapshot (ref=e116).
2. **Does the data appear real?** N/A for buttons.
3. **Is there a false-pass class?** No — buttons have real onClick handlers.
4. **Does it function as expected?** Code review confirms functional handlers. Not tested interactively due to navigation state issues.
5. **Is the interaction smooth?** Unknown — not interactively tested.
6. **Are there console errors?** None observed.
7. **Is the state consistent?** N/A.
8. **Would a user notice?** The action buttons in each row are small icons with no labels — tooltips help but the icons (Play, Calendar, Eye, Upload) may not be immediately obvious. Execute Campaign button lacks a confirmation dialog — one click sends real messages.

**Severity: NONE for presence.** Note: Execute Campaign has no confirmation dialog before sending real messages — this is a design risk, not a bug per se, but could cause accidental sends.

---

## Item 8: Campaign status indicators

### What happened
- Status column shows text with a colored dot indicator
- "active" — green dot (bg-green-500)
- "paused" — amber dot (bg-amber-500)
- Status color mapping also includes: draft (gray), completed (blue), scheduled (purple) — not visible with current data but defined in code
- Kill Switch column shows a toggle switch per campaign
  - When kill switch is OFF (messages flowing): switch is checked/blue
  - When kill switch is ON (messages blocked): switch is unchecked/red (`data-[state=unchecked]:bg-red-500`)
- Campaign detail modal shows Kill Switch status as a badge: "OFF — Messages Flowing" (green)

### 8 Commentary Questions
1. **Is the element visible?** Yes, both dot indicators and toggle switches visible.
2. **Does the data appear real?** Yes, status values are plausible.
3. **Is there a false-pass class?** No — status colors are applied via actual Tailwind classes matching real state.
4. **Does it function as expected?** Toggle switch has a mutation handler that sends PATCH to `/api/campaigns/{id}`. Colors correctly differentiate states.
5. **Is the interaction smooth?** Toggle has `onCheckedChange` handler with optimistic invalidation.
6. **Are there console errors?** None.
7. **Is the state consistent?** Yes — "Service Reminder" is Active with kill switch OFF; "Oil Change Reminder" is Paused with kill switch ON (red).
8. **Would a user notice?** The kill switch semantics are inverted from the visual — the toggle being "checked" (blue/on) means kill switch is OFF (messages flowing). This could confuse users who expect "on" to mean "killing." The Campaign Safety info card at the bottom helps explain this.

**Severity: NONE** — Status indicators function correctly. Kill switch inversion is a UX choice, not a bug.

---

## Cross-Cutting Findings

### F-SVC-01: /service route does not survive page refresh (MEDIUM)
Direct browser navigation to `https://dev.huminicdev.com/service` redirects to `/teambox` or `/login`. Only SPA navigation (sidebar click) works. This means:
- Bookmarks to /service are broken
- Page refresh loses the Service view
- Sharing the URL with colleagues does not work

**Evidence:** Navigation trace shows `/service` loads then `pushState` to `/teambox` within 1.5 seconds. Service component never mounts on hard navigation.

### F-SVC-02: 29 API requests on service page load (MEDIUM)
Navigation to /service triggers 29 API requests in 5 seconds, including data for unrelated sections (sales agents, marketing agents, all conversations). A `POST /api/conversations` fires as a side effect. This is wasteful and creates data on a read-only navigation.

**Evidence:** Network monitoring captured 29 requests including POST /api/conversations.

### F-SVC-03: Active campaign with 0 sent — ambiguous state (LOW)
"Service Reminder - February" shows Active status, Kill Switch OFF (Messages Flowing), 16 recipients, but 0 sent. The UI does not distinguish between "active but not yet executed" and "active and sending." Users cannot tell if they need to click the Play button.

### F-SVC-04: No deduplication warning for duplicate recipients (LOW)
The CSV upload created 3 copies each of "John Doe" and "Jane Smith" with the same phone numbers. No warning was shown about duplicates. In a real campaign, this would send 3 SMS messages to the same person.

### F-SVC-05: Execute Campaign has no confirmation dialog (LOW)
The Play button immediately starts sending real messages (or would, if outbound were enabled). No "Are you sure?" dialog. Combined with the ambiguous Active/Flowing state, a user could accidentally execute a campaign they thought was already running.

### F-SVC-06: No "Delivered" metric (LOW)
Table shows Sent and Replied but not Delivered. For SMS campaigns, delivery confirmation is important. Users cannot distinguish between "sent but not delivered" and "sent and delivered."

---

## Screenshots

| File | Description |
|------|-------------|
| eval-service-2000ms.png | Service page with campaigns tab (captured via rapid screenshot) |
| eval-service-02-campaigns-tab.png | Full campaigns table view |
| eval-service-04-campaign-detail-v2.png | Campaign detail modal — Service Reminder - February |
| eval-service-01-full.png | Service Insights tab with metrics |
| eval-service-08-fresh-click.png | Service page via sidebar navigation |

---

## Verdict

**PASS WITH RISK**

The Service/Campaigns section is functionally complete: campaigns display, detail modals open with recipient data, status indicators work, kill switch toggles function, create/upload/execute/schedule actions are wired. The code quality is solid with proper loading states, error handling, and mutation invalidation.

The primary risk is **F-SVC-01: the /service route breaking on direct navigation/refresh**. This is a real user-facing defect that would surface immediately in production when users try to bookmark or refresh the page. Secondary risks are the excessive API call volume (F-SVC-02) and the lack of execute confirmation (F-SVC-05).

None of the findings are blockers for the campaign management functionality itself — the features work correctly when accessed via the sidebar. The routing issue is a platform-level concern that affects /service along with potentially other SPA routes.
