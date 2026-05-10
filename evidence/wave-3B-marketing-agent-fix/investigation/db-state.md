# DB State — Marketing Agents for Serra Honda

**Captured:** 2026-05-10T05:45Z
**DB:** `DATABASE_URL` (Supabase Postgres, shared dev/live)
**Org slug:** `serra-honda` -> `id = 24d64f99-ba04-4b43-af35-fd06f555ac86`

## organizations row

| slug | id |
|---|---|
| serra-honda | 24d64f99-ba04-4b43-af35-fd06f555ac86 |

## Module flags on `organizations` (no PII shown — only flag columns)

`outbound_enabled`, `sms_enabled`, `phone_enabled`, `email_enabled`, `video_enabled` — these are boolean module flags. None of these gate the marketing AGENT chat path, which is purely a client-side tool registry that calls `/api/openai-proxy`. So the flags are not the cause of the failure.

## agents rows for `department='marketing'` (organization = serra-honda)

Count: **6** rows; status = `active` for all.

| name | id | department | type | status |
|---|---|---|---|---|
| Photo Studio | dacc7d8d-df16-4b83-8046-b4d4ca3984c1 | marketing | ai | active |
| Video Producer | 961ed6f9-397e-49db-82f8-48cae5090468 | marketing | ai | active |
| Copywriter | 257d4200-fa5a-4eb1-903f-56c7e7e7b4cd | marketing | ai | active |
| Market Intel | 353bfc51-9271-4668-af10-c382bfcb638e | marketing | ai | active |
| Creative Director | c5bbcb75-31b0-41bb-91c4-3cc3fc5a6890 | marketing | ai | active |
| Marketing Agent | 2bfc1914-5341-44ba-b1d7-bc54bebdc336 | marketing | ai | active |

Note: the marketing UI lists 5 agents (defined in `client/src/lib/marketing-agents.ts` `MARKETING_AGENTS` constant). The 6th DB row "Marketing Agent" is NOT used by the marketing tab UI — likely a legacy row. Not the cause of this bug.

## agents column shape

`id, name, department, type, status, description, channels, dealership, assigned_phone, customer_link, vapi_assistant_id, tavus_persona_id, instructions, auto_greeting, settings, triggers, organization_id, created_at, updated_at`

There is no `anthropic_model` column and no per-org marketing agent system prompt override. The marketing agent's behavior is fully driven by the **client-side** `MARKETING_AGENTS` constant. So a missing or misconfigured DB row is **not** the cause of the symptom.

## agents-by-department on serra-honda

| department | count |
|---|---|
| sales | 4 |
| service | 2 |
| marketing | 6 |

All present, all active. **DB is healthy. The bug is not in the database.**
