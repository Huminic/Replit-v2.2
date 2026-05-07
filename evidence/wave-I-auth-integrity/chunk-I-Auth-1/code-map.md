# Chunk I-Auth-1 — Auth/RBAC Code Path Map (READ-ONLY)

**Date:** 2026-05-07
**Branch:** `wave/1-core/I-auth-integrity`
**Scope:** `server/routes/auth.ts`, `server/auth.ts`, `server/lib/refreshTokenRotation.ts`, `client/src/lib/rbac.ts`, `client/src/contexts/AuthContext.tsx`, `client/src/pages/login.tsx`, `client/src/pages/forgot-password.tsx`, `client/src/pages/reset-password.tsx`, `shared/schema.ts` (users + sessions + activity_log only).

---

## 1. Authentication primitives — `server/auth.ts`

| Item | Value | Source |
|---|---|---|
| Refresh cookie name | `nexxus_refresh` | `server/auth.ts:5` |
| Cookie flags | `httpOnly: true`, `sameSite: 'strict'`, `path: '/api/auth'`, `secure` only when `NODE_ENV=production`, 7-day `maxAge` | `server/auth.ts:7-15` |
| JWT secret env | `JWT_SECRET` (required — process throws on boot if missing) | `server/auth.ts:34-38` |
| Access-token expiry | `1h` (3600 s) | `server/auth.ts:39, 41` |
| Refresh-token expiry | `7d` (604800000 ms) | `server/auth.ts:40, 42` |
| Token typing | `type: 'access' | 'refresh'` embedded in payload + verified in `verifyToken` | `server/auth.ts:69-83` |
| `authenticateToken` middleware | Reads `Authorization: Bearer …`, verifies as access type, hydrates `req.user` from `storage.getUser/getRole/getOrganization`. Honors `payload.organizationId` over `user.organizationId` (enables session-only org switch). | `server/auth.ts:93-133` |
| Failure modes | 401 on missing token, decode failure, missing user, missing role/org | `server/auth.ts:97, 105-107, 113-115, 130-132` |
| `requireRole(maxLevel)` | Compares `req.user.roleLevel` vs `maxLevel` (1=super_admin, 2=partner_admin, 3=org_admin, …) | `server/auth.ts:135-147` |

---

## 2. Login flow — `POST /api/auth/login` (`server/routes/auth.ts:40-184`)

### Happy path

1. Parse `{ email, password }` from body. 400 if either missing (`:44-46`).
2. `storage.getUserByEmail(email.toLowerCase())`. 401 generic on miss (`:48-51`).
3. **`if (!user.isActive)` → 401 "Account is deactivated"** (`:53-55`). Note: tied to `users.is_active` boolean column (`shared/schema.ts:42`).
4. `bcrypt.compare(password, user.password)`. On mismatch, fire-and-forget `createActivityLog({ action: "login_failed", entityId: email.toLowerCase(), metadata: { category: "security", reason: "invalid_password" } })` AND, if `>= 5` failed attempts in last hour, create a `security_alert` notification for one org admin (level ≤ 3). Return generic 401 (`:57-90`).
5. Resolve role + org. 500 on either missing (`:92-97`).
6. Mint access + refresh tokens with payload `{ userId, organizationId, roleId }` (`:99-106`).
7. **`storage.deleteUserSessions(user.id)` — wipes ALL sessions for this user** (`:112`). Comment: prevents UNIQUE-violation race when same user logs in twice within 1-second JWT-iat granularity. Side-effect: a successful login on browser A invalidates browser B's refresh cookie immediately.
8. Insert new session row, set httpOnly refresh cookie (`:114-121`).
9. Compute `accessibleOrganizations` based on role level (super → all; partner → group root + children; org_admin with `additionalOrgIds` → that set) (`:123-157`).
10. Return `{ accessToken, expiresIn, user, accessibleOrganizations }` (`:159-179`).

### Edge cases / observations

