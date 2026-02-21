# Nexxus V2 — Project Health Audit

**Audit Date:** 2026-02-21
**Auditor:** Forensic Code Audit (automated)
**Project Path:** `/home/ubuntu/Claude-store/nexxus-v2`
**Current Branch:** `master`
**Live URL:** https://nexxusv2.huminicdev.com

---

## 1. Executive Summary

| Metric | Value |
|--------|-------|
| Total TypeScript files (.ts) | 262 |
| Total React files (.tsx) | 140 |
| Total source files (TS + TSX) | 402 |
| Total lines of code (TS + TSX) | 117,693 |
| Total commits | 181 |
| Project age | 31 days (2026-01-21 to 2026-02-21) |
| Average commits/day | 5.8 |
| E2E test files | 46 |
| E2E test cases | 747 |
| API endpoints | 237 |
| Database migrations | 33 |
| npm dependencies | 122 (91 prod + 31 dev) |
| Known vulnerabilities | 7 (0 critical, 4 high, 2 moderate, 1 low) |
| PM2 status | Online (PID 1616575, 148.9 MB, 2D uptime) |

---

## 2. Test Inventory

### 2.1 Test File Breakdown

| Category | Files | Test Cases |
|----------|-------|------------|
| E2E (Playwright) | 46 | 747 |
| Verification scripts | 11 | N/A (manual run) |
| Smoke/Env tests | 4 | N/A (manual run) |
| Utility scripts | 7 | N/A (diagnostic) |
| **Total** | **68** | **747+ (E2E)** |

**Zero unit tests exist.** There are no Jest configuration files. No `*.unit.ts`, `*.unit.test.ts`, or dedicated unit test directories. All automated testing is E2E via Playwright. The verification scripts under `tests/verification/` and `tests/scripts/` are manually-invoked diagnostic utilities, not automated test suites.

### 2.2 E2E Test Categorization

#### Core Platform (156 tests across 8 files)

| File | Tests | Coverage Area |
|------|-------|---------------|
| `auth.spec.ts` | 19 | Login, logout, session, JWT |
| `navigation.spec.ts` | 28 | Sidebar, routing, breadcrumbs |
| `dashboard.spec.ts` | 7 | Dashboard UI rendering |
| `dashboard-api.spec.ts` | 8 | Dashboard API endpoints |
| `rbac.spec.ts` | 23 | Role-based access control (4 tiers) |
| `profile.spec.ts` | 29 | User profile management |
| `users.spec.ts` | 17 | User CRUD operations |
| `settings.spec.ts` | 25 | Settings page tabs |

#### Feature Tests (135 tests across 8 files)

| File | Tests | Coverage Area |
|------|-------|---------------|
| `agents.spec.ts` | 18 | Voice/Video agent management |
| `chat.spec.ts` | 18 | DealerBrain chat interface |
| `credits.spec.ts` | 12 | Credit/usage tracking |
| `insights.spec.ts` | 23 | Insights dashboard cards |
| `work-center.spec.ts` | 16 | Messages, tasks, calendar |
| `dealerbrain-persona.spec.ts` | 34 | AI persona behavior |
| `product-tour.spec.ts` | 5 | Onboarding tour |
| `webhook-vapi.spec.ts` | 9 | VAPI webhook processing |

#### Sprint Feature Tests (199 tests across 11 files)

| File | Tests | Coverage Area |
|------|-------|---------------|
| `sprint-10-widget.spec.ts` | 14 | Master widget configuration |
| `sprint-11-hosted-pages.spec.ts` | 13 | Per-org hosted widget pages |
| `sprint-12-staff-inbox.spec.ts` | 20 | Staff messaging inbox |
| `sprint-13-tracking-pixel.spec.ts` | 20 | Analytics tracking pixel |
| `sprint-14-agent-triggers.spec.ts` | 21 | Automated agent triggers |
| `sprint-15-ai-governance.spec.ts` | 20 | AI governance controls |
| `sprint-16-goals.spec.ts` | 21 | Goal setting and tracking |
| `sprint-17-google-calendar.spec.ts` | 20 | Google Calendar OAuth |
| `sprint-18-drive.spec.ts` | 20 | File management / Drive |
| `sprint-19-hunches-approvals.spec.ts` | 20 | Hunches & approval workflows |
| `sprint-20-leads-demo.spec.ts` | 10 | Leads management + demo |

