# Autonomous Communications E2E Test

**Date:** 2026-03-28T18:49:00Z - 2026-03-28T19:02:00Z
**Environment:** dev.huminicdev.com
**Runner:** Dev agent (autonomous)
**Auth:** serra_honda@huminic.ai (org_admin, Serra Honda)

## Results

| Test | Flow | Result | Detail |
|------|------|--------|--------|
| 1 | Inbound SMS -> AI Response | PARTIAL | Webhook created conversation. AI auto-response did NOT fire (see Issues). |
| 2 | Human Takeover | PASS | assignedTo set, second inbound SMS produced no AI response. Takeover logic works. |
| 3 | Outbound Campaign -> Reply | PARTIAL | Campaign created, CSV uploaded, execution ran. Send failed (fake number). Reply webhook created new conversation (not linked to campaign since original send failed). |
| 4 | Kill Switch Blocks Outbound | PASS | outboundEnabled=false blocked campaign send (blocked=1, sent=0). CommGate restored immediately. |
| 5 | Voice Call (Elliott -> Caroline) | PASS | VAPI call placed, connected, 21s duration. Transcript captured (4 messages). Voice conversation created in app via webhook. Cost: $0.0338. |
| 6 | Email Notification Check | PASS | 3 emails sent at 18:53:12 UTC ("Serra Honda Has a New AI Voice Lead!") to serra_honda@huminic.ai, duane.wells@huminic.ai, duanekwells@gmail.com. Triggered by Test 5 voice call. |
| 7 | Tavus Video Session | PASS | Tavus conversation created (ID: c62cfbe68af31445). URL: https://tavus.daily.co/c62cfbe68af31445. Status: active. |
| 8 | AI Chat + Tool Use | PASS | Two-turn conversation with tool invocation. First query: "169 active leads" (VinSolutions CRM data). Follow-up: "86 leads waiting for response". Multi-turn context maintained. |
| 9 | TeamBox Verification | PASS | TeamBox shows SMS (10), Email (2), Phone (35). Test conversations 15557771001 and 15557771002 visible in SMS filter. VAPI call logs visible in Phone tab with our test call at 6:52:40 PM. Screenshots captured. |
| 10 | Rate Limit Edge Case | INCONCLUSIVE | All 3 campaign sends failed at TextMagic API level (fake numbers). Rate limiter never reached. Cannot test with synthetic numbers -- requires real deliverable numbers. Default rate limit is 100/24h per org (not 3). |

## Critical Flow Status

| Flow | Status | Evidence |
|------|--------|----------|
| SMS Inbound | PARTIAL | Test 1: Webhook accepted, conversation created. AI auto-response absent. |
| SMS Outbound (Campaign) | PARTIAL | Test 3: Campaign execution pipeline works. TextMagic send fails on fake numbers. |
| Voice Inbound (VAPI) | PASS | Test 5: Elliott called Caroline. 21s call, transcript captured, conversation created. |
| Kill Switch | PASS | Test 4: blocked=1 when outboundEnabled=false. |
| Email Notification | PASS | Test 6: 3 emails sent via Resend within seconds of voice call. |
| Video (Tavus) | PASS | Test 7: Session created via API, URL returned. |
| AI Chat + Tools | PASS | Test 8: CRM data retrieved, multi-turn context maintained. |
| TeamBox | PASS | Test 9: All channels visible, test conversations present. Screenshots saved. |
| Rate Limiting | INCONCLUSIVE | Test 10: Cannot reach rate limiter with fake numbers. |

## Issues Found

### ISSUE 1: AI Auto-Response Not Firing on Inbound SMS (Test 1)
**Severity:** High
**Detail:** Inbound SMS webhook successfully creates conversation, but no AI response is generated. The code at `server/routes/sms.ts:409` checks `process.env.OUTBOUND_LIVE_ENABLED !== "true"` before allowing AI responses. This env var is set in local `.env` but may not be configured in the Coolify deployment environment.
**Root cause candidates:**
1. `OUTBOUND_LIVE_ENABLED` not set to `true` in Coolify env vars
2. `AI_INTEGRATIONS_ANTHROPIC_API_KEY` not set or invalid in deployment
3. AI response generation failing silently (fire-and-forget async block at line 394)
**Fix:** Verify Coolify env vars include `OUTBOUND_LIVE_ENABLED=true` and valid Anthropic API key. Check server logs for `[SMS AI]` entries.

