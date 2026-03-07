# GAPS.md — Neutral Gap Register

**Source:** Fresh re-audit from restored baseline (commit `58288b6`)
**Date:** 2026-03-07
**Status:** All items OPEN unless otherwise noted. No item may be marked RESOLVED without explicit user approval.

---

## Part 1: Governance Gaps (GOV)

| ID | Area | Finding | Severity | Status |
|----|------|---------|----------|--------|
| GOV-01 | Truth hierarchy | Three documents (CLAUDE.md, replit.md, operational-context.md) declare competing truth hierarchies | HIGH | OPEN |
| GOV-02 | Acceptance criteria | Two AC documents exist (root ACCEPTANCE_CRITERIA.md and .agent_docs/acceptance_criteria.md) with conflicting requirements for AI Chat tiles, widget channels, TeamBox model | HIGH | OPEN |
| GOV-03 | SPEC.md staleness | SPEC.md §12 shows single-table database; §11 says "no active API routes." Both critically wrong. | HIGH | OPEN |
| GOV-04 | operational-context.md | Never updated since creation (2026-03-04). All waves show LOCKED, all audit items PENDING. | HIGH | OPEN |
| GOV-05 | codebase-index.md | Application code section empty despite 50+ app files existing | MEDIUM | OPEN |
| GOV-06 | undefined-items.md | No entries logged despite complex multi-wave development | LOW | OPEN |
| GOV-07 | Enforcer compliance log | Never executed — log shows "(Wave 0 — no merges yet)" | MEDIUM | OPEN |
| GOV-08 | Cross-references to non-existent files | DO_NOT_TOUCH.md, DESIGNER_BRIEF.md, MEMORY.md, spec.ts referenced but don't exist | MEDIUM | OPEN |
| GOV-09 | Cross-references to non-existent directories | server/services/, server/middleware/, central-mcp/, client/src/types/ referenced in code-conventions.md | MEDIUM | OPEN |
| GOV-10 | PLAN.md completion claims | Claims ~92% complete but Wave 3.5 completion criteria all unchecked; Sprint_log says ~95% | MEDIUM | OPEN |
| GOV-11 | Sprint_log criteria mismatch | Planning section checkboxes unchecked while execution section shows DONE for same items | MEDIUM | OPEN |
| GOV-12 | SRS.md agent data stale | Lists generic agent names; actual agents are named personas (Caroline, Magnolia, etc.) | LOW | OPEN |
| GOV-13 | COMMENT_INDEX.md stale | References pre-wiring states (AuthContext "NOT wired yet") that were resolved | LOW | OPEN |

---

## Part 2: Schema Gaps (SCH)

| ID | Area | Finding | Severity | Status |
|----|------|---------|----------|--------|
| SCH-01 | Missing table: landing_pages | SRS §10.4 specifies landing_pages table; not in schema | MEDIUM | OPEN |
| SCH-02 | Missing table: campaign_messages | SRS §10.2 specifies multi-step campaign messages; only single message_template exists | MEDIUM | OPEN |
| SCH-03 | Missing table: metrics_cache | SRS §10.5 specifies metrics_cache for computed values | LOW | OPEN |
| SCH-04 | Missing columns: organizations | industry, plan, logo_url, primary_color, secondary_color missing | MEDIUM | OPEN |
| SCH-05 | Missing columns: users | phone, preferences (jsonb) missing | LOW | OPEN |
| SCH-06 | Missing column: messages.thinking | SRS specifies thinking column for AI reasoning | LOW | OPEN |
| SCH-07 | Missing columns: campaigns | delivered_count, created_by missing | MEDIUM | OPEN |
| SCH-08 | Missing columns: agents | system_prompt, created_by, triggers, tools, knowledge_sources, chat_link missing | MEDIUM | OPEN |
| SCH-09 | Missing columns: notifications.action_url | SRS §10.6 specifies action_url | LOW | OPEN |
| SCH-10 | Missing columns: activity_log.description | SRS §10.6 specifies description | LOW | OPEN |
| SCH-11 | Missing columns: hunches | impact, pattern, recommendation, source, data (jsonb) missing vs SRS | LOW | OPEN |
| SCH-12 | Dual schema conflict | shared/models/chat.ts defines conversations/messages with serial PKs; shared/schema.ts uses UUIDs. Type name collision risk. | HIGH | OPEN |
| SCH-13 | No ON DELETE cascade | No FK has onDelete behavior. Deleting parent records will cause constraint violations. | HIGH | OPEN |
| SCH-14 | No explicit indexes | No indexes beyond PK/UNIQUE. Performance risk at scale for filtered queries. | MEDIUM | OPEN |
| SCH-15 | No RLS policies | SRS §10.7 requires RLS; none exist. Multi-tenancy enforced only in app code. | MEDIUM | OPEN |
| SCH-16 | IStorage interface incomplete | logUsageEvent, getUsageEvents, getUsageSummary on DatabaseStorage but not in IStorage | LOW | OPEN |
| SCH-17 | Orphaned FK-like columns | organizations.partner_id and hunches.batch_id have no FK constraints | LOW | OPEN |
| SCH-18 | No migration files | migrations/ directory empty; no versioned migration history | MEDIUM | OPEN |
| SCH-19 | Missing NOT NULL | campaign_recipients phone+email both nullable (unreachable recipient possible) | LOW | OPEN |
| SCH-20 | Missing updated_at | campaign_recipients, outbound_log, notifications lack updated_at despite mutable fields | LOW | OPEN |

