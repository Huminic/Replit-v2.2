# Codebase Audit — 2026-04-20 (Pre-Launch Ultrareview)

**Commissioned by:** Operator (while sleeping)
**Branch:** wave-pe3
**Method:** 6 parallel domain audits (security, endpoints, tests+evals, infrastructure, data integrity, frontend), each read-only, each cross-referencing `issues.md`.
**Output goal:** Prioritized recommendations. What must be fixed before launch. What can ship. What's debt.

---

## WAKE-UP TL;DR

Nine launch-blockers. Most dangerous cluster: **outbound-send gates can be bypassed from four separate paths** (mass-assignment on org PATCH, ADF bypass, weekly report not gated, webhook fail-open). Each is the INC-001 shape. Second cluster: **cross-tenant data exposure** (two confirmed IDORs). Third: **idempotency holes** that duplicate VIN leads / ADFs on any webhook replay or container restart.

**Top 5 to fix first thing in the morning, in order:**

1. **🔥 Rotate the VIN_SAFE_MCP_TOKEN immediately.** Current token literal is committed to the repo in 4 files + CLAUDE.md. Anyone with repo-read can call `vin_safe_execute_lead` directly. `git log -p` it, rotate, delete the fallback pattern. (Security P0-1)
2. **🔥 Lock down `PATCH /api/organizations/:id`.** It currently accepts `outboundEnabled`, `smsEnabled`, `phoneEnabled`, `emailEnabled`, `partnerId`, `slug`. **Any org_admin can flip their own CommGate to true and send to real customers** — INC-001 via API. (Security P0-7 / I-247 — worse than documented.)
3. **🔥 Add CommGate to three bypass paths:** ADF email sender (`webhooks.ts:737`), `POST /api/conversations/:id/email` (`conversations.ts:197`), and `sendWeeklyReportEmail` (`notificationService.ts:434`). Each can currently send real email without passing through `checkCommGate`. The weekly report helper was built last night and is not yet wired — fix before you wire it.
4. **🔥 Fix webhook fail-open + add HMAC + replay protection.** `VAPI/Tavus/TextMagic` webhooks use `!==` bearer compare with no HMAC, no timestamp window, and **accept any request if the secret env var is unset**. Forged VAPI payload today could fire an ADF to a dealer. (Security P0-2/3 + Infra findings 2, 10.)
5. **🔥 Close I-281 cross-org IDOR on `/api/sync/*` and `/api/warehouse/*`.** `requireRole(2)` but `?orgId=<any-uuid>` is honored — a partner_admin can trigger backfills on or read leads from any dealer. (Endpoint audit — NEW.)

Everything else in this doc is prioritized below.

---

## Audit coverage (what I looked at)

| Domain | What it covered |
|---|---|
| Security | auth, RBAC, IDOR surface, input validation, webhook signatures, secrets, CommGate |
| Endpoints | every `server/routes/*.ts` — COMPLETE/STUB/ORPHAN/DEAD-WIRE; cross-check vs frontend callers |
| Tests + Evals | `tests/**/*.{spec,test}.ts` — REAL/SHALLOW/DEAD/MOCKED-CORE scoring; eval safety |
| Infrastructure | schedulers, webhooks, sync, observability, deploy pipeline, PM2/Coolify/Caddy |
| Data integrity | schema drift, null-safety, cross-org queries, orphan risk, transaction boundaries |
| Frontend | every `client/src/pages/*.tsx` — status matrix, role leaks, missing states, a11y |

Each audit returned a full independent report; raw outputs captured in task transcripts.

---

## P0 — Launch blockers (must fix before going live)

### Cluster A — Outbound send gate bypasses (INC-001 shape)

