# Test Plan: Billing Domain (T-004 -- Exhaustive)

**Domain:** Billing (`/settings/billing`, `/settings/billing/plan`, `/settings/billing/usage`, `/settings/billing/invoices`)
**Sprint:** T-004
**Created by:** Planner Agent (T-004)
**Status:** Active

---

## Source Inventory

| Source | Path | Key Findings |
|--------|------|--------------|
| Existing E2E tests | `tests/e2e/domain-08-billing.spec.ts` | 5 tests (8.1-8.5): page load, FlexPrice content check, super admin sees billing, partner/org admin see billing, restricted roles blocked |
| BillingDashboard | `client/src/pages/BillingDashboard.tsx` | Summary card (plan + balance), usage overview grid, top-up wallet dialog, navigation links to sub-pages, loading skeleton, not-configured state |
| BillingPlan | `client/src/pages/BillingPlan.tsx` | Current plan details, boolean features, metered allocations, plan comparison grid, not-configured state, no-plan state |
| BillingUsage | `client/src/pages/BillingUsage.tsx` | Usage detail cards with progress bars, billing period display, aggregation badges, error state, not-configured state, empty state |
| BillingInvoices | `client/src/pages/BillingInvoices.tsx` | Invoice table (date, amount, status, ID), status badges (paid/pending/overdue), empty state, not-configured state |
| EntitlementGate | `client/src/components/EntitlementGate.tsx` | Feature gating component, renders children if allowed or UpgradeCTA if blocked, degrades gracefully when billing unconfigured |
| CreditBalanceIndicator | `client/src/components/CreditBalanceIndicator.tsx` | Sidebar credit dot (green/yellow/red thresholds), click navigates to billing, hidden when not configured |
| Server billing routes | `server/routes/billing.ts` | 8 endpoints: summary, usage, invoices, plan, plans, entitlements, entitlement check (POST), topup. All require `requireRole(3)` (org_admin+). All guard on `billingCustomerId`. |
| Server usage routes | `server/routes/usage.ts` | `/api/usage`, `/api/usage/summary`, `/api/billing/usage` (duplicate with period param) |
| BillingService | `server/services/billingService.ts` | FlexPrice integration. 7 meters. Entitlement cache (5 min). Plan cache (1 hr). Wallet balance. Invoices. Fail-open on unreachable. |
| RBAC | `client/src/lib/rbac.ts` | `canAccessSystem()` gates billing: super_admin, partner_admin, org_admin only. Other roles redirected to `/`. |
| Auth helper | `tests/e2e/helpers/auth.ts` | testUsers: superAdmin, partnerAdmin, orgAdmin, executive, sales, service, marketing + dealer-specific org admins |

---

## Known Issues and Limitations

| Issue | Description | Impact on Testing |
|-------|-------------|-------------------|
| **I-105** | FlexPrice returns `{configured: false}` because no `billingCustomerId` is stored per organization in dev | All billing pages show "Billing Not Configured" state. Usage meters, invoices, plan details, entitlements, and wallet balance cannot be tested with live data. |
| **I-171** | 26 billing UI states identified with no functional test coverage | This plan addresses all 26 states systematically. |
| **No upgrade/downgrade API** | BillingPlan page is read-only. No POST endpoint for plan changes exists. | Upgrade/downgrade flow tests are limited to UI display verification (plan comparison grid, upgrade CTA). |
| **Wallet top-up** | POST `/api/billing/topup` exists but requires `billingWalletId` on org (not configured in dev). | Top-up dialog interaction testable, but mutation will fail with "No wallet configured". |

---

## Billing Anatomy

### Route Structure

```
/settings/billing           -> BillingDashboard (summary, balance, usage overview)
/settings/billing/plan      -> BillingPlan (current plan, features, plan comparison)
/settings/billing/usage     -> BillingUsage (detailed usage meters with progress bars)
/settings/billing/invoices  -> BillingInvoices (invoice table)
```

