# R-2 Backend Scan Results

30 findings (12 MAJOR, 18 MINOR) across 47 server files.

## MAJOR

| # | Domain | File | Issue |
|---|--------|------|-------|
| 1 | BE | vendorProxy.ts:154-163 | Dead code: vapiGet() never called |
| 2 | BE | vendorProxy.ts:178-187 | Dead code: tavusGet(), tavusPost() never called |
| 3 | BE | outbound.ts:2,10-19 | Dead code: Resend import + getResendClient() unused |
| 4 | BE | outbound.ts:333 | Unhandled promise rejection — .catch(e){} swallows billing error silently |
| 5 | BE | campaigns.ts:144-147 | N+1 query — fetches all recipients then all conversations |
| 6 | BE | campaigns.ts:186,202,253,284 | N+1 notifications — for-loop createNotification per user |
| 7 | BE | conversations.ts:42-51 | Inefficient cleanup — fetches ALL ai-chat conversations to find stale ones |
| 8 | BE | index.ts:88 | Unsafe cast: req as any |
| 9 | BE | organizations.ts:99 | Forced cast: settings as any (Drizzle jsonb) |
| 10 | DT | sync.ts:11 | Unsafe parameter: transformVinLead(raw: any) no validation |
| 11 | AU | public.ts:14, sms.ts:10 | Hardcoded rate limit magic numbers (60/60000) |
| 12 | BE | index.ts:54,56 | Hardcoded localhost fallbacks in CORS |

## MINOR (18 items)
Exception swallowing, duplicate phone formatting, inline CSV parser, slug race condition, hardcoded baseUrl, untyped error handler, repeated error catch blocks, fire-and-forget patterns, weak cache invalidation, duplicate lead source classification.
