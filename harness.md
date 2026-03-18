# Ghost Protocol — Governance Harness

## Pre-Tool Hook
- Path: `.claude/hooks/context-check.sh`
- Config: `.claude/settings.json`
- Matcher: Bash, Edit, Write, Agent
- Fires before every matched tool call
- Checks session-state.md mtime — if older than 4 hours, BLOCK all tools
- Escape hatch: allows writes to session-state.md when stale (prevents deadlock)
- Session state required fields: "Working On:", "Status:", "Branch:"
- Session state must reflect current sprint activity in evidence/

## Pre-Commit Hook
- Source: `scripts/pre-commit.sh`
- Installed: `.git/hooks/pre-commit`

| Gate | Check |
|------|-------|
| 1 | COMMIT_ROLE and COMMIT_SPRINT env vars required |
| 1.5 | Previous sprint in sprints.json must be committed (chain of custody) |
| 1.6 | Fresh watchdog scan — all violations must be acknowledged |
| 1.7 | Session state content must reference current sprint |
| 1.8 | Ghost messages — no unacknowledged BLOCK directives |
| 2 | Evidence directory must exist and be non-empty |
| 2.5 | Declared Files — all staged application files must be listed in pre-execution-report.md |
| 3 | Enforcer checklist must exist and contain RESULT: APPROVED |
| 4 | Cross-sign must exist, Verdict: APPROVED, implementing role != reviewing role, timestamp fresh (within 30 min), min 5 lines |
| 5 | All staged files within COMMIT_ROLE scope (sprint-scoped via workflow-audit.log for orchestrator) |
| 6 | TypeScript compiles, UI guards (EF-14 max 40 lines per page), data guards, locked value guards |
| 7 | Hook source matches installed hook (integrity check) |

## Watchdog
- Script: `scripts/watchdog.sh`
- Modes: scan (full audit), watch (real-time via inotifywait), verify-ack (called by pre-commit)
- Report: `evidence/watchdog-report.txt`
- Ack: `evidence/watchdog-ack.txt`
- Alerts: `evidence/watchdog-alerts.log`

| Check | What |
|-------|------|
| C1 | sprints.json integrity (max 1 in_progress, committed have hash, no duplicates, batch detection) |
| C2 | Evidence artifact completeness (all required files present, orphan detection) |
| C3 | Cross-sign validity (approved verdict, different roles, min 5 lines) |
| C4 | Enforcer checklist validity (APPROVED, not BLOCKED) |
| C5 | Uncommitted evidence accumulation (max 1 untracked evidence dir) |
| C6 | Destructive change detection (deletions > insertions in pages, data array removal, endpoint removal) |
| C7 | Session state freshness (mtime < 4 hours) |
| C8 | Hook integrity (md5 match between source and installed) |
| C9 | Chain of custody (all commit hashes exist in git log, chronological order, batch detection) |
| C10 | Timestamp anomaly detection (identical mtimes, future timestamps) |
| C11 | Plan file alignment (status matches sprint progress) |
| C12 | Protected path monitoring (governance files, scripts, hooks — watch mode only) |
| C13 | Session state content accuracy |
| C14 | Governance file modification detection |
| C15 | Memory staleness |
| C16 | Application changes without sprint — VIOLATION |
| C17 | Plan vs execution — Declared Files comparison |
| C18 | Retroactive artifact detection |

## Watchdog Acknowledgment
When a scan finds violations, the dev agent must write `evidence/watchdog-ack.txt`:
- Required fields: Acknowledged-By, Sprint, Timestamp
- Must address every violation check ID (C1, C2, etc.) with ACKNOWLEDGED and explanation
- Must be less than 60 minutes old
- Gate 1.6 runs a fresh scan at commit time — ack must address all violations found in that fresh scan

## Ghost Handshake
1. Watchdog writes `evidence/ghost_messages.log` with Message-ID, severity, directives
2. Dev agent reads before commit
3. Dev agent writes acknowledgment in pre-execution report (references Message-ID)
4. Pre-commit Gate 1.8 calls verify-ghost — BLOCKS if unacknowledged BLOCK directives exist
5. Ack must be fresh (< 60 minutes), address every directive

## Sprint Statuses
| Status | Meaning |
|--------|---------|
| planned | Registered in sprints.json, work not started |
| in_progress | Actively being worked on (max 1 at a time) |
| remediating | Sprint is being fixed or reworked |
| committed | Done, with git commit hash as proof |
| tested | Verified post-commit by a testing sprint |

