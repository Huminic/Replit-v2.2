# PE-TEAMBOX-01 — Section / Page Function Map

**Sprint:** PE-TEAMBOX-01
**Page:** TeamBox (`/teambox`)
**Source file:** `client/src/pages/teambox.tsx`
**Date:** 2026-04-06

---

## Page Purpose

TeamBox is a unified communication inbox for dealership operators. It presents all customer conversations (SMS, Email, Voice) in a 4-column layout and provides tools for human agents to monitor, take over, and respond to conversations that may be automated by AI agents or part of marketing campaigns.

---

## Layout Structure

### 4-Column Layout (Conversations View)

| Column | Width | Visibility | Function |
|--------|-------|------------|----------|
| **1 — Status Sidebar** | w-64 | Hidden on <lg screens | Status filter list with per-status conversation counts. Filters: all, open, assigned, participating, automated, scheduled, followup, pending. |
| **2 — Conversation List** | w-72 / xl:w-80 | Always visible | Scrollable list of conversations. Each entry shows: avatar (with Bot icon overlay if automated), channel icon, agent badge, unread count, customer name, timestamp, and message preview. |
| **3 — Thread Pane** | flex-1 | Always visible | Full message thread for the selected conversation. Messages are color-coded: customer messages use `bg-muted`, bot/AI messages use `bg-primary/10` with border, agent messages use `bg-primary`. Reply input + Send button at the bottom. |
| **4 — Customer Detail Pane** | w-64 | Hidden on <xl screens | Customer info panel: name, email, phone, channel, status, assign-to dropdown, and quick actions (Call, Email, SMS buttons). Also shows Take Over button (automated conversations) and Disconnect Campaign button (campaign conversations). |

---

## Top-Level Tabs

| Tab | Data Source | Content |
|-----|-------------|---------|
| **Conversations** | `GET /api/conversations` (5s refetch) | 4-column inbox layout described above |
| **Phone** | `GET /api/vapi/calls` | VAPI call log table — date, caller number, assistant, duration, status, transcript link |
| **Video** | `GET /api/tavus/conversations` | Tavus video session table — date, persona, duration, status |

---

## Channel Filter Chips (Conversations View Only)

Rendered below the tab bar when Conversations tab is active.

| Chip | Filter Value | Notes |
|------|-------------|-------|
| All | `'all'` | Shows all conversations regardless of channel |
| SMS | `'sms'` | Filters to `conv.channel === 'sms'` |
| Email | `'email'` | Filters to `conv.channel === 'email'` |
| Voice | `'voice'` | Filters to `conv.channel === 'voice'` |

**Notable absences:** No "Chat" chip (despite `chat` and `whatsapp` being defined as channel types in the code). No service campaign filter chip.

---

## Status Filters (Sidebar)

| Status | Label | Count Source |
|--------|-------|-------------|
| all | All | `conversations.length` |
| open | Open | `conversations.filter(c => c.status === 'open')` |
| assigned | Assigned to me | `conversations.filter(c => c.status === 'assigned')` |
| participating | Participating | `conversations.filter(c => c.status === 'participating')` |
| automated | Automated | `conversations.filter(c => c.status === 'automated')` |
| scheduled | Scheduled | `conversations.filter(c => c.status === 'scheduled')` |
| followup | Followup | `conversations.filter(c => c.status === 'followup')` |
| pending | Pending | `conversations.filter(c => c.status === 'pending')` |

---

## Key Actions

| Action | Trigger | API Call | Condition |
|--------|---------|----------|-----------|
| **Send Reply** | Send button or Enter in reply textarea | `POST /api/conversations/:id/messages` with role='agent' | Conversation must be selected, reply text non-empty |
| **Take Over** | "Take Over" button in detail pane or thread header | `PATCH /api/conversations/:id` sets status='open', assignedTo=currentUser | Only appears when `conv.status === 'automated'` |
| **Disconnect Campaign** | Ban icon button in detail pane | `PATCH /api/conversations/:id` sets campaignDisconnected=true | Only appears when conversation has a `campaignId`. Shows "Disconnected" label when already disconnected. |
| **Assign To** | Select dropdown in detail pane | `PATCH /api/conversations/:id` sets assignedTo and status | Team members loaded from `GET /api/users` |
| **Call Customer** | Phone icon in quick actions | Opens `tel:` link | Requires `customerPhone` on conversation |
| **Email Customer** | Mail icon in quick actions | Opens `mailto:` link | Requires `customerEmail` on conversation |
| **SMS Customer** | Smartphone icon in quick actions | Pre-fills reply with `[SMS]` prefix, focuses textarea | Always available |

---

## Search

Text input at top of conversation list. Client-side filter on `customerName.toLowerCase()`.

---

## Auto-Selection Behavior

On initial load, if no conversation is selected and conversations exist, the first conversation is auto-selected (`conversations[0].id`).

---

## Data Refresh

Conversations query uses `refetchInterval: 5000` (5-second polling). Messages and other queries use default React Query behavior (refetch on mount/focus).
