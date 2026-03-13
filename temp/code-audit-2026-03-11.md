# Nexxus Connect v2.2 — Code Audit Report
**Date:** 2026-03-11
**Auditor:** Claude Code
**Scope:** Full stack — server, client, schema, tests, config

---

## CRITICAL (6 issues)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | Monolithic routes.ts — 4,590 lines | `server/routes.ts` | Untestable, unmaintainable |
| 2 | JWT_SECRET hardcoded fallback | `server/auth.ts:5` | Auth bypass if env var missing |
| 3 | Widget lookup scans ALL orgs (N+1) | `routes.ts:3545, 3615` | DoS on public endpoint |
| 4 | Zero automated tests | `tests/observability/` | 123 stubs, all `expect.fail()` — 0% real coverage |
| 5 | Express 5.0.1 (beta/RC) | `package.json:59` | Unstable core framework |
| 6 | Scheduled jobs have no distributed locking | `server/index.ts` | Duplicate sends if multi-instance |

---

## HIGH (12 issues)

| # | Issue | Location |
|---|-------|----------|
| 7 | N+1 queries in trigger system (300+ queries/15min) | `index.ts:216-326` |
| 8 | No pagination on 20+ list endpoints | `routes.ts` (all GET lists) |
| 9 | No rate limiting on password reset | `routes.ts:418` |
| 10 | Plaintext temp passwords sent via email | `routes.ts:4284` |
| 11 | Silent error suppression (100+ `.catch(() => {})`) | Server-wide |
| 12 | Tokens stored in localStorage (XSS vulnerable) | `AuthContext.tsx:74-83` |
| 13 | XSS risk in Markdown rendering (no `skipHtml`) | `MarkdownMessage.tsx:85` |
| 14 | AppContext is mega-state (37 properties) | `AppContext.tsx` |
| 15 | QueryClient `staleTime: Infinity` — data never refreshes | `queryClient.ts:125` |
| 16 | Missing security headers (no Helmet) | `server/index.ts` |
| 17 | Missing role gates on campaign kill switch, CSV upload | `routes.ts` |
| 18 | Tailwind border color opacity broken | `tailwind.config.ts:32-53` |

---

## MEDIUM (15+ issues)

- In-memory rate limiting with memory leak (`routes.ts:3484-3500`)
- In-memory campaign execution state lost on restart (`outbound.ts:317`)
- No soft deletes — hard cascades, no recovery (`schema.ts`)
- Missing compound indexes on warehouse_leads, tasks (`schema.ts`)
- 133 instances of `any` type on client (`tool-executor.ts`, `AgentConfigPane.tsx`, etc.)
- No CORS configuration (`server/index.ts`)
- Accessibility gaps — missing ARIA labels, keyboard nav, color contrast
- No lazy loading for 3,724-line settings page (`settings.tsx`)
- SMS API key truncation logic (`outbound.ts:12`)
- setInterval with async campaigns — race conditions (`outbound.ts:505`)
- Generic 500 errors with no detail (all routes)
- Unhandled promise rejections in scheduled jobs (`index.ts`)
- CSV parsing not RFC 4180 compliant (`routes.ts:2478`)
- No source maps in production build (`script/build.ts`)
- Inconsistent API response formats across endpoints
- Token refresh race condition window (`queryClient.ts:29-61`)
- No optimistic updates on favorites, notifications (`AppContext.tsx`)
- Missing skeleton loaders on initial page loads
- Session timeout hard redirect loses unsaved work (`AuthContext.tsx:365`)

---

## WHAT'S GOOD

- Schema design solid — 24 tables, proper FK cascades, referential integrity
- Auth flow complete — JWT + refresh + forgot-password + RBAC (4 levels)
- 78% of features use real API data (not mocked)
- CommGate 5-layer safety for outbound messaging works correctly
- Drizzle ORM + Zod validation pipeline well-structured
- Marketing agents (5) fully implemented with tool execution
- Error boundary exists on client
- TypeScript strict mode enabled
- Build pipeline (Vite + esbuild) is correct and optimized
- Drizzle migration setup is solid

---

## PRIORITY RECOMMENDATIONS

### Before Transferring Development
1. Fix JWT_SECRET hardcoded fallback (1 line change)
2. Fix widget lookup to single indexed query (eliminates DoS)
3. Add `helmet` + CORS middleware
4. Add role gates to unprotected campaign routes

