# Report Inventory — Pre-Launch Review (2026-05-18)

**Owner:** harness-backend (team), Task #4
**Verdict for operator:** 10 operator-facing reports inventoried. 5 are gated by known blockers (3 in flight, 2 deferred). 3 are working. 2 are stale.
**Status:** READ-ONLY investigation. No code changes.

This document is the operator's "review the daily reports and update them" pre-launch checklist (operator quote 2026-05-18).

---

## Inventory table

| # | Report | File(s) / key fn | Cadence | Recipients | Current state | Last successful send |
|---|---|---|---|---|---|---|
| 1 | Weekly executive report | `server/services/weeklyReportService.ts` + scheduler `services/scheduler.ts:371` (`runWeeklyReportScheduler`) | Mon 7am local; 5-min tick; catch-up Mon 8am→Tue 7am; per-org-per-ISO-week lock (7-day TTL) | L1 + L2 + L3 + additional_org_ids; safety Bcc → `duane.wells@huminic.ai` (unless `WEEKLY_REPORT_SAFETY_BCC_DISABLED=1`) | **WORKING; observability gap.** activity_log shows `weekly_report_sent` for all 5 dealers 2026-05-04; week 2026-05-12 returned `weekly_report_skipped` (lock held — already-sent). Resend sends bypass outbound_log → `I-NEW-2026-05-12-E` (v2.3 defer). | activity_log `weekly_report_sent` 2026-05-04 — all 5 dealers |
| 2 | Daily recap email | `server/services/dailyRecapService.ts` + `dailyRecapDecision.ts` + `runDailyRecapScheduler` (scheduler.ts:861); send via `sendDailyRecapEmail` in `notificationService.ts:928` | Per-store at `settings.dailyRecapHour` local (default 18); 5-min tick | Same admin set as weekly | **DEFERRED to BL-003** (redesign, operator decision 2026-05-12). `dailyRecapEnabled=false` on ALL 5 dealer orgs; zero `daily_recap_*` rows in scheduler_locks. | Serra Honda 2026-05-12T07:31:49Z (manual eval), zero on others |
| 3 | VAPI lead-notification email | `server/routes/webhooks.ts:166` `sendLeadNotificationEmail`; HTML by `generateLeadEmailHTML` at webhooks.ts:316 | Triggered on VAPI `end-of-call-report` / Tavus `application.invoked` with transcript present (no-transcript guard, I-230) | Same admin set excluding seed/test/admin@ patterns | **Serra Honda WORKING; OTHER 4 STORES SILENT 14+ days** → `I-NEW-2026-05-12-H-VAPI-WEBHOOK-URL` (operator-execute fix; VAPI dashboard URL → live). I-229 partial: VIN status section still not rendered in email body. | Serra Honda 2026-05-12T07:31:49Z; FoC 2026-04-30T00:26:33Z; HoC 2026-04-29T23:47:38Z; SN 2026-04-28T12:29:07Z; TSF 2026-04-29T01:16:28Z |
| 4 | VAPI/Tavus ADF XML lead email | `server/routes/webhooks.ts:635` `submitAdfLead` | Triggered same as #3 (post-transcript); fires only if `settings.adfEmail` set; `ADF_MODE` env (default `live`) | External CRM ingester per `settings.adfEmail` | **WORKING but degraded by same root cause as #3.** Direct Resend (not via central-mcp). Test-lane fail-closed guard runs first. | Serra Honda 2026-04-28T06:47:54Z; SN 2026-04-28; HoC 2026-04-16; TSF 2026-04-22; **Ford of Columbia: NEVER** (no adfEmail configured) |
| 5 | SMS appointment-intent admin email | `server/services/notificationService.ts:1077` `sendSmsAppointmentIntentNotification`; classifier `sms.ts:56` | On every Claude AI auto-reply success when `classifySmsAppointmentIntent` returns true; idempotency `sms_appt_{convId}_{YYYY-MM-DD}` | Same admin set | **WORKING when path fires** — but `I-NEW-2026-05-12-A` (TESTLANE_MODE=true on live) silencing upstream Caroline/SMS path across all dealers (BLOCKS-ON-PAYMENT — Serra trial). | Only ever fired once — Serra Honda 2026-04-30T01:13:28Z |
| 6 | Trigger 24h check-in admin email | `server/services/notificationService.ts:749` `sendCheckInDeliveredNotification`; called from triggerService.ts:439 after the SMS goes out | Per trigger conditions (15-min scheduler tick); customer-side gating: lead aged ≥24h, vin_status not in lost/sold/bad | Same admin set | **WORKING — Serra Honda only**; other 4 stores never fired because triggers not configured (`I-NEW-2026-05-12-C-NISSAN-FORD-SMS-UNPROVISIONED`). | Serra Honda 2026-04-30T13:09:19Z, 2 total. Zero on others |
| 7 | AI Follow-Up Initiated admin email | `server/services/notificationService.ts:412` `sendAIFollowUpNotification` | Triggered by trigger actions / after-hours processing | Same admin set | **STALE — last fire 2026-04-13.** Same blocker cluster as TESTLANE_MODE + trigger non-provisioning. | Serra Honda 2026-04-13T01:59:56Z, 9 total. Zero on others |
| 8 | Escalation email — unanswered conversation >30min | `server/services/scheduler.ts:876` `checkUnansweredEscalations` (direct Resend) | Every 5min; one-shot per conversation via `storage.markEscalationSent` | First active org_admin (L3) only — single recipient | **WORKING; observability gap.** Same outbound_log bypass class as #1 → `I-NEW-2026-05-12-E` (v2.3 defer). activity_log carries `escalation_email_sent`. | activity_log only (outbound_log bypass confirms the I-NEW-E pattern) |
| 9 | Auto-greeting (Caroline) — SMS inbound | `server/routes/sms.ts:450` event-IIFE on `isNew=true`; widget path `public.ts:275-304` | Event-triggered, one per new conversation per phone per org; mutex via `withConversationLock` | Customer SMS sender (NOT an admin email) | **BLOCKED by TESTLANE — 106 widget chats silent in 14d (I-NEW-2026-05-12-F).** Caroline-throttle concern recently investigated and CLOSED (I-NEW-2026-05-12-G no live burst risk). | Customer-facing SMS, n/a for admin |
| 10 | Weekly hunches | `server/services/hunchService.ts:15` `generateHunchesForOrg`; scheduler.ts:138 Monday 6am UTC | Weekly Monday 6am UTC; gated by `settings.hunchesEnabled !== false` | **No email** — written to `hunches` table, surfaced in `/api/hunches` UI route | **WORKING.** All 6 orgs have 15 hunches each generated 2026-05-11. | DB only: every org last_at 2026-05-11T06:0X:XXZ |

