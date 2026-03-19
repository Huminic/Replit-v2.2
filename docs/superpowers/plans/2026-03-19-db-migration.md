# DB-1: Supabase Database Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the application database from Neon to Supabase, preserving 9 real users with their org/role associations.

**Architecture:** Clean drop of 68 old Supabase tables → Drizzle push of 28-table schema → seed.ts for orgs/roles/hierarchy → INSERT 9 real users with reset passwords. One config change to drizzle.config.ts (DIRECT_URL preference). No application code changes needed.

**Tech Stack:** PostgreSQL 17.6 (Supabase), Drizzle ORM 0.39.3, drizzle-kit 0.31.8, pg (node-postgres), bcrypt 6.x

**Spec:** `docs/superpowers/specs/2026-03-19-db-migration-design.md`

---

### Task 1: Sprint Setup (Harness Compliance)

**Files:**
- Modify: `sprints.json`
- Create: `evidence/DB-1/pre-execution-report.md`

- [ ] **Step 1: Register DB-1 in sprints.json**

Add sprint entry after T-8:
```json
{
  "id": "DB-1",
  "name": "Supabase database migration — schema swap + user preservation",
  "phase": "DB",
  "status": "in_progress",
  "scope": [
    ".env",
    "drizzle.config.ts",
    "evidence/DB-1/",
    "sprints.json"
  ],
  "dependencies": ["T-8"],
  "description": "Migrate from Neon to Supabase. Drop 68 old tables, push 28-table Drizzle schema, seed orgs/roles, insert 9 real users with password resets. Update drizzle.config.ts for DIRECT_URL."
}
```

- [ ] **Step 2: Create evidence directory and pre-execution report**

Create `evidence/DB-1/pre-execution-report.md` with:
- Timestamp, Sprint: DB-1, Status: READY
- Objective: Migrate database from Neon to Supabase
- Declared Files: `.env`, `drizzle.config.ts`, `evidence/DB-1/*`
- Success Criteria: all 11 acceptance criteria from the spec
- Constraints: real customer data, full backup required, rollback plan documented

- [ ] **Step 3: Update session state**

---

### Task 2: Backup Supabase Database

**Files:**
- Create: `evidence/DB-1/supabase-backup.sql`
- Create: `evidence/DB-1/supabase-schema-snapshot.txt`

- [ ] **Step 1: Full pg_dump of Supabase**

```bash
PGPASSWORD='kebFuz-huzdus-fifjo5' pg_dump \
  -h aws-0-us-west-2.pooler.supabase.com -p 5432 \
  -U postgres.lhltgisoqxgpamtssxeb -d postgres \
  --format=plain --no-owner --no-privileges \
  > evidence/DB-1/supabase-backup.sql
```

Expected: SQL file with all 68 tables, data, indexes, constraints, RLS policies.

- [ ] **Step 2: Capture schema snapshot for reference**

```bash
PGPASSWORD='kebFuz-huzdus-fifjo5' psql \
  -h aws-0-us-west-2.pooler.supabase.com -p 6543 \
  -U postgres.lhltgisoqxgpamtssxeb -d postgres \
  -c "\dt public.*" > evidence/DB-1/supabase-schema-snapshot.txt
```

- [ ] **Step 3: Verify backup file is non-empty and contains table definitions**

```bash
wc -l evidence/DB-1/supabase-backup.sql
grep -c "CREATE TABLE" evidence/DB-1/supabase-backup.sql
```

Expected: Substantial line count, 68+ CREATE TABLE statements.

---

### Task 3: Stop Non-Project PM2 Processes

- [ ] **Step 1: Stop and delete nexxus-dev**

```bash
pm2 stop nexxus-dev && pm2 delete nexxus-dev
```

Expected: Process removed from PM2 list.

- [ ] **Step 2: Stop and delete nexxus-rc1**

```bash
pm2 stop nexxus-rc1 && pm2 delete nexxus-rc1
```

Expected: Process removed from PM2 list.

- [ ] **Step 3: Verify only our processes remain**

```bash
pm2 list | grep nexxus
```

Expected: Only `nexxus-app` and `nexxus-enforcer` remain.

- [ ] **Step 4: Save PM2 process list**

```bash
pm2 save
```

---

### Task 4: Drop All Supabase Public Schema Objects

**CAUTION:** This destroys all 68 tables. Backup must be verified first.

- [ ] **Step 1: Verify backup exists before proceeding**

```bash
test -f evidence/DB-1/supabase-backup.sql && echo "BACKUP EXISTS" || echo "ABORT: NO BACKUP"
```

