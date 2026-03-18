# Nexxus Connect v2.2 — User Story Library

Authoritative source of truth for product capabilities. Written by project owner.
This document is a specification — it should not be edited by the build process.
acceptance_criteria.md references these stories for testing and verification.

Date: March 2026 | Version: 2.2.0 | Status: Approved

---

## Foundational Tables

### Internal Personas
| Persona | Role | Department | RBAC Level |
|---------|------|------------|------------|
| Super Admin | Platform Operator | Huminic | Level 1 |
| Partner Admin | Group Manager | Auto Group | Level 2 |
| Org Admin | General Manager | Dealership | Level 3 |
| Sales Manager | Floor Manager | Sales | Level 4 |
| Salesperson | Sales Staff | Sales | Level 5 |
| Service Advisor | Service Staff | Service | Level 5 |

### External Personas
| Persona | Profile | Journey Stage | Communication Preferences |
|---------|---------|---------------|--------------------------|
| Prospect | Early Car Shopper | Awareness / Research | Low friction (Web Chat, Browsing) |
| Hot Lead | Active Buyer | Consideration / Intent | Immediate response (SMS, Phone, Video) |
| Appointment Scheduled | Committed Visitor | Decision | Confirmation and logistics (SMS) |
| Service Customer | Existing Owner | Ownership / Maintenance | Utility and clarity (Email, SMS reminders) |
| Past Customer | Previous Buyer | Retention / Re-engagement | Personalized offers (Email, Targeted SMS) |

### Technology Components
| Component | Type | Data Flow Role |
|-----------|------|---------------|
| Landing Page | Public Web | Entry point for traffic |
| Universal Widget | Conversion Tool | Captures Intent (Chat, Form, Video, Call) |
| VAPI Voice AI | Voice Interaction | Handles inbound voice calls and transcription |
| Tavus Video AI | Video Interaction | Provides immersive two-way video engagement |
| TextMagic SMS | Messaging Gateway | Enables two-way text communication |
| VIN Solutions | CRM (System of Record) | Central repository for all customer data |
| Communication Agent | Internal AI | Assists Sales with drafting and context |
| Service Agent | Internal AI | Assists Service with scheduling and pricing |
| CRM Guru Agent | Query AI | Natural language interface for VIN data |
| Trigger Engine | Automation | Executes logic-based outbound actions |
| Kill Switch | Compliance Control | Master override for all outbound communications |
| TeamBox | Unified Inbox | Central UI for all staff-customer messaging |
| Metrics Dashboard | Analytics | Visualizes performance data by RBAC role |

### Transaction Types
| Transaction Type | Flow | Key Data Captured |
|-----------------|------|-------------------|
| Widget Lead Capture | Widget -> Local DB -> VIN Solutions | Contact Info, Intent, Source URL |
| VAPI Call | VAPI -> Local DB -> VIN Solutions + TeamBox | Audio, Transcript, Sentiment, Phone # |
| Tavus Video Session | Tavus -> Local DB -> Calendar + VIN Solutions | Video ID, Session Duration, Notes |
| Outbound Trigger | Trigger -> TextMagic -> SMS -> TeamBox | Message Content, Timestamp, Status |
| Two-Way SMS | TeamBox -> Staff -> TextMagic -> Customer | Thread History, Read Status, Agent ID |
| Service Campaign | Campaign -> Trigger -> SMS -> Appointment | Campaign ID, Conversion Rate, Appt Date |
| Metric Request | VIN API -> Local Cache -> Dashboard | Aggregated Counts, Dollar Values |
| Agent Query | User -> CRM Guru -> VIN API -> AI Response | Query Text, Retrieved Records, AI Answer |

---

## Sales Lead Capture (US-001 through US-008)

### US-001: Web Chat to VIN Lead Creation
**As a** Prospect **I want to** inquire about a vehicle via the website chat widget **So that** I can get information quickly without a phone call

A prospect lands on the dealership landing page and engages the Universal Widget, selecting "Web Chat." They inquire about the availability of a 2024 SUV. The AI collects their name, phone number, and specific vehicle interest. A new lead is immediately posted to VIN Solutions via API with the source marked as "Nexxus Web Chat." The chat transcript is appended to the CRM notes. A Salesperson receives a notification in TeamBox.

