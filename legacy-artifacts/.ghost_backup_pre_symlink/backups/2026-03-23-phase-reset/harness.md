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
| parked | Work was committed but success criteria not fully met. Sprint is paused, not closed. Remaining work tracked in issues.md. Can be resumed or folded into a future sprint. |
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
7. **Smoke test each fix** — builder runs the specific Playwright test(s) mapped to the issue. Must pass before moving to next issue. Update issue status in issues.md: OPEN → FIXING → FIXED → VERIFIED
8. **Smoke test all issues** — after all sub-sprints, run all issue-specific tests as a batch before full E2E. Every fix verified individually.
9. **Update issues.md** — mark each verified issue. Only VERIFIED items can be removed after E2E. Present statuses to user before E2E.
10. Verify (TypeScript compiles, build succeeds, health check passes)
11. Write post-sprint-report.md (includes smoke test results per issue)
12. Run enforcer-checklist.sh
13. Write cross-sign.md (different role reviews)
14. Commit: `COMMIT_ROLE=<role> COMMIT_SPRINT=<id> git commit -m "message"`
15. Update sprints.json with commitHash
16. Update session state

## Issue Statuses (in issues.md)

| Status | Meaning | Who Sets It |
|--------|---------|-------------|
| OPEN | Not yet worked on | Orchestrator (after T-n logging) |
| FIXING | Builder agent is working on it | Orchestrator (during REM) |
| FIXED | Code change made, not yet tested | Builder agent |
| VERIFIED | Smoke test passed — confirmed working | Orchestrator (after smoke test) |
| CLOSED | Removed from open after E2E confirms | Orchestrator (after T-n passes) |

**Rules:**
- No issue may be removed from issues.md without VERIFIED status
- VERIFIED requires a passing smoke test (specific Playwright test, not full E2E)
- After every T-n run, new failures go INTO issues.md as OPEN with domain tags
- After every REM-n commit, the orchestrator updates statuses (never removes without VERIFIED)
- The orchestrator presents issues.md statuses to the user before running the full E2E

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

## Loop Preparation Framework

Before every remediation sprint (REM-n), the orchestrator must produce a **Loop Prep Document** in `evidence/REM-n/loop-prep.md`. This document is the single input that drives all sub-sprints. No code work begins until this document is complete and reviewed.

### Loop Prep Document Template

```markdown
# Loop Prep: REM-n

## 1. Issue-to-Domain Assignment
| Issue | Domain | Sub-Sprint | Summary |
|-------|--------|------------|---------|
| I-xxx | BE | REM-n-BE | one-line description |

## 2. Issue-to-Test Mapping
| Issue | Playwright Test(s) | Criterion ID |
|-------|-------------------|--------------|
| I-xxx | domain-NN-xxx.spec.ts "N.N test name" | N.N |

## 3. Issue-to-Criterion Mapping
| Issue | Acceptance Criteria (from acceptance_criteria.md) |
|-------|--------------------------------------------------|
| I-xxx | N.N: criterion text |

## 4. Declared Files Per Sub-Sprint
### REM-n-BE
- server/file1.ts
- server/file2.ts

### REM-n-FE (requires user approval)
- client/src/pages/file1.tsx

### REM-n-DT
- shared/schema.ts

### REM-n-AU
- server/auth.ts

### REM-n-IN
- .env
- scripts/file.sh

## 5. Dependency Order
| Order | Sub-Sprint | Why First |
|-------|------------|-----------|
| 1 | REM-n-IN | Env vars needed by other domains |
| 2 | REM-n-DT | Schema/indexes needed by BE |
| 3 | REM-n-AU | Auth fixes needed by FE tests |
| 4 | REM-n-BE | Backend fixes |
| 5 | REM-n-FE | Frontend fixes (user approval required) |

## 6. Prerequisites
| Prerequisite | Status |
|-------------|--------|
| User approval for FE changes | PENDING / APPROVED |
| MCP tools needed | list or NONE |
| Env vars to set | list or NONE |
| External dependencies | list or NONE |

## 7. Test Infrastructure Fixes
| TI-ID | Fix | Affects |
|-------|-----|---------|
| TI-xxx | description | test files affected |
```

### Loop Prep Rules
1. Every issue in issues.md tagged "Next Sprint: Yes" must appear in the Issue-to-Domain Assignment
2. Every issue must map to at least one Playwright test — if no test exists, one must be created BEFORE the fix begins
3. Every issue must map to at least one criterion in acceptance_criteria.md — if none exists, add one
4. FE sub-sprint requires explicit user approval before work begins
5. Dependency order must be justified — IN and DT typically run first (infrastructure and data), AU next, BE next, FE last
6. Test infrastructure fixes (TI-xxx) are included in the prep and executed as part of the appropriate sub-sprint
7. Prerequisites must all be resolved before the first sub-sprint begins
8. **Every builder agent prompt MUST include the specific Playwright test command to verify the fix.** Format: `npx playwright test --grep "criterion-id"`. The builder runs this after the fix and reports PASS/FAIL. If FAIL, the builder investigates further — does NOT commit a broken fix.
9. **After all sub-sprints complete, the orchestrator runs all issue-specific tests as a smoke batch before full E2E.** Any failures are investigated before proceeding.
10. **The orchestrator presents issues.md with updated statuses to the user before running the full E2E.** User reviews and approves before E2E proceeds.

