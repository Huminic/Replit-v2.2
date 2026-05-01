# Nexxus v2.2 — Backlog

Per standards at `~/Claude-store/sysadmin/governance-framework/file-standards.md`:

- Plain markdown. One item per entry. Four fields: Objective, Scope, Done looks like, Constraints.
- No IDs, statuses, dependsOn, filesModified, UI permissions, execution steps.
- Captain organizes. Grouping by tier, theme, or urgency is captain's call.
- Items leave the backlog when they ship (move to session-output.md) or when operator removes them.

---

## Phase 1 — Preflight And Governance Reset

### Sprint 1.1 — Governance Reconciliation

- **Objective:** Reconcile governance files so planning starts from approved constraints, not stale or overbuilt scope.
- **Scope:** `CLAUDE.md`, `hardwonknowledge.md`, `workflownotes.md`, `decisions.md`, `plan.md`, `backlog.md`, `issues.md`, current strategy docs, and relevant evidence files.
- **Done looks like:** A short governance reconciliation note identifies authoritative files, stale files, contradictions, approved constraints, and planning inputs that are not approved scope.
- **Constraints:** No application-code edits. Do not treat prior `plan.md` or `backlog.md` content as approved just because it exists.

### Sprint 1.2 — UI Truth Inventory

- **Objective:** Use the visible UI as the source of truth and classify every visible promise as working, broken, misleading, unfinished, gated, or deferred.
- **Scope:** Authenticated app pages, public widget/landing routes, role-visible navigation, submenus, module tiles, primary buttons, empty states, and visible metrics.
- **Done looks like:** `evidence/preflight-ui-truth-YYYY-MM-DD.md` lists each screen, visible promises, primary actions, broken or misleading UI, and fix/hide/gate/defer recommendation.
- **Constraints:** Read-only. Use Playwright/browser evidence where possible. No UI redesign recommendations beyond classification unless tied to approved TeamBox segmentation or metrics revision.

### Sprint 1.3 — End-To-End Workflow Validation

- **Objective:** Verify the customer-critical workflows from the UI through backend evidence.
- **Scope:** Triggers and replies, service campaigns, TeamBox conversation handling, push-to-VIN path, widget actions, appointment/admin notification flow, main chat, agent chat, and reports.
- **Done looks like:** `evidence/preflight-e2e-workflows-YYYY-MM-DD.md` records expected path, actual path, pass/fail, screenshots/log evidence, broken step, and acceptance test for each workflow.
- **Constraints:** No real external sends without explicit operator approval. Use test/whitelist paths for SMS/email/voice.

### Sprint 1.4 — Metrics Audit

- **Objective:** Identify which visible metrics help dealership users make decisions and which should be revised, removed, hidden, or gated.
- **Scope:** Main dashboard, Sales, Service, Marketing, Management, Insights, weekly reports, and any metric tiles/dialogs visible in the UI.
- **Done looks like:** `evidence/preflight-metrics-audit-YYYY-MM-DD.md` maps each metric to location, business question, data source, current calculation, usefulness verdict, and recommended action.
- **Constraints:** Do not invent unsupported metrics. A metric stays prominent only if it answers a real dealership question from supportable data.

### Sprint 1.5 — TeamBox Placement And Segmentation Audit

- **Objective:** Determine the safest way to expose relevant TeamBox messages inside Sales, Service, and Marketing sections without broad redesign.
- **Scope:** TeamBox, Sales, Service, Marketing, current conversation data model, filters, customer info panel, push-to-VIN action, submenus, and existing TeamBox evidence.
- **Done looks like:** `evidence/preflight-teambox-placement-YYYY-MM-DD.md` recommends unified-only, section-filtered, or hybrid access; lists data requirements and exact UI surfaces affected.
- **Constraints:** Planning only. TeamBox remains the system of record unless operator decides otherwise. No schema change is approved by this audit alone.

### Sprint 1.6 — Data And MCP Nuance Map

