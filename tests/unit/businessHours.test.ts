/**
 * isWithinBusinessHours — chunk 2A I-248 fix.
 *
 * Pre-fix: an invalid timezone string crashed `toLocaleString({timeZone:badTz})`
 * or produced an Invalid Date whose `getHours()` returned NaN. NaN >= start
 * was always false, permanently blocking ALL outbound SMS for that org with
 * no error logged. Post-fix: invalid TZ falls back to America/New_York with
 * a console warning, and hour=24 is normalized to 0.
 */

import { describe, it, expect, vi } from "vitest";
import { isWithinBusinessHours } from "@server/outbound";
import type { Organization } from "@shared/schema";

function makeOrg(settings: Record<string, unknown>): Organization {
  return {
    id: "o1",
    name: "Test Org",
    settings,
  } as unknown as Organization;
}

describe("isWithinBusinessHours (I-248)", () => {
  it("falls back to America/New_York when timezone is invalid", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const org = makeOrg({ timezone: "Not/A/Real/Timezone" });
    const result = isWithinBusinessHours(org);
    expect(result.tz).toBe("America/New_York");
    expect(typeof result.currentHour).toBe("number");
    expect(Number.isFinite(result.currentHour)).toBe(true);
    expect(result.currentHour).toBeGreaterThanOrEqual(0);
    expect(result.currentHour).toBeLessThan(24);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("invalid timezone"));
    warn.mockRestore();
  });

  it("does not log when timezone is valid", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const org = makeOrg({ timezone: "America/Chicago" });
    const result = isWithinBusinessHours(org);
    expect(result.tz).toBe("America/Chicago");
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("uses default 8-21 business hours when settings omit them", () => {
    const org = makeOrg({ timezone: "America/Chicago" });
    const result = isWithinBusinessHours(org);
    expect(result.start).toBe(8);
    expect(result.end).toBe(21);
  });

  it("respects custom business hours within valid bounds", () => {
    const org = makeOrg({ timezone: "America/Chicago", businessHoursStart: "9", businessHoursEnd: "18" });
    const result = isWithinBusinessHours(org);
    expect(result.start).toBe(9);
    expect(result.end).toBe(18);
  });

  it("rejects out-of-range businessHoursStart and falls back to default", () => {
    const org = makeOrg({ timezone: "America/Chicago", businessHoursStart: "99", businessHoursEnd: "21" });
    const result = isWithinBusinessHours(org);
    expect(result.start).toBe(8); // fell back to default
    expect(result.end).toBe(21);
  });

  it("rejects non-numeric businessHoursStart and falls back", () => {
    const org = makeOrg({ timezone: "America/Chicago", businessHoursStart: "morning", businessHoursEnd: "21" });
    const result = isWithinBusinessHours(org);
    expect(result.start).toBe(8);
  });

  it("rejects negative business hours and falls back", () => {
    const org = makeOrg({ timezone: "America/Chicago", businessHoursStart: "-5", businessHoursEnd: "21" });
    const result = isWithinBusinessHours(org);
    expect(result.start).toBe(8);
  });

  it("returns currentHour as a real integer 0-23 (never NaN)", () => {
    // Pre-fix regression test: bad TZ produced NaN currentHour and locked outbound.
    const org = makeOrg({ timezone: "BAD/TZ", businessHoursStart: "8", businessHoursEnd: "21" });
    const result = isWithinBusinessHours(org);
    expect(Number.isInteger(result.currentHour)).toBe(true);
    expect(result.currentHour).toBeGreaterThanOrEqual(0);
    expect(result.currentHour).toBeLessThan(24);
    // `within` must be a real boolean, not silently false-from-NaN.
    expect(typeof result.within).toBe("boolean");
  });

  it("handles missing settings entirely (null/undefined)", () => {
    const org = { id: "o1", name: "T", settings: null } as unknown as Organization;
    const result = isWithinBusinessHours(org);
    expect(result.tz).toBe("America/New_York");
    expect(result.start).toBe(8);
    expect(result.end).toBe(21);
    expect(Number.isInteger(result.currentHour)).toBe(true);
  });
});
