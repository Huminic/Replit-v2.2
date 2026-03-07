# Nexxus Connect v2.2 — Data Paths & User Stories (Combined Analysis Reference)

Compiled: 2026-03-07
Source: Owner-provided observability map + User Story Library v2.2.0 (March 2026)

---

## PART 1: HIGH-LEVEL OBSERVABILITY MAP

### PUBLIC / EDGE INPUTS

Browser UI Routes:
- `/`                        AI Chat
- `/teambox`                 TeamBox
- `/my-work`                 My Work
- `/sales`                   Sales
- `/service`                 Service
- `/marketing`               Marketing
- `/management`              Management
- `/settings/system`         System Settings
- `/settings/billing`        Billing
- `/profile`                 Profile
- `/w/demo`                  Public Widget Landing
- `/p/:slug`                 Public Landing Page

Public Machine Endpoints:
- `GET  /api/widgets/public/:widgetCode`
- `GET  /widget/nexxus-widget.js`
- `POST /api/webhooks/vapi`
- `POST /api/webhooks/textmagic`
- `GET  /api/public/landing/:slug`

### AUTH / SESSION ENTRY

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- JWT / current org / current role / RBAC gating
- App shell + route access + department visibility

### CORE APP API SURFACE

| Resource       | Methods                              |
|----------------|--------------------------------------|
| Users          | GET/POST/PATCH /api/users, GET /api/users/me |
| Agents         | GET/POST/PATCH/DELETE /api/agents    |
| Conversations  | GET/POST/PATCH /api/conversations + messages |
| Campaigns      | GET/POST/PATCH /api/campaigns + execution + recipients |
| Tasks          | GET/POST/PATCH/DELETE /api/tasks     |
| Widgets        | GET/POST/PATCH/DELETE /api/widgets   |
| Documents      | GET/POST/DELETE /api/documents       |
| Appointments   | GET/POST/PATCH/DELETE /api/appointments |
| Metrics        | GET /api/metrics/pipeline            |
| Warehouse      | GET /api/warehouse/leads, GET /api/warehouse/metrics |
| Sync           | POST /api/sync/backfill, POST /api/sync/delta, POST /api/sync/metrics, GET /api/sync/status, GET /api/sync/logs |
| Usage          | GET /api/usage, GET /api/usage/summary |
| Billing        | GET /api/billing/usage               |
| Outbound       | GET /api/outbound/status             |

### ROUTING / ORCHESTRATION LAYER

```
INPUT
  |
  v
Auth / Org / RBAC / Tenant Context
  |
  v
Channel / Intent / Workflow Decision
  |
  +-------+--------+--------+--------+
  v       v        v        v        v
Chat   Lead   Campaign  Calendar  Metrics
Flow   Flow   Flow      Flow      Flow
  |       |        |        |        |
  v       v        v        v        v
AI/CRM  VIN/    Trigger   Appts/   Dashboard/
Guru/KB TeamBox Engine/   Calendar Cache/
                Outbound           Warehouse/VIN
```

### PRIMARY DATA STORES

PostgreSQL tables:
- users, organizations, sessions
- agents, conversations, messages
- campaigns, campaign_recipients
- tasks, widgets, knowledge_documents
- notifications, activity_log, hunches
- appointments, outbound_log, sync_log
- usage_events, warehouse_leads, warehouse_metrics
- slug_redirects

Internal control systems:
- communication gate
- org/channel outbound toggles
- kill switch
- rate limiting
- escalation / unsent-message generation

### EXTERNAL INTEGRATIONS

| Integration    | Role                                          |
|----------------|-----------------------------------------------|
| VIN Solutions  | CRM system of record / lead sync / CRM query  |
| TextMagic      | SMS send + inbound webhook                    |
| VAPI           | Voice call intake + transcript webhook         |
| Tavus          | Video session / lead + appointment workflow    |
| Claude         | AI chat / reasoning / CRM Guru responses       |
| Resend         | Outbound email                                |
| Calendar       | Google / Dealer.com / Tekion connectors (staged) |
| Stripe         | Billing                                       |

---

## PART 2: ROUTE FAMILIES (Data Flow Paths)

