# Nexxus Connect v2.2 (Replit Migration)

## Project Context
CRM/AI platform migrating from Replit to Oracle Cloud (Coolify container).
Stack: Express 5 + React 18 + Vite 7 + Drizzle ORM + TypeScript 5.6 + PostgreSQL (Neon)

## Governance
- **Pre-commit hook**: 7-gate enforcement (COMMIT_ROLE + COMMIT_SPRINT required)
- **Enforcer agent**: Port 8004, POST /api/verify
- **Scripts**: scripts/enforcer-checklist.sh, pre-commit.sh, check-file-scope.sh
- **Evidence**: evidence/{sprint-id}/ with pre-execution, post-sprint, cross-sign, checklist
- **Amendment**: No exceptions. Stop-discuss-revise for governance gaps.
- **User story gate (PRE-08)**: Before any L2+ testing (authenticated, visual, usability), user-defined expected behavior MUST be documented for every component under test. Agents cannot invent acceptance criteria for user-facing behavior. BLOCKED until user confirms.
- **Acceptance criteria gate (PRE-09)**: Every issue in a FIX/Issue sprint MUST have Background (what's wrong), Outcome (what it looks like when fixed), and Acceptance Criteria (how to verify mechanically) defined BEFORE work begins. Builder agents receive the AC in their prompt. QA agents test against the AC. Issues without AC cannot be worked on.
- **Issues file**: issues.md is the single source of truth for all open issues. All findings from QA, L5 walkthrough, comms tests, and usability tests go here. No filtering or categorizing without user approval.
- **Role separation**: The orchestrator plans, delegates, compares results, and commits. The orchestrator does NOT write application code. Code changes are delegated to builder agents.

## Commit Protocol
```bash
COMMIT_ROLE=<role> COMMIT_SPRINT=<sprint-id> git commit -m "message"
```
Valid roles: frontend, backend, test, integration, scribe, enforcer, architect, orchestrator

## Key Files
- server/routes.ts — 6200 lines, decomposition target (P4)
- server/index.ts — Bootstrap + inline schedulers (extraction target P3)
- shared/schema.ts — Drizzle schema, self-referencing FK uses AnyPgColumn
- sprints.json — Sprint registry (status vocabulary: planned/in_progress/committed)

## TypeScript Fixes Log
All fixes tracked in evidence/typescript-fixes.md for Replit merge reconciliation.

## Infrastructure
- Enforcer: PM2 nexxus-enforcer, port 8004
- Sysadmin authority: /home/ubuntu/Claude-store/sysadmin/
