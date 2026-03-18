# T-3 Full Application Test Report
Date: 2026-03-18
Sprint: T-3 (post-REM-1 remediation)

## Summary

| Project | Passed | Failed | Skipped | Total |
|---------|--------|--------|---------|-------|
| API | 27 | 11 | 2 | 40 |
| Browser | 12 | 43 | 1 | 56 |
| Comms | 10 | 1 | 1 | 12 |
| Catalog | 5 | 0 | 0 | 5 |
| **Total** | **54** | **55** | **4** | **113** |

## T-2 → T-3 Improvement

| Metric | T-2 | T-3 | Change |
|--------|-----|-----|--------|
| Total passed | 46 | 54 | **+8** |
| API passed | 22 | 27 | **+5** |
| Browser passed | 9 | 12 | **+3** |
| Comms passed | 10 | 10 | 0 |
| Catalog passed | 5 | 5 | 0 |

## Failure Root Causes

### 1. Browser loginViaUI broken in headless Chromium (28 failures)
Tests fill the login form and click submit, but the page never navigates away from /login. The API login works fine. This is the single biggest blocker — 28 tests are untestable. Needs investigation: is it a form action issue, a SPA router issue, or a Playwright selector issue?

### 2. Rate limiter cascade (4-8 failures)
Running 56 browser tests sequentially exhausts the 5-request-per-15-minute rate limiter. Tests later in the sequence get 429.

### 3. Billing content missing (3 failures — 8.2, 8.3, 8.4)
Billing pages load but show no FlexPrice data. FLEXPRICE_API_KEY was added in REM-1-IN, but the orgs may not have billingCustomerId set. Root cause needs investigation.

### 4. Campaign/Tasks real bugs (remaining ~13 failures)
Some campaign execution, task CRUD, and entitlement endpoint tests still fail with 500s or incorrect responses.

## Dual-Agent Concordance

Agent A ran API + Comms. Agent B ran Browser + Catalog. No overlapping test coverage for direct concordance, but both agents reported consistent results within their domains.

## New Issues for Next Loop

The 28 browser login timeout failures mask what might be real issues behind them. Before logging new issues, the loginViaUI helper needs to be fixed so we can distinguish test infrastructure failures from application bugs.

## Screenshots
60 screenshots captured (5 roles × 12 pages) — same as T-2.

## Verdict: FLAGGED
+8 improvement but 55 failures remain. Primary blocker is test infrastructure (browser login), not application bugs. Recommend fixing loginViaUI before next REM cycle.
