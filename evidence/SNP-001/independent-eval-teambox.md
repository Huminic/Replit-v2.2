# Independent Evaluation: TeamBox

**Date:** 2026-04-07
**Evaluator:** Independent Verifier (Track 2 -- no prior knowledge of fixes or implementation)
**Account:** serra_honda@huminic.ai (org_admin, Serra Honda)
**URL:** https://dev.huminicdev.com/teambox

---

## Executive Summary

TeamBox renders and is functionally accessible but suffers from a **critical session stability issue** that causes the page to crash and redirect within 2-5 seconds of loading. When stable, the page shows a well-structured 4-column layout with real conversation data, working search, campaign filter, phone call logs with transcripts, and a video sessions tab. However, data quality issues and the session instability make it unsuitable for production use without fixes.

**Verdict: FAIL**

---

## Critical Findings

### CRIT-1: Session crash and redirect loop (Severity: CRITICAL)

**Observation:** After navigating to /teambox, the page renders correctly for 1-3 seconds, then the app loses authentication, shows a black "Loading..." screen, and redirects to /login or another page (typically /insights, /service, or /sales).

**Redirect chain observed:** `/teambox` -> render -> API calls fire -> `/api/auth/refresh` returns 400 -> session lost -> `/login` -> auto-re-login -> redirected to default page.

**Root cause evidence:**
- Console error: `Failed to load resource: the server responded with a status of 400` on `/api/auth/refresh`
- Console error: `Failed to load resource: the server responded with a status of 404` on `/api/conversations/{id}/messages` (for some conversation IDs)
- The access token is stored only in JS memory (not localStorage/sessionStorage). The httpOnly refresh cookie (`nexxus_refresh`) exists but the `/api/auth/refresh` endpoint returns 400.
- When TeamBox's `useQuery` hooks fire API calls with the in-memory token and one fails, the cascade triggers a token refresh attempt. The refresh fails (400), which invalidates the session, causing a redirect to login.
- Network trace from a single session: `200 /api/conversations` -> `404 /api/conversations/{id}/messages` -> `400 /api/auth/refresh` -> `200 /api/auth/login` (auto re-login) -> redirect away from /teambox

**Impact:** Users cannot stay on the TeamBox page long enough to meaningfully interact with it. The page is functionally unusable for sustained use.

**False-pass risk:** A quick screenshot or automated test might capture the page in its 1-3 second render window and declare it "working."

### CRIT-2: All conversation contact fields are NULL (Severity: HIGH)

**Observation:** All 16 conversations returned by `GET /api/conversations` have `contactName: null`, `contactPhone: null`, `contactEmail: null`, and `lastMessage: null`.

**Evidence:** API response for all 16 conversations shows NULL for these fields. The UI compensates by deriving display names from the first message's `senderName` field, but this is a workaround, not correct data population.

**Impact:**
- Search by contact name works only because the UI resolves names client-side from messages
- Sorting/filtering by contact is unreliable
- The `lastMessage` field being NULL means conversation previews cannot show message snippets in list view
- Any feature depending on `contactName` (e.g., CRM integration, exports) will produce empty data

### CRIT-3: Channel and status filters do not filter (Severity: HIGH)

**Observation:** Clicking the SMS, Email, or Voice channel filter buttons, or the Open/Participating status filter buttons, does not change the conversation list. All 16 conversations remain visible regardless of which filter is selected.

**Evidence:** After clicking "SMS" in the channel filter bar, the conversation list still shows all 16 conversations (including ai-chat, voice, email, and chat conversations). Same behavior for "Open" status filter. The count badges are correct (Open: 15, Participating: 1, SMS: 2, Email: 1) but the list does not filter.

**Note:** The sidebar channel links (SMS 2, Email 1, Phone 3) may work differently as they use URL query parameters, but the in-page filter buttons in the left panel are non-functional.

---

## Working Features

### Conversation List (when page is stable)
- **4-column layout renders correctly:** Sidebar channels, conversation list, message thread, customer info panel
- **16 conversations loaded:** 9 ai-chat, 3 voice, 2 sms, 1 email, 1 chat
- **Conversation entries show:** Avatar initials, contact name (resolved from messages), relative timestamp, unread badge count, agent name (e.g., "Caroline" for voice calls)
- **Conversation selection works:** Clicking a conversation loads messages in the center panel and customer info in the right panel

### Message Display
- **SMS messages render correctly:** Message bubble with content "Hi, I need to schedule an oil change for my 2022 Honda Civic. What are your service hours?" displayed with correct alignment and "2 days ago" timestamp
- **Email messages render correctly:** Two messages in thread -- Marketing Agent outbound and Stephanie Thompson reply, with proper sender attribution and timestamps
- **Voice conversations:** 3 voice conversations listed, messages loaded (some empty, some with 1 message)

### Customer Info Panel
- Shows: Name, Email/Phone, Channel, Status, Assign To dropdown, Quick Actions (Call/Email/SMS)
- For SMS conversation: Name shows phone number (expected since contactName is null)
- For Email conversation: Shows "Stephanie Thompson", email "steph.t@email.com", "Handled by: AI Agent"

### Phone Tab (VAPI Call Logs)
- **Table renders with 6 VAPI calls:** Date, Caller Number (+18392729080), Assistant (Caroline), Duration (20-62s), Status (ended), Summary (truncated), Transcript link
- **Data is real and plausible:** Calls from today, durations reasonable, summaries describe car buying inquiries
- **Transcript modal works:** Opens with full AI/User conversation text, "Listen to Recording" link present, "Close" button works
- **Sample transcript content:** James Richardson calling Sarah Automotive to schedule a test drive for a 2024 Honda Civic, requesting appointment for 2 PM, providing phone number 205-555-0147

