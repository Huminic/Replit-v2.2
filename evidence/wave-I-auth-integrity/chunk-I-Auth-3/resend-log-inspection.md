# Chunk I-Auth-3 — pm2 + Caddy log inspection (READ-ONLY) — 2026-05-07

**Branch:** `wave/1-core/I-auth-integrity`
**Sources:** `pm2 logs nexxus-app --nostream`, `/home/ubuntu/.pm2/logs/nexxus-app-*.log`, `/var/log/caddy/*.log` (read via `sudo -n grep`).
**Goal:** Reconstruct the operator's auth-related HTTP traffic in the last 30 days; identify whether any forgot-password / reset-password emails were issued, delivered, or bounced.

Resend's hosted dashboard was NOT accessed (per bookend OPENING — operator-only).

---

## A. PM2 log scope

PM2 process `nexxus-app` was last (re)created at 2026-05-06 23:45:25 UTC (per `pm2 describe`). Total restarts: 85. Daily-rotated log files exist back to 2026-05-01:

```
nexxus-app-out__2026-05-01_00-00-00.log     699K   contains 2026-04-30 activity
nexxus-app-out__2026-05-02_00-00-00.log     545K   contains 2026-05-01 activity
nexxus-app-out__2026-05-03_00-00-00.log     505K   contains 2026-05-02 activity
nexxus-app-out__2026-05-04_00-00-00.log     538K   contains 2026-05-03 activity
nexxus-app-out__2026-05-05_00-00-00.log     461K   contains 2026-05-04 activity
nexxus-app-out__2026-05-06_00-00-00.log     580K   contains 2026-05-05 activity
nexxus-app-out__2026-05-07_00-00-00.log     559K   contains 2026-05-06 activity
nexxus-app-out.log                          129K   contains 2026-05-07 (live)
```

**Note on filename convention:** the file `__YYYY-MM-DD_00-00-00.log` is the file that was *cut* at that timestamp, so its content is the day BEFORE that cut. Confirmed by inspecting the 12:31:19 PM successful-login line which is in the `__2026-05-05_…` file but corresponds to 2026-05-04 12:31:19 UTC per Caddy's millisecond timestamps.

PM2 logs from BEFORE 2026-05-01 have already been pruned. So pm2 cannot evidence the 2026-04-15 / 2026-04-16 / 2026-04-28 historical login_failed events — only Caddy logs can.

---

## B. PM2 search for auth-related markers

### B.1 `[AUTH]` console-log lines (would indicate forgot-password / reset-password code paths)

```
grep -E "\[AUTH\]" /home/ubuntu/.pm2/logs/nexxus-app-out__2026-05-*.log /home/ubuntu/.pm2/logs/nexxus-app-out.log
→ no matches
```

The application's `console.log("[AUTH] Password reset email sent to ...")`, `console.log("[AUTH] Password reset token generated for ...")`, `console.log("[AUTH] Forgot password error: ...")`, `console.log("[AUTH] Reset password error: ...")` (per `server/routes/auth.ts:365, 377, 379, 385, 426, 429`) **never fired in May 2026**.

This means in May:
- No `/api/auth/forgot-password` request reached the app code with a found user (would have logged something).
- No `/api/auth/reset-password` request was attempted.
- No Resend send (success or failure) was attempted from the application during May.

The 2026-03-20 forgot-password event seen in Caddy (see Section C below) is older than the May pm2 retention.

### B.2 `[express]` request lines for `/api/auth/login` in May

| Date (UTC) | Login attempts | Notes |
|---|---|---|
| 2026-05-04 (file `__2026-05-05_…`) | 1 200 OK | `12:31:19 PM POST /api/auth/login 200 in 616ms` (operator on dev) |
| 2026-05-05 (file `__2026-05-06_…`) | 0 |  |
| 2026-05-06 (file `__2026-05-07_…`) | 0 |  |
| 2026-05-07 (live `nexxus-app-out.log`) | 4 200 OK | Ongoing investigator/test activity since 02h UTC |

No 401 login attempts visible in pm2 for May. The 2026-05-04 12:23-12:24 cluster of 4 failed logins is NOT in pm2 logs because those requests went to `live.huminic.app` (different Coolify container, different log destination — not this pm2 process).