- No login lockout / `failed_login_count` column. The schema lacks a counter (verified at `shared/schema.ts:33-51` — fields are `id, email, password, firstName, lastName, roleId, organizationId, profilePhotoUrl, isActive, resetToken, resetTokenExpiry, additionalOrgIds, createdAt, updatedAt`).
- "Lockout" surface that does exist: `authLimiter` is `express-rate-limit` keyed by client IP, 15-minute window, default `max: 100` from `AUTH_RATE_LIMIT_MAX` (`:18-28`). Applied to `/login`, `/forgot-password`, `/reset-password`. **NOT** applied to `/refresh` or `/me` or `/switch-org`.
- The "5 failed attempts → notification" is a notification only; it does NOT prevent login. So a correct password after 5 wrong attempts still succeeds.
- `createActivityLog` is fire-and-forget (`.catch(() => {})`). Failures are silently swallowed.

---

## 3. Logout — `POST /api/auth/logout` (`server/routes/auth.ts:186-196`)

- Requires `authenticateToken` (so a logged-out user calling logout returns 401, not 200). On success: `storage.deleteUserSessions(req.user.id)` + `clearRefreshCookie(res)`.
- Edge case: a stale-token cross-tab logout silently 401s on the API but the client `AuthContext` clears state and redirects regardless (`AuthContext.tsx:160-182`).

---

## 4. Token refresh — `POST /api/auth/refresh` (`server/routes/auth.ts:198-237` + `server/lib/refreshTokenRotation.ts`)

### Inputs
- Primary: `getRefreshTokenFromCookie(req)` → `req.cookies.nexxus_refresh`.
- **Legacy fallback:** `req.body.refreshToken` (per CLAUDE.md cross-ref this is `I-238` — accepts refresh token in body, less secure than httpOnly-only).

### `rotateRefreshToken` decision tree (`refreshTokenRotation.ts:198-298`)

```
refreshToken absent ───────────────► 400 "Refresh token required"

session row missing OR expired
    │
    ├─ refresh JWT verifies AND a session for that user
    │  exists with createdAt < 10s ago ──────► 200 OK, mint
    │                                          access token
    │                                          against the
    │                                          peer's session
    │                                          (concurrent-rotation
    │                                          fallback, "set"
    │                                          cookie)
    └─ otherwise ─────────────────────► 401 "Invalid or expired
                                              refresh token",
                                              "clear" cookie

session row present AND not expired
    │
    ├─ JWT signature invalid ─► deleteSession(id) + 401
    │                            "Invalid refresh token", clear cookie
    │
    ├─ user row missing ─────► 401 "User not found", no cookie change
    │
    ├─ deleteSession(old) → createSession(new)
    │  │
    │  ├─ unique-violation (SQLSTATE 23505) on insert
    │  │  AND a recent (< 10s) session exists ► 200 OK via fallback
    │  │
    │  ├─ unique-violation but no recent session ► throw → 500
    │  │  "Token refresh failed"
    │  │
    │  └─ insert succeeds ─────────────► 200 OK, set new cookie
```

### Edge cases / observations

- `RECENT_SESSION_WINDOW_MS = 10_000` — anything older counts as the "OLD-token replay" path → 401.
- A 401 from `/refresh` clears the refresh cookie. Once cleared, the user is forced to re-login.
- I-238 (legacy body fallback) is on `:201`. `refreshToken = getRefreshTokenFromCookie(req) || req.body?.refreshToken`.
- Loud catch (`:230-236`) on the route adapter — pre-fix was a swallowed error returning 500 invisibly. After-fix logs `[auth/refresh] unhandled error:` then returns 500.
- Note: `/refresh` is **NOT rate-limited** (no `authLimiter`).

---

## 5. Forgot password — `POST /api/auth/forgot-password` (`server/routes/auth.ts:348-388`)

