# Wave 1C — rendered weekly report numbers eye-check

**Captured:** 2026-05-06
**Branch:** `wave/5-insights/1C-metric-honesty` (HEAD `e22b493`)
**Org:** Serra Honda (`24d64f99-ba04-4b43-af35-fd06f555ac86`)
**Recipient:** `duane.wells@huminic.ai` (internal_operator allowlist, hard-routed via TESTLANE override)
**Resend messageId:** `f443654b-bf71-494e-b09b-0714c12627e5`
**Source HTML:** `evidence/wave-1C-metric-honesty/wave-proof/post-1c-body.html` (40,018 bytes)

---

## What the weekly report email surfaces (per rendered HTML)

The weekly executive report does NOT directly surface the Wave 1C target KPIs (lifetime win rate, dashboard conversion rate, lead-source trend). Those KPIs live on `/insights` and `/sales` (browser-rendered surfaces, parked for Δ2). The weekly email surfaces:

| Block | Field | Value (Serra Honda, week ending May 6, 2026) |
|---|---|---|
| Sales Team Score | (down arrow) | 98 / 100 |
| Sales Leads This Week | count (down arrow) | 100 |
| Ghosted Leads | count (up arrow) | 4 |
| Over 48 Hours | count (flat arrow) | 0 |
| 30-Day Active Leads | count | 389 |
| Lead Issues — Stalled | count (up arrow) | 1 |
| Lead Issues — Inbound Calls | count (down arrow) | 1 |
| AI Notifications Sent | (down arrow) | 58 |
| ADF Deliveries | (down arrow) | 0 |
| Automation Triggers | (down arrow) | 1 |

## Wave 1C honesty checks (against rendered email body)

| Check | Expected | Observed | Verdict |
|---|---|---|---|
| Lifetime win rate text appears | NOT on this surface (it's on `/insights`) | Not present | N/A — wrong surface |
| Dashboard win-rate KPI = 100% | NOT on this surface | Not present | N/A — wrong surface |
| Hard-coded `trend: "flat"` literal in lead-source rows | absent | absent | PASS |
| Activity-feed `sync_delta_*` / `sync_` rows | absent | absent | PASS |
| `NaN` / `null%` / `undefined` rendered | absent | absent | PASS |
| Lead-source rows show varied trend indicators | yes (winners + losers, explicit deltas) | yes — 4 winners with up arrows + 5 losers with down arrows + explicit deltas (e.g. ↑4, ↓12) | PASS |
| Service rows excluded from sales count (Wave 1B+S4 effect) | yes — count drops vs raw warehouse | "Sales Leads This Week" labeled correctly; count = 100 (sales-only) | PASS |

## "100%" hits investigation

The send-runtime-log eye-check flagged `contains-100%=true`. After unpacking the HTML (`grep -oE '.{0,100}100%.{0,60}'`):

- 16 occurrences of `100%`
- All are CSS literals: `width:100%`, `max-width:100%`, gradient stops `9333ea 100%`
- ZERO occurrences are user-visible KPI numbers
- The eye-check assertion was overly broad (matched CSS as well as visible text)

**Conclusion:** No dishonest 100% rendering. The HTML eye-check assertion needs refinement (should target visible-text-stripped HTML, not raw markup) but the underlying observation is clean.

## Wave-1C-targeted surfaces NOT visible in this email

The following Wave 1C corrections cannot be verified from the weekly report HTML alone — they require Δ2 browser walks of `/insights` and `/sales`:

- S5 (lib-8 lifetime win rate swap, `server/routes/insights.ts:447,1047`) → renders on `/insights` lib-8 KPI tile
- S3/S6 conversionRate null-on-empty (`server/vendorProxy.ts:641-642`) → renders on `/sales` rep leaderboard column
- S4 UPSTREAM sales-only predicate at every `getWarehouseLeads` fetch site → renders on `/sales` totals + `/insights` tiles

The weekly report DOES exercise the underlying `getWarehouseLeads` path indirectly (the "Sales Leads This Week" count of 100 is sales-only after Wave 1B + Wave 1C S4 fixes). That count being a believable single-store week and matching Wave 1B's "excludes service rows by default" unit test (47-min unit suite earlier) is supporting evidence.

## Halt-condition pass

| Halt condition | Status |
|---|---|
| Any preflight env check FAIL | PASS — all 5 PASS |
| `sent: false` in response | PASS — `sent: true` |
| Non-200 from Resend | PASS — messageId returned |
| Subject line missing `[testlane:...]` prefix | PASS — `[testlane:wave-1c-runtime-proof]` present |
| Recipient not hard-routed to operator allowlist | PASS — `duane.wells@huminic.ai` only |
| Rendered numbers obviously broken (100% win rate / NaN / `flat` strings) | PASS — none present in visible text |

## Verdict

PASS for the surfaces this email exposes. Wave 1C S1 (no `flat`), S2 (no `sync_*`), and the integration plumbing for S4 (sales-only count) all look correct in this rendered output. S3, S5, S6 are not visible in the weekly email and require Δ2 browser walks on `/insights` and `/sales` to confirm runtime effect.
