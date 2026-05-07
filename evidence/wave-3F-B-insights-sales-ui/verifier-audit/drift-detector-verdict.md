# Drift Detector — Wave 3F-B Insights/Sales UI

**Verifier:** drift-detector (general-purpose, isolated)
**Date:** 2026-05-07
**Wave:** 3F-B (Insights/Sales UI design-gate execution)
**Phase:** 5 — Insights + Reports + Metrics
**Branch audited:** `wave/5-insights/3F-B-design-gate` (HEAD `be3502f`)
**Commit range audited:** `e256029` (S1) → `be3502f` (S5 evidence) — 5 commits (S1, S2, S3, S4 evidence, S5 fix, S5 evidence)
**Reference materials reviewed:**
- `plan.md` (phase + wave roadmap)
- `roadmap.md` (full v2.2 + v2.3 component map)
- `evidence/wave-3F-B-insights-sales-ui/wave-bookend.md` (OPENING)
- `evidence/wave-3F-insights-sales-ui/wave-3F-B-design-gate-questions.md` (locked picks)
- All 5 chunk evidence files

---

## VERDICT: **DRIFT FOUND** (1 documentation drift, low-severity; all code execution NO DRIFT)

**Summary:** Code execution is fully on-scope: every chunk implemented exactly the locked-pick action, files touched match the wave-bookend declared scope, and no out-of-scope phases/waves were entered. The single drift is **documentation**: the wave-bookend's CLOSING-side claim that "Item 4 was revised B → A post-investigation … Documented at the head of the picks doc" is FALSE — the picks doc still shows Item 4 = **B** at line 13. The wave-bookend documents the revision; the picks doc itself does not.

---

## Drift checks — line by line

### Check 1: Chunk-level scope creep
**NO DRIFT.** Each S* chunk did exactly what the wave-bookend specified, no more.

