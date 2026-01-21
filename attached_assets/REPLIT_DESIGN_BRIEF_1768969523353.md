# Replit Designer Brief - Nexxus V2 UI/UX

**Project:** Nexxus V2 - AI-Powered Dealership Platform
**Target:** Replit Designer Agent + Development Team
**Date:** January 21, 2026
**Priority:** Critical — Ready for Implementation

---

## 🎯 Project Overview

Build a **ClickUp-inspired 3-pane UI** for an AI-powered dealership management platform. The interface must be:
- **Mobile-first responsive** (critical requirement)
- **Light + Dark mode** (both themes required)
- **Dual-density design** (compact data tables vs. spacious chat)
- **Context-aware** (4 view configurations that auto-select)
- **Subtle and professional** (avoid "icon crazy" — muted colors)

---

## 📁 Required Documents

You have been provided with TWO complete specification documents. Download and read them thoroughly before starting:

### 1. UI_DEVELOPER_HANDOFF_V3.md
**Purpose:** Complete UI/UX specifications
**Contains:**
- Navigation structure (8 menu items + 2 bottom icons)
- 4 view configurations (Chat Only, Data Display, Sub Menu, Heavy Chat Work)
- ClickUp-inspired design patterns
- Responsive breakpoints (mobile, tablet, desktop)
- Component library with code examples
- Complete route hierarchy
- API integration patterns

**Download:** [AI Drive Link - UI_DEVELOPER_HANDOFF_V3.md]

### 2. THEME_CONTRACT_V2.md
**Purpose:** Complete design token system
**Contains:**
- Light + Dark mode color palettes
- Dual-density typography (data vs. chat)
- Spacing, radius, shadow, motion tokens
- Mobile-first responsive tokens
- Organization branding (logo + 2 colors only)
- Accessibility requirements (WCAG AA)
- Component implementation examples

**Download:** [AI Drive Link - THEME_CONTRACT_V2.md]

---

## 🚀 Quick Start Guide

### Step 1: Read Both Documents
- Start with UI_DEVELOPER_HANDOFF_V3.md (navigation, layouts, components)
- Then read THEME_CONTRACT_V2.md (design tokens, theming)
- Pay special attention to **mobile-first responsive** sections

### Step 2: Understand Core Decisions (Already Finalized)

| Decision | Final Answer |
|----------|--------------|
| **Chat Interface** | ONE interface: Automa (DealerBrain is internal name) |
| **Top Bar Icons** | 🔔 Notifications + 📊 Activity Feed only (Messages dropped) |
| **Org Switcher** | Inside Profile dropdown (not visible in top bar) |
| **View Modes** | 4 configs auto-select by route (NO manual toggle) |
| **Density** | Dual-density: Data (13px, 1.4 line-height) vs. Chat (14px, 1.6 line-height) |
| **Themes** | Light + Dark mode (both required, not optional) |
| **Mobile** | Mobile-first responsive (hamburger menu, bottom drawer, collapsible sidebar) |
| **Icons** | Lucide library, 24×24px, 2px stroke, muted colors (avoid colorful) |
| **Gradient** | Chat input border ONLY (purple → blue → cyan, VERY subtle animation) |
| **Agent Templates** | Users build from scratch, avatar library provided |

### Step 3: Core Layout Structure

```
Desktop (≥1440px):
┌──────────────────────────────────────────────────────┐
│ Top Bar: [🔔] [📊] [🌓] [@User ▾]                   │
├─────┬────────────────────────────────────┬───────────┤
│ Left│       Center Pane                  │Right Pane │
│240px│       (Flex)                       │320px      │
│     │                                    │           │
│[📋] │                                    │ Automa    │
│Main │                                    │ Chat      │
│[🤖] │                                    │           │
│Agent│                                    │ OR        │
│[📁] │                                    │           │
│Drive│                                    │ Artifact  │
│[📊] │                                    │ Display   │
│Insig│                                    │           │
│[💼] │                                    │           │
│Work │                                    │           │
│[📈] │                                    │           │
│Activ│                                    │           │
│─────│                                    │           │
│[⚙️] │                                    │           │
│Syst │                                    │           │
│[👤] │                                    │           │
│Prof │                                    │           │
└─────┴────────────────────────────────────┴───────────┘

Mobile (<768px):
┌──────────────────────────────┐
│ ☰ Nexxus   [🔔] [📊] [@User] │
├──────────────────────────────┤
│                              │
│   Main Content (Full Width)  │
│                              │
└──────────────────────────────┘
│ [Chat Toggle]  [Menu Toggle] │
└──────────────────────────────┘
```

