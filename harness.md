# Ghost Protocol — Governance Harness (v5.0)

**Updated:** 2026-03-24
**Supersedes:** Previous harness (backed up at .ghost/backups/2026-03-23-phase-reset/harness.md)

## Core Principle

Every code change goes through a gated commit process. The pre-commit hook is the sole enforcement point. If a gate fails, the commit is BLOCKED. No exceptions. No carve-outs. If governance doesn't account for a situation, STOP → discuss with user → revise governance → re-run.

## UI Protection Rule (CRITICAL)

Frontend UI files (client/src/pages/, client/src/components/) are PROTECTED by default. They cannot be modified without explicit permission.

**How it works:**
1. Every sprint in sprints.json has a `uiPermissions` field
2. If `uiPermissions` is `"NONE"`, the pre-commit hook (EF-18) BLOCKS any staged UI files
3. If `uiPermissions` starts with `"DECLARED:"`, the sprint's pre-exec must list exactly which UI elements are being modified and why
4. The declared files gate (Gate 2.5) validates that only declared files are staged
5. EF-14 limits UI page changes to 40 lines per file (override with UI_EXCEPTION=true when owner has approved larger changes in the pre-exec)

**Before modifying any UI:**
- Check the sprint's `uiPermissions` in sprints.json
- If NONE: do NOT touch UI. Find a backend-only approach.
- If DECLARED: list every UI element you will modify in the pre-execution report under `## Declared Files` AND `## UI Changes`
- If the sprint doesn't have uiPermissions (legacy sprint): existing EF-14/EF-16 guards apply

**The UI Changes section in pre-exec must specify:**
```
## UI Changes (declared in sprint uiPermissions)
- Tab reorder: service.tsx tabs array changed from [dashboard, agents, campaigns, insights, calendar] to [campaigns, agents, insights, calendar]
- Tab removed: "Dashboard" tab case deleted from service.tsx
- Button added: "Upload CSV" button added to campaigns header in service.tsx
```
This creates an audit trail of exactly what was changed and why.

## Pre-Tool Hook
- Path: `.claude/hooks/context-check.sh`
- Config: `.claude/settings.json`
- Matcher: Bash, Edit, Write, Agent
- Fires before every matched tool call
- Checks session-state.md mtime — if older than 4 hours, BLOCK all tools
- Escape hatch: allows writes to session-state.md when stale (prevents deadlock)

## Pre-Commit Hook
- Source: `scripts/pre-commit.sh`
- Installed: `.git/hooks/pre-commit`
- After changes: `cp scripts/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit`

| Gate | Check |
|------|-------|
| 1 | COMMIT_ROLE and COMMIT_SPRINT env vars required. Sprint must exist in sprints.json. |
| 1.5 | Previous sprint in sprints.json must be committed or parked (chain of custody) |
| 1.6 | Fresh watchdog scan — all violations must be acknowledged |
| 1.7 | Session state content must reference current sprint |
| 1.8 | Ghost messages — no unacknowledged BLOCK directives |
| 2 | Evidence directory must exist and be non-empty |
| 2.5 | Declared Files — all staged application files must be listed in pre-execution-report.md (SKIP for light governance) |
| 2.6 | Pre-exec must predate post-sprint by 5+ minutes (anti-retroactive) (SKIP for light governance) |
| 3 | Enforcer checklist must exist and contain RESULT: APPROVED (SKIP for light governance) |
| 4 | Cross-sign: APPROVED verdict, different roles, fresh timestamp (SKIP for light governance) |
| 5 | All staged files within COMMIT_ROLE scope |
| 6 | Enforcement checks: EF-01 (TypeScript), EF-05 (governance files), EF-14 (UI 40-line limit), EF-15 (data array guard), EF-16 (UI element guard), EF-17 (locked values), **EF-18 (UI Permission Gate — v5.0)** |
| 7 | Hook integrity — installed hook matches source |

### Gate 6 — EF-18: UI Permission Gate (NEW in v5.0)

