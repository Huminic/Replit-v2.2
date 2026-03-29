# Phase 5 — TeamBox & Conversations

**Phase Description**
The unified inbox where staff manage all customer conversations across
SMS, voice, and video channels. Filtering, threading, assignment, and
the takeover mechanism all live here.

**Open Issues:** None (takeover fix is in Phase 3)
**Depends On:** Phase 3 (Communications)
**Status:** MOSTLY DONE — needs verification

---

---

SPRINT E-5.0 — Phase 5 Entry Inspection

WHY IT MATTERS
Before any work starts in this phase, verify the foundation is solid.
If a dependency is broken, everything built on top of it fails.

WHAT GETS BUILT
  (Exploratory — read only, no code changes)
  - Verify dependencies: Phase 3
  - Check files this phase will touch for uncommitted changes:
    client/src/pages/teambox.tsx
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


SPRINT V-5.1 — Verify Conversation List and Filtering

WHY IT MATTERS
TeamBox is the primary work screen. If conversations don't load or
filter correctly, staff can't do their job.

WHAT GETS BUILT
  (Verification)

HOW WE KNOW IT IS DONE
  - GET /api/conversations returns conversations scoped to user's org
  - Channel filter (SMS, voice, email) reduces the list correctly
  - Status filter (open, closed) works
  - Unread badges show correct counts
  - Conversation list shows customer name, preview, timestamp

FAILS IF
  - Conversations from other orgs appear
  - Filters don't reduce the list
  - Unread count is wrong

---

SPRINT V-5.2 — Verify Conversation Thread and Messaging

WHY IT MATTERS
Staff need to see the full message history and reply from TeamBox.

WHAT GETS BUILT
  (Verification)

HOW WE KNOW IT IS DONE
  - Clicking a conversation shows the full message thread
  - Messages display in chronological order
  - Reply input sends a message and it appears in the thread
  - Thread preserves context across time gaps (US-020)

FAILS IF
  - Messages out of order
  - Reply doesn't appear in thread
  - Thread loses messages after time gap

---

SPRINT V-5.3 — Verify Human Takeover UI

WHY IT MATTERS
The takeover button must change the conversation from AI-handled to
human-handled and be visible and functional.

WHAT GETS BUILT
  (Verification — code fix is in Phase 3 Sprint I-3.3)

HOW WE KNOW IT IS DONE
  - Takeover button visible in conversation detail
  - Clicking takeover sets assignedTo on the conversation
  - AI stops responding (verified in Phase 3)
  - Releasing takeover allows AI to respond again

FAILS IF
  - Takeover button missing
  - UI doesn't reflect takeover state

---

SPRINT V-5.4 — Verify Conversation Assignment

WHY IT MATTERS
Managers need to assign conversations to specific agents.

WHAT GETS BUILT
  (Verification)

HOW WE KNOW IT IS DONE
  - Assignment dropdown shows team members
  - Assigning changes the conversation's agent
  - Assigned agent sees the conversation in their filtered view

FAILS IF
  - Assignment doesn't persist
  - Assigned agent can't see the conversation

---

---

SPRINT T-5.EXIT — Phase 5 Exit Inspection

WHY IT MATTERS
Before the next phase starts, confirm this phase is truly done.
Every sprint committed, every acceptance criterion verified,
every test passing.

WHAT GETS BUILT
  (Testing — no code changes)
  - Verify every sprint in this phase has status "committed" in sprints.json
  - Run acceptance criteria for this phase: AC 5.1-5.10
  - Run relevant Playwright tests
  - Check: did any sprint touch files outside its declared scope?
  - Write one-sentence verdict

HOW WE KNOW IT IS DONE
  - All sprints in this phase: status "committed" with valid hash
  - Acceptance criteria checked: Conversations load, filter, thread correctly; takeover UI works; assignment works
  - Relevant Playwright tests pass
  - No files modified outside declared scope
  - Verdict written: "Phase 5 is SOLID" or "Phase 5 has issues: [list]"

FAILS IF
  - Any sprint not committed
  - Any acceptance criterion fails
  - Files modified outside scope
  - Verdict is not SOLID

VERIFICATION NOTES
  - Ghost runs /ghost-check at this point
  - If verdict is not SOLID, next phase is BLOCKED
  - Issues found become new sprints in THIS phase (not the next one)


**Phase 5 is DONE when:**
- TeamBox loads conversations filtered by channel and status
- Message threads are complete and chronological
- Takeover button works (tied to Phase 3 fix)
- Conversation assignment works
