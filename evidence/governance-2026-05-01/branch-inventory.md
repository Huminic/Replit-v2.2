# Branch Inventory — Governance Preservation Pass 2026-05-01

Local branches enumerated. **No branch deleted in this pass.**

`origin/main` HEAD at time of pass: `e44ef14` (Merge incident-workflow payload fix, PR #4).

---

## Active / unmerged

### `chunk-5-textmagic-soften` — KEEP (live working branch)

| | |
|---|---|
| Last commit | `0e674a5` 2026-04-30 13:58:18 +0000 — fix(routing): hold AppProvider until role hydrates (I-NEW-2026-05-01-A) |
| Ahead of main | 12 commits |
| Ahead of `origin/chunk-5-textmagic-soften` | **1 commit** (the P0 fix `0e674a5` is local-only) |
| Status | UNMERGED |
| Likely purpose | TextMagic webhook softening (commit `f305f12`) plus the unpushed P0 routing-redirect fix (`0e674a5`) |
| Recommendation | **KEEP**. The unpushed `0e674a5` is the P0 fix backed by the four FRESH completion markers (verify-scope, proof, code-review, testing-level.sprint at 2026-04-30 14:01). Operator decision needed on push/PR. |

**Specifically:** `chunk-5-textmagic-soften` is 1 commit ahead of `origin/chunk-5-textmagic-soften` (= P0 fix `0e674a5`). Per operator standing order in `tomorrow-plan.md`, no push without explicit approval.

### `incident-fix-2026-04-30` — KEEP (recently merged via PR #4 but local branch retained)

| | |
|---|---|
| Last commit | `e44ef14` 2026-04-30 01:29:59 -0400 — Merge incident-workflow payload fix (PR #4) |
| Ahead of main | 10 commits |
| Status | UNMERGED locally because local `main` is BEHIND `origin/main` |
| Note | On origin, this branch's content IS merged (`e44ef14` is `origin/main` HEAD). Local `main` (`fe70823`) has not pulled the merge. |
| Likely purpose | One-off Coolify v4 webhook-secret incident workflow (commits `f583f04`, `f54ac14`) |
| Recommendation | **ARCHIVE** after operator pulls `origin/main` locally. Per `tomorrow-plan.md`, the incident is closed. |

### `wave-pe3` — KEEP (local-only post-merge state)

| | |
|---|---|
| Last commit | `97777b8` 2026-04-30 01:48:04 +0000 — ci: harden deploy verification + add failure notification |
| Ahead of main | 4 commits |
| Status | UNMERGED locally; on origin, was merged via PR #2 (`9472cd5`) |
| Likely purpose | Stabilization sprint 2026-04-30 (chunks 1A, 2A, 2B, 3 — all DONE) |
| Recommendation | **ARCHIVE** after operator pulls `origin/main`. The work IS shipped. |

### `replit-agent` — KEEP (operator decision; old)

| | |
|---|---|
| Last commit | `d1b7c3c` 2026-03-11 17:04:40 +0000 — Remove recently added features and restore application to previous state |
| Ahead of main | 355 commits |
| Status | UNMERGED |
| Likely purpose | Replit-agent reset state from 2026-03-11. Likely the original Replit baseline. |
| Recommendation | **NEEDS-OPERATOR-DECISION**. 355 commits ahead is significant; could be historical baseline worth keeping or could be obsolete divergence. Do NOT prune without operator review. |

---

## Merged into main (safe to archive eventually)

### `Nexxus2.1_preservation`

| | |
|---|---|
| Last commit | `b7760dd` 2026-03-11 17:28:27 +0000 — Add Replit attached asset logs |
| Ahead of main | 0 |
| Status | MERGED |
| Likely purpose | Preservation snapshot of Nexxus 2.1 codebase at 2026-03-11 |
| Recommendation | **KEEP**. The name signals long-term archival intent. |

### `local-dev`

| | |
|---|---|
| Last commit | `48bdd43` 2026-03-27 12:53:05 +0000 — [M-001] Harness remediation + UI inventory + gap analysis |
| Ahead of main | 0 |
| Status | MERGED |
| Likely purpose | M-001 sprint local-dev branch |
| Recommendation | **ARCHIVE** (merged + 5 weeks old) |

### `lv-001a`

| | |
|---|---|
| Last commit | `6c73dab` 2026-04-05 04:48:00 +0000 — [LV-001a] 13 workflow E2E tests + remediation fixes |
| Ahead of main | 0 |
| Status | MERGED |
| Recommendation | **ARCHIVE** |

### `pe-evals`

| | |
|---|---|
| Last commit | `210d7fb` 2026-04-06 06:53:07 +0000 — [LV-001a] Sprint closed — 165/165 tests pass on live, GO for launch |
| Ahead of main | 0 |
| Status | MERGED |
| Recommendation | **ARCHIVE** |

### `rem-pe-001`

| | |
|---|---|
| Last commit | `210d7fb` 2026-04-06 06:53:07 +0000 — same SHA as `pe-evals` |
| Ahead of main | 0 |
| Status | MERGED |
| Recommendation | **ARCHIVE** (duplicate of pe-evals) |

### `rem-pe-002`

| | |
|---|---|
| Last commit | `318c1ce` 2026-04-06 15:16:14 +0000 — [REM-PE-002] Insights crash fixes |
| Ahead of main | 0 |
| Status | MERGED |
| Recommendation | **ARCHIVE** |

### `rem-pe-003` / `rem-pe-004` / `rem-pe-005`

| | |
|---|---|
| Last commit | `1ccaef0` 2026-04-06 15:33:38 +0000 — [REM-PE-003] Fix 3 integration pipeline bugs (same SHA on all three branches) |
| Ahead of main | 0 |
| Status | MERGED |
| Recommendation | **ARCHIVE** all three (duplicates) |

### `rem-pe-006`

| | |
|---|---|
| Last commit | `0dbad46` 2026-04-06 16:41:46 +0000 — [REM-PE-004/005/006] Remediation batch — metrics, org access, UI polish |
| Ahead of main | 0 |
| Status | MERGED |
| Recommendation | **ARCHIVE** |

### `rescue-2026-03-29`

| | |
|---|---|
| Last commit | `48bdd43` 2026-03-27 — same as `local-dev` |
| Ahead of main | 0 |
| Status | MERGED |
| Recommendation | **ARCHIVE** |

### `rescue-2026-03-29-narrow`

| | |
|---|---|
| Last commit | `9ac01cf` 2026-03-30 03:18:15 +0000 — E2E validation evidence + issues.md update |
| Ahead of main | 0 |
| Status | MERGED |
| Recommendation | **ARCHIVE** |

### `sniper-launch`

| | |
|---|---|
| Last commit | `5da59b3` 2026-04-07 14:41:28 +0000 — [skip-ghost] [SNP-001] Code fixes — 15 bug fixes from Round 2 evals |
| Ahead of main | 0 |
| Status | MERGED |
| Recommendation | **ARCHIVE** |

### `main`

| | |
|---|---|
| Last commit (local) | `fe70823` 2026-04-29 15:54:36 +0000 |
| `origin/main` | `e44ef14` 2026-04-30 01:29:59 -0400 |
| Status | local main is BEHIND origin/main by 4 PRs (#1 fast-forward done; PRs #2 #3 #4 merged on origin not pulled locally) |
| Recommendation | **KEEP**. Operator should `git fetch && git merge --ff-only origin/main` to bring local current. |

---

## Recommendation summary

| Recommendation | Count | Branches |
|---|---|---|
| KEEP | 4 | `main`, `chunk-5-textmagic-soften`, `Nexxus2.1_preservation`, `incident-fix-2026-04-30` (post archive once main pulled) |
| ARCHIVE | 12 | `local-dev`, `lv-001a`, `pe-evals`, `rem-pe-001`, `rem-pe-002`, `rem-pe-003`, `rem-pe-004`, `rem-pe-005`, `rem-pe-006`, `rescue-2026-03-29`, `rescue-2026-03-29-narrow`, `sniper-launch`, `wave-pe3` |
| NEEDS-OPERATOR-DECISION | 1 | `replit-agent` (355 commits ahead, ancient — possibly historical baseline) |
| PRUNE | 0 | per hard rule, no branch is recommended for prune in this pass |

**No branches were deleted.**