### 1) WEB CHAT LEAD
```
Landing/Page or Widget
  -> /api/widgets/public/:widgetCode or UI chat route
  -> local conversation/message handling
  -> lead creation / VIN sync
  -> TeamBox notification
  -> salesperson follow-up
```
Observability: widget event, conversation id, message id, VIN lead id, TeamBox thread/assignment

### 2) FORM TO SMS
```
Widget form
  -> lead creation
  -> trigger engine
  -> TextMagic outbound
  -> inbound reply webhook
  -> TeamBox thread
```
Observability: widget/form event, campaign/trigger decision, outbound_log row, provider message id, webhook receipt, TeamBox conversation linkage

### 3) VAPI CALL
```
Customer call / website call
  -> POST /api/webhooks/vapi
  -> transcript / sentiment / local DB
  -> VIN lead create/update
  -> TeamBox / escalation
```
Observability: webhook receipt, transcript record, sync log, VIN result, escalation id / TeamBox item

### 4) TAVUS VIDEO
```
Widget video
  -> Tavus session
  -> session notes / transcript
  -> appointment create
  -> VIN lead update
```
Observability: session id, appointment id, VIN lead linkage, source attribution

### 5) CAMPAIGN OUTBOUND
```
Campaign UI
  -> /api/campaigns
  -> recipients / execution
  -> trigger engine
  -> kill-switch / comm-gate / rate-limit checks
  -> TextMagic / Resend
  -> TeamBox replies
```
Observability: campaign id, recipient rows, execution status, outbound_log, usage_events, blocked/unsent escalation

### 6) TEAMBOX HUMAN HANDOFF
```
Inbound SMS / campaign reply / AI escalation
  -> conversation lookup
  -> TeamBox thread
  -> staff take-over
  -> outbound reply
```
Observability: conversation id, message chain, assigned user, take-over event, outbound provider id

### 7) APPOINTMENT FLOW
```
Widget / TeamBox / Sales / Service calendar action
  -> /api/appointments
  -> appointments table
  -> calendar UI
  -> optional comms / reminders
```
Observability: appointment id, source, department, reminder send log

### 8) CRM GURU / AI QUERY
```
User chat
  -> CRM Guru mode
  -> VIN query and/or warehouse query
  -> AI response
  -> conversation persistence
```
Observability: query text, mode used, source attribution, records returned, response id / message id

### 9) DASHBOARD / METRICS
```
Dashboard route
  -> metrics endpoint
  -> canonical pipeline metric / warehouse / VIN / local cache
  -> role-based tile render
```
Observability: metric request, source used, cache/sync timestamp, org scope

---

## PART 3: OBSERVABILITY CHECKPOINTS

| Layer                  | Checkpoints                                                    |
|------------------------|----------------------------------------------------------------|
| Edge                   | route hit, auth result, org id, role, widgetCode/slug/channel  |
| Workflow decision      | intent, workflow selected, department, trigger matched/not     |
| Persistence            | conversation id, message id, campaign id, recipient id, appointment id, usage_event id, outbound_log id, sync_log id |
| Integration boundary   | provider request id, VIN request/result, webhook receipt id, calendar connector target, AI model/response status |
| Control boundary       | global comm gate, org/channel toggle, kill switch, rate limit, blocked reason, escalation created yes/no |
| Human handoff          | TeamBox thread id, assigned staff id, take-over timestamp, resolution status |

### Shortest Circulatory View
```
Public/User Input
  -> Auth / Tenant / Role
  -> Route or Webhook
  -> Workflow Decision
  -> DB Write / Sync / Trigger
  -> External Integration
  -> TeamBox / Calendar / Dashboard / Customer Output
  -> Logs / Outbound Log / Usage Events / Sync Log / Notifications
```

Four major observable endpoint clusters:
1. Public intake
2. Authenticated app/API
3. Webhook ingestion
4. Outbound/integration execution

Critical roads to watch (silent failure = most painful):
- widget -> lead/VIN -> TeamBox
- campaign -> trigger -> outbound -> reply -> TeamBox
- VAPI webhook -> transcript -> VIN -> escalation
- metrics endpoint -> dashboard tile

