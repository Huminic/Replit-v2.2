# TeamBox Basic Operability findings — 2026-05-01

> **P0 SAFETY CALLOUT (read first):** the existing `/api/conversations/:id/push-to-vin` route at `server/routes/conversations.ts:281-381` calls `vin_safe_prepare_lead` and **immediately** calls `vin_safe_execute_lead` with `user_confirmed: true` in the same request handler, with no operator-review gate between them (`:319-346`). CLAUDE.md "Write flow — MANDATORY" mandates `prepare → review → execute → verify` and "Never set `user_confirmed: true` without showing the preview first." The frontend's confirmation Dialog (`teambox.tsx:976-999`) shows generic copy and does NOT show the prepared lead preview returned by `vin_safe_prepare_lead`. **Per dispatch rules I am stopping documentation-only and not auto-remediating.** This is consistent with Lane 5 Observation 10 ("Push to VIN button is a real-customer write surface; dialog copy is generic"). Filing this as a Q7 dependency that must be addressed before any Push-to-VIN proof can be run in Batch 2. See Finding 7 below.

## Scope of investigation

Read-only review of the visible TeamBox surface (`/teambox`) for **launch-blocking basic operability issues only**. Confirms three known issues from the Decision Matrix D-H1 (channel-filter gap I-NEW-2026-05-01-H, voice de-dup I-NEW-2026-05-01-I, AI-role rendering I-NEW-2026-05-01-J) as code-grounded, characterizes the smallest possible fix shape for each, identifies cross-batch dependencies on Dispatch 1 (sales-vs-service classification), Dispatch 4 (Marketing Insights `scope` prop pattern), and Dispatch 5 (workflow QA proof matrix), and documents the prepare→review→execute→verify dependency for Push-to-VIN. **No TeamBox redesign recommendations.** Sources: `client/src/pages/teambox.tsx` (whole), `shared/schema.ts:86-120` (`conversations` + `messages`), `server/routes/conversations.ts` (whole), Lane 5 evidence (`evidence/stabilization-sprint-2026-04-30/lane-5-teambox-taxonomy.md`), Dispatch 1 + 4 outputs.

## TL;DR

