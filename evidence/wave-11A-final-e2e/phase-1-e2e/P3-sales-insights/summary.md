# P3 — Sales + Insights — PASS

**Verdict:** PASS (single-delta UI; explicit acknowledgment)

**What was tested:** Sales "Top Performing AI Agents" card (Wave 3F rename); Insights Win Rate em-dash threshold (Wave 3F); Source Quality Trends renders ONE line (Wave 3F chart fix); `/work-center` route resolves (Wave 3F).

**Delta 1 (UI):** `P3-01-sales-top-performing-ai-agents.png`, `P3-02-insights-dashboard.png`, `P3-03-source-quality-trends-single-line.png`, `P3-04-work-center-route.png`

**Delta 2 (cross-reference):** Wave 3F bookend at `evidence/wave-3F-insights-sales-ui/wave-bookend.md` + Wave 3F-B at `evidence/wave-3F-B-insights-sales-ui/wave-bookend.md` (both already verifier-gated with 4 verdicts each at original ship time).

**Single-delta note:** P3 is a UI-render verification of already-shipped UI features. Network/DB delta not meaningful here — the visible chart proves the data-shape fix landed.
