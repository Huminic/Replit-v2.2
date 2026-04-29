# Customer Call Strategy Report — 2026-04-24

Status: Planning input, not an approved execution plan.

Purpose: Convert today's customer-call notes into action items, backlog candidates, plan candidates, and strategic product direction. Nothing in this document is automatically approved for `plan.md` or `backlog.md`.

## Executive Read

The call was positive, but the customer is struggling to connect the product to daily dealership operations. They see promise, they want the product to succeed, and they are willing to keep working through product-market fit. The risk is not that the platform lacks ideas. The risk is that too many surfaces feel disconnected from the dealership's immediate jobs: responding to leads, understanding funnel problems, finding service opportunities, seeing useful metrics, and knowing when to log in.

The next planning horizon should focus on three outcomes:

1. Make the currently promised workflows reliable enough to trust.
2. Make the interface explain itself through workflow placement, not training.
3. Turn CRM and warehouse data into dealership decisions, not generic metrics.

## Customer Signals

### What Went Well

- The call went well overall.
- The product helped avoid a serious customer-facing problem.
- The customer remains constructive and wants the effort to succeed.
- They understand the product is still searching for product-market fit.

### Friction Points

- Metrics shown in the UI are not meaningful to them.
- Some visible modules are not actually usable yet, especially marketing.
- Agents sometimes behave oddly.
- Trigger and agent configuration appear hardcoded or incomplete.
- TeamBox is confusing to navigate.
- The "push to VIN" rationale is not self-evident.
- Service users dislike leaving the service area to work conversations in TeamBox.
- Service insights are not working correctly.
- Hunches only make sense if tied to specific goals, issues, and alerts.
- They want faster visibility into imported CRM/warehouse data instead of waiting on monthly import cycles.
- They do not yet know how to fold the platform into day-to-day work.
- They need clearer reasons they cannot live without the product.

## Commitments From The Call

These are commitments stated to the customer or partner. They should become explicit planning candidates.

- Get triggers working and launched.
- Test triggers and replies with Durran.
- Review metrics with the team and adjust/remove irrelevant ones.
- Reconcile the CRM YAML/API capability file against the data we have and the questions the dealer cares about.
- Identify which modules need additional access/logins.
- Import Durran's exported CRM data and investigate better/faster access paths.
- Map how marketing lead-source data could help spot problems.
- Research how other dealers use similar data for fast decisions.
- Test everything again, including personally running a service campaign and sending messages.
- Review TeamBox UX and segmentation options.
- Explore notifications that help users know when to log in.
- Send Durran a user guide and testing guide.
- Investigate competitive pricing/inventory alerts.
- Investigate FTC/regulatory scanning for competitor messaging/offers.
- Explore AI-generated strategic suggestions.
- Explore an after-hours AI switchboard.
- Explore service agent strategy around repair-versus-replace conversations.

## Immediate Action Items

These should be considered first because they directly address trust, confusion, or active customer commitments.

### Reliability And Trust

- Verify outbound triggers end-to-end, including legal send timing and earliest-allowed follow-up behavior.
- Test reply handling with Durran using scripted scenarios.
- Run a full service campaign personally in a controlled path.
- Produce a Durran testing guide and user guide.
- Verify widget, trigger, reply, appointment, and TeamBox paths from a user's point of view.

### Interface Clarity

- Audit metrics and remove or hide meaningless metrics.
- Audit service insights and either fix, hide, or clearly label unfinished service-specific views.
- Audit marketing module visibility. If it is not functional, hide it, gate it, or mark it as unavailable based on paid module access.
- Review TeamBox navigation using Playwright screenshots and task walkthroughs.
- Clarify the "push to VIN" action with better placement, wording, or contextual explanation.

### Workflow Placement

- Decide whether TeamBox remains unified, gets Sales/Service inboxes, or uses a hybrid segmented model.
- Consider embedding conversation work inside Sales and Service instead of forcing users back to TeamBox.
- Define notification triggers that tell staff when action is needed.

### Data Strategy

- Import Durran's CRM export into a safe warehouse import area.
- Inventory the data available from CRM exports, existing warehouse tables, and the YAML/API capability file.
- Map available data fields to meaningful dealership questions.
- Identify which data cannot be seen in VIN Solutions but can be surfaced in Nexxus.

## Backlog Candidates

These are formatted to match the repo's `backlog.md` style. They are candidates only.

### Trigger Reliability And Legal Timing

- **Objective:** Ensure outbound follow-ups send as early as legally allowed and continue to comply with dealership/legal constraints.
- **Scope:** Trigger scheduler, quiet-hours rules, message send windows, audit logs, test-phone workflows.
- **Done looks like:** Durran can test trigger scenarios, replies are captured, send timing is visible, and legal timing rules are documented.
- **Constraints:** No real-customer sends without operator approval and proper gating.

