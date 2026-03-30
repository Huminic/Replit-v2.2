# Campaign Round-Trip Test

**Date:** 2026-03-29T19:13:08Z
**Campaign:** ROUND-TRIP-TEST-SMS
**Campaign ID:** ebb941b6-43dd-444e-a5bb-39f8eb24b6db
**Recipients:** +18338935694, +18338096836

## Results

| Step | Action | Result |
|------|--------|--------|
| 1 | Create campaign | Created successfully. ID: ebb941b6-43dd-444e-a5bb-39f8eb24b6db, status: draft |
| 2 | Upload CSV | 2 recipients uploaded. Columns matched: First Name, Last Name, Home Phone, Email Address |
| 3 | Execute (dryRun=false) | Execution started. Final: 2 processed, 0 sent, 0 blocked, 2 FAILED |
| 4 | Campaign status | Status: completed (auto-completed after all recipients processed). executionSent=0, executionFailed=2 |
| 5 | Simulate reply (webhook) | Conversation created (id: 85a23652). 2 inbound messages recorded (duplicate from curl). No AI response generated. |
| 6 | TeamBox check | +18338935694: conversation exists (open, linked to campaign 8f58c9f5, unread=2, lastMsg 19:15:21Z). +18338096836: conversation exists (open, no campaign link, unread=478, lastMsg 02:05:08Z). 19 total SMS conversations. |
| 7 | Cleanup | Campaign patched to status=completed (was already auto-completed) |

## Verdict

ROUND-TRIP: **FAIL**

## Failure Analysis

### SMS Send Failure (2/2 recipients failed)
- Both recipients (18338935694 and 18338096836) were marked `status: failed` with no `sentAt` timestamp.
- No error message was returned in the recipient records or execution response.
- The `sendIntervalSeconds` was 60, so the second recipient was processed ~60s after the first.
- Root cause unknown from API responses alone -- likely a TextMagic API configuration or credential issue on the dev environment.

### Webhook / Conversation Flow (Partial Pass)
- The TextMagic webhook endpoint accepted the simulated inbound and created a conversation.
- The conversation was linked to a **different** campaign (8f58c9f5) rather than the one created in this test (ebb941b6). This suggests the system matched the phone number to an earlier campaign that had previously contacted this number.
- No AI auto-response was generated within 10 seconds of the inbound message. Both messages in the conversation are role=user.

### Observations
1. **Campaign execution sends fail silently** -- the API returns `failed` status per recipient but no error reason. This makes debugging impossible without server logs.
2. **Webhook creates conversations correctly** -- the inbound path works: webhook -> conversation -> message storage.
3. **AI auto-response not triggered** -- after the webhook created a conversation with an inbound message, no AI response was generated. This could be because (a) no agent is configured for this org/campaign, (b) auto-response is disabled, or (c) the AI response pipeline has a bug.
4. **Phone number +18338096836 has 478 unread messages** -- this suggests a loop or flood issue on this number from prior testing.
5. **Campaign-conversation linking** -- the webhook linked the inbound to a previous campaign, not the one from this test. This is likely correct behavior (the current campaign never successfully sent to this number).
