# Nexxus V2 — Responsive Behavior Specifications

Breakpoint behavior, touch targets, and mobile-specific patterns for every layout in the application.

---

## 7A. Breakpoint Behavior Table

### Core Layout

| Element | xl (1280+) | lg (1024-1279) | md (768-1023) | sm (<768) |
|---------|-----------|----------------|---------------|-----------|
| Sidebar | Fixed, 64px icon strip | Fixed, 64px icon strip | Hidden, hamburger menu | Hidden, hamburger menu |
| Sub-menu panel | Overlay or pinned (user toggle) | Overlay or pinned | Hidden, MobileNavDropdown | Hidden, MobileNavDropdown |
| TopBar | Full width, all controls visible | Full width, all controls | Full width, condensed | Full width, hamburger + logo + profile |
| Content area | Full width minus sidebar (minus sub-menu if pinned) | Full width minus sidebar | Full width | Full width |
| Right pane (Automa) | Side-by-side panel (w-96, 384px) | Side-by-side panel (w-80, 320px) | Full-screen overlay (fixed inset-0 z-50) | Full-screen overlay (fixed inset-0 z-50) |

### Main Page

| Element | xl (1280+) | lg (1024-1279) | md (768-1023) | sm (<768) |
|---------|-----------|----------------|---------------|-----------|
| Metric tiles | 4 columns | 4 columns | 2 columns | 1 column |
| Chat input | Centered, max-width ~700px | Centered, max-width ~600px | Full width with padding | Full width with padding |
| Suggestion bubbles | Horizontal row | Horizontal row | Horizontal scroll | Vertical stack or scroll |

### Insights Page

| Element | xl (1280+) | lg (1024-1279) | md (768-1023) | sm (<768) |
|---------|-----------|----------------|---------------|-----------|
| Dashboard charts | 2-column grid | 2-column grid | Single column stack | Single column stack |
| Command Center metrics | 4-column row | 3-column row | 2-column grid | 1-column stack |
| Library metric cards | 3-column grid | 2-column grid | 2-column grid | 1-column stack |
| Tab bar | All tabs visible | All tabs visible | Scrollable tab bar | Scrollable tab bar |
| Reports table | All columns | Priority columns | Horizontal scroll | Card view per row |

### Agents Page

| Element | xl (1280+) | lg (1024-1279) | md (768-1023) | sm (<768) |
|---------|-----------|----------------|---------------|-----------|
| Agent list panel | Visible, 272px fixed | Visible, 272px fixed | Hidden, MobileNavDropdown | Hidden, MobileNavDropdown |
| Agent detail | Remaining width | Remaining width | Full width | Full width |
| Agent config (right pane) | Inline panel toggle | Inline panel toggle | Sheet overlay | Sheet overlay |
| Chat interface | Within detail panel | Within detail panel | Full width | Full width |

### Hub Page

| Element | xl (1280+) | lg (1024-1279) | md (768-1023) | sm (<768) |
|---------|-----------|----------------|---------------|-----------|
| Tab bar | All 4 tabs visible | All 4 tabs visible | Scrollable | Scrollable |
| Calendar grid | Full month view | Full month view | Week view | Day/list view |
| Leads table | All columns | Priority columns | Horizontal scroll | Card view |
| Communication inbox | Split list/detail | Split list/detail | List only, tap for detail | List only, tap for detail |

### Drive Page

| Element | xl (1280+) | lg (1024-1279) | md (768-1023) | sm (<768) |
|---------|-----------|----------------|---------------|-----------|
| File grid | 4-5 columns | 3-4 columns | 2-3 columns | 1-2 columns |
| File list/table | All columns | Priority columns | Horizontal scroll | Card view |
| Action buttons | All visible | All visible | Overflow menu | Overflow menu |
| Upload area | Full width panel | Full width panel | Full width | Full width |

### Settings Page

| Element | xl (1280+) | lg (1024-1279) | md (768-1023) | sm (<768) |
|---------|-----------|----------------|---------------|-----------|
| Settings tiles | 3-column grid | 3-column grid | 2-column grid | 1-column stack |
| Widget config tabs | All tabs horizontal | All tabs horizontal | Scrollable tabs | Scrollable tabs |
| Form layout | 2-column where applicable | 2-column | Single column | Single column |

### Profile Page

