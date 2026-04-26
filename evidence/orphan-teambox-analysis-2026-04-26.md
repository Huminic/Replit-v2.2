# Priority 9 — Orphan TeamBox Conversations: Archaeology

**Date:** 2026-04-26
**Scope:** Read-only enumeration and classification of "Test Customer / 0 messages" orphan rows in Serra Honda's TeamBox (`conversations` table). Map FK / cascade impact. Recommend a deletion criterion + per-row preview workflow.
**Mode:** read-only DB SELECTs only. No mutations.
**Companion artifacts:** `evidence/orphan-teambox-2026-04-26/`
- `probe-schema.ts` + `schema-recon.json` — schema reconnaissance (columns + every FK touching `conversations`)
- `probe-orphans.ts` + `orphans-output.json` — full classification dump

---

## 1. Schema reality (vs the operator's brief)

The operator's brief asked about a `message_count` column. **It does not exist on the `conversations` table.** The audit's "0 messages" finding must be derived from a JOIN against `messages`. This probe computes `COALESCE((SELECT count(*) FROM messages WHERE conversation_id = c.id), 0)` per row.

Other operator-brief assumptions worth confirming:

| Operator brief said | Reality |
|---|---|
| `tasks` may FK to conversations | NO — `tasks` has only `assigned_user_id` + `organization_id`, no `conversation_id` column. |
| `appointments` may FK to conversations | NO — `appointments` has `assigned_user_id` + `organization_id` only. |
| `campaign_recipients` may FK to conversations | NO — `campaign_recipients` FKs to `campaigns.id` and is referenced by `outbound_log.recipient_id`, but does not touch `conversations`. |

Live `pg_constraint` scan confirms there is **exactly ONE FK pointing AT `conversations.id`**:

| source | column | target | on_delete |
|---|---|---|---|
| `messages` | `conversation_id` | `conversations.id` | **CASCADE** |

There is also a **soft pointer (no FK constraint)**: `conversations.source_conversation_id`. Some conversations may chain to a parent thread; deleting the parent leaves a dangling pointer with no DB error (no FK to break) but could affect any UI that follows the chain.

So the cascade-impact question reduces to two queries:
1. `count(messages WHERE conversation_id IN deleteSet)` — these will be CASCADE-deleted.
2. `count(conversations WHERE source_conversation_id IN deleteSet)` — these will become dangling soft-pointers (no DB error, no FK violation).

Both were probed and reported below.

---

## 2. Population breakdown — Serra Honda's `conversations` table (84 rows total)

| bucket | count |
|---|---|
| **delete-recommended** (test AND zero messages AND no inbound source-pointer) | **11** |
| test-tagged BUT has messages — conservative HOLD | 22 |
| zero messages BUT NOT test-tagged — needs review | 8 |
| test-tagged AND zero msg BUT has inbound source-pointer | 0 |
| real-looking with messages — do not touch | 43 |
| total | 84 |

The delete-recommended count of 11 matches the operator's audit "10+ orphan Test Customer / 0 messages" observation almost exactly.

---

## 3. The 11 delete-recommended rows

All 11 have:
- 0 messages (no thread content lost on cascade)
- No inbound `source_conversation_id` references (no dangling pointers created by deletion)
- Status `open`, `unread_count=0`, no `last_message_at`, no `campaign_id`, no `agent_id`, no `assigned_to`
- Channel = `chat` (10 rows) or `ai-chat` (1 row)

| short id | customer_name | email | channel | age (d) | tags |
|---|---|---|---|---|---|
| 3dc91fa9 | Duane Wells | duanekwells@gmail.com | ai-chat | 19 | email_operator |
| bcdd9e08 | Test Customer | (null) | chat | 18 | name_test |
| f4317d12 | Test Customer | (null) | chat | 18 | name_test |
| 63b92cda | Test Customer | (null) | chat | 18 | name_test |
| 12b2f546 | Test Customer | (null) | chat | 18 | name_test |
| 9117dbad | Test Customer | (null) | chat | 18 | name_test |
| fa688267 | Test Customer | (null) | chat | 11 | name_test |
| 60d808a2 | Test Customer | (null) | chat | 11 | name_test |
| f5c1f1a3 | Test Customer | (null) | chat | 11 | name_test |
| 94054088 | Test Customer | (null) | chat | 11 | name_test |
| 32e2e8f5 | Test Customer | (null) | chat | 11 | name_test |

(Full uuids in `orphans-output.json` under `delete_recommended_ids`.)

