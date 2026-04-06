# Use Case Inventory: PE-SERVICE-CAMPAIGNS-01

**Date:** 2026-04-06
**Target:** https://live.huminic.app/service
**Login:** serra_honda@huminic.ai (org_admin, Serra Honda)

---

## Phase 1: Campaign Setup

### UC-01: Navigate to Service Campaigns Tab
- **Action:** Navigate to /service, verify Campaigns tab is default
- **Expected:** Page loads with campaign table, header buttons (New Campaign, Upload CSV, CSV Template)
- **Evidence needed:** Screenshot of campaign tab landing state

### UC-02: Create New Campaign
- **Action:** Click "New Campaign", fill name, select channel(s), enter template, submit
- **Expected:** Dialog opens with name input, channel checkboxes (SMS/Email/Phone), template textarea. Submit creates campaign(s) and shows in table.
- **Evidence needed:** Screenshot of dialog, toast confirmation, new row in table

### UC-03: Multi-Channel Campaign Creation
- **Action:** Select multiple channels (e.g., SMS + Email), submit
- **Expected:** Creates one campaign per channel (e.g., "Test Campaign (SMS)" and "Test Campaign (EMAIL)")
- **Evidence needed:** Screenshot showing multiple rows created

### UC-04: Campaign Detail Dialog
- **Action:** Click a campaign row
- **Expected:** Detail dialog shows status, channel, recipients, sent, replied, kill switch status, CSV filename, message template
- **Evidence needed:** Screenshot of detail dialog

---

## Phase 2: CSV Upload

### UC-05: Download CSV Template
- **Action:** Click "CSV Template" download link
- **Expected:** Browser downloads campaign-template.csv file
- **Evidence needed:** File download confirmation, template contents

### UC-06: Upload CSV to Campaign
- **Action:** Click upload button on a campaign row, select valid CSV file
- **Expected:** Toast shows recipient count loaded. Campaign table updates recipientCount. CSV filename appears in campaign row.
- **Evidence needed:** Screenshot of toast, updated table row

### UC-07: Upload CSV with Missing Required Columns
- **Action:** Upload CSV missing First Name or Email column
- **Expected:** Error toast with specific missing column names
- **Evidence needed:** Screenshot of error message

### UC-08: Upload CSV with Optional Column Warnings
- **Action:** Upload CSV with required columns but missing optional ones (VIN, Model, etc.)
- **Expected:** Success with warnings listing missing optional columns
- **Evidence needed:** Screenshot of warning toast

### UC-09: Bulk CSV Upload (Header Button)
- **Action:** Click "Upload CSV" in header (not on a campaign row)
- **Expected:** File picker opens. Behavior when no campaign is selected — investigate.
- **Evidence needed:** Screenshot of behavior, any error handling

---

## Phase 3: Campaign Execution

### UC-10: Execute Campaign (Dry Run)
- **Action:** Click Eye (dry run) button on a campaign with recipients
- **Expected:** Toast "Dry Run Started — Preview mode". Execution status badge appears with progress counter.
- **Evidence needed:** Screenshot of progress badge, dry run indicator

### UC-11: Execute Campaign (Live)
- **Action:** Click Play button on a campaign with recipients
- **Expected:** Toast "Campaign Started". Progress badge shows processed/total. Messages actually sent (IRREVERSIBLE — requires operator approval).
- **Evidence needed:** Screenshot of execution, provider confirmation
- **GATE:** This is an IRREVERSIBLE action. Must get operator approval before live execution.

### UC-12: Stop Campaign Execution
- **Action:** Click Stop button during execution
- **Expected:** Toast "Campaign Stopped". Execution halts. Badge disappears.
- **Evidence needed:** Screenshot of stop confirmation

### UC-13: Schedule Campaign
- **Action:** Click Calendar button, select future datetime, confirm
- **Expected:** Toast "Campaign Scheduled". Campaign status changes to "scheduled".
- **Evidence needed:** Screenshot of schedule dialog, confirmation toast, status change

### UC-14: Kill Switch Toggle
- **Action:** Toggle kill switch on a campaign
- **Expected:** Switch flips to red (unchecked = kill active). Attempting to execute blocked campaign returns error.
- **Evidence needed:** Screenshot of kill switch states, execution block behavior

### UC-15: Communications Paused Badge
- **Action:** Verify badge behavior when global communication gate is OFF
- **Expected:** Destructive "Communications Paused" badge appears in header
- **Evidence needed:** Screenshot (if commgate is off) or note if commgate is on

---

## Phase 4: TeamBox Continuity

### UC-16: Campaign Reply Appears in TeamBox
- **Action:** After campaign sends message, simulate or observe inbound reply
- **Expected:** Reply creates conversation in TeamBox with campaignId set
- **Evidence needed:** TeamBox conversation with campaign association visible
- **GATE:** Depends on live execution (UC-11) or existing campaign conversations

### UC-17: Campaign Filter in TeamBox
- **Action:** Attempt to filter TeamBox conversations by campaign
- **Expected:** KNOWN MISSING — PE-TEAMBOX-01 BUG: No campaign filter exists in TeamBox
- **Evidence needed:** Screenshot confirming filter absence (cross-reference PE-TEAMBOX-01)

### UC-18: Message Accuracy in TeamBox
- **Action:** Open a campaign-originated conversation in TeamBox, verify message content
- **Expected:** Sent message matches campaign template with personalization tokens resolved
- **Evidence needed:** Screenshot of conversation thread showing sent message

---

## Phase 5: Peripheral Checks

### UC-19: Service Metrics Tiles (Insights Sub-Tab)
- **Action:** Switch to Insights tab within Service page
- **Expected:** 6 metric tiles: Active Campaigns, Messages Sent, Replies Received, Open Conversations, Total Conversations, Reply Rate. Plus embedded InsightsPage.
- **Evidence needed:** Screenshot of metrics tiles

### UC-20: Campaign Safety Card
- **Action:** Verify safety card renders and can be dismissed
- **Expected:** Amber card explaining kill switch. X button dismisses permanently (localStorage).
- **Evidence needed:** Screenshot before and after dismiss

### UC-21: RBAC — Campaign Creation Requires Role 3+
- **Action:** Verify that campaign creation API requires role 3+ (org_admin or higher)
- **Expected:** org_admin (role 3) can create. Lower roles cannot.
- **Evidence needed:** API response or UI state for authorized user

---

## Summary

| Phase | Use Cases | Risk | Notes |
|-------|-----------|------|-------|
| Campaign Setup | UC-01 through UC-04 | LOW | Standard CRUD UI |
| CSV Upload | UC-05 through UC-09 | MEDIUM | File parsing, column matching, error handling |
| Execution | UC-10 through UC-15 | HIGH | Live execution is IRREVERSIBLE; kill switch is safety-critical |
| TeamBox Continuity | UC-16 through UC-18 | HIGH | Depends on live data; campaign filter known missing |
| Peripheral | UC-19 through UC-21 | LOW | Metrics display, safety card, RBAC |
