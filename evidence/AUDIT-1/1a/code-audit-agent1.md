# Code Audit — Agent 1 (Foundation Sprints P0-S5 through P2-S3)

**Auditor:** Code Audit Agent 1 (AUDIT-1a)
**Date:** 2026-03-19
**Scope:** 8 sprints: P0-S5, P1-S0, P1-S1, P1-S2, P2-S0, P2-S1, P2-S2, P2-S3
**Method:** Each claim from post-sprint reports verified against current codebase at file:line level

---

## P0-S5 — Fix trust proxy for rate limiter behind Caddy

### Claim: "trust proxy set in server/index.ts"
- Sprint: P0-S5
- File: server/index.ts
- Lines: 35
- Code does: Sets `app.set('trust proxy', 1)` on the Express app immediately after creation
- Verdict: CONFIRMED
- Evidence:
```typescript
const app = express();
app.set('trust proxy', 1);
```

### Claim: "Rate limiter keys on client IP"
- Sprint: P0-S5
- File: server/index.ts
- Lines: 96-103
- Code does: Global rate limiter configured with `standardHeaders: true` and `legacyHeaders: false`, relying on Express trust proxy for correct client IP extraction
- Verdict: CONFIRMED
- Evidence:
```typescript
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.GLOBAL_RATE_LIMIT_MAX || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
```
- Note: With `trust proxy` set to 1, Express correctly reads X-Forwarded-For from Caddy, so the rate limiter keys on the real client IP rather than 127.0.0.1.

---

## P1-S0 — Remove Replit dependencies and config

### Claim: "No REPL_ID/REPLIT_DOMAINS in production code"
- Sprint: P1-S0
- File: (all server/ and client/ directories)
- Lines: N/A
- Code does: No references to REPL_ID or REPLIT_DOMAINS exist in server or client production code
- Verdict: GAP
- Evidence: A grep for `REPL_ID|REPLIT_DOMAINS|replit` across server/ found one file: `server/replit_integrations/batch/utils.ts`. This is a batch processing utility file that references the "replit_integrations" path convention. The file itself does not reference REPL_ID or REPLIT_DOMAINS environment variables -- it is an Anthropic batch processing utility that happens to live under a legacy directory name. Not a functional dependency, but the directory name `replit_integrations` is a residual artifact.
- If GAP: The directory `server/replit_integrations/` still exists with Replit-era naming. The code inside is not Replit-dependent (it is Anthropic batch processing), but the directory name is misleading and was not cleaned up.

### Claim: ".env.example exists"
- Sprint: P1-S0
- File: .env.example
- Lines: 1-108
- Code does: Provides a comprehensive template with REQUIRED section (DATABASE_URL, JWT_SECRET, APP_BASE_URL), OPTIONAL sections (AI, Communications, Voice/Video, Integrations, Server), and DB pool configuration
- Verdict: CONFIRMED
- Evidence:
```
# REQUIRED
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
JWT_SECRET=your-jwt-secret-here
APP_BASE_URL=https://your-domain.com
```

