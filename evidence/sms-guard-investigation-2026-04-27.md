# SMS Guard Investigation — Phase 1 (2026-04-27)

**Status:** READ-ONLY INVESTIGATION COMPLETE. Pause before Phase 2 build.
**Inputs:** the 8 real-looking SMS recipient phones from `evidence/sms-audit-2026-04-27.md`.
**Source data:** saved snapshot (deleted Serra Honda conversations) + live `outbound_log` + `warehouse_leads` + `campaigns` + `activity_log`.
**Probes:** `evidence/sms-audit-2026-04-27/probe-phone-provenance.ts`, `probe-batch-trace.ts`, `probe-org-changes.ts`.

---

## 1. Headline

**7 of 8 real-looking customer phones are real Honda customer leads in Serra Honda's `warehouse_leads`** (`data_source = 'vin_solutions'`, `dealerid=21043`, real VIN source IDs and statuses). Pre-launch SMS sends went to actual Honda customers in real CRM workflow stages.

**The 01:59 sends were not the result of CommGate flag toggling.** They were caused by `evaluateAfterHoursTrigger` in `server/services/triggerService.ts` calling `processOutboundSend({ bypassBusinessHours: true })`. The bypass was removed in commit `8acc270` ("I-272/273/274 trigger bugs") on/after 2026-04-13, but the 8 sends had already happened.

The trigger system is now also subject to operator policy classification (per 2026-04-27 data retention rule, "Outbound triggers — NOT active for launch traffic yet — classify before delete"). The trigger code path remains in the codebase and remains a vector if (a) the bypass were ever re-introduced or (b) any other trigger / engagement code path ever called the SMS chokepoint without going through `processOutboundSend`. **The proposed Phase 2 fail-closed guard is the structural answer.**

---

## 2. Lead-provenance per phone

| name | phone | warehouse_leads | data_source | VIN status | lead_source URL | provenance |
|---|---|---|---|---|---|---|
| Donna Murphy | 4125199087 | 0 | (CSV only) | n/a | n/a | `service-campaign-test.csv` (campaign 35651dbd `Launch Day Service Test`) |
| Lisa Morris | 5417783509 | 2 | vin_solutions | SERVICE_APPOINTMENT_SCHEDULED | leadsources/id/7098 | **REAL Honda lead — service appointment scheduled** |
| Noah Koger | 6623046188 | 1 | vin_solutions | SERVICE_APPOINTMENT_SCHEDULED | leadsources/id/7098 | **REAL Honda lead — service appointment scheduled** |
| Jennifer Jones | 2564527205 | 1 | vin_solutions | ACTIVE_ACTIVE_LEAD | leadsources/id/3897777 | **REAL Honda lead — active sales lead** |
| Jennifer Ueltschey | 6019517616 | 1 | vin_solutions | ACTIVE_WAITING_FOR_PROSPECT_RESPONSE | leadsources/id/3743779 | **REAL Honda lead — pending response** |
| Fedor Zanin | 8594458581 | 1 | vin_solutions | ACTIVE_WAITING_FOR_PROSPECT_RESPONSE | leadsources/id/71184 | **REAL Honda lead — pending response** |
| Richard Chambliss | 2567944375 | 3 | vin_solutions | ACTIVE_WAITING_FOR_PROSPECT_RESPONSE / BAD_DUPLICATE_LEAD x2 | leadsources/id/3750035 (x2) + 36 | **REAL Honda lead — pending + dup-tagged** |
| Allie Nix | 2054102897 | 1 | vin_solutions | ACTIVE_WAITING_FOR_PROSPECT_RESPONSE | leadsources/id/71184 | **REAL Honda lead — pending response** |