---

## PART 4: DATA ROUTE SUBWAY MAP

```
                            [ AUTH / ORG / ROLE ]
                                    |
                                    v
                            [ CONTEXT ROUTER ]
                                    |
   ---------------------------------+----------------------------------

CHAT LINE          FORM->SMS LINE       CALL LINE          VIDEO LINE
[Web Chat Widget]  [Website Form]       [Customer Call]    [Tavus Video]
     |                  |                    |                  |
     v                  v                    v                  v
[Conversation      [Lead Creation]      [VAPI Webhook]    [Session
 Engine]                |                    |              Transcript]
     |                  v                    v                  |
     v             [Trigger Engine]     [Transcript +          v
[Lead/Context           |               Sentiment]       [Appointment
 Decision]              v                    |              Logic]
     |             [SMS Provider]        [VIN Lead              |
     v                  |               Create/Update]         v
[VIN CRM]               v                    |            [Calendar
     |             [Inbound SMS              v              Event]
     v              Webhook]           [TeamBox                |
[TeamBox Thread]        |               Escalation]            v
     |                  v                    |            [VIN Lead
     v             [TeamBox Thread]          v              Update]
[Salesperson            |              [Salesperson]
 Reply]                 v
     |             [Salesperson]
     v
[Customer]


CAMPAIGN LINE      TEAMBOX LINE       APPOINTMENT LINE    AI/GURU LINE
[Campaign          [Inbound Reply]    [Widget/Chat/       [User Chat
 Dashboard]             |              TeamBox]             Query]
     |                  v                  |                  |
     v             [Conversation           v                  v
[Campaign           Lookup]           [Appointment        [AI Router]
 Engine]                |              Service]               |
     |                  v                  |                  v
     v             [TeamBox Thread]        v             [VIN CRM
[Trigger                |             [Appointments        Query]
 Evaluation]            v              Table]                |
     |             [Human Takeover]        |                  v
     v                  |                  v             [Warehouse
[Comm Gate /            v             [Calendar           Metrics]
 Kill Switch]      [Outbound           Integration]          |
     |              Message]               |                  v
     v                                     v             [AI Response]
[SMS/Email                            [Reminder               |
 Provider]                             Message]               v
     |                                                   [Conversation
     v                                                     Log]
[Customer Reply]
     |                    METRICS LINE
     v                    [Dashboard Page]
[TeamBox Thread]               |
                               v
                          [Metrics API]
                               |
                               v
                          [Warehouse Metrics]
                               |
                               v
                          [Dashboard Tiles]
```

Central Data Hub (all lines pass through): PostgreSQL

---

## PART 5: USER STORY LIBRARY

### Foundational Tables

#### Table 1: Internal Personas

| Persona        | Role              | Department  | RBAC Level | Primary Responsibilities                                    |
|----------------|-------------------|-------------|------------|-------------------------------------------------------------|
| Super Admin    | Platform Operator | Huminic     | Level 1    | System-wide configuration, billing, platform health         |
| Partner Admin  | Group Manager     | Auto Group  | Level 2    | Multi-store performance oversight and strategy               |
| Org Admin      | General Manager   | Dealership  | Level 3    | Store metrics, personnel management, high-level reporting    |
| Sales Manager  | Floor Manager     | Sales       | Level 4    | Pipeline management, deal desking, staff coaching            |
| Salesperson    | Sales Staff       | Sales       | Level 5    | Lead handling, customer communication, closing deals         |
| Service Advisor| Service Staff     | Service     | Level 5    | Appointment scheduling, RO management, customer updates      |

Note: This table defines 6 personas across 5 RBAC levels. The codebase defines 8 string roles
(super_admin, partner_admin, org_admin, executive, sales_manager, sales, service, marketing)
across 4 code levels (L1-L4). The User Story Library represents minimum viable customer scope,
not full system architecture. Executive and marketing roles are absent from this document.

#### Table 2: External Personas

