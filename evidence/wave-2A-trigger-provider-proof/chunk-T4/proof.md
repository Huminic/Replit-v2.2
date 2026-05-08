# Wave 2A — Chunk T4 — VAPI Inbound Webhook Provider Proof

**Status:** PARTIAL / BLOCKED-AT-AUTH-GATE — captured transparently per Environmental Core Value #1 (TRUTH OVER COMPLIANCE).

**Date:** 2026-05-08
**Branch:** `wave/10-bg/2A-svc-webhook`
**Operator:** Duane Wells
**Builder:** isolated agent (this session)

---

## Goal (plain English)

Prove the local VAPI inbound webhook handler at `POST /api/webhooks/vapi`:
- Test A: REJECTS a placeholder/no-content event (exercising the
  I-NEW-2026-04-26-D fail-closed guard at `server/lib/vapiInboundGuard.ts`).
- Test B: ACCEPTS a content-bearing TestLane event and creates a
  conversation row in serra-honda.

## Run command (executed exactly once)

```bash
set -a && source .env && set +a
TESTLANE_MODE=true TESTLANE_SMS_TO=+14126546500 \
  npx tsx server/test-trigger-2A.ts testT4VapiWebhookInbound
```

- **tsx exit code:** `1` (T4 halt condition emitted because Test B returned 5xx).
- **Run timestamp window:** `pre_ts=2026-05-08T17:10:20.758Z` → `post_ts=2026-05-08T17:10:20.788Z`.
- **Single invocation:** confirmed (per CONTINUATION OPENING stop condition "Run scripts EXACTLY ONCE").

## Result summary

| Test | Expected | Actual | Reached the guard? |
|---|---|---|---|
| A (placeholder `status-update`, no transcript) | REJECT (4xx via guard event-type filter) | HTTP **503** "Webhook secret not configured" | **NO** — rejected at the I-236 auth gate (preceding the guard) |
| B (`end-of-call-report` with `[testlane:wave-2A-T4]` marker + transcript + summary, assistantId = Nancy/serra-honda) | ACCEPT (2xx + conversation row created) | HTTP **503** "Webhook secret not configured" | **NO** — rejected at the I-236 auth gate (preceding the guard) |

**Bottom line:** The local pm2 `nexxus-app` process runs with
`NODE_ENV=production` and `VAPI_WEBHOOK_SECRET` UNSET. Per the I-236 auth
gate at `server/routes/webhooks.ts:920-925`, that combination causes the
handler to **503** every inbound request before any payload validation,
schema parse, or guard evaluation occurs. This is correct
defense-in-depth for production hardening, but it means **the I-NEW-2026-04-26-D
guard branches were not exercised by this run.**

This is documented as a partial / blocked outcome. The fix path is in
"Recommendations" below; per task hard rules (`NO PM2 restart`), the
builder cannot remediate the env in-session.

## Halt-condition checklist

| Halt-condition (per task brief) | Outcome |
|---|---|
| Test A (placeholder) gets ACCEPTED → regression of I-NEW-2026-04-26-D | **NO** — Test A returned 503 (rejected). No regression observed. Guard branch was not exercised either. |
| Test B (valid TestLane event) returns 5xx → handler bug | **YES — TRIPPED.** Test B returned 503 from the auth gate. Documented and not retried in-session per single-invocation rule. Not a handler bug — it's a misconfiguration of the local pm2 env (`NODE_ENV=production` + secret unset). The handler behaved correctly per its declared I-236 contract. |
| DB row created in an org OTHER than serra-honda | **NO** — 0 conversation rows created in any org for this run. |
| Provider send fired | **NO** — 0 outbound_log rows in serra-honda window. |
| Edits to `server/lib/vapiInboundGuard.ts`, `server/routes/webhooks.ts`, `server/services/`, schema | **NO** — only `server/test-trigger-2A.ts` was extended (+ this evidence file). |
| Script invoked more than once | **NO** — single invocation. |

## Detailed evidence

### tsx stdout / stderr

Captured at `/tmp/t4-stdout.log` and `/tmp/t4-stderr.log` during the run;
key excerpts inlined here for the audit trail:

```
=== Wave 2A Chunk T4 — VAPI Inbound Webhook Provider Proof (synthetic) ===
session-id: wave-2A-T4
base URL: http://localhost:5000
org: id=24d64f99-ba04-4b43-af35-fd06f555ac86 slug=serra-honda name=Serra Honda
pre_ts=2026-05-08T17:10:20.758Z

--- Test A: synthetic placeholder event (expect REJECT) ---
Test A payload: {"message":{"type":"status-update","status":"queued","call":{"id":"t4-test-a-1778260220758","status":"queued","assistantId":"c777f029-8c4c-4a23-98e4-3adfd4112a61","customer":{"number":"+14126546500","name":"T4 Test A — placeholder no-transcript event"}}}}
Test A HTTP status: 503
Test A response body: {"message":"Webhook secret not configured"}

--- Test B: synthetic content-bearing TestLane event (expect ACCEPT) ---
Test B HTTP status: 503
Test B response body: {"message":"Webhook secret not configured"}

post_ts=2026-05-08T17:10:20.788Z
```

