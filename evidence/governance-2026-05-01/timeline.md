# Timeline — Governance Preservation Pass 2026-05-01

**Pass executed:** 2026-05-01 (operator-mandated; one-shot)
**Working branch:** `chunk-5-textmagic-soften`
**Working tree HEAD at start of pass:** `0e674a5` "fix(routing): hold AppProvider until role hydrates (I-NEW-2026-05-01-A)"

---

## Checkpoint ref (created STEP 1)

```
ref:    refs/checkpoint/2026-05-01-pre-governance-cleanup
SHA:    0e674a5911626b10ff14a1ec4a95d4265a56cd99
points to: HEAD of chunk-5-textmagic-soften at 2026-05-01 ~01:00 UTC
```

Any cleanup performed after this point can be reverted by checking out this ref.

---

## STEP 2 — Stale ephemeral harness state cleared

Each item below is recorded with what it was at the moment of removal. Files were inspected before deletion.

### 2.1 — `.claude/state/active-scope.txt` (DELETED)

Was: scope declaration for the **already-completed** P0 session "I-NEW-2026-05-01-A routing redirect trap (top-level routes)" dated 2026-05-01.
Contained 13 declared files plus excluded list and minimal-diff rule.
Stale because the four FRESH completion markers (`verify-scope`, `proof`, `code-review`, `testing-level.sprint` — all timestamped 2026-04-30 14:01) confirm the P0 session closed cleanly.

### 2.2 — `.claude/state/scope/*.tsx.ok` (9 files DELETED)

All zero-byte one-shot UI bypass markers from the P0 session. Files removed:
- `AppLayout.tsx.ok`
- `Sidebar.tsx.ok`
- `SubMenuManager.tsx.ok`
- `insights.tsx.ok`
- `management.tsx.ok`
- `marketing.tsx.ok`
- `sales.tsx.ok`
- `teambox.tsx.ok`
- `widget-landing.tsx.ok` (older, dated 2026-04-26 — orphan from prior widget work)

### 2.3 — `.claude/state/completion/integration-safety.no-session.ok` (DELETED)

Was: `kind=integration-safety / session=no-session / ts=2026-04-30T01:41:09Z`.
Stale: this is a chunk-2B marker from the wave-pe3 stabilization sprint (auth/config hardening, commit `aaf310c`), NOT from the active P0 session. Already-merged work.

### 2.4 — `.claude/state/completion/launch-check.no-session.ok` (DELETED)

Was: `kind=launch-check / session=no-session / ts=2026-04-28T01:23:28Z`.
Stale: 3+ days old, predates Apr 27 launch and the P0 session.

### 2.5 — `.claude/scheduled_tasks.lock` (DELETED)

Was: `{"sessionId":"613d3d59-...","pid":1312586,"procStart":"801682796","acquiredAt":1777524762671}`.
Stale: held by a defunct process from 2026-04-30 ~04:52 UTC. No live process holds the session id.

### 2.6 — `.claude/session-snapshot.md` (DELETED)

Was: pre-compact hook output from 2026-04-30T05:57:03Z (informational). The operator-curated `.claude/session.md` (2026-05-01) is the authoritative session file and remains UNTOUCHED.

### 2.7 — Items NOT touched (FRESH P0 markers, intentionally preserved)

- `.claude/state/completion/verify-scope.no-session.ok` (ts 2026-04-30 14:01)
- `.claude/state/completion/proof.no-session.ok` (ts 2026-04-30 14:01)
- `.claude/state/completion/code-review.no-session.ok` (ts 2026-04-30 14:01)
- `.claude/state/completion/testing-level.sprint.no-session.ok` (ts 2026-04-30 14:01)
- `.claude/session.md`
- `.claude/settings*.json`

---

## Significant commits (last ~14 days, de-duplicated by date)

### 2026-04-30 (chunk-5 + post-launch hardening + P0 fix)

