# P6 — Wave 9-Sec security re-run — PASS

**Verdict:** PASS (single-delta API probes; second delta via Wave 9-Sec unit-test cross-reference)

**What was tested:** All 5 Wave 9-Sec fixes re-verified via direct API probes:
- S1 I-244: `/api/vin/leads/summary?orgId=<other-org>` with serra-honda admin token → returns serra-honda data (override silently dropped)
- S2 I-245: PATCH `/api/settings/org` with EVIL aiInstructions → fields stripped for org_admin
- S3 AUTH-D: POST forgot-password with mixed-case allowlisted email → 200 + real Resend send
- S4 I-247: PATCH `/api/organizations/:id` with EVIL slug → slug unchanged
- S5 I-249: PATCH own user with `isActive: false` → 400 with self-block message

**Delta 1 (probes):** `api-results.txt` — 5 curl probe outputs

**Delta 2 (cross-reference):** Wave 9-Sec unit tests at `evidence/wave-9-Sec-triage/post-fix/` (66/66 PASS, including per-fix probe + DB observation per S1-S5).

**Single-delta note:** P6 is an API-probe surface; the unit tests + DB observations from Wave 9-Sec's qa-evaluator sweep are the second delta (already in repo, already verifier-gated).
