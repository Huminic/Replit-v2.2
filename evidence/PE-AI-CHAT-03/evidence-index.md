# PE-AI-CHAT-03 — Evidence Index

**Date:** 2026-04-07

---

| Artifact | Type | Flow | What It Proves |
|----------|------|------|----------------|
| F1-dashboard-load-full.png | Screenshot (full page) | F1 | Dashboard loads correctly with all 4 metric tiles, chat input, suggestion chips, sidebar nav. No visual errors. |
| F2-chat-before-send.png | Screenshot (viewport) | F2 | Pre-send state: metric tiles visible, chat input empty, suggestion chips present. |
| F2-chat-after-response.png | Screenshot (full page) | F2 | AI responded to "How many leads came in this week?" with coherent text about sync issues. User bubble right-aligned (blue), bot bubble left-aligned. Copy/Regenerate buttons visible. |
| F2-suggestion-chip-response.png | Screenshot (full page) | F2 | Suggestion chip "What are the top escalations right now?" pre-filled in input but NOT auto-submitted. |
| F2-escalation-question-response.png | Screenshot (full page) | F2 | Second AI response visible in DOM: "I don't have a dedicated escalation queue" -- contradicts 262 escalations on tile. |
| F2-escalation-response-visible.png | Screenshot (viewport) | F2 | Viewport after second exchange -- shows viewport clipping issue where older messages are not easily visible. |
| F3-profile-menu-no-store-switch.png | Screenshot (viewport) | F3 | Profile menu shows: "Serra Honda Admin", "serra_honda@huminic.ai", "Organization Admin". No store switcher option. |
| F3-store-switch-not-available.png | Screenshot (viewport) | F3 | Dashboard view confirming no org switching UI for org_admin role. |
| F4-metric-tiles-overview.png | Screenshot (full page) | F4 | All 4 metric tiles expanded: Active Pipeline 107, Appointments Today 0, Open Escalations 262, Outbound Sent 24h 1. |
| F4-active-pipeline-drilldown.png | Screenshot (viewport) | F4/F5 | Active Pipeline drill-down: 107 records, table with Name/Status/Vehicle/Lead ID/View Contact. Vehicle column shows API URLs (BUG). |
| F5-pipeline-drilldown-scrolled.png | Screenshot (viewport) | F5 | Scrolled view of pipeline drill-down showing leads with blank names (dashes) and ACTIVE_NEW_LEAD statuses. |
| F4-appointments-today-drilldown.png | Screenshot (viewport) | F4/F5 | Appointments Today drill-down: 0 records, "No records found" message. Consistent with tile value. |
| F4-open-escalations-drilldown.png | Screenshot (viewport) | F4/F5 | Open Escalations drill-down: 262 records, all showing "Unsent SMS -- blocked" / unsent_message / medium / 4/7/2026. |
| F4-outbound-sent-drilldown.png | Screenshot (viewport) | F4/F5 | Outbound Sent 24h drill-down: 1 record, Recipient/Phone/Email all blank, Channel=email, Sent=07:55 AM. |
| F6-contact-detail-thomas-wheeler.png | Screenshot (viewport) | F6 | Contact detail: Thomas Wheeler, phone 6823513858, email fortwheeler@gmail.com, Vehicle of Interest = API URL (BUG). Call/Text buttons present. |
| section-function-map.md | Document | F1 | Comprehensive section-function map covering all 8 page sections with data sources, test IDs, and API endpoints. |
| use-case-inventory.md | Document | All | 11 use cases documented with expected/actual behavior and result status. |
| acceptance-matrix.md | Document | All | 8 ACs mapped to results with evidence references and flow commentary (8 questions per flow). |
| bug-log.md | Document | All | 5 bugs logged with severity, false-pass classification, and evidence. |
| workflow-audit.log | Log | All | Timestamped entries for every action taken during evaluation. |
