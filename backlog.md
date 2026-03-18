# Nexxus Connect v2.2 — Backlog

Not blocking launch. Consolidated from prior issues and QA findings.

---

## Security

| ID | Item | Source |
|----|------|--------|
| BL-001 | Partner Admin switch-org allows any org (no partnerId check) — fix before second partner | QA-S19 |
| BL-002 | getUnansweredConversations returns cross-org conversations (internal scheduler, by design) | QA-S19 |

## Features

| ID | Item | Source |
|----|------|--------|
| BL-003 | Org Admin multi-org Option B (join table) — proper architecture for scale | User requirement |
| BL-004 | Multi-org reporting for Org Admins across stores | User feedback |
| BL-005 | Billing usage alerts (80/90/99% thresholds) | User requirement |
| BL-006 | Second VAPI service agent per dealership | User requirement |
| BL-007 | Campaign channel configurability (email/text/phone combo per campaign) | User requirement |
| BL-008 | Inbound email handling (currently outbound only) | User requirement |
| BL-009 | After-hours auto-response with follow-up tag (US-021) | User stories |
| BL-010 | Competitive intelligence alerts (US-008) | User stories |
| BL-011 | Escalation management with sentiment detection (US-019) | User stories |
| BL-012 | Tavus duplicate personas cleanup (3 dealers have duplicates) | QA-S20 |
| BL-013 | Tavus demo widget "not configured" for demo org | QA-S16 |

## Tech Debt

| ID | Item | Source |
|----|------|--------|
| BL-014 | Remaining as-any casts: campaigns.ts, sms.ts, settings.ts, organizations.ts, users.ts, public.ts, metrics.ts, insights.ts, documents.ts, chat.ts | QA-S1 through QA-S6 |
| BL-015 | Duplicate security headers (Helmet + Caddy both emit) | QA-S1 |
| BL-016 | Conflicting x-xss-protection values (0 vs 1;mode=block) | QA-S1 |
| BL-017 | Console 400 from /api/auth/refresh on unauthenticated load | QA-S1 |
| BL-018 | Secure cookie conditional on NODE_ENV | QA-S1 |
| BL-019 | No req.on('close') handler in SSE stream | QA-S2 |
| BL-020 | No GET /api/documents/:id endpoint (no UI uses it) | QA-S2 |
| BL-021 | No res.flush() after individual SSE writes | QA-S2 |
| BL-022 | VIN Solutions lead source name resolution ("VIN Source #7098" instead of "AutoTrader") | QA-S17 |
| BL-023 | Store leadType from VIN sync for exact channel mapping | FIX-S9 |
| BL-024 | Thinking cards vs pulsing icon in chat (SSE status events exist, frontend shows icon not cards) | QA-S10 |
| BL-025 | Dead code: vapiGet, vapiPost, tavusGet, tavusPost functions in vendorProxy.ts (replaced by callMCP) | I-039 |
| BL-026 | Dead code: Resend import and getResendClient() in outbound.ts (only auth.ts uses Resend directly) | I-039 |

## UX / Usability

| ID | Item | Source |
|----|------|--------|
| BL-027 | Logout intermittent React DOM error ("removeChild") — race condition | QA-S9 |
| BL-028 | Frontend shows "Login failed" instead of specific API error message | QA-S9 |
| BL-029 | Login failure should show reset password link in UI | AUTH audit |
| BL-030 | Product tour overlay blocks interaction on first login | QA-S9 |
| BL-031 | Partner Admin transient 500 on login — not reproducible | QA-S9 |
| BL-032 | Post-sprint report overcounts (P4-S2: 26 claimed, 24 actual; P4-S4: 6 claimed, 7 actual) | QA-S3/S5 |

---

**Last updated:** 2026-03-18 (file reorganization)
**Total:** 32 items