### Durran Testing And User Guide

- **Objective:** Give Durran a self-guided guide for testing triggers, replies, widgets, service campaigns, and conversation flows.
- **Scope:** Testing guide, user guide, scripted scenarios, expected results, known limitations.
- **Done looks like:** Durran can run tests without live support and report pass/fail clearly.
- **Constraints:** Must use customer-readable language, not internal implementation language.

### Metrics Cleanup

- **Objective:** Remove or reframe metrics that do not help dealership users make decisions.
- **Scope:** Dashboard, insights, service, sales, management-facing metrics, report metrics.
- **Done looks like:** Every visible metric answers a plain dealership question or is removed/hidden.
- **Constraints:** Do not invent metrics unless the source data supports them.

### CRM Data Capability Matrix

- **Objective:** Reconcile the CRM YAML/API capability file, imported CRM export, and current warehouse schema against useful dealership questions.
- **Scope:** YAML/API file, warehouse tables, CRM export, existing reports, insight views.
- **Done looks like:** A matrix shows question, available data, missing data, source, freshness, and buildability.
- **Constraints:** Analysis only until operator approves implementation.

### Service Campaign End-To-End Walkthrough

- **Objective:** Run and verify a service campaign from setup through message send and response handling.
- **Scope:** Service campaign UI, recipients, send path, response routing, TeamBox/service handoff.
- **Done looks like:** One controlled service campaign flow is documented with screenshots, outputs, issues, and fixes/defer decisions.
- **Constraints:** Controlled test audience unless operator approves live send.

### TeamBox Usability And Segmentation Audit

- **Objective:** Determine whether TeamBox should be unified, segmented, or embedded inside department areas.
- **Scope:** TeamBox, Sales, Service, Marketing, notification entry points, push-to-VIN action.
- **Done looks like:** Playwright-backed report with screenshots, task friction, recommended UX model, and implementation cost.
- **Constraints:** Research first; no redesign until the model is approved.

### Conversation Flow Viewer

- **Objective:** Let operators and partners see every automated communication scenario before it reaches customers.
- **Scope:** Read-only view of trigger scenarios, message copy, timing rules, legal windows, reply handling.
- **Done looks like:** Durran and operator can review tone, layout, and sequence behavior without reading code.
- **Constraints:** Read-only, role-gated, no live-send controls.

### Notification Strategy

- **Objective:** Define when users should be notified to log in and what channel should be used.
- **Scope:** In-app notifications, email, optional SMS, TeamBox unread states, urgent escalation rules.
- **Done looks like:** Notification matrix by event, urgency, recipient, channel, and opt-out behavior.
- **Constraints:** Avoid creating noise; every notification needs an owner and action.

### CRM Warehouse Opportunity Mining

- **Objective:** Use CRM and warehouse data to identify proactive sales, service, and equity opportunities.
- **Scope:** Imported CRM data, warehouse leads, appointments, service candidates, ownership/vehicle data if available.
- **Done looks like:** Candidate opportunity list ranked by business value, data availability, and implementation effort.
- **Constraints:** Must separate buildable-now ideas from ideas needing additional data access.

### Competitive Intelligence And Price Alerts

- **Objective:** Explore PMA competitor inventory/pricing alerts and reports.
- **Scope:** Competitor list, inventory source strategy, vehicle matching, price-drop alerts, email report, competitor section under data.
- **Done looks like:** Feasibility report plus prototype data model for comparing dealer offers to competitor listings.
- **Constraints:** Requires operator-approved competitor list and compliant data collection approach.

### FTC And Offer Compliance Scanner

- **Objective:** Evaluate how to scan dealer and competitor offers for potential FTC/compliance issues.
- **Scope:** Offer pages, ads, pricing claims, fee/disclosure language, scanner rules, report UI.
- **Done looks like:** Rules matrix and scan prototype based on operator-provided FTC technical document.
- **Constraints:** Not legal advice; output should be risk flags for human review.

### After-Hours AI Switchboard Discovery

- **Objective:** Scope an AI switchboard for after-hours calls that routes callers to sales/service and can request appointments.
- **Scope:** VAPI agents, routing rules, service appointment request flow, transfer/escalation behavior, audit logs.
- **Done looks like:** Architecture option document with MVP, risks, and required call-flow scripts.
- **Constraints:** Discovery only until voice-routing behavior is approved.

## Plan Inclusion Candidates

These are not finalized phases. They are a clean way to place the work without jumping to execution.

### Phase A — Stabilize Promised Workflows