### Video Tab (Tavus Video Sessions)
- **Renders cleanly:** "Tavus Video Sessions" heading with "No video sessions found" empty state
- **Correct behavior:** Serra Honda has no video sessions, so empty state is appropriate

### Search
- **Works correctly:** Typing "Stephanie" in search box filters the conversation list to show only Stephanie Thompson's conversation, hiding all others

### Campaign Filter Dropdown
- **Opens and shows 4 campaigns:** Presidents Day Sale, Service Reminder - February, Oil Change Reminder, New Lead Follow-Up Sequence
- **Dropdown UI is clean and functional**

### Reply Box
- **Present and functional:** Textarea with "Write a reply..." placeholder accepts text input
- **Send button visible** (not tested for actual send -- would be an IRREVERSIBLE action)

### Tab Navigation
- **3 tabs work:** Conversations, Phone, Video -- all navigate correctly within the TeamBox page
- **Active tab indicator visible** (blue underline on Video tab confirmed in screenshot)

---

## Data Plausibility Assessment

| Check | Result | Notes |
|-------|--------|-------|
| Conversation count | 16 | Reasonable for a test/demo org |
| Channel distribution | 9 ai-chat, 3 voice, 2 sms, 1 email, 1 chat | All channels have data |
| Empty conversations | 3 of 16 have 0 messages | These are ai-chat conversations that appear to be auto-created session placeholders |
| Contact fields populated | 0 of 16 | ALL conversations have null contactName/Phone/Email in the API -- HIGH concern |
| lastMessage populated | 0 of 16 | NULL for all -- messages exist but field not populated |
| VAPI calls | 6 calls today | All from same number (+18392729080) to Caroline -- plausible for testing |
| Timestamps | Recent (today + 2-4 days ago) | Plausible and consistent |
| Status distribution | 15 open, 1 participating | Reasonable |

---

## 8 Commentary Questions

### 1. Does this element render without errors?
**Partially.** The page renders correctly for 1-3 seconds, then crashes. Console shows 401/400/404 errors on auth refresh and some conversation message endpoints.

### 2. Is the data plausible?
**Mixed.** VAPI call data is real and plausible. Conversation data has all contact fields NULL, which is implausible for a CRM system. The UI compensates by resolving names from messages, masking the underlying data gap.

### 3. Does user interaction work as expected?
**Partially.** Search works. Campaign filter dropdown works. Conversation selection works. Reply box accepts input. Tab navigation works. But channel/status filters DO NOT filter the list. Session crashes prevent sustained interaction.

### 4. Are there false-pass CSS classes?
**No hidden elements detected.** Content that renders is genuinely visible. The skeleton loading states appear only during initial data fetch, which is appropriate.

### 5. Is the layout consistent with the app's design system?
**Yes.** The 4-column layout, card styles, badges, avatars, and button styling are consistent with other pages in the app.

### 6. Are error states handled gracefully?
**No.** The auth refresh failure cascades to a full page crash and redirect rather than showing an error message or retry prompt. Voice conversations with 0 messages show "No messages yet" which is correct.

### 7. Is cross-screen consistency maintained?
**Partially.** The sidebar navigation, top bar, and org name (Serra Honda) are consistent across pages. The notification badge (591) persists. However, the page instability means users bounce between pages unpredictably.

### 8. Would a real user accomplish their task?
**No.** A dealership employee trying to review conversations, respond to customers, or check call logs would be unable to use TeamBox reliably due to the session crash. The 1-3 second render window is insufficient for any real work.

---

## Severity Summary

| ID | Finding | Severity |
|----|---------|----------|
| CRIT-1 | Session crash/redirect loop -- page unusable after 1-3 seconds | **CRITICAL** |
| CRIT-2 | All conversation contact fields (name/phone/email/lastMessage) are NULL | **HIGH** |
| CRIT-3 | Channel and status filter buttons do not filter the conversation list | **HIGH** |
| MED-1 | 3 of 16 conversations have 0 messages (empty ai-chat sessions) | **MEDIUM** |
| MED-2 | Phone tab shows spinner/loading before VAPI data loads (slow fetch) | **MEDIUM** |
| LOW-1 | Video tab empty state -- expected for this org but no visual indicator of what video sessions are | **LOW** |
| LOW-2 | Contact names displayed as phone numbers for SMS conversations (consequence of CRIT-2) | **LOW** |
| LOW-3 | All VAPI calls from same phone number -- may be test data not cleaned up | **LOW** |

---

## Final Verdict: FAIL

**Rationale:** CRIT-1 (session crash) alone is sufficient for a FAIL verdict. The TeamBox page cannot maintain a stable session for more than 1-3 seconds, making it functionally unusable. Combined with CRIT-2 (NULL contact data) and CRIT-3 (non-functional filters), the page has 3 high-severity or above issues that would prevent any real user from accomplishing their workflow.

**What works well:** The underlying UI structure, layout, and individual component rendering are solid. Phone tab with VAPI call logs and transcripts is well-implemented. Search works. The reply box is present. Campaign filter dropdown renders correctly. When the page is stable (briefly), it looks professional and functional.

**What must be fixed for PASS:**
1. Fix auth token refresh to prevent session crash on TeamBox (CRIT-1)
2. Populate conversation contact fields from message data or VIN integration (CRIT-2)
3. Fix channel and status filter button click handlers to actually filter the list (CRIT-3)
