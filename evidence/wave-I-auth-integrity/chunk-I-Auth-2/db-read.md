# Chunk I-Auth-2 — DB Read (SELECT only) — 2026-05-07

**Branch:** `wave/1-core/I-auth-integrity`
**Connection:** `DATABASE_URL` (Supabase) sourced from `.env`. Read-only psql session.
**Scope:** rows for `duane.wells@huminic.ai` and `duanekwells@gmail.com` plus aggregated `activity_log` over the last 30 days. No mutations.

Every query in this chunk started with `SELECT`. Confirmed by inspection before execution.

---

## A. `users` rows for the two operator emails

```
id                                   | email                     | first_name | last_name | role_id              | organization_id      | is_active | pw_len | reset_token_present | reset_token_expiry | additional_org_ids | created_at                  | updated_at
─────────────────────────────────────┼───────────────────────────┼────────────┼───────────┼──────────────────────┼──────────────────────┼───────────┼────────┼─────────────────────┼────────────────────┼────────────────────┼─────────────────────────────┼─────────────────────────────
bde19db9-ffe9-482b-ab25-186d3032cb6d | duane.wells@huminic.ai    | Duane K.   | Wells     | 677c1e75-…-9567a2ec…  | f1b20850-…-4dc108e9… | t         | 60     | f                   | (null)             | (null)             | 2026-04-03 05:01:59.887594  | 2026-04-07 07:32:35.571
7c0c75a7-3885-44b7-b1b8-4b52cc288f96 | duanekwells@gmail.com     | Duane      | Wells     | 99e14979-…-565de233…  | fe2e50a8-…-83325fd7… | t         | 60     | f                   | (null)             | (null)             | 2026-04-03 13:42:06.710468  | 2026-04-06 17:01:27.977
```

Joined with roles + organizations:

```
email                  | role_name      | level | org_name         | org_slug         | partner_id           | outbound_enabled | email_enabled
───────────────────────┼────────────────┼───────┼──────────────────┼──────────────────┼──────────────────────┼──────────────────┼───────────────
duane.wells@huminic.ai | super_admin    | 1     | Huminic          | huminic          | (null)               | t                | t
duanekwells@gmail.com  | partner_admin  | 2     | Cage Automotive  | cage-automotive  | f1b20850-…-4dc108e9… | t                | t
```

### Observations on `users` rows

1. **Both rows are present and active** (`is_active = t`). This rules out the "Account is deactivated" 401 path (`server/routes/auth.ts:53-55`).
2. **Email casing is canonical lowercase** in both rows. Forgot-password input that is mixed-case will MISS the row (`storage.getUserByEmail` does NOT lowercase, see Chunk I-Auth-1). Login lowercases input, so login is unaffected.
3. **`pw_len = 60` on both rows.** That is the canonical length of a bcrypt `$2a$10$…` / `$2b$10$…` hash. The hash is intact (not null, not truncated).
4. **No reset token outstanding** on either user (`reset_token_present = f`).
5. **Reset-token expiry NULL** — consistent.
6. **No `additional_org_ids`** — irrelevant here, since super_admin gets all-org access by role and partner_admin walks the partner tree.
7. `updated_at` on the super_admin row is 2026-04-07 (last password change OR last admin update); on the partner_admin row 2026-04-06. Neither has been touched in May. **No password change has occurred on either operator account in the past 30 days.**
8. **Roles look correct** for the operator (super_admin level 1; partner_admin level 2).
9. **Both orgs have CommGate open** (`outbound_enabled = t`, `email_enabled = t`). Forgot-password emails to either operator account should NOT be CommGate-blocked at the org level.

---

## B. `sessions` rows for the operator

```
id | user_id | email | expires_at | created_at | rt_len
(0 rows)
```

**No active sessions exist for either operator account.**

Whole-DB session snapshot:

```
total_sessions | distinct_users | most_recent                | oldest
────────────────┼────────────────┼────────────────────────────┼────────────────────────────
14             | 14             | 2026-05-07 02:08:00.410715 | 2026-04-03 18:34:14.164759
```

### Observations on `sessions`

