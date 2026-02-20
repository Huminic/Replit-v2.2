# Nexxus Connect - Theme Contract

**Version:** 1.0
**Last Updated:** February 2026
**Applies To:** All UI components, pages, and layout elements

This document defines the complete theming system for Nexxus Connect. All components must consume these tokens exclusively. Hardcoded color values are prohibited outside of gradient definitions and chart fills.

---

## 1. Theme Mechanism

| Property | Value |
|---|---|
| **Strategy** | CSS custom properties in `:root` (light) and `.dark` (dark) |
| **Toggle Method** | Class-based: `darkMode: ["class"]` in Tailwind config |
| **Class Target** | `document.documentElement` (toggling the `dark` class) |
| **Persistence** | `localStorage` key: `nexxus:theme` |
| **Fallback** | System preference via `prefers-color-scheme: dark` media query |
| **Provider** | `ThemeContext` wrapping the entire app, exposing `theme`, `toggleTheme`, `setTheme` |

---

## 2. Color Token Registry

### 2.1 Core Surface Tokens

| Token | CSS Variable | Light Value (HSL) | Dark Value (HSL) | Usage |
|---|---|---|---|---|
| `background` | `--background` | 0 0% 100% (White) | 222 47% 11% (Slate 900) | Page background |
| `foreground` | `--foreground` | 222 47% 11% (Slate 900) | 210 40% 98% (Slate 50) | Primary text |
| `card` | `--card` | 210 40% 98% (Slate 50) | 222 47% 15% (Slate 800) | Card surfaces, panels |
| `card-foreground` | `--card-foreground` | 222 47% 11% | 210 40% 98% | Card text |
| `popover` | `--popover` | 0 0% 100% (White) | 222 47% 15% (Slate 800) | Dropdowns, popovers |
| `popover-foreground` | `--popover-foreground` | 222 47% 11% | 210 40% 98% | Popover text |

### 2.2 Semantic Color Tokens

| Token | CSS Variable | Light Value (HSL) | Dark Value (HSL) | Usage |
|---|---|---|---|---|
| `primary` | `--primary` | 217 91% 60% (Blue 500) | 217 91% 73% (Blue 400) | Primary buttons, active indicators, links |
| `primary-foreground` | `--primary-foreground` | 0 0% 100% (White) | 222 47% 11% (Slate 900) | Text on primary backgrounds |
| `secondary` | `--secondary` | 187 85% 43% (Cyan 500) | 187 94% 58% (Cyan 400) | Secondary accents, chart-2 |
| `secondary-foreground` | `--secondary-foreground` | 0 0% 100% | 222 47% 11% | Text on secondary backgrounds |
| `destructive` | `--destructive` | 0 84% 60% (Red 500) | 0 91% 71% (Red 400) | Delete, error states, danger actions |
| `destructive-foreground` | `--destructive-foreground` | 0 0% 100% | 222 47% 11% | Text on destructive backgrounds |

### 2.3 Neutral Tokens

| Token | CSS Variable | Light Value (HSL) | Dark Value (HSL) | Usage |
|---|---|---|---|---|
| `muted` | `--muted` | 210 40% 96% (Slate 100) | 217 33% 17% (Slate 700) | Muted backgrounds, tag fills |
| `muted-foreground` | `--muted-foreground` | 215 16% 47% (Slate 500) | 215 20% 65% (Slate 400) | Secondary text, icon tint |
| `accent` | `--accent` | 210 40% 96% (Slate 100) | 217 33% 17% (Slate 700) | Hover/active state fills |
| `accent-foreground` | `--accent-foreground` | 222 47% 11% | 210 40% 98% | Text on accent backgrounds |
| `border` | `--border` | 214 32% 91% (Slate 200) | 217 33% 17% (Slate 700) | All borders and separators |
| `input` | `--input` | 214 32% 91% (Slate 200) | 217 33% 25% (Slate 600) | Input field borders |
| `ring` | `--ring` | 217 91% 60% (Blue 500) | 217 91% 73% (Blue 400) | Focus ring outlines |

### 2.4 Sidebar Tokens

