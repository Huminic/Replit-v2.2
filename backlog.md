# Nexxus Connect v2.2 — Backlog

Not blocking launch. Consolidated from prior issues and QA findings.

---

## Security

| ID | Item | Source |
|----|------|--------|
| ~~BL-001~~ | ~~Promoted to I-053~~ | — |
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
| ~~BL-009~~ | ~~Promoted to I-060~~ | — |
| BL-010 | Competitive intelligence alerts (US-008) | User stories |
| BL-011 | Escalation management with sentiment detection (US-019) | User stories |
| BL-012 | Tavus duplicate personas cleanup (3 dealers have duplicates) | QA-S20 |
| ~~BL-013~~ | ~~Promoted to I-059~~ | — |

## Tech Debt

| ID | Item | Source |
|----|------|--------|
| BL-014 | Remaining as-any casts: campaigns.ts, sms.ts, settings.ts, organizations.ts, users.ts, public.ts, metrics.ts, insights.ts, documents.ts, chat.ts | QA-S1 through QA-S6 |
| BL-015 | Duplicate security headers (Helmet + Caddy both emit) | QA-S1 |
| BL-016 | Conflicting x-xss-protection values (0 vs 1;mode=block) | QA-S1 |
| ~~BL-017~~ | ~~Promoted to I-058~~ | — |
| BL-018 | Secure cookie conditional on NODE_ENV | QA-S1 |
| BL-019 | No req.on('close') handler in SSE stream | QA-S2 |
| BL-020 | No GET /api/documents/:id endpoint (no UI uses it) | QA-S2 |
| BL-021 | No res.flush() after individual SSE writes | QA-S2 |
| ~~BL-022~~ | ~~Promoted to I-054~~ | — |
| BL-023 | Store leadType from VIN sync for exact channel mapping | FIX-S9 |
| BL-024 | Thinking cards vs pulsing icon in chat (SSE status events exist, frontend shows icon not cards) | QA-S10 |
| BL-025 | Dead code: vapiGet, vapiPost, tavusGet, tavusPost functions in vendorProxy.ts (replaced by callMCP) | I-039 |
| BL-026 | Dead code: Resend import and getResendClient() in outbound.ts (only auth.ts uses Resend directly) | I-039 |

## UX / Usability

| ID | Item | Source |
|----|------|--------|
| ~~BL-027~~ | ~~Promoted to I-056~~ | — |
| ~~BL-028~~ | ~~Promoted to I-055~~ | — |
| BL-029 | Login failure should show reset password link in UI | AUTH audit |
| ~~BL-030~~ | ~~Promoted to I-057~~ | — |
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

| BL-060 | Resend welcome/invite email for existing users (no endpoint to retry blocked/failed emails) | E2E-1 |
| BL-061 | Date range selection for analytics — allow users to filter dashboard metrics, insights, and reports by custom date range (day/week/month/quarter/custom) | User requirement |
| BL-062 | Route all remaining direct API key usage through MCP — VAPI_PRIVATE_KEY (vendorProxy.ts proxy routes), TAVUS_API_KEY (vendorProxy.ts), RESEND_API_KEY (auth.ts, users.ts, conversations.ts, scheduler.ts), FLEXPRICE_API_KEY (billingService.ts). Keys should only exist in central-mcp, not in app .env | REM-8 audit |

## Deferred from Operator Manifest (2026-03-26)

| ID | Item | Source |
|----|------|--------|
| BL-063 | My Work page — hide and defer | Operator manifest |
| BL-064 | Copilot chat popout in System settings (right-side panel for AI-assisted config) | Operator manifest |

## E-013 Audit Findings — Not Blocking Launch (2026-03-26)

| ID | Item | Source |
|----|------|--------|
| BL-065 | Thinking cards in AI Chat — show reasoning/tool-use steps (BL-024 already tracks this) | E-013 S-1 audit |
| BL-066 | Like/dislike feedback buttons on AI chat responses | E-013 S-1 audit |
| BL-067 | Landing page org-specific branding (colors, not hardcoded WIDGET_TEAL/GUNMETAL_BLUE) | E-013 S-9 audit |
| BL-068 | Widget appearance uses org config from settings (not hardcoded) | E-013 S-10 audit |
| BL-069 | Role Switcher dev tool needs production gate (remove or restrict) | E-013 S-8 audit |
| BL-070 | Knowledge Base Web Pages — real URL crawling (currently demo-only toast) | E-013 S-7 audit |
| BL-071 | Knowledge Base Databases — placeholder ("Future: connect external databases") | E-013 S-7 audit |
| BL-072 | Agent Behavior save in AI Config is demo-only (shows toast, doesn't persist) | E-013 S-7 audit |
| BL-073 | Contact phone on Profile page is hardcoded "+1 (555) 123-4567" | E-013 S-8 audit |
| BL-074 | Notification data source verification — may be client-side mock vs real API | E-013 S-8 audit |

---

**Last updated:** 2026-03-26 (E-013 backlog additions)
**Total:** 66 items
| BL-078 | Mobile responsive — sidebar doesn't collapse at 375px, all pages overflow. No responsive breakpoints. | T-013 verification |
| BL-079 | AI Chat task creation — /api/tasks endpoint exists but createTask not in chat tool schema (server/routes/chat.ts). AI cannot create tasks from conversation. | T-022a verification |
| BL-080 | Nancy (service agent) can't persist appointments — no createAppointment tool in chat function schema. Confirms conversationally but no DB write. | T-022c verification |
| BL-081 | Session instability — /api/auth/refresh failures during department navigation. Aggressive session management causes re-auth during testing. | T-022c verification |
| BL-082 | Kill switch is block-and-drop by design — messages silently blocked, not queued for retry. Accepted by operator. | T-018 / operator directive |
| BL-083 | Walk-in auto-followup trigger (US-005, S-9.AC7) — not implemented, backlogged | T-017b / operator directive |
| BL-084 | Tasks feature — stub or remove from chat tools and TeamBox, not part of customer criteria | Operator directive |
