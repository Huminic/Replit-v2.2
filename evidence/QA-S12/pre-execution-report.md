# Pre-Execution Report: QA-S12

Timestamp: 2026-03-15T23:33:03Z
Sprint: QA-S12 — Authenticated testing: Dashboard, Dept views, Analytics (L2/L3)

## Checks
| ID | Check | Result |
|----|-------|--------|
| PRE-01 | QA-S11 committed | PASS (1e976c5) |
| PRE-02 | App running | PASS |
| PRE-03 | Test credentials working | PASS |
| PRE-04 | On local-dev branch | PASS |
| PRE-05 | Evidence directory created | PASS |
| PRE-06 | Dual agent approach | PASS |
| PRE-08 | User stories defined | PASS (Domains 2, 6, 7 collected) |

## User Stories Under Test

### Domain 2: Dashboard / Main View
US-1: Metrics are role-specific (system decides by role, Sales sees everything)
US-2: Left popout shows chat history + favorites, NOT agents
US-3: No right popout on main page
US-4: Metrics centered with main chat window below

### Domain 6: Department Dashboards
US-5: Sales dashboard is the reference — keep as-is
US-6: Other depts: same UI, hand-picked metrics relevant to that role
US-7: No dynamic filters

### Domain 7: Analytics / Insights
US-8: Insights UI as-is is the model
US-9: Hunches: weekly AI suggestions for management
US-10: Role-filtered (Sales unfiltered, others show relevant metrics)
US-11: "Pin to dashboard" function from Replit — verify if present (MUST BE REMOVED)

## Status: READY TO TEST
