# Wave 1C — aggregated verifier verdicts + merge gate

**Aggregation timestamp:** 2026-05-07T02:08:30Z
**Code under test:** wave/5-insights/1C-metric-honesty HEAD `f024271`
**Pm2 nexxus-app:** uptime preserved across all walks; restarts unchanged at 85
**Walk topology:** original E2E walk (01:50-01:59 UTC) → independent verifier (02:05-02:08 UTC) → scope-guardian (separate session)

## Verdict matrix

| Verifier role | Subject | Verdict | Evidence file |
|---|---|---|---|
| nexxus-e2e-evaluator (original) | Comprehensive E2E (DOM crawl + feature map + 10 workflows + Wave 1C runtime matrix) | WAVE 1C SAFE TO MERGE | `routes/routes-index.md`, `feature-map/feature-map.md`, `workflows/workflows-summary.md`, `verification-matrix/wave-1C-runtime-matrix.md`, `console-network/health-summary.md` |
| independent-verifier (this audit) | Re-check load-bearing claims (S1-S5, role-routing, /management redirect, /sales/leads 404, Activity 50-row count) | APPROVED with two test-file remediations | `verifier-audit/independent-verifier-verdict.md` |
| scope-guardian (parallel) | Out-of-scope writes, file-scope drift, pm2 integrity | MOSTLY YES — one minor reversible drift | `verifier-audit/scope-guardian-verdict.md` |

## Wave 1C chunk-level verdicts (final, post-verification)

| Chunk | Original verdict | Independent re-check | Final |
|---|---|---|---|
| S1 (drop `trend: "flat"`) | PASS | CONFIRMED — `hasFlat=0` on /insights | **PASS** |
| S2 (entityType filter) | PASS | CONFIRMED — 50 rows, zero `sync_*` independently counted | **PASS** |
| S3 (conversionRate null-on-empty) | PASS | CONFIRMED on Cage Automotive directly; serra_honda=100% via re-opened screenshot | **PASS** |
| S4 (sales-only predicate UPSTREAM) | INDIRECTLY PROVEN | CONFIRMED at observed-value level (508/7) | **INDIRECTLY PROVEN** |
| S5 (lib-8 lifetime win rate) | PASS | CONFIRMED — Win Rate=1.4% (= 7/508) | **PASS** |
| S6 (test housekeeping) | COVERED | ACCEPTED transitive | **COVERED** |

## Pillars of proof (operator-facing summary)

**Pillar 1 — Server-side metric correctness:** wave-bookend Δ1 (Resend dry-run, 2026-05-06) + wave-bookend Δ2 (Playwright walk, 2026-05-06). Already on disk: `evidence/wave-1C-metric-honesty/wave-proof/`.

**Pillar 2 — Comprehensive E2E with blind verification:** comprehensive walk (this session, 2026-05-07T01:50-01:59) + independent re-check (2026-05-07T02:05-02:08) + scope-guardian audit. Files: `evidence/wave-1C-comprehensive-e2e/`.

Both pillars complete; the wave-bookend "RESET 2026-05-07" requirement is satisfied.

## Required remediations BEFORE merge

| Action | Reason | Risk |
|---|---|---|
| `git checkout -- tests/e2e/seed.spec.ts` | Revert Playwright MCP scaffolding clobber to restore prior intentional content | low — pure revert |
| `rm tests/e2e/seed-eval.spec.ts` | Delete Playwright MCP scaffolding artifact (was never a tracked file) | low — newly-created untracked file |

Neither remediation touches product code, schema, or evidence — they only restore the test directory to its pre-walk state.

## Optional cleanups (non-blocking)

1. Delete or re-capture duplicate `evidence/wave-1C-comprehensive-e2e/routes/sh-04b-sales-kpis-zoom.png` (byte-identical to `sh-04-sales-dashboard.png`)
2. Register `wave-1C-comprehensive-e2e` in `sprints.json` to silence C8 ORPHAN_EVIDENCE watchdog alerts
3. Re-snapshot `routes/sh-01-insights-dashboard.png` with sidebar-uncollapsed view (current crop hides H1 because horizontal scroll cut off "intelligence" word)

## Wave 3F UI follow-ups (catalogued, NOT blockers)

1. `/sales` Conv Rate small-denominator visual treatment ("n=7" / "sample too small" pattern)
2. Source Quality Trends chart rendering polish (axis labels render; trend lines did not visualize)
3. Top Performing Agents — human-rep leaderboard if desired
4. `/sales/leads` per-lead route, if product wants one
5. `/widget-landing` discoverability if desired

## Wave 2A provider-proof gaps (catalogued, NOT exercised)

- TextMagic real SMS round-trip
- Resend real email send (covered by 2026-05-06 Δ1)
- VAPI real call placement
- Tavus real session creation
- VIN Solutions real write (vin-safe-mcp prepare→execute)

## Merge-gate recommendation to operator

**Wave 1C is GO with the two remediations above.**

After remediations:
- `git checkout batch-1-finish-line && git merge --ff-only wave/5-insights/1C-metric-honesty`
- Operator-approved push to remote
- Live deploy is a separate gate (per CLAUDE.md hard rules)

## Evidence root

`/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/wave-1C-comprehensive-e2e/`

37 files across 6 subdirectories (24 PNGs + 13 markdown/JSON). Plus `evidence/wave-1C-metric-honesty/wave-proof/` (server-side correctness pillar from 2026-05-06).