| Element | xl (1280+) | lg (1024-1279) | md (768-1023) | sm (<768) |
|---------|-----------|----------------|---------------|-----------|
| Profile form | 2-column layout | 2-column layout | Single column | Single column |
| Tab bar | 3 tabs horizontal | 3 tabs horizontal | 3 tabs horizontal | 3 tabs (may scroll) |
| Billing cards | 2-column | 2-column | Single column | Single column |

### Widget Landing Page (/w/demo)

| Element | xl (1280+) | lg (1024-1279) | md (768-1023) | sm (<768) |
|---------|-----------|----------------|---------------|-----------|
| Channel cards | 3-column grid | 3-column grid | 2-column grid | 1-column stack |
| Contact form | Centered, max-w-md | Centered, max-w-md | Full width padded | Full width padded |
| Header | Full width, centered text | Full width | Full width | Full width, smaller text |

---

## 7B. Touch Targets

### Mobile (< 768px) Requirements

| Rule | Specification |
|------|--------------|
| Minimum touch target size | 44x44px (per WCAG 2.5.5) |
| Minimum spacing between targets | 8px |
| Button padding minimum | `py-2.5 px-4` (10px vertical, 16px horizontal) |
| Icon button minimum | 44x44px hit area (even if icon is 16-20px) |
| List row minimum height | 48px (for tap targets) |
| Toggle/switch tap area | 44x44px around the switch control |

### Swipe Gestures

| Gesture | Action | Context |
|---------|--------|---------|
| Swipe right | Open sidebar / sub-menu | Main content area (future enhancement) |
| Swipe left | Close sidebar / sub-menu | Sidebar overlay (future enhancement) |
| Swipe down | Pull to refresh | List views (future enhancement) |

**Note**: No swipe gestures are currently implemented. All navigation is via tap.

---

## 7C. Mobile-Specific Pattern Transformations

| Desktop Pattern | Mobile Transform |
|----------------|-----------------|
| Dropdown menus | Bottom sheets (via Radix Sheet, side="bottom") |
| Modal dialogs (small) | Full-width dialog with larger padding |
| Modal dialogs (large) | Full-screen or bottom sheet |
| Side panels (right pane) | Full-screen overlay (`fixed inset-0 z-50`) with close button |
| Horizontal tab bar | Horizontally scrollable tab bar |
| Multi-column forms | Single column, stacked fields |
| Data tables | Card stacks with key fields visible |
| Sidebar navigation | Hidden, accessed via hamburger + MobileNavDropdown |
| Sub-menu panels | MobileNavDropdown (unified mobile navigation) |
| Split list/detail views | Full-width list → tap to navigate to detail (back button) |
| Hover tooltips | Tap to show (long-press) or replaced by visible labels |
| Context menus (right-click) | Long-press or overflow (MoreVertical) button |

### Data Table → Card Transformation

When tables transform to cards on mobile, show these fields:

**Leads Table**:
- Card shows: Name (bold), Phone, Status badge, Date
- Hidden: Email, Source, Score, Notes

**File List**:
- Card shows: Icon + Name (bold), Size, Modified date
- Hidden: Type column, Owner

**Metrics Library**:
- Card shows: Name (bold), Value (large), Category badge
- Hidden: Description, Trend data (shown on tap/expand)

---

## 7D. Mobile Navigation Architecture

### MobileNavDropdown Component
- Trigger: Hamburger menu icon (`button-show-sidebar`) in TopBar
- Content: Full navigation + sub-menu items + favorites
- Close: X button or tap outside
- Z-index: z-50 (above all content)

### Right Pane (Automa Chat)
- **Desktop (md+):** Opens as a fixed-width side panel (w-80 / lg:w-96) to the RIGHT of main content. Both main content and pane are visible simultaneously. Uses `border-l border-border` separator. Close via ChevronsRight button (`button-close-right-pane`).
- **Mobile (<md):** Opens as full-screen overlay (`fixed inset-0 z-50 bg-background`). Covers entire viewport. Close via ChevronsRight button (`button-close-right-pane-mobile`).

### Mobile Bottom Sheet Specs
- Max height: 85vh
- Handle bar at top (visual drag indicator)
- Snap points: 50%, 85% (if applicable)
- Backdrop: semi-transparent black overlay
- Border radius: `rounded-t-2xl` (16px top corners)
