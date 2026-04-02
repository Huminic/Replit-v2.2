# I-001 — Production Cutover (Coolify Container + Caddy Repoint)

## 1. Goals

Stand up the production container via Coolify and repoint live.huminic.app to it. After this sprint, production runs in an isolated container with its own process, and dev.huminicdev.com remains on PM2 unchanged. The current production database stays — this sprint changes runtime only, not data.

## 2. Work

| Item | Target | Action |
|------|--------|--------|
| W1 | Dockerfile | Update CMD from `node dist/index.cjs` to `pm2-runtime dist/index.cjs`. Install pm2 in runner stage. |
| W2 | server/seed.ts | Add `SKIP_DEMO_SEED` env var check. When true, skip demo org/user/widget creation. |
| W3 | Docker build | Build image locally, verify container starts and health check passes on a test port. |
| W4 | Coolify | Create project + application via API. Configure fixed `ports_exposes` (e.g. 5001) so port survives redeploys. Set environment variables (production DATABASE_URL, JWT_SECRET, API keys, SKIP_DEMO_SEED=true, MCP_BASE_URL). |
| W5 | Coolify deploy | Deploy container. Verify health check on fixed container port. |
| W5a | MCP connectivity | From inside running container, verify it can reach mcp.huminicdev.com (VIN Solutions, Tavus, etc.). If Docker network blocks it, configure container network mode or add MCP_BASE_URL pointing to host. |
| W6 | Caddy | Sysadmin repoints live.huminic.app from localhost:5000 to Coolify container port. |
| W6a | PM2 .env swap | Immediately after Caddy repoint, update PM2 .env to point at staging DB (or take dev.huminicdev.com offline). This prevents dev.huminicdev.com from being a second unmonitored production endpoint. |
| W7 | Verify | live.huminic.app serves from container. dev.huminicdev.com either offline or on staging DB. VAPI webhook test: confirm inbound call to live.huminic.app reaches the container webhook handler. |

## 3. Acceptance Criteria

| AC | Description |
|----|-------------|
| I-001.AC1 | Dockerfile uses pm2-runtime entrypoint. Docker image builds and container passes /api/health check. |
| I-001.AC2 | SKIP_DEMO_SEED=true prevents demo data creation on fresh boot. |
| I-001.AC3 | Coolify application exists with production env vars configured. |
| I-001.AC4 | Container deployed via Coolify, health check passes on container port. |
| I-001.AC5 | Caddy repointed: live.huminic.app → Coolify container. dev.huminicdev.com → PM2 unchanged. |
| I-001.AC6 | Both domains serve the app but from different processes (verified by different X-Request-ID patterns or process identifiers). |
| I-001.AC7 | All 9 MVP flows verified on live.huminic.app (production container, production DB). |

## 4. Test Plan

| AC | How verified | Expected output | Verified by |
|----|-------------|-----------------|-------------|
| AC1 | `docker build . && docker run -p 5001:5000 --env-file .env.production nexxus && curl localhost:5001/api/health` | `{status: "ok"}` | Ghost |
| AC2 | Start container with SKIP_DEMO_SEED=true, query `SELECT count(*) FROM organizations WHERE name='Serra Honda'` on staging DB | Count = 0 (no demo data) | Ghost |
| AC3 | Coolify API `GET /api/v1/applications` returns nexxus app with env vars set | App exists, DATABASE_URL is production URL | Ghost |
| AC4 | `curl http://localhost:<container-port>/api/health` | 200 OK | Ghost |
| AC5 | `curl -I https://live.huminic.app/api/health` and `curl -I https://dev.huminicdev.com/api/health` | Both 200, different upstream (verified by response timing or request ID) | Ghost |
| AC6 | Compare X-Request-ID headers from both domains over 3 requests | Different UUID patterns (different processes generating them) | Ghost |
| AC7 | Run 13 E2E tests against live.huminic.app + VIN single-record verify per dealer | All pass. VIN leads verified via vin_api_read. | Ghost + operator review |

## 5. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Container won't start (bad Dockerfile, missing env var) | Medium | HIGH — no production | Test locally first (W3) before Coolify deploy. |
| Caddy repoint causes downtime | Low | HIGH — customer-facing | Verify container is healthy BEFORE repoint. PM2 stays running as instant rollback — just repoint Caddy back to 5000. |
| Production DB connection from container fails (network/auth) | Low | HIGH — app won't work | Test connection string from container before repoint. |
| Coolify can't clone repo | Low | MEDIUM — delays sprint | Repo is public (verified). No deploy key needed. |

## 6. Exit Criteria

| Gate | What Ghost checks |
|------|-------------------|
| B1 | live.huminic.app serves production container (not PM2) |
| B2 | dev.huminicdev.com serves PM2 (unchanged) |
| B3 | Production DB is the original Supabase project (not a new one) |
| B4 | All 9 MVP flows pass on production |
| B5 | Rollback path documented and tested (repoint Caddy back to 5000) |

## Issues Addressed
I-200, I-215, I-217, I-220, I-222
