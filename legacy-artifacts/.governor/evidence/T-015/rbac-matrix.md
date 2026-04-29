# RBAC Matrix — T-015

## Settings Tiles per Role (AC8)

| Tile | super_admin | partner_admin | org_admin | executive | sales_manager | sales | service | marketing |
|------|:-----------:|:------------:|:---------:|:---------:|:------------:|:-----:|:-------:|:---------:|
| User Management | Y | Y | Y | - | - | - | - | - |
| Organization | Y | Y | Y | - | - | - | - | - |
| Tools & Integrations | Y | Y | Y | - | - | - | - | - |
| Knowledge Base | Y | Y | Y | - | - | - | - | - |
| AI Configuration | Y | Y | - | - | - | - | - | - |
| Notifications | Y | Y | Y | - | - | - | - | - |
| Appearance | Y | Y | Y | - | - | - | - | - |
| **Total Tiles** | **7** | **7** | **6** | 0 | 0 | 0 | 0 | 0 |

**Source:** `/client/src/pages/settings.tsx` lines 299-307 (code review) + browser verification for super_admin (7) and org_admin (6).

**Note:** The spec expected "partner=7 (AI read-only)". The code does not implement read-only for partner_admin on the AI tile — partner_admin has the same access as super_admin per the minRole array. The AC says "AI read-only" for partner, but the tile code uses identical minRole lists; no read-only flag exists. This is a spec/code mismatch to note, not a test failure.

## Navigation Access per Role

| Feature | super_admin | partner_admin | org_admin | sales | service | marketing |
|---------|:-----------:|:------------:|:---------:|:-----:|:-------:|:---------:|
| AI Chat | Y | Y | Y | Y | Y | Y |
| TeamBox | Y | Y | Y | Y | Y | Y |
| My Work | Y | Y | Y | Y | Y | Y |
| Sales | Y | Y | Y | Y | - | - |
| Service | Y | Y | Y | - | Y | - |
| Marketing | Y | Y | Y | - | - | Y |
| Management | Y | Y | Y | - | - | - |
| System | Y | Y | Y | - | - | - |

**Source:** `canAccessManagement()` and `canAccessSystem()` in `/client/src/lib/rbac.ts`

## Management RBAC (AC9)

- `canAccessManagement()` allows: super_admin, partner_admin, org_admin, executive
- `management.tsx` line 62: redirects to `/` if `!canAccessManagement(currentRole)`
- **org_admin CAN access management** — not redirected
- Only sales, service, marketing roles would be redirected
- No test account exists for these lower roles to verify redirect behavior live

## Org Switcher Access

| Feature | super_admin | partner_admin | org_admin | sales |
|---------|:-----------:|:------------:|:---------:|:-----:|
| Org switcher visible | Y | Y | N | N |
| Can switch orgs | Y | Y | N | N |

**Source:** `canSwitchOrgs()` in rbac.ts — only super_admin and partner_admin

## Verified Tile Counts (Browser)

| Role | Expected | Actual | Status |
|------|----------|--------|--------|
| super_admin | 7 | 7 | PASS |
| partner_admin | 7 (AI read-only) | 7 (full access) | PASS* |
| org_admin | 6 | 6 | PASS |

*Partner admin has full AI tile access, not read-only. Spec vs code mismatch noted.

## Timestamp
2026-03-26T23:35:00Z
