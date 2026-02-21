# Nexxus V2 — Component Annotation Sheet

Every distinct component in the design system, documenting what to build each piece from, what variants exist, and how to test it.

---

## Layout Components

| Property | Value |
|----------|-------|
| **Component Name** | AppLayout |
| **shadcn/ui Base** | Custom |
| **Variants** | - |
| **States** | authenticated (full layout), unauthenticated (redirect) |
| **Sizes** | Responsive: full viewport |
| **Test ID Pattern** | - |
| **Notes** | Wraps all authenticated pages. Renders Sidebar + TopBar + Main Content + optional RightPane. `/w/*` routes render outside AppLayout. |

---

| Property | Value |
|----------|-------|
| **Component Name** | Sidebar |
| **shadcn/ui Base** | Custom |
| **Variants** | collapsed (icons only, 64px), expanded (with sub-menu) |
| **States** | default, hovered (shows sub-menu preview), pinned (sub-menu stays open) |
| **Sizes** | w-16 (64px) fixed |
| **Test ID Pattern** | `button-toggle-submenu`, `button-show-sidebar` |
| **Notes** | ClickUp-style thin icon strip. Toggle arrows only visible on pages with sub-menus. Double-arrow under logo pins sub-menu globally via `subMenuExpanded` state. |

---

| Property | Value |
|----------|-------|
| **Component Name** | TopBar |
| **shadcn/ui Base** | Custom |
| **Variants** | desktop (full), mobile (hamburger menu) |
| **States** | default |
| **Sizes** | h-14 (56px) sticky top |
| **Test ID Pattern** | `button-org-switcher`, `button-notifications`, `button-theme-toggle`, `button-profile-menu` |
| **Notes** | Logo left, org switcher center (Building2 icon + name + chevron), notifications/activity/theme/profile/role-arrow right. Role switcher is temporary dev tool with tiny arrow dropdown on far-right. |

---

| Property | Value |
|----------|-------|
| **Component Name** | SubMenuManager |
| **shadcn/ui Base** | Custom |
| **Variants** | Per-page sub-menus: agents, drive, insights, settings, profile, work-center |
| **States** | hidden, previewing (hover), pinned (expanded) |
| **Sizes** | Fixed position, left-16 top-14 z-40 |
| **Test ID Pattern** | `button-collapse-{page}-panel`, `panel-insights-{tab}`, `panel-wc-{tab}`, `panel-conversation-{id}`, `button-conv-menu-{id}`, `menu-resume-{id}`, `menu-delete-{id}` |
| **Notes** | 800ms leave timeout for usability (with proper cleanup on unmount). Renders appropriate sub-menu based on `activePanel`. Home page has its own internal panel (not part of SubMenuManager). Chat history items have hover-reveal 3-dot menu (Resume/Delete) and keyboard accessibility (`role="button"`, `tabIndex`, `onKeyDown`). Insights and Hub tabs use custom events (`insights-tab-change`, `hub-tab-change`) to switch tabs when already on the page (workaround for wouter not detecting query-only URL changes). Active tab is tracked via local state (`activeInsightsTab`, `activeHubTab`) for proper highlight rendering. |

---

| Property | Value |
|----------|-------|
| **Component Name** | RightPane |
| **shadcn/ui Base** | Custom |
| **Variants** | desktop-panel (side-by-side), mobile-overlay (full-screen) |
| **States** | open, closed |
| **Sizes** | Desktop: w-80 (320px) / lg:w-96 (384px) fixed-width panel. Mobile: full-screen overlay (`fixed inset-0 z-50`). |
| **Test ID Pattern** | `button-open-right-pane`, `button-close-right-pane`, `button-close-right-pane-mobile` |
| **Notes** | Persistent AI chat interface (Automa). Defaults closed. On desktop (md+), opens as a side panel to the RIGHT of main content — both visible simultaneously. On mobile (<md), opens as full-screen overlay covering all content. Rendered AFTER main content in DOM order to appear on the right side. |

---

