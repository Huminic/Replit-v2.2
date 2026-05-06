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

**Closed:** 2026-05-06
**Wave-level verdict:** GATE-CLEAN — code-level proof PASS. Runtime proof deferred to operator pre-merge.

### Changed files (final, aggregated across 6 chunks)

| File | Chunks | Net change |
|---|---|---|
| `server/routes/insights.ts` | S1, S4, S5 | +74/-13 |
| `server/storage.ts` | S2 | +8/-1 |
| `server/vendorProxy.ts` | S3 | +8/-2 |
| `tests/agents/generated/sales.agent.spec.ts` | S6 | +5/-2 |
| `tests/e2e/s1-ai-chat.spec.ts` | S6 | +2/-1 |

5 files / +97/-19 / 6 commits.

### Commits (wave branch `wave/5-insights/1C-metric-honesty`, base `batch-1-finish-line` at `857febf`)

| Wave SHA | Cherry-pick source | Description |
|---|---|---|
| `dcffb19` | `7fe52bb` (S1) | drop hard-coded `trend: "flat"` on lead-source payload |
| `a5bc106` | `62cf437` (S2) | server-side entityType filter on getActivityLogs |
| `a467f14` | `6ce4ac6` (S3) | drop dead warehouse branch + null-out all-zero fallback |
| `af06c3b` | `58ce181` (S4) | UPSTREAM sales-only predicate at getWarehouseLeads fetch sites |
| `3c40091` | `d151cd8` (S5) | swap dishonest 30d conv-rate for lib-8 lifetime win rate |
| `23742cf` | `ac723d1` (S6) | align stale assertions with Wave 1C honesty changes |

### Per-chunk audit verdicts

| Chunk | scope-guardian (isolated) | code-reviewer (isolated) | release-fit-reviewer (teammate) |
|---|---|---|---|
| S1 | PASS | APPROVE | FIT |
| S2 | PASS | APPROVE (1 minor commit-body advisory; not blocking) | FIT |
| S3 | PASS | APPROVE | FIT |
| S4 | PASS | APPROVE | FIT |
| S5 | PASS | APPROVE | FIT |
| S6 | PASS | APPROVE | (deferred — covered by final wave-level scan) |

Wave-level fit-reviewer scan: **FIT** — no fitness blockers.

### Tests run (wave-level code proof)

- `npx tsc --noEmit` on integrated wave branch → **PASS** (zero errors)
- `npx vitest run tests/unit/` on integrated wave branch → **17 files PASS, 459 tests PASS, 2 skipped (intentional)** — duration 51s
  - Preserves Wave 1B's "excludes service rows by default" and "excludes service rows across every tile type for every dealer org" → S4's UPSTREAM predicate did not regress Wave 1B coverage

### Two deltas of proof (per chunk × 6)

