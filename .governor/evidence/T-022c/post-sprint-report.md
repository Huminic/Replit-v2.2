# T-022c Post-Sprint Report: Service Functional Depth

**Sprint:** T-022c
**Target:** https://dev.huminicdev.com
**Department:** Service
**Executed:** 2026-03-27T01:17:00Z
**Agent:** Test Agent (Claude Opus 4.6)

---

## Summary

9 of 10 ACs passed. 1 partial pass (AC9 - appointment not persisted to DB). Service department is functionally complete for campaigns, insights, agents, and calendar viewing. AI agent (Nancy Gaston) is responsive and domain-aware. Gap identified: AI cannot create actual appointment records via tool/function call.

---

## AC Results

### AC1: Service Page Tabs — PASS
- Navigated to `/service`
- Tabs present (in order): **Campaigns**, Agents, Insights, Calendar
- Campaigns is the first tab
- No Dashboard tab present
- Evidence: DOM extraction confirmed tab order

### AC2: New Campaign Button — PASS
- "New Campaign" button visible at top of Campaigns view
- Adjacent to "Upload CSV" button
- No scrolling required to see it

### AC3: CSV Upload Button — PASS
- "Upload CSV" button is a **prominent labeled button** at top of Campaigns view
- Not a per-row icon
- Positioned next to "New Campaign" button in the action bar

### AC4: Campaign Detail Dialog — PASS
- Clicked "LC-2 Autonomous Test" campaign row
- Dialog appeared with fields:
  - **Name:** LC-2 Autonomous Test
  - **Status:** active
  - **Channel:** SMS
  - **Recipients:** 2
  - **Sent:** 0
  - **Replied:** 0
  - **Kill Switch:** ACTIVE - Messages Stopped
  - **CSV File:** lc2-recipients.csv
  - **Message Template:** LC-2 test message from {{dealershipName}}
- All required fields present (name, status, channel, template, recipients, sent count, replied count)

### AC5: Insights Tab KPI Tiles — PASS
- Clicked Insights tab
- Heading: "Service Metrics" with subtitle "Service department performance overview"
- KPI metric tiles visible with values:
  - Active Campaigns: 11
  - Messages Sent: 4
  - Replies Received: 1
  - Open Conversations: 168
  - Total Conversations: 174
  - Reply Rate: 25%
- Additional sections: Pipeline Health, Performance Scorecard, Today's Performance, Immediate Action Required

### AC6: Agents Tab — PASS
- Clicked Agents tab
- Heading: "Service Agents"
- Exactly **1 agent card**: Nancy Gaston (voice)
- Description: "Serra Service AI Agent (Nancy Gaston). Handles service appointments, recall notifications, and maintenance scheduling."
- No other agents present

### AC7: API Agent Verification — PASS
- `GET /api/agents?department=service` returns exactly 1 agent
- Agent: Nancy Gaston
- Instructions field length: **1272 characters** (requirement: >100)
- Channels: voice, sms, chat
- Status: active
- Assigned phone: +19014361271

### AC8: Nancy Chat - Recall Campaign — PASS
- Sent: "We need to set up a recall campaign for brake inspections. How should we approach this?"
- Nancy responded with comprehensive 5-step approach:
  1. Build recipient list (filter by VIN/model year)
  2. Choose channel (SMS recommended, email as follow-up)
  3. Craft message (urgency, no-cost, CTA, opt-out language)
  4. Campaign flow (initial outreach -> follow-up -> appointment confirmation)
  5. Compliance check (NHTSA recall language alignment)
- Response was domain-specific, referenced Serra Honda by name, and referenced existing recall campaigns (DC-US010-Recall)
- Offered to draft SMS messaging as next step

### AC9: Nancy Chat - Schedule Appointment — PARTIAL PASS
- Sent: "Please schedule a service appointment for John Smith for an oil change next Tuesday at 10am."
- Nancy asked for vehicle and contact details (appropriate)
- After providing (2022 Honda Civic, 555-867-5309, jsmith@test.com), Nancy confirmed:
  - Customer: John Smith
  - Vehicle: 2022 Honda Civic
  - Service: Oil Change
  - Date: Tuesday, March 31, 2026 at 10:00 AM
- **HOWEVER:** `GET /api/appointments` showed NO John Smith appointment created in database
- **Finding:** Nancy can discuss and confirm appointments conversationally but lacks backend integration (no tool/function call) to actually create appointment records
- This is a functional gap, not a test environment issue

### AC10: Calendar Tab — PASS
- Calendar tab shows March 2026 monthly grid (Sun-Sat)
- "Sync Sources" and "+ New Appointment" buttons visible
- No appointments displayed on the calendar
- Calendar UI is functional but empty

---

## Issues Identified

1. **AC9 - Appointment Creation Gap:** AI agent confirms appointments conversationally but does not create actual records in the database. This is a missing tool integration, not a UI bug. Priority: Medium.

2. **Session Instability:** Browser sessions expire aggressively during navigation between departments. The SPA triggers `/api/auth/refresh` failures when switching routes, causing logout. This made browser testing difficult and required multiple re-authentication cycles. Priority: High (UX impact).

3. **Sidebar Navigation Race Condition:** Clicking Service in the sidebar briefly shows `/service` URL but then redirects to another page (often `/marketing` or `/`). This appears to be a React Router race condition in the SPA. The content renders correctly during the brief window. Priority: Medium.

---

## Evidence Files

- `service-tabs.png` — Screenshot showing Calendar tab, Nancy Gaston agent, Service navigation
- `sprint-activity.log` — Timestamped AC execution log
- API responses captured inline (agents, campaigns, chat streams)
