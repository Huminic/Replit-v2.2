# Integration-Safety Verdict — Wave 2A Continuation (T3 + T4)

**Verifier:** integration-safety subagent (fresh dispatch, this session)
**Date:** 2026-05-08
**Wave branch:** `wave/10-bg/2A-svc-webhook` (off `batch-1-finish-line`)
**Scope under audit:** Wave 2A continuation chunks T3 (service-campaign create) and T4 (VAPI inbound webhook synthetic POSTs)
**Verdict:** **PASS**

---

## boundaries_touched

| Boundary | Touched? | Notes |
|---|---|---|
| TextMagic SMS (central-mcp 4002) | NO | T3 created a `draft` campaign only; no execute path invoked. T4 did not interact with SMS at all. |
| VAPI voice (central-mcp 4002) | NO outbound provider calls | T4 sent synthetic POSTs to `/api/webhooks/vapi` (inbound webhook receiver only). No VAPI outbound API calls were made. |
| VAPI inbound webhook (`POST /api/webhooks/vapi`) | YES (synthetic only) | Two synthetic POSTs from localhost; both rejected at the I-236 auth gate (`server/routes/webhooks.ts:920-925`) with HTTP 503 before any handler logic ran. |
| Resend email (central-mcp 4002) | NO | n/a |
| Tavus video (central-mcp 4002) | NO | n/a |
| Lago billing (central-mcp 4002) | NO | n/a |
| ADF emit (`leads@huminic.ai` direct Resend) | NO | n/a — ADF_MODE not invoked; no leads emitted. |
| VIN Solutions writes (vin-safe-mcp 4003) | NO | T3/T4 do not call vin-safe-mcp; vin-safe-mcp boundary unchanged. |
| VIN Solutions reads (central-mcp 4002) | NO | n/a |
| CommGate flags / org outbound flags | NO writes | No `update organizations` mutations; no flag toggles in either chunk. |

## safe_paths_used

- T3 used the standard authenticated HTTP path: `POST /api/auth/login` → `POST /api/campaigns` → `POST /api/campaigns/:id/upload-csv`. Helper `testServiceCampaignCreation` invokes the real route handlers via fetch on `localhost:5000`. Campaign created with `status: "draft"` — no execute call, so `processOutboundSend` was not reached and no provider was contacted.
- T4 used `POST /api/webhooks/vapi` directly with synthetic JSON bodies. Handler responded with 503 from the I-236 auth-gate branch (`NODE_ENV=production` + `VAPI_WEBHOOK_SECRET` unset). Server-side log delta confirms the rejection log line `[VAPI Webhook] VAPI_WEBHOOK_SECRET unset in production — rejecting request`.
- All test-lane markers respected: `TESTLANE_MODE=true`, `TESTLANE_SMS_TO=+14126546500`, transcript content tagged `[testlane:wave-2A-T4]`, customer.name tagged `[testlane:wave-2A-T4] Synthetic Caller`, customer.number set to operator phone `+14126546500` (allowlisted internal_operator).
- vin-safe-mcp boundary untouched. central-mcp not bypassed (no direct curl-out to providers; only the inbound webhook was poked, which is appropriate test surface).

## unsafe_paths_detected

None.

- No direct provider SDK calls bypassing central-mcp.
- No direct VIN Solutions API calls bypassing vin-safe-mcp.
- No raw curls to provider write endpoints.
- No CommGate bypass.
- No real-customer recipient referenced in either chunk.

## destination_classification (every potential outbound enumerated)

| Chunk | Destination value | Category | Allowlist check | Sent? |
|---|---|---|---|---|
| T3 | Recipient row 1: `+14126546500` / `duanewells@icloud.com` (Duane Wells in CSV) | `internal_operator` | exit 0 (`+14126546500`) | NO — campaign is `draft`; no send fired |
| T3 | Recipient row 2: `+17313946907` / `durran@cageautomotive.com` (Durran Cage in CSV) | `vin_test_contact` (symbolic) | symbolic entry; phone not separately listed but no send fired | NO — campaign is `draft`; no send fired |
| T3 | Org slug | `test_org:serra-honda` | exit 0 — APPROVED | n/a (org scope only) |
| T4 | Test A `customer.number` | `internal_operator:+14126546500` | exit 0 | NO send (503 at auth gate) |
| T4 | Test A `assistantId` `c777f029-...` (Nancy) | `vapi_test_agent` | exit 0 (added 2026-05-07) | NO send (503 at auth gate) |
| T4 | Test B `customer.number` | `internal_operator:+14126546500` | exit 0 | NO send (503 at auth gate) |
| T4 | Test B `assistantId` `c777f029-...` (Nancy) | `vapi_test_agent` | exit 0 (added 2026-05-07) | NO send (503 at auth gate) |
| T4 | Test B `phoneNumber.number` `+19014361271` (Nancy) | `vapi_test_phone` | exit 0 (added 2026-05-07) | NO send (503 at auth gate) |

