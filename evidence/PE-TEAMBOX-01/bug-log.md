# PE-TEAMBOX-01 Bug Log

**Date:** 2026-04-06
**Page:** TeamBox (/teambox)
**User:** serra_honda@huminic.ai (org_admin)

---

## BUG-TB-01: No Status Filters Exist

- **Severity:** CRITICAL
- **UC Reference:** UC-02
- **Operator Bug Reference:** Relates to operator's overall "5 bugs in 5 minutes" observation
- **Description:** TeamBox has no status filters (open, assigned, automated, scheduled, followup, pending). The conversation list shows only "All" with a total count (600). There is no mechanism to filter conversations by lifecycle status.
- **Expected:** Status filter dropdown or chips allowing managers to view only automated, escalated, pending, or follow-up conversations.
- **Actual:** Only channel filters exist (All/SMS/Email/Voice). No status-based filtering.
- **Impact:** Manager cannot prioritize work. With 600 conversations, finding ones that need attention requires scrolling through the entire list.
- **Could automated tests catch this?** Yes -- a simple element presence test for status filter UI components would detect this. This is a missing feature, not a subtle bug.

---

## BUG-TB-02: Customer Detail Pane (Third Column) Missing

- **Severity:** CRITICAL
- **UC Reference:** UC-07, UC-08
- **Operator Bug Reference:** Operator bug #6 and #8 (confirmed)
- **Description:** The TeamBox layout is 2-column only: conversation list (left) + thread pane (right). There is no third column showing customer details. Tested 5+ different conversations -- none produced a detail pane.
- **Expected:** Third column showing customer name, phone, email, VIN Solutions data, vehicle interest, lead source, conversation status, and quick action buttons (Call, Email, SMS).
- **Actual:** Two-column layout only. No customer context visible beyond name and channel badge in the thread header.
- **Impact:** Agent cannot see customer context while reading messages. Cannot see vehicle interest, lead source, or contact info. Must navigate away from TeamBox to look up customer data.
- **Could automated tests catch this?** Yes -- checking for a third pane container element or customer detail fields after selecting a conversation would catch this. False-pass risk is HIGH if tests only check that the conversation list and thread pane exist.

---

## BUG-TB-03: No Channel Indicator on Conversation List Items

- **Severity:** MEDIUM
- **UC Reference:** UC-04
- **Description:** In the "All" view, conversation list items do not display a visible channel type badge (SMS/Email/Voice/Chat). The channel type is only revealed in the thread pane header after clicking a conversation.
- **Expected:** Each conversation list item should show a small badge or icon indicating its channel type (SMS icon, email icon, phone icon, chat icon).
- **Actual:** List items show only: initials badge, name, optional timestamp, optional preview text, and optional unread count. No channel indicator.
- **Impact:** Cannot visually distinguish conversation types without clicking each one. Makes the SMS filter count unverifiable from the "All" view.
- **Could automated tests catch this?** Yes -- checking for channel-type indicators in list item accessibility tree would catch this.

---

## BUG-TB-04: No Take Over Button

- **Severity:** CRITICAL
- **UC Reference:** UC-10
- **Operator Bug Reference:** Core TeamBox functionality gap
- **Description:** There is no "Take Over" button or equivalent control in the TeamBox thread pane. Tested with the "RI-SMS-4 Takeover Test" conversation (specifically created for takeover testing) and multiple other conversations. No takeover mechanism exists.
- **Expected:** A "Take Over" or "Assign to Me" button that transfers an automated conversation from AI agent control to human agent control, changing the conversation status and enabling manual replies.
- **Actual:** Thread pane contains only header, messages, and a reply input. No status controls.
- **Impact:** Managers cannot take over automated conversations that need human intervention. The entire human-in-the-loop workflow is broken.
- **Could automated tests catch this?** Yes -- checking for a takeover button element in the thread pane would catch this. This is a missing feature.

---

## BUG-TB-05: No Quick Action Buttons (Call/Email/SMS)

- **Severity:** HIGH
- **UC Reference:** UC-12
- **Description:** There are no quick action buttons (Call, Email, SMS) anywhere in TeamBox. The detail pane that would contain them does not exist (see BUG-TB-02).
- **Expected:** Quick action buttons in the customer detail pane allowing one-click call, email, or SMS initiation.
- **Actual:** No quick action buttons exist. The only action available is typing in the reply input.
- **Impact:** Agent must navigate away from TeamBox to initiate outbound communication through other channels.
- **Could automated tests catch this?** Yes -- element presence test for action buttons.

