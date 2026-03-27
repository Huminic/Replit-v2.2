# Pre-Execution Report: R-015 — Navigation & UI Cleanup

**Sprint:** R-015
**Type:** Frontend fixes
**Date:** 2026-03-27
**Status:** AWAITING ENTRY GATE

## Objective
Fix navigation bugs and remove dev artifacts: Sales sidebar routing to wrong page, Tour overlay breaking sessions, TeamBox tabs not matching popout, Role Switcher dev tool still visible.

## Declared Files
- client/src/components/layout/Sidebar.tsx — I-136: fix Sales path
- client/src/components/layout/TopBar.tsx — I-148: remove Role Switcher (lines 389-420)
- client/src/pages/teambox.tsx — I-147: align top tabs with popout structure
- tests/e2e/s2-teambox.spec.ts — verify TeamBox tab fix

## Issues to Fix
| Issue | Description | Severity |
|---|---|---|
| I-136 | Sales sidebar button routes to /marketing instead of /sales | HIGH |
| I-137 | Tour Skip/Close navigates to /w/{slug}, destroying auth session | HIGH |
| I-147 | TeamBox top tabs show Conversations/Phone/Video but popout has SMS/Email/Phone/Video/Tasks | MEDIUM |
| I-148 | Role Switcher arrow (ArrowDownRight) is a dev tool, must be removed | MEDIUM |

## UI Changes
- Sidebar: Sales link corrected
- TopBar: Role Switcher dropdown removed
- TeamBox: top tab structure updated
- Tour: Skip/Close behavior fixed (dismiss without navigation)

## Test Plan
```
npx playwright test tests/e2e/s2-teambox.spec.ts --project=sprint --reporter=list --workers=1
npx playwright test tests/e2e/s7-system-profile.spec.ts --project=sprint --reporter=list --workers=1
```

## Diff Reference
No previous attempt for these issues.

---

## Entry Gate Verification

**Date:** 2026-03-26
**Verifier:** Ghost

| Check | Result |
|---|---|
| Pre-exec exists | YES |
| Objective stated | YES — fix I-136, I-137, I-147, I-148 |
| Issues listed | YES — I-136 (HIGH), I-137 (HIGH), I-147 (MED), I-148 (MED) |
| Declared files match sprints.json | YES — 4/4 match exactly |
| Worktree clean for declared files | YES — no uncommitted changes |
| Test plan present | YES |

**Note:** I-137 (Tour Skip/Close) is listed as an issue but has no dedicated declared file. Neither pre-exec nor sprints.json declares a tour component file. Dev should identify and declare the tour file before modifying it.

ENTRY GATE: APPROVED (with note on I-137 file coverage)
