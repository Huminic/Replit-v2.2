# Nexxus v2.2 — Finish Plan

**Living document.** Updated at phase boundaries and checkpoints.

Referenced standards: `~/Claude-store/sysadmin/governance-framework/file-standards.md`.
Detailed sprints in: `backlog.md`.
Open defects in: `issues.md`.

---

## Version Context

Nexxus v2.2 is being finished from a UI-truth posture. The customer has used the interface and surfaced practical friction: confusing TeamBox navigation, meaningless metrics, unfinished or misleading modules, service-campaign readiness, trigger confidence, and uncertainty about how to fold the product into daily dealership work.

The immediate planning objective is not to redesign the product. It is to verify what the app visibly promises, prove which workflows work end to end, revise the sprints from evidence, and finish the software in controlled chunks.

### Operating Constraints

- The UI is the truth. If a user can see it, it must be verified, fixed, hidden, gated, or explicitly deferred.
- No broad UI redesign is approved.
- Approved UI changes for this planning horizon are limited to:
  - segmenting TeamBox access into relevant Sales/Service/Marketing submenu views, if preflight confirms the data model supports it
  - revising/removing metrics so visible metrics answer useful dealership questions
- New alerts, reports, hunches, competitive intelligence, FTC scanning, switchboard work, and similar ideas are planning candidates only until explicitly promoted.
- All research, audits, and decision points are planned work inside this roadmap, not interruptions outside it.
- VIN Solutions writes remain governed by the vin-safe-mcp prepare/review/execute/verify protocol in `CLAUDE.md`.

### Evidence Inputs

- `evidence/QA-S0/feature-map.md` — DOM/code feature map created from prior crawl.
- `evidence/U-001/state-enumeration.md` — UI state enumeration.
- `evidence/v2.2-inventory-2026-04-24.md` — static-code inventory; useful, but not a substitute for browser/UI validation.
- `evidence/teambox-first-principles-2026-04-24.md` — prior TeamBox UX research; planning input, not automatic approval.
- `docs/strategy/customer-call-strategy-2026-04-24.md` — customer-call strategy report; planning input, not automatic approval.
- `hardwonknowledge.md` and `workflownotes.md` — operational risks and governance lessons.

## Definition Of Done

v2.2 is done when:

- Critical customer-visible workflows pass end-to-end verification.
- Service campaigns can be run, tested, and explained to the partner/customer.
- Visible metrics are useful, supportable from real data, and not misleading.
- TeamBox/service-message access is understandable enough for section users.
- Broken, unfinished, or unpaid modules are fixed, hidden, gated, or explicitly deferred.
- Known critical bugs from preflight are resolved or intentionally deferred with rationale.
- Durran/operator have a practical testing/user guide.
- The final sprint plan and backlog match what was actually approved.

## Phases

### Phase 1 — Preflight And Governance Reset

**Entry criteria:** Current repo available; governance files readable; no app-code edits underway.
**Exit criteria:** UI-truth preflight report complete, current plan/backlog reconciled, and operator has a factual list of must-fix / quick-win / defer / decision items.
**Target dates:** Planning-mode, no deadline assumed.

**Sprints (detailed in backlog.md):**
- Sprint 1.1 — Governance reconciliation
- Sprint 1.2 — UI truth inventory
- Sprint 1.3 — End-to-end workflow validation
- Sprint 1.4 — Metrics audit
- Sprint 1.5 — TeamBox placement and segmentation audit
- Sprint 1.6 — Data and MCP nuance map
- Sprint 1.7 — Bug/issue reconciliation
- Sprint 1.8 — Test and eval plan

### Phase 2 — Critical Workflow Closure

**Entry criteria:** Phase 1 evidence accepted; must-fix workflows identified; no unapproved scope in the sprint list.
**Exit criteria:** Approved critical workflows pass verification with evidence.
**Target dates:** After Phase 1 approval.

**Sprints (detailed in backlog.md):**
- Sprint 2.1 — Trigger and reply reliability
- Sprint 2.2 — Service campaign readiness
- Sprint 2.3 — Widget and public action verification
- Sprint 2.4 — Appointment and admin-notification path
- Sprint 2.5 — TeamBox customer-message workflow
- Sprint 2.6 — Durran testing package and user guide

### Phase 3 — Metrics And Customer Value

**Entry criteria:** Metrics audit accepted; approved replacement/removal list exists.
**Exit criteria:** Visible metrics are useful, supportable, and verified in the UI.
**Target dates:** After Phase 2 or parallel where safe.

**Sprints (detailed in backlog.md):**
- Sprint 3.1 — Remove or gate irrelevant metrics
- Sprint 3.2 — Revise dashboard and department metrics
- Sprint 3.3 — Repair or defer service insights
- Sprint 3.4 — CRM/warehouse question map

### Phase 4 — Focused UX Friction And Quick Wins

**Entry criteria:** Phase 1 preflight identifies approved quick wins; no broad redesign.
**Exit criteria:** Approved friction fixes are shipped and verified.
**Target dates:** After relevant Phase 1 decisions.

**Sprints (detailed in backlog.md):**
- Sprint 4.1 — TeamBox section access
- Sprint 4.2 — Push-to-VIN clarity
- Sprint 4.3 — Module visibility and gating
- Sprint 4.4 — Notification entry-point strategy

### Phase 5 — Hardening, Release, And Closeout

**Entry criteria:** Critical flows and approved quick wins implemented.
**Exit criteria:** Regression suite, manual smoke tests, and closeout artifacts complete.
**Target dates:** Final phase.

**Sprints (detailed in backlog.md):**
- Sprint 5.1 — Regression and Playwright coverage
- Sprint 5.2 — Security/bug hardening
- Sprint 5.3 — Customer-facing handoff
- Sprint 5.4 — v2.2 closeout and v2.3 seed list

## Dependencies

| Dependency | Needed for | Fallback |
|---|---|---|
| Durran CRM export | Warehouse/data opportunity analysis and service-campaign validation | Use existing warehouse data and mark export-dependent items blocked |
| CRM YAML/API capability file | Data capability matrix | Locate from known uploaded docs or document as missing |
| Durran tone/message review | Trigger and campaign message approval | Produce review package; do not send real customer messages until approved |
| PMA competitor list | Competitive intelligence planning | Keep competitive work as discovery only |
| FTC technical document | FTC scanner planning | Keep FTC scanner as discovery only |
| Real external sends | SMS/email/voice validation | Use whitelist/test contacts unless operator gives explicit go |

## Deferrals

Deferred unless explicitly promoted after preflight:

- Broad UI redesign.
- New alert library or hunch system expansion.
- Competitive intelligence build.
- FTC scanner build.
- AI switchboard build.
- Marketing module expansion.
- Full billing/invoicing integration.
- Staff-to-staff messaging.
- Any VIN write path that bypasses vin-safe-mcp.

## Changelog

- 2026-04-24 — Replaced overbuilt prior plan with UI-truth, preflight-first finish plan. Captures approved constraints: UI is truth, no broad UI redesign, TeamBox section access and metric revision are the only currently approved UI change categories.
