# Cross-Sign Verification — T-015

## Cross-Org Data Isolation Summary

| Org | Conversations | Conversation Org IDs | Users Visible | Cross-Org Leak |
|-----|--------------|---------------------|---------------|----------------|
| Serra Honda | 158 | f4c56901 (own) | 1 (self) | NONE |
| Serra Nissan | 8 | 7f6455be (own) | 1 (self) | NONE |
| Tony Serra Ford | 7 | e24e580f (own) | 2 (self + super_admin*) | NONE |
| Ford of Columbia | 4 | c1f6667c (own) | 1 (self) | NONE |
| Hyundai of Columbia | 15 | 9d2c3591 (own) | 1 (self) | NONE |

*Super admin (duane.wells@huminic.ai) is assigned to Tony Serra Ford as default org.

## Partner Admin Org Visibility

| Item | Status |
|------|--------|
| All 5 dealerships visible | PASS |
| Huminic org visible in list | YES (minor UI leak) |
| Huminic org data accessible | NO (switch returns null) |
| Cage Automotive (own) visible | PASS |

## Org Switcher Verification

- Partner admin starts at Cage Automotive (3 conversations)
- Switches to Serra Nissan via /api/auth/switch-org
- New token issued, scoped to Serra Nissan
- Conversations change: 3 (Cage) → 8 (Nissan), all with Nissan org ID
- Data isolation maintained across org switch

## Password Reset Flow

- Forgot Password link present on login page (/forgot-password)
- Form accepts email, shows generic "Check your email" message
- Does NOT reveal whether account exists (correct security pattern)
- Backend uses Resend API for email delivery (conditional on RESEND_API_KEY env var)
- Reset token expires in 1 hour
- Rate-limited via authLimiter

## PM2 Log Check

No "Could not resolve organization from assistantId" errors found in nexxus-app PM2 logs (last 500 lines).

## Findings

### PASS
- All 5 orgs have clean data isolation
- Conversations are strictly org-scoped
- User lists are org-scoped
- Partner admin can see all 5 dealerships
- Org switcher works correctly, data changes on switch
- Settings tiles match expected counts (7/7/6)
- Password reset flow is secure
- No org resolution errors in PM2 logs

### NOTES
1. **Huminic in org list** — Partner admin's /api/organizations response includes "Huminic" org. However, attempting to switch to Huminic returns null/empty. This is a minor UI leak (org name visible) but no data access. Severity: LOW.
2. **AI tile read-only** — AC8 spec says partner_admin should see AI tile as "read-only". The code does not implement read-only; partner_admin has identical access to super_admin for the AI tile. This is a spec/code discrepancy, not a security issue.
3. **Management redirect** — Cannot verify redirect for sales/service/marketing roles because no test accounts exist for those roles. Code review confirms the guard exists (management.tsx line 62).

## Timestamp
2026-03-26T23:36:00Z
