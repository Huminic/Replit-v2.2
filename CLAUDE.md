# Nexxus Connect v2.2

## What This Is
CRM/AI platform for automotive dealerships. Express 5 + React 18 + Vite 7 + Drizzle ORM + TypeScript 5.6 + PostgreSQL (Supabase).

## How to Commit
```bash
COMMIT_ROLE=<role> COMMIT_SPRINT=<sprint-id> git commit -m "message"
```
Roles: frontend, backend, test, integration, scribe, enforcer, architect, orchestrator

## Runtime Environment

| Item | Value |
|------|-------|
| Dev URL | https://dev.huminicdev.com |
| Production URL | https://live.huminic.app |
| PM2 process | nexxus-app (port 5000) |
| Database | Supabase PostgreSQL (aws-0-us-west-2.pooler.supabase.com) |
| Test password | NexxusTest2026 (all test accounts) |
| Dev server | npm run dev (local testing only) |
| Build + deploy | npm run build && pm2 restart nexxus-app (GATED — committed sprint required) |

### Test Accounts (all use password: NexxusTest2026)
| Email | Role | Org |
|-------|------|-----|
| duane.wells@huminic.ai | super_admin | Huminic (NOTE: currently on Tony Serra Ford — S-0 must fix to Huminic) |
| duanekwells@gmail.com | partner_admin | Cage Automotive |
| serra_honda@huminic.ai | org_admin | Serra Honda |
| serra_nissan@huminic.ai | org_admin | Serra Nissan |
| serra_ford@huminic.ai | org_admin | Tony Serra Ford |
| columbia_hyundai@huminic.ai | org_admin | Hyundai of Columbia |
| columbia_ford@huminic.ai | org_admin | Ford of Columbia |

### Required .env Variables
ANTHROPIC_API_KEY, BRAVE_API_KEY, APP_BASE_URL, VIN_SAFE_MCP_TOKEN, DATABASE_URL, VINSOLUTIONS_API_KEY, OPENAI_API_KEY, FAL_KEY, RESEND_API_KEY — all must be set. If any are missing, features depending on them will fail silently.

## Reading Order for Sprint Work (CRITICAL)

Before starting ANY sprint, read these files in this order:
1. **sprints.json** → Find your sprint → Get components, acceptance criteria, files to modify, UI permissions
2. **plan.md Section 0** → Sprint Execution Protocol (test/fix/retest loop, escalation rules, visual inspection gates)
3. **plan.md sprint section** → Understand HOW to implement (exact code changes, SPEC sections, API shapes)
4. **Source files** listed in the sprint's `filesModified` → Read BEFORE writing. Understand existing code.
5. If the sprint references **agent-instructions.json**, read it.
6. If the sprint resolves issues, check **issues.md** for context.
7. Read **plan.md Section 3e** (Hard-Won Lessons) — mistakes that must not be repeated.

## Sprint Pre-Flight Checklist (CRITICAL — do this BEFORE every sprint)

Before writing any code for a sprint, complete this checklist:

1. **Scan ACs:** Read every acceptance criterion for this sprint in sprints.json. Identify any that are ambiguous, reference unknown values, or assume something you can't verify. If found → ASK the owner before proceeding.
2. **Scan components:** Read every component description. Identify any that reference files you haven't read, APIs you haven't checked, or features you're unsure exist. If found → READ the file/API first.
3. **Scan test references:** Check which test files cover this sprint. Read the existing tests to understand what's already verified vs what's new.
4. **Check for assumptions:** Look for words like "should," "probably," "likely," "assumed" in the sprint description. These are red flags. Verify each one against the code.
5. **Clean worktree:** Run `git status` — no uncommitted changes from previous work. If dirty → stash or commit first.
6. **Update session state:** Write current sprint ID to session-state.md before starting.
7. **Verify pre-requisites:** If the sprint depends on other sprints (check `dependsOn`), verify those are committed with hashes.
8. **Role:** You are the ORCHESTRATOR. You do NOT write application code directly. Delegate to builder sub-agents. You manage the sprint lifecycle, evidence, and governance.
9. **Write pre-execution-report.md** with ALL required sections:
   - `## Objective`
   - `## Declared Files`
   - `## UI Changes` (if uiPermissions is DECLARED)
   - `## Acceptance Criteria` (copy from sprints.json)
   - `## Test Plan` — list EVERY test file to write and run, EVERY cross-test, and the EXACT npx playwright test commands
