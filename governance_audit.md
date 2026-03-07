# Governance & Source-of-Truth Audit — Nexxus Connect v2.2

**Audit Date:** 2026-03-07
**Scope:** All governance documents in the repository
**Auditor:** Automated governance audit (read-only)
**Method:** Full read of every governance document, cross-referencing claims, statuses, and authority declarations

---

## 1. Document Inventory

| Document | Stated Purpose | Claimed Authority | Last Updated |
|----------|---------------|-------------------|--------------|
| **PRD.md** | Product Requirements Document — problem, users, goals, roadmap, features | Defines product vision, business goals, 4-wave roadmap, success metrics, constraints | Not dated explicitly |
| **SRS.md** | Software Requirements Specification — functional and non-functional requirements | "GOVERNING DOCUMENT" — defines all system behavior requirements | 2026-03-03 |
| **SPEC.md** | Architecture Specification — file structure, component hierarchy, state, data flow | Architecture facts, technical implementation details | Not dated explicitly |
| **CLAUDE.md** | Claude Code Implementation Guide — rules for AI agents implementing features | "GOVERNING DOCUMENT — Direct guidance for Claude Code implementation agents" — defines truth hierarchy, locked UI, forbidden actions | 2026-03-03 |
| **PLAN.md** | Implementation Plan (4-Wave) — sprint breakdown, completion criteria, decision log | Development sequencing, wave status tracking | 2026-03-06 (v3.1) |
| **ACCEPTANCE_CRITERIA.md** | Testable acceptance criteria organized by wave | Verifiable behaviors for the UI prototype | Not dated explicitly |
| **Sprint_log.md** | Sprint execution history, completion tracker | Sprint-by-sprint record of what was built and tested | Ongoing |
| **replit.md** | Replit-specific project context for AI agents | Quick-reference for Replit AI — truth hierarchy, architecture, features built | Not dated explicitly |
| **.agent_docs/acceptance_criteria.md** | "SINGLE SOURCE OF TRUTH FOR ALL ACCEPTANCE CRITERIA" | Claims READ-ONLY, chmod 444 — owner changes only; 62 ACs in Given/When/Then format | 2026-03-04 |
| **.agent_docs/rules/agent-roles.md** | Agent team structure, roles, file scope, compliance log | Defines 7 agent roles, cross-sign rules, autonomy levels, stop conditions | 2026-03-04 |
| **.agent_docs/rules/code-conventions.md** | TypeScript, JSDoc, naming, import, error-handling conventions | Code quality standards for all agents | 2026-03-04 |
| **.agent_docs/rules/testing-protocol.md** | Test structure, spec.ts conventions, quality gates | Testing methodology, AC traceability, kill switch smoke tests | 2026-03-04 |
| **.agent_docs/rules/file-management.md** | File scope rules, commit requirements, archiving | Session scope, branch strategy, DO_NOT_TOUCH enforcement | 2026-03-04 |
| **.agent_docs/rules/operational-context.md** | Live deployment context, environment status, external accounts | Deployment status, kill switch status, mockup references, known issues | 2026-03-04 |
| **.agent_docs/codebase-index.md** | Living codebase map — file path, purpose, dependencies | Machine-readable index maintained by Scribe agent | 2026-03-04 |
| **.agent_docs/undefined-items.md** | Log of undefined behaviors requiring owner resolution | Undefined behavior tracking — agents must HALT on undefined items | 2026-03-04 |
| **acceptance_criteria_audit.md** | Devil's advocate review of acceptance criteria gaps | Gap analysis across sprints — identifies hidden gaps, missing tables, undefined behaviors | 2026-03-05 |
| **COMMENT_INDEX.md** | Master reference for developer comments in the codebase | Comment structure and cross-cutting concern documentation | 2026-03-04 |

---

## 2. Truth Hierarchy — As Stated Across Documents

Three different documents declare truth hierarchies, and they differ:

### CLAUDE.md (§1.2) — Truth Hierarchy

