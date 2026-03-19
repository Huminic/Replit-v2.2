# Loop Prep: REM-3

**Date:** 2026-03-19
**T-4 Baseline:** browser 30/56, API ~27/40, Comms 10/12, Catalog 5/5

---

## 1. Issue-to-Domain Assignment

| Issue | Domain | Sub-Sprint | Summary |
|-------|--------|------------|---------|
| I-065 | AU | REM-3-AU | Super Admin seeded to Serra Honda, should be Huminic |
| I-066 | AU | REM-3-AU | Org switch goes to /login — token not stored before reload |
| I-067 | AU | REM-3-AU | Auth rate limiter 5/15min too aggressive — increase |
| I-061 | FE | REM-3-FE | Tour click-through bypass — only X should dismiss |
| I-062 | FE | REM-3-FE | Sidebar popout links not navigating |
| I-064 | FE | REM-3-FE | Lead popup modal — show contact list + Show Contact link |
| I-063 | DT | REM-3-DT | Dashboard metrics verification — query vs UI |
| TI-008 | TI | REM-3-TI | Test selectors don't match current UI |
| TI-009 | TI | REM-3-TI | Conversation creation API fails in tests |

## 2. Declared Files

### REM-3-AU
- server/routes/auth.ts (rate limiter config)
- client/src/components/layout/TopBar.tsx (org switch handler)
- client/src/contexts/AuthContext.tsx (switch token storage)
- server/seed.ts (Super Admin org assignment — if DB update needed)

### REM-3-FE
- client/src/components/ProductTour.tsx (tour dismiss)
- client/src/components/layout/SubMenuManager.tsx (sidebar links)
- client/src/pages/main.tsx (lead modal)
- client/src/pages/sales.tsx (lead modal)
- client/src/pages/insights.tsx (lead modal)

### REM-3-DT
- evidence/REM-3/ (verification results only — no code changes)

### REM-3-TI
- tests/e2e/domain-02-dashboard.spec.ts
- tests/e2e/domain-03-chat.spec.ts
- tests/e2e/domain-06-departments.spec.ts
- tests/e2e/domain-07-insights.spec.ts

## 3. Dependency Order

| Order | Sub-Sprint | Why |
|-------|------------|-----|
| 1 | REM-3-AU | Rate limiter fix unblocks test execution; org switch fix needed before FE testing |
| 2 | REM-3-FE | Frontend fixes (user approved) |
| 3 | REM-3-DT | Data verification (research only) |
| 4 | REM-3-TI | Test fixes last |

## 4. Prerequisites

| Prerequisite | Status |
|-------------|--------|
| User approval for FE changes | **APPROVED** (I-061, I-062, I-064) |
| Super Admin DB update | Verify via query, fix in seed or direct DB |
