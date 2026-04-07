# SNP-PE3-INT-01: Fix Tavus Callback URL

**Date:** 2026-04-07
**Source:** PE-INTEGRATIONS-03 eval: BUG-INT-06

## Problem

In `server/vendorProxy.ts` line 410, the Tavus callback URL was hardcoded to `https://live.huminic.app/api/webhooks/tavus`. This meant the dev environment (`dev.huminicdev.com`) never received Tavus webhooks because callbacks always routed to production.

## Fix

Changed the hardcoded URL to use `process.env.APP_BASE_URL` with the production URL as fallback:

**Before:**
```ts
callback_url: "https://live.huminic.app/api/webhooks/tavus",
```

**After:**
```ts
callback_url: `${process.env.APP_BASE_URL || "https://live.huminic.app"}/api/webhooks/tavus`,
```

This follows the existing pattern used elsewhere in the codebase (e.g., `server/index.ts`, `server/routes/public.ts`).

## Verification

- `APP_BASE_URL` is already set in `.env` and used by other routes
- No other hardcoded production URLs remain in the Tavus integration section
- Build succeeds
- PM2 restart completed

## AC Results

| AC | Status | Evidence |
|----|--------|----------|
| SNP-PE3-INT-01.AC1: Tavus callback URL uses APP_BASE_URL | PASS | Line 410 now uses `process.env.APP_BASE_URL` |
| SNP-PE3-INT-01.AC2: No hardcoded production URLs remain in Tavus integration | PASS | Grep confirms no remaining `live.huminic.app` in vendorProxy.ts Tavus section |
