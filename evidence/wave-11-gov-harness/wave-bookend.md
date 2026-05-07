# Wave Bookend — 11-Gov — Harness session-marker integrity + D-I3 console-error finding (READ-ONLY / INVESTIGATION + DOCS)

## OPENING

**Wave:** 11-Gov
**Phase:** 11 — Release Gov + Final E2E (governance subset)
**Date opened:** 2026-05-07
**Goal (plain English, 1 sentence):** Investigate two governance debt items and produce actionable artifacts: (G1) ratify and document the harness session-marker integrity gap (`.no-session.ok` markers because `CLAUDE_SESSION_ID` is unset) plus a cross-project fix recipe operator can apply; (G2) investigate the D-I3 "console error on every route" finding from Stabilization Sprint 2026-05-01, classify, and either fix-in-scope or file as a v2.2 issue.
**Why necessary for v2.2 release:** Both items are governance / quality debt. The `.no-session.ok` marker gap is documented as "MUST resolve before any production deploy of Batch 1" per the existing investigation file. The D-I3 console error has been on every route since at least 2026-05-01 — investigating before launch is a release-quality improvement; the fix may or may not land in v2.2.

### Existing evidence to reuse / ratify

- `evidence/governance-2026-05-01/harness-session-id-marker-gap.md` (untracked from a prior session) — partial G1 investigation already done. Documents:
  - Resolver `session_session_id()` returns `"no-session"` when `CLAUDE_SESSION_ID` unset
  - 3 rounds of marker writes all collide on `<kind>.no-session.ok` with identical `session=no-session` body
  - Discriminator across rounds is mtime alone
  - Risk surfaces in multi-session / pre-prod scenarios
- `evidence/stabilization-sprint-2026-05-01/finish-line-plan.md:147,203,276` — D-I3 originating context: "Console error on every route" surfaced during Step A Playwright walk; was deferred to Batch 3 endpoint validation; never investigated.
- `evidence/wave-1C-comprehensive-e2e/console-network/health-summary.md` — Wave 1C E2E captured console health; cross-check whether D-I3 console error is still present today.

### Current status of this component

PARTIAL — Phase 11 (Release Gov) is the launch gate; harness session-marker BROKEN (per `plan.md`); D-I3 console-error is OPEN (parked from 2026-05-01). Both are governance / quality debt; not customer-facing.

### In scope (READ-ONLY for this project; READ-ONLY against `~/Claude-store/sysadmin/harness/` for fix-recipe documentation)

**Chunk G1 — Harness session-marker integrity (cross-project fix recipe)**

- READ-ONLY:
  - `~/Claude-store/sysadmin/harness/lib/common.sh` — confirm `session_session_id()` resolver
  - `~/Claude-store/sysadmin/harness/bin/mark-complete.sh` — confirm where `SID="$(session_session_id)"` is used
  - `~/Claude-store/sysadmin/harness/hooks/stop-completion-check.sh` — confirm read-side resolver
  - `~/Claude-store/sysadmin/harness/hooks/session-start.sh` — confirm whether `CLAUDE_SESSION_ID` is exported there
- Output: `evidence/wave-11-gov-harness/chunk-G1/finding.md` containing:
  - Re-confirmation of the gap (already documented in `evidence/governance-2026-05-01/harness-session-id-marker-gap.md`; G1 ratifies + extends)
  - **Specific cross-project fix recipe** — exact files + lines + suggested code change. Operator applies (cross-project boundary per CLAUDE.md). Two paths:
    - Path A: export `CLAUDE_SESSION_ID` in `session-start.sh` (if Claude Code passes it via environment or stdin JSON)
    - Path B: have `session_session_id()` fall back to a deterministic-but-distinct identifier (e.g. `$$` + start time + branch)
  - Risk assessment (when does the marker collision actually bite? — multi-session / pre-prod scenarios)
