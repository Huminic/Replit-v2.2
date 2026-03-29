# OpenAI Proxy 401 Diagnosis

**Date:** 2026-03-28T00:00:00Z

## Server Route
- File: `/home/ubuntu/Claude-store/nexxus2.2_replit/server/routes/proxy.ts` (line 157-203)
- Auth middleware: `authenticateToken` (imported from `../auth`)
- Expected headers: `Authorization: Bearer <JWT_ACCESS_TOKEN>` — the middleware extracts the token from `req.headers.authorization`, splits on space, takes index [1], then verifies it as a JWT with type `access` against `JWT_SECRET`
- On missing token: returns 401 `"Access token required"`
- On invalid/expired token: returns 401 `"Invalid or expired token"`
- On user not found: returns 401 `"User not found"`

## Environment
- OPENAI_API_KEY present: YES
- OPENAI_API_KEY non-empty: YES (164 characters)

## Client Call
- File: `/home/ubuntu/Claude-store/nexxus2.2_replit/client/src/components/marketing/AgentChatView.tsx` (line 404-416)
- Endpoint called: `POST /api/openai-proxy`
- Headers sent: `Content-Type: application/json` + conditionally `Authorization: Bearer <token>` only if `getAccessToken()` returns a truthy value
- Token source: `getAccessToken()` from `@/lib/tokenStore` — returns an in-memory variable (`let accessToken: string | null = null`). Tokens are NEVER persisted to localStorage. On page refresh, the token must be re-obtained via the httpOnly refresh cookie flow in AuthContext.

## Root Cause

**The client-side code is correct in structure.** The 401 is most likely caused by one of these scenarios (ranked by probability):

1. **Token expired (most likely):** Access tokens expire after 1 hour (`ACCESS_TOKEN_EXPIRY = "1h"`). The client's `isTokenExpiringSoon()` checks for 5-minute window, but there is no evidence that AgentChatView (or any caller before the fetch) proactively refreshes the token before calling the proxy. If the user has been on the marketing page for >1 hour without triggering a token refresh, `getAccessToken()` returns a stale/expired JWT, and the server rejects it with 401 `"Invalid or expired token"`.

2. **Token is null after navigation/refresh:** Since tokens are in-memory only, if the user navigated directly to the marketing page or refreshed while on it, and the AuthContext refresh flow hasn't completed before AgentChatView fires its first request, `getAccessToken()` returns `null`. The conditional spread `...(token ? { Authorization: ... } : {})` then sends NO Authorization header at all, and the server returns 401 `"Access token required"`.

3. **Race condition on initial load:** The marketing page renders AgentChatView immediately. If the user triggers a chat message before the AuthContext has finished the refresh-token-to-access-token exchange, the in-memory token is still null.

**The conditional header pattern** (`token ? { Authorization: ... } : {}`) is itself a design smell — it silently omits the auth header when the token is null instead of failing early or triggering a refresh. This means any token-null scenario degrades silently into a 401 rather than surfacing the real issue to the user.

## Recommended Fix

Two changes needed:

1. **Add token refresh before proxy call (primary fix):** In AgentChatView, before calling `/api/openai-proxy`, check `isTokenExpiringSoon()` and if true, await a token refresh via the AuthContext's refresh mechanism. This prevents both the expired-token and null-token scenarios.

2. **Remove the conditional header pattern (secondary fix):** Change the fetch call to require a token — if `getAccessToken()` returns null, throw an error or trigger a refresh instead of silently sending an unauthenticated request. The current pattern masks the real failure.

Minimal code change (option 1 — guard before fetch):
```typescript
const token = getAccessToken();
if (!token || isTokenExpiringSoon()) {
  // Trigger token refresh via AuthContext before proceeding
  await refreshAccessToken(); // needs to be wired from AuthContext
}
const validToken = getAccessToken();
if (!validToken) {
  throw new Error('Authentication required — please log in again');
}
```

No server-side changes needed. The proxy route and auth middleware are correctly implemented.
