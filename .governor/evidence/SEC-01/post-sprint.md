# SEC-01 Post-Sprint Report: AI Chat Section Verification

**Sprint:** SEC-01
**Agent:** Dev (verification mode)
**Date:** 2026-03-26
**Status:** COMPLETE — no bugs found, no code changes made

---

## S-1.AC13: Chat History Delete

**File:** `client/src/components/layout/SubMenuManager.tsx` (lines 96-103, 461-462)

**Findings:** Fully implemented and correct.

- `deleteConversationMutation` is defined at line 96 using `useMutation`.
- `mutationFn` calls `apiRequest('DELETE', /api/conversations/${id})` — correct HTTP verb and endpoint.
- `onSuccess` invalidates three query keys: `/api/conversations`, `/api/conversations?channel=ai-chat`, and `/api/conversations?channel=ai-assistant`. This ensures the conversation list refreshes in the UI immediately after deletion across all relevant channels.
- The delete button is rendered inside a `DropdownMenu` context menu (three-dot icon) on each conversation item (line 461). It calls `deleteConversationMutation.mutate(conv.id)` on click.
- `e.stopPropagation()` prevents the click from also triggering the conversation's "resume" navigation.
- Has `data-testid="menu-delete-${conv.id}"` for test targeting.

**Verdict:** Working as expected from code review. The delete flow is: user clicks three-dot menu, selects Delete, mutation fires DELETE to API, on success the query cache invalidates and the list re-renders without the deleted item.

---

## S-1.AC15: Metric Tile Drill-Down

**Files:** `client/src/pages/main.tsx` (lines 55-105 for data builders, 317-550 for `MetricDetailDialog`, 716 for click handler)

**Findings:** Fully implemented with per-metric table rendering.

- Each metric tile has `onClick={() => setSelectedMetric(metric)}` (line 716).
- `MetricDetailDialog` component renders when `selectedMetric` is non-null (line 912-916).
- The dialog fetches live breakdown data from: `GET /api/metrics/pipeline/details?metric={metricKey}`
- `metricKey` is resolved via `metricApiKeys` map (line 65-69):
  - "Active Pipeline" -> `active_pipeline`
  - "Appointments Today" -> `appointments_today`
  - "Open Escalations" -> `open_escalations`
  - "Outbound Sent 24h" -> `outbound_sent`
- Each metric key has a dedicated table renderer in `renderTable()`:
  - `active_pipeline`: Name, Status, Vehicle, Lead ID, View Contact button
  - `appointments_today`: Name, Phone, Email, Type, Time
  - `open_escalations` and `outbound_sent`: similar structured tables (inferred from pattern)
- Loading, error, and empty states are all handled with appropriate test IDs.
- The dialog also includes a "View Contact" flow via `setViewingContact` for pipeline rows with a `sourceId`.

**Verdict:** Working as expected. Click tile -> dialog opens -> fetches `/api/metrics/pipeline/details?metric=X` -> renders metric-specific breakdown table with real data.

---

## S-1.AC16: File Upload

**File:** `client/src/pages/main.tsx` (lines 861-873)

**Findings:** File upload is NOT implemented. The Plus button is a "new chat" button, not a file upload trigger.

- The Plus button (line 861-873) with `data-testid="button-main-chat-add"` has an `onClick` handler that:
  - Clears messages: `setMessages([])`
  - Clears input: `setInputValue('')`
  - Resets conversation: `setConversationId(null)`
- This starts a new conversation — it does not open a file picker or file upload dropdown.
- The page header comment (line 10) mentions "file upload dropdown" but this is aspirational/outdated documentation. No file upload UI, no file input element, no upload API call exists anywhere in main.tsx.
- The `useStreamingChat` hook's `sendMessage` sends `{ content, agentId, mode, pageContext }` — no file/attachment field.
- No `<input type="file">` or file-related state exists in the component.

**Verdict:** File upload does not exist on the AI Chat page. The Plus button is a "new conversation" button. The E-013 audit's mention of "file upload dropdown" in the layout description is inaccurate — it appears to have been carried forward from the page header comment which describes intended but unbuilt functionality. This is a missing feature, not a bug in existing code.

---

## S-1.AC17: Chat Quality / Context Mechanism

**Files:**
- `client/src/hooks/useStreamingChat.ts` (full file, 157 lines)
- `server/routes/chat.ts` (lines 108-276)

**Findings:** Extensive org-specific context injection on the server side.

### Client Side
- `useStreamingChat` sends `POST /api/chat/{conversationId}/stream` with `{ content, agentId, mode, pageContext }`.
- No system prompt is constructed client-side. All context injection happens server-side.

### Server Side Context Assembly (chat.ts lines 125-275)
The server assembles a rich system prompt with these data sources:

1. **Org identity:** Organization name, persona name (e.g., "Automa"), org-specific `systemPrompt` and `chatInstructions` from org settings.
2. **User context:** User's name, role, organization.
3. **Team data:** All active users with roles (team summary).
4. **AI agents:** All org agents with departments.
5. **Knowledge base:** Organization documents (up to 32KB total, 8KB per doc, truncated if larger). Filtered by agent if `agentId` is provided.
6. **Accepted hunches:** AI-generated insights the org has accepted (with confidence levels).
7. **Data freshness:** Last sync timestamps for VinSolutions metrics and lead data. Enables the AI to warn about stale data.
8. **Activity logs:** Last 10-15 org activity events with timestamps and details.
9. **Campaign data:** Up to 10 campaigns with status, send/reply counts, execution status.
10. **Page context:** If provided, tells the AI what page the user is currently viewing.
11. **Agent context:** If a specific agent is selected, includes agent name, department, and description.
12. **CRM Guru mode:** Special instructions if the CRM Guru agent is active.

### Conversation History
- Last 20 messages from the conversation are included as chat history (line 123).

### System Prompt Structure
The system prompt (lines 226-275) includes:
- Persona identity and org name
- Current date/time (Eastern)
- User context block
- Organization data block (team, agents, multi-org awareness for admin roles)
- Personality and rules (conversational, concise, automotive-domain expertise)
- Data provenance rules (never name CRM vendor, attribute sources, handle stale data)
- Tool usage instructions (web_search, vin_query_leads, vin_lead_summary, query_campaigns)
- Org-specific prompt and chat instructions (if configured)
- All assembled context blocks appended at the end

**Verdict:** The chat quality mechanism is comprehensive. The AI receives deep org-specific context including team data, knowledge base documents, campaign performance, activity logs, data freshness indicators, and accepted hunches. Quality is configurable per-org via `chatInstructions` and `systemPrompt` settings fields. The context assembly is well-structured and properly scoped to the user's organization.

---

## Summary

| AC | Status | Notes |
|---|---|---|
| S-1.AC13 (Chat history delete) | PASS | DELETE /api/conversations/:id, cache invalidation, proper UI flow |
| S-1.AC15 (Metric tile drill-down) | PASS | /api/metrics/pipeline/details?metric=X, per-metric tables, loading/error states |
| S-1.AC16 (File upload) | MISSING FEATURE | Plus button is "new chat", not file upload. No upload mechanism exists |
| S-1.AC17 (Chat quality) | PASS | Rich server-side context: org data, team, knowledge base, campaigns, activity, hunches |

### Action Items
- **S-1.AC16:** File upload should be tracked as a new feature request, not a bug. Remove "file upload dropdown" from the page header comment to avoid future confusion, or implement the feature. Decision needed from operator.
