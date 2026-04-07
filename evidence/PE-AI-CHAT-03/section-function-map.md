# PE-AI-CHAT-03 — Section Function Map & Use Case Inventory

**Page:** AI Chat / Main Dashboard (`client/src/pages/main.tsx`, route: `/`)
**Date:** 2026-04-07
**Type:** Research artifact — no code changes

---

## 1. Section Function Map

### 1.1 Metric Tiles (2x2 grid, top section)

| Element | What It Does | Data Source | Org-Scoped? | Test ID |
|---------|-------------|-------------|-------------|---------|
| Active Pipeline tile | Shows count of leads created in last 14 days (excl. Lost/Sold/Duplicate). Click opens drill-down dialog. | `GET /api/metrics/pipeline` → `storage.getPipelineMetrics(orgId)` | Yes — `req.user.organizationId` | `metric-tile-0` |
| Appointments Today tile | Shows count of scheduled appointments for today. Click opens drill-down dialog. | Same endpoint, `.appointmentsToday` field | Yes | `metric-tile-1` |
| Open Escalations tile | Shows count of active escalations in TeamBox. Trend arrow turns red if > 0. Click opens drill-down. | Same endpoint, `.openEscalations` field | Yes | `metric-tile-2` |
| Outbound Sent 24h tile | Shows count of outbound messages (SMS/email/voice) sent in last 24 hours. Click opens drill-down. | Same endpoint, `.outboundSent24h` field | Yes | `metric-tile-3` |
| Tile collapse/expand toggle | After user sends first message, tiles auto-collapse. Button toggles visibility. | Local state (`tilesCollapsed`, `hasSentMessage`) | N/A | `button-toggle-metrics` |
| Tile header | Static label "AI Key Metrics" | Static | N/A | `text-ai-key-metrics-title` |

**Visual design:** Each tile has gradient background (`from-X-500/15`), decorative SVG concentric circles (top-right), and an icon badge. Hover elevates.

### 1.2 Metric Detail Dialog (Drill-Down)

| Element | What It Does | Data Source | Test ID |
|---------|-------------|-------------|---------|
| Dialog container | Modal overlay showing metric breakdown. Opens on tile click. | N/A | `dialog-metric-detail` |
| Metric value display | Shows large numeric value + trend indicator + record count | From selected tile + detail query | `text-metric-detail-value` |
| Active Pipeline table | Name, Status, Vehicle, Lead ID columns. "View Contact" button per row if `sourceId` exists. | `GET /api/metrics/pipeline/details?metric=active_pipeline` | `table-active-pipeline` |
| Appointments Today table | Name, Phone (clickable), Email, Type, Time columns. | `GET /api/metrics/pipeline/details?metric=appointments_today` | `table-appointments` |
| Open Escalations table | Title, Type, Priority (color-coded), Created date columns. | `GET /api/metrics/pipeline/details?metric=open_escalations` | `table-escalations` |
| Outbound Sent 24h table | Recipient, Phone (clickable), Email, Channel, Sent time columns. | `GET /api/metrics/pipeline/details?metric=outbound_sent` | `table-outbound` |
| Loading/Error/Empty states | Shows "Loading records...", "Failed to load records", or "No records found" | Query state | `metric-detail-loading`, `metric-detail-error`, `metric-detail-empty` |
| Pagination note | Shows "showing first 100 of N records" when >= 100 results | Detail query count | Inline text |

**Data flow:** `GET /api/metrics/pipeline/details?metric={key}` → `storage.getPipelineMetricDetails(orgId, metric)`. For `active_pipeline`, a background enrichment process fetches VIN Solutions contact names for rows missing `customerName`.

### 1.3 Contact Detail View (nested inside drill-down)

