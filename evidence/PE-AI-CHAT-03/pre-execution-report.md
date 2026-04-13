# PE-AI-CHAT-03 — Pre-Execution Report

**Date:** 2026-04-07
**Sprint:** PE-AI-CHAT-03 — AI Chat / Main Dashboard — Round 3
**Branch:** wave-pe3
**Scope:** client/src/pages/main.tsx
**Depends On:** SNP-001 (committed: 5da59b3)
**UI Permissions:** null (observation only)

---

## Objective

Evaluate the AI Chat and Main Dashboard for UI behavior, metric credibility, and drill-down truth. Prove or reject: chat behavior, scroll behavior, store switching, visible metrics, drill-downs, contact detail usefulness, and data plausibility.

## Acceptance Criteria

| AC | Description |
|----|-------------|
| AC1 | Section/page function map written in interface terms (not code terms) |
| AC2 | Chat response auto-scroll and rendering evaluated with evidence and commentary |
| AC3 | Store switching + metric plausibility evaluated with evidence and commentary |
| AC4 | Metric tiles + drill-down truth evaluated with evidence and commentary |
| AC5 | Contact detail actionability evaluated with evidence and commentary |
| AC6 | Every flow has evidence, commentary (8 questions), and result status |
| AC7 | Bugs logged with severity and false-pass classification |
| AC8 | Post-sprint confidence assessment (Data Accuracy, UI Behavior, Workflow Integrity, Overall) |

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
| F1 | Login + dashboard load | None | SAFE |
| F2 | AI Chat — send message, verify response, auto-scroll | Anthropic API | SAFE |
| F3 | Store switching — change store, verify metrics update | None | SAFE |
| F4 | Metric tiles — verify numbers, click drill-downs | None | SAFE |
| F5 | Drill-down truth — do modals show real data or empty shells? | None | SAFE |
| F6 | Contact detail — click a contact, verify actionable info | None | SAFE |
| F7 | Data plausibility — do metrics match drill-downs? Cross-reference | None | SAFE |

**Playwright commands:**
- `npx playwright test tests/pe-ai-chat-03/ --headed` (full suite)
- Each flow executed individually via MCP Playwright (one at a time per master prompt)

## Entry Gates

| Gate | Description | Status |
|------|-------------|--------|
| A1 | Governance sources read | READY |
| A2 | Scope limited to declared area | READY |
| A3 | User story gate satisfied | READY |
| A4 | Pre-execution report exists | THIS FILE |
| A5 | Irreversible actions identified | N/A (observation only) |
| A6 | Worktree clean | READY |
| A7 | Ghost messages clear | TO VERIFY |
| A8 | Sprint registered | DONE |
| A9 | Ghost Entry Gate | PENDING |

## Exit Gates (Ghost Checks)

| Gate | Description |
|------|-------------|
| B1 | All flows executed (no skipped use cases) |
| B2 | Evidence + commentary exist for every flow |
| B3 | Data plausibility documented |
| B4 | Drill-down truth assessed |
| B5 | Bugs logged per taxonomy |
| B6 | Remediation retests done (if any fixes applied) |
| B7 | Confidence assessment written |
| B8 | Code tests rerun if code changed |
| B9 | Exit review clear (enforcer checklist + cross-sign) |
| B10 | Ghost Exit Gate: EXIT GATE: CLEARED |

## What "Real E2E Test" Means for This Sprint

This sprint is primarily UI evaluation + data truth verification. The AI Chat flow involves the Anthropic API (real LLM response). All other flows verify that data displayed is truthful and internally consistent. No outbound comms triggered.

**Key question:** Are the dashboard metrics real numbers from real data, or are they placeholder/stale/wrong?

## Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI Chat API timeout | Can't evaluate chat behavior | Retry with shorter prompt, check API key |
| Metrics showing zero/null | Could be real or bug | Cross-reference with warehouse_leads count |
| Store switching doesn't change data | False pass | Compare metric values before/after switch |
| Drill-downs show empty modals | Could be "no data" or broken | Check multiple stores |

## Whole-Product Fit

Main dashboard is the trust anchor. If visibly wrong or data-untrustworthy, operator confidence collapses immediately.
