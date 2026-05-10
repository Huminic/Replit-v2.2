# S3 — AUTH-D forgot-password — Delta 2 endpoint behavioral probe

**Wave:** 9-Sec
**Chunk:** S3
**Item:** AUTH-D forgot-password mixed-case silent fail
**Fix commit:** `4985b03`
**Build/reload:** `npm run build` + `pm2 reload nexxus-app --update-env` at 2026-05-10T19:03:39Z
**Probe time:** 2026-05-10T19:07Z

---

## Allowlist clearance

| Recipient | Allowlist status | Decision |
|---|---|---|
| `serra_honda@huminic.ai` | NOT allowlisted | SKIPPED real-send probe per team-lead spec |
| `DUANE.WELLS@HUMINIC.AI` | ALLOWED (`test_email`) | USED for the mixed-case probe (operator's own inbox) |

Verified via `harness/bin/test-orgs-allowlist-check.sh recipient duane.wells@huminic.ai` → exit 0, category=test_email.

## Setup

| | Value |
|---|---|
| Endpoint | `POST /api/auth/forgot-password` |
| Fix gate | `server/lib/emailNormalize.ts` `normalizeEmailForLookup` called at `server/routes/auth.ts:352` |
| Test recipient | `duane.wells@huminic.ai` (Huminic org; outbound + email enabled) |
| Probe input | `"DUANE.WELLS@HUMINIC.AI"` (uppercase) |

## Pre-probe DB state

```
PRE: {"email":"duane.wells@huminic.ai","reset_token":null,"reset_token_expiry":null,"updated_at":"2026-04-07T07:32:35.571Z"}
```

`reset_token` is null. Last update was over a month ago. Any change to either field is causally attributable to the probe.

## Probe

```
$ curl -sS -X POST "http://localhost:5000/api/auth/forgot-password" \
    -H "Content-Type: application/json" \
    -d '{"email":"DUANE.WELLS@HUMINIC.AI"}'

HTTP 200
{"message":"If an account exists with that email, a reset link has been sent."}
```

(Enumeration-prevention message is correct — same response shape regardless of whether user exists.)

## Post-probe DB state

```
POST: {"email":"duane.wells@huminic.ai","has_token":true,"reset_token_expiry":"2026-05-10T20:07:51.850Z","updated_at":"2026-05-10T19:07:51.850Z"}
```

- `has_token: true` — `reset_token` is now non-null. **Pre-fix this would still be null.**
- `reset_token_expiry`: 60 minutes after probe (matches `60 * 60 * 1000` at auth.ts:361).
- `updated_at` jumped from `2026-04-07` to `2026-05-10T19:07:51Z` — server actually wrote.

## Independent observation: pm2 server log

```
47|nexxus- | [AUTH] Password reset email sent to duane.wells@huminic.ai
```

(From `server/routes/auth.ts:380`.) The log entry is emitted only after the Resend `emails.send()` await resolves successfully — so a real email was queued/sent to the allowlisted operator inbox. Email is normalized to lowercase by the time the log line is constructed (matches the fix at line 352).

## Pre-fix counterfactual (per scope-guardian Phase 1 verification trail)

Pre-fix `server/routes/auth.ts:353` called `storage.getUserByEmail(req.body.email)` directly — with `DUANE.WELLS@HUMINIC.AI` as input, the exact-match SQL at `server/storage.ts:258-261` would have missed the lowercase row. Result: no token written, no Resend send, but still HTTP 200 (silent fail, exactly as confirmed by operator's 2026-03-20 incident).

---

## Verdict

**PASS.** Three independent signals confirm the fix:
1. **DB row mutation:** `reset_token` went from null → set (pre-fix would have stayed null on this exact input).
2. **DB freshness:** `updated_at` jumped to the probe timestamp.
3. **Server log:** `[AUTH] Password reset email sent to duane.wells@huminic.ai` — confirms Resend was actually invoked with the normalized lowercase email.

Allowlist gate respected (serra_honda send skipped; duane.wells used because allowlisted).