| Element | What It Does | Data Source | Test ID |
|---------|-------------|-------------|---------|
| Back button | Returns to the lead table view within the dialog | Local state (`viewingContact`) | `button-back-to-leads` |
| Contact name | Full name from CRM or fallback to lead row `customerName` | `GET /api/vin/leads/{leadId}/contact` | `text-contact-name` |
| Contact status badge | Shows VIN Solutions status | From lead row `vinStatus` | `text-contact-status` |
| Phone row | Phone number with Call and Text action buttons | CRM contact or lead row fallback | `contact-phone-row`, `text-contact-phone` |
| Email row | Email address | CRM contact or lead row fallback | `contact-email-row`, `text-contact-email` |
| Location row | City, State, Zip | CRM contact (`city`, `state`, `zip`) | `contact-location-row`, `text-contact-location` |
| Company row | Company name | CRM contact | `contact-company-row`, `text-contact-company` |
| Vehicle of Interest | Vehicle details from lead | Lead row `vehicleOfInterest` | `contact-vehicle-row`, `text-contact-vehicle` |
| Call button | Opens `tel:` link to initiate phone call | Contact phone | `button-call-contact` |
| Text button | Opens `sms:` link to initiate SMS | Contact phone | `button-text-contact` |
| CRM error fallback | Amber warning when CRM fetch fails, shows cached info | Query error state | `contact-crm-error` |
| No info message | Shown when no phone or email is available | Contact data check | `contact-no-info` |

### 1.4 Chat Thread (center area)

| Element | What It Does | Data Source | Test ID |
|---------|-------------|-------------|---------|
| Message list (ScrollArea) | Auto-scrolling container for all chat messages | `messages` state, built from DB messages | ScrollArea ref `scrollRef` |
| User message bubble | Right-aligned, `bg-primary` background, plain text rendering | User input | `main-chat-message-{id}` |
| Assistant message bubble | Left-aligned, `bg-card` with border, Markdown-rendered via `MarkdownMessage` | AI response (streamed or from DB) | `main-chat-message-{id}` |
| Streaming indicator (wave dots) | Three dots with staggered animation (0s/0.15s/0.3s) shown while AI is generating before any content arrives | `isStreaming` && no `streamingContent` | `streaming-message` |
| Streaming content | Live-updating Markdown render with blinking cursor | `streamingContent` from SSE stream | `streaming-message` |
| Status message | Shows "Working..." or tool-use status during processing | SSE `status` events | Globe icon + text |
| ThinkingCard | Expandable card showing AI reasoning steps (Brain icon, summary, collapsible detail bullets) | `message.thinking` property | `thinking-card` |
| Stream error display | Red error banner with retry button | `streamError` state | `stream-error` |
| Retry button | Re-sends the last failed message | `lastFailedContent` | `button-retry` |
| Copy message button | Copies assistant message to clipboard (hover-revealed) | Message content | `button-copy-message` |
| Regenerate button | Re-sends last user message to get new AI response (only on last assistant message) | `lastUserContent` | `button-regenerate` |
| Chat error banner | Shown when conversation initialization fails. Click retries. | `chatError` state | `chat-error-banner` |

**Auto-scroll:** `useEffect` on `[messages, streamingContent]` sets `scrollRef.current.scrollTop = scrollRef.current.scrollHeight`.

**Streaming flow:** `useStreamingChat` hook → `POST /api/chat/{conversationId}/stream` (SSE) → events: `content` (text delta), `status` (tool use), `done`, `error`. Uses `AbortController` for cancellation.

**Message persistence:** Messages are stored in DB via `/api/conversations/{id}/messages`. On load, `dbMessages` query fetches history and maps to `ChatMessage[]`.

### 1.5 Chat Input Area (bottom section)

| Element | What It Does | Data Source | Test ID |
|---------|-------------|-------------|---------|
| New conversation button (+) | Clears all messages, resets conversation state, re-shows tiles | Local state reset | `button-main-chat-add` |
| Textarea input | Multi-line text input with auto-resize (1 row default, max 40 rows). Enter sends, Shift+Enter newline. | User typing | `input-main-chat` |
| Send button | Sends message when input is non-empty. Disabled when empty. | `inputValue.trim()` check | `button-main-send` |
| Stop button | Appears during streaming. Aborts the SSE stream via `AbortController`. Red destructive variant. | `isStreaming` state | `button-main-stop` |
| Gradient border wrapper | Purple gradient border with glow shadow around input area | CSS class `chat-input-gradient` | N/A |

**Send flow:** `handleSend()` → validates input → creates conversation if needed → adds user message to state → collapses tiles on first message → calls `streamSend(content)`.

### 1.6 Suggestion Buttons

| Element | What It Does | Data Source | Test ID |
|---------|-------------|-------------|---------|
| Suggestion chips | 4 role-based suggestion buttons. Click fills input and focuses textarea. | `getRandomSuggestions(currentRole)` from `chat-types.ts` | `main-suggestion-{i}` |
| "Try asking..." label | Static prompt with Sparkles icon | Static | N/A |

