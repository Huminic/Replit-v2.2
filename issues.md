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

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-277 | **Chat AI response disappears after streaming.** Response renders while streaming but vanishes when stream completes. Root cause: useEffect/useRef race condition — streaming bubble hides before message added to permanent state. Fix: replaced with synchronous onComplete callback in useStreamingChat.ts, handleStreamComplete in main.tsx. | FE | CLOSED (LAUNCH-RECON-01) | M |

---

## TeamBox (/teambox)

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-174 | "Send to CRM" button — manual VIN lead creation from conversations (form + SMS channels) | BE, FE | BACKLOGGED (BL-092) | H |
| I-NEW-2026-04-26-B | **Test Customer auto-create source** — chat-init code path creates a `Test Customer` conversation row before the user types or identifies. Surfaced during Priority 9 cleanup: 11 such rows accumulated for Serra Honda over 18 days, all with no phone/email and 0 messages. Investigate `client/src/pages/widget-landing.tsx` and `server/routes/conversations.ts` create paths. Likely fix: defer conversation row creation until first real message OR mark/skip these in TeamBox list. | BE, FE | OPEN | M |
| I-NEW-2026-04-26-C | **Shelby Dew duplicate-init race** — three `ai-chat` / `ai-assistant` conversation rows created within ~1ms of each other for `sdew@serrahonda.net` when chat is opened. Suggests a duplicate-create race in the conversation init flow (or two channels independently creating from one event). Reproduce by opening chat as Shelby Dew and watching the conversations table. **Priority bumped 2026-04-27:** this bug created ambiguous-classifier rows that were swept into the over-broad cleanup (`831bbc2`). Fix prevents future similar ambiguity. | BE | OPEN — PRIORITY-BUMP | S |
| I-NEW-2026-04-26-D | **Voice channel without thread** — voice integration creates a conversation row before/independent of any message arriving. Surfaced during Priority 9 cleanup: 4 zero-message voice-channel rows for Serra Honda (and 50/18/4 voice rows on Hyundai of Columbia / Ford of Columbia / Serra Nissan respectively, many likely the same pattern). Investigate VAPI / voice-call webhook conversation-creation timing — the row should be created on first transcript chunk, not on call-init. **Priority bumped 2026-04-27:** confirmed creating real-customer voice rows from VAPI inbound (per `restore-assessment-2026-04-27.json`); produced 7 PRESERVE rows that were lost in the over-broad cleanup (`831bbc2`). Fix prevents future similar ambiguity. **RESOLVED 2026-04-27** in commit `66cc93b`: fail-closed VAPI inbound webhook guard at `server/lib/vapiInboundGuard.ts` invoked from `server/routes/webhooks.ts` rejects no-content / placeholder VAPI events; TestLane bypass preserved; existing orphans not touched (forward-only per corrected 2026-04-27 retention policy). Verifiers: scope-guardian PASS, code-reviewer APPROVE, qa-evaluator PASS (27/27 unit + full-suite 344/348 + runtime decision trace), integration-safety PASS, nexxus-launch-captain GO. Evidence: `evidence/I-NEW-2026-04-26-D/`. | BE | RESOLVED — verified | M |
| I-NEW-2026-04-27-INCIDENT | **2026-04-26 over-broad Serra Honda conversation cleanup — accepted loss; policy corrected.** Commit `831bbc2` deleted 84 conversations + 176 cascaded messages on Serra Honda based on the prior 2026-04-26 data retention rule that was later (2026-04-27) corrected. Per the corrected policy, 47 of those 84 rows should have been preserved (20 PRESERVE_REAL_OR_INTEGRATION + 27 REVIEW_UNKNOWN); 51 message rows lost in raw form (cascade-deleted; preview JSON did not capture message bodies). Operator decision: accept loss; provider-side logs (VAPI / Resend / third-party) provide recent-call recovery if needed; PITR not pursued. Full incident write-up at `evidence/incident-2026-04-26-overbroad-cleanup.md`. Restore-assessment evidence at `evidence/orphan-teambox-2026-04-26/restore-assessment-2026-04-27.json`. Corrected policy at `decisions.md` (2026-04-27 row, supersedes 2026-04-26 row). Lesson: operator framing informs but every cleanup needs row-level evidence-based classification before execution. | OPS, GOV | RESOLVED — accepted loss, policy corrected | n/a |
| I-NEW-2026-04-27-SMS-AUDIT | **15 SMS conversation rows to real-looking US phones found in restore-assessment** — restore-classify of the deleted Serra Honda rows surfaced 15 SMS conversations with phones to real-looking US numbers (412/541/256/601/859/205 area codes) and real-looking customer names. Per 2026-04-27 integration-status policy, TextMagic/SMS is NOT in customer use yet; only test numbers should appear. Investigate independent of the cleanup question: were these real customer SMS sends pre-launch (compliance/audit issue), or test/fixture data using real-looking numbers? If real sends, surface to operator immediately. Source: `evidence/orphan-teambox-2026-04-26/restore-assessment-2026-04-27.json` (REVIEW_UNKNOWN bucket). | BE, OPS | OPEN | M |

---

## Sales (/sales)

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-130 | Agent pages need favorites and sub-menu bar (Sales, Service, Marketing) | FE | BACKLOGGED (BL-094) | M |
| I-NEW-2026-04-28-A | **Active Pipeline (14d) tile lacks a 14d-vs-prior-14d delta — currently suppressed.** Tile value is the 14d count from `/api/metrics/pipeline` (server/storage.ts ~line 802); the summary endpoint's `activeLeadsChange` (server/vendorProxy.ts:561-576, 596-598, 635) is a 30d-vs-prior-30d delta — different window from the value. Priority #6 Commit B initially labeled the tile `vs prior 14d` while sourcing the 30d-vs-30d delta (window-mismatch trust violation caught in code-review). Commit-B-followup suppresses the delta entirely (`change: null`) per the operator "missing is better than wrong" principle. Real fix requires a server-side 14d-vs-prior-14d active-leads delta computation — out of scope for Priority #6 (UI-only sprint). Not blocking launch — value is still meaningful, only the delta is suppressed. | BE, FE | OPEN — backlog/low | M |

---

## Service (/service)

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-NEW-2026-04-26 | **service.tsx should reflect execution_status, not only status** — `client/src/pages/service.tsx:412-413` shows `campaign.status` as the user-facing label, but the actual scheduler state lives in `campaign.execution_status`. CSV uploads create campaigns with `status='active'` and `execution_status='idle'` simultaneously, causing admins to see "active" for never-started campaigns. Surfaced during Priority 8 archaeology of stuck campaign `30267ae2-5d81-4c21-b0bf-ad96e4eb31ec`. Concurrent minor defect: `campaignStatusColors` map at `service.tsx:74-80` has no `'archived'` key — after the operator-approved archive, the indicator dot renders unstyled. The list itself does not filter by status either (server `getCampaigns()` at `storage.ts:477-481` returns all rows; UI at `service.tsx:397` maps unconditionally), so archived rows still appear in the campaigns list. Fix: display `execution_status` (or a derived state) as the primary label, OR enforce `status` matches `execution_status` at upload time. Optionally also: add `'archived'` to `campaignStatusColors` and filter archived rows out of the active campaigns list. | FE | OPEN | E |

