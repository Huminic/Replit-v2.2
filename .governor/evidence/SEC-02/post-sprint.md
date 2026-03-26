# SEC-02 Post-Sprint Report: TeamBox Section Verification
**Sprint:** SEC-02
**Agent:** Dev (verification)
**Date:** 2026-03-26
**File examined:** `client/src/pages/teambox.tsx` (1253 lines), `server/routes/conversations.ts` (279 lines), `server/storage.ts` (getConversations, deleteConversation)

---

## S-2.AC19: Message History Renders Actual Chat Content

### Finding: CODE IS CORRECT — likely a data issue, not a rendering issue

**Fetch mechanism:**
- Messages query: `GET /api/conversations/${selectedConversationId}/messages` (line 252)
- Uses TanStack Query with key `['/api/conversations', selectedConversationId, 'messages']` (line 250)
- Enabled only when `selectedConversationId` is truthy (line 255)
- Server handler at `server/routes/conversations.ts:158-171` calls `storage.getMessages(conversationId)` which does a straight `db.select().from(messages).where(eq(messages.conversationId, id))` — no filtering, returns all messages for that conversation

**Rendering logic (lines 932-963):**
- Iterates `messages.map(msg => ...)` and renders each message in a chat bubble
- Each bubble displays:
  - `msg.senderName || msg.role` (sender label, line 950)
  - `msg.content` (actual message text, line 951)
  - `msg.createdAt` formatted as relative time (line 952-953)
- Role-based styling: `customer` = bg-muted (left-aligned), `bot` = bg-primary/10 with border (right), `agent` = bg-primary (right)
- Empty state: "No messages yet" when `messages.length === 0` (lines 958-962)

**Diagnosis:**
The rendering code correctly displays `msg.content`. If the operator sees no chat messages, the probable causes are:
1. **No messages in the database** for the selected conversation — the conversation record exists but no rows in the `messages` table reference it. This would show "No messages yet."
2. **Messages exist but content is empty/null** — the code renders `msg.content` directly with no fallback, so empty strings would render as blank bubbles.
3. **API returning empty array** — if `storage.getMessages()` returns `[]`, the empty state renders.

**Verdict:** Not a frontend rendering bug. The code faithfully renders whatever the API returns. The operator's issue is almost certainly a data-layer problem: either conversations have no associated messages, or messages were created with empty content fields. Needs backend/database investigation to confirm.

---

## S-2.AC17: Agent vs Human Filter

### Finding: NO DEDICATED AGENT/HUMAN FILTER EXISTS

**Status filters (lines 67-76):**
```
all, open, assigned, participating, automated, scheduled, followup, pending
```

**How filtering works (lines 264-269):**
- `activeStatus` state variable, defaults to `'all'`
- Filter logic: `if (activeStatus !== 'all' && conv.status !== activeStatus) return false`
- Purely client-side filtering on the `status` field of each conversation

**What "automated" gives you:**
- Filtering by `automated` shows conversations where `conv.status === 'automated'` — these are AI-handled conversations
- There is NO inverse filter for "human only" conversations
- To see human conversations, the user must mentally exclude `automated` from other statuses like `open`, `assigned`, `participating`

**Gap confirmed:** The audit correctly identified this. There is no toggle or filter chip that says "Agent" vs "Human." The `automated` status filter is the closest proxy but does not provide a clean human-only view. A user wanting "show me only human-handled conversations" has no single click to do so.

**Implementation note:** Adding this would be a client-side-only change. The data already has `status === 'automated'` and `agentId` fields on conversations. A simple toggle could filter where `status !== 'automated'` (human) or `status === 'automated'` (agent).

---

## S-2.AC20: Service Campaign Conversations in TeamBox

### Finding: CAMPAIGN CONVERSATIONS WILL APPEAR — no source filtering

**Frontend fetch (lines 199-202):**
```typescript
useQuery<Conversation[]>({
  queryKey: ['/api/conversations', orgId],
  refetchInterval: 5000,
});
```
- Fetches ALL conversations for the organization. No source, campaign, or channel filter applied at the query level.
- The only filters applied are client-side: `activeStatus` and `activeChannel` and `searchTerm` (lines 264-269).

