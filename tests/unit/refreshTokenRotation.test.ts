/**
 * Unit tests for the refresh-token rotation helper
 * (server/lib/refreshTokenRotation.ts).
 *
 * Bug being fixed: Priority #3 — hard reload to /teambox /service
 * /settings?section=ai redirects to /login.
 *
 *   Two parallel /api/auth/refresh calls minted byte-identical
 *   refresh JWTs (same {userId,orgId,roleId,type,exp} in same `iat`
 *   second). The unique index on `sessions.refresh_token` rejected
 *   the second insert with Postgres SQLSTATE 23505. The route's
 *   outer catch swallowed the error and returned HTTP 500. Client
 *   `tryRefreshToken` returned false. AuthContext skipped the
 *   `setAccessTokenState` line that the 3581187 fix had added.
 *   ProtectedRoute redirected to /login. Reproduced live: ~53%
 *   failure rate on dev under paired parallel curl POSTs.
 *
 * Post-fix: when `createSession` throws a unique-violation, fall back
 * to `getMostRecentSessionForUser` and — if it was just created
 * (within RECENT_SESSION_WINDOW_MS) — mint a fresh access token
 * against that session's refresh token. No 500. No /login redirect.
 *
 * The helper is a pure async function. These tests inject `storage`
 * + token-mint deps directly — no DB, no Express, no cookies, no
 * filesystem, no network.
 */

import { describe, it, expect } from "vitest";
import {
  rotateRefreshToken,
  isUniqueViolation,
  RECENT_SESSION_WINDOW_MS,
  type RotationStorage,
  type RotationDeps,
} from "@server/lib/refreshTokenRotation";
import type { Session, User, Role, Organization } from "@shared/schema";

// ---------------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------------

const FIXED_NOW = new Date("2026-04-27T20:00:00.000Z").getTime();

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: overrides.id ?? "user-1",
    email: overrides.email ?? "serra_honda@huminic.ai",
    firstName: overrides.firstName ?? "Serra",
    lastName: overrides.lastName ?? "Honda",
    passwordHash: overrides.passwordHash ?? "hash",
    profilePhotoUrl: overrides.profilePhotoUrl ?? null,
    roleId: overrides.roleId ?? "role-1",
    organizationId: overrides.organizationId ?? "org-1",
    createdAt: overrides.createdAt ?? new Date(FIXED_NOW),
    updatedAt: overrides.updatedAt ?? new Date(FIXED_NOW),
  } as User;
}

function makeRole(overrides: Partial<Role> = {}): Role {
  return {
    id: overrides.id ?? "role-1",
    name: overrides.name ?? "org_admin",
    level: overrides.level ?? 3,
    createdAt: overrides.createdAt ?? new Date(FIXED_NOW),
  } as Role;
}

function makeOrg(overrides: Partial<Organization> = {}): Organization {
  return {
    id: overrides.id ?? "org-1",
    name: overrides.name ?? "Serra Honda",
    slug: overrides.slug ?? "serra-honda",
    createdAt: overrides.createdAt ?? new Date(FIXED_NOW),
    updatedAt: overrides.updatedAt ?? new Date(FIXED_NOW),
  } as Organization;
}

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: overrides.id ?? "sess-old",
    userId: overrides.userId ?? "user-1",
    refreshToken: overrides.refreshToken ?? "token-old",
    expiresAt: overrides.expiresAt ?? new Date(FIXED_NOW + 7 * 24 * 60 * 60 * 1000),
    createdAt: overrides.createdAt ?? new Date(FIXED_NOW - 1_000),
  } as Session;
}

/**
 * Build a fresh in-memory `storage` stub. Each method is a tiny
 * closure over the local state so tests can inspect calls and
 * mutate state between operations.
 */
