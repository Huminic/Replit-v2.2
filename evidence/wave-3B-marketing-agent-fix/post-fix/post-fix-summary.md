# Wave 3B Marketing Agent Fix — Post-Fix Re-Verification Summary

**Task:** wave-3B-postfix
**Date (UTC):** 2026-05-10T17:14Z (pm2 reload) — 2026-05-10T17:18Z (final probe)
**Branch:** wave/6-marketing/3B-agent-fix
**Verifier:** qa-evaluator (Phase 3)
**Verdict:** **PASS**

## Context

Phase 1 investigation (earlier today) identified that the Marketing Copywriter agent's chat returned a generic "Sorry, I encountered an error connecting to the AI service" toast. Root cause: `OPENAI_API_KEY` in dev was rejected by OpenAI with `invalid_api_key` (suffix `...OxMA`). Operator rotated the key and ran `pm2 reload nexxus-app --update-env` at 2026-05-10T17:14Z. Phase 3 re-verifies the same path.

## Side-by-side: Phase 1 (FAIL) vs Phase 3 (PASS)

### UI repro — login + Marketing/Agents/Copywriter + chat send

| | Phase 1 (FAIL) | Phase 3 (PASS) |
|---|---|---|
| Login | serra_honda@huminic.ai | serra_honda@huminic.ai |
| Path | /marketing -> Agents -> Copywriter | /marketing -> Agents -> Copywriter |
| Prompt sent | "Write a 1-line headline for a 2024 Honda Pilot" | "Generate a 30-word special offer for a 2024 Honda Civic." |
| Assistant response | "Sorry, I encountered an error connecting to the AI service. Please try again." | "Could you please provide a key selling point for the 2024 Honda Civic so I can generate the best possible special offer?" (coherent clarifying question, no error toast) |
| Browser console | repeated 401 fetch errors on /api/openai-proxy | clean (no info+ or error messages during the action sequence) |
| Network log on send | POST /api/openai-proxy -> 401 | POST /api/openai-proxy -> 200 (line 25 of network-all-raw.json) |

### Boundary probe — direct curl

| | Phase 1 (FAIL) | Phase 3 (PASS) |
|---|---|---|
| Method | POST /api/openai-proxy with serra-honda admin Bearer token | POST /api/openai-proxy with serra-honda admin Bearer token |
| HTTP status | 401 | **200** |
| Body | `{"code":"invalid_api_key","message":"Incorrect API key provided: sk-proj-...OxMA"}` | `{"id":"chatcmpl-De251IyE...","object":"chat.completion","model":"gpt-4o-mini-2024-07-18", ... "usage":{"prompt_tokens":9,"completion_tokens":20,"total_tokens":29}, ...}` |
| Result | OpenAI rejected the dev key | OpenAI accepted the rotated key; real completion returned |

### Conclusion

Both deltas — UI repro and independent curl boundary probe — flipped from FAIL to PASS on the same endpoint (`POST /api/openai-proxy`). The fix (key rotation + pm2 reload) is in effect.

## Two deltas of proof

**Delta 1 — UI test (Playwright MCP recorded session):**
- Path: evidence/wave-3B-marketing-agent-fix/post-fix/screenshot-success.png
- Path: evidence/wave-3B-marketing-agent-fix/post-fix/network-all-raw.json (line 25 = `[POST] /api/openai-proxy => [200] OK`)
- Path: evidence/wave-3B-marketing-agent-fix/post-fix/network-success.json (structured comparison)
- Path: evidence/wave-3B-marketing-agent-fix/post-fix/console-clean.txt
- Result: PASS

**Delta 2 — Independent boundary probe (curl):**
- Path: evidence/wave-3B-marketing-agent-fix/post-fix/boundary-probe-success.txt
- HTTP 200 with real OpenAI chat.completion object (29 tokens used)
- Result: PASS

## Edge cases tested

- Same login used in Phase 1 (no caching artifacts)
- Different prompt content (Civic vs Pilot) to avoid any client-side reuse of cached error
- Both UI flow and direct API call exercised independently
- Phase 1 error message is still visible in the chat history (the new exchange is appended, confirming the same conversation context, no DB wipe)

## Regressions / new issues observed

**none.** The Marketing v2.3 preview banner and read-only-outbound notice are unchanged. No new console errors. No network failures other than the pre-existing 502s (none observed in this session). pm2 process was 75s old at start of action sequence — no instability.

## Operator-visible summary

Marketing Copywriter agent now responds coherently to chat messages on Serra Honda; the `/api/openai-proxy` endpoint returns HTTP 200 with a real OpenAI completion under both real-user UI flow and direct curl boundary probe. The Phase 1 401 `invalid_api_key` failure is fully resolved by the operator's key rotation + pm2 reload at 17:14Z. Two independent deltas of proof captured; no regressions observed.
