# Smoke Test — S0

## e2e-flows.spec.ts
10 passed, 0 failed (26.0s)

## real-integrations.spec.ts
19 passed, 2 failed (2.1m)

### Failures
1. **RI-VAPI-1** Elliott calls Caroline — real inbound call to Serra Honda
   - Transcript messages returned 0; call completed but no transcript captured
   - Line 114: `expect(msgList.length).toBeGreaterThan(0)`

2. **RI-VIN-1** Warehouse leads have dates and match VIN API counts
   - Warehouse leads returned 0; no leads with `vin_created_at` dates
   - Line 607: `expect(withDates.length).toBeGreaterThan(0)`

## Verdict
SMOKE FAIL — 2 real-integration tests failed (VAPI transcript capture, VIN warehouse dates)
