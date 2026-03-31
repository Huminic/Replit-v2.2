# TeamBox Domain Test Plan (Domain 05)

**Sprint:** T-002
**Domain:** TeamBox / Conversations / Unified Inbox
**Page:** `client/src/pages/teambox.tsx`
**API Routes:** `server/routes/conversations.ts`, `server/routes/sms.ts`
**Schema:** `shared/schema.ts` — conversations, messages tables

---

## Existing Coverage (5.1–5.11)

| ID   | Test Name                                    | Type | Coverage |
|------|----------------------------------------------|------|----------|
| 5.1  | Universal inbox shows conversations          | API  | Loads /api/conversations, checks array + channel set |
| 5.2  | Conversation list loads with correct data    | API  | Verifies structure: id, channel fields |
| 5.3  | Messages endpoint returns thread             | API  | GET /api/conversations/:id/messages returns array |
| 5.4  | Takeover stops AI via assignedTo             | API  | PATCH status to closed/open (assignedTo column limitation noted) |
| 5.5  | Role-based conversation visibility           | API  | Admin vs sales both return arrays without error |
| 5.6  | Org Admin+ sees all conversations            | API  | orgAdmin GET /api/conversations succeeds |
| 5.7  | My Work shows own messages only              | API  | GET /api/conversations?myWork=true for sales user |
| 5.8  | Outbound email via TeamBox works             | API  | POST /api/conversations/:id/email |
| 5.9  | SMS webhook routes to correct org            | API  | POST /api/webhooks/textmagic with receiver number, verify org routing |
| 5.10 | Thread history preserved across time gaps    | API  | Messages endpoint returns array regardless of time gaps |
| 5.11 | Workflows tab state in TeamBox               | UI   | Browser login, check workflows tab exists/disabled |

---

## Gap Analysis

**Well-covered:** Basic conversation listing, message thread retrieval, email send, SMS webhook routing, workflows tab.

**Gaps identified:**
- No UI tests for conversation list rendering, selection, or layout
- No channel filter tests (client-side filtering logic)
- No status filter tests (8 status types in sidebar)
- No search functionality tests
- No send-reply flow tests (POST message + SMS delivery)
- No takeover UI flow (button visibility, mutation, toast)
- No campaign disconnect tests (PATCH campaignDisconnected, button states)
- No unread count badge tests
- No customer info panel tests (column 4)
- No assign-to dropdown tests
- No Phone tab (VAPI call logs) tests
- No Video tab (Tavus sessions) tests
- No conversation creation tests (POST /api/conversations)
- No conversation deletion tests (DELETE, role-gated)
- No cross-org access denial tests
- No pagination/sort behavior tests
- No empty state rendering tests
- No real-time polling verification (refetchInterval: 5000)
- No SMS STOP keyword handling tests
- No after-hours auto-response tests
- No transcript modal tests
- No quick action buttons (Call/Email/SMS) tests

---

## Test Cases

### A. Conversation List — Load, Structure, Display

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-TB-001 | Conversation list loads for authenticated user | P0 | API | GET /api/conversations with admin token | 200, returns array with id, channel, status, customerName, organizationId |
| TC-TB-002 | Conversation list respects org scoping | P0 | API | Login as orgAdmin (Serra Honda), GET /api/conversations | All returned conversations have organizationId matching Serra Honda |
| TC-TB-003 | Conversation list empty state renders | P1 | UI | Login as user with org that has no conversations, navigate to /teambox | "No conversations found" message displayed |
| TC-TB-004 | Conversation list shows customer name and channel icon | P1 | UI | Login, navigate to /teambox with existing conversations | Each conversation-item shows customerName text and channel icon (Smartphone/Mail/MessageSquare) |
| TC-TB-005 | Conversation list auto-selects first item | P1 | UI | Login, navigate to /teambox with conversations present | First conversation is selected (bg-accent), messages load in center panel |
| TC-TB-006 | Conversation list shows unread count badge | P1 | UI | Create conversation with unreadCount > 0, navigate to /teambox | Badge with unread count visible on conversation item |
| TC-TB-007 | Conversation list shows relative timestamp | P2 | UI | Navigate to /teambox with conversations that have lastMessageAt | Each item shows time distance (e.g., "5m", "2h") |
| TC-TB-008 | Conversation list shows automated bot overlay | P2 | UI | Have conversation with status "automated", navigate to /teambox | Purple Bot icon overlay on avatar for automated conversations |
| TC-TB-009 | Conversation list badge shows filtered count | P1 | UI | Navigate to /teambox, apply a status filter | badge-list-count shows count matching filtered list length |
| TC-TB-010 | Selecting conversation loads its messages | P0 | UI | Click a different conversation in the list | Center panel updates with messages from clicked conversation |

