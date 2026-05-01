# Lane 4 — Sales Reports Verification

**Date:** 2026-04-30 (overnight read-only validation arc)
**Mode:** READ-ONLY. No edits, no resends, no DB writes.
**Auditor:** Lane 4 sub-agent

---

## Headline verdict: GREEN (with one substantive caveat)

- **Weekly Executive Report (TRG-RPT-001)** — fired correctly Monday 2026-04-27 to all 5 launch dealerships. One send per store, recipients are per-store admins + partner_admin Cc + safety Bcc. Per-org per-week scheduler_locks acquired and not double-fired. No HALT failures, no validation failures, no `lock race` log entries observed.
- **Daily Recap (I-NEW-2026-04-29-H)** — code path landed, tested at unit level, and wired into the 5-min scheduler tick. Per-org `settings.dailyRecapEnabled` is currently NULL/false for all 5 launch orgs and Cage Automotive, so no production daily-recap sends have occurred (confirmed: zero `daily_recap_*` rows in `scheduler_locks`, zero log lines containing `DailyRecapScheduler`/`daily-recap`).
- **Caveat (YELLOW for sales-vs-service segregation):** the production-path weekly report does NOT filter to sales-only. The `salesOnlyLeadIds` Set is an opt-in `BuildReportOptions` parameter (server/services/weeklyReportService.ts:479-481), but `sendWeeklyReportProduction` (weeklyReportService.ts:3937-4123) does not pass it; `runWeeklyReportScheduler` (scheduler.ts:392, scheduler.ts:465) does not pass it. The default behavior is documented at weeklyReportService.ts:469 as: *"counts include service + parts leads as before"*. This means the Monday weekly executive report includes service leads in its lead-volume tile and counts. By contrast the **daily-recap** code DOES split sales vs service via `vinStatus` prefix (dailyRecapService.ts:96-119: SERVICE leads counted in `newServiceLeads`, sales counted separately in `newSalesLeads`).

---

## 1. Cadence + scheduler tick

| Report | Fire condition | Tick | Source |
|---|---|---|---|
| Weekly Executive Report | Monday 7:00–7:59 local (org.settings.timezone), with Mon-after / Tue-before-7am catch-up | every 5 min | scheduler.ts:846-856, scheduler.ts:333-360 |
| Daily Recap | local hour == `settings.dailyRecapHour` (default 18) on local calendar day, with same-day catch-up; gated by `settings.dailyRecapEnabled === true` | every 5 min | scheduler.ts:858-865, dailyRecapDecision.ts:45-91 |

Both schedulers are started in `startSchedulers()` at scheduler.ts:830-873, called once after the server is listening.

Idempotency:
- Weekly: per-org per-ISO-week lock `weekly_report_{orgId}_{isoWeekYear}-W{NN}` with 7-day TTL (scheduler.ts:307-313, scheduler.ts:391).
- Daily: per-org per-local-day lock `daily_recap_{orgId}_{YYYY-MM-DD}` with 1500-min TTL (dailyRecapDecision.ts:32-35, dailyRecapService.ts:23, dailyRecapService.ts:262).

---

## 2. Last successful run evidence

### 2.a Weekly report — Monday 2026-04-27 (ISO week W18)

Source: PM2 log `~/.pm2/logs/nexxus-app-out__2026-04-28_00-00-00.log` (UTC date Apr 28 file = local-time Apr 27 firing window in NY/Chicago tz).

