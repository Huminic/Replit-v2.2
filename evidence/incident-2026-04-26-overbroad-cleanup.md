# Incident — 2026-04-26 Over-broad Serra Honda Conversation Cleanup

**Status:** RESOLVED — accepted loss; data retention policy corrected.
**Operator decision recorded:** 2026-04-27.
**Recovery action taken:** none. No restore. No PITR.

---

## 1. One-paragraph summary

On 2026-04-26 at ~16:20 UTC, commit `831bbc2` deleted all 84 conversation rows for Serra Honda, cascading 176 message rows. The deletion was authorized under a data-retention rule recorded that same day ("only real customer data and real users need to be preserved; everything else deletable"). On 2026-04-27 the operator corrected the rule, identifying that dev and live share the same Supabase database and several integrations (VIN Solutions, weekly reports, VAPI inbound voice) are LIVE writing real data. Re-classifying the 84 deleted rows under the corrected policy showed that **47 of 84 rows should have been preserved** (20 PRESERVE_REAL_OR_INTEGRATION + 27 REVIEW_UNKNOWN); the remaining 37 were correctly DELETE_PROVEN_TEST. The 51 message rows under the PRESERVE bucket are irrecoverable from saved evidence (the preview JSON captured conversation columns but not message bodies). The operator chose to accept the loss rather than pursue a Supabase point-in-time recovery, and to move forward with the corrected policy.

---

## 2. Timeline

| When (UTC) | What | Commit |
|---|---|---|
| 2026-04-26 ~16:20 | Path B archive of stuck "Service Reminder - February" campaign — single UPDATE, transaction-wrapped, scoped to one campaign id. | `2580223` |
| 2026-04-26 ~10:44 | Read-only orphan-conversations archaeology for Serra Honda. Identified 11 "Test Customer / 0 messages" rows + 22 test-tagged-with-messages + 8 review + 43 real-with-messages buckets under the original (narrower 555-NXX) classifier. | `e62f784` |
| 2026-04-26 ~16:07 | Re-classification of all 84 Serra Honda conversations under operator's then-stated rule ("real with data" only). Surfaced 2 false-negatives in keep set (S-1 Multi-turn / WF-SvcAgent-...) and decision-gate STOP. | (preview only — no commit) |
| 2026-04-26 ~16:18 | After operator clarification "any data in there is test", full Serra Honda preview built and Step 3 executed: DELETE FROM conversations WHERE organization_id = $1; 84 conversations + 176 cascade messages removed. Users table verified unchanged (29 → 29 global, 13 → 13 Serra Honda). | `831bbc2` |
| 2026-04-26 ~23:35 | Multi-org delete preview built (89 conversations + 91 messages across the other 6 orgs). Decision gate: STOP — preview drift surfaced (+5 rows since the 16:19 summary); held for operator review. | (preview only — no commit; multi-org delete never executed) |
| 2026-04-27 | Operator corrected the data retention rule. Recorded in `decisions.md` (2026-04-27 row, supersedes 2026-04-26 row) and in private memory `feedback_data_retention_rule.md` (CORRECTED 2026-04-27 entry, supersedes prior). | (operator-authored) |
| 2026-04-27 | Read-only re-classification of the 84 deleted Serra Honda rows under the corrected 3-bucket policy. 20 PRESERVE / 27 REVIEW / 37 DELETE-correct. Restore plan with 4 branches written; recommendation B (PITR) then C (skeleton-only fallback). | `94126fe` |
| 2026-04-27 | Operator decision: accept loss; no restore; no PITR. | (this commit) |

---

## 3. Two policy versions

### 3a. 2026-04-26 (superseded)

> In Nexxus, the only data that needs to be preserved is **real customer data and real users**. Everything else (test rows, orphan rows, demo seed data, abandoned states) can be deleted during cleanup work. Real users with zero data are deletable per the "real with data" criterion (e.g., a duplicate row from a chat-init race bug should be deleted; the underlying bug is tracked separately).

This rule was made operational by the verifier-supported workflow (preview → operator confirm → transaction-wrapped execute → verify; users table never touched). Under that rule, the cleanup of 84 Serra Honda conversation rows was internally consistent and approved.

### 3b. 2026-04-27 (current — corrects 3a)

> dev and live share the same Supabase database. Treat all database state as shared/production-like. NO org-level broad deletes. Each candidate row classified as PRESERVE_REAL_OR_INTEGRATION / DELETE_PROVEN_TEST / REVIEW_UNKNOWN. Only DELETE_PROVEN_TEST may be deleted.

Integration-status table is the operative reference (VIN Solutions LIVE, Weekly Reports LIVE, VAPI inbound ACTIVE, Tavus / TextMagic / Service Campaigns / Outbound Triggers — classify before delete).

