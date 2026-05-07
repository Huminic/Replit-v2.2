# Drift-Detector Verdict — Wave 2A-T (Trigger Provider Proof)

**Verdict:** NO DRIFT

**Date:** 2026-05-07
**Auditor:** drift-detector (isolated audit subagent)
**Scope audited:** plan.md Wave 2A row, wave-bookend.md OPENING (this wave),
chunk-T1 (`bed5c4b` script + `b6dfe1a` evidence), chunk-T2 (`3e977dc` script +
`7f1a997` evidence), chunk-T1/blocker-finding.md, chunk-T2/blocker-finding.md.
Files actually modified across all 4 commits: `server/test-trigger-2A.ts`,
`evidence/wave-2A-trigger-provider-proof/chunk-T1/proof.md`,
`evidence/wave-2A-trigger-provider-proof/chunk-T2/proof.md` (plus the
mid-revision evidence in `c60907b`).

---

## Findings against the 7 drift categories

### 1. Mid-wave revision discipline — PASS

Two revisions occurred during this wave; both are explicitly documented in the
wave-bookend OPENING with named MID-WAVE REVISION headers and traceback to the
blocker findings:

- **Revision 1 (original-spec → processOutboundSend):** `wave-bookend.md:7-13`
  records "MID-WAVE REVISION 2026-05-07 (~16:30 UTC)" with the four blockers
  enumerated and the pivot reasoning. Sourced from
  `chunk-T1/blocker-finding.md` (committed in `c60907b` BEFORE T1 work began).
- **Revision 2 (email-ratification → VAPI; misnamed-helper → Elliott→Nancy):**
  `wave-bookend.md:17` records "T2 (revised twice)" with explicit reasons —
  Resend already proven in Wave 1C, VAPI not yet proven, agent-to-agent uses
  Elliott (allowlisted) per allowlist. The second leg of revision 2 (helper
  pivot to Elliott→Nancy after the misnamed-helper blocker) is documented in
  `chunk-T2/blocker-finding.md` and ratified in `chunk-T2/proof.md:104-111`
  ("Mental-model correction").

No silent scope change observed. Each revision has a blocker-finding artifact
preceding the scope change.

### 2. Wave 2A scope — PASS

Original plan.md row (line 55): `2A | 10 | Trigger 1 / Trigger 2 /
service-campaign / webhook provider proof | queued`. This wave shipped 2 of 4.

Wave-bookend `wave-bookend.md:5,26-30` explicitly splits Wave 2A into:
- **Wave 2A-T (this wave):** Trigger 1 + Trigger 2
- **Wave 2A-B (queued, future session):** Service Campaign + Webhooks

Service Campaign and Webhook provider-proof items are explicitly parked, not
silently abandoned. The Out-of-scope block (`wave-bookend.md:88-96`) restates
this: "Service Campaign provider proof — Wave 2A-B" / "Webhook (inbound)
proof — Wave 2A-B".

### 3. Trigger-logic-proof gap — PASS

Original goal was end-to-end trigger-logic proof; actual delivery is direct
outbound provider proof (different scope). The gap is explicitly carried as a
follow-up wave:

- `wave-bookend.md:13`: "park trigger-conditional-logic proof for a future
  Wave 2A-Pure-Triggers. The trigger-logic future wave needs: (a) export
  approval for trigger evaluator functions, (b) test-rig that either mocks
  business-hours clock or safely scopes runTriggerEvaluation to one org only."
- `wave-bookend.md:18`: "Trigger-logic proof — deferred to future Wave
  2A-Pure-Triggers"
- `chunk-T1/blocker-finding.md:30`: "Trigger-conditional-logic proof is queued
  as future Wave 2A-Pure-Triggers (needs export approval + business-hours
  mocking). Documented as a v2.2 follow-up."
- `chunk-T1/proof.md:11-12`: "the trigger-conditional-logic proof
  (after-hours / 15-min check-in) is deferred to a future Wave
  2A-Pure-Triggers per the revised scope."

Clearly named, clearly deferred, prerequisites enumerated. No drift.

Note (not drift, but a transparency gap): plan.md's Wave roadmap table
(`plan.md:51-65`) has not yet been amended to add Wave 2A-T, Wave 2A-B, or
Wave 2A-Pure-Triggers as explicit rows. Plan.md still shows the original Wave
2A row only. This is a documentation lag that the wave CLOSING should either
update or surface as a follow-up; it is not silent abandonment because the
wave-bookend records the intent unambiguously.

### 4. Phase-level drift — PASS