| SHA | Subject |
|---|---|
| `0e674a5` | fix(routing): hold AppProvider until role hydrates (I-NEW-2026-05-01-A) — **HEAD; ahead 1 of origin/chunk-5-textmagic-soften** |
| `f305f12` | fix(textmagic): relax webhook verify when no signing header (I-NEW-2026-04-30-E) + cleanup incident-fix workflow |
| `e44ef14` | Merge incident-workflow payload fix (PR #4) — **origin/main HEAD** |
| `f54ac14` | fix(incident-workflow): remove is_build_time field rejected by Coolify v4 API |
| `0b09300` | Merge incident-fix workflow (PR #3) |
| `f583f04` | ci(incident): one-off workflow to set live Coolify webhook secrets |
| `9472cd5` | Merge stabilization sprint 2026-04-30 (PR #2) |
| `97777b8` | ci: harden deploy verification + add failure notification |
| `aaf310c` | fix: auth/config hardening — I-236, I-237, I-256, I-269 |
| `50c5377` | fix: scheduler/outbound hardening — I-248, I-252, I-253, I-254 |
| `5d04049` | feat(notifications): daily recap email + SMS appointment-intent admin email |

### 2026-04-29 (wave-pe3 closeout + merge to main)

| SHA | Subject |
|---|---|
| `87ce20d` | Merge pull request #1 from Huminic/wave-pe3 |
| `fe70823` | Merge wave-pe3 (local; predates origin/main fast-forward) |
| `66d80ff` | fix(triggers): Trigger 1 dedup + activity-log awaited |
| `2457a0c` | fix(widgets): allow cross-origin loads of /dealer-widgets/, /dealer-handoff/, /w/, /p/ |
| `b0d0e56` | fix(teambox): refresh right-pane messages every 5s |
| `2bfb878` | feat(scheduler): handler for queued_immediate_trigger_sms |
| `5a9fd3b` | feat(triggers): Trigger 1 immediate VIN-lead follow-up + business-hours midnight fix |
| `044aaf0` | feat(campaigns): single-brace placeholder support for service campaign templates |
| `bc5db2a` | fix(sms-ai): forward Test Lane sessionId on auto-reply |

### 2026-04-28

| SHA | Subject |
|---|---|
| `7276e79` | chore(test): sanity-band conversion-rate assertion for t010d AC3 |
| `d14d8a1` | chore(cleanup): refresh stale label refs after P6 Commit C canonicalization |
| `fb97cc3` | P6 Commit C: label canonicalization + Lifetime Win Rate rename |
| `25ead37` | fix(metrics): suppress sm-3 delta to fix window mismatch |
| `70dd468` | fix(metrics): render dash for hardcoded-zero deltas + per-tile window suffix |
| `969d779` | fix(metrics): suppress misleading delta on zero/tiny base (Priority #6 Commit A) |
| `67b9d8d` | fix(client/queryClient): thread AbortSignal + filter abort errors from onError (Priority #5) |

### 2026-04-27

| SHA | Subject |
|---|---|
| `f1e4288` | marketing: add narrow v2.3 preview banner for launch gating |
| `fe1fca3` | fix(auth): handle refresh-token rotation race (Priority #3) |
| `2916cd8` | fix(outbound): scope getConversationForRecipient by recipient identity (Priority #2) |
| `0d9d683` | fix(vapi-inbound): preserve short legitimate messages in guard fold |
| `66cc93b` | fix(vapi-inbound): orphan-prevention guard for no-content end-of-call events |
| `2afb569` | proof(sms-guard): Phase 3 live evidence — allowlisted send + non-allowlisted block |
| `62d72b5` | feat(sms-guard): centralized fail-closed pre-launch SMS guard |
| `fc59c1c` | audit(sms-guard-investigation): Phase 1 |
| `001767d` | audit(sms): SMS audit of 16 pre-launch conversation phones |
| `99a5125` | docs(incident): record over-broad Serra Honda cleanup as accepted loss |
| `94126fe` | audit(restore-assessment): re-classify deleted Serra Honda conversations |

### 2026-04-26

| SHA | Subject |
|---|---|
| `831bbc2` | chore(teambox): full cleanup of pre-launch test conversations + 3 derived issues |
| `e62f784` | audit(orphan-conversations): root-cause for Serra Honda TeamBox orphans |
| `2580223` | chore(campaigns): archive stuck "Service Reminder - February" |
| `66ee273` | audit(stuck-campaign): root-cause |
| `924fd09` | chore(insights): align lead-source fallback string |
| `44588dd` | fix(insights): resolve VIN lead-source IDs (I-279) |
| `b2f7579` | audit(vin-source-resolution): I-279 archaeology |
| `d73cace` | fix(home): align Active Pipeline tile label |
| `0bff91f` | fix(insights): bind activePipeline to hotCount |
| `b5cebb3` | audit(active-pipeline): source archaeology |

---

## Reflog highlights (branch jumps)

```
2026-04-30 13:58Z  commit 0e674a5  P0 fix on chunk-5-textmagic-soften
2026-04-30 05:36Z  commit f305f12  textmagic relax + workflow cleanup
2026-04-30 05:36Z  pull origin main fast-forward (incident-fix branch)
2026-04-30 05:29Z  commit f54ac14  Coolify v4 API fix
2026-04-30 05:27Z  commit f583f04  incident-fix workflow start
2026-04-30 05:26Z  checkout wave-pe3 → incident-fix-2026-04-30
2026-04-30 01:48Z  commit 97777b8  ci hardening
2026-04-30 01:41Z  commit aaf310c  auth/config hardening
2026-04-30 01:35Z  commit 50c5377  scheduler/outbound hardening
2026-04-30 01:26Z  commit 5d04049  daily recap + appt-intent email
2026-04-29 15:56Z  checkout main → wave-pe3
2026-04-29 15:54Z  merge wave-pe3 (recursive)
2026-04-29 15:53Z  checkout wave-pe3 → main
```

---

## Reconciliation note — local vs origin

`.claude/session.md` (operator-curated, 2026-05-01) describes the head of `origin/main` as `b7d4d6f` "Merge chunk 5: TextMagic relaxed-verify + workflow cleanup, PR #5". That commit is **NOT present** on origin at the time of this pass — `origin/main` HEAD is `e44ef14` (PR #4), and `chunk-5-textmagic-soften` is `[ahead 1]` of its origin counterpart. PR #5 referenced in `session.md` either has not been opened yet, was rejected, or the operator's note is forward-looking.

**Decision:** record-only. Do NOT push, merge, or open PR #5 in this pass.

---

## What changed in this governance pass

- Created checkpoint ref `refs/checkpoint/2026-05-01-pre-governance-cleanup → 0e674a5`
- Cleared 6 categories of ephemeral harness state (13 files total)
- Exported all 6 stashes to `evidence/governance-2026-05-01/stashes/*.patch`
- Wrote 5 inventory files under `evidence/governance-2026-05-01/`
- No code, no schema, no env, no push, no deploy
