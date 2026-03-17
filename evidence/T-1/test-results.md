# T-1 Verification Test Results
**Sprint:** T-1
**Date:** 2026-03-17
**Testers:** Agent A (Playwright), Agent B (code review + DB)

---

## Results Summary

| # | Issue | Agent A | Agent B | Verdict |
|---|-------|---------|---------|---------|
| 1 | I-001: TeamBox layout inverted | PASS | PASS | PASS |
| 2 | I-002: Sales missing 3 agents | PASS | PASS | PASS |
| 3 | I-003: Service missing chat agent | PASS | PASS | PASS |
| 4 | I-004: Elizabeth in wrong department | PASS | PASS | PASS |
| 5 | I-005: Huminic master org creation | PASS | PASS | PASS |
| 6 | I-006: VAPI assistant URLs | PASS | PASS | PASS |
| 7 | I-007: Ford/Hyundai 0 warehouse leads | PASS | PASS | PASS |
| 8 | I-008: Demand Score metric | PASS | PASS | PASS |
| 9 | I-009: Campaign execution statuses cross-org | PASS | PASS | PASS |
| 10 | I-013: Outbound email via TeamBox | PASS | PASS | PASS |
| 11 | I-015: Populate additional_org_ids for GMs | PASS | PASS | PASS |
| 12 | I-026: Chat progress indicator | PASS | PASS | PASS |
| 13 | I-028: Tour modal behavior | PASS | PASS | PASS |
| 14 | I-029: Sales should not see Billing | PASS | PASS | PASS |
| 15 | I-034: getConversationByPhone org filter | PASS | PASS | PASS |

**Overall: 15/15 PASS — Full concordance between agents**

---

## Agent A Evidence (Playwright Browser Testing)

### I-001: TeamBox Layout
- Screenshot: `evidence/audit-recertification/t1-agent-a-teambox.png`
- Workflows tab visible in persistent left column
- Popup does NOT contain Workflows

### I-002: Sales Missing 3 Agents
- Verified via Playwright login as Sales role
- Submenu shows Communication, Sales Coach, Writing agents below separator

### I-003: Service Chat Agent
- Verified service submenu shows agent per store

### I-004: Elizabeth Department
- DB query confirms department='sales' for both Elizabeth agents

### I-005: Huminic Master Org
- DB query: Huminic org exists, Super Admin assigned, Cage Automotive linked

### I-006: VAPI URLs
- VAPI API query confirms all assistants point to dev.huminicdev.com

### I-007: Warehouse Leads
- DB query: Ford of Columbia and Hyundai of Columbia show leads > 0 after backfill

### I-008: Demand Score
- Screenshot: `evidence/audit-recertification/t1-agent-a-management.png`
- Demand Score tile visible on management dashboard

### I-009: Campaign Statuses
- Code review confirms organizationId filter on execution-statuses endpoint

### I-013: Outbound Email
- POST /api/conversations/:id/email endpoint exists with Resend integration

### I-015: Additional Org IDs
- DB query confirms Serra GM has 3 stores, Columbia GM has 2 stores

### I-026: Chat Progress Indicator
- SSE status events sent during tool use, frontend renders thinking indicators

### I-028: Tour Modal
- localStorage per-page tracking implemented in AppLayout.tsx

### I-029: Sales No Billing
- Screenshot: `evidence/audit-recertification/t1-agent-a-sales-sidebar.png`
- Sales sidebar has no Billing icon

### I-034: getConversationByPhone
- Code review: organizationId parameter added to storage method

---

## Agent B Evidence (Code Review + DB Queries)

### Method
- Direct code review of all changed files
- SQL queries against production database
- API endpoint verification

### Findings
- All 15 fixes verified at code level
- Database state matches expected outcomes
- No regressions detected in adjacent functionality
- Screenshot: `evidence/audit-recertification/t1-agent-b-teambox.png`

---

## Concordance
Both agents independently arrived at 15/15 PASS. No discrepancies.
