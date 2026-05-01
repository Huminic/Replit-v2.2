# Governance Auditor Review — 2026-05-01

**Auditor:** Governance Auditor (read-only review subagent)
**Pass:** Governance Preservation 2026-05-01 reset-and-resume
**Run date:** 2026-05-01
**Inputs reviewed:**
- `evidence/governance-2026-05-01/timeline.md`
- `evidence/governance-2026-05-01/plan-index.md`
- `evidence/governance-2026-05-01/worktree-disposition.md`
- `evidence/governance-2026-05-01/reset-and-resume-plan.md`
- `.claude/session.md` (operator-curated)
- `.gitignore`, `git status`, sampled lane evidence + P0 reproducers

---

## 1. Active plan verdict

**CORRECT.**

`evidence/stabilization-sprint-2026-05-01/tomorrow-plan.md` is correctly identified as the
authoritative current plan (plan-index.md:5, plan-index.md:16). Long-horizon `plan.md` is
correctly retained as strategy plan, not superseded by the daily plan
(plan-index.md:17–19). Dependency chain phase predecessors are correctly classified
SUPERSEDED with named successor (plan-index.md:24–29, plan-index.md:73–85). No competing
plan claims authority for 2026-05-01.

Note (not a defect): an *executional* plan also lives at
`evidence/governance-2026-05-01/reset-and-resume-plan.md`. It is a procedural plan for
this cleanup pass, not a daily/sprint plan, so it correctly is not listed in the plan
index Active table. Suggest a one-line cross-reference in plan-index.md if the operator
wants the executional plan visible from the index. Non-blocking.

---

## 2. Timeline contradictions vs `.claude/session.md`

**NONE — but one explicitly reconciled forward-looking note.**

- timeline.md:171–175 explicitly reconciles the `.claude/session.md` note that referenced
  `b7d4d6f` "Merge chunk 5 PR #5" as `origin/main` HEAD. timeline.md correctly records
  the actual `origin/main` HEAD as `e44ef14` (PR #4) and flags the discrepancy as
  forward-looking, with "record-only, do NOT push or open PR #5 in this pass". This is
  the right disposition.
- `.claude/session.md:5–7` separately records the same reconciliation: "PR #5 / `f305f12`
  was deployed live but never merged to main — see D2." Consistent with timeline.md.
- All commit SHAs cited in timeline.md "Significant commits" (lines 78–148) align with
  references in `.claude/session.md` (`0e674a5`, `f305f12`, `e44ef14`, `aaf310c`,
  `50c5377`, `5d04049`, `97777b8`). No contradictions detected.
- Stale-state cleanup actions (timeline.md:21–71) are consistent with the operator-
  approved scope in `.claude/session.md` and `reset-and-resume-plan.md`.

---

## 3. Worktree-disposition concerns

The disposition file's classification is sound, but TWO substantive issues need to be
surfaced before any commit work.

### Concern 3.1 — `.gitignore` `*.png` rule will SILENTLY SWALLOW most C3 + C6 evidence

`.gitignore:18` contains a global `*.png` rule. Verified against:
- `evidence/stabilization-sprint-2026-04-30/lane-7-screenshots/01-sales-dashboard-serra-honda.png` → IGNORED (`.gitignore:18:*.png`)
- `evidence/stabilization-sprint-2026-04-30/lane-5-screenshots/01-teambox-main-inbox.png` → IGNORED (same)
- `evidence/stabilization-sprint-2026-04-30/lane-6-screenshots/marketing-agents-tab.png` → IGNORED (same)
- `evidence/stabilization-sprint-2026-05-01/p0-routing-redirect/pre-sales-t30.png` → IGNORED (same)

**Impact:**
- C3 — the screenshots in `lane-{5,6,7}-screenshots/` (referenced in
  reset-and-resume-plan.md:82 and worktree-disposition.md:23) will NOT be staged by a
  vanilla `git add evidence/stabilization-sprint-2026-04-30/lane-7-screenshots/`. The
  `*.json` snapshots inside the same directories ARE NOT ignored and will be staged.
- C6 — all 36 PNGs in `evidence/stabilization-sprint-2026-05-01/p0-routing-redirect/`
  will NOT be staged. The 4 `.mjs` + 4 `.json` files ARE NOT ignored and will be staged.
- worktree-disposition.md:23 lists `lane-7-screenshots/` for Group B but does not flag
  the gitignore conflict.

**Decision required from operator before C3 / C6 commit:**
- (a) `git add -f` to force-include the PNGs (overrides `.gitignore` for these paths);
- (b) carve a per-directory `.gitignore` exception (`!evidence/**/*.png`); or
- (c) accept that screenshots stay local-only and commit only the `.md` + `.json` evidence.

This was NOT addressed in the reset-and-resume-plan secret-scan procedure
(reset-and-resume-plan.md:74–85). Per amendment #2's spirit (don't silently `.gitignore`
the wrong file), this conflict must be surfaced before C3 / C6 staging — currently the
plan would silently produce a partial commit that does not include the visual evidence
the report references.

