/**
 * Regression tests for AUTH-D (forgot-password silent-fail on mixed-case email).
 *
 * Vulnerability: POST /api/auth/forgot-password at server/routes/auth.ts:353
 * read `req.body.email` and called `storage.getUserByEmail(email)` without
 * normalization. Storage does exact-match SQL (`eq(users.email, email)` at
 * server/storage.ts:259), so any case or whitespace difference between the
 * request body and the stored email silently missed the user record.
 * The endpoint still returns HTTP 200 to prevent enumeration, so users
 * believed reset succeeded but no email was ever sent.
 *
 * Operator-confirmed 2026-03-20: forgot-password attempt produced zero
 * Resend records.
 *
 * Fix: route layer normalizes input via `normalizeEmailForLookup` (lowercase
 * + trim). Storage layer untouched (out of scope per Wave 9-Sec S3).
 *
 * Wider finding fixed in same commit: POST /api/users (line 63) and POST
 * /api/users/invite (line 343) previously STORED emails as-typed. An admin
 * who created `Serra_Honda@Huminic.ai` would generate a row that no
 * lowercased-lookup could find. This commit normalizes on WRITE as well.
 */

import { describe, it, expect, vi } from "vitest";
import { normalizeEmailForLookup } from "@server/lib/emailNormalize";

describe("normalizeEmailForLookup (AUTH-D)", () => {
  it("[AUTH-D] mixed-case email is lowercased before lookup", () => {
    expect(normalizeEmailForLookup("Serra_Honda@huminic.ai")).toBe(
      "serra_honda@huminic.ai",
    );
  });

  it("[AUTH-D] all-uppercase email is lowercased", () => {
    expect(normalizeEmailForLookup("SERRA_HONDA@HUMINIC.AI")).toBe(
      "serra_honda@huminic.ai",
    );
  });

  it("[AUTH-D] surrounding whitespace is trimmed (copy-paste artifact)", () => {
    expect(normalizeEmailForLookup("  serra_honda@huminic.ai  ")).toBe(
      "serra_honda@huminic.ai",
    );
  });

  it("[AUTH-D] both trim AND lowercase applied", () => {
    expect(normalizeEmailForLookup("  SERRA_Honda@huminic.AI  ")).toBe(
      "serra_honda@huminic.ai",
    );
  });

  it("[AUTH-D] empty string stays empty (route short-circuits on falsy)", () => {
    expect(normalizeEmailForLookup("")).toBe("");
  });

  it("[AUTH-D] whitespace-only collapses to empty (route short-circuits)", () => {
    expect(normalizeEmailForLookup("   ")).toBe("");
  });

  it("[AUTH-D] undefined body field is safe — returns empty", () => {
    expect(normalizeEmailForLookup(undefined)).toBe("");
  });

  it("[AUTH-D] null body field is safe — returns empty", () => {
    expect(normalizeEmailForLookup(null)).toBe("");
  });

  it("[AUTH-D] non-string types coerce safely (no crash)", () => {
    expect(normalizeEmailForLookup(123)).toBe("123");
    expect(normalizeEmailForLookup(true)).toBe("true");
  });
});

describe("forgot-password lookup flow (AUTH-D end-to-end semantics)", () => {
  // Simulates the handler's normalize-then-lookup path without booting Express.
  function simulateForgotPasswordLookup(
    rawEmail: unknown,
    storedEmail: string,
    getUserByEmail: (email: string) => Promise<{ email: string } | undefined>,
  ) {
    const email = normalizeEmailForLookup(rawEmail);
    if (!email) return { called: false, found: undefined };
    return getUserByEmail(email).then((u) => ({ called: true, found: u }));
  }

  it("[AUTH-D] Mixed-case request finds a lowercase-stored user", async () => {
    const storedEmail = "serra_honda@huminic.ai";
    const spy = vi.fn(async (email: string) =>
      email === storedEmail ? { email: storedEmail } : undefined,
    );
    const result = await simulateForgotPasswordLookup(
      "Serra_Honda@huminic.ai",
      storedEmail,
      spy,
    );
    expect(spy).toHaveBeenCalledWith("serra_honda@huminic.ai");
    expect(result).toEqual({ called: true, found: { email: storedEmail } });
  });

  it("[AUTH-D] All-caps request finds a lowercase-stored user", async () => {
    const storedEmail = "serra_honda@huminic.ai";
    const spy = vi.fn(async (email: string) =>
      email === storedEmail ? { email: storedEmail } : undefined,
    );
    await simulateForgotPasswordLookup(
      "SERRA_HONDA@HUMINIC.AI",
      storedEmail,
      spy,
    );
    expect(spy).toHaveBeenCalledWith("serra_honda@huminic.ai");
  });

  it("[AUTH-D] Whitespace-padded request finds a lowercase-stored user", async () => {
    const storedEmail = "serra_honda@huminic.ai";
    const spy = vi.fn(async (email: string) =>
      email === storedEmail ? { email: storedEmail } : undefined,
    );
    await simulateForgotPasswordLookup(
      "  serra_honda@huminic.ai  ",
      storedEmail,
      spy,
    );
    expect(spy).toHaveBeenCalledWith("serra_honda@huminic.ai");
  });

  it("[AUTH-D] empty body.email short-circuits — no lookup is made", async () => {
    const spy = vi.fn(async () => undefined);
    const result = await simulateForgotPasswordLookup("", "", spy);
    expect(spy).not.toHaveBeenCalled();
    expect(result).toEqual({ called: false, found: undefined });
  });

  it("[AUTH-D] missing body.email short-circuits — no lookup is made", async () => {
    const spy = vi.fn(async () => undefined);
    const result = await simulateForgotPasswordLookup(undefined, "", spy);
    expect(spy).not.toHaveBeenCalled();
    expect(result).toEqual({ called: false, found: undefined });
  });
});
