# ISSUES.md — Living Issue Tracker

**Created:** Sweep 2A (Stabilization Plan)
**Initial source:** GAPS.md (81 items), 10 architectural contradictions (Sweep 1), 10 false positive features (verification audit)
**Status:** Living document — updated as issues are discovered during coding, testing, or review

**Rules:**
- No issue may be marked RESOLVED without evidence and owner approval (per GUARDRAILS R4)
- New issues are added as discovered — this file is never "complete"
- RC-blocking = yes means the issue must be resolved before the Release Candidate gate (Sweep 9)

---

## Governance Issues (GOV)

| ID | Finding | Severity | RC-blocking | AC ID(s) | Sweep | Status |
|----|---------|----------|-------------|----------|-------|--------|
| GOV-01 | Three documents declared competing truth hierarchies (CLAUDE.md, replit.md, operational-context.md) | HIGH | yes | — | Sweep 1A | RESOLVED — Truth Hierarchy Declaration in sweep_1_report.md establishes canonical 6-tier hierarchy. Prior declarations replaced. |
| GOV-02 | Two AC documents with conflicting requirements for tiles, channels, TeamBox | HIGH | yes | W1-AC-010, W1-AC-110, W1-AC-020 | Sweep 1B | RESOLVED — AC Reconciliation in sweep_1_report.md. Root AC is canonical; .agent_docs header corrected in Sweep 0. |
| GOV-03 | SPEC.md describes single-table database; says "no active API routes" | HIGH | no | — | Sweep 0 | RESOLVED — SPEC.md quarantined with header notice. |
| GOV-04 | operational-context.md never updated since creation | HIGH | no | — | Sweep 0 | RESOLVED — quarantined with header notice. |
| GOV-05 | codebase-index.md application code section empty | MEDIUM | no | — | Sweep 0 | RESOLVED — quarantined with header notice. |
| GOV-06 | undefined-items.md has no entries logged | LOW | no | — | Sweep 0 | RESOLVED — quarantined with header notice. |
| GOV-07 | Enforcer compliance log never executed | MEDIUM | no | — | Sweep 4 | OPEN |
| GOV-08 | Cross-references to non-existent files (DO_NOT_TOUCH.md, DESIGNER_BRIEF.md, spec.ts) | MEDIUM | yes | — | Sweep 3 | OPEN |
| GOV-09 | Cross-references to non-existent directories (server/services/, server/middleware/, etc.) | MEDIUM | no | — | Sweep 3E | OPEN |
| GOV-10 | PLAN.md claims ~92% complete; audit found 81 gaps, 68% mock metrics, 0 tests | MEDIUM | yes | — | Sweep 3B | OPEN |
| GOV-11 | Sprint_log criteria mismatch — unchecked planning vs DONE execution | MEDIUM | no | — | Sweep 0 | RESOLVED — Sprint_log quarantined. |
| GOV-12 | SRS.md agent data stale (generic names vs actual personas) | LOW | no | — | Sweep 0 | RESOLVED — SRS quarantined. |
| GOV-13 | COMMENT_INDEX.md references pre-wiring states | LOW | no | — | Sweep 0 | RESOLVED — COMMENT_INDEX quarantined. |

**GOV resolved count:** 8 of 13 (all through quarantine or Sweep 1 decision records)

---

## Schema Issues (SCH)

