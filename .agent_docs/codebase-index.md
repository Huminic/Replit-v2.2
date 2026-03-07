# .agent_docs/codebase-index.md — Nexxus v2.2
# PURPOSE: Living map of the codebase. Machine-readable by agents. Updated on every commit.
# Format: File path | Purpose | Key dependencies | Wave/Sprint | Last updated
# Last updated: 2026-03-07 (S01 Governance Stabilization)

---

## HOW TO USE THIS FILE

On every commit:
1. Add a row for each NEW file created
2. Update the row for each MODIFIED file (update purpose if it changed)
3. Do not remove rows — use Status = ARCHIVED or DELETED if a file is removed

---

## GOVERNANCE FILES

| File path | Purpose | Key dependencies | Wave/Sprint | Status | Last updated |
|-----------|---------|-----------------|------------|--------|--------------|
| replit.md | Auto-loaded project hub — tech stack, truth hierarchy, file index | — | S01 | ACTIVE | 2026-03-07 |
| PLAN.md | Numbered sprint roadmap (S01-S12) with gap references | GAPS.md | S01 | ACTIVE | 2026-03-07 |
| GAPS.md | Canonical bug/gap tracker — 91 items from audit | acceptance_criteria_audit.md | S01 | ACTIVE | 2026-03-07 |
| GUARDRAILS.md | Anti-drift rules, completion gates, lockdown measures | — | S01 | ACTIVE | 2026-03-07 |
| MEMORY.md | Session log — decisions, changes, standing directives | — | S01 | ACTIVE | 2026-03-07 |
| PRD.md | Product requirements: goals, functions, stakeholders | — | Wave 0 | ACTIVE | 2026-03-04 |
| SRS.md | System behavior requirements: 17 sections, traceable to AC | — | Wave 0 | ACTIVE | 2026-03-04 |
| .agent_docs/acceptance_criteria.md | Given/When/Then AC items — SSOT, DO NOT MODIFY | SRS.md | Wave 0 | ACTIVE | 2026-03-04 |
| .agent_docs/undefined-items.md | Log of undefined behaviors requiring owner resolution | — | Wave 0 | ACTIVE | 2026-03-04 |
| .agent_docs/codebase-index.md | This file — live codebase map | — | S01 | ACTIVE | 2026-03-07 |
| .agent_docs/rules/agent-roles.md | Agent team structure, roles, file scope, compliance log | — | Wave 0 | ACTIVE | 2026-03-04 |
| .agent_docs/rules/code-conventions.md | TypeScript, JSDoc, naming, imports, error handling | — | Wave 0 | ACTIVE | 2026-03-04 |
| .agent_docs/rules/testing-protocol.md | Test structure, spec.ts conventions, quality gates | acceptance_criteria.md | Wave 0 | ACTIVE | 2026-03-04 |
| .agent_docs/rules/file-management.md | File scope rules, commit requirements, archiving | — | Wave 0 | ACTIVE | 2026-03-04 |

## ARCHIVED FILES

| File path | Original path | Purpose | Status | Archived |
|-----------|--------------|---------|--------|----------|
| archive/ACCEPTANCE_CRITERIA_wave1_visual_only.md.archive | ACCEPTANCE_CRITERIA.md | Wave 1 visual-only AC — caused false positive loop | ARCHIVED | 2026-03-07 |
| archive/CLAUDE_v2.2.md.archive | CLAUDE.md | Agent governance for Claude Code (different platform) | ARCHIVED | 2026-03-07 |
| archive/SPEC_v2.2.md.archive | SPEC.md | Architecture spec — content duplicated in SRS/CLAUDE | ARCHIVED | 2026-03-07 |
| archive/Sprint_log.md.archive | Sprint_log.md | Historical sprint records (664 lines) | ARCHIVED | 2026-03-07 |
| archive/COMMENT_INDEX.md.archive | COMMENT_INDEX.md | Manual comment tracker — stale, unmaintained | ARCHIVED | 2026-03-07 |
| archive/operational-context.md.archive | .agent_docs/rules/operational-context.md | Deployment context — stale (PM2, Supabase staging refs) | ARCHIVED | 2026-03-07 |
| archive/acceptance_criteria_audit.md.archive | acceptance_criteria_audit.md | Devil's advocate audit — content migrated to GAPS.md | ARCHIVED | 2026-03-07 |

## REMOVED ENTRIES (never existed on disk)

| Original entry | Reason |
|---------------|--------|
| DO_NOT_TOUCH.md | Listed in index but never created |
| DESIGNER_BRIEF.md | Listed in index but never created |

---

## APPLICATION CODE (populated as waves complete)

| File path | Purpose | Key dependencies | Wave/Sprint | Status | Last updated |
|-----------|---------|-----------------|------------|--------|--------------|
| (To be populated as sprints S02+ are completed) | — | — | — | — | — |
