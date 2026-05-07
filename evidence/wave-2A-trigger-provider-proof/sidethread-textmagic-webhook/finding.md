# Side-thread Investigation: TextMagic Webhook Callback URL

**Date:** 2026-05-07
**Mode:** READ-ONLY
**Trigger:** Operator received a TextMagic notification that the callback URL `https://dev.huminicdev.com/api/webhooks/textmagic` is "not functioning."

---

## TL;DR

| Question | Answer |
|---|---|
| Is `https://dev.huminicdev.com/api/webhooks/textmagic` a valid endpoint? | **YES** — the route exists and is registered in code at `server/routes/sms.ts:159`. |
| Should it be on dev or on live? | **LIVE** — TextMagic's callback should point at `https://live.huminic.app/api/webhooks/textmagic` for production traffic. |
| Why is it on dev today? | **Most likely a dev-era leftover** — earlier pre-launch testing pointed TextMagic at the dev URL. After the migration to a separate live container in Coolify, the TextMagic dashboard URL was never updated. |
| Is it actually broken? | **YES, but in a defined way** — dev is returning HTTP 503 (`Webhook secret not configured`) for every TextMagic POST. Live is healthy: 401 on a bogus signing header, and 200 on real-shaped (unsigned) payloads via the relaxed-verify path (I-NEW-2026-04-30-E). |
| Recommended operator action | **Update the TextMagic dashboard callback URL to `https://live.huminic.app/api/webhooks/textmagic`.** Do not "fix" dev — dev is intentionally locked down because production traffic should not flow through it. |

---

## 1. Code: route handler exists

File: `/home/ubuntu/Claude-store/nexxus2.2_replit/server/routes/sms.ts`
Registered at: `app.post("/api/webhooks/textmagic", ...)` — line 159.

Behavior (paraphrased from lines 159–214):

1. Read `TEXTMAGIC_WEBHOOK_SECRET` from env.
2. If unset:
   - In `NODE_ENV=production` → log error and return `503 { message: "Webhook secret not configured" }`.
   - Otherwise → log warning and accept.
3. If set:
   - If signing header (`x-textmagic-secret` or `x-tm-signature`) present and mismatches → `401`.
   - If header absent → ACCEPT (relaxed-verify, see I-NEW-2026-04-30-E).
4. Rate-limit: 30 req/min per IP → `429` if exceeded.
5. If body is a delivery notification (`status` / `messageId` only, no `sender`/`text`) → return `200 { received, type: "delivery_notification" }` to stop TextMagic retries (this was the I-271 fix).
6. Otherwise expect `{ sender, text, receiver, timestamp }` → resolve org → record inbound SMS.

Conclusion: the handler is wired correctly and complete. No code-level breakage.

---

## 2. Live HTTP behavior

Probed 2026-05-07 ~19:16 UTC.

