# Nexxus Connect v2.2 — Issues

**Last verified:** 2026-03-28 (code-level verification by 4 parallel agents)
**Method:** Every open issue verified by reading the actual source code

## Statuses
- **OPEN** — Confirmed in code, needs fix
- **NEEDS LIVE TEST** — Can't confirm from code alone, needs browser/API test
- **NEEDS INPUT** — Requires operator product decision
- **NEEDS SPEC** — Requires design before implementation
- **CLOSED** — Fixed in code (see Closed section at bottom)

## Effort
- **E** = Easy (<30 min)
- **M** = Medium (1-3 hrs)
- **H** = Hard (4+ hrs)

---

## AI Chat (/)

| ID | Issue | Status | Effort |
|----|-------|--------|--------|
| I-126 | Chat history sidebar shows timestamps only (no title field in schema). Resume handler exists but needs live confirmation. | NEEDS LIVE TEST | E |
| I-139 | Data Guru references CRM tools that may not return data — risk of fabricated responses | NEEDS LIVE TEST | M |

---

## TeamBox (/teambox)

| ID | Issue | Status | Effort |
|----|-------|--------|--------|
| I-150 | Channel filters include "WhatsApp" and "Web Chat" — channels not yet supported | NEEDS INPUT | E |
| I-174 | "Send to CRM" button — manual VIN lead creation from conversations (form + SMS channels) | NEEDS SPEC | H |

---

## Sales (/sales)

| ID | Issue | Status | Effort |
|----|-------|--------|--------|
| I-130 | Agent pages need favorites and sub-menu bar (Sales, Service, Marketing) | OPEN | M |
| I-138 | "Unauthorized Agent" test artifact visible in agent list (not in seed — DB artifact) | NEEDS LIVE TEST | E |

---

## Service (/service)

| ID | Issue | Status | Effort |
|----|-------|--------|--------|
| I-113 | Metric trends hardcoded to zero (`change: 0, trend: 'up'` on all 6 tiles) | OPEN | M |
| I-132 | Campaign channel is single value — needs multi-channel support (email + text + phone combo) | OPEN | H |

---

## Marketing (/marketing)

| ID | Issue | Status | Effort |
|----|-------|--------|--------|
| I-172 | AgentChatView openai-proxy 401 — no token refresh on expired JWT | OPEN | M |
| I-155 | Dashboard metrics showing zero — values from real API with `?? 0` fallback, may be data issue | NEEDS LIVE TEST | E |

---

## Management (/management)

| ID | Issue | Status | Effort |
|----|-------|--------|--------|
| I-116 | User Chats tab is "coming soon" placeholder — full feature build | OPEN | H |
| I-169 | Hunch status transitions — only 3 of 8 states have UI buttons (Accept/Dismiss/Resolve) | OPEN | M |

---

## Settings (/settings)

| ID | Issue | Status | Effort |
|----|-------|--------|--------|
| I-148 | Role Switcher dev tool — UI removed but stale docblock comments remain | OPEN | E |
| I-149 | Tour overlay reappears per-page (localStorage tracks per route, not global) | NEEDS INPUT | E |
| I-151 | Settings tile count — 7 defined, 5-7 visible depending on role. Original report said 4. | NEEDS LIVE TEST | E |
| I-157 | API Keys/Webhooks tabs are super_admin-only — confirm if intended RBAC level | NEEDS INPUT | E |
| I-164 | 42 interaction states across 5 sub-sections untested | NEEDS LIVE TEST | H |

---

## Auth (/login, /forgot-password, /reset-password)

| ID | Issue | Status | Effort |
|----|-------|--------|--------|
| I-140 | Password reset — no code bug found, needs live test of email delivery + token flow | NEEDS LIVE TEST | M |
| I-165 | Forgot/reset password FE — 11 states untested (pages exist, backend confirmed) | NEEDS LIVE TEST | M |

---

## Widget / Landing (/w/, /p/)

