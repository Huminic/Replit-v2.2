# T-002 Test Plan: AI Chat Domain

Sprint: T-002
Domain: 03 — Chat & AI Agents
Generated: 2026-03-31
Source files analyzed:
- `tests/e2e/domain-03-chat.spec.ts` (11 existing tests: 3.1-3.11)
- `server/routes/chat.ts` (SSE streaming endpoint, tool use: web_search, vin_query_leads, vin_lead_summary, query_campaigns)
- `server/routes/conversations.ts` (CRUD, messages, email send, auto-greeting)
- `server/routes/agents.ts` (CRUD, triggers, RBAC role 3+)
- `server/routes/documents.ts` (upload with multer, CSV parsing, check-duplicate, delete)
- `server/routes/favorites.ts` (add/remove/list favorites by userId)
- `client/src/pages/main.tsx` (main chat page, pipeline metrics, conversation create/resume, streaming)
- `client/src/pages/agents.tsx` (agent detail page with dedicated chat per agent)
- `client/src/hooks/useStreamingChat.ts` (SSE parsing, abort, retry)
- `client/src/components/MarkdownMessage.tsx` (markdown rendering, copy, regenerate)
- `client/src/components/layout/SubMenuManager.tsx` (chat history list, favorites, conversation resume/delete)
- `client/src/lib/chat-types.ts` (role-based suggestions, ThinkingBlock type)
- `client/src/lib/rbac.ts` (section permissions per role, ai-chat access)
- `shared/schema.ts` (conversations table, messages table)

---

## Existing Coverage (3.1-3.11)

| ID   | Name | What it tests | Coverage level |
|------|------|---------------|----------------|
| 3.1  | Agent listings per role in left menu | GET /api/agents for orgAdmin and sales | API only — no UI agent visibility check |
| 3.2  | Center chat layout on home page | Chat input exists and is roughly centered | UI layout only — no functional chat |
| 3.3  | Thinking indicators visible | Sends message, checks for wave-dot/thinking selectors | UI smoke — may not actually trigger thinking |
| 3.4  | Web search tool works | Creates conversation, POSTs to stream endpoint | API smoke — no response body validation |
| 3.5  | General knowledge works | Creates conversation, POSTs to stream endpoint | API smoke — no response body validation |
| 3.6  | VIN data queries return real data | Creates conversation, POSTs to stream endpoint | API smoke — no response body validation |
| 3.7  | Conversational tone | Creates conversation, POSTs to stream endpoint | API smoke — no response body validation |
| 3.8  | Multi-org awareness for Super Admin | Creates conversation as superAdmin, POSTs to stream | API smoke — no org-switching validation |
| 3.9  | Empty CRM shows graceful message | Creates conversation, asks about zero leads | API smoke — no response content check |
| 3.10 | Document upload works | check-duplicate + list documents endpoints | API only — no actual file upload tested |
| 3.11 | Agent CRUD works (admin only) | POST/PATCH/DELETE agent, sales 403 check | API CRUD + RBAC |

**Gaps in existing tests:** All stream tests (3.4-3.9) only verify status < 500. No SSE parsing, no content validation, no streaming event verification. No UI-level chat interaction tests beyond 3.2/3.3. No conversation CRUD tests. No favorites tests. No chat history navigation tests.

---

## NEW Test Cases

### A. Chat Input & Sending