### After Remediation Completes
1. Orchestrator smoke tests all FIXED issues — updates statuses to VERIFIED or back to OPEN
2. Orchestrator presents issues.md statuses to user for review
3. User approves E2E run
4. Run T-n (full application test) using the Playwright suite
5. Compare results against prior T run — count improvements and regressions
3. Any new failures go to issues.md with domain tags
4. If issues remain → prepare next Loop Prep (REM-n+1) → repeat
5. If all tests pass → exit loop → proceed to L5 (user walkthrough)

### Loop Exit Criteria
- All Playwright tests pass (excluding intentionally deferred user stories US-008, US-019)
- All acceptance criteria in Section 3 show PASS
- No MAJOR issues in issues.md
- User approves loop exit

## Harness Check Skill
- Path: `.claude/commands/harness_check.md`
- Invoke: `/harness_check`
- Runs 10 deterministic checks matching watchdog C1-C11 + hook integrity

## Plan Authority
- `plan.md` is the authoritative roadmap
- sprints.json is the authoritative execution ledger
- No other file defines what work is planned or what work was done
# Harness Additions — Paste Into harness.md

## Verification Sprint Process (Light Governance)

Verification sprints (V- prefix) confirm that existing features work.
They do NOT modify application code. They have a lighter governance
process than development sprints.

**Required for V- sprints:**
- Register in sprints.json with status "in_progress"
- Create evidence directory
- Run the verification (test, API check, UI check)
- Write verification result to evidence/{sprint}/verification-result.md
- Commit evidence through pre-commit hook

**NOT required for V- sprints:**
- Pre-execution report (the sprint description in plan.md is the plan)
- Cross-sign (no code to review)
- Enforcer checklist (no code changes to check)
- Dry-run report (no external service writes)

**The pre-commit hook recognizes V- sprints:**
- Gate 2: evidence directory must exist
- Gate 2.5: SKIP for V- sprints (no declared files needed)
- Gate 3: SKIP for V- sprints (no enforcer checklist needed)
- Gate 4: SKIP for V- sprints (no cross-sign needed)
- Gates 1, 1.5, 1.6, 1.7, 1.8, 5, 6, 7: still enforced

## Entry Inspection Sprint Process (E- prefix)

Entry inspections verify phase dependencies before work begins.
Read-only — no code changes.

**Required:**
- Register in sprints.json
- Read dependency phase files, check for issues
- Write entry inspection report to evidence/{sprint}/
- Commit evidence

**Same light process as V- sprints.**

## Exit Inspection Sprint Process (T-X.EXIT)

Exit inspections verify a phase is complete before the next starts.
Run acceptance criteria and tests.

**Required:**
- Register in sprints.json
- Run relevant Playwright tests
- Check all phase sprints are committed
- Write verdict to evidence/{sprint}/
- Commit evidence

**Same light process as V- sprints.**

## Phase Entry/Exit Protocol

Every phase follows this sequence:
1. E-X.0 (Entry Inspection) — verify dependencies, check for drift
2. Work sprints (I-, G-, P-, R-, M-, D- prefixes) — full governance
3. T-X.EXIT (Exit Inspection) — verify all work, write verdict

If the exit verdict is not "SOLID", the next phase is BLOCKED.
Issues found during exit become new sprints in the CURRENT phase.

## Sprint Status Vocabulary

| Status | Meaning |
|--------|---------|
| planned | Sprint registered, work not started |
| in_progress | Sprint actively being worked on |
| committed | Sprint complete, committed with hash |
| parked | Sprint attempted but criteria not fully met |
| blocked | Sprint cannot start (dependency not met) |

## Sprint Type Prefixes

| Prefix | Type | Governance Level |
|--------|------|-----------------|
| E- | Exploratory (entry inspection) | Light |
| V- | Verification | Light |
| T- | Testing (exit inspection) | Light |
| I- | Issue fix | Full |
| G- | Gap fill | Full |
| P- | Plan (general development) | Full |
| R- | Remediation | Full |
| M- | Maintenance | Full |
| D- | Deferred | Full |
| L- | Launch | Full |

Light = no pre-exec, no cross-sign, no enforcer checklist.
Full = all governance artifacts required.
