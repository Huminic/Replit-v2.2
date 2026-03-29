# DOM Element Inventory -- nexxus2.2_replit

**Date:** 2026-03-27
**Method:** Playwright MCP browser_snapshot + browser_evaluate on live application at https://dev.huminicdev.com
**Perspective:** org_admin (Serra Honda / serra_honda@huminic.ai) + super_admin differences noted (Duane Wells / duane.wells@huminic.ai)
**Note:** Elements extracted via JavaScript DOM queries targeting all interactive elements and data-testid attributes. Repeated data items (conversation list entries, campaign rows) are deduplicated with counts noted.

---

## Global Shell (present on all authenticated pages)

### Header Bar
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | button | "{Org Name}" | button-org-switcher |
| button | button | (icon only) | button-public-page |
| button | button | "{count}" | button-notifications |
| button | button | (icon only) | button-activity-feed |
| button | button | (icon only) | button-theme-toggle |
| button | button | "{initials}" | button-profile-menu |

### Sidebar Navigation
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | button | (collapse toggle) | button-toggle-submenu |
| button | nav | "AI Chat" | sidebar-item-ai-chat |
| button | nav | "TeamBox" | sidebar-item-teambox |
| button | nav | "Sales" | sidebar-item-sales |
| button | nav | "Service" | sidebar-item-service |
| button | nav | "Marketing" | sidebar-item-marketing |
| button | nav | "Manage" | sidebar-item-management |
| button | nav | "System" | sidebar-item-system |
| button | button | "Logout" | button-logout |

**Note:** Sidebar is identical for org_admin and super_admin. No additional sidebar items for super_admin.

### Product Tour Overlay (appears on some pages, hidden by default)
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| div | overlay | (tour content) | product-tour-overlay |
| div | tooltip | (step content) | tour-tooltip |
| h3 | heading | (step title) | tour-step-title |
| button | button | (close) | button-tour-close |
| p | text | (step description) | tour-step-description |
| span | text | "N of 6" | tour-step-counter |
| button | button | "Skip" | button-tour-skip |
| button | button | "Next" | button-tour-next |

### Right Pane Toggle (most pages)
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | button | (icon only) | button-open-right-pane |

### Mobile Navigation (hidden on desktop)
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | button | "Menu" | dropdown-mobile-nav |
| button | button | (star icon) | button-toggle-favorite |

---

## Page: / (Main / AI Chat)
**Elements found:** 27 unique (27 raw)
**Route:** / (root, defaults here after login)

### AI Key Metrics Section
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| h2 | heading | "AI Key Metrics" | text-ai-key-metrics-title |
| div | metric-tile | "Active Pipeline {n}" | metric-tile-0 |
| div | metric-tile | "Appointments Today {n}" | metric-tile-1 |
| div | metric-tile | "Open Escalations {n}" | metric-tile-2 |
| div | metric-tile | "Outbound Sent 24h {n}" | metric-tile-3 |

### Chat Suggestions
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | suggestion | (dynamic suggestion text) | main-suggestion-0 |
| button | suggestion | (dynamic suggestion text) | main-suggestion-1 |
| button | suggestion | (dynamic suggestion text) | main-suggestion-2 |
| button | suggestion | (dynamic suggestion text) | main-suggestion-3 |

### Chat Input
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | button | (add attachment) | button-main-chat-add |
| textarea | textarea | "Ask me anything about your business" | input-main-chat |
| button | button | (send, disabled when empty) | button-main-send |

---

## Page: /teambox (TeamBox)
**Elements found:** 56 unique (261 raw -- bulk is conversation list items)

### Chat History Side Panel (when submenu open)
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| div | panel | (chat history) | submenu-panel |
| button | button | (collapse) | button-collapse-teambox-panel |
| button | nav-chip | "SMS {count}" | panel-nav-tb-sms |
| button | nav-chip | "Email {count}" | panel-nav-tb-email |
| button | nav-chip | "Phone {count}" | panel-nav-tb-phone |
| button | nav-chip | "Video" | panel-nav-tb-video |
| button | nav-chip | "Tasks" | panel-nav-tb-tasks |

### Top-Level Tabs
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| div | page-container | -- | teambox-page |
| div | menu | -- | teambox-top-menu |
| button | tab | "Conversations" | tab-teambox-conversations |
| button | tab | "Phone" | tab-teambox-phone |
| button | tab | "Video" | tab-teambox-video |