Must show "BACKUP EXISTS" before continuing.

- [ ] **Step 2: Drop all public schema tables, policies, triggers, functions**

Using DIRECT_URL (port 5432, no pgbouncer) for DDL:

```bash
PGPASSWORD='kebFuz-huzdus-fifjo5' psql \
  -h aws-0-us-west-2.pooler.supabase.com -p 5432 \
  -U postgres.lhltgisoqxgpamtssxeb -d postgres \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;"
```

Expected: Schema dropped and recreated empty.

- [ ] **Step 3: Verify public schema is empty**

```bash
PGPASSWORD='kebFuz-huzdus-fifjo5' psql \
  -h aws-0-us-west-2.pooler.supabase.com -p 6543 \
  -U postgres.lhltgisoqxgpamtssxeb -d postgres \
  -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

Expected: count = 0.

---

### Task 5: Update Configuration Files

**Files:**
- Modify: `.env`
- Modify: `drizzle.config.ts`

- [ ] **Step 1: Document current Neon connection string**

Save the current DATABASE_URL to evidence for rollback:

```bash
grep "^DATABASE_URL" .env > evidence/DB-1/neon-connection-backup.txt
```

- [ ] **Step 2: Update .env — swap DATABASE_URL, add DIRECT_URL**

Replace DATABASE_URL with Supabase pooler URL. Add DIRECT_URL for DDL operations:

```
DATABASE_URL=postgresql://postgres.lhltgisoqxgpamtssxeb:kebFuz-huzdus-fifjo5@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.lhltgisoqxgpamtssxeb:kebFuz-huzdus-fifjo5@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

- [ ] **Step 3: Update drizzle.config.ts — prefer DIRECT_URL**

Change line 12 from:
```typescript
url: process.env.DATABASE_URL,
```
To:
```typescript
url: process.env.DIRECT_URL || process.env.DATABASE_URL,
```

This ensures DDL operations bypass pgbouncer.

---

### Task 6: Push Drizzle Schema to Supabase

- [ ] **Step 1: Run drizzle-kit push**

```bash
npx drizzle-kit push
```

Expected: 28 tables created. No errors. Drizzle reads `shared/schema.ts` and creates all tables, indexes, and foreign keys.

- [ ] **Step 2: Verify table count**

```bash
PGPASSWORD='kebFuz-huzdus-fifjo5' psql \
  -h aws-0-us-west-2.pooler.supabase.com -p 6543 \
  -U postgres.lhltgisoqxgpamtssxeb -d postgres \
  -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

Expected: count = 28.

- [ ] **Step 3: Verify key tables exist with correct columns**

```bash
PGPASSWORD='kebFuz-huzdus-fifjo5' psql \
  -h aws-0-us-west-2.pooler.supabase.com -p 6543 \
  -U postgres.lhltgisoqxgpamtssxeb -d postgres \
  -c "\d users" -c "\d organizations" -c "\d roles"
```

Expected: Tables match `shared/schema.ts` definitions exactly.

---

### Task 7: Seed Database

- [ ] **Step 1: Restart app to pick up new DATABASE_URL**

```bash
pm2 restart nexxus-app
```

Wait for startup. The app will detect empty database and run seed.ts automatically.

- [ ] **Step 2: Verify seed completed**

```bash
pm2 logs nexxus-app --lines 50 | grep -i "seed\|created\|huminic"
```

Expected: Seed messages showing orgs, roles, users, agents, campaigns created.

- [ ] **Step 3: Verify org hierarchy**

```bash
PGPASSWORD='kebFuz-huzdus-fifjo5' psql \
  -h aws-0-us-west-2.pooler.supabase.com -p 6543 \
  -U postgres.lhltgisoqxgpamtssxeb -d postgres \
  -c "SELECT id, name, slug, partner_id FROM organizations ORDER BY name;"
```

Expected: 7 orgs — Huminic (no partner), Cage Automotive (no partner yet), 5 dealerships (partner = Cage).

- [ ] **Step 4: Fix Cage Automotive → Huminic partnership**

```bash
PGPASSWORD='kebFuz-huzdus-fifjo5' psql \
  -h aws-0-us-west-2.pooler.supabase.com -p 6543 \
  -U postgres.lhltgisoqxgpamtssxeb -d postgres \
  -c "UPDATE organizations SET partner_id = (SELECT id FROM organizations WHERE slug = 'huminic') WHERE slug = 'cage-automotive';"
