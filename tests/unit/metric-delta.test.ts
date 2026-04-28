/**
 * Unit tests — `server/lib/metricDelta.ts`.
 *
 * Locks the Priority #6 (Commit A) operator-locked behavior contract for
 * the Insights Library tile delta helper, fixing two bugs visible in the
 * 2026-04-27 investigation:
 *
 *   1. SAME_AS_VALUE_BUG (lib-6 "Pipeline Stagnation Index" rendering
 *      `+232` when value=232 and prior=0). The old `computeChange`
 *      returned the literal `+${current}` when `prior === 0`. Now
 *      suppressed → `'—' neutral`.
 *
 *   2. MISLEADING_DELTA_TINY_BASE (lib-31 "Sales Velocity" rendering
 *      `-57%` from 0.7→0.3 daily; would also affect any future
 *      small-baseline metric inside Insights Library). Old helper had
 *      no tiny-base guard. Now `prior < 5` → `'—' neutral`.
 *
 * Operator-locked decisions (2026-04-27):
 *   - threshold 5 (`prior < 5` suppresses; `prior >= 5` computes normally)
 *   - render `'—' neutral` (em-dash) — matches lib-2 / lib-4 / lib-17
 *
 * Note: the Sales tile `+257%` (current=50 vs prior=14) is intentionally
 * NOT suppressed by this commit; the operator confirmed `prior=14` is
 * "potentially noisy but not mathematically fake." That tile is rendered
 * by `server/vendorProxy.ts:pctChange`, which still reports the percent
 * because prior >= 5 there too.
 */

import { describe, it, expect } from "vitest";
import {
  computeChange,
  computeRateChange,
  TINY_BASE_THRESHOLD,
} from "@server/lib/metricDelta";

describe("computeChange — Priority #6 Commit A", () => {
  describe("zero / suppressed cases", () => {
    it("0 / 0 → '—' neutral", () => {
      expect(computeChange(0, 0)).toEqual({ change: "—", trend: "neutral" });
    });

    it("0 / N (N > 0) → '—' neutral (kills the SAME_AS_VALUE_BUG; was '+N')", () => {
      // lib-6 example: stagnantLeads.length=232, priorStagnantLeads.length=0.
      expect(computeChange(232, 0)).toEqual({ change: "—", trend: "neutral" });
      expect(computeChange(50, 0)).toEqual({ change: "—", trend: "neutral" });
      expect(computeChange(1, 0)).toEqual({ change: "—", trend: "neutral" });
    });
  });

  describe("tiny-base suppression (prior > 0 && prior < 5)", () => {
    it("1 / 2 → '—' neutral (prior=1; 100% increase but base is meaningless)", () => {
      expect(computeChange(2, 1)).toEqual({ change: "—", trend: "neutral" });
    });

    it("4 / 8 → '—' neutral (boundary: prior=4, just below threshold)", () => {
      expect(computeChange(8, 4)).toEqual({ change: "—", trend: "neutral" });
    });

    it("0 / 3 → '—' neutral (decline from tiny base also suppressed)", () => {
      expect(computeChange(0, 3)).toEqual({ change: "—", trend: "neutral" });
    });
  });

  describe("just-inside-threshold cases", () => {
    it("5 / 5 → '0%' neutral (boundary: prior=5 is the smallest non-suppressed base)", () => {
      expect(computeChange(5, 5)).toEqual({ change: "0%", trend: "neutral" });
    });

    it("10 / 5 → '+100%' up (clean doubling at threshold)", () => {
      expect(computeChange(10, 5)).toEqual({ change: "+100%", trend: "up" });
    });
  });

  describe("typical percent changes", () => {
    it("110 / 100 → '+10%' up", () => {
      expect(computeChange(110, 100)).toEqual({ change: "+10%", trend: "up" });
    });

    it("100 / 110 → '-9%' down (rounded)", () => {
      // (100-110)/110 = -0.0909 → rounded to -9%
      expect(computeChange(100, 110)).toEqual({ change: "-9%", trend: "down" });
    });

    it("0 / 100 → '-100%' down (decline to zero is a real signal — keep, not suppress)", () => {
      expect(computeChange(0, 100)).toEqual({ change: "-100%", trend: "down" });
    });
  });

  describe("defensive: malformed input", () => {
    it("NaN / 100 → '—' neutral", () => {
      expect(computeChange(NaN, 100)).toEqual({ change: "—", trend: "neutral" });
    });

    it("100 / NaN → '—' neutral", () => {
      expect(computeChange(100, NaN)).toEqual({ change: "—", trend: "neutral" });
    });

    it("Infinity / 100 → '—' neutral", () => {
      expect(computeChange(Infinity, 100)).toEqual({ change: "—", trend: "neutral" });
    });

    it("100 / -10 → '—' neutral (negative prior treated as malformed; covered by prior < 5)", () => {
      expect(computeChange(100, -10)).toEqual({ change: "—", trend: "neutral" });
    });
  });

  describe("threshold constant", () => {
    it("TINY_BASE_THRESHOLD is exactly 5 (operator-locked 2026-04-27)", () => {
      expect(TINY_BASE_THRESHOLD).toBe(5);
    });
  });
});

describe("computeRateChange — Priority #6 Commit A bonus (lib-7 fix)", () => {
  // The ratio-vs-ratio helper preserves its prior `priorDen === 0` →
  // `'—' neutral` suppression behavior. Tightening this to a tiny-base
  // threshold would silently change every rate metric (lib-8/9/10/12/14/
  // 15/16/27) and is deferred. The lib-7 (Fresh Lead Ratio) fix in this
  // commit is "render in pp not %", not "tighten the threshold".

  it("priorDen === 0 → '—' neutral", () => {
    expect(computeRateChange(5, 10, 0, 0)).toEqual({
      change: "—",
      trend: "neutral",
    });
  });

  it("identical rates → '0pp' neutral", () => {
    // 50% vs 50%
    expect(computeRateChange(5, 10, 50, 100)).toEqual({
      change: "0pp",
      trend: "neutral",
    });
  });

  it("rate increases by 9pp → '+9pp' up (lib-7 mock: 30% from 21%)", () => {
    // current 30% (e.g. 30/100) vs prior 21% (e.g. 21/100) → +9pp
    expect(computeRateChange(30, 100, 21, 100)).toEqual({
      change: "+9pp",
      trend: "up",
    });
  });

  it("rate decreases by 3pp → '-3pp' down (lib-8 observed live)", () => {
    // current 1% (6/620) vs prior 4% (24/620)
    expect(computeRateChange(6, 620, 24, 620)).toEqual({
      change: "-3pp",
      trend: "down",
    });
  });

  it("malformed inputs → '—' neutral", () => {
    expect(computeRateChange(NaN, 10, 5, 10)).toEqual({
      change: "—",
      trend: "neutral",
    });
    expect(computeRateChange(5, 10, 5, NaN)).toEqual({
      change: "—",
      trend: "neutral",
    });
  });
});