### API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/billing/summary` | GET | requireRole(3) | Plan name, tier, credit balance, usage overview |
| `/api/billing/usage` | GET | requireRole(3) | Usage meters for current billing period |
| `/api/billing/invoices` | GET | requireRole(3) | Invoice list for org's billingCustomerId |
| `/api/billing/plan` | GET | requireRole(3) | Current plan details + entitlements |
| `/api/billing/plans` | GET | requireRole(3) | All published plans (for comparison) |
| `/api/billing/entitlements` | GET | requireRole(3) | All entitlements for org (17 feature keys) |
| `/api/entitlements/check` | POST | requireRole(3) | Single feature entitlement check |
| `/api/billing/topup` | POST | requireRole(3) | Wallet top-up (requires billingWalletId) |

### FlexPrice Meters (7 total)

| Meter ID | Name | Aggregation | Unit |
|----------|------|-------------|------|
| voice_minute | Voice Minutes | SUM | min |
| video_minute | Video Minutes | SUM | min |
| sms_sent | SMS Sent | COUNT | msgs |
| llm_input_tokens | LLM Input Tokens | SUM | tokens |
| llm_output_tokens | LLM Output Tokens | SUM | tokens |
| image_generated | Images Generated | COUNT | images |
| video_generated | Video Generated | SUM | sec |

### Entitlement Feature Keys (17 total)

7 meter-based keys + 10 slot/feature keys: agent_slots, widget_slots, module_slots, landing_page_slots, voice_number_slots, sms_number_slots, location_slots, trigger_slots, campaign_slots, custom_avatar_slots, consulting_hours, crm_integration, advanced_analytics, crm_guru, generative_studio, competitive_intel.

### UI States Matrix (26 states from I-171)

| # | Page | State | data-testid / Indicator |
|---|------|-------|------------------------|
| 1 | Dashboard | Loading (skeleton) | Skeleton elements |
| 2 | Dashboard | Not configured | `text-billing-not-configured` |
| 3 | Dashboard | Configured (full data) | `text-billing-title`, `card-credit-balance`, `card-current-plan` |
| 4 | Dashboard | No plan (configured but plan=null) | `text-plan-name` shows "None" |
| 5 | Dashboard | Balance > $50 (green) | Green border/text on balance card |
| 6 | Dashboard | Balance $20-$50 (yellow) | Yellow border/text on balance card |
| 7 | Dashboard | Balance < $20 (red) | Red border/text on balance card |
| 8 | Dashboard | Usage meters with limits | Progress bars visible via `bar-usage-*` |
| 9 | Dashboard | Usage meters without limits | No progress bars, value + unit only |
| 10 | Dashboard | Top-up dialog open | `input-topup-amount` visible |
| 11 | Dashboard | Top-up validation (invalid amount) | Toast with "Invalid amount" |
| 12 | Dashboard | Top-up success | Toast with "Wallet topped up" |
| 13 | Dashboard | Top-up failure (no wallet) | Toast with error |
| 14 | Plan | Loading (skeleton) | Skeleton elements |
| 15 | Plan | Not configured | `text-billing-not-configured` |
| 16 | Plan | Current plan with features | `text-current-plan-name`, `feature-*`, `metered-*` |
| 17 | Plan | No active plan | `text-no-plan` |
| 18 | Plan | Plan comparison grid | `plan-comparison-grid`, `plan-card-*` |
| 19 | Plan | Current plan highlighted | Border-primary on current plan card, `badge-current-*` |
| 20 | Usage | Loading (skeleton) | Skeleton elements |
| 21 | Usage | Not configured | `text-billing-not-configured` |
| 22 | Usage | Error state | `text-billing-error` |
| 23 | Usage | Usage detail cards | `card-usage-detail-*` |
| 24 | Usage | No usage data | `text-no-usage` |
| 25 | Invoices | Not configured | `text-billing-not-configured` |
| 26 | Invoices | Empty invoice list | `text-no-invoices` |
| 27 | Invoices | Invoice table with rows | `invoice-table`, `invoice-row-*` |

---

## Test Cases

