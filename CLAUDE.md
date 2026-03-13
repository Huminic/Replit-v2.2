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
