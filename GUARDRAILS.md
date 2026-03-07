# GUARDRAILS.md — Rules for Development and Audits

**Source:** Synthesis Phase from restored baseline (commit `58288b6`)
**Date:** 2026-03-07
**Version:** 2.0 — Stabilization Edition

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
2. **T2:** Acceptance criteria (`.agent_docs/acceptance_criteria.md` — 62 ACs)
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

- Begin each session by reading GAPS.md, GUARDRAILS.md, and the current phase in PLAN.md.
- End each session by updating MEMORY.md with what was done.
- Do not carry assumptions from previous sessions — verify current state.

---

## Stabilization Rules (Added 2026-03-07)

## R11: Pre-Task Gate Read

No task may be started without first reading:
1. The task's self-verification criteria in PLAN.md
2. The AC IDs the task addresses (from the traceability table in PLAN.md Section 1)
3. The relevant GAPS.md / RISK_REGISTER.md items

Skipping this step invalidates any work produced.

## R12: Change Traceability

Every code change must reference at least one of:
- A GAPS.md item ID (e.g., GOV-01, SCH-12, API-13)
- A RISK_REGISTER.md item number
- An AC ID from `.agent_docs/acceptance_criteria.md`

Changes without traceability are unauthorized scope expansion.

## R13: Mock Removal Standard

Mock data removal requires ALL of the following:
1. Replacement with a real API call (useQuery or useMutation)
2. Evidence that the API endpoint returns real database data
3. Evidence that the UI renders the real data correctly
4. The mock import is deleted (not just commented out)

Removing a mock import without wiring a real data source is a regression, not a fix.

## R14: Completion Standard

No sprint, phase, or task may be marked complete until:
1. ALL sub-tasks are individually verified against their self-verification criteria
2. AC results for that sprint are documented in the Sprint Report section of PLAN.md
3. User has explicitly approved the sprint results

Marking a phase complete without user approval violates R16 (GATE:STOP).

## R15: Session Start Protocol

Before starting any work in a session, the agent must:
1. Read GAPS.md (current gap state)
2. Read GUARDRAILS.md (all rules including R11-R16)
3. Read the current phase in PLAN.md (assigned tasks)
4. Read the AC traceability table (PLAN.md Section 1) for assigned ACs
5. State which phase/task it is working on

## R16: GATE:STOP Protocol

**This is the most critical rule.** After completing a task:

1. **Self-certify**: Verify all self-verification criteria are met
2. **Document**: Fill in the AC results for the task (pass/fail/partial with evidence)
3. **STOP**: Cease all execution
4. **Present**: Show the user:
   - Which task was completed
   - Which ACs were addressed
   - Pass/fail/partial for each AC with evidence
   - Any new gaps discovered
5. **Wait**: Do not proceed to the next task until the user explicitly approves

Violations of GATE:STOP (e.g., batch-completing multiple tasks, proceeding without approval, skipping the presentation step) invalidate all work produced after the violation point.

---

## Governance File Disposition

The following files are candidates for archival or removal. **No action until user approves during Phase S1 execution.**

### Archive to `archive/` directory:
- `SPEC.md` — critically stale (Wave 0 state)
- `COMMENT_INDEX.md` — stale references
- `acceptance_criteria_audit.md` (root) — superseded by `audits/` folder
- `.agent_docs/rules/operational-context.md` — never updated
- `.agent_docs/codebase-index.md` — empty application section
- `.agent_docs/undefined-items.md` — never used

### Remove (delete):
- `home-metrics.png` (root) — loose screenshot
- `sales-dashboard.png` (root) — loose screenshot
- 9 orphaned mock files in `client/src/mocks/` (see RISK_REGISTER.md §6)

See `RISK_REGISTER.md` Section 6 for the complete nuisance file inventory.
