# Section Audit: System (Settings)
**Sprint:** E-013
**Route:** /settings/system
**Page Component:** client/src/pages/settings.tsx (4091 lines)
**Sub-menu:** SubMenuManager.tsx (system section, lines 667-700)

## What Exists in Code

### Page Structure (settings.tsx)
- **Tile grid landing** — 7 tiles, each clickable to drill-down into section detail view
- **RBAC per tile** — `minRole` array on each tile controls visibility per role
- **No tabs** — settings uses a tile grid → section detail navigation pattern (not tabbed like other pages)

### Settings Tiles (lines 299-307)

| Tile | Description | Roles |
|---|---|---|
| User Management | Manage users, roles, permissions | super_admin, partner_admin, org_admin |
| Organization | Company profile and branding | super_admin, partner_admin, org_admin |
| Tools & Integrations | Configure tools, widgets, landing pages | super_admin, partner_admin, org_admin |
| Knowledge Base | Upload and manage AI training data | super_admin, partner_admin, org_admin |
| AI Configuration | Hunches, agents, AI behavior | **super_admin only** |
| Notifications | Alert preferences and delivery channels | super_admin, partner_admin, org_admin |
| Appearance | Theme, layout, display preferences | super_admin, partner_admin, org_admin |

**NOTE: No Billing tile in the settings grid.** Billing is NOT a tile on the settings page — it's a sub-menu item (line 676) that links to `/settings/billing`, but it's not in the `settingsTiles` array. The sub-menu shows Billing for super_admin and partner_admin roles.

### Section Detail Views

#### User Management (renderUserManagement)
- Real user list from `/api/users` API
- Add User dialog (firstName, lastName, email, password, roleId)
- Edit User dialog (firstName, lastName, roleId, isActive toggle)
- Deactivate user (PATCH isActive: false)
- Reset password (POST /api/users/:id/reset-password)
- Change own password (POST /api/auth/change-password)
- User search filter
- Invite user dialog
- **Real CRUD — not mock data**

#### Organization (inline render, lines 3458-3791)
- Org name, AI persona name, business phone, email, public listing toggle
- **Business Hours & After-Hours:** timezone, start hour, end hour, after-hours auto-response message with template placeholders
- **Communication Gate:** Master toggle for ALL outbound communications. Green/red border. Warning panel when OFF.
- **Server Kill Switch indicator:** Shows when server-level kill switch is OFF (amber warning card)
- **Channel Controls:** Individual toggles for SMS, Email, Phone, Video — disabled when CommGate is OFF
- **Rate Limit per recipient:** Input field, max 50/24h
- **TextMagic Phone Number:** Input for inbound SMS routing
- **All backed by real API mutations** (PATCH /api/organizations/:id, /api/settings/org)

#### Tools & Integrations (renderToolsSection)
- **3 sub-tabs:** MCP Tools, Widgets, Landing Pages (line 652: `toolsTab`)
- **MCP Tools:** 6 tool cards (VIN Solutions/CRM, VAPI/Voice, Tavus/Video, Google Auth, TextMagic/SMS, Document Generator). Each has enable/disable toggle + locked flag. Tool toggles saved to org settings.
- **Widgets:** Individual widget management from `/api/widgets` API. Widget config with settings/appearance/targeting tabs. Embed code generation. Preview modal. Domain allowlisting. Universal widget settings (channel toggles).
- **Landing Pages:** Landing page management. Status badges, type labels. Edit/preview/delete actions.
- **VIN Lead Config:** Default VIN sales rep selector (fetches from `/api/vin/users/:orgId`)
- **Provisioning section:** Dealer provisioning by ID + name

#### Knowledge Base (renderKnowledgeBase, lines 2994-3142)
- **4 sub-tabs:** Documents, Web Pages, Databases, Settings
- **Documents:** Real file upload + table (name, type, size, date, delete). Fetches from API. Upload mutation.
- **Web Pages:** Static "dealer.com/inv" row shown. "Add URL" button is demo-only (shows toast).
- **Databases:** Placeholder — "Future: connect external databases"
- **Settings:** Auto-Index toggle, Web Scraping toggle, Document Retention days, Smart Summarization toggle, Learning Mode (disabled). Save button is demo-only.

#### AI Configuration (renderAIConfiguration, lines 3144-3314)
- **3 sub-tabs:** System Prompt, Agent Behavior, Hunches
- **System Prompt tab:** AI model selector (Claude/Gemini/OpenAI — Gemini and OpenAI fall back to Claude), system prompt textarea, chat quality instructions textarea. **Real API save** via saveSettingsMutation.
- **Agent Behavior tab:** Behavior context textarea + 6 allowed actions checkboxes (initiate calls, send SMS, create CRM leads, schedule appointments, access financial data, modify customer records). **Demo-only save** (toast).
- **Hunches tab:** Enable hunches toggle (real API save), auto-scoring (disabled), confidence threshold (disabled).
- **partner_admin gets read-only view** (isReadOnlyAI)

#### Notifications (renderNotifications, lines 3316-3375)
- **Global:** Email, SMS, Push notification toggles + quiet hours (start/end)
- **Per-Event:** New Lead, Appointment Booked, Agent Alert, Task Due — each with toggle
- **Real API save** via saveSettingsMutation

#### Appearance (renderAppearance, lines 3377-3422)
- Compact Mode toggle, Animations toggle, Default View selector (Dashboard/Hub/Insights/Agents), Show Metric Tiles toggle
- **Saved to localStorage** (not API — browser-specific)

