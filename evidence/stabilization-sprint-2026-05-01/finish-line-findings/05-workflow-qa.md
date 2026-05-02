# Workflow QA findings — 2026-05-01

> **Plan-only.** No provider sends issued in this dispatch. Every send/call described below is a **provider action** that must, before execution, satisfy `finish-line-plan.md` Section 11.2 preflight (preflight skill run + destination-classification table + per-recipient `test-orgs-allowlist-check.sh recipient` exit-0 + per-org `test-orgs-allowlist-check.sh org` exit-0 + GREEN `test-safety-check.sh` + evidence-file path declared). Batch 2's qa-evaluator runs the matrix; this file defines it.

## Scope of investigation

Define a Batch-2 proof matrix that qa-evaluator can execute mechanically with zero ambiguity. Five workflow families: Trigger 1 (immediate VIN follow-up), Trigger 2 (24h check-in), service campaign send→reply (Serra Honda), inbound webhooks (VAPI / TextMagic / Tavus), widget actions (chat / callback / form / video). Plus Resend deliverability for weekly-report dry-run, test-lane envelope hygiene, and per-workflow stop conditions. Every provider step is labeled "PROVIDER ACTION" and must run preflight first.

## Pre-Batch-2 envelope assertions (run once, before any matrix row)

| Step | Command | Expected | If wrong |
|---|---|---|---|
| ENV-1 | `cat .claude/state/test-orgs.txt` | Active line: `test_org:serra-honda` only | STOP — operator authorizes additional orgs explicitly |
| ENV-2 | `cat .claude/state/test-recipients.txt` | Active lines include at minimum `internal_operator:+14126546500`, `internal_operator:duanewells@icloud.com`, `test_email:duane.wells@huminic.ai`, `vapi_test_agent:c303d993-bf42-4784-a8cb-247477b1cbdd` | STOP — operator approves any additions |
| ENV-3 | `git diff -- .claude/state/test-recipients.txt .claude/state/test-orgs.txt` | empty (no drift since last operator-authored commit) | STOP, escalate ER-3 |
| ENV-4 | `harness/bin/test-safety-check.sh` | GREEN report; dev↔live shared DB topology confirmed; per-org CommGate posture matches expected | STOP, capture, escalate |
| ENV-5 | `env \| grep -E '^(TESTLANE_MODE\|TESTLANE_EMAIL_TO\|OUTBOUND_LIVE_ENABLED\|ADF_MODE)='` | `TESTLANE_MODE=true`, `TESTLANE_EMAIL_TO=duane.wells@huminic.ai` (or operator-confirmed value), `OUTBOUND_LIVE_ENABLED=true`, `ADF_MODE=live` | STOP — without `TESTLANE_MODE=true` and `TESTLANE_EMAIL_TO` set, the two-way fail-closed in `notificationService.ts:64-90` will block markered sends |
| ENV-6 | `harness/bin/test-lane-reset.sh` (DRY-RUN, no `--execute`) | Counts of `[TESTLANE]`/`[testlane:]` rows reported per table; no DELETE issued | If counts non-zero AND row content unfamiliar, STOP and inspect before reset |
| ENV-7 | `psql ... -c "select id, slug, outbound_enabled, sms_enabled, email_enabled, phone_enabled, video_enabled, settings->>'triggersEnabled', settings->>'immediateTriggerEnabled', settings->>'checkInTriggerEnabled', settings->>'checkInDelayMinutes' from organizations where slug='serra-honda';"` | Returns one row; flags as expected per launch posture | STOP if any flag mismatches expected |

**ENV-1..ENV-7 are read/inspect-only. None are provider actions.** They establish that the lane is clean before the matrix runs.

## Allowlist destination categories (used by every matrix row's classification table)

| Category | Allowed value(s) | Use |
|---|---|---|
| `internal_operator` (phone) | `+14126546500` | SMS / VAPI outbound test recipient |
| `internal_operator` (email) | `duanewells@icloud.com` | Trigger admin notifications, contact-form alerts |
| `test_email` | `duane.wells@huminic.ai` | `TESTLANE_EMAIL_TO` for weekly-report / daily-recap / trigger-notification overrides |
| `vapi_test_agent` | `c303d993-bf42-4784-a8cb-247477b1cbdd` (Elliott) | VAPI agent-to-agent outbound counterparty |
| `vin_test_contact` | `Durran Cage` (symbolic; resolved in vin-safe-mcp) | VIN prepare; **`execute` is operator-approval-required** |
| `tavus_test` | `popup-only` (symbolic) | Tavus widget popup proof; no real recipient |
| `textmagic_test_number` | (not yet populated; placeholders only) | If matrix needs an SMS-bot counterparty, STOP — operator must populate the slot first |

**Anything outside these categories is BLOCKED by default.** Hand-typing a recipient is forbidden — every recipient string in the matrix below is a literal copy from `.claude/state/test-recipients.txt`.

---

## Matrix W1 — Trigger 1: Immediate VIN-Lead Follow-Up

**Code:** `server/services/triggerService.ts:514-660` (`evaluateImmediateNewLeadTrigger`).
**Flag preconditions per `triggerService.ts:756-794`:** org must have `org.settings.triggersEnabled=true`, `org.outboundEnabled=true`, `org.smsEnabled=true`, `org.settings.immediateTriggerEnabled=true`. **Default OFF** (`:518-521`); operator opts in per-org.
**Test-phone allowlist (in-code):** `org.settings.triggerTestPhones` (string array). Lines `:561-565` enforce that ONLY phones in `triggerTestPhones` get sent to. This is the in-app gate that complements the harness allowlist.

