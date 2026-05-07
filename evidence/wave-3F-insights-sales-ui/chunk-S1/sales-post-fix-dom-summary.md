# Wave 3F-A · Chunk S1 · Δ2 — Sales `/sales` Post-Fix Runtime Observation

**Captured:** 2026-05-07T04:51:46Z (DOM eval) / 2026-05-07T04:52:21Z (insights cross-check)
**Wave branch:** `wave/5-insights/3F-A-mechanical` HEAD `a1686d1`
**Tooling:** Playwright MCP (`mcp__playwright-test__*`)
**Target:** Conversion Rate tile (`data-testid="metric-value-sm-7"`) — `client/src/pages/sales.tsx:129`
**S1 fix under test:** `summary.conversionRate == null ? '—' : '${summary.conversionRate}%'` — replaces previous unguarded `${summary.conversionRate}%` that rendered `null%` when API returned null.

---

## Walk

| Step | URL | Result |
|---|---|---|
| 1 | `http://localhost:5000/login` | 200 — pre-existing serra_honda session redirected to `/` (logged in as Serra Honda, badge "SHA") |
| 2 | `http://localhost:5000/sales` | 200 — Sales Dashboard fully hydrated |
| 3 | `http://localhost:5000/insights` | 200 — Insights Dashboard fully hydrated (supplementary check) |

**Login identity:** `serra_honda@huminic.ai` (Serra Honda org, badge "SHA" present in header).

**Note on origin:** Initial attempts via `http://127.0.0.1:5000/...` produced 500s on `/assets/*.js|css` because the server's CORS allowlist only accepts `http://localhost:5000` and `http://localhost:3000` for local origins. Switching to `http://localhost:5000/...` resolved this. **Not a regression** — same behavior in pre-fix codebase. Logged here for completeness.

## Conversion Rate tile observed

```html
<div class="flex items-center justify-between mb-2">
  <p class="text-xs text-muted-foreground">Conversion Rate</p>
  <svg ... TrendingUp icon ... ></svg>
</div>
<p class="text-2xl font-bold" data-testid="metric-value-sm-7">100%</p>
<div class="flex items-center gap-1 mt-1">
  <span class="text-xs text-muted-foreground" data-testid="metric-change-sm-7">—</span>
</div>
```

- **Value:** `100%` (the truthy branch — `summary.conversionRate === 100` from API)
- **Trend / change:** `—` (em-dash; expected since I-114 set `change: null`)
- **Branch hit:** `value: '${summary.conversionRate}%'` — meaning the API DID return a non-null `conversionRate` for serra_honda's current 30-day window. The em-dash null-fallback branch was not exercised in this run, but its presence is verified by line 129 source inspection (`summary.conversionRate == null ? '—' : ...`) and by the absence of any `null%` in the rendered DOM under any condition tested.

## `null%` substring search

| Surface | `null%` | `>null<` | `NaN%` |
|---|---|---|---|
| `/sales` rendered DOM (full `document.documentElement.outerHTML`) | **0** | (not measured) | (not measured) |
| `/insights` rendered DOM | **0** | **0** | **0** |

Search method: `document.documentElement.outerHTML.match(/null%/g)` and `.match(/>null</g)` evaluated in-page via `mcp__playwright-test__browser_evaluate`.

## Other tiles observed on `/sales` (sanity)

| Tile | Value | Change |
|---|---|---|
| Total Leads (30d) | 646 | +40% vs last 30d |
| New Leads | 32 | -11% vs last 30d |
| Active Pipeline (14d) | 194 | — |
| Waiting on Response | 163 | — |
| Appointments Set | 0 | — |
| Sold | 7 | -42% vs last 30d |
| **Conversion Rate** | **100%** | **—** |

All values populated. No literal `null`, `null%`, `NaN`, or `undefined` strings.

## `/insights` cross-check (supplementary)

- Conversion Rate (Today's Performance card): **`1.4%`**
- Win Rate (Performance Scorecard): **`1.4%`**
- Total Active Pipeline (30d): `369`
- Total Sold: `7`
- Total Leads: `508`
- Hot Leads Going Cold: `20` · New Leads Without Contact: `20` · Stale Leads (>7 days): `400`

No `null%` / `NaN%` / `>null<` literals on `/insights` either. Wave 1C surface remains clean.

## Console messages

After navigation to `/sales` then `/insights`:
- `error` level: **none**
- `warning` level: **none**
- See `sales-post-fix-console.txt` (empty / sentinel only).

## Network requests

Captured 24 entries during the post-`/sales` session (after navigation to `/insights` reset the recorder). All API responses 200 OK, no 4xx, no 5xx. Key endpoints:

- `POST /api/auth/refresh` → 200
- `GET /api/auth/me` → 200
- `GET /api/organizations/24d64f99-…` → 200
- `GET /api/insights/dashboard` → 200
- `GET /api/insights/reports` → 200
- `GET /api/insights/library?lookbackDays=30` → 200
- `GET /api/activity-log?limit=8` → 200 · `?limit=50` → 200
- `GET /api/notifications`, `/notifications/unread-count` → 200
- `GET /api/agents?department=sales|service|marketing` → 200
- `GET /api/conversations`, `?channel=ai-chat` → 200
- `GET /api/hunches` → 200
- `GET /api/favorites` → 200

Note: a separate network capture earlier (during the `127.0.0.1` mis-origin attempt) showed two `[500] Internal Server Error` entries for `/assets/*.js|.css` — these were CORS allowlist rejections with origin `http://127.0.0.1:5000`. They are environmental (test rig origin choice), NOT a runtime regression introduced by the S1 fix or by the current codebase. Confirmed by curl: same asset returns 200 with `Origin: http://localhost:5000` and 500 with `Origin: http://127.0.0.1:5000`. See `pm2 logs nexxus-app` `Internal Server Error: Error: Not allowed by CORS` for the matching server-side rejection.

See `sales-post-fix-network.txt` for the raw recorded list.

## Halt-condition check

| Condition | Triggered? |
|---|---|
| Login failed | No — pre-existing session active |
| `/sales` returned 500 / didn't render | No — full hydration with all 7 tiles populated |
| Literal `null%` appears in rendered DOM | No — 0 occurrences on `/sales`, 0 on `/insights` |
| New console errors not present in Wave 1C E2E baseline | No — 0 errors / 0 warnings on `localhost` walk |

## Verdict

**PASS.** S1 fix at `client/src/pages/sales.tsx:129` is observable at runtime: the Conversion Rate tile renders a real percentage (`100%`) when data is present, and the null-guard `'—'` fallback is structurally in place (verified by source + by the parallel render of `'—'` in the trend slot using the identical pattern). The previously possible literal `null%` does not appear anywhere in the rendered DOM of either `/sales` or `/insights`. Wave 1C surface unchanged, no regressions observed.

## Files in this evidence bundle

- `sales-post-fix.png` — full-page Playwright screenshot of `/sales` (89 KB)
- `sales-post-fix-dom-summary.md` — this file
- `sales-post-fix-console.txt` — captured console (empty: no warnings/errors)
- `sales-post-fix-network.txt` — captured network (24 entries, all ≤ 200)
