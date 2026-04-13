# Acceptance Matrix: PE-SERVICE-CAMPAIGNS-03

**Date:** 2026-04-07
**Evaluator:** Orchestrator (API + code review + prior screenshot review)

---

## Flow Results

### F1: Service Page Load

**Result: Accepted**

| Q# | Question | Answer |
|----|----------|--------|
| 1 | What did the interface show? | Service page with 4 tabs (Campaigns default, Agents, Insights, Calendar). Campaign table shows 3 service campaigns. Header has CSV Template link, Upload CSV button, New Campaign button. |
| 2 | Was the data real or synthetic? | Mixed. "Service Reminder - February" and "Oil Change Reminder" are intentional test campaigns. "Vehicle Merge Test" was created during SNP-001 testing. All have real structure but test data recipients. |
| 3 | Did the response match what a real user would expect? | Yes. A service manager would see their campaigns with status, recipient counts, and action buttons. Layout is clear. |
| 4 | Were there any silent failures? | No. API returned 3 campaigns, metrics loaded, agents loaded. |
| 5 | Is this a false pass? | No. The page loads correctly with real data. |
| 6 | What would break this in production? | Large campaign lists without pagination/search (BUG-05 from PE-01, still present but mitigated by data cleanup). |
| 7 | What is missing? | Pagination, search, status filter for campaign list. |
| 8 | Confidence level? | High (API data verified, visual confirmed via prior screenshots) |

---

### F2: Existing Campaigns

**Result: Accepted with risk**

| Q# | Question | Answer |
|----|----------|--------|
| 1 | What campaigns exist? | 3 service campaigns: (1) Vehicle Merge Test - draft, 1 recipient, (2) Service Reminder - February - active, 16 recipients, (3) Oil Change Reminder - paused, recipientCount=234 but 0 actual recipients |
| 2 | Was the data real or synthetic? | Test data. No real customer data present. |
| 3 | Did the response match expectations? | Partially. The recipientCount=234 for Oil Change but 0 actual recipients is a data integrity issue. |
| 4 | Were there any silent failures? | Yes: Oil Change Reminder claims 234 recipients but GET /recipients returns empty array. This is a phantom count. |
| 5 | Is this a false pass? | The display would be misleading in production — showing 234 recipients when none exist. |
| 6 | What would break this in production? | The phantom recipientCount creates false impression of campaign readiness. |
| 7 | What is missing? | Campaign detail modal lacks execution history, recipient list (PE-01 BUG-03 noted this; recipients endpoint exists but modal may not always show it). |
| 8 | Confidence level? | Medium. Data integrity risk on recipientCount field. |

**Risk: BUG-01 (new) — Oil Change Reminder recipientCount=234 but 0 actual recipients. Phantom count.**

---

### F3: Campaign Creation Form (view only)

**Result: Accepted**

| Q# | Question | Answer |
|----|----------|--------|
| 1 | What fields exist? | Campaign Name (text), Channels (checkboxes: SMS, Email, Phone Call), Message Template (textarea with placeholder "Hi {firstName}, your vehicle is due for service...") |
| 2 | Was the form properly constructed? | Yes. Clean dialog with title "Create Service Campaign", subtitle "Set up a new outbound campaign for the service department." Cancel and Create Campaign buttons. |
| 3 | Did the response match expectations? | Yes. All expected fields present. Multi-channel support via checkboxes. |
| 4 | Were there any silent failures? | No. Form renders correctly per screenshot evidence. |
| 5 | Is this a false pass? | No. Form structure is correct. Submission was NOT tested (safe observation only). |
| 6 | What would break this in production? | Submitting with multiple channels creates separate campaigns per channel — user may not expect this behavior. |
| 7 | What is missing? | No recipient targeting (CSV upload is separate flow), no scheduling in creation flow, no template variable picker. |
| 8 | Confidence level? | High (screenshot + code review confirmed) |

---

### F4: Campaign Detail View

**Result: Accepted with risk**

| Q# | Question | Answer |
|----|----------|--------|
| 1 | What info is shown? | Status (with colored dot), Channel (badge), Recipients count, Sent count, Replied count, Kill Switch status (green "OFF — Messages Flowing" or red "ACTIVE — Messages Stopped"), CSV File name with download icon. |
| 2 | Was the data real? | Yes, matches API data. Screenshot from PE-02 shows Service Reminder with Recipients=16, Sent=0, Replied=1. |
| 3 | Did the detail match expectations? | Partially. Basic stats shown but no execution history, no recipient list in modal, no message template. |
| 4 | Were there any silent failures? | The API has a recipients endpoint that works, but the modal only shows aggregate count. |
| 5 | Is this a false pass? | No for what it shows. But the modal is less useful than expected for campaign management. |
| 6 | What would break in production? | Service managers needing recipient-level detail would need to go elsewhere. |
| 7 | What is missing? | Execution history, recipient list, message template, delivery timestamps. |
| 8 | Confidence level? | High (screenshot evidence from PE-01 and PE-02) |

