# Pre-Execution Report: S-0 — Foundation

**Sprint:** S-0
**Type:** Database corrections + backend fixes
**Date:** 2026-03-24
**Status:** READY

## Objective

Fix all database state, create/rename agents, rewrite VIN lead insert to use port 4003 REST API, refresh warehouse data, rebuild compiled output. No UI changes. This sprint unblocks all subsequent page sprints.

## Declared Files

- server/seed.ts — agent renames, new agent creation, instruction seeding
- server/routes/webhooks.ts — VIN lead insert rewrite (port 4002 to 4003)
- shared/schema.ts — sms_campaign_number column

scope_override: owner approved 6-file scope for foundation sprint (S-0 touches DB, backend, and schema)

## UI Changes

NONE — no UI changes in this sprint.

## Success Criteria

- duane.wells on Huminic org
- All 5 orgs have all 5 CommGate flags true
- Nancy Gaston exists for service dept in all 5 stores
- Data Guru exists for sales dept in all 5 stores
- 7 new chat agent types created per store (35+ records)
- Agent instructions seeded from agent-instructions.json
- VIN lead insert uses port 4003 REST API (both VAPI and Tavus blocks)
- Warehouse leads and metrics populated for all 5 stores
- Build compiles clean
- sms_campaign_number column exists in integrations table

## Component Execution Order

1. S-0.0: Fix duane.wells org assignment
2. S-0.1: Enable CommGate for all orgs (5 flags each)
3. S-0.2: Rename agents across all stores
4. S-0.3: Create 35 new chat agents
5. S-0.3b: Seed instructions from agent-instructions.json
6. S-0.4: Rewrite VIN lead insert (both VAPI and Tavus blocks)
7. S-0.5: Trigger warehouse refresh
8. S-0.6: npm run build
9. S-0.7: Per-org SMS campaign number
