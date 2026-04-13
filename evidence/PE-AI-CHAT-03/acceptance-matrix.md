# PE-AI-CHAT-03 — Acceptance Matrix

**Date:** 2026-04-07
**User:** serra_honda@huminic.ai (Organization Admin, Serra Honda)

---

| AC | Description | Result | Evidence Reference | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Section/page function map in interface terms | PASS | section-function-map.md (pre-existing, comprehensive) | Covers all 8 sections: top bar, sidebar, metric tiles, drill-downs, contact detail, chat thread, chat input, suggestion chips. Every element documented with function, data source, and test IDs. |
| AC2 | Chat response auto-scroll and rendering evaluated | PASS with findings | F2-chat-before-send.png, F2-chat-after-response.png, F2-escalation-question-response.png | Chat sends and receives. AI response is coherent and contextual (references real sync issues). Markdown renders (bold text). Copy/Regenerate buttons present. Auto-scroll works on first exchange. Second exchange has viewport clipping issue where suggestion chips obscure content. |
| AC3 | Store switching + metric plausibility evaluated | BLOCKED (by design) | F3-profile-menu-no-store-switch.png, F3-store-switch-not-available.png | org_admin user (serra_honda) is correctly scoped to single org. No store switcher available. This is RBAC working as designed. Would require partner_admin or super_admin account to test store switching. Metrics are plausible for the single org visible. |
| AC4 | Metric tiles + drill-down truth evaluated | PASS with bugs | F4-metric-tiles-overview.png, F4-active-pipeline-drilldown.png, F4-appointments-today-drilldown.png, F4-open-escalations-drilldown.png, F4-outbound-sent-drilldown.png | All 4 tiles clickable. All 4 drill-downs open with correct table schemas. Counts match tile values (107, 0, 262, 1). BUG: Vehicle column shows API URLs. BUG: Outbound recipient is blank. Many pipeline leads have blank names. |
| AC5 | Contact detail actionability evaluated | PASS with bugs | F6-contact-detail-thomas-wheeler.png | Contact detail for Thomas Wheeler shows: name, phone (6823513858), email (fortwheeler@gmail.com), status badge, Call/Text buttons. BUG: Vehicle of Interest displays raw VIN Solutions API URL instead of vehicle description. Phone number lacks formatting. |
| AC6 | Every flow has evidence, commentary, result status | PASS | use-case-inventory.md, evidence-index.md, this file | All 7 flows (F1-F7) executed. 11 use cases documented with evidence. 8 commentary questions answered per flow (see flow commentary below). |
| AC7 | Bugs logged with severity and false-pass classification | PASS | bug-log.md | 5 bugs logged: 1 high (vehicle URL display), 1 high (AI-dashboard data gap), 1 medium (blank outbound recipient), 1 medium (blank lead names), 1 low (phone formatting). |
| AC8 | Post-sprint confidence assessment | PASS | See bottom of this file | Confidence assessment provided with per-section ratings. |

---

## Flow Commentary (8 Questions per Flow)

### F1: Dashboard Load

1. **What function/behavior was under evaluation?** Initial page load after login -- what does the operator see first?
2. **Why does it matter?** The dashboard is the trust anchor. If it looks broken or empty on first load, operator confidence collapses.
3. **What should have happened?** Page loads with metric tiles, chat interface, and suggestion chips. No errors.
4. **What actually happened?** Page loaded correctly. 4 metric tiles displayed with live values (107, 0, 262, 1). Chat input present with suggestion chips. "AI KEY METRICS" heading visible. Sidebar navigation fully populated. Top bar shows org name, notification badge (591), and user avatar.
5. **What evidence proves that?** F1-dashboard-load-full.png (full page screenshot), DOM snapshot confirming all elements present.
6. **Does the data look believable?** Yes. Active Pipeline 107 is reasonable for a Honda dealership. Appointments 0 is plausible (could be end of day or no appointments). Escalations 262 is high but explained by CommGate blocking. Outbound 1 is low but consistent with blocked sends.
7. **Does this satisfy acceptance criteria?** Yes (AC1, partial AC4).
8. **If not, what is broken?** N/A -- dashboard load is clean.

**Result: Accepted**

### F2: AI Chat

