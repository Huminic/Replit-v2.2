# Auth Domain Test Plan (T-002)

Generated: 2026-03-31
Source: Code analysis of login.tsx, forgot-password.tsx, reset-password.tsx, Sidebar.tsx, rbac.ts, server/auth.ts, server/routes/auth.ts, ProtectedRoute.tsx, useSessionTimeout.ts, SessionTimeoutDialog.tsx, App.tsx

---

## 1. Role Inventory

| Role           | Level | System | Manage | Sales | Service | Marketing | TeamBox | AI Chat | Org Switch |
|----------------|-------|--------|--------|-------|---------|-----------|---------|---------|------------|
| super_admin    | 1     | YES    | YES*   | YES   | YES     | YES       | YES     | YES     | All orgs   |
| partner_admin  | 2     | YES    | NO     | YES   | YES     | YES       | YES     | YES     | Group orgs |
| org_admin      | 3     | YES    | NO     | YES   | YES     | YES       | YES     | YES     | additionalOrgIds only |
| executive      | 4     | NO     | YES*   | YES   | YES     | YES       | YES     | YES     | NO         |
| sales_manager  | ?     | NO     | NO     | YES   | NO      | NO        | YES     | YES     | NO         |
| sales          | ?     | NO     | NO     | YES   | NO      | NO        | YES     | YES     | NO         |
| service        | ?     | NO     | NO     | NO    | YES     | NO        | YES     | YES     | NO         |
| marketing      | ?     | NO     | NO     | NO    | NO      | YES       | YES     | YES     | NO         |

*Note: `canAccessManagement()` returns true only for super_admin. However `defaultSectionsByRole` gives executive access to management. The sidebar uses `canAccessSection()` which checks `defaultSectionsByRole` — so executive DOES see Management in the sidebar. `canAccessManagement()` is defined but not referenced in Sidebar.tsx. The existing test 1.8 asserts executive sees "Manage" which confirms this.

System access: super_admin, partner_admin, org_admin only (per `canAccessSystem()`).

Org switching: super_admin (all), partner_admin (group root + children), org_admin (home + additionalOrgIds). Levels > 3 get `accessibleOrganizations: null`.

---

## 2. Interactive Element Inventory

### 2.1 Login Page (`/login` — client/src/pages/login.tsx)

| Element | Type | Selector/ID | Behavior |
|---------|------|-------------|----------|
| Email input | text input | `#email`, type="email" | Required, placeholder "Enter your email", disabled while submitting |
| Password input | password input | `#password`, type="password" | Required, placeholder "Enter your password", disabled while submitting |
| Sign in button | submit button | type="submit" | Disabled when submitting or when email/password empty. Shows spinner + "Signing in..." while submitting |
| Forgot password link | link | `a[href="/forgot-password"]` | Navigates to /forgot-password |
| Session expired alert | alert | `[data-testid="alert-session-expired"]` | Shows when sessionStorage `nexxus_session_expired` === "true". Amber colored. Dismissed on input change |
| Error alert | alert | Alert variant="destructive" | Shows `error` from AuthContext. Red colored |
| Loading spinner | loader | Loader2 spinner | Full-screen spinner while `authLoading` is true |
| Background wallpaper | image | random from 9 wallpapers | Fades in on load |
| Branding "Nexxus" | heading | h1 | Static |
| Subtitle "Customer portal" | text | p | Static |
| Footer "By huminic" | text | p | Static |

### 2.2 Forgot Password Page (`/forgot-password` — client/src/pages/forgot-password.tsx)

| Element | Type | Selector/ID | Behavior |
|---------|------|-------------|----------|
| Back to login link | link | `a` with ArrowLeft icon | Navigates to /login |
| Email input | text input | `#email`, type="email" | Required, autofocus, placeholder "Enter your email", disabled while pending |
| Send reset instructions button | submit button | type="submit" | Disabled when pending or email empty. Shows spinner + "Sending..." while pending |
| Error alert | alert | Alert variant="destructive" | Shows mutation error message |
| Success state — CheckCircle icon | icon | green circle with CheckCircle | Shown on mutation success |
| Success state — "Check your email" text | heading | h2 | Shows submitted email address |
| Return to login button | button | Button variant="outline" with Mail icon | Navigates to /login (shown on success) |
| Instructions text | paragraph | p | "Enter your email address and we'll send you instructions..." |
| Branding "Nexxus" | heading | h1 | Static |
| Subtitle "Reset your password" | text | p | Static |
| Footer "By huminic" | text | p | Static |

### 2.3 Reset Password Page (`/reset-password?token=...` — client/src/pages/reset-password.tsx)