| Property | Value |
|----------|-------|
| **Component Name** | MobileNavDropdown |
| **shadcn/ui Base** | DropdownMenu |
| **Variants** | - |
| **States** | open, closed |
| **Sizes** | Full width on mobile |
| **Test ID Pattern** | `dropdown-mobile-nav`, `button-close-mobile-menu` |
| **Notes** | Unified navigation dropdown for sub-menu + favorites access on mobile. |

---

## Interactive Components

| Property | Value |
|----------|-------|
| **Component Name** | StatusBadge |
| **shadcn/ui Base** | Badge |
| **Variants** | success (green), warning (amber), error (red), info (blue), neutral (gray) |
| **States** | default |
| **Sizes** | sm, md |
| **Test ID Pattern** | `badge-status-{value}` |
| **Notes** | No click handler. Used for lead status, agent status, widget status, approval status. |

---

| Property | Value |
|----------|-------|
| **Component Name** | MetricTile |
| **shadcn/ui Base** | Card |
| **Variants** | gradient (role-specific colors), trend-up, trend-down, trend-flat |
| **States** | loaded, loading (skeleton pulse) |
| **Sizes** | Responsive grid: 4-across → 2-across → 1-column |
| **Test ID Pattern** | `metric-{name}` |
| **Notes** | Main page "AI Key Metrics" tiles. Large number + label + trend arrow + percentage. Role-specific metrics per RBAC role. Currency formatted with $ and K/M suffix, percentages with %, time with units, counts as integers. |

---

| Property | Value |
|----------|-------|
| **Component Name** | ActionButton |
| **shadcn/ui Base** | Button |
| **Variants** | primary (default), secondary, destructive, ghost, outline |
| **States** | default, hover (elevate-1), active (elevate-2), disabled (50% opacity), loading (spinner replaces text) |
| **Sizes** | sm, md (default), lg, icon-only |
| **Test ID Pattern** | `button-{action}` |
| **Notes** | Loading state replaces label with Loader2 spinner icon. All buttons use hover-elevate/active-elevate system. |

---

| Property | Value |
|----------|-------|
| **Component Name** | SearchInput |
| **shadcn/ui Base** | Input |
| **Variants** | with Search icon, with clear button (X) |
| **States** | empty, typing, filtered, no-results |
| **Sizes** | - |
| **Test ID Pattern** | `input-search-{context}` (e.g., `input-agent-search`, `input-search-leads`) |
| **Notes** | Debounce 300ms on change. Search icon left-aligned inside input. Clear button appears when value is non-empty. |

---

| Property | Value |
|----------|-------|
| **Component Name** | DataTable |
| **shadcn/ui Base** | Table |
| **Variants** | sortable (column headers clickable), selectable (checkboxes) |
| **States** | loaded, loading (skeleton rows), empty (illustration + CTA), filtered-empty ("No results match"), error (retry) |
| **Sizes** | density-data (13px font, compact rows) |
| **Test ID Pattern** | `table-{name}` |
| **Notes** | Sticky header on scroll. Used in Insights Library, Drive file list, Hub leads. Row hover: background lighten/darken. |

---

| Property | Value |
|----------|-------|
| **Component Name** | FormField |
| **shadcn/ui Base** | FormField (react-hook-form + zod) |
| **Variants** | text, number, email, tel, textarea, select, toggle (Switch), color picker |
| **States** | default, focused (ring), error (red border + error text below), disabled (grayed out), readonly |
| **Sizes** | - |
| **Test ID Pattern** | `input-{field-name}` |
| **Notes** | Label above input. Required fields marked with asterisk. Error messages below field via aria-describedby. |

---

| Property | Value |
|----------|-------|
| **Component Name** | ChatMessage |
| **shadcn/ui Base** | Custom |
| **Variants** | bot (left-aligned), user (right-aligned) |
| **States** | sent, sending (wave-dot animation), error |
| **Sizes** | density-chat (14px font, spacious padding) |
| **Test ID Pattern** | `main-chat-message-{id}` |
| **Notes** | No avatars per design spec. Bot messages left, user messages right. Wave-dot animation for "typing" state. Max-width 65ch. Bot messages may contain an optional ThinkingCard (see below). |

