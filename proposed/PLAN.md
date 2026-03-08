# PROPOSED — PLAN.md (Sweep 3B Draft)

> **Status: PROPOSED** — This document requires explicit owner approval before replacing the live PLAN.md. Do not promote automatically.

---

# Nexxus Connect — Development Plan (Phases)

**Version:** 3.0
**Date:** 2026-03-08
**Terminology:** This document uses "Phases" (P0-P10+). Historical "Waves" (old PLAN.md) and "Sweeps" (STABILIZATION_PLAN.md) are separate documents.

---

## Phase Summary

| Phase | Name | Status | Dependencies |
|-------|------|--------|-------------|
| P0 | Stabilization Complete | IN PROGRESS | Sweeps 0-9 in STABILIZATION_PLAN.md |
| P1 | Schema & Backend Hardening | NOT STARTED | P0 |
| P2 | Frontend Wiring (Mock → Real) | NOT STARTED | P1 |
| P3 | Integration Completion | NOT STARTED | P1 |
| P4 | Owner Live Testing | NOT STARTED | P2, P3 |
| P5 | Regression & RC Gate | NOT STARTED | P4 |
| P6 | Post-MVP: Billing & Monetization | NOT STARTED | P5 |
| P7 | Post-MVP: Advanced Features | NOT STARTED | P5 |
| P8 | Post-MVP: Scale & Security | NOT STARTED | P5 |

---

## P0 — Stabilization Complete

**Objective:** Complete all stabilization sweeps (0-9) to establish a clean, verified baseline.

**Work tracked in:** `STABILIZATION_PLAN.md`

**Gate:** All Sweep 9 RC readiness criteria pass:
- All 19 RC-blocking issues RESOLVED with evidence
- Observability Matrix: zero mock/static rows except explicitly deferred
- Continuity Matrix: every RC-required UI surface has complete row
- OWNER-TEST rows: all verified by owner (Sweep 7.5)
- Test suite: green
- Governance: all documents rebuilt and consistent

---

## P1 — Schema & Backend Hardening

**Maps to:** Sweeps 5-5.5 in stabilization (executed as part of P0)

### P1.1 — Resolve Dual Schema Collision (SCH-12)
- **AC:** —
- **Action:** Deprecate shared/models/chat.ts; ensure no production code references it
- **Verification:** No import references to shared/models/chat.ts in server/ or client/

### P1.2 — Webhook Security (API-15)
- **AC:** —
- **Action:** Add secret validation to TextMagic webhook (matching VAPI pattern)
- **Verification:** Webhook rejects requests without valid secret header

### P1.3 — Campaign State Persistence (API-13)
- **AC:** —
- **Action:** Persist activeExecutions to DB table; restore on server restart
- **Verification:** Start campaign, restart server, verify campaign resumes

### P1.4 — Auth Stub Completion (API-03, API-04)
- **AC:** —
- **Action:** Wire forgot-password and reset-password with email delivery via Resend
- **Verification:** Full password reset flow works end-to-end

### P1.5 — Missing API Routes (API-08, API-09)
- **AC:** —
- **Action:** Add AI configuration routes, organization creation route
- **Verification:** Settings AI config saves to DB; OrgWizard creates real organization

### P1.6 — Schema Integrity (SCH-13, SCH-18)
- **AC:** —
- **Action:** Add ON DELETE CASCADE to FKs; generate migration files
- **Verification:** Migration runs cleanly; cascade deletes work

### P1.7 — Agent Schema Completion (SCH-08)
- **AC:** —
- **Action:** Add system_prompt, triggers, tools, knowledge_sources, created_by to agents table
- **Verification:** Agent config UI reads/writes all fields

---

## P2 — Frontend Wiring (Mock → Real)

**Maps to:** Sweep 6 in stabilization (executed as part of P0)

### P2.1 — Wire Insights Page (UI-01, MET-01)
- **AC:** W1-AC-070
- **Action:** Replace lib/insight-data.ts with real API queries
- **Verification:** Observability Matrix rows change from "mock" to "real"; data matches DB

### P2.2 — Wire My Work Chat Tab (UI-02)
- **AC:** W1-AC-030, W1-AC-031
- **Action:** Replace @/mocks/messages and @/mocks/conversations imports with useQuery calls
- **Verification:** Chat tab shows real conversations from API