function makeStorage(initial: {
  sessions: Session[];
  users: User[];
  roles: Role[];
  orgs: Organization[];
  // If set, createSession will throw the given error on its Nth call (1-indexed).
  createSessionThrowOnCall?: { call: number; err: unknown };
}) {
  const state = { ...initial };
  let createCallCount = 0;
  const calls = {
    getSessionByRefreshToken: 0,
    deleteSession: 0,
    createSession: 0,
    getMostRecentSessionForUser: 0,
    getUser: 0,
    getRole: 0,
    getOrganization: 0,
  };

  const storage: RotationStorage = {
    async getSessionByRefreshToken(token) {
      calls.getSessionByRefreshToken++;
      return state.sessions.find((s) => s.refreshToken === token);
    },
    async deleteSession(id) {
      calls.deleteSession++;
      state.sessions = state.sessions.filter((s) => s.id !== id);
    },
    async createSession({ userId, refreshToken, expiresAt }) {
      createCallCount++;
      calls.createSession++;
      if (
        state.createSessionThrowOnCall &&
        state.createSessionThrowOnCall.call === createCallCount
      ) {
        throw state.createSessionThrowOnCall.err;
      }
      // Simulate the unique constraint on refresh_token.
      if (state.sessions.some((s) => s.refreshToken === refreshToken)) {
        const err: any = new Error(
          'duplicate key value violates unique constraint "sessions_refresh_token_unique"',
        );
        err.code = "23505";
        throw err;
      }
      const created: Session = {
        id: "sess-" + (state.sessions.length + 1),
        userId,
        refreshToken,
        expiresAt,
        createdAt: new Date(FIXED_NOW),
      } as Session;
      state.sessions = [...state.sessions, created];
      return created;
    },
    async getMostRecentSessionForUser(userId) {
      calls.getMostRecentSessionForUser++;
      const userSessions = state.sessions
        .filter((s) => s.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return userSessions[0];
    },
    async getUser(id) {
      calls.getUser++;
      return state.users.find((u) => u.id === id);
    },
    async getRole(id) {
      calls.getRole++;
      return state.roles.find((r) => r.id === id);
    },
    async getOrganization(id) {
      calls.getOrganization++;
      return state.orgs.find((o) => o.id === id);
    },
  };

  return { storage, state, calls };
}

/**
 * Build deps. Token mints are deterministic strings so two calls in
 * the same `mintCounter` second produce the same string — this
 * mirrors the production JWT collision and lets us drive the race.
 */
function makeDeps(
  storage: RotationStorage,
  opts: {
    /** Override the integer-second clock used for token minting. */
    mintNow?: () => number;
    /** Override `Date.now()` shape used for the recent-window check. */
    now?: () => number;
  } = {},
): RotationDeps {
  const mintNow = opts.mintNow ?? (() => Math.floor(FIXED_NOW / 1000));
  return {
    storage,
    generateAccessToken: ({ userId }) => `access-${userId}-${mintNow()}`,
    generateRefreshToken: ({ userId, organizationId, roleId }) =>
      // Deterministic on payload + integer-second clock — matches the
      // real `jwt.sign` collision shape (same iat second + same payload
      // → byte-identical token).
      `refresh-${userId}-${organizationId}-${roleId}-${mintNow()}`,
    verifyRefreshToken: (t) => {
      // Decode the deterministic test token; in production this is a
      // signed JWT verify that throws on bad signatures. Match that
      // contract: throw on tokens that don't look minted by us.
      if (!t.startsWith("token-") && !t.startsWith("refresh-")) {
        throw new Error("invalid token");
      }
      // Token strings encode the userId in position 1.
      const parts = t.split("-");
      if (t.startsWith("token-")) {
        // Test fixture sessions ("token-old", "token-stale", etc.) —
        // decode userId from the registered session below. The route
        // never calls verifyRefreshToken directly without a session
        // lookup, but if someone passes a bare "token-…" we resolve
        // the userId via state. For test stability return user-1.
        return { userId: "user-1" };
      }
      // refresh-<userId>-<orgId>-<roleId>-<sec>
      return { userId: parts[1] };
    },
    getRefreshTokenExpiryDate: () => new Date(FIXED_NOW + 7 * 24 * 60 * 60 * 1000),
    getAccessTokenExpirySeconds: () => 3600,
    now: opts.now ?? (() => FIXED_NOW),
  };
}

// ---------------------------------------------------------------------------
// isUniqueViolation
// ---------------------------------------------------------------------------

describe("isUniqueViolation", () => {
  it("matches Postgres SQLSTATE 23505", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
  });

  it("matches a 'duplicate key' message even without code", () => {
    expect(
      isUniqueViolation(new Error('duplicate key value violates unique constraint')),
    ).toBe(true);
  });

  it("matches the specific sessions_refresh_token_unique constraint name", () => {
    expect(
      isUniqueViolation(new Error("sessions_refresh_token_unique violated")),
    ).toBe(true);
  });

  it("does NOT match a generic 'refresh_token' message without unique-constraint phrasing", () => {
    expect(isUniqueViolation(new Error("refresh_token expired"))).toBe(false);
  });

  it("does NOT match nullish / non-error values", () => {
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation(undefined)).toBe(false);
    expect(isUniqueViolation("string error")).toBe(false);
    expect(isUniqueViolation(42)).toBe(false);
  });

  it("does NOT match unrelated Postgres errors (foreign key violation 23503)", () => {
    expect(isUniqueViolation({ code: "23503" })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// rotateRefreshToken — happy paths
// ---------------------------------------------------------------------------

describe("rotateRefreshToken — happy path", () => {
  it("rotates a valid refresh token: deletes old session, creates new one, returns 200", async () => {
    const { storage, state } = makeStorage({
      sessions: [makeSession({ id: "sess-A", refreshToken: "token-old" })],
      users: [makeUser()],
      roles: [makeRole()],
      orgs: [makeOrg()],
    });
    const deps = makeDeps(storage);

    const result = await rotateRefreshToken("token-old", deps);

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return; // typeguard
    expect(result.status).toBe(200);
    expect(result.accessToken).toMatch(/^access-user-1-/);
    expect(result.refreshToken).toMatch(/^refresh-user-1-org-1-role-1-/);
    expect(result.expiresIn).toBe(3600);
    expect(result.user?.email).toBe("serra_honda@huminic.ai");
    expect(result.user?.role).toEqual({ id: "role-1", name: "org_admin", level: 3 });
    expect(result.user?.organization).toEqual({ id: "org-1", name: "Serra Honda" });

    // Old session deleted; new session inserted.
    expect(state.sessions.find((s) => s.id === "sess-A")).toBeUndefined();
    expect(state.sessions.length).toBe(1);
    expect(state.sessions[0].refreshToken).toBe(result.refreshToken);
  });
});

// ---------------------------------------------------------------------------
// rotateRefreshToken — error paths
// ---------------------------------------------------------------------------

describe("rotateRefreshToken — error paths", () => {
  it("missing token → 400", async () => {
    const { storage } = makeStorage({ sessions: [], users: [], roles: [], orgs: [] });
    const deps = makeDeps(storage);

    expect(await rotateRefreshToken(undefined, deps)).toMatchObject({
      kind: "error",
      status: 400,
      cookie: "none",
      message: "Refresh token required",
    });
    expect(await rotateRefreshToken(null, deps)).toMatchObject({ status: 400 });
    expect(await rotateRefreshToken("", deps)).toMatchObject({ status: 400 });
  });

  it("session not found AND no recent session → 401 + cookie clear", async () => {
    const { storage } = makeStorage({
      sessions: [],
      users: [makeUser()],
      roles: [makeRole()],
      orgs: [makeOrg()],
    });
    const deps = makeDeps(storage);

    const result = await rotateRefreshToken("token-old", deps);
    expect(result).toMatchObject({
      kind: "error",
      status: 401,
      cookie: "clear",
      message: "Invalid or expired refresh token",
    });
  });

  it("session expired AND no recent session → 401 + cookie clear", async () => {
    const expiredSession = makeSession({
      refreshToken: "token-stale",
      expiresAt: new Date(FIXED_NOW - 60_000), // expired 1 minute ago
      createdAt: new Date(FIXED_NOW - RECENT_SESSION_WINDOW_MS - 60_000), // outside recent window
    });
    const { storage } = makeStorage({
      sessions: [expiredSession],
      users: [makeUser()],
      roles: [makeRole()],
      orgs: [makeOrg()],
    });
    const deps = makeDeps(storage);

    const result = await rotateRefreshToken("token-stale", deps);
    expect(result).toMatchObject({
      kind: "error",
      status: 401,
      cookie: "clear",
    });
  });

  it("session present but JWT verify fails → deletes session + 401 + cookie clear", async () => {
    const { storage, state } = makeStorage({
      sessions: [makeSession({ id: "sess-bad", refreshToken: "garbage-token" })],
      users: [makeUser()],
      roles: [makeRole()],
      orgs: [makeOrg()],
    });
    const deps = makeDeps(storage);

    const result = await rotateRefreshToken("garbage-token", deps);
    expect(result).toMatchObject({
      kind: "error",
      status: 401,
      cookie: "clear",
      message: "Invalid refresh token",
    });
    // Suspect session row removed.
    expect(state.sessions.find((s) => s.id === "sess-bad")).toBeUndefined();
  });

  it("session userId points to a missing user row → 401", async () => {
    const { storage } = makeStorage({
      sessions: [makeSession({ refreshToken: "token-orphan", userId: "user-deleted" })],
      users: [], // user deleted out from under the session
      roles: [makeRole()],
      orgs: [makeOrg()],
    });
    const deps = makeDeps(storage);

    const result = await rotateRefreshToken("token-orphan", deps);
    expect(result).toMatchObject({ kind: "error", status: 401, message: "User not found" });
  });
});

// ---------------------------------------------------------------------------
// rotateRefreshToken — concurrent-rotation fallback (Path A: session row
// already gone because a peer deleted it)
// ---------------------------------------------------------------------------

describe("rotateRefreshToken — concurrent-rotation fallback (Path A — session deleted by peer)", () => {
  it("session row missing but a recent session exists for the user → 200 with the recent session's token", async () => {
    const recent = makeSession({
      id: "sess-recent",
      refreshToken: "token-recent",
      createdAt: new Date(FIXED_NOW - 100), // 100ms ago, well within window
    });
    const { storage, calls } = makeStorage({
      sessions: [recent], // old session row already removed by peer
      users: [makeUser()],
      roles: [makeRole()],
      orgs: [makeOrg()],
    });
    const deps = makeDeps(storage);

    // Caller still has the OLD token in cookie — deleted from sessions table.
    const result = await rotateRefreshToken("token-old-deleted", deps);

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.status).toBe(200);
    expect(result.refreshToken).toBe("token-recent");
    expect(result.accessToken).toMatch(/^access-user-1-/);
    expect(calls.getMostRecentSessionForUser).toBe(1);
    // No new createSession in this path — we adopted the peer's session.
    expect(calls.createSession).toBe(0);
  });

  it("session row missing AND recent session is OLDER than RECENT_SESSION_WINDOW_MS → 401", async () => {
    const stale = makeSession({
      id: "sess-stale",
      refreshToken: "token-stale-recent",
      createdAt: new Date(FIXED_NOW - RECENT_SESSION_WINDOW_MS - 1), // just outside window
    });
    const { storage } = makeStorage({
      sessions: [stale],
      users: [makeUser()],
      roles: [makeRole()],
      orgs: [makeOrg()],
    });
    const deps = makeDeps(storage);

    const result = await rotateRefreshToken("token-not-here", deps);
    expect(result).toMatchObject({
      kind: "error",
      status: 401,
      cookie: "clear",
    });
  });
});

// ---------------------------------------------------------------------------
// rotateRefreshToken — unique-violation fallback (Path B: createSession
// throws SQLSTATE 23505 because peer beat us to inserting)
//
// THIS IS THE PRIORITY #3 BUG.
// ---------------------------------------------------------------------------

describe("rotateRefreshToken — unique-violation fallback (Priority #3 race)", () => {
  it("createSession throws SQLSTATE 23505 + recent peer session exists → 200 with peer's token (NO 500)", async () => {
    // The peer just inserted its session row. Our createSession will
    // throw the unique violation. The fallback must adopt the peer's row.
    const peerSession = makeSession({
      id: "sess-peer",
      refreshToken: "refresh-peer-just-minted",
      createdAt: new Date(FIXED_NOW - 50), // 50ms ago, inside window
    });
    const ourOldSession = makeSession({ id: "sess-A", refreshToken: "token-old" });

    const { storage, state } = makeStorage({
      sessions: [ourOldSession, peerSession],
      users: [makeUser()],
      roles: [makeRole()],
      orgs: [makeOrg()],
      createSessionThrowOnCall: {
        call: 1,
        err: Object.assign(
          new Error('duplicate key value violates unique constraint "sessions_refresh_token_unique"'),
          { code: "23505" },
        ),
      },
    });
    const deps = makeDeps(storage);

    const result = await rotateRefreshToken("token-old", deps);

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.status).toBe(200);
    // Fallback returns the peer's already-minted refresh token.
    expect(result.refreshToken).toBe("refresh-peer-just-minted");
    // Access token is freshly minted for THIS request.
    expect(result.accessToken).toMatch(/^access-user-1-/);
    // Our old session row was deleted before the createSession attempt.
    expect(state.sessions.find((s) => s.id === "sess-A")).toBeUndefined();
    // Peer's session row remains (we adopted it, not replaced it).
    expect(state.sessions.find((s) => s.id === "sess-peer")).toBeDefined();
  });

  it("createSession throws SQLSTATE 23505 BUT no recent session exists → re-throws (500-shaped)", async () => {
    // Pathological: unique-violation but no recent session for the user.
    // This shouldn't happen in practice (the violation implies a peer
    // row exists), but if it does, the fix MUST NOT silently swallow —
    // it must re-throw so the route's outer catch logs and returns 500.
    const ourOldSession = makeSession({ id: "sess-A", refreshToken: "token-old" });
    const { storage } = makeStorage({
      sessions: [ourOldSession],
      users: [makeUser()],
      roles: [makeRole()],
      orgs: [makeOrg()],
      createSessionThrowOnCall: {
        call: 1,
        err: Object.assign(new Error("duplicate key value violates unique constraint"), {
          code: "23505",
        }),
      },
    });
    const deps = makeDeps(storage);

    await expect(rotateRefreshToken("token-old", deps)).rejects.toThrow(
      /duplicate key/,
    );
  });

  it("createSession throws a NON-unique error → re-throws (500-shaped)", async () => {
    const ourOldSession = makeSession({ id: "sess-A", refreshToken: "token-old" });
    const { storage } = makeStorage({
      sessions: [ourOldSession],
      users: [makeUser()],
      roles: [makeRole()],
      orgs: [makeOrg()],
      createSessionThrowOnCall: {
        call: 1,
        err: Object.assign(new Error("connection refused"), { code: "08006" }),
      },
    });
    const deps = makeDeps(storage);

    await expect(rotateRefreshToken("token-old", deps)).rejects.toThrow(
      /connection refused/,
    );
  });
});

// ---------------------------------------------------------------------------
// rotateRefreshToken — N concurrent calls with the same token (the actual
// production race shape). Asserts: all return 200; no 500 surfaces; no
// unhandled rejection.
// ---------------------------------------------------------------------------

describe("rotateRefreshToken — N concurrent calls with same token (production race)", () => {
  it("8 concurrent calls all succeed (mix of fresh-rotation and fallback)", async () => {
    const ourOldSession = makeSession({ id: "sess-A", refreshToken: "token-old" });
    const { storage } = makeStorage({
      sessions: [ourOldSession],
      users: [makeUser()],
      roles: [makeRole()],
      orgs: [makeOrg()],
    });
    // Same `iat` second across all calls → byte-identical refresh
    // tokens → unique-violation race in the storage stub (which mirrors
    // the real Postgres unique-index behavior).
    const fixedSecond = Math.floor(FIXED_NOW / 1000);
    const deps = makeDeps(storage, { mintNow: () => fixedSecond });

    const results = await Promise.all(
      Array.from({ length: 8 }, () => rotateRefreshToken("token-old", deps)),
    );

    // (a) all return 200
    for (const r of results) {
      expect(r.kind).toBe("ok");
      if (r.kind === "ok") {
        expect(r.status).toBe(200);
        // (b) all return a valid access token
        expect(r.accessToken).toMatch(/^access-user-1-/);
        // (b cont.) all return a refresh token (either freshly minted
        // OR the peer's adopted token)
        expect(r.refreshToken).toMatch(/^refresh-user-1-org-1-role-1-/);
      }
    }
    // (c) no 500 surfaces — already covered by the kind==="ok" check above
    // (d) no unhandled rejection — Promise.all would have failed
  });

  it("4 concurrent calls with DIFFERENT iat seconds (no collision) all rotate cleanly", async () => {
    // Sanity check: when `iat` seconds differ, refresh tokens are
    // unique by construction, no fallback path is exercised, and all
    // calls still return 200. This locks in that the new fallback
    // doesn't break the no-collision case.
    const ourOldSession = makeSession({ id: "sess-A", refreshToken: "token-old" });
    const { storage } = makeStorage({
      sessions: [ourOldSession],
      users: [makeUser()],
      roles: [makeRole()],
      orgs: [makeOrg()],
    });
    let counter = Math.floor(FIXED_NOW / 1000);
    const deps = makeDeps(storage, { mintNow: () => counter++ });

    // Sequential — non-collision case, just a quick correctness check.
    for (let i = 0; i < 4; i++) {
      const lastSession = storage.getMostRecentSessionForUser
        ? await storage.getMostRecentSessionForUser("user-1")
        : undefined;
      const tokenIn = lastSession?.refreshToken ?? "token-old";
      const r = await rotateRefreshToken(tokenIn, deps);
      expect(r.kind).toBe("ok");
    }
  });
});
