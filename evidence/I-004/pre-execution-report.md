# I-004 Pre-Execution Report

**Sprint:** I-004 — Container Hardening (Healthcheck, Rate Limiter, Sync Verification)
**Date:** 2026-04-03
**Author:** Orchestrator
**Depends On:** I-001 (committed: 4a4f0a4)

## Objective

Fix production container healthcheck (Docker reports "unhealthy"), fix rate limiter IP parsing error (Caddy passes IP:port in X-Forwarded-For), and verify delta sync + MCP connectivity from inside the container.

## Declared Files

- `Dockerfile` — Add curl to Alpine runner stage for healthcheck
- `server/index.ts` — Add keyGenerator to global rate limiter to strip port from proxied IP
- `server/routes/auth.ts` — Add keyGenerator to auth rate limiter (same fix)
- `server/routes/widgets.ts` — Add keyGenerator to widget rate limiter (same fix)
- `server/routes/public.ts` — Add keyGenerator to public widget rate limiter (same fix)
- `evidence/I-004/` — Sprint artifacts

## UI Changes

NONE. No UI permissions. No frontend files modified.

## Acceptance Criteria

| AC | Description | Test Method |
|----|-------------|-------------|
| I-004.AC1 | Docker healthcheck passes (container reports healthy) | `docker inspect` shows healthy status |
| I-004.AC2 | Rate limiter logs zero ERR_ERL_INVALID_IP_ADDRESS errors | Check container logs post-deploy |
| I-004.AC3 | Delta sync scheduler running inside container | Container logs show scheduler started |
| I-004.AC4 | MCP connectivity from container (central-mcp 4002, vin-safe-mcp 4003) | Container logs show no MCP connection errors |

## Test Plan

### Code Verification (Steps 1-3)

| Test | Command | Expected |
|------|---------|----------|
| Dockerfile builds | `docker build -t nexxus-prod .` | Exit 0 |
| curl available in container | `docker run nexxus-prod which curl` | /usr/bin/curl |
| Healthcheck passes locally | `docker run -d -p 5001:5000 --env-file .env nexxus-prod && sleep 5 && docker inspect --format='{{.State.Health.Status}}'` | healthy |
| Rate limiter accepts proxied IP | Send request with X-Forwarded-For header containing IP:port, verify no ERR_ERL log | No error |

### Production Verification (Steps 5-6)

| Test | Command | Expected |
|------|---------|----------|
| Container healthy post-deploy | `docker inspect` on Coolify container | Status: healthy |
| Zero rate limiter errors | `docker logs <container> 2>&1 \| grep ERR_ERL` | No matches |
| Delta sync running | `docker logs <container> 2>&1 \| grep scheduler` | "All schedulers started" |
| MCP reachable | `docker logs <container> 2>&1 \| grep -i "mcp\|connection refused"` | No connection errors |

## Entry Gates

| Gate | Status | Evidence |
|------|--------|----------|
| A1: I-001 committed | PASS | Commit 4a4f0a4 |
| A2: Production container running on Coolify port 5001 | PASS | E-001 + I-001 exit gate verified |

## Exit Gates

| Gate | What Ghost Checks |
|------|-------------------|
| B1 | Docker healthcheck reports healthy |
| B2 | Zero rate limiter IP errors in container logs |
| B3 | Delta sync and MCP connectivity evidence in logs |

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| curl package adds image size | Low | LOW | Alpine curl is ~2MB, negligible vs 565MB image |
| keyGenerator breaks rate limiting | Low | MEDIUM | Test locally first. Fallback: req.ip if X-Forwarded-For missing |
| Delta sync still fails (non-VIN orgs) | Medium | LOW | Known issue I-201 — sync fails for orgs without VIN integration. Expected. Only verify scheduler starts. |

## Execution Steps

| Step | Action | Executor | Type |
|------|--------|----------|------|
| 0 | Pre-flight | Orchestrator | code |
| 1 | Add curl to Dockerfile | Builder agent | code |
| 2 | Add keyGenerator to rate limiter | Builder agent | code |
| 3 | Build and test Docker image locally | Builder agent | code |
| 4 | Commit, push (Coolify auto-redeploys) | Orchestrator | code |
| 5 | Verify healthcheck, rate limiter, sync, MCP | Verification agent | infrastructure |
| 6 | Ghost verify | Ghost | infrastructure |

## Scope Boundaries

- AC3 and AC4 are verification only — no code changes for sync or MCP
- Delta sync may still fail for non-VIN orgs (I-201) — we're verifying the scheduler starts, not that every sync succeeds
- Caddy configuration is NOT modified — the fix is server-side (strip port from IP)
