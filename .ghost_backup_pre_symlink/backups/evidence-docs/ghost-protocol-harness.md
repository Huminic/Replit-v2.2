# Ghost Protocol — Enforcement Harness Mechanics

## Pre-Tool Hook (fires before every Bash, Edit, Write, Agent call)

1. Read session-state.md
2. Check file mtime — if older than 4 hours, BLOCK all tools
3. If tool is writing TO session-state.md, allow (escape hatch prevents deadlock)
4. Output current task, branch, plan status to tool result (agent sees it every time)

## Pre-Commit Hook (fires on every `git commit`)

Gate 1: COMMIT_ROLE and COMMIT_SPRINT env vars must be set
Gate 1.5: Previous sprint in sprints.json must have status "committed" (chain of custody)
Gate 1.6: If ghost_messages.log has unacknowledged directives, BLOCK (ghost handshake)
Gate 1.7: Session state content must reference the current sprint (not stale)
Gate 2: Evidence directory must exist and be non-empty for the sprint
Gate 3: Enforcer checklist must exist and contain "RESULT: APPROVED"
Gate 4: Cross-sign must exist, verdict "APPROVED", implementing role ≠ reviewing role, timestamp fresh
Gate 5: All staged files must be within the COMMIT_ROLE's allowed scope
Gate 6: TypeScript compiles, UI guards (EF-14 max 40 lines per page), data guards, locked value guards
Gate 7: Hook source matches installed hook (integrity check)

Any gate failure → commit BLOCKED with specific error message.

## Ghost Agent (Watchdog — separate session)

Runs on trigger or schedule. Checks:
- C1: sprints.json integrity (max 1 in_progress, all committed have hash)
- C2: Evidence artifact completeness (required files per sprint directory)
- C3: Cross-sign validity (approved, different roles, min content)
- C4: Enforcer checklist validity (APPROVED, not BLOCKED)
- C5: Uncommitted evidence accumulation (max 1 untracked evidence dir)
- C6: Destructive change detection (deletions > insertions in protected paths)
- C7: Session state freshness (mtime < 4 hours)
- C8: Hook integrity (source matches installed)
- C9: Chain of custody (all commit hashes exist in git log, chronological)
- C10: Timestamp anomaly detection (identical mtimes, future timestamps)
- C11: Plan file alignment (status matches sprint progress)
- C12: Protected path monitoring (governance files, scripts, hooks)
- C13: Session state content accuracy (references match current sprint)

Output: ghost_messages.log with Report-ID, violations, directives.

## Ghost Handshake

1. Ghost writes ghost_messages.log with violations and directives
2. Dev agent reads on startup or before commit
3. Dev agent writes acknowledgment in pre-execution report (references Message-ID)
4. Ghost verifies ack exists and matches latest message on next scan
5. Pre-commit Gate 1.6 calls verify-ghost — BLOCKS if unacknowledged directives exist
6. Ack must be fresh (< 60 minutes), reference correct Message-ID, address every directive

## Sprint Lifecycle (enforced sequence)

1. Register sprint in plan.md with type prefix (P/R/G/I/E/M/D/T/L)
2. Create evidence directory
3. Write pre-execution report (includes ghost ack if directives pending)
4. PRE-08 gate: user stories must exist for T2+ testing sprints
5. Delegate code changes to agents (orchestrator does not write code)
6. Execute work (builder agents in worktrees)
7. Dual-agent testing (independent, orchestrator compares)
8. Write post-sprint report with test results
9. Write cross-sign (different role reviews)
10. Run enforcer checklist
11. Read ghost_messages.log, write ack if directives pending
12. Commit through pre-commit hook (all gates must pass)
13. Update sprint status with commit hash
14. Update session state
15. Update plan status

## Role Enforcement

| Role | Can Do | Cannot Do |
|------|--------|-----------|
| Orchestrator | Plan, delegate, compare results, commit | Write application code directly |
| Builder (backend) | Modify server/ files | Modify client/, scripts/, governance files |
| Builder (frontend) | Modify client/ files | Modify server/, scripts/, governance files |
| QA Tester | Read code, run tests, capture screenshots | Modify any files except evidence/ |
| Enforcer | Review artifacts, approve/block | Modify application code |
| Ghost | Scan, report, write directives | Modify any project files |
| Explorer | Read code, search, analyze | Modify any files |

Mechanical enforcement: Gate 5 checks staged files against COMMIT_ROLE scope.
Behavioral enforcement: CLAUDE.md rules, agent-specific .claude/agents/*.md files.
Human enforcement: L5 admin walkthrough catches what automation misses.

## Defect Gate (prevents skipping remediation)

Ghost checks: if ghost_messages.log contains "MAJOR defect" directives that are unacknowledged, Gate 1.6 blocks the next commit. The orchestrator cannot proceed to the next QA sprint without addressing open MAJOR defects in a FIX sprint first.

This is enforced by the ghost writing directives like:
```
[Message-ID: GM-20260317-001]
DIRECTIVE: 7 MAJOR defects open. FIX sprint required before QA-S19.
Defects: [list]
ACTION REQUIRED: Create FIX sprint, address defects, ack this message.
```

The dev agent must reference GM-20260317-001 in their next pre-execution report.