| Element | Type | Selector/ID | Behavior |
|---------|------|-------------|----------|
| Back to login link | link | `a` with ArrowLeft icon | Navigates to /login |
| Token expiry countdown | text | Clock icon + "Link expires in MM:SS" | 15-minute countdown. Yellow < 5min, Red < 2min |
| New Password input | password input | `#password` | Required, autofocus, disabled while pending |
| Password visibility toggle | button | Eye/EyeOff icon button | Toggles password field type |
| Confirm Password input | password input | `#confirmPassword` | Required, disabled while pending |
| Confirm password visibility toggle | button | Eye/EyeOff icon button | Toggles confirm password field type |
| Password strength bar | visual indicator | 4 segments | Weak (1/4 red), Fair (2/4 orange), Good (3/4 yellow), Strong (4/4 green) |
| Strength label | text | span | "Weak" / "Fair" / "Good" / "Strong" |
| Requirement: 8+ characters | checklist item | CheckCircle or empty circle | Green when met |
| Requirement: 1 uppercase | checklist item | CheckCircle or empty circle | Green when met |
| Requirement: 1 number | checklist item | CheckCircle or empty circle | Green when met |
| Requirement: 1 special char | checklist item | CheckCircle or empty circle | Green when met |
| Requirement: passwords match | checklist item | CheckCircle or empty circle | Green when met |
| Reset password button | submit button | type="submit" | Disabled when pending or either field empty. Shows spinner + "Updating password..." |
| Validation error alert | alert | Alert variant="destructive" | Shows client-side validation or server error |
| No-token state — XCircle icon | icon | red circle with XCircle | Shown when token param missing |
| No-token state — "Invalid reset link" | heading/text | h2 | With explanation text |
| Expired-token state — Clock icon | icon | red circle with Clock | Shown when 15-min countdown hits 0 |
| Expired-token state — "Reset link expired" | heading/text | h2 | With explanation text |
| Request new reset link button | button | Button variant="outline" | Navigates to /forgot-password (shown on no-token/expired) |
| Success state — CheckCircle icon | icon | green circle | Shown on mutation success |
| Success state — "Password updated" | heading | h2 | With success text |
| Success state — Sign in button | button | primary styled | Navigates to /login |
| Branding "Nexxus" | heading | h1 | Static |
| Subtitle "Set new password" | text | p | Static |
| Footer "By huminic" | text | p | Static |

### 2.4 Sidebar Navigation (`client/src/components/layout/Sidebar.tsx`)

| Element | Type | data-testid | Behavior |
|---------|------|-------------|----------|
| AI Chat item | nav button | `sidebar-item-ai-chat` | Navigates to /, opens flyout panel |
| TeamBox item | nav button | `sidebar-item-teambox` | Navigates to /teambox, opens flyout panel |
| Sales item | nav button | `sidebar-item-sales` | Navigates to /sales, opens flyout panel. RBAC filtered |
| Service item | nav button | `sidebar-item-service` | Navigates to /service, opens flyout panel. RBAC filtered |
| Marketing item | nav button | `sidebar-item-marketing` | Navigates to /marketing, opens flyout panel. RBAC filtered |
| Manage item | nav button | `sidebar-item-management` | Navigates to /management, opens flyout panel. RBAC filtered |
| System item | nav button | `sidebar-item-system` | Navigates to /settings/system, opens flyout panel. RBAC: admin roles only |
| Logout button | button | `button-logout` | Calls `logout()` from AuthContext |
| Expand sidebar button | button | `button-show-sidebar` | Shows when sidebar collapsed (40px), expands to 72px |
| Toggle submenu button | button | `button-toggle-submenu` | Pins/unpins flyout panel |

### 2.5 Session Timeout Dialog (`SessionTimeoutDialog.tsx`)

| Element | Type | Behavior |
|---------|------|----------|
| Dialog overlay | modal | Opens 2 minutes before timeout. Cannot be dismissed by clicking outside or pressing Escape |
| "Session Expiring" title | heading | Static |
| Countdown display | text | Shows MM:SS countdown |
| Stay Logged In button | button | Dismisses warning, resets idle timer |
| Log Out button | button variant="outline" | Calls logout(), redirects to /login?expired=true |

---

## 3. API Endpoint Inventory (Auth Domain)

| Endpoint | Method | Auth Required | Rate Limited | Role Gate |
|----------|--------|---------------|-------------|-----------|
| `/api/auth/login` | POST | No | Yes (authLimiter: 100/15min) | None |
| `/api/auth/logout` | POST | Yes (authenticateToken) | No | None |
| `/api/auth/refresh` | POST | No (uses httpOnly cookie) | No | None |
| `/api/auth/me` | GET | Yes (authenticateToken) | No | None |
| `/api/auth/switch-org` | POST | Yes (authenticateToken) | No | Level 1-3 only (enforced in handler) |
| `/api/auth/forgot-password` | POST | No | Yes (authLimiter) | None |
| `/api/auth/reset-password` | POST | No | Yes (authLimiter) | None |
| `/api/auth/change-password` | POST | Yes (authenticateToken) | No | None |

### Role-Gated API Endpoints (requireRole middleware)

