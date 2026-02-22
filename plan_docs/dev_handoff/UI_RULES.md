# Nexxus Connect - UI Rules

**Version:** 1.0
**Last Updated:** February 2026

This document defines the behavioral rules, interaction patterns, and UX constraints that govern every element in the Nexxus Connect interface. All developers must follow these rules when building or modifying any UI component.

---

## 1. Interaction Rules

### 1.1 Hover Behavior

| Rule | Specification |
|---|---|
| **R-HOVER-01** | All interactive cards, list items, and clickable rows must use the `hover-elevate` CSS class. |
| **R-HOVER-02** | Never use `hover:scale-*` transforms. They cause layout shift and overflow bugs. |
| **R-HOVER-03** | Hover overlays use pseudo-elements (`::after`), not `background-color` transitions on the element itself. |
| **R-HOVER-04** | Buttons use the shadcn default hover behavior (built-in to Button component), which already integrates with the elevation system. |
| **R-HOVER-05** | Hover states must be visually distinguishable but subtle. The elevation system provides `rgba(0,0,0,0.03)` (light) or `rgba(255,255,255,0.04)` (dark) overlays. |

### 1.2 Click Behavior

| Rule | Specification |
|---|---|
| **R-CLICK-01** | All clickable elements must have `cursor-pointer` (applied via button elements or explicit class). |
| **R-CLICK-02** | Clicking a sidebar item navigates to the page AND sets `activePanel` to the item's ID. It does NOT auto-pin the sub-menu. |
| **R-CLICK-03** | Clicking the sub-menu toggle arrows (ChevronsRight) pins/unpins the sub-menu globally via `subMenuExpanded`. |
| **R-CLICK-04** | Clicking a sub-menu panel's collapse button (ChevronLeft) closes the panel AND un-pins the global sub-menu state. |
| **R-CLICK-05** | All simulated actions (save, delete, send, call, schedule, upload) must show a toast notification confirming the action. |

### 1.3 Focus Behavior

| Rule | Specification |
|---|---|
| **R-FOCUS-01** | Focus rings use `ring-ring` color (Blue 500 in light, Blue 400 in dark). |
| **R-FOCUS-02** | Clicking a chat suggestion must populate the input AND focus it. |
| **R-FOCUS-03** | Modal open should focus the first interactive element inside. |

---

## 2. Navigation Rules

### 2.1 Sidebar

| Rule | Specification |
|---|---|
| **R-NAV-01** | Navigation order is fixed: Main → Insights → Agents → Hub → Drive → (Settings) → Logout. |
| **R-NAV-02** | Only one sidebar item can be "active" at a time (based on current route). |
| **R-NAV-03** | The sub-menu toggle arrows (ChevronsRight) must only appear on pages that have sub-menus. They are hidden on the Home page. |
| **R-NAV-04** | Settings is hidden from the sidebar when `currentRole === 'org_staff'`. |
| **R-NAV-05** | The sidebar is always 64px wide. It can collapse to 40px via the hide button, but never expands beyond 64px. |

### 2.2 Sub-Menu Panel

| Rule | Specification |
|---|---|
| **R-SUB-01** | The sub-menu panel is a fixed-position overlay (not in document flow). Position: `left-16 top-14 z-40`. |
| **R-SUB-02** | Hover-to-show uses an 800ms leave timeout on the sidebar, and a 1500ms leave timeout on the panel itself. |
| **R-SUB-03** | When pinned (`subMenuExpanded === true`), the sub-menu stays visible across all page navigations. |
| **R-SUB-04** | When the window resizes below 1024px (lg breakpoint), the sub-menu auto-collapses and `subMenuExpanded` is set to false. |
| **R-SUB-05** | Each page has distinct sub-menu content. The panel renders based on `activePanel` ID matching. |

### 2.3 Routing

| Rule | Specification |
|---|---|
| **R-ROUTE-01** | Use `wouter`'s `useLocation` hook for navigation. Never use `window.location` directly. |
| **R-ROUTE-02** | Tab-based sub-views use query parameters (e.g., `/insights?tab=reports`, `/work-center?tab=leads`). |
| **R-ROUTE-03** | Profile sub-pages use distinct routes (`/profile`, `/profile/preferences`, `/profile/billing`) all rendering `ProfilePage`. |
| **R-ROUTE-04** | The 404 page catches all unmatched routes via `<Route component={NotFound} />` at the end of the Switch. |

