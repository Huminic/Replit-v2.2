# PE-SERVICE-CAMPAIGNS-01 Evidence Index

**Date:** 2026-04-06
**Evaluator:** Playwright Operator (observation only)
**Target:** https://live.huminic.app/service
**Account:** serra_honda@huminic.ai (org_admin, Serra Honda)
**Mode:** Observation only -- no campaigns executed, no messages sent

---

## Phase 1: Campaign Setup (UC-01 through UC-05)

### UC-01: Service page loads -- tabs visible
**PASS**
- Service page loads at `/service`
- Four tabs visible: **Campaigns** (default/active), **Agents**, **Insights**, **Calendar**
- No missing or broken tabs
- Screenshot: `screenshots/03-service-page-full.png`

### UC-02: Campaign list -- existing campaigns and statuses
**PASS**
- 137 campaigns exist in the list (mix of real and E2E test data)
- Observed statuses: **paused** (2), **active** (18), **completed** (82+), **draft** (35+)
- All campaigns show: name, CSV filename, status indicator (colored dot), channel, recipients count, sent count, replied count
- Table columns: Campaign, Status, Channel, Recipients, Sent, Replied, Kill Switch, Actions
- Channels observed: SMS (majority), EMAIL (2), PHONE (1)
- Screenshot: `screenshots/03-service-page-full.png`, `screenshots/05-csv-upload-area.png`

### UC-03: New Campaign dialog opens
**PASS**
- "New Campaign" button is visible (blue, top-right of campaign list)
- Clicking opens a modal dialog titled "Create Service Campaign"
- Subtitle: "Set up a new outbound campaign for the service department."
- "Create Campaign" button is disabled until required fields are filled
- Cancel and Close (X) buttons work
- Screenshot: `screenshots/04-new-campaign-dialog.png`

### UC-04: Campaign creation form fields
**PASS**
- **Campaign Name** -- text input, placeholder: "e.g. Service Reminder Q1"
- **Channels** -- checkbox group: SMS (checked by default), Email, Phone Call
- **Message Template** -- textarea, placeholder: "Hi {firstName}, your vehicle is due for service..."
- No interval/timing field visible in creation form
- No department selector (hardcoded to Service)
- Screenshot: `screenshots/04-new-campaign-dialog.png`

### UC-05: Multi-channel creation
**PASS**
- Multi-channel is available via checkboxes (SMS, Email, Phone Call)
- Multiple channels can be selected simultaneously during creation
- SMS is pre-selected by default
- Screenshot: `screenshots/04-new-campaign-dialog.png`

---

## Phase 2: CSV Upload (UC-06 through UC-09)

### UC-06: CSV upload button location
**PASS**
- "Upload CSV" button exists in the toolbar between "CSV Template" link and "New Campaign" button
- Located top-right of the campaign list area
- Has upload icon
- Test ID: `button-upload-csv`
- Screenshot: `screenshots/05-csv-upload-area.png`

### UC-07: Upload dialog appearance
**OBSERVATION**
- Clicking "Upload CSV" opens a **native OS file chooser dialog** (not a custom upload dialog)
- There is NO custom column-matching UI visible
- Column matching appears to happen server-side after file selection
- The file chooser was dismissed without uploading (observation only)

### UC-08: CSV template download button
**PASS -- I-193 IS RESOLVED**
- A "CSV Template" download link **IS present** (top-right, next to Upload CSV button)
- Link URL: `/campaign-template.csv`
- Has download icon
- Test ID includes `link` to `/campaign-template.csv`
- **This contradicts I-193 which claimed there was no CSV template download button.** I-193 should be closed as resolved.
- Screenshot: `screenshots/05-csv-upload-area.png`

### UC-09: Upload without file selected
**OBSERVATION**
- The Upload CSV button triggers the native file chooser
- If no file is selected (chooser cancelled), nothing happens -- page remains unchanged
- No error message displayed (expected behavior for native file chooser cancel)

---

## Phase 3: Campaign Detail and Execution (UC-10 through UC-14)

### UC-10: Campaign detail view opens
**PASS**
- Clicking a campaign row opens a modal dialog
- Dialog title: campaign name (e.g., "Service Reminder - February")
- Subtitle: "Campaign details and statistics"
- Close button (X) works
- Screenshot: `screenshots/06-campaign-detail-view.png`

### UC-11: Detail view contents
**PASS**
- Detail view shows:
  - **Status** (with colored indicator): paused
  - **Channel**: SMS
  - **Recipients**: 14
  - **Sent**: 1
  - **Replied**: 1
  - **Kill Switch**: "ACTIVE -- Messages Stopped" (red badge)
  - **CSV File**: test-recipients.csv (with download icon)
- Missing from detail view: execution history, recipient list, message template
- Screenshot: `screenshots/06-campaign-detail-view.png`

### UC-12: Execute button
**OBSERVATION**
- There is NO explicit "Execute" button in the campaign detail dialog
- Execution is done via the **Play button** (triangle icon) in the Actions column of the campaign list table
- Test ID: `button-start-campaign-{id}`
- The play button is per-row in the campaign table, not in the detail modal

### UC-13: Kill Switch / Stop button
**PASS**
- Kill Switch exists as a **toggle switch** in each campaign row
- Test ID: `switch-killswitch-{id}`
- When active (on), campaign detail shows "ACTIVE -- Messages Stopped" in red
- Toggle is visible in the Kill Switch column of the campaign table
- Additional info text at bottom of page: "Use the Kill Switch to immediately stop all outbound messages for a campaign. Individual conversations can also be disconnected from campaigns in TeamBox."
- Screenshot: `screenshots/05-csv-upload-area.png`, `screenshots/06-campaign-detail-view.png`

