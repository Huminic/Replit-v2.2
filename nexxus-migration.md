# Nexxus v2.2 (replit) — one-shot harness migration

**You are in:** `/home/ubuntu/Claude-store/nexxus2.2_replit` on branch `wave-pe3`.
**Global harness has already been revised** (new CLAUDE.md, settings.json, narrowed hooks) in a prior session. Run `git branch --show-current` to confirm the branch.

This file exists in your project root. Execute the steps below, then delete this file.

---

## Why

The operator adopted a subtractive harness revision 2026-04-23. Reasoning is in `/home/ubuntu/Claude-store/sysadmin/harness-revision-prompt.md` and the full proposal set at `/home/ubuntu/Claude-store/sysadmin/harness-revision-proposal/`. Read those if you want context. You do not need to for this migration.

In short: the sprint-registry / ghost-gate / pre-exec / post-sprint / captain-check ceremony drops. Values (13 Environmental Core Values) stay. Operational content (VIN-MCP, test accounts, env, action classification, REM-8-DT) stays. Incident-backed hooks stay (the new `file-boundary.sh` at `~/.claude/hooks/` is already shape B).

## Preflight checks (confirm before starting)

```bash
pwd                                                 # /home/ubuntu/Claude-store/nexxus2.2_replit
git branch --show-current                           # wave-pe3
git status                                          # clean or contained uncommitted work you're aware of
python3 -c "import json; d=json.load(open('sprints.json')); a=[s for s in d.get('sprints',[]) if s.get('status') in ('in_progress','approved')]; print('ACTIVE:', len(a)); [print(' ',s['id'],s.get('status'),s.get('title','')[:80]) for s in a]"
```

If `ACTIVE: 0`, proceed. If not, **stop** and tell the operator — there's in-flight work that needs to be migrated to `backlog.md` by hand before the sprints.json moves.

## Steps

### 1. Create `legacy-artifacts/`

```bash
mkdir -p legacy-artifacts/scripts legacy-artifacts/.claude-hooks
```

### 2. Move heavy-harness files

```bash
mv harness.md plan.md sprints.json legacy-artifacts/
[ -f sprints.backlog.json ] && mv sprints.backlog.json legacy-artifacts/
mv backlog.md legacy-artifacts/backlog.md.pre-revision
[ -d .ghost_backup_pre_symlink ] && mv .ghost_backup_pre_symlink legacy-artifacts/
[ -d .governor ] && mv .governor legacy-artifacts/
for f in pre-commit.sh watchdog.sh enforcer-checklist.sh check-file-scope.sh commit.sh ack-and-retry.sh workflow-audit.sh build.ts; do
  [ -f "scripts/$f" ] && mv "scripts/$f" "legacy-artifacts/scripts/$f"
done
for f in captain-check.sh context-check.sh template-validator.sh stop-orchestrator.sh; do
  [ -f ".claude/hooks/$f" ] && mv ".claude/hooks/$f" "legacy-artifacts/.claude-hooks/$f"
done
```

### 3. Back up CLAUDE.md and .claude/settings.json

```bash
mv CLAUDE.md legacy-artifacts/CLAUDE.md.pre-revision
cp .claude/settings.json legacy-artifacts/.claude-settings.json.pre-revision
```

### 4. Install the new harness files

```bash
cp /home/ubuntu/Claude-store/sysadmin/harness-revision-proposal/drafts/nexxus.CLAUDE.md CLAUDE.md
cp /home/ubuntu/Claude-store/sysadmin/harness-revision-proposal/drafts/nexxus.settings.json .claude/settings.json
```

### 5. Create the new empty backlog.md

```bash
cat > backlog.md <<'EOF'
# Nexxus v2.2 — Backlog

Format: plain markdown. One item per entry. Four fields: Objective, Scope, Done looks like, Constraints.
No IDs, statuses, dependsOn arrays, filesModified arrays, UI permissions, execution steps.

If the previous `sprints.json` had items you still care about, migrate them from
`legacy-artifacts/sprints.json` one at a time into this file using the four-field template below.

## Template

```markdown
### <short name>

- **Objective:** <one sentence>
- **Scope:** <files, surfaces, systems>
- **Done looks like:** <plain English>
- **Constraints:** <non-obvious restrictions; "none" is fine>
```

## Items

(none yet — migrate from `legacy-artifacts/sprints.json` as needed)
EOF
```

### 6. Write `legacy-artifacts/README.md`

```bash
cat > legacy-artifacts/README.md <<'EOF'
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
EOF
```

### 7. Verify

```bash
ls                            # CLAUDE.md, backlog.md, .claude/, legacy-artifacts/, scripts/ (if it has non-legacy files), plus app files
wc -l CLAUDE.md               # ~146 lines, not 330
cat .claude/settings.json     # MCP servers only, no hooks block, no allow/deny matrix
ls legacy-artifacts/          # contains the moved artifacts
```

Confirm:
- `CLAUDE.md` contains the 13 Environmental Core Values pointer, VIN-MCP section, test accounts table, REM-8-DT boundary rule, action classification. Size ~146 lines, not 330.
- `.claude/settings.json` is MCP servers only.
- `legacy-artifacts/` holds the moved heavy-harness files and a `README.md`.
- Root no longer contains `harness.md`, `plan.md`, `sprints.json`, `sprints.backlog.json`, `.ghost_backup_pre_symlink/`, `.governor/`.

### 8. Commit

```bash
git add -A
git status
git commit -m "harness: subtractive revision (wave-pe3 → post-revision baseline)

- moved heavy-harness files (harness.md, plan.md, sprints.json, .governor/,
  .ghost_backup_pre_symlink/, pre-commit.sh, watchdog.sh, captain-check.sh, etc.)
  to legacy-artifacts/
- replaced 330-line CLAUDE.md with 146-line version; preserved 13 Environmental
  Core Values + VIN-MCP + test accounts + REM-8-DT boundary verbatim
- settings.json reduced to MCP servers only; all preemptive hooks dropped
- new backlog.md in plain-markdown four-field format; no sprints.json registry
- reasoning: /home/ubuntu/Claude-store/sysadmin/harness-revision-prompt.md"
```

No `COMMIT_ROLE`, no `COMMIT_SPRINT`, no `[skip-ghost]` — those patterns are retired.

### 9. Delete this file

```bash
rm /home/ubuntu/Claude-store/nexxus2.2_replit/nexxus-migration.md
```

---

**delete this file when complete.**
