# PE-AI-CHAT-03 — Bug Log

**Date:** 2026-04-07

---

| Bug ID | Severity | Type | False-Pass Class | Description | Evidence | Flow |
|--------|----------|------|------------------|-------------|----------|------|
| BUG-CHAT03-001 | HIGH | Data Display | "Data renders but is implausible" | Vehicle of Interest column in Active Pipeline drill-down and Contact Detail view displays raw VIN Solutions API URLs (e.g., `https://api.vinsolutions.com/vehicles/interest/id/1994925450-0`) instead of human-readable vehicle descriptions (e.g., "2024 Honda Civic"). The `vehicleOfInterest` field in warehouse_leads stores the API URL rather than the resolved vehicle name. | F4-active-pipeline-drilldown.png, F6-contact-detail-thomas-wheeler.png | F4, F5, F6 |
| BUG-CHAT03-002 | HIGH | Data Disconnect | "First half works but downstream breaks" | AI chat says "I don't have a dedicated escalation queue or ticketing system connected" when asked about top escalations, while the Open Escalations metric tile on the same page shows 262 records with full drill-down data. The AI backend does not have access to the pipeline metrics/escalation data that the dashboard API serves. The operator sees 262 escalations on screen but the AI claims ignorance of them. | F2-escalation-question-response.png, F4-open-escalations-drilldown.png | F2, F7 |
| BUG-CHAT03-003 | MEDIUM | Data Display | "DOM presence exists but operator experience is broken" | Outbound Sent 24h drill-down shows 1 record but Recipient, Phone, and Email fields are all blank (dashes). The email was sent but there is no indication of who received it. The record exists but is non-actionable -- the operator cannot identify the recipient or follow up. | F4-outbound-sent-drilldown.png | F4, F5 |
| BUG-CHAT03-004 | MEDIUM | Data Completeness | "Data renders but is implausible" | Many leads in the Active Pipeline drill-down have blank customer names (displayed as dashes). When scrolling through the 100 visible records, a significant portion (estimated 30-50%) show no name. The name enrichment process that resolves VIN Solutions lead IDs to customer names is not completing for all records. | F5-pipeline-drilldown-scrolled.png | F5 |
| BUG-CHAT03-005 | LOW | UI Polish | N/A | Phone numbers in Contact Detail view display as raw unformatted digits (e.g., "6823513858") instead of formatted US phone numbers (e.g., "(682) 351-3858"). Lead status badges display raw API enum values (e.g., "ACTIVE_WAITING_FOR_PROSPECT_RESPONSE") instead of human-friendly labels (e.g., "Waiting for Response"). These are cosmetic issues that reduce the professional feel of the interface. | F6-contact-detail-thomas-wheeler.png | F6 |

---

## Summary

- **Critical:** 0
- **High:** 2 (vehicle URL display, AI-dashboard data gap)
- **Medium:** 2 (blank outbound recipient, blank lead names)
- **Low:** 1 (phone formatting, status label formatting)

## Remediation Recommendations

1. **BUG-CHAT03-001 (HIGH):** Resolve the `vehicleOfInterest` field during VIN Solutions sync. When fetching lead data, follow the vehicle interest URL to get the actual vehicle description (year/make/model) and store that instead of (or alongside) the API URL.

2. **BUG-CHAT03-002 (HIGH):** Give the AI chat backend access to the pipeline metrics API. When the user asks about escalations, leads, or appointments, the AI should be able to query the same `/api/metrics/pipeline` and `/api/metrics/pipeline/details` endpoints that the dashboard uses.

3. **BUG-CHAT03-003 (MEDIUM):** Populate the recipient fields in the outbound_messages table when sending via Resend or other channels. The `customerName`, `customerPhone`, and `customerEmail` fields should be filled from the conversation/contact context at send time.

4. **BUG-CHAT03-004 (MEDIUM):** Improve the lead name enrichment process. Either make it synchronous during sync (fetch contact name as part of lead import) or run the background enrichment more aggressively to fill gaps.

5. **BUG-CHAT03-005 (LOW):** Add phone number formatting utility (e.g., `(XXX) XXX-XXXX` for US numbers). Map VIN Solutions status enums to human-friendly labels in a lookup table.
