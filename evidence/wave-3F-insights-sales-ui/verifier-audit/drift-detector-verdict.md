# Wave 3F-A Drift Detector Verdict

**Auditor role:** hierarchy-drift detector (Roadmap → Phase → Wave → Chunk → Step)
**Wave under review:** 3F-A (mechanical sub-wave of Wave 3F — Phase 5 Insights/Sales UI)
**Date:** 2026-05-07
**Audit method:** read-only inspection of bookend, chunk evidence, source diff, plan.md, roadmap.md, git history.

## Verdict

**NO DRIFT**

## Boundary checks

### 1. Chunk-level scope creep

**S1 — null guard at sales.tsx:129.** PASS.
- Diff inspected at git SHA `000abd7`: exactly one line changed (`client/src/pages/sales.tsx` line 129) — a single ternary swap from `\`${summary.conversionRate}%\`` to `summary.conversionRate == null ? '—' : \`${summary.conversionRate}%\``.
- `git show --stat` confirms `1 file changed, 1 insertion(+), 1 deletion(-)`. No surrounding refactor, no extracted helper, no other tile touched.
- The em-dash fallback is consistent with the existing metric-honesty convention (no `0%` math-fabrication). No taste/design/CX call made — this is the established Wave 1C honesty doctrine being mechanically extended.
- Scope marker `.claude/state/scope/sales.tsx.ok` was created and consumed (auto-cleared, as expected).

**S2 — 404 triage.** PASS.
- Investigation-only chunk: zero code change, zero commit, zero scope markers consumed.
- Hit-table classifications strictly follow the OPENING-bookend (a)/(b)/(c) categories. Both targets (`/sales/leads`, `/widget-landing`) classified (c) and escalated to Wave 3F-B.
- No mechanical fix was forced where the OPENING-bookend rules required escalation. No placeholder route was added.

### 2. Wave-level v2.2-vs-v2.3 drift

**No v2.3 territory crossed.** The roadmap.md "v2.3 Deferred Map" enumerates BL-107..BL-113 (lead_type schema, AI-role visuals, ADF/XML rebuild, advanced notification rules, Sales Coordinator, Marketing Insights server-side scope, TeamBox channel filter). None of these are touched by the S1 ternary or by S2's investigation. The escalations to 3F-B are explicitly within v2.2 (Wave 3F-B is queued in plan.md row 61 as a sibling sub-wave).

### 3. Wave-level cross-wave drift

**Wave 1C (metric computation).** PASS — no server-side metric code touched. The S1 change is at the render boundary of `buildSalesMetrics`, downstream of the API response. The em-dash convention itself was established by Wave 1C; reusing it is preservation, not extension.

**Wave I-Auth.** PASS — no auth, RBAC, ProtectedRoute, or session code touched.

**Wave 2A (service campaigns).** PASS — no service-module flags, campaign code, or per-store enablement touched.

**Wave 3B/3C (marketing routing).** PASS — no marketing dashboard, tab routing, or filter-scope code touched.

### 4. Phase-level drift

Wave 3F lives in **Phase 5 (Insights + Reports + Metrics)** per plan.md row 38–39 and row 61. The single code change (`client/src/pages/sales.tsx`) sits inside the Sales/Insights surface. No edits to:
- Phase 1 (auth) — no touches
- Phase 2 (entry+shell) — no touches
- Phase 3 (TeamBox) — no touches
- Phase 6 (Marketing) — no touches
- Phase 9 (Management/Settings) — no touches

`git diff 068aaa7..wave/5-insights/3F-A-mechanical --name-only` returns exactly three paths, all within Phase 5 surface or within `evidence/wave-3F-insights-sales-ui/`.

### 5. Sub-wave 3F-A vs 3F-B drift

**No 3F-A taste/design call made.** The S1 fallback choice (`'—'` vs `0%`) is mechanical because the project already has an established honest-no-data convention (cited in S1 proof.md and reinforced throughout Wave 1C). Picking `'—'` matches that convention; picking `0%` would have been the design choice (and would have violated the metric-honesty doctrine). The decision is therefore not a fresh taste call — it is conformance with a previously-locked decision.

S2 correctly defers ALL design questions about whether `/sales/leads` or `/widget-landing` should resolve, and to what surface, to 3F-B's operator design-gate. The two enumerated 3F-B options-tables in `triage.md` are framed as "operator decisions required" — they do NOT pre-commit any choice.

### 6. Anomaly tagging — MobileNavDropdown finding

The S2 builder did surface a bonus finding: `client/src/components/layout/MobileNavDropdown.tsx:59` references `/work-center?tab=leads`, and `/work-center` is not wired in `App.tsx`. This is a separate 404 risk not reported by Wave 1C.

**Tagged correctly.** The triage table marks it `OUT OF SCOPE for this chunk; flag for 3F-B if reproducible`. No silent fix, no scope marker created for `MobileNavDropdown.tsx`, no edit attempted. The finding is recorded in evidence (auditable trail) and explicitly handed off to 3F-B for the operator design-gate, which matches the OPENING-bookend escalation pattern.

This is the correct discipline: **explicit over implicit**. A silent fix here would have been drift; the explicit deferral is not.

## Cross-checks performed

- `git show 000abd7 --stat` — confirmed 1-line scope of S1 commit
- `git show 000abd7 -- client/src/pages/sales.tsx` — confirmed exact diff matches S1 proof.md
- `git diff 068aaa7..wave/5-insights/3F-A-mechanical --name-only` — confirmed only 3 paths changed (sales.tsx + 2 evidence files)
- `Read sales.tsx:120-131` — confirmed line 129 in current source matches the post-fix form
- plan.md grep — confirmed Wave 3F is row 61 in Phase 5 queue
- roadmap.md grep — confirmed v2.3 deferred items (BL-107..BL-113) untouched
- bookend OPENING — confirmed the (a)/(b)/(c) classification rule and 3F-B deferral pattern were authored before S2 ran
- `.claude/state/scope/` — empty (markers correctly consumed and auto-cleared)

## Summary

Wave 3F-A held its boundary. Both chunks delivered exactly the mechanical scope declared in the OPENING bookend: S1 a one-line null guard, S2 an investigation-only triage with zero code change. No taste/design decisions were made; both 404s and the bonus MobileNavDropdown finding are correctly escalated to Wave 3F-B's operator design-gate. No v2.3 territory was crossed. No other wave's territory (1C metric computation, I-Auth, 2A service campaigns, 3B/3C marketing) was touched. Phase 5 boundary held — only `client/src/pages/sales.tsx` and wave-scoped evidence files changed.
