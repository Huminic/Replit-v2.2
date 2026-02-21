# Nexxus V2 — Test Scenarios

Numbered interaction sequences using data-testid values for Playwright E2E testing.

---

## Navigation Scenarios

### Scenario: Navigate Through All Main Pages
**Precondition**: Authenticated, on home page
1. Verify `text-ai-key-metrics-title` is visible with text "AI Key Metrics"
2. Click sidebar navigation for Insights
3. Verify `tab-insights-dashboard` is visible
4. Click sidebar navigation for Agents
5. Verify agent list panel is visible
6. Click sidebar navigation for Hub
7. Verify `tab-wc-calendar` is visible
8. Click sidebar navigation for Drive
9. Verify file list is visible
10. Click sidebar navigation for Settings
11. Verify settings tile grid is visible

### Scenario: Sub-Menu Pin and Collapse
**Precondition**: On Insights page
1. Verify `button-collapse-insights-panel` is visible
2. Click `button-toggle-submenu` (double-arrow under logo)
3. Verify sub-menu panel is pinned (stays visible)
4. Click `button-collapse-insights-panel`
5. Verify sub-menu panel is collapsed/hidden

### Scenario: Mobile Navigation
**Precondition**: Viewport width < 768px, authenticated
1. Click `button-show-sidebar` (hamburger menu)
2. Verify `dropdown-mobile-nav` is visible
3. Click a navigation item (e.g., Insights)
4. Verify navigation occurred to Insights page
5. Click `button-close-mobile-menu`
6. Verify mobile menu is closed

---

## Chat Scenarios

### Scenario: Send Chat Message on Main Page
**Precondition**: On home page
1. Verify `input-chat-message` is visible
2. Click `input-chat-message`
3. Type "What are today's top leads?"
4. Click `button-main-send`
5. Verify user message appears right-aligned with text "What are today's top leads?"
6. Verify wave-dot typing animation appears
7. Verify bot response appears left-aligned

### Scenario: Right Pane AI Chat (Automa)
**Precondition**: On any page with right pane access
1. Click `button-open-right-pane`
2. Verify right pane is visible with chat interface
3. Click `input-agent-chat`
4. Type "Show me recent activity"
5. Click `button-agent-send`
6. Verify message appears in chat
7. Click `button-close-right-pane`
8. Verify right pane is hidden

---

## Agent Management Scenarios

### Scenario: View Agent Details
**Precondition**: On Agents page, agents exist
1. Verify agent list panel is visible (desktop only)
2. Click `input-agent-search`
3. Type agent name to search
4. Click on an agent card in the list
5. Verify agent detail panel shows agent name and status
6. Verify chat history is visible in detail panel

### Scenario: Create New Agent
**Precondition**: On Agents page
1. Click `button-create-agent-panel` in list panel
2. Verify agent creation form is visible
3. Type "Sales Assistant" into `input-agent-name`
4. Type "Handles incoming sales inquiries" into `input-agent-description`
5. Click `button-save-agent`
6. Verify toast notification "Agent created" appears
7. Verify new agent appears in agent list

### Scenario: Edit Agent Configuration
**Precondition**: On Agents page, agent selected
1. Click `button-edit-instructions`
2. Verify `textarea-instructions` is editable
3. Type new instructions text
4. Click `button-save-instructions`
5. Verify toast "Instructions saved" appears
6. Click `button-edit-triggers`
7. Verify trigger configuration is visible
8. Click `button-save-triggers`
9. Click `button-edit-tools`
10. Verify tools configuration is visible
11. Click `button-save-tools`

### Scenario: Toggle Agent Status
**Precondition**: On Agents page, agent selected
1. Note current agent status badge text
2. Click `button-toggle-agent-status`
3. Verify status badge changes (active ↔ inactive)
4. Verify toast notification confirms status change

---

## Insights Scenarios

### Scenario: Browse Insights Dashboard
**Precondition**: On Insights page
1. Verify `tab-insights-dashboard` is active/selected
2. Verify Command Center metrics are visible
3. Verify `chart-leads` chart is rendered
4. Verify `chart-conversions` chart is rendered
5. Click `tab-insights-reports`
6. Verify reports list is visible
7. Click `tab-insights-library`
8. Verify metric cards grid is visible
9. Click `tab-insights-hunches`
10. Verify hunches content is visible

### Scenario: Search and Filter Metrics Library
**Precondition**: On Insights page, Library tab active
1. Click `tab-insights-library`
2. Verify metric cards are displayed (61+ metrics)
3. Click search input
4. Type "conversion" to search
5. Verify filtered results show only conversion-related metrics
6. Verify result count updates
7. Clear search input
8. Verify all metrics are shown again

