# Nexxus V2 — User Brain Dump (Formalized)

**Date:** 2026-02-16
**Source:** User narrative, voice-to-text, formalized for consumption
**Status:** Authoritative statement of user intent — governs all subsequent documents

---

## A. Platform Identity & Customer Goals

### A1. What Is Nexxus?

Nexxus is an AI-first platform that serves as a bridge between businesses, their data, third-party integrations, language models, and tools. It helps companies aggregate data and leverage AI to gain insights, automate processes, and improve business execution — starting with sales.

Nexxus is **not** a CRM replacement, not a marketing automation tool, and not a content development platform. It is an AI orchestration layer that brings disparate parts together so businesses can see the real benefits of what AI can do for them.

### A2. Who Is the Customer?

The business model is partner-enabled: experts in specific fields who have access to large customer groups are recruited as partners. These partners deliver AI technology to their industry segments through the Nexxus platform.

**First partner:** Duran Cage — national speaker on automotive sales and AI. He brought several auto group customers (dealerships owning multiple locations). These dealerships signed up, paid upfront, and want to take advantage of AI technology.

**Current customers:** Serra Automotive, Hyundai of Columbia (automotive dealerships).

### A3. What Problem Does It Solve?

Businesses (currently dealerships) lose not because of lead volume but because of:
- **Response gaps** — leads sit unattended, salespeople can't keep up
- **Execution failures** — no systematic follow-through on prospects
- **Data fragmentation** — information scattered across platforms with no unified view
- **Manual processes** — tasks that AI could handle are done manually or not at all

### A4. What Does Success Look Like for a Dealership?

1. No leads left behind — every prospect gets timely, intelligent attention
2. AI handles routine customer interactions (voice, video, chat) to support the sales team
3. Leadership has clear, accurate metrics for strategic and tactical decisions
4. Staff can use AI productively with appropriate guardrails and oversight
5. All key information is accessible based on role and context

### A5. What Does Success Look Like for Huminic (the Vendor)?

1. A platform that works reliably with accurate data
2. Partners can be onboarded and manage their customer organizations
3. The platform is not automotive-only — it can serve any industry where partners operate
4. Revenue through AI usage (voice, video, SMS) with healthy margins

### A6. Industry Scope

Nexxus is **not automotive-only**. The automotive-specific features exist because early adopters are in automotive. The platform is designed to serve any industry where a partner has access to customer segments. Automotive keywords and features are acceptable because they serve current customers, but the architecture should not be permanently locked to automotive.

### A7. Recurring Headaches

1. VIN Solutions API limitations — not designed for synchronization, limited data access
2. Metrics showing inaccurate numbers (too high, miscategorized)
3. Data from mixed sources not properly organized or tagged
4. Context loss between development sessions causing divergence from intent
5. Document sprawl — 25+ docs written at different times telling conflicting stories

---

## B. Main Navigation & Workflow

### B1. Main (Dashboard) — Type B Layout

**Layout:** Metrics and data in the center pane, chat window on the right side.
**Unique behavior:** Chat window opens by default on this page only. No other page auto-opens chat.

**Purpose:** Landing page showing key metrics and data. The current components are described as "a good starting point."

**Sections currently built:**
- Dealership Pulse (health gauges)
- Lead metric cards (Overdue, New, Active)
- Goal Progress widget
- Live Lead Feed
- Agent Actions
- Team Leaderboard

### B2. DealerBrain / Agents — Type C Layout

**Layout:** Chat is the main focus in the center. Right side shows artifact and configuration information about the agent.

**Automa (the Brain):** Always at the top of the agents list. Automa is a master assistant that exists in every account, has high-level understanding of the organization's context, is aware of goals, and understands the nuances of the organization and the page context where the user is working.

**Agents:** Any time an agent needs automation, triggers, analysis, or contextual specifics, it lives in this location. Agents are created by Org Admin, Partner Admin, or Super Admin and can be shared down to staff users.

### B3. Drive — Type E Layout (Library & Artifact)

**Purpose:** Each user gets a personal drive folder plus a public shared folder. Users share artifacts created in chats. Artifacts are automatically saved to Drive when created. Users should ultimately be able to share artifacts via email from this location.

### B4. Insights

**Purpose:** The intellectual store of the system. Information is aggregated, metrics are displayed, and goals are set.

**Sub-tabs:**
- **Dashboard** — AI-related metrics and communication data
- **Dealer Pulse** — VIN Solutions data aggregation (CRM-specific metrics)
- **Goals** — Goal tracking and influence on AI analysis
- **Hunches** — AI-generated suggestions
- **Reports** — Reporting

### B5. Hub (Work Center)

