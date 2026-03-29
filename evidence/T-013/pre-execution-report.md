# Pre-Execution Report: T-013 — Navigation, UI & Mobile

**Sprint:** T-013
**Type:** UI verification via Playwright MCP — no code changes expected
**Date:** 2026-03-26
**Status:** ENTRY GATE APPROVED

## Objective

Prove every user can navigate the entire application without dead links, mismatched labels, or console errors on desktop and mobile viewports. Validates US-018, US-020, I-125.

## Declared Files

- `tests/e2e/s7-system-profile.spec.ts` — may add navigation assertions
- `tests/e2e/s1-ai-chat.spec.ts` — may add navigation assertions

## Acceptance Criteria

- T-013.AC1: Every popout/sub-menu link navigates to correct page/tab
- T-013.AC2: TopBar shows "Reset Tour"
- T-013.AC3: TopBar profile dropdown has NO Billing link
- T-013.AC4: My Work NOT in sidebar
- T-013.AC5: Service sub-menu first item is "Campaigns"
- T-013.AC6: Marketing sub-menu has NO "Campaigns", single agent section
- T-013.AC7: Manage sub-menu has 5 items
- T-013.AC8: Campaign Safety dismiss persists on reload
- T-013.AC9: Campaign action tooltips show on hover
- T-013.AC10: Widget shows "Instant Call Back" with phone input
- T-013.AC11: No console errors on any page
- T-013.AC12: Mobile viewport (375x812) — key pages render without overflow

## UI Changes

None expected — verification sprint.

## Test Plan

### Method: Playwright MCP against dev.huminicdev.com

### Exact commands:
```
# Playwright MCP browser navigation — click each link, capture result
# Console capture on every page load
# Mobile viewport resize to 375x812
```

## Diff Reference

No previous attempt.

---

## GHOST ENTRY GATE — T-013

**Date:** 2026-03-26
**Evaluator:** Ghost (verification agent)

| Check | Description | Result |
|-------|-------------|--------|
| A1 | Previous sprint (SEC-08) exit gate cleared | PASS |
| A2 | Worktree clean (client/src/, server/, shared/) | PASS |
| A3 | Session state — no stale context | PASS |
| A4 | Pre-exec report exists with clear objective | PASS |
| A5 | Acceptance criteria defined (12 ACs) | PASS |
| A6 | Test plan present (Playwright MCP) | PASS |
| A7 | Diff reference present | PASS |
| A8 | Declared files vs sprints.json | ADVISORY |
| A9 | UI changes section — none expected | PASS |
| A10 | Ghost messages — none outstanding | PASS |

**A8 Advisory:** Pre-exec declares 2 test files (`s7-system-profile.spec.ts`, `s1-ai-chat.spec.ts`); sprints.json declares only 1 (`s7-system-profile.spec.ts`). Non-blocking for a verification sprint where test file changes are optional ("may add"). Recommend Captain sync sprints.json declaredFiles to match pre-exec.

**Verdict:** ENTRY GATE APPROVED (9/10 PASS, 1 ADVISORY)

Dev is cleared to begin T-013 execution.
