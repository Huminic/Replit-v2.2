# Nexxus Connect v2.2 — Open Issues

Every item has a domain tag, Background, Outcome, and Acceptance Criteria.
Fixed items are removed. Only truly open issues remain here.

## Domains
- **FE**: Frontend — UI, pages, forms, client logic
- **BE**: Backend — APIs, business rules, services, integrations
- **DT**: Data — schema, database, migrations, reporting data
- **AU**: Auth/Security — login, permissions, security controls
- **IN**: Infrastructure — deploys, environments, monitoring, scaling

---

## Open (3 items)

### [BE] I-036: Inbound SMS agent processing (campaign response handling)
**Background:** The live testing spec defines: "Service campaign sends SMS -> Customer replies -> Service Agent handles response -> Agent continues (sets up appointment) or Staff takes over." Currently, inbound SMS on existing conversations is stored but NOT routed to the dealer's communication agent for AI processing. No contextual AI response occurs.
**Outcome:** Inbound SMS routed to dealer's communication agent (e.g. Caroline for Serra Honda). Agent processes through AI chat pipeline with full tool access, responds via SMS, response stored in conversation thread. Staff can take over via TeamBox.
**Acceptance Criteria:** Send SMS to dealer number -> AI agent responds within 60 seconds with contextual reply -> reply appears in TeamBox thread as agent message -> agent can book appointments and answer inventory questions -> staff takeover stops AI responses on that thread.
**Next Sprint:** Yes

### [BE] I-037: VAPI outbound calls have no context
**Background:** VAPI assistants have a single firstMessage for inbound calls. Outbound calls via sendPhone() pass only assistantId and customer.number. Missing: firstMessage override, assistantOverrides for system prompt, campaign context/goal, phoneNumberId, customer.name. Customer hears inbound greeting on outbound call.
**Outcome:** Outbound VAPI calls pass full context via assistantOverrides: outbound-appropriate firstMessage, system prompt with campaign reason/goal, phoneNumberId and customer.name in payload.
**Acceptance Criteria:** Trigger outbound campaign call -> AI greets customer by name -> states reason for calling -> has clear goal -> does NOT say "thanks for calling" -> phoneNumberId and customer.name present in VAPI call payload.
**Next Sprint:** Yes

### [IN] I-038: VAPI webhook secret still rejecting
**Background:** I-1 changed webhooks.ts to use VAPI_WEBHOOK_SECRET instead of VAPI_PRIVATE_KEY. Live testing (T-2b) shows webhook still rejects with 401. Call transcript never reaches TeamBox. Either the env var value doesn't match what VAPI sends, or VAPI sends the secret in a different header/format.
**Outcome:** VAPI end-of-call-report webhook accepted by server. Transcript stored in TeamBox as voice conversation.
**Acceptance Criteria:** Make VAPI call -> call ends -> server logs show POST /api/webhooks/vapi 200 -> conversation with transcript appears in TeamBox for correct org.
**Next Sprint:** Yes

### [BE] I-040: Campaign execution returns 500 on SMS and email sends
**Background:** T-2 tests 4.3 and 4.4 show campaign execution returning 500 errors when trying to send SMS or email. The campaign create/upload/execute flow works (4.1 passes), but the actual send step fails with a server error.
**Outcome:** Campaign execution sends SMS and email successfully via MCP without 500 errors.
**Acceptance Criteria:** Execute SMS campaign -> execution.sent > 0, execution.failed = 0. Execute email campaign -> same.
**Next Sprint:** Yes

### [BE] I-041: Kill switch toggle returns 500
**Background:** T-2 test 4.5 shows toggling the kill switch (outboundEnabled) returns a 500 error.
**Outcome:** PATCH /api/organizations/:id with { outboundEnabled: false } returns 200.
**Acceptance Criteria:** Toggle kill switch -> response 200 -> subsequent campaign execution blocked with clear message.
**Next Sprint:** Yes

### [BE] I-042: Tasks endpoints return 500 or 404
**Background:** T-2 tests 10.1-10.4 all fail. Tasks and appointments endpoints return 500 or 404. Either the routes aren't registered or there's a runtime error.
**Outcome:** GET /api/tasks, POST /api/tasks, GET /api/appointments all return valid responses.
**Acceptance Criteria:** CRUD operations on tasks and appointments succeed without 500 errors.
**Next Sprint:** Yes

### [FE] I-043: Billing FlexPrice data not rendering
**Background:** T-2 tests 8.2-8.4 fail. Billing pages load (8.1 passes) but FlexPrice data doesn't display for Super Admin, Partner Admin, or Org Admin. The pages exist but the data integration isn't showing.
**Outcome:** Billing pages display FlexPrice plan, usage, and invoice data for authorized roles.
**Acceptance Criteria:** Login as Org Admin -> billing page shows plan name, usage meters, invoice history.
**Next Sprint:** No (investigate first — may be FE or BE)

