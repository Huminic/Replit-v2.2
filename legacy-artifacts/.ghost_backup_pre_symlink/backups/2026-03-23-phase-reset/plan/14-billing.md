# Phase 14 — Billing & Metering

**Phase Description**
Usage tracking and billing display. FlexPrice handles metering.
The UI shows usage summaries, plan details, and invoices.

**Open Issues:** None
**Depends On:** Phase 13 (Settings)
**Status:** STUB — UI exists, data may be empty

---

---

SPRINT E-14.0 — Phase 14 Entry Inspection

WHY IT MATTERS
Before any work starts in this phase, verify the foundation is solid.
If a dependency is broken, everything built on top of it fails.

WHAT GETS BUILT
  (Exploratory — read only, no code changes)
  - Verify dependencies: Phase 13
  - Check files this phase will touch for uncommitted changes:
    client/src/pages/BillingDashboard.tsx, server/routes/billing.ts
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


SPRINT V-14.1 — Verify Billing Pages Load

WHY IT MATTERS
Billing pages must render for Org Admin and above without errors.

WHAT GETS BUILT
  (Verification)

HOW WE KNOW IT IS DONE
  - Billing Dashboard loads
  - Usage page loads
  - Plan page loads
  - Invoices page loads
  - No console errors on any billing page

FAILS IF
  - Any billing page errors

---

SPRINT V-14.2 — Verify Usage Event Tracking

WHY IT MATTERS
SMS, email, voice, and video usage should be tracked for billing.

WHAT GETS BUILT
  (Verification)

HOW WE KNOW IT IS DONE
  - usageEvents table has entries for SMS, email, voice, video events
  - GET /api/billing/usage returns usage data
  - Usage page shows non-zero values (if events have been created)

FAILS IF
  - usageEvents empty when events have occurred
  - Usage endpoint returns error

---

---

SPRINT T-14.EXIT — Phase 14 Exit Inspection

WHY IT MATTERS
Before the next phase starts, confirm this phase is truly done.
Every sprint committed, every acceptance criterion verified,
every test passing.

WHAT GETS BUILT
  (Testing — no code changes)
  - Verify every sprint in this phase has status "committed" in sprints.json
  - Run acceptance criteria for this phase: AC 8.1-8.5
  - Run relevant Playwright tests
  - Check: did any sprint touch files outside its declared scope?
  - Write one-sentence verdict

HOW WE KNOW IT IS DONE
  - All sprints in this phase: status "committed" with valid hash
  - Acceptance criteria checked: Billing pages load, usage events tracked, role-gated access
  - Relevant Playwright tests pass
  - No files modified outside declared scope
  - Verdict written: "Phase 14 is SOLID" or "Phase 14 has issues: [list]"

FAILS IF
  - Any sprint not committed
  - Any acceptance criterion fails
  - Files modified outside scope
  - Verdict is not SOLID

VERIFICATION NOTES
  - Ghost runs /ghost-check at this point
  - If verdict is not SOLID, next phase is BLOCKED
  - Issues found become new sprints in THIS phase (not the next one)


**Phase 14 is DONE when:**
- All billing pages render correctly
- Usage events are being tracked
