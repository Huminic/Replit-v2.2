# PROPOSED — replit.md (Sweep 3A Draft)

> **Status: PROPOSED** — This document requires explicit owner approval before replacing the live replit.md. Do not promote automatically.

---

# Nexxus Connect v2.2 — Session Index

## Overview

Nexxus Connect is an AI-powered dealership CRM/communication platform for Serra Auto Group / Cage Automotive. It uses persona-driven AI agents to manage sales, service, and marketing communications with a unified inbox (TeamBox), outbound campaign engine, and embeddable customer widget.

**Golden Rule:** UI = T1 truth — change the data source, not the UI.

## User Preferences

Preferred communication style: Simple, everyday language.

## Terminology

| Term | Meaning |
|------|---------|
| **Waves** | Old PLAN.md development eras (Waves 0-5). Historical reference only. |
| **Sweeps** | STABILIZATION_PLAN.md steps (Sweeps 0-10+). Current stabilization work. |
| **Phases** | New PLAN.md milestones (P0-P10+). Forward development roadmap. |

## Truth Hierarchy (Sweep 1A)

| Tier | Source | Authority |
|------|--------|-----------|
| T1 | Runtime UI code | Highest — all visual behavior, layout, interactions |
| T2 | ACCEPTANCE_CRITERIA.md (root) | Verifiable behaviors documented from UI |
| T3 | GUARDRAILS.md | Agent rules and constraints |
| T4 | PLAN.md / STABILIZATION_PLAN.md | Sequencing and roadmap |
| T5 | PRD.md, audits/, .agent_docs/ | Reference material |
| T6 | Quarantined documents | No authority — historical reference only |

## Canonical Identity Model

- **Org-centered tenancy**: Every data entity belongs to an organization
- **org_id** is the universal scope filter on all queries
- **Main app chat** is canonical (shared/schema.ts with UUID PKs, org-scoped, JWT+RBAC)
- **8 RBAC roles**: super_admin → partner_admin → org_admin → executive → sales_manager → sales → service → marketing

## Document Index

### Governance Documents (Promotion Workflow Required)

| File | Purpose | Status |
|------|---------|--------|
| `PLAN.md` | Forward roadmap with Phases | Governance — requires promotion workflow to modify |
| `GUARDRAILS.md` | Agent rules (R1-R11) and constraints | Governance — requires promotion workflow to modify |
| `CLAUDE.md` | Agent context, project structure, forbidden actions | Governance — requires promotion workflow to modify |
| `ACCEPTANCE_CRITERIA.md` | Canonical requirements (T2 authority) | Governance — requires promotion workflow to modify |
| `proposed/agent-roles.md` | Agent role definitions and file scope | Governance — requires promotion workflow to modify |

### Stabilization Documents

| File | Purpose | Status |
|------|---------|--------|
| `STABILIZATION_PLAN.md` | Stabilization roadmap (Sweeps 0-10+) | Live — current execution guide |
| `sweep_0_report.md` | Sweep 0 deliverables (quarantine, freeze) | Sweep output — frozen |
| `sweep_1_report.md` | Sweep 1 deliverables (truth hierarchy, AC reconciliation, chat decision) | Sweep output — frozen |
| `sweep_2_report.md` | Sweep 2 deliverables (Continuity Matrix, Observability Matrix) | Sweep output — frozen |
| `sweep_2_5_blueprint.md` | Stabilization Blueprint (RC-blocking classification, remediation strategy) | Sweep output — frozen |

### Living Documents (Updated During Work)

| File | Purpose | Status |
|------|---------|--------|
| `ISSUES.md` | Living issue tracker — gaps, bugs, problems. Replaces GAPS.md. | Living — updated as issues are discovered |
| `MEMORY.md` | Chronological session log | Living — updated each session |

### Contract Files (Code)

| File | Purpose |
|------|---------|
| `shared/schema.ts` | Canonical data model — 23 tables, Drizzle ORM, UUID PKs |
| `server/storage.ts` | Storage interface (IStorage) + DatabaseStorage implementation |
| `server/routes.ts` | 90 API routes — all authenticated except public widget/landing/webhooks |

### Reference Documents (Read-Only)

| File | Purpose | Notes |
|------|---------|-------|
| `PRD.md` | Product requirements | Reference — not authoritative for implementation |
| `GAPS.md` | Original gap register (81 items) | RETIRED — migrated to ISSUES.md |
| `audits/` | 13 audit artifacts from rollback & re-audit | Frozen reference — findings of record |
| `testing/` | 12 test battery files (owner-uploaded) | Reference — adapted in Sweep 4 |
| `.agent_docs/acceptance_criteria.md` | Derived verification/test layer | Subordinate to root ACCEPTANCE_CRITERIA.md |
| `.agent_docs/rules/code-conventions.md` | TypeScript/naming conventions | Reference — potentially reusable |

### Quarantined Documents (T6 — No Authority)

| File | Reason |
|------|--------|
| `SPEC.md` | Describes single-table database; says "no active API routes" |
| `SRS.md` | Agent data stale; generic names vs actual personas |
| `Sprint_log.md` | Criteria mismatch; false E2E claims |
| `COMMENT_INDEX.md` | References pre-wiring states |
| `.agent_docs/rules/operational-context.md` | Never updated; all items PENDING |
| `.agent_docs/codebase-index.md` | Application code section empty |
| `.agent_docs/undefined-items.md` | No entries logged |
| `.agent_docs/rules/agent-roles.md` | Superseded by proposed/agent-roles.md |
| `.agent_docs/rules/file-management.md` | Stale file scope rules |
| `.agent_docs/rules/testing-protocol.md` | References non-existent spec.ts |

## System Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, wouter, TanStack Query v5 |
| Backend | Express.js, TypeScript, JWT auth, bcrypt |
| Database | PostgreSQL, Drizzle ORM (23 tables), drizzle-zod validation |
| AI | Anthropic Claude (claude-sonnet-4-6) via SDK |
| Communications | TextMagic (SMS), Resend (email), VAPI (voice — stub), Tavus (video — stub) |
| Data | VinSolutions (lead sync), Brave Search (web search for AI) |

### Key Counts

| Item | Count |
|------|-------|
| Database tables | 23 (shared/schema.ts) |
| API routes | 90 (server/routes.ts) |
| Frontend pages | 19 (client/src/pages/) |
| RBAC roles | 8 |
| ISSUES.md items | 101 (80 OPEN, 21 RESOLVED) |
| RC-blocking issues | 19 unique |

## Session Start Checklist

1. Read this file (replit.md) for orientation
2. Read ISSUES.md for current gap state
3. Read STABILIZATION_PLAN.md or PLAN.md for current work
4. Read MEMORY.md for recent session history
5. Verify current sweep/phase before starting work
6. End session by updating MEMORY.md
