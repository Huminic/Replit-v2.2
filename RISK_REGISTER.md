# RISK_REGISTER.md — Merged Risk Ranking & Contradiction Register

**Source:** Synthesis of 11 audit artifacts + GAPS.md (80 items) from restored baseline (commit `58288b6`)
**Date:** 2026-03-07
**Method:** Read-only synthesis — no fixes applied
**Truth Hierarchy:** UI code → `.agent_docs/acceptance_criteria.md` (62 ACs) → PLAN.md

---

## Section 1: RC-Blocking Items

These items must be resolved before the Release Candidate milestone:
**RC = VAPI + Tavus + Landing Page + Widget end-to-end, correct metrics in UI, stable/advanced user chat**

| # | ID(s) | Risk | ACs Blocked | Severity | Est. Effort | Dependencies |
|---|-------|------|-------------|----------|-------------|--------------|
| 1 | AIO-01, AIO-04 | **VAPI is mock-only** — console.log only, no actual voice calls placed. No VAPI webhook processing of call results. | AC-02-A, AC-02-B, AC-02-C, AC-02-D, AC-05-B | HIGH | L | VAPI API key, assistant config |
| 2 | AIO-02 | **Tavus has zero implementation** — no video calling code exists anywhere in codebase. Widget video channel has no backend. | AC-04-B | HIGH | L | Tavus API key, persona config |
| 3 | API-05 | **Landing page CRUD missing** — only org slug management exists; no landing_pages entity, no customization routes, no page builder. | AC-08-A, AC-08-B, AC-09-A, AC-09-B, AC-09-C, AC-09-D | HIGH | M | SCH-01 (missing table) |
| 4 | UI-01, MET-01 | **Insights page 100% mock** — all 23+ chart/table sections source from static arrays. Zero useQuery calls. Largest single mock gap. | AC-01-C | HIGH | L | Backend analytics computation endpoints |
| 5 | MET-02, MET-03 | **~68% of displayed metrics are mock/hardcoded** — trend percentages all zero, no historical comparison implemented. | AC-01-B, AC-01-C | HIGH | M | Backend historical data storage |
| 6 | UI-02 | **My Work chat tab imports mock data** — directly imports from @/mocks/ despite Wave 4 claiming mock audit complete. | — | HIGH | S | — |
| 7 | AIO-03 | **Mid-stream AI failure loses response** — user message saved before AI call; AI response only saved after stream completes. Stream interruption = lost data. | AC-06-B | MEDIUM | S | — |
| 8 | API-13, AIO-04 | **Campaign execution state in-memory** — activeExecutions Map lost on server restart. No persistent job queue. | AC-05-F | HIGH | M | — |
| 9 | SCH-12 | **Dual schema conflict** — shared/models/chat.ts (integer PKs) vs shared/schema.ts (UUID PKs). Type name collision risk. | AC-06-B | HIGH | S | — |
| 10 | VER-01, VER-02 | **Zero automated tests** — no test files, no test framework, no CI pipeline. | AC-EF-C | HIGH | L | Test framework setup |
| 11 | GOV-01, GOV-02 | **Competing truth hierarchies and AC documents** — 3 different truth hierarchies, 2 conflicting AC documents with different metric tile specs, widget channel counts, TeamBox models. | AC-CH-A, AC-04-A, AC-TB-A | HIGH | M | Owner decision on which AC governs |
| 12 | SCH-13 | **No ON DELETE cascade** — deleting parent records causes FK constraint violations. | — | HIGH | S | — |

---

## Section 2: Structural & Safety Risks

These items affect system integrity but are not direct RC-gate blockers.