1. **What function/behavior was under evaluation?** Sending messages to AI chat and receiving coherent, data-aware responses.
2. **Why does it matter?** AI chat is the primary interaction surface. If it can't answer business questions with real data, it's a demo, not a tool.
3. **What should have happened?** User sends question, AI responds with real data from the dealership's CRM/metrics. Response renders as Markdown, auto-scrolls.
4. **What actually happened?** First question ("How many leads came in this week?") received a coherent response that honestly reported sync issues and N/A data. Second question ("What are the top escalations right now?") received a response saying "I don't have a dedicated escalation queue" -- yet the Open Escalations tile on the same page shows 262 records. The AI is not aware of dashboard metric data.
5. **What evidence proves that?** F2-chat-after-response.png (first response), F2-escalation-response-visible.png (second response), DOM snapshot text of both responses.
6. **Does the data look believable?** The AI's honesty about sync issues is good. But the disconnect between AI knowledge and dashboard data (escalations) is a credibility gap.
7. **Does this satisfy acceptance criteria?** Partially. Chat renders and streams correctly (AC2 pass). But AI lacks awareness of visible dashboard data (data integrity concern).
8. **If not, what is broken?** The AI chat backend does not have access to the same pipeline/escalation data that the metric tiles display. This means the AI cannot answer questions about data the operator can see on the same page.

**Result: Accepted with risk**

### F3: Store Switching

1. **What function/behavior was under evaluation?** Switching between stores/organizations to see different metric data.
2. **Why does it matter?** Multi-store operators need to compare performance across locations.
3. **What should have happened?** A store selector allows switching between orgs, causing metrics to refresh.
4. **What actually happened?** The serra_honda@huminic.ai account is an org_admin scoped to Serra Honda only. No store switching UI is available. The profile menu confirms "Organization Admin" role. The globe button opens a public page, not a store switcher.
5. **What evidence proves that?** F3-profile-menu-no-store-switch.png, F3-store-switch-not-available.png, DOM snapshot of profile menu.
6. **Does the data look believable?** Yes -- RBAC correctly restricts org_admin to their own org.
7. **Does this satisfy acceptance criteria?** AC3 cannot be fully evaluated with this account. Would need partner_admin (duanekwells@gmail.com) or super_admin account.
8. **If not, what is broken?** Nothing is broken. The test account lacks permissions for this flow.

**Result: Blocked (by design -- requires higher-privilege account)**

### F4: Metric Tiles

1. **What function/behavior was under evaluation?** All 4 metric tiles: correct display, click-to-drill-down behavior.
2. **Why does it matter?** Metric tiles are the operator's at-a-glance health check. Wrong numbers or broken drill-downs erode trust.
3. **What should have happened?** Each tile shows a label, value, trend, and "live" badge. Clicking opens a drill-down dialog with matching data.
4. **What actually happened?** All 4 tiles rendered correctly with gradient backgrounds, icons, values, and "live" badges. All 4 are clickable and open drill-down dialogs. Tile values match drill-down record counts exactly. But the Active Pipeline drill-down shows API URLs in the Vehicle column, and many leads have blank names.
5. **What evidence proves that?** F4-metric-tiles-overview.png, F4-active-pipeline-drilldown.png, F4-appointments-today-drilldown.png, F4-open-escalations-drilldown.png, F4-outbound-sent-drilldown.png.
6. **Does the data look believable?** Tile counts are internally consistent (107 pipeline, 0 appointments, 262 escalations, 1 outbound). The high escalation count is explained by CommGate blocking. The low outbound count is consistent with blocked sends.
7. **Does this satisfy acceptance criteria?** Yes with bugs (AC4).
8. **If not, what is broken?** Vehicle column data mapping is broken (shows API URLs). Lead name enrichment is incomplete (many blanks).

**Result: Accepted with risk**

### F5: Drill-Down Truth

1. **What function/behavior was under evaluation?** Whether drill-down modals show real data or empty shells.
2. **Why does it matter?** A drill-down that opens but shows no useful data is a false pass -- it looks functional but isn't.
3. **What should have happened?** Each drill-down shows actionable records with real customer data.
4. **What actually happened?** Active Pipeline: real data with names, statuses, lead IDs, and View Contact buttons. But vehicle column broken (API URLs) and many names are blank. Appointments: genuinely empty (consistent with 0 tile). Escalations: 262 real records but ALL are identical ("Unsent SMS -- blocked"). Outbound: 1 real record but recipient info is completely blank.
5. **What evidence proves that?** F4-active-pipeline-drilldown.png, F5-pipeline-drilldown-scrolled.png, F4-open-escalations-drilldown.png, F4-outbound-sent-drilldown.png.
6. **Does the data look believable?** Mixed. Pipeline data is real but incomplete. Escalation data is real but monotonous (262 identical entries suggest systemic issue, not individual problems). Outbound data exists but is non-actionable without recipient info.
7. **Does this satisfy acceptance criteria?** Partially (AC4). The data is real, not fabricated, but data quality issues reduce actionability.
8. **If not, what is broken?** (a) Vehicle field stores API URL, not vehicle description. (b) Lead name enrichment misses many records. (c) Outbound message recipient not populated. (d) Escalation data lacks differentiation.

