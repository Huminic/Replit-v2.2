# Wave 2A-T Chunk T2 — VAPI Agent-to-Agent Provider Proof — BLOCKER FINDING

**Status:** STOPPED. No VAPI call placed. No commits. No DB writes.
**Date:** 2026-05-07
**Builder:** isolated `Agent` (Opus 4.7, 1M ctx) under wave/10-bg/2A-T-trigger-proof
**Branch HEAD at stop:** `b6dfe1a` (T1 evidence commit)

---

## The blocker, in one sentence

The VAPI primitive `/call` requires a real PSTN-routed `customer.number`; there is no
true "agent-to-agent / no-PSTN" call path in the existing helper, AND the only
phone number the existing helper would dial (`+17313946907` Durran) is **NOT** on
`.claude/state/test-recipients.txt`. Proceeding would violate the explicit halt
condition in the T2 spec.

## Why this is a halt-condition violation, in detail

### 1. The T2 spec from the wave-bookend says, verbatim

`evidence/wave-2A-trigger-provider-proof/wave-bookend.md` line 17:

> **T2 (revised twice)** — VAPI agent-to-agent voice provider proof using existing
> `testVapiAgentToAgentCall` helper in `server/comms-test.ts:39`. Pivoted from
> "Email ratification" because Resend was already proven in Wave 1C; VAPI has NOT
> yet been proven end-to-end and is launch-critical for v2.2 voice flows.
> **Agent-to-agent (both AI assistants we control) → zero real customer impact;**
> uses `vapi_test_agent:c303d993-bf42-4784-a8cb-247477b1cbdd` (Elliott) per
> allowlist.

T2 dispatch prompt halt conditions:

> - Either end of the VAPI call is anything OTHER than an allowlisted vapi_test_agent
>   (Elliott or other listed in `.claude/state/test-recipients.txt`)
> - VAPI returns 4xx/5xx — capture and STOP
> - More than 1 call placed (script should place exactly 1)

### 2. What the existing helper actually does (server/comms-test.ts:39-65)

```ts
export async function testVapiAgentToAgentCall() {
  console.log("\n=== T1.1b: VAPI Agent-to-Agent — Elliott → Christine ===");
  // ...
  const callPayload = {
    assistantId: ELLIOTT_ID,                         // c303d993-bf42-4784-a8cb-247477b1cbdd
    customer: {
      number: TEST_CONTACTS.durran.phone,            // +17313946907  ← NOT allowlisted
      name: "Christine Test",
    },
    metadata: { test: true, purpose: "agent-to-agent-appointment-scheduling" },
  };
  const result = await vapiPost("/call", callPayload);
  // ...
}
```

The helper is named "agent-to-agent" but the payload calls a real PSTN number
(`+17313946907`, registered to Durran Cage). VAPI's `/call` API requires
`customer.number` — there is no `customer.assistantId` field. The "Christine"
naming in the comment is misleading — the helper does NOT route to Christine's
assistant ID (`d019ff3d-201b-4e2b-bf6a-590c19569fc8`); it dials Durran's phone
and lets the assistant talk to whoever picks up.

### 3. Allowlist status — verified

`.claude/state/test-recipients.txt` (current snapshot 2026-05-07):

| Category               | Entry                                    | Status |
|------------------------|------------------------------------------|--------|
| internal_operator      | `+14126546500`                           | OK     |
| internal_operator      | `duanewells@icloud.com`                  | OK     |
| test_email             | `duane.wells@huminic.ai`                 | OK     |
| vapi_test_agent        | `c303d993-bf42-4784-a8cb-247477b1cbdd` (Elliott) | OK |
| textmagic_test_number  | `+1XXXXXXXXXX` (3 placeholders)          | UNPOPULATED |
| vin_test_contact       | `Durran Cage` (symbolic; resolved via vin-safe-mcp) | symbolic only — NOT a phone number for VAPI |
| tavus_test             | `popup-only`                             | symbolic |

