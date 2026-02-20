# Nexxus Connect - Design Contract

**Version:** 1.0
**Last Updated:** February 2026

This document defines the binding design rules, component standards, layout constraints, and visual patterns that govern the Nexxus Connect UI. Any new component, page, or feature must comply with every rule in this contract.

---

## 1. Layout Architecture

### 1.1 Shell Structure

```
┌──────────────────────────────────────────────────────────┐
│  TopBar (h-14, 56px, fixed at top, z-50)                │
├────┬──────────┬──────────────────────────────┬───────────┤
│    │          │                              │   Right   │
│ SB │ Sub-Menu │     Center Content           │   Pane    │
│64px│  (opt.)  │     (flex-1)                 │  (opt.)   │
│    │  (opt.)  │                              │           │
│    │          │                              │           │
├────┴──────────┴──────────────────────────────┴───────────┤
```

| Region | Width | Behavior |
|---|---|---|
| TopBar | Full width | Fixed height 56px (h-14). Always visible. |
| Sidebar | 64px (w-16) | Collapsible to 40px (w-10) via hide button. Scrolls internally. |
| Sub-Menu | ~240px overlay | Not in document flow (position: fixed, left-16 top-14 z-40). Hover or pin. |
| Center Content | `flex-1` | Fills remaining space. Scrolls internally. |
| Right Pane | ~320-400px | Replaces center content when open (not side-by-side). |

### 1.2 View Configurations

| Config | Route(s) | Center Layout | Right Pane |
|---|---|---|---|
| `chat-only` | `/` (Home) | Max-width 4xl, centered | Hidden (no toggle) |
| `data-display` | `/drive`, `/insights`, `/activity` | Full width with gradient bg | Available (Automa chat) |
| `sub-menu` | `/work-center`, `/settings/*`, `/profile/*` | Full width | Available (Automa chat) |
| `heavy-chat` | `/agents`, `/agents/create` | Agent-specific layout | Available (Agent config) |

### 1.3 Gradient Background

All non-`chat-only` pages have a subtle gradient overlay:
```
bg-gradient-to-b from-transparent via-transparent to-purple-500/[0.03]
dark: to-purple-400/[0.04]
```
Applied as a `pointer-events-none` absolute overlay behind content.

---

## 2. Navigation Rules

### 2.1 Sidebar Navigation Order

**Top Section (always visible):**
1. Main (Home icon) → `/`
2. Insights (BarChart3 icon) → `/insights`
3. Agents (Bot icon) → `/agents`
4. Hub (Briefcase icon) → `/work-center`
5. Drive (Folder icon) → `/drive`

**Bottom Section (role-gated):**
6. System (Settings icon) → `/settings/system` (hidden from Staff)

**Footer:**
7. Logout (LogOut icon) → simulated

### 2.2 Active State Indicator

- **Left edge bar:** 2px wide, purple (`bg-purple-500 dark:bg-purple-400`), rounded-right, vertically centered (h-8)
- **Icon color:** `text-purple-500 dark:text-purple-400` when active
- **Label:** `font-medium text-foreground` when active
- **Background:** `bg-accent` when active or when its sub-menu panel is showing

### 2.3 Sub-Menu Hover Behavior

1. Mouse enters sidebar item → `activePanel` set to item's ID → sub-menu panel appears
2. Mouse leaves sidebar → 800ms timeout starts
3. If mouse enters sub-menu panel within 800ms → panel stays (timeout cleared)
4. If mouse leaves sub-menu panel → 1500ms timeout for secondary hide
5. If `subMenuExpanded` is true (pinned) → panel never auto-hides
6. Window resize below 1024px → auto-collapse and clear pin state

### 2.4 Right Pane Toggle

- **Closed state:** `ChevronsLeft` (<<) icon button, positioned at top-right of center area
- **Open state:** `ChevronsRight` (>>) icon button in a top border bar above the right pane
- **Effect:** Right pane replaces center content entirely (not a side panel)
- **Disabled on:** Home page (`chat-only` view config)

