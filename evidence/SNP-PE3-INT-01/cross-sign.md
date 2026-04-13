# Cross-Sign — SNP-PE3-INT-01

**Sprint ID:** SNP-PE3-INT-01
**Timestamp:** 2026-04-07T19:49:04Z

## Implementing Role: orchestrator

**Scope:** Fix Tavus callback URL — use APP_BASE_URL instead of hardcoded production URL
**Changes verified:**
- [x] server/vendorProxy.ts — callback_url now uses process.env.APP_BASE_URL with production fallback

## Reviewing Role: enforcer

**Verification checklist:**
- [x] Line 410 uses template literal with APP_BASE_URL
- [x] No other hardcoded live.huminic.app URLs in Tavus integration
- [x] APP_BASE_URL pattern consistent with server/index.ts, server/routes/public.ts
- [x] TypeScript compiles without errors
- [x] Build succeeds
- [x] Code changes scoped to declared files only

## Verdict: APPROVED
