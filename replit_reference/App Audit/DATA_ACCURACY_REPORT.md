# Data Accuracy Report

**Generated:** 2026-02-19
**Purpose:** Compare local database records against external API sources to verify data accuracy.

---

## VAPI Voice Calls

### Audit Summary

| Metric | VAPI API | Local DB | Match? |
|--------|----------|----------|--------|
| Total Calls (all time) | 832 | 159 | **NO** |
| Real Calls in DB (non-test) | -- | 137 | -- |
| Test/Dummy Records in DB | -- | 22 (test-e2e) + 2 (dummy) | -- |
| Post-V2 Calls (since 2026-02-02) | 92 | 26 (matched) | **NO** |
| Matched Records (in both) | 135 | 135 | YES |
| Missing from DB (in VAPI, not in DB) | 697 | -- | **CRITICAL** |
| DB-only (not in VAPI API) | -- | 24 | Expected (test data) |

**Verdict:** Of 92 calls that occurred after V2 went live, only 26 (28%) are present in the local database. The remaining 66 calls are missing. All 137 real records were loaded via two bulk imports (not real-time webhooks).

---

### Call Status Mapping

| Status | VAPI API | Local DB | Notes |
|--------|----------|----------|-------|
| ended | 832 (100%) | 59 (37%) | VAPI uses "ended" for all completed calls |
| completed | 0 | 99 (62%) | DB uses "completed" -- set by webhook handler |
| in_progress | 0 | 1 (1%) | Stale record -- call never received end event |

**Observation:** VAPI API reports all calls as `ended`. The local DB maps this to `completed` during end-of-call-report processing, or leaves it as `ended` if only `call.ended` was received. This is a cosmetic mismatch, not a data integrity issue.

---

### Duration and Content Comparison (137 real DB records)

| Metric | VAPI API (all 832) | VAPI API (post-V2, 92) | Local DB (137 real) |
|--------|-------------------|------------------------|---------------------|
| Total Duration | 56,130s (15.6 hrs) | 5,520s (1.5 hrs) | 13,739s (3.8 hrs) |
| Avg Duration | 81s | 67s | 103s |
| Min Duration | -- | -- | 0s |
| Max Duration | -- | -- | 600s |
| Has Transcript | -- | -- | 131 (96%) |
| Has Summary | -- | -- | 74 (54%) |
| Has Recording URL | -- | -- | 131 (96%) |
| Notifications Sent | -- | -- | 0 (0%) |
| Credits Recorded | -- | -- | 0 (0%) |

---

### Organization Distribution

| Organization | Post-V2 VAPI Calls (registered asst.) | Local DB (all time) | Matched | Missing Since |
|-------------|---------------------------------------|---------------------|---------|---------------|
| Hyundai of Columbia | 40 | 66 | 19 | Feb 10, 2026 |
| Ford of Columbia | 12 | 29 | 7 | Feb 11, 2026 |
| Serra Honda of Sylacauga | 1 | 34 | -- | -- |
| Serra Nissan of Sylacauga | 0 | 6 | -- | -- |
| Tony Serra Ford | 0 | 2 | -- | -- |

---

### Data Import History

All 137 real records were created by two bulk imports, not by real-time webhooks:

| Import Date | Records Created | Call Date Range |
|------------|----------------|----------------|
| 2026-01-31 | 59 | 2026-01-08 to 2026-01-31 |
| 2026-02-09 | 76 | 2026-01-12 to 2026-02-09 |

Evidence: The `created_at` column shows only these two distinct dates across all real records. No records have been created since Feb 9 despite 66 new VAPI calls.

---

### VAPI Assistant Registration Audit

| VAPI Assistant ID | Name | Server URL | Registered in `agents` table? | Missing Post-V2 Calls |
|------------------|------|------------|-------------------------------|----------------------|
| `6d12a8fa` | Elizabeth | nexxusv2.huminicdev.com/api/webhooks/vapi | YES (Hyundai of Columbia) | 21 |
| `6216451c` | Savannah | nexxusv2.huminicdev.com/api/webhooks/vapi | YES (Ford of Columbia) | 5 |
| `90a876c0` | Caroline | nexxusv2.huminicdev.com/api/webhooks/vapi | YES (Serra Honda) | 1 |
| `10dbe3a9` | Andor | mcp.huminicdev.com/vapi/webhook | NO | 23 |
| `c303d993` | Elliott | nexxusv2.huminicdev.com/api/webhooks/vapi | NO | 9 |
| `f499e129` | Gabrielle | NOT SET | NO | 6 |
| `ad478eb2` | Georgia | nexxusv2.huminicdev.com/api/webhooks/vapi | YES (Tony Serra Ford) | 0 |
| `2203b188` | Magnolia | nexxusv2.huminicdev.com/api/webhooks/vapi | YES (Serra Nissan) | 0 |