### Claim: "Dockerfile created"
- Sprint: P1-S0
- File: Dockerfile
- Lines: 1-21
- Code does: Multi-stage build using node:20-alpine; builder stage runs `npm ci` + `npm run build`; runner stage copies dist, installs production deps, exposes port 5000, sets NODE_ENV=production
- Verdict: CONFIRMED
- Evidence:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
```

### Claim: "App serves through Caddy (HTML 200, JS 200)"
- Sprint: P1-S0
- File: server/index.ts
- Lines: 177-182
- Code does: In production mode, calls `serveStatic(app)` to serve built frontend assets; in development, sets up Vite dev server
- Verdict: CONFIRMED
- Evidence:
```typescript
if (process.env.NODE_ENV === "production") {
  serveStatic(app);
} else {
  const { setupVite } = await import("./vite");
  await setupVite(httpServer, app);
}
```
- Note: Caddy itself is infrastructure configuration external to this codebase. The app is configured to serve correctly behind a reverse proxy (trust proxy, CORS, etc.).

---

## P1-S1 — Caddy reverse proxy configuration

### Claim: "/api/health responds with 200"
- Sprint: P1-S1
- File: server/routes/health.ts
- Lines: 1-15
- Code does: Registers GET /api/health endpoint returning JSON with status, version, uptime, timestamp, and environment
- Verdict: CONFIRMED
- Evidence:
```typescript
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: process.env.npm_package_version || '2.2.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});
```

### Claim: "Port allocated in sysadmin state" — DEFERRED
- Sprint: P1-S1
- File: N/A (external dependency)
- Lines: N/A
- Code does: No port allocation code exists in this codebase; this was deferred
- Verdict: CONFIRMED (as deferred)
- Note: The report itself marks this as DEFERRED, stating the sysadmin `service_discovery` table did not exist. This is an honest deferral, not a false claim.

### Claim: "Monitoring registered" — DEFERRED
- Sprint: P1-S1
- File: N/A
- Lines: N/A
- Code does: No monitoring registration code in codebase
- Verdict: CONFIRMED (as deferred)
- Note: Same as above; report honestly marks this DEFERRED.

---

## P1-S2 — Database connection abstraction

### Claim: "No hardcoded connection strings"
- Sprint: P1-S2
- File: server/storage.ts
- Lines: 241-248
- Code does: Database connection uses `process.env.DATABASE_URL!` via pg Pool, with configurable pool size, idle timeout, and connection timeout via environment variables
- Verdict: CONFIRMED
- Evidence:
```typescript
const pool = new Pool.Pool({
  connectionString: process.env.DATABASE_URL!,
  max: parseInt(process.env.DB_POOL_SIZE || '10', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),
});
export const db = drizzle(pool);
```
- Note: Grep for `postgres://` or `postgresql://` across server/ returns zero matches (only .env.example has a placeholder). No hardcoded connection strings.

### Claim: "App starts and connects to Neon DB"
- Sprint: P1-S2
- File: server/storage.ts
- Lines: 241-248
- Code does: pg Pool connects using DATABASE_URL; Drizzle ORM wraps the pool; storage class uses it for all queries
- Verdict: CONFIRMED
- Note: Runtime verification was done at sprint time (health returned ok). Code structure confirms the connection path.

---

## P2-S0 — Security middleware stack

### Claim: "Helmet headers present (x-content-type-options: nosniff)"
- Sprint: P2-S0
- File: server/index.ts
- Lines: 73-85
- Code does: Helmet middleware configured with CSP directives (defaultSrc, scriptSrc, styleSrc, fontSrc, imgSrc, connectSrc), crossOriginEmbedderPolicy disabled. Helmet enables x-content-type-options: nosniff by default.
- Verdict: CONFIRMED
- Evidence:
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      ...
    },
  },
  crossOriginEmbedderPolicy: false,
}));
```

### Claim: "Rate limiter configured (100/min global, 10/min auth)"
- Sprint: P2-S0
- File: server/index.ts (global), server/routes/auth.ts (auth)
- Lines: index.ts:96-103, auth.ts:17-23
- Code does: Global limiter is 100 per 60 seconds (confirmed). Auth limiter is **100 per 15 minutes** (NOT 10/min as claimed).
- Verdict: INCORRECT
- Evidence:
```typescript
// Global (index.ts:96-103) — matches claim
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.GLOBAL_RATE_LIMIT_MAX || '100'),
});