| Endpoint | Method | requireRole(level) | Meaning |
|----------|--------|-------------------|---------|
| `/api/integrations/provision` | POST | 2 | partner_admin+ |
| `/api/vin/users/:orgId` | GET | 3 | org_admin+ |
| `/api/billing/summary` | GET | 3 | org_admin+ |
| `/api/billing/usage` | GET | 3 | org_admin+ |
| `/api/billing/invoices` | GET | 3 | org_admin+ |
| `/api/billing/plan` | GET | 3 | org_admin+ |
| `/api/billing/plans` | GET | 3 | org_admin+ |
| `/api/billing/entitlements` | GET | 3 | org_admin+ |
| `/api/entitlements/check` | POST | 3 | org_admin+ |
| `/api/billing/topup` | POST | 3 | org_admin+ |
| `/api/settings/org` | PATCH | 3 | org_admin+ |
| `/api/sync/backfill` | POST | 2 | partner_admin+ |
| `/api/sync/delta` | POST | 2 | partner_admin+ |
| `/api/sync/metrics` | POST | 2 | partner_admin+ |
| `/api/agents` | POST | 3 | org_admin+ |
| `/api/agents/:id` | PATCH | 3 | org_admin+ |
| `/api/agents/:id/triggers` | GET | 3 | org_admin+ |
| `/api/agents/:id/triggers` | PATCH | 3 | org_admin+ |
| `/api/agents/:id` | DELETE | 3 | org_admin+ |
| `/api/hunches/generate` | POST | 3 | org_admin+ |
| `/api/conversations/:id` | DELETE | 3 | org_admin+ |
| `/api/users` | GET | 3 | org_admin+ |
| `/api/users` | POST | 3 | org_admin+ |
| `/api/users/:id` | PATCH | 3 | org_admin+ |
| `/api/users/:id/reset-password` | POST | 3 | org_admin+ |
| `/api/users/invite` | POST | 3 | org_admin+ |
| `/api/widgets` | POST | 3 | org_admin+ |
| `/api/widgets/:id` | PATCH | 3 | org_admin+ |
| `/api/widgets/:id` | DELETE | 3 | org_admin+ |
| `/api/campaigns` | POST | 3 | org_admin+ |
| `/api/campaigns/:id` | PATCH | 3 | org_admin+ |
| `/api/campaigns/:id/execute` | POST | 3 | org_admin+ |
| `/api/campaigns/:id/stop` | POST | 3 | org_admin+ |
| `/api/campaigns/:id/upload-csv` | POST | 3 | org_admin+ |
| `/api/organizations` | POST | 2 | partner_admin+ |
| `/api/organizations/:id` | PATCH | 3 | org_admin+ |
| `/api/organizations/:id/slug` | PATCH | 3 | org_admin+ |
| `/api/integrations/:orgId/vin-config` | GET | 3 | org_admin+ |
| `/api/integrations/:orgId/vin-config` | PATCH | 3 | org_admin+ |
| `/api/sms-blacklist` | GET | 3 | org_admin+ |
| `/api/sms-blacklist/:id` | DELETE | 3 | org_admin+ |
| `/api/documents/:id` | DELETE | 3 | org_admin+ |
| `/api/usage` | GET | 3 | org_admin+ |
| `/api/usage/summary` | GET | 3 | org_admin+ |

---

## 4. Route Protection Inventory

All routes inside `<ProtectedRoute>` in App.tsx redirect to `/login` when unauthenticated:

| Route | Page | Additional RBAC |
|-------|------|-----------------|
| `/` | MainPage (AI Chat) | None (all authenticated users) |
| `/teambox` | TeamboxPage | None |
| `/my-work` | MyWorkPage | None (hidden from sidebar via I-127) |
| `/sales` | SalesPage | Sidebar hides for service, marketing roles |
| `/service` | ServicePage | Sidebar hides for sales, sales_manager, marketing roles |
| `/marketing` | MarketingPage | Sidebar hides for sales, sales_manager, service roles |
| `/management` | ManagementPage | Sidebar hides for sales, sales_manager, service, marketing roles |
| `/agents` | AgentsPage | Not in sidebar (accessible via direct URL) |
| `/insights` | InsightsPage | Not in sidebar |
| `/settings/system` | SettingsPage | Sidebar: admin roles only (canAccessSystem) |
| `/settings/billing/*` | Billing pages | Not in sidebar |
| `/settings/org-wizard` | OrgWizardPage | Not in sidebar |
| `/settings` | SettingsPage | Not in sidebar |
| `/profile` | ProfilePage | Not in sidebar |
| `/usage` | UsagePage | Not in sidebar |

Public routes (no auth required): `/login`, `/forgot-password`, `/reset-password`, `/w/:slug`, `/p/:slug`

**Important gap:** No server-side or ProtectedRoute-level requiredLevel is applied to individual pages. The only client-side RBAC is sidebar visibility filtering. A user who knows the URL can navigate directly to any protected route (e.g., sales user can type `/management` in the browser).

---

## 5. JWT/Token Lifecycle

| Aspect | Value | Source |
|--------|-------|--------|
| Access token expiry | 1 hour | `ACCESS_TOKEN_EXPIRY = "1h"` in server/auth.ts |
| Refresh token expiry | 7 days | `REFRESH_TOKEN_EXPIRY = "7d"` in server/auth.ts |
| Refresh cookie name | `nexxus_refresh` | server/auth.ts |
| Cookie httpOnly | true | server/auth.ts |
| Cookie secure | true in production | server/auth.ts |
| Cookie sameSite | strict | server/auth.ts |
| Cookie path | `/api/auth` | server/auth.ts |
| Cookie maxAge | 7 days | server/auth.ts |
| Token type enforcement | access vs refresh token types checked | `verifyToken(token, 'access')` / `'refresh'` |
| Token rotation | On refresh, old session deleted, new refresh token issued | server/routes/auth.ts refresh handler |
| Login session cleanup | All existing sessions deleted before new session created | Prevents duplicate tokens |

---

## 6. Session Timeout Behavior

| Aspect | Value | Source |
|--------|-------|--------|
| Default timeout | 30 minutes | useSessionTimeout.ts |
| Configurable options | 15, 30, 60, 120 minutes | TIMEOUT_OPTIONS array |
| Storage key | `nexxus_session_timeout_minutes` in localStorage | useSessionTimeout.ts |
| Warning lead time | 2 minutes before logout | WARNING_LEAD_SECONDS = 120 |
| Activity events tracked | mousemove, mousedown, keydown, touchstart, scroll | ACTIVITY_EVENTS array |
| Activity throttle | 5 seconds | Prevents excessive timer resets |
| Warning dialog | Modal, cannot dismiss via outside click or Escape | SessionTimeoutDialog.tsx |
| "Stay Logged In" action | Resets idle timer, dismisses warning | dismissWarning() |
| Auto-logout flag | `nexxus_session_expired` in sessionStorage | Checked by login page |

---

## 7. Error States

