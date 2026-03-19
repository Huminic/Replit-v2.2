# DB-1: Supabase Database Migration — Design Spec

**Date:** 2026-03-19
**Sprint:** DB-1
**Domain:** DT (Data) + IN (Infrastructure)
**Risk Level:** HIGH — real customer data in target database
**Spec Review:** v2 — all 10 review issues addressed

## Objective

Migrate the application database from Neon to an existing Supabase instance. The Supabase database currently holds 68 tables from an older codebase version at `/home/ubuntu/Live-Store/nexxus`. The Neon schema (28 tables defined in `shared/schema.ts`) is the master. All old Supabase tables are destroyed and replaced with our Drizzle schema. Nine real users are preserved and re-inserted with password resets.

## Approach: Clean Drop + Drizzle Push

1. Full backup of Supabase (`pg_dump --format=plain`)
2. Stop non-project PM2 processes
3. Drop all `public` schema objects (RLS policies, triggers, functions, tables)
4. Push our 28-table Drizzle schema via `drizzle-kit push` (using DIRECT_URL)
5. Verify 28 tables created
6. Run seed.ts to populate orgs, roles, hierarchy
7. Post-seed: set Cage Automotive's `partnerId` to Huminic org ID
8. Insert 9 real users with bcrypt-hashed (10 rounds) temporary passwords
9. Update `.env` — swap DATABASE_URL to Supabase, add DIRECT_URL
10. Update `drizzle.config.ts` to prefer DIRECT_URL
11. Restart `nexxus-app` against Supabase
12. Health check + login verification
13. Verify table count: `SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'`

### Why This Approach

- Neon schema is authoritative — no reconciliation needed
- 68 old tables have no overlap worth preserving (different architecture)
- Only user identity data is carried forward
- Standard pg tooling, no Supabase-specific SDK required

## Connection Architecture

### Current (Neon)
```
DATABASE_URL → Neon (neondb, port 5432, sslmode=require)
drizzle-orm/node-postgres with pg.Pool
drizzle.config.ts uses DATABASE_URL
```

### Target (Supabase)
```
DATABASE_URL → Supabase pooler (port 6543, ?pgbouncer=true)  — runtime queries
DIRECT_URL  → Supabase direct (port 5432, no pgbouncer)      — DDL/migrations
```

### pgbouncer Compatibility

Verified: Drizzle ORM 0.39.3 with `drizzle-orm/node-postgres` passes `name: undefined` for all regular queries (see `node-postgres/session.js` → `prepareQuery`). Named prepared statements are only created when users explicitly call `.prepare()`, which our codebase does not do. **No code change to `server/storage.ts` is needed.** pgbouncer in transaction mode works with unnamed prepared statements.

### PostgreSQL Version

Supabase runs PostgreSQL 17.6. `gen_random_uuid()` is a core function since PostgreSQL 13 — no extension needed.

### Supabase Auth/RLS

Our app uses its own JWT-based auth (`server/auth.ts`) and does not use Supabase Auth/GoTrue or RLS. The old database had RLS policies — these will be dropped along with all `public` schema objects. New tables created by `drizzle-kit push` will not have RLS enabled. No Supabase-specific auth features are used.

### Code Changes

**`drizzle.config.ts`** — Use `DIRECT_URL` when available for schema operations:
```typescript
// Before:
url: process.env.DATABASE_URL,

// After:
url: process.env.DIRECT_URL || process.env.DATABASE_URL,
```

**`.env`** — Swap connection strings:
```
DATABASE_URL=postgresql://postgres.lhltgisoqxgpamtssxeb:<password>@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.lhltgisoqxgpamtssxeb:<password>@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

## Data Migration

### Organizations (from seed.ts — Neon master)

seed.ts creates the hierarchy:
```
Cage Automotive (no partner — seed.ts does not set partnerId)
  ├─ Serra Honda (partner: Cage)
  ├─ Serra Nissan (partner: Cage)
  ├─ Tony Serra Ford (partner: Cage)
  ├─ Ford of Columbia (partner: Cage)
  └─ Hyundai of Columbia (partner: Cage)
Huminic (created in seedHuminicUsers(), no partner)
```

**Post-seed fix required:** In our Neon database, Cage Automotive has `partnerId` pointing to Huminic. But seed.ts does not set this. After seed runs, execute:
```sql
UPDATE organizations SET partner_id = (SELECT id FROM organizations WHERE slug = 'huminic')
WHERE slug = 'cage-automotive';
```

This produces the correct hierarchy:
```
Huminic (top-level)
  └─ Cage Automotive (partner: Huminic)
       ├─ Serra Honda (partner: Cage)
       ├─ Serra Nissan (partner: Cage)
       ├─ Tony Serra Ford (partner: Cage)
       ├─ Ford of Columbia (partner: Cage)
       └─ Hyundai of Columbia (partner: Cage)
