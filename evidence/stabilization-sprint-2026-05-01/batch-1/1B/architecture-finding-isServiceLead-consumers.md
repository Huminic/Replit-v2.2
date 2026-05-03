# Chunk 1B — Architectural finding: isServiceLead consumer mapping

Discovered during 1B gate review and confirmed via codebase grep:
the `isServiceLead` helper at `server/statusClassifier.ts:47-49`
(test-covered by Chunk 1A) has ZERO production consumers in `server/`.

Only reference outside its definition + tests:
- `server/services/weeklyReportService.ts:462` — a comment noting "SQL
  predicate kept aligned with classifyVinStatus's 'SERVICE_' prefix"

## Implication for 1B production behavior

1B's runtime sales-vs-service filtering is performed entirely at the SQL
layer — six Drizzle predicates `UPPER(${warehouseLeads.vinStatus}) NOT LIKE
'SERVICE\_%' ESCAPE '\\'` reimplementing the same logic the JS helper
encodes. The JS helper itself is not invoked at runtime by 1B's code path.

## Why this still matters

Chunk 1A's unit test for `isServiceLead` (8 SERVICE_* tokens, 12 non-service
representatives, null/undefined/empty, lowercase + mixed-case =
case-insensitive) PINS the JS-side contract. If any future code wires
`isServiceLead` in (e.g., filtering an in-memory array of records returned
from a live MCP query, or a future status-classification-on-arrival path),
it will inherit the same semantics that 1B's SQL layer enforces.

The 1B fixup commit (e245ff5) explicitly aligned the SQL predicate with
the JS helper's case-insensitive + underscore-strict semantics so that
future divergence is structurally prevented.

## Implication for Chunk 1C

Chunk 1C touches `server/routes/insights.ts` and `server/vendorProxy.ts`,
which read `warehouse_leads` via `storage.getWarehouseLeads(orgId, ...)`
(call sites: insights.ts:56, 268, 359, 721, 722; vendorProxy.ts:569, 570).
These call sites currently return ALL rows (sales + service mixed).

1C must apply equivalent service-vs-sales filter semantics — either:

(a) at the storage layer (`storage.getWarehouseLeads`) so all callers
    inherit the filter, OR
(b) at each call site individually in `insights.ts` / `vendorProxy.ts`.

Either way, the predicate must match 1B's:
`UPPER(vin_status) NOT LIKE 'SERVICE\_%' ESCAPE '\\'`

Inconsistency between 1B (weekly report) and 1C (insights/sales) would
produce divergent service-vs-sales counts on different surfaces of the
dashboard for the same dealer/window.

## Read paths confirmed in scope of 1C metric verdicts

Per Dispatch 3's 8-metric verdict matrix:
- Metric 5 (sales/service contamination across all metrics) — fix at
  every `getWarehouseLeads` site
- Metric 8 (sales activity feed) — fix server-side in storage.ts:1198-1203

These are the 1C-specific surfaces. The same predicate strategy from 1B
should propagate.

## Live MCP queries (out of scope for sales-vs-service filter)

Live MCP queries via `vendorProxy.ts` (`/api/vin/leads/:leadId/contact`,
`/api/vin/lead-sources`, `/api/vin/lead-statuses`, etc.) return individual
records or metadata, not aggregated sales-vs-service counts. They do NOT
need filtering. The classification question doesn't arise for transactional
fetches.

## Operator decision recorded

Operator accepted Chunk 1B fixup form A (UPPER + underscore-strict) over
the literal-directive form B (underscore only). Reason: matches JS helper
semantics exactly; counts unchanged for current Serra Honda data;
defensive alignment, not a behavior surprise.

## Confirmed by (reproducible)

- `grep -rEn "isServiceLead|classifyVinStatus" server/ --include="*.ts" | grep -v "statusClassifier.ts\|statusClassifier.test.ts"` → returns only the comment cited above
- `grep -nE "from\s+\S+(warehouse_leads|leads|sync|warehouse\.)" server/services/weeklyReportService.ts` → confirms 6 SQL leak sites
- `grep -nE "warehouseLeads|warehouse_leads|getWarehouseLeads" server/routes/insights.ts` → 5 call sites
- `grep -nE "warehouseLeads|warehouse_leads|getWarehouseLeads" server/vendorProxy.ts` → 2 call sites at lines 569, 570
- Read of `dailyRecapService.ts:34-91` — separate-but-equivalent SQL filter
  `vin_status LIKE 'SERVICE%'` (already correct per Dispatch 2; broad form,
  not yet underscore-strict — candidate for v2.3 alignment, not 1B/1C scope)
