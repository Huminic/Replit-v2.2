# Settings Domain Test Plan (T-004)

Generated: 2026-03-31
Source: Code analysis of client/src/pages/settings.tsx, server/routes/settings.ts, server/routes/users.ts, server/routes/organizations.ts, server/routes/integrations.ts, server/routes/widgets.ts, server/routes/documents.ts, server/routes/roles.ts, server/routes/notifications.ts, tests/e2e/domain-09-settings.spec.ts, tests/e2e/helpers/auth.ts

---

## 1. Role Access Matrix

| Tile / Section        | super_admin | partner_admin | org_admin | executive | sales | service | marketing |
|-----------------------|-------------|---------------|-----------|-----------|-------|---------|-----------|
| User Management       | YES         | YES           | YES       | NO        | NO    | NO      | NO        |
| Organization          | YES         | YES           | YES       | NO        | NO    | NO      | NO        |
| Tools & Integrations  | YES         | YES           | YES       | NO        | NO    | NO      | NO        |
| Knowledge Base        | YES         | YES           | YES       | NO        | NO    | NO      | NO        |
| AI Configuration      | YES (edit)  | YES (read-only) | NO      | NO        | NO    | NO      | NO        |
| Notifications         | YES         | YES           | YES       | NO        | NO    | NO      | NO        |
| Appearance            | YES         | YES           | YES       | NO        | NO    | NO      | NO        |
| API Keys tab          | YES         | NO            | NO        | NO        | NO    | NO      | NO        |
| Webhooks tab          | YES         | NO            | NO        | NO        | NO    | NO      | NO        |
| New Organization btn  | YES         | NO            | NO        | NO        | NO    | NO      | NO        |

Note: `minRole` arrays in `settingsTiles` define tile visibility. AI Config is `['super_admin', 'partner_admin']` only. API Keys and Webhooks tabs inside Tools section are gated by `isSuperAdmin`. partner_admin sees AI Config in read-only mode (`isReadOnlyAI = isPartnerAdmin`).

Backend API role gates:
- `requireRole(3)` = org_admin+ (level <= 3): PATCH /api/settings/org, GET/POST/PATCH/DELETE users, PATCH org, POST widgets, DELETE widgets, DELETE documents
- `requireRole(2)` = partner_admin+ (level <= 2): POST /api/integrations/provision, POST /api/organizations

---

## 2. Interactive Element Inventory

### 2.1 Settings Landing Page (`/settings`)

| Element | Type | data-testid | Behavior |
|---------|------|-------------|----------|
| Settings page heading | h1 | — | "System Settings" |
| Settings page subtitle | p | — | "Configure your organization and application settings" |
| User Management tile | div (clickable) | `settings-tile-users` | Opens users section. Visible to super_admin, partner_admin, org_admin |
| Organization tile | div (clickable) | `settings-tile-organization` | Opens org section. Visible to super_admin, partner_admin, org_admin |
| Tools & Integrations tile | div (clickable) | `settings-tile-tools` | Opens tools section. Visible to super_admin, partner_admin, org_admin |
| Knowledge Base tile | div (clickable) | `settings-tile-knowledge` | Opens knowledge section. Visible to super_admin, partner_admin, org_admin |
| AI Configuration tile | div (clickable) | `settings-tile-ai` | Opens AI config section. Visible to super_admin, partner_admin only |
| Notifications tile | div (clickable) | `settings-tile-notifications` | Opens notifications section. Visible to super_admin, partner_admin, org_admin |
| Appearance tile | div (clickable) | `settings-tile-appearance` | Opens appearance section. Visible to super_admin, partner_admin, org_admin |
| MobileNavDropdown | dropdown | — | Visible on small screens only |

### 2.2 User Management Section

| Element | Type | data-testid | Behavior |
|---------|------|-------------|----------|
| Back button | button | `button-back-settings` | Returns to tile grid |
| Add User button | button | `button-add-user` | Opens add user dialog |
| Invite User button | button | `button-invite-user` | Opens invite user dialog |
| New Organization button | button | `button-new-organization` | Navigates to /settings/org-wizard. super_admin only |
| User search input | input | `input-search-users` | Filters users by name or email |
| User card | Card | `user-{id}` | Shows name, avatar, role badge, inactive badge |
| User menu trigger | button | `user-menu-{id}` | Opens dropdown with Edit, Reset Password, Deactivate |
| Edit menu item | DropdownMenuItem | `edit-user-{id}` | Opens edit user dialog |
| Reset Password menu item | DropdownMenuItem | `reset-pw-{id}` | Opens reset password dialog |
| Deactivate menu item | DropdownMenuItem | `deactivate-user-{id}` | Deactivates user (PATCH isActive: false) |

#### Add User Dialog

| Element | Type | data-testid | Behavior |
|---------|------|-------------|----------|
| First Name input | input | — | Required |
| Last Name input | input | — | Required |
| Email input | input | — | Required, email format |
| Password input | input | — | Required, min 6 chars |
| Role select | select | — | Populated from /api/roles |
| Submit button | button | — | POST /api/users |

#### Edit User Dialog

| Element | Type | data-testid | Behavior |
|---------|------|-------------|----------|
| First Name input | input | — | Pre-populated |
| Last Name input | input | — | Pre-populated |
| Role select | select | — | Pre-populated, role options from /api/roles |
| Active toggle | switch | — | isActive boolean |
| Submit button | button | — | PATCH /api/users/{id} |

#### Reset Password Dialog

| Element | Type | data-testid | Behavior |
|---------|------|-------------|----------|
| New Password input | input | — | Required, min 6 chars |
| Submit button | button | — | POST /api/users/{id}/reset-password |

#### Invite User Dialog

| Element | Type | data-testid | Behavior |
|---------|------|-------------|----------|
| First Name input | input | — | Required |
| Last Name input | input | — | Required |
| Email input | input | — | Required, email format |
| Role select | select | — | From /api/roles |
| Submit button | button | — | POST /api/users/invite. Backend generates temp password, optionally sends email |

### 2.3 Organization Section

