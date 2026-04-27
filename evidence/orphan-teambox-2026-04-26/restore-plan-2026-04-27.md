# Restore Plan — Serra Honda Conversations (Policy 2026-04-27)

**Date:** 2026-04-27
**Source snapshot:** `evidence/orphan-teambox-2026-04-26/full-serra-honda-delete-preview-2026-04-26.json`
**Deletion commit:** `831bbc2` (executed 2026-04-26 ~16:20 UTC)
**Re-classification:** `evidence/orphan-teambox-2026-04-26/restore-assessment-2026-04-27.json`
**Mode:** read-only analysis; **NO RESTORE EXECUTED**.

---

## 1. Headline

| bucket | conversation rows | cascaded message rows |
|---|---|---|
| **PRESERVE_REAL_OR_INTEGRATION** (delete was wrong) | **20** | **51** |
| **REVIEW_UNKNOWN** (operator decision) | **27** | **73** |
| DELETE_PROVEN_TEST (delete was correct) | 37 | 52 |
| **TOTAL** | 84 | 176 |

**47 of 84 deleted rows should not have been deleted under the corrected 2026-04-27 policy** (PRESERVE + REVIEW). Of those 47, the 20 PRESERVE rows are clearly real (VAPI inbound voice with real phones / internal-user email domains with real threads). The 27 REVIEW rows include several that are likely real and several that are likely test — operator decision.

---

## 2. CRITICAL SNAPSHOT-INTEGRITY GAP

**The saved JSON does NOT contain the 176 individual message rows.** It only captures the per-conversation `message_count`. The DELETE was:

```sql
DELETE FROM conversations WHERE organization_id = $1
```

which CASCADE-deleted 176 message rows via `messages.conversation_id ON DELETE CASCADE`. Those rows are gone from the database AND not present in the snapshot.

**Implication for any restore:**