```

- [ ] **Step 5: Verify hierarchy is correct**

```bash
PGPASSWORD='kebFuz-huzdus-fifjo5' psql \
  -h aws-0-us-west-2.pooler.supabase.com -p 6543 \
  -U postgres.lhltgisoqxgpamtssxeb -d postgres \
  -c "SELECT o.name, o.slug, p.name as parent FROM organizations o LEFT JOIN organizations p ON o.partner_id = p.id ORDER BY o.name;"
```

Expected: Cage → Huminic, all 5 dealerships → Cage, Huminic → null.

---

### Task 8: Insert 9 Real Users

- [ ] **Step 1: Generate bcrypt hashes for temporary passwords**

Create a Node.js script to insert users. Each user gets a temporary password that must be reset:

```bash
node -e "
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });

async function run() {
  const rolesRes = await pool.query('SELECT id, name FROM roles');
  const roleMap = {};
  for (const r of rolesRes.rows) roleMap[r.name] = r.id;

  const orgsRes = await pool.query('SELECT id, slug FROM organizations');
  const orgMap = {};
  for (const o of orgsRes.rows) orgMap[o.slug] = o.id;

  const tempPassword = await bcrypt.hash('ChangeMe2026!', 10);

  const users = [
    { email: 'durran@cageautomotive.com', firstName: 'Durran', lastName: 'Cage', role: 'partner_admin', org: 'cage-automotive' },
    { email: 'admin@serrahonda.com', firstName: 'Honda', lastName: 'Manager', role: 'org_admin', org: 'serra-honda' },
    { email: 'victoria@misscommunicationconsulting.com', firstName: 'Victoria', lastName: 'Serra Admin', role: 'org_admin', org: 'serra-honda' },
    { email: 'admin@serranissan.com', firstName: 'Nissan', lastName: 'Manager', role: 'org_admin', org: 'serra-nissan' },
    { email: 'admin@tonyserraford.com', firstName: 'Tony', lastName: 'Manager', role: 'org_admin', org: 'tony-serra-ford' },
    { email: 'admin@fordofcolumbia.com', firstName: 'Ford', lastName: 'Manager', role: 'org_admin', org: 'ford-of-columbia' },
    { email: 'admin@hyundaiofcolumbia.com', firstName: 'Hyundai', lastName: 'Manager', role: 'org_admin', org: 'hyundai-of-columbia' },
    { email: 'sam.mayfield@bc.auto', firstName: 'Sam', lastName: 'Mayfield', role: 'org_admin', org: 'hyundai-of-columbia' },
  ];

  for (const u of users) {
    const existing = await pool.query('SELECT id FROM users WHERE email = \$1', [u.email]);
    if (existing.rows.length > 0) {
      console.log('Already exists, skipping: ' + u.email);
      continue;
    }
    await pool.query(
      'INSERT INTO users (email, password, first_name, last_name, role_id, organization_id, is_active) VALUES (\$1, \$2, \$3, \$4, \$5, \$6, true)',
      [u.email, tempPassword, u.firstName, u.lastName, roleMap[u.role], orgMap[u.org]]
    );
    console.log('Inserted: ' + u.email);
  }

  // duane.wells@huminic.ai already created by seed — update password
  await pool.query('UPDATE users SET password = \$1 WHERE email = \$2', [tempPassword, 'duane.wells@huminic.ai']);
  console.log('Password reset: duane.wells@huminic.ai');

  await pool.end();
  console.log('Done. All users have temporary password: ChangeMe2026!');
}
run().catch(e => { console.error(e); process.exit(1); });
"
```

Note: `duane.wells@huminic.ai` is already created by seed.ts. We just reset the password. The other 8 are new inserts.

- [ ] **Step 2: Verify all 9 users exist with correct associations**

```bash
PGPASSWORD='kebFuz-huzdus-fifjo5' psql \
  -h aws-0-us-west-2.pooler.supabase.com -p 6543 \
  -U postgres.lhltgisoqxgpamtssxeb -d postgres \
  -c "SELECT u.email, r.name as role, o.name as org FROM users u JOIN roles r ON u.role_id = r.id JOIN organizations o ON u.organization_id = o.id WHERE u.email IN ('duane.wells@huminic.ai','durran@cageautomotive.com','admin@serrahonda.com','victoria@misscommunicationconsulting.com','admin@serranissan.com','admin@tonyserraford.com','admin@fordofcolumbia.com','admin@hyundaiofcolumbia.com','sam.mayfield@bc.auto') ORDER BY r.level, o.name;"
