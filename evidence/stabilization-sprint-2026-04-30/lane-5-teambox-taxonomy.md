# Lane 5 — TeamBox Conversation Source / Sublane Taxonomy

**Date:** 2026-04-30
**Mode:** Read-only validation arc (Lane 5)
**Owner:** Claude harness agent
**Project:** Nexxus Connect v2.2

---

## Headline

**8 distinct `channel` values + 1 implicit category (campaign-attached) + 4 message `role` values are produced by 6 conversation-creation paths that all funnel into a single TeamBox surface (`/teambox`) with effectively flat filters and no per-source semantics.** Two surfaces (Phone, Video) are not in `conversations` at all — they read directly from VAPI / Tavus integration APIs. There is no `source`, `type`, `department`, `intent`, `subType`, or `direction` field on `conversations` to drive a richer sublane model. Several mixing/ambiguity findings, plus a discovered redirect bug while walking the page in Playwright, are documented in **Observations**.

Live `SELECT DISTINCT …` against the production Supabase DB was attempted but blocked by sandbox policy (CLAUDE.md hard precondition: explicit operator approval required to query `DATABASE_URL`). Per the lane brief, distinct values are reported from code-defined sources (creation sites, seed, server route literals) plus a per-org live snapshot collected via the authenticated `/api/conversations` endpoint in the browser walk for Serra Honda (org `n=18`) and Huminic (filtered counts).

---

## Conversation schema fields used for categorization

Source: `shared/schema.ts:86-109` (single source of truth).

| Field | Type | Default | Categorization role |
|---|---|---|---|
| `channel` | text | `"chat"` | **Primary** — drives icon, channel filter chip, `[CHANNEL]` badge in thread header |
| `status` | text | `"open"` | **Primary** — drives status filter sidebar, automated/human visual treatment |
| `agentId` | uuid → agents | null | Derives "handled by" + Bot icon overlay when `status === 'automated'` |
| `assignedTo` | uuid → users | null | Drives "Assigned to me" / "Participating" status filters |
| `campaignId` | uuid → campaigns | null | Toggles "Disconnect Campaign" button + campaign dropdown filter |
| `campaignDisconnected` | bool | false | Stops AI auto-replies for this thread |
| `sourceConversationId` | uuid | null | Linkage between conversations (used for ai-chat thread retention) — **never read by TeamBox UI** |
| `customerEmail` / `customerPhone` | text | null | Used for VIN dedup + auto-greeting. Not used as a category. |
| `unreadCount` | integer | 0 | Badge value, not a sublane |

There is no `source`, `type`, `department`, `subType`, `intent`, `inboundOutbound`, `origin`, `provider`, `firstTouch`, or `direction` column. Source and direction are *implicit* in `channel` and the message `role` sequence.

`messages` (`shared/schema.ts:111-120`) carries `role` (`text`) and `senderName` (`text`), which is what TeamBox uses to render alignment + bubble color (`teambox.tsx:801-832`). Distinct `role` literals written by code: `agent`, `assistant`, `bot`, `customer`, `system`, `user`. Discrepancy: the UI groups `customer | user` left, treats `bot` as primary/10 background, `system` as transcript banner, all other roles right-aligned. This means `agent` and `assistant` render *identically* and indistinguishably from each other.

---

## Distinct values discovered (code-defined enums + live UI snapshot)

### `conversations.channel` — distinct literals written by application code

| Value | Created by (file:line) | Volume in dev (Serra Honda, n=18) | Volume in dev (Huminic, n=4 visible w/ Web Chat filter) |
|---|---|---|---|
| `sms` | `seed.ts:541,583,621`, `outbound.ts:1026`, `routes/sms.ts:339,358,411,518,538,717`, `routes/conversations.ts:71,259`, `services/triggerService.ts:425,592,626,697` | 2 (TestLane Operator ×2) | 1 (`+15551234567` — synthetic test row) |
| `chat` | `seed.ts:557,609`, `routes/public.ts:266` (widget chat), `routes/conversations.ts` (default) | 9+ (8 "Test Customer" + 1 "Serra Honda Admin / Communication Writer" + Widget Test ×2) | 4 ("Test Customer" ×4) |
| `email` | `seed.ts:571,636` | 0 visible | 0 visible |
| `whatsapp` | `seed.ts:597` | 0 visible | 0 visible |
| `voice` | `routes/public.ts:175` (widget voice-callback), `routes/webhooks.ts:1154,1436` (VAPI inbound) | 2 ("Unknown Caller / Caroline", "S9 VAPI Audit / Nancy Gaston" ×2) | 0 visible |
| `video` | `routes/webhooks.ts:1570,1774` (Tavus webhook) | 0 visible (Tavus rows surface only in Video tab) | 0 visible |
| `form` | `routes/public.ts:107` (widget contact form) | 0 visible | 0 visible |
| `ai-chat` | `client/src/pages/main.tsx:687` (AI Chat page client-side) | excluded by `teambox.tsx:175` | excluded |

