# PE-INTEGRATIONS-03 — Bug Log

## BUG-INT-06: Tavus callback URL hardcoded to production

**Severity:** Medium
**File:** server/vendorProxy.ts:411
**Code:** `callback_url: "https://live.huminic.app/api/webhooks/tavus"`
**Impact:** When Tavus conversations are created from the dev environment (dev.huminicdev.com), the callback URL points to production (live.huminic.app). This means:
- Dev-created Tavus sessions will fire webhooks to production, not dev
- Dev environment will never receive Tavus conversation.end webhooks
- Could create duplicate conversations if both dev and prod process the same webhook
**Fix:** Use `process.env.APP_BASE_URL` or a configurable callback URL instead of hardcoded string.

## BUG-INT-07: Missing webhook secrets for TextMagic and VAPI

**Severity:** Low-Medium
**Finding:** TEXTMAGIC_WEBHOOK_SECRET and VAPI_WEBHOOK_SECRET are not set in .env
**Impact:** Both webhook handlers check for these secrets but treat them as optional — if not set, the validation is skipped entirely. This means any HTTP client can POST to /api/webhooks/textmagic or /api/webhooks/vapi and create conversations/leads.
**Note:** TAVUS_WEBHOOK_SECRET IS set, so Tavus webhooks are authenticated.
**Fix:** Set TEXTMAGIC_WEBHOOK_SECRET and VAPI_WEBHOOK_SECRET in .env to prevent unauthenticated webhook injection.

## BUG-INT-08: VIN lead auto-approval in webhook handlers

**Severity:** Informational (design decision, not bug)
**File:** server/routes/webhooks.ts:817 (VAPI), webhooks.ts:1165 (Tavus)
**Code:** `user_confirmed: true` passed without human review
**Context:** The VIN Safe MCP protocol requires prepare -> review -> execute. The webhook handlers call prepare, then immediately execute with `user_confirmed: true`. This is by design for the automated voice/video -> CRM pipeline but should be documented as an intentional override of the human-review step.
**Impact:** VIN leads are created automatically from any call with a transcript and non-test phone number. If a spam call produces a transcript, it will create a VIN lead.

## BUG-INT-09: VIN lead creation frequently fails

**Severity:** Medium
**Evidence:** 5 "VIN Lead Prepare Failed" escalation tasks in DB (all archived, most recent 2026-04-05)
**Impact:** VIN lead auto-creation from VAPI/Tavus webhooks is failing at the prepare step. The escalation tasks are created correctly, but the root cause (likely vin-safe-mcp connectivity or configuration) is not resolved.
**Note:** VIN_SAFE_MCP_TOKEN and VIN_SAFE_MCP_URL are not set in .env — the code uses hardcoded defaults (http://0.0.0.0:4003, hardcoded token). This should work if vin-safe-mcp is running on port 4003.

## GAP-INT-01: No Resend delivery webhook

**Severity:** Low
**Impact:** Email delivery status (delivered, bounced, complained) is not tracked. The system logs "sent" when the API call succeeds but has no way to know if the email was actually delivered.
**Note:** Resend supports webhooks for delivery events. Adding a /api/webhooks/resend handler would enable tracking bounces and complaints.

## NOTE-INT-01: Video conversations table empty

**Observation:** 0 rows in conversations table with channel='video' despite 180 tavus_video_completed activity logs
**Possible explanations:**
- Tavus webhook may have been pointed at production (callback URL is hardcoded to live.huminic.app)
- Database may have been cleaned/pruned
- The 180 activity logs may be from production, not dev
**Impact:** Cannot verify Tavus -> TeamBox flow in current dev database state

## NOTE-INT-02: Dual Resend integration pattern

**Observation:** Resend is used via two different patterns:
1. MCP route: callMCP("resend_send_email") — used for lead notifications and conversation emails
2. Direct SDK: `new Resend(process.env.RESEND_API_KEY)` — used for password resets, welcome/invite emails
**Impact:** No functional bug, but inconsistent pattern. MCP route goes through central-mcp which adds logging/monitoring. Direct SDK bypasses that.
