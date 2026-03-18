# Nexxus Connect v2.2 — Path to Launch

## Where We Are
- 63 sprints committed through I-039 (MCP routing)
- 3 open issues (I-036, I-037, I-038) — all tagged with domains
- File reorganization and governance restructure complete
- No Playwright test files exist yet — all prior testing was ad hoc

## What's Left

| # | Sprint | What |
|---|--------|------|
| 1 | AC-1 | Audit acceptance criteria + create Playwright test files by domain |
| 2 | T-2 | Full application test (autonomous) — comms + usability in one pass |
| 3 | R-2 | Refactoring scan — findings go to issues.md with domain tags |
| 4 | REM-1 | Remediation sprint with domain sub-sprints: |
| | REM-1-FE | Frontend — UI, pages, forms, client logic |
| | REM-1-BE | Backend — APIs, business rules, services, integrations |
| | REM-1-DT | Data — schema, database, migrations, reporting data |
| | REM-1-AU | Auth/Security — login, permissions, security controls |
| | REM-1-IN | Infrastructure — deploys, environments, monitoring, scaling |
| 5 | T-3 | Full application test (autonomous) — post-remediation |
| | | *Loop T/REM until all tests pass* |
| 6 | L5-1 | User walkthrough |
| 7 | LAUNCH-S0 | Infrastructure (Coolify, env vars, Caddy, widget JS) |
| 8 | LAUNCH-S1 | Smoke test at production URL |
| 9 | LAUNCH-S2 | User sign-off |

## Dependencies
- AC-1 must complete before T-2 (tests need to exist before they can run)
- T-2 must complete before R-2 (test findings inform refactoring priorities)
- R-2 must complete before REM-1 (all findings consolidated before fixing)
- REM-1 must complete before T-3 (fixes must be in place before re-test)
- T-3 and REM loop until all tests pass
- L5-1 runs only after tests pass — UI is frozen at this point
- LAUNCH sprints run after L5-1

## Rules
- UI (client/src/pages/, client/src/components/) must not be modified without explicit user approval
- Once the test suite passes, no frontend changes permitted unless user is actively supervising
- Issues found during testing get domain tags (FE/BE/DT/AU/IN) and go to issues.md
- Remediation work is clustered by domain — one sub-sprint per domain

---

**Last updated:** 2026-03-18
