/**
 * Refresh-token rotation helper.
 *
 * Pure async function that performs the refresh-token rotation logic
 * for `POST /api/auth/refresh`. Extracted from `server/routes/auth.ts`
 * so the rotation logic — including its concurrent-rotation fallback —
 * can be exercised in unit tests without standing up Express, the DB,
 * or HTTP cookies.
 *
 * Bug being fixed: Priority #3 — hard reload to /teambox /service
 * /settings?section=ai redirects to /login.
 *
 *   Pre-fix: two refresh-token calls fired in parallel with the same
 *   cookie value (typical pattern: page.goto(path) immediately
 *   followed by page.reload(path); also: rapid multi-tab restore;
 *   also: any double-bootstrap shape) would race on the
 *   `sessions.refresh_token` UNIQUE constraint. JWT `iat` is integer
 *   seconds and `expiresIn` is computed from `iat`, so two refresh
 *   tokens minted in the same second with identical {userId, orgId,
 *   roleId, type, exp} are byte-identical strings. First insert wins,
 *   second insert throws Postgres SQLSTATE 23505. The caller's outer
 *   `try/catch` swallowed the error and returned HTTP 500. The client
 *   treated 500 as `tryRefreshToken → false`, so AuthContext skipped
 *   the `setAccessTokenState` line that the 3581187 fix had added.
 *   `isAuthenticated` stayed false. ProtectedRoute redirected to
 *   /login. Reproduced live: ~53% failure rate on dev under paired
 *   parallel curl POSTs.
 *
 * Post-fix: when `createSession` throws a unique-violation, fall back
 * to `getMostRecentSessionForUser` and — if it was just created
 * (within RECENT_SESSION_WINDOW_MS) — mint a fresh access token
 * against that session's refresh token. Same security shape as the
 * existing concurrent-rotation fallback when `getSessionByRefreshToken`
 * returns no row (the OLD-token case).
 *
 * Defense-in-depth `jti` nonce in the refresh JWT payload was
 * considered and DEFERRED to v2.3 backlog (see issues.md
 * I-NEW-2026-04-27-C). Adding `jti` would make this race impossible
 * by construction, but it changes the JWT shape and is broader than
 * the launch fix.
 */

import type { Session, User, Role, Organization } from "@shared/schema";

/**
 * Window during which a "recent" session is considered the winner of
 * a concurrent rotation. Mirrors the threshold used by the existing
 * pre-rotation fallback in the route handler. Keep these in lockstep.
 */
export const RECENT_SESSION_WINDOW_MS = 10_000;

/**
 * Storage shape needed by the rotation helper. Only the methods
 * actually used here are listed — the helper does NOT receive the
 * full `IStorage` so tests can stub a tiny surface.
 */
export interface RotationStorage {
  getSessionByRefreshToken(token: string): Promise<Session | undefined>;
  deleteSession(id: string): Promise<void>;
  createSession(session: { userId: string; refreshToken: string; expiresAt: Date }): Promise<Session>;
  getMostRecentSessionForUser(userId: string): Promise<Session | undefined>;
  getUser(id: string): Promise<User | undefined>;
  getRole(id: string): Promise<Role | undefined>;
  getOrganization(id: string): Promise<Organization | undefined>;
}

export interface RotationDeps {
  storage: RotationStorage;
  generateAccessToken: (payload: { userId: string; organizationId: string; roleId: string }) => string;
  generateRefreshToken: (payload: { userId: string; organizationId: string; roleId: string }) => string;
  /**
   * Verify a refresh JWT. Throws on failure. (The route handler
   * passes `verifyToken(token, "refresh")` from server/auth.ts.)
   */
  verifyRefreshToken: (token: string) => { userId: string };
  getRefreshTokenExpiryDate: () => Date;
  getAccessTokenExpirySeconds: () => number;
  /**
   * Override clock for tests. Defaults to `Date.now`.
   */
  now?: () => number;
}

/**
 * Tagged result. The Express adapter maps these to HTTP responses.
 *
 * `cookie: "set" | "clear" | "none"` tells the adapter what to do
 * with the refresh-token cookie before sending the response.
 */
export type RotationResult =
  | {
      kind: "ok";
      status: 200;
      cookie: "set";
      refreshToken: string;
      accessToken: string;
      expiresIn: number;
      user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: { id: string; name: string; level: number };
        organization: { id: string; name: string };
      };
    }
  | {
      kind: "error";
      status: 400 | 401 | 500;
      cookie: "clear" | "none";
      message: string;
    };

/**
 * Detect a Postgres unique-violation error from `pg` /
 * `drizzle-orm/node-postgres`. Standard SQLSTATE for unique-violation
 * is "23505". A message-substring fallback (covering Postgres /
 * Supabase / Neon / pg-mem variants) is included so a future driver
 * swap doesn't silently regress this fix.
 */
export function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: unknown; message?: unknown };
  if (e.code === "23505") return true;
  if (typeof e.message === "string") {
    const m = e.message.toLowerCase();
    if (m.includes("duplicate key")) return true;
    if (m.includes("unique constraint") && m.includes("refresh_token")) return true;
    if (m.includes("sessions_refresh_token_unique")) return true;
  }
  return false;
}