| Element | Type | data-testid | Behavior |
|---------|------|-------------|----------|
| Back button | button | `button-back-settings` | Returns to tile grid |
| Organization Name input | input | `input-org-name` | Current org name |
| AI Persona Name input | input | `input-persona-name` | AI assistant display name |
| Business Phone input | input | `input-org-phone` | Primary phone |
| Business Email input | input | `input-org-email` | Primary email |
| Public Listing toggle | switch | `switch-public-listing` | Show in partner directory |
| Save Changes button | button | `button-save-org` | PATCH /api/organizations/{id} |
| Timezone input | input | `input-timezone` | e.g. America/New_York |
| Business Hours Start input | number | `input-business-hours-start` | 0-23 |
| Business Hours End input | number | `input-business-hours-end` | 0-23 |
| After-Hours Message textarea | textarea | `textarea-after-hours-message` | Template with {orgName}, {businessHoursStart}, {businessHoursEnd} placeholders |
| Save Business Hours button | button | `button-save-business-hours` | PATCH /api/settings/org |
| Communication Gate toggle | switch | `switch-communication-gate` | Master outbound switch. PATCH /api/organizations/{id} outboundEnabled |
| Communication paused warning | alert | — | Red alert box when gate is OFF |
| Server Kill Switch card | card | — | Shows when outboundStatus.globalKillSwitch is OFF |
| SMS Channel toggle | switch | `switch-sms-channel` | Disabled when comm gate off |
| Email Channel toggle | switch | `switch-email-channel` | Disabled when comm gate off |
| Phone Channel toggle | switch | `switch-phone-channel` | Disabled when comm gate off |
| Video Channel toggle | switch | `switch-video-channel` | Disabled when comm gate off |
| Rate Limit input | number | `input-rate-limit` | Per-recipient, 1-50, per 24h |
| TextMagic Phone input | tel | `input-textmagic-phone` | Saves on blur |

### 2.4 Tools & Integrations Section

#### Tab Navigation

| Element | Type | data-testid | Behavior |
|---------|------|-------------|----------|
| Back button | button | `button-back-settings` | Returns to tile grid |
| MCP tab | TabsTrigger | `tab-mcp` | Shows MCP tools (empty state currently) |
| API tab | TabsTrigger | `tab-api-tools` | Shows API tool cards |
| Other tab | TabsTrigger | `tab-other` | Shows other tool cards |
| Universal tab | TabsTrigger | `tab-universal` | Shows universal widget channel settings |
| Widgets tab | TabsTrigger | `tab-widgets` | Shows widget management |
| Pages tab | TabsTrigger | `tab-landing-pages` | Shows landing page management |
| API Keys tab | TabsTrigger | `tab-api-keys` | super_admin only |
| Webhooks tab | TabsTrigger | `tab-webhooks` | super_admin only |

#### Tool Cards (API and Other tabs)

Default tool cards:
- CRM Integration (VIN Solutions) — locked
- Voice Calling (VAPI) — locked
- Video Calling (Tavus) — locked
- Authentication (Google Auth) — locked
- SMS & Text Sending (TextMagic) — unlocked, enabled
- Document Generator — unlocked, enabled

Each card has a toggle switch. Non-locked tools can be toggled, persisted to org.settings.toolToggles.

#### VIN Lead Config Section

| Element | Type | data-testid | Behavior |
|---------|------|-------------|----------|
| VIN Lead Config details | details | `vin-lead-config-section` | Expandable. Shows default VIN sales rep dropdown |
| Default VIN User select | select | `select-default-vin-user` | Populated from /api/vin/users/{orgId}. Saves on change |

#### Universal Widget Settings

| Element | Type | data-testid | Behavior |
|---------|------|-------------|----------|
| Chat channel toggle | switch | `switch-channel-chat` | Enable/disable text chat across all widgets |
| Video channel toggle | switch | `switch-channel-video` | Enable/disable AI video |
| Voice channel toggle | switch | `switch-channel-voice` | Enable/disable voice calls |
| SMS channel toggle | switch | `switch-channel-sms` | Enable/disable SMS |
| Callback channel toggle | switch | `switch-channel-callback` | Enable/disable callback forms |

#### Widget Management (Widgets tab)

| Element | Type | data-testid | Behavior |
|---------|------|-------------|----------|
| Widget type cards | cards | — | Shows text, video, voice, unified widget types |
| Create Widget button | button | — | Creates new text widget (POST /api/widgets) |
| Widget search | input | — | Filter widgets by name |
| Widget detail view | view | — | Shows when a widget is selected |
| Widget config tabs | TabsList | — | Settings, Embed Code, Domain Whitelist |
| Widget name input | input | — | Edit widget name |
| Widget description input | input | — | Edit widget description |
| Widget appearance settings | various | — | Primary color, position, animation, greeting text |
| Widget targeting settings | various | — | Audience, pages, devices, delay, scroll depth, exit intent |
| Embed code copy button | button | — | Copies generated embed code to clipboard |
| Domain whitelist add input | input | — | Add allowed domain |
| Domain remove button | button | — | Remove allowed domain |
| Widget delete button | button | — | DELETE /api/widgets/{id} |
| Widget preview | view | — | Preview widget appearance |

#### Landing Pages

| Element | Type | data-testid | Behavior |
|---------|------|-------------|----------|
| Create Landing Page button | button | — | Creates new landing page (client-side) |
| Landing page list | list | — | Shows existing landing pages |
| Landing page detail view | view | — | Edit landing page settings |
| Delete landing page button | button | — | Removes from client state |

#### API Keys (super_admin only)

| Element | Type | data-testid | Behavior |
|---------|------|-------------|----------|
| API Access toggle | switch | `switch-api-access` | Enable REST API access |
| API Key display | input (readonly) | `input-api-key` | Masked key display |
| Rotate Key button | button | `button-rotate-key` | Demo: shows toast |
| Rate Limit input | number | `input-rate-limit` | Requests per hour |
| Save button | button | `button-save-api-keys` | Demo: saves locally |

#### Webhooks (super_admin only)

| Element | Type | data-testid | Behavior |
|---------|------|-------------|----------|
| Webhook URL input | input | `input-webhook-url` | Target URL |
| Lead Created checkbox | checkbox | `checkbox-webhook-lead-created` | Event subscription |
| Call Completed checkbox | checkbox | `checkbox-webhook-call-completed` | Event subscription |
| Appointment Booked checkbox | checkbox | `checkbox-webhook-appointment-booked` | Event subscription |
| Agent Status Change checkbox | checkbox | `checkbox-webhook-agent-status-change` | Event subscription |
| Webhook status toggle | switch | `switch-webhook-status` | Active/Inactive |
| Save button | button | `button-save-webhooks` | Demo: saves locally |

