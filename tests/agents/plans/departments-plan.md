# Department Switching Test Plan (T-003)

Generated: 2026-03-31
Source: Code analysis of sales.tsx, service.tsx, marketing.tsx, Sidebar.tsx, rbac.ts, App.tsx, domain-06-departments.spec.ts, helpers/auth.ts

---

## 1. RBAC Department Access Matrix

Source: `client/src/lib/rbac.ts` — `defaultSectionsByRole`

| Role           | Sales | Service | Marketing | Management | AI Chat | TeamBox |
|----------------|-------|---------|-----------|------------|---------|---------|
| super_admin    | YES   | YES     | YES       | YES        | YES     | YES     |
| partner_admin  | YES   | YES     | YES       | NO         | YES     | YES     |
| org_admin      | YES   | YES     | YES       | NO         | YES     | YES     |
| executive      | YES   | YES     | YES       | YES*       | YES     | YES     |
| sales_manager  | YES   | NO      | NO        | NO         | YES     | YES     |
| sales          | YES   | NO      | NO        | NO         | YES     | YES     |
| service        | NO    | YES     | NO        | NO         | YES     | YES     |
| marketing      | NO    | NO      | YES       | NO         | YES     | YES     |

*Note: `canAccessManagement()` returns true only for super_admin, but `defaultSectionsByRole` grants executive access to 'management'. Sidebar uses `canAccessSection()` which checks `defaultSectionsByRole`, so executive DOES see Management in the sidebar.

Custom permissions: `canAccessSection()` checks `userPermissions` array first (if non-empty), falling back to `defaultSectionsByRole`. This means per-user overrides can grant or restrict department access beyond role defaults.

---

## 2. Department Page Inventory

### 2.1 Sales Page (`/sales` — client/src/pages/sales.tsx)

| Element | Type | Selector | Behavior |
|---------|------|----------|----------|
| Page container | div | `[data-testid="sales-page"]` (inferred) | Top-level wrapper |
| Page heading | h1 | text "Sales" | Static title |
| Dashboard tab | button | `[data-testid="tab-sales-dashboard"]` | Shows metric tiles, top agents, activity feed |
| Agents tab | button | `[data-testid="tab-sales-agents"]` | Shows agent cards for sales department |
| Insights tab | button | `[data-testid="tab-sales-insights"]` | Embedded InsightsPage |
| Calendar tab | button | `[data-testid="tab-sales-calendar"]` | AppointmentCalendar component |
| Metric tiles | cards | `[data-testid^="metric-tile-"]` | Pipeline metrics, clickable for detail dialog |
| Agent cards | cards | `[data-testid^="agent-card-"]` | Sales agents, click to open config pane |

Data queries:
- `/api/agents?department=sales` (agents scoped to sales)
- `/api/vin/leads/summary` (lead pipeline data)
- `/api/metrics/dashboard` (shared dashboard metrics)
- `/api/activity-log?limit=10` (recent activity)
- `/api/metrics/pipeline/details?metric=...` (drill-down)

### 2.2 Service Page (`/service` — client/src/pages/service.tsx)

| Element | Type | Selector | Behavior |
|---------|------|----------|----------|
| Page heading | h1 | text "Service" | Static title |
| Campaigns tab (default) | button | `[data-testid="tab-service-campaigns"]` | Campaign table with kill switch toggles |
| Agents tab | button | `[data-testid="tab-service-agents"]` | Agent cards for service department |
| Insights tab | button | `[data-testid="tab-service-insights"]` | Service KPI tiles + embedded InsightsPage |
| Calendar tab | button | `[data-testid="tab-service-calendar"]` | AppointmentCalendar |
| Campaign rows | table rows | campaign list items | Click opens campaign detail dialog |
| Kill switch toggle | switch | per-campaign toggle | Stops outbound messages immediately |
| New Campaign button | button | "New Campaign" | Opens campaign creation flow |
| Upload CSV button | button | "Upload CSV" | CSV import for campaign recipients |
| Communications Paused badge | badge | conditional | Shown when global comm gate is OFF |

