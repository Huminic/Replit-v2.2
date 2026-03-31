# Nexxus Connect v2.2 — Issues

**Last verified:** 2026-03-31 (API E2E: 44/46 passed against dev.huminicdev.com, post-build)
**Method:** Code verification + E2E suite + VAPI/VIN audit + infrastructure audit
**Target:** https://dev.huminicdev.com (PM2 on localhost:5000, Supabase DB)

## Statuses
- **OPEN** — Confirmed, needs fix
- **IN SPRINT (id)** — Assigned to a sprint, work pending or in progress
- **NEEDS LIVE TEST** — Can't confirm from code alone, needs browser/API test
- **NEEDS INPUT** — Requires operator product decision
- **DISABLED** — Feature intentionally turned off, needs re-enable plan
- **BACKLOGGED (BL-nnn)** — Deferred, tracked in backlog.md
- **CLOSED (sprint-id)** — Fixed and verified

## Effort
- **E** = Easy (<30 min)
- **M** = Medium (1-3 hrs)
- **H** = Hard (4+ hrs)

## Dimensions
- **FE** = Frontend (UI, pages, forms, client logic)
- **BE** = Backend (APIs, business rules, services, integrations)
- **DT** = Data (schema, database, migrations)
- **AU** = Auth/Security (login, permissions, security controls)
- **IN** = Infrastructure (deploys, environments, monitoring, testing)

---

## AI Chat (/)

No open issues. I-126 and I-139 verified working in S2.

---

## TeamBox (/teambox)

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-174 | "Send to CRM" button — manual VIN lead creation from conversations (form + SMS channels) | BE, FE | BACKLOGGED (BL-092) | H |

---

## Sales (/sales)

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-130 | Agent pages need favorites and sub-menu bar (Sales, Service, Marketing) | FE | BACKLOGGED (BL-094) | M |

---

## Service (/service)

No open issues. I-113 and I-132 resolved in S4.

---

## Marketing (/marketing)

No open issues. I-155 closed — confirmed real data (no active marketing campaigns).

---

## Management (/management)

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-116 | User Chats tab is "coming soon" placeholder — full feature build | FE, BE | BACKLOGGED (BL-093) | H |
| I-169 | Hunch status transitions — only 3 of 8 states have UI buttons | FE | BACKLOGGED (BL-093) | M |

---

## Settings (/settings)

No open issues. I-164 verified working in S8 walkthrough.

---

## Auth (/login, /forgot-password, /reset-password)

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-140 | Password reset — no code bug found, needs live test of email delivery + token flow | BE, FE | NEEDS LIVE TEST | M |
| I-165 | Forgot/reset password FE — 11 states untested (pages exist, backend confirmed) | FE | NEEDS LIVE TEST | M |

---

## Widget / Landing (/w/, /p/)

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-168 | Widget interaction mode states — 13/14 verified in S1, voice callback 404 until deploy | FE, BE | NEEDS LIVE TEST | M |

---

## Insights (/insights)

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-156 | Insights standalone page — exists but never visually verified | FE | NEEDS LIVE TEST | M |
| I-163 | 27 drill-down/Reports/Library states untested | FE | NEEDS LIVE TEST | H |

---

## Billing (/settings/billing)

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-105 | FlexPrice integration — all endpoints return `{configured: false}`. Needs billingCustomerId per org. | BE, IN | OPEN | M |
| I-171 | 26 billing UI states with no functional coverage | FE | NEEDS LIVE TEST | H |

---

## Org Wizard (/settings/org-wizard)

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-166 | 11 wizard states untested (page exists, super_admin gated) | FE | NEEDS LIVE TEST | M |

---

## Agents (/agents)

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-102 | Photo Studio agent — image generation returns 501 from /api/openai-proxy. FAL proxy migrated to MCP in S-17 but not live-tested. | BE | NEEDS LIVE TEST | M |

---