### 2.5 Knowledge Base Section

#### Tab Navigation

| Element | Type | data-testid | Behavior |
|---------|------|-------------|----------|
| Back button | button | `button-back-settings` | Returns to tile grid |
| Documents tab | TabsTrigger | `tab-kb-documents` | Shows uploaded documents |
| Web Pages tab | TabsTrigger | `tab-kb-web-pages` | Shows indexed web pages |
| Databases tab | TabsTrigger | `tab-kb-databases` | Future feature placeholder |
| Settings tab | TabsTrigger | `tab-kb-settings` | Knowledge base settings |

#### Documents Tab

| Element | Type | data-testid | Behavior |
|---------|------|-------------|----------|
| Search documents input | input | `input-search-documents` | Filter documents |
| File upload input (hidden) | file input | `input-file-upload` | Hidden, triggered by Upload button |
| Upload button | button | `button-upload-document` | Triggers file input. POST /api/documents with FormData |
| Document row | tr | `doc-row-{id}` | Shows name, type, size, date |
| Document name | td | `text-doc-name-{id}` | Filename |
| Document type | td | `text-doc-type-{id}` | Uppercase file type |
| Document size | td | `text-doc-size-{id}` | Formatted size (KB/MB) |
| Document date | td | `text-doc-date-{id}` | MM/DD format |
| Delete document button | button | `button-delete-doc-{id}` | DELETE /api/documents/{id} |
| No documents message | td | `text-no-documents` | "No documents uploaded yet." |
| Duplicate dialog | dialog | — | Shows when uploading duplicate filename |

#### Web Pages Tab

| Element | Type | data-testid | Behavior |
|---------|------|-------------|----------|
| Add URL button | button | `button-add-url` | Demo: shows toast |
| Web page row | tr | `web-row-dealer` | Static demo row |
| Delete URL button | button | `button-delete-url-dealer` | Demo: shows toast |

#### Knowledge Settings Tab

| Element | Type | data-testid | Behavior |
|---------|------|-------------|----------|
| Auto-Index Files toggle | switch | `switch-auto-index` | Default checked |
| Enable Web Scraping toggle | switch | `switch-web-scraping` | Default unchecked |
| Document Retention input | number | `input-doc-retention` | Default 90 days |
| Smart Summarization toggle | switch | `switch-smart-summarization` | Default checked |
| Learning Mode toggle | switch | `switch-learning-mode` | Disabled (always on) |
| Save button | button | `button-save-kb-settings` | Demo: saves locally |

### 2.6 AI Configuration Section (super_admin edit, partner_admin read-only)

#### Tab Navigation

| Element | Type | data-testid | Behavior |
|---------|------|-------------|----------|
| Back button | button | `button-back-settings` | Returns to tile grid |
| System Prompt tab | TabsTrigger | `tab-system-prompt` | AI model, system prompt, chat instructions |
| Agent Behavior tab | TabsTrigger | `tab-agent-behavior` | Behavior context, allowed actions |
| Hunches tab | TabsTrigger | `tab-hunches` | Hunches configuration |

#### System Prompt Tab

| Element | Type | data-testid | Behavior |
|---------|------|-------------|----------|
| AI Model select | select | `select-ai-model` | Options: Claude, Gemini (fallback), OpenAI (fallback). Disabled for partner_admin |
| Claude option | SelectItem | `select-item-claude` | Default |
| Gemini option | SelectItem | `select-item-gemini` | Falls back to Claude |
| OpenAI option | SelectItem | `select-item-openai` | Falls back to Claude |
| System Prompt textarea | textarea | `textarea-system-prompt` | Saves on blur. PATCH /api/settings/org. Disabled for partner_admin |
| Chat Instructions textarea | textarea | `textarea-chat-instructions` | Saves on blur. PATCH /api/settings/org. Disabled for partner_admin |
| Save button | button | `button-save-system-prompt` | Hidden for partner_admin |

#### Agent Behavior Tab

| Element | Type | data-testid | Behavior |
|---------|------|-------------|----------|
| Behavior Context textarea | textarea | `textarea-behavior-context` | Disabled for partner_admin |
| Initiate outbound calls checkbox | checkbox | `checkbox-action-initiate-outbound-calls` | Default checked. Disabled for partner_admin |
| Send SMS messages checkbox | checkbox | `checkbox-action-send-sms-messages` | Default checked. Disabled for partner_admin |
| Create leads in CRM checkbox | checkbox | `checkbox-action-create-leads-in-crm` | Default checked. Disabled for partner_admin |
| Schedule appointments checkbox | checkbox | `checkbox-action-schedule-appointments` | Default checked. Disabled for partner_admin |
| Access financial data checkbox | checkbox | `checkbox-action-access-financial-data` | Default unchecked. Disabled for partner_admin |
| Modify customer records checkbox | checkbox | `checkbox-action-modify-customer-records` | Default unchecked. Disabled for partner_admin |
| Save button | button | `button-save-agent-behavior` | Hidden for partner_admin |

#### Hunches Tab

| Element | Type | data-testid | Behavior |
|---------|------|-------------|----------|
| Enable Hunches toggle | switch | `switch-enable-hunches` | PATCH /api/settings/org. Disabled for partner_admin |
| Auto-Scoring toggle | switch | `switch-auto-scoring` | Disabled (always on) |
| Confidence Threshold input | number | `input-confidence-threshold` | Disabled, value 70 |

### 2.7 Notifications Section

| Element | Type | data-testid | Behavior |
|---------|------|-------------|----------|
| Back button | button | `button-back-settings` | Returns to tile grid |
| Email Notifications toggle | switch | `switch-email-notifications` | Default on |
| SMS Notifications toggle | switch | `switch-sms-notifications` | Default off |
| Push Notifications toggle | switch | `switch-push-notifications` | Default on |
| Quiet Hours Start input | input | `input-quiet-start` | Default "22:00" |
| Quiet Hours End input | input | `input-quiet-end` | Default "07:00" |
| New Lead toggle | switch | `switch-notification-new-lead` | Default on |
| Appointment Booked toggle | switch | `switch-notification-appointment-booked` | Default on |
| Agent Alert toggle | switch | `switch-notification-agent-alert` | Default on |
| Task Due toggle | switch | `switch-notification-task-due` | Default on |
| Save button | button | `button-save-notifications` | PATCH /api/settings/org with {notifications: ...} |