1. **Q1 — Current taxonomy:** Three top-level tabs (Conversations / Phone / Video) at `teambox.tsx:343-381`. Conversations has 8 status filters (`:67-76`), 6 channel chips (`:78-85`), search (`:135`), and a campaign dropdown (`:401-420`). Phone tab reads `/api/vapi/calls?limit=100`; Video tab reads `/api/tavus/conversations`.
2. **Q2 — Data dependencies:** Conversations reads `conversations.{channel, status, agentId, assignedTo, campaignId, campaignDisconnected, customerName, customerPhone, customerEmail, lastMessageAt, unreadCount}`. Threads read `messages.{role, content, senderName, createdAt}`. **No `warehouse_leads` columns are read by TeamBox.** TeamBox is `conversations`-only at the consumer side.
3. **Q3 — Channel-filter gap (I-NEW-2026-05-01-H):** Confirmed. `channelFilters` at `:78-85` contains `all/sms/email/chat/whatsapp/voice` only. Producers emit `video` (`webhooks.ts:1570`), `form` (`public.ts:107`), and `ai-chat` (`main.tsx:687`) — `ai-chat` is intentionally hidden (`teambox.tsx:175`); `video` and `form` are unfilterable. **One-line fix shape:** add `{ id: 'video', label: 'Video' }` and `{ id: 'form', label: 'Form' }` to the array AND extend the `ConversationChannel` TS union (`:45`) to `'sms' | 'email' | 'chat' | 'whatsapp' | 'voice' | 'video' | 'form'` AND add icons in `channelIcons` (`:59-65`) for `video: Video` (already imported) and `form: FileText` (already imported). The URL-channel allow-list at `:140` already permits `video`. Net: ~5 lines across 3 contiguous blocks in one file.
4. **Q4 — Voice de-dup (I-NEW-2026-05-01-I):** Confirmed. `routes/webhooks.ts:1151-1160` creates a `channel='voice'` conversation row for every VAPI call (existing dedup is by VAPI call-id + phone+assistant; not by "this also lives in the Phone tab"). Phone tab reads VAPI directly via `/api/vapi/calls`. Same call surfaces twice. **Fix is producer-side: stop creating the `conversations` row** (Lane 5 §11.10 hint, Lane 5 must-fix #2 option A) — Phone tab is authoritative for VAPI. Consumer-side filter (hide `channel='voice'` from Conversations list) is the cheaper fallback if producer change is too risky for v2.2; see Finding 4 trade-off.
5. **Q5 — AI-role rendering (I-NEW-2026-05-01-J) → DEFER to v2.3:** Confirmed identical render for `agent` / `assistant`. `bot` has a different background; `system` is a transcript banner. Rationale for defer: cosmetic; non-misleading-data (no false metric, no wrong outbound); no operator action depends on the distinction. **v2.3 ticket text drafted in Finding 5.**
6. **Q6 — Reply round-trip (Batch 2 dep):** Smallest E2E proves SMS today; chat (Web Chat) round-trip needs widget; email needs `/api/conversations/:id/email`; voice/video have no reply path (Lane 5 §11). Dispatch 5 W3 covers SMS reply round-trip via TextMagic — TeamBox-side proof piggy-backs that, no duplicate work.
7. **Q7 — Push-to-VIN dry-run (Batch 2 dep):** **CANNOT BE SAFELY RUN AGAINST THE EXISTING ROUTE.** The current route fires execute immediately after prepare. Safe dry-run requires either (a) a separate `prepare`-only route (`POST /api/conversations/:id/prepare-vin` that returns the preview without calling execute) introduced in Batch 1 or 2 with operator approval; or (b) calling the vin-safe-mcp REST endpoint directly via a curl harness, bypassing the app entirely. Recommendation: (b) — a curl with the prepared payload to `http://0.0.0.0:4003/api/tool/vin_safe_prepare_lead`. Direct call shape in Finding 7. **The route itself violates CLAUDE.md and should be tracked as v2.2 P0 fix or feature freeze.**
8. **Q8 — Sales-vs-service intersection (Dispatch 1 + 4 dep):** TeamBox today has **zero sales-vs-service distinction at the conversation level**. Per Dispatch 1, `vin_status` lives on `warehouse_leads`, not on `conversations`. Per Lane 5 there is no `department` column on `conversations`. After Batch 1 ships sales-vs-service separation in Reports/Metrics/Insights, the **most-affected TeamBox surfaces** are: (i) the campaign dropdown filter at `:401-420` (campaigns ARE department-tagged via `campaigns.department` `schema.ts:125`); (ii) any future sublane that needs to scope the conversation list by department; (iii) `customerName / customerPhone` joins to `warehouse_leads` to derive department for a given conversation. **No fix proposed in v2.2** — these are v2.3 dependencies. The Dispatch 4 `scope?: 'sales'|'marketing'|'service'` prop pattern is reusable for a future `<TeamBoxPage scope="service" />` per-department surface, but today Marketing already has its own page; sales/service split inside TeamBox is a v2.3 sublane sprint per Lane 5.

## Findings

### Finding 1 — Current taxonomy (Q1)

- **What:** Three top-level tabs visible from `/teambox`:
  - **Conversations** (`teambox.tsx:343-355, 549-973`) — 4-column inbox: status sidebar / channel chip bar / list / thread / customer info.
  - **Phone** (`:357-368, 426-488`) — VAPI call log table; reads `/api/vapi/calls?limit=100`.
  - **Video** (`:369-381, 491-546`) — Tavus session table; reads `/api/tavus/conversations`.
- **Conversations sub-filters:**
  - 8 **status filters** (`:67-76`): `all`, `open`, `assigned`, `participating`, `automated`, `scheduled`, `followup`, `pending`. Note: `closed` is in the type union (`:46`) but absent from the filter list — Lane 5 also flagged this; out of scope of v2.2 channel-filter gap.
  - 6 **channel filters** (`:78-85`): `all`, `sms`, `email`, `chat`, `whatsapp`, `voice`. **Missing:** `video`, `form` (Q3).
  - **Campaign dropdown** (`:401-420`): all campaigns visible to the org; selecting filters by `campaignId`.
  - **Search** (`:135, 179`) — filters by `customerName.toLowerCase().includes(searchTerm)`.
  - **viewMode toggle** (`:553-572`): `Conversations` vs `Workflows` (Workflows shows "coming soon" placeholder at `:630-632`).
- **Channel icons** (`:59-65`): `sms→Smartphone`, `email→Mail`, `chat→MessageSquare`, `whatsapp→MessageSquare`, `voice→Phone`. **No icon for `video` or `form`** (would render `MessageSquare` fallback at `:657`).
- **Where:** `client/src/pages/teambox.tsx:67-85, 343-422, 549-625, 549-973`.
- **Why it matters:** Establishes the visible-feature inventory that Q3–Q5 modify.
- **Effort:** N/A — observational.
- **Risk:** None.

### Finding 2 — Data dependencies (Q2)

- **What:** TeamBox reads from three queryKeys at the conversations tab:
  - `['/api/conversations', orgId]` (`:158`) — primary list. Backed by `server/routes/conversations.ts:15-28` → `storage.getConversations(orgId, { status?, channel?, agentId? })`. **Note:** the UI does NOT pass `status` or `channel` query params; it pulls everything and filters client-side (`:174-181`). Lane 5 §11.5 flags this as a perf concern (ai-chat exclusion is client-side at `:175`).
  - `['/api/conversations', selectedConversationId, 'messages']` (`:190`) — thread messages. Backed by `routes/conversations.ts:158-171` → `storage.getMessages(conversationId)`.
  - `['/api/campaigns', orgId]` (`:154`) — campaign dropdown.
  - `['/api/users', orgId]` (`:278`) — assignment dropdown.
  - `['/api/vapi/calls?limit=100']` and `['/api/tavus/conversations']` for the Phone/Video tabs.
- **Per-bucket column dependence (`conversations` table fields read):**
  | Surface | Columns from `conversations` |
  |---|---|
  | Status sidebar count (`:208-212`) | `channel` (filters out `ai-chat`), `status` |
  | Channel chip filter (`:177`) | `channel` |
  | Campaign filter (`:178`) | `campaignId` |
  | List cell (`:656-712`) | `id`, `customerName`, `channel`, `status`, `agentId`, `lastMessageAt`, `unreadCount` |
  | Thread header (`:723-794`) | `customerName`, `channel`, `agentId`, `status`, `campaignId`, `campaignDisconnected` |
  | Customer-info panel (`:890-972`) | `customerName`, `customerEmail`, `customerPhone`, `channel`, `status`, `agentId`, `assignedTo` |
  | Reply send (`:222-228`) | `id` (POSTs to `/api/conversations/:id/messages`) |
  | Take-Over PATCH (`:237-241`) | sets `status`, `assignedTo` |
  | Disconnect-Campaign PATCH (`:250-253`) | sets `campaignDisconnected` |
  | Push-to-VIN POST (`:264`) | sends conversation `id`; server resolves the rest from DB |
- **Per-bucket column dependence (`messages` table fields read):**
  | Surface | Columns from `messages` |
  |---|---|
  | Last-message snippet (`:214-218`) | `content` |
  | Thread bubble (`:801-832`) | `id`, `role`, `content`, `senderName`, `createdAt` |
  | Reply send body (`:222-228`) | writes `role='agent'`, `content`, `senderName` |
- **`warehouse_leads` columns read by TeamBox:** **NONE.** TeamBox is conversations-only on the consumer side. (Push-to-VIN reads the conversation, not the lead — see `routes/conversations.ts:285-301`.)
- **Where:** `client/src/pages/teambox.tsx:154-200, 174-181, 656-712, 723-972, 222-265`. `server/routes/conversations.ts:14-278, 280-381`. `shared/schema.ts:86-120`.
- **Why it matters:** Establishes that the sales-vs-service classification predicate from Dispatch 1 (`vin_status NOT LIKE 'SERVICE%'` on `warehouse_leads`) does NOT apply to TeamBox today because TeamBox doesn't read `warehouse_leads`. Q8 dependency.
- **Effort:** N/A — observational.
- **Risk:** None.

### Finding 3 — Channel-filter gap I-NEW-2026-05-01-H (Q3) — IN scope per D-H1

- **What:** `channelFilters` (`:78-85`) lists `all/sms/email/chat/whatsapp/voice`. Producers emit `video` and `form` channels:
  - `routes/webhooks.ts:1570, 1774` (Tavus) writes `channel: "video"`.
  - `routes/public.ts:107` (widget contact form) writes `channel: "form"`.
- The filter at `:177` requires `conv.channel === activeChannel`; with `activeChannel='all'` they pass through, but no chip exists to scope to them. They're effectively buried.
- **One-line fix shape (precise):** Three contiguous edits in `client/src/pages/teambox.tsx`:
  ```ts
  // 1) Type union (:45) — add 'video' and 'form':
  type ConversationChannel = 'sms' | 'email' | 'chat' | 'whatsapp' | 'voice' | 'video' | 'form';

  // 2) channelIcons map (:59-65) — add the two icons (Video and FileText already imported at :27):
  const channelIcons: Record<ConversationChannel, React.ElementType> = {
    sms: Smartphone, email: Mail, chat: MessageSquare, whatsapp: MessageSquare,
    voice: Phone, video: Video, form: FileText,
  };

  // 3) channelFilters list (:78-85) — append two entries:
  const channelFilters: { id: ConversationChannel | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'sms', label: 'SMS' },
    { id: 'email', label: 'Email' },
    { id: 'chat', label: 'Web Chat' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'voice', label: 'Voice' },
    { id: 'video', label: 'Video' },
    { id: 'form', label: 'Form' },
  ];

  // 4) URL-channel allow-list (:140) — already includes 'video'; add 'form':
  if (ch && ['sms', 'email', 'voice', 'video', 'form', 'chat'].includes(ch)) { ... }
  ```
- **Notes:**
  - The `getStatusCount` helper at `:208-212` excludes `ai-chat` already; no change needed there.
  - Since `Video` and `FileText` are already imported (`:27`), no import change is needed.
  - The campaign dropdown is independent and not affected.
  - Both new chips appear in the chip bar at `:386` AND in the left-sidebar channel list at `:612`. Single source of truth (`channelFilters`) drives both.
- **Where:** `client/src/pages/teambox.tsx:45, 59-65, 78-85, 140, 386-400, 612-624`.
- **Why it matters:** Existing visible feature is broken. Tavus video sessions surface in `conversations` (Lane 5 confirmed via `webhooks.ts:1570`) but cannot be scoped to in the Conversations list. Form submissions look identical to webchats and cannot be filtered out. Per D-H1 IN scope.
- **Likely fix shape:** Above (single file, ~6 lines added).
- **Effort:** S.
- **Risk if shipped wrong:** Very low — UI-only chip addition. Risk surfaces are: (a) `ConversationChannel` type widening could cascade into other consumers — searched: only used in `channelIcons` keys and `channelFilters[].id`; no other consumers in the file (b) the channel filter at `:177` is a string equality check, no type narrowing dependency.

### Finding 4 — Voice de-dup I-NEW-2026-05-01-I (Q4) — IN scope per D-H1

- **What:** VAPI inbound calls produce two separate user-visible rows:
  1. `routes/webhooks.ts:1151-1160` creates a `conversations` row with `channel='voice'` (and a `system`-role transcript message at `:1179-1184` if transcript/summary present).
  2. The same call appears in the Phone tab via `/api/vapi/calls` (the VAPI provider API, NOT `conversations`). `teambox.tsx:163` reads VAPI directly: `useQuery(['/api/vapi/calls?limit=100'])`. Phone tab is authoritative for VAPI; the Conversations row is a thin shell.
- **Producer-side vs consumer-side:** Two viable shapes:
  - **(A) Producer-side (Lane 5 §11 must-fix #2 option A; recommended for honesty):** Suppress the `conversations` row entirely on VAPI inbound webhook. Phone tab continues to render. **Fix site:** `server/routes/webhooks.ts:1151-1160` — replace the `storage.createConversation({ channel:'voice', ... })` block with a no-op (still record `processedVapiCalls` for dedup tracking). Do NOT remove the storage write for transcripts; the Phone tab modal at `teambox.tsx:469-479` reads `call.transcript` from VAPI directly, not from `messages`. **Risks:** (a) audit/search loses the VAPI thread from the conversations table — operator may want to retain for cross-channel customer history; (b) any existing UI that joins conversations with vapi calls (none observed) regresses. (c) if a follow-up SMS-to-the-VAPI-caller is sent, the natural place to log it is the conversations row — without it, the SMS will create a NEW conversation rather than threading.
  - **(B) Consumer-side (cheaper, less invasive):** Hide `channel='voice'` rows from the conversations list when the matching VAPI call exists in the Phone tab. **Fix site:** `client/src/pages/teambox.tsx:174-181` — add a filter `if (conv.channel === 'voice') return false;` to suppress them entirely from the Conversations list. With the new `voice` channel chip removed too. Trade-off: still creates DB rows (no producer change), still consumes search/audit space, but operator-visible duplication disappears.
- **Recommended fix:** **(A) producer-side** for v2.2 if Batch 2 evidence shows no downstream consumers of the `channel='voice'` conversation row beyond the duplicate display. Otherwise (B) as a cheaper temporary fix; file the producer-side cleanup as v2.3 backlog. **Operator decision required.**
- **Where:** `server/routes/webhooks.ts:1151-1160` (producer); `client/src/pages/teambox.tsx:174-181` (consumer).
- **Why it matters:** Demos with VAPI inbound show the same call twice (Lane 5 screenshots `04-teambox-phone-tab.png` + `06-teambox-voice-filter.png`). Reply composer on the voice "conversation" row is meaningless — there's no SMS path back to the caller through that row.
- **Likely fix shape:** Either (A) ~5-line server diff or (B) ~1-line client diff.
- **Effort:** S either way.
- **Risk if shipped wrong:** (A) loses cross-channel audit thread for VAPI; mitigated by audit_log + Phone tab. (B) doesn't address the storage cost; mitigated by it being v2.2 stop-gap.

### Finding 5 — AI-role rendering I-NEW-2026-05-01-J (Q5) — DEFER to v2.3

- **What:** `messages.role` distinct values produced: `agent`, `assistant`, `bot`, `customer`, `system`, `user` (Lane 5 §3 + grep of server routes). Render rules at `teambox.tsx:801-832`:
  - `customer | user` → left-aligned, `bg-muted` (`:806, 815-816`).
  - `system` → centered, amber banner (`:806, 812-813`).
  - `bot` → right-aligned, `bg-primary/10 ... border-primary/20` (distinct background) (`:806, 817-818`).
  - **`agent` AND `assistant` → right-aligned, `bg-primary` (identical)** (`:821`).
- The "label" line at `:823-825` shows `senderName || role`, so for an `agent` message with `senderName="Trigger"` and an `assistant` message with `senderName="Auto-greeting"` you can sometimes tell them apart by name — but the visual envelope is identical.
- **Producer-vs-renderer split:**
  - `routes/public.ts:288` (auto-greeting) writes `role='assistant'`.
  - `services/triggerService.ts:707` (trigger sends) writes `role='agent'`.
  - `outbound.ts` AI replies write `role='bot'` per Lane 5 (verified at `services/triggerService.ts:425`).
  - Manual operator reply via `teambox.tsx:222-228` writes `role='agent'`.
  - VAPI/Tavus webhooks write `role='system'` for transcripts (`webhooks.ts:1181, ...`).
- **Why it matters (mild):** A demo audience cannot distinguish a Claude-assistant reply from a human agent reply at a visual glance; a `senderName` label is the only signal, and it's small. The data is not WRONG (no false metric, no wrong outbound) — just visually flat.
- **Why DEFER per D-H1:** Cosmetic. Not visibly broken (just same icon/style). No operator action depends on the distinction. Gating launch on a 4-bubble visual taxonomy is overscope for v2.2.
- **Effort:** S in v2.3 (one CSS variation per role plus a small caption).
- **Risk if shipped wrong (v2.3):** Very low.

**Smallest possible v2.3 ticket text (verbatim, ready to paste):**

```
BL-108  — TeamBox: visually distinguish agent / assistant / bot / system roles

Objective:
  Make the four AI/automation message roles (agent, assistant, bot, system)
  visually distinguishable in the TeamBox thread bubble so a viewer can
  tell at a glance whether a reply was a Claude AI reply, a trigger send,
  an auto-greeting, or a voice-call transcript banner.

Scope (in):
  - client/src/pages/teambox.tsx:801-832 — bubble render block
    - 'agent'      → right-aligned bg-primary       (current; "Human" caption)
    - 'assistant'  → right-aligned bg-primary/70    (new; "Auto-greeting" caption)
    - 'bot'        → right-aligned bg-primary/10    (current; "AI" caption)
    - 'system'     → centered amber banner          (current)
  - 1-line role-to-caption helper:
      const roleCaption = { agent: 'Human', assistant: 'Auto', bot: 'AI', system: '' };
  - Add tiny (text-[9px]) caption next to senderName for non-customer roles.

Scope (out):
  - Producer-side role normalization (keep producer writes as-is — server contract unchanged).
  - Adding new role values.
  - Changing the role taxonomy itself.

Done looks like:
  - Visual diff between an agent reply, an assistant reply, a bot reply,
    and a system transcript is unmistakable in <2 seconds for a fresh viewer.
  - Existing tests/e2e/wf-* specs still pass.

Constraints:
  - UI-only change. Per-file scope marker required:
    .claude/state/scope/teambox.tsx.ok
  - Must not change senderName rendering for 'customer' / 'user' (left bubbles).
  - No new icons in the role caption — keep text-only.

Tasks:
  1. Add roleCaption helper near top of file.
  2. Apply caption to bubble label render.
  3. Per-role bg-primary opacity tweak in cn() block.
  4. Add or update Playwright spec capturing the four bubble variants.
  5. Evidence pack: pre/post screenshots.

Owner: TBD (operator to assign in v2.3 planning)
```

- **Where:** v2.3 backlog (write to `backlog.md` when v2.3 planning starts).

### Finding 6 — Reply round-trip Batch 2 dependency (Q6)

- **What:** Per `routes/conversations.ts:229-278`, the `/api/conversations/:id/messages` POST handler has channel-aware outbound: when `role === 'agent'` AND (`channel === 'sms'` OR content starts with `[SMS] `) AND a `customerPhone` exists, it calls `processOutboundSend` to TextMagic. **Other channels do NOT have an outbound provider call wired here.** Email goes through a separate route `/api/conversations/:id/email` (`:174-227`). Voice and Video have NO reply round-trip at all (Phone/Video tabs are read-only on the provider side). Web Chat replies are returned to the widget via the chat polling API (separate route).
- **Smallest E2E to prove SMS reply round-trip (the only channel that fires a real TextMagic send from TeamBox today):**
  1. **Pre-state:** allowlisted recipient at `+14126546500` per Dispatch 5 §ENV-2; one open conversation in TeamBox with `channel='sms'`, `customerPhone='+14126546500'`, `status='open'` (matches Dispatch 5 W3 fixture).
  2. **Action:** Logged in as `serra_honda@huminic.ai`, click the conversation, type a `[TESTLANE]`-marked message in the reply textarea, hit Send.
  3. **Delta 1 (DB):** new `messages` row attached to the conversation, `role='agent'`, `senderName=<user.name>`. `conversations.lastMessageAt` advances. `outbound_log` shows `channel='sms'`, `status='sent'` (or `blocked` with reason if CommGate suppresses), `recipient='+14126546500'`.
  4. **Delta 2 (provider receipt):** TextMagic dashboard shows the outbound message-id; SMS lands at the operator phone.
- **Cross-reference Dispatch 5:** This is essentially the post-Batch-2 visible side of Dispatch 5's W3 (service-campaign send→reply on Serra Honda) — Dispatch 5 W3 covers the full campaign-send path; the TeamBox side is a single new manual reply rather than a campaign. **No duplicate work needed in Batch 3.** Batch 3's TeamBox proof can ride W3 evidence: "After W3 completes, log into TeamBox, find the W3 conversation, send a `[TESTLANE]` reply, capture the same Delta 1/2 evidence pattern."
- **Channels that have no in-TeamBox reply provider proof at all:**
  - **Web Chat (`channel='chat'`):** Reply goes back to the widget via the chat polling API (separate route, not the messages POST handler). Proof requires a widget tab open in parallel; out of scope for TeamBox-only proof.
  - **Email (`channel='email'`):** Uses the dedicated `/api/conversations/:id/email` route (`:174-227`); not invoked by the textarea Send button. The textarea Send creates a `messages` row but does NOT trigger Resend. Proof requires invoking the dedicated route via a separate UI surface, which TeamBox does not expose. **Mild defect** — the textarea Send for an email-channel conversation creates an in-app message but no actual email goes out. Not in D-H1 IN-scope; flag as I-NEW-2026-05-01 candidate or v2.3 backlog. **Recommend not adding scope** — log as known limitation in evidence.
  - **Voice / Video / Form / WhatsApp:** No reply path implemented in TeamBox. No proof needed; document as "Reply not supported for this channel" (or hide the textarea — out of v2.2 scope per D-H1).
- **Where:** `server/routes/conversations.ts:247-272` (SMS reply path); `:174-227` (email path); `client/src/pages/teambox.tsx:222-228, 317-324` (frontend Send wiring).
- **Why it matters:** Defines the minimum proof Batch 2 needs to give Batch 3 a "TeamBox reply round-trip" stamp. Reuses Dispatch 5 W3 evidence; no extra preflight needed.
- **Effort:** S — piggy-back on Dispatch 5 W3 fixture.
- **Risk if shipped wrong:** Low — proof is layered on top of an already-approved Dispatch 5 round-trip.

### Finding 7 — Push-to-VIN dry-run Batch 2 dependency (Q7)

- **What:** The existing route `/api/conversations/:id/push-to-vin` at `server/routes/conversations.ts:281-381` is **NOT a dry-run-friendly surface**. It calls `vin_safe_prepare_lead` at `:319-331`, then **immediately** calls `vin_safe_execute_lead` with `user_confirmed: true` at `:342-346`, with the only "review" being the generic `<Dialog>` at `teambox.tsx:976-999` that shows the message "Push this conversation to VIN Solutions as a lead?" — **the dialog does NOT show the prepared lead preview** (firstName, lastName, phone, lead source, description) returned by `prepare`.
- **CLAUDE.md violation (P0 SAFETY callout, top of file):**
  - CLAUDE.md "Write flow — MANDATORY" mandates `prepare → review → execute → verify` with: *"Never set `user_confirmed: true` without showing the preview first."*
  - The current route violates this by setting `user_confirmed: true` unconditionally at `:345`.
- **Safe `prepare`-only test for orchestrator (recommended):** Bypass the application route entirely and call vin-safe-mcp REST directly per CLAUDE.md "VIN Solutions Safe MCP" section:
  ```bash
  # Step 1: prepare-only call (read+resolve; does NOT create anything)
  curl -X POST http://0.0.0.0:4003/api/tool/vin_safe_prepare_lead \
    -H "Authorization: Bearer 8NCVZ8ZCgHtab6A+FxHsgOKcgir89KvOR+wMIpYFLp4=" \
    -H "Content-Type: application/json" \
    -d '{
      "orgId": "<serra-honda-nexxus-org-id>",
      "firstName": "TESTLANE",
      "lastName": "DryRun",
      "phone": "+14126546500",
      "leadType": "INTERNET",
      "leadSourceName": "Dealers WebSite",
      "description": "[TESTLANE] dry-run; do not execute."
    }'
  # Expected JSON: { status: "READY", approval_token: "<...>", preview: { ... full lead snapshot ... } }
  # STOP HERE — do NOT call vin_safe_execute_lead.
  ```
- **Verification of dry-run safety:**
  - Per CLAUDE.md: `vin_safe_prepare_lead` "Resolves dealer/user/lead source without creating anything." Verified by reading the contract — prepare returns a token, NO contact/lead is created in VIN until execute is called.
  - The application's `push-to-vin` route is not used in this test path. The route's defect is documented as a separate issue.
- **What this dry-run proves (Batch 2 evidence):**
  1. Vin-safe-mcp is reachable and authenticated.
  2. Serra Honda's `nexxusOrgId` resolution path works (`prepare` returns `READY` only when dealer + user + lead source resolve).
  3. The lead preview shape is correct (matches what would be sent on execute).
- **What this does NOT prove (still gaps):**
  - End-to-end VIN write (would require `execute` — explicit operator approval).
  - The application route's behavior (it's broken per the CLAUDE.md violation; do not exercise it for the proof).
- **Recommended action sequence:**
  1. Run the curl above as the Push-to-VIN dry-run for Batch 2.
  2. **Separately, file a P0 issue** for the application route's missing review step. Suggested fix: split into `POST /api/conversations/:id/prepare-vin` (returns preview + token) and `POST /api/conversations/:id/execute-vin` (consumes operator-confirmed token). The dialog renders the preview between the two calls.
  3. **DO NOT** click the "Push to VIN" button in the UI for any real or test conversation in Batch 2 until the route is fixed — clicking will fire a real VIN write.
- **Where:** `server/routes/conversations.ts:281-381` (route); `client/src/pages/teambox.tsx:778-792` (button), `:976-999` (dialog).
- **Why it matters:** The "Push to VIN" button is currently a one-click real-customer write surface (Lane 5 Observation 10). Batch 2 must NOT exercise it. Direct vin-safe-mcp curl is the safe alternative.
- **Likely fix shape:** Two-step route refactor (file as I-NEW-2026-05-01-O or P0 launch-blocker depending on operator triage).
- **Effort:** M for the route fix (server change + dialog render of preview).
- **Risk if shipped wrong:** **HIGH** — accidentally creates real VIN contacts/leads against real dealer accounts. STOP if a Batch 2 plan includes clicking the Push-to-VIN button.

### Finding 8 — Sales-vs-service intersection (Q8) — Dispatch 1 + 4 dependency

- **What:** Per Dispatch 1, sales-vs-service classification is anchored to `warehouse_leads.vin_status` (predicate `NOT LIKE 'SERVICE%'`). Per Finding 2 above, **TeamBox does NOT read `warehouse_leads`**. There is also no `department` column on `conversations` (Lane 5 §"Conversation schema fields", Finding 1 of Lane 5). Therefore Batch 1's predicate does NOT directly affect any TeamBox surface today.
- **However**, several TeamBox surfaces would need a sales-vs-service distinction once department-scoped sublanes ship in v2.3 (per Lane 5 "Proposed sublane taxonomy"):
  | TeamBox surface | What needs distinction | Which dispatch? | v2.2 fix? |
  |---|---|---|---|
  | Campaign dropdown filter (`teambox.tsx:401-420`) | Could group campaigns by `campaigns.department` (`schema.ts:125`); today shows all campaigns flat | Batch 1 (server-side `campaigns` API does not currently filter by department on the TeamBox-consumed `/api/campaigns?orgId=` query) | NO — v2.3 sublane sprint |
  | Conversations list (`:656-712`) | Each conversation could carry a department tag (e.g. derived from `agentId.department` or matched `warehouse_leads` row) | Batch 1 (no `department` on `conversations`) | NO — v2.3 |
  | Status sidebar (`:589-608`) | Could split per-department counts | N/A | NO — v2.3 |
  | Workflows tab (`:564-572`, currently placeholder) | When implemented, workflows will be department-scoped | N/A | N/A (placeholder today) |
  | Push-to-VIN description (`routes/conversations.ts:298-330`) | The hard-coded `leadType="INTERNET"` and `leadSourceName="Dealers WebSite"` may need to differ for service leads | Batch 1 / vin-safe-mcp | NO — v2.3 |
  | Phone/Video tabs | VAPI assistant + Tavus persona may be department-tagged | N/A | NO — v2.3 |
- **Reusing the Dispatch 4 `scope` prop pattern:** Per Dispatch 4 Finding 7, a `scope?: 'sales' | 'marketing' | 'service'` prop on `<InsightsPage>` was the minimum-surface fix for Marketing Insights. The same pattern is reusable for a future v2.3 `<TeamBoxPage scope="service">` per-department TeamBox embed (e.g. inside a Service-team page). **No fix proposed in v2.2** — flag for v2.3 architecture consistency. The pattern is documented here for future reference, not for action.
- **What v2.2 Batch 1 leaves as-is in TeamBox:**
  - Conversations list shows ALL channels for the org regardless of department.
  - Campaign filter shows ALL campaigns for the org regardless of department.
  - There is no department-scoped sublane today and none is added in v2.2 per D-H1 + Lane 5 "Can-fix-after-launch" #3.
- **Where:** `client/src/pages/teambox.tsx:401-420, 656-712`; `server/routes/conversations.ts:281-381`; `shared/schema.ts:86-120` (no department on `conversations`).
- **Why it matters:** Confirms TeamBox is an orthogonal consumer to Batch 1's sales-vs-service work. **No coordination needed in Batch 1 → Batch 3 sequence.** v2.3 backlog.
- **Likely fix shape:** v2.3 — schema migration adding `department` to `conversations`, plus consumer plumbing per the `scope` pattern from Dispatch 4.
- **Effort:** L for v2.3.
- **Risk if shipped wrong:** N/A for v2.2.

### Finding 9 — Out-of-scope items observed (documented for v2.3 backlog only)

These were noted while reading `teambox.tsx` and the Lane 5 evidence but are **NOT proposed for v2.2 Batch 3 fixes** — they would constitute redesign:

1. **Right-pane stale selection** (Lane 5 must-fix #5; `teambox.tsx:184-187`). When the user changes the channel filter, `selectedConversationId` is not reset; the right pane keeps showing the previously-selected thread until the user clicks. Mild UX bug. Defer to v2.3 unless operator escalates.
2. **Closed status filter missing** (Lane 5 §"`conversations.status` UI filter sidebar"). `closed` is in the type union (`:46`) but not in `statusFilters` (`:67-76`). Operators can't filter to closed conversations. Defer to v2.3.
3. **Phone tab raw assistant UUIDs** (Lane 5 must-fix #6; `teambox.tsx:456`). When `call.assistantName` is missing, the column falls back to `call.assistantId` (a raw UUID). Defer.
4. **"Test Customer" carcass conversations** (Lane 5 must-fix #7). 8 of 18 Serra Honda visible conversations are "Test Customer / 0 messages" widget-test artefacts. Recommend a daily cleanup job (Lane 5 §"Can-fix-after-launch"). Defer.
5. **`participating` status seed-only** (Lane 5 §"Status `participating`"). The chip exists at `:71` but no production code path writes the value. Either remove the chip or add server-side rule. Defer.
6. **Push-to-VIN dialog generic copy** (Lane 5 Observation 10). Already covered as part of Finding 7's route refactor — when the route splits prepare/execute, the dialog gets the preview content for free.
7. **`channel` field has no enum constraint** (Lane 5 Observation 4; `schema.ts:91`). Database migration to add a CHECK constraint would prevent typos but is v2.3 schema work.

These are listed only so future agents do not chase them as Batch 3 items. **Do NOT pull any of these into v2.2 scope.**

### Finding 10 — Cross-batch coordination summary

- **Dispatch 1 (Schema) → TeamBox:** No direct coupling. Batch 1's `vin_status NOT LIKE 'SERVICE%'` predicate operates on `warehouse_leads`, which TeamBox does not read. No TeamBox change needed in Batch 1.
- **Dispatch 4 (Marketing Insights) → TeamBox:** No direct coupling for v2.2. The `scope` prop pattern (Dispatch 4 Finding 7) is a reusable architectural choice for v2.3 department-scoped TeamBox embeds; documented but not actioned here.
- **Dispatch 5 (Workflow QA) → TeamBox:** Direct coupling. TeamBox SMS reply round-trip (Q6) piggy-backs Dispatch 5 W3 evidence. No duplicate fixture or preflight work; Batch 3 TeamBox proof reuses the W3 conversation.
- **Push-to-VIN (Q7) cross-cuts CLAUDE.md compliance:** The application route violates the prepare→review→execute→verify mandate. Filed as P0 (top-of-file callout). Batch 2 dry-run uses direct vin-safe-mcp curl, not the app route. Application-route fix is a separate ticket.

## Proposed implementation chunks (suggested order)

### Chunk T1 — Add `video` and `form` to channel filters (Batch 3, single file)

- **Files in scope (1 UI file; per-file scope marker required: `.claude/state/scope/teambox.tsx.ok`):**
  - `client/src/pages/teambox.tsx` — extend `ConversationChannel` union, `channelIcons` map, `channelFilters` array, and URL-channel allow-list (Finding 3 verbatim). Net ~6 lines added.
- **Files NOT touched:** Any server file. Any other client file. `shared/schema.ts`.
- **Test plan:**
  - **Delta 1 (focused):** TS check (`npm run check`) passes. New Playwright spec extending `tests/e2e/wf-*.spec.ts`: load `/teambox` as `serra_honda@huminic.ai`; assert chips with `data-testid="channel-chip-video"` and `data-testid="channel-chip-form"` render. Click each; assert the list filters (or shows empty state if no rows of that channel exist; both are valid — the chip just needs to exist and respond).
  - **Delta 2 (independent):** Pre-fix screenshot from Lane 5 (`07-teambox-webchat-filter.png` etc.) shows 6 chips; post-fix screenshot shows 8 chips. Diff is unmistakable.
- **Stop conditions:** Chip count post-fix not 8 (one per `channelFilters` entry) → STOP, regression. Any change outside the four edit blocks → STOP, scope creep.
- **Risk:** Very low.

### Chunk T2 — VAPI voice de-dup (Batch 3 — choose A or B per operator)

- **Option A — producer-side suppression (RECOMMENDED, server file):**
  - **Files in scope:** `server/routes/webhooks.ts:1151-1184` — replace the `storage.createConversation({ channel:'voice' ... })` block with a no-op. Retain `processedVapiCalls` tracking. **NOT** a client-side change; does not require the UI scope marker.
  - **Risk:** Loses cross-channel audit thread for VAPI in `conversations`; mitigated by `audit_log` + Phone tab. Verify no downstream consumer of `channel='voice'` rows exists (search: only TeamBox conversations list and the in-thread render — both go away as user-visible surfaces when the row is gone).
- **Option B — consumer-side hide (CHEAPER, single-line client change):**
  - **Files in scope (1 UI file; scope marker required):** `client/src/pages/teambox.tsx:174-181` — add `if (conv.channel === 'voice') return false;` filter line. Also remove the `voice` chip from `channelFilters` (`:84`) since it would always be empty. Net ~2 lines.
  - **Risk:** Doesn't address storage cost (rows still created); duplicates remain in the DB but disappear from the list. Defer producer-side cleanup to v2.3 backlog.
- **Operator decision required (recommend A).**
- **Test plan (either option):**
  - **Delta 1 (focused):** Playwright walk on `/teambox` as `serra_honda@huminic.ai` after a known VAPI call exists in the test envelope. Assert: VAPI call visible in Phone tab table. Assert: NO `data-testid="conversation-item-*"` row in the Conversations list whose `channel === 'voice'` matches the same call.
  - **Delta 2 (independent):** SQL count of `conversations` with `channel='voice'` for `serra-honda` org — pre-fix vs post-fix. With Option A, count stops growing on new calls; with Option B, count keeps growing but is hidden.
- **Stop conditions (Option A):** Phone tab regresses (call no longer appears) → STOP. Existing `audit_log` entries for VAPI inbound disappear → STOP.
- **Risk:** Low (A); very low (B).

### Chunk T3 — V2.3 backlog entries (Batch 3, documentation-only)

- **Files in scope:** `backlog.md` — add the BL-108 entry (Finding 5 verbatim) for AI-role rendering deferral, plus a separate entry for the application-route Push-to-VIN refactor (Finding 7 P0 callout).
- **Test plan:** None — documentation only. Verify `grep BL-108 backlog.md` returns the entry.

## Proof needed before any chunk is approved

- [ ] Operator confirms D-H1 path: T1 IN (channel-filter gap), T2 IN (voice de-dup; choose A or B), T3 backlog-only (AI-role).
- [ ] Operator chooses T2 Option A (producer-side; recommended) or B (consumer-side).
- [ ] Operator approves the per-file UI scope marker for `teambox.tsx` (`.claude/state/scope/teambox.tsx.ok`) before T1 (and B).
- [ ] **Operator decision on Push-to-VIN application-route P0 (Finding 7):** (i) fix in v2.2 (route refactor) + freeze the UI button until fixed, (ii) freeze the UI button only and ship the route fix in v2.3, or (iii) accept as known issue with operator-only-clicks-the-button discipline. **Recommendation: (i) fix in v2.2** — the button is currently a one-click real-customer write surface and operator wants to demo TeamBox at launch.
- [ ] Code-reviewer (fresh session) confirms T1 + T2 changes are confined to declared scope.
- [ ] Cross-reference Dispatch 5 W3 evidence as the SMS reply round-trip proof (no separate Batch 2 work for TeamBox SMS).

## Open questions for operator

1. **Push-to-VIN P0 (Finding 7) — verdict?** (i) fix the application route to honor prepare→review→execute, (ii) freeze the UI button until v2.3, or (iii) accept and rely on operator-only discipline. **Recommendation: (i).** Path (iii) is a CLAUDE.md violation surface left in production.
2. **Voice de-dup option (Finding 4)?** A (producer-side; cleaner; small server change) or B (consumer-side; cheaper; one client line). **Recommendation: A.** Operator UX call — losing the `conversations.channel='voice'` audit thread is the only trade-off.
3. **AI-role rendering ticket (Finding 5)** — is BL-108 the right backlog ID, or follow the schema agent's BL-107 numbering? Both finish-line dispatches (Dispatch 1 + this one) propose new BL-1xx items that don't yet exist in `backlog.md`. **Recommendation: BL-107 = lead_type column (Dispatch 1); BL-108 = TeamBox role visual distinction (this dispatch).** Operator confirms numbering scheme.
4. **TeamBox email reply textarea defect (Finding 6 limitation)** — when a conversation has `channel='email'`, the textarea Send creates a `messages` row but does NOT trigger Resend (only the dedicated `/api/conversations/:id/email` route does). This is a quiet failure — operator types a reply, it appears in the thread, but the customer never receives it. Should this be a v2.2 fix or v2.3 backlog? **Recommendation: v2.3 backlog** unless operator wants email replies to "just work" from the textarea, in which case it's a P1 alongside Push-to-VIN.
5. **Department-scope intersection (Finding 8)** — confirm v2.3 scope. The Lane 5 sublane taxonomy + Dispatch 4 `scope` prop pattern together suggest a clear path; nothing in v2.2.

## Out of scope for this investigation

1. TeamBox redesign (per dispatch hard rules). All "Lane 5 Proposed sublane taxonomy" items are v2.3.
2. Right-pane stale selection bug (Finding 9 #1). v2.3.
3. `closed` status filter chip add (Finding 9 #2). v2.3.
4. Phone tab assistant-UUID resolution (Finding 9 #3). v2.3.
5. Test Customer carcass cleanup (Finding 9 #4). Daily cron job; v2.3.
6. `participating` status removal (Finding 9 #5). v2.3.
7. `channel` enum constraint at the DB level (Finding 9 #7). v2.3 schema work.
8. New TeamBox sublanes (Inbox / AI-Handled / My Threads / Campaigns / Voice & Video / Forms — Lane 5 §"Minimum required tabs"). v2.3.
9. Workflows tab implementation (`teambox.tsx:564-572` placeholder). v2.3.
10. Source/origin enum on `conversations` (Lane 5 §"Can-fix-after-launch" #2). v2.3 schema.
11. Direction badges on list cells (Lane 5 §"Can-fix-after-launch" #4). v2.3.
12. Marketing Hunches department filter and broader Hunches sprint (Dispatch 4 cross-reference). v2.3.

## Cross-references

- **Dispatch 1 (Schema):** `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-05-01/finish-line-findings/01-schema-taxonomy.md` — confirms `vin_status NOT LIKE 'SERVICE%'` predicate operates on `warehouse_leads`, not on `conversations`. No TeamBox change in Batch 1.
- **Dispatch 4 (Marketing Insights):** `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-05-01/finish-line-findings/04-marketing-insights.md` — `scope?: 'sales' | 'marketing' | 'service'` prop pattern is reusable for v2.3 department-scoped TeamBox; no v2.2 action.
- **Dispatch 5 (Workflow QA):** `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-05-01/finish-line-findings/05-workflow-qa.md` — W3 service-campaign send→reply on Serra Honda is the SMS reply round-trip proof; TeamBox piggy-backs.
- **Lane 5 (overnight):** `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-04-30/lane-5-teambox-taxonomy.md` — full taxonomy + screenshots; this dispatch's launch-blocking subset is items 1, 2 of Lane 5 "Must-fix-before-customer-demo." All other Lane 5 items are v2.3.
- **Decision Matrix D-H1** (`finish-line-plan.md:148`): channel-filter gap IN; voice de-dup IN; AI-role rendering DEFER. Confirmed.
- **Files cited (absolute paths):**
  - `/home/ubuntu/Claude-store/nexxus2.2_replit/client/src/pages/teambox.tsx` (lines 27, 45, 46, 59-65, 67-76, 78-85, 135, 137-144, 154-200, 174-181, 177-181, 208-212, 222-228, 237-241, 250-253, 264, 386-422, 549-973, 612-625, 656-712, 723-794, 758-792, 778-792, 801-832, 890-972, 976-999)
  - `/home/ubuntu/Claude-store/nexxus2.2_replit/shared/schema.ts:86-120` (`conversations` and `messages` tables)
  - `/home/ubuntu/Claude-store/nexxus2.2_replit/server/routes/conversations.ts` (lines 14-28, 158-171, 174-227, 229-278, 247-272, 281-381, 319-346)
  - `/home/ubuntu/Claude-store/nexxus2.2_replit/server/routes/webhooks.ts` (lines 1151-1184, 1570, 1774)
  - `/home/ubuntu/Claude-store/nexxus2.2_replit/server/routes/public.ts:107` (form channel producer)
  - `/home/ubuntu/Claude-store/nexxus2.2_replit/CLAUDE.md` "VIN Solutions Safe MCP — Write flow MANDATORY" (P0 callout source)
  - `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-04-30/lane-5-teambox-taxonomy.md`
  - `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-05-01/finish-line-plan.md` Section 3 Group H + Section 4 D-H1 + Section 13 KD-7, KD-8, AD-5
  - `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-05-01/finish-line-findings/01-schema-taxonomy.md`
  - `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-05-01/finish-line-findings/04-marketing-insights.md`
  - `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-05-01/finish-line-findings/05-workflow-qa.md`
