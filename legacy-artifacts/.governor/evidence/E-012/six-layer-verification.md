# E-012 Six-Layer Verification Results
**Date:** 2026-03-26
**Verified by:** Captain (main session — subagents blocked on permissions)

## S1: Presentation Layer
**Status:** Partially verified (from earlier Playwright passes)
- 8/10 untested routes verified in earlier FE pass
- /profile/preferences loads correctly (was false 404)
- /agents shows single-agent chat, not list view
- All billing sub-routes show "Billing Not Configured"
- Org wizard functional (7 steps)
- /usage has real data (38 events)
- Tour overlay dismissable
- 2 routes untested: /profile/billing, /settings/system

## S2: Application Layer
**Status:** VERIFIED via API
- Auth flow works (accessToken returned, correct user/role/org)
- Data volumes confirmed:
  - 11 agents, 140 conversations, 96 campaigns
  - 15 tasks, 1912 leads, 48 metrics
  - 5 hunches, 33 notifications, 8 appointments, 4 documents
- All endpoints return real data

## S3: Processing Layer
**Status:** VERIFIED via API
- Kill switch: ON (global + all channels enabled)
- SMS blacklist: 1 entry (STOP opt-out)
- Billing: {configured: false} — FlexPrice not wired, 6 plans in catalog
- FAL proxy: WORKING (queues to fal.run successfully) — TI-018 is frontend issue
- Insights: real data (7 dashboard sections)
- Hunches: 5 real AI-generated insights
- CRITICAL HUNCH: "Campaigns Sending Zero Messages Despite Active Status"

## S4: Data Layer
**Status:** VERIFIED via API + codebase inventory
- 20 tables in schema (shared/schema.ts)
- 4 migrations
- Seed data: 5 orgs, 14 agents, 7+ users
- Org data distribution: Honda 11 agents/140 convos/1912 leads, Nissan 10 agents/7 convos
- Data quality: all records have org_id (verified in isolation test)

## S5: Security Layer
**Status:** VERIFIED via API
- Auth: valid login → 200, wrong password → 401, no enum leak, no token → 401, garbage → 401
- Org isolation: PASS — zero cross-org leakage (Honda vs Nissan, 2 separate tokens)
- Security headers: CSP present, X-Content-Type-Options, CORS configured
- HTTPS: working via Caddy

## S6: Infrastructure Layer
**Status:** VERIFIED via PM2 + curl + filesystem
- App: online, 29h uptime, v2.2.0, production mode
- Health: 200 OK
- External services: central-mcp + vin-safe-mcp both online
- Build: dist/ exists (22MB)
- Disk: 774MB app, 137GB free
- RAM: 4.8GB used / 23GB total
- HTTPS: working, Caddy serving with CSP headers
- Git: uncommitted changes present

## CRITICAL FINDINGS

| # | Finding | Layer | Severity |
|---|---------|-------|----------|
| 1 | TEXTMAGIC_API_KEY missing from .env | S6/IN | CRITICAL — SMS cannot work without it |
| 2 | APP_BASE_URL missing from .env | S6/IN | HIGH — CORS, email links, widget URLs affected |
| 3 | Billing not configured (FlexPrice not wired) | S3/BE | HIGH — entitlements, usage tracking, plans all stub |
| 4 | Campaigns sending zero messages despite active status | S3/BE | HIGH — AI hunch confirms campaign execution broken |
| 5 | 8 always-true test assertions in s11-demo-hotfix.spec.ts | S1/T | HIGH — S-11 verification unreliable |
| 6 | 103 stub tests in observability/ | S1/T | MEDIUM — false coverage appearance |
| 7 | Git uncommitted changes | S6/IN | MEDIUM — App.tsx, widget-landing.tsx modified but not committed |
| 8 | TI-018 Photo Studio broken on frontend (FAL backend works) | S1/FE | MEDIUM |
| 9 | Test files use prod URL (dev.huminicdev.com) not localhost | S6/IN | MEDIUM — tests hit prod |
| 10 | 37 historical restarts on PM2 | S6/IN | LOW — informational |