| Token | CSS Variable | Light Value | Dark Value | Usage |
|---|---|---|---|---|
| `sidebar` | `--sidebar` | 210 40% 98% | 222 47% 15% | Sidebar background |
| `sidebar-foreground` | `--sidebar-foreground` | 222 47% 11% | 210 40% 98% | Sidebar text |
| `sidebar-border` | `--sidebar-border` | 214 32% 91% | 217 33% 17% | Sidebar border |
| `sidebar-primary` | `--sidebar-primary` | 263 70% 66% (Purple 500) | 263 83% 78% (Purple 400) | Active sidebar indicator |
| `sidebar-accent` | `--sidebar-accent` | 215 16% 47% | 215 20% 65% | Sidebar accent elements |

### 2.5 Chart Tokens

| Token | CSS Variable | Light Value | Dark Value | Usage |
|---|---|---|---|---|
| `chart-1` | `--chart-1` | 217 91% 60% (Blue) | 217 91% 73% | Primary chart series |
| `chart-2` | `--chart-2` | 187 85% 43% (Cyan) | 187 94% 58% | Secondary chart series |
| `chart-3` | `--chart-3` | 187 85% 43% (Cyan) | 187 94% 58% | Tertiary chart series |
| `chart-4` | `--chart-4` | 160 84% 39% (Green) | 160 84% 54% | Quaternary chart series |
| `chart-5` | `--chart-5` | 38 92% 50% (Amber) | 38 92% 57% | Quinary chart series |

---

## 3. Elevation System

The elevation system uses pseudo-element overlays (not box-shadow) for hover/active states.

| Variable | Light Value | Dark Value | Purpose |
|---|---|---|---|
| `--elevate-1` | `rgba(0,0,0, .03)` | `rgba(255,255,255, .04)` | Hover state overlay |
| `--elevate-2` | `rgba(0,0,0, .08)` | `rgba(255,255,255, .09)` | Active/pressed state overlay |

| CSS Class | Trigger | Overlay |
|---|---|---|
| `hover-elevate` | `:hover` | `--elevate-1` background on `::after` pseudo-element |
| `hover-elevate-2` | `:hover` | `--elevate-2` background on `::after` pseudo-element |
| `active-elevate` | `:active` | `--elevate-1` background on `::after` pseudo-element |
| `active-elevate-2` | `:active` | `--elevate-2` background on `::after` pseudo-element |
| `toggle-elevate` | `.toggle-elevated` class | `--elevate-2` background on `::before` pseudo-element |

**Rules:**
- All elevate classes set `position: relative; z-index: 0` on the element.
- The pseudo-element uses `position: absolute; inset: 0; border-radius: inherit; z-index: 999`.
- Elements with `.border` class extend the pseudo-element by `inset: -1px`.
- Opt-out classes: `.no-default-hover-elevate`, `.no-default-active-elevate`.

---

## 4. Shadow Tokens