**Result: Accepted with risk**

### F6: Contact Detail

1. **What function/behavior was under evaluation?** Contact detail view -- is the info actionable for an operator?
2. **Why does it matter?** If the operator clicks "View Contact" and gets nothing useful, the drill-down is a dead end.
3. **What should have happened?** Contact detail shows name, phone, email, vehicle interest, location, with Call/Text action buttons.
4. **What actually happened?** Thomas Wheeler's contact detail showed: name (Thomas Wheeler), phone (6823513858), email (fortwheeler@gmail.com), status badge (ACTIVE_WAITING_FOR_PROSPECT_RESPONSE). Call and Text buttons enabled. Back button works. BUT: Vehicle of Interest shows raw API URL. Phone number lacks formatting (no parentheses/dashes). Status uses raw API enum value, not human-friendly label.
5. **What evidence proves that?** F6-contact-detail-thomas-wheeler.png, DOM snapshot showing all contact fields.
6. **Does the data look believable?** Yes -- the contact data (name, phone, email) appears to be real CRM data from VIN Solutions.
7. **Does this satisfy acceptance criteria?** Partially (AC5). Contact is actionable (can call/text) but vehicle info is broken and presentation could be more polished.
8. **If not, what is broken?** Vehicle of Interest field stores API URL reference instead of resolved vehicle description. Phone formatting is raw digits. Status label is raw API enum.

**Result: Accepted with risk**

### F7: Data Plausibility

1. **What function/behavior was under evaluation?** Cross-referencing metrics for internal consistency and plausibility.
2. **Why does it matter?** If numbers contradict each other, the operator can't trust any of them.
3. **What should have happened?** All metric values are internally consistent, drill-down counts match tile values, and the AI chat can reference the same data.
4. **What actually happened?** Tile-to-drill-down consistency is perfect: 107=107, 0=0, 262=262, 1=1. However, the AI chat is NOT aware of dashboard data (asked about escalations, AI said it has no escalation queue despite 262 being visible). The 262 escalations being all identical "Unsent SMS -- blocked" suggests a systemic CommGate issue that inflates the count. The outbound count of 1 with blank recipient is suspicious.
5. **What evidence proves that?** All F4 drill-down screenshots showing matching counts. DOM snapshots of AI responses claiming no data.
6. **Does the data look believable?** Tile values are internally consistent but the escalation count is inflated by a systemic issue rather than representing 262 distinct problems. The AI-dashboard data gap undermines the value proposition.
7. **Does this satisfy acceptance criteria?** Partially. Numbers are consistent (good) but the AI-dashboard disconnect is a significant trust gap (bad).
8. **If not, what is broken?** (a) AI chat backend lacks access to pipeline/escalation metric data. (b) Escalation count inflated by repetitive CommGate blocks. (c) Outbound recipient data not populated.

**Result: Accepted with risk**

---

## Confidence Assessment (AC8)

| Dimension | Rating | Rationale |
|-----------|--------|-----------|
| Data Accuracy | 6/10 | Tile counts match drill-downs (good). But vehicle data is broken (API URLs), many lead names are blank, outbound recipient is blank, escalation data is monotonous. |
| UI Behavior | 8/10 | Page loads cleanly, all tiles clickable, drill-downs open, contact detail renders, chat sends/receives, no console errors. Minor: suggestion chips don't auto-send, viewport clipping on second message. |
| Workflow Integrity | 5/10 | The AI chat cannot access the data displayed by the metric tiles on the same page. This is the biggest integrity gap -- the operator sees 262 escalations but the AI says it has no escalation data. |
| Overall | 6/10 | The dashboard is visually solid and the framework is functional. But data quality issues (vehicle URLs, blank fields) and the AI-dashboard data disconnect significantly reduce operational value. The platform looks good but doesn't yet deliver trustworthy intelligence through the chat interface. |

### False-Pass Assessment

The dashboard would PASS a casual visual inspection (tiles render, numbers appear, drill-downs open). But deeper evaluation reveals:
1. Vehicle data is API URLs, not human-readable (false pass: "data renders but is implausible")
2. AI says "no data" while the tile shows 262 records (false pass: "first half works but downstream breaks")
3. Outbound message has no recipient (false pass: "DOM presence exists but operator experience is broken")

These are not blocking issues for launch but are trust-eroding issues that should be remediated.
