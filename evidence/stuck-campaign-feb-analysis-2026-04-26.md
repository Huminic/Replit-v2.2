# Priority 8 — "Service Reminder - February" Stuck Campaign: Archaeology

**Date:** 2026-04-26
**Scope:** Read-only archaeology of the Phase 1 audit finding: campaign "Service Reminder - February" (Serra Honda), status=active, 16 recipients, 0 sent, 0 replied. Determine root cause, propose fix path. No DB writes performed.
**Companion artifacts:** `evidence/stuck-campaign-feb-2026-04-26/` (probe script + raw JSON output).

---

## 1. DB state (probe-stuck-campaign.ts → probe-output.json)

### 1a. Campaign row

| field | value |
|---|---|
| id | `30267ae2-5d81-4c21-b0bf-ad96e4eb31ec` |
| name | `Service Reminder - February` |
| organization_id | `24d64f99-ba04-4b43-af35-fd06f555ac86` (Serra Honda) |
| department | `service` |
| **status** | **`active`** |
| channel | `sms` |
| **execution_status** | **`idle`** |
| **scheduled_at** | **`null`** |
| **execution_started_at** | **`null`** |
| recipient_count | 16 |
| sent_count | 0 |
| replied_count | 0 |
| kill_switch | false |
| csv_filename | `test-recipients.csv` |
| **message_template** | **`null`** (length null) |
| send_interval_seconds | 60 |
| created_at | 2026-04-03 05:01:53 UTC |
| updated_at | 2026-04-03 14:26:45 UTC |

### 1b. Recipient state (campaign_recipients)

| status | count |
|---|---|
| pending | 16 |

All 16 still pending. No `sent_at`, no `delivered_at`. Recipient-row sample shows phones with prefix `20555` — i.e. 555-prefix test numbers (not real customers). All three sampled rows have both phone and email present, so the absence of sends is not a missing-contact issue.

### 1c. Outbound log (outbound_log filtered by campaign_id)

| status | channel | count |
|---|---|---|
| (empty) | (empty) | 0 |

**Zero outbound_log rows** carry this campaign_id. The send pipeline never created an attempt — not a "sent then failed", not a "blocked by CommGate", not a "queued and stuck". It was never invoked.

### 1d. Other scheduled campaigns for serra-honda

| count |
|---|
| 0 |

No other campaigns currently sit in `executionStatus='scheduled'` for this org. The campaign-scheduler tick has nothing to pick up for serra-honda right now.

### 1e. Org-level outbound flags + recent traffic (last 30d)

| flag | value |
|---|---|
| outbound_enabled | **true** |
| sms_enabled | **true** |
| email_enabled | **true** |
| phone_enabled | **true** |

| status | channel | count (30d) |
|---|---|---|
| sent | email | 361 |
| sent | sms | 59 |
| blocked | sms | 178 |
| failed | sms | 31 |
| dry_run | phone | 2 |
| dry_run | sms | 2 |

CommGate is fully ON for Serra Honda and the org has been actively sending in the last 30 days (361 emails sent, 59 SMS sent). The org's outbound pipeline is healthy. The 178 blocked SMS rows reflect normal CommGate enforcement (test-lane / unauthorized-recipient blocks elsewhere in the system) — they are not associated with this campaign.

---

## 2. Code path traced (read-only)

### 2a. Scheduler-eligibility filter

`server/services/scheduler.ts:41-63` — `checkScheduledCampaigns()` runs every 60s (line 809). It calls `storage.getScheduledCampaigns()`.

`server/storage.ts:483-490` — `getScheduledCampaigns()`:

```ts
return db.select().from(campaigns).where(
  and(
    eq(campaigns.executionStatus, "scheduled"),
    lte(campaigns.scheduledAt, new Date())
  )
);
```

