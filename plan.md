# Nexxus v2.2 — Launch Execution Plan

**Date:** 2026-04-13
**Mode:** Sniper — find bug, fix bug, smoke test, move on
**Branch:** wave-pe3

---

## PART 0: HARNESS FIX

Close the Bash bypass so the orchestrator cannot write application code through any path.

- [ ] 0.1 Remove `Bash(python3 *)` from settings.json allow list
- [ ] 0.2 Remove `Bash(node *)` from settings.json allow list
- [ ] 0.3 Add app-path redirect detection to captain-check.sh Bash handler (block `> server/`, `> client/`, `> shared/`, `> tests/` patterns in Bash commands)
- [ ] 0.4 Verify: orchestrator cannot write to server/ via any tool (Edit blocked, python3 blocked, node blocked, redirect blocked)
- [ ] 0.5 Commit harness fix

---

## PART 1: EVAL AND TEST VERIFICATION

Before running any evals, verify the test infrastructure is correct.

- [ ] 1.1 Check DOM crawl freshness — when was the last crawl? Has the UI changed since then? If stale, re-crawl.
- [ ] 1.2 List all .spec.ts files and check each against current code — are selectors valid? Are API endpoints correct? Are assertions testing real behavior or just page loads?
- [ ] 1.3 For each of the 34 workflow slices, classify the test as: COVERED (asserts real behavior), PARTIAL (exists but shallow), MISSING (no test)
- [ ] 1.4 For every PARTIAL test: identify what assertion is missing and what needs to be added
- [ ] 1.5 For every MISSING test: write the test spec
- [ ] 1.6 Run all tests once to establish baseline — record pass/fail for each
- [ ] 1.7 Commit test fixes

---

## PART 2: PILLAR 1 — SOFTWARE OPS & METRICS

Go slice by slice. Find bug, fix, smoke test. Full pillar test at end.

### P1-01: Chat
- [ ] 2.1 Verify chat send/receive works (Playwright: log in, send message, verify it appears)
- [ ] 2.2 Verify message persists after page reload
- [ ] 2.3 Verify threading (message in correct conversation)
- [ ] 2.4 Fix any bugs found → smoke test each fix
- [ ] 2.5 Run P1-01 test → GREEN or log issue

### P1-02: Teambox
- [ ] 2.6 Verify conversations appear from all channels (SMS, phone, email, video)
- [ ] 2.7 Verify "Take Over" button works — agent stops, human takes control
- [ ] 2.8 Verify kill switch — enable it, send messages, verify they queue (not auto-responded)
- [ ] 2.9 Verify "Push to VIN" button from a conversation
- [ ] 2.10 Verify campaign filter shows campaign conversations
- [ ] 2.11 Fix any bugs → smoke test
- [ ] 2.12 Run P1-02 test → GREEN or log issue

### P1-03: Agents
- [ ] 2.13 Verify agent CRUD (create, read, update, delete)
- [ ] 2.14 Verify agent execution produces activity log entry
- [ ] 2.15 Fix any bugs → smoke test
- [ ] 2.16 Run P1-03 test → GREEN or log issue

### P1-04: Settings
- [ ] 2.17 Verify settings save and persist across page reload
- [ ] 2.18 Verify settings persist across logout/login
- [ ] 2.19 Verify a setting change affects behavior (e.g., disable a channel, verify it stops sending)
- [ ] 2.20 Fix any bugs → smoke test
- [ ] 2.21 Run P1-04 test → GREEN or log issue

### P1-05: Billing
- [ ] 2.22 Check Lago MCP on port 4004 — is it running? Does it respond?
- [ ] 2.23 If Lago is running: verify billing page shows real data from Lago
- [ ] 2.24 If Lago is not running: verify billing page degrades gracefully (no crash, meaningful message)
- [ ] 2.25 Check if FlexPrice code needs to be replaced with Lago wiring
- [ ] 2.26 Fix any bugs → smoke test
- [ ] 2.27 Run P1-05 test → GREEN or log issue

