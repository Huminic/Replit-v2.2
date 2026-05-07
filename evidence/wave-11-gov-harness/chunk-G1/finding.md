# Wave 11-Gov — Chunk G1 — Harness session-marker integrity finding (READ-ONLY)

**Status:** Investigation complete. Fix recipe documented. **NO FIX APPLIED** — `~/Claude-store/sysadmin/harness/` is outside this project's filesystem boundary per CLAUDE.md REM-8-DT incident. Operator applies the fix outside this wave.
**Wave:** 11-Gov
**Chunk:** G1
**Date:** 2026-05-07
**Investigator:** isolated `Agent` (general-purpose) operating in main project worktree, READ-ONLY against this repo + READ-ONLY against `~/Claude-store/sysadmin/harness/`.
**Ratifies:** `evidence/governance-2026-05-01/harness-session-id-marker-gap.md` (prior partial investigation, surfaced 2026-05-03).

---

## 1. Summary (1 paragraph)

The harness completion-marker system writes session-scoped markers at `.claude/state/completion/<kind>.<session-id>.ok` to enforce per-session gate satisfaction. The session id is resolved by `session_session_id()` in `~/Claude-store/sysadmin/harness/lib/common.sh`, which reads `$CLAUDE_SESSION_ID`. **`CLAUDE_SESSION_ID` is never set in the environment that runs the harness hooks** — no hook exports it, no shell start-up exports it, and Claude Code does not pass it through environment to hook subprocesses. Result: every marker collapses to `<kind>.no-session.ok` with body `session=no-session`. Verified live: `env | grep CLAUDE_SESSION_ID` returns empty, and `.claude/state/completion/` contains exactly seven markers, all of the form `<kind>.no-session.ok`. Both write side (`mark-complete.sh`) and read side (`stop-completion-check.sh`) use the same broken resolver, so the gate passes — but the integrity property "this-session marker ≠ any-prior-session marker" cannot be enforced by static inspection. mtime is the only discriminator. Two viable cross-project fix paths exist; **Path B (fallback in `common.sh`) is recommended** because it is a single-file change with bounded blast radius and does not require depending on Claude Code passing `session_id` through any specific channel.

---

## 2. Resolver code — exact lines from `~/Claude-store/sysadmin/harness/lib/common.sh`

Lines 56–58:

```bash
session_session_id() {
  echo "${CLAUDE_SESSION_ID:-no-session}"
}
```

This is the ONLY location in the harness where the session id is resolved. Confirmed by `grep -rn "CLAUDE_SESSION_ID" ~/Claude-store/sysadmin/harness/` → 1 hit, the line above.

---

## 3. Write-side usage — `~/Claude-store/sysadmin/harness/bin/mark-complete.sh`

Lines 49–57 (surrounding context):

```bash
SD="$(ensure_state_dir)"
mkdir -p "$SD/completion" 2>/dev/null
SID="$(session_session_id)"

if [ "$KIND" = "testing-level" ]; then
  MARKER="$SD/completion/testing-level.${LEVEL}.${SID}.ok"
else
  MARKER="$SD/completion/${KIND}.${SID}.ok"
fi
```

Marker filename construction is `<kind>.<SID>.ok` (or `testing-level.<LEVEL>.<SID>.ok`). When `SID="no-session"`, every kind collapses to a single fixed-name path that overwrites prior sessions' markers.

Body of the marker (lines 60–66):

```bash
{
  echo "kind=$KIND"
  [ "$KIND" = "testing-level" ] && echo "level=$LEVEL"
  echo "session=$SID"
  echo "ts=$NOW"
  [ -n "$EVIDENCE" ] && echo "evidence=$EVIDENCE"
} > "$MARKER" 2>/dev/null
```

`session=$SID` — when SID is `no-session`, body is also indistinguishable across rounds.

---

## 4. Read-side usage — `~/Claude-store/sysadmin/harness/hooks/stop-completion-check.sh`

Line 34:

```bash
SID="$(session_session_id)"
LOG="$SD/changed-files-${SID}.log"
```

Lines 64–67 — required marker check:

```bash
REQUIRED="verify-scope proof code-review"
MISSING=""
for kind in $REQUIRED; do
  MARKER="$SD/completion/${kind}.${SID}.ok"
  [ -f "$MARKER" ] || MISSING="$MISSING $kind"
done
```

Lines 74, 81, 89 — conditional markers also use the same SID:

