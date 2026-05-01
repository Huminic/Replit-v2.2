# Reset-and-resume plan — 2026-05-01 (operator-amended)

## Purpose

Get back to a clean state before resuming P1, with all amendments per operator on 2026-05-01.

## Goal (from operator)

- no stale permissions
- no hidden stash mystery
- one active plan
- one timeline
- branch/stash inventory
- clear next sprint

## Operator amendments (all five honored throughout)

1. **Stash patches scan first.** Before committing C5, run a dedicated secret / customer-data scan against `evidence/governance-2026-05-01/stashes/*.patch`. If any hit, do **not** commit raw patches — commit only `stash-inventory.md` summary and leave raw patches local/untracked for operator review.
2. **Watchdog log handling.** Before B4, check whether `evidence/watchdog-alerts.log` is tracked. If untracked → add to `.gitignore`. If tracked → do **not** assume `.gitignore` fixes it; report and ask before `git rm --cached`.
3. **D2 is blocking.** TextMagic main/live divergence is a blocking governance decision before P1. Do **not** start P1 until operator decides reconciliation path.
4. **Markers honest.** Do not create or reuse launch/integration markers for governance-only commits unless the underlying check actually applies. If Stop hook blocks governance cleanup incorrectly, report and ask for one-shot `skip-stop-check` approval.
5. **P0 stays separate.** Keep `0e674a5` (P0 routing fix) separate from governance commits. Do not bundle it with backlog / evidence / governance.

## Hard non-negotiables

- no `git push` (any kind, including the P0 fix)
- no `gh pr merge` / `gh pr create`
- no branch prune (local or remote)
- no stash drop
- no plan / evidence deletion
- no `npm run build`, no `pm2 restart`, no `docker restart`
- no `CLAUDE.md` / `~/.claude/CLAUDE.md` / harness hook / sysadmin edit
- no product code edit outside an approved P1 scope (and P1 needs its own `/preflight`)
- no external provider request

## Agent team (read-only review only; no builders)

Main thread = orchestrator and only writer. Subagents are read-only review agents. None of them edit, drop, push, prune, or merge.

| Subagent | Mandate | Output |
|---|---|---|
| **Governance Auditor** | Review `timeline.md`, `plan-index.md`, `worktree-disposition.md`. Verify active plan correctly identified. Flag files that should NOT be committed. | findings markdown for main thread |
| **Stash / Secret Reviewer** | Inspect `stash-inventory.md` and `stashes/*.patch`. Scan for secrets, tokens, env values, customer data. Recommend safe-to-commit vs keep-local per stash. | findings markdown |
| **Branch / Git Reviewer** | Review `branch-inventory.md`. Confirm checkpoint ref exists. Identify branches with unique commits not on main. | findings markdown |
| **Harness State Reviewer** | Verify stale `.claude/state` cleanup. Confirm no stale scope markers remain. Confirm completion markers are not misused. | findings markdown |
| **P1 Readiness Explorer** (optional, only if context allows) | Read-only summary of what P1 Sales-vs-Service will need after cleanup. No implementation. | findings markdown |

Main thread integrates the four (or five) findings into the cleanup execution and stops before P1.

## Phase A — Verify safety net (zero risk; read-only)

| Step | Action | Risk | Mitigation |
|---|---|---|---|
| A1 | Confirm `refs/checkpoint/2026-05-01-pre-governance-cleanup → 0e674a5` | none | read-only |
| A2 | Confirm 6 stash patches at `evidence/governance-2026-05-01/stashes/` are non-empty | none | read-only |
| A3 | Confirm 5 inventory files exist | none | read-only |
| A4 | `git status` snapshot | none | read-only |

If any check fails → STOP and report.

## Phase B — Local-only cleanup (low risk; reversible)

| Step | Action | Risk | Mitigation |
|---|---|---|---|
| B1 | `git fetch origin` | none | read-only network |
| B2 | If `main` is behind `origin/main`: `git checkout main && git merge --ff-only origin/main` then return to `chunk-5-textmagic-soften` | branch update; reversible via reflog | only fast-forward; abort on conflict |
| B3 | Verify `chunk-5-textmagic-soften` is back checked out | none | read-only |
| B4 | **Per amendment #2:** `git ls-files --error-unmatch evidence/watchdog-alerts.log` to determine tracked status. If untracked → add line to `.gitignore`. If tracked → STOP and report; ask before `git rm --cached` | wrong file ignored | one-line check; show diff; abort on uncertainty |

