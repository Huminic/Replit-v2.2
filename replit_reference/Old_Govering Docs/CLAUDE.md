# CLAUDE.md - Nexxus V2

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

**Nexxus V2** is a complete clean rebuild of the Nexxus AI-powered automotive dealership platform.

**Core Value Proposition**: Dealerships don't lose because of lead volume—they lose because of response gaps and execution failures. Nexxus fixes this through AI-powered voice, video, and chat interactions.

### Why Rebuild (Not Refactor)?

**Production System (v1):**
- Location: `/home/ubuntu/Claude-store/nexxus/`
- Status: **IN PRODUCTION** with paying customers (Serra Automotive, Hyundai of Columbia)
- Issues: 8,750+ issues found in audit (379 CRITICAL security vulnerabilities)
- Architecture: Technical debt accumulated over time

**V2 Strategy**: Complete isolation - build from scratch with zero risk to production.

## Critical Constraints

### 1. **NEVER TOUCH PRODUCTION**
- ❌ **DO NOT** modify `/home/ubuntu/Claude-store/nexxus/` directory
- ❌ **DO NOT** share credentials with v1
- ✅ Use NEW Supabase project, NEW API keys, DIFFERENT port

### 2. Implement Security-First
- ✅ Row-level security (RLS) from day 1
- ✅ Parameterized queries (NO SQL injection)
- ✅ Input validation on all endpoints
- ✅ JWT authentication with proper expiry
- ✅ Multi-tenant isolation at database level
- ✅ Audit logging for sensitive operations

### 3. Follow the Governing Documents
**4 Governing Documents (in priority order):**
1. **Constitution** — `docs/CONSTITUTION.md` — Identity, principles, development rules
2. **Master SRS** — `docs/MASTER_SRS.md` — 17 sections, 257 requirements (consolidated from SRS v3.0 + v3.1 + v3.2)
3. **Current-State Assessment** — `docs/CURRENT_STATE_ASSESSMENT.md` — 200 implemented, 38 partial, 10 gaps
4. **Implementation Plan** — `docs/IMPLEMENTATION_PLAN.md` — 10 phases, priority-ordered

These are the single source of truth. If any conflict with archived materials, the governing documents win.

### 4. **ALWAYS FOLLOW THE IMPLEMENTATION PLAN**
- ✅ Follow the plan step-by-step, sequentially
- ❌ **NEVER** ad-lib features or "do something else"
- ❌ **NEVER** skip ahead or work on later phases
- ❌ **NEVER** add features not in the current step
- ✅ Complete current step fully before moving to next
- ✅ If user asks for something not in plan, confirm first

**This is non-negotiable.** The plan exists for a reason. Stick to it.

### 5. **CUSTOMER ACCEPTANCE CRITERIA (Minimum Use Cases)**

These 5 capabilities define what the customer MUST be able to see, use, and manage. They are the acceptance bar — not just features, but working end-to-end use cases. All implementation work must track toward these. Everything else matters, but these are non-negotiable for customer sign-off.

| # | Use Case | Description | Status |
|---|----------|-------------|--------|
| AC-1 | **Automatic Outbound Call Triggering** | Trigger-based outbound calls via VAPI when conditions are met (new lead, hot lead, missed call, etc.) | Implemented — needs E2E verification |
| AC-2 | **Intelligent VIN Data Analysis** | DealerBrain answers dealership questions using live VIN Solutions data via Context Router | Implemented — depends on CR + OAuth |
| AC-3 | **Lead Insertion to VIN Solutions** | Leads captured by VAPI voice and Tavus video assistants are written back to VIN Solutions CRM | Implemented — sync pipeline fixed 2026-02-15, needs verification |
| AC-4 | **Accurate Dashboard Metrics** | Lead metrics, health scores, and data on dashboards are accurate, real-time, and usable | Phase 1 complete — CR enabled, excel excluded, source badges added |
| AC-5 | **Widget Deployment** | Centralized Master Widget config + individual hosted page widgets deployable per org | Fully implemented and deployed |

**Rule:** Every phase of work should identify which acceptance criteria it advances. If a phase doesn't advance at least one AC, question whether it belongs in the current sprint.