For `S-*` sprints, the hook reads the sprint's `uiPermissions` field from sprints.json:
- **NONE**: Any staged file in `client/src/pages/` or `client/src/components/` → BLOCKED
- **DECLARED: ...**: UI changes allowed, but Gate 2.5 validates they're declared in pre-exec
- **Empty/missing**: Legacy behavior (EF-14 + EF-16 guards apply)

This gate ensures the dev agent cannot modify UI without explicit sprint-level permission from the plan.

## Watchdog
- Script: `scripts/watchdog.sh`
- Modes: scan (full audit), watch (real-time via inotifywait), verify-ack, verify-ghost
- Report: `evidence/watchdog-report.txt`
- Ack: `evidence/watchdog-ack.txt`

| Check | What |
|-------|------|
| C1 | sprints.json integrity (max 1 in_progress, committed have hash, no duplicates, batch detection) |
| C2 | Evidence artifact completeness (required files present per sprint type) |
| C3 | Cross-sign validity (approved verdict, different roles, min 5 lines) |
| C4 | Enforcer checklist validity (APPROVED, not BLOCKED) |
| C5 | Uncommitted evidence accumulation (max 1 untracked evidence dir) |
| C6 | Destructive change detection (deletions > insertions in pages, data array removal, endpoint removal) |
| C7 | Session state freshness (mtime < 4 hours) |
| C8 | Hook integrity (md5 match between source and installed) |
| C9 | Chain of custody (commit hashes exist in git log, chronological order) |
| C10 | Timestamp anomaly detection (identical mtimes, future timestamps) |
| C11 | Plan file alignment |
| C12 | Protected path monitoring (watch mode only) |
| C13 | Session state content accuracy |
| C14 | Governance file modification detection |
| C15 | Memory staleness |
| C16 | Application changes without sprint — VIOLATION |
| C17 | Plan vs execution — Declared Files comparison |
| C18 | Retroactive artifact detection |

**Sprint type handling in watchdog:**
- `V-*`, `E-*`, `T-*.EXIT` sprints: Light governance — C2 skips required artifact checks, C3/C4 skip cross-sign/checklist checks, C18 skips retroactive detection
- `S-*` sprints (v5.0): Full governance — all checks enforced
- All other prefixes: Full governance

## Sprint Types

### v5.0 Sprints (current)
| Prefix | Type | Governance |
|--------|------|-----------|
| S-* | Page-based sprint (v5.0) | Full — all gates enforced, UI gated by uiPermissions field |

### Legacy Sprints (historical — still recognized by scripts)
| Prefix | Type | Governance |
|--------|------|-----------|
| V- | Verification | Light |
| E- | Exploratory/Entry inspection | Light |
| T- | Testing/Exit inspection | Light |
| I- | Issue fix | Full |
| G- | Gap fill | Full |
| P- | Plan (general development) | Full |
| R- | Remediation | Full |
| M- | Maintenance | Full |
| D- | Deferred | Full |
| L- | Launch | Full |

## Sprint Statuses
| Status | Meaning |
|--------|---------|
| planned | Registered in sprints.json, work not started |
| in_progress | Actively being worked on (max 1 at a time) |
| parked | Paused — remaining work tracked, can resume |
| committed | Done, with git commit hash as proof |

Lifecycle: planned → in_progress → committed
Park: in_progress → parked (add parkedReason)

## Sprint Lifecycle (v5.0)

1. Set sprint status to "in_progress" in sprints.json
2. Create evidence/{sprint-id}/ directory
3. Write pre-execution-report.md with:
   - `## Declared Files` — every application file that will be modified
   - `## UI Changes` — if uiPermissions is DECLARED, list every UI element being changed
   - `## Acceptance Criteria` — copy the sprint's inline ACs from sprints.json
   - `## Test Plan` — list EVERY test file that will be written and/or run, including:
     * New test file to create (e.g., "Write tests/e2e/s2-teambox.spec.ts")
     * Existing test files to run (e.g., "Run tests/e2e/domain-05-teambox.spec.ts")
     * Cross-tests from plan.md Section 0 table (e.g., "Cross-test: domain-04-campaigns.spec.ts")
     * The exact npx playwright test commands that will be executed
