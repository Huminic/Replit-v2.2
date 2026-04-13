# Nexxus Production Evals — Harness-Native Pack (v2.0)

This is the **harness-adapted** Production Evals pack for Nexxus Connect v2.2. It has been evaluated against the Nexxus governance model and adapted to be fully compatible with Ghost entry/exit gates, pre-commit.sh enforcement, watchdog checks, enforcer checklists, and cross-sign requirements.

## Adaptation Source

Original pack: `nexxus-production-evals-runtime-pack` v1.1
Adapted by: sysadmin governance-adaptation agent
Adaptation date: 2026-04-06

See `harness-gap-analysis.md` for the full gap analysis that drove these changes.

## Start Here

1. Read `handoff-brief.md` — complete execution instructions for the coding session agent
2. Read `harness-gap-analysis.md` — understand what was changed and why
3. Read `claude-code-master-prompt.md` — the adapted operating instructions
4. Read `production-evals.json` — the eval registry (7 sprints)
5. Read `first-wave-eval-sprints.md` — recommended execution order

## Non-Negotiable Rules

- Playwright is the witness, not the judge
- One sprint at a time
- One workflow at a time inside a sprint
- Evidence and commentary are mandatory
- False-pass detection is mandatory
- Fixes require exact-flow retests
- Ghost Entry Gate APPROVED before execution
- Ghost Exit Gate CLEARED before next sprint
- Enforcer checklist and cross-sign per sprint
- All commits through the harness (COMMIT_ROLE + COMMIT_SPRINT)

## Compact-Safe Files

If context is compacted, these files contain enough to resume:
- `production-evals.json`
- `production-evals-manifest.json`
- `claude-code-master-prompt.md`
- `bug-taxonomy.yaml`
- `evidence-rubric.yaml`
- `first-wave-eval-sprints.md`