#### Quality / Verification Tests (124 tests across 6 files)

| File | Tests | Coverage Area |
|------|-------|---------------|
| `data-quality.spec.ts` | 12 | Data integrity checks |
| `integration-accuracy.spec.ts` | 8 | API integration correctness |
| `silent-failures.spec.ts` | 9 | Error handling / silent failure detection |
| `demo-validation.spec.ts` | 18 | Demo readiness validation |
| `devils-advocate-verification.spec.ts` | 51 | Adversarial edge case testing |
| `phase-7-certification.spec.ts` | 26 | Phase 7 feature certification |

#### Stabilization Tests (28 tests across 6 files)

| File | Tests | Coverage Area |
|------|-------|---------------|
| `stabilization-agents.spec.ts` | 5 | Agent stability checks |
| `stabilization-dealerbrain.spec.ts` | 4 | DealerBrain stability |
| `stabilization-drive.spec.ts` | 6 | Drive feature stability |
| `stabilization-reports.spec.ts` | 3 | Report generation |
| `stabilization-widget-controls.spec.ts` | 3 | Widget control stability |
| `stabilization-work-hub.spec.ts` | 7 | Work hub stability |

#### Regression Sprint Tests (105 tests across 7 files)

| File | Tests | Coverage Area |
|------|-------|---------------|
| `sprint-r1-demo.spec.ts` | 18 | Demo regression round 1 |
| `sprint-r2-demo.spec.ts` | 7 | Demo regression round 2 |
| `sprint-r3-insights.spec.ts` | 5 | Insights regression |
| `sprint-r4-rbac.spec.ts` | 41 | RBAC regression (largest suite) |
| `sprint-r5-crud.spec.ts` | 6 | CRUD regression |
| `sprint-r6-comms.spec.ts` | 5 | Communications regression |
| `sprint-r7-pages.spec.ts` | 23 | Pages regression |

### 2.3 Non-E2E Test Files (22 files)

**Verification scripts** (`tests/verification/`): 11 files
- `communications-accuracy.ts`, `crud-accuracy.ts`, `dealerbrain-accuracy.ts`
- `insights-accuracy.ts`, `multi-org-insights-accuracy.ts`
- `stabilization-dealer-pulse.ts`, `stabilization-hunches.ts`
- `stabilization-insights.ts`, `stabilization-org-isolation.ts`
- `stabilization-triggers.ts`, `stabilization-vin-roundtrip.ts`
- `stabilization-vin-sync.ts`

**Diagnostic scripts** (`tests/scripts/`): 7 files
- `check-enrichment-health.ts`, `elliott-test-v2.ts`, `fix-vin-contacts.ts`
- `re-enrich-leads.ts`, `test-vin-contacts.ts`, `vapi-backfill.ts`, `vapi-cross-reference.ts`

**Top-level test utilities** (`tests/`): 4 files
- `data-accuracy.ts` (run via `npm run test:accuracy`)
- `dealerbrain-smoke.ts` (run via `npm run test:smoke`)
- `env-check.ts` (run via `npm run test:env`)
- `e2e-mvp-verification.ts`

### 2.4 Test Infrastructure

| Component | Detail |
|-----------|--------|
| Framework | Playwright ^1.58.1 |
| Config | `playwright.config.ts` |
| Global setup | `tests/e2e/helpers/global-setup.ts` |
| Utilities | `tests/e2e/helpers/test-utils.ts` |
| Base URL | `https://nexxusv2.huminicdev.com` |
| Browser | Chromium (Desktop Chrome, 1280x720) |
| Parallelism | Fully parallel (local), 1 worker (CI) |
| Retries | 0 (local), 2 (CI) |
| Artifacts | Screenshots on failure, video on failure, trace on first retry |
| Output | `test-results/` directory, HTML reporter |

### 2.5 Test Gap Analysis

