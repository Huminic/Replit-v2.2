# Nexxus Connect v2.2 — Backlog

Items discovered during development and testing that are deferred to post-launch.

## Security

| ID | Item | Severity | Source | Notes |
|----|------|----------|--------|-------|
| BL-001 | Partner Admin switch-org allows access to ANY org (no partnerId check) | HIGH | QA-S19 data isolation audit | Acceptable for now — Durran Cage is the only partner and manages all dealers. MUST be fixed before onboarding a second partner. auth.ts:256-294 |
| BL-002 | Campaign execution statuses endpoint returns cross-org data | MEDIUM | QA-S19 data isolation audit | GET /api/campaigns/execution-statuses has no org filter. campaigns.ts:119-126 |
| BL-003 | getConversationByPhone storage method has no org filter | LOW | QA-S19 data isolation audit | Mitigated at route level. storage.ts:421-436 |
| BL-004 | getUnansweredConversations returns cross-org conversations | LOW | QA-S19 data isolation audit | Internal scheduler use only. storage.ts:1400-1413 |

## Features

| ID | Item | Priority | Source | Notes |
|----|------|----------|--------|-------|
| BL-005 | Org Admin multi-org access (Option B — join table) | MEDIUM | User requirement | Option A (additional_org_ids column) is the launch solution. Option B is the proper architecture for scale. |
| BL-006 | Multi-org reporting for Org Admins | LOW | User feedback | GMs want to run reports across multiple stores. Deferred per user decision ("too much for this phase"). |
| BL-007 | Billing usage alerts (80%, 90%, 99% thresholds) | LOW | User requirement | Parked until FlexPrice native capabilities are evaluated. May not need custom code. |
| BL-008 | VIN Solutions lead source name resolution | LOW | QA-S17 | Currently shows "VIN Source #7098" — needs API call to resolve to "AutoTrader" etc. |
| BL-009 | Store leadType from VIN sync for exact channel mapping | LOW | FIX-S9 insights agent | sync.ts doesn't persist leadType. Would enable exact channel mapping instead of heuristic. |
| BL-010 | Thinking cards in chat (frontend rendering) | LOW | QA-S10 usability | SSE status events exist but frontend shows pulsing icon, not expandable thinking cards. |
| BL-011 | Inbound email handling | LOW | User requirement | Currently outbound only (no-reply@huminic.ai). Inbound email TBD. |
| BL-012 | Second VAPI service agent per dealership | LOW | User requirement | User needs to set up phone numbers for service agents. |
| BL-013 | Campaign channel configurability (email/text/phone combo) | MEDIUM | User requirement | Campaigns should let user choose which channels to use per campaign. |

## Technical Debt

| ID | Item | Priority | Source |
|----|------|----------|--------|
| BL-014 | VAPI webhook secret validation uses wrong key | HIGH | QA-S16 | Uses VAPI_PRIVATE_KEY instead of webhook-specific secret. DO NOT FIX without disabling live webhook first (email flood risk). |
| BL-015 | Tavus widget "not configured" for demo org | LOW | QA-S16 | Demo org lacks Tavus backend config. |
| BL-016 | Remaining `as any` casts (settings.ts, organizations.ts — JSONB typing) | LOW | FIX-S7 | Drizzle ORM limitation. TODO comments in place. |
| BL-017 | Duplicate security headers (Helmet + Caddy) | LOW | QA-S1 | Cosmetic. Standardize to one layer. |
| BL-018 | Console 400 from /api/auth/refresh on unauthenticated load | LOW | QA-S1 | Expected behavior but cosmetic console error. |