- **Objective:** Document integration boundaries, MCP proxy behavior, and data-source nuances that must govern finishing work.
- **Scope:** `server/vendorProxy.ts`, VIN-safe MCP rules from `CLAUDE.md`, `server/sync.ts`, webhook routes, trigger/outbound services, CRM YAML/API file location, warehouse tables, and imported CRM data paths.
- **Done looks like:** `docs/strategy/v2.2-codebase-nuance-map.md` explains safe/unsafe integration actions, data freshness, known hardcoded behavior, and do-not-touch boundaries.
- **Constraints:** Read-only. Do not call write-capable external tools. Do not modify central MCP or vin-safe-mcp code.

### Sprint 1.7 — Bug And Issue Reconciliation

- **Objective:** Reconcile UI/workflow findings with `issues.md`, existing evidence, and customer-call strategy into a finish list.
- **Scope:** Preflight findings, `issues.md`, `docs/strategy/customer-call-strategy-2026-04-24.md`, existing plan/backlog history, and relevant test failures.
- **Done looks like:** A planning summary groups items into must-fix, should-fix, quick-win, hide/gate/defer, blocked, and operator-decision buckets.
- **Constraints:** Findings do not become execution scope until promoted into the plan by operator decision.

### Sprint 1.8 — Test And Eval Plan

- **Objective:** Define the tests and manual evals required to prove v2.2 is finished.
- **Scope:** TypeScript check, targeted Playwright specs, service campaign E2E, widget E2E, TeamBox filtered access, metrics calculations, trigger/reply tests, and Durran/operator manual smoke checklist.
- **Done looks like:** `docs/strategy/v2.2-test-eval-plan.md` lists automated tests, manual checks, data setup, acceptance evidence, and gaps.
- **Constraints:** Planning only. Do not run real external sends while drafting the plan.

## Phase 2 — Critical Workflow Closure

### Sprint 2.1 — Trigger And Reply Reliability

- **Objective:** Make outbound triggers and replies trustworthy from send timing through conversation capture.
- **Scope:** Trigger scheduler, legal send windows, test whitelist behavior, SMS reply webhook, conversation creation, audit logs, and admin visibility.
- **Done looks like:** Approved trigger scenarios pass in test/whitelist mode and Durran can verify replies using the testing guide.
- **Constraints:** No real-customer sends without explicit operator approval.

### Sprint 2.2 — Service Campaign Readiness

- **Objective:** Make service campaigns ready to run, test, and explain to the partner/customer.
- **Scope:** Service campaign creation, CSV/template path, recipient handling, send execution, reply routing, campaign status, and TeamBox/service handoff.
- **Done looks like:** A controlled service campaign can be walked end to end with evidence and known limitations documented.
- **Constraints:** Controlled test audience unless operator approves a live send.

### Sprint 2.3 — Widget And Public Action Verification

- **Objective:** Verify the customer-facing widget actions end to end.
- **Scope:** Public widget landing routes, chat, callback, form, video, voice where enabled, CORS/embed behavior, and dealer-specific configuration.
- **Done looks like:** Each widget action has browser evidence and backend evidence showing pass/fail and required fixes.
- **Constraints:** Do not change widget UI beyond bug fixes unless operator approves.

### Sprint 2.4 — Appointment And Admin Notification Path

- **Objective:** Ensure appointment intent creates the right in-platform record and notifies the right people.
- **Scope:** Appointment intent detection, appointment storage, calendar display, admin notification email, and audit evidence.
- **Done looks like:** A test appointment intent appears in the calendar and produces the approved admin notification behavior.
- **Constraints:** VIN does not receive appointments unless a separate approved path exists.

### Sprint 2.5 — TeamBox Customer-Message Workflow

