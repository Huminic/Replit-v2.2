# Caroline Throttle Investigation — Layer-2 Launch Gate

**Date:** 2026-05-14
**Owner:** qa-evaluator (teammate, dispatched by orchestrator after recon-side-sprint discovery)
**Verdict:** **PASS — no code change needed for launch**
**Reclassifies:** `I-NEW-2026-05-12-G-CAROLINE-SCHEDULER-BURSTS` from "Critical IF Layer-1 flipped" to "investigated; concurrent-traffic explained / live path is per-conversation throttled"

qa-evaluator's verbatim findings (orchestrator wrote the file per subagent-cannot-write-evidence constraint).

---

## Code path map

Caroline auto-greeting has TWO event-triggered paths. **NO scheduler-driven Caroline send loop.**

**Path A — Webchat auto-greeting**
- `server/routes/public.ts:275-304` — fires inside `POST /api/widget/chat` when `isNewConversation === true`
- Writes a `messages` row only (no SMS, no `outbound_log` row)

**Path B — Inbound SMS auto-greeting**
- `server/routes/sms.ts:450-553` — entire block guarded by `if (isNew)`
- Trigger: inbound TextMagic webhook from a phone with no existing open SMS conversation in that org
- Gate stack: `isNew` → org `outboundEnabled && smsEnabled` (sms.ts:454) → `OUTBOUND_LIVE_ENABLED === "true"` (sms.ts:455) → `autoGreeting` agent exists (sms.ts:458-459) → business-hours fork (sms.ts:478-513) → `processOutboundSend` (sms.ts:515-525)
- Concurrent webhooks for the same `phone:org` serialised by `withConversationLock` (`sms.ts:13-26`, lock acquired at `sms.ts:376`)
- Message-level dedup at `sms.ts:557-568` rejects duplicate content within 30s

**The literal "Caroline from Serra Honda" greeting string appears server-side in exactly ONE file:** `server/test-trigger-2A.ts:104` — a one-shot CLI test script (Wave 2A-T provider proof). NOT a scheduler. The seeded Caroline agent's `autoGreeting` template (`server/seed.ts:445`) renders dynamically with `{{customerName}}` / `{{dealershipName}}` / `{{agentName}}` placeholders — the "Caroline from Serra Honda" literal does not come from the live SMS auto-greeting path.

The trigger-scheduler `checkTriggerConditions` (`server/services/scheduler.ts:867-868`, runs every 15min) fires DIFFERENT messages (24h check-in, immediate new-lead, after-hours-DEFER). None of those say "Caroline."

## Throttle verdict: **(c) Properly throttled — the bursts in the recon are NOT Caroline**

- Path A: gated by `isNewConversation` — one greeting per conversation, never produces an `outbound_log` row
- Path B: gated by `isNew` (mutex-serialised) — one SMS greeting per new SMS conversation per phone per org
- Same phone replying again on an EXISTING open conversation does NOT re-trigger the greeting block
- The `withConversationLock` mutex (`sms.ts:13-26`) prevents two concurrent webhooks for the same `phone:org` from both reaching the `isNew=true` branch

## Burst-explanation hypothesis (revised)

The "6+ blocked SMS rows in a single second at 2026-05-11 07:03:36" is **not Caroline auto-greeting**. Three lines of evidence:

1. **The recon itself attributes the rows to dev-host, not live customer sends** — `A2-provider-health.md` line 22: "The blocked rows are tagged with the dev-side TESTLANE guard string — these are dev-process writes, not live customer sends."
2. **The "Caroline from Serra Honda" greeting text only renders server-side from `server/test-trigger-2A.ts:104`** (one-shot CLI test script). Burst pattern of 6-7 rows in one second is consistent with sequential `processOutboundSend` calls inside one test invocation, a CI/E2E sweep, or a retry loop — not a scheduler interval.
3. **Real-customer SMS inbound to serra-honda has been silenced since 2026-04-14** (A2:62: "27 days of silence on real-customer inbound replies"), and the last 5 `sms_inbound_received` rows were all from `+14126546500` (operator self-tests). Caroline SMS path has had essentially no real customer triggers in this window — there cannot be an unthrottled customer-facing loop.

