# Section Audit: Top Icons / Profile
**Sprint:** E-013
**Route:** TopBar component (all pages) + /profile
**Page Components:** client/src/components/layout/TopBar.tsx (425 lines), client/src/pages/profile.tsx (459 lines)
**Sub-menu:** SubMenuManager.tsx (profile section, lines 735-755)

## What Exists in Code

### TopBar.tsx — Top Navigation Bar

Fixed h-14 header with the following elements left-to-right:

| Element | Icon/Control | Behavior | Data Source |
|---|---|---|---|
| Logo | Text "Nexxus Connect™" | Static — no icon, locked design | — |
| Org Switcher | Building2 + ChevronDown (center) | Dropdown: lists all orgs, click switches org (full page reload) | AppContext.organizations |
| Globe | Globe icon | **Opens /p/{org-slug} in NEW WINDOW** (`window.open(..., '_blank')`) | currentOrganization.slug |
| Notifications | Bell icon + unread badge | Dropdown: scrollable list of notifications with mark-read + mark-all-read | AppContext.notifications |
| Activity Feed | Activity icon | Dropdown: 8 most recent activity log entries from /api/activity-log?limit=8 | **Real API data** |
| Theme Toggle | Moon/Sun icon | Toggles light/dark mode via ThemeContext | ThemeContext |
| Profile Menu | User avatar + chevron | Dropdown: name, email, role badge, links to Profile/Preferences/Billing/Take a Tour, Logout | AppContext.currentUser |
| Role Switcher | ArrowDownRight icon | **DEV TOOL** — dropdown with all 8 roles. Changes currentRole for testing RBAC. | — |

### Key Findings in TopBar

1. **Globe opens in NEW WINDOW** (`_blank`) — manifest says "Landing page needs to open in new window." Code: `window.open(\`/p/${currentOrganization?.slug || 'demo'}\`, '_blank')`. **MATCHES manifest requirement.**
2. **Activity Feed is from REAL API** — `/api/activity-log?limit=8`, mapped through `mapActivityLogToItem`. NOT the same as notifications.
3. **Notifications are from AppContext** — `notifications` array, `unreadNotificationCount`. These appear to be in-app notifications, possibly from mock/state. Need to verify if they come from a real API or are client-side generated.
4. **Profile Menu has "Take a Tour"** — manifest says rename to "Reset Tour." Code shows label "Take a Tour" (line 379), data-testid "menu-item-take-tour". **MISMATCH — should be "Reset Tour" per manifest.**
5. **Billing link in Profile Menu** — guarded by `canAccessSystem(currentRole)`. Links to `/profile/billing`. Manifest says billing should be moved to Manage page. But the Profile Menu dropdown still has a Billing link.
6. **Role Switcher is a DEV TOOL** — explicitly commented as "Remove/restrict in production" (line 389).

### Profile Page (profile.tsx)

**2 tabs:** My Profile, Preferences

#### My Profile Tab
- Avatar with photo upload (click avatar → file picker → POST /api/users/me/photo)
- Photo validation: must be image, max 500KB
- User info: name, email, role badge, org badge
- Edit Profile button → inline edit (firstName, lastName, email) → PATCH /api/users/me
- Contact Info card: email input, phone input (hardcoded default "+1 (555) 123-4567"), Save Changes button
- **Change Password card:** current password, new password (min 6 chars), confirm password. Validation: mismatch warning. POST /api/auth/change-password.
- **All backed by real API mutations**

#### Preferences Tab
- **Appearance:** Dark mode toggle (Switch)
- **Notifications:** Push notifications toggle, email digest toggle
- **Regional Settings:** Language selector (English/Spanish/French), timezone selector (PST/EST/UTC)
- **Product Tour:** "Reset Tour" button — calls `setShowTour(true)`. Button label: "Reset Tour" with RotateCcw icon. data-testid: "button-reset-tour"

**NOTE:** Profile page has "Reset Tour" on the page itself (correct per manifest), but the TopBar dropdown says "Take a Tour" (incorrect per manifest).

#### What's NOT on Profile Page
- **No Billing tab** — Comment at line 10: "Billing was moved to the Management page (BillingDashboard component) in S-6." **Matches manifest requirement S-6.AC3.**
- **No "Take Tour" tab** — Tour reset is in Preferences, not a separate tab.

### Sub-menu Panel (SubMenuManager.tsx, profile section)
- Nav items: My Profile (links to /profile), Preferences (links to /profile/preferences)
- No Billing link in profile sub-menu (correctly moved to Manage)

## Manifest vs Code

### Top Icons Manifest

