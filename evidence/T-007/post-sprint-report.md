# T-007 Post-Sprint Report

**Sprint:** T-007 — Behavioral Gap Analysis
**Completed:** 2026-04-01T02:00:00Z
**Author:** Captain (orchestrator)

## EXIT GATE: CLEARED

## Acceptance Criteria

| AC | Description | Verdict |
|----|-------------|---------|
| AC1 | Every domain analyzed at behavior level | PASS — 11 domains + 4 cross-cutting |
| AC2 | Gaps categorized as deep/shallow/missing | PASS — per domain table |
| AC3 | Every real gap recorded in issues.md | PASS — I-203 through I-213 (11 issues) |
| AC4 | Top 15 gaps ranked by severity | PASS — see below |
| AC5 | Honest coverage statement | PASS — see below |
| AC6 | No app code modified, no drift | PASS |

## Method

Analyst subagent read all 19 agent spec files + 12 hand-authored domain spec files at the code level. Each test was categorized by what it actually asserts — not what its name implies.

## Domain Coverage Summary

| Domain | DEEP | SHALLOW | MISSING | Verdict |
|--------|------|---------|---------|---------|
| Auth | 35 | 8 | 4 | Strong — login/RBAC/tokens solid; timeout untested |
| Dashboard | 40 | 15 | 6 | Strong — structure/roles solid; error recovery missing |
| Chat | 25 | 12 | 7 | Moderate — CRUD solid; streaming delivery untested |
| TeamBox | 20 | 10 | 8 | Moderate — CRUD solid; takeover workflow untested |
| Sales | 15 | 8 | 6 | Moderate — API structure solid; pipeline progression missing |
| Service | 12 | 6 | 5 | Weak — UI structure only; campaign execution missing |
| Marketing | 10 | 5 | 5 | Weak — tab navigation only; studio/campaign workflows missing |
| Settings | 18 | 8 | 6 | Moderate — tiles/RBAC solid; persistence across reload missing |
| Billing | 12 | 10 | 5 | Weak — I-105 blocks most testing; page structure only |
| Insights | 14 | 8 | 5 | Moderate — zones/library solid; export/accuracy missing |
| Integrations | 16 | 12 | 4 | Moderate — webhook happy path solid; retry/failure recovery missing |

## Top 15 Real Gaps (by user-impact severity)

1. I-203 — Message streaming not tested at UI level (Chat)
2. I-204 — Session timeout warning untested (Auth)
3. I-205 — Campaign execution workflow untested (Service)
4. I-206 — Conversation takeover sequence untested (TeamBox)
5. I-207 — API error recovery / network failure untested (All)
6. I-208 — Settings persistence across reload untested (Settings)
7. I-209 — Webhook retry / failure recovery untested (Integrations)
8. I-210 — Sales pipeline stage progression untested (Sales)
9. I-211 — Concurrent write conflicts untested (All)
10. I-212 — Data value correctness untested (Dashboard, Sales)
11. I-213 — Widget cross-origin embed untested (Widgets)
12. I-105 — FlexPrice billing unconfigured (Billing) — pre-existing
13. I-194 — VAPI→VIN pipeline disabled (Integrations) — pre-existing
14. I-200 — No production environment (Infrastructure) — pre-existing
15. I-202 — TeamBox message display bug (TeamBox) — reported this session

## What Is Confidently Covered

- Auth: login, logout, token refresh, RBAC sidebar + API gates, org switching, password flows
- CRUD: conversations, tasks, agents, appointments, campaigns, widgets, users — create/read/update/delete with status codes
- RBAC enforcement: requireRole(N) across 22 endpoints × 8 roles = 171 checks
- Security: headers (CSP, HSTS), CORS (widget permissive, API restricted), cookie attributes, injection safety
- UI structure: all 12+ pages load per role, sidebar items visible/hidden correctly, tabs navigate
- Edge cases: boundary values, invalid inputs, non-UUID params, malformed payloads

## What Is At Risk in Real User Usage

- **Streaming/real-time**: Message delivery, typing indicators, live metric updates — no test
- **Multi-step workflows**: Campaign execution, deal progression, conversation takeover — no test
- **Error recovery**: Network timeout, API failure, stale cache — no test
- **Data correctness**: Metrics show correct numbers, not just correct schema — no test
- **Cross-session persistence**: Settings save, theme persist, session resume — no test
- **Concurrent operations**: Two users editing same record — no test
- **External integration failures**: Webhook retry, MCP timeout, partial write — no test

## Honest Assessment

~60% of test coverage is DEEP (would catch real bugs). ~25% is SHALLOW (checks existence/status but not behavior). ~15% is MISSING entirely (real user workflows with zero coverage). The test suite protects against regressions in auth, RBAC, and CRUD operations. It does NOT protect against workflow failures, data accuracy issues, or error recovery problems.

## Issues Added

I-203 through I-213 (11 behavioral gaps) added to issues.md under "Behavioral Gap Analysis (T-007)" section.

## Scope Compliance

Only issues.md and evidence/T-007/ modified. No application code touched. No drift.