**18 total assistants on the VAPI account.** 5 registered in V2 `agents` table, 6 with server URL pointing to V2, 7 with no server URL set.

---

### Root Cause Analysis

#### CRITICAL FINDING: Real-Time Webhook Ingestion is Broken

**All 137 real records in `vapi_call_logs` were BULK IMPORTED, not created by real-time webhooks.**

The webhook handler IS receiving `end-of-call-report` events from VAPI (confirmed in PM2 logs for calls `019c6e28`, `019c6e67`, `019c710b` on Feb 18). However, the `call.started` event -- which is responsible for the initial INSERT into the database -- is never received for real production calls.

#### Why Calls Are Not Being Stored

1. **VAPI sends `end-of-call-report` but NOT `call.started` for real calls.** PM2 log analysis across all rotated files shows 6 `call.started` events -- ALL from E2E tests (IDs prefixed `test-e2e-*`). Zero real production `call.started` events have been received.

2. **The webhook handler requires `call.started` to INSERT the initial record.** The `handleCallStarted()` function does the `INSERT INTO vapi_call_logs`. All other handlers (`handleCallEnded`, `handleEndOfCallReport`) only do `UPDATE ... WHERE vapi_call_id = $1` -- they cannot create records.

3. **When `call.started` never arrives, `end-of-call-report` updates 0 rows.** The `UPDATE` silently succeeds with 0 affected rows. Transcript, summary, recording URL, and all other data are lost.

4. **The idempotency guards produce misleading log messages.** The atomic guard `UPDATE ... SET notification_sent = true WHERE vapi_call_id = $1 AND notification_sent = false RETURNING id` returns 0 rows when the row does not exist. The code interprets this as "already sent" and logs "Notification already sent" -- but the real cause is "row does not exist."

#### Data Flow (Current Broken State)

```
Real VAPI Call:
  call.started          --> NOT received by V2 (VAPI not sending or server was down)
  call.ended            --> NOT received by V2
  end-of-call-report    --> RECEIVED, but UPDATE finds no row
                            Transcript, summary, recording -> LOST
                            Notification guard -> "already sent" (row missing)
                            Credit guard -> "already recorded" (row missing)

E2E Test Call:
  call.started          --> RECEIVED (Playwright hits webhook directly)
  call.ended            --> RECEIVED
  end-of-call-report    --> RECEIVED, UPDATE succeeds -> Works correctly
```

#### Why `call.started` Is Not Being Received

Possible causes (require VAPI dashboard investigation):

1. **Org-level server URL not configured.** VAPI may require the organization-level "Server URL" in the dashboard for real-time events (`call.started`, `call.ended`), while the assistant-level `serverUrl` only controls `end-of-call-report` delivery.

2. **Event subscription configuration.** VAPI may require explicit event subscription in the dashboard for `call.started` and `call.ended`.

3. **PM2 crash-looping.** The nexxus-v2 PM2 process has restarted **3,247 times** with only minutes of uptime at a stretch. Real-time events like `call.started` (which fire once with no retry) may arrive during downtime and be permanently lost, while `end-of-call-report` has more aggressive retry behavior.

---

### Additional Findings

#### No Credits or Notifications Recorded

| Metric | Count | Expected | Status |
|--------|-------|----------|--------|
| `notification_sent = true` | 0 of 137 | 137 | **BROKEN** |
| `credit_recorded = true` | 0 of 137 | 137 | **BROKEN** |

All real records were bulk-imported before the notification/credit columns existed (or before the logic was wired). The `end-of-call-report` webhook retries cannot fix this because the idempotency guards find no matching rows.

#### DB-Only Records (24)

