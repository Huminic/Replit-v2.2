# Wave 11-Gov — Blind Verifier Verdict

**Wave:** 11-Gov (`wave/11-gov/harness-and-console`, off `batch-1-finish-line` `e4aa3b0`)
**Verifier:** isolated blind verifier (general-purpose `Agent`)
**Date:** 2026-05-07
**Mode:** READ-ONLY against this repo + READ-ONLY against `~/Claude-store/sysadmin/harness/`

---

## Final verdict: **AGREE**

Each of the six declared checks holds against primary evidence. One MINOR caveat is documented in Check 5 (does not change the verdict).

---

## Check 1 — G1 finding file integrity → **AGREE**

| Claim | Evidence reviewed | Holds? |
|---|---|---|
| File exists at `evidence/wave-11-gov-harness/chunk-G1/finding.md` | Read in full (375 lines) | YES |
| Cites specific harness file paths + line numbers | `common.sh:56-58`, `mark-complete.sh:49-57,60-66`, `stop-completion-check.sh:34,64-67,74,81,89` — all named and line-anchored | YES |
| Documents BOTH Path A and Path B fix options | §6 (Path A — export in `session-start.sh` + persist), §7 (Path B — fallback in `common.sh`) | YES |
| Recommends Path B with stated reasoning | §8 — explicit table of criteria (blast radius / verifiability / risk / independence / debugability); Path B wins on 4 of 5 | YES |
| Does NOT claim any harness file was modified | §3 header explicitly says "NO FIX APPLIED"; §12 "Stop conditions honored" reaffirms; finding ends with §12 reasserting cross-project boundary | YES |

**Spot-check:** opened `/home/ubuntu/Claude-store/sysadmin/harness/lib/common.sh` lines 56-58 directly:

```bash
session_session_id() {
  echo "${CLAUDE_SESSION_ID:-no-session}"
}
```

Exact match to the resolver code quoted in §2 of the finding. Verified.

---

## Check 2 — G2 finding file integrity → **AGREE**

| Claim | Evidence reviewed | Holds? |
|---|---|---|
| File exists at `evidence/wave-11-gov-harness/chunk-G2/finding.md` | Read in full (138 lines) | YES |
| Walk identity = `serra_honda@huminic.ai` | finding §header, console-walk.txt L5 | YES |
| Routes walked include at minimum `/`, `/sales`, `/insights` post-login | finding §1 (routes T1–T6 are `/`, `/sales`, `/insights`, `/teambox`, `/management`, `/marketing`); console-walk.txt T1–T6 | YES (exceeds minimum) |
| Console error captured = `POST /api/auth/refresh 400` and fires on `/login` only | finding §2; console-walk.txt T7-T8 explicitly show error only on bare `/login` after logout / fresh nav. T1-T6 (authenticated routes) all clean. | YES |
| Cross-check vs Wave 1C E2E performed | finding §3 — comparison table covers console errors, refresh-400 occurrences, pm2 errors, 5xx, slow requests. Read `evidence/wave-1C-comprehensive-e2e/console-network/health-summary.md` independently and confirm: 1C reports 0 console errors during authenticated walk + 0 5xx + 0 uncaughtException — consistent with G2 today. 1C did not measure logout transition, which the finding correctly notes. | YES |
| Classification: BENIGN; recommendation: NO G3 | finding §5, §6, §8 — explicit "BENIGN", "Recommend G3 NOT be dispatched" | YES |

**Source-line spot-checks:**
- `client/src/contexts/AuthContext.tsx:189-190,315-316` — confirmed `tryRefreshToken` import + call pattern
- `server/lib/refreshTokenRotation.ts:195-203` — confirmed comment "Pass `undefined`/`null`/`""` to surface a 400" + the `return { kind: "error", status: 400, ... }` line
- `client/src/lib/queryClient.ts:26-58` — confirmed `tryRefreshToken` does single `POST /api/auth/refresh` with `credentials: 'include'`; returns `false` on `!res.ok`

All citations in the finding match real code at real line numbers. No fabrication.

---

## Check 3 — Cross-project boundary respected → **AGREE**

| Claim | Evidence | Holds? |
|---|---|---|
| Zero edits to any file under `~/Claude-store/sysadmin/harness/` | `find /home/ubuntu/Claude-store/sysadmin/harness -newer <wave-bookend> -type f` returned EMPTY | YES |
| Recent activity in sysadmin/ git log shows no relevant commits | `/home/ubuntu/Claude-store/sysadmin/` has NO `.git` directory at all (`ls -la /home/ubuntu/Claude-store/sysadmin/.git` → "No such file or directory"). Therefore no commits could have been made; the implicit assertion ("no recent activity") holds vacuously | YES |
| Specific harness file mtimes pre-date the wave | `common.sh` Apr 25 05:45, `mark-complete.sh` Apr 26 02:21, `stop-completion-check.sh` Apr 25 07:12 — all >12 days BEFORE 2026-05-07 wave date | YES |

The investigator opened these files (read-only) and their mtimes did not change — confirming Read-only access. REM-8-DT incident protocol fully respected.

---

## Check 4 — Scope discipline → **AGREE**

`git diff --name-only e4aa3b0..HEAD`:

```
evidence/governance-2026-05-01/harness-session-id-marker-gap.md
evidence/wave-11-gov-harness/chunk-G1/finding.md
evidence/wave-11-gov-harness/chunk-G2/console-screenshot-route-home-final-2026-05-07T160554Z.png
evidence/wave-11-gov-harness/chunk-G2/console-screenshot-route-root-2026-05-07T160230Z.png
evidence/wave-11-gov-harness/chunk-G2/console-walk.txt
evidence/wave-11-gov-harness/chunk-G2/finding.md
```

All six paths are EITHER in `evidence/wave-11-gov-harness/` OR are the explicit ratification of the existing governance file `evidence/governance-2026-05-01/harness-session-id-marker-gap.md` (declared in the OPENING bookend §"Files likely touched"). NO product code, NO server, NO schema, NO migration, NO client edits.

`wave-bookend.md` is currently untracked (not yet committed) — that is consistent with bookend lifecycle: OPENING is authored before commits, CLOSING is added at gate. Not a scope violation.

---

## Check 5 — No fake chronology → **AGREE (with minor caveat)**

| Artifact | mtime / commit time | Order |
|---|---|---|
| `wave-bookend.md` (OPENING) | mtime `2026-05-07T15:59:32Z` (untracked) | T0 |
| `chunk-G1/finding.md` commit `efe1525` | committer time `2026-05-07T16:04:30Z` | T0+5m |
| `chunk-G2/finding.md` commit `1cfbd2e` | committer time `2026-05-07T16:09:19Z` | T0+10m |
| Walk transcript timestamps | T1 = `16:02:30Z` ... T9 = `16:04:52Z` | between T0 and G1 commit (G1 was committed 16:04:30, mid-walk — but G1 is unrelated to walk; G2 written after walk completed) |

OPENING bookend predates all chunk commits. No backdating. Chunk G2 commit (`1cfbd2e`) comes AFTER the walk concluded (T9 = `16:04:52Z`; G2 finding mtime `16:08:06Z`; G2 commit `16:09:19Z`) — consistent.

**Minor caveat (does not change the verdict):** the OPENING bookend is currently *untracked* in git, so there is no committer timestamp on it — only filesystem mtime. Filesystem mtimes can in principle be touched. There is no mtime evidence of tampering, and the orchestrator's claim "wave bookend OPENING declares scope; CLOSING is pending" matches the file's structure (Section "## CLOSING" line 137 explicitly reads "(pending — populated at gate after investigator + 3 blind verifiers complete)"). The bookend will be committed at wave-close per the standard pattern.

---

## Check 6 — BENIGN classification defensibility → **AGREE**

The hypothesis under audit: *"every route" framing in original D-I3 (KD-6) was a console-buffer artifact, not a real per-route error.*

Logical reconstruction:

1. `client/src/contexts/AuthContext.tsx:289-338` — `useEffect` runs ONCE on `AuthProvider` mount. `AuthProvider` mounts ONCE per SPA session (top-level provider). Therefore `tryRefreshToken()` fires ONCE per page-load, NOT per route navigation within an SPA.
2. `client/src/lib/queryClient.ts:26-46` — `tryRefreshToken()` issues a single `POST /api/auth/refresh`. On `!res.ok`, returns `false`. The browser console emits the resource-load error for the 4xx as a side-effect of `fetch()`; the SPA does not throw.
3. SPA route navigation (e.g., `/` → `/sales` → `/insights`) does NOT remount `AuthProvider`. Therefore `tryRefreshToken()` does NOT re-fire on route change.
4. Today's walk (G2) directly tested this: T1-T6 (authenticated route navigations) → 0 new console errors. T7-T8 (post-logout `/login` and fresh `/login` without cookie) → the 400 fires once each. T9 (re-login → `/`) → no new console errors; the residual 400 from T7-T8 still appears in the cumulative buffer as expected.
5. The original D-I3 observation said "Console: 1 errors, 0 warnings... through every protected route." The Step A walk likely sampled `console.errors.length` at each route. Because `AuthProvider` mounted at `/login` BEFORE redirect to authenticated surface (or some equivalent flow), the bootstrap probe fired against a missing cookie state somewhere in the flow, producing a single 400 in the console buffer. Subsequent route-change samples saw `length === 1` because the buffer is cumulative within a browser context — not because new errors fired per route.
6. Server-side correlation: pm2 log scrub during G2 walk shows authenticated routes only get `200` from `/api/auth/refresh` (every ~17s rotation). The 400 fires only at logout-to-/login transitions. So even at the network layer the "every route" framing does not hold.

The hint in the prompt ("the original D-I3 observation was likely from a single Playwright walk session where the console buffer wasn't cleared between navigations") aligns precisely with the finding's §4 explanation. I independently confirm.

**Defensibility:** The BENIGN classification holds. Functional behavior is correct (tryRefreshToken handles 4xx; auth flow works; user is routed appropriately). The "every route" framing in D-I3 was an artifact, not a regression. NO G3 needed for v2.2.

---

## Summary

All six checks AGREE. The wave is read-only / investigation-only as declared, cross-project boundary is respected (no harness edits; no `.git` exists in sysadmin so no commit-history risk), the two finding files are honest and precisely cite real code at real line numbers, the cross-check against Wave 1C is consistent, the chronology is clean (with a minor untracked-bookend caveat that does not undermine the verdict), and the BENIGN classification of the D-I3 console error is defensible from independently-reproduced logic + pm2 + walk evidence.

**Recommendation to orchestrator:** proceed to CLOSING bookend and ff-only merge. Operator may, at discretion, apply the Path B harness fix at any time outside this wave.
