# Communications Investigation Report

**Date:** 2026-04-07
**Investigator:** Claude (research-only, no code changes)
**Scope:** Why is the operator not receiving text messages or emails for inbound leads or outbound service campaigns?

---

## Executive Summary

The communications pipeline has **multiple independent problems** at different layers. No single fix resolves everything. The system IS capable of sending (evidence exists in logs), but several blockers prevent reliable delivery.

---

## Finding 1: OUTBOUND_LIVE_ENABLED is ON (not the blocker)

- `.env` contains `OUTBOUND_LIVE_ENABLED=true`
- The `checkCommGate()` function in `server/outbound.ts:246` checks this first
- **Status: WORKING** -- this gate is open

## Finding 2: Org-Level Channel Flags Default to FALSE

Schema (`shared/schema.ts:18-21`):
```
outboundEnabled: boolean("outbound_enabled").notNull().default(false)
smsEnabled: boolean("sms_enabled").notNull().default(false)
phoneEnabled: boolean("phone_enabled").notNull().default(false)
emailEnabled: boolean("email_enabled").notNull().default(false)
```

The seed file (`server/seed.ts`) sets these to `true` for most orgs (Serra Honda, Serra Nissan, Tony Serra Ford, Cage Automotive, Hyundai of Columbia, Ford of Columbia). However, Huminic org is seeded with `outboundEnabled: false` (line 279/805).

**The CommGate in `server/outbound.ts:250-265` checks these per-channel flags.** If any org has `outboundEnabled=false`, ALL outbound for that org is blocked. If `smsEnabled=false`, SMS is blocked. If `emailEnabled=false`, email is blocked.

The lead notification email function (`server/routes/webhooks.ts:162`) also checks:
```typescript
if (!org || !org.outboundEnabled || !org.emailEnabled) {
    // logs "CommGate blocked" and returns
}
```

**CRITICAL:** Cannot verify actual DB values without running a query (captain hook blocks execution). The seed sets correct values, but if any org was created or modified outside the seed, flags could be wrong.

**Action needed:** Query `SELECT id, name, outbound_enabled, sms_enabled, email_enabled, phone_enabled FROM organizations` to verify actual DB state.

## Finding 3: `communication_gate_enabled` Column Does NOT Exist

The eval mentioned `communicationGateEnabled=null` for Serra Honda. This column does not exist in the schema. The actual CommGate system uses:
- `outbound_enabled` (master switch)
- `sms_enabled`, `email_enabled`, `phone_enabled`, `video_enabled` (per-channel)

There is NO `communication_gate_enabled` column. The eval finding was based on a non-existent field.

## Finding 4: Trigger Engine IS Running But Has Issues

From PM2 logs:
```
6:25:01 PM [triggers] Trigger "undefined": 3 leads due for 48h follow-up for agent Caroline
6:25:01 PM [triggers] Trigger "undefined": sending follow-up SMS to 5559999999 for Test
```

**Issues observed:**
1. Trigger name is `"undefined"` -- the trigger JSON objects in agent.triggers[] don't have `name` set
2. Sends going to `5559999999` (test number) -- these are test/fake lead records from warehouse
3. Real SMS DID send to `+18392729080` via TextMagic/MCP -- at least some sends work
4. The trigger scheduler runs every 15 minutes (`scheduler.ts:428`)

## Finding 5: Inbound SMS Org Resolution Failing (25 failures)

Error log contains 25 instances of:
```
[TextMagic Webhook] Cannot resolve organization for unknown phone -- multiple orgs exist, no fallback to arbitrary org
```

When an inbound SMS arrives, `server/routes/sms.ts` tries 3 resolution methods:
1. Match receiver phone to org's `textmagicPhone` setting
2. Look up last outbound to that sender
3. Look up org by phone from contacts

If all fail and there are multiple orgs, the webhook gives up silently (returns 200 with no action). This means **inbound SMS replies from customers are being silently dropped** if the system can't figure out which org they belong to.

## Finding 6: Lead Notification Emails ARE Sending (for some cases)

```
[LeadNotify] Resolved 6 recipient(s) for org "Serra Honda": orgadmin@serrahonda.com, executive@serrahonda.com, salesmanager@serrahonda.com, serra_honda@huminic.ai, durran.cage@cageautomotive.com, duane.wells@huminic.ai
[LeadNotify] Sent "... Serra Honda Has a New AI Voice Lead!" to 5 admin(s)
```

**BUT:** Most recipients are seed/test accounts (`orgadmin@serrahonda.com`, `executive@serrahonda.com`, `salesmanager@serrahonda.com`). These are not real email addresses. Only `serra_honda@huminic.ai`, `durran.cage@cageautomotive.com`, and `duane.wells@huminic.ai` might be real.

The exclusion filter (`webhooks.ts:231-236`) removes emails matching `admin@` and `@nexxus.com`/`@test.com`, but does NOT filter obviously-fake seed accounts like `orgadmin@serrahonda.com`.

## Finding 7: TextMagic API Configured Via MCP Only

Error log shows:
```
WARNING: Missing optional environment variables (some features will be disabled): TEXTMAGIC_USERNAME, TEXTMAGIC_API_KEY
```

