# Sprint 1.3 — End-to-End Workflow Validation (Serra Honda)

**Date:** 2026-04-26
**Auditor identity:** `serra_honda@huminic.ai` (org_admin). Read-only.
**Mode:** Read-only walks + source-grep verification. No real sends, no test-lane firing, no mutations. Where mutating action would be needed, the workflow is **PARTIALLY VALIDATED** with a clear "what wasn't tested live" call-out.
**Companion document:** `evidence/preflight-ui-truth-2026-04-26.md` (Sprint 1.2). Issue cross-reference is in §3 there.
**Server build context:** dev PM2 has not been restarted since 2026-04-16; the 2026-04-26 commits (incl. widget auto-launch fix) are NOT deployed. Workflows touching those code paths note "CODE-LANDED-NOT-DEPLOYED."

**Verdict legend:** PASS · PARTIAL · FAIL · NOT-RUN.

---

## W1 — Trigger → reply round-trip (after-hours, 24h check-in)

| Field | Value |
|---|---|
| Verdict | **NOT-RUN (live mutating); PARTIAL (source review)** |
| Why not live | Triggers fire SMS to real-customer phones unless `triggerTestPhones` allowlist is configured AND the test-lane env vars + per-request marker are set. INC-001 (Apr 12) — 7 real customers were SMS'd at 10 PM. Operator instruction was explicit: do NOT fire mutating triggers in this audit. |
| Source review | I-272 (TCPA bypass), I-273 (visible dedup tag), I-274 (no test-mode whitelist) all CLOSED in LAUNCH-RECON-01 (`server/services/triggerService.ts` rewritten + tested). Test-lane fail-closed guard added in commit `2c2c5b3` to `server/outbound.ts:processOutboundSend`. Unit tests for the guard landed in commit `d957993` (36 tests pass). |
| Acceptance test (post-deploy) | Operator sets `TESTLANE_MODE=true` + `TESTLANE_SMS_TO=+14126546500` + `triggerTestPhones=[+14126546500]` for Serra Honda; manually inserts a `[TESTLANE]`-marked `warehouse_leads` row at 02:00 ET (after-hours window); confirms guard hard-routes to operator phone; confirms `outbound_log` row tagged `[testlane:<sid>]` with `recipientName='[TESTLANE] test'`; confirms NO send to the original number. |
| Recommendation | Schedule one operator-supervised test-lane fire on Saturday before 22:00 ET checkpoint. Nexxus-launch-captain dispatches. |

---

## W2 — Service campaign create / upload / send / reply (LAUNCH-CRITICAL Serra Honda)

| Field | Value |
|---|---|
| Verdict | **PARTIAL** — page UI walked; mutation blocked. |
| Live evidence | `screenshots/app-04-service-campaigns.png`. 8 campaigns visible. "Launch Day Service Test" — completed, 5/5 sent, 5 replies — the prior launch-prep test. "Wave-PE3 Verification Campaign" — completed, 1/1, 1 reply. |
| **I-270 BLOCKER** | Top-level "Upload CSV" button targets non-existent `/api/campaigns/bulk/upload-csv`. Source-confirmed at `client/src/pages/service.tsx:365`. Did not click in audit. **Customer-facing bug** — operator clicks and gets 404. Must fix before Monday. |
| Per-campaign Upload CSV | Per-row upload buttons exist; per `client/src/pages/service.tsx:518` they correctly target `/api/campaigns/<id>/upload-csv`. This path was not exercised live. |
| Reply round-trip | "Wave-PE3 Verification Campaign" 1 sent / 1 reply demonstrates the round-trip works; the inbound reply path (`server/routes/sms.ts` TextMagic webhook → conversation creation → AI auto-respond if not assigned) was not stepped through this session. |
| Stuck campaign | "Service Reminder - February" — status=active, 16 recipients, 0 sent, 0 replied. Either started but never fired (scheduler or CommGate issue) or stuck mid-state. Worth investigating before Monday — could indicate the production campaign won't fire either. |
| Source: test-lane wiring | `server/outbound.ts` two-way fail-closed guard (commit `2c2c5b3` + helper extraction in `d957993`) prevents real-customer SMS when TESTLANE_MODE=true and request lacks marker. Verified by 36 unit tests. |
| Acceptance test (post-deploy) | (a) Click top-level "Upload CSV" — expect either 404 (current bug) or "select campaign first" prompt (post-fix). (b) Create campaign with `[TESTLANE]` name prefix; upload `[TESTLANE]`-marked CSV with allowlisted phones; send; observe outbound_log → testlane override → operator receives. (c) Operator replies; verify conversation lands in TeamBox tagged. |

---

## W3 — TeamBox conversation handling (list, takeover, reply, push-to-VIN)