**Customer Onboarding Doc:** `docs/CUSTOMER_ONBOARDING_KICKOFF.md` — dependencies, decisions, per-org checklists for AC sign-off.

## VIN Solutions API Reference (CRITICAL)

**Official API documentation uploaded by the user:**
- `filestore/VinDocs/Leadmanagement.md` — OAS 3.0 spec: all endpoints, schemas, field formats
- `filestore/VinDocs/user_guide.md` — Auth guide, OAuth2 client credentials, header requirements

**ALWAYS consult these files before modifying VIN API integration code.** Key facts from the docs:

- `POST /leads` requires `leadSource`, `leadType`, and `contact` as **href references** (URL format like `/leadSources/id/36`), NOT string names
- `GET /leadSources?dealerId=X` returns valid lead source hrefs per dealer — query this before creating leads
- Gateway endpoints (`/gateway/v1/`) use `application/json`; newer endpoints use `application/vnd.coxauto.V3+json`
- Contact creation returns `ContactId` — convert to href: `/contacts/id/{ContactId}?dealerid={dealerId}`
- Bearer tokens expire every 60 minutes — implement caching (already done in `VinOAuthService`)

## Documentation Hierarchy

### Governing Documents (Start Here)
1. **`docs/MASTER_SRS.md`** - Consolidated specification (PENDING CREATION)
2. **`docs/CONSTITUTION.md`** - Platform identity, principles, success criteria (PENDING CREATION)
3. **`docs/CURRENT_STATE_ASSESSMENT.md`** - Honest diff of spec vs reality (PENDING CREATION)
4. **`docs/IMPLEMENTATION_PLAN.md`** - Forward-looking phase plan (PENDING CREATION)

### Context Documents
- **`docs/BRAIN_DUMP.md`** - User's narrative explanation of what Nexxus is and should be
- **`docs/BRAIN_DUMP_RAW.md`** - Original voice-to-text transcript (preserved for reference)

### Reference Documents (Still Active)
- `docs/ARCHITECTURE_GUIDE.md` - 4-layer architecture
- `docs/ARCHITECTURE_GUIDE_RBAC_ADDITION.md` - Partner/RBAC model
- `docs/ARCHITECTURE_VISUAL_MAP.md` - Visual diagrams & flow charts
- `docs/THEME_CONTRACT.md` - Theme system
- `docs/UI_DEVELOPER_HANDOFF.md` - UI patterns and component library
- `docs/VIN_SOLUTIONS_INTEGRATION.md` - OAuth2 architecture
- `docs/specifications/AGENT_ARCHITECTURE.md` - 4-tier agent hierarchy
- `docs/reference/PRODUCTION_CUSTOMER_DEPLOYMENTS.md` - What NOT to break

## File Management

### Uploads Directory
- **Location:** `./uploads/`
- **Purpose:** User-provided files (screenshots, data, assets)
- **SFTP Access:** `filestore/nexxus-v2/uploads/`
- **Git Status:** Excluded via .gitignore

**Upload Instructions:**
1. Mount SFTP: `/home/ubuntu/Claude-store/` → `~/filestore`
2. Navigate to: `filestore/nexxus-v2/uploads/`
3. Upload files
4. Reference: `./uploads/{filename}`

## Technology Stack

### Frontend
- Vite + React 18
- TypeScript (strict mode)
- Tailwind CSS + shadcn/ui
- Wouter (routing)
- TanStack Query (data fetching)

### Backend
- Node.js + Express
- TypeScript
- Supabase (PostgreSQL)
- VIN Solutions, VAPI, Tavus integrations

### Testing
- Jest + React Testing Library (unit/integration)
- Playwright (E2E)
- Target: 80% backend, 70% frontend coverage

## Development Approach

### 3-Proof Validation
Every feature requires THREE pieces of evidence:
1. **Configuration Test** - Verify configs, env vars, settings work
2. **Functional Test** - Verify feature works (unit/integration test)
3. **Visual/E2E Test** - Verify UI/API produces expected results

**No commits without 3 passing tests.**