**Total distinct `channel` values produced: 8** (`sms`, `chat`, `email`, `whatsapp`, `voice`, `video`, `form`, `ai-chat`).

### `conversations.status` — distinct literals

From `seed.ts` + route writes: `open`, `closed`, `assigned`, `participating`, `automated`, `scheduled`, `followup`, `pending`. The TS type union in `client/src/pages/teambox.tsx:46` matches.

### `messages.role` — distinct literals

`agent`, `assistant`, `bot`, `customer`, `system`, `user` (`grep` of all `role: "…"` literals under `server/`).

### `conversations.channel` UI filter chips — distinct values

`teambox.tsx:78-85`: `all`, `sms`, `email`, `chat` ("Web Chat"), `whatsapp`, `voice`. **Notably missing: `video`, `form`, `ai-chat`.** Any conversation with `channel === 'video'` or `channel === 'form'` will never match a non-`all` chip and is effectively hidden behind "All" only.

### `conversations.status` UI filter sidebar — distinct values

`teambox.tsx:67-76`: `all`, `open`, `assigned`, `participating`, `automated`, `scheduled`, `followup`, `pending`. **Notably missing: `closed`** (per `ConversationStatus` union, but no filter chip).

---

## Per-source TeamBox UI behavior table

| Source / channel | Created at | Lands in TeamBox tab | Visible under filter chip | Thread renders all messages? | Direction visible to user? | Source/channel visible? | Human takeover available? |
|---|---|---|---|---|---|---|---|
| Web widget chat (`channel="chat"`) | `routes/public.ts:264` | Conversations | "Web Chat" + "All" | yes (assistant/user roles) | partial — left/right alignment only; no inbound/outbound label | yes — `CHAT` badge in thread header | yes — Take Over button (when `status === 'automated'`) |
| Web widget contact form (`channel="form"`) | `routes/public.ts:103` | Conversations | **only "All" — no chip** | one-time form payload as a single `user` message | **no — looks identical to webchat** | header shows `FORM` badge; filter chip cannot select it | yes (Take Over) but irrelevant for a form submit |
| Inbound SMS (`channel="sms"`) | `routes/sms.ts:411` (TextMagic webhook) | Conversations | "SMS" + "All" | yes | partial — alignment only | yes — `SMS` badge | yes |
| Outbound SMS reply trigger (`channel="sms"`) | `services/triggerService.ts:697` | Conversations | "SMS" + "All" | yes | mixed — outbound is `agent` role (right) | only via badge | yes |
| Campaign SMS send (`channel="sms"`, with `campaignId`) | `outbound.ts:1023` | Conversations | "SMS" + "All" + campaign dropdown | yes | partial | `SMS` badge; campaign name only via dropdown filter | yes; *plus* "Disconnect Campaign" button toggles `campaignDisconnected` |
| VAPI inbound voice (`channel="voice"`) | `routes/webhooks.ts:1151` | Conversations + **also separately** in Phone tab | "Voice" + "All" | renders the call summary + transcript as a single `system` message | no — only one `system` blob, no caller/agent turns | yes — `VOICE` badge | "Take Over" button visible but meaningless for a finished call |
| Widget voice-callback (`channel="voice"`) | `routes/public.ts:171` | Conversations + Phone | "Voice" + "All" | empty thread initially (callback triggered, no transcript yet) | no | yes | meaningless |
| Tavus video session (`channel="video"`) | `routes/webhooks.ts:1568` | **Video tab + leaks into Conversations "All"** (no chip selects it) | NONE — no video chip in `channelFilters` | one `system` message with summary+transcript | no | only badge; not filterable | meaningless |
| AI Chat dashboard (`channel="ai-chat"`) | `client/src/pages/main.tsx:687` | **explicitly hidden** by `teambox.tsx:175` | hidden | n/a | n/a | n/a | n/a |
| Email seed (`channel="email"`) | `seed.ts:571,636` | Conversations | "Email" + "All" | yes | partial | yes | yes |
| WhatsApp seed (`channel="whatsapp"`) | `seed.ts:597` | Conversations | "WhatsApp" + "All" | yes | partial | yes | yes |
| Phone tab (VAPI) | reads `/api/vapi/calls?limit=100` directly (not `conversations`) | Phone tab table | n/a — not part of conversations list | n/a — table view, not thread | each row is a single inbound call; transcript modal opens | yes — column shows assistant id + summary | n/a — read-only |
| Video tab (Tavus) | reads `/api/tavus/conversations` directly | Video tab table | n/a | n/a — table view | n/a — read-only | persona id only (raw UUID, not name) | n/a |

