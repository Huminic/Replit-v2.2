# RELEASE CRITERIA — LIVING DOCUMENT
## Sales Automation Platform | Gap Queue & Release Gate Tracker
### Status: ACTIVE — Updated after each battery

---

## DOCUMENT PURPOSE

This is the **single source of truth** for all gaps, defects, and release blockers
identified during the test battery sequence. Every P0 and P1 gap found by any agent
in any battery MUST be logged here immediately.

This document is never deleted — it grows with each test run. It is the primary
artifact for the production go/no-go decision.

---

## HOW TO ADD A GAP ENTRY

```
| GAP-ID     | Battery | Component           | Severity | Description                    | Status     | Remediation                    | Re-Test Battery |
|------------|---------|---------------------|----------|--------------------------------|------------|--------------------------------|-----------------|
| GAP-B1-001 | B1      | Agent Config        | P0       | Lead Follow-Up agent missing   | OPEN       | Create agent per formula       | B1 re-run       |
```

Status Options: OPEN | IN PROGRESS | FIXED | RISK-ACCEPTED | CANNOT VERIFY

---

## SECTION 1: P0 CRITICAL BLOCKERS

These items BLOCK the current or next battery. Nothing proceeds past a P0 without
operator approval and documented risk acceptance.

| GAP-ID | Battery | Component | Severity | Description | Status | Remediation | Re-Test Battery |
|--------|---------|-----------|----------|-------------|--------|-------------|-----------------|
| (Populated as test batteries execute) | | | | | | | |

---

## SECTION 2: P1 HIGH-PRIORITY LAUNCH RISKS

These items allow batteries to proceed with documented risk but MUST be resolved
before production launch. All P1 items are mandatory re-tests in Battery 6.

| GAP-ID | Battery | Component | Severity | Description | Status | Remediation | Re-Test Battery |
|--------|---------|-----------|----------|-------------|--------|-------------|-----------------|
| (Populated as test batteries execute) | | | | | | | |

---

## SECTION 3: P2 SPRINT BACKLOG

These items do not block launch but are queued for the first post-launch sprint.

| GAP-ID | Battery | Component | Severity | Description | Status | Remediation | Target Sprint |
|--------|---------|-----------|----------|-------------|--------|-------------|---------------|
| (Populated as test batteries execute) | | | | | | | |

---

## SECTION 4: P3 ENHANCEMENT QUEUE

Minor issues and improvement opportunities. No launch impact.

| GAP-ID | Battery | Component | Severity | Description | Status | Notes |
|--------|---------|-----------|----------|-------------|--------|-------|
| (Populated as test batteries execute) | | | | | | |

---

## SECTION 5: REGRESSION VERIFICATION LOG (Battery 6)

For every P0/P1 that was marked FIXED before Battery 6 runs, the B6 team
performs a targeted re-test and records the result here.

| Original GAP-ID | Original Description | Re-Test TC | Result | Verified By | Timestamp |
|-----------------|---------------------|------------|--------|-------------|-----------|
| (Populated during Battery 6) | | | | | |

---

## SECTION 6: ANTICIPATED HIGH-PROBABILITY GAPS

Based on the complexity of this integration (VAPI + Tavus + TextMagic + VinSolutions
+ Unified Widget + Landing Pages + Calendar), the following gaps are **anticipated**
with HIGH probability. Pre-emptive remediation paths are documented here.

### ANTICIPATED GAP A: VinSolutions Lead Insertion Failure
**Probability:** HIGH
**Description:** The VAPI and/or Tavus webhook to VinSolutions API may fail due to
authentication errors, field mapping mismatches, or missing salesperson assignment.
**Pre-emptive Remediation:**
  1. Verify VinSolutions API credentials before Battery 1
  2. Test a manual POST to the leads endpoint before Battery 3 runs
  3. If API assignment fails, confirm whether VinSolutions allows manual trigger of
     lead routing rules — still test the TRIGGER flow even if assignment fails
  4. Document as GAP-ANTICIPATED-A if full assignment cannot be automated

### ANTICIPATED GAP B: Name Mismatch (VAPI / Tavus / Widget)
**Probability:** HIGH
**Description:** The Tavus persona, VAPI agent name, and Unified Widget display name
are likely NOT synchronized. This was original work — no evidence of it has been seen.
**Pre-emptive Remediation:**
  1. Battery 1 TC-1B-002 specifically checks persona consistency
  2. If mismatch found: update ALL THREE systems to the canonical name before Battery 2
  3. The canonical name is the name configured in the Tavus account that shares
     the same account name as the VAPI agent — verify this mapping exists at all
  4. Document the actual configured name and use it as the canonical name going forward

