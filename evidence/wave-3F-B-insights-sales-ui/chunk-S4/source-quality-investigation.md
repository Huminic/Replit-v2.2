# Wave 3F-B Chunk S4 — Source Quality Trends investigation (READ-ONLY)

**Date:** 2026-05-07
**Classification:** **Design** (mechanical bug exists, but the clean fix requires CX/copy judgment beyond the locked picks)
**S5 status:** **Deferred — escalate to operator**

## Component file:line locations

- Chart render: `client/src/pages/insights.tsx:951-972` (Card containing the `RechartsLineChart`)
- Tab trigger: `client/src/pages/insights.tsx:818` (`<TabsTrigger value="tab3" data-testid="tab-loss-quality">Source Quality Trends</TabsTrigger>`)
- Data binding: `client/src/pages/insights.tsx:957` (`<RechartsLineChart data={sourceQualityTrends}>`)
- Data derivation: `client/src/pages/insights.tsx:310-312`:
  ```ts
  const sourceQualityTrends = rptSourceQuality.map((s: any) => ({
    month: s.source, winRate: s.winRate, volume: s.leads,
  }));
  ```
- Source upstream: `rptSourceQuality = reportsData?.sourceQualityTrends || [];` (line 287). Server-side it comes from `/api/reports`'s `sourceQualityTrends` field.

## Defect description

The chart at `Insights → Reports → Loss & Quality → Source Quality Trends` declares 5 named series (Internet, Walk-In, Phone, Referral, Service) at lines 963-967, each binding to a `dataKey` that does not exist in the data:

```tsx
<Line type="monotone" dataKey="internet"  name="Internet"  stroke="#3B82F6" strokeWidth={2} />
<Line type="monotone" dataKey="walkIn"    name="Walk-In"   stroke="#10B981" strokeWidth={2} />
<Line type="monotone" dataKey="phone"     name="Phone"     stroke="#F59E0B" strokeWidth={2} />
<Line type="monotone" dataKey="referral"  name="Referral"  stroke="#8B5CF6" strokeWidth={2} />
<Line type="monotone" dataKey="service"   name="Service"   stroke="#EF4444" strokeWidth={2} />
```

But `sourceQualityTrends` rows have only three keys: `month`, `winRate`, `volume`. None of `internet|walkIn|phone|referral|service` are present. Recharts therefore plots 5 lines flat at the X-axis (no data points).

Concurrent secondary defect: the X-axis dataKey is `"month"`, but the field actually contains `s.source` (a source name string like `"Source #3750035"`, `"Repeat Customer"`, `"Dealers WebSite"`). So the X-axis is mislabeled — what should be months is actually source-name labels.

The card title + description also misrepresent the data: `"Source Quality Trends — Win rate by source over last 6 months"` promises a time-series, but the wire-shape from `/api/reports` is a per-source snapshot (one row per source, no time dimension).

## Reference 1C screenshot

`evidence/wave-1C-comprehensive-e2e/routes/sh-02-insights-source-trends.png`

Confirms visually:
- X-axis labels are source-name strings, not months: `Source #3750035`, `Source #3743779`, `Repeat Customer`, `Dealers WebSite`, `Local Customer`, `Source #3897825`, `Source #3897777`, `Source #36`, `Source #3819124`
- 5 colored series shown in legend (Internet, Walk-In, Phone, Referral, Service) but no plotted data — chart area is empty between the gridlines
- Card title "Source Quality Trends" and subtitle "Win rate by source over last 6 months" both visible, mismatching the rendered content

## Classification

**Design** — with a mechanical core.

The mechanical core is unambiguous: the `<Line>` `dataKey` references don't exist in the data. **A purely-mechanical fix exists**, but applying it requires deciding what the chart should actually show. The data the server ships is a per-source snapshot (each row = one lead source, with `winRate` and `volume`). The chart-template was clearly written assuming a different shape (months × channels). Three forks:

1. The TEMPLATE is correct → the SERVER needs to ship time-series data for 5 channels. (Server-side work — out of scope.)
2. The DATA is correct → the chart must be reshaped to a per-source visualization. This necessarily edits the title/subtitle ("Win rate by source over last 6 months" becomes wrong) — a CX/copy call.
3. Either fork involves CX judgment about what the dealership actually needs to see.

Per the wave-bookend stop condition ("ANY S4 finding that requires design judgment — STOP, escalate"), this falls outside S5 mechanical scope.

## Fix options

### Option A — Drop the broken series, render a single per-source bar/line (small mechanical fix)

Replace lines 963-967 with a single `<Line dataKey="winRate" name="Win Rate" .../>`. Update card title from "Win rate by source over last 6 months" to "Win rate by source" (drop the time-series claim) — this is the CX/copy decision that escalates.

**Pros:** Smallest diff. Renders the data the server actually ships. Honest.
**Cons:** Loses the multi-channel comparison the original template implied. The title edit is a CX call.
**Scope:** ~5 lines client-only. Title-edit needs operator approval.

### Option B — Reshape the data on the client side (mechanical, no copy edit)

If `rptSourceQuality` rows have a `monthlyTrend: { internet, walkIn, phone, referral, service }[]` substructure (would need to verify in API response), pivot client-side into time-series rows. **Verification required** — likely the server doesn't ship this and Option B becomes Option C.

**Pros:** Preserves the original visual intent.
**Cons:** Requires server-side data that probably doesn't exist; high uncertainty.
**Scope:** Client-only IF data is already shipped, otherwise crosses into server scope (out of bounds).

### Option C — Add server endpoint + reshape (out of scope)

Server work to compute monthly per-channel win-rate time series, plus client reshape.
**Out of scope per wave-bookend.**

### Option D — Hide the chart entirely until data is real (escalation default)

Set the entire `tab3` tab to render a placeholder "Time-series source data not yet available" until the right data ships. Honesty-preserving fallback.
**Pros:** No misleading empty chart. No CX/copy call.
**Cons:** Removes a tab the user can currently see. Still arguably a CX call.

## Recommended fix scope

**Defer S5 — escalate.** The defect is real and visible, but the cleanest mechanical fix (Option A) requires editing the card title from "Win rate by source over last 6 months" to "Win rate by source" — this is a CX/honesty call beyond the operator's locked picks for Wave 3F-B. Given the wave-bookend's explicit stop condition ("ANY S4 finding that requires design judgment — STOP, escalate"), the right next step is operator review of Options A vs D for a follow-up wave.

If the operator IS willing to authorize Option A (with the title edit) inline as part of S5, that fix is well-defined and small (~6 lines). But this builder's mandate forbids guess-fixing — escalation is the disciplined path.

## S5 status

**Deferred — escalated to operator.** Per wave-bookend stop condition, this builder did NOT apply a guess fix. No `chunk-S5/` evidence directory will be populated by this wave; orchestrator should either (a) authorize Option A inline + relaunch builder for S5, or (b) carry the fix forward as a follow-up wave with explicit CX/copy approval.