```

### Roles (from seed.ts — 8 roles)
super_admin (1), partner_admin (2), org_admin (3), executive (3), sales_manager (3), sales (4), service (4), marketing (4)

### Users to Migrate (9 real users from Supabase)

| Email | Target Org | Target Role |
|-------|-----------|-------------|
| duane.wells@huminic.ai | Huminic | super_admin (1) |
| durran@cageautomotive.com | Cage Automotive | partner_admin (2) |
| admin@serrahonda.com | Serra Honda | org_admin (3) |
| victoria@misscommunicationconsulting.com | Serra Honda | org_admin (3) |
| admin@serranissan.com | Serra Nissan | org_admin (3) |
| admin@tonyserraford.com | Tony Serra Ford | org_admin (3) |
| admin@fordofcolumbia.com | Ford of Columbia | org_admin (3) |
| admin@hyundaiofcolumbia.com | Hyundai of Columbia | org_admin (3) |
| sam.mayfield@bc.auto | Hyundai of Columbia | org_admin (3) |

Notes:
- `durran@cageautomotive.com` is the correct email (seed.ts has `durran.cage@cageautomotive.com` — this user will be inserted directly, not from seed)
- `duane.wells@huminic.ai` already exists in seed — will be updated, not duplicated
- All users get bcrypt-hashed temporary passwords (10 salt rounds, matching `server/seed.ts` and `server/routes/auth.ts`)
- Password resets required post-migration

### Skipped
- 5 RBAC test users + test orgs
- 3 staff@ users
- All non-user data (conversations, campaigns, messages, etc.)

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Data loss in Supabase | Full `pg_dump --format=plain` backup before any changes |
| pgbouncer + prepared statements | Verified: Drizzle 0.39.3 uses unnamed statements — no issue |
| DROP hits Supabase internals | Only drop `public` schema objects (auth, storage, realtime schemas untouched) |
| gen_random_uuid() missing | PostgreSQL 17.6 — core function, no extension needed |
| Seed generates new UUIDs | Query new org IDs after seed, then insert users with correct refs |
| Wrong password hash format | bcrypt with 10 salt rounds (same as auth.ts and seed.ts) |
| Cage partnerId not set | Post-seed UPDATE to set Cage → Huminic relationship |
| Rollback needed | Restore pg_dump after dropping new schema first |

## PM2 Cleanup

| Process | Path | Action |
|---------|------|--------|
| nexxus-app | nexxus2.2_replit (ours) | Keep — restart after migration |
| nexxus-dev | nexxus2.2 | Stop + delete |
| nexxus-rc1 | live/nexxus2.2 | Stop + delete |
| nexxus-enforcer | governance watcher | Keep |

## Declared Files

| File | Change | Domain |
|------|--------|--------|
| `.env` | Swap DATABASE_URL to Supabase pooler, add DIRECT_URL | IN |
| `drizzle.config.ts` | Use `DIRECT_URL \|\| DATABASE_URL` for schema ops | IN |
| `evidence/DB-1/*` | All sprint artifacts | — |

**Not modified:** `server/storage.ts` (pgbouncer compatible as-is), `shared/schema.ts` (master, unchanged)

## Acceptance Criteria

1. Supabase backup exists at `evidence/DB-1/supabase-backup.sql`
2. All 68 old tables dropped from Supabase `public` schema
3. All 28 Drizzle tables created in Supabase (verified via `SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'`)
4. Seed data present: 7 orgs with correct hierarchy (Huminic → Cage → 5 dealerships), 8 roles, seed users
5. Cage Automotive `partner_id` set to Huminic org ID
6. 9 real users inserted with correct org and role associations
7. `nexxus-dev` and `nexxus-rc1` PM2 processes stopped and deleted
8. App starts against Supabase without errors
9. Health check passes (`GET /api/health`)
10. Login succeeds with a migrated user account
11. Rollback materials preserved (backup + original .env values documented in evidence)

## Rollback Plan

1. Drop new schema: `psql $DIRECT_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`
2. Restore backup: `psql $DIRECT_URL < evidence/DB-1/supabase-backup.sql`
3. Revert `.env` DATABASE_URL to Neon connection string, remove DIRECT_URL
4. Revert `drizzle.config.ts` to use `DATABASE_URL` only
5. Restart nexxus-app

## Review History

### v1 → v2 Changes (spec review)
1. Fixed org hierarchy diagram — Cage has no partnerId to Huminic in seed.ts, added post-seed UPDATE step
2. Added explicit code diff for drizzle.config.ts
3. Resolved prepare:false — verified not needed for Drizzle 0.39.3 with node-postgres
4. Specified bcrypt salt rounds: 10
5. Fixed rollback — added DROP SCHEMA before restore
6. Specified pg_dump format: `--format=plain`
7. Clarified gen_random_uuid() — PG 17.6 core function, no extension
8. Confirmed durran@ email (user-specified, differs from seed.ts durran.cage@)
9. Added note: app uses own JWT auth, not Supabase Auth/RLS
10. Added table count verification step in acceptance criteria