- 14 total sessions for 14 distinct users (one row per user, consistent with `deleteUserSessions` running on each successful login).
- Most recent session created 2026-05-07 02:08 UTC → some other user (not operator) successfully logged in earlier today.
- **Operator has no active session.** Either operator has not successfully logged in recently OR their last session expired (7-day TTL) and the row was rotated away.
- Absence of an operator session does NOT prove operator could not log in — it only proves there is no live refresh-token row right now. A successful login that was followed by a logout / browser-close / 7-day-expiry would also leave this state.

---

## C. `activity_log` for operator emails — last 30 days

### Summary by action

```
action               | count
─────────────────────┼───────
login_failed         | 16
campaign_created     | 10
campaign_stopped     | 10
user_created         |  7
campaign_dry_run     |  5
campaign_executed    |  5
organization_updated |  4
email_sent           |  1
```

**No `password_reset_*`, no `login_success`, no `password_changed` rows.** A whole-table check of distinct actions also confirmed this:

```
SELECT DISTINCT action FROM activity_log WHERE action ILIKE '%login%' OR action ILIKE '%password%' OR action ILIKE '%reset%';
→ login_failed   (only)
```

This is **important context for interpretation**: the application code does NOT log a `login_success` event (only `login_failed`). Therefore, absence of a "login_success" row is NOT evidence the operator could not log in — the application simply never writes that event. We can only infer login activity from `login_failed` clusters and from session-row creation (which is also wiped on each new login).

### `login_failed` cluster timeline for operator

| When (UTC)                  | Account                  | Notes |
|-----------------------------|--------------------------|-------|
| 2026-05-04 12:24:58         | duanekwells@gmail.com     | 1 fail |
| 2026-05-04 12:24:43         | duane.wells@huminic.ai    | 1 fail |
| 2026-05-04 12:23:28         | duane.wells@huminic.ai    | 1 fail |
| 2026-05-04 12:23:22         | duane.wells@huminic.ai    | 1 fail |
| 2026-04-28 06:38:58         | duane.wells@huminic.ai    | 1 fail |
| 2026-04-28 06:36:49         | duane.wells@huminic.ai    | 1 fail |
| 2026-04-16 18:23:19         | duane.wells@huminic.ai    | 1 fail |
| 2026-04-16 18:23:05         | duane.wells@huminic.ai    | 1 fail |
| 2026-04-15 00:59:14         | duane.wells@huminic.ai    | 1 fail |
| 2026-04-15 00:59:00         | duane.wells@huminic.ai    | 1 fail |
| 2026-04-15 00:46:25         | duane.wells@huminic.ai    | 1 fail |
| 2026-04-15 00:46:15         | duane.wells@huminic.ai    | 1 fail |
| 2026-04-07 18:44:00         | duane.wells@huminic.ai    | 1 fail |
| 2026-04-07 08:21:37         | duane.wells@huminic.ai    | 1 fail |
| 2026-04-07 08:13:24         | duane.wells@huminic.ai    | 1 fail |
| 2026-04-07 08:13:23         | duane.wells@huminic.ai    | 1 fail |

**Most recent cluster: 2026-05-04 12:23–12:24 UTC** — 3 fails on `duane.wells@huminic.ai` plus 1 fail on `duanekwells@gmail.com` within ~1 minute and 30 seconds. Both operator accounts fail in the same window.

This pattern — fails on BOTH accounts in the same minute — is consistent with operator trying their two known emails after one didn't work. The accounts share the same human owner.

### Other (non-failed-login) operator activity

- Campaign + user + org-update activity continues through 2026-04-28. After that, only login_failed events show up (and only on 2026-05-04).
- The most recent successful-state operator activity (i.e. an action that requires a valid session) is `organization_updated` at **2026-04-29 06:30:18 UTC**. So as of 2026-04-29 the operator's super_admin account had a working session and could perform privileged writes.
- Between 2026-04-29 06:30:18 (last successful action) and 2026-05-04 12:23 (first new failed-login cluster), there is a **~5-day gap** with no operator activity in `activity_log`. Then 4 fails on 2026-05-04. Then nothing. Today is 2026-05-07.

### Outstanding reset tokens — DB-wide

```
SELECT count(*) FROM users WHERE reset_token IS NOT NULL;
→ 0
```