10. **GHOST GATE (file-based):** After writing the pre-exec, STOP. The ghost agent will:
    - Read evidence/S-[X]/pre-execution-report.md
    - Diff it against sprints.json (components, ACs, files, UI permissions)
    - Write a `## Ghost Entry Gate` section AT THE BOTTOM of the same pre-execution-report.md with its verdict
    - If APPROVED: you will see "ENTRY GATE: APPROVED" in the file — you may begin implementation
    - If REJECTED: you will see "ENTRY GATE: REJECTED" with reasons — fix and resubmit
    - Do NOT start coding until the file contains "ENTRY GATE: APPROVED"
    - Check: `grep "ENTRY GATE: APPROVED" evidence/S-[X]/pre-execution-report.md`

If ANY checklist item reveals an issue → STOP and resolve it before proceeding. Do not start implementation with unresolved questions.

## Sprint Completion Protocol (CRITICAL — do this AFTER every sprint)

After all tests pass and before committing:

1. **Write post-sprint-report.md** with ALL required sections:
   - `## AC Results` — table with EVERY AC from sprints.json: ID, PASS/FAIL, evidence reference
   - `## Test Execution` — the EXACT npx playwright test commands run, copy-pasted terminal output with pass/fail counts
   - `## Cross-Test Results` — same format for cross-tests (or "N/A — no cross-tests for this sprint")
   - If ANY AC is FAIL → STOP and escalate to owner. Do NOT commit with known failures.
2. **Commit through harness** (all gates must pass)
3. **GHOST GATE (file-based):** After committing, STOP. The ghost agent will:
   - Read evidence/S-[X]/post-sprint-report.md
   - Verify test execution, AC results, cross-test results
   - Run the 11-question gate checklist
   - Write a `## Ghost Exit Gate` section AT THE BOTTOM of the same post-sprint-report.md with its verdict
   - If CLEARED: you will see "EXIT GATE: CLEARED" in the file — you may start next sprint's pre-exec
   - If NOT CLEARED: you will see "EXIT GATE: NOT CLEARED" with reasons — fix and resubmit
   - Do NOT start the next sprint until the file contains "EXIT GATE: CLEARED"
   - Check: `grep "EXIT GATE: CLEARED" evidence/S-[X]/post-sprint-report.md`

sprints.json is the single source of truth for what to build and what "done" means. plan.md provides implementation details. acceptance_criteria.md is a human-readable summary — do NOT use it as primary reference.

## Governance

Work goes through a gated process: register sprint → declare files → do work → prove it → commit through hook.

