# T-004 Pre-Execution Report

**Sprint:** T-004 — Exhaustive Coverage: Settings, Billing, Insights, Management
**Created:** 2026-03-31T19:20:00Z
**Author:** Captain (orchestrator)

## Objective

Achieve exhaustive test coverage for admin/config surfaces: Settings (42+ interaction states), Billing (FlexPrice integration), Insights (27+ states), Management (super_admin only). These are trust-critical for org admins and partners.

## Success Criteria

- AC1-AC6 from sprints.json T-004 definition
- Known limitations documented (I-105 FlexPrice, I-171 billing states, I-156/I-163 insights, I-166 org wizard)
- No regressions

## Declared Files

- tests/e2e/domain-07-insights.spec.ts (may be modified)
- tests/e2e/domain-08-billing.spec.ts (may be modified)
- tests/e2e/domain-09-settings.spec.ts (may be modified)
- tests/agents/plans/ (new plans)
- tests/agents/generated/ (new agent specs)
- evidence/T-004/ (evidence artifacts)
- sprints.json (status update)

## Entry Gates

| Gate | Status | Evidence |
|------|--------|----------|
| A1: T-003 committed | PASS | 520dd07 |
| A2: dev.huminicdev.com healthy | PASS | Confirmed multiple times this session |

## Delegation

- Step 1: 4 planner subagents in parallel
- Step 2: 4 generator subagents in parallel
- Step 3: Ghost subagent
- Step 4: Healer if needed
- Step 5: Orchestrator evidence