- **Objective:** Make customer-message handling understandable and usable across relevant sections.
- **Scope:** TeamBox list/thread, assignment/takeover, reply, push-to-VIN clarity, section access if approved, and notification entry points.
- **Done looks like:** A staff user can find, understand, and act on relevant customer conversations without unnecessary navigation confusion.
- **Constraints:** No broad redesign. Section access is limited to approved TeamBox segmentation work.

### Sprint 2.6 — Durran Testing Package And User Guide

- **Objective:** Give Durran and the operator practical material to test and review the system.
- **Scope:** Trigger scenarios, replies, service campaigns, widgets, appointment path, conversation flow, expected outputs, and known limitations.
- **Done looks like:** Durran can run the guide asynchronously and report pass/fail without needing code knowledge.
- **Constraints:** Customer/partner-readable language only.

## Phase 3 — Metrics And Customer Value

### Sprint 3.1 — Remove Or Gate Irrelevant Metrics

- **Objective:** Remove, hide, or gate visible metrics that do not answer useful dealership questions.
- **Scope:** Metrics identified by Sprint 1.4.
- **Done looks like:** Misleading or meaningless metrics are no longer prominent in the UI.
- **Constraints:** No replacement metric ships without supportable data.

### Sprint 3.2 — Revise Dashboard And Department Metrics

- **Objective:** Replace approved metrics with decision-oriented metrics tied to real data.
- **Scope:** Main dashboard, Sales, Service, Marketing, Management, and metric detail dialogs.
- **Done looks like:** Each revised metric states or implies a useful action question and matches backend calculations.
- **Constraints:** Keep UI changes tightly scoped to metrics.

### Sprint 3.3 — Repair Or Defer Service Insights

- **Objective:** Resolve service insights that are broken, misleading, or not service-specific.
- **Scope:** Service page insights, shared Insights embed behavior, service campaign metrics, and service-specific data sources.
- **Done looks like:** Service insights are either useful and verified or explicitly hidden/deferred.
- **Constraints:** Do not present sales metrics as service insight.

### Sprint 3.4 — CRM/Warehouse Question Map

- **Objective:** Map CRM and warehouse data to dealership questions worth answering.
- **Scope:** Warehouse leads, imported CRM export, CRM YAML/API capability file, reports, lead-source data, service opportunities, and marketing-source performance.
- **Done looks like:** A matrix shows question, available data, missing data, source, freshness, and buildability.
- **Constraints:** Analysis output does not automatically authorize new features.

## Phase 4 — Focused UX Friction And Quick Wins

### Sprint 4.1 — TeamBox Section Access

- **Objective:** Add approved section access to relevant TeamBox messages from Sales, Service, and/or Marketing submenus.
- **Scope:** Shared conversation workbench, department filters if supportable, submenu placement, and role/section visibility.
- **Done looks like:** Users in a section can access relevant messages without leaving their section workflow, while the global TeamBox remains available.
- **Constraints:** No parallel TeamBox implementations. Reuse shared components where possible.

### Sprint 4.2 — Push-To-VIN Clarity

- **Objective:** Make the push-to-VIN action understandable and harder to misuse.
- **Scope:** Button wording, context panel, disabled states, confirmation copy, and success/failure feedback.
- **Done looks like:** A user can tell what push-to-VIN does, when to use it, and whether it succeeded.
- **Constraints:** VIN write safety rules still apply.

### Sprint 4.3 — Module Visibility And Gating

- **Objective:** Prevent unfinished or unpaid modules from confusing users.
- **Scope:** Marketing, agents, hunches, insights, billing/module-gated areas, empty states, and navigation visibility.
- **Done looks like:** Visible modules are either functional, clearly gated, or hidden/deferred.
- **Constraints:** Do not imply paid module availability where access is limited.

### Sprint 4.4 — Notification Entry-Point Strategy

- **Objective:** Define and implement only the approved notifications that help users know when to log in.
- **Scope:** In-app notifications, email notifications, TeamBox unread states, urgent escalations, and opt-out behavior.
- **Done looks like:** Notifications are tied to an owner, urgency, channel, and action.
- **Constraints:** Avoid noisy generic notifications.