| Error | Trigger | Server Response | Client Display |
|-------|---------|-----------------|----------------|
| Wrong password | Invalid credentials on login | 401 `"Invalid email or password"` | Error alert on login page |
| Nonexistent email | Email not in DB | 401 `"Invalid email or password"` | Error alert (no enumeration) |
| Deactivated account | `user.isActive === false` | 401 `"Account is deactivated"` | Error alert |
| Empty email/password | Missing fields | 400 `"Email and password are required"` | Client prevents submit (required + disabled logic) |
| Rate limiting | >100 requests in 15 minutes | 429 `"Too many attempts, please try again later"` | Error alert |
| Failed login security alert | 5+ failed logins in 1 hour for same email | Notification created for org admins (level <= 3) | No direct client display (backend notification) |
| Invalid reset token | Token not found in DB | 400 `"Invalid or expired reset token"` | Error alert on reset page |
| Expired reset token (server) | Token expiry passed | 400 `"Reset token has expired"` | Error alert on reset page |
| Expired reset token (client) | 15-min countdown reaches 0 | N/A (client-side only) | Shows "Reset link expired" state with Clock icon |
| No token param | `/reset-password` without `?token=` | N/A (client-side) | Shows "Invalid reset link" state with XCircle |
| Weak password (reset) | Fails server validation rules | 400 with specific message | Error alert |
| Weak password (change) | Fails server validation rules | 400 with specific message | Error alert |
| Password mismatch (reset) | Client-side confirm != password | N/A (client-side) | Validation error alert |
| Invalid refresh token | Token tampered or expired session | 401 `"Invalid or expired refresh token"` | Redirected to login |
| Token type mismatch | Refresh token used as access or vice versa | 401 `"Invalid token type"` | Redirected to login |
| User not found (auth) | User deleted after token issued | 401 `"User not found"` | Redirected to login |
| Org switch forbidden (low role) | Level > 3 attempts switch | 403 `"Only partner admins and above..."` | Error response |
| Org switch forbidden (wrong group) | Partner admin tries org outside group | 403 `"You can only access organizations..."` | Error response |

---

## 8. Test Cases

### 8.1 Login Page — UI Elements

| ID | Name | Priority | Steps | Expected | Role(s) | Coverage |
|----|------|----------|-------|----------|---------|----------|
| TC-AUTH-001 | Login page renders all elements | P1 | Navigate to /login | Email input, password input, sign-in button, forgot-password link, branding, footer all visible | None (unauthenticated) | NEW |
| TC-AUTH-002 | Email field accepts input | P2 | Type in email field | Value updates, placeholder disappears | None | NEW |
| TC-AUTH-003 | Password field masks input | P2 | Type in password field | Characters masked (type="password") | None | NEW |
| TC-AUTH-004 | Sign-in button disabled when fields empty | P1 | Load page without typing | Button has disabled attribute | None | NEW |
| TC-AUTH-005 | Sign-in button enabled when both fields filled | P1 | Enter email and password | Button no longer disabled | None | NEW |
| TC-AUTH-006 | Sign-in button shows spinner during submission | P2 | Submit valid credentials | Button shows Loader2 spinner + "Signing in...", inputs disabled | Any valid user | NEW |
| TC-AUTH-007 | Forgot password link navigates correctly | P1 | Click "Forgot password?" link | Browser navigates to /forgot-password | None | NEW |
| TC-AUTH-008 | Random wallpaper loads and fades in | P3 | Load login page | Background image present, opacity transitions from 0 to 1 | None | NEW |
| TC-AUTH-009 | Session expired alert shows when flag set | P2 | Set sessionStorage `nexxus_session_expired`="true", navigate to /login | Amber alert with "Your session has expired" visible | None | NEW |
| TC-AUTH-010 | Session expired alert dismissed on input | P2 | With session expired alert showing, type in email field | Alert disappears | None | NEW |
| TC-AUTH-011 | Authenticated user redirected from login | P1 | Navigate to /login while authenticated | Redirected to / | Any authenticated | NEW |

### 8.2 Login — Authentication Flow

| ID | Name | Priority | Steps | Expected | Role(s) | Coverage |
|----|------|----------|-------|----------|---------|----------|
| TC-AUTH-012 | Successful login sets httpOnly cookie | P1 | POST /api/auth/login with valid credentials | 200, Set-Cookie header contains httpOnly | super_admin | COVERED by 1.1 |
| TC-AUTH-013 | Successful login returns accessToken and user data | P1 | POST /api/auth/login with valid credentials | Response body has accessToken, expiresIn, user object with id/email/firstName/lastName/role/organization | super_admin | Partial — 1.1 checks cookie, not full payload. NEW for full payload validation |
| TC-AUTH-014 | Wrong password returns 401 | P1 | POST /api/auth/login with wrong password | 401, body contains "Invalid" | super_admin | COVERED by 1.6 |
| TC-AUTH-015 | Nonexistent email returns 401 (no enumeration) | P1 | POST /api/auth/login with unknown email | 401, same "Invalid email or password" message | None | NEW |
| TC-AUTH-016 | Deactivated account returns 401 | P1 | POST /api/auth/login with deactivated user | 401, "Account is deactivated" | Deactivated user | NEW |
| TC-AUTH-017 | Empty email returns 400 | P2 | POST /api/auth/login with no email | 400, "Email and password are required" | None | NEW |
| TC-AUTH-018 | Empty password returns 400 | P2 | POST /api/auth/login with no password | 400, "Email and password are required" | None | NEW |
| TC-AUTH-019 | Login is case-insensitive for email | P2 | POST /api/auth/login with UPPERCASE email | Login succeeds (code lowercases email) | Any valid user | NEW |
| TC-AUTH-020 | Failed login creates activity log | P2 | POST /api/auth/login with wrong password | activity_log entry created with action="login_failed" | Any valid user | NEW |
| TC-AUTH-021 | 5+ failed logins trigger security notification | P2 | Send 5+ failed login attempts for same email within 1 hour | Notification created for org admin users | Any valid user | NEW |

