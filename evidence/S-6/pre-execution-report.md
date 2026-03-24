# Pre-Execution Report: S-6 — Manage

**Sprint:** S-6
**Type:** UI restructure + Billing tab + User Chats + multi-store test
**Date:** 2026-03-24
**Status:** READY

## Objective

Remove Dashboard and ROI tabs from Manage page, add Billing tab (import BillingDashboard component), verify Insights and User Chats tabs, remove Billing from Profile, test multi-store oversight for partner admin.

## Declared Files

- `client/src/pages/management.tsx` — remove Dashboard+ROI tabs, add Billing tab, verify Insights/User Chats
- `client/src/pages/profile.tsx` — remove Billing tab/section
- `tests/e2e/s6-manage.spec.ts` — new test file

## UI Changes

DECLARED:
- Dashboard tab REMOVED from Manage page
- ROI tab REMOVED from Manage page
- Billing tab ADDED to Manage page (imports BillingDashboard component)
- Billing link/section REMOVED from Profile page

## Acceptance Criteria (from sprints.json)

| ID | Criterion | Component | Evidence |
|----|-----------|-----------|----------|
| S-6.AC1 | No "Dashboard" tab and no "ROI" tab on Manage page | S-6.1 | Code review |
| S-6.AC2 | Billing tab present on Manage page | S-6.2 | Code review |
| S-6.AC3 | Billing NOT in Profile page | S-6.2 | Code review (negative) |
| S-6.AC4 | Insights tab renders with real data | S-6.3 | API assertion |
| S-6.AC5 | User Chats tab lists staff AI conversations | S-6.4 | API assertion |
| S-6.AC6 | User Chats filter by user works | S-6.4 | API assertion |
| S-6.AC7 | Partner admin (Cage) sees all 5 dealerships | S-6.5 | API assertion |
| S-6.AC8 | Partner admin does NOT see Huminic data | S-6.5 | API assertion (negative) |
| S-6.AC9 | System Log shows real activity entries | S-6.6 | API assertion |

## Test Plan

### New test file:
- `tests/e2e/s6-manage.spec.ts`

### Test sections:

1. **No Dashboard/ROI tabs (AC1)** — grep management.tsx for dashboard/roi tab ids, assert not found
2. **Billing tab (AC2)** — grep management.tsx for billing tab id and BillingDashboard import
3. **No Billing in Profile (AC3)** — grep profile.tsx for billing tab/link, assert not found
4. **Insights data (AC4)** — GET /api/metrics/dashboard, assert real values
5. **User Chats (AC5)** — GET /api/conversations?channel=ai-chat, assert array with conversations
6. **User Chats filter (AC6)** — verify channel filter returns only ai-chat conversations
7. **Multi-store (AC7)** — login as duanekwells@gmail.com (partner admin on Cage), GET /api/organizations, assert 5 dealerships visible
8. **No Huminic (AC8)** — same login, assert no org named "Huminic" in response
9. **System Log (AC9)** — GET /api/activity-log, assert array with entries

### Exact commands:
```
npx playwright test tests/e2e/s6-manage.spec.ts --project=sprint --reporter=list --workers=1
```

### Implementation approach:
1. Dispatch builder for management.tsx (remove Dashboard+ROI, add Billing) and profile.tsx (remove Billing)
2. Write s6-manage.spec.ts
3. Run tests

## Ghost Entry Gate
**Reviewed by:** ghost-agent
**Timestamp:** 2026-03-24T08:23:01Z
**Sprint:** S-6
**A1 Previous cleared:** PASS (S-5 EXIT GATE: CLEARED)
**A2 Worktree:** clean
**A3 Session state:** PASS (references S-6)
**A4 Pre-exec exists:** PASS
**A5 Objective:** PASS
**A6 Test Plan:** PASS (1 npx command)
**A7 Declared Files:** PASS (management.tsx, profile.tsx, test file)
**A8 Match check:** MATCH (2 app files, 6 components, 9 ACs)
**A9 UI permissions:** PASS (DECLARED — Dashboard+ROI removed, Billing added, Billing removed from Profile)
**A10 Ghost messages:** PASS (clear)
**ENTRY GATE: APPROVED**
