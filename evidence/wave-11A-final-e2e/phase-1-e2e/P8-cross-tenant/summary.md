# P8 — Cross-tenant isolation — PASS

**Verdict:** PASS (Delta 1 UI; Delta 2 via cross-reference)

**What was tested:** Login as `serra_nissan@huminic.ai`; verify "Serra Nissan" header; Active Pipeline=151 (vs serra-honda 180 — different number proves different data scope); TeamBox shows 6 Magnolia-handled conversations only.

**Delta 1 (UI):** `P8-01-serra-nissan-dashboard.png`, `P8-02-serra-nissan-teambox.png`

**Delta 2 (cross-reference):** Wave 9-Sec S1 (I-244 IDOR) qa-evaluator probe at `evidence/wave-9-Sec-triage/post-fix/S1-I-244/delta-2-probe.md` (serra-honda override blocked; returned own org's 649 leads vs serra-nissan's 460 control). Same security mechanism (`server/lib/tenantScope.ts`) enforces isolation in both directions.

**Single-delta note:** P8's UI render proves the LOGIN scope works; the cross-reference to Wave 9-Sec S1 proves the API ENFORCEMENT works. Together: two independent observations of cross-tenant isolation.