### Tab: Conversations
#### Channel Filter Bar
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| div | filter-bar | -- | channel-filter-bar |
| button | chip | "All" | channel-chip-all |
| button | chip | "SMS" | channel-chip-sms |
| button | chip | "Email" | channel-chip-email |
| button | chip | "Web Chat" | channel-chip-chat |
| button | chip | "WhatsApp" | channel-chip-whatsapp |
| button | chip | "Voice" | channel-chip-voice |

#### Sub-tabs (within Conversations)
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | tab | "Conversations" | tab-conversations |
| button | tab | "Tasks {count}" | tab-tasks |
| button | tab | "Workflows" | tab-workflows |

#### Conversation List Filters
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| input | search | (search conversations) | input-teambox-search |
| button | filter | "All {count}" | filter-status-all |
| button | filter | "Open {count}" | filter-status-open |
| button | filter | "Assigned to me {count}" | filter-status-assigned |
| button | filter | "Participating {count}" | filter-status-participating |
| button | filter | "Automated {count}" | filter-status-automated |
| button | filter | "Scheduled {count}" | filter-status-scheduled |
| button | filter | "Followup {count}" | filter-status-followup |
| button | filter | "Pending {count}" | filter-status-pending |
| button | filter | "All" | filter-channel-all |
| button | filter | "SMS" | filter-channel-sms |
| button | filter | "Email" | filter-channel-email |
| button | filter | "Web Chat" | filter-channel-chat |
| button | filter | "WhatsApp" | filter-channel-whatsapp |
| button | filter | "Voice" | filter-channel-voice |
| div | badge | "{count}" | badge-list-count |

#### Conversation Items (repeated data pattern)
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | list-item | "{contact name}" | conversation-item-{uuid} |

#### Conversation Detail (when selected)
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| h3 | heading | "{customer name}" | text-conversation-customer |
| textarea | reply | (compose reply) | input-reply |
| button | button | (send) | button-send-reply |
| p | text | "{customer name}" | text-customer-name |
| button | select | "Unassigned" / "{agent}" | select-assign-to |
| button | action | "Call" | button-call-customer |
| button | action | "Email" | button-email-customer |
| button | action | "SMS" | button-sms-customer |

### Tab: Phone
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| div | tab-content | -- | phone-tab-content |
| h2 | heading | "VAPI Call Logs" | -- |

### Tab: Video
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| div | tab-content | -- | video-tab-content |
| h2 | heading | "Tavus Video Sessions" | -- |

---

## Page: /sales (Sales)
**Elements found:** 53 unique (55 raw)

### Tabs
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| div | page-container | -- | sales-page |
| button | tab | "Dashboard" | tab-sales-dashboard |
| button | tab | "Agents" | tab-sales-agents |
| button | tab | "Insights" | tab-sales-insights |
| button | tab | "Calendar" | tab-sales-calendar |

### Tab: Dashboard
#### Sync Status
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| div | indicator | -- | sync-status-indicator |
| div | badge | "Warehouse" | badge-vinsolutions-live |
| span | text | "Synced {time} ago" | text-sync-age |

#### Metric Tiles
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| div | metric-tile | "Total Leads (30d)" | metric-tile-sm-1 |
| p | value | "{n}" | metric-value-sm-1 |
| div | metric-tile | "New Leads" | metric-tile-sm-2 |
| p | value | "{n}" | metric-value-sm-2 |
| div | metric-tile | "Active Pipeline" | metric-tile-sm-3 |
| p | value | "{n}" | metric-value-sm-3 |
| div | metric-tile | "Waiting on Response" | metric-tile-sm-4 |
| p | value | "{n}" | metric-value-sm-4 |
| div | metric-tile | "Appointments Set" | metric-tile-sm-5 |
| p | value | "{n}" | metric-value-sm-5 |
| div | metric-tile | "Sold" | metric-tile-sm-6 |
| p | value | "{n}" | metric-value-sm-6 |
| div | metric-tile | "Conversion Rate" | metric-tile-sm-7 |
| p | value | "{n}%" | metric-value-sm-7 |

#### Top Agents & Activity
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| div | card | "{rank} {agent name} {type}" | top-agent-{uuid} |
| div | feed | -- | recent-activity-feed |
| div | activity | "{event type} {time}" | activity-item-{uuid} |

### Tab: Agents
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | button | "New Agent" | button-new-agent |
| div | agent-card | "{agent name}" | agent-card-{uuid} |
| button | toggle | -- | switch-agent-active-{uuid} |

