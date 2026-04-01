# T-010d Pre-Execution Report

## Objective
Write 5 E2E tests proving outbound campaign flows and data integrity across the Nexxus 2.2 application. All external services must be mocked. Campaign tests use CommGate (org.outboundEnabled=false on Huminic org) to prevent real SMS/email sends.

## Success Criteria
- **AC1:** E2E test -- campaign execute -> messages queued (CommGate blocks real send, verify delivery log)
- **AC2:** E2E test -- campaign merge fields substituted correctly in sent messages
- **AC3:** Data test -- same KPI shows same number on dashboard, /sales, and /insights
- **AC4:** Data test -- delta sync status confirmed running or documented
- **AC5:** Each test would FAIL if behavior broke

## Safety Strategy
- Campaign tests target Huminic org (outboundEnabled=false, smsEnabled=false, emailEnabled=false)
- CommGate blocks all outbound at the organization level before any external API is called
- Dry run mode used for merge field verification (AC2)
- No real calls to TextMagic, Resend, VAPI, or any external messaging service
- Test campaigns cleaned up via killSwitch + status stop after each test

## Test File
`tests/e2e/t010d-outbound-data.spec.ts`

## Declared Files

- tests/e2e/t010d-outbound-data.spec.ts
- playwright.config.ts
- evidence/T-010d/
