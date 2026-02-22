# Nexxus V2 — Pattern Library

Recurring UI patterns used across multiple pages. Build these once, reuse everywhere.

---

## 4A. List + Detail Pattern

Used in: **Agents**, **Drive**, **Hub Communication**, **Insights Library**

### Desktop Layout
- **Split**: List panel (272px fixed) | Detail panel (remaining width)
- **List panel**: Scrollable list with search input at top
- **Detail panel**: Full content view of selected item
- **Selection indicator**: Background accent color (`bg-accent`), left border accent on Agents

### List Row Contents
- Avatar/icon (optional) + Title (font-medium) + Subtitle (text-muted-foreground text-xs) + Status badge (right-aligned) + Timestamp (text-xs text-muted-foreground)

### Mobile Behavior
- List panel hidden (shown via MobileNavDropdown)
- Detail view takes full width
- Back button (ArrowLeft) returns to list context via dropdown

### Agents-Specific
- List panel: 272px, desktop only, with agent search + "New Agent" button
- Detail center: Agent detail with chat interface
- Config toggles via right pane (<< / >> button)

---

## 4B. Form Pattern

Used in: **Settings**, **Profile**, **Widget Config**, **Agent Config**, **Landing Pages**, **Org Wizard**, **Billing Config**

### Label Position
- Labels **above** inputs (block layout)
- `text-sm font-medium text-foreground` for labels

### Required Fields
- Asterisk (*) after label text in red

### Error Display
- Below field, `text-xs text-destructive`
- Red border on input (`border-destructive`)
- Connected via `aria-describedby`

### Form Section Grouping
- Card per section in Settings (tile-based grid)
- Dividers (`<Separator />`) between form groups within a card
- Tab-based sections for multi-panel forms (widget config: Settings/Appearance/Targeting/Domains/Embed)

### Button Placement
- Right-aligned within card/section
- Primary action (Save) + Secondary action (Cancel) side by side
- `gap-2` between buttons

### Unsaved Changes
- No explicit unsaved indicator in current mockup
- Future: dot on tab or dialog on navigate away

### Form Field Gap
- `space-y-4` (16px) between form fields
- `space-y-6` (24px) between form sections

---

## 4C. Table Pattern

Used in: **Insights Library**, **Drive file list**, **Hub Open Leads**

### Header Style
- Sticky on vertical scroll
- Sortable columns: chevron icon (ChevronDown/ChevronUp) in header
- Text: `text-xs font-medium text-muted-foreground uppercase tracking-wider`

### Row Treatment
- Hover: `hover-elevate` (subtle background overlay)
- Default row height: `table-row-compact` (min-height: 32px, padding: 8px 12px)
- Font: `density-data` (13px)

### Selection
- Checkbox column on left (when applicable, e.g., Drive)
- Bulk action bar appears above table when rows selected

### Pagination
- Currently: client-side with all data loaded
- Future: pagination component at bottom or infinite scroll

### Column Density
- Compact by default (`density-data`)
- Priority columns visible on smaller screens, overflow columns hidden

### Empty State
- Centered in table body area
- Icon + "No items found" heading + "Try adjusting your filters" subtext + CTA button

### Loading State
- Skeleton rows matching column layout
- 5-8 skeleton rows with pulse animation

---

## 4D. Card Grid Pattern

Used in: **Settings tiles**, **Main page metric tiles**, **Widget list**, **Dashboard cards**

### Grid Columns Per Breakpoint
| Breakpoint | Settings Tiles | Metric Tiles | Widget Cards |
|------------|---------------|--------------|--------------|
| xl (1280+) | 3 columns | 4 columns | 2 columns |
| lg (1024+) | 3 columns | 4 columns | 2 columns |
| md (768+) | 2 columns | 2 columns | 1 column |
| sm (<768) | 1 column | 1 column | 1 column |

### Card Specifications
- **Minimum width**: 280px (settings tiles), 200px (metric tiles)
- **Internal padding**: `p-4` to `p-6` (16-24px)
- **Border**: `border border-border` (1px solid)
- **Border radius**: `rounded-lg` (8px)
- **Background**: `bg-card` (card surface color)

