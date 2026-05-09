# Wave 2B-T1 — Summary (Public Widget Chat Provider Proof)

**Verdict line:** `T1 — PASS`

**What was proven:** the public widget chat endpoint `POST /api/widget/chat` (server/routes/public.ts:242-379) successfully handles a single chat turn end-to-end against the running dev pm2 instance — including the live Anthropic provider call (claude-sonnet-4-6) and the conversation/messages DB writes that result. No stub fallback observed.

## Inputs

- Endpoint: `POST http://localhost:5000/api/widget/chat`
- pm2 process: `nexxus-app` (process 47, port 5000, online — uptime 33h at run time)
- Org: `serra-honda` (id `24d64f99-ba04-4b43-af35-fd06f555ac86`)
- Audit-only widget: `wgt_serra_honda_sales` (id `0de04433-...`, type `text`, status `active`)
- Helper-generated session id: `537236ad-fece-44d3-8915-c5e1d7e94e69`
- Single POST. No echo-rerun.

## Two deltas of proof

| Delta | Path | What it proves |
|---|---|---|
| 1 (test result) | [`delta-1-http.md`](./delta-1-http.md) | HTTP 200 + 535-char content-bearing reply from Anthropic. Reply NOT equal to the stub fallback `"I'm sorry, I'm unable to respond right now. Please try again later."` (defined at `public.ts:323`). All seven halt-checks PASS. |
| 2 (independent observation) | [`delta-2-db.md`](./delta-2-db.md) | `psql $DATABASE_URL` shows the conversation row in Serra Honda's org (channel=`chat`, status=`open`, created at 2026-05-09 00:46:15.634 UTC, last_message_at 00:46:19.59 UTC) plus 3 message rows in correct order: auto-greeting → user → Anthropic reply. |

## Raw run log

[`run.log`](./run.log) — full stdout from `npx tsx server/test-widget-2B.ts testWidgetChat`. Includes pre/post timestamps, HTTP request/response, DB lookup confirmations, and final RESULT JSON with all halt-check booleans.

## Key result fields

```json
{
  "ok": true,
  "status": 200,
  "conversationId": "67ddf429-e11d-4e3b-8dec-d1c24ffe3b7c",
  "replyLength": 573,
  "durationMs": 4930,
  "haltChecks": {
    "status2xx": true,
    "hasConversationId": true,
    "replyLengthOver20": true,
    "replyNotStubFallback": true,
    "conversationRowFound": true,
    "conversationOrgMatchesSerraHonda": true,
    "atLeastTwoMessages": true
  }
}
```

## Contract deviation note

Task description specified `{ widgetCode, sessionId, message }` but the live endpoint contract (server/routes/public.ts:246) is `{ slug, message, conversationId }`. The helper sends the actual contract (`slug=serra-honda`) and returns `widgetCode` + `sessionId` in the result `meta` object for traceability. Detail: `delta-1-http.md` → "Contract clarification".

## Constraints honored

- Single POST. No echo-rerun. (Wave 2A T1 over-send incident NOT repeated.)
- No mutation of `server/routes/public.ts` or `server/routes/widgets.ts`. Read-only references only.
- No UI files touched.
- All file writes inside `/home/ubuntu/Claude-store/nexxus2.2_replit/`.
- pm2 widgetLimiter ceiling (30 req/min): single call well under.

## Files staged for commit on branch `wave-2B-T1-chat`

- `server/test-widget-2B.ts` (new helper)
- `evidence/wave-2B-widget-provider-proof/chunk-T1/delta-1-http.md` (new)
- `evidence/wave-2B-widget-provider-proof/chunk-T1/delta-2-db.md` (new)
- `evidence/wave-2B-widget-provider-proof/chunk-T1/run.log` (new)
- `evidence/wave-2B-widget-provider-proof/chunk-T1/chunk-T1-summary.md` (new)
