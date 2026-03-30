# Email Webhook Analysis -- Dev vs Live

**Date:** 2026-03-29
**Analyst:** Dev agent (exploratory, read-only)

---

## Email-Sending Code Paths

### Path 1: VAPI End-of-Call Webhook Email
- **File:** `server/routes/webhooks.ts` (line 857)
- **Trigger:** VAPI `end-of-call-report` or `call-ended` webhook fires
- **Content:** Rich HTML "New AI Voice Lead" notification with call summary, transcript, recording link, caller details
- **Recipients:** All org admins (level 3), partner admins (level 2 via partnerId walk), super admins (level 1 from all orgs), plus any user (level <= 3) with this orgId in their `additionalOrgIds`. Excludes `admin@` and `@nexxus.com`/`@test.com` addresses.
- **CommGate check:** YES -- `sendLeadNotificationEmail()` checks `org.outboundEnabled && org.emailEnabled` before sending (line 162)
- **From address:** `Nexxus Connect <notifications@huminic.ai>`
- **Send mechanism:** `callMCP("resend_send_email", ...)` via central-mcp
- **Idempotency:** YES -- checks outbound_log for `[notification:vapi-{callId}]` to prevent duplicates

### Path 2: Tavus End-of-Video Webhook Email
- **File:** `server/routes/webhooks.ts` (line 1136)
- **Trigger:** Tavus `conversation.end` / `conversation_ended` / `status: ended` webhook fires
- **Content:** Rich HTML "New Video Session Lead" notification with session summary, transcript
- **Recipients:** Same hierarchy as VAPI (via shared `sendLeadNotificationEmail()`)
- **CommGate check:** YES -- same function, same checks
- **From address:** `Nexxus Connect <notifications@huminic.ai>`
- **Send mechanism:** `callMCP("resend_send_email", ...)` via central-mcp
- **Idempotency:** YES -- `[notification:tavus-{conversationId}]`

### Path 3: Unanswered Conversation Escalation Email
- **File:** `server/services/scheduler.ts` (line 467)
- **Trigger:** Scheduled job every 5 minutes checks for unanswered conversations (30+ min wait)
- **Content:** HTML "Unanswered Message Alert" with contact name, phone, channel, waiting time, message preview, link to TeamBox
- **Recipients:** First active org_admin found for the conversation's org
- **CommGate check:** PARTIAL -- checks `org.emailEnabled` only (line 445), does NOT check `org.outboundEnabled`
- **From address:** `Nexxus Connect <no-reply@huminic.app>`
- **Send mechanism:** Direct Resend SDK (`new Resend().emails.send(...)`)
- **Idempotency:** YES -- `storage.markEscalationSent(conv.id)`

### Path 4: Password Reset Email
- **File:** `server/routes/auth.ts` (line 390)
- **Trigger:** `POST /api/auth/forgot-password` API call
- **Content:** HTML with personalized reset link
- **Recipients:** The requesting user (by email)
- **CommGate check:** YES -- checks `org.outboundEnabled && org.emailEnabled` (line 385)
- **From address:** `Nexxus Connect <notifications@huminic.ai>`
- **Send mechanism:** Direct Resend SDK (`new Resend().emails.send(...)`)
- **Link generation:** Uses `req.protocol + req.get("host")` -- dynamically picks dev vs live host

### Path 5: Welcome Email (User Created)
- **File:** `server/routes/users.ts` (line 97)
- **Trigger:** `POST /api/users` -- admin creates a new user
- **Content:** HTML welcome message with org name and creator name
- **Recipients:** The newly created user
- **CommGate check:** YES -- checks `org.outboundEnabled && org.emailEnabled` (line 90)
- **From address:** `Nexxus Connect <no-reply@huminic.app>`
- **Send mechanism:** Direct `fetch("https://api.resend.com/emails", ...)` with RESEND_API_KEY

