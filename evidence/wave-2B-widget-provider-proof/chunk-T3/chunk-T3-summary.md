# Wave 2B-T3 — Public Widget Contact Form Provider Proof — Summary

**Date:** 2026-05-09 (UTC)
**Branch:** wave/8-widget/2B-chat-callback-form
**Endpoint under test:** `POST /api/widget/contact` (server/routes/public.ts:76-128)
**Mode:** STORAGE-ONLY (no external provider call by design — verified)
**Org:** Serra Honda (`24d64f99-ba04-4b43-af35-fd06f555ac86`)

## Verdict

**PASS — single-invocation, two-delta provider proof captured.**

All eleven halt checks (4 HTTP, 7 DB) pass. The endpoint behaves exactly
per the live contract in `server/routes/public.ts:76-128`.

## Captured ids

| Item            | Value                                  |
|-----------------|----------------------------------------|
| conversation id | e0c45066-daa3-4f14-a489-3fb4b123a34d   |
| message id      | 9ca6b0b5-eb60-4500-b261-d2b2c29aec37   |
| org id          | 24d64f99-ba04-4b43-af35-fd06f555ac86   |
| channel         | form                                   |

## Allowlist confirmation

`duane.wells@huminic.ai` → ALLOWED, category=`test_email`, exit 0.
File: `allowlist-check.txt`. (No actual email send by this endpoint —
the form is storage-only — but the recipient classification table is
satisfied because the email value is on the test-recipients allowlist.)

## Evidence files

| File                                                                    | Purpose                                       |
|-------------------------------------------------------------------------|-----------------------------------------------|
| `allowlist-check.txt`                                                   | Pre-call allowlist verification (exit 0)      |
| `run.log`                                                               | Full helper stdout from the single invocation |
| `delta-1-http.md`                                                       | HTTP request/response contract proof          |
| `delta-2-db.md`                                                         | DB row-level proof (psql, independent path)   |
| `chunk-T3-summary.md`                                                   | This file                                     |

## Helper changes

Appended `testWidgetForm({ orgSlug, name, email, phone, message })` to
`server/test-widget-2B.ts` (T1 and T2 helpers untouched). CLI dispatch
extended: `npx tsx server/test-widget-2B.ts testWidgetForm` now invokes
the helper with the dispatch defaults and prints the result JSON.

No production endpoint code modified. No UI files modified. No new
dependencies. No schema changes. Run was a single POST against the
already-running pm2 `nexxus-app` on `localhost:5000`.

## Endpoint contract clarification (vs. dispatch)

The dispatch's recipient profile (name / email / phone / message)
matches the endpoint's actual contract exactly. No deviation from the
dispatched body was needed. The handler also accepts `widgetCode` as
an alternative org-resolver but the helper deliberately uses `slug`
(simpler, matches T1 pattern, no ambiguity if multiple widgets exist).

## Halt-check summary

```
status2xx                          : true
successFlag                        : true
hasConversationId                  : true
conversationRowFound               : true
conversationOrgMatchesSerraHonda   : true
conversationChannelIsForm          : true
conversationEmailMatches           : true
conversationNameMatches            : true
exactlyOneMessage                  : true
messageRoleIsUser                  : true
messageContentHasFormHeader        : true
```

11/11 PASS.

## Next steps (orchestrator)

- Dispatch verifier(s) at the gate per dispatch `pending #39`.
- After verifier(s) ratify all three chunks (T1 chat, T2 callback,
  T3 form), close the wave and merge `wave/8-widget/2B-chat-callback-form`.
