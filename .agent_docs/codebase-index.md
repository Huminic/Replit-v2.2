> **QUARANTINED — not authoritative. Retained for reference only until governance rebuild is complete.**
> Quarantined during Sweep 0 (Stabilization Plan). Reason: APPLICATION CODE section was never populated — only lists governance docs from Wave 0. Does not reflect the actual codebase (200+ source files across client/src/, server/, shared/).

# .agent_docs/codebase-index.md — Nexxus v2.2
# PURPOSE: Living map of the codebase. Machine-readable by agents. Updated by Scribe on every commit.
# Format: File path | Purpose | Key dependencies | Wave/Sprint | Last updated
# Scribe must add an entry for EVERY new file in the same commit.
# Last updated: 2026-03-04 (initialized — Wave 0)

---

## HOW TO USE THIS FILE

Scribe agent maintains this file. On every commit:
1. Add a row for each NEW file created
2. Update the row for each MODIFIED file (update purpose if it changed)
3. Do not remove rows — use Status = DELETED if a file is removed

---

## INDEX

| File path | Purpose | Key dependencies | Wave/Sprint | Status | Last updated |
|-----------|---------|-----------------|------------|--------|--------------|
| CLAUDE.md | Agent governance rules, truth hierarchy, prohibited actions | — | Wave 0 | ACTIVE | 2026-03-04 |
| DO_NOT_TOUCH.md | Off-limits file and directory list | CLAUDE.md | Wave 0 | ACTIVE | 2026-03-04 |
| PLAN.md | Wave execution plan, pre-flight checklist, P0 tracker | — | Wave 0 | ACTIVE | 2026-03-04 |
| SPEC.md | Architecture facts: stack, MCP tools, kill switch schema, RBAC | — | Wave 0 | ACTIVE | 2026-03-04 |
| PRD.md | Product requirements: goals, MVP functions, stakeholders | — | Wave 0 | ACTIVE | 2026-03-04 |
| SRS.md | System behavior requirements: 17 sections, traceable to AC | SPEC.md | Wave 0 | ACTIVE | 2026-03-04 |
| DESIGNER_BRIEF.md | UI handoff: navigation, patterns, components, deliverables | — | Wave 0 | ACTIVE | 2026-03-04 |
| MEMORY.md | Session memory — Scribe only | — | Wave 0 | PENDING CREATION | — |
| .agent_docs/acceptance_criteria.md | Given/When/Then AC items — maps 1:1 to spec.ts tests | SRS.md | Wave 0 | ACTIVE | 2026-03-04 |
| .agent_docs/undefined-items.md | Log of undefined behaviors requiring owner resolution | CLAUDE.md | Wave 0 | ACTIVE | 2026-03-04 |
| .agent_docs/codebase-index.md | This file — live codebase map | — | Wave 0 | ACTIVE | 2026-03-04 |
| .agent_docs/rules/agent-roles.md | Agent team structure, roles, file scope, compliance log | CLAUDE.md | Wave 0 | ACTIVE | 2026-03-04 |
| .agent_docs/rules/code-conventions.md | TypeScript, JSDoc, naming, imports, error handling | SPEC.md | Wave 0 | ACTIVE | 2026-03-04 |
| .agent_docs/rules/testing-protocol.md | Test structure, spec.ts conventions, quality gates | acceptance_criteria.md | Wave 0 | ACTIVE | 2026-03-04 |
| .agent_docs/rules/file-management.md | File scope rules, commit requirements, archiving | CLAUDE.md | Wave 0 | ACTIVE | 2026-03-04 |
| .agent_docs/rules/operational-context.md | Live deployment context, mockup URLs, environment status | SPEC.md | Wave 0 | ACTIVE | 2026-03-04 |

---

## APPLICATION CODE (populated as waves complete)

| File path | Purpose | Key dependencies | Wave/Sprint | Status | Last updated |
|-----------|---------|-----------------|------------|--------|--------------|
| (Wave 1 files will be indexed here) | — | — | — | — | — |