---

## 3. Component Standards

### 3.1 Cards

| Property | Specification |
|---|---|
| Background | `bg-card` |
| Border | `border border-border` (1px solid) |
| Radius | `rounded-lg` (9px) |
| Padding | `p-4` (16px) standard, `p-3` (12px) compact |
| Hover | `hover-elevate` class (no scale transforms) |
| Shadow | None by default (elevation system handles hover) |

### 3.2 Buttons

| Variant | Background | Text | Border |
|---|---|---|---|
| `default` | `bg-primary` | `text-primary-foreground` | Auto-computed `primary-border` |
| `secondary` | `bg-secondary` | `text-secondary-foreground` | Auto-computed |
| `destructive` | `bg-destructive` | `text-destructive-foreground` | Auto-computed |
| `outline` | `bg-background` | `text-foreground` | `border-input` |
| `ghost` | Transparent | `text-foreground` | None |

All buttons use `hover-elevate` for interaction feedback. No `hover:scale` transforms.

### 3.3 Badges

| Variant | Usage |
|---|---|
| `default` | Status indicators (active, on track) |
| `secondary` | Neutral labels (role, category) |
| `destructive` | Error counts, critical alerts |
| `outline` | Subtle categorization |

### 3.4 Avatars

| Size | Dimension | Usage |
|---|---|---|
| Default | 32px (h-8 w-8) | TopBar profile, agent list |
| Small | 28px (h-7 w-7) | Sub-menu agent items |
| Large | 56px (h-14 w-14) | Agent detail header |
| XL | 80px (h-20 w-20) | Profile page |

Fallback: Initials on colored background (`bg-primary text-primary-foreground` for users, gradient for agents).

### 3.5 Modals (Dialogs)

| Property | Specification |
|---|---|
| Overlay | Semi-transparent black backdrop |
| Width | `max-w-md` (28rem) standard, `max-w-lg` for complex forms |
| Radius | Inherited from dialog component |
| Close | X button in top-right corner |
| Actions | Right-aligned buttons: Cancel (outline) + Primary action (default) |

### 3.6 Toasts

| Property | Specification |
|---|---|
| Position | Bottom-right |
| Auto-dismiss | Yes (default timing) |
| Variants | Default (neutral), Destructive (red) |
| Usage | All simulated actions: save, send, delete, call, schedule |

### 3.7 Dropdowns

| Property | Specification |
|---|---|
| Width | Content-specific (`w-48` to `w-96`) |
| Max Height | `h-80` (320px) with ScrollArea for long lists |
| Separator | `DropdownMenuSeparator` between sections |
| Labels | `DropdownMenuLabel` with `text-xs text-muted-foreground` for section headers |
| Active Indicator | `Check` icon on the right for selected items |

---

## 4. Chat Interface Standards

Every chat interface (Main, Agents, Right Pane) follows identical rules:

| Rule | Specification |
|---|---|
| Bot messages | Left-aligned, `bg-card border border-border rounded-xl px-4 py-3`, max-width 80-85% |
| User messages | Right-aligned, `bg-primary text-primary-foreground rounded-xl px-4 py-3`, max-width 80-85% |
| Avatars | NONE. No icons or avatars on chat messages. |
| Font | `.density-chat` (14px, line-height 1.6) |
| Typing indicator | Wave-dot animation (3 dots, staggered 0.15s each) |
| Input | Textarea with `.chat-input-gradient` wrapper (animated gradient border + glow) |
| Send | Enter key sends. Shift+Enter creates newline. Send button disabled when empty. |
| Suggestions | Pill buttons with sparkle icon, always visible or shown when < N messages |

---

## 5. Data Display Standards

### 5.1 Metric Tiles (Home Page)