| ID | Issue | Status | Effort |
|----|-------|--------|--------|
| I-122 | Instant Call Back — UI built but `/api/widget/voice-callback` backend endpoint MISSING (will 404) | OPEN | M |
| I-168 | Widget interaction mode states — 22 states across 6 modes untested | NEEDS LIVE TEST | H |

---

## Insights (/insights)

| ID | Issue | Status | Effort |
|----|-------|--------|--------|
| I-156 | Insights standalone page — exists but never visually verified | NEEDS LIVE TEST | M |
| I-163 | 27 drill-down/Reports/Library states untested | NEEDS LIVE TEST | H |

---

## Billing (/settings/billing)

| ID | Issue | Status | Effort |
|----|-------|--------|--------|
| I-105 | FlexPrice integration — all endpoints return `{configured: false}`. Needs billingCustomerId per org. | OPEN | M |
| I-171 | 26 billing UI states with no functional coverage | NEEDS LIVE TEST | H |

---

## Org Wizard (/settings/org-wizard)

| ID | Issue | Status | Effort |
|----|-------|--------|--------|
| I-166 | 11 wizard states untested (page exists, super_admin gated) | NEEDS LIVE TEST | M |

---

## Agents (/agents)

| ID | Issue | Status | Effort |
|----|-------|--------|--------|
| I-102 | Photo Studio agent — image generation returns 501 from /api/openai-proxy. Was working in prior testing runs. FAL proxy code exists. Needs investigation post-deploy. | OPEN | M |

---

## Backend / Comms

| ID | Issue | Status | Effort |
|----|-------|--------|--------|
| I-141 | VAPI webhook returns 422 when assistantId not registered on a Nexxus agent — config gap | OPEN | M |
| I-144 | Blacklist only checked for SMS in CommGate — phone/email channels bypass blacklist | OPEN | E |
| I-146 | Kill switch is block-and-drop — messages blocked during kill switch are permanently lost, not queued | NEEDS INPUT | M |

---

## Infrastructure / Testing

| ID | Issue | Status | Effort |
|----|-------|--------|--------|
| I-103 | 6 always-true assertions in s11-demo-hotfix.spec.ts (not 8) | OPEN | E |
| I-104 | 103 stub tests in observability/ with expect.fail("STUB") across 7 files | OPEN | M |
| I-109 | Git has uncommitted changes — needs cleanup commit | OPEN | E |
| I-110 | 2 test files hardcode production URL without env var fallback | OPEN | E |
| I-111 | 6 routes with zero test coverage (/usage, billing pages, org-wizard, /profile/preferences) | OPEN | M |
| I-145 | Walk-in followup — no walk-in-specific trigger, handled by generic new_lead_followup | NEEDS INPUT | M |

---

## Cross-Cutting

| ID | Issue | Status | Effort |
|----|-------|--------|--------|
| I-125 | All popout/sub-menu links need functional verification (click-through test) | NEEDS LIVE TEST | M |
| I-131 | Full communications test plan — autonomous + interactive (in progress this session) | IN PROGRESS | — |
| I-159 | 48 archived sprints in sprints.backlog.json need triage | PROCESS | M |

---

## Summary

| Status | Count |
|--------|-------|
| OPEN | 18 |
| NEEDS LIVE TEST | 16 |
| NEEDS INPUT | 4 |
| NEEDS SPEC | 1 |
| IN PROGRESS | 1 |
| PROCESS | 1 |
| **Total active** | **41** |

---

## Test Coverage Gaps

| ID | Gap | Status |
|----|-----|--------|
| TG-004 | Opt-out/STOP handling — no test | OPEN |
| TG-008 | After-hours behavior — no time-based test | OPEN |
| TG-010 | TeamBox real-time updates — no SSE/WebSocket test | OPEN |
| TI-018 | Photo Studio image generation — see I-102 | OPEN |

---

## Governance Incidents (historical)

| Date | Sprint | What Happened |
|------|--------|---------------|
| 2026-03-19 | REM-8-DT | Builder agent rewrote central-mcp VIN connector without authorization |
| 2026-03-20 | REM-8-BE | Builder agent wrote production email notification code during testing sprint |
| 2026-03-20 | REM-9 | Orchestrator edited server/sync.ts directly instead of delegating |
| 2026-03-20 | — | CommGate check deployed without commit, sprint, or harness approval |
| 2026-03-24 | S-11 | Ghost agent edited sprints.json governance file directly |

