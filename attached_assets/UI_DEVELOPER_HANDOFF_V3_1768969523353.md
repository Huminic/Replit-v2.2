# Nexxus V2 - UI Developer Handoff Document

**Version:** 3.0 (ClickUp-Inspired Final)
**Date:** January 21, 2026
**Status:** Production Ready
**Classification:** Internal
**Target Audience:** UI/UX Developers, Frontend Engineers, Replit Designer Agent

---

## 🎯 Document Purpose

This is the **FINAL DESIGN SPECIFICATION** for Nexxus V2 UI implementation. All design decisions have been finalized and this document contains everything needed to build the complete interface.

### What's Inside
- **ClickUp-inspired 3-pane layout system** with responsive behavior
- **Complete navigation hierarchy** (8 main menu items + 2 bottom icons)
- **4 view configurations** that auto-select contextually
- **Dual-density design system** (data tables vs. chat interfaces)
- **Light + Dark mode specifications** (both required)
- **Mobile-first responsive breakpoints** (critical requirement)
- **Complete component library** with usage examples
- **API integration patterns** with real-time subscriptions

---

## 📐 Core Design Philosophy

### 1. Invisible Design (ClickUp Principle)
> "Information is just where you need it to be and you don't even think about it."

**Implementation:**
- View modes auto-select based on route — **no manual toggle**
- Navigation feels natural and predictable
- Users focus on their work, not the interface
- Consistent patterns across all pages

### 2. Dual-Density System

| Density Mode | Use Case | Font Size | Line Height | Padding | Example |
|--------------|----------|-----------|-------------|---------|---------|
| **ClickUp Density** | Data tables, lists, compact UI | 13px | 1.4 | 8–12px | Agent library, task lists, drive files |
| **Chat Comfort** | Conversations, AI dialogue | 14–15px | 1.6 | 16–20px | Automa chat, agent conversations, messages |

**Why:** Data needs density for quick scanning. Chat needs spaciousness for comfortable reading.

### 3. Three-Pane Layout System

```
┌────────────────────────────────────────────────────────────┐
│ Top Bar: [🔔] [📊] [🌓] [Org ▾] [@User]                   │
├─────┬──────────────────────────────────────────┬───────────┤
│ Left│          Center Pane                     │Right Pane │
│Pane │          (Main Work Area)                │(Context)  │
│     │                                          │           │
│[📋] │                                          │           │
│Main │                                          │ Automa    │
│     │                                          │ Chat      │
│[🤖] │                                          │           │
│Agent│                                          │ OR        │
│     │                                          │           │
│[📁] │                                          │ Artifact  │
│Drive│                                          │ Display   │
│     │                                          │           │
│[📊] │                                          │           │
│Insig│                                          │           │
│     │                                          │           │
│[💼] │                                          │           │
│Work │                                          │           │
│     │                                          │           │
│[📈] │                                          │           │
│Activ│                                          │           │
└─────┴──────────────────────────────────────────┴───────────┘
```

**Responsive Behavior (Mobile-First):**

| Breakpoint | Width | Left Pane | Center Pane | Right Pane | Notes |
|------------|-------|-----------|-------------|------------|-------|
| Mobile | <768px | Hamburger menu (overlay) | Full width | Bottom drawer | Stack vertically |
| Tablet | 768–1279px | Collapsible sidebar (64px icons) | Flex | Slide-over (320px) | Right pane becomes modal |
| Desktop S | 1280–1439px | Fixed 80px (auto-collapse) | Flex | Slide-over (320px) | Space-constrained |
| Desktop M | 1440–1919px | Fixed 240px (expanded) | Flex | Fixed 280px | Comfortable |
| Desktop L | ≥1920px | Fixed 240px | Flex | Fixed 320px | Optimal |

---

## 🗺️ Navigation Structure

### Main Vertical Menu (ClickUp-Style)

**Visual Design:**
- **Expanded:** 240px wide, icon + text label stacked
- **Collapsed:** 64px wide, icon-only with tooltips
- **Icons:** 24×24px, 2px stroke weight, Lucide icon library
- **Colors:** Muted (avoid "icon crazy" like ClickUp) — use default gray with subtle color on hover

#### 8 Menu Items

| # | Item | Icon | Route | Popout Submenu | View Config |
|---|------|------|-------|----------------|-------------|
| **1** | Main | Home | `/` | • Favorites<br>• Message History | A: Chat Only |
| **2** | Agents | Bot | `/agents` | • Agent Chat<br>• Create Agent<br>• Interact With Agents | D: Heavy Chat Work |
| **3** | Drive | Folder | `/drive` | • My Files<br>• Shared Files<br>• Templates | B: Data Display |
| **4** | Insights | BarChart | `/insights` | • Insight Engine<br>• Goals | B: Data Display |
| **5** | Work Center | Briefcase | `/work-center` | • Calendar<br>• Tasks<br>• Hunches<br>• Approvals | C: Sub Menu |
| **6** | Activity | Activity | `/activity` | • Users<br>• Agents<br>• System | B: Data Display |
| **7** | System | Settings | `/settings/system` | • Users<br>• Application Settings<br>• Tools<br>• Knowledge<br>• Hunch Config | C: Sub Menu |
| **8** | Profile | User | `/profile` | **Org Switcher**<br>• My Profile<br>• Preferences<br>• Billing<br>• Logout | C: Sub Menu |

