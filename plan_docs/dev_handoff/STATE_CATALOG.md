# Nexxus V2 — State Catalog

Every possible visual state for every major view type. Ensures no state is unhandled.

---

## Global Data States

These states apply to any view that fetches/displays data:

| State | Trigger | Visual Treatment |
|-------|---------|-----------------|
| Loading | Initial fetch / page load | Skeleton matching content layout (pulse animation) |
| Loaded | Data received successfully | Normal render with formatted content |
| Empty | Zero items in collection | Empty illustration (icon) + heading + subtext + CTA button |
| Filtered Empty | Filters active, zero matches | "No results match your filters" + "Clear filters" link |
| Error | API failure / network error | Error card: AlertCircle icon + error message + "Retry" button |
| Stale | Data older than TTL | Normal render + "Last updated X ago" subtitle + RefreshCw icon |


## Global Interactive States

| State | Trigger | Visual Treatment |
|-------|---------|-----------------|
| Default | Rest / no interaction | Normal styling per component spec |
| Hover | Mouse enter | `hover-elevate` overlay (rgba(0,0,0,0.03) light / rgba(255,255,255,0.04) dark), cursor pointer |
| Active/Pressed | Mouse down | `active-elevate` overlay (rgba(0,0,0,0.08) light / rgba(255,255,255,0.09) dark) |
| Focused | Tab key / keyboard nav | 2px ring in `--ring` color, offset 2px |
| Selected | Click to select | Background: `bg-accent`, optional left border `border-l-2 border-primary` |
| Disabled | Condition met | 50% opacity, `cursor-not-allowed`, no hover effect |


## Global Form States

| State | Trigger | Visual Treatment |
|-------|---------|-----------------|
| Pristine | Initial load | Normal borders (`border-input`) |
| Touched | Blur after focus | No visual change until validation |
| Valid | Passes validation | Optional green CheckCircle right of input |
| Invalid | Fails validation | Red border (`border-destructive`), red error text below field (`text-destructive text-xs`), field connected via `aria-describedby` |
| Submitting | Form submit clicked | All inputs disabled, submit button shows Loader2 spinner |
| Submit Success | API returns success | Toast notification (success variant), form resets or navigates away |
| Submit Error | API returns error | Toast notification (error variant) OR inline error banner above form |

---

## Per-View State Catalog

### Main Page (Home / Chat)

| State | Trigger | Visual Treatment |
|-------|---------|-----------------|
| Default | Page load | "AI Key Metrics" title, 4 gradient metric tiles (role-specific), 1 sample AI response with thinking card, suggestion bubbles visible |
| Loading | Metrics loading | Skeleton rectangles in metric tile positions (pulse animation) |
| Chat Active | User sends message | User message right-aligned, wave-dot animation, then bot response left-aligned |
| Chat Typing | Waiting for AI response | Wave-dot animation (3 dots bouncing): `wave-dot` CSS class with 1.4s ease-in-out infinite |
| Thinking Collapsed | Default state of thinking card | Brain icon + summary text ("Analyzed your dealership profile"), purple left border, ChevronRight icon |
| Thinking Expanded | User clicks thinking card toggle | Expands to show detailed reasoning steps (pipeline data, performance review, priority follow-ups). ChevronDown icon |
| Role Changed | RBAC role switched | Metric tiles update to show role-specific metrics with smooth transition |
| Empty Chat | No messages sent yet | Sample response + suggestion bubbles visible. No "empty state" — always has suggestions |

### Insights — Dashboard Tab

| State | Trigger | Visual Treatment |
|-------|---------|-----------------|
| Loaded | Data available | Command Center metrics + Pipeline visualization + Charts (Recharts) + Scorecard |
| Loading | Initial load | Skeleton cards for metrics, skeleton rectangles for charts |
| Chart Hover | Mouse over chart element | Recharts tooltip with data point details |
| Date Range Changed | Date picker selection | Charts and metrics update to reflect new range |
| Tab Switch | Click sub-tab | Content transitions to selected sub-section (Command Center / Pipeline / Charts / Scorecard) |

### Insights — Reports Tab

| State | Trigger | Visual Treatment |
|-------|---------|-----------------|
| Loaded | Reports list available | List of report cards with title, date range, type |
| Empty | No reports | "No reports generated yet" + "Create Report" CTA |
| Detail Open | Click report | ReportDetailDialog opens with full report data |
| Export | Click export button | Download triggers, toast notification "Report exported" |

### Insights — Library Tab

| State | Trigger | Visual Treatment |
|-------|---------|-----------------|
| Loaded | 61+ metrics available | Searchable/filterable grid of metric cards |
| Searching | User types in search | Real-time filter, matching metrics shown |
| Filtered Empty | Search/filter with no matches | "No metrics match your search" + "Clear search" |
| Grid View | Grid toggle active | Metrics in card grid layout |
| List View | List toggle active | Metrics in compact list/table layout |
| Detail Open | Click metric card | MetricDetailDialog with full metric data |
| Pin Toggle | Click pin icon | Metric pinned/unpinned, toast confirmation |

### Insights — Hunches Tab

