# Nexxus Connect v2.2 — Issues

**Last verified:** 2026-03-31 (API E2E: 44/46 passed against dev.huminicdev.com, post-build)
**Method:** Code verification + E2E suite + VAPI/VIN audit + infrastructure audit
**Target:** https://dev.huminicdev.com (PM2 on localhost:5000, Supabase DB)

## Statuses
- **OPEN** — Confirmed, needs fix
- **IN SPRINT (id)** — Assigned to a sprint, work pending or in progress
- **NEEDS LIVE TEST** — Can't confirm from code alone, needs browser/API test
- **NEEDS INPUT** — Requires operator product decision
- **DISABLED** — Feature intentionally turned off, needs re-enable plan
- **BACKLOGGED (BL-nnn)** — Deferred, tracked in backlog.md
- **CLOSED (sprint-id)** — Fixed and verified

## Effort
- **E** = Easy (<30 min)
- **M** = Medium (1-3 hrs)
- **H** = Hard (4+ hrs)

## Dimensions
- **FE** = Frontend (UI, pages, forms, client logic)
- **BE** = Backend (APIs, business rules, services, integrations)
- **DT** = Data (schema, database, migrations)
- **AU** = Auth/Security (login, permissions, security controls)
- **IN** = Infrastructure (deploys, environments, monitoring, testing)

---

## AI Chat (/)

No open issues. I-126 and I-139 verified working in S2.

---

## TeamBox (/teambox)

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-174 | "Send to CRM" button — manual VIN lead creation from conversations (form + SMS channels) | BE, FE | BACKLOGGED (BL-092) | H |

---

## Sales (/sales)

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-130 | Agent pages need favorites and sub-menu bar (Sales, Service, Marketing) | FE | BACKLOGGED (BL-094) | M |

---

## Service (/service)

No open issues. I-113 and I-132 resolved in S4.

---

## Marketing (/marketing)

No open issues. I-155 closed — confirmed real data (no active marketing campaigns).

---

## Management (/management)

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-116 | User Chats tab is "coming soon" placeholder — full feature build | FE, BE | BACKLOGGED (BL-093) | H |
| I-169 | Hunch status transitions — only 3 of 8 states have UI buttons | FE | BACKLOGGED (BL-093) | M |

---

## Settings (/settings)

No open issues. I-164 verified working in S8 walkthrough.

---

## Auth (/login, /forgot-password, /reset-password)

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-140 | Password reset — no code bug found, needs live test of email delivery + token flow | BE, FE | NEEDS LIVE TEST | M |
| I-165 | Forgot/reset password FE — 11 states untested (pages exist, backend confirmed) | FE | NEEDS LIVE TEST | M |

---

