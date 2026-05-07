# Wave 1C comprehensive E2E — pm2 / console / network health

**Walk window:** 2026-05-07T01:50:12Z → 2026-05-07T01:59:00Z

## Pm2 nexxus-app

| Check | Walk start | Walk end | Verdict |
|---|---|---|---|
| status | online | online | PASS |
| restart_time | 85 | 85 | PASS — no restart in window |
| pm_uptime | 1778111125331 (ms) | 1778111125331 (ms) | PASS — uptime preserved |
| pid file | /home/ubuntu/.pm2/pids/nexxus-app-47.pid | (unchanged) | PASS |

Process did NOT restart mid-walk → all observed evidence comes from the same code-under-test (wave-1C HEAD f024271).

## Browser console errors during walk

`browser_console_messages` after partner_admin /insights load returned **empty result** (no console errors visible to the page). Probe-induced 401s on direct `fetch()` calls from `browser_evaluate` context don't count — they're due to the eval context lacking the access token (in-memory in React app, not in cookies/localStorage); the actual app fetches succeeded (proven by every page rendering with live data).

## Pm2 server logs during walk

| Pattern | Count in walk window | Pre-existing? | Wave 1C related? |
|---|---|---|---|
| `uncaughtException` | 0 | n/a | no |
| `UnhandledPromiseRejection` | 0 | n/a | no |
| `TypeError` | 0 | n/a | no |
| `ReferenceError` | 0 | n/a | no |
| `[Insights] Failed to fetch lead source mapping for org <empty-org>` | 6 (3 each for Cage, Huminic) | YES (caught + logged, not thrown) | NO |
| `[VAPI Webhook] VAPI_WEBHOOK_SECRET unset` | n/a (occurred before walk window started) | YES (pre-existing env hygiene warning) | NO |
| `5xx` HTTP responses | 0 | n/a | no |

All `/api/insights/*`, `/api/vin/leads/summary`, `/api/metrics/*`, `/api/conversations`, `/api/agents`, `/api/activity-log`, `/api/auth/*`, `/api/notifications/*`, `/api/favorites`, `/api/hunches` responded `200` or `304` — every API the dashboards depend on succeeded.

## Slow / hung requests

Sample timings observed: most API responses 348-528ms; longest single response 791ms (`/api/insights/dashboard` for Cage Automotive). NO requests over 3s, no timeouts.

## Network requests captured

See `evidence/wave-1C-comprehensive-e2e/console-network/pm2-logs-walk-window.log` for full pm2 log capture (last 200 lines).

Pm2 log relevant routes during walk:
```
1:58:25 AM [express] GET /api/organizations/fe2e50a8-... 200 in 352ms   (Huminic for super_admin)
1:58:25 AM [express] GET /api/agents 304 in 352ms
1:58:25 AM [express] GET /api/notifications/unread-count 200 in 356ms
1:58:25 AM [express] GET /api/notifications 200 in 443ms
1:58:25 AM [express] GET /api/activity-log 200 in 355ms
1:58:35 AM [express] POST /api/auth/refresh 200 in 528ms             (partner_admin login)
1:58:35 AM [express] GET /api/auth/me 200 in 522ms
1:58:36 AM [express] GET /api/organizations 304 in 351ms
1:58:37 AM [express] GET /api/insights/reports 200 in 785ms          (partner_admin /insights)
1:58:37 AM [express] GET /api/insights/dashboard 200 in 791ms
1:58:37 AM [express] GET /api/insights/library 304 in 785ms
[Insights] Failed to fetch lead source mapping for org fe2e50a8-... Error: VIN integration not found  (warning, not exception)
```

Conclusion: the app served all dashboard surfaces successfully under the walk's load. No regressions, no instability, no provider-side blow-ups.
