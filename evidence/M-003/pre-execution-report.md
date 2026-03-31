# M-003 Pre-Execution Report

Sprint: M-003 — Test Infrastructure Cleanup
Timestamp: 2026-03-31T07:25Z
Role: orchestrator

## Objective
Clean up stale test infrastructure: remove orphan specs, delete dead helpers, fix hardcoded URLs, update verify-all.ts.

## Success Criteria
- Zero orphan spec files (all matched by a Playwright project)
- Zero dead helper files
- Zero hardcoded URLs in test files
- All tests that ran before still run

## Declared Files
- tests/e2e/g004-gap-coverage.spec.ts
- tests/e2e/m001-gap-coverage.spec.ts
- tests/helpers/api.ts
- tests/helpers/factory.ts
- tests/e2e/s0-foundation.spec.ts
- tests/e2e/s1-ai-chat.spec.ts
- tests/e2e/s2-teambox.spec.ts
- tests/e2e/s3-sales.spec.ts
- tests/e2e/s4-service.spec.ts
- tests/e2e/s5-marketing.spec.ts
- tests/e2e/s6-manage.spec.ts
- tests/e2e/s7-system-profile.spec.ts
- tests/e2e/s8-landing-widgets.spec.ts
- tests/verify-all.ts
- playwright.config.ts
- evidence/M-003/

## Entry Gates
- A1: PASS — M-002 committed (fa3cfaf)
- A2: Baseline test count: 46 API tests (44 pass, 2 known failures)

## Exit Gates
- B1: Zero orphan spec files
- B2: Zero dead helper files
- B3: Zero hardcoded URLs in test files
- B4: Full test list matches or exceeds baseline count

## Risks
- Low: Moving orphan specs to deprecated may reduce total test count
- Mitigation: Add to playwright config instead of deprecating if tests are still valuable
