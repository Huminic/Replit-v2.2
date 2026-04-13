# PE-INTEGRATIONS-03 — Pre-Execution Report

**Date:** 2026-04-07
**Sprint:** PE-INTEGRATIONS-03 — Integrations — Round 3
**Branch:** wave-pe3
**Scope:** server/routes/
**Depends On:** PE-SERVICE-CAMPAIGNS-03
**UI Permissions:** null (observation only)

---

## Objective

Evaluate comms integrations: TextMagic, VAPI, Tavus, Resend — provider-side activity vs Nexxus-side truth. Prove or reject: SMS send/receive, voice call flow, video sessions, email delivery, and transcript arrival.

## Acceptance Criteria

| AC | Description |
|----|-------------|
| AC1 | Function map for integration surfaces + Nexxus-visible outcomes |
| AC2 | TextMagic send/receive vs TeamBox reality evaluated with evidence |
| AC3 | VAPI transcript arrival/parsing evaluated with evidence |
| AC4 | Tavus popup/session evaluated to approved boundary with evidence |
| AC5 | Resend email via log + downstream UI evaluated with evidence |
| AC6 | Provider-only passes logged as false-pass with evidence |
| AC7 | Every flow has evidence, commentary (8 questions), and result status |

## Declared Files

- evidence/PE-INTEGRATIONS-03/pre-execution-report.md
- evidence/PE-INTEGRATIONS-03/section-function-map.md
- evidence/PE-INTEGRATIONS-03/use-case-inventory.md
- evidence/PE-INTEGRATIONS-03/acceptance-matrix.md
- evidence/PE-INTEGRATIONS-03/evidence-index.md
- evidence/PE-INTEGRATIONS-03/bug-log.md
- evidence/PE-INTEGRATIONS-03/post-sprint-report.md
- evidence/PE-INTEGRATIONS-03/enforcer-checklist.txt
- evidence/PE-INTEGRATIONS-03/cross-sign.md
- evidence/PE-INTEGRATIONS-03/workflow-audit.log

No application source files modified (observation-only eval).

## Test Plan

| Flow | What to Test | Third-Party Systems | Classification |
|------|-------------|---------------------|----------------|
| F1 | TextMagic SMS send — trigger, verify delivery, verify TeamBox | TextMagic | IRREVERSIBLE |
| F2 | TextMagic receive — send inbound, verify webhook, verify TeamBox | TextMagic webhook | IRREVERSIBLE |
| F3 | VAPI voice call — trigger/receive, verify transcript | VAPI | IRREVERSIBLE |
| F4 | VAPI transcript — verify arrives in Nexxus, parsed correctly | VAPI webhook | SAFE |
| F5 | VAPI lead creation — verify VIN Solutions lead from call | VIN Solutions | IRREVERSIBLE |
| F6 | Tavus video — initiate session, verify popup/UI | Tavus | IRREVERSIBLE |
| F7 | Resend email — trigger send, verify delivery log | Resend | IRREVERSIBLE |
| F8 | Resend downstream — verify email appears in Nexxus UI | None | SAFE |
| F9 | False-pass detection — verify Nexxus-side truth for each provider | All | SAFE |

**Playwright commands:**
- `npx playwright test tests/pe-integrations-03/ --headed` (full suite)
- Each flow executed individually via MCP Playwright (one at a time per master prompt)

**Note:** F1-F3, F5-F7 are ALL IRREVERSIBLE — each requires explicit operator approval before execution.

## Entry Gates

| Gate | Description | Status |
|------|-------------|--------|
| A1-A4 | Standard entry gates | READY / THIS FILE |
| A5 | Irreversible actions | REQUIRES OPERATOR APPROVAL per provider |
| A6-A9 | Worktree, ghost | PENDING |

## Exit Gates (Ghost Checks)

| Gate | Description |
|------|-------------|
| B1-B10 | Standard eval exit gates |

## What "Real E2E Test" Means for This Sprint

Provider success alone is NOT enough. "Real" means:
- TextMagic "delivered" AND TeamBox shows the message
- VAPI "call completed" AND transcript in Nexxus AND lead in VIN Solutions
- Tavus "session started" AND Nexxus UI shows session
- Resend "sent" AND email log + downstream UI reflect it

A provider-only pass (provider succeeds, Nexxus doesn't reflect) = FALSE PASS.

**Key question:** When a provider reports success, does Nexxus materialize that success in its UI?

## Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| TextMagic rate limit | Can't test SMS | Space out tests |
| VAPI call fails (no answer) | Can't verify transcript | Use operator phone, answer |
| Tavus session cost | Unnecessary spend | Test to approved boundary only |
| Resend delivery delay | False timeout | Allow 60s, check dashboard |
| Webhook doesn't fire | Nexxus never gets data | Check webhook URLs first |
| Provider succeeds, Nexxus silent | False pass | This IS what we're testing |

## Whole-Product Fit

Proves whether communications actually land in Nexxus in a trustworthy way. Every other sprint's data integrity depends on these integrations.