**Key Changes from Previous Version:**
- ✅ **Messages dropped** — only Notifications + Activity Feed in top bar
- ✅ **Org Switcher inside Profile menu** — click profile icon to reveal
- ✅ **Icon colors muted** — less colorful than ClickUp to avoid visual noise

### Popout Interaction

| Device | Trigger | Behavior | Width | Animation |
|--------|---------|----------|-------|-----------|
| **Desktop** | Hover (300ms delay) | Popout appears to right | 240px | Fade in 200ms |
| **Mobile/Tablet** | Tap | Toggle open/closed | Full width overlay | Slide in 200ms |

**Accessibility:**
- Keyboard: `Tab` to focus, `Enter/Space` to open, `Esc` to close
- Screen readers: `aria-expanded`, `aria-haspopup="true"`
- Focus trap: Inside popout when open

---

## 🎨 Top Bar Elements

```
[🔔 Notifications] [📊 Activity Feed] [🌓 Dark/Light] [Org Switcher ▾] [@User Profile ▾]
```

| # | Element | Icon | Dropdown Content | Badge |
|---|---------|------|------------------|-------|
| 1 | **Notifications** | Bell | System alerts requiring action (low credits, approvals, task assignments) | Unread count |
| 2 | **Activity Feed** | Activity | Live system activity stream (info-only, no actions) | None |
| 3 | **Theme Toggle** | Sun/Moon | N/A — toggle between light/dark | None |
| 4 | **Org Switcher** | *Inside Profile dropdown* | List of assigned orgs (Partner Admin + multi-org Org Admin) | None |
| 5 | **Profile** | User Avatar | • Org Switcher<br>• My Profile<br>• Preferences<br>• Billing<br>• Logout | None |

**Design Notes:**
- Notifications and Activity Feed use **same dropdown pattern** (400px wide, right-aligned)
- Dark/Light toggle uses **subtle animation** (barely noticeable, 3-color gradient max)
- Org Switcher **only visible in Profile dropdown** to avoid top bar clutter

---

## 🔢 Four View Configurations (Auto-Selected)

### View A: Chat Only
**Routes:** `/` (Main home page)

```
┌─────┬────────────────────────────────┬──────┐
│ Left│       Center Pane              │Right │
│Pane │       (Chat Dialogue)          │Pane  │
│     │                                │      │
│Favor│   🤖 Automa                    │ NONE │
│ites │   ──────────────               │(hide)│
│     │   👤 How can I help?           │      │
│Msg  │                                │      │
│Hist │   🤖 I'm here to assist...     │      │
│     │                                │      │
│     │   [Type message here...]       │      │
└─────┴────────────────────────────────┴──────┘
```

**Purpose:** Landing page, pure chat interface focus

**Layout:**
- Left: 240px (Favorites + Message History)
- Center: Flex (Chat dialogue with Automa)
- Right: **Hidden**

---

### View B: Data Display
**Routes:** `/drive`, `/insights`, `/activity`

```
┌─────┬────────────────────────────────┬──────────┐
│ Left│       Center Pane              │  Right   │
│Pane │       (Data/Information)       │  Pane    │
│     │                                │          │
│Filt │   📊 Data Tables               │  🤖 Chat │
│ers  │   Charts, Insight Cards, Files │          │
│     │                                │  Automa  │
│Tags │   [Grid layout for data]      │  context │
│     │                                │  help    │
│View │                                │          │
└─────┴────────────────────────────────┴──────────┘
```

**Purpose:** Data-heavy pages where AI assistance is supplementary

**Layout:**
- Left: 240px (Filters, Tags, View options)
- Center: Flex (Data tables, charts, cards)
- Right: 320px (Automa chat for context-sensitive help)

---

### View C: Sub Menu Selections
**Routes:** `/work-center/*`, `/settings/system/*`, `/profile/*`

```
┌─────┬────────────────────────────────┬──────────┐
│ Left│       Center Pane              │  Right   │
│Pane │       (Settings/Forms)         │  Pane    │
│     │                                │          │
│Sub  │   ⚙️ Form Controls             │  🤖 Chat │
│Menu │   Configuration UI             │          │
│Sect │                                │  Automa  │
│ions │   [Form fields, toggles]       │  guide   │
└─────┴────────────────────────────────┴──────────┘
```

**Purpose:** Settings, configuration, task management pages