Data queries:
- `/api/agents?department=service` (agents scoped to service)
- `/api/campaigns?department=service` (campaigns scoped to service)
- `/api/metrics/dashboard` (shared dashboard metrics)
- `/api/campaigns/execution-statuses` (campaign run states)

### 2.3 Marketing Page (`/marketing` — client/src/pages/marketing.tsx)

| Element | Type | Selector | Behavior |
|---------|------|----------|----------|
| Page container | div | `[data-testid="marketing-page"]` | Top-level wrapper |
| Page heading | h1 | text "Marketing" | Static title |
| Dashboard tab | button | `[data-testid="tab-marketing-dashboard"]` | Marketing KPI tiles (campaign perf, active, sent, replies) |
| Agents tab | button | `[data-testid="tab-marketing-agents"]` | 5 marketing agent launcher cards |
| Studio tab | button | `[data-testid="tab-marketing-studio"]` | Creative studio with filter pills + gallery |
| Insights tab | button | `[data-testid="tab-marketing-insights"]` | Embedded InsightsPage |
| Metric tiles | cards | `[data-testid^="metric-tile-"]` | Marketing KPI tiles, clickable for detail dialog |
| Agent cards | cards | `[data-testid^="agent-card-"]` | Marketing agents (MARKETING_AGENTS array) |
| Studio filter pills | buttons | `[data-testid^="studio-filter-"]` | All, Images, Videos, Copy, Scores, Voiceovers, Radar |
| Metric detail dialog | dialog | `[data-testid="dialog-metric-detail"]` | Shows breakdown of selected metric |
| Agent chat view | view | AgentChatView component | Opens when agent card clicked, has back button |

Data queries:
- `/api/metrics/dashboard` (shared dashboard metrics, filtered to marketing department)
- Marketing agents are client-side defined (MARKETING_AGENTS constant)

### 2.4 Sidebar Navigation (`client/src/components/layout/Sidebar.tsx`)

| Element | Type | Selector | Behavior |
|---------|------|----------|----------|
| Sales nav item | button | `[data-testid="sidebar-item-sales"]` | Navigates to /sales, opens flyout. RBAC filtered |
| Service nav item | button | `[data-testid="sidebar-item-service"]` | Navigates to /service, opens flyout. RBAC filtered |
| Marketing nav item | button | `[data-testid="sidebar-item-marketing"]` | Navigates to /marketing, opens flyout. RBAC filtered |
| Management nav item | button | `[data-testid="sidebar-item-management"]` | Navigates to /management, opens flyout. RBAC filtered |
| Active indicator | visual | purple left border + icon tint | Shows which department is currently active |
| Sub-menu flyout | panel | SubMenuManager | Appears on hover (1200ms close delay), shows agents below separator |
| Pin toggle | button | `[data-testid="button-toggle-submenu"]` | Locks flyout panel open |

---

## 3. URL Routing

Source: `client/src/App.tsx` — wouter `<Route>` declarations

| Route | Component | Protected | Notes |
|-------|-----------|-----------|-------|
| `/sales` | SalesPage | Yes (ProtectedRoute) | RBAC: canAccessSection(role, 'sales') |
| `/service` | ServicePage | Yes (ProtectedRoute) | RBAC: canAccessSection(role, 'service') |
| `/marketing` | MarketingPage | Yes (ProtectedRoute) | RBAC: canAccessSection(role, 'marketing') |
| `/management` | ManagementPage | Yes (ProtectedRoute) | RBAC: canAccessSection(role, 'management') |

Tab state is managed via URL query params (e.g., `?tab=agents`) on marketing page. Sales and service pages use local useState for tab.

---

## 4. Test Cases

### 4.1 Sidebar Navigation Between Departments

