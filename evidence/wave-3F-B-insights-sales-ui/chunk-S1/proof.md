# Wave 3F-B Chunk S1 — Em-dash threshold (n<20) on Conversion/Win Rate tiles

**Commit SHA:** `aba0156d793a9dd20ba8370e84b7f806c48ed5b5`
**Date:** 2026-05-07
**Branch:** worktree-agent-a7cbfc4e66f52aa8f (worktree off origin/main)

## Scope (per wave-bookend)

- `client/src/pages/sales.tsx` Conversion Rate tile (sm-7, line ~129)
- `client/src/pages/insights.tsx` Win Rate tile (sc-1, line ~262)

Threshold rule: when the denominator (sample size) is `< 20`, render `'—'` instead of the percentage. Threshold applies ONLY to the user-facing tile labels — chart-data points (insights.tsx lines 1048, 1085, 2050, 2101) stay raw per wave-bookend explicit instruction.

## Denominator-source rationale

### sales.tsx Conversion Rate (sm-7)

`/api/vin/leads/summary` ships the `LeadSummary` shape (sales.tsx:74-90). Both `soldLeads: number` and `lostLeads: number` are exposed top-level. The conversion rate semantics on this endpoint are sold/(sold+lost) — the original VIN-summary formula. So the denominator for the small-sample threshold is `summary.soldLeads + summary.lostLeads`.

### insights.tsx Win Rate (sc-1)

The `convRate` consumed at sc-1 comes from `overview.conversionRate` (insights.tsx:219). Per Wave 1C-S5 commit `3c40091`, the server (server/routes/insights.ts) now computes this as the **lib-8 lifetime win rate** — formula `sold / total` (not `sold / (sold+lost)`). So the natural sample size for the threshold is `overview.totalLeads`, already destructured at insights.tsx:216 as `totalLeads`.

This single field (`overview.totalLeads`) was reachable from the existing data shape — no server-side work required. STOP-condition check (denominator unreachable) does NOT apply.

## Diff

### sales.tsx (lines 128-134)

```tsx
    // I-114: change=null — API does not provide conversionRateChange; using absolute rate as delta was misleading.
    // Wave 3F-A: null guard (defensive — API may emit null).
    // Wave 3F-B-S1: small-sample em-dash threshold. When the conversion-rate denominator
    // (soldLeads + lostLeads) is < 20, render '—' to avoid misleading 100%/0% on tiny samples.
    // Threshold applies only to this user-facing tile label; chart-data points stay raw.
    { id: 'sm-7', label: 'Conversion Rate', value: (summary.conversionRate == null || (summary.soldLeads + summary.lostLeads) < 20) ? '—' : `${summary.conversionRate}%`, change: null, trend: 'up' as const, icon: TrendingUp },
```

This composite condition combines the Wave 3F-A null guard (`summary.conversionRate == null`) with the new n<20 threshold, since this worktree branches off origin/main pre-3F-A merge. The condition is logically equivalent to the chained guards expected by the wave-bookend.

### insights.tsx (lines 261-266)

```tsx
  // Wave 3F-B-S1: small-sample em-dash threshold for the Win Rate tile.
  // Denominator is the lifetime sample size (overview.totalLeads, per the lib-8 formula
  // sold/total introduced in Chunk 1C-S5). When totalLeads < 20, render '—' on the user-facing
  // tile label only — chart-data points (lines 1048, 1085, 2050, 2101) stay raw.
  const winRateTileValue = (overview.conversionRate == null || totalLeads < 20) ? '—' : `${convRate}%`;
  const scorecardConversionMetrics: ... = [
    { id: 'sc-1', label: 'Win Rate', value: winRateTileValue, sparkline: [convRate], trend: 'neutral', change: '' },
    ...
```

A small derived const (`winRateTileValue`) keeps the JSX-row readable while expressing the threshold. The `sparkline` value remains raw (`convRate`) per the wave-bookend's "chart-data points stay raw" rule.

## Verification

### Δ1 — Static checks

| Check | Result | Notes |
|---|---|---|
| `npx tsc --noEmit` | PASS | No output (silent success) |
| `npx vitest run tests/unit/` | PASS | 452 passed / 2 skipped — matches worktree baseline exactly |

`vitest` initially failed due to the worktree lacking `.env`; symlinked `.env` → `/home/ubuntu/Claude-store/nexxus2.2_replit/.env` so DATABASE_URL was reachable. No test files modified.

### Files touched

- `client/src/pages/sales.tsx` (1 line changed at sm-7 + 3 comment lines)
- `client/src/pages/insights.tsx` (2 lines changed at sc-1 + 4 comment lines)

### Scope markers

- `.claude/state/scope/sales.tsx.ok`
- `.claude/state/scope/insights.tsx.ok`

### Out-of-scope confirmations

- `client/src/pages/insights.tsx:335` (Win Rate in trend list) — NOT modified. Per wave-bookend, only user-facing tile labels need the threshold; trend rows are not the primary tile.
- `client/src/pages/insights.tsx:1048, 1085, 2050, 2101` (chart-data points) — NOT modified per explicit bookend rule.
- No new visual elements (badges, tooltips, banners) — operator picked Option B (em-dash) for Item 1.
