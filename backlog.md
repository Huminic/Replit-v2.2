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

## R-2 Scan Findings (MINOR)

### Backend
| ID | Item | Source |
|----|------|--------|
| BL-033 | N+1 query: campaigns.ts:144-147 fetches all recipients then all conversations | R-2 backend |
| BL-034 | N+1 notifications: campaigns.ts for-loop createNotification per user — batch with Promise.all | R-2 backend |
| BL-035 | Inefficient conversation cleanup: conversations.ts:42-51 fetches ALL ai-chat convos | R-2 backend |
| BL-036 | Duplicate phone formatting: outbound.ts has same normalize logic in 2 functions | R-2 backend |
| BL-037 | Inline CSV parser: campaigns.ts:26-62 custom parseCSVLine instead of csv-parse lib | R-2 backend |
| BL-038 | Slug generation race condition: organizations.ts:79 check-then-create gap | R-2 backend |
| BL-039 | Exception swallowing: multiple .catch blocks log but don't surface errors | R-2 backend |
| BL-040 | Duplicate lead source classification: insights.ts repeated string matching | R-2 backend |
| BL-041 | Repeated error catch pattern: billing.ts has 7 identical catch blocks | R-2 backend |
| BL-042 | comms-test.ts in production server/ directory | R-2 backend |
| BL-043 | Legacy server/replit_integrations/batch/ directory still exists | R-2 backend |
| BL-044 | Weak cache invalidation in billingService.ts — no TTL validation | R-2 backend |

### Frontend
| ID | Item | Source |
|----|------|--------|
| BL-045 | insights.tsx: 10+ list renders using key={i} instead of unique IDs | R-2 frontend |
| BL-046 | AgentConfigPane.tsx: 12x `as any` on agent triggers/tools/settings | R-2 frontend |
| BL-047 | settings.tsx: 39 useState hooks in single 3898-line component | R-2 frontend |
| BL-048 | 13 files with console.error() without user-facing toast feedback | R-2 frontend |
| BL-049 | Missing React.memo() on sub-components (ThinkingCard, PhoneCell, etc.) | R-2 frontend |
| BL-050 | Phone formatting logic duplicated 3x across files | R-2 frontend |

### Infrastructure
| ID | Item | Source |
|----|------|--------|
| BL-051 | 10+ unused npm packages (framer-motion, next-themes, react-icons, etc.) | R-2 infra |
| BL-052 | 7 ghost entries in build allowlist (packages not installed) | R-2 infra |
| BL-053 | nanoid used but not declared in package.json (transitive dep) | R-2 infra |
| BL-054 | Test/dev packages (vitest, playwright, @types/*) in dependencies not devDependencies | R-2 infra |
| BL-055 | Page file naming inconsistency (PascalCase vs kebab-case) | R-2 infra |
| BL-056 | No Vite chunk splitting — entire client ships as one bundle | R-2 infra |
| BL-057 | No server source maps for production debugging | R-2 infra |
| BL-058 | @tailwindcss/vite installed but project uses Tailwind v3 via PostCSS | R-2 infra |
| BL-059 | npm audit: 5 vulnerabilities (3 HIGH in transitive deps) | R-2 infra |

---

**Last updated:** 2026-03-18 (R-2 scan complete)
**Total:** 59 items (32 prior + 27 from R-2)