## Phase 5 — Hardening, Release, And Closeout

### Sprint 5.1 — Regression And Playwright Coverage

- **Objective:** Prove critical workflows continue to work after finishing changes.
- **Scope:** Targeted Playwright specs, API checks, and manual smoke checklist.
- **Done looks like:** Critical flows have repeatable verification and evidence artifacts.
- **Constraints:** Prefer targeted tests over broad brittle sweeps.

### Sprint 5.2 — Security/Bug Hardening

- **Objective:** Fix or explicitly defer critical bugs and security issues found during preflight.
- **Scope:** Items promoted from Sprint 1.7.
- **Done looks like:** Promoted bugs have fixes and verification evidence, or clear deferral rationale.
- **Constraints:** Security-sensitive paths require careful review.

### Sprint 5.3 — Customer-Facing Handoff

- **Objective:** Prepare customer/partner materials that explain how to use and test the finished system.
- **Scope:** User guide, testing guide, known limitations, support/escalation path, and approved workflow descriptions.
- **Done looks like:** Durran/operator can use the materials without internal engineering context.
- **Constraints:** Do not document unshipped features as available.

### Sprint 5.4 — v2.2 Closeout And v2.3 Seed List

- **Objective:** Close v2.2 cleanly and preserve deferred product-market-fit opportunities for v2.3 planning.
- **Scope:** Closeout report, final verification evidence, deferrals, quick-win leftovers, and v2.3 candidate list.
- **Done looks like:** v2.2 has a clear final state and v2.3 starts from a clean seed list.
- **Constraints:** Do not let deferred ideas leak back into v2.2 without operator approval.

## Phase 6 — Customer-Configurable Reporting Platform (v2.3 candidate)

### Sprint 6.1 — Dashboard Builder + Report Builder

- **Objective:** Let dealership users compose dashboards and recurring email reports from existing data templates without engineering involvement, and have those reports send on customer-defined intervals (daily, weekly, monthly, custom cron).
- **Scope:** A dashboard-builder UI for choosing tiles/charts/metrics from a curated library; a report-builder UI for composing an email layout from those same templates plus narrative blocks; per-customer scheduling (interval, timezone, recipient list, quiet hours); reuse of existing weekly-report and daily-recap email infrastructure (`server/services/weeklyReportService.ts`, `server/services/dailyRecapService.ts`, `server/services/notificationService.ts`); per-tenant persistence of dashboard + report definitions; preview-and-test-send flow through the existing test-lane envelope; admin gate so only operator + org_admin can edit; CommGate enforcement; HALT checks parity with weekly-report safety pattern.
- **Done looks like:** An org_admin can build a dashboard from a tile library, save it, build a recurring email report that reuses any subset of those tiles, set a cadence (e.g., "every Monday 8am ET") and recipients, send a test through the test-lane, and have the report fire on schedule. Reports respect CommGate + per-store flags. All sends are recorded with HALT-check parity. A customer can change cadence, recipients, and content without engineering involvement.
- **Constraints:** Do NOT bypass CommGate or test-lane envelope. Do NOT introduce a parallel scheduler — reuse the existing 60s/5min ticks. Templates must be a curated library, not freeform LLM-generated layouts. Recipient resolution must obey the same per-org / per-role boundaries as the existing weekly-report (no cross-org bleed). The data layer should NOT be a per-tile bespoke query — define a small set of typed query primitives (e.g., warehouse_leads aggregated, conversation counts, appointment counts) that tiles consume. Any metric exposed to this builder must already be REAL or PARTIAL grade per the dashboard-honesty audit (`evidence/stabilization-sprint-2026-04-30/lane-7-metrics.md`); MOCKED/STALE metrics are not eligible until they're fixed. UI introduction is significant — requires explicit operator approval before any code starts and must follow harness `harness-frontend` per-file scope markers.
