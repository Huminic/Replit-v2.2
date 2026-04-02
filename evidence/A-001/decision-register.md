# A-001 Decision Register

**Sprint:** A-001 — MVP Launch Architecture
**Created:** 2026-04-02

Every architecture decision is recorded here with: (a) decision statement, (b) alternatives considered, (c) rationale, (d) constraints that drove it, (e) status.

---

## D-001: Production Database

**(a) Decision:** The current Supabase database (`lhltgisoqxgpamtssxeb`, `aws-0-us-west-2`) is canonical production. Do not create a new empty production database.

**(b) Alternatives:**
1. Keep current DB as production (chosen)
2. Create fresh Supabase project, migrate schema only, start clean
3. Create fresh project, migrate schema + selective data export

**(c) Rationale:** Customer data (conversations, VIN leads, dealer configs, integrations) is already in this database via live.huminic.app. Creating a new DB means losing that data or building a migration pipeline for a one-time move. The user confirmed data survival concern is minimal but the principle is correct — this IS production.

**(d) Constraints:** User directive: "we stripped out the users and the only data that has to survive so im not actually worried about that part." App is database-agnostic (pure Postgres, no Supabase-specific features).

**(e) Status:** FINAL

---

## D-002: Staging Database

**(a) Decision:** Create a new Supabase project for staging. Apply schema via `drizzle-kit push` (not migration files). Staging DB is a clean instance, not a copy of production.

**(b) Alternatives:**
1. New Supabase project, schema via db:push (chosen)
2. pg_dump production → restore to staging (data copy)
3. Share production DB with read-only staging flag

**(c) Rationale:** Staging needs the correct schema but doesn't need production customer data. Clean DB avoids carrying test orphans and production data into staging. If realistic data is needed later, a controlled one-way sanitized copy from production can be done — but that's a separate operation, not the default.

**(d) Constraints:** Migration files are stale (missing 2 tables, 15+ columns). Must use `drizzle-kit push` against `shared/schema.ts`. Schema source of truth is `shared/schema.ts`, not `migrations/`.

**(e) Status:** FINAL

---

## D-003: Production Runtime

**(a) Decision:** Production runs as a Docker container managed by Coolify. Dockerfile updated to use `pm2-runtime` as entrypoint. Coolify manages container lifecycle (build, deploy, restart, health check).

**(b) Alternatives:**
1. Coolify-managed Docker container with pm2-runtime (chosen)
2. Continue with bare PM2 on host (current state)
3. Docker container without Coolify (manual docker-compose)

**(c) Rationale:** Coolify is already running on the server with working API access. Container provides isolation from the dev PM2 process. pm2-runtime provides process management inside the container. Coolify provides deployment automation, health checks, and the webhook endpoint that GitHub Actions needs.

**(d) Constraints:** Coolify API verified working. Public repo — no deploy key needed. Coolify can clone from GitHub and build with Dockerfile.

**(e) Status:** FINAL

---

## D-004: Staging Runtime

**(a) Decision:** Staging continues as the existing PM2 process on localhost:5000 (`nexxus-app`). dev.huminicdev.com stays pointed at it via Caddy. Its .env is updated to point at the new staging Supabase DB.

**(b) Alternatives:**
1. Keep PM2 process as staging, update .env to staging DB (chosen)
2. Second Coolify container for staging
3. Second PM2 process on a different port

**(c) Rationale:** The PM2 process already exists and works. Making it staging is a .env change, not an infrastructure build. A second Coolify container adds complexity with no immediate benefit. The key change is pointing it at a separate DB so staging and production data are isolated.

**(d) Constraints:** Caddy already routes dev.huminicdev.com to localhost:5000. No change needed.

**(e) Status:** FINAL

---

## D-005: Domain Mapping

**(a) Decision:**
- `live.huminic.app` → Coolify container port (production)
- `dev.huminicdev.com` → localhost:5000 PM2 (staging)

**(b) Alternatives:**
1. live=Coolify container, dev=PM2 (chosen)
2. live=Coolify, dev=second Coolify container
3. Both on Coolify with different containers

**(c) Rationale:** Minimal change. dev.huminicdev.com already points to PM2 and stays there. Only live.huminic.app needs to move to the new container. One Caddy edit, one reload.

**(d) Constraints:** Caddy repoint is manual (no automation exists). Requires sysadmin authority and sudo. Coolify's Traefik is off — Caddy is the only proxy.

**(e) Status:** FINAL

---

## D-006: External Proxy

**(a) Decision:** Caddy remains the sole external reverse proxy. Coolify's Traefik stays off. Caddy routes domains to container ports. Coolify manages container lifecycle only.

**(b) Alternatives:**
1. Caddy only, Traefik stays off (chosen)
2. Start Traefik, let Coolify manage domain routing
3. Replace Caddy with Traefik entirely

**(c) Rationale:** Caddy already routes 20+ domains on this server. Starting Traefik would create a port conflict or require restructuring all domain routing. Caddy works, is stable, and is managed by sysadmin tools. No reason to change.

**(d) Constraints:** Traefik is in "exited" state. Starting it would conflict with Caddy on port 443. All other projects use Caddy.

**(e) Status:** FINAL

---

## D-007: Schema Promotion Model

**(a) Decision:** Schema changes are promoted via `drizzle-kit push` against the target database. `shared/schema.ts` is the single source of truth. Migration SQL files in `migrations/` are historical artifacts, not operational.

**(b) Alternatives:**
1. `drizzle-kit push` from schema.ts (chosen — matches current practice)
2. Switch to sequential migration files (`drizzle-kit generate` + `drizzle-kit migrate`)
3. Raw SQL migration scripts

