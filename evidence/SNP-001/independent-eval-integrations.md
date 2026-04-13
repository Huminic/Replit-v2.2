# Independent Evaluation: Integrations Section

**Evaluator:** Independent Verifier (Track 2)
**Date:** 2026-04-07
**Application:** Nexxus Connect v2.2
**URL:** https://dev.huminicdev.com
**Account used:** serra_honda@huminic.ai (org_admin), duane.wells@huminic.ai (super_admin)
**Section:** Settings > Tools & Integrations

---

## Navigation Path

Integrations is NOT a standalone page. It is accessed via:
**Sidebar > System > Settings tile grid > Tools & Integrations tile**

This drills into a tabbed view within `/settings/system` with tabs: MCP, API, Other, Universal, Widgets, Pages.

---

## Findings

### F-INT-01: Session loss on full page navigation (direct URL access)
**Severity: HIGH**

Navigating directly to `https://dev.huminicdev.com/settings/system` via browser address bar (full page load) consistently redirects to `/login`. The auth system stores the JWT access token in-memory only (`client/src/lib/tokenStore.ts`). On full page reload, the token is lost. The refresh token (httpOnly cookie) should re-authenticate automatically via the AuthContext, but this fails — the user is dumped to login.

**Impact:** Users cannot bookmark or share URLs to the settings page. Browser refresh loses the session. This affects ALL authenticated routes, not just Integrations.

**Evidence:** Multiple attempts at `page.goto('/settings/system')` after successful login all redirected to `/login`. Only SPA (client-side) navigation works reliably.

**8 Commentary Questions:**
1. Does it render? Only via SPA navigation, not direct URL.
2. Is it interactive? Yes, when reached via sidebar click.
3. Does it show real data? The MCP tab shows "No MCP tools configured" which is accurate for Serra Honda.
4. Any false-pass classes? No hidden elements masking errors.
5. Data plausibility? N/A for this finding.
6. Cross-screen consistency? The session instability is global.
7. Error handling? No error message — silent redirect to login.
8. Accessibility? N/A for this finding.

---

### F-INT-02: System sidebar navigation is unstable — panel cycling
**Severity: HIGH**

Clicking the "System" sidebar button is unreliable. Instead of navigating to `/settings/system` and showing the settings content in the main area, the following behaviors were observed:

- Sometimes it shows the settings tile grid briefly, then the main content reverts to the previous page (Sales, Service, etc.)
- The sub-panel (left flyout) cycles through different page panels (TeamBox, Sales, Marketing) before settling
- Playwright's click on `[data-testid="sidebar-item-system"]` frequently triggers navigation to other pages (/service, /insights, /teambox) instead of /settings/system
- A 404 "Page Not Found" was observed once after clicking System (screenshot eval-int-04)

**Root cause analysis:** The System button triggers `setLocation('/settings/system')` AND `setActivePanel('system')`. The sub-panel state and the main content routing appear to race. The sub-panel opening/closing interferes with the main content area routing.

**Impact:** Users may not be able to reliably access Settings. The navigation is unpredictable — sometimes it works, sometimes it doesn't.

**Evidence:** Screenshots eval-int-04 (404), eval-int-09 (settings briefly visible), eval-int-18 (sub-panel visible but main content differs).

---

### F-INT-03: Clicking Tools & Integrations tile requires force-click or JS dispatch
**Severity: MEDIUM**

The Tools & Integrations tile (`[data-testid="settings-tile-tools"]`) renders at position (909, 161) in the main content area but is consistently blocked by overlapping elements. Playwright's standard click fails with "intercepts pointer events" errors from various elements:
- `<h3>User Management</h3>` — the sub-panel overlaps the main content
- Various metric cards from the dashboard
- Conversation items from TeamBox

Only `dispatchEvent(new MouseEvent('click'))` via JavaScript succeeds.

**Impact:** The UI layout has z-index or overlap issues where the sub-panel and main content area conflict. A real user with precise mouse targeting might be able to click the tile, but the overlap makes it unreliable.

**Evidence:** Error log from Playwright showing `<h3 class="font-semibold text-foreground">User Management</h3> from <div class="flex-1 flex overflow-hidden relative">...</div> subtree intercepts pointer events`.

---

### F-INT-04: Tab switching within Tools section fails — content doesn't update
**Severity: MEDIUM**

When the Tools & Integrations detail view renders with tabs (MCP, API, Other, Universal, Widgets, Pages), clicking tabs via `tab.click()` does not update the tab panel content:

- MCP tab (default): Shows "No MCP tools configured" — correct
- API tab: Still shows MCP content (same "No MCP tools configured" text)
- Other, Universal, Widgets, Pages tabs: Main content reverted to dashboard (AI Key Metrics), indicating the settings page unmounted

The tabs use Radix UI tab components. The tab click may trigger a re-render that causes the settings page to lose its `activeSection` state.

**Impact:** Users cannot view the API integration cards (CRM/VIN Solutions, Voice/VAPI, Video/Tavus, etc.), Widget management, or Landing Pages sections even when they successfully reach the Tools detail view.

**Evidence:** Tab exploration results showing API tab returning MCP content, and Other/Universal/Widgets/Pages tabs returning dashboard content.

---

### F-INT-05: MCP tab shows "No MCP tools configured" for all orgs
**Severity: LOW**

The MCP tab displays: "No MCP tools configured. MCP tools are added via backend configuration."

This is accurate — MCP tools are configured server-side via the central-mcp server (port 4002), not through the UI. However, the message provides no actionable guidance. A user would not know what "backend configuration" means or how to request MCP tools.

