# Chunk 3 — Sprint-level Evidence Summary

**Date:** 2026-04-30
**Scope:** deploy pipeline hardening — I-NEW-2026-04-29-D + I-NEW-2026-04-29-F
**Files changed:** `.github/workflows/deploy.yml` (only)

## Two deltas of proof

### Delta 1 — runnable test result
`evidence/stabilization-sprint-2026-04-30/3/sprint/verify-simulate-output.txt` runs the new bash polling logic against 7 mocked scenarios. All PASS:
- normal-deploy success (uptime regression observed) → confirmed
- recovery from down (PRE=0, CURRENT>0) → confirmed
- still-old container → NOT confirmed
- container restarted but widget 500 → NOT confirmed
- uptime > 600 (stale container with old uptime) → NOT confirmed
- pre=0 cur=0 widget 500 (still down) → NOT confirmed
- pre=0 cur=0 widget 200 (no actual uptime change) → NOT confirmed

### Delta 2 — independent observation
`evidence/stabilization-sprint-2026-04-30/3/sprint/health-shape.json` captures the live `/api/health` response: `{"status":"ok","version":"2.2.0","uptime":24425,"timestamp":"...","environment":"production"}`. This proves the `.uptime` field exists as a number, validating the `jq -r '(.uptime // 0) | floor'` extraction.

## Reviewer verdicts

- **scope-guardian** (`.claude/state/active-scope.txt`): files modified all in declared scope (`.github/workflows/deploy.yml`, issues.md, evidence/)
- **code-reviewer**: APPROVE (after addressing 2 real correctness bugs caught in first pass — float comparison and PRE_UPTIME=0 edge case)
- **integration-safety**: SKIPPED per pre-flight (no application external-write paths touched)

## What changed

| File | Status | LoC | Issue |
|---|---|---|---|
| `.github/workflows/deploy.yml` | rewrote `Verify deployment` step + added `Notify on failure` step | +96 (-7) | I-NEW-2026-04-29-D, I-NEW-2026-04-29-F |
| `issues.md` | closed 2 items | +2 rows | both |

## Issues closed

- **I-NEW-2026-04-29-D** — deploy.yml `Verify deployment` was buggy (`curl "/"` no-host + 60s fixed sleep)
- **I-NEW-2026-04-29-F** — no failure notification on CI deploy failure

## Notes for operator

- The new failure-notification step requires GitHub Actions secret `SLACK_WEBHOOK_URL` to be set. Until you add it, the step no-ops gracefully. Add it via repo Settings → Secrets and variables → Actions when ready.
- The new verify step polls for up to 10 minutes. If a Coolify rebuild legitimately takes >10 min, CI will fail. This is the correct behavior — operator can re-run or manually verify.
- Pre-existing test step `Run tests` (line 49) still runs Playwright against `live.huminic.app` BEFORE the deploy. That tests the OLD code, not the post-deploy code. Out of scope for this chunk; can be addressed in a follow-up if desired.
