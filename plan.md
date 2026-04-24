# Nexxus v2.2 — Critical Path to Launch

**Living document.** Captain updates at phase boundaries + at checkpoint moments. Operator reviews at wake-up / end-of-day.

Referenced standards: `~/Claude-store/sysadmin/governance-framework/file-standards.md`.
Sprints detailed in: `backlog.md`.

---

## 1. Version Context

**Where we are (2026-04-24 evening):**
- Post-migration to subtractive harness (2026-04-23)
- Wave-pe3 branch, ahead of main; Phase D weekly report shipped; governance standards adopted
- Critical contract meeting complete today; dealer aligned, approvals in progress
- Monday Apr 27 Serra Honda widget + trigger go-live is the next hard milestone

**Definition of Done for v2.2:**
Every feature declared in `evidence/QA-S0/feature-map.md` + `evidence/U-001/state-enumeration.md` is functional, tested, and verifiable. Critical contract features live at all 5 stores (with documented per-store exceptions). Hard deferrals to v2.3 explicitly listed and acknowledged.

---

## 2. Deadlines + Milestones

| Date | Milestone | Owner |
|---|---|---|
| Thu Apr 24 (tonight) | plan.md, backlog.md, Sprint 1.2 dispatched, governance committed | captain |
| Fri Apr 25 end-of-day | Phase 1 complete: validation report, data import, quick-win insight shortlist | captain + operator review |
| **Sat Apr 26 10 PM ET** | **Saturday Night Checkpoint (CRITICAL)** | captain + operator |
| Sun Apr 27 (day) | Phase 3 hardening + dry-run + deployment prep | captain |
| Mon Apr 27 9 AM ET | Serra Honda widget + trigger go-live | captain + operator + Cox |
| Tue Apr 28 end-of-day | Widget site-wide at Serra Honda (after Day 1 VDP verification) | captain + Cox |
| Sun May 11 | Phase 4 non-critical completion end | captain |
| Sun May 18 | Phase 5 end: v2.2 closed, v2.3 planning opens | captain + operator |

### Saturday Night Checkpoint (non-negotiable)

On Sat Apr 26 by 10 PM ET, captain produces a checkpoint report with:
- State of every critical feature (green/yellow/red)
- Which Phase 2 sprints completed, which did not
- Risk assessment for Monday go-live at current state

**Decision tree at checkpoint:**
- All critical green → proceed with full Phase 3 hardening + Monday go-live as planned
- Any critical yellow → Captain + operator review. Accept yellow (with mitigation) or trigger reduced-scope launch
- Any critical red → **Reduced-scope launch mode.** Only ship what's green to Monday. Red items move to Phase 4, evaluated against v2.3 scope

Reduced-scope launch fallback is pre-approved. Captain activates it unilaterally if reality demands; no ad-hoc re-plan during prime time.

---

## 3. Per-Store Scope

| Capability | Serra Honda | Serra Nissan | Tony Serra Ford | Ford of Columbia | Hyundai of Columbia |
|---|---|---|---|---|---|
| Inbound voice → VIN via ADF | ✓ | ✓ | ✓ | TBD per operator | TBD per operator |
| Outbound triggers (after-hours + 24h) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Core reports (weekly exec report) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Main chat + agent chat basic capabilities | ✓ | ✓ | ✓ | ✓ | ✓ |
| Staff messaging (TeamBox) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Service campaigns | ✓ | — (v2.3) | — (v2.3) | — (no service module) | — (no service module) |
| Widget (all 4 actions) | Mon VDP / Tue site-wide | after Honda verification | after Honda verification | after Honda verification | after Honda verification |

Columbia ADF intake emails: operator decision pending. If intentional "off for now," v2.2 ships Columbia with VAPI path going through VIN API (known partially broken per I-240 — mitigation required or feature deferred).

---

## 4. Scope — What's IN v2.2

