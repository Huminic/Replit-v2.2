# .agent_docs/rules/file-management.md — Nexxus v2.2
# PURPOSE: File scope rules, commit requirements, session boundaries, and archiving procedures.
# Load this file when: starting a session, planning commits, or archiving files.
# Last updated: 2026-03-04

---

## 1. SESSION FILE SCOPE DECLARATION

At the start of every L2, L3, or L4 session, the agent must declare file scope in the session header.

```
SESSION START
Autonomy level: L2
File scope:
  - server/services/kill-switch-service.ts (create)
  - server/routes/outbound.ts (modify)
  - tests/kill-switch.spec.ts (create)
  - .agent_docs/codebase-index.md (update — Scribe only)
```

Any file not in the declared scope is OFF LIMITS for that session.
If an out-of-scope file needs to change, HALT and declare a new session or expand scope with owner approval.

---

## 2. COMMIT REQUIREMENTS

Every commit must:
1. Pass all quality gates (G0–G5) — no commit without gate passage
2. Include a codebase-index.md update for any new or modified files (Scribe)
3. Reference the AC item or sprint ID: `feat(AC-05-A): add kill switch check to SMS service`
4. Include JSDoc/TSDoc for every new function
5. Have Enforcer sign-off for any merge to v2.2 branch

Commit message format:
```
type(AC-ID or sprint-ID): brief description

[optional body: why this change was made]

Evidence: file:path:line
AC: AC-05-A
Sprint: Wave-2-Sprint-1
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

---

## 3. BRANCH STRATEGY

| Branch | Purpose | Merges from | Merges to |
|--------|---------|------------|----------|
| `main` | Production-ready, owner-approved | `v2.2` (per wave) | — |
| `v2.2` | Active development branch | sprint branches | `main` (per wave, Enforcer required) |
| `v2.2-wave-N-sprint-M` | Sprint-level working branch | — | `v2.2` (Enforcer required) |

- Create a sprint branch for every sprint
- Merge sprint → v2.2 only after Enforcer compliance passes
- Merge v2.2 → main only after owner wave approval

---

## 4. ARCHIVING PROCEDURE

When archiving a file (deprecated, replaced, or conflicting):

```
1. Create destination: docs/archive/[YYYY-MM-DD]-[reason]/
2. Move file: git mv [file] docs/archive/[YYYY-MM-DD]-[reason]/[filename]
3. Add note to archive folder: README.txt explaining what was archived and why
4. Update codebase-index.md: status = ARCHIVED
5. Commit: chore(archive): archive [filename] — [reason]
```

Files in `docs/archive/` are:
- **Append-only** — no modification after archiving
- **Never deleted** — recovery reference only
- **Listed in DO_NOT_TOUCH.md** — no agent modifies archived files

---

## 5. .PROJECT/ CLEANUP PROCEDURE

If a `.project/` directory is found in the repo:

1. HALT immediately — do not touch any files yet
2. Alert owner: "Found .project/ directory — this conflicts with v2.2 governance. Archiving it."
3. Wait for owner confirmation
4. Move to archive: `docs/archive/[YYYY-MM-DD]-project-layer-archived/`
5. Add `.project/` to DO_NOT_TOUCH.md if not already listed
6. Log action in PLAN.md pre-flight checklist as A6 complete with evidence
7. Resume session

---

## 6. COMPETING GOVERNANCE FILE CLEANUP PROCEDURE

Before Wave 1 begins, any competing governance files in the root must be archived.

Files to check and archive:
- Any `README.md` with conflicting project specs
- `context.md`, `architecture.md`, `implementation_plan.md` (from `.project/`)
- `progress.md`, `testing_strategy.md`, `core_values.md`
- `traceability.md`, `ops_strategy.md`, `design-system.md`, `context-anchor.md`
- Any `SPEC.md` or `PLAN.md` predating v2.2 governance

Procedure:
1. `git mv [conflicting-file] docs/archive/[YYYY-MM-DD]-pre-v2.2-governance/`
2. Log each file archived in PLAN.md pre-flight checklist item A5 with evidence
3. After all files archived, Enforcer verifies no competing governance references remain

---

## 7. DO_NOT_TOUCH ENFORCEMENT

When writing any code, check the target file path against DO_NOT_TOUCH.md before writing.
If the target is on the list:
1. Do NOT write to it
2. Log an Enforcer Violation in `.agent_docs/rules/agent-roles.md` compliance log
3. Create a Critical escalation in TeamBox
4. Halt the session

This check applies even at L4 autonomy. DO_NOT_TOUCH.md is absolute.

---

## 8. MEMORY.MD LIFECYCLE

| Action | When | Performed by |
|--------|------|-------------|
| Integrity check | Session start | Scribe |
| Write session summary | Session end | Scribe |
| Archive to MEMORY.md.bak | Session end | Scribe |
| Restore from .bak | Only on owner instruction | Scribe |

MEMORY.md schema:
```
---
last_updated: [ISO 8601 timestamp]
session_id: [unique session identifier]
wave: [current wave number]
sprint: [current sprint ID or "pre-flight"]
---

## LAST SESSION SUMMARY
[bullet list of what was done, with evidence where applicable]

## OPEN ITEMS CARRIED FORWARD
[items not completed that carry to next session]

## DECISIONS MADE THIS SESSION
[any owner decisions locked during this session]
```
