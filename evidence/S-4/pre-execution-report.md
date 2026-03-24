# Pre-Execution Report: S-4 — Service

**Sprint:** S-4
**Type:** UI restructure + campaign CRUD + agent instructions + functional tests
**Date:** 2026-03-24
**Status:** READY

## Objective

Restructure Service page tabs (Campaigns first, remove Dashboard), enhance campaign CRUD with prominent buttons and detail dialog, move KPI tiles to Insights tab, write Nancy Gaston instructions, verify campaign e2e flow, recall notification, after-hours queueing.

## Declared Files

- `client/src/pages/service.tsx` — tab restructure, campaign enhancements, detail dialog, Insights tab
- `tests/e2e/s4-service.spec.ts` — new test file

## UI Changes

DECLARED:
- Tabs reordered: Campaigns (pos 1) | Agents | Insights | Calendar
- Dashboard tab REMOVED entirely
- "New Campaign" button made prominent (visible without scrolling)
- CSV Upload button made prominent (not just per-row icon)
- Campaign detail dialog added (click row → full details)
- Insights tab shows KPI tiles moved from old Dashboard

## Acceptance Criteria (from sprints.json)

| ID | Criterion | Component | Evidence |
|----|-----------|-----------|----------|
| S-4.AC1 | Campaigns tab is in position 1 (first tab) | S-4.1 | Code review |
| S-4.AC2 | No "Dashboard" tab exists on service page | S-4.1 | Code review (negative) |
| S-4.AC3 | "New Campaign" button visible without scrolling | S-4.2 | Code review |
| S-4.AC4 | CSV Upload button prominent | S-4.2 | Code review |
| S-4.AC5 | Campaign detail dialog: click row → shows all fields | S-4.3 | Code review |
| S-4.AC6 | Insights tab shows KPI tiles (moved from old Dashboard) | S-4.4 | Code review |
| S-4.AC7 | Only Nancy Gaston visible on Agents tab | S-4.5 | API assertion |
| S-4.AC8 | Nancy Gaston has non-empty instructions in DB | S-4.6 | Query proof |
| S-4.AC9 | Campaign create → CSV → execute → SMS delivered | S-4.8 | IRREVERSIBLE — owner phone only, verify outbound_log |
| S-4.AC10 | Customer reply creates TeamBox conversation with campaignId | S-4.8 | Query proof |
| S-4.AC11 | Nancy responds to recall question intelligently | S-4.9 | Conversation log |
| S-4.AC12 | Nancy books appointment when asked | S-4.10 | Conversation log |
| S-4.AC13 | After-hours: message queued when outside business hours | S-4.11 | Log proof |
| S-4.AC14 | After-hours: queued message mechanism exists | S-4.11 | Code proof |
| S-4.AC15 | Service Insights: every KPI tile matches API | S-4.7 | Documented table |

## Test Plan

### New test file to write:
- `tests/e2e/s4-service.spec.ts`

### Test sections:

1. **Tab structure (AC1/AC2)** — grep service.tsx for tab definitions, assert first tab is "Campaigns", no tab named "Dashboard"
2. **Campaign buttons (AC3/AC4)** — grep service.tsx for "New Campaign" button and CSV upload button in prominent position
3. **Detail dialog (AC5)** — grep service.tsx for dialog/modal component triggered by row click
4. **Insights tab (AC6)** — grep service.tsx for Insights tab content with KPI tiles
5. **Service agents (AC7)** — GET /api/agents?department=service as serra_honda, assert only Nancy Gaston
6. **Nancy instructions (AC8)** — GET /api/agents, find Nancy Gaston, assert instructions length > 100
7. **Campaign CRUD via API (AC9 partial)** — POST /api/campaigns to create, POST upload-csv with owner's number, verify recipient count. Execute with dryRun=true to verify the path works. NOTE: dryRun=false is IRREVERSIBLE — test verifies the code path exists, actual send was verified in VERIFY-ALL comms circuit.
8. **Campaign reply (AC10)** — Check existing conversations for any with campaignId set (from earlier VERIFY-ALL tests)
9. **Nancy quality — recall (AC11)** — Chat with Nancy: "What recalls are active for Serra Honda?" Assert relevant response
10. **Nancy quality — appointment (AC12)** — Chat with Nancy: "I need to schedule an oil change for next Tuesday" Assert response references scheduling/appointment
11. **After-hours code (AC13/AC14)** — grep sms.ts for after-hours logic, assert businessHoursStart/businessHoursEnd checks exist. Verify scheduledActions mechanism in code.
12. **Service Insights tiles (AC15)** — GET /api/metrics/dashboard as serra_honda, document campaign stats

### Existing test files to run:
- `tests/e2e/domain-04-campaigns.spec.ts` (may fail on localhost)
- `tests/e2e/domain-06-departments.spec.ts` (may fail on localhost)

### Exact commands:
```
npx playwright test tests/e2e/s4-service.spec.ts --project=sprint --reporter=list --workers=1
```

### Known risks:
- AC9: Real campaign execution is IRREVERSIBLE. Test uses dryRun=true to verify the path. Actual SMS delivery was verified in VERIFY-ALL comms circuit test (campaign execute with owner's number — PASS).
- AC11/AC12: Nancy Gaston instructions need to be written in S-4.6 before quality tests can pass. Will write instructions via PATCH API.
- AC13/AC14: After-hours behavior tested via code review (business hours logic in sms.ts). Live test was done in VERIFY-ALL comms circuit.

### Implementation approach:
1. Dispatch builder sub-agent for service.tsx UI restructure (S-4.1 through S-4.5)
2. Write Nancy Gaston instructions via API (S-4.6)
3. Write s4-service.spec.ts
4. Run tests

## Ghost Entry Gate
**Reviewed by:** ghost-agent
**Timestamp:** 2026-03-24T07:50:39Z
**Sprint:** S-4
**A1 Previous cleared:** PASS (S-3 EXIT GATE: CLEARED)
**A2 Worktree:** clean
**A3 Session state:** PASS (references S-4)
**A4 Pre-exec exists:** PASS
**A5 Objective:** PASS
**A6 Test Plan:** PASS (1 npx command for s4-service.spec.ts)
**A7 Declared Files:** PASS (service.tsx + test file)
**A8 Match check:** MATCH (1 app file, 11 components, 15 ACs)
**A9 UI permissions:** PASS (DECLARED — UI Changes section present with tab restructure details)
**A10 Ghost messages:** PASS (clear)
**ENTRY GATE: APPROVED**
