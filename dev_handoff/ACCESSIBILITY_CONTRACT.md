# Nexxus V2 — Accessibility Contract

ARIA requirements, focus management, keyboard shortcuts, and contrast requirements for the entire application.

---

## 8A. ARIA Requirements Per Component Type

### Buttons
- `aria-label` on icon-only buttons (e.g., theme toggle, close, send)
- `aria-disabled="true"` when disabled (in addition to HTML `disabled`)
- `aria-pressed` on toggle buttons (favorites, theme, status toggles)
- `aria-expanded` on buttons that open dropdowns/menus

### Inputs
- `aria-label` or `aria-labelledby` linking to visible label
- `aria-describedby` linking to error messages and help text
- `aria-invalid="true"` when validation fails
- `aria-required="true"` on required fields

### Modals / Dialogs
- `role="dialog"` (provided by Radix Dialog)
- `aria-modal="true"`
- `aria-labelledby` pointing to DialogTitle
- `aria-describedby` pointing to DialogDescription

### Tabs
- `role="tablist"` on container (provided by Radix Tabs)
- `role="tab"` on each tab trigger
- `role="tabpanel"` on each tab content
- `aria-selected="true"` on active tab

### Alerts & Notifications
- `role="alert"` for error messages (immediate announcement)
- `role="status"` for success messages (polite announcement)
- Toast notifications use `aria-live="polite"` (do NOT steal focus)

### Live Regions
- `aria-live="polite"` for data updates (metric refreshes, list updates)
- `aria-live="assertive"` for critical errors only
- Chat messages: new bot responses announced via `aria-live="polite"`

### Navigation
- `role="navigation"` on Sidebar and sub-menu containers
- `aria-current="page"` on active navigation item
- `aria-label` distinguishing primary nav vs sub-nav (e.g., "Main navigation", "Insights sub-menu")

### Menus
- `role="menu"` on dropdown containers (provided by Radix DropdownMenu)
- `role="menuitem"` on each menu item
- `aria-expanded` on menu trigger buttons

### Progress Indicators
- `role="progressbar"` on Progress components
- `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`
- `aria-label` describing what's progressing (e.g., "Upload progress")

### Tooltips
- `role="tooltip"` (provided by Radix Tooltip)
- Connected to trigger via `aria-describedby`
- Appear on hover AND focus (keyboard accessible)

### Charts (Recharts)
- `aria-label` on chart container describing the data
- `role="img"` on SVG chart element
- Provide text alternative (screen reader summary) for chart data

---

## 8B. Focus Management Rules

| Scenario | Focus Behavior |
|----------|---------------|
| **Tab order** | Follows visual order: left → right, top → bottom |
| **Modal open** | Focus moves to first focusable element inside modal |
| **Modal close** | Focus returns to the element that triggered the modal |
| **Sheet/Panel open** | Focus moves inside, trapped until close (focus trap) |
| **Dropdown open** | Focus on first menu item, arrow keys navigate |
| **Dropdown close** | Focus returns to trigger button |
| **Form submit with errors** | Focus moves to first invalid field |
| **Page navigation** | Focus moves to page heading (h1) or main content area |
| **Toast appear** | Focus is NOT stolen — `aria-live` announces instead |
| **Sub-menu hover** | No focus change on hover (mouse-only interaction) |
| **Sub-menu pin** | No focus change; content shifts but focus stays |
| **Command palette open** | Focus moves to search input inside palette |
| **Command palette close** | Focus returns to previous element |
| **Right pane open** | Focus moves to chat input inside pane |
| **Right pane close** | Focus returns to toggle button |

### Focus Ring Styling
- Color: `hsl(var(--ring))` — Blue 500 (light) / Blue 400 (dark)
- Width: 2px
- Offset: 2px from element edge
- Style: `ring-2 ring-ring ring-offset-2 ring-offset-background`
- Only visible on keyboard focus (`:focus-visible`), not on mouse click

---