| Field | Value |
|---|---|
| Verdict | **PARTIAL** — list/structure walked; takeover/reply/push not exercised |
| Live evidence | `screenshots/app-02-teambox-conversations.png` |
| List | 60 conversations, channel filters, status filters, search. Polluted by 10+ "Test Customer / 0 messages" orphans. |
| Takeover flow | Right pane has "Assign to" combobox = "Unassigned" by default. Re-assigning to a human staff stops AI per `server/routes/sms.ts` assignedTo check. **NOT exercised live** — would mutate. |
| Return-to-AI | **CONFIRMED MISSING (I-255 OPEN)** — no Return-to-AI button. Only path back is selecting "Unassigned" in the dropdown. Confusing UX; conversations silently stay human-mode. |
| Reply | Textbox + send button visible. Mutating — not exercised. |
| Push to VIN | Button visible on every conversation including Test Customer / 0 messages. `server/routes/conversations.ts` POST `/api/conversations/:id/push-to-vin` endpoint per EDR-11 / I-240. **Not exercised**. The button being enabled for empty conversations is a UX bug. |
| Quick Actions Call/Email/SMS | In customer info panel — mutating. Not exercised. |
| Workflow tab | Visible as "Workflows" sub-tab. Not walked. |
| Acceptance test (post-deploy) | (a) Open `[TESTLANE]`-marked conversation; click Push to VIN; verify `prepare → review → STOP` (per CLAUDE.md VIN safe protocol). (b) Trigger AI auto-response; click takeover; reply; verify customer receives via test-lane. (c) Click Return-to-AI (post-fix) — verify assignment clears. |

---

## W4 — Push-to-VIN

| Field | Value |
|---|---|
| Verdict | **NOT-RUN** — VIN writes require operator approval and follow `prepare → review → execute → verify` protocol per CLAUDE.md. |
| Source state | Endpoint exists per EDR-11. I-240 BUG-INT-07 is OPEN — vin-safe-mcp prepare step fails for some orgs (dealer provisioning issue, external dependency). |
| Recommendation | Test once on Saturday with `Durran Cage` test contact (per `.claude/state/test-recipients.txt` — `vin_test_contact: Durran Cage`). Operator dispatches. |

---

## W5 — Widget actions (chat / callback / form / video)

| Field | Value |
|---|---|
| Verdict | **PARTIAL** — public landing renders; auto-launch ?mode= broken by undeployed code |
| Live evidence | `screenshots/p-serra-honda-default.png` · `screenshots/w-serra-honda-mode-chat-NOT-AUTO-LAUNCHED.png` |
| Manual FAB → menu | **PASS** — clicking the FAB opens menu with 4 options (Web Chat / Instant Call Back / Contact Form / Two-Way Video). |
| `?mode=chat / voice / form / video` auto-launch | **CODE-LANDED-NOT-DEPLOYED** (commit `354aa33`). DOM probe confirms widget container is not mounted under `?mode=chat`. Cannot verify until rebuild + restart. |
| Form submit (Get in Touch) | **NOT-RUN** — would create a real lead via `POST /api/widget/contact` (per `server/routes/public.ts:76`). Mutating. |
| Voice callback submit | **NOT-RUN** — `POST /api/widget/voice-callback`. Mutating. |
| Video session | **NOT-RUN** — `POST /api/widget/video-session` opens a Tavus session. Mutating + provider cost. |
| CORS / cross-origin embed | I-214 CLOSED at the header level. Embed-in-Cox-page validation requires Cox cooperation — schedule for Saturday. |
| Acceptance test (post-deploy) | (a) `https://dev.huminicdev.com/w/serra-honda?mode=chat` → widget overlay opens to chat. (b) Same for `?mode=voice` (callback dialog), `?mode=form` (contact form), `?mode=video` (Tavus session). (c) Submit `[TESTLANE]`-marked form → verify lead reaches TeamBox tagged. |

---

## W6 — Appointment intent → calendar + admin notification

| Field | Value |
|---|---|
| Verdict | **NOT-RUN** — would require triggering an appointment-intent inbound (VAPI call, Tavus video, ADF parse). |
| Decisions baseline | Per `decisions.md` 2026-04-24: appointments stored in our-system calendar + admin notification email. NO VIN appointment sync (VIN Solutions does not accept appointment entries). |
| Source state | Webhook handlers in `server/routes/webhooks.ts` create appointment rows + send notification via `sendLeadNotificationEmail`. Test-lane guard for ADF emit added in commit `2c2c5b3` (verified by 10 ADF unit tests in `d957993`). |
| Acceptance test (post-deploy) | Place a VAPI call to Serra Honda's test number using the operator's phone; verify (a) appointment row created in DB, (b) admin notification email sent to allowlisted recipients only when test-lane is on, (c) ADF NOT emitted to live dealer intake (ADF_MODE=test guard). |

---

## W7 — Main chat (`/`) and agent chat

| Field | Value |
|---|---|
| Verdict | **PASS** for main chat happy path |
| Live evidence | `screenshots/app-09-ai-chat-dealership-probe.png` |
| Main chat round-trip | Asked "What dealership are you assisting? Quote your assigned dealership name verbatim." — response: "I'm assisting **Serra Honda**." Streaming completed; message persisted (no I-277 vanishing-message regression). |
| I-269 surface | Higher-level systemPrompt at `server/routes/chat.ts:233` correctly substitutes `${orgName}` so user-facing answers are clean. **The bug surfaces in drafted-template responses** (e.g., "draft a follow-up email" — Communication Writer agent). Not exercised this audit. |
| Sales Coach / Communication Writer / Data Guru / Caroline | Agent invocations not exercised. Source: agent.instructions are appended verbatim at `server/routes/chat.ts:161` with no template substitution. |
| Photo Studio (I-102) | NEEDS LIVE TEST. /agents page not walked this pass. |
| Acceptance test (post-fix) | Ask Communication Writer "draft a follow-up email for a test-drive customer" — verify NO literal `{{dealershipName}}` in the AI's drafted email. |

