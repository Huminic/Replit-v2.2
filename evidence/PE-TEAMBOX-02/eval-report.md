# PE-TEAMBOX-02 Evaluation Report

**Date:** 2026-04-06
**Evaluator:** Production Eval Agent
**Target:** https://dev.huminicdev.com/teambox
**Login:** serra_honda@huminic.ai (Serra Honda org_admin)
**Branch:** rem-pe-006

## Summary

Significant improvements since PE-TEAMBOX-01. The TeamBox page now has a full 4-column layout (filter panel, conversation list, message area, customer info pane) that was previously missing. Multiple features from the original bug list have been implemented. However, the layout is responsive and the filter panel + customer info pane are hidden at viewport widths below ~1280px (xl breakpoint), which means users on smaller screens still get a degraded experience.

## Bug Re-evaluation

| Bug ID | Severity | Description | Status | Notes |
|--------|----------|-------------|--------|-------|
| BUG-TB-01 | Critical | No status filters | **FIXED** | Status filters now exist: All (294), Open (289), Assigned to me (1), Participating (1), Automated, Scheduled (1), Followup (1), Pending (1). Visible at xl+ viewport widths. |
| BUG-TB-02 | Critical | Customer detail pane missing | **FIXED** | Customer Info pane exists as 4th column showing: Name, Email, Phone, Channel, Status, Handled by, Assign to dropdown, Quick Actions. Only visible at xl+ viewport (hidden on smaller screens). |
| BUG-TB-03 | Medium | No channel indicator on conversation list items | **PARTIALLY FIXED** | Channel-specific SVG icons exist (chat bubble for AI-CHAT, smartphone for SMS, envelope for Email). However, there are no text labels -- the icons are small and subtle. No accessibility labels (aria-label) on the SVGs. |
| BUG-TB-04 | Critical | No Take Over button | **STILL PRESENT (deferred)** | No "Take Over" button or human takeover workflow found anywhere in the UI. Expected -- this was categorized as a missing feature and deferred to backlog. |
| BUG-TB-05 | High | No quick action buttons | **FIXED** | Quick Actions section exists in Customer Info pane with Call, Email, and SMS buttons. Only visible when Customer Info pane is visible (xl+ viewport). |
| BUG-TB-06 | Critical | No search functionality | **FIXED** | Search input ("Search conversations...") exists in the filter panel. Only visible at lg+ viewport widths (filter panel is hidden on smaller screens). |
| BUG-TB-07 | High | No service campaign filter | **STILL PRESENT (deferred)** | No campaign filter exists. Filter panel has STATUS and CHANNEL sections only. Expected -- this was categorized as a missing feature and deferred to backlog. |
| BUG-TB-08 | Low | VAPI call logs show raw UUIDs for assistant names | **STILL PRESENT** | Assistant column still shows raw UUID `90a876c0-0f11-4424-abfe-9ac82b264d88` for all entries. No human-readable assistant name mapping implemented. |
| BUG-TB-09 | Low | VAPI call logs missing caller numbers | **FIXED** | Caller Number column now displays actual phone numbers (e.g., +14808964875, +14808039635). REM-PE-003 fix confirmed working. |
| BUG-TB-10 | Medium | Many conversations show "No messages yet" | **WORSE** | 294 total conversations. Breakdown: 46 "Test Customer", 60 "Website Visitor", 90 "RateTest-*", 40 "Reset-*", 40 "NoPhone-*", 2 phone numbers, ~16 real names. That is 278/294 (94.6%) test/junk conversations. DATA-CLEANUP-01/02 did NOT clean TeamBox conversations. |

## Score Summary

- **FIXED:** 5 bugs (TB-01, TB-02, TB-05, TB-06, TB-09)
- **PARTIALLY FIXED:** 1 bug (TB-03)
- **STILL PRESENT (deferred):** 2 bugs (TB-04, TB-07) -- expected, were not in remediation scope
- **STILL PRESENT:** 1 bug (TB-08)
- **WORSE:** 1 bug (TB-10)

## New Observations

1. **NEW: Responsive layout hides key features.** The filter panel (STATUS, CHANNEL, Search) and Customer Info pane are hidden at viewport widths below ~1280px. At the default 780px viewport, only the conversation list and message area are visible. This means the "fixed" features (TB-01, TB-02, TB-05, TB-06) are NOT accessible to users on smaller screens or non-maximized windows.

2. **NEW: VAPI call logs missing Date and Duration.** All entries show "-" for both Date and Duration columns. Only Caller Number, Assistant (UUID), and Status (all "ended") are populated.

3. **NEW: Conversation list shows "Handled by" agent name.** Michael Clark conversation shows "Caroline" as handler, and Ben Smith shows "Caroline" -- agent assignment is visible in the conversation list preview text.

4. **NEW: Workflows tab exists.** The filter panel has Conversations/Workflows tabs, suggesting workflow management is partially implemented.

5. **NEW: Assign to dropdown exists** in Customer Info pane, currently showing "Unassigned" with a dropdown for reassignment.

## Screenshots

| File | Description |
|------|-------------|
| 01-teambox-main.png | Initial TeamBox view at default viewport (780px) |
| 02-teambox-sms-channel.png | SMS channel selected, conversation list visible |
| 03-teambox-conversation-selected.png | Conversation selected at default viewport |
| 04-teambox-wide-viewport.png | Full 4-column layout at 1440px viewport -- shows STATUS filters, search, customer info |
| 05-teambox-phone-tab.png | VAPI Call Logs showing caller numbers (fixed) but raw UUIDs (not fixed) |
| 06-teambox-michael-clark-conversation.png | Michael Clark conversation with messages, customer info, quick actions |
| 07-teambox-filter-panel-detail.png | Final view showing complete TeamBox with all panels |
