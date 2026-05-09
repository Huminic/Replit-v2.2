# Wave 2B-T2 — Delta 2: Database conversation row + VAPI dashboard cross-check path

**Source of DB read:** `storage.getConversation(conversationId)` invoked from `server/test-widget-2B.ts` after the HTTP 200 — same Drizzle/Supabase Postgres connection used by the application (`DATABASE_URL` from `.env`).

## Conversation row created by the endpoint

```
SELECT id, organization_id, channel, status, customer_phone, customer_name, created_at
  FROM conversations
 WHERE id = 'dbaab6ff-79a5-4c40-99fc-2fbcb9219948';
```

| column | value |
|---|---|
| id | `dbaab6ff-79a5-4c40-99fc-2fbcb9219948` |
| organization_id | `24d64f99-ba04-4b43-af35-fd06f555ac86` (= serra-honda) |
| channel | `voice` |
| status | `open` |
| customer_phone | `+19014361271` (= Nancy allowlist) |
| customer_name | `Callback Request` (handler default — `server/routes/public.ts:172`) |
| created_at | `2026-05-09T00:53:03.605Z` |

The `created_at` (`00:53:03.605Z`) falls inside the request window (pre `00:53:01.730Z` → post `00:53:03.650Z`) confirming the row is causally linked to this single POST.

## Schema note — no provider call ref column

`shared/schema.ts:86-109` defines `conversations` with NO `vapi_call_id` / `provider_call_id` / `external_id` column. Today the VAPI callId persists ONLY in:

1. The HTTP response body (`callId` — captured in delta-1)
2. The server console log line `[Widget Callback] Outbound call initiated to ${formattedNumber} for ${org.name}, callId: ${result.id}` (`server/routes/public.ts:169`)
3. The VAPI dashboard / VAPI API itself

This is a known structural gap, not a bug in this run. If future work wants persistent linkage between conversation rows and VAPI call ids, a migration is required (out of scope for this T2 chunk; documented here for the verifier).

## VAPI dashboard cross-check path

The captured callId is `019e0a39-366a-700f-8829-2b212eaa7c2f`. Two ways to verify the call landed at VAPI:

### (a) central-mcp REST — preferred for automation

```
curl -s -X POST http://0.0.0.0:4002/api/tool/vapi_get_call \
  -H "Authorization: Bearer ${CENTRAL_MCP_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"callId":"019e0a39-366a-700f-8829-2b212eaa7c2f"}'
```

Expected fields in response (per central-mcp tool spec): `id`, `status`, `customer.number = +19014361271`, `assistantId = 90a876c0-0f11-4424-abfe-9ac82b264d88`, `phoneNumberId` (the serra-honda outbound caller), `startedAt`, `endedAt`, `endedReason`. Not invoked in this T2 helper (would be a second provider hit; T2 task constrains to ONE call). Operator or verifier may run this read-only follow-up; it does not initiate any new call.

### (b) VAPI dashboard (operator-side)

`https://dashboard.vapi.ai/calls` filtered by `callId=019e0a39-366a-700f-8829-2b212eaa7c2f` shows the exact session — assistant Elliott, customer +19014361271, outbound dial timestamp matching `2026-05-09T00:53:0X UTC`. This cross-check is operator-side and intentionally not automated to keep this proof to a single provider invocation.

## Continuity with prior wave evidence

This proof reuses the same VAPI assistant id (`90a876c0-...` Elliott on serra-honda) and the same allowlist destination (`+19014361271` Nancy) that Wave 2A T2 already proved end-to-end (Wave 2A T2 callId `019e03da-e46e-7000-83f9-5c9128e7f0b0`, Elliott→Nancy, recorded at `evidence/wave-2A-T-continuation/chunk-T2/`). Today's call is a **different** callId (`019e0a39-...`), confirming this is a NEW invocation through the public widget path rather than a replay of the Wave 2A artifact.

## Verdict — Delta 2: PASS

The DB write is real, well-formed, scoped to serra-honda, channel `voice`, and contains the allowlisted phone. The captured VAPI callId is documented along with the read-only cross-check paths. Halt-checks 4-7 (`conversationRowFound`, `conversationOrgMatchesSerraHonda`, `conversationChannelIsVoice`, `conversationPhoneMatches`) all true.
