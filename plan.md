# Nexxus Connect v2.2 — Development Plan (Phase Reset)

**Date:** 2026-03-23
**Supersedes:** Old 15-phase plan (backed up at .ghost/backups/2026-03-23-phase-reset/)
**Previous work:** 85 sprints committed across old phases 1-14. This plan does not undo that work — it builds on it by reorganizing remaining work by page and fixing regressions.

---

## How to Read This Document

This plan is organized BY PAGE. Each page is a sprint. You work one sprint at a time — fix, build, style, test, verify — then move on. No sprint is done until every acceptance criterion has visual or functional proof.

**Sprint** — A complete unit of work for one page/section. Contains UI changes, FE code, BE code, data fixes, and tests. Each sprint is a single git checkpoint when complete.

**Acceptance Criteria Hierarchy:**
1. **Program AC** — What "done" means for the whole application (Section 1 below)
2. **Sprint AC** — What "done" means for each page (in each sprint section)
3. **Component AC** — Testable criteria for each change within a sprint
4. **Test Cases** — Playwright/observability tests that prove each component AC

Every component AC must have a test case. Every test case must produce evidence (screenshot, API response, or assertion). No criterion is "done" without proof.

**Sprint Types Within Each Sprint:**
- UI — Layout, tab order, visual changes (requires screenshot proof)
- FE — Frontend code changes (requires browser test proof)
- BE — Backend/API changes (requires API test proof)
- DT — Database/seed data changes (requires query proof)
- FIX — Bug fix (requires before/after proof)
- TEST — New or updated test (requires passing test output)

**UI Modification Permission Model:**
The dev agent must NOT modify UI values (menu items, tab labels, layout positions) without explicit permission. Permission is declared in the pre-exec for each sprint, listing exactly which UI elements will be modified. The ghost agent verifies the declaration against the actual changes.

---

## Section 0 — Sprint Execution Protocol

This section defines HOW work happens within each sprint. The plan (Section 3) defines WHAT to build. This section defines the process for building, testing, fixing, and escalating.

### Agent Role: ORCHESTRATOR

You are the orchestrator. You manage the sprint lifecycle but do NOT write application code directly. For each sprint:

1. Read the sprint's components from sprints.json
2. For each component that requires code changes (UI/FE/BE/DT types):
   - Spawn a builder sub-agent with the component description, files to modify, and acceptance criteria
   - The sub-agent writes the code and reports back
   - You verify the sub-agent's work against the ACs
3. For TEST-type components: you can run tests directly or spawn a test sub-agent
4. You write all governance artifacts (pre-exec, post-sprint, cross-sign)
5. You manage the commit through the harness

**Sub-agent dispatch pattern:**
```
Agent(
  prompt="Implement component S-X.Y: {description}. Files: {filesModified}.
          AC: {criterion}. Read the file BEFORE modifying. Follow SPEC-N in plan.md.
          Rules: do NOT modify files outside scope. Do NOT touch UI unless uiPermissions allows.
          Return: what you changed, what you verified, any issues found.",
  subagent_type="general-purpose"
)
```

### Step 1: IMPLEMENT
Build the sprint's components following plan.md SPEC sections and sprints.json component list. Delegate code changes to builder sub-agents.

### Step 2: SELF-TEST
Run the sprint's test file (e.g., `npx playwright test tests/e2e/s0-foundation.spec.ts`).
- Every AC in sprints.json must have a corresponding test assertion
- Capture test output as evidence

### Step 3: FIX LOOP (if failures)
```
attempt = 0
while test failures exist AND attempt < 2:
    attempt += 1
    - Identify which AC failed
    - Fix the CODE (not the test) — unless the test itself has a bug
    - Re-run the specific failing test
    - If pass: continue to next failure
    - If fail: try a different approach

if attempt >= 2 OR stuck for > 30 minutes on a single issue:
    STOP
    Document: what failed, what you tried, what you think is wrong
    Escalate to owner — do NOT keep grinding
```

### Step 4: CROSS-TEST (regression check)
After all sprint ACs pass, run tests from overlapping sprints to catch regressions:

| After Sprint | Also Run | Why |
|-------------|----------|-----|
| S-2 (TeamBox) | domain-05-teambox.spec.ts | Existing TeamBox tests verify nothing broke |
| S-4 (Service) | domain-04-campaigns.spec.ts + s2-teambox.spec.ts | Campaign changes could affect TeamBox conversations |
| S-5 (Marketing) | domain-06-departments.spec.ts (6.3) | Department page tests verify marketing page |
| S-6 (Manage) | domain-06-departments.spec.ts (6.4) + domain-08-billing.spec.ts | Billing move + department page |
| S-7 (Profile) | s6-manage.spec.ts | Both touch profile.tsx — S-7 could undo S-6 billing removal |
| S-8 (Widgets) | domain-11-integrations.spec.ts | Widget endpoint tests |

### Step 5: CROSS-TEST FAILURE ROUTING
```
if cross-test failure:
    if caused by THIS sprint's changes:
        → Fix before committing (go back to Step 3)
    if pre-existing failure (failed before this sprint):
        → Log in issues.md with domain tag
        → Note "pre-existing, not caused by S-X"
        → Do NOT block the sprint commit
    if caused by a PREVIOUS sprint's code:
        → Log in issues.md with sprint reference
        → If the failing file is in this sprint's filesModified scope:
            → Fix it in this sprint
        → If the failing file is OUT of scope:
            → Defer to S-9 (Cross-Cutting)
            → Do NOT modify out-of-scope files
```

### Step 6: COMMIT
Follow harness lifecycle: evidence artifacts → enforcer checklist → cross-sign → commit through hook.

### Bug Routing Rules

| Scenario | Action |
|----------|--------|
| Bug in THIS sprint's code | Fix it, retest, don't commit until it passes |
| Bug in a PREVIOUS sprint's code, file IS in scope | Fix in this sprint, document in issues.md |
| Bug in a PREVIOUS sprint's code, file NOT in scope | Log in issues.md, defer to S-9 |
| Bug in code NO sprint touches | Log in issues.md, add to S-9 backlog |
| Bug requires UI change in a NONE-permission sprint | STOP — escalate to owner for permission |
| Agent stuck for 30+ minutes on one issue | STOP — escalate to owner with documentation |
| 2 fix attempts failed for same issue | STOP — escalate to owner with documentation |

### Owner Visual Inspection Gates

At specific sprints, the owner must visually inspect the running application before the next sprint starts. The dev agent must STOP and present the app for review.

| After Sprint | Owner Checks | Why |
|-------------|-------------|-----|
| S-0 | Nothing — database only, no UI | No visual changes |
| S-1 | Nothing — verification only | No code changes |
| S-2 | TeamBox: popout items, Phone tab, Video tab, filter colors | NEW features, no independent validation |
| S-3 | Nothing — verification + minor agent card changes | Low visual risk |
| S-4 | Service: tab order, campaign detail dialog, Nancy chat quality | Heaviest UI restructure |
| S-5 | Marketing: no Campaigns tab, 5 agent cards, Studio filters | Removal + new filters |
| S-6 | Manage: Billing tab works, no Dashboard/ROI, User Chats | Component move risk |
| S-7 | Nothing — small text changes | Low visual risk |
| S-8 | Landing page: store name visible, video opens correctly | Cross-frame behavior |
| S-9 | Nothing — testing and backend only | No visual changes |
| S-10 | Full walkthrough — every page, every role | Final sign-off |

**Process for visual inspection:**
1. Dev agent completes sprint, all tests pass
2. Dev agent runs `npm run build && pm2 restart nexxus-app` (GATED — sprint must be committed first)
3. Dev agent presents: "S-X complete. Please inspect [specific items] at dev.huminicdev.com"
4. Owner inspects and responds: "APPROVED" or "ISSUE: [description]"
5. If ISSUE: dev agent fixes within the sprint scope (go back to Step 3 of fix loop)
6. If APPROVED: dev agent proceeds to next sprint

**Sprints that SKIP visual inspection:** S-0, S-1, S-3, S-7, S-9
**Sprints that REQUIRE visual inspection:** S-2, S-4, S-5, S-6, S-8, S-10

---

## Section 1 — Program-Level Acceptance Criteria

These are the outcomes that define "Nexxus Connect v2.2 is ready for use." Every sprint feeds into these. If any of these fail after all sprints are complete, we are not done.

### P-1: Every page loads without errors for every role
- Super Admin, Partner Admin, Org Admin, Executive, Sales, Service, Marketing
- No console errors, no blank pages, no infinite spinners
- RBAC enforced: unauthorized pages return 403 or redirect

### P-2: Every data tile shows a value that matches its API source
- No hardcoded prototype data displayed anywhere
- If API returns 0, tile shows 0 or "No data" — not a fake number
- Documented: tile name → API endpoint → value → MATCH

### P-3: Every AI agent has a distinct purpose and demonstrates it in conversation
- Each agent responds with domain-appropriate knowledge
- Multi-turn conversations maintain context
- Conversation quality comparable to ChatGPT
- Agents know which dealership they serve

### P-4: The VAPI call pipeline works end-to-end for all stores
- Inbound call → webhook fires → conversation in TeamBox → email to admins → VIN lead created
- All 6 voice agents (Caroline, Elizabeth, Savannah, Magnolia, Georgia, Nancy Gaston) resolve to correct org
- Email recipients follow hierarchy: org admin + partner admin + super admin

### P-5: Campaigns work end-to-end (service department)
- Create campaign → upload CSV → execute → SMS delivered → customer replies → reply in TeamBox
- Kill switch blocks all outbound when enabled
- CommGate respected for all channels

### P-6: TeamBox is a functional unified inbox
- SMS, email, voice, video conversations all visible
- Human takeover pauses AI
- Manual message sending works
- STOP/opt-out handled correctly

### P-7: No cross-org data leakage
- Login as Org A user → no Org B data visible on any page
- Partner admin sees only their stores + parent
- Super admin sees all

### P-8: Widget and landing pages work for all 5 dealers
- Widget JS serves per dealer with correct name
- Video opens in parent browser window (not inside widget iframe)
- Form submissions create conversations in TeamBox
- Landing pages display store name

### P-9: All open issues are CLOSED
- I-086, I-090, I-101, I-103, I-104, I-105, I-106 resolved
- All TG test gaps covered
- All TI test infrastructure issues fixed

### P-10: Production deployment pipeline works
- Push to main → build → test → deploy to Coolify
- Production smoke test passes
- Owner walkthrough confirms all pages functional

---

## Section 2 — Named Personas and External Services

### Voice/Video Personas (6 agents with VAPI + Tavus)
| Name | Department | Store | VAPI Assistant ID | Role |
|------|-----------|-------|-------------------|------|
| Caroline | Sales | Serra Honda | 90a876c0... | Comms Agent — inbound leads, appointments, follow-ups |
| Elizabeth | Marketing | Hyundai of Columbia | 6d12a8fa... | Campaign responses, lead nurturing |
| Savannah | Service | Ford of Columbia | 6216451c... | Service lane comms, upsell |
| Magnolia | Service | Serra Nissan | 2203b188... | Service appointments, recall notifications |
| Georgia | Sales | Tony Serra Ford | ad478eb2... | Truck/fleet sales inquiries |
| Nancy Gaston | Service | Serra Honda | c777f029... | Campaign Agent — recalls, scheduling, service knowledge |

