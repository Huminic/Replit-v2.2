# TeamBox Section-Function Map

**Eval:** PE-TEAMBOX-03
**Date:** 2026-04-07
**Source:** client/src/pages/teambox.tsx (975 lines)

## Top Menu Bar (data-testid: teambox-top-menu)

| Element | Type | Function |
|---------|------|----------|
| "TeamBox" heading | h1 | Page title |
| Conversations tab | button (tab-teambox-conversations) | Switch to unified inbox view |
| Phone tab | button (tab-teambox-phone) | Switch to VAPI call logs |
| Video tab | button (tab-teambox-video) | Switch to Tavus video sessions |
| Channel filter chips | buttons (channel-chip-{id}) | Filter by: All, SMS, Email, Web Chat, WhatsApp, Voice |
| Campaign filter | Select (select-campaign-filter) | Filter conversations by campaign; only visible if campaigns exist |

## Column 1: Status/Channel Filter Sidebar (w-64, hidden on <lg)

| Element | Type | Function |
|---------|------|----------|
| Conversations/Workflows toggle | button pair (tab-conversations, tab-workflows) | Switch between conversation list and workflow view |
| Search input | Input (input-teambox-search) | Text search by customer name |
| Status filters | buttons (filter-status-{id}) | All, Open, Assigned to me, Participating, Automated, Scheduled, Followup, Pending -- each shows count badge |
| Channel filters | buttons (filter-channel-{id}) | All, SMS, Email, Web Chat, WhatsApp, Voice |

## Column 2: Conversation List (w-72 / xl:w-80)

| Element | Type | Function |
|---------|------|----------|
| Filter label + count badge | header (badge-list-count) | Shows active filter name and filtered conversation count |
| Conversation items | buttons (conversation-item-{id}) | Each shows: avatar with initials, bot overlay for automated, customer name, time since last message, last message preview, channel icon, agent badge, unread count |
| Loading skeleton | ConversationListSkeleton | 5 placeholder items while loading |
| Empty state | text | "No conversations found" when filter yields nothing |

## Column 3: Message Thread (flex-1)

| Element | Type | Function |
|---------|------|----------|
| Thread header | div | Selected customer avatar + name, channel badge |
| Take Over button | Button (button-take-over) | Visible only for automated conversations; transfers from AI to human |
| Disconnect Campaign button | Button (button-disconnect-campaign) | Visible only for campaign conversations; stops future campaign messages |
| Message bubbles | div (message-{id}) | Roles: customer (left, bg-muted), bot (left, bg-primary/10 with border), agent (right, bg-primary), system/transcript (center, amber bg) |
| Message metadata | p elements | Sender name, content text, relative timestamp |
| Reply textarea | Textarea (input-reply) | "Write a reply..." placeholder, 60-120px height, Enter to send |
| Send button | Button (button-send-reply) | Icon button with Send icon; disabled when empty or pending |
| Empty state | text | "Select a conversation to view" when none selected |

## Column 4: Customer Info Panel (w-64, hidden on <xl)

| Element | Type | Function |
|---------|------|----------|
| "Customer Info" heading | h4 | Section title |
| Name | text (text-customer-name) | Customer name |
| Email | text (text-customer-email) | Customer email (conditional) |
| Phone | text (text-customer-phone) | Customer phone (conditional) |
| Channel | Badge | Channel in uppercase |
| Status | Badge | Conversation status label |
| Handled by | text (text-agent-name) | Agent name if agentId exists |
| Assign to | Select (select-assign-to) | Dropdown of team members + Unassigned |
| Call button | Button (button-call-customer) | Opens tel: link |
| Email button | Button (button-email-customer) | Opens mailto: link |
| SMS button | Button (button-sms-customer) | Prefills reply with "[SMS] " and focuses textarea |

## Phone Tab (data-testid: phone-tab-content)

| Element | Type | Function |
|---------|------|----------|
| "VAPI Call Logs" heading | h2 | Section title |
| Calls table | table (phone-calls-table) | Columns: Date, Caller Number, Assistant, Duration, Status, Summary, Transcript button |
| Transcript modal | Dialog | Shows call transcript with optional audio recording link |

## Video Tab (data-testid: video-tab-content)

| Element | Type | Function |
|---------|------|----------|
| "Tavus Video Sessions" heading | h2 | Section title |
| Sessions table | table (video-sessions-table) | Columns: Date, Visitor, Persona, Duration, Status, Recording link |

## Data Sources

| Query | Endpoint | Refresh |
|-------|----------|---------|
| Conversations | GET /api/conversations?orgId | 5s interval |
| Messages | GET /api/conversations/:id/messages | On selection |
| Campaigns | GET /api/campaigns?orgId | Standard |
| VAPI Calls | GET /api/vapi/calls | When phone tab active |
| Tavus Sessions | GET /api/tavus/conversations | When video tab active |
| Team Members | GET /api/users?orgId | Standard |

## Key Filtering Logic

- `ai-chat` channel conversations are always excluded from the list
- Filters stack: status + channel + campaign + search (all AND conditions)
- Search matches customer name only (case-insensitive)
- URL param `?channel=sms|email|voice|video|chat` sets initial channel filter