| Area | Status |
|------|--------|
| Unit tests (Jest) | **MISSING** -- No configuration, no files |
| Integration tests (API-level) | **MISSING** -- Covered partially by E2E |
| Component tests (React Testing Library) | **MISSING** |
| Load/performance tests | **MISSING** |
| Security-specific tests | **MISSING** (RLS verified via E2E only) |
| Test coverage reporting | **NOT CONFIGURED** |

---

## 3. Git History Analysis

### 3.1 Timeline

| Metric | Value |
|--------|-------|
| First commit | 2026-01-21 |
| Latest commit | 2026-02-19 |
| Project age | 31 days |
| Total commits | 181 |
| Average | 5.8 commits/day |

### 3.2 Commit Frequency by Week

| Period | Commits | Rate |
|--------|---------|------|
| 2026-01-21 to 2026-01-24 | 9 | Ramp-up |
| 2026-01-24 to 2026-01-31 | 8 | Early development |
| 2026-01-31 to 2026-02-07 | 63 | Peak sprint (MVP push) |
| 2026-02-07 to 2026-02-14 | 66 | Peak sprint (stabilization) |
| 2026-02-14 to 2026-02-21 | 35 | Post-stabilization |

### 3.3 Commit Frequency by Day (Last 50 Commits)

| Date | Commits |
|------|---------|
| 2026-02-18 | 13 |
| 2026-02-17 | 12 |
| 2026-02-13 | 11 |
| 2026-02-16 | 4 |
| 2026-02-12 | 4 |
| 2026-02-19 | 3 |
| 2026-02-15 | 3 |

### 3.4 Commit Message Convention

| Prefix | Count | Percentage |
|--------|-------|------------|
| `fix:` | 57 | 31.5% |
| `feat:` | 30 | 16.6% |
| `docs:` | 17 | 9.4% |
| `chore:` | 4 | 2.2% |
| `test:` | 3 | 1.7% |
| `refactor:` | 1 | 0.6% |
| `merge:` | 1 | 0.6% |
| `[P#.F#]` tagged | 11 | 6.1% |
| Other/untagged | 57 | 31.5% |

**Observation:** Fix commits outnumber feature commits nearly 2:1, indicating significant post-build stabilization work. 31.5% of commits have no conventional prefix.

### 3.5 Average Commit Size (Last 20 Commits)

- **8 files** changed per commit
- **+1,128 insertions** per commit
- **-304 deletions** per commit

This is a high churn rate -- commits are large, averaging over 1,100 lines added each. Indicates batched changes rather than atomic commits.

### 3.6 Branch Analysis

| Metric | Value |
|--------|-------|
| Local branches | 19 |
| Remote branches | 1 (origin/main) |
| Git tags | 0 |
| Current branch | master |

**Local branches (18 feature + 1 master):**
- `feature/command-center-dashboard`
- `feature/phase-1-data-accuracy`
- `feature/phase-10-final`
- `feature/phase-10-widget`
- `feature/phase-12-staff-inbox`
- `feature/phase-13-tracking`
- `feature/phase-15-chat-enhancements`
- `feature/phase-16-auth`
- `feature/phase-2-acceptance-criteria`
- `feature/phase-3-widget-readiness`
- `feature/phase-4-6-p1-tier`
- `feature/phase-7-10-p2-tier`
- `feature/phase-7-10-remaining`
- `feature/phase-7-notifications`
- `feature/phase-r-demo-ready`
- `feature/stabilization-sprint`
- `feature/stabilization-waves-0-3`
- `github-backup-feb6-2026`

**Finding:** 18 stale feature branches have not been cleaned up after merge. No git tags exist for releases or milestones.

### 3.7 Contributors

| Author | Commits | Percentage |
|--------|---------|------------|
| Claude Code | 181 | 100% |

The entire codebase was authored by AI (Claude Code). No human commits detected in the git log.

---

## 4. Package Dependencies

### 4.1 Dependency Counts

| Category | Count |
|----------|-------|
| Production dependencies | 91 |
| Dev dependencies | 31 |
| **Total** | **122** |

