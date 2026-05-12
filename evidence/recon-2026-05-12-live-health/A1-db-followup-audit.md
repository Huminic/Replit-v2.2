# A1 — Live DB Follow-up Audit (qa-evaluator findings)

**Date:** 2026-05-12
**Owner:** qa-evaluator (teammate, recon side-sprint)
**Verdict:** **FAIL** — for "is SMS follow-up firing for all 3 Serra stores?" the database answer is **NO across the board**

Verbatim findings returned by the teammate. Orchestrator wrote this file from the teammate's response per the subagent-cannot-write-evidence constraint.

---

## 7-DAY LIVE-HEALTH AUDIT — Nexxus Connect v2.2 (commit `becb739`)

Window: 2026-05-04 → 2026-05-11 (UTC), shared Supabase pooler. Read-only. No DB writes.

### Schema verified
- `activity_log` (singular), `outbound_log` (singular), `scheduled_actions`, `messages`, `conversations`, `warehouse_leads`, `organizations` — all present
- Per-feature flags live in `organizations.settings` JSONB (no separate `org_settings` table). Keys: `afterHoursTriggerEnabled`, `checkInTriggerEnabled`, `immediateTriggerEnabled`, `dailyRecapEnabled`, `dailyRecapHour`, `triggersEnabled`, `triggerTestPhones`, `checkInDelayMinutes`, `vinLeadSourceName`
- Action strings: `trigger_after_hours_deferred`, `trigger_checkin_sent`, `trigger_immediate_sent`, `trigger_immediate_queued`, `daily_recap_sent`, `daily_recap_skipped`. SMS appointment-intent admin email writes to `outbound_log` with `message_content ILIKE '%[notification:sms_appt_%'`

---

## Δ1 — Per-org × per-feature fire-count matrix (last 7 days)

| Org slug | After-hrs enabled | After-hrs fires | Check-in enabled | Check-in fires | Immediate enabled | Immediate fires | Daily-recap enabled | Daily-recap fires | SMS appt-intent emails |
|---|---|---|---|---|---|---|---|---|---|
| **serra-honda** | `false` | 0 | **`true`** | **0** | unset | 0 | unset | 0 | 0 |
| serra-nissan | unset | 0 | unset | 0 | unset | 0 | unset | 0 | 0 |
| tony-serra-ford | unset | 0 | unset | 0 | unset | 0 | unset | 0 | 0 |
| hyundai-of-columbia | unset | 0 | unset | 0 | unset | 0 | unset | 0 | 0 |
| ford-of-columbia | unset | 0 | unset | 0 | unset | 0 | unset | 0 | 0 |
| huminic | unset | 0 | unset | 0 | unset | 0 | unset | 0 | 0 |
| cage-automotive | unset | 0 | unset | 0 | unset | 0 | unset | 0 | 0 |

### Outbound_log last 7 days (cross-check)
- serra-honda sms `blocked`: **50** (TESTLANE_MODE gate)
- serra-honda sms `sent`: 2 (both to operator phone `+14126546500`)
- ALL OTHER ORGS: zero sends

### Outbound_log last 14 days (broader window)
| Org | Channel | Status | Count |
|---|---|---|---|
| serra-honda | sms | blocked | 118 |
| serra-honda | sms | sent | 8 |
| serra-honda | email | sent | 12 |
| serra-nissan | email | sent | 2 |
| tony-serra-ford | email | sent | 1 |
| hyundai-of-columbia | email | sent | 8 |
| ford-of-columbia | email | sent | 5 |
| huminic | sms | blocked | 10 |

All 8 successful SMS sends in 14d went to operator's `+14126546500` (the `triggerTestPhones` whitelist). **No real-customer SMS has been sent by triggers in the last 14 days.**

### Scheduled_actions last 7 days
- **Zero rows.** All-time the only `action_type` is `queued_sms` (last 2026-04-30). `queued_immediate_trigger_sms` has never been written.

### Scheduler_locks
- Prefixes ever recorded: `hunch`, `weekly`, `campaign`
- **No `daily_recap_*` lock has ever existed** — daily-recap scheduler has never claimed a lock or run

---

## Δ2 — Timeline trace (most-recent successful trigger fire)

