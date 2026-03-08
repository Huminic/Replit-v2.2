# PROPOSED — Agent Roles & Controls (Sweep 3D Draft)

> **Status: PROPOSED** — This document requires explicit owner approval before becoming live. Do not promote automatically.

---

# Agent Roles & Controls

**Purpose:** Define the scope, file access, and approval requirements for each agent role.

---

## Roles

### Architect

**Scope:** System design, schema decisions, governance document drafting, dependency analysis.

**File access:**
- READ: All files
- WRITE: `proposed/` directory only (governance drafts)
- WRITE: `ISSUES.md`, `MEMORY.md` (living documents)
- WRITE: Sweep report files (`sweep_*_report.md`, `sweep_*_blueprint.md`)

**Stop conditions:**
- Must stop before modifying any governance document outside `proposed/`
- Must stop before making schema changes and present the change for approval
- Must stop after producing a plan/blueprint and request review

### Implementer

**Scope:** Code changes — schema, routes, storage, frontend pages, components.

**File access:**
- READ: All files
- WRITE: `shared/schema.ts`, `server/*.ts` (except `vite.ts`), `client/src/**/*.tsx`, `client/src/**/*.ts`
- WRITE: `ISSUES.md`, `MEMORY.md` (living documents)
- NEVER: `server/vite.ts`, `vite.config.ts`, `drizzle.config.ts`, `package.json`, `client/src/components/ui/**`
- NEVER: Governance documents (PLAN.md, GUARDRAILS.md, CLAUDE.md, replit.md, ACCEPTANCE_CRITERIA.md)

**Stop conditions:**
- Must stop after completing a sweep task and self-certify
- Must stop if a change would affect more than the scoped sweep/phase
- Must stop before deleting any file and request approval
- Must stop before modifying database migration files in production

### Tester

**Scope:** Test creation, test execution, verification, observability matrix validation.

**File access:**
- READ: All files
- WRITE: `testing/**`, test files (`*.test.ts`, `*.test.tsx`, `*.spec.ts`)
- WRITE: `ISSUES.md` (to log newly discovered bugs)
- WRITE: `MEMORY.md`

**Stop conditions:**
- Must stop and report when tests reveal a previously unknown issue
- Must stop before modifying application code (tests only)
- Must stop after test battery completion and present results

### Scribe

**Scope:** Documentation updates, session logging, sweep report generation.

**File access:**
- READ: All files
- WRITE: `MEMORY.md`, `ISSUES.md`
- WRITE: `sweep_*_report.md`, `sweep_*_blueprint.md`
- WRITE: `proposed/` directory (governance drafts only)

**Stop conditions:**
- Must stop before modifying any non-documentation file
- Must stop before changing ISSUES.md status from OPEN to RESOLVED (requires evidence)

---

## Approval Chain

| Action | Requires Approval From |
|--------|----------------------|
| Promote governance document | Owner |
| Mark ISSUES.md item RESOLVED | Owner (or owner-approved verification process) |
| Schema migration | Owner |
| Delete any file | Owner |
| Add new dependency | Owner |
| Modify package.json | Owner |
| Change sweep/phase scope | Owner |

---

## Cross-Role Handoff

When a task requires multiple roles:

1. The initiating role completes its portion and produces a handoff summary
2. The handoff summary includes: what was done, what files were changed, what the next role needs to do
3. The receiving role verifies the handoff before starting work
4. Both roles update MEMORY.md

---

## Single-Agent Sessions

When a single agent performs multiple roles (common in practice):

- The agent must still respect the file access restrictions of each role
- When switching roles within a session, the agent must note the role transition in its work
- Governance document restrictions (R11) apply regardless of which role the agent is performing
- Post-sweep drift checks apply to all roles
