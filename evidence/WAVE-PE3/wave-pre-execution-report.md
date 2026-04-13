# WAVE-PE3 — Pre-Execution Report

**Date:** 2026-04-07
**Wave:** WAVE-PE3 — Production Eval Round 3
**Branch:** wave-pe3 (created from sniper-launch @ 5da59b3)
**Execution Mode:** Autonomous

---

## Purpose

Production Eval Round 3 — real E2E workflow verification with real third-party data flows. This wave evaluates whether Nexxus Connect v2.2 is ready for operator handoff by testing every critical workflow against actual provider systems (TextMagic, VAPI, Tavus, Resend, VIN Solutions).

This is NOT UI navigation testing. Every eval sprint verifies that data flows end-to-end: from trigger to provider to Nexxus UI to operator action.

## Operating Protocol

All sprints follow `production-evals/claude-code-master-prompt.md` EXACTLY:
- One workflow at a time
- 8 commentary questions per flow
- Evidence + screenshots for every flow
- False-pass detection: "Does the page just render, or does the workflow actually work?"
- Playwright is the witness, not the judge

## Sprint Execution Sequence

| Order | Sprint ID | Name | Depends On | Scope |
|-------|-----------|------|------------|-------|
| 1 | PE-AI-CHAT-03 | AI Chat / Main Dashboard | SNP-001 | client/src/pages/main.tsx |
| 2 | PE-TEAMBOX-03 | TeamBox | PE-AI-CHAT-03 | client/src/pages/teambox.tsx |
| 3 | PE-SALES-03 | Sales Dashboard | PE-TEAMBOX-03 | client/src/pages/sales.tsx |
| 4 | PE-INSIGHTS-03 | Insights | PE-SALES-03 | client/src/pages/insights.tsx |
| 5 | PE-SERVICE-CAMPAIGNS-03 | Service Campaigns | PE-INSIGHTS-03 | client/src/pages/service.tsx |
| 6 | PE-INTEGRATIONS-03 | Integrations | PE-SERVICE-CAMPAIGNS-03 | server/routes/ |
| 7 | PE-SETTINGS-03 | Settings | PE-INTEGRATIONS-03 | client/src/pages/settings.tsx |

## Five Eval Dimensions

| Dimension | What It Measures |
|-----------|-----------------|
| Data Accuracy | Are metrics, counts, and records truthful? Do drill-downs match summaries? |
| UI Behavior | Does the UI respond correctly to user actions? Scroll, filter, navigate, render? |
| Cross-Screen Workflow Integrity | Does data flow correctly across pages? (e.g., SMS sent on Sales -> appears in TeamBox) |
| Operator Usability | Can a real operator complete their daily tasks? Is the UX functional, not just present? |
| Error Handling | What happens when things go wrong? Graceful degradation or silent failure? |

## Evals Declared

1. **Master Prompt:** production-evals/claude-code-master-prompt.md
2. **Sprint Definitions:** production-evals/production-evals.json (v1.1)
3. **Bug Taxonomy:** Defined in master prompt (severity: critical/high/medium/low; type: data/ui/workflow/integration/false-pass)
4. **Evidence Rubric:** 8 commentary questions, before/after screenshots, provider-side verification
5. **Business Context:** evidence/SNP-001/business-context.md

## Definition of Done — Per Sprint

A sprint is done when:
1. All use cases in the use-case inventory have been evaluated (one flow at a time)
2. Every flow has: evidence (screenshots), 8-question commentary, result status
3. All bugs logged with severity, type, and false-pass classification
4. Remediation loop completed for any authorized fixes
5. Post-sprint report written with AC results table, confidence assessment
6. Enforcer checklist passed
7. Cross-sign completed (different role from implementer)
8. Ghost Exit Gate: EXIT GATE: CLEARED

## Definition of Done — Wave

The wave is done when:
1. All 7 PE sprints completed with Ghost Exit Gates cleared
2. All discovered bugs fixed via sniper sprints and retested
3. Real E2E workflow tests pass for: SMS send/receive, VAPI call flow, campaign lifecycle, widget flows, VIN lead sync
4. Production evals pass per master prompt methodology
5. No critical or high-severity bugs remain open
6. Operator approves merge to main

## Wave Entry Criteria

| # | Criterion | Status |
|---|-----------|--------|
| 1 | SNP-001 committed (15 bug fixes deployed) | DONE (5da59b3) |
| 2 | Wave branch created from sniper-launch | DONE (wave-pe3) |
| 3 | CommGate enabled on dev (OUTBOUND_LIVE_ENABLED=true) | TO VERIFY |
| 4 | Wave pre-execution report approved by operator | PENDING |
| 5 | Dev server running at https://dev.huminicdev.com | TO VERIFY |
| 6 | All .env variables present | TO VERIFY |
| 7 | Business context document available | DONE (evidence/SNP-001/business-context.md) |

## Wave Exit Criteria

| # | Criterion |
|---|-----------|
| 1 | All 7 PE sprints: EXIT GATE: CLEARED |
| 2 | All sniper sprints: committed and retested |
| 3 | E2E verified: SMS send (TextMagic) -> receive -> TeamBox thread |
| 4 | E2E verified: VAPI call -> transcript -> VIN lead -> warehouse |
| 5 | E2E verified: Campaign CSV -> execute -> outbound -> reply -> TeamBox |
| 6 | E2E verified: Widget flows (voice/video/chat/form) |
| 7 | E2E verified: VIN sync -> warehouse leads -> UI display |
| 8 | No critical/high bugs open |
| 9 | Confidence assessment: all dimensions >= Accepted |
| 10 | Operator approves merge to main |

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Third-party API rate limits | Blocked eval flows | Space out API calls, use dev accounts |
| TextMagic delivery delays | False timeout failures | Allow 60s delivery window, verify via provider dashboard |
| VAPI call failures | Can't verify voice flow | Check VAPI dashboard, verify assistant config before eval |
| CommGate blocking outbound | No real sends possible | Verify OUTBOUND_LIVE_ENABLED before starting |
| Context loss across 7 sprints | Drift from methodology | session-output.md after every 3 sub-agent returns |
| False passes masking real bugs | Operator gets broken software | Strict false-pass detection per master prompt |
| Sniper loop explosion | Too many bugs to fix | Triage by severity, fix critical/high only, log medium/low to backlog |

## Sniper Loop Protocol

When an eval discovers bugs:
1. Log bug immediately (severity, type, false-pass class)
2. Create SNP-PE3-{section}-{N} sniper sprint on wave-pe3 branch
3. Fix via sub-agent -> jest test -> Playwright retest -> ghost gate
4. Re-run the eval flows that found the bugs
5. Loop until flows pass clean
6. Resume eval sprint

## Business Context Summary

- **Serra Honda (dealer 21043):** Primary test org
- **Caroline:** Sales comms agent (voice/video/SMS/chat, phone: +18338935694)
- **Nancy Gaston:** Service comms agent (SMS/chat, phone: +18339785374)
- **4 Widgets:** Voice, Video, Webchat, Form
- **5 Orgs:** Serra Honda, Serra Nissan, Tony Serra Ford, Hyundai of Columbia, Ford of Columbia
- **VIN Sync:** 6,245 warehouse leads across all orgs
- **Dev URL:** https://dev.huminicdev.com
