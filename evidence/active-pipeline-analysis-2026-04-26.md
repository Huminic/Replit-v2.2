# Active Pipeline Metric Reconciliation — Source Archaeology

**Date:** 2026-04-26
**Scope:** all 4+1 sites that render a metric labeled "Active Pipeline" or equivalent.
**Mode:** read-only source-grep + DB-schema review. No code changes.
**Companion:** `evidence/preflight-ui-truth-2026-04-26.md` §1.4 + §1.6a + §2.2.

---

## Per-site trace

### Site 1 — Sales Dashboard "Active Pipeline" (sales.tsx:114)

| Field | Value |
|---|---|
| UI binding | `dashboardMetrics.pipeline.activePipeline` |
| Endpoint | `GET /api/metrics/dashboard` |
| Storage call | `storage.getDashboardMetrics(orgId)` → calls `getPipelineMetrics(orgId)` |
| Query | `server/storage.ts:802-846` — direct Drizzle `count()` over `warehouse_leads` |
| **Window** | **last 14 days** (`COALESCE(vinCreatedAt, syncedAt) >= now - 14d`) |
| **Status filter** | `vinStatus IS NOT NULL` AND NOT `LOST%`/`lost`/`SOLD%`/`sold`/`closed-won`/`BAD%`/`%DUPLICATE%`/`SERVICE%`/`NON_CUSTOMER_INITIATED_LEAD` |
| **Effective semantic** | "leads created in last 14 days that are not in a terminal/excluded state." **Includes** `new`, `active`, and `unknown` status families. |
| Org filter | yes |
| Audit value | 197 (now 195 after sync delta) |
| I-266 fix comment | "Use only 14-day pipeline metric (matches Main page)." Sales intentionally aligned to home dashboard tile. |

### Site 2 — Insights "Today's Performance > Pipeline Active" (insights.tsx:615 via `greenZoneMetrics`)

| Field | Value |
|---|---|
| UI binding | `dashboardData.greenZone[0].value` |
| Endpoint | `GET /api/insights/dashboard` |
| Server location | `server/routes/insights.ts:301` — `{ label: "Pipeline Active", value: hotCount, ... }` |
| Underlying compute | `hotCount = allLeads.filter(l => isActiveLead(l.vinStatus)).length` |
| **Window** | **last 30 days** (`getWarehouseLeads(orgId, { createdAfter: thirtyDaysAgo })`) |
| **Status filter** | `isActiveLead()` only — `classifyVinStatus(s) === 'active'` (status family `active` from `server/statusClassifier.ts`). **Excludes** `new`, `unknown`, all terminals. |
| **Effective semantic** | "leads created in last 30 days that are STRICTLY active (post-contact, pre-close)." |
| Org filter | yes |
| Audit value | 306 |

### Site 3 — Insights Pipeline Health "Active Pipeline" (insights.tsx:644)

| Field | Value |
|---|---|
| UI binding | `pipelineHealthData.monthEndForecast.activePipeline` |
| Client construction | `client/src/pages/insights.tsx:243` — `activePipeline: totalLeads` |
| Server source | `dashboardData.overview.totalLeads` from `/api/insights/dashboard` |
| Underlying compute | `totalLeads = allLeads.length` (server line 172, NO status filter) |
| **Window** | **last 30 days** |
| **Status filter** | NONE (every lead in the 30-day window) |
| **Effective semantic** | "all leads received in last 30 days" — i.e., the same as a "Total Leads (30d)" tile. |
| Audit value | 609 |
| **Verdict** | **BUG.** The label says "Active Pipeline" + subtitle "leads in play" but the value is the unfiltered 30-day total. Mismatch between label and computation. |

### Site 4 — Insights Library "Total Active Pipeline" (lib-1, server insights.ts:1099)

| Field | Value |
|---|---|
| UI binding | `libraryMetrics[0]` rendered by the Library tab |
| Endpoint | `GET /api/insights/library` |
| Server location | `server/routes/insights.ts:1099` — `value: String(activeLeads.length)` |
| Underlying compute | `activeLeads = allLeads.filter(l => isActiveLead(l.vinStatus))` (server line 801) |
| **Window** | **last 30 days** (default `lookbackDays`) |
| **Status filter** | `isActiveLead()` only (same as Site 2) |
| **Effective semantic** | identical to Site 2 — "leads created in last 30 days that are STRICTLY active." |
| Audit value | 306 |

### Site 5 (bonus, not in original audit list) — Insights rollingForecast (insights.tsx:1250)

| Field | Value |
|---|---|
| UI binding | `rollingForecast.gapAnalysis.activePipeline` |
| Client construction | `client/src/pages/insights.tsx:345` — `activePipeline: totalLeads` |
| **Verdict** | **Same bug as Site 3.** Bound to unfiltered `totalLeads`. |

### Site 6 — Insights Pipeline Health "Active Pipeline" detail (insights.tsx:2027)

| Field | Value |
|---|---|
| UI binding | `pipelineHealthData.monthEndForecast.activePipeline` (drill-down detail panel) |
| Client construction | reuses the same `pipelineHealthData` object as Site 3. |
| **Verdict** | **Same bug as Site 3** (same binding source). |

---

## Reconciliation matrix