### P1-06: Insights/Metrics
- [ ] 2.28 Verify dashboard loads with real data (not stubs, not hardcoded)
- [ ] 2.29 Check the 11 known metric bugs (I-258 through I-268) — which are launch-blocking?
- [ ] 2.30 Fix launch-blocking metric bugs
- [ ] 2.31 For non-blocking metric bugs: log them, move on
- [ ] 2.32 Run P1-06 test → GREEN or log issue

### Pillar 1 Full Test
- [ ] 2.33 Run ALL P1 tests together
- [ ] 2.34 Capture evidence (screenshots, test output)
- [ ] 2.35 Commit all P1 fixes

---

## PART 3: PILLAR 2 — 3RD PARTY CONNECTIONS

Same discipline. Slice by slice.

### P2-01: VIN Solutions
- [ ] 3.1 Verify vin-safe-mcp on port 4003 is healthy
- [ ] 3.2 Verify per-org vinLeadSourceName is set correctly (Serra Honda, Ford of Columbia, Hyundai of Columbia)
- [ ] 3.3 Test prepare → execute flow for Serra Honda (dealer 21043, source "Dealers WebSite", account Durran Cage)
- [ ] 3.4 Test prepare → execute for Ford of Columbia (source "Dealer Website")
- [ ] 3.5 Test prepare → execute for Hyundai of Columbia (source "Dealer .Com (Our Website)")
- [ ] 3.6 Fix any bugs → smoke test
- [ ] 3.7 Run P2-01 test → GREEN or log issue

### P2-02: VAPI
- [ ] 3.8 Verify VAPI API key and secret key are in .env (different functions)
- [ ] 3.9 Verify webhook handler at /api/webhooks/vapi accepts payloads
- [ ] 3.10 Locate elliott.ts outbound test script
- [ ] 3.11 Test: elliott.ts calls sales agent → conversation completes → transcript arrives → conversation created
- [ ] 3.12 Verify Serra service persona is configured
- [ ] 3.13 Fix any bugs → smoke test
- [ ] 3.14 Run P2-02 test → GREEN or log issue

### P2-03: Tavus
- [ ] 3.15 Verify Tavus API key and webhook secret in .env
- [ ] 3.16 Test: initiate video chat → popup asks for participant name (if popup appears → PASS)
- [ ] 3.17 Test transcript pipeline: transcript arrives → parsed → appears in communication box
- [ ] 3.18 Fix any bugs → smoke test
- [ ] 3.19 Run P2-03 test → GREEN or log issue

### P2-04: TextMagic
- [ ] 3.20 Verify TextMagic goes through MCP (tm_send_message on port 4002)
- [ ] 3.21 Map the 3 phone numbers: which sends, which receives, which does both
- [ ] 3.22 Test outbound SMS via MCP
- [ ] 3.23 Test inbound SMS webhook (/api/webhooks/textmagic)
- [ ] 3.24 Fix I-271: TextMagic delivery notification webhook returns 400 — add delivery receipt handler
- [ ] 3.25 Determine if V1 or V2 API is used by MCP (document finding)
- [ ] 3.26 Fix any bugs → smoke test
- [ ] 3.27 Run P2-04 test → GREEN or log issue

### P2-05: Resend
- [ ] 3.28 Verify Resend API key in .env
- [ ] 3.29 Verify sender address noreply@huminic.ai (or notifications@huminic.ai)
- [ ] 3.30 Test: trigger an email → check Resend logs for "sent" status with message ID
- [ ] 3.31 Investigate I-239: is rate limit a code bug or account limit?
- [ ] 3.32 Fix any bugs → smoke test
- [ ] 3.33 Run P2-05 test → GREEN or log issue

