# Loop Prep: REM-2

**Date:** 2026-03-18
**T-3 Baseline:** 54/113 passed
**Primary Blocker:** loginViaUI — 28 browser tests can't get past login

---

## 1. Issue-to-Domain Assignment

| Issue | Domain | Sub-Sprint | Summary |
|-------|--------|------------|---------|
| TI-001 | TI | REM-2-TI | Fix loginViaUI — switch from form-based to API-based login in all browser tests |
| I-040 | BE | REM-2-BE | Campaign execution 500 on SMS/email |
| I-041 | BE | REM-2-BE | Kill switch toggle 500 |
| I-042 | BE | REM-2-BE | Tasks/appointments endpoints 500/404 |
| I-046 | BE | REM-2-BE | Entitlements endpoint 404 |
| I-043 | FE | REM-2-FE | Billing data not rendering (check billingCustomerId) |

## 2. Dependency Order

| Order | Sub-Sprint | Why |
|-------|------------|-----|
| 1 | REM-2-TI | Unblocks 28 tests — must run first to see real pass rate |
| 2 | REM-2-BE | Backend fixes |
| 3 | REM-2-FE | Billing investigation |

## 3. Declared Files

### REM-2-TI
- tests/e2e/domain-01-auth.spec.ts
- tests/e2e/domain-02-dashboard.spec.ts
- tests/e2e/domain-03-chat.spec.ts
- tests/e2e/domain-06-departments.spec.ts
- tests/e2e/domain-07-insights.spec.ts
- tests/e2e/domain-08-billing.spec.ts
- tests/e2e/domain-09-settings.spec.ts

### REM-2-BE
- server/outbound.ts
- server/routes/organizations.ts
- server/routes/tasks.ts
- server/routes/appointments.ts
- server/routes/billing.ts
- server/storage.ts

### REM-2-FE
- server/seed.ts (billingCustomerId investigation)

## 4. Prerequisites

| Prerequisite | Status |
|-------------|--------|
| User approval for FE changes | APPROVED (prior session) |
| loginViaUI root cause identified | YES — SPA navigation timing in headless Chromium |
| Fix approach | Use API login (POST /api/auth/login) then set cookie via page.context().addCookies() |
