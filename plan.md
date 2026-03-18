# Nexxus Connect v2.2 — Path to Launch

## Where We Are
- 68 sprints committed (through R-2)
- 24 open issues across 5 domains (BE, FE, IN, DT, AU)
- 51 backlog items
- 96 Playwright tests created, 46 passing
- 60 screenshots captured across 5 roles
- File reorganization, acceptance criteria audit, full test run, and refactoring scan complete

## What's Left

| # | Sprint | What | Status |
|---|--------|------|--------|
| 1 | ~~AC-1~~ | ~~Audit acceptance criteria + create Playwright tests~~ | DONE (e249b69) |
| 2 | ~~T-2~~ | ~~Full application test~~ | DONE (a9696e3) |
| 3 | ~~R-2~~ | ~~Refactoring scan~~ | DONE (6667c2e) |
| 4 | **REM-1 Prep** | **Loop prep document — map issues to domains, tests, criteria, files** | NEXT |
| 5 | REM-1 | Remediation sub-sprints (IN → DT → AU → BE → FE) | — |
| 6 | T-3 | Full application test — post-remediation | — |
| | | *Loop: if issues remain → REM-n+1 prep → REM-n+1 → T-n+1* | |
| | | *Exit loop when: all tests pass + no MAJOR issues* | |
| 7 | L5-1 | User walkthrough (UI frozen at this point) | — |
| 8 | LAUNCH-S0 | Infrastructure (Coolify, env vars, Caddy, widget JS) | — |
| 9 | LAUNCH-S1 | Smoke test at production URL | — |
| 10 | LAUNCH-S2 | User sign-off | — |

## The Loop

Each remediation cycle follows this pattern:

```
Loop Prep → REM sub-sprints (IN → DT → AU → BE → FE) → T-n retest → evaluate
  ↓                                                                      ↓
  issues.md                                                     all pass? → L5
  tests mapped                                                  issues remain? → next loop
  files declared
  order set
  prerequisites cleared
```

The Loop Prep Document (see harness.md) must be completed before any code work starts. It maps every open issue to its domain sub-sprint, its Playwright test, its acceptance criterion, and its file declarations.

## Open Issues by Domain (for REM-1)

| Domain | Count | Issues |
|--------|-------|--------|
| BE | 9 | I-036, I-037, I-040, I-041, I-042, I-044, I-050, I-054, I-060 |
| FE | 6 | I-043, I-047, I-055, I-056, I-057, I-058, I-059 |
| IN | 3 | I-038, I-048, I-051 |
| DT | 2 | I-049, I-052 |
| AU | 1 | I-053 |

## Rules
- UI must not be modified without explicit user approval
- Once tests pass, no frontend changes unless user is actively supervising
- Loop Prep Document required before every REM sprint
- Test infrastructure fixes (TI-xxx) included in the appropriate sub-sprint

---

**Last updated:** 2026-03-18
