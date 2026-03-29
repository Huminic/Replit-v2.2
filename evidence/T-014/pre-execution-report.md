# Pre-Execution Report: T-014 — Data Flow, Metrics & Billing Baseline

**Sprint:** T-014
**Type:** Data verification via API + Playwright MCP
**Date:** 2026-03-26
**Status:** AWAITING ENTRY GATE

## Objective

Prove every data tile, metric, activity feed, and insight shows real API data. Form submissions create TeamBox conversations. Billing API state baselined. Validates US-003, US-007, US-023, US-024, US-025.

## Declared Files

- `tests/e2e/s3-sales.spec.ts` — may add data assertions
- `tests/e2e/s8-landing-widgets.spec.ts` — may add form→TeamBox assertions

## Acceptance Criteria

- T-014.AC1: Widget contact form POST → conversation in TeamBox within 30s
- T-014.AC2: Landing page contact form POST → conversation in TeamBox within 30s
- T-014.AC3: Sales Dashboard 7 tiles match /api/vin/leads/summary
- T-014.AC4: Sales Recent Activity from /api/activity-log (not hardcoded)
- T-014.AC5: Sales Conversion Rate change is 0
- T-014.AC6: Insights renders on Sales, Service, Marketing, Manage
- T-014.AC7: System Log shows timestamped entries
- T-014.AC8: Hunches generate button works
- T-014.AC9: AI Chat metric drill-down shows /api/metrics/pipeline/details data
- T-014.AC10: Billing GET /api/billing/summary response documented
- T-014.AC11: Billing GET /api/billing/plans catalog documented
- T-014.AC12: Marketing metrics render without hardcoded change/trend

## UI Changes

None.

## Test Plan

### Method: API calls + Playwright MCP
```
# Form→TeamBox: POST /api/widget/contact, then GET /api/conversations, check for new entry
# Metrics: GET /api/vin/leads/summary, compare to DOM tile values
# Billing: GET /api/billing/summary, GET /api/billing/plans — document responses
```

## Diff Reference

No previous attempt.

---

## GHOST ENTRY GATE — T-014

**Date:** 2026-03-26
**Gate:** ENTRY

### Checks

| # | Check | Result |
|---|-------|--------|
| A1 | SEC-08 exit gate cleared | PASS |
| A2 | Worktree clean (client/src, server, shared) | PASS |
| A4 | Pre-exec report present and well-formed | PASS |
| A5 | 12 acceptance criteria declared | PASS |
| A6 | Test plan defined (API + Playwright MCP) | PASS |
| A7 | No UI changes — verification-only sprint | PASS |
| A8 | Declared files vs sprints.json | PASS (minor: pre-exec lists s8-landing-widgets.spec.ts not in sprints.json — acceptable, within scope) |

### Notes

- Sprint is verification-only: no production code changes expected.
- Dependency chain: SEC-08 → T-014 → T-016. Chain intact.
- sprints.json declaredFiles should be updated to include s8-landing-widgets.spec.ts for completeness.

ENTRY GATE: APPROVED