### P2-06: Lago Billing API
- [ ] 3.34 Check Lago MCP on port 4004 — running?
- [ ] 3.35 If Lago running: verify API returns plans, usage, entitlements
- [ ] 3.36 If Lago packages configured: document what's set up
- [ ] 3.37 Wire billing page to Lago if FlexPrice code is dead
- [ ] 3.38 Fix any bugs → smoke test
- [ ] 3.39 Run P2-06 test → GREEN or log issue

> **Note:** Lago billing integration is POST-LAUNCH. FlexPrice code is dead but billing page degrades gracefully. Integration plan documented in issues.md I-278.

### Pillar 2 Full Test
- [ ] 3.40 Run ALL P2 tests together
- [ ] 3.41 Capture evidence (API responses, external service logs)
- [ ] 3.42 Commit all P2 fixes

---

## PART 4: PILLAR 3 — E2E WORKFLOWS

### Trigger Bug Fixes (BEFORE any trigger testing)
- [ ] 4.0a Fix I-272: Remove bypassBusinessHours from triggerService.ts — after-hours trigger must QUEUE for morning, not bypass TCPA
- [ ] 4.0b Fix I-273: Remove [trigger:*] dedup tag from customer-visible SMS — move to outbound_log metadata
- [ ] 4.0c Fix I-274: Add triggerTestPhones whitelist — if set in org settings, only send to those numbers
- [ ] 4.0d Smoke test all 3 fixes
- [ ] 4.0e Commit trigger fixes

### Inbound Flows
- [ ] 4.1 SMS → sales agent (autonomous path): send SMS to TextMagic number → verify agent picks up → agent responds → conversation logged → visible in TeamBox
- [ ] 4.2 SMS → sales agent (human takeover): same as 4.1 but take over mid-conversation → verify agent stops → human responds from TeamBox → customer receives human reply
- [ ] 4.3 Phone → sales agent: use elliott.ts to call sales VAPI agent → conversation completes → transcript parsed → appointment data extracted → VIN lead pushed → transcript in communication box
- [ ] 4.4 Phone → service agent: same flow for service department (if second agent configured — if not, mark BLOCKED and document)
- [ ] 4.5 Video → Tavus: initiate video → transcript → VIN push
- [ ] 4.6 Fix any bugs found in 4.1-4.5 → smoke test each
- [ ] 4.7 Run inbound flow tests → GREEN or log issues

### Campaign Flows
- [ ] 4.8 CSV upload: upload test CSV (5 contacts) to Serra Honda service campaign → verify parsing, dedup, recipient count
- [ ] 4.9 Campaign execute: execute campaign → verify all 5 SMS sent via TextMagic → verify conversations created in TeamBox
- [ ] 4.10 Campaign response → agent: reply to campaign SMS → verify matched to campaign conversation → service agent responds → appointment scheduling attempted
- [ ] 4.11 Campaign response → human takeover: take over campaign conversation in TeamBox → verify human can respond
- [ ] 4.12 Channel configurability: verify campaigns can be configured for SMS only, email only, phone only, and combinations
- [ ] 4.13 Outbound phone campaign: execute phone campaign via VAPI (if configured)
- [ ] 4.14 Outbound email campaign: execute email campaign via Resend → verify Resend logs show sent
- [ ] 4.15 Fix any bugs → smoke test each
- [ ] 4.16 Run campaign flow tests → GREEN or log issues

### Outbound Triggers
- [ ] 4.17 Set up trigger test whitelist with operator's test phone numbers ONLY
- [ ] 4.18 Enable triggers for Serra Honda with whitelist active
- [ ] 4.19 Test after-hours trigger: insert test lead (external source) → verify trigger detects it → verify SMS QUEUED for next business hours (NOT sent immediately)
- [ ] 4.20 Test 24-hour check-in trigger (10-min delay for testing): insert test lead → wait → verify SMS sent during business hours → verify notification email sent to admins
- [ ] 4.21 Test multi-channel trigger configuration (1, 2, or 3 channels)
- [ ] 4.22 Test cold SMS response matching: send campaign SMS → customer replies → verify matched to original outreach conversation
- [ ] 4.23 Verify trigger enable/disable per org
- [ ] 4.24 Fix any bugs → smoke test each
- [ ] 4.25 Run trigger flow tests → GREEN or log issues

