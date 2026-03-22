# Nexxus Connect v2.2

## What This Is
CRM/AI platform for automotive dealerships. Express 5 + React 18 + Vite 7 + Drizzle ORM + TypeScript 5.6 + PostgreSQL (Supabase).

## How to Commit
```bash
COMMIT_ROLE=<role> COMMIT_SPRINT=<sprint-id> git commit -m "message"
```
Roles: frontend, backend, test, integration, scribe, enforcer, architect, orchestrator

## Governance
The Ghost Protocol harness enforces all work through a gated process. Register the sprint, declare files, do the work, prove it, commit through the hook. Details:

- **harness.md** — Full harness specification: pre-commit gates, watchdog checks, ghost handshake, sprint lifecycle, sprint statuses, issue domains, role enforcement, UI protection rule, Loop Preparation Framework
- **sprints.json** — Sprint registry. Statuses: planned, in_progress, remediating, committed, tested. One sprint in_progress at a time. Remediation sprints have domain sub-sprints (REM-n-FE, REM-n-BE, REM-n-DT, REM-n-AU, REM-n-IN).
- **scripts/pre-commit.sh** — Pre-commit hook (7+ gates). Source of truth for what blocks a commit.
- **scripts/watchdog.sh** — Watchdog scanner (C1-C18). Detects governance violations.
- **scripts/enforcer-checklist.sh** — Enforcer checklist runner.
- **scripts/check-file-scope.sh** — File scope validator per role.
- **evidence/{sprint-id}/** — Per-sprint artifacts (pre-execution, post-sprint, cross-sign, checklist, workflow-audit).

## UI Protection
Frontend UI (client/src/pages/, client/src/components/) must not be modified without explicit user approval. Once tests pass, no frontend changes unless the user is actively supervising. Backend-only fixes preferred.

## Project Documents

- **plan.md** — Roadmap. What's left to do before launch, in order.
- **issues.md** — Open issues. Every bug, gap, and defect with Background, Outcome, and Acceptance Criteria. Only truly open items.
- **backlog.md** — Items not blocking launch. Consolidated list with categories (security, features, tech debt, UX).
- **acceptance_criteria.md** — Master acceptance criteria. Feature map checklist (83 criteria across 12 domains), user story coverage matrix, launch readiness tracker.
- **user-stories.md** — User story library (US-001 through US-030). Specification authored by project owner. Not to be edited by the build process. acceptance_criteria.md references this.

## Where Things Are
- **Third-party comms**: All route through central-mcp at localhost:4002 via callMCP() in server/vendorProxy.ts
- **Infrastructure authority**: /home/ubuntu/Claude-store/sysadmin/
- **User stories**: user-stories.md (US-001 through US-030, authored by project owner)
- **Feature map**: evidence/QA-S0/feature-map.md (12 domains, 22 pages, 124 endpoints)

## Issue Domains
Issues tagged by domain in issues.md. Remediation clustered by domain.
- **FE**: Frontend — UI, pages, forms, client logic
- **BE**: Backend — APIs, business rules, services, integrations
- **DT**: Data — schema, database, migrations, reporting data
- **AU**: Auth/Security — login, permissions, security controls
- **IN**: Infrastructure — deploys, environments, monitoring, scaling

## Remediation Loop
Before every REM sprint, produce a **Loop Prep Document** (`evidence/REM-n/loop-prep.md`) containing: issue-to-domain assignment, issue-to-test mapping, issue-to-criterion mapping, declared files per sub-sprint, dependency order, and prerequisites. No code work begins until loop prep is complete. See harness.md for full template.

### Smoke Testing (CRITICAL)
- After every fix, the builder agent runs the specific Playwright test mapped to that issue. Fix is not complete until the test passes.
- After all sub-sprints, orchestrator runs all issue-specific tests as a smoke batch.
- Orchestrator presents issues.md with statuses (OPEN/FIXING/FIXED/VERIFIED) to the user before running full E2E.
- No issue removed from issues.md without VERIFIED status (passing smoke test).
- After every T-n run, new failures go INTO issues.md as OPEN with domain tags.
- After every REM-n, statuses are updated — never silently removed.

## Action Protocol (CRITICAL)
Do NOT take action (edit files, run commands, dispatch agents) unless the user explicitly directs it. When the user asks a question or presents information, RESPOND with analysis and options — do NOT jump into execution. Wait for explicit instruction before proceeding. "Yes" or "go ahead" or a specific directive means act. A question or observation does NOT mean act.

## Agent Filesystem Boundaries (CRITICAL)
Builder agents MUST NOT modify files outside this project directory (`/home/ubuntu/Claude-store/nexxus2.2_replit/`). This includes:
- `/home/ubuntu/Claude-store/central-mcp/` — MCP server (separate project)
- `/home/ubuntu/Claude-store/sysadmin/` — infrastructure authority
- `/home/ubuntu/Live-Store/` — old app (read-only reference)
- Any other project under `/home/ubuntu/Claude-store/`

If a builder agent encounters a blocker in an external project, it must STOP and report the blocker. It must NOT fix it. The orchestrator escalates external blockers to the user.

**Incident:** REM-8-DT (2026-03-19) — a builder agent rewrote `central-mcp/src/connectors/vin-connector.ts` without authorization. central-mcp had no git repo, so no backup or revert was possible. The watchdog only monitors this project and had no visibility. This rule exists to prevent recurrence.

## VIN Solutions — Safe MCP Server (CRITICAL)

**IMPORTANT:** All VIN Solutions write operations (creating contacts, leads, updating records) MUST go through the VIN Safe MCP server, NOT the central-mcp server.

### Connection Details

- **URL:** http://0.0.0.0:4003/mcp
- **Authorization:** Bearer 8NCVZ8ZCgHtab6A+FxHsgOKcgir89KvOR+wMIpYFLp4=
- **Server:** vin-safe-mcp (PM2 process, port 4003)

Central MCP (port 4002) is still used for all other providers (VAPI, TextMagic, Tavus, Resend, FlexPrice, etc.) and for VIN Solutions READ operations. The safe server is specifically for VIN WRITES.

### Write Flow — MANDATORY

VIN Solutions writes follow a prepare → review → execute → verify flow. There are no shortcuts.

**Step 1: Prepare**
Call `vin_safe_prepare_lead` with the contact details. This resolves the dealer, user, and lead source WITHOUT creating anything. If any resolution fails, it returns the error and available options.

**Step 2: Review**
The tool returns a full preview showing:
- Who the lead will be assigned to (name + userId)
- What lead source will be used
- The exact payloads that will be sent
- An approval token (expires in 10 minutes)

Present this preview to the user. Do NOT proceed without explicit user approval.

**Step 3: Execute**
Call `vin_safe_execute_lead` with the approval token and `user_confirmed: true`. This creates the contact, creates the lead, then reads back the contact to verify the assignment.

**Step 4: Verify**
The tool returns a verification result: `VERIFIED_CORRECT` or `ASSIGNMENT_MISMATCH`. If there is a mismatch, STOP and report the issue. Do not continue with additional records.

### Rules

1. **NEVER create VIN contacts or leads through central-mcp.** Use vin-safe-mcp only.
2. **NEVER set user_confirmed: true without showing the preview to the user first.**
3. **NEVER batch-insert leads.** Process one at a time. Verify each one before proceeding to the next.
4. **If vin_safe_prepare_lead fails resolution, do NOT try to work around it.** Report the exact error to the user and wait for guidance.
5. **If verification returns ASSIGNMENT_MISMATCH, STOP immediately.** Do not create any more records until the issue is understood.
6. **If you need to pass a specific userId, call vin_list_users first** and let the user choose. Do not guess.
7. **If you need a lead source name, call vin_list_lead_sources first** and let the user choose from the exact list for that dealer. Source names differ per dealer.

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

This server is managed by the central-mcp project owner. If you encounter an issue with the VIN Safe MCP, document it as a blocker and report it. Do not modify the server code.

## Current State
16 REMEDIATING issues. VIN-1 sprint in progress. Database: Supabase. All org outbound disabled via CommGate. VAPI webhook URLs not yet updated to live.huminic.app.
# CLAUDE.md Additions — Paste Into Dev Agent Project

These sections should be added to the dev agent's CLAUDE.md.
They are the result of GHOST-ALIGN-1 governance tightening.

---

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
- Any API call that creates or modifies external data (VIN Solutions,
  VAPI, TextMagic, Tavus, Resend)
- Any email send to real addresses
- Any SMS send to real numbers
- Any production deployment to live.huminic.app
- Any database migration on production
- Any git push or force-push

If you are about to take an IRREVERSIBLE action, STOP and present
exactly what you intend to do. Wait for the owner to say "go."

## Deployment Actions Rule (CRITICAL)

The following are GATED deployment actions:
- npm run build
- pm2 restart (any app name)
- pm2 reload
- Any command that changes what is running in production

These MUST NOT be run as standalone commands. They are part of the
sprint lifecycle ONLY:
- Run AFTER code is committed through the pre-commit hook
- ONLY when COMMIT_SPRINT is set and the sprint is committed
- NOT during investigation, debugging, or "let me check if this works"

If you need to test code locally: use npm run dev (dev server)
or run a single test file. Production build and restart require
a committed sprint.

Violation: Deploying without a committed sprint is the most severe
governance breach. It creates production changes with zero audit trail.

## CommGate Rule (CRITICAL)

All outbound communications (email, SMS, phone calls, webhook
notifications) must respect the CommGate flags on the organization.

- During testing: CommGate defaults to OFF for all orgs
- For production: CommGate is ON only when owner explicitly enables it
- Test payloads MUST NOT trigger real sends to real people

If CommGate is disabled and outbound code is triggered (by webhook,
test payload, or any other mechanism), no email/SMS/call is sent.
The attempt is logged with status "blocked" and the reason.

Before writing any code that sends outbound communications:
1. Verify CommGate check exists in the code path
2. If missing, add it before the send call
3. Never bypass CommGate, even for "quick tests"

## Emergency Sprint Rule

Emergency sprints (EMG- prefix) may be registered when production
is broken and customers are actively affected.

Requirements (still apply):
- Register sprint in sprints.json BEFORE any code changes
- Write pre-execution report (brief — 5 lines minimum)
- Commit through the pre-commit hook
- Do NOT deploy without committing

May skip:
- Ghost pre-review
- Dry-run report
- Scope limit (5-file max)

The owner reviews emergency sprints after the fact. If the emergency
was not genuine, the sprint is reclassified as a governance violation.

## Mid-Sprint Scope Change Rule

If the sprint scope changes significantly during execution:

1. Do NOT silently expand the scope
2. Do NOT update the declared files list and keep going as if nothing changed
3. Park the current sprint:
   - Set status to "parked" in sprints.json
   - Add parkedReason explaining what changed
4. Register a new sprint with the corrected scope
5. The new sprint's pre-exec references the parked sprint and explains the pivot

Small additions (1-2 extra files) can be handled by updating the
## Declared Files section in the pre-execution report before modifying
the new file. But if the objective itself has changed, park and pivot.

## Decision Log & Threshold

When making implementation decisions during a sprint:

**STOP and ask the owner if:**
- The decision affects what a user sees (UI behavior, error messages, data display)
- The decision affects what gets sent externally (email content, SMS text, API payloads)
- The decision affects what gets stored permanently (database schema, data transformations)
- You are choosing between two approaches and you're not sure which is correct

**Proceed and document if:**
- The decision only affects internal code structure
- Both approaches produce identical external behavior
- The decision is a standard coding pattern (error handling style, variable naming)

Document all non-trivial decisions in evidence/{sprint}/decisions.md:
```
### Decision: [short description]
Options: [A] vs [B]
Chose: [A/B]
Reason: [why]
Impact: [what changes if this is wrong]
```

## Sprint Checkpoint System

Every sprint maintains a checkpoint file at evidence/{sprint}/checkpoint.json:

```json
{
  "sprint": "I-091",
  "step": "builder_complete",
  "files_modified": ["server/routes/sms.ts"],
  "dry_run": "not_required",
  "tests_run": false,
  "committed": false
}
```

Steps in order:
registered → pre_exec_written → builder_delegated → builder_complete
→ dry_run_done → tests_run → post_sprint_written → cross_signed
→ checklist_run → committed

Update the checkpoint after each step. On session restart, read the
checkpoint to know exactly where you are. Do not guess.

## Dry-Run Requirement

Any sprint that touches integration files (outbound.ts, vendorProxy.ts,
sync.ts, webhooks.ts, or any file that calls callMCP) requires a
dry-run report before full execution.

The dry run tests ONE record/call/message and documents:
- What was sent
- What was received
- Whether the result was correct
- Any issues found

Write results to evidence/{sprint}/dry-run-report.md.
Present the dry-run results to the owner before proceeding to full
execution. The watchdog (C21) checks for this file.

## Superpowers Usage

Use these superpowers at the right moments:
- /superpowers:writing-plans — before starting any multi-step sprint
- /superpowers:verification-before-completion — before claiming any work is done
- /superpowers:dispatching-parallel-agents — for independent builder tasks
- /superpowers:requesting-code-review — at cluster completion
- /superpowers:systematic-debugging — before proposing any bug fix
