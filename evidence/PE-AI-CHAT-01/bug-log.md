# PE-AI-CHAT-01 Bug Log

**Evaluation Date:** 2026-04-06
**Evaluator:** Playwright Operator (automated)
**Target:** https://live.huminic.app — AI Chat / Main Dashboard

---

### BUG-PE01-001: Vehicle column shows raw API URLs instead of vehicle descriptions
**Severity:** Medium
**Type:** Data
**Use Case:** UC-15, UC-19
**Steps to Reproduce:**
1. Log in as serra_honda@huminic.ai
2. Click Active Pipeline metric tile
3. Observe Vehicle column in drill-down table
4. Click View Contact on any row — observe Vehicle of Interest field
**Expected:** Vehicle column shows human-readable vehicle description (e.g., "2026 Honda Civic LX")
**Actual:** Vehicle column shows raw VIN Solutions API URL (e.g., "https://api.vinsolutions.com/vehicles/interest/id/1988464528-0")
**Evidence:** 07-active-pipeline-drilldown.png, 08-contact-detail-michael-mccord.png
**False-Pass Risk:** High. Automated tests checking for "truthy" values would pass since a URL is truthy. Only visual/human inspection reveals this is not usable data.

---

### BUG-PE01-002: 11 of 16 pipeline leads show "--" for Name
**Severity:** Medium
**Type:** Data
**Use Case:** UC-15
**Steps to Reproduce:**
1. Log in as serra_honda@huminic.ai
2. Click Active Pipeline metric tile
3. Count rows with "--" in Name column
**Expected:** All leads show contact names
**Actual:** Only 5 of 16 leads have names (AI Lead, Michael Mccord, Donnie Kitchens, Renay Elmore, Braden Macon). Remaining 11 show "--"
**Evidence:** 07-active-pipeline-drilldown.png
**False-Pass Risk:** Medium. Count-based assertions pass (16 records = 16 rows), but content quality is poor. Data sync issue — AI chat response confirmed data was last synced 13 days ago.

---

### BUG-PE01-003: Outbound Sent drill-down shows all "--" for Recipient, Phone, and Email
**Severity:** High
**Type:** Data
**Use Case:** UC-18
**Steps to Reproduce:**
1. Log in as serra_honda@huminic.ai
2. Click Outbound Sent 24h metric tile
3. Observe all 19 rows
**Expected:** Rows show recipient name, phone number, or email address identifying who received the outbound message
**Actual:** All 19 rows show "--" for Recipient, Phone, and Email. Only Channel (email) and Sent time are populated.
**Evidence:** 11-outbound-sent-drilldown.png
**False-Pass Risk:** Very high. Count matches (tile=19, table=19 records), but the drill-down is operationally useless. An operator cannot determine who any outbound message was sent to.

---

### BUG-PE01-004: Tony Serra Ford shows all-zero metrics (KNOWN)
**Severity:** Medium
**Type:** Data / Integration
**Use Case:** UC-11
**Steps to Reproduce:**
1. Log in as partner_admin (duanekwells@gmail.com)
2. Switch to Tony Serra Ford via store dropdown
3. Observe all 4 metric tiles
**Expected:** Metrics reflect actual dealership activity
**Actual:** All 4 metrics show 0 (Active Pipeline: 0, Appointments Today: 0, Open Escalations: 0, Outbound Sent 24h: 0)
**Evidence:** 15-tony-serra-ford-metrics.png
**False-Pass Risk:** Medium. If automated tests only check that metrics load without error, zeros appear valid. Requires business context to know this store should have data.

---

### BUG-PE01-005: Huminic org switch fails with 403
**Severity:** High
**Type:** Functional / RBAC
**Use Case:** UC-23
**Steps to Reproduce:**
1. Log in as partner_admin (duanekwells@gmail.com)
2. Open store dropdown — Huminic is listed
3. Click Huminic
**Expected:** Either (a) switches to Huminic org successfully, or (b) Huminic is not shown in the dropdown if user lacks access
**Actual:** Toast error: "Switch failed — Could not switch organization. Please try again." API returns 403. Page stays on previous org.
**Evidence:** 18-huminic-switch-failed.png
**False-Pass Risk:** High. Dropdown rendering tests would pass (item exists). Only click-through testing reveals the failure. The option should not be shown if the user cannot access it.

---

### BUG-PE01-006: Metrics tiles do not re-expand after new conversation
**Severity:** Low
**Type:** UX / State
**Use Case:** UC-07
**Steps to Reproduce:**
1. Send a chat message (tiles auto-collapse)
2. Click new conversation button
3. Observe metric tiles area
**Expected:** After resetting chat, metric tiles re-expand to full view (restoring initial page state)
**Actual:** Metric tiles remain collapsed with "Show" toggle. User must manually click "Show" to see metrics again.
**Evidence:** 05-new-conversation-reset.png
**False-Pass Risk:** Low. Functional tests check for chat reset (messages cleared), but don't verify tile state restoration.

---

### BUG-PE01-007: 187 open escalations dominated by VIN failures and blocked SMS
**Severity:** High
**Type:** Data / Operational
**Use Case:** UC-17
**Steps to Reproduce:**
1. Log in as serra_honda@huminic.ai
2. Click Open Escalations tile (187)
3. Review escalation types
**Expected:** Mix of business-relevant escalations requiring human attention
**Actual:** Escalations are almost entirely system-generated: "VIN Lead Creation Failed" (critical, repeated dozens of times) and "Unsent SMS — blocked" (medium, repeated dozens of times). Dates range from 3/31 to 4/5. These appear to be integration failures, not customer-facing escalations.
**Evidence:** 10-open-escalations-drilldown.png
**False-Pass Risk:** Very high. The feature works correctly (escalations are real, data loads, count matches). But the data represents unresolved integration issues flooding the escalation queue, making it operationally unusable for its intended purpose (human attention items).

---

### BUG-PE01-008: Console errors (Failed to fetch) on every org switch
**Severity:** Low
**Type:** Integration / Async
**Use Case:** UC-22
**Steps to Reproduce:**
1. Log in as partner_admin
2. Switch to any org via dropdown
3. Open browser console
**Expected:** Clean console, no errors
**Actual:** 6 "Query error: Failed to fetch" errors on every org switch. Data still loads after a delay, so this appears to be a race condition where queries fire before the org context is fully switched.
**Evidence:** Observed in all org switch snapshots (Serra Nissan, Tony Serra Ford, Ford of Columbia, Hyundai of Columbia)
**False-Pass Risk:** Low. Errors are console-only and data eventually loads. But indicates fragile client-side state management during org switches.
