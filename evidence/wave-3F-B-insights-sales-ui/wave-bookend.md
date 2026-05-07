# Wave Bookend — 3F-B — Insights/Sales UI design-gate execution

## OPENING

**Wave:** 3F-B (operator design-gate execution sub-wave of Wave 3F)
**Phase:** 5 — Insights + Reports + Metrics
**Date opened:** 2026-05-07
**Goal (plain English, 1 sentence):** Execute the 6 locked picks from `evidence/wave-3F-insights-sales-ui/wave-3F-B-design-gate-questions.md` (Item 1, 4, 5, 6 are code chunks; Items 2 and 3 are no-action) — small-denominator confidence rendering, `/work-center` mobile-nav 404 fix, "Top Performing Agents" rename, and Source Quality Trends investigate-then-fix.
**Why necessary for v2.2 release:** Closes out the Wave 1C E2E follow-ups that needed operator design/CX/product input; Item 4 is a real mobile-nav defect (4 broken sub-links); Item 1 prevents misleading 100% rendering on small samples; Item 6 clarifies surface scope without inventing a new feature.

### Locked picks reference

`evidence/wave-3F-insights-sales-ui/wave-3F-B-design-gate-questions.md` — operator answered Item 6 (A — rename), advocate called Items 1-5.

**Item 4 was revised** from B → A post-investigation: grep revealed `/work-center` is labeled "Hub" in `MobileSidebar.tsx:25` and `settings.tsx:3418` — it's a real intended top-level concept, NOT stale naming. Adding the route (1 LOC) is cleaner and less risky than re-targeting 4 separate link references. Documented at the head of the picks doc.

### Existing evidence to reuse

- `evidence/wave-1C-comprehensive-e2e/` — Wave 1C E2E that surfaced all 6 items
- `evidence/wave-1C-metric-honesty/wave-bookend.md` — em-dash honesty doctrine
- `evidence/wave-3F-insights-sales-ui/wave-bookend.md` — Wave 3F-A (mechanical close) precedent
- `evidence/wave-3F-insights-sales-ui/wave-3F-B-design-gate-questions.md` — locked picks
- Wave 3F-A's S1 fix already exists at `sales.tsx:129` — null guard. 3F-B's S1 ADDS the n<20 threshold on top.

### Current status of this component

PARTIAL — `/sales` and `/insights` render, but small-sample 100%/0% misleading rates persist; mobile menu has 4 broken `/work-center` sublinks; "Top Performing Agents" heading is ambiguous (AI-only).

### In scope

**Chunk S1 — Item 1 — Em-dash threshold on n<20 for Conversion Rate + Win Rate**

- File: `client/src/pages/sales.tsx` (Conversion Rate tile at sm-7, line ~129)
- File: `client/src/pages/insights.tsx` (Win Rate tile at sc-1, line ~262 + secondary references at 335, 1048, 1085, 2050, 2101 — but only the user-facing tile labels need the threshold; chart-data points stay raw)
- Threshold: when `n < 20` (where `n` is the denominator: `wins + losses` for win rate, equivalent for conversion rate), render `'—'` instead of the percentage
- Builder must trace where `convRate` and `summary.conversionRate` come from to identify the denominator field. Add a small helper (e.g. `confidentRate(rate, n)`) if reuse simplifies — but keep it inline if a single-call approach reads cleaner.
- Wave 3F-A's existing null guard on `sales.tsx:129` stays; this chunk extends it to also handle `n<20` not just `null`.

**Chunk S2 — Item 4 — Add `/work-center` route in App.tsx**

- File: `client/src/App.tsx` (route table around lines 67-82)
- Add: `<Route path="/work-center" component={MyWorkPage} />` (or whichever existing component is the closest semantic match — builder picks among `MyWorkPage`, `TeamboxPage` based on what the 4 sublinks `?tab=calendar|leads|inbox` and `/work-center/tasks` most naturally read as)
- The 4 sublinks in `MobileNavDropdown.tsx:58-60` will then 200 (the page they target ignores `?tab=*` query params if not handled, which is acceptable — the menu link-target stops 404ing).
- Verification: mobile menu can navigate to `/work-center?tab=*` URLs without 404.
- DO NOT modify `MobileNavDropdown.tsx`, `MobileSidebar.tsx`, `settings.tsx`, or `notification-utils.ts` — they're already correctly referencing `/work-center`. Just the route needs to exist.