### Tab: Insights
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | sub-tab | "Dashboard" | tab-insights-dashboard |
| button | sub-tab | "Reports" | tab-insights-reports |
| button | sub-tab | "Library" | tab-insights-library |
| button | sub-tab | "Hunches" | tab-insights-hunches |
| div | card | "Hot Leads Going Cold" | card-hot-leads |
| div | card | "New Leads Without Contact" | card-new-leads-no-contact |
| div | card | "Showroom Visitors Not Closed" | card-showroom-visitors |
| div | card | "Stale Leads (>7 days)" | card-stale-leads |
| button | button | "CSV" | button-export-stale |
| div | card | "Pending Finance" | card-pending-finance |
| div | metric | "Pipeline Active" | green-metric-gz-0 |
| div | metric | "Conversion Rate" | green-metric-gz-1 |
| div | metric | "Total Leads" | green-metric-gz-2 |
| div | card | "Active Pipeline" | pipeline-active |
| div | card | "Freshness Score" | pipeline-freshness |
| div | card | "Hot Leads" | pipeline-hot |
| div | card | "Month-End Forecast" | pipeline-forecast |
| button | button | "View Details" | button-pipeline-details |
| div | card | "Win Rate" | scorecard-sc-1 |
| div | card | "Total Sold" | scorecard-sc-2 |
| div | card | "Hot Leads" | scorecard-sc-3 |
| div | card | "Total Leads" | scorecard-sc-4 |
| button | button | "View Details" | button-scorecard-details |
| div | chart | "Leads This Week" | chart-leads |
| div | chart | "Conversions by Day" | chart-conversions |

### Tab: Calendar
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | button | "Today" | button-today |
| button | button | (prev) | button-prev-month |
| button | button | (next) | button-next-month |
| button | select | "Month" | select-calendar-view |
| div | calendar | -- | calendar-grid |
| div | day-cell | (per day) | calendar-day-{date} |
| button | button | "New Appointment" | button-new-appointment |
| div | sidebar | -- | calendar-sidebar |
| div | list | -- | calendar-event-list |

---

## Page: /service (Service)
**Elements found:** 70 unique (328 raw -- bulk is campaign rows and action buttons)

### Tabs
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| div | page-container | -- | service-page |
| input | file | (hidden CSV upload) | input-csv-upload |
| button | tab | "Campaigns" | tab-service-campaigns |
| button | tab | "Agents" | tab-service-agents |
| button | tab | "Insights" | tab-service-insights |
| button | tab | "Calendar" | tab-service-calendar |

### Tab: Campaigns
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | button | "Upload CSV" | button-upload-csv |
| button | button | "New Campaign" | button-new-campaign |
| tr | table-row | "{campaign name}" | campaign-row-{uuid} |
| button | switch | (kill switch) | switch-killswitch-{uuid} |
| button | button | (start) | button-start-campaign-{uuid} |
| button | button | (schedule) | button-schedule-campaign-{uuid} |
| button | button | (dry run) | button-dryrun-campaign-{uuid} |
| button | button | (upload CSV) | button-upload-csv-{uuid} |
| div | card | "Campaign Safety" | card-campaign-safety |
| button | button | (dismiss safety) | button-dismiss-campaign-safety |

### Tab: Agents
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | button | "New Agent" | button-new-agent |
| div | agent-card | "{agent name}" | agent-card-{uuid} |

### Tab: Insights
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | sub-tab | "Dashboard" | tab-insights-dashboard |
| button | sub-tab | "Reports" | tab-insights-reports |
| button | sub-tab | "Library" | tab-insights-library |
| button | sub-tab | "Hunches" | tab-insights-hunches |
| (same insight cards as Sales Insights) | | | |

### Tab: Calendar
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| (same calendar structure as Sales Calendar) | | | |

---

## Page: /marketing (Marketing)
**Elements found:** 27 unique (27 raw)

### Tabs
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| div | page-container | -- | marketing-page |
| button | tab | "Dashboard" | tab-marketing-dashboard |
| button | tab | "Agents" | tab-marketing-agents |
| button | tab | "Studio" | tab-marketing-studio |
| button | tab | "Insights" | tab-marketing-insights |

### Tab: Dashboard
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| div | metric-tile | "Campaign Performance {n}%" | metric-tile-mm-1 |
| div | metric-tile | "Campaigns Active {n}" | metric-tile-mm-2 |
| div | metric-tile | "Messages Sent {n}" | metric-tile-mm-3 |
| div | metric-tile | "Replies Received {n}" | metric-tile-mm-4 |