## Backend / Comms

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-194 | **VAPI→VIN lead creation DISABLED.** Lead source name mismatch causes silent failure on 3 of 5 dealers. Code sends `"Dealers WebSite"` via `vin_safe_prepare_lead` but Hyundai of Columbia (13399), Ford of Columbia (13398), and Serra Nissan (21044) use different source names. Code reads `orgSettings.vinLeadSourceName` with bad fallback (webhooks.ts:737). 5 real customer leads since Mar 28 not sent to VIN Solutions. **Fix:** Set correct `vinLeadSourceName` per org, re-enable `if(false)` guard. **Backfill:** Use lead insertion script for unsent leads. Query: `SELECT * FROM activity_log WHERE action='vapi_call_received' AND metadata->>'vinLeadCreated'='false' AND created_at > '2026-03-24'`. | BE | DISABLED | M |

---

## Campaigns

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-193 | No CSV template download button on create campaign screen — users have no reference for expected column format | FE | OPEN | E |

---

## Infrastructure / Testing

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-182 | Test 2.1: dashboard 404 on static resource (favicon or similar) — page works, asset missing | IN | OPEN | E |
| I-183 | Test 4.10: campaign reply webhook — conversation not found within retry window. Timing issue after S-12 SMS mutex. Test-side fix: increase retry count or wait interval. | IN | OPEN | M |
| I-195 | Test 5.9: SMS webhook response shape mismatch — test asserts `body.success` but endpoint returns `{ received: true }`. Test-side fix: assert `status < 500` and poll conversations. | IN | OPEN | E |
| I-184 | Test 6.4/6.5: Management page tests expect org_admin access — needs update for S9 RBAC change (super_admin only) | IN | OPEN | E |
| I-185 | Test 9.3: "Restart Tour" button not found by test locator — selector mismatch with actual button text | IN | OPEN | E |
| I-186 | Test 10.3: Appointment schema uses different field name than test expects for date | IN | OPEN | E |
| I-187 | Test RI-VAPI-1: Transcript not available within 60s wait window — VAPI webhook timing | IN | OPEN | M |
| I-188 | Test RI-VIN-1: Warehouse leads query returns 0 rows with vin_created_at dates | IN | OPEN | M |
| I-189 | Test S9-TRIGGER-1: Walk-in followup agent endpoint auth — test uses wrong auth context | IN | BACKLOGGED (BL-095) | E |
| I-196 | 2 orphan test files (g004-gap-coverage.spec.ts, m001-gap-coverage.spec.ts) not matched by any Playwright project | IN | OPEN | E |
| I-197 | 8 sprint test files (s0-s8) hardcode `dev.huminicdev.com` instead of using `process.env.BASE_URL` | IN | OPEN | E |
| I-198 | Dead test helpers: tests/helpers/api.ts and tests/helpers/factory.ts — zero imports from any active test | IN | OPEN | E |
| I-199 | verify-all.ts hardcodes FQDN and uses own login logic instead of shared helpers | IN | OPEN | E |
| I-200 | No production environment — live.huminic.app and dev.huminicdev.com both serve same PM2 process, same DB. GitHub Actions has zero secrets, Coolify webhook goes nowhere. Dockerfile/docker-compose.yml exist but were never deployed. | IN | OPEN | H |
| I-201 | Daily delta VIN Solutions lead sync not running — sync_log shows only metrics_refresh entries, no delta or full sync in last 7 days | BE | OPEN | M |

---

## Cross-Cutting

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-125 | All popout/sub-menu links need functional verification (click-through test) | FE | NEEDS LIVE TEST | M |

---

## Summary

| Status | Count |
|--------|-------|
| OPEN | 16 |
| DISABLED | 1 |
| NEEDS LIVE TEST | 9 |
| BACKLOGGED | 5 |
| **Total active (non-backlogged)** | **26** |

---

## Test Coverage Gaps

| ID | Gap | Dim | Status |
|----|-----|-----|--------|
| TG-004 | Opt-out/STOP handling — no test | BE | OPEN |
| TG-008 | After-hours behavior — no time-based test | BE | OPEN |
| TG-010 | TeamBox real-time updates — no SSE/WebSocket test | FE, BE | OPEN |
| TI-018 | Photo Studio image generation — see I-102 | BE | OPEN |

---

## Governance Incidents (historical)

