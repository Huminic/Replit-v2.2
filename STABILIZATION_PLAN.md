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

### Phase S1: Clean House (Governance)
**What:** Archive 6 stale documents, delete 11 junk files, fix the truth hierarchy in CLAUDE.md
**Why:** Removes confusion so future work doesn't get derailed by outdated specs
**Effort:** Small
**Files touched:** Governance docs only — no application code

### Phase S2: Fix the Foundation (Schema)
**What:** Resolve the dual schema conflict, add delete cascades to all foreign keys, add database indexes, generate a migration file
**Why:** Without this, any feature work risks data integrity issues
**Effort:** Small
**Files touched:** shared/schema.ts, shared/models/chat.ts, migrations/

### Phase S3: Wire the Communication Stack (VAPI + Tavus + Widget + Landing Page)
**What:**
- Replace VAPI console.log with real voice API calls, including VinSolutions lead creation when a call completes and TeamBox escalations when it fails
- Build Tavus video integration from scratch — client, session initialization, persona matching
- Verify widget has all 4 channels working (chat, call, form, video)
- Verify landing page is publicly accessible with functional widget, slug handling, globe icon link
**Why:** This is the core of the RC milestone
**Effort:** Large
**Depends on:** S1 + S2 complete
**ACs addressed:** AC-02 (VAPI), AC-04 (Widget), AC-08 (Customer View), AC-09 (Landing Page)

### Phase S4: Make Metrics Real
**What:**
- Verify the 4 main page tiles show real data and hide when chat starts
- Replace the entire Insights page (100% mock) with real API-backed data
- Implement trend percentages (vs previous period) instead of showing 0
- Wire TopBar and Sales activity feeds to the real activity log API
**Why:** "Correct metrics in UI" is an RC gate requirement
**Effort:** Large (Insights page is ~2000 lines of mock data to replace)
**Depends on:** S2 complete
**ACs addressed:** AC-01 (Accurate Metrics), AC-CH (Chat Landing Metrics)

### Phase S5: Harden AI Chat
**What:**
- Verify thinking card appears during AI processing
- Fix chat history persistence and mid-stream failure data loss
- Verify persona name comes from org settings with VAPI fallback
- Verify CRM Guru mode prioritizes VinSolutions data
- Verify hunch filter (accepted in prompt, dismissed excluded, resolved removed, master prompt unchanged)
**Why:** "Stable/advanced user chat" is an RC gate requirement
**Effort:** Medium
**Depends on:** S2 complete
**ACs addressed:** AC-06 (Advanced Chat), AC-07 (CRM Guru), AC-HF (Hunch Filter)

### Phase S6: Outbound Safety + TeamBox + Metering
**What:**
- Verify kill switch blocks all 3 channels (SMS, phone, email) and creates escalations
- Fix campaign execution to persist state (not in-memory)
- Verify rate limiting and trigger logging
- Verify usage metering pipeline
- Verify TeamBox shows distinct escalation types and priority levels
**Why:** Safety-critical — kill switch must work correctly before any outbound goes live
**Effort:** Medium
**Depends on:** S3 complete (VAPI needed for phone channel testing)
**ACs addressed:** AC-05 (Outbound), AC-KS (Kill Switch), AC-TB (TeamBox), AC-10 (Metering)

### Phase S7: Automated Testing
**What:**
- Expand the Enforcer script to detect mock data in production pages
- Set up a test framework and create first test suites
- Create API integration tests for critical endpoints
- Map your test batteries to executable test plans
**Why:** Zero tests means every change is a gamble
**Effort:** Large
**Depends on:** S6 complete
**ACs addressed:** AC-EF (Enforcer Compliance)

### Phase S8: Final Polish
**What:**
- Verify all 10 navigation shell ACs (sub-items, Coming Soon labels, routing)
- Wire My Work chat tab to real API, remove mock imports
- Delete remaining orphaned mock files
- Address Settings demo-mode toasts (wire or label as future)
**Why:** Cleans up the last mock data and UI inconsistencies
**Effort:** Medium
**Depends on:** S4 + S5 + S7 complete
**ACs addressed:** AC-NAV (Navigation Shell)

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

## What the Project Looks Like After Stabilization

- All communication channels working end-to-end (chat, voice, video, SMS, email)
- Every metric in the UI backed by real database data
- AI Chat stable with history, persona names, CRM Guru mode, and hunch filtering
- Kill switch and safety stack verified
- Automated test coverage established
- No mock data in production paths
- Clean governance — one truth hierarchy, no stale docs, no contradictions
- Ready to resume building toward the Release Candidate