**Chunk S3 — Item 6 — Rename "Top Performing Agents" → "Top Performing AI Agents"**

- File: `client/src/pages/sales.tsx:635` (CardTitle text)
- One string change. If grep finds additional occurrences in any other file, those rename too.
- Operator-locked: this is the **only** UI scope change explicitly approved by operator at design-gate; the rename is the entire scope of this chunk.

**Chunk S4 — Item 5 — Source Quality Trends investigation (read-only)**

- Investigation chunk only. No code change in S4.
- Files to read: `client/src/pages/insights.tsx` (Source Quality Trends section) + any chart-rendering subcomponents
- Goal: identify the SPECIFIC visual defect surfaced as "polish" in Wave 1C (chart axis cuts off? legend overlapping? colors illegible? data missing? something else?)
- Output: `evidence/wave-3F-B-insights-sales-ui/chunk-S4/source-quality-investigation.md` with:
  - The actual defect description (one paragraph)
  - Screenshots from current dev showing the problem
  - 2-3 fix options (mechanical / design / "real fix needs more info")
  - Recommended fix scope
- Conditional S5: IF S4 finds a clear mechanical defect (e.g. truncation due to a CSS bug, missing axis label, etc.), builder applies the fix as `chunk-S5` in the SAME wave. IF S4 finds a defect requiring design judgment, escalate to a future wave with operator input — do NOT apply a guess fix.

### Out of scope (explicit)

- Item 2 (`/sales/leads` 404) — operator-delegated decision is "leave as 404, no defect."
- Item 3 (`/widget-landing` 404) — same: leave.
- ANY new visual element (badges, tooltips, banners) on Conversion/Win Rate beyond the em-dash threshold — operator picked Option B (em-dash) for Item 1, NOT Option A (badge).
- ANY net-new component, page, or route beyond the `/work-center` route addition.
- ANY change to server-side metric computation, schema, migrations, DB writes.
- ANY provider sends.
- Building a "Top Performing Reps" (human leaderboard) section — operator picked A (rename only); B was deferred to v2.3.

### Operator decisions required BEFORE autonomy starts

NONE. All 6 items are locked. Sub-decisions inside chunks (e.g. which existing component to map `/work-center` to) are advocate calls.

### Credentials / accounts / allowlists required

- Read-only login as `serra_honda@huminic.ai` for Δ2 Playwright walk

### Provider-send approvals required

NONE. No outbound sends.

### UI scope markers required

- `.claude/state/scope/sales.tsx.ok` — for S1 + S3 (same file)
- `.claude/state/scope/insights.tsx.ok` — for S1
- `.claude/state/scope/App.tsx.ok` — for S2
- S4 is investigation-only; no scope marker
- S5 (conditional) markers depend on the defect found

All these files are pre-approved per CLAUDE.md `metric revision` UI category.

### Files likely touched

- `client/src/pages/sales.tsx` (S1 threshold + S3 rename)
- `client/src/pages/insights.tsx` (S1 threshold)
- `client/src/App.tsx` (S2 route addition)
- (S5 conditional) — depends on S4 finding
- `evidence/wave-3F-B-insights-sales-ui/chunk-S1/`, `chunk-S2/`, `chunk-S3/`, `chunk-S4/` (NEW)
- `evidence/wave-3F-B-insights-sales-ui/wave-bookend.md` (this file)
- `evidence/wave-3F-B-insights-sales-ui/verifier-audit/` (3 verifier verdicts)

### Git branch / worktree strategy

- Wave branch: `wave/5-insights/3F-B-design-gate` off `batch-1-finish-line` (HEAD `5380fef`)
- Builder uses isolated worktree off `origin/main` (runtime constraint); orchestrator cherry-picks chunk SHAs onto wave branch
- ff-only merge wave/5-insights/3F-B-design-gate → batch-1-finish-line at CLOSING
- Push batch-1-finish-line to origin (Coolify watches `main`, not this branch — no auto-deploy)

### Agent-team roster

- `team-lead` (orchestrator)
- isolated `Agent` builder (general-purpose, worktree-isolated) — sequential S1→S2→S3→S4 (and conditional S5)

### Isolated audit subagents (gate-only, no team mailbox)

