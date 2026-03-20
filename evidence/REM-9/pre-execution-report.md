# Pre-Execution Report: REM-9
Timestamp: 2026-03-20T02:30:00Z
Sprint: REM-9
Status: READY

## Objective
Fix user-reported bugs (contact modal, insights calculations) and address ghost audit test coverage gaps. Create real comms test scripts that exercise actual third-party integrations (VAPI, Tavus, TextMagic, VIN Solutions, Resend) instead of mocking.

## Declared Files
- server/sync.ts
- server/routes/insights.ts
- server/routes/metrics.ts
- client/src/pages/main.tsx
- client/src/pages/sales.tsx
- tests/e2e/live-comms.spec.ts
- tests/e2e/domain-01-auth.spec.ts
- tests/e2e/domain-07-insights.spec.ts
- tests/e2e/e2e-flows.spec.ts
- evidence/REM-9/

## Success Criteria
- Contact modal loads and displays lead details when clicked from dashboard
- Insights calculations produce correct non-zero values for stores with 1000+ leads
- warehouse_leads has non-null vin_created_at for synced leads
- warehouse_metrics table populated with computed metrics
- SMS human takeover prevents AI from responding (I-091)
- Campaign execution test with dryRun=false verifies real SMS (I-092)
- Real VAPI round-trip test verifies transcript in TeamBox (I-093)
- Tavus transcript verification test (I-094)
- All new tests pass against real services, not mocks

## Constraints
- FE changes require user approval
- Builder agents MUST NOT modify files outside /home/ubuntu/Claude-store/nexxus2.2_replit/
- Real comms tests must use test-only payloads and not send to production customers
- Ghost watchdog will audit test files when complete