| Type | Count | Explanation |
|------|-------|-------------|
| `test-e2e-*` IDs | 22 | E2E test records -- expected |
| `call_abc123` | 1 | Dummy/seed data |
| `call_def456` | 1 | Dummy/seed data |

#### Unregistered Assistants (38 post-V2 calls)

| Assistant | Calls | Issue |
|-----------|-------|-------|
| Andor (`10dbe3a9`) | 23 | Webhook points to `mcp.huminicdev.com`, not V2 |
| Elliott (`c303d993`) | 9 | Not in `agents` table -- org resolution fails |
| Gabrielle (`f499e129`) | 6 | No server URL in VAPI -- webhooks never sent |

#### PM2 Process Instability

- **Restarts:** 3,247
- **Uptime at audit time:** 3 minutes
- **Error log causes:** IMAP auth failure (EmailService), missing `dist/public/index.html`, socket timeouts
- **Impact:** Frequent restarts mean the server is down when time-sensitive `call.started` events arrive

---

### Recommendations

| Priority | Action | Impact |
|----------|--------|--------|
| **P0** | Fix `handleEndOfCallReport` to UPSERT (INSERT ... ON CONFLICT DO UPDATE) instead of UPDATE-only | Prevents data loss when `call.started` is not received |
| **P0** | Fix idempotency guard logging to distinguish "row not found" from "already processed" | Eliminates misleading log messages |
| **P0** | Backfill 66 missing post-V2 calls from VAPI API | Recovers lost transcripts, summaries, recordings |
| **P1** | Investigate VAPI `call.started` delivery -- check org-level server URL and event subscriptions in VAPI dashboard | Enables real-time webhook ingestion |
| **P1** | Register Elliott (`c303d993`) in `agents` table or add `organizationId` to VAPI metadata | Enables org resolution for Elliott's calls |
| **P1** | Stabilize PM2 process (fix IMAP auth failure, missing index.html) | Reduces missed webhook events |
| **P2** | Implement a scheduled VAPI sync job (poll API, reconcile against DB) | Resilience against webhook failures |
| **P2** | Add monitoring/alerting for webhook ingestion rate | Early detection of ingestion failures |

---

### Cost Analysis

| Period | VAPI API Calls | VAPI Cost | In Local DB? |
|--------|---------------|-----------|-------------|
| All time (2025-04 to 2026-02) | 832 | $134.81 | 16% (135/832) |
| Post-V2 (2026-02-02+) | 92 | $44.55 | 28% (26/92) |
| Missing post-V2 | 66 | ~$32 (est.) | NO |

---

### VAPI Call Type Distribution (All Time)

| Call Type | Count | Percentage |
|-----------|-------|------------|
| inboundPhoneCall | 372 | 45% |
| webCall | 354 | 43% |
| outboundPhoneCall | 106 | 13% |

---

### Evidence

- **VAPI API:** `GET /call?limit=100` with `createdAtLt` pagination (9 pages, 832 total)
- **VAPI Assistants:** `GET /assistant` (18 assistants)
- **VAPI Phone Numbers:** `GET /phone-number` (7 numbers)
- **Local DB:** Direct `psql` to Supabase (port 5432), queries on `vapi_call_logs`, `agents`, `organizations`
- **Cross-reference:** Python script comparing VAPI call IDs against `vapi_call_id` column
- **Log analysis:** PM2 rotated logs (`nexxus-v2-out*.log`, 8 files) for VAPI webhook event patterns
- **Webhook handler:** `server/webhooks/vapi.ts`
- **All operations were read-only. No data was modified.**
- **Audit date:** 2026-02-19

---

## Tavus Video Sessions

### Audit Summary

| Metric | Tavus API | Local DB (`tavus_sessions`) | Delta |
|--------|-----------|----------------------------|-------|
| Total conversations/sessions | 136 | 1 | **-135** |
| Conversations with V2 callback | 0 | N/A | N/A |
| Conversations post-MVP deploy (2026-02-02+) | 1 | 0 (real) | **-1** |

**Verdict:** The local database contains only 1 record, and it is **seed data** (inserted by migration `004_serra_seed_data.sql` with fake conversation ID `session_xyz789`). Zero real Tavus sessions have been captured by the V2 system.

---

### Tavus API Data (Full Inventory)

**Total Conversations:** 136 (all status: `ended`)
**Date Range:** 2025-08-03 to 2026-02-16

