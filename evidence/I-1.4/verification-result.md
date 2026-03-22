# I-1.4 — Fix Victoria's Additional Org Access

**Date:** 2026-03-22
**Type:** Data fix (no code changes)
**Status:** VERIFIED

## Problem

Victoria (victoria@misscommunicationconsulting.com) had no `additional_org_ids` set, so she could only see her primary org (Serra Honda). She should also see Serra Nissan and Tony Serra Ford.

## Fix Applied

### Step 1: Retrieve org UUIDs

```
SELECT id, name FROM organizations WHERE slug IN ('serra-nissan','tony-serra-ford');

                  id                  |      name
--------------------------------------+-----------------
 7f6455be-bed6-466a-9020-7aab1d600ec7 | Serra Nissan
 e24e580f-216e-4188-95d9-03d05bec3b30 | Tony Serra Ford
```

### Step 2: Update additional_org_ids

```sql
UPDATE users SET additional_org_ids = '["7f6455be-bed6-466a-9020-7aab1d600ec7", "e24e580f-216e-4188-95d9-03d05bec3b30"]'::jsonb
WHERE email = 'victoria@misscommunicationconsulting.com';
-- UPDATE 1
```

### Before

| Field | Value |
|-------|-------|
| email | victoria@misscommunicationconsulting.com |
| organization_id | f4c56901-89ab-4497-9bfb-69e6495a4839 (Serra Honda) |
| additional_org_ids | NULL |

### After

| Field | Value |
|-------|-------|
| email | victoria@misscommunicationconsulting.com |
| organization_id | f4c56901-89ab-4497-9bfb-69e6495a4839 (Serra Honda) |
| additional_org_ids | ["7f6455be-bed6-466a-9020-7aab1d600ec7", "e24e580f-216e-4188-95d9-03d05bec3b30"] |

## Verification: Login Response

Login endpoint: `POST /api/auth/login`

**accessibleOrganizations returned:**

| # | ID | Name | Slug |
|---|-----|------|------|
| 1 | f4c56901-89ab-4497-9bfb-69e6495a4839 | Serra Honda | serra-honda |
| 2 | 7f6455be-bed6-466a-9020-7aab1d600ec7 | Serra Nissan | serra-nissan |
| 3 | e24e580f-216e-4188-95d9-03d05bec3b30 | Tony Serra Ford | tony-serra-ford |

**Exclusion check:** Hyundai and Ford of Columbia are NOT present in the response. PASS.

## Result

Victoria now sees exactly 3 organizations: Serra Honda (primary), Serra Nissan, and Tony Serra Ford.
