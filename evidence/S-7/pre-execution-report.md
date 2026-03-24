# Pre-Execution Report: S-7 — System + Profile + Top Icons

**Sprint:** S-7
**Type:** Minor UI fixes + verification + investigation
**Date:** 2026-03-24
**Status:** READY

## Objective

Verify 8 settings sections render, rename "Take Tour"/"Restart Tour" to "Reset Tour" in Profile, confirm Billing removed from Profile (done in S-6), fix landing page icon to open new window, investigate Activity Feed vs Notifications overlap.

## Declared Files

- `client/src/pages/settings.tsx` — verify 8 sections, CommGate toggle
- `client/src/pages/profile.tsx` — rename tour button to "Reset Tour"
- `client/src/components/layout/AppLayout.tsx` — landing page icon (parent component)
- `client/src/components/layout/TopBar.tsx` — landing page icon target=new window (actual location)
- `tests/e2e/s7-system-profile.spec.ts` — new test file

## UI Changes

DECLARED:
- "Take Tour" or "Restart Tour" renamed to "Reset Tour" in Profile
- Billing link/section already removed from Profile in S-6 (verify still gone)
- Landing page icon target changed to open new browser window

## Acceptance Criteria (from sprints.json)

| ID | Criterion | Component | Evidence |
|----|-----------|-----------|----------|
| S-7.AC1 | All 8 settings sections render | S-7.1 | Code review |
| S-7.AC2 | No agents in settings page popout | S-7.1 | Code review |
| S-7.AC3 | CommGate toggle works in Organization settings | S-7.1 | API assertion |
| S-7.AC4 | "Reset Tour" button text displayed | S-7.2 | Code review |
| S-7.AC5 | No Billing link/section in Profile page | S-7.3 | Code review (negative) |
| S-7.AC6 | Landing page icon opens new browser window | S-7.4 | Code review |
| S-7.AC7 | Activity Feed vs Notifications investigation documented | S-7.5 | Investigation report |

## Test Plan

### New test file:
- `tests/e2e/s7-system-profile.spec.ts`

### Test sections:

1. **8 settings sections (AC1)** — GET /api/settings or grep settings.tsx for 8 section tiles
2. **No agents in settings (AC2)** — grep settings.tsx popout/submenu for agent references
3. **CommGate toggle (AC3)** — GET /api/organizations/:id, verify outboundEnabled field exists and is boolean. PATCH to toggle, verify change persists.
4. **Reset Tour text (AC4)** — grep profile.tsx for "Reset Tour" text, assert found. Assert "Take Tour" not found.
5. **No Billing in Profile (AC5)** — grep profile.tsx for billing tab/link, assert not found (already done in S-6)
6. **Landing page new window (AC6)** — grep AppLayout.tsx for landing page icon handler, assert target="_blank" or window.open
7. **Activity vs Notifications (AC7)** — GET /api/activity-log and GET /api/notifications, compare data sources, document overlap

### Exact commands:
```
npx playwright test tests/e2e/s7-system-profile.spec.ts --project=sprint --reporter=list --workers=1
```

### Implementation approach:
1. Dispatch builder for profile.tsx (tour rename) and AppLayout.tsx (landing page target)
2. Write s7-system-profile.spec.ts including AC7 investigation
3. Run tests

## Ghost Entry Gate
**Reviewed by:** ghost-agent
**Timestamp:** 2026-03-24T08:34:44Z
**Sprint:** S-7
**A1 Previous cleared:** PASS (S-6 EXIT GATE: CLEARED)
**A2 Worktree:** clean
**A3 Session state:** PASS (references S-7)
**A4 Pre-exec exists:** PASS
**A5 Objective:** PASS
**A6 Test Plan:** PASS (1 npx command)
**A7 Declared Files:** PASS (settings.tsx, profile.tsx, AppLayout.tsx, test file)
**A8 Match check:** MATCH (3 app files, 5 components, 7 ACs)
**A9 UI permissions:** PASS (DECLARED — tour rename, billing removed from profile, landing page new window)
**A10 Ghost messages:** PASS (clear)
**ENTRY GATE: APPROVED**