**Tech Stack:** Landing Page, Universal Widget (Web Chat), VIN Solutions API, TeamBox
**Success Criteria:** Lead appears in VIN Solutions within 60 seconds. Source correctly attributed to "Nexxus Web Chat". Salesperson can view transcript in TeamBox.
**RBAC:** Salesperson, Sales Manager

### US-002: Tavus Video Lead
**As a** Hot Lead **I want to** interact with a video avatar to book a test drive **So that** I can have a more personalized experience remotely

A buyer clicks the "Video" option on the widget. A Tavus video session initializes where an AI avatar guides them through booking a VIP test drive. The system records the session transcript and duration. It creates a "Test Drive" appointment in the local calendar and pushes a lead update to VIN Solutions.

**Tech Stack:** Universal Widget (Video), Tavus Video AI, Calendar System, VIN Solutions API
**Success Criteria:** Tavus session initiates successfully. Appointment appears on internal calendar. Lead in VIN Solutions reflects video source.
**RBAC:** Sales Manager, Salesperson

### US-003: Form Submission to Two-Way SMS
**As a** Prospect **I want to** fill out a "Get e-Price" form **So that** I can receive pricing details via text

The prospect fills out a simple form on the widget requesting pricing. This creates a lead in VIN Solutions and triggers an automated workflow. The Trigger Engine fires an automated SMS via TextMagic. The prospect replies, and the reply routes directly into TeamBox, opening a two-way conversation thread where the salesperson takes over manually.

**Tech Stack:** Universal Widget (Form), Trigger Engine, TextMagic SMS, TeamBox
**Success Criteria:** Auto-response sent within 1 minute of submission. Customer reply appears in TeamBox thread. Conversation context is preserved.
**RBAC:** Salesperson

### US-004: VAPI Inbound Call Handling
**As a** Mobile Prospect **I want to** call the dealership directly from the website **So that** I can speak to someone immediately

A prospect clicks "Call Us." VAPI Voice AI answers, collecting contact info and intent. Upon call completion, Nexxus generates a full transcript. A lead is created or updated in VIN Solutions. The salesperson reviews the transcript in TeamBox and initiates follow-up.

**Tech Stack:** VAPI Voice AI, VIN Solutions API, TeamBox
**Success Criteria:** VAPI accurately transcribes conversation. Lead created in VIN with phone number. Salesperson notified of completed call.
**RBAC:** Salesperson

### US-005: Walk-In Manual Entry & Auto-Followup
**As a** Salesperson **I want to** manually enter a walk-in customer's info **So that** they receive an automated thank you message

A customer walks onto the lot. The salesperson enters their details into VIN Solutions. Nexxus detects this new lead via CRM sync. The system schedules a "Next Day Follow-up" trigger. At 10:00 AM the next day, the Trigger Engine sends a TextMagic SMS.

**Tech Stack:** VIN Solutions (Manual Entry), Trigger Engine, TextMagic SMS
**Success Criteria:** Sync detects new VIN lead. Trigger schedules correctly. SMS sent at scheduled time.
**RBAC:** Salesperson

### US-006: CRM Guru Pre-Call Research
**As a** Salesperson **I want to** query the CRM using natural language **So that** I can find high-potential leads for my daily calls

A salesperson types: "Show me all leads from zip code 90210 who expressed interest in a trade-in within the last 30 days." The agent parses the request, queries VIN Solutions API, and returns matching profiles with links.

**Tech Stack:** CRM Guru Agent, VIN Solutions API, AI Chat Interface
**Success Criteria:** Agent accurately interprets natural language. Returns correct list from CRM. Links provided are valid.
**RBAC:** Salesperson

### US-007: Sales Manager Pipeline Review
**As a** Sales Manager **I want to** view a breakdown of pipeline value by source **So that** I can allocate budget to the best performing channels

The Sales Manager clicks the "Pipeline Value" metric tile. The view expands to show a detailed breakdown by source. They notice "VAPI Voice" leads have a higher close rate.