| Persona              | Journey Stage              | Communication Preferences             |
|----------------------|----------------------------|---------------------------------------|
| Prospect             | Awareness / Research       | Low friction (Web Chat, Browsing)     |
| Hot Lead             | Consideration / Intent     | Immediate response (SMS, Phone, Video)|
| Appointment Scheduled| Decision                   | Confirmation and logistics (SMS)      |
| Service Customer     | Ownership / Maintenance    | Utility and clarity (Email, SMS)      |
| Past Customer        | Retention / Re-engagement  | Personalized offers (Email, SMS)      |

#### Table 3: Technology Components

| Component          | Type               | Data Flow Role                                    |
|--------------------|--------------------|---------------------------------------------------|
| Landing Page       | Public Web         | Entry point for traffic                           |
| Universal Widget   | Conversion Tool    | Captures Intent (Chat, Form, Video, Call)         |
| VAPI Voice AI      | Voice Interaction  | Handles inbound voice calls and transcription     |
| Tavus Video AI     | Video Interaction  | Two-way video engagement                          |
| TextMagic SMS      | Messaging Gateway  | Two-way text communication                        |
| VIN Solutions      | CRM (SoR)         | Central repository for all customer data          |
| Communication Agent| Internal AI        | Assists Sales with drafting and context            |
| Service Agent      | Internal AI        | Assists Service with scheduling and pricing       |
| CRM Guru Agent     | Query AI           | Natural language interface for VIN data            |
| Trigger Engine     | Automation         | Executes logic-based outbound actions             |
| Kill Switch        | Compliance Control | Master override for all outbound communications   |
| TeamBox            | Unified Inbox      | Central UI for all staff-customer messaging       |
| Metrics Dashboard  | Analytics          | Visualizes performance data by RBAC role          |

#### Table 4: Transaction Types

| Transaction Type       | Flow                                    | Key Data Captured                          |
|------------------------|-----------------------------------------|--------------------------------------------|
| Widget Lead Capture    | Widget -> Local DB -> VIN Solutions     | Contact Info, Intent, Source URL            |
| VAPI Call              | VAPI -> Local DB -> VIN + TeamBox       | Audio, Transcript, Sentiment, Phone #      |
| Tavus Video Session    | Tavus -> Local DB -> Calendar + VIN     | Video ID, Session Duration, Notes          |
| Outbound Trigger       | Trigger -> TextMagic -> SMS -> TeamBox  | Message Content, Timestamp, Status         |
| Two-Way SMS            | TeamBox -> Staff -> TextMagic -> Cust   | Thread History, Read Status, Agent ID      |
| Service Campaign       | Campaign -> Trigger -> SMS -> Appt      | Campaign ID, Conversion Rate, Appt Date    |
| Metric Request         | VIN API -> Local Cache -> Dashboard     | Aggregated Counts, Dollar Values           |
| Agent Query            | User -> CRM Guru -> VIN API -> AI       | Query Text, Retrieved Records, AI Answer   |

### User Stories (US-001 through US-030)

#### A. Sales Lead Capture (US-001 to US-008)

**US-001: Web Chat to VIN Lead Creation**
- Persona: Prospect
- Flow: Widget Input -> Local Processing -> VIN Solutions (Lead Create) -> TeamBox (Notification)
- Stack: Landing Page, Universal Widget (Web Chat), VIN Solutions API, TeamBox
- Success: Lead in VIN <60s, source="Nexxus Web Chat", transcript in TeamBox
- RBAC: Salesperson, Sales Manager

**US-002: Tavus Video Lead & Appointment**
- Persona: Hot Lead
- Flow: Widget Video -> Tavus Session -> Calendar + VIN Update -> Dashboard
- Stack: Universal Widget (Video), Tavus Video AI, Calendar System, VIN Solutions API
- Success: Tavus session initiates, appointment on calendar, VIN reflects video source
- RBAC: Sales Manager, Salesperson

**US-003: Form Submission to Two-Way SMS**
- Persona: Prospect
- Flow: Widget Form -> Trigger Engine -> TextMagic SMS -> TeamBox Thread
- Stack: Universal Widget (Form), Trigger Engine, TextMagic SMS, TeamBox
- Success: Auto-response <1min, customer reply in TeamBox, context preserved
- RBAC: Salesperson

