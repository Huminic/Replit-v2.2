# PE-TEAMBOX-01 Evidence Index

**Evaluation:** TeamBox Page Production Evaluation
**Date:** 2026-04-06
**Environment:** https://live.huminic.app/teambox
**User:** serra_honda@huminic.ai (org_admin, Serra Honda)
**Evaluator:** Playwright Operator (automated)

---

## Phase 1: List and Filters

### UC-01: Conversation List Load
- **Result:** PASS
- **Screenshot:** screenshots/UC-01-teambox-clean.png
- **Commentary:** Conversation list loads with 600 total conversations under "All" status. List is scrollable, shows contact initials badge, name, optional timestamp, optional message preview, and optional unread count badge. Page renders within 3 seconds.

### UC-02: Status Filter Cycling
- **Result:** FAIL (CRITICAL)
- **Screenshot:** screenshots/UC-01-teambox-clean.png
- **Commentary:** There are NO status filters (open, assigned, automated, scheduled, followup, pending). The only "status" shown is a single "All" label with the total count. The conversation list has no way to filter by conversation lifecycle status. This means a manager cannot find escalated, automated, or pending-followup conversations without scrolling through all 600.

### UC-03: Channel Chip Filtering
- **Result:** PASS
- **Screenshot:** screenshots/UC-03-04-sms-filter.png, screenshots/UC-03-email-filter.png, screenshots/UC-03-voice-filter.png
- **Commentary:** Channel chips (All, SMS, Email, Voice) work correctly.
  - All: 600 conversations
  - SMS: 57 conversations
  - Email: 2 conversations (David Jackson, Stephanie Thompson)
  - Voice: 113 conversations
  - Remaining (Chat/AI-Chat): 600 - 57 - 2 - 113 = 428
  - Counts change immediately on click. Filter state is visually indicated (active chip highlighted blue).

### UC-04: SMS Filter Truth
- **Result:** INCONCLUSIVE / PARTIAL FAIL
- **Screenshot:** screenshots/UC-04-all-view-badges.png, screenshots/UC-03-04-sms-filter.png
- **Commentary:** SMS filter reports 57 conversations. However, there is no way to independently verify this from the "All" view because conversation list items do NOT display channel type badges/icons in a text-accessible way. You cannot visually distinguish SMS from Chat from Voice in the list. The channel type only appears in the thread pane header after clicking a conversation. This makes the SMS filter count unverifiable without clicking all 600 items. The filter itself appears functional (clicking SMS shows different items than All, and the items tested do have SMS badges in the thread pane), but the operator's concern about count mismatch cannot be confirmed or denied through the UI alone.
- **Bug Reference:** BUG-TB-03 (missing channel indicator on list items)

