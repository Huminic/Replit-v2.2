# Pre-Execution Report: S-0 — Foundation

**Sprint:** S-0
**Type:** Database corrections + backend fixes
**Date:** 2026-03-24
**Status:** PARTIALLY IMPLEMENTED — code in e72511f, S-0.7 incomplete, tests not written

## Objective

Fix all database state, create/rename agents, rewrite VIN lead insert to use port 4003 REST API, refresh warehouse data, rebuild compiled output, implement per-org SMS campaign number. No UI changes. This sprint unblocks all subsequent page sprints.

## Declared Files

- `server/seed.ts` — agent renames, new agent creation, instruction seeding (DONE in e72511f)
- `server/routes/webhooks.ts` — VIN lead insert rewrite port 4002 to 4003 (DONE in e72511f)
- `shared/schema.ts` — sms_campaign_number column (DONE in e72511f)
- `server/outbound.ts` — add fromNumber param to sendSms() (S-0.7 — NOT YET DONE)
- `server/routes/campaigns.ts` — pass integration.smsCampaignNumber in campaign execution (S-0.7 — NOT YET DONE)
- `server/routes/sms.ts` — inbound SMS number routing for per-org numbers (S-0.7 — NOT YET DONE)

scope_override: owner approved 6-file scope for foundation sprint

## UI Changes

NONE — no UI changes in this sprint.

## Acceptance Criteria (from sprints.json)

| ID | Criterion | Component | Evidence Type |
|----|-----------|-----------|---------------|
| S-0.AC0 | duane.wells@huminic.ai organization_id = Huminic | S-0.0 | Query output |
| S-0.AC1 | All 5 orgs have ALL 5 CommGate flags true | S-0.1 | Query output |
| S-0.AC2 | All 5 orgs have email_enabled=true | S-0.1 | Query output |
| S-0.AC3 | Agent "Nancy Gaston" exists for service dept in all stores with vapiAssistantId | S-0.2 | API response |
| S-0.AC4 | Agent "Data Guru" exists for sales dept in all stores | S-0.2 | API response |
| S-0.AC5 | No agent named "Carol", "Service Agent", or "CRM Guru" exists | S-0.2 | Query output |
| S-0.AC6 | "Sales Coach" agent exists in all 5 stores | S-0.3 | API response |
| S-0.AC7 | "Communication Writer" agent exists in all 5 stores | S-0.3 | API response |
| S-0.AC8 | 5 marketing agents exist in all 5 stores | S-0.3 | API response |
| S-0.AC9 | seed.ts matches database agent records (no drift) | S-0.2/S-0.3 | Diff output |
| S-0.AC9b | All 7 new agent types have non-empty instructions (length > 100 chars) | S-0.3b | Query output |
| S-0.AC10 | VIN lead creation succeeds via vin-safe-mcp (port 4003) for at least 2 stores | S-0.4 | Code review proof (IRREVERSIBLE — no live trigger without owner approval) |
| S-0.AC11 | warehouse_metrics has non-zero rows for all 5 orgs | S-0.5 | Query output |
| S-0.AC12 | warehouse_leads has rows with valid dates for all 5 orgs | S-0.5 | Query output |
| S-0.AC13 | npm run build completes without errors | S-0.6 | Terminal output |
| S-0.AC14 | Sync job runs without date parsing errors | S-0.6 | Log output |
| S-0.AC15 | Agent instructions in DB match agent-instructions.json after template replacement | S-0.3b | Diff output |
| S-0.AC16 | integrations table has sms_campaign_number column | S-0.7 | Query output |
| S-0.AC17 | If owner provides TextMagic number: integrations.sms_campaign_number set. If not: NULL acceptable. | S-0.7 | Query output |
| S-0.AC18 | Campaign SMS uses org sms_campaign_number as FROM when set, falls back to TextMagic default when NULL | S-0.7 | Code review + log proof |

## Test Plan

### New test file to write:
- `tests/e2e/s0-foundation.spec.ts`

### Test sections in s0-foundation.spec.ts:

1. **CommGate flags** — query organizations table, assert all 5 orgs have outbound_enabled, sms_enabled, phone_enabled, email_enabled, video_enabled = true
2. **User org assignment** — query users, assert duane.wells org = Huminic
3. **Agent renames** — GET /api/agents per org, assert Nancy Gaston exists in service, Data Guru in sales. Assert zero results for "Carol", "Service Agent", "CRM Guru"
4. **New agents** — GET /api/agents per org, assert Sales Coach, Communication Writer exist in sales. Assert Photo Studio, Video Producer, Copywriter, Market Intel, Creative Director exist in marketing. Count = 10 per store.
5. **Agent instructions** — query agents WHERE instructions IS NOT NULL, assert length > 100 for all 7 new types. Load agent-instructions.json, replace {{dealershipName}}, diff against DB values.
6. **VIN webhook code path** — grep webhooks.ts for "0.0.0.0:4003" and "/api/tool/vin_safe_prepare_lead". Assert port 4002/callMCP("vin_create_contact") does NOT appear in the VAPI end-of-call-report block. (Code review — no live trigger.)
7. **Warehouse data** — query warehouse_metrics GROUP BY org_id, assert 5 orgs with count > 0. Query warehouse_leads WHERE vin_created_at IS NOT NULL, assert rows exist for all 5 orgs.
8. **Build** — run npm run build, assert exit code 0
9. **sms_campaign_number column** — query information_schema.columns, assert column exists in integrations
10. **sms_campaign_number usage** — grep outbound.ts for smsCampaignNumber or sms_campaign_number. Grep campaigns.ts for same. Assert both files reference the column. (Code review proof that the feature is wired up.)

### Existing test files to run:
- `tests/e2e/domain-12-infrastructure.spec.ts` — health check, build verification

### Cross-tests:
- None for S-0 (foundation sprint, no cross-sprint dependencies yet)

### Exact commands:
```
npx playwright test tests/e2e/s0-foundation.spec.ts --reporter=list
npx playwright test tests/e2e/domain-12-infrastructure.spec.ts --reporter=list
```

## Remaining Work

### Already done (in e72511f):
- S-0.0 through S-0.6 code changes

### Still needed:
1. **S-0.7 code** — dispatch builder agent to modify outbound.ts, campaigns.ts, sms.ts
2. **s0-foundation.spec.ts** — write and run
3. **AC9 diff** — seed.ts vs DB comparison
4. **AC15 diff** — agent-instructions.json vs DB comparison
5. **Rebuild** after S-0.7 code changes

## Ghost Directive Acknowledgment

**GHOST-2026-03-24-BLOCK-001:** S-0 and S-1 were committed without running test files, without proper post-sprint evidence, and without owner review. The post-sprint reports claimed "COMPLETE" based on manual API checks instead of running the declared test files. This violated the sprint completion protocol.

**How it's being addressed:**
1. Both sprints reset to `planned` in sprints.json
2. This pre-exec includes a complete `## Test Plan` with exact test sections and npx commands
3. `s0-foundation.spec.ts` will be written and run — actual test output will be in the post-sprint report
4. S-0.7 code (sms_campaign_number in outbound/campaigns/sms) will be completed — it was falsely claimed as done
5. No commit until all tests pass, post-sprint has real output, and owner reviews
6. Ghost exit gate must write `EXIT GATE: CLEARED` before moving to S-1

## Ghost Entry Gate
**Reviewed by:** ghost-agent
**Timestamp:** 2026-03-24T06:13:01Z
**Sprint:** S-0
**A1 Previous cleared:** SKIP (first sprint)
**A2 Worktree:** clean (no application files dirty)
**A3 Session state:** PASS (references S-0 restarted)
**A4 Pre-exec exists:** PASS
**A5 Objective:** PASS
**A6 Test Plan:** PASS (s0-foundation.spec.ts + domain-12-infrastructure.spec.ts, 2 npx commands)
**A7 Declared Files:** PASS (6 files matching sprints.json)
**A8 Match check:** MATCH (6 files, 9 components, 20 ACs, testFiles match)
**A9 UI permissions:** PASS (NONE — no UI changes)
**A10 Ghost messages:** PASS (BLOCK-001 acknowledged in pre-exec)
**ENTRY GATE: APPROVED**