| # | Finding | Evidence | Fix |
|---|---------|----------|-----|
| P0-1 | Hardcoded `VIN_SAFE_MCP_TOKEN` literal in repo | `conversations.ts:317`, `integrations.ts:9`, `webhooks.ts:1164, 1543`, `CLAUDE.md` | Rotate token. Remove `|| "8NCVZ..."` fallback. Fail-fast on missing env. |
| P0-2 | Mass-assignment: `PATCH /api/organizations/:id` accepts `outboundEnabled`, `smsEnabled`, `phoneEnabled`, `emailEnabled`, `partnerId`, `slug` — org_admin can flip CommGate true | `shared/schema.ts:519` (`updateOrganizationSchema` uses `.partial()` without an allowlist) | Explicit `.omit()` list. Keep `slug/partnerId/commgate flags` super_admin only. Confirms & expands I-247. |
| P0-3 | ADF email sender does not call `checkCommGate` | `webhooks.ts:737–756` | Gate on `org.outboundEnabled && org.emailEnabled` before `callMCP("resend_send_email")`. |
| P0-4 | `sendWeeklyReportEmail` has no CommGate | `notificationService.ts:434–477` | Add gate before Resend call. Blocker before wiring Phase D scheduler. |
| P0-5 | `POST /api/conversations/:id/email` bypasses CommGate and `OUTBOUND_LIVE_ENABLED` | `conversations.ts:174–200` | Route through `processOutboundSend` (`outbound.ts`). Same class as the closed I-235. Orphan endpoint but exposed. |

### Cluster B — Webhook authentication / replay

| # | Finding | Evidence | Fix |
|---|---------|----------|-----|
| P0-6 | Webhook signature check is skipped entirely when secret env var is unset — only a startup `console.warn`, not fail-closed | `webhooks.ts:890 (VAPI), 1413 (Tavus)`, `sms.ts:57 (TextMagic)` | In `NODE_ENV=production`, require all three secrets at boot; `process.exit(1)` if missing. |
| P0-7 | Compare uses `!==` (timing attack), plain bearer (not HMAC), no replay protection | Same lines as P0-6 | Switch to `crypto.timingSafeEqual` + HMAC-SHA256 over rawBody + 5-min timestamp window. `rawBody` already captured (`index.ts:52`). |
| P0-8 | Tavus webhook has **zero idempotency**. Re-delivery = duplicate conversation + duplicate VIN lead + duplicate ADF email | `webhooks.ts:1411+` | Unique index on `(provider, external_call_id)` in a `webhook_dedup` table; check before processing. |
| P0-9 | VAPI dedup is in-memory Map (`processedVapiCalls`, `recentVapiCallsByPhone`) — wiped every container restart | `webhooks.ts:1010, 1035–1065` | Same DB-backed dedup as P0-8. Critical given Coolify restarts and 72 observed PM2 restarts in 3 days. |

### Cluster C — Cross-tenant data exposure (IDOR)

| # | Finding | Evidence | Fix |
|---|---------|----------|-----|
| P0-10 | `/api/sync/backfill`, `/api/sync/delta`, `/api/sync/metrics`, `/api/warehouse/*` honor `?orgId=<any>` with only `requireRole(2)` | `sync.ts:12` | Partner_admin must have `req.params/query.orgId === req.user.organizationId`. Super_admin only for cross-tenant. |
| P0-11 | `/api/vin/leads/summary?orgId=<any>` — any authenticated user can read any dealer's lead summary | `vendorProxy.ts:555` | Confirms I-244 still open. Gate with `req.user.roleLevel <= 2` for override. |
| P0-12 | VIN config endpoints (GET/PATCH `/api/integrations/:orgId/vin-config`) don't check `orgId === req.user.organizationId` | `organizations.ts:316, 338` | 2-line check: `if (req.params.orgId !== req.user.organizationId && req.user.roleLevel > 2) return 403`. |

### Cluster D — Data integrity / operational

| # | Finding | Evidence | Fix |
|---|---------|----------|-----|
| P0-13 | `/api/health` returns `{ status: "ok" }` without checking DB, MCP, or scheduler liveness | `server/routes/health.ts` | Add DB `SELECT 1` + MCP ping + last-sync-timestamp + scheduler heartbeat. Coolify uses this to decide if deploy succeeded. |
| P0-14 | No DB transactions anywhere in `server/`. Webhook flows (create conversation → create message → create activity log → send notification) are non-atomic | `grep "db.transaction" server/` → 0 hits | Wrap multi-write flows in `db.transaction`. Start with `webhooks.ts` VAPI/Tavus handlers and `storage.deleteConversation`. |
| P0-15 | Schema drift: `migrations/` missing 12+ tables/columns (`scheduled_actions`, `scheduler_locks`, `billing_*`, `additional_org_ids`, `followup_step`, `lead_score`, `assigned_to`, `stale_trigger_processed_at`, `widgets.impressions/interactions`, `campaigns.execution_*`) | Diff `shared/schema.ts` vs `migrations/0000..0004.sql` | Baseline a fresh migration from current schema. Required before any staging DB rebuild (I-223). |