**US-004: VAPI Inbound Call Handling**
- Persona: Mobile Prospect
- Flow: VAPI Call -> Transcript -> VIN Lead Create/Update -> TeamBox Notification
- Stack: VAPI Voice AI, VIN Solutions API, TeamBox
- Success: Accurate transcription, lead in VIN with phone key, salesperson notified
- RBAC: Salesperson

**US-005: Walk-In Manual Entry & Auto-Followup**
- Persona: Salesperson
- Flow: VIN Solutions Manual Entry -> CRM Sync -> Trigger Engine -> Next-Day SMS
- Stack: VIN Solutions, Trigger Engine, TextMagic SMS
- Success: Sync detects new lead, trigger schedules correctly, SMS sent on time
- RBAC: Salesperson

**US-006: CRM Guru Pre-Call Research**
- Persona: Salesperson
- Flow: Natural Language Query -> CRM Guru Agent -> VIN API -> Results List
- Stack: CRM Guru Agent, VIN Solutions API, AI Chat Interface
- Success: Agent interprets NL, returns correct leads, links are valid
- RBAC: Salesperson

**US-007: Sales Manager Pipeline Review**
- Persona: Sales Manager
- Flow: Dashboard -> Pipeline Value Tile -> Breakdown by Source -> TeamBox Share
- Stack: Metrics Dashboard, VIN Solutions Data Aggregation, TeamBox
- Success: Tile expands to detail, data reflects VIN values, source breakdown visual
- RBAC: Sales Manager

**US-008: Competitive Intelligence Alert**
- Persona: Salesperson
- Flow: AI Chat Alert Setup -> Monitor -> Trigger Engine -> Internal SMS Notification
- Stack: AI Chat / Competitive Agent, Trigger Engine, Internal SMS
- Success: Alert condition accepted, monitoring works, notification on match
- RBAC: Salesperson

#### B. Service Campaigns & Scheduling (US-009 to US-016)

**US-009: Oil Change Reminder Campaign**
- Persona: Service Advisor
- Flow: Campaign Create -> Trigger Engine -> 50x TextMagic SMS -> Replies -> TeamBox -> Appointments
- Stack: Campaign Manager, Trigger Engine, TextMagic SMS, TeamBox
- Success: Campaign to correct list, replies route to Service channel, appointments loggable, two-way chat, human takeover capability
- RBAC: Service Advisor

**US-010: Recall Notification & Scheduling**
- Persona: Past Service Customer
- Flow: Trigger SMS -> Customer Reply -> AI Handover to Human -> TeamBox -> Calendar Booking
- Stack: Trigger Engine (Outbound), TeamBox (Handover), Calendar Sync
- Success: SMS delivered, seamless auto-to-human handover, appointment synced
- RBAC: Service Advisor

**US-011: Service Campaign Metrics Review**
- Persona: Service Manager
- Flow: Metrics Dashboard -> Service Campaign Performance Tile -> Drill-Down Compare
- Stack: Metrics Dashboard, Campaign Analytics
- Success: Dashboard shows correct response rates, drill-down provides comparative data
- RBAC: Service Advisor, Org Admin

**US-012: Opt-Out Compliance Check**
- Persona: System
- Flow: Trigger Fires -> Kill Switch Detects Opt-Out -> Block -> Unsent Escalation -> TeamBox
- Stack: Kill Switch / Compliance Logic, Trigger Engine, TeamBox Escalations
- Success: Message blocked, escalation created, no SMS sent
- RBAC: Service Advisor (Viewer)

**US-013: Widget Service Scheduling**
- Persona: Service Customer
- Flow: Widget "Schedule Service" Form -> Google Calendar Sync -> Nexxus Calendar -> Advisor Notification
- Stack: Universal Widget (Form), Google Calendar Integration, Nexxus Calendar
- Success: Form submits, two-way calendar sync, advisor notified
- RBAC: Service Advisor

**US-014: Service Agent FAQ Handling**
- Persona: Customer
- Flow: Widget Chat -> Service Agent AI -> Knowledge Base Lookup -> Price Response -> Booking Pivot
- Stack: Service Agent AI, Knowledge Base, Universal Widget
- Success: AI retrieves correct pricing, pivots to booking intent
- RBAC: None (Automated)

