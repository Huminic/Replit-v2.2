# Phase 13 — Settings & Administration

**Phase Description**
Organization settings, user management, CommGate configuration,
integration settings, and the VIN lead config. This is where
admins configure the system behavior.

**Open Issues:** None specific — but VIN lead config needs building
**Depends On:** Phase 1 (Auth)
**Status:** PARTIALLY DONE

---

---

SPRINT E-13.0 — Phase 13 Entry Inspection

WHY IT MATTERS
Before any work starts in this phase, verify the foundation is solid.
If a dependency is broken, everything built on top of it fails.

WHAT GETS BUILT
  (Exploratory — read only, no code changes)
  - Verify dependencies: Phase 1
  - Check files this phase will touch for uncommitted changes:
    client/src/pages/settings.tsx, server/routes/organizations.ts, server/routes/users.ts
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


SPRINT V-13.1 — Verify Organization Settings

WHY IT MATTERS
Org admins need to configure their store: name, persona,
business hours, CommGate toggles.

WHAT GETS BUILT
  (Verification)

HOW WE KNOW IT IS DONE
  - Settings page loads for Org Admin and above
  - Org name, persona name editable and persist
  - CommGate toggles (outbound, SMS, phone, email) work
  - Business hours fields visible and configurable

FAILS IF
  - Settings don't persist after save
  - Lower roles can access settings
  - CommGate toggles don't affect outbound behavior

---

SPRINT V-13.2 — Verify User Management

WHY IT MATTERS
Admins need to create users, assign roles, and manage staff.

WHAT GETS BUILT
  (Verification)

HOW WE KNOW IT IS DONE
  - User list shows org members
  - Create user works (email, role assignment)
  - Edit user (change role, deactivate) works
  - Password reset for another user works
  - Invite email sends (if CommGate allows)

FAILS IF
  - Users from other orgs visible
  - Role assignment doesn't enforce hierarchy
  - Can't create or edit users

---

SPRINT G-13.3 — VIN Lead Config in Settings

WHY IT MATTERS
VIN lead assignment needs to be configurable per org. Super admin
sets the default sales rep per dealer in Settings → Integrations.

WHAT GETS BUILT
  (From Phase 2 Sprint G-2.5 — the UI portion)
  FE
    - "Default VIN Sales Rep" dropdown in Settings → Integrations
    - Dropdown populated from vin_list_users for the dealer
    - Shows current selection, saves on change
  BE
    - GET /api/integrations/:orgId/vin-config → returns current default_vin_user_id
    - PATCH /api/integrations/:orgId/vin-config → updates
    - Dropdown data from vin_list_users MCP tool

HOW WE KNOW IT IS DONE
  - Navigate to Settings → Integrations
  - Dropdown shows VIN Solutions users for this dealer
  - Select a user → save → reload → selection persists
  - VIN lead creation uses the selected user

FAILS IF
  - Dropdown empty
  - Selection doesn't persist
  - Lead creation ignores the config

---

SPRINT G-13.4 — Business Hours Configuration

WHY IT MATTERS
After-hours queueing (Phase 3 Sprint I-3.5) needs configurable
business hours per org in Settings.

WHAT GETS BUILT
  FE
    - Business hours start/end time fields in Settings → Organization
    - Default: 07:00 - 22:00 if not set
  BE
    - Store in organizations.settings JSONB (businessHoursStart, businessHoursEnd)
    - Read by after-hours check in SMS handler

HOW WE KNOW IT IS DONE
  - Settings page shows business hours fields
  - Changing hours persists to org settings
  - After-hours check uses the configured values

FAILS IF
  - Hours don't save
  - SMS handler uses hardcoded values instead of org settings

---

SPRINT G-13.5 — SMS Number Configuration Display

WHY IT MATTERS
Each org should show its TextMagic phone number in Settings so
admins know which number is associated with their store.

WHAT GETS BUILT
  FE
    - Display TextMagic phone number in Settings → Communications
    - Read-only for now (owner assigns numbers)
  BE
    - Read from organizations.settings.textmagicPhone

HOW WE KNOW IT IS DONE
  - Settings page shows the store's SMS number
  - Number matches what's configured in TextMagic

FAILS IF
  - Number not displayed
  - Wrong number shown

---

---

SPRINT T-13.EXIT — Phase 13 Exit Inspection

WHY IT MATTERS
Before the next phase starts, confirm this phase is truly done.
Every sprint committed, every acceptance criterion verified,
every test passing.

WHAT GETS BUILT
  (Testing — no code changes)
  - Verify every sprint in this phase has status "committed" in sprints.json
  - Run acceptance criteria for this phase: AC 9.1-9.5
  - Run relevant Playwright tests
  - Check: did any sprint touch files outside its declared scope?
  - Write one-sentence verdict

HOW WE KNOW IT IS DONE
  - All sprints in this phase: status "committed" with valid hash
  - Acceptance criteria checked: Org settings persist, user management works, VIN lead config settable, business hours configurable
  - Relevant Playwright tests pass
  - No files modified outside declared scope
  - Verdict written: "Phase 13 is SOLID" or "Phase 13 has issues: [list]"

FAILS IF
  - Any sprint not committed
  - Any acceptance criterion fails
  - Files modified outside scope
  - Verdict is not SOLID

VERIFICATION NOTES
  - Ghost runs /ghost-check at this point
  - If verdict is not SOLID, next phase is BLOCKED
  - Issues found become new sprints in THIS phase (not the next one)


**Phase 13 is DONE when:**
- All settings pages work for appropriate roles
- User management (CRUD + invite) works
- VIN lead config is settable per org
- Business hours are configurable
- SMS number is displayed