---

## P1 — High priority (ship-with-caveat or fix this week)

### Security / Auth

| # | Finding | File:line |
|---|---------|-----------|
| P1-1 | Welcome/invite emails send **plaintext passwords** in body | `users.ts:115, 376` |
| P1-2 | Self-deactivation lockout (I-249 OPEN-confirmed) | `users.ts:200` |
| P1-3 | Permissive CSP: `'unsafe-inline'` + wildcard https on widget routes | `index.ts:124` |
| P1-4 | Login failure IPv6 port-strip truncates real addresses | `auth.ts:23–26` |
| P1-5 | Min password length inconsistent (6 on admin-create, 8 on self-reset) | `users.ts:46, 251` |
| P1-6 | `bypassBusinessHours` still exists as an opt-in param in outbound.ts — grep call sites | `outbound.ts:35, 263, 288` |
| P1-7 | Refresh token cookie `sameSite: 'strict'` breaks email-link flows | `auth.ts:12` |
| P1-8 | Legacy `refreshToken` body fallback (I-238) | `auth.ts:200` |

### Endpoints / Routes

| # | Finding | File:line |
|---|---------|-----------|
| P1-9 | I-270 bulk CSV upload 404s (service.tsx:365 → missing server route) | `service.tsx:365` |
| P1-10 | I-193 CSV template download missing (no route, no static asset) | `service.tsx:360` |
| P1-11 | I-174 "Send to CRM" missing for form / SMS widget channels | — |
| P1-12 | Insights library drill-downs return placeholder for many `lib-*` IDs | `insights.ts:750–757` (confirms I-260 lib-21) |
| P1-13 | `/api/sms-blacklist` GET/DELETE no UI — TCPA opt-out list unmanageable (compliance risk) | `sms.ts:605, 615` |
| P1-14 | Billing usage emit errors swallowed in 4 sites — metered events vanish silently | `proxy.ts:45,47`; `webhooks.ts:1392, 1725` |

### Tests / Evals

| # | Finding | File:line |
|---|---------|-----------|
| P1-15 | **Dangerous evals** without `LIVE_SEND` gate can fire real SMS/VAPI: `RI-SMS-1`, `RI-VAPI-1`, `LC-2` | `tests/e2e/real-integrations.spec.ts:223–268, 817`; `tests/e2e/live-comms.spec.ts` |
| P1-16 | `+1-205-555-1234` used as "test number" in evals — 205 is Alabama (real NANP) | Same files |
| P1-17 | `m001-gap-coverage.spec.ts` uses wrong password — entire file silently 401s | `tests/e2e/m001-gap-coverage.spec.ts` |
| P1-18 | Vitest has no npm script — new TRG-RPT-001 unit tests can't run via `npm test` | `package.json:11–13` |
| P1-19 | Weekly report renderer has no isolated test — only exercised by skipped `LIVE_SEND` | `tests/integration/weeklyReport.send-live.test.ts` |
| P1-20 | `wf-resend-email.spec.ts` accepts 200 AND 503 as pass — silent coverage loss if Resend key dropped | `tests/e2e/wf-resend-email.spec.ts` |

### Infrastructure

| # | Finding | File:line |
|---|---------|-----------|
| P1-21 | **72 PM2 restarts in 3 days** on nexxus-app — crash loop root cause unknown | `pm2 list` |
| P1-22 | Campaign executions in-memory only — restart mid-campaign = stuck `executing` rows with no driver | `outbound.ts:751`, `activeExecutions` Map |
| P1-23 | `runWeeklyHunches` uses server-local `getDay()/getHours()` — not org TZ | `scheduler.ts:425` |
| P1-24 | `checkUnansweredEscalations` calls Resend SDK directly — bypasses central-mcp batching, starves I-239 rate-limit | `scheduler.ts:467` |
| P1-25 | PII in container stdout (phone numbers, message snippets) | `triggerService.ts`, `sms.ts:97` |
| P1-26 | Deploy verify hits `/`, 15s curl, no retry, no rollback on failure | `.github/workflows/deploy.yml` |
| P1-27 | Playwright tests in CI run against production URL (`live.huminic.app`) | `.github/workflows/deploy.yml` |