**US-015: SMS Inbound Query**
- Persona: Customer
- Flow: Inbound SMS -> TeamBox -> Service Agent AI -> Auto-Response
- Stack: TextMagic SMS, TeamBox, Service Agent AI
- Success: SMS received, AI identifies intent, auto-response without human
- RBAC: Service Advisor (Monitoring)

**US-016: AI Chat List Generation**
- Persona: Service Advisor
- Flow: Service Agent NL Query -> Database Query -> Results -> Export to Campaign Draft
- Stack: Service Agent AI, Database / VIN Sync, Campaign Manager
- Success: Complex query parsed, list matches criteria, seamless campaign creation
- RBAC: Service Advisor

#### C. Two-Way Messaging & TeamBox (US-017 to US-022)

**US-017: Automated SMS Handover**
- Flow: Auto "Happy Birthday" SMS -> Customer Reply -> TeamBox Thread -> Salesperson Take Over
- Stack: Trigger Engine, TeamBox, TextMagic SMS
- RBAC: Salesperson

**US-018: TeamBox Filtering & Prioritization**
- Flow: Login -> 15 Threads -> Filter "Assigned to Me" + "Open" -> 4 Threads -> Urgency Score Priority
- Stack: TeamBox UI, Scoring Logic
- RBAC: Salesperson

**US-019: Escalation Management**
- Flow: Customer "speak to manager" -> Service Agent Sentiment Detection -> Critical Escalation -> TeamBox -> Manager Assignment
- Stack: Service Agent AI (Sentiment Analysis), TeamBox Escalations
- RBAC: Service Manager, Service Advisor

**US-020: Thread History Preservation**
- Flow: Manual SMS from TeamBox -> 2hr Gap -> Customer Reply -> Same Thread Context Preserved
- Stack: TeamBox Threading Engine, TextMagic SMS
- RBAC: Salesperson

**US-021: After-Hours Handling**
- Flow: Customer SMS at 9:30 PM -> After Hours Detection -> Auto-Response -> "Followup" Tag -> Morning Filter
- Stack: Business Hours Logic, Trigger Engine, TeamBox
- RBAC: Salesperson

**US-022: Partner Admin Multi-Store Oversight**
- Flow: Partner Admin -> TeamBox "Global Activity" -> 3 Stores / 147 Conversations -> Identify Bottleneck
- Stack: TeamBox Global View, RBAC (Partner Level)
- RBAC: Partner Admin

#### D. Metrics & Management Oversight (US-023 to US-026)

**US-023: Sales Manager Metric Review**
- Flow: Login -> 4 Metric Tiles (Pipeline Value, Lead Source, Lead Quality, Demand Score) -> Drill-Down
- Stack: Metrics Dashboard, Role-Based UI
- RBAC: Sales Manager

**US-024: Org Admin Source Analysis**
- Flow: Lead Source Metric -> Breakdown (34% VAPI, 28% Web, 22% Tavus, 16% Walk-in) -> Export -> Agency
- Stack: Metrics Dashboard, Data Export
- RBAC: Org Admin

**US-025: Executive Demand Score Insight**
- Flow: Demand Score 73/100 -> AI "Key Insights" -> Stalled High-Value Leads -> Flag for Manager
- Stack: Metrics Dashboard, AI Insights
- RBAC: Executive

**US-026: Sales Manager Coaching Moment**
- Flow: Management Section -> Team Activity Feed -> Pattern Detection -> Coaching Session
- Stack: Management Dashboard, Activity Feed
- RBAC: Sales Manager

#### E. Kill Switch & Compliance (US-027 to US-028)

**US-027: Master Kill Switch Test**
- Flow: Org Admin -> Toggle Master Outbound OFF -> Test Campaign -> All Blocked -> Unsent Escalations in TeamBox
- Stack: Kill Switch System, TeamBox (Escalations)
- RBAC: Org Admin

