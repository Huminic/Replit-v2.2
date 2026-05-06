# Governance Reset 2026-05-05 — Runtime Deviation: In-Process Teammate Writes

**Date:** 2026-05-05
**Scope:** Governance reset only (`roadmap.md`, `plan.md`, `evidence/wave-bookend-template.md`, Wave 1C OPENING, Wave I-Auth OPENING, this deviation note)
**Authorized by:** Operator chat 2026-05-05 (option D — accept in-process for governance text only)

## Context

The operator directed that "any teammate that writes files, including governance files" should run with `isolation: "worktree"` to establish the clean pattern.

## What was attempted

The orchestrator spawned `release-product-logic` (read-only validator) via the `Agent` tool with:

- `team_name: "nexxus-release-factory"`
- `isolation: "worktree"`
- `run_in_background: true`

## What actually happened

The Agent-Teams runtime spawned the teammate with:

- `backendType: "in-process"`
- `tmuxPaneId: "in-process"`
- `cwd: "/home/ubuntu/Claude-store/nexxus2.2_replit"` (project root, NOT a separate worktree)
- No worktree path was returned in the spawn result.
- `git worktree list` confirms no new worktree was created.

The teammate joined the team correctly (visible in `~/.claude/teams/nexxus-release-factory/config.json`), is addressable via SendMessage by name, and produced a valid verdict via the team mailbox. The `isolation: "worktree"` parameter was silently ignored.

## Working theory

The Agent-Teams experimental runtime appears to use an in-process backend by default for team members and may not honor the `isolation: "worktree"` parameter when `team_name` is set. The Agent tool contract documents `isolation: "worktree"` as a valid parameter but does not state how it interacts with `team_name`.

## Operator decision (2026-05-05)

**Option D approved for the governance reset only.**

- Agent Teams ARE enabled (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`).
- `release-product-logic` joined the team and ran in-process.
- The team runtime used in-process backend despite `isolation: "worktree"`.
- In-process teammate writes are accepted FOR GOVERNANCE TEXT ONLY (`roadmap.md`, `plan.md`, wave-bookend template, Wave 1C / I-Auth OPENING bookends, this deviation note).
- Product-code waves still require either:
  - working team worktree isolation, OR
  - explicit operator approval to fall back to an isolated `Agent` subagent (no `team_name`) with `isolation: "worktree"` for the implementer role.

## Why this is acceptable for governance reset

- Governance text has zero runtime effect on the application.
- Working tree was already dirty before spawn (operator-curated `.claude/session.md`, untracked governance evidence files); in-process writes do not increase risk.
- Audit subagents (`scope-guardian`, `code-reviewer`) post-write are isolated and catch any pollution.
- Diff is reviewed via `git diff --name-status` after the builder reports complete.

## Why this is NOT acceptable for product-code waves (Wave 1C onward)

- Product code carries runtime risk; isolated worktree writes give the operator a reviewable diff in a separate branch before any merge.
- Concurrent test/audit runs require worktree isolation to avoid interfering with the orchestrator's working tree.
- The "clean pattern" must hold for every wave that touches `server/`, `client/`, `shared/`, or `migrations/`.

## Action items before Wave 1C implementation

1. Investigate whether the Agent-Teams runtime supports `isolation: "worktree"` (likely settings flag, env var, or a CC version requirement).
2. If unsupported, formal operator approval is required to spawn the Wave 1C implementer as an isolated `Agent` subagent (no `team_name`, `isolation: "worktree"`). The implementer role is solo (no collaboration with other teammates needed during implementation), so giving up team membership is a manageable trade-off.
3. Auditor subagents (`scope-guardian`, `code-reviewer`, `integration-safety`) remain isolated regardless — that part of the pattern is unaffected.

## Audit trail

- Spawn record: `~/.claude/teams/nexxus-release-factory/config.json` (members[1])
- Task #2: `~/.claude/tasks/nexxus-release-factory/2.json`
- Verdict captured in this session's transcript at the time of `release-product-logic` SendMessage.

## Status

Active deviation. Re-evaluate before any Wave 1C implementation chunk dispatch.