### When Taking Over Development
1. Break up `routes.ts` into controllers/services/repositories
2. Add pagination to all list endpoints
3. Replace `staleTime: Infinity` with reasonable cache policy
4. Move tokens from localStorage to httpOnly cookies
5. Implement real tests (123 stubs are a good spec to follow)
6. Evaluate Express 5 -> 4.x downgrade or wait for stable 5.x

### Before Production
1. Distributed job locking (Redis/Bull)
2. DB-persisted campaign execution state
3. Replace silent `.catch(() => {})` with proper error logging
4. Automated test suite (target 60%+ coverage)
5. Add security headers (Helmet)
6. Add source maps for production debugging

---

## DETAILED FINDINGS BY AREA

### Server — routes.ts (4,590 lines)
- All business logic, data access, and HTTP handling mixed together
- No separation of concerns (controllers, services, repositories)
- Duplicated code patterns across 80+ route handlers
- Recommendation: Refactor into controllers/, services/, repositories/, middleware/, validators/

### Server — auth.ts
- Line 5: `const JWT_SECRET = process.env.JWT_SECRET || "nexxus-connect-jwt-secret-dev"`
- Default secret exposed in source code
- Fix: Remove fallback, throw error if missing

### Server — outbound.ts
- Line 12: TextMagic API key truncation (60 chars -> 30 chars) — unexplained
- Line 317: Campaign execution state in-memory Map — lost on restart
- Line 505: setInterval with async callback — race condition risk
- Line 423-500: Synchronous loop with async operations

### Server — index.ts
- Lines 216-326: Trigger system N+1 queries (orgs -> agents -> users -> leads)
- Lines 106-122: Startup IIFE not awaited — server accepts requests before setup complete
- Line 138-328: Multiple setInterval jobs with no coordination or locking

### Client — AuthContext.tsx
- Lines 74-83: Tokens in localStorage (XSS vulnerable)
- Line 365: Hard redirect on session expiry loses unsaved work

### Client — AppContext.tsx
- Lines 67-106: 37 properties in single context — should split into 4 contexts
- Lines 127-135: Cascading queries with enabled conditions causing stale data risks

### Client — queryClient.ts
- Lines 125-138: `staleTime: Infinity` means data never refreshes automatically
- `refetchOnWindowFocus: false` — missed updates on tab switch
- `retry: false` — no resilience

### Client — MarkdownMessage.tsx
- Line 85: ReactMarkdown without `skipHtml` — XSS possible via HTML injection

### Client — settings.tsx
- 3,724 lines — handles users, roles, widgets, landing pages, MCP tools all in one file
- No code splitting or lazy loading

### Schema — shared/schema.ts
- Missing compound indexes on warehouse_leads (org_id + status), tasks (org_id + status + type)
- No soft-delete timestamps (deletedAt) on any table
- No CHECK constraints on status/enum fields (application-level validation only)

### Tests — tests/observability/
- 123 test stubs across 7 files
- ALL use `expect.fail("STUB — ...")` pattern
- 0% actual test coverage
- Good as specification documents, useless as tests

### Config — package.json
- Express 5.0.1 (beta) — should use stable 4.x
- Missing helmet, cors packages
- Inconsistent version pinning (mix of exact and caret ranges)

### Config — tailwind.config.ts
- Lines 32-53: Border colors use raw `var()` instead of `hsl(var(...) / <alpha-value>)`
- Opacity variants on border colors silently fail

---

## CROSS-REFERENCE: REPLIT'S OWN VALIDATION REPORTS

Replit produced two validation documents that were reviewed as part of this audit:
- `tests/validation/CODE_VALIDATION_REPORT.md` — 89 items validated, 6 E2E test suites via Playwright
- `tests/validation/USER_STORIES_AND_AC.md` — 13 user stories, ~80 acceptance criteria

### What Replit Already Identified (Overlap)
Their report correctly flags these issues (which my audit confirms):
- Backend role gate gaps on campaign routes (their Section 2c) — matches my #17
- No Helmet/CORS/CSRF (their Section 7a-c) — matches my #16
- In-memory campaign execution state (their Section 5b) — matches my MEDIUM list
- No RLS (their Section 6d) — confirmed
- Missing compound indexes (their Section 6e) — matches my MEDIUM list
- In-memory webhook rate limiting (their Section 7d) — matches my MEDIUM list
- Fire-and-forget activity logging (their Section 7e) — matches my #11

