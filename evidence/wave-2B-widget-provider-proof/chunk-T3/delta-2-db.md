# Wave 2B-T3 — Delta 2 (DB) — Widget Contact Form Provider Proof

**Date:** 2026-05-09 00:57:08 UTC
**Conversation id:** `e0c45066-daa3-4f14-a489-3fb4b123a34d`
**Org:** Serra Honda (`24d64f99-ba04-4b43-af35-fd06f555ac86`)
**Helper run log:** `evidence/wave-2B-widget-provider-proof/chunk-T3/run.log`

This delta is independent of Delta 1: Delta 1 captures the HTTP-layer
contract (request/response). Delta 2 reads the DB directly (`psql` on
the live `DATABASE_URL` — Supabase) and confirms the rows the endpoint
created.

## Conversations row (psql SELECT)

```sql
SELECT id, organization_id, channel, status,
       customer_name, customer_email, customer_phone,
       unread_count, last_message_at, created_at
FROM conversations
WHERE id = 'e0c45066-daa3-4f14-a489-3fb4b123a34d';
```

Result (1 row):

| column           | value                                  |
|------------------|----------------------------------------|
| id               | e0c45066-daa3-4f14-a489-3fb4b123a34d   |
| organization_id  | 24d64f99-ba04-4b43-af35-fd06f555ac86 (Serra Honda) |
| channel          | **form**                               |
| status           | open                                   |
| customer_name    | TESTLANE Wave2B-T3                     |
| customer_email   | duane.wells@huminic.ai                 |
| customer_phone   | +19014361271                           |
| unread_count     | 1                                      |
| last_message_at  | 2026-05-09 00:57:08.609 UTC            |
| created_at       | 2026-05-09 00:57:08.67629 UTC          |

## Messages row (psql SELECT)

```sql
SELECT id, conversation_id, role, sender_name,
       LEFT(content, 240) AS content_preview, created_at
FROM messages
WHERE conversation_id = 'e0c45066-daa3-4f14-a489-3fb4b123a34d'
ORDER BY created_at ASC;
```

Result (1 row — exactly one):

| column           | value                                  |
|------------------|----------------------------------------|
| id               | 9ca6b0b5-eb60-4500-b261-d2b2c29aec37   |
| conversation_id  | e0c45066-daa3-4f14-a489-3fb4b123a34d   |
| role             | **user**                               |
| sender_name      | TESTLANE Wave2B-T3                     |
| created_at       | 2026-05-09 00:57:08.763476 UTC         |

### Full content of the messages row

```
Contact Form Submission

Name: TESTLANE Wave2B-T3
Email: duane.wells@huminic.ai
Phone: +19014361271

Message:
Test form submission for Wave 2B T3 widget provider proof
```

This matches verbatim the format produced by the handler at
`server/routes/public.ts:114`:

```ts
const formContent = `Contact Form Submission\n\nName: ${name}\nEmail: ${email}${phone ? `\nPhone: ${phone}` : ""}\n\nMessage:\n${message}`;
```

## Halt checks (DB layer)

| Check                                 | Value                                   | Pass |
|---------------------------------------|-----------------------------------------|------|
| Conversation row found by id          | yes                                     | YES  |
| `organization_id == serra-honda.id`   | 24d64f99-…ac86 == 24d64f99-…ac86        | YES  |
| `channel == "form"`                   | form                                    | YES  |
| `customer_email == requested email`   | duane.wells@huminic.ai                  | YES  |
| `customer_name == requested name`     | TESTLANE Wave2B-T3                      | YES  |
| Exactly one messages row              | 1                                       | YES  |
| First message `role == "user"`        | user                                    | YES  |
| Content begins "Contact Form …"       | starts with "Contact Form Submission"   | YES  |

## Independence from Delta 1

- Delta 1 source: HTTP fetch in `server/test-widget-2B.ts` (Node fetch),
  capturing status + JSON body.
- Delta 2 source: `psql` directly against the Supabase `DATABASE_URL`
  (no helper, no app-level ORM in this read), capturing the persisted
  rows.

The two readings agree on conversation id, message id, channel,
organization id, customer fields, and content.

## Verdict — Delta 2

**PASS.** Storage-only behavior verified. The endpoint resolved Serra
Honda by slug, wrote one `conversations` row with `channel="form"`, and
wrote exactly one `messages` row (`role="user"`) carrying the expected
formatted contact-form payload. No external provider was called and
none was expected.
