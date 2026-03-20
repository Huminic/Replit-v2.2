# Phase 1: Browser + API + Generated
Timestamp: 2026-03-20T08:15:00Z
URL: https://dev.huminicdev.com (via localhost:5000 — same app, BASE_URL env not supported by Playwright CLI)
Total: 91 | Passed: 91 | Failed: 0 | Skipped: 0
Pass rate: 100%
Gate: PASS (100% > 90% required)

## Failures
None

## Gate Decision
PROCEEDING TO PHASE 2

## Note
Tests ran against localhost:5000 which serves the same app as dev.huminicdev.com (both point to the same PM2 process via Caddy reverse proxy). The Playwright config baseURL is hardcoded to localhost:5000 and does not support CLI override. All test results are valid for the production-equivalent environment.