### Tab: Agents
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | button | "New Agent" | button-new-agent |
| div | agent-card | "{agent name}" | agent-card-{uuid} |
| button | switch | (active toggle) | switch-agent-active-{uuid} |
| button | button | (configure) | button-configure-agent-{uuid} |
| button | button | (delete) | button-delete-agent-{uuid} |
| div | badge | "{agent type}" | badge-agent-type-{uuid} |

### Tab: Studio
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | sub-tab | "Copywriter" | tab-studio-copywriter |
| button | sub-tab | "Photo Studio" | tab-studio-photo |
| button | sub-tab | "Video Producer" | tab-studio-video |
| button | sub-tab | "Creative Director" | tab-studio-director |
| button | sub-tab | "Market Intel" | tab-studio-market-intel |
| textarea | input | -- | textarea-studio-input |
| button | button | "Generate" | button-generate-content |

### Tab: Insights
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| (same insight structure as Sales/Service Insights) | | | |

---

## Page: /management (Management / Manage)
**Elements found:** 53 unique (53 raw)
**Note:** The sidebar shows "Manage" but routes to /management

### Tabs
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| div | page-container | -- | management-page |
| button | tab | "Insights" | tab-mgmt-insights |
| button | tab | "Hunches" | tab-mgmt-hunches |
| button | tab | "System Log" | tab-mgmt-activities |
| button | tab | "User Chats" | tab-mgmt-user-chats |
| button | tab | "Billing" | tab-mgmt-billing |

### Tab: Insights (default)
#### Sub-tabs
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | sub-tab | "Dashboard" | tab-insights-dashboard |
| button | sub-tab | "Reports" | tab-insights-reports |
| button | sub-tab | "Library" | tab-insights-library |
| button | sub-tab | "Hunches" | tab-insights-hunches |

#### Action Cards
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| div | card | "Hot Leads Going Cold" | card-hot-leads |
| div | card | "New Leads Without Contact" | card-new-leads-no-contact |
| div | card | "Showroom Visitors Not Closed" | card-showroom-visitors |
| div | card | "Stale Leads (>7 days)" | card-stale-leads |
| button | button | "CSV" | button-export-stale |
| div | card | "Pending Finance" | card-pending-finance |

#### Green Zone Metrics
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| div | metric | "Pipeline Active {n}" | green-metric-gz-0 |
| div | metric | "Conversion Rate {n}%" | green-metric-gz-1 |
| div | metric | "Total Leads {n}" | green-metric-gz-2 |

#### Pipeline Health
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | button | "View Details" | button-pipeline-details |
| div | card | "Active Pipeline" | pipeline-active |
| div | card | "Freshness Score" | pipeline-freshness |
| div | card | "Hot Leads" | pipeline-hot |
| div | card | "Month-End Forecast" | pipeline-forecast |

#### Performance Scorecard
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | button | "View Details" | button-scorecard-details |
| div | card | "Win Rate" | scorecard-sc-1 |
| div | card | "Total Sold" | scorecard-sc-2 |
| div | card | "Hot Leads" | scorecard-sc-3 |
| div | card | "Total Leads" | scorecard-sc-4 |

#### Charts
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| div | chart | "Leads This Week" | chart-leads |
| div | chart | "Conversions by Day" | chart-conversions |

### Tab: Hunches
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | button | "Generate Hunches" | button-generate-hunches |
| div | card | "{hunch title}" | hunch-card-{uuid} |
| button | button | "Accept" | button-accept-hunch-{uuid} |
| button | button | "Dismiss" | button-dismiss-hunch-{uuid} |

### Tab: System Log
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| div | activity | "{event description}" | activity-item-{uuid} |
**(scrollable feed of system events with timestamps)**

### Tab: User Chats
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| h3 | heading | "User Chats" | -- |
**(appears to be an empty/minimal view)**

### Tab: Billing
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| div | tab-content | -- | billing-tab-content |
| h2 | heading | "Billing Not Configured" | text-billing-not-configured |
| p | text | "Billing is not yet configured..." | text-billing-not-configured-msg |

---

## Page: /settings (System Settings)
**Elements found:** 29 unique (29 raw) on tile view