| Priority | Source | Authoritative For |
|----------|--------|-------------------|
| 1 | Current UI Code (`client/src/`) | All visual behavior, layout, interactions, component structure |
| 2 | ACCEPTANCE_CRITERIA.md | Verifiable behaviors as documented from the UI |
| 3 | Constitution + SRS | Principles, requirements, metric formulas |
| 4 | API contract / storage interface | Data shapes and endpoint contracts |
| 5 | SRS | System requirements |
| 6 | Implementation Plan | Development sequencing |

### replit.md — Truth Hierarchy

| Priority | Source |
|----------|--------|
| 1 | UI code (approved design) |
| 2 | `.agent_docs/acceptance_criteria.md` (62 ACs) |
| 3 | SRS documentation |
| 4 | API contract |
| 5 | PLAN.md sequencing |

### .agent_docs/rules/operational-context.md — Truth Tier Reference

States: "T1 (approved UI mockups) is the highest truth tier in CLAUDE.md."

### Observations

- **CONFLICT C-TH-1:** CLAUDE.md references "Constitution + SRS" at priority 3, but no document named "Constitution" exists in the repository. UNCERTAIN: This may refer to an external document or may be a vestigial reference.
- **CONFLICT C-TH-2:** CLAUDE.md lists "ACCEPTANCE_CRITERIA.md" at priority 2. replit.md lists ".agent_docs/acceptance_criteria.md" at priority 2. These are two different files with different content (see Conflicts section).
- **CONFLICT C-TH-3:** operational-context.md says "T1 = approved UI mockups" is the highest truth tier, but CLAUDE.md says "T1 = Current UI Code." These are not the same thing — mockups are design deliverables; UI code is the implementation. operational-context.md also lists all mockup deliverables as "NOT DELIVERED."
- **CONFLICT C-TH-4:** SRS.md appears at BOTH priority 3 ("Constitution + SRS") AND priority 5 ("SRS") in CLAUDE.md's hierarchy. This is contradictory — SRS cannot be both priority 3 and priority 5.
- **OBSERVATION:** replit.md's hierarchy is simpler and does not include PRD.md, SPEC.md, or CLAUDE.md itself in the hierarchy. CLAUDE.md omits PRD.md and SPEC.md as well.

---

## 3. Conflicts Found

### C-01: Two Competing Acceptance Criteria Documents

**ACCEPTANCE_CRITERIA.md** (root) contains Wave 1-4 acceptance criteria organized by UI feature with ~160+ individual criteria in table format.

**.agent_docs/acceptance_criteria.md** claims to be the "SINGLE SOURCE OF TRUTH FOR ALL ACCEPTANCE CRITERIA" with 62 ACs in Given/When/Then format covering MVP Functions 1-10, Kill Switch, TeamBox, Enforcer, AI Chat, Hunch Filter, and Navigation.

These two documents:
- Cover different scopes (root AC focuses on Wave 1 UI prototype features; .agent_docs AC focuses on MVP functions and behavioral contracts)
- Use different formats (table-based vs. Given/When/Then)
- Have overlapping but non-identical coverage of features like kill switch, TeamBox, AI Chat
- Both are referenced as authoritative in different documents (CLAUDE.md references "ACCEPTANCE_CRITERIA.md"; replit.md references ".agent_docs/acceptance_criteria.md")

**Specific content conflicts between the two AC documents:**

