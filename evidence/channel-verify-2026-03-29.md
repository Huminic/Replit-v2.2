# Non-SMS Channel Verification

**Date:** 2026-03-29T19:36:20Z

## 1. Voice (VAPI)
- Call placed: YES
- Call ID: 019d3b19-16ca-799d-a444-a8c3877c7389
- Duration: 20 seconds (started 19:36:36Z, ended 19:36:56Z)
- Cost: $0.0295
- Transcript: Available — Caroline greeted, Elliott requested 2024 Honda Civic test drive
- Email notification: YES — 3 emails sent at 19:37:07Z to serra_honda@huminic.ai, duanekwells@gmail.com, duane.wells@huminic.ai — all status: delivered
- Conversation in app: YES — ID 843e6f3b-efc6-4998-af68-de372c89f8bb, channel: voice, created 19:37:01Z
- EndedReason: exceeded-max-duration (expected for test call with short max duration)
- Verdict: OPERATIONAL

## 2. Email (Resend)
- API responsive: YES
- Recent emails delivering: YES — all 20 most recent emails show last_event: "delivered"
- Sample subjects: "Serra Honda Has a New AI Voice Lead!", "Ford of Columbia Has a New AI Voice Lead!", "LC-8 TeamBox Email Test", "LC-7 Autonomous Test"
- Verdict: OPERATIONAL

## 3. Video (Tavus)
- Session created: YES
- Conversation ID: ce5766a8b8a424c1
- URL returned: https://tavus.daily.co/ce5766a8b8a424c1
- Status: active
- Verdict: OPERATIONAL

## 4. AI Chat
- Endpoint: POST /api/chat/:conversationId/stream (body field: "content")
- Conversation created: YES — ID 989f3c8a-2f6a-43be-a647-4cc4fb1b2bd5
- Response received: YES
- Tool used: YES — "Fetching sales metrics from VinSolutions..." status event observed
- Real data: YES — returned 705 total leads, 171 active pipeline, 18 new leads, 32 sold/delivered, 5% conversion rate, synced 5 days ago
- Streaming: Working (SSE events: status, content, done)
- Verdict: OPERATIONAL

## Summary
| Channel | Status |
|---------|--------|
| Voice (VAPI) | OPERATIONAL |
| Email (Resend) | OPERATIONAL |
| Video (Tavus) | OPERATIONAL |
| AI Chat | OPERATIONAL |
| SMS (TextMagic) | OUT OF CREDITS |