Lifecycle: planned -> in_progress -> committed -> tested
Remediation: committed -> remediating -> committed -> tested

## Issue Domains
Issues in issues.md are tagged by domain. Remediation sprints have sub-sprints per domain.

| Tag | Domain | File Scope |
|-----|--------|-----------|
| FE | Frontend — UI, pages, forms, client logic | client/src/ |
| BE | Backend — APIs, business rules, services, integrations | server/ |
| DT | Data — schema, database, migrations, reporting data | shared/schema.ts, server/storage.ts |
| AU | Auth/Security — login, permissions, security controls | server/auth.ts, server/routes/auth.ts |
| IN | Infrastructure — deploys, environments, monitoring, scaling | scripts/, .env |

The orchestrator tags issues with the appropriate domain and flags items for the next sprint based on structural and economic priority. Remediation sub-sprints (REM-n-FE, REM-n-BE, etc.) cluster work so builder agents get all issues in their domain at once.

## Sprint Lifecycle
1. Register sprint in sprints.json with status "in_progress"
2. Create evidence/{sprint-id}/ directory
3. Write pre-execution-report.md with `## Declared Files` section
4. Acknowledge any pending ghost messages
5. Delegate code changes to builder agents (orchestrator does not write code)
6. Execute work
7. Verify (tests, build, live check)
8. Write post-sprint-report.md
9. Run enforcer-checklist.sh
10. Write cross-sign.md (different role reviews)
11. Commit: `COMMIT_ROLE=<role> COMMIT_SPRINT=<id> git commit -m "message"`
12. Update sprints.json with commitHash
13. Update session state

## Required Artifacts Per Sprint

| File | Required Content | Rules |
|------|-----------------|-------|
| pre-execution-report.md | Timestamp:, Sprint:, Status: READY, ## Declared Files | Must be written BEFORE code changes |
| post-sprint-report.md | Timestamp:, Sprint:, Status: COMPLETE | Written after work is done |
| cross-sign.md | Implementing Role, Reviewing Role, Verdict: APPROVED | Roles must differ, timestamp within 30 min of commit, min 5 lines |
| enforcer-checklist.txt | RESULT: APPROVED | Generated by scripts/enforcer-checklist.sh |
| workflow-audit.log | agent-launch entries with scope= declarations | Scope declarations enable sprint-scoped file access for orchestrator |

## Constraints
- Max 1 sprint in_progress at a time
- Previous sprint must be committed before starting next
- Max 1 uncommitted evidence directory
- Every issue in a REM sprint must have Background, Outcome, and Acceptance Criteria before work begins
- All findings go to issues.md with a domain tag — no filtering without user approval
- Builder agents receive AC in their prompt
- QA agents test against AC
- Issues without AC cannot be worked on
- Orchestrator does not write application code — delegates to builder agents
- QA/testing required after every fix sprint

## Role Enforcement

| Role | Can Modify | Cannot Modify |
|------|-----------|---------------|
| Orchestrator | Governance files, evidence/, sprints.json (+ sprint-scoped via workflow-audit.log) | Application code directly |
| Builder (backend) | server/ files | client/, scripts/, governance |
| Builder (frontend) | client/ files (with user approval) | server/, scripts/, governance |
| Enforcer | Evidence review only | Application code |

Commit roles: frontend, backend, test, integration, scribe, enforcer, architect, orchestrator
Governance file editors: orchestrator only
Script editors: orchestrator only

## Testing Rules
- User stories must be defined before testing sprints (PRE-08)
- Binary verdicts: CERTIFIED (zero defects) or FLAGGED (one or more defects)
- No middle ground, no softening language
- Defect severities: CRITICAL, MAJOR, MINOR — all result in FLAGGED

## UI Protection
Frontend UI (client/src/pages/, client/src/components/) must not be modified without explicit user approval. This applies at all times, not just post-test-freeze. Once the application test suite passes, no frontend changes are permitted unless the user is actively supervising. Backend-only fixes are always preferred over UI changes.

## Harness Check Skill
- Path: `.claude/commands/harness_check.md`
- Invoke: `/harness_check`
- Runs 10 deterministic checks matching watchdog C1-C11 + hook integrity

## Plan Authority
- `plan.md` is the authoritative roadmap
- sprints.json is the authoritative execution ledger
- No other file defines what work is planned or what work was done