### Section A: Page Load and Navigation (Priority: HIGH)

#### TC-BILL-001: Billing dashboard loads without crash
- **Status:** EXISTS (test 8.1)
- **Priority:** P0
- **Steps:**
  1. Login as superAdmin
  2. Navigate to `/settings/billing`
  3. Wait for page to render
- **Expected:** Page loads without console errors. Either "Billing Not Configured" or billing content is visible.

#### TC-BILL-002: FlexPrice content detection
- **Status:** EXISTS (test 8.2)
- **Priority:** P0
- **Steps:**
  1. Login as superAdmin
  2. Navigate to `/settings/billing`
  3. Wait for billing-related text
- **Expected:** Page contains billing/usage/plan/invoice/wallet/subscription/entitlement text.

#### TC-BILL-003: Sub-page navigation -- Usage
- **Status:** NEW
- **Priority:** P1
- **Steps:**
  1. Login as superAdmin
  2. Navigate to `/settings/billing`
  3. Click "View Usage Details" link (`data-testid="link-view-usage"`)
- **Expected:** Navigates to `/settings/billing/usage`. Page shows either usage detail cards or "Billing Not Configured".

#### TC-BILL-004: Sub-page navigation -- Plan
- **Status:** NEW
- **Priority:** P1
- **Steps:**
  1. Login as superAdmin
  2. Navigate to `/settings/billing`
  3. Click "Manage Plan" link (`data-testid="link-manage-plan"`)
- **Expected:** Navigates to `/settings/billing/plan`. Page shows either plan details or "Billing Not Configured".

#### TC-BILL-005: Sub-page navigation -- Invoices
- **Status:** NEW
- **Priority:** P1
- **Steps:**
  1. Login as superAdmin
  2. Navigate to `/settings/billing`
  3. Click "Invoice History" link (`data-testid="link-invoice-history"`)
- **Expected:** Navigates to `/settings/billing/invoices`. Page shows either invoice table or "Billing Not Configured".

#### TC-BILL-006: Back navigation from sub-pages
- **Status:** NEW
- **Priority:** P2
- **Steps:**
  1. Login as superAdmin
  2. Navigate to `/settings/billing/usage`
  3. Click back button (`data-testid="link-back-billing"`)
- **Expected:** Returns to `/settings/billing`.
- **Repeat for:** `/settings/billing/plan`, `/settings/billing/invoices`

### Section B: Not-Configured State (Priority: HIGH -- current dev state per I-105)

#### TC-BILL-010: Dashboard shows not-configured when no billingCustomerId
- **Status:** NEW
- **Priority:** P0
- **Steps:**
  1. Login as superAdmin (org has no billingCustomerId in dev)
  2. Navigate to `/settings/billing`
  3. Wait for API response
- **Expected:** `data-testid="text-billing-not-configured"` visible. Text: "Billing Not Configured". AlertCircle icon present.
- **Limitation:** I-105 -- this is the current expected state in dev.

#### TC-BILL-011: Plan page shows not-configured
- **Status:** NEW
- **Priority:** P0
- **Steps:**
  1. Login as superAdmin
  2. Navigate to `/settings/billing/plan`
- **Expected:** `data-testid="text-billing-not-configured"` visible.

#### TC-BILL-012: Usage page shows not-configured
- **Status:** NEW
- **Priority:** P0
- **Steps:**
  1. Login as superAdmin
  2. Navigate to `/settings/billing/usage`
- **Expected:** `data-testid="text-billing-not-configured"` visible.

#### TC-BILL-013: Invoices page shows not-configured
- **Status:** NEW
- **Priority:** P0
- **Steps:**
  1. Login as superAdmin
  2. Navigate to `/settings/billing/invoices`
- **Expected:** `data-testid="text-billing-not-configured"` visible.

#### TC-BILL-014: API returns configured:false for all billing endpoints
- **Status:** NEW
- **Priority:** P0
- **Steps:**
  1. Login as superAdmin via API
  2. GET `/api/billing/summary`
  3. GET `/api/billing/usage`
  4. GET `/api/billing/invoices`
  5. GET `/api/billing/plan`
  6. GET `/api/billing/entitlements`
