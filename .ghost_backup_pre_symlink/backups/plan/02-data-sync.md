# Phase 2 — Data Foundation & Sync

**Phase Description**
VIN Solutions data sync, warehouse lead management, and metrics
calculation. This phase ensures dashboards and insights show real,
correct data — not zeros or stale numbers.

**Open Issues:** I-090, I-095 (shared with Phase 4)
**Depends On:** Phase 1 (Auth — org scoping)
**Status:** PARTIALLY DONE — sync runs but metrics are broken

---

---

SPRINT E-2.0 — Phase 2 Entry Inspection

WHY IT MATTERS
Before any work starts in this phase, verify the foundation is solid.
If a dependency is broken, everything built on top of it fails.

WHAT GETS BUILT
  (Exploratory — read only, no code changes)
  - Verify dependencies: Phase 1
  - Check files this phase will touch for uncommitted changes:
    server/sync.ts, server/routes/insights.ts, shared/schema.ts
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


SPRINT V-2.1 — Verify VIN Solutions Connectivity

WHY IT MATTERS
Before fixing sync, confirm VIN Solutions API is accessible
and returns data for all 5 dealers.

WHAT GETS BUILT
  (Verification — no code changes)
  IN
    - vin-safe-mcp health check passes
    - vin_list_users returns data for all 5 dealer IDs
    - vin_query_leads returns data for at least one dealer

HOW WE KNOW IT IS DONE
  - vin-safe-mcp on port 4003 returns healthy
  - Serra Honda (21043): users list includes Durran Cage
  - Hyundai (13399): users list includes Durran Cage
  - At least one dealer returns leads from the last 7 days

FAILS IF
  - vin-safe-mcp not running
  - VIN API returns 403 on any dealer

VERIFICATION NOTES
  - Reference: architecture-integration-detail.md VIN Solutions section
  - This is read-only — no data modification

---

SPRINT I-2.2 — Fix Sync Date Mapping

WHY IT MATTERS
The VIN sync date mapping is broken — vin_created_at was null for
all leads until the sync.ts fix. The fix was deployed but needs
verification that it's producing correct dates.

WHAT GETS BUILT
  BE
    - Verify server/sync.ts transformVinLead() correctly maps:
      createdUtc → vinCreatedAt
      modifiedUtc → vinUpdatedAt
    - Run delta sync for one dealer to verify dates are populated
  DT
    - Verify warehouseLeads table has non-null vinCreatedAt values
    - Query: SELECT COUNT(*) FROM warehouse_leads WHERE vin_created_at IS NULL

HOW WE KNOW IT IS DONE
  - Delta sync completes without errors
  - Zero warehouse_leads with null vin_created_at (for synced records)
  - syncLog shows successful run with record count

WHAT IT DOES NOT INCLUDE
  - Metrics calculation (Sprint I-2.3)
  - Full backfill (Sprint I-2.4)

FAILS IF
  - vin_created_at still null after sync
  - Sync fails with date parsing error

VERIFICATION NOTES
  - This sprint resolves I-090 (partially — metrics part is I-2.3)
  - DRY-RUN: sync one dealer first, verify dates, then sync remaining

---

SPRINT I-2.3 — Fix Warehouse Metrics Calculation

WHY IT MATTERS
Dashboard metrics all show zero because warehouse_metrics table
is empty. The metrics refresh job needs to run and produce correct
aggregations.

WHAT GETS BUILT
  BE
    - Run POST /api/sync/metrics to trigger metrics refresh
    - Verify server/sync.ts runMetricsRefresh() calculates:
      lead counts by status, source, time period
      conversion rates
      pipeline value
    - Verify results are written to warehouseMetrics table
  DT
    - Verify warehouseMetrics table has rows after refresh
    - Query: SELECT metric_key, metric_value FROM warehouse_metrics LIMIT 20

HOW WE KNOW IT IS DONE
  - warehouseMetrics table has data (not empty)
  - GET /api/warehouse/metrics returns non-zero values
  - GET /api/insights/dashboard returns non-zero values
  - Insights page shows real numbers

WHAT IT DOES NOT INCLUDE
  - Frontend display fixes (Phase 11)
  - Scheduled automatic refresh (Phase 2 verification)

FAILS IF
  - warehouseMetrics still empty after refresh
  - Metrics values don't match warehouseLeads data

VERIFICATION NOTES
  - Depends on I-2.2 (dates must be correct first)
  - This sprint resolves I-090 (the metrics half)

