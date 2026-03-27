# U-001 State Enumeration — Nexxus Connect 2.2

**Date:** 2026-03-27
**Source:** Explorer agent code analysis of client/src/
**Prior inventory:** assessments/nexxus-ui-inventory.md (2026-03-25, 10 routes)

---

## Routes Summary

| # | Route | Tabs | Modals/Dialogs | Permission Gate | Priority |
|---|-------|------|---------------|-----------------|----------|
| 1 | / (Main/AI Chat) | — | MetricDetailDialog | authenticated | HIGH |
| 2 | /teambox | Status filters + Channel filters | — | authenticated | HIGH |
| 3 | /my-work | Dashboard, Tasks, Chat, Assistant | Create/Edit Task Dialog | authenticated | MED |
| 4 | /sales | Dashboard, Agents, Insights, Calendar | MetricDetailDialog, Agent dialogs | authenticated | HIGH |
| 5 | /service | Campaigns, Agents, Insights, Calendar | MetricDetailDialog | authenticated | HIGH |
| 6 | /marketing | Campaigns, Agents, Insights, Calendar | MetricDetailDialog | authenticated | HIGH |
| 7 | /management | Insights, Hunches, System Log, User Chats, Billing | Hunches preferences Sheet | admin+ | HIGH |
| 8 | /agents | — (detail view) | Create/Edit/Delete Agent dialogs | authenticated | MED |
| 9 | /insights | Dashboard, Reports, Library, Hunches | Drill-down modals, Preferences Sheet | authenticated | HIGH |
| 10 | /settings/system | 7 tile sections, each with sub-tabs | Multiple CRUD dialogs | admin+ | HIGH |
| 11 | /profile | My Profile, Preferences | Change Password dialog | authenticated | MED |
| 12 | /usage | — | — | admin+ | MED |
| 13 | /settings/billing | Plan, Usage, Invoices | — | admin+ | MED |
| 14 | /settings/org-wizard | 7-step wizard | — | super_admin | MED |
| 15 | /login | — | — | public | LOW |
| 16 | /forgot-password | — | — | public | LOW |
| 17 | /reset-password | — | — | public | LOW |
| 18 | /p/:slug | Widget modes: chat, video, voice, form, menu | — | public | HIGH |
| 19 | /w/:slug | Widget modes (same) | — | public | HIGH |
| 20 | /* (404) | — | — | any | LOW |

**Total routes: 20**

---

## State Enumeration by Route

### Global States (present on all authenticated pages)
| ID | State | Trigger |
|----|-------|---------|
| G-01 | Sidebar expanded | Default |
| G-02 | Sidebar collapsed (icons only) | Toggle button |
| G-03 | Sub-menu flyout panel | Hover on sidebar item (2000ms delay on leave) |
| G-04 | Sub-menu pinned | Pin toggle in flyout |
| G-05 | Org switcher dropdown open | Click org name in TopBar |
| G-06 | Notification panel open | Click bell icon |
| G-07 | Profile menu dropdown open | Click avatar |
| G-08 | Activity feed dropdown open | Click activity icon |
| G-09 | Theme: light mode | Default or toggle |
| G-10 | Theme: dark mode | Toggle moon/sun icon |
| G-11 | Tour overlay (6-step) | First visit or "Reset Tour" |
| G-12 | "Discuss with Georgia" FAB | Present on Sales/Service/Marketing/Management |
| G-13 | Session timeout dialog | Inactivity timer |
| G-14 | Right pane: agent config | Click agent in sidebar |
| G-15 | Right pane: customer info | Click customer in TeamBox |

### Route 1: / (Main / AI Chat)
| ID | State | Trigger |
|----|-------|---------|
| M-01 | Default: greeting + suggestions + chat input | Page load |
| M-02 | Chat with history | ?conversationId= param (SEC-01) |
| M-03 | Contact lookup result | Search phone/email |
| M-04 | Contact not found | Search returns no result |
| M-05 | MetricDetailDialog open | Click metric tile |
| M-06 | Loading contact from CRM | During contact search |
| M-07 | Chat streaming response | After sending message |

### Route 2: /teambox
| ID | State | Trigger |
|----|-------|---------|
| TB-01 | Conversations tab, "all" status filter | Default |
| TB-02 | Status filter: open | Click status button |
| TB-03 | Status filter: assigned | Click |
| TB-04 | Status filter: automated | Click |
| TB-05 | Channel filter: SMS | Click channel button |
| TB-06 | Channel filter: Email | Click |
| TB-07 | Channel filter: Voice | Click |
| TB-08 | Conversation selected, messages visible | Click conversation |
| TB-09 | Tasks view | Click Tasks button in sidebar |
| TB-10 | Empty conversations | No data |
| TB-11 | Loading skeleton | Initial load |
| TB-12 | Phone tab: VAPI call logs | Click Phone tab |
| TB-13 | Video tab: Tavus sessions | Click Video tab |
| TB-14 | Video tab: empty state | No video sessions |
| TB-15 | Take Over button visible | Automated conversation selected |
| TB-16 | Campaign Disconnect visible | Campaign conversation |

### Route 3: /my-work
| ID | State | Trigger |
|----|-------|---------|
| MW-01 | Dashboard tab: metrics + tasks | Default |
| MW-02 | Tasks tab: task list | Click tab |
| MW-03 | Tasks tab: empty | No tasks |
| MW-04 | Chat tab: recent conversations | Click tab |
| MW-05 | Chat tab: empty | No conversations |
| MW-06 | Assistant tab | Click tab |
| MW-07 | Create Task dialog | Click "New Task" |
| MW-08 | Edit Task dialog | Click edit on task |

### Route 4: /sales
| ID | State | Trigger |
|----|-------|---------|
| SL-01 | Dashboard tab: 7 metric tiles + activity | Default |
| SL-02 | Agents tab: agent cards | Click tab |
| SL-03 | Insights tab (embedded InsightsPage) | Click tab |
| SL-04 | Calendar tab | Click tab |
| SL-05 | MetricDetailDialog | Click metric tile |
| SL-06 | Agent detail/config pane | Click agent card |
| SL-07 | Agent menu dropdown | Click agent MoreVertical |
| SL-08 | Loading skeleton | Initial load |

### Route 5: /service
| ID | State | Trigger |
|----|-------|---------|
| SV-01 | Campaigns tab: table + safety card | Default |
| SV-02 | Campaigns tab: safety card dismissed | localStorage flag |
| SV-03 | Campaigns tab: "Communications Paused" badge | communicationGateEnabled=false |
| SV-04 | Agents tab: agent cards | Click tab |
| SV-05 | Insights tab (embedded InsightsPage) | Click tab |
| SV-06 | Calendar tab | Click tab |
| SV-07 | Kill Switch toggled | Toggle on campaign row |
| SV-08 | Empty campaigns | No data |
| SV-09 | Campaign action tooltips | Hover action buttons (SEC-04) |

### Route 6: /marketing
| ID | State | Trigger |
|----|-------|---------|
| MK-01 | Campaigns tab: table | Default |
| MK-02 | Agents tab: agent cards | Click tab |
| MK-03 | Insights tab | Click tab |
| MK-04 | Calendar tab | Click tab |
| MK-05 | Empty campaigns | No data |
| MK-06 | Agent cards with client-side agents | MARKETING_AGENTS constant |

### Route 7: /management
| ID | State | Trigger |
|----|-------|---------|
| MG-01 | Insights tab (embedded) | Default |
| MG-02 | Hunches tab: hunch cards | Click tab |
| MG-03 | Hunches tab: empty | No hunches |
| MG-04 | Hunches preferences Sheet | Click preferences button |
| MG-05 | System Log tab: activity feed | Click tab |
| MG-06 | System Log tab: empty | No activity |
| MG-07 | User Chats tab | Click tab |
| MG-08 | Billing tab (embedded BillingDashboard) | Click tab |

### Route 8: /agents
| ID | State | Trigger |
|----|-------|---------|
| AG-01 | No agent selected: "Select an Agent" | Default |
| AG-02 | Agent selected: chat interface + config pane | Click agent |
| AG-03 | Agent chat: streaming response | Send message |
| AG-04 | Create Agent dialog | Click "Create New Agent" |
| AG-05 | Edit Agent dialog | Agent menu → Edit |
| AG-06 | Delete Agent AlertDialog | Agent menu → Delete |
| AG-07 | Agent menu dropdown | Click MoreVertical |

### Route 9: /insights (standalone)
| ID | State | Trigger |
|----|-------|---------|
| IN-01 | Dashboard tab: traffic light zones | Default |
| IN-02 | Red zone drill-down modal (hotLeads) | Click card |
| IN-03 | Red zone drill-down modal (newLeads) | Click card |
| IN-04 | Red zone drill-down modal (showroom) | Click card |
| IN-05 | Yellow zone drill-down (staleLeads) | Click card |
| IN-06 | Yellow zone drill-down (pendingFinance) | Click card |
| IN-07 | Reports tab: Loss Analysis | Click tab |
| IN-08 | Reports tab: Channel Performance | Click sub-category |
| IN-09 | Reports tab: Trend Analysis | Click sub-category |
| IN-10 | Library tab: 34 metric tiles grid view | Click tab |
| IN-11 | Library tab: list view | Toggle view |
| IN-12 | Library tab: metric detail dialog | Click metric |
| IN-13 | Library tab: filtered/searched | Use filter/search |
| IN-14 | Hunches tab: hunch cards | Click tab |
| IN-15 | Hunches preferences Sheet | Click preferences |
| IN-16 | Org switcher (partner_admin+) | Click switcher |

### Route 10: /settings/system
| ID | State | Trigger |
|----|-------|---------|
| ST-00 | Tile grid (no section active) | Default |
| ST-01 | Users section: User Management tab | Click Users tile |
| ST-02 | Users: Add User dialog | Click "Add User" |
| ST-03 | Users: Edit User dialog | User row menu → Edit |
| ST-04 | Users: Reset Password dialog | User row menu → Reset |
| ST-05 | Users: VIN Users tab | Click tab |
| ST-06 | Users: Roles tab | Click tab |
| ST-07 | Organization section: Settings tab | Click Org tile |
| ST-08 | Organization: Branding tab | Click tab |
| ST-09 | Organization: Domain tab | Click tab |
| ST-10 | Tools section: Widgets tab | Click Tools tile |
| ST-11 | Tools: Widget detail view (Settings) | Click widget |
| ST-12 | Tools: Widget detail view (Preview) | Click Preview tab |
| ST-13 | Tools: Widget detail view (Analytics) | Click Analytics tab |
| ST-14 | Tools: Create Widget dialog | Click "Create Widget" |
| ST-15 | Tools: Delete Widget dialog | Widget menu → Delete |
| ST-16 | Tools: Landing Pages tab | Click tab |
| ST-17 | Tools: Create Landing Page dialog | Click "Create" |
| ST-18 | Tools: Integrations tab (MCP) | Click tab |
| ST-19 | Tools: Integrations (API) | Click sub-tab |
| ST-20 | Tools: Integrations (API Keys, super_admin) | Click sub-tab |
| ST-21 | Tools: Integrations (Webhooks, super_admin) | Click sub-tab |
| ST-22 | Knowledge section: Documents tab | Click KB tile |
| ST-23 | Knowledge: Document upload drag-drop | Drag file |
| ST-24 | Knowledge: Web Pages tab | Click tab |
| ST-25 | Knowledge: Databases tab | Click tab |
| ST-26 | Knowledge: Settings tab | Click tab |
| ST-27 | AI Config section: System Prompt tab | Click AI tile |
| ST-28 | AI Config: Agent Behavior tab | Click tab |
| ST-29 | AI Config: Hunches tab | Click tab |
| ST-30 | Notifications section | Click Notifications tile |
| ST-31 | Appearance section | Click Appearance tile |

### Route 11: /profile
| ID | State | Trigger |
|----|-------|---------|
| PR-01 | My Profile tab: view mode | Default |
| PR-02 | My Profile tab: edit mode | Click "Edit Profile" |
| PR-03 | Preferences tab | Click tab |
| PR-04 | Change Password dialog | Click "Change Password" |
| PR-05 | Photo upload in progress | Click avatar → upload |

### Route 12: /usage
| ID | State | Trigger |
|----|-------|---------|
| US-01 | Default: usage summary + event tiles | Page load |
| US-02 | Period: last_month | Change period selector |
| US-03 | Org breakdown (partner_admin+) | Automatic for elevated roles |
| US-04 | Permission denied card | Non-admin role |
| US-05 | Empty: no usage data | No events recorded |

### Route 13: /settings/billing
| ID | State | Trigger |
|----|-------|---------|
| BL-01 | Plan tab: current plan | Default |
| BL-02 | Usage tab: usage chart + breakdown | Click tab |
| BL-03 | Invoices tab: invoice list | Click tab |
| BL-04 | Invoices: filtered by status | Use status filter |
| BL-05 | Empty: no invoices | No data |

### Route 14: /settings/org-wizard
| ID | State | Trigger |
|----|-------|---------|
| OW-01 | Step 0: Org Details | Default |
| OW-02 | Step 1: Contact | Click Next |
| OW-03 | Step 2: Admin Setup | Click Next |
| OW-04 | Step 3: Configuration (Billing) | Click Next |
| OW-05 | Step 4: Tools | Click Next |
| OW-06 | Step 5: Default Agent | Click Next |
| OW-07 | Step 6: Review + Create | Click Next |
| OW-08 | Validation warnings on Review | Missing required fields |

### Route 15-17: Auth pages
| ID | State | Trigger |
|----|-------|---------|
| AU-01 | Login: default form | Page load |
| AU-02 | Login: session expired alert | ?expired=true or sessionExpired state |
| AU-03 | Login: validation error | Wrong credentials |
| AU-04 | Forgot password: form | Page load |
| AU-05 | Forgot password: success message | After submit |
| AU-06 | Reset password: form with token | From email link |
| AU-07 | Reset password: success | After submit |

### Route 18-19: Widget Landing Pages
| ID | State | Trigger |
|----|-------|---------|
| WL-01 | Default: service menu closed | /p/:slug load |
| WL-02 | Chat mode | ?mode=chat or button click |
| WL-03 | Video mode (fullscreen window) | ?mode=video or button click |
| WL-04 | Voice mode: idle | Click voice button |
| WL-05 | Voice mode: connecting | VAPI connecting |
| WL-06 | Voice mode: connected (mic controls) | VAPI active |
| WL-07 | Form mode | Click form button |
| WL-08 | Form submitted success | After POST |
| WL-09 | Video not configured message | No Tavus config |
| WL-10 | Loading spinner | Page loading |
| WL-11 | Page not found | Invalid slug |
| WL-12 | Instant Call Back form (SEC-08) | Click voice/call button |

### Route 20: 404
| ID | State | Trigger |
|----|-------|---------|
| NF-01 | 404 page with home link | Unknown route |

---

## Summary

| Category | Count |
|----------|-------|
| Routes | 20 |
| Global states | 15 |
| Per-route states | 148 |
| **Total enumerated states** | **163** |
| States with modals/dialogs | 28 |
| Permission-gated states | 12 |
| Empty/loading states | 22 |

---

## Crawl Priority Order

**Wave 1 (Core pages, highest data density):**
/, /sales, /service, /marketing, /management, /teambox

**Wave 2 (Secondary pages):**
/insights, /agents, /my-work, /settings/system (tile grid + Users + Org + Tools)

**Wave 3 (Settings deep-dive):**
/settings/system (Knowledge, AI Config, Notifications, Appearance), /profile, /usage, /settings/billing

**Wave 4 (Public + Auth):**
/p/:slug, /w/:slug (all widget modes), /login, /forgot-password, /settings/org-wizard

**Wave 5 (Global overlays):**
Org switcher, notifications, profile menu, tour overlay, session timeout, theme toggle, sidebar states