---

| Property | Value |
|----------|-------|
| **Component Name** | ThinkingCard |
| **shadcn/ui Base** | Custom |
| **Variants** | collapsed (summary only), expanded (full reasoning) |
| **States** | collapsed, expanded |
| **Sizes** | Full width within message bubble |
| **Test ID Pattern** | `thinking-card`, `button-toggle-thinking` |
| **Notes** | Collapsible info card showing AI reasoning process. Brain icon + summary text. Purple left border (`border-l-2 border-purple-400`). ChevronDown/ChevronRight toggle icon. Expanded state reveals detailed reasoning steps as bullet points. Data driven by optional `thinking` field on ChatMessage interface (`ThinkingBlock`). |

---

| Property | Value |
|----------|-------|
| **Component Name** | ChatInput |
| **shadcn/ui Base** | Textarea + Button |
| **Variants** | standard (RightPane), main-page (gradient border animation) |
| **States** | empty, typing, sending (disabled) |
| **Sizes** | - |
| **Test ID Pattern** | `input-chat-message` / `input-agent-chat`, `button-chat-send` / `button-agent-send` |
| **Notes** | Main page input has gradient-shift animation (purple→blue→cyan). Send button is icon-only (Send icon). Suggestion bubbles always visible below. |

---

| Property | Value |
|----------|-------|
| **Component Name** | AgentCard |
| **shadcn/ui Base** | Card |
| **Variants** | default, selected (highlighted), inactive (muted) |
| **States** | default, selected, loading |
| **Sizes** | List panel width: 272px |
| **Test ID Pattern** | `card-agent-{id}` |
| **Notes** | Desktop: list panel left side. Click to select and show detail center. Shows agent name, status badge, description snippet. |

---

| Property | Value |
|----------|-------|
| **Component Name** | WidgetConfigCard |
| **shadcn/ui Base** | Card |
| **Variants** | text-chat, live-video, voice-call, unified |
| **States** | active (green badge), inactive (gray badge) |
| **Sizes** | - |
| **Test ID Pattern** | `card-widget-{type}` |
| **Notes** | Shows widget type icon, name, status toggle, and action buttons (Preview, Configure). Each type has unique icon and gradient. |

---

| Property | Value |
|----------|-------|
| **Component Name** | WidgetPreviewModal |
| **shadcn/ui Base** | Dialog |
| **Variants** | text-chat, live-video, voice-call, unified |
| **States** | open, closed |
| **Sizes** | max-w-md, scaled to 85% |
| **Test ID Pattern** | `dialog-widget-preview`, `preview-widget-button` |
| **Notes** | Shows simulated widget popup at 85% scale with floating button below. Header uses widget's primaryColor. Unified type has extra "Preview Landing Page" button linking to /w/demo. |

---

| Property | Value |
|----------|-------|
| **Component Name** | FavoriteStar |
| **shadcn/ui Base** | Button (ghost, icon-only) |
| **Variants** | favorited (filled star, yellow), unfavorited (outline star, muted) |
| **States** | default, hover |
| **Sizes** | icon-only (16px) |
| **Test ID Pattern** | `button-toggle-favorite` |
| **Notes** | Click toggles favorite state. Used in sidebar sub-menus and file rows. |

---

| Property | Value |
|----------|-------|
| **Component Name** | OrgSwitcher |
| **shadcn/ui Base** | DropdownMenu |
| **Variants** | - |
| **States** | open, closed |
| **Sizes** | - |
| **Test ID Pattern** | `button-org-switcher`, `dropdown-org-switcher` |
| **Notes** | Center of TopBar. Building2 icon + org name + chevron. Dropdown shows list of organizations with checkmark on current. |

---

| Property | Value |
|----------|-------|
| **Component Name** | NotificationDropdown |
| **shadcn/ui Base** | DropdownMenu |
| **Variants** | with unread count badge, no unread |
| **States** | open, closed |
| **Sizes** | w-80 (320px) |
| **Test ID Pattern** | `button-notifications`, `dropdown-notifications` |
| **Notes** | Bell icon with red dot when unread. Dropdown shows notification list with timestamp, icon, and description. |

