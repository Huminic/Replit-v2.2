# Pre-Execution Report: T-015 — RBAC, Isolation & Auth Flows

**Sprint:** T-015
**Type:** Security verification via Playwright MCP — multi-login cycles
**Date:** 2026-03-26
**Status:** AWAITING ENTRY GATE

## Objective

Prove no user can see another organization's data. Role-based access works. Org switcher reloads data. Password reset flow functions. Validates US-022, S-9.AC5/AC6.

## Declared Files

- `tests/e2e/s9-cross-cutting.spec.ts` — may add isolation assertions

## Acceptance Criteria

- T-015.AC1-AC5: Each of 5 org admins sees ONLY their org data
- T-015.AC6: Partner admin sees all 5 dealerships
- T-015.AC7: Partner admin does NOT see Huminic data
- T-015.AC8: Settings tiles per role (super=7, partner=7 read-only AI, org=6)
- T-015.AC9: Management redirects non-management roles
- T-015.AC10: Org switcher reloads all data for new org
- T-015.AC11: Forgot password triggers Resend email
- T-015.AC12: No assistantId resolution errors in PM2 logs

## UI Changes

None.

## Test Plan

### Method: Playwright MCP — 5 login cycles + role switching
```
# For each of 5 orgs: login → navigate key pages → text search for other org names
# For partner admin: login → verify 5 dealerships visible → search for "Huminic"
# For org switcher: login as partner → switch org → verify data changed
# Password reset: navigate /forgot-password, submit email, check Resend logs
```

## Diff Reference

No previous attempt.

---

## GHOST ENTRY GATE — T-015

**Date:** 2026-03-26
**Gate:** ENTRY

### Checks Performed

| # | Check | Result |
|---|-------|--------|
| A1 | SEC-08 exit gate cleared | PASS |
| A2 | Worktree clean (client/src/, server/, shared/) | PASS — no uncommitted changes |
| A4-A7 | Pre-exec report completeness | PASS — objective, ACs (12), test plan, declared files present |
| A8 | Declared files match sprints.json | PASS — `tests/e2e/s9-cross-cutting.spec.ts` consistent |

### Notes

- Test-only sprint. No production code changes expected.
- Dependency SEC-08 confirmed cleared.
- 12 acceptance criteria well-defined and testable via Playwright MCP.

ENTRY GATE: APPROVED