/**
 * Build the auth payload returned to the client when role+org are
 * resolvable. Mirrors the shape the route handler produced before the
 * extraction.
 */
function buildUserPayload(user: User, role: Role | undefined, org: Organization | undefined) {
  if (!role || !org) return undefined;
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: { id: role.id, name: role.name, level: role.level },
    organization: { id: org.id, name: org.name },
  };
}

/**
 * Concurrent-rotation fallback: a peer request just rotated the
 * session for this user. Mint a fresh access token against the
 * recent session's refresh token and return that as the cookie.
 *
 * Returns `null` if no recent-enough session exists (caller should
 * report 401 / 500 depending on context).
 */
async function tryRecentSessionFallback(
  userId: string,
  deps: RotationDeps,
): Promise<RotationResult | null> {
  const recent = await deps.storage.getMostRecentSessionForUser(userId);
  if (!recent) return null;
  const now = deps.now ? deps.now() : Date.now();
  const ageMs = now - new Date(recent.createdAt).getTime();
  if (ageMs >= RECENT_SESSION_WINDOW_MS) return null;

  const user = await deps.storage.getUser(userId);
  if (!user) return null;

  const role = await deps.storage.getRole(user.roleId);
  const org = await deps.storage.getOrganization(user.organizationId);

  const newAccessToken = deps.generateAccessToken({
    userId: user.id,
    organizationId: user.organizationId,
    roleId: user.roleId,
  });

  return {
    kind: "ok",
    status: 200,
    cookie: "set",
    refreshToken: recent.refreshToken,
    accessToken: newAccessToken,
    expiresIn: deps.getAccessTokenExpirySeconds(),
    user: buildUserPayload(user, role, org),
  };
}

/**
 * Perform a refresh-token rotation.
 *
 * @param refreshToken raw JWT from the cookie (or legacy body).
 *                     Pass `undefined`/`null`/`""` to surface a 400.
 */
export async function rotateRefreshToken(
  refreshToken: string | undefined | null,
  deps: RotationDeps,
): Promise<RotationResult> {
  if (!refreshToken) {
    return { kind: "error", status: 400, cookie: "none", message: "Refresh token required" };
  }

  const session = await deps.storage.getSessionByRefreshToken(refreshToken);
  const now = deps.now ? deps.now() : Date.now();

  // Path A: session row missing OR expired. Either we're seeing a
  //   replay of a long-dead token, OR a peer request just rotated us
  //   away. Distinguish via `getMostRecentSessionForUser` + 10s window.
  if (!session || session.expiresAt.getTime() < now) {
    let decoded: { userId: string } | null = null;
    try {
      decoded = deps.verifyRefreshToken(refreshToken);
    } catch {
      // Token doesn't even verify — fall through to 401 below.
    }
    if (decoded?.userId) {
      const fallback = await tryRecentSessionFallback(decoded.userId, deps);
      if (fallback) return fallback;
    }
    return {
      kind: "error",
      status: 401,
      cookie: "clear",
      message: "Invalid or expired refresh token",
    };
  }

  // Path B: session row present. Verify the JWT signature; on
  //   failure, the row is suspect — delete it and 401.
  try {
    deps.verifyRefreshToken(refreshToken);
  } catch {
    await deps.storage.deleteSession(session.id);
    return {
      kind: "error",
      status: 401,
      cookie: "clear",
      message: "Invalid refresh token",
    };
  }

  const user = await deps.storage.getUser(session.userId);
  if (!user) {
    return { kind: "error", status: 401, cookie: "none", message: "User not found" };
  }

  const role = await deps.storage.getRole(user.roleId);
  const org = await deps.storage.getOrganization(user.organizationId);

  // Token rotation: delete old session row, create new one. The
  // delete is intentionally idempotent — if a peer already deleted
  // the row, drizzle reports zero rows affected without throwing.
  await deps.storage.deleteSession(session.id);

  const tokenPayload = {
    userId: user.id,
    organizationId: user.organizationId,
    roleId: user.roleId,
  };

  const newAccessToken = deps.generateAccessToken(tokenPayload);
  const newRefreshToken = deps.generateRefreshToken(tokenPayload);

  try {
    await deps.storage.createSession({
      userId: user.id,
      refreshToken: newRefreshToken,
      expiresAt: deps.getRefreshTokenExpiryDate(),
    });
  } catch (err) {
    // Race with a peer refresh: two parallel calls minted byte-
    // identical refresh tokens (`iat` is integer seconds; same
    // payload in same second → same JWT). The unique index on
    // `sessions.refresh_token` rejects the second insert with
    // SQLSTATE 23505. Fall back to the peer's just-created session.
    if (isUniqueViolation(err)) {
      const fallback = await tryRecentSessionFallback(user.id, deps);
      if (fallback) return fallback;
    }
    // Anything else (or unique-violation with no recent session
    // somehow) is a real failure. Re-throw so the route adapter's
    // outer catch can log and surface a 500.
    throw err;
  }

  return {
    kind: "ok",
    status: 200,
    cookie: "set",
    refreshToken: newRefreshToken,
    accessToken: newAccessToken,
    expiresIn: deps.getAccessTokenExpirySeconds(),
    user: buildUserPayload(user, role, org),
  };
}