**Critical (must ship to close v2.2):**
- Inbound call answering & VIN delivery via ADF at the 3 Serra stores (Columbia conditional on operator)
- Outbound triggers at all 5 stores (after-hours + 24h check-in SMS)
- Two-way SMS conversation working at all 5 stores
- Appointment intent detection (SMS path): appointment stored in our system calendar + notification email to org admins with reminders. VIN Solutions does not accept appointment entries; ADF XML remains the CRM touchpoint, calendar stays in-platform.
- Core metrics + reports (weekly exec report already delivering)
- Main chat + agent chat verified basic working at all 5 stores
- Staff messaging (TeamBox) working at all 5 stores
- Service campaigns at Serra Honda (messaging tested end-to-end)
- Widget all 4 actions (web chat, instant callback, contact form, video) live at Serra Honda Monday; expandable to all 5 stores after Day 1

**Important (ship if time, evaluated at Sat checkpoint):**
- FTC scanner UI + reports (using operator's technical document when provided)
- Competitive intelligence module (price + inventory vs PMA competitors)

**Stabilization (ship alongside critical):**
- Victoria dealer-switch fix deployed
- Widget UI bridge fix deployed
- Security fixes for paid-contract paths (IDOR, prompt-injection, role-dropdown) — targeted scope

---

## 5. Scope — What's DEFERRED to v2.3

Explicitly deferred. Not part of v2.2. Documented so the dealer knows:
- Service landing pages + service-specific widgets (exists as concept, not built)
- Service insights distinct from sales insights (may already share code — verification in Phase 1)
- Marketing agent module (waiting on marketing API logins from dealers)
- Hunches / hunch alerts (low-priority per operator)
- Notification engine (design-heavy, deferred; daily briefing in Phase 4 serves as design exploration)
- AI switchboard (after-hours call routing beyond current VAPI)
- AI-generated creative ideas / competitive creative output
- Equity mining proactive layer (data foundation in warehouse; outreach engine in v2.3)
- Daily briefing email engine beyond MVP
- Lead source API ingestion (awaiting logins)
- Monthly CRM export pipeline (beyond one-time 45-day import)
- Executive / Management module (chat governance, access controls, executive-only insights gating) — bottom of v2.3 stack
- Tasks concept (agent-created or human-created tasks) — scope unclear; defer to v2.3 for a proper user-story pass
- Lago billing full integration (usage tracking, invoicing, dealer plan mapping) — v2.3; v2.2 ships monitoring-only fast-follow (see Sprint 4.9)
- Staff-to-staff messaging — explicitly not in scope (no such feature exists; TeamBox is customer-conversation only)

---

## 6. Phases + Sprints

Each sprint is detailed in `backlog.md` with 4-field format. This section sequences them.

### Phase 1 — Foundation (Thu Apr 24 → Fri Apr 25)

Purpose: know what we have, know what we're shipping, line up the data.

- **Sprint 1.1** — Governance + plan closure (plan.md, backlog.md populated, standards committed) — **in progress tonight**
- **Sprint 1.2** — Codebase validation sweep (autonomous, dispatched tonight — COMPLETE; output at `evidence/v2.2-inventory-2026-04-24.md`)
- **Sprint 1.3** — Warehouse data import (Durran's 45-day export → warehouse tables, cross-reference)
- **Sprint 1.4** — Quick-win insight audit (causal cross-ref of imported + existing data → shortlist of alert/hunch/report candidates)
- **Sprint 1.5** — TeamBox first-principles research (Playwright MCP driven, pre-flight gate for governance finalization — dispatched tonight)

**Human relay (Phase 1):**
- Confirm Durran's 45-day export is in `uploads/crm-exports-2026-04-23/` (or tell captain where it is)
- Decide Columbia ADF intake emails (provide or confirm "off for now")
- Review plan.md + Sprint 1.2 validation report at wake-up

### Phase 2 — Critical for Monday (Fri Apr 25 → Sat Apr 26)

Purpose: everything that has to be on by Monday morning.

- **Sprint 2.1** — Trigger activation end-to-end (includes tonight's queue: DEFER path, isNexxusOriginatedLead URL fix, SMS appointment intent, admin email, first-inbound AI path)
- **Sprint 2.2** — Widget verification all 4 actions + production deploy to Serra Honda VDP (Cox email sent)
- **Sprint 2.3** — Durran testing package (SMS scenarios, widget actions, appointment flow, conversation flow viewer)
- **Sprint 2.4** — Ship quick-win insights from Sprint 1.4 (highest-signal 2-3 items)
- **Sprint 2.5** — Inbound voice→ADF verification across Serra stores (3-store sweep)
- **Sprint 2.6** — Core reports verification at all 5 stores (weekly exec report sales-only filter plumbed through scheduler)
- **Sprint 2.7** — Main chat + agent chat basic capability E2E at all 5 stores
- **Sprint 2.8** — Staff messaging (TeamBox) verification across all 5 stores
- **Sprint 2.9** — Service campaigns E2E at Serra Honda (operator walks one campaign through)

**SAT APR 26 10 PM ET — checkpoint runs here.**

**Human relay (Phase 2):**
- Durran validates SMS trigger scenarios from test phone
- Durran approves tone + message wording
- Operator reviews Durran testing package before sending
- Operator walks service campaign with captain
- Operator present for Saturday night checkpoint

### Phase 3 — Hardening + Go-live (Sun Apr 26 → Mon Apr 27 AM)

Purpose: ship clean, be ready to react.

- **Sprint 3.1** — Deployment preparation (build + pm2 restart staging, smoke-tested)
- **Sprint 3.2** — Kill switch implementation (emergency outbound-off flag, super_admin endpoint)
- **Sprint 3.3** — Manual smoke test all 5 stores (captain drives, operator present)
- **Sprint 3.4** — Dry-run Sunday night: full weekly report fire to operator + staged Monday scenarios
- **Sprint 3.5** — Go-live Mon 9 AM ET: Serra Honda widget + trigger whitelist active
- **Sprint 3.6** — Day-1 Monday monitoring (eyes-on through business day)

**Human relay (Phase 3):**
- Final go/no-go call Sunday night
- Operator present during Monday 9 AM ET go-live
- Operator handles any customer escalations during Day 1

### Phase 4 — Non-Critical Completion (Tue Apr 28 → Sun May 11)

Purpose: finish everything else in v2.2 scope. Run in sprint order but parallel-friendly where possible.

- **Sprint 4.1** — Health monitoring service + daily eval (proper build, not rushed)
- **Sprint 4.2** — Widget rollout to remaining 4 stores (staged per operator's sequence)
- **Sprint 4.3** — FTC scanner UI + reports (using operator's technical document)
- **Sprint 4.4** — Competitive intelligence module (PMA inventory + pricing + FTC compliance flag)
- **Sprint 4.5** — Metrics cleanup across UI (remove noise, reframe problem-first)
- **Sprint 4.6** — TeamBox segmentation + sales/service split + push-to-VIN clarity
- **Sprint 4.7** — Agent configuration UI (unhardcode trigger config, message tone, quiet hours, rate limits)
- **Sprint 4.8** — Conversation flow viewer (read-only preview of every scenario's messaging)
- **Sprint 4.9** — Lago billing monitoring only (usage visibility, not full invoicing wire; full integration is v2.3). Fast-follow post-Monday, not Monday-critical.
- **Sprint 4.10** — Daily briefing email MVP (Mon morning digest to dealer admins)
- **Sprint 4.11** — Security hardening (targeted: IDOR, prompt injection, role escalation, slug mutability, TZ validation, self-deactivation)
- **Sprint 4.12** — Performance audit pass 1 (N+1 queries, unnecessary roundtrips)

**Human relay (Phase 4):**
- Provide FTC technical document when ready
- Confirm Lago billing contract details
- Confirm competitive intel target competitors (PMA list per store)
- Approve user-visible copy in daily briefing template

### Phase 5 — Final Deploy + v2.3 Handoff (Mon May 12 → Sun May 18)

Purpose: close v2.2, open v2.3.

- **Sprint 5.1** — Security audit + fix pass (targeted to paid-contract paths)
- **Sprint 5.2** — Performance audit + fixes
- **Sprint 5.3** — v2.2 final verification sweep (every DoD item checked)
- **Sprint 5.4** — v2.2 closeout report for operator + partner
- **Sprint 5.5** — v2.3 planning kickoff (next plan.md)

**Human relay (Phase 5):**
- Authorize security audit scope
- Final v2.2 sign-off
- v2.3 vision session with operator

---

## 7. Dependencies + Critical Path

```
Sprint 1.1 (plan) → Sprint 1.2 (validation) → Phase 2 sprint list finalization
Sprint 1.3 (data import) → Sprint 1.4 (insight audit) → Sprint 2.4 (ship insights)
Sprint 2.1 (triggers) → Sprint 3.4 (dry run) → Sprint 3.5 (go-live)
Sprint 2.2 (widget) → Sprint 3.5 (go-live)
Sprint 2.5-2.9 (5-store verification) → Saturday checkpoint → Phase 3
Saturday Checkpoint → Reduced-scope launch OR full launch
```

Critical path from today to Monday go-live: 1.1 → 1.2 → (2.1, 2.2) → (2.3–2.9) → 3.4 → 3.5.

---

## 8. Risks + Mitigations

| Risk | Mitigation |
|---|---|
| Saturday checkpoint shows critical red | Pre-approved reduced-scope launch. Captain activates without re-plan cycle. |
| Cox delays deploy acknowledgment | Operator-to-operator escalation path already open. Email scheduled for Thaddeus's return. |
| Durran unavailable | Testing package is async-friendly. Captain proceeds on green-light-by-silence if Durran doesn't flag issues by Sat noon. |
| Columbia ADF config missing | Flagged for operator decision. If unresolved by Sat checkpoint, Columbia voice path documented as known-limited for v2.2. |
| Widget embed issue on Cox side | Operator has permissions to re-edit. Rollback is removing the script tag — confirmed. |
| Autonomous agents produce regressions | Each sprint ends with code-reviewer agent sanity check. Commits staged, not pushed. Operator reviews before deploy. |
| Service campaign breaks at Serra Honda | Pre-Monday E2E test in Sprint 2.9 — captain walks a real campaign. Catch before Monday. |
| Health monitoring deferred to Phase 4 means no auto-alerting Mon | Captain manually eyes-on through Day 1. External ping test script in Sprint 3.6 provides basic coverage. |

---

## 9. Operator Tasks (consolidated view)

Embedded per phase above. Summarized here for your quick-scan:

**This session (Thu night):**
- Review plan.md and backlog.md when they land in your inbox
- Confirm Durran's 45-day export location
- Answer: Columbia ADF emails — provide or confirm intentional "off for now"

**Fri Apr 25:**
- Send Durran the testing package (captain drafts, operator approves + sends)
- Approve any user-visible copy changes
- Send Cox the VDP-first note when Cox returns

**Sat Apr 26:**
- Be available for Saturday Night Checkpoint
- Review status report
- Authorize full-scope or reduced-scope launch

**Sun Apr 27:**
- Final go/no-go at Sunday night
- Present for Monday 9 AM ET

**Week 2+:**
- Provide FTC technical document when ready
- Confirm competitive intel target list per store
- Approve daily briefing template + launch

**Phase 5:**
- Authorize security audit scope
- Final v2.2 sign-off

---

## 10. Definition of Done Checklist (for close-out)

v2.2 is closed when:

- [ ] Every feature in `evidence/QA-S0/feature-map.md` verified working OR explicitly deferred with written rationale
- [ ] All 4 critical contract items live at all 5 stores (with documented Columbia exceptions if any)
- [ ] Service campaigns live at Serra Honda
- [ ] Widget all 4 actions live at all 5 stores
- [ ] No P0 or P1 security issue open from the prior audit list
- [ ] Health monitoring + daily eval operational
- [ ] Lago billing integrated OR explicitly deferred to v2.3 with operator sign-off
- [ ] FTC scanner + competitive intel shipped OR explicitly deferred
- [ ] Final verification sweep clean
- [ ] Operator signs off

---

## 11. Changelog

- **2026-04-24 (evening)** — Initial plan written. Phase 1 sprint dispatched. Operator review pending.