**Cascade impact for the delete-recommended set (verified live, not derived):**

```
messages_to_be_cascade_deleted: 0
conversations_with_dangling_source_pointer_after_delete: 0
```

Deleting all 11 removes 11 rows total (no message rows, no pointer fallout, no audit-log impact since `tasks`/`appointments`/`outbound_log` do not FK conversations).

---

## 4. The 22 test-tagged BUT has messages (HOLD)

Operator's conservative rule: test-tagged rows that have at least one message are evidence of real interaction — preserve them. This bucket is reported for completeness; **no recommendation to touch any of them**.

Notable groupings:
- **Operator's own dev sessions** (5 rows) — `Duane Wells / Duane K. Wells` with `duane.wells@huminic.ai` or phone `4126546500`. Each has 1–8 messages. These are real test-traffic the operator generated. HOLD.
- **AfterHours / Sprint-numbered tests** (12 rows) — `S-1 Test`, `S-1 Tone Test`, `S-3 Coach Test`, `S-4 Recall Test`, `AfterHours TestLead`, etc. Each has 1–2 messages. Sprint-traceable test fixtures. HOLD.
- **WF email test fixtures** (2 rows) — `WF Email Test wf-email-...` with synthetic 555-prefix phones and synthetic-looking email aliases. 1 message each. HOLD by rule.
- **555-prefix synthetic test recipients** (3 rows) — `Test Probe`, `Test Caller`. 1 message each. HOLD by rule.

If the operator wants to widen the deletion criterion to include "test-tagged AND ≤1 message AND created > 30 days ago", that's a separate decision — surfacing as an option but NOT recommending without explicit go.

---

## 5. The 8 "zero messages BUT not test-tagged" (REVIEW — DO NOT auto-delete)

These rows escape the test classifier but also have zero messages. They're genuine empty-start cases. **NOT recommended for deletion without per-row review.**

| short id | customer_name | phone | email | channel | age (d) |
|---|---|---|---|---|---|
| 882cdab6 | Unknown Caller | +18392729080 | (null) | voice | 19 |
| b9fb9009 | Unknown Caller | +18392729080 | (null) | voice | 19 |
| 54684569 | Callback Request | +14804618789 | (empty) | voice | 12 |
| 4915fc89 | Unknown Caller | **+15550000001** | (null) | voice | 10 |
| f2f1537b | Victoria Cage | (null) | victoria@misscommunicationconsulting.com | ai-chat | 9 |
| 8305b5b6 | Shelby Dew | (null) | sdew@serrahonda.net | ai-chat | 4 |
| f59d0587 | Shelby Dew | (null) | sdew@serrahonda.net | ai-assistant | 4 |
| 20570ba2 | Shelby Dew | (null) | sdew@serrahonda.net | ai-assistant | 4 |

**Subgroup analysis:**

- **3 voice calls labeled "Unknown Caller" / "Callback Request"** with real-looking area codes (839, 480, 555). These look like inbound calls where a conversation row was created but the message-thread never populated. Could be: ringing-only / hangup, voice-transcription failure, or a code path that creates the row before the first transcript chunk arrives. One (`4915fc89`) has phone `+15550000001` — that's a NPA-555 number which my NXX-555 classifier missed; arguably also a synthetic test number, but kept conservative.
- **`Victoria Cage` (1 row)** — per `decisions.md` entry 2026-04-26: `@misscommunicationconsulting.com` users are real, intentional. Likely an ai-chat session that opened but produced no messages. **DO NOT DELETE without operator confirmation** — even though it has zero messages, deleting a real human's row could be visible to that person on next login.
- **`Shelby Dew` (3 duplicate rows)** — same email `sdew@serrahonda.net` (real Serra Honda staff). Three rows created within ~5 minutes (`13:52:35`, `13:57:10.289`, `13:57:10.290` — last two within 1ms of each other on different channels: `ai-chat` vs `ai-assistant`). Looks like an init-loop or duplicate-create bug at conversation-create time. Real user; HOLD pending operator decision on whether to dedupe.

**Recommendation: NONE of these 8 are auto-deletable. They need either (a) per-row operator review, or (b) a separate "voice-call-with-no-thread" cleanup workflow that's outside this archaeology's scope.**

---

## 6. Classifier rules used (transparency)

