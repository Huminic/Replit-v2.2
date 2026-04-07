# Comms Eval 3: Auto-Greeting on Inbound SMS

**Date:** 2026-04-07
**Evaluator:** Claude Agent (WAVE-PE3)
**Component:** SMS Auto-Greeting (server/routes/sms.ts)
**Org:** Serra Honda (24d64f99-ba04-4b43-af35-fd06f555ac86)
**Agent:** Caroline (auto_greeting configured, channels: voice, video, sms)

## Test Method

1. Sent an SMS TO Caroline's TextMagic number (+18338935694) via `tm_send_message` through central-mcp
2. TextMagic delivered the message as inbound and fired the webhook automatically
3. Verified via PM2 logs, database, API, and TextMagic chat history

## Timeline (all times UTC, 2026-04-07)

| Time | Event | Source |
|------|-------|--------|
| 22:06:22 | Inbound SMS arrives at TextMagic from 18338096836 to 18338935694 | TextMagic chat history |
| 22:06:23 | **Webhook #1** received. Org resolved via receiver phone: Serra Honda | PM2 log |
| 22:06:23 | Conversation created: `9cab0023-81c5-400b-8d73-4b41bcb01cf6` | DB |
| 22:06:23 | After-hours check (section 1, defaults 07-22): **within hours** (18:06 ET) | Code path |
| 22:06:23 | Auto-greeting check (section 2, defaults 09:00-17:00): **after hours** (18:06 ET >= 17:00) | PM2 log |
| 22:06:23 | Conversation tagged for morning followup | PM2 log |
| 22:06:24 | **Webhook #2** (duplicate delivery) received. Same message processed again | PM2 log |
| 22:06:24 | Second inbound message stored (duplicate) | DB |
| 22:06:24 | Caroline auto-greeting sent to 18338096836 via TextMagic (messageId: 1388736302) | PM2 log, TextMagic |
| 22:06:25 | Auto-greeting message stored in conversation | DB |
| 22:06:26 | Nancy Gaston AI response sent (messageId: 1388736308) | PM2 log, TextMagic |
| 22:06:27 | AI response message stored in conversation | DB |

## Messages in Conversation (DB verified)

| # | Role | Sender | Content | Time |
|---|------|--------|---------|------|
| 1 | user | 18338096836 | Hi, I saw your ad for the Honda Civic. Is it still available? | 22:06:23 |
| 2 | user | 18338096836 | Hi, I saw your ad for the Honda Civic. Is it still available? | 22:06:24 |
| 3 | agent | Caroline | Hi 18338096836! This is Caroline from Serra Honda. Thank you for your interest -- I'd love to help you find the perfect vehicle. What are you looking for? | 22:06:25 |
| 4 | agent | Nancy Gaston | Hi there! Yes, we do have Honda Civics available at Serra Honda. Which trim level or features were you most interested in, and I can check what we have in stock for you? | 22:06:27 |

## TextMagic Chat Verification (external)

Confirmed via `tm_get_chat_by_phone` and `tm_get_chat_messages` for chat 42112736:
- [i] 18338096836 at 22:06:22: "Hi, I saw your ad for the Honda Civic. Is it still available?"
- [o] 18338935694 at 22:06:24: Caroline auto-greeting (DELIVERED)
- [o] 18338935694 at 22:06:26: Nancy AI response (DELIVERED)

## Auto-Greeting Configuration

**Agent:** Caroline
**Template:** `Hi {{customerName}}! This is {{agentName}} from {{dealershipName}}. Thank you for your interest -- I'd love to help you find the perfect vehicle. What are you looking for?`
**Status:** active
**Channels:** {voice, video, sms}
**After-hours template:** Not configured (settings: `{}`)

**Merge field resolution:**
- `{{customerName}}` -> `18338096836` (raw phone, no contact name resolved)
- `{{agentName}}` -> `Caroline`
- `{{dealershipName}}` -> `Serra Honda`

## PASS / FAIL Summary

| Check | Result | Notes |
|-------|--------|-------|
| Inbound SMS triggers webhook | PASS | TextMagic fires webhook to /api/webhooks/textmagic |
| Org resolved from receiver phone | PASS | Serra Honda resolved via textmagicPhone setting |
| New conversation created | PASS | Conversation 9cab0023 created with channel=sms |
| Auto-greeting agent found | PASS | Caroline found (autoGreeting set, status=active) |
| Auto-greeting merge fields resolved | PARTIAL | customerName resolves to raw phone (no name lookup) |
| Auto-greeting SMS sent | PASS | messageId 1388736302 confirmed in TextMagic |
| Auto-greeting stored in conversation | PASS | Agent message with senderName=Caroline |
| Usage event logged | PASS | outbound_sms with source=auto_greeting |
| Activity log created | PASS | after_hours_response_sent logged |
| AI follow-up response sent | PASS | Nancy Gaston AI agent responded contextually |