| # | ID(s) | Risk | ACs Affected | Severity | Est. Effort | Dependencies |
|---|-------|------|-------------|----------|-------------|--------------|
| 13 | SCH-15 | **No RLS policies** — multi-tenancy enforced only in app code, not at DB level. SRS requires RLS. | AC-10-C | MEDIUM | M | — |
| 14 | API-15, AIO-05 | **TextMagic webhook no secret validation** — VAPI webhook validates secret, TextMagic does not. | AC-05-F | MEDIUM | S | — |
| 15 | API-14 | **Silent failure swallowing** — activity logs and notifications use `.catch(() => {})`. Errors disappear silently. | AC-02-D | MEDIUM | S | — |
| 16 | SCH-14 | **No explicit indexes** — beyond PK/UNIQUE. Performance risk at scale for filtered queries. | — | MEDIUM | S | — |
| 17 | SCH-18 | **No migration files** — empty migrations/ directory. No versioned migration history. Schema changes untracked. | — | MEDIUM | S | — |
| 18 | API-01 | **Stripe billing missing** — no Stripe integration despite SRS requirement. Only usage_events tracking exists. | AC-10-D | HIGH | L | Stripe API key |
| 19 | API-03, API-04 | **Password reset stubs** — forgot-password logs but doesn't send email; reset-password returns placeholder. | — | MEDIUM | S | Resend integration |
| 20 | API-09 | **No org creation route** — POST /api/organizations doesn't exist. Only seed creates orgs. | — | MEDIUM | M | — |
| 21 | UI-03 | **~20 settings demo-mode actions** — buttons show demo toasts instead of real functionality. | — | MEDIUM | M | Multiple backend routes |
| 22 | UI-04 | **Billing pages hardcoded** — all billing displays use inline hardcoded data. | AC-10-B | MEDIUM | M | API-01 (Stripe) |
| 23 | UI-06 | **TopBar Activity Feed static** — uses staticActivityFeed despite activity_log API existing. Management page wired; TopBar not. | — | MEDIUM | S | — |
| 24 | UI-09 | **Trend percentages non-functional** — most metric tiles hardcode change: 0. No historical comparison logic. | AC-01-C | MEDIUM | M | Backend computation |
| 25 | UI-10 | **8 placeholder tabs** — across Sales, Service, Marketing, Management pages labeled "Wave 2/3/4". | — | MEDIUM | S-M | Various |
| 26 | UI-11 | **Non-functional org wizard** — exists but not wired to backend. | — | MEDIUM | M | API-09 |
| 27 | VER-09 | **10+ false positives** — features appear functional in UI but use mock/static data. | Various | HIGH | — | Per-item fixes |
| 28 | VER-03 | **Sprint_log E2E claims misleading** — "E2E Tests: PASSED" were manual checks, not automated suites. | — | MEDIUM | — | Documentation fix |
| 29 | SCH-19 | **campaign_recipients phone+email both nullable** — unreachable recipient possible. | AC-05-F | LOW | S | — |
| 30 | API-16 | **Public widget lookup scans all orgs** — performance issue at scale. | AC-04-A | LOW | S | — |

---

## Section 3: Governance & Documentation Risks