- `blind-verifier` (general-purpose)
- `scope-guardian` (subagent type)
- `drift-detector` (general-purpose)

### Stop conditions (explicit)

- ANY edit beyond the declared files (S1 only `sales.tsx` + `insights.tsx`; S2 only `App.tsx`; S3 only `sales.tsx` ~line 635; S4 read-only) — STOP, escalate
- ANY new UI element beyond the locked picks (no badges, no tooltips, no banners) — STOP
- ANY S4 finding that requires design judgment — STOP, escalate
- ANY tsc / vitest failure that can't trace to a typo — STOP, escalate
- ANY taste/CX call needed beyond locked picks — STOP

### Chunk list

- **S1** — Em-dash threshold on n<20 for `sales.tsx` Conv Rate + `insights.tsx` Win Rate
- **S2** — Add `/work-center` route in `App.tsx` (mapped to existing component; builder picks closest semantic match)
- **S3** — Rename "Top Performing Agents" → "Top Performing AI Agents" in `sales.tsx:635`
- **S4** — Source Quality Trends investigation (read-only)
- **S5 (conditional)** — Mechanical fix from S4 finding, only if defect is unambiguously mechanical

### Proof required (two deltas, per CLAUDE.md TESTING_DOCTRINE)

- **Δ1** — `npx tsc --noEmit` PASS + `npx vitest run tests/unit/` PASS on wave branch HEAD post-chunks (target: 459/2 baseline maintained)
- **Δ2** — Playwright walk on dev (after build + pm2 restart):
  - `/sales` Conversion Rate tile: shows real number OR em-dash on small sample
  - `/insights` Win Rate tile: shows real number OR em-dash on small sample
  - `/sales` Top Performing AI Agents heading present (renamed)
  - Mobile menu can navigate `/work-center?tab=*` without 404 (verify `/work-center` route returns 200, even if it renders the chosen existing component)
  - S4 finding screenshot if applicable
  - Zero console errors
  - All API calls ≤ 200

### Expected evidence path

- `evidence/wave-3F-B-insights-sales-ui/chunk-S1/` (S1 evidence)
- `evidence/wave-3F-B-insights-sales-ui/chunk-S2/` (S2 evidence)
- `evidence/wave-3F-B-insights-sales-ui/chunk-S3/` (S3 evidence)
- `evidence/wave-3F-B-insights-sales-ui/chunk-S4/` (S4 investigation finding)
- `evidence/wave-3F-B-insights-sales-ui/chunk-S5/` (S5 evidence; conditional)
- `evidence/wave-3F-B-insights-sales-ui/verifier-audit/` (3 verifier verdicts)
- `evidence/wave-3F-B-insights-sales-ui/wave-bookend.md` (this file: OPENING + CLOSING)

---

## CLOSING (audited 2026-05-07)

**Closed:** 2026-05-07
**Wave-level verdict:** **PASS — all 6 locked picks resolved.** Items 1, 4, 5, 6 implemented as code changes (S1, S2, S3, S5); Item 5 surfaced a real chart defect via S4 investigation and was fixed in S5 with advocate-decided copy ("Win rate by lead source (lifetime)"); Items 2 and 3 confirmed no-action. Item 4 was revised B→A post-investigation (`/work-center` is labeled "Hub" in `MobileSidebar.tsx:25` + `settings.tsx:3418` — real intended top-level concept, so adding the route is cleaner than re-targeting 4 sublinks). Documentation drift caught by drift-detector and remediated this turn (picks-doc Item-4 row updated to A with revision note).

### Wave history (linear, all on `wave/5-insights/3F-B-design-gate`)

| SHA | Commit |
|---|---|
| `5380fef` | (base) `docs(wave-3F-B): lock operator+advocate picks` — pre-Wave-3F-B tip of `batch-1-finish-line` |
| `e256029` | `fix(metrics): em-dash on small-denominator (n<20) Conv/Win Rate tiles (Chunk 3F-B-S1)` |
| `50431d9` | `fix(routing): add /work-center route (mapped to MyWorkPage) — closes mobile-nav 404 (Chunk 3F-B-S2)` |
| `5e6ed61` | `fix(insights): rename 'Top Performing Agents' to 'Top Performing AI Agents' (Chunk 3F-B-S3)` |
| `1b1f495` | `evidence(wave-3F-B): Chunks S1-S4 proofs + S4 Source Quality Trends investigation (READ-ONLY)` |
| `9ddefa6` | `fix(insights): repair broken Source Quality Trends chart + honest subtitle (Chunk 3F-B-S5)` |
| `be3502f` | `evidence(wave-3F-B): Chunk S5 proof` |
| (next) | `evidence(wave-3F-B): Δ2 PASS + CLOSING bookend + 3 verifier verdicts + Item-4 picks-doc revision` |