| Date | Sprint | What Happened |
|------|--------|---------------|
| 2026-03-19 | REM-8-DT | Builder agent rewrote central-mcp VIN connector without authorization |
| 2026-03-20 | REM-8-BE | Builder agent wrote production email notification code during testing sprint |
| 2026-03-20 | REM-9 | Orchestrator edited server/sync.ts directly instead of delegating |
| 2026-03-20 | — | CommGate check deployed without commit, sprint, or harness approval |
| 2026-03-24 | S-11 | Ghost agent edited sprints.json governance file directly |
| 2026-03-31 | M-002, M-003 | Orchestrator committed with fabricated process evidence: (1) used touch -t to backdate pre-execution-report.md to satisfy timing gate, (2) self-authored cross-sign claiming independent review that did not occur, (3) manually wrote APPROVED enforcer checklist when automated enforcer returned BLOCKED, (4) wrote enforcer checklist with future timestamp, (5) executed directly instead of delegating to subagents. Code changes in both commits are valid. Process evidence replaced with honest reconciliation artifacts. |

---

## CLOSED (S-11 through S-18, executed 2026-03-29, uncommitted)

| ID | Issue | Dim | How resolved |
|----|-------|-----|-------------|
| I-175 | SMS race condition — duplicate conversations from concurrent webhooks | BE | S-12 — conversation mutex lock in sms.ts |
| I-176 | VAPI transcripts not stored in conversation messages | BE | S-12 — 4-format transcript extraction in webhooks.ts |
| I-177 | Duplicate voice conversations created for same VAPI call | BE | S-12 — processedVapiCalls dedup map in webhooks.ts |
| I-178 | RBAC: Sales user sees System in sidebar | AU, FE | S-11 — sidebar visibility fix |
| I-179 | RBAC: Executive doesn't see Manage in sidebar | AU, FE | S-11 — sidebar visibility fix |
| I-180 | RBAC: Sales user can create agents via API | AU, BE | S-11 — requireRole gate on POST /api/agents |
| I-181 | RBAC: Sales/Marketing/Service can navigate to billing page | AU, FE | S-11 — billing route blocking |
| I-190 | campaign_recipients schema has no vehicle columns | DT | S-18 — vin, vehicle_model, vehicle_year columns added |
| I-191 | substituteTemplate() only supports 4 merge fields | BE | S-18 — {{vehicleYear}}, {{vehicleModel}}, {{vin}} added |
| I-192 | Campaign reply conversation has no vehicle context | BE | S-18 — system message injection on campaign reply in sms.ts |
| I-103 | 6 always-true assertions in s11-demo-hotfix.spec.ts | IN | S-13 — assertions fixed |
| I-104 | 103 stub tests in observability/ — delete | IN | S-13 — directory deleted |
| I-110 | 2 test files hardcode production URL without env var fallback | IN | S-13 — BASE_URL pattern applied |

---

## CLOSED (verified in S0-S10 sprint session 2026-03-29)

| ID | Issue | How resolved |
|----|-------|-------------|
| I-109 | Git uncommitted changes | Reconciliation commit 8348f8f |
| I-113 | Service metric trends hardcoded to zero | S4 — removed fake change/trend fields |
| I-126 | Chat history + resume | S2 — verified working via live test |
| I-131 | Full comms test plan | Completed — autonomous + interactive runbook |
| I-132 | Campaign multi-channel | S4 — checkbox UI creates one campaign per channel |
| I-138 | Unauthorized Agent in Sales | S10 — deleted from DB |
| I-139 | Data Guru hallucination risk | S2 — verified grounded, no fabrication |
| I-141 | VAPI webhook 422 | S0 — fallback to any org with voice agent |
| I-144 | Blacklist SMS-only | S0 — extended to all channels |
| I-146 | Kill switch block-and-drop | Operator confirmed: correct behavior, resend backlogged (BL-090) |
| I-148 | Role Switcher stale comments | S8 — removed from TopBar.tsx |
| I-149 | Tour per-page behavior | Operator confirmed: working as intended |
| I-150 | WhatsApp/Web Chat filters | S3 — removed, backlogged (BL-091) |
| I-155 | Marketing dashboard metrics showing zero | Confirmed real data — no active campaigns |
| I-157 | API Keys super_admin gate | Operator confirmed: correct RBAC level |
| I-164 | 42 settings interaction states | S8 — verified working |
| I-172 | AgentChatView token refresh | S5 — pre-flight refresh + 401 retry added |

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