### 8.3 Rate Limiting

| ID | Name | Priority | Steps | Expected | Role(s) | Coverage |
|----|------|----------|-------|----------|---------|----------|
| TC-AUTH-022 | Login rate limiter triggers after threshold | P1 | Send 101+ POST /api/auth/login requests in 15 minutes | 429 "Too many attempts" | None | NEW |
| TC-AUTH-023 | Forgot password rate limiter triggers | P2 | Send 101+ POST /api/auth/forgot-password requests in 15 minutes | 429 "Too many attempts" | None | NEW |
| TC-AUTH-024 | Reset password rate limiter triggers | P2 | Send 101+ POST /api/auth/reset-password requests in 15 minutes | 429 "Too many attempts" | None | NEW |

### 8.4 Token Lifecycle

| ID | Name | Priority | Steps | Expected | Role(s) | Coverage |
|----|------|----------|-------|----------|---------|----------|
| TC-AUTH-025 | Refresh token rotation works | P1 | Login, then POST /api/auth/refresh | New accessToken returned, new Set-Cookie header with rotated refresh token | super_admin | COVERED by 1.2 |
| TC-AUTH-026 | Expired refresh token rejected | P1 | Use an expired/invalid refresh token | 401 "Invalid or expired refresh token", cookie cleared | None | NEW |
| TC-AUTH-027 | Access token type enforced | P1 | Use refresh token as Authorization Bearer | 401 "Invalid or expired token" (type mismatch) | Any | NEW |
| TC-AUTH-028 | Refresh with token type enforced | P1 | Set access token as refresh cookie | 401 on /api/auth/refresh (type mismatch) | Any | NEW |
| TC-AUTH-029 | Old session deleted on re-login | P2 | Login twice in succession | Only one session exists in DB, first refresh token invalid | Any | NEW |
| TC-AUTH-030 | Access token expires after 1 hour | P2 | Use access token after TTL | 401 "Invalid or expired token" | Any | NEW (may need mocked time) |

### 8.5 Logout

| ID | Name | Priority | Steps | Expected | Role(s) | Coverage |
|----|------|----------|-------|----------|---------|----------|
| TC-AUTH-031 | Logout clears cookie and invalidates refresh | P1 | Login, then POST /api/auth/logout, then POST /api/auth/refresh | Logout 200, subsequent refresh fails | super_admin | COVERED by 1.3 |
| TC-AUTH-032 | Sidebar logout button triggers logout | P1 | Click logout button in sidebar (data-testid="button-logout") | User logged out, redirected to /login | Any authenticated | NEW |
| TC-AUTH-033 | Logout without valid token returns 401 | P2 | POST /api/auth/logout without Authorization header | 401 "Access token required" | None | NEW |

### 8.6 Forgot Password

| ID | Name | Priority | Steps | Expected | Role(s) | Coverage |
|----|------|----------|-------|----------|---------|----------|
| TC-AUTH-034 | Forgot password page renders all elements | P1 | Navigate to /forgot-password | Email input, submit button, back-to-login link, branding visible | None | NEW |
| TC-AUTH-035 | Back to login link works | P2 | Click "Back to login" on forgot-password page | Navigates to /login | None | NEW |
| TC-AUTH-036 | Submit with valid email shows success state | P1 | Enter valid email, submit | Success state with "Check your email" heading, submitted email shown, "Return to login" button visible | None | NEW |
| TC-AUTH-037 | Submit with unknown email also shows success (no enumeration) | P1 | Enter nonexistent email, submit | Same success response — "If an account exists..." | None | NEW |
| TC-AUTH-038 | Submit with empty email prevented | P2 | Leave email empty, try to submit | Button disabled, form not submitted | None | NEW |
| TC-AUTH-039 | API returns consistent message regardless of email existence | P1 | POST /api/auth/forgot-password with valid and invalid emails | Both return 200 with same message | None | NEW |
| TC-AUTH-040 | Reset token is hashed before DB storage | P1 | Code review: server/routes/auth.ts forgot-password handler | Token hashed with SHA-256 before storage | N/A | COVERED by 1.5 (skipped/code review) |
| TC-AUTH-041 | Reset token expiry is 1 hour | P2 | Inspect server code | `expiry = new Date(Date.now() + 60 * 60 * 1000)` | N/A | NEW (code review) |
| TC-AUTH-042 | Return to login button works from success state | P2 | After successful submission, click "Return to login" | Navigates to /login | None | NEW |

### 8.7 Reset Password

