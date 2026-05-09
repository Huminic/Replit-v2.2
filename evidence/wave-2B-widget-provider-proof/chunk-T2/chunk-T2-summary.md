# Wave 2B-T2 — Chunk Summary

**Chunk:** T2 — Public Widget Voice Callback Provider Proof
**Endpoint:** `POST /api/widget/voice-callback` (`server/routes/public.ts:130-187`)
**Branch:** `wave/8-widget/2B-chat-callback-form` (worktree)
**Parent commit:** `cbcda57` (Wave 2B T1 — chat provider proof)
**Date of run:** 2026-05-09 (UTC `00:53:01–00:53:03`)
**Builder:** chunk-T2 builder (this turn)

## Inputs

| Field | Value |
|---|---|
| Org | `serra-honda` (id `24d64f99-ba04-4b43-af35-fd06f555ac86`) |
| Voice agent | `1e8607bb-0034-406f-a35b-b2e5f0aa6d0f` / Elliott vapiAssistantId `90a876c0-0f11-4424-abfe-9ac82b264d88` |
| Allowlist destination | `+19014361271` (Nancy, category `vapi_test_phone`) |
| Allowlist exit code | 0 (recipient) + 0 (org) — `allowlist-check.txt` |

## Outputs

| Field | Value |
|---|---|
| HTTP status | `200` |
| VAPI callId | `019e0a39-366a-700f-8829-2b212eaa7c2f` |
| Conversation id | `dbaab6ff-79a5-4c40-99fc-2fbcb9219948` |
| Conversation channel | `voice` |
| Conversation customer_phone | `+19014361271` |
| Conversation org | `24d64f99-…` (serra-honda) |
| Round-trip duration | `2703 ms` |
| Provider sends this turn | 1 (one VAPI call to Nancy) |
| Echo-reruns | 0 |

## Endpoint contract clarification

The handler accepts `{ slug, phoneNumber }`. Field names verified directly against source before invocation. No deviation from contract was needed.

## Halt-checks (all 7 PASS)

`status2xx` ✓ — `hasCallId` ✓ — `hasConversationId` ✓ — `conversationRowFound` ✓ — `conversationOrgMatchesSerraHonda` ✓ — `conversationChannelIsVoice` ✓ — `conversationPhoneMatches` ✓

## Files

| Path | Purpose |
|---|---|
| `server/test-widget-2B.ts` (appended) | T2 helper `testWidgetVoiceCallback` + CLI dispatch |
| `evidence/wave-2B-widget-provider-proof/chunk-T2/allowlist-check.txt` | Pre-call allowlist gate output (exit 0 + exit 0) |
| `evidence/wave-2B-widget-provider-proof/chunk-T2/run.log` | Full helper stdout (single invocation) |
| `evidence/wave-2B-widget-provider-proof/chunk-T2/delta-1-http.md` | Delta 1 — HTTP-layer evidence + endpoint contract |
| `evidence/wave-2B-widget-provider-proof/chunk-T2/delta-2-db.md` | Delta 2 — DB row + VAPI dashboard cross-check path |
| `evidence/wave-2B-widget-provider-proof/chunk-T2/chunk-T2-summary.md` | This summary |

## Constraints honored

- Endpoint contract verified BEFORE the invocation (slug + phoneNumber, exact field names)
- Allowlist exit-0 confirmed BEFORE the VAPI call
- Single invocation (no echo-rerun)
- No production endpoint code modified
- No UI files touched
- No filesystem changes outside `/home/ubuntu/Claude-store/nexxus2.2_replit/`
- Phone number called: `+19014361271` only (Nancy)
- pm2 / build / live deploy: NONE this turn

## Verdict

**PASS.** Two independent deltas of provider-grade evidence captured. VAPI call placed; DB row written; HTTP contract honored; halt-chain clean.