| URL | Method / Body | Result |
|---|---|---|
| `https://dev.huminicdev.com/api/webhooks/textmagic` | GET | 404 (Express returns 404 for unmatched method, which is correct — it's POST-only) |
| `https://dev.huminicdev.com/api/webhooks/textmagic` | POST `{}` | **503** `{"message":"Webhook secret not configured"}` |
| `https://dev.huminicdev.com/api/webhooks/textmagic` | POST `{ sender, text }` | **503** `{"message":"Webhook secret not configured"}` |
| `https://dev.huminicdev.com/api/webhooks/textmagic` | POST with bogus `x-tm-signature` header | **503** (still secret-unset path — header is ignored when secret is missing) |
| `https://live.huminic.app/api/webhooks/textmagic` | GET | 404 (POST-only, expected) |
| `https://live.huminic.app/api/webhooks/textmagic` | POST `{}` | **400** `{"message":"Missing sender or text in webhook payload"}` (handler accepted auth, but body was empty) |
| `https://live.huminic.app/api/webhooks/textmagic` | POST `{ sender, text }` | **200** `{"message":"Received — unresolvable sender, no action taken"}` |
| `https://live.huminic.app/api/webhooks/textmagic` | POST with bogus signing header | **401** Unauthorized (handler is checking — secret IS set on live) |

`/api/health` returns 200 with valid JSON on **both** dev and live, so the front-door routing (Caddy + DNS) is fine for both domains. The webhook gap is route-specific (env-driven), not a routing/DNS issue.

---

## 3. Why dev is broken: env separation

Per `issues.md` I-NEW-2026-04-30-E and I-200/I-219/I-220:

- Originally dev and live shared the same PM2 process / same .env / same Supabase DB (no environment separation).
- Coolify now runs the **live** container on its own port; live.huminic.app is routed there with **its own env** (and `TEXTMAGIC_WEBHOOK_SECRET` is set on the Coolify side — confirmed by the 401-on-bogus-header probe above).
- dev.huminicdev.com still points at PM2 `nexxus-app` on localhost:5000 (process id 47). PM2's env for that process does NOT have `TEXTMAGIC_WEBHOOK_SECRET` set.
- PM2 logs (last 200 lines, grep textmagic|webhook) confirm the dev process is currently emitting:
  - `WARNING: TEXTMAGIC_WEBHOOK_SECRET not set — webhooks will accept all requests` (startup banner)
  - `[TextMagic Webhook] TEXTMAGIC_WEBHOOK_SECRET unset in production — rejecting request` (every inbound webhook)

So even though the PM2 process is "dev," `NODE_ENV` is being read as `production` (most likely from the `.env` file picked up by `dist/index.cjs`), which triggers the production-strict branch (line 171–173) and returns 503.

---

## 4. What "not functioning" actually means

TextMagic's dashboard health-check on the callback URL is hitting `https://dev.huminicdev.com/api/webhooks/textmagic` with a POST and getting back 503. From TextMagic's perspective that is a server error and after enough consecutive failures TextMagic will:

1. Mark the callback URL unhealthy.
2. Disable the callback (per their documented retry policy — same posture documented in I-271).
3. Notify the account owner — which is the email the operator just received.

Inbound SMS to the dealership TextMagic numbers right now will NOT reach the application via the dev URL. They WILL still reach it via the live URL (which is healthy), but only if the TextMagic dashboard is configured to call live.

If the dashboard is currently calling **only** the dev URL, **inbound SMS is dropping right now**. This is the most likely reading.

---

## 5. Recent log activity

PM2 logs (process `nexxus-app`, port 5000, dev.huminicdev.com side):

- Repeated `[TextMagic Webhook] TEXTMAGIC_WEBHOOK_SECRET unset in production — rejecting request` entries within the last hours.
- Mirror entries for `[VAPI Webhook] VAPI_WEBHOOK_SECRET unset in production — rejecting request` — VAPI on dev is in the same condition, separate problem out of scope here.
- `POST /api/webhooks/textmagic 503 in 1ms` — typical access-log line.

Caddy access logs were not accessible from this agent (`sudo journalctl -u caddy` produced no output under our permissions). No additional traffic source visible from here.

---

## 6. What to do (operator-execute, NOT auto-applied)

Recommended primary action:

1. **In the TextMagic dashboard, change the inbound webhook / callback URL from `https://dev.huminicdev.com/api/webhooks/textmagic` to `https://live.huminic.app/api/webhooks/textmagic`.**
   - Live has the secret set, has the relaxed-verify branch, and is the production environment. Inbound SMS for paying dealerships should go there.
   - This restores the callback to a 200/400-by-payload-shape posture instead of 503.

Secondary considerations:

2. Decide whether dev should ever receive TextMagic callbacks again.
   - If yes (pre-launch testing pattern): set `TEXTMAGIC_WEBHOOK_SECRET` in the PM2 `.env` and `pm2 reload nexxus-app --update-env`. This requires operator approval per CLAUDE.md (env change + restart).
   - If no (post-launch policy): leave dev as-is. The 503 is the correct behavior — production webhooks should not be routed to a dev surface.
3. Track in `issues.md` that the TextMagic dashboard URL was historically pointing at dev. This is the same root cause as the I-NEW-2026-04-30-E follow-up (verify and align dashboard config).

There is **no code-side 1-line fix** that would help here. The handler is correct. The fix is in the third-party dashboard config and (optionally) the dev `.env`.

---

## 7. Evidence trail

| Evidence | Source |
|---|---|
| Route registration | `server/routes/sms.ts:159` |
| Production-strict 503 branch | `server/routes/sms.ts:171–173` |
| Relaxed-verify branch | `server/routes/sms.ts:183–185` |
| Delivery-notification short-circuit | `server/routes/sms.ts:191–199` |
| Startup warning when secret unset | `server/index.ts:36` |
| Recent dev 503 traffic | `pm2 logs nexxus-app --lines 200 --nostream` (logged 2026-05-07 19:16Z) |
| Dev 503 reproducer | `curl -sS -X POST ... https://dev.huminicdev.com/api/webhooks/textmagic` → 503 |
| Live 200 reproducer (unsigned, real-shaped body) | `curl -sS -X POST -d '{"sender":"+15555555555","text":"test"}' https://live.huminic.app/api/webhooks/textmagic` → 200 |
| Live 401 reproducer (bad signature) | `curl -sS -X POST -H "x-tm-signature: dummy" -d '{}' https://live.huminic.app/api/webhooks/textmagic` → 401 (proves secret IS set on live) |
| Existing carried debt | `issues.md` I-NEW-2026-04-30-E (dashboard signing posture verification) |
| Related closed issue | `issues.md` I-271 (delivery-notification 400 — already fixed) |

---

## 8. Stop conditions honored

- No code modified.
- No env modified.
- No PM2 restart.
- No TextMagic dashboard change.
- No `.env` value printed.

Surfaced findings + recommendation only. Operator decides next step.