---

| Property | Value |
|----------|-------|
| **Component Name** | ActivityDropdown |
| **shadcn/ui Base** | DropdownMenu |
| **Variants** | with filter options |
| **States** | open, closed, filtered |
| **Sizes** | w-96 (384px) |
| **Test ID Pattern** | `button-activity-feed`, `dropdown-activity`, `button-filter-activity` |
| **Notes** | Activity feed with type filter. Now located in Insights sub-menu (moved from standalone sidebar). |

---

| Property | Value |
|----------|-------|
| **Component Name** | ShareModal |
| **shadcn/ui Base** | Dialog |
| **Variants** | Email tab, SMS tab |
| **States** | open, closed, sending, sent |
| **Sizes** | max-w-md |
| **Test ID Pattern** | `share-modal`, `share-tab-email`, `share-tab-sms`, `button-send-share` |
| **Notes** | Used in Drive for file sharing. Two tabs: Email and SMS. Input for recipient + optional message. |

---

| Property | Value |
|----------|-------|
| **Component Name** | ScheduleModal |
| **shadcn/ui Base** | Dialog |
| **Variants** | - |
| **States** | open, closed, submitting |
| **Sizes** | max-w-md |
| **Test ID Pattern** | `schedule-modal`, `schedule-date`, `schedule-time`, `schedule-confirm` |
| **Notes** | Used in Hub Calendar. Fields: title, date, time, notes. Confirm/cancel buttons. |

---

| Property | Value |
|----------|-------|
| **Component Name** | DialerModal |
| **shadcn/ui Base** | Dialog |
| **Variants** | - |
| **States** | idle, dialing, connected, ended |
| **Sizes** | max-w-sm |
| **Test ID Pattern** | `dialer-modal`, `dialer-input`, `dialer-call`, `dialer-clear` |
| **Notes** | Phone dialer with number pad. Used from Hub Communication tab. |

---

| Property | Value |
|----------|-------|
| **Component Name** | MetricDetailDialog |
| **shadcn/ui Base** | Dialog |
| **Variants** | - |
| **States** | open, closed |
| **Sizes** | max-w-lg |
| **Test ID Pattern** | `dialog-metric-detail`, `text-metric-detail-title`, `text-metric-detail-value` |
| **Notes** | Opened from Insights Library. Shows metric name, value, category, description, and trend data. |

---

| Property | Value |
|----------|-------|
| **Component Name** | ReportDetailDialog |
| **shadcn/ui Base** | Dialog |
| **Variants** | - |
| **States** | open, closed |
| **Sizes** | max-w-lg |
| **Test ID Pattern** | `dialog-report-detail` |
| **Notes** | Opened from Insights Reports tab. Shows report title, date range, and chart/data. |

---

| Property | Value |
|----------|-------|
| **Component Name** | ProfileMenu |
| **shadcn/ui Base** | DropdownMenu |
| **Variants** | - |
| **States** | open, closed |
| **Sizes** | w-56 (224px) |
| **Test ID Pattern** | `button-profile-menu`, `dropdown-profile`, `button-logout` |
| **Notes** | Avatar + name. Dropdown shows: Profile link, Settings link, Logout. |

---

| Property | Value |
|----------|-------|
| **Component Name** | ThemeToggle |
| **shadcn/ui Base** | Button (ghost, icon-only) |
| **Variants** | light (Sun icon), dark (Moon icon) |
| **States** | default |
| **Sizes** | icon-only |
| **Test ID Pattern** | `button-theme-toggle` |
| **Notes** | Toggles between light and dark mode. State persisted in localStorage. |

---

| Property | Value |
|----------|-------|
| **Component Name** | RoleSwitcher |
| **shadcn/ui Base** | DropdownMenu |
| **Variants** | super_admin, partner_admin, org_admin, staff |
| **States** | open, closed |
| **Sizes** | small arrow trigger |
| **Test ID Pattern** | - |
| **Notes** | Temporary dev tool. Tiny arrow dropdown on far-right of TopBar. Persists to localStorage. Changes which metric tiles and settings sections are visible. |