---

## Part 3: API & Backend Gaps (API)

| ID | Area | Finding | Severity | Status |
|----|------|---------|----------|--------|
| API-01 | Missing: Stripe billing | No Stripe integration despite SRS requirement. Only usage_events tracking exists. | HIGH | OPEN |
| API-02 | Missing: File/Drive management | No general file CRUD beyond knowledge documents | MEDIUM | OPEN |
| API-03 | Stub: Password reset | POST /api/auth/reset-password returns placeholder, no actual implementation | MEDIUM | OPEN |
| API-04 | Stub: Forgot password | POST /api/auth/forgot-password logs but does not send email | MEDIUM | OPEN |
| API-05 | Missing: Landing page CRUD | Only org slug management; no landing_pages entity/routes | MEDIUM | OPEN |
| API-06 | Missing: Notification preferences | No route for user notification settings | LOW | OPEN |
| API-07 | Missing: Security settings | No dedicated security configuration routes | LOW | OPEN |
| API-08 | Missing: AI configuration routes | AI config hardcoded; no dynamic prompt/skill/temperature routes | MEDIUM | OPEN |
| API-09 | Missing: Organization creation | No POST /api/organizations route (only seed creates orgs) | MEDIUM | OPEN |
| API-10 | Missing: Outbound log viewer | getOutboundLogs in storage but no route exposes it | LOW | OPEN |
| API-11 | Missing: Tavus webhook | No POST /api/webhooks/tavus receiver | LOW | OPEN |
| API-12 | 5 unused IStorage methods | getRoleByName, deleteMessages, getIntegration, updateIntegration, getOutboundLogs never called | LOW | OPEN |
| API-13 | Campaign execution in-memory | activeExecutions Map lost on server restart; no job queue | HIGH | OPEN |
| API-14 | Silent failure swallowing | Activity logs and notifications use .catch(() => {}) | MEDIUM | OPEN |
| API-15 | TextMagic webhook no secret | VAPI webhook validates secret; TextMagic does not | MEDIUM | OPEN |
| API-16 | Public widget lookup scans all orgs | Performance issue at scale | LOW | OPEN |

---

## Part 4: Frontend & UI Gaps (UI)

| ID | Area | Finding | Severity | Status |
|----|------|---------|----------|--------|
| UI-01 | Insights page 100% mock | All 23+ chart/table sections source from static arrays in insight-data.ts | HIGH | OPEN |
| UI-02 | My Work chat tab mock imports | Directly imports from @/mocks/ despite Wave 4 claiming no mock imports | HIGH | OPEN |
| UI-03 | Settings page ~20 demo-mode actions | Many settings buttons show demo mode toasts instead of real functionality | MEDIUM | OPEN |
| UI-04 | Billing pages hardcoded | All billing displays use inline hardcoded data | MEDIUM | OPEN |
| UI-05 | Sales Recent Activity hardcoded | 5 inline hardcoded activity items | LOW | OPEN |
| UI-06 | TopBar Activity Feed uses static array | Uses staticActivityFeed despite activity_log API existing | MEDIUM | OPEN |
| UI-07 | Duplicate mock files | client/src/mocks/insights.ts and client/src/lib/insight-data.ts contain identical content | LOW | OPEN |
| UI-08 | ~10 orphaned mock files | Most of 12 mock files have no page consumers but still exist | LOW | OPEN |
| UI-09 | Trend percentages non-functional | Most metric tiles hardcode change: 0 with no historical comparison | MEDIUM | OPEN |
| UI-10 | Placeholder tabs | 8 Wave 2/3/4 placeholder tabs in various pages | MEDIUM | OPEN |
| UI-11 | Non-functional org wizard | Organization creation wizard exists but is not wired | MEDIUM | OPEN |

