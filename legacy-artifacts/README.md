# Legacy Artifacts — Nexxus v2.2 (wave-pe3)

Preserved from the 2026-04-23 subtractive harness revision. Do not follow these; they are history.

## Contents

- `CLAUDE.md.pre-revision` — the 330-line pre-revision CLAUDE.md with ghost-gate / pre-exec / post-sprint ceremony. Operational content (VIN-MCP, test accounts, env, action classification, REM-8-DT) was preserved verbatim into the new top-level CLAUDE.md.
- `harness.md` — pre-commit gates, watchdog checks, ghost handshake. Superseded; no replacement.
- `plan.md` — per-sprint implementation plan. Superseded; sprint-level planning is now inline in the backlog item or in the session (via plan mode).
- `sprints.json` — sprint registry v5.0. Superseded by `backlog.md` in the new plain-markdown format.
- `sprints.backlog.json` — archival sprint data.
- `backlog.md.pre-revision` — pre-revision backlog.
- `.governor/` — governor-role scaffolding. Superseded by the six global roles (single agent, sub-agents, reviewer via `code-reviewer` subagent).
- `.ghost_backup_pre_symlink/` — ghost role backups from 2026-03-23.
- `.claude-settings.json.pre-revision` — extensive allow/deny permissions matrix and full hook block. Superseded by minimal MCP-servers-only settings.
- `.claude-hooks/captain-check.sh` — 500-line ghost-gate state machine. No documented incident backing.
- `.claude-hooks/context-check.sh`, `template-validator.sh`, `stop-orchestrator.sh` — preemptive hooks.
- `scripts/pre-commit.sh`, `watchdog.sh`, `enforcer-checklist.sh`, `check-file-scope.sh`, `commit.sh`, `ack-and-retry.sh`, `workflow-audit.sh` — ceremony scripts. Irreversible-operation protection now lives in `~/.claude/hooks/branch-guard.sh` (push-to-main / force-push only) and `~/.claude/hooks/file-boundary.sh` (narrowed, shape B; incident REM-8-DT).

## Recovery

If any dropped mechanism is needed again: check `/home/ubuntu/Claude-store/sysadmin/harness-revision-proposal/INVENTORY.md` §7 "Candidates for re-addition." Do not re-add without a documented incident.
