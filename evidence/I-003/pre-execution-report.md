# I-003 Pre-Execution Report

**Sprint:** I-003 — Rollback + Production Monitoring
**Date:** 2026-04-03
**Author:** Orchestrator
**Depends On:** I-004 (committed: 4971913)

## Objective

Establish a verified rollback path, production health monitoring via Prometheus, and a migration runbook. Safety net must be confirmed before I-002 changes the staging environment.

## Declared Files

- `docs/rollback-procedure.md` — Step-by-step rollback from Coolify container to PM2
- `docs/migration-runbook.md` — Schema change procedure with backup-first requirement
- `evidence/I-003/` — Sprint artifacts

## UI Changes

NONE. No UI permissions. No frontend files modified.

## Acceptance Criteria

| AC | Description | Test Method |
|----|-------------|-------------|
| I-003.AC1 | pg_dump tested against production using existing sysadmin backup infra | Run backup, verify output file is valid SQL |
| I-003.AC2 | Rollback procedure documented and tested (Caddy repoint to PM2:5000, verify, repoint back) | Operator executes rollback, confirms both directions work |
| I-003.AC3 | Production health monitoring active (Prometheus scrape port 5001) | Sysadmin registers endpoint, verify scrape target exists |
| I-003.AC4 | Migration runbook exists with step-by-step procedure | Document reviewed by operator |

## Test Plan

### Documentation (Steps 1, 5 — agent-executed)

| Test | Method | Expected |
|------|--------|----------|
| Rollback doc completeness | Review: has exact commands, verification steps, timing | All steps concrete, no ambiguity |
| Migration runbook completeness | Review: has backup, push, verify, rollback steps | Complete procedure with pre/post checks |

### Infrastructure Verification (Steps 2-4 — operator-executed)

| Test | Method | Expected |
|------|--------|----------|
| Rollback test | Caddy repoint live→PM2:5000, curl health, repoint back to 5001 | Both directions return 200, no downtime |
| pg_dump test | Run sysadmin backup script against production | Valid SQL dump file produced |
| Prometheus registration | Sysadmin adds scrape target for port 5001 | Target appears in Prometheus targets list |

## Entry Gates

| Gate | Status | Evidence |
|------|--------|----------|
| A1: I-004 committed | PASS | Commit 4971913 |
| A2: Production container serving live.huminic.app | PASS | I-004 exit gate B1 — container healthy on port 5001 |

## Exit Gates

| Gate | What Ghost Checks |
|------|-------------------|
| B1 | Rollback tested (Caddy repoint to PM2, verified, repointed back) |
| B2 | Prometheus scraping production health endpoint |
| B3 | Runbook complete and specific |

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Rollback test causes brief downtime | Low | LOW | PM2 is already running, Caddy reload is instant |
| Prometheus not configured for port 5001 | Low | LOW | Sysadmin handles registration |
| pg_dump fails on connection | Low | MEDIUM | Test connection string first |

## Execution Steps

| Step | Action | Executor | Type |
|------|--------|----------|------|
| 0 | Pre-flight | Orchestrator | code |
| 1 | Write rollback procedure doc | Builder agent | code |
| 2 | Operator tests rollback (Caddy repoint to PM2, verify, repoint back) | Operator | infrastructure |
| 3 | Sysadmin registers port 5001 in Prometheus | Operator | infrastructure |
| 4 | Test pg_dump via sysadmin backup infra | Operator | infrastructure |
| 5 | Write migration runbook | Builder agent | code |
| 6 | Ghost verify | Ghost | infrastructure |

## Scope Boundaries

- No application code changes in this sprint — docs only
- Prometheus registration is sysadmin work, not app code
- Rollback test is temporary (repoint back after verification)
- pg_dump uses existing sysadmin backup infrastructure