| Topic | ACCEPTANCE_CRITERIA.md | .agent_docs/acceptance_criteria.md |
|-------|----------------------|-----------------------------------|
| AI Chat metric tiles | W1-AC-010: 4 role-specific tiles (Partner Orgs, Pipeline Value, Hot Opportunities, etc.) | AC-CH-A: 4 tiles are "active pipeline count, appointments today, open escalations, outbound sent (last 24 hours)" |
| Widget channels | W1-AC-110: widget landing with FAB having 7 channels (chat, video, voice, SMS, callback, email, WhatsApp) | AC-04-A: "web chat, web call, form, and two-way video" — only 4 channels |
| Sales sub-menu | W1-AC-092a: "Dashboard, Agents, Insights, Calendar" | AC-NAV-F: "Dashboard, Agents, Insights, and Calendar... And Campaigns is NOT present under Sales" — adds explicit exclusion |
| TeamBox items | W1-AC-091: "Conversations, Tasks, Workflows" | AC-NAV-D: "Tasks, Conversations, and Workflows" — different ordering |
| TeamBox types | W1-AC-020-024: conversation-based with status filters | AC-TB-A: "Task, Escalation, and Unsent Message are distinct visual types" — fundamentally different model |
| Management hunches | W1-AC-071: hunch cards with pattern/recommendation | AC-NAV-H: "Hunches (Coming Soon)" — says Hunches should show Coming Soon label |

### C-02: RBAC Role Count Discrepancy

- **SRS.md §1.2:** "4 RBAC roles (Super Admin, Partner Admin, Org Admin, Staff)"
- **SRS.md §6.1:** "8 roles" — contradicts its own §1.2
- **CLAUDE.md, SPEC.md, PRD.md:** All say 8 roles
- **Observation:** SRS §1.2 appears to be stale from an earlier version.

### C-03: Role-Specific Metric Tiles Conflict

- **CLAUDE.md §5.3:** executive sees "Pipeline Value, Lead Source, Lead Quality, Demand Score" (same as org_admin); sales_manager sees same; service sees "Hot Opportunities, Buying Intel, Threats, Urgency Score"
- **ACCEPTANCE_CRITERIA.md W1-AC-010e:** executive sees "Revenue, Team Activity, Customer Sat, ROI Score"
- **ACCEPTANCE_CRITERIA.md W1-AC-010e2:** sales_manager sees "Pipeline Value, Team Leads, Conversion Rate, Urgency Score"
- **ACCEPTANCE_CRITERIA.md W1-AC-010e4:** service sees "Active Campaigns, Messages Sent, Appointments, Upsell Rate"
- **.agent_docs/acceptance_criteria.md AC-CH-A:** All roles see "active pipeline count, appointments today, open escalations, outbound sent (last 24 hours)"
- **replit.md:** "Home page role-based design metrics (8 roles with realistic fallback values)" and also "4 AC-required tiles on AI Chat: active pipeline, appointments today, open escalations, outbound sent 24h"

**Result:** Three different specifications for what the AI Chat metric tiles should show, all claiming authority.

### C-04: Database Table Count Discrepancy

- **SRS.md:** "175+ API endpoints, 53 database tables" (production backend reference)
- **replit.md:** "22 tables" — lists them explicitly
- **Sprint_log.md:** "9 tables" in Wave 0 description
- **SPEC.md §12:** Shows a single `users` table as the "current" database schema
- **.agent_docs/codebase-index.md:** References the schema but provides no table count

**Observation:** SPEC.md appears significantly stale — it describes the database as having a single `users` table, while the actual schema has 22+ tables per replit.md and Sprint_log.md.

### C-05: Wave/Sprint Numbering Inconsistency

- **PRD.md §5:** Defines Waves 1-4 (UI Prototype, Backend Wiring, Intelligence & Metering, Studio)
- **PLAN.md:** Defines Waves 0-5 with sub-waves 3.5, 3.6 — a different numbering scheme
- **Sprint_log.md:** References Waves 0, 1, 2.1, 2.2a, 2.2b, 2.3, 3.1, 3.2, 3.3, 3.5, 3.6, 4, 4.5
- **replit.md:** References "Sprints 1-6" — yet another numbering scheme
- **ACCEPTANCE_CRITERIA.md:** Uses Waves 1-4 matching PRD.md
- **.agent_docs/acceptance_criteria.md:** No wave references

**Result:** No consistent wave/sprint numbering across governance documents.

### C-06: "Out of Scope" Items Still Present

