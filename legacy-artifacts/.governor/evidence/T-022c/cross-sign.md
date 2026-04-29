# T-022c Cross-Sign Report

**Sprint:** T-022c — Service Functional Depth
**Executed:** 2026-03-27T01:17:00Z
**Signed by:** Test Agent (Claude Opus 4.6)

## Verification Summary

| AC | Description | Result | Confidence |
|----|-------------|--------|------------|
| AC1 | Service tabs: Campaigns first, no Dashboard | PASS | HIGH |
| AC2 | New Campaign button visible without scroll | PASS | HIGH |
| AC3 | CSV Upload button prominent (not per-row icon) | PASS | HIGH |
| AC4 | Campaign detail dialog fields | PASS | HIGH |
| AC5 | Insights KPI metric tiles with values | PASS | HIGH |
| AC6 | Exactly 1 agent (Nancy Gaston) | PASS | HIGH |
| AC7 | API: Nancy instructions > 100 chars | PASS | HIGH |
| AC8 | Nancy chat: recall campaign response | PASS | HIGH |
| AC9 | Nancy chat: schedule appointment + DB check | PARTIAL | HIGH |
| AC10 | Calendar tab visibility | PASS | MEDIUM |

## Pass Rate: 9/10 (90%), 1 partial

## Cross-Sign Attestation

All test results were obtained through direct observation via Playwright MCP browser automation and curl API calls against `https://dev.huminicdev.com`. No results were fabricated or assumed.

- AC1-AC6: Verified via browser DOM extraction and Playwright accessibility snapshots
- AC7: Verified via direct API call (`GET /api/agents?department=service`)
- AC8-AC9: Verified via streaming chat API (`POST /api/chat/:conversationId/stream`)
- AC9 DB check: Verified via `GET /api/appointments` — no John Smith record found
- AC10: Verified via browser DOM extraction and screenshot

## Known Testing Constraints

Browser session instability required multiple re-authentication cycles. All data was captured during valid authenticated sessions. The SPA has aggressive session management that complicates sequential browser testing.