### Evidence-Based Development
- Prove functionality with tests/screenshots/logs
- Configuration over code (database configs, env vars)
- Stop-and-resolve on blockers (NEVER work around silently)

## Current Project Status

**Phase:** MVP DEPLOYED - Post-MVP Development
**Deployment Date:** 2026-02-02
**V1 Status:** RETIRED (not in PM2)

### MVP Complete

| Component | Status |
|-----------|--------|
| V2 Running (PM2) | ✅ nexxus-v2 online |
| VAPI Webhooks | ✅ V2, org-isolated |
| Tavus Webhooks | ✅ V2 |
| Resend Email | ✅ Notifications routing |
| VIN Solutions | ✅ Live API |
| E2E Tests | ✅ 376/379 passing |
| Security Audit | ✅ 119 endpoints |
| RLS Audit | ✅ 53 policies, 28 tables |
| Database | ✅ 36 tables |

### Post-MVP Roadmap

**Roadmap File:** `~/.claude/plans/nexxus-v2-unified-roadmap.md`
**Design Flags:** `docs/DESIGN_FLAGS.md` (async decision review)

| Phase | Feature | Priority | Status |
|-------|---------|----------|--------|
| 6 | Credit Wiring | P0 | ✅ COMPLETE |
| 7 | Notifications System | P1 | ✅ COMPLETE |
| 8 | TextMagic SMS | P1 | ✅ COMPLETE |
| 9 | Bug Fixes & Tech Debt | P0 | ✅ COMPLETE |
| 10 | Master Widget | P0 | ✅ COMPLETE |
| 11 | Hosted Widget Pages | P1 | ✅ COMPLETE |
| 12 | Staff Messaging Inbox | P0 | ✅ COMPLETE |
| 13 | Tracking Pixel | P1 | ✅ COMPLETE |
| 14 | Agent Triggers | P1 | ✅ COMPLETE |
| 15 | AI Governance Stage 1 | P1 | ✅ COMPLETE |
| 16 | Goals Integration | P1 | ✅ COMPLETE |
| 17 | Google Calendar OAuth | P1 | ✅ COMPLETE |
| 18 | Drive & Artifacts | P2 | ✅ COMPLETE |
| 19 | Hunches & Approvals | P2 | ✅ COMPLETE |
| 20 | Leads & Demo Readiness | P2 | ✅ COMPLETE |

### Project Structure
```
nexxus-v2/
├── client/            # Vite + React frontend
├── server/            # Node.js/Express API
├── database/          # Supabase migrations (23 files)
├── tests/             # Playwright E2E (500+ tests)
├── docs/              # Documentation + user manuals
├── uploads/           # User uploads
├── .env               # Environment variables
└── .project/          # Project metadata
```

## Architecture Summary

### Webhook Flow
```
VAPI Call End → /api/webhooks/vapi → resolveOrganizationId() → Process
Tavus Session End → /api/webhooks/tavus → HMAC verify → Process
```

**Organization Isolation:** Webhooks only process events for assistants registered to specific organizations via `metadata.organizationId` or `assistantId` lookup.

### Integration Architecture
- **VIN Solutions:** OAuth 2.0 Client Credentials, QUERY-ONLY (no bidirectional sync)
- **VAPI:** Master API key, assistants tagged with org metadata
- **Tavus:** Master API key, personas tagged with org metadata
- **Resend:** Email notifications with database hierarchy routing

### Key Services
- `DealerBrainService` - Claude API integration with tool calling
- `CreditService` - Usage tracking (wired to webhooks in Phase 6)
- `VinSolutionsService` - OAuth + API client
- `AppointmentService` - Calendar CRUD with RBAC
- `EmailService` - IMAP/SMTP operations

### Database Layer
- `SecureQueryBuilder` - Enforces RLS context on every query
- `DatabaseStorage` - Core data access with organization isolation
- All tables have RLS policies for multi-tenant isolation

## Deployment Workflow

### CRITICAL: Feature Branch Workflow
- **NEVER** deploy from a feature branch
- **ALWAYS** work on feature branches for post-MVP development
- **ONLY** deploy after merging to master

