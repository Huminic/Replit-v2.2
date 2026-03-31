# Infrastructure Domain Test Plan (T-005)

Generated: 2026-03-31
Source: Code analysis of server/index.ts, server/auth.ts, server/routes/health.ts, server/routes/auth.ts, server/routes/widgets.ts, server/middleware/entitlementCheck.ts, server/routes/conversations.ts, server/storage.ts, tests/e2e/domain-12-infrastructure.spec.ts

---

## 1. Infrastructure Component Inventory

### 1.1 Health Endpoint

| Component | Location | Details |
|-----------|----------|---------|
| GET /api/health | server/routes/health.ts | Returns JSON: status, version, uptime, timestamp, environment |
| Response shape | `{ status: 'ok', version, uptime, timestamp, environment }` | No auth required |

### 1.2 Security Headers (Helmet)

Configured in server/index.ts lines 87-99.

| Header | Expected Value | Source |
|--------|---------------|--------|
| Content-Security-Policy | defaultSrc 'self', scriptSrc 'self', styleSrc 'self' + 'unsafe-inline' + fonts.googleapis.com, fontSrc 'self' + fonts.gstatic.com, imgSrc 'self' + data: + https:, connectSrc 'self' + api.anthropic.com + wss: | Helmet CSP config |
| X-Content-Type-Options | nosniff | Helmet default |
| X-Frame-Options | DENY or SAMEORIGIN | Helmet default |
| X-XSS-Protection | 0 (Helmet v5+ disables it) | Helmet default |
| Strict-Transport-Security | max-age=... (production only, via reverse proxy or Helmet) | Helmet default |
| X-Request-ID | UUID per request | Custom middleware, line 102-107 |
| Cross-Origin-Embedder-Policy | disabled (set to false) | Helmet config line 98 |

### 1.3 Rate Limiting

