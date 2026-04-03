# LV-001a Pre-Execution Report

**Sprint:** LV-001a — MVP Launch Validation (15 Core Flows)
**Date:** 2026-04-03
**Author:** Orchestrator
**Depends On:** I-002 (committed: f0b7abf)

## Objective

Validate all 15 core MVP flows end-to-end on dev, remediate failures, then validate on production. 18 launch-blocking user stories mapped into 15 testable flows across Sales, Service, and Shared System categories.

## Declared Files

- `tests/e2e/` — Test file updates/additions for flow coverage
- `server/routes/webhooks.ts` — I-229 email template fix, I-230 no-transcript guard
- `evidence/LV-001a/` — Sprint artifacts
- `issues.md` — New issues from validation

## UI Changes

NONE. No UI permissions.

## Acceptance Criteria

### Sales Flows
| AC | Flow | Stories |
|----|------|---------|
| AC1 | SF-1: Web Chat -> VIN Lead | US-001 |
| AC2 | SF-2: Tavus Video -> VIN Lead | US-002 |
| AC3 | SF-3: Form -> SMS -> Two-Way Conversation | US-003 |
| AC4 | SF-4: VAPI Inbound -> VIN Lead | US-004 |
| AC5 | SF-5: Walk-In -> Auto-Followup | US-005 |
| AC6 | SF-6: Pipeline Review (metric drill-down) | US-007 |

### Service Flows
| AC | Flow | Stories |
|----|------|---------|
| AC7 | SV-1: Campaign -> SMS -> Appointment | US-009, US-010 |
| AC8 | SV-2: Widget Service Scheduling | US-013 |
| AC9 | SV-3: Opt-Out Compliance | US-012 |

### Shared System Flows
| AC | Flow | Stories |
|----|------|---------|
| AC10 | SH-1: TeamBox Lifecycle | US-017, US-018, US-019, US-020, US-021 |
| AC11 | SH-2: VIN Solutions Integration | Cross-cutting |
| AC12 | SH-3: Kill Switch + Channel Pause | US-027, US-028 |
| AC13 | SH-4: Auth + RBAC (6 roles) | US-023 + all |
| AC14 | SH-5: Email Notifications (template + VIN status) | Cross-cutting |
| AC15 | All 15 flows pass on live.huminic.app | All |

## Test Plan

Each flow validated through:
1. Trigger (initiating event)
2. Transport (SMS/voice/video/email)
3. Agent behavior (AI response)
4. Webhook/event processing
5. Data persistence (DB records)
6. TeamBox visibility
7. Human takeover (if applicable)
8. External system effect (VIN, etc.)

A flow is PASS only if ALL steps succeed.

## Entry Gates

| Gate | Status | Evidence |
|------|--------|----------|
| A1: I-002 committed | PASS | f0b7abf |
| A2: Container healthy | PASS | I-004 exit B1 |
| A3: Rollback tested | PASS | I-003 exit B1 |
| A4: Staging DB isolated | PASS | 7 orgs, 15 users, 50 agents |

## Exit Gates

| Gate | What Ghost Checks |
|------|-------------------|
| B1 | All 15 flow ACs pass on dev (or failures explicitly accepted) |
| B2 | All 15 flow ACs pass on live (or failures explicitly accepted) |
| B3 | Failures logged in issues.md with fix plan |
| B4 | Operator approves launch readiness |

## Execution Steps

| Step | Action | Type | Ghost Gate? |
|------|--------|------|-------------|
| 0 | Pre-flight | code | No |
| 1 | Failure categorization | code | No |
| 2 | GHOST GATE: categorization complete | infrastructure | Yes |
| 3 | Dev remediation | code | No |
| 4 | GHOST GATE: remediation verified | infrastructure | Yes |
| 5 | Autonomous validation on dev | code | No |
| 6 | GHOST GATE: flows pass or accepted | infrastructure | Yes |
| 7 | Autonomous remediation loop | code | No |
| 8 | GHOST GATE: Go/No-Go for dev | infrastructure | Yes |
| 9 | Push to live | infrastructure | No |
| 10 | Non-autonomous live validation | infrastructure | No |
| 11 | GHOST GATE: live flows verified | infrastructure | Yes |
| 12 | GHOST FINAL VERIFY | infrastructure | Exit gate |

## Known Issues to Fix During Sprint

| Issue | Blocks | Effort |
|-------|--------|--------|
| I-229 | AC14 (email template) | M |
| I-230 | AC14 (no-transcript guard) | M |
| 36 test failures | Unknown until Step 1 | Unknown |

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Test failures are real product bugs | HIGH | Categorize first, fix only MVP-blocking |
| IRREVERSIBLE actions in live validation | HIGH | Operator approves each |
| Remediation expands scope | MEDIUM | "Does this support a core MVP flow?" |

## Scope Control

ONLY operate on the 15 core MVP flows. NOT allowed to expand into post-MVP features, non-critical features, or architecture redesign.
