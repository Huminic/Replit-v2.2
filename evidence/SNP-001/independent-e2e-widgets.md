# Independent E2E Widget Workflow Test

**Date:** 2026-04-07
**Tester:** Independent Verifier (no prior knowledge of codebase or fixes)
**Account:** serra_honda@huminic.ai (org_admin, Serra Honda)
**Target:** https://dev.huminicdev.com

---

## 1. Widget Configuration (Settings > System > Tools & Integrations > Widgets tab)

**Navigation path:** Sidebar > System > Tools & Integrations > Widgets tab

**Result:** 4 widgets configured for Serra Honda

| Widget Name | Type | Widget Code | Status | Last Updated |
|------------|------|-------------|--------|--------------|
| Marketing Landing Widget | Unified Widget | wgt_serra_marketing_unified | draft | 4/3/2026 |
| Service Appointment Bot | Voice Call Widget | wgt_serra_service_voice | inactive | 4/3/2026 |
| Serra Video Assistant | Live Video Widget | wgt_serra_video_assist | active | 4/3/2026 |
| Serra Honda Sales Chat | Text Chat Widget | wgt_serra_honda_sales | active | 4/3/2026 |

Each widget row shows: Name, Type label, Embed Code, Status badge, Last Updated date, and "View test page" link.

**Observation:** The Widgets tab is functional but extremely difficult to reach due to a **submenu panel overlay bug** (see Issue #1 below). The sidebar submenu panel (z-index 40, position fixed, width 280px) intercepts pointer events on the main content area. Clicking any main-content element while the submenu is open either triggers a page navigation away or is blocked entirely. Tab switching within the Tools section only works via synthetic DOM events (dispatchEvent), not via normal Playwright clicks.

**Verdict: PARTIAL** -- Widgets exist and are configured, but the settings UI has a serious usability/interactivity issue.

---

## 2. Widget Public API Endpoints

Tested all 4 widget codes via `/api/widgets/public/{widgetCode}`:

| Widget Code | HTTP Status | Response |
|------------|-------------|----------|
| wgt_serra_marketing_unified | 200 | type: unified, persona: Caroline, channels: chat+video+voice |
| wgt_serra_service_voice | 200 | type: voice, persona: Caroline, channels: chat+video+voice |
| wgt_serra_video_assist | 200 | type: video, persona: Caroline, channels: chat+video+voice |
| wgt_serra_honda_sales | 200 | type: text, persona: Caroline, channels: chat+video+voice |

All return valid JSON with: widgetCode, type, name, orgName ("Serra Honda"), personaName ("Caroline"), appearance (empty object), and channels object.

**Verdict: PASS** -- All public widget API endpoints return correct data.

---

## 3. Widget Public/Landing Pages

| URL | Result |
|-----|--------|
| /landing | 404 Page Not Found |
| /landing/wgt_serra_honda_sales | Redirects to /login (requires auth) |
| /w/wgt_serra_honda_sales | "Page Not Found - This dealership landing page doesn't exist" |
| /w/serra-honda | Redirects to settings page (not public) |
| /widget-test/wgt_serra_honda_sales | Redirects to dashboard (no test page rendered) |
| /widget/wgt_serra_honda_sales | Redirects to dashboard (not routed) |
| /embed/wgt_serra_honda_sales | Redirects to dashboard (not routed) |

**Verdict: FAIL** -- No public-facing widget page or landing page works. The /landing route returns 404. The /w/ route says "doesn't exist". The /landing/{code} route requires authentication. Widget "View test page" links from Settings are not functional public endpoints.

---

## 4. TeamBox Conversations

**Conversations tab (All filter):**
- 12 conversations total
- Conversation list includes: Duane K. Wells, Duane Wells, Serra Honda Admin (x4+), +1821616232, +1428670293, James Chen, Stephanie Thompson
- Channel filter buttons present: All, SMS, Email, Voice
- Main tabs: Conversations, Phone, Video

**Channel labels observed:**
- First conversation (Duane K. Wells) shows channel label: "AI-CHAT"
- Conversations from phone numbers (+1821616232, +1428670293) show unread badge counts
- Channel icon images (img refs) are present next to each conversation but could not be verified visually due to accessibility snapshot limitations

**Sidebar channels:**
- SMS: 2 conversations
- Email: 1 conversation
- Phone: channel present (no count displayed)
- Video: channel present (no count displayed)

**Verdict: PARTIAL** -- Conversations load and display. Channel filters (All/SMS/Email/Voice) exist. At least one channel label ("AI-CHAT") is visible. However, I could not verify channel icons visually due to the submenu overlay preventing interaction with individual conversations.

---

## 5. TeamBox Video Tab

**Content:** "Tavus Video Sessions" heading, then "No video sessions found"

No table, no session entries, no data.

**Verdict: FAIL** -- Video tab renders but has zero session data. Either no Tavus video sessions have been conducted, or the data is not persisting/displaying.

---

## 6. TeamBox Phone Tab

Could not reliably reach the Phone tab due to page navigation instability. The page repeatedly redirected away from /teambox to /insights or /service after tab clicks.

**Verdict: INCONCLUSIVE** -- Unable to test due to navigation instability.

---

## 7. Conversation Channel Icons and Labels

From the data captured:
- Channel label "AI-CHAT" visible on at least one conversation
- Channel sidebar shows SMS, Email, Phone, Video as distinct channels with icons
- Individual conversation items show avatar initials and relative timestamps
- Unread message counts displayed as badges on some conversations

Could not click individual conversations to verify per-conversation channel icons due to the submenu overlay interception bug.

**Verdict: PARTIAL** -- Channel labels and sidebar icons exist. Individual verification blocked by UI bug.

---

## Issues Found

### Issue #1 (CRITICAL UX): Submenu Panel Overlay Blocks Main Content Interaction
The left sidebar submenu panel (`data-testid="submenu-panel"`, z-index 40, fixed position, 280px wide) covers the main content area's left portion. When the submenu is open (which it is by default on Settings and TeamBox pages), clicking on conversation items, tab buttons, or settings cards is intercepted by the submenu. This causes:
- Clicks to be swallowed or redirected
- Page navigation to unintended routes
- Inability to interact with the conversation list in TeamBox
- Inability to click widget configuration cards in Settings

### Issue #2 (HIGH): No Functional Public Widget/Landing Pages
None of the tested public routes (/landing, /w/, /widget/, /widget-test/, /embed/) render a functional widget page. The public API returns widget data correctly, but there is no frontend route that renders a widget for external visitors.

### Issue #3 (MEDIUM): Session Instability / Aggressive Logout
During testing, the session expired at least 5 times within approximately 15 minutes of testing. Page navigation via `goto()` frequently triggered re-authentication. This suggests either very short session TTL, aggressive CSRF/token rotation, or SPA routing issues that lose auth state.

### Issue #4 (MEDIUM): Video Tab Empty
The Tavus Video Sessions tab shows "No video sessions found." If video widget sessions are supposed to be stored and displayed here, the data pipeline is not populating.

### Issue #5 (LOW): Navigation Instability
Direct URL navigation (page.goto) to specific routes (/teambox, /settings/system?section=tools) frequently redirects to unrelated pages (/service, /insights, /sales). The SPA router appears to have race conditions between auth checks, submenu state, and route resolution.

---

## Final Verdict: PARTIAL

| Test Area | Verdict |
|-----------|---------|
| Widget configuration in Settings | PARTIAL (data exists, UI interaction blocked) |
| Widget public API endpoints | PASS |
| Public widget/landing pages | FAIL |
| TeamBox conversations | PARTIAL (loads, channels visible, interaction blocked) |
| TeamBox Video tab | FAIL (empty) |
| TeamBox Phone tab | INCONCLUSIVE |
| Channel icons/labels | PARTIAL |

**Overall: PARTIAL** -- The widget backend (API, data model, configuration) appears functional. The frontend has two blocking issues: (1) no public-facing widget pages exist, and (2) a submenu overlay bug prevents normal interaction with settings and TeamBox pages. The Video tab is empty with no session data. Session management is unstable with frequent forced logouts.