| ID | Name | Priority | Steps | Expected Result | Coverage |
|----|------|----------|-------|-----------------|----------|
| TC-DEPT-001 | Navigate Sales to Service via sidebar | P1 | 1. Login as org_admin. 2. Navigate to /sales. 3. Click sidebar-item-service. | URL changes to /service. Service page heading visible. Sales content gone. Active indicator moves to Service. | NEW |
| TC-DEPT-002 | Navigate Service to Marketing via sidebar | P1 | 1. Login as org_admin. 2. Navigate to /service. 3. Click sidebar-item-marketing. | URL changes to /marketing. Marketing page heading visible. Service content gone. | NEW |
| TC-DEPT-003 | Navigate Marketing to Sales via sidebar | P1 | 1. Login as org_admin. 2. Navigate to /marketing. 3. Click sidebar-item-sales. | URL changes to /sales. Sales page heading visible. | NEW |
| TC-DEPT-004 | Rapid sequential department switching | P2 | 1. Login as super_admin. 2. Click Sales, then immediately Service, then Marketing in quick succession (< 500ms between clicks). | Final URL is /marketing. Marketing page renders without errors. No stale content from Sales or Service. | NEW |
| TC-DEPT-005 | Active indicator follows department switch | P2 | 1. Login as org_admin. 2. Navigate to /sales. Verify active indicator on Sales. 3. Click Service. Verify active indicator moves. 4. Click Marketing. Verify again. | Purple left border and icon tint always reflect current department. Only one item active at a time. | NEW |

### 4.2 Role-Based Department Access (RBAC)

| ID | Name | Priority | Steps | Expected Result | Coverage |
|----|------|----------|-------|-----------------|----------|
| TC-DEPT-010 | Sales role sees only Sales in sidebar departments | P1 | 1. Login as sales user. 2. Inspect sidebar for department items. | Sales item visible. Service and Marketing items NOT rendered. Management NOT rendered. | EXISTING (6.6 partial — checks no Billing; does not check Service/Marketing absence) |
| TC-DEPT-011 | Service role sees only Service in sidebar departments | P1 | 1. Login as service user. 2. Inspect sidebar for department items. | Service item visible. Sales and Marketing items NOT rendered. | NEW |
| TC-DEPT-012 | Marketing role sees only Marketing in sidebar departments | P1 | 1. Login as marketing user. 2. Inspect sidebar for department items. | Marketing item visible. Sales and Service items NOT rendered. | NEW |
| TC-DEPT-013 | Org admin sees all three departments | P1 | 1. Login as org_admin. 2. Inspect sidebar for department items. | Sales, Service, Marketing all visible. Management NOT visible. | NEW |
| TC-DEPT-014 | Super admin sees all departments + Management | P1 | 1. Login as super_admin. 2. Inspect sidebar for department items. | Sales, Service, Marketing, Management all visible. | NEW |
| TC-DEPT-015 | Executive sees all departments + Management | P2 | 1. Login as executive user. 2. Inspect sidebar. | Sales, Service, Marketing, Management all visible (per defaultSectionsByRole). | NEW |
| TC-DEPT-016 | Sales role direct URL to /service redirects or blocks | P1 | 1. Login as sales user. 2. Navigate directly to /service via URL. | Either redirected away or access denied. Service page content NOT rendered. | NEW |
| TC-DEPT-017 | Service role direct URL to /sales redirects or blocks | P1 | 1. Login as service user. 2. Navigate directly to /sales via URL. | Either redirected away or access denied. Sales page content NOT rendered. | NEW |
| TC-DEPT-018 | Marketing role direct URL to /management redirects or blocks | P1 | 1. Login as marketing user. 2. Navigate directly to /management via URL. | Either redirected away or access denied. Management page content NOT rendered. | NEW |
| TC-DEPT-019 | Sales manager sees Sales but not Service/Marketing | P2 | 1. Login as sales_manager. 2. Inspect sidebar. | Sales visible. Service, Marketing, Management NOT visible. | NEW |

### 4.3 Data Refresh on Department Switch