```
11:02:09 AM [weekly-report] [WeeklyReportScheduler] firing for Ford of Columbia (6ae2548b-…) — reason=primary_window local=2026-04-27 07:02 tz=America/New_York
11:02:20 AM [weekly-report] [WeeklyReportScheduler] Ford of Columbia: SENT messageId=d994d306-… to=1 cc=1 bcc=1
11:02:20 AM [weekly-report] [WeeklyReportScheduler] firing for Hyundai of Columbia (f18cbf4e-…) — reason=primary_window local=2026-04-27 07:02 tz=America/New_York
11:02:29 AM [weekly-report] [WeeklyReportScheduler] Hyundai of Columbia: SENT messageId=66334902-… to=1 cc=1 bcc=1
12:02:08 PM [weekly-report] [WeeklyReportScheduler] firing for Serra Honda (24d64f99-…) — reason=primary_window local=2026-04-27 07:02 tz=America/Chicago
12:02:18 PM [weekly-report] [WeeklyReportScheduler] Serra Honda: SENT messageId=5dfa2172-… to=4 cc=1 bcc=1
12:02:19 PM [weekly-report] [WeeklyReportScheduler] firing for Serra Nissan (4a23d5ad-…) — reason=primary_window local=2026-04-27 07:02 tz=America/Chicago
12:02:27 PM [weekly-report] [WeeklyReportScheduler] Serra Nissan: SENT messageId=f5766078-… to=2 cc=1 bcc=1
12:02:27 PM [weekly-report] [WeeklyReportScheduler] firing for Tony Serra Ford (2cbf687f-…) — reason=primary_window local=2026-04-27 07:02 tz=America/Chicago
12:02:37 PM [weekly-report] [WeeklyReportScheduler] Tony Serra Ford: SENT messageId=c6c13a53-… to=2 cc=1 bcc=1
```

**Counts:** 5 firings, 5 SENT, 0 SKIPPED, 0 errors, 0 lock-race. Verified by `grep -c "WeeklyReportScheduler\] firing for"` returning exactly 5 across all rotated log files.

DB confirmation (read-only query of `scheduler_locks` table):

| lock_name | locked_at (UTC) |
|---|---|
| weekly_report_2cbf687f-7cd5-480c-b81c-220cb632cd91_2026-W18 (Tony Serra Ford) | 2026-04-27T12:02:27.662Z |
| weekly_report_4a23d5ad-38ff-4016-8af5-f4cfc9fd88cd_2026-W18 (Serra Nissan)    | 2026-04-27T12:02:18.915Z |
| weekly_report_24d64f99-ba04-4b43-af35-fd06f555ac86_2026-W18 (Serra Honda)     | 2026-04-27T12:02:08.788Z |
| weekly_report_f18cbf4e-bcbd-46fe-bf54-33bcee4afec8_2026-W18 (Hyundai Columbia)| 2026-04-27T11:02:20.238Z |
| weekly_report_6ae2548b-f6ec-4b1e-8d8b-ae565123f0df_2026-W18 (Ford Columbia)   | 2026-04-27T11:02:09.049Z |

All 5 launch dealerships present. No 6th lock (Cage partner is correctly excluded from the dealer-only list — defaultListProductionOrgs at scheduler.ts:544-558 filters to `partnerId === cage.id`). No older `weekly_report_*` locks present in the table — first production cycle.

**Next expected fire:** Monday 2026-05-04 07:00 local (ISO week W19).

### 2.b Daily recap — never fired in production yet

`grep -lE "DailyRecap|daily-recap|daily_recap" ~/.pm2/logs/nexxus-app-out*.log` returns no matches across all log rotations.
DB query of `scheduler_locks` for `lock_name LIKE 'daily_recap_%'` returns zero rows.
DB query of `organizations` shows all 5 dealerships + Cage have `settings.dailyRecapEnabled = NULL` (effectively false per dailyRecapDecision.ts:64).

This is **expected** — the feature is per-org opt-in (default OFF) per its design; see dailyRecapService.ts:8.

Sprint-1A end-to-end fire was performed against the internal_operator allowlist (evidence at `evidence/stabilization-sprint-2026-04-30/1A/sprint/`), per issues.md:152.

---

## 3. Recipient resolution proof

### 3.a Weekly report — strict per-org

File: server/services/weeklyReportService.ts:3737-3809 (`resolveOrgRouting`).

Query shape (line 3741-3748):
- **To:** `org_admin` users where `(u.organization_id = $orgId OR u.additional_org_ids ? $orgId)` AND `u.is_active = true`.
- **Cc:** `partner_admin` users where `u.organization_id = org.partnerId` AND `u.is_active = true` (line 3768-3775).
- **Bcc:** `SAFETY_NET_BCC_EMAIL` = `duane.wells@huminic.ai` unless `safetyBcc` explicitly null/"" (line 3795-3798).

Test/seed exclusions applied to To: + Cc: (NOT Bcc:), see weeklyReportService.ts:3671-3710:
- `TEST_EMAIL_ADDRESSES` set: `duanekwells@gmail.com`, `neoweaver@gmail.com`
- `TEST_EMAIL_DOMAIN_PATTERNS`: `/@huminic\.ai$/i`
- `SEED_EMAIL_PATTERNS`: `/^orgadmin@/i`, `/@serrahonda\.com$/i`

