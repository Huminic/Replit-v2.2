# VFY-05 Smoke Test — Domain 06 Departments

**Result: SMOKE FAIL**

**Date:** 2026-03-28
**Spec:** `tests/e2e/domain-06-departments.spec.ts`
**Runner:** `npx playwright test --reporter=list`
**Duration:** 40.0s

---

## Summary

| Total | Passed | Failed |
|-------|--------|--------|
| 8     | 7      | 1      |

## Passed (7/8)

| # | Test | Time |
|---|------|------|
| 6.1 | Sales page loads with KPIs | 4.3s |
| 6.2 | Service page loads with KPIs and campaigns | 4.1s |
| 6.3 | Marketing page loads with KPIs | 4.0s |
| 6.4 | Management page loads with executive overview | 4.2s |
| 6.6 | Sales sidebar does NOT show Billing | 3.2s |
| 6.7 | Sales submenu shows 3 agents below separator | 6.1s |
| 6.8 | Service submenu shows at least 1 agent | 6.2s |

## Failed (1/8)

### 6.5 Demand Score tile visible on Management (4.2s)

**Error:** `expect(received).toBeGreaterThan(expected)`
- Expected: > 0
- Received: 0

**Location:** `domain-06-departments.spec.ts:82:19`

**Root cause:** The test searches for a "Demand Score" tile on the Management page. The locator returned 0 matching elements. Either the tile does not exist in the current UI, its label has changed, or it is conditionally rendered and was not present during the test run.

**Artifacts:**
- Screenshot: `test-results/domain-06-departments-Doma-ad364--tile-visible-on-Management-browser/test-failed-1.png`
- Trace: `test-results/domain-06-departments-Doma-ad364--tile-visible-on-Management-browser/trace.zip`

---

## Verdict

**SMOKE FAIL** — 7/8 passed, 1 failure on test 6.5 (Demand Score tile not found on Management page).