#### Monthly Distribution

| Month | Count |
|-------|-------|
| 2025-08 | 25 |
| 2025-09 | 21 |
| 2025-10 | 2 |
| 2025-11 | 52 |
| 2025-12 | 5 |
| 2026-01 | 30 |
| 2026-02 | 1 |

#### Persona Distribution

| Persona ID | Name | Conversations | Notes |
|------------|------|---------------|-------|
| `pc9acbf2c94f` | Daria | 51 | Personal AI companion (non-dealership) |
| `p92b0da01c4f` | Elizabeth | 34 | Hyundai of Columbia sales assistant |
| `p9eb007721f4` | Caroline | 23 | Serra Honda sales assistant |
| `pdd979296e57` | Sarah | 23 | Nexxus CareConnect demo avatar (senior living) |
| `pe791670615d` | Georgia | 2 | Dealership persona |
| `p2f586f7e4e0` | Magnolia | 1 | Dealership persona |
| `pf233f09f33d` | Savannah | 1 | Dealership persona |
| `p5d11710002a` | Healthcare Intake Assistant | 1 | Non-dealership (healthcare) |

**Total Personas on Account:** 10 (including 3 not used in any conversation: Savannah duplicate `p45c6f2a4999`, Magnolia duplicate `p806a583d275`, Georgia duplicate `p21000576413`, Interviewer `pdac61133ac5`)

#### Callback URL Categorization

| Callback Pattern | Count | Interpretation |
|-----------------|-------|----------------|
| `(empty)` | 79 | Direct Tavus dashboard usage, no webhook configured |
| `undefined/api/tavus/callback` | 47 | App integration attempted but `PUBLIC_API_URL` was undefined |
| `https://nexxus.huminicdev.com/api/tavus/webhook` | 5 | V1 production webhook |
| `https://nexxusdev.huminicdev.com/api/tavus/webhook` | 5 | Dev environment webhook |
| `https://nexxusv2.huminicdev.com/api/webhooks/tavus` | **0** | V2 production webhook |

---

### Local Database Data

**Total Records:** 1

| Field | Value |
|-------|-------|
| `id` | `5e71f607-4841-43ca-a342-80fe781f995c` |
| `tavus_conversation_id` | `session_xyz789` |
| `tavus_persona_id` | `(null)` |
| `tavus_replica_id` | `replica_sales_rep` |
| `status` | `completed` |
| `started_at` | 2026-01-30 07:18:25 UTC |
| `ended_at` | 2026-01-30 07:22:25 UTC |
| `duration_seconds` | 240 |
| `organization_id` | `3795b8f6-aca7-45fc-b77e-fc671b85a9f3` (Serra Honda of Sylacauga) |
| `has_transcript` | true |
| `has_summary` | false |
| `has_replay_url` | true |
| `engagement_score` | (null) |
| `outcome` | (null) |
| `lead_extracted` | false |
| `agent_id` | (null) |
| `conversation_id` | (null) |
| `origin` | **Seed data** (migration `004_serra_seed_data.sql`) |

---

### Agent-to-Persona Mapping (V2 Database)

**Video agents with Tavus persona IDs configured:** 0

The `agents` table has zero rows where `type = 'video'` or where `config->>'tavus_persona_id'` / `config->>'tavusPersonaId'` is set. This means the V2 webhook handler's `resolveOrganizationId()` function, which looks up `agents.config->>'tavus_persona_id'` to map incoming Tavus conversations to organizations, would fail to resolve any real Tavus conversation.

---

### Root Cause Analysis

The data gap (136 API conversations vs 0 real DB records) is explained by the following chain of issues:

1. **No V2 callback URL configured on any Tavus conversation.** Zero of the 136 Tavus conversations have a callback URL pointing to `nexxusv2.huminicdev.com`. The V2 webhook endpoint (`/api/webhooks/tavus`) has never been called by Tavus.

2. **47 conversations had `undefined/api/tavus/callback`.** These were created by application code that attempted to set a callback URL but the `PUBLIC_API_URL` environment variable was not configured at the time (resolving to the string `"undefined"`). These webhooks were silently lost.

3. **5 conversations pointed to V1 (`nexxus.huminicdev.com`).** These would have been processed by V1, not V2.

4. **5 conversations pointed to dev (`nexxusdev.huminicdev.com`).** These were development/testing sessions.