### 2.8 Appearance Section

| Element | Type | data-testid | Behavior |
|---------|------|-------------|----------|
| Back button | button | `button-back-settings` | Returns to tile grid |
| Compact Mode toggle | switch | `switch-compact-mode` | Default off |
| Animations toggle | switch | `switch-animations` | Default on |
| Default View select | select | `select-default-view` | Options: Dashboard, Hub, Insights, Agents |
| Show Metric Tiles toggle | switch | `switch-metric-tiles` | Default on |
| Save button | button | `button-save-appearance-settings` | Saves to localStorage('nexxus:appearance') |

---

## 3. API Endpoint Inventory

| Method | Endpoint | Auth | Role Gate | Purpose |
|--------|----------|------|-----------|---------|
| GET | /api/settings/org | token | any | Get org settings JSON |
| PATCH | /api/settings/org | token | level <= 3 | Merge-update org settings |
| GET | /api/users | token | level <= 3 | List org users |
| POST | /api/users | token | level <= 3 | Create user |
| GET | /api/users/me | token | any | Get current user profile |
| PATCH | /api/users/me | token | any | Update own profile |
| PATCH | /api/users/:id | token | level <= 3 | Update user (name, role, isActive, additionalOrgIds) |
| POST | /api/users/:id/reset-password | token | level <= 3 | Reset user password (min 6 chars) |
| POST | /api/users/me/photo | token | any | Upload profile photo (image, max 500KB) |
| POST | /api/users/invite | token | level <= 3 | Invite user (creates account, optionally sends email) |
| GET | /api/roles | token | any | List all roles |
| GET | /api/organizations | token | any | List orgs (all for level<=2, own for others) |
| GET | /api/organizations/:id | token | any (org scoped) | Get org detail |
| POST | /api/organizations | token | level <= 2 | Create org (super_admin only enforced in handler) |
| PATCH | /api/organizations/:id | token | level <= 3 | Update org |
| PATCH | /api/organizations/:id/slug | token | level <= 3 | Update org slug with redirect |
| GET | /api/integrations | token | any | List integrations for org |
| POST | /api/integrations/provision | token | level <= 2 | Provision VIN dealer |
| GET | /api/integrations/:orgId/vin-config | token | level <= 3 | Get VIN config (dealer ID, default user) |
| PATCH | /api/integrations/:orgId/vin-config | token | level <= 3 | Update VIN default user |
| GET | /api/vin/users/:orgId | token | level <= 3 | List VIN Solutions users for dropdown |
| GET | /api/widgets | token | any | List org widgets |
| GET | /api/widgets/:id | token | any (org scoped) | Get widget detail |
| POST | /api/widgets | token | level <= 3 | Create widget (entitlement gated) |
| PATCH | /api/widgets/:id | token | level <= 3 | Update widget |
| DELETE | /api/widgets/:id | token | level <= 3 | Delete widget |
| GET | /api/documents | token | any | List org documents |
| POST | /api/documents | token | any | Upload document (multipart, max 5MB) |
| POST | /api/documents/check-duplicate | token | any | Check if filename already exists |
| DELETE | /api/documents/:id | token | level <= 3 | Delete document + CSV child rows |
| GET | /api/notifications | token | any | List user notifications |
| GET | /api/notifications/unread-count | token | any | Unread notification count |
| PATCH | /api/notifications/:id/read | token | any | Mark notification read |
| POST | /api/notifications/mark-all-read | token | any | Mark all read |
| GET | /api/outbound/status | token | — | Get outbound status (comm gate, channels, rate limit) |

---

## 4. Existing Tests (domain-09-settings.spec.ts)

| Test ID | Name | Coverage |
|---------|------|----------|
| 9.1 | Settings page loads with all tiles | Loads /settings as superAdmin, verifies tile count > 0 |
| 9.2 | Profile shows name, email, photo, password change | Loads /profile, checks name/email inputs, avatar, password field |
| 9.3 | Restart Tour button on profile | Loads /profile, clicks Preferences tab, verifies reset tour button |
| 9.4 | Org Wizard accessible to Super Admin only | API test: super_admin gets 200 on /api/organizations, sales gets limited array |
| 9.5 | Communication gate toggle in settings | Opens Organization tile, verifies switch-communication-gate visible |

---

## 5. Test Cases

### 5.1 Settings Landing — Navigation and Access

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-SET-001 | Settings page loads with all tiles for super_admin | P0 | EXISTING (9.1) | Login as superAdmin, navigate to /settings | All 7 tiles render (Users, Organization, Tools, Knowledge, AI, Notifications, Appearance) |
| TC-SET-002 | Settings page loads correct tiles for org_admin | P0 | NEW | Login as orgAdmin, navigate to /settings | 6 tiles render (no AI Configuration tile) |
| TC-SET-003 | Settings page loads correct tiles for partner_admin | P1 | NEW | Login as partnerAdmin, navigate to /settings | All 7 tiles render (AI Config visible but read-only inside) |
| TC-SET-004 | Settings page hidden for sales role | P0 | NEW | Login as sales, navigate to /settings | Redirected or access denied (no settings in sidebar) |
| TC-SET-005 | Settings page hidden for service role | P1 | NEW | Login as service, navigate to /settings | Redirected or access denied |
| TC-SET-006 | Settings page hidden for marketing role | P1 | NEW | Login as marketing, navigate to /settings | Redirected or access denied |
| TC-SET-007 | Deep link to section via ?section= param | P2 | NEW | Navigate to /settings?section=organization | Opens Organization section directly |
| TC-SET-008 | Tile click navigates to correct section | P1 | NEW | Click each tile (users, organization, tools, knowledge, ai, notifications, appearance) | Each opens corresponding section |
| TC-SET-009 | Back button from any section returns to tile grid | P1 | NEW | Open any section, click Back button | Returns to tile grid |