### Sub-menu Panel (SubMenuManager.tsx, system section)
- 8 items: Users, Organization, Tools & Integrations, Knowledge Base, AI Configuration, Notifications, Appearance, Billing
- Each links to `/settings/system?section=<id>` (except Billing → `/settings/billing`)
- RBAC filtering: `visibleItems = settingsItems.filter(item => item.roles.includes(currentRole))`
- AI Configuration visible to super_admin and partner_admin only
- Billing visible to super_admin and partner_admin only

## Manifest vs Code

| Manifest Item | Code Status | Gap? |
|---|---|---|
| Sub items: Users, Organization, Tools and Integrations, Knowledge Base, AI Configuration, Notifications, Appearance, Billing | Sub-menu has all 8. Page tiles show 7 (no Billing tile — Billing is sub-menu only link). | Minor — Billing is accessible but not a tile |
| Right side popout with chat access to copilot system changes | NO copilot chat popout exists in settings | **Gap — no copilot system chat** |
| Multi-positioned tests needed, settings need evaluated | Settings exist with real CRUD. Tests need written. | Test gap |
| RBAC evaluated — only super admin sees super admin items | AI Config is super_admin only. Other tiles visible to org_admin+. Billing sub-menu to super_admin + partner_admin. | Partial — need to verify all role visibility |

## Findings

1. **No copilot chat popout** — Manifest says "Right side popout with chat access to copilot system changes." No such copilot chat exists on the settings page. This is either a new feature request or a gap.
2. **Billing is NOT a settings tile** — It's only in the sub-menu as a link to `/settings/billing`. The settingsTiles array has 7 items, not 8. Billing exists on the Manage page (BillingDashboard component).
3. **AI Configuration is super_admin only** — The tile has `minRole: ['super_admin']` but the sub-menu shows it for both super_admin AND partner_admin (read-only for partner_admin). This is inconsistent — the tile won't appear for partner_admin but the sub-menu link will.
4. **Knowledge Base Web Pages is demo-only** — "Add URL" button shows a toast. No real URL crawling functionality.
5. **Knowledge Base Databases is a placeholder** — "Future: connect external databases"
6. **Agent Behavior save is demo-only** — Shows toast, doesn't persist
7. **Organization section is comprehensive** — CommGate, channel controls, rate limits, business hours, after-hours messaging, TextMagic phone routing — all with real API mutations
8. **User Management is fully functional** — Real CRUD with search, add, edit, deactivate, password reset, invite

## Existing ACs

No section-specific ACs exist yet for System (Settings).

## New ACs Needed

| Proposed AC | Priority | Dimension |
|---|---|---|
| Settings tiles respect RBAC: super_admin sees 7, partner_admin sees 6 (no AI Config tile), org_admin sees 6 | T1 | AU |
| User Management CRUD works: add user, edit user, deactivate user, reset password | T1 | FE/BE |
| Communication Gate toggle persists and stops all outbound | T1 | FE/BE |
| Channel toggles (SMS, Email, Phone, Video) persist and control outbound per channel | T1 | FE/BE |
| Rate limit setting persists and enforces per-recipient limit | T1 | FE/BE |
| Knowledge Base document upload: file uploads, appears in table, can be deleted | T2 | FE/BE |
| AI Configuration system prompt saves and affects AI chat behavior | T2 | FE/BE |
| AI model selector persists (Claude/Gemini/OpenAI) | T3 | FE/BE |
| Business hours settings persist and trigger after-hours auto-response | T2 | FE/BE |
| Hunches enable/disable toggle persists | T2 | FE/BE |
| Notification preferences persist across sessions | T3 | FE/BE |
| Appearance preferences saved to localStorage | T3 | FE |
| Tools & Integrations widget management: create, configure, embed code, preview | T2 | FE/BE |
| Copilot chat popout in settings (manifest requirement — not built) | T3 | FE |

## Section Description (DRAFT — for operator edit)

**System (Settings) is the platform configuration hub.** It uses a tile grid → drill-down pattern with 7 clickable tiles: User Management, Organization, Tools & Integrations, Knowledge Base, AI Configuration, Notifications, and Appearance. Billing is accessible via the sub-menu but is NOT a tile on the page.

**User Management** has full CRUD — add, edit, deactivate, password reset, search, invite — all backed by real API endpoints. **Organization** contains the Communication Gate (master outbound toggle), individual channel controls (SMS/Email/Phone/Video), rate limiting, business hours/after-hours messaging, and TextMagic phone routing — all with real API persistence. **Tools & Integrations** has 3 sub-tabs: MCP tool toggles (6 integrations), individual widget management (from /api/widgets with config/appearance/targeting), and landing page management. **Knowledge Base** has document upload (real API), web pages (demo), databases (placeholder), and settings (toggles). **AI Configuration** has system prompt editing, AI model selection, agent behavior checkboxes, and hunches toggle — system prompt and hunches use real API, agent behavior is demo-only. **Notifications** has global and per-event toggles with quiet hours. **Appearance** saves to localStorage.

RBAC is enforced per tile: AI Configuration requires super_admin, everything else requires org_admin+. Billing sub-menu link requires super_admin or partner_admin.

**Issues found:** No copilot chat popout (manifest requirement). AI Config tile/sub-menu RBAC inconsistency (tile super_admin only, sub-menu shows for partner_admin too). KB Web Pages and Databases are placeholders. Agent Behavior save is demo-only.