**Layout:**
- Left: 240px (Section navigation)
- Center: Flex (Forms, settings UI)
- Right: 320px (Automa for configuration guidance)

---

### View D: Heavy Chat Work
**Routes:** `/agents/*`

```
┌─────┬────────────────────────────────┬──────────┐
│ Left│       Center Pane              │  Right   │
│Pane │       (Chat Dialogue)          │  Pane    │
│     │                                │          │
│Agent│   🤖 Automa                    │ Artifact │
│List │   ──────────────               │ Display  │
│     │   👤 Build sales agent         │          │
│─────│                                │ Skills:  │
│Msg  │   🤖 Sure! What channel?       │ • VIN    │
│Hist │   📞 Voice 📹 Video 💬 Chat   │ • VAPI   │
│     │                                │ • Tavus  │
│     │   👤 Voice, VAPI integration   │          │
│     │                                │ [Config] │
└─────┴────────────────────────────────┴──────────┘
```

**Purpose:** Agent creation, complex workflows requiring context

**Layout:**
- Left: 240px (Agent list + Message history separator)
- Center: Flex (Chat dialogue with Automa)
- Right: 320px (Artifact selection, skill library, quick actions)

---

## 📱 Mobile-First Responsive Design (CRITICAL)

### Breakpoint Strategy

```css
/* Mobile First (base styles) */
@media (min-width: 0px) {
  /* Stack layout, hamburger menu, bottom drawer */
}

/* Tablet */
@media (min-width: 768px) {
  /* Collapsible sidebar, slide-over right pane */
}

/* Desktop Small */
@media (min-width: 1280px) {
  /* 3-pane layout with auto-collapse left sidebar */
}

/* Desktop Medium */
@media (min-width: 1440px) {
  /* Optimal 3-pane layout */
}

/* Desktop Large */
@media (min-width: 1920px) {
  /* Maximum spacing, 320px right pane */
}
```

### Mobile Layout (<768px)

```
┌──────────────────────────────┐
│ ☰ Nexxus   [🔔] [📊] [@User] │ Top Bar
├──────────────────────────────┤
│                              │
│   Main Content (Full Width)  │
│                              │
│   (Automa chat OR data)      │
│                              │
│                              │
│                              │
└──────────────────────────────┘
│ [Chat Toggle]  [Menu Toggle] │ Bottom Drawer
└──────────────────────────────┘
```

**Key Mobile Behaviors:**
- ☰ Hamburger menu opens **left overlay** (full-screen menu)
- Automa chat opens **bottom drawer** (70% height, swipe to dismiss)
- Top bar icons **stack** if needed (<360px width)
- All touch targets **minimum 44×44px**

### Tablet Layout (768–1279px)

```
┌────┬──────────────────────────────┬──┐
│Icon│   Main Content (Flex)        │▶ │ Slide-over
│64px│                              │  │ trigger
│    │                              │  │
│[🏠]│                              │  │
│[🤖]│                              │  │
│[📁]│                              │  │
│[📊]│                              │  │
└────┴──────────────────────────────┴──┘
```

**Key Tablet Behaviors:**
- Left sidebar: **64px icon-only**, hover shows labels
- Right pane: **Slide-over modal** (320px, overlay with backdrop)
- Tap icon → Open slide-over → Tap backdrop → Close

---

## 🎨 Design System (ClickUp-Inspired)

### 1. Space Efficiency & Density

**ClickUp Density (Lists/Tables):**
```css
.table-row {
  font-size: 13px;
  line-height: 1.4;
  padding: 8px 12px;
  min-height: 32px; /* ClickUp-style compact rows */
}

.list-item {
  font-size: 13px;
  padding: 8px;
  gap: 8px; /* Tight spacing */
}
```

**Chat Comfort Mode (Conversations):**
```css
.chat-message {
  font-size: 14px;
  line-height: 1.6;
  padding: 16px 20px;
  max-width: 65ch; /* Readable line length */
  margin-bottom: 16px; /* Spacious vertical rhythm */
}

.chat-bubble {
  border-radius: 12px;
  padding: 12px 16px;
}
```

### 2. Gradient Border (Automa Chat Input Only)

```css
/* Bottom chat input field ONLY */
.chat-input-wrapper {
  position: relative;
  border-radius: 12px;
  padding: 2px; /* Border width */
  background: linear-gradient(
    90deg,
    #8b5cf6, /* Purple */
    #3b82f6, /* Blue */
    #06b6d4  /* Cyan */
  );
  background-size: 200% 100%;
  animation: gradient-shift 15s ease infinite; /* VERY slow */
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.chat-input {
  background: var(--color-background-base);
  border-radius: 10px;
  border: none;
  width: 100%;
}
```

**Design Principle:** Gradient is **localized to chat input** only. Not used on buttons, cards, or navigation. Subtle animation (barely noticeable).

### 3. Vertical Menu Style

