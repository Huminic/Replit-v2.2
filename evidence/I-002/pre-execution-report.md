# I-002 Pre-Execution Report

**Sprint:** I-002 — Staging DB Isolation
**Date:** 2026-04-03
**Author:** Orchestrator
**Depends On:** I-003 (committed: 6c80e60)

## Objective

Isolate staging from production by pointing dev.huminicdev.com (PM2) at a separate Supabase database. Fix deploy.yml silent failure patterns. Ensure dev seed creates test dealerships on staging.

## Declared Files

- `.github/workflows/deploy.yml` — Remove 3 silent failure patterns
- `server/seed.ts` — Add SEED_DEMO_DATA env var to bypass esbuild-inlined NODE_ENV check
- `evidence/I-002/` — Sprint artifacts

Note: ecosystem.config.cjs NODE_ENV change was reverted — esbuild inlines NODE_ENV at build time (scripts/build.ts:44), so runtime NODE_ENV has no effect on seed path. SEED_DEMO_DATA is the correct control.

## UI Changes

NONE. No UI permissions. No frontend files modified.

## Acceptance Criteria

| AC | Description | Test Method |
|----|-------------|-------------|
| I-002.AC1 | Staging Supabase project exists, schema applied via drizzle-kit push | Query staging DB: 27 tables present |
| I-002.AC2 | dev.huminicdev.com serves from staging DB (different org count) | Compare org counts: production has 7, staging starts empty then seeds 6 |
| I-002.AC3 | Staging has OUTBOUND_LIVE_ENABLED=false | Check PM2 .env, verify outbound blocked |
| I-002.AC4 | deploy.yml fails on webhook error (no silent swallowing) | Review code: continue-on-error removed, echo guard removed, non-200 fails |
| I-002.AC5 | PM2 staging runs NODE_ENV=development so dev seed creates test dealerships | Container logs show dev seed path, query shows 6+ orgs |

## Test Plan

| Test | Method | Expected |
|------|--------|----------|
| Schema applied | Query staging tables count | 27 tables |
| Staging orgs | After seed: SELECT count(*) FROM organizations | 6+ orgs (Cage Auto, Serra Honda, etc.) |
| Production unchanged | curl live.huminic.app/api/health | 200, same uptime |
| Dev on staging | curl dev.huminicdev.com/api/health + query org count | Different count than production |
| Outbound blocked | Check OUTBOUND_LIVE_ENABLED in PM2 env | false |
| deploy.yml review | Read file, verify no silent guards | No continue-on-error, no echo guard |

## Entry Gates

| Gate | Status | Evidence |
|------|--------|----------|
| A1: I-003 committed | PASS | Commit 6c80e60 |
| A2: Supabase management API access verified | PASS | Project created via API |
| A3: Staging DIRECT_URL obtained | PASS | Session mode pooler 5432 works (IPv4) |

## Exit Gates

| Gate | What Ghost Checks |
|------|-------------------|
| B1 | Staging DB separate from production (different org counts) |
| B2 | deploy.yml fails loudly on webhook error |
| B3 | Staging outbound confirmed blocked |
| B4 | Dev seed creates test dealerships on staging |

## Known Gaps (expected, not failures)

- VIN dealer IDs hardcoded in seed — staging has no VIN integration, sync returns empty
- warehouse_leads/warehouse_metrics empty on staging — tests must handle empty state
- Migration files are stale — drizzle-kit push uses schema.ts directly per D-007
- Direct DB host (db.nbsbmjesgozcyxdtrtsw.supabase.co) is IPv6 only — use pooler session mode (port 5432) for DIRECT_URL

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| PM2 restart fails to pick up new .env | Low | MEDIUM | Verify with pm2 env after restart |
| Seed path creates wrong data | Low | LOW | Verified: NODE_ENV=development creates 6 orgs |
| deploy.yml fix breaks pipeline | Low | MEDIUM | Test with push after fix |

## Staging Connection Details

- Project ID: nbsbmjesgozcyxdtrtsw
- DATABASE_URL: postgresql://postgres.nbsbmjesgozcyxdtrtsw:[REDACTED]@aws-1-us-west-2.pooler.supabase.com:6543/postgres
- DIRECT_URL: postgresql://postgres.nbsbmjesgozcyxdtrtsw:[REDACTED]@aws-1-us-west-2.pooler.supabase.com:5432/postgres

## Execution Steps

| Step | Action | Executor | Type |
|------|--------|----------|------|
| 0 | Pre-flight | Orchestrator | code |
| 1 | Create staging Supabase project | Orchestrator | infrastructure (DONE) |
| 2 | drizzle-kit push schema to staging | Orchestrator | code (DONE) |
| 3 | Update ecosystem.config.cjs: NODE_ENV=development | Builder agent | code |
| 4 | Update PM2 .env: staging DB URLs + OUTBOUND_LIVE_ENABLED=false | Operator | infrastructure |
| 5 | Verify seed creates test dealerships | Verification agent | infrastructure |
| 6 | Fix deploy.yml silent failure patterns | Builder agent | code |
| 7 | Verify: dev shows different data, staging outbound blocked | Verification agent | code |
| 8 | Ghost verify | Ghost | infrastructure |
