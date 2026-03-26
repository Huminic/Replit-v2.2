# Section Audit: Manage
**Sprint:** E-013
**Route:** /management
**Page Component:** client/src/pages/management.tsx (326 lines)
**Sub-menu:** SubMenuManager.tsx (management section)

## What Exists in Code

### Page Structure (management.tsx)
- **5 tabs:** Insights, Hunches, System Log, User Chats, Billing (lines 38-44)
- **NO Dashboard tab** — matches manifest requirement S-6.AC1 (already removed)
- **NO ROI tab** — matches manifest requirement
- **RBAC guard:** canAccessManagement() check (line 62) — redirects non-management roles to home

### Insights Tab (lines 97-99)
- Renders `<InsightsPage embedded />` — same shared Insights component as Sales/Service/Marketing
- No additional management-specific metrics above it (unlike Service which adds metric tiles)
- Manifest says "Insights same as Sales" — this is technically true (same component), but Sales also has VIN lead summary tiles above InsightsPage, which Management does NOT have

### Hunches Tab (lines 101-197)
- **Real feature, fully implemented:**
  - Fetches from /api/hunches
  - Each hunch card: icon (color-coded by confidence), title, description, type badge, confidence % badge, status badge, department label
  - Actions: Accept, Dismiss, Resolve (state machine: new → accepted → resolved, or new → dismissed)
  - Generate Hunches button → POST /api/hunches/generate
  - 5 real hunches confirmed from earlier API check
- This is a working, functional feature

### System Log Tab (lines 226-272)
- Fetches from /api/activity-log
- Each entry: action icon (color-coded by type), description, timestamp, entity type badge
- Action types mapped: user_created, user_updated, agent_created/updated/deleted, campaign_created/stopped/resumed/updated, organization_updated, document_uploaded
- **Real data from API** — not hardcoded

### User Chats Tab (lines 274-284)
- **PLACEHOLDER — "coming soon"**
- Just shows a MessageSquare icon + "User Chats" title + "coming soon" text
- No functionality, no API call, no data
- Manifest says: "needs to show all staff chats from org with filter"
- **This is a gap that needs implementing**

### Billing Tab (lines 287-291)
- Renders `<BillingDashboard />` component
- We know from earlier verification: billing endpoints return `{configured: false}`
- Billing tab exists on this page — matches manifest requirement S-6.AC2 (moved here from Profile)
- **FlexPrice needs wiring for this to show real data (I-105)**

### Sub-menu Panel
- Nav items: **Dashboard** (links to `/management`), Insights, System Log, User Chats
- **MISMATCH: Sub-menu has "Dashboard" but page has NO Dashboard tab.** Default tab is Insights. Sub-menu "Dashboard" link goes to `/management` which loads Insights. Same phantom-Dashboard issue as Service.
- **Missing from sub-menu: Hunches and Billing** — these tabs exist on the page but aren't in the sub-menu navigation
- No agent list in sub-menu (correct — Management doesn't have a department agent concept)

## Manifest vs Code

| Manifest Item | Code Status | Gap? |
|---|---|---|
| Remove Dashboard | YES — no Dashboard tab in page | No gap in page. Sub-menu still says "Dashboard" |
| Move Billing here for user | YES — Billing tab exists, renders BillingDashboard | No gap (but FlexPrice not wired — I-105) |
| Insights same as sales | PARTIAL — same InsightsPage component, but Sales also has VIN lead tiles above it | May need sales-like tiles added |
| ROI needs removed | YES — no ROI tab | No gap |
| User chats needs to show all staff chats with filter | PLACEHOLDER — "coming soon" | **Gap — needs implementing** |
| Dashboard needs to show data | N/A — Dashboard removed per manifest | Manifest contradicts itself? Says "Remove Dashboard" then "Dashboard needs to show data" |
| System Log | YES — fully implemented with real API data | No gap |

## Findings

1. **User Chats is a placeholder** — "coming soon" with no functionality. Manifest says it should show all staff chats from org with user filter. This needs building.
2. **Sub-menu says "Dashboard" but page default is Insights** — phantom Dashboard label again.
3. **Sub-menu missing Hunches and Billing** — these page tabs have no sub-menu nav item.
4. **Manifest contradiction:** Says "Remove Dashboard" but also says "Dashboard needs to show data." Need operator clarification on what data the management overview should show, if not in a Dashboard tab.
5. **Billing exists but FlexPrice not wired** — tab renders BillingDashboard, which shows "Billing Not Configured" (I-105).
6. **Hunches is a well-built feature** — AI-generated insights with accept/dismiss/resolve workflow, confidence scoring, department tagging. 5 real hunches from API. This works.

## Existing ACs

| AC | Coverage | Status |
|---|---|---|
| S-6.AC1 | No Dashboard/ROI tab | PASS — code confirms |
| S-6.AC2 | Billing tab present | PASS — renders BillingDashboard |
| S-6.AC3 | Billing NOT in Profile page | Need to verify Profile page |
| S-6.AC4 | Insights tab with real data | PARTIAL — InsightsPage renders but no management-specific tiles |
| S-6.AC5 | User Chats lists staff conversations | FAIL — placeholder "coming soon" |
| S-6.AC6 | User Chats filter by user | FAIL — no functionality exists |
| S-6.AC7 | Partner admin sees all 5 dealerships | Need to verify with partner admin login |
| S-6.AC8 | Partner admin doesn't see Huminic data | Need to verify |
| S-6.AC9 | System Log shows real activity | PASS — real API data |

## New ACs Needed

| Proposed AC | Priority | Dimension |
|---|---|---|
| User Chats tab shows real staff AI conversations from org (not placeholder) | T2 | FE/BE |
| User Chats filter by user works | T2 | FE |
| Sub-menu matches page tabs (remove phantom Dashboard, add Hunches and Billing) | T3 | FE |
| Hunches generate button produces new insights | T2 | FE/BE |
| Hunches accept/dismiss/resolve state machine works | T2 | FE/BE |
| Billing tab shows real FlexPrice data when configured | T1 | FE/BE |
| Management page RBAC: non-management roles redirected to home | T1 | AU |

## Section Description (DRAFT — for operator edit)

**Manage is the leadership and operations hub.** 5 tabs: Insights (embedded analytics — same InsightsPage component shared across departments), Hunches (AI-generated business insights with confidence scoring and accept/dismiss/resolve workflow — fully functional with real data), System Log (audit trail of all user/agent/campaign/org actions from the activity_log API), User Chats (currently placeholder "coming soon" — should show all staff AI conversations from the org with user filter per manifest), and Billing (BillingDashboard component — exists but FlexPrice integration returns "not configured").

The page has RBAC guarding via canAccessManagement() — non-management roles (sales, service, marketing at level 5) get redirected to home.

**Issues found:** User Chats is a placeholder, not implemented. Sub-menu shows "Dashboard" but page has no Dashboard tab (default is Insights). Sub-menu is missing Hunches and Billing items. Billing needs FlexPrice wiring (I-105). Manifest says both "Remove Dashboard" and "Dashboard needs to show data" — needs operator clarification on what management overview data should display.
