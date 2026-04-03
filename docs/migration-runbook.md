# Migration Runbook: Schema Changes to Production

**Scope:** Applying schema changes from `shared/schema.ts` to production PostgreSQL via `drizzle-kit push`.

**Architecture reference:** A-001 decisions D-007, D-008.

**Key facts:**
- Schema source of truth: `shared/schema.ts` (not `migrations/` — those are stale)
- Push tool: `drizzle-kit push` using DIRECT_URL (port 5432, bypasses pgbouncer)
- Push WILL drop columns removed from schema and treats renames as drop+add (DATA LOSS)
- No automated rollback — restore from pg_dump backup if needed

---

## 1. Pre-Flight Checklist

Before touching production, verify all of the following:

- [ ] Schema change is committed to git and tested on staging
- [ ] `git diff shared/schema.ts` reviewed — understand exactly what changed
- [ ] No column removals or renames (if there are, see Section 7)
- [ ] Staging push completed successfully with identical schema
- [ ] Application code that uses new/changed columns is deployed or ready to deploy
- [ ] You have the production `DIRECT_URL` (port 5432, not the pooler URL on port 6543)
- [ ] Current time is low-traffic (early morning or scheduled maintenance window)

---

## 2. Backup Production Database

**This is mandatory. Do not skip this step.**

```bash
# Set the production DIRECT_URL (port 5432, not pooler)
export PROD_DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

# Create timestamped backup
docker run --rm postgres:17-alpine pg_dump "$PROD_DIRECT_URL" \
  --format=custom \
  --verbose \
  --file="backup-prod-$(date +%Y%m%d-%H%M%S).dump"

# Verify backup file was created and is non-empty
ls -lh backup-prod-*.dump
```

**Store the backup filename.** You will need it if rollback is required.

**Important:** pg_dump must run via Docker (`postgres:17-alpine`) because the local pg_dump is v12 but the Supabase server is PostgreSQL 17. Version mismatch causes failures.

Note: The existing server backup infrastructure at `/home/ubuntu/Claude-store/sysadmin/backup/backup-projects.sh` handles scheduled backups. The manual pg_dump above is a point-in-time snapshot specifically for this migration.

---

## 3. Review What Push Will Do

`drizzle-kit push` does not have a true dry-run mode, but you can generate the diff to review:

```bash
# Generate the SQL that push would execute (inspect mode)
cd /home/ubuntu/Claude-store/nexxus2.2_replit
DIRECT_URL="$PROD_DIRECT_URL" npx drizzle-kit push --strict
```

The `--strict` flag forces drizzle-kit to prompt before executing any destructive statements (drops, alters). Review every statement it shows.

**Stop if you see:**
- `DROP COLUMN` — see Section 7
- `DROP TABLE` — see Section 7
- `ALTER COLUMN ... TYPE` — potential data conversion issues
- Any statement you do not understand

---

## 4. Apply Schema Change

```bash
cd /home/ubuntu/Claude-store/nexxus2.2_replit
DIRECT_URL="$PROD_DIRECT_URL" npx drizzle-kit push
```

drizzle-kit will show the SQL it intends to run and prompt for confirmation. Read every statement before confirming.

**If push fails partway through:**
- Do NOT re-run immediately
- Check what was applied: connect to DB and inspect the schema
- If the database is in an inconsistent state, restore from backup (Section 6)

---

## 5. Verify Post-Push

```bash
# Health check the running application
curl -sf https://live.huminic.app/api/health

# If using Coolify container, check container logs for schema errors
docker logs $(docker ps -q --filter "publish=5001") --tail 20 2>/dev/null

# If using PM2, check PM2 logs
pm2 logs nexxus-app --lines 20 --nostream

# Test a key authenticated endpoint (login)
curl -sf -X POST https://live.huminic.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"serra_ford@huminic.ai","password":"NexxusTest2026"}' \
  -o /dev/null -w "%{http_code}"
# Expected: 200
```

**Verification criteria:**
- `/api/health` returns 200
- No "column does not exist" or "relation does not exist" errors in logs
- Login works (proves users/sessions/roles tables are intact)
- No increase in error rate in application logs

---

## 6. Rollback If Needed

If the push caused problems, restore the pre-push backup:

```bash
export PROD_DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

# Restore from backup (replaces ALL data and schema)
pg_restore "$PROD_DIRECT_URL" \
  --clean \
  --if-exists \
  --verbose \
  --no-owner \
  --no-privileges \
  backup-prod-YYYYMMDD-HHMMSS.dump
```

**After restore:**
1. Verify health: `curl -sf https://live.huminic.app/api/health`
2. Revert the schema change in `shared/schema.ts` (or revert the git commit)
3. Restart the application so it picks up the restored schema:
   - Container: redeploy via Coolify
   - PM2: `pm2 restart nexxus-app`

**Warning:** `pg_restore --clean` drops and recreates objects. Any data written between the backup and the restore will be lost. This is expected — the backup is the known-good state.

---

## 7. Dangerous Operations

The following schema changes require explicit owner approval before execution. Do NOT proceed without it.

### Column Removal

`drizzle-kit push` will DROP any column present in the database but absent from `shared/schema.ts`. This is permanent data loss.

**Procedure:**
1. Confirm with owner that the column's data is no longer needed
2. Query production to check if the column contains data: `SELECT COUNT(*) FROM [table] WHERE [column] IS NOT NULL;`
3. If data exists, export it before push: `COPY (SELECT id, [column] FROM [table]) TO STDOUT WITH CSV HEADER;`
4. Take the pg_dump backup (Section 2)
5. Proceed with push

### Column Rename

drizzle-kit treats a rename as DROP old + ADD new. All data in the old column is lost.

**Procedure:**
1. Do NOT rename in schema.ts directly
2. Instead, add the new column, deploy code that writes to both, backfill data, then remove the old column in a separate push
3. This requires two separate schema pushes with a code deploy in between

### Table Removal

Same as column removal but affects the entire table. Backup is mandatory. Owner approval is mandatory.

### Type Change (ALTER COLUMN TYPE)

May fail if existing data cannot be cast to the new type. Always test on staging first with realistic data.

---

## Quick Reference

```bash
# FULL MIGRATION SEQUENCE
export PROD_DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

# 1. Backup
docker run --rm postgres:17-alpine pg_dump "$PROD_DIRECT_URL" --format=custom --verbose > "backup-prod-$(date +%Y%m%d-%H%M%S).dump"

# 2. Review
cd /home/ubuntu/Claude-store/nexxus2.2_replit
DIRECT_URL="$PROD_DIRECT_URL" npx drizzle-kit push --strict

# 3. Apply (after reviewing output from step 2)
DIRECT_URL="$PROD_DIRECT_URL" npx drizzle-kit push

# 4. Verify
curl -sf https://live.huminic.app/api/health
```