// Auth (auth.ts:17-23) — DOES NOT match claim
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes, not 1 minute
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '100'),  // 100, not 10
});
```
- If INCORRECT: The post-sprint report claims "10/min auth" but the actual code is 100 per 15 minutes. This may have been changed by a later sprint (the auth routes were refactored in P4), but the current state does not match the P2-S0 claim. The difference is significant: 10/min is restrictive; 100/15min is permissive.

### Claim: "Entitlement fails closed (returns 503, ENTITLEMENT_FAIL_OPEN overrides)"
- Sprint: P2-S0
- File: server/middleware/entitlementCheck.ts
- Lines: 25-37
- Code does: Default behavior is **fail-open** (allows the action when billing service is unreachable). Only fails closed when `ENTITLEMENT_FAIL_CLOSED === 'true'` is explicitly set.
- Verdict: INCORRECT
- Evidence:
```typescript
} catch (err) {
  console.error('[Entitlement] Check failed:', err);
  if (process.env.ENTITLEMENT_FAIL_CLOSED === 'true') {
    // Only block when explicitly configured to fail closed
    return res.status(503).json({
      error: 'entitlement_check_unavailable',
      message: 'Unable to verify entitlement. Please try again later.',
    });
  }
  // Default: fail open — allow the action when billing service is unreachable
  console.warn(`[Entitlement] Billing service unreachable for ${featureKey} — failing open (allowing action)`);
  return next();
}
```
- If INCORRECT: The report claims "Entitlement fails closed" with "ENTITLEMENT_FAIL_OPEN overrides", but the code does the opposite: it defaults to fail-open and uses `ENTITLEMENT_FAIL_CLOSED` to enable strict mode. The env var name and default behavior are inverted from what the report states. This may be an intentional later change (fail-open is arguably better for availability), but the report's claim does not match the current code.

### Claim: "X-Request-ID header present"
- Sprint: P2-S0
- File: server/index.ts
- Lines: 88-93
- Code does: Middleware generates a UUID via `crypto.randomUUID()`, attaches it to the request, and sets the `X-Request-ID` response header
- Verdict: CONFIRMED
- Evidence:
```typescript
app.use((req, _res, next) => {
  const requestId = crypto.randomUUID();
  (req as any).requestId = requestId;
  _res.setHeader('X-Request-ID', requestId);
  next();
});
```

### Claim: "No new 'any' types introduced (existing (req as any).user unchanged)"
- Sprint: P2-S0
- File: server/index.ts
- Lines: 90
- Code does: `(req as any).requestId = requestId` -- this is a new `as any` usage introduced by this sprint
- Verdict: GAP
- Evidence:
```typescript
(req as any).requestId = requestId;
```
- If GAP: The report claims "no new 'any' types introduced" but the X-Request-ID middleware itself uses `(req as any).requestId`. This is a minor type-safety gap. The `(req as any).user` reference cited in the report has since been properly typed via the Express Request augmentation in auth.ts, but the requestId one persists.

---

## P2-S1 — Token security (httpOnly cookies)

### Claim: "Login sets httpOnly cookie (HttpOnly, Secure, SameSite=Strict)"
- Sprint: P2-S1
- File: server/auth.ts (cookie config), server/routes/auth.ts (usage)
- Lines: auth.ts:7-15, routes/auth.ts:116
- Code does: `setRefreshCookie(res, refreshToken)` called after login; cookie options set httpOnly: true, secure: NODE_ENV === 'production', sameSite: 'strict', path: '/api/auth', maxAge: 7 days
- Verdict: CONFIRMED
- Evidence:
```typescript
export function getRefreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}
```

### Claim: "No refreshToken in response body (only accessToken + expiresIn returned)"
- Sprint: P2-S1
- File: server/routes/auth.ts
- Lines: 146-166
- Code does: Login response returns `accessToken`, `expiresIn`, `user`, and `accessibleOrganizations`. No `refreshToken` field in JSON body.
- Verdict: CONFIRMED
- Evidence:
```typescript
return res.json({
  accessToken,
  expiresIn: getAccessTokenExpirySeconds(),
  user: { ... },
  accessibleOrganizations,
});
```

### Claim: "Token refresh works via cookie (POST /api/auth/refresh with credentials: include)"
- Sprint: P2-S1
- File: server/routes/auth.ts
- Lines: 185-252
- Code does: Reads refresh token from cookie first (`getRefreshTokenFromCookie(req)`), falls back to body (`req.body?.refreshToken`). Performs token rotation: deletes old session, creates new one, sets new refresh cookie.
- Verdict: CONFIRMED
- Evidence:
```typescript
const refreshToken = getRefreshTokenFromCookie(req) || req.body?.refreshToken;
```

### Claim: "Logout clears cookie (Set-Cookie expires at epoch)"
- Sprint: P2-S1
- File: server/routes/auth.ts, server/auth.ts
- Lines: auth.ts:22-28, routes/auth.ts:173-183
- Code does: Logout handler calls `clearRefreshCookie(res)` which uses `res.clearCookie()` with matching cookie options. Also deletes all user sessions from DB.
- Verdict: CONFIRMED
- Evidence:
```typescript
export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
  });
}
```

### Claim: "Access token in memory only (all 16 client files use getAccessToken() from tokenStore)"
- Sprint: P2-S1
- File: client/src/lib/tokenStore.ts, 16 client files
- Lines: tokenStore.ts:1-32
- Code does: In-memory token store with `let accessToken: string | null = null`. Grep confirms 17 files import/use `getAccessToken` (16 consumers + tokenStore itself). Zero localStorage references to tokens remain.
- Verdict: CONFIRMED
- Evidence:
```typescript
let accessToken: string | null = null;
export function getAccessToken(): string | null {
  return accessToken;
}
```

### Claim: "Token rotation active (old refresh deleted, new one issued on each use)"
- Sprint: P2-S1
- File: server/routes/auth.ts
- Lines: 216-232
- Code does: On refresh, deletes old session (`await storage.deleteSession(session.id)`), generates new refresh token, creates new session, sets new cookie
- Verdict: CONFIRMED
- Evidence:
```typescript
// Token rotation: delete old session, create new one
await storage.deleteSession(session.id);
const newRefreshToken = generateRefreshToken(tokenPayload);
await storage.createSession({
  userId: user.id,
  refreshToken: newRefreshToken,
  expiresAt: getRefreshTokenExpiryDate(),
});
setRefreshCookie(res, newRefreshToken);
```

### Claim: "No localStorage references to tokens remain (grep verified: 0 matches)"
- Sprint: P2-S1
- File: client/src/ (all files)
- Lines: N/A
- Code does: Grep for `localStorage.*token` across client/src returns 0 matches
- Verdict: CONFIRMED

### Claim: "cookie-parser and @types/cookie-parser added as dependencies"
- Sprint: P2-S1
- File: package.json
- Lines: 56, 98
- Code does: `"cookie-parser": "^1.4.7"` in dependencies, `"@types/cookie-parser": "^1.4.10"` in devDependencies
- Verdict: CONFIRMED

### Claim: "server/index.ts: Added cookie-parser middleware"
- Sprint: P2-S1
- File: server/index.ts
- Lines: 5, 54
- Code does: Imports `cookieParser from 'cookie-parser'` and registers `app.use(cookieParser())`
- Verdict: CONFIRMED
- Evidence:
```typescript
import cookieParser from 'cookie-parser';
// ...
app.use(cookieParser());
```

### Claim: "client/src/contexts/AuthContext.tsx: Rewritten -- cookie-based refresh, BroadcastChannel cross-tab sync"
- Sprint: P2-S1
- File: client/src/contexts/AuthContext.tsx
- Lines: 59-64
- Code does: Creates a BroadcastChannel named 'nexxus_auth' for cross-tab logout synchronization, with fallback when BroadcastChannel is not supported
- Verdict: CONFIRMED
- Evidence:
```typescript
// BroadcastChannel for cross-tab logout sync
let logoutChannel: BroadcastChannel | null = null;
try {
  logoutChannel = new BroadcastChannel('nexxus_auth');
} catch {
  // BroadcastChannel not supported -- cross-tab sync disabled
}
```

### Claim: "client/src/lib/tokenStore.ts: NEW -- in-memory access token store"
- Sprint: P2-S1
- File: client/src/lib/tokenStore.ts
- Lines: 1-32
- Code does: Module-scoped variable for access token and expiry, with getter/setter/clear/expiry-check functions
- Verdict: CONFIRMED

---

## P2-S2 — XSS and input sanitization

### Claim: "Markdown XSS hardened (disallowedElements, href sanitization)"
- Sprint: P2-S2
- File: client/src/components/MarkdownMessage.tsx
- Lines: 32-33, 74-81
- Code does: ReactMarkdown configured with `disallowedElements={['script', 'iframe', 'object', 'embed', 'form', 'input', 'style']}` and `unwrapDisallowed={true}`. Anchor tag sanitizes href to only allow `https?:`, `mailto:`, and `tel:` protocols.
- Verdict: CONFIRMED
- Evidence:
```tsx
disallowedElements={['script', 'iframe', 'object', 'embed', 'form', 'input', 'style']}
unwrapDisallowed={true}
// ...
a: ({ children, href }) => {
  const safeHref = href && /^(https?:|mailto:|tel:)/i.test(href) ? href : undefined;
  return (
    <a href={safeHref} target="_blank" rel="noopener noreferrer" ...>
```

### Claim: "Validation middleware created (server/middleware/validate.ts)"
- Sprint: P2-S2
- File: server/middleware/validate.ts
- Lines: 1-49
- Code does: Three Zod-based validation middleware functions: `validateBody`, `validateQuery`, `validateParams`. Each takes a ZodSchema, validates the corresponding request property, and returns 400 with structured error details on failure.
- Verdict: CONFIRMED
- Evidence:
```typescript
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'validation_error',
        details: formatZodError(result.error),
      });
    }
    req.body = result.data;
    next();
  };
}
```

### Claim: "routes.ts NOT modified (deferred)"
- Sprint: P2-S2
- File: N/A
- Lines: N/A
- Code does: Auth endpoint validation was deferred to P4 (routes decomposition)
- Verdict: CONFIRMED
- Note: The report is honest about this deferral. Routes were subsequently decomposed in P4.

---

## P2-S3 — Password security and credential handling

### Claim: "Reset token hashed with SHA-256 before DB storage"
- Sprint: P2-S3
- File: server/routes/auth.ts
- Lines: 365-369
- Code does: Generates random 32-byte token, hashes with SHA-256, stores hash in DB. Only the hash is persisted; plaintext token goes in the email URL.
- Verdict: CONFIRMED
- Evidence:
```typescript
const token = randomBytes(32).toString("hex");
const tokenHash = createHash("sha256").update(token).digest("hex");
const expiry = new Date(Date.now() + 60 * 60 * 1000);
await storage.updateUser(user.id, { resetToken: tokenHash, resetTokenExpiry: expiry } as any);
```

### Claim: "Reset-password endpoint validates password strength (8+, uppercase, number, special)"
- Sprint: P2-S3
- File: server/routes/auth.ts
- Lines: 405-408
- Code does: Four sequential checks: length >= 8, at least 1 uppercase letter, at least 1 number, at least 1 special character. Each returns 400 with specific message.
- Verdict: CONFIRMED
- Evidence:
```typescript
if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
if (!/[A-Z]/.test(password)) return res.status(400).json({ message: "Password must contain at least 1 uppercase letter" });
if (!/[0-9]/.test(password)) return res.status(400).json({ message: "Password must contain at least 1 number" });
if (!/[^A-Za-z0-9]/.test(password)) return res.status(400).json({ message: "Password must contain at least 1 special character" });
```

### Claim: "Reset-password hashes incoming token for DB lookup"
- Sprint: P2-S3
- File: server/routes/auth.ts
- Lines: 412-414
- Code does: Hashes the incoming token with SHA-256, then calls `storage.findUserByResetToken(tokenHash)` to find the user
- Verdict: CONFIRMED
- Evidence:
```typescript
const tokenHash = createHash("sha256").update(token).digest("hex");
const found = await storage.findUserByResetToken(tokenHash);
```

### Claim: "All user sessions invalidated after password reset"
- Sprint: P2-S3
- File: server/routes/auth.ts
- Lines: 428
- Code does: After password is hashed and stored, calls `await storage.deleteUserSessions(found.id)` to invalidate all sessions
- Verdict: CONFIRMED
- Evidence:
```typescript
await storage.updateUser(found.id, {
  password: hashedPassword,
  resetToken: null,
  resetTokenExpiry: null,
} as any);
// Invalidate all sessions (force re-login with new password)
await storage.deleteUserSessions(found.id);
```

### Claim: "Change-password endpoint upgraded to matching strength validation (from length>=6)"
- Sprint: P2-S3
- File: server/routes/auth.ts
- Lines: 454-465
- Code does: Same four-check password strength validation as reset-password: length >= 8, uppercase, number, special character
- Verdict: CONFIRMED
- Evidence:
```typescript
if (newPassword.length < 8) {
  return res.status(400).json({ message: "Password must be at least 8 characters" });
}
if (!/[A-Z]/.test(newPassword)) { ... }
if (!/[0-9]/.test(newPassword)) { ... }
if (!/[^A-Za-z0-9]/.test(newPassword)) { ... }
```
- Note: Cannot verify the "from length>=6" claim as the previous implementation is not available at the current commit, but the current code does implement the full strength validation as claimed.

### Claim: "No plaintext passwords in email (token in URL, hash in DB)"
- Sprint: P2-S3
- File: server/routes/auth.ts
- Lines: 377, 367-369
- Code does: The reset URL contains the raw token (`resetUrl = ...?token=${token}`), but the DB stores only the SHA-256 hash (`tokenHash`). No password content appears in emails.
- Verdict: CONFIRMED

---

## Summary

| Sprint | Total Claims | CONFIRMED | GAP | INCORRECT |
|--------|-------------|-----------|-----|-----------|
| P0-S5  | 2           | 2         | 0   | 0         |
| P1-S0  | 4           | 3         | 1   | 0         |
| P1-S1  | 3           | 3         | 0   | 0         |
| P1-S2  | 2           | 2         | 0   | 0         |
| P2-S0  | 5           | 2         | 1   | 2         |
| P2-S1  | 11          | 11        | 0   | 0         |
| P2-S2  | 3           | 3         | 0   | 0         |
| P2-S3  | 6           | 6         | 0   | 0         |
| **TOTAL** | **36**   | **32**    | **2** | **2**   |

### INCORRECT Findings (Requires Attention)

1. **P2-S0: Auth rate limiter "10/min" claim** — Actual code is 100 per 15 minutes (configurable via AUTH_RATE_LIMIT_MAX). The claim of "10/min" is materially incorrect. This is a security concern: the auth endpoint is significantly more permissive than the report states.

2. **P2-S0: Entitlement "fails closed" claim** — Actual code defaults to fail-open. The env var is `ENTITLEMENT_FAIL_CLOSED` (not `ENTITLEMENT_FAIL_OPEN`). The logic and naming are inverted from what the report claims.

### GAP Findings (Minor)

1. **P1-S0: Replit directory naming** — `server/replit_integrations/` directory still exists with legacy naming. No functional Replit dependency, but naming artifact persists.

2. **P2-S0: "No new 'any' types" claim** — The X-Request-ID middleware introduced `(req as any).requestId`, which is a new `as any` cast not acknowledged in the report.

### Notable Positive Findings

- P2-S1 (token security) is the most thoroughly implemented sprint with 11/11 claims confirmed. The httpOnly cookie implementation, token rotation, BroadcastChannel sync, and localStorage removal are all complete and correct.
- P2-S3 (password security) is fully verified with proper SHA-256 hashing, strength validation, and session invalidation.
- P2-S2 (XSS hardening) correctly implements disallowed elements and href sanitization patterns.