### Data integrity

| # | Finding | File:line |
|---|---------|-----------|
| P1-28 | Phone not normalized on write — reads try 5 variants; writes store raw. Duplicate conversations across formats | `storage.ts:339–346` vs `createConversation` (no normalization) |
| P1-29 | No unique index `conversations(organizationId, customerPhone, channel) WHERE status='open'` — races create dupes | `schema.ts:105–109` |
| P1-30 | Unbounded queries — `getConversations`, `getMessages`, `getTasks`, `getWidgets`, `getCampaigns`, `getOutboundLogs`, `getOrganizations`, `getPendingRecipients` — no `.limit()`. Large tenant = OOM | `storage.ts` — grep `.limit` |
| P1-31 | `sessions.refreshToken` + `users.reset_token` stored plaintext | `schema.ts:43, 56` |
| P1-32 | `customerName` is `NOT NULL` but webhook/trigger inserts fall back to `'Unknown Caller'` and `lead.customerPhone!` — if both null → 500 | `webhooks.ts:1068, 1131`; `triggerService.ts:430–431` |
| P1-33 | `findOrganizationByPhone` non-deterministic — if customer called two dealers (same parent), returns first match | `storage.ts:301–321` |
| P1-34 | Weekly report `fmtDate` uses server-local TZ — "week ending" date wrong for off-TZ dealers | `weeklyReportService.ts:559–562` |
| P1-35 | Weekly report model id `claude-sonnet-4-6` may be invalid for the account; silently falls back to placeholder | `weeklyReportService.ts:834` |

### Frontend

| # | Finding | File:line |
|---|---------|-----------|
| P1-36 | Role dropdown iterates full `roles` unfiltered — org_admin sees super_admin/partner_admin options (I-246) | `settings.tsx:3853–3867, 698` |
| P1-37 | No "Return to AI" after takeover (I-255) | `teambox.tsx:739–753, 942` |
| P1-38 | `window.open` with no dimensions (I-257) | `widget-landing.tsx:126, 331` |
| P1-39 | `alert()` on lead submit failure — jarring mobile UX | `widget-landing.tsx:387` |
| P1-40 | Widget "View test page" buttons hardcoded to `/w/demo` | `settings.tsx:2097, 2200` |
| P1-41 | `/my-work` route registered but hidden — reachable by direct URL (I-127 regression) | `App.tsx:69`; `Sidebar.tsx:57–58` |
| P1-42 | `management.tsx` User Chats tab ships as "coming soon" placeholder but clickable | `management.tsx:274–285, 323` |
| P1-43 | 10 pages lack `isError` handling (insights, teambox, sales, service, marketing, my-work, agents, profile, management, main) | `client/src/pages/*.tsx` |

---

## P2 — Should do, not blocking

### Quick-wins (<30 min each)

- Remove 3 dead test files (`seed.spec.ts`, `usability-audit.spec.ts`, `visual-components.spec.ts` — together ~11 assertions across 664 lines)
- Drop stale `testIgnore: /deprecated\//` in `playwright.config.ts`
- Remove stale "mocked" JSDoc comments in `main.tsx:22`, `agents.tsx:21`, `Sidebar.tsx:19`
- Add `aria-label` to icon-only buttons in Sidebar/FavoritesBar/TopBar (tooltip content currently `className="hidden"`)
- Fix color contrast: `text-muted-foreground/40` and `/50` likely fail WCAG AA
- Unify password min length at 8 with complexity (users.ts)
- Use `req.ip` instead of regex port-strip for login rate-limit key
- Swap all webhook bearer compares to `timingSafeEqual` (defense-in-depth)
- Delete unused `lt` import in `weeklyReportService.ts:20`
- `/widget/test` (public.ts:377) — gate behind query token or remove (it lists all dealer slugs + personas)
- 47× `.catch(() => {})` pattern in routes — wrap in single `silentLog` util with `console.warn` for audit trail

