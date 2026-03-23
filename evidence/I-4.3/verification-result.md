# I-4.3 Verification Result — Update Tavus Webhook URL

**Date:** 2026-03-23
**Sprint:** I-4.3
**Builder:** backend

## Changes Made

Added `callback_url: "https://live.huminic.app/api/webhooks/tavus"` to all 3 `callMCP("tavus_create_conversation")` call sites:

1. **server/routes/public.ts** (line 412) — direct browser access flow
2. **server/routes/widgets.ts** (line 54) — widget video session flow
3. **server/vendorProxy.ts** (line 370) — authenticated API endpoint

## Verification

### 1. TypeScript compilation: PASS
```
npx tsc --noEmit → no errors (exit 0)
```

### 2. grep confirmation: PASS
```
server/routes/widgets.ts:54:        callback_url: "https://live.huminic.app/api/webhooks/tavus",
server/routes/public.ts:412:          callback_url: "https://live.huminic.app/api/webhooks/tavus",
server/vendorProxy.ts:370:        callback_url: "https://live.huminic.app/api/webhooks/tavus",
```

All 3 call sites confirmed.

## Files Modified
- server/routes/public.ts
- server/routes/widgets.ts
- server/vendorProxy.ts