| ID | Name | Priority | Steps | Expected Result | Coverage |
|----|------|----------|-------|-----------------|----------|
| TC-DEPT-020 | Sales metrics load on navigation to Sales | P1 | 1. Login as org_admin. 2. Navigate to /sales. 3. Wait for page load. | Metric tiles render with numeric values (not loading skeletons). Pipeline metrics visible. API call to /api/metrics/pipeline fires. | EXISTING (6.1 — checks KPI tiles exist) |
| TC-DEPT-021 | Service campaigns load on navigation to Service | P1 | 1. Login as org_admin. 2. Navigate to /service. 3. Wait for page load. | Campaigns tab is default. Campaign table or empty state renders. API call to /api/campaigns?department=service fires. | EXISTING (6.2 — checks KPI tiles, not campaigns specifically) |
| TC-DEPT-022 | Marketing metrics load on navigation to Marketing | P1 | 1. Login as org_admin. 2. Navigate to /marketing. 3. Wait for page load. | Dashboard tab shows 4 metric tiles (Campaign Performance, Campaigns Active, Messages Sent, Replies Received). | EXISTING (6.3 — checks KPI tiles exist) |
| TC-DEPT-023 | Agent list changes between departments | P1 | 1. Login as org_admin. 2. Navigate to /sales, click Agents tab, note agent names. 3. Navigate to /service, click Agents tab. | Service agents list differs from Sales agents list. API queries are department-scoped (?department=sales vs ?department=service). | NEW |
| TC-DEPT-024 | Switching from Service to Sales triggers fresh data fetch | P2 | 1. Login as org_admin. 2. Navigate to /service, wait for load. 3. Click sidebar Sales. | Sales page makes its own API calls (/api/metrics/pipeline, /api/agents?department=sales, /api/vin/leads/summary). No stale service data shown. | NEW |
| TC-DEPT-025 | Marketing metrics use department-filtered data | P2 | 1. Login as org_admin. 2. Navigate to /marketing dashboard tab. | Metric tiles show marketing-specific values from campaignStats.byDepartment.marketing (not global totals). | NEW |
| TC-DEPT-026 | Tab state resets on department switch | P2 | 1. Login as org_admin. 2. Navigate to /sales, click Agents tab. 3. Navigate to /service via sidebar. | Service page loads on its default tab (Campaigns), not Agents. Tab state is per-page, not shared. | NEW |

### 4.4 URL Routing Correctness

| ID | Name | Priority | Steps | Expected Result | Coverage |
|----|------|----------|-------|-----------------|----------|
| TC-DEPT-030 | Direct URL /sales loads Sales page | P1 | 1. Login as org_admin. 2. Navigate directly to /sales. | Sales page renders. URL is /sales. | EXISTING (6.1) |
| TC-DEPT-031 | Direct URL /service loads Service page | P1 | 1. Login as org_admin. 2. Navigate directly to /service. | Service page renders. URL is /service. | EXISTING (6.2) |
| TC-DEPT-032 | Direct URL /marketing loads Marketing page | P1 | 1. Login as org_admin. 2. Navigate directly to /marketing. | Marketing page renders. URL is /marketing. | EXISTING (6.3) |
| TC-DEPT-033 | Marketing tab query param preserved in URL | P2 | 1. Login as org_admin. 2. Navigate to /marketing?tab=agents. | Marketing page opens directly to Agents tab. | NEW |
| TC-DEPT-034 | Marketing agent query param opens agent chat | P2 | 1. Login as org_admin. 2. Navigate to /marketing?agent={validAgentId}. | Marketing page opens AgentChatView for that agent. Back button returns to agents list. | NEW |
| TC-DEPT-035 | Invalid department URL shows not-found | P2 | 1. Login as org_admin. 2. Navigate to /finance (non-existent). | 404 / not-found page renders. No crash. | NEW |

### 4.5 Cross-Department Data Isolation

