# Post-Sprint Report: S-7 — System + Profile + Top Icons

**Sprint:** S-7
**Date:** 2026-03-24

## AC Results

| AC | Status | Evidence |
|----|--------|----------|
| AC1 | PASS | 8/8 settings sections found in code |
| AC2 | PASS | No AgentCard in settings popout |
| AC3 | PASS | CommGate toggled true→false→true (restored) |
| AC4 | PASS | "Reset Tour" found, no "Take Tour" or "Restart Tour" |
| AC5 | PASS | No billing tab in profile.tsx |
| AC6 | PASS | window.open with _blank, no setLocation |
| AC7 | PASS | Investigation: Activity=org action log, Notifications=user alerts. Different sources. |

## Test Execution

### s7-system-profile.spec.ts (NEW)
```
14 passed (12.9s)

  ✓ S-7.AC1: 8 settings sections exist in code
  ✓ S-7.AC2: no agents in settings popout
  ✓ S-7.AC3: CommGate toggle works
  ✓ S-7.AC4: Reset Tour button text
  ✓ S-7.AC5: no Billing in Profile
  ✓ S-7.AC6: landing page icon opens new window
  ✓ S-7.AC7: Activity Feed vs Notifications investigation
```

## Files Modified
- client/src/pages/profile.tsx — "Restart Tour" → "Reset Tour", testid updated
- client/src/components/layout/TopBar.tsx — landing page icon: setLocation → window.open(_blank)
- tests/e2e/s7-system-profile.spec.ts (NEW — 7 test cases)

Note: Declared file settings.tsx was not modified — verification only (8 sections confirmed).
Note: Declared file AppLayout.tsx was not modified — the landing page icon is in TopBar.tsx (child component). TopBar.tsx was modified instead.
