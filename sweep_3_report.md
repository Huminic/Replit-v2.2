# Sweep 3 Report — Rebuild Governance

**Date:** 2026-03-08
**Status:** COMPLETE (pending owner approval of proposed documents)

---

## Overview

Five governance documents produced as PROPOSED drafts in the `proposed/` directory. Per the Governance Promotion Workflow (R11), each document requires individual owner approval before it replaces the live version.

---

## Deliverables

### 3A — proposed/replit.md (Session Index)

**Changes from current replit.md:**
- Replaced stale truth hierarchy (5 tiers with .agent_docs AC at #2 and SRS at #3) with canonical 6-tier hierarchy from Sweep 1A
- Replaced "Features Built (Sprints 1-6)" narrative with structured Document Index
- Added all 22+ required file references with purpose, status, and enforcement scope
- Added Terminology section (Waves/Sweeps/Phases)
- Added Canonical Identity Model section
- Added Session Start Checklist
- Removed references to .agent_docs/acceptance_criteria.md as "DO NOT MODIFY" (it's subordinate to root AC)
- Removed Sprint-based feature descriptions (replaced by PLAN.md Phases)
- Removed stale claim "All metric tiles display live API data only" (audit found ~68% mock)
- Corrected table count from 22 to 23
- Corrected route count to 90 (current actual)

### 3B — proposed/PLAN.md (Forward Roadmap)

**Changes from current PLAN.md:**
- Complete rewrite: Waves 0-5 replaced with Phases P0-P8
- P0 references STABILIZATION_PLAN.md for current work
- P1-P5 map to stabilization sweeps 5-9 with AC cross-references and ISSUES.md IDs
- P6-P8 are explicitly deferred post-MVP phases
- Each phase task includes: AC ID, action, verification method
- Sprint Report Template added for consistent reporting
- Verification Gates section with 5 mandatory checks per task
- Removed ~92% completion claim and all Wave-based status assertions

### 3C — proposed/GUARDRAILS.md (Rules + R11 + R12)

**Changes from current GUARDRAILS.md:**
- R4 updated: "Gap Register" → "Issue Register" (ISSUES.md replaces GAPS.md)
- R5 updated: "Single Sprint Scope" → "Single Sweep/Phase Scope"
- R6 updated: 4-tier hierarchy → 6-tier hierarchy matching Sweep 1A declaration
- R8 updated: references Governance Promotion Workflow instead of generic "don't rewrite"
- R9 updated: added "Post-sweep drift checks are mandatory"
- R10 updated: references replit.md, ISSUES.md, and current sweep/phase
- R11 added: Governance Circuit Breaker (full promotion workflow, detection, violation handling)
- R12 added: Observability Discipline (every metric traceable, matrix updates required)

### 3D — proposed/agent-roles.md (Agent Roles & Controls)

**New document. Defines:**
- 4 roles: Architect, Implementer, Tester, Scribe
- File access scope per role (READ/WRITE/NEVER)
- Stop conditions per role
- Approval chain (10 actions requiring owner approval)
- Cross-role handoff procedure
- Single-agent session guidance

### 3E — proposed/CLAUDE.md (Agent Implementation Guide)

**Changes from current CLAUDE.md:**
- Removed "Constitution" references (no such file exists)
- Fixed truth hierarchy to match Sweep 1A (6 tiers, SRS at T6 not two levels)
- Updated file structure to match actual codebase (added auth/, AuthContext, hooks, lib files)
- Corrected storage description: "DatabaseStorage" not "MemStorage"
- Added shared/models/chat.ts with DEPRECATED label
- Corrected table count to 23, route count to 90, page count to 19
- Added pages: login, forgot-password, reset-password, usage
- Added server files: auth.ts, sync.ts, braveSearch.ts, vendorProxy.ts, outbound.ts
- Added External Dependencies table with current status (wired vs stub)
- Removed widget "7 channels" claim — corrected to 4 per Sweep 1B
- Updated forbidden actions: added R11 governance workflow, ISSUES.md evidence, drift checks
- Removed references to "central-mcp" (doesn't exist), "server/services/" (doesn't exist), "server/middleware/" (doesn't exist)
- Added cross-references to ISSUES.md and PLAN.md Phase IDs for stubs/gaps

---

## Drift Check

| Check | Result |
|-------|--------|
| Live governance files untouched? | PASS — all timestamps unchanged |
| No code files modified? | PASS — zero application code changes |
| All proposed files in proposed/ directory? | PASS — 5 files in proposed/ |
| replit.md references all 22 required items? | PASS — all items verified |
| CLAUDE.md file structure matches actual? | PASS — 81 tree entries, verified against ls output |
| GUARDRAILS.md preserves R1-R10? | PASS — all preserved, R4-R6, R8-R10 updated |
| PLAN.md uses Phases terminology? | PASS — P0-P8 |
| agent-roles.md defines all 4 roles? | PASS — Architect, Implementer, Tester, Scribe |

---

## Self-Certification

- [x] 3A: replit.md rebuilt as session index with all 22+ file references
- [x] 3B: PLAN.md rebuilt with Phases (P0-P8), AC cross-references, verification gates
- [x] 3C: GUARDRAILS.md rebuilt with R1-R12, truth hierarchy corrected, promotion workflow added
- [x] 3D: Agent roles defined with file scope, stop conditions, approval chain
- [x] 3E: CLAUDE.md rebuilt with correct file structure, truth hierarchy, counts, and references
- [x] All documents in proposed/ directory with PROPOSED header
- [x] No governance files overwritten
- [x] No code files modified
- [x] Drift check passed

---

## Next Steps

Owner reviews and approves each proposed document individually. Upon approval:
1. Agent replaces live file with proposed version (PROPOSED header removed)
2. Agent updates ISSUES.md to mark GOV-08 (cross-references to non-existent files) as RESOLVED
3. Agent updates ISSUES.md to mark GOV-10 (PLAN.md accuracy) as RESOLVED
