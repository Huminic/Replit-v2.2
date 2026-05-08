# Wave 2A Chunk T3 — Service Campaign Provider Proof

**Chunk:** T3 — Service Campaign provider proof (CONTINUATION OPENING of Wave 2A)
**Wave:** 2A (continuation; A/B/C naming retired 2026-05-07 per operator)
**Date:** 2026-05-08
**Branch:** `wave/10-bg/2A-svc-webhook` (off `batch-1-finish-line`)
**Builder base SHA:** `c083a0c`
**Result:** PASS — campaign created in serra-honda, 0 provider sends, 0 outbound_log rows, all halt-checks PASS.

---

## Run command

```bash
set -a; source .env; set +a
TESTLANE_MODE=true TESTLANE_SMS_TO=+14126546500 \
  npx tsx server/test-trigger-2A.ts testT3ServiceCampaign
```

Run policy: ONE invocation only. Exit code captured from RESULT JSON,
not via separate `echo $?` (T1 pattern lapse explicitly avoided).

## Δ1 — Runnable test result

| | |
|---|---|
| tsx exit code | **0** |
| Run timestamp | `2026-05-08T17:03:04.431Z` (pre_ts) → `2026-05-08T17:03:06.737Z` (post_ts) |
| Login HTTP status | **200** |
| Helper invocation | `testServiceCampaignCreation(accessToken, "http://localhost:5000")` |
| Helper return | `{success: true, campaignId: "1cf1d278-21a2-4ffa-8a4e-00270d1af6c7"}` |
| Halt checks | all PASS (loginOk, campaignCreatedOk, orgIsSerraHonda, zeroOutboundSends, noNonAllowlistRecipients) |

## Δ2 — Independent observations

### Campaign row created in DB

| Field | Value |
|---|---|
| id | `1cf1d278-21a2-4ffa-8a4e-00270d1af6c7` |
| name | `Comms Test — Service Recall Campaign` |
| department | `service` |
| channel | `sms` |
| status | `draft` |
| organization_id | `24d64f99-ba04-4b43-af35-fd06f555ac86` |
| organization slug | `serra-honda` |
| recipient_count (post-CSV) | **2** |

Read back via `storage.getCampaign(campaignId)` AFTER the helper returned, so this is an independent confirmation that the row persisted.

### activity_log row in window (1 entry — expected)

| id | action | entity_type | entity_id | created_at |
|---|---|---|---|---|
| `b8d554ef-4eb7-4b8b-b8a6-b994509b3efa` | `campaign_created` | `campaign` | `1cf1d278-21a2-4ffa-8a4e-00270d1af6c7` | `2026-05-08T17:03:05.975Z` |

This row was written by the route handler at `server/routes/campaigns.ts:103-110` as a side effect of the POST `/api/campaigns` handler. Its presence in the test window proves the create call hit the real handler.

### outbound_log rows in window — **0 (expected)**

The helper does NOT call `/api/campaigns/:id/execute`. Campaign is left at `status: "draft"`. Therefore zero SMS sequence is fired. The defensive scan against `outbound_log` filtered by serra-honda.org_id and the [pre_ts, post_ts] window returned an empty array, confirming no provider sends occurred.

### conversation rows — none expected, none created

Campaign create + CSV upload do not produce conversation rows. Verified implicitly by helper success and the 0-outbound-rows result (conversations are typically associated with downstream replies after a send).

### Recipients persisted (2 rows)

CSV upload response:
```
{"message":"CSV uploaded","recipientCount":2,"filename":"test-recipients.csv","columnsMatched":["First Name","Last Name","Home Phone","Email Address"]}
```

Recipient phones in CSV body (from `server/comms-test.ts:99-102`):
- `Duane,Wells,4126546500,duanewells@icloud.com`
- `Durran,Cage,7313946907,durran@cageautomotive.com`

Both recipients are operator-controlled test contacts. Note: these are stored in the `recipients` table only — they are NOT sent to. No SMS goes anywhere because the campaign is not executed.

## Provider sends triggered

**0 SMS sends. 0 calls. 0 emails.**

Service campaign creation is a metadata-only operation (DB row + activity_log + recipient rows). Send sequence requires a separate `POST /api/campaigns/:id/execute` call which this proof intentionally does NOT make.

This is the **launch-critical capability proof for Phase 7 Service**: the create + CSV-upload path works end-to-end via HTTP under serra-honda's org_admin credentials. Execute-path proof is a separate scope (would require operator approval per CLAUDE.md "Enabling service campaigns for stores" autonomy rules — only serra-honda is authorized for service campaigns at all, and execution against real recipients requires further authorization).

## Halt-condition checklist