| ID | Name | Priority | Steps | Expected Result | Coverage |
|----|------|----------|-------|-----------------|----------|
| TC-DEPT-040 | Sales agents do not appear on Service page | P1 | 1. Login as org_admin. 2. Navigate to /sales, Agents tab, note agent names. 3. Navigate to /service, Agents tab. | No sales-department agents appear in service agent list. API queries use department filter. | NEW |
| TC-DEPT-041 | Service campaigns do not appear on Marketing | P1 | 1. Login as org_admin. 2. Navigate to /service, note campaign names. 3. Navigate to /marketing. | No service campaigns visible on marketing dashboard or any marketing tab. | NEW |
| TC-DEPT-042 | Marketing studio content not accessible from Sales | P2 | 1. Login as org_admin. 2. Navigate to /sales. | No Studio tab or studio filter pills visible on Sales page. Sales has Dashboard/Agents/Insights/Calendar tabs only. | NEW |
| TC-DEPT-043 | Each department fetches its own scoped metrics | P2 | 1. Login as org_admin. 2. Navigate to /marketing, note Campaign Performance value. 3. Navigate to /service insights tab. | Marketing shows campaignStats.byDepartment.marketing. Service shows campaignStats.byDepartment.service (if displayed). Values may differ. | NEW |

### 4.6 Back Button / History Behavior

| ID | Name | Priority | Steps | Expected Result | Coverage |
|----|------|----------|-------|-----------------|----------|
| TC-DEPT-050 | Browser back from Service returns to Sales | P1 | 1. Login as org_admin. 2. Navigate to /sales. 3. Click sidebar Service. 4. Press browser Back button. | URL returns to /sales. Sales page renders correctly. | NEW |
| TC-DEPT-051 | Browser back from Marketing returns to Service | P1 | 1. Login as org_admin. 2. Navigate to /service. 3. Click sidebar Marketing. 4. Press browser Back. | URL returns to /service. Service page renders. | NEW |
| TC-DEPT-052 | Forward button after back restores department | P2 | 1. Login as org_admin. 2. Navigate /sales -> /service -> Back -> Forward. | URL returns to /service. Service page renders correctly. | NEW |
| TC-DEPT-053 | Back from marketing agent chat view returns to agents | P2 | 1. Login as org_admin. 2. Navigate to /marketing, Agents tab. 3. Click an agent card (opens AgentChatView). 4. Click the onBack arrow. | Returns to marketing agents list. Does NOT navigate to previous department. | NEW |
| TC-DEPT-054 | History entries accumulate correctly across departments | P3 | 1. Login as org_admin. 2. Navigate: /sales -> /service -> /marketing. 3. Press Back twice. | First Back: /service. Second Back: /sales. Each page renders correctly without errors. | NEW |

### 4.7 Sub-Menu Flyout Behavior

| ID | Name | Priority | Steps | Expected Result | Coverage |
|----|------|----------|-------|-----------------|----------|
| TC-DEPT-060 | Sales flyout shows at least 3 agents | P2 | 1. Login as sales user. 2. Navigate to /sales. 3. Hover sidebar-item-sales. 4. Wait 1s. | SubMenuManager flyout appears. At least 3 agent items with data-testid="panel-agent-*" visible. | EXISTING (6.7) |
| TC-DEPT-061 | Service flyout shows at least 1 agent | P2 | 1. Login as service user. 2. Navigate to /service. 3. Hover sidebar-item-service. | SubMenuManager flyout appears with at least 1 agent item. | EXISTING (6.8) |
| TC-DEPT-062 | Flyout closes after 2000ms mouseLeave | P3 | 1. Login as org_admin. 2. Hover sidebar-item-sales to open flyout. 3. Move mouse away from sidebar and flyout. 4. Wait 2s. | Flyout panel closes after ~2000ms delay. | NEW |
| TC-DEPT-063 | Pinned flyout persists across hover changes | P3 | 1. Login as org_admin. 2. Hover sidebar-item-sales. 3. Click pin toggle button. 4. Move mouse to sidebar-item-service and back. | Sales flyout remains visible (pinned). Hovering other items does NOT change active panel when pinned. | NEW |

---

## 5. Coverage Summary

### Existing Coverage (domain-06-departments.spec.ts)

