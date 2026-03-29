# Phase 10 — Department Pages

**Phase Description**
Sales, Service, Marketing, and Management pages. UI is built.
Data needs to display correctly from warehouse and conversation records.
Each page shows department-specific KPIs, agents, campaigns, and insights.
Every metric tile must show a value that matches the backend API.

**Open Issues:** I-089 (contact modal)
**Depends On:** Phase 2 (Data), Phase 8 (AI Chat)
**Status:** UI DONE — data accuracy needs verification

---

---

SPRINT E-10.0 — Phase 10 Entry Inspection

WHY IT MATTERS
Before any work starts in this phase, verify the foundation is solid.
If a dependency is broken, everything built on top of it fails.

WHAT GETS BUILT
  (Exploratory — read only, no code changes)
  - Verify dependencies: Phase 2, 8
  - Check files this phase will touch for uncommitted changes:
    client/src/pages/sales.tsx, service.tsx, marketing.tsx, management.tsx, my-work.tsx, profile.tsx, settings.tsx
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


SPRINT V-10.1 — Sales Page Data Accuracy

WHY IT MATTERS
Sales is the primary department page. KPI tiles must show REAL data
that matches the backend, not hardcoded prototype values.

WHAT GETS BUILT
  (Verification + test)
  FE
    - Navigate to /sales as Sales Manager
    - For EACH KPI tile visible on the page:
      1. Read the displayed value from the DOM
      2. Call the API endpoint that provides that value
      3. Compare: displayed value MUST match API value
    - Verify agent cards show real agents from /api/agents
    - Verify conversation counts match /api/conversations count
  BE
    - Verify /api/metrics/dashboard returns non-zero values for Serra Honda
    - Verify /api/metrics/pipeline returns pipeline data
  DT
    - Verify warehouseLeads has data for this org
    - Verify warehouseMetrics has data for this org

HOW WE KNOW IT IS DONE
  - Every KPI tile value on the Sales page matches the corresponding
    API endpoint value. Not "tiles exist" — values MATCH.
  - If a tile shows "127" the API must return 127 for that metric.
  - If the API returns 0, the tile must show 0 or "No data" — not
    a hardcoded prototype number.
  - Agent cards show agents that exist in /api/agents
  - No right popout on main page (AC 2.4)
  - Metrics centered with chat below (AC 2.5)
  - Sidebar does NOT show Billing for Sales role (AC 6.6)
  - Agents visible in submenu below separator (AC 6.7)

FAILS IF
  - Any tile shows a value that doesn't match its API source
  - Tiles show hardcoded prototype data while API returns different numbers
  - Agent cards show agents that don't exist in the database

VERIFICATION NOTES
  - This is the CRITICAL data accuracy test
  - Write a Playwright test that: login → navigate to /sales → read each
    tile → call API → compare values
  - Document: tile name, displayed value, API endpoint, API value, MATCH/MISMATCH

---

SPRINT V-10.2 — Service Page Data Accuracy

WHY IT MATTERS
Service page must show service-specific data: service agents, service
campaigns, service metrics. Not sales data.

WHAT GETS BUILT
  (Verification + test)
  FE
    - Navigate to /service
    - For EACH KPI tile:
      1. Read displayed value
      2. Call the corresponding API endpoint
      3. Compare: MUST match
    - Verify only service agents shown (not sales agents)
    - Verify only service campaigns shown (not sales campaigns)
    - Verify service calendar shows service appointments
    - Verify at least 1 agent in submenu (AC 6.8)
  BE
    - Verify API filters by department correctly

HOW WE KNOW IT IS DONE
  - All service KPI tile values match their API sources
  - No sales agents appear on the service page
  - No sales campaigns appear on the service page
  - Nancy Gaston appears (when configured — may be GAP until Phase 4)

FAILS IF
  - Sales data leaks into service page
  - Tile values don't match API
  - No service agent visible

---

SPRINT V-10.3 — Marketing Page Data Accuracy

WHY IT MATTERS
Marketing page shows marketing agents and campaign data.

WHAT GETS BUILT
  (Verification + test)
  FE
    - Navigate to /marketing
    - For EACH KPI tile: read value → call API → compare
    - Verify agent cards display
    - Verify insights tab loads

HOW WE KNOW IT IS DONE
  - All tile values match API sources
  - Page loads without errors
  - No data from other departments

FAILS IF
  - Tile values don't match API
  - Page errors

---

SPRINT V-10.4 — Management Page Data Accuracy

WHY IT MATTERS
Management is the executive overview. Demand Score and other
high-level metrics must be real, not hardcoded.

WHAT GETS BUILT
  (Verification + test)
  FE
    - Navigate to /management as Org Admin
    - For EACH metric tile: read value → call API → compare
    - Verify Demand Score tile shows calculated value (AC 6.5)
    - Verify user list shows org members
  BE
    - Verify Demand Score calculation source
    - Document: what table/query produces the Demand Score

HOW WE KNOW IT IS DONE
  - Demand Score is calculated from real data, not hardcoded "8.4"
  - All tile values match API sources
  - User list matches /api/users response

FAILS IF
  - Demand Score is a hardcoded value
  - Any tile doesn't match its API source
  - Management page visible to Sales/Service staff (should be Org Admin+)

---

SPRINT I-10.5 — Fix Contact Modal

WHY IT MATTERS
When clicking a lead in the dashboard drill-down, the contact
modal should show lead details. Currently it fails to load.

WHAT GETS BUILT
  FE
    - Fix contact modal component to correctly fetch and display lead data
    - Verify it calls the right API endpoint
  BE
    - Verify endpoint returns lead detail data

HOW WE KNOW IT IS DONE
  - Click a lead → modal opens with customer name, phone, email, vehicle
  - Modal data matches the API response for that lead
  - Modal works from Sales page pipeline drill-down