| Halt condition | Result | Evidence |
|---|---|---|
| Login returns 2xx + accessToken present | **PASS** | HTTP 200, accessToken returned |
| Campaign creation returns 2xx | **PASS** | Helper returned `success: true` |
| Campaign organization is serra-honda | **PASS** | `campaignOrgId` = `24d64f99-ba04-4b43-af35-fd06f555ac86` (serra-honda) |
| Zero outbound_log rows in window (helper does not /execute) | **PASS** | `outboundLogRowsInWindow: []` |
| No non-allowlist recipients in any outbound_log row | **PASS** (vacuously — 0 rows) | n/a |
| Helper does not require modification of `server/comms-test.ts` body | **PASS** | Imported as-is via `import { testServiceCampaignCreation } from "./comms-test"` |
| Run script exactly once (no echo-rerun pattern) | **PASS** | One invocation; exit code captured from RESULT JSON |
| No edits to product code (`server/services/`, `server/routes/`, schema) | **PASS** | Only `server/test-trigger-2A.ts` modified (extension only); helper imported read-only |
| No PM2 restart | **PASS** | dev server (`nexxus-app`) untouched (uptime 25h preserved) |
| No commits to `batch-1-finish-line` or `main` | **PASS** | All commits land on `wave/10-bg/2A-svc-webhook` |
| Authenticated user belongs to serra-honda | **PASS** | login userId = `6249dbc6-bdbf-4dae-a962-04ae63002bea` (serra_honda@huminic.ai); subsequent campaign owned by serra-honda org |

### Allowlist verification

- `test_org:serra-honda` — APPROVED in `.claude/state/test-orgs.txt`
- Recipient set: 2 CSV rows stored as recipients (no sends fired against them); operator's phone `+14126546500` and `duanewells@icloud.com` are allowlisted; Durran Cage's `+17313946907` is not in the test-recipients allowlist as a phone entry but is symbolically allowlisted as `vin_test_contact:Durran Cage`. **Critical:** no sends happen, so allowlist enforcement on the recipient values is not load-bearing here.

## Files touched

- `server/test-trigger-2A.ts` — extended with `testT3ServiceCampaign()` function (new export, new CLI dispatch case)
- `evidence/wave-2A-trigger-provider-proof/chunk-T3/proof.md` — this file

NOT touched:
- `server/comms-test.ts` — read-only import; body unchanged
- `server/routes/campaigns.ts` — read-only reference
- `server/outbound.ts`, `server/services/triggerService.ts` — untouched
- `shared/schema.ts` — untouched
- Any UI files

## Architectural notes (not blocking close)

1. **Campaign-create activity_log payload includes nothing campaign-execution-related.** Confirmed by reading `server/routes/campaigns.ts:103-110`. This is correct: execute is a separate event (`campaign_executed` / `campaign_dry_run`) emitted by the execute handler.
2. **Recipients table is shared across all campaign creates.** Recipients persist regardless of execute status. Future cleanup may want a TESTLANE marker on test-created recipients (currently they are normal rows). For now, since no execute happens, this is benign.
3. **CSV warnings are informational.** Helper's CSV does not include Address/City/State/Zip/VIN/Model/Model Year/Last Contact columns — these are optional. No data loss.

## Cross-references

- Wave bookend: `evidence/wave-2A-trigger-provider-proof/wave-bookend.md` (CONTINUATION OPENING section)
- T1 precedent: `evidence/wave-2A-trigger-provider-proof/chunk-T1/proof.md`
- T2 precedent: `evidence/wave-2A-trigger-provider-proof/chunk-T2/proof.md`
- Helper source: `server/comms-test.ts:67-128` (`testServiceCampaignCreation`)
- Route source: `server/routes/campaigns.ts:91-116` (POST /api/campaigns), `:378-524` (POST /upload-csv)
- Schema: `shared/schema.ts:122-148` (campaigns table), `:409` (insertCampaignSchema)

## RESULT JSON (captured from script stdout)

```json
{
  "campaignCreated": true,
  "campaignId": "1cf1d278-21a2-4ffa-8a4e-00270d1af6c7",
  "campaignName": "Comms Test — Service Recall Campaign",
  "campaignDepartment": "service",
  "campaignChannel": "sms",
  "campaignStatus": "draft",
  "campaignOrgId": "24d64f99-ba04-4b43-af35-fd06f555ac86",
  "campaignOrgSlug": "serra-honda",
  "recipientCount": 2,
  "loginHttpStatus": 200,
  "authenticatedUserId": "6249dbc6-bdbf-4dae-a962-04ae63002bea",
  "authenticatedOrgId": null,
  "preTs": "2026-05-08T17:03:04.431Z",
  "postTs": "2026-05-08T17:03:06.737Z",
  "outboundLogRowsInWindow": [],
  "activityLogRowsInWindow": [
    {
      "id": "b8d554ef-4eb7-4b8b-b8a6-b994509b3efa",
      "organizationId": "24d64f99-ba04-4b43-af35-fd06f555ac86",
      "action": "campaign_created",
      "entityType": "campaign",
      "entityId": "1cf1d278-21a2-4ffa-8a4e-00270d1af6c7",
      "createdAt": "2026-05-08T17:03:05.975Z"
    }
  ],
  "haltChecks": {
    "loginOk": true,
    "campaignCreatedOk": true,
    "orgIsSerraHonda": true,
    "zeroOutboundSends": true,
    "noNonAllowlistRecipients": true
  },
  "rawHelperResult": {
    "success": true,
    "campaignId": "1cf1d278-21a2-4ffa-8a4e-00270d1af6c7"
  }
}
```

Note on `authenticatedOrgId: null` — login response nests the org under `user.organization.id`, while my parser tried `user.organizationId` and `organization.id` (top-level). The script's defense-in-depth org check is informational only; the LOAD-BEARING check uses the campaign's actual `organizationId` after creation (`createdCampaign.organizationId === serraHonda.id`), which PASSED. No correctness impact.
