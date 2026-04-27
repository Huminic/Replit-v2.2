/**
 * Unit tests for the pre-launch SMS fail-closed guard
 * (server/lib/preLaunchSmsGuard.ts).
 *
 * Operator-mandated 9 scenarios per Phase 2 spec, plus 2 refinements
 * raised in Phase 1 (category-prefixed allowlist entries; comment /
 * blank-line skipping).
 *
 * The guard is a pure function. These tests inject (recipient, env,
 * loadAllowlist) directly — no DB, no filesystem, no network.
 *
 * Critical safety properties exercised:
 *   - bypassBusinessHours=true does NOT bypass the prelaunch guard.
 *     (Test 3 — bypassBusinessHours has no effect on this layer; the
 *     guard does not consult it. Test 3 verifies that a blocked
 *     recipient stays blocked regardless of caller intent.)
 *   - Missing/empty allowlist file → fail-closed (BLOCK).
 *   - Empty/null/whitespace recipient → fail-closed (BLOCK).
 *   - Phone normalization: +1XXXXXXXXXX ↔ XXXXXXXXXX equivalence.
 *   - Operator's allowlist file format (category prefixes, comments,
 *     blank lines) is parsed correctly.
 */

import { describe, it, expect } from "vitest";
import {
  evaluatePreLaunchSmsGuard,
  parseAllowlist,
  isPreLaunchSmsGuardEngaged,
  type PreLaunchSmsGuardEnv,
} from "@server/lib/preLaunchSmsGuard";

// ---------------------------------------------------------------------------
// Allowlist fixtures
// ---------------------------------------------------------------------------

const ALLOWLIST_OPERATOR = ["14126546500"]; // already-normalized digits-only
const ALLOWLIST_OPERATOR_PLUS = ["+14126546500"]; // pre-parse form
const ALLOWLIST_EMPTY: string[] = [];