### 4.2 Key Production Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| `express` | ^5.0.1 | HTTP server (Express 5 -- pre-release) |
| `react` | ^18.3.1 | UI framework |
| `pg` | ^8.16.3 | PostgreSQL client |
| `@anthropic-ai/sdk` | ^0.72.1 | Claude AI integration |
| `@vapi-ai/server-sdk` | ^0.11.0 | Voice AI agent |
| `jsonwebtoken` | ^9.0.3 | JWT authentication |
| `bcrypt` | ^6.0.0 | Password hashing |
| `zod` | ^3.24.2 | Schema validation |
| `drizzle-orm` | ^0.39.3 | ORM (type-safe SQL) |
| `helmet` | ^8.1.0 | Security headers |
| `express-rate-limit` | ^8.2.1 | Rate limiting |
| `resend` | ^6.9.1 | Email delivery |
| `socket.io` | ^4.8.3 | WebSocket (real-time) |
| `wouter` | ^3.3.5 | Client-side routing |
| `@tanstack/react-query` | ^5.60.5 | Server state management |
| `puppeteer` | ^24.37.2 | Headless browser (PDF/screenshots) |
| `imapflow` | ^1.2.8 | IMAP email client |
| `nodemailer` | ^7.0.13 | SMTP email sending |
| `xlsx` | ^0.18.5 | Excel file parsing |
| `multer` | ^2.0.2 | File upload handling |
| `pdf-parse` | ^1.1.1 | PDF text extraction |

**Notable:** Express 5 is used (`^5.0.1`). This is a pre-release major version with breaking changes from Express 4.

### 4.3 UI Component Libraries (25 Radix packages)

The project uses 25 `@radix-ui/react-*` packages for the component primitives (shadcn/ui pattern). Additional UI libraries: `lucide-react` (icons), `recharts` (charts), `framer-motion` (animations), `cmdk` (command palette), `embla-carousel-react` (carousel), `vaul` (drawer), `driver.js` (guided tours), `@tiptap/*` (rich text editor), `@fullcalendar/*` (calendar).

### 4.4 Dev Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| `typescript` | 5.6.3 | Type checking |
| `vite` | ^7.3.0 | Build tool + dev server |
| `@playwright/test` | ^1.58.1 | E2E testing |
| `tailwindcss` | ^3.4.17 | CSS utility framework |
| `esbuild` | ^0.25.0 | Server bundling |
| `drizzle-kit` | ^0.31.8 | Database migrations |
| `tsx` | ^4.20.5 | TypeScript execution |
| `preact` | ^10.28.3 | React alternative (widget) |

### 4.5 Vulnerability Report (npm audit)

| Severity | Count | Packages |
|----------|-------|----------|
| Critical | 0 | -- |
| High | 4 | `minimatch` (ReDoS), `glob` (transitive), `sucrase` (transitive), `xlsx` (prototype pollution + ReDoS) |
| Moderate | 2 | `lodash` (prototype pollution), `markdown-it` (ReDoS) |
| Low | 1 | `qs` (arrayLimit bypass DoS) |
| **Total** | **7** | |

**Fixable:** 5 of 7 via `npm audit fix`. The `xlsx` vulnerabilities (2 advisories) have **no fix available** -- the package itself is the issue.

### 4.6 Lock File

- **Package manager:** npm
- **Lock file:** `package-lock.json` (437 KB, last modified 2026-02-13)

---

## 5. Build System

### 5.1 Build Pipeline

The build is orchestrated by `script/build.ts` (executed via `npm run build` -> `tsx script/build.ts`):

```
Step 1: rm -rf dist/
Step 2: viteBuild()           -> dist/public/        (client SPA)
Step 3: viteBuild(widget)     -> dist/public/widget/  (embeddable widget)
Step 4: esbuild(tracking)     -> dist/public/widget/nexxus-pixel.js (IIFE, minified)
Step 5: esbuild(server)       -> dist/index.cjs       (CJS, minified, selective bundling)
```

### 5.2 Vite Configuration (`vite.config.ts`)

| Setting | Value |
|---------|-------|
| Framework plugin | `@vitejs/plugin-react` |
| Client root | `client/` |
| Output | `dist/public/` |
| Path aliases | `@` -> `client/src/`, `@shared` -> `shared/`, `@assets` -> `attached_assets/` |
| FS strict mode | `true` (denies dotfiles) |
| Replit plugins | Conditional (dev only, if `REPL_ID` set) |