### Concern 3.2 — Test password fallback baked into 4 P0 reproducer .mjs scripts

Hardcoded fallback `'NexxusTest2026'` appears in:
- `evidence/stabilization-sprint-2026-05-01/p0-routing-redirect/repro-pre-patch.mjs:28`
- `evidence/stabilization-sprint-2026-05-01/p0-routing-redirect/repro-post-patch.mjs:24`
- `evidence/stabilization-sprint-2026-05-01/p0-routing-redirect/repro-clickthrough-pre-patch.mjs:26`
- `evidence/stabilization-sprint-2026-05-01/p0-routing-redirect/repro-auth-flow.mjs:17`

Plus test-account emails (`duane.wells@huminic.ai`, `serra_honda@huminic.ai`) hardcoded
inline (e.g. repro-auth-flow.mjs:31, :60).

This is the documented test password from `CLAUDE.md` ("Test accounts (password:
`NexxusTest2026`)"), and the test accounts are real org_admin accounts that share the
live Supabase DB with production. Per CLAUDE.md TEST-SAFETY MODEL:
> dev and live SHARE the same Supabase database. All 7 named org_admin accounts are real
> dealership admins.

**Risk classification:** the secret-scan grep in reset-and-resume-plan.md:74 looks for
`PASSWORD=\S` (matches `PASSWORD = 'NexxusTest2026'`?) — depends on grep regex
interpretation. Operator should verify the scan catches this BEFORE C6. If the scan does
not catch it, the password will be committed despite the policy.

**Recommendation for C6:** before commit, either
- (a) replace the fallback with `throw new Error('LOGIN_PASSWORD env required')` and
  remove inline emails (move to env vars), then commit;
- (b) accept that the password is already in the public CLAUDE.md so this isn't a new
  disclosure, AND confirm the repo is private; OR
- (c) commit only the result.json files and keep .mjs reproducers local-only.

This is a per-amendment #1 stash analogue — committed reproducer code may include creds.

### Concern 3.3 — `uploads/10-Day-Serra-April-29-2026` flagged correctly, but plan should be explicit

worktree-disposition.md:28 correctly classifies `uploads/` as operator-data with
"verify contents are not sensitive, then either commit or `.gitignore`". The directory
contains `10-Day-Serra-April-29-2026` (a name suggesting customer-data export from Serra
Honda dealership). Per CLAUDE.md "File Management" section: "Each project has its own
`uploads/` directory. SFTP root: `~/filestore`." — `uploads/` is operator-private.

**Recommendation:** add `uploads/` to `.gitignore` rather than committing. Disposition is
correctly noted; recommend making the .gitignore action explicit in B-phase. This was
NOT included in B4's amendment #2 watchdog-log handling — it's adjacent and should be
treated similarly.

### Concern 3.4 — `.claude/session.md` listed in Group A is contrary to operator-stated pattern

worktree-disposition.md:13 puts `.claude/session.md` in Group A "governance commit",
suggested message at line 41. But reset-and-resume-plan.md:88–89 explicitly states:

