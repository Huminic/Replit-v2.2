# Harness Drift Analysis — Where We Lost Fidelity
**Date:** 2026-03-27
**Trigger:** Operator asked 3 questions in a row about untested features that should have been obvious gaps

---

## The Core Problem

We had a good source of truth (operator manifest) and a good governance system (ghost gates, pre-commit hooks, evidence trails). But the translation pipeline from manifest → ACs → test sprints leaked coverage at every stage. The governance system verified that work was done correctly — but it didn't verify that the RIGHT work was being done.

**Ghost answers: "Did Dev do what was asked?"**
**Nobody answered: "Was everything that needed asking, asked?"**

---

## Drift Points — Where and Why

### Drift 1: Manifest → Code Audit (E-013 section audits)
**What happened:** We read the manifest, read the code, and documented what the code does. The audits were code-centric, not manifest-centric.
**What was lost:** Manifest items that don't have obvious code implementations got documented as "not found" and moved to backlog instead of being flagged as untested requirements. File upload was an example — the manifest said "file upload works" but the code didn't have it, so we said "BL-075" and moved on instead of asking: wait, should this work?
**Mechanical fix:** **Manifest traceability matrix.** Every manifest line item must map to either an AC (tested), an issue (broken), or a backlog item (deferred) — with explicit operator sign-off on which items are deferred.

### Drift 2: Code Audit → Acceptance Criteria (AC3)
**What happened:** We wrote ACs from what the code audit found, not from what the manifest requires. ACs tested "does this code path work?" not "does this user requirement work?"
**What was lost:** UI elements that exist but weren't in the code audit's scope — notification badges, trigger configuration panels, agent config panes, usage page, org wizard, billing invoice details. These are real pages with real buttons that nobody tested.
**Mechanical fix:** **Pre-AC verification sprint.** Before writing ACs, a verification agent diffs the manifest against the proposed AC list and flags any manifest item with no corresponding AC.

### Drift 3: ACs → Test Sprint Specs
**What happened:** We grouped ACs by page section (S-1 through S-8) then created T-sprints from those groups. The T-sprints inherited the AC gaps.
**What was lost:** Cross-cutting user journeys that span multiple pages. A user who submits a form on the landing page, then opens TeamBox to see it, then replies, then checks if the reply was delivered — that's a journey that crosses S-8, S-2, and the comms pipeline. No single T-sprint tested it end-to-end.
**Mechanical fix:** **User journey test sprints** in addition to section sprints. Map each user story (US-001 through US-030) to a test that follows the complete user path, not just checks individual page features.

### Drift 4: Test Sprint Execution → Coverage Verification
**What happened:** Test agents ran their ACs and reported results. Nobody checked whether the ACs they ran covered the full scope of what needed testing.
**What was lost:** The 3 questions you asked in a row — notification counts, file upload, trigger scenarios — were all features visible in the UI that had zero test coverage. Not because they failed, but because nobody asked about them.
**Mechanical fix:** **Post-wave coverage verification agent.** After each testing wave completes, dispatch a verification agent that reads the manifest, reads the test results, and produces a gap report: "these N manifest items have no test evidence."

### Drift 5: Ghost Gates → Coverage Gates
**What happened:** Ghost verified execution quality (files match, tests run, evidence produced). Ghost did NOT verify coverage quality (did we test everything we should have?).
**What was lost:** Ghost would approve a sprint with 12/12 ACs passing without asking: "but the manifest has 18 items for this section — where are the other 6?"
**Mechanical fix:** **Ghost coverage gate.** Add a B-check to the exit gate: "AC count in post-sprint matches manifest item count for this section. If fewer, list what's missing."

### Drift 6: Comms Scenario Matrix — Too Late
**What happened:** The communication flow matrix was built DURING Wave 4, not before it. We discovered flow gaps while testing instead of mapping them upfront.
**What was lost:** Time. We tested things that couldn't work (SMS to a VAPI voice number), missed things that should have been tested (unsolicited inbound routing), and had to document "PARTIAL" status on flows that should have been fully planned.
**Mechanical fix:** **Comms flow mapping is a pre-requisite for comms testing.** The scenario matrix must be produced and operator-reviewed BEFORE any T-017 style sprint is written.