### 5.3 Widget Build

Separate Vite configuration at `widget/vite.config.ts` with its own `tsconfig.json` and `postcss.config.js`. Uses Preact (`@preact/preset-vite`) for smaller bundle size.

### 5.4 Server Build (esbuild)

| Setting | Value |
|---------|-------|
| Platform | Node.js |
| Format | CommonJS (`dist/index.cjs`) |
| Minified | Yes |
| Bundling strategy | Selective -- 25 packages bundled (allowlist), rest external |
| Production env | Defined at build time |

The allowlist bundles heavy dependencies (Express, Drizzle, Zod, etc.) to reduce filesystem `openat(2)` syscalls at cold start. Other packages remain external and loaded from `node_modules` at runtime.

### 5.5 NPM Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `build` | `tsx script/build.ts` | Full production build |
| `build:widget` | `cd widget && npx vite build` | Widget-only build |
| `check` | `tsc` | TypeScript type checking (no emit) |
| `db:push` | `drizzle-kit push` | Apply DB schema changes |
| `dev` | `NODE_ENV=development tsx server/index.ts` | Development server |
| `start` | `NODE_ENV=production node dist/index.cjs` | Production server |
| `test:accuracy` | `npx tsx tests/data-accuracy.ts` | Data accuracy verification |
| `test:env` | `npx tsx tests/env-check.ts` | Environment check |
| `test:quality` | `check && build && test:env && test:accuracy` | Full quality gate |
| `test:smoke` | `npx tsx tests/dealerbrain-smoke.ts` | DealerBrain smoke test |

**Missing scripts:** No `lint`, `format`, `test` (Playwright), or `test:unit` scripts defined.

---

## 6. Deployment Setup

### 6.1 PM2 Process Manager

| Metric | Value |
|--------|-------|
| Process name | `nexxus-v2` |
| PM2 ID | 13 |
| Status | Online |
| PID | 1616575 |
| Uptime | 2 days (as of audit) |
| Created | 2026-02-19T15:40:07.175Z |
| Total restarts | 3,327 |
| Unstable restarts | 0 |
| Memory usage | 148.9 MB |
| CPU usage | 0.2% |
| PM2 version | 6.0.13 |

**Finding:** 3,327 restarts is very high for a 31-day-old project. This averages ~107 restarts/day. All restarts are classified as "stable" (0 unstable restarts), suggesting they are triggered by deployments and `pm2 restart` commands rather than crashes.

**Finding:** No `ecosystem.config.cjs` or `ecosystem.config.js` PM2 configuration file exists. The process was likely started with `pm2 start` CLI arguments, making the configuration non-reproducible without manual intervention.

### 6.2 Deploy Script (`deploy.sh`)

| Feature | Status |
|---------|--------|
| Branch guard | Yes -- only allows `master` |
| Uncommitted change warning | Yes -- prompts y/N |
| Build step | `npm run build` |
| Restart | `pm2 restart nexxus-v2` |
| Post-deploy verification | Shows `pm2 status` output |
| Rollback mechanism | **NONE** |
| Pre-deploy tests | **NONE** |
| Health check | **NONE** |

**Gaps:** No pre-deploy test run (E2E or smoke). No health check after restart. No rollback mechanism if deploy fails.

### 6.3 Environment

| Component | Version |
|-----------|---------|
| Node.js | v20.19.5 |
| npm | 10.8.2 |
| PM2 | 6.0.13 |
| Platform | Linux 5.15.0-1081-oracle (Oracle Cloud) |

### 6.4 Environment Variables

- **33 environment variables** configured in `.env`
- `.env` is in `.gitignore` (verified)
- No `.env.example` or `.env.template` file exists for documentation

### 6.5 Infrastructure

| Component | Status |
|-----------|--------|
| Docker | **NOT USED** -- No Dockerfile or docker-compose |
| CI/CD | **NOT CONFIGURED** -- No `.github/` directory |
| Container orchestration | None |
| Reverse proxy | External (Caddy, managed by sysadmin) |
| SSL | External (managed by sysadmin) |

### 6.6 Disk Usage

