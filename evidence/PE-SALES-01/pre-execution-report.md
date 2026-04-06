# PE-SALES-01 — Pre-Execution Report

**Sprint:** PE-SALES-01
**Section:** Sales Dashboard
**Date:** 2026-04-06
**Type:** Production Evaluation (observation-only)

---

## Objective

Evaluate the Sales Dashboard section of the live production application at live.huminic.app. Verify that all 4 tabs (Dashboard, Agents, Insights, Calendar) function correctly, that metric tiles display truthful and plausible data, that drill-downs work for the 2 supported tiles, and that known issues (all-zeros for Tony Serra Ford, hardcoded change values, unwanted COST info in popouts) are documented. Identify and log all bugs found.

**This sprint is observation-only. No code changes. No irreversible actions. Evidence captured via Playwright MCP browser tools against live.huminic.app.**

---

## Declared Files

### Files Created (evidence only)
- `evidence/PE-SALES-01/section-function-map.md` -- What this page does
- `evidence/PE-SALES-01/use-case-inventory.md` -- All testable use cases
- `evidence/PE-SALES-01/acceptance-matrix.md` -- AC-to-use-case mapping
- `evidence/PE-SALES-01/pre-execution-report.md` -- This file
- `evidence/PE-SALES-01/post-sprint-report.md` -- Written after evaluation
- `evidence/PE-SALES-01/bug-log.md` -- Bug log with taxonomy (created during eval)
- `evidence/PE-SALES-01/screenshots/` -- Screenshot evidence (created during eval)

### Files Modified
None. This is observation-only.

### Application Code Changes
None.

---

## UI Changes

None. No UI modifications permitted. This is a production evaluation sprint -- observe and document only.

---

## Acceptance Criteria

| AC | Criterion | Verification Method |
|----|-----------|-------------------|
| AC1 | Section function map completed | Document review (section-function-map.md) |
| AC2 | Dashboard tab loads with 7 metric tiles, plausible values per store | Live browser testing -- UC-01, UC-02, UC-03, UC-04 |
| AC3 | Drill-down tables for Active Pipeline and Appointments Set | Live browser testing -- UC-05, UC-06 |
| AC4 | Non-drill-down tiles (5 of 7) behavior documented | Live browser testing -- UC-07 |
| AC5 | COST info popout issue investigated and documented | Live browser testing -- UC-08 |
| AC6 | Contact detail view shows meaningful CRM data | Live browser testing -- UC-09 |
| AC7 | Sync status, activity feed, top agents, VAPI leads documented | Live browser testing -- UC-10, UC-11, UC-15, UC-16 |
| AC8 | Agents tab, Calendar tab, trigger config observed | Live browser testing -- UC-12, UC-13, UC-14 |
| AC9 | Every flow has evidence + commentary + status | Review of evidence directory |
| AC10 | Bugs logged with taxonomy | Review of bug-log.md |
| AC11 | Post-sprint confidence + recommendation | Document review (post-sprint-report.md) |

---

## Test Plan

All testing is manual/interactive via Playwright MCP browser tools against the live production site.

### Phase 1: Page Load and Dashboard Metrics (UC-01, UC-02, UC-04)
1. Navigate to live.huminic.app, log in as duane.wells@huminic.ai
2. Navigate to Sales Dashboard
3. Screenshot: initial page state with 7 metric tiles on Dashboard tab
4. Record all 7 tile values for default store
5. Verify values are non-zero and plausible (or document if zero)
6. Check for hardcoded change values (expected: all show 0)

### Phase 2: Store Switching (UC-03, UC-04)
1. Switch to Serra Honda -- screenshot and record all 7 tile values
2. Switch to Tony Serra Ford -- screenshot (verify all-zeros claim)
3. Switch through remaining stores, recording values
4. Verify metrics change per org (not static across all stores)

### Phase 3: Drill-Downs (UC-05, UC-06, UC-07, UC-08)
1. Click Active Pipeline tile -- screenshot drill-down table
2. Click Appointments Set tile -- screenshot drill-down table
3. Click each of the other 5 tiles -- document what appears
4. Specifically check for unwanted COST information in any popout
5. Cross-check: tile count vs drill-down row count where applicable

### Phase 4: Contact Detail (UC-09)
1. From a drill-down table, click "View Contact"
2. Screenshot ContactDetailView
3. Verify meaningful data (name, phone, email, not just raw IDs)
4. Test back button navigation

### Phase 5: Sync Status and Supporting Sections (UC-10, UC-11, UC-15, UC-16)
1. Screenshot sync status indicator, note time since last sync
2. Screenshot Recent Activity Feed, verify plausible entries
3. Screenshot Top Agents section
4. Check for any VAPI lead visibility on dashboard

### Phase 6: Agents Tab (UC-13)
1. Switch to Agents tab
2. Screenshot agent cards
3. Verify active/inactive toggles present

### Phase 7: Calendar Tab (UC-14)
1. Switch to Calendar tab
2. Screenshot appointment calendar
3. Verify appointments display if data exists

### Phase 8: Config and Edge Cases (UC-12)
1. Check if any trigger/config elements are accessible from Sales page
2. Document findings