| ID | Name | Priority | Steps | Expected Result |
|----|------|----------|-------|-----------------|
| TC-CHAT-001 | Send message via Enter key | P0 | 1. Login as orgAdmin, navigate to `/`. 2. Wait for chat textarea to appear. 3. Fill textarea with "Hello". 4. Press Enter. | User message bubble appears right-aligned with "Hello". Textarea clears. Streaming indicator appears. |
| TC-CHAT-002 | Shift+Enter inserts newline | P1 | 1. Login, navigate to `/`. 2. Fill textarea with "Line 1". 3. Press Shift+Enter. 4. Type "Line 2". | Textarea contains two lines. Message is NOT sent. |
| TC-CHAT-003 | Send button disabled when empty | P1 | 1. Login, navigate to `/`. 2. Locate send button. 3. Check disabled state with empty input. 4. Type a character. 5. Check disabled state again. | Button disabled when empty, enabled when text present. |
| TC-CHAT-004 | Send button click sends message | P1 | 1. Login, navigate to `/`. 2. Type "Test message". 3. Click send button. | Message sent, bubble appears, input clears. |
| TC-CHAT-005 | Whitespace-only input rejected | P2 | 1. Login, navigate to `/`. 2. Fill textarea with spaces/newlines only. 3. Try to send. | Message not sent. Send button remains disabled or no message bubble appears. |
| TC-CHAT-006 | Suggestion chip populates input | P1 | 1. Login, navigate to `/`. 2. Click a suggestion chip (e.g. `[data-testid^="agent-suggestion"]` on agents page or suggestion buttons on main). | Input field populated with suggestion text. |

### B. AI Response & Streaming

| ID | Name | Priority | Steps | Expected Result |
|----|------|----------|-------|-----------------|
| TC-CHAT-010 | SSE stream returns content events | P0 | 1. Login as orgAdmin via API. 2. Create conversation via POST /api/conversations. 3. POST to `/api/chat/{id}/stream` with `{ content: "What is 2+2?" }`. 4. Parse SSE response. | Response contains `data: {"type":"status",...}` then `data: {"type":"content",...}` events, ending with `data: {"type":"done"}`. |
| TC-CHAT-011 | Streaming content renders progressively (UI) | P1 | 1. Login, navigate to `/`. 2. Send a message. 3. Observe `[data-testid="streaming-message"]` element. | Streaming message element appears during response. Content grows progressively. Element replaced by final message after done. |
| TC-CHAT-012 | Status messages display during tool use | P1 | 1. Login, navigate to `/`. 2. Send "Search the web for today's news". 3. Watch for status indicator. | Status message like "Searching the web..." appears before content streams. Globe icon pulses during status. |
| TC-CHAT-013 | Wave-dot thinking animation | P1 | 1. Login, navigate to `/`. 2. Send a message. 3. Check for `.wave-dot` elements before content arrives. | Three wave-dot spans visible with staggered animation (0s, 0.15s, 0.3s delays). |
| TC-CHAT-014 | Abort stream via stop button | P2 | 1. Login, navigate to `/`. 2. Send a message. 3. While streaming, click stop button `[data-testid="button-agent-stop"]`. | Streaming stops. Partial content preserved. Stop button replaced by send button. |
| TC-CHAT-015 | Error display and retry | P1 | 1. Force a stream error (e.g., invalid conversation ID). 2. Check for `[data-testid="stream-error"]`. 3. Click retry button. | Error message displayed with AlertCircle icon. Retry button `[data-testid="button-retry"]` re-sends last failed message. |
| TC-CHAT-016 | Markdown rendering in responses | P1 | 1. Login via API. 2. Create conversation. 3. Send message that elicits markdown (e.g., "List 3 things about cars as bullet points"). 4. Verify response in UI. | MarkdownMessage renders lists, bold, links. Code blocks use `<pre>` with monospace. Tables render with borders. |
| TC-CHAT-017 | Copy message action | P2 | 1. Login, navigate to `/`. 2. Send message, wait for response. 3. Hover over assistant message. 4. Click copy button `[data-testid="button-copy-message"]`. | Message actions appear on hover. Copy writes content to clipboard. Check icon appears briefly after copy. |
| TC-CHAT-018 | Regenerate last response | P2 | 1. Login, navigate to `/`. 2. Send message, wait for response. 3. Hover over last assistant message. 4. Click regenerate `[data-testid="button-regenerate"]`. | New streaming response generated for the same user message. Regenerate only shown on last assistant message. |
| TC-CHAT-019 | Content body required (400) | P1 | 1. Login via API. 2. Create conversation. 3. POST to `/api/chat/{id}/stream` with empty body. | Returns 400 with `{ message: "Message content is required" }`. |
| TC-CHAT-020 | Stream endpoint requires auth (401) | P0 | 1. POST to `/api/chat/{uuid}/stream` without auth header. | Returns 401. |

