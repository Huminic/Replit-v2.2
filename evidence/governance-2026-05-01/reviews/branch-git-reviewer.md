# Branch / Git Reviewer — Read-Only Verification

**Date:** 2026-05-01
**Reviewer:** Branch / Git Reviewer subagent (read-only)
**Repo:** /home/ubuntu/Claude-store/nexxus2.2_replit
**Current HEAD:** `chunk-5-textmagic-soften` @ `0e674a5`
**origin/main HEAD:** `e44ef14` (Merge incident-workflow payload fix, PR #4)
**local main HEAD:** `fe70823` (BEHIND origin/main)

---

## 1. Checkpoint ref verdict

**PRESENT-AT-EXPECTED-SHA**

```
$ git rev-parse refs/checkpoint/2026-05-01-pre-governance-cleanup
0e674a5911626b10ff14a1ec4a95d4265a56cd99
```

Matches expected `0e674a5...` exactly. Same SHA as local `chunk-5-textmagic-soften` HEAD. Subject:
`fix(routing): hold AppProvider until role hydrates (I-NEW-2026-05-01-A)` (2026-04-30 13:58:18 +0000)

---

## 2. Local-only branches with unique commits (at-risk if local clone lost)

For each local branch, ran `git rev-list --count <branch> ^origin/main`:

| Branch | Unique vs origin/main | Has remote tracking? | Risk |
|---|---:|---|---|
| `chunk-5-textmagic-soften` | 2 | yes (origin/chunk-5...) | LOW (1 of 2 already on origin; 1 local-only = `0e674a5`) |
| `replit-agent` | 355 | yes (origin/replit-agent) | LOW (already on origin) |
| `incident-fix-2026-04-30` | 0 vs origin/main; 2 ahead of origin/incident-fix | yes | LOW (origin/main already contains the merge `e44ef14`) |
| `main` (local) | 1 (`fe70823`) | yes | LOW (still on origin briefly via PR-merge ancestry; local main is a published merge SHA) |
| All other local branches | 0 | mixed | none |

### At-risk local-only commits (NOT on any remote ref reachable now)

Verified via `git branch -r --contains <sha>`:

- **`0e674a5`** (P0 routing fix) — present ONLY on:
  - local `chunk-5-textmagic-soften`
  - `refs/checkpoint/2026-05-01-pre-governance-cleanup`
  - NOT in `git branch -r --contains 0e674a5` output (empty)

  This is the single commit at risk if the local clone is lost. Mitigated by the checkpoint ref BUT both refs are local. Recommend operator push `chunk-5-textmagic-soften` (or push checkpoint ref) when authorized.

No other local-only-with-unique-commits branches identified.

---

## 3. Branch-inventory accuracy spot-check

Spot-checked 5 entries from `evidence/governance-2026-05-01/branch-inventory.md`:

| Entry | Inventory claim | Git reality | Verdict |
|---|---|---|---|
| `chunk-5-textmagic-soften` | 1 ahead of origin/chunk-5; HEAD `0e674a5` | confirmed: `git rev-list --count chunk-5 ^origin/chunk-5` = 1; HEAD `0e674a5` | CORRECT |
| `incident-fix-2026-04-30` | 10 ahead of local main; merged on origin via PR #4 | confirmed: 10 ahead of local `fe70823`; 0 ahead of origin/main; e44ef14 IS origin/main HEAD | CORRECT |
| `wave-pe3` | 4 ahead of local main; merged via PR #2 on origin | confirmed: 4 ahead of `fe70823`; 0 vs origin/main | CORRECT |
| `replit-agent` | 355 commits ahead | confirmed: `git rev-list --count replit-agent ^origin/main` = 355 | CORRECT |
| `Nexxus2.1_preservation` | 0 ahead of main; merged | confirmed: 0 ahead of origin/main | CORRECT |

Verdict: **CORRECT** (5/5 spot-checks consistent). Inventory uses local-main (`fe70823`) as the comparison baseline, which can confuse on first read but is internally consistent and explicitly noted.

---

## 4. P0 fix `0e674a5` reachability

**REACHABLE**

```
$ git log --oneline 0e674a5 -1
0e674a5 fix(routing): hold AppProvider until role hydrates (I-NEW-2026-05-01-A)

$ git branch --contains 0e674a5
* chunk-5-textmagic-soften

$ git branch -r --contains 0e674a5
(empty — not yet on any remote)
```

Reachable from:
- Local branch `chunk-5-textmagic-soften` (HEAD)
- Tag/ref `refs/checkpoint/2026-05-01-pre-governance-cleanup` (= same SHA)

NOT reachable from any remote ref. Two local pointers protect it. Operator push required for full safety.

---

## 5. D2 reconciliation: `f305f12` (TextMagic webhook softening)

```
$ git log --oneline f305f12 -1
f305f12 fix(textmagic): relax webhook verify when no signing header (I-NEW-2026-04-30-E) + cleanup incident-fix workflow

$ git merge-base --is-ancestor f305f12 origin/main; echo $?
1   ← NOT an ancestor of origin/main

$ git branch -r --contains f305f12
  origin/chunk-5-textmagic-soften   ← IS on origin/chunk-5

$ git merge-base --is-ancestor f305f12 origin/chunk-5-textmagic-soften; echo $?
0   ← confirmed ancestor
```

Verdict: `f305f12` is **NOT on origin/main**, **IS on origin/chunk-5-textmagic-soften**. Matches D2 expectation.

---

## 6. Other risks / observations

1. **Local main is BEHIND origin/main.** Local `main` = `fe70823`; origin/main = `e44ef14` (PRs #2/#3/#4 merged on origin not pulled locally). Per inventory: operator should `git fetch && git merge --ff-only origin/main`. Not a data-loss risk; operational reminder.

2. **`refs/checkpoint/2026-05-01-pre-governance-cleanup` is a local-only ref.** It is the only non-branch protection for `0e674a5`. If `.git/` is lost, the checkpoint ref is lost. Consider pushing as `refs/heads/...` or tag to origin when operator authorizes.

3. **`replit-agent` divergence.** 355 commits ahead of origin/main, dated 2026-03-11. Already on origin (`origin/replit-agent` exists), so durable. Inventory flags as NEEDS-OPERATOR-DECISION; concur.

4. **No fabricated/forged refs detected.** All branches and the checkpoint ref are reachable, dated coherently, and SHAs match what the inventory documents.

5. **No destructive actions taken or required by this review.** Read-only contract honored.

---

## Summary table

| Check | Verdict |
|---|---|
| Checkpoint ref present at expected SHA | PRESENT-AT-EXPECTED-SHA (`0e674a5`) |
| P0 fix reachability | REACHABLE (via local branch + checkpoint ref; not on remote) |
| Branch-inventory spot-check (5 entries) | CORRECT |
| D2: f305f12 NOT on origin/main | CONFIRMED |
| D2: f305f12 ON origin/chunk-5-textmagic-soften | CONFIRMED |
| Local-only branches with unique commits at risk | 1 commit (`0e674a5`) — mitigated by checkpoint ref |