## 8C. Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `⌘K` / `Ctrl+K` | Open command palette | Any page |
| `Escape` | Close modal / sheet / dropdown / command palette | When overlay is open |
| `Tab` | Move focus forward | Global |
| `Shift+Tab` | Move focus backward | Global |

### Component-Level Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Enter` | Submit form / confirm dialog / activate button | Forms, dialogs, buttons |
| `Space` | Toggle checkbox / switch / activate button | Toggles, checkboxes, buttons |
| `Arrow Up/Down` | Navigate menu items, table rows, list items | Dropdowns, tables, lists |
| `Arrow Left/Right` | Navigate tabs | Tab components |
| `Delete` / `Backspace` | Remove selected item (with confirmation dialog) | File list, selected items |
| `⌘S` / `Ctrl+S` | Save current form (when applicable) | Settings, profile edit |

### Navigation Shortcuts (Future Enhancement)

| Shortcut | Action |
|----------|--------|
| `G then H` | Go to Home |
| `G then I` | Go to Insights |
| `G then A` | Go to Agents |
| `G then W` | Go to Hub |
| `G then D` | Go to Drive |
| `G then S` | Go to Settings |

---

## 8D. Color Contrast Requirements

### WCAG 2.1 AA Compliance

| Element Type | Minimum Contrast Ratio | Current Implementation |
|-------------|----------------------|----------------------|
| Normal text (< 18px) | 4.5:1 | Slate 900 on white (light) = 15.4:1 ✓ / Slate 50 on Slate 900 (dark) = 15.4:1 ✓ |
| Large text (≥ 18px bold or ≥ 24px) | 3:1 | Same palette, exceeds requirement ✓ |
| UI components (borders, icons) | 3:1 | Slate 200 borders on white = 1.4:1 ⚠ (decorative only), interactive borders meet 3:1 |
| Focus indicators | 3:1 against adjacent colors | Blue 500 ring on white = 4.6:1 ✓ |
| Placeholder text | 4.5:1 (if conveying info) | Slate 500 on white = 4.6:1 ✓ |
| Status colors on white | Must pass independently | Green 500 = 3.9:1, Red 500 = 4.6:1, Amber 500 = 3.2:1 ⚠, Blue 500 = 4.6:1 |

### Color Independence Rule
- Status is never communicated by color alone
- All status badges include text labels alongside color
- All trend indicators include text ("+12%") alongside colored arrows
- Error states include icons (AlertCircle) alongside red color
- Chart data series are distinguishable by pattern/position, not just color

### Dark Mode Contrast
- All light-mode contrast ratios must also pass in dark mode
- Dark mode uses lighter variants of all colors (e.g., Blue 400 instead of Blue 500)
- Text: Slate 50 on Slate 900 background = 15.4:1 ✓
- Muted text: Slate 400 on Slate 900 = 5.2:1 ✓

---

## 8E. Accessibility Test Checklist Per Page

Apply this checklist to every page before release:

- [ ] All images have `alt` text (or `aria-hidden="true"` if decorative)
- [ ] Page has exactly one `<h1>` element
- [ ] Heading hierarchy is sequential (`h1` → `h2` → `h3`, no skips)
- [ ] All form inputs have visible labels (connected via `htmlFor`/`id` or `aria-labelledby`)
- [ ] Error messages are linked to inputs via `aria-describedby`
- [ ] Focus is visible on all interactive elements (`:focus-visible` ring)
- [ ] Tab order matches visual order
- [ ] Modals trap focus (cannot tab outside modal while open)
- [ ] Color is not the only status indicator (icons/text accompany color)
- [ ] Text resizes without breaking layout (up to 200% zoom)
- [ ] No auto-playing media
- [ ] All interactive elements have minimum 44x44px touch target on mobile
- [ ] Skip-to-content link is available (or main content is immediately after nav)
- [ ] ARIA roles match component behavior
- [ ] Dynamic content changes are announced via `aria-live` regions
