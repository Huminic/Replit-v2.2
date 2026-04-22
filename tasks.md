# Operational Tasks — LAUNCH-STABILIZE (HISTORICAL)

**Created:** 2026-04-13 02:00 UTC
**Sprint:** LAUNCH-STABILIZE (parked) — trigger work continues in TRG-RPT-001
**Apology to 7 customers:** resolved 2026-04-20 — customers waved it off, no action taken

---

## BUGS TO FIX (before any more trigger testing — carried into TRG-RPT-001)

### 2. Remove TCPA bypass from after-hours trigger
The `bypassBusinessHours: true` flag must be removed. After-hours trigger should QUEUE sends for next business hours window, not bypass TCPA.
- File: `server/services/triggerService.ts` line 276
- File: `server/outbound.ts` — keep the bypass option but don't use it from triggers

### 3. Remove `[trigger:after_hours_followup]` tag from customer-visible message
The dedup tag is appended to the SMS text and customers see it. Move dedup tracking to metadata/outbound_log, not the message body.
- File: `server/services/triggerService.ts` — message template at line 265

### 4. Add test-mode whitelist to trigger service
Before enabling triggers for any org, require a `triggerTestPhones` array in org settings. If set, ONLY send to those numbers. If not set and `triggersEnabled=true`, send to all qualifying leads.
- File: `server/services/triggerService.ts`

### 5. Disable triggers for Serra Honda (DONE? — verify)
- [ ] Verify `triggersEnabled: false` in Serra Honda org settings
- [ ] Verify no more trigger SMS are going out

---

## REMAINING LAUNCH WORK

### 6. Fix after-hours trigger to queue for morning
Instead of sending immediately outside business hours, schedule the send for the next business hours window (8 AM in org timezone).
- File: `server/services/triggerService.ts`
- File: `server/outbound.ts` (may need a scheduled send mechanism)

### 7. Fix bulk CSV upload button
Top-level "Upload CSV" button on service campaigns page sends to non-existent `/api/campaigns/bulk/upload-csv`. Either create the endpoint or fix the button to require campaign selection first.
- File: `client/src/pages/service.tsx` line 363

### 8. Verify 24-hour check-in trigger (during business hours)
Cannot test until 8 AM ET. Insert test lead, wait 10 min (test delay), verify SMS sends and notification email fires.

### 9. Full E2E walkthrough with operator
Run complete service campaign test end-to-end with operator supervising. This was interrupted by the trigger incident.

### 10. Commit all LAUNCH-STABILIZE code
After all fixes and testing complete, commit through governance harness.

---

## INCIDENT LOG

**INC-001: Unauthorized after-hours SMS to real customers**
- **When:** 2026-04-12 ~22:00 ET (02:00 UTC April 13)
- **What:** After-hours trigger sent SMS to 7 real Serra Honda customers + 2 test leads at 10 PM
- **Root cause:** Agent (Claude) enabled production triggers without test-mode scoping, then built a TCPA business-hours bypass to make the after-hours trigger work — removing a safety gate
- **Impact:** 7 real people received unsolicited after-hours SMS from Serra Honda
- **Remediation:** Apology SMS in the morning, remove TCPA bypass, add test-mode whitelist
- **Prevention:** Trigger testing must use whitelist. TCPA gates must not be bypassed. Agent must get explicit approval before enabling features that send to real customers.