**Role mapping:** `sales`/`sales_manager` → sales suggestions; `service` → service; `super_admin`/`partner_admin`/`org_admin`/`executive` → management; default → generic suggestions. 4 random from pool of 8.

### 1.7 Chat History Sidebar (in SubMenuManager, not in main.tsx)

| Element | What It Does | Data Source | Test ID |
|---------|-------------|-------------|---------|
| Chat History section | Lists previous ai-chat conversations in left sidebar when on AI Chat page | `GET /api/conversations?channel=ai-chat` | N/A |
| Conversation item | Shows customer name, snippet. Click navigates to `/?conversationId={id}` which resumes that conversation. | Conversation records | N/A |
| Delete conversation | Dropdown menu item to delete a chat history entry | `DELETE /api/conversations/{id}` | `menu-resume-{id}` |
| Resume conversation | Clicking a history item or "Resume" menu item loads that conversation | URL param `?conversationId=X` → `useSearch()` in main.tsx | N/A |

**Resume flow:** URL param `?conversationId=X` → `useEffect` reads it → sets `conversationId` → clears URL → `dbMessages` query loads history → messages mapped to state.

### 1.8 Store/Org Context

| Element | What It Does | Data Source |
|---------|-------------|-------------|
| Organization context | `currentOrganization` from `AppContext` determines which org's data is shown | `useApp()` context |
| Org ID propagation | `orgId` is passed to pipeline query key and metric detail dialog | `currentOrganization?.id` |
| Persona name | AI assistant name (e.g., "Automa") from org settings | `currentOrganization.personaName` |
| Role-based suggestions | Suggestion chips change based on `currentRole` | `useApp().currentRole` |

**When org switches:** React Query keys include `orgId`, so switching orgs triggers refetch of `/api/metrics/pipeline` and all detail queries. The chat conversation is per-user (matched by `authUser.email`), not per-org.

---

## 2. Use Case Inventory