**.agent_docs/acceptance_criteria.md** explicitly lists "Drive, Custom Agent, Sharing, Artifacts" as OUT OF SCOPE and says finding references should "generate a test failure."

However:
- **CLAUDE.md §4.2:** Lists "AI Chat: Favorites, Chat History, Artifacts" as sub-menu panel content
- **ACCEPTANCE_CRITERIA.md W1-AC-012g:** "Artifacts section renders with placeholder text"
- **.agent_docs/acceptance_criteria.md AC-NAV-A:** "Favorites, Chat History, and Artifacts sub-items are visible"
- **.agent_docs/acceptance_criteria.md AC-NAV-B:** "Artifacts scoped to data reports only"

**Conflict:** Artifacts is simultaneously listed as "OUT OF SCOPE — DO NOT TEST" and has acceptance criteria requiring it to render.

### C-07: Safety Layer Count

- **CLAUDE.md §8.1:** Describes 3-layer safety (per-conversation, per-campaign, global gate)
- **PRD.md §6.4:** Describes 3-layer safety
- **replit.md:** "4-layer safety: Global env → org comm gate → per-channel toggles → rate limit"
- **Sprint_log.md W3.6:** "4-layer safety stack" (Global → org → channel → rate limit)
- **PLAN.md §4.1:** "5-layer check" in outbound engine

**Result:** Safety layer count ranges from 3 to 5 depending on which document you read.

### C-08: File Structure Discrepancy

- **SPEC.md §1:** Lists file structure without `server/auth.ts`, `server/outbound.ts`, `server/sync.ts`, `server/seed.ts`, `server/braveSearch.ts`, `server/vendorProxy.ts`, `shared/models/`, `scripts/`, `client/src/hooks/useStreamingChat.ts`, etc.
- **CLAUDE.md §2.2:** Similarly missing many files that exist in the actual codebase
- **Observation:** Both documents reflect Wave 0/1 state, not current state.

### C-09: Widget Channel Count

- **SRS.md §2.12 WLP-03:** FAB with "7 channels: chat, video, voice, SMS, callback, email, WhatsApp"
- **SPEC.md §8:** "The widget landing page FAB supports 7 customer-facing channels"
- **CLAUDE.md §8.3:** "FAB supports 7 channels"
- **.agent_docs/acceptance_criteria.md AC-04-A:** "web chat, web call, form, and two-way video" — only 4 channels
- **replit.md:** "Exactly 4 channels (Web Chat, Web Call, Contact Form, Two-Way Video)"

**Conflict:** SRS/SPEC/CLAUDE say 7 channels; .agent_docs/acceptance_criteria and replit.md say 4 channels. Apparently the newer documents (replit.md, .agent_docs/acceptance_criteria.md) represent the actual implementation.

### C-10: Production Backend Reference

- **SRS.md §1.2:** "production backend (175+ API endpoints, 53 database tables)"
- **PRD.md §7:** References production at "nexxusv2.huminicdev.com"
- **COMMENT_INDEX.md:** "API: nexxusv2.huminicdev.com (185+ endpoints, 53 tables, 747 tests)"

**Observation:** The SRS says 175+ endpoints while COMMENT_INDEX.md says 185+. Minor discrepancy but indicates these numbers are not tracked precisely.

---

## 4. Duplications Found

### D-01: RBAC Matrix — Duplicated 5 Times

The section access matrix (which roles see which sidebar items) is duplicated in:
1. PRD.md §6.6
2. SRS.md §6.2
3. SPEC.md §6
4. CLAUDE.md §5.2
5. COMMENT_INDEX.md (summary form)

All five are consistent with each other, which is good, but maintaining five copies creates drift risk.

### D-02: Route Map — Duplicated 3 Times

The full route-to-component mapping appears in:
1. SRS.md §2.x (across multiple sections)
2. SPEC.md §3
3. CLAUDE.md §2.3

### D-03: View Configuration Rules — Duplicated 4 Times