### [BE] I-044: Conversation takeover returns unexpected response
**Background:** T-2 test 5.4 fails. PATCH /api/conversations/:id for takeover doesn't return the expected response structure.
**Outcome:** Takeover endpoint returns updated conversation with takeover status.
**Acceptance Criteria:** PATCH conversation with takeover flag -> response includes updated conversation -> AI stops responding on that thread.
**Next Sprint:** Yes

### [IN] I-045: FLEXPRICE_API_KEY missing from environment
**Background:** Agent A server logs show "WARNING: Missing optional environment variables: FLEXPRICE_API_KEY". Billing pages load but show no data because the FlexPrice API key is not in the app's .env. This is the root cause of I-043.
**Outcome:** FLEXPRICE_API_KEY set in .env. Billing pages display real FlexPrice data.
**Acceptance Criteria:** Billing dashboard shows plan name, usage meters, invoice data for Org Admin.
**Next Sprint:** Yes

### [BE] I-046: Entitlements endpoint returns 404
**Background:** T-2 test 12.5 sends a request with an invalid token to /api/entitlements/check expecting 401/403 (fail-closed). Gets 404 instead — endpoint may not exist or route not registered.
**Outcome:** Entitlement check endpoint exists and returns 401/403 for invalid tokens (fail-closed behavior).
**Acceptance Criteria:** Request with invalid token to entitlement endpoint -> 401 or 403, never 200.
**Next Sprint:** Yes

### [FE] I-047: Demand Score tile not found on Management page
**Background:** Agent A test 6.5 finds no Demand Score tile on the Management page. This was added in I-008 (I-1 sprint) but either the selector doesn't match or the tile isn't rendering.
**Outcome:** Demand Score tile visible on Management dashboard.
**Acceptance Criteria:** Navigate to /management as Org Admin -> Demand Score tile visible with numeric value.
**Next Sprint:** No (investigate — may be test selector issue)

---

## Test Infrastructure Issues (not application bugs — fix in test files)

| ID | Issue | Tests Affected |
|----|-------|---------------|
| TI-001 | Browser login flow times out (10s) — selectors or flow mismatch | 1.7-1.14, 2.1-2.5, 3.2-3.3, 6.1-6.5 |
| TI-002 | Cookie assertion case-sensitive — checks "httponly" vs actual "HttpOnly" | 1.1, 12.4 |
| TI-003 | Settings/profile pages timeout at 60s — page load or selector issue | 9.1-9.3, 9.5 |
| TI-004 | Chat tests use wrong request context for browser project | 3.4-3.11 |
| TI-005 | Auth rate limiter (5 req/15min per IP) blocks parallel test execution | Multiple |
| TI-006 | Agent selector uses invalid CSS syntax `text=/agent/i` | 6.7, 6.8 |
| TI-007 | Test 1.6 checks body.message but API returns body.error | 1.6 |

### [IN] I-048: Dead auth stack — 5 unused passport/session packages
**Background:** R-2 scan found connect-pg-simple, express-session, memorystore, passport, passport-local all in package.json but never imported. Auth was migrated to JWT. These are dead weight and could introduce confusion or vulnerabilities.
**Outcome:** All 5 packages removed from package.json. Build allowlist in script/build.ts cleaned up.
**Acceptance Criteria:** npm ls shows no passport/session packages. Build succeeds without them.
**Next Sprint:** Yes

### [DT] I-049: Missing database indexes on high-frequency columns
**Background:** R-2 scan found campaignRecipients.campaignId (5 queries), schedulerLocks.lockName (6 queries), and notifications.userId (3 queries) have no indexes. These are hot query paths.
**Outcome:** Indexes created on these three columns.
**Acceptance Criteria:** Database migration adds indexes. Query performance improves on campaign execution and notification fetches.
**Next Sprint:** Yes

