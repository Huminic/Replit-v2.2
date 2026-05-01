# Stash Inventory — Governance Preservation Pass 2026-05-01

All 6 stash entries were inspected via `git stash show --stat` and `git stash show -p`. Every stash is exported to `evidence/governance-2026-05-01/stashes/` as a `.patch` file.

**No stashes were dropped.**

---

## stash@{0} — `On main: stash-logs-pre-merge`

| | |
|---|---|
| Branch | `main` |
| Files touched | `evidence/LAUNCH-RECON-01/workflow-audit.log` (+2), `evidence/watchdog-alerts.log` (+145) |
| Total | 147 lines added |
| Patch | `evidence/governance-2026-05-01/stashes/stash-0-stash-logs-pre-merge.patch` (163 lines) |
| Purpose | Pre-merge log snapshot from `main` taken right before merging `wave-pe3` (timestamps in patch are 2026-04-29). Pure log appends — not product code. |
| Value-judgment | LOW VALUE. These are watchdog/audit log appends, regenerable. Already exported. |
| Recommendation | **EXPORTED-OK-TO-DROP-LATER** (operator confirmation suggested but not required for low-value log noise). |

---

## stash@{1} — `On wave-pe3: pre-deploy-stash-watchdog-2026-04-29`

| | |
|---|---|
| Branch | `wave-pe3` |
| Files touched | `evidence/watchdog-alerts.log` (+277) |
| Total | 277 lines added |
| Patch | `evidence/governance-2026-05-01/stashes/stash-1-pre-deploy-stash-watchdog-2026-04-29.patch` (285 lines) |
| Purpose | Pre-deploy log snapshot of watchdog alerts from 2026-04-29. Timestamps confirm watchdog C8 (orphan evidence) and C12 (governance file changed) alerts. |
| Value-judgment | LOW VALUE. Log appends only. |
| Recommendation | **EXPORTED-OK-TO-DROP-LATER** |

---

## stash@{2} — `On wave-pe3: pre-deploy-stash-2026-04-29`

| | |
|---|---|
| Branch | `wave-pe3` |
| Files touched | 160 files: `.claude/session.md`, `decisions.md`, `evidence/REM-9/screenshots/**` (~95 PNG), `evidence/T-2/screenshots/catalog/**` (~50 PNG), `evidence/T-2/test-results.json`, `evidence/comms-workflow-eval-2026-04-12-overnight/**`, `evidence/watchdog-alerts.log`, `issues.md` |
| Total | 12,022 insertions / 1,591 deletions |
| Patch | `evidence/governance-2026-05-01/stashes/stash-2-pre-deploy-stash-2026-04-29.patch` (15,123 lines) |
| Purpose | Massive pre-deploy snapshot from 2026-04-29 capturing screenshot updates (RBAC catalog regen) plus session.md state and watchdog log + issues.md. Contains the operator's session.md narrative for the autonomous overnight run. |
| Value-judgment | MEDIUM. The session.md narrative + decisions.md are valuable historical context. Screenshots are large but regenerable from `tests/`. The diff is now superseded by current committed `.claude/session.md` (operator-curated 2026-05-01). |
| Recommendation | **NEEDS-OPERATOR-DECISION**. Patch is preserved either way; operator may want to verify session.md / decisions.md content before approving drop. |

---

## stash@{3} — `WIP on wave-pe3: 7e903ef fix(widget): dropdown closes immediately on FAB click — stopPropagation [skip-ghost]`

| | |
|---|---|
| Branch | `wave-pe3` |
| Files touched | `client/public/dealer-widgets/nexxus-widget.js` (+26 / -7 widget show/hide animation), `evidence/LAUNCH-RECON-01/workflow-audit.log` (+25), `evidence/watchdog-alerts.log` (+1), `evidence/watchdog-report.txt` (±4) |
| Total | 49 insertions / 7 deletions |
| Patch | `evidence/governance-2026-05-01/stashes/stash-3-widget-fab-stoppropagation-wip.patch` (110 lines) |
| Purpose | Widget UX fix — refines `showPanel()` / `hidePanel()` to clear stale timers and prevent flicker. **PRODUCT CODE** in `client/public/dealer-widgets/nexxus-widget.js`. |
| Value-judgment | POTENTIALLY USEFUL. Real product UX fix that was never committed. Widget animation/timer cleanup looks like a legitimate fix for a flicker bug. Should be reviewed alongside current widget code to see if the fix is still needed (subsequent widget work landed at `2457a0c` cross-origin allow-list). |
| Recommendation | **NEEDS-OPERATOR-DECISION**. Patch preserved. Operator should compare against current `client/public/dealer-widgets/nexxus-widget.js` and decide whether to apply. |

---

## stash@{4} — `WIP on wave-pe3: a01d1eb fix: move widget files to client/public/ for Vite build inclusion [skip-ghost]`

| | |
|---|---|
| Branch | `wave-pe3` |
| Files touched | `evidence/LAUNCH-RECON-01/workflow-audit.log` (+53), `evidence/watchdog-alerts.log` (+3), `evidence/watchdog-report.txt` (±8), `issues.md` (+10) |
| Total | 70 insertions / 4 deletions |
| Patch | `evidence/governance-2026-05-01/stashes/stash-4-widget-vite-build-fix-wip.patch` (119 lines) |
| Purpose | Despite the WIP label about Vite build inclusion, the actual diff is log appends + a 10-line `issues.md` addition. The product-code change implied by the stash name was apparently committed as `a01d1eb` and the residual is just log noise + issue documentation. |
| Value-judgment | LOW VALUE. The `issues.md` 10-line block may already be in current `issues.md`; if not, the patch preserves it. |
| Recommendation | **NEEDS-OPERATOR-DECISION**. Verify the issues.md addition is already in current `issues.md` before dropping. |

---

## stash@{5} — `On local-dev: s3-sales-test-additions`

| | |
|---|---|
| Branch | `local-dev` |
| Files touched | `tests/e2e/s3-sales.spec.ts` (+38 lines, 2 new tests: S-3.AC12 activity-log, S-3.AC13 conversionRate-not-as-delta) |
| Total | 38 lines added |
| Patch | `evidence/governance-2026-05-01/stashes/stash-5-s3-sales-test-additions.patch` (46 lines) |
| Purpose | Two E2E acceptance-criteria tests for S-3 sales sprint (AC12 verifies `/api/activity-log` returns array; AC13 verifies bug `change: summary.conversionRate` is not present). |
| Value-judgment | MEDIUM. These are real test additions that were never committed. AC13 in particular is a regression-prevention test (the original I-114 bug). Worth keeping. |
| Recommendation | **NEEDS-OPERATOR-DECISION**. Either apply on a feature branch and merge, or drop after confirming current `tests/e2e/s3-sales.spec.ts` already covers AC12 + AC13. Patch preserved either way. |

---

## Summary

| Recommendation | Count | Stashes |
|---|---|---|
| KEEP-IN-STASH | 0 | — |
| EXPORTED-OK-TO-DROP-LATER | 2 | stash@{0}, stash@{1} (both pure log appends) |
| NEEDS-OPERATOR-DECISION | 4 | stash@{2}, stash@{3}, stash@{4}, stash@{5} |

All 6 stashes exported. **None dropped.**

Total patch lines exported: 15,846 (lines in `.patch` files combined).