| ID | Name | Priority | Steps | Expected | Role(s) | Coverage |
|----|------|----------|-------|----------|---------|----------|
| TC-AUTH-043 | Reset password page renders form with valid token | P1 | Navigate to /reset-password?token=validtoken | Form with password fields, countdown timer, strength indicator, requirements checklist visible | None | NEW |
| TC-AUTH-044 | No token shows invalid link state | P1 | Navigate to /reset-password (no token param) | Shows "Invalid reset link" with XCircle icon, "Request new reset link" button | None | NEW |
| TC-AUTH-045 | 15-minute countdown timer displays and counts down | P2 | Load reset page with valid token, wait | Timer starts at 15:00, counts down each second | None | NEW |
| TC-AUTH-046 | Countdown turns yellow at 5 minutes | P3 | Wait until 5 minutes remaining | Timer text color changes to yellow | None | NEW |
| TC-AUTH-047 | Countdown turns red at 2 minutes | P3 | Wait until 2 minutes remaining | Timer text color changes to red | None | NEW |
| TC-AUTH-048 | Countdown reaching 0 shows expired state | P1 | Wait for countdown to reach 0 | Shows "Reset link expired" with Clock icon, "Request new reset link" button | None | NEW |
| TC-AUTH-049 | Password visibility toggle works | P2 | Click eye icon on password field | Field type toggles between password and text. Icon toggles between Eye and EyeOff | None | NEW |
| TC-AUTH-050 | Confirm password visibility toggle works | P2 | Click eye icon on confirm password field | Same toggle behavior | None | NEW |
| TC-AUTH-051 | Password strength indicator — Weak | P2 | Enter "a" (only 1 criterion fails, actually 0 criteria met except none) | Strength shows "Weak", 1 red segment | None | NEW |
| TC-AUTH-052 | Password strength indicator — Fair | P2 | Enter "Aa" (uppercase + but short) | 1 of 4 criteria met, shows "Weak". Enter "Aaaaaa11" — 3 met, shows "Good" | None | NEW |
| TC-AUTH-053 | Password strength indicator — Strong | P2 | Enter "Password1!" | All 4 criteria met, 4 green segments, label "Strong" | None | NEW |
| TC-AUTH-054 | Requirements checklist updates in real-time | P1 | Type password progressively | Each requirement turns green with CheckCircle as met | None | NEW |
| TC-AUTH-055 | Passwords match indicator | P1 | Enter matching passwords in both fields | "Passwords match" checklist item turns green | None | NEW |
| TC-AUTH-056 | Client-side validation — too short | P1 | Enter 7-char password, submit | Validation error "Password must be at least 8 characters" | None | NEW |
| TC-AUTH-057 | Client-side validation — no uppercase | P1 | Enter "password1!" (no uppercase), submit | Validation error "Password must contain at least 1 uppercase letter" | None | NEW |
| TC-AUTH-058 | Client-side validation — no number | P1 | Enter "Password!" (no number), submit | Validation error "Password must contain at least 1 number" | None | NEW |
| TC-AUTH-059 | Client-side validation — no special char | P1 | Enter "Password1" (no special), submit | Validation error "Password must contain at least 1 special character" | None | NEW |
| TC-AUTH-060 | Client-side validation — mismatch | P1 | Enter different passwords, submit | Validation error "Passwords do not match" | None | NEW |
| TC-AUTH-061 | Server-side password validation mirrors client | P1 | POST /api/auth/reset-password with weak passwords | 400 with appropriate message for each rule | None | NEW |
| TC-AUTH-062 | Successful password reset shows success state | P1 | Submit valid token + strong password | Shows "Password updated" with CheckCircle, "Sign in" button | None | NEW |
| TC-AUTH-063 | Sign in button after reset navigates to login | P2 | After successful reset, click "Sign in" | Navigates to /login | None | NEW |
| TC-AUTH-064 | Reset invalidates all existing sessions | P1 | User A logged in on two devices, resets password | All sessions deleted, both devices must re-login | Any | NEW |
| TC-AUTH-065 | Activity log created on password reset | P2 | Complete password reset | activity_log entry with action="password_reset_completed" | Any | NEW |
| TC-AUTH-066 | Used reset token cannot be reused | P1 | Use same reset token twice | Second attempt returns 400 "Invalid or expired reset token" | None | NEW |
| TC-AUTH-067 | Request new reset link button navigates to forgot-password | P2 | From invalid/expired token state, click button | Navigates to /forgot-password | None | NEW |

### 8.8 Change Password (Authenticated)

| ID | Name | Priority | Steps | Expected | Role(s) | Coverage |
|----|------|----------|-------|----------|---------|----------|
| TC-AUTH-068 | Change password with correct current password | P1 | POST /api/auth/change-password with valid current + strong new password | 200 "Password changed successfully" | Any authenticated | NEW |
| TC-AUTH-069 | Change password rejects weak new password | P1 | POST /api/auth/change-password with weak newPassword | 400 with validation message | Any authenticated | COVERED by 1.4 |
| TC-AUTH-070 | Change password rejects wrong current password | P1 | POST /api/auth/change-password with wrong currentPassword | 401 "Current password is incorrect" | Any authenticated | NEW |
| TC-AUTH-071 | Change password requires authentication | P1 | POST /api/auth/change-password without token | 401 "Access token required" | None | NEW |
| TC-AUTH-072 | Server validates all 4 password rules on change | P2 | Test each rule individually: <8 chars, no uppercase, no number, no special | Each returns 400 with specific message | Any authenticated | NEW |

### 8.9 RBAC — Sidebar Visibility

| ID | Name | Priority | Steps | Expected | Role(s) | Coverage |
|----|------|----------|-------|----------|---------|----------|
| TC-AUTH-073 | Super admin sees all sidebar items including System | P1 | Login as super_admin, inspect sidebar | AI Chat, TeamBox, Sales, Service, Marketing, Manage, System, Logout all visible | super_admin | NEW |
| TC-AUTH-074 | Partner admin sees all except Manage, sees System | P1 | Login as partner_admin, inspect sidebar | AI Chat, TeamBox, Sales, Service, Marketing visible. System visible. Manage NOT visible | partner_admin | NEW |
| TC-AUTH-075 | Org admin sees all except Manage, sees System | P1 | Login as org_admin, inspect sidebar | Same as partner_admin | org_admin | NEW |
| TC-AUTH-076 | Executive sees Manage but NOT System | P1 | Login as executive, inspect sidebar | AI Chat, TeamBox, Sales, Service, Marketing, Manage visible. System NOT visible | executive | COVERED by 1.8 |
| TC-AUTH-077 | Sales sees only AI Chat, TeamBox, Sales | P1 | Login as sales, inspect sidebar | AI Chat, TeamBox, Sales visible. Service, Marketing, Manage, System NOT visible | sales | COVERED by 1.7 (partial — checks Manage and System) |
| TC-AUTH-078 | Service sees only AI Chat, TeamBox, Service | P1 | Login as service, inspect sidebar | AI Chat, TeamBox, Service visible. Sales, Marketing, Manage, System NOT visible | service | NEW |
| TC-AUTH-079 | Marketing sees only AI Chat, TeamBox, Marketing | P1 | Login as marketing, inspect sidebar | AI Chat, TeamBox, Marketing visible. Sales, Service, Manage, System NOT visible | marketing | NEW |
| TC-AUTH-080 | Sales manager sees AI Chat, TeamBox, Sales only | P2 | Login as sales_manager, inspect sidebar | AI Chat, TeamBox, Sales visible. No Service, Marketing, Manage, System | sales_manager | NEW (no test user for sales_manager in auth.ts registry) |
| TC-AUTH-081 | Custom user permissions override defaults | P2 | User with custom permissions array set | Sidebar shows sections from permissions, not role defaults | Custom user | NEW |

