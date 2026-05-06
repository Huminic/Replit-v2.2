# Wave 1C — Δ2 Playwright walk summary

**Captured:** 2026-05-06T23:47Z – 23:51Z (UTC)
**Walker:** qa-evaluator subagent (mcp__plugin_playwright_playwright)
**Browser:** Chromium (Playwright-managed), viewport 1440x900
**Login:** `serra_honda@huminic.ai` / org `Serra Honda` (`24d64f99-…`)
**Dev URL:** `http://localhost:5000`
**Code under test:** `wave/5-insights/1C-metric-honesty` HEAD `e22b493`, dist/index.cjs rebuilt + pm2 restart at 23:44Z (operator-approved)

---

## Halt-condition pass

| Halt condition | Status |
|---|---|
| Login fails for serra_honda | PASS — login redirected to `/` after click, header shows "Serra Honda" |
| `/insights` returns 500 | PASS — 200, page renders fully |
| `/sales` returns 500 | PASS — 200, page renders fully |
| Win-rate KPI tile renders 100% | PASS — Win Rate = `1.2%` on `/insights` Performance Scorecard |
| `pm2 logs nexxus-app` uncaught exceptions during walk | PASS — only pre-existing webhook-secret warnings + one stale ENOENT before walk; no exceptions in my session window |
| Page timeout / blank screen / infinite loading | PASS — every navigation completed in <3s |

---

## /insights observations