Source for column claims: `client/src/pages/teambox.tsx:174-181` (filter), `:425-547` (Phone+Video tabs), `:723-840` (thread render), `:736-738` (channel badge in thread header), `:801-832` (role-driven alignment).

---

## Mixing / ambiguity findings

1. **Web widget chat vs widget form vs ai-chat** all use `customerName: "Website Visitor"` style placeholders (or auto-generated names) with no source distinguisher beyond `channel`. The `channel="form"` and `channel="ai-chat"` rows look identical in the list except for badge text. There is no `form_payload` or `submission_type` to indicate it was a one-shot form. A human reviewer cannot tell at a glance whether a thread is a live conversation or a form submission. (`teambox.tsx:656-712` — list cell renders only icon + name + last-message snippet + agent badge.)
2. **Voice conversations duplicate**: VAPI calls populate both `conversations` (channel=voice, single `system` transcript message) AND the dedicated Phone tab (`teambox.tsx:425-487`). This means the same call appears twice (once as a list row, once as a table row). No cross-link.
3. **Video conversations are unfilterable in the Conversations tab**: `channel="video"` rows from Tavus webhooks exist in `conversations` (`webhooks.ts:1568,1774`) but `channelFilters` (`teambox.tsx:78-85`) has no `video` entry. They show only under "All" and as a Video-tab table row. Operator cannot isolate them in the conversations list.
4. **`form` channel is unfilterable** for the same reason — chip list has no `form` entry.
5. **`agent` vs `assistant` vs `bot` roles** all render with the same right-aligned bubble (`teambox.tsx:817-821`), with only `bot` getting a distinct primary/10 background. Auto-greeting (`routes/public.ts:288`) writes role=`assistant`; trigger sends (`triggerService.ts:707`) write role=`agent`; AI replies (`outbound.ts`) write role=`bot`. The CRM user cannot tell which subsystem produced which line.
6. **System role shows VAPI transcripts mid-thread** (`webhooks.ts:1181`). The bubble is rendered as a yellow/amber banner, but for a voice convo it's the *only* content. There are no separate caller/agent turns even though the transcript text has them.
7. **Campaign attribution is hidden** unless the operator already knows what to filter for. `campaignId` doesn't render as a badge on the list row; it only appears as a "Disconnect Campaign" button on the selected thread (`teambox.tsx:758-777`) and as an entire dropdown to filter (`:401-420`). A campaign-driven SMS thread is visually identical to an organic inbound SMS thread.
8. **Status `automated` mixes AI-handled SMS/chat/voice/video** under one filter — there is no per-channel breakdown of "AI is replying right now."
9. **`status === 'open'` is the catch-all** for almost every new thread (every `createConversation` call in code passes `status: "open"`), so the "Open" filter is approximately the same as "All minus closed" for a new install.
10. **Org switching at session level**: walking the UI as `duane.wells@huminic.ai`, the org context flipped from Serra Honda (n=18 conversations) to Huminic (n=4 web chats + 1 SMS) mid-session without an explicit operator action — likely a side-effect of an org-switcher click I made unintentionally. Worth flagging because it changes which conversations a customer demo would see.

---

## Proposed sublane taxonomy

**Cardinal claim:** The current TeamBox is *one* surface with *flat* `channel × status` filters. For a customer-facing demo and ongoing operator UX, it should be re-organized into *sublanes* that match the mental models a dealership has, not the technical channels Nexxus emits.

### Minimum required tabs (top-level)