**Tech Stack:** Metrics Dashboard, VIN Solutions Data Aggregation, TeamBox (Sharing)
**Success Criteria:** Metric tile expands to detailed view. Data accurately reflects VIN Solutions values. Breakdown by source is visual and clear.
**RBAC:** Sales Manager

### US-008: Competitive Intelligence Alert
**As a** Salesperson **I want to** set an alert for competitor inventory **So that** I know when to adjust my pitch

A salesperson sets a boolean alert via AI Chat. The system monitors the parameter. When the condition is met, the Trigger Engine sends an internal notification.

**Tech Stack:** AI Chat / Competitive Agent, Trigger Engine, Internal SMS Notification
**Success Criteria:** Alert condition accurately accepted. System monitors external data. Notification sent immediately upon condition match.
**RBAC:** Salesperson

---

## Service Campaigns & Scheduling (US-009 through US-016)

### US-009: Oil Change Reminder Campaign
**As a** Service Advisor **I want to** send an oil change bulk message **So that** I can fill empty appointment slots

The Service Advisor creates a campaign, selects 50 targets, and executes. The Trigger Engine sends SMS via TextMagic. Replies populate TeamBox. The advisor manages conversations, booking appointments.

**Tech Stack:** Campaign Manager, Trigger Engine, TextMagic SMS, TeamBox
**Success Criteria:** Campaign executes to correct list. Customer replies route to Service channel. Appointments are loggable. Two-way ongoing chat. Ability to pickup as human and end agent two-way chat.
**RBAC:** Service Advisor

### US-010: Recall Notification & Scheduling
**As a** Past Service Customer **I want to** know about a recall on my vehicle **So that** I can ensure my car is safe

Customer receives automated recall SMS. They reply. The Service Agent acknowledges but flags for human review. A Service Advisor takes over in TeamBox, checks parts, proposes time, confirms booking.

**Tech Stack:** Trigger Engine (Outbound), TeamBox (Handover), Calendar Sync
**Success Criteria:** Outbound SMS delivered. Seamless handover from auto to human. Appointment synced.
**RBAC:** Service Advisor

### US-011: Service Campaign Metrics Review
**As a** Service Manager **I want to** analyze campaign performance **So that** I can optimize future messaging

The Service Manager views campaign performance tile. They see response rates and drill down to compare campaigns.

**Tech Stack:** Metrics Dashboard, Campaign Analytics
**Success Criteria:** Dashboard displays correct response rates. Drill-down provides comparative data.
**RBAC:** Service Advisor, Org Admin

### US-012: Opt-Out Compliance Check
**As a** System **I want to** block messages to opted-out customers **So that** the dealership remains compliant

An automated trigger attempts to fire for a customer who replied "STOP". The compliance logic blocks the trigger. An escalation is created in TeamBox.

**Tech Stack:** Kill Switch / Compliance Logic, Trigger Engine, TeamBox Escalations
**Success Criteria:** Message successfully blocked. Escalation record created. No SMS sent.
**RBAC:** Service Advisor (Viewer)

### US-013: Widget Service Scheduling
**As a** Service Customer **I want to** book an appointment via the website widget **So that** I don't have to call during business hours

Customer opens widget, selects "Schedule Service." Appointment syncs via calendar integration. Service Advisor receives notification, confirms slot, triggers confirmation email.

**Tech Stack:** Universal Widget (Form), Google Calendar Integration, Nexxus Calendar
**Success Criteria:** Form submission successful. Two-way calendar sync. Advisor notification received.
**RBAC:** Service Advisor

### US-014: Service Agent FAQ Handling
**As a** Customer **I want to** know the price of an alignment **So that** I can budget for my visit

Customer chats via widget asking about pricing. The Service Agent AI references the Knowledge Base, responds with pricing, and pivots to booking.

**Tech Stack:** Service Agent AI, Knowledge Base, Universal Widget
**Success Criteria:** AI retrieves correct pricing. AI successfully pivots to booking intent.
**RBAC:** None (Automated)

