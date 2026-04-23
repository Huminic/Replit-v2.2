# Phase 11 — Insights & Metrics

**Phase Description**
The Insights page and all metric calculations across the application.
Every number displayed anywhere in the UI must trace back to a real
data source and the calculation must be documented.

**Open Issues:** I-090 (shared with Phase 2)
**Depends On:** Phase 2 (warehouse must be populated)
**Status:** BROKEN — metrics all zeros until Phase 2 fixes sync

---

---

SPRINT E-11.0 — Phase 11 Entry Inspection

WHY IT MATTERS
Before any work starts in this phase, verify the foundation is solid.
If a dependency is broken, everything built on top of it fails.

WHAT GETS BUILT
  (Exploratory — read only, no code changes)
  - Verify dependencies: Phase 2
  - Check files this phase will touch for uncommitted changes:
    server/routes/insights.ts, server/routes/metrics.ts, client/src/pages/insights.tsx
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


SPRINT V-11.1 — Insights Page Data Accuracy (After Phase 2)

WHY IT MATTERS
The Insights page is the analytics hub. Every metric must show a
real number that can be traced to the database.

WHAT GETS BUILT
  (Verification + test)
  FE
    - Navigate to /insights
    - For EACH metric tile/zone:
      1. Read the displayed value
      2. Call the API endpoint that provides it
      3. Compare: MUST match
    - Verify drill-down: click a tile → detail view loads with data
    - Verify metric library populates (AC 7.3)
    - Verify role filtering (AC 7.4)

HOW WE KNOW IT IS DONE
  - Every tile on Insights page shows a value matching its API source
  - Drill-down into any metric shows detail data
  - Metric library lists available metrics
  - Sales role sees unfiltered metrics; other roles see filtered

FAILS IF
  - Any metric tile shows zero when warehouse has data
  - Drill-down shows empty or errors
  - Metric values don't match API responses

---

SPRINT V-11.2 — Pipeline and Lead Source Accuracy

WHY IT MATTERS
Pipeline value and lead source breakdown are key KPIs for sales managers.

WHAT GETS BUILT
  (Verification + test)
  BE
    - GET /api/metrics/pipeline → verify pipeline data
    - GET /api/metrics/pipeline/details → verify breakdown
    - For each lead source in breakdown:
      Query warehouseLeads WHERE leadSource = X → count
      Compare against displayed count
  FE
    - Pipeline drill-down shows correct breakdown by source
    - Lead source labels show meaningful names, not raw URLs (AC 7.6)

HOW WE KNOW IT IS DONE
  - Pipeline total matches SUM of warehouseLeads by status
  - Lead source breakdown counts match raw DB queries
  - No lead source shows "https://api.vinsolutions.com/..." as its label
  - Pipeline value reflects actual dollar amounts (not zeros)

FAILS IF
  - Pipeline total doesn't match warehouse data
  - Lead sources show raw API URLs
  - Breakdown counts don't sum to total

---

SPRINT G-11.3 — Full Metric Traceability Audit

WHY IT MATTERS
Every metric displayed in the application must have a documented
source. This prevents phantom numbers that look right but have
no real backing.

WHAT GETS BUILT
  BE
    - For every metric tile across ALL pages (Sales, Service,
      Marketing, Management, Insights, Dashboard):
      Document: tile name → API endpoint → DB query → table → columns
    - Produce a metric traceability table
    - Verify each entry by running the query and comparing
  DT
    - Run raw SQL for each metric calculation
    - Compare against API response
    - Compare against displayed UI value (from verification sprints)

HOW WE KNOW IT IS DONE
  - A metric traceability document exists with EVERY tile mapped:
    | Page | Tile Name | API Endpoint | DB Table | Query | Expected Value | Actual Value | MATCH |
  - Every row shows MATCH
  - Document committed to evidence/

WHAT IT DOES NOT INCLUDE
  - Fixing mismatches (those become issues in issues.md)
  - Changing metric calculations (just document and verify)

FAILS IF
  - Any metric has no documented source (unknown where the number comes from)
  - Any MISMATCH between DB, API, and UI

VERIFICATION NOTES
  - This is the definitive data accuracy audit
  - Any MISMATCH found creates a new issue
  - The traceability document becomes a reference for future development

---

SPRINT G-11.4 — Dashboard Main Page Metric Accuracy

WHY IT MATTERS
The main dashboard page (/) shows KPI tiles that are the first
thing every user sees. They must be correct.

WHAT GETS BUILT
  (Verification + test)
  FE
    - Navigate to / (main page)
    - For EACH metric tile:
      1. Read displayed value
      2. Call /api/metrics/dashboard
      3. Compare specific field to displayed value
    - Test as multiple roles: Super Admin, Partner Admin, Org Admin, Sales
    - Verify role-specific metrics show different values per role (AC 2.2)

HOW WE KNOW IT IS DONE
  - Super Admin dashboard shows org-scoped metrics for selected org
  - Partner Admin shows metrics for selected child org
  - Org Admin shows own org metrics
  - Sales shows sales-specific metrics
  - All values match /api/metrics/dashboard response

FAILS IF
  - Same values shown for all roles (not role-specific)
  - Values don't match API
  - Dashboard shows prototype placeholders

---

**Phase 11 Summary**

| Sprint | Type | Issue | What |
|--------|------|-------|------|
| V-11.1 | Verify | — | Insights page data accuracy |
| V-11.2 | Verify | — | Pipeline and lead source accuracy |
| G-11.3 | Gap | — | Full metric traceability audit |
| G-11.4 | Gap | — | Dashboard main page metric accuracy |

---

SPRINT T-11.EXIT — Phase 11 Exit Inspection

WHY IT MATTERS
Before the next phase starts, confirm this phase is truly done.
Every sprint committed, every acceptance criterion verified,
every test passing.

WHAT GETS BUILT
  (Testing — no code changes)
  - Verify every sprint in this phase has status "committed" in sprints.json
  - Run acceptance criteria for this phase: AC 7.1-7.6
  - Run relevant Playwright tests
  - Check: did any sprint touch files outside its declared scope?
  - Write one-sentence verdict

HOW WE KNOW IT IS DONE
  - All sprints in this phase: status "committed" with valid hash
  - Acceptance criteria checked: Every metric traceable to DB source, pipeline accurate, lead sources labeled correctly
  - Relevant Playwright tests pass
  - No files modified outside declared scope
  - Verdict written: "Phase 11 is SOLID" or "Phase 11 has issues: [list]"

FAILS IF
  - Any sprint not committed
  - Any acceptance criterion fails
  - Files modified outside scope
  - Verdict is not SOLID

VERIFICATION NOTES
  - Ghost runs /ghost-check at this point
  - If verdict is not SOLID, next phase is BLOCKED
  - Issues found become new sprints in THIS phase (not the next one)


**Phase 11 is DONE when:**
- Every metric tile in the entire application shows a value that
  matches a documented DB query
- A traceability document exists mapping every tile to its source
- No hardcoded or prototype values displayed anywhere
- Pipeline and lead source breakdowns are accurate
- Role-specific metrics show different values per role
