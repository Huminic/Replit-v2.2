# Re-Verification: Insights Page

**Date:** 2026-04-07
**Verifier:** Independent agent (no knowledge of prior fixes)
**Account:** serra_honda@huminic.ai (org_admin, Serra Honda)
**Branch:** sniper-launch
**URL:** https://dev.huminicdev.com

---

## Test Results

### 1. Insights visible in sidebar navigation?
**PASS** — "Insights" button is visible in the sidebar navigation for org_admin role.

### 2. Navigate to /insights — does it load and stay?
**FAIL** — Page crashes immediately with error boundary: "Something went wrong — An unexpected error occurred. Please try again."

Error message displayed: `panelHovered is not defined`

Tested twice:
- First attempt: clicked Insights from sidebar on AI Chat page → crash, redirected to /teambox
- Second attempt: clicked Insights from sidebar on TeamBox page → crash, URL stays at /insights but error boundary renders

### 3. Dashboard tab: do metric tiles show real non-zero data?
**BLOCKED** — Cannot evaluate. Page crashes before any content renders.

### 4. Activity tab: does it show real activity items?
**BLOCKED** — Cannot evaluate. Page crashes before any content renders.

### 5. Reports tab: do tables have data rows?
**BLOCKED** — Cannot evaluate. Page crashes before any content renders.

### 6. Channel Intelligence: does the table have data in ALL columns?
**BLOCKED** — Cannot evaluate. Page crashes before any content renders.

### 7. Hot Leads drill-down: does the modal show customer data?
**BLOCKED** — Cannot evaluate. Page crashes before any content renders.

---

## Root Cause Analysis

**Error:** `ReferenceError: panelHovered is not defined`

**Source:** `client/src/components/layout/SubMenuManager.tsx`, line 776

**Explanation:** The `SubMenuManager` component destructures `setPanelHovered` from `useUILayout()` (line 79) but does NOT destructure the `panelHovered` state variable itself. However, line 776 references `panelHovered` directly in a template literal:

```tsx
isVisible ? `translate-x-0 opacity-100 ${panelHovered ? 'pointer-events-auto' : 'pointer-events-none'}` : ...
```

Since `panelHovered` was never destructured or declared in scope, this throws a `ReferenceError` at render time, which the ErrorBoundary catches and displays as a crash screen.

**Fix required:** Add `panelHovered` to the destructuring at line 74-80:
```tsx
const {
  activePanel,
  subMenuExpanded,
  setActivePanel,
  setSubMenuExpanded,
  panelHovered,       // <-- missing
  setPanelHovered
} = useUILayout();
```

---

## Console Errors (verbatim)

```
[ERROR] ReferenceError: panelHovered is not defined
    at nme (https://dev.huminicdev.com/assets/index-DhvcCYsr.js:147:23477)
    ...

[ERROR] ErrorBoundary caught an error: ReferenceError: panelHovered is not defined
    at nme (https://dev.huminicdev.com/assets/index-DhvcCYsr.js:147:23477)
    ...
```

---

## Verdict: FAIL

The Insights page is completely non-functional. It crashes on render due to an undefined variable reference in `SubMenuManager.tsx`. None of the 6 functional test items (items 2-7) could be evaluated. Only sidebar visibility (item 1) passes.

This is a one-line fix (add `panelHovered` to the destructuring), after which the page would need to be rebuilt and redeployed before re-testing.