### UC-09: Service Campaign Filter
- **Result:** FAIL (CONFIRMED -- operator bug #8)
- **Screenshot:** screenshots/UC-01-teambox-clean.png
- **Commentary:** There is NO filter for service campaigns anywhere in the TeamBox UI. No dropdown, no chip, no search option. The only filtering available is by channel type (All/SMS/Email/Voice). There is no way to filter by campaign, service type, lead source, or any business classification.

---

## Phase 2: Thread and Detail Pane

### UC-05: Thread Pane Message Loading
- **Result:** PASS (partial)
- **Screenshot:** screenshots/UC-05-thread-with-messages.png, screenshots/UC-05-thread-serra-honda-admin.png
- **Commentary:** Thread pane loads messages when a conversation with messages is clicked. Tested "+15551234567" (38 messages visible), "Michael Clark" (4 messages visible including AI agent responses), "CommGate Test" (messages from Caroline agent). However, many conversations (especially Cross Org test conversations) show "No messages yet" even though they appear in the list. The thread pane does update its header and content on click.

### UC-06: Thread Pane Refresh on Click
- **Result:** PASS
- **Screenshot:** screenshots/UC-06-thread-crossorg.png, screenshots/UC-05-thread-serra-honda-admin.png
- **Commentary:** Thread pane correctly refreshes when clicking different conversations. Tested transitions: Test Customer -> Serra Honda Admin -> Cross Org Msg Test -> +15551234567 -> Michael Clark -> Joshua Thompson -> Melissa Taylor -> CommGate Test -> RI-SMS-4 Takeover Test. Header (name + channel badge) and message content update every time. This does NOT confirm operator bug #6 -- the thread pane refresh appears to work.

### UC-07: Customer Detail Pane Population
- **Result:** FAIL (CRITICAL)
- **Screenshot:** screenshots/UC-08-detail-michael-clark.png, screenshots/UC-08-detail-joshua-thompson.png
- **Commentary:** There is NO customer detail pane (third column/right panel) visible at any time. The TeamBox layout is a 2-column layout: conversation list (left) + thread pane (right). There is no third column showing customer info, contact details, VIN Solutions data, or any customer context. This is the operator's bug #6/8.

### UC-08: Third Pane Bug (5 conversations tested)
- **Result:** FAIL (CRITICAL -- operator bug confirmed)
- **Screenshot:** screenshots/UC-08-detail-michael-clark.png, screenshots/UC-08-detail-joshua-thompson.png, screenshots/UC-08-detail-melissa-taylor.png, screenshots/UC-08-detail-crossorg-test.png, screenshots/UC-08-detail-commgate-test.png
- **Commentary:** Tested 5+ different conversations:
  1. Michael Clark (SMS, 3 messages) -- NO detail pane
  2. Joshua Thompson (SMS, 2 messages) -- NO detail pane
  3. Melissa Taylor (SMS, 1 message) -- NO detail pane, has "Disconnected" badge
  4. Cross Org Test (SMS, no messages) -- NO detail pane
  5. CommGate Test (SMS, 7 messages) -- NO detail pane
  
  The third pane simply does not exist in the current UI. It is not that it shows "no information" -- the column itself is absent. The entire right side of the screen after the thread pane is blank/nonexistent.

### UC-16: AI Agent Responses in SMS Conversations
- **Result:** PASS (partial)
- **Screenshot:** screenshots/UC-08-detail-michael-clark.png, screenshots/UC-08-detail-joshua-thompson.png, screenshots/UC-08-detail-melissa-taylor.png, screenshots/UC-08-detail-commgate-test.png
- **Commentary:** AI agent responses ARE visible in some SMS conversations:
  - Michael Clark: "Sales Agent" sent initial outreach and follow-up
  - Joshua Thompson: "Communications Agent" sent initial outreach
  - Melissa Taylor: "Service Guru" sent service reminder
  - CommGate Test: "Caroline" sent greeting
  - +15551234567: All 38 messages appear to be from the same sender (test data, all outbound)
  
  However, many test conversations (Cross Org *, RI-SMS-4 Takeover Test) show only test agent messages. The operator's observation "I don't see any responses to text message tests other than mine" may be specific to certain recent conversations or test data, not a systemic missing-response bug.

---

## Phase 3: Takeover and Reply

### UC-10: Take Over Button
- **Result:** FAIL (CRITICAL)
- **Screenshot:** screenshots/UC-10-takeover-test.png
- **Commentary:** NO "Take Over" button exists anywhere in the TeamBox UI. Tested the "RI-SMS-4 Takeover Test" conversation which was specifically created to test takeover functionality. The thread pane shows only: header (name + badge), messages, and reply input. There is no takeover button, no status toggle, no "automated/manual" switch. A manager cannot take over an automated conversation from TeamBox.

### UC-11: Reply After Takeover
- **Result:** BLOCKED (no takeover button exists)
- **Commentary:** Cannot test reply-after-takeover because UC-10 failed. The reply input ("Write a reply...") is visible but the send button is disabled until text is typed. Typing was not tested as this is observation-only for UC-11 (depends on UC-10).

### UC-12: Quick Actions (Call, Email, SMS)
- **Result:** FAIL
- **Screenshot:** screenshots/UC-08-detail-michael-clark.png
- **Commentary:** There are NO quick action buttons (Call, Email, SMS) anywhere in the TeamBox UI. The detail pane that would normally contain these buttons does not exist (see UC-07/UC-08). The only interaction available is typing in the reply input.

---

## Phase 4: Phone and Video Tabs

### UC-13: Phone Tab (VAPI Call Logs)
- **Result:** PASS
- **Screenshot:** screenshots/UC-13-phone-tab.png
- **Commentary:** Phone tab loads and displays "VAPI Call Logs" table with columns: Date, Caller Number, Assistant, Duration, Status. Multiple call records visible from 4/5/2026 with durations (47-51s), all "ended" status, and "Transcript" links. Issues noted:
  - Caller Number shows "-" for all entries (missing data)
  - Assistant column shows raw UUIDs instead of human-readable agent names
  - These are usability issues, not functional failures

### UC-14: Video Tab (Tavus Sessions)
- **Result:** PASS (empty state)
- **Screenshot:** screenshots/UC-14-video-tab.png
- **Commentary:** Video tab loads and displays "Tavus Video Sessions" heading with "No video sessions found" message. Empty state renders cleanly. Cannot verify that actual video sessions would display correctly since there is no data.

---

## Phase 5: Search

### UC-15: Search Input
- **Result:** FAIL (CRITICAL)
- **Screenshot:** screenshots/UC-01-teambox-clean.png
- **Commentary:** There is NO search input anywhere on the TeamBox Conversations tab. With 600 conversations, there is no way to find a specific customer by name, phone number, or message content without scrolling through the entire list. The only way to narrow results is by channel type (SMS/Email/Voice).

---

## Summary

| UC | Description | Result |
|----|-------------|--------|
| UC-01 | Conversation list load | PASS |
| UC-02 | Status filters | FAIL (missing entirely) |
| UC-03 | Channel chip filtering | PASS |
| UC-04 | SMS filter truth | INCONCLUSIVE |
| UC-05 | Thread pane messages | PASS (partial) |
| UC-06 | Thread pane refresh | PASS |
| UC-07 | Detail pane population | FAIL (missing entirely) |
| UC-08 | Third pane bug | FAIL (confirmed) |
| UC-09 | Service campaign filter | FAIL (missing entirely) |
| UC-10 | Take Over button | FAIL (missing entirely) |
| UC-11 | Reply after takeover | BLOCKED |
| UC-12 | Quick actions | FAIL (missing entirely) |
| UC-13 | Phone tab | PASS |
| UC-14 | Video tab | PASS (empty) |
| UC-15 | Search | FAIL (missing entirely) |
| UC-16 | AI agent responses | PASS (partial) |

**Overall: 4 PASS, 1 PARTIAL PASS, 8 FAIL, 1 BLOCKED, 1 INCONCLUSIVE, 1 PASS (empty)**

Critical findings: The TeamBox page is missing fundamental features expected by the operator: status filters, search, customer detail pane (third column), takeover functionality, and quick actions. The page functions as a basic 2-column conversation viewer with channel filtering only.
