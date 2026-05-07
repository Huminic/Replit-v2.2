# Wave Bookend — 3F-A — Insights/Sales UI mechanical follow-ups (NULL-GUARD + 404 TRIAGE)

## OPENING

**Wave:** 3F-A (mechanical sub-wave of Wave 3F)
**Phase:** 5 — Insights + Reports + Metrics
**Date opened:** 2026-05-07
**Goal (plain English, 1 sentence):** Fix the two mechanical UX defects surfaced by Wave 1C's comprehensive E2E (the `null%` defensive-guard miss in `/sales` and the broken-link 404s for `/sales/leads` and `/widget-landing`) without making any taste/design/CX decisions; defer those to Wave 3F-B.
**Why necessary for v2.2 release:** Wave 1C's null-shape API can produce `null` for `conversionRate` when small-denominator data hits the new lib-8 lifetime branch; without the guard the UI would render the literal string `null%` to dealership users. The 404 triage closes Wave 1C's "discoverability" follow-up. Both items are pre-approved as `metric revision` UI changes per CLAUDE.md.

**Scope split announced:**
- **3F-A (this wave, autonomous):** S1 null guard + S2 404 triage — mechanical only
- **3F-B (deferred, operator design-gate):** denominator-confidence rendering, Source Quality Trends chart polish, Top Performing Agents human-rep leaderboard scope — taste/design/product decisions surfaced for operator input

### Existing evidence to reuse

- `evidence/wave-1C-comprehensive-e2e/wave-1C-runtime-matrix.md` — surfaces the `null%` defensive-guard miss and the two 404s
- `evidence/wave-1C-comprehensive-e2e/feature-map.md` — DOM crawl
- `client/src/App.tsx:41-82` — known route table (verified 2026-05-07: no `/widget-landing` route, no `/sales/leads` route)
- `client/src/pages/sales.tsx:103-131` — `buildSalesMetrics` with the bare interpolation at `:129`

### Current status of this component

PARTIAL — `/sales` and `/insights` render correctly under typical data, but defensive paths and discoverability have known gaps from Wave 1C's E2E.

### In scope (3F-A)

**Chunk S1 — null guard at sales.tsx:129**
- Edit `client/src/pages/sales.tsx` line 129: replace `\`${summary.conversionRate}%\`` with a null-tolerant expression that renders `'—'` (em-dash) when `summary.conversionRate == null`. Reasoning: `0%` would be dishonest math (claims "0% conversion" when truth is "no data"); `—` is the project's honest-no-data convention and matches the metric-honesty doctrine established in Wave 1C.
- The `change: null` and `trend: 'up'` already account for null-delta; no other field needs change.
- File: `client/src/pages/sales.tsx` (one line; surrounding context-only edits permitted to keep TypeScript clean — e.g., extracting an inline ternary or const).

**Chunk S2 — 404 triage**
- READ-ONLY investigation phase first: grep `client/src/` for string literals matching `/sales/leads` and `/widget-landing` (e.g., menu link `href`, `Link to=`, `setLocation`, `navigate`, hard-coded URLs in tooltips/modals).
- Classify each hit:
  - (a) **mechanical-fix-link** — UI link points to a path that doesn't exist; either fix the link to point at the correct existing path or remove the link.
  - (b) **mechanical-add-route** — link is intentional but the route was forgotten; add the route.
  - (c) **product-decision** — link is intentional, route is intentional, but the page behind it isn't built. → ESCALATE to Wave 3F-B; do NOT add a placeholder.
- Execute (a)/(b) fixes inside this chunk. Defer (c) to 3F-B.
- Files likely touched: `client/src/components/layout/sidebar.tsx`, `client/src/components/navigation/*`, or wherever the offending links live. Discovered during S2 investigation.

### Out of scope (explicit)

