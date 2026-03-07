# GUARDRAILS.md — Rules for Development and Audits

**Source:** Fresh re-audit from restored baseline (commit `58288b6`)
**Date:** 2026-03-07

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

## R4: Gap Register Integrity

- All items in GAPS.md are OPEN by default.
- No item may be marked RESOLVED without:
  1. Evidence that the fix uses real data (not mock/hardcoded)
  2. Functional verification (not just "code exists")
  3. Explicit user approval or user-approved verification process
- RESOLVED labels applied speculatively must be reverted.

## R5: Single Sprint Scope

- Work only on the items listed in the current sprint.
- Do not expand scope to adjacent sprints.
- Do not mark sprints complete unless all items are individually verified.
- Do not add work items to a sprint without user approval.

## R6: Truth Hierarchy

When documents conflict, resolve using this order:
1. **T1:** UI code (approved design) — change the data source, not the UI
2. **T2:** Acceptance criteria (.agent_docs/acceptance_criteria.md)
3. **T3:** SRS.md
4. **T4:** PLAN.md sequencing

## R7: No Silent Remediation During Audit

- Audits observe and report. They do not fix.
- If an audit discovers a gap, it goes in GAPS.md as OPEN.
- The fix is planned in a subsequent sprint and executed after approval.

## R8: Forbidden Terms and Patterns

- Do not use the term "MVP" to justify incomplete features.
- Do not use "appears to work" as evidence of completion.
- Do not archive governance documents without explicit user approval.
- Do not rewrite governance documents (PLAN.md, replit.md) without explicit user approval.

## R9: Anti-Drift Rules

- Do not mark waves/sprints complete because prior work "seems to cover it."
- Do not collapse multiple sprints into a single verification pass.
- Each sprint's completion requires individual item-by-item verification.
- Status changes require evidence, not interpretation.

## R10: Session Hygiene

- Begin each session by reading GAPS.md and the current sprint in PLAN.md.
- End each session by updating MEMORY.md with what was done.
- Do not carry assumptions from previous sessions — verify current state.