```
test_name_regex: \btest\b|testlane|test customer|test user
operator_phones: ["+14126546500", "14126546500", "4126546500"]
operator_emails: ["duane.wells@huminic.ai", "duanewells@icloud.com", "duanekwells@gmail.com"]
phone_555_rule: After stripping non-digits, take last 10 (NANP local).
                Central-office code (positions 4-6) === '555'.
```

**One known classifier limitation** surfaced during analysis: the 555-rule matches **NXX position only** (`(NPA) 555-XXXX` is matched only when 555 sits in the central-office position, e.g. `412-555-0199`). It does NOT match phones where 555 sits in the **NPA position** (e.g. `+15550000001` = `NPA=555 NXX=000`). The "review" bucket exposed `4915fc89` as such a case. If the operator wants 555 in either position to count as test, the rule can be widened — but that broadens the delete net and warrants explicit greenlight.

---

## 7. Recommended approach

**Per-row preview + operator approval, mirroring the Priority 8 / Path B workflow that just succeeded.**

Concretely:

1. **Step 1 (preview, read-only)** — produce `evidence/orphan-teambox-2026-04-26/delete-preview-2026-04-26.json` with:
   - The exact 11 ids in scope (or a subset if operator narrows).
   - A pre-delete SELECT showing every column of every row.
   - A pre-delete count for `messages WHERE conversation_id IN ($1...)` — must be 0.
   - A pre-delete count for `conversations WHERE source_conversation_id IN ($1...)` — must be 0.
   - The exact DELETE statement that would execute.
   - A delta table of expected row-count change (84 → 73).

2. **Step 2 (execute, transaction-wrapped)** — only if the preview matches the archaeology AND the operator gives explicit go:
   - Single `DELETE FROM conversations WHERE id = ANY($1::uuid[])` inside a transaction.
   - Defense-in-depth assertion checks before COMMIT (each id still matches the delete-recommended bucket criteria; total affected rows == 11; messages cascaded == 0; soft-pointers dangled == 0).
   - ROLLBACK on any assertion failure.
   - Output: `evidence/orphan-teambox-2026-04-26/delete-result-2026-04-26.json`.

3. **Step 3 (verification)** — re-run the orphans probe; confirm the delete-recommended bucket is now 0 and total org row count is 84 - 11 = 73.

4. **Step 4 (issues.md follow-ups)** — record three discovered issues:
   - **Issue A (test-data hygiene):** the `Test Customer` rows are produced by something — likely the widget-landing page or a chat-init code path that creates a row before the user types anything. Track as a backlog item to investigate WHERE these are originating so future test sessions don't keep accumulating them.
   - **Issue B (Shelby Dew duplicate)**: the 3 rows created within milliseconds suggest a conversation-create race or duplicate-init in the ai-chat / ai-assistant flow. Worth tracing the create call site.
   - **Issue C (voice-without-thread)**: the 4 voice-channel rows with zero messages indicate the voice integration creates a conversation row before/independent of any message — needs a separate evidence pass to determine whether those should be cleaned up by a different rule (e.g. "voice with no messages and age > 30 days").

---

## 8. STOP point — operator approval required for ANY DB write

Per `CLAUDE.md` Action Classification, any DB DELETE on `conversations` requires explicit operator "go". I am NOT executing the DELETE. I am surfacing it.

**Awaiting operator decision on:**

| Decision | Effect |
|---|---|
| GO Path A: delete the 11 | I produce per-row preview, you eyeball, you say "execute", I run the single DELETE inside a transaction. |
| GO narrowed list | Operator drops/keeps specific ids from the 11; same preview-then-execute workflow on the narrower set. |
| GO + extend to "voice with 0 msgs ≥ 30d old" | I extend the classifier and re-preview; same preview-then-execute. |
| HOLD | Leave the 11 in place. I record findings + the three derived issues in `issues.md` and move on. |

**Hard rule: I will not delete the 8 "review" rows without explicit per-row operator approval.** Three of those rows are real Serra Honda users (Victoria Cage + Shelby Dew x3); deletion would be visible to them.

---

## 9. What this archaeology did NOT do

- No DB writes (no DELETE, no UPDATE).
- No code changes.
- No production deploy.
- No deletion of the 22 test-tagged-with-messages rows (they have real interaction evidence).
- No automated cleanup of the 8 review-bucket rows (3 are real humans, 4 are voice-channel edge cases that need a separate analysis).
- No widening of the 555 phone-classifier rule (limited to NXX-555; NPA-555 not matched). Operator can widen if desired.

---

**End of archaeology. Awaiting operator decision.**