### 5.2 User Management — CRUD

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-SET-010 | User list loads and displays users | P0 | NEW | Login as orgAdmin, open Users section | User list loads with cards showing name, email, role badge |
| TC-SET-011 | Search filters users by name | P1 | NEW | Type partial name in search input | Only matching users shown |
| TC-SET-012 | Search filters users by email | P1 | NEW | Type partial email in search input | Only matching users shown |
| TC-SET-013 | Add User — success | P0 | NEW | Click Add User, fill all fields (firstName, lastName, email, password, roleId), submit | User created (201), appears in list, toast "User created" |
| TC-SET-014 | Add User — duplicate email rejected | P1 | NEW | Attempt to create user with existing email | 409 error, toast "A user with that email already exists" |
| TC-SET-015 | Add User — missing fields rejected | P1 | NEW | Submit add user form with empty fields | 400 error, validation message |
| TC-SET-016 | Add User — password too short | P2 | NEW | Submit with password < 6 chars | 400 error "Password must be at least 6 characters" |
| TC-SET-017 | Edit User — change name | P1 | NEW | Open user menu, click Edit, change firstName, submit | User updated, new name shown in list |
| TC-SET-018 | Edit User — change role | P0 | NEW | Open user menu, click Edit, change role, submit | User updated, new role badge shown. Activity log records role_changed |
| TC-SET-019 | Edit User — cannot assign higher-privilege role | P1 | NEW (API) | org_admin tries to assign super_admin role | 403 "Cannot assign a role with higher privileges than your own" |
| TC-SET-020 | Edit User — cannot modify higher-privilege user | P1 | NEW (API) | org_admin tries to PATCH a super_admin user | 403 "Cannot modify a user with higher privileges than your own" |
| TC-SET-021 | Deactivate User | P0 | NEW | Open user menu, click Deactivate | User's isActive set to false, shows "Inactive" badge, opacity reduced |
| TC-SET-022 | Reset Password — success | P1 | NEW | Open user menu, click Reset Password, enter new password (6+ chars), submit | Password reset, toast "Password has been reset". User sessions deleted |
| TC-SET-023 | Reset Password — too short | P2 | NEW | Submit with password < 6 chars | 400 error |
| TC-SET-024 | Reset Password — cannot reset higher-privilege user | P1 | NEW (API) | org_admin tries to reset super_admin password | 403 |
| TC-SET-025 | Invite User — success | P1 | NEW | Click Invite User, fill form, submit | User created (201) with temp password. Toast shows invite status |
| TC-SET-026 | Invite User — duplicate email | P1 | NEW | Invite user with existing email | 409 error |
| TC-SET-027 | Invite User — invalid email format | P2 | NEW | Submit invite with malformed email | 400 validation error |
| TC-SET-028 | New Organization button visible for super_admin only | P1 | NEW | Login as super_admin vs org_admin | Button present only for super_admin |
| TC-SET-029 | New Organization button navigates to org wizard | P2 | NEW | Click New Organization button | Navigates to /settings/org-wizard |

### 5.3 Organization Settings

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-SET-030 | Organization fields pre-populated from current org | P0 | NEW | Open Organization section | Name, persona name, phone, email fields populated from authUser.organization |
| TC-SET-031 | Save organization name and persona name | P0 | NEW | Change org name and persona name, click Save | PATCH /api/organizations/{id} succeeds, toast "Settings saved" |
| TC-SET-032 | Public Listing toggle | P2 | NEW | Toggle public listing switch | Value updates in state |
| TC-SET-033 | Business hours — timezone, start, end | P1 | NEW | Set timezone, start hour, end hour, click Save Business Hours | PATCH /api/settings/org succeeds |
| TC-SET-034 | After-hours message template | P1 | NEW | Edit after-hours message with placeholders, save | Message saved to org settings |
| TC-SET-035 | Communication gate toggle ON | P0 | EXISTING (9.5) | Click Organization tile, verify switch-communication-gate visible, toggle ON | outboundEnabled = true, channels become enabled |
| TC-SET-036 | Communication gate toggle OFF | P0 | NEW | Toggle communication gate OFF | outboundEnabled = false, warning alert shows, channel toggles disabled |
| TC-SET-037 | Communication gate — warning alert visible when OFF | P1 | NEW | Ensure gate is OFF | Red alert with AlertTriangle icon and warning text visible |
| TC-SET-038 | Channel controls — SMS toggle | P1 | NEW | Enable comm gate, toggle SMS channel | PATCH /api/organizations/{id} with smsEnabled |
| TC-SET-039 | Channel controls — Email toggle | P1 | NEW | Enable comm gate, toggle Email channel | PATCH with emailEnabled |
| TC-SET-040 | Channel controls — Phone toggle | P1 | NEW | Enable comm gate, toggle Phone channel | PATCH with phoneEnabled |
| TC-SET-041 | Channel controls — Video toggle | P1 | NEW | Enable comm gate, toggle Video channel | PATCH with videoEnabled |
| TC-SET-042 | Channel controls disabled when comm gate OFF | P1 | NEW | Set comm gate OFF, check channel toggles | All channel switches have disabled attribute |
| TC-SET-043 | Rate limit — set valid value | P1 | NEW | Change rate limit to 5 | Saves to org settings, toast "Rate limit updated" |
| TC-SET-044 | Rate limit — boundary: minimum (1) | P2 | NEW | Set rate limit to 1 | Accepted |
| TC-SET-045 | Rate limit — boundary: maximum (50) | P2 | NEW | Set rate limit to 50 | Accepted |
| TC-SET-046 | TextMagic phone number — saves on blur | P2 | NEW | Type phone number, blur input | PATCH org settings with textmagicPhone |
| TC-SET-047 | Communication gate notification sent to org users | P1 | NEW (API) | Toggle outboundEnabled via API | Notification created for all org users with gate state |