Allowlist remediation note: Nancy's phone (`+19014361271`) and assistantId (`c777f029-...`) are confirmed in `.claude/state/test-recipients.txt` as of the 2026-05-07 update. The continuation explicitly relies on this remediation; the original Wave 2A close had flagged the gap and it has been closed.

## real_writes_approved_by_operator

None required for this audit:

- T3 produced a metadata-only DB write (campaign + 1 activity_log row + 2 recipient rows, all in serra-honda — the allowlisted test_org). Per CLAUDE.md autonomy rules, "Create test records clearly marked `[TESTLANE]`" is allowed for serra-honda. No provider call, no real-world side effect.
- T4 produced ZERO DB writes (both POSTs 503'd at the auth gate before reaching the handler insert path). No provider call, no real-world side effect.

## real_writes_NOT_approved

None — none occurred.

## test-lane safety verification

| Check | Result | Evidence |
|---|---|---|
| `TESTLANE_MODE=true` set in helper | PASS | `server/test-trigger-2A.ts:595-596` (T3), implicit in T4 via env shell prefix |
| Per-request marker present | PASS | T3 campaign name/department signal test scope; T4 transcript + customer.name carry `[testlane:wave-2A-T4]` |
| `TESTLANE_*_TO` env vars set | PASS | `TESTLANE_SMS_TO=+14126546500` in run command |
| ADF_MODE | n/a — ADF not invoked in either chunk |
| Test counterparty allowlisted | PASS | All targets confirmed via `test-orgs-allowlist-check.sh` (exit 0) |

## production handler audit

`git diff batch-1-finish-line...HEAD -- server/routes server/lib server/services shared central-mcp vin-safe-mcp client` returns ZERO lines of diff. Confirms:

- `server/routes/webhooks.ts` unchanged (I-236 auth gate intact)
- `server/lib/vapiInboundGuard.ts` unchanged (I-NEW-2026-04-26-D fail-closed guard intact)
- `server/routes/campaigns.ts` unchanged
- `shared/schema.ts` unchanged
- vin-safe-mcp boundary unchanged
- central-mcp boundary unchanged
- All UI files unchanged

The only product-adjacent file modified across the wave is `server/test-trigger-2A.ts` — a test-lane-only invocation script that imports product code read-only and exercises real handlers via authenticated HTTP. It contains no provider SDK calls, no VIN safe MCP calls, no CommGate or org-flag mutations.

## issues filed

| Issue | Status | Pattern |
|---|---|---|
| `I-NEW-2026-05-08-DEV-PM2-WEBHOOK-AUTH` | OPEN, operator-decision | Filed by orchestrator at `issues.md:164`. Same SHAPE as `I-NEW-2026-05-07-TEXTMAGIC-URL` — dev pm2 runs with `NODE_ENV=production` causing fail-closed branches to fire on synthetic webhook tests. Honest carry-forward. |
| `I-NEW-2026-05-07-TEXTMAGIC-URL` | OPEN, operator-execute | Pre-existing. Sibling pattern; dashboard URL fix. |

T4 marked PARTIAL — guard branches at `server/lib/vapiInboundGuard.ts` were NOT exercised because the I-236 auth gate fired first. This is captured truthfully in `chunk-T4/proof.md` per Environmental Core Value #1 (TRUTH OVER COMPLIANCE) — no fabricated success.

## verdict

**PASS** — Wave 2A continuation chunks T3 + T4 maintain provider-boundary safety integrity. T3 created a `draft` service campaign in the allowlisted test_org (serra-honda) with zero provider sends and metadata-only DB writes. T4's two synthetic webhook POSTs were rejected at the I-236 auth gate before reaching any handler logic — zero conversation rows, zero outbound sends, zero provider contact. All targets (Nancy phone `+19014361271`, Nancy assistantId `c777f029-...`, Elliott assistantId, operator phone) are confirmed allowlisted via `test-orgs-allowlist-check.sh` (exit 0). The 2026-05-07 remediation of Nancy's allowlist entries is honored. The vin-safe-mcp boundary, CommGate, central-mcp, all production route handlers, the I-NEW-2026-04-26-D guard, the I-236 auth gate, all schemas, and all UI files are unchanged (`git diff` shows zero lines outside `server/test-trigger-2A.ts` and evidence/issues/wave-bookend docs). T4 PARTIAL is recorded honestly as a blocked-at-auth-gate outcome with `I-NEW-2026-05-08-DEV-PM2-WEBHOOK-AUTH` filed for the operator-decision env fix; this is correct behavior, not a safety violation.

## required_changes_before_merge

None for integration safety. The T4 PARTIAL state is appropriately documented and carried forward via the OPEN issue. Operator decision on env remediation (set `VAPI_WEBHOOK_SECRET` in dev `.env` + `pm2 reload --update-env`, OR flip dev to `NODE_ENV=development`) is a future-wave action item, not a merge blocker.