**Backend query (storage.ts lines 408-414):**
```typescript
async getConversations(organizationId, filters?) {
  const conditions = [eq(conversations.organizationId, organizationId)];
  if (filters?.status) conditions.push(eq(conversations.status, filters.status));
  if (filters?.channel) conditions.push(eq(conversations.channel, filters.channel));
  if (filters?.agentId) conditions.push(eq(conversations.agentId, filters.agentId));
  return db.select().from(conversations).where(and(...conditions));
}
```
- No exclusion of campaign-sourced conversations. All conversations in the org are returned.

**Schema confirms campaign linkage:**
- `conversations` table has `campaignId` (uuid FK to campaigns) and `campaignDisconnected` (boolean) fields
- Conversations created by campaigns will have `campaignId` set

**Campaign-specific UI in TeamBox:**
- When `selectedConversation.campaignId` is truthy, a "Disconnect Campaign" button appears (lines 905-924)
- This button calls `PATCH /api/conversations/:id` with `{ campaignDisconnected: true }`

**Verdict:** Campaign-generated conversations (service campaigns, reverse 2-way SMS) will appear in TeamBox alongside all other conversations. They are not filtered out. The UI even has campaign-aware features (Disconnect Campaign button). This AC is satisfied at the code level — runtime verification depends on whether campaigns actually create conversation records with `campaignId` set.

---

## S-2.AC21: Delete Conversation

### Finding: BACKEND EXISTS, FRONTEND DOES NOT

**Backend (server/routes/conversations.ts lines 143-156):**
```typescript
app.delete("/api/conversations/:id", authenticateToken, requireRole(3), async (req, res) => {
  // ... auth checks ...
  await storage.deleteConversation(req.params.id);
  return res.json({ message: "Conversation deleted" });
});
```
- `DELETE /api/conversations/:id` endpoint exists
- Requires `requireRole(3)` — role level 3 or higher (admin-level permission)
- `storage.deleteConversation()` deletes all messages for the conversation first, then the conversation record itself (storage.ts lines 462-465)

**Frontend (teambox.tsx):**
- Searched for "delete", "Trash", "Remove" — **zero matches**
- No delete button, no context menu, no confirmation dialog, no mutation for DELETE
- The word "delete" does not appear anywhere in teambox.tsx

**Verdict:** The API is ready. The frontend has no UI to trigger it. This is a confirmed gap — a delete button (with confirmation dialog) needs to be added to the TeamBox UI. Logical placement: either in the conversation header bar (Col 3 top) or as a context menu on the conversation list items (Col 2). Should respect the `requireRole(3)` constraint — only show to admin users.

---

## Summary Table

| AC | Status | Finding |
|---|---|---|
| S-2.AC19 (Message history) | CODE OK, DATA SUSPECT | Rendering logic is correct — displays `msg.content` for each message. Operator's blank screen is likely a data issue (no messages in DB for selected conversations). Needs DB-level investigation. |
| S-2.AC17 (Agent vs human filter) | GAP CONFIRMED | Only `automated` status filter exists. No "human only" toggle. Client-side fix needed. |
| S-2.AC20 (Campaign conversations) | SATISFIED IN CODE | All conversations fetched regardless of source. Campaign conversations with `campaignId` set will appear. Disconnect Campaign button exists for campaign-linked conversations. |
| S-2.AC21 (Delete conversation) | BACKEND ONLY | `DELETE /api/conversations/:id` exists with role-3 auth. No frontend UI element triggers it. Needs a delete button + confirmation dialog in teambox.tsx. |

---

## Recommendations

1. **AC19 (Priority):** Dispatch a backend investigator to check: (a) do conversation records in the DB have associated message rows? (b) are inbound SMS/webhook handlers creating message records when customers reply? The frontend is not the problem.

2. **AC17:** Add a two-segment toggle or filter chip: "All" / "Agent" / "Human". Implementation is ~20 lines of client code — filter on `conv.status === 'automated'` vs `conv.status !== 'automated'`.

3. **AC21:** Add a delete button to the conversation header (visible only to role-3+ users). Wire it to `DELETE /api/conversations/:id`. Include a confirmation dialog since deletion cascades to all messages.

4. **AC20:** No code changes needed. Verify at runtime that campaign execution actually creates conversation records with `campaignId` populated.