FAILS IF
  - Modal blank or errors
  - Shows wrong lead data
  - Data in modal doesn't match API

VERIFICATION NOTES
  - This sprint resolves I-089

---

SPRINT V-10.6 — My Work Page Data Accuracy

WHY IT MATTERS
My Work shows the logged-in user's assigned tasks and conversations.
Must be scoped to the current user only.

WHAT GETS BUILT
  (Verification + test)
  FE
    - Navigate to /my-work
    - Verify tasks shown are assigned to current user only
    - Verify conversations shown are assigned to current user only
    - Verify summary tile counts match API response
  BE
    - Call /api/tasks → count tasks assigned to current user
    - Call /api/conversations → count conversations assigned to current user
    - Compare against displayed counts

HOW WE KNOW IT IS DONE
  - Task count on My Work matches /api/tasks filtered count
  - Conversation count matches /api/conversations filtered count
  - No tasks from other users visible
  - Product tour works on first login (AC 1.13)
  - Tour dismisses per-page (AC 1.14)

FAILS IF
  - Shows tasks assigned to other users
  - Counts don't match API
  - Tour doesn't trigger on first login (if implemented)

---

SPRINT V-10.7 — Profile and Settings Page Verification

WHY IT MATTERS
Profile and settings must render correctly with the right data
and access controls.

WHAT GETS BUILT
  (Verification)
  FE
    - /profile shows name, email, photo upload, password change (AC 9.2)
    - Restart Tour button exists and works (AC 9.3)
    - /settings loads with all tile sections (AC 9.1)
    - /settings/org-wizard only accessible to Super Admin (AC 9.4)
    - CommGate toggle in settings works (AC 9.5)
  BE
    - Verify /api/settings/org returns org settings
    - Verify PATCH /api/settings/org persists changes

HOW WE KNOW IT IS DONE
  - Profile page shows current user's data
  - Restart Tour button triggers tour restart
  - Settings tiles all render
  - Org Wizard returns 403 for non-Super Admin
  - CommGate toggle changes outboundEnabled in database

FAILS IF
  - Profile shows wrong user data
  - Settings tiles missing
  - Non-Super Admin can access Org Wizard

---

SPRINT V-10.8 — Security and Infrastructure Verification

WHY IT MATTERS
Security headers, rate limiting, and data isolation must be
confirmed working.

WHAT GETS BUILT
  (Verification)
  IN
    - Check response headers for Helmet security headers (AC 12.2)
    - Test rate limiting: send 100+ requests in 1 minute (AC 12.3)
    - Verify entitlement check returns 403 when feature not entitled (AC 12.5)
    - Verify getConversationByPhone filters by orgId (AC 12.6)
    - Verify Pin to Dashboard feature is removed (AC 7.5)
    - Verify task creation is self-assign only (AC 10.2)
    - Verify task/appointment CRUD endpoints respond (AC 10.4)

HOW WE KNOW IT IS DONE
  - Response includes X-Content-Type-Options, X-Frame-Options headers
  - 101st request in 1 minute returns 429
  - Entitlement endpoint returns 403 for unentitled feature
  - Conversation phone lookup scoped to orgId
  - No "Pin to Dashboard" button in insights page
  - Task creation sets assignee to current user

FAILS IF
  - Security headers missing
  - Rate limiting doesn't engage
  - Cross-org data accessible

---

**Phase 10 Summary**

| Sprint | Type | Issue | What |
|--------|------|-------|------|
| V-10.1 | Verify | — | Sales page data accuracy (tile values match API) |
| V-10.2 | Verify | — | Service page data accuracy |
| V-10.3 | Verify | — | Marketing page data accuracy |
| V-10.4 | Verify | — | Management page data accuracy (Demand Score real) |
| I-10.5 | Issue | I-089 | Contact modal fix |
| V-10.6 | Verify | — | My Work page data accuracy + product tour |
| V-10.7 | Verify | — | Profile and Settings page verification |
| V-10.8 | Verify | — | Security and infrastructure checks |

---

SPRINT T-10.EXIT — Phase 10 Exit Inspection

WHY IT MATTERS
Before the next phase starts, confirm this phase is truly done.
Every sprint committed, every acceptance criterion verified,
every test passing.

WHAT GETS BUILT
  (Testing — no code changes)
  - Verify every sprint in this phase has status "committed" in sprints.json
  - Run acceptance criteria for this phase: AC 2.1-2.5, 6.1-6.8, 9.1-9.5, 10.1-10.4, 12.2-12.6
  - Run relevant Playwright tests
  - Check: did any sprint touch files outside its declared scope?
  - Write one-sentence verdict

HOW WE KNOW IT IS DONE
  - All sprints in this phase: status "committed" with valid hash
  - Acceptance criteria checked: Every page tile value matches API, no prototype data, RBAC enforced, security checks pass
  - Relevant Playwright tests pass
  - No files modified outside declared scope
  - Verdict written: "Phase 10 is SOLID" or "Phase 10 has issues: [list]"

FAILS IF
  - Any sprint not committed
  - Any acceptance criterion fails
  - Files modified outside scope
  - Verdict is not SOLID

VERIFICATION NOTES
  - Ghost runs /ghost-check at this point
  - If verdict is not SOLID, next phase is BLOCKED
  - Issues found become new sprints in THIS phase (not the next one)


**Phase 10 is DONE when:**
- Every KPI tile on every department page shows a value that matches
  its backend API source. Documented: tile → API → value → MATCH.
- Contact modal works for lead drill-down
- Profile, settings, and admin pages all function correctly
- Security headers, rate limiting, and data isolation confirmed
- No hardcoded prototype values displayed anywhere