### What This Audit Found That Replit's Report Missed
1. **N+1 widget lookup on public endpoint** — their report marks widget landing as PASS but doesn't note the full-org-scan query pattern (DoS risk)
2. **4,590-line routes.ts monolith** — not flagged as architectural concern
3. **N+1 queries in trigger system** — 300+ queries every 15 minutes, not mentioned
4. **No pagination on any list endpoint** — not covered
5. **staleTime: Infinity on QueryClient** — client never refreshes data automatically
6. **localStorage token storage** — XSS vulnerability not assessed
7. **XSS via Markdown rendering** — ReactMarkdown without skipHtml
8. **AppContext mega-state** (37 properties in single context)
9. **Express 5.0.1 beta** — framework stability risk not assessed
10. **Silent error suppression** — 100+ `.catch(() => {})` not flagged
11. **JWT_SECRET hardcoded fallback** — their report calls it PASS (Section 1f line 72) despite the insecure default

### Where Replit's Report Exceeds This Audit
- **E2E test execution** — 6 Playwright suites run against live app (we did static analysis only)
- **AC tracking granularity** — every acceptance criterion mapped to pass/fail with line references
- **Mock/Real data matrix** — precise breakdown showing 78% real, 22% placeholder
- **Governance conflict resolutions** — documented competing specs and how conflicts were resolved
- **False positive tracking** — 10 items tracked from mock→real transition with current status

### Acceptance Criteria Alignment

| User Story | AC Count | Status per Replit Report | My Assessment |
|------------|----------|--------------------------|---------------|
| US-001: Auth & Password | 7 | All PASS | Agree, except JWT_SECRET fallback is a risk |
| US-002: RBAC | 4 | All PASS | Agree — sidebar gating is solid |
| US-003: Pipeline Metrics | 6 | All PASS (100% real) | Agree |
| US-004: TeamBox | 10 | All PASS (100% real) | Agree |
| US-005: AI Chat & Streaming | 7 | All PASS | Agree — hybrid tool-use works |
| US-006: Outbound & CommGate | 8 | All PASS | Agree — 5-layer safety is well-implemented |
| US-007: Webhook Security | 3 | All PASS | Agree |
| US-008: Management & Hunches | 5 | All PASS (100% real) | Agree |
| US-009: Sales Page | 3 | PARTIAL (Recent Activity hardcoded) | Agree — known placeholder |
| US-010: Widget Landing | 6 | All PASS (all 4 channels real) | Agree functionally; N+1 query is perf risk |
| US-011: Database Integrity | 5 | All PASS except RLS (risk) | Agree, add missing compound indexes |
| US-012: Error Handling & UX | 4 | All PASS | Partially agree — silent error suppression undermines this |
| US-013: Marketing AI Agents | 10 | All PASS | Not independently verified (added in Sprints 0-11) |

### Known Placeholders (Wave 1 Acceptable)
Both reports agree these are acceptable deferrals:

| Placeholder | Target Wave |
|-------------|-------------|
| Sales Recent Activity (hardcoded) | Wave 3 |
| Insights Metric Library (34 hardcoded defs) | Wave 3 |
| Billing/Invoice buttons (demo toasts) | Wave 4 |
| Settings Tool toggles (demo toasts) | Wave 3 |
| Knowledge Base URL add/scrape (demo toasts) | Wave 3 |
| Chat Upload/Document ("Coming Soon") | Wave 3 |
| TeamBox file attachments ("Coming Soon") | Wave 3 |
| Agent trigger editor (demo toasts) | Wave 3 |
| Google Calendar/Dealer.com/Tekion sync | Wave 5 |
| Row-Level Security (RLS) | Wave 5 |
| CORS/CSRF/Helmet security | Pre-production |

### Bottom Line
Replit's validation is thorough on **functional correctness** — the features work as specified. What's missing is **non-functional quality**: performance under load, security hardening, architectural sustainability, and automated regression protection. The 78% real data figure is accurate and the AC pass rate is legitimate for Wave 1 scope.

---

## ENVIRONMENT

- Database: Neon PostgreSQL (24 tables, live data)
- Server: Express 5.0.1 + TypeScript
- Client: React 18 + Vite 7 + Tailwind 3.4
- ORM: Drizzle 0.39.3
- Auth: JWT (1hr access + 7d refresh)
- AI: Anthropic Claude + OpenAI GPT-4o + fal.ai
- Comms: TextMagic (SMS) + Resend (email) + VAPI (voice) + Tavus (video)
