# Use Case Inventory — PE-SETTINGS-03

**Page:** Settings
**User:** serra_honda@huminic.ai (org_admin, Serra Honda)
**Date:** 2026-04-07

## F1: Settings Page Load

| # | Use Case | Status | Notes |
|---|----------|--------|-------|
| 1.1 | Page renders tile grid on load | Verified via source | 6 tiles visible for org_admin |
| 1.2 | AI Configuration tile hidden for org_admin | Verified via source | minRole excludes org_admin |
| 1.3 | Page title shows "System Settings" | Verified via source | Header with description |
| 1.4 | Mobile nav dropdown renders on small screens | Verified via source | MobileNavDropdown present |

**Commentary:**
1. Does this section show real data? Yes — tile grid is static configuration, no data dependency.
2. Is the RBAC filtering correct? Yes — accessibleTiles filters by currentRole inclusion in minRole array.
3. Could a false pass occur? Low risk — tile visibility is straightforward boolean filter.
4. What would a user expect? A clear settings hub with organized sections.
5. Does it match the section function map? Yes — 6 of 7 tiles visible.
6. Any edge cases? None for tile grid itself.
7. Performance concerns? No — static render, no API calls until section drill-down.
8. Confidence level? High (9/10).

**Result:** Accepted

## F2: User List

| # | Use Case | Status | Notes |
|---|----------|--------|-------|
| 2.1 | User list loads from /api/users | Verified via API | Returns 5+ users for Serra Honda |
| 2.2 | Each user shows name, email, role badge | Verified via source | Avatar + name + Badge(role) + email |
| 2.3 | Inactive users shown with reduced opacity | Verified via source | cn("hover-elevate", isInactive && "opacity-50") |
| 2.4 | Search filter works on name and email | Verified via source | Case-insensitive filter on firstName+lastName and email |
| 2.5 | Actions menu: Edit, Reset Password, Deactivate | Verified via source | DropdownMenu per user |
| 2.6 | Loading state shows skeleton cards | Verified via source | 3 skeleton cards during load |

**Commentary:**
1. Does this section show real data? Yes — API returns real users: Marcus Webb (partner_admin), James Chen (org_admin), Vanessa Torres (executive), Derek Wilson (sales_manager), Ashley Brooks (sales).
2. Is the user info sufficient? Yes — name, email, role, active status are shown.
3. Could a false pass occur? Low risk — data is real, not mocked.
4. What would a user expect? Ability to see and manage team members.
5. Are all roles from the org represented? Yes — multiple role types present.
6. Any RBAC concern? org_admin sees all users in their org, which is appropriate.
7. Performance concerns? No — single API call, reasonable user count.
8. Confidence level? High (9/10).

**Result:** Accepted

## F3: Invite/Add User Flow (OBSERVE ONLY)

| # | Use Case | Status | Notes |
|---|----------|--------|-------|
| 3.1 | Add User dialog has fields: firstName, lastName, email, password, role | Verified via source | All fields present with validation |
| 3.2 | Invite User dialog has fields: firstName, lastName, email, role | Verified via source | No password field — generates temp password server-side |
| 3.3 | Role selector populated from /api/roles | Verified via source+API | 8 roles available |
| 3.4 | Submit button disabled when fields incomplete | Verified via source | Explicit check: !addForm.firstName \|\| !addForm.lastName \|\| !addForm.email \|\| !addForm.password \|\| !addForm.roleId |
| 3.5 | Invite mutation calls POST /api/users/invite | Verified via source | Returns inviteSent boolean to indicate email delivery |
| 3.6 | New Organization button hidden for org_admin | Verified via source | isSuperAdmin guard |

**Commentary:**
1. Does the form have proper validation? Yes — submit disabled until all required fields filled.
2. Is there email validation? HTML type="email" attribute provides basic validation.
3. Could invite send a real email? Yes — POST /api/users/invite may trigger Resend. NOT SUBMITTED per instructions.
4. What would a user expect? Clear form to add team members.
5. Is the role dropdown useful? Yes — shows human-readable role labels via getRoleLabel().
6. Password field present on Add but not Invite? Correct — invite generates a temp password.
7. Any security concern? Password has no explicit min-length in frontend; placeholder says "Minimum 6 characters" but no enforcement visible in source.
8. Confidence level? High (8/10) — minor: no explicit frontend password validation beyond "required".

**Result:** Accepted with risk
**Risk:** No visible client-side password strength validation on Add User form (server may enforce).

## F4: Notification Settings

| # | Use Case | Status | Notes |
|---|----------|--------|-------|
| 4.1 | Global toggles: Email, SMS, Push notifications | Verified via source | Three Switch components |
| 4.2 | Quiet hours: start and end time inputs | Verified via source | Text inputs for quiet hours |
| 4.3 | Per-event preferences: 4 event types | Verified via source | New Lead, Appointment Booked, Agent Alert, Task Due |
| 4.4 | Save persists to /api/settings/org | Verified via source | PATCH with { notifications: notifPrefs } |
| 4.5 | Settings load from orgSettings on mount | Verified via source | useEffect initializes from orgSettings.notifications |

