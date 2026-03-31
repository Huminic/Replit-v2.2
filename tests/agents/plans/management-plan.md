# Test Plan: Management Domain (T-004)

**Domain:** Management (`/management`)
**Sprint:** T-004
**Created by:** Planner Agent (T-004)
**Status:** Active
**Date:** 2026-03-31

---

## Source Inventory

| Source | Path | Key Findings |
|--------|------|--------------|
| Management page | `client/src/pages/management.tsx` | 328 lines. 5 tabs: Insights, Hunches, System Log, User Chats, Billing. RBAC guard via `canAccessManagement()`. Tab sync from URL `?tab=` param. |
| RBAC module | `client/src/lib/rbac.ts` | `canAccessManagement()` returns true ONLY for `super_admin`. All other roles (partner_admin, org_admin, executive, sales_manager, sales, service, marketing) denied. |
| Hunches API | `server/routes/hunches.ts` | `GET /api/hunches` (auth), `PATCH /api/hunches/:id` (auth, org check), `POST /api/hunches/generate` (auth, requireRole(3) = super_admin/partner_admin/org_admin). |
| Hunch schema | `shared/schema.ts` | `updateHunchSchema`: status enum `["new", "accepted", "dismissed", "resolved"]`. Fields: acceptedAt, resolvedAt (nullable dates). |
| Activity log API | `server/routes/metrics.ts` | `GET /api/activity-log` (auth). Accepts `?limit=` param (max 100, default 50). Returns org-scoped logs. |
| Existing E2E: s6-manage | `tests/e2e/s6-manage.spec.ts` | 11 tests: tab structure, billing tab, user chats TODO, activity log entries, partner admin org visibility. |
| Existing E2E: domain-06 | `tests/e2e/domain-06-departments.spec.ts` | Tests 6.4, 6.5: Management page loads with super_admin, demand score tile check. |
| Existing E2E: generated-coverage | `tests/e2e/generated-coverage.spec.ts` | 1 test: Management page loads (uses orgadmin, may be redirected by RBAC). |
| Auth helper | `tests/e2e/helpers/auth.ts` | 12 test users. `loginForBrowser()` for UI tests, `login()` for API tests. Token caching. Tour dismissal built in. |
| SubMenuManager | `client/src/components/layout/SubMenuManager.tsx` | Nav items: mg-insights, mg-hunches, mg-activities, mg-user-chats, mg-billing. |

---

## Management Page Anatomy

### Tab Structure

```
+--------------------------------------------------------------------+
| Management (h1)                                                     |
| [Insights] [Hunches] [System Log] [User Chats] [Billing]          |
+--------------------------------------------------------------------+
| ScrollArea — active tab content                                     |
|                                                                     |
+--------------------------------------------------------------------+
```

### Tab Details

| Tab ID | Label | Icon | data-testid | Content |
|--------|-------|------|-------------|---------|
| insights | Insights | BarChart3 | `tab-mgmt-insights` | Embedded `<InsightsPage embedded />` |
| hunches | Hunches | Lightbulb | `tab-mgmt-hunches` | Hunch cards with accept/dismiss/resolve actions |
| activities | System Log | Activity | `tab-mgmt-activities` | Activity log entries with icons and timestamps |
| user-chats | User Chats | MessageSquare | `tab-mgmt-user-chats` | Placeholder (coming soon per I-116) |
| billing | Billing | CreditCard | `tab-mgmt-billing` | `<BillingDashboard />` component |

### Hunch Card Anatomy

```
+-----------------------------------------------+
| [Lightbulb] Title        [type] [conf%] [status] |
|   Description text                               |
|   Department: {dept}                             |
|   [Accept] [Dismiss]    (if status == "new")     |
|   [Resolve]             (if status == "accepted")|
+-----------------------------------------------+
```

### Hunch Status Transitions

```
new --> accepted --> resolved
new --> dismissed
```

### Activity Log Entry

```
+-----------------------------------------------+
| [Icon circle] Description text                  |
|              "X minutes ago"  [entityType badge] |
+-----------------------------------------------+
```

Action types: user_created, user_updated, agent_created, agent_updated, agent_deleted, campaign_created, campaign_stopped, campaign_resumed, campaign_updated, organization_updated, document_uploaded.

### RBAC Access Matrix