### Card Hover Treatment
- `hover-elevate` overlay (subtle darkening/lightening)
- `cursor-pointer` when clickable
- Settings tiles: navigate to section on click

### Card Selected State
- Border changes to `border-primary`
- Background: `bg-accent`

### Gap
- `gap-4` (16px) between cards in grid
- `gap-6` (24px) for settings tile grid

---

## 4E. Metric Display Pattern

Used in: **Main page metric tiles**, **Insights Dashboard Command Center**, **Insights Scorecard**

### Large Number Formatting
- Font: `text-2xl` to `text-3xl`, `font-bold`
- Currency: `$` prefix + value + K/M suffix (e.g., "$1.2M")
- Percentage: value + `%` suffix (e.g., "42%")
- Time: value + unit suffix (e.g., "2.3 hrs", "45 min")
- Count: integer with comma separator (e.g., "1,234")
- Ratio: decimal to 1-2 places (e.g., "3.8")

### Trend Indicator
- Arrow icon: `TrendingUp` (green) or `TrendingDown` (red)
- Percentage change: `text-xs` next to arrow
- Color: `text-green-500` for positive, `text-red-500` for negative
- Flat: no arrow, `text-muted-foreground`

### Gradient Backgrounds (Main Page Only)
- Role-specific gradient colors on metric tile backgrounds
- Subtle opacity for text readability

### Click Behavior
- Main page metrics: no drill-down (display only)
- Insights Library metrics: click opens MetricDetailDialog
- Insights Dashboard: click navigates to detail view

### Loading Skeleton
- Rounded rectangle matching number size
- Smaller rectangle below for label
- Pulse animation (`animate-pulse`)

---

## 4F. Notification / Alert Pattern

Used in: **Toast notifications**, **Notification dropdown**, **Inline warnings**

### Toast Notifications
- **Position**: Top-right (Toaster component from sonner)
- **Stack direction**: Newest on top
- **Types**: success (green CheckCircle), error (red AlertCircle), warning (amber AlertTriangle), info (blue Info)
- **Auto-dismiss**: 3 seconds for success/info, 5 seconds for warning, persistent for error
- **Action buttons**: Optional "Undo" or "Retry" within toast

### Notification Dropdown
- Bell icon in TopBar with red dot for unread count
- Dropdown width: 320px (w-80)
- Each item: icon + title + description + relative timestamp
- Scrollable list, max-height ~400px

### Inline Warnings / Banners
- Full-width within section
- Icon (left) + message text + optional action button (right)
- Types match toast types with same color coding
- Dismissible via X button (right side)

### Error Recovery
- API errors: Error card with AlertCircle icon + message + "Retry" button
- Form errors: red border on field + error text below + focus on first invalid field
- Network errors: gray banner "You're offline" at top

---

## 4G. Sub-Menu Pattern

Used in: **All pages with sub-menus** (Agents, Drive, Insights, Settings, Profile, Hub)

### Hover Preview Behavior
1. Mouse enters sidebar icon → sub-menu appears as overlay (z-40)
2. 800ms leave timeout before hiding
3. Mouse enters sub-menu panel → timeout cancelled, stays open

### Pin Behavior
1. Double-arrow toggle under logo toggles `subMenuExpanded` globally
2. When pinned: sub-menu pushes content right (not overlay)
3. Collapse button (ChevronLeft) in sub-menu header unpins

### Sub-Menu Panel Specs
- Position: `fixed left-16 top-14 z-40`
- Width: varies by page (typically 200-280px)
- Background: `bg-card`
- Border: `border-r border-border`
- Contains: section title, navigation links, favorites section

### Tab Switching via Custom Events
When the user is already on a page (e.g., `/insights`) and clicks a sub-menu tab link (e.g., Reports), wouter's `setLocation` won't detect query-param-only changes. The workaround pattern:
1. Check if already on the target route (e.g., `location.startsWith('/insights')`)
2. If yes: use `window.history.replaceState(null, '', targetPath)` to update the URL
3. Dispatch a custom event: `window.dispatchEvent(new CustomEvent('insights-tab-change', { detail: tabId }))`
4. Update local state (`setActiveInsightsTab(tabId)`) to re-render active highlight
5. The target page listens for this event in a `useEffect` and updates its own tab state

