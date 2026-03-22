# I-3.2 Verification: Email Notification Template and Recipient Hierarchy

**Date:** 2026-03-22
**File Modified:** server/routes/webhooks.ts
**Status:** Complete

## Changes Made

### 1. Email Template — Replaced with v1 Template

Replaced two separate inline HTML builders (`buildVapiEmailHtml` and `buildTavusEmailHtml`) with a single `generateLeadEmailHTML` function ported from the v1 app (`/home/ubuntu/Live-Store/nexxus/server/services/notifications/notificationEmailService.ts` — `generateEmailHTML`).

Key improvements:
- **Readable HTML:** Proper indentation and line breaks instead of single-line minified HTML.
- **Unified function:** One template handles both voice (VAPI) and video (Tavus) via the `channel` parameter.
- **Feature parity with v1:** Lead summary box, details grid, recording button, full transcript section, footer with support email and call ID.
- **Channel-aware styling:** Voice uses purple-blue gradient (#667eea -> #764ba2), video uses violet gradient (#7c3aed -> #a855f7). Same visual distinction as the old separate templates.
- **Configurable support email:** Uses `process.env.SUPPORT_EMAIL` with fallback to `support@huminic.ai` (matches v1 behavior).

### 2. Recipient Logic — Proper Org Hierarchy Walk

**Before (broken):** The old code fetched users for the call's org, then iterated ALL orgs to find super_admins and partner_admins. The partner_admin inclusion was wrong — it added ALL level-2 users from ALL other orgs regardless of whether they had any relationship to the target org.

**After (fixed):** Recipient resolution now follows the correct hierarchy:

| Level | Who | How Found |
|-------|-----|-----------|
| 3 | Org Admins | `storage.getUsers(orgId)` where `role.level === 3` |
| 2 | Partner Admins | Walk UP via `org.partnerId` to find the parent org, then `storage.getUsers(parentOrgId)` where `role.level === 2` |
| 1 | Super Admins | Iterate all orgs, collect all `role.level === 1` users |
| * | Additional Org Members | Any user (level <= 3) in other orgs whose `additionalOrgIds` array includes `orgId` |
| x | Exclusion | Any email starting with `admin@` is removed |

Deduplication is handled by using a `Set<string>` keyed on email address.

### 3. CommGate Check — Preserved

The CommGate check at the top of `sendLeadNotificationEmail` remains unchanged:
- Checks `org.outboundEnabled` and `org.emailEnabled`
- Returns `{ sent: 0, skipped: true }` if either is false
- Idempotency check via outbound_log also preserved

## Expected Recipients per Store

Based on the known org hierarchy (from project memory):

### Stores with partner_id -> Cage Automotive
(Ford of Columbia, Hyundai of Columbia)

| Tier | Recipients |
|------|-----------|
| Level 3 | Org admins at Ford of Columbia / Hyundai of Columbia |
| Level 2 | Partner admins at Cage Automotive (parent via partner_id) |
| Level 1 | Super admins from any org |
| Additional | Any user whose additionalOrgIds includes this org's ID |
| Excluded | admin@* emails |

### Orphan Stores (no partner_id set)
(Serra Honda, Serra Nissan, Tony Serra Ford — partner_id is NULL)

| Tier | Recipients |
|------|-----------|
| Level 3 | Org admins at the specific store |
| Level 2 | **None** — no parent org to walk to (partner_id is NULL, so the `if (org.partnerId)` branch is skipped) |
| Level 1 | Super admins from any org |
| Additional | Any user whose additionalOrgIds includes this org's ID |
| Excluded | admin@* emails |

**Note:** The 3 orphan stores will only receive Level 1 + Level 3 notifications until their `partner_id` is set to the correct parent org. This is a data issue (documented in project_org_hierarchy.md), not a code issue.

### Cage Automotive (the parent org itself)

| Tier | Recipients |
|------|-----------|
| Level 3 | Org admins at Cage Automotive |
| Level 2 | **None** — Cage has no parent (partner_id is NULL) |
| Level 1 | Super admins from any org |
| Additional | Any user whose additionalOrgIds includes Cage's ID |
| Excluded | admin@* emails |

## Call Sites Updated

1. **VAPI webhook** (line ~625): `buildVapiEmailHtml(...)` replaced with `generateLeadEmailHTML({ ..., channel: "voice" })`
2. **Tavus webhook** (line ~890): `buildTavusEmailHtml(...)` replaced with `generateLeadEmailHTML({ ..., channel: "video" })`

## No External Calls Made

- No emails sent
- No npm build executed
- No PM2 restart
- No external API calls
- Only file modified: `server/routes/webhooks.ts`