> I will NOT commit:
> - `.claude/session.md` (live handoff, intentionally outside git scope per current pattern)

The two governance documents are in conflict on whether `.claude/session.md` should be
committed. Per the more recent and operator-approved reset-and-resume plan, it should
NOT be committed. Disposition table needs to be reconciled with the plan, OR the plan
overrides — operator decides.

### Concern 3.5 — `evidence/watchdog-alerts.log` (Group C)

Already TRACKED (`git ls-files --error-unmatch evidence/watchdog-alerts.log` returns the
path). Per reset-and-resume-plan.md:68 amendment #2, this means: **STOP and report; ask
before `git rm --cached`**. Disposition file (line 16, "consider .gitignore eventually")
understates the gating — the file is tracked, so `.gitignore` alone won't silence it.
Plan correctly flags this; disposition should be tightened.

---

## 4. Per-group commit recommendations

### C1 — `backlog.md` → **PROCEED**

Diff (verified `git diff backlog.md`) is a clean append of Phase 6 / Sprint 6.1
(Dashboard + Report Builder). No secrets, no PII, no path-leak. Content cleanly extends
the existing template format. Operator-described content. No concerns.

### C2 — `issues.md` → **EXCLUDE / SKIP — file is clean (no diff)**

`git status --short issues.md` shows no modifications, and `git diff issues.md` is empty.
Reset-and-resume-plan.md:81 correctly says "commit only if dirty". As of the snapshot,
**there is nothing to commit in C2**. The earlier `gitStatus` snapshot at the start of
this conversation shows `M issues.md` — the file may have since been reverted. Verify
freshly before staging; otherwise drop C2 from the plan.

### C3 — Overnight evidence → **EXCLUDE-CERTAIN-FILES + HOLD-AND-DISCUSS**

`HOLD` reasons:
- Lane 5/6/7 screenshots silently swallowed by `.gitignore *.png` (Concern 3.1). MD
  files reference screenshots that won't be in the commit — produces an inconsistent
  evidence trail.
- Per `git status --short` snapshot, `lane-5-screenshots/` and `lane-6-screenshots/`
  are NOT in the untracked list (they exist on disk per `ls`, but git is hiding them
  via `.gitignore`). Disposition file (line 23) ONLY mentions `lane-7-screenshots/`,
  not lane-5/lane-6. Plan and disposition disagree on which screenshot directories are
  in scope.

`PROCEED` for the MD files + non-PNG files (`.json` snapshots ARE not ignored). Suggest
splitting C3 into:
- C3a — MD reports + plan files + JSON snapshots (PROCEED with secret scan).
- C3b — PNG screenshots — HOLD pending operator decision on `.gitignore` exception.

Sampled lane MDs scan: only `+15551234567` (synthetic test) and operator-own emails
(`duanekwells@gmail.com`, `neoweaver@gmail.com`). No real-customer phones or external
emails detected. Bearer-token mention in lane-7-metrics.md:223 is descriptive only
("fetched with a bearer token"), no token value present. Safe.

### C4 — `evidence/stabilization-sprint-2026-05-01/tomorrow-plan.md` → **PROCEED**

Sampled scan found references to `SLACK_WEBHOOK_URL`, `HOTFIX_VAPI_WEBHOOK_SECRET`,
`HOTFIX_TEXTMAGIC_WEBHOOK_SECRET` (lines 69–72) — all are environment-variable NAMES,
not values. No secret values present. Safe to commit.

### C5 — Governance inventories → **PROCEED for .md, HOLD raw .patch per amendment #1**

The `.md` files are governance metadata authored in this pass; verified contents are
descriptions, not code dumps. Amendment #1 already gates `stashes/*.patch` behind the
Stash/Secret Reviewer's verdict — that's the right control. The Governance Auditor
defers to that reviewer for patch-level findings.

### C6 — P0 evidence → **HOLD-AND-DISCUSS**

Two blockers:
- 36 PNGs silently swallowed by `.gitignore *.png` (Concern 3.1). Same problem as C3.
- Test-account password fallback in 4 .mjs reproducer scripts (Concern 3.2).