Wave 2A-T is bound to Phase 7 (Service) + Phase 10 (Background Workflows) per
`wave-bookend.md:19`. The diff `c60907b..7f1a997` modified only:

- `server/test-trigger-2A.ts` (test-lane invocation script, NEW)
- `evidence/wave-2A-trigger-provider-proof/chunk-T1/proof.md`
- `evidence/wave-2A-trigger-provider-proof/chunk-T2/proof.md`

(Plus the mid-revision evidence files added in `c60907b`.)

Zero touches to:
- Phase 1 (auth) — no `server/auth.ts`, no `shared/schema.ts`, no
  `server/storage.ts` writes
- Phase 3 (TeamBox) — no `client/src/pages/teambox/*`, no
  `client/src/components/teambox/*`
- Phase 5 (Insights) — no `server/services/insights*`, no
  `client/src/pages/insights/*`
- Phase 6 (Marketing) — no marketing files
- Phase 9 (Management) — no settings/management files

No phase-level drift.

### 5. Allowlist gap — PASS

`chunk-T2/proof.md:86-102` ("Allowlist gap (surfaced for follow-up)")
explicitly surfaces:
- Nancy's phone (`+19014361271`) is NOT in `.claude/state/test-recipients.txt`
- Nancy's assistant ID (`c777f029-8c4c-4a23-98e4-3adfd4112a61`) is NOT in the
  allowlist
- Operator's verbal in-chat authorization covered this dispatch only
- Recommended additions are spelled out verbatim for operator action

This is exactly what CLAUDE.md "Explicit over implicit" requires — gap
surfaced, not silently filled. Operator action recommended, not taken.

### 6. 2-SMS T1 discipline — PASS

`chunk-T1/proof.md:120-132` ("Discipline disclosure (TRUTH OVER COMPLIANCE)")
fully discloses:
- Spec specified "Exactly 1 SMS sent"; 2 SMS were actually sent
- Reason: redundant re-invocation to capture exit code
- Halt-condition checklist row 4 marks **FAIL — see disclosure** rather than
  hiding it: `chunk-T1/proof.md:108`
- Mitigation enumerated (no customer leakage, both to allowlist, billing-row
  side effects called out)
- Recommendation for future invocations included

This is a model honest-recovery disclosure. Not papered over. The wave-bookend
revision 2 (`wave-bookend.md`) note also calls this discipline issue forward as
"DO NOT REPEAT THIS PATTERN" guidance for T2, and T2 explicitly ran exactly
once (`chunk-T2/proof.md:14-19,71`).

### 7. Anomaly tagging — PASS

Two architectural findings are surfaced for follow-up:

- **`outbound_log` lacks `provider_message_id`:** `chunk-T1/proof.md:66-72`
  documents that the schema (`shared/schema.ts:235-251`) has no
  `provider_message_id` column, so the TextMagic id is only available via
  stdout from `sendSmsRaw`. Captured the id (`1406916679`) from stdout and
  noted the schema gap explicitly.
- **`processOutboundSend` does not write to `activity_log`:**
  `chunk-T1/proof.md:91-99` documents that the success path writes
  `outbound_log` + `usage_events` + billing emit only — no `activity_log`
  row — and explains this is expected (activity_log is written by
  trigger-evaluator and other higher-level flows, not the outbound primitive).

Both anomalies are surfaced in the proof, with code-line references, framed as
forensic findings rather than failures. Not flagged as issues.md entries
(none needed for this wave; these are factual schema/architecture observations,
not new debt) — but they would feed into future Wave 2A-Pure-Triggers scoping.

---

## Summary

NO DRIFT. The wave executed two mid-wave revisions and documented both with
named blocker-findings preceding the bookend scope change. The wave shipped
2 of the 4 original Wave 2A items (T1 SMS, T2 VAPI) and explicitly parked the
other two as Wave 2A-B; the original trigger-logic-proof goal is explicitly
deferred to a named future Wave 2A-Pure-Triggers with prerequisites
enumerated. Phase-level scope held to Phase 7 + Phase 10 (only file modified
outside evidence/ is the test-lane-only `server/test-trigger-2A.ts`). The
allowlist gap (Nancy), the 2-SMS T1 discipline issue, and the architectural
anomalies (`outbound_log` schema, `processOutboundSend` audit-trail shape)
are all transparently surfaced for operator follow-up. The only documentation
lag observed is that plan.md's Wave roadmap table (`plan.md:51-65`) has not
yet been amended to reflect the de-facto split into 2A-T / 2A-B /
2A-Pure-Triggers — recommended for the wave CLOSING to either update or carry
forward as an issues.md entry, but this is housekeeping, not drift.