### P2.3 — Wire TopBar Activity Feed (UI-06)
- **AC:** W1-AC-003
- **Action:** Replace staticActivityFeed with useQuery for /api/activity-log
- **Verification:** Activity feed shows real activity_log entries

### P2.4 — Wire OrgWizard (UI-11)
- **AC:** —
- **Action:** Connect org-wizard.tsx to POST /api/organizations (P1.5)
- **Verification:** Wizard creates real organization in DB

### P2.5 — Demo-Mode Cleanup (UI-03)
- **AC:** —
- **Action:** Wire tool toggle, KB URL features, embed instructions to real backends where available; mark explicitly deferred items with proper UI indicators
- **Verification:** No demo-mode toasts on features that have backends

### P2.6 — Mock File Cleanup (UI-07, UI-08)
- **AC:** —
- **Action:** Delete orphaned mock files after all consumers are rewired
- **Verification:** No production page imports from @/mocks/

---

## P3 — Integration Completion

**Maps to:** Sweep 7 in stabilization (executed as part of P0)

### P3.1 — VAPI Voice Integration (AIO-01)
- **AC:** —
- **Action:** Replace console.log with actual VAPI API call for outbound voice
- **Verification:** OWNER-TEST — owner makes test voice call

### P3.2 — Tavus Video Integration (AIO-02)
- **AC:** —
- **Action:** Implement video calling capability beyond read-only proxy
- **Verification:** OWNER-TEST — owner initiates test video session

### P3.3 — Widget Landing Page (API-05)
- **AC:** W1-AC-110
- **Action:** Complete landing page with all 4 widget channels functional
- **Verification:** OWNER-TEST — owner tests widget on external page

---

## P4 — Owner Live Testing

**Maps to:** Sweep 7.5 in stabilization

All OWNER-TEST flagged rows in the Observability Matrix are tested by the owner:
- SMS delivery (TextMagic)
- Email delivery (Resend)
- Voice call (VAPI)
- Video session (Tavus)
- Widget embed on external page
- Landing page public access
- Campaign execution end-to-end

---

## P5 — Regression & RC Gate

**Maps to:** Sweeps 8-9 in stabilization

### P5.1 — Full Test Suite
- Run all test batteries adapted in Sweep 4
- Verify all Observability Matrix "real" rows
- Verify all Continuity Matrix rows complete

### P5.2 — RC Gate Checklist
- All 19 RC-blocking issues RESOLVED
- Test suite green
- Owner live tests passed
- Governance documents consistent
- No drift detected in final check

**Milestone: RELEASE CANDIDATE**

---

## P6 — Post-MVP: Billing & Monetization (Deferred)

| Task | Issue IDs |
|------|-----------|
| Stripe billing integration | API-01 |
| Billing page wiring (replace hardcoded data) | UI-04, FP-5 |
| Invoice management | UI-04 |

---

## P7 — Post-MVP: Advanced Features (Deferred)

| Task | Issue IDs |
|------|-----------|
| File/Drive management | API-02 |
| Marketing Studio | FP-8 |
| TeamBox file attachments | FP-9 |
| Chat file upload/document sharing | FP-10 |
| Notification preferences | API-06 |
| Security settings routes | API-07 |
| Trend percentages (historical comparison) | UI-09, MET-03 |
| metrics_cache table | SCH-03 |

---

## P8 — Post-MVP: Scale & Security (Deferred)

| Task | Issue IDs |
|------|-----------|
| RLS policies | SCH-15 |
| Database indexes for performance | SCH-14 |
| Widget lookup optimization | API-16 |
| Multi-org routing for outbound | AIO-06 |

---

## Sprint Report Template

After each phase task, produce:

```
### [Phase.Task] Report
- **What was done:**
- **Files changed:**
- **ISSUES.md items resolved:** [IDs with evidence]
- **Observability Matrix updates:** [rows changed from mock→real]
- **Continuity Matrix updates:** [gaps filled]
- **Tests added/updated:**
- **Drift check:** [pass/fail with details]
```

---

## Verification Gates

Every phase task requires:
1. Self-certification by the agent
2. Post-task drift check
3. ISSUES.md updated with resolution evidence
4. MEMORY.md updated with session record
5. Stop and present results before proceeding to next task