### W1.1 Happy-path (in-business-hours, immediate send)

| Step | Action | Expected |
|---|---|---|
| 1 | Confirm Serra Honda is in business hours (TZ `America/New_York`, default `businessHoursStart=8`, `businessHoursEnd=21`). If outside, defer to W1.2. | bh.within=true |
| 2 | Set Serra Honda settings (operator-approved DB write OR via Settings UI): `triggersEnabled=true`, `immediateTriggerEnabled=true`, `triggerTestPhones=["+14126546500"]`, `vinLeadSourceName="Dealers WebSite"` (already default). | `select settings from organizations where slug='serra-honda';` reflects all four. |
| 3 | **PROVIDER ACTION (DB write through DB, not provider, but inserts into shared DB):** insert one synthetic `warehouse_leads` row, marked `[TESTLANE] Immediate-W1-<sid>` for `customer_name`, `customer_phone='+14126546500'`, `data_source='vin_solutions'`, `lead_source='Dealers WebSite'`, `vin_created_at=now()`, `synced_at=now()`. **Pre-write classification table** lists destination as `internal_operator:+14126546500` (PASS allowlist). Run `test-orgs-allowlist-check.sh recipient +14126546500` → exit 0 BEFORE insert. | 1 row in `warehouse_leads`. |
| 4 | Wait ≤15 min for `runTriggerEvaluation` (`triggerService.ts:823-844`) OR force a one-shot eval via test harness if available. | Log lines: `[TriggerService] Org Serra Honda: ... evaluating immediate trigger`, `Immediate trigger: sending now to +14126546500`, `Immediate trigger SENT to +14126546500`. |
| 5 | **PROVIDER RECEIPT (TextMagic):** SMS lands at `+14126546500` (operator phone) within ~30s. | TextMagic dashboard message ID captured. |

**Delta-1 assertion (DB rows):**
- `activity_log` has `action='trigger_immediate_sent'`, `entity_id=<lead.id>`, `metadata.triggerType='immediate_new_lead'`, `metadata.phone='+14126546500'`. (`triggerService.ts:600-611`.)
- `outbound_log` has channel=sms, status=sent, recipient phone matches; `processOutboundSend` two-way fail-closed allowed it because the customer_name carried `[TESTLANE]` marker AND `TESTLANE_MODE=true` (mirrors `notificationService.ts` pattern; outbound.ts has the same gate).
- New `conversations` row: `channel='sms'`, `status='open'`, `customerPhone='+14126546500'`, `customerName='[TESTLANE] Immediate-W1-<sid>'`, `agentId=<sms-agent-id>`. (`triggerService.ts:694-703`.)
- One outbound `messages` row attached to that conversation: `role='agent'`, `content` matches the formatted message at `:585`.

**Delta-2 assertion (independent observation):**
- TextMagic dashboard message-ID screenshot (provider receipt) — separate channel from DB.
- Live tail of `pm2 logs nexxus-app` shows `[TriggerService] Immediate trigger SENT to +14126546500`.

**Per-recipient preflight (do BEFORE step 5 above lands):**
1. `harness/bin/test-orgs-allowlist-check.sh recipient +14126546500` → exit 0, category `internal_operator`.
2. `harness/bin/test-orgs-allowlist-check.sh org serra-honda` → exit 0, category `test_org`.
3. `harness/bin/test-safety-check.sh` re-run → still GREEN.
4. Evidence path declared: `evidence/stabilization-sprint-2026-05-01/batch-2/W1-trigger-immediate/preflight-<UTC>.md`.

**Stop conditions (W1):**
- TextMagic SMS goes to any number not on `test-recipients.txt` → IMMEDIATE STOP, capture outbound_log, escalate ER-3.
- Activity log shows `trigger_immediate_sent` for a phone that was NOT in `triggerTestPhones` → STOP, treat as in-app whitelist failure, escalate.
- `outbound_log.status='blocked'` with `blockedReason='testlane_mode_no_marker'` (or similar) → STOP, the marker plumbing regressed.
- `processOutboundSend` returns `status='sent'` but no DB conversation row appears within 60s → STOP, conversation creation regressed.

### W1.2 After-hours queue path

| Step | Expected |
|---|---|
| Identical to W1.1 but trigger eval runs outside business hours. | `[TriggerService] Immediate trigger DEFERRED ... queued for <next-7am-local>`. |
| Inspect: | `scheduled_actions` row with `actionType='queued_immediate_trigger_sms'`, `executeAt` ≈ next 7am local. `activity_log` has `trigger_immediate_queued`, NOT `trigger_immediate_sent`. |
| When `executeAt` lands, `processScheduledActions` (`scheduler.ts:97-126`) fires the queued send. | Same Delta-1/Delta-2 assertions as W1.1 fire then. |

**Note for batch-2 timing:** if the test runs at, e.g., 10:00 AM ET in Serra Honda's TZ, only W1.1 is exercisable in one session; W1.2 requires a separate after-hours-eval window OR a temporary tz override. **Operator decision required:** acceptable to (a) wait for the natural after-hours window, or (b) temporarily set Serra Honda's `businessHoursStart`/`businessHoursEnd` to force "outside hours" for the eval, then revert? Recommendation **(a) wait** — option (b) mutates org settings that could leak.

---

## Matrix W2 — Trigger 2: 24-Hour Check-In

**Code:** `server/services/triggerService.ts:319-470` (`evaluateCheckInTrigger`).
**Flag preconditions:** `triggersEnabled=true`, `outboundEnabled=true`, `smsEnabled=true`, `checkInTriggerEnabled=true`. Window logic at `:336-353`: for `delayMinutes <= 60`, window is `0.5x .. 1.5x`; for `> 60`, fixed `±30 min`. Default `DEFAULT_CHECKIN_DELAY_MINUTES=1440` (`:43`).

