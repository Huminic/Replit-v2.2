# Acceptance Matrix: PE-SERVICE-CAMPAIGNS-01

**Date:** 2026-04-06

This matrix maps acceptance criteria to use cases and identifies known risks.

---

## Acceptance Criteria to Use Case Mapping

| AC-ID | Criterion | Use Cases | Test Approach | Risk |
|-------|-----------|-----------|---------------|------|
| AC1 | Section function map exists for campaign setup, CSV upload, execution, and TeamBox continuity | UC-01 | Document all sections, functions, API endpoints, data flows | LOW |
| AC2 | CSV upload flow evaluated for file acceptance, recipient interpretation, and feedback | UC-05 through UC-09 | Download template, upload valid CSV, upload with missing columns, verify recipient count and warnings | MEDIUM |
| AC3 | Single-channel and multi-channel behavior evaluated | UC-02, UC-03 | Create single-channel campaign, create multi-channel campaign, verify separate rows created | LOW |
| AC4 | Outbound execution evaluated with in-app and provider evidence | UC-10 through UC-13 | Dry run first, then live execution if approved. Observe progress badge, stop behavior, scheduling. | HIGH (IRREVERSIBLE) |
| AC5 | Inbound response routing to TeamBox evaluated for filter visibility and thread continuity | UC-16 through UC-18 | Check TeamBox for campaign-originated conversations, verify filter (known missing), check message content | HIGH (depends on live data) |
| AC6 | At least one operator/agent response turn evaluated for accuracy and continuity | UC-18 | Open campaign conversation in TeamBox, verify sent message matches template with resolved tokens | MEDIUM |
| AC7 | Every executed flow has evidence, commentary, and result status | ALL | Screenshot every flow, document findings, assign PASS/PARTIAL/FAIL | LOW |
| AC8 | Bugs logged with severity, type, and false-pass classification | ALL | Document all bugs found during evaluation with consistent format | LOW |

---

## Known Issues Before Evaluation

| Source | Issue | Relevant ACs |
|--------|-------|-------------|
| PE-TEAMBOX-01 BUG | No filter in TeamBox for service campaigns — cannot filter conversations by campaign | AC5 |
| Code analysis | CSV row parser uses simple comma split (no quoted-field support) despite header parser having quotes support | AC2 |
| Code analysis | Multi-channel creates separate campaigns (one per channel) rather than a single multi-channel campaign | AC3 |
| Code analysis | Bulk CSV upload (header button) sets campaignId to 'bulk' — unclear behavior | AC2 |

---

## Risk Assessment

| Risk Level | ACs | Notes |
|------------|-----|-------|
| HIGH | AC4, AC5 | Live execution is IRREVERSIBLE; TeamBox continuity depends on existing campaign data |
| MEDIUM | AC2, AC6 | CSV parsing edge cases; message accuracy depends on template resolution |
| LOW | AC1, AC3, AC7, AC8 | Standard documentation and UI verification |

---

## Action Boundary Review

| Action | Classification | Approval Required |
|--------|---------------|-------------------|
| Navigate Service page | SAFE | No |
| Create campaign (test) | GATED | Sprint in_progress |
| Upload CSV | GATED | Sprint in_progress |
| Dry run execution | GATED | Sprint in_progress |
| Live execution | IRREVERSIBLE | Explicit operator approval |
| View TeamBox conversations | SAFE | No |
| Toggle kill switch | GATED | Sprint in_progress |