## Phase C — Commit overnight + governance work (medium risk; reversible via checkpoint)

**Per amendment #5:** P0 fix `0e674a5` stays separate. Already committed; no governance work touches it.

Each commit group passes through a secret scan before staging. The scan greps for: `PASSWORD=\S`, `_KEY=\S` (with anything after), `BEARER\s\S`, `Authorization:\s\S`, `_SECRET=\S`, `_TOKEN=\S`, `sk-[A-Za-z0-9]{20,}` (Anthropic/OpenAI key shape), `re_[A-Za-z0-9]{20,}` (Resend key shape), `+1[0-9]{10}` for any non-allowlisted phone (allowlisted is `+14126546500`, `+15551234567` test number).

If a scan hits, that commit is aborted; results reported; remediation requested.

| Group | Contents | Pre-commit check | Risk | Mitigation |
|---|---|---|---|---|
| **C1 — Backlog** | `backlog.md` (Phase 6 / Sprint 6.1 — Dashboard + Report Builder) | secret scan; diff review | misframe future work | content already operator-approved; commit verbatim |
| **C2 — Issues** | `issues.md` (any rows added; commit only if dirty) | secret scan; diff review | wrong issue framing | show diff first |
| **C3 — Overnight evidence** | `evidence/stabilization-sprint-2026-04-30/{lane-4,5,6,7}-*.md`, `lanes-4-8-plan.md`, `overnight-validation-plan.md`, `overnight-validation-report.md`, `lane-5-screenshots/`, `lane-6-screenshots/`, `lane-7-screenshots/` | secret scan; phone-number check; cookie/token check on screenshots | screenshots may include test phone numbers and UI state | screenshots only of allowlisted test orgs; phone `+15551234567` is the synthetic test number; no real customer data |
| **C4 — Tomorrow plan** | `evidence/stabilization-sprint-2026-05-01/tomorrow-plan.md` | secret scan; review | none | governance-only file |
| **C5 — Governance inventories** | `evidence/governance-2026-05-01/{timeline,plan-index,branch-inventory,stash-inventory,worktree-disposition,reset-and-resume-plan}.md`. **Per amendment #1:** the `stashes/*.patch` files are committed only if Stash/Secret Reviewer returns CLEAR. Otherwise commit only the `.md` files and leave raw patches local/untracked. | dedicated patch scan (per amendment #1) | stash patches contain old WIP code that may include creds | per-patch scan before staging; partial commit if mixed; report on hits |
| **C6 — P0 evidence** | `evidence/stabilization-sprint-2026-05-01/p0-routing-redirect/` (4 mjs reproducers + 4 result.json + 36 PNGs) | secret scan; cookie/token check on screenshots | screenshots include logged-in UI | login was test accounts; cookies don't render in screenshots; no real customer data |

