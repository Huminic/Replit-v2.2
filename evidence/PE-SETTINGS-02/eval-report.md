# PE-SETTINGS-02 — Settings Re-Evaluation Report

**Date:** 2026-04-06
**Evaluator:** Production Eval Agent
**URL:** https://dev.huminicdev.com/settings
**Login:** serra_honda@huminic.ai (org_admin, Serra Honda)
**Prior Eval:** PE-SETTINGS-01
**Remediation Applied:** REM-PE-005, DATA-CLEANUP-01/02

---

## Bug Status Summary

| Bug ID | Severity | Description | Status | Evidence |
|--------|----------|-------------|--------|----------|
| BUG-SET-01 | Low | Billing tile missing from main settings grid | STILL PRESENT | screenshots/01-settings-grid-overview.png, 08-menu-dropdown-no-billing.png |
| BUG-SET-02 | Low | Stale test user "T022e Test Updated" visible in User Management | FIXED | screenshots/02-user-management-no-test-user.png |
| BUG-SET-03 | Medium | TextMagic Phone Number empty despite SMS enabled | FIXED | screenshots/06-textmagic-phone-populated.png |
| BUG-SET-04 | Medium | VIN Sales Rep dropdown stuck on "Loading VIN users..." | FIXED | screenshots/07-vin-dropdown-not-loading.png |

---

## Detailed Findings

### BUG-SET-01: Billing tile missing — STILL PRESENT

The settings grid displays 6 tiles: User Management, Organization, Tools & Integrations, Knowledge Base, Notifications, Appearance. No Billing tile exists. The Menu dropdown also has no Billing entry (shows: Users, Organization, Tools, Knowledge, AI Config). This was rated Low severity previously and no remediation was scoped for it, so the status is expected.

### BUG-SET-02: Stale test user — FIXED

The User Management list for Serra Honda shows 9 users: Marcus Webb, James Chen, Vanessa Torres, Derek Wilson, Ashley Brooks, Brian Mitchell, Rachel Kim, Serra Honda Admin, Duane Wells. The "T022e Test Updated" test user is no longer present. DATA-CLEANUP-01/02 successfully removed the test data.

### BUG-SET-03: TextMagic Phone Number empty — FIXED

The TextMagic Phone Number field (located under Organization > Channel Controls, not under API/Integrations) now displays `+15005550006`. The field reads from the orgSettings query as intended by REM-PE-005. The value is populated and editable.

### BUG-SET-04: VIN Sales Rep dropdown stuck loading — FIXED

The CRM Integration card under Tools & Integrations > API tab shows the Default VIN Sales Rep dropdown with "Select a sales rep" placeholder. It is NOT stuck on "Loading VIN users...". The CRM Integration is correctly marked as Disabled/Locked for Serra Honda. When expanded, the dropdown shows dealer info ("Dealer: Serra Honda of Sylacauga (ID: 21043)") and a static combobox. No infinite loading spinner. Zero console errors on the page.

**Note:** The dropdown still renders and shows dealer info even when CRM Integration is Disabled/Locked. This is cosmetic — not a functional bug — since the toggle is disabled and locked. The primary issue (infinite "Loading VIN users..." state) is resolved.

---

## New Bugs Found

None.

---

## Console Errors

Zero errors observed during the evaluation session.

---

## Scorecard

- Bugs fixed: 3/4 (BUG-SET-02, BUG-SET-03, BUG-SET-04)
- Bugs still present: 1/4 (BUG-SET-01 — no remediation was scoped)
- New bugs: 0
- Regressions: 0
