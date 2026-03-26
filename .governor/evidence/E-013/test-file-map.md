# E-013 Test File Map
**Date:** 2026-03-26
**Purpose:** One authoritative .spec.ts per section. Old domain files deprecated.

## Authoritative Test Files (1 per section)

| Section | Test File | ACs Covered |
|---|---|---|
| S-0 Foundation | `tests/e2e/s0-foundation.spec.ts` | S-0.AC0 – S-0.AC14 |
| S-1 AI Chat | `tests/e2e/s1-ai-chat.spec.ts` | S-1.AC1 – S-1.AC17 |
| S-2 TeamBox | `tests/e2e/s2-teambox.spec.ts` | S-2.AC1 – S-2.AC21 |
| S-3 Sales | `tests/e2e/s3-sales.spec.ts` | S-3.AC1 – S-3.AC16 |
| S-4 Service | `tests/e2e/s4-service.spec.ts` | S-4.AC1 – S-4.AC18 |
| S-5 Marketing | `tests/e2e/s5-marketing.spec.ts` | S-5.AC1 – S-5.AC15 |
| S-6 Manage | `tests/e2e/s6-manage.spec.ts` | S-6.AC1 – S-6.AC14 |
| S-7 System/Profile/Top Icons | `tests/e2e/s7-system-profile.spec.ts` | S-7.AC1 – S-7.AC21 |
| S-8 Landing/Widgets | `tests/e2e/s8-landing-widgets.spec.ts` | S-8.AC1 – S-8.AC14 |
| S-9 Cross-Cutting | `tests/e2e/s9-cross-cutting.spec.ts` | S-9.AC1 – S-9.AC10 |
| S-10 Launch | `tests/e2e/s10-launch.spec.ts` | S-10.AC1 – S-10.AC11 |

## Supporting Test Files (keep)

| File | Purpose | Disposition |
|---|---|---|
| `tests/e2e/live-comms.spec.ts` | Real SMS/VAPI/Tavus integration tests | KEEP — referenced by S-9.AC9 |
| `tests/e2e/real-integrations.spec.ts` | Real integration tests (Tavus, VIN, etc.) | KEEP — referenced by S-9.AC10 |
| `tests/e2e/seed.spec.ts` | Database seeding verification | KEEP — infrastructure |

## Deprecated Test Files (superseded by s0-s10)

| File | Superseded By | Action |
|---|---|---|
| `tests/e2e/domain-01-auth.spec.ts` | S-0 + S-7 (RBAC) | ARCHIVE — move to tests/e2e/deprecated/ |
| `tests/e2e/domain-02-dashboard.spec.ts` | S-1 + S-3 (dashboard metrics) | ARCHIVE |
| `tests/e2e/domain-03-chat.spec.ts` | S-1 (AI Chat) | ARCHIVE |
| `tests/e2e/domain-04-campaigns.spec.ts` | S-4 (Service campaigns) | ARCHIVE |
| `tests/e2e/domain-05-teambox.spec.ts` | S-2 (TeamBox) | ARCHIVE |
| `tests/e2e/domain-06-departments.spec.ts` | S-3 + S-4 + S-5 (dept pages) | ARCHIVE |
| `tests/e2e/domain-07-insights.spec.ts` | S-3 + S-4 + S-5 + S-6 (insights) | ARCHIVE |
| `tests/e2e/domain-08-billing.spec.ts` | S-6 (billing in Manage) | ARCHIVE |
| `tests/e2e/domain-09-settings.spec.ts` | S-7 (System settings) | ARCHIVE |
| `tests/e2e/domain-10-tasks.spec.ts` | S-2 (tasks in TeamBox) | ARCHIVE |
| `tests/e2e/domain-11-integrations.spec.ts` | S-9 (cross-cutting) | ARCHIVE |
| `tests/e2e/domain-12-infrastructure.spec.ts` | S-10 (launch) | ARCHIVE |
| `tests/e2e/usability-audit.spec.ts` | S-9 (accessibility) | ARCHIVE |
| `tests/e2e/visual-components.spec.ts` | Individual section specs | ARCHIVE |
| `tests/e2e/e2e-flows.spec.ts` | S-9 (cross-cutting E2E) | ARCHIVE |
| `tests/e2e/deep-coverage.spec.ts` | Individual section specs | ARCHIVE |
| `tests/e2e/generated-coverage.spec.ts` | Individual section specs | ARCHIVE |

## Problem Files

| File | Issue | Action |
|---|---|---|
| `tests/e2e/s11-demo-hotfix.spec.ts` | 8 always-true assertions (I-103) | REWRITE — replace expect(true) with real assertions, or DELETE if S-11 scope absorbed |

## Notes
- All s0-s10 spec files currently use hardcoded `https://dev.huminicdev.com` as base URL (I-110). Should use env var.
- 103 stub tests in observability/ files (I-104) — need evaluation for delete vs implement.
- Deprecated files should be moved, not deleted, until s0-s10 specs have equivalent coverage.