### W2.1 Accelerated test (the load-bearing question)

The default 1440-minute (24h) delay is impractical for a Batch-2 round-trip. Two viable acceleration approaches; **operator decision required**.

| Option | How | Pros | Cons | Risk |
|---|---|---|---|---|
| **A — Per-org setting tweak (RECOMMENDED)** | Set `org.settings.checkInDelayMinutes=10` on Serra Honda for the test. Use the `<=60` branch which uses 0.5x..1.5x window (5–15 min). Insert a `[TESTLANE]`-marked lead with `synced_at = now() - 10 minutes`. Cron runs at ≤15-min interval (`triggerService.ts:40`); should fire on next eval. | Uses production code path verbatim. Reverts cleanly. Survives PM2 restart. | Need to remember to revert. Live shared DB so the value briefly applies for any non-test lead within the same org with `synced_at` in the small window — but Serra Honda's `triggerTestPhones` whitelist (in-code at `:399-405`) blocks any send to a phone not on the list, so production-leak risk is bounded by the whitelist. | LOW if operator confirms `triggerTestPhones` contains ONLY allowlist phones for the duration of the test. |
| **B — Env override `TRIGGER_CHECKIN_DELAY_MINUTES_OVERRIDE`** | Would require a code change adding an env-override branch at `:336`. | Lane-scoped, no DB write. | **Code change** = breaks "verification only, no code edit" Batch-2 default; would need its own preflight. | Higher — adds new code path that ships to live. |

**Recommendation: Option A**, with the `triggerTestPhones` whitelist set to `["+14126546500"]` for the test window and a checklist line in the preflight to revert `checkInDelayMinutes` (delete the key, or set it back to absent so default 1440 reasserts).

### W2.2 Happy path (assumes Option A delay=10)

| Step | Action | Expected |
|---|---|---|
| 1 | Confirm flag preconditions per "preconditions" above; set `checkInDelayMinutes=10`, `triggerTestPhones=["+14126546500"]`. | DB reflects all four. |
| 2 | **PROVIDER-ADJACENT (DB write):** insert `warehouse_leads` row marked `[TESTLANE] CheckIn-W2-<sid>`, `customer_phone='+14126546500'`, `synced_at = now() - 10 minutes`. | 1 row visible. |
| 3 | Wait ≤15 min for cron eval (`triggerService.ts:823-844`). | Log: `[TriggerService] ... evaluating check-in trigger (delay: 10 min, window: 5-15 min)` followed by `Sending check-in SMS to +14126546500`. |
| 4 | **PROVIDER ACTION (TextMagic):** real SMS to `+14126546500`. **Preflight required.** | Operator phone receives SMS within ~30s. |
| 5 | **PROVIDER ACTION (Resend, secondary):** admin notification email — `sendCheckInDeliveredNotification` (`notificationService.ts:749-840`) routes to admin recipients, but with `TESTLANE_MODE=true` AND lead/customerName carrying `[TESTLANE]`, the two-way override at `:64-90` redirects to `TESTLANE_EMAIL_TO`. | `duane.wells@huminic.ai` inbox receives "✅ Serra Honda — 24-Hour Lead Check-In Delivered to [TESTLANE] CheckIn-W2-<sid>". |

**Delta-1 (DB rows):**
- `activity_log` row `action='trigger_checkin_sent'` with `metadata.triggerType='24h_checkin'`. (`:449-460`.)
- `outbound_log` row channel=sms status=sent for the customer message.
- `outbound_log` row channel=email status=sent for the admin notification, `messageContent` includes `[testlane:<sid>]` and `[notification:trigger-checkin-+14126546500-<YYYY-MM-DDTHH>]` idempotency key. (`notificationService.ts:828-834`.)
- New `conversations` row + `messages` row created via `createTriggerConversation` (`triggerService.ts:671-717`).

**Delta-2 (independent observation):**
- TextMagic dashboard receipt for the SMS.
- Resend dashboard receipt for the admin email.

**Stop conditions (W2):**
- ANY admin email lands in a real org_admin's inbox (e.g. `serra_honda@huminic.ai`, the seed accounts at `notificationService.ts:175-180`) instead of `TESTLANE_EMAIL_TO` → IMMEDIATE STOP. The two-way fail-closed at `:78-83` should have blocked, but if `TESTLANE_MODE` was unset at runtime it would not. Verify `TESTLANE_MODE=true` was active for the entire test window.
- TextMagic SMS goes to any phone not on `test-recipients.txt` → STOP.
- Idempotency key collision (second send within same UTC hour) → expected; verify the dedupe at `:431-437`.
- After test: `checkInDelayMinutes` not reverted to default → STOP, escalate, revert before exit.

---

## Matrix W3 — Service Campaign send → reply (Serra Honda only)

**Per launch rule:** service campaigns ENABLED for Serra Honda only. Other orgs' service-module flags must be OFF (CLAUDE.md "Service-campaign launch rule"). Allowlist `test-orgs.txt` already restricts to `serra-honda`.

**Code paths:**
- Campaign scheduler: `server/services/scheduler.ts:42-64` (`checkScheduledCampaigns`, 60s tick) → `startCampaignExecution(campaign.id, organizationId, false)`.
- Send execution path lives under campaign-orchestrator code (referenced via `startCampaignExecution`); per `outbound.ts` test-lane gate, sends pass through `processOutboundSend` and inherit the `[TESTLANE]` marker check.
- Reply ingest: TextMagic webhook at `server/routes/sms.ts:159` writes inbound message via lock-protected `withConversationLock` (`:375-394`); creates new conversation OR appends to existing keyed by phone+org+channel.