**Impact:** Informational gap. Not a functional bug, but unhelpful for a user trying to understand their integration status.

---

### F-INT-06: No sync status or connection health indicators in Integrations
**Severity: MEDIUM**

The Tools & Integrations section has no indicators showing:
- Whether VIN Solutions is currently connected
- Last sync time or sync health
- Connection status for VAPI, Tavus, TextMagic, or other providers
- Error counts or recent failures

The sync status indicator exists only on the Sales Dashboard page (`data-testid="sync-status-indicator"`) showing "Warehouse" or "VinSolutions Live" badge with sync age. This information is not surfaced in the Integrations management area where an admin would expect to find it.

**Impact:** An admin checking integration health has no centralized view. They must visit the Sales page to check VIN sync status, and there's no visibility into other provider connections.

---

### F-INT-07: API integration cards are hardcoded, not reflecting actual configuration
**Severity: LOW**

The tool cards are defined as a static array `defaultToolCards` in `settings.tsx:330-337`:
- CRM Integration (VIN Solutions) — disabled, locked
- Voice Calling (VAPI) — disabled, locked
- Video Calling (Tavus) — disabled, locked
- Authentication (Google Auth) — disabled, locked
- SMS & Text Sending (TextMagic) — enabled, unlocked
- Document Generator — enabled, unlocked

These are defaults that do not reflect the actual backend integration state. Whether VIN Solutions is actually configured for a given org is checked separately via `/api/integrations/{orgId}/vin-config`, but the card always shows "disabled, locked" regardless.

**Impact:** Users see a misleading representation of their integration status. A dealership with active VIN Solutions integration would still see it as "disabled" in the tools view.

---

### F-INT-08: VIN Lead Config section is a collapsed details element under the CRM card
**Severity: LOW**

The VIN Solutions configuration (default sales rep selector) is buried inside a `<details>` accordion labeled "Default VIN Sales Rep" within the CRM card's "Dealer Provisioning" section. It requires:
1. Reaching the API tab (which currently fails — see F-INT-04)
2. Finding the CRM Integration card
3. Expanding the "Default VIN Sales Rep" accordion
4. Selecting a user from the dropdown

The dropdown correctly shows "VIN integration not configured" when no VIN config exists for the org, and loads VIN users when it does. This is functional but deeply buried.

**Impact:** Low discoverability. An admin setting up VIN integration lead routing may not find this control.

---

### F-INT-09: `?section=tools` URL parameter doesn't auto-drill into Tools section
**Severity: LOW**

Navigating to `/settings/system?section=tools` should auto-open the Tools & Integrations detail view (code at `settings.tsx:966-972` reads the `section` param and calls `setActiveSection`). In practice, the page renders the tile grid landing instead of drilling into Tools. The `useEffect` that reads the param may fire before the component fully mounts, or may be overridden by another state update.

**Impact:** Deep links to specific settings sections don't work as expected.

---

## Summary Table

| ID | Finding | Severity |
|-----|---------|----------|
| F-INT-01 | Session loss on full page navigation / direct URL | HIGH |
| F-INT-02 | System sidebar navigation unstable — panel cycling | HIGH |
| F-INT-03 | Tools tile click blocked by overlapping elements | MEDIUM |
| F-INT-04 | Tab switching fails — content doesn't update | MEDIUM |
| F-INT-05 | MCP tab shows unhelpful "backend configuration" message | LOW |
| F-INT-06 | No sync/connection health indicators in Integrations | MEDIUM |
| F-INT-07 | Integration cards are hardcoded, not reflecting actual state | LOW |
| F-INT-08 | VIN config buried in nested accordions | LOW |
| F-INT-09 | URL section parameter doesn't auto-drill | LOW |

---

## Cross-Screen Consistency

- The org name in the header ("Serra Honda") was consistent across navigation
- The sidebar items were consistent with the user's role (org_admin for serra_honda)
- When logged in as duane.wells (super_admin), "Manage" appeared in the sidebar and "Huminic" showed as org — consistent with RBAC expectations
- The session instability means cross-screen consistency is hard to evaluate fully

---

## Verdict

**FAIL**

Rationale:
- Two HIGH severity findings (F-INT-01, F-INT-02) make the Integrations section effectively unreachable through normal navigation
- Even when reached, the tab switching (F-INT-04) prevents users from viewing the actual integration cards (VIN Solutions, VAPI, Tavus, etc.)
- The section cannot be reliably demonstrated to a user, admin, or during a live walkthrough
- The underlying issues (session management on page reload, sub-panel/main content routing conflicts) are systemic and affect the entire Settings section, not just Integrations

---

## Evidence Files

| File | Description |
|------|-------------|
| eval-int-03-settings-system.png | Settings page with MCP/API tabs (reached via direct goto) |
| eval-int-04-system-page.png | 404 after clicking System sidebar |
| eval-int-18-system-submenu.png | System Settings sub-panel with tile grid |
| eval-int-22-tools-js-click.png | Settings tile grid (successful reach via JS click) |
| eval-int-27a-settings-landing.png | Settings landing page |
| eval-int-27b-after-tile-click.png | Tools detail view with MCP/API tabs |
| eval-int-30-mcp-tab.png | MCP tab — "No MCP tools configured" |
| eval-int-31-api-tab.png | API tab — still showing MCP content (tab switch failed) |
| eval-int-32-other-tab.png | Other tab — session lost, login page shown |