1. **Inbox** — everything inbound that has a customer reply waiting (`status in (open, pending, followup)` AND `last message role in (customer, user, system)`). Default landing view.
2. **AI-Handled** — `status === 'automated'`. Bot is currently replying; show "Take Over" prominently.
3. **My Threads** — `assignedTo === currentUser.id`.
4. **Campaigns** — `campaignId IS NOT NULL`. Sub-grouped by campaign name. Today this is a dropdown filter; promote to a tab.
5. **Voice & Video** — keep the existing Phone + Video tabs but unify them into one "Calls" tab with a sub-filter (Voice / Video). Plus a *"Show in Conversations list"* link so the operator can find the duplicate `channel=voice|video` thread row.
6. **Forms & Lead Notifications** — `channel === 'form'` plus any conversation auto-created from an ADF lead. Today these are invisible behind "All".

### Required sub-filters (per tab)

- **Channel** chip group: SMS, Web Chat, Email, WhatsApp, Voice, Video, Form (currently missing Video and Form).
- **Source/origin** chip group (NEW field required): `inbound_organic`, `inbound_campaign`, `outbound_trigger`, `outbound_campaign`, `widget`, `vapi_inbound`, `tavus_inbound`, `adf_lead`, `seed`. This is the gap between today's 8 channel values and the 6+ creation paths.
- **Department** chip (Sales / Service / Marketing) — currently only present at the agent + campaign level, not at the conversation level. Either inherit from `agentId.department` or add a `department` column on `conversations`.
- **Direction** chip (Inbound / Outbound / Mixed) — derive from `messages` role sequence.

### Per-source separator rules

