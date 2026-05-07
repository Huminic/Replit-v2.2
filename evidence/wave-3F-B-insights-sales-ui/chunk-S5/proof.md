# Wave 3F-B Chunk S5 — Source Quality Trends mechanical fix

**Date:** 2026-05-07
**Chunk:** S5 (conditional fix from S4 finding — operator/advocate authorized inline)
**Branch:** `wave/5-insights/3F-B-design-gate`
**Commit SHA (fix):** `9ddefa6`
**File touched:** `client/src/pages/insights.tsx` (single file; +4 / -8 lines)

## Spec executed (advocate-locked, post-S4 finding)

S4 identified three concurrent defects in the Source Quality Trends card at `client/src/pages/insights.tsx:951-972`:

1. 5 broken `<Line>` components binding `dataKey` to fields (`internet`, `walkIn`, `phone`, `referral`, `service`) that don't exist on the data rows. Result: 5 flat lines on the X-axis, empty chart.
2. X-axis declared `dataKey="month"`, but the underlying data field `month` actually carries source-name strings (e.g. `"Source #3750035"`, `"Repeat Customer"`).
3. Subtitle `"Win rate by source over last 6 months"` misrepresents per-source-snapshot data as a 6-month time-series.

Locked S5 spec applied:

- **(a)** Replace the 5 broken Line components with ONE Line on `dataKey="winRate"` (kept first stroke color `#3B82F6`, `strokeWidth={2}`, `type="monotone"`).
- **(b)** Rename data-mapping field `month → source` at `insights.tsx:311`, AND change X-axis `dataKey="month" → "source"`. Both touch the same single file. Smaller-blast-radius confirmed by grep: `sourceQualityTrends` is only consumed in this one chart (lines 287, 310-312, 957).
- **(c)** Subtitle changed: `"Win rate by source over last 6 months"` → `"Win rate by lead source (lifetime)"`. Matches Wave 1C's lifetime metric doctrine.
- **(d)** Card title `"Source Quality Trends"` left untouched (deferred per spec).

## Scope marker

```
$ mkdir -p .claude/state/scope && touch .claude/state/scope/insights.tsx.ok
```

Marker is one-shot (auto-clears on each successful Edit), so it was recreated before each of the 3 Edit calls. No other files were touched.

## Edit diffs (before / after)

### Edit (b-data) — data-mapping field rename, line 311

**Before:**
```ts
const sourceQualityTrends = rptSourceQuality.map((s: any) => ({
  month: s.source, winRate: s.winRate, volume: s.leads,
}));
```

**After:**
```ts
const sourceQualityTrends = rptSourceQuality.map((s: any) => ({
  source: s.source, winRate: s.winRate, volume: s.leads,
}));
```

### Edit (c) — subtitle, line 952

**Before:**
```tsx
<CardTitle className="text-base">Source Quality Trends</CardTitle>
<CardDescription>Win rate by source over last 6 months</CardDescription>
```

**After:**
```tsx
<CardTitle className="text-base">Source Quality Trends</CardTitle>
<CardDescription>Win rate by lead source (lifetime)</CardDescription>
```

### Edit (a + b-axis) — X-axis dataKey + 5→1 Line collapse, lines 959-963

**Before:**
```tsx
<XAxis dataKey="month" className="text-xs" />
<YAxis className="text-xs" />
<Tooltip ... />
<Legend />
<Line type="monotone" dataKey="internet" name="Internet" stroke="#3B82F6" strokeWidth={2} />
<Line type="monotone" dataKey="walkIn" name="Walk-In" stroke="#10B981" strokeWidth={2} />
<Line type="monotone" dataKey="phone" name="Phone" stroke="#F59E0B" strokeWidth={2} />
<Line type="monotone" dataKey="referral" name="Referral" stroke="#8B5CF6" strokeWidth={2} />
<Line type="monotone" dataKey="service" name="Service" stroke="#EF4444" strokeWidth={2} />
```

**After:**
```tsx
<XAxis dataKey="source" className="text-xs" />
<YAxis className="text-xs" />
<Tooltip ... />
<Legend />
<Line type="monotone" dataKey="winRate" name="Win Rate" stroke="#3B82F6" strokeWidth={2} />
```

## Δ1 — tsc + vitest

### `npx tsc --noEmit`

PASS (no output = no type errors).

### `npx vitest run tests/unit/`

```
Test Files  17 passed (17)
     Tests  459 passed | 2 skipped (461)
  Start at  05:50:09
  Duration  51.41s
```

Baseline 459 / 2 maintained. No regressions introduced by the chart fix.

## git stat

```
$ git diff --stat client/src/pages/insights.tsx
 client/src/pages/insights.tsx | 12 ++++--------
 1 file changed, 4 insertions(+), 8 deletions(-)
```

## Commit

```
$ git log --oneline -3
9ddefa6 fix(insights): repair broken Source Quality Trends chart + honest subtitle (Chunk 3F-B-S5)
1b1f495 evidence(wave-3F-B): Chunks S1-S4 proofs + S4 Source Quality Trends investigation (READ-ONLY)
5e6ed61 fix(insights): rename 'Top Performing Agents' to 'Top Performing AI Agents' (Chunk 3F-B-S3)
```

## Hard rules respected

- No server-side edits. Only `client/src/pages/insights.tsx`.
- No new visual elements (no badges, tooltips, animations).
- No commits to `batch-1-finish-line` or `main`. Only `wave/5-insights/3F-B-design-gate`.
- Did NOT push to origin.
- Card title NOT renamed (deferred per spec).

## Δ2 deferred

Δ2 (Playwright walk on dev) is the orchestrator's responsibility after `npm run build` + `pm2 restart nexxus-app` — not in S5 builder scope.