Six HALT checks before any send (weeklyReportService.ts:3821-3886):
1. ≥1 post-filter To: recipient
2. To: + Cc: are `is_active=true` (enforced by SQL)
3. Cc: has exactly 1 partner_admin
4. Every To: recipient is legitimately associated with the store (cross-org bleed guard)
5. No To:/Cc: matches test/seed patterns (paranoid)
6. No malformed email addresses

A failure of any halt-check returns `skipReason: "routing_validation_failed"` and the email is NOT sent (weeklyReportService.ts:3990-4004). The Monday 2026-04-27 production run shows **no** `routing_validation_failed`, `validation_failed`, or `no_recipients` log lines.

Per-org observed recipient counts on 2026-04-27:

| Org | To | Cc | Bcc |
|---|---|---|---|
| Ford of Columbia | 1 | 1 | 1 |
| Hyundai of Columbia | 1 | 1 | 1 |
| Serra Honda | 4 | 1 | 1 |
| Serra Nissan | 2 | 1 | 1 |
| Tony Serra Ford | 2 | 1 | 1 |

`Cc=1` for every org confirms HALT check #3 passing — exactly one partner_admin (`duanekwells@gmail.com` is excluded by `TEST_EMAIL_ADDRESSES`, so the Cage Automotive partner_admin who actually receives the Cc must be a different active partner_admin user — not verifiable read-only without a live email lookup, which I avoided per the read-only ban on production DB user-table reads). `Bcc=1` confirms safety-net Bcc not yet disabled (`WEEKLY_REPORT_SAFETY_BCC_DISABLED` not set).

**Cross-org bleed:** prevented by halt-check #4 (`computeLegitToAssociations`, weeklyReportService.ts:3888-3902) — every To: recipient must independently resolve back to the same orgId via `organization_id` or `additional_org_ids`. SQL filter is unambiguous; no observed mismatches in production logs.

### 3.b Daily recap — broader recipient surface

File: server/services/notificationService.ts:121-194 (`resolveAdminRecipients`). Includes:
- L3 org_admins of the orgId (line 127-133)
- L2 partner_admins via partnerId (line 136-143)
- **L1 super_admins from ALL orgs** (line 145-154) — different from weekly-report path
- Users with this orgId in `additional_org_ids` (line 156-172)

Exclusion list for daily-recap is narrower than weekly-report (notificationService.ts:175-191):
- `@nexxus.com`, `@test.com`, `@serrahonda.com`, `@serranissan.com`, `@tonyserraford.com`, `@hyundaiofcolumbia.com`, `@fordofcolumbia.com`
- prefixes: `admin@`, `orgadmin@`, `salesmanager@`, `bdcmanager@`, `servicemanager@`, `fimanager@`

**Notable difference** (see Observations): daily-recap does NOT exclude `@huminic.ai` super-admins; weekly-report DOES. So if/when daily-recap is enabled per-org, super_admin operators will receive the recap email. Test-lane envelope is honored via `applyTestLaneOverrideRaw` (notificationService.ts:953-960) which fail-closes if `TESTLANE_MODE` is on without a session id.

Daily-recap also has its own duplicate guard (notificationService.ts:940-948) — checks `outbound_log` for an existing email matching `[notification:daily_recap_${orgId}_${date}]` before sending; if found, returns `reason: "duplicate"`.

CommGate respected (notificationService.ts:935-937): `org.outboundEnabled && org.emailEnabled` required.

---

## 4. Sales-only data segregation proof

### 4.a Weekly report — DOES NOT segregate

The production data query is at weeklyReportService.ts:870-881:

```ts
const leadsInWindowRaw = await db
  .select()
  .from(warehouseLeads)
  .where(and(
    eq(warehouseLeads.organizationId, orgId),
    isNotNull(warehouseLeads.vinCreatedAt),
    gte(warehouseLeads.vinCreatedAt, weekStart),
    lte(warehouseLeads.vinCreatedAt, weekEnd),
  ));
```

