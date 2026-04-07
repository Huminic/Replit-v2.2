# PE-SALES-03 — Pre-Execution Report

**Date:** 2026-04-07
**Sprint:** PE-SALES-03 — Sales Dashboard — Round 3
**Branch:** wave-pe3
**Scope:** client/src/pages/sales.tsx
**Depends On:** PE-TEAMBOX-03
**UI Permissions:** null (observation only)

---

## Objective

Evaluate the Sales Dashboard for metric plausibility, store context, popout truth, and trigger visibility. Prove or reject: visible metrics, popouts, recent activity alignment, configuration truth, and store-context credibility.

## Acceptance Criteria

| AC | Description |
|----|-------------|
| AC1 | Function map for dashboard/popouts/configuration written in interface terms |
| AC2 | Store selection + metric plausibility evaluated with evidence and commentary |
| AC3 | Popout/config surfaces vs acceptance intent evaluated (including extra cost info) |
| AC4 | Metrics vs recent activity/drill-down truth evaluated with evidence and commentary |
| AC5 | Trigger config/channel visibility evaluated with evidence and commentary |
| AC6 | Every flow has evidence, commentary (8 questions), and result status |
| AC7 | Bugs logged with severity and false-pass classification |

## Declared Files

1. pre-execution-report.md (this file)
2. section-function-map.md
3. use-case-inventory.md
4. acceptance-matrix.md
5. evidence-index.md
6. bug-log.md
7. post-sprint-report.md
8. enforcer-checklist.txt
9. cross-sign.md
10. workflow-audit.log

## Test Plan

| Flow | What to Test | Third-Party Systems | Classification |
|------|-------------|---------------------|----------------|
| F1 | Navigate to Sales, verify dashboard loads with metrics | None | SAFE |
| F2 | Store selection — switch stores, verify metrics change | None | SAFE |
| F3 | Metric tiles — verify numbers are plausible | None | SAFE |
| F4 | Popout panels — click each metric, verify drill-down shows real data | None | SAFE |
| F5 | Recent activity — verify alignment with metric totals | None | SAFE |
| F6 | Trigger configuration — verify trigger list, channel assignments | None | SAFE |
| F7 | Caroline's trigger setup — verify SMS/voice/email triggers visible | None | SAFE |
| F8 | Extra cost info — verify cost information surfaces correctly | None | SAFE |

**Playwright commands:**
- `npx playwright test tests/pe-sales-03/ --headed` (full suite)
- Each flow executed individually via MCP Playwright (one at a time per master prompt)

## Entry Gates

| Gate | Description | Status |
|------|-------------|--------|
| A1-A4 | Standard entry gates | READY / THIS FILE |
| A5 | Irreversible actions | N/A (observation only) |
| A6-A9 | Worktree, ghost | PENDING |

## Exit Gates (Ghost Checks)

| Gate | Description |
|------|-------------|
| B1-B10 | Standard eval exit gates (all flows, evidence, commentary, plausibility, bugs, confidence, enforcer, cross-sign, ghost) |

## What "Real E2E Test" Means for This Sprint

Sales dashboard verifies data truth. "Real" means:
- Metrics reflect actual VIN Solutions lead counts
- Popouts show real leads, not empty containers
- Trigger configs reflect actual Caroline triggers (SMS via +18338935694, voice via VAPI)
- Recent activity matches what actually happened

**Key question:** If a sales manager looks at this dashboard, will they see truthful numbers they can act on?

## Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| Metrics show zeros | Could be real or broken | Cross-reference with warehouse_leads |
| Popouts empty | Drill-down broken or no data | Test with Serra Honda (most data) |
| Trigger config wrong channels | Operator misinformed | Compare with business-context.md |
| Store switch doesn't refresh | False pass — stale data | Compare values before/after |

## Whole-Product Fit

High-credibility management surface. Wrong metrics or misleading popouts create immediate trust loss.
