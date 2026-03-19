# AUDIT-1a Defects

## From P2-S0 (Security middleware stack)

### DEF-001: Post-sprint report claims auth rate limit "10/min" — actual is 100/15min
- Severity: MINOR (documentation only — code is correct)
- File: server/routes/auth.ts:17-23
- Action: Update P2-S0 post-sprint report to reflect current configurable rate limit

### DEF-002: Post-sprint report claims "fails closed" with ENTITLEMENT_FAIL_OPEN — actual is fail-open with ENTITLEMENT_FAIL_CLOSED
- Severity: MINOR (documentation only — code is intentionally fail-open per REM-2)
- File: server/middleware/entitlementCheck.ts:26-36
- Action: Update P2-S0 post-sprint report to reflect current fail-open behavior

### DEF-003: (req as any).requestId introduced by P2-S0 contradicting "no new any types"
- Severity: MINOR (type safety — functional code works)
- File: server/index.ts:90
- Action: Log in backlog (type the request object properly)

### DEF-004: server/replit_integrations/ directory still exists with legacy naming
- Severity: MINOR (no functional impact — naming artifact)
- Action: Log in backlog (clean up or rename)