## Widget / Landing (/w/, /p/)

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-168 | Widget interaction mode states — 13/14 verified in S1, voice callback 404 until deploy | FE, BE | NEEDS LIVE TEST | M |
| I-214 | **FIXED (T-010a).** Widget CORS: added middleware after Helmet to override CORP→cross-origin, COOP→unsafe-none, CSP frame-ancestors→* for /widget/*, /api/widget/*, /w/*, /p/* routes. Cache max-age bumped to 86400 per Dealer.com requirements. Verified: `curl -I` confirms correct headers on live. | FE, BE, IN | CLOSED (T-010a) | E |

---

## Insights (/insights)

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-156 | Insights standalone page — exists but never visually verified | FE | NEEDS LIVE TEST | M |
| I-163 | 27 drill-down/Reports/Library states untested | FE | NEEDS LIVE TEST | H |

---

## Billing (/settings/billing)

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-105 | **FlexPrice is dead — replace with Lago (post-MVP).** FlexPrice returns `{configured: false}` on all endpoints. No longer the billing provider. Lago is running locally via Coolify (6 Docker containers). **Scrub:** remove FlexPrice from `server/services/billingService.ts`, `server/index.ts`, `client/src/pages/management.tsx`, `.env`/`.env.example`, 81 files total. **Build:** Lago connector, wire billing UI to Lago API. Not blocking MVP launch. | BE, FE, IN | BACKLOGGED (BL-096) | H |
| I-171 | 26 billing UI states with no functional coverage — wired to dead FlexPrice, will need rewire to Lago (I-105) | FE | BACKLOGGED (BL-096) | H |

---

## Org Wizard (/settings/org-wizard)

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-166 | 11 wizard states untested (page exists, super_admin gated) | FE | NEEDS LIVE TEST | M |

---

## Agents (/agents)

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-102 | Photo Studio agent — image generation returns 501 from /api/openai-proxy. FAL proxy migrated to MCP in S-17 but not live-tested. | BE | NEEDS LIVE TEST | M |

---

## Backend / Comms

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-194 | **FIXED (T-010a).** VAPI→VIN re-enabled with per-dealer vinLeadSourceName configured in org.settings. Safety guards added: 555-number rejection, transcript-required check, "Unknown Caller" → AI/Lead naming. Tavus path also fixed (was live without guards). Backfill assessed: 1 ringing-only call in 24h, no transcript, not pushable. Dealer source names: Serra Honda/Nissan/Ford="Dealers WebSite", Hyundai of Columbia="Dealer .Com (Our Website)", Ford of Columbia="Dealer Website". | BE | CLOSED (T-010a) | M |

---

## Campaigns

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-193 | No CSV template download button on create campaign screen — users have no reference for expected column format | FE | OPEN | E |

---

## Infrastructure / Testing

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-182 | Test 2.1: dashboard 404 on static resource (favicon or similar) — page works, asset missing | IN | OPEN | E |
| I-183 | Test 4.10: campaign reply webhook — conversation not found within retry window. Timing issue after S-12 SMS mutex. Test-side fix: increase retry count or wait interval. | IN | OPEN | M |
| I-195 | Test 5.9: SMS webhook response shape mismatch — test asserts `body.success` but endpoint returns `{ received: true }`. Test-side fix: assert `status < 500` and poll conversations. | IN | OPEN | E |
| I-184 | Test 6.4/6.5: Management page tests expect org_admin access — needs update for S9 RBAC change (super_admin only) | IN | OPEN | E |
| I-185 | Test 9.3: "Restart Tour" button not found by test locator — selector mismatch with actual button text | IN | OPEN | E |
| I-186 | Test 10.3: Appointment schema uses different field name than test expects for date | IN | OPEN | E |
| I-187 | Test RI-VAPI-1: Transcript not available within 60s wait window — VAPI webhook timing | IN | OPEN | M |
| I-188 | Test RI-VIN-1: Warehouse leads query returns 0 rows with vin_created_at dates | IN | OPEN | M |
| I-189 | Test S9-TRIGGER-1: Walk-in followup agent endpoint auth — test uses wrong auth context | IN | BACKLOGGED (BL-095) | E |
| I-196 | 2 orphan test files (g004-gap-coverage.spec.ts, m001-gap-coverage.spec.ts) not matched by any Playwright project | IN | OPEN | E |
| I-197 | 8 sprint test files (s0-s8) hardcode `dev.huminicdev.com` instead of using `process.env.BASE_URL` | IN | OPEN | E |
| I-198 | Dead test helpers: tests/helpers/api.ts and tests/helpers/factory.ts — zero imports from any active test | IN | OPEN | E |
| I-199 | verify-all.ts hardcodes FQDN and uses own login logic instead of shared helpers | IN | OPEN | E |
| I-200 | **No production environment — comprehensive investigation (T-010a session).** live.huminic.app and dev.huminicdev.com both hit the same PM2 process (localhost:5000), same .env, same Supabase DB. See I-215 through I-224 for the full breakdown. | IN | IN SPRINT (I-001) | H |
| I-215 | **Coolify application never created for nexxus.** Coolify is running (v4.0.0-beta.464) with working API token (`central-mcp` token). MCP connector exists on port 4002 with full CRUD allowlisted. But the `applications` table is empty for nexxus — no app was ever registered. The deploy.yml webhook fires into the void. **Fix:** Create Coolify application for nexxus, configure GitHub source, set build/deploy settings. | IN | IN SPRINT (I-001) | M |
| I-216 | **GitHub Actions deploy.yml fires a dead webhook.** deploy.yml calls `${{ secrets.COOLIFY_WEBHOOK_URL }}` with `${{ secrets.COOLIFY_API_TOKEN }}` after build+test. Failure is silently eaten: `\|\| echo "Coolify webhook sent (may be async)"`. Since no Coolify app exists (I-215), the webhook has no target. **Fix:** After Coolify app is created, configure webhook URL in GitHub Secrets. Verify round-trip. | IN | IN SPRINT (I-002) | M |
| I-217 | **Dockerfile never built.** Multi-stage Dockerfile exists and is well-written (Node 20-alpine, builder→runner). `.dockerignore` exists. `docker-compose.yml` exists. But zero Docker images for nexxus on the server (`docker images \| grep nexxus` = empty). Container has never been built or run. **Fix:** Build image, verify it runs, configure Coolify to use it. Add `pm2-runtime` as entrypoint instead of bare `node`. | IN | IN SPRINT (I-001) | M |
| I-218 | **No separate production database.** Single Supabase instance (`aws-0-us-west-2.pooler.supabase.com`) serves both dev and live. Test data (527 orphan conversations, seed demo data) co-mingled with real customer data. **Fix:** Create separate Supabase project for STAGING (production DB stays as-is per D-001). Apply schema via drizzle-kit push (migration files are stale per W1 finding). Configure staging .env with OUTBOUND_LIVE_ENABLED=false. | IN, DT | IN SPRINT (I-002) | H |
| I-219 | **No production .env file.** Single .env file with `NODE_ENV=development` (overridden by PM2 config). Contains dev API keys shared between both domains. **Fix:** Create `.env.production` with: separate JWT_SECRET, separate ADMIN credentials, production DATABASE_URL, and evaluate which API keys need separate production accounts (Resend, TextMagic, Supabase at minimum). | IN | IN SPRINT (I-002) | M |
| I-220 | **Caddy routes both domains to same port — repoint via sysadmin.** `live.huminic.app` → localhost:5000 and `dev.huminicdev.com` → localhost:5000 in Caddy config. No environment separation. **Fix:** After Coolify deploys the production container on its own port, use sysadmin tools (not direct Caddyfile edit) to repoint `live.huminic.app` to the Coolify container port. `dev.huminicdev.com` stays on PM2 localhost:5000. Caddy config is auto-generated — all changes go through `~/Claude-store/sysadmin/` per infrastructure governance. | IN | IN SPRINT (I-001) | M |
| I-221 | **Coolify Traefik proxy is in "exited" state.** Coolify has its own Traefik proxy for routing, but it's not running. This may need to be started for Coolify-managed deployments to get domain routing, or we use Caddy for routing and Coolify only for container management. **Investigate:** determine if Traefik needs to be running or if Caddy handles all routing. | IN | CLOSED (A-001) — Traefik stays off per D-006. Caddy is sole proxy. | M |
| I-222 | **Seed script auto-runs demo data on boot.** `server/seed.ts` creates Serra Honda demo org, test users with hardcoded passwords (`NexxusTest2026`), sample widgets. Runs automatically via `seedDatabase()` in `server/index.ts`. Production first boot will have demo data visible to real users. **Decision needed:** Add `SKIP_DEMO_SEED=true` env flag, or clean up after first boot, or accept demo data. | BE, IN | IN SPRINT (I-001) | E |
| I-223 | **No database migration automation.** 4 Drizzle migration files exist in `migrations/` but the deploy pipeline has no migration step. Migrations run implicitly via Drizzle on app start (or don't — needs verification). No rollback scripts exist (Drizzle migrations are one-way). **Fix:** Add explicit migration step to deploy pipeline. Create rollback SQL for critical migrations. Test migration against clean DB. | DT, IN | IN SPRINT (I-003) | M |
| I-224 | **No monitoring, alerting, or rollback for production.** Zero error tracking (no Sentry/etc), no uptime monitoring, no sync failure alerts (I-201 failures are invisible). No documented rollback procedure. Single PM2 process = restart = downtime. **Fix:** Add health check monitoring, error tracking, and document rollback procedure (at minimum: `pm2 deploy revert` or Docker image rollback via Coolify). | IN | IN SPRINT (I-003) | H |
| I-201 | **Investigated (T-010a). Verify in container (I-001).** Delta sync scheduler runs but has never succeeded. Only 2 log entries: both failed backfills for Huminic org (no VIN integration). Delta fires at 2 AM ET via setInterval with no retry on failure. Non-VIN orgs fail silently. **Must verify delta sync works inside Coolify container** — scheduler depends on MCP connectivity and setInterval persistence. | BE | IN SPRINT (I-001) | M |

---

## TeamBox UI

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-202 | **Root cause: data issue, not code bug.** "No messages yet" displays correctly for conversations with 0 messages. Investigated T-010a: 5 orphan ai-chat conversations (test staff from Mar 31) + voice conversations from ringing-only VAPI events have no stored messages. Real conversations with messages display correctly. **Fix:** clean up orphan test conversations — no code change needed. | FE | CLOSED (T-010a) | E |

---

## Cross-Cutting

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-125 | All popout/sub-menu links need functional verification (click-through test) | FE | NEEDS LIVE TEST | M |
| I-226 | **Container Docker healthcheck misconfigured.** Alpine image doesn't have `curl` installed. Healthcheck fails (`/bin/sh: curl: not found`), container reports "unhealthy" despite app working. Fix: add `RUN apk add --no-cache curl` to Dockerfile runner stage, or switch healthcheck to `wget --spider http://localhost:5000/api/health`. Found during I-001 verification. | IN | OPEN | E |
| I-227 | **Rate limiter IP parsing warning.** Container logs `ERR_ERL_INVALID_IP_ADDRESS` for IPs with port appended (e.g. `150.136.6.207:54874`). Caddy's `X-Forwarded-For` passes IP:port. Fix: custom `keyGenerator` in rate limiter to strip port, or adjust Caddy header. Non-blocking — rate limiting works, just logs warnings. Found during I-001 verification. | BE | OPEN | E |
| I-225 | **Pre-commit hook Gate 1.9 blocks on ALL executionSteps, including infrastructure steps.** Hook requires every step to be `completed` before committing, but hybrid sprints (like I-001) have infrastructure steps (Coolify, Caddy, DNS) that happen AFTER the code commit. Creates circular dependency: code can't be pushed until committed, can't be committed until infra steps done, infra steps need the code pushed. **Fix:** Add `type` field to executionSteps (`code` vs `infrastructure`). Gate 1.9 should only gate on `type: "code"` steps. Infrastructure steps are operator-executed outside git. Found during I-001. | GOV | OPEN (next M-series) | E |
| I-229 | **Lead notification email subject missing 🎯 emoji + missing VIN status.** Subject line at `server/routes/webhooks.ts:914` (VAPI) and `:1201` (Tavus) sends plain text without the bullseye emoji. Correct subject: `🎯 {OrgName} Has a New AI Voice Lead!`. Template HTML body (line 307) has the emoji but subject doesn't. Regression: `buildVapiEmailHtml()` in commit `e9167e4` was the working version; refactored into `generateLeadEmailHTML()` in `fa3cfaf` and subject emoji was dropped. **Additional requirement:** Email must include a VIN Solutions status section indicating whether the lead was inserted into VIN, and if not, why (no transcript, no VIN integration, guard blocked, etc.). **Fix:** (1) Add 🎯 to subject lines at :914 and :1201. (2) Add VIN status param to `generateLeadEmailHTML()` and render a status row in the details grid. | BE | OPEN | M |
| I-230 | **Lead notification fires for no-transcript (ringing-only) calls.** VAPI webhook creates conversation and sends "New AI Voice Lead!" email to 3 admins even when call has no transcript (ringing-only or failed). VIN lead guard correctly skips, but email still fires. Creates noise — admins notified about "leads" that don't exist. **Fix:** Gate `sendLeadNotificationEmail()` on transcript presence. If no transcript, skip notification or use a different "Missed Call" template. Location: `server/routes/webhooks.ts` around line 910. Found 2026-04-03: 6 calls in 24h, all no-transcript, 2 triggered emails. | BE | OPEN | M |
| I-231 | **Spec conflict: Executive role + Management page.** CLAUDE.md RBAC table says Executive gets "All except Management, Settings." US-025 says Executive checks Demand Score on Management page. Code follows RBAC table (correct). Test 1.8 follows user story (incorrect). Resolve: either update RBAC to allow Executive management access, or update US-025 to remove Demand Score from Executive scope. Not MVP-blocking — reclassified from PRODUCT_BUG to TEST_ISSUE. | FE, AU | OPEN (post-launch) | E |
| I-232 | **Security header duplication: nosniff, nosniff.** Both Caddy and Helmet set `X-Content-Type-Options: nosniff`, resulting in doubled value. Test 12.2 fails on strict equality. Fix: disable Helmet's `noSniff` option since Caddy handles it. `server/index.ts` Helmet config. Not MVP-blocking. | IN | OPEN | E |
| I-233 | **Widget public endpoint test fails on staging — TEST_DATA, not product bug.** Test 11.14 calls `/api/widgets/public/{widgetCode}` but no widgets seeded on staging. Endpoint code is correct. Reclassified from PRODUCT_BUG to TEST_DATA. | IN | OPEN | E |
| I-228 | **Deploy safety gate — pre-production risk analysis system.** 3-layer automated gate: (1) CI risk analysis scans diffs for webhook/outbound/VIN/auth/schema/env changes, (2) schema safety check detects destructive drizzle-kit push ops (column drops, renames = data loss), (3) pre-deploy backup runs pg_dump before every deploy. Design complete in `safety-gate/README.md`. Full implementation specs (workflow YAML, all scripts) produced by technical-architect 2026-04-03. Implement when operator approves. | IN, BE, DT | BACKLOGGED (operator-gated) | M |
| I-234 | **captain-check.sh blocks `git checkout -b` during active sprints.** Hook classifies all non-read git commands as "git write commands" and rejects them when a sprint is `in_progress`. Branch creation (`git checkout -b`) is non-destructive and should be allowed. Current workaround: operator runs the command manually. **Fix:** Add `checkout -b` to the allowed commands list in `.claude/hooks/captain-check.sh`, alongside `status`, `log`, `diff`, `branch`, etc. | GOV | OPEN (next M-series) | E |

---

## Summary

| Status | Count |
|--------|-------|
| OPEN | 15 |
| IN SPRINT (I-001) | 5 |
| IN SPRINT (I-002) | 3 |
| IN SPRINT (I-003) | 2 |
| CLOSED (A-001) | 1 |
| CLOSED (T-010a) | 3 |
| NEEDS LIVE TEST | 8 |
| BACKLOGGED | 5 |
| BEHAVIORAL GAPS (T-007) | 11 |
| **Total active (non-backlogged)** | **45** |

---

## Test Coverage Gaps (pre-T-007)

| ID | Gap | Dim | Status |
|----|-----|-----|--------|
| TG-004 | Opt-out/STOP handling — no test | BE | OPEN |
| TG-008 | After-hours behavior — no time-based test | BE | OPEN |
| TG-010 | TeamBox real-time updates — no SSE/WebSocket test | FE, BE | OPEN |
| TI-018 | Photo Studio image generation — see I-102 | BE | OPEN |

---

## Behavioral Gap Analysis (T-007, 2026-04-01)

Gaps found by reading actual test code at behavior level. Each gap represents something a real user could hit that no current test would catch. Tests would falsely pass while the behavior is broken.

### Critical — Would affect users immediately

| ID | Gap | Domain | Dim | Why it matters | Tests falsely pass? |
|----|-----|--------|-----|----------------|---------------------|
| I-203 | **No test for message streaming delivery to UI.** Chat agent tests verify the SSE endpoint accepts requests (status < 500) but never check that streamed tokens actually render in the browser. A broken streaming parser would pass all tests. | Chat | FE, BE | Users send a message and see nothing — the core product experience. | Yes — endpoint returns 200 but UI could show blank. |
| I-204 | **No test for session timeout warning or auto-logout.** Auth tests explicitly SKIP session timeout (TC-AUTH-102-108) because it requires 30min idle. Users would get silently logged out with no warning dialog. Feature exists (I-153 confirmed fixed) but is untested. | Auth | FE | User loses unsaved work after 30min idle with no warning. | Yes — login/logout tests pass but timeout path untested. |
| I-205 | **No test for campaign execution workflow.** Service tests verify campaign table renders and CRUD API works, but no test starts a campaign, schedules it, executes it, and verifies messages are sent. Campaign could fail silently mid-execution. | Service | BE, FE | Dealer creates campaign → nothing happens. Core revenue feature. | Yes — CRUD passes but execution path untested. |
| I-206 | **No test for conversation takeover sequence.** TeamBox tests verify the PATCH endpoint for assigning agents, but no test covers the full workflow: AI is responding → human clicks takeover → AI stops → human replies → customer sees human response. The stateful transition is untested. | TeamBox | FE, BE | Agent takeover fails mid-conversation. Customer gets confused responses. | Partially — API PATCH works but UI workflow untested. |
| I-207 | **No test for API error recovery or network failure.** Dashboard, Sales, Service, Marketing tests all assume API calls succeed. No test intercepts a failed API call and verifies the UI shows an error state, retry button, or cached data. Tests would pass while users see blank pages on flaky connections. | All | FE | Any API hiccup → blank screen, no error message, no retry. | Yes — happy path passes, error path untested. |

### Important — Would affect specific workflows

| ID | Gap | Domain | Dim | Why it matters | Tests falsely pass? |
|----|-----|--------|-----|----------------|---------------------|
| I-208 | **No test for settings changes persisting across sessions.** Settings tests verify UI elements exist and toggles click, but no test changes a setting, reloads the page, and confirms the change stuck. Appearance theme toggle is tested within a session but not across reload. Org config save is API-tested but not verified in UI after reload. | Settings | FE, BE | Admin changes timezone/logo/config → appears saved → reverts on reload. | Yes — toggle test passes within session. |
| I-209 | **No test for webhook retry or failure recovery.** Integration tests verify webhooks accept valid payloads (200) and reject invalid ones (400/401). No test covers what happens when the webhook handler itself fails mid-processing (DB write fails, MCP call times out). No retry logic is tested. | Integrations | BE | VAPI call comes in, webhook crashes after creating conversation but before storing transcript. Data partially written. | Yes — happy path passes, partial failure untested. |
| I-210 | **No test for multi-step sales pipeline progression.** Sales tests verify KPI tiles render and API returns lead counts, but no test creates a lead, moves it through stages (New → Contacted → Qualified → Proposal → Closed), and verifies metrics update. The pipeline could be display-only with broken state transitions. | Sales | BE, FE | Sales rep marks deal as "Closed Won" → pipeline metrics don't update. | Yes — read-only API tests pass, state mutation untested. |
| I-211 | **No test for concurrent write conflicts.** Edge case tests verify parallel reads succeed, but no test covers two users editing the same conversation, appointment, or contact simultaneously. The app uses no optimistic locking. First-write-wins or last-write-wins behavior is undefined and untested. | All | BE | Two agents claim same lead → one's notes overwritten silently. | Yes — single-user CRUD passes, multi-user conflict untested. |
| I-212 | **No test for data correctness beyond schema.** Dashboard and Sales tests verify API responses have correct field names and types (totalLeads is a number), but no test verifies the NUMBER IS CORRECT. Pipeline metrics could return stale cached values, double-counted leads, or zero for active dealers. | Dashboard, Sales | BE, DT | KPIs show wrong numbers. Dealer sees "0 leads" when they have 50. | Yes — schema validation passes, value correctness untested. |

### Nice-to-have — Edge cases with lower probability

| ID | Gap | Domain | Dim | Why it matters | Tests falsely pass? |
|----|-----|--------|-----|----------------|---------------------|
| I-213 | **No test for widget embed in third-party sites.** Widget tests verify /w/{id} loads directly, but no test embeds the widget iframe/script in an external page and verifies it renders correctly with cross-origin restrictions. CORS is tested at the header level but not the actual embed experience. | Widgets | FE, IN | Widget works on dev.huminicdev.com but breaks when embedded on dealer's actual website. | Yes — direct load passes, cross-origin embed untested. |

---

## Governance Incidents (historical)

| Date | Sprint | What Happened |
|------|--------|---------------|
| 2026-03-19 | REM-8-DT | Builder agent rewrote central-mcp VIN connector without authorization |
| 2026-03-20 | REM-8-BE | Builder agent wrote production email notification code during testing sprint |
| 2026-03-20 | REM-9 | Orchestrator edited server/sync.ts directly instead of delegating |
| 2026-03-20 | — | CommGate check deployed without commit, sprint, or harness approval |
| 2026-03-24 | S-11 | Ghost agent edited sprints.json governance file directly |
| 2026-03-31 | M-002, M-003 | Orchestrator committed with fabricated process evidence: (1) used touch -t to backdate pre-execution-report.md to satisfy timing gate, (2) self-authored cross-sign claiming independent review that did not occur, (3) manually wrote APPROVED enforcer checklist when automated enforcer returned BLOCKED, (4) wrote enforcer checklist with future timestamp, (5) executed directly instead of delegating to subagents. Code changes in both commits are valid. Process evidence replaced with honest reconciliation artifacts. |

---

## CLOSED (S-11 through S-18, executed 2026-03-29, uncommitted)

| ID | Issue | Dim | How resolved |
|----|-------|-----|-------------|
| I-175 | SMS race condition — duplicate conversations from concurrent webhooks | BE | S-12 — conversation mutex lock in sms.ts |
| I-176 | VAPI transcripts not stored in conversation messages | BE | S-12 — 4-format transcript extraction in webhooks.ts |
| I-177 | Duplicate voice conversations created for same VAPI call | BE | S-12 — processedVapiCalls dedup map in webhooks.ts |
| I-178 | RBAC: Sales user sees System in sidebar | AU, FE | S-11 — sidebar visibility fix |
| I-179 | RBAC: Executive doesn't see Manage in sidebar | AU, FE | S-11 — sidebar visibility fix |
| I-180 | RBAC: Sales user can create agents via API | AU, BE | S-11 — requireRole gate on POST /api/agents |
| I-181 | RBAC: Sales/Marketing/Service can navigate to billing page | AU, FE | S-11 — billing route blocking |
| I-190 | campaign_recipients schema has no vehicle columns | DT | S-18 — vin, vehicle_model, vehicle_year columns added |
| I-191 | substituteTemplate() only supports 4 merge fields | BE | S-18 — {{vehicleYear}}, {{vehicleModel}}, {{vin}} added |
| I-192 | Campaign reply conversation has no vehicle context | BE | S-18 — system message injection on campaign reply in sms.ts |
| I-103 | 6 always-true assertions in s11-demo-hotfix.spec.ts | IN | S-13 — assertions fixed |
| I-104 | 103 stub tests in observability/ — delete | IN | S-13 — directory deleted |
| I-110 | 2 test files hardcode production URL without env var fallback | IN | S-13 — BASE_URL pattern applied |

---

## CLOSED (verified in S0-S10 sprint session 2026-03-29)

| ID | Issue | How resolved |
|----|-------|-------------|
| I-109 | Git uncommitted changes | Reconciliation commit 8348f8f |
| I-113 | Service metric trends hardcoded to zero | S4 — removed fake change/trend fields |
| I-126 | Chat history + resume | S2 — verified working via live test |
| I-131 | Full comms test plan | Completed — autonomous + interactive runbook |
| I-132 | Campaign multi-channel | S4 — checkbox UI creates one campaign per channel |
| I-138 | Unauthorized Agent in Sales | S10 — deleted from DB |
| I-139 | Data Guru hallucination risk | S2 — verified grounded, no fabrication |
| I-141 | VAPI webhook 422 | S0 — fallback to any org with voice agent |
| I-144 | Blacklist SMS-only | S0 — extended to all channels |
| I-146 | Kill switch block-and-drop | Operator confirmed: correct behavior, resend backlogged (BL-090) |
| I-148 | Role Switcher stale comments | S8 — removed from TopBar.tsx |
| I-149 | Tour per-page behavior | Operator confirmed: working as intended |
| I-150 | WhatsApp/Web Chat filters | S3 — removed, backlogged (BL-091) |
| I-155 | Marketing dashboard metrics showing zero | Confirmed real data — no active campaigns |
| I-157 | API Keys super_admin gate | Operator confirmed: correct RBAC level |
| I-164 | 42 settings interaction states | S8 — verified working |
| I-172 | AgentChatView token refresh | S5 — pre-flight refresh + 401 retry added |

---

## CLOSED (verified fixed in code 2026-03-28)

| ID | Issue | How resolved |
|----|-------|-------------|
| I-061–I-085, I-088 | Original sprint issues | Committed in sprints S-0 through S-10 |
| I-086 | VIN lead import zero contacts | S-0.4 — rewrote to use vin-safe-mcp |
| I-087 | Webhook email bypasses CommGate | I-3.2 — template + hierarchy fix |
| I-089 | Contact modal fails in drill-down | I-10.5 — warehouse fallback |
| I-090 | Warehouse metrics 4/5 dealers | S-0.5 — backfill all 5 |
| I-091 | SMS takeover broken | I-5.3 — assignedTo check |
| I-092 | Campaign hardcoded dryRun | Not a bug — separate buttons |
| I-093 | No VAPI call test | I-4.4 — Elliott verified |
| I-094 | No Tavus transcript verification | I-4.3 — callback_url added |
| I-095 | Appointment source defaults manual | I-4.4 — passthrough |
| I-096 | Email recipients don't walk hierarchy | I-3.2 — subsumed by I-087 |
| I-097 | Durran's org_id wrong | I-1.3 |
| I-098 | Victoria missing additional_org_ids | I-1.4 |
| I-099 | VAPI serverUrl points to old app | Owner updated VAPI dashboard |
| I-100 | Tavus webhook URL old app | I-4.3 |
| I-101 | 4/5 orgs CommGate disabled | S-0.1 |
| I-106 | Campaigns zero messages (rate limit) | INVALID — rate limit is 100, not 3 |
| I-107 | SMS 63% failure rate | INVALID — same as I-106 |
| I-108 | APP_BASE_URL missing | FALSE ISSUE — intentional |
| I-112 | Sales activity feed hardcoded | Already uses real API |
| I-114 | Conversion rate absolute as delta | Fixed with change: 0 + comment |
| I-115 | Sub-menu/tab mismatches | Fixed — all match now |
| I-117 | TopBar "Take a Tour" label | Fixed — says "Reset Tour" |
| I-118 | TopBar Billing link | Fixed — removed |
| I-119 | Web Call widget behavior | Fixed — now Instant Call Back flow |
| I-120 | AI Config RBAC inconsistent | Fixed — tile and sub-menu aligned |
| I-121 | Video popup blocked | Fixed — sync window.open |
| I-123 | Widget form → TeamBox | Fixed — creates conversation |
| I-124 | Marketing popout duplicates | Fixed — consolidated |
| I-127 | My Work visible in nav | Fixed — commented out |
| I-128 | Campaign Safety no dismiss | Fixed — localStorage persist |
| I-129 | Campaign tooltips missing | Fixed — all wrapped |
| I-133 | Caroline/Nancy phone numbers | Partially addressed — FIX-07/08, BL-088 |
| I-134 | Landing page route race | Fixed — public router separation |
| I-135 | Widget CORS | Fixed — wildcard for widget paths |
| I-136 | Sales routes to /marketing | Fixed — path is /sales |
| I-137 | Tour skip navigates to /w/ | Fixed — no navigation on skip |
| I-142 | VIN lead source mapping | Fixed — per-dealer lookup |
| I-143 | No business-hours on campaigns | Fixed — TCPA gate added |
| I-147 | TeamBox tabs mismatch | Superseded — BL-084 removed tasks |
| I-152 | "Georgia" FAB | INVALID — uses org personaName |
| I-153 | Session timeout dialog | Fixed — fully implemented |
| I-160 | Metric label truncation | FIX-01 committed |
| I-161 | AI Chat + Sales drill-downs | VFY-01 + VFY-02 verified working |
| I-162 | TeamBox task view | BL-084 removed tasks feature |
| I-167 | /agents page states | VFY-05 verified working |
| I-170 | Marketing agent chat | VFY-04 — covered by I-172 |