### US-015: SMS Inbound Query
**As a** Customer **I want to** text the dealership number **So that** I can ask a quick question on the go

Customer sends SMS. The Service Agent recognizes the intent and auto-responds without human intervention.

**Tech Stack:** TextMagic SMS, TeamBox, Service Agent AI
**Success Criteria:** Inbound SMS received. AI correctly identifies intent. Auto-response sent without human intervention.
**RBAC:** Service Advisor (Monitoring)

### US-016: AI Chat List Generation
**As a** Service Advisor **I want to** find lapsed high-mileage customers **So that** I can generate service revenue

The advisor asks: "Pull all customers with vehicles over 60k miles who haven't serviced in 90 days." The agent returns a list. The advisor clicks "Export to Campaign."

**Tech Stack:** Service Agent AI, Database / VIN Sync, Campaign Manager
**Success Criteria:** Complex query accurately parsed. List matches criteria. Seamless transition to campaign creation.
**RBAC:** Service Advisor

---

## Two-Way Messaging & TeamBox (US-017 through US-021)

### US-017: Automated SMS Handover
**As a** Customer who replied to an automated text with sales intent

Customer receives automated "Happy Birthday" text and replies about a trade-in. Thread opens in TeamBox. Salesperson takes over, pausing automation.

**Tech Stack:** Trigger Engine, TeamBox, TextMagic SMS
**Success Criteria:** Reply creates thread. Takeover pauses automation. Manual conversation continues.
**RBAC:** Salesperson

### US-018: TeamBox Filtering & Prioritization
**As a** Salesperson **I want to** filter my inbox

Salesperson uses filters: "Assigned to Me" + "Open." System flags high urgency based on keywords.

**Tech Stack:** TeamBox UI, Scoring Logic
**Success Criteria:** Filters reduce list. Urgency scoring works.
**RBAC:** Salesperson

### US-019: Escalation Management
**As a** Service Manager handling a complaint escalation

Customer says "speak to a manager." Agent detects negative sentiment. Creates Critical escalation. Manager sees badge, assigns to senior advisor.

**Tech Stack:** Service Agent AI (Sentiment Analysis), TeamBox Escalations
**Success Criteria:** Sentiment detected. Escalation created. Manager notified.
**RBAC:** Service Manager, Service Advisor

### US-020: Thread History Preservation
**As a** Salesperson who sent a text hours ago

Customer replies hours later. Message appears in the exact same thread with full context.

**Tech Stack:** TeamBox Threading Engine, TextMagic SMS
**Success Criteria:** Thread continuity maintained across time gaps.
**RBAC:** Salesperson

### US-021: After-Hours Handling
**As a** Customer texting at 9:30 PM

System detects after-hours. Auto-response sent. Conversation tagged "Followup." Salesperson sees tag in morning filter.

**Tech Stack:** Business Hours Logic, Trigger Engine, TeamBox
**Success Criteria:** After-hours detected. Auto-response sent. Followup tag applied.
**RBAC:** Salesperson

---

## Management & Compliance (US-022 through US-030)

### US-022: Partner Admin Multi-Store Oversight
**As a** Partner Admin managing 3 dealerships

Views Global Activity feed. Sees conversation volume across stores. Identifies bottlenecks.

**Tech Stack:** TeamBox Global View, RBAC (Partner Level)
**Success Criteria:** Global view shows all stores. Conversation counts accurate.
**RBAC:** Partner Admin

### US-023: Sales Manager Metric Review
**As a** Sales Manager

Views 4 customized tiles: Pipeline Value, Lead Source, Lead Quality, Demand Score. Clicks Pipeline, sees $847k in active deals.

**Tech Stack:** Metrics Dashboard, Role-Based UI
**Success Criteria:** Tiles display. Drill-down works. Data accurate.
**RBAC:** Sales Manager

### US-024: Org Admin Source Analysis
**As an** Org Admin (GM)

Reviews Lead Source breakdown by percentage. Exports data for marketing agency.

**Tech Stack:** Metrics Dashboard, Data Export
**Success Criteria:** Breakdown accurate. Export functional.
**RBAC:** Org Admin

