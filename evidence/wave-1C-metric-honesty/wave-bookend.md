# Wave Bookend — 1C — Metric Honesty (server-side)

## OPENING

**Wave:** 1C
**Phase:** 5 — Insights + Reports + Metrics
**Date opened:** 2026-05-05
**Goal (plain English, 1 sentence):** Make every dealer-facing number truthful by fixing or hiding the dishonest server-side metrics surfacing in `/insights`, `/sales`, and the activity feed.
**Why necessary for v2.2 release:** Conversion rate prints "100%", positional A+/A/B/C grades pretend to be performance scores, the pipeline forecast is backward-labeled, the lead-source trend is hard-coded `"flat"`, and the activity feed is dominated by `sync_delta_completed` system events. UI-truth rule: visible falsehoods must be true, hidden, gated, or deferred before release.

### Existing evidence to reuse

- `evidence/stabilization-sprint-2026-04-30/lane-7-metrics.md` — 19 of 42 audited metrics graded REAL; 16 PARTIAL; 7 dishonest.
- `evidence/stabilization-sprint-2026-05-01/finish-line-plan.md` §4 — D-F1 per-metric verdict matrix.
- `evidence/stabilization-sprint-2026-05-01/finish-line-findings/03-metrics.md` — fallback-hit rates and exact line numbers.
- `evidence/stabilization-sprint-2026-05-01/finish-line-findings/02-reports.md` — Wave 1B context for sales-vs-service predicate.

### Current status of this component

PARTIAL — primitives exist (`server/routes/insights.ts`, `server/vendorProxy.ts`, `server/storage.ts` activity log) and produce values; values are misleading on the dealer-facing surfaces.

### In scope (server-only)

| Metric | Verdict (D-F1) | File:line | Action |
|---|---|---|---|
| 1. Conversion rate "100%" | swap → lifetime win rate | `server/routes/insights.ts:113` (consumer) and `server/vendorProxy.ts:641` (producer) | Replace conversion-rate computation with the lifetime-win-rate logic that already lives inline at `server/routes/insights.ts:1047` (lib-8 metric — there is NO separate `server/services/lib-8.ts` file). The case branch is at `server/routes/insights.ts:447`. |
| 4. Lead-source trend hard-coded "flat" | suppress (drop trend field) | `server/routes/insights.ts:138` | Remove the literal `trend: "flat" as const` from the lead-source response payload. |
| 5. Predicate at every getWarehouseLeads | fix (apply sales-only predicate consistently) | actual fetch sites: `server/routes/insights.ts:56,268,359,721,722` (downstream consumers at `:113,129,238`) | Apply the sales-only filter UPSTREAM at the actual fetch sites (`:56,268,359,721,722`). Downstream tile computations at `:113,129,238` consume the filtered array. Predicate sourced from `server/statusClassifier.ts:isServiceLead`, consistent with Wave 1B's use in `weeklyReportService.ts`. |
| 6. All-zero fallback at vendorProxy | fix (drop the silent fallback) | `server/vendorProxy.ts:641-642` | The "metricsAllZero" behavior is unanchored as a literal symbol but the lines are the real fix targets — the `conversionRate` calc and the `source: "warehouse"` literal at :641-642. When `warehouse_metrics` is missing or zeroed, return null/explicit-empty instead of fabricating zeroed values. Consumer-side handling deferred to Wave 3F. |
| 7. Dead "warehouse" branch on `leadSummary.source` | suppress | `server/vendorProxy.ts:642` | Remove the `source: "warehouse"` literal that makes the "VinSolutions Live" branch unreachable dead code. |
| 8. Activity-feed system events | server-side filter | `server/storage.ts:1198-1203` | Add `userId IS NOT NULL AND entityType NOT IN ('sync','system')` to the `getActivityLogs` query so `sync_delta_completed` rows do not flood the dealer-facing feed. |

**Implementation note:** `lib-8` is inline at `server/routes/insights.ts:1047` (with the case branch at `:447`). There is NO separate `server/services/lib-8.ts` file. Wave-bookend file scope must not list a phantom file.

### Out of scope (explicit)

- Any `client/src/*` file. Consumer-side label changes (positional grade A+/A/B/C suppression on UI; pipeline forecast relabel) belong to **Wave 3F** with the pre-locked `insights.tsx.ok` and `sales.tsx.ok` markers per `.claude/session.md` 2026-05-02 lock.
- `shared/schema.ts` (no schema migration in v2.2 — BL-107 deferred).
- `migrations/` (no migration in v2.2).
- `server/lib/leadSourceFormat.ts` is **consume-only**; do not modify (operator decision 2026-04-26 D-279 path A).
- Marketing Insights server-side scope (KD-4) — defaults to Wave 3C.

### Known defects this wave addresses

