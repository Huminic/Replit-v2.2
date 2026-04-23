# E-013 Issue-to-Sprint Mapping
**Date:** 2026-03-26

## Pre-existing Issues (E-012)

| Issue | Description | Sprint | Status |
|---|---|---|---|
| I-102 | Photo Studio FE broken | SEC-05 | REMEDIATING |
| I-103 | 8 always-true assertions in s11 | **RESOLVED** | s11 archived to deprecated/ |
| I-104 | 103 stub tests in observability/ | **RESOLVED** | Archived to observability/deprecated/ |
| I-105 | FlexPrice billing not configured | SEC-06 | REMEDIATING — launch blocker |
| I-106 | Campaigns zero messages sent | SEC-04 | INVESTIGATING — needs operator input on rate limit |
| I-107 | SMS 63% failure rate | SEC-04 | INVESTIGATING — same root cause as I-106 |
| I-109 | Uncommitted git changes | E-013 | See AC13 — staged S-11 work + E-013 governance edits |
| I-110 | Hardcoded test URLs | **RESOLVED** | Fixed — all 9 files use process.env.BASE_URL fallback |
| I-111 | 7 routes with zero test coverage | SEC-07 | Routes: /my-work (hidden), /usage, /settings/billing/*, /settings/org-wizard, /profile/preferences |

## E-013 Issues (new)

| Issue | Description | Sprint | Status |
|---|---|---|---|
| I-112 | Sales Recent Activity hardcoded | SEC-03 | REMEDIATING |
| I-113 | Service/Marketing metric trends hardcoded zero | SEC-04, SEC-05 | REMEDIATING |
| I-114 | Sales Conversion Rate change bug | SEC-03 | REMEDIATING |
| I-115 | Sub-menu/tab mismatches (3 sections) | SEC-04, SEC-05, SEC-06 | REMEDIATING |
| I-116 | Manage User Chats placeholder | SEC-06 | REMEDIATING |
| I-117 | TopBar "Take a Tour" label | SEC-07 | REMEDIATING |
| I-118 | TopBar Profile Billing link stale | SEC-07 | REMEDIATING |
| I-119 | Web Call behavior differs from manifest | SEC-08 | INVESTIGATING — needs operator clarification |
| I-120 | AI Config tile/sub-menu RBAC inconsistency | SEC-07 | REMEDIATING |

## Resolved in E-013 (no sprint needed)

| Issue | Resolution |
|---|---|
| I-103 | s11-demo-hotfix.spec.ts archived to tests/e2e/deprecated/ |
| I-104 | 7 observability .test.ts files archived to tests/observability/deprecated/ |
| I-110 | All 9 s*.spec.ts files updated: `const BASE = process.env.BASE_URL \|\| "https://dev.huminicdev.com"` |