| Manifest Item | Code Status | Gap? |
|---|---|---|
| Items: Landing Pages, Notifications, Activity Feed, UI Color, Profile, Arrow (Role Switcher) | YES — Globe (landing), Bell (notifications), Activity (feed), Moon/Sun (theme), Avatar (profile), ArrowDownRight (role switcher) | No gap |
| Landing page opens in new window | YES — `window.open(..., '_blank')` at line 187 | No gap |
| Activity and notifications may be same data — need to check | **DIFFERENT** — Activity uses /api/activity-log (real API), Notifications use AppContext state (possibly mock) | Clarified — they are separate |

### Profile Manifest

| Manifest Item | Code Status | Gap? |
|---|---|---|
| Sub items: Preferences, Billing, Take Tour | Profile has: My Profile, Preferences (2 tabs). No Billing tab (moved to Manage). No separate "Take Tour" tab (Reset Tour is inside Preferences) | Billing moved correctly per S-6. Tour is in Preferences, not standalone. |
| "Take Tour" should be retitled "Reset Tour" | Profile page: "Reset Tour" ✓. TopBar dropdown: **still says "Take a Tour"** ✗ | **Gap — TopBar menu item not renamed** |
| Billing needs moved to submenu of manage | YES — Profile has no Billing. Manage has BillingDashboard. | No gap on page. **But TopBar Profile dropdown still links to /profile/billing** |

## Findings

1. **TopBar Profile Menu still says "Take a Tour"** — Manifest says rename to "Reset Tour." The Profile page itself says "Reset Tour" correctly, but the TopBar dropdown menu item at line 379 says "Take a Tour." Inconsistent.
2. **TopBar Profile Menu still has Billing link** — Links to `/profile/billing`. Billing was moved to Manage page (S-6.AC2/AC3), but the TopBar dropdown still shows it. This link may go to a non-existent route or render incorrectly.
3. **Activity Feed and Notifications are separate** — Activity uses real API data from /api/activity-log. Notifications use AppContext state. Manifest wondered if they were the same — they are not.
4. **Role Switcher is a dev tool** — needs to be removed or restricted for production.
5. **Contact phone is hardcoded** — Profile page shows "+1 (555) 123-4567" as default phone (line 285). Not fetched from API.
6. **Profile photo upload is functional** — POST /api/users/me/photo with image validation. Real API.
7. **Change Password is functional** — POST /api/auth/change-password with validation. Real API.
8. **Notification data source needs verification** — Are notifications from a real backend API or client-side mock? AppContext notifications may be generated locally.

## Existing ACs

No section-specific ACs exist yet for Top Icons / Profile.

## New ACs Needed

| Proposed AC | Priority | Dimension |
|---|---|---|
| Globe icon opens landing page in new browser window (not same window) | T2 | FE |
| Notifications bell shows unread count, clicking marks as read | T2 | FE/BE |
| Activity feed shows real activity from /api/activity-log | T2 | FE/BE |
| Theme toggle switches light/dark and persists | T3 | FE |
| Org switcher changes org context and reloads page | T1 | FE/BE |
| "Take a Tour" renamed to "Reset Tour" in TopBar profile dropdown | T3 | FE |
| Billing link removed from TopBar profile dropdown (moved to Manage) | T3 | FE |
| Profile photo upload works (POST /api/users/me/photo) | T2 | FE/BE |
| Profile edit saves (name, email via PATCH /api/users/me) | T2 | FE/BE |
| Change password works with validation (min 6 chars, must match) | T2 | FE/BE |
| Role switcher restricted or removed in production | T3 | FE |
| Notification data comes from real backend (not mock) | T2 | FE/BE |

## Section Description (DRAFT — for operator edit)

**Top Icons form the persistent navigation bar across all pages.** From left to right: Nexxus Connect logo (text-only, locked design), org switcher (center dropdown to switch between organizations, triggers full page reload), and right-side icons — Globe (opens public landing page /p/{slug} in new window), Notifications (bell with unread badge, scrollable dropdown with mark-read), Activity Feed (8 most recent system events from /api/activity-log), Theme Toggle (light/dark via Moon/Sun), Profile Menu (avatar dropdown with links to profile, preferences, billing, tour, and logout), and Role Switcher (DEV TOOL for testing RBAC with all 8 roles).

**Profile (/profile)** has 2 tabs: **My Profile** (avatar with photo upload, name/email/role display, edit profile inline, contact info, change password — all with real API mutations) and **Preferences** (dark mode toggle, push/email notification toggles, language/timezone selectors, and "Reset Tour" button).

**Issues found:** TopBar profile dropdown says "Take a Tour" but should be "Reset Tour" (Profile page itself says "Reset Tour" correctly). TopBar profile dropdown still has a Billing link to /profile/billing despite billing being moved to Manage page. Role Switcher dev tool needs production gate. Contact phone is hardcoded placeholder. Notification data source needs verified (real API vs client-side mock).