---

## CLOSED (verified fixed in code 2026-03-28)

| ID | Issue | How resolved |
|----|-------|-------------|
| I-061–I-085, I-088 | Original sprint issues | Committed in sprints S-0 through S-10 |
| I-086 | VIN lead import zero contacts | S-0.4 — rewrote to use vin-safe-mcp |
| I-087 | Webhook email bypasses CommGate | I-3.2 — template + hierarchy fix |
| I-089 | Contact modal fails in drill-down | I-10.5 — warehouse fallback |
| I-090 | Warehouse metrics 4/5 dealers | S-0.5 — backfill all 5 |
| I-091 | SMS takeover broken | I-5.3 — assignedTo check |
| I-092 | Campaign hardcoded dryRun | Not a bug — separate buttons |
| I-093 | No VAPI call test | I-4.4 — Elliott verified |
| I-094 | No Tavus transcript verification | I-4.3 — callback_url added |
| I-095 | Appointment source defaults manual | I-4.4 — passthrough |
| I-096 | Email recipients don't walk hierarchy | I-3.2 — subsumed by I-087 |
| I-097 | Durran's org_id wrong | I-1.3 |
| I-098 | Victoria missing additional_org_ids | I-1.4 |
| I-099 | VAPI serverUrl points to old app | Owner updated VAPI dashboard |
| I-100 | Tavus webhook URL old app | I-4.3 |
| I-101 | 4/5 orgs CommGate disabled | S-0.1 |
| I-106 | Campaigns zero messages (rate limit) | INVALID — rate limit is 100, not 3 |
| I-107 | SMS 63% failure rate | INVALID — same as I-106 |
| I-108 | APP_BASE_URL missing | FALSE ISSUE — intentional |
| I-112 | Sales activity feed hardcoded | Already uses real API |
| I-114 | Conversion rate absolute as delta | Fixed with change: 0 + comment |
| I-115 | Sub-menu/tab mismatches | Fixed — all match now |
| I-117 | TopBar "Take a Tour" label | Fixed — says "Reset Tour" |
| I-118 | TopBar Billing link | Fixed — removed |
| I-119 | Web Call widget behavior | Fixed — now Instant Call Back flow |
| I-120 | AI Config RBAC inconsistent | Fixed — tile and sub-menu aligned |
| I-121 | Video popup blocked | Fixed — sync window.open |
| I-123 | Widget form → TeamBox | Fixed — creates conversation |
| I-124 | Marketing popout duplicates | Fixed — consolidated |
| I-127 | My Work visible in nav | Fixed — commented out |
| I-128 | Campaign Safety no dismiss | Fixed — localStorage persist |
| I-129 | Campaign tooltips missing | Fixed — all wrapped |
| I-133 | Caroline/Nancy phone numbers | Partially addressed — FIX-07/08, BL-088 |
| I-134 | Landing page route race | Fixed — public router separation |
| I-135 | Widget CORS | Fixed — wildcard for widget paths |
| I-136 | Sales routes to /marketing | Fixed — path is /sales |
| I-137 | Tour skip navigates to /w/ | Fixed — no navigation on skip |
| I-142 | VIN lead source mapping | Fixed — per-dealer lookup |
| I-143 | No business-hours on campaigns | Fixed — TCPA gate added |
| I-147 | TeamBox tabs mismatch | Superseded — BL-084 removed tasks |
| I-152 | "Georgia" FAB | INVALID — uses org personaName |
| I-153 | Session timeout dialog | Fixed — fully implemented |
| I-160 | Metric label truncation | FIX-01 committed |
| I-161 | AI Chat + Sales drill-downs | VFY-01 + VFY-02 verified working |
| I-162 | TeamBox task view | BL-084 removed tasks feature |
| I-167 | /agents page states | VFY-05 verified working |
| I-170 | Marketing agent chat | VFY-04 — covered by I-172 |
