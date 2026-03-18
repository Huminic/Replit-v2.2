# Loop Prep: REM-1

**Date:** 2026-03-18
**Open Issues:** 24
**Test Infrastructure Fixes:** 7

---

## 1. Issue-to-Domain Assignment

| Issue | Domain | Sub-Sprint | Summary |
|-------|--------|------------|---------|
| I-051 | IN | REM-1-IN | Remove orphaned env vars (TEXTMAGIC_API_KEY, SESSION_SECRET, etc.) |
| I-052 | IN | REM-1-IN | Add missing env vars (FLEXPRICE_API_KEY, webhook secrets, etc.) |
| I-045 | IN | REM-1-IN | (subset of I-052 — FLEXPRICE_API_KEY) |
| I-038 | IN | REM-1-IN | Fix VAPI webhook secret — verify env var matches VAPI dashboard |
| I-048 | IN | REM-1-IN | Remove 5 dead passport/session packages + build allowlist cleanup |
| I-049 | DT | REM-1-DT | Add indexes on campaignRecipients.campaignId and notifications.userId |
| I-053 | AU | REM-1-AU | Partner Admin switch-org partnerId validation + seed partnerId data |
| I-050 | BE | REM-1-BE | Delete routes.ts monolith — extract generateHunchesForOrg first |
| I-040 | BE | REM-1-BE | Fix campaign execution 500 on SMS/email sends |
| I-041 | BE | REM-1-BE | Fix kill switch toggle 500 |
| I-042 | BE | REM-1-BE | Fix tasks/appointments endpoints 500/404 |
| I-044 | BE | REM-1-BE | Fix conversation takeover response |
| I-046 | BE | REM-1-BE | Fix entitlements endpoint (test path mismatch — /api/entitlements/check vs /api/billing/entitlements) |
| I-036 | BE | REM-1-BE | Add AI agent processing for inbound SMS |
| I-037 | BE | REM-1-BE | Add outbound VAPI call context (assistantOverrides, phoneNumberId, customer name) |
| I-054 | BE | REM-1-BE | Resolve lead source labels via VIN Solutions API |
| I-060 | BE | REM-1-BE | Implement after-hours auto-response |
| I-043 | FE | REM-1-FE | Billing FlexPrice data rendering (depends on I-045/I-052) |
| I-047 | FE | REM-1-FE | Demand Score tile visibility (may be test selector issue) |
| I-055 | FE | REM-1-FE | Login error message — show specific API error |
| I-056 | FE | REM-1-FE | Logout DOM error — race condition fix |
| I-057 | FE | REM-1-FE | Tour overlay — dismiss without blocking interaction |
| I-058 | FE | REM-1-FE | Console 400 on page load — auth refresh graceful handling |
| I-059 | FE | REM-1-FE | Tavus widget demo org config (database/seed fix) |

---

## 2. Issue-to-Test Mapping

| Issue | Playwright Test(s) | Criterion ID |
|-------|-------------------|--------------|
| I-036 | domain-04 "4.10 Campaign reply triggers AI agent response" | 4.10 |
| I-037 | domain-11 "11.6 VAPI outbound calls include context" | 11.6 |
| I-038 | domain-11 "11.2 VAPI webhook accepts transcripts", "11.3 VAPI transcript appears in TeamBox" | 11.2, 11.3 |
| I-040 | domain-04 "4.3 Campaign execution sends SMS via MCP", "4.4 Campaign execution sends email via MCP" | 4.3, 4.4 |
| I-041 | domain-04 "4.5 Kill switch blocks outbound" | 4.5 |
| I-042 | domain-10 "10.1 Tasks visible in My Work", "10.2 Task creation", "10.3 Appointments", "10.4 CRUD" | 10.1-10.4 |
| I-043 | domain-08 "8.2 Connected to FlexPrice", "8.3 Super Admin billing", "8.4 Partner/Org Admin billing" | 8.2-8.4 |
| I-044 | domain-05 "5.4 Takeover stops AI" | 5.4 |
| I-045 | (subset of I-052) | 8.2-8.4 |
| I-046 | domain-12 "12.5 Entitlement checks fail-closed" | 12.5 |
| I-047 | domain-06 "6.5 Demand Score tile visible on Management" | 6.5 |
| I-048 | (no direct test — build verification) | — |
| I-049 | (no direct test — DB migration verification) | — |
| I-050 | (no direct test — build verification) | — |
| I-051 | (no direct test — env verification) | — |
| I-052 | domain-08 "8.2-8.4", domain-11 "11.2", live-comms "LC-2" | 8.2-8.4, 11.2 |
| I-053 | domain-01 "1.10 Partner Admin sees own companies + subs only" | 1.10 |
| I-054 | domain-07 "7.6 Lead source labels show meaningful names" | 7.6 |
| I-055 | domain-01 "1.6 Wrong credentials shows error message" | 1.6 |
| I-056 | domain-01 "1.3 Logout clears cookie and returns to login" | 1.3 |
| I-057 | domain-01 "1.13 Product tour shows", "1.14 Tour dismisses per-page" | 1.13, 1.14 |
| I-058 | domain-02 "2.1 Main page loads without errors" | 2.1 |
| I-059 | domain-11 "11.7 Tavus personas active per dealer", "11.8 Widget video session" | 11.7, 11.8 |
| I-060 | (NEW TEST NEEDED — add to domain-05 or domain-11) | (new criterion needed) |