This pulls ALL `warehouse_leads` for the org in the window — sales, service, and parts mixed. The `salesOnlyLeadIds` filter at weeklyReportService.ts:886-894 is opt-in (BuildReportOptions parameter), but:

- `sendWeeklyReportProduction` (weeklyReportService.ts:3937, signature `(orgId, opts: { safetyBcc?, weekEnd? })`) does NOT accept a `salesOnlyLeadIds` parameter and does not pass one to `buildWeeklyReport` at line 4012.
- `runWeeklyReportScheduler` calls `send(org.id, { safetyBcc })` at scheduler.ts:465 — no sales-only.
- The integration test `tests/integration/weeklyReport.send-live.test.ts:369` calls `buildWeeklyReport(org.id, start, end)` with no opts — same behavior.

The author explicitly documented this at weeklyReportService.ts:468-470:
> *"When `salesOnlyLeadIds` is undefined, buildWeeklyReport's behavior is unchanged (counts include service + parts leads as before)."*

Comment at weeklyReportService.ts:462-463 explains why: `warehouse_leads` has no `lead_type` column; only VIN Solutions has the sales-vs-service distinction; "BL-107" was supposed to add `lead_type` to the warehouse — `grep` for `BL-107` in `issues.md` returns no row, meaning the follow-up backlog item has not been registered.

**Net effect on the Monday 2026-04-27 send:** the "Leads This Week" tile in every dealership's weekly report includes service customers, not just sales. Operator should decide whether this is acceptable for the launch cycle.

### 4.b Daily recap — DOES segregate

dailyRecapService.ts:96-119 splits via `vinStatus` prefix:

```ts
for (const l of leadsInWindow) {
  const vs = (l.vinStatus || "").toString();
  if (vs.startsWith("SERVICE")) {
    newServiceLeads++;
  } else if (
    vs && !vs.startsWith("LOST") && vs !== "lost"
    && !vs.startsWith("SOLD") && vs !== "sold" && vs !== "closed-won"
    && !vs.startsWith("BAD") && !vs.includes("DUPLICATE")
    && vs !== "NON_CUSTOMER_INITIATED_LEAD"
  ) {
    newSalesLeads++;
  }
}
```

The recap email reports both `newSalesLeads` and `newServiceLeads` as separate fields in `DailyRecapData` (dailyRecapService.ts:35-37). The tile/email design surfaces both numbers separately so the recipient can distinguish.

**This is the only place in the report stack with a real sales/service split today.** It depends on `warehouse_leads.vin_status` being non-null and starting with `SERVICE` for service leads — operator should validate VIN ingestion populates that prefix correctly (not verifiable read-only from this lane; would require a sample-row query against `warehouse_leads` which I deferred under the production-DB guard).

---

## 5. Double-sends / empty / stale-report symptoms

| Symptom | Result |
|---|---|
| Double-fire same week (same orgId, same ISO week, two firings) | None. Exactly 5 firing-lines, 5 SENT lines, 5 lock rows for 2026-W18. |
| Catch-up mode triggered unintentionally | All 5 fired with `reason=primary_window`, none with `catchup_window`. |
| HALT check failure / `routing_validation_failed` | None. |
| `validation_failed` (data shape) | None. |
| `no_recipients` skip | None. |
| `lock race` log line | None. |
| Empty report (zero leads, but report still sent) | Not surfacing in logs. The build produces `build warnings` for low VIN-source coverage (8/30, 11/65, etc., logged as `[WeeklyReportScheduler] X build warnings: …`) but those are about lead-source label resolution, not empty data. |
| Daily-recap double-fire | N/A — never fired. |

**Stale data:** the weekly-report query reads `warehouse_leads.vin_created_at` between `weekStart` and `weekEnd`, where `weekEnd = opts.weekEnd ?? new Date()` (weeklyReportService.ts:4007-4008). Because the scheduler fires Monday morning, the window is "last 7 days ending now," which is the standard semantic. No stale-data symptom found.

The watchdog log `evidence/watchdog-alerts.log` contains no entries referring to weekly-report or daily-recap activity (most recent reports are about run-of-the-mill ack invalidations).

---

## 6. Code source-of-truth file:line list