---

SPRINT I-2.4 — Full Backfill Verification

WHY IT MATTERS
The 90-day historical backfill populates the warehouse with enough
data for meaningful dashboards and AI chat context.

WHAT GETS BUILT
  (Verification — backfill was already run)
  DT
    - Verify warehouseLeads has data for all 5 dealers
    - Count leads per dealer
    - Verify date range spans at least 30 days

HOW WE KNOW IT IS DONE
  - Each dealer has leads in warehouseLeads
  - Date range covers at least 30 days of history
  - syncLog shows successful backfill run

FAILS IF
  - Any dealer has zero leads
  - Date range is too narrow for meaningful metrics

VERIFICATION NOTES
  - Reference: data-circuit-map.md PATH 8

---

SPRINT G-2.5 — VIN Lead Config Default

WHY IT MATTERS
VIN lead assignment currently uses hardcoded name matching which
caused 35 leads to go to the wrong person. A configurable default
per org prevents this.

WHAT GETS BUILT
  DT
    - Add default_vin_user_id (INTEGER) to integrations table
    - Seed with Durran Cage's userId per dealer:
      Serra Honda/Nissan/Ford: 1299410
      Hyundai/Ford of Columbia: 1239500
  BE
    - Add GET /api/integrations/:orgId/vin-config endpoint
    - Add PATCH /api/integrations/:orgId/vin-config endpoint
    - When creating VIN leads via vin-safe-mcp, read default_vin_user_id
      from integrations table and pass it explicitly
    - If default_vin_user_id is null, return error (don't fallback to name matching)
  FE
    - Add "Default VIN Sales Rep" field to Settings → Integrations section
    - Populated by dropdown from vin_list_users for that dealer

HOW WE KNOW IT IS DONE
  - Each dealer's integrations record has default_vin_user_id set
  - VIN lead creation uses the configured userId
  - Settings page shows the dropdown with current selection
  - Changing the selection persists and is used on next lead creation
  - Null config returns error instead of picking random admin

WHAT IT DOES NOT INCLUDE
  - Per-user VIN mapping (future)
  - Full vin_lead_config table (simplified to one column on integrations)

FAILS IF
  - Lead creation uses name matching instead of configured userId
  - Null config silently picks wrong person

VERIFICATION NOTES
  - This is the simplified version of the vin_lead_config sprint
  - Future: full vin_lead_config table with per-user mapping

---

**Phase 2 Summary**

| Sprint | Type | Issue | What |
|--------|------|-------|------|
| V-2.1 | Verify | — | VIN Solutions connectivity |
| I-2.2 | Issue | I-090 | Fix sync date mapping |
| I-2.3 | Issue | I-090 | Fix warehouse metrics calculation |
| I-2.4 | Verify | — | Full backfill verification |
| G-2.5 | Gap | — | VIN lead config default |

---

SPRINT T-2.EXIT — Phase 2 Exit Inspection

WHY IT MATTERS
Before the next phase starts, confirm this phase is truly done.
Every sprint committed, every acceptance criterion verified,
every test passing.

WHAT GETS BUILT
  (Testing — no code changes)
  - Verify every sprint in this phase has status "committed" in sprints.json
  - Run acceptance criteria for this phase: AC 11.9, 7.1-7.6
  - Run relevant Playwright tests
  - Check: did any sprint touch files outside its declared scope?
  - Write one-sentence verdict

HOW WE KNOW IT IS DONE
  - All sprints in this phase: status "committed" with valid hash
  - Acceptance criteria checked: VIN sync produces correct dates, warehouse metrics non-zero, insights show real data
  - Relevant Playwright tests pass
  - No files modified outside declared scope
  - Verdict written: "Phase 2 is SOLID" or "Phase 2 has issues: [list]"

FAILS IF
  - Any sprint not committed
  - Any acceptance criterion fails
  - Files modified outside scope
  - Verdict is not SOLID

VERIFICATION NOTES
  - Ghost runs /ghost-check at this point
  - If verdict is not SOLID, next phase is BLOCKED
  - Issues found become new sprints in THIS phase (not the next one)


**Phase 2 is DONE when:**
- VIN sync runs and produces correct dates
- Warehouse metrics are populated and match lead data
- Dashboard shows real, non-zero metrics
- VIN lead assignment is configurable per org
- All 5 dealers have data in the warehouse
