# Pre-Execution Report: E2E-1
Timestamp: 2026-03-19T20:00:00Z
Sprint: E2E-1
Status: READY

## Objective
Build automated end-to-end flow tests that exercise the full communication and data pipelines. Unfixme 6 webhook/comms tests that were blocked by now-fixed issues. Add flow tests covering sales inbound/outbound, service campaigns, TeamBox round-trips, VIN Solutions integration, and kill switch.

## Constraints
- Webhooks: test-only payloads, react only to test data
- Email: disable outbound during tests, verify function is called correctly
- VIN Solutions: DO insert test contacts (Durran Cage account)
- VAPI: verify context built correctly (firstMessage, systemPrompt, phoneNumberId, customerName), no real calls
- Tavus: verify conversation URL returned via MCP, name prompt loads

## Declared Files
- tests/e2e/domain-04-campaigns.spec.ts (unfixme 4.10)
- tests/e2e/domain-05-teambox.spec.ts (unfixme 5.9)
- tests/e2e/domain-11-integrations.spec.ts (unfixme 11.2, 11.3, 11.6)
- tests/e2e/live-comms.spec.ts (unfixme LC-6, add flow tests)
- tests/e2e/e2e-flows.spec.ts (NEW — full flow tests)
- acceptance_criteria.md
- evidence/E2E-1/
- sprints.json

## Success Criteria

### Unfixme Tests (6)
- 4.10 PASS — simulate inbound SMS reply, verify AI agent processes and responds
- 5.9 PASS — POST test payload to TextMagic webhook, verify routes to correct org
- 11.2 PASS — POST test VAPI end-of-call payload, verify accepted (200) with no outbound email
- 11.3 PASS — verify transcript from 11.2 appears in TeamBox conversation
- 11.6 PASS — verify VAPI outbound call args include context overrides
- LC-6 PASS — verify vapi_create_call MCP args include firstMessage, systemPrompt, customerName

### New Flow Tests
- FLOW-1: Sales inbound SMS → agent response → verify conversation in TeamBox
- FLOW-2: Sales inbound SMS → takeover → human reply via TeamBox
- FLOW-3: Service campaign create → upload CSV → execute → verify sends
- FLOW-4: Service campaign → simulate reply → agent responds → appointment context
- FLOW-5: Kill switch ON → campaign blocked → messages in TeamBox queue
- FLOW-6: Kill switch OFF → campaign resumes
- FLOW-7: VIN Solutions → create test contact → verify appears in warehouse leads
- FLOW-8: Outbound email → verify Resend called (mock check, no real send)
- FLOW-9: Tavus → create conversation via MCP → verify URL returned
- FLOW-10: TeamBox → all message types visible (SMS, email, voice transcript)

### Smoke Test Commands
- Unfixme tests: `npx playwright test --grep "4.10|5.9|11.2|11.3|11.6|LC-6" --workers=1`
- Flow tests: `npx playwright test --grep "FLOW-" --workers=1`
