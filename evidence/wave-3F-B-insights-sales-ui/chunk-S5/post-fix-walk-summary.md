# Wave 3F-B Δ2 Playwright Walk Summary (post-fix)

**Captured:** 2026-05-07T15:35:24Z → 2026-05-07T15:40:26Z (UTC)
**Branch HEAD:** `be3502f` on `wave/5-insights/3F-B-design-gate`
**Build:** `dist/index.cjs` (vite 22.82s + esbuild 438ms), pm2 `nexxus-app` PID 2950179, port 5000, HTTP 200.
**Login identity:** `serra_honda@huminic.ai` / `NexxusTest2026` (org_admin, Serra Honda).
**Evaluator:** qa-evaluator (Wave 3F-B Δ2)

## URLs walked

| # | URL | HTTP | Render |
|---|---|---|---|
| 1 | `http://localhost:5000/login` | 200 | login form rendered, submitted |
| 2 | `http://localhost:5000/` | 200 | dashboard loaded post-login (Serra Honda banner visible) |
| 3 | `http://localhost:5000/sales` | 200 | Sales Dashboard rendered, all 7 metric tiles |
| 4 | `http://localhost:5000/insights` | 200 | Insights → Dashboard tab rendered |
| 5 | `http://localhost:5000/insights` → Reports tab → Loss & Quality → Source Quality Trends sub-tab | 200 | chart card rendered |
| 6 | `http://localhost:5000/work-center` | 200 | MyWorkPage rendered (heading "My Work") |
| 7 | `http://localhost:5000/work-center?tab=calendar` | 200 | MyWorkPage rendered (query-param ignored gracefully, no 404) |

## Per-chunk verification results

### S1 — em-dash threshold (n<20)

#### S1.a — `/sales` Conversion Rate tile (`metric-value-sm-7`)

| Check | Expected | Observed |
|---|---|---|
| testid present | true | **true** |
| value | em-dash `—` (n=0 sold ÷ 192 active = 0% under threshold) OR real % when n≥20 | **`—`** (em-dash) |
| literal `null%` count anywhere in DOM (text + HTML) | 0 | **0** (text=0, html=0) |

Result: **PASS** — Conversion Rate displays em-dash, not `null%`.

#### S1.b — `/insights` Performance Scorecard Win Rate tile (`scorecard-sc-1`)

| Check | Expected | Observed |
|---|---|---|
| testid `scorecard-sc-1` present | true | **true** |
| value | em-dash OR real % (n=508 leads ≥ 20, so real %) | **`1.4%`** (real %) |
| literal `null%` count anywhere in DOM | 0 | **0** |

Result: **PASS** — Win Rate displays `1.4%`, not `null%`. (Note: orchestrator referenced `metric-value-sc-1`; the actual emitted testid is `scorecard-sc-1`. Same Win Rate scorecard card. Confirmed via codebase grep at `client/src/pages/insights.tsx:707`.)

### S2 — `/work-center` route mapping

| Check | Expected | Observed |
|---|---|---|
| `/work-center` HTTP | 200 | **200** |
| `/work-center?tab=calendar` HTTP | 200 | **200** |
| Page heading | "My Work" (MyWorkPage) | **"My Work"** (level=1) |
| Tabs rendered | Dashboard / Tasks / Chat / Assistant | **all four present** |
| Tile content | Tasks Due Today / Overdue Items / Active Tasks / Completed | **all four present (0/5/728/1)** |

Result: **PASS** — mobile-nav 404 closed; MyWorkPage renders for both URL forms.

### S3 — "Top Performing AI Agents" heading rename

| Check | Expected | Observed |
|---|---|---|
| heading text on `/sales` | "Top Performing AI Agents" | **"Top Performing AI Agents"** present |
| occurrences of "Top Performing Agents" WITHOUT "AI" prefix | 0 | **0** |
| occurrences of "Top Performing AI Agents" | ≥1 | **1** |

Result: **PASS** — rename complete; old phrasing absent.

### S4 — Source Quality Trends investigation

Read-only chunk; no runtime artifact. Verified inline as input to S5 fix.

### S5 — Source Quality Trends chart fix

| Check | Expected (post-fix) | Observed |
|---|---|---|
| Card title | "Source Quality Trends" | **"Source Quality Trends"** |
| Card subtitle | "Win rate by lead source (lifetime)" | **"Win rate by lead source (lifetime)"** |
| Old subtitle ("Win rate by source over last 6 months") | absent | **absent** (`has_old_6mo_subtitle: false`) |
| X-axis labels | source names | **`Source #3750035`, `Source #3743779`, `Repeat Customer`, `Dealers WebSite`, `Local Customer`, `Source #3897825`, `Source #3897777`, `Source #36`, `Source #3819124`** (9 sources, NOT month names) |
| Y-axis ticks | win-rate scale | **0, 4, 8, 12, 16** |
| Number of plotted Lines | 1 (single `winRate` series) | **1** (legend entry: "Win Rate", single blue stroke) |
| Chart shape | non-flat, varying values across sources | **non-flat curve with peaks (Repeat Customer ≈ 10, Source #36 ≈ 16) and dips (Source #3750035 ≈ 0, Source #3897825 ≈ 0)** |

Result: **PASS** — chart now plots one Line with non-zero values across real lead-source categories; the 5-flat-lines bug is fixed.

## Console & network diagnostics

- **Console errors (post-login):** 0
- **Console warnings:** 0
- **Console info:** 0
- **Network 4xx/5xx (captured 19 requests across the walk):** 0
- **Pre-login `auth/refresh` 401:** 1 (expected — unauthenticated client; matches Wave 1C E2E baseline)

## Halt-condition status

| Condition | Result |
|---|---|
| Login fails | NOT TRIGGERED (login succeeded) |
| Any walked page returns 500 | NOT TRIGGERED (all 200) |
| Literal `null%` appears in DOM | NOT TRIGGERED (0 occurrences) |
| "Top Performing Agents" without "AI" prefix | NOT TRIGGERED (0 occurrences) |
| Source Quality Trends still 5 flat lines / wrong X-axis | NOT TRIGGERED (1 line, source-name X-axis) |
| New console errors absent from baseline | NOT TRIGGERED (0 console errors) |

## Evidence files

| Path | Type | Size |
|---|---|---|
| `evidence/wave-3F-B-insights-sales-ui/chunk-S1/sales-post-fix.png` | full-page screenshot | 90,461 B |
| `evidence/wave-3F-B-insights-sales-ui/chunk-S1/insights-post-fix.png` | full-page screenshot | 80,654 B |
| `evidence/wave-3F-B-insights-sales-ui/chunk-S2/work-center-post-fix.png` | full-page screenshot | 65,707 B |
| `evidence/wave-3F-B-insights-sales-ui/chunk-S5/source-quality-post-fix.png` | full-page screenshot (Source Quality Trends sub-tab) | 76,832 B |
| `evidence/wave-3F-B-insights-sales-ui/chunk-S1/post-fix-console.txt` | console summary (errors/warnings/info) | text |
| `evidence/wave-3F-B-insights-sales-ui/chunk-S1/post-fix-network.txt` | network log (19 requests, all 200) | text |

## Verdict

**PASS.** All five chunks (S1–S5) verified at runtime against the deployed pm2 build. Zero `null%`, zero "Top Performing Agents" without "AI", Source Quality Trends chart now correctly plots one Line over real lead-source categories with non-zero values. /work-center route renders MyWorkPage for both bare and `?tab=calendar` query forms. No new console errors vs Wave 1C baseline.
