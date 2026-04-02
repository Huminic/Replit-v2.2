# I-001 Pre-Execution Report

**Sprint:** I-001 — Production Cutover (Coolify Container + Caddy Repoint)
**Date:** 2026-04-02
**Author:** Orchestrator
**Depends On:** A-001 (committed: 8c44ffd)

## Objective

Stand up production in a Coolify-managed Docker container. Repoint live.huminic.app from PM2 (localhost:5000) to the Coolify container. dev.huminicdev.com stays on PM2 unchanged. Runtime change only — same production database (D-001).

## Declared Files

- `Dockerfile` — Add pm2 install in runner stage, change CMD to pm2-runtime (AC1)
- `server/seed.ts` — Add SKIP_DEMO_SEED env var check (AC2)
- `evidence/I-001/` — Sprint artifacts (governance)

## UI Changes

NONE. This sprint has no UI permissions. No frontend files are modified.

## Acceptance Criteria

(Source: sprints.json)

| AC | Description | Test Method |
|----|-------------|-------------|
| I-001.AC1 | Dockerfile uses pm2-runtime. Image builds and passes health check. | `docker build . && docker run -p 5001:5000 --env-file .env nexxus && curl localhost:5001/api/health` |
| I-001.AC2 | SKIP_DEMO_SEED=true prevents demo data on fresh boot. | Start container with SKIP_DEMO_SEED=true, verify no Serra Honda demo org created |
| I-001.AC3 | Coolify application exists with production env vars. | Coolify API `GET /api/v1/applications` returns nexxus app |
| I-001.AC4 | Container deployed via Coolify, health check passes on container port. | `curl http://localhost:<container-port>/api/health` returns 200 |
| I-001.AC5 | Caddy repointed: live.huminic.app -> Coolify container. dev.huminicdev.com -> PM2. | Both domains return 200, different upstreams |
| I-001.AC6 | Both domains serve different processes (verified). | Compare response headers or timing across 3 requests |
| I-001.AC7 | All 9 MVP flows verified on production. | E2E tests against live.huminic.app |

## Test Plan

### Code Verification (Steps 1-2)

| Test | Command | Expected |
|------|---------|----------|
| Dockerfile builds | `docker build -t nexxus-prod .` | Exit 0, image created |
| Container starts | `docker run -d -p 5001:5000 --env-file .env --name nexxus-test nexxus-prod` | Container running |
| Health check | `curl -s http://localhost:5001/api/health` | `{"status":"ok"}` |
| SKIP_DEMO_SEED | `docker run -e SKIP_DEMO_SEED=true ... nexxus-prod` + check logs | "Skipping demo seed" in stdout |
| Container cleanup | `docker stop nexxus-test && docker rm nexxus-test` | Clean |

### Infrastructure Verification (Steps 3-4, operator-executed)

| Test | Command | Expected |
|------|---------|----------|
| Coolify app exists | `curl -H "Authorization: Bearer $TOKEN" https://docker.huminicdev.com/api/v1/applications` | Nexxus app in list |
| Container health | `curl http://localhost:<container-port>/api/health` | 200 OK |
| Caddy live | `curl -sI https://live.huminic.app/api/health` | 200, routed to container |
| Caddy dev | `curl -sI https://dev.huminicdev.com/api/health` | 200, routed to PM2 (unchanged) |
| Process separation | Compare X-Request-ID or uptime values from both domains | Different values |

### Production Verification (Step 5)

9 MVP flows verified against live.huminic.app:
1. Login (super_admin, partner_admin, org_admin)
2. Org switching
3. Dashboard loads
4. Chat/conversation view
5. TeamBox view
6. Campaign list
7. Widget configuration
8. Settings page
9. API health + VIN connectivity per dealer

## Entry Gates

| Gate | Status | Evidence |
|------|--------|----------|
| A1: A-001 committed | PASS | Commit 8c44ffd |
| A2: Coolify API access verified | PASS | E-001: v4.0.0-beta.464, token works, applications endpoint returns empty array |
| A3: Sysadmin Caddy access confirmed | PASS | E-001: Caddyfile at /etc/caddy/Caddyfile, reload via `sudo systemctl reload caddy` |

