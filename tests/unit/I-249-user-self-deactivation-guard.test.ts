/**
 * Regression tests for I-249 (self-deactivation lockout).
 *
 * Vulnerability: PATCH /api/users/:id at server/routes/users.ts:179
 * accepted `isActive: false` from any roleLevel <= 3 caller against any
 * target, including their own row. A distracted org_admin could click the
 * wrong toggle in settings and lock themselves out of their dealership,
 * costing super_admin support time to recover.
 *
 * Fix (server/routes/users.ts ~line 194): handler now calls
 * `isSelfDeactivationAttempt(req.user, req.params, req.body)` before the
 * allowed-fields whitelist and returns 400 when true. Re-activation
 * (isActive=true on self) is harmless and remains allowed.
 */

import { describe, it, expect } from "vitest";
import { isSelfDeactivationAttempt } from "@server/lib/selfModifyGuard";

describe("isSelfDeactivationAttempt (I-249)", () => {
  it("[I-249] self + isActive=false → true (BLOCK)", () => {
    expect(
      isSelfDeactivationAttempt({ id: "u1" }, { id: "u1" }, { isActive: false }),
    ).toBe(true);
  });

  it("[I-249] different user + isActive=false → false (admin may deactivate someone else)", () => {
    expect(
      isSelfDeactivationAttempt({ id: "u1" }, { id: "u2" }, { isActive: false }),
    ).toBe(false);
  });

  it("[I-249] self + isActive=true → false (re-activation is harmless)", () => {
    expect(
      isSelfDeactivationAttempt({ id: "u1" }, { id: "u1" }, { isActive: true }),
    ).toBe(false);
  });

  it("[I-249] self with no isActive in body → false (other field updates pass)", () => {
    expect(
      isSelfDeactivationAttempt({ id: "u1" }, { id: "u1" }, { firstName: "Jane" }),
    ).toBe(false);
  });

  it("[I-249] self with empty body → false", () => {
    expect(isSelfDeactivationAttempt({ id: "u1" }, { id: "u1" }, {})).toBe(false);
  });

  it("[I-249] truthy non-boolean isActive (e.g. string 'false') is NOT triggered (strict false-only)", () => {
    expect(
      isSelfDeactivationAttempt(
        { id: "u1" },
        { id: "u1" },
        { isActive: "false" as unknown as boolean },
      ),
    ).toBe(false);
  });

  it("[I-249] null req.user is safe — returns false", () => {
    expect(
      isSelfDeactivationAttempt(null, { id: "u1" }, { isActive: false }),
    ).toBe(false);
  });

  it("[I-249] undefined req.user is safe — returns false", () => {
    expect(
      isSelfDeactivationAttempt(undefined, { id: "u1" }, { isActive: false }),
    ).toBe(false);
  });

  it("[I-249] missing params.id is safe — returns false", () => {
    expect(
      isSelfDeactivationAttempt({ id: "u1" }, {}, { isActive: false }),
    ).toBe(false);
  });

  it("[I-249] super_admin u1 cannot self-deactivate either (gate is identity-based, not role-based)", () => {
    expect(
      isSelfDeactivationAttempt({ id: "super-1" }, { id: "super-1" }, { isActive: false }),
    ).toBe(true);
  });

  it("[I-249] case-mismatched id (real UUIDs are case-sensitive) → false", () => {
    expect(
      isSelfDeactivationAttempt(
        { id: "abc-123" },
        { id: "ABC-123" },
        { isActive: false },
      ),
    ).toBe(false);
  });
});