- **sprints.json** — Sprint registry v5.0. 11 sprints (S-0 through S-10), organized by page. Each sprint contains inline acceptance criteria with test references and evidence types. One sprint in_progress at a time.
- **plan.md** — Implementation plan. Per-sprint details including exact code changes (SPEC sections), API response shapes, test templates, and autonomous agent specifications.
- **harness.md** — Pre-commit gates, watchdog checks, ghost handshake.
- **scripts/pre-commit.sh** — Pre-commit hook. Source of truth for what blocks a commit.
- **scripts/watchdog.sh** — Watchdog scanner (C1-C18). Detects governance violations.
- **evidence/{sprint-id}/** — Per-sprint artifacts.

**NOTE:** The old plan/ directory (plan/01-auth-security.md through plan/15-launch.md) is HISTORICAL REFERENCE ONLY. Do NOT follow those files. plan.md is the active plan.

## UI Protection
Frontend UI (client/src/pages/, client/src/components/) must not be modified without explicit permission. Each sprint in sprints.json has a `uiPermissions` field that declares exactly what UI elements may be modified. If `uiPermissions` says "NONE", do not touch any UI. If it lists specific elements, modify ONLY those.

## Project Documents

- **plan.md** — Active implementation plan. 11 sprints organized by page. Contains SPEC sections with exact code changes, API shapes, and test templates for autonomous execution.
- **sprints.json** — Sprint registry with inline acceptance criteria. Source of truth for "what to build" and "what done means."
- **issues.md** — Open issues. Every bug, gap, and defect with Background, Outcome, and Acceptance Criteria.
- **agent-instructions.json** — Pre-written agent persona instructions. Used by S-0.3b to seed the agents table.
- **acceptance_criteria.md** — Human-readable summary of acceptance criteria. NOT the source of truth — sprints.json is.
- **backlog.md** — Items not blocking launch.
- **user-stories.md** — User story library (US-001 through US-030). Authored by project owner. Do not edit.

## Where Things Are
- **Third-party comms**: Route through central-mcp at localhost:4002 via callMCP() in server/vendorProxy.ts (READ operations and non-VIN providers)
- **VIN Solutions writes**: Route through vin-safe-mcp at localhost:4003 (see VIN Safe MCP section below)
- **Infrastructure authority**: /home/ubuntu/Claude-store/sysadmin/
- **User stories**: user-stories.md
- **Old plan files**: plan/ directory (historical only — do NOT follow)
- **Backups of old governance**: .ghost/backups/2026-03-23-phase-reset/

## Action Protocol (CRITICAL)
Do NOT take action (edit files, run commands, dispatch agents) unless the user explicitly directs it. When the user asks a question or presents information, RESPOND with analysis and options — do NOT jump into execution. Wait for explicit instruction before proceeding.

## Agent Filesystem Boundaries (CRITICAL)
Builder agents MUST NOT modify files outside this project directory (`/home/ubuntu/Claude-store/nexxus2.2_replit/`). This includes:
- `/home/ubuntu/Claude-store/central-mcp/` — MCP server (separate project)
- `/home/ubuntu/Claude-store/sysadmin/` — infrastructure authority
- `/home/ubuntu/Live-Store/` — old app (read-only reference)
- Any other project under `/home/ubuntu/Claude-store/`

If a builder agent encounters a blocker in an external project, it must STOP and report the blocker. It must NOT fix it.

**Incident:** REM-8-DT (2026-03-19) — a builder agent rewrote `central-mcp/src/connectors/vin-connector.ts` without authorization. central-mcp had no git repo, so no backup or revert was possible. This rule exists to prevent recurrence.

## VIN Solutions — Safe MCP Server (CRITICAL)

**IMPORTANT:** All VIN Solutions write operations (creating contacts, leads, updating records) MUST go through the VIN Safe MCP server, NOT the central-mcp server.

### Connection Details

- **URL:** http://0.0.0.0:4003/mcp
- **REST API:** http://0.0.0.0:4003/api/tool/{tool_name}
- **Authorization:** Bearer 8NCVZ8ZCgHtab6A+FxHsgOKcgir89KvOR+wMIpYFLp4=
- **Server:** vin-safe-mcp (PM2 process, port 4003)

Central MCP (port 4002) is still used for all other providers (VAPI, TextMagic, Tavus, Resend, FlexPrice, etc.) and for VIN Solutions READ operations. The safe server is specifically for VIN WRITES.

### Write Flow — MANDATORY

VIN Solutions writes follow a prepare → review → execute → verify flow. There are no shortcuts.

**Step 1: Prepare**
Call `vin_safe_prepare_lead` with the contact details. This resolves the dealer, user, and lead source WITHOUT creating anything.

**Step 2: Review**
The tool returns a full preview. Present to user. Do NOT proceed without explicit approval.

**Step 3: Execute**
Call `vin_safe_execute_lead` with the approval token and `user_confirmed: true`.

**Step 4: Verify**
The tool returns `VERIFIED_CORRECT` or `ASSIGNMENT_MISMATCH`. If mismatch, STOP.

### Rules

1. **NEVER create VIN contacts or leads through central-mcp.** Use vin-safe-mcp only.
2. **NEVER set user_confirmed: true without showing the preview to the user first.**
3. **NEVER batch-insert leads.** Process one at a time.
4. **If prepare fails, STOP and report.** Do not work around it.
5. **If verification returns ASSIGNMENT_MISMATCH, STOP immediately.**

### Available Tools (port 4003)

| Tool | Purpose | Writes? |
|------|---------|---------|
| vin_health_check | Verify connectivity | No |
| vin_get_dealer_id | Resolve org UUID → dealer ID | No |
| vin_list_users | List all users at a dealer | No |
| vin_resolve_user_id | Show who the default user resolves to | No |
| vin_list_lead_sources | List lead sources at a dealer | No |
| vin_api_read | Generic GET to any VIN endpoint | No |
| vin_safe_prepare_lead | Prepare lead creation — full preview | No |
| vin_safe_execute_lead | Execute prepared lead with verification | Yes (approval-gated) |

### DO NOT modify vin-safe-mcp code
This server is managed by the central-mcp project owner. Document blockers, do not fix.

## Action Classification (CRITICAL)

Every action falls into one of three categories:

**SAFE (do freely):**
- Read any file
- Write to evidence/ directories
- Write test files in tests/
- Run dev server (npm run dev)
- Run single test files (npx playwright test <file>)
- Update session state and memory
- Read database (SELECT queries)

**GATED (requires committed sprint):**
- Modify application code (server/, client/src/, shared/)
- npm run build
- pm2 restart
- Database schema changes (migrations)

**IRREVERSIBLE (requires explicit owner approval):**
- Any API call that creates or modifies external data (VIN Solutions, VAPI, TextMagic, Tavus, Resend)
- Any email send to real addresses
- Any SMS send to real numbers
- Any production deployment to live.huminic.app
- Any database migration on production
- Any git push or force-push

If you are about to take an IRREVERSIBLE action, STOP and present exactly what you intend to do. Wait for the owner to say "go."

## Deployment Actions Rule (CRITICAL)

npm run build, pm2 restart, pm2 reload — these are GATED deployment actions.
- Run AFTER code is committed through the pre-commit hook
- ONLY when COMMIT_SPRINT is set and the sprint is committed
- NOT during investigation, debugging, or "let me check if this works"
- Use npm run dev for local testing

## CommGate Rule (CRITICAL)

All outbound communications must respect CommGate flags on the organization.
- Test payloads MUST NOT trigger real sends to real people
- If CommGate is disabled, sends are logged with status "blocked"
- Never bypass CommGate, even for "quick tests"

## Decision Log

When making implementation decisions during a sprint:

**STOP and ask the owner if:**
- The decision affects what a user sees (UI behavior, error messages, data display)
- The decision affects what gets sent externally (email content, SMS text, API payloads)
- The decision affects what gets stored permanently (database schema, data transformations)

**Proceed and document if:**
- The decision only affects internal code structure
- Both approaches produce identical external behavior

Document non-trivial decisions in evidence/{sprint}/decisions.md.

## Emergency Sprint Rule

Emergency sprints (EMG- prefix) may be registered when production is broken.
Requirements still apply: register in sprints.json, write pre-exec, commit through hook.
May skip: ghost pre-review, dry-run, scope limit.

## Mid-Sprint Scope Change

If scope changes significantly: park the sprint (set status "parked", add reason), register new sprint with corrected scope. Small additions (1-2 files) can be handled by updating declared files in pre-exec.
