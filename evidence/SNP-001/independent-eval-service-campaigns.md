# Independent Evaluation: Service / Campaigns

**Date:** 2026-04-07
**Evaluator:** Independent Verifier (Track 2)
**Login:** serra_honda@huminic.ai (org_admin, Serra Honda)
**URL:** https://dev.huminicdev.com/service
**Method:** Playwright MCP browser automation + source code review

---

## Navigation to Service Page

The Service page is accessible via the sidebar button (`sidebar-item-service`). Navigation works correctly when the SubMenuManager flyout panel is not open. When the flyout panel is expanded/pinned from a previous sidebar interaction, clicking a sidebar button can intermittently navigate to the wrong page because the flyout panel overlays the sidebar click targets.

**Reproduction:** Login > click any sidebar item that opens the flyout panel > try to click Service. The flyout's sub-navigation buttons can intercept the click, sending the user to the wrong page.

| Finding | Severity |
|---------|----------|
| Sidebar click intercepted by SubMenuManager flyout overlay | medium |

---

## 1. Campaigns Tab (Default)

### 1.1 Campaign List Table

**Table Headers:** Campaign, Status, Channel, Recipients, Sent, Replied, Kill Switch, Actions

**Campaigns found:**

| Campaign | CSV | Status | Channel | Recipients | Sent | Replied | Kill Switch |
|----------|-----|--------|---------|------------|------|---------|-------------|
| Service Reminder - February | test-recipients.csv | active | SMS | 16 | 0 | 0 | ON (checked=true) |
| Oil Change Reminder | oil_change_due_march.csv | paused | SMS | 234 | 0 | 0 | OFF (checked=false) |

**8 Commentary Questions — Campaign List:**

1. **Does it render without error?** Yes. The table renders with two rows, correct column alignment, and status badges.
2. **Is the data plausible?** Partially. Both campaigns show 0 Sent and 0 Replied despite having recipients (16 and 234). The "active" campaign has never sent a message — plausible if it was just created, but a user would expect an active campaign to have sent messages. The campaign names are plausible for a Honda service department.
3. **Are interactive elements functional?** Kill Switch toggles are present and visually distinct (blue ON, red OFF). Action buttons (play, schedule, preview, export) are rendered. Row click opens detail dialog.
4. **Is there visual consistency?** Yes. Status badges use consistent color coding (green dot for active, amber dot for paused). Channel badges are styled consistently.
5. **Are there false-pass CSS classes?** No false-pass classes detected in DOM or source code.
6. **Is the layout correct?** The Campaign column (first column with campaign name and CSV filename) is partially hidden behind the left sub-menu panel. When the sub-menu panel is expanded, the first column is obscured. This is a layout issue.
7. **Does it match the design intent?** Matches the service.tsx component spec: campaign table with CSV info, status, channel, kill switch toggle.
8. **Cross-screen consistency?** The campaign data structure matches what the API returns. The left panel agent list (Nancy Gaston, Service Agent) is consistent with the Agents tab.

| Finding | Severity |
|---------|----------|
| Campaign name column partially obscured by left sub-menu panel | medium |
| Both campaigns show 0 Sent / 0 Replied — no evidence campaigns have ever executed | low |

### 1.2 Action Buttons (Top Bar)

- **CSV Template:** Link to `/campaign-template.csv` — functional download link.
- **Upload CSV:** Button present, opens file picker (not tested with actual file).
- **New Campaign:** Blue button, opens creation dialog.

| Finding | Severity |
|---------|----------|
| No CSV template download verification (link exists but file not verified) | low |

### 1.3 Campaign Safety Card

Yellow info card at bottom: "Use the Kill Switch to immediately stop all outbound messages for a campaign. Individual conversations can also be disconnected from campaigns in TeamBox."

Renders correctly. Dismissible with X button.

No findings.

---

## 2. Campaign Detail Dialog

Triggered by clicking a campaign row. Opens a modal dialog with `data-testid="dialog-campaign-detail"`.

**Content for "Service Reminder - February":**
- Status: Active (green dot)
- Channel: SMS
- Recipients: 16
- Sent: 0
- Replied: 0
- Kill Switch: "OFF — Messages Flowing" (secondary badge)
- CSV File: test-recipients.csv
- Recipients table: Name, Phone, Status columns

**8 Commentary Questions — Campaign Detail:**