### C. Tool Use

| ID | Name | Priority | Steps | Expected Result |
|----|------|----------|-------|-----------------|
| TC-CHAT-030 | Web search tool invoked and results displayed | P1 | 1. Login via API. 2. Create conversation. 3. Send "Search the web for Claude AI latest news". 4. Parse SSE events. | Status event "Searching the web..." appears. Content includes information from web results. Response does not error. |
| TC-CHAT-031 | VIN query leads tool | P1 | 1. Login via API. 2. Create conversation. 3. Send "Show me recent leads from the last 30 days". 4. Parse SSE events. | Status event "Querying VinSolutions CRM..." appears. Response includes lead data or graceful "no data" message. |
| TC-CHAT-032 | VIN lead summary tool | P1 | 1. Login via API. 2. Create conversation. 3. Send "Give me a summary of our sales metrics". 4. Parse SSE events. | Status event "Fetching sales metrics from VinSolutions..." appears. Response includes metrics or integration check suggestion. |
| TC-CHAT-033 | Campaign query tool | P1 | 1. Login via API. 2. Create conversation. 3. Send "How are our campaigns performing?". 4. Parse SSE events. | Status event "Checking campaign data..." appears. Response references campaign data or says none found. |
| TC-CHAT-034 | Tool use MAX_TOOL_ROUNDS limit (3 rounds) | P3 | 1. Verify in code that MAX_TOOL_ROUNDS = 3. 2. Send query that might trigger multiple tool calls. | At most 3 rounds of tool use before final response. Server does not hang. |
| TC-CHAT-035 | CRM Guru mode activates stricter data sourcing | P2 | 1. Login via API. 2. Create conversation. 3. POST with `{ content: "Show leads", mode: "crm_guru" }`. | Response uses VinSolutions data first. Data attribution includes source markers. |

### D. Conversation CRUD

| ID | Name | Priority | Steps | Expected Result |
|----|------|----------|-------|-----------------|
| TC-CHAT-040 | Create conversation | P0 | 1. Login as orgAdmin via API. 2. POST /api/conversations with `{ customerName, channel: "ai-chat" }`. | Returns 201 with conversation object including id, organizationId, channel. |
| TC-CHAT-041 | List conversations with filters | P1 | 1. Login via API. 2. GET /api/conversations. 3. GET /api/conversations?channel=ai-chat. 4. GET /api/conversations?status=open. | Returns arrays. Filtered results only contain matching channel/status. |
| TC-CHAT-042 | Get single conversation | P1 | 1. Create conversation. 2. GET /api/conversations/{id}. | Returns conversation object matching created data. |
| TC-CHAT-043 | Update conversation status | P1 | 1. Create conversation. 2. PATCH /api/conversations/{id} with `{ status: "closed" }`. | Returns updated conversation. Status changed. |
| TC-CHAT-044 | Delete conversation (admin only) | P0 | 1. Create conversation as orgAdmin. 2. DELETE /api/conversations/{id}. 3. GET same ID. | DELETE returns success. Subsequent GET returns 404. |
| TC-CHAT-045 | Delete conversation forbidden for sales | P1 | 1. Login as sales. 2. Attempt DELETE /api/conversations/{id} (requires role level 3). | Returns 403. |
| TC-CHAT-046 | Cross-org conversation access denied | P1 | 1. Login as orgAdmin (Serra Honda). 2. Create conversation. 3. Login as different orgAdmin (Serra Nissan). 4. GET /api/conversations/{id}. | Returns 403 (different org, role level > 2). |
| TC-CHAT-047 | Get messages for conversation | P0 | 1. Create conversation. 2. POST message to it. 3. GET /api/conversations/{id}/messages. | Returns array with the posted message. |
| TC-CHAT-048 | Post message to conversation | P1 | 1. Create conversation. 2. POST /api/conversations/{id}/messages with `{ role: "user", content: "test" }`. | Returns 201 with message object. conversationId matches. |
| TC-CHAT-049 | Stale ai-chat conversation cleanup | P2 | 1. Create ai-chat conversation with customerEmail. 2. Create another ai-chat conversation with same customerEmail. 3. Verify first one (if it had <= 1 message) is deleted. | Old empty conversations auto-cleaned on new conversation creation. |
| TC-CHAT-050 | Resume conversation via URL param | P1 | 1. Login, navigate to `/?conversationId={existingId}`. 2. Verify messages load. | Previous conversation messages displayed. Input ready for new messages. |