| State | Trigger | Visual Treatment |
|-------|---------|-----------------|
| Loaded | Hunches available | List of AI-generated insights with Lightbulb icon |
| Empty | No hunches | "No hunches yet — AI is analyzing your data" + Sparkles icon |
| Preferences Open | Click settings icon | Right-side Sheet opens with per-user hunch preferences |
| Preferences Save | Click Save | Toast "Preferences saved", Sheet closes |

### Agents Page

| State | Trigger | Visual Treatment |
|-------|---------|-----------------|
| List Loaded | Agents available | Left panel (272px): scrollable agent list with search |
| No Selection | No agent selected | Detail panel shows "Select an agent to view details" prompt |
| Agent Selected | Click agent in list | Detail panel shows agent name, status, config, chat history |
| Agent Active | Agent status = active | Green StatusBadge "Active" |
| Agent Inactive | Agent status = inactive | Gray StatusBadge "Inactive" |
| Chat Active | User sends message to agent | Chat interface in detail panel with wave-dot typing animation |
| Config Open | Right pane toggled open | Agent configuration panels visible (Performance, Instructions, Triggers, Tools & Skills, Knowledge, Activity) |
| Skills Modal | Click Manage skills | Modal with 20-skill catalog, category filters, checkboxes |
| Trigger Config | View triggers | Per-agent trigger table with schedule and toggles |
| Empty List | No agents | "No agents yet" + "Create Agent" CTA button |
| Creating | "New Agent" clicked | New agent form in detail panel |
| Mobile | < 768px | List hidden, dropdown access, detail full-width |

### Hub — Calendar Tab

| State | Trigger | Visual Treatment |
|-------|---------|-----------------|
| Loaded | Events available | Calendar grid with event indicators |
| Empty Day | No events on selected date | "No events scheduled" |
| Schedule Modal | Click "Schedule" or click time slot | ScheduleModal opens with date/time/title/notes fields |
| Event Hover | Mouse over event | Tooltip with event details |

### Hub — Leads Tab

| State | Trigger | Visual Treatment |
|-------|---------|-----------------|
| Loaded | Leads available | Table view with lead name, phone, status, date |
| Empty | No leads | "No open leads" + "Import Leads" CTA |
| Searching | User types in search | Real-time filter of leads table |
| Filtered Empty | Search with no matches | "No leads match your search" |

### Hub — Inbox Tab

| State | Trigger | Visual Treatment |
|-------|---------|-----------------|
| Loaded | Messages available | Inbox-style message list |
| Empty | No messages | "No messages" + "Compose" CTA |
| Compose Email | Click compose email | New message modal with to/subject/body fields |
| Compose SMS | Click compose SMS | New message modal with to/message fields |
| Dialer Open | Click phone icon | DialerModal with number pad |
| Message Selected | Click message in list | Message detail view in right portion |

### Drive Page

| State | Trigger | Visual Treatment |
|-------|---------|-----------------|
| Loaded | Files/folders available | File list with name, type icon, size, modified date |
| Empty Folder | Folder has no files | "This folder is empty" + "Upload" CTA |
| Grid View | Grid toggle active | Files as card grid with preview thumbnails |
| List View | List toggle active | Files in compact table rows |
| Uploading | File upload in progress | Progress bar in upload area |
| Share Modal | Click share button on file | ShareModal with Email/SMS tabs |
| Folder Navigation | Click folder | Navigate into folder, breadcrumb updates |
| New Folder | Click new folder | Inline rename input for folder name |
| Download | Click Download button | Toast "Downloading file..." |
| Download PDF | Click Download as PDF | Toast "Converting to PDF..." (only for document/spreadsheet/image types) |

### Settings Page

| State | Trigger | Visual Treatment |
|-------|---------|-----------------|
| Tile Grid | Initial load | Grid of 9 settings tiles based on current role (was 10, API & Webhooks removed) |
| Section Open | Click tile | Navigate to section detail with back button |
| Tools Config | Open Tools | 5/7-tab interface (MCP/API/Other/Widgets/Landing Pages + API Keys/Webhooks for Super Admin) |
| Knowledge Base | Open Knowledge | 4-tab interface (Documents/Web Pages/Databases/Settings) |
| AI Configuration | Open AI Config | 4-tab interface (System Prompt/Agent Behavior/Skills/Hunches). Partner Admin read-only |
| Skills Catalog | Open Skills tab | Searchable/filterable list of 20 skills with category buttons (All/Sales/Finance/Operations/General) |
| Skills Edit | Click skill | Edit panel with name, category, description, prompt, temperature, status |
| Kill Switch | Click DISABLE ALL | Confirmation dialog, then simulated emergency shutdown |
| Security | Open Security | All items grayed out in ON state, only Password Reset button functional |
| Data Management | Open Data | 2-tab interface (Database Uploads / Data Health). Upload dialog with field mapping |
| Widget Config | Open widget | 5-tab interface (Settings/Appearance/Targeting/Domains/Embed) |
| Widget Preview | Click preview | WidgetPreviewModal at 85% scale |
| Landing Page Edit | Click landing page | Edit form with title, content, linked widget |
| Save Success | Save settings | Toast "Settings saved successfully" |
| Role Restricted | Insufficient role | Tile not visible in grid |

