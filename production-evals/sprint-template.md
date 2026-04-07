# Production Eval Sprint Template (Harness-Native)

This template is aligned to the Nexxus sprints.json schema AND the Ghost/enforcer governance harness.

---

## 1. JSON Registry Entry Template

See `sprint-template.json` for the complete harness-native entry.

Key additions vs original pack:
- `uiPermissions: null` (set to specific elements if remediation touches UI)
- `verdict` field on each executionStep
- `enforcer-checklist.txt` and `cross-sign.md` in declaredFiles
- `workflow-audit.log` in declaredFiles
- Entry gates A6-A9 (ghost messages, watchdog, sprint registration, ghost entry gate)
- Exit gates B7-B10 (enforcer checklist, cross-sign, test rerun, ghost exit gate)

---

## 2. Pre-Execution Report Template

```md
# Pre-Execution Report — PE-{ID}

## Objective

{What this sprint will prove or reject.}

## Scope
- Section: {e.g., AI Chat / Main Dashboard}
- Subsection: {if applicable}
- Related stories: {user story references}
- Included flows: {list}
- Excluded flows: {list with reason}

## Declared Files
- evidence/PE-{ID}/pre-execution-report.md
- evidence/PE-{ID}/section-function-map.md
- evidence/PE-{ID}/use-case-inventory.md
- evidence/PE-{ID}/acceptance-matrix.md
- evidence/PE-{ID}/evidence-index.md
- evidence/PE-{ID}/bug-log.md
- evidence/PE-{ID}/post-sprint-report.md
- evidence/PE-{ID}/enforcer-checklist.txt
- evidence/PE-{ID}/cross-sign.md
- evidence/PE-{ID}/workflow-audit.log
{Add any remediation code files here if authorized}

## Section / Page Function Map
- Route: {e.g., /dashboard, /teambox}
- Tabs / panes: {list}
- Visible controls: {list}
- What the page does: {description}
- What the operator is trying to accomplish: {description}
- What success looks like in UI terms: {description}
- Downstream surfaces that should reflect actions: {list}

## Use Case Inventory
| Use Case ID | Use Case | Type | Risk |
|---|---|---|---|

## Acceptance Matrix
| Use Case ID | Preconditions | Steps | Expected Outcome | Evidence Required | Data Truth Check |
|---|---|---|---|---|---|

## Evidence Plan
- Screenshot plan: {before/after/final for each flow}
- URL / route capture plan: {which routes to capture}
- DOM / state proof plan: {what DOM state to verify}
- Provider / log checks: {which providers, what to verify}
- Refresh / persistence checks: {which flows need refresh verification}

## Bug Handling Plan
- Bug ID prefix: PE-{ID}-BUG-
- Remediation boundary: {authorized / not authorized / operator to decide per bug}
- Retest rule: exact failing flow + adjacent risk flows

## Action Boundary Review
- Safe actions: {list — reads, evidence writes, Playwright observation}
- Gated actions: {list — code changes, if remediation authorized}
- Irreversible actions: {list — SMS sends, API calls, etc. with approval status}
- Explicit approvals: {list of operator-approved irreversible actions, or "none"}
```

---

## 3. Flow Execution Report Template

```md
# Flow Execution Report — {UC-ID}

## Intent
{What function or behavior is under evaluation}

## Preconditions
{State required before execution}

## Execution Summary
1. {step}
2. {step}
3. {step}

## Evidence Collected
- Screenshot(s): {file references with descriptions}
- Route / URL: {captured routes}
- DOM / state proof: {relevant DOM observations}
- Console / network notes: {any anomalies}
- Downstream verification: {if applicable}

## Expected Outcome
{What should have happened}

## Actual Outcome
{What actually happened}

## Data Accuracy Assessment
{Plausibility check, contradiction check, corroboration}

## UX Quality Observations
{Operator experience assessment}

## Commentary
1. What function or behavior was under evaluation? {answer}
2. Why does it matter to the operator or business? {answer}
3. What should have happened? {answer}
4. What actually happened? {answer}
5. What evidence proves that? {answer}
6. Does the data look believable and internally consistent? {answer}
7. Does this satisfy the acceptance criteria? {answer}
8. If not, what is broken and what should happen next? {answer}

## Result
- Status: Accepted | Accepted with risk | Rejected | Blocked | Ambiguous / Unproven
- Acceptance Criterion: {AC ID}

## Bug(s) Found
{Bug IDs or "None"}

## Remediation Performed
{Description or "Not authorized" or "N/A"}

## Retest Outcome
{Results or "N/A"}

## Final Disposition
{Concise summary of flow outcome}
```

---

## 4. Bug Log Template

```md
# Bug Log — PE-{ID}

| Bug ID | Use Case ID | Title | Severity | Type | False-Pass Class | Status | Retest |
|---|---|---|---|---|---|---|---|
```

Individual bug records should include all fields from bug-taxonomy.md:
- Bug ID, Sprint ID, Section, Use Case ID
- Title, Severity, Type, Environment
- Role / Org / Store Context
- Reproduction Steps
- Expected Behavior, Actual Behavior
- Evidence References
- User / Business Impact
- Suspected Cause
- False-Pass Class (if applicable)
- Status, Retest Status

---

## 5. Post-Sprint Report Template

```md
# Post-Sprint Report — PE-{ID}

## AC Results
| AC | Result | Evidence |
|---|---|---|

## Executed Flows
| Use Case ID | Result | Acceptance | Evidence Tier | Notes |
|---|---|---|---|---|

## Bugs Found
| Bug ID | Severity | Type | Status |
|---|---|---|---|

## Remediation Summary
{Description of fixes applied and retests, or "No remediation authorized for this sprint."}

## Evidence Gaps
{List any areas where evidence is incomplete, with reasons}

## Confidence Assessment
- Data Accuracy: {High / Medium / Low — with justification}
- UI Behavior: {High / Medium / Low — with justification}
- Workflow Integrity: {High / Medium / Low — with justification}
- Overall: {High / Medium / Low — with justification}

## Recommendation
- **Verdict:** Go / No-Go / Continue Eval Loop
- **Recommended next sprint:** PE-{NEXT-ID}
- **Conditions for Go:** {if applicable}
- **Blocking issues for next sprint:** {if applicable}
```

---

## 6. Evidence Index Template

```md
# Evidence Index — PE-{ID}

| Use Case ID | Artifact Type | File/Reference | What It Proves | Evidence Tier |
|---|---|---|---|---|
```

---

## 7. Workflow Audit Log

Written automatically during sprint execution:

```
[ISO-8601] SPRINT_START sprint=PE-{ID} status=in_progress
[ISO-8601] ENTRY_GATE sprint=PE-{ID} result=APPROVED
[ISO-8601] FLOW_START sprint=PE-{ID} usecase={UC-ID}
[ISO-8601] FLOW_COMPLETE sprint=PE-{ID} usecase={UC-ID} result={status}
[ISO-8601] BUG_LOGGED sprint=PE-{ID} bug={BUG-ID} severity={severity}
[ISO-8601] REMEDIATION sprint=PE-{ID} bug={BUG-ID} action={description}
[ISO-8601] RETEST sprint=PE-{ID} bug={BUG-ID} result={pass/fail}
[ISO-8601] ENFORCER_CHECKLIST sprint=PE-{ID} result=APPROVED
[ISO-8601] CROSS_SIGN sprint=PE-{ID} implementing={role} reviewing={role} verdict={approved}
[ISO-8601] EXIT_GATE sprint=PE-{ID} result=CLEARED
[ISO-8601] COMMIT sprint=PE-{ID} role={role} hash={commit-hash}
```
