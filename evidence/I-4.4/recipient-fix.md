# I-4.4 — Email Recipient Filtering Fix

**Date:** 2026-03-23
**File Modified:** server/routes/webhooks.ts
**Function:** sendLeadNotificationEmail (recipient resolution block, ~lines 180-240)

## Problem

1. Deactivated users (isActive === false) were not excluded from lead notification emails.
2. The exclusion filter only removed `admin@` prefixed emails, missing other test/seed accounts (e.g., `executive@serrahonda.com`, `salesmanager@serrahonda.com`, `orgadmin@serrahonda.com`).

## Changes Made

### 1. Added `u.isActive !== false` guard at all four recipient-adding locations

- **Level 3 (Org admins):** Added `&& u.isActive !== false` to the condition
- **Level 2 (Partner admins):** Added `&& u.isActive !== false` to the condition
- **Level 1 (Super admins):** Added `&& u.isActive !== false` to the condition
- **Additional orgs:** Added `&& u.isActive !== false` to the condition

The check uses `u.isActive !== false` (not `u.isActive === true`) so that users with null/undefined isActive are treated as active (backward compatible).

### 2. Replaced narrow exclusion block with comprehensive filter

Before:
```typescript
// Only removed admin@ prefixed emails
if (email.startsWith("admin@")) {
  recipientEmails.delete(email);
}
```

After:
```typescript
// Belt-and-suspenders: remove test/seed accounts by pattern
const testPatterns = ['@nexxus.com', '@test.com'];
for (const email of recipientEmails) {
  if (email.startsWith("admin@") || testPatterns.some(p => email.endsWith(p))) {
    recipientEmails.delete(email);
  }
}
```

### 3. Logging

The existing log line at line 242 was already correctly placed AFTER the filtering block:
```typescript
console.log(`[LeadNotify] Resolved ${recipients.length} recipient(s) for org "${org.name}": ${recipients.join(", ")}`);
```

No change needed.

## Verification

- `npx tsc --noEmit` — clean compile, zero errors
