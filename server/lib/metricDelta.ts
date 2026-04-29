/**
 * Metric delta helpers — Priority #6, Commit A (2026-04-27).
 *
 * Shared by `server/routes/insights.ts` (Insights Library tiles).
 * NOT shared by `server/vendorProxy.ts` / `server/sync.ts` — those return a
 * raw `number` to satisfy the existing JSON contract (`*Change: number`)
 * consumed by `client/src/pages/sales.tsx`. Switching them to the string
 * shape would be a UI behavior change and is deferred to Commit B.
 *
 * Operator-locked decisions (2026-04-27):
 *   - Tiny-base threshold: 5. When `prior < 5` (incl. `prior === 0`), the
 *     percent delta is suppressed because it is mathematically misleading.
 *     "Bad percentages are worse than missing percentages."
 *   - Render text when suppressed: `—` (em-dash, neutral). Matches the
 *     existing convention used by lib-2 / lib-4 / lib-17 / etc.
 *   - prior === 0 && current > 0 NO LONGER returns `+${current}` literal
 *     (the SAME_AS_VALUE_BUG visible on lib-6 "Pipeline Stagnation Index"
 *     as `+232`). Returns `'—' neutral`.
 *   - prior >= 5 → percent computed normally; unchanged.
 *   - Non-finite or negative `prior` (defensive) is treated as malformed
 *     input → returns `'—' neutral`. (`prior < 5` already covers
 *     negatives; the explicit check is for NaN / Infinity.)
 */

export type MetricDelta = {
  change: string;
  trend: 'up' | 'down' | 'neutral';
};

const NEUTRAL: MetricDelta = { change: '—', trend: 'neutral' };
export const TINY_BASE_THRESHOLD = 5;

/**
 * Percent change for absolute-value metrics (counts, days, etc.).
 * Suppresses when prior is below the tiny-base threshold.
 */
export function computeChange(current: number, prior: number): MetricDelta {
  if (!Number.isFinite(current) || !Number.isFinite(prior)) return NEUTRAL;
  if (prior < TINY_BASE_THRESHOLD) return NEUTRAL;
  const pct = Math.round(((current - prior) / prior) * 100);
  if (pct > 0) return { change: `+${pct}%`, trend: 'up' };
  if (pct < 0) return { change: `${pct}%`, trend: 'down' };
  return { change: '0%', trend: 'neutral' };
}

/**
 * Percentage-point change for rate metrics (rates, ratios, percentages).
 * Returns the absolute pp difference between current and prior rates.
 *
 * Behavior preserved from the prior inline implementation: suppression
 * fires only when `priorDen === 0`. Tightening this to `< TINY_BASE_THRESHOLD`
 * would silently change every rate-based lib metric (close rates, win
 * rate, hot-lead conversion, contact rate, etc.) and is therefore
 * deferred to a future commit with explicit operator review.
 */
export function computeRateChange(
  curNum: number,
  curDen: number,
  priorNum: number,
  priorDen: number,
): MetricDelta {
  if (
    !Number.isFinite(curNum) || !Number.isFinite(curDen) ||
    !Number.isFinite(priorNum) || !Number.isFinite(priorDen)
  ) return NEUTRAL;
  if (priorDen === 0) return NEUTRAL;
  const curRate = curDen > 0 ? (curNum / curDen) * 100 : 0;
  const priorRate = (priorNum / priorDen) * 100;
  const diff = Math.round(curRate - priorRate);
  if (diff > 0) return { change: `+${diff}pp`, trend: 'up' };
  if (diff < 0) return { change: `${diff}pp`, trend: 'down' };
  return { change: '0pp', trend: 'neutral' };
}