### How It Works
```
Working Directory → TypeScript (.ts files)
                 ↓ npm run build
              dist/ → Compiled JavaScript (.cjs)
                 ↓ PM2 serves
            Webserver → Users see compiled code
```

The webserver runs compiled code from `dist/`. Editing `.ts` files does NOT affect the webserver until you rebuild.

### Safe Deployment Script
**Always use `./deploy.sh`** - it prevents deploying from feature branches:

```bash
./deploy.sh
```

The script:
1. Checks you're on `master` branch (fails if not)
2. Warns about uncommitted changes
3. Runs `npm run build`
4. Restarts PM2

### Feature Branch Workflow
```bash
# 1. Create feature branch
git checkout -b feature/phase-{N}-{name}

# 2. Do work, commit changes
# (webserver unchanged - still serving old dist/)

# 3. When ready, merge to master
git checkout master
git merge feature/phase-{N}-{name}

# 4. Deploy
./deploy.sh

# 5. Clean up
git branch -d feature/phase-{N}-{name}
```

## How to Continue Work

### Before Starting Any Work
1. Read `session-state.md` in this project's auto memory directory for session context
2. Read the 4 governing documents (see Documentation Hierarchy above)
3. Read `docs/BRAIN_DUMP.md` for user's stated intent
4. **Create feature branch:** `git checkout -b feature/{name}`
5. Follow the Implementation Plan sequentially
6. Run E2E tests before merging
7. **Deploy only from master:** `./deploy.sh`

## Development Notes

### User Roles (4-Tier RBAC)
- **Super Admin** - Provisions tools, manages partners, system-wide access
- **Partner Admin** - Manages multiple assigned organizations
- **Org Admin** - Manages users and settings within organization(s)
- **Org Staff** - Uses agents and views insights

### Key Features
- **DealerBrain** - AI command palette (⌘K) for dealership operations
- **Agents** - Voice (VAPI), Video (Tavus), Task automation
- **Insights** - 3 default cards (Voice Agent, Video Data, VIN Lead Feed)
- **Work Center** - Messages, Calendar, Tasks, Hunches, Approvals
- **Drive** - File management and templates

### Economics
- Voice AI: $0.25/min (customer) / $0.15/min (cost) = 40% margin
- Video AI: $0.32/min (customer) / $0.20/min (cost) = 37.5% margin
- SMS: $0.05/msg (customer) / $0.02/msg (cost) = 60% margin

## Archived Materials (Pre-Stabilization)

**Location:** `docs/archive/pre-stabilization/`

This directory contains 40+ files archived on 2026-02-16 during a "second wave fresh start" alignment exercise. These files include the original SRS v3.0, addendums v3.1/v3.2, old implementation plans, user manuals, ad-hoc scripts, decision logs, and 37 old plan files.

**WARNING:** This material may contain answers to questions about past decisions or architecture, BUT:
- Do NOT treat archived content as current truth
- Do NOT use archived information without confirming it against the current governing documents and codebase
- Many archived docs contain contradictory or outdated information — that is WHY they were archived
- The 4 governing documents (Master SRS, Constitution, Current-State Assessment, Implementation Plan) supersede everything in this archive

**Subdirectories:**
- `scripts/` — 16 ad-hoc diagnostic/import scripts
- `old-plans/` — 37 old plan files from ~/.claude/plans/
- `.project/` files archived with `project-` prefix

## Documentation Maintenance

### Automa Knowledge Sync
When updating DealerBrain/Automa functionality:
1. Update `server/services/DealerBrainService.ts` system prompt
2. Update `docs/automa-knowledge/SYSTEM_KNOWLEDGE.md` with matching info
3. Test that Automa correctly answers questions about new features

### Feedback Collection
User feedback is automatically collected:
- Log file: `docs/user-feedback/feedback-log.txt`
- Super Admin notifications for real-time visibility

---

**Global Configuration:** See `~/.claude/CLAUDE.md` for global preferences and methodology.

**Last Updated:** 2026-02-16
**Status:** Second Wave Fresh Start — Alignment & Stabilization In Progress
**Current Branch:** `master`
**Next Steps:** Complete 4 governing documents, then execute stabilization plan
