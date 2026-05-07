# Wave 2A-T Chunk T2 — VAPI Agent-to-Agent Provider Proof (Elliott → Nancy)

**Status:** PASS — VAPI call placed end-to-end, both endpoints AI agents we control.
**Date:** 2026-05-07
**Branch:** `wave/10-bg/2A-T-trigger-proof` (HEAD pre-T2 evidence: `b6dfe1a`)
**Builder:** isolated `Agent` (Opus 4.7, 1M ctx), 3rd dispatch
**Operator authorization:** in-chat 2026-05-07 — operator clarified Elliott→Nancy is the established autonomous-test pattern at Serra Honda; both ends are AI agents we control; no real human, no real customer.

---

## Run command

```bash
set -a && source .env && set +a && \
  npx tsx server/test-trigger-2A.ts testT2VapiElliottToNancy
```

- Run **exactly once** (per T2 spec halt rule).
- tsx exit code: **0** (process.exit(0) reached after RESULT JSON emitted; no halt-throw).

## Endpoint identification (both ends AI we control)

| Role | Identity | Source |
|---|---|---|
| Outbound assistant | **Elliott** `c303d993-bf42-4784-a8cb-247477b1cbdd` | env `TEST_ELLIOTT_ASSISTANT_ID`, allowlisted `vapi_test_agent` in `.claude/state/test-recipients.txt:36` |
| Outbound phoneNumberId | `a85a9397-25cb-4e35-b784-05cfa5a926b2` (Elliott's caller-ID number) | env `TEST_ELLIOTT_PHONE_ID` (default from `utilities/elliott-test.ts:17`) |
| Inbound phone (dialed `customer.number`) | `+19014361271` (Serra Honda **service** VAPI number) | `utilities/elliott-test.ts:21`, `legacy-artifacts/.governor/sprint-specs/T-017b-comms-service.json:32` |
| Inbound assistant (VAPI inbound routing) | **Nancy Gaston** `c777f029-8c4c-4a23-98e4-3adfd4112a61` | `utilities/replay-leads.ts:67`, `utilities/send-lead-email.ts:24`, `evidence/I-4.2/verification-result.md:28`, `legacy-artifacts/.governor/evidence/T-016/vapi-audit.md:11,32` |
| Organization | Serra Honda (`a9f40650-dc8e-4a86-b0b6-5b94ea5b63ee`) — `serra-honda` slug | `server/comms-test.ts:70`, seed |

Both endpoints are AI assistants under our control. Nancy's number is the dealership service AI inbound, NOT a real customer touchpoint.

## VAPI provider response

| Field | Value |
|---|---|
| HTTP status | **201 Created** |
| Endpoint | `POST https://api.vapi.ai/call/phone` |
| Call ID | **`019e03da-e46e-7000-83f9-5c9128e7f0b0`** |
| `assistantId` (echo) | `c303d993-bf42-4784-a8cb-247477b1cbdd` (Elliott — matches request) |
| `phoneNumberId` (echo) | `a85a9397-25cb-4e35-b784-05cfa5a926b2` |
| `customer.number` (echo) | `+19014361271` (Nancy — matches request) |
| `customer.name` (echo) | `TESTLANE Wave 2A-T T2 — Nancy` |
| `type` | `outboundPhoneCall` |
| Initial status | `queued` |
| `phoneCallProvider` | `vapi` |
| `transport.provider` | `vapi.sip` |
| `orgId` (VAPI org) | `60c2f8db-e089-43ea-9f46-5e9d350d1ee6` |
| `createdAt` | `2026-05-07T19:12:17.518Z` |
| Concurrency | `9 / 10` remaining (not blocked) |
| Monitor listen URL | `wss://phone-call-websocket.aws-us-west-2-backend-production1.vapi.ai/019e03da-…/listen` |

## Call status progression (3 polls, ~6s spacing — GETs only, NOT additional calls)

| Poll | At (UTC) | status | startedAt | endedAt | endedReason |
|---|---|---|---|---|---|
| (create) | 2026-05-07T19:12:17.518Z | queued | — | — | — |
| #1 | 2026-05-07T19:12:24.559Z | **in-progress** | 2026-05-07T19:12:19.355Z | — | — |
| #2 | 2026-05-07T19:12:30.707Z | in-progress | 2026-05-07T19:12:19.355Z | — | — |
| #3 | 2026-05-07T19:12:36.931Z | in-progress | 2026-05-07T19:12:19.355Z | — | — |

`status` transitioned `queued → in-progress` ~2s after creation, with `startedAt=2026-05-07T19:12:19.355Z`. The script's polling window (≤18s post-create) ended while the call was still active — both AI assistants were on the line. The call's eventual `ended` snapshot can be retrieved via `GET https://api.vapi.ai/call/019e03da-e46e-7000-83f9-5c9128e7f0b0` once the call wraps; polling further inside this script was deliberately bounded to keep the run short (no second `/call` POST is performed).

## Halt-condition checklist

| Condition | Status | Evidence |
|---|---|---|
| Outbound assistant matches Elliott (allowlisted) | **PASS** | `assistantId == c303d993-bf42-4784-a8cb-247477b1cbdd`; `vapi_test_agent` entry at `.claude/state/test-recipients.txt:36` |
| Inbound number is Nancy's Serra Honda **service** number (operator-authorized this session for agent-to-agent test) | **PASS** | `customer.number == +19014361271`; mapped to `Nancy Gaston` (`c777f029-…`) per multiple legacy/evidence files |
| No real human at either end | **PASS** | Both endpoints are AI assistants (Elliott — outbound test; Nancy — Serra Honda service inbound). Elliott calls dealership-AI Nancy. No customer routing. |
| Single call placed (not multiple) | **PASS** | One `POST /call/phone` (creation); subsequent fetches were `GET /call/{id}` polls, NOT additional `/call` POSTs |
| VAPI returned 2xx | **PASS** | HTTP 201 |
| Call ID returned | **PASS** | UUID `019e03da-e46e-7000-83f9-5c9128e7f0b0` |
| Schema unchanged / no production code modified | **PASS** | Diff scope: only `server/test-trigger-2A.ts` (test-only) plus this proof file |
| Script run exactly once | **PASS** | Exit code captured from RESULT JSON's process.exit(0); no re-run for echoing |

All halt checks PASS.

## Files touched (this chunk)

- `server/test-trigger-2A.ts` — added `testT2VapiElliottToNancy()` function + CLI dispatch case. No edits to T1 helpers.
- `evidence/wave-2A-trigger-provider-proof/chunk-T2/proof.md` — this file.

No edits to: `server/services/triggerService.ts`, `server/outbound.ts`, `server/comms-test.ts`, schema, migrations, or any other production file.

## Allowlist gap (surfaced for follow-up)

`.claude/state/test-recipients.txt` (current snapshot) contains:
- `vapi_test_agent:c303d993-bf42-4784-a8cb-247477b1cbdd` (Elliott) — covered.
- No entry for `+19014361271` (Nancy's phone) and no entry for `c777f029-8c4c-4a23-98e4-3adfd4112a61` (Nancy's assistant ID).

The operator's verbal authorization in this chat (2026-05-07) covers this dispatch — operator explicitly framed Elliott→Nancy as the established agent-to-agent test pattern. For future autonomous coverage without per-session re-authorization, recommend operator add:

```
# ── vapi_test_agent ──────────────────────────────────────────────────────────
# Nancy Gaston (Serra Honda service inbound assistant) — agent-to-agent test counterparty
vapi_test_agent:c777f029-8c4c-4a23-98e4-3adfd4112a61
# Nancy's Serra Honda service VAPI inbound number (dialed by Elliott in agent-to-agent tests)
vapi_test_phone:+19014361271
```

Surfaced here per CLAUDE.md "Explicit over implicit" — not silently filling a gap. This is operator-discretion to populate; this dispatch did not modify the allowlist file.

## Mental-model correction (vs prior dispatch)

The prior dispatch (`evidence/wave-2A-trigger-provider-proof/chunk-T2/blocker-finding.md`) correctly halted on the assumption that VAPI has no "AI-to-AI without PSTN" path. That is technically true at the API level — VAPI's `/call/phone` always routes through PSTN — and that dispatch chose to escalate rather than improvise. The operator's clarification this session resolved the ambiguity:

> "Both ends are AI agents we control" does not mean "no PSTN leg". It means "PSTN endpoint at each end is owned by us and routed to an AI assistant we control" — Elliott on the outbound caller-ID `+1??????????`, Nancy on Serra Honda service inbound `+19014361271`. PSTN is the transport; both endpoints are still AI.

This dispatch executed against that resolved model.

## Two deltas of proof

- **Delta 1 (runnable test):** `npx tsx server/test-trigger-2A.ts testT2VapiElliottToNancy` returned exit code 0 with `callPlaced: true`, halt checks all PASS, console log preserved (full output in this proof and in tsx stdout above the `RESULT:` line).
- **Delta 2 (independent observation):** VAPI provider returned HTTP 201 with a real call UUID `019e03da-e46e-7000-83f9-5c9128e7f0b0`, monitor listen URL, and `status: queued → in-progress` with `startedAt=2026-05-07T19:12:19.355Z`. Three independent `GET /call/{id}` polls confirmed `status=in-progress` and consistent `startedAt`, demonstrating VAPI is actually running the call (not just echoing the request).

Independent operator-side delta available on demand: VAPI dashboard call detail at `https://dashboard.vapi.ai/calls/019e03da-e46e-7000-83f9-5c9128e7f0b0` will show Elliott as the assistant, Nancy's number as the customer, and the eventual transcript / cost / endedReason once VAPI finalizes the call.

---

**Files inspected (read-only) during this chunk:**
- `/home/ubuntu/Claude-store/nexxus2.2_replit/server/test-trigger-2A.ts` (T1 baseline)
- `/home/ubuntu/Claude-store/nexxus2.2_replit/server/comms-test.ts` (`testVapiOutboundCall`, `testVapiAgentToAgentCall` — confirmed misnamed; not used)
- `/home/ubuntu/Claude-store/nexxus2.2_replit/server/vendorProxy.ts` (`vapiPost` — used inline `fetch` instead, mirroring `utilities/elliott-test.ts`)
- `/home/ubuntu/Claude-store/nexxus2.2_replit/utilities/elliott-test.ts` (established `/call/phone` pattern with phoneNumberId)
- `/home/ubuntu/Claude-store/nexxus2.2_replit/utilities/replay-leads.ts` (Nancy assistant ID confirmation)
- `/home/ubuntu/Claude-store/nexxus2.2_replit/utilities/send-lead-email.ts` (Nancy assistant ID confirmation)
- `/home/ubuntu/Claude-store/nexxus2.2_replit/server/seed.ts` (Nancy is service department chat agent)
- `/home/ubuntu/Claude-store/nexxus2.2_replit/.claude/state/test-recipients.txt` (allowlist snapshot)
- `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/wave-2A-trigger-provider-proof/chunk-T2/blocker-finding.md` (prior dispatch context)
- `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/I-4.2/verification-result.md` (Nancy assistant ID + VAPI mapping)
- `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/G-4.1/verification-result.md` (Nancy assistant ID)

**Files modified this chunk:** `server/test-trigger-2A.ts` (added T2 function + CLI case), `evidence/wave-2A-trigger-provider-proof/chunk-T2/proof.md` (this file).
**Production code modified:** none.
**Schema / migration changes:** none.
**Commits made (after this proof is written):** 2 (test helper + evidence). Push: NOT performed.
