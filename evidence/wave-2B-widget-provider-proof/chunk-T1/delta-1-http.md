# Wave 2B-T1 — Delta 1: HTTP request/response (provider proof)

**Test:** public widget chat endpoint provider proof — Anthropic E2E
**Date (UTC):** 2026-05-09T00:46:15Z → 2026-05-09T00:46:19Z (~4.9s)
**Helper:** `server/test-widget-2B.ts` → `testWidgetChat()`
**Run log:** `evidence/wave-2B-widget-provider-proof/chunk-T1/run.log`
**Session id (helper-generated):** `537236ad-fece-44d3-8915-c5e1d7e94e69`

## Endpoint under test

`POST http://localhost:5000/api/widget/chat`
Source: `server/routes/public.ts:242-379`
Live process: pm2 `nexxus-app` (process 47, port 5000, online).

### Contract clarification (deviation from task spec)

The task description specified the request body as `{ widgetCode, sessionId, message }`. The live endpoint reads `{ slug, message, conversationId }` and 400s with `"slug and message are required"` when `slug` is absent (see `server/routes/public.ts:246-249`). Per truth-over-compliance, the helper sends the actual contract. For traceability the helper still looks up the org's chat widget and logs `widgetCode` + `widgetId` (audit-only fields, not consumed by the endpoint).

The helper still generates a fresh `sessionId` per invocation (`crypto.randomUUID`) and reports it in the result `meta.sessionId`. Today the endpoint does not consume it. If a future revision adds a sessionId field, no helper change is needed.

## Request

```http
POST /api/widget/chat HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{"slug":"serra-honda","message":"Hi, I am interested in a 2024 Honda Civic. Do you have any in stock?"}
```

Audit-only widget context (looked up before the POST, NOT sent in the body):
- `widgetId`: `0de04433-d04c-4e05-abef-2a6013369bb8`
- `widgetCode`: `wgt_serra_honda_sales`
- `widgetType`: `text`
- `widgetStatus`: `active`

## Response

- HTTP status: **200**
- Body:

```json
{
  "conversationId": "67ddf429-e11d-4e3b-8dec-d1c24ffe3b7c",
  "response": "Hi! Thanks for reaching out to Serra Honda! 😊\n\nBased on our current inventory, I don't see any 2024 Honda Civics available at this time. However, we do have a **2026 Honda Civic Sport** in stock, which is a fantastic option! Here are the details:\n\n- **Year:** 2026\n- **Model:** Honda Civic Sport\n- **Price:** $28,995\n- **Status:** Available\n\nThe 2026 Civic Sport comes with some great upgrades over previous model years. Would you like to know more about it, or would you like to schedule a test drive? I can also check if there are other options that might interest you! 🚗",
  "autoGreeting": "Hi there! This is Caroline from Serra Honda. Thank you for your interest — I'd love to help you find the perfect vehicle. What are you looking for?"
}
```

## Halt-check assertions (all PASS)

| Check | Value | Result |
|---|---|---|
| `status2xx` | HTTP 200 | PASS |
| `hasConversationId` | `67ddf429-...` returned | PASS |
| `replyLengthOver20` | 573 chars (post-DB) / 535 chars (response body — count differs because the DB row stores raw newlines as `\n` literal) | PASS |
| `replyNotStubFallback` | reply is NOT `"I'm sorry, I'm unable to respond right now. Please try again later."` (the `STUB_FALLBACK` string defined at `public.ts:323`) | PASS |
| `conversationRowFound` | row id matches | PASS |
| `conversationOrgMatchesSerraHonda` | `org=24d64f99-ba04-4b43-af35-fd06f555ac86` (Serra Honda) | PASS |
| `atLeastTwoMessages` | 3 message rows (auto-greeting + user + assistant) | PASS |

## Provider-fire proof

The 4.9s round-trip plus the 535-char content-bearing reply confirm the live Anthropic call (`claude-sonnet-4-6`, `max_tokens: 300`) actually fired. The reply is content-aware (correctly notes there are no 2024 Civics in stock and surfaces the 2026 Civic Sport at $28,995, a real inventory item — observable in the knowledge-base documents that the endpoint loads at `public.ts:325-342`). No stub fallback observed.

## Constraints honored

- Single POST only — no echo-rerun (Wave 2A T1 over-send incident NOT repeated).
- No mutation of `server/routes/public.ts` or `server/routes/widgets.ts`. Read-only references.
- No UI files touched.
- All file writes inside `/home/ubuntu/Claude-store/nexxus2.2_replit/`.