---

## 🎨 Design System Highlights

### Colors
- **Light Mode:** White backgrounds, slate text (#0f172a), purple primary (#8b5cf6)
- **Dark Mode:** Slate 900 backgrounds (#0f172a), white text, lighter purple (#a78bfa)
- **Muted Icons:** Gray scale by default, subtle color on hover

### Typography
- **Data Density:** 13px, line-height 1.4, padding 8-12px (tables, lists)
- **Chat Comfort:** 14px, line-height 1.6, padding 16-20px (conversations)
- **Font:** Inter (sans-serif), weights 400-700

### Spacing
- **Base:** 8px grid system
- **Menu:** 64px collapsed, 240px expanded
- **Top Bar:** 56px height
- **Right Pane:** 320px fixed (desktop), slide-over (mobile)

### Radius
- **Buttons:** 4px
- **Cards:** 12px
- **Chat Bubbles:** 12px
- **Inputs:** 8px

---

## 📱 Mobile-First Responsive (CRITICAL)

| Breakpoint | Layout | Behavior |
|------------|--------|----------|
| **<768px** (Mobile) | Stacked | Hamburger menu (overlay), bottom drawer for chat, full-width content |
| **768-1279px** (Tablet) | Hybrid | 64px icon-only sidebar, slide-over right pane (320px modal) |
| **1280-1439px** (Desktop S) | 3-pane | Auto-collapse sidebar (64px), slide-over right pane |
| **≥1440px** (Desktop M) | 3-pane | Expanded sidebar (240px), fixed right pane (320px) |

**Mobile Behavior:**
- ☰ Hamburger → Full-screen left overlay menu
- Chat icon → Bottom drawer (70% screen height, swipe to dismiss)
- All touch targets minimum 44×44px
- Top bar icons stack if needed (<360px width)

---

## 🧩 Component Priority List

### Phase 1: Layout & Navigation
1. **3-Pane Layout System** (Left, Center, Right)
2. **Vertical Menu** (8 items + 2 bottom, popout on hover/tap)
3. **Top Bar** (Notifications, Activity Feed, Theme Toggle, Profile)
4. **Responsive Breakpoints** (Mobile hamburger, tablet icon-only, desktop expanded)

### Phase 2: Core Components
5. **Button Components** (Primary, Secondary, Icon)
6. **Card Component** (Header, Content, Footer)
7. **Dropdown Panel** (Notifications, Activity Feed, Profile menu with Org Switcher)
8. **Automa Chat Interface** (with gradient border on input)

### Phase 3: Data Components
9. **Data Table** (Compact 13px, sticky header, row hover)
10. **Empty States** (8 different states for different pages)
11. **Loading States** (Skeleton screens, spinners)
12. **Form Inputs** (Text, textarea, select, checkbox, radio)

### Phase 4: Page Templates
13. **View A: Chat Only** (/ route — Landing page)
14. **View B: Data Display** (/drive, /insights, /activity)
15. **View C: Sub Menu** (/work-center, /settings, /profile)
16. **View D: Heavy Chat Work** (/agents)

---

## ⚠️ Critical Requirements Checklist

Before submitting your design, verify:

- [ ] **Mobile-first responsive** implemented (hamburger, bottom drawer, collapsible sidebar)
- [ ] **Light + Dark mode** both working (theme toggle in top bar)
- [ ] **Dual-density system** applied (13px data tables, 14px chat)
- [ ] **4 view configurations** auto-select by route (no manual toggle)
- [ ] **Org Switcher inside Profile dropdown** (not visible in top bar)
- [ ] **Only 2 top bar icons** (Notifications + Activity Feed — Messages dropped)
- [ ] **Gradient only on chat input** (nowhere else — purple/blue/cyan, subtle animation)
- [ ] **Muted icon colors** (gray default, avoid colorful like ClickUp)
- [ ] **Touch targets 44×44px minimum** (mobile accessibility)
- [ ] **WCAG AA contrast** (4.5:1 for text, 3:1 for UI components)
- [ ] **Lucide icons** (24×24px menu, 20×20px top bar, 2px stroke)

---

## 🔍 Design Principles to Follow

### 1. Invisible Design (ClickUp Philosophy)
> "Information is just where you need it to be and you don't even think about it."

- View modes feel natural and contextual
- No manual configuration needed
- Users focus on their work, not the interface

### 2. Space Efficiency
- Maximize screen real estate
- Compact data tables (32px row height)
- Small icons with clear labels (11px)
- Tight spacing for lists (8px gaps)

### 3. Chat Comfort
- Spacious conversation layout
- 65-character max line length for readability
- Generous padding (16-20px)
- Clear message separation (16px gaps)

### 4. Subtle Animation
- Barely noticeable gradient shift (15s duration)
- Fast transitions (150ms standard)
- Smooth hover states
- No distracting motion

### 5. Professional & Clean
- Muted color palette (gray scale)
- Avoid "icon crazy" (less colorful than ClickUp)
- Consistent patterns throughout
- Clear visual hierarchy

---

## 📊 Technology Stack (Recommended)

### Frontend Framework
- **Next.js 14** (App Router, TypeScript)
- **React 18** (latest stable)
- **TypeScript 5.x** (strict mode)

### Styling
- **Tailwind CSS** (utility-first CSS)
- **shadcn/ui** (accessible component library)
- **CSS Custom Properties** (design tokens from THEME_CONTRACT)

### Icons & Assets
- **Lucide Icons** (https://lucide.dev/)
- **Inter Font** (Google Fonts)
- **Fira Code** (monospace, optional)

### State Management
- **React Query** (server state, caching)
- **Zustand** (client state, lightweight)
- **React Context** (theme, auth)

### Real-Time
- **Supabase** (WebSocket subscriptions, real-time updates)

### UI Libraries
- **Tremor** (charts, data viz)
- **Radix UI** (headless components)
- **Framer Motion** (optional, for complex animations)

---

## 🔒 Security & Authentication Notes

The designer should implement UI patterns that support secure authentication and authorization:

### Authentication Requirements
- **JWT-based authentication** with token stored in `Authorization: Bearer {token}` header
- **Session management** with refresh token in httpOnly cookie
- **Protected routes** that redirect to `/login` if unauthenticated
- **Token expiration handling** with automatic refresh or re-login

### Authorization (RBAC - 4 Tiers)
- **Super Admin** — Full system access (all pages, all orgs, all tools)
- **Partner Admin** — Multi-org management (assigned orgs only, limited system settings)
- **Org Admin** — Organization management (single or multiple assigned orgs)
- **Org Staff** — Basic user access (limited to assigned org, no admin features)

### Frontend Responsibilities
✅ **Check user role before rendering admin-only UI elements**
- Hide System menu for org_staff users
- Hide Partner management for non-super_admin users
- Display appropriate menu items based on role

✅ **Handle session expiration gracefully**
- Redirect to `/login` on 401 responses
- Clear local storage and session storage
- Display "Session expired" message

✅ **Support organization context switching**
- Partner Admin can switch between assigned orgs
- Org Admin can switch if assigned to multiple orgs
- Clear all context on org switch (fresh start)

❌ **DO NOT trust frontend checks alone**
- Backend must enforce all permissions at API level
- Frontend role checks are for UX only (hide/show UI)
- Always validate permissions server-side

### Security Patterns to Implement
1. **Protected Route Middleware** — Check auth token before rendering pages
2. **Role-Based Rendering** — Use `useCurrentUser()` hook to conditionally show UI
3. **Secure Token Storage** — Access token in memory, refresh token in httpOnly cookie
4. **CSRF Protection** — Use SameSite cookies and CSRF tokens for mutations
5. **XSS Prevention** — Sanitize user input, use React's built-in escaping

### Error Handling
- **401 Unauthorized** → Redirect to `/login`
- **403 Forbidden** → Show "Permission Denied" page
- **Network Error** → Show "Unable to connect" with retry button

**Reference:** See UI_DEVELOPER_HANDOFF_V3.md Section 6 (Authentication & Authorization) for implementation details.

---

## 🎬 Getting Started Steps

### For Replit Designer Agent:

1. **Read Both Documents:**
   - Download and read UI_DEVELOPER_HANDOFF_V3.md
   - Download and read THEME_CONTRACT_V2.md

2. **Set Up Project Structure:**
   ```
   /app
     /layout.tsx         # 3-pane layout wrapper
     /page.tsx           # Main landing (View A: Chat Only)
     /agents             # Agent library (View D)
     /drive              # File management (View B)
     /insights           # Insight cards (View B)
     /work-center        # Tasks, calendar, hunches (View C)
   /components
     /layout
       /VerticalMenu.tsx
       /TopBar.tsx
       /RightPane.tsx
     /ui
       /Button.tsx
       /Card.tsx
       /Dropdown.tsx
       /ChatInput.tsx
   /styles
     /tokens.css         # Design tokens from THEME_CONTRACT
     /globals.css
   /contexts
     /ThemeContext.tsx   # Light/dark mode provider
   ```

3. **Implement in This Order:**
   - Week 1: Layout system + Navigation
   - Week 2: Core components
   - Week 3: Page templates
   - Week 4: Integration + Real-time
   - Week 5: Mobile responsive + A11y

4. **Test Thoroughly:**
   - All 4 view configurations
   - Light + Dark mode
   - Mobile (<768px), Tablet (768-1279px), Desktop (≥1280px)
   - Keyboard navigation
   - Screen reader compatibility

---

## 🤝 Questions & Support

If you encounter ambiguity or need clarification:

1. **First:** Re-read the relevant section in UI_DEVELOPER_HANDOFF_V3.md or THEME_CONTRACT_V2.md
2. **Check:** The "Design Principles" and "Critical Requirements" sections
3. **Remember:** All major design decisions are already finalized (see Step 2 above)
4. **Ask:** Only if something is genuinely unclear after reviewing both documents

---

## ✅ Deliverables

When you complete the implementation, provide:

1. **Figma File** (optional, for visual handoff)
   - Light + Dark mode designs
   - All 4 view configurations
   - Mobile, Tablet, Desktop layouts
   - Component library

2. **Codebase**
   - Next.js 14 project
   - Complete component library
   - All 8 main pages implemented
   - Mobile-responsive layouts
   - Theme toggle working
   - Design tokens in CSS custom properties

3. **Documentation**
   - Setup instructions (README.md)
   - Component usage guide
   - API integration notes
   - Known issues / future improvements

---

## 🎯 Success Criteria

Your implementation will be considered successful if:

✅ **All 10 critical requirements** are met (see checklist above)
✅ **Mobile-first responsive** works on all breakpoints
✅ **Light + Dark mode** both implemented and tested
✅ **Dual-density system** applied correctly
✅ **WCAG AA compliant** (4.5:1 contrast minimum)
✅ **ClickUp-inspired** but differentiated (muted colors, 3-color gradient)
✅ **4 view configurations** auto-select contextually
✅ **All 8 main pages** functional with correct view modes
✅ **Touch targets 44×44px** for mobile accessibility
✅ **Gradient only on chat input** (nowhere else)

---

## 📥 Document Downloads

### Required Reading (Download Now):

1. **UI_DEVELOPER_HANDOFF_V3.md**
   - Complete UI/UX specifications
   - Navigation, layouts, components
   - [Download from AI Drive: /nexxus-design-handoff/UI_DEVELOPER_HANDOFF_V3.md]

2. **THEME_CONTRACT_V2.md**
   - Complete design token system
   - Light + Dark mode palettes
   - [Download from AI Drive: /nexxus-design-handoff/THEME_CONTRACT_V2.md]

---

**Project Status:** Ready for Implementation ✅
**Priority:** Critical (Blocking development)
**Timeline:** 5 weeks (suggested)
**Approval:** Product Owner + Design Lead

---

## 🚀 Let's Build Something Amazing!

You have everything you need in the two documents above. Follow the specifications carefully, implement mobile-first, support both themes, and you'll create a beautiful, professional UI that users will love.

**Good luck, and happy coding! 🎨**