| Role | canAccessManagement | Page behavior |
|------|---------------------|---------------|
| super_admin | true | Full page access |
| partner_admin | false | Redirected to `/` |
| org_admin | false | Redirected to `/` |
| executive | false | Redirected to `/` |
| sales_manager | false | Redirected to `/` |
| sales | false | Redirected to `/` |
| service | false | Redirected to `/` |
| marketing | false | Redirected to `/` |

### API Endpoints

| Method | Path | Auth | Role Gate | Used By |
|--------|------|------|-----------|---------|
| GET | `/api/hunches` | Token | any auth'd | Hunches tab list |
| PATCH | `/api/hunches/:id` | Token | org match or roleLevel <= 2 | Accept/dismiss/resolve |
| POST | `/api/hunches/generate` | Token | requireRole(3) | Generate button |
| GET | `/api/activity-log` | Token | any auth'd | System Log tab |
| GET | `/api/activity-log?limit=N` | Token | any auth'd | System Log with limit |

---

## Test Cases

### A. Page Load and Tab Navigation

| ID | Name | Priority | Existing/NEW | Steps | Expected Result |
|----|------|----------|-------------|-------|-----------------|
| TC-MGT-001 | Management page loads for super_admin | P0 | Existing (domain-06 6.4, generated-coverage) | 1. Login as superAdmin 2. Navigate to `/management` 3. Wait for page load | Page renders with `data-testid="management-page"`. URL contains `/management`. Title "Management" visible. |
| TC-MGT-002 | All 5 tabs render with correct labels | P0 | Existing (s6-manage S-6.AC1, I-115) | 1. Login as superAdmin 2. Navigate to `/management` 3. Check tab buttons | 5 tabs visible: Insights, Hunches, System Log, User Chats, Billing. data-testid values: `tab-mgmt-insights`, `tab-mgmt-hunches`, `tab-mgmt-activities`, `tab-mgmt-user-chats`, `tab-mgmt-billing`. |
| TC-MGT-003 | Default tab is Insights | P1 | NEW | 1. Login as superAdmin 2. Navigate to `/management` (no query param) | Insights tab is active (has `border-primary` class). Insights content rendered. |
| TC-MGT-004 | Tab switching works for all tabs | P0 | NEW | 1. Login as superAdmin 2. Navigate to `/management` 3. Click each tab in sequence | Each tab activates, shows correct content. Previous tab content hidden. Active tab has visual indicator. |
| TC-MGT-005 | URL ?tab= parameter syncs active tab | P1 | NEW | 1. Login as superAdmin 2. Navigate to `/management?tab=hunches` 3. Verify Hunches tab is active 4. Navigate to `/management?tab=billing` 5. Verify Billing tab is active | Tab selection follows URL parameter. Content matches selected tab. |
| TC-MGT-006 | SubMenu navigation items match page tabs | P1 | Existing (s6-manage I-115) | 1. Read SubMenuManager.tsx source 2. Verify mg-insights, mg-hunches, mg-activities, mg-user-chats, mg-billing IDs exist | All 5 submenu items present. No dashboard or ROI items. |

### B. Hunches Tab

| ID | Name | Priority | Existing/NEW | Steps | Expected Result |
|----|------|----------|-------------|-------|-----------------|
| TC-MGT-010 | Hunches tab renders hunch list | P0 | NEW | 1. Login as superAdmin 2. Navigate to `/management?tab=hunches` 3. Wait for data load | "AI Hunches" heading visible. Description text "Pattern-based insights ranked by confidence" visible. |
| TC-MGT-011 | Generate Hunches button triggers generation | P1 | NEW | 1. Login as superAdmin 2. Navigate to `/management?tab=hunches` 3. Click `data-testid="button-generate-hunches"` 4. Wait for completion | Button shows loading state ("Generating..."). After completion, hunches list refreshes. Toast "Hunches generated" appears. |
| TC-MGT-012 | Hunch card displays all fields | P0 | NEW | 1. Login as superAdmin 2. Ensure hunches exist (generate if needed) 3. Navigate to `/management?tab=hunches` | Each hunch card shows: title, description, type badge, confidence percentage badge, status badge, department (if present). Card has `data-testid="hunch-card-{id}"`. |
| TC-MGT-013 | Accept hunch transitions from new to accepted | P0 | NEW | 1. Login as superAdmin 2. Navigate to `/management?tab=hunches` 3. Find a hunch with status "new" 4. Click Accept button (`data-testid="button-accept-hunch-{id}"`) | Hunch status changes to "accepted". Accept/Dismiss buttons replaced by Resolve button. |
| TC-MGT-014 | Dismiss hunch transitions from new to dismissed | P0 | NEW | 1. Login as superAdmin 2. Navigate to `/management?tab=hunches` 3. Find a hunch with status "new" 4. Click Dismiss button (`data-testid="button-dismiss-hunch-{id}"`) | Hunch status changes to "dismissed". Action buttons removed. |
| TC-MGT-015 | Resolve hunch transitions from accepted to resolved | P0 | NEW | 1. Login as superAdmin 2. Navigate to `/management?tab=hunches` 3. Find a hunch with status "accepted" 4. Click Resolve button (`data-testid="button-resolve-hunch-{id}"`) | Hunch status changes to "resolved". Resolve button removed. |
| TC-MGT-016 | Empty hunches state shows placeholder | P1 | NEW | 1. Login as superAdmin (with org that has no hunches) 2. Navigate to `/management?tab=hunches` | Empty state: Lightbulb icon, text "No hunches yet. Click Generate to create AI insights." |
| TC-MGT-017 | Hunch confidence affects icon color | P2 | NEW | 1. Login as superAdmin 2. Navigate to `/management?tab=hunches` 3. Inspect hunch icons | Confidence >= 85: amber-500. Confidence >= 70: amber-400. Below 70: amber-300. |