---

## 3. Issue-to-Criterion Mapping

| Issue | Acceptance Criteria |
|-------|-------------------|
| I-036 | 4.10: Campaign reply triggers AI agent response |
| I-037 | 11.6: VAPI outbound calls include context (name, greeting, goal) |
| I-038 | 11.2: VAPI webhook accepts end-of-call transcripts |
| I-040 | 4.3: Campaign execution sends SMS via MCP; 4.4: sends email via MCP |
| I-041 | 4.5: Kill switch blocks outbound |
| I-042 | 10.1-10.4: Tasks and appointments CRUD |
| I-043 | 8.2-8.4: Billing FlexPrice data for authorized roles |
| I-044 | 5.4: Takeover stops AI, parks as human-only thread |
| I-045 | 8.2-8.4 (same as I-043 — env var root cause) |
| I-046 | 12.5: Entitlement checks fail-closed |
| I-047 | 6.5: Demand Score tile visible on Management |
| I-048 | (infrastructure cleanup — no criterion) |
| I-049 | (performance — no criterion) |
| I-050 | (dead code cleanup — no criterion) |
| I-051 | (config cleanup — no criterion) |
| I-052 | 8.2-8.4, 11.2 (env vars enable billing and webhook) |
| I-053 | 1.10: Partner Admin sees own companies + subs only |
| I-054 | 7.6: Lead source labels show meaningful names |
| I-055 | 1.6: Wrong credentials shows "invalid email or password" |
| I-056 | 1.3: Logout clears cookie and returns to login screen |
| I-057 | 1.13: Product tour shows on first login; 1.14: Tour dismisses per-page |
| I-058 | 2.1: Main page loads without errors |
| I-059 | 11.7: Tavus personas active per dealer |
| I-060 | NEW: After-hours auto-response (US-021) — needs criterion added |

---

## 4. Declared Files Per Sub-Sprint

### REM-1-IN (Infrastructure — run first)
- .env
- package.json
- script/build.ts

### REM-1-DT (Data — run second)
- shared/schema.ts

### REM-1-AU (Auth/Security — run third)
- server/routes/auth.ts
- server/seed.ts (if partnerId data needs seeding)

### REM-1-BE (Backend — run fourth)
- server/routes.ts (deletion after extracting generateHunchesForOrg)
- server/services/hunchService.ts (new — extracted from routes.ts)
- server/index.ts (remove old registerRoutes import)
- server/routes/hunches.ts (update import path)
- server/services/scheduler.ts (update import path)
- server/outbound.ts (I-037 context, I-040 error handling)
- server/routes/sms.ts (I-036 agent processing, I-060 after-hours)
- server/routes/organizations.ts (I-041 kill switch)
- server/routes/tasks.ts (I-042)
- server/routes/appointments.ts (I-042)
- server/routes/conversations.ts (I-044 takeover)
- server/routes/insights.ts (I-054 lead source labels)
- server/storage.ts (if storage methods need fixes for I-041, I-042)
- server/vendorProxy.ts (I-054 lead source API call)

### REM-1-FE (Frontend — run last, requires user approval)
- client/src/contexts/AuthContext.tsx (I-055 error message, I-058 refresh 400)
- client/src/pages/login.tsx (I-055 error display)
- client/src/components/layout/Sidebar.tsx (I-056 logout race)
- client/src/components/layout/AppLayout.tsx (I-057 tour overlay)
- client/src/components/ProductTour.tsx (I-057 tour dismiss)
- client/src/pages/BillingDashboard.tsx (I-043 if FE fix needed after env)
- client/src/pages/management.tsx (I-047 if code fix needed)
- server/seed.ts (I-059 Tavus persona config — actually a data/seed fix)

