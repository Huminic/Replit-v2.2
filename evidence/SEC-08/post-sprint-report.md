# Post-Sprint Report: SEC-08 — Landing Pages / Widgets

**Sprint:** SEC-08
**Agent:** Dev
**Date:** 2026-03-26T17:55:44Z
**Status:** COMPLETE

## Code Changes

### I-119: Web Call → "Instant Call Back" (High)

**File:** `client/src/pages/widget-landing.tsx`

1. **New state variables:** `callbackPhone` (string), `callbackStatus` ('idle' | 'submitting' | 'success' | 'error')
2. **New `submitCallback()` function:** POSTs to `/api/widget/voice-callback` with `{ slug, phoneNumber }`. Handles success/error states.
3. **Widget menu button relabeled:** "Web Call" → "Instant Call Back", "Talk to our AI assistant" → "Get a call back now". onClick now sets widgetMode='voice' with idle callback status instead of calling startVoiceCall().
4. **Voice widget UI replaced:** Old VAPI browser-call UI (volume bars, mic toggle, end call, connecting/connected/ended states) replaced with phone number input form:
   - **Idle:** Phone icon + "Get a call back now" heading + phone input + "Call Me" button
   - **Submitting:** Spinner + "Requesting call back..."
   - **Success:** Checkmark + "We're calling you now!" + "Request another call" link
   - **Error:** "Unable to place call. Please try again." + "Try again" link
5. **VAPI code preserved:** `startVoiceCall`, `endVoiceCall`, `Vapi` import all remain but are no longer invoked from UI.

### I-121: Video popup blocked by browser (High)

**File:** `client/src/pages/widget-landing.tsx`

**Root cause:** `window.open(data.conversationUrl, '_blank')` called inside async fetch callback. Browsers classify this as a popup because it's not in the synchronous click handler stack.

**Fix applied to both locations:**

1. **`startVideoChat()` function (widget button click):** Opens `window.open('about:blank', '_blank')` SYNCHRONOUSLY in the click handler. After async fetch completes, redirects via `videoWindow.location.href = data.conversationUrl`. On error, closes the blank window.

2. **`?mode=video` auto-launch useEffect:** Same pattern — opens blank window synchronously before the async IIFE, then redirects or closes on error.

### I-122: Deployment (DOCUMENT ONLY)

Added comment in `startVideoChat` noting that these changes require deployment to take effect on the live site.

## Test Results

```
npx playwright test tests/e2e/s8-landing-widgets.spec.ts --project=sprint --reporter=list --workers=1
12 passed (3.5s)
```

### Tests added/updated:
- **S-8.AC1:** Updated to verify popup blocker fix pattern (`about:blank` + `videoWindow.location.href` + `videoWindow.close()`)
- **S-8.AC1b:** New — verifies menu label is "Instant Call Back" / "Get a call back now", old labels removed
- **S-8.AC1c:** New — verifies phone input, callback submit button, voice-callback API endpoint, success/error messages

## Build Check

`npx tsc --noEmit` — clean, no errors.

## Files Modified

1. `client/src/pages/widget-landing.tsx` — I-119 (callback form), I-121 (video popup fix), I-122 (deployment comment)
2. `tests/e2e/s8-landing-widgets.spec.ts` — Updated and new tests for I-119, I-121

## Files NOT Modified

- `client/src/lib/widget-types.ts` — No changes needed. Existing types already include 'callback' channel and `callbackFormFields`.

---

## GHOST EXIT GATE — SEC-08

**Timestamp:** 2026-03-26T18:10:00Z
**Gate Agent:** Ghost

### Checks

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| B1 | git diff --stat matches declared files | PASS | 2 files changed: widget-landing.tsx, s8-landing-widgets.spec.ts. No extras. |
| B2 | ENTRY GATE present in pre-execution-report.md | PASS | "ENTRY GATE APPROVED (10/10 PASS)" found. |
| B4 | Test execution proof in post-sprint-report | PASS | 12/12 Playwright tests passed. TypeScript build clean. |
| B9 | git status only shows declared files | PASS | Only M client/src/pages/widget-landing.tsx and M tests/e2e/s8-landing-widgets.spec.ts. |

### Critical Code Verification

| Claim | Result | Evidence |
|-------|--------|----------|
| "Instant Call Back" label (not "Web Call") | PASS | Line 470: "Instant Call Back", line 648: "Instant Call Back". No "Web Call" label found. |
| Phone input form with POST to /api/widget/voice-callback | PASS | submitCallback() at line 309, POST to /api/widget/voice-callback at line 313, phone input at line 702. |
| startVideoChat: sync window.open('about:blank') before fetch | PASS | Line 333: window.open('about:blank') before any async work. Line 352: videoWindow.location.href redirect after fetch. |
| ?mode=video auto-launch uses same sync pattern | PASS | Line 114: window.open('about:blank') synchronously before async IIFE at line 115. Line 128: redirect after fetch. |
| Cross-sign: plain text "Verdict: APPROVED", Implementing Role: orchestrator | PASS | cross-sign.md line 5: "Implementing Role: orchestrator", line 15: "Verdict: APPROVED" (plain text). |

### Verdict

EXIT GATE: CLEARED

All 9 checks passed. Code changes match declared scope exactly. No undeclared modifications. Cross-sign valid.