### Drift 7: No UI Inventory Sprint
**What happened:** E-012 produced a codebase inventory (files, routes, endpoints). E-013 produced section audits (code vs manifest). Neither produced a **clickable UI inventory** — every button, every modal, every toggle, every dropdown.
**What was lost:** Features that exist in the UI but aren't in the manifest (because the manifest was high-level) and aren't in the code audit (because the audit focused on what the manifest mentioned). The notification badge, the org wizard, the usage page billing details, the agent config pane settings — all real UI that nobody inventoried.
**Mechanical fix:** **UI inventory sprint** using Playwright MCP. Navigate every page, click every button, open every modal, document every element. This becomes the ground truth — not the manifest (which is operator recall), not the code audit (which is developer perspective), but the actual rendered application.

---

## Proposed Harness Changes

### New Gate: Pre-Sprint Coverage Verification
**When:** Before every testing wave
**What:** Verification agent reads manifest + proposed ACs + existing test results → produces gap report
**Format:** "Manifest has N items for this scope. ACs cover M. Missing: [list]"
**Who:** Dispatched by Captain, reviewed by operator before wave proceeds

### New Gate: Post-Sprint Manifest Reconciliation
**When:** After every testing wave
**What:** Ghost reads manifest + test results → confirms every manifest item has a status
**Format:** Each manifest line → TESTED / PARTIAL / UNTESTED / NOT BUILT / DEFERRED
**Who:** Ghost produces, operator reviews

### New Sprint Type: UI Inventory (U-series)
**Purpose:** Playwright MCP walks the entire app, clicks every element, documents what exists
**Output:** Clickable element inventory with data-testid coverage, screenshot per page state
**Frequency:** Once before testing, once after remediation

### New Sprint Type: User Journey (J-series)
**Purpose:** Follow a complete user story from start to finish across pages
**Output:** Step-by-step proof that the journey works end-to-end
**Maps to:** US-001 through US-030

### Modified Ghost Exit Gate: B12 — Coverage Check
**What:** Compare AC count in post-sprint to manifest item count for the sprint's scope
**Pass:** All manifest items accounted for (tested, deferred, or N/A with justification)
**Fail:** Manifest items exist with no AC, no test, no deferral

### Modified Pre-Exec: Manifest Traceability Section
**What:** Pre-exec must include a table mapping each manifest item in scope to its AC
**Format:** Manifest item → AC ID (or DEFERRED with operator approval)
**Ghost checks this in A-gate**

---

## What I'd Do Differently (My Input)

If I were designing the restart from scratch, I'd change the order:

**Old order:** Manifest → Code audit → ACs → Test sprints → Remediation → Retest
**Proposed order:**

1. **U-001: UI Inventory** — Playwright clicks everything, produces ground truth of what exists
2. **Manifest reconciliation** — Operator reviews UI inventory against their expectations, marks what's right/wrong/missing
3. **AC writing** — One AC per manifest item, no exceptions, no "we'll get to it"
4. **Coverage verification** — Before testing starts, verify AC count = manifest item count per section
5. **Test sprints** — With full coverage guaranteed
6. **Remediation** — Fix what fails
7. **User journey sprints** — Follow US-001 through US-030 end-to-end
8. **Operator walkthrough** — With a checklist that traces back to the manifest

The key difference: **the UI inventory replaces the code audit as the starting point.** We audit what the user sees, not what the code says. Then the operator confirms what should be there. Then we test against that confirmed list.

This is slower. It's also what you just said: slow and steady, loop back on itself, over and over until it's almost perfect.

---

## Summary of Mechanical Fixes

| # | Fix | Where It Goes | What It Prevents |
|---|---|---|---|
| 1 | Manifest traceability matrix | Pre-exec required section | ACs missing manifest items |
| 2 | Pre-AC verification sprint | Before AC writing | Coverage gaps in ACs |
| 3 | User journey test sprints (J-series) | After section tests | Cross-page flow gaps |
| 4 | Post-wave coverage verification | After each wave | Untested features shipping |
| 5 | Ghost B12 coverage gate | Exit gate addition | Sprints passing with incomplete coverage |
| 6 | UI inventory sprint (U-series) | First sprint before testing | Relying on recall instead of observed reality |
| 7 | Comms flow mapping pre-requisite | Before comms testing | Discovering flows during testing |
| 8 | Pre-exec manifest traceability section | A-gate check | Starting work without tracing to requirements |