### 5.4 Tools & Integrations

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-SET-048 | Tools section has correct tabs | P0 | NEW | Open Tools section | Tabs: MCP, API, Other, Universal, Widgets, Pages. super_admin also sees API Keys, Webhooks |
| TC-SET-049 | MCP tab shows empty state | P1 | NEW | Click MCP tab | "No MCP tools configured." message |
| TC-SET-050 | API tab shows tool cards | P1 | NEW | Click API tab | Cards for CRM, Voice, Video, Auth, SMS |
| TC-SET-051 | Other tab shows tool cards | P1 | NEW | Click Other tab | Card for Document Generator |
| TC-SET-052 | Tool toggle — unlocked tool (SMS) | P1 | NEW | Toggle SMS tool card switch | Persisted to org.settings.toolToggles, toast "Tool updated" |
| TC-SET-053 | Tool toggle — locked tool cannot be toggled | P2 | NEW | Verify locked tool (CRM) switch is disabled | Switch is non-interactive or shows lock indicator |
| TC-SET-054 | API Keys tab visible only for super_admin | P0 | NEW | Login as orgAdmin, open Tools | API Keys tab not present |
| TC-SET-055 | Webhooks tab visible only for super_admin | P0 | NEW | Login as orgAdmin, open Tools | Webhooks tab not present |
| TC-SET-056 | API Keys — view masked key | P2 | NEW | Open API Keys tab as super_admin | Masked key displayed in readonly input |
| TC-SET-057 | API Keys — rotate key | P2 | NEW | Click Rotate button | Toast "Key rotation (demo)" |
| TC-SET-058 | Webhooks — URL input and event checkboxes | P2 | NEW | Open Webhooks tab | URL input, 4 event checkboxes, status toggle present |
| TC-SET-059 | Webhooks — save configuration | P2 | NEW | Fill webhook URL, select events, click Save | Toast "Webhooks saved locally" |

### 5.5 Universal Widget Settings

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-SET-060 | Universal settings show 5 channel toggles | P1 | NEW | Open Universal tab | Chat, Video, Voice, SMS, Callback channel rows with switches |
| TC-SET-061 | Toggle individual channel | P2 | NEW | Toggle voice channel off | Channel state updates, icon changes to muted style |

### 5.6 Widget Management

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-SET-062 | Widgets tab shows widget type cards | P1 | NEW | Open Widgets tab | Widget type cards (text, video, voice, unified) displayed |
| TC-SET-063 | Create new widget | P0 | NEW | Click create widget action | New widget created (POST /api/widgets), detail view opens |
| TC-SET-064 | Edit widget name and description | P1 | NEW | Open widget detail, change name | Widget updated |
| TC-SET-065 | Widget appearance settings | P2 | NEW | Change primary color, position, greeting | Settings update in state |
| TC-SET-066 | Widget targeting settings | P2 | NEW | Change audience, include pages, device toggles | Settings update in state |
| TC-SET-067 | Copy embed code | P1 | NEW | Open embed code tab, click copy | Code copied to clipboard, toast "Copied!" |
| TC-SET-068 | Add domain to whitelist | P2 | NEW | Enter domain in input, add | Domain appears in whitelist, toast "Domain added" |
| TC-SET-069 | Remove domain from whitelist | P2 | NEW | Click remove on a domain | Domain removed from list |
| TC-SET-070 | Delete widget | P0 | NEW | Delete a widget | DELETE /api/widgets/{id}, widget removed from list |
| TC-SET-071 | Widget creation requires entitlement | P1 | NEW (API) | POST /api/widgets without widget_slots entitlement | Blocked by requireEntitlement middleware |

### 5.7 Landing Pages

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-SET-072 | Landing pages tab shows page list | P1 | NEW | Open Pages tab | Existing landing pages listed |
| TC-SET-073 | Create landing page | P2 | NEW | Click create landing page | New page added to list, detail view opens |
| TC-SET-074 | Delete landing page | P2 | NEW | Delete a landing page | Page removed from list, toast "Page deleted" |

### 5.8 Knowledge Base

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-SET-075 | Knowledge base has 4 tabs | P0 | NEW | Open Knowledge section | Documents, Web Pages, Databases, Settings tabs |
| TC-SET-076 | Documents tab — empty state | P1 | NEW | Open Documents tab with no docs | "No documents uploaded yet." message |
| TC-SET-077 | Upload document — text file | P0 | NEW | Upload a .txt file via Upload button | POST /api/documents succeeds, doc appears in table with name, type, size, date |
| TC-SET-078 | Upload document — CSV file | P0 | NEW | Upload a valid .csv file | CSV parsed, parent doc + row chunks created |
| TC-SET-079 | Upload document — file too large (>5MB) | P1 | NEW | Attempt upload of >5MB file | Client-side toast "File too large" |
| TC-SET-080 | Upload document — duplicate filename detection | P1 | NEW | Upload file with same name as existing | Duplicate dialog opens with replace/keep/cancel options |
| TC-SET-081 | Upload document — replace duplicate | P1 | NEW | Choose "Replace" in duplicate dialog | Old doc deleted, new doc uploaded |
| TC-SET-082 | Upload document — keep existing (cancel upload) | P2 | NEW | Choose "Keep Existing" in duplicate dialog | Upload cancelled, toast "Upload cancelled" |
| TC-SET-083 | Delete document | P0 | NEW | Click delete button on a document row | DELETE /api/documents/{id}, doc removed from table, toast "Deleted" |
| TC-SET-084 | Delete CSV document also deletes child rows | P1 | NEW (API) | Delete a CSV parent document | Parent doc and all csv-row children deleted |
| TC-SET-085 | Upload malformed CSV — parse errors | P1 | NEW (API) | Upload CSV with malformed rows | 400 error with "CSV has N malformed rows" message |
| TC-SET-086 | Upload empty file | P2 | NEW (API) | Upload 0-byte file | 400 "File is empty" |
| TC-SET-087 | Web Pages tab — static demo row | P2 | NEW | Open Web Pages tab | Shows "dealer.com/inv" row with Indexed badge |
| TC-SET-088 | Web Pages — Add URL button (demo) | P2 | NEW | Click Add URL | Toast "Add URL (demo)" |
| TC-SET-089 | Databases tab — placeholder | P2 | NEW | Open Databases tab | "Database Connections" placeholder text |
| TC-SET-090 | Knowledge Settings — auto-index toggle | P2 | NEW | Open Settings tab | Auto-Index toggle visible, default checked |
| TC-SET-091 | Knowledge Settings — web scraping toggle | P2 | NEW | Toggle web scraping | Switch state changes |
| TC-SET-092 | Knowledge Settings — document retention input | P2 | NEW | Change retention value | Input updates |
| TC-SET-093 | Knowledge Settings — save button | P2 | NEW | Click Save | Toast "Settings saved locally" |

