# PRD — Nexxus Connect v2.2 Product Requirements Document

## 1. Problem Statement

Modern automotive dealerships face a fragmented customer communication landscape. Sales, service, and marketing departments each use different tools, resulting in:

- **Missed leads**: Slow response times (industry average: 42 minutes) lose customers to competitors who respond in under 5 minutes
- **Communication silos**: Sales doesn't know what service promised; marketing campaigns conflict with active sales conversations
- **Spam incidents**: Uncontrolled automated outbound messaging damages brand reputation and violates compliance
- **Manual overhead**: Staff spend hours on repetitive follow-ups, appointment scheduling, and lead qualification that AI could handle
- **No unified inbox**: Customer conversations across SMS, email, chat, video, and phone are scattered across 4–6 different platforms

Nexxus Connect solves these problems by providing a single AI-powered platform that unifies all customer communication channels under department-specific views with robust safety controls.

## 2. Target Users

### Primary Personas

| Persona | Role | Key Needs |
|---------|------|-----------|
| **Sales Rep** | org_staff (sales) | Pipeline visibility, lead notifications, AI-assisted follow-ups, appointment scheduling |
| **Service Advisor** | org_staff (service) | Campaign management, appointment booking, declined service follow-ups, upsell tracking |
| **Marketing Manager** | org_admin | Campaign creation/monitoring, lead generation metrics, widget analytics, landing page management |
| **Dealership GM** | org_admin | Cross-department KPIs, revenue tracking, team activity monitoring, ROI analysis |
| **Platform Admin** | super_admin | Multi-org management, system configuration, API key management, billing |

### Secondary Personas

| Persona | Description |
|---------|-------------|
| **BDC Agent** | Handles inbound/outbound customer communications across channels |
| **Partner Admin** | Manages multiple dealership organizations under a partner group |

## 3. Market Context

Nexxus Connect operates at the intersection of:

- **Dealership Management Systems (DMS)**: VinSolutions, CDK, Reynolds & Reynolds
- **Customer Communication Platforms**: CommBox, Podium, Birdeye
- **AI Assistants**: ChatGPT for business, Drift, Intercom
- **Campaign Management**: Mailchimp, TextMagic, ActiveCampaign

**Differentiator**: Nexxus Connect is the only platform purpose-built for automotive dealerships that combines AI-powered chat (text, voice, video), unified inbox (TeamBox), department-specific dashboards, and campaign management with multi-layer safety controls — all wired to dealership-specific data sources (VinSolutions inventory, service history, customer records).

## 4. Business Goals

### Primary Goals
1. **Reduce lead response time** from 42 minutes to under 2 minutes via AI-automated initial response
2. **Increase lead conversion rate** by 15–25% through AI-assisted follow-ups and never-miss automation
3. **Eliminate spam incidents** via 3-layer safety: per-conversation disconnect, per-campaign kill switch, global communication gate
4. **Unify department workflows** under a single platform with role-appropriate views

### Secondary Goals
5. Provide measurable ROI data to dealership management (cost per lead, AI vs. human performance)
6. Enable self-service campaign creation for service and marketing departments
7. Reduce BDC staffing needs by 30–40% through AI handling of routine inquiries
8. Support multi-location dealership groups under a single partner admin view

## 5. Product Vision — 4-Wave Roadmap

### Wave 1: UI Prototype & Navigation Restructure (Current)
**Theme**: Validated user experience with mock data

- Persona-based sidebar navigation (AI Chat, TeamBox, My Work, Sales, Service, Marketing, Management)
- RBAC gating via `canAccessSection()` — Marketing and Management hidden from org_staff
- TeamBox: CommBox-inspired 3-column inbox (conversation list, chat thread, customer info)
- Department dashboards with section-specific metric tiles
- Campaign management UI with kill-switch toggles
- Global communication gate in Settings → Organization
- Widget configuration with accordion layout and live preview
- Simplified landing page (`/w/demo`) with clean split layout
- Full documentation suite (CLAUDE.md, PRD.md, SRS.md, SPEC.md, PLAN.md, ACCEPTANCE_CRITERIA.md)

### Wave 2: Backend Wiring & Core Functionality
**Theme**: Real data, real auth, real-time updates

- JWT authentication with the production backend at nexxusv2.huminicdev.com
- Replace mock data with TanStack Query hooks calling 185+ existing API endpoints
- Real-time conversation updates via SSE streaming
- VinSolutions integration for inventory and lead data
- Campaign CRUD operations with database persistence
- File uploads for knowledge base and campaign CSVs

### Wave 3: Intelligence & Metering
**Theme**: Credit system and advanced analytics (must ship before Studio)

- Credit/metering system for AI usage (conversations, campaigns, video minutes)
- Advanced reporting engine with 91 metric formulas
- Hunch engine — AI-generated business insights
- Competitor intelligence features
- Usage dashboards and billing integration

