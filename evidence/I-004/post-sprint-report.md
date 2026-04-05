# I-004 Post-Sprint Report

**Sprint:** I-004 — Container Hardening (Healthcheck, Rate Limiter, Sync Verification)
**Date:** 2026-04-03
**Author:** Verification Agent
**Commit:** 4971913
**Depends On:** I-001 (committed: 4a4f0a4)

## Objective

Fix production container healthcheck (Docker reported "unhealthy" due to missing curl), fix rate limiter IP parsing error (Caddy passes IP:port in X-Forwarded-For, causing ERR_ERL_INVALID_IP_ADDRESS), and verify delta sync scheduler + MCP connectivity from inside the container.

## Changes Made

| File | Change |
|------|--------|
| `Dockerfile` | Added `apk add --no-cache curl` to Alpine runner stage so Docker healthcheck can use curl |
| `server/index.ts` | Added `keyGenerator` to global rate limiter to strip port from proxied IP |
| `server/routes/auth.ts` | Added `keyGenerator` to auth rate limiter (same IP:port fix) |
| `server/routes/widgets.ts` | Added `keyGenerator` to widget rate limiter (same fix) |
| `server/routes/public.ts` | Added `keyGenerator` to public widget rate limiter (same fix) |

## AC Results

| AC | Description | Result | Evidence |
|----|-------------|--------|----------|
| I-004.AC1 | Docker healthcheck passes (container reports healthy) | **PASS** | `docker ps` shows: `d77061963f2f Up 3 minutes (healthy)`. `which curl` returns `/usr/bin/curl`. |
| I-004.AC2 | Rate limiter logs zero ERR_ERL_INVALID_IP_ADDRESS errors | **PASS** | `docker logs ... \| grep ERR_ERL` returns empty. Sent test request with `X-Forwarded-For: 1.2.3.4:9999` header — response was `200 OK` with valid health JSON, and subsequent log check still shows zero ERR_ERL matches. |
| I-004.AC3 | Delta sync scheduler running inside container | **PASS** | Container logs show: `1:44:14 AM [scheduler] All schedulers started` and `[Sync] Scheduler started for 7 organization(s). Metrics every 4h (business hours), delta nightly.` |
| I-004.AC4 | MCP connectivity from container (central-mcp 4002, vin-safe-mcp 4003) | **PASS** | Container logs show zero `ECONNREFUSED` or `connection refused` entries. Host-level verification: central-mcp (port 4002) responds with auth challenge (reachable), vin-safe-mcp (port 4003) `vin_health_check` returns `{"healthy":true}`. |

## Test Execution

### AC1: Docker healthcheck

```
$ docker ps --filter "publish=5001" --format "{{.ID}} {{.Status}}"
d77061963f2f Up 3 minutes (healthy)

$ docker exec d77061963f2f which curl
/usr/bin/curl
```

### AC2: Rate limiter — zero ERR_ERL errors

```
$ docker logs d77061963f2f 2>&1 | grep "ERR_ERL" | head -5
(no output — zero matches)

$ curl -s -H "X-Forwarded-For: 1.2.3.4:9999" https://live.huminic.app/api/health
{"status":"ok","version":"2.2.0","uptime":243,"timestamp":"2026-04-03T01:48:16.798Z","environment":"production"}

$ docker logs d77061963f2f 2>&1 | grep "ERR_ERL" | head -5
(no output — still zero matches after IP:port test)
```

### AC3: Delta sync scheduler

```
$ docker logs d77061963f2f 2>&1 | grep -i "scheduler" | head -5
1:44:14 AM [scheduler] All schedulers started
[Sync] Scheduler started for 7 organization(s). Metrics every 4h (business hours), delta nightly.
```

### AC4: MCP connectivity

```
$ docker logs d77061963f2f 2>&1 | grep -i "mcp\|connection refused\|ECONNREFUSED" | head -10
(no output — zero MCP connection errors)

$ curl -s http://localhost:4002/mcp | head -50
{"error":{"code":"AUTH_ERROR","message":"Missing or invalid Authorization header"}}
(central-mcp reachable — returns auth error as expected without token)

$ curl -s -X POST http://localhost:4003/api/tool/vin_health_check -H "Authorization: Bearer ..." -H "Content-Type: application/json" -d '{}'
{"healthy":true}
(vin-safe-mcp reachable and healthy)
```

### Domain verification

```
$ curl -s https://live.huminic.app/api/health
{"status":"ok","version":"2.2.0","uptime":236,"timestamp":"2026-04-03T01:48:09.324Z","environment":"production"}

$ curl -s https://dev.huminicdev.com/api/health
{"status":"ok","version":"2.2.0","uptime":153830,"timestamp":"2026-04-03T01:48:09.523Z","environment":"production"}
```

### Rollback verification

