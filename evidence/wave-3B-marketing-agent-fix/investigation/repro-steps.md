# Marketing Agent Error Reproduction — Wave 3B Phase 1

**Captured:** 2026-05-10T05:45Z
**Environment:** dev pm2 `nexxus-app` on `localhost:5000` (PID 1252634)
**User:** `serra_honda@huminic.ai` (org_admin, Serra Honda)
**Tools:** Playwright MCP + curl probes

## Steps that surface the error

1. Navigate to `http://localhost:5000/login`.
2. Sign in with `serra_honda@huminic.ai` / `NexxusTest2026`.
3. From left nav, click **Marketing** -> URL becomes `/marketing` (defaults to Dashboard sub-tab).
4. Click the **Agents** sub-tab. Five agent cards render: Photo Studio, Video Producer, Copywriter, Creative Director, Market Intel. (Note: DB also has a 6th row "Marketing Agent" but the client-side `MARKETING_AGENTS` constant only lists five; this is a known shape, not the bug.)
5. Click the **Copywriter** card -> opens `AgentChatView` (text-only agent — no FAL/Maps dependencies).
6. Type into the chat textarea: `Write a 1-line headline for a 2024 Honda Pilot`.
7. Press **Enter** to send.
8. Observe: a streaming "Copywriter is working..." indicator briefly appears, then is replaced by the assistant message:

   > Sorry, I encountered an error connecting to the AI service. Please try again.

## Visual symptom

- Generic error bubble in the chat thread under the user message.
- No actionable detail surfaced to the operator.
- Error occurs **on every send** — not intermittent.

## Network observations (from Playwright MCP `network-failures.json`)

| Request | Status | Notes |
|---|---|---|
| `POST /api/auth/login` | 200 | OK |
| `POST /api/openai-proxy` | **401** | First send |
| `POST /api/auth/refresh` | 200 | Client retried after 401 (per AgentChatView.tsx line 437–452) |
| `POST /api/openai-proxy` | **401** | Retry also failed — same 401 from OpenAI |

The 401 from `/api/openai-proxy` is NOT an auth-token problem on Nexxus's side — Nexxus auth refresh succeeded between attempts. The 401 is bubbled up from OpenAI itself.

## Server-side confirmation (curl probe with valid Nexxus token)

```
$ curl -X POST http://localhost:5000/api/openai-proxy \
    -H "Authorization: Bearer <serra_honda token>" \
    -H "Content-Type: application/json" \
    -d '{"model":"gpt-4o","messages":[{"role":"user","content":"hello"}]}'

HTTP/1.1 401
{"message":"OpenAI request failed",
 "error":"{\"error\":{\"message\":\"Incorrect API key provided: sk-proj-...OxMA. You can find your API key at https://platform.openai.com/account/api-keys.\",\"type\":\"invalid_request_error\",\"code\":\"invalid_api_key\",\"status\":401}}"}
```

The configured `OPENAI_API_KEY` on the dev `nexxus-app` PM2 process is rejected by OpenAI as an invalid key. The OpenAI redacted suffix is `...OxMA` (prefix `sk-proj-`).

## Secondary observations (not the headline bug, but relevant)

1. `GOOGLE_MAPS_API_KEY` is **not configured** on the dev server.
   ```
   $ curl -X POST /api/maps-proxy ...
   503 {"message":"GOOGLE_MAPS_API_KEY is not configured"}
   ```
   Impact: Market Intel agent's `scan_competitor_radar` tool falls back to mock competitor data (graceful but not real). The `tool-executor.ts` catches this and uses `generateMockCompetitors` (line 738). The radar UI shows "demo data" badge.

2. `tool-executor.ts` body shape mismatch with `proxy.ts` for `/api/maps-proxy`:
   - Client sends `{address, radiusMiles, focusBrands}` (`tool-executor.ts:713`)
   - Server expects `{action, params:{address, ...}}` (`proxy.ts:175`)
   - Client never gets real Maps results; always lands in the catch block. The fallback path is the *only* path currently exercised. Pre-existing bug, NOT a new regression.

3. `FAL_KEY` is configured and `/api/fal-proxy` returns 200 — the Photo Studio image generation path would work IF the chat router (which is broken) could ever reach the tool execution step.

## Files referenced

- `client/src/components/marketing/AgentChatView.tsx` lines 374–456 (chat send + 401 retry)
- `client/src/lib/tool-executor.ts` lines 388–417 (openaiChatCompletion helper used by score/copy/radar agents)
- `client/src/lib/marketing-agents.ts` (5-agent registry, system prompts, tool defs)
- `server/routes/proxy.ts` lines 118–164 (`/api/openai-proxy` handler — relays to `https://api.openai.com/v1/chat/completions`)
- `ecosystem.config.cjs` (`--env-file=.env` loads keys; ANTHROPIC_API_KEY confirmed in /proc/PID/environ; OPENAI_API_KEY present but rejected by OpenAI)
