# Nexxus Connect v2.2 — Stabilization Plan

**Date:** 2026-03-07
**Baseline:** Commit `58288b6` (clean, verified)
**Goal:** Align the codebase so we can resume building toward the Release Candidate

---

## What's the Release Candidate?

The next milestone is a working system where:
- VAPI voice calls actually work (not just console.log)
- Tavus video calls actually work (currently zero code)
- The landing page and widget communicate end-to-end
- Every metric the user sees is real data (not mock/hardcoded)
- AI Chat is stable with history, persona names, and hunch filtering

---

## What's Actually Broken (Top Issues)

| # | Problem | Impact |
|---|---------|--------|
| 1 | **VAPI is fake** — voice calls just log to console, no actual calls happen | Can't demo voice features |
| 2 | **Tavus doesn't exist** — zero video calling code anywhere | Can't demo video features |
| 3 | **68% of metrics are fake** — Insights page is 100% static data, trend percentages all show 0 | Users see made-up numbers |
| 4 | **My Work page uses mock data** — chat tab imports fake conversations | Users see fake conversations |
| 5 | **Campaign state vanishes on restart** — execution tracking is in-memory only | Running campaigns disappear if server restarts |
| 6 | **Two conflicting database schemas** — one uses integer IDs, one uses UUIDs | Risk of data corruption |
| 7 | **No delete cascades** — deleting a parent record crashes instead of cleaning up children | Database errors on delete operations |
| 8 | **Zero automated tests** — no test files, no test framework, nothing | Any change can break anything silently |
| 9 | **6 governance docs are critically stale** — describe a state from before development started | Agents get confused, build wrong things |
| 10 | **11 junk files** — orphaned mocks, loose screenshots cluttering the project | Noise and confusion |

---

## The Fix Plan — 8 Phases

Each phase describes: what I'll do step by step, what files I'll touch, what acceptance criteria I'll test against, and what I'll show you at the gate.

---

### Phase S1: Clean House (Governance)

**Why:** Stale documents cause agents to build against wrong specs. Junk files create confusion. Clearing these first prevents errors in all later phases.

**Steps I will take:**
1. Create an `archive/` directory
2. Move these 6 stale files into `archive/`:
   - `SPEC.md` (describes a 1-table database when we have 22+)
   - `COMMENT_INDEX.md` (references pre-wiring states that are long resolved)
   - `acceptance_criteria_audit.md` from root (superseded by the fresh audit in `audits/`)
   - `.agent_docs/rules/operational-context.md` (never updated — shows all waves as LOCKED)
   - `.agent_docs/codebase-index.md` (application code section is empty)
   - `.agent_docs/undefined-items.md` (zero entries ever logged)
3. Delete these junk files:
   - `home-metrics.png` and `sales-dashboard.png` from root (loose screenshots, not referenced by code)
   - 9 orphaned mock files in `client/src/mocks/` that no production page imports: `insights.ts`, `campaigns.ts`, `users.ts`, `widgets.ts`, `activity.ts`, `notifications.ts`, `tasks.ts`, `files.ts`, `agents.ts`
4. Verify no broken imports result from deletions (run a build check)
5. Update CLAUDE.md truth hierarchy to say: T1=UI code, T2=`.agent_docs/acceptance_criteria.md`, T3=SRS.md, T4=PLAN.md. Remove the "Constitution" reference that points to a non-existent document.

**Files touched:** Governance docs only — no application code
**Effort:** Small

**What I show you at the gate:**
- List of files archived and deleted
- Build passes with no broken imports
- CLAUDE.md truth hierarchy before/after

---

### Phase S2: Fix the Foundation (Schema)

**Why:** The dual schema conflict, missing cascades, and missing indexes create data integrity risks. Every later phase writes to the database, so this must be solid first.

