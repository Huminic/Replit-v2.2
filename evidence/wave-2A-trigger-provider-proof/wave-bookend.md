# Wave Bookend — 2A-T — Trigger provider proof (after-hours + 15-min check-in)

## OPENING

**Wave:** 2A-T (Provider Proof sub-wave of Wave 2A; Service Campaign + Webhooks parked for Wave 2A-B)

**MID-WAVE REVISION 2026-05-07 (~16:30 UTC):** Original scope (trigger-logic-driven SMS proof for evaluateAfterHoursTrigger + evaluateCheckInTrigger) was BLOCKED by 4 obstacles surfaced during T1 builder dispatch — see `chunk-T1/blocker-finding.md`:
1. Trigger evaluator functions are module-private (not exported); direct invocation impossible without scope-additive code change
2. evaluateAfterHoursTrigger is **defer-only by design** (TCPA compliance) — writes activity_log row only, never calls processOutboundSend
3. serra-honda has `settings.afterHoursTriggerEnabled=false`
4. Currently within business hours (8-21 ET); trigger would short-circuit at line 204 regardless

Advocate revision: pivot Wave 2A-T to **Direct Outbound Provider Proof** at the `processOutboundSend` layer (mimicking the payload shape that a real trigger would build). This proves the LAUNCH-CRITICAL piece (TextMagic + Resend integration through testlane gate end-to-end) while parking trigger-conditional-logic proof for a future Wave 2A-Pure-Triggers. The trigger-logic future wave needs: (a) export approval for trigger evaluator functions, (b) test-rig that either mocks business-hours clock or safely scopes runTriggerEvaluation to one org only.

Revised chunk decomposition:
- **T1 (revised)** — Direct SMS provider proof via processOutboundSend with TESTLANE-marked SMS payload
- **T2 (revised twice)** — **VAPI agent-to-agent voice provider proof** using existing `testVapiAgentToAgentCall` helper in `server/comms-test.ts:39`. Pivoted from "Email ratification" because Resend was already proven in Wave 1C; VAPI has NOT yet been proven end-to-end and is launch-critical for v2.2 voice flows. Agent-to-agent (both AI assistants we control) → zero real customer impact; uses `vapi_test_agent:c303d993-bf42-4784-a8cb-247477b1cbdd` (Elliott) per allowlist.
- **Trigger-logic proof** — deferred to future Wave 2A-Pure-Triggers
**Phase:** 7 (Service) + 10 (Background Workflows) — partial → proven
**Date opened:** 2026-05-07
**Goal (plain English, 1 sentence):** Validate that Trigger 1 (after-hours SMS) and Trigger 2 (15-min check-in SMS) actually fire end-to-end through the TestLane to TextMagic with real provider message IDs and full audit trail (activity_log + outbound_log + Resend/TextMagic provider record).
**Why necessary for v2.2 release:** Plan.md Phase 7 (Service) and Phase 10 (Background Workflows) are PARTIAL until provider-proof. Triggers are launch-affecting (per `harness/agents-common/nexxus-launch-captain.md`); proving them with audit trail is a release gate.

### Sub-wave split (within Wave 2A)

Wave 2A as enumerated in plan.md is "Trigger 1 / Trigger 2 / service-campaign / webhook provider proof | queued". This is too big for a single wave per established 3-6 chunk pattern. **Splitting de facto:**
- **Wave 2A-T (THIS WAVE):** Trigger 1 + Trigger 2
- **Wave 2A-B (queued, future session):** Service Campaign + Webhooks

Advocate decision: triggers are conceptually one thing (lead-condition-driven outbound); campaigns are time-driven sequences; webhooks are inbound. Splitting respects bookend pattern + reduces single-wave SMS-ping count.

### Existing evidence to reuse

- `.claude/state/test-safety/report-20260507T155540Z.txt` — preflight report (current session; allowlist verified)
- `.claude/state/test-orgs.txt` — `test_org:serra-honda` is the ONLY allowlisted org
- `.claude/state/test-recipients.txt` — `internal_operator:+14126546500` is the SMS allowlist
- `server/outbound.ts:79-138` — TestLane gate logic (TESTLANE_MODE + marker = hard-route to TESTLANE_*_TO)
- `server/services/triggerService.ts:193-318` (evaluateAfterHoursTrigger), `:319-513` (evaluateCheckInTrigger), `:726` (runTriggerEvaluation)
- `tests/integration/weeklyReport.send-live.test.ts` — Wave 1B precedent for direct-invocation provider proof
- `evidence/wave-1C-metric-honesty/wave-bookend.md` — Wave 1C Resend Δ1 precedent