**Two AND-conditions for scheduler eligibility:**
1. `execution_status = 'scheduled'` — this campaign has `idle`. Fails.
2. `scheduled_at <= now()` — this campaign has `null`. Fails (`null <= now()` is `null`, which is not `true` in SQL — row excluded).

The campaign is invisible to the scheduler on TWO counts. It will never be picked up regardless of how long it sits.

### 2b. The only code path that flips `idle → scheduled`

`server/routes/campaigns.ts:222-272` — `POST /api/campaigns/:id/execute`. When the request body carries a future-dated `scheduledAt`, it does:

```ts
await storage.updateCampaign(req.params.id, {
  scheduledAt,
  status: "scheduled",
  executionStatus: "scheduled",
});
```

Otherwise (no scheduledAt or scheduledAt in the past), it calls `startCampaignExecution()` directly for an immediate run.

**Conclusion: the user uploaded the CSV (creating the campaign + 16 recipients) but never invoked POST /api/campaigns/:id/execute.** Either they intended to schedule it and got distracted, or they uploaded it to test the upload flow itself.

### 2c. UI display vs scheduler-eligibility — the audit confusion

`client/src/pages/service.tsx:413` displays `campaign.status` (the row's `status` field, which is `'active'` here) as the user-facing label. But scheduler eligibility lives on the *separate* `execution_status` field. So an admin looking at the Service campaigns list sees this campaign rendered as "active" while the scheduler treats it as `idle`. **The Phase 1 audit's "status: active" reading was correct; it just doesn't mean what the user might think it means.**

The two fields drift apart in this code path: when the user uploads a CSV, only `status` is set (likely to `'active'` — TBD by separate confirmation, but the row shows `active`); `execution_status` defaults to `'idle'` per the schema (`shared/schema.ts:136`). They only re-converge when execute/schedule is clicked.

---

## 3. Root cause

**Stale state — operator/admin action never taken.** This is not a code/scheduler bug, not a CommGate block, not a date/window issue.

Specifically:
1. On 2026-04-03 at 05:01 UTC, someone uploaded `test-recipients.csv` with 16 entries (555-prefix test phones), which created the campaign row + 16 recipient rows.
2. The campaign row was created with `status='active'` and `executionStatus='idle'` (default).
3. **No one ever clicked Execute or scheduled it.** No `scheduledAt`, no `messageTemplate`, no `executionStartedAt`.
4. The scheduler has been ticking every 60s since 2026-04-03 and correctly excluding this campaign on its two-condition filter.
5. The audit saw `status='active'` in the DB / UI and reasonably flagged it.

Supporting indicators that this was an abandoned test upload, not a real campaign:
- `csv_filename: "test-recipients.csv"` — file naming convention is "test", not "service-reminder-feb-2026.csv" or similar.
- All 16 recipient phones use the `20555` prefix — North American 555 test-number prefix, not real customer numbers.
- `message_template` is `null` — the campaign has nothing to send. Even a manual Execute click would produce 16 sends of the default fallback `"Hello {{customerName}}, this is a message from {{dealershipName}}."` (from `outbound.ts:751`).

---

## 4. Fix paths

### Path A — DB cleanup (preferred): delete the row

Single SQL operation:
```sql
-- Will cascade-delete the 16 campaign_recipients rows via the FK ON DELETE CASCADE
DELETE FROM campaigns WHERE id = '30267ae2-5d81-4c21-b0bf-ad96e4eb31ec';
```

Cascade behavior verified from schema:
- `campaign_recipients.campaign_id` → `campaigns.id` ON DELETE CASCADE — 16 recipient rows removed.
- `outbound_log.campaign_id` → `campaigns.id` ON DELETE SET NULL — but there are 0 outbound_log rows for this campaign, so no impact.

Pros:
- Clears the audit-flagged anomaly entirely.
- No code change needed.
- Recipient phones are 555-prefix tests, not real customer data — no consent / retention implications.

Cons:
- Destructive (irreversible without DB backup).
- Doesn't address the root UX issue: the field-naming confusion that allowed a "never executed" campaign to render as "active".

**Requires operator approval per CLAUDE.md "Confirm with operator first" / Action classification rules. STOP point.**

### Path B — Soft archive instead of delete

Single UPDATE:
```sql
UPDATE campaigns
SET status = 'archived',
    kill_switch = true,
    updated_at = now()
WHERE id = '30267ae2-5d81-4c21-b0bf-ad96e4eb31ec';
```

Pros:
- Reversible.
- Preserves audit trail.

Cons:
- "archived" is not currently an enumerated value used elsewhere in the codebase — quick `grep` shows status values in active use are `draft`, `active`, `scheduled`, `paused`, `completed`, `stopped`. Adding "archived" without a corresponding UI/scheduler treatment risks introducing a new edge case.
- The campaign row would still show in the Service campaigns list unless the UI was also updated to filter `archived` out.

### Path C — UI / status-naming code fix (no DB write)

Surface scheduler-eligibility (`executionStatus`) as the primary status indicator in the campaigns list, OR rename the user-facing label to disambiguate.

Concretely: in `client/src/pages/service.tsx:412-413`, derive the displayed label from a combined view, e.g.:
- `executionStatus='executing'` → "Running"
- `executionStatus='scheduled'` → "Scheduled"
- `executionStatus='idle'` AND `status='active'` → "Ready (not started)" or "Draft (uploaded, not run)"
- `executionStatus='completed'` → "Completed"

Pros:
- Addresses the underlying UX hazard for ALL future stuck-campaign scenarios.
- No DB write.

Cons:
- UI change — requires per-file scope marker on `service.tsx` and operator approval per the UI-protection rule in CLAUDE.md.
- Larger surface than the audit cleanup task itself; should probably be tracked separately as a UX-improvement backlog item rather than folded in here.

### Path D — Combined: Path A + a small backlog entry for Path C

Most aligned with the operator's bounded-execution mode. Delete the stuck row (with explicit operator approval), record the UX-naming hazard as a discrete backlog item for later sprint.

---

## 5. Recommendation

**Path D — Path A (delete the row, with operator approval) + record Path C as a backlog item.**

Reasoning:
- The campaign is unambiguously a stale test upload (filename, phone prefix, null template). Cleaning it is low-risk.
- The UI/naming issue is real but not launch-blocking. It would mislead admins again in the future, but it's a UX-quality item not a launch-critical one. Backlog it for a UX-cleanup sprint.
- This keeps Priority 8's surface tight and matches the "best-effort" + bounded-execution mode set 2026-04-26.

---

## 6. STOP point — operator approval required for ANY DB write

Per CLAUDE.md Action Classification, ANY destructive DB operation requires explicit operator "go". I am NOT executing the DELETE. I am surfacing it.

**Awaiting operator decision on:**

| Decision | Effect |
|---|---|
| GO Path A | I prepare a DB-write script for review, you eyeball the exact SQL, you say "execute" — only then do I run it. |
| GO Path B (archive) | Same review-then-execute flow but with the UPDATE instead of DELETE. |
| HOLD | Leave the row as-is. I record the finding in `issues.md` for tracking and move on. |
| Path D | GO Path A + I add a backlog entry for the UI/naming fix (Path C). |

I will also offer (separately, on request, not as part of this archaeology):
- A pre-write read-only "what would be deleted" SQL preview.
- A safety check that the cascade FK behaves as documented (16 recipient rows + 0 outbound_log rows confirmed; cascade should remove exactly 17 rows total).

---

## 7. What this archaeology did NOT do

- No DB writes (no DELETE, no UPDATE).
- No campaign-execute API call.
- No code changes.
- No production deploy.
- No test-lane reset.
- No real-customer impact assessment beyond confirming the recipient phones are 555-prefix test numbers.

---

**End of archaeology. Awaiting parent / operator decision.**