| UC-ID | Flow Name | Steps | Expected Outcome | Evidence Needed | Downstream Surfaces |
|-------|-----------|-------|-------------------|-----------------|---------------------|
| UC-CHAT-01 | Send message and receive AI response | 1. Type message in textarea 2. Press Enter or click Send 3. Observe streaming response | User message appears right-aligned. Wave dots show. Streaming text renders progressively with blinking cursor. Final message persists with Markdown formatting. | Screenshot of streaming in progress; screenshot of completed response; network capture of SSE stream | Message stored in DB; conversation list updated |
| UC-CHAT-02 | Auto-scroll on new messages | 1. Have several messages in thread 2. Send new message 3. Observe scroll position | ScrollArea scrolls to bottom when new messages or streaming content appears. `useEffect` on `[messages, streamingContent]` triggers scroll. | Screenshot showing latest message visible without manual scroll | N/A |
| UC-CHAT-03 | Store switching changes metrics | 1. Note metric values for current org 2. Switch to different org via org switcher 3. Observe metric tiles | Metric tiles reload with new org's data. Values change to reflect the selected org's pipeline, appointments, escalations, and outbound counts. | Screenshots of metrics before and after org switch; network tab showing new `/api/metrics/pipeline?orgId=X` request | Drill-down data also changes |
| UC-CHAT-04 | Click metric tile to open drill-down | 1. Click any metric tile (e.g., Active Pipeline) 2. Dialog opens with breakdown table 3. Verify data matches tile count | Dialog shows metric value, description, and table of records. Record count in footer matches or explains difference. | Screenshot of drill-down dialog; verify row count vs tile value; network capture of detail API call | Contact detail view (for pipeline) |
| UC-CHAT-05 | Drill-down contact detail is actionable | 1. Open Active Pipeline drill-down 2. Click "View Contact" on a row 3. Verify contact info and action buttons | Contact detail shows name, phone, email, location, vehicle. Call and Text buttons are present and functional (open tel:/sms: links). Back button returns to table. | Screenshot of contact detail view; verify Call/Text buttons enabled when phone exists; verify graceful handling when no phone | N/A |
| UC-CHAT-06 | Chat history shows previous conversations | 1. Send messages in a chat session 2. Navigate away from AI Chat page 3. Return to AI Chat 4. Check sidebar Chat History section | Previous conversations listed in sidebar. Clicking one loads `/?conversationId=X` and resumes with full message history. | Screenshot of chat history sidebar; screenshot of resumed conversation with prior messages | Main chat area |
| UC-CHAT-07 | Suggestion buttons populate input | 1. Observe suggestion chips below chat area 2. Click any suggestion chip 3. Verify textarea is populated and focused | Suggestion text fills the textarea. Focus moves to textarea. Suggestions are role-appropriate (sales, service, management, default). | Screenshot showing suggestions; verify text appears in input after click | Chat input → send flow |
| UC-CHAT-08 | Data plausibility across metric tiles | 1. View all 4 metric tiles 2. Compare values to each other for plausibility 3. Click each tile and verify drill-down record count matches | Tile values are non-negative integers. Active Pipeline should be >= 0. Appointments should be reasonable for a single day. Escalations should be a small number. Outbound should be plausible for 24h window. | Screenshots of all 4 tiles; comparison table of tile value vs drill-down row count | N/A |
| UC-CHAT-09 | New conversation button resets state | 1. Have active chat with messages 2. Click the + button in input area 3. Observe reset | Messages cleared, tiles expand, input cleared, conversation ID reset. Next message creates new conversation. | Screenshot before and after clicking + button | New conversation created in DB |
| UC-CHAT-10 | Stream abort (stop button) | 1. Send a message 2. While AI is streaming, click Stop button 3. Observe behavior | Streaming stops. Partial content remains visible. No error shown. DB query invalidated to fetch whatever was saved. | Screenshot of stop button visible during stream; screenshot after abort | N/A |
| UC-CHAT-11 | Error handling and retry | 1. Trigger a stream error (e.g., network issue) 2. Observe error display 3. Click Retry button | Red error banner shows with message. Retry button re-sends the last failed message. | Screenshot of error state with retry button | N/A |
| UC-CHAT-12 | Phone click-to-call in drill-down tables | 1. Open Appointments or Outbound drill-down 2. Click a phone number in the table | Phone numbers rendered as clickable links. Clicking opens `tel:` URI. Toast confirms "Calling {number}". | Screenshot of clickable phone; toast notification | External phone app |
| UC-CHAT-13 | Markdown rendering in AI responses | 1. Ask AI a question that produces formatted output (tables, lists, code) 2. Observe rendering | Bold, italic, lists, tables, code blocks, blockquotes, links all render correctly. Disallowed elements (script, iframe, etc.) are stripped. | Screenshot of rich Markdown response | N/A |
| UC-CHAT-14 | Copy and Regenerate message actions | 1. Hover over an assistant message 2. Click Copy button 3. On last assistant message, click Regenerate | Copy puts content in clipboard. Regenerate re-sends last user message for a new response. Actions only visible on hover. | Screenshot of hover actions; verify clipboard content; verify regenerate triggers new stream | N/A |

---

## 3. Acceptance Matrix (PE-AI-CHAT-03)