### UC-14: Campaign statuses observed
**PASS**
- Statuses found in the live data:
  - **draft** -- campaign created but not started (35+ instances)
  - **active** -- campaign running (18 instances)
  - **paused** -- campaign manually paused (2 instances)
  - **completed** -- campaign finished execution (82+ instances)
- NOT observed: "idle", "executing", "stopped" as distinct statuses
- The "stopped" state appears to be represented by Kill Switch active + paused status

### Action Buttons per Campaign Row
Each campaign row has 5 action controls:
1. **Kill Switch toggle** (`switch-killswitch-{id}`)
2. **Start/Play button** (`button-start-campaign-{id}`)
3. **Schedule button** (`button-schedule-campaign-{id}`)
4. **Dry Run button** (`button-dryrun-campaign-{id}`)
5. **Upload CSV button** (`button-upload-csv-{id}`)

---

## Phase 4: TeamBox Continuity (UC-15 through UC-18)

### UC-15: Campaign-originated conversations in TeamBox
**NOT VERIFIED**
- Navigated to TeamBox > SMS channel (57 conversations)
- No conversations in the visible list showed campaign-related badges or tags
- Most conversations appear to be E2E test data (Cross Org Msg Test, etc.)
- Campaign conversations may exist but are not visually distinguishable from regular conversations
- Screenshot: `screenshots/11-teambox-sms-channel.png`

### UC-16: Campaign filter in TeamBox
**CONFIRMED MISSING**
- TeamBox filter options:
  - **Channel filters**: All, SMS, Email, Voice
  - **Status filters**: All (600), Open (594), Assigned to me (1), Participating (1), Automated (1), Scheduled (1), Followup (1), Pending (1)
- There is **NO campaign filter** -- confirmed as previously identified in PE-TEAMBOX-01
- No way to filter or search by campaign name/ID
- Screenshot: `screenshots/13-teambox-filters-no-campaign.png`

### UC-17: Campaign context in conversation thread
**NOT VERIFIED**
- Could not identify a campaign-originated conversation to click
- Conversations in the list do not show campaign origin badges
- Without a campaign filter, finding campaign conversations requires manual scrolling through 600+ conversations

### UC-18: Disconnect Campaign button
**NOT FOUND ON NON-CAMPAIGN CONVERSATIONS**
- Checked conversation detail view for "Disconnect Campaign" button
- Button search returned zero results on the test conversation opened
- This is expected -- the button would only appear on campaign-linked conversations
- The info text on the Campaigns page references this feature: "Individual conversations can also be disconnected from campaigns in TeamBox"
- Screenshot: `screenshots/12-teambox-conversation-detail.png`

---

## Phase 5: Peripheral (UC-19 through UC-21)

### UC-19: Agents tab -- service agents
**PASS**
- Agents tab shows "Service Agents" heading
- One agent displayed: **Nancy Gaston** (voice)
  - Green status indicator (active/online)
  - Settings gear icon
  - Description: "Serra Service AI Agent (Nancy Gaston). Handles service appointments, recall..."
- Screenshot: `screenshots/07-agents-tab.png`

### UC-20: Calendar tab -- service appointments
**PASS**
- Calendar tab shows April 2026 monthly calendar view
- Today (April 6) is highlighted
- **Sync Sources** button visible
- **New Appointment** button visible (blue)
- No appointments displayed for the current month
- Screenshot: `screenshots/08-calendar-tab.png`

### UC-21: Trigger configuration
**NOT ACCESSIBLE**
- No "Trigger" or "Automation" text found on the Service page
- No trigger configuration tab or section visible
- Schedule functionality exists per-campaign via the Schedule button (`button-schedule-campaign-{id}`) in the Actions column -- but this is campaign-level scheduling, not trigger configuration
- Screenshot: `screenshots/09-insights-tab.png`

---

## Summary Statistics

| Phase | Use Cases | Pass | Observation | Not Verified | Missing |
|-------|-----------|------|-------------|--------------|---------|
| 1. Campaign Setup | UC-01 to UC-05 | 5 | 0 | 0 | 0 |
| 2. CSV Upload | UC-06 to UC-09 | 2 | 2 | 0 | 0 |
| 3. Campaign Detail | UC-10 to UC-14 | 4 | 1 | 0 | 0 |
| 4. TeamBox Continuity | UC-15 to UC-18 | 0 | 0 | 2 | 2 |
| 5. Peripheral | UC-19 to UC-21 | 2 | 0 | 0 | 1 |
| **Total** | **21** | **13** | **3** | **2** | **3** |

---

## Screenshots Index

| File | Description |
|------|-------------|
| 01-dashboard-logged-in.png | Dashboard after auto-login as Serra Honda |
| 02-service-page-initial.png | Service page with tour overlay |
| 03-service-page-full.png | Service page full view -- Campaigns tab active |
| 04-new-campaign-dialog.png | Create Service Campaign dialog |
| 05-csv-upload-area.png | Campaign toolbar with CSV Template, Upload CSV, New Campaign buttons |
| 06-campaign-detail-view.png | Campaign detail modal (Service Reminder - February) |
| 07-agents-tab.png | Service Agents tab -- Nancy Gaston voice agent |
| 08-calendar-tab.png | Calendar tab -- April 2026 |
| 09-insights-tab.png | Service Insights/Metrics tab |
| 10-teambox-overview.png | TeamBox sidebar with channel counts |
| 11-teambox-sms-channel.png | TeamBox SMS channel conversation list |
| 12-teambox-conversation-detail.png | TeamBox conversation detail (non-campaign) |
| 13-teambox-filters-no-campaign.png | TeamBox filter options (no campaign filter) |