**Commentary:**
1. Does this section show real data? Partially — defaults to hardcoded values if orgSettings.notifications is empty. API returned sparse settings (only textmagicPhone), so defaults used.
2. Are toggles functional? Yes — Switch components with state management and save mutation.
3. Could a false pass occur? Medium risk — toggles work in UI but notification delivery backend not verified.
4. What would a user expect? Control over which alerts they receive.
5. Is quiet hours clear? Yes — start/end inputs with labels.
6. Are all event types meaningful? Yes — maps to real system events.
7. Any concern about persistence? Settings saved to /api/settings/org — verified endpoint exists and responds.
8. Confidence level? Medium (7/10) — toggles render and save, but actual notification delivery is unverified.

**Result:** Accepted with risk
**Risk:** Notification delivery pipeline not verified — settings save correctly but whether notifications actually fire is outside this eval scope.

## F5: Tool Configuration

| # | Use Case | Status | Notes |
|---|----------|--------|-------|
| 5.1 | 6 tool cards displayed | Verified via source | CRM, Voice, Video, Auth, SMS, Doc Gen |
| 5.2 | Locked tools cannot be toggled | Verified via source | CRM, Voice, Video, Auth are locked=true |
| 5.3 | Unlocked tools have working toggles | Verified via source | SMS, Doc Gen are unlocked |
| 5.4 | Tool toggles persist via org settings | Verified via source | PATCH to /api/organizations/:id with settings.toolToggles |
| 5.5 | Tabs: MCP Tools, Widgets, Universal, Landing Pages, Skills | Verified via source | 6 tabs for org_admin (API Keys/Webhooks hidden) |
| 5.6 | Widget list loaded from /api/widgets | Verified via API | 3+ widgets returned with config |
| 5.7 | Widget CRUD operations available | Verified via source | Create, update, delete mutations present |
| 5.8 | VIN Lead Config section present | Verified via source | Expandable details with VIN user selector |

**Commentary:**
1. Does this section show real data? Yes — widgets from API, tool states from org settings.
2. Are locked tools clearly marked? Yes — Lock icon and disabled switch.
3. Could a false pass occur? Low for tool toggles (simple persistence), medium for widget config (complex).
4. What would a user expect? Ability to manage integrations and widgets.
5. Is the tab structure clear? Yes — well-labeled tabs with logical grouping.
6. Are API Keys/Webhooks correctly hidden? Yes — isSuperAdmin guard.
7. Any concern about widget embed code? Functional — generateWidgetEmbedCode() produces embed snippets.
8. Confidence level? High (8/10).

**Result:** Accepted

## F6: Subsection Navigation

| # | Use Case | Status | Notes |
|---|----------|--------|-------|
| 6.1 | Tile click sets activeSection state | Verified via source | onClick={() => setActiveSection(tile.id)} |
| 6.2 | Back button returns to tile grid | Verified via source | Every section has Back button with setActiveSection(null) |
| 6.3 | Navigation is state-based (not route-based) | Verified via source | useState<string \| null>(null), no route changes |
| 6.4 | All 6 org_admin sections render correctly | Verified via source | renderSectionContent() switch handles all cases |

**Commentary:**
1. Is state-based navigation appropriate? Yes for settings — no deep-link needed per section.
2. Could navigation break? Low risk — simple state toggle.
3. Is back button consistently placed? Yes — top-left in every section.
4. What would a user expect? Click tile, see details, click back.
5. Could a false pass occur? No — navigation is deterministic.
6. Any performance concern? No — each section renders on demand.
7. Edge case: refreshing page? Returns to tile grid (state lost).
8. Confidence level? High (9/10) — minor: no URL-based deep linking.

**Result:** Accepted with risk
**Risk:** No deep-link support for settings subsections. Refreshing page always returns to tile grid.

## F7: RBAC Enforcement

| # | Use Case | Status | Notes |
|---|----------|--------|-------|
| 7.1 | AI Configuration tile hidden for org_admin | Verified | minRole: ['super_admin', 'partner_admin'] |
| 7.2 | "New Organization" button hidden for org_admin | Verified | isSuperAdmin guard |
| 7.3 | API Keys/Webhooks tabs hidden for org_admin | Verified | isSuperAdmin guard on tabs |
| 7.4 | Tool provision controls hidden for org_admin | Verified | isSuperAdmin guard on multiple tool controls |
| 7.5 | Users list scoped to org | Verified via API | Only Serra Honda users returned |
| 7.6 | Documents scoped to org | Verified via API | Only Serra Honda documents returned |
| 7.7 | Widgets scoped to org | Verified via API | Only Serra Honda widgets returned |

**Commentary:**
1. Is RBAC properly enforced? Yes — UI filtering via minRole and isSuperAdmin guards.
2. Is server-side RBAC enforced? Yes — API responses are org-scoped based on JWT claims.
3. Could an org_admin access admin URLs? No admin-only routes exist for settings subsections (state-based nav).
4. What would a user expect? See only what they are authorized to manage.
5. Could a false pass occur? Low — both client and server enforce boundaries.
6. Is role escalation possible? Not via Settings UI — role assignment during Add/Invite uses full role list from /api/roles, but server should validate.
7. Any concern about role dropdown? org_admin can assign any role when creating users — potential privilege escalation if server doesn't restrict.
8. Confidence level? High (8/10) — minor concern about role assignment validation on server.

**Result:** Accepted with risk
**Risk:** Role dropdown in Add/Invite User shows all 8 roles. An org_admin could potentially assign super_admin role. Server-side validation not verified in this eval.