| Verification | Observed | Verdict |
|---|---|---|
| Win-rate KPI value | `1.2%` (Performance Scorecard tile) | PASS — NOT 100%, NOT 30% — looks like lifetime sample (Sold=6 / Total Leads=494 → ~1.21%) |
| Conversion-rate dashboard tile | `1.2%` (Today's Performance) | PASS — matches lifetime computation |
| Lib-8 lifetime win-rate distinct from 30d | Win Rate and Conversion Rate both `1.2%`; Total Leads = 494 (not 30d window) | PASS — math matches lifetime denominator |
| Lead-source list trends — all `flat` artifact | "Source Quality Trends" sub-tab loads; zero `flat` literals on page; chart varies by source | PASS — S1 hard-coded `flat` removed |
| `null%` / `NaN%` / `undefined` rendered | Zero occurrences across `/insights` (Dashboard + Reports + Activity tabs) | PASS |
| Activity tab — `sync_*` rows | Zero `sync_*` matches in 50+ activity rows; only user-attributable events (Weekly Report Sent, Trigger Checkin Sent, Vapi Call Received, Sms Inbound Received, Campaign *, Login Failed, Role Changed, Agent *, Tavus Video Completed, Escalation Email Sent, User Created) | PASS — S2 entityType filter effective |
| Console errors during page load | Zero baseline; one 400 on `/api/auth/refresh` pre-login (expected); my probe-induced 401/404 don't count | PASS |

**Screenshots:**
- `01-insights-dashboard-2026-05-06T234800Z.png` — full /insights Dashboard (KPIs visible)
- `02-insights-lib-8-winrate-2026-05-06T234800Z.png` — Performance Scorecard zoom (Win Rate 1.2%)
- `03-insights-lead-source-2026-05-06T234820Z.png` — Reports > (Loss & Quality) — Loss Patterns by Source table + Source Quality Trends chart
- `07-insights-activity-feed-2026-05-06T235100Z.png` — Activity tab full page

---

## /sales observations

| Verification | Observed | Verdict |
|---|---|---|
| Total leads (30d) | `627` | OBSERVED — not directly Wave 1C target |
| Sold (30d) | `6`; lostLeads (API) = `0` | OBSERVED — sales-only path |
| Conversion Rate KPI card | renders `100%` | EXPLAINED — see analysis below |
| `null%` literal rendered (sales.tsx:129) | Zero occurrences | PASS — known v2.3 follow-up did NOT manifest with this dataset (because conversionRate is 100, not null) |
| `NaN%` / `undefined` | Zero occurrences | PASS |
| Activity panel `sync_*` rows | Zero (also confirms S2 on this surface) | PASS |

### "Conversion Rate = 100%" analysis (NOT a wave failure)

Network capture of `/api/vin/leads/summary` response:
```json
{"soldLeads":6,"lostLeads":0,"conversionRate":100,…}
```
Saved to `sales-summary-network-2026-05-06T235000Z.json`.

Wave 1C S3 fix (`server/vendorProxy.ts:644`):
```ts
conversionRate: (cur.sold + cur.lost) > 0
  ? Math.round((cur.sold / (cur.sold + cur.lost)) * 1000) / 10
  : null,
```

For Serra Honda 30d: `sold=6, lost=0, sold+lost=6 > 0` → `6/6 * 100 = 100`. **The 100% is the deliberate, mathematically correct output of the new logic** — not the dishonest pre-1C value. The null-on-empty fallback only triggers when `sold+lost==0`, which is not Serra Honda's situation in the 30d window.

The wave intent is satisfied: the renderer now consumes a server-computed sold/(sold+lost) ratio. The fact that the dataset happens to produce 100% is a property of the data (no losses recorded in the 30d window), not a regression. To exercise the null-on-empty branch in browser would require a tenant with literally zero closed deals (sold AND lost both 0); not available without additional setup.

**Screenshots:**
- `04-sales-leaderboard-2026-05-06T235000Z.png` — full /sales Dashboard (no rep leaderboard exists; "Top Performing Agents" panel shows AI agents, not human reps)
- `05-sales-kpi-grid-2026-05-06T235000Z.png` — KPI grid zoom (Conversion Rate card)
- `06-sales-totals-2026-05-06T234840Z.png` — full /sales page totals
- `sales-summary-network-2026-05-06T235000Z.json` — captured API response

---

## Δ2 coverage summary

| Wave 1C scope | Surface | Δ2 verdict | Evidence |
|---|---|---|---|
| S1 — drop hard-coded `trend: "flat"` | `/insights` Reports tab + Activity tab | PROVEN | 0 `flat` literals across page text; varied per-source rows in Loss Patterns table; screenshot 03 |
| S2 — `entityType` filter excludes `sync_*` | `/insights` Activity tab + `/sales` Recent Activity | PROVEN | 50+ activity rows scanned, all user-attributable, zero `sync_*`; screenshots 06, 07 |
| S3 — `conversionRate` null-on-empty fallback | `/sales` Conversion Rate card | PROVEN-BY-LOGIC | Wire shape `{sold:6, lost:0, conversionRate:100}` confirms denominator is `sold+lost` (the new formula); null branch is gated by data and cannot be triggered with current Serra Honda dataset; captured JSON evidence |
| S4 — sales-only predicate UPSTREAM | `/sales` totals + `/insights` tiles | INDIRECTLY PROVEN | Total Leads = 494 lifetime / 627 (30d), Sold = 6 — consistent with Wave 1B "Sales Leads This Week = 100" Δ1 sales-only count for serra_honda |
| S5 — lib-8 lifetime win rate swap | `/insights` Performance Scorecard "Win Rate" tile | PROVEN | Renders `1.2%`, NOT 100%; matches lifetime sample (6/494 ≈ 1.21%); screenshots 01, 02 |
| S6 — corollary of S3 | same as S3 | covered by S3 | n/a |

---

## Anything surprising

- **No human-rep leaderboard on /sales.** The "Top Performing Agents" panel lists AI agents (Data Guru, Sales Coach, Communication Writer, Caroline). The S3 conversion-rate "column" the spec referenced is a single page-level KPI card, not a per-rep table column. The S3 fix's behavior is still validated via the API wire shape + the page card, but anyone expecting a multi-row leaderboard with one conversion-rate cell per rep should know this surface doesn't exist in dev today.
- The dishonest `null%` literal at `client/src/pages/sales.tsx:129` did NOT manifest because conversionRate happened to be 100 (not null) for this dataset. The Wave 3F follow-up to handle null at the consumer is still appropriate but cannot be exercised until a tenant produces sold=0 AND lost=0 in window.

---

## Recommendation

**Wave 1C ready for merge to batch-1-finish-line: YES.**

Rationale:
- All five Wave 1C scope items have positive evidence at the rendered-browser surface (S1, S2, S5 directly; S3/S6 by API wire shape + correct math; S4 indirectly via totals consistent with Wave 1B Δ1).
- Zero new exceptions in pm2 logs during the walk window.
- Zero rendered `null%` / `NaN%` / `undefined` strings on any tested surface.
- Zero `flat` literals or `sync_*` rows in user-visible content.
- One observation needs operator note (the 100% value is data-driven, not a regression — explained above).

Two deltas of proof now in hand for Wave 1C:
- Δ1 (commit `d732901`) — Resend dry-run, weekly email body PASS, S1+S2 covered.
- Δ2 (this walk) — browser-observed surfaces PASS, S1+S2+S3+S4+S5+S6 all covered with explanation for the data-driven 100%.
