# Loop Prep: REM-8

## 1. Issue-to-Domain Assignment
| Issue | Domain | Sub-Sprint | Summary |
|-------|--------|------------|---------|
| I-088 | AU | REM-8-AU | Partner Admin org switch — fix group resolution, hide Huminic from non-Super-Admin |
| I-087 | BE | REM-8-BE | Webhook email notifications for VAPI + Tavus via callMCP/Resend |
| I-086 | DT | REM-8-DT | Insert VAPI call log leads into VIN Solutions per store |

## 2. Issue-to-Test Mapping
| Issue | Playwright Test(s) | Criterion ID |
|-------|-------------------|--------------|
| I-088 | domain-01-auth.spec.ts "1.9", "1.10", "1.12" + new test for Cage-level partner | 1.9, 1.10, 1.12 |
| I-087 | live-comms.spec.ts (new LC-13: VAPI email, LC-14: Tavus email) | 11.2 + new |
| I-086 | live-comms.spec.ts "LC-11" + new verification test | new 11.7 |

## 3. Issue-to-Criterion Mapping
| Issue | Acceptance Criteria |
|-------|---------------------|
| I-088 | 1.9: Super Admin can switch all orgs; 1.10: Partner Admin sees own companies + subs only; 1.12: Org switch triggers full page refresh |
| I-087 | 11.2: VAPI end-of-call webhook accepted; NEW: email notification sent to admins on VAPI/Tavus completion |
| I-086 | NEW 11.7: VAPI call log leads exist in VIN Solutions per store |

## 4. Declared Files Per Sub-Sprint

### REM-8-AU (Auth — I-088)
- server/routes/auth.ts (login accessibleOrganizations + switch-org validation)
- tests/e2e/domain-01-auth.spec.ts (update 1.10 to test Cage-level partner admin)
- tests/e2e/helpers/auth.ts (add durran@cageautomotive.com as test user)

### REM-8-BE (Backend — I-087)
- server/routes/webhooks.ts (add email notification on VAPI end-of-call + Tavus conversation.ended)
- server/outbound.ts (email sending helper via callMCP/Resend)
- tests/e2e/live-comms.spec.ts (new LC-13, LC-14 tests)

### REM-8-DT (Data — I-086)
- (No application code — data operation via MCP scripts)
- tests/e2e/live-comms.spec.ts (verify leads in VIN Solutions)

## 5. Dependency Order
| Order | Sub-Sprint | Why First |
|-------|------------|-----------|
| 1 | REM-8-AU | Auth/org switch must work before other tests can use Partner Admin flows |
| 2 | REM-8-BE | Webhook email depends on auth working correctly for recipient resolution |
| 3 | REM-8-DT | Data insertion independent but runs last to avoid MCP contention |

## 6. Prerequisites
| Prerequisite | Status |
|-------------|--------|
| User approval for FE changes | NOT NEEDED (no FE changes) |
| MCP tools needed | callMCP for Resend email, VIN Solutions contact creation |
| Env vars to set | None new — RESEND_API_KEY already in MCP |
| External dependencies | central-mcp running (PM2 online) |
| Old app webhook code investigated | DONE — full report in agent output |

## 7. Test Infrastructure Fixes
| TI-ID | Fix | Affects |
|-------|-----|---------|
| TI-011 | Add durran@cageautomotive.com as cagePartnerAdmin test user | helpers/auth.ts |
| TI-012 | Test 1.10 must verify Cage-level partner admin sees 6 orgs (Cage + 5 dealerships) | domain-01-auth.spec.ts |
| TI-013 | Test 1.10 must verify Huminic NOT in Partner Admin accessible orgs | domain-01-auth.spec.ts |
| TI-014 | New LC-13/LC-14 tests for webhook email verification | live-comms.spec.ts |

## 8. Post-REM Test Plan
After all sub-sprints complete:
1. Smoke test all issue-specific tests
2. Full domain test: `npx playwright test --project=api --project=browser --workers=2`
3. Full comms test: `npx playwright test --project=comms --workers=1`
4. Full E2E flow test: `npx playwright test --project=e2e --workers=1`
5. Full usability audit: `npx playwright test --project=catalog --workers=1`
6. **ALL must pass at 100%. Any failures → investigate → fix → retest.**

## 9. Old App Webhook Reference (from investigation)
- **Trigger:** VAPI `end-of-call-report` at `/api/webhooks/vapi`
- **Recipients:** Role hierarchy — Super Admins + Partner Admins (junction table) + Org Admins
- **Email:** Rich HTML via Resend — assistant name, customer phone, call type, duration, cost, recording, transcript
- **From:** notifications@huminic.ai
- **Idempotency:** `notification_sent` flag on call log record
- **Tavus:** NO email in old app (in-app only) — extending to email is NEW work
- **VAPI log JSON fields:** customer_name, customer_phone, summary, transcript, store, call_id, type, duration_seconds, recording_url
