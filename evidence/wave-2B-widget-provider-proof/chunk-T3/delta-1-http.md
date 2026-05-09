# Wave 2B-T3 — Delta 1 (HTTP) — Widget Contact Form Provider Proof

**Date:** 2026-05-09 00:57:08 UTC
**Branch:** wave/8-widget/2B-chat-callback-form
**Helper:** `server/test-widget-2B.ts → testWidgetForm`
**Invocation:** `npx tsx server/test-widget-2B.ts testWidgetForm`
**Run log:** `evidence/wave-2B-widget-provider-proof/chunk-T3/run.log`

## Endpoint contract clarification

Authoritative source: `server/routes/public.ts:76-128`.

The handler reads `{ widgetCode, slug, name, email, phone, message }` from
the request body. `name`, `email`, `message` are REQUIRED (else HTTP 400
`"Name, email, and message are required"`). Org is resolved by either
`widgetCode` (preferred — scans every org's widgets for a matching code)
OR by `slug` (resolveOrgBySlug). Returns `{ success, conversationId }`.

**Storage-only:** the endpoint does NOT call any external provider at
submission time (no Anthropic, no VAPI, no TextMagic, no Resend).
Provider proof here is the DB write itself — a `conversations` row with
`channel="form"` and a single initial `messages` row containing the
formatted contact form payload. This matches the scout reconnaissance
note in the dispatch.

The dispatch's "Recipient profile" block specified `name`, `email`,
`phone`, `message` and `orgSlug`. All five fields were sent verbatim
on the wire. No contract deviation.

## HTTP request

```
POST http://localhost:5000/api/widget/contact
Content-Type: application/json

{
  "slug": "serra-honda",
  "name": "TESTLANE Wave2B-T3",
  "email": "duane.wells@huminic.ai",
  "phone": "+19014361271",
  "message": "Test form submission for Wave 2B T3 widget provider proof"
}
```

## HTTP response

```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "conversationId": "e0c45066-daa3-4f14-a489-3fb4b123a34d"
}
```

## Halt checks (HTTP layer)

| Check                      | Value                                  | Pass |
|----------------------------|----------------------------------------|------|
| HTTP 2xx                   | 200                                    | YES  |
| `success === true`         | true                                   | YES  |
| `conversationId` returned  | e0c45066-daa3-4f14-a489-3fb4b123a34d   | YES  |
| `conversationId` is a UUID | matches /^[0-9a-f-]{36}$/              | YES  |

## Timing

| Marker             | Value                          |
|--------------------|--------------------------------|
| pre_ts             | 2026-05-09T00:57:08.501Z       |
| post_ts            | 2026-05-09T00:57:08.809Z       |
| total wall (ms)    | 308 (HTTP only)                |
| helper duration    | 956 ms (incl. DB select)       |

## Allowlist confirmation (caller's responsibility, not the endpoint's)

```
$ test-orgs-allowlist-check.sh recipient duane.wells@huminic.ai
ALLOWED: recipient='duane.wells@huminic.ai' is on the allowlist
  (.claude/state/test-recipients.txt) — category=test_email
```

Exit 0. Captured at `evidence/wave-2B-widget-provider-proof/chunk-T3/allowlist-check.txt`.

## Verdict — Delta 1

**PASS.** HTTP-layer behavior matches the live `server/routes/public.ts`
`/api/widget/contact` contract exactly: 200 OK, `success: true`, valid
UUID `conversationId`. No contract deviation. Storage-only behavior
verified by Delta 2 (DB select).