### C. Hunches API

| ID | Name | Priority | Existing/NEW | Steps | Expected Result |
|----|------|----------|-------------|-------|-----------------|
| TC-MGT-020 | GET /api/hunches returns org-scoped list | P0 | NEW | 1. Login as superAdmin 2. GET `/api/hunches` with auth header | 200 response. Returns array. All hunches belong to user's org. |
| TC-MGT-021 | GET /api/hunches with status filter | P1 | NEW | 1. Login as superAdmin 2. GET `/api/hunches?status=new` | 200 response. All returned hunches have status "new". |
| TC-MGT-022 | GET /api/hunches with department filter | P1 | NEW | 1. Login as superAdmin 2. GET `/api/hunches?department=sales` | 200 response. All returned hunches have department "sales". |
| TC-MGT-023 | PATCH /api/hunches/:id accepts valid status | P0 | NEW | 1. Login as superAdmin 2. PATCH `/api/hunches/{id}` with `{ "status": "accepted" }` | 200 response. Hunch status updated. `acceptedAt` timestamp set. |
| TC-MGT-024 | PATCH /api/hunches/:id sets resolvedAt on resolve | P1 | NEW | 1. Login as superAdmin 2. PATCH `/api/hunches/{id}` with `{ "status": "resolved" }` | 200 response. Hunch status "resolved". `resolvedAt` timestamp set. |
| TC-MGT-025 | PATCH /api/hunches/:id rejects invalid status | P1 | NEW | 1. Login as superAdmin 2. PATCH `/api/hunches/{id}` with `{ "status": "invalid_value" }` | 400 response. Error message includes "Invalid update data". |
| TC-MGT-026 | PATCH /api/hunches/:id returns 404 for nonexistent | P1 | NEW | 1. Login as superAdmin 2. PATCH `/api/hunches/nonexistent-id` with `{ "status": "accepted" }` | 404 response. Message "Hunch not found". |
| TC-MGT-027 | PATCH /api/hunches/:id denies cross-org access (roleLevel > 2) | P1 | NEW | 1. Login as orgAdmin (roleLevel > 2) 2. PATCH a hunch from a different org | 403 response. Message "Access denied". |
| TC-MGT-028 | POST /api/hunches/generate requires roleLevel <= 3 | P1 | NEW | 1. Login as sales (roleLevel > 3) 2. POST `/api/hunches/generate` | 403 response. Forbidden message. |
| TC-MGT-029 | POST /api/hunches/generate succeeds for super_admin | P0 | NEW | 1. Login as superAdmin 2. POST `/api/hunches/generate` | 200 response. Returns generated hunches array. |
| TC-MGT-030 | GET /api/hunches requires authentication | P1 | NEW | 1. GET `/api/hunches` without auth header | 401 response. |

### D. Activity Log (System Log Tab)

