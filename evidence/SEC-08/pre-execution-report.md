# Pre-Execution Report: SEC-08 — Landing Pages / Widgets

**Sprint:** SEC-08
**Type:** Frontend feature change + bug fix
**Date:** 2026-03-26
**Status:** AWAITING ENTRY GATE

## Objective

Two fixes on the widget landing page: (1) Change Web Call to "Instant Call Back" — visitor enters phone number, system POSTs to backend to trigger outbound VAPI call. (2) Fix video widget popup being blocked by browser — window.open in async callback gets treated as popup.

## Declared Files

- `client/src/pages/widget-landing.tsx` — I-119 (Instant Call Back), I-121 (video popup fix)
- `client/src/lib/widget-types.ts` — if widget type definitions need updating
- `tests/e2e/s8-landing-widgets.spec.ts` — test updates

## Issues to Fix

| Issue | Description | Severity | Change |
|---|---|---|---|
| I-119 | Web Call → "Instant Call Back" | High | Change button label to "Instant Call Back", description to "Get a call back now". When clicked, show phone number input form. On submit, POST to /api/widget/voice-callback with {slug, phoneNumber}. Show confirmation "We're calling you now!" Backend route does not exist yet — just make the frontend POST. |
| I-121 | Video widget window.open blocked by popup blocker | High | The window.open() call happens inside an async fetch callback, so browsers block it. Fix: open the window FIRST in the click handler (window.open('about:blank')), then set win.location after the fetch resolves. OR show a clickable link after session creation. |
| I-122 | Instant Call Back not deployed | High | DOCUMENT ONLY — this is a deployment issue, not a code fix |

## UI Changes

- Widget menu: "Web Call" → "Instant Call Back", "Talk to our AI assistant" → "Get a call back now"
- Voice widget: replace browser VAPI call UI with phone number input → submit → confirmation
- Video widget: fix popup blocker issue with window.open approach

## Test Plan

### Test file:
- `tests/e2e/s8-landing-widgets.spec.ts`

### Exact commands:
```
npx playwright test tests/e2e/s8-landing-widgets.spec.ts --project=sprint --reporter=list --workers=1
```

## Diff Reference (Attempt 1)

From sec-attempt-1-diff.patch, attempt 1:
- Changed "Web Call"/"Talk to our AI assistant" → "Instant Call Back"/"Get a call back now"
- Added submitCallback() posting to /api/widget/voice-callback
- Replaced VAPI browser call UI with phone number input + confirmation states
- Kept existing VAPI code but not called from UI

This attempt adds: I-121 (video popup fix) which was NOT in attempt 1.

## Acceptance Criteria

S-8.AC1 through S-8.AC14 (from acceptance_criteria.md)

---

## GHOST ENTRY GATE — SEC-08

**Timestamp:** 2026-03-26T18:00:00Z
**Gate:** ENTRY (A1–A10)

| Check | Description | Result | Notes |
|---|---|---|---|
| A1 | Predecessor exit gate cleared | PASS | SEC-02 cross-sign: APPROVED. Committed df3d321. Log: "all 7 gates passed" |
| A2 | Worktree clean (client/src, server, shared) | PASS | `git status --short` returns empty — no uncommitted changes |
| A3 | Session state consistent | PASS | session-state.md shows SEC-08 as next sprint, SEC-02 committed |
| A4 | Pre-exec report exists and is complete | PASS | evidence/SEC-08/pre-execution-report.md present with objective, files, issues, test plan |
| A5 | Issues listed with severity and change description | PASS | 3 issues (I-119, I-121, I-122) with severity and change plan |
| A6 | Test plan specified with exact commands | PASS | Playwright command provided: `npx playwright test tests/e2e/s8-landing-widgets.spec.ts --project=sprint --reporter=list --workers=1` |
| A7 | Diff reference from attempt 1 documented | PASS | Attempt 1 changes listed, I-121 noted as new addition |
| A8 | Declared files match sprints.json | PASS | Pre-exec declares: widget-landing.tsx, widget-types.ts, s8-landing-widgets.spec.ts — matches sprints.json SEC-08 declaredFiles exactly (3 files) |
| A9 | UI changes documented | PASS | 3 UI changes specified: label rename, voice widget form replacement, video popup fix |
| A10 | Ghost messages / warnings | NONE | No prior Ghost warnings for SEC-08 |

### Verdict: **ENTRY GATE APPROVED** (10/10 PASS)

Dev may proceed with SEC-08 implementation per the pre-execution report scope.