**(c) Rationale:** The project has always used `db:push`. The migration files are stale (missing 2 tables, 15+ columns). Switching to sequential migrations would require generating a fresh baseline migration from the current schema — possible but unnecessary for MVP launch. Can be revisited post-MVP.

**(d) Constraints:** `db:push` synchronizes the DB to match schema.ts — it WILL drop columns removed from the schema and treats renames as drop+add (data loss). No automatic rollback. Backup before push is mandatory. Requires `DIRECT_URL` (port 5432, no pgbouncer).

**(e) Status:** FINAL — with caveat: post-MVP should evaluate switching to sequential migrations for rollback capability.

---

## D-008: Schema Rollback Strategy

**(a) Decision:** Before any `db:push` to production, take a pg_dump backup. If push breaks something, restore from backup. No automated rollback exists.

**(b) Alternatives:**
1. pg_dump before push, restore if needed (chosen)
2. Generate rollback SQL manually for each schema change
3. Switch to sequential migrations with down-migrations
4. Accept no rollback (risky)

**(c) Rationale:** pg_dump is simple, reliable, and doesn't require changing the project's schema management approach. For MVP launch with a single developer, this is sufficient. Sequential migrations with rollback capability is the right long-term answer but is out of scope for launch.

**(d) Constraints:** `db:push` doesn't generate rollback SQL. Drizzle ORM doesn't support down-migrations natively.

**(e) Status:** FINAL — provisional for post-MVP improvement.

---

## D-009: Data Movement Rules

**(a) Decision:** After launch, production and staging are not synchronized at the data level. Customer/transactional data lives in production only. Staging data is independent. No automatic sync in either direction.

**(b) Alternatives:**
1. No sync, fully isolated (chosen)
2. Nightly prod→staging data copy (sanitized)
3. Shared DB with staging read-only

**(c) Rationale:** Architect recommendation. Staging exists for testing code changes, not for reproducing production data scenarios. If realistic data is needed, a controlled one-way snapshot from production to staging can be done manually — but it is not automatic and not the default.

**(d) Constraints:** VIN Solutions delta sync runs per-environment (each DB has its own sync schedule). Sync configuration is per-org in the database.

**(e) Status:** FINAL

---

## D-010: Configuration Promotion Model

**(a) Decision:** Hybrid model. Core reusable config (org settings, agents, integrations, widgets, VIN dealer config) is entered directly in production with an audit trail. API keys and feature flags are set per-environment in .env files. No scripted promotion between environments for MVP.

**(b) Alternatives:**
1. Hybrid: prod-direct for config, per-env for secrets (chosen)
2. Scripted promotion: staging→prod export/import for all config
3. Config-as-code: all config in repo, deployed with code

**(c) Rationale:** The app has no config export/import tooling. Building scripted promotion is work that doesn't exist yet. For MVP with 5 dealers and 1 operator, direct production config entry with audit trail (activity_log table) is sufficient. Post-MVP can add scripted promotion if the operator count grows.

**(d) Constraints:** Org settings are JSONB in the organizations table. Agent configs, integrations, and widgets are all stored in the database. There is no config file system outside the DB and .env.

**(e) Status:** FINAL — provisional for post-MVP improvement.

---

## D-011: Code Deployment Path

**(a) Decision:** Push to `main` → GitHub Actions builds and tests → Coolify webhook triggers container redeploy. Staging is manual (`git pull && npm run build && pm2 restart`). Production deploys are automated via CI/CD.

**(b) Alternatives:**
1. CI/CD to production, manual to staging (chosen)
2. CI/CD to both (staging auto-deploy on push to dev branch, production on main)
3. Manual deploy to both

**(c) Rationale:** Staging is the existing PM2 process — manual deploy is the current workflow and works fine. Production needs automation because it's containerized and managed by Coolify. GitHub Actions already has the build+test pipeline — it just needs valid Coolify webhook secrets.

**(d) Constraints:** GitHub Actions has zero secrets configured. Must set COOLIFY_WEBHOOK_URL, COOLIFY_API_TOKEN, and APP_BASE_URL. deploy.yml already references these.

**(e) Status:** FINAL

---

## D-012: Staging Safety Guardrails

**(a) Decision:** Staging has outbound messaging disabled by default (`OUTBOUND_LIVE_ENABLED=false` in staging .env). VIN lead creation uses the same 555-guard and transcript-required guard as production. No additional guardrails needed for MVP.

**(b) Alternatives:**
1. OUTBOUND_LIVE_ENABLED=false in staging (chosen)
2. Separate CommGate flag per environment
3. Full allowlist system for staging integrations

**(c) Rationale:** The existing CommGate (`outboundEnabled` per org) and the env-level `OUTBOUND_LIVE_ENABLED` flag together prevent staging from sending real SMS/email. VIN guards (555-reject, transcript-required) prevent test leads from reaching VIN Solutions. These guards already exist in code from T-010a.

**(d) Constraints:** VAPI webhook URLs point to live.huminic.app — after repoint, webhooks hit production. Staging would only receive webhooks if explicitly configured with a staging URL in VAPI. This means staging won't process real calls unless VAPI is reconfigured.

**(e) Status:** FINAL

---

## D-013: GitHub Repo Visibility

**(a) Decision:** Repo is public. No deploy key or GitHub App needed for Coolify to clone and build.

**(b) Alternatives:** N/A — this is a fact, not a choice.

**(c) Rationale:** `gh repo view Huminic/Replit-v2.2 --json isPrivate` returns `false`.

**(d) Constraints:** If repo goes private in the future, Coolify will need a deploy key or GitHub App configured.

**(e) Status:** FINAL (fact-based)
