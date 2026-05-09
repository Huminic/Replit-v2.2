# Wave 2B — Widget chat / callback / form provider proof

**Phase:** 8 (Widget + Public Entry)
**Branch:** `wave/8-widget/2B-chat-callback-form` off `batch-1-finish-line` @ `55727c8`
**Plan reference:** plan.md row 67 ("Widget chat / callback / form provider proof")

---

## OPENING (2026-05-09T00:42Z)

### Scope (canonical — three chunks, no sub-suffixes)

| Chunk | Endpoint | Provider | Recipient | Autonomy |
|---|---|---|---|---|
| **T1** | `POST /api/widget/chat` | Anthropic Claude (claude-sonnet-4-6) | none (server-side AI call) | autonomous |
| **T2** | `POST /api/widget/voice-callback` | VAPI (via central-mcp `vapi_create_call`) | Nancy `+19014361271` (vapi_test_phone allowlist) | autonomous |
| **T3** | `POST /api/widget/contact` | none (storage only) | none | autonomous |

**Out of scope (deferred):** Video session (`/api/widget/video-session`), inbound webhooks (`/api/webhooks/vapi`, `/api/webhooks/tavus`). Plan title for Wave 2B names exactly chat/callback/form. Webhook chunks are blocked by the same dev-env config that produced Wave 2A T4 PARTIAL (`I-NEW-2026-05-08-DEV-PM2-WEBHOOK-AUTH`).

### Allowlist verification

- **T2 destination:** Nancy phone `+19014361271`. Already in `.claude/state/test-recipients.txt` as `vapi_test_phone:+19014361271` (added 2026-05-07 during Wave 2A T2 remediation). No per-session re-authorization needed.
- **T1, T3 destinations:** server-side only; no external recipient.
- **T2 caller identity:** Elliott assistant on serra-honda (proven boundary in Wave 2A T2).

### Two deltas of proof — contract per chunk

| Chunk | Delta 1 (test result) | Delta 2 (independent observation) |
|---|---|---|
| **T1** | HTTP 200 response with non-stub assistant text + reply length > 20 chars | DB: `conversations` row with `channel='chat'` + `messages` rows (≥2: user + assistant) for the new conversation_id |
| **T2** | HTTP 200 response with VAPI `call_id` (not stub) | DB: `conversations` row with `channel='voice'` + provider call reference; VAPI dashboard log corroborating call attempt |
| **T3** | HTTP 200/201 response with `conversationId` | DB: `conversations` row with `channel='form'` + initial `messages` row containing form payload |

### Testing level

`sprint` (per `~/Claude-store/sysadmin/harness/TESTING_DOCTRINE.md`). Provider sends + DB writes + public-endpoint coverage exceeds step-level threshold.

### Verifier roster (4 at gate, parallel)

1. **blind-verifier** — cold-read evidence vs claims (no session context)
2. **scope-guardian** — changed files match declared scope; no UI files; no migrations
3. **drift-detector** — process discipline (no A/B/C, no options menus, no boundary expansion)
4. **integration-safety** — T2 VAPI provider boundary (allowlist enforcement, vin-safe-mcp untouched, no real-customer writes)

### Risk profile

| Risk | Mitigation |
|---|---|
| Real customer SMS/email send | T1 + T3 have no external recipient. T2 is VAPI-only to Nancy allowlist. CommGate untouched. |
| DB write outside autonomous categories | All writes are TestLane-tagged conversations (autonomous category per CLAUDE.md). Not migrations. Not customer leads. |
| UI file edits | None expected. Server-side endpoints + new test-lane invocation script only. |
| Cross-project edits | Forbidden per REM-8-DT. Builders constrained to `nexxus2.2_replit/`. |
| Live deploy | NO — wave merges to `batch-1-finish-line`; live deploy gate is Wave 11A. |

### Builder constraints (carried into each dispatch)

- Use isolated worktree (`isolation: "worktree"` in Agent dispatch).
- Add helper functions to `server/test-widget-2B.ts` (new file). Do NOT modify production endpoint code.
- Run via `npx tsx server/test-widget-2B.ts <fn>` — same pattern as Wave 2A `server/test-trigger-2A.ts`.
- Capture full HTTP request + response in `evidence/wave-2B-widget-provider-proof/chunk-T<N>/`.
- Capture DB SELECT (counts + key columns; no PII) for the new conversation_id.
- One run per chunk. Do NOT echo-rerun (Wave 2A T1 lesson — sent 2 SMS instead of 1).

### Governance corrections in force (no exceptions)

1. No A/B/C wave suffixes. Chunks decompose with T1/T2/T3.
2. Operator consulted only on functionality / UI / creative changes.
3. No "options" menus on next-session pick — plan dictates order.

### Posture at OPENING

- Working tree dirty entries: 6 (evidence/watchdog-alerts.log auto + 5 untracked unrelated to this wave).
- Branch `wave/8-widget/2B-chat-callback-form` created at `55727c8`.
- No unmerged work from prior wave; all 7 prior waves clean on `batch-1-finish-line`.
- pm2 `nexxus-app` running with build that already includes Wave 2A merges. No build/restart needed for Wave 2B (test-only changes).

---

(CLOSING to follow after all 3 chunks + 4 verifier verdicts.)
