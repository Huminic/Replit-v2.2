# Phase 12 — Widgets & Landing Pages

**Phase Description**
Widget JavaScript embeds for dealer websites and per-org landing pages.
The widget is how customers enter the system — chat, call, video, form.

**Open Issues:** None specific
**Depends On:** Phase 3 (Communications), Phase 4 (Voice/Video)
**Status:** MOSTLY DONE — needs verification

---

---

SPRINT E-12.0 — Phase 12 Entry Inspection

WHY IT MATTERS
Before any work starts in this phase, verify the foundation is solid.
If a dependency is broken, everything built on top of it fails.

WHAT GETS BUILT
  (Exploratory — read only, no code changes)
  - Verify dependencies: Phase 3, 4
  - Check files this phase will touch for uncommitted changes:
    server/routes/public.ts, client/src/pages/widget-landing.tsx
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


SPRINT V-12.1 — Verify Widget JS Embed

WHY IT MATTERS
5 dealer websites embed widget JS. It must serve valid JavaScript
with correct content-type and dealer name.

WHAT GETS BUILT
  (Verification)

HOW WE KNOW IT IS DONE
  - GET /widget/dealer/serra-honda.js → returns JavaScript, content-type: application/javascript
  - JS contains dealer name "Serra Honda"
  - Same for all 5 dealers: serra-nissan, tony-serra-ford, hyundai-of-columbia, ford-of-columbia
  - JS is syntactically valid (no parse errors)

FAILS IF
  - Any dealer returns 404
  - Content-type wrong
  - Dealer name missing from JS

VERIFICATION NOTES
  - Test against both dev.huminicdev.com and live.huminic.app

---

SPRINT V-12.2 — Verify Landing Pages

WHY IT MATTERS
Each org has a landing page at /p/:slug where customers can
choose how to interact (chat, call, video, form).

WHAT GETS BUILT
  (Verification)

HOW WE KNOW IT IS DONE
  - GET /p/serra-honda → landing page loads
  - Shows org name and available interaction options
  - Chat, Call, Video, Form options are presented
  - Clicking each option initiates the correct flow

FAILS IF
  - Landing page 404 for any org
  - Options missing or non-functional

---

SPRINT V-12.3 — Verify Widget Form Submission

WHY IT MATTERS
Form submissions from the widget should create a conversation
and optionally trigger an auto-greeting.

WHAT GETS BUILT
  (Verification)

HOW WE KNOW IT IS DONE
  - POST /api/widget/contact with form data → conversation created
  - Conversation appears in TeamBox
  - If agent has autoGreeting, greeting SMS is queued (CommGate dependent)

FAILS IF
  - Form submission creates no conversation
  - Conversation doesn't appear in TeamBox

---

---

SPRINT T-12.EXIT — Phase 12 Exit Inspection

WHY IT MATTERS
Before the next phase starts, confirm this phase is truly done.
Every sprint committed, every acceptance criterion verified,
every test passing.

WHAT GETS BUILT
  (Testing — no code changes)
  - Verify every sprint in this phase has status "committed" in sprints.json
  - Run acceptance criteria for this phase: AC 11.1, 11.7, 11.8
  - Run relevant Playwright tests
  - Check: did any sprint touch files outside its declared scope?
  - Write one-sentence verdict

HOW WE KNOW IT IS DONE
  - All sprints in this phase: status "committed" with valid hash
  - Acceptance criteria checked: Widget JS serves per dealer, landing pages load, form submission creates conversation
  - Relevant Playwright tests pass
  - No files modified outside declared scope
  - Verdict written: "Phase 12 is SOLID" or "Phase 12 has issues: [list]"

FAILS IF
  - Any sprint not committed
  - Any acceptance criterion fails
  - Files modified outside scope
  - Verdict is not SOLID

VERIFICATION NOTES
  - Ghost runs /ghost-check at this point
  - If verdict is not SOLID, next phase is BLOCKED
  - Issues found become new sprints in THIS phase (not the next one)


**Phase 12 is DONE when:**
- All 5 dealer widget JS files serve correctly
- Landing pages load for all orgs
- Form submissions create conversations