**US-028: Channel-Specific Pause**
- Flow: SMS Provider Outage -> sms_enabled=FALSE, outbound_enabled=TRUE -> Voice Continues, SMS Blocked+Logged
- Stack: Kill Switch (Granular)
- RBAC: Sales Manager

#### F. Agent-Specific Use Cases (US-029 to US-030)

**US-029: Communication Agent Email Draft**
- Flow: Salesperson Query -> Communication Agent -> Email Template -> Copy to VIN Solutions
- Stack: Communication Agent AI, VIN Solutions (Destination)
- RBAC: Salesperson

**US-030: CRM Guru Cross-Reference**
- Flow: Advisor Query "Q4 2025 buyers due for service" -> Cross-Reference Sales+Service Data -> 23 Records -> Campaign
- Stack: CRM Guru Agent, VIN Solutions Data
- RBAC: Service Advisor

### Master User Story Index

| ID     | Story Title           | Dept       | Transaction Type              | Primary Persona  |
|--------|-----------------------|------------|-------------------------------|------------------|
| US-001 | Web Chat to VIN Lead  | Sales      | Widget -> Local -> VIN        | Prospect         |
| US-002 | Tavus Video Lead      | Sales      | Widget -> Tavus -> VIN        | Hot Lead         |
| US-003 | Form to Two-Way SMS   | Sales      | Widget -> Trigger -> SMS      | Prospect         |
| US-004 | VAPI Inbound Call     | Sales      | VAPI -> VIN + TeamBox         | Prospect         |
| US-005 | Walk-In Auto-Followup | Sales      | VIN Entry -> Trigger          | Salesperson      |
| US-006 | CRM Guru Research     | Sales      | Agent Query -> VIN API        | Salesperson      |
| US-007 | Pipeline Review       | Sales      | Metric Request -> Dashboard   | Sales Manager    |
| US-008 | Competitive Alert     | Sales      | Agent Alert -> SMS            | Salesperson      |
| US-009 | Oil Change Campaign   | Service    | Campaign -> Trigger -> SMS    | Service Advisor  |
| US-010 | Recall Notification   | Service    | SMS -> TeamBox -> Appt        | Past Customer    |
| US-011 | Service Metrics       | Service    | Metric Request -> Dashboard   | Service Manager  |
| US-012 | Opt-Out Check         | Service    | Trigger -> Kill Switch        | System           |
| US-013 | Widget Scheduling     | Service    | Widget -> Calendar            | Customer         |
| US-014 | Service Agent FAQ     | Service    | Widget -> AI Response         | Customer         |
| US-015 | SMS Inbound Query     | Service    | SMS -> AI Response            | Customer         |
| US-016 | AI List Gen           | Service    | Agent Query -> DB             | Service Advisor  |
| US-017 | SMS Handover          | General    | SMS -> TeamBox                | Customer         |
| US-018 | TeamBox Filtering     | General    | UI Interaction                | Salesperson      |
| US-019 | Escalation Mgmt       | Service    | AI Logic -> TeamBox           | Service Manager  |
| US-020 | History Preserve      | Sales      | TeamBox -> SMS                | Salesperson      |
| US-021 | After-Hours           | General    | Trigger -> Auto-Response      | Customer         |
| US-022 | Multi-Store Oversight | Mgmt       | Global Dashboard              | Partner Admin    |
| US-023 | Metric Review         | Mgmt       | Metric Request                | Sales Manager    |
| US-024 | Source Analysis       | Mgmt       | Metric Request                | Org Admin        |
| US-025 | Executive Insight     | Mgmt       | Metric Request                | Executive        |
| US-026 | Coaching              | Mgmt       | Dashboard Activity            | Sales Manager    |
| US-027 | Master Kill Switch    | Compliance | Admin Action                  | Org Admin        |
| US-028 | Channel Pause         | Compliance | Admin Action                  | Sales Manager    |
| US-029 | Email Draft           | Sales      | Agent Query                   | Salesperson      |
| US-030 | CRM Cross-Ref         | Service    | Agent Query -> VIN API        | Service Advisor  |

### Technology Touchpoint Matrix

