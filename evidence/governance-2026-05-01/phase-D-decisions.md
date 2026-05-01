# Phase D — operator decisions queue

**Status:** Phase A → C complete. Phase E (clean state confirmation) next. **D2 BLOCKS P1 per amendment #3.**

## Phase C results

6 commits ahead of `origin/chunk-5-textmagic-soften`:

| SHA | Subject |
|---|---|
| `a027d75` | docs(evidence): Lane 7 API snapshots (JSON only; PNGs gitignored) |
| `46618d1` | docs(governance): 2026-05-01 reset-and-resume inventories + reviews + stash patches |
| `fdec26f` | docs(plan): 2026-05-01 P0-P5 triage queue post overnight validation |
| `a338a50` | docs(evidence): overnight validation Lanes 4-7 + reports + chunk-era plan |
| `ba1878e` | chore(backlog): add Phase 6 Sprint 6.1 — Dashboard + Report Builder (v2.3) |
| `0e674a5` | fix(routing): hold AppProvider until role hydrates (I-NEW-2026-05-01-A) |

All five operator amendments honored:
1. ✅ Stash patches scanned by Stash/Secret Reviewer → CLEAR-ALL-PATCHES → committed in C5
2. ✅ Watchdog log handled per amendment #2 (tracked → flagged as D8, NOT auto-changed)
3. ✅ D2 marked BLOCKING for P1
4. ✅ No pretextual marker refresh; existing 6 markers remain honest
5. ✅ P0 fix `0e674a5` stays separate from governance commits

No push, no merge, no prune, no drop, no production deploy.

## Decisions awaiting operator

### Critical (BLOCKING P1)

#### D2 — TextMagic main/live divergence

`f305f12` (TextMagic relaxed-verify) is on `origin/chunk-5-textmagic-soften` and **deployed live** but is **NOT on `origin/main`**. Confirmed by Branch/Git Reviewer.

If anyone redeploys main, TextMagic webhooks regress to 401-on-no-header (pairs with carried debt I-NEW-2026-04-30-E).

Options:
- **(a)** Open PR to merge `f305f12` → main (sync main with live)
- **(b)** Document divergence permanently with safeguards in deploy.yml
- **(c)** Cherry-pick `f305f12` to main via PR

**Per amendment #3, I will NOT begin P1 until you decide.**

### Non-blocking

#### D1 — PR `0e674a5` (P0 routing fix) to main

Status: verified GREEN (all 6 harness markers fresh from real subagent dispatches). Local-only at present (single point of failure per Branch/Git Reviewer).

Recommendation: at minimum, push `chunk-5-textmagic-soften` to origin so `0e674a5` is durable off-machine even if no PR yet.

#### D3 — 12 archive-candidate branches

Inventory: `evidence/governance-2026-05-01/branch-inventory.md`. All 12 are merged to main; safe to archive-tag and delete locally on your call. No urgency.

#### D4 — 6 stashes

All 6 patches now committed in `evidence/governance-2026-05-01/stashes/` per Stash/Secret Reviewer CLEAR. Stashes themselves remain in `git stash list` until you drop them. Patches are durable backups.

Branch/Git Reviewer + Stash/Secret Reviewer recommend: safe to drop all 6 once you've confirmed the patches readable. **I will not drop without your explicit "go".**

#### D5 — `replit-agent` branch (355 commits ahead)

Per Branch/Git Reviewer: durable on origin (not local-only). No urgency. Operator review at your leisure.

### New sub-decisions surfaced during Phase B/C

#### Sub-D6 — `.gitignore:18` `*.png` rule and held screenshots

The global `*.png` rule excludes ALL Lane 5/6/7 screenshots (30 PNGs) and all 36 P0 screenshots. They're held local-only on disk under:
- `evidence/stabilization-sprint-2026-04-30/lane-5-screenshots/` (9 PNGs)
- `evidence/stabilization-sprint-2026-04-30/lane-6-screenshots/` (5 PNGs)
- `evidence/stabilization-sprint-2026-04-30/lane-7-screenshots/` (16 PNGs — JSON snapshots already committed)
- `evidence/stabilization-sprint-2026-05-01/p0-routing-redirect/` (36 PNGs)

Options:
- **(a)** Add `!evidence/**/*.png` exception to `.gitignore`; I commit the 80 screenshots in a focused commit
- **(b)** `git add -f` the screenshots without changing `.gitignore`
- **(c)** Leave screenshots local-only as evidence-not-in-git (default if no decision)

#### Sub-D7 — local main fast-forward blocked

Local `main` (`fe70823`) is behind `origin/main` (`aa989fc` — origin advanced 12 commits since last morning). Fast-forward would have overwritten the dirty `evidence/stabilization-sprint-2026-04-30/plan.md` — that file is now **committed** in `a338a50`, so the conflict is gone. You can fast-forward at any time:
```
git checkout main && git merge --ff-only origin/main && git checkout chunk-5-textmagic-soften
```

#### Sub-D8 — watchdog log tracking

`evidence/watchdog-alerts.log` is currently TRACKED in git AND grows continuously (always shows as modified). Per amendment #2 I did not change tracking status.

Options:
- **(a)** `git rm --cached evidence/watchdog-alerts.log` + add to `.gitignore` (stops the perpetual dirty status; log content stays on disk)
- **(b)** Commit the log periodically (perpetual noise but everything committed)
- **(c)** Leave as-is

Recommend (a). Needs your "go".

## Final working-tree state

```
M .claude/session.md            (live handoff, intentionally not in git)
M evidence/watchdog-alerts.log  (D8 pending decision)
?? uploads/                     (operator data; gitignored content)
```

## Stop point

Phase E is the next-and-final step before P1 readiness check. Per amendment #3, P1 does NOT begin until D2 is decided.
