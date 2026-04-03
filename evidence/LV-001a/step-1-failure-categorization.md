# LV-001a Step 1: Failure Categorization

**Date:** 2026-04-03
**Sprint:** LV-001a
**Step:** 1 of 12

## Test Run

**Command:** `BASE_URL=https://dev.huminicdev.com npx playwright test tests/e2e/domain-*.spec.ts --reporter=list`
**Result:** 45 passed, 36 failed, 1 skipped, 20 did-not-run (cascading)

## Categorization

| Category | Count | MVP-Blocking | Root Cause |
|----------|-------|-------------|------------|
| TEST_DATA | 30 | 30 | 2 test accounts not seeded: serra_honda@huminic.ai (27 failures + 20 cascade), duanekwells@gmail.com (2 failures), voice-config endpoints 404 (2), agent menu items missing (2) |
| PRODUCT_BUG | 4 | 4 | Executive sidebar missing Manage (1.8), /management redirects to / (6.4, 6.5), widget public endpoint broken (11.14) |
| TEST_ISSUE | 1 | 1 | x-content-type-options duplicated nosniff,nosniff (12.2) |
| ENVIRONMENT | 0 | 0 | — |
| INTEGRATION | 0 | 0 | — |
| NOT_MVP | 0 | 0 | — |

## Detailed Failure List

### TEST_DATA (30 failures)

**serra_honda@huminic.ai 401 (27 + 20 cascade):**
- domain-02: 2.1, 2.2, 2.3, 2.4, 2.5
- domain-03: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.9, 3.10, 3.11
- domain-04: 4.1 (beforeAll fails, 10 tests cascade)
- domain-05: 5.1 (beforeAll fails, 10 tests cascade)
- domain-07: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
- domain-11: 11.6

**duanekwells@gmail.com 401 (2):**
- domain-01: 1.10
- domain-08: 8.4

**Voice config 404 (2):**
- domain-11: 11.11, 11.12

**Agent menu items missing (2):**
- domain-06: 6.7, 6.8

### PRODUCT_BUG (4 failures)

- 1.8: Executive sidebar shows no "Manage" link
- 6.4: /management redirects to / (route missing or guard)
- 6.5: Demand Score tile not found (depends on 6.4)
- 11.14: /api/widgets/public/{widgetCode} returns non-OK

### TEST_ISSUE (1 failure)

- 12.2: x-content-type-options = "nosniff, nosniff" (Caddy + Helmet both set it)

## MVP Flow Impact

| Flow | Blocked By | Category |
|------|-----------|----------|
| SF-1 Web Chat | serra_honda 401 | TEST_DATA |
| SF-2 Tavus Video | serra_honda 401, voice-config 404 | TEST_DATA |
| SF-4 VAPI Inbound | serra_honda 401 | TEST_DATA |
| SF-5 Walk-In | serra_honda 401 | TEST_DATA |
| SV-1 Campaign | serra_honda 401 | TEST_DATA |
| SH-1 TeamBox | duanekwells 401, executive sidebar | TEST_DATA + PRODUCT_BUG |
| SH-2 VIN Integration | serra_honda 401, management route | TEST_DATA + PRODUCT_BUG |
| SH-3 Kill Switch | serra_honda 401 | TEST_DATA |
| SH-4 Auth + RBAC | widget public endpoint | PRODUCT_BUG |
| SH-5 Email | header duplication | TEST_ISSUE |

## Remediation Plan (Step 3)

1. Seed missing test accounts on staging (clears 30/35)
2. Investigate 4 product bugs (executive sidebar, management route, widget endpoint)
3. Fix or accept security header duplication (1 test)
