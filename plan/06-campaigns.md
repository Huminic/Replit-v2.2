# Phase 6 — Campaigns & Outbound

**Phase Description**
Campaign creation, CSV upload, execution, and monitoring. SMS is the
primary channel. Service campaigns can optionally include email and phone.

**Open Issues:** I-092 (shared with Phase 3 — dryRun removal)
**Depends On:** Phase 3 (Communications — CommGate must work)
**Status:** PARTIALLY DONE — CRUD works, execution broken by dryRun

---

---

SPRINT E-6.0 — Phase 6 Entry Inspection

WHY IT MATTERS
Before any work starts in this phase, verify the foundation is solid.
If a dependency is broken, everything built on top of it fails.

WHAT GETS BUILT
  (Exploratory — read only, no code changes)
  - Verify dependencies: Phase 3
  - Check files this phase will touch for uncommitted changes:
    server/routes/campaigns.ts, client/src/pages/marketing.tsx, client/src/pages/service.tsx
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


SPRINT V-6.1 — Verify Campaign CRUD

WHY IT MATTERS
Before testing execution, confirm basic campaign management works.

WHAT GETS BUILT
  (Verification)

HOW WE KNOW IT IS DONE
  - Create campaign with name, channel, message template → success
  - Upload CSV with firstName, lastName, phone → recipients created
  - Edit campaign → changes persist
  - Campaign list shows correct counts
  - Per-campaign kill switch toggles correctly

FAILS IF
  - Campaign creation fails
  - CSV upload rejects valid data
  - Kill switch doesn't persist

---

SPRINT V-6.2 — Verify Campaign Execution (After Phase 3 dryRun Fix)

WHY IT MATTERS
With dryRun removed (Phase 3 Sprint I-3.4), campaigns should now
execute real SMS sends through CommGate.

WHAT GETS BUILT
  (Verification — depends on I-3.4 being merged)

HOW WE KNOW IT IS DONE
  - Execute campaign with CommGate ON for Serra Honda
  - outboundLog shows status="sent" for each recipient
  - Recipients receive actual SMS (test with owner's number in CSV)
  - Campaign metrics update: sent count, error count
  - Execution status endpoint shows progress

WHAT IT DOES NOT INCLUDE
  - Email campaign execution (separate sprint)
  - Phone campaign execution (separate sprint)

FAILS IF
  - outboundLog still shows "dry_run"
  - Recipients don't receive SMS
  - CommGate doesn't block when disabled

---

SPRINT G-6.3 — Service Campaign with Email Channel

WHY IT MATTERS
Service campaigns need to optionally include email as a channel.
Owner specified this as a requirement.

WHAT GETS BUILT
  BE
    - Verify campaign execution can send email via callMCP("resend_send_email")
    - Campaign with channel="email" sends to recipient email addresses
    - CommGate emailEnabled check in path
  FE
    - Campaign create form allows channel="email" selection

HOW WE KNOW IT IS DONE
  - Create a service campaign with channel="email"
  - Execute → emails sent to recipient email addresses
  - outboundLog shows email sends with status="sent"

FAILS IF
  - Email campaign doesn't send
  - Email bypasses CommGate

---

SPRINT G-6.4 — Campaign Reply Routing to AI Agent

WHY IT MATTERS
When a customer replies to a campaign SMS, it should create a
conversation in TeamBox and optionally trigger an AI agent response.

WHAT GETS BUILT
  BE
    - Verify inbound SMS from campaign recipient creates conversation
      linked to the campaign (campaignId field set)
    - Verify AI agent responds if configured and CommGate allows
  FE
    - Campaign replies visible in TeamBox with campaign label

HOW WE KNOW IT IS DONE
  - Campaign SMS sent → customer replies → conversation created in TeamBox
  - Conversation has campaignId set (linked to the campaign)
  - AI agent responds to the reply (if configured)
  - Campaign reply rate metric updates

FAILS IF
  - Reply creates orphan conversation (no campaign link)
  - AI doesn't respond when it should
  - Campaign metrics don't update

---

---

SPRINT T-6.EXIT — Phase 6 Exit Inspection

WHY IT MATTERS
Before the next phase starts, confirm this phase is truly done.
Every sprint committed, every acceptance criterion verified,
every test passing.

WHAT GETS BUILT
  (Testing — no code changes)
  - Verify every sprint in this phase has status "committed" in sprints.json
  - Run acceptance criteria for this phase: AC 4.1-4.10
  - Run relevant Playwright tests
  - Check: did any sprint touch files outside its declared scope?
  - Write one-sentence verdict

HOW WE KNOW IT IS DONE
  - All sprints in this phase: status "committed" with valid hash
  - Acceptance criteria checked: Campaign CRUD works, execution sends real SMS, replies route to TeamBox
  - Relevant Playwright tests pass
  - No files modified outside declared scope
  - Verdict written: "Phase 6 is SOLID" or "Phase 6 has issues: [list]"

FAILS IF
  - Any sprint not committed
  - Any acceptance criterion fails
  - Files modified outside scope
  - Verdict is not SOLID

VERIFICATION NOTES
  - Ghost runs /ghost-check at this point
  - If verdict is not SOLID, next phase is BLOCKED
  - Issues found become new sprints in THIS phase (not the next one)


**Phase 6 is DONE when:**
- Campaigns can be created, uploaded with CSV, and executed
- SMS campaigns send real messages through CommGate
- Email campaigns work for service
- Customer replies route to TeamBox with campaign context
- Campaign metrics are accurate
