# T-010c Pre-Execution Report

## Objective
Write 5 E2E tests proving inbound flows work end-to-end, with all external services mocked (no real VAPI, Tavus, or VIN calls).

## Success Criteria
- AC1: Browser test — landing page form submit creates conversation visible in TeamBox
- AC2: Browser test — voice callback widget submits request and shows success state (VAPI mocked)
- AC3: Browser test — video widget initiates Tavus session and shows connected state (Tavus mocked)
- AC4: API test — simulated VAPI webhook payload creates conversation (VIN mocked via webhook secret auth)
- AC5: API test — simulated Tavus webhook payload creates conversation (VIN mocked via webhook secret auth)

## Entry Gates
- T-010a committed (29eb290)
- App live at https://dev.huminicdev.com
- Playwright 1.58.2 installed with Chromium
- Auth helpers available in tests/e2e/helpers/auth.ts

## Risks
- Rate limiting on auth endpoints (mitigated by file-based token cache)
- Webhook secrets required for AC4/AC5 (mitigated by reading from process.env)
- VAPI dedup map may reject duplicate call IDs (mitigated by unique timestamp-based IDs)

## Declared Files

- tests/e2e/t010c-inbound-flows.spec.ts
- playwright.config.ts
- evidence/T-010c/