| ID | Finding | Severity | RC-blocking | AC ID(s) | Sweep | Status |
|----|---------|----------|-------------|----------|-------|--------|
| SCH-01 | Missing table: landing_pages (SRS §10.4) | MEDIUM | no | W1-AC-110 | Sweep 5 | OPEN — SRS is quarantined; evaluate if needed per T1 runtime UI |
| SCH-02 | Missing table: campaign_messages for multi-step campaigns | MEDIUM | no | — | Sweep 5 | OPEN — evaluate if single message_template suffices |
| SCH-03 | Missing table: metrics_cache for computed values | LOW | no | — | Sweep 10+ | OPEN — deferred post-MVP |
| SCH-04 | Missing columns on organizations: industry, plan, logo_url, primary_color, secondary_color | MEDIUM | no | — | Sweep 5 | OPEN |
| SCH-05 | Missing columns on users: phone, preferences (jsonb) | LOW | no | — | Sweep 5 | OPEN |
| SCH-06 | Missing column: messages.thinking for AI reasoning | LOW | no | W1-AC-012 | Sweep 5 | OPEN |
| SCH-07 | Missing columns on campaigns: delivered_count, created_by | MEDIUM | no | — | Sweep 5 | OPEN |
| SCH-08 | Missing columns on agents: system_prompt, created_by, triggers, tools, knowledge_sources, chat_link | MEDIUM | yes | — | Sweep 5 | OPEN |
| SCH-09 | Missing column: notifications.action_url | LOW | no | — | Sweep 5 | OPEN |
| SCH-10 | Missing column: activity_log.description | LOW | no | — | Sweep 5 | OPEN |
| SCH-11 | Missing columns on hunches: impact, pattern, recommendation, source, data (jsonb) | LOW | no | W1-AC-071 | Sweep 5 | OPEN |
| SCH-12 | Dual schema conflict: shared/models/chat.ts (serial PKs) vs shared/schema.ts (UUID PKs). Table name collision. | HIGH | yes | — | Sweep 5.1 | OPEN |
| SCH-13 | No ON DELETE CASCADE on any FK | HIGH | yes | — | Sweep 5.5 | OPEN |
| SCH-14 | No explicit indexes beyond PK/UNIQUE | MEDIUM | no | — | Sweep 5.5 | OPEN |
| SCH-15 | No RLS policies (SRS §10.7) | MEDIUM | no | — | Sweep 10+ | OPEN — deferred post-MVP |
| SCH-16 | IStorage interface incomplete (3 methods on impl but not interface) | LOW | no | — | Sweep 5 | OPEN |
| SCH-17 | Orphaned FK-like columns (organizations.partner_id, hunches.batch_id) no constraints | LOW | no | — | Sweep 5 | OPEN |
| SCH-18 | No migration files — migrations/ directory empty | MEDIUM | yes | — | Sweep 5.5 | OPEN |
| SCH-19 | campaign_recipients phone+email both nullable (unreachable recipient) | LOW | no | — | Sweep 5 | OPEN |
| SCH-20 | campaign_recipients, outbound_log, notifications lack updated_at | LOW | no | — | Sweep 5 | OPEN |

**SCH resolved count:** 0 of 20

---

## API & Backend Issues (API)

| ID | Finding | Severity | RC-blocking | AC ID(s) | Sweep | Status |
|----|---------|----------|-------------|----------|-------|--------|
| API-01 | Missing: Stripe billing integration | HIGH | no | — | Sweep 10+ | OPEN — deferred post-MVP |
| API-02 | Missing: File/Drive management beyond knowledge documents | MEDIUM | no | — | Sweep 10+ | OPEN — deferred post-MVP |
| API-03 | Stub: POST /api/auth/reset-password returns placeholder | MEDIUM | yes | — | Sweep 5.4 | OPEN |
| API-04 | Stub: POST /api/auth/forgot-password logs but doesn't send email | MEDIUM | yes | — | Sweep 5.4 | OPEN |
| API-05 | Missing: Landing page CRUD (only org slug management) | MEDIUM | no | W1-AC-110 | Sweep 5 | OPEN |
| API-06 | Missing: Notification preferences route | LOW | no | — | Sweep 10+ | OPEN — deferred |
| API-07 | Missing: Security settings routes | LOW | no | — | Sweep 10+ | OPEN — deferred |
| API-08 | Missing: AI configuration routes (prompt/skill/temperature) | MEDIUM | yes | — | Sweep 5 | OPEN |
| API-09 | Missing: POST /api/organizations (only seed creates orgs) | MEDIUM | yes | — | Sweep 5 | OPEN |
| API-10 | Missing: Outbound log viewer route (storage method exists) | LOW | no | — | Sweep 5 | OPEN |
| API-11 | Missing: POST /api/webhooks/tavus receiver | LOW | no | — | Sweep 7.2 | OPEN |
| API-12 | 5 unused IStorage methods (getRoleByName, deleteMessages, etc.) | LOW | no | — | Sweep 5 | OPEN |
| API-13 | Campaign execution state in-memory (activeExecutions Map) — lost on restart | HIGH | yes | — | Sweep 5.3 | OPEN |
| API-14 | Silent failure swallowing — activity logs and notifications use .catch(() => {}) | MEDIUM | no | — | Sweep 5 | OPEN |
| API-15 | TextMagic webhook lacks secret validation (VAPI does validate) | MEDIUM | yes | — | Sweep 5.2 | OPEN |
| API-16 | Public widget lookup scans all orgs (performance at scale) | LOW | no | — | Sweep 10+ | OPEN — deferred |

