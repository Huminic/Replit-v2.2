# Nexxus Connect v2.2 — Issues

**Last verified:** 2026-03-29 (post-reconciliation E2E: 288 passed, 13 failed, deep comms test, UI walkthrough)
**Method:** Code verification + full E2E suite + autonomous comms test + UI walkthrough

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

No open issues. I-126 and I-139 verified working in S2.

---

## TeamBox (/teambox)

| ID | Issue | Status | Effort |
|----|-------|--------|--------|
| I-174 | "Send to CRM" button — manual VIN lead creation from conversations (form + SMS channels) | BACKLOGGED (BL-092) | H |

---

## Sales (/sales)

| ID | Issue | Status | Effort |
|----|-------|--------|--------|
| I-130 | Agent pages need favorites and sub-menu bar (Sales, Service, Marketing) | BACKLOGGED (BL-094) | M |

---

## Service (/service)

No open issues. I-113 and I-132 resolved in S4.

---

## Marketing (/marketing)

| ID | Issue | Status | Effort |
|----|-------|--------|--------|
| I-155 | Dashboard metrics showing zero — confirmed real data (no active marketing campaigns) | CLOSED | — |

---

## Management (/management)

| ID | Issue | Status | Effort |
|----|-------|--------|--------|
| I-116 | User Chats tab is "coming soon" placeholder — full feature build | BACKLOGGED (BL-093) | H |
| I-169 | Hunch status transitions — only 3 of 8 states have UI buttons | BACKLOGGED (BL-093) | M |

---

## Settings (/settings)

| ID | Issue | Status | Effort |
|----|-------|--------|--------|
| I-164 | 42 interaction states across 5 sub-sections — verified working in S8 walkthrough | CLOSED | — |

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
| I-168 | Widget interaction mode states — 13/14 verified in S1, voice callback 404 until deploy | NEEDS DEPLOY | M |

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
| I-175 | SMS race condition — concurrent webhooks from same phone create duplicate conversations (no mutex/locking on getConversationByPhone) | OPEN | M |
| I-176 | VAPI transcripts not stored in conversation messages — call completes, email fires, but transcript missing from TeamBox conversation | OPEN | M |
| I-177 | Duplicate voice conversations created for same VAPI call | OPEN | M |
| I-178 | RBAC: Sales user sees System in sidebar (should be hidden) | OPEN | E |
| I-179 | RBAC: Executive doesn't see Manage in sidebar (S9 restricted to super_admin — test expects executive access, test needs update) | OPEN | E |
| I-180 | RBAC: Sales user can create agents via API (returns 200, should return 403) | OPEN | E |
| I-181 | RBAC: Sales/Marketing/Service users can navigate to billing page (should be blocked) | OPEN | E |

---

## Infrastructure / Testing

| ID | Issue | Status | Effort |
|----|-------|--------|--------|
| I-103 | 6 always-true assertions in s11-demo-hotfix.spec.ts | OPEN | E |
| I-104 | 103 stub tests in observability/ — delete | OPEN | E |
| I-110 | 2 test files hardcode production URL without env var fallback | OPEN | E |
| I-182 | Test 2.1: dashboard 404 on static resource (favicon or similar) — page works, asset missing | OPEN | E |
| I-183 | Test 4.10: campaign reply webhook doesn't find conversation — timing or routing issue | OPEN | M |
| I-184 | Test 6.4/6.5: Management page tests expect org_admin access — needs update for S9 RBAC change (super_admin only) | OPEN | E |
| I-185 | Test 9.3: "Restart Tour" button not found by test locator — selector mismatch with actual button text | OPEN | E |
| I-186 | Test 10.3: Appointment schema uses different field name than test expects for date | OPEN | E |
| I-187 | Test RI-VAPI-1: Transcript not available within 60s wait window — VAPI webhook timing | OPEN | M |
| I-188 | Test RI-VIN-1: Warehouse leads query returns 0 rows with vin_created_at dates | OPEN | M |
| I-189 | Test S9-TRIGGER-1: Walk-in followup agent endpoint auth — test uses wrong auth context | OPEN | E |

---

## Cross-Cutting

| ID | Issue | Status | Effort |
|----|-------|--------|--------|
| I-125 | All popout/sub-menu links need functional verification (click-through test) | NEEDS LIVE TEST | M |

---

## Summary

| Status | Count |
|--------|-------|
| OPEN | 25 |
| NEEDS LIVE TEST / DEPLOY | 10 |
| BACKLOGGED | 5 |
| CLOSED (this session) | 16 |
| **Total active (non-backlogged)** | **35** |

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
| I-157 | API Keys super_admin gate | Operator confirmed: correct RBAC level |
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