**Purpose:** Universal place for all customer/prospect communication, scheduling, and organization.

**Components:**
- **Email client** — Built-in using IMAP and SMTP
- **Text interaction** — SMS dialogue
- **Calendar management** — Appointment scheduling
- **Tasks** — To-do tracking
- **Approvals** — Approval workflows

### B6. Activity

**Purpose:** For Org Admins, Partner Admins, and Super Admins to observe staff activity — chat sessions, artifact creation, and system usage. Provides oversight into how staff uses AI.

### B7. Settings

**Purpose:** System configuration. Different settings available depending on RBAC role.

### B8. Profile

**Purpose:** Users change profile information and password.

---

## C. System Components

### C1. NLP Components

The system is designed to use NLP extensively for interaction and data access. Natural language is the primary interface for querying data and getting things done.

### C2. System Tools and Integrations

Third-party APIs and MCP connections that give organizations capabilities. These are assigned to organizations and can be used in agent recipes.

### C3. User Agents

Created by Org Admin, Partner Admin, or Super Admin. Shared down to staff. Used as focus points for enabling intelligent automation. Can only use internal system components and integrations assigned to their organization.

**Agent Skills:** Context, instructions, and predefined workflows applied to agents. Configured within the agent creation/modification dialogue.

### C4. System Agents

Background agents only the Super Admin (or sometimes not even they) can access. Intelligent functions that support the system itself.

### C5. Orchestration Agent

A "traffic cop" for all system component activity. Observes the system and helps get things done as events occur.

### C6. Brain / Master Agent (Automa)

An assistant that exists in every account. Has high-level organizational context awareness. Knows goals, understands organizational nuances, and is aware of the user's current page context when performing work.

### C7. Context Router

Aware of information from various sources. Tags data appropriately. Displays data as needed. Includes tagged data in queries where appropriate. Keeps data organized, avoids duplicates. Understands capabilities and weaknesses of each data source and tracks them.

### C8. Database / Data Warehouse

Supabase (PostgreSQL) serves as the data warehouse and all stores. Some stores function as extended working memory for system agents, the orchestration agent, and the brain/master agent.

---

## D. Users and RBAC

### D1. Super Admin

Currently the user (Huminic). Can create partners, directly create organizations (when no partner involved), manage master billing, and maintain the system.

### D2. Partner Admin

Has control over the organizations they bring to the company. Can see resource utilization. Can create new organizations. Can apply templates (created by Super Admin) to organizations.

### D3. Organizational Admin

Like Partner Admin, should be able to switch between organizations they're part of. **Unresolved design question:** How to handle multi-org data queries — checkbox in org selector to include multiple orgs in metrics was explored but "got messy." Current system is supposed to ask the user whether to search one entity or all entities when queries are vague, but this approach may be wrong.

### D4. Staff

Access limited to: chat components, agents shared down to them, Drive, Work Hub, and Insights. Data access limited to what they specifically have access to. Staff do NOT get direct VIN Solutions query access. Staff functionality comes through the Work Hub.

---

## E. Integrations

### E1. VIN Solutions

**Product used:** Lead Management API only.
**Key constraint:** API is limited and NOT designed for synchronization. This has been a recurring issue.

**Strategy:**
1. Query VIN data directly for metrics
2. Upload reports to backfill data that cannot be queried from VIN
3. Context Router manages data from multiple sources, treating each appropriately
4. Data warehouse concept: a local canvas to hold and work with data as needed

**Data tagging:** All incoming data was supposed to be tagged by source, and output was supposed to be labeled with source attribution.

**Critical pending work:**
- New leads from voice/video interactions should be automatically inserted into VIN Solutions
- Trigger outbound actions when leads are neglected (calls, texts, emails based on lead state)

### E2. VAPI (Voice)

One master account. Each organization has a voice assistant with its own ID, phone number, and name stored in the database.

**Current state:**
- Webhooks working — transcripts and emails sent to customers on call completion
- Prompt-based configuration within VAPI (not MCP-connected)
- V1 had MCP connectivity from VAPI to Nexxus for real-time data retrieval, but this was disconnected. Needs to be addressed before development wraps up, but can stay as-is for now.

**Critical gap:** Calls are NOT being automatically entered into VIN Solutions. Inbound transcripts should create appointments in calendars and be inserted into VIN Solutions.

**Future:** Live inventory information retrieval during calls (VIN Solutions has inventory capabilities).

### E3. Tavus (Video)

Supposed to work like VAPI. In place but widget tech may not be finished. Hosted pages needed for email campaigns with links back to video agent pages that don't exist on the customer's web server.

### E4. Text Chat

Built in V1 with LLM functionality and system access. Leads should be inserted into CRM along with chat histories.