| Chunk | Spec | Actual | Drift? |
|---|---|---|---|
| S1 | em-dash threshold n<20 on `sales.tsx:129` Conv Rate + `insights.tsx:262` Win Rate (tile labels only; chart-data raw) | `sales.tsx` line 134 (1 line + 3 comments) + `insights.tsx` lines 261-266 (2 lines + 4 comments). Chart-data points at 1048/1085/2050/2101 NOT touched. | NO |
| S2 | Add `<Route path="/work-center" component={MyWorkPage} />` in `App.tsx`; do NOT modify `MobileNavDropdown.tsx`/`MobileSidebar.tsx`/`settings.tsx`/`notification-utils.ts` | Single line inserted at `App.tsx:70`. None of the 4 forbidden files touched (verified by `git diff --name-only`). | NO |
| S3 | Rename "Top Performing Agents" → "Top Performing AI Agents" at `sales.tsx:635` | Single string change at `sales.tsx:639` (line shifted +4 by S1's added comments). Grep confirms zero remaining "Top Performing Agents" without "AI" in client/src. | NO |
| S4 | Read-only investigation; output `chunk-S4/source-quality-investigation.md` with defect description, screenshots ref, fix options | Exactly what was produced (96-line investigation file referencing `evidence/wave-1C-comprehensive-e2e/routes/sh-02-insights-source-trends.png`). Zero code edits. | NO |
| S5 | Conditional mechanical fix only IF defect is unambiguously mechanical | Fix applied (4 ins / 8 del in `insights.tsx`). Single-file scope. The fix includes a subtitle copy edit ("Win rate by source over last 6 months" → "Win rate by lead source (lifetime)") which S4 itself flagged as a CX/copy call requiring escalation; S5 proof says "advocate-locked, post-S4 finding". This is a borderline scope expansion (see Check 7) but the wave-bookend's S5 conditional clause permits "if defect is unambiguously mechanical" and the advocate explicitly authorized the copy edit per the picks doc's delegated-authority model. | NO (with documentation caveat — see Check 7) |

### Check 2: Locked-pick drift
**NO DRIFT on execution.** Each pick honored:

- **Item 1 = B (em-dash, n<20):** S1 implements em-dash threshold. NO badge, NO tooltip, NO banner — confirmed via diff inspection. The composite condition `(summary.conversionRate == null || (summary.soldLeads + summary.lostLeads) < 20) ? '—'` matches Option B exactly.
- **Item 4 = A (add route, NOT B re-target links):** S2 adds the route in `App.tsx:70`, does NOT modify the 4 link references. (Picks doc says B; wave-bookend revised B→A. Execution matches the bookend's revised pick A. See Check 6 for documentation drift on the revision.)
- **Item 5 = mid-wave advocate revision:** S5 was applied with subtitle copy "Win rate by lead source (lifetime)" — S5 proof line 21, 60-62 documents this. Documentation thin (see Check 7) but present.
- **Item 6 = A (rename only):** S3 renamed only. NO new "Top Performing Reps" component, NO data-source change, NO new section.

### Check 3: v2.2-vs-v2.3 drift
**NO DRIFT.** Verified via `grep -rn "Top Performing Reps\|TopPerformingReps\|Top Reps\|human.*leaderboard\|rep.*leaderboard" client/src/` — zero matches. No human-rep leaderboard component was added. Item 6 v2.3 deferral honored.

### Check 4: Wave-level "this should have been a different wave" drift
**NO DRIFT.** Audited via `git diff e256029^ be3502f --name-only | grep -Ei "auth|teambox|marketing|service|comms|outbound|server/|migration|schema"` — zero matches. None of the touched files belong to:
- Wave 1C (server-side metric computation in `server/`) — untouched
- I-Auth (auth/account integrity in `server/middleware/auth*`) — untouched
- Wave 2A (service campaigns) — untouched
- Wave 3B/3C (Marketing routing) — untouched
- Wave 3A (TeamBox Push-to-VIN) — untouched

### Check 5: Phase-level drift
**NO DRIFT.** Files touched:
- `client/src/pages/sales.tsx` — Phase 4 Sales / Phase 5 Insights overlap (rolled into Wave 3F per `plan.md:38-39`) ✓
- `client/src/pages/insights.tsx` — Phase 5 Insights ✓
- `client/src/App.tsx` — routing only (1-line route addition for an already-named menu item, not new feature)

No Phase 1 (auth), Phase 3 (TeamBox), Phase 6 (Marketing), Phase 7 (Service), or Phase 9 (Management) files touched.

### Check 6: Item 4 revised pick documentation
**DRIFT FOUND — documentation only.**

The wave-bookend (lines 14-15) states:
> "**Item 4 was revised** from B → A post-investigation: grep revealed `/work-center` is labeled 'Hub' in `MobileSidebar.tsx:25` and `settings.tsx:3418` — it's a real intended top-level concept, NOT stale naming. Adding the route (1 LOC) is cleaner and less risky than re-targeting 4 separate link references. **Documented at the head of the picks doc.**"

But the picks doc (`evidence/wave-3F-insights-sales-ui/wave-3F-B-design-gate-questions.md`) still shows at line 13:
> `| 4 — /work-center MobileNavDropdown 404 | **B** — investigate git history for intent, then re-target the 4 link references to the existing route ... | advocate (real defect; mechanical fix; investigation-first) |`

The picks doc was NOT updated to reflect the B→A revision. There is no "Item 4 revised" header at the top of the picks doc. The wave-bookend's claim that the revision was "Documented at the head of the picks doc" is FALSE.

**Severity:** Low. Execution matches Pick A (the revised pick). The audit trail is preserved IN the wave-bookend itself, just not where the wave-bookend says it would be. A future reader looking at the picks doc alone will see "B" and not know about the revision.

**What should happen instead:** Either (a) update the picks doc to show "Item 4 = A (revised post-investigation)" with a note linking to the wave-bookend rationale, or (b) update the wave-bookend's CLOSING to remove the false "Documented at the head of the picks doc" claim and instead link to a separate reconciliation note.

### Check 7: S4 → S5 advocate copy call documentation
**NO DRIFT (with thinness caveat).**

S4's investigation file explicitly classified the defect as "Design — with a mechanical core" and recommended `Defer S5 — escalate` because the subtitle edit ("Win rate by source over last 6 months" → something honest) is a CX/copy call that exceeds the mechanical scope.

S5 was nonetheless applied. The S5 proof (lines 21, 60-62) does document the subtitle change with the new copy "Win rate by lead source (lifetime)" and grounds it in "Wave 1C's lifetime metric doctrine". The S5 proof header (line 4) self-labels: "S5 (conditional fix from S4 finding — operator/advocate authorized inline)".

The advocate copy call IS documented (in S5's proof, per the prompt's "S4 investigation file or in S5's proof" disjunction). However, no separate decision record between S4 and S5 (e.g. an `S4-to-S5-handoff.md`) shows the moment of authorization or the operator-vs-advocate split. The S5 proof asserts the authorization without showing it. Marginal — but per the prompt's bar, this passes.

### Check 8: Anomaly tagging — defects/findings to escalate to a future wave
**NO DRIFT, but two carry-forwards observed:**

1. **S4's Option A title-edit deferred:** S4 noted the card *title* "Source Quality Trends" might also need editing if the chart truly only shows per-source-snapshot (no time dimension). S5 explicitly left the title untouched (S5 proof line 23: `**(d)** Card title 'Source Quality Trends' left untouched (deferred per spec).`). This is a known carry-forward; whether it warrants a future wave is an operator call but it's flagged in S5's proof, satisfying the anomaly-tagging requirement.

2. **S1 secondary references not extended:** `insights.tsx:335` (Win Rate in trend list) was explicitly NOT modified per the wave-bookend's "only user-facing tile labels" rule. The Win Rate at line 335 will continue to render `{convRate}%` raw, including misleading 100%/0% on small samples. This is consistent with the bookend's explicit out-of-scope but is a known follow-up if operators surface confusion later.

Neither of these is drift — both are documented as out-of-scope-by-design.

---

## Verdict summary table

| Drift category | Status |
|---|---|
| 1. Chunk-level scope creep | NO DRIFT |
| 2. Locked-pick drift (execution) | NO DRIFT |
| 3. v2.2-vs-v2.3 drift (no leaderboard) | NO DRIFT |
| 4. Different-wave drift (1C / I-Auth / 2A / 3B/3C / 3A) | NO DRIFT |
| 5. Phase-level drift (1 / 3 / 6 / 9) | NO DRIFT |
| 6. Item 4 revised-pick documentation | **DRIFT** — picks doc not updated as the wave-bookend claims |
| 7. S4 → S5 advocate copy call documentation | NO DRIFT (thin but present in S5 proof) |
| 8. Anomaly tagging | NO DRIFT (carry-forwards documented in S5 proof) |

---

## What should happen

**Recommended remediation (low priority, governance hygiene):**

Either update the picks doc to record the Item 4 B→A revision at its head (matching the wave-bookend's claim), or correct the wave-bookend's CLOSING to remove the false "Documented at the head of the picks doc" sentence and replace it with an explicit reconciliation note pointing to where the revision is recorded.

This is documentation drift, not execution drift. It does NOT block the wave from closing, but it should be acknowledged in the CLOSING bookend so the audit trail is consistent.

---

## Verifier scope (what was NOT audited)

This verdict is drift/boundary detection only. It does NOT replicate the work of:
- `blind-verifier` — proof + evidence + Δ1/Δ2 verification
- `scope-guardian` — file-level scope marker / hook compliance
- `code-reviewer` — code-quality / regression analysis

Each of those should produce its own verdict at `evidence/wave-3F-B-insights-sales-ui/verifier-audit/`.