Last fire = **2026-04-30 13:09:17 UTC** on Serra Honda for a TESTLANE probe phone:

| t (UTC) | Table | Event |
|---|---|---|
| 2026-04-29 13:14:36 | `warehouse_leads` (de3543ec-cc12-4e5b-a827-7ccb447f1b0d) | TESTLANE lead created (`[TESTLANE] Trigger 1 Probe`, vehicle `2026 Honda Civic`, phone `+14126546500`) |
| 2026-04-29 13:23:51 | `warehouse_leads.synced_at` | Lead marked synced |
| 2026-04-29 13:25:23 | `outbound_log` (067b72f6…) | SMS sent `[testlane:unknown] Hi TestLane, this is the Serra Honda team…` |
| 2026-04-29 13:33:41 | `outbound_log` (f5decbf2…) | Auto-reply SMS to confirmation |
| 2026-04-29 13:39:16 | `outbound_log` (2270e951…) | Immediate-trigger SMS sent |
| 2026-04-29 13:39:16 | `activity_log` (bba6bd2c…, `trigger_immediate_sent`) | Dedup record |
| 2026-04-30 13:09:16 | `outbound_log` (e3793d67…) | 24h-check-in SMS sent |
| 2026-04-30 13:09:17 | `activity_log` (3da000d7…, `trigger_checkin_sent`) | Dedup record |
| 2026-04-30 13:09:19 | `outbound_log` | Check-in-delivered admin email to `duanewells@icloud.com` |
| 2026-05-07 18:57+ | `outbound_log` | Subsequent SMS to same phone blocked by TESTLANE_MODE gate; **no further trigger activity_log writes after 2026-04-30** |

**Chain is intact and end-to-end correct — but only for the TESTLANE whitelist phone, and only up to 2026-04-30. There is no record in the database of trigger code firing on a non-whitelisted (real customer) lead, in any org, ever.**

---

## Anomalies (settings vs. reality)

| Org | Setting | Value | 7d fires | Anomaly |
|---|---|---|---|---|
| serra-honda | `checkInTriggerEnabled` | **true** | **0** | **RED FLAG.** Setting on, fires zero. 147 leads synced in 7d; check-in should have fired hundreds of times. |
| serra-honda | `afterHoursTriggerEnabled` | false | 0 | Setting OFF — but operator told Serra "fires for all 3 stores" |
| serra-nissan | `afterHoursTriggerEnabled` | unset | 0 | Setting was never enabled |
| tony-serra-ford | `afterHoursTriggerEnabled` | unset | 0 | Same |
| serra-nissan | `checkInTriggerEnabled` | unset | 0 | Setting was never enabled |
| tony-serra-ford | `checkInTriggerEnabled` | unset | 0 | Same |
| ALL 7 orgs | `dailyRecapEnabled` | unset on every org | 0 | Feature has never run. No `daily_recap_sent` row exists in `activity_log` for any org, ever |
| serra-honda | `triggerTestPhones` | `["+14126546500"]` | gates all sends | Whitelist still active. Real Serra Honda leads silently skipped at whitelist gate |
| (system) | `TESTLANE_MODE` env | **=true on writer** | 50 blocked in 7d | All real-customer-targeted sends fail-closed blocked. Reason in outbound_log: `TESTLANE_MODE=true but request lacks test-lane marker` |

---

## Per-feature × per-Serra-store verdicts

| Feature | Serra Honda | Serra Nissan | Tony Serra Ford |
|---|---|---|---|
| 1. Trigger 1 after-hours follow-up | **NOT-APPLICABLE** — setting `false`. Code present on live but zero fires ever | **NOT-APPLICABLE** — never enabled | **NOT-APPLICABLE** — never enabled |
| 2. 24h check-in (with insurance text) | **SUSPECTED-BROKEN** — setting `true`, fires=0. 147 fresh leads in 7d, zero triggered the path. Root cause likely TESTLANE gate + `triggerTestPhones` whitelist | **NOT-APPLICABLE** — never enabled | **NOT-APPLICABLE** — never enabled |
| 3. Daily recap email | **SUSPECTED-BROKEN** — `dailyRecapEnabled` unset for ALL orgs. Zero `daily_recap_sent` rows ever. No `daily_recap_*` scheduler_lock ever existed | Same | Same |
| 4. SMS appointment-intent admin email | **SUSPECTED-BROKEN / NO-DATA** — only 1 such row in `outbound_log` ALL-TIME (TESTLANE fixture). Code path exists in `server/routes/sms.ts` 735-764 | NO-DATA (1 SMS conv in 30d) | NO-DATA (0 SMS conv in 30d) |
| 5. Insurance text packaging in admin email | **SUSPECTED-BROKEN** — rides on 24h check-in. With check-in not firing, this email isn't either | NOT-APPLICABLE | NOT-APPLICABLE |