- **Expected:** Each returns `{ configured: false, message: "Billing not configured" }`.
- **Note:** This is the definitive I-105 verification test.

### Section C: Role Access Control (Priority: HIGH)

#### TC-BILL-020: Super Admin sees billing content
- **Status:** EXISTS (test 8.3)
- **Priority:** P0
- **Steps:**
  1. Login as superAdmin
  2. Navigate to `/settings/billing`
- **Expected:** Billing content visible. No "access denied".

#### TC-BILL-021: Partner Admin sees billing content
- **Status:** EXISTS (test 8.4, first half)
- **Priority:** P0
- **Steps:**
  1. Login as partnerAdmin
  2. Navigate to `/settings/billing`
- **Expected:** Billing content visible.

#### TC-BILL-022: Org Admin sees billing content
- **Status:** EXISTS (test 8.4, second half)
- **Priority:** P0
- **Steps:**
  1. Login as orgAdmin
  2. Navigate to `/settings/billing`
- **Expected:** Billing content visible.

#### TC-BILL-023: Sales role cannot access billing
- **Status:** EXISTS (test 8.5, partial)
- **Priority:** P0
- **Steps:**
  1. Login as sales
  2. Check sidebar -- no billing link
  3. Navigate directly to `/settings/billing`
- **Expected:** Redirected to `/` (RBAC guard via `canAccessSystem`). No billing link in sidebar.

#### TC-BILL-024: Service role cannot access billing
- **Status:** EXISTS (test 8.5, partial)
- **Priority:** P0
- **Steps:** Same as TC-BILL-023 but with service role.
- **Expected:** Redirected to `/`.

#### TC-BILL-025: Marketing role cannot access billing
- **Status:** EXISTS (test 8.5, partial)
- **Priority:** P0
- **Steps:** Same as TC-BILL-023 but with marketing role.
- **Expected:** Redirected to `/`.

#### TC-BILL-026: Executive role cannot access billing
- **Status:** NEW
- **Priority:** P1
- **Steps:**
  1. Login as executive
  2. Navigate directly to `/settings/billing`
- **Expected:** Redirected to `/`. `canAccessSystem('executive')` returns false.

#### TC-BILL-027: API role enforcement -- requireRole(3)
- **Status:** NEW
- **Priority:** P1
- **Steps:**
  1. Login as sales via API (roleLevel > 3)
  2. GET `/api/billing/summary` with token
- **Expected:** 403 Forbidden or equivalent rejection.

#### TC-BILL-028: API rejects unauthenticated requests
- **Status:** NEW
- **Priority:** P1
- **Steps:**
  1. GET `/api/billing/summary` with no Authorization header
- **Expected:** 401 Unauthorized.

### Section D: Dashboard -- Configured State (Priority: MEDIUM)

> Note: These tests require a configured billing org (billingCustomerId set). Due to I-105, they will fail in current dev environment. Mark as BLOCKED until I-105 is resolved.

#### TC-BILL-030: Dashboard displays plan name and tier
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P1
- **Steps:**
  1. Login as superAdmin (with configured billing org)
  2. Navigate to `/settings/billing`
- **Expected:** `data-testid="text-billing-title"` shows "Billing & Usage". `data-testid="text-plan-name"` shows plan name. `data-testid="badge-plan-tier"` shows tier if set.

#### TC-BILL-031: Dashboard displays credit balance
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P1
- **Steps:**
  1. Navigate to `/settings/billing`
- **Expected:** `data-testid="card-credit-balance"` visible. `data-testid="text-credit-balance"` shows dollar amount formatted as `$XX.XX`. Currency label shows "USD".

#### TC-BILL-032: Balance color coding -- green (> $50)
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P2
- **Steps:**
  1. Navigate to billing with org that has balance > $50
- **Expected:** Balance card has green border/background classes. Balance text has green color class.