| Test ID | Existing Test | What It Covers | Gaps |
|---------|---------------|----------------|------|
| 6.1 | Sales page loads with KPIs | URL contains "sales", KPI tile/card elements exist | No tab navigation, no metric values, no agent list |
| 6.2 | Service page loads with KPIs | URL contains "service", KPI tile/card elements exist | No campaign table check, no tab navigation |
| 6.3 | Marketing page loads with KPIs | URL contains "marketing", KPI tile/card elements exist | No specific metric tile IDs, no agents/studio tabs |
| 6.4 | Management page loads | URL contains "management", overview elements exist | Not department-switching related |
| 6.5 | Demand Score on Management | Demand Score tile present | Not department-switching related |
| 6.6 | Sales sidebar no Billing | No Billing link in sidebar for sales role | Only checks one absence; does not verify Service/Marketing absence |
| 6.7 | Sales submenu 3+ agents | Flyout agents on hover | Good coverage for flyout behavior |
| 6.8 | Service submenu 1+ agent | Flyout agents on hover | Good coverage for flyout behavior |

### New Coverage Required

| Category | New Test Cases | Priority Breakdown |
|----------|---------------|-------------------|
| Sidebar navigation between departments | TC-DEPT-001 to TC-DEPT-005 | 3x P1, 2x P2 |
| Role-based access (RBAC) | TC-DEPT-010 to TC-DEPT-019 | 6x P1, 4x P2 |
| Data refresh on switch | TC-DEPT-020 to TC-DEPT-026 | 3x P1 (existing partial), 4x P2 |
| URL routing | TC-DEPT-030 to TC-DEPT-035 | 3x P1 (existing), 3x P2 |
| Cross-department data isolation | TC-DEPT-040 to TC-DEPT-043 | 2x P1, 2x P2 |
| Back button / history | TC-DEPT-050 to TC-DEPT-054 | 2x P1, 2x P2, 1x P3 |
| Sub-menu flyout | TC-DEPT-060 to TC-DEPT-063 | 2x P2 (existing), 2x P3 |

**Total: 39 test cases (14 P1, 15 P2, 4 P3, 6 with partial existing coverage)**

---

## 6. Test User Mapping

| Test Role | Auth Helper Key | Email | Notes |
|-----------|----------------|-------|-------|
| super_admin | testUsers.superAdmin | duane.wells@huminic.ai | All departments + management |
| org_admin | testUsers.orgAdmin | serra_honda@huminic.ai | All three departments, no management |
| executive | testUsers.executive | executive_staff@huminic.ai | All departments + management |
| sales | testUsers.sales | sales_staff@huminic.ai | Sales only |
| service | testUsers.service | service_staff@huminic.ai | Service only |
| marketing | testUsers.marketing | marketing_staff@huminic.ai | Marketing only |
| partner_admin | testUsers.partnerAdmin | duanekwells@gmail.com | All three departments, no management |

Note: No `sales_manager` test account exists in `testUsers`. TC-DEPT-019 requires either a seeded sales_manager account or skipping.

---

## 7. Key Risks and Notes

1. **No route-level RBAC guard observed**: Sidebar hides items via `canAccessSection()`, but it is unclear whether `ProtectedRoute` or the page components themselves enforce access when navigating directly via URL. TC-DEPT-016/017/018 will reveal whether this is enforced or a gap.

2. **Shared metrics endpoint**: Sales, Service, and Marketing all query `/api/metrics/dashboard` with the same orgId key. Department filtering happens client-side (e.g., `campaignStats.byDepartment.marketing`). This means all department data travels over the wire to every department page — not a test concern, but a data isolation observation.

3. **Tab state asymmetry**: Marketing reads tab from URL query params (`?tab=`). Sales and Service use local `useState`. This means marketing tab state survives page refresh; sales/service tab state does not.

4. **Agent data sources differ**: Sales and Service fetch agents from API (`/api/agents?department=X`). Marketing uses a hardcoded `MARKETING_AGENTS` client-side constant. This affects data isolation tests — marketing agents are not API-fetched.

5. **No sales_manager test user**: The `testUsers` object in auth.ts does not include a `sales_manager` account. Tests requiring this role need a new seeded user or must be deferred.