### Observability
- [ ] 4.26 End-to-end data chain: run one complete inbound → process → outbound cycle → trace every step in logs/dashboard → verify no blind spots
- [ ] 4.27 Admin failure notification: cause a deliberate failure → verify admin gets notified via email
- [ ] 4.28 Admin campaign notification: execute campaign → verify admin notified of status
- [ ] 4.29 Metrics accuracy: after running P3 tests, verify insights dashboard reflects the activity (message counts, lead counts, campaign metrics match actual sends)
- [ ] 4.30 Fix any bugs → smoke test
- [ ] 4.31 Run observability tests → GREEN or log issues

### Pillar 3 Full Test
- [ ] 4.32 Run ALL P3 tests together
- [ ] 4.33 Capture evidence (TextMagic logs, VAPI call logs, Resend logs, VIN lead confirmations, screenshots)
- [ ] 4.34 Commit all P3 fixes

---

## PART 5: AUTONOMOUS FULL APP TEST

Run every workflow end-to-end without human intervention.

- [ ] 5.1 All P1 tests pass
- [ ] 5.2 All P2 tests pass
- [ ] 5.3 All P3 inbound flow tests pass (using TextMagic test numbers, elliott.ts, Playwright MCP)
- [ ] 5.4 All P3 campaign flow tests pass (using test CSV, test phone numbers)
- [ ] 5.5 All P3 trigger flow tests pass (using whitelist numbers only)
- [ ] 5.6 All P3 observability tests pass
- [ ] 5.7 Capture full evidence set
- [ ] 5.8 Commit autonomous test results
- [ ] 5.9 Widget embed test: FAB renders, dropdown opens, all 4 options work, iframe loads, per-dealer JS serves

---

## PART 6: INTERACTIVE TEST

Run critical flows with operator's real phone numbers and email.

- [ ] 6.1 Service campaign → operator's phones (same test as before but clean, post-fixes)
- [ ] 6.2 Two-way SMS conversation with agent
- [ ] 6.3 Human takeover in TeamBox
- [ ] 6.4 Push-to-VIN from TeamBox conversation
- [ ] 6.5 Trigger notification emails → operator's email inbox
- [ ] 6.6 Outbound call to operator's phone (if VAPI configured)
- [ ] 6.7 Capture evidence + operator confirmation
- [ ] 6.8 Final commit

---

## PART 7: APOLOGY SMS

- [ ] 7.1 Send apology to 7 Serra Honda customers (operator approves message first)
- [ ] 7.2 Check for replies and respond appropriately

---

## EXECUTION PATTERN PER PILLAR

1. Fix ALL known bugs in the pillar (dispatch sub-agents for each fix)
2. Commit all fixes together
3. Build and deploy ONCE
4. Run the FULL pillar eval — all slices, all fixes verified in one pass
5. Every fix is smoke-tested as part of that eval run, not individually
6. Capture evidence for the whole pillar
7. Move to next pillar

Do NOT smoke test individual fixes. Do NOT build/deploy after each fix. Batch fixes per pillar, then one build, one deploy, one eval pass.

## RULES

1. Orchestrator delegates ALL code changes to sub-agents
2. Every bug gets classified before fixing: CODE_DEFECT | CONFIG_DATA_DEFECT | EVAL_GAP | HARNESS_DEFECT | EXTERNAL_BLOCKER
3. One slice at a time — no batching
4. Full pillar eval at end of each pillar (not per-fix smoke tests)
5. Evidence captured at every step
6. No assumptions — verify before acting
7. No hardcoding to make tests pass
8. No TCPA bypass or safety gate removal
9. No sending to real customers without test whitelist
10. All sub-agents run in background — operator must always be able to communicate
