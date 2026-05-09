# Wave 2B-T2 — Delta 1: HTTP request/response (provider call)

**Endpoint:** `POST /api/widget/voice-callback`
**Source:** `server/routes/public.ts:130-187` (commit `cbcda57` parent + this worktree)
**Date:** 2026-05-09
**Base URL:** `http://localhost:5000` (pm2 process `nexxus-app`, id 47, uptime 33h, status online)

## Endpoint contract — verified before invocation

The handler reads the request body as `{ slug, phoneNumber }`. The dispatch task description used the term "voice-callback" generically; the actual contract field names are `slug` (not `dealerSlug` or `org`) and `phoneNumber` (not `phone` or `customer_number`). The helper sends the actual contract fields.

Handler flow:

1. `slug` → `resolveOrgBySlug(slug)` (404 if missing)
2. `storage.getAgents(org.id)` → `find(a => a.vapiAssistantId && a.channels?.includes("voice") && a.status === "active")` (400 if no active voice agent)
3. `phoneNumber.replace(/[^0-9+]/g, "")` → if not `+`-prefixed, prefix `+1`
4. `callMCP("vapi_create_call", { assistantId, customerNumber, phoneNumberId? })` → 503 on VAPI failure
5. `storage.createConversation({ channel: "voice", customerPhone, organizationId, ... })` — schema has NO provider call ref column (see `shared/schema.ts:86-109`); the VAPI callId is returned in the HTTP response only
6. Respond `{ success: true, callId, conversationId }`

## Allowlist gate (BEFORE call)

Both checks returned exit 0 — see `allowlist-check.txt`:

```
ALLOWED: recipient='+19014361271' is on the allowlist (.../.claude/state/test-recipients.txt) — category=vapi_test_phone
EXIT=0
ALLOWED: org='serra-honda' is on the allowlist (.../.claude/state/test-orgs.txt) — category=test_org
EXIT=0
```

## Pre-call audit lookup (helper meta only — endpoint repeats this lookup)

| Field | Value |
|---|---|
| org id | `24d64f99-ba04-4b43-af35-fd06f555ac86` |
| org slug | `serra-honda` |
| org name | `Serra Honda` |
| voice agent id | `1e8607bb-0034-406f-a35b-b2e5f0aa6d0f` |
| vapiAssistantId | `90a876c0-0f11-4424-abfe-9ac82b264d88` (Elliott) |
| voice agent status | `active` |

## HTTP request — single invocation

```
POST http://localhost:5000/api/widget/voice-callback
Content-Type: application/json

{"slug":"serra-honda","phoneNumber":"+19014361271"}
```

Pre-timestamp: `2026-05-09T00:53:01.730Z`
Post-timestamp: `2026-05-09T00:53:03.650Z`
Duration: `2703 ms`

## HTTP response

```
HTTP 200 OK
Content-Type: application/json

{
  "success": true,
  "callId": "019e0a39-366a-700f-8829-2b212eaa7c2f",
  "conversationId": "dbaab6ff-79a5-4c40-99fc-2fbcb9219948"
}
```

## Halt-checks (all PASS)

| Check | Pass |
|---|---|
| `status2xx` (HTTP 200) | true |
| `hasCallId` (VAPI returned id) | true |
| `hasConversationId` (DB row id returned) | true |
| `conversationRowFound` (SELECT found row) | true |
| `conversationOrgMatchesSerraHonda` | true |
| `conversationChannelIsVoice` | true |
| `conversationPhoneMatches` (`+19014361271`) | true |

## Verdict — Delta 1: PASS

The widget voice-callback endpoint accepted a real-contract POST, dispatched a real VAPI provider call (callId returned), created a real DB conversation row, and returned HTTP 200 — within 2.7 seconds end-to-end. No echo-rerun: this is the only invocation of `testWidgetVoiceCallback` in this session. Run log captured at `run.log`.