### Path 6: Invite Email
- **File:** `server/routes/users.ts` (line 349)
- **Trigger:** `POST /api/users/invite` -- admin invites a user
- **Content:** HTML with temporary credentials (email + password in plaintext)
- **Recipients:** The invited user
- **CommGate check:** YES -- checks `org.outboundEnabled && org.emailEnabled` (line 343)
- **From address:** `Nexxus Connect <onboarding@resend.dev>` (NOTE: uses Resend sandbox domain!)
- **Send mechanism:** Direct `fetch("https://api.resend.com/emails", ...)`

### Path 7: Campaign Email (Outbound)
- **File:** `server/outbound.ts` (line 119)
- **Trigger:** Campaign execution sends to recipients with `channel: "email"`
- **Content:** Campaign message template with variable substitution
- **Recipients:** Campaign recipient's email
- **CommGate check:** YES -- full `checkCommGate()` (global kill switch, org-level, channel-level, rate limiting, blacklist, business hours)
- **From address:** `Nexxus Connect <notifications@huminic.ai>`
- **Send mechanism:** `callMCP("resend_send_email", ...)` via central-mcp

### Path 8: Conversation Email Send
- **File:** `server/routes/conversations.ts` (line 174)
- **Trigger:** `POST /api/conversations/:id/email` -- manual email send from TeamBox
- **Content:** User-composed email (to, subject, body)
- **Recipients:** User-specified recipient
- **CommGate check:** NO -- only checks `RESEND_API_KEY` existence. No CommGate, no outbound checks.
- **From address:** `{orgName} <notifications@huminic.ai>`
- **Send mechanism:** `callMCP("resend_send_email", ...)`

### Path 9: Trigger-Action Email (Scheduler)
- **File:** `server/services/scheduler.ts` (line 159)
- **Trigger:** Stale lead or follow-up trigger fires with `actionType: 'email'`
- **Content:** Follow-up message template
- **Recipients:** Customer email from lead/conversation
- **CommGate check:** YES -- goes through `processOutboundSend()` which calls full `checkCommGate()`
- **From address:** `Nexxus Connect <notifications@huminic.ai>`
- **Send mechanism:** `callMCP("resend_send_email", ...)` via `processOutboundSend()`

---

## Environment Configuration

### .env Analysis (single file -- used by both dev and live)

| Variable | Value | Impact |
|---|---|---|
| `RESEND_API_KEY` | `re_RJnKb56W_E7yziAFnHWxNfvi1LMkpYGXM` | Set -- emails WILL send |
| `NODE_ENV` | `development` | Set in .env but overridden to `production` by docker-compose and Dockerfile |
| `OUTBOUND_LIVE_ENABLED` | `true` | Global outbound kill switch is ON |
| `APP_BASE_URL` | Not set (removed) | Comment says "uses request host automatically" |
| `CORS_ORIGINS` | `https://dev.huminicdev.com,https://live.huminic.app,https://nexxusdev.huminicdev.com` | Both domains allowed |
| `DATABASE_URL` | Supabase pooler URL | **SAME database for both** |

### Critical Finding: Single .env, Single Database

There is NO `.env.production`, `.env.live`, `.env.staging`, or any environment-specific config file. The `.env` file is the only one. The `docker-compose.yml` uses `env_file: .env` and only overrides `NODE_ENV=production`.

Both dev (`dev.huminicdev.com`) and live (`live.huminic.app`) deployments:
- Use the **same RESEND_API_KEY**
- Connect to the **same Supabase database**
- Use the **same OUTBOUND_LIVE_ENABLED=true** setting
- Use the **same VAPI/Tavus API keys**

### NODE_ENV Differences

Only one email-related behavior differs by NODE_ENV:
- `scheduler.ts:10` -- `initDevDefaults()` skips setting default textmagicPhone in production. This does NOT affect email behavior.

---

## Webhook Email Triggers

