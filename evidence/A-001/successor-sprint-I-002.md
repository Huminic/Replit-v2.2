# I-002 — Staging Isolation + CI/CD Pipeline

## 1. Goals

Create a real staging environment by pointing the existing PM2 process at a new staging database. Wire up GitHub Actions to deploy production via Coolify webhook. After this sprint, staging is isolated (separate DB, outbound disabled) and production has an automated deploy pipeline.

## 2. Work

| Item | Target | Action |
|------|--------|--------|
| W1 | Supabase | Create new Supabase project for staging via management API. |
| W2 | Schema | Run `drizzle-kit push` against staging DB (using DIRECT_URL). Verify schema matches production. |
| W3 | PM2 .env | Update nexxus .env: DATABASE_URL → staging Supabase, OUTBOUND_LIVE_ENABLED=false, SKIP_DEMO_SEED=false (staging gets demo data for testing). |
| W4 | PM2 restart | Restart PM2 process. Verify dev.huminicdev.com serves from staging DB (empty or seed data, not production customer data). |
| W5 | GitHub Secrets | Set COOLIFY_WEBHOOK_URL, COOLIFY_API_TOKEN, APP_BASE_URL via `gh secret set`. |
| W6 | Deploy test | Push a trivial commit to main. Verify GitHub Actions runs, webhook fires, Coolify redeploys container. |
| W7 | deploy.yml | Fix the silent failure pattern (`|| echo "webhook sent"`) — fail the job if webhook returns non-200. |

## 3. Acceptance Criteria

| AC | Description |
|----|-------------|
| I-002.AC1 | New Supabase project exists for staging. Schema applied via db:push. |
| I-002.AC2 | dev.huminicdev.com serves from staging DB. Conversation count differs from production (proving DB isolation). |
| I-002.AC3 | Staging has OUTBOUND_LIVE_ENABLED=false. SMS/email cannot be sent from staging. |
| I-002.AC4 | GitHub Secrets configured: COOLIFY_WEBHOOK_URL, COOLIFY_API_TOKEN, APP_BASE_URL. |
| I-002.AC5 | Push to main triggers GitHub Actions → Coolify webhook → container redeploy. End-to-end verified. |
| I-002.AC6 | deploy.yml fails (non-zero exit) if webhook returns non-200 (no silent swallowing). |

## 4. Test Plan

| AC | How verified | Expected output | Verified by |
|----|-------------|-----------------|-------------|
| AC1 | Supabase management API list projects shows new project. `SELECT count(*) FROM organizations` on staging returns seed data count (not production count). | New project visible. Row counts differ from production. | Ghost |
| AC2 | `curl https://dev.huminicdev.com/api/conversations?limit=1` returns empty or seed data (not production conversations). Compare with `curl https://live.huminic.app/api/conversations?limit=1`. | Different data. | Ghost |
| AC3 | From staging: attempt to create and execute a campaign. Verify sentCount=0 and CommGate blocks. | sentCount=0, CommGate log message. | Ghost |
| AC4 | `gh secret list -R Huminic/Replit-v2.2` shows 3 secrets. | COOLIFY_WEBHOOK_URL, COOLIFY_API_TOKEN, APP_BASE_URL listed. | Ghost |
| AC5 | Push commit → check GitHub Actions run → check Coolify deployment log → verify container restarted (uptime reset). | Actions passes, Coolify shows new deployment, container uptime < 5 min. | Ghost |
| AC6 | Read deploy.yml — the webhook step must not have `|| echo` or `continue-on-error`. | Strict failure on non-200. | Ghost reads file |

## 5. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Supabase project creation fails | Low | HIGH — no staging DB | Management API verified working in W1. Fallback: npx supabase CLI. |
| db:push to staging fails (schema drift) | Low | MEDIUM — staging has wrong schema | schema.ts is source of truth, push is deterministic. If it fails, inspect error and fix schema. |
| PM2 restart with new .env breaks dev site | Low | LOW — dev is staging now, not customer-facing | Keep old .env as .env.backup. Revert if needed. |
| GitHub Actions webhook URL wrong | Medium | LOW — manual deploy still works | Test webhook round-trip explicitly in W6. |

## 6. Exit Criteria

| Gate | What Ghost checks |
|------|-------------------|
| B1 | Staging DB is separate from production DB (different project refs, different data) |
| B2 | Staging outbound is disabled |
| B3 | CI/CD pipeline works end-to-end (push → build → webhook → redeploy) |
| B4 | deploy.yml has no silent failure patterns |

## Issues Addressed
I-216, I-218, I-219
