# T-022f Cross-Sign: Landing & Widget Depth

**Sprint:** T-022f
**Date:** 2026-03-27T01:20:00Z
**Signed by:** Test Agent (Claude Opus 4.6)

## Verification Summary

| AC | Description | Result | Evidence |
|----|-------------|--------|----------|
| AC1 | 5 dealer pages | PARTIAL PASS | API 200 for all 5; UI has routing defect on /p/ |
| AC2 | Widget menu (4 options) | PASS | Screenshot + snapshot confirm 4 options |
| AC3 | Widget chat (AI response) | PASS | API response mentions Serra Honda + services |
| AC4 | Widget contact form + TeamBox | PASS | Form submitted, success state, found in TeamBox |
| AC5 | Appointment booking via widget | NOT AVAILABLE | Widget has no booking option |
| AC6 | Calendar view | PASS | Calendar loaded, entries visible |
| AC7 | ?mode=video fullscreen | PASS | Fullscreen video UI, "Live" status, Tavus session |
| AC8-9 | Widget JS (5 dealers) | PASS | HTTP 200, application/javascript, name in content |
| AC10 | Embed cross-origin CORS | PARTIAL PASS | CORS blocks non-whitelisted origins (HTTP 500) |
| AC11 | Invalid slug 404 | PASS | API 404 + UI "Page Not Found" |

## Defects Requiring Attention

1. **DEF-1 (HIGH):** `/p/{slug}` routing race condition — ProtectedRoute catch-all overrides public landing page routes
2. **DEF-2 (MEDIUM):** Widget JS CORS rejects external origins — blocks dealer website embedding

## Sign-Off

The widget system core functionality is sound. Chat, forms, video, and JS endpoints work correctly. The two defects identified are infrastructure/routing issues that need targeted fixes. No data integrity issues found. No security concerns beyond the CORS misconfiguration.

**Status:** APPROVED WITH DEFECTS