#### TC-BILL-033: Balance color coding -- yellow ($20-$50)
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P2
- **Steps:**
  1. Navigate to billing with org that has balance $20-$50
- **Expected:** Balance card has yellow border/background classes.

#### TC-BILL-034: Balance color coding -- red (< $20)
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P2
- **Steps:**
  1. Navigate to billing with org that has balance < $20
- **Expected:** Balance card has red border/background classes.

#### TC-BILL-035: Usage overview meters displayed
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P1
- **Steps:**
  1. Navigate to `/settings/billing` with configured org
- **Expected:** Usage grid contains cards with `data-testid="card-usage-{meterId}"` for each active meter. Each card shows meter name, value, and unit.

#### TC-BILL-036: Usage meters with entitlement limits show progress bars
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P2
- **Steps:**
  1. Navigate to `/settings/billing` with org that has metered entitlements
- **Expected:** Meters with limits show progress bar (`data-testid="bar-usage-{meterId}"`), limit text (`data-testid="text-usage-limit-{meterId}"`), and percentage text.

#### TC-BILL-037: Usage meter progress bar color coding
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P3
- **Steps:**
  1. Check meter with < 70% usage
  2. Check meter with 70-89% usage
  3. Check meter with >= 90% usage
- **Expected:** Green bar (< 70%), yellow bar (70-89%), red bar (>= 90%).

#### TC-BILL-038: Dashboard shows "None" when plan is null
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P2
- **Steps:**
  1. Navigate to billing with configured org but no billingPlanId
- **Expected:** `data-testid="text-plan-name"` shows "None". No tier badge.

### Section E: Wallet Top-Up (Priority: MEDIUM)

#### TC-BILL-040: Top-up dialog opens
- **Status:** NEW
- **Priority:** P1
- **Steps:**
  1. Login as superAdmin
  2. Navigate to `/settings/billing` (configured org required, or intercept API)
  3. Click "Top Up" button (`data-testid="button-top-up-wallet"`)
- **Expected:** Dialog appears with amount input (`data-testid="input-topup-amount"`), Cancel and Top Up buttons.
- **Limitation:** BLOCKED by I-105 unless API is mocked -- the Top Up button only renders in configured state.

#### TC-BILL-041: Top-up dialog cancel
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P2
- **Steps:**
  1. Open top-up dialog
  2. Enter amount "50"
  3. Click Cancel (`data-testid="button-cancel-topup"`)
- **Expected:** Dialog closes. Amount input cleared. No API call made.

#### TC-BILL-042: Top-up validation rejects invalid amounts
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P1
- **Steps:**
  1. Open top-up dialog
  2. Leave amount empty, click "Top Up"
  3. Enter "0", click "Top Up"
  4. Enter "-5", click "Top Up"
- **Expected:** Toast with "Invalid amount" and "Please enter a positive amount." for each invalid case.

#### TC-BILL-043: Top-up API -- valid amount
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P1
- **Steps:**
  1. POST `/api/billing/topup` with `{ amount: 25 }` as superAdmin with configured org and walletId
- **Expected:** `{ success: true, balance: { balance: <new_amount>, currency: "USD" } }`
- **Limitation:** Requires billingWalletId on org.

#### TC-BILL-044: Top-up API -- no wallet configured
- **Status:** NEW
- **Priority:** P2
- **Steps:**
  1. POST `/api/billing/topup` with `{ amount: 25 }` as superAdmin (org without billingWalletId)
- **Expected:** 400 with `{ message: "No wallet configured for this organization" }`.

#### TC-BILL-045: Top-up API -- invalid amount
- **Status:** NEW
- **Priority:** P2
- **Steps:**
  1. POST `/api/billing/topup` with `{ amount: -10 }` as superAdmin
  2. POST `/api/billing/topup` with `{ amount: "abc" }` as superAdmin
  3. POST `/api/billing/topup` with `{}` as superAdmin
- **Expected:** 400 with `{ message: "Valid positive amount is required" }` for each.

### Section F: Plan Page (Priority: MEDIUM)

