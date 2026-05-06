# Wave 1C — Phase A runtime proof: build-step gate

**Date:** 2026-05-06
**Branch:** `wave/5-insights/1C-metric-honesty` (HEAD `e22b493`) checked out in main worktree
**Gate:** `npm run build` blocked by `bash-safety.sh` (deploy-artifact rule)
**Status:** PARKED awaiting operator GO

---

## What happened

Orchestrator attempted `npm run build` in the main worktree (now on the wave branch) to compile the wave-1C source into `dist/index.cjs` so a subsequent `pm2 restart nexxus-app` would actually pick up the new code.

The harness hook `bash-safety.sh` returned:

```
PreToolUse:Bash hook error: BLOCKED (build): Production build affects deploy artifact.
Bypass: append '# APPROVED: <reason>' to the command after explicit operator authorization.
```

This is the correct interpretation. The CLAUDE.md autonomy clause covers `pm2 restart nexxus-app` / `pm2 reload nexxus-app --update-env` (DEV ONLY) but does NOT cover the upstream `npm run build` step that produces the artifact pm2 runs.

This matches the explicit guidance in `.claude/session.md` Phase A:
> `pm2 reload nexxus-app --update-env` (DEV) → present exact command + reason → **wait for operator confirm.**

The hook enforces what the original plan said.

---

## Why pm2 reload alone is insufficient

`pm2 describe nexxus-app` confirms:

| Field | Value |
|---|---|
| script path | `/home/ubuntu/Claude-store/nexxus2.2_replit/dist/index.cjs` |
| exec cwd | `/home/ubuntu/Claude-store/nexxus2.2_replit` |
| watch & reload | ✘ (disabled) |
| node env | production |

`pm2 reload --update-env` re-reads the same `dist/index.cjs`. Source changes from a `git checkout` are NOT picked up. To run wave-1C code on dev, the build must execute first.

---

## Operator decision required (morning)

**Approve `npm run build && pm2 restart nexxus-app` on DEV?**

- Effect: rebuilds `dist/index.cjs` from wave-branch source; restarts pm2 process #47 on port 5000.
- Audience: `dev.huminicdev.com` users (operator + internal QA).
- live.huminic.app is **NOT** affected (separate Coolify container; live deploy is a separate Phase C gate).
- Recovery if wave breaks dev: `git checkout batch-1-finish-line && npm run build && pm2 restart nexxus-app` reverts to pre-1C state. ~90 sec turnaround.

**Suggested operator chat reply:** `approve build` (or any explicit GO).

After GO, orchestrator will:
1. Append `# APPROVED: wave-1C runtime-proof dev rebuild` to the bash command and execute.
2. Confirm pm2 process online + dev reachable.
3. Proceed to Playwright walks + Resend dry-run per pre-staged plans.

---

## Pre-staged work (already complete; no runtime impact)

- `resend-preflight-staged.md` — destination-classification table + exact comms-test invocation
- `playwright-walk-plan.md` — URLs, login flow, expected post-Wave-1C shape, screenshot targets

Both are ready to execute mechanically once build is approved.