TextMagic credentials are NOT in `.env` directly. All SMS routing goes through central-mcp (`callMCP("tm_send_message", ...)`). This is correct by design, but means the old direct TextMagic path is broken. The MCP path IS working -- evidence: `[TextMagic/MCP] SMS sent to +18392729080, messageId: 1388605145`.

## Finding 8: Campaign Execution Failures

```
POST /api/campaigns/fd8f9c6a.../execute 400
POST /api/campaigns/6e88a966.../execute 400
POST /api/campaigns/d6cd5390.../execute 403
```

Campaign execution returning 400 means "No pending recipients to process" or other validation failure. The 403 means kill switch is active on that campaign. Without querying the DB, cannot confirm which.

## Finding 9: Resend API Rate Limits Exhausted (from issues.md)

Issue I-239: "483 failed lead notification emails in error log. Lead generation rate exceeds Resend plan limits."

This means even when emails SHOULD send, the Resend API may reject them due to rate limits on the current plan.

## Finding 10: Business Hours Gate Blocks SMS/Phone

`server/outbound.ts:267-275`: SMS and phone outbound are gated by business hours (default 8 AM - 9 PM ET). If campaign execution or trigger actions fire outside this window, they are blocked with reason "Outside business hours."

---

## Root Cause Analysis

There is no single blocker. The system has a **chain of gates**, and messages can be blocked at any point:

| Gate | What it checks | Status | Blocking? |
|------|---------------|--------|-----------|
| OUTBOUND_LIVE_ENABLED | Global kill switch | `true` | No |
| org.outboundEnabled | Master org switch | Needs DB query | POSSIBLY |
| org.smsEnabled | SMS channel flag | Needs DB query | POSSIBLY |
| org.emailEnabled | Email channel flag | Needs DB query | POSSIBLY |
| Business hours | 8am-9pm ET | Depends on time | Sometimes |
| Campaign kill switch | Per-campaign | Some campaigns have 403 | Yes (some) |
| Blacklist check | Per-phone | Unknown | Unknown |
| Rate limit | 100/24h per recipient | Unknown | Unknown |
| Resend API limits | Plan tier | Exhausted (I-239) | YES for email |
| TextMagic via MCP | MCP connectivity | Working | No |
| Inbound SMS routing | Org resolution | 25 failures | YES for inbound |

---

## Specific Blockers (Ranked by Impact)

### BLOCKER 1: Cannot verify org channel flags without DB query
The most likely root cause is that `outbound_enabled`, `sms_enabled`, or `email_enabled` are `false` in the database for one or more production orgs. The schema defaults them to `false`. If any org was re-created or the seed didn't run correctly, these would block ALL communications.

**Fix:** Run the DB query from the investigation checklist. If flags are false, update them:
```sql
UPDATE organizations SET outbound_enabled=true, sms_enabled=true, email_enabled=true, phone_enabled=true WHERE name IN ('Serra Honda', 'Serra Nissan', 'Tony Serra Ford', 'Hyundai of Columbia', 'Ford of Columbia');
```

### BLOCKER 2: Inbound SMS org resolution failing silently
25+ inbound SMS messages dropped because the system can't determine which org they belong to. Each org needs its `textmagicPhone` setting configured in `organization.settings` JSON.

**Fix:** Ensure every org has a unique `textmagicPhone` in its settings, matching the TextMagic number assigned to it.

### BLOCKER 3: Resend API rate limits exhausted
Email sends fail silently when Resend rate limits are hit.

**Fix:** Upgrade Resend plan or add throttling/batching to email sends.

### BLOCKER 4: Lead notification emails going to seed accounts
Notification recipients include fake seed accounts (`orgadmin@serrahonda.com`, `salesmanager@serrahonda.com`) that don't exist. These count against rate limits and produce bounces.

**Fix:** Either deactivate seed users (`is_active=false`) or add stricter email domain filtering.

### BLOCKER 5: Trigger names are undefined
All trigger log entries show `Trigger "undefined"` -- the trigger objects in agent JSON don't have `name` property set. This is a data quality issue, not a functional blocker, but makes debugging impossible.

---

## What IS Working

1. Scheduler is running (campaigns every 60s, triggers every 15m, scheduled actions every 30s)
2. TextMagic SMS sending via MCP (confirmed sends to +18392729080)
3. Lead notification email template and hierarchy resolution
4. VAPI webhook processing and conversation creation
5. OUTBOUND_LIVE_ENABLED global gate is open
6. Central MCP (port 4002) and VIN Safe MCP (port 4003) are both responding

## What Is NOT Working / Needs Verification

1. Org channel flags in DB (cannot verify without query -- captain hook blocks)
2. Inbound SMS org routing (25 failures)
3. Resend email delivery reliability (rate limits)
4. Campaign execution (400/403 errors on multiple campaigns)
5. Trigger data quality (undefined names, test phone numbers in warehouse)

---

## Recommended Next Steps

1. **IMMEDIATE:** Run the org channel flags query to confirm or rule out the most likely blocker
2. **IMMEDIATE:** Check outbound_log table for blocked/failed entries with reasons
3. **SHORT-TERM:** Configure textmagicPhone per org to fix inbound routing
4. **SHORT-TERM:** Deactivate seed users or upgrade Resend plan
5. **MEDIUM-TERM:** Add a comms health-check endpoint that reports gate status per org