**`+17313946907` (Durran's PSTN number) is NOT in this allowlist.** The
`vin_test_contact:Durran Cage` entry is explicitly symbolic per the file comment:
"actual VIN identifiers ... are resolved via vin-safe-mcp prepare and shown to
operator before execute" — it does NOT authorize VAPI calls to Durran's phone.

### 4. VAPI API inspection

`server/vendorProxy.ts:165-176` — the `vapiPost` helper. POSTs to `https://api.vapi.ai{path}`
with the payload as-given. There is no transformation that would turn a
`customer.number` into an `assistantId-as-customer`.

`server/outbound.ts:354-396` — production `vapi_create_call` flow always uses a
formatted phone number (`customerNumber: formattedNumber`). No assistant-to-assistant
shape exists in the production code path either.

VAPI's documented API (api.vapi.ai/call POST) supports these recipient shapes:
- `customer.number` (E.164 PSTN — what the helper uses today)
- `customerId` (a previously created VAPI Customer record — still phone-backed)
- `phoneNumberId` + `customer.number` (uses an org-owned VAPI number as caller)

There is **no** documented `customer.assistantId` field for "AI talks to AI without
a phone." VAPI's "test agents" feature (LLM-played simulator user) is a separate
product (Test Suites) with its own API surface (`/test-suite-runs`), not `/call`.

## Why I am stopping rather than improvising

CLAUDE.md, "Environmental Core Values":
- Rule 1: Truth over compliance. Proceeding with a misnamed helper that dials
  a non-allowlisted PSTN number to satisfy "agent-to-agent" would fabricate the
  semantic of the proof.
- Rule 2: Follow the rules — do not work around them. The halt condition is
  explicit: "Either end of the VAPI call is anything OTHER than an allowlisted
  vapi_test_agent ... STOP IMMEDIATELY."
- Rule 13: If any action risks violating these values: stop, ask, do not proceed.

T1 builder discipline carry-over (wave-bookend mid-revision called this out):
> "DO NOT REPEAT THIS PATTERN. Capture the exit code from the script's RESULT
> JSON ... Run the script EXACTLY ONCE."

If I run the existing helper, the call dials `+17313946907` — a non-allowlisted
real PSTN number. Even if that number reaches voicemail or no human, the act of
placing the call is itself a halt-condition violation per the T2 spec.

## What was discovered (factual record)

1. `.env` keys present: `VAPI_PRIVATE_KEY` (36 chars). The env var the
   existing helper uses (`vapiPost` in `vendorProxy.ts:158-176`) is wired correctly.
2. `TEST_ELLIOTT_ASSISTANT_ID`, `TEST_DURRAN_PHONE`, `TEST_DUANE_PHONE` are NOT
   set in `.env` — the helper falls back to hardcoded constants:
   - `ELLIOTT_ID` defaults to `c303d993-bf42-4784-a8cb-247477b1cbdd` (allowlisted)
   - `TEST_CONTACTS.durran.phone` defaults to `+17313946907` (NOT allowlisted)
   - `TEST_CONTACTS.duane.phone` defaults to `+14126546500` (allowlisted)
3. The existing `testVapiOutboundCall` (lines 10-37) calls Elliott → Duane's
   phone (`+14126546500`). That recipient IS allowlisted. But it is NOT
   "agent-to-agent" — it is "agent calls operator", which is the same path
   T1 already proved end-to-end via SMS (TextMagic message ID `1406916679`
   delivered to `+14126546500`).
4. Christine's assistant ID `d019ff3d-201b-4e2b-bf6a-590c19569fc8` (visible at
   `comms-test.ts:223`) is NOT in `.claude/state/test-recipients.txt` and would
   need operator approval to add as a vapi_test_agent before any agent-to-agent
   shape using Christine could be executed.
5. The git working tree at start: clean except evidence/watchdog-alerts.log
   (untracked), .claude/session-snapshot.md (untracked). No code modified.
   No commits made by this builder. No DB writes. No VAPI API calls.

## Options for operator decision (3 paths, in increasing order of scope)

### Option A — Lateral pivot: Elliott calls Operator (re-scope T2 to "VAPI outbound to allowlisted PSTN")