| # | ID(s) | Risk | Severity | Resolution |
|---|-------|------|----------|------------|
| 31 | GOV-03 | **SPEC.md critically stale** — §12 shows single-table DB; §11 says "no active API routes." Both false. | HIGH | Archive to `archive/SPEC.md` |
| 32 | GOV-04 | **operational-context.md never updated** — all waves LOCKED, all audit items PENDING since 2026-03-04. | HIGH | Archive to `archive/operational-context.md` |
| 33 | GOV-05 | **codebase-index.md empty** — application code section says "(Wave 1 files will be indexed here)" with zero entries after Wave 4.5. | MEDIUM | Archive to `archive/codebase-index.md` |
| 34 | GOV-06 | **undefined-items.md never used** — "(none logged yet — clean start)" despite 10+ sprints. | LOW | Archive to `archive/undefined-items.md` |
| 35 | GOV-07 | **Enforcer compliance log never executed** — shows "(Wave 0 — no merges yet)". | MEDIUM | Reset with stabilization plan |
| 36 | GOV-08 | **Cross-references to non-existent files** — DO_NOT_TOUCH.md, DESIGNER_BRIEF.md, MEMORY.md (existed at time of ref, now recreated), spec.ts. | MEDIUM | Remove dead references |
| 37 | GOV-09 | **Cross-references to non-existent directories** — server/services/, server/middleware/, central-mcp/, client/src/types/. | MEDIUM | Remove dead references |
| 38 | GOV-10, GOV-11 | **PLAN.md and Sprint_log completion claims conflict** — ~92% vs ~95%, unchecked criteria in "Complete" waves. | MEDIUM | Replaced by new PLAN.md |
| 39 | GOV-12 | **SRS.md agent data stale** — lists generic agent names; actual agents are named personas. | LOW | Note; do not fix in stabilization |
| 40 | GOV-13 | **COMMENT_INDEX.md stale** — references pre-wiring states. | LOW | Archive to `archive/COMMENT_INDEX.md` |
| 41 | VER-04, VER-05, VER-06, VER-07 | **Multiple wave status contradictions** — Wave 2 unchecked criteria despite Complete, Wave 3.5 DONE vs NEXT, Wave 4 deferred items despite Complete. | MEDIUM | Replaced by new PLAN.md |
| 42 | VER-08 | **Enforcer coverage limited** — only checks dropped features and kill switch defaults. No functional/mock/API checks. | MEDIUM | Expand in Phase S7 |

---

## Section 4: Deferred Items (Not in RC Scope)

| # | ID(s) | Item | ACs | Severity | Notes |
|---|-------|------|-----|----------|-------|
| 43 | SCH-01 | Missing table: landing_pages | AC-09-A | MEDIUM | Needed for Phase S3 (landing page CRUD) |
| 44 | SCH-02 | Missing table: campaign_messages (multi-step) | — | MEDIUM | SRS spec, not in current AC set |
| 45 | SCH-03 | Missing table: metrics_cache | — | LOW | SRS spec, optimization only |
| 46 | SCH-04 | Missing org columns: industry, plan, logo_url, primary_color, secondary_color | — | MEDIUM | SRS spec |
| 47 | SCH-05 | Missing user columns: phone, preferences | — | LOW | SRS spec |
| 48 | SCH-06 | Missing messages.thinking column | AC-06-A | LOW | SRS spec |
| 49 | SCH-07 | Missing campaign columns: delivered_count, created_by | AC-05-F | MEDIUM | SRS spec |
| 50 | SCH-08 | Missing agent columns: system_prompt, created_by, triggers, tools, knowledge_sources, chat_link | — | MEDIUM | SRS spec |
| 51 | SCH-09 | Missing notifications.action_url | — | LOW | SRS spec |
| 52 | SCH-10 | Missing activity_log.description | — | LOW | SRS spec |
| 53 | SCH-11 | Missing hunch columns: impact, pattern, recommendation, source, data | — | LOW | SRS spec |
| 54 | SCH-16 | IStorage interface incomplete (3 methods on class but not interface) | — | LOW | Cleanup |
| 55 | SCH-17 | Orphaned FK-like columns (partner_id, batch_id) no constraints | — | LOW | Cleanup |
| 56 | SCH-20 | Missing updated_at on campaign_recipients, outbound_log, notifications | — | LOW | Cleanup |
| 57 | API-02 | Missing file/drive management | — | MEDIUM | Not in AC scope |
| 58 | API-06 | Missing notification preferences route | — | LOW | Not in AC scope |
| 59 | API-07 | Missing security settings routes | — | LOW | Not in AC scope |
| 60 | API-08 | Missing AI configuration routes (hardcoded config) | — | MEDIUM | Not in AC scope |
| 61 | API-10 | Missing outbound log viewer route | — | LOW | Storage method exists |
| 62 | API-11 | Missing Tavus webhook receiver | AC-04-B | LOW | Needed when Tavus wired |
| 63 | API-12 | 5 unused IStorage methods | — | LOW | Cleanup |
| 64 | AIO-06 | No multi-org routing for outbound | — | LOW | Single-org assumption |
| 65 | UI-05 | Sales Recent Activity hardcoded (5 items) | — | LOW | Minor |
| 66 | UI-07 | Duplicate insight data files (mocks/insights.ts = lib/insight-data.ts) | — | LOW | Cleanup |
| 67 | UI-08 | ~10 orphaned mock files with no page consumers | — | LOW | Cleanup |
| 68 | MET-04 | Duplicate insight data files (same as UI-07) | — | LOW | Cleanup |
| 69 | VER-10 | Verification maturity Level 1 (ad hoc/manual) | — | HIGH | Addressed in Phase S7 |