**API resolved count:** 0 of 16

---

## Frontend & UI Issues (UI)

| ID | Finding | Severity | RC-blocking | AC ID(s) | Sweep | Status |
|----|---------|----------|-------------|----------|-------|--------|
| UI-01 | Insights page 100% mock — all 23+ sections from insight-data.ts, zero useQuery calls | HIGH | yes | W1-AC-070 | Sweep 6.1 | OPEN |
| UI-02 | My Work chat tab imports mockConversations and mockTeamboxConversations from @/mocks/ | HIGH | yes | W1-AC-030 | Sweep 6.1 | OPEN |
| UI-03 | Settings page ~8 demo-mode toast actions (tool toggle, URL add/scrape, embed instructions, kill switch confirm, skill delete) | MEDIUM | partial | — | Sweep 6.2 | OPEN |
| UI-04 | Billing pages 100% hardcoded (send invoice, add add-on, preview invoice, view invoice — all demo toasts) | MEDIUM | no | — | Sweep 10+ | OPEN — deferred (Stripe integration post-MVP) |
| UI-05 | Sales Recent Activity — 5 inline hardcoded items | LOW | no | W1-AC-040 | Sweep 6 | OPEN |
| UI-06 | TopBar Activity Feed uses staticActivityFeed despite activity_log API existing | MEDIUM | yes | — | Sweep 6.1 | OPEN |
| UI-07 | Duplicate mock: mocks/insights.ts and lib/insight-data.ts — identical content | LOW | no | — | Sweep 6.4 | OPEN |
| UI-08 | 10 orphaned mock files with zero consumers in client/src/mocks/ | LOW | no | — | Sweep 6.4 | OPEN |
| UI-09 | Trend percentages non-functional — most tiles show change: 0, no historical comparison | MEDIUM | no | — | Sweep 10+ | OPEN — deferred |
| UI-10 | Placeholder tabs: Marketing Studio "Coming Soon", TeamBox file attachments "coming soon", Chat upload/document "Coming Soon" | MEDIUM | no | — | Sweep 6.2 | OPEN |
| UI-11 | OrgWizard not wired — no POST /api/organizations | MEDIUM | yes | — | Sweep 6.3 | OPEN |

**UI resolved count:** 0 of 11

---

## AI, Chat & Outbound Issues (AIO)

| ID | Finding | Severity | RC-blocking | AC ID(s) | Sweep | Status |
|----|---------|----------|-------------|----------|-------|--------|
| AIO-01 | Voice (VAPI) outbound is console.log — no actual calls placed | HIGH | yes | — | Sweep 7.1 | OPEN |
| AIO-02 | Video (Tavus) — no outbound capability, read-only proxy only | HIGH | yes | — | Sweep 7.2 | OPEN |
| AIO-03 | Mid-stream AI response loss — user message saved before stream, AI response only after completion | MEDIUM | yes | — | Sweep 5.3 | OPEN |
| AIO-04 | Campaign execution state in-memory (duplicate of API-13) | HIGH | yes | — | Sweep 5.3 | OPEN |
| AIO-05 | TextMagic webhook no secret validation (duplicate of API-15) | MEDIUM | yes | — | Sweep 5.2 | OPEN |
| AIO-06 | No multi-org routing for outbound — single-org assumption | LOW | no | — | Sweep 5.2 | OPEN |