---

## 3. Chat Interface Rules

| Rule | Specification |
|---|---|
| **R-CHAT-01** | Bot messages are ALWAYS left-aligned. User messages are ALWAYS right-aligned. |
| **R-CHAT-02** | No avatars, icons, or sender labels on chat messages. The alignment indicates who sent the message. |
| **R-CHAT-03** | Bot messages use `bg-card border border-border`. User messages use `bg-primary text-primary-foreground`. |
| **R-CHAT-04** | All chat bubbles use `rounded-xl` (12px radius). |
| **R-CHAT-05** | Max width for chat bubbles is 80-85% of the container. |
| **R-CHAT-06** | The typing indicator uses exactly 3 wave-dots with staggered delays (0s, 0.15s, 0.3s). |
| **R-CHAT-07** | Simulated response delay is 1.5s for Automa, 1.8s for agent-specific chats. |
| **R-CHAT-08** | The chat input always has a glowing gradient border (purple→blue→cyan→purple, 8s animation cycle). |
| **R-CHAT-09** | Enter sends the message. Shift+Enter inserts a newline. |
| **R-CHAT-10** | The send button is disabled when the input is empty or whitespace-only. |
| **R-CHAT-11** | Chat auto-scrolls to the bottom when new messages are added. |
| **R-CHAT-12** | Chat input placeholder is context-specific: "Ask Automa anything..." or "Ask [Agent Name] anything..." |

---

## 4. RBAC Rules

| Rule | Specification |
|---|---|
| **R-RBAC-01** | The role switcher is a temporary dev tool. It appears as a tiny chevron-down arrow on the far right of the TopBar (hidden on small screens). |
| **R-RBAC-02** | Changing roles immediately updates all role-dependent UI (metric tiles, settings visibility, sidebar items). |
| **R-RBAC-03** | Role is persisted to `localStorage` key `nexxus-current-role`. |
| **R-RBAC-04** | The Settings sidebar item uses `canAccessSystem(role)` to determine visibility. Returns false only for `org_staff`. |
| **R-RBAC-05** | Settings tiles within the settings page have individual role gates. Hidden tiles do not leave empty spaces (grid auto-fills). |
| **R-RBAC-06** | Metric tile content on the Home page changes entirely based on role (different labels, values, and gradients per role). |
| **R-RBAC-07** | Organization switching uses `canSwitchOrgs(role)`. Returns true for `super_admin` and `partner_admin` only. However, the org switcher dropdown is always visible to all roles (it just shows available orgs). |

---

## 5. Favorites Rules

| Rule | Specification |
|---|---|
| **R-FAV-01** | Every page has a star toggle that adds/removes the current page from favorites. |
| **R-FAV-02** | On desktop, favorites appear in the `FavoritesBar` (hidden on mobile via `hidden lg:flex`). |
| **R-FAV-03** | On mobile, favorites appear inside the `MobileNavDropdown` as a separate section below sub-menu items. |
| **R-FAV-04** | Clicking a favorited page's chip in the FavoritesBar navigates to it. Clicking the chip for the CURRENT page unfavorites it instead. |
| **R-FAV-05** | The star icon is filled yellow (`fill-yellow-400 text-yellow-400`) when favorited, and empty gray (`text-muted-foreground/40`) when not. |
| **R-FAV-06** | Favorites persist during the session but reset on page reload (no localStorage in prototype). |
| **R-FAV-07** | Default favorites on app load: "Insights Dashboard" (`/insights`) and "Hub Calendar" (`/work-center`). |

---

## 6. Modal Rules

| Rule | Specification |
|---|---|
| **R-MODAL-01** | Modals use the shadcn Dialog component (Radix AlertDialog or Dialog). |
| **R-MODAL-02** | All modals have a close button (X) in the top-right corner or a Cancel button. |
| **R-MODAL-03** | Modals center vertically and horizontally on the viewport. |
| **R-MODAL-04** | Clicking the backdrop overlay closes the modal. |
| **R-MODAL-05** | Destructive actions in modals use the destructive button variant (red). |
| **R-MODAL-06** | Action buttons are right-aligned: Cancel (outline/ghost) on the left, Primary action on the right. |
| **R-MODAL-07** | After a successful modal action (save, send, delete), close the modal AND show a toast. |

---