### 8.10 RBAC — Org Switching

| ID | Name | Priority | Steps | Expected | Role(s) | Coverage |
|----|------|----------|-------|----------|---------|----------|
| TC-AUTH-082 | Super admin can see all orgs | P1 | Login as super_admin, check accessibleOrganizations | Array with >= 2 orgs | super_admin | COVERED by 1.9 |
| TC-AUTH-083 | Partner admin sees own group + children only | P1 | Login as partner_admin (Cage), check accessibleOrganizations | Cage + 5 dealerships = 6 orgs. Huminic NOT included | partner_admin | COVERED by 1.10 |
| TC-AUTH-084 | Partner admin can switch to child org | P1 | Login as Cage partner_admin, switch to Serra Honda | 200, new tokens issued | partner_admin | COVERED by 1.10 |
| TC-AUTH-085 | Partner admin cannot switch outside group | P1 | Partner admin attempts switch to org outside their group | 403 "You can only access organizations in your partner group" | partner_admin | NEW |
| TC-AUTH-086 | Sales cannot switch orgs | P1 | Login as sales, check accessibleOrganizations | null | sales | COVERED by 1.11 |
| TC-AUTH-087 | Org switch returns new tokens | P1 | POST /api/auth/switch-org with valid org | New accessToken, refreshToken cookie, user.organization updated | super_admin | NEW (1.10 tests switch but not full token response) |
| TC-AUTH-088 | Org switch returns fullRefresh: true | P2 | POST /api/auth/switch-org | Response includes `fullRefresh: true` | super_admin | NEW |
| TC-AUTH-089 | Org admin with additionalOrgIds can switch | P2 | Login as org_admin with additionalOrgIds set, switch to additional org | 200, switch succeeds | org_admin | NEW |
| TC-AUTH-090 | Org admin without additionalOrgIds cannot switch to other org | P2 | Login as org_admin, attempt switch to non-home org | 403 "You do not have access to this organization" | org_admin | NEW |
| TC-AUTH-091 | Level > 3 user cannot switch orgs via API | P1 | Login as service/marketing/executive, POST /api/auth/switch-org | 403 "Only partner admins and above can switch organizations" | service, marketing | NEW |
| TC-AUTH-092 | Org switch to nonexistent org returns 404 | P2 | POST /api/auth/switch-org with fake orgId | 404 "Organization not found" | super_admin | NEW |

### 8.11 RBAC — API Gate Enforcement

| ID | Name | Priority | Steps | Expected | Role(s) | Coverage |
|----|------|----------|-------|----------|---------|----------|
| TC-AUTH-093 | Sales user blocked from requireRole(3) endpoints | P1 | Login as sales, GET /api/users | 403 with role level message | sales | NEW |
| TC-AUTH-094 | Org admin allowed on requireRole(3) endpoints | P1 | Login as org_admin, GET /api/users | 200 | org_admin | NEW |
| TC-AUTH-095 | Org admin blocked from requireRole(2) endpoints | P1 | Login as org_admin, POST /api/integrations/provision | 403 | org_admin | NEW |
| TC-AUTH-096 | Partner admin allowed on requireRole(2) endpoints | P1 | Login as partner_admin, POST /api/sync/backfill | 200 (or appropriate non-403) | partner_admin | NEW |
| TC-AUTH-097 | Unauthenticated request to protected endpoint returns 401 | P1 | GET /api/users without Authorization header | 401 "Access token required" | None | NEW |
| TC-AUTH-098 | Invalid token returns 401 | P1 | GET /api/users with malformed Bearer token | 401 "Invalid or expired token" | None | NEW |

### 8.12 RBAC — Route Access (Direct URL Navigation)

| ID | Name | Priority | Steps | Expected | Role(s) | Coverage |
|----|------|----------|-------|----------|---------|----------|
| TC-AUTH-099 | Unauthenticated user redirected to /login from protected route | P1 | Navigate to / without authentication | Redirected to /login | None | NEW |
| TC-AUTH-100 | Sales user can access /management by direct URL | P2 | Login as sales, navigate directly to /management | Page loads (no server-side route blocking for this) — documents the gap | sales | NEW |
| TC-AUTH-101 | Sales user can access /settings/system by direct URL | P2 | Login as sales, navigate directly to /settings/system | Page loads (sidebar hides it but route is not blocked) — documents the gap | sales | NEW |

### 8.13 Session Timeout