**AIO resolved count:** 0 of 6

---

## Metrics & Intelligence Issues (MET)

| ID | Finding | Severity | RC-blocking | AC ID(s) | Sweep | Status |
|----|---------|----------|-------------|----------|-------|--------|
| MET-01 | Insights page 100% mock (duplicate of UI-01) | HIGH | yes | W1-AC-070 | Sweep 6.1 | OPEN |
| MET-02 | ~68% of displayed metrics are mock/hardcoded | HIGH | yes | — | Sweep 6 | OPEN |
| MET-03 | Trend percentages all zero — no backend historical comparison | MEDIUM | no | — | Sweep 10+ | OPEN — deferred |
| MET-04 | Duplicate insight data files (duplicate of UI-07) | LOW | no | — | Sweep 6.4 | OPEN |

**MET resolved count:** 0 of 4

---

## Verification & Testing Issues (VER)

| ID | Finding | Severity | RC-blocking | AC ID(s) | Sweep | Status |
|----|---------|----------|-------------|----------|-------|--------|
| VER-01 | Zero automated tests exist in project | HIGH | yes | — | Sweep 4 | OPEN |
| VER-02 | No test framework configured (no vitest, playwright, jest) | HIGH | yes | — | Sweep 4 | OPEN |
| VER-03 | Sprint_log "E2E Tests: PASSED" claims were manual checks, not automated | MEDIUM | no | — | Sweep 0 | RESOLVED — Sprint_log quarantined. |
| VER-04 | Wave 2 unchecked criteria despite Complete status | MEDIUM | no | — | Sweep 0 | RESOLVED — Sprint_log quarantined, PLAN.md flagged stale. |
| VER-05 | Wave 3.5 status contradiction (DONE vs unchecked criteria) | MEDIUM | no | — | Sweep 0 | RESOLVED — Sprint_log quarantined, PLAN.md flagged stale. |
| VER-06 | Wave 4 deferred items despite Complete status | MEDIUM | no | — | Sweep 0 | RESOLVED — Sprint_log quarantined. |
| VER-07 | Waves 2-4 ACs still labeled "(Future)" despite waves claimed complete | MEDIUM | no | — | Sweep 0 | RESOLVED — Sprint_log quarantined, AC status claims invalidated. |
| VER-08 | Enforcer coverage limited — only checks dropped features and kill switch defaults | MEDIUM | no | — | Sweep 4 | OPEN |
| VER-09 | 10+ false positive features (appear functional, use mock/static data) | HIGH | yes | — | Sweep 6 | OPEN |
| VER-10 | Verification maturity Level 1 — ad hoc/manual, no CI/CD | HIGH | yes | — | Sweep 4 | OPEN |

**VER resolved count:** 5 of 10

---

## Architectural Contradictions (from Sweep 1)

| ID | Contradiction | Impact | Resolution | Status |
|----|--------------|--------|------------|--------|
| C-01 | Two AC documents with conflicting requirements | HIGH | Root AC canonical; .agent_docs is derived test layer | RESOLVED (Sweep 1B) |
| C-02 | RBAC roles: 4 (SRS) vs 8 (codebase) | LOW | 8 roles in codebase; SRS quarantined | RESOLVED (Sweep 0) |
| C-03 | Metric tiles defined 3 ways across 3 documents | HIGH | Runtime UI (T1) governs; pipeline tiles, org-scoped | RESOLVED (Sweep 1B) |
| C-04 | Table count: 1 (SPEC) vs 23 (reality) vs 53 (SRS) | LOW | 23 tables; SPEC quarantined | RESOLVED (Sweep 0) |
| C-05 | Wave/sprint numbering differs everywhere | MEDIUM | New terminology: Waves=old, Sweeps=stabilization, Phases=new PLAN.md | RESOLVED (Sweep planning) |
| C-06 | Artifacts simultaneously out-of-scope and has ACs | MEDIUM | Placeholder renders per canonical AC W1-AC-012g; functional artifacts deferred | RESOLVED (Sweep 1B) |
| C-07 | Safety layers: 3 vs 4 vs 5 depending on document | MEDIUM | Audit found 3-layer + rate limiting; document as 4-layer in governance rebuild | OPEN — Sweep 3 |
| C-08 | File structure in SPEC/CLAUDE doesn't match codebase | LOW | CLAUDE.md rebuilt in Sweep 3E | OPEN — Sweep 3E |
| C-09 | Widget channels: 7 vs 4 | HIGH | Runtime UI shows 4; W1-AC-110 is stale | RESOLVED (Sweep 1B) |
| C-10 | Production backend reference numbers differ | LOW | Cosmetic; no action needed | RESOLVED |

