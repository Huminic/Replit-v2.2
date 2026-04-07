# Bug Taxonomy for Production Evals

## Purpose

This taxonomy standardizes how defects are classified during Production Evals so that false passes, UI contradictions, data contradictions, and workflow breaks are recorded consistently.

## Severity

| Severity | Meaning | Release / Sprint Effect | Example |
|---|---|---|---|
| Critical | Breaks a business-critical workflow, destroys trust, or makes a core section unusable | Blocks section acceptance and usually blocks release confidence | Message click opens no content in TeamBox; campaign replies never appear; store switch shows obviously false metrics |
| High | Major defect with serious operator impact or high credibility risk | Blocks flow acceptance and often requires near-term remediation | Drill-down opens but data is wrong or meaningless; filter hides real SMS traffic |
| Medium | Degrades usefulness or creates misleading / incomplete experience | Does not always block release but must be tracked and evaluated for impact | Broken modal action, unclear IDs, missing chart population in non-core view |
| Low | Cosmetic or low-risk issue that does not materially change task completion | Can be deferred if clearly documented | Slight alignment issue, minor flicker without data loss |

## Primary Bug Types

| Type | Definition | Typical Signals |
|---|---|---|
| Functional | The intended action does not complete or produces the wrong action | Click does nothing, wrong screen opens, send action fails |
| Data | The UI displays implausible, wrong, stale, mismatched, or contradictory information | All zeros on active store, counts contradict visible records |
| UX | The interface technically works but is confusing, misleading, or low-quality for operators | Meaningless modal content, hidden next step, truncated labels |
| State | The UI does not refresh, maintain, or reconcile state correctly | Active pane not updating, selected item stale, wrong tab content |
| Permissions | Role/store/org constraints are wrong or inconsistent | User sees wrong data or blocked route incorrectly |
| Async | Loading, streaming, refresh, race, timing, or optimistic update defect | Flicker, partial response, loading never resolves |
| Integration | Provider or downstream system event does not appear correctly in Nexxus | SMS sent but not threaded, transcript missing |
| Regression | Previously accepted behavior re-breaks | Flow worked in prior accepted sprint and now fails |
| Ambiguity | The app behavior is not clearly wrong, but the acceptance target is under-specified or contradictory | unclear criteria, no trustworthy expected state |

## False-Pass Classes

These are especially important because Production Evals exist to catch them.

| False-Pass Class | Meaning | Example |
|---|---|---|
| Assertion-Only Pass | Test assertions passed, but UI outcome is visibly wrong | Button exists and response returns 200, but pane remains blank |
| DOM-Only Pass | DOM inventory proves presence, but operator experience is broken | Filter chip exists but hides all actual messages |
| Provider-Only Pass | External service shows success, but Nexxus UI does not reflect it correctly | Resend or TextMagic shows sent, but TeamBox thread missing |
| Route-Only Pass | Navigation technically occurs, but result is wrong or useless | Clicking SMS routes out of TeamBox instead of filtering TeamBox |
| Data-Render Pass | Numbers render, but the data is implausible or contradictory | Store switch displays zeros despite clear activity evidence |
| Partial Workflow Pass | Early steps succeed but downstream continuity breaks | Campaign sends, but reply never lands in correct thread |

## Required Bug Record Fields

Every bug found in a Production Eval should include:

- Bug ID
- Sprint ID
- Section
- Use Case ID
- Title
- Severity
- Type
- Environment
- Role / Org / Store Context
- Reproduction Steps
- Expected Behavior
- Actual Behavior
- Evidence References
- User / Business Impact
- Suspected Cause (if known)
- False-Pass Class (if applicable)
- Status
- Retest Status

## Status Values

- Open
- Fixed in sprint
- Partially fixed
- Deferred
- Blocked
- Needs operator decision
- Cannot reproduce

## Retest Values

- Not started
- Passed
- Failed
- Partial
- N/A

## Recommended bug title style

`[Section] short concrete failure`

Examples:
- `[TeamBox] clicking conversation leaves third pane blank`
- `[AI Chat] store switch shows zero metrics for active dealership`
- `[Service Campaigns] SMS reply appears in All but not SMS filter`

## Critical escalation rule

Any defect that causes a core section to look trustworthy while behaving untrustworthily should be treated at least as High and often as Critical, even if a test technically passed.
