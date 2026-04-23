# Phase 9 — Notifications & Alerts

**Phase Description**
In-app notifications (Bell icon), activity feed (Pulse icon), email
alerts to admins on new leads, and escalation badges on conversations.

**Open Issues:** I-087 (shared with Phase 3 — email notifications)
**Depends On:** Phase 3, 4, 5
**Status:** PARTIALLY DONE — notification system exists, email notifications broken

---

---

SPRINT E-9.0 — Phase 9 Entry Inspection

WHY IT MATTERS
Before any work starts in this phase, verify the foundation is solid.
If a dependency is broken, everything built on top of it fails.

WHAT GETS BUILT
  (Exploratory — read only, no code changes)
  - Verify dependencies: Phase 3, 4, 5
  - Check files this phase will touch for uncommitted changes:
    server/routes/notifications.ts, client/src/components/layout/AppLayout.tsx
  - Read sprint descriptions — are they still accurate?
  - Check ghost_messages for unresolved directives
  - Check issues.md for any new issues affecting this phase
  - Run relevant Playwright tests for dependencies

HOW WE KNOW IT IS DONE
  - Dependencies confirmed working (not just committed — tested)
  - No uncommitted changes in phase files
  - No unresolved ghost directives affecting this phase
  - Sprint descriptions reviewed and confirmed accurate
  - Entry inspection report written to evidence/

FAILS IF
  - A dependency phase has unresolved issues
  - Uncommitted changes exist in files this phase will touch
  - Ghost directives are pending

VERIFICATION NOTES
  - This is a 15-minute read-and-verify, not a full audit
  - If issues found, resolve them before starting the phase
  - Ghost runs /ghost-check at this point


SPRINT V-9.1 — Verify In-App Notifications

WHY IT MATTERS
Bell icon shows notification count and list. Staff need to see
when something requires their attention.

WHAT GETS BUILT
  (Verification)

HOW WE KNOW IT IS DONE
  - GET /api/notifications returns notification list
  - GET /api/notifications/unread-count returns correct count
  - Bell icon shows unread badge count
  - Clicking a notification marks it as read
  - "Mark all read" clears the count

FAILS IF
  - Unread count is wrong
  - Notifications don't appear
  - Mark-as-read doesn't persist

---

SPRINT V-9.2 — Verify Activity Feed

WHY IT MATTERS
Pulse icon shows recent activity — who did what, when.

WHAT GETS BUILT
  (Verification)

HOW WE KNOW IT IS DONE
  - GET /api/activity-log returns timestamped activity entries
  - Activity feed shows user actions (login, conversation update, etc.)
  - Activity is org-scoped

FAILS IF
  - Activity log empty when actions have been taken
  - Shows activity from other orgs

---

SPRINT V-9.3 — Verify Email Notification Delivery (After Phase 3 Fix)

WHY IT MATTERS
Admin email notifications for new leads were broken (I-087). After
Phase 3 fixes the template and recipients, verify delivery works.

WHAT GETS BUILT
  (Verification — depends on Phase 3 Sprint I-3.2 and Phase 3 Sprint I-3.6)

HOW WE KNOW IT IS DONE
  - VAPI call webhook triggers email notification
  - Email arrives at correct admin inboxes (not admin@ test addresses)
  - Template matches the approved design
  - CommGate OFF → no email sent

FAILS IF
  - Email doesn't arrive
  - Goes to wrong people
  - Wrong template

---

SPRINT G-9.4 — Escalation Badges

WHY IT MATTERS
Urgent conversations should have visual indicators so managers can
prioritize them. US-019 describes escalation management.

WHAT GETS BUILT
  BE
    - Verify escalation detection logic (stale conversations, keyword triggers)
    - Verify escalation count per conversation
  FE
    - Verify escalation badges appear on conversation list items
    - Verify manager can see escalated conversations filtered

HOW WE KNOW IT IS DONE
  - Conversation with no response for 30+ minutes shows escalation badge
  - Manager can filter by escalated conversations
  - Badge count is accurate

WHAT IT DOES NOT INCLUDE
  - Sentiment analysis escalation (BACKLOG — US-019)
  - Email escalation notification (uses existing notification system)

FAILS IF
  - No visual indicator for urgent conversations
  - Badge shows on all conversations (not just escalated)

---

---

SPRINT T-9.EXIT — Phase 9 Exit Inspection

WHY IT MATTERS
Before the next phase starts, confirm this phase is truly done.
Every sprint committed, every acceptance criterion verified,
every test passing.

WHAT GETS BUILT
  (Testing — no code changes)
  - Verify every sprint in this phase has status "committed" in sprints.json
  - Run acceptance criteria for this phase: AC related to Bell/Pulse icons
  - Run relevant Playwright tests
  - Check: did any sprint touch files outside its declared scope?
  - Write one-sentence verdict

HOW WE KNOW IT IS DONE
  - All sprints in this phase: status "committed" with valid hash
  - Acceptance criteria checked: Bell shows notifications, Pulse shows activity, email alerts delivered, escalation badges visible
  - Relevant Playwright tests pass
  - No files modified outside declared scope
  - Verdict written: "Phase 9 is SOLID" or "Phase 9 has issues: [list]"

FAILS IF
  - Any sprint not committed
  - Any acceptance criterion fails
  - Files modified outside scope
  - Verdict is not SOLID

VERIFICATION NOTES
  - Ghost runs /ghost-check at this point
  - If verdict is not SOLID, next phase is BLOCKED
  - Issues found become new sprints in THIS phase (not the next one)


**Phase 9 is DONE when:**
- Bell icon shows accurate notification count
- Activity feed shows recent actions
- Email notifications delivered to correct admins
- Escalation badges visible on urgent conversations
