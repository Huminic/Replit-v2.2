# Harness governance issue — CLAUDE_SESSION_ID / no-session marker tagging gap

**Status:** OPEN, non-blocking for current dev work. MUST resolve before any production deploy of Batch 1.
**Surfaced:** 2026-05-03 during Chunk 1B chunk-merge marker writes (continuation of finding first noted at Chunk 1A merge).
**Severity:** Low for single-session dev work; Medium for any multi-session/multi-environment workflow.
**Owner:** TBD — operator decision (either harness owner or in-band fix request).
**Scope:** Harness internals (`~/Claude-store/sysadmin/harness/lib/common.sh` + `bin/mark-complete.sh` + `hooks/stop-completion-check.sh`).
**Recorded by operator instruction:** 2026-05-03 — surface as non-blocking governance issue; do NOT fix during Chunk 1C.

---

## What

The harness session-id resolver in `~/Claude-store/sysadmin/harness/lib/common.sh`:

```bash
session_session_id() {
  echo "${CLAUDE_SESSION_ID:-no-session}"
}
```

In the current orchestrator session, `$CLAUDE_SESSION_ID` is unset in the environment (verified via `env | grep CLAUDE_SESSION_ID` — no match). Result: every marker written via `mark-complete.sh` lands as `<kind>.no-session.ok` and contains `session=no-session` in its body.

Both write side (`mark-complete.sh`) AND read side (`stop-completion-check.sh`) use the same resolver, so the Stop hook accepts these markers — they pass the gate. But the integrity property "this-session marker ≠ any-prior-session marker" is NOT enforceable by static inspection of marker filenames or `session=` field. Only mtime distinguishes a fresh write from a stale recycled marker.

## Evidence (observable in this repo)

| Round | Marker | mtime | session= |
|---|---|---|---|
| Stale prior (Apr 30 / May 1) | `verify-scope.no-session.ok` | `2026-04-30T14:01Z` (pre-overwrite) | `no-session` |
| Chunk 1A merge | `verify-scope.no-session.ok` | `2026-05-02T04:37:24Z` (overwrote stale) | `no-session` |
| Chunk 1B merge | `verify-scope.no-session.ok` | `2026-05-03T04:23:39Z` (overwrote 1A) | `no-session` |

Filename + `session=` field identical across all rounds. Discriminator is mtime alone.

## Why this matters before deploy

Pre-prod / live-deploy testing levels (per `~/Claude-store/sysadmin/harness/TESTING_DOCTRINE.md`) presumably run in a different harness invocation than the current orchestrator. If THAT session ALSO has `CLAUDE_SESSION_ID` unset, its markers would write to the same `.no-session.ok` paths, overwriting the dev session's. The claim "this session passed gate" becomes ambiguous — was it dev or pre-prod?

For dev work in Batch 1 (Chunks 1A and 1B), this has been fine because there is only one orchestrator session writing markers. For Batch 2 (provider round-trips), Batch 3 (UI changes + final E2E), and the eventual pre-prod/post-prod testing-level claims, if multiple sessions touch the harness in sequence, marker confusion becomes a real risk.

## Why this is not fixed during Chunk 1C

Operator instruction 2026-05-03: "Do not fix harness internals during 1C." 1C is metric-heavy and high-risk; harness changes mid-chunk would introduce unrelated risk.

## Resolution paths (operator decision deferred)

Three options, in increasing order of invasiveness:

1. **Manual export per orchestrator session.** Operator sets a unique `CLAUDE_SESSION_ID` value (e.g., session start ISO timestamp or short UUID) in the shell that runs the orchestrator. `mark-complete.sh` then tags markers with this value. Lowest cost; requires operator action each new session. **No harness change.**

2. **Auto-derive `CLAUDE_SESSION_ID` in `common.sh`.** Modify `session_session_id()` to fall back to a stable per-process identifier (`$$` for PID, or a one-shot UUID persisted to `.claude/state/session-id` for the orchestrator's lifetime). Persist for the duration of the session. **Single harness file change; transparent to operator.**

3. **Restructure marker discriminator.** Use mtime + content hash as the discriminator instead of session-id tagging. Stop hook enforces freshness via "marker mtime > first-edit timestamp of this session." **More invasive harness change; touches both write and read sides.**

Option 2 is the minimum-change path that solves the underlying ambiguity without operator action per session. Operator decision required before completion of Batch 1 or any deploy.

## Non-blocking impact for current Chunk 1C

Chunk 1C will write markers via the same `mark-complete.sh` after its gate. The markers will land at `*.no-session.ok` with mtime `2026-05-03T<later>`. Same caveat applies. The 1C chunk-merge audit relies on the operator and lead confirming the markers were written by THIS session via mtime + content inspection (same protocol used for Chunks 1A and 1B).

## Cited

- `~/Claude-store/sysadmin/harness/lib/common.sh` — `session_session_id()` definition
- `~/Claude-store/sysadmin/harness/bin/mark-complete.sh:67` — marker filename construction `${kind}.${SID}.ok`
- `~/Claude-store/sysadmin/harness/hooks/stop-completion-check.sh` — marker lookup uses same SID resolver
- `nexxus2.2_replit/.claude/state/completion/` — marker contents inspected 2026-05-03T04:23:39Z; all files share `session=no-session` shape
- This conversation: marker writes after Chunk 1A merge (2026-05-02T04:37:24Z) and Chunk 1B merge (2026-05-03T04:23:39Z) — both produced `<kind>.no-session.ok` paths

## Action items (for the operator decision queue)

1. Decide between resolution options 1, 2, 3 above (recommend Option 2).
2. Schedule fix BEFORE any production deploy of Batch 1.
3. When D-I3 housekeeping resumes, add this as a non-blocking issue in `issues.md` (parked during Batch 1).
4. Re-audit prior chunk markers (1A, 1B) once the resolution is in place — confirm content is correct even if session-id tag is upgraded.