---

## Per-report operator-facing pre-launch questions

### (1) Weekly executive report

- Confirm content + tone: 4035 lines includes Claude-generated narrative. Operator-review of one rendered example before Mon 2026-05-25 send recommended (next scheduled fire)
- Outbound_log audit gap (`I-NEW-2026-05-12-E`) is v2.3 — accept for launch?
- Safety Bcc to `duane.wells@huminic.ai`: keep on, or flip `WEEKLY_REPORT_SAFETY_BCC_DISABLED=1` post-launch?

### (2) Daily recap

- **Confirm BL-003 redesign first** — no code change in this wave. The 2 Serra Honda sends 2026-05-12 are eval-only artifacts
- Operator question for redesign scope: what 5–8 metrics should make the daily recap useful (vs the current 10-metric counter grid)?

### (3) VAPI lead-notification email

- **Operator-execute precondition:** repoint VAPI dashboard URL from `dev.huminicdev.com` to `live.huminic.app` (`I-NEW-2026-05-12-H`). Without this, the other 4 stores remain silent
- I-229 partial: add VIN Solutions status line into email body? Currently shown in `vinStatus` param but visual section still missing
- Operator-decision: should the "generic fallback" copy at `webhooks.ts:345` stay as-is, or be customized per store?

### (4) ADF XML lead email

- Confirm `settings.adfEmail` is correct/current for each store (especially Ford of Columbia — no successful ADF send ever)
- Operator-decision: keep `ADF_MODE=live` post-relaunch or stage through `ADF_MODE=test` (sends to `ADF_TEST_EMAIL`) for the first day of inbound calls?
- The XML wraps both `summary` and up-to-2000-char `transcript` in `<comments>` — confirm dealer CRMs ingest cleanly (no XML escaping issues)

### (5) SMS appointment-intent admin email

- **Hard gate:** `I-NEW-2026-05-12-A` (TESTLANE_MODE) blocks upstream SMS auto-reply path. Flip plan coordinated with Serra payment (which just landed)
- Accept prompt-injection debt (`I-NEW-2026-04-30-A`) for launch? Operator already accepted 2026-04-30
- Subject line currently `📅 {org} — Customer wants an appointment (SMS)` — keep emoji + format?

### (6) 24h check-in admin email

- **Hard gate:** `I-NEW-2026-05-12-C` — SMS triggers must be configured for serra-nissan + tony-serra-ford before this report can fire for those stores
- Operator-decision: which dealers want this admin email (one-line "we sent a 24h check-in to X") vs disabling it as noise?

### (7) AI Follow-Up Initiated admin email

- **No fires in 35 days.** Operator decide: still wanted? If yes, the upstream after-hours/AI-initiated path needs verification once TESTLANE flips. If no, consider disabling notification (still log to activity_log)

### (8) Escalation email

- Single recipient (first active org_admin). Operator-decision: route to a distribution list or keep single-admin?
- Outbound_log bypass (`I-NEW-2026-05-12-E`) — accept for launch

### (9) Auto-greeting (customer-facing)

- **Hard gate:** `I-NEW-2026-05-12-A` + `I-NEW-2026-05-12-F` + `I-NEW-2026-05-12-G` coordinated flip. Pre-flip `scheduled_actions` queue check per `I-NEW-2026-05-12-G` recommendation

### (10) Weekly hunches

- Healthy — surfaced via UI only, no email. Operator-decision: should hunches optionally email to org admins?

---

## Cross-cutting blocker clusters

1. **VAPI/TextMagic dashboard URL repointing** (operator-execute) — unblocks #3, #4, #5, #6, #7, #9 for the 4 non-Serra-Honda stores. (`I-NEW-2026-05-07-TEXTMAGIC-URL` + `I-NEW-2026-05-12-H`)
2. **TESTLANE_MODE flip on live** + `triggerTestPhones` whitelist removal (BLOCKS-ON-PAYMENT — **Serra trial payment LANDED 2026-05-18**) — unblocks #5, #7, #9. (`I-NEW-2026-05-12-A` + `I-NEW-2026-05-12-B` + `I-NEW-2026-05-12-F` + `I-NEW-2026-05-12-G` coordinated)
3. **Trigger provisioning for nissan + ford** — unblocks #6 for those 2 stores. (`I-NEW-2026-05-12-C`)
4. **Outbound_log bypass for weekly/escalation/auto-greeting** — observability only; defer to v2.3. (`I-NEW-2026-05-12-E`)
5. **Daily recap full redesign** — deferred BL-003

---

**Evidence script:** `tests/report-inventory-evidence.ts` (committed) — re-runnable DB query that produces the data behind this inventory.