1. Reads `email` from body. 400 if missing.
2. `storage.getUserByEmail(email)` — note: NOT `.toLowerCase()` here, unlike login (`:353` vs `:48`). **POTENTIAL ISSUE: case-sensitivity mismatch.** If a user registered with mixed-case email, login lowercases input but forgot-password does not. (Need to check `getUserByEmail` to see whether it lowercases internally.)
3. If user found: generate 32-byte random token, SHA-256 it, store hash in `users.reset_token` with expiry `Date.now() + 60 minutes` (`:355-359`). **Server expiry is 60 minutes.**
4. Check CommGate: `org.outboundEnabled && org.emailEnabled` (`:362`). If closed: just log "CommGate blocked" and skip send; if open and `RESEND_API_KEY` present: send Resend email with link `${proto}://${host}/reset-password?token=${token}` (token is the raw 32-byte hex, not the hash) (`:367-377`).
5. Always returns 200 `"If an account exists with that email, a reset link has been sent."` regardless of whether the user existed. (Email enumeration protection.)
6. Errors caught and rewritten to the same generic 200 (`:384-387`).

### Edge cases

- No `req.protocol` / `req.get('host')` validation. If a request reaches this endpoint with an unexpected `Host:` header (e.g. proxy misconfig), the reset link could point to the wrong domain. Express trust-proxy setting governs `req.protocol`.
- Fire-and-forget on Resend failure: if `resend.emails.send` throws, the catch block (`:384-387`) swallows it and the user sees the same success message. The token IS still stored (DB write happened first). So the user can have a valid token but never receive the email. There is NO record in `activity_log` for this — only `console.log` (`:377`).
- The `resetToken` is updated via `storage.updateUser(user.id, { resetToken: tokenHash, resetTokenExpiry: expiry } as any)`. `as any` because `updateUser`'s schema-derived insert type does not include these fields by default. The DB WILL accept it (columns exist on the table per `shared/schema.ts:43-44`).
- If a previous unused reset token exists, this overwrites it. Only one active token per user.

---

## 6. Reset password — `POST /api/auth/reset-password` (`server/routes/auth.ts:390-432`)

1. Body: `{ token, password }`. 400 if either missing.
2. Server-side strength validation: `>= 8` chars, `[A-Z]`, `[0-9]`, `[^A-Za-z0-9]`. 400 with specific message on each failure (`:395-398`).
3. SHA-256 hash the incoming token, look up via `storage.findUserByResetToken(tokenHash)` (`:402-405`).
4. **Expiry check:** if `!found.resetTokenExpiry || resetTokenExpiry < now` → 400 "Reset token has expired" (`:406-408`).
5. `bcrypt.hash(password, 10)`, `storage.updateUser(found.id, { password: hashedPassword })`, `storage.clearResetToken(found.id)` (`:410-412`).
6. **`storage.deleteUserSessions(found.id)`** — invalidates all existing sessions, forcing re-login (`:415`).
7. Fire-and-forget activity log: `action: "password_reset_completed", entityType: "user", entityId: found.id, metadata: { category: "security", email: found.email }` (`:417-424`).
8. 200 "Password has been reset successfully." (`:427`). Errors → 500 (`:428-431`).

---

## 7. Change password — `POST /api/auth/change-password` (`server/routes/auth.ts:434-469`)

- `authenticateToken` required.
- Validates `currentPassword` via `bcrypt.compare`. Same strength rules as reset.
- **Does NOT delete sessions.** (Compare with reset-password which DOES.) So an attacker with a stolen access token who knows the user's current password can change the password without invalidating their own access token. Lower-impact than the reset path but worth noting.
- No activity-log entry on success.

---

## 8. CRITICAL UI/SERVER MISMATCH — reset-password expiry

| Layer | Expiry value | Source |
|---|---|---|
| Server token expiry | **60 minutes** | `server/routes/auth.ts:358` (`new Date(Date.now() + 60 * 60 * 1000)`) |
| Client countdown timer | **15 minutes** | `client/src/pages/reset-password.tsx:62` (`useState(15 * 60)`) |
| Client copy | "15 minute limit" | `client/src/pages/reset-password.tsx:244` |
| Comment | "15-minute token expiration countdown (AC 11.1.3)" | `client/src/pages/reset-password.tsx:64-65` |

