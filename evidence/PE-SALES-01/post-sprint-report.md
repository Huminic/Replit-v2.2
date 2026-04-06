# Post-Sprint Report — PE-SALES-01

**Sprint:** PE-SALES-01
**Date:** 2026-04-06
**Dev Agent:** scribe

## Objective

Evaluate the Sales Dashboard section on live production (https://live.huminic.app/sales) as a management surface. Assess metric plausibility across stores, popout/drill-down truth, store-context coherence, trigger visibility, agent display, calendar function, and activity feed through observation only — no code changes.

## Changes Made

No code changes. This is an observation-only production evaluation sprint. Evidence artifacts created:
- evidence/PE-SALES-01/section-function-map.md
- evidence/PE-SALES-01/use-case-inventory.md
- evidence/PE-SALES-01/acceptance-matrix.md
- evidence/PE-SALES-01/evidence-index.md
- evidence/PE-SALES-01/bug-log.md
- evidence/PE-SALES-01/workflow-audit.log
- evidence/PE-SALES-01/screenshots/ (22 screenshots)

## AC Results

| AC | Description (from sprints.json) | Result | Evidence |
|----|-------------------------------|--------|----------|
| AC1 | Section function map exists for dashboard, popouts, configuration, and relevant sub-tabs in interface terms | PASS | section-function-map.md — covers 4 tabs, 7 tiles, drill-down matrix, sync status, data sources, US-023 gaps |
| AC2 | Store selection changes are evaluated for whether visible metrics remain plausible and coherent | PASS | UC-01 through UC-04 — 5 stores evaluated with tile values recorded. Values change per store, restore on switch-back. All 0% change values flagged (BUG-05) |
| AC3 | Popout and configuration surfaces are checked against acceptance intent, including whether extra cost information appears without justification | PASS | UC-05 through UC-09 — Active Pipeline drill-down works (with data quality issues). Appointments Set count mismatch (BUG-03). Cost info NOT found (operator concern disproven) |
| AC4 | Visible metrics are checked against recent activity and any available drill-down truth | PARTIAL | UC-05 Active Pipeline drill-down matches tile count (16). UC-06 Appointments Set tile says 22 but drill-down shows 0 records (BUG-03). Other 5 tiles have no drill-down to verify against |
| AC5 | Trigger configuration and channel-related behavior / visibility are evaluated in the dashboard context | PASS | UC-11, UC-12 — No trigger config accessible from Sales page. No VAPI lead metric tile. VAPI activity visible in Recent Activity feed only (BUG-06) |
| AC6 | Every executed flow has evidence, commentary, and result status | PASS | evidence-index.md — 16 use cases documented with results, screenshots, and commentary |
| AC7 | Bugs are logged with severity, type, and false-pass classification where applicable | PASS | bug-log.md — 8 bugs with severity, type, location, evidence. 2 non-bug confirmations documented |

## Executed Flow Summary

| Phase | Flows | Pass | Partial | Fail | Inconclusive |
|-------|-------|------|---------|------|--------------|
| Phase 1 (Metric Tiles) | 7 | 4 | 2 | 0 | 1 |
| Phase 2 (Drill-Downs/Popouts) | 5 | 2 | 1 | 1 | 1 |
| Phase 3 (Sync/VAPI) | 2 | 0 | 1 | 0 | 1 |
| Phase 4 (Trigger Config) | 1 | 0 | 0 | 0 | 1 |
| Phase 5 (Agents/Calendar/Activity) | 3 | 2 | 1 | 0 | 0 |
| **Total** | **16** (+ 2 bonus) | **8** | **5** | **1** | **4** |

## Bug Summary

| ID | Title | Severity | Type |
|----|-------|----------|------|
| BUG-01 | Vehicle column shows raw API URLs instead of descriptions | Medium | Data Display |
| BUG-02 | 11 of 16 Active Pipeline records have no customer name | Medium | Data Quality |
| BUG-03 | Appointments Set drill-down shows 0 records despite tile showing 22 | High | Data Mismatch |
| BUG-04 | 7 of 11 agents display as "Unauthorized Agent" / "Should fail" | High | Test Data in Production |
| BUG-05 | All "vs last 30d" change values show 0% across all stores | Low-Medium | Missing Feature |
| BUG-06 | No VAPI/voice lead count visible on Sales Dashboard | Low-Medium | Missing Feature |
| BUG-07 | Stale warehouse sync across multiple stores (5-16 days) | Medium | Data Freshness |
| BUG-08 | Only 2 of 7 tiles have record-level drill-downs | Low | Feature Gap |

## Key Findings

1. **Appointments Set tile count mismatch (BUG-03):** The tile displays "22" for Serra Honda but the drill-down dialog returns 0 records. Either the count query and the detail query use different filters, or the drill-down is querying a different table. This is the most consequential data integrity issue found.

2. **Test agents in production (BUG-04):** 7 of 11 agent cards show "Unauthorized Agent" with description "Should fail." These are test/validation stubs visible to all users in the production agent list and in the Top Performing Agents ranking.

3. **Vehicle URLs instead of descriptions (BUG-01):** The Active Pipeline drill-down and Contact Details both display raw VIN Solutions API URLs (e.g., `https://api.vinsolutions.com/vehicles/interest/id/1988464528-0`) where vehicle year/make/model should appear.

4. **Stale warehouse sync (BUG-07):** Sync timestamps range from 5 days (Tony Serra Ford) to 16 days (Ford of Columbia, Hyundai of Columbia). No manual refresh button exists. Aligns with known issue I-201 (delta sync scheduler).

5. **Cost info concern disproven:** The operator's concern about unwanted cost/price information appearing in popouts was NOT confirmed. No financial data (dollar amounts, deal values, vehicle prices) appears in any drill-down or popout.

6. **Tony Serra Ford zeros not reproduced:** The expected all-zeros state for Tony Serra Ford was not observed. The store shows real data (202 total leads, 8 sold, 4% conversion). The issue was either previously fixed or was intermittent.

## Remediation Summary

No remediation authorized. This is an observation-only evaluation sprint. All bugs logged for batch remediation after all 7 PE sprints complete.

## Evidence Gaps

- UC-11 (VAPI leads): No dedicated tile exists, so no drill-down possible. VAPI activity confirmed in Recent Activity feed only.
- UC-12 (Trigger config): No trigger configuration surface found on Sales page. Cannot evaluate what does not exist.
- 5 of 7 tiles have only summary dialogs (no record-level drill-down), so individual record verification is limited to Active Pipeline.

## Test Execution

No automated Playwright test suite executed. This is an observation-only evaluation sprint. All evidence was gathered via interactive browser inspection using MCP Playwright against live production (https://live.huminic.app/sales). 16 use cases evaluated across 5 phases with 22 screenshot files.

## UI Delta

- Elements added: none
- Elements removed: none
- Elements modified: none

No code changes were made. Observation-only sprint.

## Regression Delta

- Tests that passed before and fail now: none
- Tests that already failed (pre-existing): none

No code changes were made. No regression possible.

## Confidence Assessment

**UI Mechanics:** HIGH — All 4 tabs render correctly (Dashboard, Agents, Insights, Calendar). 7 metric tiles load with values. Drill-down dialogs open. Store switcher works and values restore on switch-back. Calendar shows appointments. Agent cards display. The page is structurally sound.

**Data Quality:** MEDIUM — Tile counts exist and are non-zero for active stores, but supporting evidence is mixed. All 0% change values suggest comparison logic is not implemented (hardcoded). Appointments Set count/drill-down mismatch undermines confidence. 11 of 16 Active Pipeline records lack customer names. Vehicle fields show raw URLs. Sync timestamps show 5-16 days of staleness across all stores.

**Operator Trust:** MEDIUM — A dealership manager would see plausible lead counts and could drill into Active Pipeline for individual records. However, the 0% changes everywhere, stale sync timestamps, test agents visible in rankings, and Appointments count mismatch would erode trust. The page is usable as a rough overview but not yet reliable as a management decision surface.

**Integration Health:** MEDIUM — VIN Solutions warehouse data populates tiles. Contact detail fetch works (returns real phone numbers). But sync staleness, missing vehicle descriptions, and VAPI-to-lead pipeline gaps indicate integration is functional but not fully polished.

## Recommendation

**CONTINUE** to next sprint (PE-INSIGHTS-01). Do not block the eval program on these findings. The bugs found are data quality and completeness issues, not structural failures. The cost information concern (operator's #10 critical bug) was disproven — no financial data appears in popouts. The Tony Serra Ford all-zeros issue was not reproduced. The most actionable bugs (BUG-03 appointments mismatch, BUG-04 test agents, BUG-07 stale sync) should be logged for batch remediation after all 7 PE sprints complete.

## Recommended Next Sprint

PE-INSIGHTS-01 — Insights: Graph Population, Modal Usefulness, Contact Actions, and Report Credibility

## Ghost Exit Gate

**Date:** 2026-04-06
**Evaluator:** Ghost agent

### Checklist

| Gate | Description | Result | Evidence |
|------|------------|--------|----------|
| B1 | All planned Sales flows have execution reports | PASS | evidence-index.md — 16 use cases with results, screenshots, and commentary |
| B2 | Metric plausibility and contradiction checks are documented | PASS | UC-01 through UC-04 document tile values across 5 stores; BUG-03 documents appointments count/drill-down contradiction; BUG-05 documents implausible 0% changes |
| B3 | Popout and configuration truth claims have evidence | PASS | UC-05 through UC-09 with screenshots; cost info absence confirmed (UC-08); vehicle URL bug documented (BUG-01) |
| B4 | Bugs are logged with status | PASS | 8 bugs in bug-log.md with severity, type, location, and evidence. 2 non-bug confirmations documented |
| B5 | Remediation retests completed or deferred explicitly | PASS | Deferred — observation-only sprint, no remediation authorized |
| B6 | Post-sprint review includes confidence assessment | PASS | 4-dimension confidence assessment (UI Mechanics HIGH, Data Quality MEDIUM, Operator Trust MEDIUM, Integration Health MEDIUM) |
| B7 | If code changed, relevant tests rerun and recorded | PASS | No code changes (observation-only) |
| B8 | Exit review clear | PASS | Enforcer checklist APPROVED (15/15), cross-sign APPROVED |
| B10 | Ghost Exit Gate | This gate |

### Verification Summary

- Post-sprint report: all required sections present (Objective, Changes Made, AC Results, Test Execution, UI Delta, Regression Delta, Confidence Assessment, Recommendation)
- Enforcer checklist: RESULT: APPROVED with 15/15 checks passing
- Cross-sign: Verdict: APPROVED (implementing: scribe, reviewing: governance)
- Bug log: 8 bugs with complete taxonomy, 2 non-bug confirmations
- Evidence index: 16 use cases documented with evidence and commentary
- Code changes: 0 application files modified (observation-only confirmed)
- Key findings validated: appointments count mismatch (BUG-03), test agents in production (BUG-04), vehicle raw URLs (BUG-01), stale warehouse sync (BUG-07)
- Operator concerns resolved: cost info NOT present in any popout (disproven), Tony Serra Ford all-zeros NOT reproduced

### Verdict

EXIT GATE: CLEARED
