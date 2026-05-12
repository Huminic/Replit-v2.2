# A2 — Provider Boundary Health Audit (integration-safety findings)

**Date:** 2026-05-12
**Owner:** integration-safety (teammate, recon side-sprint)
**Verdict:** **YELLOW** overall — boundary mostly safe, but TWO production-impact issues require operator attention before tomorrow's Serra report

Verbatim findings from the teammate. Orchestrator wrote this file from teammate's response (subagent file-write constraint).

---

## Boundaries touched (read-only)
- `outbound_log` — all 7 orgs, channels sms/email/phone
- `activity_log` — `sms_inbound_received`, `vapi_call_received`, `weekly_report_sent`, `auto_greeting_sent`, `trigger_*_sent`, etc.
- `conversations` + `messages` — channel=sms inbound trace
- `organizations.settings` — outbound flags / textmagic phone / adf settings
- `integrations` — TextMagic webhook secret presence
- `usage_events` — provider metering

## Observability gaps
1. Dev + live share Supabase DB. The audit was run against the shared DB; orchestrator host has `NODE_ENV=development`, `TESTLANE_MODE=true`
2. **PM2 logs on live Coolify container `phqqzjj5pal13wlp39m5ohx6-…` are NOT reachable from orchestrator host.** Cannot inspect runtime stdout for the live Express process. Operator should pull `coolify logs` for cross-validation
3. `outbound_log` rows do not carry `metadata`/`source` columns → dev vs live origin cannot be cleanly attributed at the row level. The blocked rows are tagged with the dev-side TESTLANE guard string — **these are dev-process writes, not live customer sends**

---

## Δ1 — Status histogram, last 7 days (rolling 2026-05-05 → 2026-05-12 05:32 UTC)

| Provider/channel | Org | Status | Count | First | Last |
|---|---|---|---|---|---|
| sms | serra-honda | **blocked** | **50** | 2026-05-06 22:29 | 2026-05-11 07:03 |
| sms | serra-honda | sent | 2 | 2026-05-07 18:57 | 2026-05-07 18:57 |
| email | (all orgs) | — | **0** | — | — |
| phone | (all orgs) | — | **0** | — | — |

**Last-7-days across all 7 production orgs: 52 rows. 50 blocked, 2 sent (operator phone only). Zero email rows. Zero serra-nissan / tony-serra-ford / hyundai-of-columbia / ford-of-columbia / cage / huminic outbound.**

Last 30 days (2026-04-12 → 2026-05-12):
| Channel | Status | n |
|---|---|---|
| email | sent | 121 |
| phone | dry_run | 1 |
| sms | blocked | 307 |
| sms | dry_run | 2 |
| sms | failed | 17 |
| sms | sent | 38 |

**Last email send on live = 2026-04-30 13:09:19** (Serra Honda → `duanewells@icloud.com`). **No email send for any org for 11+ days.** Yet `weekly_report_sent` activity_log rows exist on 2026-05-04 11:02–12:03 (5 orgs, all 5 logged "primary_window" with `resend messageId`s but **zero matching outbound_log row** within ±2 min) — see OOS-1 below.

## Δ2 — TextMagic inbound webhook audit

| Org | Last `sms_inbound_received` activity_log row |
|---|---|
| serra-honda | **2026-04-29 13:33:37** (12.6 days ago — 1 row from `+14126546500` operator) |
| huminic | 2026-04-30 05:40:47 (test rig `+15551234567`, content `chunk-5-relaxed-verify-test`) |
| serra-nissan | **never** |
| tony-serra-ford | **never** |
| hyundai-of-columbia | **never** |
| ford-of-columbia | **never** |

Last 5 `sms_inbound_received` on serra-honda: ALL had sender `+14126546500` (operator). Only inbound landings since launch (2026-04-27) were operator self-tests.

**Last real-customer SMS inbound across all orgs: 2026-04-14 19:36:55** (sender `+15555392484` → serra-honda). **27 days of silence on real-customer inbound replies.**

**This is strong corroboration of I-NEW-2026-05-07-TEXTMAGIC-URL.** Outbound continued at low volume pre-launch; inbound from real customers stopped completely after 2026-04-14. Consistent with TextMagic delivering inbound to `dev.huminicdev.com` and getting 503'd by dev's I-236 auth gate.

---

## Provider-by-provider verdicts

### 1. TextMagic SMS — **RED**
- Outbound to real customers last 7d: 0
- Inbound webhook deliveries last 7d: 0 from non-operator senders
- Last real-customer inbound: 2026-04-14
- **Verdict consistent with I-NEW-2026-05-07-TEXTMAGIC-URL.** Operator's fix-today plan is the right remediation
- **Secondary concern:** dev process continuously emitting outbound SMS attempts on serra-honda's behalf (50 in 7d, ~7/day) blocked by dev TESTLANE guard. Each `Caroline from Serra Honda` follow-up looks scheduler-driven (campaign_id null, sub-second bursts of 1-7). **If TESTLANE is OFF on live, these would fire to real customers**

### 2. VAPI voice — **YELLOW (inconclusive without live container logs)**
- 97 `vapi_call_received` rows in last 30 days across 5 orgs
- **Last call: 2026-04-30 00:26:31** (ford-of-columbia)
- **Zero VAPI inbound calls recorded for the last 11 days across all orgs**
- All recent calls had `vinLeadCreated: true` and `vinContactHref` populated — VIN write path firing on inbound
- Pre-launch: 1-8 calls/day per org. Post-2026-04-30: zero. Cannot disambiguate "no customer calls" from "webhook silent fail" without coolify logs
- Transcription-email chain: depends on Resend → outbound_log; no email rows last 7d means no transcription emails delivered

