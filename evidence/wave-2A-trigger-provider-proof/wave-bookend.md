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
- **T2 (revised)** — Direct Email provider proof via processOutboundSend with TESTLANE-marked email payload (ratifies Wave 1C pattern at outbound-gate layer)
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

## CLOSING

(pending — populated at gate after builder + verifiers complete)