| Limiter | Scope | Window | Max | Env Var | Location |
|---------|-------|--------|-----|---------|----------|
| Global | /api/* | 60s | 100 (default) | GLOBAL_RATE_LIMIT_MAX | server/index.ts line 110-117 |
| Auth | /api/auth/login | 15min | 100 (default) | AUTH_RATE_LIMIT_MAX | server/routes/auth.ts line 17-23 |
| Widget | widget endpoints | 60s | 30 (hardcoded) | N/A | server/routes/widgets.ts line 8 |

All use standardHeaders: true, legacyHeaders: false.

### 1.4 Cookie / Session Configuration

| Cookie | Name | httpOnly | secure | sameSite | path | maxAge |
|--------|------|----------|--------|----------|------|--------|
| Refresh token | nexxus_refresh | true | true (prod only) | strict | /api/auth | 7 days |

Auth model: JWT access token in response body (1h expiry) + refresh token in httpOnly cookie (7d expiry).

### 1.5 CORS Configuration

| Path | Origin Policy | Methods | Credentials |
|------|--------------|---------|-------------|
| /api/widget/* | * (any origin) | GET, POST, OPTIONS | No |
| /widget/* | * (any origin) | GET, POST, OPTIONS | No |
| All other /api/* | Allowlist: APP_BASE_URL, localhost:5000, localhost:3000, CORS_ORIGINS env | GET, POST, PUT, PATCH, DELETE, OPTIONS | Yes |

Widget video-session also has manual CORS headers in route handler (server/routes/widgets.ts lines 12-18).

### 1.6 Error Handling

| Handler | Status | Response | Location |
|---------|--------|----------|----------|
| File upload size | 413 | `{ message: "File too large. Maximum upload size is 5MB." }` | server/index.ts line 163-166 |
| Generic error | err.status or 500 | `{ message: err.message or "Internal Server Error" }` | server/index.ts line 170-181 |
| API 404 | 404 | `{ error: "Not found" }` | server/index.ts line 184-186 |

### 1.7 Entitlement Check Middleware

| Behavior | Condition | Response |
|----------|-----------|----------|
| Allowed | entitlement check passes | next() |
| Blocked (over limit) | check.allowed === false | 403 `{ error: 'entitlement_exceeded', feature, limit, used, upgradeUrl }` |
| Fail-closed | error + ENTITLEMENT_FAIL_CLOSED=true | 503 `{ error: 'entitlement_check_unavailable' }` |
| Fail-open (default) | error + ENTITLEMENT_FAIL_CLOSED unset | next() (allows action) |
| No org/billing | user has no organizationId or org has no billingCustomerId | next() (skips check) |

### 1.8 OrgId Data Filtering

- `getConversations()` (server/routes/conversations.ts line 23): always scoped to `req.user.organizationId`
- `getConversationByPhone()` (server/storage.ts line 422-438): accepts optional `organizationId` parameter; when provided, adds WHERE clause

### 1.9 Request Infrastructure

| Feature | Detail |
|---------|--------|
| Body parsing | JSON with 1mb limit, rawBody preserved for webhook verification |
| URL encoding | express.urlencoded extended: false |
| Cookie parsing | cookie-parser middleware |
| Trust proxy | Level 1 (trusts first proxy) |
| Request logging | All /api/* paths logged with method, path, status, duration |

---

## 2. Test Cases

### Health Endpoint

| ID | Name | Priority | Existing | Steps | Expected Result |
|----|------|----------|----------|-------|-----------------|
| TC-INFRA-001 | Health endpoint returns 200 with correct shape | P0 | EXISTING (12.1) | GET /api/health | 200, body contains `status: 'ok'`, `version`, `uptime` (number), `timestamp` (ISO string), `environment` |
| TC-INFRA-002 | Health endpoint requires no authentication | P1 | NEW | GET /api/health with no auth header | 200, same response as authenticated request |
| TC-INFRA-003 | Health endpoint uptime increases over time | P2 | NEW | GET /api/health twice with 2s delay | Second response uptime >= first response uptime |

### Security Headers

| ID | Name | Priority | Existing | Steps | Expected Result |
|----|------|----------|----------|-------|-----------------|
| TC-INFRA-010 | Helmet security headers present | P0 | EXISTING (12.2) | GET /api/health, inspect headers | x-content-type-options: nosniff, x-frame-options: DENY or SAMEORIGIN |
| TC-INFRA-011 | Content-Security-Policy header present and correct | P1 | NEW | GET /api/health, read CSP header | CSP header contains default-src 'self', script-src 'self' |
| TC-INFRA-012 | X-Request-ID header present and unique | P1 | NEW | GET /api/health twice | Both responses have X-Request-ID header; values are different UUIDs |
| TC-INFRA-013 | Strict-Transport-Security header present | P1 | NEW | GET /api/health over HTTPS (dev.huminicdev.com) | Header contains max-age with value > 0 |
| TC-INFRA-014 | Cross-Origin-Embedder-Policy not set | P2 | NEW | GET /api/health, check headers | cross-origin-embedder-policy header absent (disabled in config) |

### Rate Limiting

| ID | Name | Priority | Existing | Steps | Expected Result |
|----|------|----------|----------|-------|-----------------|
| TC-INFRA-020 | Widget rate limiter triggers at 30 req/min | P0 | EXISTING (12.3) | Send 50+ rapid requests to /api/widget/voice-config/serra-honda | At least one 429 response |
| TC-INFRA-021 | Rate limit response includes standard headers | P1 | NEW | Trigger rate limit on widget endpoint | Response includes RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset headers (standardHeaders: true) |
| TC-INFRA-022 | Auth rate limiter is separate from global | P1 | NEW | Send requests to /api/auth/login; verify rate limit headers | RateLimit-Limit reflects AUTH_RATE_LIMIT_MAX (or default 100), window is 15 min |
| TC-INFRA-023 | Global rate limiter applies to /api/* | P1 | NEW | Send requests to /api/health, check RateLimit-* headers | RateLimit-Limit reflects GLOBAL_RATE_LIMIT_MAX (or default 100), window is 60s |
| TC-INFRA-024 | Rate limit 429 response body is JSON | P2 | NEW | Trigger widget rate limit | 429 body is `{ error: 'Rate limit exceeded' }` |

### Cookie Security

| ID | Name | Priority | Existing | Steps | Expected Result |
|----|------|----------|----------|-------|-----------------|
| TC-INFRA-030 | Login sets httpOnly refresh cookie | P0 | EXISTING (12.4) | POST /api/auth/login with valid credentials | Set-Cookie header contains nexxus_refresh with HttpOnly flag |
| TC-INFRA-031 | Refresh cookie has SameSite=Strict | P1 | NEW | POST /api/auth/login with valid credentials | Set-Cookie contains SameSite=Strict |
| TC-INFRA-032 | Refresh cookie path scoped to /api/auth | P1 | NEW | POST /api/auth/login with valid credentials | Set-Cookie contains Path=/api/auth |
| TC-INFRA-033 | Refresh cookie has Secure flag in production | P1 | NEW | POST /api/auth/login on dev.huminicdev.com (HTTPS) | Set-Cookie contains Secure flag |
| TC-INFRA-034 | Logout clears refresh cookie | P1 | NEW | Login then POST /api/auth/logout | Set-Cookie clears nexxus_refresh (maxAge=0 or expires in past) |
| TC-INFRA-035 | Access token returned in response body only | P2 | NEW | POST /api/auth/login | Response body contains accessToken; access token is NOT in Set-Cookie |

### CORS Configuration

| ID | Name | Priority | Existing | Steps | Expected Result |
|----|------|----------|----------|-------|-----------------|
| TC-INFRA-040 | Widget endpoints allow any origin | P0 | NEW | OPTIONS /api/widget/voice-config/test with Origin: https://random-dealer.com | Access-Control-Allow-Origin: * |
| TC-INFRA-041 | Non-widget API rejects unknown origins | P0 | NEW | GET /api/health with Origin: https://evil-site.com | No Access-Control-Allow-Origin header or CORS error |
| TC-INFRA-042 | Non-widget API allows APP_BASE_URL origin | P1 | NEW | GET /api/health with Origin: (APP_BASE_URL value) | Access-Control-Allow-Origin matches origin |
| TC-INFRA-043 | Non-widget API allows credentials | P1 | NEW | OPTIONS /api/health with valid origin | Access-Control-Allow-Credentials: true |
| TC-INFRA-044 | Widget CORS allows GET, POST, OPTIONS only | P2 | NEW | OPTIONS /api/widget/* | Access-Control-Allow-Methods includes GET, POST, OPTIONS; excludes DELETE, PUT |
| TC-INFRA-045 | /widget path (non-API) also has permissive CORS | P2 | NEW | OPTIONS /widget/test with Origin: https://any-site.com | Access-Control-Allow-Origin: * |

### Error Handling

| ID | Name | Priority | Existing | Steps | Expected Result |
|----|------|----------|----------|-------|-----------------|
| TC-INFRA-050 | Unknown API path returns 404 JSON | P0 | NEW | GET /api/nonexistent-route-xyz | 404, body `{ error: "Not found" }` |
| TC-INFRA-051 | Malformed JSON body returns 400 | P1 | NEW | POST /api/auth/login with body "not-json" and Content-Type: application/json | 400 response (express.json parse error) |
| TC-INFRA-052 | Oversized request body rejected | P1 | NEW | POST /api/auth/login with body > 1MB | 413 or 400 response |
| TC-INFRA-053 | Server errors return 500 with message | P2 | NEW | (Depends on triggering internal error — may need specific malformed input) | 500, body `{ message: "..." }` |
| TC-INFRA-054 | Error responses do not leak stack traces | P1 | NEW | Trigger a 500 error | Response body does not contain "stack", "at /", or file paths |

### Entitlement Fail-Closed

| ID | Name | Priority | Existing | Steps | Expected Result |
|----|------|----------|----------|-------|-----------------|
| TC-INFRA-060 | Invalid token rejected on protected endpoints | P0 | EXISTING (12.5) | GET /api/tasks, /api/contacts, /api/organizations, /api/users with expired JWT | All return 401 or 403 (not 200) |
| TC-INFRA-061 | No token rejected on protected endpoints | P0 | EXISTING (12.5) | GET protected endpoints with no Authorization header | All return 401 (not 200) |
| TC-INFRA-062 | Entitlement exceeded returns 403 with upgrade URL | P1 | NEW | Authenticate, hit entitlement-protected endpoint when over limit | 403, body contains `error: 'entitlement_exceeded'`, `upgradeUrl: '/settings/billing/plan'` |
| TC-INFRA-063 | Entitlement fail-open when ENTITLEMENT_FAIL_CLOSED unset | P1 | NEW | (Requires billing service to be unreachable — test may need mock) | Request succeeds (not blocked) when billing service errors |
| TC-INFRA-064 | Entitlement fail-closed when env var set | P1 | NEW | (Requires ENTITLEMENT_FAIL_CLOSED=true and billing unreachable) | 503 `{ error: 'entitlement_check_unavailable' }` |
| TC-INFRA-065 | Malformed Bearer token format rejected | P1 | NEW | GET /api/tasks with Authorization: "Bearer" (no token value) | 401 response |
| TC-INFRA-066 | Non-Bearer auth scheme rejected | P2 | NEW | GET /api/tasks with Authorization: "Basic abc123" | 401 response |

### OrgId Conversation/Data Filtering

| ID | Name | Priority | Existing | Steps | Expected Result |
|----|------|----------|----------|-------|-----------------|
| TC-INFRA-070 | Conversations scoped to user's org | P0 | EXISTING (12.6) | Login as two different org users, GET /api/conversations | Each user only sees conversations from their own org |
| TC-INFRA-071 | Conversation phone lookup respects orgId | P1 | NEW | Login as org-A user, query conversations; login as org-B user, query same phone | Results filtered by respective organizationId |
| TC-INFRA-072 | Cross-org conversation ID access rejected | P1 | NEW | Login as org-A user, GET /api/conversations/:id where id belongs to org-B | 404 or 403 (not 200 with org-B data) |
| TC-INFRA-073 | Tasks scoped to user's org | P1 | NEW | Login as two different org users, GET /api/tasks | Each user only sees tasks from their own org |
| TC-INFRA-074 | Users list scoped to org | P1 | NEW | Login as org-A user, GET /api/users | Only users from org-A returned |

### SSL/TLS Configuration

| ID | Name | Priority | Existing | Steps | Expected Result |
|----|------|----------|----------|-------|-----------------|
| TC-INFRA-080 | HTTPS connection succeeds | P0 | NEW | GET https://dev.huminicdev.com/api/health | 200, valid TLS certificate |
| TC-INFRA-081 | HTTP redirects to HTTPS | P1 | NEW | GET http://dev.huminicdev.com/api/health (if applicable via reverse proxy) | 301/302 redirect to HTTPS, or connection refused |
| TC-INFRA-082 | TLS certificate is valid and not expired | P1 | NEW | Check certificate validity on dev.huminicdev.com | Certificate is valid, not self-signed, not expired |

### Request Infrastructure

| ID | Name | Priority | Existing | Steps | Expected Result |
|----|------|----------|----------|-------|-----------------|
| TC-INFRA-090 | Trust proxy correctly identifies client IP | P2 | NEW | Send request through proxy, check rate limiter tracks per-IP | Rate limiting applies per client IP, not proxy IP |
| TC-INFRA-091 | Request logging captures API calls | P2 | NEW | (Observational — verify via server logs) | API requests logged with method, path, status, duration |

---

## 3. Coverage Summary

| Category | Existing | New | Total |
|----------|----------|-----|-------|
| Health Endpoint | 1 | 2 | 3 |
| Security Headers | 1 | 4 | 5 |
| Rate Limiting | 1 | 4 | 5 |
| Cookie Security | 1 | 5 | 6 |
| CORS | 0 | 6 | 6 |
| Error Handling | 0 | 5 | 5 |
| Entitlement Fail-Closed | 1 (covers 2 sub-tests) | 5 | 7 |
| OrgId Data Filtering | 1 | 4 | 5 |
| SSL/TLS | 0 | 3 | 3 |
| Request Infrastructure | 0 | 2 | 2 |
| **Total** | **6** | **40** | **46** |

---

## 4. Priority Distribution

| Priority | Count | Description |
|----------|-------|-------------|
| P0 (must pass) | 10 | Health, core security headers, rate limiting trigger, cookie httpOnly, CORS widget/non-widget, 404 handling, auth rejection, org scoping, HTTPS |
| P1 (should pass) | 26 | CSP, HSTS, request ID, rate limit headers, cookie attributes, CORS credentials, error handling, entitlement modes, cross-org isolation, TLS cert |
| P2 (nice to have) | 10 | Uptime tracking, COEP disabled, rate limit body format, widget method restriction, stack trace leak, non-Bearer auth, trust proxy, logging |

---

## 5. Testing Notes

- **Rate limiting tests**: The deployed environment may have GLOBAL_RATE_LIMIT_MAX=500 and AUTH_RATE_LIMIT_MAX=200. Widget limit is hardcoded at 30. Tests should target widget endpoint for reliable 429 triggers.
- **Cookie Secure flag**: Only set when NODE_ENV=production. On dev.huminicdev.com this should be production mode; verify.
- **Entitlement fail-closed tests (TC-INFRA-063, 064)**: Depend on ENTITLEMENT_FAIL_CLOSED env var and billing service state. May require environment manipulation or mocking. Default behavior is fail-open.
- **CORS tests**: Must send proper Origin header. Playwright's request API may not include Origin by default — may need explicit header.
- **SSL/TLS tests**: These test the reverse proxy (Caddy) configuration, not the Express app directly. May require direct HTTPS calls outside Playwright's baseURL.
- **Existing test 12.6 (orgId filtering)**: Currently tests query-param and path-based phone lookup patterns that don't exist as routes. The actual conversation endpoint is GET /api/conversations with orgId scoped server-side. Test works by verifying org isolation on the conversations list.