### Evidence Capture
- Every use case gets at least one screenshot
- Screenshots saved to `evidence/PE-SALES-01/screenshots/`
- Named: `UC-{nn}-{description}.png`

---

## Evidence Plan

| Evidence Tier | Description | Use Cases |
|--------------|-------------|-----------|
| Bronze | Screenshot showing expected state | UC-01, UC-12 |
| Silver | Screenshot + behavioral observation | UC-03, UC-05, UC-06, UC-07, UC-10, UC-11, UC-13, UC-14, UC-15, UC-16 |
| Gold | Screenshot + data cross-check (tile values, CRM data, known issues) | UC-02, UC-04, UC-08, UC-09 |

---

## Bug Handling Plan

All bugs discovered during evaluation will be logged in `evidence/PE-SALES-01/bug-log.md` with the following taxonomy:

| Field | Description |
|-------|-------------|
| Bug ID | BUG-PS01-{nn} |
| Use Case | Which UC triggered discovery |
| Severity | Critical / High / Medium / Low |
| Category | Functional / Visual / Data / UX |
| Description | What happened vs what was expected |
| Evidence | Screenshot filename |
| Recommendation | Fix priority and suggested approach |

Known issues to verify:
- All-zeros for Tony Serra Ford (UC-04)
- Hardcoded change values of 0 on all tiles
- Unwanted COST info in popout (UC-08, operator-reported)
- US-023 gaps (no dollar pipeline, no lead source/quality/demand score tiles)

---

## Irreversible Action Boundary

**None.** This sprint performs no irreversible actions.

- No code changes
- No database writes
- No external API calls that create or modify data
- No deployments
- No emails, SMS, or outbound communications
- Browser interaction is read-only (navigate, click, observe)

The only artifacts created are evidence files within this repository.

---

## Dependencies and Risks

### Dependencies
- live.huminic.app must be running and accessible
- Test account duane.wells@huminic.ai must be able to log in
- At least one store must have non-zero metric data for meaningful evaluation
- VIN Solutions API must be reachable for contact detail views

### Risks
| Risk | Mitigation |
|------|-----------|
| Live site is down | Check with curl before starting; if down, report blocker |
| No data in metrics | Switch stores until non-zero data found; document empty stores |
| VIN API timeout on contact detail | Retry once; if still fails, log as bug |
| All stores show zeros | Document as finding; still evaluate all other functionality |

---

## Ghost Entry Gate

**Date:** 2026-04-06
**Evaluator:** Ghost agent

### Gate Checklist
| Gate | Status | Notes |
|------|--------|-------|
| A1 | PASS | section-function-map.md exists with concrete detail -- references 7 specific metric tiles, 4 tabs, drill-down support matrix (2 of 7), data source (warehouse not live API), sync status behavior, and US-023 gaps. Demonstrates real source knowledge. |
| A2 | PASS | Scope explicitly limited to Sales Dashboard (4 tabs: Dashboard, Agents, Insights, Calendar). All 16 use cases (UC-01 through UC-16) relate only to sales page elements. No out-of-scope pages referenced. |
| A3 | PASS | Expected behavior defined in concrete terms: 7 named tiles with data sources, 2 drill-down-capable tiles identified, change values documented as hardcoded 0, sync status described, known issues enumerated (Tony Serra Ford zeros, COST popout, US-023 gaps). |
| A4 | PASS | Pre-execution report exists with all required sections: Objective, Declared Files, UI Changes, Acceptance Criteria, Test Plan, Evidence Plan, Bug Handling Plan, Irreversible Action Boundary, Dependencies and Risks. Supporting artifacts (function map, use cases, acceptance matrix) all present. |
| A5 | PASS | Irreversible Action Boundary section explicitly excludes all irreversible actions: no code changes, no database writes, no external API mutations, no deployments, no outbound communications. Browser interaction is read-only. |
| A6 | N/A | Observation-only sprint -- no code changes, worktree cleanliness not applicable. |
| A7 | PASS | No blocking ghost, enforcer, or operator messages found. |
| A8 | PASS | Sprint scope is well-defined with 11 acceptance criteria covering all 16 use cases. Known issues pre-identified for verification. Evidence tiers appropriate (Gold for data-critical checks, Silver for behavioral observations, Bronze for basic state verification). |
| A9 | PASS | This gate -- verdict below. |

### Cross-Checks Performed
- **AC coverage:** All 11 ACs mapped to specific use cases in acceptance-matrix.md and pre-execution-report.md section 4.
- **Use case coverage:** All 16 use cases (UC-01 through UC-16) mapped to at least one AC. No orphan use cases, no unmapped ACs.
- **Evidence tiers:** Bronze (2 UCs), Silver (10 UCs), Gold (4 UCs) -- appropriate escalation for data-critical flows.
- **Known issues pre-loaded:** 4 known issues identified for verification during evaluation (Tony Serra Ford zeros, hardcoded change values, COST popout, US-023 gaps).
- **No code modification risk:** All declared files are under evidence/. No application code listed.

### Verdict
ENTRY GATE: APPROVED