### E5. Unified Widget

A deployable circle button for customer websites. When clicked, presents choices: text chat, voice inbound, voice outbound (we call them or they call us), or video agent prompt.

### E6. TextMagic (SMS)

Used for all outbound text messages. Same phone number. No response mechanism set up yet.

### E7. Resend (Email)

Used for all outbound emails. No response mechanism set up yet.

### E8. MCP Proxy

Server-side MCP proxy set up for third-party tool access. Uses bearer token authentication. Has connectors for Tavus and VAPI but these may not be working. A decision is needed about when and how to use it — it has not been properly integrated. Security needs audit.

---

## F. Communication Model

Three modes of communication in the system:

1. **System automation** — Automated outbound based on rules and triggers
2. **User-initiated manual** — User manually creates individual or campaign-based communication (text, email, calling)
3. **Agent-initiated** — Agents initiate communication based on automation workflows

**Current state:** No outbound communication is currently working. This includes:
- Outbound calls via VAPI for lead triggers
- Campaign-based communication
- Individual manual communication tasks

---

## G. Data Architecture & Metrics

### G1. Data Sources

Data enters from:
- VIN Solutions (query-only lead management data)
- VAPI (voice call webhooks → local logs)
- Tavus (video session webhooks → local logs)
- Text chat (user conversations)
- Manual entry
- Report uploads (backfill data VIN API can't provide)

### G2. Context Router Purpose

The Context Router:
- Knows information sources and their characteristics
- Tags data by source
- Serves appropriate data to displays and queries
- Keeps data organized, avoids duplicates
- Tracks capabilities and weaknesses of each source

### G3. Metrics Surfaces

Three metric areas:
1. **Main Dashboard** — Landing page metrics (health scores, lead cards, goal progress, lead feed, agent actions, leaderboard)
2. **Insights > Dashboard** — AI-related metrics and communication
3. **Insights > Dealer Pulse** — VIN Solutions CRM data aggregation

### G4. Metric Accuracy Problem

Numbers have been inaccurate. Too high or miscategorized. Root causes:
- Wrong categorization of data sources (excel uploads counted as VIN imports)
- Data not organized well on the customer side
- Querying and aggregation logic errors

### G5. Goal-Driven Analysis

Goal setting should influence AI analysis. Everyone should be driving toward the same goals. Goals are the "center of orbit" for the system's intelligence.

---

## H. UI Layout Types

Five layout types exist:

| Type | Description | Used By |
|------|-------------|---------|
| A | Chat-only window | — |
| B | Information display (center) + side chat (right) | Main Dashboard |
| C | Chat display (center) + side information (right) | Agents/DealerBrain |
| D | System settings (no chat) | Settings pages |
| E | Library and artifact view | Drive |

**Menu behavior:** Main sidebar with pop-out submenus. Double-arrow locks submenu open and expands all items. After certain triggers/time, defaults back to collapsed behavior.

---

## I. Known Issues (User's Perspective)

1. Metrics are inaccurate — numbers too high, wrong categories
2. VIN Solutions data strategy is not working correctly yet
3. No outbound communication is functional
4. Voice/video calls not automatically entered into VIN Solutions
5. Widget tech for Tavus may not be finished
6. MCP proxy not properly integrated
7. Multi-org query UX for Org Admins not resolved
8. Response mechanisms for SMS and email not built
9. Data from multiple sources not properly tagged and organized

---

## J. Development Stage & Priorities

**Stage:** Post-MVP, pre-production-quality. "Second wave fresh start."

**Immediate priorities (from user's goals):**
1. Metric accuracy — numbers must be correct and properly sourced
2. VIN Solutions data flow — query-only, properly tagged, properly displayed
3. Lead lifecycle — no leads left behind, triggers for neglected leads
4. Voice/video → CRM insertion — calls create records in VIN Solutions
5. Widget deployment — customers can embed on their websites
6. Outbound communication — automation, manual, and agent-initiated

**What works:**
- Platform is deployed and running
- RBAC and multi-tenant isolation functioning
- VAPI webhooks receiving calls and sending transcripts
- OAuth2 with VIN Solutions working
- DealerBrain chat with Claude API functioning
- Dealer Pulse querying VIN API live (correctly)

**What needs stabilization before new features:**
- Data accuracy and source attribution
- Context Router enablement and correct behavior
- Metric surfaces showing correct, live data

---

## User's Final Instruction

> "Take this information, rewrite it so it's a little more formal and friendly for consumption based on working together, write it to file just in terms of it being my explanation, and then diff it against what is in the SRS and then formulate a list of questions that you have that I need to clarify. Do not develop any of the final documents yet."
