# I-4.4 Tavus Video Session Test

**Date:** 2026-03-23
**Test Type:** API creation test (no session join)

## Request

```
POST http://localhost:5000/api/widget/video-session
Content-Type: application/json

{
  "slug": "serra-honda",
  "visitorName": "I-4.4 Tavus Test"
}
```

No auth token required (widget endpoint is public-facing).

## Response

```json
{
  "conversationId": "cae01e61632a74c1",
  "conversationUrl": "https://tavus.daily.co/cae01e61632a74c1",
  "status": "active"
}
```

## Verification

| Check | Result |
|-------|--------|
| HTTP response received | PASS |
| `conversationId` present | PASS — `cae01e61632a74c1` |
| `conversationUrl` present | PASS — `https://tavus.daily.co/cae01e61632a74c1` |
| `status` is `active` | PASS |
| URL domain is `tavus.daily.co` | PASS |

## Scope Limitations

- Session was created but NOT joined (per test rules).
- Transcript and callback verification require a manual session where a user joins the video call and speaks with the Tavus replica.
- callback_url configuration is set at the Tavus replica/persona level, not per-session. Verifying callback delivery requires an actual completed conversation.

## Result: PASS

Tavus video session creation pipeline is functional. The API accepts a slug and visitor name, creates a conversation via Tavus, and returns a joinable session URL.
