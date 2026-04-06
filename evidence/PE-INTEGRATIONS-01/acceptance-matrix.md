# Acceptance Matrix: PE-INTEGRATIONS-01

**Date:** 2026-04-06

---

## Acceptance Criteria to Use Case Mapping

| AC-ID | Criterion | Use Cases | Test Approach | Risk |
|-------|-----------|-----------|---------------|------|
| AC1 | Function map exists for integration surfaces and corresponding Nexxus-visible outcomes | ALL | Document all integration endpoints, MCP tools, data flows, and UI surfaces per provider | LOW |
| AC2 | TextMagic send/receive truth evaluated against TeamBox / message-thread reality | UC-01 to UC-04 | Check outbound_log for recent SMS sends, examine TeamBox SMS conversations for message accuracy, verify STOP handling via blacklist API | MEDIUM |
| AC3 | VAPI flow evaluated for transcript arrival and downstream parsing / visibility | UC-05 to UC-09 | Open recent voice conversations in TeamBox, verify transcript content, check appointment creation on Calendar, verify VIN lead creation via activity logs | HIGH |
| AC4 | Tavus flow evaluated to approved acceptance boundary (popup/initiation or transcript visibility) | UC-10 to UC-11 | Check TeamBox for video conversations with Tavus transcript, verify Tavus widget initiation on frontend if accessible | MEDIUM |
| AC5 | Resend email-related flows evaluated via allowed log evidence and downstream UI truth | UC-12 to UC-13 | Check outbound_log for email entries, verify notification idempotency, check recipient resolution accuracy | MEDIUM |
| AC6 | Any provider-only pass that does not materialize correctly in Nexxus is logged as false-pass | ALL | For each provider send, verify the corresponding Nexxus-side artifact (conversation, message, log entry) exists and is correct | HIGH |
| AC7 | Every executed flow has evidence, commentary, and result status | ALL | Screenshot every flow, document findings, assign PASS/PARTIAL/FAIL | LOW |

---

## Known Cross-Cutting Issues

| Source | Issue | Relevant ACs |
|--------|-------|-------------|
| PE-SERVICE-CAMPAIGNS-01 BUG-01 | No campaign filter in TeamBox -- affects campaign SMS reply visibility | AC2, AC6 |
| PE-SERVICE-CAMPAIGNS-01 BUG-02 | Campaign conversations not visually distinguishable -- affects SMS reply linking verification | AC2, AC6 |
| Operator observation | VAPI leads count may include calls from other orgs sharing same VAPI account | AC3, AC6 |
| Code analysis | Tavus webhook rejects if persona_id not matched -- video sessions from unregistered personas lost | AC4, AC6 |
| Code analysis | Resend has no bounce/delivery callback -- "sent" status is provider-accepted, not delivered | AC5, AC6 |
| Code analysis | VIN lead creation uses `user_confirmed: true` automatically in webhook handler (no human review) | AC6 |

---

## Risk Assessment

| Risk Level | ACs | Notes |
|------------|-----|-------|
| HIGH | AC3, AC6 | VAPI transcript format varies; false-pass detection requires cross-referencing provider and app state |
| MEDIUM | AC2, AC4, AC5 | TextMagic/Tavus/Resend evaluation depends on existing live data or approved send operations |
| LOW | AC1, AC7 | Standard documentation and evidence collection |

---

## Action Boundary Review

| Action | Classification | Approval Required |
|--------|---------------|-------------------|
| Navigate TeamBox, Calendar, Settings pages | SAFE | No |
| Read outbound_log, activity_log via API | SAFE | No |
| Read VAPI calls/assistants via proxy endpoints | SAFE | No |
| Read Tavus conversations/personas via proxy endpoints | SAFE | No |
| Read VIN leads via proxy endpoints | SAFE | No |
| Read SMS blacklist | SAFE | No |
| Send test SMS to real number | IRREVERSIBLE | Explicit operator approval |
| Initiate test VAPI call | IRREVERSIBLE | Explicit operator approval |
| Create test Tavus session | IRREVERSIBLE | Explicit operator approval |
| Send test email via Resend | IRREVERSIBLE | Explicit operator approval |
| Create VIN Solutions lead | IRREVERSIBLE | Explicit operator approval |

---

## Evaluation Mode

Default: **Observation-only** using existing live data. All irreversible provider actions require explicit operator approval before execution. If no existing data is available for a provider, the use case is documented as NOT VERIFIED with a note about what would be needed.