- ANY taste/design/CX decision (denominator-confidence rendering, chart polish, leaderboard scope) — those are Wave 3F-B.
- ANY change to server-side metric computation — Wave 1C closed that.
- ANY new UI component (cards, dialogs, modals, charts) — only string-literal / interpolation / link-target fixes.
- ANY route addition unless the investigation in S2 finds clear "link-with-no-route" intent.
- ANY change to existing route guards / RBAC / `ProtectedRoute` wrapping.
- Schema, migrations, DB writes.
- Provider sends.

### Known defects this wave fixes

- Wave 1C E2E follow-up: `null%` rendering risk at sales.tsx:129
- Wave 1C E2E follow-up: `/sales/leads` 404
- Wave 1C E2E follow-up: `/widget-landing` 404 (note: `/w/:slug` and `/p/:slug` are the correct widget routes — `/widget-landing` is not wired)

### Operator decisions required BEFORE autonomy starts

NONE for 3F-A. The mechanical-fix categories sit inside the pre-approved `metric revision` UI category per CLAUDE.md. Per-file scope markers will be created autonomously for the files touched.

### Credentials / accounts / allowlists required

- Read-only login as `serra_honda@huminic.ai` for Δ2 Playwright walk.

### Provider-send approvals required

NONE. No outbound sends in 3F-A.

### UI scope markers required

- `.claude/state/scope/sales.tsx.ok` — for S1
- S2 markers depend on investigation; created as files are identified. Documented in S2 chunk evidence at creation time.

### Files likely touched

- `client/src/pages/sales.tsx` (S1)
- One or more of: `client/src/components/layout/sidebar.tsx`, `client/src/components/navigation/*`, or other link sources (S2; discovered during investigation)
- `evidence/wave-3F-insights-sales-ui/chunk-S1/` and `chunk-S2/` (NEW)
- `evidence/wave-3F-insights-sales-ui/wave-bookend.md` (this file)
- `evidence/wave-3F-insights-sales-ui/verifier-audit/` (3 verifier verdicts)

### Git branch / worktree strategy

- Wave branch: `wave/5-insights/3F-A-mechanical` off `batch-1-finish-line` (HEAD `068aaa7`)
- Teammate runner uses isolated worktree off `origin/main` (runtime constraint); orchestrator cherry-picks chunk SHAs onto wave branch off `batch-1-finish-line` (established Wave 1C pattern)
- ff-only merge `wave/5-insights/3F-A-mechanical` → `batch-1-finish-line` at CLOSING
- Push `batch-1-finish-line` to origin (Coolify watches `main`, not this branch — no auto-deploy)

### Agent-team roster

- `team-lead` (orchestrator) — me
- `release-builder` (teammate) — Wave 3F-A active runner; spawned at chunk start

### Isolated audit subagents (gate-only, no team mailbox)

- `blind-verifier` (general-purpose) — independent re-check of teammate's claims; cites primary evidence only
- `scope-guardian` (subagent type) — file-level scope drift check
- `drift-detector` (general-purpose) — hierarchy-level drift (Wave/Chunk boundaries)

### Stop conditions (explicit)

- ANY edit to a file outside the declared S1/S2 scope → STOP, flag, escalate.
- ANY taste/design decision needed → STOP, escalate to Wave 3F-B.
- ANY change to server-side metric computation → STOP (Wave 1C territory).
- ANY new file outside `evidence/wave-3F-insights-sales-ui/` and the declared edit targets → STOP.
- ANY DB write, schema change, provider send → STOP.
- ANY pm2 restart on live → STOP. Dev rebuild only when needed for Δ2 walk and only with `# APPROVED:` suffix per CLAUDE.md.

### Chunk list

- **Chunk S1** — null guard at sales.tsx:129 (mechanical, ~1-3 LOC change).
- **Chunk S2** — 404 triage: investigate, classify, mechanical-fix where (a)/(b), escalate (c) to 3F-B.

### Proof required (two deltas, per CLAUDE.md TESTING_DOCTRINE)