---

## BUG-TB-06: No Search Functionality

- **Severity:** CRITICAL
- **UC Reference:** UC-15
- **Operator Bug Reference:** Essential usability requirement
- **Description:** There is no search input anywhere on the TeamBox Conversations tab. With 600 conversations, there is no way to find a specific customer by name, phone number, or message content.
- **Expected:** A search box (text input) that filters the conversation list by customer name, phone number, or message content.
- **Actual:** No search input exists. The only way to filter is by channel type.
- **Impact:** Finding a specific conversation requires scrolling through up to 600 items. Completely impractical for daily dealership use.
- **Could automated tests catch this?** Yes -- checking for a search input element would catch this. This is a missing feature.

---

## BUG-TB-07: No Service Campaign Filter

- **Severity:** HIGH
- **UC Reference:** UC-09
- **Operator Bug Reference:** Operator bug #8 (confirmed)
- **Description:** There is no way to filter conversations by service campaign, lead source, or business classification. No dropdown, chip, or search option exists for this.
- **Expected:** Filter or dropdown allowing selection by campaign type (service reminder, sales outreach, follow-up, etc.).
- **Actual:** Only channel type filters exist.
- **Impact:** Service department cannot isolate their campaign conversations from sales conversations.
- **Could automated tests catch this?** Yes -- element presence test.

---

## BUG-TB-08: VAPI Call Logs Show Raw UUIDs for Assistant Names

- **Severity:** LOW
- **UC Reference:** UC-13
- **Description:** The Phone tab's VAPI Call Logs table shows raw assistant UUIDs (e.g., "6d12a8fa-0ed0-4ec1-bfdb-e84587ff86c0") in the Assistant column instead of human-readable agent names (e.g., "Caroline", "Sales Agent").
- **Expected:** Human-readable assistant/agent names.
- **Actual:** Raw UUID strings.
- **Impact:** Manager cannot identify which AI agent handled a call without looking up the UUID.
- **Could automated tests catch this?** Yes -- regex check for UUID pattern in the Assistant column.

---

## BUG-TB-09: VAPI Call Logs Missing Caller Numbers

- **Severity:** LOW
- **UC Reference:** UC-13
- **Description:** All entries in the VAPI Call Logs table show "-" (dash) for Caller Number.
- **Expected:** Actual phone numbers of callers.
- **Actual:** All show "-".
- **Impact:** Cannot identify who called from the call log.
- **Could automated tests catch this?** Yes -- check for non-empty caller number values.

---

## BUG-TB-10: Many Conversations Show "No Messages Yet"

- **Severity:** MEDIUM
- **UC Reference:** UC-05
- **Description:** A significant portion of conversations (especially "Cross Org *" test conversations at the top of the list) show "No messages yet" in the thread pane despite appearing in the conversation list. Out of the first ~10 visible conversations in the All view, at least 4 showed no messages.
- **Expected:** Conversations in the list should have at least one message, or empty conversations should be hidden/indicated differently.
- **Actual:** Conversations with no messages appear identically to those with messages in the list (no visual distinction).
- **Impact:** Manager clicks a conversation expecting to see content and finds nothing. Creates wasted effort when processing the inbox.
- **Could automated tests catch this?** Partially -- a test could verify that conversations with 0 messages are excluded from the list or visually distinguished.

---

## Summary Statistics

| Severity | Count |
|----------|-------|
| CRITICAL | 4 (status filters, detail pane, takeover, search) |
| HIGH     | 2 (quick actions, campaign filter) |
| MEDIUM   | 2 (channel indicator, empty conversations) |
| LOW      | 2 (VAPI UUIDs, VAPI caller numbers) |
| **Total** | **10** |

## False-Pass Risk Assessment

All 10 bugs could be caught by automated tests. The high-severity bugs (BUG-TB-01, 02, 04, 06) are all **missing features** rather than broken features -- they would only be caught by tests that check for element presence/existence, not by tests that verify existing functionality works. Any test suite that only validates "does clicking X do Y" without also checking "does X exist" would miss these entirely.

**Key false-pass pattern:** Existing automated tests likely verify that the conversation list loads, channel filters work, and messages display -- and all of those PASS. The critical bugs are all about features that don't exist yet but should. Tests cannot catch what they don't test for.