### E. Conversation History (SubMenuManager Left Panel)

| ID | Name | Priority | Steps | Expected Result |
|----|------|----------|-------|-----------------|
| TC-CHAT-060 | Chat history list in sidebar | P1 | 1. Login as orgAdmin. 2. Create multiple ai-chat conversations with messages. 3. Open ai-chat sidebar panel. | Chat History section shows conversations with relative timestamps ("2 hours ago"). |
| TC-CHAT-061 | Click conversation in history resumes it | P1 | 1. Open sidebar. 2. Click a conversation entry `[data-testid^="panel-conversation-"]`. | Navigates to `/?conversationId={id}`. Messages from that conversation load in chat. |
| TC-CHAT-062 | Delete conversation from history | P1 | 1. Open sidebar. 2. Hover conversation entry. 3. Click three-dot menu `[data-testid^="button-conv-menu-"]`. 4. Click Delete. | Conversation removed from list. DELETE API called. |
| TC-CHAT-063 | Empty chat history state | P2 | 1. Login as user with no conversations. 2. Open sidebar. | Shows "No chat history yet" message. |

### F. Favorites

| ID | Name | Priority | Steps | Expected Result |
|----|------|----------|-------|-----------------|
| TC-CHAT-070 | Add favorite via API | P1 | 1. Login via API. 2. POST /api/favorites with valid data. | Returns 201 with favorite object. |
| TC-CHAT-071 | List favorites | P1 | 1. Add a favorite. 2. GET /api/favorites. | Returns array containing the added favorite. |
| TC-CHAT-072 | Remove favorite via API | P1 | 1. Add a favorite. 2. DELETE /api/favorites/{id}. 3. GET /api/favorites. | Favorite removed. List no longer contains it. |
| TC-CHAT-073 | Favorites display in sidebar | P2 | 1. Add favorites. 2. Open ai-chat sidebar panel. | Favorites section shows starred items with amber star icon. |
| TC-CHAT-074 | Remove favorite from sidebar | P2 | 1. Have favorites. 2. Hover favorite in sidebar. 3. Click X button `[data-testid^="panel-favorite-remove-"]`. | Favorite removed from list. |
| TC-CHAT-075 | Empty favorites state | P2 | 1. No favorites. 2. Open sidebar. | Shows "Star pages to access them quickly" text. |

### G. Agent Selection & Per-Agent Chat

| ID | Name | Priority | Steps | Expected Result |
|----|------|----------|-------|-----------------|
| TC-CHAT-080 | Agent page empty state | P1 | 1. Login, navigate to /agents with no agent selected. | Shows "Select an Agent" prompt with Bot icon and Create button. |
| TC-CHAT-081 | Agent chat creates dedicated conversation | P1 | 1. Navigate to /agents. 2. Select an agent. 3. Verify conversation created with channel `agent-chat-{agentId}`. | Conversation exists with correct channel. Greeting message from agent appears. |
| TC-CHAT-082 | Send message to specific agent | P1 | 1. Select agent. 2. Type message in agent chat input `[data-testid="input-agent-chat"]`. 3. Click send `[data-testid="button-agent-send"]`. | Message sent. Stream response includes agent context (agent name, department, instructions). |
| TC-CHAT-083 | Agent suggestion chips | P2 | 1. Select agent. 2. Verify suggestion chips visible. 3. Click one. | Input populated with suggestion text. |
| TC-CHAT-084 | Resume existing agent conversation | P2 | 1. Select agent with existing conversation. 2. Verify previous messages load. | Messages from prior session displayed. No duplicate conversation created. |
| TC-CHAT-085 | Agent-scoped document context | P2 | 1. Upload document with agentId set. 2. Chat with that agent. | Agent's knowledge base includes the uploaded document. Non-agent docs also available. |
| TC-CHAT-086 | Page context passed to stream | P2 | 1. Login. 2. Send message with pageContext parameter. | System prompt includes "the user is currently viewing: {pageContext}". |

