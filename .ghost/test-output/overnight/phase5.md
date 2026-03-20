# Phase 5: Deep Coverage + Comms
Timestamp: 2026-03-20T08:35:00Z
URL: localhost:5000
Total: 28 | Passed: 19 | Failed: 8 | Skipped: 1
Pass rate: 68%
Gate: FAIL (68% < 80% required)

## Failures

### Test Infrastructure (7 failures — same root cause)
- LC-1 MCP tm_send_message tool is accessible: "No data in MCP response for tm_get_message_price"
- LC-3 MCP vapi_list_assistants returns dealer assistants: "No data in MCP response for vapi_list_assistants"
- LC-4 MCP vapi_list_phone_numbers returns configured numbers: "No data in MCP response for vapi_list_phone_numbers"
- LC-6 VAPI outbound call with context overrides: "No data in MCP response for vapi_list_assistants"
- LC-7 MCP resend_send_email delivers to test address: "No data in MCP response for resend_send_email"
- LC-9 MCP tavus_list_personas returns dealer personas: "No data in MCP response for tavus_list_personas"
- LC-10 Tavus personas match VAPI assistants per dealer: "No data in MCP response for tavus_list_personas"

**Root cause:** The `callMCP` function in `live-comms.spec.ts` doesn't handle all MCP SSE response formats. The MCP server returns data in a format the test parser doesn't recognize. The app's own `callMCP()` in `vendorProxy.ts` handles these formats correctly — the test helper is a simplified copy that's missing response handling cases.

**Fix:** Update the `callMCP` function in `live-comms.spec.ts` to match the full response parsing logic from `vendorProxy.ts`. This is a TEST INFRASTRUCTURE fix, not an application code fix.

### Application Bug (1 failure)
- DC-US013-1 Appointment CRUD works via API: Expected source "widget" but received "manual". The appointments API does not preserve the `source` field value — it defaults to "manual" regardless of what is passed.

## Gate Decision
STOPPED — gate failed at Phase 5 (68% < 80%)

## Analysis
The 7 MCP response parsing failures are all the same test infrastructure bug — the live-comms.spec.ts callMCP helper. If those were fixed, Phase 5 would be 19/21 = 90% (well above the 80% gate). The only real application issue is the appointment source field defaulting to "manual".