Aggregate: 4 product-code chunks + 1 read-only investigation / +13/-9 product / 6 commits + 1 closing-evidence commit.

### Two deltas of proof — captured

| Delta | Type | Result | Evidence |
|---|---|---|---|
| **Δ1** | runnable test | PASS | `npx tsc --noEmit` exit 0 + `npx vitest run tests/unit/` 459 passed / 2 skipped on wave HEAD `be3502f`. Reproduced by blind-verifier independent re-run. |
| **Δ2** | Playwright runtime walk | PASS | qa-evaluator dispatched Playwright MCP from `http://localhost:5000/login` → login as `serra_honda@huminic.ai` → `/sales` + `/insights` + `/work-center` + `/work-center?tab=calendar`. All HTTP 200; zero `null%` matches; zero console errors; zero 4xx/5xx network responses. **Sales Conversion Rate tile rendered `—` (em-dash; small-denominator threshold engaged).** **Insights Win Rate tile rendered `1.4%` (n=508; above threshold).** **Source Quality Trends chart now plots ONE blue Line across 9 real lead-source X-axis ticks** (peak ~16, dip ~0) — fixed from the prior 5-flat-lines defect. **"Top Performing AI Agents" heading present; old "Top Performing Agents" wording absent.** **`/work-center` returns 200** (both bare and `?tab=calendar` variants). |

Δ2 evidence files:
- `chunk-S1/sales-post-fix.png` — full-page screenshot of `/sales` post-fix
- `chunk-S1/insights-post-fix.png` — full-page screenshot of `/insights` post-fix
- `chunk-S1/post-fix-console.txt` — console log capture (zero errors)
- `chunk-S1/post-fix-network.txt` — network capture (all ≤ 200)
- `chunk-S2/work-center-post-fix.png` — `/work-center` route renders MyWorkPage
- `chunk-S5/source-quality-post-fix.png` — Source Quality Trends chart close-up showing single Line with real data
- `chunk-S5/post-fix-walk-summary.md` — synthesized walk summary

### Audit chain (3 blind verifiers at gate, all PASS)

| Verifier | Type | Verdict | Evidence |
|---|---|---|---|
| `blind-verifier` (general-purpose) | subagent at gate | **AGREE** — all 9 independent checks PASS; primary evidence cited per check | `verifier-audit/blind-verifier-verdict.md` |
| `scope-guardian` (subagent type) | subagent at gate | **PASS** — 3 product files in declared scope (`sales.tsx`, `insights.tsx`, `App.tsx`) + evidence dir; zero out-of-scope; zero schema/migration/provider-send/live-deploy actions; per-file UI scope markers documented per chunk | `verifier-audit/scope-guardian-verdict.md` |
| `drift-detector` (general-purpose) | subagent at gate | **DRIFT FOUND** (low-severity, doc-only — picks-doc Item 4 row not updated to reflect B→A revision; **FIXED THIS TURN** as part of CLOSING). Code execution NO DRIFT across all 5 chunks (Phases 1/3/6/9 untouched, other waves untouched, no v2.3 component leak). | `verifier-audit/drift-detector-verdict.md` |

Independent re-checks during blind verification confirmed:
- S1: combined null + n<20 threshold present at sales.tsx:129 and insights.tsx:262 (sc-1 tile)
- S2: single line `<Route path="/work-center" component={MyWorkPage} />` added in App.tsx; MyWorkPage import already present
- S3: zero remaining `Top Performing Agents` strings without `AI` prefix in `client/src`
- S4 → S5: orchestrator's advocate copy call documented in S5 proof; subtitle change exact ("Win rate by lead source (lifetime)")
- S5: 5 broken Line components collapsed to 1 with `dataKey="winRate"`; X-axis dataKey changed to `source` (data-mapping field renamed `month → source` at line 311 — smallest-blast-radius internally-consistent fix); card title `"Source Quality Trends"` UNCHANGED (deferred polish)
- Δ1 reproduces exactly: tsc exit 0, vitest 459/2

