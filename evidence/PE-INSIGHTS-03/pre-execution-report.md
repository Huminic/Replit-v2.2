# PE-INSIGHTS-03 — Pre-Execution Report

**Date:** 2026-04-07
**Sprint:** PE-INSIGHTS-03 — Insights — Round 3
**Branch:** wave-pe3
**Scope:** client/src/pages/insights.tsx
**Depends On:** PE-SALES-03
**UI Permissions:** null (observation only)

---

## Objective

Evaluate Insights for graph population, modal usefulness, contact actions, and report credibility. Prove or reject: graphs, report cards, library cards, modals, contact affordances, and data clarity.

## Acceptance Criteria

| AC | Description |
|----|-------------|
| AC1 | Function map for dashboard/reports/library/modals written in interface terms |
| AC2 | Graph/card population vs failure vs empty evaluated with evidence and commentary |
| AC3 | Drill-down modal meaningfulness evaluated with evidence and commentary |
| AC4 | Contact-action affordances evaluated with evidence and commentary |
| AC5 | Unclear IDs/non-working actions documented with evidence |
| AC6 | Every flow has evidence, commentary (8 questions), and result status |
| AC7 | Bugs logged with severity and false-pass classification |

## Declared Files

- evidence/PE-INSIGHTS-03/pre-execution-report.md
- evidence/PE-INSIGHTS-03/section-function-map.md
- evidence/PE-INSIGHTS-03/use-case-inventory.md
- evidence/PE-INSIGHTS-03/acceptance-matrix.md
- evidence/PE-INSIGHTS-03/evidence-index.md
- evidence/PE-INSIGHTS-03/bug-log.md
- evidence/PE-INSIGHTS-03/post-sprint-report.md
- evidence/PE-INSIGHTS-03/enforcer-checklist.txt
- evidence/PE-INSIGHTS-03/cross-sign.md
- evidence/PE-INSIGHTS-03/workflow-audit.log

## Test Plan

| Flow | What to Test | Third-Party Systems | Classification |
|------|-------------|---------------------|----------------|
| F1 | Navigate to Insights, verify page loads (not redirect) | None | SAFE |
| F2 | Graph population — do graphs render with data or show empty/error? | None | SAFE |
| F3 | Report cards — verify each card shows meaningful data | None | SAFE |
| F4 | Library cards — verify library section populates | None | SAFE |
| F5 | Drill-down modals — click cards/graphs, verify modal content | None | SAFE |
| F6 | Contact actions — verify click-to-call, click-to-SMS affordances | None | SAFE |
| F7 | Tab switching — verify Activity, Reports, Library tabs work | None | SAFE |
| F8 | Date range / filters — verify data updates with filter changes | None | SAFE |

**Playwright commands:**
- `npx playwright test tests/pe-insights-03/ --headed` (full suite)
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
| B1-B10 | Standard eval exit gates |

## What "Real E2E Test" Means for This Sprint

Insights verifies analytical truth. "Real" means:
- Graphs plot actual communication data (calls, SMS, emails)
- Report cards show real metrics from provider activity
- Modals drill into actual records, not empty containers
- Contact actions link to real contacts

**Key question:** If a manager reviews Insights to judge team performance, will they get truthful analytics?

## Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| Page redirects to Settings (prev bug) | Can't evaluate | Verify SNP-001 fix deployed |
| Graphs render but data wrong | False pass | Cross-reference raw data |
| Modals show IDs instead of names | Usability failure | Document as bug |
| CSV export broken (prev bug) | Regression | Test if accessible |

## Whole-Product Fit

Insights influences operator judgment. Broken graphs or meaningless modals create silent false confidence.