## Recommendation

**(c) No code change for launch. Caroline auto-greeting is already throttled by per-conversation gates. The recon's "unthrottled loop" framing does not match the code.**

### Concrete actions before flipping TESTLANE_MODE=false on the live Coolify container

1. **Sanity-check the `scheduled_actions` queue (this IS a separate code path with real fan-out — `server/services/scheduler.ts:66-136`, runs every 30s, processes `queued_sms` / `queued_immediate_trigger_sms` / `trigger_action`):**

   ```sql
   SELECT COUNT(*), action_type
   FROM scheduled_actions
   WHERE executed_at IS NULL
     AND organization_id = '<serra-honda-id>'
     AND action_type IN ('queued_sms','queued_immediate_trigger_sms','trigger_action')
   GROUP BY action_type;
   ```

   If non-zero, those WILL fire on the next tick after TESTLANE flips. Review and decide before the flip. **This is what an operator should actually worry about — NOT Caroline.**

   Per A1's earlier finding (zero `scheduled_actions` rows last 7 days; last `queued_sms` 2026-04-30; `queued_immediate_trigger_sms` never written), the queue is currently empty — but verify at the moment of the flip.

2. **Caroline itself**: no queued state, no scheduler entrypoint. Both paths are synchronous-on-trigger. Safe across the TESTLANE flip.

3. **Optional v2.2.x hardening (NOT a launch blocker):** add a per-org rate-limit (token bucket) at `processOutboundSend` entry as defense-in-depth against future scheduler regressions. Out of scope for v2.2 launch.

4. **Reclassify the recon's OOS-2 concern** (`A2-provider-health.md` line 133): from "launch-gate, unthrottled loop suspected" → "no-action / observation: dev-host TESTLANE blocks are expected audit noise; live behavior is per-conversation throttled."

## Two deltas of proof

### Δ1 — Code snippet (the throttle gate)

`server/routes/sms.ts:450` — entry to the SMS auto-greeting send block (excerpt):
```ts
if (isNew) {
  (async () => {
    try {
      const org = await storage.getOrganization(organizationId);
      if (!org || !org.outboundEnabled || !org.smsEnabled) return;
      if (process.env.OUTBOUND_LIVE_ENABLED !== "true") return;

      const orgAgents = await storage.getAgents(organizationId);
      const greetingAgent = orgAgents.find(a => a.autoGreeting && a.status === "active");
      if (!greetingAgent || !greetingAgent.autoGreeting) return;
      // ... business-hours fork, then ONE processOutboundSend call ...
```

`isNew=true` is reachable from exactly ONE branch (`sms.ts:447`: `return { conversation: conv, isNew: true };`) inside `withConversationLock` (`sms.ts:13-26`, acquired at `sms.ts:376`), after `getConversationByPhone` returned undefined and `createConversation` ran. One greeting per new conversation, max. Mutex prevents concurrent webhook double-fire.

### Δ2 — Cited audit evidence (the burst pattern is NOT a Caroline loop)

From `evidence/recon-2026-05-12-live-health/A2-provider-health.md`:
- **L22**: "The blocked rows are tagged with the dev-side TESTLANE guard string — **these are dev-process writes, not live customer sends**"
- **L30**: histogram row `sms | serra-honda | blocked | 50 | first=2026-05-06 22:29 | last=2026-05-11 07:03` — full 7-day window, ~7/day average, NOT a continuous loop
- **L60**: "Last 5 `sms_inbound_received` on serra-honda: ALL had sender `+14126546500` (operator)" — the only real inbound SMS triggering Path B since launch were operator self-tests

From `evidence/recon-2026-05-12-live-health/A1-db-followup-audit.md`:
- **L79**: "Chain is intact and end-to-end correct — but only for the TESTLANE whitelist phone, and only up to 2026-04-30. There is no record in the database of trigger code firing on a non-whitelisted (real customer) lead, in any org, ever."

## Final verdict

**PASS — Caroline is safe across the TESTLANE flip. The ACTUAL pre-flip check the operator should run is on `scheduled_actions` queue (separate code path).**