All 7 VIN-synced rows carry `dealerid=21043` — Serra Honda's actual VIN Solutions dealer ID. These are leads from real Honda inquiries that flowed into Serra Honda's CRM via lead-gen sources (likely AutoTrader / web-form inquiries / service-portal bookings). 3 of 8 phones are in 256/205/256 = Alabama (Serra Honda's home state).

**Conclusion: the 8 sends went to real Honda customers/prospects, not test fixtures.** Donna Murphy (the only CSV-origin phone) carries a real-looking name + 412 (Pittsburgh) area code; we cannot prove from DB whether she is a real person or an operator-supplied fixture name on the test CSV.

---

## 3. Reconstruction of the 2026-04-13 01:59 UTC sent batch

### 3a. Timeline (UTC)

| time UTC | event | rows |
|---|---|---|
| 2026-04-12 23:39 | `Launch Day Service Test` campaign starts (`execution_started_at`) | campaign id 35651dbd |
| 2026-04-12 23:40-23:43 | 5 service-template SMS sent (Donna, Duane, Durran, Sarita + 1 other) | campaign 35651dbd |
| 2026-04-12 23:54 | Last 23:54 send (system-targeted to `18338096836`) | sent |
| 2026-04-13 01:54:11-01:54:16 | **First batch of 10 engagement-template SMS attempted** (8 real customers + 2 testleads) | all blocked: `Outside business hours` |
| 2026-04-13 01:54:35-01:54:40 | **Second batch retry of same 10 phones** | all blocked: `Outside business hours` |
| 2026-04-13 01:59:38-01:59:54 | **Third batch — same 10 phones — 9 SENT, 1 dup-blocked** | sent (phones in scope, except an `18338096836` self-send blocked) |
| 2026-04-13 01:59:50-02:02:14 | Auto-response template to `18338096836` (org's own outbound number) | all blocked: `Outside business hours` |

The 01:59:38-01:59:54 batch fired **9 SMS in 16 seconds**. Per-recipient sequence: 4125550199 (AfterHours TestLead) → 5417783509 (Lisa) → 6623046188 (Noah) → 2564527205 (Jennifer J) → 6019517616 (Jennifer U) → 8594458581 (Fedor) → 2567944375 (Richard) → 4126546500 (Trigger TestLead = operator's allowlisted phone) → 2054102897 (Allie). Spacing: ~1.7-2.3 seconds. Internally consistent with a tight loop in a trigger evaluator, NOT with `campaigns.send_interval_seconds = 60`.

### 3b. The 9 corresponding `activity_log` entries

```
2026-04-13T01:59:38 | trigger_after_hours_sent | metadata: { phone, leadSource, triggerType, customerName }
2026-04-13T01:59:41 | trigger_after_hours_sent | (same shape)
2026-04-13T01:59:42 | trigger_after_hours_sent
2026-04-13T01:59:44 | trigger_after_hours_sent
2026-04-13T01:59:46 | trigger_after_hours_sent
2026-04-13T01:59:48 | trigger_after_hours_sent
2026-04-13T01:59:50 | trigger_after_hours_sent
2026-04-13T01:59:52 | trigger_after_hours_sent
2026-04-13T01:59:54 | trigger_after_hours_sent
```

Action `trigger_after_hours_sent` only existed in `triggerService.ts` BEFORE commit `8acc270`. After `8acc270` the same site writes `trigger_after_hours_deferred` instead and skips the actual send. So the activity_log timestamp confirms: this was the **pre-fix `evaluateAfterHoursTrigger`** firing on freshly-synced VIN leads.

### 3c. Why the 01:54 batches blocked but the 01:59 batch sent

The pre-fix `evaluateAfterHoursTrigger` (commit `58ecc8d`) called:

```ts
const result = await processOutboundSend({
  organizationId: org.id,
  channel: "sms",
  to: lead.customerPhone,
  messageContent: message,
  recipientName: lead.customerName,
  bypassBusinessHours: true,  // After-hours trigger explicitly sends outside business hours
});
```

`processOutboundSend` then called `checkCommGate(..., bypassBusinessHours)`. `checkCommGate` at line 411 of `outbound.ts`:

```ts
if (channel === "sms" || channel === "phone") {
  if (bypassBusinessHours) {
    console.log(`[CommGate] Business hours check bypassed (trigger-authorized)`);
  } else {
    // ... business hours check ...
  }
}
```

So **when `bypassBusinessHours: true`, the business-hours check is skipped entirely**. The 01:59 batch must have been emitted by a code path passing `bypassBusinessHours: true`, while the 01:54 batches did not pass the flag (or passed it as `false`).

Two possibilities:

1. **A code change deployed between 01:54 and 01:59** that set `bypassBusinessHours: true` on the trigger send. Plausible: this matches the 5-minute gap exactly.
2. **A retry loop** where the first batch was emitted from a path WITHOUT bypass (e.g., a manual UI action) and the second batch was emitted from `evaluateAfterHoursTrigger` which DOES set bypass. The trigger scheduler runs every 15 minutes per `TRIGGER_INTERVAL_MS`, but a manual invocation could have been triggered.

Either way, **the structural defect is that `bypassBusinessHours: true` existed and was reachable.** The `8acc270` fix removed the bypass in the trigger code, but did not prevent any future caller from setting it. **The proposed Phase 2 fail-closed pre-launch guard would block this regardless of bypassBusinessHours, even if a future caller re-introduces it.**

### 3d. CommGate flag history

The `activity_log` for serra-honda shows ~50 `settings_updated` rows in the 2026-04-04/05 window, all with `metadata.sections = ['textmagicPhone']` (operator iteratively setting the TextMagic outbound number). **No business-hours / sms_enabled / outbound_enabled toggles in the audit window.**

**Observability gap surfaced:** the activity_log records WHICH fields changed (`Object.keys(parsed.data).join(", ")` at `server/routes/organizations.ts:379`) but NOT the before/after values. If the operator had toggled `businessHoursEnd` from "21" to "23" between 01:54 and 01:59 ET (then back), the audit log would show only `sections: ['businessHoursEnd']` without revealing the toggle direction. **Recommendation: extend the activity_log metadata to include before/after values for sensitive flags** (sms_enabled, outbound_enabled, businessHoursStart/End, killSwitch). Tracked separately as a follow-up; not blocking Phase 2.

---

## 4. SMS-send code-path inventory

### 4a. Provider chokepoint

`server/outbound.ts:209` — `sendSmsRaw(to, content, fromNumber)` is the **only** function that actually calls the SMS provider. It hits `callMCP("tm_send_message", mcpParams)` (line 222). Every other SMS-send path eventually reaches this function.

### 4b. Direct callers of `sendSmsRaw` and `sendSms`

| call site | through `processOutboundSend`? | guards run | risk |
|---|---|---|---|
| `server/outbound.ts:184` (`sendStopConfirmation` → `sendSmsRaw`) | NO | only `OUTBOUND_LIVE_ENABLED` and a 1-hour rate cache | **BYPASSES test-lane + commgate + business-hours** |
| `server/outbound.ts:249` (`sendSms` → `sendSmsRaw`) | NO (callable directly) | only blacklist + length checks | **BYPASSES test-lane + commgate + business-hours** if called directly |
| `server/outbound.ts:572` (`processOutboundSend` → `sendSms`) | YES | full chain: test-lane → commgate (business-hours / blacklist / rate-limit / kill-switch) → blacklist (in `sendSms`) | safe per design (modulo `bypassBusinessHours`) |

`sendSms` is not currently invoked from anywhere except `processOutboundSend:572` (verified by grep). But the function is `export`-ed, so any future caller could reach it directly.

`sendStopConfirmation` calls `sendSmsRaw` directly. That code path is intentional (STOP-keyword reply doesn't go through campaigns) but it would still hit a real provider during pre-launch — operator's policy is "TextMagic / SMS NOT in customer use yet; only test numbers should appear", so even STOP confirmations should be allowlist-bound during pre-launch.

### 4c. Indirect callers of `processOutboundSend` (12 sites)

```
server/outbound.ts:788                        startCampaignExecution → processOutboundSend  (campaign sends)
server/routes/sms.ts:215                      inbound-SMS auto-response                       (after-hours / agent reply)
server/routes/sms.ts:394                      inbound-SMS greeting                            (first-touch reply)
server/routes/sms.ts:536                      manual SMS send                                 (UI-driven)
server/routes/conversations.ts:69             reply from conversation thread                  (UI-driven)
server/routes/conversations.ts:257            send-from-conversation alternate path           (UI-driven)
server/services/scheduler.ts:84               queued-SMS scheduled action                     (after-hours queue)
server/services/scheduler.ts:535              executeTriggerAction sms                        (legacy stale-lead trigger)
server/services/scheduler.ts:543              executeTriggerAction phone                      (out of SMS scope but same chokepoint)
server/services/scheduler.ts:552              executeTriggerAction email                      (out of SMS scope)
server/services/scheduler.ts:615              new_lead_followup multi-step                    (per-lead trigger)
server/services/scheduler.ts:698              new_lead_followup single-step                   (per-lead trigger)
server/services/triggerService.ts:412         evaluateCheckInTrigger (24h check-in)           (per-lead trigger)
```

All 12 paths benefit from `processOutboundSend`'s test-lane + commgate chain. None currently pass `bypassBusinessHours: true` (verified by grep `bypassBusinessHours.*true` returns 0 hits in `server/`).

### 4d. Operability gap analysis — where must the new guard sit?

| guard location | covers `processOutboundSend` callers? | covers `sendStopConfirmation`? | covers direct `sendSms`? | covers any future direct caller of `sendSmsRaw`? |
|---|---|---|---|---|
| In `processOutboundSend` only | YES | NO | NO | NO |
| In `sendSms` only | YES (it's downstream) | NO | YES | NO |
| In `sendSmsRaw` only | YES | YES | YES | **YES** |

**The Phase 2 guard MUST go in `sendSmsRaw`.** Anything higher leaves at least one provider-reachable path uncovered.

Implementation note: `sendSmsRaw` does not currently receive an `organizationId` argument (`function sendSmsRaw(to: string, content: string, fromNumber?: string)`). The guard does not need `organizationId` because the allowlist check is destination-based, not org-based. Phone-string + env state + allowlist is sufficient.

---

## 5. Hypothesis for the 01:54 → 01:59 transition (confidence: medium-high)

The most likely chain of events:

1. **Operator/staff manually triggered the trigger evaluator** at 01:54 UTC (e.g., by hitting a `/api/triggers/run` endpoint, by restarting the server with `triggersEnabled: true`, or by a dev script). The trigger evaluator emitted SMS via `processOutboundSend` WITHOUT setting `bypassBusinessHours`, so `checkCommGate` blocked them all on business hours.
2. **Operator/staff noticed the blocks** in the activity log and either (a) deployed the version of `triggerService.ts` that had `bypassBusinessHours: true` on the call, or (b) re-ran the trigger evaluator with a code-path that includes the bypass.
3. The 01:59 batch fired with `bypassBusinessHours: true`, the business-hours guard was skipped, and 8 real Honda customers + 1 testlead phone received SMS.
4. **After the incident, commit `8acc270`** (recorded as `INC-001` in the operator's known-bugs list) removed `bypassBusinessHours: true` from the trigger code path entirely and replaced the send with a deferred-action audit row.

Caveats:
- We cannot confirm exactly what happened at 01:54-01:59 because the activity_log only records WHICH fields changed, not values, and there is no deployment-event log in the DB.
- The hypothesis is consistent with: the file diff history (`58ecc8d` → `8acc270`), the per-row send results, the activity_log shape (`trigger_after_hours_sent` rows starting at 01:59), and the commit message ("I-272 TCPA bypass must be removed", "INC-001 logged" in tasks).
- Confidence is "medium-high" rather than "high" only because we cannot timestamp the deployment events that toggled the code in production.

---

## 6. Phase 2 guard design — operability-gap-driven spec

### 6a. Where: `server/outbound.ts:sendSmsRaw`

Per §4d. This is the only single point that catches every SMS-emitting code path.

### 6b. What: fail-closed allowlist gate

```
if (PRELAUNCH_SMS_LOCK === "true" || TESTLANE_MODE === "true") {
  if (!recipient || empty allowlist || file-missing) → BLOCK + log + throw with explicit reason
  if (recipient is on .claude/state/test-recipients.txt allowlist) → continue
  else → BLOCK + log + throw with explicit reason
}
// PRELAUNCH_SMS_LOCK=false and TESTLANE_MODE=false → no behavior change
```

The guard MUST throw, not silently return. Two reasons:
1. `processOutboundSend` is the upstream caller for most paths and it expects `sendSmsRaw` to either succeed or throw. Throwing puts the block on the same channel as a provider-side failure (already handled by the catch at `outbound.ts:223-227`). The catch then bubbles up so `processOutboundSend.logAttempt` writes a `failed`/`blocked` outbound_log row.
2. `sendStopConfirmation` only handles `try/catch`-rethrow. Throwing causes the row to log to outbound_log via the surrounding function's logging.

But the guard should ALSO write its own `outbound_log` row directly (with `status='blocked'`, `blockedReason='prelaunch-sms-lock: ...'`) so the block is visible regardless of the upstream caller's logging discipline. This addresses the audit-trail concern.

### 6c. Recipient normalization

The allowlist file uses formats like `+14126546500` (E.164) and the live `outbound_log.recipient_phone` carries phones like `4126546500` (10-digit). The guard must normalize both sides to digits-only before comparison, and accept the variants `1XXXXXXXXXX` ↔ `XXXXXXXXXX` as equivalent (matches the 2026-04-26 test-lane guard's existing pattern).

### 6d. Allowlist file location

`/home/ubuntu/Claude-store/nexxus2.2_replit/.claude/state/test-recipients.txt`. Path is project-relative; resolve via `process.env.CLAUDE_PROJECT_DIR || process.cwd()` to remain robust across PM2 / dev / build invocations. **Hard-fail if file missing** rather than silently allow (per operator's "fail-closed" instruction).

### 6e. Default value for `PRELAUNCH_SMS_LOCK`

Operator instruction: "default `true` for safety until operator explicitly clears it". Per the spec, when `PRELAUNCH_SMS_LOCK` is unset, default to `true`. Operator must set `PRELAUNCH_SMS_LOCK=false` in `.env` after launch to disable.

### 6f. Test surface

Pure function: takes `(recipient: string, env: { PRELAUNCH_SMS_LOCK?, TESTLANE_MODE? }, loadAllowlist: () => string[])` → `{ allow: boolean, reason: string }`. The `loadAllowlist` injection makes the function testable without touching the filesystem; the production wrapper provides a default loader that reads `test-recipients.txt`.

9 unit tests per the operator spec. Plus 2 additional cases I'd add:
- 10. Allowlist entry with category prefix (`internal_operator:+14126546500`) matches a recipient in any normalized form.
- 11. Allowlist entry with comment (`# foo`) is ignored; blank lines ignored.

---

## 7. STOP point

Phase 1 read-only investigation complete. **No DB writes. No code changes.**

Awaiting operator decision before Phase 2 build:

| decision | effect |
|---|---|
| Greenlight Phase 2 spec as written | I implement guard + tests; commit; await verifiers |
| Adjust spec (e.g., where guard sits, throw-vs-return semantics, allowlist format) | I revise design and re-pause for review before build |
| Pause everything pending TCPA/compliance disposition for the 8 real customers | I add the 8 phones to `issues.md` as a blocker on launch readiness; do not proceed with Phase 2 until operator decides |

**Constraints honored:**
- Read-only DB queries only (4 SELECTs across 3 probes).
- No DB writes, no outbound sends, no code changes.
- No production deploy.
- Local commit only (this commit ships the analysis doc + 3 read-only probes + their JSON outputs).

---

## 8. Cross-references

- `evidence/sms-audit-2026-04-27.md` — the original audit that surfaced the 16 SMS phones.
- `evidence/sms-audit-2026-04-27/probe-phone-provenance.ts` + `phone-provenance.json` — VIN/CSV/conversation/outbound_log per phone.
- `evidence/sms-audit-2026-04-27/probe-batch-trace.ts` + `batch-trace.json` — per-minute timeline of the 01:54-02:05 window with full message previews.
- `evidence/sms-audit-2026-04-27/probe-org-changes.ts` + `org-changes.json` — activity_log dump for the org and the trigger window.
- `server/outbound.ts:209` — `sendSmsRaw` (the proposed guard site).
- `server/outbound.ts:411` — `checkCommGate` business-hours bypass.
- `server/services/triggerService.ts:182-302` — current `evaluateAfterHoursTrigger` (post-fix; defers, does not send).
- Commit `58ecc8d` — original trigger code with `bypassBusinessHours: true`.
- Commit `8acc270` — fix removing the bypass (INC-001).
- Allowlist: `.claude/state/test-recipients.txt`.

---

**End of Phase 1 investigation.**