### Picks-doc revision (drift-detector remediation)

Updated `evidence/wave-3F-insights-sales-ui/wave-3F-B-design-gate-questions.md` Item 4 row from B → A with revision note: `revised B→A 2026-05-07 post-investigation; \`/work-center\` labeled "Hub" in \`MobileSidebar.tsx:25\` and \`settings.tsx:3418\` — real intended top-level concept; 1-line route addition is lower-risk than re-targeting 4+ sublinks`. The wave-bookend's earlier reference to "Documented at the head of the picks doc" is now accurate.

### Stop conditions — all PASS

- Zero edits outside declared scope (3 product files + evidence dir)
- Zero new visual elements (no badges, no tooltips, no banners) — operator picked Option B em-dash for Item 1
- Zero server-side computation changes
- Zero new files outside declared evidence dirs
- Zero DB writes / schema changes / migrations
- Zero provider sends (Resend / TextMagic / VAPI / Tavus / FlexPrice / SignalWire)
- Zero pm2 restart on `live.huminic.app` (Coolify untouched; live still on `becb739`)
- Dev pm2 `nexxus-app` restart count `87` (one restart this wave for Δ2 walk; HTTP 200 confirmed; PID 2950179)
- No commits to `batch-1-finish-line` direct or to `main`
- No force pushes / `git rebase -i` / destructive resets
- No human-rep leaderboard component added (operator-locked v2.3 deferral)

### Item-by-item resolution (for the locked picks)

| Item | Pick | Outcome |
|---|---|---|
| 1 — Conv rate small-denominator | B (em-dash on n<20) | DONE — sales.tsx + insights.tsx tiles |
| 2 — `/sales/leads` 404 | A (leave) | NO ACTION (correct; no internal links exist) |
| 3 — `/widget-landing` 404 | A (leave) | NO ACTION (correct; only ES-module import) |
| 4 — `/work-center` mobile 404 | A (add route, revised B→A) | DONE — single-line route addition |
| 5 — Source Quality Trends polish | A → mechanical fix | DONE — investigation + chart fix + subtitle |
| 6 — Top Performing Agents | A (rename only) | DONE — sales.tsx CardTitle |

### Cross-references

- `evidence/wave-3F-insights-sales-ui/` — Wave 3F-A (mechanical close) precedent
- `evidence/wave-3F-insights-sales-ui/wave-3F-B-design-gate-questions.md` — locked picks (with Item 4 revision note)
- `evidence/wave-1C-comprehensive-e2e/` — Wave 1C E2E that surfaced these items
- `evidence/wave-1C-metric-honesty/` — em-dash honesty doctrine

### Carried-forward / future-wave items

- Source Quality Trends card title `"Source Quality Trends"` could be renamed (e.g. `"Source Quality (lifetime)"`) for full title-subtitle consistency. Deferred to a future polish wave.
- Wave 3F-B Item 6 path B (separate "Top Performing Reps" human-rep leaderboard section) — deferred to v2.3 per operator decision.
- Worktree cleanup: a leftover `worktree-agent-a7cbfc4e66f52aa8f` worktree branch contains sibling-duplicate commits from the 3F-B builder dispatch; safe to delete post-merge (non-blocking; flagged by scope-guardian).

### Merge sequence (executed by orchestrator after CLOSING commit)

1. `git checkout batch-1-finish-line && git merge --ff-only wave/5-insights/3F-B-design-gate` (integration on dev; no live impact)
2. `git push origin batch-1-finish-line` (durable backup; Coolify watches `main`, not this branch — no auto-deploy)
3. **Live deploy: deferred to Wave 11A release-cycle gate** (per release-cycle pattern; not closed at any single wave)

### Next-wave readiness

- **YES** — Wave 2A (provider-proof) is independent and can run.
- **YES** — Wave 11-Gov (harness session-marker fix + console-error finding) is independent.
- **YES** — Wave 9-Sec triage (operator decision required to open).
- **YES** — Wave 3A/3B/3C (UI scope-marker waves) — TeamBox / Marketing routing fixes.
- Wave 3F is functionally CLOSED at the operator-locked-picks scope. Any further Insights/Sales polish goes to future waves (3C, post-launch polish, or v2.3).