I will NOT commit:
- `.claude/session.md` (live handoff, intentionally outside git scope per current pattern)
- `.claude/settings*.json*` (operator-curated)
- `evidence/watchdog-alerts.log` (handled by B4 per amendment #2)
- `uploads/` (operator data per CLAUDE.md)

After each commit: `git log --oneline -1` + present SHA + subject.

**Per amendment #4:** If Stop hook blocks any governance-only commit because of stale launch/integration gates, I will NOT refresh those markers from a real subagent run unless the underlying check applies. I will report and request one-shot `skip-stop-check`. No pretextual marker creation.

## Phase D — Surface PR-and-reconcile decisions to operator (no action; D2 is blocking P1)

| ID | Decision | Status | Note |
|---|---|---|---|
| D1 | PR `0e674a5` (P0 routing fix) to main | operator decides | P0 fix is verified GREEN |
| **D2** | **PR `f305f12` (TextMagic relaxed-verify) to main — BLOCKING per amendment #3** | operator must decide before P1 | Live container has relaxed-verify; main does not. Without reconciliation, redeploying main regresses TextMagic webhooks to 401 with no signing header. Options: (a) open PR to sync main with live, (b) document divergence permanently with safeguards, (c) cherry-pick to main |
| D3 | 12 archive-candidate branches | operator decides | inventory in `branch-inventory.md` |
| D4 | 6 stashes | operator decides | patches in `stashes/`; 4 still NEEDS-DECISION |
| D5 | `replit-agent` branch (355 commits ahead) | operator decides | needs review before any decision |

## Phase E — Stop and confirm before P1

| Step | Action |
|---|---|
| E1 | Show fresh `git status` (should be very small — log file gitignored, P0 commit + governance commits done) |
| E2 | Show fresh `git log --oneline -10` |
| E3 | Confirm `.claude/state/scope/` is empty |
| E4 | Confirm `.claude/state/active-scope.txt` is absent |
| E5 | Confirm 6 fresh completion markers (none refreshed pretextually) |
| E6 | Present D1–D5 decisions awaiting operator |
| E7 | Per amendment #3: STOP. Do NOT begin P1 until operator decides D2 |

After D2 decision lands and operator gives "go", proceed to Phase F.

## Phase F — Resume P1 (only after operator "go" + D2 decision)

Backlog item: I-NEW-2026-05-01-B — `weeklyReportService.ts:479` `salesOnlyLeadIds` filter not applied. Per `tomorrow-plan.md`, this also touches:
- `server/services/weeklyReportService.ts`
- BL-107 (lead_type column on warehouse_leads)
- Marketing Insights tab role-category filter (I-NEW-2026-05-01-G)

Run `/preflight` for P1, present table, wait for go, dispatch `harness-orchestrator` for full harness arc (scope-guardian → harness-backend → qa-evaluator → code-reviewer → markers → commit; no push without explicit per-action approval).

## Risk summary (with amendments)

| Risk | Severity | Mitigation |
|---|---|---|
| Accidental secret commit | HIGH | per-group secret scan; **dedicated patch scan per amendment #1**; abort on hit; show diffs |
| Wrong file ignored in `.gitignore` | LOW | **per amendment #2: check tracked status first; abort on uncertainty** |
| Stash patches expose creds | MEDIUM | **amendment #1: hold raw patches local-only on hit; commit only summary** |
| Local main fast-forward conflict | LOW | only `--ff-only`; abort on failure |
| TextMagic main/live divergence persists | **BLOCKING per amendment #3** | D2 blocks P1; surface as decision, not unilateral action |
| Marker misuse | MEDIUM | **amendment #4: no pretextual marker refresh; ask for `skip-stop-check` if hook blocks incorrectly** |
| P0 fix bundled with cleanup | LOW | **amendment #5: P0 commit `0e674a5` stays separate** |
| Stash data loss | NONE | no drops; .patch preservation already done |
| Branch loss | NONE | no prunes; checkpoint ref + remote covers everything |
| Push without approval | NONE | not on the action list |

## Estimated outputs

- Up to 6 small commits (Groups C1–C6, some may collapse if files don't exist or are clean; C5 may be partial if patches fail scan)
- 1 fast-forward of local `main` (or skipped if already up-to-date)
- 0 or 1 lines added to `.gitignore` (amendment #2 dependent)
- 1 plan file (this one) written before execution
- 4–5 read-only subagent reports under `evidence/governance-2026-05-01/reviews/`
- A list of 5 operator decisions (D1–D5) at the end with **D2 flagged as blocking**

## Success criteria

- [ ] Phase A all green
- [ ] Phase B clean (or B4 reported and operator-decided)
- [ ] Phase C: every commit passed secret scan; no patches committed if scan hit
- [ ] Phase D: 5 decisions clearly surfaced, D2 marked blocking
- [ ] Phase E: clean git status, fresh markers (no pretextual ones)
- [ ] No push, no merge, no prune, no drop, no product code edit
- [ ] P1 not started until D2 decided

## After this plan executes

Operator decides D1–D5 (especially D2). When D2 is decided and operator says "go P1", I run `/preflight` for I-NEW-2026-05-01-B and present for approval before any product code work begins.