5. **79 conversations had no callback URL.** These were started directly from the Tavus dashboard or via API without a webhook callback configured.

6. **No video agents registered in V2 DB.** Even if Tavus webhooks reached V2, `resolveOrganizationId()` would fail because no agents have `tavus_persona_id` in their config. The webhook would return 200 with `"Organization not resolved"` and discard the event.

7. **Only 1 conversation occurred after V2 MVP deploy (2026-02-02).** Conversation `c77cbb640fcce412` (Daria, 2026-02-16) still had the `undefined/api/tavus/callback` pattern, confirming the callback URL issue persists.

---

### Recommendations

| Priority | Action | Impact |
|----------|--------|--------|
| **P0** | Register video agents in V2 `agents` table with correct `tavus_persona_id` in config | Enables webhook org resolution |
| **P0** | Update Tavus persona webhook URLs to `https://nexxusv2.huminicdev.com/api/webhooks/tavus` | Enables webhook delivery to V2 |
| **P1** | Fix `PUBLIC_API_URL` usage in conversation creation code to prevent `undefined` callback URLs | Prevents silent webhook loss |
| **P2** | Consider backfilling historical Tavus sessions via API import (136 conversations with metadata) | Provides historical data for analytics |
| **P2** | Audit and clean up unused/duplicate Tavus personas (4 unused personas on account) | Reduces configuration confusion |

---

### Evidence

- **Tavus API endpoint:** `GET https://tavusapi.com/v2/conversations` (paginated, 136 total)
- **Tavus personas endpoint:** `GET https://tavusapi.com/v2/personas` (10 personas)
- **DB query:** `SELECT * FROM tavus_sessions` (1 seed record)
- **DB query:** `SELECT * FROM agents WHERE type='video'` (0 rows)
- **Seed data source:** `database/migrations/004_serra_seed_data.sql` line 377
- **Webhook handler:** `server/webhooks/tavus.ts`
- **Audit date:** 2026-02-19

---

## VIN Solutions Leads

### Audit Summary

**Audit Date:** 2026-02-19
**Method:** Direct VIN Solutions API queries via OAuth2 token compared against local `leads` table (excluding `excel_upload` source records).
**Token Endpoint:** `https://authentication.vinsolutions.com/connect/token` (scope: `PublicAPI`)
**API Base:** `https://api.vinsolutions.com`
**Headers:** `Accept: application/vnd.coxauto.v3+json`, `api_key` header required

#### Integration Configuration

| Organization | Org ID | Dealer ID | Integration ID | VIN User ID | Status | Last Sync |
|---|---|---|---|---|---|---|
| Serra Honda of Sylacauga | `3795b8f6-...` | 21043 | `125ffd5b-...` | 1148936 | active | 2026-02-19 04:11:58 UTC |
| Serra Nissan of Sylacauga | `7f868569-...` | 21044 | `f3f7e600-...` | 1148936 | active | 2026-02-19 04:11:54 UTC |
| Tony Serra Ford | `8751c73d-...` | 21047 | `6b430786-...` | 1148936 | active | 2026-02-19 02:46:15 UTC |

---

### Total Lead Count Comparison

| Organization | VIN API Total | Local DB Total | Delta | Coverage |
|---|---|---|---|---|
| Serra Honda of Sylacauga (21043) | 143,147 | 324 | -142,823 | 0.23% |
| Serra Nissan of Sylacauga (21044) | 76,082 | 233 | -75,849 | 0.31% |
| Tony Serra Ford (21047) | 74,630 | 218 | -74,412 | 0.29% |
| **Totals** | **293,859** | **775** | **-293,084** | **0.26%** |

**Verdict:** The large delta is **expected and by design**. The VIN API total includes ALL historical leads (spanning years of CRM history, including SOLD and LOST statuses). The local database only imports leads from the polling job, which looks back 48 hours on each run and runs every 60 minutes. The local DB reflects approximately the last 30 days of imported leads since the polling job was activated.

---

### VIN API Status Distribution (All Time)

| Status Type | Serra Honda (21043) | Serra Nissan (21044) | Tony Serra Ford (21047) |
|---|---|---|---|
| ACTIVE | 662 | 448 | 413 |
| SOLD | 17,620 | 7,876 | 4,100 |
| LOST | 113,445 | 59,696 | 62,860 |
| **Total** | **131,727** | **68,020** | **67,373** |