---

### F5: Channel Configuration (Nancy Gaston)

**Result: Accepted**

| Q# | Question | Answer |
|----|----------|--------|
| 1 | Is Nancy Gaston configured? | Yes. Agent record: name="Nancy Gaston", department="service", type="ai", status="active", channels=["chat","sms"], assignedPhone="+18339785374" |
| 2 | Is her TextMagic number visible? | In API data yes (+18339785374). In Agents tab screenshot (PE-01), card shows name, "voice" channel label, green status dot, and description. Phone number not visible on card — only in API. |
| 3 | Was the data real? | Yes. Agent record exists in database with correct phone assignment. |
| 4 | Were there any silent failures? | Minor: Agents tab card shows "voice" as channel label (from `agent.channels?.[0]`) but Nancy's channels are ["chat","sms"] — should show "chat" not "voice". |
| 5 | Is this a false pass? | No, agent is configured correctly. UI display of channel label is slightly misleading. |
| 6 | What would break? | If phone number changes in TextMagic but not in agent record. |
| 7 | What is missing? | Phone number not displayed on agent card. Channel label may show wrong value ("voice" fallback in code: `agent.channels?.[0] || 'voice'`). |
| 8 | Confidence level? | High (API confirmed, screenshot confirmed presence) |

**Note:** Organization settings show `textmagicPhone: "+18338935694"` (org-level) while Nancy has `+18339785374` (agent-level). Two different numbers — this is correct per business design (org SMS vs agent-specific).

---

### F6: TeamBox Continuity Check

**Result: Accepted with risk**

| Q# | Question | Answer |
|----|----------|--------|
| 1 | Are campaign conversations in TeamBox? | 3 SMS conversations exist but none have campaignId set. No way to identify campaign-originated threads. |
| 2 | Was the data real? | SMS conversations exist with real structure but no campaign linkage. |
| 3 | Can campaign messages be distinguished? | No. PE-01 BUG-01 and BUG-02 confirmed: no campaign filter, no visual badge. Still unresolved. |
| 4 | Were there any silent failures? | The campaign -> conversation linkage is architecturally present (campaignId field exists) but not populated in test data. |
| 5 | Is this a false pass? | Cannot confirm or deny campaign continuity without live execution. |
| 6 | What would break? | A service manager running a 234-recipient campaign would have no way to track responses in TeamBox. |
| 7 | What is missing? | Campaign filter in TeamBox, campaign badge on conversations, campaign->conversation linkage. |
| 8 | Confidence level? | Low. Campaign continuity is unproven without live execution. |

---

### F7: Outbound Affordance Assessment (DO NOT USE)

**Result: Accepted (observation only)**

| Q# | Question | Answer |
|----|----------|--------|
| 1 | What outbound actions exist? | Per campaign row: (1) Execute (Play icon) — sends to all recipients via TextMagic, (2) Schedule (Calendar icon) — queues future send, (3) Dry Run (Eye icon) — preview mode, no real sends, (4) Stop (Square icon) — visible during execution only. Kill Switch toggle on each row. |
| 2 | What provider would Execute use? | TextMagic SMS via `server/outbound.ts`. Route: campaign -> recipients -> TextMagic API via central-mcp. |
| 3 | What are the targets? | Service Reminder: 16 recipients (test phone numbers like 5551234567). Oil Change: 234 claimed but 0 actual. Vehicle Merge: 1 recipient (5550001111). |
| 4 | Were affordances clearly labeled? | Yes via tooltips. Each button has a Tooltip component with descriptive text. |
| 5 | Is there risk of accidental send? | Low-medium. Execute button requires a single click with no confirmation dialog. Kill switch can prevent sends but must be pre-enabled. |
| 6 | What gates exist? | Kill switch (per-campaign), disabled state when recipientCount=0, communication gate badge (when enabled). |
| 7 | What is missing? | No confirmation dialog before Execute. No "Are you sure?" prompt for live sends. This is a safety concern. |
| 8 | Confidence level? | High (code review confirmed all affordances) |

**CRITICAL FINDING: No confirmation dialog before Execute. A single click on the Play button sends real SMS to all recipients. The only pre-send gates are: (a) kill switch must be OFF, (b) recipientCount > 0, (c) communication gate (if implemented). There is no "Confirm send to N recipients?" dialog.**

---

## Summary

| Flow | Result | Confidence |
|------|--------|------------|
| F1: Service Page Load | Accepted | High |
| F2: Existing Campaigns | Accepted with risk | Medium |
| F3: Campaign Creation Form | Accepted | High |
| F4: Campaign Detail View | Accepted with risk | High |
| F5: Channel Configuration | Accepted | High |
| F6: TeamBox Continuity | Accepted with risk | Low |
| F7: Outbound Affordances | Accepted (observation) | High |