---

## Section 5: Contradiction Register

Contradictions from governance_audit.md (C-01 through C-10), resolved using truth hierarchy: UI code → `.agent_docs/acceptance_criteria.md` → PLAN.md.

| # | ID | Contradiction | Resolution (per truth hierarchy) |
|---|-----|---------------|----------------------------------|
| C-01 | Two competing AC documents | Root `ACCEPTANCE_CRITERIA.md` (~249 criteria, table format) vs `.agent_docs/acceptance_criteria.md` (62 ACs, Given/When/Then). Different scopes, formats, and content for AI Chat tiles, widget channels, TeamBox model. | **`.agent_docs/acceptance_criteria.md` is T2 authority.** Root ACCEPTANCE_CRITERIA.md is supplementary for Wave 1 UI prototype criteria. Where they conflict, `.agent_docs/` governs. |
| C-02 | RBAC role count | SRS §1.2 says 4 roles; SRS §6.1, CLAUDE.md, SPEC.md, PRD.md say 8 roles. | **8 roles.** UI code implements 8 roles. SRS §1.2 is stale. |
| C-03 | Role-specific metric tiles | CLAUDE.md: role-specific tiles per persona. ACCEPTANCE_CRITERIA.md: role-specific tiles. `.agent_docs/acceptance_criteria.md` AC-CH-A: all roles see same 4 tiles (active pipeline, appointments today, open escalations, outbound sent 24h). | **AC-CH-A governs: all roles see same 4 tiles.** UI code currently implements this. CLAUDE.md role-specific spec is superseded. |
| C-04 | Database table count | SRS says 53 tables. SPEC.md shows 1 table. replit.md says 22+ tables. | **22+ tables is reality.** SRS describes a separate production backend. SPEC.md is critically stale. |
| C-05 | Wave/sprint numbering | PRD.md: Waves 1-4. PLAN.md: Waves 0-5 with sub-waves. Sprint_log: Waves 0-4.5. replit.md: "Sprints 1-6". | **New PLAN.md will use Phase S1-S8 numbering.** All prior wave numbering is superseded by stabilization plan. |
| C-06 | Out-of-scope items still present | Artifacts listed as OUT OF SCOPE in `.agent_docs/acceptance_criteria.md` but AC-NAV-A says "Artifacts sub-items are visible" and AC-NAV-B says "Artifacts scoped to data reports only". | **AC-NAV-A/B govern: Artifacts renders but is scoped to data reports only.** The OUT OF SCOPE refers to file upload/sharing/Drive features, not the Artifacts sub-item itself. |
| C-07 | Safety layer count | 3 layers (CLAUDE.md, PRD.md) vs 4 layers (replit.md, Sprint_log) vs 5 layers (PLAN.md). | **4-layer model matches implementation:** Global env → org comm gate → per-channel toggles → rate limit. The 3-layer and 5-layer descriptions are simplifications/expansions of the same system. AC-KS-A/B define the testable behavior. |
| C-08 | File structure discrepancy | SPEC.md and CLAUDE.md list Wave 0/1 file structure. Many files added since. | **Superseded.** SPEC.md archived. CLAUDE.md file structure section is informational only. Actual file system is truth. |
| C-09 | Widget channel count | SRS/SPEC/CLAUDE say 7 channels. `.agent_docs/acceptance_criteria.md` AC-04-A says 4 channels (web chat, web call, form, two-way video). | **AC-04-A governs: 4 channels.** UI code implements 4 channels. SRS 7-channel spec is from a different product version. |
| C-10 | Production backend reference | SRS references "175+ API endpoints, 53 database tables" at nexxusv2.huminicdev.com. | **Not applicable to this codebase.** SRS describes a separate production system. This Replit codebase has 104 routes and 22+ tables. No action needed. |

