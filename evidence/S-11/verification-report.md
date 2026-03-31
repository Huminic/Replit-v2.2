# S-11 Verification Report — RBAC Enforcement

**Date:** 2026-03-30
**Sprint:** S-11 — RBAC Enforcement — Sidebar Visibility + API Authorization

## Root Cause

All 4 issues (I-178, I-179, I-180, I-181) share the same root cause:

The test auth helper (`tests/e2e/helpers/auth.ts`, lines 44-68) mapped ALL role-specific
test accounts (executive, sales, service, marketing) to `serra_honda@huminic.ai`, which is
an **org_admin** account. Every test claiming to verify role-specific behavior was actually
testing org_admin permissions.

The app code was already correct:
- `canAccessSystem()` in rbac.ts correctly excludes sales/service/marketing/executive
- `canAccessManagement()` correctly restricts to super_admin only
- `requireRole(3)` on POST /api/agents correctly blocks sales (level 4)
- All billing pages have `canAccessSystem()` guards

Source: `evidence/devils-advocate-2026-03-29.md` section "1. RBAC Testing Is Fundamentally Broken"

## Changes Made

### 1. tests/e2e/helpers/auth.ts
- `executive` → `executive_staff@huminic.ai` (role: executive, org: Huminic)
- `sales` → `sales_staff@huminic.ai` (role: sales, org: Huminic)
- `service` → `service_staff@huminic.ai` (role: service, org: Huminic)
- `marketing` → `marketing_staff@huminic.ai` (role: marketing, org: Huminic)

### 2. server/seed.ts
- Added `service_staff@huminic.ai` (role: service) — was missing from Huminic seed users

## Issue → Fix Mapping

| Issue | Fix |
|-------|-----|
| I-178 | sales alias now uses actual sales account → canAccessSystem('sales') = false → System hidden |
| I-179 | executive alias now uses actual executive account → tests will correctly see executive behavior |
| I-180 | sales alias now uses actual sales account (level 4) → requireRole(3) returns 403 |
| I-181 | sales/marketing/service aliases all use actual role accounts → canAccessSystem() = false → billing redirect |

## Verification

- TypeScript compilation: PASS (no errors)
- Files touched: 2 (tests/e2e/helpers/auth.ts, server/seed.ts)
- No app code modified — root cause was test infrastructure
- No governance files altered
- No unrelated changes