### VAPI Webhook (`POST /api/webhooks/vapi`)
- **Sends email:** YES -- calls `sendLeadNotificationEmail()` on every `end-of-call-report` / `call-ended` event
- **Recipients:** All admins in the org hierarchy (level 1, 2, 3 + additionalOrgIds users)
- **CommGate gated:** YES
- **Same behavior dev vs live:** YES -- identical code path, same API key, same database

### Tavus Webhook (`POST /api/webhooks/tavus`)
- **Sends email:** YES -- calls `sendLeadNotificationEmail()` on every `conversation.end` / `conversation_ended` event
- **Recipients:** Same admin hierarchy
- **CommGate gated:** YES
- **Same behavior dev vs live:** YES -- identical code path

### CRITICAL: Tavus Callback URL Hardcoded to Live
- `server/vendorProxy.ts:370` -- `callback_url: "https://live.huminic.app/api/webhooks/tavus"`
- `server/routes/public.ts:465` -- `callback_url: "https://live.huminic.app/api/webhooks/tavus"`
- `server/routes/widgets.ts:54` -- `callback_url: "https://live.huminic.app/api/webhooks/tavus"`

ALL Tavus conversations created from ANY environment will send their webhook to `live.huminic.app`, never to `dev.huminicdev.com`. This means:
- Dev-created Tavus sessions produce webhook emails from the live instance
- If the dev instance is tested with Tavus, the live instance processes the webhook and sends the email

---

## Deployment Configuration

### Docker / Coolify Setup
- **Dockerfile:** Multi-stage Node 20 Alpine build. Sets `NODE_ENV=production`. Runs `dist/index.cjs`.
- **docker-compose.yml:** Uses `.env` file, overrides `NODE_ENV=production`.
- **No PM2 ecosystem config** found.
- **No separate deployment configs** for dev vs live.

### Deployment Model
Both dev and live are deployed via Coolify using the same Dockerfile and the same `.env` file. The only configuration difference is the domain Coolify routes to each deployment (managed at the Caddy/proxy layer, not in the app).

---

## Core Finding

### Dev and live email behavior is IDENTICAL.

Both environments:
1. Use the **same RESEND_API_KEY** -- emails from both are real, delivered via the same Resend account
2. Connect to the **same database** -- CommGate flags (outboundEnabled, emailEnabled) are shared
3. Use the **same OUTBOUND_LIVE_ENABLED=true** kill switch
4. Run the **same code** with no environment-conditional email logic
5. Send to the **same real admin email addresses** (resolved from the shared database)

### Risk Assessment

| Risk | Severity | Details |
|---|---|---|
| **Duplicate emails from dev testing** | HIGH | If a VAPI call hits both dev and live webhook endpoints, admins receive TWO notification emails. Idempotency key (`vapi-{callId}`) prevents duplicates within one instance, but both instances share the same DB, so the second instance will see the first's log and skip. This is a MITIGATING factor. |
| **Dev emails reaching real customers** | HIGH | Campaign emails, trigger emails, and outbound emails on dev go to REAL customers because the database is shared. The only protection is CommGate (org-level flags). |
| **Tavus webhook always goes to live** | MEDIUM | Hardcoded `callback_url` means dev-initiated Tavus sessions produce live-side emails. Not necessarily a bug (intentional routing), but it means dev can never independently test Tavus email flow. |
| **Escalation email CommGate gap** | LOW | `checkUnansweredEscalations()` only checks `org.emailEnabled`, not `org.outboundEnabled`. Minor inconsistency. |
| **Invite email uses sandbox sender** | LOW | `onboarding@resend.dev` sender domain may cause delivery issues in production. |
| **TeamBox manual email bypasses CommGate** | MEDIUM | `POST /api/conversations/:id/email` has no CommGate check -- any authenticated user can send email regardless of org outbound settings. |

### Summary

There is no email isolation between dev and live. They are functionally the same application instance sharing a database and API keys. Emails sent on dev reach the same real recipients as emails sent on live. The shared database mitigates some duplicate-email risk (via idempotency logs), but introduces the risk that dev testing triggers real customer communications.