- KD-2 (7 dishonest metrics — 6 of 7 server-side; metrics 2 and 3 deferred to 3F)
- KD-9 (sales activity feed dominated by `sync_delta_completed`)

### Operator decisions required BEFORE autonomy starts

None new. All Wave 1C decisions are locked:

- D-A1 (sales-vs-service heuristic) — locked
- D-F1 (per-metric verdict matrix) — locked
- D-B1 (allowlist autonomy) — locked
- UI scope NOT in this wave (Wave 3F handles UI portion)

### Credentials / accounts / allowlists required

None. Wave 1C is server-side code only; no provider sends, no DB writes, no live access.

### Provider-send approvals required

None.

### UI scope markers required

None. Any UI file edit triggers a STOP condition.

### Files likely touched (final scope)

- `server/routes/insights.ts`
- `server/vendorProxy.ts`
- `server/storage.ts`

Optional helpers:

- Consume `server/statusClassifier.ts:isServiceLead` directly. Creating a new shim file (e.g. `server/services/leadClassification.ts`) requires explicit chunk-scope amendment — do NOT add it incidentally. (Trim folded 2026-05-06 per release-fit-reviewer FIT scan.)

### Git branch / worktree strategy

- Branch base: current `batch-1-finish-line` (HEAD `13ee709` after Wave 1B merge).
- Wave branch: `wave/5-insights/1C-metric-honesty` off `batch-1-finish-line`.
- Each chunk gets its own `chunk/5/1C/<name>` branch off the wave branch.
- Worktree isolation: implementation chunks use `git worktree add .worktrees/wave-5-1C <chunk-branch>`. **Worktree isolation MUST work for Wave 1C implementation; if the team-runtime in-process limitation persists, fall back to isolated Agent subagent for the implementer (operator approval required for the fallback per `evidence/governance-reset-2026-05-05/runtime-deviation-in-process-teammate.md`).**

### Agent-team roster (collaborator teammates)

- `team-lead` (orchestrator)
- `release-product-logic` (already on team — available for chunk-scope review)
- `release-builder-1C` (to be spawned at implementation time, NOT during this OPENING bookend)

### Isolated audit subagents (gate-only, no team mailbox)

- `scope-guardian` — verifies the diff matches the file scope above
- `code-reviewer` — reviews each chunk diff
- `integration-safety` — runs only if any chunk unexpectedly touches an external-provider boundary

### Stop conditions (explicit)

- Diff includes any `client/src/*` file → STOP
- Diff includes any `shared/schema.ts` or `migrations/` change → STOP
- Any change to `server/lib/leadSourceFormat.ts` (consume-only) → STOP
- Any test-lane provider send touches a non-allowlisted recipient → STOP
- Per-metric before/after evidence cannot be captured → STOP, surface to operator
- lib-8 lifetime computation does not return a sensible value when fed real Serra Honda data → STOP, escalate to Phase 1 Core report-primitive review
- Code-reviewer subagent flags any "while we're at it" cleanup outside file scope → STOP, reduce diff

### Chunk list (commit-worthy units; refined when builder spawns)

- Chunk 1C-S1: Drop `trend: "flat"` literal at `server/routes/insights.ts:138` (smallest, lowest-risk warmup)
- Chunk 1C-S2: Activity-feed server-side filter at `server/storage.ts:1198-1203`
- Chunk 1C-S3: Drop `source: "warehouse"` dead branch at `server/vendorProxy.ts:642` + remove `metricsAllZero` fallback at `:641`
- Chunk 1C-S4: Sales-only predicate at every `getWarehouseLeads` at `server/routes/insights.ts:113,129,238`
- Chunk 1C-S5: Conversion-rate swap → lib-8 lifetime win rate (relies on inline `:447,1047`)

### Proof required (chunk + wave levels)

- **Chunk-level (each):** TS check passes (`npx tsc --noEmit`); focused unit tests for any new predicate/filter; scope-guardian PASS.
- **Wave-level:** before/after value capture for each of metrics 1, 4, 5, 6, 7, 8 (SQL-backed for predicate metrics; inspection-backed for trend/dead-branch); test-lane weekly-report dry-run with consolidated predicate (this re-uses Wave 1B's Resend dry-run protocol — preflight + destination-classification table required); Playwright walk of `/insights` and `/sales` (read-only) showing the new shape; integration-safety PASS.

### Expected evidence path

- `evidence/wave-1C-metric-honesty/chunk-1C-S1/`
- `evidence/wave-1C-metric-honesty/chunk-1C-S2/`
- ...
- `evidence/wave-1C-metric-honesty/wave-proof/`
- `evidence/wave-1C-metric-honesty/wave-bookend.md` (this file — OPENING + CLOSING)

---

## CLOSING

(Section intentionally empty until wave completes. Lead fills using the wave-bookend template's CLOSING section.)