#### TC-BILL-050: Plan page loads with title
- **Status:** NEW
- **Priority:** P1
- **Steps:**
  1. Login as superAdmin
  2. Navigate to `/settings/billing/plan`
- **Expected:** `data-testid="text-plan-title"` shows "Your Plan". Back button visible.

#### TC-BILL-051: Current plan card displayed
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P1
- **Steps:**
  1. Navigate to plan page with configured org and active plan
- **Expected:** `data-testid="text-current-plan-name"` shows plan name. `data-testid="badge-current-plan"` shows "Current Plan". Crown icon visible.

#### TC-BILL-052: Boolean features listed with check/x icons
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P2
- **Steps:**
  1. Navigate to plan page with configured org
- **Expected:** Feature items with `data-testid="feature-{key}"` show green check if allowed, X if not. Feature name displayed.

#### TC-BILL-053: Metered allocations displayed
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P2
- **Steps:**
  1. Navigate to plan page with configured org having metered entitlements
- **Expected:** Metered items with `data-testid="metered-{key}"` show feature name and limit value.

#### TC-BILL-054: No active plan state
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P2
- **Steps:**
  1. Navigate to plan page with configured org but no billingPlanId
- **Expected:** `data-testid="text-no-plan"` shows "No active plan. Contact your administrator to get started."

#### TC-BILL-055: Plan comparison grid
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P2
- **Steps:**
  1. Navigate to plan page when FlexPrice has published plans
- **Expected:** `data-testid="plan-comparison-grid"` visible. Each plan card shows name, price (or "Contact us"), and description.

#### TC-BILL-056: Current plan highlighted in comparison
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P3
- **Steps:**
  1. Navigate to plan page with active plan, multiple plans available
- **Expected:** Current plan card has `border-primary` class and "Current Plan" badge.

#### TC-BILL-057: Plan price formatting
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P3
- **Steps:**
  1. View plan comparison grid
- **Expected:** Plans with `prices[0]` show formatted `$X/interval`. Plans with `price` show `$X/mo`. Plans with neither show "Contact us".

### Section G: Usage Detail Page (Priority: MEDIUM)

#### TC-BILL-060: Usage page loads with title
- **Status:** NEW
- **Priority:** P1
- **Steps:**
  1. Login as superAdmin
  2. Navigate to `/settings/billing/usage`
- **Expected:** `data-testid="text-usage-title"` shows "Usage Details". Back button visible.

#### TC-BILL-061: Billing period displayed
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P2
- **Steps:**
  1. Navigate to usage page with configured org
- **Expected:** `data-testid="text-billing-period"` shows date range in "M/D/YYYY -- M/D/YYYY" format.

#### TC-BILL-062: Usage detail cards with meter info
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P1
- **Steps:**
  1. Navigate to usage page with configured org
- **Expected:** Cards with `data-testid="card-usage-detail-{meterId}"` show: meter icon, meter name (`text-meter-name-*`), aggregation badge (`badge-aggregation-*`), current value (`text-usage-current-*`), unit label.

#### TC-BILL-063: Usage percentage badge color coding
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P3
- **Steps:**
  1. View usage detail for meter with < 70% usage
  2. View usage detail for meter with 70-89% usage
  3. View usage detail for meter with >= 90% usage
- **Expected:** "default" badge variant (< 70%), "secondary" variant (70-89%), "destructive" variant (>= 90%).

#### TC-BILL-064: No usage data empty state
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P2
- **Steps:**
  1. Navigate to usage page with configured org but zero usage events
- **Expected:** `data-testid="text-no-usage"` shows "No usage data available for this period."

#### TC-BILL-065: Usage page error state
- **Status:** NEW
- **Priority:** P2
- **Steps:**
  1. Navigate to usage page when API returns 500
- **Expected:** `data-testid="text-billing-error"` shows "Failed to Load Usage". Error message displayed.

### Section H: Invoice Page (Priority: MEDIUM)