### 3. Resend email — **YELLOW**
- `outbound_log` channel=email: **0 rows last 7d**; last 2026-04-30 13:09
- BUT `activity_log` shows `weekly_report_sent` for all 5 production dealerships on 2026-05-04 11:02–12:03 with Resend messageIds populated
- **OOS-1 smoking gun:** every weekly_report_sent row 2026-05-04 has **NO** matching `outbound_log` email row within ±2 min for ALL 5 orgs. **Weekly report Resend sends are happening but NOT being mirrored into `outbound_log`.** Audit-trail consistency bug, NOT delivery failure (messageId is from Resend)
- `auto_greeting_sent` rows on 2026-05-09 and 2026-05-10 (serra-honda) — same pattern (no matching outbound_log)
- Email IS still being delivered for the weekly recap path. Daily-recap / appointment-intent / insurance-text response cannot be directly verified from this DB alone — the global pattern suggests Resend code paths bypass `outbound_log` for some flows

### 4. Tavus video — **GREEN (no signal)**
- Last `tavus_video_completed` 2026-04-28 06:47. No errors. Out of scope

### 5. vin-safe-mcp — **GREEN**
- Zero ADF / lead_create / vin write activity in last 30 days
- VAPI writes via vin-safe-mcp stopped 2026-04-30 (same window as VAPI calls). Quiet as expected on live

---

## CommGate allowlist sanity
- 50 blocked SMS rows last 7d: `recipient_phone=NULL`, blocked_reason=TESTLANE guard. No real customer phone reached the provider
- 2 sent SMS to `+14126546500` (operator) only — within allowlist
- `weekly_report_sent` recipients per activity_log (NOT customer-bound):
  - serra-honda → `dwood@serrahonda.net`, `jessica@misscommunicationconsulting.com`, `sdew@serrahonda.net`, `victoria@misscommunicationconsulting.com` (cc: `durran@cageautomotive.com`, bcc: `duane.wells@huminic.ai`)
  - tony-serra-ford → `dwood@serrahonda.net`, `victoria@misscommunicationconsulting.com`
  - serra-nissan → same as ford
  - hyundai-of-columbia, ford-of-columbia → `sam.mayfield@bc.auto`
- Real dealership personnel — **operator-authorized post-launch recipients for weekly recap**. Within "approved internal/partner" envelope
- No unauthorized customer recipients observed

---

## Per-org outbound-flag table

| Org | `triggersEnabled` | `checkInTriggerEnabled` | `afterHoursTriggerEnabled` | `triggerTestPhones` | `textmagicPhone` | adf | vapi |
|---|---|---|---|---|---|---|---|
| serra-honda | true | **true** | false | `["+14126546500"]` | `+18338935694` | live | configured |
| serra-nissan | (unset) | (unset) | (unset) | — | **NO PHONE** | configured | configured |
| tony-serra-ford | (unset) | (unset) | (unset) | — | **NO PHONE** | configured | configured |
| hyundai-of-columbia | (unset) | (unset) | (unset) | — | **NO PHONE** | configured | configured |
| ford-of-columbia | (unset) | (unset) | (unset) | — | **NO PHONE** | configured | configured |

**Critical finding: of the 3 Serra stores the operator asked about, ONLY serra-honda is wired for SMS at all. serra-nissan and tony-serra-ford have no `textmagicPhone` set; they cannot send or receive SMS.**

The operator may have been told (or themselves told Serra) that SMS is firing across all 3 stores. **Only Honda actually has the SMS line provisioned.**

---

## Out-of-scope items (not investigated; flagged for filing)

- **OOS-1:** Resend send path bypasses `outbound_log` for weekly_report / auto_greeting flows. Activity_log captures the send with messageId; outbound_log row missing. Audit-trail integrity issue. Affects all 5 production orgs on weekly recap path. **File as new I-NEW**
- **OOS-2:** Dev process continuously generating per-recipient `Caroline from Serra Honda` SMS follow-ups (50 in 7d, scheduler-driven, `campaign_id IS NULL`). Correctly blocked by TESTLANE guard. Burst pattern (6+ in a single second at 2026-05-11 07:03:36) suggests unthrottled per-recipient loop. **If equivalent loop fires on live (TESTLANE_MODE=false), these would land at real customers.** Operator should verify
- **OOS-3:** VAPI inbound silence since 2026-04-30 cannot be cleanly disambiguated from this orchestrator host. **Recommend coolify logs** to confirm whether VAPI webhooks reaching live and persisting

---

## What to tell Serra

1. **Inbound SMS replies have been silently dropped since 2026-04-14 across all 3 Serra stores.** Root cause = TextMagic dashboard inbound-callback URL points at dev (returns 503). Operator's "fix the URL today" plan = correct remediation. Confirm by checking that within 1 hour of dashboard fix, a test inbound from a non-operator phone arrives in `activity_log` action=`sms_inbound_received` with the real sender phone
2. **Only serra-honda has an SMS lane provisioned.** serra-nissan and tony-serra-ford have no `textmagicPhone` in settings. Cross-store SMS follow-up cannot have been firing for nissan or ford — those stores need a TextMagic number provisioned + `textmagicPhone` set in org.settings, and outbound triggers enabled, before SMS will work for them
