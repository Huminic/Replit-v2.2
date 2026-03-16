# Pre-Execution Report: QA-S16

Timestamp: 2026-03-16T20:14:59Z
Sprint: QA-S16 — Live communication testing

## Tests (Mechanical — dual agent)
T1: Password reset flow (forgot-password → email sent → verify)
T2: TextMagic webhook (POST test payload → verify conversation created in TeamBox)
T3: Tavus widget popup (navigate to /w/demo → verify video popup renders)
T4: Kill switch (toggle communication gate → verify messages blocked)
T5: TeamBox verification (messages from webhook appear in inbox)

## Tests (External — require user involvement)
T6: VAPI inbound call (elliott.ts → agent → transcript → appointment)
T7: Campaign execution (create → execute → SMS delivery)
T8: VAPI outbound trigger

## Status: READY TO TEST (T1-T5 mechanical, T6-T8 deferred)