---

## W8 — Sales / Service inbound + outbound communications

| Field | Value |
|---|---|
| Verdict | **NOT-RUN** — would mutate via real provider sends |
| Source state | `server/outbound.ts:processOutboundSend` test-lane guard validated by 13 unit tests. `server/routes/sms.ts` TextMagic webhook validates inbound. `server/services/notificationService.ts` admin-recipient guard validated by 6 unit tests. `server/services/notificationService.ts:sendWeeklyReportEmail` guard added in commit `7721fb7` validated by 7 unit tests. |
| Acceptance test (post-deploy) | (a) Operator phone sends inbound SMS to Serra Honda's TextMagic number with content `[TESTLANE] test inbound`. Verify conversation lands in TeamBox tagged. (b) Reply via TeamBox — verify outbound test-lane override fires (operator phone receives instead of customer). |

---

## W9 — Reports / metrics / weekly report

| Field | Value |
|---|---|
| Verdict | **PARTIAL** — Insights Dashboard / Library / Reports walked; weekly executive report (TRG-RPT-001) not fired |
| Live evidence | `screenshots/app-05-insights-dashboard.png` · `screenshots/app-05-insights-library.png` · `screenshots/app-05-insights-reports.png` |
| Cross-page metric inconsistency | "Active Pipeline" 197 (Sales) vs 306 (Insights·Today) vs 609 (Insights·Pipeline Health) vs 306 (Library). Same label, three values. **Customer-confidence-impacting at launch.** |
| I-260 lib-21 | "Avg Time to 1st Contact `—`" — confirmed open. |
| I-279 source-resolution | "Top Source: VIN Source #7098 (18%)" — confirmed open across Library, Reports tabs. |
| I-265 hardcoded target | "Month-End Forecast 5 / -45 vs target (50)" — confirmed deferred. |
| Weekly executive report | TRG-RPT-001 phase D completed pre-session per session.md. Test-lane guard added in commit `7721fb7`. Not fired in this audit. |
| Acceptance test (post-fix) | (a) Pick one canonical "Active Pipeline" definition; assert all three pages show same value or rename to disambiguate. (b) For lib-21, either compute from `vinCreatedAt` + first message timestamp OR hide tile. (c) Fire weekly report to operator's email via test-lane; verify subject prefixed `[testlane:<sid>]` and html prefixed with HTML comment override marker. |

---

## Cross-cutting failures (Sprint 1.3 surfaces)

### Deep-link auth bootstrap

Direct-URL navigation to `/teambox`, `/marketing`, `/settings?section=ai`, etc. all bumped me back to `/login` mid-bootstrap. `POST /api/auth/refresh` returned 400 in network capture. After re-login, the same target URL works via sidebar nav. **Affects every shared link, every refresh, every bookmark.** Not in issues.md — this is a NEW finding from the live walk.

### Cross-page metric inconsistency

Captured in §1.6 of the UI Truth doc. Strongest single argument for prioritizing Sprint 3.1/3.2 (metrics revision) before Monday.

### User list cross-org leak

Serra Honda org_admin sees users from `@misscommunicationconsulting.com`, `@gmail.com`, `partner@nexxus.com`. Could be by design (multi-store admins via additionalOrgIds) — needs verification. NEW finding.

### Conversation-list pollution

10+ "Test Customer / 0 messages" rows. Real conversations buried. Pre-launch DB cleanup recommended.

---

## Acceptance-test plan (rolled into Task #6 / Task #7)

This summary feeds Sprint 5.1 (Regression and Playwright Coverage):

- W1 (Trigger): one operator-supervised test-lane fire Saturday — operator dispatches.
- W2 (Service campaign): fix I-270 first; then run a full test-lane campaign Saturday with allowlisted recipients only.
- W3 (TeamBox): UI workflow Playwright spec for takeover + Return-to-AI (post-fix).
- W4 (Push-to-VIN): operator-supervised vin-safe-mcp prepare → review → STOP (no execute).
- W5 (Widget): rebuild + restart dev; re-test all four `?mode=` paths; capture screenshots; submit form via test-lane.
- W6 (Appointment): operator places one VAPI call Saturday; verify the calendar + admin notification path.
- W7 (Main chat): regression spec already covers `/api/chat/start` + streaming.
- W8 (Comms): TextMagic test-numbers (operator-owned) + Resend allowlisted email — Saturday.
- W9 (Reports): fire weekly report to operator email via test-lane; verify subject + html tagging.

---

**Audit complete.** Sprint 1.3 deliverable. Findings hand off to Task #4 (fix list checkpoint).