### Weekly Executive Report (TRG-RPT-001)
| Concern | File:line |
|---|---|
| Decision (Monday 7am window + catch-up) | server/services/scheduler.ts:333-360 (`decideWeeklyReportFire`) |
| Lock key format | server/services/scheduler.ts:307-313 (`weeklyReportLockKey`) |
| Scheduler loop | server/services/scheduler.ts:371-537 (`runWeeklyReportScheduler`) |
| Default org list (dealers under Cage) | server/services/scheduler.ts:544-558 (`defaultListProductionOrgs`) |
| Tick wiring | server/services/scheduler.ts:849-856 |
| Production send | server/services/weeklyReportService.ts:3937-4123 (`sendWeeklyReportProduction`) |
| Build report (data) | server/services/weeklyReportService.ts:853-2235 (`buildWeeklyReport`) |
| Lead-status classification | server/services/weeklyReportService.ts:813-830 (`classifyForStatusBreakdown`) |
| Sales-only filter (opt-in, NOT used in prod) | server/services/weeklyReportService.ts:479-488, 860-894 |
| Recipient routing | server/services/weeklyReportService.ts:3737-3809 (`resolveOrgRouting`) |
| Test/seed exclusion | server/services/weeklyReportService.ts:3671-3710 |
| 6 HALT checks | server/services/weeklyReportService.ts:3821-3886 (`runRoutingHaltChecks`) |
| Send via Resend | server/services/notificationService.ts:559-680 (`sendWeeklyReportEmail`, called via lazy import at weeklyReportService.ts:4086) |
| Persistence: scheduler_locks | DB table `scheduler_locks` (cols: lock_name, locked_at, last_run_at, locked_by, created_at) |
| Activity logs | `activity_logs.action IN ('weekly_report_sent','weekly_report_skipped','weekly_report_error')` written by scheduler.ts:466-489 |

### Daily Recap (I-NEW-2026-04-29-H)
| Concern | File:line |
|---|---|
| Decision (per-org hour, primary + catchup) | server/services/dailyRecapDecision.ts:45-91 (`decideDailyRecapFire`) |
| Lock key | server/services/dailyRecapDecision.ts:32-35 (`dailyRecapLockKey`) |
| Build data (sales/service split) | server/services/dailyRecapService.ts:81-198 (`buildDailyRecap`) |
| Production send | server/services/dailyRecapService.ts:212-235 (`sendDailyRecapProduction`) |
| Scheduler loop | server/services/dailyRecapService.ts:258-342 (`runDailyRecapScheduler`) |
| Tick wiring | server/services/scheduler.ts:861-865 |
| Recipient resolution | server/services/notificationService.ts:121-194 (`resolveAdminRecipients`) |
| Send via Resend (with idempotency check) | server/services/notificationService.ts:928-997 (`sendDailyRecapEmail`) |
| Test-lane envelope | server/services/notificationService.ts:64+ (`applyTestLaneOverrideRaw`) |
| Activity logs | `activity_logs.action IN ('daily_recap_sent','daily_recap_skipped')` written by dailyRecapService.ts:317-334 |
| Per-org enable flag | `organizations.settings.dailyRecapEnabled` (boolean, default false) |
| Per-org hour override | `organizations.settings.dailyRecapHour` (0-23, default 18) |

---

## 7. Observations (incidental findings — operator explicitly wants these)

1. **Sales-vs-service segregation gap in the weekly report.** This is the most material finding. The weekly executive report's "Leads This Week," "Leads by Source," and most lead-volume tiles include service + parts leads alongside sales. The author called it out as a hotfix-deferred concern (weeklyReportService.ts:460-477) waiting on a never-registered "BL-107" backlog item that adds `lead_type` to `warehouse_leads`. For the launch cycle this means dealership leadership is reading inflated lead counts; whether that's acceptable for week-1 is an operator call. **There is no recorded `BL-107` in `issues.md`** — that follow-up commitment is currently invisible.

