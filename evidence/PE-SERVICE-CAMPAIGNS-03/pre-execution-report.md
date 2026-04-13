# PE-SERVICE-CAMPAIGNS-03 — Pre-Execution Report

**Date:** 2026-04-07
**Sprint:** PE-SERVICE-CAMPAIGNS-03 — Service Campaigns — Round 3
**Branch:** wave-pe3
**Scope:** client/src/pages/service.tsx
**Depends On:** PE-INSIGHTS-03
**UI Permissions:** null (observation only)

---

## Objective

Evaluate Service Campaigns for the complete operator workflow: CSV upload, channel execution, reply routing, and TeamBox continuity. Most complex eval — involves real outbound messaging (IRREVERSIBLE).

## Acceptance Criteria

| AC | Description |
|----|-------------|
| AC1 | Function map for setup/CSV/execution/TeamBox continuity written in interface terms |
| AC2 | CSV upload flow evaluated with evidence and commentary |
| AC3 | Single/multi-channel behavior evaluated with evidence and commentary |
| AC4 | Outbound execution with in-app + provider evidence evaluated |
| AC5 | Inbound response routing to TeamBox evaluated with evidence |
| AC6 | Operator/agent response turn evaluated with evidence |
| AC7 | Every flow has evidence, commentary (8 questions), and result status |
| AC8 | Bugs logged with severity and false-pass classification |

## Declared Files

Observation targets (read-only, not modified):
- client/src/pages/service.tsx

Evidence artifacts (created):
- evidence/PE-SERVICE-CAMPAIGNS-03/pre-execution-report.md
- evidence/PE-SERVICE-CAMPAIGNS-03/section-function-map.md
- evidence/PE-SERVICE-CAMPAIGNS-03/use-case-inventory.md
- evidence/PE-SERVICE-CAMPAIGNS-03/acceptance-matrix.md
- evidence/PE-SERVICE-CAMPAIGNS-03/evidence-index.md
- evidence/PE-SERVICE-CAMPAIGNS-03/bug-log.md
- evidence/PE-SERVICE-CAMPAIGNS-03/post-sprint-report.md
- evidence/PE-SERVICE-CAMPAIGNS-03/enforcer-checklist.txt
- evidence/PE-SERVICE-CAMPAIGNS-03/cross-sign-orchestrator.md
- evidence/PE-SERVICE-CAMPAIGNS-03/workflow-audit.log

## Test Plan

| Flow | What to Test | Third-Party Systems | Classification |
|------|-------------|---------------------|----------------|
| F1 | Navigate to Service, verify campaign list loads | None | SAFE |
| F2 | View existing campaigns — table data, status indicators | None | SAFE |
| F3 | Create new campaign — fill form, verify draft saves | None (DB write) | GATED |
| F4 | CSV upload — upload test CSV, verify recipient parsing | None | GATED |
| F5 | Channel selection — SMS single/multi-channel options | None | SAFE |
| F6 | Campaign execution — send to test recipient | TextMagic | IRREVERSIBLE |
| F7 | Provider verification — check TextMagic for delivery | TextMagic (read) | SAFE |
| F8 | Inbound response — recipient replies, verify webhook | TextMagic webhook | IRREVERSIBLE |
| F9 | TeamBox continuity — verify reply appears in TeamBox | None | SAFE |
| F10 | Operator response — reply from TeamBox, verify delivery | TextMagic | IRREVERSIBLE |

**Playwright commands:**
- `npx playwright test tests/pe-service-campaigns-03/ --headed` (full suite)
- Each flow executed individually via MCP Playwright (one at a time per master prompt)

**Comms Boundary:** F6, F8, F10 are IRREVERSIBLE — require explicit operator approval. Campaign execution uses operator's phone as test recipient. Nancy Gaston's number (+18339785374) is the sender.

## Entry Gates

| Gate | Description | Status |
|------|-------------|--------|
| A1-A3 | Standard entry gates | READY |
| A4 | Pre-exec with approved comms boundary | THIS FILE |
| A5 | Irreversible actions approved | REQUIRES OPERATOR APPROVAL |
| A6-A9 | Worktree, ghost | PENDING |

## Exit Gates (Ghost Checks)

| Gate | Description |
|------|-------------|
| B1-B10 | Standard eval exit gates |

## What "Real E2E Test" Means for This Sprint

Signature production workflow. "Real" means:
- Actually create a campaign with a test CSV
- Actually send SMS via TextMagic through Nancy Gaston's number
- Actually receive a reply (operator sends from personal phone)
- Actually verify the reply appears in TeamBox
- Actually reply from TeamBox and verify delivery

**Key question:** Can an operator complete the full campaign lifecycle within Nexxus — start to finish?

## Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| SMS sends to wrong number | Real customer gets test message | Operator phone ONLY, verify before send |
| Campaign execution fails silently | Looks sent but nothing happened | Verify via TextMagic dashboard |
| Reply webhook doesn't fire | Inbound breaks | Check webhook config before testing |
| TeamBox doesn't show campaign thread | Continuity broken | Critical bug if found |
| CSV parsing fails | Can't create campaign | Test with minimal 1-row CSV first |
| CommGate blocks sends | Can't test real flow | Verify OUTBOUND_LIVE_ENABLED=true |

## Whole-Product Fit

Signature production workflow. A false pass here would be highly damaging — can look operational while being wrong in continuity or messaging truth.