**Result:** The client UI tells the user the link expires in 15 minutes and visually expires the token at 15 minutes (forcing the user to a "Reset link expired" UI), even though the server still considers the token valid for another 45 minutes.

A user who is on the reset page but takes >15 minutes will see the "expired" screen and be sent back to forgot-password, even if they could still successfully POST to /api/auth/reset-password manually. This is purely a client-side UI lockout, not a server enforcement gap. **It is, however, a strong root-cause candidate for an operator-reported "the reset link won't work" symptom.**

Cross-ref I-165 ("Forgot/reset password FE — 11 states untested"). This mismatch is one of the FE states that has not been tested under the current expiry-window setting.

---

## 9. Session storage methods — `server/storage.ts`

| Method | Lines | Behavior |
|---|---|---|
| `getUserByEmail(email)` | `258-261` | **Exact-match lookup, NO lowercasing.** `where(eq(users.email, email))`. Login lowercases the input before calling; forgot-password does NOT. |
| `deleteUserSessions(userId)` | `372-374` | DELETE FROM sessions WHERE user_id = ? — wipes ALL sessions for the user |
| `getMostRecentSessionForUser(userId)` | `376-382` | SELECT … ORDER BY created_at DESC LIMIT 1 |
| `findUserByResetToken(tokenHash)` | `1590-1593` | SELECT … WHERE reset_token = ? — exact match on stored SHA-256 hash |
| `clearResetToken(userId)` | `1595-1599` | UPDATE users SET reset_token = NULL, reset_token_expiry = NULL, updated_at = now() |
| `countRecentSecurityEvents(action, entityId, since)` | `1601-1610` | SELECT count(*) FROM activity_log WHERE action = ? AND entity_id = ? AND created_at >= ? |
| `createActivityLog(entry)` | `1193-…` | INSERT INTO activity_log |

`activity_log` schema (`shared/schema.ts:268-279`):

```
id            uuid PK
user_id       uuid (nullable, FK users)
organization_id uuid NOT NULL FK orgs
action        text NOT NULL
entity_type   text
entity_id     text  -- used as the lookup key for failed-login enumeration
metadata      jsonb
created_at    timestamptz
```

**There is NO standalone `audit_log` table.** The bookend OPENING and the ticket spec describe an `audit_log`; in practice the auth code writes to `activity_log` with `metadata.category = "security"`. Filter for those rows in Chunk I-Auth-2.

---

## 10. Client AuthContext — `client/src/contexts/AuthContext.tsx`

- Access token is stored in memory (`tokenStore` + React state `accessTokenState`). Never in `localStorage`.
- Refresh cookie is httpOnly; client never reads it.
- `isAuthenticated = !!user && !!accessTokenState` (`:376`). Both must be set or all protected routes redirect.
- On mount (`:289-338`): tries `tryRefreshToken()`. If success: pulls token from `tokenStore`, sets `accessTokenState`, then `fetchUser`. **The "deep-link bootstrap" bugfix at `:306-313` explicitly notes that BEFORE the fix, `tryRefreshToken` updated the module variable but NOT React state, so `isAuthenticated` stayed false even after a successful refresh.**
- Auto-refresh interval: every 60 s, calls `refreshToken()` if `isTokenExpiringSoon()` (`:343-353`).
- Cross-tab logout: `BroadcastChannel('nexxus_auth')` posts `'logout'`. Receiver clears auth and redirects to `/login?expired=true` (`:355-370`).
- Login error handling (`:111-123`): tries to parse JSON `{ message }` or `{ error }`; falls back to `response.statusText`. Generic "Login failed" only as last resort.

---

## 11. RBAC client helpers — `client/src/lib/rbac.ts`