### Debt / future sprints

- No Sentry / error tracking (I-224) — confirms
- No monitoring dashboards, no uptime monitor, no alert rules
- `req.on('close')` missing on SSE `/api/chat` stream — Anthropic billing continues after client disconnect
- Agent `assignedPhone` has no unique constraint — two agents can share a phone
- `stopConfirmationCache`, `processedVapiCalls`, unbounded in-memory maps with periodic sweepers
- `agents.customerLink` / `sourceConversationId` have no FK — orphan candidates
- `outbound_log.kind` column would replace fragile `LIKE '%[adf:%'` tag matching in weekly report
- Weekly report AI narrative: no test asserts the placeholder branch fires when API key missing

---

## Convergent findings (flagged by multiple audits — high confidence)

These came up independently in ≥2 of the 6 agents and are the highest-confidence items:

| Finding | Audits | Current severity |
|---------|--------|------------------|
| Webhook signature fail-open + not HMAC + no replay | Security, Infra, Endpoints | P0 |
| I-244 IDOR `/api/vin/leads/summary?orgId=` | Security, Endpoints | P0 |
| I-247 PATCH org mass-assignment — worse than documented | Security, Frontend | P0 |
| Tavus webhook zero idempotency | Security, Infra, Endpoints | P0 |
| Hardcoded VIN_SAFE_MCP_TOKEN | Security, Infra | P0 |
| ADF email + weekly report bypass CommGate | Security, Endpoints | P0 |
| `/api/health` cosmetic | Infra, Data | P0 |
| No DB transactions | Data, Infra | P0 |
| I-241 test traffic in production (dangerous evals) | Tests, Endpoints | P1 |
| Role dropdown unfiltered (I-246) | Security, Frontend | P1 |
| Insights lib-* drill-downs incomplete (I-260 family) | Endpoints, Frontend | P1 |
| I-270 bulk CSV 404 | Endpoints, Frontend | P1 |

---

## Regression checks — what's actually fixed vs what's claimed

| Issue | Claimed status | Actual | Evidence |
|---|---|---|---|
| I-237 (weak default password) | CLOSED | **Confirmed fixed** | `seed.ts:8` uses randomUUID |
| I-251 (VIN lead source fallback) | CLOSED | **Confirmed** | fallback string present |
| I-272/273/274 (INC-001 controls) | CLOSED | **Mostly** — but `bypassBusinessHours` param still exists in `outbound.ts:35, 263, 288`; grep call sites to confirm no one sets it true | — |
| I-236 (webhook signatures optional) | OPEN | **Worse than documented** — not just optional; when set, it's plain `!==`, no HMAC, no replay | `webhooks.ts:894, 1416` |
| I-244 (IDOR VIN summary) | OPEN | **Confirmed open** | `vendorProxy.ts:555` |
| I-247 (slug writable) | OPEN | **Worse than documented** — not just slug; also `partnerId`, CommGate flags | `schema.ts:519` |
| I-248 (timezone NaN) | OPEN | **Confirmed open** | `outbound.ts:251–254` |
| I-249 (self-deactivation) | OPEN | **Confirmed open** | `users.ts:200` |
| I-226 (Dockerfile healthcheck curl missing) | OPEN | **Resolved** (curl now installed) | `evidence/I-004` + Dockerfile |
| I-245 (AI system prompt writable by org_admin via URL) | OPEN | **Confirmed** — `requireRole(3)` allows it, still accepts full body | `settings.ts:25` |
| I-246 (role dropdown) | OPEN | **Server-gated** (users.ts:56, 185, 195, 334 compare role levels correctly). UI filter still pending. | — |

---

## New issues to append to issues.md (renumbered from I-279)

Only items not already present under another ID. Compact format:

```
| I-279 | PATCH /api/organizations/:id accepts outboundEnabled/smsEnabled/phoneEnabled/emailEnabled/partnerId/slug via updateOrganizationSchema .partial(). Org_admin can flip own CommGate to true and send to real customers. Worse-scoped than I-247. | AU, BE | OPEN | E |
| I-280 | Hardcoded VIN_SAFE_MCP_TOKEN fallback in 4 source files + CLAUDE.md. Anyone with repo read can call vin_safe_execute_lead directly. | SEC | OPEN | E |
| I-281 | Cross-org IDOR: /api/sync/{backfill,delta,metrics} + /api/warehouse/leads + /api/warehouse/metrics accept arbitrary ?orgId= with only requireRole(2). Partner_admin can exfiltrate any dealer's data. | AU, BE | OPEN | E |
| I-282 | Webhook signatures optional AND non-HMAC AND no replay protection. Plain !== compare. Accepts all if secret unset. Supersedes I-236. | SEC | OPEN | M |
| I-283 | Tavus webhook has zero idempotency on conversation_id. Any re-delivery duplicates conversation + VIN lead + ADF email. VAPI dedup is in-memory only (lost on restart). | BE | OPEN | M |
| I-284 | /api/vin/leads/summary?orgId= IDOR (expands I-244 with new file:line and confirms still open). | AU, BE | OPEN | E |
| I-285 | VIN config endpoints (GET/PATCH /api/integrations/:orgId/vin-config) don't check orgId === req.user.organizationId. Org_admin can reroute another dealer's VIN leads. | AU, BE | OPEN | E |
| I-286 | Self-deactivation lockout — I-249 confirmed still open. | AU, BE | OPEN | E |
| I-287 | ADF email sender does not call checkCommGate (webhooks.ts:737). | BE, SEC | OPEN | E |
| I-288 | sendWeeklyReportEmail (notificationService.ts:434) has no CommGate guard. Currently unexposed but scheduler work will wire it. Fix before scheduler lands. | BE, SEC | OPEN | E |
| I-289 | POST /api/conversations/:id/email bypasses OUTBOUND_LIVE_ENABLED + CommGate. Orphan endpoint but exposed. | BE, SEC | OPEN | E |
| I-290 | Welcome/invite emails send plaintext passwords in body (users.ts:115, 376). | SEC | OPEN | M |
| I-291 | /api/health does no DB/MCP/scheduler liveness check. Coolify cannot detect real failures. | INF | OPEN | E |
| I-292 | nexxus-app PM2 shows 72 restarts in 3 days. Root cause investigation required. | INF | OPEN | M |
| I-293 | No DB transactions anywhere in server/. Webhook multi-write flows are non-atomic. | DT | OPEN | H |
| I-294 | Schema drift: migrations/ missing ~12 tables/columns present in schema.ts. Staging restore from migrations alone would fail. Track under I-223. | DT, INF | OPEN | M |
| I-295 | VAPI/Tavus dedup is in-memory only (processedVapiCalls, recentVapiCallsByPhone Maps). Container restart = possible duplicates. | BE | OPEN | M |
| I-296 | Insights library drill-downs return placeholder for undefined metric IDs (insights.ts:750–757). Confirms and expands I-260. | BE, FE | OPEN | M |
| I-297 | Billing usage emit errors silently swallowed in 4 sites. Metered events can vanish. | BE, BILLING | OPEN | E |
| I-298 | /api/sms-blacklist GET+DELETE exists but no UI. TCPA opt-out list is unmanageable. | BE, FE | OPEN | M |
| I-299 | /widget/test is unauthenticated and renders HTML listing dealer slugs + personas. | SEC | OPEN | E |
| I-300 | Dangerous evals without LIVE_SEND gate (real-integrations.spec.ts RI-SMS-1/RI-VAPI-1/L817, live-comms.spec.ts LC-2). Direct I-241 shape. | TEST | OPEN | M |
| I-301 | +1-205-555-1234 used as "test" number in evals; 205 is Alabama real NANP (not 555-01xx reserved). | TEST | OPEN | E |
| I-302 | m001-gap-coverage.spec.ts uses wrong password → every test 401s silently. | TEST | OPEN | E |
| I-303 | Vitest has no npm test script. New TRG-RPT-001 unit/integration tests not runnable via npm. | TEST | OPEN | E |
| I-304 | runWeeklyHunches uses server-local getDay()/getHours(), not org timezone. | BE | OPEN | E |
| I-305 | checkUnansweredEscalations imports Resend SDK directly. Bypasses central-mcp batching; starves I-239 rate-limit. | BE | OPEN | E |
| I-306 | Campaign execution state in-memory only (activeExecutions Map). Restart leaves executing rows with no driver. | BE, INF | OPEN | M |
| I-307 | PII (phone, message text) printed to container stdout. Compliance/retention risk. | SEC, OPS | OPEN | E |
| I-308 | Phone numbers not normalized on write. Read-side tries 5 variants; writes store raw. Duplicate conversations per customer across formats. | DT | OPEN | M |
| I-309 | No unique index conversations(org, phone, channel) WHERE status='open'. Races create dupes. | DT | OPEN | E |
| I-310 | Unbounded list queries — no .limit() on getConversations/getMessages/getTasks/getWidgets/getCampaigns/getOutboundLogs/getOrganizations/getPendingRecipients. OOM risk for large tenants. | DT | OPEN | M |
| I-311 | sessions.refreshToken + users.reset_token stored plaintext. DB dump = session hijack window. | SEC, DT | OPEN | M |
| I-312 | customerName is NOT NULL in schema but inserts fall back to 'Unknown Caller' / lead.customerPhone!. Null phone + null name → 500. | DT | OPEN | E |
| I-313 | findOrganizationByPhone non-deterministic when a customer called two dealers. | DT | OPEN | E |
| I-314 | Weekly report fmtDate uses server-local TZ. Off-TZ dealers get wrong "week ending" date. | FE, BE | OPEN | E |
| I-315 | Weekly report model id claude-sonnet-4-6 may be invalid for account. Silent fallback to placeholder. Live test before launch. | BE | OPEN | E |
| I-316 | /my-work route registered (App.tsx:69) but hidden from sidebar — reachable by direct URL. | FE | OPEN | E |
| I-317 | Settings "View test page" buttons hardcoded to /w/demo, not dealer slug. | FE | OPEN | E |
| I-318 | widget-landing.tsx alert() on submit failure. Replace with toast. | FE | OPEN | E |
| I-319 | management.tsx User Chats tab ships as "coming soon" placeholder but clickable. Violates PRE-08 user-story gate. | FE | OPEN | E |
| I-320 | 10 pages have no isError handling (insights/teambox/sales/service/marketing/my-work/agents/profile/management/main). | FE | OPEN | M |
| I-321 | Icon-only buttons (Sidebar/FavoritesBar/TopBar) lack aria-label. Tooltip content className="hidden" eliminates SR fallback. WCAG 2.1 fail. | FE, A11Y | OPEN | E |
| I-322 | 47× .catch(() => {}) across server/routes for activity_log / notification writes. Silent audit-trail loss. | BE, DT | OPEN | E |
| I-323 | Three dead test files: seed.spec.ts (0 asserts), usability-audit.spec.ts (1/101), visual-components.spec.ts (7/556). Delete or reclassify. | TEST | OPEN | E |
| I-324 | playwright.config.ts testIgnore: /deprecated\// references non-existent directory. | TEST | OPEN | E |
| I-325 | wf-resend-email.spec.ts accepts 200 AND 503 as pass. Silent coverage loss on API key drop. | TEST | OPEN | E |
| I-326 | Weekly report renderer has no isolated test — only exercised via LIVE_SEND-gated path. | TEST | OPEN | M |
```