---

## What Serra is most likely experiencing

1. CRM syncing leads OK. `warehouse_leads.synced_at` < 1 hour stale on all 5 dealerships
2. **Dealership users NOT receiving SMS follow-ups for new leads.** Operator told them "yes"; database disagrees:
   - serra-honda: `checkInTriggerEnabled=true` but whitelist gates every send to one Pittsburgh test phone
   - serra-nissan / tony-serra-ford: every relevant flag unset → falsy. Triggers have NEVER fired on these stores
3. **Org admins NOT receiving daily-recap emails.** Feature in code but never executed
4. Caroline widget-chat auto-greeting blocked 106× in 14d on serra-honda by TESTLANE_MODE gate. Visible to dealership as "the chatbot isn't responding"

## Root-cause hypothesis (high confidence, requires Coolify dashboard to confirm)

Live PM2 / Coolify container `phqqzjj5pal13wlp39m5ohx6-…` is running with `TESTLANE_MODE=true` env. A launch-time test-safety setting that should have been flipped to `false` before opening to real Serra users. This single env-var flip would unblock Caroline auto-greetings and the trigger sends.

**Secondary root cause (config-only, no redeploy):**
- `triggerTestPhones` still set on serra-honda (audience = one number)
- `checkInTriggerEnabled` / `afterHoursTriggerEnabled` unset on serra-nissan + tony-serra-ford

---

## Out-of-scope observations (file for v2.3 backlog)

- `[testlane:unknown] [notification:trigger-checkin-…] [testlane:unknown]` — audit-trail readability bug. Should be `[testlane:<sid>]` not `unknown`
- `scheduler_locks` has 5 stale `weekly_report_*` rows from 2026-05-04 with `last_run_at IS NULL` and `locked_by='instance-17-…'`. Suggests scheduler crashed mid-run. Stuck lock could prevent next weekly cycle from acquiring. Worth `DELETE WHERE last_run_at IS NULL AND locked_at < now() - interval '24 hours'` housekeeping
- 15+ inbound chat conversations on serra-honda widget in 14 days, but zero outbound assistant messages succeed past TESTLANE_MODE gate. Visitors are getting silence

---

## Operator-execute remediation plan

| # | Action | Type | Risk |
|---|---|---|---|
| 1 | Verify Coolify env: `TESTLANE_MODE` on live container | Operator inspect-only | None |
| 2 | If `TESTLANE_MODE=true` on live, flip to `false` and redeploy or restart container | Coolify env change → container restart | Reversible; flip back if anything misbehaves |
| 3 | UPDATE serra-honda `settings` → remove `triggerTestPhones` (or set to `[]`) | Single-row DB UPDATE on org.settings JSONB | Reversible; restore from backup if needed |
| 4 | UPDATE serra-nissan + tony-serra-ford `settings` → set `triggersEnabled=true`, `checkInTriggerEnabled=true`, `afterHoursTriggerEnabled=true` | DB UPDATEs (2 rows each) | Reversible |
| 5 | UPDATE all 5 dealership orgs `settings` → set `dailyRecapEnabled=true` + `dailyRecapHour=…` | DB UPDATEs (5 rows) | Reversible |
| 6 | Investigate daily-recap scheduler — why no lock ever claimed? Likely scheduler module not registered on live, OR registration fails silently | Code investigation, then fix | Requires code investigation; may need redeploy |

**Operator decision required for each.** Per CLAUDE.md, none of these are autonomous-allowed for me — all fall in "still requires explicit approval".