// Helpers — produce a loader that returns a fixed array (or throws to
// simulate file-missing). Tests inject these directly so production
// filesystem behavior is irrelevant.
const stubLoader = (entries: string[]) => () => entries;
const throwingLoader = (msg: string) => (): string[] => {
  throw new Error(msg);
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("evaluatePreLaunchSmsGuard", () => {
  // ── 1. PRELAUNCH_SMS_LOCK=true + non-allowlisted recipient → blocked ──
  it("PRELAUNCH_SMS_LOCK=true + non-allowlisted recipient → blocked", () => {
    const env: PreLaunchSmsGuardEnv = { PRELAUNCH_SMS_LOCK: "true" };
    const r = evaluatePreLaunchSmsGuard(
      "+15551234567",
      env,
      stubLoader(ALLOWLIST_OPERATOR),
    );
    expect(r.allow).toBe(false);
    expect(r.mode).toBe("block_not_on_allowlist");
    expect(r.reason).toContain("prelaunch-sms-lock");
  });

  // ── 2. PRELAUNCH_SMS_LOCK=true + allowlisted recipient → allow ────────
  it("PRELAUNCH_SMS_LOCK=true + allowlisted recipient → allow", () => {
    const env: PreLaunchSmsGuardEnv = { PRELAUNCH_SMS_LOCK: "true" };
    const r = evaluatePreLaunchSmsGuard(
      "+14126546500",
      env,
      stubLoader(ALLOWLIST_OPERATOR),
    );
    expect(r.allow).toBe(true);
    expect(r.mode).toBe("allow_allowlisted");
  });

  // ── 3. bypassBusinessHours=true does NOT bypass the prelaunch guard ──
  // The guard signature does not accept bypassBusinessHours. This test
  // codifies the design contract: there is NO knob in the guard input
  // that callers can use to bypass an allowlist BLOCK. We assert by
  // calling the guard with the same inputs as test 1 and verifying the
  // BLOCK is unconditional.
  it("bypassBusinessHours flag exists at a higher layer but cannot influence this guard — non-allowlisted stays blocked", () => {
    const env: PreLaunchSmsGuardEnv = { PRELAUNCH_SMS_LOCK: "true" };
    // Caller passes bypassBusinessHours=true at SendRequest level; that
    // option never reaches this layer. Recipient is the same real-customer-
    // shaped phone that the 2026-04-13 INC-001 incident sent to (Lisa
    // Morris): regression-anchor the case.
    const r = evaluatePreLaunchSmsGuard(
      "+15417783509",
      env,
      stubLoader(ALLOWLIST_OPERATOR),
    );
    expect(r.allow).toBe(false);
    expect(r.mode).toBe("block_not_on_allowlist");
  });

  // ── 4. TESTLANE_MODE=true + non-allowlisted recipient → blocked ─────────
  it("TESTLANE_MODE=true + non-allowlisted recipient → blocked", () => {
    const env: PreLaunchSmsGuardEnv = {
      PRELAUNCH_SMS_LOCK: "false",
      TESTLANE_MODE: "true",
    };
    const r = evaluatePreLaunchSmsGuard(
      "+15551234567",
      env,
      stubLoader(ALLOWLIST_OPERATOR),
    );
    expect(r.allow).toBe(false);
    expect(r.mode).toBe("block_not_on_allowlist");
  });

  // ── 5. TESTLANE_MODE=true + allowlisted internal_operator → allow ─────
  it("TESTLANE_MODE=true + allowlisted internal_operator → allow", () => {
    const env: PreLaunchSmsGuardEnv = {
      PRELAUNCH_SMS_LOCK: "false",
      TESTLANE_MODE: "true",
    };
    const r = evaluatePreLaunchSmsGuard(
      "+14126546500",
      env,
      stubLoader(ALLOWLIST_OPERATOR),
    );
    expect(r.allow).toBe(true);
    expect(r.mode).toBe("allow_allowlisted");
  });

  // ── 6. PRELAUNCH_SMS_LOCK=false AND TESTLANE_MODE=false → guard inert ─
  it("PRELAUNCH_SMS_LOCK=false AND TESTLANE_MODE=false → guard inert (allow without consulting allowlist)", () => {
    const env: PreLaunchSmsGuardEnv = {
      PRELAUNCH_SMS_LOCK: "false",
      TESTLANE_MODE: "false",
    };
    const r = evaluatePreLaunchSmsGuard(
      "+15551234567", // non-allowlisted
      env,
      // The loader should NOT be called when guard is inert. Throw to
      // assert this — if the guard called us, the test would fail.
      throwingLoader("loader should not be called when guard is inert"),
    );
    expect(r.allow).toBe(true);
    expect(r.mode).toBe("inert");
  });

  // ── 7. Missing allowlist file → fail-closed (block all) ──────────────
  it("Missing allowlist file (loader throws) → fail-closed BLOCK", () => {
    const env: PreLaunchSmsGuardEnv = { PRELAUNCH_SMS_LOCK: "true" };
    const r = evaluatePreLaunchSmsGuard(
      "+14126546500", // even an allowlisted phone — file missing means we
                      // can't verify, so fail-closed.
      env,
      throwingLoader("ENOENT: no such file or directory"),
    );
    expect(r.allow).toBe(false);
    expect(r.mode).toBe("block_allowlist_missing");
    expect(r.reason).toContain("ENOENT");
  });

  // ── 8. Empty allowlist file → fail-closed (block all) ────────────────
  it("Empty allowlist file → fail-closed BLOCK", () => {
    const env: PreLaunchSmsGuardEnv = { PRELAUNCH_SMS_LOCK: "true" };
    const r = evaluatePreLaunchSmsGuard(
      "+14126546500",
      env,
      stubLoader(ALLOWLIST_EMPTY),
    );
    expect(r.allow).toBe(false);
    expect(r.mode).toBe("block_allowlist_empty");
  });

  // ── 9. Empty recipient → fail-closed (block) ─────────────────────────
  it("Empty recipient → fail-closed BLOCK", () => {
    const env: PreLaunchSmsGuardEnv = { PRELAUNCH_SMS_LOCK: "true" };
    expect(evaluatePreLaunchSmsGuard("", env, stubLoader(ALLOWLIST_OPERATOR)).allow).toBe(false);
    expect(evaluatePreLaunchSmsGuard(null, env, stubLoader(ALLOWLIST_OPERATOR)).allow).toBe(false);
    expect(evaluatePreLaunchSmsGuard(undefined, env, stubLoader(ALLOWLIST_OPERATOR)).allow).toBe(false);
    expect(evaluatePreLaunchSmsGuard("   ", env, stubLoader(ALLOWLIST_OPERATOR)).allow).toBe(false);
  });

  // ── 10. Allowlist with category prefix (Phase 1 refinement) ──────────
  it("Allowlist entry with category prefix (e.g. 'internal_operator:+14126546500') matches recipient in any normalized form", () => {
    const env: PreLaunchSmsGuardEnv = { PRELAUNCH_SMS_LOCK: "true" };
    // Use parseAllowlist on the operator-format text to get the realistic
    // post-parse entries the production loader produces.
    const text = "internal_operator:+14126546500\n";
    const entries = parseAllowlist(text);
    // The +1... form should normalize to digits-only.
    expect(entries).toEqual(["14126546500"]);

    // Recipient passed in any reasonable form should match.
    const phoneForms = [
      "+14126546500",
      "14126546500",
      "4126546500",
      "(412) 654-6500",
      "412-654-6500",
    ];
    for (const form of phoneForms) {
      const r = evaluatePreLaunchSmsGuard(form, env, stubLoader(entries));
      expect(r.allow, `recipient form ${form} should match`).toBe(true);
      expect(r.mode).toBe("allow_allowlisted");
    }
  });

  // ── 11. Comments and blank lines in allowlist file are skipped ───────
  it("Allowlist parser ignores blank lines, comment lines, and inline comments", () => {
    const text = `
# This is a comment line at the top.

# Another comment.
internal_operator:+14126546500

  # Indented comment-only line.
test_email:duane.wells@huminic.ai  # inline trailing comment

# Trailing blank line follows.

`;
    const entries = parseAllowlist(text);
    // Two entries — the operator phone (digits-only) and the test email
    // (lowercased). Comments and blanks must be absent.
    expect(entries).toEqual(["14126546500", "duane.wells@huminic.ai"]);

    // Behavioral check: an allowlisted email passes the guard; a non-
    // allowlisted recipient does not.
    const env: PreLaunchSmsGuardEnv = { PRELAUNCH_SMS_LOCK: "true" };
    expect(
      evaluatePreLaunchSmsGuard("duane.wells@huminic.ai", env, stubLoader(entries)).allow,
    ).toBe(true);
    expect(
      evaluatePreLaunchSmsGuard("+15551234567", env, stubLoader(entries)).allow,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isPreLaunchSmsGuardEngaged — separately exercised because the
// "default-true" semantics for PRELAUNCH_SMS_LOCK is a load-bearing
// safety property.
// ---------------------------------------------------------------------------

describe("isPreLaunchSmsGuardEngaged", () => {
  it("PRELAUNCH_SMS_LOCK unset → engaged (default-true safety)", () => {
    expect(isPreLaunchSmsGuardEngaged({})).toBe(true);
  });
  it("PRELAUNCH_SMS_LOCK='' → engaged (default-true safety)", () => {
    expect(isPreLaunchSmsGuardEngaged({ PRELAUNCH_SMS_LOCK: "" })).toBe(true);
  });
  it("PRELAUNCH_SMS_LOCK='true' → engaged", () => {
    expect(isPreLaunchSmsGuardEngaged({ PRELAUNCH_SMS_LOCK: "true" })).toBe(true);
  });
  it("PRELAUNCH_SMS_LOCK='TRUE' (case insensitive) → engaged", () => {
    expect(isPreLaunchSmsGuardEngaged({ PRELAUNCH_SMS_LOCK: "TRUE" })).toBe(true);
  });
  it("PRELAUNCH_SMS_LOCK='false' AND TESTLANE_MODE='false' → not engaged", () => {
    expect(
      isPreLaunchSmsGuardEngaged({ PRELAUNCH_SMS_LOCK: "false", TESTLANE_MODE: "false" }),
    ).toBe(false);
  });
  it("PRELAUNCH_SMS_LOCK='false' AND TESTLANE_MODE='true' → engaged", () => {
    expect(
      isPreLaunchSmsGuardEngaged({ PRELAUNCH_SMS_LOCK: "false", TESTLANE_MODE: "true" }),
    ).toBe(true);
  });
});
