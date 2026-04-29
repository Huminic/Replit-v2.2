# I-279 — VIN Lead Source ID Resolution: Archaeology

**Date:** 2026-04-26
**Scope:** Trace the data flow for `lead_source` from VIN sync to insights/reports rendering. Quantify the resolver coverage gap. Propose fix paths with trade-offs.
**Mode:** read-only source-grep + read-only DB probe + read-only MCP `tools/list` and tool-call probes. No mutations.
**Companion artifacts:** `evidence/vin-source-resolution-2026-04-26/` (3 probe scripts + their outputs).

---

## 1. What's stored today

`server/sync.ts:31` (function `transformVinLead`):

```ts
leadSource: raw.source?.name || raw.leadSource || null,
```

The fallback chain is:
1. `raw.source?.name` — preferred, but VIN never populates `raw.source` for query results.
2. `raw.leadSource` — the URL string `https://api.vinsolutions.com/leadsources/id/<id>?dealerid=<dealer>`.
3. `null`.

**Live verification (probe-vin-query-shape.log, Serra Honda last 7d, 30 leads):**
- `source` field on all 30 returned leads: `null`.
- `leadSource` field on all 30 returned leads: VIN URL pattern (e.g. `https://api.vinsolutions.com/leadsources/id/3743779?dealerid=21043`).
- No leads carry a `source.name` value to short-circuit the fallback.

**Conclusion:** in current production data, the warehouse `lead_source` column is ALWAYS the URL string. The `raw.source?.name` branch is dead code in practice (kept for safety).

---

## 2. What's rendered today

There are TWO independent formatter implementations:

### 2a. `server/routes/insights.ts:53-74` — `formatLeadSource`

Used by `/api/insights/dashboard` (lines 122/125), `/api/insights/library/:id/detail` (lines 334/337), and `/api/insights/library` (lines 788/791) to format lead-source strings for tile/drill-down display.

Reads `vin_get_lead_sources` via `getLeadSourceMap` (lines 18-42) — populates a `Map<id, name>`.

**KEY BUG (separable from the deeper coverage gap):** lines 30-31 use the OLD field names:

```ts
const id = String(src.id || src.sourceId || "");
const name = src.name || src.description || "";
```

The actual MCP response (verified live, see §3) uses **`leadSourceId` / `leadSourceName`**. So this resolver populates an EMPTY map for every org, and EVERY source falls back to the `VIN Source #${sourceId}` literal (line 62) regardless of whether the MCP would have resolved it.

The same bug existed in `server/services/weeklyReportService.ts` and was already fixed there (commit-message-comments at lines 564-566 explicitly call this out). The fix in `weeklyReportService.ts:584-585`:

```ts
const id = String(src.leadSourceId || src.id || src.sourceId || "");
const name = src.leadSourceName || src.name || src.description || "";
```

The OR-chain extends backward-compat. **insights.ts was missed when weeklyReportService was fixed.**

### 2b. `server/services/weeklyReportService.ts:573-624` — second `buildLeadSourceMap` + `formatLeadSource`

Used by the weekly executive report. Already correct (uses `leadSourceId` / `leadSourceName`). Returns a `{ display, fellBack }` tuple so the validator can count fallback rows and fail validation when > 30% fall back (line 1242 / `sourceResolutionFailed` flag).

---

## 3. Live MCP shape and coverage gap

### Response shape (probe-mcp.ts, Serra Honda)

```json
{
  "top_level_keys": ["count", "items"],
  "item_count": 20,
  "first_item_keys": ["href", "leadSourceId", "leadSourceName"],
  "first_3_items": [
    { "href": ".../leadsources/id/3909937?dealerid=21043", "leadSourceId": 3909937, "leadSourceName": "Am Too Lazy To Ask" },
    { "href": ".../leadsources/id/3645600?dealerid=21043", "leadSourceId": 3645600, "leadSourceName": "Annual CU Car Sale" },
    { "href": ".../leadsources/id/98?dealerid=21043", "leadSourceId": 98, "leadSourceName": "AutoTrader" }
  ]
}
```

Confirms: the authoritative field names are `leadSourceId` / `leadSourceName`. The insights.ts resolver's reading `src.id` / `src.name` always produces an empty map (every entry skipped because `id` / `name` are undefined).

### Coverage cardinality (probe-coverage.ts, Serra Honda last 30d)

| Dimension | Value |
|---|---|
| Total leads (30d) | 608 |
| Distinct `lead_source` URL IDs in DB | 58 |
| Distinct IDs returned by MCP `vin_get_lead_sources` | 20 |
| **Resolvable IDs (intersection)** | **14** of 58 distinct (24%) |
| **Resolvable LEADS** | **197 / 608** (32.4%) |
| Unresolvable IDs | 44 of 58 (76%) |
| Unresolvable LEADS | 409 / 608 (67.3%) |
| Orphan MCP IDs (in MCP, not in DB) | 6 (e.g. CarFAX, Cars.com, Email, Radio, Service Dept, Television) |
| Null / non-URL `lead_source` values | 2 leads (1 distinct: "AutoTrader") |