**Note:** ACTIVE + SOLD + LOST sums are less than the total count for each dealer. The remaining leads have other status types (e.g., NONE) not queried individually.

#### ACTIVE Lead Breakdown (VIN API)

| Lead Status | Serra Honda (21043) | Serra Nissan (21044) | Tony Serra Ford (21047) |
|---|---|---|---|
| ACTIVE_NEW_LEAD | 6 | 7 | 22 |
| ACTIVE_ACTIVE_LEAD | 391 | 287 | 213 |
| Other ACTIVE statuses | 265 | 154 | 178 |

---

### Local DB Status Distribution

| Organization | new | contacted | qualified | appointment_set | Total |
|---|---|---|---|---|---|
| Serra Honda of Sylacauga | 274 | 2 | 2 | 46 | 324 |
| Serra Nissan of Sylacauga | 211 | 0 | 0 | 22 | 233 |
| Tony Serra Ford | 173 | 0 | 0 | 45 | 218 |

---

### Local DB Source Distribution

| Organization | vin_import | voice | video | vin | vapi_voice | Total |
|---|---|---|---|---|---|---|
| Serra Honda of Sylacauga | 320 | 1 | 1 | 1 | 1 | 324 |
| Serra Nissan of Sylacauga | 233 | 0 | 0 | 0 | 0 | 233 |
| Tony Serra Ford | 218 | 0 | 0 | 0 | 0 | 218 |

**Note:** 4 Serra Honda leads without `vin_customer_id` are non-VIN leads (voice/video/vapi_voice/vin sources -- test data or manually created).

---

### Recency Comparison (Last 7 / 30 Days)

| Organization | VIN API (7d) | Local DB (7d) | Delta (7d) | VIN API (30d) | Local DB (30d) | Delta (30d) |
|---|---|---|---|---|---|---|
| Serra Honda (21043) | 176 | 142 | -34 | 667 | 324 | -343 |
| Serra Nissan (21044) | 109 | 79 | -30 | 400 | 233 | -167 |
| Tony Serra Ford (21047) | 110 | 80 | -30 | 396 | 218 | -178 |

**Analysis:**
- **Last 7 days:** Local DB captures approximately 72-81% of VIN leads from the same period. The 19-28% gap is likely due to:
  - The polling job uses `startQueryDateTime` based on a 48-hour lookback, which may miss leads created and quickly moved to SOLD/LOST within the window
  - Leads created by the VIN API during the gap between polling cycles (60-minute intervals)
  - Some leads may have `createdUtc` dates that fall outside the polling window due to VIN API timestamp handling
- **Last 30 days:** Local DB captures approximately 49-58% of VIN leads. The larger gap for 30-day data is because the polling job was activated after some of these leads were created.

---

### VIN API Active Leads in Last 30 Days

| Organization | ACTIVE (30d VIN API) | Local DB (30d) | Coverage of Active |
|---|---|---|---|
| Serra Honda (21043) | 327 | 324 | 99.1% |
| Serra Nissan (21044) | 209 | 233 | 111.5% (over-count) |
| Tony Serra Ford (21047) | 191 | 218 | 114.1% (over-count) |

**Analysis:** When comparing ACTIVE leads from the last 30 days in VIN to local DB totals, coverage is near 100% or slightly over. The over-count for Nissan and Ford is because the local DB includes leads that were ACTIVE when imported but have since been moved to SOLD/LOST in VIN (VIN status is point-in-time; local status does not back-sync from VIN).

---

### Spot-Check: Individual Lead Accuracy

| VIN Lead ID | VIN API Status | Local Status | Local Name | Match? |
|---|---|---|---|---|
| 1970864693 | ACTIVE_NEW_LEAD | new | Kaci Wingo | YES -- status correctly mapped |
| 1970857605 | ACTIVE_NEW_LEAD | new | David Gable | YES -- status correctly mapped |
| 1970577865 | ACTIVE_NEW_LEAD | new | Richie Busby | YES -- status correctly mapped |
| 1970819718 | SERVICE_APPOINTMENT_SCHEDULED | appointment_set | Georgina Gunning | YES -- status correctly mapped |

