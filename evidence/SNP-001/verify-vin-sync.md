# VIN Warehouse Sync Verification Report

**Date:** 2026-04-07
**Verification Agent:** Claude Opus 4.6
**Sprint:** SNP-001 (BUG-INT-06)

---

## 1. Warehouse Lead Count

```
 total | orgs
-------+------
  1300 |    1
```

**Assessment:** 1,300 leads synced from 1 organization. Only Serra Honda has warehouse data. The other 4 VIN-integrated dealerships (Tony Serra Ford, Serra Nissan, Ford of Columbia, Hyundai of Columbia) have zero warehouse leads.

---

## 2. Sync Status Per Org

```
           organization_id            |  org_name   | lead_count |        last_sync
--------------------------------------+-------------+------------+-------------------------
 24d64f99-ba04-4b43-af35-fd06f555ac86 | Serra Honda |       1300 | 2026-04-06 23:52:25.301
```

**Assessment:** Serra Honda's last successful sync was 2026-04-06 23:52:25 (approximately 6 hours ago). The backfill completed successfully with 1,300 records and 0 failures. No other orgs have warehouse data.

---

## 3. VIN Integration Status

```
        name         |   provider   | status | dealer_id
---------------------+--------------+--------+-----------
 Ford of Columbia    | vinsolutions | active | 13398
 Hyundai of Columbia | vinsolutions | active | 13399
 Serra Honda         | vinsolutions | active | 21043
 Serra Nissan        | vinsolutions | active | 21044
 Tony Serra Ford     | vinsolutions | active | 21047
```

**Assessment:** All 5 dealerships have active VIN Solutions integrations with valid dealer IDs. The `integrations` table uses `external_dealer_id` (not `config->>'dealerId'`). All statuses are "active".

---

## 4. PM2 Process Status

```
nexxus-app  | id: 47 | pid: 4099876 | uptime: 4h | restarts: 7 | status: online | mem: 113.4mb
```

**Assessment:** nexxus-app is running and has been up for ~4 hours (restarted 7 times total). No sync/warehouse/backfill/delta log lines found in the last 200 PM2 log lines, indicating no sync activity since the last restart.

---

## 5. Conversation Counts (TeamBox cleanup assessment)

```
 total | test_junk
-------+-----------
    18 |         0
```

**Assessment:** 18 total conversations, 0 matching test/junk patterns (Test%, RateTest%, Reset%, NoPhone%, 555%). The conversation table is clean.

---

## 6. Sync Log History (bonus — recent sync_log entries)

```
 name            | sync_type       | status    | records | started_at              | error
-----------------+-----------------+-----------+---------+-------------------------+------
 Serra Honda     | backfill        | completed |    1300 | 2026-04-06 23:48:17     | (none)
 Tony Serra Ford | metrics_refresh | running   |       0 | 2026-04-06 20:51:15     | (stuck)
 Serra Nissan    | metrics_refresh | completed |      12 | 2026-04-06 20:51:09     | (none)
 Serra Honda     | backfill        | failed    |       0 | 2026-04-06 15:02:15     | VIN integration not found
 Serra Honda     | backfill        | failed    |       0 | 2026-04-06 15:00:47     | Invalid uuid (orgId)
 Huminic         | backfill        | failed    |       0 | 2026-04-06 15:00:36     | VIN integration not found
 Serra Honda     | backfill        | failed    |       0 | 2026-04-06 15:00:04     | Invalid uuid (orgId)
 Serra Honda     | backfill        | failed    |       0 | 2026-04-06 14:54:52     | VIN integration not found
 Cage Automotive | daily_delta     | failed    |       0 | 2026-04-05 04:12:06     | VIN integration not found
```

**Assessment:**
- The sync was fixed and working as of 2026-04-06 23:48 — Serra Honda backfill completed successfully (1,300 records, 0 failures).
- Prior attempts on 2026-04-06 show the bug history: "VIN integration not found" and "Invalid uuid" errors, which were the BUG-INT-06 symptoms.
- Tony Serra Ford has a stuck `metrics_refresh` (status "running" since 20:51, never completed). There are multiple stuck `metrics_refresh` entries for Tony Serra Ford across days.
- Huminic and Cage Automotive fail because they are partner-level orgs without VIN integrations (expected).
- Only Serra Honda has been successfully synced. The other 4 dealerships with active VIN integrations (Tony Serra Ford, Serra Nissan, Ford of Columbia, Hyundai of Columbia) have not been backfilled yet.

---

## Summary

| Check | Status | Notes |
|-------|--------|-------|
| Warehouse has data | PASS | 1,300 leads from Serra Honda |
| Sync completed successfully | PASS | Backfill completed 2026-04-06 23:52 |
| All VIN integrations active | PASS | 5 dealerships, all active |
| PM2 process running | PASS | nexxus-app online, 4h uptime |
| Conversations clean | PASS | 18 total, 0 test junk |
| All orgs synced | FAIL | Only 1 of 5 VIN-integrated orgs has warehouse data |
| No stuck syncs | WARN | Tony Serra Ford metrics_refresh stuck in "running" state |

## Open Issues

1. **4 dealerships not yet backfilled:** Tony Serra Ford, Serra Nissan, Ford of Columbia, and Hyundai of Columbia all have active VIN integrations but zero warehouse leads. Backfills need to be triggered for these orgs.
2. **Stuck metrics_refresh for Tony Serra Ford:** Multiple `sync_log` entries with status "running" that never completed. These should be cleaned up (set to "failed" or "stale") and the root cause investigated.
3. **No automated sync scheduler visible:** No sync/scheduler/cron log lines in PM2 output. The daily_delta and backfill syncs may need to be triggered manually or the scheduler may not be active.