---

## Part 5: AI, Chat & Outbound Gaps (AIO)

| ID | Area | Finding | Severity | Status |
|----|------|---------|----------|--------|
| AIO-01 | Voice (VAPI) is mock | Console.log only, no actual voice calls placed | HIGH | OPEN |
| AIO-02 | Video (Tavus) missing | No video calling implementation | HIGH | OPEN |
| AIO-03 | Mid-stream failure loses AI response | User message saved before AI call; AI response only saved after stream completes | MEDIUM | OPEN |
| AIO-04 | Campaign execution state in-memory | Same as API-13; execution state lost on restart | HIGH | OPEN |
| AIO-05 | TextMagic webhook no secret validation | Same as API-15 | MEDIUM | OPEN |
| AIO-06 | No multi-org routing for outbound | Single-org assumption in campaign execution | LOW | OPEN |

---

## Part 6: Metrics & Intelligence Gaps (MET)

| ID | Area | Finding | Severity | Status |
|----|------|---------|----------|--------|
| MET-01 | Insights page 100% mock | Same as UI-01; single largest mock data consumer | HIGH | OPEN |
| MET-02 | ~68% of displayed metrics are mock/hardcoded | Only ~32% backed by real data (mainly main/service/marketing/management dashboards) | HIGH | OPEN |
| MET-03 | Trend percentages all zero | No backend historical comparison implemented | MEDIUM | OPEN |
| MET-04 | Duplicate insight data files | Same as UI-07 | LOW | OPEN |

---

## Part 7: Verification & Testing Gaps (VER)

| ID | Area | Finding | Severity | Status |
|----|------|---------|----------|--------|
| VER-01 | Zero automated tests | No test files (*.test.*, *.spec.*) exist anywhere in project | HIGH | OPEN |
| VER-02 | No test framework configured | No testing dependencies installed | HIGH | OPEN |
| VER-03 | Sprint_log E2E claims are manual | "E2E Tests: PASSED" entries were manual verifications, not automated | MEDIUM | OPEN |
| VER-04 | Wave 2 unchecked criteria despite Complete status | Wave 2 header says Complete but has unchecked items | MEDIUM | OPEN |
| VER-05 | Wave 3.5 status contradiction | Sprint_log says DONE, PLAN.md criteria all unchecked | MEDIUM | OPEN |
| VER-06 | Wave 4 deferred items despite Complete status | §6.3 lists items "Deferred to Wave 5 or Future" while wave is marked Complete | MEDIUM | OPEN |
| VER-07 | AC document labeled "(Future)" | Waves 2-4 ACs still labeled "(Future)" despite waves claimed complete | MEDIUM | OPEN |
| VER-08 | Enforcer coverage limited | Only checks dropped features and kill switch defaults; no functional/mock/API checks | MEDIUM | OPEN |
| VER-09 | False positives identified | 10+ features appear functional in UI but use mock/static data | HIGH | OPEN |
| VER-10 | Verification maturity Level 1 | Ad hoc/manual; no CI/CD, no automated regression | HIGH | OPEN |

---

## Summary

| Category | Count | HIGH | MEDIUM | LOW |
|----------|-------|------|--------|-----|
| Governance (GOV) | 13 | 4 | 5 | 4 |
| Schema (SCH) | 20 | 2 | 6 | 12 |
| API & Backend (API) | 16 | 2 | 7 | 7 |
| Frontend & UI (UI) | 11 | 2 | 5 | 4 |
| AI/Chat/Outbound (AIO) | 6 | 3 | 2 | 1 |
| Metrics (MET) | 4 | 2 | 1 | 1 |
| Verification (VER) | 10 | 4 | 5 | 1 |
| **TOTAL** | **80** | **19** | **31** | **30** |

All items OPEN. No speculative RESOLVED labels applied.