### Current status of this component

PARTIAL — trigger code exists and runs on 15-min interval per scheduler, but no end-to-end provider proof captured. Must produce two proofs (T1, T2) with audit trail before Phase 7/10 can be marked PROVEN.

### In scope (THIS WAVE)

**Chunk T1 — After-hours trigger provider proof**

- Create a NEW tsx script at `server/test-trigger-2A.ts` (or add to `server/comms-test.ts` — builder picks cleaner path) with function `testTrigger1AfterHours()`.
- Script behavior:
  1. Set `process.env.TESTLANE_MODE = "true"` and `process.env.TESTLANE_SMS_TO = "+14126546500"` (operator's allowlisted phone)
  2. **Inject a TESTLANE-marked lead** into Supabase under `serra-honda` org, with:
     - `recipient_first_name = "TESTLANE"` (triggers test-lane marker detection per `outbound.ts:109`)
     - `lead_source` matching after-hours trigger conditions
     - Created timestamp set to AFTER business hours (use a fixed past timestamp matching the trigger window)
     - Phone: `+14126546500` (will be hard-routed to TESTLANE_SMS_TO regardless)
     - Mark in metadata: `testlane: true`, `wave: "2A-T"`, `chunk: "T1"`
  3. Look up serra-honda Organization
  4. Call `evaluateAfterHoursTrigger(serraHondaOrg)` directly
  5. Capture: trigger return value, activity_log rows added (filter by recipient + timestamp window), outbound_log rows (filter by org + timestamp), TextMagic provider message ID
  6. Cleanup: optionally mark the test lead as `testlane_consumed: true` for downstream filtering (or leave; the TESTLANE prefix is enough discrimination)
- Run via `TESTLANE_MODE=true TESTLANE_SMS_TO=+14126546500 npx tsx server/test-trigger-2A.ts testTrigger1AfterHours`
- Capture evidence: `evidence/wave-2A-trigger-provider-proof/chunk-T1/proof.md` with:
  - tsx script path + invocation command
  - Trigger return value
  - Lead row created (id, recipient name, phone, creation timestamp)
  - activity_log entries surfaced (action, action_type, ts, payload summary)
  - outbound_log entry (org, channel, status, recipient, message_id)
  - TextMagic provider message ID + delivery status (or "queued" if not yet delivered)
  - Operator SMS receipt confirmation expected at `+14126546500` (operator may receive 1 SMS)

**Chunk T2 — 15-min check-in trigger provider proof**

- Same script (`server/test-trigger-2A.ts`), function `testTrigger2CheckIn()`.
- Script behavior:
  1. Same env setup
  2. Inject a NEW TESTLANE-marked lead under `serra-honda`:
     - Created ~16 minutes ago (just past the trigger window)
     - No prior outbound trigger (so check-in fires for the first time)
     - Same TESTLANE marker pattern
  3. Call `evaluateCheckInTrigger(serraHondaOrg)` directly
  4. Capture provider + log evidence per T1 pattern
- Run + capture evidence per T1 pattern at `chunk-T2/proof.md`.

### Out of scope (explicit)

- ANY edit to `server/services/triggerService.ts` — read-only against trigger code
- ANY edit to `server/outbound.ts` — read-only against testlane gate
- ANY DB write OUTSIDE the TESTLANE-marked lead injections in `serra-honda`
- ANY provider send outside the allowlist (recipient must be `+14126546500`)
- Service Campaign provider proof — Wave 2A-B
- Webhook (inbound) proof — Wave 2A-B
- VAPI / Tavus / Resend proofs — those are inbound or different channels; only TextMagic SMS for triggers
- ANY change to PM2 environment (use script-local env vars only; no `pm2 restart --update-env`)
- ANY UI change

### Operator decisions required BEFORE autonomy starts

NONE — operator's blanket "keep going" + the established advocate posture covers per-chunk dispatch. Operator's phone is allowlisted; SMS pings to operator are the established testlane protocol.

### Credentials / accounts / allowlists required

- DATABASE_URL (already in `.env`) — required for lead injection + log queries
- Supabase read/write access for `serra-honda` org — already configured
- TextMagic credentials (already in `.env`) — required for provider send

### Provider-send approvals required

- 2 SMS sends total (T1 + T2), each to `internal_operator:+14126546500` (allowlisted)
- Test-lane sentinels: TESTLANE_MODE + TESTLANE_SMS_TO + recipient_first_name="TESTLANE" + content `[testlane:<sid>]`
- Operator may receive 2 SMS pings to `+14126546500` over the course of the wave

### UI scope markers required

NONE. No UI files touched.

### Files likely touched

- `server/test-trigger-2A.ts` (NEW) — test invocation script (TestLane-only, no production code path)
- (Conditional) `server/comms-test.ts` — if builder picks "add to existing" over "new file"
- `evidence/wave-2A-trigger-provider-proof/chunk-T1/proof.md` (NEW)
- `evidence/wave-2A-trigger-provider-proof/chunk-T2/proof.md` (NEW)
- `evidence/wave-2A-trigger-provider-proof/wave-bookend.md` (this file)
- `evidence/wave-2A-trigger-provider-proof/verifier-audit/` (verifier verdicts)

### DB writes (TESTLANE-marked, in serra-honda org)

- 2 leads injected (1 per chunk), each marked `recipient_first_name = "TESTLANE"`, metadata `wave: "2A-T"`
- TestLane guard ensures recipients are hard-routed to operator's phone — no real customer impact
- Activity log + outbound log writes are byproduct of the trigger firing (expected)
- Per CLAUDE.md autonomy: "Create test records clearly marked [TESTLANE]" is autonomy-allowed

### Git branch / worktree strategy

- Wave branch: `wave/10-bg/2A-T-trigger-proof` off `batch-1-finish-line` (HEAD `76024ad`)
- Builder works in main project worktree (no isolated worktree needed for this kind of test work; commits directly on wave branch)
- ff-only merge `wave/10-bg/2A-T-trigger-proof` → `batch-1-finish-line` at CLOSING

### Agent-team roster

- `team-lead` (orchestrator) — me
- isolated `Agent` builder (general-purpose) — sequential T1 then T2
- (Conditional) qa-evaluator may be invoked at gate to cross-check provider receipts

### Isolated audit subagents (gate-only)

- `blind-verifier` — independent verification of trigger fire claims + provider receipts
- `scope-guardian` — file-level scope discipline
- `drift-detector` — hierarchy-level drift
- **`integration-safety`** — REQUIRED for this wave (provider boundary touched per CLAUDE.md harness rule)

### Stop conditions (explicit)

- ANY edit to product files (`server/services/triggerService.ts`, `server/outbound.ts`, etc.) — STOP, escalate
- ANY DB write OUTSIDE the 2 TESTLANE leads in serra-honda — STOP, escalate
- ANY SMS send to a recipient OTHER than `+14126546500` — STOP IMMEDIATELY, escalate
- ANY trigger fire that goes to a non-allowlisted recipient — STOP IMMEDIATELY (would indicate testlane gate is broken)
- TextMagic returns a 4xx/5xx — capture and STOP for diagnosis (don't retry blindly)
- Lead injection requires schema changes — STOP, out of scope

### Chunk list

- **T1** — After-hours trigger provider proof (1 SMS to operator)
- **T2** — 15-min check-in trigger provider proof (1 SMS to operator)

### Proof required (two deltas, per CLAUDE.md TESTING_DOCTRINE)

- **Δ1 (per chunk)** — runnable test result: tsx script exit 0 + trigger return value > 0 (indicating SMS sent)
- **Δ2 (per chunk)** — independent observation: TextMagic provider message ID retrieved + activity_log row + outbound_log row + (if operator confirms) SMS receipt

### Expected evidence path

- `evidence/wave-2A-trigger-provider-proof/chunk-T1/proof.md`
- `evidence/wave-2A-trigger-provider-proof/chunk-T2/proof.md`
- `evidence/wave-2A-trigger-provider-proof/verifier-audit/`
- `evidence/wave-2A-trigger-provider-proof/wave-bookend.md` (this file)

---

## CLOSING (audited 2026-05-07)

**Closed:** 2026-05-07 (~17:30 UTC)
**Wave-level verdict:** **PASS — Direct Outbound Provider Proof complete for SMS (TextMagic) and VAPI (voice).** Trigger conditional logic proof remains queued as future Wave 2A-Pure-Triggers (needs trigger evaluator export approval + business-hours mocking). Sub-wave 2A-B (Service Campaign + Webhooks) parked for separate wave. Side-thread surfaced a real production-impact issue (TextMagic dashboard pointing at dev URL → 503s → silent SMS drops) with operator-execute fix recommendation.

### Wave history (linear, all on `wave/10-bg/2A-T-trigger-proof`)

| SHA | Commit |
|---|---|
| `76024ad` | (base) — pre-Wave-2A-T tip of `batch-1-finish-line` |
| `c60907b` | `evidence(wave-2A-T): chunk-T1 original-spec blocker finding + bookend mid-wave revision` |
| `bed5c4b` | `test(wave-2A-T): testlane-only invocation script for direct outbound provider proof (T1 setup)` |
| `b6dfe1a` | `evidence(wave-2A-T): T1 (revised) direct SMS provider proof via processOutboundSend (1 SMS to allowlist)` |
| `3e977dc` | `test(wave-2A-T): add T2 VAPI Elliott-to-Nancy agent-to-agent helper` |
| `7f1a997` | `evidence(wave-2A-T): T2 VAPI Elliott-to-Nancy agent-to-agent provider proof (no real human)` |
| `c5d8953` | `evidence(sidethread): TextMagic webhook callback URL investigation (read-only)` |
| (next) | `evidence(wave-2A-T): CLOSING bookend + 4 verifier verdicts + T2 first-dispatch blocker ratification` |

Aggregate: 1 product-side new test-only file (`server/test-trigger-2A.ts`) / 0 production code changes / 7 commits + CLOSING.

### Two deltas of proof — captured

| Delta | Type | Result | Evidence |
|---|---|---|---|
| **Δ1** | runnable | tsc PASS + vitest 459/2 PASS on wave HEAD `7f1a997`. Reproduced by blind-verifier independent run. | wave HEAD test runs |
| **Δ2** | provider receipts | T1: TextMagic message ID `1406916679` to `+14126546500` (allowlist) verified in DB outbound_log. T2: VAPI call ID `019e03da-e46e-7000-83f9-5c9128e7f0b0` Elliott→Nancy verified via VAPI `/call/{id}` polls (queued → in-progress 19:12:19Z). | chunk-T1/proof.md + chunk-T2/proof.md |

### Audit chain (4 blind verifiers at gate, all PASS)

| Verifier | Type | Verdict | Evidence |
|---|---|---|---|
| `blind-verifier` (general-purpose) | subagent at gate | **AGREE** — 8/8 independent checks PASS | `verifier-audit/blind-verifier-verdict.md` |
| `scope-guardian` (subagent type) | subagent at gate | **PASS** — 1 product-side new file (test-only); zero edits to production code; 2-SMS T1 over-send disclosed; Nancy allowlist gap surfaced | `verifier-audit/scope-guardian-verdict.md` |
| `drift-detector` (general-purpose) | subagent at gate | **NO DRIFT** — both mid-wave revisions documented; 2A-B + 2A-Pure-Triggers explicitly parked; Phase 7+10 boundaries respected | `verifier-audit/drift-detector-verdict.md` |
| `integration-safety` (subagent type) | subagent at gate (REQUIRED for provider boundary per CLAUDE.md) | **PASS** — TestLane gate hard-routed correctly; no real customer contact; vin-safe-mcp + CommGate untouched; Nancy allowlist gap covered by operator verbal authorization (this session) with written-allowlist update recommended for next session | `verifier-audit/integration-safety-verdict.md` |

### Mid-wave revisions (documented for honest audit trail)

1. **T1 original-spec abort.** Original T1 spec called for direct invocation of `evaluateAfterHoursTrigger`; aborted by builder (chunk-T1/blocker-finding.md committed `c60907b`) due to 4 obstacles: function not exported, after-hours trigger is defer-only by design, serra-honda has flag disabled, currently within business hours. Pivoted T1 to direct `processOutboundSend` invocation.
2. **T2 first-dispatch abort + clarification.** First T2 dispatch assumed VAPI required PSTN-only routing and would dial Durran's non-allowlisted number via misnamed `testVapiAgentToAgentCall` helper. Builder STOPPED correctly. Operator clarified: "agent can call another agent — Elliott calls Nancy." Second T2 dispatch (Elliott→Nancy phone, both AI assistants) shipped successfully. T2 first-dispatch blocker-finding ratified into repo this CLOSING for audit completeness.

### T1 disclosure (per Environmental Core Value #1: TRUTH OVER COMPLIANCE)

T1 builder ran the test script TWICE instead of ONCE — once for the actual proof (succeeded with exit 0), then again to capture exit code via `echo $?` (also succeeded). Result: 2 SMS sent to operator's `+14126546500` instead of 1. Both went to allowlisted recipient via TestLane gate hard-route. Builder transparently disclosed in chunk-T1/proof.md. T2 builder explicitly avoided this pattern. Documented for future-orchestrator awareness.

### Architectural findings (surfaced for follow-up; NOT blocking close)

1. **`outbound_log` schema lacks `provider_message_id` column.** TextMagic message IDs are only emitted to stdout by `sendSmsRaw` and not persisted. For audit trail completeness, recommend a future schema-additive change (e.g. v2.3 or via approved migration).
2. **`processOutboundSend` does NOT write `activity_log`.** That's a higher-level caller responsibility (e.g. trigger evaluators). Documented for future trigger-logic-proof wave (Wave 2A-Pure-Triggers).

### Side-thread: TextMagic webhook callback URL (PRODUCTION-IMPACT FINDING)

Operator received a TextMagic notification: `https://dev.huminicdev.com/api/webhooks/textmagic` callback URL not functioning. Investigation finding at `evidence/wave-2A-trigger-provider-proof/sidethread-textmagic-webhook/finding.md`:
- URL IS a valid endpoint (handler at `server/routes/sms.ts:159`)
- Should be on `live.huminic.app` (production)
- Why on dev: leftover from pre-launch testing; dashboard never updated when prod moved to Coolify (related to carried debt `I-NEW-2026-04-30-E`)
- Actual brokenness: dev returns HTTP 503 (`TEXTMAGIC_WEBHOOK_SECRET` unset on dev + `NODE_ENV=production` → reject branch). Live is healthy.
- Impact: TextMagic auto-disable countdown is running. Inbound SMS at any dealership configured against the dev URL is **silently dropping right now**.

**Operator action recommended:** Update TextMagic dashboard inbound callback URL from `dev.huminicdev.com` → `live.huminic.app`. NO code change needed.

### Stop conditions — all PASS

- Zero edits to production code (`server/services/triggerService.ts`, `server/outbound.ts`, `server/comms-test.ts`, schema files)
- Zero DB writes outside expected outbound_log + usage_events byproducts of T1
- Zero provider sends outside allowlist (T1 to `+14126546500` allowlist; T2 to Nancy AI service number with operator verbal authorization)
- Zero pm2 restart on `live.huminic.app`
- Zero commits to `batch-1-finish-line` direct or to `main`
- Zero force pushes / `git rebase -i`
- Zero TextMagic dashboard changes (operator-execute)

### Operator action items (post-merge, async)

1. **Add Nancy to test-recipients.txt** for future autonomous Elliott→Nancy dispatch:
   - `vapi_test_agent:c777f029-8c4c-4a23-98e4-3adfd4112a61` (Nancy assistant)
   - `vapi_test_phone:+19014361271` (Nancy Serra Honda service number)
2. **Update TextMagic dashboard** inbound callback URL from `dev.huminicdev.com` → `live.huminic.app` (production-impact; addresses operator's email notification)
3. **Optional:** Set `TEXTMAGIC_WEBHOOK_SECRET` in dev `.env` if you want dev to also accept callbacks for test-lane testing
4. **Reconcile plan.md** wave-roadmap table (currently still lists Wave 1C as ACTIVE; needs reflection of 1C/I-Auth/3F-A/3F-B/11-Gov/2A-T DONE; Wave 2A's split into 2A-T/2A-B/2A-Pure-Triggers should be documented). Per drift-detector housekeeping note.

### Carried-forward / future-wave items

- **Wave 2A-B** (Service Campaign + Webhooks) — parked per de facto split
- **Wave 2A-Pure-Triggers** — full trigger-logic-proof wave; needs export approval for `evaluateAfterHoursTrigger` / `evaluateCheckInTrigger` / `evaluateImmediateNewLeadTrigger` + business-hours-mocked test rig + safe scoping of `runTriggerEvaluation` to one org
- **TextMagic dashboard URL fix** (operator-execute; no code work)
- **outbound_log `provider_message_id` column** addition (v2.3 or approved migration)

### Cross-references

- `evidence/wave-1C-metric-honesty/wave-bookend.md` — Wave 1C Resend Δ1 precedent
- `evidence/governance-2026-05-01/harness-session-id-marker-gap.md` (ratified Wave 11-Gov G1) — relevant to integration-safety marker file naming gap
- `server/outbound.ts:79-138` — TestLane gate logic (untouched this wave)
- `server/services/triggerService.ts:193-318, 319-513, 514-660, 726, 823, 849` — trigger evaluator surface (untouched)
- `server/routes/sms.ts:159` — TextMagic webhook handler (subject of side-thread)
- `.claude/state/test-recipients.txt` — allowlist (Nancy gap noted)

### Merge sequence (executed by orchestrator after CLOSING commit)

1. `git checkout batch-1-finish-line && git merge --ff-only wave/10-bg/2A-T-trigger-proof`
2. `git push origin batch-1-finish-line`
3. **Live deploy: deferred to Wave 11A release-cycle gate**

### Next-wave readiness

- **YES** — Wave 2B (widget E2E) — independent
- **YES** — Wave 9-Sec triage opens with operator decision
- **YES** — Wave 11A (Final E2E + go/no-go) — preferably AFTER 11-Gov G1 fix lands and after TextMagic dashboard URL fix

---

## CONTINUATION OPENING (2026-05-07/08)

Wave 2A re-opened for the remaining chunks per plan.md. Operator retired A/B/C wave-naming convention 2026-05-07 — these chunks are inside Wave 2A, not a new wave.

### Chunks added in this continuation

- **Chunk T3 — Service Campaign provider proof.** Use existing helper `testServiceCampaignCreation` at `server/comms-test.ts:67` (already in codebase). Run test-lane creation of a service campaign in serra-honda; verify campaign row created + any SMS sequence emits route through TestLane gate to allowlist. Capture campaign ID, SMS message_ids if any, outbound_log entries.
- **Chunk T4 — Webhook provider proof.** VAPI inbound webhook validation. Generate a synthetic VAPI event (call.started or transcript chunk) POST to local `/api/webhooks/vapi`; verify handler processes correctly, creates conversation row if applicable, no 5xx. TextMagic inbound webhook proof is BLOCKED by I-NEW-2026-05-07-TEXTMAGIC-URL (operator-execute dashboard fix); covered conceptually here but live SMS roundtrip deferred until dashboard URL is corrected.

Trigger-evaluator-driven proof (per Wave 2A original spec) remains queued — needs export approval for `evaluateAfterHoursTrigger` / `evaluateCheckInTrigger` / `evaluateImmediateNewLeadTrigger` + business-hours-mocked test rig. Not dispatching this session.

### Out of scope (this continuation)

- ANY edit to `server/services/triggerService.ts`, `server/outbound.ts`, `server/comms-test.ts` body changes (extension via export-import is OK), schema, migrations
- ANY provider send to non-allowlisted recipients
- ANY pm2 restart on live; dev autonomous after presenting reason

### Files likely touched

- `server/test-trigger-2A.ts` — extend with T3/T4 functions (already exists)
- `server/comms-test.ts` — read-only (existing testServiceCampaignCreation helper; do NOT modify body)
- `evidence/wave-2A-trigger-provider-proof/chunk-T3/proof.md` (NEW)
- `evidence/wave-2A-trigger-provider-proof/chunk-T4/proof.md` (NEW)
- (Update) `evidence/wave-2A-trigger-provider-proof/wave-bookend.md` — final CLOSING covers all 4 chunks (T1, T2, T3, T4)
- (Update) `evidence/wave-2A-trigger-provider-proof/verifier-audit/` — re-run verifiers to cover all 4 chunks at final close

### Stop conditions (carry from initial OPENING + add)

- Service campaign helper requires modifications to comms-test.ts body — STOP, escalate
- Webhook handler returns 5xx during synthetic POST — capture, STOP for diagnosis
- Any provider send routes outside allowlist — STOP IMMEDIATELY
- Run scripts EXACTLY ONCE per chunk — capture exit code from RESULT JSON, no echo-rerun pattern (T1 disclosure carryover)

CLOSING below will be REWRITTEN to cover all 4 chunks once T3 + T4 land.