### H. Role-Based Access

| ID | Name | Priority | Steps | Expected Result |
|----|------|----------|-------|-----------------|
| TC-CHAT-090 | All roles can access ai-chat section | P0 | 1. For each role (super_admin, partner_admin, org_admin, executive, sales_manager, sales, service, marketing): verify `canAccessSection(role, 'ai-chat')` returns true. | All 8 roles have ai-chat in defaultSectionsByRole. |
| TC-CHAT-091 | Sales user can list agents | P1 | 1. Login as sales. 2. GET /api/agents. | Returns 200 with agent array (read access for all authenticated users). |
| TC-CHAT-092 | Sales user cannot create agents | P0 | 1. Login as sales. 2. POST /api/agents. | Returns 403 (requireRole(3) blocks). |
| TC-CHAT-093 | Sales user cannot delete conversations | P1 | 1. Login as sales. 2. DELETE /api/conversations/{id}. | Returns 403 (requireRole(3) on delete). |
| TC-CHAT-094 | Role-based suggestion chips | P2 | 1. Login as sales. 2. Navigate to main page. 3. Check suggestion text. | Suggestions come from sales pool (e.g., "Show today's lead activity"). |

### I. Multi-Org

| ID | Name | Priority | Steps | Expected Result |
|----|------|----------|-------|-----------------|
| TC-CHAT-100 | Super admin can create conversation | P1 | 1. Login as superAdmin. 2. POST /api/conversations. 3. POST to /api/chat/{id}/stream. | Conversation created. Chat responds with multi-org awareness context. |
| TC-CHAT-101 | Conversations scoped to organization | P1 | 1. Login as orgAdmin (Serra Honda). 2. Create conversation. 3. Login as orgAdmin (Serra Nissan). 4. GET /api/conversations. | Serra Nissan list does not include Serra Honda conversations. |
| TC-CHAT-102 | Super admin cross-org access | P2 | 1. Login as superAdmin. 2. GET /api/conversations/{id} for any org. | Access granted (roleLevel <= 2 bypasses org check). |

### J. Document Upload

| ID | Name | Priority | Steps | Expected Result |
|----|------|----------|-------|-----------------|
| TC-CHAT-110 | Upload text document | P1 | 1. Login as orgAdmin. 2. POST /api/documents with multipart file (txt). | Returns 201 with document object. Content extracted and stored. |
| TC-CHAT-111 | Upload CSV document with row indexing | P1 | 1. Upload CSV file with header + data rows. | Parent document created. Individual csv-row documents created per row. csvRowsCreated count returned. |
| TC-CHAT-112 | Reject empty file | P2 | 1. Upload 0-byte file. | Returns 400 "File is empty". |
| TC-CHAT-113 | Reject file over 5MB | P2 | 1. Upload file > 5MB. | Returns 413 "File too large. Maximum upload size is 5MB." |
| TC-CHAT-114 | Check duplicate document | P1 | 1. Upload document. 2. POST /api/documents/check-duplicate with same filename. | Returns `{ isDuplicate: true, existingDocument: {...} }`. |
| TC-CHAT-115 | Replace existing document | P2 | 1. Upload document. 2. Upload same filename with replaceExisting=true. | Old document deleted. New document created. |
| TC-CHAT-116 | Delete document (admin only) | P1 | 1. Upload document. 2. DELETE /api/documents/{id}. | Document and associated csv-row children deleted. |
| TC-CHAT-117 | List documents with agentId filter | P2 | 1. Upload doc with agentId. 2. Upload doc without agentId. 3. GET /api/documents?agentId={id}. | Filtered list returns only agent-scoped doc. |
| TC-CHAT-118 | Malformed CSV rejected | P2 | 1. Upload CSV with unbalanced quotes or mismatched columns. | Returns 400 with descriptive error about malformed rows. |