- **Δ1** — `npx tsc --noEmit` PASS + `npx vitest run tests/unit/` PASS on wave branch HEAD post-chunks.
- **Δ2** — Playwright walk on dev:
  - `/sales` page renders without `null%` literal in DOM (test with current data; document that null-state is data-gated and may not be observable today, but the source change is verifiable by code-reviewer)
  - Each previously-broken link target verified: either the link is gone, or the link now points at a working route, or the link is documented as escalated to 3F-B
  - PNG screenshots committed; `git add -f` per project convention (.gitignore overrides PNG rule for evidence)

### Expected evidence path

- `evidence/wave-3F-insights-sales-ui/chunk-S1/` (S1 evidence)
- `evidence/wave-3F-insights-sales-ui/chunk-S2/` (S2 investigation + fixes)
- `evidence/wave-3F-insights-sales-ui/verifier-audit/` (3 verifier verdicts)
- `evidence/wave-3F-insights-sales-ui/wave-bookend.md` (this file: OPENING + CLOSING)

---

## CLOSING (audited 2026-05-07)

**Closed:** 2026-05-07
**Wave-level verdict:** **PASS — mechanical sub-wave complete.** Chunk S1 (defensive null guard at `client/src/pages/sales.tsx:129`) shipped; Chunk S2 (404 triage for `/sales/leads` and `/widget-landing`) classified as investigation-only — both URLs are category (c) product-decisions and escalated to Wave 3F-B with no internal-link defects to fix. Bonus finding (MobileNavDropdown.tsx:55-60 `/work-center` link with no registered route) also escalated to 3F-B, not silently fixed.

### Wave history (linear, all on `wave/5-insights/3F-A-mechanical`)

| SHA | Commit |
|---|---|
| `068aaa7` | (base) `issues(wave-I-auth)` — pre-Wave-3F-A tip of `batch-1-finish-line` |
| `834fecb` | `fix(sales): defensive null guard at conversionRate render (Chunk 3F-A-S1)` |
| `a1686d1` | `evidence(wave-3F-A): Chunk S1 proof + S2 404 triage (S2 investigation-only)` |
| (next) | `evidence(wave-3F-A): Δ2 PASS + CLOSING bookend + verifier verdicts` |

Aggregate: 1 product-code line + bookend/evidence / +1/-1 product / 2 commits + 1 closing-evidence commit.

### Two deltas of proof — captured

| Delta | Type | Result | Evidence |
|---|---|---|---|
| **Δ1** | runnable test | PASS | `npx tsc --noEmit` exit 0 + `npx vitest run tests/unit/` 459 passed / 2 skipped on wave HEAD `a1686d1`. Confirmed by blind-verifier independent re-run. |
| **Δ2** | Playwright runtime walk | PASS | qa-evaluator dispatched Playwright MCP from `http://localhost:5000/login` → login as `serra_honda@huminic.ai` → `/sales` → screenshot + DOM snapshot + console + network capture. Conversion Rate tile (`metric-value-sm-7`) renders `100%` (truthy branch); zero `null%` substring matches; zero console errors; all 24 API calls ≤ 200. Cross-check on `/insights` shows 1.4%/1.4% values + zero `null%`/`>null<`/`NaN%` matches. |

Δ2 evidence: `chunk-S1/sales-post-fix.png`, `chunk-S1/sales-post-fix-dom-summary.md`, `chunk-S1/sales-post-fix-console.txt`, `chunk-S1/sales-post-fix-network.txt`.

### Audit chain (3 blind verifiers at gate, all PASS)

| Verifier | Type | Verdict | Evidence |
|---|---|---|---|
| `blind-verifier` (general-purpose) | subagent at gate | **AGREE** — all 5 independent checks PASS | `verifier-audit/blind-verifier-verdict.md` |
| `scope-guardian` (subagent type) | subagent at gate | **PASS** — 3 files changed, all in declared scope; zero out-of-scope files; zero direct commits to `batch-1-finish-line`; zero DB/provider/pm2-live activity | `verifier-audit/scope-guardian-verdict.md` |
| `drift-detector` (general-purpose) | subagent at gate | **NO DRIFT** — all 6 hierarchy boundary checks PASS; em-dash conformance with Wave 1C honesty doctrine, not a fresh taste decision | `verifier-audit/drift-detector-verdict.md` |