### Billing Management Page (/settings/billing)

| State | Trigger | Visual Treatment |
|-------|---------|-----------------|
| Super Admin View | Role = super_admin | Revenue Overview (6 metric cards), Org Billing Status table, Invoice Builder |
| Partner Admin View | Role = partner_admin | My Organizations table, summary cards |
| Access Denied | Role = org_admin/staff | Card with "Access Denied" message |
| Org Expand | Click org row | Billing configuration form expands for that org |
| Invoice Builder | Build invoice | Line items table, total calculation, Preview/Send buttons |

### Organization Creation Wizard (/settings/org-wizard)

| State | Trigger | Visual Treatment |
|-------|---------|-----------------|
| Step Active | Navigate wizard | Step indicator shows completed (checkmark), current (ring), future (gray) |
| Validation Error | Missing required field | Red border on field, "Required" text shown |
| Step 1-6 | Progress through wizard | Form content updates per step, Next/Back buttons |
| Review (Step 7) | Final step | Summary of all entered data, validation warnings, Create button |
| Success | Click Create | Toast "Organization created successfully", redirect to User Management |
| Access Denied | Non Super/Partner Admin | Redirect to /settings with toast |

### Profile Page

| State | Trigger | Visual Treatment |
|-------|---------|-----------------|
| Loaded | User data available | Profile tab: name, email, phone, avatar |
| Editing | Click edit button | Fields become editable inputs |
| Preferences | Tab to preferences | Toggle switches for notifications, dark mode, timezone select |
| Billing | Tab to billing | Usage progress bars (Voice/Video/SMS/Documents), Overage display, Add-Ons table, Invoice History |

### Widget Landing Page (/w/demo)

| State | Trigger | Visual Treatment |
|-------|---------|-----------------|
| Default | Page load | 6 channel cards + contact form + "Launch Live Video Chat" button |
| Chat Active | Click chat card | Chat panel expands with simulated bot responses |
| Video Active | Click video/launch button | Video connection UI with "Connecting..." animation |
| Voice Active | Click voice card | Microphone visualization with audio wave animation |
| Callback | Click callback card | Callback request form |
| SMS | Click SMS card | SMS compose form |
| Form Submit | Submit contact form | Success message "Thank you! We'll be in touch" |

---

## Toast State Reference

| Variant | Icon | Color | Auto-Dismiss | Usage |
|---------|------|-------|-------------|-------|
| Success | CheckCircle | Green (`text-green-500`) | 3 seconds | Save success, action completed |
| Error | AlertCircle | Red (`text-destructive`) | Persistent (manual dismiss) | API failure, validation error |
| Warning | AlertTriangle | Amber (`text-amber-500`) | 5 seconds | Attention needed, non-critical |
| Info | Info | Blue (`text-primary`) | 3 seconds | Status update, informational |

---

## Skeleton Loading Reference

| Content Type | Skeleton Shape | Animation |
|-------------|---------------|-----------|
| Metric tile | Rounded rectangle (full card size) | `animate-pulse` |
| Table row | 4-5 horizontal bars per row, 5-8 rows | `animate-pulse` |
| Chart | Rectangle matching chart dimensions | `animate-pulse` |
| Card | Card outline with 2-3 bars inside | `animate-pulse` |
| Avatar | Circle matching avatar size | `animate-pulse` |
| Text line | Horizontal bar, 60-80% width | `animate-pulse` |
| Chat message | Rounded rectangle, alternating left/right | `animate-pulse` |

## Wave-Dot Typing Animation

Used whenever AI is "thinking" or generating a response:
- 3 dots, each 6px diameter, `bg-muted-foreground`
- Animation: `wave` keyframes (translateY bounce, staggered 0.2s delay per dot)
- Duration: 1.4s ease-in-out infinite
- Applied via `.wave-dot` CSS class

---

## SubMenuManager Local State

The SubMenuManager tracks active sub-menu tabs via local state (not context) to ensure proper re-rendering when only query parameters change:

| State Variable | Type | Initial Value | Purpose |
|---|---|---|---|
| `activeInsightsTab` | `string` | From URL `?tab=` or `'dashboard'` | Tracks which Insights sub-menu item is highlighted |
| `activeHubTab` | `string` | From URL `?tab=` or `'calendar'` | Tracks which Hub sub-menu item is highlighted |

These are synchronized with the URL on route changes via `useEffect([location])` and updated immediately on click via local `setState` calls.

## Custom Events for Tab Switching

| Event Name | Dispatched By | Listened By | Detail Payload |
|---|---|---|---|
| `insights-tab-change` | `SubMenuManager.tsx` | `insights.tsx` | Tab ID string (e.g., `'reports'`, `'library'`) |
| `hub-tab-change` | `SubMenuManager.tsx` | `work-center.tsx` | Tab ID string (e.g., `'calendar'`, `'leads'`, `'inbox'`) |

Both listeners validate the tab ID against an allowed list before updating state, and properly remove the event listener on unmount.