I-113 and I-132 resolved in S4.

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
| I-NEW-2026-05-07-AUTH-D | **Forgot-password email-case mismatch silently misses user.** `server/routes/auth.ts:353` does NOT lowercase the email input; `server/storage.ts:258-261` uses exact-match SQL (`eq(users.email, email)`). Mixed-case input (e.g. `Duane.Wells@huminic.ai`) silently misses the user record, but the endpoint returns 200 anyway (by design, for enumeration safety). Result: operator believes a reset email was sent but no Resend send actually fires. **Confirmed historical impact:** Wave I-Auth Option-C resolution (2026-05-07) found that the operator's 2026-03-20 02:16:47 UTC forgot-password POST returned 200 but produced ZERO Resend records — exact symptom of this defect. Fix: lowercase input before lookup at auth.ts:353 (single line). Cross-ref: Wave I-Auth findings.md, evidence/wave-I-auth-integrity/verifier-audit/option-C-resend-resolution.md. | BE | OPEN | E |
| I-NEW-2026-05-07-AUTH-E | **No `login_success` audit log.** `server/routes/auth.ts` records `login_failed` events to `activity_log` but does NOT record successful login events. Result: no positive audit trail for successful logins; security investigations have to infer success from absence of failures (or from session-creation rows, which are wiped on next login). Wave I-Auth investigator confirmed via DB-wide grep: no `createActivityLog` call related to successful login exists in the codebase. Fix: add a single `createActivityLog` call after successful authentication. Cross-ref: Wave I-Auth findings.md anomaly #1. | BE | OPEN | E |
| I-NEW-2026-05-07-AUTH-G | **Reset-password 15-min UI countdown vs 60-min server token expiry.** `client/src/pages/reset-password.tsx:62` shows a 15-minute UI countdown and force-expires the page; `server/routes/auth.ts:358` keeps the reset token valid for 60 minutes. User-visible behavior: page tells the user the link expired and forces them to request a new one, even though the server would still accept the token for another 45 minutes. Fix: align UI countdown with server expiry (likely change UI to 60 min). Cross-ref: I-165 (could be folded as a concrete subitem). Wave I-Auth findings.md option G. | FE | OPEN | E |
| I-NEW-2026-05-07-AUTH-H | **`change-password` does not invalidate other active sessions.** When a user changes their password, existing sessions on other devices remain valid. Security-flavored: typical authentication best practice is to invalidate all other active sessions on password change. Surfaced by Wave I-Auth blind-verifier (not in original investigator findings; orchestrator added on advocate's call). Fix: after successful password change, delete other active sessions for this user (keep current session). Cross-ref: evidence/wave-I-auth-integrity/verifier-audit/blind-verifier-verdict.md. | BE | OPEN | M |
| I-NEW-2026-05-07-AUTH-I | **`/api/auth/refresh` not rate-limited.** Refresh-token endpoint accepts unbounded requests with no rate limit. Security-flavored: opportunistic abuse vector for token enumeration / brute-force attempts. Surfaced by Wave I-Auth blind-verifier (not in original investigator findings; orchestrator added on advocate's call). Fix: add rate limit middleware (consistent with login endpoint's existing rate limit, if any). Cross-ref: evidence/wave-I-auth-integrity/verifier-audit/blind-verifier-verdict.md. | BE | OPEN | E |

---

## Widget / Landing (/w/, /p/)

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-168 | Widget interaction mode states — 13/14 verified in S1, voice callback 404 until deploy | FE, BE | NEEDS LIVE TEST | M |
| I-214 | **FIXED (T-010a).** Widget CORS: added middleware after Helmet to override CORP→cross-origin, COOP→unsafe-none, CSP frame-ancestors→* for /widget/*, /api/widget/*, /w/*, /p/* routes. Cache max-age bumped to 86400 per Dealer.com requirements. Verified: `curl -I` confirms correct headers on live. | FE, BE, IN | CLOSED (T-010a) | E |

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
| I-105 | **FlexPrice is dead — replace with Lago (post-MVP).** FlexPrice returns `{configured: false}` on all endpoints. No longer the billing provider. Lago is running locally via Coolify (6 Docker containers). **Scrub:** remove FlexPrice from `server/services/billingService.ts`, `server/index.ts`, `client/src/pages/management.tsx`, `.env`/`.env.example`, 81 files total. **Build:** Lago connector, wire billing UI to Lago API. Not blocking MVP launch. | BE, FE, IN | BACKLOGGED (BL-096) | H |
| I-171 | 26 billing UI states with no functional coverage — wired to dead FlexPrice, will need rewire to Lago (I-105) | FE | BACKLOGGED (BL-096) | H |
| I-278 | **Lago billing integration needed.** FlexPrice is dead. Lago MCP running on port 4004. Integration plan: (1) create customer on signup, (2) create subscription on plan selection, (3) emit usage events from backend, (4) receive Lago webhooks for invoice status. Estimated 2-3 days post-launch. Existing billing page degrades gracefully ("not configured"). | BE | POST-LAUNCH | M |

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
| I-194 | **FIXED (T-010a).** VAPI→VIN re-enabled with per-dealer vinLeadSourceName configured in org.settings. Safety guards added: 555-number rejection, transcript-required check, "Unknown Caller" → AI/Lead naming. Tavus path also fixed (was live without guards). Backfill assessed: 1 ringing-only call in 24h, no transcript, not pushable. Dealer source names: Serra Honda/Nissan/Ford="Dealers WebSite", Hyundai of Columbia="Dealer .Com (Our Website)", Ford of Columbia="Dealer Website". | BE | CLOSED (T-010a) | M |
| I-240 | **BUG-INT-07: VIN lead creation failing on live calls.** The vin-safe-mcp server (port 4003) returns errors during prepare step for some orgs. Root cause: dealer provisioning incomplete or MCP connectivity issue. Webhook error handling (webhooks.ts) correctly creates escalation tasks, but the underlying MCP provisioning must be verified externally. **Blocked pending central-mcp/vin-safe-mcp provisioning verification.** Cannot fix within nexxus project — external dependency per filesystem boundary rules. | BE | OPEN | H |
| I-NEW-2026-04-29-H | **Daily recap email per org.** Operator-requested 2026-04-29. **RESOLVED 2026-04-30** in stabilization sprint chunk 1A. New `server/services/dailyRecapService.ts` + `dailyRecapDecision.ts` modules with `runDailyRecapScheduler` wired into `scheduler.ts` (5-min tick). New `sendDailyRecapEmail` in `notificationService.ts`. Per-org flag `settings.dailyRecapEnabled` default OFF, configurable hour `settings.dailyRecapHour` default 18 local. Idempotency via `outbound_log` substring check + `scheduler_locks` row. CommGate + test-lane two-way fail-closed enforced. Verified: 31/31 unit tests pass, end-to-end fire to allowlisted internal_operator confirmed in `evidence/stabilization-sprint-2026-04-30/1A/sprint/` (delta 1 + delta 2). Reviewers: integration-safety PASS, code-reviewer APPROVE. | BE | RESOLVED — verified | M |
| I-NEW-2026-04-30-B | **SMS appointment-intent admin notification email (Sprint 2.4 VAPI parity).** Operator-requested 2026-04-29 (customer-meeting gap). **RESOLVED 2026-04-30** in stabilization sprint chunk 1A. After AI auto-replies to inbound SMS, `classifySmsAppointmentIntent` (Claude) detects appointment intent; on positive, `sendSmsAppointmentIntentNotification` fires admin email matching the VAPI lead-email pattern. Idempotency `sms_appt_{conversationId}_{YYYY-MM-DD}`. Inserted at the post-success branch of the existing AI auto-reply IIFE in `server/routes/sms.ts`. Verified end-to-end with synthetic fixture; outbound_log row confirmed in `evidence/stabilization-sprint-2026-04-30/1A/sprint/`. Accepted prompt-injection debt tracked at I-NEW-2026-04-30-A. Reviewers: integration-safety PASS, code-reviewer APPROVE. | BE | RESOLVED — verified | M |
| I-NEW-2026-04-30-C | **Test coverage gap: I-254 SMS AI race after human takeover.** Chunk 2A added a fresh `storage.getConversation` re-check immediately before `processOutboundSend` in `server/routes/sms.ts` to close the ~1-3s race window between the assignedTo check and the SMS send. The fix is small and self-evident, but a unit test that mocks storage to return `assignedTo=null` on first read and `assignedTo=<userId>` on second read would close the regression-prevention gap. Filed per Environmental Core Value #8. | BE | OPEN — accepted debt | E |
| I-NEW-2026-04-30-E | **TextMagic webhook signing header may be absent in production.** Pre-2026-04-30, `TEXTMAGIC_WEBHOOK_SECRET` was never set on dev or live; pre-chunk-2B handler ignored it. After chunk 2B (I-236) made the unset case 503-reject in production, the incident-fix workflow set a fresh-generated value in Coolify env; real TextMagic webhooks then 401-rejected because TextMagic's dashboard config does not include a matching signing secret. Chunk 5 softened the check: when `TEXTMAGIC_WEBHOOK_SECRET` is set but no signing header is present, accept (matches months of prior behavior — zero-new-vulnerability). When a header IS present and mismatches, reject 401. **Followup**: verify TextMagic dashboard webhook config; if a secret CAN be configured there, set the matching value on both sides and remove the relaxed-verify branch. Until then, TextMagic webhook auth is "best-effort" — TextMagic-side spoofing is not detected. | BE, SEC | OPEN — accepted debt (chunk 5 relaxed-verify in place) | E |
| I-NEW-2026-04-30-A | **Accepted prompt-injection risk in SMS appointment-intent classifier.** `classifySmsAppointmentIntent` in `server/routes/sms.ts` interpolates customer-controlled SMS text into the Claude prompt with no delimiters or sanitization. A hostile customer can flip `appointmentIntent: true` or forge `vehicleOfInterest` / `summary` / `preferredDate` in the resulting admin email. Blast radius bounded: notification email only, no SMS reply, no DB writes beyond log row, no VIN action. Hardening (delimited prompt envelope, schema-validate classifier output, sanitize summary before email interpolation) is post-launch debt. Filed per Environmental Core Value #8 (all debt must be recorded). | BE, SEC | OPEN — accepted debt | E |
| I-NEW-2026-04-29-I | **EXPERIMENTAL: VIN Solutions browser-based report extraction.** Operator-requested 2026-04-29 (backlog only — explicitly not in current scope). Closes the gap where VIN Solutions exposes data in its UI / scheduled reports that is NOT available via the API (e.g., human-readable lead-source catalog mapping that turns `https://api.vinsolutions.com/leadsources/id/3743779?dealerid=21043` into "Cars.com" / "AutoTrader" / "Walk-in"; service ROs; some sold-vehicle history). Approach: headless browser logs into VIN UI as a dealer admin, navigates to the report screen, exports CSV, ingests rows into our warehouse. **Theoretically possible — proven approaches: Browserbase (hosted Chromium), Anthropic Computer Use (visual-LM driver, robust to UI drift), Stagehand, self-hosted Playwright. Real blockers (operational, not technical): (1) VIN Solutions ToS — verify automation is permitted with Cox before building; (2) 2FA/MFA — if enforced, need TOTP or operator-push flow; (3) credential custody — dealer admin creds need a vault and rotation; (4) UI drift — VIN UI changes break the flow, mitigate with visual-LM or healing tests; (5) rate / detection — too many runs from one IP get flagged; (6) audit trail — VIN may log automated logins differently. Scope of MVP: pick one report (lead-source catalog), prove end-to-end extraction → warehouse persistence → channel-attribution display in a single org (Serra Honda). Then evaluate whether to expand. **Recommended pre-build steps**: ToS legal review (1-2 days), spike with Browserbase + one report (~1-2 days), credential vault design (~1 day). Effort H reflects the spike, not the production system. | BE | BACKLOGGED (experimental) | H |
| I-NEW-2026-05-07-TEXTMAGIC-URL | **TextMagic dashboard inbound callback URL still points at dev.huminicdev.com instead of live.huminic.app.** Surfaced 2026-05-07 when operator received a TextMagic email warning the callback URL was not functioning — investigated as a side-thread of Wave 2A. Dev returns HTTP 503 because `TEXTMAGIC_WEBHOOK_SECRET` is unset on dev's `.env` and `NODE_ENV=production` triggers the strict-reject branch at `server/routes/sms.ts:171-173`. Live is healthy (secret IS set on live). **Production impact:** any dealership inbound SMS that TextMagic routes against the dev URL is silently dropping right now. Operator-execute fix (no code change): in TextMagic dashboard → Account/Settings → inbound webhook config → change URL from `https://dev.huminicdev.com/api/webhooks/textmagic` to `https://live.huminic.app/api/webhooks/textmagic`. If multiple URL fields exist (inbound message / delivery report / status callback), update all. Verify by texting Serra Honda inbound number `+1 (901) 436-1271` from any phone — message should appear in TeamBox conversations on `live.huminic.app` within ~30s. Sibling debt to I-NEW-2026-04-30-E (signing-header relaxed-verify). Full investigation finding: `evidence/wave-2A-trigger-provider-proof/sidethread-textmagic-webhook/finding.md`. | OPS, BE | OPEN — operator-execute (third-party dashboard; no code change) | E |
| I-NEW-2026-05-08-DEV-PM2-WEBHOOK-AUTH | **Dev pm2 `nexxus-app` runs with `NODE_ENV=production` AND `VAPI_WEBHOOK_SECRET` UNSET, so all VAPI webhook POSTs to dev get 503-rejected at the I-236 auth gate (`server/routes/webhooks.ts:920-925`) before any handler logic runs.** Surfaced during Wave 2A T4 dispatch 2026-05-08 — synthetic webhook proofs both 503'd; could not exercise the I-NEW-2026-04-26-D fail-closed guard branches because the auth gate fired first. SAME PATTERN as I-NEW-2026-05-07-TEXTMAGIC-URL (dev rejects webhooks for production-strict reasons). Operator-decision required because the fix changes dev runtime behavior: (a) set `VAPI_WEBHOOK_SECRET` in dev `.env` + `pm2 reload nexxus-app --update-env`, OR (b) flip dev pm2 to `NODE_ENV=development` (more invasive — affects other prod-strict checks). Live unaffected (live has the secret set in Coolify env). Test rig should standardize on accepting webhooks for synthetic test events going forward. Until fix lands, T4 webhook proof remains PARTIAL (auth gate proven, guard branches not exercised). Full T4 finding: `evidence/wave-2A-trigger-provider-proof/chunk-T4/proof.md`. | OPS, BE | OPEN — operator-decision (env config; changes dev runtime behavior) | E |

---

## Campaigns

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-193 | No CSV template download button on create campaign screen — users have no reference for expected column format | FE | OPEN | E |
| I-270 | **Bulk CSV upload button sends to non-existent endpoint.** Top-level "Upload CSV" button on service campaigns page sets `csvUploadCampaignId = 'bulk'` and sends to `/api/campaigns/bulk/upload-csv` which does not exist. Returns 404. Per-campaign upload works. File: `client/src/pages/service.tsx` line 363. Fix: either create the bulk endpoint or require campaign selection before upload. | FE | OPEN | E |
| I-271 | **TextMagic delivery notification webhook returns 400.** The handler at `server/routes/sms.ts:55` only handles inbound SMS (expects `sender` + `text`). TextMagic delivery receipts have different payload (`messageId` + `status`, no `sender`). Handler returns 400 "Missing sender or text" for all delivery notifications. TextMagic disables callback after repeated failures. Fix: add early detection of delivery notification payloads and return 200. Also set `TEXTMAGIC_WEBHOOK_SECRET` in `.env`. | BE | CLOSED (LAUNCH-RECON-01, 8acc270) | E |

---

## Infrastructure / Testing

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-182 | Test 2.1: dashboard 404 on static resource (favicon or similar) — page works, asset missing | IN | TEST-ONLY (not product bug) | E |
| I-183 | Test 4.10: campaign reply webhook — conversation not found within retry window. Timing issue after S-12 SMS mutex. Test-side fix: increase retry count or wait interval. | IN | TEST-ONLY (not product bug) | M |
| I-195 | Test 5.9: SMS webhook response shape mismatch — test asserts `body.success` but endpoint returns `{ received: true }`. Test-side fix: assert `status < 500` and poll conversations. | IN | TEST-ONLY (not product bug) | E |
| I-184 | Test 6.4/6.5: Management page tests expect org_admin access — needs update for S9 RBAC change (super_admin only) | IN | TEST-ONLY (not product bug) | E |
| I-185 | Test 9.3: "Restart Tour" button not found by test locator — selector mismatch with actual button text | IN | TEST-ONLY (not product bug) | E |
| I-186 | Test 10.3: Appointment schema uses different field name than test expects for date | IN | TEST-ONLY (not product bug) | E |
| I-187 | Test RI-VAPI-1: Transcript not available within 60s wait window — VAPI webhook timing | IN | TEST-ONLY (not product bug) | M |
| I-188 | Test RI-VIN-1: Warehouse leads query returns 0 rows with vin_created_at dates | IN | TEST-ONLY (not product bug) | M |
| I-189 | Test S9-TRIGGER-1: Walk-in followup agent endpoint auth — test uses wrong auth context | IN | BACKLOGGED (BL-095) | E |
| I-196 | 2 orphan test files (g004-gap-coverage.spec.ts, m001-gap-coverage.spec.ts) not matched by any Playwright project | IN | TEST-ONLY (not product bug) | E |
| I-197 | 8 sprint test files (s0-s8) hardcode `dev.huminicdev.com` instead of using `process.env.BASE_URL` | IN | CLOSED (b434117) — hardcoded dev URLs removed from test files | E |
| I-198 | Dead test helpers: tests/helpers/api.ts and tests/helpers/factory.ts — zero imports from any active test | IN | TEST-ONLY (not product bug) | E |
| I-199 | verify-all.ts hardcodes FQDN and uses own login logic instead of shared helpers | IN | TEST-ONLY (not product bug) | E |
| I-200 | **No production environment — comprehensive investigation (T-010a session).** live.huminic.app and dev.huminicdev.com both hit the same PM2 process (localhost:5000), same .env, same Supabase DB. See I-215 through I-224 for the full breakdown. PARTIALLY RESOLVED — Coolify container running, live deployed via CI/CD. Remaining: staging DB separation, production .env, monitoring. | IN | IN SPRINT (I-001) | H |
| I-215 | **Coolify application never created for nexxus.** Coolify is running (v4.0.0-beta.464) with working API token (`central-mcp` token). MCP connector exists on port 4002 with full CRUD allowlisted. But the `applications` table is empty for nexxus — no app was ever registered. The deploy.yml webhook fires into the void. **Fix:** Create Coolify application for nexxus, configure GitHub source, set build/deploy settings. PARTIALLY RESOLVED — Coolify container running, live deployed via CI/CD. Remaining: staging DB separation, production .env, monitoring. | IN | IN SPRINT (I-001) | M |
| I-216 | **GitHub Actions deploy.yml fires a dead webhook.** deploy.yml calls `${{ secrets.COOLIFY_WEBHOOK_URL }}` with `${{ secrets.COOLIFY_API_TOKEN }}` after build+test. Failure is silently eaten: `\|\| echo "Coolify webhook sent (may be async)"`. Since no Coolify app exists (I-215), the webhook has no target. **Fix:** After Coolify app is created, configure webhook URL in GitHub Secrets. Verify round-trip. PARTIALLY RESOLVED — Coolify container running, live deployed via CI/CD. Remaining: staging DB separation, production .env, monitoring. | IN | IN SPRINT (I-002) | M |
| I-217 | **Dockerfile never built.** Multi-stage Dockerfile exists and is well-written (Node 20-alpine, builder→runner). `.dockerignore` exists. `docker-compose.yml` exists. But zero Docker images for nexxus on the server (`docker images \| grep nexxus` = empty). Container has never been built or run. **Fix:** Build image, verify it runs, configure Coolify to use it. Add `pm2-runtime` as entrypoint instead of bare `node`. PARTIALLY RESOLVED — Coolify container running, live deployed via CI/CD. Remaining: staging DB separation, production .env, monitoring. | IN | IN SPRINT (I-001) | M |
| I-218 | **No separate production database.** Single Supabase instance (`aws-0-us-west-2.pooler.supabase.com`) serves both dev and live. Test data (527 orphan conversations, seed demo data) co-mingled with real customer data. **Fix:** Create separate Supabase project for STAGING (production DB stays as-is per D-001). Apply schema via drizzle-kit push (migration files are stale per W1 finding). Configure staging .env with OUTBOUND_LIVE_ENABLED=false. | IN, DT | IN SPRINT (I-002) | H |
| I-219 | **No production .env file.** Single .env file with `NODE_ENV=development` (overridden by PM2 config). Contains dev API keys shared between both domains. **Fix:** Create `.env.production` with: separate JWT_SECRET, separate ADMIN credentials, production DATABASE_URL, and evaluate which API keys need separate production accounts (Resend, TextMagic, Supabase at minimum). | IN | IN SPRINT (I-002) | M |
| I-220 | **Caddy routes both domains to same port — repoint via sysadmin.** `live.huminic.app` → localhost:5000 and `dev.huminicdev.com` → localhost:5000 in Caddy config. No environment separation. **Fix:** After Coolify deploys the production container on its own port, use sysadmin tools (not direct Caddyfile edit) to repoint `live.huminic.app` to the Coolify container port. `dev.huminicdev.com` stays on PM2 localhost:5000. Caddy config is auto-generated — all changes go through `~/Claude-store/sysadmin/` per infrastructure governance. PARTIALLY RESOLVED — Coolify container running, live deployed via CI/CD. Remaining: staging DB separation, production .env, monitoring. | IN | IN SPRINT (I-001) | M |
| I-221 | **Coolify Traefik proxy is in "exited" state.** Coolify has its own Traefik proxy for routing, but it's not running. This may need to be started for Coolify-managed deployments to get domain routing, or we use Caddy for routing and Coolify only for container management. **Investigate:** determine if Traefik needs to be running or if Caddy handles all routing. | IN | CLOSED (A-001) — Traefik stays off per D-006. Caddy is sole proxy. | M |
| I-222 | **Seed script auto-runs demo data on boot.** `server/seed.ts` creates Serra Honda demo org, test users with hardcoded passwords (`NexxusTest2026`), sample widgets. Runs automatically via `seedDatabase()` in `server/index.ts`. Production first boot will have demo data visible to real users. **Decision needed:** Add `SKIP_DEMO_SEED=true` env flag, or clean up after first boot, or accept demo data. | BE, IN | IN SPRINT (I-001) | E |
| I-223 | **No database migration automation.** 4 Drizzle migration files exist in `migrations/` but the deploy pipeline has no migration step. Migrations run implicitly via Drizzle on app start (or don't — needs verification). No rollback scripts exist (Drizzle migrations are one-way). **Fix:** Add explicit migration step to deploy pipeline. Create rollback SQL for critical migrations. Test migration against clean DB. | DT, IN | IN SPRINT (I-003) | M |
| I-224 | **No monitoring, alerting, or rollback for production.** Zero error tracking (no Sentry/etc), no uptime monitoring, no sync failure alerts (I-201 failures are invisible). No documented rollback procedure. Single PM2 process = restart = downtime. **Fix:** Add health check monitoring, error tracking, and document rollback procedure (at minimum: `pm2 deploy revert` or Docker image rollback via Coolify). | IN | IN SPRINT (I-003) | H |
| I-201 | **Investigated (T-010a). Verify in container (I-001).** Delta sync scheduler runs but has never succeeded. Only 2 log entries: both failed backfills for Huminic org (no VIN integration). Delta fires at 2 AM ET via setInterval with no retry on failure. Non-VIN orgs fail silently. **Must verify delta sync works inside Coolify container** — scheduler depends on MCP connectivity and setInterval persistence. | BE | IN SPRINT (I-001) | M |

---

## TeamBox UI

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-202 | **Root cause: data issue, not code bug.** "No messages yet" displays correctly for conversations with 0 messages. Investigated T-010a: 5 orphan ai-chat conversations (test staff from Mar 31) + voice conversations from ringing-only VAPI events have no stored messages. Real conversations with messages display correctly. **Fix:** clean up orphan test conversations — no code change needed. | FE | CLOSED (T-010a) | E |

---

## Cross-Cutting

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-125 | All popout/sub-menu links need functional verification (click-through test) | FE | NEEDS LIVE TEST | M |
| I-226 | **Container Docker healthcheck misconfigured.** Alpine image doesn't have `curl` installed. Healthcheck fails (`/bin/sh: curl: not found`), container reports "unhealthy" despite app working. Fix: add `RUN apk add --no-cache curl` to Dockerfile runner stage, or switch healthcheck to `wget --spider http://localhost:5000/api/health`. Found during I-001 verification. | IN | OPEN | E |
| I-227 | **Rate limiter IP parsing warning.** Container logs `ERR_ERL_INVALID_IP_ADDRESS` for IPs with port appended (e.g. `150.136.6.207:54874`). Caddy's `X-Forwarded-For` passes IP:port. Fix: custom `keyGenerator` in rate limiter to strip port, or adjust Caddy header. Non-blocking — rate limiting works, just logs warnings. Found during I-001 verification. | BE | OPEN | E |
| I-225 | **Pre-commit hook Gate 1.9 blocks on ALL executionSteps, including infrastructure steps.** Hook requires every step to be `completed` before committing, but hybrid sprints (like I-001) have infrastructure steps (Coolify, Caddy, DNS) that happen AFTER the code commit. Creates circular dependency: code can't be pushed until committed, can't be committed until infra steps done, infra steps need the code pushed. **Fix:** Add `type` field to executionSteps (`code` vs `infrastructure`). Gate 1.9 should only gate on `type: "code"` steps. Infrastructure steps are operator-executed outside git. Found during I-001. | GOV | OPEN (next M-series) | E |
| I-229 | **Lead notification email subject — emoji verified present.** Verified 2026-04-12: subject lines at webhooks.ts:1045 (VAPI) and :1348 (Tavus) both use `\u{1F3AF}` emoji correctly. **Remaining:** VIN Solutions status section still not in the email body. | BE | OPEN (partial — VIN status section remaining) | E |
| I-230 | **VERIFIED FIXED.** No-transcript calls now correctly skip email notification. Verified 2026-04-12: `if (hasTranscript)` guard at webhooks.ts:992 (VAPI) and :1299 (Tavus) prevents notification for ringing-only calls. Log line confirms: "Skipped email notification — no transcript". | BE | CLOSED (verified 2026-04-12) | — |
| I-231 | **Spec conflict: Executive role + Management page.** CLAUDE.md RBAC table says Executive gets "All except Management, Settings." US-025 says Executive checks Demand Score on Management page. Code follows RBAC table (correct). Test 1.8 follows user story (incorrect). Resolve: either update RBAC to allow Executive management access, or update US-025 to remove Demand Score from Executive scope. Not MVP-blocking — reclassified from PRODUCT_BUG to TEST_ISSUE. | FE, AU | STALE (post-launch) | E |
| I-232 | **Security header duplication: nosniff, nosniff.** Both Caddy and Helmet set `X-Content-Type-Options: nosniff`, resulting in doubled value. Test 12.2 fails on strict equality. Fix: disable Helmet's `noSniff` option since Caddy handles it. `server/index.ts` Helmet config. Not MVP-blocking. | IN | CLOSED (90bc228, 03dae4e) — Helmet scoped to non-widget routes | E |
| I-233 | **Widget public endpoint test fails on staging — TEST_DATA, not product bug.** Test 11.14 calls `/api/widgets/public/{widgetCode}` but no widgets seeded on staging. Endpoint code is correct. Reclassified from PRODUCT_BUG to TEST_DATA. | IN | TEST-DATA (not product bug) | E |
| I-228 | **Deploy safety gate — pre-production risk analysis system.** 3-layer automated gate: (1) CI risk analysis scans diffs for webhook/outbound/VIN/auth/schema/env changes, (2) schema safety check detects destructive drizzle-kit push ops (column drops, renames = data loss), (3) pre-deploy backup runs pg_dump before every deploy. Design complete in `safety-gate/README.md`. Full implementation specs (workflow YAML, all scripts) produced by technical-architect 2026-04-03. Implement when operator approves. | IN, BE, DT | BACKLOGGED (operator-gated) | M |
| I-234 | **captain-check.sh blocks `git checkout -b` during active sprints.** Hook classifies all non-read git commands as "git write commands" and rejects them when a sprint is `in_progress`. Branch creation (`git checkout -b`) is non-destructive and should be allowed. Current workaround: operator runs the command manually. **Fix:** Add `checkout -b` to the allowed commands list in `.claude/hooks/captain-check.sh`, alongside `status`, `log`, `diff`, `branch`, etc. | GOV | OPEN (next M-series) | E |
| I-235 | **User creation emails bypass OUTBOUND_LIVE_ENABLED kill switch.** `POST /api/users` and `POST /api/users/invite` in `server/routes/users.ts` send welcome/invite emails via Resend without checking `process.env.OUTBOUND_LIVE_ENABLED`. All other outbound channels (SMS, campaigns, outbound.ts) respect this flag. If RESEND_API_KEY is set and org CommGate is open, emails fire regardless of the global kill switch. **Fix:** Add `OUTBOUND_LIVE_ENABLED` check before sending in both routes, matching the pattern in outbound.ts. | BE | CLOSED (LAUNCH-RECON-01, dc6dcc5) | E |
| I-236 | **Webhook secrets optional.** **RESOLVED 2026-04-30** (chunk 2B). All three webhook handlers (VAPI at `server/routes/webhooks.ts:914`, Tavus at `webhooks.ts:1495`, TextMagic at `server/routes/sms.ts:158`) now reject with `503 { message: "Webhook secret not configured" }` when the corresponding `*_WEBHOOK_SECRET` env var is unset and `NODE_ENV === "production"`. In dev, accept with `console.warn` reminder per request (reinforces existing startup warnings at `server/index.ts:35-37`). | BE | RESOLVED — verified | E |
| I-237 | **Hardcoded password123 fallback in seed.ts:8.** **CLOSED — already fixed before chunk 2B.** Verified at `server/seed.ts:8`: `process.env.SEED_DEFAULT_PASSWORD || crypto.randomUUID()`. No `password123` literal anywhere in seed.ts. Issue text reflected pre-existing state superseded by an earlier commit. | BE | CLOSED — pre-fixed | E |
| I-238 | **Legacy req.body.refreshToken fallback on token refresh.** `server/routes/auth.ts:201` accepts refresh token in body (less secure than httpOnly-only). Fix: remove body fallback. **Cross-ref 2026-05-07:** confirmed at `auth.ts:201` (line off-by-one from original report) by Wave I-Auth audit; unrelated to operator's 2026-05-04 login symptom but still OPEN for cleanup. See evidence/wave-I-auth-integrity/findings.md option F. | BE | OPEN | E |
| I-239 | **Resend rate limit exhausted.** 483 failed lead notification emails in error log. Lead generation rate exceeds Resend plan limits. Fix: batch/throttle email sends or upgrade Resend plan. | BE, OPS | OPEN | M |
| I-240 | **Tavus invalid conversation_id.** 161 error log entries. Stale/test webhooks arriving with IDs Tavus rejects. Fix: filter or ignore known-stale conversation IDs. | BE | OPEN | E |
| I-241 | **Test traffic hitting production webhooks.** 140+ VAPI callback failures for 555-xxx numbers. Automated tests running against live endpoints. Fix: separate test webhook URLs or filter test phone patterns. | OPS | OPEN | E |
| I-242 | **22 dead files removable.** 18 deprecated test duplicates (`tests/e2e/deprecated/`), 3 unused components (CreditBalanceIndicator.tsx, UsageMeterBar.tsx, useFirstLogin.ts), 1 backup (drizzle.config.ts.bak). Fix: delete all. | DT | OPEN | E |
| I-243 | **CI deploy health check timeout.** **RESOLVED 2026-04-30** (chunk 3, see I-NEW-2026-04-29-D below). The new `Verify deployment` step polls for up to 10 minutes (30 × 20s) instead of the old 60s fixed sleep, with explicit success criteria (container restart confirmed via uptime regression + widget URL HTTP 200). | IN | RESOLVED — verified | M |
| I-NEW-2026-04-29-D | **deploy.yml `Verify deployment` step was buggy (`curl "${APP_BASE_URL}/"` + 60s fixed sleep) — couldn't distinguish silent-no-op from real failure.** **RESOLVED 2026-04-30** (chunk 3). Replaced with a real polling loop that captures pre-deploy `uptime` from `/api/health`, polls for up to 10 min, and confirms via two acceptance modes: normal (uptime regressed) or recovery (PRE was 0). Uses `jq -r '(.uptime // 0) \| floor'` to avoid bash int-comparator crashes on float `process.uptime()`. 7/7 simulated polling cases pass at `evidence/stabilization-sprint-2026-04-30/3/sprint/verify-simulate-output.txt`; live `/api/health` shape captured at `evidence/.../health-shape.json`. | IN | RESOLVED — verified | E |
| I-NEW-2026-04-29-F | **No deploy-failure notification.** **RESOLVED 2026-04-30** (chunk 3). New `Notify on failure` step at end of deploy job uses `if: failure()` and posts a Slack message via `SLACK_WEBHOOK_URL` secret. Gracefully no-ops if secret unset (operator can add it later without further deploy.yml edits). | IN | RESOLVED — verified | E |
| I-NEW-2026-05-01-A | **Routing redirect trap on top-level routes.** `/teambox`, `/sales`, `/insights`, `/marketing`, `/management` silently redirect away within 2–5 seconds of arrival without any operator click. Reproduced across three independent overnight Playwright walks (Lanes 5, 6, 7 of overnight-validation-2026-04-30). Affects every user; renders these surfaces unusable for sustained walk-throughs. **Confirmed sub-cause #1 (`/management`):** `client/src/pages/management.tsx:61-65` runs `if (!canAccessManagement(currentRole)) setLocation('/')`; `canAccessManagement` returns true ONLY for `super_admin` (`client/src/lib/rbac.ts:26-28`), so any `org_admin` / `partner_admin` / executive lands on `/management` and is redirected to `/`. Lane 7 metric reporter explicitly noted this gate as suspect. **Suspected sub-cause #2 (other routes):** sidebar overlay click-through — clicking a sidebar icon opens the SubMenuManager flyout AND a click registers on a panel nav item beneath the cursor (operator's hypothesis from brief). Suspect site: `client/src/components/layout/SubMenuManager.tsx:773-787` (fixed-position overlay with `pointer-events-auto` when `panelHovered`) interacting with `Sidebar.tsx:142-152` `handleClick`. **Investigation + minimal fix tracked under stabilization-sprint-2026-05-01.** Evidence: `evidence/stabilization-sprint-2026-04-30/lane-{5,6,7}-*.md` + screenshots. **CLOSED 2026-05-01:** fix `0e674a5` "fix(routing): hold AppProvider until role hydrates" merged to main via PR #6 as `becb739`; deploy run `25202377174` success at 2026-05-01T04:37:43Z; live verification GREEN at `evidence/stabilization-sprint-2026-05-01/p0-pr-merge-verification/` (curl `/api/health` 200 with version 2.2.0; Playwright walk as `serra_honda@huminic.ai`: `/teambox /sales /insights /marketing` all stayed on route; `/management` correctly RBAC-redirects to `/` per `management.tsx:60-65` + `rbac.ts:26-28`, which is the *expected* behavior for non-super_admin and is itself evidence the role-hydration fix is working). | FE | CLOSED 2026-05-01 | M |

---

## Security

Issues with security severity. Must be resolved before production launch.

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-244 | **B01 — IDOR on /api/vin/leads/summary.** Any authenticated user can pass `?orgId=<any-uuid>` to `/api/vin/leads/summary` and receive that org's lead data. No role check. Classic IDOR vulnerability. File: `server/vendorProxy.ts:555`. Fix: if user.roleLevel > 2 (org_admin), enforce `orgId === req.user.organizationId`. | AU, BE | OPEN | E |
| I-245 | **B02 — AI system prompt writable by org_admin via URL bypass.** AI Configuration settings tile is hidden in UI for org_admin, but the PATCH /api/settings/org endpoint uses requireRole(3), allowing org_admin to overwrite the system prompt and chat instructions by navigating directly to /settings?section=ai. File: `server/routes/settings.ts`. Fix: raise requireRole to 2 for AI config fields, or strip those fields from org_admin requests. | AU, BE | OPEN | E |
| I-246 | **B22 — Role dropdown exposes all 8 roles to org_admin (privilege escalation risk).** When creating/editing users, org_admin sees all role options including super_admin and partner_admin. No server-side restriction on role assignment. Files: `client/src/pages/settings.tsx`, `server/routes/users.ts`. Fix: server-side — prevent org_admin from assigning roles with roleLevel < 3. UI: filter role dropdown to org_admin's own level and below. | AU, BE, FE | OPEN | M |
| I-247 | **B29 — Org slug writable via API PATCH — silently breaks widget embeds.** PATCH /api/organizations/:id uses createInsertSchema which allows any org column including slug. An org_admin changing their slug would break all widget embed codes and landing page URLs immediately with no warning. File: `server/routes/organizations.ts:212`. Fix: remove slug from updateOrganizationSchema (omit it). | AU, BE | OPEN | E |
| I-248 | **B30 — Invalid timezone string silently crashes outbound gate.** **RESOLVED 2026-04-30** (chunk 2A, commit pending). `isWithinBusinessHours` in `server/outbound.ts` now uses `Intl.DateTimeFormat` with try/catch fallback to `America/New_York` and `hour=24` normalization (mirrors `getLocalTimeInTz` in scheduler.ts). `businessHoursStart`/`End` validated as integers in 0-23/0-24 with default fallback. Function exported for unit testing. 9 new unit tests in `tests/unit/businessHours.test.ts` verify `Number.isFinite(currentHour)` for any TZ string. | BE | RESOLVED — verified | E |
| I-249 | **B31 — Self-deactivation: no server check, no reactivation path in UI.** An org_admin can deactivate themselves via user management UI. No server-side check prevents it. Once deactivated, no reactivation button exists — only a super_admin could fix it. Files: `server/routes/users.ts` (PATCH /api/users/:id), `client/src/pages/settings.tsx`. Fix: server-side check — prevent req.user.id === req.params.id with isActive: false. UI: disable deactivate button for current user. | AU, BE, FE | OPEN | E |

---

## Bugs

New bugs discovered during SNP-001 research audit (2026-04-08).

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-250 | **B03 — CommGate silent drop: human TeamBox reply appears sent but customer never receives it.** When CommGate is disabled (outboundEnabled=false or smsEnabled=false), processOutboundSend returns "blocked". But conversations.ts still returns 201 and stores the message. UI shows the message as sent but the customer never receives it — no error signal shown in-chat. File: `server/routes/conversations.ts:253-278`. Fix: check CommGate result before returning 201; return appropriate error or warning to frontend when message is blocked. | BE, FE | OPEN | M |
| I-251 | **VERIFIED FIXED.** VIN lead source now configured per org in `org.settings.vinLeadSourceName`. Serra Honda/Nissan/Ford = "Dealers WebSite", Hyundai of Columbia = "Dealer .Com (Our Website)", Ford of Columbia = "Dealer Website". Code reads from org settings with fallback to "Dealers WebSite". Verified in DB 2026-04-12. | BE | CLOSED (data fix 2026-04-12) | — |
| I-252 | **B05 — Widget chat unbounded message history causes context overflow.** **RESOLVED 2026-04-30** (chunk 2A). `existingMessages.slice(-20)` added at `server/routes/public.ts:317` (matches chat.ts:124 pattern). | BE | RESOLVED — verified | E |
| I-253 | **B06 — JSON.parse unguarded in hunchService and webhooks.** **RESOLVED 2026-04-30** (chunk 2A). Both `JSON.parse` calls now wrapped in try/catch: `server/services/hunchService.ts:73-83` (returns `[]` on failure, next scheduled run retries) and `server/routes/webhooks.ts:75-93` (returns `null`, falls through to existing null handling). Logs a warning identifying JSON-parse as the cause. | BE | RESOLVED — verified | E |
| I-254 | **B07 — AI race condition: AI can fire after human takeover.** **RESOLVED 2026-04-30** (chunk 2A). Added a fresh `storage.getConversation(conversation.id)` re-check immediately before `processOutboundSend` at `server/routes/sms.ts:661-669`. If `assignedTo` is set at that point, the IIFE returns and no AI SMS is sent. Targeted unit test gap filed as I-NEW-2026-04-30-C. | BE | RESOLVED — verified | M |
| I-255 | **B08 — No "Return to AI" button after human takeover.** After a human takes over a conversation, there is no explicit "Return to AI" button. The only way to restore AI is to select "Unassigned" from the assignment dropdown, which is non-obvious. Conversations silently stay in human mode indefinitely. File: `client/src/pages/teambox.tsx`. Fix: add a "Return to AI" button in the takeover UI that sets assignedTo=null. | FE | OPEN | E |
| I-256 | **B09 — Deleted agent with active conversations causes silent AI outage.** **RESOLVED 2026-04-30** (chunk 2B). When `getAgents()` returns no active SMS-capable AI agent, `server/routes/sms.ts:605-622` now logs a `console.warn` AND writes an `activity_log` row with action `sms_ai_no_active_agent`, entity_type `conversation`, entity_id `conversation.id`, and metadata `{ customerPhone, reason: "no_active_sms_agent" }`. Org admins can detect the misconfiguration via the audit log; customers texting in still get no AI reply but the operator is no longer flying blind. | BE | RESOLVED — verified | E |
| I-257 | **B10 — Widget video window.open has no dimensions — browser may open small window.** window.open('about:blank', '_blank') without a features string lets the browser decide the window size, which can be small on some browser/OS combinations. The Tavus video session inside that window will be cramped. File: `client/src/pages/widget-landing.tsx:114,333`. Fix: add 'width=1280,height=800,resizable=yes' to both window.open calls. | FE | OPEN | E |
| I-258 | **B11 — Win rate denominator includes bad/duplicate/service leads.** conversionRate = soldCount / totalLeads where totalLeads includes bad, duplicate, service, and unknown-status leads. Industry standard: sold / (sold + lost). Current formula shows ~10-15% when actual close rate may be 60-70%. Files: `server/routes/insights.ts`, `client/src/pages/insights.tsx`. Fix: change denominator to soldCount + lostCount (or guard with minimum sample size). | BE, FE | CLOSED (LAUNCH-RECON-01) | M |
| I-259 | **B12 — "Hot Leads" metric label is wrong — shows all active leads.** hotCount = isActiveLead() which matches ACTIVE_APPOINTMENT_SET, ACTIVE_REVISIT, ACTIVE_WAITING_FOR_PROSPECT_RESPONSE, etc. These are not "hot" leads. Files: `server/routes/insights.ts`, `client/src/pages/insights.tsx`. Fix: rename label from "Hot Leads" to "Active Leads". | FE, BE | CLOSED (LAUNCH-RECON-01) | E |
| I-260 | **B13 — lib-21 Avg Time to First Contact hardcoded to "—".** The lib-21 metric value is hardcoded as a dash string. The tile never shows a real number. The drill-down exists but is unreachable without a computed value. File: `client/src/pages/insights.tsx` (~line 1160). Fix: compute average days between vinCreatedAt and first conversation match. | BE, FE | OPEN | M |
| I-261 | **B14 — Channel metrics near-zero for all VinSolutions orgs.** Walk-In, Phone, Referral channel classifications use string matching ("walk", "phone", "referral") against raw leadSource values. VinSolutions stores sources as API URLs (e.g. https://api.vinsolutions.com/leadsources/id/7098). All URL-format sources go to "Website" or "Other". Walk-In/Phone/Referral show 0 for virtually every VinSolutions org. Files: `server/routes/insights.ts`, `client/src/pages/insights.tsx`. Fix: resolve leadSource IDs to human-readable names during sync, or map numeric IDs in deriveChannel(). | BE, DT | DEFERRED (post-launch) — requires leadSource URL resolution in sync | H |
| I-262 | **B15 — Showroom Not Closed includes resolved (lost) leads.** The showroomNotClosed query includes LOST_* leads. A lead that visited the showroom and was lost is not "not closed" — it's resolved. File: `server/routes/insights.ts`. Fix: add !isLostLead() filter to showroomNotClosed. | BE | CLOSED (LAUNCH-RECON-01) | E |
| I-263 | **B16 — super_admin pipeline tiles always show Huminic data, ignore org-switch.** All metric APIs use req.user.organizationId from JWT. When super_admin switches org in the UI, the displayed org name changes but all metric tiles still show Huminic's data. Data and label are out of sync. Files: `server/routes/metrics.ts`. Fix: added resolveMetricOrgId() helper that honors ?orgId query param for super_admin/partner_admin (roleLevel <= 2). | BE | CLOSED (LAUNCH-RECON-01) | M |
| I-264 | **B17 — Open Escalations counter has no time window — never ages out.** Open Escalations queries all-time open tasks of type escalation/unsent_message. Old tasks from months ago inflate the counter indefinitely. File: `server/storage.ts` (getPipelineMetrics). Fix: added 90-day window filter (gte createdAt). | BE | CLOSED (LAUNCH-RECON-01) | E |
| I-265 | **B18 — Monthly target hardcoded to 50 for all orgs.** Pipeline coverage and month-end gap calculations use a hardcoded target of 50. Every org sees "target: 50" regardless of their actual goals. File: `client/src/pages/insights.tsx`. Fix: add per-org monthlyTarget to org settings; default 50 if not set. | BE, FE, DT | DEFERRED (post-launch) — 50 is a reasonable default | M |
| I-266 | **B19 — Active Pipeline shows different values on Main vs Sales page.** Main page uses 14-day window for Active Pipeline. Sales page falls back to a 30-day window value. Same label, different numbers on different pages. Files: `client/src/pages/sales.tsx`. Fix: removed 30-day fallback, Sales now uses only 14-day pipeline metric (matching Main). | FE | CLOSED (LAUNCH-RECON-01) | E |
| I-267 | **B20 — Engagement Transition metric always near 100% (meaningless).** lib-20 counts any active lead where vinUpdatedAt > vinCreatedAt as "engaged." This is virtually every lead ever touched (any status change updates vinUpdatedAt). The metric is always 95%+. File: `server/routes/insights.ts` (lib-20). Fix: changed to show N/A until a better engagement signal is implemented. | BE | DEFERRED (post-launch) — shows N/A, needs better engagement signal | M |
| I-268 | **B21 — Service metrics silently fall back to all-department totals.** When byDepartment.service is null (no service campaigns), service metric tiles fall back to cross-department totals. A service manager sees inflated numbers that include sales activity. File: `client/src/pages/service.tsx:104-111`. Fix: removed cross-department fallback; shows 0 for counts and N/A for reply rate when no service data. | FE | CLOSED (LAUNCH-RECON-01) | E |
| I-269 | **B23 — {{dealershipName}} placeholder never substituted in agent instructions.** **RESOLVED 2026-04-30** (chunk 2B). `server/routes/chat.ts:168` had been fixed earlier via `substituteOrgContext`; the SMS auto-reply path was the remaining gap. `server/routes/sms.ts:614-618` now imports `substituteOrgContext` from `lib/templateSubstitute` and applies it to `agent.instructions` before building the system prompt. Claude no longer sees literal `{{dealershipName}}` in the SMS path. Other placeholders (`{{customerName}}`, `{{agentName}}`) intentionally left un-substituted at this layer to match the chat.ts pattern. | BE | RESOLVED — verified | E |

---

## Summary

| Status | Count |
|--------|-------|
| OPEN | 16 |
| OPEN (Security — I-244 through I-249) | 6 |
| OPEN (Bugs — I-250 through I-269) | 9 |
| OPEN (Triggers — I-275, I-276) | 2 |
| DEFERRED (post-launch) | 3 (I-261, I-265, I-267) |
| POST-LAUNCH | 1 (I-278) |
| IN SPRINT (I-001) | 6 |
| IN SPRINT (I-002) | 3 |
| IN SPRINT (I-003) | 2 |
| CLOSED | 21 |
| NEEDS LIVE TEST | 8 |
| BACKLOGGED | 8 |
| TEST-ONLY (not product bug) | 11 |
| TEST-DATA (not product bug) | 1 (I-233) |
| STALE (post-launch) | 1 (I-231) |
| BEHAVIORAL GAPS (T-007) | 11 |
| TEST COVERAGE GAPS | 4 |
| INCIDENTS | 1 (INC-001) |
| **Total active (OPEN + Security + Bugs + Triggers)** | **33** |

**Last updated:** 2026-04-13 (LAUNCH-RECON-01 reclassification — 13 closed, 11 test-only, infra partially resolved)

---

## Trigger Service (new — LAUNCH-STABILIZE)

| ID | Issue | Dim | Status | Effort |
|----|-------|-----|--------|--------|
| I-272 | **After-hours trigger bypasses TCPA business hours gate.** `bypassBusinessHours: true` was added to `processOutboundSend()` for the after-hours trigger at `server/services/triggerService.ts:276`. This allows SMS sends outside the 8 AM - 9 PM TCPA window. **Must be removed.** After-hours trigger should detect leads arriving after hours but QUEUE the send for the next business hours window (8 AM org timezone). File: `server/services/triggerService.ts`, `server/outbound.ts`. | BE | CLOSED (LAUNCH-RECON-01, 8acc270) | M |
| I-273 | **Trigger dedup tag visible in customer SMS.** The `[trigger:after_hours_followup]` and `[trigger:24h_checkin]` tags are appended to the SMS message body and visible to customers. Should be tracked in outbound_log metadata, not in the message text. File: `server/services/triggerService.ts` lines 265 and 390. | BE | CLOSED (LAUNCH-RECON-01, 8acc270) | E |
| I-274 | **Trigger service has no test-mode whitelist.** When `triggersEnabled=true` for an org, the trigger fires for ALL qualifying leads. No way to restrict to specific test phone numbers. Fix: add `triggerTestPhones` array to org settings; if set, only send to those numbers. File: `server/services/triggerService.ts`. | BE | CLOSED (LAUNCH-RECON-01, 8acc270) | E |
| I-275 | **VIN sync contact resolution limited to 10 per cycle.** `resolveLeadContacts()` in `server/sync.ts` caps at 10 contact fetches per sync cycle to avoid rate limiting. For orgs with many new leads, full contact resolution may take multiple sync cycles. Consider increasing or making configurable. | BE | OPEN | E |
| I-276 | **VIN sync stores leadSource as raw API URL.** `transformVinLead()` stores `raw.leadSource` which is often a URL like `https://api.vinsolutions.com/leadsources/id/7098`. Channel classification in insights.ts uses string matching against human-readable names. Fix: resolve leadSource URLs to names during sync using `vin_list_lead_sources`. Related to I-261. | BE, DT | OPEN | H |
| I-279 | **vin_get_lead_sources returns only a subset of lead sources.** For Ford of Columbia, 15 of 49 distinct source IDs referenced by this week's leads are resolved — missing includes ID 7098 (top source, 122 leads). For Hyundai of Columbia: 20/61 resolved. Serra Honda: 16/30. Serra Nissan: 0/26. Tony Serra Ford: 20/23. Tried `limit:200, pageSize:200` — response `count: 15`. Hypotheses: (a) VIN API only returns currently-active sources and older/deactivated sources aren't surfaced; (b) undocumented MCP or VIN API filter. Until resolved, weekly report falls back to "VIN Source #{id}" for unresolved entries and flags via `sourceResolutionFailed`. Investigation needed with VIN Solutions or central-mcp maintainer. | BE, DATA | OPEN | M |

---

## Incidents

| ID | Date | Description | Impact | Remediation |
|----|------|-------------|--------|-------------|
| INC-001 | 2026-04-12 22:00 ET | After-hours trigger sent SMS to 7 real Serra Honda customers at 10 PM. Agent (Claude) enabled production triggers without test-mode scoping, then built a TCPA bypass to make the after-hours trigger work. | 7 customers received unsolicited after-hours SMS. Apology required in the morning. | (1) Triggers disabled for Serra Honda. (2) Apology SMS to be sent during business hours April 13. (3) Remove TCPA bypass (I-272). (4) Add test-mode whitelist (I-274). (5) Remove dedup tag from message (I-273). See `tasks.md` for recipient list and apology message. |

---

## Test Coverage Gaps (pre-T-007)

| ID | Gap | Dim | Status |
|----|-----|-----|--------|
| TG-004 | Opt-out/STOP handling — no test | BE | OPEN |
| TG-008 | After-hours behavior — no time-based test | BE | OPEN |
| TG-010 | TeamBox real-time updates — no SSE/WebSocket test | FE, BE | OPEN |
| TI-018 | Photo Studio image generation — see I-102 | BE | OPEN |

---

## Behavioral Gap Analysis (T-007, 2026-04-01)

Gaps found by reading actual test code at behavior level. Each gap represents something a real user could hit that no current test would catch. Tests would falsely pass while the behavior is broken.

### Critical — Would affect users immediately

| ID | Gap | Domain | Dim | Why it matters | Tests falsely pass? |
|----|-----|--------|-----|----------------|---------------------|
| I-203 | **No test for message streaming delivery to UI.** Chat agent tests verify the SSE endpoint accepts requests (status < 500) but never check that streamed tokens actually render in the browser. A broken streaming parser would pass all tests. | Chat | FE, BE | Users send a message and see nothing — the core product experience. | Yes — endpoint returns 200 but UI could show blank. |
| I-204 | **No test for session timeout warning or auto-logout.** Auth tests explicitly SKIP session timeout (TC-AUTH-102-108) because it requires 30min idle. Users would get silently logged out with no warning dialog. Feature exists (I-153 confirmed fixed) but is untested. | Auth | FE | User loses unsaved work after 30min idle with no warning. | Yes — login/logout tests pass but timeout path untested. |
| I-205 | **No test for campaign execution workflow.** Service tests verify campaign table renders and CRUD API works, but no test starts a campaign, schedules it, executes it, and verifies messages are sent. Campaign could fail silently mid-execution. | Service | BE, FE | Dealer creates campaign → nothing happens. Core revenue feature. | Yes — CRUD passes but execution path untested. |
| I-206 | **No test for conversation takeover sequence.** TeamBox tests verify the PATCH endpoint for assigning agents, but no test covers the full workflow: AI is responding → human clicks takeover → AI stops → human replies → customer sees human response. The stateful transition is untested. | TeamBox | FE, BE | Agent takeover fails mid-conversation. Customer gets confused responses. | Partially — API PATCH works but UI workflow untested. |
| I-207 | **No test for API error recovery or network failure.** Dashboard, Sales, Service, Marketing tests all assume API calls succeed. No test intercepts a failed API call and verifies the UI shows an error state, retry button, or cached data. Tests would pass while users see blank pages on flaky connections. | All | FE | Any API hiccup → blank screen, no error message, no retry. | Yes — happy path passes, error path untested. |

### Important — Would affect specific workflows

| ID | Gap | Domain | Dim | Why it matters | Tests falsely pass? |
|----|-----|--------|-----|----------------|---------------------|
| I-208 | **No test for settings changes persisting across sessions.** Settings tests verify UI elements exist and toggles click, but no test changes a setting, reloads the page, and confirms the change stuck. Appearance theme toggle is tested within a session but not across reload. Org config save is API-tested but not verified in UI after reload. | Settings | FE, BE | Admin changes timezone/logo/config → appears saved → reverts on reload. | Yes — toggle test passes within session. |
| I-209 | **No test for webhook retry or failure recovery.** Integration tests verify webhooks accept valid payloads (200) and reject invalid ones (400/401). No test covers what happens when the webhook handler itself fails mid-processing (DB write fails, MCP call times out). No retry logic is tested. | Integrations | BE | VAPI call comes in, webhook crashes after creating conversation but before storing transcript. Data partially written. | Yes — happy path passes, partial failure untested. |
| I-210 | **No test for multi-step sales pipeline progression.** Sales tests verify KPI tiles render and API returns lead counts, but no test creates a lead, moves it through stages (New → Contacted → Qualified → Proposal → Closed), and verifies metrics update. The pipeline could be display-only with broken state transitions. | Sales | BE, FE | Sales rep marks deal as "Closed Won" → pipeline metrics don't update. | Yes — read-only API tests pass, state mutation untested. |
| I-211 | **No test for concurrent write conflicts.** Edge case tests verify parallel reads succeed, but no test covers two users editing the same conversation, appointment, or contact simultaneously. The app uses no optimistic locking. First-write-wins or last-write-wins behavior is undefined and untested. | All | BE | Two agents claim same lead → one's notes overwritten silently. | Yes — single-user CRUD passes, multi-user conflict untested. |
| I-212 | **No test for data correctness beyond schema.** Dashboard and Sales tests verify API responses have correct field names and types (totalLeads is a number), but no test verifies the NUMBER IS CORRECT. Pipeline metrics could return stale cached values, double-counted leads, or zero for active dealers. | Dashboard, Sales | BE, DT | KPIs show wrong numbers. Dealer sees "0 leads" when they have 50. | Yes — schema validation passes, value correctness untested. |

### Nice-to-have — Edge cases with lower probability

| ID | Gap | Domain | Dim | Why it matters | Tests falsely pass? |
|----|-----|--------|-----|----------------|---------------------|
| I-213 | **No test for widget embed in third-party sites.** Widget tests verify /w/{id} loads directly, but no test embeds the widget iframe/script in an external page and verifies it renders correctly with cross-origin restrictions. CORS is tested at the header level but not the actual embed experience. | Widgets | FE, IN | Widget works on dev.huminicdev.com but breaks when embedded on dealer's actual website. | Yes — direct load passes, cross-origin embed untested. |

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

---

## Emergency Demo Remediation — 2026-04-08

Items addressed during emergency demo prep session. These require proper follow-up post-demo.

---

### EDR-01: Resend Rate Limiting — Email Notifications Failing
**Status:** Partially fixed (batched recipients into one call per notification)
**Root cause:** Per-recipient loop in `sendLeadNotificationEmail` (webhooks.ts ~line 261) was sending N separate Resend API calls per call notification. With `duane.wells@huminic.ai` as super_admin included in ALL 6 org notification lists, free plan (100 emails/day) was exceeded on active testing days.
**Emergency fix:** Changed loop to single batched `callMCP("resend_send_email", { to: recipients[] })` call.
**Follow-up required:**
- Upgrade Resend plan to remove daily cap (production traffic will exceed 100/day easily)
- Review whether super_admin should receive notifications for all orgs or only their primary org
- Add email delivery monitoring/alerting so failures are visible in the app

---

### EDR-02: VIN Solutions Push — 37 Conversations Not Synced Since Saturday
**Status:** PENDING — do not push without operator review
**Detail:** 37 conversations since April 5 have no matching warehouse_lead (none in VIN Solutions). Many are test/internal, but real voice calls exist:
- Serra Honda: ~5 real calls
- Serra Nissan: ~4 real calls
- Hyundai of Columbia: ~4 real calls
- Ford of Columbia: ~2 real calls
**Action:** Operator to review `leads-report-since-saturday.csv` (project root), identify real customer calls, and authorize bulk push via vin-safe-mcp.
**Script:** Check `.governor/do-commit.sh` or server scripts for existing bulk VIN push utility.

---

### EDR-03: Governance Hooks Disabled
**Status:** MUST RE-ENABLE after demo
**Disabled hooks:**
- `~/.claude/hooks/sprint-gate.sh`
- `~/.claude/hooks/plan-protection.sh`
- `~/.claude/hooks/commit-gate.sh`
- `.claude/hooks/captain-check.sh`
- `.claude/hooks/template-validator.sh`
**Command to re-enable:**
```bash
chmod +x ~/.claude/hooks/sprint-gate.sh ~/.claude/hooks/plan-protection.sh ~/.claude/hooks/commit-gate.sh /home/ubuntu/Claude-store/nexxus2.2_replit/.claude/hooks/captain-check.sh ~/.claude/hooks/template-validator.sh
```

---

### EDR-04: Code Changes Not Committed to Git
**Status:** MUST COMMIT post-demo
**Modified files (uncommitted):**
- `client/src/pages/teambox.tsx` — Push to VIN button, auto-scroll fix, color/theme fixes, message list Today label, phone log limit
- `server/routes/conversations.ts` — POST /api/conversations/:id/push-to-vin endpoint
- `server/routes/webhooks.ts` — Email batching fix
- `server/sync.ts` — 15-min VIN delta sync interval
- `client/src/pages/service.tsx` — Campaign Safety block removed
- `client/src/pages/marketing.tsx` — Zero-state campaign data handling
- `client/src/contexts/AuthContext.tsx` — Org switch user state update
- `client/src/components/layout/TopBar.tsx` — Org switch resetQueries
**Action:** Re-enable hooks first, then commit each file to a proper sprint.

---

### EDR-05: 15-Minute VIN Sync — API Load Not Monitored
**Status:** Running in production (added to sync.ts quickDeltaInterval)
**Risk:** Runs every 15 minutes for ALL active VIN Solutions orgs. VIN API rate limits unknown. Monitor post-demo for errors.
**Follow-up:** Add exponential backoff, per-org rate limit tracking, and alerting if sync consistently fails.

---

### EDR-06: Phone Log — Date Filter Not Implemented
**Status:** Partial fix (limit increased to 100 records)
**Intended:** 30-day lookback
**Actual:** Returns up to 100 most recent VAPI calls (no date filter)
**Follow-up:** Check if VAPI MCP tool supports `createdAtGt` date parameter; add proper date filter to `/api/vapi/calls` endpoint.

---

### EDR-07: Marketing Dashboard — Campaign Data Placeholder
**Status:** Emergency fix applied (shows "No campaign data yet" when no campaigns)
**Intended:** Show actual Insights metrics on Marketing dashboard
**Follow-up:** Wire Marketing dashboard to pull from the same data source as the Insights page, or redirect Marketing to Insights view for orgs with no campaigns.

---

### EDR-08: Nancy Gaston — vapiPhoneNumberId UUID Not Set
**Status:** Partial fix
**Fixed:** `vapi_assistant_id` and `assigned_phone` (human-readable) updated in DB.
**Uncertain:** If a separate `vapi_phone_number_id` UUID column exists (check schema), it needs to be set to `5b465fde-e294-4fb5-a8c4-dfb02cc53b61` (SERRA SERVICE phone UUID).
**Follow-up:** Verify Nancy Gaston functions correctly for inbound service calls in VAPI.

---

### EDR-09: Org Switch — resetQueries Edge Cases
**Status:** Emergency fix applied (replaced invalidateQueries with resetQueries)
**Risk:** resetQueries clears all cached data simultaneously, which may cause brief loading states across all components. Needs proper testing across all pages/roles.
**Follow-up:** Implement proper org context switching with targeted query invalidation and optimistic UI updates.

---

### EDR-10: Auto-Scroll — Streaming Responses Not Covered
**Status:** Emergency fix applied (bottom sentinel div + scrollIntoView)
**Gap:** The scroll fires on `messages` array change. During streaming AI responses, the message content grows but the array length doesn't change until the stream ends. Scroll may lag during long streaming responses.
**Follow-up:** Add scroll trigger on streaming content change, not just message count.

---

### EDR-11: Push to VIN Endpoint — End-to-End Not Fully Verified
**Status:** User tested button, success toast shown. VIN creation not independently verified.
**Risk:** Dynamic import of vendorProxy in conversations.ts may cause runtime issues.
**Follow-up:** Verify lead was actually created in VIN Solutions CRM. Check server logs for the push-to-vin call. Convert dynamic import to static if any runtime errors occur.

---

### EDR-12: RBAC — Customer Demo Account Not Created
**Status:** Pending
**Needed:** Partner admin login + customer-facing account for Serra Honda demo.
**Recommended:** org_admin role for Serra Honda with Campaigns, Insights, Agent Config, and Billing tabs hidden.
**Follow-up:** Create accounts and implement tab-level RBAC hiding per role.

---

*Section written: 2026-04-08. All items require proper sprint registration and ghost gate review before post-demo resolution.*

---

### I-NEW-2026-04-27-A: VAPI phone+window dedup miss when number format changes between events
**Discovered:** 2026-04-27 by audit script `evidence/I-NEW-2026-04-26-D/audit-route-dedup.ts` Scenario D (probe), during the Codex VAPI review-note follow-up dispatch.
**Status:** OPEN — out of scope for the Codex review-note fix.
**Severity:** Low (real-world VAPI sends `customer.number` in a stable E.164 format; cross-format mixes within one call are not observed in production logs to date).
**Code:** `server/routes/webhooks.ts:1101` — `customerPhone.replace(/\D/g, "")` (read site, dedup lookup) and `server/routes/webhooks.ts:1150` (matching write site). Line numbers post-`0d9d683`.
**Behavior:** The route's phone normalization strips non-digits but does NOT collapse the leading "1" on US numbers. Strings `"+14805550606"` and `"14805550606"` both normalize to `"14805550606"` (11 digits) and dedup correctly against each other. `"(480) 555-0606"` normalizes to `"4805550606"` (10 digits) and produces a different dedup key, so it does NOT dedup against the first two.
**Impact if hit:** Two conversation rows for one physical call. Same orphan-class symptom as `I-NEW-2026-04-26-D` but via a different mechanism.
**Compare:** `server/storage.ts:431` (`getConversationByPhone`) already handles the leading-1 case with explicit conditions on `with1`/`without1`/`+with1` variants. The webhook-route dedup map does not.
**Follow-up:** Apply the same digits-only-with-leading-1-stripped normalization in the route's `phoneKey` construction, or extract a shared `normalizeUsPhoneForDedup()` helper so route + storage agree. Add a regression test covering the 10-vs-11-digit pair.
**Trace:** `evidence/I-NEW-2026-04-26-D/audit-route-dedup-trace.txt` Scenario D.

---

### I-NEW-2026-05-10-E-ADMINEMAIL-NORM: Org-create path `adminEmail` not normalized (AUTH-D parity gap)
**Discovered:** Wave 9-Sec wave-end verification 2026-05-10 by integration-safety.
**Status:** OPEN — deferred to v2.3 (NOT in Wave 9-Sec scope; non-blocking gap, admin-only path, not a public regression vector).
**Severity:** LOW (admin-only call site; only super_admin/partner_admin create orgs).
**Code:** `server/routes/organizations.ts:255` — org-create path does NOT call `normalizeEmailForLookup` on the inbound `adminEmail` field.
**Behavior:** Wave 9-Sec S3 normalized email at forgot-password, signup, and invite paths. The org-create path that provisions an org's initial admin email was missed. If an org is created with `adminEmail: "Caroline@Serra-Honda.com"`, the resulting admin user could have a mixed-case email row that subsequent lookups (login, forgot-password) miss. Same root cause as AUTH-D; same fix shape (one call to `normalizeEmailForLookup`).
**Recommended fix shape:** `const adminEmail = normalizeEmailForLookup(req.body?.adminEmail);` before user creation at `organizations.ts:255` area. One-line + test.
**Why deferred:** admin-only path (super_admin or partner_admin invokes org creation); not a public regression vector during launch week; symptom only surfaces if an admin types mixed-case during initial org provisioning AND the resulting user later forgets their password. v2.3 batch with the other AUTH-G/H/I polish.
**Trace:** integration-safety wave-end verification verdict 2026-05-10; flagged via grep audit of `normalizeEmailForLookup` consumers.

---

### I-NEW-2026-05-10-D-SELF-ROLE: Self-role-change in PATCH /api/users/:id (sibling of I-249)
**Discovered:** Wave 9-Sec S5 implementation 2026-05-10 by harness-backend during I-249 self-deactivation fix.
**Status:** OPEN — deferred to v2.3 (NOT in Wave 9-Sec scope per operator's "no silent scope expansion" rule).
**Severity:** MEDIUM (mirrors I-249 — same handler, same self-mutation class).
**Code:** `server/routes/users.ts:197-204` — PATCH /api/users/:id handler accepts `req.body.roleId` for the actor's own user record.
**Behavior:** A super_admin can demote themselves to org_admin and lose escalation paths; an org_admin (level 3) is bounded by `canAssignRole` so can't escalate, but CAN demote themselves to a lower role and lose admin access. Same self-mutation class as I-249 (self-deactivation) which was fixed in Wave 9-Sec S5 (`5a1b0c5`).
**Recommended fix shape:** extend `server/lib/selfModifyGuard.ts` with `isSelfRoleChangeAttempt(actor, params, body): boolean` and add a parallel guard at the same call site as the I-249 check, returning 400 with "Cannot change your own role. Ask another admin." (Or: bundle the two self-mutation guards into one `isSelfPrivilegeMutation` predicate covering both fields.)
**Trace:** Wave 9-Sec S5 builder return message 2026-05-10; flagged but not fixed per orchestrator's scope discipline. See `evidence/wave-9-Sec-triage/wave-bookend.md` Phase 2 amendment for the original 5-chunk scope.

---

### I-NEW-2026-05-10-A: Marketing Market Intel agent — `GOOGLE_MAPS_API_KEY` missing in dev env (silently masked by mock fallback)
**Discovered:** Wave 3B Phase 1 investigation 2026-05-10 by qa-evaluator.
**Status:** OPEN — non-blocking for v2.2 launch.
**Severity:** Low (silently masked: agent renders mock data when key absent).
**Symptom:** `POST /api/maps-proxy` returns HTTP 503 when invoked. Marketing "Market Intel" agent's client falls back to mock data, so the user sees a working agent but the data is not real.
**Root cause:** `GOOGLE_MAPS_API_KEY` not set on dev pm2 environment; the proxy route returns 503 in that branch instead of erroring loudly.
**Recommendation:** Either (a) provision the key on dev (operator action) and surface a real "no map data available" state when invocation fails, or (b) document the mock-fallback as intentional for v2.2 and revisit in v2.3.
**Out of Wave 3B scope:** Operator-reported regression was the primary chat path (Anthropic/OpenAI), which is now fixed. Market Intel is a secondary surface and not the operator's reported bug.
**Reference:** `evidence/wave-3B-marketing-agent-fix/investigation/root-cause-hypothesis.md`

---

### I-NEW-2026-05-10-B: `/api/maps-proxy` body-shape mismatch (separate from missing key)
**Discovered:** Wave 3B Phase 1 investigation 2026-05-10 by qa-evaluator.
**Status:** OPEN — non-blocking for v2.2 launch.
**Severity:** Low (compounded by I-NEW-2026-05-10-A — until the key is set, this never surfaces).
**Symptom:** Once `GOOGLE_MAPS_API_KEY` is set, the proxy route's expected request body shape and the client's outbound shape diverge, producing a different failure mode than the simple 503-without-key.
**Root cause:** TBD on triage. Either the client sends a payload format the proxy doesn't accept, or the proxy forwards a payload format Google Maps API doesn't accept.
**Out of Wave 3B scope:** Same rationale as I-NEW-2026-05-10-A.
**Reference:** `evidence/wave-3B-marketing-agent-fix/investigation/root-cause-hypothesis.md`

---

### I-NEW-2026-04-27-C: Add `jti` nonce to refresh JWT payload (defense-in-depth for token-rotation race)
**Discovered:** 2026-04-27 during Priority #3 fix (refresh-token rotation race; see `evidence/priority-3-hard-reload-auth/investigation.md`).
**Status:** OPEN — operator-deferred to v2.3 backlog.
**Severity:** Low post-fix (the race is now caught and handled gracefully via the unique-violation fallback in `server/lib/refreshTokenRotation.ts`). Pre-fix this was the launch-blocker for hard-reload auth.
**Code:** `server/auth.ts:73-75` (`generateRefreshToken`) — JWT payload is `{ userId, organizationId, roleId, type: 'refresh' }` only. `iat` is integer seconds (per JWT spec). Two refresh tokens minted in the same second with identical payload are byte-identical strings, which trips the `sessions.refresh_token` UNIQUE constraint when two parallel requests race to insert.
**Behavior:** The current Priority #3 fix detects the unique-violation (Postgres SQLSTATE 23505) and falls back to the peer's just-created session row (`getMostRecentSessionForUser` within `RECENT_SESSION_WINDOW_MS = 10_000`). This is correct and ships as the launch fix.
**Defense-in-depth proposal:** Add `jti: crypto.randomUUID()` to the refresh JWT payload at mint time. With a per-token nonce, two simultaneous mints CANNOT produce identical strings — the race becomes impossible by construction rather than handled after the fact.
**Why deferred:** Adds a JWT-shape change. Existing in-flight refresh tokens issued by older code do not have the `jti` claim — verification must continue to accept tokens with or without it (forward-compat only). Worth doing carefully post-launch, not as a launch hot-fix.
**Follow-up:** v2.3 backlog. Implementation: extend `TokenPayload` type in `server/auth.ts`, add `jti` only to `generateRefreshToken` (access tokens don't need it — they're not stored), drop a small unit test that two back-to-back refresh JWTs are non-identical.
**Compare:** `server/lib/refreshTokenRotation.ts` — handles the race; `server/auth.ts:73-75` — where the nonce would be added.

---

### I-NEW-2026-05-12-A-TESTLANE-LIVE: `TESTLANE_MODE` suspected `true` on live Coolify container
**Discovered:** 2026-05-12 recon side-sprint (qa-evaluator + integration-safety). Reference: `evidence/recon-2026-05-12-live-health/A1-db-followup-audit.md` + `A2-provider-health.md`.
**Status:** OPEN — **HIGH PRIORITY**, blocks all real-customer outbound on live.
**Severity:** Critical (production impact on launched dealerships).
**Symptom:** 50 SMS sends in last 7 days fail-closed blocked by `TESTLANE_MODE=true but request lacks test-lane marker` on serra-honda. 106 Caroline widget-chat auto-greetings blocked in 14 days. The 2 successful SMS sends in 7d went to operator phone `+14126546500` only.
**Root cause hypothesis:** live PM2 / Coolify container `phqqzjj5pal13wlp39m5ohx6-…` is still running with `TESTLANE_MODE=true` env. Launch-time test-safety setting that was never flipped to `false` after opening to real Serra users.
**Verification needed:** Operator inspect Coolify dashboard → container env. Cannot verify from orchestrator host (live container PM2/stdout not reachable).
**Recommended fix:** if confirmed `true`, flip to `false` and restart container. Caveat: see `I-NEW-2026-05-12-G-CAROLINE-SCHEDULER-BURSTS` — verify Caroline scheduler throttle BEFORE flipping to avoid burst-fire of 50+ queued sends at real customers.
**Operator decision required.**

---

### I-NEW-2026-05-12-B-SERRA-HONDA-TESTPHONES: `triggerTestPhones` whitelist still active on serra-honda
**Discovered:** 2026-05-12 recon side-sprint (qa-evaluator).
**Status:** OPEN — blocks real-customer SMS even after Layer-1 (`I-NEW-2026-05-12-A`) is resolved.
**Severity:** High (production impact on Serra Honda).
**Symptom:** `serra-honda.settings.triggerTestPhones = ["+14126546500"]`. `checkInTriggerEnabled=true` on the same org but 0 fires on real leads in last 7 days (147 leads synced). Whitelist gates all sends to the single operator phone.
**Root cause:** launch test-phone whitelist persisted in production org settings after launch.
**Recommended fix:** `UPDATE organizations SET settings = settings - 'triggerTestPhones' WHERE slug='serra-honda'` (or set to `[]`). Single-row DB UPDATE; reversible.
**Operator decision required.** Coordinate with `I-NEW-2026-05-12-A` so flips happen in correct order (gate-release sequence).

---

### I-NEW-2026-05-12-C-NISSAN-FORD-SMS-UNPROVISIONED: serra-nissan + tony-serra-ford never had SMS triggers configured
**Discovered:** 2026-05-12 recon side-sprint (qa-evaluator + integration-safety).
**Status:** OPEN — feature has NEVER fired for these 2 stores; operator told Serra it was working.
**Severity:** High (production impact on Serra Nissan and Tony Serra Ford; potentially Hyundai of Columbia + Ford of Columbia by extension).
**Symptom:**
- `serra-nissan.settings.checkInTriggerEnabled = unset`, `afterHoursTriggerEnabled = unset`, `textmagicPhone = NULL` (NO PHONE PROVISIONED)
- `tony-serra-ford.settings` — same shape
- Zero `trigger_*_sent` rows in `activity_log` for either org. Ever.
- Same situation for hyundai-of-columbia and ford-of-columbia
**Root cause:** per-org settings + per-org TextMagic phone-number provisioning never completed for these stores.
**Recommended fix:** TWO-PART —
1. Provision TextMagic phone numbers for nissan + ford (and Columbia stores if they should also have SMS) — operator action with TextMagic dashboard
2. `UPDATE organizations SET settings = settings || jsonb_build_object('triggersEnabled', true, 'checkInTriggerEnabled', true, 'afterHoursTriggerEnabled', true, 'textmagicPhone', '<NEW_NUMBER>') WHERE slug IN (...)` per store as numbers are issued
**Operator decision required.**

---

### I-NEW-2026-05-12-D-DAILY-RECAP-NEVER-FIRED: Daily recap scheduler has not claimed lock since deploy
**Discovered:** 2026-05-12 recon side-sprint (qa-evaluator).
**Status:** OPEN — code-level issue; not config-only.
**Severity:** Medium (feature was advertised; not customer-impacting directly but admin-recap-impacting).
**Symptom:** Zero `daily_recap_sent` activity_log rows for any org since 2026-04-27 deploy. Zero `daily_recap_*` rows in `scheduler_locks` ever. `dailyRecapEnabled` flag is unset on ALL 7 orgs (compounding issue — even if scheduler ran, no org has it enabled). Daily-recap activity_log writer exists at `server/services/dailyRecapService.ts:315-340`.
**Root cause hypotheses (need investigation):**
1. Scheduler module not registered on live runtime — check `server/services/scheduler.ts` for daily-recap registration block; verify it executes on container start
2. Registration silently fails (caught exception, no log)
3. `dailyRecapEnabled` flag check filters all 7 orgs to zero candidates → no lock attempt
4. Combination
**Recommended fix sequence:**
1. Investigate code path — read `scheduler.ts` registration block + live container logs (operator-side)
2. If code-only fix: defer to v2.2.x patch or v2.3
3. Set `dailyRecapEnabled=true` for any orgs that want it (DB UPDATEs, 5 rows max)
**Operator decision required:** is daily-recap launch-blocking, or v2.2.x follow-up?

---

### I-NEW-2026-05-12-E-RESEND-OUTBOUND-LOG-BYPASS: Resend sends bypass `outbound_log` for weekly_report / auto_greeting flows
**Discovered:** 2026-05-12 recon side-sprint (integration-safety).
**Status:** OPEN — audit-trail integrity issue, NOT a delivery failure.
**Severity:** Medium (compliance / observability).
**Symptom:** `weekly_report_sent` activity_log rows for all 5 production dealerships on 2026-05-04 carry Resend `messageId` (e.g., `514470ae-2fc8-48d8-bbc6-092d6f845de2` for serra-honda 2026-W19) — proving Resend delivered the email — but **no corresponding `outbound_log` row** exists within ±2 minutes. Same pattern for `auto_greeting_sent` (serra-honda 2026-05-09 + 2026-05-10).
**Root cause:** Resend send code paths in `weeklyReportService` and `autoGreeting` flows write activity_log but bypass the `outbound_log` writer used by the canonical send pipeline.
**Recommended fix:** locate the send-call sites for these flows and ensure they invoke the unified outbound-log writer (probably `server/outbound.ts` `recordOutbound` or equivalent). Investigation required to identify exact files; cross-reference activity_log entries with the source-of-truth send code path.
**Defer to v2.3.** Not launch-blocking; emails are reaching customers.

---

### I-NEW-2026-05-12-F-CAROLINE-WIDGET-BLOCKED: 106 widget-chat auto-greetings blocked on serra-honda
**Discovered:** 2026-05-12 recon side-sprint (qa-evaluator + integration-safety).
**Status:** OPEN — downstream of `I-NEW-2026-05-12-A-TESTLANE-LIVE`; resolves when Layer-1 does.
**Severity:** High customer-perceived (widget chatbot appears silent).
**Symptom:** 106 outbound SMS rows in `outbound_log` for serra-honda last 14 days carry `blocked_reason=TESTLANE_MODE=true but request lacks test-lane marker`. Each is a `Caroline from Serra Honda` auto-greeting. Widget visitors see no response from chatbot.
**Cross-reference:** 15+ inbound `chat`/`ai-chat`/`agent-chat-*` conversations on serra-honda widget in last 14 days. Real visitors getting silence.
**Root cause:** Layer-1 TESTLANE_MODE gate (see `I-NEW-2026-05-12-A`).
**Recommended fix:** resolves with `I-NEW-2026-05-12-A`. No separate action needed UNLESS we determine TESTLANE_MODE should remain `true` for some reason — in which case we'd add a Caroline-specific exemption (not recommended).
**Operator awareness item.**

---

### I-NEW-2026-05-12-G-CAROLINE-SCHEDULER-BURSTS: Caroline scheduler emits sub-second bursts of outbound SMS
**Discovered:** 2026-05-12 recon side-sprint (integration-safety).
**Status:** OPEN — must-investigate before flipping `TESTLANE_MODE=false` (could fire 50+ real-customer sends in a single second).
**Severity:** Critical IF Layer-1 (`I-NEW-2026-05-12-A`) is flipped without first reviewing throttle.
**Symptom:** 50 of the 106 blocked SMS in last 14d arrived in serra-honda's `outbound_log` in bursts of 6+ rows within a single second (example: 2026-05-11 07:03:36 had 7 attempts in one second). Pattern suggests unthrottled per-recipient loop in Caroline scheduler. `campaign_id` is NULL on all blocked rows.
**Root cause:** scheduler loop iterating over a list of widget visitors and emitting Caroline auto-greeting without rate-limit / debounce. Specific code path to be identified — likely in `server/services/scheduler.ts` Caroline registration block.
**Recommended fix:** EITHER (a) identify and patch the unthrottled loop BEFORE flipping TESTLANE_MODE=false, OR (b) keep Caroline auto-greeting DISABLED at first while other channels open up.
**Operator decision required.** Must be coordinated with `I-NEW-2026-05-12-A` resolution to prevent customer-flood incident.

---