---

## Tab Components

| Property | Value |
|----------|-------|
| **Component Name** | InsightsTabs |
| **shadcn/ui Base** | Tabs |
| **Variants** | Dashboard, Reports, Library, Hunches |
| **States** | - |
| **Sizes** | - |
| **Test ID Pattern** | `tab-insights-dashboard`, `tab-insights-reports`, `tab-insights-library`, `tab-insights-hunches` |
| **Notes** | Dashboard has 4 sub-sections: Command Center, Pipeline, Charts, Scorecard. Library shows 61+ metrics with search/filter. |

---

| Property | Value |
|----------|-------|
| **Component Name** | HubTabs |
| **shadcn/ui Base** | Tabs |
| **Variants** | Calendar, Approvals, Communication, Open Leads |
| **States** | - |
| **Sizes** | - |
| **Test ID Pattern** | `tab-wc-calendar`, `tab-wc-leads`, `tab-wc-inbox` |
| **Notes** | Calendar shows events with schedule modal. Communication has compose email/SMS. |

---

| Property | Value |
|----------|-------|
| **Component Name** | SettingsTabs (Tools & Integrations) |
| **shadcn/ui Base** | Tabs |
| **Variants** | Tools, Widgets, Landing Pages |
| **States** | - |
| **Sizes** | - |
| **Test ID Pattern** | `tab-tools`, `tab-widgets`, `tab-landing-pages` |
| **Notes** | Under "Tools & Integrations" tile. Widgets tab shows 4 fixed widget types. Landing Pages tab shows editable landing pages. Role-gated: org_admin+. |

---

| Property | Value |
|----------|-------|
| **Component Name** | WidgetConfigTabs |
| **shadcn/ui Base** | Tabs |
| **Variants** | Settings, Appearance, Targeting, Domains, Embed |
| **States** | - |
| **Sizes** | - |
| **Test ID Pattern** | `tab-widget-settings`, `tab-appearance`, `tab-targeting`, `tab-domains`, `tab-embed` |
| **Notes** | Each widget type has all 5 tabs. Settings tab content varies by widget type (text/video/voice/unified). |

---

| Property | Value |
|----------|-------|
| **Component Name** | ProfileTabs |
| **shadcn/ui Base** | Tabs |
| **Variants** | Profile, Preferences, Billing |
| **States** | - |
| **Sizes** | - |
| **Test ID Pattern** | `tab-profile-main`, `tab-profile-preferences`, `tab-profile-billing` |
| **Notes** | Profile shows user info. Preferences has notification toggles. Billing shows plan and payment. |

---

## Chart Components

| Property | Value |
|----------|-------|
| **Component Name** | InsightsChart |
| **shadcn/ui Base** | Recharts (LineChart, BarChart, PieChart) |
| **Variants** | line, bar, pie |
| **States** | loaded, loading (skeleton), empty ("No data"), error |
| **Sizes** | Responsive within container |
| **Test ID Pattern** | `chart-leads`, `chart-conversions` |
| **Notes** | Uses theme CSS custom properties for colors (--chart-1 through --chart-5). Tooltip on hover shows data point details. |

---

## Landing Page Components (Widget Demo)

| Property | Value |
|----------|-------|
| **Component Name** | WidgetLandingPage |
| **shadcn/ui Base** | Custom (standalone page) |
| **Variants** | - |
| **States** | default, channel-active (chat/video/voice/callback/sms/form views) |
| **Sizes** | Full viewport, responsive |
| **Test ID Pattern** | `channel-chat-view`, `channel-video-view`, `channel-voice-view`, `button-launch-video`, `button-landing-submit` |
| **Notes** | Route: /w/demo. Outside AppLayout (no sidebar/topbar). 6 interactive channel cards, contact form, "Launch Live Video Chat" button. "Powered by Nexxus" footer. All interactions are simulated client-side. |
