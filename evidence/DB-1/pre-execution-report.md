# Pre-Execution Report: DB-1
Timestamp: 2026-03-19T22:00:00Z
Sprint: DB-1
Status: READY

## Objective
Migrate the application database from Neon to Supabase. Drop 68 old tables, push 28-table Drizzle schema, seed orgs/roles/hierarchy, insert 9 real users with password resets. Update drizzle.config.ts for DIRECT_URL preference.

## Constraints
- Supabase database has real customer data — full backup required before any changes
- Only user identity data is preserved (9 real users with org/role associations)
- All other data starts fresh via seed.ts
- No application code changes (server/storage.ts compatible with pgbouncer as-is)
- Rollback plan: restore pg_dump backup, revert .env + drizzle.config.ts

## Declared Files
- .env
- drizzle.config.ts
- evidence/DB-1/

## Success Criteria
- Supabase backup exists at evidence/DB-1/supabase-backup.sql
- All 68 old tables dropped from Supabase public schema
- All 27 Drizzle tables created in Supabase (verified via table count query)
- Seed data present: 7 orgs with correct hierarchy, 8 roles, seed users
- Cage Automotive partner_id set to Huminic org ID
- 9 real users inserted with correct org and role associations
- nexxus-dev and nexxus-rc1 PM2 processes stopped and deleted
- App starts against Supabase without errors
- Health check passes (GET /api/health)
- Login succeeds with a migrated user account
- Rollback materials preserved (backup + original .env values in evidence)

## Spec
docs/superpowers/specs/2026-03-19-db-migration-design.md

## Plan
docs/superpowers/plans/2026-03-19-db-migration.md