| ID | Name | Priority | Existing/NEW | Steps | Expected Result |
|----|------|----------|-------------|-------|-----------------|
| TC-MGT-040 | System Log tab renders activity entries | P0 | Existing (s6-manage S-6.AC9) | 1. Login as superAdmin 2. Navigate to `/management?tab=activities` | "System Log" heading visible. Activity entries rendered with icon, description, timestamp, entity type badge. |
| TC-MGT-041 | Activity entries have correct test IDs | P1 | NEW | 1. Login as superAdmin 2. Navigate to `/management?tab=activities` 3. Inspect entries | Each entry has `data-testid="activity-item-{id}"`. |
| TC-MGT-042 | Activity log shows relative timestamps | P1 | NEW | 1. Login as superAdmin 2. Navigate to `/management?tab=activities` | Each entry shows "X minutes/hours/days ago" format via date-fns `formatDistanceToNow`. |
| TC-MGT-043 | Activity icons match action type | P2 | NEW | 1. Login as superAdmin 2. Navigate to `/management?tab=activities` 3. Inspect icon colors | user_* actions: blue. agent_* actions: purple. campaign_* actions: green. organization_* actions: amber. document_* actions: gray. |
| TC-MGT-044 | Activity descriptions decode action types | P1 | NEW | 1. Login as superAdmin 2. Check user_created entry | Shows "Created user {name}". Other actions similarly decoded per `getActivityDescription()` mapping. |
| TC-MGT-045 | Empty activity log shows placeholder | P2 | NEW | 1. Login as superAdmin with org with no activity 2. Navigate to `/management?tab=activities` | Empty state: Activity icon, text "No activity recorded yet". |
| TC-MGT-046 | GET /api/activity-log returns entries | P0 | Existing (s6-manage S-6.AC9) | 1. Login as orgAdmin 2. GET `/api/activity-log` with auth | 200 response. Returns array of activity log entries. |
| TC-MGT-047 | GET /api/activity-log respects limit param | P1 | NEW | 1. Login as superAdmin 2. GET `/api/activity-log?limit=5` | 200 response. Returns at most 5 entries. |
| TC-MGT-048 | GET /api/activity-log caps at 100 | P2 | NEW | 1. Login as superAdmin 2. GET `/api/activity-log?limit=500` | 200 response. Returns at most 100 entries (server caps). |
| TC-MGT-049 | GET /api/activity-log requires auth | P1 | NEW | 1. GET `/api/activity-log` without auth | 401 response. |

### E. User Chats Tab (I-116 — Coming Soon)

| ID | Name | Priority | Existing/NEW | Steps | Expected Result |
|----|------|----------|-------------|-------|-----------------|
| TC-MGT-050 | User Chats tab shows placeholder | P0 | Existing (s6-manage I-116) | 1. Login as superAdmin 2. Click User Chats tab | MessageSquare icon, "User Chats" heading, "coming soon" text visible. |
| TC-MGT-051 | User Chats source has TODO comment | P2 | Existing (s6-manage I-116) | 1. Read management.tsx source | Contains "TODO: Implement staff AI conversation viewer with user filter per manifest S-6.AC5/AC6". |
| TC-MGT-052 | User Chats conversations API exists | P1 | Existing (s6-manage S-6.AC5, AC6) | 1. Login as orgAdmin 2. GET `/api/conversations?channel=ai-chat` | 200 response. Returns array of ai-chat conversations. All have chat channel. |

### F. Billing Tab

| ID | Name | Priority | Existing/NEW | Steps | Expected Result |
|----|------|----------|-------------|-------|-----------------|
| TC-MGT-060 | Billing tab renders BillingDashboard | P0 | Existing (s6-manage S-6.AC2) | 1. Login as superAdmin 2. Click Billing tab | `data-testid="billing-tab-content"` present. BillingDashboard component rendered. |
| TC-MGT-061 | Billing has FlexPrice documentation | P2 | Existing (s6-manage I-105) | 1. Read management.tsx source | Contains "FlexPrice integration returns {configured: false}" and "I-105". |

### G. RBAC — Access Control

