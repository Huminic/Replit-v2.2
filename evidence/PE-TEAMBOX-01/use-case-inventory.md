# PE-TEAMBOX-01 — Use Case Inventory

**Sprint:** PE-TEAMBOX-01
**Date:** 2026-04-06

---

## Use Cases

| ID | Use Case | Category | Known Issues | Priority |
|----|----------|----------|-------------|----------|
| UC-01 | Page loads with conversation list populated | Page Load | None known | High |
| UC-02 | Status filters work (all, open, assigned, automated, etc.) | Filtering | None known | High |
| UC-03 | Channel chips work (All, SMS, Email, Voice) | Filtering | None known | High |
| UC-04 | SMS filter truth — SMS chip shows same SMS conversations visible under All | Filter Integrity | Operator flagged as potential false-pass area | High |
| UC-05 | Click conversation — thread loads in middle pane | Thread Selection | None known | High |
| UC-06 | Click different conversation — thread REFRESHES with new messages | Thread Refresh | Known bug: thread may not refresh on re-selection | Critical |
| UC-07 | Customer detail pane populates on conversation click | Detail Pane | None known | High |
| UC-08 | Third pane (detail) shows correct info for selected conversation | Detail Pane | Known bug: may show nothing or stale data | Critical |
| UC-09 | Service campaign filter exists or is documented as absent | Feature Audit | No campaign filter chip exists in code | Medium |
| UC-10 | Takeover button appears on automated conversations | Operator Action | None known | High |
| UC-11 | Send reply in thread — message appears and persists | Operator Action | None known | High |
| UC-12 | Quick actions (Call/Email/SMS) in detail pane function correctly | Operator Action | Depends on customer data availability | Medium |
| UC-13 | Phone tab shows VAPI call logs | Tab Content | None known | Medium |
| UC-14 | Video tab shows Tavus video sessions | Tab Content | None known | Medium |
| UC-15 | Search by customer name filters conversation list | Search | Client-side only | Medium |
| UC-16 | Inbound message replies visible in threads (real conversation continuity) | Thread Content | Requires real SMS data in production | High |

---

## Use Case Details

### UC-01: Page Load
**Precondition:** Logged in as org_admin or higher. Organization has conversations.
**Action:** Navigate to /teambox.
**Expected:** Conversation list renders in column 2. First conversation auto-selected. Thread pane shows messages. Detail pane shows customer info.
**Evidence type:** Screenshot of loaded page.

### UC-02: Status Filters
**Precondition:** Page loaded with conversations.
**Action:** Click each status filter in sidebar (all, open, assigned, participating, automated, scheduled, followup, pending).
**Expected:** Conversation list filters to matching status. Count badge matches visible count.
**Evidence type:** Screenshot per filter showing count and list.

### UC-03: Channel Chips
**Precondition:** Page loaded with conversations.
**Action:** Click each channel chip (All, SMS, Email, Voice).
**Expected:** Conversation list filters to matching channel. Return to All shows full list.
**Evidence type:** Screenshot per chip.

### UC-04: SMS Filter Truth
**Precondition:** Conversations exist with channel='sms'.
**Action:** Note all SMS conversations visible under All filter. Switch to SMS chip. Compare.
**Expected:** SMS chip shows exactly the same SMS conversations visible under All. No conversations appear under SMS that were not visible under All, and vice versa.
**Evidence type:** Side-by-side comparison with count verification.

### UC-05: Click Conversation — Thread Loads
**Precondition:** Multiple conversations in list.
**Action:** Click a conversation.
**Expected:** Thread pane (column 3) shows messages for that conversation. Messages are color-coded by sender type.
**Evidence type:** Screenshot showing selected conversation and corresponding thread.

### UC-06: Click Different Conversation — Thread Refreshes
**Precondition:** A conversation is already selected with messages visible.
**Action:** Click a different conversation in the list.
**Expected:** Thread pane clears and loads new conversation's messages. Old messages no longer visible. This is a known potential bug area.
**Evidence type:** Before/after screenshots showing thread content change.

### UC-07: Customer Detail Pane Populates
**Precondition:** Conversation selected. Screen width xl+ (detail pane visible).
**Action:** Observe column 4 after selecting a conversation.
**Expected:** Customer name, email, phone, channel, status, assign-to dropdown, and quick action buttons visible. Data matches selected conversation.
**Evidence type:** Screenshot of detail pane.

### UC-08: Third Pane Shows Correct Info
**Precondition:** Conversation selected.
**Action:** Verify detail pane content matches the selected conversation (not a previous selection).
**Expected:** Name, channel, status all correspond to the highlighted conversation in the list.
**Evidence type:** Screenshot cross-referencing list selection with detail pane.

### UC-09: Service Campaign Filter
**Precondition:** Page loaded.
**Action:** Look for any campaign-related filter in the UI (sidebar, chips, or elsewhere).
**Expected:** Document whether a campaign filter exists. Per code review: no campaign filter chip exists. The only campaign-related UI is the "Disconnect Campaign" button on individual conversations that have a `campaignId`.
**Evidence type:** Screenshot or absence documentation.

### UC-10: Takeover Button on Automated Conversations
**Precondition:** At least one conversation with status='automated' exists.
**Action:** Select an automated conversation.
**Expected:** "Take Over" button visible in thread header and/or detail pane. Clicking it changes status to 'open' and assigns to current user.
**Evidence type:** Screenshot showing button. If no automated conversations exist, document absence.

### UC-11: Send Reply in Thread
**Precondition:** Conversation selected.
**Action:** Type a message in the reply textarea and click Send.
**Expected:** Message appears in thread as agent message (primary color). Reply textarea clears. Message persists on refresh.
**Evidence type:** Screenshot before/after send.

### UC-12: Quick Actions (Call/Email/SMS)
**Precondition:** Conversation selected with customer contact info.
**Action:** Click Call, Email, and SMS buttons in detail pane.
**Expected:** Call opens tel: link. Email opens mailto: link. SMS pre-fills reply with [SMS] prefix.
**Evidence type:** Screenshot of quick action buttons. Note which actions are available based on data.

### UC-13: Phone Tab — VAPI Call Logs
**Precondition:** Phone tab clicked.
**Action:** Switch to Phone tab.
**Expected:** Table renders with VAPI call data: date, caller number, assistant, duration, status. Or empty state message.
**Evidence type:** Screenshot of phone tab content.

### UC-14: Video Tab — Tavus Sessions
**Precondition:** Video tab clicked.
**Action:** Switch to Video tab.
**Expected:** Table renders with Tavus session data. Or empty state message.
**Evidence type:** Screenshot of video tab content.

### UC-15: Search by Customer Name
**Precondition:** Conversations loaded.
**Action:** Type a customer name (or partial) in the search input.
**Expected:** Conversation list filters to matching names (case-insensitive).
**Evidence type:** Screenshot showing filtered results.

### UC-16: Inbound Message Replies in Threads
**Precondition:** A conversation with real back-and-forth messages (customer sent, system replied, customer replied again).
**Action:** Select such a conversation and read the thread.
**Expected:** All messages in sequence are visible, correctly attributed, and in chronological order.
**Evidence type:** Screenshot of a multi-turn thread.