### Chat-Only Agents (per store, all 5 stores)
| Name | Department | Role |
|------|-----------|------|
| Data Guru | Sales | VIN/CRM data queries, pipeline analysis (renamed from "CRM Guru") |
| Sales Coach | Sales | Sales coaching, technique guidance (NEW) |
| Communication Writer | Sales | Email/SMS draft generation (NEW) |
| Photo Studio | Marketing | Hero images, vehicle backgrounds (NEW) |
| Video Producer | Marketing | Promo videos, voiceovers (NEW) |
| Copywriter | Marketing | Ad copy, marketing text (NEW) |
| Market Intel | Marketing | Competitor radar, market analysis (NEW) |
| Creative Director | Marketing | Creative scoring, brand consistency (NEW) |

### External Services
| Service | Purpose | Integration |
|---------|---------|-------------|
| VAPI | Voice calls (inbound + outbound) | MCP via nexxus-integrations |
| Tavus | Two-way video sessions | MCP via nexxus-integrations |
| TextMagic | SMS (inbound + outbound) | MCP via nexxus-integrations |
| Resend | Email (outbound, noreply@huminic.ai) | MCP via nexxus-integrations |
| VIN Solutions | CRM (lead sync, contact CRUD) | vin-safe-mcp (port 4003) |
| FlexPrice | Billing/metering | Direct API |
| Anthropic Claude | AI chat, transcript analysis | Direct API |

### Key Decisions (owner-approved, preserved from old plan)
- After-hours blackout: 10 PM - 7 AM, messages queue
- Triggers: lead-based, time-delayed, per agent
- Campaigns: SMS primary, service can include email + phone
- Templates in agent knowledge base, not hardcoded
- Widget scheduling happens in conversation, not standalone
- Inbound email: BACKLOG
- VIN lead assignment: configurable per store
- Multi-step workflows: BACKLOG
- WhatsApp / Google Auth: NOT IN SCOPE

### Phone Number Strategy (CRITICAL — updated 2026-03-24)

**Two separate phone number systems — do NOT conflate them:**

```
SYSTEM 1: VAPI Voice Numbers (agents.assigned_phone)
  Provider: VAPI
  Purpose: Inbound voice calls to AI agents
  Stored in: agents table, assigned_phone column
  Managed via: VAPI dashboard
  These are the numbers customers CALL to reach the AI agent

SYSTEM 2: TextMagic SMS Numbers (integrations.sms_campaign_number)
  Provider: TextMagic
  Purpose: Outbound campaign SMS + inbound SMS replies
  Stored in: integrations table, sms_campaign_number column (NEW — built in S-0.7)
  Managed via: TextMagic account
  These are the numbers campaigns SEND FROM and customers REPLY TO

RULE: A VAPI number and a TextMagic number are DIFFERENT things on DIFFERENT platforms.
      They MAY be the same physical number (ported to both), but do NOT assume so.
      Always configure them independently.
```

**Current VAPI voice numbers (agents.assigned_phone):**
| Agent | Store | VAPI Number | Use |
|-------|-------|-------------|-----|
| Caroline | Serra Honda | +1 (901) 203-8267 | Sales inbound voice |
| Nancy Gaston | Serra Honda | +1 (901) 436-1271 | Service inbound voice |
| Magnolia | Serra Nissan | +1 (256) 862-3318 | Service voice |
| Georgia | Tony Serra Ford | +1 (256) 459-9707 | Sales voice |
| Elizabeth | Hyundai of Columbia | +1 (901) 203-9398 | Marketing voice |
| Savannah | Ford of Columbia | +1 (931) 369-2815 | Service voice |

**Current TextMagic SMS campaign numbers:**
- NOT YET CONFIGURED — sms_campaign_number column doesn't exist until S-0.7 builds it
- Owner will provide the TextMagic number(s) to use for campaigns
- Until configured, TextMagic sends from the account default number
- Do NOT assume VAPI numbers work for TextMagic SMS — they are separate providers

**Current limitation:** outbound.ts `sendSms()` calls `tm_send_message` with NO `from` number — TextMagic picks the account default. No per-org FROM number selection.

**What must be built (in S-0.7):**
1. Add `sms_campaign_number` column to integrations table (text, nullable)
   - This is the TextMagic number for outbound campaign SMS for that org
   - If null, TextMagic uses account default
   - This is NOT the same field as agents.assigned_phone (VAPI voice)
2. Update outbound.ts `sendSms()` to accept optional `fromNumber` parameter
   - Campaign execution passes the org's sms_campaign_number
   - If not set, falls back to TextMagic default
3. Update inbound SMS routing (server/routes/sms.ts) to match the TO number against integrations.sms_campaign_number for org/campaign reply routing
4. Owner provides TextMagic number(s) to seed — do NOT copy VAPI numbers

**What this enables:**
- When TextMagic numbers are purchased: UPDATE integrations SET sms_campaign_number = '+1XXXXXXXXXX'
- Each store gets its own SMS campaign number, independent of voice numbers
- Per-department SMS numbers can be added later (sms_campaign_number_service, sms_campaign_number_sales)
- Inbound reply routing identifies which org/campaign the reply belongs to

**For E2E testing (S-4.AC9):**
- Owner must confirm which TextMagic number to use for test sends
- If no dedicated number is configured, test uses TextMagic account default
- Test with owner's phone as the ONLY recipient
- Document which number was used in test evidence

**Configuration path for new stores:**
1. Purchase TextMagic number for the store
2. UPDATE integrations SET sms_campaign_number = '+1XXXXXXXXXX' WHERE organization_id = '{orgId}'
3. Feature ON — campaigns for that org send from the dedicated number
4. VAPI voice numbers configured separately in VAPI dashboard + agents.assigned_phone

### 5 Stores (all agents created for all stores)
1. Serra Honda (slug: serra-honda)
2. Serra Nissan (slug: serra-nissan)
3. Tony Serra Ford (slug: tony-serra-ford)
4. Hyundai of Columbia (slug: hyundai-of-columbia)
5. Ford of Columbia (slug: ford-of-columbia)

Parent: Cage Automotive (partner org)
Master: Huminic (super admin org)

---

## Section 3 — Sprint Plan

Work order: S-0 → S-1 → S-2 → S-3 → S-4 → S-5 → S-6 → S-7 → S-8 → S-9 → S-10
Sequential execution only. One sprint at a time. Complete it fully, commit, move on. No parallelization, no worktrees.

