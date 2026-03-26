# SEC-08 Post-Sprint Report — Landing Pages / Widgets

**Sprint:** SEC-08
**Agent:** Dev
**Date:** 2026-03-26
**Status:** COMPLETE

## Code Changes

### I-119: Web Call → "Instant Call Back" (T1)

**Files modified:**
- `client/src/pages/widget-landing.tsx`
- `tests/e2e/s8-landing-widgets.spec.ts`

**Changes made:**

1. **Widget menu button relabeled:**
   - Label: "Web Call" → "Instant Call Back"
   - Description: "Talk to our AI assistant" → "Get a call back now"
   - onClick: No longer calls `startVoiceCall()` directly. Instead sets `widgetMode='voice'` with `callbackStatus='form'` to show the phone input form.

2. **New state variables added:**
   - `callbackPhone` — visitor's phone number input
   - `callbackStatus` — state machine: `'form' | 'submitting' | 'success' | 'error'`
   - `callbackError` — error message string

3. **New `submitCallback()` function:**
   - POSTs to `/api/widget/voice-callback` with `{ slug, phoneNumber }`
   - Handles success → shows "We're calling you now!" confirmation
   - Handles error → shows error message with retry button

4. **Voice widget UI completely replaced:**
   - **Form state:** Phone icon, "Get a call back now" heading, phone number input, "Call Me Now" submit button
   - **Submitting state:** Spinner with "Requesting call back..." message
   - **Success state:** Checkmark, "We're calling you now!", "Request another call" button
   - **Error state:** Error icon, error message, "Try again" button
   - Removed: VAPI browser-call UI (volume bars, mic toggle, end call button, connecting/connected/ended states)
   - Styling matches existing widget design (WIDGET_TEAL, white bg, rounded cards)

5. **Test IDs added:**
   - `input-callback-phone` — phone number input
   - `button-callback-submit` — submit button
   - `callback-success-message` — success confirmation text
   - `button-callback-another` — request another call button
   - `button-callback-retry` — retry on error button
   - `button-callback-back` — back to menu
   - `button-callback-close` — close widget

### Existing code preserved:
- `startVoiceCall()` and `endVoiceCall()` functions kept (not called from UI, available as fallback)
- `fetchVoiceConfig()` kept (used by video widget)
- VAPI import and ref kept (used by existing voice infrastructure)

## Backend Dependency

**IMPORTANT:** The frontend now POSTs to `/api/widget/voice-callback` with payload `{ slug: string, phoneNumber: string }`. This backend route does NOT exist yet. It needs to be created to:
1. Accept the slug and phone number
2. Look up the org's VAPI assistant config
3. Trigger an outbound VAPI call to the provided phone number
4. Return success/error response

## Verification (Document Only)

### S-8.AC1: Video opens in new window
- **CONFIRMED:** `window.open(data.conversationUrl, '_blank', 'noopener,noreferrer')` present at two locations:
  - Line ~124: Fullscreen video mode (queryMode === 'video')
  - Line ~323: Widget video mode (startVideoChat function)

### S-8.AC2: Store name top-left
- **CONFIRMED:** `<h1 className="absolute top-4 left-4 z-30 ..."  data-testid="landing-store-name">` present at line ~758
- Uses `ORG_NAME` from API data or fallback "Our Dealership"

## Build Verification

- `npx tsc --noEmit` — **PASS** (zero errors)

## Test Coverage

Updated `tests/e2e/s8-landing-widgets.spec.ts` with 4 new tests:
1. Widget menu shows "Instant Call Back" label (not "Web Call")
2. Callback phone input and submit button exist in code
3. Callback POSTs to `/api/widget/voice-callback` with `phoneNumber`
4. Callback success state shows "We're calling you now!" confirmation

Existing tests preserved (AC1-AC7).
