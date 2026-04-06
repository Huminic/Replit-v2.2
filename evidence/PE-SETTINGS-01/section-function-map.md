# Section-Function Map: PE-SETTINGS-01

**Date:** 2026-04-06
**Sprint:** PE-SETTINGS-01 -- Settings / Users / Notifications

---

## 1. User Management Section

### Frontend: `client/src/pages/settings.tsx` (renderUserManagement, lines 1061-1160+)

| UI Element | testid | Function | Backend Route |
|-----------|--------|----------|---------------|
| Add User button | button-add-user | Opens Add User dialog | — |
| Invite User button | button-invite-user | Opens Invite User dialog | — |
| New Organization button | button-new-organization | Navigates to /settings/org-wizard (super_admin only) | — |
| Search users input | input-search-users | Filters user list client-side | — |
| User card row | user-{id} | Shows name, email, role badge, active/inactive status | — |
| User menu dropdown | user-menu-{id} | Edit User, Reset Password, Deactivate | — |
| Add User dialog | input-add-firstname, input-add-lastname, input-add-email, input-add-password, select-add-role | Creates user with explicit password | POST /api/users |
| Invite User dialog | input-invite-firstname, input-invite-lastname, input-invite-email, select-invite-role | Creates user with auto-generated temp password, sends invite email | POST /api/users/invite |
| Edit User dialog | input-edit-firstname, input-edit-lastname, select-edit-role, switch-edit-active | Updates user details | PATCH /api/users/{id} |
| Reset Password dialog | input-reset-password | Resets user password | POST /api/users/{id}/reset-password |
| Change Password dialog | input-current-password, input-new-password, input-confirm-password | Changes own password | POST /api/auth/change-password |

### Backend: `server/routes/users.ts`

| Route | Method | Auth | Function |
|-------|--------|------|----------|
| /api/users | GET | authenticateToken | List all users in org (password stripped) |
| /api/users | POST | requireRole(3) | Create user with explicit password. Sends welcome email via Resend if CommGate open AND RESEND_API_KEY set |
| /api/users/invite | POST | requireRole(3) | Create user with auto-generated temp password. Sends invite email via Resend with credentials if CommGate open AND RESEND_API_KEY set |
| /api/users/me | GET | authenticateToken | Get current user profile |
| /api/users/me | PATCH | authenticateToken | Update own profile (firstName, lastName, email) |
| /api/users/me/photo | POST | authenticateToken | Upload profile photo (base64 data URL) |
| /api/users/{id} | PATCH | requireRole(3) | Update user (name, role, isActive) |
| /api/users/{id}/reset-password | POST | requireRole(3) | Reset another user's password |

### Email Flow (Critical Path)
Both POST /api/users and POST /api/users/invite check:
1. `org.outboundEnabled` AND `org.emailEnabled` (CommGate)
2. `process.env.RESEND_API_KEY` exists
3. If either fails, user is created but email is NOT sent

**IMPORTANT:** Neither route checks `process.env.OUTBOUND_LIVE_ENABLED`. This means user creation emails bypass the global kill switch. See I-235.

---

## 2. Organization Section

### Frontend: `client/src/pages/settings.tsx` (inline in renderSectionContent, lines 3458-3790)

| UI Element | testid | Function | Backend Route |
|-----------|--------|----------|---------------|
| Organization Name | input-org-name | Display name for the org | PATCH /api/organizations/{id} |
| AI Persona Name | input-persona-name | Name AI presents to customers | PATCH /api/organizations/{id} |
| Business Phone | input-org-phone | Primary contact number | PATCH /api/organizations/{id} |
| Business Email | input-org-email | Primary contact email | PATCH /api/organizations/{id} |
| Public Listing switch | switch-public-listing | Show in partner directory | PATCH /api/organizations/{id} |
| Save Changes button | button-save-org | Persists org fields | PATCH /api/organizations/{id} |
| Timezone | input-timezone | Org timezone for business hours | PATCH /api/settings/org |
| Business Hours Start | input-business-hours-start | Hour (0-23) when business hours begin | PATCH /api/settings/org |
| Business Hours End | input-business-hours-end | Hour (0-23) when business hours end | PATCH /api/settings/org |
| After-Hours Message | textarea (after-hours) | Template with {orgName}, {businessHoursStart}, {businessHoursEnd} tokens | PATCH /api/settings/org |
| Communication Gate toggle | (in Organization section) | Master outbound switch | PATCH /api/organizations/{id} |
| Channel toggles (SMS, Email, Phone, Video) | switch-sms/email/phone/video | Per-channel outbound control | PATCH /api/organizations/{id} |
| Rate Limit | (rate limit input) | Per-recipient send rate limit | PATCH /api/organizations/{id} |