1. **Does it render without error?** Yes. Dialog opens cleanly with all fields populated.
2. **Is the data plausible?** Partially. See kill switch inconsistency below and duplicate recipients.
3. **Are interactive elements functional?** Dialog closes on Escape. No edit capability visible — dialog is read-only.
4. **Is there visual consistency?** Yes, consistent with the card/dialog design system.
5. **Are there false-pass classes?** None detected.
6. **Is the layout correct?** Yes, grid layout with 2 columns for stats, full-width for CSV and recipients.
7. **Does it match design intent?** Yes, matches the code in service.tsx lines 684-778.
8. **Cross-screen consistency?** Kill switch value INCONSISTENT (see below).

| Finding | Severity |
|---------|----------|
| **Kill Switch inconsistency:** Table shows Kill Switch ON (toggle checked=true) but detail dialog shows "OFF — Messages Flowing". The table toggle reads `killSwitch` as a boolean; the dialog reads `selectedCampaign.killSwitch`. If the table toggle state was changed by the user but the campaign object wasn't refetched, the dialog shows stale data. Alternatively, the toggle's `checked` state and the campaign's `killSwitch` field may be inverted (toggle ON = kill switch active = messages stopped, but the boolean stored is `true` = enabled = messages flowing). This is a **data display conflict** that could mislead a user about whether messages are being sent. | high |
| **Duplicate recipients:** The recipients table shows John Doe (5551234567) appearing 3 times and Jane Smith (5559876543) appearing 3 times. The CSV upload process does not deduplicate by phone number. A real campaign would send multiple SMS messages to the same number. | medium |
| **All recipients "pending" status:** All 16 recipients show "pending" status despite the campaign being "active". No messages have been sent. If the campaign is active, the user would expect at least some recipients to show "sent" or "delivered" status. | low |
| **No message template shown in detail dialog:** The dialog has a messageTemplate section but it was empty/not rendered for this campaign. The campaign may not have a template set — but the campaign is "active", which implies it should have a template. | medium |

---

## 3. New Campaign Dialog

Triggered by "New Campaign" button.

**Content:**
- Title: "Create Service Campaign"
- Subtitle: "Set up a new outbound campaign for the service department."
- Fields:
  - Campaign Name (text input)
  - Channels: SMS (checked), Email (unchecked), Phone Call (unchecked) — checkboxes
  - Message Template (textarea)
- Buttons: Cancel, Create Campaign

**8 Commentary Questions — New Campaign Dialog:**

1. **Does it render without error?** Yes.
2. **Is the data plausible?** N/A — creation form.
3. **Are interactive elements functional?** Channel checkboxes are interactive. SMS is pre-checked. Cancel closes dialog. Create Campaign button is present (not tested with submission).
4. **Is there visual consistency?** Yes, consistent dialog styling.
5. **Are there false-pass classes?** None.
6. **Is the layout correct?** Yes.
7. **Does it match design intent?** Yes. Per service.tsx, the creation form collects name, channels (multi-select via checkboxes per I-132 fix), and message template.
8. **Cross-screen consistency?** N/A.

| Finding | Severity |
|---------|----------|
| No recipient upload step in creation flow — campaign is created empty, CSV must be uploaded separately afterward. This is a two-step process that may confuse users expecting a single creation wizard. | low |
| No field validation visible — no character limits shown, no required field indicators (asterisks). | low |

---

## 4. Agents Tab

**Content:**
- Heading: "Service Agents"
- Two agent cards:
  1. **Nancy Gaston** — chat mode, green status dot. Description: "Service campaign management, recall notifications, maintenance scheduling, service knowledge."
  2. **Service Agent** — chat mode, green status dot. Description: "Serra Honda AI Service Knowledge Agent. Provides service campaign insights, recall information, maintenance scheduling guidance, and service lane performance data."

**8 Commentary Questions — Agents Tab:**

1. **Does it render without error?** Yes.
2. **Is the data plausible?** Yes. Two service-department agents with relevant descriptions.
3. **Are interactive elements functional?** Agent cards are clickable (not tested for navigation to chat).
4. **Is there visual consistency?** Yes. Cards use consistent avatar/badge/description layout matching other department agent views.
5. **Are there false-pass classes?** None.
6. **Is the layout correct?** Yes, horizontal card layout.
7. **Does it match design intent?** Yes.
8. **Cross-screen consistency?** The same agents appear in the left panel sidebar under "AGENTS" section.

No findings.

---

## 5. Insights Tab