| Directory | Size |
|-----------|------|
| Source code + docs + assets | 34 MB |
| `node_modules/` | 575 MB |
| `dist/` (build output) | 12 MB |
| **Total project** | **656 MB** |

---

## 7. Code Quality

### 7.1 TypeScript Configuration

| Setting | Value | Assessment |
|---------|-------|------------|
| `strict` | `true` | Good -- full strict mode enabled |
| `noEmit` | `true` | Good -- type-check only, no TS emit |
| `module` | `ESNext` | Good -- modern module system |
| `moduleResolution` | `bundler` | Good -- matches Vite |
| `skipLibCheck` | `true` | Acceptable -- faster type-checking |
| `incremental` | `true` | Good -- faster rebuilds |
| `esModuleInterop` | `true` | Standard |
| `target` | Not set | Uses default (ES3) -- potentially suboptimal |

### 7.2 TypeScript Escape Hatches

| Directive | Count | Location |
|-----------|-------|----------|
| `@ts-nocheck` | 2 | Both in archived scripts (`docs/archive/pre-stabilization/scripts/`) |
| `@ts-ignore` | 1 | `widget/src/channels/WebAudio.tsx` |
| `@ts-expect-error` | 0 | None |
| `: any` type (server) | 325 | Across server `.ts` files |
| `: any` type (client) | 55 | Across client `.ts`/`.tsx` files |
| **Total `any` usage** | **380** | |

**Finding:** 380 explicit `any` annotations across the codebase is significant. Server code accounts for 85.5% of `any` usage (325/380). The `@ts-nocheck` files are in archived scripts only, not active code. The single `@ts-ignore` is in the widget's WebAudio channel.

### 7.3 Linting and Formatting

| Tool | Status |
|------|--------|
| ESLint | **NOT CONFIGURED** -- No `.eslintrc*` or `eslint.config.*` |
| Prettier | **NOT CONFIGURED** -- No `.prettierrc*` or `prettier.config.*` |
| EditorConfig | **NOT CONFIGURED** -- No `.editorconfig` |
| Pre-commit hooks | **NOT CONFIGURED** -- No `.husky/` or lint-staged |

**Finding:** No automated code quality enforcement exists. No linter, no formatter, no pre-commit hooks. Code style consistency depends entirely on the AI author's self-consistency.

### 7.4 Console.log Statements

- **242 `console.log` statements** in server code
- No structured logging library (Winston, Pino, etc.) detected
- No log levels, no log rotation, no correlation IDs

### 7.5 `.gitignore` Configuration

- 75 lines in `.gitignore`
- Covers: `node_modules/`, `dist/`, `.env`, `uploads/`, test artifacts, IDE files

---

## 8. Codebase Structure and File Counts

### 8.1 File Counts by Type

| Extension | Count |
|-----------|-------|
| `.ts` (TypeScript) | 262 |
| `.tsx` (React TSX) | 140 |
| `.sql` (Migrations) | 33 |
| **Total source** | **435** |

### 8.2 Lines of Code by Area

| Area | Lines | Percentage |
|------|-------|------------|
| Server (`server/`) | 47,479 | 40.3% |
| Client TSX (`client/*.tsx`) | 35,991 | 30.6% |
| Client TS (`client/*.ts`) | 7,557 | 6.4% |
| Tests (`tests/`) | 18,869 | 16.0% |
| Database SQL (`database/`) | 4,045 | 3.4% |
| Shared (`shared/`) | 18 | 0.0% |
| **Total** | **113,959** | **~97%** |

Remaining ~3,734 lines are in root configs, scripts, widget source, etc.

### 8.3 Server Breakdown

| Category | Files |
|----------|-------|
| Server total | 115 |
| Routes | 35 |
| Services | 51 |
| Middleware | 4 |
| Other (webhooks, utils, types) | 25 |

### 8.4 Client Breakdown

| Category | Files |
|----------|-------|
| Client TSX total | 132 |
| Client TS total | 42 |
| Pages | 21 |
| Components | 104 |
| Hooks | 27 |
| Other (utils, types, lib) | 22 |

### 8.5 API Surface

