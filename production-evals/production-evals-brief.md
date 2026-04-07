# Production Evals — Why Nexxus Needs This Model

## Problem statement

Nexxus already has significant automation, DOM crawl artifacts, screenshot inventory, user stories, governance files, and passing Playwright-driven coverage claims. Yet obvious operator-visible defects were still found quickly in real use.

That means the current process is better at proving that assertions can pass than proving that the product behaves correctly, that the UI is usable, or that the data is trustworthy.

## The shift

The new model is called **Production Evals**.

A Production Eval is a gated evaluation sprint for one section or subsection of the application. It does not ask only whether something technically works. It asks whether the interface behaves correctly, whether the data is believable, whether the workflow holds together across screens and systems, and whether the result can be defended with evidence and commentary.

## Core principle

**Playwright is the witness, not the judge.**

Playwright executes, observes, screenshots, traces, and proves state transitions. Acceptance comes from:
- expected outcome defined in interface terms,
- actual behavior independently observed,
- data plausibility checked,
- evidence attached,
- commentary interpreting the evidence,
- remediation and retest when bugs are found.

## What changes

### Old mentality
- broad pass counts
- generic user stories
- assertion-heavy proof
- page existence mistaken for workflow quality
- backend/provider success mistaken for operator-visible truth

### New mentality
- one sprint per section or subsection
- one workflow at a time
- page-bound use cases
- evidence + commentary per flow
- data accuracy as a first-class eval dimension
- cross-screen continuity as a first-class eval dimension
- bug/remediation/retest loop as standard

## The five eval dimensions

1. **Data Accuracy**
2. **UI Behavior**
3. **Cross-Screen / Cross-System Workflow Integrity**
4. **Operator Usability**
5. **Error Handling and Recovery**

## Definition of done

A section is not done because tests passed.
A section is done only when:
- the page purpose is clearly stated,
- the functions and use cases are tied to the interface,
- the outcomes are defined clearly,
- the flows are executed one at a time,
- evidence exists,
- commentary exists,
- defects are logged,
- fixes are retested when authorized,
- the sprint exit review is defensible.