```css
.menu-item {
  display: flex;
  flex-direction: column; /* Icon above label */
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px 8px;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  
  /* Subtle hover */
  transition: background-color 150ms ease;
}

.menu-item:hover {
  background-color: var(--color-neutral-100); /* Light gray */
}

.menu-item.active {
  background-color: var(--color-neutral-200);
  border-left: 3px solid var(--color-brand-primary);
}

.menu-icon {
  width: 24px;
  height: 24px;
  color: var(--color-neutral-600); /* Muted, not colorful */
}

.menu-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-foreground-secondary);
  text-align: center;
}
```

### 4. Top Bar Pattern

```css
.top-bar {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid var(--color-border-base);
  background: var(--color-background-base);
}

.top-bar-icon {
  width: 32px;
  height: 32px;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  position: relative; /* For badge positioning */
}

.top-bar-icon:hover {
  background-color: var(--color-neutral-100);
}

/* Badge (notification count) */
.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--color-error);
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}
```

### 5. Card/Panel Design

```css
.card {
  background: var(--color-background-surface);
  border: 1px solid var(--color-border-base);
  border-radius: 12px; /* ClickUp uses 8-12px */
  padding: 20px;
  box-shadow: var(--shadow-base);
  transition: box-shadow 150ms ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-muted);
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-foreground-primary);
  margin: 0;
}

.card-icon {
  width: 20px;
  height: 20px;
  color: var(--color-neutral-500);
}
```

### 6. Typography Scale

```css
/* Headings */
h1 { font-size: 24px; font-weight: 700; line-height: 1.2; }
h2 { font-size: 18px; font-weight: 600; line-height: 1.3; }
h3 { font-size: 14px; font-weight: 600; line-height: 1.4; }

/* Body text */
body {
  font-size: 13px; /* ClickUp density */
  line-height: 1.4;
  font-family: var(--font-sans);
  color: var(--color-foreground-primary);
}

/* Chat text (more comfortable) */
.chat-text {
  font-size: 14px;
  line-height: 1.6;
}

/* Small text */
.text-small {
  font-size: 11px;
  line-height: 1.4;
  color: var(--color-foreground-tertiary);
}

/* Tiny text (metadata) */
.text-tiny {
  font-size: 10px;
  line-height: 1.2;
  color: var(--color-foreground-tertiary);
}
```

### 7. Color Usage

```css
/* Muted backgrounds (avoid bright colors) */
:root {
  --color-neutral-50: #f8fafc;
  --color-neutral-100: #f1f5f9;
  --color-neutral-200: #e2e8f0;
  /* ... */
  --color-neutral-900: #0f172a;
}

/* Brand purple for primary actions */
--color-brand-primary: #8b5cf6; /* Purple */

/* Text colors (gray scale) */
--color-foreground-primary: #0f172a; /* Dark gray */
--color-foreground-secondary: #475569; /* Medium gray */
--color-foreground-tertiary: #94a3b8; /* Light gray */
```

**Dark Mode Overrides:**
```css
[data-theme="dark"] {
  --color-background-base: #0f172a;
  --color-background-surface: #1e293b;
  --color-foreground-primary: #f8fafc;
  --color-foreground-secondary: #cbd5e1;
  
  /* Lighter brand colors for dark mode */
  --color-brand-primary: #a78bfa; /* Lighter purple */
}
```

### 8. Interaction Patterns

```css
/* Standard transitions */
* {
  transition: background-color 150ms ease,
              border-color 150ms ease,
              color 150ms ease,
              box-shadow 150ms ease;
}

/* Hover lift (subtle) */
.clickable:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Active scale down */
.clickable:active {
  transform: scale(0.98);
}

/* Loading spinner */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-spinner {
  animation: spin 1s linear infinite;
}
```

### 9. Data Tables

```css
.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  position: sticky;
  top: 0;
  background: var(--color-background-surface);
  z-index: 10;
}

.data-table th {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-foreground-tertiary);
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid var(--color-border-base);
}

.data-table td {
  font-size: 13px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border-muted);
  min-height: 40px; /* ClickUp-style row height */
}

.data-table tr:hover {
  background-color: var(--color-neutral-50);
}
```

### 10. Icons