| Metric | Count |
|--------|-------|
| Route files | 34 |
| Total endpoints (GET/POST/PUT/DELETE/PATCH) | 237 |
| Webhook handlers | 2 (VAPI, Tavus) |

### 8.6 Largest Files (Complexity Hotspots)

| File | Lines | Area |
|------|-------|------|
| `server/services/DealerBrainService.ts` | 3,047 | AI service + tools |
| `server/services/DealerBrainStreamingService.ts` | 2,020 | SSE streaming |
| `client/src/components/settings/WidgetSettingsTab.tsx` | 1,867 | Widget config UI |
| `client/src/pages/settings.tsx` | 1,611 | Settings page |
| `server/routes/admin.ts` | 1,454 | Admin API (14 endpoints) |
| `server/services/TriggerService.ts` | 1,413 | Trigger automation |
| `server/services/AppointmentService.ts` | 1,248 | Calendar appointments |
| `client/src/components/settings/TriggersSettingsTab.tsx` | 1,235 | Trigger config UI |
| `server/services/vinSolutionsService.ts` | 1,134 | VIN Solutions API client |
| `server/services/TextMagicService.ts` | 1,130 | SMS service |

**Finding:** `DealerBrainService.ts` at 3,047 lines is the single largest file and likely the most complex. Files over 1,000 lines represent potential refactoring targets.

### 8.7 Database

| Metric | Value |
|--------|-------|
| Migration files | 33 (001 through 033) |
| Migration SQL lines | 4,045 |
| Shared schema | 18 lines (minimal) |
| Tables (per CLAUDE.md) | 36 |
| RLS policies (per CLAUDE.md) | 53 |

---

## 9. Dependency Health Matrix

### 9.1 Critical Path Dependencies

| Dependency | Pinned? | Latest? | Risk |
|------------|---------|---------|------|
| `express` ^5.0.1 | Caret | Pre-release major (Express 5) | MEDIUM -- API changes possible |
| `typescript` 5.6.3 | Exact | No (5.7+ available) | LOW |
| `vite` ^7.3.0 | Caret | Recent | LOW |
| `react` ^18.3.1 | Caret | React 19 released | LOW -- intentionally on 18 |
| `pg` ^8.16.3 | Caret | Recent | LOW |
| `drizzle-orm` ^0.39.3 | Caret | Pre-1.0 | MEDIUM -- breaking changes |
| `xlsx` ^0.18.5 | Caret | Vulnerable, no fix | HIGH -- 2 known vulnerabilities |
| `puppeteer` ^24.37.2 | Caret | Large dependency | MEDIUM -- 575 MB node_modules contributor |

### 9.2 Vulnerability Action Items

| Package | Advisory | Fix Available |
|---------|----------|---------------|
| `xlsx` | GHSA-4r6h-8v6p-xvw6 (prototype pollution) | No fix -- consider alternative (e.g., `exceljs`) |
| `xlsx` | GHSA-5pgg-2g8v-p4x9 (ReDoS) | No fix -- same package |
| `minimatch` | GHSA-3ppc-4f35-3m26 (ReDoS) | Yes -- `npm audit fix` |
| `lodash` | GHSA-xxjr-mmjv-4gpg (prototype pollution) | Yes -- `npm audit fix` |
| `markdown-it` | GHSA-38c4-r59v-3vqw (ReDoS) | Yes -- `npm audit fix` |
| `qs` | GHSA-w7fw-mjwx-w883 (DoS) | Yes -- `npm audit fix` |

---

## 10. Risk Summary

### 10.1 High Priority Findings

| # | Finding | Impact | Recommendation |
|---|---------|--------|----------------|
| 1 | **Zero unit tests** | No isolated logic testing; all validation via E2E | Add Jest + unit tests for services (DealerBrain, Trigger, VIN) |
| 2 | **No linter or formatter** | Code style drift, no automated quality gate | Add ESLint + Prettier with pre-commit hooks |
| 3 | **380 `any` type usages** | Undermines TypeScript strict mode benefits | Gradual `any` elimination campaign |
| 4 | **242 console.log** in server | No structured logging, no log levels | Replace with Pino or Winston |
| 5 | **No CI/CD pipeline** | Manual deploys only, no automated testing on push | Add GitHub Actions workflow |
| 6 | **No deploy rollback** | Failed deploy requires manual intervention | Add rollback mechanism to deploy.sh |
| 7 | **`xlsx` vulnerability** | 2 high-severity CVEs with no fix | Evaluate replacing with `exceljs` |
| 8 | **18 stale feature branches** | Git hygiene; confusion risk | Delete merged branches |

