# Cross-Sign: SEC-08
Timestamp: 2026-03-26T17:55:44Z
Sprint: SEC-08

Implementing Role: orchestrator
Reviewing Role: enforcer

SEC-08 implements three issues on widget-landing.tsx:
- I-119: Renamed "Web Call" to "Instant Call Back" with phone number input form replacing browser VAPI call UI. POSTs to /api/widget/voice-callback.
- I-121: Fixed video popup blocker by opening window.open('about:blank') synchronously in click handler, then redirecting after async fetch. Applied to both startVideoChat() and ?mode=video auto-launch.
- I-122: Added deployment comment documenting that changes require deployment.

TypeScript build clean. 12/12 Playwright tests pass. No undeclared files modified.

Verdict: APPROVED