**Library:** Lucide Icons (https://lucide.dev/)

**Sizes:**
- Menu icons: 24×24px
- Top bar icons: 20×20px
- Inline icons: 16×16px
- Tiny icons: 12×12px

**Stroke width:** 2px (consistent)

**Color:** Inherit from parent (avoid hard-coded colors)

```tsx
import { Home, Bot, Folder, BarChart } from 'lucide-react';

// Usage
<Home size={24} strokeWidth={2} />
```

### 11. Differentiation from ClickUp

| Aspect | ClickUp | Nexxus V2 |
|--------|---------|-----------|
| **Color** | Colorful icons | Muted gray icons |
| **Gradient** | Rainbow borders everywhere | Chat input only (3 colors) |
| **Layout** | Many customizable widgets | 4 fixed view configs |
| **Navigation** | 12+ menu items | 8 menu items (focused) |
| **Branding** | ClickUp purple | Custom purple + brand colors |

---

## 🧩 Component Library

### Button Components

```tsx
import styled from 'styled-components';

// Primary Button
const ButtonPrimary = styled.button`
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  background-color: var(--color-brand-primary);
  color: white;
  border: none;
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: opacity 150ms ease;
  
  &:hover:not(:disabled) {
    opacity: 0.9;
  }
  
  &:active:not(:disabled) {
    transform: scale(0.98);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:focus-visible {
    outline: 2px solid var(--color-border-emphasis);
    outline-offset: 2px;
  }
`;

// Secondary Button
const ButtonSecondary = styled.button`
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  background-color: transparent;
  color: var(--color-brand-primary);
  border: 1px solid var(--color-brand-primary);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease;
  
  &:hover:not(:disabled) {
    background-color: var(--color-brand-primary);
    color: white;
  }
`;

// Icon Button
const IconButton = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-base);
  cursor: pointer;
  color: var(--color-foreground-secondary);
  
  &:hover {
    background-color: var(--color-neutral-100);
    color: var(--color-foreground-primary);
  }
`;
```

### Card Component

```tsx
import styled from 'styled-components';

const Card = styled.div`
  background: var(--color-background-surface);
  border: 1px solid var(--color-border-base);
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--shadow-base);
  transition: box-shadow 150ms ease;
  
  &:hover {
    box-shadow: var(--shadow-md);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-muted);
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: var(--color-foreground-primary);
  margin: 0;
`;

const CardContent = styled.div`
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-foreground-secondary);
`;

// Usage
<Card>
  <CardHeader>
    <CardTitle>Voice Agent Performance</CardTitle>
    <IconButton>...</IconButton>
  </CardHeader>
  <CardContent>
    {/* Content here */}
  </CardContent>
</Card>
```

### Automa Chat Input (with Gradient)

```tsx
const ChatInputWrapper = styled.div`
  position: relative;
  border-radius: 12px;
  padding: 2px;
  background: linear-gradient(
    90deg,
    #8b5cf6, #3b82f6, #06b6d4
  );
  background-size: 200% 100%;
  animation: gradient-shift 15s ease infinite;
  
  @keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
`;

const ChatInput = styled.textarea`
  width: 100%;
  min-height: 44px;
  max-height: 200px;
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.6;
  background: var(--color-background-base);
  border: none;
  border-radius: 10px;
  resize: vertical;
  font-family: var(--font-sans);
  color: var(--color-foreground-primary);
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: var(--color-foreground-tertiary);
  }
`;

// Usage
<ChatInputWrapper>
  <ChatInput placeholder="Ask Automa anything..." />
</ChatInputWrapper>
```

### Dropdown Component

```tsx
const DropdownPanel = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 400px;
  max-height: 600px;
  overflow-y: auto;
  background: var(--color-background-elevated);
  border: 1px solid var(--color-border-base);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  
  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--color-neutral-300);
    border-radius: 4px;
  }
`;

const DropdownHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-muted);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-foreground-primary);
`;

const DropdownItem = styled.div`
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border-muted);
  
  &:hover {
    background-color: var(--color-neutral-50);
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

// Usage (Notifications dropdown)
<DropdownPanel>
  <DropdownHeader>Notifications</DropdownHeader>
  <DropdownItem>
    <NotificationIcon />
    <div>
      <div className="notification-title">Low Credits</div>
      <div className="notification-time">5 minutes ago</div>
    </div>
  </DropdownItem>
  {/* More items */}
</DropdownPanel>
```

---

## 🔐 Authentication & Authorization

### Authentication Flow

**Step-by-Step Process:**
1. User lands on app → Check for session token (localStorage or cookie)
2. If no token → Redirect to `/login`
3. Login → POST `/api/auth/login` → Receive JWT + refresh token
4. Store JWT in memory, refresh token in httpOnly cookie
5. Include JWT in all API requests: `Authorization: Bearer {token}`
6. On 401 response → Attempt token refresh → If fails, redirect to `/login`

### Protected Route Pattern

```typescript
// middleware.ts (Next.js 14 middleware for route protection)
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('refresh_token');

  // If no token and not on login page, redirect to login
  if (!token && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If token exists and on login page, redirect to home
  if (token && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
```

### RBAC Enforcement

**User Role Access:**
- User role available in JWT payload: `{ userId, organizationId, role }`
- Frontend checks role for UI elements (show/hide menu items, buttons)
- Backend enforces at API level (double validation - never trust frontend)

**Role Hierarchy:**
```typescript
type UserRole = 'super_admin' | 'partner_admin' | 'org_admin' | 'org_staff';

const roleHierarchy: Record<UserRole, number> = {
  super_admin: 4,
  partner_admin: 3,
  org_admin: 2,
  org_staff: 1
};

// Check if user has required role
function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
```