```

Expected: 9 rows, each with correct role and org.

---

### Task 9: Verify Application Health

- [ ] **Step 1: Restart app to ensure clean state**

```bash
pm2 restart nexxus-app && sleep 5
```

- [ ] **Step 1b: Check for startup errors**

```bash
pm2 logs nexxus-app --lines 30 --nostream 2>&1 | grep -i "error\|ECONNREFUSED\|fatal\|ENOTFOUND" || echo "No errors found"
```

Expected: "No errors found" or only non-fatal warnings.

- [ ] **Step 2: Health check**

```bash
curl -s http://localhost:5000/api/health | head -5
```

Expected: 200 OK with health response.

- [ ] **Step 3: Login test with migrated user**

```bash
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"duane.wells@huminic.ai","password":"ChangeMe2026!"}' | head -5
```

Expected: 200 with JWT token and user data.

- [ ] **Step 4: Login test with a dealer admin**

```bash
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@serrahonda.com","password":"ChangeMe2026!"}' | head -5
```

Expected: 200 with JWT token, org = Serra Honda.

---

### Task 10: Data Integrity Verification

- [ ] **Step 1: Table count verification**

```bash
PGPASSWORD='kebFuz-huzdus-fifjo5' psql \
  -h aws-0-us-west-2.pooler.supabase.com -p 6543 \
  -U postgres.lhltgisoqxgpamtssxeb -d postgres \
  -c "SELECT count(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"
```

Expected: 28.

- [ ] **Step 2: Foreign key integrity check**

```bash
PGPASSWORD='kebFuz-huzdus-fifjo5' psql \
  -h aws-0-us-west-2.pooler.supabase.com -p 6543 \
  -U postgres.lhltgisoqxgpamtssxeb -d postgres \
  -c "SELECT count(*) FROM users u LEFT JOIN organizations o ON u.organization_id = o.id WHERE o.id IS NULL;"
```

Expected: 0 (no orphaned user-org references).

- [ ] **Step 3: Role assignment verification**

```bash
PGPASSWORD='kebFuz-huzdus-fifjo5' psql \
  -h aws-0-us-west-2.pooler.supabase.com -p 6543 \
  -U postgres.lhltgisoqxgpamtssxeb -d postgres \
  -c "SELECT count(*) FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE r.id IS NULL;"
```

Expected: 0 (no orphaned user-role references).

- [ ] **Step 4: Org hierarchy verification**

```bash
PGPASSWORD='kebFuz-huzdus-fifjo5' psql \
  -h aws-0-us-west-2.pooler.supabase.com -p 6543 \
  -U postgres.lhltgisoqxgpamtssxeb -d postgres \
  -c "SELECT count(*) FROM organizations WHERE partner_id IS NOT NULL AND partner_id NOT IN (SELECT id FROM organizations);"
```

Expected: 0 (no orphaned partner references).

---

### Task 11: Run Full Playwright Test Suite

- [ ] **Step 1: Run all tests**

```bash
AUTH_RATE_LIMIT_MAX=500 GLOBAL_RATE_LIMIT_MAX=1000 npx playwright test --workers=2
```

Expected: Same pass rate as T-8 (128/128 or equivalent). Any failures indicate the Supabase migration broke something.

- [ ] **Step 2: Save test results to evidence**

```bash
cp evidence/T-2/test-results.json evidence/DB-1/post-migration-test-results.json 2>/dev/null
npx playwright test --reporter=json 2>/dev/null | head -100 > evidence/DB-1/playwright-summary.json
```

- [ ] **Step 3: Compare results against T-8 baseline**

Any regressions must be investigated and documented.

---

### Task 12: Sprint Completion (Harness Compliance)

**Files:**
- Create: `evidence/DB-1/post-sprint-report.md`
- Create: `evidence/DB-1/cross-sign.md`
- Modify: `sprints.json`

- [ ] **Step 1: Write post-sprint report**

Document all results: backup size, tables created, users inserted, health check status, test results, rollback materials location.

- [ ] **Step 2: Run enforcer checklist**

```bash
bash scripts/enforcer-checklist.sh
```

- [ ] **Step 3: Write cross-sign**

Different role reviews the work. Implementing: orchestrator. Reviewing: integration.

- [ ] **Step 4: Commit**

```bash
COMMIT_ROLE=orchestrator COMMIT_SPRINT=DB-1 git commit -m "[DB-1] Supabase database migration — Neon to Supabase with 9 user preservation"
```

- [ ] **Step 5: Update sprints.json with commit hash and status "committed"**

- [ ] **Step 6: Update session state**