**Why the prior rule was wrong:** the operator's earlier "users aren't using the system" framing was about *dashboard logins by dealership users* (who hadn't yet started using the app pre-launch). It was misread by the agent + operator + verifiers as "the database holds no real data". In fact several integrations were already writing real data into that same shared dev/live DB:

- **VIN Solutions** sync producing the warehouse_leads metrics dealers actually see in weekly reports.
- **Weekly Reports** (sent by the weekly-report scheduler) — dealers receive these and have been receiving them.
- **VAPI inbound voice** — accepting calls and writing conversation+messages rows with real transcripts.

The prior policy treated all conversation data as disposable on the basis of "no dashboard logins yet". The corrected policy recognizes that integration-driven data writes occur whether or not dashboard logins have started.

---

## 4. Counts by bucket (re-classification under corrected policy)

| bucket | conversations | cascaded messages |
|---|---|---|
| **PRESERVE_REAL_OR_INTEGRATION** (delete was wrong) | **20** | **51** |
| **REVIEW_UNKNOWN** (operator decision) | **27** | **73** |
| DELETE_PROVEN_TEST (delete was correct) | 37 | 52 |
| TOTAL | 84 | 176 |

PRESERVE breakdown:

- **7 VAPI inbound voice rows** with non-test phones (NPAs 205, 480, 839, 901, 202). 205 is Birmingham AL, where Serra Honda is located. The 839 caller appears 3 times in one day — strong real-customer signal. The 480 caller appears in both PRESERVE (with transcript) and REVIEW (without transcript) — the same caller hit the I-NEW-2026-04-26-D bug on one attempt and got captured on another.
- **12 internal-staff dashboard sessions** with `huminic.ai` / `serrahonda.com` / `serrahonda.net` / `cageautomotive.com` / `misscommunicationconsulting.com` emails. Includes an 18-message Serra Honda Admin thread and a 7-message Victoria Whitley thread.
- **1 real-looking external email row** (`steph.t@email.com`, 2 messages).

REVIEW breakdown (notable):

- **9cab0023 — `18338096836` SMS, 37 messages** — that phone matches `DEFAULT_TEXTMAGIC_PHONE` (`server/services/scheduler.ts:13`). System artifact, not a customer; almost certainly DELETE_PROVEN_TEST under operator judgment.
- **15 SMS rows to real-looking US phones** (412/541/256/601/859/205 area codes, real-looking customer names). Per the corrected policy, "TextMagic / SMS — NOT in customer use yet; only test numbers should appear." If these were actual sends to real customers, that is a separate compliance issue tracked as `I-NEW-2026-04-27-SMS-AUDIT`.
- **3 voice rows with 0 messages** matching the same phones as PRESERVE rows — same callers hitting the I-NEW-2026-04-26-D bug on first attempt.
- **4 Website Visitor anonymous chat rows** (no identity to disambiguate).
- **3 Shelby Dew + 1 Victoria Cage** with 0 messages — duplicate-init artifacts of `I-NEW-2026-04-26-C`.

---

## 5. Snapshot integrity gap

The pre-deletion preview captured the 84 conversation rows with all conversation columns, but did NOT capture the 176 individual message rows. The DELETE was `DELETE FROM conversations WHERE organization_id = $1` which CASCADE-deleted messages via `messages.conversation_id ON DELETE CASCADE`. Those rows are gone from the database AND not present in saved evidence.

A skeleton restore from this snapshot alone would:
- Re-create 47 conversation rows (20 PRESERVE + 27 REVIEW) with `customer_name`, `customer_phone`, `customer_email`, `channel`, `created_at` etc. preserved.
- NOT recover the 51 PRESERVE message rows (transcripts, threads, content).
- Display the original 18-message Serra Honda Admin thread as a 0-message empty conversation (visibly wrong state).

This gap is itself a lesson: any cleanup snapshot intended to support a possible restore must capture cascade-table rows in full, not just the per-row count.

---

## 6. Recovery decision

**Operator chose: accept loss; no restore; no PITR.**

Operator rationale:

> Pre-launch dashboard users were not relying on these rows. Recent provider-side records remain available from VAPI/Resend/third-party tools. Skeleton restore without message bodies would create misleading empty conversations. PITR/full restore not worth downtime/risk unless exact in-app history becomes necessary.
>
> The real problem was not the lost rows; it was discovering that the cleanup policy was based on the wrong mental model. Now that the model is corrected, I'd move forward rather than burn time trying to perfectly reconstruct pre-launch history.

What this means in practice:

- 7 VAPI inbound voice transcripts are gone from the in-app DB. Recent calls that matter can be re-pulled from VAPI provider logs. Operator does not consider this a customer-facing problem pre-launch.
- The 18-message Serra Honda Admin thread and 7-message Victoria Whitley thread are gone. These were dashboard testing threads; operator considers their loss tolerable.
- The 15 SMS rows with real-looking phones are gone. The audit question (whether real customers received pre-launch SMS) is tracked separately under `I-NEW-2026-04-27-SMS-AUDIT`.

---

## 7. Acknowledgment of process

The cleanup as executed (`831bbc2`) was scoped per the prior (now superseded) operator-stated rule and verified clean by independent verifiers under that rule. Specifically:

- The 2026-04-26 preview-then-execute discipline (Step 1 → Step 2 → Step 3 → Step 4) was followed.
- Defense-in-depth assertions ran in-transaction before COMMIT.
- The users table was confirmed unchanged before/after.
- `scope-guardian` returned PASS, `code-reviewer` returned APPROVE under the then-current policy.

**The corrective surface here is the policy itself, not the verifier discipline.** The verifiers and harness checked everything they were configured to check. What no verifier could have caught was the gap between the operator's stated rule and the live-integration reality of the database. That detection requires a separate kind of verification — environment-state evidence that grounds policy assertions against ground truth before they become operative — which the corrected 2026-04-27 policy now requires (the integration-status table forces that grounding).

---

## 8. Lessons (formalized into 2026-04-27 policy)

1. **Always verify "live integrations" status before any DB cleanup.** Treat the integration-status table in the corrected policy as the authoritative checklist. Any cleanup proposal must reference each row of that table and explain how its rule respects the integration's current writing-status.

2. **dev/live shared DB ≠ "dev environment data".** When dev and live share a database, operations performed in a "dev" mental frame land on shared production-grade state. The same data-retention rule must apply on both sides.

3. **Snapshot evidence MUST capture cascade-table content, not just the parent.** A pre-deletion snapshot that captures only the conversation columns + a per-row message count is not a restorable snapshot — the message bodies are the real content. Any future cleanup that touches a parent table with CASCADE children must capture the children explicitly.

4. **Operator framing is informative but every cleanup needs row-level evidence-based classification.** A high-level operator rule ("everything except real with data is deletable") is useful for direction, but each candidate row must still be classified against ground-truth signals (integration metadata, FK references, content patterns) before deletion. The 2026-04-27 three-bucket policy makes this discipline explicit: PRESERVE_REAL_OR_INTEGRATION / DELETE_PROVEN_TEST / REVIEW_UNKNOWN, with REVIEW as the conservative default.

5. **Preview drift between probe runs is a signal, not noise.** During the 16:19 → 23:35 multi-org preview window, +5 voice rows landed. They were correctly identified as I-NEW-2026-04-26-D ("voice channel without thread") producing real-time data. That observation was a leading indicator that integration-driven writes were ongoing — a flag that should have re-opened the question of whether the entire cleanup model was sound. Future cleanup workflows should treat preview-drift discoveries as policy-input, not just count-reconciliation.

---

## 9. Forward-facing items

| item | type | status |
|---|---|---|
| Investigate the 15 SMS rows with real-looking phones (compliance/audit question) | OPS | tracked as `I-NEW-2026-04-27-SMS-AUDIT` |
| Fix `I-NEW-2026-04-26-D` (voice channel without thread) | BE | priority bumped 2026-04-27 |
| Fix `I-NEW-2026-04-26-C` (Shelby Dew duplicate-init race) | BE | priority bumped 2026-04-27 |
| Resume Priority 10 (Marketing v2.3 banner) on the launch-critical list | FE | next |

---

## 10. Cross-references

- Pre-deletion snapshot: `evidence/orphan-teambox-2026-04-26/full-serra-honda-delete-preview-2026-04-26.json`
- Execution result: `evidence/orphan-teambox-2026-04-26/full-serra-honda-delete-result-2026-04-26.json`
- Re-classification: `evidence/orphan-teambox-2026-04-26/restore-assessment-2026-04-27.json`
- Restore plan (NOT executed): `evidence/orphan-teambox-2026-04-26/restore-plan-2026-04-27.md`
- Corrected policy: `decisions.md` 2026-04-27 row (supersedes 2026-04-26 row)
- Private memory note: `~/.claude/projects/-home-ubuntu-Claude-store-nexxus2-2-replit/memory/feedback_data_retention_rule.md`
- Commits: `2580223` (archive) → `e62f784` (archaeology) → `831bbc2` (cleanup) → `94126fe` (restore-assessment) → this commit (incident note + accepted loss).

---

**End of incident note.**