### B.3 `429 Too many attempts` rate-limit lines

```
grep -E "POST /api/auth/login 429" pm2-logs   → no matches
grep -E "Too many attempts" pm2-logs          → no matches
```

No rate-limit hits on the dev pm2 process. The `authLimiter` was not exhausted on dev for any account during May.

---

## C. Caddy log search

Caddy log files containing relevant traffic:
- `/var/log/caddy/dev.log` — host `dev.huminicdev.com` (this is the dev environment served by THIS pm2 process)
- `/var/log/caddy/live-huminic-app.log` — host `live.huminic.app` (production Coolify container)
- `/var/log/caddy/dev-nexxus.log` — older dev hostname `nexxusdev.huminicdev.com` (not active in May)
- `/var/log/caddy/nexxus.log` — large historical log; no May auth activity

### C.1 All `/api/auth/login` events since 2026-05-01 (UTC)

| Time (UTC) | Host | Status | Client IP | UA | Interpretation |
|---|---|---|---|---|---|
| 2026-05-01 04:35:46 | live.huminic.app | 200 | 172.182.226.226 | Playwright | Automated test login |
| 2026-05-01 04:35:47 | live.huminic.app | 200 | 172.182.226.226 | Playwright | Automated test login |
| 2026-05-01 04:35:47 | live.huminic.app | 200 | 172.182.226.226 | Playwright | Automated test login |
| 2026-05-01 05:32:42 | live.huminic.app | 200 | 150.136.6.207 | Linux/Chrome | This server (curl from Oracle Cloud — automated check) |
| **2026-05-04 12:23:22** | live.huminic.app | **401** | **67.20.245.76** | Mac Safari | **Operator failed-login attempt #1** |
| **2026-05-04 12:23:28** | live.huminic.app | **401** | **67.20.245.76** | Mac Safari | **Operator failed-login attempt #2** |
| **2026-05-04 12:24:43** | live.huminic.app | **401** | **67.20.245.76** | Mac Safari | **Operator failed-login attempt #3** |
| **2026-05-04 12:24:58** | live.huminic.app | **401** | **67.20.245.76** | Mac Safari | **Operator failed-login attempt #4** |
| 2026-05-04 12:27:38 | live.huminic.app | 401 | 150.136.6.207 | curl/7.68.0 | Probe from this server (not the operator) |
| **2026-05-04 12:28:59** | live.huminic.app | **200** | **67.20.245.76** | Mac Safari | **Operator successful login (live)** |
| **2026-05-04 12:30:45** | live.huminic.app | **200** | **67.20.245.76** | Mac Safari | **Operator second successful login (live, retry/reload)** |
| **2026-05-04 12:31:19** | dev.huminicdev.com | **200** | **67.20.245.76** | Mac Safari | **Operator successful login (dev)** — same browser switching environments |

### C.2 Reconstructed 2026-05-04 operator session

Window: 12:23:22 — 12:31:19 UTC (~8 minutes).

```
12:23:22   401  attempt 1
12:23:28   401  attempt 2  (+6 s)   typing same wrong password again
…
12:24:43   401  attempt 3  (+1m)    paused, then retried
12:24:58   401  attempt 4  (+15 s)
…
12:27:38   401            (+2.5m)   probe from THIS server (curl)
…
12:28:59   200  success           4 minutes after last fail
12:30:45   200  success           +1m45s (likely page reload / second tab)
12:31:19   200  success on dev    +34s, switched from live to dev
```

This is fully consistent with a human owner who initially typed the wrong password, paused, retried with a corrected password, succeeded on live, then logged into dev.

The operator-reported "login/password issue" most plausibly refers to this 12:23-12:25 window where the password was wrong on the first 4 attempts.

### C.3 Forgot-password events — last 60 days

| Time (UTC) | Host | Status | Client IP | UA | Interpretation |
|---|---|---|---|---|---|
| 2026-03-20 02:16:47 | live.huminic.app | 200 | 67.20.245.76 | Mac Safari | Operator's Mac initiated forgot-password |
| 2026-04-15 18:38:19 | dev.huminicdev.com | 200 | 150.136.6.207 | curl/7.68.0 | This server's automated test |
| 2026-04-15 18:44:29 | dev.huminicdev.com | 200 | 150.136.6.207 | curl/7.68.0 | This server's automated test |

