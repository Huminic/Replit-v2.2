# Testing Sprint Outcomes — Tied to User Stories
**Date:** 2026-03-26
**Purpose:** Each sprint description must prove a specific user-facing outcome that ties to acceptance criteria and ghost gates.

---

## T-013: Navigation & UI Integrity [FE]

**Outcome:** Prove that every user, regardless of role, can navigate the entire application without encountering dead links, mismatched labels, phantom menu items, or console errors. Every popout/sub-menu link must land on the correct page and tab. The navigation must reflect the current state of the application — no references to removed features (My Work, Billing in profile), no stale labels (Take a Tour), and no duplicate sections (Marketing agents). Campaign management must be discoverable with tooltips explaining each action button, and the Campaign Safety message must be dismissible so it doesn't obstruct daily workflow. This directly validates US-018 (TeamBox Filtering — popout links work), US-020 (History Preserve — chat history navigable), and the operator's walkthrough findings from I-125.

**Success means:** A user can click every navigation element in the application and arrive at the right place. Nothing is broken, nothing is missing, nothing leads nowhere.

---

## T-014: Data Flow & Metrics Accuracy [DT]

**Outcome:** Prove that every data tile, metric, activity feed, and insight across the application shows real data from real API endpoints — not hardcoded values, not stale caches, not mock arrays. When a customer submits a form on a landing page or widget, that submission must appear as a conversation in TeamBox within 30 seconds. Sales metrics must match the VIN lead summary API. The activity feed must show real system events. Hunches must generate actionable business intelligence from actual org data. Metric drill-down dialogs must show breakdown data that traces back to the API source. This validates US-007 (Pipeline Review — tiles match warehouse data), US-023 (Metric Review — accurate KPIs), US-025 (Executive Insight — management insights from real data), US-003 (Form to Two-Way SMS — form creates conversation), and US-024 (Source Analysis — pipeline breakdown accurate).

**Success means:** Every number a user sees on screen can be traced to a real API response. No tile lies. No feed is fake. No form submission disappears.

---

## T-015: RBAC & Multi-Tenant Isolation [AU]

**Outcome:** Prove that no user can see another organization's data. A Serra Honda admin must see only Serra Honda leads, conversations, agents, and metrics — never Serra Nissan, never Ford of Columbia. A partner admin (Cage Automotive) must see all 5 dealerships under their umbrella but never Huminic system data. Settings tiles must appear or hide based on role — super_admin sees AI Configuration, org_admin does not. Non-management roles must be redirected away from the management page. This validates US-022 (Multi-Store Oversight — partner sees all stores, each store sees only itself), S-9.AC5/AC6 (cross-org data isolation), and the security foundation that every other feature depends on.

**Success means:** The application enforces data boundaries. No user can see, modify, or infer data belonging to another organization. Role-based access controls work as designed. This is a launch blocker — if isolation fails, nothing else matters.

---

## T-016: Integration Verification [IN]

**Outcome:** Prove that every external integration is connected, authenticated, and returning real data. VAPI assistants listed in the API must match the agents stored in the database — no orphaned assistants, no missing agent records. Tavus video sessions must be creatable and return a valid conversation URL. The Communication Gate must actually stop all outbound when toggled off — not just update a UI toggle, but prevent real message sends. Individual channel toggles (SMS, email, phone, video) must independently control their channel. The MCP bridge to TextMagic and VAPI must be accessible and authenticated. The video popup fix must work in a real browser — opening a new window, not getting blocked. This validates US-004 (VAPI Inbound Call — assistants aligned), US-027 (Master Kill Switch — CommGate stops all outbound), US-028 (Channel Pause — per-channel control), and the infrastructure foundation for T-017a/b comms testing.

**Success means:** Every external service the application depends on is reachable, authenticated, and behaving as expected. The safety controls (CommGate, channel toggles, rate limits) actually work — not just in the UI, but in the outbound pipeline.

---

## T-017a: Sales Communication Continuity [BE]

**Outcome:** Prove the complete sales inbound communication lifecycle works end-to-end without human intervention. A customer texts the sales number → Caroline (the sales comms agent) responds intelligently → the conversation is visible in TeamBox → a human can take over the conversation and the AI stops. A customer calls the sales number → Elliott (test agent) simulates the call → the VAPI webhook fires → an email notification goes to the store admins → a VIN lead is created in the CRM → a transcript is available in TeamBox's Phone tab. If outbound follow-up triggers exist, they fire correctly after business hours. This validates US-001 (Web Chat to VIN Lead), US-004 (VAPI Inbound Call — full pipeline), US-015 (SMS Inbound Query — customer texts, gets response), US-017 (SMS Handover — human takes over from AI), and US-029 (Email Draft — notifications reach admins).

