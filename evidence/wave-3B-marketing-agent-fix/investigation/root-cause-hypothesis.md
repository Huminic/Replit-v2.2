# Root Cause Hypothesis — Marketing Agent Errors

**Captured:** 2026-05-10T05:45Z
**Verdict:** ERROR REPRODUCED
**Owner recommendation:** **config-only** (orchestrator can rotate the key; no code change required to clear the headline error)

## Headline error

Every marketing agent send returns:

> Sorry, I encountered an error connecting to the AI service. Please try again.

## Root cause (primary)

The `OPENAI_API_KEY` configured in the dev `nexxus-app` PM2 environment (loaded via `--env-file=.env` per `ecosystem.config.cjs`) is **rejected by OpenAI as invalid**.

Direct probe of `/api/openai-proxy` with a valid Nexxus session returns HTTP **401** carrying OpenAI's own response:

```json
{"error":{"message":"Incorrect API key provided: sk-proj-...OxMA. ...","type":"invalid_request_error","code":"invalid_api_key","status":401}}
```

The key has the `sk-proj-` prefix (project-scoped). It is most likely **expired, revoked, or rotated** since the operator last used the marketing agent successfully.

The server-side handler at `server/routes/proxy.ts:118–164` is correct — it relays the upstream 401 verbatim with `status(openaiResponse.status).json(...)`. The client at `client/src/components/marketing/AgentChatView.tsx:454–456` throws on `!res.ok` and the user sees the generic "Sorry, I encountered an error..." copy (line 542).

**This is consistent with the operator's verbatim signal:** "I've seen most of it working but there are errors now. It might not be set up properly." — a working OpenAI key was rotated/revoked since the last successful use; setup needs to be refreshed, no code is broken.

## Secondary issues (relevant but lower priority)

### S1. `GOOGLE_MAPS_API_KEY` is not configured

`/api/maps-proxy` returns HTTP 503 `{"message":"GOOGLE_MAPS_API_KEY is not configured"}`. This affects the **Market Intel** agent's `scan_competitor_radar` tool but not visibly:

- `client/src/lib/tool-executor.ts:705–744` wraps the call in `try/catch` and falls back to `generateMockCompetitors` on any failure (line 738). The radar artifact is rendered with `isDemo: true`.
- The user sees results either way; no error toast.
- A real fix here would either supply the key or the body shape (see S2).

### S2. Body shape mismatch on `/api/maps-proxy`

`tool-executor.ts:707–714` posts `{address, radiusMiles, focusBrands}`, but `server/routes/proxy.ts:175–214` expects `{action, params: {address|location|place_id, ...}}`. Even if `GOOGLE_MAPS_API_KEY` were configured, the request would be rejected with `400 "action is required (geocode, nearby, details)"`. This is a pre-existing bug — NOT a new regression.

The catch block at `tool-executor.ts:737` swallows the failure into the mock-data path so the user never sees an error. **Not the operator's reported bug.**

## Smallest fix to clear the headline error

Replace `OPENAI_API_KEY` in `/home/ubuntu/Claude-store/nexxus2.2_replit/.env` with a valid OpenAI key (the operator owns the OpenAI account). Then either:
- `pm2 reload nexxus-app --update-env` (reads the updated `.env`), OR
- `pm2 restart nexxus-app` (full restart with the new env file).

Verify by:
1. `curl -X POST http://localhost:5000/api/openai-proxy -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"model":"gpt-4o","messages":[{"role":"user","content":"hi"}]}'` -> expect HTTP 200 with a `choices[0].message.content` from gpt-4o.
2. Re-run the Playwright Copywriter chat repro -> expect the assistant message to be ad copy, NOT the error string.
3. (Bonus) Photo Studio / Video Producer paths should also be verified since they exercise the FAL chain after a successful chat router call.

## File:line citations

| What | File | Lines |
|---|---|---|
| Server openai proxy handler | `server/routes/proxy.ts` | 118–164 |
| Client chat send + 401 retry | `client/src/components/marketing/AgentChatView.tsx` | 374–456 |
| User-visible error string | `client/src/components/marketing/AgentChatView.tsx` | 538–547 |
| Tool executor openai helper | `client/src/lib/tool-executor.ts` | 388–417 |
| Marketing agents registry (5 agents, system prompts, tool defs) | `client/src/lib/marketing-agents.ts` | (whole file) |
| pm2 env loader | `ecosystem.config.cjs` | `node_args: "--env-file=.env"` |
| Maps proxy body shape (S2) — server expects `{action, params}` | `server/routes/proxy.ts` | 175–214 |
| Maps proxy body shape (S2) — client sends `{address, radiusMiles, focusBrands}` | `client/src/lib/tool-executor.ts` | 707–714 |

## Phase 2 fix proposal (1–3 sentences)

Rotate `OPENAI_API_KEY` in `/home/ubuntu/Claude-store/nexxus2.2_replit/.env` to a valid project key, then `pm2 reload nexxus-app --update-env`. This is a config-only change (no code edits needed); operator must supply the new key (irreversible action against an external provider account, requires explicit go). The maps body-shape bug (S2) is **out of scope** for Wave 3B because the operator's signal is "make existing agent work as it is" — the radar already works (via mock fallback) and behavior would change if we fixed S2 here.

## Recommended Phase 2 owner

**config-only** — orchestrator presents the rotation plan to operator, operator supplies the new key, orchestrator updates `.env` and reloads pm2. No `harness-backend` or `technical-architect` engagement needed for the headline bug.

If operator decides during Phase 2 to also fix S1 (supply Maps key) and/or S2 (align body shape), those are **separate, additive** changes and would require a `harness-backend` pass for S2 (UI lib file edit; lib files NOT under the UI-protection hook so no UI scope marker required, but verify-scope still applies).