### 10.2 Medium Priority Findings

| # | Finding | Impact | Recommendation |
|---|---------|--------|----------------|
| 9 | No PM2 ecosystem config | Non-reproducible process configuration | Create `ecosystem.config.cjs` |
| 10 | No `.env.example` | New developers cannot set up environment | Create template with dummy values |
| 11 | 3,047-line DealerBrainService | Maintenance complexity | Extract into sub-services |
| 12 | No git tags or releases | No version tracking | Tag releases (semver) |
| 13 | Express 5 pre-release | Potential breaking changes on update | Monitor Express 5 stability |
| 14 | No health check in deploy | Silent deploy failures possible | Add HTTP health check post-restart |
| 15 | `target` not set in tsconfig | Defaults to ES3 (irrelevant since noEmit) | Set explicitly for documentation |

### 10.3 Low Priority Findings

| # | Finding | Impact | Recommendation |
|---|---------|--------|----------------|
| 16 | Shared schema is 18 lines | Minimal type sharing | Expand shared types between client/server |
| 17 | Replit plugins in vite config | Dead code for non-Replit environments | Remove or gate more clearly |
| 18 | Test coverage not measured | Cannot track regression | Configure coverage reporting |

---

## 11. Positive Findings

| # | Finding | Detail |
|---|---------|--------|
| 1 | TypeScript strict mode | Enabled and enforced via `npm run check` |
| 2 | Comprehensive E2E suite | 747 test cases across 46 files covering all features |
| 3 | Consistent branch workflow | Feature branches with master-only deploys |
| 4 | Security primitives | Helmet, rate limiting, bcrypt, JWT, RLS (53 policies) |
| 5 | Build optimization | Selective bundling for cold start performance |
| 6 | Zod validation | Schema validation library in use |
| 7 | Environment isolation | Separate Supabase project from v1, different ports |
| 8 | Deploy safety | Branch guard prevents accidental feature branch deploys |
| 9 | Radix UI primitives | Accessible component library (25 packages) |
| 10 | Multi-output build | Client SPA + embeddable widget + tracking pixel + server in one build |

---

## 12. Metrics Dashboard

```
CODEBASE SIZE
  Source files ........... 402 (.ts + .tsx)
  Lines of code .......... 117,693
  Server lines ........... 47,479  (40%)
  Client lines ........... 43,548  (37%)
  Test lines ............. 18,869  (16%)
  SQL lines .............. 4,045   (3%)

TEST COVERAGE
  E2E spec files ......... 46
  E2E test cases ......... 747
  Verification scripts ... 11
  Unit tests ............. 0
  Test-to-code ratio ..... 16% (by lines)

API SURFACE
  Route files ............ 34
  Endpoints .............. 237
  Webhook handlers ....... 2
  Database tables ........ 36
  RLS policies ........... 53
  Migrations ............. 33

DEPENDENCIES
  Production ............. 91
  Development ............ 31
  Vulnerabilities ........ 7 (0 critical)

GIT HEALTH
  Commits ................ 181
  Branches (local) ....... 19
  Tags ................... 0
  Contributors ........... 1 (Claude Code)
  Project age ............ 31 days

DEPLOYMENT
  PM2 restarts ........... 3,327
  Memory usage ........... 148.9 MB
  Current uptime ......... 2 days
  Build outputs .......... 4 (client, widget, pixel, server)

CODE QUALITY
  TypeScript strict ...... YES
  ESLint ................. NOT CONFIGURED
  Prettier ............... NOT CONFIGURED
  Pre-commit hooks ....... NOT CONFIGURED
  `any` type count ....... 380
  console.log count ...... 242
  @ts-nocheck ............ 2 (archived only)
  @ts-ignore ............. 1 (widget)
```

---

*End of audit. Generated 2026-02-21.*
