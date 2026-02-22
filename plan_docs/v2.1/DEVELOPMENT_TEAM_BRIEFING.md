# Development Team Briefing

**From:** Previous development session (forensic audit + 20 phases of build)
**To:** Incoming development team
**Date:** 2026-02-22
**Purpose:** Prevent cross-contamination of bad patterns into the new UI/development cycle

---

## Read This First

You are receiving a codebase with ~118K lines of TypeScript, 237 API endpoints, 53 database tables, and 747 E2E tests. A lot of it works. Some of it is built on wrong assumptions. The owner has done significant design work to correct the UI and data presentation layer. **Your job is to implement what the owner gives you, not to inherit what exists.**

The owner's new UI designs, handoff documents, and governance docs are your source of truth. The existing codebase is a **parts bin** — take what works, leave what doesn't.

---

## Hard-Won Lessons (What We Got Wrong and Why)

### 1. VIN Solutions API Is Not What We Assumed

**The single biggest source of wasted effort in this project.**

We built features assuming we'd have access to the full CRM pipeline. We don't. VIN Solutions blocks 17 of 30 endpoints with 403 errors. Here's the reality:

| What We CAN Access | What We CANNOT Access |
|--------------------|-----------------------|
| Leads (CRUD) | Deals / Desking |
| Contacts (CRUD) | Appointments (VIN side) |
| Lead Sources | Inventory |
| Lead Types | Trade-ins |
| Lead Statuses | Tasks (VIN side) |
| Lead Groups | Phone calls (VIN side) |
| CRM Users | Email history (VIN side) |

**What this means:** Nexxus can see the beginning of the pipeline (lead creation) and the end (SOLD/LOST status), but NOT the middle (human execution, deals, appointments, follow-ups). Every feature that displays "pipeline data" or "deal progress" is either pulling from Nexxus-internal data or making it up. Be honest about this boundary.

**Rule:** Before building any feature that implies VIN data, check `docs/audit/server-audit.md` for which endpoints actually work. If it's not in the "accessible" list, you don't have the data.

### 2. Lead Sync Payload Format (Burned Us Twice)

VIN Solutions lead creation is a **two-step process**:
1. Create contact via gateway POST → get ContactId
2. Create lead with contact as a **URL reference** (not a flat field)

```
WRONG: { "contact": "John Smith" }
WRONG: { "contactId": 12345 }
RIGHT: { "contact": "/contacts/id/12345?dealerid=67890" }
```

The same pattern applies to `leadSource` and `leadType` — they are **href references**, not string names. This burned us, and the fix is in `server/services/VinSolutionsService.ts`. Don't revert it.

### 3. Header Casing Will Break You Silently

VIN Solutions API documentation says `application/vnd.coxauto.V3+json` (uppercase V3). The actual production API **rejects uppercase** and requires `application/vnd.coxauto.v3+json` (lowercase v3).

Every endpoint must be tested with v1, v3, and gateway headers before assuming it's blocked. Some endpoints only work with specific versions. This is documented in detail in the memory files and `docs/audit/server-audit.md`.

### 4. The RLS Variable Name Mismatch

**This is a real bug that hasn't caused production issues only because of how routes are written.**

- `SecureQueryBuilder` sets: `app.current_organization_id`
- Every RLS policy checks: `app.current_org_id`

These are different variable names. The system works because most routes call `set_config('app.current_org_id', ...)` directly on the database pool, bypassing the SecureQueryBuilder entirely. This means the "centralized security layer" is decorative for most routes.

**Decision needed:** Either fix SecureQueryBuilder to use the correct variable name, or document this as intentional and ensure all routes use the direct pattern.

### 5. SET LOCAL Without Transaction

`SecureQueryBuilder.query()` uses `SET LOCAL` (which is transaction-scoped) but doesn't wrap queries in a transaction. Without BEGIN/COMMIT, `SET LOCAL` behaves like `SET` and the variable persists on the connection. When that connection returns to the pool, the next request could inherit the previous org's context.

**Risk level:** Potential cross-tenant data leak. Not confirmed in production but architecturally unsound.

### 6. Context Router Was Inverted

The Context Router (which decides where DealerBrain gets its data) was initially configured backwards — local DB was primary, VIN API was fallback. It's been corrected to: VIN API primary, local DB fallback. The env variable `CONTEXT_ROUTER_ENABLED=true` controls this.

### 7. Excel Upload Records Polluted Everything

Records imported via excel upload were showing up in lead counts, metrics, and dashboards as if they were real CRM leads. We had to add `excel_upload` exclusion filters to 32+ queries across 11 files. If you add any new lead queries, **always exclude `source = 'excel_upload'`** or you'll show inflated numbers.

---

## What Works Well (Keep These)

### Backend Services (Do Not Rebuild)
- **VinSolutionsService** — OAuth2 with encrypted token storage, correct API patterns after multiple iterations of fixes
- **DealerBrainService** — Claude API with tool calling, SSE streaming, 24 tools
- **CreditService** — Usage tracking wired to webhooks, per-minute economics
- **SyncCoordinator** — Queue-based VIN sync with retry logic
- **NotificationService** — Email + in-app with idempotency guards
- **TriggerService** — Rule engine for automated actions
- **AppointmentService** — Calendar CRUD with RBAC
- **TextMagicService** — SMS send/receive

### Database Layer (Do Not Rebuild)
- 53 tables with 100% RLS coverage
- ~100 RLS policies enforcing multi-tenant isolation
- 160+ indexes
- 33 migrations (all applied to production)

### Webhook Architecture (Do Not Rebuild)
- VAPI webhook chain: call end → org resolution → lead extraction → credit recording → notifications
- Tavus webhook: session end → HMAC verify → processing
- Idempotency via `notification_sent` flag