- Use the EXISTING `testVapiOutboundCall` helper (`comms-test.ts:10-37`).
- Recipient: `+14126546500` (operator's phone, fully allowlisted as `internal_operator`).
- Caller: Elliott (`c303d993-bf42-4784-a8cb-247477b1cbdd`, allowlisted vapi_test_agent).
- Operator answers call, exchanges 1-2 sentences with Elliott, hangs up.
- Evidence: VAPI call ID, assistantId, customer.number (operator), call status,
  transcript / recording URL once VAPI posts the call.ended webhook.
- Pros: Uses ONLY allowlisted entities. Real provider proof for VAPI outbound
  layer. Single SMS-equivalent ping (one phone ring to operator). Existing
  helper, no code changes needed.
- Cons: Not literally "agent-to-agent" (operator is the human end); but the
  point of T2 is "prove VAPI outbound provider integration end-to-end" and
  this proves it without violating any allowlist.

### Option B — True agent-to-agent: add Christine to allowlist, call Christine's PSTN

- Operator adds entry to `.claude/state/test-recipients.txt`:
  `vapi_test_agent:d019ff3d-201b-4e2b-bf6a-590c19569fc8  # Christine — Serra Honda inbound`
- Operator confirms: Christine has an associated VAPI phone number that is
  inbound-routable AND under our control AND not a real customer touchpoint.
- Add `textmagic_test_number` or `vapi_test_phone` entry for Christine's number.
- Update helper to dial Christine's actual PSTN (not Durran's).
- Pros: Literal "agent-to-agent" — both ends are AI assistants we control.
- Cons: Requires operator to populate allowlist + verify Christine's number is
  safe. Christine is the Serra Honda inbound dealership assistant — calling her
  number during business hours could collide with real-customer flows.
  This is OUT OF SCOPE for an autonomous builder.

### Option C — Defer T2 to a future wave; close 2A-T as T1-only

- Acknowledge that VAPI agent-to-agent without a PSTN leg is not supported by
  the existing primitive (`/call`).
- Defer to a future Wave 2A-V (VAPI proof) once operator has either:
  (a) added Christine or another inbound-routable assistant to the allowlist, or
  (b) expanded the harness to use VAPI Test Suites for true LLM-vs-LLM scenarios.
- Update the wave-bookend to reflect: T1 (SMS via TextMagic) proven; T2 deferred
  with explicit reason; Wave 2A-T closes as 1-of-2 chunks.

## Recommendation

**Option A** for the simplest forward path that proves the VAPI provider
integration without expanding scope.

Reasoning:
- The wave's stated goal (line 21 of wave-bookend) is "Validate that Trigger 1
  ... and Trigger 2 ... actually fire end-to-end through the TestLane to
  TextMagic with real provider message IDs and full audit trail." T1 already
  proved the SMS leg. The T2 pivot to VAPI was "because VAPI has NOT yet been
  proven end-to-end and is launch-critical for v2.2 voice flows."
- "Provider proven end-to-end" = "VAPI accepts our request, returns a call ID,
  the call connects to a real number, and we can pull a recording / transcript /
  status afterward." That is fully satisfied by Elliott → Operator. The
  "agent-to-agent" wording in the wave-bookend was an aspirational shorthand
  that turns out to not match what the existing helper actually does OR what
  VAPI's API natively supports.
- Calling the operator is consistent with the established testlane protocol
  (operator acknowledges the SMS pings on `+14126546500`; an audible phone
  call ping is the same kind of signal at a different channel).

## What I need from operator

Pick one of A / B / C. If A: confirm "go", and the operator should be near
their phone to answer the test call. If B: populate the allowlist file first
and confirm safety. If C: I will write the deferral CLOSING now.

---

**Files inspected (read-only):**
- `/home/ubuntu/Claude-store/nexxus2.2_replit/server/comms-test.ts`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/server/vendorProxy.ts`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/server/outbound.ts`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/server/test-trigger-2A.ts`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/.claude/state/test-recipients.txt`
- `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/wave-2A-trigger-provider-proof/wave-bookend.md`

**Files modified:** none.
**Commits made:** none.
**API calls made:** none.
**DB writes:** none.