### Collapse or cross-reference

- I-241 (test traffic in prod) is the umbrella for I-300/I-301. Keep I-241 as parent, link children.
- I-276 (leadSource URL storage) now blocks P0-10 fix — the cross-org IDOR fix should sanity-check ID resolution.
- I-248 timezone NaN is the parent for I-304, I-314. Same root cause.
- I-223 schema drift is the parent for I-294.
- I-239 Resend rate-limit is fed by I-305.

---

## Verified-safe surfaces (what I checked that looked clean)

So you know where the audit didn't flag anything:

- `auth.ts` JWT access/refresh flow: proper access/refresh separation via `type` field, rotation on refresh, session invalidation on password change, httpOnly+sameSite=strict cookies, `JWT_SECRET` required on boot
- Forgot-password flow: token SHA-256 hashed at rest, 1h expiry, constant response text (no enumeration)
- `conversations.ts` PATCH/GET/DELETE: all check `existing.organizationId !== req.user.organizationId && req.user.roleLevel > 2`
- VIN write flow via `vin-safe-mcp`: proper prepare → execute → verify, `user_confirmed` set server-side, `VERIFIED_CORRECT` enforced
- `weeklyReportService.ts` (built last night): clean HTML escaping (`esc()`), validator blocks raw errors / NaN / undefined from leaking into email, proper org-scoping on every DB query, null `vinCreatedAt` surfaced in email (not hidden)
- Widget chat: escaped org name in system prompt, conversationId verified against org
- Env validation fails fast on `DATABASE_URL` and `JWT_SECRET` (`index.ts:17–25`)
- TCPA business-hours gate in CommGate (`outbound.ts:287`) — honored by check-in trigger
- Scheduler DB lock for campaign scheduler + weekly hunches prevents double-fire across instances
- Container healthcheck curl installed (I-226 resolved)