### Test Infrastructure Fixes (included in appropriate sub-sprint)
- tests/e2e/domain-01-auth.spec.ts (TI-002 cookie case, TI-007 error field)
- tests/e2e/domain-02-dashboard.spec.ts (TI-001 login timeout)
- tests/e2e/domain-03-chat.spec.ts (TI-001 login timeout, TI-004 request context)
- tests/e2e/domain-06-departments.spec.ts (TI-001 login timeout, TI-006 selector)
- tests/e2e/domain-07-insights.spec.ts (TI-001 login timeout)
- tests/e2e/domain-09-settings.spec.ts (TI-003 page timeout)
- tests/e2e/domain-12-infrastructure.spec.ts (TI-002 cookie case)
- tests/e2e/helpers/auth.ts (TI-005 rate limiter — already partially fixed)

---

## 5. Dependency Order

| Order | Sub-Sprint | Issues | Why This Order |
|-------|------------|--------|----------------|
| 1 | REM-1-IN | I-038, I-045, I-048, I-051, I-052 | Env vars and packages needed by all other domains. I-052 fixes billing (I-043 depends on it), webhook secret (I-038), and other config. |
| 2 | REM-1-DT | I-049 | Indexes needed before BE fixes that hit those tables under load. |
| 3 | REM-1-AU | I-053 | Auth/RBAC fix needed before FE can test org switching correctly. |
| 4 | REM-1-BE | I-036, I-037, I-040, I-041, I-042, I-044, I-046, I-050, I-054, I-060 | Largest sub-sprint. Backend fixes that FE depends on. I-044 depends on I-036. |
| 5 | REM-1-FE | I-043, I-047, I-055, I-056, I-057, I-058, I-059 | Last because depends on BE/IN fixes. Requires user approval. |
| 6 | TI fixes | TI-001 through TI-007 | Can run in parallel with any sub-sprint. Test-only changes. |

---

## 6. Prerequisites

| Prerequisite | Status | Notes |
|-------------|--------|-------|
| User approval for FE changes | **APPROVED** | Limited to I-043, I-047, I-055, I-056, I-057, I-058, I-059 |
| FLEXPRICE_API_KEY value | **RESOLVE VIA MCP** | Query central-mcp config or existing .env files |
| VAPI webhook secret value | **RESOLVE VIA MCP** | Query VAPI config via MCP, compare with .env |
| TEXTMAGIC_WEBHOOK_SECRET value | **RESOLVE VIA MCP** | Available in central-mcp config |
| TAVUS_WEBHOOK_SECRET value | **RESOLVE VIA MCP** | Available in central-mcp config |
| Partner Admin partnerId data | **VERIFY VIA DB** | Check if partnerId is seeded on org records |
| Demo org Tavus persona ID | **QUERY VIA MCP** | Call vapi_list_assistants / tavus_list_personas |
| Business hours config per org | **QUERY VIA MCP** | Hours embedded in VAPI/Tavus assistant prompts |
| New test for I-060 (after-hours) | **NEEDS CREATION** | Add during REM-1-BE |
| New criterion for I-060 | **NEEDS CREATION** | Add during REM-1-BE |

---

## 7. Test Infrastructure Fixes

| TI-ID | Fix | Sub-Sprint | Files |
|-------|-----|------------|-------|
| TI-001 | Increase login wait timeout from 10s to 30s, use networkidle | REM-1-BE (test files) | domain-01, 02, 03, 06, 07 |
| TI-002 | Change cookie assertion to case-insensitive (.toLowerCase()) | REM-1-BE (test files) | domain-01, domain-12 |
| TI-003 | Increase settings/profile page timeout, add explicit element waits | REM-1-FE (test files) | domain-09 |
| TI-004 | Move chat tests 3.4-3.11 from browser to API project or fix request context | REM-1-BE (test files) | domain-03 |
| TI-005 | File-based token cache (already partially fixed) — verify working | REM-1-IN | helpers/auth.ts |
| TI-006 | Fix agent selector from `text=/agent/i` to proper Playwright locator | REM-1-BE (test files) | domain-06 |
| TI-007 | Change assertion from body.message to body.error for login failures | REM-1-BE (test files) | domain-01 |

---

## Summary

| Sub-Sprint | Issues | Files | Blocked By |
|------------|--------|-------|------------|
| REM-1-IN | 5 | 3 | Nothing |
| REM-1-DT | 1 | 1 | Nothing |
| REM-1-AU | 1 | 2 | Nothing |
| REM-1-BE | 10 | 14 | REM-1-IN (env vars) |
| REM-1-FE | 7 | 8 | REM-1-IN, REM-1-BE, user approval |
| TI fixes | 7 | 8 | Nothing |
| **Total** | **24 + 7 TI** | **~36 files** | |

**Prerequisites needing user input:** 6 items (env var values, FE approval, data confirmation)
**New artifacts needed:** 1 test (I-060), 1 criterion (I-060)