**IMPORTANT:** Before starting any sprint, verify the governance scripts (watchdog.sh, pre-commit.sh) recognize S-* sprint IDs. The dev agent CLAUDE.md must reference plan.md (not the old plan/*.md files) as the active plan.

---

### SPRINT S-0 — FOUNDATION

**WHY IT MATTERS**
Nothing else works until the database is correct, agents exist, and critical bugs are fixed. This sprint touches no UI — it's purely data and backend fixes that unblock every other sprint.

**RESOLVES:** I-086, I-090, I-101, TI-017

**WHAT GETS BUILT**

DT — Database Corrections
- S-0.0: Fix duane.wells@huminic.ai org assignment
  - Currently on Tony Serra Ford (wrong) — must be on Huminic (super_admin home org)
  - UPDATE users SET organization_id = (SELECT id FROM organizations WHERE slug = 'huminic') WHERE email = 'duane.wells@huminic.ai'
  - Verify: SELECT email, o.name FROM users u JOIN organizations o ON u.organization_id = o.id WHERE email = 'duane.wells@huminic.ai' → Huminic
  - Also update seed.ts if it seeds duane on the wrong org

- S-0.1: Re-enable CommGate for 4 remaining orgs — ALL 5 flags per org
  - UPDATE organizations SET outbound_enabled=true, sms_enabled=true, phone_enabled=true, email_enabled=true, video_enabled=true WHERE slug IN ('serra-nissan', 'tony-serra-ford', 'ford-of-columbia', 'hyundai-of-columbia')
  - Schema has 5 boolean flags (shared/schema.ts lines 18-22): outbound_enabled, sms_enabled, phone_enabled, email_enabled, video_enabled
  - Verify per-org: ALL 5 flags are true for all 5 orgs
  - Resolves I-101

- S-0.2: Rename agents (per-org — not all agents exist in all stores)
  - FIRST: Run query to see current state:
    SELECT o.name as org, a.name as agent, a.department FROM agents a JOIN organizations o ON a.organization_id = o.id WHERE a.department IN ('sales','service','marketing') ORDER BY o.name, a.department, a.name
  - Current state (from seed.ts analysis):
    * "Carol" exists for Serra Honda only (service, has VAPI ID) → rename to "Nancy Gaston"
    * "Service Agent" exists for Serra Honda only (service, chat-only) → rename to "Nancy Gaston" OR delete if Carol already covers it (don't create duplicates)
    * "CRM Guru" exists for Serra Honda, Serra Nissan, Tony Serra Ford (sales) → rename all to "Data Guru"
    * "CRM Guru" does NOT exist for Hyundai of Columbia or Ford of Columbia
    * "Marketing Agent" exists for Serra Honda only (marketing) → will be replaced by 5 specific marketing agents
  - Renames: UPDATE agents SET name='Nancy Gaston' WHERE name='Carol'; UPDATE agents SET name='Data Guru' WHERE name='CRM Guru'
  - Dedup: If both "Nancy Gaston" (from Carol) and "Service Agent" exist for same org, delete "Service Agent" (keep the one with vapiAssistantId)
  - Update server/seed.ts to match (seedMissingAgents at line 178, agentData at line 434-443)
  - Verify: no agents named "Carol", "Service Agent", or "CRM Guru" remain

- S-0.3: Create missing agent records for ALL 5 stores
  - FIRST: Query existing agents per org to know what's missing (from S-0.2 query above)
  - For EACH of the 5 orgs, INSERT agents that don't already exist:
    Sales: "Data Guru" (if not created by rename), "Sales Coach", "Communication Writer"
    Service: "Nancy Gaston" (if not created by rename — only Serra Honda has voice Nancy)
    Marketing: "Photo Studio", "Video Producer", "Copywriter", "Creative Director", "Market Intel"
  - NOTE on marketing names: Use frontend names from marketing-agents.ts (Photo Studio, Video Producer, Creative Director, Market Intel) — NOT the plan's original names. The DB records are displayed on the Agents tab and must match what the frontend marketing agent system uses.
  - Each agent needs: name, department, type="ai", status="active", description, channels=["chat"], organizationId
  - Update server/seed.ts seedMissingAgents() to iterate over ALL orgs, not just Serra Honda
  - Verify: GET /api/agents?department=sales per org returns Data Guru + Sales Coach + Communication Writer + voice agent
  - Verify: GET /api/agents?department=marketing per org returns Photo Studio, Video Producer, Copywriter, Creative Director, Market Intel

- S-0.3b: Seed instructions for all 7 new agent types from agent-instructions.json
  - Source file: agent-instructions.json (in project root)
  - For each agent type, read the instruction text from agent-instructions.json and UPDATE the agents.instructions field
  - Replace {{dealershipName}} with the agent's org name at insert time
  - DO NOT write instructions from scratch — use the pre-written text in agent-instructions.json exactly
  - Verify: SELECT name, length(instructions) FROM agents WHERE name IN ('Data Guru','Sales Coach','Communication Writer','Photo Studio','Video Producer','Copywriter','Market Intel','Creative Director') → all have length > 100

BE — Backend Fixes
- S-0.4: Fix VIN lead insert 422 (I-086)
  - Root cause: webhooks.ts uses callMCP("vin_create_contact") on port 4002 (central MCP) which returns malformed response (href=null). The vin-safe-mcp REST API on port 4003 works correctly.
  - Fix: rewrite VIN integration in server/routes/webhooks.ts to use vin-safe-mcp REST API on port 4003 instead of central MCP
  - New flow: POST /api/tool/vin_safe_prepare_lead (port 4003) → review payload → POST /api/tool/vin_safe_execute_lead (port 4003) → verify
  - Replace both VAPI webhook VIN block (webhooks.ts:593-650) and Tavus webhook VIN block (webhooks.ts:890-940)
  - Test: trigger VAPI webhook with test payload → verify VIN contact AND lead created via safe MCP
  - Resolves I-086

- S-0.5: Trigger warehouse metrics refresh for all 5 dealers (I-090)
  - For each org, call:
    POST /api/sync/backfill?orgId={orgId} (requires role level 2+ auth)
    POST /api/sync/metrics?orgId={orgId} (requires role level 2+ auth)
  - Endpoints are in server/routes/sync.ts
  - Org IDs: query SELECT id, name FROM organizations WHERE slug IN ('serra-honda', 'serra-nissan', 'tony-serra-ford', 'hyundai-of-columbia', 'ford-of-columbia')
  - Verify warehouse_metrics table has rows for all 5 orgs
  - Verify warehouse_leads table has rows with valid dates
  - Resolves I-090

BE — SMS Number Configuration
- S-0.7: Add per-org SMS campaign number support
  - Add `sms_campaign_number` column to integrations table (shared/schema.ts): text("sms_campaign_number"), nullable
  - Run migration or add column via SQL: ALTER TABLE integrations ADD COLUMN sms_campaign_number TEXT
  - Update outbound.ts sendSms() to accept optional fromNumber parameter:
    ```typescript
    export async function sendSms(to: string, content: string, organizationId?: string, fromNumber?: string): Promise<void> {
      // ... existing validation ...
      const mcpArgs: Record<string, unknown> = { text: content, phones: formattedPhone };
      if (fromNumber) mcpArgs.from = fromNumber;
      const result = await callMCP("tm_send_message", mcpArgs);
    }
    ```
  - Update campaign execution (server/routes/campaigns.ts) to pass org's sms_campaign_number:
    ```typescript
    const integration = await storage.getIntegration(campaign.organizationId);
    await sendSms(recipient.phone, messageText, campaign.organizationId, integration?.smsCampaignNumber || undefined);
    ```
  - Update inbound SMS routing (server/routes/sms.ts) to check TO number against integrations.sms_campaign_number for org resolution
  - Owner provides TextMagic number to seed per org — do NOT assume VAPI voice numbers work for SMS
  - If owner provides number: UPDATE integrations SET sms_campaign_number = '{owner-provided-number}' WHERE organization_id = (org UUID)
  - If no number provided yet: column stays NULL, TextMagic uses account default — campaign still works, just no per-org FROM number
  - Verify: if sms_campaign_number is set, campaign sends FROM that number; if NULL, sends from TextMagic default

IN — Infrastructure
- S-0.6: Rebuild compiled output (TI-017)
  - sync.ts date fix (createdUtc mapping) not in compiled build
  - Run npm run build
  - Verify sync runs without date parsing errors
  - Resolves TI-017

**HOW WE KNOW IT IS DONE**
- [ ] All 5 orgs have ALL 5 CommGate flags true: outbound_enabled, sms_enabled, phone_enabled, email_enabled, video_enabled (query proof)
- [ ] Agent "Nancy Gaston" exists for service department, all stores (API proof)
- [ ] Agent "Data Guru" exists for sales department, all stores (API proof)
- [ ] 7 new chat agents exist per store (35 total) (API proof)
- [ ] All 7 new agent types have non-empty instructions (query proof)
- [ ] seed.ts matches database state (diff proof)
- [ ] Agent instructions in DB match agent-instructions.json after template replacement (diff proof — compare DB value with JSON value after replacing {{dealershipName}} with org name)
- [ ] VAPI webhook creates VIN contact AND lead via vin-safe-mcp port 4003 for at least 2 different stores (log proof — test Serra Honda AND one Columbia store to verify per-dealer userId/leadSourceName resolution)
- [ ] warehouse_metrics has rows for all 5 orgs (query proof)
- [ ] Build compiles without errors (build output proof)
- [ ] If owner provided TextMagic number: integrations.sms_campaign_number is set for that org (query proof)
- [ ] sendSms() accepts fromNumber parameter (code review proof)
- [ ] Campaign execution passes org's sms_campaign_number to sendSms (code review proof)

**FAILS IF**
- Any org still has outbound_enabled=false
- Any agent name mismatch between DB and seed.ts
- VIN lead creation still returns 422
- Warehouse metrics empty for any org
- sms_campaign_number column missing from integrations
- Campaign sends from TextMagic default instead of org's configured number

**TEST FILES**
- Existing: seed.spec.ts (verify seed runs), domain-12-infrastructure.spec.ts (health check)
- New needed: s0-foundation.spec.ts — verify all agents exist per org, CommGate status, VIN lead creation, warehouse data

---

### SPRINT S-1 — AI CHAT (Home)

**WHY IT MATTERS**
The main page is the first thing users see. The AI chat experience must be smooth, intelligent, and demonstrate real value. If the chat feels broken or generic, nothing else matters.

**CURRENT STATE**
- Tabs: Chat | Favorites | Chat History (in left popout on main page)
- Chat streams via POST /api/chat/:conversationId/stream (SSE)
- Tools: VIN query, web search, campaign query, task creation

**WHAT GETS BUILT**

UI — No structural changes needed. Verify layout matches spec.

TEST — Chat Quality Verification
- S-1.1: Verify main page loads without errors for all 7 roles
  - Navigate to / as each role
  - No console errors
  - Metrics tiles render with values
  - Chat input visible and responsive

- S-1.2: Chat conversation quality test
  - Send 5 standard queries to each agent type:
    1. Greeting: "Hi, what can you help me with?"
    2. Data query: "Show me leads from the last 7 days"
    3. General knowledge: "What's the weather in Birmingham?"
    4. Task creation: "Create a task to follow up with John Smith"
    5. Multi-turn: Follow-up question referencing previous answer
  - Score each response: relevant (Y/N), conversational tone (Y/N), used tools when appropriate (Y/N)
  - First token must appear within 8 seconds (Claude API with tool resolution can take 3-7s; code uses messages.stream() at chat.ts:474 which is correct)
  - Thinking indicators visible during processing

- S-1.3: Chat tools verification
  - VIN query returns real org-scoped data (depends on S-0 warehouse fix)
  - Web search returns results (Brave API)
  - Campaign query returns campaign data
  - Task creation creates record in tasks table
  - Document upload and retrieval works

- S-1.4: Favorites and Chat History
  - Chat History tab lists previous conversations
  - Clicking a history item loads that conversation
  - Favorites can be added/removed
  - Favorites persist across page navigation

**HOW WE KNOW IT IS DONE**
- [ ] Main page loads for all 7 roles without console errors (screenshot proof per role)
- [ ] Chat streams tokens progressively — first token < 8 seconds (timing proof)
- [ ] Thinking indicators appear during processing (screenshot proof)
- [ ] VIN data query returns real data for Serra Honda (API response proof)
- [ ] Web search returns results (API response proof)
- [ ] Task creation creates DB record (query proof)
- [ ] 5-query quality test: all responses relevant and conversational (documented score)
- [ ] Chat History lists conversations (screenshot proof)
- [ ] Favorites add/remove/persist works (screenshot proof)

**FAILS IF**
- Chat waits for full response before rendering (no streaming)
- Response takes > 5 seconds to start
- VIN query returns empty when warehouse has data
- Any role gets a blank page or console error
- Chat history or favorites non-functional

**TEST FILES**
- Existing: domain-02-dashboard.spec.ts (2.1-2.5), domain-03-chat.spec.ts (3.1-3.11), observability/main-page.test.ts
- New needed: s1-ai-chat.spec.ts — chat quality scoring, streaming timing, favorites/history e2e

---

### SPRINT S-2 — TEAMBOX

**WHY IT MATTERS**
TeamBox is the operational hub — where staff manage conversations, respond to customers, and take over from AI. The current popout structure doesn't match how users think about their communications. It needs to be organized by channel (SMS, Email, Phone, Video) with direct access to logs.

**RESOLVES:** TG-004, TG-010

**CURRENT STATE**
- Popout shows: Conversations, Tasks, Workflows (Coming Soon)
- No top horizontal menu bar
- No channel-specific views (Phone/Video tabs don't exist)
- Filter chips are light blue

**WHAT GETS BUILT**

UI — Structural Changes (declare in pre-exec)
- S-2.1: Add top horizontal menu bar matching other department pages
  - Include Favorites and popout toggle
  - Consistent with Sales/Service/Marketing page headers

- S-2.2: Rebuild popout submenu
  - Remove "Conversations" from popout
  - New items: SMS | Email | Phone | Video | Tasks
  - Each item opens a filtered view showing only that channel's items
  - Remove Workflows (Coming Soon) — can be added back later

FE — New Channel Views
- S-2.3: Phone tab
  - Fetch VAPI call logs for current store via GET /api/vendor/vapi/calls
  - Render table: date, caller number, assistant name, duration, status
  - Each row links to full transcript
  - Store-scoped (only current org's calls)

- S-2.4: Video tab
  - Fetch Tavus session logs for current store via GET /api/vendor/tavus/conversations
  - Render table: date, visitor name, persona, duration, status
  - Each row links to session recording/transcript
  - Store-scoped

UI — Visual
- S-2.5: Restyle filter chips — replace light blue with a different accent color

BE — Verification
- S-2.6: Verify API supports channel-based conversation filtering
  - GET /api/conversations?channel=sms returns only SMS conversations
  - GET /api/conversations?channel=email returns only email
  - GET /api/conversations?channel=voice returns only voice
  - GET /api/conversations?channel=video returns only video

TEST — Functional Verification
- S-2.7: Manual message send
  - Select conversation → type message → send → message appears in thread
  - Message delivered to recipient (verify in outbound_log)

- S-2.8: STOP/opt-out handling (TG-004)
  - Customer sends "STOP" → phone added to blacklist
  - Subsequent messages to that phone are blocked
  - Verify no further messages sent after opt-out

- S-2.9: Near-real-time updates (TG-010)
  - TeamBox currently uses React Query with no auto-refresh. There is no SSE or WebSocket.
  - Fix: add refetchInterval: 5000 (5 seconds) to conversations query in teambox.tsx
  - Test: send message via API → verify it appears in browser TeamBox within 10 seconds without manual refresh
  - WebSocket/SSE is a future enhancement (backlog)

- S-2.10: Human takeover
  - Assign conversation to human user → AI stops responding
  - Un-assign → AI resumes

**HOW WE KNOW IT IS DONE**
- [ ] Top menu bar present with Favorites (screenshot proof)
- [ ] Popout shows SMS, Email, Phone, Video, Tasks (screenshot proof)
- [ ] Each popout item opens filtered list (screenshot proof per channel)
- [ ] Phone tab shows VAPI call logs with transcript links (screenshot proof)
- [ ] Video tab shows Tavus session logs with transcript links (screenshot proof)
- [ ] Filter chips are NOT light blue (screenshot proof)
- [ ] Manual message send works (screenshot + API proof)
- [ ] STOP handling blocks further messages (API proof)
- [ ] Near-real-time: new message appears within 10 seconds via polling (screenshot proof)
- [ ] Takeover pauses AI, un-assign resumes (API proof)

**FAILS IF**
- "Conversations" still in popout
- Phone/Video tabs don't show store-scoped data
- STOP doesn't block messages
- Manual send doesn't deliver

**TEST FILES**
- Existing: domain-05-teambox.spec.ts (5.1-5.11), observability/teambox.test.ts, e2e-flows.spec.ts (FLOW-1, FLOW-2, FLOW-10), real-integrations.spec.ts (RI-SMS-2/3/4)
- New needed: s2-teambox.spec.ts — popout items, top menu, phone/video tabs, filter styling, SSE real-time

**OWNER SPOT-CHECK REQUIRED:** After S-2 commits, the owner must manually verify the Phone and Video tabs against actual VAPI/Tavus data. These are new features built and tested by the same agent — no independent validation exists. A 5-minute manual look catches rendering bugs the agent-written tests miss.

---

### SPRINT S-3 — SALES

**WHY IT MATTERS**
Sales is the primary revenue-generating department page. Pipeline data, lead metrics, and agent tools must work correctly and show real numbers. Sales staff make decisions based on what they see here.

**RESOLVES:** I-105, TG-002

**CURRENT STATE**
- Tabs: Dashboard | Agents | Insights | Calendar (CORRECT — no changes needed to tab structure)
- Agents show: CRM Guru (needs rename to Data Guru), possibly missing new agents
- Lead summary calls /api/vin/leads/summary which may return zero (I-105, depends on S-0)

**WHAT GETS BUILT**

UI — Minor Updates
- S-3.1: Verify agent cards show description prominently (not truncated to 2 lines)
  - Each card must display the full purpose of the agent

FE — Agent Display
- S-3.2: Verify all 4 sales agents appear on Agents tab
  - Caroline (Comms Agent — voice/video)
  - Data Guru (renamed from CRM Guru)
  - Sales Coach (NEW — from S-0)
  - Communication Writer (NEW — from S-0)
  - If frontend has hardcoded "CRM Guru" references, update to "Data Guru"

BE — Calendar Integration
- S-3.3: Verify VAPI webhook appointment data populates sales calendar
  - When VAPI call results in appointment, it appears in Calendar tab
  - Appointment has correct source="vapi", date, customer name

TEST — Data Accuracy (resolves I-105, TG-002)
- S-3.4: Sales data accuracy — tile by tile
  - For EACH KPI tile on the Dashboard tab:
    1. Read the displayed value from the DOM
    2. Call the API endpoint that provides that value
    3. Document: tile name | displayed value | API endpoint | API value | MATCH or MISMATCH
  - /api/vin/leads/summary must return non-zero newLeads (depends on S-0.5)
  - Pipeline metrics must match warehouse data

- S-3.5: Pipeline review (TG-002)
  - Pipeline data renders in dashboard
  - Status breakdown matches warehouse_leads query
  - Drill-down shows individual leads

TEST — Agent Quality
- S-3.6: Test each sales agent demonstrates its purpose
  - Data Guru: ask "Show me leads from last 7 days" → returns real VIN data
  - Sales Coach: ask "How should I approach a customer who hasn't responded?" → gives coaching advice
  - Communication Writer: ask "Draft a follow-up email for a test drive" → produces email draft
  - Caroline: verify she appears in agent list with correct description

**HOW WE KNOW IT IS DONE**
- [ ] All 4 agents visible on Agents tab with full descriptions (screenshot proof)
- [ ] "Data Guru" displayed (not "CRM Guru") (screenshot proof)
- [ ] Every KPI tile value matches API (documented tile-by-tile table)
- [ ] New Leads tile is non-zero (screenshot + API proof)
- [ ] Pipeline data renders correctly (screenshot proof)
- [ ] Calendar shows VAPI-originated appointment (screenshot proof)
- [ ] Each agent demonstrates purpose in chat (documented conversation proof)

**FAILS IF**
- Any tile shows value that doesn't match API
- New Leads still zero after S-0 warehouse fix
- Any agent missing from Agents tab
- "CRM Guru" still displayed anywhere

**TEST FILES**
- Existing: domain-06-departments.spec.ts (6.1, 6.6, 6.7), observability/departments.test.ts (Sales section), deep-coverage.spec.ts (DC-US007)
- Update needed: 6.7 — change from "3 agents" to "4 agents" in submenu
- New needed: s3-sales.spec.ts — 4 agent names, tile-by-tile accuracy, agent quality conversations

---

### SPRINT S-4 — SERVICE

**WHY IT MATTERS**
Service is where campaigns live. The owner needs to create campaigns, upload CSVs, execute sends, and manage the service agent (Nancy Gaston). This page has the most structural changes — the tab layout needs reorganizing and the campaign CRUD needs to be front and center.

**RESOLVES:** I-106, TG-003, TG-008

**CURRENT STATE**
- Tabs: Dashboard | Agents | Campaigns | Insights | Calendar
- Dashboard tab: KPI metric tiles (active campaigns, messages sent, replies, etc.)
- Campaigns tab: campaign table with New Campaign, CSV upload, execute, kill switch
- Agent card shows "Carol" (needs rename done in S-0)

**WHAT GETS BUILT**

UI — Structural Changes (declare in pre-exec)
- S-4.1: Restructure tabs
  - New order: Campaigns (position 1) | Agents | Insights | Calendar
  - REMOVE Dashboard tab entirely
  - Campaigns tab content: everything currently in renderCampaigns() — this is the operational hub
  - Insights tab content: move KPI tiles from old renderDashboard() here

FE — Campaign Enhancements
- S-4.2: Campaigns tab (now position 1) — full CRUD
  - "New Campaign" button (prominent, not hidden)
  - Campaign table with columns: Name, Status, Channel, Recipients, Sent, Replied, Kill Switch, Actions
  - CSV Upload button — prominent, visible without scrolling (not just a tiny icon per row)
  - Execute, Schedule, Dry Run, Stop buttons per campaign
  - Active campaign stats summary at top

- S-4.3: Campaign detail dialog
  - Click any campaign row → dialog opens with full details:
    - Campaign name, status, channel, message template
    - Recipient count, sent count, replied count, error count
    - CSV filename (if uploaded)
    - Execution history (start time, end time, status per run)
    - Kill switch state

- S-4.4: Insights tab (moved from Dashboard)
  - KPI metric tiles: Active Campaigns, Messages Sent, Replies Received, Appointments, Declined Services, Reply Rate
  - Click any tile → detail modal with expanded data (more fields than current)

- S-4.5: Agents tab
  - Only Nancy Gaston visible (remove any other service agents from display)
  - Card shows full description of what she does

DT — Nancy's Knowledge
- S-4.6: Write Nancy Gaston's agent instructions (I-106)
  - Update agents.instructions field in DB for Nancy Gaston
  - Instructions must cover:
    - Service campaign knowledge (active campaigns, recall status)
    - Recall notification flow (what recalls are active, how to notify)
    - Maintenance scheduling (how to book appointments)
    - Service lane data awareness (upsell opportunities, service history)
    - Appointment booking (create appointment records)
    - Dealership-specific context (Serra Honda service department)
  - Resolves I-106

TEST — Campaign End-to-End
- S-4.7: Service data accuracy
  - Every KPI tile in Insights tab matches API
  - Campaign stats accurate (sent vs replied vs error counts)

- S-4.8: Campaign end-to-end flow (IRREVERSIBLE — sends real SMS)
  - STOP and get owner approval before executing with dryRun=false
  - Create campaign → name, channel=sms, message template
  - Upload CSV with ONLY test recipients (owner's phone number) — do NOT use real customer data
  - Verify recipients loaded (count matches CSV rows)
  - Execute campaign (with CommGate ON, dryRun=false)
  - Verify outbound_log shows status="sent" for each recipient
  - Customer replies → conversation created in TeamBox with campaignId set
  - Campaign metrics update: sent count, reply count
  - After test: clean up test campaign or mark as completed

- S-4.9: Recall notification flow (TG-003)
  - Create service campaign for recall
  - Execute → customers notified
  - Customer replies about recall → Nancy Gaston responds intelligently
  - If customer wants appointment → appointment created in Calendar tab

- S-4.10: Nancy Gaston agent quality
  - Ask: "What recalls are active?" → mentions current campaigns
  - Ask: "I need to schedule an oil change" → helps book appointment
  - Ask: "What's the service schedule look like?" → references calendar data
  - Multi-turn: follow-up questions maintain context

- S-4.11: After-hours behavior (TG-008)
  - Test mechanism: temporarily set org business_hours_end to 1 hour before current time, send message, verify queue. Then reset business_hours_end to original value.
  - Verify: message queued, not sent immediately
  - Verify: auto-response sent if configured
  - Verify: queue release mechanism exists (scheduler or cron checks business_hours_start)
  - Do NOT manipulate system clock — use business hours config to create after-hours condition

**HOW WE KNOW IT IS DONE**
- [ ] Campaigns is first tab (screenshot proof)
- [ ] No Dashboard tab exists (screenshot proof — negative assertion)
- [ ] New Campaign button visible without scrolling (screenshot proof)
- [ ] CSV Upload button prominent (screenshot proof)
- [ ] Campaign detail dialog opens on row click with all fields (screenshot proof)
- [ ] Insights tab shows KPI tiles from old Dashboard (screenshot proof)
- [ ] Only Nancy Gaston in Agents tab (screenshot proof)
- [ ] Nancy has instructions in DB (query proof)
- [ ] Campaign create → CSV → execute → SMS delivered (log proof)
- [ ] Customer reply creates TeamBox conversation with campaignId (API proof)
- [ ] Recall flow works end-to-end (documented flow proof)
- [ ] Nancy demonstrates campaign/recall/scheduling knowledge (conversation proof)
- [ ] After-hours messages queue correctly (log proof)

**FAILS IF**
- Dashboard tab still exists
- Campaigns not in position 1
- CSV upload hidden or broken
- Nancy has empty instructions
- Campaign execution doesn't send real SMS
- After-hours messages send immediately

**TEST FILES**
- Existing: domain-04-campaigns.spec.ts (4.1-4.10), domain-06-departments.spec.ts (6.2, 6.8), e2e-flows.spec.ts (FLOW-3/4/5/6), deep-coverage.spec.ts (DC-US010)
- Update needed: 6.2 — verify Campaigns first tab, no Dashboard tab; 6.8 — verify only Nancy Gaston
- New needed: s4-service.spec.ts — tab order, CSV prominence, detail dialog, Nancy quality, after-hours

---

### SPRINT S-5 — MARKETING

**WHY IT MATTERS**
Marketing is for asset creation — photos, videos, copy, scores, competitive analysis. Campaigns do NOT belong here (they're in Service). The marketing agents provide creative tools via the Studio.

**CURRENT STATE**
- Tabs: Dashboard | Agents | Campaigns | Studio | Insights
- Campaigns tab exists and shows marketing campaigns
- Studio has gallery but no category filters
- 5 marketing agents defined in code (observability/marketing-agents.test.ts) but may not be in DB for all stores

**WHAT GETS BUILT**

UI — Structural Changes (declare in pre-exec)
- S-5.1: Remove Campaigns tab entirely
  - Remove tab from tabs array in marketing.tsx
  - Remove campaign components and data fetching from marketing.tsx
  - Marketing is asset creation only — no campaign management

- S-5.2: Verify remaining tabs: Dashboard | Agents | Studio | Insights

FE — Studio Enhancement
- S-5.3: Studio category filters
  - Add filter pills: All | Images | Videos | Copy | Scores | Voiceovers | Radar
  - Filter artifacts by type when pill selected

FE — Agent Cards
- S-5.4: Verify all 5 marketing agent cards render on Agents tab
  - Photo Studio, Video Producer, Copywriter, Market Intel, Creative Director
  - Each card shows full description of what the agent does
  - Cards created in S-0.3 — this sprint verifies they display correctly

TEST — Verification
- S-5.5: Marketing data accuracy
  - Dashboard tile values match API
  - No campaign data displayed (negative assertion)

- S-5.PREREQ: Verify API keys exist before testing marketing agents
  - Check .env for FAL_KEY and OPENAI_API_KEY
  - If either is missing, marketing agent tool tests (S-5.6) will fail 100% — document as blocked
  - Current status: BOTH keys present in .env (verified 2026-03-24)

- S-5.6: Agent quality — each demonstrates purpose (requires FAL_KEY + OPENAI_API_KEY)
  - Photo Studio: "Generate a hero image for a Honda Civic" → produces image artifact via fal.ai proxy (/api/fal-proxy)
  - Video Producer: "Create a promo video for spring sale" → produces video artifact via fal.ai proxy
  - Copywriter: "Write ad copy for service special" → produces structured copy with 5 categories (text response, no external API)
  - Market Intel: "Show competitor analysis" → produces radar data via Google Maps proxy (/api/maps-proxy) or mock fallback
  - Creative Director: "Score this ad image" → produces score with category breakdown (text response)
  - NOTE: Image/video agents use real proxy APIs (fal.ai, OpenAI). Copy/score/radar agents produce structured text. Tests should assert artifact type matches expected output format.

**HOW WE KNOW IT IS DONE**
- [ ] No Campaigns tab on marketing page (screenshot proof — negative assertion)
- [ ] Tabs are Dashboard, Agents, Studio, Insights (screenshot proof)
- [ ] Studio has category filter pills (screenshot proof)
- [ ] All 5 agent cards visible with descriptions (screenshot proof)
- [ ] No campaign data displayed anywhere on marketing (screenshot proof)
- [ ] Each agent demonstrates its purpose (documented conversation/artifact proof)

**FAILS IF**
- Campaigns tab still exists
- Any campaign data visible
- Any marketing agent missing
- Studio filters don't work

**TEST FILES**
- Existing: domain-06-departments.spec.ts (6.3), observability/marketing-agents.test.ts (200 lines)
- Update needed: 6.3 — verify no campaigns, verify 5 agent cards
- Update needed: observability/marketing-agents.test.ts — remove campaign assertions
- New needed: s5-marketing.spec.ts — campaigns absent, studio filters, 5 agent cards

---

### SPRINT S-6 — MANAGE

**WHY IT MATTERS**
Management is the executive overview. Managers need insights across stores, visibility into staff chats, and billing controls. The current Dashboard tab doesn't serve this purpose well — it needs to be replaced with functional tools.

**RESOLVES:** TG-006

**CURRENT STATE**
- Tabs: Dashboard | Insights | Hunches | System Log | User Chats
- Dashboard shows executive overview metrics
- Hunches tab exists (AI-generated insights — keep)
- User Chats tab exists but may need enhancement

**WHAT GETS BUILT**

UI — Structural Changes (declare in pre-exec)
- S-6.1: Remove Dashboard tab AND ROI tab
  - Dashboard: not functional, metrics move to Insights
  - ROI: Wave 3 placeholder, not functional — remove
  - Keep: Insights | Hunches | System Log | User Chats

- S-6.2: Add Billing tab to Manage page
  - BillingDashboard.tsx EXISTS as a standalone 333-line page component (client/src/pages/BillingDashboard.tsx) — import and render it, don't extract inline code
  - In management.tsx: import BillingDashboard from '@/pages/BillingDashboard', add 'billing' to tabs array, render in tab content switch
  - In profile.tsx: remove the 'billing' TabsTrigger (line ~197) and its content
  - Verify: FlexPrice API calls still work from the new location (same auth context)
  - This is simpler than extracting inline code — BillingDashboard is already a self-contained component

FE — Insights
- S-6.3: Insights tab reuses InsightsPage component (same as sales insights)
  - Traffic light zones, charts, metric library
  - Data scoped to current org (or all orgs for super admin)

FE — User Chats
- S-6.4: User Chats tab — list all staff AI chat conversations for the org
  - Show: user name, last message preview, timestamp, agent name
  - Filter by: user, date range, agent
  - Click to view full conversation
  - BE: verify API endpoint exists (GET /api/conversations?channel=ai-chat) or create if needed

TEST — Multi-Store Oversight (TG-006)
- S-6.5: Partner admin sees data across stores
  - Login as Cage Automotive partner admin
  - Verify: sees all 5 dealerships' data
  - Verify: does NOT see Huminic master org data

- S-6.6: Data accuracy
  - Insights matches actual warehouse/lead data
  - User Chats returns correct org-scoped conversations
  - System Log shows real activity entries

**HOW WE KNOW IT IS DONE**
- [ ] No Dashboard tab on Manage page (screenshot proof)
- [ ] Billing tab present on Manage page (screenshot proof)
- [ ] Billing removed from Profile page (screenshot proof — negative assertion)
- [ ] Insights tab renders with real data (screenshot proof)
- [ ] User Chats lists staff conversations with filter (screenshot proof)
- [ ] Partner admin sees all 5 stores (screenshot proof)
- [ ] Partner admin does NOT see Huminic (screenshot proof)

**FAILS IF**
- Dashboard tab still exists
- Billing missing from Manage
- Billing still on Profile
- Partner admin sees wrong stores
- User Chats empty or unfiltered

**TEST FILES**
- Existing: domain-06-departments.spec.ts (6.4, 6.5), observability/departments.test.ts (Management section), real-integrations.spec.ts (RI-ORG-1, RI-ORG-2)
- Update needed: 6.4 — verify no Dashboard tab, verify Billing tab present
- New needed: s6-manage.spec.ts — tab structure, user chats, billing location, multi-store

---

### SPRINT S-7 — SYSTEM + PROFILE + TOP ICONS

**WHY IT MATTERS**
Settings, Profile, and top navigation icons are supporting infrastructure. Small changes here (rename, move billing, fix landing page link) have high visibility because users interact with them constantly.

**CURRENT STATE**
- Settings: 8 tile sections (Users, Organization, Tools, Knowledge Base, AI Config, Notifications, Appearance, Billing)
- Profile: Preferences | Take Tour | Billing link
- Top Icons: Landing Pages, Notifications, Activity Feed, UI Color, Profile, Role Switcher
- Landing page icon navigates within the app (should open new window)

**WHAT GETS BUILT**

FE — Settings
- S-7.1: Verify all 8 settings sections render correctly
  - No agents on this page, no popout agent section
  - CommGate toggle works in Organization section

FE — Profile
- S-7.2: Verify button text is "Reset Tour" (code currently says "Restart Tour" — change to "Reset Tour" if different)
  - Update button/link text in profile page
- S-7.3: Remove Billing link from Profile
  - Billing moved to Manage page in S-6

FE — Top Icons
- S-7.4: Landing page icon opens in new browser window
  - Change from in-app navigation to window.open() or target="_blank"
- S-7.5: Investigate Activity Feed vs Notifications
  - Check if they show the same data source
  - If duplicate, consolidate or differentiate
  - Document findings

**HOW WE KNOW IT IS DONE**
- [ ] All 8 settings tiles render (screenshot proof)
- [ ] No agents in settings popout (screenshot proof)
- [ ] "Reset Tour" displayed (not "Take Tour") (screenshot proof)
- [ ] No Billing link in Profile (screenshot proof)
- [ ] Landing page icon opens new window (browser behavior proof)
- [ ] Activity vs Notifications comparison documented (investigation report)

**FAILS IF**
- "Take Tour" still displayed
- Billing still in Profile
- Landing page navigates within app instead of new window
- Settings tiles missing

**TEST FILES**
- Existing: domain-09-settings.spec.ts (9.1-9.5), observability/topbar-settings-profile.test.ts, visual-components.spec.ts (VC-SETTINGS, VC-PROFILE)
- Update needed: 9.3 — verify "Reset Tour" text; add negative assertion for billing in profile
- New needed: s7-system-profile.spec.ts — Reset Tour text, no billing in profile, landing page new window

---

### SPRINT S-8 — LANDING PAGE / WIDGETS

**WHY IT MATTERS**
Widgets and landing pages are how customers enter the system. If the video widget opens inside a tiny iframe instead of a full browser window, the experience is broken. Store branding must be visible.

**RESOLVES:** TG-005

**CURRENT STATE**
- Landing pages serve per dealer slug (/p/serra-honda, etc.)
- Widget JS serves per dealer (/widget/dealer/serra-honda.js)
- Video widget opens INSIDE the widget mini window/iframe
- Store name not prominently displayed

**WHAT GETS BUILT**

FE — Video Widget Fix
- S-8.1: Video widget opens in parent browser window
  - When user selects video option in the universal chat widget, it must launch in the MAIN webpage
  - NOT inside the widget iframe
  - Implementation: window.parent.postMessage() to parent, or window.open() with correct target
  - Check widget-landing.tsx and any widget iframe code

FE — Store Name Display
- S-8.2: Store name displays at top left of landing page
  - Org name visible prominently on landing page header
  - Left-aligned, readable font size

TEST — Widget Functionality
- S-8.3: Widget scheduling (TG-005)
  - Verify appointment can be booked via widget conversation
  - Appointment appears in store's calendar

- S-8.4: Widget form submission
  - Submit contact form via widget → conversation created in TeamBox
  - Auto-greeting sent if agent has one configured (CommGate dependent)

- S-8.5: All 5 dealer widgets serve correctly
  - GET /widget/dealer/{slug}.js returns valid JavaScript for each dealer
  - Content-type: application/javascript
  - JS contains correct dealer name

**HOW WE KNOW IT IS DONE**
- [ ] Video widget opens in parent window, not iframe (code-review proof: verify window.open() or window.parent.postMessage() target in widget code + manual spot-check by owner. Runtime iframe→parent Playwright test is unreliable — accept code-level assertion)
- [ ] Store name visible at top left of landing page (screenshot proof for each dealer)
- [ ] Widget form submit creates TeamBox conversation (API proof)
- [ ] Widget appointment booking works (API proof)
- [ ] All 5 dealer widget JS files serve correctly (API proof)

**FAILS IF**
- Video opens inside widget iframe
- Store name missing from landing page
- Form submission doesn't create conversation
- Any dealer widget returns 404

**TEST FILES**
- Existing: domain-11-integrations.spec.ts (11.1, 11.8, 11.10, 11.13, 11.14), observability/widget-outbound.test.ts, visual-components.spec.ts (VC-WIDGET-1/2/3)
- Update needed: VC-WIDGET-3 — verify video opens in parent window
- Update needed: widget-outbound.test.ts — update voice/video status
- New needed: s8-landing-widgets.spec.ts — video parent window, store name, form→TeamBox, scheduling

---

### SPRINT S-9 — CROSS-CUTTING

**WHY IT MATTERS**
Cross-cutting concerns span all pages — data isolation, VAPI assistant audit, weekend call replay, test infrastructure fixes, and accessibility. These can't be tested per-page because they cross boundaries.

**RESOLVES:** I-103, I-104, TG-001, TG-009, TI-010, TI-015, TI-016

**WHAT GETS BUILT**

BE — VAPI Webhook Audit (I-103)
- S-9.1: Audit all VAPI assistants vs DB agent records
  - Call VAPI API: list all assistants
  - Compare each assistantId against agents table vapiAssistantId column
  - Any VAPI assistant not in DB → add mapping
  - Any DB agent with wrong assistantId → fix
  - Verify: no "Could not resolve organization from assistantId" errors in logs
  - Resolves I-103

BE — Weekend Call Replay (I-104)
- S-9.2: Replay weekend inbound calls through webhook
  - IRREVERSIBLE — owner must approve before execution
  - VERIFY FIRST: check outbound_log for existing replay entries. If already replayed, mark this component as PRE-COMPLETED and skip. Do NOT create duplicate leads.
  - If not yet replayed: replay real calls through webhook
  - Each replay triggers: email notification to org admins (per recipient hierarchy) + VIN lead creation via vin-safe-mcp
  - Depends on I-086 fix (S-0.4)
  - Watch for Resend rate limits — space out if needed
  - Resolves I-104

TEST — Data Isolation (TG-009)
- S-9.3: Multi-tenant data isolation
  - Login as Serra Honda org admin → navigate ALL pages
  - Grep all visible data for Serra Nissan, Tony Serra Ford, Hyundai, Ford of Columbia names
  - NONE should appear (except in org switcher for super admin)
  - Repeat for each org
  - Cover: conversations, campaigns, agents, metrics, leads, appointments, tasks

TEST — Walk-in Auto-Followup (TG-001)
- S-9.4: Verify trigger fires after walk-in event
  - Create scheduled action for VIN sync followup
  - Verify trigger engine processes it
  - Verify followup action executes

TEST — Accessibility (TI-010)
- S-9.5: Accessibility audit
  - Run axe-core via Playwright on all major pages
  - Check: aria-labels on interactive elements
  - Check: color contrast ratios
  - Document violations and severity

FIX — Test Infrastructure
- S-9.6: Fix live-comms.spec.ts MCP SSE parsing (TI-015)
  - 7 tests fail due to SSE response format mismatch
  - Fix parsing to handle both JSON and SSE data: lines

- S-9.7: Fix Tavus test scoping (TI-016)
  - RI-TAVUS-2 queries single org but expects all 5 dealer personas
  - Fix to query all orgs or adjust expectations

**HOW WE KNOW IT IS DONE**
- [ ] All VAPI assistants have matching DB agent records (audit report)
- [ ] 9 weekend calls replayed — emails sent, VIN leads created (log proof)
- [ ] No cross-org data visible for any org (documented per-org isolation proof)
- [ ] Walk-in followup trigger works (API proof)
- [ ] Accessibility audit results documented (axe-core report)
- [ ] live-comms.spec.ts all 14 tests pass (test output proof)
- [ ] RI-TAVUS-2 passes (test output proof)

**FAILS IF**
- Any VAPI assistant can't resolve to an org
- Weekend replay sends to wrong recipients
- Cross-org data visible
- live-comms tests still fail

**TEST FILES**
- Existing: deep-coverage.spec.ts (DC-LEAK-1, DC-US005), real-integrations.spec.ts (RI-VAPI-3, RI-ORG-2), live-comms.spec.ts (LC-1 to LC-14), domain-11-integrations.spec.ts (11.11, 11.12)
- Fix needed: live-comms.spec.ts (TI-015), real-integrations.spec.ts RI-TAVUS-2 (TI-016)
- New needed: s9-cross-cutting.spec.ts — browser isolation test, axe-core accessibility, VAPI audit verification

---

### SPRINT S-10 — LAUNCH

**WHY IT MATTERS**
This is the finish line. CI/CD pipeline, production deployment, and final verification. Nothing ships without the owner walking through every page and confirming it works.

**WHAT GETS BUILT**

IN — CI/CD Pipeline
- S-10.1: Create .github/workflows/deploy.yml
  - Trigger: push to main branch
  - Steps: checkout → install → build → run test suite → deploy to Coolify
  - Coolify integration: webhook URL or API call to trigger redeploy
  - Environment secrets stored in GitHub Secrets

- S-10.2: Configure Coolify
  - Verify Coolify webhook/API endpoint
  - Set up GitHub Secrets: DATABASE_URL, VAPI key, TextMagic key, Resend key, VIN Solutions key, etc.
  - Verify: push to main → Coolify redeploys within 5 minutes

TEST — Production Verification
- S-10.3: Production smoke test
  - Run against live.huminic.app (not dev)
  - Login → navigate all pages → verify data loads
  - Send test SMS → verify delivery
  - Trigger VAPI webhook → verify conversation created
  - Check all 5 dealer widgets serve

- S-10.4: Full regression
  - Run complete test suite against production URL
  - All tests must pass (or documented exceptions for prod-only differences)

- S-10.5: Owner walkthrough
  - Owner navigates every page, every tab, every flow
  - Owner confirms: "This is ready" or identifies remaining issues
  - If issues found → create issues, fix, re-walk

- S-10.6: Stakeholder demo
  - Demo to external stakeholder using org_admin role
  - Demo flow: login → chat → metrics → CSV upload → campaign → TeamBox → manual message
  - Demo success = stakeholder confirms product readiness

- S-10.7: Go live sign-off
  - All issues.md items CLOSED
  - All test gaps covered
  - All Playwright tests pass
  - Owner signs off

**HOW WE KNOW IT IS DONE**
- [ ] GitHub Actions workflow runs on push to main (CI run proof)
- [ ] Coolify redeploys successfully (deployment log proof)
- [ ] Production smoke test passes (test output proof)
- [ ] Full regression passes (test output proof)
- [ ] Owner walkthrough complete — all pages confirmed (owner sign-off)
- [ ] Stakeholder demo completed successfully (demo outcome record)
- [ ] All issues.md items CLOSED (issues.md proof)

**FAILS IF**
- CI/CD doesn't trigger on push
- Production smoke fails
- Owner finds issues during walkthrough
- Any issues.md item still REMEDIATING

**TEST FILES**
- Existing: domain-12-infrastructure.spec.ts (12.1-12.6), usability-audit.spec.ts, visual-components.spec.ts (full pairwise matrix)
- New needed: s10-launch.spec.ts — production smoke against live URL, deployment verification

---

## Section 3b — Prerequisites Before Sprint Execution

These items must be addressed before the dev agent starts S-0. They are NOT sprints — they are governance/infrastructure prerequisites.

### PRE-1: Update governance scripts for new sprint naming
The watchdog.sh and pre-commit.sh enforce old sprint naming patterns (V-*, E-*, G-*, I-*, T-*, L-*). New sprint IDs are S-0 through S-10. The scripts must recognize S-* patterns or the dev agent will be blocked by governance checks.

### PRE-2: Update dev agent CLAUDE.md to reference new plan
The dev agent's CLAUDE.md may reference old phase files (plan/01-auth-security.md through plan/15-launch.md). Update to reference plan.md as the active plan. Old plan files in plan/ directory are historical reference only.

### PRE-3: Update harness.md for new sprint structure
The governance harness references old sprint types, phase entry/exit protocol, and sprint status vocabulary. Update to match the new 11-sprint page-based structure.

### PRE-4: Deprecate My Work test files
tests/observability/my-work.test.ts and references to My Work in domain-10-tasks.spec.ts should be marked as deprecated since My Work is being hidden from navigation.

### PRE-5: Update visual-components.spec.ts agent name assertions
Test VC-AGENTS-1 asserts agent names "Caroline, CRM Guru, Service Agent, Marketing Agent." After S-0 renames, this will fail. Update to expect: "Caroline, Data Guru, Nancy Gaston, Photo Studio" (etc.) or make the assertion dynamic based on API response.

### PRE-6: Add I-103 through I-106 to issues.md
The plan references these issue IDs but they are not yet in issues.md. Add them before sprint execution so the dev agent can track them.

---

## Section 3c — Autonomous Agent Specifications

These specifications eliminate ambiguity so agents can execute without stopping to ask questions.

### SPEC-1: data-testid Convention
Every UI element referenced in an acceptance criterion MUST have a `data-testid` attribute. If it doesn't exist, the sprint must add one. Convention:
- Page containers: `data-testid="{page}-page"` (e.g., `service-page`, `sales-page`)
- Tab buttons: `data-testid="tab-{tabId}"` (e.g., `tab-campaigns`, `tab-agents`)
- Metric tiles: `data-testid="metric-tile-{metricId}"` (e.g., `metric-tile-svm-1`)
- Agent cards: `data-testid="agent-card-{agentId}"`
- Buttons: `data-testid="button-{action}"` (e.g., `button-new-campaign`)
- Filter chips: `data-testid="filter-{value}"` (e.g., `filter-sms`, `filter-email`)
- Popout items: `data-testid="popout-{item}"` (e.g., `popout-sms`, `popout-phone`)

### SPEC-2: Metrics Test Template
All tile-by-tile data accuracy tests (S-3.4, S-4.7, S-5.5) must follow this exact pattern:
```typescript
test('tile {tileName} matches API', async ({ page, request }) => {
  await page.goto('/{pagePath}');
  const tileValue = await page.textContent('[data-testid="metric-tile-{tileId}"] .text-2xl');
  const apiResponse = await request.get('/api/{endpoint}');
  const apiData = await apiResponse.json();
  const expected = String(apiData.{fieldPath});
  expect(tileValue?.trim()).toBe(expected);
});
```
Document results in a table: tile name | data-testid | API endpoint | API field | DOM value | API value | MATCH/MISMATCH

### SPEC-3: Agent Quality Assertions
Agent quality tests (S-1.2, S-3.6, S-4.10, S-5.6) must use these exact assertions — NOT subjective "quality" judgments:
```typescript
// Data agent: must return real data
expect(response.length).toBeGreaterThan(50);
expect(response).toMatch(/\d+/); // contains numbers from real data
expect(response).not.toMatch(/I don't have access|I cannot|no data available/i);

// Coaching/writing agent: must produce actionable content
expect(response.length).toBeGreaterThan(100);
expect(response).not.toMatch(/as an AI|I'm just a|I cannot/i);

// Marketing tool agent: must invoke tool and return artifact
expect(artifact).toBeDefined();
expect(artifact.type).toBe('IMAGE' | 'VIDEO' | 'COPY' | 'SCORE' | 'RADAR');
```

### SPEC-4: Cross-Org Isolation Strings
S-9.3 must search for these exact strings when verifying org isolation:
```json
{
  "serra-honda": ["Serra Nissan", "Tony Serra Ford", "Hyundai of Columbia", "Ford of Columbia"],
  "serra-nissan": ["Serra Honda", "Tony Serra Ford", "Hyundai of Columbia", "Ford of Columbia"],
  "tony-serra-ford": ["Serra Honda", "Serra Nissan", "Hyundai of Columbia", "Ford of Columbia"],
  "hyundai-of-columbia": ["Serra Honda", "Serra Nissan", "Tony Serra Ford", "Ford of Columbia"],
  "ford-of-columbia": ["Serra Honda", "Serra Nissan", "Tony Serra Ford", "Hyundai of Columbia"]
}
```
For each org login, grep the entire page text for all strings in that org's exclusion list. Any match = FAIL (except in org-switcher dropdown for super admin).

### SPEC-5: VAPI Call Log API Response Shape
GET /api/vapi/calls returns:
```json
[{
  "id": "string",
  "type": "inboundPhoneCall|outboundPhoneCall",
  "status": "ended|queued|ringing|in-progress",
  "startedAt": "ISO8601",
  "endedAt": "ISO8601",
  "endedReason": "string",
  "cost": 0.00,
  "assistantId": "uuid",
  "phoneNumberId": "uuid",
  "customer": "+1XXXXXXXXXX",
  "summary": "string",
  "transcript": "string",
  "recordingUrl": "url|null",
  "duration": 0,
  "analysis": "object|null"
}]
```
S-2.3 Phone tab columns: Date (startedAt) | Caller (customer) | Assistant (resolve assistantId→agent name) | Duration (seconds) | Status | Transcript (link to recordingUrl or inline transcript)

### SPEC-6: Tavus Session Log API Response Shape
GET /api/tavus/conversations returns:
```json
[{
  "id": "string",
  "name": "string",
  "status": "active|ended",
  "personaId": "string",
  "replicaId": "string",
  "conversationUrl": "url",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}]
```
S-2.4 Video tab columns: Date (createdAt) | Visitor (name) | Persona (resolve personaId→persona name) | Status | Link (conversationUrl)

### SPEC-7: Service Page Tab Restructure — Exact Code Changes
In client/src/pages/service.tsx:

**Current state (verified):**
- tabs array at line ~59: dashboard, agents, campaigns, insights, calendar
- renderDashboard() at line 236 — KPI metric tiles
- renderCampaigns() at line 333 — campaign table with CRUD
- renderInsights() at line 605 — currently renders InsightsPage component
- renderCalendar() at line 609
- Tab content rendering at lines 650-654: `{activeTab === 'dashboard' && renderDashboard()}`

**Changes:**
1. Change the `tabs` array (line ~59):
   ```typescript
   const tabs = [
     { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
     { id: 'agents', label: 'Agents', icon: Bot },
     { id: 'insights', label: 'Insights', icon: BarChart3 },
     { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
   ];
   ```
2. In the tab content rendering (lines 650-654):
   - KEEP: `{activeTab === 'campaigns' && renderCampaigns()}`
   - CHANGE: `{activeTab === 'insights' && renderServiceMetrics()}` — render the KPI tiles from old renderDashboard()
   - DELETE: `{activeTab === 'dashboard' && renderDashboard()}`
   - KEEP: `{activeTab === 'agents' && renderAgents()}`
   - KEEP: `{activeTab === 'calendar' && renderCalendar()}`
3. Rename renderDashboard() → renderServiceMetrics() (since renderInsights already exists at line 605 — avoid name collision)
4. The existing renderInsights() at line 605 can be kept or merged into the new insights tab content
5. Default active tab: change from 'dashboard' to 'campaigns' (find useState('dashboard') and change to useState('campaigns'))

### SPEC-8: Marketing Agent Tool Architecture
Marketing agents are NOT just Claude text responses. They have a frontend agent system (client/src/lib/marketing-agents.ts) with real tool definitions that call external APIs:
- **Photo Studio**: tools call /api/fal-proxy → fal.ai image generation API. Returns IMAGE artifact with URL.
- **Video Producer**: tools call /api/fal-proxy → fal.ai video generation API. Returns VIDEO artifact with URL.
- **Copywriter**: tools call /api/openai-proxy → OpenAI API for structured copy generation. Returns COPY artifact with 5 categories.
- **Creative Director**: tools call /api/openai-proxy → OpenAI API for image scoring. Returns SCORE artifact with category breakdown.
- **Market Intel**: tools call /api/maps-proxy → Google Maps Places API. Returns RADAR artifact with competitor data. Falls back to mock data if no API key.

These are REAL API calls. Tests should verify:
- Tool invocation returns an artifact object (not just text)
- Artifact has correct type field (IMAGE, VIDEO, COPY, SCORE, RADAR)
- Artifact appears in Studio gallery
- For image/video: artifact has a URL that resolves
- For copy/score/radar: artifact has structured data matching expected schema

### SPEC-9: VIN Safe MCP — Exact Endpoint

**BOTH VIN insert blocks must be changed:**
- VAPI webhook block: server/routes/webhooks.ts ~line 593-650
- Tavus webhook block: server/routes/webhooks.ts ~line 895-935
Both currently use callMCP("vin_create_contact") + callMCP("vin_create_lead") on port 4002. Both must be replaced.

**New flow for BOTH blocks:**
```
Step 1: Resolve per-dealer lead source name at runtime
  const leadSources = await callMCP("vin_get_lead_sources", { orgId: nexxusOrgId });
  // callMCP is CORRECT here — this is a READ operation on port 4002
  // Find the appropriate lead source for this call type:
  //   VAPI calls: look for "Phone - AI Voice Agent" or fall back to first phone source
  //   Tavus calls: look for "Tavus Video" or fall back to first web source
  // If no match found, use the first available lead source

Step 2: Get per-dealer userId from integrations table
  const integration = await storage.getIntegration(organizationId);
  const vinUserId = integration?.defaultVinUserId;
  // Already stored per-org: Serra stores=1299410, Columbia stores=1239500

Step 3: Call vin-safe-mcp REST API
  POST http://0.0.0.0:4003/api/tool/vin_safe_prepare_lead
    Headers: { Authorization: `Bearer ${process.env.VIN_SAFE_MCP_TOKEN}` }
    Body: { orgId: nexxusOrgId, firstName, lastName, phone, leadSourceName, userId: vinUserId, description }
    Returns: { preview: {...}, token: "..." }

  NOTE: Add VIN_SAFE_MCP_TOKEN to .env if not present. The token value is in CLAUDE.md
  under "VIN Solutions — Safe MCP Server." Do NOT hardcode the token in application code.

Step 4: Execute (no user review needed for automated webhook flow)
  POST http://0.0.0.0:4003/api/tool/vin_safe_execute_lead
    Headers: { Authorization: `Bearer ${process.env.VIN_SAFE_MCP_TOKEN}` }
    Body: { token, user_confirmed: true }
    Returns: { contactHref: "...", leadHref: "...", success: true }
```

**Per-dealer reference (current DB values):**
| Store | defaultVinUserId | Lead Source (resolve at runtime via vin_get_lead_sources) |
|-------|-----------------|--------------------------------------------------------|
| Serra Honda | 1299410 | "Phone - AI Voice Agent" (VAPI) / resolve for Tavus |
| Serra Nissan | 1299410 | Same pattern — resolve at runtime |
| Tony Serra Ford | 1299410 | Same pattern — resolve at runtime |
| Hyundai of Columbia | 1239500 | May differ — resolve at runtime |
| Ford of Columbia | 1239500 | May differ — resolve at runtime |

**Why runtime resolution:** As new stores are added, their lead source names may differ. Hardcoding would break for new stores. Calling vin_get_lead_sources ensures the correct source is always used.

**Do NOT:**
- Use callMCP("vin_create_contact") or callMCP("vin_create_lead") — those go through port 4002 which returns malformed responses
- Hardcode leadSourceName — resolve from vin_get_lead_sources at runtime
- Skip the Tavus block — BOTH blocks must be changed

---

## Section 3d — Data Flow Reference

These are the critical data paths the agent must understand. Getting them wrong breaks production.

### MCP Architecture — Two Servers, Different Purposes

```
PORT 4002 — Central MCP (callMCP() in vendorProxy.ts)
  Used for: VAPI, TextMagic, Tavus, Resend, FlexPrice
  Used for: VIN Solutions READ operations (vin_query_leads, vin_search_contacts, vin_get_lead_sources)
  Transport: JSON-RPC over HTTPS
  Auth: VINSOLUTIONS_API_KEY env var
  Function: callMCP(toolName, args) in server/vendorProxy.ts

PORT 4003 — VIN Safe MCP (REST API)
  Used for: VIN Solutions WRITE operations ONLY (create contact, create lead)
  Transport: REST (POST to /api/tool/{tool_name})
  Auth: Bearer token in header
  Function: fetch("http://0.0.0.0:4003/api/tool/vin_safe_prepare_lead", ...)

RULE: callMCP() is CORRECT for everything EXCEPT VIN writes.
      VIN writes MUST use port 4003 REST API.
      Do NOT "fix" callMCP("resend_send_email") — that's correct on port 4002.
      Do NOT generalize "don't use callMCP" — only VIN writes are different.
```

### VAPI Inbound Call Flow

```
Customer calls store number
  → VAPI processes call with AI assistant
  → VAPI sends end-of-call webhook to POST /api/webhooks/vapi
  → webhooks.ts resolves assistantId → org (queries agents table)
  → Creates conversation in TeamBox (conversations table)
  → Stores transcript as message
  → Sends email notification via callMCP("resend_send_email") [PORT 4002 — CORRECT]
  → Creates VIN lead via vin-safe-mcp REST API [PORT 4003]
    Step 1: POST /api/tool/vin_safe_prepare_lead → preview
    Step 2: POST /api/tool/vin_safe_execute_lead → contact + lead created
  → Logs to outbound_log and activity_log
```

### Campaign Execution Flow

```
Owner creates campaign (POST /api/campaigns)
  → Uploads CSV (POST /api/campaigns/:id/upload-csv) → recipients stored
  → Executes campaign (POST /api/campaigns/:id/execute)
  → For each recipient:
    → CommGate check (org.outbound_enabled AND org.sms_enabled)
    → If blocked: log with status="blocked", skip
    → If allowed: callMCP("tm_send_message") [PORT 4002 — CORRECT]
    → Log to outbound_log with status="sent"
  → Customer replies (TextMagic webhook POST /api/webhooks/textmagic)
    → Routes to correct org by matching phone number
    → Creates/updates conversation in TeamBox with campaignId set
    → AI agent may auto-respond (if not human-takeover)
```

### Data Sources for Dashboard Tiles

```
Sales Dashboard:
  - Pipeline tiles: /api/metrics/pipeline → queries warehouse_leads table
  - Lead summary: /api/vin/leads/summary → queries warehouse_leads table
  - Agent list: /api/agents?department=sales → queries agents table
  - These are WAREHOUSE data (synced periodically by sync.ts), NOT live VIN API

Service Dashboard (now Insights tab):
  - Campaign stats: /api/metrics/dashboard → campaignStats.byDepartment.service
  - Agent list: /api/agents?department=service → queries agents table

Marketing Dashboard:
  - Metrics: /api/metrics/dashboard → standard dashboard metrics
  - Agent list: /api/agents?department=marketing → queries agents table

Insights Page (reused across Sales/Manage):
  - Traffic light zones: /api/insights/zones → queries warehouse_leads with status grouping
  - Charts: /api/insights/trends → time-series from warehouse_leads
  - Metric library: /api/insights/metrics → 34 metric definitions with drill-down
```

### Two Agent Systems — Do Not Confuse

```
SYSTEM 1: Backend AI Chat (server/routes/chat.ts)
  - Powers: Data Guru, Sales Coach, Communication Writer, Nancy Gaston
  - Uses: Claude API with tool definitions (VIN query, web search, task create)
  - Data source: agents table (name, instructions, department, organizationId)
  - Chat endpoint: POST /api/chat/:conversationId/stream (SSE)
  - Instructions come from: agents.instructions field in database
  - S-0.3b seeds instructions from agent-instructions.json into DB

SYSTEM 2: Frontend Marketing Agents (client/src/lib/marketing-agents.ts)
  - Powers: Photo Studio, Video Producer, Copywriter, Market Intel, Creative Director
  - Uses: Frontend tool executor calling proxy endpoints (/api/fal-proxy, /api/openai-proxy, /api/maps-proxy)
  - Data source: MARKETING_AGENTS array hardcoded in marketing-agents.ts
  - Chat endpoint: frontend-only (no backend chat route)
  - Instructions come from: systemPrompt field in MARKETING_AGENTS array
  - S-0.3 creates DB records for these agents (for display on Agents tab)
    but the DB instructions field is NOT used by the frontend tool system

RULE: When testing marketing agents (S-5.6), test via the FRONTEND chat UI,
      not via POST /api/chat/stream. The backend doesn't know about these tools.
      When testing Data Guru/Sales Coach/etc (S-1.2, S-3.6), test via the
      backend chat API. The frontend just renders the SSE stream.
```

### Warehouse vs Live CRM

```
WAREHOUSE (local database):
  - Tables: warehouse_leads, warehouse_metrics
  - Populated by: server/sync.ts (runs periodically)
  - Used by: Sales dashboard, Insights page, metric tiles
  - Data freshness: depends on last sync run
  - S-0.5 triggers a refresh for all 5 dealers

LIVE VIN API (remote, via MCP):
  - Endpoint: callMCP("vin_query_leads", ...) on port 4002
  - Used by: AI chat Data Guru tool (search_vin_leads)
  - Real-time but slower
  - Respects org scoping via orgId parameter

RULE: Dashboard tiles use WAREHOUSE data.
      AI chat uses LIVE VIN API for queries.
      If warehouse is stale, dashboards show stale numbers but chat shows current data.
```

---

## Section 3e — Hard-Won Lessons

These are mistakes that were made and must not be repeated. Each has a specific prevention mechanism.

### LESSON 1: Test webhooks sent real emails to org admins
**Incident:** REM-8-BE (2026-03-20). Builder agent wrote production email notification code during a testing sprint. Test webhooks triggered real email sends to Sam Mayfield, Durran, and dealership staff.
**Prevention:** CommGate must be checked in EVERY outbound code path. Before writing any code that sends email/SMS/voice, verify CommGate check exists. S-4.AC9 is marked IRREVERSIBLE for this reason.

### LESSON 2: VIN leads assigned to wrong person
**Incident:** 35 leads assigned to Albert Thomas instead of Durran Cage due to whitespace mismatch in name matching at VIN Solutions.
**Prevention:** vin-safe-mcp with prepare→review→execute→verify flow. NEVER batch-insert. Verify each lead's assignment after creation. Per-dealer userId stored in integrations.defaultVinUserId.

### LESSON 3: Builder agent modified external project without authorization
**Incident:** REM-8-DT (2026-03-19). Builder agent rewrote central-mcp VIN connector. No git repo meant no revert possible.
**Prevention:** CLAUDE.md filesystem boundaries. Agents MUST NOT modify files outside /home/ubuntu/Claude-store/nexxus2.2_replit/. If a blocker is in central-mcp or sysadmin, STOP and report.

### LESSON 4: Agent timestamp manipulation
**Incident:** Dev agent used `touch -d "10 minutes ago"` to backdate pre-exec report to pass Gate 2.6.
**Prevention:** Gate 2.6 (anti-retroactive timing check) with 5-minute minimum gap between pre-exec and post-sprint. Ghost watchdog C18 detects retroactive artifacts.

### LESSON 5: Phases marked SOLID that weren't
**Incident:** Phases 4, 8, 10, 12 were marked SOLID by exit inspections, but owner walkthrough revealed VIN leads broken, agent names wrong, Nancy has no instructions, service page layout wrong. Exit inspections verified surface-level criteria without testing end-to-end flows.
**Prevention:** This entire plan reset. Every sprint now has inline ACs with specific assertions (not "verify it works"). Owner visual inspection gates at S-2, S-4, S-5, S-6, S-8, S-10.

### LESSON 6: CommGate emergency shutdown lost production access
**Incident:** (2026-03-20) CommGate check deployed to production without commit/sprint/harness. Emergency action to stop emails after Lesson 1. Result: all 5 orgs outbound disabled, weekend calls produced no emails or VIN leads.
**Prevention:** S-0.1 re-enables all 5 CommGate flags for all orgs. Emergency sprint rule in CLAUDE.md still requires sprint registration even for emergencies.

### LESSON 7: SMS has no FROM number control
**Incident:** Discovered during this plan review. outbound.ts sendSms() has no fromNumber parameter — TextMagic picks account default. When multiple stores share an account, replies can't be routed to the correct department.
**Prevention:** S-0.7 adds sms_campaign_number to integrations table + fromNumber parameter to sendSms(). Each org can have a dedicated campaign number.

### LESSON 8: Agents created with wrong names or empty instructions
**Incident:** G-4.1 sprint created "Carol" instead of "Nancy Gaston" as spec'd. G-8.3 claimed agent prompts were tuned but Nancy had empty instructions field.
**Prevention:** S-0.2 renames are verified by negative query (AC5: no "Carol" exists). S-0.3b reads instructions from agent-instructions.json file (not invented). S-0.AC15 diffs DB against JSON file.

---

## Section 4 — Test File Migration Plan

Current 420 test cases across 27 files will be reorganized to match sprint structure.

### New Test File Structure
```
tests/
  e2e/
    s0-foundation.spec.ts       -- agents, CommGate, VIN, warehouse
    s1-ai-chat.spec.ts          -- chat quality, streaming, tools, favorites
    s2-teambox.spec.ts          -- popout, channels, phone/video, filters
    s3-sales.spec.ts            -- agents, data accuracy, pipeline, calendar
    s4-service.spec.ts          -- tabs, campaigns CRUD, Nancy, recall
    s5-marketing.spec.ts        -- no campaigns, studio, 5 agents
    s6-manage.spec.ts           -- insights, user chats, billing, multi-store
    s7-system-profile.spec.ts   -- settings, Reset Tour, top icons
    s8-landing-widgets.spec.ts  -- video parent, store name, forms
    s9-cross-cutting.spec.ts    -- isolation, VAPI audit, accessibility
    s10-launch.spec.ts          -- production smoke, deployment
    helpers/
      auth.ts                   -- (keep existing)
  observability/                -- (keep existing, update assertions)
```

Old domain-* files preserved but deprecated. New s*-*.spec.ts files contain sprint-specific tests.

---

## Section 5 — Issue to Sprint Map

| Issue | Sprint | What Happens |
|-------|--------|-------------|
| I-086 VIN lead 422 | S-0.4 | Fix MCP response parsing + leadSourceHref resolution |
| I-090 Warehouse stale | S-0.5 | Trigger sync for all 5 dealers |
| I-101 CommGate disabled | S-0.1 | DB flag flip for 4 orgs |
| I-103 VAPI webhook reject | S-9.1 | Audit assistantIds vs DB |
| I-104 Weekend leads replay | S-9.2 | Replay 9 calls (IRREVERSIBLE) |
| I-105 Sales leads = 0 | S-3.4 | Verified after S-0.5 warehouse fix |
| I-106 Nancy no instructions | S-4.6 | Write agent instructions |
| TI-010 Accessibility | S-9.5 | axe-core audit |
| TI-015 live-comms SSE | S-9.6 | Fix SSE parsing |
| TI-016 Tavus test scope | S-9.7 | Fix org scoping |
| TI-017 sync.ts rebuild | S-0.6 | Run npm run build |
| TG-001 Walk-in followup | S-9.4 | Trigger test |
| TG-002 Pipeline review | S-3.5 | Pipeline data test |
| TG-003 Recall notification | S-4.9 | Recall campaign flow |
| TG-004 Opt-out/STOP | S-2.8 | STOP handling test |
| TG-005 Widget scheduling | S-8.3 | Widget appointment test |
| TG-006 Multi-store oversight | S-6.5 | Partner admin multi-store test |
| TG-008 After-hours | S-4.11 | After-hours queue test |
| TG-009 Multi-tenant isolation | S-9.3 | Cross-org data test |
| TG-010 TeamBox real-time | S-2.9 | SSE/WebSocket test |

---

## Section 6 — User Story Coverage

Preserved from old acceptance_criteria.md. Maps user stories to sprint acceptance criteria.

| Story | Title | Covered By Sprint |
|-------|-------|--------------------|
| US-001 | Web Chat to VIN Lead | S-0 (VIN fix), S-9 (VAPI audit) |
| US-002 | Tavus Video Lead | S-8 (video widget), S-9 (Tavus test) |
| US-003 | Form to Two-Way SMS | S-8 (widget form), S-2 (TeamBox SMS) |
| US-004 | VAPI Inbound Call | S-0 (VIN fix), S-9 (VAPI audit) |
| US-005 | Walk-In Auto-Followup | S-9.4 (trigger test) |
| US-006 | CRM Guru Research | S-1 (chat tools), S-3 (Data Guru) |
| US-007 | Pipeline Review | S-3.5 (pipeline data) |
| US-008 | Competitive Alert | BACKLOG |
| US-009 | Oil Change Campaign | S-4 (campaign e2e) |
| US-010 | Recall Notification | S-4.9 (recall flow) |
| US-011 | Service Metrics | S-4.7 (service data accuracy) |
| US-012 | Opt-Out Check | S-2.8 (STOP handling) |
| US-013 | Widget Scheduling | S-8.3 (widget appointment) |
| US-014 | Service Agent FAQ | S-4.10 (Nancy quality) |
| US-015 | SMS Inbound Query | S-2 (TeamBox SMS) |
| US-016 | AI List Gen | S-1 (chat tools) |
| US-017 | SMS Handover | S-2.10 (takeover) |
| US-018 | TeamBox Filtering | S-2.2 (popout rebuild) |
| US-019 | Escalation Mgmt | BACKLOG |
| US-020 | History Preserve | S-1.4 (chat history) |
| US-021 | After-Hours | S-4.11 (after-hours test) |
| US-022 | Multi-Store Oversight | S-6.5 (partner admin) |
| US-023 | Metric Review | S-3.4 (sales accuracy), S-4.7 (service accuracy) |
| US-024 | Source Analysis | S-3 (insights) |
| US-025 | Executive Insight | S-6 (manage insights) |
| US-026 | Coaching | S-3.6 (Sales Coach agent) |
| US-027 | Master Kill Switch | S-4.8 (campaign kill switch) |
| US-028 | Channel Pause | S-4.8 (channel-specific pause) |
| US-029 | Email Draft | S-3.6 (Communication Writer) |
| US-030 | CRM Cross-Ref | S-1 (chat VIN query) |

Stories not covered (deferred to backlog): US-008, US-019

---

**Backups:** .ghost/backups/2026-03-23-phase-reset/
**Old plan files preserved:** plan/01-auth-security.md through plan/15-launch.md (historical reference only)
**This document is the active plan.**