**Contact enrichment verified:** Names, emails, and phone numbers are populated via the gateway contact resolution endpoint. 10/10 sampled leads had complete name data. Contact resolution uses `gateway/v1/contact/{contactId}?dealerId=X&userId=Y` with `application/json` headers.

---

### Data Integrity Checks

| Check | Result |
|---|---|
| Duplicate `vin_customer_id` values | **0 duplicates** -- deduplication working correctly |
| Leads missing `vin_customer_id` (non-excel) | **4 total** -- all Serra Honda, all non-VIN sources (voice/video/vapi_voice/vin) |
| Contact enrichment (names populated) | **771/771 vin_import leads have names** (100% enrichment rate) |
| Status mapping accuracy | **4/4 spot-checked leads mapped correctly** |
| VIN API call logging | Working -- `vin_api_calls` table shows 13,335 search_leads calls in last 24h |

---

### Polling Job Configuration

| Parameter | Value |
|---|---|
| Poll interval | 60 minutes |
| Lookback window | 48 hours |
| Max pages per poll | 10 (cap at 1,000 leads) |
| Page size | 100 |
| Startup delay | 30 seconds |
| Retry on transient errors | 2 retries with exponential backoff |
| Status filter | None (imports all statuses) |
| Contact enrichment concurrency | 5 parallel requests |

---

### Root Cause Analysis: Why Local < VIN API

The significant delta between VIN API totals (293,859) and local DB (775) is fully explained by the following:

1. **Design intent:** The polling job is not a full historical sync. It imports only leads created within the last 48 hours. VIN API totals include years of CRM history (LOST: 235,000+, SOLD: 29,596).

2. **Polling activation date:** Local leads date back to 2026-01-29 (Serra Honda) and 2026-02-07 (Nissan/Ford), indicating the polling job was activated in late January/early February 2026.

3. **No historical backfill:** There is no batch import job for historical VIN leads. Only the rolling 48-hour polling window captures new leads.

4. **7-day gap (19-28% missing):** Some leads visible in the VIN API's 7-day window are not in the local DB. Possible causes:
   - Leads created and immediately changed status before the next poll cycle
   - VIN API `createdUtc` vs polling job `dateFrom` timezone edge cases
   - The 48-hour lookback window combined with 60-minute polling should catch most leads, but rapid-fire lead creation could exceed the 1,000-lead page cap

---

### Recommendations

| Priority | Action | Impact |
|---|---|---|
| **P2** | Consider adding a `leadStatusType=ACTIVE` filter to the polling job to focus on actionable leads | Reduces API calls and noise from historical SOLD/LOST leads |
| **P2** | Investigate the 19-28% gap in 7-day lead capture -- add metrics/logging to measure capture rate | Ensures no actionable leads are missed |
| **P3** | Consider periodic full sync of ACTIVE leads (not just 48h window) to catch status changes in VIN | Keeps local status in sync with VIN reality |
| **P3** | Add a dashboard widget showing VIN sync health (last sync time, leads captured vs VIN count) | Operational visibility for admins |

---

### Evidence

- **OAuth token:** Successfully acquired via `POST https://authentication.vinsolutions.com/connect/token` (grant_type=client_credentials, scope=PublicAPI)
- **VIN API endpoints queried:**
  - `GET /leads?dealerId={X}&limit=1` -- total count (all 3 dealers)
  - `GET /leads?dealerId={X}&leadStatusType={STATUS}&limit=1` -- status distribution
  - `GET /leads?dealerId={X}&startQueryDateTime={DATE}&limit=1` -- recency counts
  - `GET /leads/id/{leadId}` -- individual lead spot-checks
- **DB queries:** `leads` table with joins to `organizations`, grouped by status/source/recency
- **Service files reviewed:**
  - `server/services/vinSolutionsService.ts` -- OAuth flow, API client, contact resolution
  - `server/services/vinOAuthService.ts` -- Token refresh service
  - `server/jobs/vinLeadPollingJob.ts` -- Polling job configuration and import logic
- **Audit date:** 2026-02-19

---

## Dashboard Metrics & Agent Triggers

### Audit Summary

**Audit Date:** 2026-02-19
**Method:** Direct DB queries against production Supabase, cross-referenced with DashboardService code.

### Lead Totals

