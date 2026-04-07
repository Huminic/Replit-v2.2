# PE-SETTINGS-03 — Pre-Execution Report

**Date:** 2026-04-07
**Sprint:** PE-SETTINGS-03 — Settings / Users / Notifications — Round 3
**Branch:** wave-pe3
**Scope:** client/src/pages/settings.tsx
**Depends On:** PE-INTEGRATIONS-03
**UI Permissions:** null (observation only)

---

## Objective

Evaluate Settings for invite truth, config clarity, and system usefulness. Prove or reject: invite flows, notification behavior, config clarity, downstream implications, and navigation behavior.

## Acceptance Criteria

| AC | Description |
|----|-------------|
| AC1 | Function map for Settings subsections written in interface terms |
| AC2 | User invite/add-user flow truth evaluated with evidence and commentary |
| AC3 | Notification/tool-config usefulness + downstream implications evaluated |
| AC4 | Route-vs-inline navigation behavior evaluated with evidence |
| AC5 | Every flow has evidence, commentary (8 questions), and result status |
| AC6 | Bugs logged with severity and false-pass classification |

## Declared Files

- evidence/PE-SETTINGS-03/pre-execution-report.md
- evidence/PE-SETTINGS-03/section-function-map.md
- evidence/PE-SETTINGS-03/use-case-inventory.md
- evidence/PE-SETTINGS-03/acceptance-matrix.md
- evidence/PE-SETTINGS-03/evidence-index.md
- evidence/PE-SETTINGS-03/bug-log.md
- evidence/PE-SETTINGS-03/post-sprint-report.md
- evidence/PE-SETTINGS-03/enforcer-checklist.txt
- evidence/PE-SETTINGS-03/cross-sign.md
- evidence/PE-SETTINGS-03/workflow-audit.log

## Test Plan

| Flow | What to Test | Third-Party Systems | Classification |
|------|-------------|---------------------|----------------|
| F1 | Navigate to Settings, verify subsections load | None | SAFE |
| F2 | User list — verify users displayed for current org | None | SAFE |
| F3 | Invite/add-user flow — verify form, validation, invite send | Resend (if email sent) | GATED/IRREVERSIBLE |
| F4 | Notification settings — verify toggle behavior, clarity | None | SAFE |
| F5 | Tool configuration — verify config surfaces, downstream effects | None | SAFE |
| F6 | Route navigation — verify subsection switching (inline vs route) | None | SAFE |
| F7 | RBAC enforcement — verify role-appropriate access | None | SAFE |

**Playwright commands:**
- `npx playwright test tests/pe-settings-03/ --headed` (full suite)
- Each flow executed individually via MCP Playwright (one at a time per master prompt)

**Note:** F3 invite flow may trigger real email via Resend — requires operator approval if it sends.

## Entry Gates

| Gate | Description | Status |
|------|-------------|--------|
| A1-A4 | Standard entry gates | READY / THIS FILE |
| A5 | Irreversible actions | F3 may send email — needs approval |
| A6-A9 | Worktree, ghost | PENDING |

## Exit Gates (Ghost Checks)

| Gate | Description |
|------|-------------|
| B1-B10 | Standard eval exit gates |
| B8-special | Cross-sign.md exists with verdict: approved and different reviewing role |

## What "Real E2E Test" Means for This Sprint

Settings verifies configuration truth. "Real" means:
- Invite flow actually sends an email (or clearly doesn't if CommGate blocks)
- Notification toggles actually affect downstream behavior
- Tool configs reflect actual system state
- RBAC limits what each role can see/do

**Key question:** If an admin changes a setting, does it actually take effect downstream?

## Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| Invite sends real email | Unintended outbound | Get operator approval for F3 |
| Config changes affect production | Unintended side effects | Observation only — don't change configs |
| RBAC not enforced | Security gap | Test with multiple role accounts |
| Settings silently invalidate workflows | High leverage bugs | Document downstream implications |

## Whole-Product Fit

Settings defects are high leverage because they can silently invalidate downstream workflows. A misconfigured notification or broken invite flow cascades into operational failures.