4. Acknowledge any pending ghost messages
5. IMPLEMENT — build the sprint's components (follow plan.md SPEC sections)
6. SELF-TEST — run the sprint's test file. All ACs must pass.
7. FIX LOOP — if failures: fix CODE (not test), re-run, max 2 attempts per issue, max 30 min per issue. If stuck → STOP and escalate to owner.
8. CROSS-TEST — run overlapping sprint tests (see plan.md Section 0 cross-test table). If regression caused by this sprint → fix before committing. If pre-existing → log in issues.md, don't block.
9. Write post-sprint-report.md with AC results and evidence references
10. Run enforcer-checklist.sh
11. Write cross-sign.md (different role reviews)
12. Commit: `COMMIT_ROLE=<role> COMMIT_SPRINT=<sprint-id> git commit -m "message"`
    - For sprints with UI changes: `UI_EXCEPTION=true COMMIT_ROLE=... COMMIT_SPRINT=... git commit -m "..."`
13. Update sprints.json with commitHash
14. VISUAL INSPECTION — if sprint requires owner inspection (S-2, S-4, S-5, S-6, S-8, S-10): STOP and present app for review. Wait for owner APPROVED before next sprint.
15. Update session state

## Required Artifacts Per Sprint

| File | Required Content | Notes |
|------|-----------------|-------|
| pre-execution-report.md | Timestamp, Sprint, Status: READY, ## Declared Files, ## UI Changes (if applicable), ## Test Plan (list every test file to write and run) | Written BEFORE code changes |
| post-sprint-report.md | Timestamp, Sprint, Status: COMPLETE, ## AC Results (table), ## Test Execution (exact npx playwright commands run + pass/fail counts), ## Cross-Test Results (if applicable) | Written after work is done. MUST contain actual test output, not just "verified via API" |
| cross-sign.md | Implementing Role, Reviewing Role, Verdict: APPROVED | Roles must differ, fresh timestamp |
| enforcer-checklist.txt | RESULT: APPROVED | Generated by scripts/enforcer-checklist.sh |
| workflow-audit.log | Agent launch entries with scope declarations | Auto-generated by harness |

## Watchdog Acknowledgment
When a scan finds violations, write `evidence/watchdog-ack.txt`:
- Required fields: Acknowledged-By, Sprint, Timestamp
- Must address every violation check ID with ACKNOWLEDGED and explanation
- Must be less than 60 minutes old

## Ghost Handshake
1. Ghost agent writes `.ghost/ghost_messages.json` with directives
2. Dev agent reads before commit
3. Dev agent acknowledges in pre-execution report
4. Gate 1.8 BLOCKS if unacknowledged BLOCK directives exist

## Role Enforcement

| Role | Can Modify | Cannot Modify |
|------|-----------|---------------|
| Orchestrator | Governance files, evidence/, sprints.json, sprint-scoped app files | — |
| Builder (backend) | server/ files | client/, scripts/, governance |
| Builder (frontend) | client/ files (only when uiPermissions allows) | server/, scripts/, governance |
| Enforcer | Evidence review only | Application code |

## Constraints
- Max 1 sprint in_progress at a time
- Previous sprint must be committed before starting next
- Max 1 uncommitted evidence directory
- UI files BLOCKED unless sprint's uiPermissions field allows it
- Orchestrator does not write application code — delegates to builders
- All issues must have acceptance criteria before work begins

## Plan Authority
- **sprints.json** is the authoritative execution ledger AND acceptance criteria source
- **plan.md** is the implementation guide with exact code changes (SPEC sections)
- **acceptance_criteria.md** is a human-readable summary — NOT the source of truth
- No other file defines what work is planned or what work was done
