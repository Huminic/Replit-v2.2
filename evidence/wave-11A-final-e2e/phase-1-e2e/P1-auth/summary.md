# P1 — Auth + session — PASS

**Verdict:** PASS (full two deltas)

**What was tested:** Login as `serra_honda@huminic.ai` (and mixed-case `Serra_Honda@huminic.ai` to verify Wave 9-Sec AUTH-D normalization); hard-refresh session survival (Priority-3 race-fix); lowercase re-login.

**Delta 1 (UI):** `P1-01-dashboard-after-mixedcase-login.png`, `P1-02-after-hardrefresh.png`, `P1-03-after-lowercase-relogin.png`

**Delta 2 (server):** `P1-network-after-login.json` — POST /api/auth/login → 200

**Cross-reference:** Wave 9-Sec S3 (AUTH-D) unit tests at `evidence/wave-9-Sec-triage/post-fix/S3-AUTH-D/`.