| Token | Light Value | Dark Value |
|---|---|---|
| `--shadow-2xs` | `0 1px 2px 0 rgba(0,0,0,0.05)` | `0 1px 2px 0 rgba(0,0,0,0.3)` |
| `--shadow-xs` | `0 1px 2px 0 rgba(0,0,0,0.05)` | `0 1px 2px 0 rgba(0,0,0,0.3)` |
| `--shadow-sm` | `0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)` | `0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px 0 rgba(0,0,0,0.3)` |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)` | `0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -1px rgba(0,0,0,0.3)` |
| `--shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)` | `0 10px 15px -3px rgba(0,0,0,0.5), 0 4px 6px -2px rgba(0,0,0,0.3)` |
| `--shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)` | `0 20px 25px -5px rgba(0,0,0,0.6), 0 10px 10px -5px rgba(0,0,0,0.4)` |
| `--shadow-2xl` | `0 25px 50px -12px rgba(0,0,0,0.25)` | `0 25px 50px -12px rgba(0,0,0,0.5)` |

Dark mode shadows use higher alpha for visibility against dark backgrounds.

---

## 5. Border Radius

| Tailwind Class | Value | Usage |
|---|---|---|
| `rounded-sm` | 3px (0.1875rem) | Small badges, toggles |
| `rounded-md` | 6px (0.375rem) | Inputs, buttons |
| `rounded-lg` | 9px (0.5625rem) | Cards, modals |
| `rounded-xl` | Tailwind default (12px) | Chat bubbles, gradient input container |
| `--radius` | 0.5rem (8px) | Base radius variable |

---

## 6. Typography

| Variable | Value | Fallbacks |
|---|---|---|
| `--font-sans` | `'Inter'` | `system-ui, -apple-system, 'Segoe UI', sans-serif` |
| `--font-serif` | `'Merriweather'` | `Georgia, serif` |
| `--font-mono` | `'Fira Code'` | `Monaco, 'Courier New', monospace` |

### Density Classes

| Class | Font Size | Line Height | Use Case |
|---|---|---|---|
| `.density-data` | 13px | 1.4 | Data tables, file lists, compact metrics |
| `.density-chat` | 14px | 1.6 | Chat bubbles, message content |

---

## 7. Button Border System

Borders on opaque (filled) buttons are auto-computed using CSS relative color syntax:

```css
--primary-border: hsl(from hsl(var(--primary)) h s calc(l + var(--opaque-button-border-intensity)) / alpha);
```

| Variable | Light Mode | Dark Mode |
|---|---|---|
| `--opaque-button-border-intensity` | `-8` (darker) | `+9` (lighter) |
| `--button-outline` | `rgba(0,0,0, .10)` | `rgba(255,255,255, .10)` |
| `--badge-outline` | `rgba(0,0,0, .05)` | `rgba(255,255,255, .05)` |

This generates border colors that are automatically lighter (dark mode) or darker (light mode) than the fill color.

---

## 8. Animations

### Gradient Shift (Chat Input Border)

```css
@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

| Property | Value |
|---|---|
| Colors | `#8b5cf6 → #3b82f6 → #06b6d4 → #8b5cf6` (Purple → Blue → Cyan → Purple) |
| Background Size | 300% 100% |
| Duration | 8 seconds |
| Timing | ease, infinite |
| Glow Shadow | `0 0 25px rgba(139,92,246,0.4), 0 0 50px rgba(59,130,246,0.2)` |

### Wave Dot (Typing Indicator)

```css
@keyframes wave {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}
```

| Property | Value |
|---|---|
| Dot Size | 6px diameter |
| Color | `hsl(var(--muted-foreground))` |
| Duration | 1.4 seconds |
| Timing | ease-in-out, infinite |
| Stagger Delays | Dot 1: 0s, Dot 2: 0.15s, Dot 3: 0.3s |

### Accordion

| Animation | Duration | Timing |
|---|---|---|
| `accordion-down` | 0.2s | ease-out |
| `accordion-up` | 0.2s | ease-out |

---

## 9. Status Colors (Hardcoded RGB)

These are fixed colors not affected by theme switching:

| Status | RGB Value | Usage |
|---|---|---|
| `status-online` | `rgb(34 197 94)` (Green 500) | Online presence, active agents |
| `status-away` | `rgb(245 158 11)` (Amber 500) | Away/idle status |
| `status-busy` | `rgb(239 68 68)` (Red 500) | Busy/DND status |
| `status-offline` | `rgb(156 163 175)` (Gray 400) | Offline status |

---

## 10. Scrollbar Styling

| Property | Value |
|---|---|
| Width / Height | 8px |
| Track | Transparent |
| Thumb | `hsl(var(--muted-foreground) / 0.3)` |
| Thumb Hover | `hsl(var(--muted-foreground) / 0.5)` |
| Thumb Radius | 4px |
| Hide Class | `.hide-scrollbar` (removes scrollbar entirely) |

---

## 11. Compliance Rules

1. **Never hardcode colors** in component files. Always use Tailwind utility classes that resolve to CSS variables (e.g., `bg-background`, `text-foreground`, `border-border`).
2. **Exception:** Gradient definitions (`from-purple-500 to-blue-500`) and status colors may use Tailwind's built-in color palette directly.
3. **All new tokens** must be defined in both `:root` and `.dark` blocks in `index.css`, and mapped in `tailwind.config.ts`.
4. **Token format:** HSL values as `H S% L%` (space-separated, no `hsl()` wrapper) for CSS variables.
5. **Dark mode principle:** Dark mode colors are lighter variants of their light mode counterparts (typically shifting from X00 to X-100 on the Tailwind scale).
6. **Test both modes** visually before shipping any UI change.