Goal: Make triggers, replies, widgets, service campaigns, reports, chat, and TeamBox reliable enough that the customer can trust them.

Candidate sprints:

- Trigger reliability and legal timing.
- Durran testing package and reply testing.
- Service campaign end-to-end walkthrough.
- Current module visibility audit.
- Regression test sweep of promised customer-facing flows.

### Phase B — Make The Product Understandable

Goal: Reduce confusion in the interface and make the software fit dealership workflows.

Candidate sprints:

- Metrics cleanup.
- TeamBox usability and segmentation audit.
- Service-area conversation workflow.
- Push-to-VIN clarity.
- Notification strategy.

### Phase C — Turn Data Into Decisions

Goal: Use CRM/warehouse data to answer valuable dealership questions.

Candidate sprints:

- CRM data capability matrix.
- Meaningful-question map by sales, service, marketing, and management.
- Opportunity mining shortlist.
- Service insights repair or redesign.
- Marketing lead-source problem mapping.

### Phase D — Differentiated Intelligence

Goal: Explore product-market-fit differentiators after the foundation is trustworthy.

Candidate sprints:

- Competitive pricing and inventory intelligence.
- FTC/offer compliance scanner.
- AI-generated competitive suggestions.
- After-hours AI switchboard discovery.
- Repair-versus-replace service agent strategy.

### Phase E — Governance And Closeout

Goal: Convert planning outputs into approved backlog and execution chunks.

Candidate sprints:

- Promote approved candidates into `plan.md`.
- Promote approved work into `backlog.md`.
- Mark rejected or deferred items explicitly.
- Produce customer-facing roadmap summary.

## Strategic Product Direction

### The Product Should Move From Dashboard To Daily Operating System

The customer does not need more generic metrics. They need the product to answer operational questions:

- Which leads need action now?
- Which salesperson, source, or campaign is causing a funnel issue?
- Which service customers should we contact today?
- Which customers are likely equity or upgrade opportunities?
- Which competitor pricing changes threaten our inventory?
- Which conversations need human takeover?
- What changed since yesterday?

### Metrics Should Be Reframed As Questions

Instead of surfacing raw counts, each metric should map to a dealership decision.

Examples:

- Bad: "Active pipeline: 143."
- Better: "18 high-intent leads have no next action."
- Bad: "Outbound sent: 271."
- Better: "42 follow-ups are waiting for legal send window."
- Bad: "Marketing source count."
- Better: "Lead source X is producing more leads but fewer appointments."

### TeamBox Should Follow The User's Work

The call suggests TeamBox may be too abstract as a standalone place. There are three viable models:

- Unified inbox: one TeamBox for all conversations.
- Segmented inbox: TeamBox has Sales, Service, Marketing views.
- Embedded hybrid: TeamBox remains the system of record, but Sales and Service show department-filtered conversation work in-context.

The hybrid model likely fits the feedback best, but it should remain a planning decision until the UX audit confirms implementation cost and data requirements.

### Hunches Should Be Goal-Bound

The customer liked the concept only when tied to a concrete goal or issue. Hunches should not be generic "AI noticed something" cards. They should be tied to named dealership goals:

- Recover aged leads.
- Improve appointment set rate.
- Reduce service no-shows.
- Find equity candidates.
- Detect marketing source drift.
- Find inventory pricing threats.

### Warehouse Data Is A Differentiator If It Becomes Faster Than VIN

The customer specifically noticed that some imported data is hard to see in VIN Solutions. That is a product wedge: Nexxus can become the faster, more useful operational view over dealership data, even when VIN is the CRM of record.

## Market Research Notes

### Equity Mining And Proactive Outreach

Automotive vendors commonly position equity mining around identifying customers who may be ready to trade, upgrade, refinance, or return to the dealership before they otherwise would. AutoAlert positions its platform around data-mining dealership/customer data to create opportunities, retention, and personalized outreach. This supports treating "equity/service candidates" as a strategic Nexxus direction, but only after the data inventory shows which signals exist.

Source: AutoAlert, "CXMs and Data Mining" and platform pages.

### Competitive Pricing Intelligence

vAuto and similar inventory tools focus heavily on market-based pricing, competitive listings, inventory age, and pricing decisions. This validates the customer's request for PMA competitor comparisons, price-drop alerts, and inventory comparison tables. Nexxus should not try to replace inventory merchandising tools immediately. The near-term opportunity is a focused alert/report layer that summarizes competitive threats and ties them to action.

Sources: Cox Automotive vAuto Provision and vAuto inventory/pricing pages.

### CRM And Workflow Integration

