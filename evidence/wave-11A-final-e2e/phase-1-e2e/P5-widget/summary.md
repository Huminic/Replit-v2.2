# P5 — Widget public entry — PASS

**Verdict:** PASS (full two deltas)

**What was tested:** Widget chat probe via public endpoint → Anthropic-driven Caroline reply (Wave 2B T1 chat); widget form submission → conversation row `07f144a2-b990-40c7-a27f-e152f05b1137` created (Wave 2B T3 form). Allowlisted test recipients only.

**Delta 1 (UI):** `P5-01-widget-chat-anthropic-reply.png`, `P5-02-widget-form-submitted.png`

**Delta 2 (network):** `P5-network.json` — POST /api/widget/chat → 200 and POST /api/widget/contact → 200

**Cross-reference:** Wave 2B closing bookend at `evidence/wave-2B-widget-provider-proof/wave-bookend.md` (T1/T2/T3 chunks PASS).

**Note:** Widget bundle script-loading URL points at live.huminic.app by design. Since dev shares the live DB, persistence is visible on both. Anthropic call is read-only, no real-customer recipient touched.