| ID | Name | Priority | Steps | Expected | Role(s) | Coverage |
|----|------|----------|-------|----------|---------|----------|
| TC-AUTH-102 | Session timeout warning appears before logout | P1 | Login, remain idle for (timeout - 2 minutes) | Warning dialog appears with countdown | Any authenticated | NEW |
| TC-AUTH-103 | Stay Logged In dismisses warning and resets timer | P1 | When warning dialog showing, click "Stay Logged In" | Dialog closes, idle timer resets | Any authenticated | NEW |
| TC-AUTH-104 | Log Out button in dialog performs logout | P1 | When warning dialog showing, click "Log Out" | User logged out, redirected to /login?expired=true | Any authenticated | NEW |
| TC-AUTH-105 | Warning dialog cannot be dismissed by outside click | P2 | When warning dialog showing, click outside | Dialog remains open | Any authenticated | NEW |
| TC-AUTH-106 | Warning dialog cannot be dismissed by Escape key | P2 | When warning dialog showing, press Escape | Dialog remains open | Any authenticated | NEW |
| TC-AUTH-107 | User activity resets idle timer before warning | P2 | Move mouse / type before warning appears | Timer resets, warning delayed | Any authenticated | NEW |
| TC-AUTH-108 | Session timeout configurable via localStorage | P3 | Set localStorage `nexxus_session_timeout_minutes` to 15 | Timeout uses 15 minutes instead of default 30 | Any authenticated | NEW |

### 8.14 Org Hierarchy

| ID | Name | Priority | Steps | Expected | Role(s) | Coverage |
|----|------|----------|-------|----------|---------|----------|
| TC-AUTH-109 | Huminic master org exists | P1 | GET /api/organizations as super_admin | Huminic org present | super_admin | COVERED by 1.15 |
| TC-AUTH-110 | Org hierarchy has correct structure | P1 | Compare super_admin vs partner_admin accessible orgs | Partner admin sees subset of super_admin's orgs | super_admin, partner_admin | COVERED by 1.16 |

### 8.15 Product Tour

| ID | Name | Priority | Steps | Expected | Role(s) | Coverage |
|----|------|----------|-------|----------|---------|----------|
| TC-AUTH-111 | Product tour shows on first login | P2 | Login without tour-dismissed localStorage keys | Tour overlay appears | super_admin | COVERED by 1.13 (partial — page load check only) |
| TC-AUTH-112 | Product tour dismisses per page | P2 | Dismiss tour, navigate away and back | Tour does not reappear on same page | super_admin | COVERED by 1.14 (partial) |
| TC-AUTH-113 | Tour dismissed state stored in localStorage | P3 | Dismiss tour, check localStorage | Keys with prefix `nexxus_tour_dismissed_` set to "true" | Any | NEW |

### 8.16 Auth Context & Me Endpoint

| ID | Name | Priority | Steps | Expected | Role(s) | Coverage |
|----|------|----------|-------|----------|---------|----------|
| TC-AUTH-114 | /api/auth/me returns current user data | P1 | GET /api/auth/me with valid token | 200 with user object (id, email, firstName, lastName, profilePhotoUrl, role, organization) | Any authenticated | NEW |
| TC-AUTH-115 | /api/auth/me without token returns 401 | P1 | GET /api/auth/me without Authorization | 401 "Access token required" | None | NEW |
| TC-AUTH-116 | Org switch via browser triggers full page refresh | P2 | Login as super_admin in browser, switch org | fullRefresh flag causes page reload | super_admin | COVERED by 1.12 (partial) |

---

## 9. Coverage Summary

| Category | Total | Covered by 1.1-1.16 | NEW |
|----------|-------|---------------------|-----|
| Login UI | 11 | 0 | 11 |
| Login Auth Flow | 10 | 2 (1.1, 1.6) | 8 |
| Rate Limiting | 3 | 0 | 3 |
| Token Lifecycle | 6 | 1 (1.2) | 5 |
| Logout | 3 | 1 (1.3) | 2 |
| Forgot Password | 9 | 1 (1.5) | 8 |
| Reset Password | 25 | 0 | 25 |
| Change Password | 5 | 1 (1.4) | 4 |
| RBAC Sidebar | 9 | 2 (1.7, 1.8) | 7 |
| RBAC Org Switching | 11 | 4 (1.9, 1.10, 1.11, 1.12) | 7 |
| RBAC API Gates | 6 | 0 | 6 |
| RBAC Route Access | 3 | 0 | 3 |
| Session Timeout | 7 | 0 | 7 |
| Org Hierarchy | 2 | 2 (1.15, 1.16) | 0 |
| Product Tour | 3 | 2 (1.13, 1.14) | 1 |
| Auth Context / Me | 3 | 1 (1.12 partial) | 2 |
| **TOTAL** | **116** | **17 covered** | **99 new** |

---

## 10. Critical Gaps Identified

1. **No route-level RBAC enforcement** — Pages like /management, /settings/system are only hidden in the sidebar via `canAccessSection()`. Direct URL navigation is not blocked. A sales user can type `/management` and access the page. ProtectedRoute does not use `requiredLevel` on any route in App.tsx.

2. **No test user for sales_manager role** — The test user registry in `tests/e2e/helpers/auth.ts` does not include a `sales_manager` account. This role has distinct permissions (AI Chat, TeamBox, Sales only) but cannot be tested without a seeded account.

3. **Reset password page has client-side 15-minute timer but server uses 1-hour expiry** — The client countdown (15 minutes) does not match the server token expiry (1 hour). This means the client may show "expired" while the server still accepts the token, or vice versa.

4. **No locked account mechanism** — The server detects 5+ failed logins and creates a notification, but does NOT lock the account. An attacker can continue attempting passwords indefinitely (within rate limit of 100/15min).

5. **No test coverage for deactivated account login** — The `user.isActive` check exists server-side but no test verifies it.

6. **No test coverage for forgot-password email delivery** — The Resend integration and CommGate gating logic are untested.

7. **Session timeout tests require time manipulation** — Testing the full 30-minute timeout cycle in E2E is impractical without mocking timers.