### ISSUE 2: Org Missing textmagicPhone Setting (Pre-test)
**Severity:** Medium (fixed during test)
**Detail:** Serra Honda org did not have `textmagicPhone` in settings. This caused all inbound SMS webhooks to return "unresolvable sender" because the receiver number couldn't be mapped to an org. Fixed by PATCH to org settings adding `textmagicPhone: "+18339785374"`.
**Note:** This setting should be configured during org onboarding. If it was previously set and removed, investigate why.

### ISSUE 3: Campaign Reply Not Linked to Campaign (Test 3)
**Severity:** Low
**Detail:** When a campaign send fails (TextMagic rejects the number), no outbound record is created. If the recipient then replies via webhook, the new conversation has `campaignId: null` because there's no outbound history linking the phone to the campaign. This is expected behavior -- you can't link a reply to a campaign that never successfully sent.

### ISSUE 4: Rate Limit Default is 100, Not 3 (Test 10)
**Severity:** Info
**Detail:** Test spec assumed 3 messages per 24h per number. Actual default in `server/outbound.ts` is `DEFAULT_RATE_LIMIT_MAX = 100` per 24h per org (not per number). Per-number rate limiting is not implemented -- the limit is org-wide outbound volume. Configurable via `org.settings.rateLimitMax`.

### ISSUE 5: Voice Call EndedReason is "exceeded-max-duration" (Test 5)
**Severity:** Low
**Detail:** The VAPI call ended with reason `exceeded-max-duration` after 21s, which seems premature. Elliott's assistant may have a very short max duration configured. The call still completed successfully with a valid transcript, but the end reason suggests the max duration config should be reviewed.

## Evidence Artifacts

- `evidence/teambox-screenshot-2026-03-28.png` -- TeamBox overview
- `evidence/teambox-sms-filtered-2026-03-28.png` -- SMS conversations showing test entries
- `evidence/teambox-phone-2026-03-28.png` -- VAPI call logs showing test call

## Test Conversations Created

| ID | Phone | Channel | Source |
|----|-------|---------|--------|
| cc67a7b1-123a-4115-8b2e-b0bebeed0248 | 15557771001 | sms | Test 1 & 2 |
| b5276d31-a5c3-4274-878f-02c13865caee | 15557771002 | sms | Test 3 reply |
| ca587488-b384-4d13-92c7-2f707e0f7922 | +18392729080 | voice | Test 5 |
| bfb8fbdc-c8b8-44d8-bafe-4ec12f73dfab | -- | ai-chat | Test 8 |

## Campaigns Created (all marked completed)

| ID | Name | Result |
|----|------|--------|
| cace9527-1507-4892-be3f-e277fefa79d0 | E2E-AUTO-TEST-1774723876 | 1 recipient, 0 sent, 1 failed |
| 44566b90-8b60-4943-8883-ea0a302bd5d2 | E2E-KILLSWITCH-TEST-* | 1 recipient, 0 sent, 1 blocked (kill switch) |
| 5ab565f9-6cde-435a-904e-82dc13562d7f | E2E-RATELIMIT-A-* | 1 recipient, 0 sent, 1 failed |
| d73e5be2-1026-4cc2-a4c3-8912a385d4d4 | E2E-RATELIMIT-B-* | 1 recipient, 0 sent, 1 failed |
| 3de473ab-3056-47ee-9013-86d39f9d01a6 | E2E-RATELIMIT-C-* | 1 recipient, 0 sent, 1 failed |

## Cleanup

- Campaigns created: 5 (all marked as completed)
- CommGate restored: YES (outboundEnabled: true confirmed)
- Test conversations: 4 (listed above, left open for review)
- Org settings modified: Added textmagicPhone to Serra Honda org (required for SMS routing)
- Tavus session created: c62cfbe68af31445 (will auto-expire)
