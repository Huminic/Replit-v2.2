/**
 * Local reproduction of the Priority #3 refresh-token rotation race.
 *
 * Drives `rotateRefreshToken` (server/lib/refreshTokenRotation.ts) with
 * the same in-memory storage stub used by tests/unit/refreshTokenRotation.test.ts,
 * over 30 paired-parallel attempts. Mirrors the shape of the original
 * 30-iteration paired curl repro that fired against dev (16/30 = ~53%
 * failure rate before the fix). With the fix in place, all 30 iterations
 * must succeed (60/60 calls return 200, no 500 surfaces).
 *
 * Does NOT call dev.huminicdev.com or any live service. Self-contained.
 *
 * Run:
 *   npx tsx evidence/priority-3-hard-reload-auth/race-repro.ts
 */

import {
  rotateRefreshToken,
  type RotationStorage,
  type RotationDeps,
} from "../../server/lib/refreshTokenRotation";
import type { Session, User, Role, Organization } from "../../shared/schema";

const FIXED_NOW = new Date("2026-04-27T20:00:00.000Z").getTime();

function makeUser(): User {
  return {
    id: "user-1",
    email: "serra_honda@huminic.ai",
    firstName: "Serra",
    lastName: "Honda",
    passwordHash: "hash",
    profilePhotoUrl: null,
    roleId: "role-1",
    organizationId: "org-1",
    createdAt: new Date(FIXED_NOW),
    updatedAt: new Date(FIXED_NOW),
  } as User;
}

function makeRole(): Role {
  return {
    id: "role-1",
    name: "org_admin",
    level: 3,
    createdAt: new Date(FIXED_NOW),
  } as Role;
}

function makeOrg(): Organization {
  return {
    id: "org-1",
    name: "Serra Honda",
    slug: "serra-honda",
    createdAt: new Date(FIXED_NOW),
    updatedAt: new Date(FIXED_NOW),
  } as Organization;
}

function makeStorage(initialToken: string) {
  const sessions: Session[] = [
    {
      id: "sess-A",
      userId: "user-1",
      refreshToken: initialToken,
      expiresAt: new Date(FIXED_NOW + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(FIXED_NOW - 1_000),
    } as Session,
  ];
  const users = [makeUser()];
  const roles = [makeRole()];
  const orgs = [makeOrg()];

  const storage: RotationStorage = {
    async getSessionByRefreshToken(token) {
      return sessions.find((s) => s.refreshToken === token);
    },
    async deleteSession(id) {
      const idx = sessions.findIndex((s) => s.id === id);
      if (idx >= 0) sessions.splice(idx, 1);
    },
    async createSession({ userId, refreshToken, expiresAt }) {
      // Mirror the Postgres unique-index behavior the production race trips.
      if (sessions.some((s) => s.refreshToken === refreshToken)) {
        const err: any = new Error(
          'duplicate key value violates unique constraint "sessions_refresh_token_unique"',
        );
        err.code = "23505";
        throw err;
      }
      const created: Session = {
        id: "sess-" + (sessions.length + 1) + "-" + Math.random().toString(36).slice(2, 6),
        userId,
        refreshToken,
        expiresAt,
        createdAt: new Date(FIXED_NOW),
      } as Session;
      sessions.push(created);
      return created;
    },
    async getMostRecentSessionForUser(userId) {
      return sessions
        .filter((s) => s.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    },
    async getUser(id) {
      return users.find((u) => u.id === id);
    },
    async getRole(id) {
      return roles.find((r) => r.id === id);
    },
    async getOrganization(id) {
      return orgs.find((o) => o.id === id);
    },
  };

  return { storage, sessions };
}

function makeDeps(storage: RotationStorage): RotationDeps {
  // Deterministic token mint that produces byte-identical refresh tokens
  // for any two calls in the same `iat` second with the same payload.
  // This is exactly the production collision shape from `jwt.sign`.
  const fixedSecond = Math.floor(FIXED_NOW / 1000);
  return {
    storage,
    generateAccessToken: ({ userId }) => `access-${userId}-${fixedSecond}`,
    generateRefreshToken: ({ userId, organizationId, roleId }) =>
      `refresh-${userId}-${organizationId}-${roleId}-${fixedSecond}`,
    verifyRefreshToken: () => ({ userId: "user-1" }),
    getRefreshTokenExpiryDate: () => new Date(FIXED_NOW + 7 * 24 * 60 * 60 * 1000),
    getAccessTokenExpirySeconds: () => 3600,
    now: () => FIXED_NOW,
  };
}

async function main() {
  const ITERATIONS = 30;
  let pairsAttempted = 0;
  let callsTotal = 0;
  let callsOk = 0;
  let callsErr = 0;
  const errors: string[] = [];

  for (let i = 1; i <= ITERATIONS; i++) {
    const { storage } = makeStorage("token-old");
    const deps = makeDeps(storage);
    pairsAttempted++;

    const results = await Promise.allSettled([
      rotateRefreshToken("token-old", deps),
      rotateRefreshToken("token-old", deps),
    ]);

    for (const r of results) {
      callsTotal++;
      if (r.status === "fulfilled") {
        if (r.value.kind === "ok") {
          callsOk++;
        } else {
          callsErr++;
          errors.push(`iter ${i}: error result ${r.value.status} ${r.value.message}`);
        }
      } else {
        callsErr++;
        errors.push(`iter ${i}: rejected ${r.reason}`);
      }
    }
  }

  console.log("=== Priority #3 race repro ===");
  console.log(`pairs attempted     : ${pairsAttempted}`);
  console.log(`calls total         : ${callsTotal}`);
  console.log(`calls returning 200 : ${callsOk}`);
  console.log(`calls failing       : ${callsErr}`);
  if (errors.length) {
    console.log("--- failures ---");
    for (const e of errors) console.log(e);
  }

  const pass = callsErr === 0 && callsOk === callsTotal;
  console.log(`verdict             : ${pass ? "PASS" : "FAIL"}`);
  process.exit(pass ? 0 : 1);
}

main().catch((err) => {
  console.error("repro crashed:", err);
  process.exit(2);
});