```bash
MARKER="$SD/completion/integration-safety.${SID}.ok"
MARKER="$SD/completion/launch-check.${SID}.ok"
MARKER="$SD/completion/logic-review.${SID}.ok"
```

Read side uses the identical resolver. The Stop hook accepts a stale `<kind>.no-session.ok` marker from a prior session as if it satisfies the current session's gate. The hook's edit-tracking log (`changed-files-no-session.log`) ALSO collides across sessions — but that file uses append (`>>` line 35 of `post-edit-tracker.sh`), so prior session edits accumulate rather than overwrite. That is a separate but related defect.

---

## 5. Is `CLAUDE_SESSION_ID` exported anywhere in the harness?

**No.** Verified by:

```
grep -rn "CLAUDE_SESSION_ID" /home/ubuntu/Claude-store/sysadmin/harness/
→ /home/ubuntu/Claude-store/sysadmin/harness/lib/common.sh:57:  echo "${CLAUDE_SESSION_ID:-no-session}"
```

One hit only — the read inside `session_session_id()`. No `export CLAUDE_SESSION_ID=…` anywhere. `session-start.sh` does not read stdin (no `cat` of stdin, no `read_stdin_json` call, no `json_get` usage). It simply prints a banner.

The four hooks that DO read stdin JSON (`post-edit-tracker.sh`, `pre-compact.sh` — actually does not, only sources common.sh, but `session-end.sh` doesn't either; `user-prompt-submit.sh`, `subagent-stop-report.sh` (subagent-stop reads stdin not really; let me restate: `post-edit-tracker.sh` and `user-prompt-submit.sh` are confirmed stdin readers; `stop-completion-check.sh` does not currently read stdin) parse only `tool_name`, `tool_input.file_path`, and `prompt`. None extract `session_id`.

Live env confirmation in this investigator session:

```
$ env | grep -i CLAUDE_SESSION
(empty)
$ echo "CLAUDE_SESSION_ID=[${CLAUDE_SESSION_ID:-UNSET}]"
CLAUDE_SESSION_ID=[UNSET]
```

Live marker-directory confirmation:

```
$ ls /home/ubuntu/Claude-store/nexxus2.2_replit/.claude/state/completion/
code-review.no-session.ok
integration-safety.no-session.ok
launch-check.no-session.ok
proof.no-session.ok
testing-level.sprint.no-session.ok
testing-level.step.no-session.ok
verify-scope.no-session.ok
```

Seven markers, all `*.no-session.ok`. The pattern from the prior investigation persists.

---

## 6. Path A — export `CLAUDE_SESSION_ID` in `session-start.sh`

**Mechanism.** Per Anthropic's Claude Code hook documentation, hooks receive a JSON payload on stdin that includes a `session_id` field (UUID v4). `SessionStart` is called once per session at startup; if it reads stdin, it can extract `session_id` and persist it to a file the harness can read on subsequent invocations.

**Catch.** Bash `export` from a hook subprocess does NOT propagate to other hook subprocesses or to subagent shells — each hook is a fresh subprocess of Claude Code. So the value MUST be persisted to a file (e.g., `.claude/state/session-id`), then re-read by `session_session_id()` in `common.sh`. This is therefore a TWO-FILE change.

**Proposed change.**

File 1 — `~/Claude-store/sysadmin/harness/hooks/session-start.sh` — add at top (after sourcing common.sh, before banner output):

```bash
# Capture session id from stdin JSON payload (Claude Code passes session_id in SessionStart)
STDIN_DATA=$(cat 2>/dev/null || echo "{}")
CLAUDE_SID=$(echo "$STDIN_DATA" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('session_id', ''))
except Exception:
    pass
" 2>/dev/null)

SD="$(ensure_state_dir)"
if [ -n "$CLAUDE_SID" ] && [ -n "$SD" ]; then
  echo "$CLAUDE_SID" > "$SD/session-id" 2>/dev/null
fi
```

File 2 — `~/Claude-store/sysadmin/harness/lib/common.sh` — modify `session_session_id()`:

```bash
session_session_id() {
  if [ -n "${CLAUDE_SESSION_ID:-}" ]; then
    echo "$CLAUDE_SESSION_ID"
    return
  fi
  local sd
  sd="$(state_dir)"
  if [ -n "$sd" ] && [ -f "$sd/session-id" ]; then
    cat "$sd/session-id"
    return
  fi
  echo "no-session"
}
```

**Pros.**

- Uses Claude Code's actual stable session id — guaranteed unique, persists across hook invocations within a session.
- If `CLAUDE_SESSION_ID` env var ever DOES get set in future, the resolver still honors it (precedence).

**Cons.**

- Two-file change (session-start.sh AND common.sh).
- Depends on assumption that Claude Code passes `session_id` in `SessionStart` stdin JSON. If the assumption is wrong, fallback file never gets written, and resolver still returns `no-session`. (Mitigation: verify via a one-line `tee` debug write in session-start.sh BEFORE rolling out — operator-side verification step.)
- session-start.sh currently does NOT consume stdin. Adding `cat` is not breaking (Claude Code passes empty JSON if there's no payload to read), but it's a behavior change.
- A subagent (`Agent` tool) creates its OWN hook context but inherits the session id from the parent — but no SessionStart hook fires for subagents. So subagent runs would still need to read the parent's `session-id` file. The proposed `common.sh` fallback handles this correctly (reads the persisted file).
- If two parallel sessions share the same project (e.g., two terminals), they both write to `.claude/state/session-id` and race. Last-writer-wins; markers from one session collide with the other. Path A does NOT solve concurrent-session-in-same-project.

---

## 7. Path B — fallback in `common.sh`

**Mechanism.** Modify `session_session_id()` to derive a deterministic-but-distinct identifier when `CLAUDE_SESSION_ID` is unset. The identifier should be stable for the duration of a single session but distinct across sessions. The simplest stable-per-session source available without external context is a file persisted to `.claude/state/`. Generate it on first call, then re-read on subsequent calls.

**Proposed change.**

Single file — `~/Claude-store/sysadmin/harness/lib/common.sh` — replace lines 56–58:

```bash
session_session_id() {
  if [ -n "${CLAUDE_SESSION_ID:-}" ]; then
    echo "$CLAUDE_SESSION_ID"
    return
  fi
  local sd
  sd="$(state_dir)"
  if [ -z "$sd" ]; then
    echo "no-session"
    return
  fi
  local sid_file="$sd/session-id"
  # Generate once per "session" — keyed by project + first invocation epoch.
  # If file exists and is newer than the most recent session-start indicator,
  # reuse it; else generate a fresh one.
  if [ ! -f "$sid_file" ]; then
    mkdir -p "$sd" 2>/dev/null
    # Compose: epoch + pid + branch (truncated)
    local ts pid br
    ts="$(date -u +%s)"
    pid="$$"
    br="$(cd "$(project_root)" 2>/dev/null && git rev-parse --abbrev-ref HEAD 2>/dev/null | tr '/' '-' | head -c 24 || echo "nobranch")"
    echo "auto-${ts}-${pid}-${br}" > "$sid_file" 2>/dev/null
  fi
  cat "$sid_file" 2>/dev/null || echo "no-session"
}
```

**Tradeoff explicitly documented.** The fallback session id is keyed off the FIRST invocation of `session_session_id()` within the project. As long as `.claude/state/session-id` persists, all subsequent calls (write side AND read side) return the same value. The risk is **the file is never explicitly cleared** — across true session boundaries (Claude Code terminating and restarting), the same project will continue using the same `auto-…` id until either (a) the file is manually deleted, (b) `state_dir` is wiped, or (c) a future session-start hook truncates it.

To make Path B robust, the proposal pairs it with a one-line addition to `session-start.sh` to truncate the persisted file at session boundary:

```bash
# in session-start.sh, after ensure_state_dir
rm -f "$(ensure_state_dir)/session-id" 2>/dev/null
```

This guarantees that each new Claude Code session generates a fresh `auto-<epoch>-<pid>-<branch>` id when `CLAUDE_SESSION_ID` is unset.

**Pros.**

- Single primary file change (common.sh). Optional one-line addendum to session-start.sh for robustness.
- Independent of Claude Code's stdin payload format — works even if Claude Code never passes `session_id`.
- Encodes branch + pid + epoch — provides debugging breadcrumbs (you can see WHICH session wrote a marker by reading the id).
- If `CLAUDE_SESSION_ID` ever DOES get set, the resolver honors it first.

**Cons.**

- Auto-generated ids are not the same as Claude Code's UUID — no cross-reference to logs / sessions/<pid>.json files.
- If the operator manually deletes `.claude/state/session-id` mid-session (or `state_dir` is wiped), the next call generates a new id and prior-round markers become orphaned. (Same risk as Path A.)
- Adds branch lookup to a hot-path utility (called from every hook). Performance impact is sub-millisecond but non-zero.

---

## 8. Recommendation — Path B

Recommended path: **Path B (fallback in `common.sh`, single-file primary change + one-line addendum to `session-start.sh`).**

Reasoning, against the criteria:

| Criterion | Path A | Path B |
|---|---|---|
| Smallest blast radius | Two files (session-start.sh + common.sh); session-start.sh starts consuming stdin (new behavior) | One primary file (common.sh); optional one-line addendum to session-start.sh (rm -f) |
| Easiest to verify | Depends on assumption that Claude Code passes `session_id` in SessionStart stdin (must verify before rolling out) | Verifiable locally: source common.sh, call `session_session_id`, read `.claude/state/session-id` |
| Lowest risk of breaking existing behavior | session-start.sh currently does not consume stdin; adding stdin consumption is a behavior change that could interact with future Claude Code versions | common.sh change is internal to the resolver; no caller has to change |
| Independence from upstream tool changes | Tied to Claude Code's hook payload schema | Independent of Claude Code internals |
| Debugability | Real Claude Code UUID; cross-references `sessions/<pid>.json` | `auto-<epoch>-<pid>-<branch>` — readable but not tied to Claude Code internals |

Path B wins on blast radius, verifiability, and independence. Path A's only structural advantage is using Claude Code's "real" id, which has debugging value but is not required for marker-integrity correctness — Path B's `auto-…` ids are sufficient to make `<kind>.<sid>.ok` filenames distinct across sessions.

If the operator wants the BEST possible solution combining both: Path A's session-start.sh stdin capture + Path B's `common.sh` fallback (try `CLAUDE_SESSION_ID` env, then captured-file, then auto-generate). The resolver in §6 Path A already does this — it just needs Path B's auto-generate branch added as the final fallback. That hybrid is the cleanest end-state but is the highest-blast-radius change of the three (touches both files plus the resolver gets two fallbacks). Recommended ONLY if operator wants to invest in maximal correctness now. For the v2.2 release window where governance debt resolution is the goal, the simpler Path B suffices.

---

## 9. Test plan operator can run after applying the fix

Pre-condition: fix applied to `~/Claude-store/sysadmin/harness/lib/common.sh` (and optionally `session-start.sh`).

### Step 1 — clean slate

```
rm -rf /home/ubuntu/Claude-store/nexxus2.2_replit/.claude/state/completion/*.no-session.ok
rm -f /home/ubuntu/Claude-store/nexxus2.2_replit/.claude/state/session-id
```

### Step 2 — verify resolver returns a non-`no-session` value

```
cd /home/ubuntu/Claude-store/nexxus2.2_replit
. /home/ubuntu/Claude-store/sysadmin/harness/lib/common.sh
CLAUDE_PROJECT_DIR="$(pwd)" session_session_id
```

Expected (Path B): `auto-1746...-<pid>-<branch>` — NOT `no-session`.

### Step 3 — write a marker, confirm filename does NOT contain `no-session`

```
CLAUDE_PROJECT_DIR="$(pwd)" /home/ubuntu/Claude-store/sysadmin/harness/bin/mark-complete.sh verify-scope test-evidence-path
ls .claude/state/completion/
```

Expected: a file `verify-scope.auto-<epoch>-<pid>-<branch>.ok`. NOT `verify-scope.no-session.ok`.

### Step 4 — start a NEW Claude Code session in a different terminal, write another marker

```
# in new session shell
cd /home/ubuntu/Claude-store/nexxus2.2_replit
CLAUDE_PROJECT_DIR="$(pwd)" /home/ubuntu/Claude-store/sysadmin/harness/bin/mark-complete.sh proof test-evidence-path-2
ls .claude/state/completion/
```

Expected: TWO distinct marker files with TWO distinct `auto-…` SIDs. (If `session-start.sh` does NOT do the `rm -f` cleanup, this step requires manually clearing `.claude/state/session-id` between sessions — that's the tradeoff in §7.)

### Step 5 — Stop hook smoke

Run `/handoff` and let the Stop hook fire normally. Expected: gate passes (markers present for the current SID); blocking message does NOT appear.

### Step 6 — re-audit prior markers

Per the prior investigation file action item #4: re-confirm Chunk 1A and 1B markers. After the fix, OLD `.no-session.ok` markers should be moved aside or deleted. New markers from any subsequent gate runs will use the new sid format.

---

## 10. Risk assessment — when does this bite in practice?

**Severity scaled by scenario:**

| Scenario | Likelihood | Impact | Net risk |
|---|---|---|---|
| Single-session, single-orchestrator dev work (e.g., Chunk 1A, 1B, 1C in series) | Already happening | Markers overwrite prior session markers, but only ONE session is currently writing — so the gate passes correctly | LOW |
| Two parallel Claude Code sessions in same project (e.g., main worktree + a `wave/*` worktree both running orchestrator) | Possible during the wave-based workflow | Both sessions write to `<kind>.no-session.ok` — last writer wins; the other session's gate may pass on stale markers from the wrong session | MEDIUM |
| Pre-prod / post-prod testing-level run executed in a different harness invocation than the dev orchestrator | Required by `~/Claude-store/sysadmin/harness/TESTING_DOCTRINE.md` for production deploy claims | Pre-prod claims could pass on stale dev markers; provenance of the claim becomes unverifiable | HIGH for any production-deploy claim |
| CI / automation invoking `mark-complete.sh` in parallel | Not currently used | Race conditions on `<kind>.no-session.ok` overwrites; markers are unreliable | HIGH if CI lands |
| Multi-project orchestration (one Claude Code agent driving Nexxus AND PersonaBox) | Cross-project work is forbidden by REM-8-DT, but a single orchestrator could legitimately invoke `mark-complete.sh` for two different projects in sequence | Markers are scoped per-project (different `state_dir`), but `no-session` collisions still happen WITHIN each project | MEDIUM |

**When does this bite the v2.2 launch specifically?**

Per the prior investigation file's "Why this matters before deploy" section, the risk surfaces when pre-prod or post-prod testing-level claims are made by a session OTHER than the current dev orchestrator. The `TESTING_DOCTRINE.md` requires those claims to come with their own gate-passing evidence; if they share `<kind>.no-session.ok` paths with prior dev sessions, the claim is unverifiable. That is the launch-blocking scenario the prior file flagged.

**Practical mitigation while the fix is pending.**

The current chunk-merge protocol (operator + orchestrator confirm markers were written by THIS session via mtime + content inspection) is sufficient for SINGLE-session dev work. For ANY session that crosses a session boundary (subagent dispatch via fresh `Agent` tool, multi-terminal work, pre-prod claim) the operator must manually verify mtime and reset the marker directory between sessions. This is fragile but workable for the current wave cadence. Apply the fix before any post-Batch-1 production deploy claim.

---

## 11. Sources cited

- `~/Claude-store/sysadmin/harness/lib/common.sh:56-58` — resolver definition
- `~/Claude-store/sysadmin/harness/bin/mark-complete.sh:49-57,60-66` — marker filename construction + body
- `~/Claude-store/sysadmin/harness/hooks/stop-completion-check.sh:34,64-67,74,81,89` — read-side resolver + per-kind marker lookup
- `~/Claude-store/sysadmin/harness/hooks/session-start.sh:1-85` — confirmed: does NOT read stdin, does NOT export `CLAUDE_SESSION_ID`
- `~/Claude-store/sysadmin/harness/hooks/post-edit-tracker.sh:11-35` — confirmed: reads stdin for tool_name/file_path only, not session_id
- `~/Claude-store/sysadmin/harness/hooks/session-end.sh:1-63` — confirmed: uses `session_session_id()`, does not capture session_id
- `~/Claude-store/sysadmin/harness/hooks/pre-compact.sh:1-53` — confirmed: uses `session_session_id()`, does not capture session_id
- `/home/ubuntu/Claude-store/nexxus2.2_replit/.claude/state/completion/` — live state: 7 marker files, all `*.no-session.ok`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/.claude/session-snapshot.md:4` — `Session: no-session`
- `/home/ubuntu/.claude/sessions/2280852.json` — confirms Claude Code maintains its own `sessionId` UUID; not currently propagated to harness env
- `evidence/governance-2026-05-01/harness-session-id-marker-gap.md` — prior partial investigation; this finding ratifies and extends

---

## 12. Stop conditions honored

- NO edits made to `~/Claude-store/sysadmin/harness/`. All commands READ-ONLY.
- NO commits to `batch-1-finish-line` direct or to `main`.
- Investigation findings ALIGN with prior investigation file (`evidence/governance-2026-05-01/harness-session-id-marker-gap.md`). Resolver behaves exactly as the prior file describes; resolver code is unchanged. Prior file's Option 2 ("auto-derive in `common.sh`") corresponds to this finding's Path B (recommended).