**No forgot-password requests in May 2026 from any source.** In particular, the operator did NOT use the forgot-password flow on or around 2026-05-04 when their login was failing. They simply retried until they got the password right.

The 2026-03-20 operator forgot-password event happened well before today's window. We cannot tell from logs alone whether the corresponding email was actually delivered (Resend dashboard not accessed). Per CLAUDE.md the operator owns the Resend dashboard credentials.

### C.4 Reset-password events — last 60 days

```
grep -E "/api/auth/reset-password" /var/log/caddy/*.log   → no May 2026 results
```

No `POST /api/auth/reset-password` requests since at least early March on either host. This is consistent with Chunk I-Auth-2 finding: the `password_reset_completed` activity_log row count is zero for the past 30 days. **Nobody — operator or otherwise — has completed a password reset in over 30 days.**

### C.5 Rate-limit headers visible

The Caddy logs include `Ratelimit-Limit: 200; w=900` and `Ratelimit-Remaining: 198` headers in responses, indicating `AUTH_RATE_LIMIT_MAX=200` is in effect (per `server/routes/auth.ts:18-28`). With a 15-minute window and `max=200`, the operator's 4 fails over ~95 seconds were nowhere close to triggering rate-limit.

---

## D. Cross-references

- I-140 ("Password reset — no code bug found, NEEDS LIVE TEST"): the only May-window evidence we have for reset-password is a NULL set — no requests at all, hence no live-test data added by this audit. The 2026-03-20 operator forgot-password event predates the I-140 "needs live test" status flagged in issues.md. We cannot verify the email actually delivered from these logs alone.
- I-165 ("Forgot/reset password FE — 11 states untested"): unaffected by this chunk.
- I-238 ("Legacy req.body.refreshToken fallback"): unaffected by this chunk; the operator's logins all set the cookie via the standard flow.
- The 15-min vs 60-min UI/server mismatch identified in Chunk I-Auth-1 § 8 has not been exercised in May 2026 — no reset-password requests were submitted, so the discrepancy could not have produced the operator's symptom on 2026-05-04.

---

## E. Stop-condition checks

- **No DB writes:** None executed in this chunk; only `grep` over log files.
- **No provider sends:** None. Confirmed no Resend dashboard access.
- **Read-only on logs:** All grep / cat / pm2 invocations are read-only.

---

## Conclusion of log-inspection chunk

**Highest-confidence reconstruction of the operator's "login/password issue":**

On 2026-05-04 between 12:23:22 and 12:24:58 UTC, the operator submitted 4 wrong-password login attempts to `live.huminic.app`, three for `duane.wells@huminic.ai` and one for `duanekwells@gmail.com`. The application correctly rejected each with HTTP 401 and recorded a `login_failed` row in `activity_log` for each attempt. The operator did NOT initiate the forgot-password flow. Approximately 4 minutes later (12:28:59) the operator submitted the correct password and was logged in successfully (HTTP 200). They subsequently logged into dev as well (12:31:19).

There is no evidence of:
- Any system-side defect that prevented login (every 401 was followed within minutes by a successful 200 from the same browser without any code change).
- Any rate-limit exhaustion (only 4 fails; limit is 200 per 15 minutes per IP).
- Any forgot-password / reset-password request (zero in May; only 1 from operator in March).
- Any account lockout (no such mechanism exists in code; see Chunk I-Auth-1 § 2).
- Any Resend send failure (none attempted).
- Any password change (no `password_changed` events; no `updated_at` movement on the operator's user rows since 2026-04-07).

**Most likely explanation of the operator-reported issue:** the operator forgot or mis-typed their password on 2026-05-04, then retried successfully a few minutes later. No defect; no remediation required at the system layer. If the operator wants stronger evidence, they could check the Resend dashboard for the 2026-03-20 forgot-password attempt to verify email delivery for that earlier flow — but it is not the cause of any 2026-05-04 symptom.

Chunk I-Auth-4 will combine these findings with the code-map and DB-read into the final classification + remediation options.