**Steps I will take:**
1. Read `shared/models/chat.ts` and `shared/schema.ts` to understand the conflict (integer PKs vs UUID PKs)
2. Determine if `shared/models/chat.ts` is used only by the Replit integration chat (`server/replit_integrations/`). If yes, isolate it with clear comments. If it's also used by the main app, consolidate into `shared/schema.ts` using UUIDs.
3. Add `onDelete: 'cascade'` to every `references()` call in `shared/schema.ts`. For any FK where cascade would be dangerous (e.g., deleting an org shouldn't silently delete all users), use `onDelete: 'set null'` or `onDelete: 'restrict'` and document why.
4. Add database indexes on high-traffic query columns:
   - `conversations.organization_id`, `conversations.status`
   - `messages.conversation_id`
   - `campaigns.organization_id`, `campaigns.department`
   - `agents.organization_id`
   - `tasks.organization_id`
   - `activity_logs.organization_id`
5. Run `drizzle-kit generate` to create a migration file in `migrations/`
6. Verify the migration applies cleanly

**Files touched:** `shared/schema.ts`, `shared/models/chat.ts`, `migrations/`
**Effort:** Small

**What I show you at the gate:**
- Dual schema resolution (what I did and why)
- List of cascade rules applied (with reasoning for any non-cascade choices)
- List of indexes added
- Migration file generated and verified

---

### Phase S3: Wire the Communication Stack (VAPI + Tavus + Widget + Landing Page)

**Why:** This is the core of the RC milestone — real voice, real video, real widget, real landing page.

**Steps I will take:**

**S3-T01: VAPI (voice)**
1. Read the current VAPI webhook handler in `server/routes.ts` (currently console.log only)
2. Read VAPI's API documentation to understand the call lifecycle
3. Replace console.log with actual VAPI API integration:
   - On call completion: create a VinSolutions contact (step 1) and lead (step 2) via `server/vendorProxy.ts`
   - On step 1 failure: create a "VIN Push Failure" escalation in the tasks table with `failed_step=1`, error details, and original VAPI data
   - On step 2 failure: create escalation with `failed_step=2`, `contact_href`, error details
   - On any failure: ensure both a log entry AND an escalation exist (no silent drops)
4. Test by examining the webhook handler logic and verifying escalation creation paths

**S3-T02: Tavus (video)**
1. Research Tavus API for session initialization and persona management
2. Create `server/tavus.ts` with Tavus client setup and session creation
3. Add a route in `server/routes.ts` for creating Tavus video sessions
4. Wire the widget's video channel button to call this route
5. Ensure video initializes on click (not pre-loaded on page arrival, per AC-04-B)

**S3-T03: Widget hardening**
1. Read `client/src/pages/widget-landing.tsx` and the widget configuration in settings
2. Verify all 4 channels render when enabled (web chat, web call, form, two-way video)
3. Verify disabled channels are hidden (not just grayed out)
4. Verify embed code is displayed and copyable in settings
5. Verify widget is functional on the landing page

**S3-T04: Landing page**
1. Read the current `/p/:slug` route implementation
2. Verify slug is kebab-case format from org name
3. Verify slug collision handling (append -2)
4. Verify slug edit creates 30-day redirect with forensic log
5. Verify globe icon in TopBar links to `/p/[current-org-slug]`
6. Verify the page loads without authentication

**Files touched:** `server/routes.ts`, `server/vendorProxy.ts`, new `server/tavus.ts`, widget/landing client components
**Depends on:** S1 + S2 complete
**Effort:** Large
**ACs addressed:** AC-02-A/B/C/D (VAPI), AC-04-A/B/C/D (Widget), AC-08-A/B (Customer View), AC-09-A/B/C/D (Landing Page)

**What I show you at the gate:**
- VAPI: webhook handler code, escalation creation paths, no more console.log-only paths
- Tavus: session initialization working, video renders in widget
- Widget: all 4 channels evidence, disabled channel hidden, embed code working
- Landing page: public access verified, slug handling verified, globe icon linked
- Pass/fail for each AC

---

### Phase S4: Make Metrics Real

**Why:** "Correct metrics in UI" is an RC gate requirement. 68% of displayed metrics are currently fake.

**Steps I will take:**

**S4-T01: Main page tiles**
1. Read `client/src/pages/main.tsx` metric tile code
2. Verify the 4 tiles match AC-CH-A: active pipeline count, appointments today, open escalations, outbound sent 24h
3. Verify values come from `/api/metrics/pipeline` (real database query)
4. Verify tiles collapse/hide when user starts typing (AC-CH-B)

**S4-T02: Insights page (the big one)**
1. Read `client/src/pages/insights.tsx` (~2000 lines) and `client/src/lib/insight-data.ts` (~700 lines of mock data)
2. Identify which of the 23+ data sections can be computed from existing database tables (conversations, campaigns, agents, warehouse_leads, etc.)
3. For sections that need new backend computation: create new API endpoints in `server/routes.ts` and storage methods in `server/storage.ts`
4. Replace each mock data import with a `useQuery` call to the corresponding real endpoint
5. Remove the "Sample Data" banner
6. Delete `client/src/lib/insight-data.ts` when no longer imported

**S4-T03: Trend percentages**
1. Add historical comparison logic to `server/storage.ts` — compute "current period vs previous period" for each dashboard metric
2. Return `change` values from the metrics API endpoints instead of hardcoding 0
3. Display "—" when insufficient historical data exists

**S4-T04: TopBar activity feed**
1. Replace `staticActivityFeed` import in `TopBar.tsx` with `useQuery` for `/api/activity-log`
2. Delete `staticActivityFeed` from `client/src/lib/activity-utils.ts`

**S4-T05: Sales recent activity**
1. Replace the 5-item hardcoded array in `sales.tsx` with `useQuery` for `/api/activity-log?department=sales`

**Files touched:** `client/src/pages/insights.tsx`, `main.tsx`, `sales.tsx`, `TopBar.tsx`, `client/src/lib/insight-data.ts`, `client/src/lib/activity-utils.ts`, `server/routes.ts`, `server/storage.ts`
**Depends on:** S2 complete
**Effort:** Large
**ACs addressed:** AC-01-A/B/C (Accurate Metrics), AC-CH-A/B (Chat Landing Metrics)

**What I show you at the gate:**
- Main page tiles: labels match AC-CH-A, values from real API, collapse on typing
- Insights page: zero mock imports remaining, all sections using useQuery
- Trend percentages: non-zero values when data exists
- TopBar and Sales activity: wired to real API
- Pass/fail for each AC

---

### Phase S5: Harden AI Chat

**Why:** "Stable/advanced user chat" is an RC gate requirement.

**Steps I will take:**

**S5-T01: Thinking card**
1. Read the streaming chat hook and main page chat UI
2. Verify a thinking indicator appears while the AI is processing
3. Verify it disappears when the response starts streaming
4. Fix if not working

**S5-T02: Chat history + mid-stream failure**
1. Read the chat streaming endpoint in `server/routes.ts`
2. Verify returning to AI Chat shows previous conversations
3. Fix the mid-stream failure issue: save partial AI responses when the stream is interrupted (currently the entire response is lost)

**S5-T03: Persona name**
1. Read how `org.personaName` is used in the system prompt and client greeting
2. Verify the greeting uses the org's custom name (not hardcoded "Automa")
3. Implement VAPI assistant name as fallback when org has no custom name

**S5-T04: CRM Guru mode**
1. Read the CRM Guru mode toggle and system prompt construction
2. Verify CRM Guru responses prioritize VinSolutions data
3. Verify warehouse data is attributed explicitly ("I found additional data in your internal data warehouse")
4. Verify general chat suggests CRM Guru when CRM data would be needed

**S5-T05: Hunch filter**
1. Read the system prompt construction where hunches are injected
2. Verify accepted hunches appear in the effective prompt (after master prompt, before session context)
3. Verify dismissed hunches are excluded
4. Verify resolved hunches are removed
5. Verify the master prompt is byte-identical before and after hunch operations

**Files touched:** `server/routes.ts` (chat endpoint), `client/src/hooks/useStreamingChat.ts`, `client/src/pages/main.tsx`, `agents.tsx`
**Depends on:** S2 complete
**Effort:** Medium
**ACs addressed:** AC-06-A/B/C/D (Advanced Chat), AC-07-A/B/C (CRM Guru), AC-HF-A/B/C/D (Hunch Filter)

**What I show you at the gate:**
- Thinking card: appears during processing, disappears on stream start
- Chat history: previous conversations accessible on return
- Persona name: org custom name used, VAPI fallback works
- CRM Guru: VIN data priority, warehouse attribution, general chat suggestion
- Hunch filter: accepted/dismissed/resolved behavior, master prompt immutability
- Pass/fail for each AC

---

### Phase S6: Outbound Safety + TeamBox + Metering

**Why:** The kill switch is safety-critical. It must actually work before any outbound communication goes live.

**Steps I will take:**

**S6-T01: Kill switch**
1. Read `server/outbound.ts` and the kill switch enforcement code
2. Test with `outbound_enabled=FALSE`: verify SMS blocked + escalation created, phone blocked + escalation created, email blocked + escalation created
3. Test with `outbound_enabled=TRUE`, `sms_enabled=FALSE`: verify SMS blocked but email/phone pass
4. Verify master switch always overrides channel switches
5. Verify the 4 columns exist with DEFAULT FALSE in schema

**S6-T02: Campaign execution + rate limiter + logging**
1. Replace the in-memory `activeExecutions` Map with database-backed execution state (new table or status columns on campaigns)
2. Verify rate limiter: 4th message in 24 hours blocked with Unsent Message escalation
3. Verify every trigger (sent or blocked) is logged with: trigger_id, org_id, customer_id, channel, status, blocked_reason, timestamp

**S6-T03: Metering**
1. Verify outbound SMS creates a `usage_events` entry
2. Verify Usage page shows counts without dollar amounts for Org Admin
3. Verify Partner Admin sees only their assigned orgs' usage

**S6-T04: TeamBox escalation types**
1. Read `client/src/pages/teambox.tsx`
2. Verify Task, Escalation, and Unsent Message are visually distinct types
3. Verify Critical/High/Medium/Low priority levels have distinct visual treatment

**Files touched:** `server/outbound.ts`, `server/routes.ts`, `shared/schema.ts` (if new table needed), `client/src/pages/teambox.tsx`, `usage.tsx`
**Depends on:** S3 complete (VAPI needed for phone channel)
**Effort:** Medium
**ACs addressed:** AC-05-A/B/C/D/E/F (Outbound), AC-KS-A/B (Kill Switch), AC-TB-A/B (TeamBox), AC-10-A/B/C (Metering)

**What I show you at the gate:**
- Kill switch: test results for all channel blocks, master override evidence
- Campaign state: persists through restart
- Rate limiter: 4th message blocked evidence
- Trigger logging: log entry with all required fields
- Metering: usage_events created, visible on Usage page, org-scoped
- TeamBox: visual distinction between types and priorities
- Pass/fail for each AC

---

### Phase S7: Automated Testing

**Why:** Zero tests means any change can break anything silently. This phase creates a safety net.

**Steps I will take:**

**S7-T01: Expand Enforcer**
1. Read `scripts/enforcer.ts` (currently checks dropped features + kill switch defaults only)
2. Add mock data detection: scan production pages for imports from `@/mocks/` or `client/src/mocks/`
3. Add credential scanning improvements
4. Run Enforcer against current codebase and verify all checks pass

**S7-T02: Test framework setup**
1. Install Vitest (or Playwright for E2E)
2. Create configuration file
3. Write first test suite covering kill switch ACs (AC-KS-A, AC-KS-B)
4. Verify tests run and pass

**S7-T03: API integration tests**
1. Create tests covering: login flow, chat creation + message, campaign CRUD, metrics endpoint returns real data
2. Verify tests run against the actual application

**S7-T04: Battery mapping**
1. Create `testing/README.md` that maps each of your test batteries (battery_01 through battery_06) to:
   - Which automated test files cover it (if any)
   - Which tests must be run manually
   - Which AC IDs each battery covers

**Files touched:** `scripts/enforcer.ts`, new test configuration, new test files in `tests/`, `testing/README.md`
**Depends on:** S6 complete
**Effort:** Large
**ACs addressed:** AC-EF-A/B/C (Enforcer Compliance)

**What I show you at the gate:**
- Enforcer: expanded checks, all passing
- Test suite: running, kill switch tests passing
- API tests: running, passing
- Battery mapping: complete in testing/README.md
- Pass/fail for each AC

---

### Phase S8: Final Polish

**Why:** Cleans up the last mock data and UI inconsistencies before RC declaration.

**Steps I will take:**

**S8-T01: Navigation shell ACs**
1. Read `SubMenuManager.tsx` and `Sidebar.tsx`
2. Verify each of the 10 AC-NAV criteria individually:
   - AI Chat sub-items: Favorites, Chat History, Artifacts
   - Artifacts scoped to data reports only (no file upload/sharing)
   - My Work sub-items: Assistant (Coming Soon), Dashboard, Tasks, Chat
   - TeamBox sub-items: Tasks, Conversations, Workflows
   - All conversations route to TeamBox → Conversations
   - Sales: Dashboard, Agents, Insights, Calendar (no Campaigns)
   - Service: Dashboard, Agents, Campaigns, Insights, Calendar
   - Management: Dashboard, Insights, Hunches (Coming Soon), Activities, ROI
   - Disabled module absent from nav
   - Enabled-but-not-built shows Coming Soon + not clickable
3. Fix any that don't match

**S8-T02: My Work chat tab**
1. Read `client/src/pages/my-work.tsx` — identify the mock imports (lines 20-22)
2. Replace `mockConversations` and `mockTeamboxConversations` with `useQuery` calls to `/api/conversations`
3. Remove the mock imports
4. Verify the chat tab renders real conversation data

**S8-T03: Remove remaining mock files**
1. Delete `client/src/mocks/messages.ts`, `conversations.ts`, and `index.ts` (the 3 that were kept because they had active consumers)
2. If `client/src/mocks/` directory is now empty, delete it
3. Run a build to verify no broken imports

**S8-T04: Settings demo-mode actions**
1. Read `client/src/pages/settings.tsx` and identify all demo-mode toasts
2. For each: either wire to real backend functionality or change the toast to say "Available in a future release" and add a tracking item to GAPS.md
3. Document which were wired and which were deferred

**Files touched:** `client/src/pages/my-work.tsx`, `settings.tsx`, `SubMenuManager.tsx`, `Sidebar.tsx`, `client/src/mocks/`
**Depends on:** S4 + S5 + S7 complete
**Effort:** Medium
**ACs addressed:** AC-NAV-A through AC-NAV-J (Navigation Shell)

**What I show you at the gate:**
- Navigation: each AC-NAV item verified individually with evidence
- My Work: zero mock imports, chat tab shows real data
- Mock files: all deleted, build passes
- Settings: each demo-mode action either wired or documented as deferred
- Pass/fail for each AC
- **If all RC-gate ACs pass at this point → I propose RC declaration for your approval**

---

## Phase Dependencies (What Can Run in Parallel)

```
S1 (Clean House) ────┐
                      ├──→ S3 (VAPI/Tavus/Widget) ──→ S6 (Outbound/Safety) ──→ S7 (Tests) ──┐
S2 (Fix Schema) ─────┘                                                                        │
                                                                                               v
S4 (Real Metrics) ────────────────────────────────────────────────────────────→ S8 (Final Polish)
                                                                                               ^
S5 (Harden Chat) ─────────────────────────────────────────────────────────────────────────────┘
```

- S1 and S2 run at the same time (no dependencies)
- S4 and S5 can run at the same time after S2 finishes
- S3 needs both S1 and S2 done first
- Everything else is sequential after that

---

## What's NOT in This Plan (Deferred)

These are tracked but intentionally excluded from stabilization:
- Google Calendar / Dealer.com / Tekion appointment sync (AC-03)
- Stripe billing integration (AC-10-D)
- RLS database security policies
- Marketing Studio
- NanoClaw / Personal Assistant
- A2P / 10DLC SMS registration

---

## How Each Phase Ends

Every phase follows the same pattern:
1. I do the work
2. I self-verify against the acceptance criteria
3. I **stop and show you the results** — which ACs passed, which failed, what evidence I have
4. **You approve** before I move to the next phase
5. No phase gets skipped, no batch-completing multiple phases

---

## Governance Document Changes (Part of Execution, Not Done Yet)

When you approve this plan and I begin Phase S1 execution, I will also update the project's governance files. Here is exactly what I plan to change and why:

### Files I will rewrite:

**PLAN.md** (currently v3.1 — 4-Wave format)
- **What I'll do:** Replace with a stabilization-focused plan that has:
  - An AC traceability table mapping all 62 ACs to task IDs and status (so you can look up any AC and see where it stands)
  - The 8 phases above with numbered tasks (S1-T01, S1-T02, etc.)
  - Self-verification criteria for every task
  - A sprint report template for reporting AC results at each gate
  - The RC gate definition (which ACs must all pass)
- **Why:** The current PLAN.md claims ~92% complete with contradictory wave statuses. It doesn't map to ACs and doesn't support the gate/approval workflow.
- **Draft available at:** `proposed/PLAN_v4.md`

**GUARDRAILS.md** (currently 10 rules)
- **What I'll do:** Add 7 new rules (R11-R17):
  - R11: Must read self-verification gate before starting a task
  - R12: Every code change must reference a gap ID or AC ID
  - R13: Mock removal requires real API replacement + evidence
  - R14: No phase complete without all sub-tasks verified + user approval
  - R15: Must read GAPS.md, GUARDRAILS.md, and current phase before each session
  - R16: GATE:STOP — mandatory stop + user approval after every task
  - R17: Planning completion notification — must explicitly tell you when planning is done
- **Why:** The current 10 rules are good but don't enforce the approval workflow you asked for.
- **Draft available at:** `proposed/GUARDRAILS_v2.md`

**MEMORY.md**
- **What I'll do:** Add a session log entry recording what was done in the synthesis phase.
- **Draft available at:** `proposed/MEMORY_updated.md`

**replit.md**
- **What I'll do:** Update to reflect: current project status (stabilization phase), new documents (RISK_REGISTER.md, testing/, etc.), correct truth hierarchy, agent protocol.
- **Why:** Currently describes "Sprints 1-6" as if features are complete, which contradicts audit findings.
- **Draft available at:** `proposed/replit_updated.md`

### New files I will create:

**AGENT_CODING_PLAN.md**
- **What it is:** The operational playbook an agent reads before touching code — pre-flight checklist, per-task workflow, forbidden patterns (no mock data in production, no silent error swallowing, no in-memory state for persistent data), file scope rules per phase, sprint report procedure.
- **Draft available at:** `proposed/AGENT_CODING_PLAN.md`

### Files already created (during synthesis — no code changes):

- **RISK_REGISTER.md** — 69 risk items ranked and tagged with AC IDs, 10 contradictions resolved, nuisance file list
- **STABILIZATION_PLAN.md** — This document
- **testing/** — 12 test battery files with clean names

**None of the governance file changes happen until you approve this plan.**

---

## What the Project Looks Like After Stabilization

- All communication channels working end-to-end (chat, voice, video, SMS, email)
- Every metric in the UI backed by real database data
- AI Chat stable with history, persona names, CRM Guru mode, and hunch filtering
- Kill switch and safety stack verified
- Automated test coverage established
- No mock data in production paths
- Clean governance — one truth hierarchy, no stale docs, no contradictions
- Ready to resume building toward the Release Candidate