### Authentication (Do Not Rebuild)
- JWT with access/refresh tokens
- 4-tier RBAC (Super Admin → Partner Admin → Org Admin → Staff)
- Auto-refresh every 60s when < 5min to expiry

### Integration Plumbing (Carry Forward)
These are in the frontend but they're not "UI" — they're the wiring between the client and server:
- `fetchApi()` wrapper with JWT refresh
- TanStack Query hooks (26 hooks, ~38 queries, ~34 mutations)
- SSE streaming hook for DealerBrain
- Organization context switching (Partner Admin feature)
- Auth context and token management

**The owner spent significant effort getting data display and metrics to work correctly.** Whatever the new UI designs show for metrics, the underlying data fetching and transformation logic should be preserved or referenced, not rebuilt from scratch.

---

## What Doesn't Work / Should Be Discarded

1. **Any UI component that displays "pipeline" or "deal" data from VIN** — we don't have access to that data
2. **The current page layout/routing structure** — the owner has redesigned this; use the new designs
3. **Component-level RBAC** — role checks are scattered across components instead of being at the route level; the new UI should centralize this
4. **The 380 `any` type annotations** — these accumulated over rapid development; new code should use proper types
5. **Anything in `docs/archive/pre-stabilization/`** — this is historical record, not current truth

---

## Metrics and Data Display (Owner's Hard-Won Work)

The owner spent considerable effort getting metrics, charts, and data presentation to display correctly. Specific areas where we iterated multiple times to get right:

- Lead source attribution and badges
- Excel upload exclusion from all metrics
- VIN API data vs local data source indicators
- Health scores and gauge components
- Context Router source selection display
- Dealer Pulse AI commentary generation

**If the new designs reference these, the data pipelines already exist.** Check the corresponding TanStack Query hooks before building new data fetching.

---

## Customer Acceptance Criteria (Non-Negotiable)

These 5 use cases are the acceptance bar. Everything else is secondary.

| # | Use Case | Current Status | Risk |
|---|----------|---------------|------|
| AC-1 | Automatic Outbound Call Triggering | Implemented but D-FLAG-001 (trigger consolidation) is unresolved for 5+ days | **HIGH** — triggers aren't activating |
| AC-2 | Intelligent VIN Data Analysis | Working via Context Router + DealerBrain | Low |
| AC-3 | Lead Insertion to VIN Solutions | Sync pipeline fixed 2026-02-15 | Medium — needs re-verification |
| AC-4 | Accurate Dashboard Metrics | Working with excel exclusions + source badges | Low |
| AC-5 | Widget Deployment | Fully implemented (Master Widget + hosted pages) | Low |

**AC-1 is the highest risk item.** The trigger system is built but D-FLAG-001 (a design decision about consolidating triggers) has been pending review. Until it's resolved, trigger rules aren't activating, which means outbound calls aren't firing automatically.

---

## Production Customers

- **Serra Automotive (Serra Honda)** — live, using voice agents
- **Hyundai of Columbia** — live
- **Live URL:** https://nexxusv2.huminicdev.com

Do not break webhook processing, VIN sync, or notification delivery. These are serving real customers.

---

## Technical Debt to Be Aware Of

| Priority | Issue | Location |
|----------|-------|----------|
| CRITICAL | RLS variable name mismatch | `server/db/SecureQueryBuilder.ts:244` vs all RLS policies |
| CRITICAL | SET LOCAL without transaction | `server/db/SecureQueryBuilder.ts` |
| HIGH | Zero unit tests (all 747 tests are E2E) | `tests/` |
| HIGH | 380 `any` type annotations | Mostly `server/` (325 of 380) |
| HIGH | No linter, formatter, or pre-commit hooks | Project root |
| MEDIUM | 16 tables missing `updated_at` triggers | Migrations 001, 002, 013+ |
| MEDIUM | CLAUDE.md references stale v1.0 statistics | `CLAUDE.md` |
| LOW | 2 tables use wrong Super Admin bypass variable | `dealer_pulse_cache`, `knowledge_uploads` |

---

## File References

| Document | Purpose |
|----------|---------|
| `docs/REVERSE_SRS.md` | Complete forensic as-built (1,913 lines) |
| `docs/audit/database-audit.md` | Database layer deep dive |
| `docs/audit/server-audit.md` | Server/API layer deep dive |
| `docs/audit/client-audit.md` | Client/frontend layer deep dive |
| `docs/audit/health-audit.md` | Project health metrics |
| `docs/audit/docs-audit.md` | Documentation state and inconsistencies |
| `docs/MASTER_SRS.md` | Formal specification (v2.0) |
| `docs/CONSTITUTION.md` | Governance principles (v1.0) |
| `docs/CURRENT_STATE_ASSESSMENT.md` | Spec vs reality (v2.0) |
| `docs/IMPLEMENTATION_PLAN.md` | Phase plan (v2.0) |

---

## Summary for the New Team

1. **The owner's new designs are your source of truth.** Not the existing UI.
2. **The backend works.** Don't rebuild it. Wire the new UI to the existing API.
3. **VIN Solutions has hard limits.** Don't design features that need data you can't access.
4. **Metrics display was hard-won.** Preserve the data pipelines even if the visual components change.
5. **Cross-contamination is the #1 risk.** Don't inherit assumptions from the old frontend. Build what the designs show.
6. **AC-1 through AC-5 are the acceptance bar.** Every sprint should advance at least one.
7. **Two customers are live.** Don't break webhooks, sync, or notifications.

---

*This briefing was compiled from a 5-agent forensic audit of the complete codebase, cross-referenced against governing documents, git history, and production state. All claims are evidence-backed with specific file references in the audit documents.*
