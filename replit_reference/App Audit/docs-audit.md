# Forensic Documentation Audit -- Nexxus V2

**Audit Date:** 2026-02-21
**Auditor:** Claude Opus 4.6 (forensic code auditor)
**Scope:** Governing documents, known issues, customer acceptance criteria, production deployments, open design decisions
**Repository:** `/home/ubuntu/Claude-store/nexxus-v2`
**Branch:** `master`

---

## Table of Contents

1. [Document Inventory](#1-document-inventory)
2. [Master SRS Summary](#2-master-srs-summary)
3. [Constitution Summary](#3-constitution-summary)
4. [Current-State Assessment Summary](#4-current-state-assessment-summary)
5. [Implementation Plan Summary](#5-implementation-plan-summary)
6. [Brain Dump Summary](#6-brain-dump-summary)
7. [Design Flags Status](#7-design-flags-status)
8. [Customer Acceptance Criteria Status](#8-customer-acceptance-criteria-status)
9. [Production Customer Deployments](#9-production-customer-deployments)
10. [Known Bugs, Tech Debt, and Open Issues](#10-known-bugs-tech-debt-and-open-issues)
11. [Document Consistency Analysis](#11-document-consistency-analysis)
12. [Risk Assessment](#12-risk-assessment)
13. [Recommendations](#13-recommendations)

---

## 1. Document Inventory

### 1.1 Governing Documents (4 of 4 exist)

| Document | Path | Version | Date | Status |
|----------|------|---------|------|--------|
| Constitution | `docs/CONSTITUTION.md` | 1.0 | 2026-02-18 | Current |
| Master SRS | `docs/MASTER_SRS.md` | 2.0 | 2026-02-18 | Current |
| Current-State Assessment | `docs/CURRENT_STATE_ASSESSMENT.md` | 2.0 | 2026-02-18 | Current |
| Implementation Plan | `docs/IMPLEMENTATION_PLAN.md` | 2.0 | 2026-02-18 | Current |

All four governing documents exist. They were last updated on 2026-02-18, making them 3 days old at audit time. No version conflicts detected between them.

### 1.2 Context and Reference Documents

| Document | Path | Status |
|----------|------|--------|
| Brain Dump (formalized) | `docs/BRAIN_DUMP.md` | Authoritative user intent |
| Design Flags | `docs/DESIGN_FLAGS.md` | 1 open flag (PENDING REVIEW) |
| Production Deployments | `docs/reference/PRODUCTION_CUSTOMER_DEPLOYMENTS.md` | Current (last updated 2026-01-16) |
| Customer Onboarding Kickoff | `docs/CUSTOMER_ONBOARDING_KICKOFF.md` | Current |
| CLAUDE.md (project config) | `CLAUDE.md` | Current (last updated 2026-02-16) |

### 1.3 Evidence Artifacts

| Artifact | Path | Content |
|----------|------|---------|
| Field Population Audit | `docs/evidence/field-population-audit.json` | 100-record audit, 50 fields, fill rates documented |
| VIN API Probe Results | `docs/evidence/vin-api-probe-results.json` | 30+ endpoint probe results |
| VIN API Probe Round 2 | `docs/evidence/vin-api-probe-round2-results.json` | Follow-up probe |
| PUT Header Probe | `docs/evidence/put-header-probe-results.json` | Confirmed PUT /leads accepts leadStatus |
| Certification Results | `docs/evidence/certification-results.md` | Phase 1-7 3-proof certifications |
| Sprint 1 Verification Reports | `docs/evidence/sprint-1/step-1.{1-6}/VERIFICATION_REPORT.md` | 6 sprint verification reports |
| MVP Verification Screenshots | `docs/evidence/mvp-verification/*.png` | 11 screenshot proofs |
| Demo Validation Reports | `docs/evidence/demo-validation/*.md` | 3 validation reports |

---

## 2. Master SRS Summary

**File:** `/home/ubuntu/Claude-store/nexxus-v2/docs/MASTER_SRS.md`
**Version:** 2.0 (2026-02-18)
**Supersedes:** SRS v3.0, Addendum v3.1, Addendum v3.2, Master SRS v1.0

### 2.1 Scope

The Master SRS defines Nexxus as an "AI orchestration layer that bridges businesses, their data, third-party integrations, language models, and tools." It explicitly states Nexxus is NOT a CRM, NOT a marketing automation tool, and NOT a content development platform.

### 2.2 Structure

The document spans 17 major sections plus 5 appendices:

| Section | Topic | Key Content |
|---------|-------|-------------|
| 1 | Executive Summary | Platform operator (Huminic), partner model, value proposition |
| 2 | Platform Identity | Not automotive-only, AI-first, partner-enabled |
| 3 | User Roles & Personas | 4-tier RBAC with permissions matrix (16 capabilities x 4 roles) |
| 4 | Navigation & Layout | 5 layout types (A-E), sidebar structure, dashboard behavior |
| 5 | Core Features | 10 feature areas: Auth, Dashboard, DealerBrain, Drive, Insights, Hub, Activity, Settings, Widget, Triggers |
| 6 | Integration Architecture | VIN Solutions, VAPI, Tavus, TextMagic, Resend, Google Calendar |
| 7 | Data Architecture | Truth hierarchy, Context Router, webhook-to-lead flow, blocked data analysis |
| 8 | Metrics Specification | 50+ derivable metrics across 5 categories, role-based dashboard targets, field population policy |
| 9 | Acceptance Criteria | 19 locked ACs across 5 phases (Phase 0-4) |
| 10 | Technical Constraints | VIN API limitations, header requirements, Express routing, PostgreSQL notes |
| 11 | Non-Functional Requirements | Performance targets, security model, reliability, testing, database |
| 12 | Economics | Voice ($0.25/min), Video ($0.32/min), SMS ($0.05/msg) with margins |
| A | Actionable Triggers | 13 triggerable events with current API access |
| B | Items Requiring New Development | 16 items (6 blocked by 403, 10 unblocked) |
| C | Technology Stack | Full stack listing |
| D | Cross-Platform Data Flow | Visual diagram |
| E | Document History | Version tracking |

### 2.3 Requirement Count

The SRS does not use traditional numbered requirements (REQ-001 style). Instead, it defines:

- **19 formal acceptance criteria** (AC-001 through AC-019), grouped into 5 phases
- **50+ derivable metrics** defined across 5 categories (pipeline, sales, voice, video, cross-platform)
- **16 items requiring new development** (Appendix B)
- **13 accessible VIN API endpoints** and **17 blocked endpoints** with impact analysis
- **15 VAPI endpoints** and **10 Tavus endpoints** documented

### 2.4 Feature Areas

| Feature Area | SRS Status | Key Details |
|-------------|-----------|-------------|
| Authentication & RBAC | CONFIRMED | 53 RLS policies, 28 tables, 4-tier RBAC |
| Dashboard | NEEDS WORK | Metrics consolidation required, source labels to remove, role views to verify |
| DealerBrain / Agents | NEEDS WORK (partial) | 24 tools, blocked data awareness missing, vendor name leaks, performanceMetrics unwired |
| Drive | CONFIRMED | Personal + shared folders, artifact auto-save |
| Insights | NEEDS WORK | Metrics fragmentation, Dealer Pulse needs certification |
| Hub / Work Center | NEEDS WORK (partial) | Core confirmed; SMS AI routing and collision avoidance missing |
| Activity Feed | CONFIRMED (partial) | CSV export missing |
| Settings | CONFIRMED | Lead assignment configurable |
| Widget System | CONFIRMED | Master Widget + Hosted Pages complete |
| Agent Triggers | CONFIRMED | 7 event types, 5 action types, conditions engine |

### 2.5 VIN Solutions API Coverage

- **13 accessible endpoints** across v1/v3/gateway versions
- **17 blocked endpoints** (all return 403 Forbidden)
- **3 endpoints with parameter issues** (400 errors)
- Critical blind spots: communication logs, deals, appointments, inventory, activity logs
- Impact: platform can see beginning (lead creation) and end (SOLD/LOST) but not middle (human execution)

---

## 3. Constitution Summary

**File:** `/home/ubuntu/Claude-store/nexxus-v2/docs/CONSTITUTION.md`
**Version:** 1.0 (2026-02-18)

### 3.1 Platform Identity

- AI orchestration layer, not a CRM or marketing tool
- Partner delivery model (domain experts distribute to their customer segments)
- First vertical: automotive (architecture is industry-agnostic)
- Current customers: Serra Automotive, Hyundai of Columbia

### 3.2 Governing Principles (6)

| # | Principle | Core Rule |
|---|-----------|-----------|
| 2.1 | Truth Hierarchy | VIN API > VAPI/Tavus > Local DB > Derived metrics |
| 2.2 | Honest AI | DealerBrain admits unavailability; no fabrication; cites sources internally |
| 2.3 | Role-Based Experience | Each role sees only what is relevant; RLS enforced at database level |
| 2.4 | Data Accuracy Over Feature Quantity | 50% field fill rate minimum; ground truth verification; no placeholders |
| 2.5 | Non-Destructive Operations | VIN data is read-only by default; feature branches; certification before credit |
| 2.6 | Certification Over Credit | 3-proof validation: config test + functional test + visual/E2E test |

### 3.3 Development Rules (4 categories)

- **UI Rules:** No vendor names, no source labels, no placeholders, "Skills" not "Tools"
- **Data Rules:** Correct version headers, source tagging, cache TTL, excel_upload exclusion, dedup before create
- **Integration Rules:** OAuth2 encrypted storage, webhook idempotency, TextMagic AI via DealerBrain not VAPI
- **Testing Rules:** Quality gates before deploy, feature branches, master for deployment, 3-proof per feature

### 3.4 Non-Negotiable Constraints (8)

1. Never modify production v1
2. Never share v1/v2 credentials
3. Never deploy from feature branch
4. Never expose vendor names in UI
5. Never fabricate data or show unverified metrics
6. Never hardcode integration values
7. Never bypass RLS/multi-tenant isolation
8. Never modify VAPI webhooks without explicit approval

---

## 4. Current-State Assessment Summary

**File:** `/home/ubuntu/Claude-store/nexxus-v2/docs/CURRENT_STATE_ASSESSMENT.md`
**Version:** 2.0 (2026-02-18)
**Methodology:** Zero-trust static code audit + build verification

### 4.1 Quality Gate Results

| Gate | Result |
|------|--------|
| TypeScript compilation (`npm run check`) | PASS -- 0 errors |
| Production build (`npm run build`) | PASS -- 2,791 modules (client) |
| E2E tests | ~1,699 test cases across 49 spec files (runtime pending) |
| Database migrations | 31 files (001 through 031) |
| Route files | 33 files, 285 auth middleware calls |
| Service files | 39+ files |

### 4.2 Codebase Scale

- **36+ database tables** with 60 RLS ENABLE statements and 104 CREATE POLICY declarations
- **31 migration files** covering core tables through service quotas
- **33 route files** with 285 authentication middleware calls
- **39+ service files** implementing the business logic layer
- **49 E2E spec files** with ~1,699 test cases

### 4.3 Feature Certification Status

| Status | Count | Features |
|--------|-------|----------|
| CERTIFIED (build-verified) | 16 | Auth/RBAC, Context Router, Webhook Pipeline, Widget, Triggers, Drive, Credits, Notifications, Tracking, Google Calendar, Hunches/Approvals, AI Governance, Dealer Pulse, Goals, Email, Knowledge Uploads |
| NEEDS WORK | 8 | VIN Solutions (header issues), DealerBrain (false 48h claim, blocked data), Agent System (metrics unwired), TextMagic (no AI routing), Dashboard/Insights (vendor/source labels, fragmented metrics), Hub/Work Center (Mark Contacted local-only), Activity Feed (no CSV export), Settings (functional but depends on other fixes) |

### 4.4 Known Issues Tracked

The assessment documents 3 categories of issues:

- **UI Issues:** 9 items (UI-1 through UI-9) -- vendor name leaks and source label leaks
- **Data/API Issues:** 5 items (DATA-1 through DATA-5) -- header mismatches, false claims, stale docs
- **Feature Gaps:** 9 items (GAP-1 through GAP-9) -- unwired methods, missing features, unperformed audits

### 4.5 Technical Debt Items

| Area | Details |
|------|---------|
| Stale code documentation | 8 files with outdated @see references to archived SRS v3.0 |
| Metrics fragmentation | 5+ services independently compute metrics with no unified interface |
| VIN API header management | Default v3 headers require manual override for v1/gateway endpoints |
| Internal tool descriptions | DealerBrain tool descriptions influence Claude to mention vendor names |
| Dual dashboard system | Classic + Next dashboards both exist; both need maintenance |
| Credits UI deferred | Backend works; customer-facing page intentionally removed |

---

## 5. Implementation Plan Summary

**File:** `/home/ubuntu/Claude-store/nexxus-v2/docs/IMPLEMENTATION_PLAN.md`
**Version:** 2.0 (2026-02-18)
**Strategy:** Derived exclusively from gaps in Current-State Assessment v2.0

### 5.1 Phase Structure

| Phase | Name | Goal | Advances ACs | Dependencies | Est. Scope |
|-------|------|------|-------------|-------------|------------|
| 1 | Critical Fixes | String replacements, small code changes | AC-001 (partial), AC-002, AC-003 (partial), AC-011 (partial) | None | ~80 lines, ~12 files |
| 2 | Data Integrity | VIN header verification, field population audit | AC-001, AC-005 | None | Moderate |
| 3 | Wiring Gaps | Connect defined-but-disconnected code | AC-004, AC-013, AC-014 | Phase 2 | Moderate |
| 4 | Metrics Consolidation | Unify fragmented metrics into MetricsEngine | AC-003, AC-007 | Phases 2, 3 | Significant |
| 5 | SMS Enhancement | AI routing + collision avoidance | AC-012 | None (but follows Phase 1 practically) |  Moderate |
| 6 | Combined Metrics + Role Dashboards | Cross-platform insights, role optimization | AC-007, AC-008, AC-009, AC-010 | Phases 3, 4 | Significant |
| 7 | Certification and Testing | Full E2E, CSV export, 3-proof validation | AC-015, AC-016, AC-019 | Phases 1-6 | Testing + fixes |
| 8 | Deployment | Merge, deploy, post-deployment verification | AC-018, AC-019 | Phase 7 | Documentation + deploy |

### 5.2 Critical Path

```
Phase 2 -> Phase 3 -> Phase 4 -> Phase 6 -> Phase 7 -> Phase 8
```

Phases 1, 2, and 5 can start in parallel. Phase 7 is the convergence point requiring all prior phases complete.

### 5.3 Acceptance Criteria Coverage

All 19 ACs from the Master SRS are mapped to at least one phase:

| Status | Count | ACs |
|--------|-------|-----|
| Already Certified | 4 | AC-006, AC-013, AC-014, AC-017 |
| Addressed in Plan | 13 | AC-001 through AC-005, AC-007 through AC-012, AC-015, AC-016, AC-018, AC-019 |
| Already Certified + Enhanced | 2 | AC-004, AC-013 |

### 5.4 Excluded Items

9 items explicitly excluded from all phases due to external blockers:

- 6 VIN gateway 403 blockers (inventory, communication, deals, appointments, activity, contact search)
- Credits page UI (business decision deferral)
- AI Governance Stages 2 and 3 (future phases)

### 5.5 Risk Register

8 risks identified (R-1 through R-8), including:
- R-2 resolved (PUT /leads confirmed to accept leadStatus)
- R-5 highest impact: metrics consolidation breaking dashboards (mitigated by facade pattern)
- R-7 highest consequence: field audit revealing <50% fill rates (mitigated by accuracy-over-quantity principle)

### 5.6 Current Execution Status

Based on the certification-results.md evidence file, Phase 1 items (1.1 through 1.6) appear CERTIFIED. The remaining phases (2-8) status is unclear from documentation alone. The Implementation Plan itself does not contain execution checkmarks -- it is the specification, not the tracking document.

---

## 6. Brain Dump Summary

**File:** `/home/ubuntu/Claude-store/nexxus-v2/docs/BRAIN_DUMP.md`
**Date:** 2026-02-16
**Status:** Authoritative statement of user intent

### 6.1 User's Vision

The user (Duane Wells, Huminic) envisions Nexxus as an AI orchestration layer for businesses, starting with automotive dealerships. The platform is partner-enabled: Duran Cage (automotive sales expert) brought Serra Automotive and Hyundai of Columbia as first paying customers.

### 6.2 Core Problem Statement

Dealerships lose because of:
1. **Response gaps** -- leads sit unattended
2. **Execution failures** -- no systematic follow-through
3. **Data fragmentation** -- information scattered across platforms
4. **Manual processes** -- tasks that AI could handle

### 6.3 Success Criteria (User's Own Words)

For dealerships: No leads left behind, AI handles routine interactions, leadership has accurate metrics, staff can use AI productively, information accessible by role.

For Huminic: Platform works reliably with accurate data, partners onboardable, not locked to automotive, revenue through AI usage with margins.

### 6.4 Known Issues Identified by User

9 issues listed in the Brain Dump (Section I):

1. Metrics inaccurate -- numbers too high, wrong categories
2. VIN Solutions data strategy not working correctly
3. No outbound communication functional
4. Voice/video calls not auto-entered into VIN Solutions
5. Widget tech for Tavus may not be finished
6. MCP proxy not integrated
7. Multi-org query UX for Org Admins unresolved
8. Response mechanisms for SMS and email not built
9. Data from multiple sources not properly tagged/organized

### 6.5 User's Immediate Priorities (from Brain Dump Section J)

1. Metric accuracy
2. VIN Solutions data flow
3. Lead lifecycle (no leads left behind)
4. Voice/video to CRM insertion
5. Widget deployment
6. Outbound communication

### 6.6 Brain Dump vs Current State

| User Priority | Current Status | Gap? |
|---------------|---------------|------|
| Metric accuracy | Metrics fragmented across 5 services; consolidation planned (Phase 4) | Yes -- partial progress |
| VIN data flow | Context Router enabled, VIN API primary; 17 endpoints still blocked | Partially addressed |
| Lead lifecycle | Trigger engine built (7 events, 5 actions); outbound calls technically possible | Mostly addressed |
| Voice/video to CRM | Webhook pipeline certified; sync queue + LeadCreationService operational | Mostly addressed |
| Widget deployment | Master Widget + Hosted Pages certified | Fully addressed |
| Outbound communication | TriggerService supports outbound_call; SMS two-way built; AI routing missing | Partially addressed |

---

## 7. Design Flags Status

**File:** `/home/ubuntu/Claude-store/nexxus-v2/docs/DESIGN_FLAGS.md`

### 7.1 Open Flags

**1 open flag (PENDING REVIEW):**

| Flag | Subject | Date | Status | Impact |
|------|---------|------|--------|--------|
| D-FLAG-001 | Consolidate Triggers into Voice Agent Entity | 2026-02-16 | PENDING REVIEW | Agent UI, TriggerService, agent config schema |

**Details:** The proposal is to fold standalone trigger rules into the voice agent entity, so users configure automation behaviors on the agent page rather than in a separate Settings > Triggers section. The rationale is that triggers use the same VAPI assistant and phone number the agent already represents, making agent-level configuration more intuitive.

**Current state of triggers:** 15 trigger rules across 5 orgs exist but ALL are DEACTIVATED. No outbound calls or SMS configured. No customer-facing impact from this decision.

**Decision options:**
1. APPROVED -- proceed with agent-trigger consolidation
2. MODIFY -- keep triggers separate but link to agent for display
3. REJECTED -- triggers stay as standalone Settings feature

### 7.2 Resolved Flags

None resolved. The only flag ever created (D-FLAG-001) remains open and unreviewed.

### 7.3 Audit Observation

This flag has been pending for 5 days (since 2026-02-16). Per the protocol stated in the file header, the owner reviews "1-2x daily." This flag may have been overlooked, or a deliberate decision to defer has not been documented.

---

## 8. Customer Acceptance Criteria Status

### 8.1 CLAUDE.md Customer Acceptance Criteria (5 Non-Negotiable Use Cases)

These are defined in CLAUDE.md Section 5 and are distinct from the 19 ACs in the Master SRS. They represent the minimum bar for customer sign-off.

| # | Use Case | CLAUDE.md Status | Assessment Status | Gap Analysis |
|---|----------|-----------------|-------------------|--------------|
| AC-1 | Automatic Outbound Call Triggering | Implemented -- needs E2E verification | CERTIFIED (build-verified) | TriggerService operational (1,338 lines); GAP-1: performanceMetrics not wired to webhooks. All 15 trigger rules are DEACTIVATED per D-FLAG-001. No live outbound calls have been triggered. |
| AC-2 | Intelligent VIN Data Analysis | Implemented -- depends on CR + OAuth | NEEDS WORK | Context Router functional; DealerBrain has 24 tools including 3 VIN query tools. But: DATA-2 (false 48h claim -- now fixed per certification-results.md), DATA-4 (blocked data awareness -- now fixed), DATA-1 (reference endpoint headers -- unclear if fixed at runtime) |
| AC-3 | Lead Insertion to VIN Solutions | Implemented -- sync pipeline fixed 2026-02-15, needs verification | CERTIFIED (build-verified) | Full pipeline exists: webhook -> sync_queue -> SyncCoordinator -> LeadCreationService -> 2-step VIN creation. Depends on AC-001 header correctness. Customer Onboarding doc marks this as "Bug -- No" for demo readiness due to VIN API format fix needed. |
| AC-4 | Accurate Dashboard Metrics | Phase 1 complete -- CR enabled, excel excluded, source badges added | NEEDS WORK | Source labels removed (certified). But: GAP-6 (metrics fragmented across 5 services), GAP-8 (field population audit done but not integrated into dashboard certification), no unified MetricsEngine built yet. |
| AC-5 | Widget Deployment | Fully implemented and deployed | CERTIFIED (build-verified) | WidgetConfigService + HostedPageService + 4 hosted page types fully operational. No gaps identified. |

### 8.2 Master SRS Acceptance Criteria (19 Formal ACs)

| AC | Description | Status | Certification Evidence |
|----|-------------|--------|----------------------|
| AC-001 | VIN API Header Resolution | PARTIALLY ADDRESSED | Phase 1 certification shows stale refs fixed; runtime v1 header verification unclear |
| AC-002 | Vendor Name Removal | CERTIFIED | certification-results.md Phase 1.1 -- grep confirms zero customer-facing vendor names |
| AC-003 | Dashboard Data Accuracy | PARTIALLY ADDRESSED | Source labels removed; metrics consolidation (Phase 4) not yet done |
| AC-004 | Webhook Lead Creation | CERTIFIED (build-verified) | Full pipeline documented with file:line evidence |
| AC-005 | Data Field Population Audit | DONE | `field-population-audit.json` exists with 100-record sample; 50 fields audited |
| AC-006 | Context Router Refactor | CERTIFIED | SourceSelector uses VIN primary, local fallback; TTL caching; source tagging |
| AC-007 | Certified Metrics | NOT DONE | No MetricsEngine created; no ground truth verification; no certification per metric |
| AC-008 | Role-Based Dashboard (org_admin) | CERTIFIED (infrastructure) | NextDashboard has role routing; metric content not yet certified |
| AC-009 | Role-Based Dashboard (org_staff) | CERTIFIED (infrastructure) | Same as AC-008 |
| AC-010 | Role-Based Dashboard (partner_admin) | CERTIFIED (infrastructure) | Same as AC-008 |
| AC-011 | DealerBrain Data Awareness | CERTIFIED | Phase 1.3 and 1.4 -- false claim removed, DATA AVAILABILITY section added |
| AC-012 | TextMagic Two-Way SMS | NOT DONE | Core SMS works; no AI routing, no collision avoidance state machine |
| AC-013 | Agent Notification Triggers | CERTIFIED (core) | TriggerService operational; GAP-1 (performanceMetrics) is separate concern |
| AC-014 | Lead Assignment | PARTIALLY ADDRESSED | Assignment configurable; Mark Contacted still local-only (GAP-2) |
| AC-015 | Feature Certification | IN PROGRESS | Phase 1 certified; remaining phases not yet verified |
| AC-016 | E2E Test Updates | CERTIFIED (build-verified) | 49 spec files, ~1,699 tests exist; runtime pass rate not captured in audit docs |
| AC-017 | Widget Verification | CERTIFIED | Full widget system operational |
| AC-018 | Governing Documents | DONE | All 4 governing documents exist (Constitution, SRS, Assessment, Plan) |
| AC-019 | Deployment Readiness | NOT READY | TypeScript/build pass; multiple NEEDS WORK items remain |

### 8.3 Summary

| Category | Count |
|----------|-------|
| CERTIFIED / DONE | 10 |
| PARTIALLY ADDRESSED | 4 |
| NOT DONE | 3 |
| IN PROGRESS | 2 |

**Critical blockers for AC-019 (Deployment Readiness):** AC-007 (metrics), AC-012 (SMS), AC-014 (Mark Contacted VIN write-back), and completing the remaining implementation plan phases.

---

## 9. Production Customer Deployments

**File:** `/home/ubuntu/Claude-store/nexxus-v2/docs/reference/PRODUCTION_CUSTOMER_DEPLOYMENTS.md`
**Last Updated:** 2026-01-16

### 9.1 Live Customers

| Customer | Status | Deployed | Contact |
|----------|--------|----------|---------|
| Serra Automotive | LIVE IN PRODUCTION | 2026-01-16 | victoria@misscommunicationconsulting.com |
| Hyundai of Columbia | LIVE IN PRODUCTION | 2026-01-16 | sam.mayfield@bc.auto |

### 9.2 Deployed Assistants (5 total)

| Name | Customer | Type | Persona ID |
|------|----------|------|-----------|
| Caroline | Serra Honda | Video (Tavus) | p9eb007721f4 |
| Magnolia | Serra Nissan | Video (Tavus) | p2f586f7e4e0 |
| Georgia | Serra Ford | Video (Tavus) | pe791670615d |
| Elizabeth | Hyundai of Columbia | Video (Tavus) | p92b0da01c4f |
| Savannah | Hyundai of Columbia (Ford) | Video (Tavus) | pf233f09f33d |

### 9.3 Critical API Endpoint

```
POST https://nexxusdev.huminicdev.com/api/tavus/conversation/start
```

This endpoint is called directly from customer websites. Origin validation is DISABLED to allow customer domains. Rate limiting active (30-second cooldown per IP).

### 9.4 Audit Observations

1. **URL discrepancy:** The production deployments reference `nexxusdev.huminicdev.com` (the v1 URL), while CLAUDE.md references `nexxusv2.huminicdev.com` as the V2 live URL. This suggests the customer-facing video embed codes may still be hitting the v1 server, OR the v2 server also serves the `nexxusdev` subdomain.

2. **Origin validation disabled:** The document explicitly states origin validation is disabled and warns against re-enabling without testing customer websites. This is a known security trade-off: any domain can call the API, mitigated only by rate limiting.

3. **Tavus API key in documentation:** The PRODUCTION_CUSTOMER_DEPLOYMENTS.md file contains the Tavus API key in plain text within the environment variables section. While this file is in the repository and not publicly accessible, embedding API keys in documentation is a security concern.

4. **Document staleness:** Last updated 2026-01-16 (36 days before audit). The deployment context (v1 references, PM2 process name `huminic-nexus`) suggests this document was written for v1 and may need updating to reflect v2 reality.

5. **Customer deployment packages location:** Referenced at `/home/ubuntu/Claude-store/nexxus/shared/customers/` -- this is the v1 directory. If v1 is retired per CLAUDE.md ("V1 Status: RETIRED, not in PM2"), customer embed codes may need to be verified against v2 endpoints.

---

## 10. Known Bugs, Tech Debt, and Open Issues

### 10.1 UI Bugs (Customer-Facing)

Per certification-results.md, UI-1 through UI-9 are all CERTIFIED as fixed:

| # | Issue | Original Location | Status |
|---|-------|-------------------|--------|
| UI-1 | "VAPI" badge visible | VoiceAgentCard.tsx:73 | FIXED (Phase 1.1) |
| UI-2 | "Tavus" badge visible | VideoDataCard.tsx:74 | FIXED (Phase 1.1) |
| UI-3 | "VAPI + Tavus" source label | insights.tsx:481 | FIXED (Phase 1.1) |
| UI-4 | "VAPI" source label | insights.tsx:507 | FIXED (Phase 1.1) |
| UI-5 | "VAPI" in skill description | useAgents.ts:289 | FIXED (Phase 1.1) |
| UI-6 | "Local + VIN" source label | LeadFeedCard.tsx:95 | FIXED (Phase 1.2) |
| UI-7 | "Local + VIN" source label | dashboard.tsx:362 | FIXED (Phase 1.2) |
| UI-8 | "Local + VIN" source label | insights.tsx:491 | FIXED (Phase 1.2) |
| UI-9 | "Local + VIN" source label | insights.tsx:513 | FIXED (Phase 1.2) |

### 10.2 Data & API Issues

| # | Issue | Status | Evidence |
|---|-------|--------|----------|
| DATA-1 | Reference endpoints use v3 instead of v1 | UNCLEAR | Assessment identified default v3 at line 351; certification only confirms stale doc refs fixed, not runtime header verification |
| DATA-2 | DealerBrain false 48h claim | FIXED | certification-results.md Phase 1.3 |
| DATA-3 | CacheManager stale doc comment | FIXED | certification-results.md Phase 1.6 |
| DATA-4 | DealerBrain missing blocked data awareness | FIXED | certification-results.md Phase 1.4 |
| DATA-5 | contactUrl uses absolute URL | OPEN (low priority) | Not addressed in any certification evidence |

### 10.3 Feature Gaps

| # | Issue | Status | Planned Phase |
|---|-------|--------|--------------|
| GAP-1 | Agent performanceMetrics never populated | OPEN | Phase 3 |
| GAP-2 | Mark Contacted updates local DB only (no VIN write-back) | OPEN | Phase 3 |
| GAP-3 | No SMS AI routing (after-hours / business-hours) | OPEN | Phase 5 |
| GAP-4 | No SMS collision avoidance (AI_ACTIVE/HUMAN_ACTIVE/DORMANT) | OPEN | Phase 5 |
| GAP-5 | No Activity feed CSV export | OPEN | Phase 7 |
| GAP-6 | No unified metrics engine | OPEN | Phase 4 |
| GAP-7 | No VAPI Analytics API integration | OPEN | Phase 3 |
| GAP-8 | Data field population audit | DONE | Phase 2 (audit file exists) |
| GAP-9 | Credits page UI deferred | DEFERRED (intentional) | Not planned |

### 10.4 Stale Documentation in Code

Per certification-results.md Phase 1.6, the stale @see references to SRS v3.0 have been updated to reference `docs/MASTER_SRS.md` in 7 files. This item is FIXED.

### 10.5 External Blockers (17 VIN Gateway 403s)

These 17 endpoints return 403 Forbidden and cannot be resolved without VIN Solutions granting expanded API access:

| Priority | Endpoints | Impact |
|----------|-----------|--------|
| Critical | `/gateway/v1/communication`, `/gateway/v1/activity`, `/gateway/v1/deals` | Cannot measure human execution quality, deal economics, CRM activity |
| High | `/gateway/v1/contacts` (search), `/gateway/v1/appointments`, `/gateway/v1/notes`, `/gateway/v1/tasks`, `/gateway/v1/calls`, `/gateway/v1/calldetails`, `/gateway/v1/emails` | Cannot deduplicate contacts, track appointments, access CRM tasks/calls/emails |
| Medium | `/gateway/v1/inventory`, `/gateway/v1/vehicles`, `/gateway/v1/desking`, `/gateway/v1/customer` | Cannot access inventory, deal structures, full customer records |
| Low | `/gateway/v1/lead`, `/gateway/v1/leads` (redundant gateway versions) | Redundant with header-versioned `/leads` |

### 10.6 Customer Onboarding Dependencies

Per `docs/CUSTOMER_ONBOARDING_KICKOFF.md`, the following customer-facing items are blocking or partially blocking:

| AC | Demo Ready? | Blocking On |
|----|-------------|-------------|
| AC-1 (Outbound Calls) | Partial | VAPI phone numbers needed, trigger rule activation |
| AC-2 (VIN Analysis) | Yes (Serra only) | Columbia orgs need VIN integration |
| AC-3 (Lead Insertion) | No | VIN API format fix (marked as "Bug") |
| AC-4 (Dashboard Metrics) | Yes | Hard refresh needed; name resolution for some leads |
| AC-5 (Widget) | Partial | Customer domains needed, voice agent wiring |

### 10.7 Security Observations

1. **Origin validation disabled** on Tavus conversation start endpoint (documented, known trade-off)
2. **Tavus API key in plain text** in PRODUCTION_CUSTOMER_DEPLOYMENTS.md
3. **V1 CLAUDE.md references 379 CRITICAL security vulnerabilities** found in v1 audit -- v2 was built to address these
4. **RLS enforcement is comprehensive**: 60 ENABLE statements, 104 policy declarations across 23 migration files

---

## 11. Document Consistency Analysis

### 11.1 Inconsistencies Found

| # | Area | Document A | Document B | Discrepancy |
|---|------|-----------|-----------|-------------|
| 1 | Requirement count | CLAUDE.md: "17 sections, 257 requirements" | Master SRS: 19 ACs, no REQ-style numbering | CLAUDE.md references v1.0 stats; v2.0 restructured away from numbered requirements |
| 2 | Phase count | CLAUDE.md: "10 phases, priority-ordered" | Implementation Plan: 8 phases | CLAUDE.md references v1.0; v2.0 was rewritten to 8 phases |
| 3 | Assessment stats | CLAUDE.md: "200 implemented, 38 partial, 10 gaps" | Current-State Assessment v2.0: 16 certified, 8 needs work | CLAUDE.md references v1.0 assessment methodology (per-requirement); v2.0 uses feature-level assessment |
| 4 | Governing doc status | CLAUDE.md: "PENDING CREATION" for all 4 docs | Actual state: all 4 exist (v2.0, dated 2026-02-18) | CLAUDE.md is stale in this section -- docs have been created |
| 5 | Test count | CLAUDE.md: "500+ tests" | Current-State Assessment: ~1,699 tests | CLAUDE.md is outdated -- test count grew significantly |
| 6 | Migration count | CLAUDE.md: "23 files" | Current-State Assessment: 31 files | CLAUDE.md is outdated -- 8 migrations added post-MVP |
| 7 | Production URL | CLAUDE.md: `nexxusv2.huminicdev.com` | Production Deployments: `nexxusdev.huminicdev.com` | Different domains; may reflect v2 transition |
| 8 | V1 status | CLAUDE.md: "RETIRED (not in PM2)" | Production Deployments: references `huminic-nexus` PM2 process | If v1 is retired, customer embeds pointing at nexxusdev may break |
| 9 | AC-3 status | CLAUDE.md: "Implemented -- sync pipeline fixed 2026-02-15, needs verification" | Customer Onboarding: "Bug -- No" for demo readiness | Conflicting assessments of AC-3 readiness |
| 10 | VIN header casing | CLAUDE.md: "application/vnd.coxauto.V3+json" (uppercase V3) | Master SRS/MEMORY.md: lowercase v3 required | CLAUDE.md VIN Solutions API Reference section contains the wrong casing |

### 11.2 Documents Needing Updates

| Document | Issue | Priority |
|----------|-------|----------|
| CLAUDE.md | References v1.0 governing document stats (257 requirements, 10 phases, 200/38/10); marks docs as "PENDING CREATION"; outdated test count (500+); outdated migration count (23); uppercase V3 header | High -- this is the primary file new Claude sessions read |
| PRODUCTION_CUSTOMER_DEPLOYMENTS.md | References v1 infrastructure; last updated 2026-01-16; may not reflect v2 transition | High -- customer-facing impact |

---

## 12. Risk Assessment

### 12.1 Active Risks

| Risk | Severity | Likelihood | Details |
|------|----------|-----------|---------|
| CLAUDE.md inconsistencies cause new sessions to follow stale guidance | High | High | Multiple outdated values (requirement count, phase count, doc status, test count, migration count, VIN header casing) will mislead any Claude session that reads CLAUDE.md first |
| D-FLAG-001 unresolved for 5 days | Medium | Medium | Trigger architecture decision blocks activation of all 15 trigger rules; no outbound calls possible until resolved |
| DATA-1 (VIN reference endpoint headers) remains unverified at runtime | Medium | Medium | Static analysis identified default v3 headers; certification evidence only covers doc fixes, not runtime API call verification |
| Customer embed codes may reference retired v1 infrastructure | High | Medium | If `nexxusdev.huminicdev.com` was v1 and v1 is retired, customer video embeds may be broken or pointing at stale infrastructure |
| AC-3 conflicting status assessments | Medium | High | CLAUDE.md says "implemented, needs verification"; Customer Onboarding says "Bug -- No demo"; unclear which is current truth |
| No runtime E2E test results captured | Medium | High | ~1,699 tests exist but no pass/fail evidence in audit artifacts; "runtime results pending" noted in Assessment |
| 7 of 9 feature gaps remain open | Medium | High | GAP-1 through GAP-7 are unaddressed; only GAP-8 (field audit) and GAP-9 (intentionally deferred) are resolved |

### 12.2 Mitigated Risks

| Risk | Evidence of Mitigation |
|------|----------------------|
| VIN PUT /leads for Mark Contacted | `docs/evidence/put-header-probe-results.json` confirms 204 response with leadStatus |
| DealerBrain false 48h claim | certification-results.md Phase 1.3 confirms removal |
| Vendor name leaks in UI | certification-results.md Phase 1.1 confirms grep zero matches |
| Source label leaks in UI | certification-results.md Phase 1.2 confirms grep zero matches |

---

## 13. Recommendations

### 13.1 Immediate (Before Next Development Session)

1. **Update CLAUDE.md** to reflect governing document v2.0 reality:
   - Change "257 requirements" to accurate description (19 ACs + 50+ derivable metrics)
   - Change "10 phases" to "8 phases"
   - Change "200 implemented, 38 partial, 10 gaps" to v2.0 summary (16 certified, 8 needs work)
   - Remove "PENDING CREATION" labels from governing documents section
   - Update test count from "500+" to "~1,699"
   - Update migration count from "23 files" to "31 files"
   - Fix VIN header casing from uppercase "V3" to lowercase "v3"

2. **Resolve D-FLAG-001** (trigger consolidation decision). This flag has been pending 5 days and blocks all outbound call activation. A decision -- even "MODIFY: defer to post-stabilization" -- unblocks continued work.

3. **Verify customer embed codes** against current infrastructure. If v1 (`nexxusdev.huminicdev.com`) is retired, customer video embeds may be non-functional. This has direct revenue impact.

### 13.2 Short-Term (Next Sprint)

4. **Runtime-verify VIN reference endpoint headers (DATA-1).** Make actual API calls to `/leadSources` and `/leadTypes` and confirm which Accept headers produce 200 responses. If v3 works in practice, document the deviation but still implement v1 as the configured default.

5. **Clarify AC-3 status.** The conflicting assessments between CLAUDE.md ("implemented, needs verification") and Customer Onboarding ("Bug -- No demo") must be reconciled. Run the webhook-to-VIN pipeline end-to-end and document the result.

6. **Run E2E suite and capture results.** The ~1,699 tests have never had runtime pass/fail evidence captured in the audit artifacts. Run `npx playwright test` and store the results as evidence.

### 13.3 Medium-Term (Following the Implementation Plan)

7. **Execute Phase 3 (Wiring Gaps)** -- particularly GAP-1 (performanceMetrics) and GAP-2 (Mark Contacted VIN write-back). These are prerequisites for AC-013 and AC-014 full certification.

8. **Execute Phase 4 (Metrics Consolidation)** -- the unified MetricsEngine is the single largest architectural gap. Without it, AC-007 (Certified Metrics) cannot be achieved, and AC-003/AC-008/AC-009/AC-010 remain incomplete.

9. **Execute Phase 5 (SMS Enhancement)** -- AC-012 is fully unaddressed. SMS AI routing and collision avoidance are new development work required by the Master SRS.

### 13.4 Structural

10. **Establish an execution tracking document.** The Implementation Plan is a specification (what to build). The certification-results.md is evidence (what passed). There is no document that tracks phase execution status (what is in progress, what is complete, what is blocked). A simple phase-status tracker would prevent the ambiguity seen in this audit.

---

## Appendix: Audit Methodology

This audit was conducted by reading all governing documents, reference documents, evidence artifacts, and project configuration files. No code was executed. No tests were run. All findings are based on document content analysis and cross-referencing.

**Documents read:**
- `docs/MASTER_SRS.md` (1,035 lines)
- `docs/CONSTITUTION.md` (166 lines)
- `docs/CURRENT_STATE_ASSESSMENT.md` (792 lines)
- `docs/IMPLEMENTATION_PLAN.md` (814 lines)
- `docs/BRAIN_DUMP.md` (359 lines)
- `docs/DESIGN_FLAGS.md` (78 lines)
- `docs/reference/PRODUCTION_CUSTOMER_DEPLOYMENTS.md` (262 lines)
- `docs/CUSTOMER_ONBOARDING_KICKOFF.md` (partial, 50 lines)
- `docs/evidence/certification-results.md` (partial, 80 lines)
- `docs/evidence/field-population-audit.json` (partial, 60 lines)
- `CLAUDE.md` (359 lines)

**Total lines reviewed:** ~4,055

---

*This forensic audit was produced on 2026-02-21 by examining documentation artifacts only. It does not replace runtime verification, E2E testing, or live API probing. All findings should be validated against the live codebase before acting on them.*