Independent re-checks during blind verification confirmed:
- S1 diff is exactly one line (1 insertion, 1 deletion) at `sales.tsx:129`
- S2 grep results match triage table (0 hits `/sales/leads`, 1 hit `/widget-landing` — ES-module import only)
- MobileNavDropdown `/work-center` finding is real (3 nav files reference it; not registered in `App.tsx`)
- Δ1 reproduces exactly: tsc exit 0, vitest 459/2
- OPENING bookend was authored ~5 min before first chunk commit (no fake chronology)

### Stop conditions — all PASS

- Zero edits outside declared scope (`client/src/pages/sales.tsx` + `evidence/wave-3F-insights-sales-ui/`)
- Zero taste/design decisions made; em-dash choice is pre-existing honesty doctrine from Wave 1C
- Zero server-side metric computation changes
- Zero new files outside declared evidence dirs and the one product file
- Zero DB writes / schema changes / migrations
- Zero provider sends (Resend / TextMagic / VAPI / Tavus / FlexPrice)
- Zero pm2 restart on `live.huminic.app` (Coolify untouched; live still on `becb739`)
- Dev pm2 `nexxus-app` restart count `86` (one restart this wave for Δ2 walk; HTTP 200 confirmed; uptime continuing)

### Wave 3F-B — items deferred for operator design-gate

These were INVESTIGATED in Wave 3F-A but require operator design/CX/product input to resolve:

1. **Conv Rate `100%` on small denominators is honest math but visually misleading.** Wave 3F-B should pick a confidence-rendering treatment ("low confidence" badge, faded text, "—" with tooltip, "N/A" pattern, etc.). Advocate has a draft recommendation; will be presented at 3F-B OPENING.
2. **`/sales/leads` 404** — no internal links target this path; URL must be (a) leftover from a removed feature, (b) intended-but-unbuilt, or (c) typo of an intended URL. Operator picks: add page, add redirect to `/sales`, or leave as 404.
3. **`/widget-landing` 404** — only ES-module import in `App.tsx:25` references this name; no nav link; correct widget routes are `/w/:slug` and `/p/:slug`. Operator picks: rename file (cosmetic), add redirect, or leave.
4. **MobileNavDropdown.tsx `/work-center` link with no registered route** — bonus finding from S2; surfaces a 404 risk on mobile. Either add `/work-center` route (it's referenced as the menu's "Work Center" tab) or fix the link target.
5. **Source Quality Trends chart-render polish** (carried from Wave 1C E2E follow-ups).
6. **Top Performing Agents — AI-only vs human-rep leaderboard scope** (carried from Wave 1C).

### Cross-references

- `evidence/wave-1C-comprehensive-e2e/wave-1C-runtime-matrix.md` — Wave 1C E2E that surfaced these items
- `evidence/wave-1C-metric-honesty/wave-bookend.md` — Wave 1C metric-honesty doctrine (em-dash convention)
- `client/src/pages/sales.tsx:129` — the fix
- `evidence/wave-3F-insights-sales-ui/chunk-S2/triage.md` — full S2 classification table

### Merge sequence (executed by orchestrator after CLOSING commit)

1. `git checkout batch-1-finish-line && git merge --ff-only wave/5-insights/3F-A-mechanical` (integration on dev; no live impact)
2. `git push origin batch-1-finish-line` (durable backup; Coolify watches `main`, not this branch — no auto-deploy)
3. **Live deploy: deferred to Wave 11A release-cycle gate** (per session-output handoff; not closed at any single wave)

### Next-wave readiness

- **YES** — Wave 3F-B (operator design-gate for the 6 deferred items above) is the natural follow-up; opens with operator decisions per item.
- **YES** — Wave 2A (provider-proof) is independent and can run in parallel.
- **YES** — Wave 11-Gov (harness session-marker fix + console-error finding D-I3) is independent.