---

## Suggested next-session sprint plan

### Option A — Security-first pre-launch sprint (recommended)

**Sprint SEC-001 (P0 cluster A + B + C):** 4–6 hours estimated.

Phase 1 — Cluster A (outbound gates, 90 min):
- Rotate VIN_SAFE_MCP_TOKEN, remove 4 fallback literals, add fail-fast (P0-1)
- Tighten `updateOrganizationSchema` with `.omit()` list (P0-2)
- Add `checkCommGate` to ADF sender, `/api/conversations/:id/email`, `sendWeeklyReportEmail` (P0-3/4/5)
- Unit test: attempt org_admin flip of `outboundEnabled` → rejected

Phase 2 — Cluster B (webhooks, 90 min):
- Require webhook secrets in production (fail-fast on boot) (P0-6)
- Switch to `timingSafeEqual` + HMAC-SHA256 + timestamp window (P0-7)
- Add `webhook_dedup` table with unique `(provider, external_id)` index (P0-8/9)
- Unit test: replay of captured VAPI payload → 409 or idempotent no-op

Phase 3 — Cluster C (IDOR, 60 min):
- Gate `?orgId=` override behind `req.user.roleLevel <= 2` in sync/warehouse/vin endpoints (P0-10/11)
- 2-line org-match check on VIN config endpoints (P0-12)
- Integration test: org_admin forges `?orgId=<other>` → 403

Phase 4 — Cluster D (ops, 90 min):
- Real `/api/health`: DB ping + MCP ping + last-sync timestamp + scheduler heartbeat (P0-13)
- Add `db.transaction` to VAPI/Tavus webhook insert flows (P0-14)
- Regenerate baseline migration from current schema (P0-15)

Phase 5 — Operator test + commit (30 min):
- Run the live E2E: trigger a VAPI webhook, verify all gates fire correctly, verify no regression on ADF delivery
- Commit through harness

### Option B — Continue TRG-RPT-001 (SMS triggers + weekly scheduler)

Defer SEC-001 to post-launch. Risky — five of the P0 items allow INC-001-shape outcomes.

### My recommendation

**Option A first, then resume TRG-RPT-001.** The outbound-gate bypass cluster alone is 3–4 distinct paths to the same class of incident that's already happened three times. Fix those before more customer-adjacent code ships. SMS triggers are valuable but they add exposure on top of current gaps.

---

## Appendix — audit methodology

6 specialized sub-agents dispatched in parallel. Each:
- Read-only; no writes, no test runs, no app starts
- Given a tight domain scope + specific files to read
- Required to cross-reference `issues.md` IDs and flag NEW findings separately
- Required to classify severity P0/P1/P2 with rationale
- Required to return specific `file:line` references

Synthesis pass (this document):
- De-duplicated findings across agents (multiple agents flagged webhook signatures, I-244, I-247, Tavus idempotency — clustered)
- Renumbered proposed issue IDs from I-279 onward to avoid collision
- Ranked P0 by exploit severity (INC-001 shape > data leak > availability)
- Identified convergent findings (3+ agents) as highest confidence
- Cross-referenced regression checks against claimed-closed items

All six raw audit reports are retained in the task transcripts for deeper review if any finding needs investigation.