- Re-creating the 47 conversations from the snapshot will produce 47 EMPTY conversation rows (status, channel, customer identity preserved; thread content gone).
- For the 7 VAPI inbound voice rows, the transcript content is lost. The conversation row will exist with `message_count` showing the original count, but the actual message rows won't be there.
- For real-user ai-chat rows (like Serra Honda Admin's 18-message thread), the chat history is lost.

**A "real" data restoration of these conversations is not possible from this evidence alone.** Recovery options outside this commit's scope:

1. **Supabase point-in-time recovery (PITR)** — Supabase Pro tier offers 7-day PITR. If enabled, the messages can be recovered from a point before the 2026-04-26 16:20 UTC DELETE. Operator must check Supabase project settings; if PITR is on, restore would be a separate operator-coordinated action against Supabase, not via this codebase.
2. **Daily logical backup (pg_dump)** — if any infra cron is taking dumps, a backup from before 2026-04-26 would still include the messages. No such cron is documented in this project's `~/Claude-store/sysadmin/` to my knowledge — operator should confirm.
3. **Accept the loss** — re-create the conversation rows from the snapshot and accept that the message thread content is irrecoverable.

**Operator decision needed before any restore is meaningful.** Recommend: pause restore execution entirely until PITR/backup recovery options are evaluated, since restoring empty rows now would (a) make the loss of message content less visible and (b) make any future PITR-based message recovery harder (the conversations would be re-inserted with same id/timestamps but the messages would land into the existing rows, mixing with what's there).

---

## 3. PRESERVE_REAL_OR_INTEGRATION (20 rows / 51 messages)

These are unambiguously real under the 2026-04-27 policy. Subgroups:

### 3a. VAPI inbound voice (7 rows / 7 messages)

| short id | name | phone | NPA | created_at | comments |
|---|---|---|---|---|---|
| d4a2fc69 | +18392729080 | +18392729080 | 839 (TX overlay) | 2026-04-09 | 1 msg |
| e0d17104 | Callback Request | +14804618789 | 480 (Phoenix AZ) | 2026-04-13 | 1 msg — same phone as REVIEW row 54684569 (likely real customer who called twice) |
| 35effbd6 | Unknown Caller | +18392729080 | 839 (TX overlay) | 2026-04-13 | 1 msg — same caller as d4a2fc69 |
| 60159eb9 | Unknown Caller | +18392729080 | 839 (TX overlay) | 2026-04-13 | 1 msg — same caller as d4a2fc69 |
| fe0da827 | Unknown Caller | +19012038267 | 901 (Memphis TN) | 2026-04-15 | 1 msg |
| d3f6f72d | Unknown Caller | +12058736196 | 205 (Birmingham AL — Honda dealer territory) | 2026-04-19 | 1 msg |
| 4bb943a4 | WIRELESS CALLER | +12028781951 | 202 (Washington DC) | 2026-04-20 | 1 msg |

The 205 area code (Birmingham AL) is exactly where Serra Honda is located. **These are very likely real customer calls**; the 839 caller called 3 times in one day suggesting an actual customer trying to reach the dealership.

**These are the most defensible "should not have been deleted" rows in the entire snapshot.**

### 3b. Internal-staff dashboard sessions (12 rows / 43 messages)

`huminic.ai`, `serrahonda.com`, `serrahonda.net`, `cageautomotive.com`, `misscommunicationconsulting.com` email-owned chat sessions. These are real-user interactions with the dashboard chat (per operator: `@huminic.ai` and `@misscommunicationconsulting.com` are intentional real users; staff at `serrahonda.com`/`serrahonda.net`/`cageautomotive.com` are also real users).

| short id | name | email | channel | msgs |
|---|---|---|---|---|
| 0155306b | Serra Honda Admin | serra_honda@huminic.ai | ai-chat | 2 |
| c7530270 | Serra Honda Admin | serra_honda@huminic.ai | ai-chat | 2 |
| 64c95fad | Serra Honda Admin | serra_honda@huminic.ai | ai-chat | 2 |
| 12c4a7cf | Serra Honda Admin | serra_honda@huminic.ai | ai-chat | 2 |
| 14b30016 | James Chen | orgadmin@serrahonda.com | ai-chat | 1 |
| 656700fd | Duane K. Wells | duane.wells@huminic.ai | ai-chat | 2 |
| cc2687eb | Duane K. Wells | duane.wells@huminic.ai | ai-chat | 2 |
| 7b8a6f9a | Serra Honda Admin | serra_honda@huminic.ai | ai-chat | **18** |
| 93b848e9 | Duane K. Wells | duane.wells@huminic.ai | agent-chat-d2d3... | 1 |
| fedfa94d | Durran Cage | durran@cageautomotive.com | ai-chat | 2 |
| 098545b7 | Victoria Whitley | victoria@misscommunicationconsulting.com | agent-chat-d2d3... | **7** |
| 2037d172 | Shelby Dew | sdew@serrahonda.net | agent-chat-d2d3... | 1 |

The 18-message Serra Honda Admin thread + the 7-message Victoria Whitley thread are the most content-rich. Both lost.

### 3c. Real-looking external email (1 row / 2 messages)

| short id | name | email | channel | msgs |
|---|---|---|---|---|
| 9d8f39f8 | Stephanie Thompson | steph.t@email.com | email | 2 |

`email.com` is a real public email service (Mail.com Inc). Could be real or test stub — without message content, classifier defaults to PRESERVE (real-looking domain).

---

## 4. REVIEW_UNKNOWN (27 rows / 73 messages)

Operator decision needed per row. Key sub-groups:

### 4a. SMS to real-looking phones (16 rows / 55 messages) — POLICY CONCERN

The 2026-04-27 policy table says "TextMagic / SMS — NOT in customer use yet; only test numbers should appear". But these 16 SMS rows have **real-looking US phone numbers** with normal area codes (412, 541, 662, 256, 601, 859, 205, 731, etc.) — NOT test/555 numbers. Each has 1+ messages.

**Two possibilities:**

1. The SMS sends were directed to **real customer/staff phones** during pre-launch testing. If so, those real recipients received SMS from Nexxus, which is a compliance/audit concern beyond the cleanup question.
2. They are stub records / fixture data created for testing purposes that happen to have real-looking phone strings.

**Without message content I cannot tell which.** Surfacing for operator decision.

| short id | name | phone | msgs | note |
|---|---|---|---|---|
| 9cab0023 | 18338096836 | 18338096836 | **37** | **`+1 833 809 6836` — this matches `DEFAULT_TEXTMAGIC_PHONE` in `server/services/scheduler.ts:13`. This is the dealership's outbound SMS number, not a customer. The 37 "messages" are likely test sends through this number that got logged into a self-conversation. Likely DELETE_PROVEN_TEST in operator's actual judgment.** |
| 7b464eac | 4126574001 | 4126574001 | 2 | 412 area code (Pittsburgh PA — operator's home area code). Possibly operator's dev/family phone. |
| 86c68888 | Duane Wells | 4126572001 | 3 | 412 area code. Same family/dev phone family as 7b464eac. Operator's name. **Likely DELETE_PROVEN_TEST** — operator self-test. |
| 65fd9a93 | Sarita Wells | 4125375782 | 3 | "Sarita Wells" + 412 area code → operator's family member. **Likely DELETE_PROVEN_TEST** — internal test. |
| 720d335e | Donna Murphy | 4125199087 | 1 | 412 area code. Could be real customer or another internal test. |
| 673b1f74 | Durran Cage | 7313946907 | 1 | "Durran Cage" — same name as the cageautomotive.com user above. 731 area code (TN). Could be Durran's personal phone (real user) — REVIEW_UNKNOWN. |
| 88e93b64 | Lisa Morris | 5417783509 | 1 | 541 area code (Oregon). Real-looking name + real-looking phone. Could be real customer. |
| d0efcbe4 | Noah Koger | 6623046188 | 1 | 662 area code (Mississippi). Real-looking. |
| 654ee172 | Jennifer Jones | 2564527205 | 1 | 256 area code (Alabama — same state as Serra Honda). Real-looking. |
| a0b8ed21 | Jennifer Ueltschey | 6019517616 | 1 | 601 (MS). |
| 2ddadb04 | Fedor Zanin | 8594458581 | 1 | 859 (KY). |
| 20de28db | Richard Chambliss | 2567944375 | 1 | 256 (AL). |
| d49c0d9e | Allie Nix | 2054102897 | 1 | 205 (AL). |
| e4a16515 | +1428670293 | +1428670293 | 1 | 9-digit phone (malformed — `1428670293` is only 10 digits but starts with `1` so it'd be NANP `4286...`, except 428 is not a valid US NPA). Likely test stub. |
| 7f7ecaf3 | +1821616232 | +1821616232 | 1 | Similar malformed pattern. 821 not a valid US NPA. Likely test stub. |
| 0df020c1 | +1125352571 | +1125352571 | 1 | 112 not a valid NPA either. Likely test stub. |

**Probable refinement:** 9cab0023 (TextMagic dealer number) + 86c68888/65fd9a93 (operator family) + 3 malformed-NPA stubs = 6 of 16 likely DELETE_PROVEN_TEST. Remaining 10 with real-looking US phones are the actual policy concern.

### 4b. Voice with 0 messages (3 rows / 0 messages)

| short id | name | phone | msgs | note |
|---|---|---|---|---|
| 882cdab6 | Unknown Caller | +18392729080 | 0 | Same caller as PRESERVE rows d4a2fc69/35effbd6/60159eb9. Likely real customer w/ failed transcript on first attempt. |
| b9fb9009 | Unknown Caller | +18392729080 | 0 | Same caller. Likely same. |
| 54684569 | Callback Request | +14804618789 | 0 | Same phone as PRESERVE row e0d17104. Same caller, second attempt or first failure. |

**These are very likely real calls that hit the I-NEW-2026-04-26-D bug** ("voice channel without thread") — VAPI created the conversation row but the transcript chunk never arrived. Operator should decide whether to PRESERVE (treat as real per the new policy) or accept that the empty-row pattern is a known bug and DELETE.

### 4c. Website Visitor chat (4 rows / 16 messages)

| short id | name | channel | msgs |
|---|---|---|---|
| 9dc57c92 | Website Visitor | chat | 3 |
| 1028279a | Website Visitor | chat | 5 |
| fe7717b8 | Website Visitor | chat | 5 |
| ea22cb64 | Website Visitor | chat | 3 |

Anonymous web-widget chat sessions with no identity. Could be real visitors or staff testing the widget. Without content cannot determine.

### 4d. Real-user with 0 messages (4 rows / 0 messages)

The Victoria Cage + Shelby Dew duplicate-init artifacts from I-NEW-2026-04-26-C. Real users, but the conversation rows are empty bug artifacts.

| short id | name | email | channel |
|---|---|---|---|
| f2f1537b | Victoria Cage | victoria@misscommunicationconsulting.com | ai-chat |
| 8305b5b6 | Shelby Dew | sdew@serrahonda.net | ai-chat |
| f59d0587 | Shelby Dew | sdew@serrahonda.net | ai-assistant |
| 20570ba2 | Shelby Dew | sdew@serrahonda.net | ai-assistant |

---

## 5. DELETE_PROVEN_TEST (37 rows / 52 messages) — delete was correct

| signal | count |
|---|---|
| name matches `Test Customer` / `Test User` / `TestLane` etc. | 24 |
| name matches sprint/workflow prefix (`S-1`, `S-3`, `S-4`, `WF-`) | 12 |
| phone is 555 (any position) | 6 |
| phone is operator's `+14126546500` | 2 |
| email is operator-personal (`duanekwells@gmail.com`) | 1 |
| email is workflow-test fixture (`wf-resend-...`, `wf-svc-agent-...`) | 2 |

(Some rows match multiple signals; counts per-signal exceed 37.)

These 37 rows represent the original cleanup intent. The DELETE was correct for these.

---

## 6. Proposed restore approach (NOT for execution; for operator review)

**Operator decision branches:**

### Branch A — Restore all 20 PRESERVE rows immediately (skeleton-only, content lost)

Re-create the 20 conversation rows from the snapshot. Each row will land with `id`, `customer_name`, `customer_email`, `customer_phone`, `channel`, `status`, `created_at`, `updated_at` etc. preserved. Message rows are lost; `message_count` displayed in UI will be 0 (since the stored counter is derived from JOIN, not a column — the row will display as empty thread).

```sql
-- Inside a transaction. Idempotent via ON CONFLICT (id) DO NOTHING.
-- All 20 PRESERVE_REAL_OR_INTEGRATION ids:
INSERT INTO conversations
  (id, customer_name, customer_email, customer_phone, channel, status,
   agent_id, assigned_to, organization_id, campaign_id,
   source_conversation_id, campaign_disconnected, unread_count,
   last_message_at, escalation_sent_at, stale_trigger_processed_at,
   created_at, updated_at)
VALUES
  ($1, $2, $3, $4, ...)  -- 20 parameterized inserts
ON CONFLICT (id) DO NOTHING
RETURNING id;
```

Defense-in-depth assertions for the script:
- INSERT rowCount must equal 20 (all 20 were missing; none should already exist).
- Post-INSERT count of `conversations WHERE id = ANY($1)` must be 20.
- Users-table count must be unchanged.
- `messages WHERE conversation_id = ANY($1)` must be 0 (we know we can't restore them).

### Branch B — Coordinate Supabase PITR before any restore

Operator checks Supabase project settings for point-in-time recovery enablement. If PITR is on, restore is a Supabase-side operation against the messages table from a snapshot before 2026-04-26 16:20 UTC. The 20 conversations come back along with their 176 messages and any other rows that existed at that point. Risk: PITR is a full-database operation; rolling back the entire DB would also reverse all the legitimate cleanup commits and other work done since (Priority 7/7.5/8/9 commits). Selective table restore via PITR may not be supported on Supabase; operator must confirm with the Supabase docs / support.

### Branch C — Restore PRESERVE only; defer REVIEW_UNKNOWN to per-row operator decision

Same as A, but only the 20 unambiguous PRESERVE rows. The 27 REVIEW rows stay deleted unless operator explicitly upgrades them to PRESERVE via per-row decision.

### Branch D — Hold the restore entirely

Document the loss; record the 20 PRESERVE deletions as accepted technical debt; surface to the affected real users (Victoria Whitley, Durran Cage, Shelby Dew, Serra Honda Admin etc.) only if/when they notice the missing chat history.

---

## 7. Recommendation

**Branch B (PITR check) first, then C (skeleton restore for PRESERVE only) if PITR isn't viable.**

Reasoning:
- Branch A alone re-creates the conversation skeleton but leaves admins / staff with 20 empty rows where they previously had multi-turn threads. This may be more confusing than helpful; the 18-message Serra Honda Admin thread becoming 0 messages would be a visibly wrong state.
- Branch B is the only path to actually recovering the 51 PRESERVE message rows. If Supabase PITR is enabled and supports table-scoped restore, this is the right answer.
- Branch C is the fallback if PITR isn't an option.
- Branch D is the do-nothing baseline; defensible but trades real-user chat history for cleanup tidiness.

**The 27 REVIEW rows should NOT be auto-restored.** They go to per-row operator review with the message-content gap acknowledged. Several of them are very likely real calls (the 839 / 480 area-code voice rows), but that's an operator-judgment call.

---

## 8. STOP point

**No restore executed in this commit.** Read-only assessment only.

Operator decision tree:

| Decision | Effect |
|---|---|
| Branch A (skeleton restore PRESERVE) | I produce a per-row INSERT preview, you eyeball, you say "execute", I run the transaction-wrapped INSERT. Skeleton-only; messages NOT recovered. |
| Branch B (PITR check first) | You confirm Supabase PITR status; if available, you coordinate the table-scoped restore at the infra layer. I do not execute SQL. |
| Branch C (Branch A only after Branch B is ruled out) | Sequenced: try B, fall back to A. |
| Branch D (hold) | I record this in `issues.md` as accepted-loss technical debt. No restore. |
| Per-row REVIEW decision | Operator marks specific REVIEW rows as PRESERVE; I add them to the restore set and re-preview. |

Awaiting operator decision before any DB write.