| Helper | Result | Lines |
|---|---|---|
| `canAccessSystem(role)` | true for super_admin, partner_admin, org_admin | `:18-20` |
| `canSwitchOrgs(role)` | true for super_admin, partner_admin only | `:22-24` |
| `canAccessManagement(role)` | **true for super_admin ONLY** | `:26-28` |
| `canAccessSection(role, section, userPermissions)` | falls back to defaults if no per-user permissions | `:30-44` |

Note: `canAccessManagement` returns true ONLY for `super_admin`. This is consistent with PR #6 evidence cited in the bookend OPENING.

---

## 12. Hypothetical failure modes (root-cause candidates) — to test in subsequent chunks

| Candidate | Where it would be visible | Test in chunk |
|---|---|---|
| Operator `users.is_active = false` | Login returns 401 "Account is deactivated" | I-Auth-2 (DB read) |
| Operator's reset_token still set / unconsumed | Reset path may collide; or token already expired | I-Auth-2 (DB read) |
| Operator's password hash truncated/null | `bcrypt.compare` throws → caught by outer `try/catch` → 500 "Internal server error" (note: not 401) | I-Auth-2 (length check) |
| Email-case mismatch on forgot-password | `getUserByEmail(email)` (without lowercasing) misses real row → 200 generic but no email sent | I-Auth-2 + I-Auth-3 logs |
| Reset token issued but Resend send failed (CommGate or other) | Token stored but no email; user has no link | I-Auth-3 logs |
| 15-min-vs-60-min UI lockout | User on reset page past 15 min sees "expired" but server-side token is still good | Operator-confirm symptom |
| AUTH_RATE_LIMIT_MAX too low / IP rotated | 429 "Too many attempts" — would surface in pm2 logs | I-Auth-3 logs |
| `deleteUserSessions` on parallel login wiped a fresh cookie | Login succeeds but next refresh 401s. Only relevant if user actually opened multiple browsers/tabs that re-logged in | I-Auth-3 logs |
| `JWT_SECRET` rotated | All existing refresh tokens fail signature → forced re-login. Would also affect EVERY user at once. | I-Auth-3 logs (boot line) |
| Org `outboundEnabled = false` or `emailEnabled = false` for operator's home org | Forgot-password silently skips Resend, logs "CommGate blocked email delivery" | I-Auth-2 (org row) + I-Auth-3 logs |

---

## 13. Files NOT in scope but cross-checked

- `server/middleware/` — only `entitlementCheck.ts` and `validate.ts`. Confirmed: no auth middleware here. (Bookend OPENING also states this.)
- `server/routes/users.ts` — `PATCH /api/users/:id` self-deactivate path mentioned by I-249. Out of scope for this read-only audit; I-249 is OPEN.
- `client/src/pages/management.tsx` — RBAC redirect at `:60-65` per PR #6 evidence; not re-walked here (already proven by `evidence/stabilization-sprint-2026-05-01/p0-pr-merge-verification/`).

---

## Conclusion of code-map chunk

- The auth code paths are **internally consistent on the server**: login, logout, refresh, forgot, reset, change-password all share the same primitives and the same audit shape.
- **One concrete UI/server inconsistency** identified: client reset-password expiry timer (15 min) does not match the server token expiry (60 min). This is a strong candidate root cause for an operator who could not complete a reset-password flow within the displayed window.
- **One known security debt** confirmed: I-238 legacy `req.body.refreshToken` fallback at `server/routes/auth.ts:201`.
- **One concurrent-rotation race** is documented and fixed (refreshTokenRotation.ts) — operator should not be hit by it now.
- No password-attempt lockout exists; rate limiter (`authLimiter`) is per-IP with `max=100` over 15 minutes. Password attempts that hit `>= 5` only generate a notification.
- Email-case mismatch between login (`.toLowerCase()`) and forgot-password (raw) is a candidate for a "didn't get the reset email" symptom — to verify in I-Auth-2 against `getUserByEmail` source and the operator's stored email.

Next chunk (I-Auth-2) will SELECT the operator's user row(s) and recent activity_log entries to test these candidates against reality.