Dealer CRM products emphasize lead handling, follow-up, tasking, customer records, and engagement workflows. This validates the need for Nexxus to make "what should I do next?" clear rather than only reporting on what happened. If Nexxus remains a separate dashboard, adoption will lag; if it becomes a task/action layer around communications and opportunities, it becomes harder to ignore.

Sources: CDK Elead CRM and DealerSocket CRM product pages.

### AI Phone Answering And Switchboard

AI voice receptionist/switchboard vendors are increasingly positioned around after-hours coverage, appointment capture, routing, and missed-call recovery. This supports exploring the AI switchboard, but the customer's prior bad vendor experience means the MVP must be narrow, measurable, and fail-safe.

Sources: automotive AI receptionist and dealership phone AI product examples from vendors such as Stella Automotive AI and similar providers.

### FTC And Compliance Scanning

The FTC's CARS Rule and auto-dealer advertising guidance emphasize pricing clarity, junk fees, bait-and-switch issues, and truthful offer presentation. A scanner could be valuable as a risk-flagging tool, but it should be framed as operational/compliance assistance for human review, not legal advice.

Sources: FTC official CARS Rule pages and auto dealership guidance.

## Match To Existing Product Foundation

### Already Present Or Partially Present

- Organizations and per-store structure.
- Users, roles, sessions, partner/super-admin access patterns.
- Agents with channel/config fields.
- Conversations and messages.
- Campaigns, recipients, outbound logs.
- Warehouse leads and metrics.
- Appointments.
- Widgets and public landing routes.
- Weekly report service.
- Hunches table and service.
- Notifications table/service.
- Billing/usage/event foundations.

### Strong Leverage Points

- `warehouse_leads` can support lead and service opportunity mining if enriched with CRM import fields.
- `conversations` and `messages` can support TeamBox, reply monitoring, takeover, and conversation-flow review.
- `campaigns`, `campaign_recipients`, and `outbound_log` can support service campaign testing and legal timing audit.
- `widgets` and public routes support customer-facing action testing.
- `hunches` can become a goal-bound insight layer instead of a generic alert surface.
- `notifications` can become the "know when to log in" layer.

### Likely Gaps

- Department-specific conversation routing and filtering may require a durable department/source classification strategy.
- Meaningful service insights may require service-specific data fields not currently normalized.
- Competitive intelligence requires external inventory/pricing data collection and vehicle matching.
- FTC scanning requires a rule set and document/source inputs.
- AI switchboard requires explicit call-flow design, fallback routing, and transfer/escalation policy.
- Agent/trigger configuration likely needs UI and server-side config surfaces instead of hardcoded behavior.

## Open Decisions

These should not be buried. They determine what enters `plan.md`.

- What is the next planning horizon: reliability only, or reliability plus product-market-fit improvements?
- Which visible modules should be hidden/gated until functional?
- Does TeamBox stay unified, split, or become hybrid/embedded?
- What are the first three dealership questions the product must answer better than VIN?
- What data access path is acceptable for faster CRM/warehouse refresh?
- Who approves tone, layout, and message flow: operator, Durran, customer, or all three?
- Which competitive PMA dealers should be tracked?
- What is the scope of FTC scanning, and what source document controls the rules?
- Does the after-hours switchboard belong in this horizon or discovery only?
- What is the definition of "done" for the next phase?

## Recommended Next Move

Do not directly rewrite `plan.md` from this report. Instead:

1. Review this report with the operator.
2. Mark each backlog candidate as Decided, Proposed, Deferred, Removed, or Open.
3. Promote only Decided items into `plan.md`.
4. Promote only Decided and planned items into `backlog.md`.
5. Keep this report as traceability for why the items exist.

## Source Links

- FTC CARS Rule announcement: https://www.ftc.gov/news-events/news/press-releases/2023/12/ftc-announces-cars-rule-fight-scams-vehicle-shopping
- FTC CARS Rule effective-date pause: https://www.ftc.gov/news-events/news/press-releases/2024/01/ftc-pauses-cars-rule-effective-date
- FTC auto dealer guidance: https://www.ftc.gov/business-guidance/industry/automobiles
- Cox Automotive vAuto: https://www.coxautoinc.com/brands/vauto/
- vAuto Provision: https://www.vauto.com/solutions/new-car-inventory-management/provision/
- AutoAlert equity/data mining: https://www.autoalert.com/alertminer-automotive-equity-data-mining/
- CDK Elead CRM: https://www.cdkglobal.com/dealership-crm
- DealerSocket CRM: https://www.dealersocket.com/products/crm/
- Stella Automotive AI reception: https://stellaautomotive.com/stellareception/
- Stella Automotive AI service: https://stellaautomotive.com/stella-service/