### Settings Tiles (org_admin: 6 tiles, super_admin: 7 tiles)
| Element | Type | Text/Label | data-testid | Role Visibility |
|---------|------|-----------|-------------|-----------------|
| div | tile | "User Management" | settings-tile-users | both |
| div | tile | "Organization" | settings-tile-organization | super_admin only (org_admin could not load) |
| div | tile | "Tools & Integrations" | settings-tile-tools | both |
| div | tile | "Knowledge Base" | settings-tile-knowledge | both |
| div | tile | "AI Configuration" | settings-tile-ai | **super_admin only** |
| div | tile | "Notifications" | settings-tile-notifications | both |
| div | tile | "Appearance" | settings-tile-appearance | both |

### Settings > User Management (inline view on /settings)
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | button | "Back" | button-back-settings |
| button | button | "Add User" | button-add-user |
| button | button | "Invite User" | button-invite-user |
| input | search | (search users) | input-search-users |
| div | user-row | "{user name} {role}" | user-{uuid} |
| button | button | (user menu) | user-menu-{uuid} |

### Settings > Organization (super_admin only, inline on /settings)
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | button | "Back" | button-back-settings |
| input | text | (org name) | input-org-name |
| input | text | (persona name) | input-persona-name |
| input | text | (org phone) | input-org-phone |
| input | text | (org email) | input-org-email |
| button | switch | (public listing) | switch-public-listing |
| button | button | "Save Changes" | button-save-org |
| input | text | (timezone) | input-timezone |
| input | text | (business hours start) | input-business-hours-start |
| input | text | (business hours end) | input-business-hours-end |
| textarea | textarea | (after hours message) | textarea-after-hours-message |
| button | button | "Save Business Hours" | button-save-business-hours |
| button | switch | (communication gate) | switch-communication-gate |
| button | switch | (SMS channel) | switch-sms-channel |
| button | switch | (Email channel) | switch-email-channel |
| button | switch | (Phone channel) | switch-phone-channel |
| button | switch | (Video channel) | switch-video-channel |
| input | text | (rate limit) | input-rate-limit |
| input | text | (TextMagic phone) | input-textmagic-phone |

### Settings > Tools & Integrations (inline on /settings)
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | button | "Back" | button-back-settings |
| button | tab | "MCP" | tab-mcp |
| button | tab | "API" | tab-api-tools |
| button | tab | "Other" | tab-other |
| button | tab | "Universal" | tab-universal |
| button | tab | "Widgets" | tab-widgets |
| button | tab | "Pages" | tab-landing-pages |

### Settings > Knowledge Base (inline on /settings)
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | button | "Back" | button-back-settings |
| button | tab | "Documents" | tab-kb-documents |
| button | tab | "Web Pages" | tab-kb-web-pages |
| button | tab | "Databases" | tab-kb-databases |
| button | tab | "Settings" | tab-kb-settings |
| input | search | (search documents) | input-search-documents |
| input | file | (file upload) | input-file-upload |
| button | button | "Upload" | button-upload-document |
| tr | table-row | "{filename}" | doc-row-{uuid} |
| td | text | "{name}" | text-doc-name-{uuid} |
| td | text | "{type}" | text-doc-type-{uuid} |
| td | text | "{size}" | text-doc-size-{uuid} |
| td | text | "{date}" | text-doc-date-{uuid} |
| button | button | (delete) | button-delete-doc-{uuid} |

### Settings > AI Configuration (super_admin only, inline on /settings)
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | button | "Back" | button-back-settings |
| button | tab | "System Prompt" | tab-system-prompt |
| button | tab | "Agent Behavior" | tab-agent-behavior |
| button | tab | "Hunches" | tab-hunches |
| button | select | "Claude (Anthropic)" | select-ai-model |
| textarea | textarea | (system prompt) | textarea-system-prompt |
| textarea | textarea | (chat quality instructions) | textarea-chat-instructions |
| button | button | "Save" | button-save-system-prompt |

### Settings > Notifications (inline on /settings)
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | button | "Back" | button-back-settings |
| button | switch | (email notifications) | switch-email-notifications |
| button | switch | (SMS notifications) | switch-sms-notifications |
| button | switch | (push notifications) | switch-push-notifications |
| input | time | (quiet hours start) | input-quiet-start |
| input | time | (quiet hours end) | input-quiet-end |
| button | switch | (new lead notification) | switch-notification-new-lead |
| button | switch | (appointment booked) | switch-notification-appointment-booked |
| button | switch | (agent alert) | switch-notification-agent-alert |
| button | switch | (task due) | switch-notification-task-due |
| button | button | "Save" | button-save-notifications |