### US-025: Executive Demand Score Insight
**As an** Executive

Checks Demand Score (73/100). AI explains key insights about stalled high-value leads.

**Tech Stack:** Metrics Dashboard, AI Insights
**Success Criteria:** Score displays. Insights are contextual. Lead flagging works.
**RBAC:** Executive

### US-026: Sales Manager Coaching Moment
**As a** Sales Manager

Views Team Activity feed. Notices unfollowed leads. Uses data for coaching.

**Tech Stack:** Management Dashboard, Activity Feed
**Success Criteria:** Activity feed shows per-salesperson data. Gap detection works.
**RBAC:** Sales Manager

### US-027: Master Kill Switch Test
**As an** Org Admin performing compliance test

Toggles Master Outbound OFF. Attempts campaign. All transmission blocked. Escalations in TeamBox.

**Tech Stack:** Kill Switch System, TeamBox (Escalations)
**Success Criteria:** Kill switch blocks all. Escalations created. No messages leave system.
**RBAC:** Org Admin

### US-028: Channel-Specific Pause
**As a** Sales Manager during SMS outage

Disables SMS only. Voice triggers continue. SMS blocked and logged as escalations.

**Tech Stack:** Kill Switch (Granular)
**Success Criteria:** Granular channel control works. Blocked messages logged.
**RBAC:** Sales Manager

### US-029: Communication Agent Email Draft
**As a** Salesperson struggling to write a follow-up email

Asks Communication Agent to draft email for a 2024 Silverado. Agent generates polished template.

**Tech Stack:** Communication Agent AI, VIN Solutions (Destination)
**Success Criteria:** Polished email generated. Vehicle-specific.
**RBAC:** Salesperson

### US-030: CRM Guru Cross-Reference
**As a** Service Advisor

Asks CRM Guru: "Show all customers who bought in Q4 2025 and are due for first service." Agent cross-references sales and service data. Returns 23 records for campaign.

**Tech Stack:** CRM Guru Agent, VIN Solutions Data
**Success Criteria:** Cross-reference works. List accurate. Campaign creation seamless.
**RBAC:** Service Advisor

---

## Story Index

| ID | Title | Dept | Primary Persona |
|----|-------|------|----------------|
| US-001 | Web Chat to VIN Lead | Sales | Prospect |
| US-002 | Tavus Video Lead | Sales | Hot Lead |
| US-003 | Form to Two-Way SMS | Sales | Prospect |
| US-004 | VAPI Inbound Call | Sales | Prospect |
| US-005 | Walk-In Auto-Followup | Sales | Salesperson |
| US-006 | CRM Guru Research | Sales | Salesperson |
| US-007 | Pipeline Review | Sales | Sales Manager |
| US-008 | Competitive Alert | Sales | Salesperson |
| US-009 | Oil Change Campaign | Service | Service Advisor |
| US-010 | Recall Notification | Service | Past Customer |
| US-011 | Service Metrics | Service | Service Manager |
| US-012 | Opt-Out Check | Service | System |
| US-013 | Widget Scheduling | Service | Customer |
| US-014 | Service Agent FAQ | Service | Customer |
| US-015 | SMS Inbound Query | Service | Customer |
| US-016 | AI List Gen | Service | Service Advisor |
| US-017 | SMS Handover | General | Customer |
| US-018 | TeamBox Filtering | General | Salesperson |
| US-019 | Escalation Mgmt | Service | Service Manager |
| US-020 | History Preserve | Sales | Salesperson |
| US-021 | After-Hours | General | Customer |
| US-022 | Multi-Store Oversight | Mgmt | Partner Admin |
| US-023 | Metric Review | Mgmt | Sales Manager |
| US-024 | Source Analysis | Mgmt | Org Admin |
| US-025 | Executive Insight | Mgmt | Executive |
| US-026 | Coaching | Mgmt | Sales Manager |
| US-027 | Master Kill Switch | Compliance | Org Admin |
| US-028 | Channel Pause | Compliance | Sales Manager |
| US-029 | Email Draft | Sales | Salesperson |
| US-030 | CRM Cross-Ref | Service | Service Advisor |