### Scenario: View Metric Detail
**Precondition**: On Insights Library tab
1. Click on a metric card
2. Verify `dialog-metric-detail` opens
3. Verify `text-metric-detail-title` shows metric name
4. Verify `text-metric-detail-value` shows formatted value
5. Close dialog (Escape or X button)
6. Verify dialog is closed

### Scenario: Toggle Library View Mode
**Precondition**: On Insights Library tab
1. Click `button-library-grid`
2. Verify metrics display in grid layout
3. Click `button-library-list`
4. Verify metrics display in list/table layout

### Scenario: Pin/Unpin Metric
**Precondition**: On Insights Library tab
1. Click `button-pin-metric` on a metric card
2. Verify toast "Metric pinned" appears
3. Click `button-pin-metric` again on same card
4. Verify toast "Metric unpinned" appears

---

## Hub Scenarios

### Scenario: Calendar Event Scheduling
**Precondition**: On Hub page, Calendar tab active
1. Verify `tab-wc-calendar` is active
2. Click on a time slot or "Schedule" button
3. Verify `schedule-modal` opens
4. Type "Team Meeting" into `schedule-title`
5. Select date via `schedule-date`
6. Select time via `schedule-time`
7. Type "Weekly sync" into `schedule-notes`
8. Click `schedule-confirm`
9. Verify toast "Event scheduled" appears
10. Verify modal closes

### Scenario: Communication Compose
**Precondition**: On Hub page, Communication tab active
1. Click `tab-wc-inbox`
2. Click `button-compose-email`
3. Verify compose form appears
4. Type recipient into email input
5. Type subject
6. Type message body
7. Click send button
8. Verify toast "Message sent" appears

### Scenario: Open Leads Search
**Precondition**: On Hub page, Open Leads tab active
1. Click `tab-wc-leads`
2. Verify leads table is visible
3. Click search input
4. Type "John" to filter
5. Verify filtered results update in real-time
6. Clear search
7. Verify all leads shown again

---

## Drive Scenarios

### Scenario: File View Toggle
**Precondition**: On Drive page
1. Verify file list is visible
2. Click `button-view-grid`
3. Verify files display as card grid
4. Click `button-view-list`
5. Verify files display as list/table

### Scenario: Share File
**Precondition**: On Drive page, files visible
1. Click share button on a file row
2. Verify `share-modal` opens
3. Click `share-tab-email`
4. Verify email share form is visible
5. Type email address into recipient input
6. Click `button-send-share`
7. Verify toast "Shared successfully" appears
8. Verify modal closes

### Scenario: Share via SMS
**Precondition**: Share modal open
1. Click `share-tab-sms`
2. Verify SMS share form is visible
3. Type phone number into recipient input
4. Click `button-send-share`
5. Verify toast "Shared successfully" appears

### Scenario: Create New Folder
**Precondition**: On Drive page
1. Click `button-new-folder`
2. Verify folder name input appears
3. Type "Project Files"
4. Press Enter to confirm
5. Verify new folder appears in file list

---

## Settings Scenarios

### Scenario: Navigate Settings Tiles
**Precondition**: On Settings page, role = org_admin or above
1. Verify settings tile grid is visible
2. Click "Tools & Integrations" tile
3. Verify tabs appear: `tab-tools`, `tab-widgets`, `tab-landing-pages`
4. Click `button-back-settings`
5. Verify returned to tile grid

### Scenario: Widget Configuration
**Precondition**: On Settings > Tools & Integrations > Widgets tab
1. Click `tab-widgets`
2. Verify 4 widget cards are visible (Text Chat, Live Video, Voice Call, Unified)
3. Click configure button on Text Chat widget
4. Verify 5 config tabs visible: `tab-widget-settings`, `tab-appearance`, `tab-targeting`, `tab-domains`, `tab-embed`
5. Click `tab-appearance`
6. Modify primary color via color picker
7. Modify welcome heading via `input-welcome-heading`
8. Click `button-save-appearance`
9. Verify toast "Appearance saved" appears

### Scenario: Widget Preview
**Precondition**: On widget configuration view
1. Click preview button on a widget
2. Verify `dialog-widget-preview` opens
3. Verify `preview-widget-button` (floating button) is visible
4. Verify widget popup shows organization name and welcome message
5. Close dialog
6. Verify dialog closes

### Scenario: Copy Embed Code
**Precondition**: On widget config, Embed tab
1. Click `tab-embed`
2. Verify embed code block is visible
3. Click `button-copy-embed`
4. Verify toast "Copied to clipboard" appears

