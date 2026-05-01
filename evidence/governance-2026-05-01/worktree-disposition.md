# Worktree Disposition — Governance Preservation Pass 2026-05-01

`git status --short` snapshot at the start of this pass enumerates files in the working tree that are NOT yet committed. This pass classifies them. **No file was staged or committed in this pass.**

Note: this pass itself adds new untracked files under `evidence/governance-2026-05-01/`. Those are governance evidence artifacts and are NOT included in this snapshot (which represents pre-pass state).

---

## Classification table

| File / path | Classification | One-line note | Recommended group |
|---|---|---|---|
| `.claude/session.md` (Modified) | governance | Operator-curated authoritative session file. Updated 2026-05-01 with overnight Lanes 4–8 results, four cross-cutting findings, route-redirect-trap reproduction. | **Group A** — governance commit |
| `backlog.md` (Modified) | governance | Sprint backlog updated post-overnight (likely with 2026-05-01 P0 + P1 items). | **Group A** — governance commit |
| `evidence/stabilization-sprint-2026-04-30/plan.md` (Modified) | evidence | Closeout amendment to chunk plan (`DONE` table updates, etc.). | **Group B** — overnight closeout commit |
| `evidence/watchdog-alerts.log` (Modified) | log | Continuously growing watchdog alert log (already 3000+ lines, will keep growing). | **Group C** — log noise; consider .gitignore eventually |
| `.claude/scheduled_tasks.lock` (Untracked, now DELETED in step 2.5) | log/operator-data | Was a defunct scheduler lockfile. Removed in this pass. | n/a (cleared) |
| `.claude/session-snapshot.md` (Untracked, now DELETED in step 2.6) | log | Pre-compact hook informational snapshot. Removed in this pass. | n/a (cleared) |
| `evidence/stabilization-sprint-2026-04-30/lane-4-sales-reports.md` (Untracked) | evidence | Lane 4 (Sales Reports verification) overnight evidence file. | **Group B** — overnight closeout commit |
| `evidence/stabilization-sprint-2026-04-30/lane-5-teambox-taxonomy.md` (Untracked) | evidence | Lane 5 (TeamBox conversation taxonomy) overnight evidence. | **Group B** — overnight closeout commit |
| `evidence/stabilization-sprint-2026-04-30/lane-6-marketing.md` (Untracked) | evidence | Lane 6 (Marketing inventory + agents) overnight evidence. | **Group B** — overnight closeout commit |
| `evidence/stabilization-sprint-2026-04-30/lane-7-metrics.md` (Untracked) | evidence | Lane 7 (Metrics dashboard honesty) overnight evidence — 7/42 metrics dishonest. | **Group B** — overnight closeout commit |
| `evidence/stabilization-sprint-2026-04-30/lane-7-screenshots/` (Untracked) | evidence | Lane 7 supporting screenshots (12 PNG + 4 JSON per overnight-validation-report). | **Group B** — overnight closeout commit |
| `evidence/stabilization-sprint-2026-04-30/lanes-4-8-plan.md` (Untracked) | evidence | The plan doc for Lanes 4–8 overnight (already classified SUPERSEDED in plan-index). | **Group B** — overnight closeout commit |
| `evidence/stabilization-sprint-2026-04-30/overnight-validation-plan.md` (Untracked) | evidence | The plan doc for the overnight validation run (already classified SUPERSEDED). | **Group B** — overnight closeout commit |
| `evidence/stabilization-sprint-2026-04-30/overnight-validation-report.md` (Untracked) | evidence | **The synthesis report**. YELLOW verdict; four cross-cutting findings; the canonical record of the overnight run. | **Group B** — overnight closeout commit (priority within group) |
| `evidence/stabilization-sprint-2026-05-01/tomorrow-plan.md` (Untracked) | evidence | The active plan for 2026-05-01 (P0 routing, P1 metric honesty). Authoritative. | **Group D** — forward-plan commit |
| `uploads/` (Untracked) | operator-data | Project uploads directory (per CLAUDE.md "Each project has its own `uploads/` directory"). Per-project SFTP target. | **Group E** — leave untracked or .gitignore (operator decides) |

---

## Recommended commit groupings

### Group A — Governance updates (small, focused)

```
backlog.md
.claude/session.md
```

Suggested message: `chore(governance): backlog + session.md update post overnight Lanes 4–8 (2026-05-01)`

### Group B — Overnight 2026-04-30 closeout evidence

```
evidence/stabilization-sprint-2026-04-30/plan.md            (modified — closeout)
evidence/stabilization-sprint-2026-04-30/lanes-4-8-plan.md
evidence/stabilization-sprint-2026-04-30/overnight-validation-plan.md
evidence/stabilization-sprint-2026-04-30/overnight-validation-report.md
evidence/stabilization-sprint-2026-04-30/lane-4-sales-reports.md
evidence/stabilization-sprint-2026-04-30/lane-5-teambox-taxonomy.md
evidence/stabilization-sprint-2026-04-30/lane-6-marketing.md
evidence/stabilization-sprint-2026-04-30/lane-7-metrics.md
evidence/stabilization-sprint-2026-04-30/lane-7-screenshots/
```

Suggested message: `evidence(overnight-2026-04-30): Lanes 4–8 read-only validation report + supporting evidence`

### Group C — Log noise (defer / ignore)

```
evidence/watchdog-alerts.log    (large, append-only, may be better in .gitignore)
```

Suggested action: leave as-is OR add to `.gitignore` after operator decision; do not commit log churn.

### Group D — Forward planning

```
evidence/stabilization-sprint-2026-05-01/tomorrow-plan.md
```

Suggested message: `plan(2026-05-01): priority queue post overnight validation (P0 routing redirect, P1 metric honesty)`

### Group E — Operator data

```
uploads/    (untracked; per CLAUDE.md per-project SFTP target — likely should remain untracked)
```

Suggested action: verify contents are not sensitive, then either commit (if intentional) or add to `.gitignore`.

---

## NOT staged in this pass

Per operator mandate, this pass:
- Wrote five inventory files under `evidence/governance-2026-05-01/`
- Cleared 13 ephemeral state files (Step 2)
- Exported 6 stashes to `.patch` files
- **Did NOT** stage or commit any product or governance file

The dirty / untracked state at end of pass differs from start only by:
- removed: `.claude/scheduled_tasks.lock`, `.claude/session-snapshot.md` (cleared in step 2)
- added: `evidence/governance-2026-05-01/**` (this pass's inventory files + stash patches)

Operator should review the groupings above and decide commit cadence.