**Success means:** A customer can reach the dealership through text or phone, get an intelligent AI response, and the entire interaction is captured, logged, and actionable. The sales team can see everything in TeamBox and take over when needed.

---

## T-017b: Service Campaign Continuity [BE]

**Outcome:** Prove the complete service campaign lifecycle works end-to-end. A service manager creates a recall campaign → uploads a CSV of customer phone numbers → executes the campaign → customers receive SMS messages → customers who reply are handled by Nancy (the service agent) → Nancy can schedule service appointments → appointment data lands in the calendar. Campaign disconnect must stop future messages to a specific customer. After-hours messages must be queued (not sent) and released when business hours resume. This validates US-009 (Oil Change Campaign — campaign E2E), US-010 (Recall Notification — campaign reaches customers), US-014 (Service Agent FAQ — Nancy answers service questions), US-021 (After-Hours — messages queued outside business hours), and US-012 (Opt-Out — STOP handling in campaign context).

**Success means:** A service department can run a customer outreach campaign from creation to completion. Every message is tracked, every reply is handled, every appointment is captured. The safety rails (after-hours, opt-out, disconnect) protect customers from over-communication.

---

## T-018: TeamBox End-to-End — Unified Inbox [FE]

**Outcome:** Prove that TeamBox is a functional unified inbox where every customer interaction — regardless of channel — is visible, searchable, and actionable. SMS conversations from T-017a/b must be visible. Voice call logs from VAPI must show with transcripts. Form submissions from the landing page must appear. Video session logs from Tavus must show with recording links. A human must be able to reply from TeamBox and have the message delivered to the customer. The Take Over cycle must work — assign a human, AI stops, un-assign, AI resumes. The kill switch queue must hold messages when CommGate is off and release them when it's back on. Channel filter chips must actually filter. Status filters must actually filter. This validates US-006 (CRM Guru — conversations accessible), US-015 (SMS Inbound — visible in inbox), US-017 (SMS Handover — takeover works), US-018 (TeamBox Filtering — filters functional), and the operator's core requirement that TeamBox is the single source of truth for all customer communication.

**Success means:** Every message that enters or leaves the system is visible in TeamBox. A staff member can open TeamBox and see every customer interaction across every channel, filter by what they need, reply to any conversation, and take over from the AI when necessary.

---

## T-019: Chat & Agent Usability [FE]

**Outcome:** Prove that the AI chat experience is high quality and that every department agent serves its intended purpose. The home page AI chat must use org-specific context — asking about dealership inventory should return real data, not generic responses. Chat history must show meaningful titles (not usernames) and resuming a previous chat must load the full conversation. Each sales agent (Data Guru, Sales Coach, Communication Writer, Caroline) must respond on-topic when engaged. Nancy must handle service questions. All 5 marketing agents must produce relevant output for their domain. Agent cards across all department pages must show the agent's name, purpose description, and be clickable. This validates US-006 (CRM Guru — returns real VIN data), US-016 (AI List Gen — chat produces useful lists), US-026 (Coaching — Sales Coach gives advice), US-029 (Email Draft — Writer produces drafts), US-020 (History Preserve — chat history works), US-030 (CRM Cross-Ref — chat uses CRM data), and the overall promise that AI agents are useful, not decorative.

**Success means:** Every AI agent in the system can have a meaningful conversation about its domain. The chat interface works end-to-end — start a conversation, get a useful response, come back later and pick up where you left off.

---

## T-020: Static Code Scan [BE]

**Outcome:** Prove that the codebase has no lurking time bombs — no hardcoded mock data masquerading as real data, no API routes missing auth middleware, no database queries that leak data across organizations, no abandoned TODO comments marking unfinished features that were shipped anyway. Every file modified during SEC sprints must be clean of unused imports. Every interactive UI element must have test IDs for automation. No production credentials must exist in committed code. This is the code-level equivalent of a building inspection — it doesn't test features, it tests the foundation they're built on.

**Success means:** The codebase is honest. What it says it does, it does. What it says is real, is real. What it says is secure, is secure. No hidden shortcuts, no silent failures, no lying tests.

---

## Devil's Advocate — What Did We Miss?