Final RESULT JSON (from stderr; emitted via `console.error` before the
halt-throw):

```json
{
  "baseUrl": "http://localhost:5000",
  "sessionId": "wave-2A-T4",
  "serraHondaOrgId": "24d64f99-ba04-4b43-af35-fd06f555ac86",
  "preTs": "2026-05-08T17:10:20.758Z",
  "postTs": "2026-05-08T17:10:20.788Z",
  "testA": {
    "testName": "A",
    "expectedAction": "ignore",
    "httpStatus": 503,
    "responseBody": { "message": "Webhook secret not configured" },
    "handlerIgnored": false,
    "conversationRowsForThisTest": []
  },
  "testB": {
    "testName": "B",
    "expectedAction": "create",
    "httpStatus": 503,
    "responseBody": { "message": "Webhook secret not configured" },
    "handlerIgnored": false,
    "conversationRowsForThisTest": []
  },
  "outboundLogRowsInWindow": [],
  "haltChecks": {
    "testARejected": false,
    "testBAccepted": false,
    "testBNo5xx": false,
    "onlyOrgIsSerraHonda": true,
    "noProviderSends": true
  }
}
```

### pm2 server-side log delta (proves the request reached the route handler)

`/home/ubuntu/.pm2/logs/nexxus-app-out.log` (delta since pre-run):

```
5:10:20 PM [express] POST /api/webhooks/vapi 503 in 1ms
5:10:20 PM [express] POST /api/webhooks/vapi 503 in 2ms
```

`/home/ubuntu/.pm2/logs/nexxus-app-error.log` (delta since pre-run):

```
[VAPI Webhook] VAPI_WEBHOOK_SECRET unset in production — rejecting request
[VAPI Webhook] VAPI_WEBHOOK_SECRET unset in production — rejecting request
```

These `[VAPI Webhook]` log lines correspond to
`server/routes/webhooks.ts:923` — the I-236 fail-closed branch that
fires when `NODE_ENV === "production"` AND `process.env.VAPI_WEBHOOK_SECRET`
is unset.

### Local pm2 env snapshot (read-only via `pm2 env`)

```
NODE_ENV: production
VAPI_WEBHOOK_SECRET: (unset)
```

Note: `.env` on disk has `NODE_ENV=development`, but the running pm2
process (PID 2950179, started ~25h ago per `pm2 list`) was launched
with the production env. `--update-env` would propagate the .env's
`development` value, but PM2 restart is forbidden by task hard rules.

### Files touched

- `server/test-trigger-2A.ts` — extended with `testT4VapiWebhookInbound`
  helper (added: schema imports `conversations`/`messages`, T4 constants,
  T4 result type, T4 helper function ~280 LoC, CLI dispatch arm). Net
  additive only; no edits to existing T1/T2/T3 helpers.
- `evidence/wave-2A-trigger-provider-proof/chunk-T4/proof.md` (this file).

### DB rows created

- 0 conversation rows (`conversations` table) in serra-honda within
  `[pre_ts, post_ts]`.
- 0 conversation rows in any other org within the same window.
- 0 outbound_log rows in serra-honda within the window.
- 0 messages rows attributable to this run.

### Provider sends fired

- 0. Both POSTs were rejected at the auth gate before any provider
  interaction would have been attempted; the route's create path was
  not reached.

## TextMagic inbound webhook proof — DEFERRED

Per the wave-bookend CONTINUATION OPENING (lines 297-298):

> Webhook provider proof. VAPI inbound webhook validation. […]
> TextMagic inbound webhook proof is BLOCKED by I-NEW-2026-05-07-TEXTMAGIC-URL
> (operator-execute dashboard fix); covered conceptually here but live
> SMS roundtrip deferred until dashboard URL is corrected.

**One-paragraph status (per task brief):** TextMagic's inbound webhook
target on its dashboard is still pointed at `https://dev.huminicdev.com/api/webhooks/textmagic`
(pre-launch artifact). On dev, the handler returns HTTP 503 because
`TEXTMAGIC_WEBHOOK_SECRET` is unset there and `NODE_ENV=production` —
the same fail-closed pattern as VAPI's I-236. Production
(`live.huminic.app`) is healthy. The fix is a dashboard URL update by
the operator; no code change. Until that's done, a synthetic POST to
the dev URL would 503 (matching the live failure mode), and a real
inbound SMS round-trip cannot be proven. The side-thread investigation
documented at
`evidence/wave-2A-trigger-provider-proof/sidethread-textmagic-webhook/finding.md`
is the carry-forward record. T4 covers VAPI inbound only; TextMagic
inbound is deferred to a future wave once the dashboard URL is
corrected.