| Sublane | Separator | Required schema change |
|---|---|---|
| AI vs human takeover | `status === 'automated'` (today's signal). Adequate. | none |
| Campaign vs organic | `campaignId IS NOT NULL`. Today a dropdown only — promote to badge + chip. | none (display only) |
| Trigger SMS vs reply SMS | Today both are `channel="sms"` `role="agent"`. | add `metadata.trigger_id` or new `messageType` enum on `messages` |
| Voice convo vs voice transcript | Today both are `channel="voice"`. The convo row is a thin shell holding one `system` message. | route VAPI calls *only* into the Phone tab; don't double-emit a `conversations` row, OR add `subType="voice_call_summary"` |
| Video session | Today `channel="video"` with no chip. | add `video` to `channelFilters` (`teambox.tsx:78-85`); separately keep Video tab |
| Form submit vs chat | Both are widget-origin but `channel` differs. | add `form` to `channelFilters` AND add a single-message lock so the "Reply" composer doesn't suggest an SMS reply will reach a contact-form submitter |
| Auto-greeting vs human reply | Both right-aligned, both `agent` or `assistant` role. | distinguish via `metadata.system="auto_greeting"` and a small "Auto" tag |
| ADF lead | No conversation row today — only `outboundLog` entries. | decide: do we create a placeholder conversation per ADF lead, or do we link from a "Leads & Forms" sublane to the underlying lead row? |

---

## Must-fix-before-customer-demo (Monday Apr 27, 2026 launch was already past — these are gating items for the next demo cycle)

1. **Add `video` and `form` to `channelFilters`** (`client/src/pages/teambox.tsx:78-85`). Today these channels are unfilterable from the Conversations tab. One-line additions; no schema change.
2. **De-duplicate VAPI voice rows.** Either suppress the `channel="voice"` `conversations` row when the call already lives in the Phone tab, or render it as a transcript-only card (no Reply composer). Today, a demo with VAPI calls shows the same call twice and offers a meaningless reply box.
3. **Render assistant/agent/bot/system distinctly.** Right-bubble + small caption — at minimum show "AI" vs "Human" vs "Auto-greeting" (`teambox.tsx:801-832`). A demo audience cannot distinguish a Claude reply from a human staff reply.
4. **Show campaign attribution in the list cell.** A small campaign-name chip on conversations where `campaignId` is set (today only the right pane reveals it). Most launch traffic is campaign-driven (TestLane SMS, [TESTLANE] Service-Round-Trip, etc.), so leaving this hidden makes the inbox unreadable.
5. **Right pane must reset when filter changes.** Today, after switching from "All" to "SMS", the right pane keeps showing the previously selected `chat` thread (visible in `02-teambox-sms-filter.png` and `06-teambox-voice-filter.png`). Either deselect on filter change or show "Select a conversation".
6. **Phone tab `Assistant` column shows raw UUIDs** (`04-teambox-phone-tab.png`). Resolve to assistant name; today VAPI assistant IDs are passed straight through.
7. **Conversation `customerName === "Test Customer"` overload.** ~8 of Serra Honda's 18 visible conversations are all called "Test Customer" with 0 messages and 0 unread. These appear to be widget-test artefacts that were never cleaned up. Decide: show a "Test data" filter that hides them, OR run a one-shot delete for empty `chat`-channel conversations with name "Test Customer".

## Can-fix-after-launch

1. Promote the campaign filter from a dropdown to a tab.
2. Add a `source` / `origin` enum (or jsonb metadata) to `conversations` so we can distinguish webchat / vapi / tavus / form / trigger / campaign / seed at query time.
3. Add a `department` column on `conversations` (or compute it server-side from `agentId.department` + `campaignId.department`) to drive the Sales/Service/Marketing sublanes.
4. Direction badges on each list cell (← inbound / → outbound / ↔ mixed).
5. Add a "Closed" status filter chip (today `closed` is in the type union but not in `statusFilters`).
6. ADF lead rows: decide on a placeholder-conversation pattern or a separate Leads sublane.
7. Replace the in-thread "system" amber banner with a proper Voice Call Card UI (caller, duration, status badge, transcript expander, recording link) — the Phone tab already does most of this; reuse it.
8. Surface `messages.role === 'assistant' | 'agent' | 'bot'` differentiation either via senderName labels or via a new `metadata.actor` jsonb.

---

## Screenshot paths (relative to project root)

- `evidence/stabilization-sprint-2026-04-30/lane-5-screenshots/01-teambox-main-inbox.png` — TeamBox main inbox (Serra Honda before org switch); 3-tab top bar; channel chip bar; conversation list with multiple "Test Customer" rows.
- `evidence/stabilization-sprint-2026-04-30/lane-5-screenshots/02-teambox-sms-filter.png` — SMS chip selected (Huminic context after silent org switch); 1 SMS conversation `+15551234567` (synthetic test row); right pane shows STALE "Test Customer / CHAT / No messages yet" — the cross-filter UI bug.
- `evidence/stabilization-sprint-2026-04-30/lane-5-screenshots/03-teambox-sms-thread.png` — SMS thread for `+15551234567` showing `chunk-5-relaxed-verify-test` message bubble with `SMS` badge in header.
- `evidence/stabilization-sprint-2026-04-30/lane-5-screenshots/04-teambox-phone-tab.png` — VAPI Call Logs table; 2 rows; raw assistant UUIDs; transcript modal trigger.
- `evidence/stabilization-sprint-2026-04-30/lane-5-screenshots/05-teambox-video-tab.png` — Tavus Video Sessions table; 5 rows; `Huminic Demo` visitor; raw `rb91c99ba958` persona id.
- `evidence/stabilization-sprint-2026-04-30/lane-5-screenshots/06-teambox-voice-filter.png` — Voice chip selected; 0 conversations match; right pane still shows stale CHAT thread.
- `evidence/stabilization-sprint-2026-04-30/lane-5-screenshots/07-teambox-webchat-filter.png` — Web Chat chip; 4 "Test Customer" rows, all 0 unread, all 0 messages.
- `evidence/stabilization-sprint-2026-04-30/lane-5-screenshots/08-teambox-webchat-thread.png` — Selected chat thread; "No messages yet"; CHAT badge.
- `evidence/stabilization-sprint-2026-04-30/lane-5-screenshots/09-teambox-campaign-filter.png` — Campaign dropdown opened; visible entries: `AC1-CommGate-Block-…`, `AC2-MergeFields-…`, all `[TESTLANE]`-style.

---

## Observations

These are incidental findings worth surfacing per lane brief.

1. **`/teambox` page route is unstable in the dev environment.** While walking the UI, the URL repeatedly auto-navigated from `/teambox` to `/`, `/sales?tab=dashboard`, `/marketing`, `/service?tab=insights`, and `/management?tab=hunches` within 2-5 seconds of arriving — without any operator click. The redirect is timing-dependent (visible in the navigation history Playwright produced). I could not fully reproduce a single root cause in code; closest candidates are mouse-out-driven `setActivePanel` flips or sub-menu hover handlers in `client/src/components/layout/Sidebar.tsx:142` and `client/src/components/layout/SubMenuManager.tsx:178-192`, but neither alone calls `setLocation`. Worth a focused investigation as a P1 — TeamBox is unusable for a sustained walk-through right now.

2. **Org switched mid-session without explicit user action.** Login was as `serra_honda@huminic.ai` (Serra Honda). The header initially showed "Serra Honda / SHA". Mid-walk it flipped to "Huminic / DKW" (super_admin profile). Earliest evidence: screenshot `02-teambox-sms-filter.png`. This is a multi-tenant safety concern — the operator should never silently end up viewing another org's data. Likely caused by my own click on the org switcher when probing buttons, but the lack of a visible confirmation is the issue.

3. **Conversations list shows 8 "Test Customer" rows in Serra Honda with 0 messages and 0 unread, 4 more in Huminic.** These are widget-chat carcasses left behind by the auto-greeting flow when the visitor never sent a message. They drown out real conversations. `routes/public.ts:264` creates a conversation immediately when the widget opens; if the visitor closes the tab without sending a message, the row stays. There is no cleanup job. Suggest: hide `chat`-channel rows whose `messages.length === 0` AND `lastMessageAt < now - 24h`, OR run a daily cleanup.

4. **`channel` field has no enum constraint** in the schema (`text("channel")` in `shared/schema.ts:91`). This means typo'd values would write silently. We caught no typo'd values in code, but operationally this is a footgun.

5. **`channel` and `status` are independently parameterizable on `GET /api/conversations`** (`server/routes/conversations.ts:18-23`), but the UI never sends them — it pulls *all* conversations and filters client-side (`client/src/pages/teambox.tsx:174-181`). With `channel="ai-chat"` rows excluded only client-side (line 175), a tenant with thousands of ai-chat threads will pay the network + memory cost. Move the exclusion server-side.

6. **The Phone and Video tabs are the only place where Tavus and VAPI data is truly authoritative.** The `channel="voice" | "video"` rows in `conversations` are summaries with one `system` message. If a future feature wants to show inbound→agent turns of a call, the data isn't in `messages` at all — it's in the Tavus / VAPI APIs. This is a data-modeling gap that affects search, audit, and any per-turn analytics.

7. **`sourceConversationId` on `conversations` (schema.ts:97) is never read by TeamBox.** It exists for some upstream linkage (likely AI-chat session continuation) but the UI ignores it. Dead-code risk — either wire it in for thread chaining or drop it.

8. **Status `participating` is in the filter list but unclear semantically.** From `seed.ts:638` the seed sets `status: "participating"` on a conversation that has both `agentId` AND a customer reply. There is no production code path that writes `status: "participating"` outside seed. The filter shows 0 in dev and will likely always show 0 in prod. Either remove the chip or define a server-side rule.

9. **Status `followup` and `follow-up` (with hyphen) both appear in code.** The hyphenated form occurs only in non-conversations contexts but is worth flagging in case a future migration normalizes.

10. **The "Push to VIN" button in the thread header (`teambox.tsx:778-792`) is a real-customer write surface.** It's gated behind a confirmation dialog (`:976-999`) but the dialog text is generic ("Push this conversation to VIN Solutions as a lead?"). If a demo presenter clicks "Confirm" on the wrong thread, that's a real VIN write through `/api/conversations/:id/push-to-vin`. Worth tightening the confirmation copy to include the customer name + phone + dealer.

11. **Lane brief listed `customer_phone=+15551234567, conversation_id=5ecf6c84-474d-400f-ae78-555d08537c5b` as the synthetic test row.** I found a row with phone `+15551234567` in TeamBox (screenshot 03), but its conversation id is **not** `5ecf6c84-474d-400f-ae78-555d08537c5b` (none of the 18 Serra Honda or 4 Huminic conversation ids matched that UUID). Either the synthetic row was deleted/recreated, or the id in the brief is stale.

12. **Live DB SELECT was denied by sandbox.** Per Auto Mode + CLAUDE.md, `psql "$DATABASE_URL"` against the production Supabase URL requires explicit operator approval. I did not request approval (lane brief explicitly authorized fallback to code-defined enums). The "Distinct values discovered" section is therefore code-defined + live snapshot from the authenticated browser session, not a `SELECT DISTINCT` from the DB. If a per-org count is needed, that requires a separate explicit-approval lane.

---

**End of Lane 5 evidence.**