## Bugs Found

### BUG-AG-01: Duplicate webhook delivery causes duplicate inbound message

**Severity:** Medium
**Location:** server/routes/sms.ts, lines 234-307

TextMagic delivered TWO webhook calls for the same inbound SMS (1 second apart). The conversation lock (`withConversationLock`) correctly prevented duplicate conversation creation -- the second webhook hit the existing conversation path. However, both webhooks stored the inbound message, resulting in TWO identical "user" messages in the conversation.

**Impact:** Customer sees their message duplicated in TeamBox. The second webhook also triggered the AI response path (Nancy Gaston responded), because the `isNew` flag was false on the second call so auto-greeting didn't fire again, but the AI response block (lines 438-526) runs for ALL non-after-hours inbound messages regardless of `isNew`.

**Root cause:** No deduplication on the message content + sender + timestamp within a short window.

### BUG-AG-02: Inconsistent business hours defaults between two code sections

**Severity:** Medium
**Location:** server/routes/sms.ts

The after-hours auto-response section (lines 167-232) defaults to:
- `businessHoursStart = "07"` (parsed as integer hour)
- `businessHoursEnd = "22"` (parsed as integer hour)

The auto-greeting section (lines 321-335) defaults to:
- `businessHoursStart = "09:00"` (parsed as HH:MM)
- `businessHoursEnd = "17:00"` (parsed as HH:MM)

At 18:06 ET, the first section evaluates as "within hours" (18 < 22) while the second evaluates as "after hours" (18:06 >= 17:00). This means:
- No after-hours auto-response was sent (first section says "within hours")
- But the auto-greeting tagged the conversation for "morning followup" (second section says "after hours")
- Activity log recorded `after_hours_response_sent` even though the regular greeting was sent

**Fix:** Unify business hours defaults to a single source. Both sections should use the same defaults (recommend 09:00-17:00 as more conservative).

### BUG-AG-03: customerName merge field resolves to raw phone number

**Severity:** Low
**Location:** server/routes/sms.ts, line 367

The auto-greeting template replaces `{{customerName}}` with `normalizedPhone` (the raw phone number). The resulting message reads: "Hi 18338096836! This is Caroline from Serra Honda..."

For a new inbound contact, there's no customer name available. The code should either:
- Omit the customerName greeting entirely for unknown contacts
- Use a generic fallback like "there" instead of the phone number

### BUG-AG-04: Both auto-greeting AND AI agent respond to same inbound

**Severity:** Medium
**Location:** server/routes/sms.ts

When `isNew = true`, the auto-greeting fires (Caroline's template). Then separately, the AI response block (lines 438-526) ALSO fires because it runs for all non-after-hours messages. On the second (duplicate) webhook, `isNew = false` so auto-greeting skips, but the AI response fires again (Nancy Gaston responds).

Result: the customer received THREE outbound SMS within 4 seconds:
1. Caroline's auto-greeting (from auto-greeting code)
2. After-hours auto-response (from first section -- actually NOT sent in this case due to first-section business hours)
3. Nancy Gaston's AI response (from AI response block on duplicate webhook)

The auto-greeting and AI response should be mutually exclusive for new conversations, or the AI response should detect that an auto-greeting was just sent and skip.

### BUG-AG-05: After-hours scheduled followup not created

**Severity:** Low
**Location:** server/routes/sms.ts, lines 207-224

The after-hours section (first code block) did not trigger because its business hours check (07-22) said "within hours." But if it HAD triggered, the `storage.createScheduledAction()` call would have created a scheduled followup. The `scheduled_actions` table is empty, confirming this path was never taken. This is correct behavior given the first section's evaluation, but highlights the inconsistency with BUG-AG-02.

## Org Configuration Gaps

| Setting | Current Value | Recommended |
|---------|--------------|-------------|
| businessHoursStart | Not set (defaults vary: 07 or 09:00) | Set explicitly, e.g., "09:00" |
| businessHoursEnd | Not set (defaults vary: 22 or 17:00) | Set explicitly, e.g., "17:00" |
| timezone | Not set (defaults to America/New_York) | Set explicitly |
| afterHoursMessage | Not set | Set if after-hours auto-response desired |
| Caroline agent afterHoursResponse | Not set (settings: {}) | Set if different after-hours greeting desired |

## Conclusion

The auto-greeting pipeline works end-to-end: inbound SMS -> webhook -> org resolution -> conversation creation -> agent lookup -> template merge -> outbound SMS send -> message storage -> activity/usage logging. Caroline's auto-greeting was sent and confirmed delivered in TextMagic within 2 seconds of the inbound.

However, 4 bugs were identified: duplicate message storage from double webhook delivery, inconsistent business hours defaults, raw phone number in greeting, and both auto-greeting and AI agent responding to the same conversation. These should be addressed before production launch.