### B. Channel Filters

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-TB-011 | Channel filter — All shows all conversations | P0 | API+UI | Navigate to /teambox, click "All" channel chip | All conversations displayed regardless of channel |
| TC-TB-012 | Channel filter — SMS only | P0 | UI | Click "SMS" channel chip | Only conversations with channel=sms displayed |
| TC-TB-013 | Channel filter — Email only | P1 | UI | Click "Email" channel chip | Only conversations with channel=email displayed |
| TC-TB-014 | Channel filter — Voice only | P1 | UI | Click "Voice" channel chip | Only conversations with channel=voice displayed |
| TC-TB-015 | Channel filter via URL param | P1 | UI | Navigate to /teambox?channel=sms | SMS channel filter pre-selected, only SMS conversations shown |
| TC-TB-016 | API channel filter parameter | P0 | API | GET /api/conversations?channel=sms with admin token | Only SMS conversations returned |
| TC-TB-017 | Channel filter chips highlight active | P2 | UI | Click "Email" chip | Email chip has bg-primary styling, others have bg-background |

### C. Status Filters

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-TB-018 | Status filter — All shows all | P0 | UI | Click "All" in status sidebar | All conversations displayed |
| TC-TB-019 | Status filter — Open only | P0 | UI | Click "Open" in status sidebar | Only conversations with status=open displayed |
| TC-TB-020 | Status filter — Assigned to me | P1 | UI | Click "Assigned to me" in status sidebar | Only conversations with status=assigned displayed |
| TC-TB-021 | Status filter — Automated | P1 | UI | Click "Automated" in status sidebar | Only conversations with status=automated displayed |
| TC-TB-022 | Status filter — Followup | P1 | UI | Click "Followup" in status sidebar | Only conversations with status=followup displayed |
| TC-TB-023 | Status filter — Pending | P2 | UI | Click "Pending" in status sidebar | Only conversations with status=pending displayed |
| TC-TB-024 | Status filter — Scheduled | P2 | UI | Click "Scheduled" in status sidebar | Only conversations with status=scheduled displayed |
| TC-TB-025 | Status filter — Participating | P2 | UI | Click "Participating" in status sidebar | Only conversations with status=participating displayed |
| TC-TB-026 | Status filter shows count badges | P1 | UI | Navigate to /teambox with mixed-status conversations | Each status filter button shows correct count in Badge |
| TC-TB-027 | API status filter parameter | P0 | API | GET /api/conversations?status=open with admin token | Only open conversations returned |
| TC-TB-028 | Combined channel + status filter | P1 | UI | Set status=open and channel=sms | Only open SMS conversations displayed |

### D. Agent Filter / Assignment

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-TB-029 | API agentId filter parameter | P1 | API | GET /api/conversations?agentId={id} with admin token | Only conversations assigned to that agent returned |
| TC-TB-030 | Assign conversation to team member | P1 | UI | Select conversation, use "Assign to" dropdown, pick a team member | PATCH /api/conversations/:id with assignedTo and status=assigned |
| TC-TB-031 | Unassign conversation | P1 | UI | Select assigned conversation, choose "Unassigned" from dropdown | PATCH with assignedTo=null and status=open |
| TC-TB-032 | Team members dropdown populated | P2 | UI | Select a conversation, inspect "Assign to" dropdown | All org team members listed in SelectContent |

### E. Message Thread

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-TB-033 | Messages load for selected conversation | P0 | API | GET /api/conversations/:id/messages with admin token | 200, array of messages with id, role, content, senderName, createdAt |
| TC-TB-034 | Messages display correct styling by role | P1 | UI | View conversation with user, agent, and bot messages | Customer messages: bg-muted left-aligned; Agent: bg-primary right-aligned; Bot: bg-primary/10 with border |
| TC-TB-035 | Messages show sender name and timestamp | P1 | UI | View conversation thread | Each message bubble shows senderName and relative time |
| TC-TB-036 | Empty thread shows "No messages yet" | P1 | UI | Select conversation with no messages | "No messages yet" centered text displayed |
| TC-TB-037 | Thread auto-scrolls to bottom on new messages | P2 | UI | Send a reply in an active thread | Scroll position moves to bottom after message appears |
| TC-TB-038 | POST message to conversation | P0 | API | POST /api/conversations/:id/messages with role=agent, content, senderName | 201, message created with correct fields, lastMessageAt updated |
| TC-TB-039 | Message creation validates required fields | P1 | API | POST /api/conversations/:id/messages with missing content | 400, validation error returned |

