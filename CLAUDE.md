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

## Agent Filesystem Boundaries (CRITICAL)
Builder agents MUST NOT modify files outside this project directory (`/home/ubuntu/Claude-store/nexxus2.2_replit/`). This includes:
- `/home/ubuntu/Claude-store/central-mcp/` — MCP server (separate project)
- `/home/ubuntu/Claude-store/sysadmin/` — infrastructure authority
- `/home/ubuntu/Live-Store/` — old app (read-only reference)
- Any other project under `/home/ubuntu/Claude-store/`

If a builder agent encounters a blocker in an external project, it must STOP and report the blocker. It must NOT fix it. The orchestrator escalates external blockers to the user.

**Incident:** REM-8-DT (2026-03-19) — a builder agent rewrote `central-mcp/src/connectors/vin-connector.ts` without authorization. central-mcp had no git repo, so no backup or revert was possible. The watchdog only monitors this project and had no visibility. This rule exists to prevent recurrence.

## Current State
3 open issues. 109 Playwright tests passing (100%). Database: Supabase (migrated from Neon in DB-1). Next: complete REM-8, run T-9 full test.
