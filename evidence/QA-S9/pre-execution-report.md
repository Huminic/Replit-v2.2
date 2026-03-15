# Pre-Execution Report: QA-S9

Timestamp: 2026-03-15T01:00:00Z
Sprint: QA-S9 — Authenticated testing: Auth flows (L2/L3)

## Checks
| ID | Check | Result |
|----|-------|--------|
| PRE-01 | FIX-S0 committed | PASS (634e695) |
| PRE-02 | App running | PASS |
| PRE-03 | Test credentials working | PASS (6 roles verified) |
| PRE-04 | On local-dev branch | PASS |
| PRE-05 | Evidence directory created | PASS |
| PRE-06 | Dual agent approach | PASS (plan precaution #6) |
| PRE-07 | Report logged | PASS |
| PRE-08 | User stories defined | PASS (Domain 1 collected from user) |

## User Stories Under Test

US-1: All users land on main chat page after login (role-specific metrics + menu icons)
US-2: Wrong credentials show "invalid username or password" with a link to reset password
US-3: Logout returns to login screen
US-4: Sales/Marketing/Service do NOT see Management or Settings in left menu
US-5: Super Admin/Partner Admin/Org Admin DO see Management and Settings
US-6: Super Admin can switch orgs (test as-is, flat model)
US-7: Sales/Marketing/Service cannot switch orgs

## RBAC Spec
| Role | Org Switching | Menu Access |
|------|--------------|-------------|
| Super Admin | All orgs | Everything |
| Partner Admin | Own companies | Everything |
| Org Admin | Member orgs | Everything |
| Sales | No | All except Management, Settings |
| Marketing | No | All except Management, Settings |
| Service | No | All except Management, Settings |

## Status: READY TO TEST
