# Documentation Corrections

## P4-S2 Post-Sprint Report
- Claimed: campaigns.ts has 12 endpoints, total extracted 26
- Actual: campaigns.ts has 10 endpoints, total extracted 24
- Historical evidence file preserved. Discrepancy is 2 endpoints overcounted.

## P4-S4 Post-Sprint Report  
- Claimed: billing.ts has 6 endpoints
- Actual: billing.ts has 7 endpoints (entitlements endpoint not counted)
- Historical evidence file preserved.

## Infrastructure Items (Accepted)
- Duplicate security headers (Helmet + Caddy): cosmetic, both set same values
- Conflicting x-xss-protection: Helmet sends 0 (modern standard), Caddy sends 1;mode=block. Browser uses last value. Neither is harmful.
- Console 400 on unauthenticated load: /api/auth/refresh returns 400 when no cookie present. Expected behavior, cosmetic console error only.
- Secure cookie conditional on NODE_ENV: low risk behind HSTS via Caddy. Acceptable.
