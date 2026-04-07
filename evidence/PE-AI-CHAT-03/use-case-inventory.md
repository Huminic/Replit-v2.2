# PE-AI-CHAT-03 — Use Case Inventory (Execution Results)

**Date:** 2026-04-07
**User:** serra_honda@huminic.ai (Organization Admin, Serra Honda)

---

| UC ID | Description | Flow | Expected Behavior | Actual Behavior | Result |
|-------|-------------|------|-------------------|-----------------|--------|
| UC-CHAT-01 | Send message and receive AI response | F2 | User message appears right-aligned. AI streams response. Auto-scroll works. | User message appeared right-aligned in blue bubble. AI responded with coherent, contextual text about sync issues. Response rendered with Markdown (bold text). Copy/Regenerate buttons appeared. | Accepted |
| UC-CHAT-02 | Auto-scroll on new messages | F2 | ScrollArea scrolls to bottom when new messages appear | Chat area scrolled to show latest content after response completed. However, when second message sent, the first exchange scrolled up and the viewport showed suggestion chips over the response area, making it hard to see the full second response. | Accepted with risk |
| UC-CHAT-03 | Store switching changes metrics | F3 | Metric tiles reload with new org's data when switching stores | org_admin (serra_honda) is locked to single org. No store switcher available. This is correct RBAC behavior. Cannot test metric change on org switch with this account. | Blocked (by design) |
| UC-CHAT-04a | Click Active Pipeline tile drill-down | F4/F5 | Dialog opens with lead table, count matches tile | Dialog opened. Title: "Active Pipeline". Count: 107 (matches tile). Table showed Name, Status, Vehicle, Lead ID, View Contact. Data loaded with real lead names and VIN Solutions IDs. However, Vehicle column displays raw API URLs instead of vehicle descriptions. | Accepted with risk |
| UC-CHAT-04b | Click Appointments Today tile drill-down | F4/F5 | Dialog opens with appointment table | Dialog opened. Title: "Appointments Today". Count: 0. "No records found" displayed. Consistent with tile value of 0. | Accepted |
| UC-CHAT-04c | Click Open Escalations tile drill-down | F4/F5 | Dialog opens with escalation table | Dialog opened. Title: "Open Escalations". Count: 262 (matches tile). All 100 visible rows are identical: "Unsent SMS -- blocked" / unsent_message / medium / 4/7/2026. Data is real but monotonous. | Accepted with risk |
| UC-CHAT-04d | Click Outbound Sent 24h tile drill-down | F4/F5 | Dialog opens with outbound message table | Dialog opened. Title: "Outbound Sent 24h". Count: 1 (matches tile). Single row: Recipient/--, Phone/--, Email/--, Channel/email, Sent/07:55 AM. Recipient info is blank. | Accepted with risk |
| UC-CHAT-05 | Contact detail is actionable | F6 | Contact shows name, phone, email, vehicle. Call/Text buttons work. | Thomas Wheeler: name displayed, phone (6823513858), email (fortwheeler@gmail.com) present. Status badge shown. Vehicle of Interest shows raw API URL (bug). Call and Text buttons enabled and present. Back button works. | Accepted with risk |
| UC-CHAT-07 | Suggestion buttons populate input | F2 | Click chip fills textarea and focuses it | Clicked "What are the top escalations right now?" chip. Text was inserted into input field. Input was focused. However, chip does NOT auto-send -- user must click send button separately. | Accepted |
| UC-CHAT-08 | Data plausibility across metric tiles | F7 | Tile values are non-negative, reasonable, internally consistent | Active Pipeline: 107 (plausible for 14-day window). Appointments Today: 0 (plausible). Open Escalations: 262 (high but explained by CommGate blocking). Outbound Sent 24h: 1 (low but plausible with CommGate active). All drill-down counts match tile values exactly. | Accepted with risk |
| UC-CHAT-09 | AI chat data awareness gap | F2/F7 | AI should be aware of data visible on the same page | Asked about escalations. AI responded "I don't have a dedicated escalation queue." Yet the Open Escalations tile on the same page shows 262 records. The AI lacks access to the same data the dashboard displays. | Rejected |