The "cardinal layout rules" (data center → chat right, chat center → info right, TeamBox self-contained) appear in:
1. SRS.md §4.1
2. SPEC.md §4 and §10
3. CLAUDE.md §3.3
4. COMMENT_INDEX.md

### D-04: File Structure — Duplicated 3 Times

1. SPEC.md §1
2. CLAUDE.md §2.2
3. COMMENT_INDEX.md (as tables)

### D-05: Sub-Menu Panel Content — Duplicated 3 Times

1. SRS.md §3.2
2. CLAUDE.md §4.2
3. ACCEPTANCE_CRITERIA.md (W1-AC-090 through W1-AC-093)

### D-06: Campaign Data Model — Duplicated 2 Times

1. SRS.md §5.1-5.3
2. SPEC.md §8 (Campaigns section)

### D-07: Kill Switch Backend Spec — Duplicated 3 Times

The database columns (outbound_enabled, sms_enabled, phone_enabled, email_enabled) are specified in:
1. PRD.md §8 (constraint #8)
2. CLAUDE.md §8.1.1
3. SRS.md §5.4
4. .agent_docs/acceptance_criteria.md (AC-KS-A)

### D-08: Truth Hierarchy — Duplicated 2 Times

1. CLAUDE.md §1.2
2. replit.md (simplified version)

---

## 5. Status Drift Observations

### SD-01: PLAN.md Claims ~92% Complete but Wave 3.5 Shows Unchecked Items

PLAN.md header says "~92%" complete and lists Wave 3.5 status as "Complete." However, §5.6 (Wave 3.5 Completion Criteria) shows ALL items with `- [ ]` (unchecked checkboxes), suggesting they were never formally checked off despite the section header saying "NEXT" and other areas saying "Complete."

### SD-02: Sprint_log.md Claims ~95% Complete vs PLAN.md's ~92%

Sprint_log.md says "Overall Progress: ~95%" while PLAN.md says "~92%." These should be the same number or at least explained.

### SD-03: PLAN.md Wave Status Contradictions

- Wave 3 header says "COMPLETE" but §3.1 says "In Progress (Phase 1 Complete)" for Wave 2
- Wave 3.5 header says "(NEXT)" but Sprint_log.md shows it as DONE
- Wave 4 listed as "Complete" in the wave summary table but §6.3 lists many items as "Deferred to Wave 5 or Future"

### SD-04: operational-context.md is Severely Stale

- §1 lists Production as "ACTIVE" and Staging as "NOT YET CREATED" — this was a Wave 0 pre-flight item
- §5 shows ALL waves (0-6) with statuses from before development began (Wave 0 "IN PROGRESS", all others "LOCKED")
- §6 shows ALL Claude system-level audit items as "[pending]"
- §7 lists P0 issues that appear to have been resolved (kill switch, pipeline count) but are still marked "OPEN"
- §8 lists ALL human relay tasks as "PENDING"

**This document has not been updated since initial creation (2026-03-04) and does not reflect project progress through Waves 0-4.5.**

### SD-05: .agent_docs/codebase-index.md Has No Application Code

The index has governance documents listed but the "APPLICATION CODE" section says "(Wave 1 files will be indexed here)" with no actual entries. The project has completed through Wave 4.5 with 50+ application files, none indexed.

### SD-06: .agent_docs/undefined-items.md Has No Entries

States "(none logged yet — clean start)" for both open and resolved items. Given the complexity of the project and the many decisions made across 10+ sprints, either: (a) the undefined behavior logging process was never followed, or (b) all behaviors were pre-defined. UNCERTAIN: The former seems more likely.

### SD-07: Enforcer Compliance Log Empty

.agent_docs/rules/agent-roles.md shows the Enforcer Compliance Log with "(Wave 0 — no merges yet)" — no compliance checks have ever been logged despite multiple waves of development being complete.

### SD-08: SPEC.md Database Schema is Wave 0 State

SPEC.md §12 shows only a single `users` table with `id`, `username`, `password`. The actual schema has 22+ tables including conversations, campaigns, hunches, warehouse_leads, etc. This section is critically stale.

### SD-09: SPEC.md API Contract Says "No Active API Routes"

SPEC.md §11 states "The backend currently has no active API routes. All data is served from client-side mock files." The project has 50+ active API routes per Sprint_log.md and replit.md.

### SD-10: Sprint_log.md Sprint Criteria Checkboxes Not Updated

Sprint_log.md §2.1-2.2 (Sprint Descriptions for future sprints 2.2b, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2) still show `- [ ]` unchecked criteria despite having corresponding "Sprint Execution Log" entries marked as DONE with `- [x]` criteria. The planning section was never updated when the execution section was added.

### SD-11: COMMENT_INDEX.md References Stale States

- Lists `AuthContext.tsx` as "NOT wired yet (Wave 2)" — but Sprint_log.md shows auth was wired in Wave 2.1
- Lists `files.ts` as "legacy, may be removed" — still present
- Lists mock data files with "Production Wiring" plans that have been partially completed but the index doesn't reflect this

### SD-12: SRS.md Mock Data Counts Don't Match Reality

SRS.md §7.2 says "6 agents across 3 departments" with "Sales Agent (voice), Communications Agent (sms), CRM Data Agent (chat), Sales Guru (chat)" — these are generic names. COMMENT_INDEX.md says "5 real Serra Auto Group agents (Caroline, Magnolia, Georgia, Elizabeth, Savannah)." The mock data was replaced with real agent data but SRS.md was not updated.

### SD-13: acceptance_criteria_audit.md Gaps Resolved but Not Tracked

acceptance_criteria_audit.md identifies 50 gaps (G1-G50) and 13 backend gaps (B1-B13). Many of these were addressed in subsequent sprints (e.g., G1: agent chat persistence — done in Sprint 2.1; G2: instructions column — done; B3: campaign_recipients table — done; B4: notifications table — done; B6: widgets table — done; B7: tasks table — done). However, the audit document was never updated to reflect which gaps were closed.

---

## 6. Cross-Reference Accuracy

### CR-01: CLAUDE.md Cross-References
Header references: ACCEPTANCE_CRITERIA.md, SRS.md, SPEC.md, PLAN.md
- All files exist ✓
- Does NOT reference .agent_docs/acceptance_criteria.md — which claims to be the single source of truth for ACs

### CR-02: SRS.md Cross-References
Header references: CLAUDE.md, PRD.md, SPEC.md, PLAN.md, ACCEPTANCE_CRITERIA.md
- All files exist ✓
- Does NOT reference .agent_docs/acceptance_criteria.md

### CR-03: PLAN.md Cross-References
Header references: PRD.md, SRS.md, SPEC.md, ACCEPTANCE_CRITERIA.md, CLAUDE.md, Sprint_log.md
- All files exist ✓
- Does NOT reference .agent_docs/acceptance_criteria.md

### CR-04: replit.md Cross-References
References ".agent_docs/acceptance_criteria.md — DO NOT MODIFY"
- File exists ✓
- Does NOT reference root ACCEPTANCE_CRITERIA.md

### CR-05: .agent_docs/codebase-index.md References
Lists "DO_NOT_TOUCH.md" and "DESIGNER_BRIEF.md" and "MEMORY.md" as files:
- DO_NOT_TOUCH.md: Does not appear to exist in the file listing — UNCERTAIN
- DESIGNER_BRIEF.md: Does not appear to exist in the file listing — UNCERTAIN
- MEMORY.md: Listed as "PENDING CREATION" — never created

### CR-06: .agent_docs/rules/code-conventions.md File Organization
§4 references directories that don't exist in the actual project:
- `server/routes/` — actual structure is `server/routes.ts` (single file)
- `server/services/` — does not exist
- `server/middleware/` — does not exist
- `db/schema.ts` and `db/migrations/` — actual location is `shared/schema.ts` and `migrations/`
- `central-mcp/` — does not exist in this repository
- `client/src/types/` — does not exist

### CR-07: .agent_docs/rules/code-conventions.md Kill Switch Pattern
§5 references `../services/kill-switch-service` and `../types/kill-switch` — neither exists. The actual implementation is in `server/outbound.ts`.

### CR-08: .agent_docs/rules/file-management.md Branch Strategy
§3 references branches `v2.2` and `v2.2-wave-N-sprint-M` — UNCERTAIN whether these exist; the project appears to operate on a single branch in Replit.

### CR-09: .agent_docs/rules/testing-protocol.md spec.ts Reference
References `spec.ts` as the test file — this file does not appear to exist in the repository file listing.

---

## 7. Summary of Governance Health

### Critical Issues

1. **Dual acceptance criteria documents with conflicting content (C-01, C-03, C-06).** The root `ACCEPTANCE_CRITERIA.md` and `.agent_docs/acceptance_criteria.md` define different requirements for the same features (especially AI Chat tiles, widget channels, TeamBox model). No document clearly resolves which takes precedence for specific conflicts.

2. **SPEC.md is critically stale (SD-08, SD-09).** It describes a single-table database and no API routes, while the project has 22 tables and 50+ routes. Any agent relying on SPEC.md for architecture guidance will get dangerously incorrect information.

3. **operational-context.md has never been updated (SD-04).** It shows all pre-flight tasks as pending and all waves as locked, despite 4.5 waves of development being complete.

4. **Codebase index is empty (SD-05).** The Scribe agent role was defined but the actual indexing was never performed across any sprint.

5. **Enforcer process never executed (SD-07).** Despite being defined with 11 compliance checks and a requirement to run on every merge, no compliance check has ever been logged.

### Moderate Issues

6. **Truth hierarchy is ambiguous (C-TH-1 through C-TH-4).** The hierarchy references a non-existent "Constitution," lists SRS at two different priority levels, and different documents point to different AC files as authoritative.

7. **Massive content duplication (D-01 through D-08).** The RBAC matrix alone appears in 5 documents. Route maps appear in 3. This creates significant drift risk (and some drift has already occurred in SRS.md's role count).

8. **Sprint/wave numbering inconsistent (C-05).** PRD uses Waves 1-4, PLAN uses 0-5 with sub-waves, Sprint_log uses decimal sprints, replit.md uses "Sprints 1-6."

9. **Progress percentages disagree (SD-02).** PLAN.md says ~92%, Sprint_log.md says ~95%.

10. **Code conventions reference non-existent files and directories (CR-06, CR-07).** The prescribed project structure doesn't match reality.

### Low Issues

11. **Safety layer count inconsistent (C-07).** Ranges from 3 to 5 across documents.
12. **acceptance_criteria_audit.md is stale (SD-13).** Many identified gaps have been resolved but the document doesn't reflect this.
13. **Sprint_log planning sections have stale checkboxes (SD-10).** Planning criteria not updated even when execution sections show completion.
14. **No undefined items logged (SD-06).** Process appears to have been skipped entirely.

### Governance Health Score: POOR

The governance framework is well-designed in theory (clear roles, truth hierarchy, enforcer process, cross-sign rules, compliance gates) but has not been maintained in practice. The gap between the governance aspiration (13+ interconnected documents with strict change control) and the governance reality (stale documents, empty logs, conflicting sources of truth, no enforcer runs) is significant.

The most reliable governance documents appear to be:
- **replit.md** — most recently reflects actual project state
- **Sprint_log.md** (execution sections only) — detailed record of what was actually built
- **.agent_docs/acceptance_criteria.md** — appears to reflect the latest agreed-upon behavioral requirements

The least reliable governance documents:
- **SPEC.md** — critically stale, reflects Wave 0 state
- **.agent_docs/rules/operational-context.md** — never updated past initialization
- **.agent_docs/codebase-index.md** — application code section empty
- **SRS.md §1.2** — still references 4 roles despite 8-role system being established everywhere else