### F. Send Reply

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-TB-040 | Send reply button disabled when empty | P1 | UI | Navigate to /teambox, leave reply textarea empty | Send button is disabled |
| TC-TB-041 | Send reply via button click | P0 | UI | Type message in textarea, click send button | Message appears in thread, textarea clears, queries invalidated |
| TC-TB-042 | Send reply via Enter key | P1 | UI | Type message, press Enter (no Shift) | Message sent, same as button click |
| TC-TB-043 | Shift+Enter inserts newline | P2 | UI | Type message, press Shift+Enter | Newline inserted in textarea, message NOT sent |
| TC-TB-044 | SMS reply auto-sends to customer phone | P1 | API | POST message with role=agent on SMS conversation with customerPhone | processOutboundSend called, SMS delivered |
| TC-TB-045 | [SMS] prefix triggers SMS on non-SMS channel | P2 | API | POST message with content "[SMS] Hello" on email conversation with phone | SMS sent after stripping prefix |

### G. Takeover

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-TB-046 | Take Over button visible on automated conversations | P0 | UI | Select conversation with agentId set and status=automated | "Take Over" button visible in header |
| TC-TB-047 | Take Over button hidden on non-automated conversations | P1 | UI | Select conversation with status=open (no agentId or not automated) | "Take Over" button not rendered |
| TC-TB-048 | Take Over PATCH sets assignedTo and status | P0 | API | PATCH /api/conversations/:id with { status: "open", assignedTo: userId } | Conversation updated, aiPaused=true in response |
| TC-TB-049 | Take Over shows success toast | P1 | UI | Click "Take Over" button | Toast: "Conversation taken over" with description about AI paused |
| TC-TB-050 | AI skips response when assignedTo is set | P1 | API | Set assignedTo on conversation, send inbound SMS webhook | AI agent does NOT generate/send response (checks freshConversation.assignedTo) |

### H. Campaign Disconnect

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-TB-051 | Disconnect Campaign button visible on campaign conversations | P0 | UI | Select conversation with campaignId set | "Disconnect Campaign" button visible with Ban icon |
| TC-TB-052 | Disconnect Campaign button hidden when no campaign | P1 | UI | Select conversation without campaignId | Button not rendered |
| TC-TB-053 | Disconnect Campaign PATCH sets campaignDisconnected | P0 | API | PATCH /api/conversations/:id with { campaignDisconnected: true } | Conversation updated, campaignDisconnected=true |
| TC-TB-054 | Already disconnected shows "Disconnected" (disabled) | P1 | UI | Select conversation with campaignDisconnected=true | Button text "Disconnected", button disabled, muted styling |

### I. Unread Counts

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-TB-055 | Unread count badge displayed on conversation item | P1 | UI | Have conversation with unreadCount > 0 | Badge with count visible in conversation list |
| TC-TB-056 | Unread count incremented on inbound SMS | P0 | API | Send TextMagic webhook for existing conversation | unreadCount incremented by 1 on conversation record |
| TC-TB-057 | Unread count reset via PATCH | P1 | API | PATCH /api/conversations/:id with { unreadCount: 0 } | Conversation unreadCount set to 0 |

### J. Search

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-TB-058 | Search filters conversations by customer name | P1 | UI | Type customer name in search input | Only conversations matching search term displayed |
| TC-TB-059 | Search is case-insensitive | P2 | UI | Type lowercase variant of customer name | Matching conversations still displayed |
| TC-TB-060 | Empty search shows all conversations | P1 | UI | Clear search input | All conversations (within active filters) displayed |
| TC-TB-061 | Search combined with status and channel filters | P2 | UI | Set search term + status filter + channel filter | Only conversations matching ALL three criteria displayed |

### K. Role-Based Access

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-TB-062 | Super admin sees all org conversations | P0 | API | GET /api/conversations as super_admin | Returns conversations (existing test 5.1/5.5 covers partially) |
| TC-TB-063 | Sales user sees org-scoped conversations | P0 | API | GET /api/conversations as sales user | Returns only conversations for user's org |
| TC-TB-064 | Cross-org conversation access denied | P0 | API | GET /api/conversations/:id where conversation belongs to different org, as roleLevel > 2 user | 403 Access denied |
| TC-TB-065 | Cross-org message access denied | P1 | API | GET /api/conversations/:id/messages for cross-org conversation as restricted user | 403 Access denied |
| TC-TB-066 | Delete conversation requires role level 3+ | P0 | API | DELETE /api/conversations/:id as sales user (roleLevel > 3) | 403 or role enforcement error |
| TC-TB-067 | Delete conversation succeeds for authorized role | P1 | API | DELETE /api/conversations/:id as admin (roleLevel <= 3) | 200, conversation deleted |
| TC-TB-068 | Unauthenticated access returns 401 | P0 | API | GET /api/conversations without auth header | 401 Not authenticated |

