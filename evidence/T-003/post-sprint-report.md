# T-003 Post-Sprint Report

**Sprint:** T-003 — Exhaustive Coverage: Sales, Service, Marketing, Departments
**Completed:** 2026-03-31T19:15:00Z
**Author:** Captain (orchestrator)

## EXIT GATE: CLEARED

## Acceptance Criteria

| AC | Description | Verdict |
|----|-------------|---------|
| AC1 | Sales — KPI tiles, pipeline, agents, calendar, insights, RBAC | PASS — 29 tests |
| AC2 | Service — campaigns, agents, scheduling, calendar, RBAC | PASS — 48 tests |
| AC3 | Marketing — metrics, 5 agent cards, studio, campaigns, RBAC | PASS — 40/41 (1 flaky timeout) |
| AC4 | Dept switching — navigation, data refresh, isolation, RBAC | PASS — 30 tests |
| AC5 | Agent-generated plans and tests | PASS — 4 plans, 4 test files |
| AC6 | All tests against dev.huminicdev.com | PASS |

## Exit Gates

| Gate | Status | Evidence |
|------|--------|----------|
| B1: Plans for all 4 domains | PASS | sales, service, marketing, departments plans |
| B2: Tests run and pass or documented | PASS | 147/148 pass, 1 flaky (MKT-015) |
| B3: Evidence in evidence/T-003/ | PASS |

## Coverage Report

| Domain | Plan Cases | Agent Tests | Passed | Failed |
|--------|-----------|-------------|--------|--------|
| Sales | 105 | 29 | 29 | 0 |
| Service | 118 | 48 | 48 | 0 |
| Marketing | 100 | 41 | 40 | 1 (flaky) |
| Dept Switching | 39 | 30 | 30 | 0 |
| **Total** | **362** | **148** | **147** | **1** |

## Flaky Test

MKT-015 (metric tile dialog click) — times out intermittently in shared browser context. Passes in isolation and on re-runs. Known Playwright pattern with accumulated page state. Not a test logic or app defect.

## Ghost Verdict

Step 3: PASS — all 4 plans verified, test files verified, API baseline 44/46 maintained, no scope violations.

## Healer

Step 4: No healing required. MKT-015 is flaky (not broken).

## Existing Test Baseline

API project: 44/46 (2 pre-existing failures in 4.10, 5.9 — unchanged).

## Key Findings

1. Sales: executive role does NOT see Management sidebar (canAccessManagement restricts to super_admin)
2. Service: No Dashboard tab — has Dashboard, Campaigns, Agents, Insights, Calendar
3. Marketing: Agent cards are client-side constants, not API-fetched
4. Dept switching: All 3 department pages properly route-block unauthorized roles

## Scope Compliance

No files in tests/e2e/ modified. All new work in tests/agents/.