#### TC-BILL-070: Invoice page loads with title
- **Status:** NEW
- **Priority:** P1
- **Steps:**
  1. Login as superAdmin
  2. Navigate to `/settings/billing/invoices`
- **Expected:** `data-testid="text-invoices-title"` shows "Invoice History". Back button visible.

#### TC-BILL-071: Empty invoices state
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P2
- **Steps:**
  1. Navigate to invoices page with configured org but no invoices
- **Expected:** `data-testid="text-no-invoices"` shows "No invoices yet".

#### TC-BILL-072: Invoice table with data
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P1
- **Steps:**
  1. Navigate to invoices page with configured org and invoice history
- **Expected:** `data-testid="invoice-table"` visible. Table headers: Date, Amount, Status, Invoice ID. Rows with `data-testid="invoice-row-{id}"`.

#### TC-BILL-073: Invoice status badges
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P2
- **Steps:**
  1. View invoice table with mixed statuses
- **Expected:** "paid"/"finalized" -> green badge. "pending"/"draft"/"open" -> yellow badge. "overdue"/"void"/"uncollectible" -> destructive badge.

#### TC-BILL-074: Invoice amount formatting
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P3
- **Steps:**
  1. View invoice with amount_due = 150.5
- **Expected:** Displayed as "$150.50" (2 decimal places, USD formatting).

#### TC-BILL-075: Invoice date formatting
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P3
- **Steps:**
  1. View invoice with invoice_date "2026-03-15T00:00:00Z"
- **Expected:** Formatted as "Mar 15, 2026".

### Section I: Entitlements (Priority: MEDIUM)

#### TC-BILL-080: EntitlementGate renders children when allowed
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P1
- **Steps:**
  1. Render EntitlementGate with feature="crm_integration" for org where crm_integration is allowed
- **Expected:** Children rendered inside `data-testid="entitlement-gate-crm_integration"`. No UpgradeCTA.

#### TC-BILL-081: EntitlementGate shows UpgradeCTA when blocked
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P1
- **Steps:**
  1. Render EntitlementGate with feature="generative_studio" for org where it is not allowed
- **Expected:** UpgradeCTA visible (`data-testid="upgrade-cta"`). Children not rendered. Lock icon and "Upgrade to unlock" text.

#### TC-BILL-082: EntitlementGate degrades gracefully when billing not configured
- **Status:** NEW
- **Priority:** P1
- **Steps:**
  1. Render EntitlementGate with any feature when billing returns configured:false
- **Expected:** Children rendered normally (fail-open behavior). No UpgradeCTA.

#### TC-BILL-083: Entitlements API returns all 17 feature keys
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P2
- **Steps:**
  1. GET `/api/billing/entitlements` as superAdmin with configured org
- **Expected:** Response contains `entitlements` array with 17 items (7 meter-based + 10 feature-based). Each has `feature`, `name`, `allowed` fields.

#### TC-BILL-084: Entitlement check POST endpoint
- **Status:** NEW
- **Priority:** P1
- **Steps:**
  1. POST `/api/entitlements/check` with `{ feature_key: "agent_slots" }` as superAdmin
- **Expected (configured):** `{ configured: true, feature: "agent_slots", allowed: true/false, limit: N, used: N }`
- **Expected (not configured):** `{ configured: false, entitled: false, message: "Billing not configured" }`

#### TC-BILL-085: Entitlement check -- missing feature_key
- **Status:** NEW
- **Priority:** P2
- **Steps:**
  1. POST `/api/entitlements/check` with `{}` as superAdmin
- **Expected:** 400 with `{ message: "feature_key is required" }`.

#### TC-BILL-086: Entitlement check -- FlexPrice unreachable (degraded mode)
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P2
- **Steps:**
  1. POST `/api/entitlements/check` when FlexPrice is unreachable
- **Expected:** `{ configured: true, feature: "...", allowed: true, degraded: true, message: "Billing service unavailable -- defaulting to allowed" }`. Fail-open behavior.

### Section J: CreditBalanceIndicator (Priority: LOW)