Events in use:
- `insights-tab-change` — listened by `insights.tsx`
- `hub-tab-change` — listened by `work-center.tsx`

### Active Tab Highlighting
Sub-menu items for Insights and Hub use local state (`activeInsightsTab`, `activeHubTab`) rather than `window.location.search` for active styling. This ensures the highlight re-renders immediately on click without waiting for a route change.

### Chat History Hover Menu
Home sub-menu "Message History" items have a hover-reveal 3-dot menu:
- Trigger: `MoreVertical` icon, `opacity-0 group-hover:opacity-100`
- Menu items: "Resume" (Play icon) and "Delete" (Trash2 icon, `text-destructive`)
- Uses `e.stopPropagation()` on menu trigger and items to prevent parent click

### Timeout Cleanup
Both `Sidebar.tsx` and `SubMenuManager.tsx` use `useRef` for hover-leave timeouts. Both include `useEffect` cleanup that clears the timeout ref on unmount to prevent state updates on unmounted components.

### Mobile
- Sub-menus rendered via MobileNavDropdown (full-width overlay)
- Accessible via hamburger menu

---

## 4H. Settings Tile Pattern

Used in: **System Settings page**

### Tile Grid Layout
- `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Each tile: Card with icon + title + description
- Click navigates to section detail view

### Role Gating
- Tiles visible based on `currentRole`:
  - `super_admin`: All tiles
  - `partner_admin`: All except system-level
  - `org_admin`: Org-level tiles + Tools & Integrations
  - `staff`: Profile only

### Tile Content
- Icon (24px, `text-muted-foreground`) top-left
- Title: `text-base font-semibold`
- Description: `text-sm text-muted-foreground`
- Optional badge for count/status

### Back Navigation
- "Back to Settings" button (ArrowLeft + text) at top of detail view
- Returns to tile grid

---

## 4I. Multi-Step Wizard Pattern

Used in: **Org Creation Wizard**

### Layout
- **Step Indicator**: Horizontal numbered circles connected by lines at the top
  - Completed: Primary color filled circle with checkmark
  - Current: Primary color ring (outline only)
  - Future: Muted gray circle
- **Content Area**: Card containing form fields for current step
- **Navigation**: Back/Next buttons at bottom, Next validates required fields

### Step Validation
- Required fields checked on Next click
- Red border + "Required" text on invalid fields
- Next button disabled until required fields filled (or shows validation error)

### Mobile Behavior
- Steps stack vertically or wrap as needed
- Same card layout but full-width
- Back/Next buttons stick to bottom

### Review Step (Final)
- Summary of all entered data organized by step
- Key-value pair layout with section headers
- Validation warnings for any missing required fields
- Primary action button ("Create Organization")

---

## 4J. Grayed/Locked State Pattern

Used in: **Security**, **Data Health**, **Tool Cards (locked)**

### Visual Treatment
- `opacity-50` on the entire row/card
- `cursor-not-allowed` on interactive elements
- Toggle switches in ON position but non-interactive
- No hover effects applied
- Muted text color for values

### Purpose
- Shows feature exists but is not configurable in demo mode
- Demonstrates default production state
- Prevents accidental modification

---

## 4K. Tab-Based Settings Pattern

Used in: **Tools & Integrations**, **Knowledge Base**, **AI Configuration**, **Data Management**

### Tab Structure
- Tab buttons in a horizontal row below the section header
- Active tab: primary text color, underline indicator
- Inactive tabs: muted text, no underline
- RBAC-filtered: some tabs only visible to certain roles

### Content Area
- Each tab renders its own content below the tab bar
- Content transitions on tab click (no animation, instant swap)
- Tab state stored in local component state (not URL)

### Role Gating
- Tabs can be conditionally rendered based on currentRole
- Example: "API Keys" and "Webhooks" only visible to Super Admin
- Example: "Skills" tab only visible to Super Admin in AI Config