**Frontend Role-Based Rendering:**
```typescript
// useCurrentUser hook
import { useQuery } from '@tanstack/react-query';

export function useCurrentUser() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => fetch('/api/auth/me').then(res => res.json())
  });

  return { user, isLoading };
}

// Usage in components
function SystemMenu() {
  const { user } = useCurrentUser();

  // Only show System menu if super_admin, partner_admin, or org_admin
  if (!user || !['super_admin', 'partner_admin', 'org_admin'].includes(user.role)) {
    return null;
  }

  return <MenuItem icon={Settings} label="System" href="/settings/system" />;
}
```

### Organization Context Switching

**Partner Admin / Multi-Org Org Admin:**
```typescript
// Org switcher stores current org in localStorage + session
function switchOrganization(newOrgId: string) {
  // Clear all context
  localStorage.clear();
  sessionStorage.clear();

  // Set new org
  localStorage.setItem('current_org_id', newOrgId);

  // Reload app (fresh context)
  window.location.href = '/';
}
```

**Session Management:**
```typescript
// Session includes org context
interface Session {
  userId: string;
  organizationId: string;
  role: UserRole;
  exp: number; // Token expiration
}

// Decode JWT to get session data
function getSession(): Session | null {
  const token = localStorage.getItem('access_token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
}
```

---

## ⚠️ Error States

### Network Error (API Unreachable)

**Visual Specification:**
```
┌────────────────────────────────────┐
│                                    │
│         ⚠️ (AlertTriangle)         │
│                                    │
│   Unable to connect to server      │
│                                    │
│   We're having trouble reaching    │
│   our servers. Please check your   │
│   internet connection.             │
│                                    │
│   [Retry]  [Go to Dashboard]       │
│                                    │
└────────────────────────────────────┘
```

**Component Implementation:**
```tsx
const NetworkError = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px;
  text-align: center;
`;

const ErrorIcon = styled(AlertTriangle)`
  width: 64px;
  height: 64px;
  color: var(--color-error);
  margin-bottom: 24px;
`;

const ErrorTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: var(--color-foreground-primary);
  margin-bottom: 12px;
`;

const ErrorMessage = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-foreground-secondary);
  max-width: 400px;
  margin-bottom: 24px;
`;
```

### 404 - Page Not Found

**Visual Specification:**
```
┌────────────────────────────────────┐
│                                    │
│         📄 (FileQuestion)          │
│                                    │
│         Page not found             │
│                                    │
│   The page you're looking for      │
│   doesn't exist or has been moved. │
│                                    │
│       [Go to Dashboard]            │
│                                    │
└────────────────────────────────────┘
```

**Routes:**
- Display on any `/404` route
- Display when dynamic route doesn't exist (e.g., `/agents/invalid-id`)

### 403 - Permission Denied

**Visual Specification:**
```
┌────────────────────────────────────┐
│                                    │
│         🛡️ (ShieldAlert)           │
│                                    │
│      Permission Denied             │
│                                    │
│   You don't have permission to     │
│   access this page. Contact your   │
│   administrator for access.        │
│                                    │
│          [Go Back]                 │
│                                    │
└────────────────────────────────────┘
```

**When to Display:**
- User navigates to route requiring higher role (e.g., org_staff accessing `/settings/system`)
- API returns 403 status
- User tries to access another organization's data

### 500 - Server Error

**Visual Specification:**
```
┌────────────────────────────────────┐
│                                    │
│         💥 (ServerCrash)           │
│                                    │
│    Something went wrong            │
│                                    │
│   We encountered an unexpected     │
│   error. Our team has been         │
│   notified and is working on it.   │
│                                    │
│   [Retry]  [Report Issue]          │
│                                    │
└────────────────────────────────────┘
```

**Error Boundary:**
```tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log to error tracking service (e.g., Sentry)
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ServerError onRetry={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}
```

### Form Validation Errors

**Visual Specification:**
```
[Input Field]
❌ This field is required
```

**Inline Error Pattern:**
```tsx
const FormField = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-foreground-primary);
  margin-bottom: 6px;
`;

const FormInput = styled.input<{ hasError?: boolean }>`
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid ${props =>
    props.hasError ? 'var(--color-error)' : 'var(--color-border-base)'
  };
  border-radius: 8px;
  background: var(--color-background-base);
  color: var(--color-foreground-primary);

  &:focus {
    outline: none;
    border-color: ${props =>
      props.hasError ? 'var(--color-error)' : 'var(--color-brand-primary)'
    };
  }
`;

const FormError = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 13px;
  color: var(--color-error);
`;