### Wave 4: Studio & Advanced Features
**Theme**: Content creation and platform maturity

- Marketing Studio (video generation via Tavus, image creation, podcast tools)
- Advanced AI features (multi-agent orchestration, context-aware suggestions)
- White-label support for partner organizations
- Mobile-optimized experience
- Comprehensive E2E test suite aligned with production's 747 tests

## 6. Key Features

### 6.1 AI Chat (Home Page)
- Conversational AI assistant with configurable persona name (stored per org)
- Thinking cards showing AI reasoning (collapsible)
- Role-specific metric tiles that collapse after first interaction
- Suggestion bubbles for common queries
- Wave-dot animation during AI processing

### 6.2 TeamBox (Unified Inbox)
- 3-column layout: conversation list → chat thread → customer info
- Multi-channel support: SMS, Email, Chat, WhatsApp
- Status filters: Open, Assigned to me, Participating, Automated, Scheduled, Followup, Pending
- "Take Over" from AI: Human agent assumes control of AI conversation
- Per-conversation AI disconnect: Stops AI messages for specific customers
- Generative AI summary of conversation threads
- Reply and Internal Remark tabs

### 6.3 Department Dashboards
**Sales**: Pipeline count, new leads, overdue leads, lead aging, AI-generated leads, conversion rate, top agents
**Service**: Active campaigns, messages sent, replies received, appointments booked, declined services, upsell rate
**Marketing**: Campaign performance, leads generated, widget interactions, landing page visits
**Management**: Cross-section KPIs, revenue, team activity, ROI summary

### 6.4 Campaign System
- Campaign list with status tracking (Active/Paused/Draft/Completed)
- CSV upload for recipient lists
- Message template configuration with variable substitution
- Wait time configuration between messages (hours/days)
- Channel selection (SMS, Email, or both)
- **3-layer safety**:
  1. Per-conversation disconnect (TeamBox)
  2. Per-campaign kill switch (Campaign detail)
  3. Global communication gate (Settings → Organization)

### 6.5 Widget System
- 4 widget types: Text Chat, Live Video, Voice Call, Unified
- Accordion-style configuration: Appearance, Channels, Targeting, Embed
- Live preview sidebar showing widget appearance
- Table-based widget list with search, status badges, and copy-to-clipboard embed codes
- Simplified landing page for customer-facing deployment

### 6.6 RBAC
4-tier role system: super_admin > partner_admin > org_admin > org_staff

| Section | org_staff | org_admin | partner_admin | super_admin |
|---------|-----------|-----------|---------------|-------------|
| AI Chat | ✓ | ✓ | ✓ | ✓ |
| TeamBox | ✓ | ✓ | ✓ | ✓ |
| My Work | ✓ | ✓ | ✓ | ✓ |
| Sales | ✓ (dept) | ✓ | ✓ | ✓ |
| Service | ✓ (dept) | ✓ | ✓ | ✓ |
| Marketing | ✗ | ✓ | ✓ | ✓ |
| Management | ✗ | ✓ | ✓ | ✓ |
| System | ✗ | ✓ | ✓ | ✓ |

## 7. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Lead response time | < 2 minutes | Time from lead creation to first AI response |
| Lead conversion rate | +15–25% improvement | Converted leads / total leads, compared to pre-Nexxus baseline |
| Campaign opt-out rate | < 2% | STOP requests / total campaign recipients |
| Agent utilization | > 70% | Active conversation time / total online time |
| AI containment rate | > 60% | Conversations resolved by AI without human takeover |
| Customer satisfaction | > 4.5/5 | Post-conversation survey ratings |
| Platform uptime | > 99.5% | Monthly uptime percentage |
| Page load time | < 2 seconds | Time to interactive for dashboard pages |

## 8. Constraints & Non-Negotiables

1. **Communication gate must exist before any automated outbound messaging goes live** — the spam incident must never recur
2. **Credit/metering system must ship before Studio** (Wave 3 before Wave 4) — no unlimited AI usage without billing
3. **RBAC must be enforced at both UI and API levels** — UI hiding is not sufficient security
4. **Persona name must never be hardcoded** — always read from organization configuration
5. **Backend stays untouched during Wave 1** — all work is frontend-only with mock data
6. **VinSolutions integration must respect OAuth2 token refresh** — never store permanent credentials
7. **All automated messages must include opt-out mechanism** — TCPA/CAN-SPAM compliance

## 9. External Dependencies

| System | Purpose | Integration Type |
|--------|---------|-----------------|
| VinSolutions | DMS data (inventory, leads, customers) | OAuth2 REST API |
| VAPI | Voice AI calls | WebSocket + REST |
| Tavus | Video AI personas | REST API |
| Resend | Email delivery | REST API |
| TextMagic | SMS delivery | REST API |
| Claude API | AI reasoning | REST API with SSE |
| Google Calendar | Appointment scheduling | OAuth2 REST API |
| Supabase | PostgreSQL hosting | Direct connection |