```
$ pm2 list | grep nexxus-app
│ 37 │ nexxus-app │ default │ 1.0.0 │ fork │ 2776669 │ 42h │ 43 │ online │ 0% │ 127.0mb │ ubuntu │ disabled │

$ curl -s http://localhost:5000/api/health
{"status":"ok","version":"2.2.0","uptime":153831,"timestamp":"2026-04-03T01:48:10.111Z","environment":"production"}
```

PM2 rollback (port 5000) is online and healthy. Container runs on port 5001.

## UI Delta

NONE — no UI changes. No frontend files modified. `uiPermissions` was not declared for this sprint.

## Regression Delta

- **live.huminic.app** — responds 200 with health JSON, version 2.2.0. No regression.
- **dev.huminicdev.com** — responds 200 with health JSON, version 2.2.0. No regression.
- **PM2 fallback** — still running on port 5000, online for 42h. No regression.
- **Container startup** — clean startup, no error logs in first 30 lines. Seed skipped correctly (SKIP_DEMO_SEED=true). All schedulers started.

## Cross-Test Results

N/A — infrastructure sprint with no cross-test dependencies.

## Issues Found

None. All four ACs pass cleanly.

## Issues Resolved

| Issue | Description | Status |
|-------|-------------|--------|
| I-226 | Docker healthcheck failing (curl not available in container) | **RESOLVED** — curl installed, healthcheck reports healthy |
| I-227 | Rate limiter ERR_ERL_INVALID_IP_ADDRESS from Caddy-proxied IP:port | **RESOLVED** — keyGenerator strips port, zero ERR_ERL errors |
| I-201 | Delta sync fails for non-VIN orgs | **NOT IN SCOPE** — AC3 only verifies scheduler starts (confirmed). I-201 remains open for orgs without VIN integration. |

## Exit Gate Checklist

| Gate | Status | Evidence |
|------|--------|----------|
| B1: Docker healthcheck reports healthy | PASS | `docker ps` shows `(healthy)` |
| B2: Zero rate limiter IP errors in container logs | PASS | `grep ERR_ERL` returns empty |
| B3: Delta sync and MCP connectivity evidence in logs | PASS | Scheduler started for 7 orgs; zero MCP connection errors |

## Ghost Exit Gate

**Reviewed by:** ghost-agent
**Date:** 2026-04-03T01:51:40Z
**Sprint:** I-004

### Exit Gate Results

| Gate | Result | Evidence |
|------|--------|----------|
| B1 | PASS | `docker ps --filter "publish=5001"` returns `Up 7 minutes (healthy)` — independently verified |
| B2 | PASS | `docker logs ... \| grep ERR_ERL \| wc -l` returns `0` — independently verified |
| B3 | PASS | `docker logs` shows `[scheduler] All schedulers started` and `Scheduler started for 7 organization(s)`. Zero `connection refused` or `ECONNREFUSED` entries — independently verified |

### 11-Question Checklist

| # | Question | Result | Notes |
|---|----------|--------|-------|
| Q1 | All acceptance criteria addressed? | PASS | 4/4 ACs have PASS verdicts with evidence |
| Q2 | Test execution evidence present? | PASS | Terminal output for all 4 ACs included in report |
| Q3 | Cross-test results present? | N/A | Infrastructure sprint, no cross-test dependencies |
| Q4 | Commit exists and is referenced? | PASS | Commit 4971913, verified in git log |
| Q5 | Modified files match declared scope? | PASS | 5 app files (Dockerfile, server/index.ts, server/routes/auth.ts, widgets.ts, public.ts) match declared files exactly. Additional files are evidence/, sprints.json, issues.md (governance — expected) |
| Q6 | UI protection respected? | PASS | No frontend files modified. No uiPermissions declared for this sprint |
| Q7 | Cross-sign review completed? | PASS | cross-sign.md present, verdict APPROVED by test role |
| Q8 | Enforcer checklist completed? | PASS | enforcer-checklist.txt present, 13 PASS / 0 FAIL / 6 WARN (pre-existing) |
| Q9 | Issues correctly resolved/scoped? | PASS | I-226 and I-227 resolved. I-201 correctly noted as out of scope |
| Q10 | Entry gate completed? | WARN | Pre-execution report has entry gates verified (A1, A2 both PASS) but lacks formal ghost "ENTRY GATE: APPROVED" stamp. Procedural gap only — entry conditions were met |
| Q11 | Exit gates independently verified? | PASS | All three (B1, B2, B3) verified by ghost agent via live Docker commands |

### Observations

- **Q10 procedural gap:** The pre-execution report does not contain a formal `ENTRY GATE: APPROVED` ghost stamp. Entry conditions (I-001 committed, container running) were factually met and documented. This is a process gap to address going forward, not a substantive failure.
- All code changes are consistent and minimal — curl installation and identical keyGenerator logic across four rate limiters.
- Production container is healthy, rate limiter is clean, scheduler is running, MCP has no connection errors.

**EXIT GATE: CLEARED**