## Two deltas of proof — what this run actually demonstrates

| Delta | What it shows | Where |
|---|---|---|
| Δ1 — runnable (partial) | `npx tsx server/test-trigger-2A.ts testT4VapiWebhookInbound` ran end-to-end with deterministic exit code 1; the failure mode is captured in structured RESULT JSON; no fabricated success. | `/tmp/t4-stdout.log`, `/tmp/t4-stderr.log` |
| Δ2 — independent observation | Two `POST /api/webhooks/vapi 503` lines in `pm2 logs nexxus-app-out` and two corresponding `[VAPI Webhook] VAPI_WEBHOOK_SECRET unset in production — rejecting request` lines in `pm2 logs nexxus-app-error` confirming the requests hit the live express handler and were rejected at the I-236 branch. | pm2 log deltas excerpted above |

**Δ1 is partial** because the I-NEW-2026-04-26-D guard branches (the
intended target of this proof) were not exercised by this run — the
I-236 auth gate fired first. The two deltas demonstrate the script
ran and the route handler responded as configured, but they do NOT
constitute a positive guard-behavior proof.

## Architectural / process findings (surfaced for follow-up)

1. **Local pm2 dev process runs with `NODE_ENV=production`.** This was
   not noted in `wave-bookend.md` or in CLAUDE.md's runtime table. It
   makes `dev.huminicdev.com` (and `localhost:5000`) behave like a
   production-hardened deployment locally — which is good for
   accidentally-firing-real-sends safety, but blocks any local
   inbound-webhook proof that does not have the matching `*_WEBHOOK_SECRET`
   set. Document in CLAUDE.md or in the testing doctrine; recommend
   either (a) set `VAPI_WEBHOOK_SECRET` and `TEXTMAGIC_WEBHOOK_SECRET` in
   the dev `.env` and restart pm2 with `--update-env`, OR (b) flip dev
   pm2 to `NODE_ENV=development`. Operator-decide.
2. **For the T4 spec to be fully exercised, T4 needs to run with a
   working dev secret.** Options:
   - Set `VAPI_WEBHOOK_SECRET` in `.env`, `pm2 reload nexxus-app --update-env`
     (operator approval required per CLAUDE.md "Confirm with operator first"
     for restarts), then re-run T4 with the secret in the
     `Authorization: Bearer …` header.
   - Or flip pm2 to `NODE_ENV=development`. The I-236 branch then logs a
     warning instead of rejecting; T4's existing payloads would reach
     the guard.
3. **`server/test-trigger-2A.ts:1166` halt-throw is correct** — the
   harness identified the unexpected 5xx and stopped. This is the
   intended behavior for the "Test B returns 5xx → STOP, capture,
   escalate" stop condition.

## Recommendations / next-wave handoff

1. Operator decides on env remediation (VAPI_WEBHOOK_SECRET set, OR
   flip pm2 NODE_ENV) and authorizes a `pm2 reload nexxus-app --update-env`.
2. Builder re-dispatches T4 in a follow-up session (NEW session, not
   this one — single-invocation rule satisfied for this session). The
   helper code is already in place and need not be re-edited; just
   re-invoke `testT4VapiWebhookInbound`.
3. CLOSING bookend (when written) should:
   - Mark T4 as **PARTIAL** in the wave-summary table (not GREEN).
   - Carry the env-remediation as an action item.
   - Reference `I-NEW-2026-05-08-PM2-NODE-ENV` (suggested new issue id) for the dev-vs-prod env mismatch.
   - Continue to defer TextMagic inbound webhook live roundtrip per
     `I-NEW-2026-05-07-TEXTMAGIC-URL`.

## Cross-references

- `server/lib/vapiInboundGuard.ts` — fail-closed guard (I-NEW-2026-04-26-D); not exercised by this run.
- `server/routes/webhooks.ts:915-988` — VAPI inbound handler entry + I-236 auth gate + guard invocation.
- `server/test-trigger-2A.ts` (this branch) — `testT4VapiWebhookInbound` helper.
- `evidence/wave-2A-trigger-provider-proof/wave-bookend.md` — CONTINUATION OPENING (lines 291-325).
- `evidence/wave-2A-trigger-provider-proof/sidethread-textmagic-webhook/finding.md` — TextMagic inbound deferred-cause record.