#### TC-BILL-090: Indicator hidden when not configured
- **Status:** NEW
- **Priority:** P2
- **Steps:**
  1. Login as superAdmin
  2. Check sidebar for credit balance indicator
- **Expected:** `data-testid="credit-balance-indicator"` not present (returns null when configured:false).

#### TC-BILL-091: Indicator shows balance with color dot
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P2
- **Steps:**
  1. Login with configured billing org
  2. Check sidebar
- **Expected:** `data-testid="credit-balance-indicator"` visible. Shows dollar amount. Color dot: green (> $500 after /100 conversion), yellow ($100-$500), red (< $100).

#### TC-BILL-092: Indicator click navigates to billing
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P3
- **Steps:**
  1. Click credit balance indicator
- **Expected:** Navigates to `/settings/billing`.

### Section K: API Edge Cases (Priority: LOW)

#### TC-BILL-100: Billing summary API -- server error handling
- **Status:** NEW
- **Priority:** P3
- **Steps:**
  1. Force billingService.getUsageSummary to throw
- **Expected:** 500 with `{ message: "Failed to fetch billing summary" }`.

#### TC-BILL-101: Plans API returns only published plans
- **Status:** NEW (BLOCKED by I-105)
- **Priority:** P3
- **Steps:**
  1. GET `/api/billing/plans` when FlexPrice has mix of published and draft plans
- **Expected:** Only plans with `status: "published"` returned.

#### TC-BILL-102: Billing usage API -- period parameter
- **Status:** NEW
- **Priority:** P2
- **Steps:**
  1. GET `/api/billing/usage?period=current_month` as superAdmin
  2. GET `/api/billing/usage?period=last_month` as superAdmin
- **Expected:** Different date ranges in response. `current_month`: 1st of month to now. `last_month`: 1st of previous month to last day of previous month.

#### TC-BILL-103: Usage summary API -- role-based org scoping
- **Status:** NEW
- **Priority:** P2
- **Steps:**
  1. GET `/api/usage/summary` as superAdmin (roleLevel 1)
  2. GET `/api/usage/summary` as partnerAdmin (roleLevel 2)
  3. GET `/api/usage/summary` as orgAdmin (roleLevel 3)
- **Expected:** SuperAdmin sees all orgs. PartnerAdmin sees own org + partner orgs. OrgAdmin sees only own org.

---

## Test Summary

| Category | Total | Existing | New | Blocked (I-105) |
|----------|-------|----------|-----|-----------------|
| A: Page Load & Nav | 6 | 2 | 4 | 0 |
| B: Not-Configured | 5 | 0 | 5 | 0 |
| C: Role Access | 9 | 5 | 4 | 0 |
| D: Dashboard Configured | 9 | 0 | 9 | 9 |
| E: Wallet Top-Up | 6 | 0 | 6 | 3 |
| F: Plan Page | 8 | 0 | 8 | 7 |
| G: Usage Detail | 6 | 0 | 6 | 4 |
| H: Invoices | 6 | 0 | 6 | 5 |
| I: Entitlements | 7 | 0 | 7 | 4 |
| J: CreditBalanceIndicator | 3 | 0 | 3 | 2 |
| K: API Edge Cases | 4 | 0 | 4 | 1 |
| **TOTAL** | **69** | **7** | **62** | **35** |

### Execution Priority

1. **Immediately testable (34 tests):** Sections A, B, C, and non-blocked tests from E, I, K. These work against current dev state.
2. **Blocked by I-105 (35 tests):** All tests requiring `configured: true` state. Unblock when billingCustomerId is populated per org in dev.
3. **API-mockable subset:** Some blocked UI tests (D, F, G, H) could be unblocked via Playwright route interception to mock API responses.

### Test Data Requirements

- **Current dev:** No billingCustomerId on any org. All billing APIs return `{configured: false}`.
- **To unblock I-105 tests:** Need at least one org with: `billingCustomerId`, `billingPlanId`, `billingWalletId`, and `billingTier` set in the organizations table. FlexPrice must have a matching customer with active subscription, usage data, and invoices.
