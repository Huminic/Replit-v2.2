# Post-Sprint Report: DEPLOY-1
Timestamp: 2026-03-19T08:30:00Z
Sprint: DEPLOY-1
Status: COMPLETE

## Summary
Rewrote dealer widget JS, deployed live.huminic.app, configured Caddy and DNS.

## Criteria Verification
- Criterion 1: [PASS] — browser access redirects to tavus.daily.co (verified: curl returns 302 to tavus.daily.co/*)
- Criterion 2: [PASS] — script access returns JS with fetch to video-session + iframe
- Criterion 3: [PASS] — all 5 dealers return 200 on JS endpoint, redirect on browser access
- Criterion 4: [PASS] — /widget/test links to /widget/dealer/{slug}.js URLs
- Criterion 5: [PASS] — OPTIONS /api/widget/video-session returns 204 with Access-Control-Allow-Origin: *
- Criterion 6: [PASS] — live.huminic.app health returns 200 with SSL
- Criterion 7: [PASS] — no custom name prompt UI, Tavus handles everything

## Files Changed
- server/routes/public.ts — widget JS rewrite + browser redirect + partner portal update
- server/routes/widgets.ts — CORS headers on video-session endpoint
- server/index.ts — route-specific CORS for /api/widget path

## Infrastructure Changes (non-code)
- Caddy: added live.huminic.app → localhost:5000
- DNS: live.huminic.app A record changed from 34.111.179.208 (Replit) to 150.136.6.207 (Oracle Cloud)
- .env: removed APP_BASE_URL (uses request host), added CORS_ORIGINS