## Exit Gates

| Gate | What Ghost Checks |
|------|-------------------|
| B1 | live.huminic.app serves production container (not PM2) |
| B2 | dev.huminicdev.com serves PM2 (unchanged) |
| B3 | Production DB is the original Supabase project (not a new one) |
| B4 | All 9 MVP flows pass on production |
| B5 | Rollback path documented and tested (repoint Caddy back to 5000) |

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Container won't start (bad Dockerfile, missing env var) | Medium | HIGH | Test locally first (Step 2) before Coolify deploy |
| Caddy repoint causes downtime | Low | HIGH | Verify container healthy BEFORE repoint. PM2 stays running as instant rollback. |
| Production DB connection from container fails | Low | HIGH | Test connection string from container before repoint |
| MCP unreachable from container (Docker network) | Medium | MEDIUM | Verify MCP connectivity from inside container (W5a). May need MCP_BASE_URL=host. |
| Coolify can't clone repo | Low | MEDIUM | Repo is public. No deploy key needed. |

## Execution Steps

| Step | Action | Executor | Infra? |
|------|--------|----------|--------|
| 0 | Pre-flight: verify entry gates, clean worktree | Orchestrator | No |
| 1 | Update Dockerfile + seed.ts | Builder agent | Code only |
| 2 | Build and test Docker image locally | Builder agent | No (local docker) |
| 3 | Create Coolify app, configure env vars, deploy | Operator (sysadmin) | YES |
| 4 | Sysadmin repoint Caddy | Operator (sysadmin) | YES |
| 5 | Verify both domains, 9 flows, VIN per dealer | QA agent + operator | No |
| 6 | Ghost verify | Ghost | No |

## Scope Boundaries

- W6a (PM2 .env swap to staging DB) is DEFERRED to I-002. dev.huminicdev.com stays on production DB for now.
- No new database created. Current Supabase IS production (D-001).
- No monitoring/alerting added. That is I-003.
- Infrastructure steps (3, 4) executed by operator through sysadmin tools, not by builder agents.

## Issues Addressed

| Issue | Resolution |
|-------|-----------|
| I-200 | Production environment separation (runtime) |
| I-215 | Coolify application created for nexxus |
| I-217 | Deploy pipeline connects to real target |
| I-220 | Caddy repointed via sysadmin |
| I-222 | SKIP_DEMO_SEED prevents demo data in production |
| I-201 | Delta sync verified inside container |

## Rollback Plan

If anything goes wrong after Caddy repoint:
1. `sudo nano /etc/caddy/Caddyfile` — change live.huminic.app back to `localhost:5000`
2. `sudo systemctl reload caddy`
3. PM2 is still running — instant recovery, zero data impact

## Ghost Entry Gate

**Report ID:** GHOST-ghost-20260402T153820Z
**Scan Date:** 2026-04-02T15:38:54Z
**Phase:** qa_resolve_loop
**Governance:** v2-hardened

### Pre-Exec vs sprints.json Diff

| Field | sprints.json | Pre-Exec | Match |
|-------|-------------|----------|-------|
| AC count | 7 | 7 | YES |
| Declared files | Dockerfile, server/seed.ts, evidence/I-001/ | Dockerfile, server/seed.ts, evidence/I-001/ | YES |
| Dependencies | A-001 | A-001 (committed 8c44ffd) | YES |
| Issues | I-200, I-215, I-217, I-220, I-222, I-201 | I-200, I-215, I-217, I-220, I-222, I-201 | YES |
| Entry gates | 3 | 3 (all PASS) | YES |
| Exit gates | 4 | 5 (B5 added: rollback documented) | SUPERSET OK |
| UI permissions | Not declared | NONE stated | OK |

### Governance Checks (C1-C19)

14 PASS, 1 VIOLATION (C6: bus dirs missing — pre-existing, unrelated to I-001), 2 WARNING (C10: dirty governor files, C18: no ghost config.json).

### Verdict

All ACs accounted for. Declared files match. Entry gates verified. Dependencies committed. No scope creep. C6 violation is pre-existing infrastructure gap, not sprint-related.

**ENTRY GATE: APPROVED**