### W3.1 Smallest reproducible E2E

**Required fixtures:**
1. A `campaigns` row with `name='[TESTLANE] Service-W3-<sid>'`, `organizationId=<serra-honda-id>`, `department='service'`, `channel='sms'`, `status='scheduled'`, `scheduled_at=now() + 30s` (so campaign scheduler picks it up on next tick), `kill_switch_enabled=false`.
2. A `campaign_recipients` row with `first_name='TestLane'`, `phone='+14126546500'`, `email=null`, linked to that campaign.
3. Serra Honda `org.settings.serviceCampaignsEnabled` (or whatever the per-store flag is named — `lane-6-marketing.md` line 81 implies `department` discriminates, plus the per-store enable flag) set to `true`. Operator confirms exact flag name during preflight.
4. CSV path: campaign send pulls from `campaign_recipients`, NOT a CSV file at runtime. CSV is only a UI ingestion path that writes to `campaign_recipients`. Therefore Batch 2 needs no CSV file on disk; it can insert the recipient row directly (DB write — operator-approved).

| Step | Action | Expected |
|---|---|---|
| 1 | Insert campaign + recipient fixtures per above. **Pre-insert classification table:** recipient `+14126546500` → category `internal_operator` → `test-orgs-allowlist-check.sh recipient +14126546500` exit 0. | DB rows visible. |
| 2 | Wait ≤60s for `checkScheduledCampaigns` tick. | Log: `[scheduler] Executing scheduled campaign: [TESTLANE] Service-W3-<sid>`. |
| 3 | **PROVIDER ACTION (TextMagic outbound):** SMS to `+14126546500`. | Operator receives SMS. |
| 4 | **Reply step (PROVIDER ACTION, inbound from operator's phone):** operator replies "yes please book me Saturday" from `+14126546500` to Serra Honda's TextMagic number. | Inbound webhook fires at `/api/webhooks/textmagic`. |
| 5 | TextMagic webhook at `sms.ts:159` accepts (relaxed-verify or matched header), runs STOP-keyword filter (none), creates/updates `conversations` row keyed by phone+org. | New `messages` row `role='user'`, `content='yes please book me Saturday'`, `senderName=...`. AI agent reply fires (`sms.ts:591`+) if SMS-capable agent active. |

**Delta-1 (DB):**
- 1 outbound `outbound_log` row channel=sms status=sent for the campaign send.
- 1 inbound `messages` row in the conversation with the reply.
- 1 conversation in TeamBox `Conversations` tab with `channel='sms'`, `customerPhone='+14126546500'`, `status='open'`.

**Delta-2 (independent):**
- TeamBox UI screenshot via Playwright on `live.huminic.app/teambox` logged in as `serra_honda@huminic.ai` showing the conversation thread with both messages.
- TextMagic dashboard inbound + outbound message receipts.

**Reply routing into TeamBox:** the inbound webhook resolves org via (a) receiver TextMagic number lookup `:221`, (b) outbound history `:241`, (c) phone-based contact lookup `:249`, (d) single-org fallback `:255-262`. Reply is appended to the existing campaign-originated conversation if one exists for that phone+org+sms channel. Verify the resolution path lands on Serra Honda's id (NOT another org).

**Stop conditions (W3):**
- Campaign send to a phone NOT on `test-recipients.txt` → IMMEDIATE STOP.
- Campaign fires for an org other than Serra Honda → IMMEDIATE STOP, escalate (cross-tenant defect).
- Reply lands in the wrong org's TeamBox → IMMEDIATE STOP.
- `kill_switch_enabled=true` on the campaign at any point but send still fires → STOP, kill-switch regression.
- TeamBox UI shows the conversation under wrong tenant context (KD-12 / I-NEW-2026-05-01-K) → STOP, capture, escalate.

---

## Matrix W4 — Inbound webhooks: VAPI / TextMagic / Tavus re-verification

These tests do NOT contact a real customer. They are signed/unsigned probes against the dev (and optionally live) `/api/webhooks/*` endpoints. They DO probe the live endpoint = a provider-action-adjacent network call.

| ID | Endpoint | Curl probe | Expected |
|---|---|---|---|
| **W4.1** VAPI signed (real) | `POST /api/webhooks/vapi` | `curl -sS -o /dev/null -w '%{http_code}' -X POST <BASE>/api/webhooks/vapi -H 'content-type: application/json' -H "x-vapi-secret: $VAPI_WEBHOOK_SECRET" -d '{"type":"end-of-call-report","call":{"id":"probe-w41-<sid>","customer":{"number":"+14126546500","name":"[TESTLANE] WF-W41-<sid>"},"phoneNumber":{"number":"+18005551234"},"transcript":"User: hi\nAssistant: hi","summary":"probe","startedAt":"<iso>","endedAt":"<iso>"}}'` | **200** with body `{"message":"Webhook processed successfully", "conversationId":"<uuid>", "vinLeadCreated":<bool>}` per `webhooks.ts:1480-1488`. **OR** 422 `{"message":"No organization found ..."}` if `assistantId` not assigned to any org and called number doesn't match — that's a valid response too. |
| **W4.2** VAPI junk header | same | as W4.1 but `-H 'x-vapi-secret: junk-not-the-secret'` | **401** with `{"message":"Unauthorized"}` per `webhooks.ts:929-933`. |
| **W4.3** VAPI no header (prod env, secret set) | same | omit `x-vapi-secret` and `authorization` headers | **401** (no header → providedSecret empty string → `'' !== vapiSecret` → 401 path at `:929-933`). |
| **W4.4** VAPI no header (env var unset, prod) | requires verifying `VAPI_WEBHOOK_SECRET` is set on live; do NOT unset | If env var actually unset on live → **503**. Should never observe in normal posture. If 503 returns, STOP — production misconfigured. |
| **W4.5** Tavus signed | `POST /api/webhooks/tavus` | `curl -sS -o /dev/null -w '%{http_code}' -X POST <BASE>/api/webhooks/tavus -H 'content-type: application/json' -H "x-tavus-secret: $TAVUS_WEBHOOK_SECRET" -d '{"event":"conversation.end","conversation_id":"probe-tavus-<sid>","persona_id":"<real-persona-id>","summary":"probe","transcript":""}'` | **200** with `{"message":"Webhook processed successfully",...}` OR 400 if persona not resolvable. |
| **W4.6** Tavus junk header | same | `-H 'x-tavus-secret: junk'` | **401** `{"message":"Invalid webhook secret"}` per `webhooks.ts:1505-1509`. |
| **W4.7** Tavus alt header (`x-webhook-secret`) | same | `-H "x-webhook-secret: $TAVUS_WEBHOOK_SECRET"` | **200** (per `webhooks.ts:1506` the handler accepts either `x-tavus-secret` OR `x-webhook-secret`). |
| **W4.8** TextMagic signed (real) | `POST /api/webhooks/textmagic` | `curl -sS -o /dev/null -w '%{http_code}' -X POST <BASE>/api/webhooks/textmagic -H 'content-type: application/x-www-form-urlencoded' -H "x-textmagic-secret: $TEXTMAGIC_WEBHOOK_SECRET" --data 'sender=+14126546500&text=%5BTESTLANE%5D%20probe%20W48&receiver=<serra-honda-tm-number>&timestamp=<unix-ts>'` | **200** with body recording inbound SMS handling. |
| **W4.9** TextMagic junk header | same | `-H 'x-textmagic-secret: junk-not-the-secret'` | **401** `{"message":"Unauthorized"}` per `sms.ts:177-182`. **This is the relaxed-verify behavior:** non-empty header that doesn't match → reject. |
| **W4.10** TextMagic NO header (relaxed-verify accept) | same | omit both `x-textmagic-secret` and `x-tm-signature` | **200** (relaxed-verify: absent header → accept). Per `sms.ts:183-185` log `No signing header present despite TEXTMAGIC_WEBHOOK_SECRET set — accepting`. **This is intentional debt — see I-NEW-2026-04-30-E.** |
| **W4.11** TextMagic alt header (`x-tm-signature`) signed | same | `-H "x-tm-signature: $TEXTMAGIC_WEBHOOK_SECRET"` | **200** (handler accepts either header per `sms.ts:177`). |
| **W4.12** TextMagic alt header junk | same | `-H 'x-tm-signature: junk'` | **401** (same logic). |

**Re-verification matrix table (success/fail expected per ID):**

| ID | Probe | HTTP code expected | Stop-go signal |
|---|---|---|---|
| W4.1 | VAPI signed | 200 (or 422) | Anything else → STOP, ER-2 (provider regression on redeploy) |
| W4.2 | VAPI junk | 401 | 200 → STOP, signing regression; 503 → STOP, prod misconfig |
| W4.3 | VAPI no header | 401 | Same |
| W4.5 | Tavus signed | 200 | 401 → STOP |
| W4.6 | Tavus junk | 401 | 200 → STOP, signing regression |
| W4.7 | Tavus alt header | 200 | 401 → STOP, header alias regression |
| W4.8 | TM signed | 200 | 401 → STOP, signing regression |
| W4.9 | TM junk | 401 | 200 → STOP, relaxed-verify dropped its 401-on-mismatch posture |
| W4.10 | TM no header | 200 | 401 → STOP, **immediate rollback** (real TextMagic webhooks would fail) — this is the load-bearing relaxed-verify behavior; matches AD-3 / KD-5 |
| W4.11 | TM alt signed | 200 | Mismatch → STOP |
| W4.12 | TM alt junk | 401 | 200 → STOP |

**Delta-1:** the 12 probe results captured in a CSV/table.
**Delta-2:** independent network capture via `pm2 logs nexxus-app` showing the corresponding `[VAPI Webhook] ...`, `[Tavus Webhook] ...`, `[TextMagic Webhook] ...` log lines for each probe.

**Stop conditions (W4):**
- W4.10 returns 401 → IMMEDIATE rollback (real TextMagic posture broken).
- W4.2 / W4.6 / W4.9 / W4.12 returns 200 → IMMEDIATE rollback (any of these means signature verification effectively disabled).
- Any probe returns 5xx → STOP, capture full body, escalate to operator (likely env or DB issue).

---

## Matrix W5 — Widget actions: chat / callback / form / video

**Endpoints (all in `server/routes/public.ts` and `server/routes/widgets.ts`):**

| Channel | Method | Path | Code |
|---|---|---|---|
| Chat | POST | `/api/widget/chat` | `public.ts:242` |
| Form | POST | `/api/widget/contact` | `public.ts:76` |
| Voice callback | POST | `/api/widget/voice-callback` | `public.ts:130` |
| Video session create | POST | `/api/widget/video-session` | `widgets.ts:30` |
| Public widget config | GET | `/api/widgets/public/:widgetCode` | `public.ts:211` |
| Voice config | GET | `/api/widget/voice-config/:slug` | `public.ts:189` |

### W5.1 — Widget Chat (PROVIDER ACTION: Anthropic API)

| Step | Payload / probe | Expected |
|---|---|---|
| Send | `POST /api/widget/chat` body `{"slug":"serra-honda","message":"[TESTLANE] WF-W51 hello"}` from a foreign Origin to test CORS | 200 `{conversationId:<uuid>, response:<string>, autoGreeting:<string\|null>}`. |
| DB row | new `conversations` row `channel='chat'`, `customerName='Website Visitor'`, `organizationId=<serra-honda>`, `status='open'`, `unreadCount>=1`. | Verified via authenticated GET `/api/conversations?channel=chat`. |
| Messages | 2 or 3 `messages` rows: optional `auto_greeting` from active agent, then user message, then assistant reply. | Reply.role='assistant', senderName=org.personaName per `:362`. |
| Notification | None (chat does not currently fire admin email). | `outbound_log` unchanged. |

**Error case:** `POST /api/widget/chat` body `{"slug":"non-existent","message":"x"}` → 404 `{"message":"Organization not found"}` per `:252-254`. Also: missing `message` → 400 per `:247-248`.

### W5.2 — Widget Contact Form (form channel)

| Step | Payload | Expected |
|---|---|---|
| Send | `POST /api/widget/contact` body `{"slug":"serra-honda","name":"[TESTLANE] WF-W52","email":"duanewells@icloud.com","phone":"+14126546500","message":"[TESTLANE] form probe"}` | 200 `{success:true, conversationId:<uuid>}`. |
| DB row | new `conversations` row `channel='form'`, `customerEmail='duanewells@icloud.com'`, `customerPhone='+14126546500'`, `customerName='[TESTLANE] WF-W52'`. | One `messages` row role='user' with formatted form content per `:114`. |

**Allowlist preflight:** classification table — recipient `duanewells@icloud.com` → `internal_operator` (PASS), recipient `+14126546500` → `internal_operator` (PASS). Both `test-orgs-allowlist-check.sh recipient` exit 0.

**Error case:** missing `email` → 400 per `:81-83`.

**Notification:** chat/form intentionally don't trigger an admin email at the widget endpoint — the lead-notification email fires from the VAPI/Tavus inbound paths for voice/video and from `sendLeadNotificationEmail` invoked elsewhere. Verify this is current behavior by checking `outbound_log` is unchanged after a form post. (If a notification IS expected, surface it as a separate decision flag — operator clarifies.)

### W5.3 — Voice Callback (PROVIDER ACTION: VAPI outbound call)

| Step | Payload | Expected |
|---|---|---|
| Send | `POST /api/widget/voice-callback` body `{"slug":"serra-honda","phoneNumber":"+14126546500"}` | 200 `{success:true, callId:<vapi-id>, conversationId:<uuid>}` per `:182`. |
| Provider | VAPI initiates outbound call to `+14126546500` using Serra Honda's voice agent. | Operator's phone rings. |
| DB row | new `conversations` row `channel='voice'`, `customerPhone='+14126546500'`, `customerName='Callback Request'`. | Verified via API. |
| Inbound side | When the call ends, VAPI sends `end-of-call-report` to `/api/webhooks/vapi`. The webhook may either deduplicate (same call id) into the existing conversation OR append the transcript. | Same-call-id dedupe per `webhooks.ts:1093-1101` (I-176/177). |

**Allowlist preflight:** recipient `+14126546500` → `internal_operator` exit 0; the VAPI assistant ID in use is the Serra Honda voice agent (NOT Elliott) — confirm assistantId resolves to a Serra Honda agent before initiating. Also confirm `org.settings.vapiPhoneNumberId` matches an operator-controlled phone, not a customer-leaked id.

**Error cases:**
- Missing `phoneNumber` → 400 per `:135-137`.
- No voice agent configured → 400 per `:147`.
- VAPI call failure → 503 with body `{error, details}` per `:166-168`.

### W5.4 — Video Session (PROVIDER ACTION: Tavus conversation create)

| Step | Payload | Expected |
|---|---|---|
| Send | `POST /api/widget/video-session` body `{"slug":"serra-honda","visitorName":"[TESTLANE] WF-W54"}` | 200 `{conversationId:<tavus-id>, conversationUrl:<https://...>, status:<string>}` per `widgets.ts:72-75`. |
| Provider | Tavus session created. No real recipient receives anything; allowlist category `tavus_test:popup-only`. | URL is openable; popup proves persona pickup. |
| Inbound side | When the session ends, Tavus sends webhook to `/api/webhooks/tavus` (callback URL `:64`); creates a `conversations` row `channel='video'`. | Verified via API. |

**Error cases:**
- Missing `slug` and `widgetCode` → 400 per `widgets.ts:52`.
- Slug doesn't resolve → 404 per `:48`.
- No Tavus persona configured → 400 per `:58`.

**Stop conditions (W5):**
- Any non-200 response on the happy paths above → capture, escalate.
- Voice callback initiates a call to a phone NOT on the allowlist → IMMEDIATE STOP, capture VAPI dashboard call log.
- Video session callback URL doesn't match `live.huminic.app/api/webhooks/tavus` (could leak inbound to wrong host) → STOP.
- Created conversation row's `organizationId` does NOT match Serra Honda → IMMEDIATE STOP, cross-tenant resolution defect.

---

## Matrix W6 — Resend deliverability for weekly-report dry-run

**Code:** `server/services/notificationService.ts:620-743` (`sendWeeklyReportEmail`) with two-way fail-closed at `:559-618`.

### W6.1 — Test-lane weekly-report dry-run

| Step | Action | Expected |
|---|---|---|
| 1 | Confirm `TESTLANE_MODE=true` and `TESTLANE_EMAIL_TO=duane.wells@huminic.ai` in env. | ENV-5 passes. |
| 2 | Invoke `sendWeeklyReportProduction(...)` (or its scheduler entry path) via a test harness OR by `npx tsx server/comms-test.ts <fn>` if that exposes the path. The send must include either `opts.testLaneSessionId='wf-w61-<sid>'` OR `[TESTLANE]` somewhere in subject/html. | The two-way override at `:559-618` fires; subject prepended with `[testlane:<sid>]`; To/Cc/Bcc all replaced with `[duane.wells@huminic.ai]`. |
| 3 | **PROVIDER ACTION (Resend):** email sent. Preflight: classification table — single recipient `duane.wells@huminic.ai` → `test_email` → `test-orgs-allowlist-check.sh recipient duane.wells@huminic.ai` exit 0. | Resend returns `messageId`; function returns `{sent:true, messageId}` per `:738`. |
| 4 | Verify inbox: `duane.wells@huminic.ai` receives a single email with subject prefix `[testlane:wf-w61-<sid>]`. **No real org_admin / partner_admin / super_admin recipients receive anything.** | Operator confirms inbox visually. |
| 5 | Inspect `outbound_log` (only if the production path writes one — `sendWeeklyReportEmail` itself does NOT write `outbound_log`; only the trigger notification helpers do). | Cross-check `notificationService.ts:486-497, 822-833, 979-990` to confirm the exact log entries depending on which entrypoint. |

**Without sending a real customer email:**
- The override hard-routes To/Cc/Bcc → `[TESTLANE_EMAIL_TO]` BEFORE Resend is called (`:610-617`). Real customer email addresses NEVER appear in the Resend POST body.
- Operator inspection: tail `pm2 logs nexxus-app | grep '\[WeeklyReport\] Test-lane override ACTIVE'` to confirm the override actually fired before send.
- If `TESTLANE_MODE=false` OR marker absent → fail-closed at `:580-592` returns `{sent:false, error:'test-lane gate blocked: ...'}`. **No Resend call made.**

**Delta-1:** the function return value with `messageId` captured.
**Delta-2:** Resend dashboard message receipt; operator inbox screenshot.

**Stop conditions (W6):**
- Email arrives in any inbox other than `TESTLANE_EMAIL_TO` → IMMEDIATE STOP, fail-closed regression. Inspect `applyWeeklyReportTestLaneOverride` semantics.
- Function returns `{sent:false, error:'test-lane gate blocked: ...'}` → STOP, env not aligned (likely missing `TESTLANE_EMAIL_TO`).
- Function returns `{sent:false, error:'Resend API error <status>: ...'}` → STOP, Resend posture (API key, domain verification) regressed; capture body and escalate.

---

## Matrix W7 — Test-lane envelope hygiene

**Reset script:** `harness/bin/test-lane-reset.sh` (project-local symlink to `~/Claude-store/sysadmin/harness/bin/test-lane-reset.sh`).

### W7.1 — When to run `test-lane-reset.sh --execute`

**Run BEFORE Batch 2 starts** (one DRY-RUN to inspect counts, then `--execute` if counts indicate stale fixtures). And **AFTER each matrix W1–W6 completes** to keep the envelope clean for the next workflow's fresh assertions.

**Operator approval gate:** `--execute` requires `TESTLANE_RESET_APPROVED=yes` in env. Per CLAUDE.md "Autonomy ALLOWED" rule: running with that flag is allowed AFTER preflight. Recommended cadence:

1. Pre-Batch-2: DRY-RUN; if any non-zero counts, present to operator with the row inventory; if approved, `TESTLANE_RESET_APPROVED=yes ./test-lane-reset.sh --execute`.
2. Between W1.x → W2.x → W3.x → W5.x: DRY-RUN to confirm new rows added are `[TESTLANE]`-marked (sanity); only `--execute` if accumulating noise impedes assertions.
3. Post-Batch-2: `--execute` to leave a clean envelope for the next agent.

### W7.2 — What it clears (per `test-lane-reset.sh` Python block)

Tables and predicates:
- `outbound_log` where `message_content LIKE '%[testlane:%' OR message_content LIKE '[TESTLANE]%'`
- `messages` whose conversation has `customer_name LIKE '[TESTLANE]%'`
- `conversations` where `customer_name LIKE '[TESTLANE]%'`
- `campaign_recipients` where `first_name='TestLane'` OR campaign name LIKE `[TESTLANE]%`
- `campaigns` where `name LIKE '[TESTLANE]%'`
- `appointments` where `customer_name LIKE '[TESTLANE]%'`
- `warehouse_leads` where `customer_name LIKE '[TESTLANE]%'`

### W7.3 — What it preserves

- Anything NOT marked with `[TESTLANE]` or `[testlane:` literally.
- `activity_log` rows are NOT touched (no DELETE clause for it). This is intentional — audit log preserved.
- All real customer rows, real campaign rows, real appointments, real warehouse_leads.
- `scheduler_locks`, `outbound_log` rows without the marker, `outbound_log` rows from regression tests not bearing the marker.

**Stop conditions (W7):**
- `test-lane-reset.sh --execute` reports DELETE counts that don't match the prior DRY-RUN counts — STOP, something else mutated rows mid-window.
- Any DELETE error rolls the txn back (`conn.rollback`); if so, capture and escalate. Counts won't be deleted.
- Any non-`[TESTLANE]` row gets deleted (manually compare row count delta in `select count(*) from <table>` before vs after) → IMMEDIATE STOP, escalate as data-integrity violation. (Should be impossible given the WHERE clauses, but verify.)

---

## Cross-workflow stop conditions (apply to all matrix rows)

| Signal | Action |
|---|---|
| ANY provider receipt to a phone/email outside `test-recipients.txt` | IMMEDIATE STOP. Capture provider-receipt id, full request payload, allowlist current state. Escalate. ER-3. |
| ANY response from `/api/webhooks/{vapi,textmagic,tavus}` that contradicts the W4 matrix (200 where 401 expected, or vice-versa) | IMMEDIATE STOP. Capture response body + `pm2 logs` slice. Operator decides rollback. ER-2. |
| ANY conversation row created with `organizationId` not equal to the targeted org | IMMEDIATE STOP. Cross-tenant defect. KD-12. |
| ANY `outbound_log.status='blocked'` with reason "testlane_mode_no_marker" or "testlane marker without testlane mode" | STOP, env or marker plumbing regressed. Inspect, do not retry blindly. |
| ANY mid-test `git diff -- .claude/state/test-recipients.txt .claude/state/test-orgs.txt` shows a change | STOP, capture diff, escalate (allowlist treated as code, ER-3). |
| `harness/bin/test-orgs-allowlist-check.sh` exits non-zero on a recipient already enumerated in the matrix | STOP, allowlist drifted mid-session. |
| Operator phone receives an unexpected message at any time during the test window | STOP, regardless of source. Document, escalate. |

---

## Operator-decision flags surfaced

1. **D-W2-A1** — 24-hour delay acceleration approach for Trigger 2 testing. Recommendation: **Option A (per-org `checkInDelayMinutes=10` setting)** with explicit revert step in preflight. Alternative: Option B requires code change and falls outside Batch 2's "verification only" scope.

2. **D-W1-A1** — After-hours queue path (W1.2) timing. Recommendation: **wait for natural after-hours window** rather than temporarily flipping `businessHoursStart`/`End`. If wait is unacceptable, surface the temporary flip as an explicit operator decision with revert checklist; operator approves before flipping.

3. **D-W3-A1** — Confirm exact name of the per-store service-campaign enable flag on Serra Honda (`org.settings.serviceCampaignsEnabled`?), and confirm it's already `true` on Serra Honda only. The CLAUDE.md launch rule says service-campaign capability is implemented for all stores but ENABLED only for Serra Honda. Operator confirms exact flag name and current values across all 7 orgs in the preflight.

4. **D-W3-A2** — Confirm Serra Honda's TextMagic number used for inbound reply routing. The W3 matrix relies on `findOrganizationByTextmagicPhone` resolving to Serra Honda from the `receiver` field; operator confirms the exact number and that it's distinct from the operator's allowlist phone (otherwise the outbound-echo skip at `sms.ts:227-230` activates and the test breaks).

5. **D-W5-A1** — Confirm whether `/api/widget/contact` (form) is expected to fire an admin email notification or not. The current code at `public.ts:76-128` does not call any Resend helper. If product expects an email to fire here, surface as a separate finding; if not, the W5.2 assertion "outbound_log unchanged" stands.

6. **D-W7-A1** — `TESTLANE_RESET_APPROVED=yes` autonomy. Per CLAUDE.md "Autonomy ALLOWED after preflight" the qa-evaluator may run `--execute` autonomously after presenting DRY-RUN counts. Operator confirms this is unchanged for Batch 2.

7. **D-W4-A1** — TextMagic relaxed-verify (W4.10) is intentional debt (AD-3 / KD-5 / I-NEW-2026-04-30-E). Confirm the matrix should keep W4.10 expecting **200** (current posture) — flipping to 401-expected before TextMagic dashboard signing is verified would be a regression that breaks real inbound webhooks.

---

## Open questions for operator

1. Where exactly is the per-store service-campaign enable flag stored (org.settings.serviceCampaignsEnabled? a per-channel `serviceSmsEnabled` etc? a dedicated table?). Confirm the column path before the W3 fixture insert.
2. Is `npx tsx server/comms-test.ts <fn>` the right entry path for invoking weekly-report dry-runs and the `[TESTLANE]`-tagged campaign sends, or should qa-evaluator drive the campaign scheduler tick differently?
3. For W5.4 (Tavus video session), is the `popup-only` proof acceptable evidence on its own, or does Batch 2 also need the inbound `/api/webhooks/tavus` handshake captured?
4. Which Serra Honda voice agent's `vapiAssistantId` should the W5.3 widget-callback test use? The operator-owned Elliott assistant (`c303d993-...`) is the agent-to-agent counterparty; the dealer-side Caroline agent is the production agent. Confirm whether the test exercises the live customer-facing assistant or a swap to Elliott for safety.

---

## Out of scope for this investigation

1. Any actual provider call. (Plan-only — Batch 2's qa-evaluator executes.)
2. Code changes to `triggerService.ts`, `notificationService.ts`, webhooks, widget endpoints, or scheduler. (Verification only; if a defect surfaces, raise as ER-style finding for a separate chunk preflight.)
3. Per-metric/UI verification — owned by Dispatches 3, 4, 6.
4. Schema migrations or `BL-107 lead_type` work — owned by Dispatch 1 + Batch 1.
5. Push-to-VIN execute leg — operator-approval-required; only `prepare` is in safe scope per CLAUDE.md; even `prepare` requires preflight. Coordinated with Dispatch 6.
6. Marketing-campaign UI gap — owned by Dispatches 4 and 6 + Batch 3.
