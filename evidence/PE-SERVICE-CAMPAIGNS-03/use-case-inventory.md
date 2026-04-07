# Use-Case Inventory: Service Campaigns (Round 3)

**Date:** 2026-04-07
**Method:** API observation + code review + prior screenshot review

---

## Observed Use Cases

| ID | Use Case | Observed? | Method | Notes |
|----|----------|-----------|--------|-------|
| UC-01 | View service campaigns list | Yes | API + Screenshot | 3 campaigns visible: Vehicle Merge Test (draft), Service Reminder - February (active), Oil Change Reminder (paused) |
| UC-02 | View campaign detail (click row) | Yes | Screenshot (PE-02) | Shows status, channel, recipients, sent, replied, kill switch, CSV file |
| UC-03 | View campaign recipients | Yes | API | 16 recipients for Feb campaign, 1 for Merge Test, 0 for Oil Change |
| UC-04 | Create new campaign (form view) | Yes | Screenshot (PE-01) | Name, channel checkboxes (SMS/Email/Phone), message template textarea |
| UC-05 | CSV upload to campaign | Yes | Code + API | Upload area present, multer-based, parses 13-column format |
| UC-06 | Kill switch toggle | Yes | API + Code | Per-campaign toggle, PATCH endpoint, red styling when active |
| UC-07 | Execute campaign | NOT TESTED | Code review only | IRREVERSIBLE — Play button calls POST /execute with dryRun=false |
| UC-08 | Dry run campaign | Partially | API evidence | One dry run completed (f3684500): 1 recipient, 1 sent, 0 failed |
| UC-09 | Schedule campaign | NOT TESTED | Code review only | Calendar button opens datetime picker dialog |
| UC-10 | Stop campaign execution | NOT TESTED | Code review only | Square button visible during execution |
| UC-11 | View service agents | Yes | API + Screenshot | 2 agents: Nancy Gaston (chat+sms, +18339785374), Service Agent (chat) |
| UC-12 | View service metrics | Yes | API | Active: 1, Sent: 0, Replied: 0, Reply Rate: 0% |
| UC-13 | Campaign safety card | Yes | Screenshot (PE-02) | Amber card explaining kill switch, dismissible |
| UC-14 | Communications Paused badge | Not visible | API | communicationGateEnabled is None/null for Serra Honda |
| UC-15 | TeamBox campaign continuity | Partial | API | SMS conversations exist (3) but none have campaignId set |
| UC-16 | Download CSV template | Yes | Code | `/campaign-template.csv` download link present |
| UC-17 | View execution progress | Partial | API | execution-statuses endpoint returns data for one dry run |

---

## Blocked Use Cases (IRREVERSIBLE)

| ID | Use Case | Why Blocked | Approval Needed |
|----|----------|-------------|-----------------|
| UC-07 | Execute campaign (live send) | Would send real SMS via TextMagic | Operator must approve target recipients and message content |
| UC-09 | Schedule campaign | Queues a future live send | Same as UC-07 |
| UC-10 | Stop campaign | Requires active execution to test | Depends on UC-07 |

---

## Data Quality Observations

1. **Test data cleanup successful:** PE-01 found 137 campaigns (mostly test pollution). Now only 12 total (3 service). DATA-CLEANUP sprints resolved BUG-04.
2. **Oil Change Reminder has 0 recipients despite recipientCount=234:** The recipientCount field may be stale from before cleanup, or recipients were deleted but count not updated.
3. **Service Reminder - February has duplicate recipients:** John Doe (5551234567) appears twice in the 16-recipient list with different creation timestamps. CSV re-upload without deduplication.
4. **All service campaigns have sentCount=0 and repliedCount=0:** No live execution has occurred.
5. **Vehicle Merge Test is new since PE-01:** Created 2026-04-07 with merge template using {{vehicleYear}} {{vehicleModel}} {{vin}} {{dealershipName}} variables.