2. **Daily recap super-admin recipient leakage difference.** The weekly-report path strips `@huminic.ai` (operator's own super_admin domain) from To/Cc. The daily-recap path does NOT strip it — `resolveAdminRecipients` at notificationService.ts:121 explicitly walks all super_admins from all orgs and adds them. When operator enables daily-recap per-org, super_admins (e.g. `duane.wells@huminic.ai`, `serra_honda@huminic.ai`, etc., per CLAUDE.md test accounts) will receive the recap. This may be intentional (operator wants visibility) but the asymmetry vs the weekly path is worth a conscious decision.

3. **No BL-107 / sales-vs-service follow-up issue registered.** The hotfix comment at weeklyReportService.ts:463 names BL-107 as the backlog ticket that would add `lead_type` to the warehouse. `grep` of `issues.md` for `BL-107` returns nothing. That commitment is a ghost.

4. **VIN lead-source resolution coverage is poor across the board.** From the 2026-04-27 logs: Ford of Columbia 8/50 (16%), Hyundai of Columbia 11/65 (17%), Serra Honda 8/30 (27%), Serra Nissan 8/26 (31%), Tony Serra Ford 6/27 (22%). Reports fall back to `Source #{id}` for the 60-80% of unresolved sources. This is tracked as I-279 (issues.md:321) but it's actively degrading the readability of every weekly report.

5. **Daily recap CommGate gate reads `outboundEnabled && emailEnabled`** (notificationService.ts:935). The weekly-report path does NOT check these flags before sending; it relies on the routing/HALT chain. Asymmetry — if operator turns off `emailEnabled` for an org, the daily recap stops but the weekly report still sends. Worth a deliberate decision.

6. **`scheduler_locks.last_run_at` is null for all 5 weekly-report rows.** The acquireSchedulerLock path appears to set `locked_at` but not `last_run_at`. The `last_run_at` column exists in the schema (verified) but no code path observed populates it for the report locks. Not a correctness bug — `locked_at` is sufficient — but `last_run_at` being unused is a tell that the field was probably intended for something else (perhaps a heartbeat field that was never wired). Minor.

7. **The 7-day TTL on the weekly lock means a late-Sunday container restart could re-fire if the previous Monday's lock has just aged out.** The decision function gates on lock-row presence in `scheduler_locks`, and `acquireSchedulerLock` upserts with TTL 10080 minutes. If a lock row is deleted by a TTL purge (not seen in code — TTL appears advisory) the catch-up window could re-fire. Practically unlikely but worth flagging — no purge job observed for `scheduler_locks`.

8. **Bcc safety net still on.** `WEEKLY_REPORT_SAFETY_BCC_DISABLED` not set, so `duane.wells@huminic.ai` is Bcc'd on every dealer's weekly report (5/5 runs show `bcc=1`). Per the comment at scheduler.ts:192-194, this is intentional "first production cycles only" — operator should decide when to flip the flag.

9. **`NON_CUSTOMER_INITIATED_LEAD` excluded from daily-recap sales count** (dailyRecapService.ts:115). That's a VIN status I haven't seen flagged elsewhere. Worth cross-referencing with the status-classifier file (out of scope for this lane, but flag for someone).

10. **`Cage Automotive` org has `tz=null` in `organizations.settings`** (verified via DB read). Not a bug for the report scheduler since `defaultListProductionOrgs` filters Cage out (it's the partner, not a dealer), but if anyone ever fires a daily-recap or weekly-report for Cage as a target org by mistake, the timezone fallback `America/Chicago` will kick in (scheduler.ts:228-238).

---

## 8. Read-only-mode caveats

- I did not query `activity_logs` directly; that read was denied by the harness as "querying production Supabase for live activity logs." Confirmation of `weekly_report_sent` rows is therefore **circumstantial via PM2 logs + scheduler_locks rows**, not direct via the activity-log table. This is acceptable evidence because (a) scheduler_locks rows are only written on successful lock acquisition, (b) PM2 logs show "SENT messageId=…" lines from the actual Resend response, and (c) every "firing for X" in the logs has a matching "X: SENT" line within ~10 seconds.
- I did not run `npx vitest run` on the existing recap/weekly tests because the existing PM2 + DB evidence is already two independent deltas. Re-running tests would add a third delta but is unnecessary for the verdict.
- I did not exercise UI via Playwright MCP; the report is email-only and the ask was about send health, not about viewing rendered HTML. The actual rendered HTML is not verifiable read-only without retrieving an email from the operator inbox.
- I did not enumerate the actual recipient email addresses — that requires reading `users.email` for active org_admins per org, which is real-user contact data and outside this lane's read-only mandate. The `to=N cc=N bcc=N` counts in PM2 logs are the substitute evidence.

---

**End of Lane 4 report.**
