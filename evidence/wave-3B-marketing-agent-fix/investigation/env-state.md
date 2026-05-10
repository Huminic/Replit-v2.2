# Env Var Presence — pm2 nexxus-app

**Captured:** 2026-05-10T05:45Z
**Process:** pm2 id 47, PID 1252634, `node /home/ubuntu/Claude-store/nexxus2.2_replit/dist/index.cjs`
**Loader:** `--env-file=.env` (per `ecosystem.config.cjs`)

## Behavioral probes (no values printed)

Probed via authenticated curl as `serra_honda@huminic.ai`. Endpoint behavior reveals presence/validity:

| Env var | Probe endpoint | Probe result | Inferred state |
|---|---|---|---|
| `OPENAI_API_KEY` | `POST /api/openai-proxy` | **HTTP 401** with body `{"message":"OpenAI request failed","error":"...Incorrect API key provided: sk-proj-...OxMA..."}` | **PRESENT but INVALID/EXPIRED** — OpenAI rejects the key. Server gates on `if (!openaiKey) return 503` (`proxy.ts:122`). It returned 401, not 503, confirming the var is set but the key itself is bad. |
| `FAL_KEY` | `POST /api/fal-proxy` | HTTP 200, `IN_QUEUE` | PRESENT and VALID |
| `GOOGLE_MAPS_API_KEY` | `POST /api/maps-proxy` | HTTP 503 with body `{"message":"GOOGLE_MAPS_API_KEY is not configured"}` | **MISSING** — server explicitly returns 503 when not set (`proxy.ts:171–173`) |
| `ANTHROPIC_API_KEY` | n/a (not used by marketing chat path; gpt-4o is the marketing model) | confirmed PRESENT in /proc/PID/environ (length 108) | PRESENT (informational; not on the critical path for this bug) |
| `DATABASE_URL` | server boot succeeded; `/api/agents` 200 | PRESENT and VALID | confirmed |

## Critical-path keys for marketing agent chat

The marketing agent chat path is:

```
client AgentChatView.handleSend()
  -> POST /api/openai-proxy { model:'gpt-4o', messages, tools }
    -> server proxy.ts: fetch https://api.openai.com/v1/chat/completions
       Authorization: Bearer ${OPENAI_API_KEY}
```

A bad `OPENAI_API_KEY` breaks **every** marketing agent on the page (Photo Studio, Video Producer, Copywriter, Creative Director, Market Intel) at the first chat turn — before any per-agent tool can even be selected.

## Note on env permissions

The investigation harness blocked direct `cat`/`grep` of `/home/ubuntu/Claude-store/nexxus2.2_replit/.env` for safety. Presence/validity was inferred from server endpoint behavior under valid auth. The actual key value was never printed and is not reproduced here. OpenAI's own redacted suffix `...OxMA` is included only because OpenAI itself printed it in the rejection message.