| Metric | Count |
|--------|-------|
| Total leads (all sources) | 5,586 |
| Total leads (excl `excel_upload`) | 775 |
| `excel_upload` records excluded | 4,811 |

The `excel_upload` exclusion filter removes 86% of lead records. DashboardService correctly applies `source != 'excel_upload'` in every query.

### Dashboard Card Metrics

| Card | Count | Definition |
|------|-------|------------|
| Overdue | 263 | new, >48h, <30d, unassigned, untouched |
| New | 223 | status=new, last 7 days |
| Active | 4 | contacted/qualified/negotiation |
| Recent | 301 | any status, last 7 days |

### Agent Activity (last 7 days)

| Component | Count |
|-----------|-------|
| VAPI Calls | 22 |
| Appointments | 1 |
| Inbox Conversations | 21 |
| AI Usage Events | 1,606 |

---

### Trigger System Audit

#### Trigger Rules Summary

| Status | Count |
|--------|-------|
| Active | 8 |
| Inactive | 16 |
| Archived | 102 (all E2E test artifacts) |

#### Active Production Trigger Rules (8)

**Outbound Call Triggers (5 rules, one per org):**
- Event: `new_lead`, Action: `outbound_call`
- Conditions: `lead_age_minutes >= 5` AND `no_prior_contact = true`

**SMS Fallback Triggers (3 rules, Serra + Tony only):**
- Event: `new_lead`, Action: `send_sms`
- Conditions: `lead_age_minutes >= 15` AND `no_prior_contact = true` AND `no_answered_call = true`
- Ford/Hyundai of Columbia: **Missing SMS fallback rules**

#### Trigger Execution History

| Metric | Value |
|--------|-------|
| Total executions | 84 |
| Status: completed | **0** |
| Status: skipped | 39 |
| Status: failed | 45 |
| All from E2E tests | YES |

**CRITICAL: Zero production triggers have ever fired.** All 84 executions are E2E test artifacts.

#### Root Cause

The VIN poller imports leads with `triggerService.evaluateEvent()`, but the condition `lead_age_minutes >= 5` is evaluated at import time when the lead is 0 minutes old. The trigger system needs a delayed re-evaluation mechanism.

### Integration Status

| Organization | VIN Active | Call Trigger | SMS Trigger |
|-------------|-----------|-------------|-------------|
| Serra Honda | YES | YES | YES |
| Serra Nissan | YES | YES | YES |
| Tony Serra Ford | YES | YES | YES |
| Ford of Columbia | **NO** | YES (dead) | **NO** |
| Hyundai of Columbia | **NO** | YES (dead) | **NO** |

---

## Consolidated Gap Analysis

### P0 — Must Fix

| # | Gap | AC Impact | Root Cause |
|---|-----|-----------|------------|
| G-1 | VAPI webhook ingestion broken — 66 post-V2 calls lost | AC-1, AC-4 | `handleEndOfCallReport` UPDATE-only; `call.started` never received |
| G-2 | Zero production trigger executions | AC-1 | `lead_age_minutes >= 5` never met at import time (lead is 0 min old) |
| G-3 | Tavus: 0 real sessions captured | AC-4, AC-5 | No V2 callback URLs; no video agents in DB |
| G-4 | PM2 crash-looping (3,247 restarts) | ALL | IMAP auth failure, missing dist/public/index.html |

### P1 — Important

| # | Gap | AC Impact | Root Cause |
|---|-----|-----------|------------|
| G-5 | Ford/Hyundai triggers with no VIN integration | AC-1 | No VIN Solutions config for these orgs |
| G-6 | SMS: 0 successful sends | AC-1 | Configured but untested |
| G-7 | 19-28% gap in 7-day VIN lead capture | AC-4 | Polling timing/pagination edge cases |
| G-8 | Unregistered VAPI assistants (38 calls) | AC-4 | Elliott, Andor, Gabrielle not in agents table |
| G-9 | No credits/notifications on VAPI records | AC-4 | Bulk-imported before notification logic existed |

### P2 — Nice to Have

| # | Gap | AC Impact | Root Cause |
|---|-----|-----------|------------|
| G-10 | 85% of leads stuck in `new` status | AC-4 | VIN import doesn't update status on subsequent syncs |
| G-11 | 102 archived E2E test trigger rules | Cleanup | E2E test artifact accumulation |