### Settings > Appearance (inline on /settings)
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | button | "Back" | button-back-settings |
| button | switch | (compact mode) | switch-compact-mode |
| button | switch | (animations) | switch-animations |
| button | select | "Dashboard" | select-default-view |
| button | switch | (metric tiles) | switch-metric-tiles |
| button | button | "Save" | button-save-appearance-settings |

---

## Page: /profile (Profile)
**Elements found:** 30 unique (30 raw)

### Tabs
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| button | tab | "My Profile" | tab-profile-main |
| button | tab | "Preferences" | tab-profile-preferences |

### Tab: My Profile
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| span | avatar | "{initials}" | button-upload-photo |
| input | file | (photo upload, hidden) | -- |
| button | button | "Edit Profile" | button-edit-profile |
| input | text | (email) | input-email |
| input | text | (phone) | input-phone |
| button | button | "Save Changes" | button-save-contact |
| input | password | (current password) | input-current-password |
| input | password | (new password) | input-new-password |
| input | password | (confirm password) | input-confirm-password |
| button | button | "Change Password" | button-submit-change-pw |

---

## Page: /insights (Insights -- standalone route)
**Elements found:** 56 unique (56 raw)
**Note:** This is a standalone route that renders the SAME Insights dashboard as Management > Insights tab. Contains the same sub-tabs (Dashboard, Reports, Library, Hunches) and the same cards (Hot Leads, Stale Leads, Pipeline Health, Scorecard, Charts).

---

## Page: /usage (Usage)
**Elements found:** 26 unique (26 raw)

| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| div | page-container | -- | usage-page |
| h1 | heading | "Usage" | text-usage-title |
| button | select | "This Month" | select-usage-period |
| p | stat | "{n}" | text-total-events |
| p | stat | "{n}" | text-event-types |
| p | stat | "{period}" | text-org-count |
| div | usage-row | "SMS Failed {n}" | usage-row-outbound_sms_failed |
| div | usage-row | "SMS Sent {n}" | usage-row-outbound_sms |
| div | usage-row | "SMS Blocked {n}" | usage-row-outbound_sms_blocked |

---

## Page: /login (Login -- unauthenticated)
| Element | Type | Text/Label | data-testid |
|---------|------|-----------|-------------|
| h1 | heading | "Nexxus" | -- |
| p | text | "Customer portal" | -- |
| input | text | "Email Address" | -- |
| input | password | "Password" | -- |
| button | submit | "Sign in" (disabled until filled) | -- |
| a | link | "Forgot password?" (/forgot-password) | -- |

---

## Page: /manage (404 -- incorrect route)
**Note:** /manage returns 404. Correct route is /management. The sidebar button "Manage" navigates to /management.

---

## Super Admin Differences Summary

| Area | org_admin | super_admin |
|------|-----------|-------------|
| Sidebar items | 7 items (identical) | 7 items (identical) |
| Settings tiles | 6 tiles | **7 tiles** (+AI Configuration) |
| Settings > Organization | Tile present but **failed to load** (timeout) | Full access with org profile, business hours, comm settings |
| Settings > AI Configuration | **Not visible** | Full access: System Prompt, Agent Behavior, Hunches, model selection |
| Management tabs | 5 tabs (identical) | 5 tabs (identical) |
| Other pages | No differences observed | No differences observed |

---

## data-testid Coverage Summary

| Page/Section | Has testIds | Coverage Notes |
|-------------|-------------|----------------|
| Login | No | No testIds on login form |
| Global Shell | Yes | Full coverage on header and sidebar |
| Main (AI Chat) | Yes | Full coverage |
| TeamBox | Yes | Full coverage including filters, conversation items |
| Sales Dashboard | Yes | Full coverage on tiles and metrics |
| Sales Agents | Yes | Agent cards with UUIDs |
| Sales Insights | Yes | All cards and metrics |
| Sales Calendar | Yes | Calendar grid and controls |
| Service Campaigns | Yes | Campaign rows with action buttons |
| Service Agents | Yes | Agent cards |
| Marketing Dashboard | Yes | Metric tiles |
| Marketing Agents | Yes | Agent cards with controls |
| Marketing Studio | Yes | Studio tabs and input |
| Management | Yes | All tabs and content |
| Settings | Yes | All tiles and sub-views |
| Profile | Yes | All form fields and buttons |
| Usage | Yes | Period selector and usage rows |
| Insights | Yes | Same as Management > Insights |

**Total unique testId patterns discovered:** ~180+
**Total interactive elements across all pages:** ~500+ unique patterns (1000+ raw including repeated data items)
