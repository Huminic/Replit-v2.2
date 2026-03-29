# Phase 7 — Triggers & Automation

**Phase Description**
Lead-based, time-delayed outbound triggers. When a new VIN lead arrives,
the system can automatically send a follow-up SMS hours later. Triggers
are configured per agent, not a full boolean workflow system.

**Open Issues:** None specific — infrastructure exists, needs configuration exposure
**Depends On:** Phase 3 (Communications), Phase 4 (Voice)
**Status:** PARTIALLY DONE — scheduler and trigger types exist in code, no CRUD API or UI

---

---

SPRINT E-7.0 — Phase 7 Entry Inspection

WHY IT MATTERS
Before any work starts in this phase, verify the foundation is solid.
If a dependency is broken, everything built on top of it fails.

WHAT GETS BUILT
  (Exploratory — read only, no code changes)
  - Verify dependencies: Phase 3, 4
  - Check files this phase will touch for uncommitted changes:
    server/services/scheduler.ts, agents.triggers JSONB
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


SPRINT V-7.1 — Verify Trigger Infrastructure

WHY IT MATTERS
The scheduler and two trigger types (new_lead_followup, stale_lead)
exist in the code. Verify they actually work before building the config UI.

WHAT GETS BUILT
  (Verification)
  BE
    - Verify scheduler runs (server/services/scheduler.ts)
    - Verify agents.triggers JSONB can store trigger configs
    - Verify scheduledActions table handles deferred actions
    - Seed a test trigger config for one agent and verify it fires

HOW WE KNOW IT IS DONE
  - Scheduler runs every 15 minutes (check PM2 logs)
  - A test trigger config inserted into agents.triggers produces a scheduledAction
  - The scheduledAction is processed and dispatches via processOutboundSend
  - outboundLog shows the triggered send

FAILS IF
  - Scheduler not running
  - Trigger config ignored
  - Scheduled action never processed

---

SPRINT G-7.2 — Trigger Configuration API

WHY IT MATTERS
Triggers need to be configurable per agent through the API so the
frontend can manage them.

WHAT GETS BUILT
  BE
    - GET /api/agents/:id/triggers — returns trigger config for an agent
    - PATCH /api/agents/:id/triggers — updates trigger config
    - Validate trigger types: new_lead_followup, stale_lead, appointment_reminder
    - Validate trigger channels: sms, phone, email
    - Validate delay format (hours or minutes)

HOW WE KNOW IT IS DONE
  - GET returns current trigger config for an agent
  - PATCH updates and persists the config
  - Invalid trigger type returns 400
  - Trigger fires correctly with the updated config

WHAT IT DOES NOT INCLUDE
  - Full trigger builder UI (Sprint G-7.3)
  - Multi-step sequences (BACKLOG)
  - Custom trigger types (only the 3 defined types)

FAILS IF
  - Config doesn't persist
  - Invalid types are accepted

---

SPRINT G-7.3 — Trigger Configuration UI

WHY IT MATTERS
Admins need to configure triggers in the UI, not by editing the database.

WHAT GETS BUILT
  FE
    - Add trigger config section to Agent detail page (Agents → Edit Agent)
    - Trigger type dropdown: New Lead Followup, Stale Lead, Appointment Reminder
    - Channel dropdown: SMS, Phone, Email
    - Delay input: hours after event
    - Message template text area
    - Enable/disable toggle per trigger
    - Save button calls PATCH /api/agents/:id/triggers

HOW WE KNOW IT IS DONE
  - Navigate to Agents → edit an agent → trigger section visible
  - Configure a trigger → save → reload → config persists
  - Disable trigger → it stops firing
  - Template text appears in the outbound message

FAILS IF
  - Trigger section missing from agent edit page
  - Config doesn't save
  - No template customization

---

SPRINT G-7.4 — After-Hours Auto-Response Template

WHY IT MATTERS
US-021: customer texts after hours → auto-response sent with context.
The template should be configurable per agent, not hardcoded.

WHAT GETS BUILT
  BE
    - Add after-hours auto-response template to agent settings
    - When after-hours SMS arrives, send the configured response
    - Tag the conversation for morning followup
  FE
    - Add "After-Hours Response" field to agent trigger config

HOW WE KNOW IT IS DONE
  - SMS sent after 10 PM → auto-response goes out (or queues for 7 AM)
  - Response uses the configured template (not a hardcoded message)
  - Conversation tagged for morning review

FAILS IF
  - Hardcoded response instead of template
  - After-hours response ignores CommGate

---

---

SPRINT T-7.EXIT — Phase 7 Exit Inspection

WHY IT MATTERS
Before the next phase starts, confirm this phase is truly done.
Every sprint committed, every acceptance criterion verified,
every test passing.

WHAT GETS BUILT
  (Testing — no code changes)
  - Verify every sprint in this phase has status "committed" in sprints.json
  - Run acceptance criteria for this phase: AC related to US-005, US-009, US-021
  - Run relevant Playwright tests
  - Check: did any sprint touch files outside its declared scope?
  - Write one-sentence verdict

HOW WE KNOW IT IS DONE
  - All sprints in this phase: status "committed" with valid hash
  - Acceptance criteria checked: Triggers fire on VIN lead events, after-hours queueing works, trigger config in agent settings
  - Relevant Playwright tests pass
  - No files modified outside declared scope
  - Verdict written: "Phase 7 is SOLID" or "Phase 7 has issues: [list]"

FAILS IF
  - Any sprint not committed
  - Any acceptance criterion fails
  - Files modified outside scope
  - Verdict is not SOLID

VERIFICATION NOTES
  - Ghost runs /ghost-check at this point
  - If verdict is not SOLID, next phase is BLOCKED
  - Issues found become new sprints in THIS phase (not the next one)


**Phase 7 is DONE when:**
- Triggers fire automatically based on VIN lead events
- Trigger configuration is manageable per agent in the UI
- After-hours auto-response works with configurable templates
- All trigger sends go through CommGate
