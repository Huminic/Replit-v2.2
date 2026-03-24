# Post-Sprint Report: S-8 — Landing Page / Widgets

**Sprint:** S-8
**Date:** 2026-03-24

## AC Results

| AC | Status | Evidence |
|----|--------|----------|
| AC1 | PASS | window.open with _blank in widget-landing.tsx |
| AC2 | PASS | data-testid="landing-store-name" in code, API returns store data |
| AC3 | PASS | Appointment created with source=widget |
| AC4 | PASS | Appointment endpoint returns 201 |
| AC5 | PASS | Widget form: conversationId=d6fba392... created |
| AC6 | PASS | All 5 dealer JS: 200, application/javascript, 1000+ bytes |
| AC7 | PASS | All 5 dealer JS contain dealer slug |

## Test Execution

### s8-landing-widgets.spec.ts (NEW)
```
20 passed (6.8s)

  ✓ S-8.AC1: video widget opens in parent window
  ✓ S-8.AC2: store name element exists in code
  ✓ S-8.AC2: landing page API returns store name
  ✓ S-8.AC3/AC4: widget appointment endpoint works
  ✓ S-8.AC5: widget form submission creates conversation
  ✓ S-8.AC6/AC7: widget JS for serra-honda (1053 bytes)
  ✓ S-8.AC6/AC7: widget JS for serra-nissan (1055 bytes)
  ✓ S-8.AC6/AC7: widget JS for tony-serra-ford (1061 bytes)
  ✓ S-8.AC6/AC7: widget JS for hyundai-of-columbia (1069 bytes)
  ✓ S-8.AC6/AC7: widget JS for ford-of-columbia (1063 bytes)
```

## Files Modified
- client/src/pages/widget-landing.tsx — video window.open(_blank), store name h1
- tests/e2e/s8-landing-widgets.spec.ts (NEW — 10 test cases)
