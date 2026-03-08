# PROPOSED — GUARDRAILS.md (Sweep 3C Draft)

> **Status: PROPOSED** — This document requires explicit owner approval before replacing the live GUARDRAILS.md. Do not promote automatically.

---

# GUARDRAILS.md — Rules for Development and Audits

**Source:** Stabilization Sweep 3C (rebuilt from audit baseline + Sweep 1-2 findings)
**Supersedes:** GUARDRAILS.md from 2026-03-07

---

## R1: No False Positive Acceptance Criteria

An acceptance criterion MUST NOT be marked PASSED or COMPLETE if the feature relies on:
- Hardcoded or static data arrays
- Mock imports from client/src/mocks/
- Demo mode toasts instead of real API calls
- Placeholder implementations that return static responses

The feature must use real data from the database via API calls.

## R2: Planning and Execution Separation

- A plan may never be executed in the same response in which it is created.
- Audit sessions are read-only until an explicit execution phase is approved.
- No status may be changed during a planning or audit phase.
- No schema, code, or governance document may be modified during a planning or audit phase.

## R3: Explicit Mode Protocol

Every session must operate in explicit modes:
- **MODE: PLANNING** — read-only analysis and plan creation
- **MODE: EXECUTION** — perform only the approved steps
- **MODE: REPORT** — summarize what was done and stop

Mode transitions require user approval.

## R4: Issue Register Integrity

- All items in ISSUES.md are OPEN by default.
- No item may be marked RESOLVED without:
  1. Evidence that the fix uses real data (not mock/hardcoded)
  2. Functional verification (not just "code exists")
  3. Explicit user approval or user-approved verification process
- RESOLVED labels applied speculatively must be reverted.
- Items resolved via quarantine or decision records must cite the specific sweep report.

## R5: Single Sweep/Phase Scope

- Work only on the items listed in the current sweep or phase.
- Do not expand scope to adjacent sweeps/phases.
- Do not mark sweeps/phases complete unless all items are individually verified.
- Do not add work items without user approval.

## R6: Truth Hierarchy

When documents conflict, resolve using this priority order (highest wins):

| Tier | Source | Authority |
|------|--------|-----------|
| T1 | Runtime UI code | All visual behavior, layout, interactions |
| T2 | ACCEPTANCE_CRITERIA.md (root) | Verifiable behaviors documented from UI |
| T3 | GUARDRAILS.md | Agent rules and constraints |
| T4 | PLAN.md / STABILIZATION_PLAN.md | Sequencing and roadmap |
| T5 | PRD.md, audits/, .agent_docs/ | Reference material |
| T6 | Quarantined documents | No authority — historical reference only |

## R7: No Silent Remediation During Audit

- Audits observe and report. They do not fix.
- If an audit discovers a gap, it goes in ISSUES.md as OPEN.
- The fix is planned in a subsequent sweep/phase and executed after approval.

## R8: Forbidden Terms and Patterns

- Do not use the term "MVP" to justify incomplete features.
- Do not use "appears to work" as evidence of completion.
- Do not archive governance documents without explicit user approval.
- Do not rewrite governance documents without the Governance Promotion Workflow (R11).

## R9: Anti-Drift Rules

- Do not mark sweeps/phases complete because prior work "seems to cover it."
- Do not collapse multiple sweeps into a single verification pass.
- Each sweep's completion requires individual item-by-item verification.
- Status changes require evidence, not interpretation.
- Post-sweep drift checks are mandatory (codified in Sweep 1).

## R10: Session Hygiene

- Begin each session by reading replit.md for orientation, then ISSUES.md and the current sweep/phase.
- End each session by updating MEMORY.md with what was done.
- Do not carry assumptions from previous sessions — verify current state.

## R11: Governance Circuit Breaker

### Governance Documents

The following files are governance documents subject to this rule:
- PLAN.md
- GUARDRAILS.md
- replit.md
- ACCEPTANCE_CRITERIA.md
- proposed/agent-roles.md (or its promoted location)
- Any file explicitly marked as governance in replit.md

### Governance Promotion Workflow

Every governance document change follows this lifecycle:
1. **Draft** — created and clearly labeled PROPOSED
2. **Review** — presented to owner for review
3. **Approval** — explicitly approved by owner
4. **Promotion** — PROPOSED header removed, file replaces live version

### Restrictions

- Agents must never overwrite a governance document directly
- Agents must never promote a proposed document automatically
- Agents must never mark governance changes as complete without approval
- Silent promotion is forbidden

### Detection Behavior

If an agent detects that a task would modify a governance document outside the promotion workflow, it must:
1. Stop execution immediately
2. Report the attempted change
3. Request explicit approval before continuing

### Violation Handling

If a governance document appears to have been modified without the promotion workflow, the agent must treat the file as potentially contaminated, halt the session, and request instructions.

## R12: Observability Discipline

- Every displayed metric, data table, or interactive element must be traceable to its data source through the Observability Matrix (sweep_2_report.md).
- When a "mock" or "static" data source is replaced with a "real" source, the Observability Matrix must be updated and a verification test must be added or updated.
- No new UI element may be added without a corresponding Observability Matrix entry.
- The Continuity Matrix must have a complete row for every RC-required UI surface.
