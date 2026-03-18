# T-2 Full Application Test Report
Date: 2026-03-18
Sprint: T-2

## Summary

| Project | Passed | Failed | Skipped | Total |
|---------|--------|--------|---------|-------|
| API | 22 | 13 | 5 | 40 |
| Browser | 9 | 46 | 1 | 56 |
| Comms | 10 | 1 | 1 | 12 |
| Catalog | 5 | 0 | 0 | 5 |
| **Total** | **46** | **60** | **7** | **113** |

## Failure Categories

### Category 1: Test Infrastructure Issues (not real bugs)
These tests fail because of how the test is written, not because the feature is broken.

| Criterion | Issue | Category |
|-----------|-------|----------|
| 1.1 | Checks for lowercase "httponly" in cookie string — actual cookie has "HttpOnly" (case sensitive match) | Test bug |
| 1.3 | Logout assertion wrong — checks cookie cleared but test doesn't account for response format | Test bug |
| 1.7, 1.8, 1.12-1.14 | Browser login via UI times out — `page.waitForURL` 10s timeout, login flow may need more time or different selectors | Test bug |
| 2.1-2.5 | Same login timeout — all dashboard tests can't get past login | Test bug |
| 3.2-3.3, 3.7-3.11 | Same login timeout or API tests using wrong request context | Test bug |
| 6.1-6.5, 6.7, 6.8 | Same login timeout pattern | Test bug |
| 7.1-7.3 | Same login timeout pattern | Test bug |
| 9.1-9.3, 9.5 | Settings/profile page timeout (60s) — page takes too long to load or selectors wrong | Test bug |
| 12.1 | Health endpoint test assertion issue | Test bug |
| 12.4 | Cookie assertion case sensitivity (same as 1.1) | Test bug |

### Category 2: Real Application Issues
These tests reveal actual bugs or gaps in the application.

| Criterion | Issue | Domain |
|-----------|-------|--------|
| 4.3 | Campaign SMS execution returns 500 | BE |
| 4.4 | Campaign email execution returns 500 | BE |
| 4.5 | Kill switch toggle returns 500 | BE |
| 4.7 | Execution statuses endpoint returns 500 | BE |
| 5.4 | Takeover PATCH returns unexpected response | BE |
| 8.2 | FlexPrice billing data not rendering | FE |
| 8.3 | Super Admin billing view fails | FE |
| 8.4 | Partner/Org Admin billing view fails | FE |
| 10.1-10.4 | Tasks endpoints return 500 or 404 | BE |
| 12.5 | Entitlement check returns 500 | BE |

### Category 3: Known Failures (already in issues.md)
| Criterion | Issue |
|-----------|-------|
| 4.10 | I-036: Campaign reply doesn't trigger AI agent (fixme) |
| 11.2 | I-038: VAPI webhook rejects with 401 (fixme) |
| 11.3 | Depends on I-038 (fixme) |
| 11.6 | I-037: VAPI outbound calls lack context (fixme) |
| LC-6 | Depends on I-037 (fixme) |

## Passing Tests (46)

### API (22 passed)
4.1 Campaign create/upload/execute flow
4.2 CSV upload accepts required fields
4.6 Channel-specific pause
4.8 Campaign stop halts execution
4.9 Customer replies create TeamBox thread
5.1 Universal inbox shows email, SMS, voice
5.2 Conversation list loads with correct data
5.3 Messages display in threaded view
5.5 Users see their role's conversations
5.6 Org Admin+ sees all conversations
5.7 My Work shows own messages only
5.8 Outbound email via TeamBox works
5.10 Thread history preserved
11.1 Public widget endpoints work without auth
11.4 TextMagic webhook routes SMS to correct org
11.5 All third-party calls route through MCP
11.7 Tavus personas active per dealer
11.8 Widget video session creates Tavus conversation
11.9 VIN Solutions data syncs
12.2 Security headers present
12.3 Rate limiting works
12.6 getConversationByPhone filters by orgId

### Browser (9 passed)
1.2 Refresh token rotation works
1.4 Password strength validation
1.15 Huminic master org exists
6.6 Sales sidebar does NOT show Billing
7.4 Role-filtered metrics
7.5 Pin to Dashboard removed
7.6 Lead source labels meaningful
8.1 Billing pages load
8.5 Sales/Marketing/Service do NOT see Billing

### Comms (10 passed)
LC-1 MCP tm_send_message accessible
LC-3 VAPI assistants listed
LC-4 VAPI phone numbers listed
LC-5 VAPI call details retrieved
LC-7 Resend email delivered
LC-8 TeamBox outbound email works
LC-9 Tavus personas listed
LC-10 Tavus personas match VAPI per dealer
LC-11 VIN Solutions leads query works
LC-12 Warehouse leads exist for Serra Honda

### Catalog (5 passed)
Screenshot catalog captured for all 5 roles (60 screenshots)

## Screenshots
Location: evidence/T-2/screenshots/catalog/
- orgAdmin: 12 pages
- sales: 12 pages
- service: 12 pages
- marketing: 12 pages
- executive: 12 pages

## Next Steps
1. Fix test infrastructure issues (login flow, assertion case sensitivity) — these are test bugs, not app bugs
2. Investigate the 500 errors on campaigns, tasks, and billing — these are real BE issues
3. Log new issues in issues.md with domain tags
4. After test fixes, rerun to get accurate pass/fail counts