### L. Conversation CRUD

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-TB-069 | Create conversation via API | P0 | API | POST /api/conversations with customerName, channel, status | 201, conversation created with organizationId from auth |
| TC-TB-070 | Create conversation validates required fields | P1 | API | POST /api/conversations with missing customerName | 400, validation error |
| TC-TB-071 | Get single conversation by ID | P1 | API | GET /api/conversations/:id with valid ID | 200, full conversation object |
| TC-TB-072 | Get non-existent conversation returns 404 | P1 | API | GET /api/conversations/:id with invalid UUID | 404 Conversation not found |
| TC-TB-073 | Update conversation status via PATCH | P0 | API | PATCH /api/conversations/:id with { status: "closed" } | Updated conversation with new status |
| TC-TB-074 | PATCH validates update schema | P1 | API | PATCH /api/conversations/:id with invalid field type | 400, validation error |

### M. SMS Webhook and Inbound Processing

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-TB-075 | Inbound SMS creates new conversation | P0 | API | POST /api/webhooks/textmagic with new phone number | Conversation created with channel=sms, message stored |
| TC-TB-076 | Inbound SMS appends to existing conversation | P0 | API | POST /api/webhooks/textmagic with phone matching existing conversation | Message added to existing conversation, unreadCount incremented |
| TC-TB-077 | SMS webhook missing sender returns 400 | P1 | API | POST /api/webhooks/textmagic with empty sender | 400 Missing sender or text |
| TC-TB-078 | SMS STOP keyword blacklists sender | P0 | API | POST /api/webhooks/textmagic with text="STOP" | Phone blacklisted, open conversations closed, confirmation sent |
| TC-TB-079 | SMS STOP keywords variant (UNSUBSCRIBE, QUIT, etc.) | P1 | API | POST /api/webhooks/textmagic with text="UNSUBSCRIBE" | Same blacklist behavior as STOP |
| TC-TB-080 | Outbound echo detection skips self-messages | P1 | API | POST /api/webhooks/textmagic where sender matches org TextMagic number | 200 with skipped=true, reason=outbound_echo |
| TC-TB-081 | Org resolved via receiver TextMagic number | P0 | API | POST /api/webhooks/textmagic with receiver matching org phone | Conversation created in correct org (existing test 5.9 covers) |
| TC-TB-082 | Rate limiting on webhook endpoint | P2 | API | Send 31+ requests from same IP in 60 seconds | 429 Too many requests after limit exceeded |
| TC-TB-083 | Campaign reply links to source conversation | P1 | API | Inbound SMS from phone with prior campaign outbound | New conversation has campaignId and sourceConversationId set |
| TC-TB-084 | Vehicle context injected for campaign replies | P2 | API | Inbound SMS reply to campaign with vehicle data on recipient | System message with vehicle info added to conversation |

### N. After-Hours Auto-Response

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-TB-085 | After-hours auto-response sent outside business hours | P1 | API | Configure org with narrow business hours, send SMS webhook outside those hours | Auto-response SMS sent with configured template |
| TC-TB-086 | After-hours tags conversation for followup | P1 | API | Same as TC-TB-085 | Conversation tagged with "Followup" |
| TC-TB-087 | AI agent skips processing during after-hours | P1 | API | Send SMS webhook during after-hours | AI response NOT triggered (isAfterHours guard) |
| TC-TB-088 | Follow-up scheduled for next business opening | P2 | API | Send SMS webhook during after-hours | Scheduled action created with executeAt at next business hours start |

### O. Outbound Email

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-TB-089 | Email send requires to, subject, body | P1 | API | POST /api/conversations/:id/email with missing "to" | 400 Missing required fields |
| TC-TB-090 | Email send without RESEND_API_KEY returns 503 | P1 | API | POST /api/conversations/:id/email (no Resend key configured) | 503 Email service not configured |
| TC-TB-091 | Email send stores message in conversation | P1 | API | POST /api/conversations/:id/email with valid data | Message created with email content, lastMessageAt updated |