// Usage
<FormField>
  <FormLabel htmlFor="email">Email</FormLabel>
  <FormInput
    id="email"
    type="email"
    hasError={!!errors.email}
  />
  {errors.email && (
    <FormError>
      <AlertCircle size={16} />
      {errors.email}
    </FormError>
  )}
</FormField>
```

**Error Message Patterns:**
- Required field: "This field is required"
- Invalid email: "Please enter a valid email address"
- Password too short: "Password must be at least 8 characters"
- Invalid URL: "Please enter a valid URL"
- Generic: "Invalid value"

---

## ⏳ Loading States

### Page Load (Initial)

**Skeleton Screen Pattern:**
```
┌────────────────────────────────────┐
│ [Gray Bar - Header Skeleton]      │
├────────────────────────────────────┤
│ [Gray Rectangle]                   │
│ [Gray Rectangle]                   │
│ [Gray Rectangle]                   │
│                                    │
│ [Gray Rectangle]  [Gray Rectangle] │
└────────────────────────────────────┘
```

**Implementation:**
```tsx
const Skeleton = styled.div`
  background: linear-gradient(
    90deg,
    var(--color-neutral-200) 0%,
    var(--color-neutral-100) 50%,
    var(--color-neutral-200) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

const SkeletonText = styled(Skeleton)`
  height: 16px;
  margin-bottom: 8px;
`;

const SkeletonCard = styled(Skeleton)`
  height: 120px;
  margin-bottom: 16px;
`;

// Dark mode
[data-theme="dark"] ${Skeleton} {
  background: linear-gradient(
    90deg,
    var(--color-neutral-800) 0%,
    var(--color-neutral-700) 50%,
    var(--color-neutral-800) 100%
  );
}
```

### Data Table Loading

**Pattern:**
```
┌─────────────────────────────────────────┐
│ Name          Status        Actions     │ ← Real header
├─────────────────────────────────────────┤
│ [────────]    [──────]      [──]        │ ← Skeleton rows
│ [────────]    [──────]      [──]        │
│ [────────]    [──────]      [──]        │
│ [────────]    [──────]      [──]        │
└─────────────────────────────────────────┘
```

**Implementation:**
```tsx
function DataTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i}>
            <td><Skeleton style={{ width: '120px' }} /></td>
            <td><Skeleton style={{ width: '80px' }} /></td>
            <td><Skeleton style={{ width: '40px' }} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Chat Message Loading (AI Thinking)

**Pattern:**
```
🤖 Automa
   ● ● ● (Typing indicator)
```

**Implementation:**
```tsx
const TypingIndicator = styled.div`
  display: flex;
  gap: 6px;
  padding: 12px 16px;
  background: var(--color-background-surface);
  border-radius: 12px;
  width: fit-content;
`;

const Dot = styled.div<{ delay: number }>`
  width: 8px;
  height: 8px;
  background: var(--color-neutral-400);
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite;
  animation-delay: ${props => props.delay}s;

  @keyframes bounce {
    0%, 60%, 100% {
      transform: translateY(0);
    }
    30% {
      transform: translateY(-10px);
    }
  }
`;

function ChatLoadingIndicator() {
  return (
    <TypingIndicator>
      <Dot delay={0} />
      <Dot delay={0.2} />
      <Dot delay={0.4} />
    </TypingIndicator>
  );
}
```

### Inline Action Loading (Button Click)

**Pattern:**
```
[⟳ Saving...]  ← Button with spinner
```

**Implementation:**
```tsx
import { Loader2 } from 'lucide-react';

const ButtonWithLoading = styled.button<{ isLoading?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: var(--space-2) var(--space-4);
  background: var(--color-brand-primary);
  color: white;
  border: none;
  border-radius: var(--radius-base);
  cursor: ${props => props.isLoading ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.isLoading ? 0.6 : 1};

  svg {
    animation: ${props => props.isLoading ? 'spin 1s linear infinite' : 'none'};
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Usage
<ButtonWithLoading isLoading={isSubmitting} disabled={isSubmitting}>
  {isSubmitting && <Loader2 size={16} />}
  {isSubmitting ? 'Saving...' : 'Save Changes'}
</ButtonWithLoading>
```

### Spinner Component (General Purpose)

**Implementation:**
```tsx
const SpinnerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
`;

const Spinner = styled(Loader2)`
  width: 32px;
  height: 32px;
  color: var(--color-brand-primary);
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

function LoadingSpinner() {
  return (
    <SpinnerContainer>
      <Spinner />
    </SpinnerContainer>
  );
}
```

### React Query Loading Pattern

**Integration with React Query:**
```typescript
import { useQuery } from '@tanstack/react-query';

function AgentsList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['agents'],
    queryFn: () => fetch('/api/agents').then(res => res.json())
  });

  if (isLoading) {
    return <DataTableSkeleton rows={8} />;
  }

  if (isError) {
    return <NetworkError />;
  }

  return <AgentsTable data={data} />;
}
```

---

## 📊 Data Requirements & API Integration

### Insight Cards (Example)

**Voice Agent Card:**

```typescript
// API Endpoint
GET /api/v1/insight-cards/voice-agent?organizationId={orgId}&dateRange={start}/{end}

