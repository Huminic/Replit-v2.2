# I-003 — Schema Governance + Monitoring Baseline

## 1. Goals

Establish the operational procedures for schema changes and production monitoring. After this sprint, there is a documented and tested process for promoting schema changes to production, taking backups, and knowing when production is unhealthy.

## 2. Work

| Item | Target | Action |
|------|--------|--------|
| W1 | Backup script | Create `scripts/db-backup.sh` that runs `pg_dump --format=custom` against production DATABASE_URL, saves to dated file. |
| W2 | Backup test | Run backup script against production. Verify backup file is valid (`pg_restore --list`). |
| W3 | Schema push script | Create `scripts/db-push-production.sh` that: (1) runs backup first, (2) runs `drizzle-kit push` against DIRECT_URL, (3) verifies app health after push. |
| W4 | Rollback test | Document rollback procedure: stop container → `pg_restore --clean` → restart. Test against staging DB (not production). |
| W5 | Health monitoring | Add production health check to sysadmin monitoring (Prometheus/Grafana if available, or simple cron curl check). |
| W6 | Migration runbook | Write `docs/migration-runbook.md` with step-by-step procedure for schema changes. |

## 3. Acceptance Criteria

| AC | Description |
|----|-------------|
| I-003.AC1 | Backup script exists, produces valid pg_dump file from production. |
| I-003.AC2 | Schema push script exists with mandatory backup-before-push. |
| I-003.AC3 | Rollback procedure documented and tested against staging. |
| I-003.AC4 | Production health check monitored (alert on failure — even if just a cron job that logs). |
| I-003.AC5 | Migration runbook exists with step-by-step procedure. |

## 4. Test Plan

| AC | How verified | Expected output | Verified by |
|----|-------------|-----------------|-------------|
| AC1 | Run `scripts/db-backup.sh` → `pg_restore --list <backup-file>` | Lists tables/data, no errors | Ghost |
| AC2 | Read `scripts/db-push-production.sh` — verify it calls backup first | Backup step exists before push step | Ghost reads file |
| AC3 | Read `docs/migration-runbook.md` — verify rollback section exists with exact commands | Rollback commands present, tested against staging | Ghost reads file |
| AC4 | Check cron or monitoring config for health check | Health check configured, last check within 5 min | Ghost |
| AC5 | Read runbook — verify it covers: backup, push, verify, rollback | All 4 sections present | Ghost reads file |

## 5. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| pg_dump fails (connection, permissions) | Low | MEDIUM — can't backup | Test against staging first. Production DB uses same Supabase driver. |
| Rollback test corrupts staging data | Low | LOW — staging is disposable | Staging data is seed/test data. Can be recreated via db:push + seed. |
| Monitoring adds complexity | Low | LOW — minimal setup | Start with simplest possible: cron curl check. Upgrade post-MVP. |

## 6. Exit Criteria

| Gate | What Ghost checks |
|------|-------------------|
| B1 | Backup script runs successfully against production |
| B2 | Schema push script has mandatory backup step |
| B3 | Rollback procedure tested against staging |
| B4 | Health monitoring active |
| B5 | Migration runbook is complete and specific (not generic boilerplate) |

## Issues Addressed
I-221 (investigation only — Traefik stays off), I-223, I-224