### ANTICIPATED GAP C: TextMagic API Not Wired for 2-Way SMS
**Probability:** HIGH
**Description:** The platform may be using Twilio for one-directional SMS but not
have TextMagic configured for the required 2-way conversations.
**Pre-emptive Remediation:**
  1. Pre-flight check MUST confirm TextMagic is active and can send TO 412.654.6500
  2. Send a test message via TextMagic to 412.654.6500 and confirm 2-way works
  3. If TextMagic is not configured: this is a P0 blocker. Escalate to operator.

### ANTICIPATED GAP D: 15-Minute Idle Trigger Not Configured
**Probability:** VERY HIGH
**Description:** The trigger that fires a VAPI call + TextMagic SMS when a lead sits
in VinSolutions for >15 minutes without activity is a complex trigger. High probability
it is not yet configured or connected.
**Pre-emptive Remediation:**
  1. Battery 1 TC-1C-002 must specifically test this time-based trigger
  2. If not configured: create a step-by-step configuration spec and attach to the gap
  3. If VinSolutions does not natively support this trigger: identify the middleware
     layer (Zapier, n8n, custom webhook) and document required setup

### ANTICIPATED GAP E: Unified Widget — Channel Routing Incomplete
**Probability:** MEDIUM-HIGH
**Description:** The Unified Widget may have the UI shell built but one or more channel
routes (Video, Voice, Chat, Form) may not be fully connected to the backend.
**Pre-emptive Remediation:**
  1. Battery 2 TC-2E-003 tests each route individually
  2. For any broken route: document exactly which channel and what the break point is
  3. Check if the issue is frontend routing OR backend agent assignment

### ANTICIPATED GAP F: Email Evidence Not Routing to Both Inboxes
**Probability:** MEDIUM
**Description:** Confirmation and follow-up emails may only go to duanewells@icloud.com
and NOT to duanekwells@gmail.com (secondary evidence inbox).
**Pre-emptive Remediation:**
  1. Verify platform email configuration includes CC to duanekwells@gmail.com
  2. If CC not supported natively: configure a forwarding rule or add both to recipient list
  3. Document all email tests by checking BOTH inboxes

### ANTICIPATED GAP G: VinSolutions Trigger Fires Even Without Lead Assignment
**Probability:** MEDIUM
**Description:** Even if VinSolutions cannot assign leads due to API limitations,
the downstream triggers (15-min idle → call + text) should still fire.
**Pre-emptive Remediation:**
  1. Test the trigger chain independently of the assignment
  2. Manually insert a lead record with correct status fields
  3. Trigger should still fire based on status + time, regardless of assignment method

---

## SECTION 7: PRODUCTION READINESS GATE CRITERIA

Before the Master Coordinator can issue a PRODUCTION READY verdict:

```
MANDATORY (ALL MUST BE TRUE):
  □ Zero open P0 items in Section 1
  □ All P1 items in Section 2 are either FIXED or have documented RISK-ACCEPTANCE
    signed off by operator
  □ Battery 6 regression confirmed all previously-fixed P0/P1 items as FIXED
  □ VinSolutions lead insertion verified end-to-end for both VAPI and Tavus sources
  □ TextMagic 2-way SMS confirmed working to 412.654.6500
  □ VAPI outbound call to 412.654.6500 confirmed working
  □ 15-minute idle trigger fires correctly (or gap has approved workaround)
  □ Tavus, VAPI, and Unified Widget all display the SAME agent name
  □ Email evidence delivered to BOTH duanewells@icloud.com AND duanekwells@gmail.com
  □ Duane Wells live video test completed (manual — final step)

RECOMMENDED (SHOULD BE TRUE):
  □ All P2 items have been triaged and assigned to a sprint
  □ Dashboard shows accurate metrics across all 6 batteries
  □ No orphaned CRM records from test runs
  □ Calendar sync bidirectional test passed
```

---

## DOCUMENT MAINTENANCE INSTRUCTIONS

This document is maintained by the **Master Test Coordinator**.

Update schedule:
- After each battery: add any new gaps found
- After each fix: update status field
- After Battery 6: complete Section 5 regression log
- At final report: update Section 7 gate checklist

File naming: `release_criteria.md` — do not rename this file.