### P. Phone Tab (VAPI Call Logs)

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-TB-092 | Phone tab loads VAPI call logs | P1 | UI | Click "Phone" tab in TeamBox top menu | VAPI calls table displayed with Date, Caller, Assistant, Duration, Status columns |
| TC-TB-093 | Phone tab empty state | P2 | UI | Click Phone tab with no call logs | "No call logs found" message displayed |
| TC-TB-094 | Transcript modal opens from call row | P2 | UI | Click "Transcript" button on a call row with transcript | Dialog opens with transcript text and optional recording link |

### Q. Video Tab (Tavus Sessions)

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-TB-095 | Video tab loads Tavus sessions | P1 | UI | Click "Video" tab in TeamBox top menu | Tavus sessions table displayed with Date, Visitor, Persona, Duration, Status columns |
| TC-TB-096 | Video tab empty state | P2 | UI | Click Video tab with no sessions | "No video sessions found" message displayed |
| TC-TB-097 | Recording link available on video session | P2 | UI | View session with recording_url | "Recording" link visible, opens in new tab |

### R. Customer Info Panel (Column 4)

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-TB-098 | Customer info panel shows name | P1 | UI | Select conversation | text-customer-name shows customerName |
| TC-TB-099 | Customer info panel shows email when present | P2 | UI | Select conversation with customerEmail | text-customer-email visible |
| TC-TB-100 | Customer info panel shows phone when present | P2 | UI | Select conversation with customerPhone | text-customer-phone visible |
| TC-TB-101 | Customer info panel shows channel and status | P1 | UI | Select conversation | Channel badge and status badge displayed |
| TC-TB-102 | Quick Action — Call button | P2 | UI | Click "Call" button with phone present | tel: link triggered |
| TC-TB-103 | Quick Action — Call button no phone shows toast | P2 | UI | Click "Call" on conversation without phone | Toast: "No phone number available" |
| TC-TB-104 | Quick Action — Email button | P2 | UI | Click "Email" button with email present | mailto: link triggered |
| TC-TB-105 | Quick Action — SMS button prefills [SMS] | P2 | UI | Click "SMS" quick action | Reply textarea gets "[SMS] " prefix, textarea focused |

### S. Real-Time Polling

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-TB-106 | Conversations refetch on 5-second interval | P2 | UI | Monitor network requests on /teambox page | GET /api/conversations fires every ~5 seconds (refetchInterval: 5000) |

### T. SMS Blacklist Management

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-TB-107 | Get SMS blacklist requires role 3+ | P1 | API | GET /api/sms-blacklist as orgAdmin (roleLevel 3) | 200, returns blacklist entries |
| TC-TB-108 | Remove blacklist entry | P1 | API | DELETE /api/sms-blacklist/:id as orgAdmin | 200, entry removed |
| TC-TB-109 | Remove non-existent blacklist entry returns 404 | P2 | API | DELETE /api/sms-blacklist/:invalidId as orgAdmin | 404 Blacklist entry not found |

---

## Priority Summary

| Priority | Count | Description |
|----------|-------|-------------|
| P0       | 22    | Core functionality — must pass for domain sign-off |
| P1       | 47    | Important features — expected in complete coverage |
| P2       | 40    | Edge cases, UX polish, secondary features |
| **Total**| **109** | |

## Existing vs New

| Category | Count |
|----------|-------|
| Existing (5.1–5.11) | 11 tests |
| New test cases | 98 cases |
| **Total planned** | **109** |

## Implementation Notes

1. **Test users available:** superAdmin, partnerAdmin, orgAdmin (Serra Honda), sales, service, marketing, executive, plus per-dealer orgAdmins
2. **Auth caching:** File-based token cache at `.playwright-auth-cache.json` — API tests use `login()`, browser tests use `loginForBrowser()`
3. **Known limitation:** `assignedTo` column exists in schema but PATCH behavior for aiPaused computation returns `!!(conv).assignedTo` — test 5.4 documents this
4. **Conversation creation for test setup:** POST /api/conversations accepts customerName, customerEmail, customerPhone, channel, status
5. **UI data-testid attributes available:** teambox-page, teambox-top-menu, tab-teambox-conversations, tab-teambox-phone, tab-teambox-video, channel-chip-*, filter-status-*, filter-channel-*, input-teambox-search, badge-list-count, conversation-item-*, text-conversation-customer, message-*, input-reply, button-send-reply, button-take-over, button-disconnect-campaign, select-assign-to, text-customer-name, text-customer-email, text-customer-phone, text-agent-name, button-call-customer, button-email-customer, button-sms-customer, tab-conversations, tab-workflows
6. **SMS webhook endpoint:** POST /api/webhooks/textmagic (multipart/form-data via multer, no auth required)
7. **Refetch interval:** Conversations poll every 5000ms — can be verified via network request monitoring