### Backend: `server/routes/settings.ts`

| Route | Method | Auth | Function |
|-------|--------|------|----------|
| /api/settings/org | GET | authenticateToken | Fetch org settings jsonb column |
| /api/settings/org | PATCH | requireRole(3) | Merge-update org settings jsonb |

---

## 3. Notifications Section

### Frontend: `client/src/pages/settings.tsx` (renderNotifications, lines 3316-3375)

| UI Element | testid | Function | Backend Route |
|-----------|--------|----------|---------------|
| Email Notifications | switch-email-notifications | Toggle email alerts | PATCH /api/settings/org |
| SMS Notifications | switch-sms-notifications | Toggle SMS alerts | PATCH /api/settings/org |
| Push Notifications | switch-push-notifications | Toggle browser push | PATCH /api/settings/org |
| Quiet Hours Start | input-quiet-start | Start of quiet period | PATCH /api/settings/org |
| Quiet Hours End | input-quiet-end | End of quiet period | PATCH /api/settings/org |
| New Lead toggle | switch-notification-new-lead | Per-event notification control | PATCH /api/settings/org |
| Appointment Booked | switch-notification-appointment-booked | Per-event notification control | PATCH /api/settings/org |
| Agent Alert | switch-notification-agent-alert | Per-event notification control | PATCH /api/settings/org |
| Task Due | switch-notification-task-due | Per-event notification control | PATCH /api/settings/org |
| Save button | button-save-notifications | Persists notification prefs | PATCH /api/settings/org |

**Note:** Notification preferences are stored in org settings jsonb. There is no per-user notification preference -- all settings are org-wide.

---

## 4. Appearance Section

### Frontend: `client/src/pages/settings.tsx` (renderAppearance, lines 3377-3422)

| UI Element | testid | Function | Storage |
|-----------|--------|----------|---------|
| Compact Mode | switch-compact-mode | Smaller spacing/fonts | localStorage |
| Animations | switch-animations | UI animations toggle | localStorage |
| Default View | select-default-view | Default page on login | localStorage |
| Show Metric Tiles | switch-metric-tiles | KPI tiles on home | localStorage |
| Save button | button-save-appearance-settings | Saves to localStorage | localStorage (nexxus:appearance) |

**Note:** Appearance is browser-local only. No backend persistence. Not org-wide.

---

## 5. Profile Page

### Frontend: `client/src/pages/profile.tsx`

| UI Element | testid | Function | Backend Route |
|-----------|--------|----------|---------------|
| My Profile tab | tab-profile-main | View/edit profile info | — |
| Preferences tab | tab-profile-preferences | Dark mode, notifications, regional | — |
| Avatar upload | button-upload-photo | Upload profile photo | POST /api/users/me/photo |
| Edit Profile | (inline) | Edit name, email | PATCH /api/users/me |
| Change Password | (inline) | Change own password | POST /api/auth/change-password |

---

## 6. Tools & Integrations Section

### Frontend: `client/src/pages/settings.tsx` (renderToolsSection, lines 2860+)

Contains: MCP tool cards (VIN Solutions, VAPI, Tavus, TextMagic, etc.), widget management, landing page management, skills configuration, VIN lead config.

**Out of primary scope for PE-SETTINGS-01** -- covered by PE-INTEGRATIONS-01 for provider-specific details.

---

## 7. Knowledge Base Section

### Frontend: `client/src/pages/settings.tsx` (renderKnowledgeBase, lines 2994+)

Contains: File upload for AI training data, kill switch confirmation dialog.

**Out of primary scope for PE-SETTINGS-01** -- will be noted if relevant issues found.

---

## 8. AI Configuration Section

### Frontend: `client/src/pages/settings.tsx` (renderAIConfiguration, lines 3144+)

Contains: Agent tools selection, behavior settings.

**Out of primary scope for PE-SETTINGS-01** -- partially covered by PE-AI-CHAT-01.