### [BE] I-050: Dead 6200-line routes.ts monolith still in codebase
**Background:** server/routes.ts was decomposed in P4 into server/routes/*.ts. The original monolith file (6200 lines) still exists in the repo. It's dead code that inflates the codebase.
**Outcome:** server/routes.ts deleted. No imports reference it.
**Acceptance Criteria:** File deleted. Build succeeds. No runtime errors.
**Next Sprint:** Yes

### [IN] I-051: Orphaned env vars after MCP migration
**Background:** TEXTMAGIC_API_KEY, TEXTMAGIC_USERNAME, SESSION_SECRET, and VAPI_API_KEY are in .env but never referenced in code after I-039 (MCP routing) and auth migration. Dead config.
**Outcome:** Orphaned vars removed from .env. Only actively used vars remain.
**Acceptance Criteria:** Every var in .env is referenced in code or documented as needed for MCP/external tools.
**Next Sprint:** Yes

### [BE] I-052: Missing FLEXPRICE_API_KEY and other env vars
**Background:** R-2 scan found 27 env vars referenced in code but missing from .env. Most critical: FLEXPRICE_API_KEY (billing broken), TEXTMAGIC_WEBHOOK_SECRET, TAVUS_WEBHOOK_SECRET, VITE_VAPI_PUBLIC_KEY.
**Outcome:** All required env vars documented and set in .env. Billing works.
**Acceptance Criteria:** No "missing env var" warnings in server logs. Billing pages show FlexPrice data. Webhooks authenticate correctly.
**Next Sprint:** Yes

### [AU] I-053: Partner Admin can switch to any org (no partnerId check)
**Background:** Partner Admin switch-org has no partnerId validation. A Partner Admin can access orgs outside their partner group. AC 1.10 says "Partner Admin sees own companies + subs only." US-022 describes managing 3 specific dealerships, not all.
**Outcome:** Switch-org validates partnerId — Partner Admin can only access orgs within their partner group.
**Acceptance Criteria:** Login as Partner Admin -> org switcher shows only partner's dealerships -> attempt to switch to unrelated org returns 403.
**Next Sprint:** Yes

### [BE] I-054: Lead source labels show "VIN Source #7098" instead of meaningful names
**Background:** VIN Solutions lead sources display as raw IDs ("VIN Source #7098") instead of resolved names ("AutoTrader"). AC 7.6 says "Lead source labels show meaningful names." US-024 describes an Org Admin reviewing lead source breakdown for a marketing agency — unusable with raw IDs.
**Outcome:** Lead source IDs resolved to human-readable names via VIN Solutions API.
**Acceptance Criteria:** Navigate to insights -> lead source breakdown shows "AutoTrader", "Website", "Phone" etc., not "VIN Source #NNNN".
**Next Sprint:** Yes

### [FE] I-055: Login shows "Login failed" instead of specific error message
**Background:** Frontend displays generic "Login failed" instead of the API's specific error message ("Invalid email or password"). AC 1.6 specifies the user should see "invalid email or password".
**Outcome:** Frontend reads the API error response and displays the specific message.
**Acceptance Criteria:** Enter wrong credentials -> UI shows "Invalid email or password" (not "Login failed").
**Next Sprint:** Yes

### [FE] I-056: Logout intermittent React DOM error
**Background:** Logout intermittently throws a React DOM "removeChild" error — race condition in component teardown. AC 1.3 says "Logout clears cookie and returns to login screen." An error modal during logout breaks this flow.
**Outcome:** Logout completes cleanly without DOM errors.
**Acceptance Criteria:** Logout 10 times -> no error modal or console error on any attempt -> lands on login screen every time.
**Next Sprint:** Yes

### [FE] I-057: Product tour overlay blocks interaction
**Background:** Tour modal blocks interaction on first login and doesn't dismiss cleanly. AC 1.13 says "Product tour shows on first login" and AC 1.14 says "Tour dismisses per-page, doesn't restart on visited pages." A tour that traps the user violates both.
**Outcome:** Tour is dismissable on each page. Dismissing does not block interaction. Does not reappear on visited pages.
**Acceptance Criteria:** Login -> tour appears -> dismiss -> can interact with page -> navigate away -> navigate back -> tour does NOT reappear.
**Next Sprint:** Yes

### [FE] I-058: Console 400 error on main page load
**Background:** Main page load triggers a 400 Bad Request from /api/auth/refresh on unauthenticated load. AC 2.1 says "Main page loads without errors." A console error on every page load is an error.
**Outcome:** No 400 console errors on page load. Auth refresh handles unauthenticated state gracefully.
**Acceptance Criteria:** Open main page in fresh browser -> no 400 errors in console -> page renders cleanly.
**Next Sprint:** No (investigate — may be expected behavior for unauthenticated state)

### [FE] I-059: Tavus widget not configured for demo org
**Background:** Demo org cannot initialize Tavus video sessions — "not configured" error. AC 11.7 says "Tavus personas active per dealer" and US-002 describes a video lead capture flow. If the demo org is used to demonstrate the product, this flow fails.
**Outcome:** Demo org has Tavus configuration. Video widget initializes successfully.
**Acceptance Criteria:** Open widget for demo org -> select Video -> Tavus session starts without "not configured" error.
**Next Sprint:** No (depends on whether demo org is in scope for launch)

### [BE] I-060: After-hours auto-response not implemented
**Background:** US-021 describes: "Customer texts at 9:30 PM -> System detects after hours -> Auto-response sent: 'We are currently closed. Your message has been saved for priority follow-up at 9 AM.' -> Conversation tagged 'Followup' -> Salesperson sees tag in morning filter." This feature does not exist in the codebase. No business hours logic, no auto-response, no follow-up tagging.
**Outcome:** System detects after-hours status per org business hours configuration. Inbound messages outside hours trigger auto-response and tag conversation for follow-up.
**Acceptance Criteria:** Send SMS outside business hours -> auto-response sent within 60 seconds -> conversation tagged "Followup" in TeamBox -> tag appears in morning filter.
**Next Sprint:** Yes

---

## External (fixed by user)

| ID | Issue | Status |
|----|-------|--------|
| I-016 | central-mcp vin_create_contact missing dealerId | FIXED |
| I-017 | central-mcp tm_list_chats offset vs page | FIXED |

---

**Last updated:** 2026-03-18 (backlog promotion + after-hours)
**Open:** 24 items (9 BE, 6 FE, 3 IN, 2 DT, 1 AU)
**Test infrastructure:** 7 items
**External fixed:** 2 items