**Contradictions resolved:** 8 of 10

---

## False Positive Features (from verification audit)

| ID | Feature | Location | Data Source | RC-blocking | Sweep | Status |
|----|---------|----------|-------------|-------------|-------|--------|
| FP-1 | Insights Dashboard (all tabs) | insights.tsx | lib/insight-data — 100% static | yes | Sweep 6.1 | OPEN (= UI-01) |
| FP-2 | TopBar Activity Feed | TopBar.tsx | staticActivityFeed from activity-utils.ts | yes | Sweep 6.1 | OPEN (= UI-06) |
| FP-3 | My Work Chat & Conversations | my-work.tsx | @/mocks/messages, @/mocks/conversations | yes | Sweep 6.1 | OPEN (= UI-02) |
| FP-4 | Settings Widget fallback | settings.tsx | staticWidgets from lib/widget-types | no | Sweep 6.2 | OPEN |
| FP-5 | Billing/Invoice features | profile.tsx, billing-management.tsx | Demo mode toasts | no | Sweep 10+ | OPEN — deferred (= UI-04) |
| FP-6 | Settings Tools section | settings.tsx | Demo mode toast | no | Sweep 6.2 | OPEN (= UI-03 partial) |
| FP-7 | Settings KB URL features | settings.tsx | Demo mode toasts | no | Sweep 6.2 | OPEN (= UI-03 partial) |
| FP-8 | Marketing Studio tab | marketing.tsx | "Coming Soon" badge | no | Sweep 10+ | OPEN — deferred |
| FP-9 | TeamBox file attachments | teambox.tsx | "Coming soon" toast | no | Sweep 10+ | OPEN — deferred |
| FP-10 | Chat Plus Menu (Upload/Document) | main.tsx | "Coming Soon" toasts | no | Sweep 10+ | OPEN — deferred |

**False positives resolved:** 0 of 10 (resolution happens in Sweep 6+)

---

## Stale AC Reference (discovered Sweep 1)

| ID | Finding | Severity | RC-blocking | AC ID(s) | Sweep | Status |
|----|---------|----------|-------------|----------|-------|--------|
| AC-STALE-01 | W1-AC-110 lists 7 widget channels; runtime UI has 4 (chat, video, voice, form) | MEDIUM | no | W1-AC-110 | Sweep 3 | OPEN — canonical AC needs annotation |

---

## Summary

| Category | Total | OPEN | RESOLVED | RC-blocking OPEN |
|----------|-------|------|----------|------------------|
| Governance (GOV) | 13 | 5 | 8 | 2 |
| Schema (SCH) | 20 | 20 | 0 | 4 |
| API & Backend (API) | 16 | 16 | 0 | 5 |
| Frontend & UI (UI) | 11 | 11 | 0 | 4 |
| AI/Chat/Outbound (AIO) | 6 | 6 | 0 | 4 |
| Metrics (MET) | 4 | 4 | 0 | 1 |
| Verification (VER) | 10 | 5 | 5 | 3 |
| Contradictions (C) | 10 | 2 | 8 | 0 |
| False Positives (FP) | 10 | 10 | 0 | 3 |
| Stale AC (AC-STALE) | 1 | 1 | 0 | 0 |
| **TOTAL** | **101** | **80** | **21** | **26** |

**RC-blocking issues remaining: 26**

Note: Some issues are duplicates across categories (e.g., API-13 = AIO-04, UI-01 = MET-01). Unique RC-blocking issues after deduplication: ~19.