| Site | Binding | Window | Status filter | Value (audit) | Issue |
|---|---|---|---|---|---|
| 1 Sales | `getPipelineMetrics` raw SQL | 14d | NOT-terminal/excluded (incl. new + unknown) | 197 | by design — matches home dashboard |
| 2 Insights Today | `hotCount` | 30d | `isActiveLead` only | 306 | by design |
| 3 Insights Pipeline Health | `totalLeads` (mislabeled) | 30d | none | 609 | **BUG** |
| 4 Insights Library lib-1 | `activeLeads.length` | 30d | `isActiveLead` only | 306 | by design — matches Site 2 |
| 5 Insights rollingForecast | `totalLeads` (mislabeled) | 30d | none | 609 | **BUG** (same source as Site 3) |
| 6 Insights Pipeline Health detail | `totalLeads` (mislabeled) | 30d | none | 609 | **BUG** (same source as Site 3) |

---

## Outcome

**Outcome 3 (mixed):** there is a real bug AND a real definitional drift.

### The bug (Sites 3, 5, 6)

Three sites in `client/src/pages/insights.tsx` label a value "Active Pipeline" but bind it to `totalLeads` (server's unfiltered 30-day total). This is the audit's "609" reading. It's a client-side label-vs-value mismatch — a copy-paste or a refactor that lost the filter.

The simplest correction: change the client construction at insights.tsx:243 + 345 from `activePipeline: totalLeads` to `activePipeline: hotCount` so the labeled value matches the strict-active count. After that fix:

- Site 3 displays 306 (matches Site 2 and Site 4 — Insights internal consistency).
- Site 5 displays 306 (matches the rest of Insights).
- Site 6 displays 306 (matches the rest of Insights).

### The definitional drift (Sites 1, 2, 4)

Sales (Site 1) and Insights/Library (Sites 2, 4) intentionally compute DIFFERENT semantics:

- **Sales / Home Dashboard (14d)** = "leads from the last 14 days that are still in play" — operational, action-oriented, narrower window. Includes `new` and `unknown` status because both warrant immediate attention. I-266 explicitly chose this 14-day metric to align Sales with the home tile.
- **Insights (30d)** = "leads in the last 30 days that are STRICTLY active (`isActiveLead`)" — analytical, status-family-strict, broader window, excludes `new` and `unknown`.

These are LEGITIMATELY DIFFERENT metrics, not duplicates. Both deserve to exist. The problem is they share the same label.

The honest UX fix: rename the labels to disambiguate window AND status semantics.

---

## Proposed fix path

**Two-part fix, single commit:**

### Part A — fix the genuine bug

`client/src/pages/insights.tsx`:
- Line 243: `activePipeline: totalLeads` → `activePipeline: hotCount`
- Line 345: `activePipeline: totalLeads` → `activePipeline: hotCount`

`hotCount` is already in scope (line 217). After this change, Sites 3 / 5 / 6 all display `hotCount` (the strict-active 30-day count, currently 306) — matching Sites 2 and 4.

### Part B — disambiguate labels

Rename labels to make window + status explicit:

**Sales (sales.tsx:114, sales.tsx:102)** — `'Active Pipeline'` → `'Active Pipeline (14d)'`

**Insights Pipeline Health card title (insights.tsx:643)** — `'Active Pipeline'` → `'Active Pipeline (30d)'`

**Insights Pipeline Health detail panel (insights.tsx:2027)** — same rename

**Insights rollingForecast gap line (insights.tsx:1250)** — `'Pipeline:'` already short, but the value is followed by ` active` text — rephrase as `'Active leads (30d):'` or similar.

**Insights Library lib-1 title (server insights.ts:1099)** — `'Total Active Pipeline'` → keep as-is (Library titles are categorical labels, not dashboard tiles). The library tile already includes "Pipeline" badge visible to user. No change.

**Insights Today's Performance "Pipeline Active" (server insights.ts:301)** — keep as-is (consistent with Library lib-1's strict-active definition; "Pipeline Active" without window suffix is acceptable in a "Today's Performance" section that implies recency).

### Why not "pick one canonical query and point all sites at it"

That would force Sales to either:
- show a 30-day strict-active count (loses operational value — old leads that haven't moved in 14 days are NOT actionable)
- show a 14-day strict-active count (changes Sales's value materially without operator agreement)

Or force Insights to show a 14-day pipeline-NOT-terminal count (loses analytical value — `new` leads aren't meaningful in a 30-day "pipeline depth" view).

The two metrics serve different purposes; collapsing them would harm one of the two consumer use cases. Disambiguating labels is more honest and lower-risk.

### Test plan

- `client/src/pages/insights.tsx`: 2 line edits (Part A) + 2-3 label rewrites (Part B). UI scope marker required for each edit (4-5 markers total).
- `client/src/pages/sales.tsx`: 2 label edits (Part B). UI scope marker required for each edit (2 markers).
- `npx tsc --noEmit` + `npx vitest run tests/unit/` clean.
- No new unit tests — UI-only change with no extracted helper. Live verification post-deploy is the right test.

### Risk assessment

- Part A bug fix changes Insights "Active Pipeline" reading from 609 to 306 in 3 places. This is the correct value per the existing label. Visible to operator + dealership leaders.
- Part B label rename is text-only. No data change.
- **No server-side change.** All edits are client-side label/binding.
- No external system effects. Read-only metric rendering.

### What this fix does NOT do

- Does NOT change Sales's 14-day pipeline definition (per I-266 alignment with home dashboard).
- Does NOT change `lib-1` Library metric semantics.
- Does NOT collapse the two metric families into one.
- Does NOT change `getPipelineMetrics` or `/api/insights/dashboard` server logic.

---

## Recommendation

Proceed with the proposed two-part fix as a single commit. Update fix-list `Priority 6` status to "fix path: bug-correct + label-disambiguate." Bug correction is the load-bearing change; label disambiguation is the user-facing clarity change. They ship together because shipping one without the other would still leave a confusing inconsistency.

**Awaiting parent greenlight before code changes.**
