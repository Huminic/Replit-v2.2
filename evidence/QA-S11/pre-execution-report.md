# Pre-Execution Report: QA-S11

Timestamp: 2026-03-15T23:05:42Z
Sprint: QA-S11 — Authenticated testing: Campaigns + Conversations (L2/L3)

## Checks
| ID | Check | Result |
|----|-------|--------|
| PRE-01 | QA-S10 committed | PASS (551a3a9) |
| PRE-02 | App running | PASS |
| PRE-03 | Test credentials working | PASS |
| PRE-04 | On local-dev branch | PASS |
| PRE-05 | Evidence directory created | PASS |
| PRE-06 | Dual agent approach | PASS |
| PRE-08 | User stories defined | PASS (Domains 4+5 collected) |

## User Stories Under Test

### Domain 4: Campaigns
US-1: Everyone can execute service campaigns (for now)
US-2: Campaigns only under Service currently
US-3: Flow: Create → upload CSV → preview → (delete/re-upload if bad) → execute → monitor → stop
US-4: Kill switch message: "All outbound communication is currently disabled. Please see the system admin or wait a few minutes and try again."

### Domain 5: Conversations / TeamBox
US-5: TeamBox is universal inbox (email, SMS, voice transcripts)
US-6: Filters: by team, by user, by message type
US-7: Takeover stops AI, parks as human-only thread
US-8: Users see their role's conversations, org admin+ sees all
US-9: My Work shows own messages only
US-10: Filter by area (cross-role) is org admin+ only

## Status: READY TO TEST