**NOT EVALUATED.** Session expired before this tab could be captured. The tab button exists and is clickable. Per source code (service.tsx), it embeds the InsightsPage component filtered for service department metrics.

| Finding | Severity |
|---------|----------|
| Insights tab could not be independently verified due to session timeout during evaluation | low |

---

## 6. Calendar Tab

**NOT EVALUATED.** Session expired before this tab could be captured. The tab button exists and is clickable. Per source code (service.tsx), it renders the AppointmentCalendar component.

| Finding | Severity |
|---------|----------|
| Calendar tab could not be independently verified due to session timeout during evaluation | low |

---

## 7. Cross-Screen Consistency Checks

| Check | Result |
|-------|--------|
| Left panel agents match Agents tab | PASS — Nancy Gaston and Service Agent appear in both |
| Campaign count matches between list and any dashboard metric | NOT VERIFIED — no campaign count metric visible on AI Chat dashboard |
| Service sidebar button highlights correctly when on /service | PASS — `[active]` state confirmed in accessibility snapshot |
| Sub-tabs (Campaigns, Agents, Insights, Calendar) all present | PASS — all 4 tabs rendered |

---

## 8. Data Plausibility Summary

| Data Point | Plausible? | Notes |
|------------|-----------|-------|
| 2 campaigns for Serra Honda | Yes | Reasonable for a service department |
| Campaign names (Service Reminder, Oil Change) | Yes | Typical service department campaigns |
| 16 and 234 recipients | Yes | Reasonable recipient counts |
| 0 sent, 0 replied on both | Questionable | Active campaign with 0 sends suggests campaign execution never triggered or is blocked |
| Duplicate recipients (3x John Doe, 3x Jane Smith) | No | CSV upload did not deduplicate |
| All pending status | Questionable | Active campaign should have progressed past pending |
| Kill switch ON but dialog says OFF | No | Contradictory display |

---

## 9. Session / Auth Observation

The authentication token appears to be stored in memory (not localStorage, not cookies). When the page is navigated via full-page reload (e.g., `page.goto('/service')`), the auth state is lost and the user is redirected to login. This is by design (httpOnly refresh token cookie handles re-auth), but the refresh flow is aggressive — sessions expire within seconds of inactivity in the Playwright context, making automated testing difficult.

| Finding | Severity |
|---------|----------|
| Auth token stored in memory — any full page navigation loses session. Refresh token flow works but is aggressive on expiry timing. | low |

---

## Findings Summary

| # | Finding | Severity | Category |
|---|---------|----------|----------|
| F-SVC-01 | Kill Switch inconsistency: table shows ON, detail dialog shows OFF for same campaign | high | Data Display |
| F-SVC-02 | Duplicate recipients in campaign (3x John Doe, 3x Jane Smith) — no deduplication on CSV upload | medium | Data Integrity |
| F-SVC-03 | Campaign name column partially obscured by left sub-menu panel when panel is expanded | medium | Layout |
| F-SVC-04 | Sidebar click intercepted by SubMenuManager flyout overlay — intermittent wrong-page navigation | medium | Navigation |
| F-SVC-05 | Active campaign with 0 messages sent — no evidence of campaign execution | medium | Data Plausibility |
| F-SVC-06 | No message template visible in campaign detail for active campaign | medium | Data Completeness |
| F-SVC-07 | Insights tab not independently verified (session timeout) | low | Evaluation Gap |
| F-SVC-08 | Calendar tab not independently verified (session timeout) | low | Evaluation Gap |
| F-SVC-09 | No recipient upload step in campaign creation — two-step process | low | UX |
| F-SVC-10 | No field validation indicators in New Campaign dialog | low | UX |
| F-SVC-11 | All recipients show "pending" status on active campaign | low | Data Plausibility |
| F-SVC-12 | Auth session aggressive expiry on page navigation | low | Auth |

---

## Verdict

**PASS WITH RISK**

**Rationale:** The Service/Campaigns section renders correctly and all primary UI elements (campaign list, detail dialog, creation flow, agents tab) are functional. The page structure, navigation tabs, and data display are sound. However, the kill switch display inconsistency (F-SVC-01) is a high-severity issue that could mislead users about whether outbound messages are being sent or stopped — this is a safety-critical feature. The duplicate recipients issue (F-SVC-02) and the flyout overlay navigation bug (F-SVC-04) add additional risk. Two sub-tabs (Insights, Calendar) could not be verified due to session limitations.

The high-severity kill switch inconsistency should be investigated and resolved before production launch.