**Top unresolved IDs by lead count:**

| ID | Lead count | % of org |
|---|---|---|
| 7098 | 111 | 18.3% |
| 3743779 | 54 | 8.9% |
| 3750035 | 50 | 8.2% |
| 36 | 21 | 3.5% |
| 3897825 | 21 | 3.5% |
| 3897777 | 19 | 3.1% |
| 13 | 17 | 2.8% |
| 3819124 | 17 | 2.8% |
| 153102 | 16 | 2.6% |
| 3599907 | 10 | 1.6% |

**Top resolved IDs (the 14 we CAN render):**

| ID | Name | Lead count |
|---|---|---|
| 362 | Dealers WebSite | 77 |
| 106 | Repeat Customer | 41 |
| 6371 | Local Customer | 24 |
| 123 | Referral | 14 |
| 33340 | Cargurus | 12 |

### Why the gap

`tools/list` confirms `vin_get_lead_sources` is the ONLY lead-source-related MCP tool (96 total tools, 22 vin_*). No `vin_get_lead_source` (singular by id). No `vin_search_lead_sources`. The MCP / VIN API surface only exposes a curated list — likely "currently configured / actively visible" sources from the dealer's settings panel.

The 44 unresolvable IDs are real production lead sources (they're attached to real leads — the top one, 7098, has 111 leads in 30 days for Serra Honda alone), but they don't appear in the configured-sources list.

**Hypothesis (matches session.md 2026-04-26):** VIN Solutions only returns "actively configured" sources. Older/deactivated/auto-created sources stay attached to historical leads but aren't surfaced in the lead_sources collection.

**Fixing the gap fully would require a central-mcp-side change** (e.g. add a `vin_get_lead_source_by_id` tool that does a GET on the URL itself, or extend `vin_get_lead_sources` to include archived sources). **This is OUT OF SCOPE per operator constraint.**

---

## 4. Fix paths

### Path A — Render-time fallback only (small, low-risk, addresses the symptom)

Change scope:
1. **Bug-fix `server/routes/insights.ts:30-31` field names** (`src.id` → `src.leadSourceId`, `src.name` → `src.leadSourceName`). One-line OR-chain extension. This alone takes Insights' resolution from 0% → 32.4% (matches weeklyReportService fix behavior).
2. **Improve the fallback display string** for the 67% that still won't resolve. Current: `VIN Source #7098`. Options:
   - `Source #7098 (unresolved)` — explicit but ugly.
   - `Source 7098` — drop "VIN" + "#" — less developer-y, just a number with a label. The fact that it's a number with no name is honest.
   - Group all unresolved under a bucket label: `Other configured sources` (loses per-source info but cleans the view).
3. **Surface a "partial" indicator**: when `> 50%` of leads' sources fall back to ID-label, show a subtle UI hint like "(some sources awaiting resolution)" with a tooltip explaining what that means.

Pros:
- Small, contained, server-only.
- Immediately moves Insights from "0% resolved" (current bug) to ~32% resolved (matches the underlying data).
- No risk to sync layer.

Cons:
- 67% of Serra Honda leads still display with a numeric ID (just rephrased).
- Reports (Loss Patterns by Source table) still has the same noise problem — most rows are still ID-labeled.
- Doesn't fix the underlying gap (acknowledged out of scope).

### Path B — Sync-time backfill resolution

Change scope:
1. Bug-fix as in Path A.
2. In `server/sync.ts:transformVinLead`, look up the resolved name from the MCP map and store BOTH the URL (in `lead_source` for backward-compat) and the resolved name (in a new column or in a structured field).
3. On every sync cycle, refresh the MCP map and update existing rows whose ID is now resolvable (catches up if VIN re-publishes a source).
4. UI/reports read the resolved name when present, fall back to ID otherwise.

Pros:
- Names persist across MCP outages.
- UI/reports get the same coverage as the MCP map at sync time, regardless of when they're rendered.

Cons:
- Schema change (new column or jsonb field). **OUT OF SCOPE** without explicit operator approval.
- Doesn't change the fundamental coverage: still 32% resolved, 67% unresolved. The gap is structural to VIN's API, not the timing of resolution.
- Adds complexity and storage cost for marginal benefit.
- Backfill of historical rows would need a separate pass.

### Path C — Hybrid: render-time best-effort + flagged display + bucket label for the long tail

Change scope:
1. Bug-fix `insights.ts` field names (mandatory step from Path A).
2. **Resolved IDs:** display the human name (e.g. "Dealers WebSite", "Cargurus", "Repeat Customer").
3. **Unresolved IDs with high lead counts (e.g. ≥5):** display `Source #<id>` with a soft warning indicator (subdued color or "(unresolved)" suffix). These are real sources we just can't name.
4. **Unresolved IDs with low lead counts (< 5 leads):** group into a single `Other (N sources)` bucket so the long tail doesn't pollute charts.
5. **Aggregate view tile:** add a small "Source coverage: X% resolved" indicator under any source-faceted chart so dealership leaders understand why some rows are anonymous.

Pros:
- Honest about the gap without flooding the UI with `VIN Source #N` rows.
- Customers see that ~30-50% of their volume is from named sources (the ones they actually configured for tracking) and the rest is "sources VIN hasn't named for us yet" — an accurate framing.
- Surfaces the central-mcp gap to operator/dealership without blocking launch.

Cons:
- Larger surface than Path A: touches multiple insights tiles and the Reports "Loss Patterns by Source" table.
- More UI scope markers (multiple files).
- Aggregation logic needs care to keep deltas/percentages honest.

---

## 5. Recommendation

**Path A (minimum viable fix).**

Reasoning:
- The most impactful single change is the `insights.ts` field-name bug. It alone moves Insights from 0% resolved to ~32% resolved with one line. That's bigger than any other single change in this fix list.
- Path C is the right long-term answer but it's a bigger UI surface and the operator's stated constraint is "no broad UI redesign." The aggregation/bucketing logic is also a design decision that warrants operator input.
- Path B requires a schema change, which is operator-gated.
- Once Path A ships, the 67% unresolvable surface is the central-mcp gap that needs a separate conversation with the central-mcp owner.

**Concretely for Path A:**

1. `server/routes/insights.ts:30-31` — extend the OR-chain to read `leadSourceId` / `leadSourceName` (matching `weeklyReportService.ts:584-585`).
2. **OPTIONAL low-risk add:** rename the fallback string from `VIN Source #${id}` → `Source #${id}` (drop the "VIN" — it's user-facing copy, "Source" is sufficient). One-line change. Removes a small developer-jargon leak.
3. Add a unit test for `formatLeadSource` (extract it to `server/lib/leadSourceFormat.ts` first — same refactor pattern used in earlier fixes; testable surface for the resolver field-name and fallback rules).
4. Document the central-mcp coverage gap in `decisions.md` as a partial-fix surface that needs central-mcp-side resolution. Operator can relay to the central-mcp owner.

### Test plan

- Unit tests for `formatLeadSource` against the live MCP shape (2 fixtures: full URL match with resolved name, full URL match with NO resolved name → fallback). 4-6 tests.
- `npx tsc --noEmit` clean.
- `npx vitest run tests/unit/` clean (294+ tests).
- Live verification post-deploy: re-query Insights Library "Top Source" tile for Serra Honda. Expected change: `VIN Source #7098 (18%)` → `Source #7098 (18%)` (still unresolved, since 7098 isn't in MCP). The resolved sources DO appear by name: `Dealers WebSite (12.7%)`, `Repeat Customer (6.7%)`, etc.

### Risk

- Server-only change. No UI scope marker required.
- No schema change.
- No external system effects.
- No data migration.
- No new integration with central-mcp.

### What this fix does NOT do

- Does NOT resolve IDs the MCP doesn't know about (67% of Serra Honda's leads).
- Does NOT add a UI bucket for the long tail (defer to operator/Path C if desired).
- Does NOT change Reports "Loss Patterns by Source" table beyond the new fallback string format.
- Does NOT touch sync.ts (no schema change).
- Does NOT modify central-mcp (out of scope per operator).

---

## 6. Surface-to-operator: central-mcp gap

**For operator relay to central-mcp owner:**

`vin_get_lead_sources` returns ~20 items per dealer (Serra Honda: 20, session.md reports 16-20 per other Serra orgs, Tony Serra Ford: 20, Hyundai of Columbia: 20, Ford of Columbia: 15). But the warehouse has many more distinct lead-source IDs attached to real leads — IDs that the MCP does NOT include.

For Serra Honda specifically:
- 58 distinct IDs attached to last-30-day leads
- Only 14 of those (24%) are resolvable via `vin_get_lead_sources`
- Top single unresolved ID: 7098 — 111 leads / 18% of monthly volume

Hypothesis: VIN Solutions's API returns only "actively configured" sources from the dealer's settings panel. Older/deactivated/auto-created sources are still attached to leads but absent from the configured-list response.

Possible central-mcp solutions (NOT for nexxus to implement):
1. Add `vin_get_lead_source_by_id(orgId, sourceId)` tool that does a GET on the URL itself.
2. Extend `vin_get_lead_sources` with an `includeArchived: true` parameter.
3. Cache a fuller mapping by walking the URLs from historical lead data.

This is the central-mcp-side change session.md mentioned. Until it exists, our render-time resolution is structurally capped at ~30-35% for Serra Honda and similar percentages for other Serra orgs.

---

**Awaiting greenlight on Path A** (with the optional fallback-string rename and the unit-testable extraction).