### K. Error Handling

| ID | Name | Priority | Steps | Expected Result |
|----|------|----------|-------|-----------------|
| TC-CHAT-120 | Chat on non-existent conversation | P1 | 1. POST to /api/chat/{random-uuid}/stream. | Returns 404 "Conversation not found". |
| TC-CHAT-121 | Stream error sent as SSE event | P2 | 1. Trigger server error during streaming (e.g., after headers sent). | SSE error event: `data: {"type":"error","message":"..."}`. Connection closes. |
| TC-CHAT-122 | Network disconnection during stream (UI) | P3 | 1. Start streaming. 2. Kill network. | useStreamingChat sets error state. Error message displayed. Retry available. |
| TC-CHAT-123 | Conversation not found returns 404 | P1 | 1. GET /api/conversations/{non-existent-uuid}. | Returns 404. |
| TC-CHAT-124 | Invalid conversation update data | P2 | 1. PATCH /api/conversations/{id} with `{ status: 123 }`. | Returns 400 with validation errors. |

### L. Conversation Email (within conversation)

| ID | Name | Priority | Steps | Expected Result |
|----|------|----------|-------|-----------------|
| TC-CHAT-130 | Send email from conversation | P2 | 1. Create conversation. 2. POST /api/conversations/{id}/email with `{ to, subject, body }`. | Returns 200 `{ success: true }`. Message logged in conversation. Activity log created. |
| TC-CHAT-131 | Email missing required fields | P2 | 1. POST /api/conversations/{id}/email with missing `to`. | Returns 400 "Missing required fields: to, subject, body". |

### M. Pipeline Metrics (Dashboard Context)

| ID | Name | Priority | Steps | Expected Result |
|----|------|----------|-------|-----------------|
| TC-CHAT-140 | Metric tiles visible before first message | P1 | 1. Login, navigate to `/`. 2. Verify metric tiles visible. | 4 metric tiles (Active Pipeline, Appointments Today, Open Escalations, Outbound Sent 24h) visible in grid. |
| TC-CHAT-141 | Metric tiles collapse after first message | P1 | 1. Send first message. 2. Check tiles state. | Tiles animate to collapsed state. Toggle button appears to show/hide. |
| TC-CHAT-142 | Metric tile click opens detail dialog | P1 | 1. Click a metric tile `[data-testid^="metric-tile-"]`. | Dialog opens `[data-testid="dialog-metric-detail"]` with breakdown table and value. |

---

## Priority Summary

| Priority | Count | Description |
|----------|-------|-------------|
| P0       | 5     | Must-have: auth gate, send message, conversation create, role access, RBAC block |
| P1       | 33    | Core functionality: streaming, tools, CRUD, history, favorites, documents, metrics |
| P2       | 20    | Important but lower risk: edge cases, UI polish, suggestions, abort, CRM guru |
| P3       | 3     | Nice-to-have: tool round limits, network disconnection, max concurrent |

**Total new test cases: 61**
**Existing coverage: 11 (3.1-3.11)**
**Grand total: 72 test cases**

---

## Key Architectural Notes

1. **Chat streaming uses SSE**, not WebSocket. Endpoint: `POST /api/chat/:conversationId/stream`. Events: `status`, `content`, `done`, `error`.
2. **Conversations are per-org.** Access checks use `organizationId` match + `roleLevel` (level <= 2 = super/partner admin can access cross-org).
3. **Agent chat uses dedicated channel**: `agent-chat-{agentId}`. Each user gets one conversation per agent, auto-created on first visit.
4. **Main page creates a new conversation on each visit** (not per session). Old empty conversations with same email are auto-cleaned.
5. **Tool use is server-side only.** Client sees status messages during tool execution. Max 3 tool rounds per request.
6. **Document upload is 5MB max**, multer-based. CSV files are split into per-row documents for knowledge base indexing.
7. **Conversation delete requires role level 3** (org_admin or higher). Messages cascade-delete with conversation.
8. **Favorites are per-user** (not per-org). They represent starred pages/paths, displayed in the ai-chat sidebar panel.