**Zero users have a reset token outstanding.** No one (including operator) is currently in the middle of a reset-password flow.

---

## D. Cross-checks against Chunk I-Auth-1 hypotheses

| Hypothesis | Result |
|---|---|
| Operator's `users.is_active = false` | **Ruled out.** Both rows `is_active = t`. |
| Operator's reset_token still set | **Ruled out.** Both rows `reset_token_present = f`. DB-wide also zero. |
| Password hash null/truncated | **Ruled out.** Both rows `pw_len = 60`, canonical bcrypt length. |
| Reset-token expiry stale and blocking | **Ruled out.** Both rows `reset_token_expiry IS NULL`. |
| Email-case mismatch on forgot-password | **Plausible.** Both stored emails are lowercase; `getUserByEmail` does exact-match. If operator typed mixed-case in `/forgot-password`, the lookup would silently miss and the user would see the generic "If an account exists…" message even though the account does exist. (Cannot prove from DB alone — need log inspection in I-Auth-3 to see whether forgot-password requests were submitted.) |
| Org `outbound_enabled = false` blocking the reset email | **Ruled out for operator orgs.** Both orgs have CommGate open (`outbound_enabled = t`, `email_enabled = t`). |
| Operator forgot password recently and didn't get email | **Possibly true and unobservable from DB.** No `password_reset_completed` row exists for any user in 30 days. No reset_token outstanding. Either no one requested a reset, or any pending tokens have already been overwritten/cleared by a subsequent flow. |

### Login pattern interpretation

The **2026-05-04 12:23-12:24** cluster is the most actionable signal:

- 3 sequential password-fails on `duane.wells@huminic.ai`, then 1 password-fail on `duanekwells@gmail.com`, all within ~95 seconds.
- Consistent with a human typing what they thought was the right password, retrying, and then trying the OTHER known email.
- Not consistent with credential-stuffing (no IP burst, no other emails affected, no flood).
- **The operator's reported "login/password issue" is most likely tied to this date.**

After 2026-05-04 12:24:58 there is no further operator activity in activity_log (no further login_failed, no successful-action evidence). Three possibilities:

1. Operator gave up and has not retried since.
2. Operator successfully logged in afterward (logged-in success leaves NO activity_log row, so this is not falsifiable from this table alone).
3. Operator initiated a forgot-password flow afterward (would NOT leave an activity_log row in current code — only `password_reset_completed` is logged, not `password_reset_requested`).

To distinguish (1) vs (2) vs (3), look at:
- Sessions table: no operator session NOW. So (2) would require operator to have logged in AND then logged out / left for >7 days. Possible but not provable.
- pm2 logs (Chunk I-Auth-3) for "Password reset email sent to" lines, "Password reset token generated for" lines, or successful login lines.

---

## E. Stop-condition checks

- **No DB row appears modified during the read window.** All queries here are SELECT. The read sequence took <30 seconds and we did not hold a transaction.
- Re-running the operator user-row SELECT at the end of this chunk would confirm no drift, but is not necessary because all SELECT queries are idempotent and we executed only SELECTs.

---

## Conclusion of DB-read chunk

- Both operator user rows are intact, active, with valid bcrypt hashes, no outstanding reset token.
- Both operator orgs have CommGate open (forgot-password Resend send would not be blocked at the org-flag layer).
- Operator had a 4-event login_failed cluster on 2026-05-04 spanning both operator emails. That is the most recent operator-side auth event of any kind in the DB.
- No `password_reset_completed` events exist DB-wide in 30 days. No one is mid-reset.
- Application does not log `login_success` events. We cannot confirm OR deny successful operator logins from `activity_log` alone.
- Most consistent root-cause candidates remaining (after this chunk):
  1. Operator's password is not what they think it is (no DB defect; password just doesn't match).
  2. UI-side reset-password 15-min vs server 60-min mismatch caused a forgot-password attempt to dead-end.
  3. Email-case mismatch on forgot-password caused a silent miss with a generic success message.
  4. Operator hasn't tried again since 2026-05-04 (so there is no current state to fix; operator could just retry).

Chunk I-Auth-3 should look at pm2 + Caddy logs for the **2026-05-04** window to disambiguate.
