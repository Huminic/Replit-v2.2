# PE-SETTINGS-01 Bug Log

**Date:** 2026-04-06
**Sprint:** PE-SETTINGS-01 (Settings / Users / Notifications)

---

## BUG-01: Billing tile missing from main settings grid

**Severity:** Low (cosmetic / navigation inconsistency)
**Location:** `/settings/system`
**Evidence:** Sidebar sub-panel (visible on second visit to System Settings) lists 8 items including "Billing — Billing and invoicing". However, the main tile grid only shows 7 tiles — Billing is absent.
**Impact:** Users who rely on the tile grid to discover features will not find Billing. Users who discover the sidebar sub-panel can access it.
**Expected:** Either add a Billing tile to the main grid, or intentionally hide it from the sidebar if it is not yet ready.

---

## BUG-02: Stale test user visible in User Management

**Severity:** Low (data hygiene)
**Location:** `/settings/system` > User Management
**Evidence:** `screenshots/02-UC03-user-management.png`
**Details:** User "T022e Test Updated" (t022e-test@test.com) is listed as "Inactive" Organization Admin. This appears to be a leftover from automated test runs (the "T022e" prefix and test.com domain suggest test data).
**Impact:** Real admins see test artifacts in their user list.
**Expected:** Test users should be cleaned up after test runs, or filtered from the production user list.

---

## BUG-03: TextMagic Phone Number empty in Channel Controls

**Severity:** Medium (functional gap)
**Location:** `/settings/system` > Organization > Channel Controls
**Evidence:** `screenshots/05-UC07-organization-settings.png`
**Details:** The "TextMagic Phone Number" field (described as "Your TextMagic number for inbound SMS routing") is empty despite SMS being enabled (toggle ON). The placeholder shows "e.g. 18338096836" but no value is set.
**Impact:** If SMS channel is enabled but no TextMagic number is configured, inbound SMS routing may fail or be unrouteable. Outbound SMS may work (uses API key) but inbound replies would have no destination.
**Expected:** Either pre-populate with the configured TextMagic number, or show a warning that inbound SMS routing is not configured.

---

## BUG-04: VIN Sales Rep dropdown stuck on "Loading VIN users..."

**Severity:** Medium (functional)
**Location:** `/settings/system` > Tools & Integrations > API tab > CRM Integration > Default VIN Sales Rep
**Evidence:** `screenshots/06b-UC08-tools-api-tab.png`
**Details:** The "Default VIN Sales Rep" dropdown shows "Loading VIN users..." and never resolves. The CRM Integration (VIN Solutions) is Disabled and Locked, which likely means the API call to fetch VIN users cannot complete.
**Impact:** Even if an admin wanted to pre-configure the default sales rep before enabling VIN Solutions, they cannot — the dropdown never loads.
**Expected:** Either show "VIN Solutions must be enabled to configure this setting" or suppress the dropdown when the integration is disabled.

---

## Non-Bug Observations

### OBS-01: Tour popup reappears on page navigation
The "Dashboard & AI Chat" tour (1 of 6) reappeared when navigating to the Profile page after already being dismissed on the Settings page. The tour skip state may not persist across all page contexts.

### OBS-02: Logged in as wrong user
The eval was supposed to log in as serra_honda@huminic.ai (org_admin) but the session was already authenticated as duane.wells@huminic.ai (Super Admin) from a prior browser session. This means the eval was conducted with Super Admin privileges, which may show more settings than an org_admin would see. A separate eval as org_admin would be needed to verify RBAC-restricted visibility.

### OBS-03: Business Phone and Business Email empty
In Organization Settings, both Business Phone and Business Email are empty. These are described as "Primary contact number" and "Primary contact email". For a production dealership, these should ideally be populated.

### OBS-04: All communication channels enabled
All 4 channel toggles (SMS, Email, Phone, Video) are ON, and the CommGate master switch is ON. This means the system is configured to send real outbound communications. This is correct for production but worth noting for awareness.
