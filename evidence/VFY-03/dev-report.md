# VFY-03 Dev Report -- TeamBox Task View States

**Sprint:** VFY-03
**Date:** 2026-03-28
**App:** Nexxus Connect (dev.huminicdev.com)
**User:** serra_honda@huminic.ai
**Verifier:** Dev (verification only, no code modifications)

---

## State Table

| ID     | Feature                        | Verdict      | Notes                                                                                              |
|--------|--------------------------------|--------------|-----------------------------------------------------------------------------------------------------|
| ST-093 | Switch to Tasks view           | BROKEN       | Sidebar Tasks click changes URL but does NOT switch main content panel. Only direct URL navigation (`?tab=tasks`) renders the task list. Main header shows Conversations/Phone/Video -- no Tasks tab in header. |
| ST-094 | Loading state (skeleton)       | WORKING      | On navigation to `?tab=tasks`, a "Loading..." text appears at 300ms, followed by skeleton elements (`animate-pulse` CSS) at 600-1200ms, then content renders by 1500ms. |
| ST-095 | Empty state message            | UNTESTABLE   | Account has 24 task items. Cannot verify empty state without a user/org with zero tasks.            |
| ST-096 | Task selection / detail panel  | WORKING      | Clicking a task row renders a detail panel with: title, type badge (Task/Escalation/Unsent Message), priority badge (Low/Medium/High/Critical), "Start" button, Description, Status ("todo"), Created timestamp. Escalation items additionally show Tags and Metadata sections. |
| ST-097 | Task type filter sidebar       | BROKEN       | No filter sidebar exists. No "All Items/Tasks/Escalations/Unsent Messages" filter controls found. The filter icon next to "All Items" is decorative (not interactive). Channel filter chips (All/SMS/Email/Web Chat/WhatsApp/Voice) belong to Conversations view and do not filter tasks. |

---

## Detailed Findings

### ST-093: Switch to Tasks View

**Behavior observed:**
1. TeamBox loads in Conversations view by default (screenshot 01)
2. Left sidebar panel shows: Channels (SMS 8, Email 2, Phone 28, Video) and a "Tasks" navigation item
3. Clicking "Tasks" in sidebar sets URL to `?tab=tasks` BUT the main content area continues displaying the Conversations view (screenshots 02, 03)
4. The sidebar collapses on click, making it appear something changed, but the main panel is unchanged
5. Direct navigation to `https://dev.huminicdev.com/teambox?tab=tasks` DOES render the task list correctly (screenshot 04)

**Root cause hypothesis:** The sidebar Tasks click updates the URL query parameter but does not trigger the main content component to re-render/switch views. The `?tab=tasks` param is only consumed on full page load, not on client-side navigation from within the TeamBox.

**Evidence:** Screenshots 01-04

### ST-094: Loading State

**Behavior observed:**
- 300ms: "Loading..." text (app-level loading)
- 600-1200ms: Skeleton elements present (`animate-pulse` CSS class detected)
- 1500ms: Content fully rendered, skeletons gone

**Verdict:** Skeleton loading state exists and functions correctly.

### ST-095: Empty State

Cannot test. The test account has 24 items in the task list. Would need an account with zero tasks/escalations/unsent messages to verify empty state rendering.

### ST-096: Task Selection / Detail Panel

**Task detail panel contents (for Task type):**
- Title heading (h3)
- Type badge ("Task") + Priority badge ("Low"/"Medium"/"High")
- "Start" button (status action)
- Description section
- Status field ("todo")
- Created timestamp

**Escalation detail panel contents:**
- Title heading (h3)
- Type badge ("Escalation") + Priority badge ("Critical")
- "Start" button (status action)
- Description section (full error message)
- Status field ("todo")
- Created timestamp
- Tags section (e.g., "escalation", "vin-integration", "vapi", "auto-generated")
- Metadata section (JSON payload)

**Issue noted:** Detail panel content below the fold (Status, Tags, Metadata) is not accessible via scrolling. The detail panel lacks its own scroll container, so content is cut off when it exceeds viewport height.

**Evidence:** Screenshots 06, 10, 11, 12

### ST-097: Task Type Filter

**Behavior observed:**
- List header shows "All Items" with a filter icon and count (24)
- The filter icon is a static SVG (`lucide-filter`), not interactive -- clicking it does nothing
- No dropdown, popover, or sidebar filter panel appears
- No "Tasks", "Escalations", or "Unsent Messages" filter options exist anywhere in the UI
- The channel filter chips (All/SMS/Email/Web Chat/WhatsApp/Voice) in the main header are leftover from the Conversations view and do not affect the task list (clicking SMS shows it as active but task count remains 24)

**Evidence:** Screenshots 07, 08, 09

---

## Additional Observations

1. **Residual Conversations UI in Tasks view:** The main header still shows "Conversations | Phone | Video" tabs and channel filter chips (All/SMS/Email/Web Chat/WhatsApp/Voice) even when viewing tasks. These belong to the Conversations view and serve no purpose in the Tasks view.

2. **Task item types present in data:** The list contains three distinct types: Task, Escalation, and Unsent Message -- confirming the data model supports type filtering, but the UI does not expose filter controls.

3. **Console errors:** Multiple errors observed during testing:
   - `Failed to load resource` on `/api/auth/refresh` (401)
   - `Failed to create main chat conversation` (repeated 4x)
   - These appear unrelated to task view functionality.

---

## Screenshots Index

| # | File | Description |
|---|------|-------------|
| 01 | 01-teambox-conversations-view.png | TeamBox default Conversations view with sidebar |
| 02 | 02-tasks-tab-clicked-sidebar.png | After clicking Tasks in sidebar -- main view unchanged |
| 03 | 03-tasks-view-after-click.png | Second Tasks click attempt -- still shows Conversations |
| 04 | 04-tasks-view-populated.png | Tasks view via direct URL navigation -- populated list |
| 05 | 05-tasks-view-fullpage.png | Full page screenshot of tasks view |
| 06 | 06-task-detail-panel.png | Task detail panel for "S-1 test task" (Task/Low) |
| 07 | 07-after-allitems-click.png | After clicking All Items header -- no filter appeared |
| 08 | 08-filter-icon-clicked.png | After clicking filter icon -- no response |
| 09 | 09-sms-channel-filter-on-tasks.png | SMS channel chip active but task list unaffected |
| 10 | 10-escalation-detail-panel.png | Escalation detail panel (VIN Lead Prepare Failed) |
| 11 | 11-escalation-detail-scrolled.png | Attempted scroll of detail panel -- content cut off |
| 12 | 12-escalation-detail-bottom.png | Page scrolled down -- detail panel still cut off |

---

## Summary

2 of 5 states verified as WORKING, 2 BROKEN, 1 UNTESTABLE.

**Critical bugs:**
1. Sidebar Tasks navigation does not switch main content (ST-093)
2. Task type filter UI does not exist (ST-097)

**Minor bugs:**
1. Detail panel has no scroll container -- content below fold is inaccessible
2. Conversations UI (tabs + channel chips) persists in Tasks view as non-functional residue
