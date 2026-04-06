# PE-INTEGRATIONS-01 Bug Log

**Date:** 2026-04-06
**Evaluator:** Playwright Operator

---

## BUG-INT-01: Voice transcripts not rendered in Conversation thread view
**Severity:** HIGH
**Integration:** VAPI
**Location:** TeamBox > Conversations > Voice filter > any voice conversation
**Expected:** Voice conversations should display the VAPI transcript as messages in the conversation thread (similar to how SMS conversations show message bubbles)
**Observed:** All voice conversations show "No messages yet" in the thread panel, even when VAPI transcript data exists (confirmed by Phone tab > Transcript button showing real content)
**Impact:** Users cannot see call content from the Conversations view. They must navigate to Phone tab and click Transcript button separately. Breaks unified inbox experience.
**Evidence:** 08-voice-hernandez-no-messages.png (voice conversation with "No messages yet" despite being a real call)

---

## BUG-INT-02: VAPI Call Logs show "Hyundai of Columbia" transcript under Serra Honda org
**Severity:** MEDIUM
**Integration:** VAPI
**Location:** TeamBox > Phone tab > first call transcript (4/5/2026, 10:18 PM)
**Expected:** Call logs shown under Serra Honda should be for Serra Honda's VAPI assistant
**Observed:** Transcript says "Thanks for calling Hyundai of Columbia" -- this is a different org's call data
**Impact:** Either (a) call logs are not org-filtered, showing all orgs' calls to every org, or (b) the assistant ID is shared across orgs. Either way, data leaks across org boundaries.
**Evidence:** 06-vapi-transcript-real-call.png

---

## BUG-INT-03: VAPI Call Logs -- Caller Number never populated
**Severity:** MEDIUM
**Integration:** VAPI
**Location:** TeamBox > Phone tab > VAPI Call Logs table > Caller Number column
**Expected:** Caller phone numbers displayed for each call
**Observed:** All entries show "-" for Caller Number, including the 3 calls that have full transcript data
**Impact:** Cannot identify who called from the call log table. Must click "Show Contact" or open transcript.
**Evidence:** 05-teambox-phone-vapi-logs.png

---

## BUG-INT-04: VAPI Call Logs -- Ghost entries with no metadata
**Severity:** LOW
**Integration:** VAPI
**Location:** TeamBox > Phone tab > VAPI Call Logs table
**Expected:** Each call log entry should have date, caller, duration
**Observed:** ~17 entries show "-" for date, caller, and duration. All share the same assistant ID (90a876c0-...). No transcript button available. These appear to be incomplete webhook records.
**Impact:** Table is cluttered with unusable entries. Makes it harder to find real calls.
**Evidence:** 05-teambox-phone-vapi-logs.png

---

## BUG-INT-05: Tavus Video Sessions tab empty despite active webhooks
**Severity:** HIGH
**Integration:** Tavus
**Location:** TeamBox > Video tab
**Expected:** Video sessions should appear when Tavus webhooks are received
**Observed:** "No video sessions found" -- but Sales Dashboard Recent Activity shows 4x "Tavus Video Completed" entries from ~17 hours ago
**Impact:** Tavus integration appears non-functional from TeamBox despite webhooks being received. Activity log proves data arrives but is not surfaced in the dedicated Video tab.
**Evidence:** 09-tavus-video-empty.png, 12-sales-dashboard-clean.png (showing "Tavus Video Completed" in activity)

---

## BUG-INT-06: VIN Solutions warehouse sync stale (9 days)
**Severity:** MEDIUM
**Integration:** VIN Solutions
**Location:** Sales > Dashboard > Warehouse indicator
**Expected:** Regular warehouse sync (delta sync runs at 2 AM ET daily per I-201)
**Observed:** "Synced 9d ago" -- sync has not succeeded for 9 days
**Impact:** Sales pipeline data is 9 days stale. New leads, status changes not reflected.
**Related:** I-201 (delta sync scheduler issues), I-188 (warehouse leads query returns 0 rows)
**Evidence:** 12-sales-dashboard-clean.png

---

## BUG-INT-07: VIN Lead Creation failing on live VAPI calls
**Severity:** HIGH
**Integration:** VIN Solutions + VAPI
**Location:** Sales > Dashboard > Recent Activity
**Expected:** After VAPI call with transcript, lead should be created in VIN Solutions
**Observed:** Recent Activity shows "Vin Lead Creation Failed" immediately after each "Vapi Call Received" entry (~17 hours ago, 2 occurrences)
**Impact:** The full VAPI-to-VIN pipeline is broken: calls come in, transcripts are captured, but leads are not created in VIN Solutions.
**Related:** I-188, I-201
**Evidence:** 12-sales-dashboard-clean.png

---

## BUG-INT-08: VIN Active Pipeline -- 11 of 16 leads missing contact names
**Severity:** LOW
**Integration:** VIN Solutions
**Location:** Sales > Dashboard > Active Pipeline drill-down
**Expected:** All leads should show customer name
**Observed:** 11 of 16 records show "---" instead of a name. Only 5 have names: AI Lead, Michael Mccord, Donnie Kitchens, Renay Elmore, Braden Macon
**Impact:** Pipeline view is degraded -- most leads are anonymous. Likely caused by warehouse sync not pulling contact names for all lead IDs.
**Evidence:** 13-active-pipeline-drilldown.png

---

## BUG-INT-09: Sales Dashboard trend percentages all show 0%
**Severity:** LOW
**Integration:** VIN Solutions
**Location:** Sales > Dashboard > all metric cards
**Expected:** Trend indicators should show change vs previous period
**Observed:** Every metric shows "0% vs last 30d" despite having non-zero values
**Impact:** Trend analysis is non-functional. May be caused by stale sync (only 1 period of data) or calculation bug.
**Evidence:** 12-sales-dashboard-clean.png

---

## BUG-INT-10: Test data co-mingled with production data
**Severity:** HIGH
**Integration:** Cross-cutting (all)
**Location:** TeamBox conversations, all channels
**Expected:** Production environment should contain only real customer data
**Observed:**
- SMS: ~54 of 57 conversations are test artifacts ("Cross Org Delete/Message/Patch Test")
- Voice: ~110 of 113 are test artifacts ("Test Caller", "Idempotency Test", "VIN Disabled Test", "S9 VAPI Audit", etc.)
- Email: 2 of 2 are seeded demo data (555 numbers, @email.com addresses)
- 555 phone numbers throughout: +15551234567, +15559990001, +15553330001, etc.
**Impact:** Production TeamBox is overwhelmed with test noise. Real customer conversations (if any) are buried. Related to I-218 (single DB for dev and live) and I-241 (test traffic hitting production webhooks).
**Evidence:** 03-teambox-sms-filtered.png, 07-teambox-voice-conversations.png

---

## BUG-INT-11: Multiple "Unauthorized Agent" entries in Top Performing Agents
**Severity:** MEDIUM
**Integration:** Internal (agent system)
**Location:** Sales > Dashboard > Top Performing Agents
**Expected:** Only authorized, named agents should appear in leaderboard
**Observed:** Positions 4-9 and 11 are all "Unauthorized Agent" (voice). Only Caroline (#1), Sales Coach (#2), Communication Writer (#3), and Data Guru (#10) have real names.
**Impact:** Leaderboard is cluttered with unauthorized/unconfigured agents. These appear to be test-created or misconfigured agent records.
**Evidence:** 12-sales-dashboard-clean.png