---

## Section 6: Nuisance Files — Candidates for Removal or Archive

### Archive (move to `archive/` directory)

| File | Reason |
|------|--------|
| `SPEC.md` | Critically stale — describes Wave 0 state (1 DB table, no API routes) |
| `COMMENT_INDEX.md` | Stale references to pre-wiring states |
| `acceptance_criteria_audit.md` (root) | Superseded by fresh audit in `audits/` folder |
| `.agent_docs/rules/operational-context.md` | Never updated since creation; all waves show LOCKED |
| `.agent_docs/codebase-index.md` | Application code section empty after 4.5 waves |
| `.agent_docs/undefined-items.md` | Never used; zero entries logged |

### Remove (delete)

| File | Reason |
|------|--------|
| `home-metrics.png` (root) | Loose screenshot; not referenced by app code |
| `sales-dashboard.png` (root) | Loose screenshot; not referenced by app code |
| `client/src/mocks/insights.ts` | Exact duplicate of `client/src/lib/insight-data.ts`; not imported by any page |
| `client/src/mocks/campaigns.ts` | Orphaned — no production page imports this |
| `client/src/mocks/users.ts` | Orphaned — no production page imports this |
| `client/src/mocks/widgets.ts` | Orphaned — no production page imports this |
| `client/src/mocks/activity.ts` | Orphaned — no production page imports this |
| `client/src/mocks/notifications.ts` | Orphaned — no production page imports this |
| `client/src/mocks/tasks.ts` | Orphaned — no production page imports this |
| `client/src/mocks/files.ts` | Orphaned — no production page imports this |
| `client/src/mocks/agents.ts` | Orphaned — no production page imports this |

### Keep (still imported by production code)

| File | Reason |
|------|--------|
| `client/src/mocks/messages.ts` | Imported by `my-work.tsx` — remove AFTER wiring to real API (Phase S8) |
| `client/src/mocks/conversations.ts` | Imported by `my-work.tsx` — remove AFTER wiring to real API (Phase S8) |
| `client/src/mocks/index.ts` | Barrel export — remove AFTER all mock consumers eliminated (Phase S8) |
| `client/src/lib/insight-data.ts` | Imported by `insights.tsx` — remove AFTER wiring to real API (Phase S4/S8) |

---

## Summary

| Category | Count | HIGH | MEDIUM | LOW |
|----------|-------|------|--------|-----|
| RC-Blocking | 12 | 11 | 1 | 0 |
| Structural & Safety | 18 | 2 | 14 | 2 |
| Governance & Documentation | 12 | 2 | 8 | 2 |
| Deferred | 27 | 1 | 10 | 16 |
| **TOTAL** | **69** | **16** | **33** | **20** |

(80 original GAPS.md items consolidated to 69 entries after merging duplicates: UI-01=MET-01, API-13=AIO-04, UI-07=MET-04, API-15=AIO-05)

| Contradictions Registered | 10 |
| Contradictions Resolved | 10 (all resolved via truth hierarchy) |
| Files to Archive | 6 |
| Files to Remove | 11 |
| Files to Keep (still imported) | 4 |