- **Delta 1 (mechanical scope):** scope-guardian PASS × 6 (each chunk's diff matched its declared scope)
- **Delta 2 (semantic correctness):** code-reviewer APPROVE × 6 (no `required_changes_before_merge` across all chunks)

### Provider proof / Δ1 captured 2026-05-06 (qa-evaluator)

**Δ1 (provider-observed) — PASS.** Resend dry-run executed via Wave 1B precedent direct-invocation pattern (`npx tsx --env-file=.env -e "..."`) with `TESTLANE_MODE=true TESTLANE_EMAIL_TO=duane.wells@huminic.ai`.

| Item | Value |
|---|---|
| Resend response | `{"sent":true,"messageId":"f443654b-bf71-494e-b09b-0714c12627e5"}` |
| Recipient | `duane.wells@huminic.ai` (internal_operator allowlist; hard-routed by TESTLANE override) |
| Subject prefix | `[testlane:wave-1c-runtime-proof]` (correctly tagged) |
| Body bytes | 40,018 (rendered weekly report HTML) |
| Numbers eye-check | varied trend arrows (↑/↓ — no `flat`); zero `sync_*` rows; no NaN/null%/undefined in visible text; `100%` hits all CSS literals (16/16) |
| Halt conditions | all PASS (env, sent, status, subject, recipient, render) |

**What Δ1 covers:** S1 (drop `trend:flat`) and S2 (entityType filter) — both directly observable in rendered email body. PASS for both.

**What Δ1 does NOT cover:** S3 (vendorProxy null fallback), S5 (lib-8 lifetime win rate). These KPIs render on `/sales` and `/insights` browser surfaces — not surfaced in the weekly email. **Δ2 browser walks remain required** before Wave 1C is fully runtime-proven.

Evidence files (committed alongside this update): `wave-proof/env-readiness.txt`, `wave-proof/send-runtime-log.txt`, `wave-proof/resend-response.json`, `wave-proof/post-1c-body.html`, `wave-proof/wave-1c-numbers-snapshot.md`, `wave-proof/unit-suite-rerun.txt`, `wave-proof/integration-suite-default.txt`, `wave-proof/build-gate-blocked.md`, `wave-proof/playwright-walk-plan.md` (Δ2 spec), `wave-proof/resend-preflight-staged.md` (Δ1 spec).

### Δ2 (browser walks) — STILL REQUIRED (parked at build gate)

Build approval (`npm run build && pm2 restart nexxus-app` on dev) is the unblocker. After build approval, Δ2 closes S3, S5, S6 visible-surface verification per `wave-proof/playwright-walk-plan.md`. Recommended next sequence:
1. Operator approves `npm run build` (DEV) → orchestrator runs build with `# APPROVED:` suffix, then `pm2 restart nexxus-app`.
2. qa-evaluator (or playwright-test-generator) walks `/insights`, `/sales`, `/dashboard` as `serra_honda@huminic.ai` (read-only). Captures 7 PNGs + `walk-summary.md`.
3. Operator review of full Δ1+Δ2 evidence pack → approve `git merge --ff-only wave/5-insights/1C-metric-honesty` → push → live deploy (separate gate).

### Backlog follow-ups surfaced by qa-evaluator (NOT blockers)

1. `tests/integration/weeklyReport.send-live.test.ts` does not pass `testLaneSessionId` and does not put `[testlane:...]` in the subject. Under `TESTLANE_MODE=true` it would fail-closed by design. qa-evaluator used the direct-invocation fallback (Wave 1B precedent, explicitly authorized in `resend-preflight-staged.md`). **Backlog:** teach the test to self-mark.
2. The html-eye-check helper regexes raw HTML for `100%`, catching CSS literals (`width:100%`, gradient stops). qa-evaluator manually unpacked all 16 hits and confirmed none are visible KPIs. **Backlog:** strip CSS/style attributes before regex.

### Spec refinements documented (folded inline; recorded here for OPENING bookend reconciliation)

| Chunk | Refinement | Rationale |
|---|---|---|
| S2 | Dropped `userId IS NOT NULL` from D-F1 #8 spec; kept only NULL-tolerant `entityType NOT IN ('sync','system')` | Builder consumer scan: original would break `triggerService.hasRecentTriggerSend` (SMS-spam risk for serra-honda) and `dailyRecapService.buildDailyRecap` counters (both depend on NULL-userId trigger rows). |
| S3 | Used NULL-tolerant `entityType` filter form (`IS NULL OR NOT IN`) | SQL `NOT IN` excludes NULLs by default; would silently drop legitimate user-attributable rows whose call sites omit entityType. |
| S5 | Path B chosen (consumer-side computation in `insights.ts`) over Path A (vendorProxy edit) | Targets the dishonest surface directly; vendorProxy's 30-day calc may have other consumers. Single helper `computeLifetimeWinRate` shared between dashboard tile and lib-8 push for single source of truth. |

### Existing code inconsistencies surfaced (NOT touched in Wave 1C — v2.3 follow-ups)

1. lib-8 displayed value formula at `:1047` is `sold/total`; lib-8 detail-case insight string at `:466` is `sold/(sold+lost)`. Disagree. Builder followed displayed-value formula. Product question for v2.3.
2. `client/src/pages/sales.tsx:129` renders `${summary.conversionRate}%` literally; with `conversionRate` now possibly null, this produces "null%" string. **Wave 3F UI must fix** (render "—" or hide tile when null).
3. Code-reviewer S2 advisory: commit body lists `login_failed`/`organization_created`/`hunches_generated` as `entityType` omitters; those writers actually set entityType. The IS-NULL branch is defensive-only, not load-bearing. Not amended.

### Issues / backlog updates

None new. Existing: `BL-107 lead_type schema migration` → v2.3 (not promoted). Wave 9-Sec triage (5 security items I-244/245/246/247/249) still queued.

### Accepted debt

- AD: lib-8 internal formula inconsistency (`:466` vs `:1047`) — v2.3 product question, not a release blocker.
- AD: `null%` UX in `client/src/pages/sales.tsx:129` until Wave 3F handles null.
- AD: S2 commit-body advisory (defensive IS-NULL branch). Not amended.

### Rollback notes

- Each chunk is its own commit on its own chunk branch + integrated wave branch.
- Single-change revert: `git revert <chunk-sha-on-wave-branch>` and merge.
- Worst case: drop the entire wave branch — `batch-1-finish-line` (HEAD `857febf`) is the pre-Wave-1C state. No DB migration to roll back; no schema change; no provider state to undo.

### Merge recommendation (operator-approved sequence)

1. After runtime proof PASS + operator GO: fast-forward merge wave branch into `batch-1-finish-line`:
   `git checkout batch-1-finish-line && git merge --ff-only wave/5-insights/1C-metric-honesty`
2. Then operator-approved push to remote (or PR-to-main if that's the merge target):
   `git push origin batch-1-finish-line`  (operator approves the exact command)
3. Live deploy gate is separate (`npm run build && pm2 restart nexxus-app` — explicit operator approval per CLAUDE.md hard rules).

### Next-wave readiness

- **YES** — Wave I-Auth (read-only auth audit; no dependency on Wave 1C).
- **YES** — Wave 3F (Insights/Sales UI label-only changes; pre-locked scope markers; consumer-side handling of new null-tolerant API shape from this wave).
- **CONDITIONAL** — Wave 2A (provider-proof workflows; independent of Wave 1C; ready when operator authorizes).

### Orchestrator-side cleanup queue (next session)

- 5 orphan worktrees in `.claude/worktrees/agent-*` from chunk subagent spawns; `git worktree remove -f -f` to clean (locks held by runtime).
- `worktree-agent-a46c2ac9203612a77` orphan branch (created by S1 subagent runtime; chunk content already cherry-picked to wave branch as `dcffb19`; branch redundant). Operator-approved cleanup queue.