### 5.9 AI Configuration

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-SET-094 | AI Config section has 3 tabs | P0 | NEW | Open AI Configuration | System Prompt, Agent Behavior, Hunches tabs |
| TC-SET-095 | AI Model select — change model | P0 | NEW | Select Gemini from AI Model dropdown | PATCH /api/settings/org with aiModel: 'gemini', toast "AI model updated" |
| TC-SET-096 | System Prompt — edit and save | P0 | NEW | Type in system prompt textarea, click Save | PATCH /api/settings/org with systemPrompt value |
| TC-SET-097 | Chat Instructions — edit and save | P1 | NEW | Type in chat instructions textarea, blur or click Save | Saved to org settings |
| TC-SET-098 | System Prompt — auto-save on blur | P2 | NEW | Edit system prompt, click outside | If value changed, auto-saves via PATCH |
| TC-SET-099 | Agent Behavior — allowed actions checkboxes | P1 | NEW | Open Agent Behavior tab | 6 checkboxes displayed, first 4 checked, last 2 unchecked |
| TC-SET-100 | Agent Behavior — save | P2 | NEW | Click Save | Toast "Agent behavior saved locally" |
| TC-SET-101 | Hunches — enable toggle | P1 | NEW | Toggle Enable Hunches switch | PATCH /api/settings/org with hunchesEnabled value |
| TC-SET-102 | Hunches — auto-scoring disabled | P2 | NEW | Check auto-scoring toggle | Disabled, always on |
| TC-SET-103 | Hunches — confidence threshold disabled | P2 | NEW | Check confidence threshold input | Disabled, value 70 |
| TC-SET-104 | AI Config read-only for partner_admin | P0 | NEW | Login as partnerAdmin, open AI Config | All inputs disabled. Save buttons hidden. Model select disabled |
| TC-SET-105 | AI Config tile not visible for org_admin | P0 | NEW | Login as orgAdmin | AI Configuration tile absent from settings page |

### 5.10 Notifications

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-SET-106 | Notification settings load with defaults | P0 | NEW | Open Notifications section | Email on, SMS off, Push on. Quiet hours 22:00-07:00. All events on |
| TC-SET-107 | Toggle email notifications | P1 | NEW | Toggle email notifications off | Switch state changes |
| TC-SET-108 | Toggle SMS notifications | P1 | NEW | Toggle SMS notifications on | Switch state changes |
| TC-SET-109 | Toggle push notifications | P1 | NEW | Toggle push notifications off | Switch state changes |
| TC-SET-110 | Set quiet hours | P1 | NEW | Change start to 23:00, end to 06:00 | Input values update |
| TC-SET-111 | Toggle per-event: New Lead | P1 | NEW | Toggle New Lead off | Switch state changes |
| TC-SET-112 | Toggle per-event: Appointment Booked | P2 | NEW | Toggle off | Switch state changes |
| TC-SET-113 | Toggle per-event: Agent Alert | P2 | NEW | Toggle off | Switch state changes |
| TC-SET-114 | Toggle per-event: Task Due | P2 | NEW | Toggle off | Switch state changes |
| TC-SET-115 | Save notification preferences | P0 | NEW | Modify prefs and click Save | PATCH /api/settings/org with {notifications: {...}}, toast "Settings saved" |
| TC-SET-116 | Notification prefs loaded from server on init | P1 | NEW | Previously saved prefs, reopen Notifications | Switches reflect saved state from orgSettings |

### 5.11 Appearance

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-SET-117 | Appearance section loads with defaults | P0 | NEW | Open Appearance section | Compact Mode off, Animations on, Default View = Dashboard, Show Metric Tiles on |
| TC-SET-118 | Toggle compact mode | P1 | NEW | Toggle Compact Mode on | Switch state changes |
| TC-SET-119 | Toggle animations | P1 | NEW | Toggle Animations off | Switch state changes |
| TC-SET-120 | Change default view | P1 | NEW | Select "Insights" from Default View dropdown | Select value changes |
| TC-SET-121 | Toggle show metric tiles | P1 | NEW | Toggle Show Metric Tiles off | Switch state changes |
| TC-SET-122 | Save appearance settings | P0 | NEW | Modify prefs and click Save | Saved to localStorage('nexxus:appearance'), toast "Settings saved" |
| TC-SET-123 | Appearance prefs persist across page reload | P1 | NEW | Save prefs, reload /settings, open Appearance | Switches reflect previously saved state from localStorage |
| TC-SET-124 | Browser-note info text present | P2 | NEW | Open Appearance | "These settings are saved to your browser." text visible |

### 5.12 Role-Gated Access — API Level

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-SET-125 | GET /api/users — sales user gets 403 | P0 | NEW (API) | Login as sales, GET /api/users | 403 Forbidden |
| TC-SET-126 | POST /api/users — sales user gets 403 | P0 | NEW (API) | Login as sales, POST /api/users | 403 Forbidden |
| TC-SET-127 | PATCH /api/settings/org — sales user gets 403 | P0 | NEW (API) | Login as sales, PATCH /api/settings/org | 403 Forbidden |
| TC-SET-128 | PATCH /api/organizations/:id — sales user gets 403 | P0 | NEW (API) | Login as sales, PATCH org | 403 Forbidden |
| TC-SET-129 | DELETE /api/documents/:id — sales user gets 403 | P1 | NEW (API) | Login as sales, DELETE document | 403 Forbidden |
| TC-SET-130 | POST /api/widgets — sales user gets 403 | P1 | NEW (API) | Login as sales, POST widget | 403 Forbidden |
| TC-SET-131 | DELETE /api/widgets/:id — sales user gets 403 | P1 | NEW (API) | Login as sales, DELETE widget | 403 Forbidden |
| TC-SET-132 | POST /api/organizations — org_admin gets 403 | P0 | NEW (API) | Login as orgAdmin, POST /api/organizations | 403 (requireRole(2) blocks level 3) |
| TC-SET-133 | POST /api/integrations/provision — org_admin gets 403 | P1 | NEW (API) | Login as orgAdmin, POST /api/integrations/provision | 403 |
| TC-SET-134 | Org Wizard accessible to Super Admin only | P0 | EXISTING (9.4) | API: super_admin sees all orgs, sales sees only own | Verified |
| TC-SET-135 | Cross-org access denied for org_admin | P1 | NEW (API) | org_admin tries PATCH /api/organizations/{other-org-id} | 403 Access denied |
| TC-SET-136 | Cross-org widget access denied | P1 | NEW (API) | Authenticated user tries GET /api/widgets/{other-org-widget} | 403 Access denied |
| TC-SET-137 | additionalOrgIds only settable by super/partner admin | P2 | NEW (API) | org_admin tries PATCH user with additionalOrgIds | Field ignored (level > 2 check) |

