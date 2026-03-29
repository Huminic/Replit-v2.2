# Nexxus Connect v2.2 — Development Plan

---

## Section 1 — How to Read This Document

This document is the execution plan for completing Nexxus Connect v2.2.
It is organized into phases, sprints, and feature items. The dev agent
consumes this document to know what to build, in what order, and how
to verify it's done.

**Phase** — A usability system that must be functionally complete before
moving to dependent phases. Each phase represents something the user
can DO with the application.

**Sprint** — A vertical slice within a phase touching FE, BE, DT, and/or
IN layers. Each sprint is small (max 5 application files per the ghost
protocol). Sprints within a phase can sometimes run in parallel if they
don't share files.

**Sprint Types**
- V — Verification: feature believed working, sprint confirms it
- P — Plan: general development sprint
- R — Remediation: redoing work that was not completed properly
- G — Gap: filling a gap in the original plan
- I — Issue: fixing a specific bug
- E — Exploratory: read-only investigation sprint
- M — Maintenance: updating or maintaining existing code
- D — Deferred: items deferred from earlier sprints
- T — Testing: dedicated testing sprint
- L — Launch: final launch preparation items

**Feature Item Code** — `[TEAM][PHASE].[SPRINT].[ITEM]`
Example: `BE8.2.4` = Backend, Phase 8, Sprint 2, Item 4

**Team Streams**
- FE — UI pages, components, forms, state handling
- BE — APIs, business logic, services, webhooks
- DT — Schema, migrations, seed data, queries
- AU — Auth/Security (login, permissions, org isolation)
- IN — Infrastructure (deployment, environment, monitoring)

**Sprint Template**
```
SPRINT [CODE] — [SPRINT NAME]

WHY IT MATTERS
[Value this sprint delivers to the user or operation]

WHAT GETS BUILT
  FE
    - [UI item]
  BE
    - [API or service item]
  DT
    - [Schema or migration item]
  IN
    - [Environment or deployment item]

HOW WE KNOW IT IS DONE
  - [Testable acceptance criterion]

WHAT IT DOES NOT INCLUDE
  - [Explicit exclusion]

FAILS IF
  - [Break condition]

VERIFICATION NOTES
  - [Reviewer checklist item]
```

**Application Pages** (from UI screenshots — this is the truth)
1. Main (Dashboard)
2. Sales
3. Service
4. Marketing
5. Management
6. TeamBox
7. My Work
8. Insights
9. Billing
10. Settings
11. Profile
12. Agents

**Named Personas**
- Caroline — Sales voice/video agent (Serra Honda, all Serra stores)
- Elizabeth — Sales voice agent (Hyundai of Columbia)
- Savannah — Sales voice agent (Ford of Columbia)
- Magnolia — Sales voice agent (Serra Nissan)
- Nancy Gaston — Service voice/video agent (Serra stores) [TO BE CONFIGURED]

**External Services**
- VAPI — voice calls (inbound + outbound)
- Tavus — two-way video sessions
- TextMagic — SMS (inbound + outbound)
- Resend — email (outbound only, noreply@huminic.ai)
- VIN Solutions — CRM (lead sync, contact CRUD via vin-safe-mcp)
- FlexPrice — billing/metering
- Anthropic Claude — AI chat, transcript analysis

**Key Decisions (owner-approved)**
- One SMS number per org for now. Service gets second number later.
- After-hours blackout: 10 PM - 7 AM. Messages queue, release at 7 AM.
- Triggers: lead-based, time-delayed. Configured per agent. No full boolean system.
- Campaigns: SMS primary. Service campaigns can include email + phone.
- Templates stored in agent knowledge base, not hardcoded.
- Widget scheduling: not a standalone feature. Scheduling happens in conversation.
- Inbound email: BACKLOG.
- VIN lead assignment: configurable per store by super admin (vin_lead_config).
- Multi-step workflows: BACKLOG.
- WhatsApp: NOT IN SCOPE.
- Google Auth: NOT IN SCOPE.

**Current State**
- 80%+ of UI built and rendering
- Auth working (login, roles, org switching)
- Database on Supabase (27 Drizzle tables)
- All external services configured (API keys in .env)
- CommGate currently OFF on all orgs (emergency shutdown)
- 20 open issues (16 REMEDIATING + 4 test infrastructure)
- 3 parked sprints (DB-1, REM-8, REM-9)
- 216 Playwright tests, C+ coverage grade

**Phase Dependency Order**
```
Phase 1: Auth & Security ──────────────────────────── [MOSTLY DONE]
Phase 2: Data Foundation & Sync ───────────────────── [PARTIALLY DONE]
Phase 3: Communications & CommGate ────────────────── [BROKEN — 5 issues]
Phase 4: Voice & Video ───────────────────────────── [BROKEN — 4 issues]
Phase 5: TeamBox & Conversations ──────────────────── [PARTIALLY DONE]
Phase 6: Campaigns & Outbound ─────────────────────── [BROKEN — 2 issues]
Phase 7: Triggers & Automation ────────────────────── [PARTIALLY DONE]
Phase 8: AI Chat & Agents ─────────────────────────── [MOSTLY DONE]
Phase 9: Notifications & Alerts ───────────────────── [PARTIALLY DONE]
Phase 10: Department Pages (Sales/Service/Marketing/Management) ── [UI DONE, data gaps]
Phase 11: Insights & Metrics ──────────────────────── [BROKEN — 1 issue]
Phase 12: Widgets & Landing Pages ─────────────────── [MOSTLY DONE]
Phase 13: Settings & Administration ───────────────── [PARTIALLY DONE]
Phase 14: Billing & Metering ──────────────────────── [STUB]
Phase 15: Launch Preparation ──────────────────────── [NOT STARTED]
```

**Usability Domains (pages map to these)**
1. Authentication — login, roles, org switching, password management
2. Dashboard — Main page KPIs, activity feed, quick actions
3. AI Chat & Agents — CRM Guru, Communication Agent, Service Agent, knowledge base
4. Campaigns — campaign CRUD, execution, CSV upload, templates
5. TeamBox — unified inbox, conversation threads, takeover, two-way messaging
6. Department Views — Sales, Service, Marketing, Management pages
7. Insights & Metrics — dashboard tiles, drill-downs, VIN data, warehouse metrics
8. Agent Management — agent CRUD, persona config, channel assignment, triggers
9. Widgets & Landing — widget embed JS, landing pages, forms, video sessions
10. Settings & Profile — org settings, CommGate, user management, integrations
11. Integrations — VIN Solutions, VAPI, Tavus, TextMagic, Resend, billing

---
