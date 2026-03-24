# Pre-Execution Report: S-8 — Landing Page / Widgets

**Sprint:** S-8
**Type:** FE fixes + verification tests
**Date:** 2026-03-24
**Status:** READY

## Objective

Fix video widget to open in parent browser window (not iframe), add store name to landing page header, verify widget scheduling, form submission, and all 5 dealer widget JS files.

## Declared Files

- `client/src/pages/widget-landing.tsx` — video iframe fix, store name display
- `server/routes/public.ts` — verify widget JS serving
- `tests/e2e/s8-landing-widgets.spec.ts` — new test file

## UI Changes

DECLARED:
- Video widget launch target changed from iframe to parent window (window.open or target="_blank")
- Store name added to landing page header at top-left

## Acceptance Criteria (from sprints.json)

| ID | Criterion | Component | Evidence |
|----|-----------|-----------|----------|
| S-8.AC1 | Video widget opens in PARENT browser window, not inside iframe | S-8.1 | Code review |
| S-8.AC2 | Store name visible at top-left of landing page for each dealer | S-8.2 | Code review + API |
| S-8.AC3 | Widget appointment booking creates appointment in DB | S-8.3 | API assertion |
| S-8.AC4 | Widget appointment appears in store calendar | S-8.3 | API assertion |
| S-8.AC5 | Widget form submission creates conversation in TeamBox | S-8.4 | API assertion |
| S-8.AC6 | All 5 dealer widget JS files serve valid JavaScript | S-8.5 | HTTP assertion |
| S-8.AC7 | Widget JS contains correct dealer name | S-8.5 | Content assertion |

## Test Plan

### New test file:
- `tests/e2e/s8-landing-widgets.spec.ts`

### Test sections:

1. **Video iframe fix (AC1)** — grep widget-landing.tsx for video launch, assert window.open or target="_blank", not iframe src
2. **Store name (AC2)** — GET /api/public/landing/serra-honda, assert org name in response. grep widget-landing.tsx for store name display
3. **Widget appointment (AC3/AC4)** — POST /api/widget/appointment with test data, assert 201
4. **Widget form (AC5)** — POST /api/widget/contact with test data, query conversations
5. **Widget JS x5 (AC6/AC7)** — GET /widget/dealer/{slug}.js for all 5 dealers, assert 200 + application/javascript + dealer name

### Exact commands:
```
npx playwright test tests/e2e/s8-landing-widgets.spec.ts --project=sprint --reporter=list --workers=1
```

### Implementation approach:
1. Dispatch builder for widget-landing.tsx (video iframe fix + store name)
2. Write s8-landing-widgets.spec.ts
3. Run tests

## Ghost Entry Gate
**Reviewed by:** ghost-agent
**Timestamp:** 2026-03-24T08:56:42Z
**Sprint:** S-8
**A1 Previous cleared:** PASS (S-7 EXIT GATE: CLEARED)
**A2 Worktree:** clean
**A3 Session state:** PASS (references S-8)
**A4 Pre-exec exists:** PASS
**A5 Objective:** PASS
**A6 Test Plan:** PASS (1 npx command)
**A7 Declared Files:** PASS (widget-landing.tsx, public.ts, test file)
**A8 Match check:** MATCH (2 app files, 5 components, 7 ACs)
**A9 UI permissions:** PASS (DECLARED — video widget target, store name)
**A10 Ghost messages:** PASS (clear)
**ENTRY GATE: APPROVED**