// Response Schema
interface VoiceAgentCardData {
  totalCalls: number;
  avgDuration: number; // seconds
  successRate: number; // 0-100
  recentCalls: Array<{
    id: string;
    timestamp: Date;
    duration: number;
    outcome: 'completed' | 'no_answer' | 'voicemail' | 'failed';
    customerName?: string;
    recordingUrl?: string;
  }>;
}
```

**Real-Time Subscriptions (Supabase):**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Subscribe to VAPI events
const subscription = supabase
  .channel('vapi_events')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'vapi_events',
      filter: `organization_id=eq.${organizationId}`
    },
    (payload) => {
      // Refresh Voice Agent Card
      queryClient.invalidateQueries(['insight-card', 'voice-agent']);
    }
  )
  .subscribe();
```

---

## ✅ Implementation Checklist

### Phase 1: Core Layout (Week 1)
- [ ] Set up Next.js 14 project with TypeScript
- [ ] Install dependencies: `shadcn/ui`, `Tailwind CSS`, `Lucide Icons`, `Supabase`
- [ ] Implement 3-pane layout system with responsive breakpoints
- [ ] Build vertical menu with popout behavior (desktop hover, mobile tap)
- [ ] Create top bar with Notifications + Activity Feed dropdowns
- [ ] Implement light/dark theme toggle with ThemeProvider
- [ ] Build 4 view configurations (A, B, C, D) as layout components

### Phase 2: Components (Week 2)
- [ ] Button components (Primary, Secondary, Icon)
- [ ] Card component with header/content/footer
- [ ] Dropdown panel component (reusable for notifications/feed)
- [ ] Automa chat interface with gradient input border
- [ ] Data table component with sticky header
- [ ] Empty state components (8 different states)
- [ ] Loading states and skeleton screens
- [ ] Profile dropdown with Org Switcher

### Phase 3: Pages (Week 3)
- [ ] `/` — Main landing page (View A: Chat Only)
- [ ] `/agents` — Agent library (View D: Heavy Chat Work)
- [ ] `/drive` — File management (View B: Data Display)
- [ ] `/insights` — 3 Insight Cards (View B: Data Display)
- [ ] `/work-center` — Calendar, Tasks, Hunches, Approvals (View C: Sub Menu)
- [ ] `/activity` — Activity log (View B: Data Display)
- [ ] `/settings/system` — System settings (View C: Sub Menu)
- [ ] `/profile` — User profile (View C: Sub Menu)

### Phase 4: Integration (Week 4)
- [ ] Connect to Supabase for auth and real-time subscriptions
- [ ] Implement API client with React Query
- [ ] Wire up Insight Cards with real data
- [ ] Add WebSocket subscriptions for live updates
- [ ] Implement org switcher logic (clear context on switch)
- [ ] Add notification/activity feed data fetching
- [ ] Set up RLS policies for org isolation

### Phase 5: Responsive & Accessibility (Week 5)
- [ ] Mobile layout (<768px) with hamburger menu
- [ ] Tablet layout (768–1279px) with icon-only sidebar
- [ ] Test on iOS Safari, Android Chrome, desktop browsers
- [ ] Keyboard navigation for all interactive elements
- [ ] Screen reader testing with VoiceOver/NVDA
- [ ] Color contrast validation (WCAG AA)
- [ ] Touch target size validation (44×44px min)

---

## 🎯 Final Notes

### Critical Requirements
1. ✅ **Mobile-first responsive design** — This is NOT optional
2. ✅ **Light + Dark mode support** — Both themes required
3. ✅ **Dual-density system** — Data vs. Chat spacing
4. ✅ **Org Switcher in Profile menu** — Not visible in top bar
5. ✅ **Gradient only on chat input** — Nowhere else
6. ✅ **Muted icon colors** — Less colorful than ClickUp
7. ✅ **4 view configs auto-select** — No manual toggle
8. ✅ **Notifications + Activity Feed only** — Messages dropped

### Design Principles to Remember
- **Invisible Design:** Users shouldn't think about the UI
- **ClickUp-Inspired:** Borrow patterns, not aesthetics
- **Context-Sensitive:** Information where you need it
- **Space Efficient:** Maximize screen real estate
- **Comfortable Chat:** Generous spacing for conversations

### Next Steps
1. Review this document with UI team
2. Set up Figma file with component library
3. Begin development with Phase 1 (Core Layout)
4. Schedule daily standups for first 2 weeks
5. Set up staging environment for QA testing

---

**Document Version:** 3.0 (Final)
**Last Updated:** January 21, 2026
**Status:** Production Ready ✅
**Approved By:** Product Owner
**Ready for:** Replit Designer Agent + Dev Team