| Property | Specification |
|---|---|
| Grid | `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` |
| Background | Tailwind gradient classes (e.g., `from-blue-500 to-cyan-500`) |
| Text | White text on gradient backgrounds |
| Decorations | SVG circles with `opacity-10` or `opacity-20` |
| Hover | `hover-elevate`, cursor-pointer |
| Click | Opens detail modal |

### 5.2 Data Tables / Lists

| Property | Specification |
|---|---|
| Row height | `.table-row-compact` (min-height 32px, padding 8px 12px) |
| Font | `.density-data` (13px, line-height 1.4) |
| Hover | `hover-elevate` on rows |
| Borders | `border-b border-border` between rows |
| Sort | Not implemented (prototype) |

### 5.3 Charts (Recharts)

| Property | Specification |
|---|---|
| Library | Recharts |
| Colors | Chart tokens (`chart-1` through `chart-5`) |
| Responsive | `ResponsiveContainer` wrapping all charts |
| Tooltip | Default Recharts tooltip |
| Area fills | Gradient fill with matching chart color |

---

## 6. Form Standards

| Element | Specification |
|---|---|
| Labels | `text-sm font-medium text-foreground` |
| Descriptions | `text-sm text-muted-foreground` below toggle labels |
| Inputs | Full-width, `bg-background border border-input rounded-md px-3 py-2` |
| Toggles | Shadcn Switch component, right-aligned in label row |
| Select | Shadcn Select with SelectItem (always with `value` prop) |
| Validation | Zod schema via `zodResolver` (when forms exist) |
| Submit | Full-width or right-aligned primary button |

---

## 7. Icon Standards

| Rule | Specification |
|---|---|
| Library | `lucide-react` exclusively |
| Default size | `h-5 w-5` for sidebar, `h-4 w-4` for inline/action icons |
| Color | `text-muted-foreground` default, `text-primary` or `text-purple-500` for active |
| Badge icons | `h-3 w-3` or `h-3.5 w-3.5` |
| Fill | Never filled by default. Only `Star` icon uses `fill-yellow-400` when favorited. |

---

## 8. Spacing Rhythm

| Spacing | Value | Usage |
|---|---|---|
| `gap-0.5` | 2px | Tight lists (sub-menu items) |
| `gap-1` | 4px | Button groups, icon gaps |
| `gap-2` | 8px | Standard element spacing |
| `gap-3` | 12px | Card sections, form fields |
| `gap-4` | 16px | Major sections |
| `gap-6` | 24px | Page sections |
| `p-3` | 12px | Compact card padding |
| `p-4` | 16px | Standard card padding |
| `p-6` | 24px | Page-level padding |

---

## 9. Scrolling

| Container | Scroll Behavior |
|---|---|
| Page body | No body scroll (h-screen with overflow-hidden on shell) |
| Center content | `overflow-y-auto` or `overflow-hidden` with internal scroll |
| Sub-menu panel | ScrollArea component (Radix) with custom scrollbar |
| Dropdowns | ScrollArea within `h-80` max height |
| Chat messages | ScrollArea, auto-scroll to bottom on new messages |
| Sidebar | Internal `overflow-y-auto` on the nav section |

---

## 10. Prohibited Patterns

| Pattern | Reason |
|---|---|
| `hover:scale-*` | Causes layout shift and overflow issues. Use `hover-elevate` instead. |
| Hardcoded hex/rgb colors | Breaks theme switching. Use CSS variable tokens. |
| `position: sticky` on nested elements | Causes stacking context issues within the shell layout. |
| Direct DOM manipulation for theme | Always go through ThemeContext. |
| Body scroll | App uses `h-screen` + `overflow-hidden` on root. All scroll is internal. |
| Avatars on chat messages | Design decision: no avatars on chat bubbles. |
| External icon libraries | Use lucide-react only (except `react-icons/si` for company logos). |
| `z-index` above 50 | TopBar uses z-50. Only modals/dialogs may exceed this. |