| AC-ID | Criterion | How to Verify | Evidence Tier | Pass Condition |
|-------|-----------|---------------|---------------|----------------|
| PE-AI-CHAT-03.AC1 | Section function map in interface terms | Review Section 1 above: every visible element documented with what it does, data source, org context, and test IDs | L1 (document review) | Map covers: chat area (input, messages, streaming, actions), metric tiles (all 4), drill-downs (all 4 tables + contact detail), store context (org switching), suggestion buttons, chat history sidebar |
| PE-AI-CHAT-03.AC2 | Chat response evaluated with evidence and commentary | Execute UC-CHAT-01: send message, capture SSE stream, screenshot streaming and final render. Evaluate auto-scroll (UC-CHAT-02), Markdown rendering (UC-CHAT-13), copy/regenerate (UC-CHAT-14) | L2 (authenticated functional) + L3 (visual) | AI response streams visibly, auto-scrolls, renders Markdown correctly, copy/regenerate work. Evidence: screenshots + network capture |
| PE-AI-CHAT-03.AC3 | Store switching evaluated for metric plausibility | Execute UC-CHAT-03: switch org, capture metrics before/after. Execute UC-CHAT-08: compare tile values to drill-down record counts | L2 (authenticated functional) | Metrics change when org changes. Values are plausible (non-negative, reasonable magnitude). Tile value matches or explains drill-down count |
| PE-AI-CHAT-03.AC4 | Metric tiles and drill-downs evaluated for truth | Execute UC-CHAT-04 for each tile: click tile, verify dialog opens with correct table schema, verify data loads or shows appropriate empty/error state. Cross-check tile count vs detail row count | L2 (authenticated functional) | All 4 tiles clickable. All 4 drill-down tables render correct columns. Loading/error/empty states work. Count consistency documented |
| PE-AI-CHAT-03.AC5 | Contact details evaluated for actionability | Execute UC-CHAT-05: open pipeline drill-down, click View Contact, verify all fields populate from CRM, verify Call/Text buttons functional. Test graceful degradation when CRM unavailable | L2 (authenticated functional) | Contact name, phone, email, location display. Call/Text buttons open tel:/sms: URIs. Back button works. CRM error shows amber warning with cached data |
| PE-AI-CHAT-03.AC6 | Every flow has evidence, commentary, and result | Each UC-ID above has defined steps, expected outcome, and evidence needed. Execution must produce screenshots/logs for each | L2-L3 (functional + visual) | Every UC-ID in inventory has at least one piece of evidence with PASS/FAIL result and commentary |
| PE-AI-CHAT-03.AC7 | Bugs logged with severity and false-pass classification | During execution, any deviation from expected outcome logged with: bug ID, severity (critical/high/medium/low), description, false-pass risk assessment | L2 (functional) | Bug log exists (even if empty). Each bug has severity and false-pass classification |
| PE-AI-CHAT-03.AC8 | Post-sprint confidence assessment | After all UCs executed, provide overall confidence rating with rationale | L4 (assessment) | Confidence assessment provided with per-section ratings and overall score |

---

## 4. API Endpoints Referenced

| Endpoint | Method | Auth | Purpose | Org-Scoped |
|----------|--------|------|---------|------------|
| `/api/metrics/pipeline` | GET | Token | Fetch 4 pipeline metric counts | Yes |
| `/api/metrics/pipeline/details?metric={key}` | GET | Token | Fetch drill-down records for a metric | Yes |
| `/api/vin/leads/{leadId}/contact` | GET | Token | Fetch CRM contact details for a lead | Yes |
| `/api/conversations?channel=ai-chat` | GET | Token | List user's AI chat conversations | Yes |
| `/api/conversations` | POST | Token | Create new conversation | Yes |
| `/api/conversations/{id}/messages` | GET | Token | Fetch messages for a conversation | No (by conv ID) |
| `/api/chat/{conversationId}/stream` | POST | Token | SSE streaming AI response | No (by conv ID) |
| `/api/conversations/{id}` | DELETE | Token | Delete a conversation | No (by conv ID) |

---

## 5. Key Files

| File | Role |
|------|------|
| `client/src/pages/main.tsx` | Main page component — chat UI, metric tiles, drill-down dialog, contact detail |
| `client/src/hooks/useStreamingChat.ts` | SSE streaming hook — manages stream lifecycle, abort, retry |
| `client/src/lib/chat-types.ts` | ChatMessage type, role-based suggestion pools, `getRandomSuggestions()` |
| `client/src/components/MarkdownMessage.tsx` | Markdown renderer with copy/regenerate actions |
| `client/src/components/layout/SubMenuManager.tsx` | Chat history sidebar (under ai-chat section) |
| `client/src/contexts/AppContext.tsx` | Org/role/persona context provider |
| `server/routes/metrics.ts` | Pipeline metrics + detail drill-down endpoints |
| `server/routes/chat.ts` | AI chat streaming endpoint (Anthropic SDK + tool use) |
| `server/routes/conversations.ts` | Conversation CRUD + message retrieval |

---

## 6. User Stories Mapped

| Story ID | Title | Relevance to AI Chat Page |
|----------|-------|---------------------------|
| US-006 | CRM Guru Pre-Call Research | Natural language CRM queries via chat interface |
| US-007 | Sales Manager Pipeline Review | Pipeline metric tile + drill-down |
| US-016 | AI Chat List Generation | Service advisor querying for lists via chat |
| US-023 | Sales Manager Metric Review | 4 metric tiles with drill-down |
| US-024 | Org Admin Source Analysis | Metric data scoped by org |
| US-025 | Executive Demand Score Insight | AI insights via chat |
| US-029 | Communication Agent Email Draft | Drafting via chat interface |
| US-030 | CRM Guru Cross-Reference | Cross-reference queries via chat |
