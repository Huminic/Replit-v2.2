# Re-Verification: Widgets + Submenu Overlay

**Date:** 2026-04-07
**Verifier:** Independent agent (no knowledge of fix implementation)
**Account:** serra_honda@huminic.ai / Serra Honda
**Target:** https://dev.huminicdev.com

---

## Test Results

### Test 1: Navigate to /settings — can you click on settings tiles without the submenu blocking?

**Result: PASS (with caveat)**

Settings page loaded at /settings. Six tiles visible: User Management, Organization, Tools & Integrations, Knowledge Base, Notifications, Appearance. Clicked "Tools & Integrations" tile successfully — navigated to the sub-view with tabs (MCP, API, Other, Universal, Widgets, Pages). No submenu interference during this interaction because the sidebar was not hovered.

**Caveat:** If the sidebar is hovered at any point before or during navigation, the app crashes (see Test 3). So this test only passes when the user does not hover the sidebar.

### Test 2: Navigate to /sales — can you click on metric tiles without the submenu blocking?

**Result: PASS (with caveat)**

Sales dashboard loaded at /sales. Seven metric tiles visible: Total Leads (0), New Leads (0), Active Pipeline (107), Waiting on Response (0), Appointments Set (0), Sold (0), Conversion Rate (0%). Clicked "Active Pipeline" tile successfully.

**Same caveat as Test 1:** Only passes when the sidebar is not hovered.

### Test 3: Move mouse away from the submenu — does it close quickly (within ~1 second)?

**Result: FAIL — APP CRASH**

Hovering over any sidebar navigation button (tested: Sales, Insights) causes an immediate application crash:

```
ReferenceError: panelHovered is not defined
    at nme (index-DhvcCYsr.js:147:23477)
```

The ErrorBoundary catches the crash and displays "Something went wrong — panelHovered is not defined". The submenu never renders — it crashes before appearing. This was reproduced 4 times across different pages (AI Chat, Sales, Insights, Settings).

### Test 4: After submenu closes, can you immediately click on content behind where it was?

**Result: FAIL — BLOCKED BY CRASH**

Cannot test. The app crashes on sidebar hover (Test 3), so the submenu never opens or closes. After the crash, the only options are "Try Again" or "Reload Page".

### Test 5: Navigate to Settings > Widgets — can you see and interact with widget configuration?

**Result: PASS**

Navigated to /settings, clicked "Tools & Integrations" tile, clicked "Widgets" tab. Widget configuration table displayed with 4 widgets:

| Widget | Type | Code | Status |
|--------|------|------|--------|
| Marketing Landing Widget | Unified Widget | wgt_serra_marketing_unified | draft |
| Service Appointment Bot | Voice Call Widget | wgt_serra_service_voice | inactive |
| Serra Video Assistant | Live Video Widget | wgt_serra_video_assist | active |
| Serra Honda Sales Chat | Text Chat Widget | wgt_serra_honda_sales | active |

"New widget" button visible. Search box visible. Action buttons (View test page) visible per widget.

---

## Root Cause Analysis

The deployed bundle (`dist/public/assets/index-DhvcCYsr.js`) references `panelHovered` as a bare variable in the SubMenuManager component's JSX template. In source (`client/src/components/layout/SubMenuManager.tsx:777`), `panelHovered` is properly destructured from `useUILayout()` at line 79. However, the deployed build does not correctly resolve this variable at runtime.

Key findings:
- `client/src/components/layout/Sidebar.tsx` and `client/src/components/layout/SubMenuManager.tsx` both have uncommitted changes (per `git diff --name-only HEAD`)
- The build was created at 2026-04-07T07:32Z from uncommitted working tree state
- The `panelHovered` variable exists 3 times in the bundle — twice correctly scoped, once as a bare reference that crashes

---

## Verdict: FAIL

**3 of 5 tests passed. 1 failed outright (crash on hover). 1 blocked by the crash.**

The application has a critical runtime crash: hovering over any sidebar navigation button causes `ReferenceError: panelHovered is not defined`, which crashes the entire app via ErrorBoundary. This makes the submenu completely non-functional. The widgets page itself works if reached via direct URL navigation without hovering the sidebar.

This is a **ship-blocker** — normal navigation via sidebar hover is impossible.