### Gap 1: Org Switcher Continuity
**What's missing:** No test verifies that switching organizations via the TopBar org switcher actually reloads all data for the new org. US-022 tests that a partner admin *sees* multiple stores, but not that switching between them refreshes metrics, conversations, agents, and settings correctly. A stale cache after org switch could show Serra Honda data on a Serra Nissan screen.
**Proposed sprint:** T-015.AC10 — add org switch test: login as partner admin → switch org → verify all page data reflects new org.

### Gap 2: Concurrent Campaign Safety
**What's missing:** We test campaigns execute and after-hours queues work, but not what happens when two campaigns target overlapping recipients. The rate limiter (100/24h per phone) protects against volume, but does the system handle a sales campaign and service campaign hitting the same customer simultaneously? Does the UI show which campaign a message belongs to? Can a staff member tell which conversation came from which campaign?
**Proposed sprint:** T-017b.AC7 — add concurrent campaign test: two campaigns, overlapping recipient, verify both tracked and distinguishable in TeamBox.

### Gap 3: Webhook Failure Recovery
**What's missing:** We test that VAPI webhooks fire and create conversations. But what happens when a webhook fails? Is there retry logic? Does the system log the failure? If the server is restarting during a VAPI call end-of-call webhook, is the data lost forever? The 9 weekend calls that needed replaying (S-9.AC3/AC4) suggest this has happened before.
**Proposed sprint:** T-016.AC10 — verify webhook error handling: simulate a webhook POST that fails (wrong format, server error), check if it's logged and if there's a retry mechanism or manual replay option.

### Gap 4: Chat Quality Under Load / Edge Cases
**What's missing:** We test that agents respond on-topic, but not edge cases: What happens when a user sends an empty message? A 10,000 character message? A message with SQL injection attempts? A message in Spanish? Multiple rapid messages? Does the streaming break? Does the system prompt handle adversarial input? Chat quality tests (T-019) are happy-path only.
**Proposed sprint:** T-019.AC10 — add chat edge case tests: empty input, very long input, non-English input, rapid successive messages, verify no crash/hang/leak.

### Gap 5: Widget Embed on External Site
**What's missing:** We test the widget ON the landing page, but the widget is designed to be embedded on dealer websites via an embed code (S-8.AC13 generates the snippet). We never verify that the generated embed code actually works when loaded on an external page. Does the JS load? Does the widget render? Do CORS headers allow cross-origin requests? This is a real deployment scenario — dealers will paste this code on their WordPress sites.
**Proposed sprint:** T-016.AC11 — verify widget embed: create a minimal HTML page, paste the generated embed code, load it, verify widget renders and chat/form/video functions work cross-origin.

### Gap 6: Billing Data Accuracy
**What's missing:** I-105 (FlexPrice billing not configured) is documented but never tested even at the API level. We don't verify that the billing plans catalog loads, that usage tracking increments, or that the BillingDashboard component renders anything meaningful. If billing is a launch blocker, it needs a test even if it's just "API returns {configured: false} and UI shows appropriate message."
**Proposed sprint:** T-014.AC10 — add billing API test: GET /api/billing/summary, verify response structure. GET /api/billing/plans, verify catalog. Document current state as baseline.

### Gap 7: Password Reset / Account Recovery
**What's missing:** We test login, profile edit, and password change. But we never test the forgot-password flow. The login page presumably has a "Forgot Password" link. Does it send an email via Resend? Does the reset link work? Does the new password persist? This is a real user flow that's completely untested.
**Proposed sprint:** T-015.AC10 — verify forgot-password: trigger reset, check Resend logs for email, verify reset page loads (don't actually reset a test account password unless we have a recovery plan).

### Gap 8: Mobile Responsiveness
**What's missing:** Every Playwright test runs in desktop viewport. The app has a MobileNavDropdown component and responsive breakpoints. No test verifies that pages render correctly on mobile viewports. TeamBox's 4-column layout — does it collapse? Do tooltips work on touch? Does the widget work on mobile?
**Proposed sprint:** T-013.AC12 — add mobile viewport tests: resize to 375x812 (iPhone), navigate key pages, verify no overflow, no hidden content, mobile nav works.

---

## Updated Gap Summary

| Gap | Severity | Add To Sprint |
|---|---|---|
| Org switcher data reload | T1 | T-015 |
| Concurrent campaign overlap | T2 | T-017b |
| Webhook failure recovery | T1 | T-016 |
| Chat edge cases | T2 | T-019 |
| Widget embed cross-origin | T1 | T-016 |
| Billing API baseline | T1 | T-014 |
| Password reset flow | T2 | T-015 |
| Mobile responsiveness | T2 | T-013 |