## 7. Toast Rules

| Rule | Specification |
|---|---|
| **R-TOAST-01** | All simulated backend actions show a toast notification. |
| **R-TOAST-02** | Toasts appear in the bottom-right corner. |
| **R-TOAST-03** | Toasts auto-dismiss after the default timeout. |
| **R-TOAST-04** | Success toasts use the default variant. Error/destructive toasts use the destructive variant. |
| **R-TOAST-05** | Toast messages should be concise: "[Action] - [Brief result]" (e.g., "Settings saved - Your changes have been applied.") |
| **R-TOAST-06** | The `useToast` hook is imported from `@/hooks/use-toast`. |

---

## 8. Responsive Rules

| Rule | Specification |
|---|---|
| **R-RESP-01** | The app uses a mobile-first approach with Tailwind breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px). |
| **R-RESP-02** | Desktop tab rows (Insights, Hub, Profile, Settings) use `hidden lg:flex`. They are hidden on mobile. |
| **R-RESP-03** | The `MobileNavDropdown` component replaces desktop tabs on mobile. It uses `lg:hidden` to show only on small screens. |
| **R-RESP-04** | The Agents list panel (left side) uses `hidden lg:block`. On mobile, an agent selector dropdown replaces it. |
| **R-RESP-05** | The sub-menu panel auto-collapses below 1024px and is not available on mobile. |
| **R-RESP-06** | Desktop (md+): Right Pane opens as a side-by-side panel (w-80/lg:w-96) to the RIGHT of main content — both visible simultaneously. Mobile (<md): Right Pane opens as a full-screen overlay (`fixed inset-0 z-50`). |
| **R-RESP-07** | Grid layouts adapt responsively: `grid-cols-1` → `sm:grid-cols-2` → `lg:grid-cols-3` → `xl:grid-cols-4`. |
| **R-RESP-08** | The role switcher (tiny arrow) is hidden on small screens via `hidden sm:flex`. |
| **R-RESP-09** | The FavoritesBar is desktop-only (`hidden lg:flex`). |
| **R-RESP-10** | All page padding adjusts: `px-4 sm:px-6 lg:px-8` or similar progressive pattern. |

---

## 9. Accessibility Rules

| Rule | Specification |
|---|---|
| **R-A11Y-01** | All interactive elements must have a `data-testid` attribute following the pattern `{action}-{target}` or `{type}-{content}-{id}`. |
| **R-A11Y-02** | Icons used as standalone buttons must have either a tooltip or an `aria-label`. |
| **R-A11Y-03** | Color must never be the sole indicator of state. Always pair with text, icons, or badges. |
| **R-A11Y-04** | Focus must be visible on all interactive elements (via ring styles). |
| **R-A11Y-05** | Modals must trap focus while open. |

---

## 10. Performance Rules

| Rule | Specification |
|---|---|
| **R-PERF-01** | No external network requests in the prototype. All data is synchronous mock data. |
| **R-PERF-02** | Charts use `ResponsiveContainer` to avoid layout recalculation on resize. |
| **R-PERF-03** | ScrollArea (Radix) is used for all scrollable containers instead of native overflow scroll. |
| **R-PERF-04** | Large lists should consider virtualization in production (not required in prototype). |
| **R-PERF-05** | Timeouts (hover, typing simulation) must be cleaned up in useEffect return functions or via refs. |

---

## 11. Data-TestID Naming Convention

| Element Type | Pattern | Examples |
|---|---|---|
| Buttons | `button-{action}` | `button-send-message`, `button-toggle-favorite` |
| Inputs | `input-{field}` | `input-chat-message`, `input-search` |
| Dropdowns | `dropdown-{name}` | `dropdown-org-switcher`, `dropdown-mobile-nav` |
| Menu items | `menu-item-{name}` | `menu-item-profile`, `menu-item-billing` |
| Sidebar items | `sidebar-item-{id}` | `sidebar-item-agents`, `sidebar-item-drive` |
| Panel items | `panel-{type}-{id}` | `panel-agent-agent-1`, `panel-favorite-fav-1` |
| Cards/rows | `{type}-{entity}-{id}` | `notification-item-n1`, `activity-item-a1` |
| Tabs | `tab-{name}` | `tab-dashboard`, `tab-reports` |
| Suggestions | `suggestion-{index}` | `suggestion-0`, `suggestion-1` |