- **NO FIX APPLIED in this wave** (`~/Claude-store/sysadmin/harness/` is outside this project's filesystem boundary per CLAUDE.md REM-8-DT incident).
- Also: copy the existing `evidence/governance-2026-05-01/harness-session-id-marker-gap.md` content into `chunk-G1/` for wave-evidence completeness, OR commit the original file as-is (cross-reference) — investigator picks the cleaner path.

**Chunk G2 — D-I3 console-error finding investigation**

- LIVE WALK on `localhost:5000` as `serra_honda@huminic.ai` (read-only):
  - Capture console errors on `/login` and at least 3 representative routes (`/`, `/sales`, `/insights`)
  - Identify the specific error message + source location
  - Classify:
    - **Mechanical fix in v2.2** — clear bug, fix-in-scope (one-LOC fix or similar)
    - **Issue file** — bug confirmed but fix scope is bigger or needs design
    - **Benign** — turns out to be a known dev-tool / source-map / 3rd-party noise; document and dismiss
- Cross-check against Wave 1C E2E console health-summary to see if it's the SAME error or a different one.
- Output: `evidence/wave-11-gov-harness/chunk-G2/finding.md` with classification + 1-paragraph rationale + recommended action.
- If classification is "Mechanical fix in v2.2": investigator STOPS, returns to orchestrator with proposed fix. Orchestrator decides whether to dispatch a fixer chunk (G3) within this wave or escalate.
- If classification is "Issue file" or "Benign": file/document and close.

### Out of scope (explicit)

- ANY edit to files outside this project's filesystem boundary (`~/Claude-store/sysadmin/harness/` is OFF LIMITS for fixes per CLAUDE.md REM-8-DT)
- ANY harness behavior change that depends on the unfixed session-marker gap (we accept the gap for this session per documented protocol)
- ANY UI redesign; D-I3 fix (if applied) must be minimal mechanical
- ANY DB writes / migrations / provider sends / pm2 restart on live
- D-I2 (local main divergence) — explicitly parked, do not touch
- Wave 11A scope (Final E2E + go/no-go) — that's a separate wave

### Operator decisions required BEFORE autonomy starts

NONE for the investigation portion. After G1+G2 finish, if G2 yields a "Mechanical fix in v2.2" classification, orchestrator decides on dispatching a fixer chunk (advocate authority for in-scope mechanical fixes; explicit ask if fix touches anything operator should know about).

### Credentials / accounts / allowlists required

- Read-only login as `serra_honda@huminic.ai` for G2 console walk

### Provider-send approvals required

NONE.

### UI scope markers required

- Conditional only — if G2 classification triggers a v2.2 mechanical fix, scope marker(s) created at fix time per the file(s) touched.

### Files likely touched

- `evidence/wave-11-gov-harness/chunk-G1/finding.md` (NEW)
- `evidence/wave-11-gov-harness/chunk-G2/finding.md` (NEW)
- `evidence/wave-11-gov-harness/wave-bookend.md` (this file)
- `evidence/wave-11-gov-harness/verifier-audit/` (3 verifier verdicts)
- `evidence/governance-2026-05-01/harness-session-id-marker-gap.md` (existing untracked; will be committed as-is into batch-1-finish-line via this wave for repo-history)
- `issues.md` — possibly NEW entry `I-NEW-2026-05-07-CONSOLE-ERROR` if G2 classification triggers it
- (Conditional) `client/src/...` if G2 surfaces a mechanical v2.2 fix — declared per-file scope marker

### Git branch / worktree strategy

- Wave branch: `wave/11-gov/harness-and-console` off `batch-1-finish-line` (HEAD `e4aa3b0`)
- Investigator works in main project worktree (read-only against this repo + read-only against `~/Claude-store/sysadmin/harness/`); commits investigation files directly on wave branch
- ff-only merge `wave/11-gov/harness-and-console` → `batch-1-finish-line` at CLOSING

### Agent-team roster

- `team-lead` (orchestrator)
- isolated `Agent` investigator (general-purpose, no worktree — main project read-only) for G1 + G2

### Isolated audit subagents (gate-only, no team mailbox)

- `blind-verifier`
- `scope-guardian`
- `drift-detector`

### Stop conditions (explicit)

- ANY edit to files at `~/Claude-store/sysadmin/harness/` — STOP, escalate (cross-project boundary)
- ANY edit beyond the declared evidence + bookend + (conditional) one client/src file for G2 fix — STOP
- G2 classification = "Mechanical fix in v2.2" but fix appears non-trivial — STOP, escalate
- G1 fix recipe ambiguous — surface ambiguity, do not fabricate

### Chunk list

- **G1** — Harness session-marker integrity investigation + cross-project fix recipe (read-only)
- **G2** — D-I3 console-error walk + classification (read-only)
- **(G3 conditional)** — Mechanical v2.2 fix from G2 finding, if applicable

### Proof required

- Read-only investigation: each chunk produces a finding file
- (G3 conditional) — Δ1 tsc + vitest PASS; Δ2 Playwright walk showing console error gone

### Expected evidence path

- `evidence/wave-11-gov-harness/chunk-G1/finding.md`
- `evidence/wave-11-gov-harness/chunk-G2/finding.md`
- `evidence/wave-11-gov-harness/chunk-G3/` (conditional)
- `evidence/wave-11-gov-harness/verifier-audit/`
- `evidence/wave-11-gov-harness/wave-bookend.md` (this file: OPENING + CLOSING)

---

## CLOSING (audited 2026-05-07)

**Closed:** 2026-05-07
**Wave-level verdict:** **PASS — investigation complete; no v2.2-blocking issues surfaced.**
- **G1** — harness session-marker integrity gap re-confirmed; cross-project fix recipe documented for operator (Path B recommended: single-file fallback in `common.sh` lines 56-58 + one-line cleanup in `session-start.sh`). NO FIX APPLIED in this wave per CLAUDE.md REM-8-DT cross-project boundary rule.
- **G2** — D-I3 console-error finding classified BENIGN. The "every route" framing in original D-I3 KD-6 was a cumulative-console-buffer artifact; re-walk on post-3F-B HEAD shows zero console errors on authenticated routes. The single error captured (`POST /api/auth/refresh 400` on `/login` pre-login) is intentional per server-side comment. NO G3 fix dispatched.

### Wave history (linear, all on `wave/11-gov/harness-and-console`)

| SHA | Commit |
|---|---|
| `e4aa3b0` | (base) `docs(wave-3F-B): handoff update post-merge` — pre-Wave-11-Gov tip of `batch-1-finish-line` |
| `efe1525` | `evidence(wave-11-gov): Chunk G1 harness session-marker integrity investigation + fix recipe (READ-ONLY)` |
| `1cfbd2e` | `evidence(wave-11-gov): Chunk G2 D-I3 console-walk + ratify prior harness session-marker investigation` |
| (next) | `evidence(wave-11-gov): CLOSING bookend + 3 verifier verdicts` |

Aggregate: 0 product-code chunks + 2 read-only investigations / 0 product LOC / 2 commits + 1 closing-evidence commit. Plus `evidence/governance-2026-05-01/harness-session-id-marker-gap.md` ratified into repo.

### Investigation findings

#### G1 — Harness session-marker integrity (cross-project fix recipe)

The `session_session_id()` resolver in `~/Claude-store/sysadmin/harness/lib/common.sh:56-58` returns `"no-session"` when `CLAUDE_SESSION_ID` is unset. Verified live: `env | grep CLAUDE_SESSION_ID` returns empty. Both write side (`mark-complete.sh:51`) and read side (`stop-completion-check.sh:34,64-67,74,81,89`) use the same broken resolver.

**Recommended fix (Path B):**
- Replace `~/Claude-store/sysadmin/harness/lib/common.sh:56-58` to fall back to a deterministic-but-distinct identifier (`auto-<epoch>-<pid>-<branch>`) persisted to `.claude/state/session-id`
- Add one line `rm -f "$(ensure_state_dir)/session-id" 2>/dev/null` to `~/Claude-store/sysadmin/harness/hooks/session-start.sh` after the existing `SD="$(ensure_state_dir)"` reference

Path B chosen over Path A because it's single-file (lower blast radius), independent of upstream Claude Code payload schema, and verifiable without Claude Code env changes.

**Risk:** the gap bites in multi-session / pre-prod scenarios where multiple harness invocations write to the same `.no-session.ok` paths. For single-session dev work (current state), the gap has been benign.

**Test plan after operator applies fix** — see G1 finding §9.

#### G2 — D-I3 console-error finding

Walk as `serra_honda@huminic.ai` on `localhost:5000` post-3F-B HEAD `e4aa3b0`:
- `/login` (pre-login): 1 error — `POST /api/auth/refresh 400` (intentional per `server/lib/refreshTokenRotation.ts:202-204`; client handles via `AuthContext.tsx:289` → `tryRefreshToken()` returning false)
- `/`, `/sales`, `/insights`, `/teambox`, `/marketing`, `/management`: ZERO errors
- Cross-check against Wave 1C E2E (`evidence/wave-1C-comprehensive-e2e/console-network/health-summary.md`): consistent — 1C reported 0 console errors during authenticated walk

The "every route" framing in original D-I3 KD-6 was an artifact of the cumulative console buffer carrying the residual error across navigations within a single Playwright session, not per-route re-emission. The blind-verifier independently confirmed: `AuthProvider` mounts once per SPA session, `tryRefreshToken()` fires once on mount, SPA route-change navigations don't remount.

**Classification: BENIGN.** No G3 dispatched.

**Optional v2.3 hygiene improvement filed in finding §6b as `AD-NEW-G2-CONSOLE`** — cosmetic console noise on /login pre-login could be silenced by client-side filtering. NOT v2.2 scope.

### Audit chain (3 blind verifiers at gate, all PASS)

| Verifier | Type | Verdict | Evidence |
|---|---|---|---|
| `blind-verifier` (general-purpose) | subagent at gate | **AGREE** — all 6 independent checks PASS; cross-project boundary independently verified via mtime + git-history; BENIGN classification independently defensible | `verifier-audit/blind-verifier-verdict.md` |
| `scope-guardian` (subagent type) | subagent at gate | **PASS** — 6 files in declared evidence-only scope; zero product code; cross-project boundary intact (`find` returns zero harness files modified); zero schema/provider/live-deploy actions | `verifier-audit/scope-guardian-verdict.md` |
| `drift-detector` (general-purpose) | subagent at gate | **NO DRIFT** — all 7 hierarchy boundary checks PASS; G3 correctly NOT dispatched; AD-NEW-G2-CONSOLE properly tagged for v2.3 not dragged into v2.2 | `verifier-audit/drift-detector-verdict.md` |

### Stop conditions — all PASS

- Zero edits to `~/Claude-store/sysadmin/harness/` (cross-project boundary respected per REM-8-DT)
- Zero product code edits (all 6 files in `evidence/`)
- Zero DB writes / migrations / schema changes
- Zero provider sends
- Zero pm2 restart on `live.huminic.app` (Coolify untouched; live still on `becb739`)
- No commits to `batch-1-finish-line` direct or to `main`
- No force pushes / `git rebase -i` / destructive resets
- D-I2 (local main divergence) explicitly NOT touched (still parked)

### Operator action items (post-merge)

These are operator decisions / cross-project actions; they are NOT performed by the wave:

1. **G1 — apply harness fix.** Edit `~/Claude-store/sysadmin/harness/lib/common.sh:56-58` per Path B in G1 finding §7. Add the one-line cleanup in `session-start.sh` per finding §7. Then run G1 finding §9 test plan to verify markers now write with distinct session IDs.

2. **G2 — document KD-6 closeout.** Update `evidence/stabilization-sprint-2026-05-01/finish-line-plan.md:276` KD-6 row to RESOLVED status using the suggested wording in G2 finding §6a. (No issues.md edit needed; KD-6 lives in finish-line-plan.md, not issues.md.)

3. **G2 optional** — file `AD-NEW-G2-CONSOLE` in v2.3 backlog if operator wants the cosmetic console noise on /login pre-login silenced via client-side filtering. Per G2 finding §6b. NOT v2.2 scope.

### Cross-references

- `evidence/governance-2026-05-01/harness-session-id-marker-gap.md` — original G1 investigation (ratified into repo this wave)
- `evidence/stabilization-sprint-2026-05-01/finish-line-plan.md:147,203,276` — D-I3 originating context (KD-6)
- `evidence/wave-1C-comprehensive-e2e/console-network/health-summary.md` — Wave 1C E2E console health (cross-check baseline)
- `~/Claude-store/sysadmin/harness/lib/common.sh:56-58` — the broken resolver
- `~/Claude-store/sysadmin/harness/bin/mark-complete.sh:51` — write-side resolver use
- `~/Claude-store/sysadmin/harness/hooks/stop-completion-check.sh:34,64-67,74,81,89` — read-side resolver use
- `client/src/contexts/AuthContext.tsx:289-304` — client-side refresh-probe + handler
- `server/lib/refreshTokenRotation.ts:202-204` — server-side intentional 400 + comment

### Merge sequence (executed by orchestrator after CLOSING commit)

1. `git checkout batch-1-finish-line && git merge --ff-only wave/11-gov/harness-and-console`
2. `git push origin batch-1-finish-line`
3. **Live deploy: deferred to Wave 11A release-cycle gate**

### Next-wave readiness

- **YES** — Wave 2A (provider-proof) is independent. Operator may want to populate textmagic test-number allowlist before opening to avoid SMS-pinging operator's personal phone for every chunk.
- **YES** — Wave 2B (widget E2E) is independent.
- **YES** — Wave 3A/3B/3C (UI scope-marker waves) are independent.
- **YES** — Wave 9-Sec triage opens with operator decision.
- **YES** — Wave 11A (Final E2E + go/no-go) — could open after harness fix lands; ideally Wave 11A run with the fixed marker behavior so each session has distinct IDs.