### Scenario: Widget Status Toggle
**Precondition**: On Widgets tab
1. Note current widget status (Active/Inactive badge)
2. Click `button-toggle-widget-status`
3. Verify status badge changes
4. Verify toast confirms status change

### Scenario: Landing Page Preview
**Precondition**: On Settings > Tools & Integrations > Landing Pages tab
1. Click `tab-landing-pages`
2. Verify landing page list is visible
3. Click `button-preview-landing-detail` on a landing page
4. Verify new tab opens with /w/demo route (or preview dialog)

---

## Widget Landing Page Scenarios

### Scenario: Landing Page Channel Interaction
**Precondition**: On /w/demo page (standalone, no app chrome)
1. Verify 6 channel cards are visible (Chat, Video, Voice, Callback, SMS, Form)
2. Verify "Powered by Nexxus" footer is visible
3. Click Chat channel card
4. Verify `channel-chat-view` appears with chat interface
5. Verify simulated bot message appears

### Scenario: Landing Page Video Launch
**Precondition**: On /w/demo page
1. Click `button-launch-video` ("Launch Live Video Chat")
2. Verify `channel-video-view` appears with video connection UI
3. Verify "Connecting..." animation or status is shown

### Scenario: Landing Page Contact Form
**Precondition**: On /w/demo page
1. Fill in `input-form-name` with "Jane Doe"
2. Fill in `input-form-email` with "jane@example.com"
3. Fill in form message textarea
4. Click `button-form-submit`
5. Verify success message "Thank you! We'll be in touch" appears

---

## Theme Toggle Scenario

### Scenario: Toggle Dark Mode
**Precondition**: On any page
1. Note current theme (light/dark)
2. Click `button-theme-toggle`
3. Verify page background changes (white ↔ dark slate)
4. Verify all text remains readable
5. Verify charts re-render with appropriate dark mode colors
6. Click `button-theme-toggle` again
7. Verify returns to original theme

---

## Profile Scenarios

### Scenario: View and Edit Profile
**Precondition**: On Profile page
1. Verify `tab-profile-main` is active
2. Verify user name and email are displayed
3. Click `button-edit-profile`
4. Verify fields become editable
5. Modify user name
6. Click save button
7. Verify toast "Profile updated" appears

### Scenario: Profile Preferences
**Precondition**: On Profile page
1. Click `tab-profile-preferences`
2. Verify notification toggles are visible
3. Toggle `switch-push-notifications`
4. Toggle `switch-email-digest`
5. Select timezone from `select-timezone`
6. Verify changes are reflected

### Scenario: Profile Billing
**Precondition**: On Profile page
1. Click `tab-profile-billing`
2. Verify current plan information is displayed
3. Verify `button-upgrade-plan` is visible
4. Verify `button-update-payment` is visible

---

## RBAC Role-Switching Scenarios

### Scenario: Role-Based Content Visibility
**Precondition**: On home page, role switcher available
1. Switch role to "Staff" via role dropdown
2. Verify metric tiles update to staff-specific metrics
3. Navigate to Settings
4. Verify only staff-accessible tiles are visible
5. Switch role to "Super Admin"
6. Navigate to Settings
7. Verify all settings tiles are visible (including system-level)
8. Navigate to Home
9. Verify metric tiles show super-admin metrics

---

## Favorites Scenarios

### Scenario: Toggle Favorite
**Precondition**: On any page with favoriteable items
1. Click `button-toggle-favorite` on an item (star icon)
2. Verify star fills/changes to yellow (favorited)
3. Click `button-toggle-favorite` again
4. Verify star returns to outline/muted (unfavorited)

---

## Error Recovery Scenarios

### Scenario: Form Validation Error
**Precondition**: On any form (e.g., Agent creation)
1. Leave required field empty
2. Click submit/save button
3. Verify red border appears on empty required field
4. Verify error message text appears below field
5. Fill in required field
6. Verify error styling clears
7. Click submit/save again
8. Verify form submits successfully

---

## Visual Regression Snapshot Regions

Mark these regions for Playwright screenshot capture:

```
[snapshot-region: sidebar-navigation]
[snapshot-region: topbar-full]
[snapshot-region: main-page-metric-tiles]
[snapshot-region: insights-dashboard-charts]
[snapshot-region: agents-list-panel]
[snapshot-region: drive-file-list]
[snapshot-region: settings-tile-grid]
[snapshot-region: widget-preview-modal]
[snapshot-region: landing-page-channels]
[snapshot-region: toast-notification]
[snapshot-region: chat-input-gradient]
```