| ID | Name | Priority | Existing/NEW | Steps | Expected Result |
|----|------|----------|-------------|-------|-----------------|
| TC-MGT-070 | super_admin can access /management | P0 | Existing (domain-06 6.4) | 1. Login as superAdmin 2. Navigate to `/management` | Page loads. No redirect. `data-testid="management-page"` present. |
| TC-MGT-071 | partner_admin denied /management | P0 | NEW | 1. Login as partnerAdmin 2. Navigate to `/management` 3. Wait for redirect | Redirected to `/`. Management page NOT rendered. |
| TC-MGT-072 | org_admin denied /management | P0 | NEW | 1. Login as orgAdmin 2. Navigate to `/management` 3. Wait for redirect | Redirected to `/`. Management page NOT rendered. |
| TC-MGT-073 | executive denied /management | P1 | NEW | 1. Login as executive 2. Navigate to `/management` 3. Wait for redirect | Redirected to `/`. Management page NOT rendered. |
| TC-MGT-074 | sales role denied /management | P1 | NEW | 1. Login as sales 2. Navigate to `/management` 3. Wait for redirect | Redirected to `/`. Management page NOT rendered. |
| TC-MGT-075 | service role denied /management | P1 | NEW | 1. Login as service 2. Navigate to `/management` 3. Wait for redirect | Redirected to `/`. Management page NOT rendered. |
| TC-MGT-076 | marketing role denied /management | P1 | NEW | 1. Login as marketing 2. Navigate to `/management` 3. Wait for redirect | Redirected to `/`. Management page NOT rendered. |
| TC-MGT-077 | canAccessManagement returns true only for super_admin | P0 | NEW | 1. Unit test: call `canAccessManagement()` with each of 8 roles | Only `super_admin` returns true. All others return false. |
| TC-MGT-078 | Management not visible in sidebar for non-super_admin | P1 | NEW | 1. Login as orgAdmin 2. Check sidebar navigation | No "Management" or "Manage" link visible in sidebar for this role. |
| TC-MGT-079 | Unauthenticated user cannot access /management | P0 | NEW | 1. Navigate to `/management` without logging in | Redirected to login page. No management content rendered. |

### H. Insights Tab (Embedded)

| ID | Name | Priority | Existing/NEW | Steps | Expected Result |
|----|------|----------|-------------|-------|-----------------|
| TC-MGT-080 | Insights tab renders embedded InsightsPage | P0 | NEW | 1. Login as superAdmin 2. Navigate to `/management` (default tab = insights) | InsightsPage component renders in embedded mode. Cross-department analytics visible. |

---

## Coverage Summary

| Category | Total | Existing | NEW | P0 | P1 | P2 |
|----------|-------|----------|-----|----|----|-----|
| Page Load & Navigation | 6 | 3 | 3 | 2 | 3 | 1 |
| Hunches Tab (UI) | 8 | 0 | 8 | 4 | 2 | 2 |
| Hunches API | 11 | 0 | 11 | 3 | 7 | 1 |
| Activity Log | 10 | 2 | 8 | 2 | 4 | 4 |
| User Chats (I-116) | 3 | 3 | 0 | 1 | 1 | 1 |
| Billing | 2 | 2 | 0 | 1 | 0 | 1 |
| RBAC | 10 | 1 | 9 | 4 | 4 | 2 |
| Insights (Embedded) | 1 | 0 | 1 | 1 | 0 | 0 |
| **TOTAL** | **51** | **11** | **40** | **18** | **21** | **12** |

---

## Known Issues

| Issue | Description | Impact on Testing |
|-------|-------------|-------------------|
| I-116 | User Chats tab is "coming soon" placeholder | TC-MGT-050/051/052 verify placeholder state only. Full chat viewer tests deferred. |
| I-105 | FlexPrice integration returns `{configured: false}` | Billing tab renders but FlexPrice features non-functional. Documented in TC-MGT-061. |
| generated-coverage uses orgAdmin | `generated-coverage.spec.ts` tests management page load with orgAdmin, which should be redirected by RBAC | May be a false-positive existing test. RBAC redirect should prevent access. |

---

## Test Data Dependencies

| Dependency | Required For | Source |
|------------|-------------|--------|
| super_admin account | All management tests | `testUsers.superAdmin` in auth.ts |
| partner_admin account | TC-MGT-071 | `testUsers.partnerAdmin` in auth.ts |
| org_admin account | TC-MGT-072 | `testUsers.orgAdmin` in auth.ts |
| executive account | TC-MGT-073 | `testUsers.executive` in auth.ts |
| sales account | TC-MGT-074 | `testUsers.sales` in auth.ts |
| service account | TC-MGT-075 | `testUsers.service` in auth.ts |
| marketing account | TC-MGT-076 | `testUsers.marketing` in auth.ts |
| Existing hunches | TC-MGT-012 through 015 | Generate via `/api/hunches/generate` or seed data |
| Activity log entries | TC-MGT-040 through 044 | Created by prior CRUD operations in system |