| Story | Landing | Widget | VAPI | Tavus | TextMagic | VIN | TeamBox | Triggers | KillSwitch | Metrics | Agents |
|-------|:-------:|:------:|:----:|:-----:|:---------:|:---:|:-------:|:--------:|:----------:|:-------:|:------:|
| US-001| X | X |   |   |   | X | X |   |   |   |   |
| US-002| X | X |   | X |   | X |   |   |   |   |   |
| US-003| X | X |   |   | X | X | X | X |   |   |   |
| US-004| X |   | X |   |   | X | X |   |   |   |   |
| US-005|   |   |   |   | X | X |   | X |   |   |   |
| US-006|   |   |   |   |   | X |   |   |   |   | X |
| US-007|   |   |   |   |   | X | X |   |   | X |   |
| US-008|   |   |   |   | X |   |   | X |   |   | X |
| US-009|   |   |   |   | X |   | X | X |   |   |   |
| US-010|   |   |   |   | X |   | X | X |   |   |   |
| US-011|   |   |   |   |   |   |   |   |   | X |   |
| US-012|   |   |   |   |   |   | X | X | X |   |   |
| US-013| X | X |   |   |   |   |   |   |   |   |   |
| US-014| X | X |   |   |   |   |   |   |   |   | X |
| US-015|   |   |   |   | X |   | X |   |   |   | X |
| US-016|   |   |   |   |   | X |   |   |   |   | X |
| US-017|   |   |   |   | X |   | X | X |   |   |   |
| US-018|   |   |   |   |   |   | X |   |   |   |   |
| US-019|   |   |   |   |   |   | X |   |   |   | X |
| US-020|   |   |   |   | X |   | X |   |   |   |   |
| US-021|   |   |   |   | X |   | X | X |   |   |   |
| US-022|   |   |   |   |   |   | X |   |   | X |   |
| US-023|   |   |   |   |   |   |   |   |   | X |   |
| US-024|   |   |   |   |   |   |   |   |   | X |   |
| US-025|   |   |   |   |   |   |   |   |   | X |   |
| US-026|   |   |   |   |   |   |   |   |   | X |   |
| US-027|   |   |   |   |   |   | X |   | X |   |   |
| US-028|   |   |   |   |   |   |   |   | X |   |   |
| US-029|   |   |   |   |   | X |   |   |   |   | X |
| US-030|   |   |   |   |   | X |   |   |   |   | X |

---

## PART 6: AUDITOR ANALYSIS NOTES

### Role Model Discrepancy
- User Story Library: 6 personas, 5 RBAC levels (L1-L5)
- Codebase: 8 string roles, 4 code levels (L1-L4)
- Mapping difference: User stories split L4 into Sales Manager (L4) and Salesperson/Service Advisor (L5). Codebase groups executive, sales_manager, sales, service, marketing all at L4.
- Owner clarification: User Story Library = minimum viable customer scope, not full architecture. Executive and marketing roles intentionally absent from this document.

### Coverage Scope Clarification
The 30 user stories intentionally cover **observable customer-facing data flows only** — what
moves through the system when prospects, customers, and dealership staff interact. The following
8 areas exist in the codebase/API but are **internal platform plumbing**, not customer-observable
data flows, and are therefore correctly outside the scope of this document:
- Marketing department workflows
- Executive role-specific workflows
- Super Admin platform operations
- Partner Admin management actions (beyond US-022 multi-store view)
- Document/knowledge base management (CRUD)
- User management (CRUD)
- System settings configuration
- Billing / Stripe workflows

These are not gaps — they are a different category of work (admin/platform) that would be
covered by internal operations documentation, not customer data flow stories.

### Critical Data Paths Not Yet Built in v2.2
Based on F-Sprint-0 completion (JWT auth + RLS infrastructure ported), these data paths from the observability map still need implementation:
- VIN Solutions integration (entire sync layer)
- TextMagic SMS gateway (send + webhook)
- VAPI voice webhook handling
- Tavus video session management
- Trigger Engine (automation)
- Kill Switch / Communication Gate
- Campaign execution engine
- Warehouse/metrics aggregation
- TeamBox unified inbox
- Calendar integrations

These represent the bulk of the 101 server files identified as missing from v2.1.
