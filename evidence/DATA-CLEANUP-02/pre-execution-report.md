# DATA-CLEANUP-02 Pre-Execution Report

**Sprint:** DATA-CLEANUP-02 — Webhook Isolation
**Date:** 2026-04-06
**Operator Authorization:** User directed execution of DATA-CLEANUP-02 in current session

## Objective

Verify and document that test and production webhook endpoints are fully separated, ensuring no test traffic reaches production handlers.

## Declared Files

- evidence/DATA-CLEANUP-02/ (governance artifacts)
- issues.md (if issues found)

## UI Changes

NONE — uiPermissions is NONE.

## Acceptance Criteria

| ID | Criterion |
|----|-----------|
| DC-02.AC1 | Test webhook URLs separated from production webhook URLs in configuration |
| DC-02.AC2 | Production webhooks reject test-origin payloads |
| DC-02.AC3 | Webhook routing verified end-to-end with test payload |

## Test Plan

This is a config-verification sprint. Tests consist of:

1. **URL isolation check:** Verify all 14 wf-*.spec.ts files use `process.env.BASE_URL` (not hardcoded live URLs)
2. **Grep audit:** `grep -c "live.huminic.app" tests/e2e/wf-*.spec.ts` — must return 0 for all files
3. **Webhook path check:** Verify webhook test calls (e.g., wf-campaign.spec.ts SMS webhook) use `${BASE}` variable
4. **Broader scan:** `grep -rn "live.huminic.app" tests/` — must return 0 matches
5. **ENV check:** Verify .env has no webhook URL configuration that would route tests to production

No Playwright test execution needed — this is a configuration audit sprint.
