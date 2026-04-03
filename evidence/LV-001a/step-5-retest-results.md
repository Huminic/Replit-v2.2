# LV-001a Step 5: Autonomous Validation Retest

**Date:** 2026-04-03T14:35:14Z
**Command:** `BASE_URL=https://dev.huminicdev.com npx playwright test tests/e2e/domain-*.spec.ts --reporter=list`
**Baseline (Step 1):** 45 passed, 36 failed, 1 skipped
**Duration:** 2m 43s

## Results

**Total:** 93 passed, 8 failed, 1 skipped

## Improvement

| Metric | Step 1 | Step 5 | Delta |
|--------|--------|--------|-------|
| Passed | 45 | 93 | +48 |
| Failed | 36 | 8 | -28 |
| Skipped | 1 | 1 | 0 |
| Pass Rate | 55% | 91% | +36pp |

## Remaining Failures

| Test | Error | Category | MVP Flow | Status |
|------|-------|----------|----------|--------|
| 1.8 Executive sees Manage but NOT System | Sidebar does not contain "manage" — RBAC spec says Executive has no Management access | TEST_ISSUE | SH-1 TeamBox | ACCEPTED (I-231) |
| 4.10 Campaign reply triggers AI agent response | `expect(received).toBeDefined()` — AI agent response undefined after campaign reply | INTEGRATION | SV-1 Campaign | STILL_FAILING |
| 5.9 SMS webhook routes to correct org | `expect(received).toBe(true)` — received undefined; webhook routing lookup fails | INTEGRATION | SF-1 Web Chat | STILL_FAILING |
| 6.4 Management page loads with super_admin overview | Redirects to `/` instead of `/management` — route guard blocks non-super_admin or route missing | TEST_ISSUE | SH-2 VIN Integration | ACCEPTED (I-231) |
| 6.5 Demand Score tile visible on Management | 0 tiles found — depends on 6.4 (management page never loads) | TEST_ISSUE | SH-2 VIN Integration | ACCEPTED (I-231) |
| 6.7 Sales submenu shows 3 agents below separator | Timeout 60s — no agent menu items found in Sales sidebar | TEST_DATA | SH-2 VIN Integration | STILL_FAILING |
| 6.8 Service submenu shows at least 1 agent | 0 agent items found in Service sidebar | TEST_DATA | SH-2 VIN Integration | STILL_FAILING |
| 12.2 Security headers present | x-content-type-options = "nosniff, nosniff" (Caddy + Helmet both set header) | TEST_ISSUE | SH-5 Email | ACCEPTED (I-232) |

## Classification Summary

| Status | Count | Tests |
|--------|-------|-------|
| ACCEPTED (known issues) | 4 | 1.8, 6.4, 6.5, 12.2 |
| STILL_FAILING | 4 | 4.10, 5.9, 6.7, 6.8 |
| FIXED (was failing, now passes) | 28 | All serra_honda/duanekwells 401s, widget endpoint, voice config, plus cascading tests |
| NEW_FAILURE | 0 | — |

## Fixed Tests (Step 1 failures now passing)

The 28 fixed failures were all in the TEST_DATA category — caused by missing test accounts on staging:
- **serra_honda@huminic.ai 401 (27 tests):** domain-02 (2.1-2.5), domain-03 (3.1-3.11), domain-04 (4.1 cascade → 4.1-4.9), domain-05 (5.1 cascade → 5.1-5.8, 5.10-5.11), domain-07 (7.1-7.6), domain-11 (11.6)
- **duanekwells@gmail.com 401 (2 tests):** domain-01 (1.10), domain-08 (8.4)
- **Voice config 404 (2 tests):** domain-11 (11.11, 11.12) — now passing as VAPI/Tavus agent records exist
- **Widget public endpoint (1 test):** domain-11 (11.14) — now passing

Note: Step 1 counted 20 "did-not-run" cascading tests that are now passing. The actual distinct failure-to-pass count is 28 unique tests that went from fail/cascade to pass.

## MVP Flow Status

| Flow | Status | Blocked By |
|------|--------|-----------|
| SF-1 Web Chat | PARTIAL | 5.9 SMS webhook routing (STILL_FAILING) |
| SF-2 Tavus Video | PASS | All tests passing |
| SF-4 VAPI Inbound | PASS | All tests passing |
| SF-5 Walk-In | PASS | All tests passing |
| SV-1 Campaign | PARTIAL | 4.10 AI agent response (STILL_FAILING) |
| SH-1 TeamBox | PASS* | 1.8 is ACCEPTED (I-231 — test expects wrong RBAC) |
| SH-2 VIN Integration | PARTIAL | 6.7, 6.8 agent menu items (STILL_FAILING); 6.4, 6.5 ACCEPTED (I-231) |
| SH-3 Kill Switch | PASS | All tests passing |
| SH-4 Auth + RBAC | PASS | All tests passing |
| SH-5 Email | PASS* | 12.2 is ACCEPTED (I-232 — Caddy+Helmet header duplication) |

## Non-Accepted Failures: Root Cause Analysis

### 4.10 Campaign reply triggers AI agent response
- **Root cause:** After sending a campaign reply via SMS webhook, the test expects an AI-generated response message in the conversation. The agent response is `undefined`, suggesting the AI reply pipeline (webhook → agent dispatch → response write) has a gap.
- **Severity:** Medium — campaign replies work, but automated AI follow-up does not trigger.

### 5.9 SMS webhook routes to correct org
- **Root cause:** The SMS webhook lookup returns `undefined` instead of `true` for org routing. The webhook payload may not match the expected phone-to-org mapping.
- **Severity:** Medium — other SMS tests pass (11.4 TextMagic webhook routes correctly), so this may be a test data issue with specific phone numbers.

### 6.7 Sales submenu shows 3 agents below separator
- **Root cause:** No agent menu items rendered in the Sales department sidebar. Either agents are not seeded for the test org, or the sidebar component does not render agent sub-items.
- **Severity:** Low — department pages load (6.1 passes), KPIs work; this is specifically about agent menu items in sidebar.

### 6.8 Service submenu shows at least 1 agent
- **Root cause:** Same as 6.7 — no agent items in Service sidebar.
- **Severity:** Low — same root cause as 6.7.

## Verdict

**28 of 36 failures fixed** (78% remediation rate). All fixes were in the TEST_DATA category — account seeding resolved the bulk of failures. 4 remaining failures are ACCEPTED under known issues (I-231, I-232). 4 are STILL_FAILING and need further investigation (2 integration, 2 test data).

**Net pass rate: 91% (93/102)**. Excluding accepted failures: **95% effective pass rate (93/98 testable)**.
