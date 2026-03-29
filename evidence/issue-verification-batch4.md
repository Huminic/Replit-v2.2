# Issue Verification — Batch 4

**Date:** 2026-03-28
**Verifier:** Code read verification (no live tests)
**App root:** /home/ubuntu/Claude-store/nexxus2.2_replit

| ID | Area | Still exists? | Evidence | Effort | Notes |
|------|------|---------------|----------|--------|-------|
| I-102 | Photo Studio FE | PARTIALLY FIXED | FAL proxy integration EXISTS: client calls `/api/fal-proxy` (tool-executor.ts:19), server has `/api/fal-proxy` route (server/routes/proxy.ts:7). Photo Studio agent defined in marketing-agents.ts:71. However, marketing.tsx:215 has a comment: "I-102: Photo Studio agent has a known FE/FAL integration issue". Proxy plumbing is present but the known issue comment suggests a remaining problem. | S | Needs live test to confirm if image generation actually works end-to-end. Proxy code looks functional. |
| I-103 | Test quality | YES | s11-demo-hotfix.spec.ts contains exactly 6 `expect(true).toBeTruthy()` always-true assertions (not 8 as originally reported). Found in AC2, AC3, AC4, AC11 area tests. These are placeholder pass-throughs, not real assertions. | S | 6 always-true assertions, not 8. Still bad practice — tests pass regardless of actual behavior. |
| I-104 | Test quality | YES | 7 test files in tests/observability/ contain 206 total `expect.fail("STUB")` lines. Breakdown: departments(17), main-page(10), marketing-agents(44), my-work(4), teambox(4), topbar-settings-profile(16), widget-outbound(8) = 103 stub tests. All fail immediately with STUB marker. | M | Count confirmed at 103 stubs across 7 files. Zero real test logic. |
| I-105 | Billing | YES | server/routes/billing.ts checks `org.billingCustomerId` and returns `{ configured: false }` if missing (lines 11-12, 42-43, 62, 78, 113). Billing depends on FlexPrice billingCustomerId being set on org records. If no org has this field populated, all billing endpoints return "not configured". Code is structurally correct but requires FlexPrice customer IDs to be seeded/configured per org. | M | Backend code is complete. Issue is configuration/data — orgs need billingCustomerId set. |
| I-106 | Campaigns | NO (was wrong) | DEFAULT_RATE_LIMIT_MAX = 100 in server/outbound.ts:7. This is 100 messages per window, not 3. The rate limit is reasonable and not the cause of zero-message campaigns. Root cause is elsewhere. | - | Rate limit confirmed at 100. Original diagnosis was incorrect. |
| I-107 | SMS failures | NO (was wrong) | Same as I-106. DEFAULT_RATE_LIMIT_MAX = 100. SMS failure rate is not caused by rate limiting at 3. If 63% failure rate exists, root cause is something else (carrier rejection, number quality, TCPA hours). | - | Needs live log analysis to determine actual SMS failure cause. |
| I-109 | Git hygiene | YES | `git status --short` shows: 2 modified files (.claude/hooks/context-check.sh, .claude/settings.json), 6 deleted .ghost files, deleted .governor/bus files, deleted .governor/docs file, modified sprint-activity.log. Multiple uncommitted changes exist. | S | Routine cleanup commit needed. |
| I-110 | Test config | YES | 2 files hardcode URL without env fallback: tests/verify-all.ts (`const BASE = 'https://dev.huminicdev.com'`), tests/e2e/g004-gap-coverage.spec.ts (`const BASE_URL = 'https://dev.huminicdev.com'`). 9 other test files use `process.env.BASE_URL || "https://dev.huminicdev.com"` which is acceptable (env var with fallback). | S | 2 files need fixing (verify-all.ts, g004-gap-coverage.spec.ts). Rest already use env var pattern. |
| I-111 | Test coverage | MOSTLY YES | Test files found: /my-work has tests (observability/my-work.test.ts). Missing test files for: /usage, /settings/billing/usage, /settings/billing/plan, /settings/billing/invoices, /settings/org-wizard, /profile/preferences. That's 6 routes with zero test coverage, not 7. | M | 6 of 7 routes still untested. /my-work has an observability test (though it's stubs per I-104). |
| I-141 | VAPI webhook | YES (by design) | webhooks.ts:622-624 returns 422 when `assistantId` from VAPI payload cannot be matched to any agent's `vapiAssistantId` field in any org. The schema (vapiCallSchema) accepts `assistantId` as optional (line 491). If VAPI sends a call without assistantId or with an unregistered one, 422 is returned. This is intentional validation but will reject calls from unconfigured agents. | M | Not a bug per se — it's a config gap. Every VAPI assistant must have its ID registered on a Nexxus agent record. |
| I-142 | VIN lead source | FIXED | webhooks.ts:678-681 resolves lead source per dealer: `const vinLeadSourceName = orgSettings.vinLeadSourceName || "Dealers WebSite"`. It reads from org-level settings with "Dealers WebSite" as fallback. Same pattern for Tavus at line 998. Per-dealer configuration is supported. | - | Fixed. Reads from orgSettings.vinLeadSourceName with correct default. |
| I-145 | Walk-in followup | NO EVIDENCE OF ISSUE | server/services/scheduler.ts:187 handles `new_lead_followup` trigger type. server/routes/insights.ts has extensive walk-in lead analysis (lines 74-85, 459-478, 779-819). No specific "walk-in followup trigger" feature exists as a distinct trigger type — walk-ins are handled through the generic new_lead_followup trigger. | ? | Unclear what the original issue was. Walk-in data is analyzed in insights. Follow-up triggers are generic (new_lead_followup), not walk-in-specific. Needs clarification of original requirement. |
| I-146 | Kill switch | YES | server/outbound.ts:244-245: when global kill switch off, returns `{ allowed: false, reason: "Global outbound kill switch is OFF" }`. Line 248-249: same for org-level. Line 276-277: campaign kill switch. In ALL cases, messages are simply BLOCKED (return false). There is NO queue-and-release mechanism — messages that hit the kill switch are dropped, not queued for later delivery. | M | Confirmed: block-and-drop behavior. No queuing. Messages sent during kill switch period are permanently lost. |
| I-153 | Session timeout | FIXED | SessionTimeoutDialog component exists at client/src/components/auth/SessionTimeoutDialog.tsx. Fully implemented with countdown timer, "Stay Signed In" and "Log Out Now" buttons, uses useSessionTimeout hook, integrates with AuthContext. Imported in App.tsx. | - | Component is complete and integrated. |
| I-156 | Insights page | EXISTS | client/src/pages/insights.tsx exists. Server route at server/routes/insights.ts is extensive (1000+ lines). Page exists and has backend support. | LIVE TEST | Needs live test to verify actual rendering and data display. |
| I-159 | Archived sprints | PROCESS | This is a process/governance item, not a code issue. Requires sprint triage review. | PROCESS | Not verifiable via code read. |
| I-163 | Insights drill-downs | LIVE TEST | insights.tsx exists, server has extensive drill-down logic. Cannot verify 27 UI states without live browser testing. | LIVE TEST | Needs Playwright or manual browser verification. |
| I-171 | Billing states | LIVE TEST | Billing pages exist (BillingDashboard.tsx, BillingPlan.tsx, BillingUsage.tsx, BillingInvoices.tsx). Cannot verify 26 UI states without live browser testing. | LIVE TEST | Needs Playwright or manual browser verification. |

## Summary

| Status | Count | IDs |
|--------|-------|-----|
| Still exists | 7 | I-103, I-104, I-105, I-109, I-110, I-111, I-146 |
| Fixed / No longer valid | 4 | I-106, I-107, I-142, I-153 |
| Partially fixed / Unclear | 2 | I-102, I-145 |
| Needs live test | 4 | I-156, I-163, I-171, I-141 |
| Process item | 1 | I-159 |

## Key Corrections to Original Reports
- **I-103**: 6 always-true assertions, not 8.
- **I-106/I-107**: Rate limit is 100, not 3. Original SMS/campaign diagnosis was incorrect.
- **I-110**: Only 2 files hardcode URL without env var. 9 others use env fallback correctly.
- **I-111**: 6 routes untested, not 7. /my-work has a test file (albeit stubs).
- **I-142**: Already fixed — per-dealer lead source lookup is implemented.
- **I-153**: SessionTimeoutDialog is fully implemented and integrated.