### 5.13 Profile (covered in domain-09 but included for completeness)

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-SET-138 | Profile page shows name, email, photo, password | P0 | EXISTING (9.2) | Navigate to /profile | Name/email inputs, avatar, password section visible |
| TC-SET-139 | Restart Tour button on profile | P1 | EXISTING (9.3) | Navigate to /profile, click Preferences tab | Reset Tour button visible |

### 5.14 VIN Integration Config

| ID | Name | Priority | Type | Steps | Expected Result |
|----|------|----------|------|-------|-----------------|
| TC-SET-140 | VIN lead config section renders | P1 | NEW | Open Tools section, find VIN lead config details | Expandable section with "Default VIN Sales Rep" summary |
| TC-SET-141 | VIN user dropdown loads from API | P1 | NEW | Expand VIN config section | /api/vin/users/{orgId} called, dropdown populated with users |
| TC-SET-142 | Select default VIN user saves | P1 | NEW | Select a VIN user from dropdown | PATCH /api/integrations/{orgId}/vin-config with defaultVinUserId |
| TC-SET-143 | VIN config shows dealer name and ID | P2 | NEW | Expand VIN config with existing config | Dealer name and ID text visible |

---

## 6. Test Summary

| Category | Total | Existing | New | P0 | P1 | P2 |
|----------|-------|----------|-----|----|----|-----|
| Landing & Navigation | 9 | 1 | 8 | 3 | 3 | 3 |
| User Management CRUD | 20 | 0 | 20 | 5 | 10 | 5 |
| Organization Settings | 18 | 1 | 17 | 3 | 9 | 6 |
| Tools & Integrations | 12 | 0 | 12 | 2 | 5 | 5 |
| Universal Settings | 2 | 0 | 2 | 0 | 1 | 1 |
| Widget Management | 10 | 0 | 10 | 2 | 3 | 5 |
| Landing Pages | 3 | 0 | 3 | 0 | 1 | 2 |
| Knowledge Base | 19 | 0 | 19 | 3 | 5 | 11 |
| AI Configuration | 12 | 0 | 12 | 4 | 4 | 4 |
| Notifications | 11 | 0 | 11 | 2 | 6 | 3 |
| Appearance | 8 | 0 | 8 | 2 | 4 | 2 |
| Role-Gated API | 13 | 1 | 12 | 4 | 6 | 3 |
| Profile | 2 | 2 | 0 | 1 | 1 | 0 |
| VIN Config | 4 | 0 | 4 | 0 | 3 | 1 |
| **TOTAL** | **143** | **5** | **138** | **31** | **61** | **51** |

---

## 7. Test Users Available

| Key | Email | Role | Org |
|-----|-------|------|-----|
| superAdmin | duane.wells@huminic.ai | super_admin | Huminic |
| partnerAdmin | duanekwells@gmail.com | partner_admin | Cage Automotive |
| orgAdmin | serra_honda@huminic.ai | org_admin | Serra Honda |
| executive | executive_staff@huminic.ai | executive | Huminic |
| sales | sales_staff@huminic.ai | sales | Huminic |
| service | service_staff@huminic.ai | service | Huminic |
| marketing | marketing_staff@huminic.ai | marketing | Huminic |

All use password: `NexxusTest2026`

---

## 8. Key data-testid Reference

Settings tiles: `settings-tile-{users|organization|tools|knowledge|ai|notifications|appearance}`
Back button (all sections): `button-back-settings`
User management: `button-add-user`, `button-invite-user`, `button-new-organization`, `input-search-users`, `user-{id}`, `user-menu-{id}`, `edit-user-{id}`, `reset-pw-{id}`, `deactivate-user-{id}`
Organization: `input-org-name`, `input-persona-name`, `input-org-phone`, `input-org-email`, `switch-public-listing`, `button-save-org`, `input-timezone`, `input-business-hours-start`, `input-business-hours-end`, `textarea-after-hours-message`, `button-save-business-hours`, `switch-communication-gate`, `switch-sms-channel`, `switch-email-channel`, `switch-phone-channel`, `switch-video-channel`, `input-rate-limit`, `input-textmagic-phone`
Tools tabs: `tab-mcp`, `tab-api-tools`, `tab-other`, `tab-universal`, `tab-widgets`, `tab-landing-pages`, `tab-api-keys`, `tab-webhooks`
Universal channels: `switch-channel-{chat|video|voice|sms|callback}`
API Keys: `switch-api-access`, `input-api-key`, `button-rotate-key`, `button-save-api-keys`
Webhooks: `input-webhook-url`, `checkbox-webhook-{event}`, `switch-webhook-status`, `button-save-webhooks`
VIN config: `vin-lead-config-section`, `select-default-vin-user`
Knowledge: `tab-kb-documents`, `tab-kb-web-pages`, `tab-kb-databases`, `tab-kb-settings`, `input-search-documents`, `input-file-upload`, `button-upload-document`, `doc-row-{id}`, `button-delete-doc-{id}`, `text-no-documents`, `button-add-url`, `switch-auto-index`, `switch-web-scraping`, `input-doc-retention`, `switch-smart-summarization`, `switch-learning-mode`, `button-save-kb-settings`
AI Config: `tab-system-prompt`, `tab-agent-behavior`, `tab-hunches`, `select-ai-model`, `textarea-system-prompt`, `textarea-chat-instructions`, `button-save-system-prompt`, `textarea-behavior-context`, `checkbox-action-{name}`, `button-save-agent-behavior`, `switch-enable-hunches`, `switch-auto-scoring`, `input-confidence-threshold`
Notifications: `switch-email-notifications`, `switch-sms-notifications`, `switch-push-notifications`, `input-quiet-start`, `input-quiet-end`, `switch-notification-{event}`, `button-save-notifications`
Appearance: `switch-compact-mode`, `switch-animations`, `select-default-view`, `switch-metric-tiles`, `button-save-appearance-settings`