`PROCEED` for `.json` result files (clean, contain only URLs and step labels — verified
sample of `repro-auth-flow-result.json` and `repro-pre-patch-result.json`).

`HOLD` for `.mjs` reproducers until operator decides on password handling. Most prudent
path: env-var-only + remove inline emails, OR accept current state and commit verbatim
with a note that the password is the documented test password.

---

## 5. Other governance flags

### 5.1 — Plan vs disposition mismatch on lane-5/lane-6 screenshots

reset-and-resume-plan.md:82 lists `lane-5-screenshots/` and `lane-6-screenshots/` for
C3, but worktree-disposition.md:23 only lists `lane-7-screenshots/`. The disposition
file is incomplete relative to the plan. Verify which is correct before staging.

### 5.2 — Plan-index forward-looking note (plan-index.md:8)

> The next planning artifact (covering 2026-05-02) does not yet exist. When created,
> it should explicitly supersede `tomorrow-plan.md`.

Good discipline; non-blocking. Confirmed there is no 2026-05-02 plan yet.

### 5.3 — Reviews directory was empty at start of this audit

`evidence/governance-2026-05-01/reviews/` existed but was empty before this report was
written. This is the first finding written. Other read-only subagents (Stash/Secret,
Branch/Git, Harness State, P1 Readiness) should write peer reports here per
reset-and-resume-plan.md:151 and `.claude/session.md:30–40`.

### 5.4 — `.gitignore *.png` policy itself

The `*.png` rule (.gitignore:18) is documented as "Launch stabilization artifacts" —
likely added during pre-launch to keep the repo small. With evidence-driven workflow now
established (governance-2026-05-01, stabilization-sprint-* directories), this rule is
likely OBSOLETE and silently degrading evidence commits. Recommend operator decision:
either remove the global rule, or carve `evidence/**` exceptions. This is not
this-pass-blocking but should be raised as a debt item per Environmental Core Value #8.

### 5.5 — Marker discipline (amendment #4)

Reset-and-resume-plan.md:95 explicitly forbids pretextual marker refresh for governance-
only commits. Disposition file does not request any marker writes. Aligned.

---

## Summary table

| Concern | Severity | Group affected | Recommendation |
|---|---|---|---|
| `.gitignore *.png` silently swallows screenshots | HIGH | C3, C6 | Operator decides: `git add -f` / .gitignore exception / accept partial commit |
| Test password fallback in 4 .mjs reproducers | MEDIUM | C6 | Replace with env-var-required, OR accept (documented password) |
| `uploads/10-Day-Serra-April-29-2026` (likely customer data) | MEDIUM | n/a | Add `uploads/` to `.gitignore`; do not commit |
| `.claude/session.md` plan-vs-disposition conflict | MEDIUM | Group A | Plan says NOT committable; disposition says commit. Plan wins per amendment authority |
| `evidence/watchdog-alerts.log` is tracked | LOW | Group C | Plan B4 already handles per amendment #2; tighten disposition wording |
| issues.md has no diff currently | LOW | C2 | Drop C2 from plan if still clean at execution time |
| Plan-vs-disposition mismatch on lane-5/6 screenshots | LOW | C3 | Reconcile lists before staging |
| `.gitignore *.png` rule itself likely obsolete | LOW | n/a | Record as debt item in `issues.md` per Core Value #8 |

---

## Verdicts at-a-glance

- **Active plan:** CORRECT.
- **Timeline contradictions:** NONE.
- **Worktree-disposition concerns:** 5 (3 require operator decision, 2 are tightening).
- **Per-group recommendations:** C1 PROCEED; C2 SKIP-IF-CLEAN; C3 HOLD-AND-DISCUSS;
  C4 PROCEED; C5 PROCEED-for-md (patches per Stash/Secret Reviewer); C6 HOLD-AND-DISCUSS.
- **Other flags:** 5 (most non-blocking; `.gitignore *.png` policy review recommended).
